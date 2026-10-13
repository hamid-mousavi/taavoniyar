import React from 'react';
import { 
  Cpu, 
  Layers, 
  Server, 
  Database, 
  ShieldAlert, 
  FileCheck, 
  Sparkles, 
  CheckCircle2, 
  ArrowLeft,
  Coins,
  Lock,
  Workflow
} from 'lucide-react';

export const ArchitectureProposal: React.FC = () => {
  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      {/* پیام شروع به کار و موضع مهندس ارشد */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-3xl p-6 sm:p-8 text-white shadow-xl">
        <div className="max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 bg-emerald-500/20 text-emerald-300 text-xs px-3 py-1 rounded-full font-bold border border-emerald-500/30">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            فاز ۰ با موفقیت طراحی و آماده‌سازی شد
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight leading-snug">
            طرح جامع معماری و مدل داده سامانه مدیریت تعاونی‌های مسکن
          </h2>
          <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
            مطابق با دستور شما به عنوان مهندس ارشد، تمامی زیرساخت‌های پایگاه‌داده، مدل‌های رابطه ای، قوانین محاسباتی ریالی،
            تفکیک سخت‌گیرانه چندمستأجری (Multi-Tenancy) و داده‌های آزمایشی آماده شده است. پس از بررسی این گزارش و تایید شما، وارد فاز بعدی خواهیم شد.
          </p>
        </div>
      </div>

      {/* ۱. تحلیل و پیشنهاد پشته فناوری (Tech Stack Recommendation) */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
        <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Server className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">تحلیل پشته فناوری (پیشنهاد و تایید فنی)</h3>
            <p className="text-xs text-slate-500">بررسی گزینه‌های پیشنهادی شما در مقایسه با استاندارد پروژه‌های حساس مالی</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500">پایگاه‌داده</span>
              <span className="bg-emerald-100 text-emerald-700 text-[10px] px-2 py-0.5 rounded-md font-bold">تایید قطعی</span>
            </div>
            <h4 className="font-bold text-slate-900">PostgreSQL (رابطه‌ای)</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              تعاونی‌های مسکن دارای تراکنش‌های حساس مالی، چک و فیش هستند. سازگاری ACID در PostgreSQL و استفاده از کلیدهای خارجی و ایندکس‌های کامپوزیت روی <code className="bg-slate-200 px-1 py-0.5 rounded text-[11px]">cooperative_id</code> الزامی است.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500">لایه ORM</span>
              <span className="bg-indigo-100 text-indigo-700 text-[10px] px-2 py-0.5 rounded-md font-bold">Prisma / Drizzle</span>
            </div>
            <h4 className="font-bold text-slate-900">TypeScript Type-Safety</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              استفاده از سیستم تایپ امن برای جلوگیری از ارسال مبالغ با ممیز شناور و فیلتر خودکار بر اساس کانتکست تعاونی کاربر.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500">ذخیره‌سازی فیش‌ها</span>
              <span className="bg-emerald-100 text-emerald-700 text-[10px] px-2 py-0.5 rounded-md font-bold">S3 / MinIO</span>
            </div>
            <h4 className="font-bold text-slate-900">Object Storage امن</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              تصاویر رسیدها با محدودیت ۲ مگابایت، پسوندهای اعتبارسنجی‌شده (JPEG/PNG/PDF) و تخصیص آدرس‌های زمان‌دار یا اختصاصی ذخیره می‌شوند.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500">رابط کاربری و ظاهر</span>
              <span className="bg-emerald-100 text-emerald-700 text-[10px] px-2 py-0.5 rounded-md font-bold">بومی‌سازی کامل</span>
            </div>
            <h4 className="font-bold text-slate-900">Tailwind + Vazirmatn</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              چیدمان کاملاً راست‌به‌چپ (RTL)، تایپوگرافی وزیرمتن، نمایش تمامی مبالغ با ارقام فارسی و تقویم شمسی دقیق.
            </p>
          </div>

        </div>
      </div>

      {/* ۲. اصول اساسی و خطوط قرمز مهندسی در سیستم */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <Coins className="w-5 h-5" />
          </div>
          <h4 className="font-bold text-slate-900">قانون محاسبات مالی: ریال عدد صحیح</h4>
          <p className="text-xs text-slate-600 leading-relaxed">
            هیچ فیلد مبلغی اعشاری (<code className="bg-slate-100 px-1 py-0.5 rounded text-[11px]">FLOAT/REAL</code>) مجاز نیست. نوع داده <code className="bg-slate-100 px-1 py-0.5 rounded text-[11px]">BIGINT</code> استفاده شده تا حتی با ریال‌های چند صد میلیاردی از خطای سرریز (Overflow) و از بین رفتن حتی ۱ ریال جلوگیری شود.
          </p>
        </div>

        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-3">
          <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
            <Lock className="w-5 h-5" />
          </div>
          <h4 className="font-bold text-slate-900">امنیت چندمستأجری در لایه داده</h4>
          <p className="text-xs text-slate-600 leading-relaxed">
            تفکیک دسترسی تعاونی‌ها صرفاً یک فیلتر در ظاهر نیست؛ تمام کوئری‌های دیتابیس در لایه سرور بر اساس نقش و شناسه تعاونی کانتکست کاربر محصور می‌گردند. مدیر تعاونی ۱ به هیچ عنوان نمی‌تواند داده تعاونی ۲ را استخراج کند.
          </p>
        </div>

        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-3">
          <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
            <Workflow className="w-5 h-5" />
          </div>
          <h4 className="font-bold text-slate-900">دفترکل حسابرسی (Audit Log) تغییرناپذیر</h4>
          <p className="text-xs text-slate-600 leading-relaxed">
            هر عمل مالی (واریز آنلاین، ثبت فیش، تایید فیش توسط مدیر، رد رسید با ذکر علت) همراه با وضعیت قبلی و بعدی، آی‌پی و مشخصات کاربر در جدول <code className="bg-slate-100 px-1 py-0.5 rounded text-[11px]">audit_logs</code> ذخیره می‌شود.
          </p>
        </div>

      </div>

      {/* ۳. نقشه راه فازبندی شده (Roadmap) */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
        <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">نقشه راه اجرای فازها (گام‌به‌گام با تایید کاربر)</h3>
            <p className="text-xs text-slate-500">هر فاز پس از اتمام کامل و آزمایش توسط شما، به فاز بعد منتقل می‌شود</p>
          </div>
        </div>

        <div className="space-y-4">
          
          {/* فاز ۰ */}
          <div className="p-5 rounded-2xl bg-emerald-50/70 border-2 border-emerald-300 relative">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="bg-emerald-600 text-white text-xs px-2.5 py-0.5 rounded-full font-bold">فاز ۰ (فعلی)</span>
                  <h4 className="font-bold text-slate-900">پایه، معماری و مدل داده رابطه ای ۱۰ گانه</h4>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  تعریف ساختار کامل جداول، کلیدهای خارجی، ایندکس‌ها، ابزارهای بومی‌سازی تقویم شمسی و مبالغ، سید داده ۳ تعاونی و ۱۰ عضو، و سوئیت آزمون‌های اولیه.
                </p>
              </div>
              <span className="shrink-0 bg-emerald-200 text-emerald-900 text-xs px-3 py-1 rounded-xl font-bold flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                تکمیل شده
              </span>
            </div>
          </div>

          {/* فاز ۱ */}
          <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="bg-slate-200 text-slate-800 text-xs px-2.5 py-0.5 rounded-full font-bold">فاز ۱ (گام بعدی)</span>
                  <h4 className="font-bold text-slate-900">احراز هویت پیامکی (OTP) و مدیریت سشن چندمستأجری</h4>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  ورود امن با شماره موبایل و کد یکبارمصرف، تشخیص خودکار نقش کاربر (مدیر کل، مدیر تعاونی، عضو) و انتخاب تعاونی فعال، صدور توکن و هدایت به داشبورد اختصاصی.
                </p>
              </div>
              <span className="shrink-0 text-xs font-semibold text-slate-400">در انتظار تایید فاز ۰</span>
            </div>
          </div>

          {/* فاز ۲ */}
          <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="bg-slate-200 text-slate-800 text-xs px-2.5 py-0.5 rounded-full font-bold">فاز ۲</span>
                  <h4 className="font-bold text-slate-900">مدیریت تعاونی‌ها، اعضا، واحدها و تقویم اقساط</h4>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  داشبورد مدیر کل (مشاهده تمام تعاونی‌ها)، داشبورد مدیر تعاونی (تعریف بلوک و واحد، تخصیص به عضو، تقویم مراحل ساخت و صدور اقساط).
                </p>
              </div>
              <span className="shrink-0 text-xs font-semibold text-slate-400">فازهای آینده</span>
            </div>
          </div>

          {/* فاز ۳ */}
          <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="bg-slate-200 text-slate-800 text-xs px-2.5 py-0.5 rounded-full font-bold">فاز ۳</span>
                  <h4 className="font-bold text-slate-900">ماژول مالی: پرداخت آنلاین ساندباکس و گردش‌کار بارگذاری فیش دستی</h4>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  درگاه شبیه‌سازی شده پرداخت آنلاین بانکی، فرم بارگذاری فیش با پیش‌نمایش تصویر و کنترل حجم، کارتابل تایید یا رد فیش توسط مدیر با پیام علت رد، ثبت در لاگ.
                </p>
              </div>
              <span className="shrink-0 text-xs font-semibold text-slate-400">فازهای آینده</span>
            </div>
          </div>

          {/* فاز ۴ */}
          <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="bg-slate-200 text-slate-800 text-xs px-2.5 py-0.5 rounded-full font-bold">فاز ۴</span>
                  <h4 className="font-bold text-slate-900">سیستم اطلاع‌رسانی و تابلوی اعلانات + دفترکل حسابرسی</h4>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  ارسال اطلاعیه اختصاصی تعاونی یا سراسری، اولویت‌بندی، فیلتر اطلاعیه‌ها، گزارش‌های جامع مالی، خروجی اکسل/PDF و ممیزی رویدادهای مالی.
                </p>
              </div>
              <span className="shrink-0 text-xs font-semibold text-slate-400">فازهای آینده</span>
            </div>
          </div>

          {/* فاز ۵ */}
          <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="bg-slate-200 text-slate-800 text-xs px-2.5 py-0.5 rounded-full font-bold">فاز ۵</span>
                  <h4 className="font-bold text-slate-900">قابلیت‌های هوش مصنوعی (AI Assistant & OCR)</h4>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  خلاصه هوشمند گزارش‌های مالی تعاونی، نگارش خودکار پیش‌نویس پیامک یادآوری اقساط به زبان محترمانه، خواندن خودکار ارقام و شماره ارجاع فیش‌های بانکی با Gemini Vision، و پاسخ هوشمند به سوالات وضعیت عضو.
                </p>
              </div>
              <span className="shrink-0 text-xs font-semibold text-slate-400">فاز نهایی</span>
            </div>
          </div>

        </div>
      </div>

    </div>
  );
};
