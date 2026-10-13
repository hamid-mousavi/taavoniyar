/**
 * کلاینت مدیریت ارتباط با پایگاه داده PostgreSQL / Supabase
 * ارتباط از طریق مسیرهای سرور (/api/db/*) و پشتیبانی از رشته اتصال (DATABASE_URL) در بخش Secrets
 */

export interface DbStatusResponse {
  configured: boolean;
  source: string;
  connected: boolean;
  latencyMs?: number;
  pgVersion?: string;
  isSupabase?: boolean;
  projectRef?: string | null;
  host?: string | null;
  database?: string | null;
  maskedConnectionString?: string;
  tables?: { name: string; exists: boolean; count: number }[];
  message?: string;
  error?: string;
}

export interface DbTestResponse {
  success: boolean;
  latencyMs?: number;
  pgVersion?: string;
  isSupabase?: boolean;
  projectRef?: string | null;
  host?: string | null;
  tablesReady?: boolean;
  existingTables?: string[];
  message: string;
  error?: string;
}

class DbClient {
  private lastStatus: DbStatusResponse | null = null;
  private listeners: (() => void)[] = [];

  public subscribe(listener: () => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notify() {
    this.listeners.forEach(l => l());
  }

  public getLastStatus(): DbStatusResponse | null {
    return this.lastStatus;
  }

  public isConnected(): boolean {
    return !!this.lastStatus?.connected;
  }

  public isConfigured(): boolean {
    return !!this.lastStatus?.configured;
  }

  /**
   * دریافت وضعیت اتصال جاری از سرور
   */
  public async checkStatus(): Promise<DbStatusResponse> {
    try {
      const res = await fetch('/api/db/status');
      if (!res.ok) {
        throw new Error(`خطای سرور (${res.status})`);
      }
      const data: DbStatusResponse = await res.json();
      this.lastStatus = data;
      this.notify();
      return data;
    } catch (err: any) {
      const fallback: DbStatusResponse = {
        configured: false,
        source: 'none',
        connected: false,
        message: `عدم دسترسی به سرور: ${err.message}`,
      };
      this.lastStatus = fallback;
      this.notify();
      return fallback;
    }
  }

  /**
   * تست اتصال رشته اتصال ارسالی یا موجود در Secrets
   */
  public async testConnection(connectionString?: string): Promise<DbTestResponse> {
    try {
      const res = await fetch('/api/db/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ connectionString }),
      });
      const data = await res.json();
      // پس از تست وضعیت، وضعیت عمومی را دوباره به‌روز کنیم
      this.checkStatus().catch(() => {});
      return data;
    } catch (err: any) {
      return {
        success: false,
        message: `خطای ارتباطی: ${err.message}`,
      };
    }
  }

  /**
   * ذخیره یا پاکسازی رشته اتصال در حافظه اجرایی سرور
   */
  public async setConnectionString(connectionString: string | null): Promise<{ success: boolean; message: string }> {
    try {
      const res = await fetch('/api/db/set-connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(connectionString ? { connectionString } : { clear: true }),
      });
      const data = await res.json();
      await this.checkStatus();
      return data;
    } catch (err: any) {
      return { success: false, message: err.message };
    }
  }

  /**
   * اجرای خودکار اسکریپت مایگریشن و ساخت ۱۱ جدول در دیتابیس
   */
  public async runMigration(): Promise<{ success: boolean; message: string }> {
    try {
      const res = await fetch('/api/db/migrate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await res.json();
      await this.checkStatus();
      return data;
    } catch (err: any) {
      return { success: false, message: err.message };
    }
  }

  /**
   * دریافت کامل داده‌های ذخیره‌شده از PostgreSQL
   */
  public async fetchData(): Promise<any> {
    try {
      const res = await fetch('/api/db/data');
      return await res.json();
    } catch (err: any) {
      return { success: false, message: err.message };
    }
  }

  /**
   * ایجاد یا به‌روزرسانی تعاونی مسکن در دیتابیس
   */
  public async syncCooperative(coop: any): Promise<boolean> {
    try {
      const res = await fetch('/api/db/cooperatives', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(coop),
      });
      const data = await res.json();
      return !!data.success;
    } catch {
      return false;
    }
  }

  /**
   * حذف تعاونی از دیتابیس
   */
  public async deleteCooperative(id: string): Promise<boolean> {
    try {
      const res = await fetch(`/api/db/cooperatives/${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      return !!data.success;
    } catch {
      return false;
    }
  }

  /**
   * ایجاد کاربر و عضویت در دیتابیس
   */
  public async syncUserAndMembership(user: any, membership: any): Promise<boolean> {
    try {
      const res = await fetch('/api/db/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user, membership }),
      });
      const data = await res.json();
      return !!data.success;
    } catch {
      return false;
    }
  }

  /**
   * ویرایش مشخصات کاربر در دیتابیس
   */
  public async updateUser(id: string, user: any): Promise<boolean> {
    try {
      const res = await fetch(`/api/db/users/${encodeURIComponent(id)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(user),
      });
      const data = await res.json();
      return !!data.success;
    } catch {
      return false;
    }
  }

  /**
   * حذف کاربر از دیتابیس
   */
  public async deleteUser(id: string): Promise<boolean> {
    try {
      const res = await fetch(`/api/db/users/${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      return !!data.success;
    } catch {
      return false;
    }
  }

  /**
   * همگام‌سازی دسته‌جمعی داده‌های لوکال با PostgreSQL
   */
  public async syncAll(data: { cooperatives: any[]; users: any[]; memberships: any[] }): Promise<{ success: boolean; message: string }> {
    try {
      const res = await fetch('/api/db/sync-all', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      return await res.json();
    } catch (err: any) {
      return { success: false, message: err.message };
    }
  }
}

export const dbClient = new DbClient();
