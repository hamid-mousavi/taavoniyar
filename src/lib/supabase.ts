import { createClient, SupabaseClient } from '@supabase/supabase-js';

const STORAGE_KEY_URL = 'maskanyar_custom_supabase_url';
const STORAGE_KEY_KEY = 'maskanyar_custom_supabase_anon_key';

const getEnvVar = (name: string): string => {
  try {
    if (typeof import.meta !== 'undefined' && (import.meta as any).env && (import.meta as any).env[name]) {
      return (import.meta as any).env[name];
    }
  } catch {}
  try {
    if (typeof process !== 'undefined' && process.env && process.env[name]) {
      return process.env[name] || '';
    }
  } catch {}
  return '';
};

export const getStoredSupabaseUrl = (): string => {
  try {
    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      const custom = localStorage.getItem(STORAGE_KEY_URL);
      if (custom && custom.trim()) return custom.trim();
    }
  } catch {}
  return getEnvVar('VITE_SUPABASE_URL').trim();
};

export const getStoredSupabaseAnonKey = (): string => {
  try {
    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      const custom = localStorage.getItem(STORAGE_KEY_KEY);
      if (custom && custom.trim()) return custom.trim();
    }
  } catch {}
  return getEnvVar('VITE_SUPABASE_ANON_KEY').trim();
};

export const isSupabaseConfigured = (): boolean => {
  const url = getStoredSupabaseUrl();
  const key = getStoredSupabaseAnonKey();
  return (
    !!url &&
    !!key &&
    url.startsWith('https://') &&
    !url.includes('your-project')
  );
};

let clientInstance: SupabaseClient | null = null;

export const getSupabaseClient = (): SupabaseClient | null => {
  if (!isSupabaseConfigured()) {
    clientInstance = null;
    return null;
  }
  const url = getStoredSupabaseUrl();
  const key = getStoredSupabaseAnonKey();
  if (!clientInstance) {
    clientInstance = createClient(url, key, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    });
  }
  return clientInstance;
};

// کلاینت پیش‌فرض
export const supabase = getSupabaseClient();

export const saveSupabaseCredentials = (url: string, key: string) => {
  try {
    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_KEY_URL, url.trim());
      localStorage.setItem(STORAGE_KEY_KEY, key.trim());
    }
  } catch {}
  clientInstance = null;
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('supabase-config-changed'));
  }
};

export const clearSupabaseCredentials = () => {
  try {
    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY_URL);
      localStorage.removeItem(STORAGE_KEY_KEY);
    }
  } catch {}
  clientInstance = null;
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('supabase-config-changed'));
  }
};

export const testSupabaseConnection = async (): Promise<{
  success: boolean;
  latencyMs?: number;
  message: string;
  tableDetails?: { name: string; exists: boolean; count?: number }[];
}> => {
  const client = getSupabaseClient();
  if (!client) {
    return {
      success: false,
      message: 'تنظیمات آدرس پروژه یا کلید عمومی (Anon Key) وارد نشده است.'
    };
  }

  const start = performance.now();
  try {
    const { count, error } = await client
      .from('cooperatives')
      .select('id', { count: 'exact', head: true });

    const latencyMs = Math.round(performance.now() - start);

    if (error) {
      if (error.code === '42P01' || error.message.includes('does not exist')) {
        return {
          success: true,
          latencyMs,
          message: 'اتصال به دیتابیس Supabase با موفقیت برقرار شد، اما جداول ساخته نشده‌اند (نیاز به اجرای اسکریپت ساخت جدول در SQL Editor دارید).'
        };
      }
      return {
        success: false,
        latencyMs,
        message: `خطای سرور دیتابیس: ${error.message} (کد: ${error.code || 'نامشخص'})`
      };
    }

    return {
      success: true,
      latencyMs,
      message: `اتصال به پایگاه داده Supabase PostgreSQL کاملاً برقرار و پایدار است (تاخیر: ${latencyMs} میلی‌ثانیه).`
    };
  } catch (err: any) {
    return {
      success: false,
      message: `خطای ارتباطی شبکه با سرور: ${err.message || 'عدم دسترسی'}`
    };
  }
};
