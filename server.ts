import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import { Pool, PoolClient } from 'pg';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config();

const app = express();

function getPort(): number {
  const portArgIndex = process.argv.indexOf('--port');
  if (portArgIndex !== -1 && process.argv[portArgIndex + 1]) {
    return parseInt(process.argv[portArgIndex + 1], 10);
  }
  if (process.env.APP_PORT) {
    return parseInt(process.env.APP_PORT, 10);
  }
  if (process.env.PORT && process.env.PORT !== '8080') {
    return parseInt(process.env.PORT, 10);
  }
  return 3000;
}

const PORT = getPort();
const isProd = process.env.NODE_ENV === 'production';

app.use(express.json({ limit: '10mb' }));

// دریافت رشته اتصال از Secrets یا متغیرهای محیطی
let customRuntimeConnectionString: string | null = null;

export const getActiveConnectionString = (): { connectionString: string | null; source: string } => {
  if (customRuntimeConnectionString && customRuntimeConnectionString.trim()) {
    return { connectionString: customRuntimeConnectionString.trim(), source: 'custom_runtime' };
  }
  if (process.env.DATABASE_URL && process.env.DATABASE_URL.trim()) {
    return { connectionString: process.env.DATABASE_URL.trim(), source: 'DATABASE_URL (Secret/Env)' };
  }
  if (process.env.SUPABASE_DATABASE_URL && process.env.SUPABASE_DATABASE_URL.trim()) {
    return { connectionString: process.env.SUPABASE_DATABASE_URL.trim(), source: 'SUPABASE_DATABASE_URL (Secret)' };
  }
  if (process.env.SUPABASE_CONNECTION_STRING && process.env.SUPABASE_CONNECTION_STRING.trim()) {
    return { connectionString: process.env.SUPABASE_CONNECTION_STRING.trim(), source: 'SUPABASE_CONNECTION_STRING (Secret)' };
  }
  if (process.env.POSTGRES_URL && process.env.POSTGRES_URL.trim()) {
    return { connectionString: process.env.POSTGRES_URL.trim(), source: 'POSTGRES_URL (Secret/Env)' };
  }
  return { connectionString: null, source: 'none' };
};

// ساخت استخر اتصال PostgreSQL با مدیریت هوشمند SSL برای Supabase
const createPgPool = (connectionString: string): Pool => {
  const isSupabaseOrCloud = 
    connectionString.includes('supabase.co') || 
    connectionString.includes('pooler.supabase.com') ||
    connectionString.includes('sslmode=require') ||
    !connectionString.includes('localhost') && !connectionString.includes('127.0.0.1');

  return new Pool({
    connectionString,
    ssl: isSupabaseOrCloud ? { rejectUnauthorized: false } : undefined,
    connectionTimeoutMillis: 10000,
    idleTimeoutMillis: 30000,
    max: 10,
  });
};

let currentPool: Pool | null = null;
let currentPoolConnStr: string | null = null;

const getPool = (): { pool: Pool | null; source: string; connectionString: string | null } => {
  const { connectionString, source } = getActiveConnectionString();
  if (!connectionString) {
    if (currentPool) {
      currentPool.end().catch(() => {});
      currentPool = null;
      currentPoolConnStr = null;
    }
    return { pool: null, source, connectionString: null };
  }

  if (currentPool && currentPoolConnStr === connectionString) {
    return { pool: currentPool, source, connectionString };
  }

  if (currentPool) {
    currentPool.end().catch(() => {});
  }

  currentPool = createPgPool(connectionString);
  currentPoolConnStr = connectionString;
  return { pool: currentPool, source, connectionString };
};

// ماسک کردن رمز عبور در رشته اتصال جهت نمایش امن در رابط کاربری
const maskConnectionString = (str: string | null): string => {
  if (!str) return '';
  return str.replace(/:([^:@]+)@/, ':••••••••@');
};

