import React, { useState } from 'react';
import { 
  BookOpen, 
  ShieldCheck, 
  Building2, 
  User, 
  Terminal, 
  FileText, 
  Download, 
  Printer, 
  CheckCircle2, 
  ChevronLeft, 
  Coins, 
  CalendarDays, 
  Sparkles, 
  Trash2, 
  Key,
  ExternalLink,
  HelpCircle,
  Copy,
  Check
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const SystemDocsViewer: React.FC = () => {
  const { session } = useAuth();
  const defaultRoleTab = session?.activeRole === 'SUPER_ADMIN' 
    ? 'super_admin' 
    : session?.activeRole === 'COOP_ADMIN' 
    ? 'coop_admin' 
    : 'member';

  const [activeDocTab, setActiveDocTab] = useState<'super_admin' | 'coop_admin' | 'member' | 'docker'>(defaultRoleTab);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(id);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* هدر بخش مستندات */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 rounded-3xl p-6 sm:p-8 text-white shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="p-2 bg-indigo-500/20 text-indigo-300 rounded-xl border border-indigo-500/30">
                <BookOpen className="w-5 h-5" />
              </span>
              <span className="text-xs font-bold text-indigo-300">مستندات و کتابچه راهنمای رسمی سامانه مسکن‌یار</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black">
              راهنمای گام‌به‌گام کارکرد با سامانه برای کلیه نقش‌ها
            </h2>
            <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
              راهنمای تفصیلی عملیات، حقوق و دسترسی‌ها، فرایندهای مالی و استقرار فنی به تفکیک برای مدیران ارشد، مدیران تعاونی و اعضای سهام‌دار به همراه فایل‌های مستندات در پوشه <code className="bg-white/10 px-2 py-0.5 rounded text-emerald-300">/docs</code> سامانه.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => window.print()}
              className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs font-bold flex items-center gap-2 transition-colors cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>چاپ مستندات</span>
            </button>
          </div>
        </div>
      </div>

      {/* تب‌های انتخاب نقش */}
      <div className="bg-white p-2 rounded-2xl border border-slate-200/80 shadow-xs flex flex-wrap gap-2">
        <button
          onClick={() => setActiveDocTab('super_admin')}
          className={`flex-1 min-w-[140px] px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 ${
            activeDocTab === 'super_admin'
              ? 'bg-purple-900 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <ShieldCheck className="w-4 h-4 text-purple-400" />
          <span>مدیر ارشد سامانه (Super Admin)</span>
        </button>

        <button
          onClick={() => setActiveDocTab('coop_admin')}
          className={`flex-1 min-w-[140px] px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 ${
            activeDocTab === 'coop_admin'
              ? 'bg-amber-900 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Building2 className="w-4 h-4 text-amber-400" />
          <span>مدیر تعاونی مسکن (Coop Admin)</span>
        </button>

        <button
          onClick={() => setActiveDocTab('member')}
          className={`flex-1 min-w-[140px] px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 ${
            activeDocTab === 'member'
              ? 'bg-emerald-900 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <User className="w-4 h-4 text-emerald-400" />
          <span>عضو و خریدار واحد (Member)</span>
        </button>

        <button
          onClick={() => setActiveDocTab('docker')}
          className={`flex-1 min-w-[140px] px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 ${
            activeDocTab === 'docker'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Terminal className="w-4 h-4 text-emerald-400" />
          <span>استقرار با داکر (PostgreSQL & VPS)</span>
        </button>
      </div>

      {/* محتوای راهنما بر اساس تب فعال */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-8 leading-relaxed text-slate-800">
        
        {/* ۱. راهنمای مدیر ارشد */}
        {activeDocTab === 'super_admin' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="border-b border-slate-100 pb-4 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-purple-600" />
                  <span>راهنمای جامع مدیر ارشد سامانه (Super Admin)</span>
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  فایل مرجع در سورس کد: <code className="bg-slate-100 px-2 py-0.5 rounded text-purple-700 font-mono">docs/SUPER_ADMIN_GUIDE.md</code>
                </p>
              </div>
              <span className="text-xs font-bold px-3 py-1 bg-purple-50 text-purple-800 border border-purple-200 rounded-full">
                بالاترین سطح دسترسی
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-purple-50/50 border border-purple-100 space-y-2">
                <h4 className="font-bold text-xs text-purple-950 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-purple-600" />
                  <span>۱. تعریف و تنظیم پروژه‌ها و تعاونی‌های مسکن</span>
                </h4>
                <p className="text-xs text-slate-600">
                  از منوی «پروژه‌ها و تعاونی‌ها» می‌توانید تعاونی‌های حقوقی جدید، شماره ثبت، شناسه ملی، نام پروژه، تعداد کل واحدها و حساب بانکی رسمی (شبا و بانک عامل) را ثبت نمایید.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-purple-50/50 border border-purple-100 space-y-2">
                <h4 className="font-bold text-xs text-purple-950 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-purple-600" />
                  <span>۲. انتصاب مدیران تعاونی‌ها و کنترل نقش‌ها</span>
                </h4>
                <p className="text-xs text-slate-600">
                  در منوی «اعضای تعاونی»، مدیران جدید را با مشخصات و شماره موبایل ثبت نموده و نقش آن‌ها را به عنوان <code className="text-purple-700 font-bold">COOP_ADMIN</code> تعیین نمایید.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-purple-50/50 border border-purple-100 space-y-2">
                <h4 className="font-bold text-xs text-purple-950 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-purple-600" />
                  <span>۳. نظارت سراسری بر سطل بازیافت و حذف ایمن</span>
                </h4>
                <p className="text-xs text-slate-600">
                  تمامی حذفیات در سامانه (تعاونی، کاربر، واحد، قسط، شارژ) از نوع Soft Delete هستند. مدیر ارشد در «سطل بازیافت» می‌تواند رکوردها را با یک کلیک بازیابی کرده یا در صورت لزوم به صورت دائمی حذف نماید.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-purple-50/50 border border-purple-100 space-y-2">
                <h4 className="font-bold text-xs text-purple-950 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-purple-600" />
                  <span>۴. تفکیک معماری چندمستأجری (Multi-Tenancy)</span>
                </h4>
                <p className="text-xs text-slate-600">
                  داده‌های هر تعاونی به صورت مجزا بر اساس شناسه تعاونی فیلتر می‌شوند. مدیر ارشد می‌تواند از طریق منوی جابجایی بین مستأجرها (Tenant Switcher) در بالای صفحه به تمام تعاونی‌ها سوییچ کند.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ۲. راهنمای مدیر تعاونی */}
        {activeDocTab === 'coop_admin' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="border-b border-slate-100 pb-4 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-amber-600" />
                  <span>راهنمای جامع مدیر تعاونی مسکن (Cooperative Manager)</span>
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  فایل مرجع در سورس کد: <code className="bg-slate-100 px-2 py-0.5 rounded text-amber-700 font-mono">docs/COOP_ADMIN_GUIDE.md</code>
                </p>
              </div>
              <span className="text-xs font-bold px-3 py-1 bg-amber-50 text-amber-800 border border-amber-200 rounded-full">
                مدیریت اجرایی و مالی
              </span>
            </div>

            <div className="space-y-4">
              
              {/* اعتبارسنجی کد ملی */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <h4 className="font-bold text-xs text-slate-900 flex items-center gap-2">
                  <User className="w-4 h-4 text-emerald-600" />
                  <span>ثبت عضو جدید و رفع خطای کد ملی</span>
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  هنگام ثبت عضو، سامانه کد ملی را با الگوریتم مخرج ۱۱ اعتبارسنجی می‌کند. اگر کدی صفرهای اولیه دارد، صفرهای آن حفظ می‌شوند. علاوه بر آن:
                </p>
                <ul className="list-disc list-inside text-xs text-slate-600 space-y-1 pr-2">
                  <li><strong>کدهای ملی نمونه معتبر:</strong> دکمه‌های درج سریع کد ملی برای راحتی در تست تعبیه شده‌اند.</li>
                  <li><strong>حالت ثبت تستی و آزاد (Bypass Mod 11):</strong> با فعال‌سازی این کلید در فرم، اعتبارسنجی عبور کرده و دکمه ثبت هرگز قفل نمی‌شود.</li>
                </ul>
              </div>

              {/* صدور شارژ و هزینه‌های جاری */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <h4 className="font-bold text-xs text-slate-900 flex items-center gap-2">
                  <Coins className="w-4 h-4 text-emerald-600" />
                  <span>صدور گواهی هزینه و شارژ (انفرادی و گروهی)</span>
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  در تب «شارژ و خدمات جاری» قابلیت‌های ویژه زیر برای مدیر در دسترس است:
                </p>
                <ul className="list-disc list-inside text-xs text-slate-600 space-y-1 pr-2">
                  <li><strong>صدور برای یک عضو به همراه تعداد ماه‌ها:</strong> می‌توانید فیلتر را روی «عضو مشخص» قرار داده و تعداد ماه‌های متوالی (مثلاً ۶ ماه شارژ متوالی) را وارد کنید.</li>
                  <li><strong>افزودن دسته‌بندی دلخواه:</strong> در کنار فهرست دسته‌بندی‌ها دکمه «+ افزودن دسته جدید» تعبیه شده است.</li>
                  <li><strong>ویرایش و حذف گواهی‌ها:</strong> روی هر گواهی صادرشده، دکمه ویرایش (تغییر مبلغ، عنوان، سررسید) و دکمه حذف ایمن با انتقال به سطل بازیافت وجود دارد.</li>
                  <li><strong>تسویه مستقیم با تاریخ شمسی:</strong> برای پرداخت‌های نقدی یا کارت‌به‌کارت اعضا، مدیر می‌تواند با تقویم شمسی تاریخ دقیق پرداخت را ثبت و گواهی را تسویه نماید.</li>
                </ul>
              </div>

              {/* اقساط ساختمانی */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <h4 className="font-bold text-xs text-slate-900 flex items-center gap-2">
                  <CalendarDays className="w-4 h-4 text-indigo-600" />
                  <span>صدور اقساط ساختمانی با تعیین تعداد ماه و صدور گروهی</span>
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  در تب «اقساط ساختمانی»:
                </p>
                <ul className="list-disc list-inside text-xs text-slate-600 space-y-1 pr-2">
                  <li>امکان صدور گروهی برنامه اقساط برای «تمام اعضای دارای واحد» در پروژه تنها با یک کلیک وجود دارد.</li>
                  <li>می‌توانید «تعداد ماه‌های اقساط» (مثلاً ۱۲، ۲۴، ۳۶ ماه) را مشخص کنید تا مبالغ و سررسیدها به صورت هوشمند بین ماه‌های آتی تقسیم شوند.</li>
                  <li>حذف برنامه‌های اقساط نیز ایمن بوده و در صورت نیاز از سطل بازیافت قابل بازیابی است.</li>
                </ul>
              </div>

              {/* داشبورد هوشمند هوش مصنوعی */}
              <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200 space-y-2">
                <h4 className="font-bold text-xs text-emerald-950 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-emerald-600" />
                  <span>داشبورد هوشمند مالی تعاونی با هوش مصنوعی Groq AI</span>
                </h4>
                <p className="text-xs text-slate-700 leading-relaxed">
                  در تب «داشبورد هوشمند مالی (Groq AI)»، هوش مصنوعی پیشرفته با تحلیل داده‌های واقعی تعاونی، گزارش جامعی از تراز نقدینگی، پیش‌بینی وصول مطالبات، نمره سلامت مالی و پیشنهادات استراتژیک برای هیئت مدیره تولید می‌کند.
                </p>
              </div>

            </div>
          </div>
        )}

        {/* ۳. راهنمای اعضا و خریداران */}
        {activeDocTab === 'member' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="border-b border-slate-100 pb-4 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                  <User className="w-4 h-4 text-emerald-600" />
                  <span>راهنمای جامع عضو و خریدار واحد مسکونی (Member)</span>
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  فایل مرجع در سورس کد: <code className="bg-slate-100 px-2 py-0.5 rounded text-emerald-700 font-mono">docs/MEMBER_GUIDE.md</code>
                </p>
              </div>
              <span className="text-xs font-bold px-3 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-full">
                کارتابل عضویت
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-sm">
                  ۱
                </div>
                <h4 className="font-bold text-xs text-slate-900">مشاهده پرونده و واحد تخصیص‌یافته</h4>
                <p className="text-xs text-slate-600">
                  اطلاعات بلوک، طبقه، شماره واحد، متراژ و پیشرفت فیزیکی پروژه را در کارتابل مشاهده نمایید.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-sm">
                  ۲
                </div>
                <h4 className="font-bold text-xs text-slate-900">پرداخت اقساط ساختمانی</h4>
                <p className="text-xs text-slate-600">
                  سررسیدهای قسط را با تاریخ شمسی بررسی کرده و به صورت مستقیم از درگاه شاپرک پرداخت نمایید یا فیش بانکی بارگذاری کنید.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-sm">
                  ۳
                </div>
                <h4 className="font-bold text-xs text-slate-900">پرداخت شارژ و دریافت رسید دیجیتال</h4>
                <p className="text-xs text-slate-600">
                  شارژ ماهیانه و خدمات مجتمع را آنلاین پرداخت کرده و رسید رسمی ممهور به QR-Code را دریافت و چاپ نمایید.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ۴. راهنمای استقرار با داکر */}
        {activeDocTab === 'docker' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="border-b border-slate-100 pb-4 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                  <Terminal className="w-5 h-5 text-emerald-600" />
                  <span>راهنمای استقرار سرور با Docker & PostgreSQL</span>
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  فایل مرجع در سورس کد: <code className="bg-slate-100 px-2 py-0.5 rounded text-emerald-700 font-mono">docs/DOCKER_DEPLOYMENT.md</code>
                </p>
              </div>
              <span className="text-xs font-bold px-3 py-1 bg-slate-100 text-slate-800 border border-slate-200 rounded-full font-mono">
                docker-compose.yml
              </span>
            </div>

            <div className="space-y-4">
              
              <div className="p-4 rounded-2xl bg-slate-900 text-slate-100 font-mono text-xs space-y-2">
                <div className="flex items-center justify-between text-slate-400 text-[11px] pb-1 border-b border-slate-800">
                  <span>دستور راه‌اندازی سریع دیتابیس PostgreSQL در داکر:</span>
                  <button
                    onClick={() => copyToClipboard('docker compose up -d postgres pgadmin', 'cmd1')}
                    className="text-emerald-400 hover:text-emerald-300 flex items-center gap-1 cursor-pointer"
                  >
                    {copiedCode === 'cmd1' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedCode === 'cmd1' ? 'کپی شد' : 'کپی دستور'}</span>
                  </button>
                </div>
                <div className="dir-ltr text-emerald-400 font-bold">
                  docker compose up -d postgres pgadmin
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-900 text-slate-100 font-mono text-xs space-y-2">
                <div className="flex items-center justify-between text-slate-400 text-[11px] pb-1 border-b border-slate-800">
                  <span>کانکشن استرینگ استاندارد اتصال به این پایگاه داده:</span>
                  <button
                    onClick={() => copyToClipboard('postgresql://postgres:maskanyar_secret_password@localhost:5432/maskanyar', 'conn')}
                    className="text-emerald-400 hover:text-emerald-300 flex items-center gap-1 cursor-pointer"
                  >
                    {copiedCode === 'conn' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedCode === 'conn' ? 'کپی شد' : 'کپی کانکشن استرینگ'}</span>
                  </button>
                </div>
                <div className="dir-ltr text-amber-300 font-bold overflow-x-auto whitespace-nowrap">
                  postgresql://postgres:maskanyar_secret_password@localhost:5432/maskanyar
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-900 text-slate-100 font-mono text-xs space-y-2">
                <div className="flex items-center justify-between text-slate-400 text-[11px] pb-1 border-b border-slate-800">
                  <span>دستور بیلد و اجرای کل استک (وب اپلیکیشن + دیتابیس + pgAdmin):</span>
                  <button
                    onClick={() => copyToClipboard('docker compose up --build -d', 'cmd2')}
                    className="text-emerald-400 hover:text-emerald-300 flex items-center gap-1 cursor-pointer"
                  >
                    {copiedCode === 'cmd2' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedCode === 'cmd2' ? 'کپی شد' : 'کپی دستور'}</span>
                  </button>
                </div>
                <div className="dir-ltr text-emerald-400 font-bold">
                  docker compose up --build -d
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-1">
                <div className="font-bold text-slate-800">پورت‌های باز روی سرور پس از اجرا:</div>
                <div>• پورت <span className="font-mono font-bold text-slate-800">3000</span>: سامانه وب مسکن‌یار</div>
                <div>• پورت <span className="font-mono font-bold text-slate-800">5432</span>: دیتابیس اصلی PostgreSQL (با ساخت خودکار جداول از فایل migration)</div>
                <div>• پورت <span className="font-mono font-bold text-slate-800">5050</span>: پنل مدیریت گرافیکی pgAdmin 4 (ایمیل: admin@maskanyar.ir | پسورد: admin123)</div>
              </div>

            </div>
          </div>
        )}

      </div>

    </div>
  );
};
