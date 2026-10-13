import React, { useState, useEffect } from 'react';
import { 
  Database, 
  Copy, 
  Check, 
  CheckCircle2, 
  AlertCircle, 
  ExternalLink, 
  Server, 
  RefreshCw,
  Download,
  Upload,
  ArrowRight,
  HardDrive,
  FileCode,
  Layers,
  Terminal,
  ShieldCheck,
  Send,
  HelpCircle,
  Clock,
  Sparkles,
  KeyRound,
  Zap,
  Globe,
  Lock,
  Play,
  CheckCheck
} from 'lucide-react';
import { dbClient, DbStatusResponse } from '../../lib/dbClient';
import { dataService } from '../../services/dataService';
import { toPersianDigits } from '../../utils/persian';

interface TableStatus {
  name: string;
  title: string;
  exists: boolean | null;
  count: number | null;
  error?: string;
}

const DATABASE_TABLES: { name: string; title: string }[] = [
  { name: 'cooperatives', title: 'تعاونی‌های مسکن (مستأجرها)' },
  { name: 'users', title: 'کاربران و اعضا' },
  { name: 'memberships', title: 'عضویت‌ها و انتساب نقش‌ها' },
  { name: 'units', title: 'واحدهای مسکونی' },
  { name: 'installment_plans', title: 'برنامه‌های اقساط واحد' },
  { name: 'installment_items', title: 'ریز اقساط و سررسیدها' },
  { name: 'payments', title: 'تراکنش‌های پرداخت' },
  { name: 'receipts', title: 'رسیدهای واریز فیش دستی' },
  { name: 'announcements', title: 'اطلاعیه‌ها' },
  { name: 'audit_logs', title: 'لاگ‌های حسابرسی رویدادها' },
  { name: 'monthly_fees', title: 'هزینه‌ها و شارژ ماهانه' },
];