// استخراج اطلاعات کاربردی از رشته اتصال Supabase
const parseConnectionStringDetails = (str: string | null) => {
  if (!str) return { isSupabase: false, projectRef: null, host: null, database: null };
  try {
    const isSupabase = str.includes('supabase.co') || str.includes('pooler.supabase.com');
    let projectRef: string | null = null;
    let host: string | null = null;
    let database: string | null = null;

    const urlMatch = str.match(/@([^:/]+)(?::(\d+))?\/([^?]+)/);
    if (urlMatch) {
      host = urlMatch[1];
      database = urlMatch[3];
    }

    if (isSupabase) {
      const refMatch1 = str.match(/postgres\.([a-z0-9]+):/i);
      const refMatch2 = str.match(/db\.([a-z0-9]+)\.supabase\.co/i);
      if (refMatch1) projectRef = refMatch1[1];
      else if (refMatch2) projectRef = refMatch2[1];
    }

    return { isSupabase, projectRef, host, database };
  } catch {
    return { isSupabase: false, projectRef: null, host: null, database: null };
  }
};

// -------------------------------------------------------------
// مسیرهای API دیتابیس (Database Connection & Operations API)
// -------------------------------------------------------------

// ۱. بررسی وضعیت اتصال به پایگاه داده
app.get('/api/db/status', async (req: Request, res: Response) => {
  const { pool, source, connectionString } = getPool();
  const parsed = parseConnectionStringDetails(connectionString);

  if (!pool || !connectionString) {
    return res.json({
      configured: false,
      source: 'none',
      message: 'رشته اتصال (DATABASE_URL) در بخش Secrets یا تنظیمات تعریف نشده است.',
      maskedConnectionString: '',
      isSupabase: false,
      connected: false,
      tables: [],
    });
  }

  const start = Date.now();
  try {
    const client = await pool.connect();
    let pgVersion = 'PostgreSQL';
    try {
      const verRes = await client.query('SELECT version()');
      pgVersion = verRes.rows[0]?.version || 'PostgreSQL';
    } catch {}

    // بررسی وجود جداول سامانه مسکن‌یار
    const requiredTables = [
      'cooperatives', 'users', 'memberships', 'units', 
      'installment_plans', 'installment_items', 'payments', 
      'receipts', 'announcements', 'audit_logs', 'monthly_fees'
    ];

    const tablesQuery = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = ANY($1::text[])
    `, [requiredTables]);

    const existingTableNames = new Set(tablesQuery.rows.map(r => r.table_name));

    // دریافت تعداد ردیف‌های هر جدول
    const tableDetails: { name: string; exists: boolean; count: number }[] = [];
    for (const tbl of requiredTables) {
      const exists = existingTableNames.has(tbl);
      let count = 0;
      if (exists) {
        try {
          const countRes = await client.query(`SELECT COUNT(*)::int as count FROM "${tbl}"`);
          count = countRes.rows[0]?.count || 0;
        } catch {}
      }
      tableDetails.push({ name: tbl, exists, count });
    }

    client.release();
    const latencyMs = Date.now() - start;

    return res.json({
      configured: true,
      source,
      connected: true,
      latencyMs,
      pgVersion,
      isSupabase: parsed.isSupabase,
      projectRef: parsed.projectRef,
      host: parsed.host,
      database: parsed.database,
      maskedConnectionString: maskConnectionString(connectionString),
      tables: tableDetails,
      message: 'اتصال به پایگاه داده با موفقیت برقرار شد.',
    });
  } catch (err: any) {
    const latencyMs = Date.now() - start;
    return res.json({
      configured: true,
      source,
      connected: false,
      latencyMs,
      isSupabase: parsed.isSupabase,
      projectRef: parsed.projectRef,
      host: parsed.host,
      database: parsed.database,
      maskedConnectionString: maskConnectionString(connectionString),
      error: err.message,
      message: `خطا در برقراری اتصال با دیتابیس: ${err.message}`,
      tables: [],
    });
  }
});

// ۲. تست رشته اتصال ارسالی توسط کاربر
app.post('/api/db/test', async (req: Request, res: Response) => {
  const testConnStr = req.body?.connectionString || getActiveConnectionString().connectionString;
  if (!testConnStr) {
    return res.status(400).json({
      success: false,
      message: 'هیچ رشته اتصالی جهت تست مشخص نشده است.',
    });
  }

  const parsed = parseConnectionStringDetails(testConnStr);
  const testPool = createPgPool(testConnStr);
  const start = Date.now();

  try {
    const client = await testPool.connect();
    const verRes = await client.query('SELECT version(), NOW() as now');
    const latencyMs = Date.now() - start;
    const pgVersion = verRes.rows[0]?.version || 'PostgreSQL';

    // بررسی وجود جداول
    const checkTables = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('cooperatives', 'users', 'memberships')
    `);

    client.release();
    await testPool.end();

    const existing = checkTables.rows.map(r => r.table_name);
    const tablesReady = existing.length === 3;

    return res.json({
      success: true,
      latencyMs,
      pgVersion,
      isSupabase: parsed.isSupabase,
      projectRef: parsed.projectRef,
      host: parsed.host,
      tablesReady,
      existingTables: existing,
      message: `اتصال به پایگاه داده ${parsed.isSupabase ? 'Supabase' : 'PostgreSQL'} با موفقیت برقرار شد (تاخیر: ${latencyMs}ms).`,
    });
  } catch (err: any) {
    await testPool.end().catch(() => {});
    return res.status(400).json({
      success: false,
      error: err.message,
      message: `خطا در اتصال به پایگاه داده: ${err.message}`,
    });
  }
});

