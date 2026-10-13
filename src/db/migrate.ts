/**
 * اسکریپت اجرای خودکار Migration پایگاه داده PostgreSQL (Local / Supabase / VPS)
 * نحوه اجرا:
 *   npx tsx src/db/migrate.ts
 * یا با متغیر محیطی:
 *   DATABASE_URL="postgres://user:pass@host:port/db" npx tsx src/db/migrate.ts
 */

import { Pool } from 'pg';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

dotenv.config();

const connectionString = 
  process.env.DATABASE_URL || 
  process.env.POSTGRES_URL || 
  'postgres://postgres:maskanyar_secret_password@localhost:5432/maskanyar';

async function runMigration() {
  console.log('----------------------------------------------------');
  console.log('🚀 شروع فرآیند مهاجرت و ایجاد جداول PostgreSQL مسکن‌یار');
  console.log(`📌 رشته اتصال: ${connectionString.replace(/:[^:@]*@/, ':****@')}`);
  console.log('----------------------------------------------------');

  const pool = new Pool({
    connectionString,
    ssl: connectionString.includes('supabase.com') ? { rejectUnauthorized: false } : undefined
  });

  try {
    const client = await pool.connect();
    console.log('✅ اتصال به پایگاه داده با موفقیت برقرار شد.');

    const sqlFilePath = path.join(__dirname, 'complete_migration.sql');
    if (!fs.existsSync(sqlFilePath)) {
      throw new Error(`فایل SQL در مسیر ${sqlFilePath} یافت نشد.`);
    }

    const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');
    console.log('⏳ در حال اجرای اسکریپت کامل ساختار و داده‌های اولیه...');

    await client.query(sqlContent);
    console.log('🎉 مهاجرت با موفقیت پایان یافت! تمام ۱۱ جدول و داده‌های اولیه در دیتابیس ساخته شدند.');

    client.release();
  } catch (error: any) {
    console.error('❌ خطا در فرآیند مهاجرت دیتابیس:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runMigration();