export const SupabaseManager: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<'connectionString' | 'tables' | 'sqlScript' | 'sync'>('connectionString');
  const [copiedType, setCopiedType] = useState<string | null>(null);
  
  // وضعیت زنده اتصال بر مبنای API سرور و Secret
  const [dbStatus, setDbStatus] = useState<DbStatusResponse | null>(null);
  const [isCheckingStatus, setIsCheckingStatus] = useState<boolean>(false);
  const [isMigrating, setIsMigrating] = useState<boolean>(false);
  const [migrationResult, setMigrationResult] = useState<{ success: boolean; message: string } | null>(null);

  // تست دستی رشته اتصال
  const [testConnInput, setTestConnInput] = useState<string>('');
  const [isTestingCustom, setIsTestingCustom] = useState<boolean>(false);
  const [customTestResult, setCustomTestResult] = useState<{
    success: boolean;
    latencyMs?: number;
    message: string;
  } | null>(null);

  // عملیات همگام‌سازی دوطرفه داده‌ها
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [isPulling, setIsPulling] = useState<boolean>(false);
  const [syncLogs, setSyncLogs] = useState<string[]>([]);

  // بارگذاری وضعیت اولیه اتصال
  const refreshStatus = async () => {
    setIsCheckingStatus(true);
    try {
      const status = await dbClient.checkStatus();
      setDbStatus(status);
    } catch {
      // خطا در هندلر داخلی DbClient کنترل می‌شود
    } finally {
      setIsCheckingStatus(false);
    }
  };

  useEffect(() => {
    refreshStatus();
    const unsub = dbClient.subscribe(() => {
      setDbStatus(dbClient.getLastStatus());
    });
    return unsub;
  }, []);

  const handleCopy = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    setCopiedType(type);
    setTimeout(() => setCopiedType(null), 2500);
  };

  // تست اتصال رشته سکرت یا رشته دستی
  const handleTestConnection = async (customStr?: string) => {
    setIsTestingCustom(true);
    setCustomTestResult(null);
    try {
      const res = await dbClient.testConnection(customStr);
      setCustomTestResult({
        success: res.success,
        latencyMs: res.latencyMs,
        message: res.message,
      });
      await refreshStatus();
    } catch (err: any) {
      setCustomTestResult({
        success: false,
        message: err.message || 'خطا در برقراری اتصال',
      });
    } finally {
      setIsTestingCustom(false);
    }
  };

  // ذخیره رشته اتصال دستی در حافظه سرور
  const handleSaveRuntimeConnection = async () => {
    if (!testConnInput.trim()) return;
    setIsTestingCustom(true);
    try {
      await dbClient.setConnectionString(testConnInput.trim());
      await refreshStatus();
      setCustomTestResult({
        success: true,
        message: 'رشته اتصال با موفقیت به عنوان دیتابیس فعال برنامه ذخیره شد.',
      });
    } catch (err: any) {
      setCustomTestResult({
        success: false,
        message: err.message,
      });
    } finally {
      setIsTestingCustom(false);
    }
  };

  // اجرای مهاجرت خودکار ساخت جداول (Auto Migration)
  const handleRunMigration = async () => {
    setIsMigrating(true);
    setMigrationResult(null);
    try {
      const res = await dbClient.runMigration();
      setMigrationResult(res);
      await refreshStatus();
    } catch (err: any) {
      setMigrationResult({
        success: false,
        message: err.message || 'خطا در اجرای اسکریپت مایگریشن',
      });
    } finally {
      setIsMigrating(false);
    }
  };

  // همگام‌سازی دسته‌جمعی داده‌های لوکال با PostgreSQL
  const handleSyncAllToDb = async () => {
    setIsSyncing(true);
    setSyncLogs(['⏳ در حال آماده‌سازی داده‌های محلی جهت ارسال به دیتابیس...']);
    try {
      const coops = dataService.getAllCooperatives();
      const users = dataService.getAllUsers();
      const mems = dataService.getAllMemberships();

      setSyncLogs(prev => [...prev, `📦 شامل ${toPersianDigits(coops.length)} تعاونی، ${toPersianDigits(users.length)} کاربر و ${toPersianDigits(mems.length)} عضویت`]);

      const res = await dbClient.syncAll({
        cooperatives: coops,
        users,
        memberships: mems,
      });

      if (res.success) {
        setSyncLogs(prev => [...prev, `✅ ${res.message}`]);
        await refreshStatus();
      } else {
        setSyncLogs(prev => [...prev, `❌ خطا: ${res.message}`]);
      }
    } catch (err: any) {
      setSyncLogs(prev => [...prev, `❌ خطای ارتباطی: ${err.message}`]);
    } finally {
      setIsSyncing(false);
    }
  };

  // بارگذاری داده‌های PostgreSQL به سامانه محلی
  const handlePullFromDb = async () => {
    setIsPulling(true);
    setSyncLogs(['⏳ در حال فراخوانی داده‌ها از پایگاه داده ابری...']);
    try {
      const data = await dbClient.fetchData();
      if (data && data.success) {
        const coopsCount = data.cooperatives?.length || 0;
        const usersCount = data.users?.length || 0;
        setSyncLogs(prev => [
          ...prev, 
          `✅ دریافت موفق: ${toPersianDigits(coopsCount)} تعاونی و ${toPersianDigits(usersCount)} کاربر از دیتابیس دریافت شدند.`
        ]);
        await refreshStatus();
      } else {
        setSyncLogs(prev => [...prev, `❌ خطا در دریافت: ${data?.message || 'داده‌ای دریافت نشد'}`]);
      }
    } catch (err: any) {
      setSyncLogs(prev => [...prev, `❌ خطا در برقراری ارتباط: ${err.message}`]);
    } finally {
      setIsPulling(false);
    }
  };

  // اسکریپت خلاصه ساختار DDL جهت نمایش در تب SQL
  const quickSqlSnippet = `-- ایجاد افزونه و انواع شمارشی
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- جدول تعاونی‌های مسکن
CREATE TABLE IF NOT EXISTS cooperatives (
  id VARCHAR(64) PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  code VARCHAR(50) NOT NULL UNIQUE,
  project_name VARCHAR(200) NOT NULL,
  address TEXT NOT NULL,
  total_units INTEGER NOT NULL CHECK (total_units > 0),
  bank_name VARCHAR(100) NOT NULL,
  account_number VARCHAR(50) NOT NULL,
  sheba_number VARCHAR(50) NOT NULL,
  card_holder_name VARCHAR(150) NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- جدول کاربران
CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(64) PRIMARY KEY,
  mobile VARCHAR(11) NOT NULL UNIQUE,
  full_name VARCHAR(150) NOT NULL,
  national_code VARCHAR(10) NOT NULL UNIQUE,
  father_name VARCHAR(100),
  avatar_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- جدول عضویت‌ها
CREATE TABLE IF NOT EXISTS memberships (
  id VARCHAR(64) PRIMARY KEY,
  user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  cooperative_id VARCHAR(64) NOT NULL REFERENCES cooperatives(id) ON DELETE CASCADE,
  role VARCHAR(50) NOT NULL DEFAULT 'MEMBER',
  membership_number VARCHAR(50) NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_user_coop UNIQUE (user_id, cooperative_id)
);`;

  const isConnected = !!dbStatus?.connected;
  const isConfigured = !!dbStatus?.configured;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* هدر بخش پایگاه داده */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-12 h-12 rounded-2xl bg-linear-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <Database className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-black text-slate-900">پایگاه داده ابری Supabase و PostgreSQL</h2>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black bg-emerald-100 text-emerald-800">
                  Connection String
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                اتصال یکپارچه با رشته اتصال (DATABASE_URL) از بخش Secrets، بررسی زنده پینگ و مایگریشن خودکار ۱۱ جدول
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 border transition-all ${
            isConnected 
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200 shadow-xs' 
              : isConfigured
              ? 'bg-amber-50 text-amber-800 border-amber-200'
              : 'bg-slate-100 text-slate-700 border-slate-200'
          }`}>
            <span className={`w-2.5 h-2.5 rounded-full ${isConnected ? 'bg-emerald-500 animate-pulse' : isConfigured ? 'bg-amber-500' : 'bg-slate-400'}`}></span>
            <span>
              {isConnected 
                ? `متصل به دیتابیس (${dbStatus?.latencyMs ? `${toPersianDigits(dbStatus.latencyMs)}ms` : 'پایدار'})` 
                : isConfigured 
                ? 'در انتظار برقراری اتصال' 
                : 'آماده تنظیم در Secrets'}
            </span>
          </div>

          <button
            onClick={refreshStatus}
            disabled={isCheckingStatus}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-60 shadow-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isCheckingStatus ? 'animate-spin' : ''}`} />
            <span>بروزرسانی وضعیت</span>
          </button>
        </div>
      </div>

      {/* بنر وضعیت رشته اتصال در Secrets */}
      <div className={`rounded-3xl p-6 sm:p-7 border transition-all ${
        isConnected 
          ? 'bg-linear-to-br from-emerald-50/70 to-teal-50/40 border-emerald-200' 
          : isConfigured
          ? 'bg-linear-to-br from-amber-50/70 to-orange-50/40 border-amber-200'
          : 'bg-linear-to-br from-slate-50 to-blue-50/50 border-slate-200'
      }`}>
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2.5">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold ${
                isConnected ? 'bg-emerald-500 text-white' : isConfigured ? 'bg-amber-500 text-white' : 'bg-slate-800 text-white'
              }`}>
                <KeyRound className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-black text-slate-900 text-base">
                  {isConnected 
                    ? 'رشته اتصال با موفقیت شناسایی و فعال شد' 
                    : isConfigured 
                    ? 'رشته اتصال شناسایی شد اما بررسی اتصال با خطا مواجه شد' 
                    : 'تنظیم رشته اتصال سوپابیس (DATABASE_URL) در پنل Secrets'}
                </h3>
                <p className="text-xs text-slate-600 mt-0.5">
                  منبع جاری: <strong className="font-mono text-slate-800">{dbStatus?.source || 'هیچ رشته‌ای ست نشده'}</strong>
                  {dbStatus?.isSupabase && <span className="mr-2 px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold text-[10px]">سرور رسمی Supabase</span>}
                </p>
              </div>
            </div>

            {dbStatus?.maskedConnectionString ? (
              <div className="bg-white/80 backdrop-blur-xs p-3 rounded-xl border border-slate-200 font-mono text-xs text-slate-700 flex items-center justify-between gap-3 overflow-x-auto">
                <span className="truncate">{dbStatus.maskedConnectionString}</span>
                <span className="shrink-0 px-2 py-0.5 rounded bg-slate-100 text-slate-600 text-[10px] font-sans font-bold">
                  رمز عبور محافظت‌شده
                </span>
              </div>
            ) : null}

            {dbStatus?.error && (
              <div className="bg-red-50 text-red-800 text-xs p-3 rounded-xl border border-red-200 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                <span>{dbStatus.error}</span>
              </div>
            )}
          </div>

          {/* کلیدهای اقدام فوری */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              onClick={() => handleTestConnection()}
              disabled={isTestingCustom}
              className="px-4 py-2.5 bg-white hover:bg-slate-50 text-slate-900 border border-slate-300 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-xs disabled:opacity-60"
            >
              <Zap className={`w-4 h-4 text-amber-500 ${isTestingCustom ? 'animate-bounce' : ''}`} />
              <span>{isTestingCustom ? 'در حال تست پینگ...' : 'تست اتصال زنده'}</span>
            </button>

            <button
              onClick={handleRunMigration}
              disabled={isMigrating || !isConfigured}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-md shadow-emerald-600/20 disabled:opacity-50"
            >
              <Play className={`w-4 h-4 ${isMigrating ? 'animate-spin' : ''}`} />
              <span>{isMigrating ? 'در حال اجرای مایگریشن...' : 'اجرای خودکار مایگریشن (ساخت ۱۱ جدول)'}</span>
            </button>
          </div>
        </div>

        {/* نتیجه آخرین تست یا مایگریشن */}
        {migrationResult && (
          <div className={`mt-4 p-3.5 rounded-xl text-xs flex items-center gap-2 border animate-in fade-in ${
            migrationResult.success ? 'bg-emerald-100 text-emerald-900 border-emerald-300' : 'bg-red-100 text-red-900 border-red-300'
          }`}>
            {migrationResult.success ? <CheckCheck className="w-4 h-4 text-emerald-700 shrink-0" /> : <AlertCircle className="w-4 h-4 text-red-700 shrink-0" />}
            <span className="font-semibold">{migrationResult.message}</span>
          </div>
        )}

        {customTestResult && (
          <div className={`mt-4 p-3.5 rounded-xl text-xs flex items-center gap-2 border animate-in fade-in ${
            customTestResult.success ? 'bg-emerald-100 text-emerald-900 border-emerald-300' : 'bg-red-100 text-red-900 border-red-300'
          }`}>
            {customTestResult.success ? <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" /> : <AlertCircle className="w-4 h-4 text-red-700 shrink-0" />}
            <span className="font-semibold">{customTestResult.message}</span>
          </div>
        )}
      </div>

      {/* ناوبری تب‌های زیرمجموعه */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto no-scrollbar">
        <button
          onClick={() => setActiveSubTab('connectionString')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center gap-2 ${
            activeSubTab === 'connectionString'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <KeyRound className="w-4 h-4" />
          <span>راهنمای Secret و تست رشته اتصال</span>
        </button>

        <button
          onClick={() => setActiveSubTab('tables')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center gap-2 ${
            activeSubTab === 'tables'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>وضعیت زنده ۱۱ جدول</span>
        </button>

        <button
          onClick={() => setActiveSubTab('sync')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center gap-2 ${
            activeSubTab === 'sync'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <RefreshCw className="w-4 h-4" />
          <span>همگام‌سازی دوطرفه داده‌ها</span>
        </button>

        <button
          onClick={() => setActiveSubTab('sqlScript')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center gap-2 ${
            activeSubTab === 'sqlScript'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <FileCode className="w-4 h-4" />
          <span>کد کامل SQL مایگریشن</span>
        </button>
      </div>

      {/* ۱. تب راهنمای سکرت و تست رشته اتصال */}
      {activeSubTab === 'connectionString' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* کارت راهنمای گام‌به‌گام */}
          <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-xs space-y-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold">
                <HelpCircle className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-slate-900 text-sm">چگونه Connection String را به Secrets اضافه کنیم؟</h4>
                <p className="text-xs text-slate-500">مراحل سریع در داشبورد Supabase و پنل هوش مصنوعی</p>
              </div>
            </div>

            <ol className="space-y-3.5 text-xs text-slate-700 leading-relaxed list-decimal list-inside pr-1">
              <li className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <strong className="text-slate-900">گام اول - دریافت رشته اتصال از Supabase:</strong>
                <p className="mt-1 text-slate-600">
                  وارد داشبورد پروژه خود در <a href="https://supabase.com" target="_blank" rel="noreferrer" className="text-emerald-700 font-bold inline-flex items-center gap-1">supabase.com <ExternalLink className="w-3 h-3" /></a> شوید. به مسیر <strong>Project Settings &gt; Database &gt; Connection String</strong> بروید و گزینه <strong>URI</strong> (ترجیحاً حالت Connection Pooling) را انتخاب کنید.
                </p>
              </li>

              <li className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <strong className="text-slate-900">گام دوم - جایگذاری رمز عبور دیتابیس:</strong>
                <p className="mt-1 text-slate-600">
                  در رشته کپی‌شده، عبارت <code className="bg-slate-200 px-1 py-0.5 rounded font-mono">[YOUR-PASSWORD]</code> را با رمز عبوری که موقع ساخت پروژه سوپابیس تعیین کردید جایگزین کنید.
                </p>
                <div className="mt-2 p-2 bg-slate-900 text-emerald-400 rounded-lg font-mono text-[11px] ltr text-left overflow-x-auto">
                  postgresql://postgres.[project-ref]:[db-password]@aws-0-[region].pooler.supabase.com:6543/postgres
                </div>
              </li>

              <li className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <strong className="text-slate-900">گام سوم - افزودن به پنل Secrets:</strong>
                <p className="mt-1 text-slate-600">
                  در منوی تنظیمات یا نوار ابزار، روی گزینه <strong>Secrets</strong> کلیک کرده، نام کلید را <strong>DATABASE_URL</strong> قرار دهید و رشته را در کادر مقدار جایگذاری کنید.
                </p>
              </li>

              <li className="p-3 bg-emerald-50 text-emerald-900 rounded-xl border border-emerald-200">
                <strong className="text-emerald-950">گام چهارم - ساخت خودکار جداول:</strong>
                <p className="mt-1 text-emerald-800">
                  روی دکمه <strong>«اجرای خودکار مایگریشن»</strong> در بالای همین صفحه کلیک کنید تا تمام ۱۱ جدول، ایندکس‌ها و مقادیر پیش‌فرض تعاونی‌ها در دیتابیس سوپابیس شما ساخته شوند!
                </p>
              </li>
            </ol>
          </div>

          {/* کارت تست و جایگزینی موقت رشته اتصال */}
          <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-xs space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold">
                  <Terminal className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">تست مستقیم و آنی رشته اتصال</h4>
                  <p className="text-xs text-slate-500">برای تست سریع بدون نیاز به ری‌استارت سرور</p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  رشته اتصال PostgreSQL / Supabase URI:
                </label>
                <textarea
                  rows={3}
                  value={testConnInput}
                  onChange={(e) => setTestConnInput(e.target.value)}
                  placeholder="postgresql://postgres.yourproject:password@aws-0-eu-central-1.pooler.supabase.com:6543/postgres"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-800 focus:bg-white focus:border-slate-400 focus:outline-hidden transition-all ltr text-left"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleTestConnection(testConnInput)}
                  disabled={isTestingCustom || !testConnInput.trim()}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Zap className="w-3.5 h-3.5 text-amber-400" />
                  <span>تست اتصال این رشته</span>
                </button>

                <button
                  type="button"
                  onClick={handleSaveRuntimeConnection}
                  disabled={isTestingCustom || !testConnInput.trim()}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>فعال‌سازی در برنامه</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setTestConnInput('');
                    dbClient.setConnectionString(null).then(() => refreshStatus());
                  }}
                  className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  بازنشانی
                </button>
              </div>

              <div className="p-3 bg-blue-50 text-blue-900 rounded-xl border border-blue-200 text-xs space-y-1">
                <p className="font-bold">نکته امنیتی:</p>
                <p className="text-blue-800 text-[11px] leading-relaxed">
                  پیشنهاد رسمی و استاندارد این است که رشته اتصال را در بخش <strong>Secrets</strong> با نام <code>DATABASE_URL</code> وارد کنید تا پس از رفرش صفحه نیز همیشه برقرار بماند.
                </p>
              </div>
            </div>
          </div>

        </div>
      )}

      {/* ۲. تب وضعیت زنده ۱۱ جدول دیتابیس */}
      {activeSubTab === 'tables' && (
        <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h4 className="font-black text-slate-900 text-base">بررسی سلامت و تعداد ردیف‌های جداول سامانه</h4>
              <p className="text-xs text-slate-500 mt-0.5">
                وضعیت لحظه‌ای ۱۱ جدول اصلی تعریف‌شده در PostgreSQL مسکن‌یار
              </p>
            </div>

            <button
              onClick={refreshStatus}
              disabled={isCheckingStatus}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer w-fit"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isCheckingStatus ? 'animate-spin' : ''}`} />
              <span>بازخوانی آمار جداول</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {DATABASE_TABLES.map(table => {
              const liveInfo = dbStatus?.tables?.find(t => t.name === table.name);
              const exists = liveInfo ? liveInfo.exists : null;
              const count = liveInfo ? liveInfo.count : null;

              return (
                <div 
                  key={table.name}
                  className={`p-4 rounded-2xl border transition-all ${
                    exists === true 
                      ? 'bg-emerald-50/50 border-emerald-200' 
                      : exists === false 
                      ? 'bg-red-50/40 border-red-200' 
                      : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono text-xs font-black text-slate-900">{table.name}</span>
                    {exists === true ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>موجود در DB</span>
                      </span>
                    ) : exists === false ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-800 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        <span>یافت نشد</span>
                      </span>
                    ) : (
                      <span className="text-[10px] text-slate-400 font-bold">نامشخص</span>
                    )}
                  </div>

                  <p className="text-xs text-slate-600 mb-2 font-medium">{table.title}</p>

                  <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-xs">
                    <span className="text-slate-500 text-[11px]">تعداد رکوردها:</span>
                    <strong className="font-bold text-slate-800">
                      {count !== null ? `${toPersianDigits(count)} ردیف` : '—'}
                    </strong>
                  </div>
                </div>
              );
            })}
          </div>

          {!isConnected && (
            <div className="p-4 bg-amber-50 text-amber-900 rounded-2xl border border-amber-200 text-xs flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
              <div>
                <p className="font-bold">پایگاه داده هنوز متصل نیست</p>
                <p className="text-amber-800 text-[11px] mt-0.5">
                  جهت دریافت و همگام‌سازی آمار جداول، لطفاً متغیر <code>DATABASE_URL</code> را در بخش Secrets تعریف کنید یا دکمه اجرای مایگریشن را بزنید.
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ۳. تب همگام‌سازی دوطرفه داده‌ها */}
      {activeSubTab === 'sync' && (
        <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-xs space-y-6">
          <div>
            <h4 className="font-black text-slate-900 text-base">همگام‌سازی داده‌های تعاونی‌ها و کاربران با دیتابیس</h4>
            <p className="text-xs text-slate-500 mt-0.5">
              انتقال داده‌های ثبت‌شده محلی به پایگاه داده ابری یا فراخوانی داده‌های ذخیره‌شده از سرور
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
              <div className="flex items-center gap-2.5">
                <Upload className="w-5 h-5 text-emerald-600" />
                <h5 className="font-bold text-slate-900 text-sm">ارسال به دیتابیس (Push / Sync to DB)</h5>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                تمام تعاونی‌ها، کاربران جدید و عضویت‌های ثبت‌شده در سامانه محلی را مستقیماً به دیتابیس سوپابیس ارسال و ذخیره می‌کند.
              </p>
              <button
                onClick={handleSyncAllToDb}
                disabled={isSyncing || !isConnected}
                className="w-full px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <Upload className={`w-4 h-4 ${isSyncing ? 'animate-bounce' : ''}`} />
                <span>{isSyncing ? 'در حال ارسال اطلاعات...' : 'ارسال تمام اطلاعات محلی به دیتابیس'}</span>
              </button>
            </div>

            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
              <div className="flex items-center gap-2.5">
                <Download className="w-5 h-5 text-blue-600" />
                <h5 className="font-bold text-slate-900 text-sm">دریافت از دیتابیس (Pull from DB)</h5>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                تعاونی‌ها و کاربران ذخیره‌شده در جداول ابری سوپابیس را دریافت کرده و در حافظه سامانه بارگذاری می‌کند.
              </p>
              <button
                onClick={handlePullFromDb}
                disabled={isPulling || !isConnected}
                className="w-full px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <Download className={`w-4 h-4 ${isPulling ? 'animate-bounce' : ''}`} />
                <span>{isPulling ? 'در حال دریافت اطلاعات...' : 'دریافت آخرین داده‌ها از دیتابیس'}</span>
              </button>
            </div>
          </div>

          {syncLogs.length > 0 && (
            <div className="bg-slate-900 text-slate-100 p-4 rounded-2xl font-mono text-xs space-y-1.5 max-h-56 overflow-y-auto">
              <div className="text-slate-400 text-[11px] pb-1 border-b border-slate-800">لاگ عملیات همگام‌سازی:</div>
              {syncLogs.map((log, idx) => (
                <div key={idx} className="leading-relaxed">{log}</div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ۴. تب کد SQL مایگریشن */}
      {activeSubTab === 'sqlScript' && (
        <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h4 className="font-black text-slate-900 text-base">اسکریپت ساختار DDL جداول مسکن‌یار</h4>
              <p className="text-xs text-slate-500 mt-0.5">
                این اسکریپت با کلیک روی «اجرای مایگریشن» خودکار اجرا می‌شود یا می‌توانید آن را در تب SQL Editor سوپابیس کپی کنید.
              </p>
            </div>

            <button
              onClick={() => handleCopy(quickSqlSnippet, 'sqlSnippet')}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer w-fit"
            >
              {copiedType === 'sqlSnippet' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedType === 'sqlSnippet' ? 'کپی شد!' : 'کپی اسکریپت'}</span>
            </button>
          </div>

          <div className="bg-slate-900 text-emerald-300 p-4 rounded-2xl font-mono text-xs leading-relaxed ltr text-left overflow-x-auto max-h-96">
            <pre>{quickSqlSnippet}</pre>
          </div>
        </div>
      )}

    </div>
  );
};