// ۳. ذخیره یا حذف رشته اتصال موقت در حافظه برنامه
app.post('/api/db/set-connection', (req: Request, res: Response) => {
  const { connectionString, clear } = req.body;
  if (clear) {
    customRuntimeConnectionString = null;
    if (currentPool) {
      currentPool.end().catch(() => {});
      currentPool = null;
      currentPoolConnStr = null;
    }
    return res.json({ success: true, message: 'تنظیمات موقت پاکسازی شد.' });
  }

  if (connectionString && typeof connectionString === 'string') {
    customRuntimeConnectionString = connectionString.trim();
    if (currentPool) {
      currentPool.end().catch(() => {});
      currentPool = null;
      currentPoolConnStr = null;
    }
    return res.json({ success: true, message: 'رشته اتصال با موفقیت ثبت شد.' });
  }

  return res.status(400).json({ success: false, message: 'رشته اتصال نامعتبر است.' });
});

// ۴. اجرای مهاجرت خودکار ساخت جداول (Auto-Migrate) روی دیتابیس با ۱ کلیک
app.post('/api/db/migrate', async (req: Request, res: Response) => {
  const { pool, connectionString } = getPool();
  if (!pool || !connectionString) {
    return res.status(400).json({
      success: false,
      message: 'رشته اتصال دیتابیس در Secrets موجود نیست.',
    });
  }

  try {
    const sqlFilePath = path.join(process.cwd(), 'src', 'db', 'complete_migration.sql');
    if (!fs.existsSync(sqlFilePath)) {
      return res.status(500).json({
        success: false,
        message: 'فایل کامل اسکریپت مایگریشن (complete_migration.sql) یافت نشد.',
      });
    }

    const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');
    const client = await pool.connect();
    
    try {
      await client.query(sqlContent);
      client.release();

      return res.json({
        success: true,
        message: '🎉 ساختار کامل پایگاه داده مسکن‌یار (۱۱ جدول + داده‌های اولیه + ایندکس‌ها) با موفقیت در دیتابیس ایجاد شد!',
      });
    } catch (dbErr: any) {
      client.release();
      return res.status(500).json({
        success: false,
        message: `خطا در اجرای اسکریپت مایگریشن: ${dbErr.message}`,
      });
    }
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      message: `خطای سرور: ${err.message}`,
    });
  }
});

// ۵. دریافت تمامی داده‌های تعاونی‌ها و اعضا از دیتابیس
app.get('/api/db/data', async (req: Request, res: Response) => {
  const { pool } = getPool();
  if (!pool) {
    return res.status(400).json({ success: false, message: 'دیتابیس متصل نیست.' });
  }

  try {
    const client = await pool.connect();
    try {
      const coopsRes = await client.query('SELECT * FROM cooperatives ORDER BY created_at DESC');
      const usersRes = await client.query('SELECT * FROM users ORDER BY created_at DESC');
      const memsRes = await client.query('SELECT * FROM memberships ORDER BY joined_at DESC');
      const unitsRes = await client.query('SELECT * FROM units ORDER BY unit_number ASC');

      client.release();

      return res.json({
        success: true,
        cooperatives: coopsRes.rows.map(c => ({
          id: c.id,
          name: c.name,
          code: c.code,
          projectName: c.project_name,
          address: c.address,
          totalUnits: c.total_units,
          bankAccountInfo: {
            bankName: c.bank_name,
            accountNumber: c.account_number,
            shebaNumber: c.sheba_number,
            cardHolderName: c.card_holder_name,
          },
          isActive: c.is_active,
          createdAt: c.created_at,
        })),
        users: usersRes.rows.map(u => ({
          id: u.id,
          mobile: u.mobile,
          fullName: u.full_name,
          nationalCode: u.national_code,
          fatherName: u.father_name,
          avatarUrl: u.avatar_url,
          isActive: u.is_active,
          createdAt: u.created_at,
          updatedAt: u.updated_at,
        })),
        memberships: memsRes.rows.map(m => ({
          id: m.id,
          userId: m.user_id,
          cooperativeId: m.cooperative_id,
          role: m.role,
          membershipNumber: m.membership_number,
          isActive: m.is_active,
          joinedAt: m.joined_at,
        })),
        units: unitsRes.rows.map(u => ({
          id: u.id,
          cooperativeId: u.cooperative_id,
          unitNumber: u.unit_number,
          block: u.block,
          floor: u.floor,
          areaM2: Number(u.area_m2),
          parkingNumber: u.parking_number,
          storageNumber: u.storage_number,
          assignedMemberId: u.assigned_member_id,
          status: u.status,
          createdAt: u.created_at,
        })),
      });
    } catch (qErr: any) {
      client.release();
      return res.status(500).json({ success: false, message: qErr.message });
    }
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// ۶. ایجاد یا بروزرسانی تعاونی در دیتابیس
app.post('/api/db/cooperatives', async (req: Request, res: Response) => {
  const { pool } = getPool();
  if (!pool) return res.status(400).json({ success: false, message: 'دیتابیس متصل نیست.' });

  const coop = req.body;
  if (!coop || !coop.name || !coop.code) {
    return res.status(400).json({ success: false, message: 'مشخصات تعاونی ناقص است.' });
  }

  try {
    const client = await pool.connect();
    try {
      const q = `
        INSERT INTO cooperatives (
          id, name, code, project_name, address, total_units,
          bank_name, account_number, sheba_number, card_holder_name, is_active
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        ON CONFLICT (id) DO UPDATE SET
          name = EXCLUDED.name,
          code = EXCLUDED.code,
          project_name = EXCLUDED.project_name,
          address = EXCLUDED.address,
          total_units = EXCLUDED.total_units,
          bank_name = EXCLUDED.bank_name,
          account_number = EXCLUDED.account_number,
          sheba_number = EXCLUDED.sheba_number,
          card_holder_name = EXCLUDED.card_holder_name,
          is_active = EXCLUDED.is_active
        RETURNING *;
      `;
      const values = [
        coop.id || `coop-${Date.now()}`,
        coop.name,
        coop.code,
        coop.projectName || coop.name,
        coop.address || '',
        coop.totalUnits || 50,
        coop.bankAccountInfo?.bankName || coop.bank_name || '',
        coop.bankAccountInfo?.accountNumber || coop.account_number || '',
        coop.bankAccountInfo?.shebaNumber || coop.sheba_number || '',
        coop.bankAccountInfo?.cardHolderName || coop.card_holder_name || '',
        coop.isActive !== undefined ? coop.isActive : true,
      ];

      const result = await client.query(q, values);
      client.release();
      return res.json({ success: true, cooperative: result.rows[0] });
    } catch (e: any) {
      client.release();
      return res.status(500).json({ success: false, message: e.message });
    }
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// ۷. حذف تعاونی از دیتابیس
app.delete('/api/db/cooperatives/:id', async (req: Request, res: Response) => {
  const { pool } = getPool();
  if (!pool) return res.status(400).json({ success: false, message: 'دیتابیس متصل نیست.' });

  const { id } = req.params;
  try {
    const client = await pool.connect();
    try {
      await client.query('DELETE FROM cooperatives WHERE id = $1', [id]);
      client.release();
      return res.json({ success: true, message: 'تعاونی با موفقیت حذف شد.' });
    } catch (e: any) {
      client.release();
      return res.status(500).json({ success: false, message: e.message });
    }
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// ۸. ثبت کاربر و عضویت در دیتابیس
app.post('/api/db/users', async (req: Request, res: Response) => {
  const { pool } = getPool();
  if (!pool) return res.status(400).json({ success: false, message: 'دیتابیس متصل نیست.' });

  const { user, membership } = req.body;
  if (!user || !user.fullName || !user.mobile || !user.nationalCode) {
    return res.status(400).json({ success: false, message: 'مشخصات کاربر ناقص است.' });
  }

  try {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const userQuery = `
        INSERT INTO users (
          id, mobile, full_name, national_code, father_name, avatar_url, is_active
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        ON CONFLICT (id) DO UPDATE SET
          mobile = EXCLUDED.mobile,
          full_name = EXCLUDED.full_name,
          national_code = EXCLUDED.national_code,
          father_name = EXCLUDED.father_name,
          is_active = EXCLUDED.is_active,
          updated_at = NOW()
        RETURNING *;
      `;
      const userValues = [
        user.id || `user-${Date.now()}`,
        user.mobile,
        user.fullName,
        user.nationalCode,
        user.fatherName || null,
        user.avatarUrl || null,
        user.isActive !== undefined ? user.isActive : true,
      ];
      const userRes = await client.query(userQuery, userValues);

      let memRes = null;
      if (membership && membership.cooperativeId) {
        const memQuery = `
          INSERT INTO memberships (
            id, user_id, cooperative_id, role, membership_number, is_active
          ) VALUES ($1, $2, $3, $4, $5, $6)
          ON CONFLICT (user_id, cooperative_id) DO UPDATE SET
            role = EXCLUDED.role,
            membership_number = EXCLUDED.membership_number,
            is_active = EXCLUDED.is_active
          RETURNING *;
        `;
        const memValues = [
          membership.id || `mem-${Date.now()}`,
          userRes.rows[0].id,
          membership.cooperativeId,
          membership.role || 'MEMBER',
          membership.membershipNumber || `MEM-${Date.now().toString().slice(-4)}`,
          membership.isActive !== undefined ? membership.isActive : true,
        ];
        memRes = await client.query(memQuery, memValues);
      }

      await client.query('COMMIT');
      client.release();

      return res.json({
        success: true,
        user: userRes.rows[0],
        membership: memRes ? memRes.rows[0] : null,
      });
    } catch (e: any) {
      await client.query('ROLLBACK');
      client.release();
      return res.status(500).json({ success: false, message: e.message });
    }
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// ۹. ویرایش کاربر در دیتابیس
app.put('/api/db/users/:id', async (req: Request, res: Response) => {
  const { pool } = getPool();
  if (!pool) return res.status(400).json({ success: false, message: 'دیتابیس متصل نیست.' });

  const { id } = req.params;
  const user = req.body;

  try {
    const client = await pool.connect();
    try {
      const q = `
        UPDATE users SET
          full_name = COALESCE($1, full_name),
          mobile = COALESCE($2, mobile),
          national_code = COALESCE($3, national_code),
          father_name = COALESCE($4, father_name),
          is_active = COALESCE($5, is_active),
          updated_at = NOW()
        WHERE id = $6
        RETURNING *;
      `;
      const values = [
        user.fullName || null,
        user.mobile || null,
        user.nationalCode || null,
        user.fatherName !== undefined ? user.fatherName : null,
        user.isActive !== undefined ? user.isActive : null,
        id,
      ];
      const result = await client.query(q, values);
      client.release();

      if (result.rowCount === 0) {
        return res.status(404).json({ success: false, message: 'کاربر یافت نشد.' });
      }

      return res.json({ success: true, user: result.rows[0] });
    } catch (e: any) {
      client.release();
      return res.status(500).json({ success: false, message: e.message });
    }
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// ۱۰. حذف کاربر از دیتابیس
app.delete('/api/db/users/:id', async (req: Request, res: Response) => {
  const { pool } = getPool();
  if (!pool) return res.status(400).json({ success: false, message: 'دیتابیس متصل نیست.' });

  const { id } = req.params;
  try {
    const client = await pool.connect();
    try {
      await client.query('DELETE FROM users WHERE id = $1', [id]);
      client.release();
      return res.json({ success: true, message: 'کاربر با موفقیت حذف شد.' });
    } catch (e: any) {
      client.release();
      return res.status(500).json({ success: false, message: e.message });
    }
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// ۱۱. همگام‌سازی دسته‌جمعی داده‌های لوکال با دیتابیس (Sync All)
app.post('/api/db/sync-all', async (req: Request, res: Response) => {
  const { pool } = getPool();
  if (!pool) return res.status(400).json({ success: false, message: 'دیتابیس متصل نیست.' });

  const { cooperatives, users, memberships } = req.body;
  const client = await pool.connect();

  try {
    await client.query('BEGIN');
    let insertedCoops = 0;
    let insertedUsers = 0;
    let insertedMems = 0;

    if (Array.isArray(cooperatives)) {
      for (const c of cooperatives) {
        await client.query(`
          INSERT INTO cooperatives (
            id, name, code, project_name, address, total_units,
            bank_name, account_number, sheba_number, card_holder_name, is_active
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
          ON CONFLICT (id) DO UPDATE SET
            name = EXCLUDED.name,
            code = EXCLUDED.code,
            project_name = EXCLUDED.project_name,
            address = EXCLUDED.address,
            total_units = EXCLUDED.total_units,
            bank_name = EXCLUDED.bank_name,
            account_number = EXCLUDED.account_number,
            sheba_number = EXCLUDED.sheba_number,
            card_holder_name = EXCLUDED.card_holder_name,
            is_active = EXCLUDED.is_active;
        `, [
          c.id, c.name, c.code, c.projectName, c.address, c.totalUnits,
          c.bankAccountInfo?.bankName || '', c.bankAccountInfo?.accountNumber || '',
          c.bankAccountInfo?.shebaNumber || '', c.bankAccountInfo?.cardHolderName || '',
          c.isActive ?? true
        ]);
        insertedCoops++;
      }
    }

    if (Array.isArray(users)) {
      for (const u of users) {
        await client.query(`
          INSERT INTO users (
            id, mobile, full_name, national_code, father_name, avatar_url, is_active
          ) VALUES ($1, $2, $3, $4, $5, $6, $7)
          ON CONFLICT (id) DO UPDATE SET
            mobile = EXCLUDED.mobile,
            full_name = EXCLUDED.full_name,
            national_code = EXCLUDED.national_code,
            father_name = EXCLUDED.father_name,
            is_active = EXCLUDED.is_active;
        `, [
          u.id, u.mobile, u.fullName, u.nationalCode,
          u.fatherName || null, u.avatarUrl || null, u.isActive ?? true
        ]);
        insertedUsers++;
      }
    }

    if (Array.isArray(memberships)) {
      for (const m of memberships) {
        await client.query(`
          INSERT INTO memberships (
            id, user_id, cooperative_id, role, membership_number, is_active
          ) VALUES ($1, $2, $3, $4, $5, $6)
          ON CONFLICT (user_id, cooperative_id) DO UPDATE SET
            role = EXCLUDED.role,
            membership_number = EXCLUDED.membership_number,
            is_active = EXCLUDED.is_active;
        `, [
          m.id, m.userId, m.cooperativeId, m.role, m.membershipNumber, m.isActive ?? true
        ]);
        insertedMems++;
      }
    }

    await client.query('COMMIT');
    client.release();

    return res.json({
      success: true,
      message: `همگام‌سازی موفق: ${insertedCoops} تعاونی، ${insertedUsers} کاربر و ${insertedMems} عضویت در دیتابیس ثبت شدند.`,
    });
  } catch (err: any) {
    await client.query('ROLLBACK');
    client.release();
    return res.status(500).json({ success: false, message: err.message });
  }
});

// -------------------------------------------------------------
// اندپوینت اطلاعات کاربر مدیر ارشد سامانه از متغیرهای محیطی
// -------------------------------------------------------------
app.get('/api/admin/info', (req: Request, res: Response) => {
  const adminMobile = (process.env.ADMIN_MOBILE || process.env.VITE_ADMIN_MOBILE || '09120000000').trim();
  const adminFullName = (process.env.ADMIN_FULL_NAME || process.env.VITE_ADMIN_FULL_NAME || 'مدیر ارشد سامانه').trim();
  const adminNationalCode = (process.env.ADMIN_NATIONAL_CODE || process.env.VITE_ADMIN_NATIONAL_CODE || '0010350829').trim();
  return res.json({
    adminMobile,
    adminFullName,
    adminNationalCode
  });
});

// -------------------------------------------------------------
// اندپوینت‌های تحلیل هوشمند مالی با Groq AI
// -------------------------------------------------------------

app.get('/api/ai/groq-status', async (req: Request, res: Response) => {
  const apiKey = (process.env.GROQ_API_KEY || '').trim();
  const hasEnvKey = Boolean(apiKey);

  let activeModels = ['openai/gpt-oss-120b', 'openai/gpt-oss-20b', 'qwen/qwen3.8-27b', 'allam-2-7b'];

  if (hasEnvKey) {
    try {
      const groqRes = await fetch('https://api.groq.com/openai/v1/models', {
        headers: { 'Authorization': `Bearer ${apiKey}` }
      });
      if (groqRes.ok) {
        const data = await groqRes.json();
        if (Array.isArray(data.data)) {
          const chatOnly = data.data
            .map((m: any) => m.id)
            .filter((id: string) => 
              !id.includes('whisper') && 
              !id.includes('prompt-guard') && 
              !id.includes('orpheus') && 
              !id.includes('safeguard')
            );
          if (chatOnly.length > 0) {
            // اولویت‌بندی مدل‌های قدرتمند چت و استدلال مالی
            const priority = ['openai/gpt-oss-120b', 'openai/gpt-oss-20b', 'qwen/qwen3.8-27b', 'allam-2-7b'];
            chatOnly.sort((a: string, b: string) => {
              const ia = priority.indexOf(a);
              const ib = priority.indexOf(b);
              if (ia !== -1 && ib !== -1) return ia - ib;
              if (ia !== -1) return -1;
              if (ib !== -1) return 1;
              return 0;
            });
            activeModels = chatOnly;
          }
        }
      }
    } catch {
      // استفاده از مقادیر پیش‌فرض
    }
  }

  const defaultModel = activeModels.find(m => m === 'openai/gpt-oss-120b') || activeModels[0] || 'openai/gpt-oss-120b';

  return res.json({
    configured: hasEnvKey,
    source: hasEnvKey ? 'GROQ_API_KEY (Secret)' : 'none',
    availableModels: activeModels,
    defaultModel
  });
});

app.post('/api/ai/financial-analysis', async (req: Request, res: Response) => {
  try {
    const { cooperativeName, financialStats, customPrompt, groqApiKey, model } = req.body;
    const apiKey = (process.env.GROQ_API_KEY || groqApiKey || '').trim();

    if (!apiKey) {
      return res.status(400).json({
        success: false,
        code: 'MISSING_API_KEY',
        message: 'کلید دسترسی Groq API یافت نشد. لطفاً متغیر GROQ_API_KEY را در بخش Secrets تنظیم کنید یا در کادر زیر وارد نمایید.'
      });
    }

    const systemPrompt = `شما مشاور و تحلیل‌گر ارشد مالی در حوزه تعاونی‌های مسکن ایران (سامانه مسکن‌یار) هستید.
شما بر اساس داده‌های حسابرسی مالی، جریان نقدی، اقساط، هزینه‌ها و معوقات تعاونی مسکن، یک گزارش تفصیلی، حرفه‌ای و قابل ارائه به هیئت مدیره تولید می‌کنید.
خروجی شما باید منحصراً یک شیء معتبر JSON با این ساختار باشد:
{
  "healthScore": 82, // عدد بین ۰ تا ۱۰۰
  "riskLevel": "کم" | "متوسط" | "بالا" | "بحرانی",
  "executiveSummary": "خلاصه اجرایی وضعیت مالی به فارسی",
  "cashflowAnalysis": "تحلیل وضعیت جریان نقدینگی و تراز جاری",
  "overdueRiskAssessment": "ارزیابی ریسک معوقات و رفتار پرداختی اعضا",
  "strategicRecommendations": [
    "توصیه راهبردی اول",
    "توصیه راهبردی دوم",
    "توصیه راهبردی سوم"
  ],
  "budgetForecast": "پیش‌بینی نقدینگی و هزینه‌های دوره آتی ۶ ماه آینده"
}`;

    const userMessage = `اطلاعات مالی تعاونی مسکن: «${cooperativeName || 'پروژه جاری'}»
آمار مالی و نقدینگی:
- کل مبلغ تعهدات قراردادهای ساخت: ${Number(financialStats?.totalContractRial || 0).toLocaleString()} ریال
- کل وجوه وصول‌شده اقساط: ${Number(financialStats?.totalCollectedRial || 0).toLocaleString()} ریال
- کل معوقات سررسید گذشته اقساط: ${Number(financialStats?.totalOverdueRial || 0).toLocaleString()} ریال
- شارژ و هزینه‌های وصول‌شده جاری: ${Number(financialStats?.monthlyFeeCollectedRial || 0).toLocaleString()} ریال
- شارژ و هزینه‌های معوق: ${Number(financialStats?.monthlyFeeOverdueRial || 0).toLocaleString()} ریال
- تعداد اعضا/واحدها: ${financialStats?.membersCount || 0}
- تعداد اعضای دارای معوقه: ${financialStats?.overdueMembersCount || 0}

${customPrompt ? `نکته یا سوال خاص مدیر: ${customPrompt}` : ''}

لطفاً تحلیل کامل هوشمند را در قالب شیء JSON طبق فرمت تعیین‌شده ارائه نمایید.`;

    // فهرستی از مدل‌های قابل استفاده به ترتیب اولویت جهت جلوگیری از خطای 404
    const candidateModels = [
      model,
      'openai/gpt-oss-120b',
      'openai/gpt-oss-20b',
      'qwen/qwen3.8-27b',
      'allam-2-7b',
      'llama-3.3-70b-versatile'
    ].filter(Boolean);

    let groqResponse: any = null;
    let selectedModel = '';

    for (const m of candidateModels) {
      const resAttempt = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: m,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userMessage }
          ],
          temperature: 0.3,
          response_format: { type: 'json_object' }
        })
      });

      if (resAttempt.ok) {
        groqResponse = resAttempt;
        selectedModel = m;
        break;
      } else {
        const errJson = await resAttempt.json().catch(() => ({}));
        // اگر خطا به علت عدم دسترسی یا ناموجود بودن مدل بود، مدل بعدی تست می‌شود
        if (errJson?.error?.code === 'model_not_found' || resAttempt.status === 404) {
          continue;
        }
        // اگر خطا مربوط به اعتبارسنجی کلید یا موارد دیگر بود، همان را گزارش کن
        return res.status(resAttempt.status).json({
          success: false,
          code: 'GROQ_API_ERROR',
          message: `خطای ارتباط با سرور Groq (${resAttempt.status}): ${errJson?.error?.message || 'خطا در مدل'}`
        });
      }
    }

    if (!groqResponse) {
      return res.status(500).json({
        success: false,
        code: 'GROQ_MODEL_ERROR',
        message: 'هیچ مدل فعالی در حساب کاربری Groq برای انجام این تحلیل یافت نشد.'
      });
    }

    const data = await groqResponse.json();
    const content = data.choices?.[0]?.message?.content;
    let parsedJson: any = null;

    try {
      parsedJson = JSON.parse(content);
    } catch {
      parsedJson = {
        healthScore: 75,
        riskLevel: 'متوسط',
        executiveSummary: content,
        cashflowAnalysis: 'تحلیل دریافت شد.',
        overdueRiskAssessment: 'بررسی وضعیت معوقات انجام شد.',
        strategicRecommendations: ['پیگیری وصول معوقات', 'تنظیم برنامه ذخیره نقدی'],
        budgetForecast: 'پیش‌بینی نرمال بر اساس روند جاری.'
      };
    }

    return res.json({
      success: true,
      data: parsedJson,
      modelUsed: selectedModel,
      usage: data.usage
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      code: 'SERVER_ERROR',
      message: error.message || 'خطای سرور در ارتباط با Groq AI'
    });
  }
});

// -------------------------------------------------------------
// راه‌اندازی Vite در حالت توسعه (Dev) یا سرور استاتیک در حالت پروداکشن
// -------------------------------------------------------------
async function startServer() {
  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 سرور سامانه مدیریت تعاونی‌های مسکن (مسکن‌یار) روی پورت ${PORT} آماده به کار است.`);
    const active = getActiveConnectionString();
    if (active.connectionString) {
      console.log(`🔌 وضعیت دیتابیس: اتصال با منبع [${active.source}] پیکربندی شده است.`);
    } else {
      console.log(`ℹ️ وضعیت دیتابیس: متغیر DATABASE_URL هنوز در Secrets تنظیم نشده است.`);
    }
  });
}

startServer().catch(err => {
  console.error('Fatal error starting server:', err);
  process.exit(1);
});
