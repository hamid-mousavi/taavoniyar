import React, { useState, useEffect } from 'react';
import { 
  Phone, 
  ShieldCheck, 
  KeyRound, 
  ArrowRight, 
  RefreshCw, 
  UserCheck, 
  MessageSquare, 
  Sparkles,
  AlertCircle,
  Building2,
  CheckCircle2,
  X
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { OtpInput } from './OtpInput';
import { toPersianDigits, isValidIranianMobile } from '../../utils/persian';
import { seedUsers, seedCooperatives } from '../../data/seedData';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose }) => {
  const { 
    requestOtp, 
    verifyOtp, 
    isLoading, 
    error, 
    simulatedOtpCode, 
    otpExpiresAt, 
    quickLoginAs 
  } = useAuth();

  const [step, setStep] = useState<'MOBILE' | 'OTP'>('MOBILE');
  const [mobile, setMobile] = useState<string>('');
  const [otpCode, setOtpCode] = useState<string>('');
  const [timeLeft, setTimeLeft] = useState<number>(120);
  const [localError, setLocalError] = useState<string | null>(null);

  // تایمر شمارش معکوس کد پیامک
  useEffect(() => {
    if (step !== 'OTP' || !otpExpiresAt) return;

    const interval = setInterval(() => {
      const remainingSeconds = Math.max(0, Math.round((otpExpiresAt - Date.now()) / 1000));
      setTimeLeft(remainingSeconds);
      if (remainingSeconds <= 0) {
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [step, otpExpiresAt]);

  if (!isOpen) return null;

  // مرحله اول: ارسال کد تایید به شماره موبایل
  const handleSendMobile = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setLocalError(null);

    const cleanMobile = mobile.replace(/[۰-۹]/g, d => String(d.charCodeAt(0) - 1776)).trim();

    if (!isValidIranianMobile(cleanMobile)) {
      setLocalError('شماره موبایل باید با ۰۹ شروع شده و ۱۱ رقم باشد.');
      return;
    }

    const res = await requestOtp(cleanMobile);
    if (res.success) {
      setStep('OTP');
      setOtpCode('');
      setTimeLeft(120);
    } else {
      setLocalError(res.message);
    }
  };

  // مرحله دوم: بررسی کد OTP
  const handleVerifyOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setLocalError(null);

    const cleanMobile = mobile.replace(/[۰-۹]/g, d => String(d.charCodeAt(0) - 1776)).trim();
    const cleanCode = otpCode.replace(/[۰-۹]/g, d => String(d.charCodeAt(0) - 1776)).trim();

    if (cleanCode.length !== 5) {
      setLocalError('لطفاً کد تایید ۵ رقمی را کامل وارد نمایید.');
      return;
    }

    const res = await verifyOtp(cleanMobile, cleanCode);
    if (res.success) {
      onClose();
    } else {
      setLocalError(res.message);
    }
  };

  // استفاده از کد شبیه‌سازی‌شده با یک کلیک
  const fillSimulatedCode = () => {
    if (simulatedOtpCode) {
      setOtpCode(simulatedOtpCode);
    }
  };

  // ورود مستقیم با نقش‌های تستی
  const handleQuickLogin = (userId: string) => {
    quickLoginAs(userId);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-slate-200 overflow-hidden relative">
        
        {/* دکمه بستن */}
        <button
          onClick={onClose}
          className="absolute top-5 left-5 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* سربرگ مودال */}
        <div className="p-6 sm:p-8 bg-slate-900 text-white text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-linear-to-tr from-emerald-500 to-teal-400 mx-auto flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
            <Building2 className="w-7 h-7" />
          </div>
          <h3 className="text-xl font-black">ورود به سامانه مسکن‌یار</h3>
          <p className="text-xs text-slate-400">
            احراز هویت دومرحله‌ای با رمز یکبارمصرف پیامکی (OTP)
          </p>
        </div>

        {/* بدنه فرم */}
        <div className="p-6 sm:p-8 space-y-6">
          
          {/* نمایش خطاها */}
          {(localError || error) && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 flex items-start gap-2.5 text-xs text-rose-800 animate-in shake">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{localError || error}</span>
            </div>
          )}

          {step === 'MOBILE' ? (
            /* گام ۱: وارد کردن شماره موبایل */
            <form onSubmit={handleSendMobile} className="space-y-5">
              <div className="space-y-1.5 text-right">
                <label className="text-xs font-bold text-slate-700">شماره تلفن همراه</label>
                <div className="relative">
                  <input
                    type="tel"
                    dir="ltr"
                    placeholder="09123456789"
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value)}
                    className="w-full text-left font-mono text-base px-4 py-3.5 pr-10 rounded-2xl border border-slate-300 focus:border-emerald-600 focus:ring-3 focus:ring-emerald-500/15 outline-none transition-all placeholder:text-slate-300"
                    autoFocus
                  />
                  <Phone className="w-4 h-4 text-slate-400 absolute right-3.5 top-4 pointer-events-none" />
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  کد یکبارمصرف به این شماره پیامک خواهد شد.
                </p>
              </div>

              <button
                type="submit"
                disabled={isLoading || !mobile}
                className="w-full bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-bold py-3.5 rounded-2xl text-sm transition-all shadow-md cursor-pointer flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <span>دریافت کد تایید پیامکی</span>
                    <ArrowRight className="w-4 h-4 rotate-180" />
                  </>
                )}
              </button>

              {/* بخش دسترسی سریع تستی برای ارزیابی نقش‌ها */}
              <div className="pt-4 border-t border-slate-100 space-y-3">
                <div className="flex items-center justify-between text-xs text-slate-500 font-semibold">
                  <span className="flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    ورود سریع تستی (یک‌کلیک بدون پیامک):
                  </span>
                </div>
                <div className="grid grid-cols-1 gap-2">
                  <button
                    type="button"
                    onClick={() => handleQuickLogin('user-superadmin')}
                    className="p-2.5 rounded-xl bg-purple-50 hover:bg-purple-100 border border-purple-200 text-purple-900 text-xs font-bold flex items-center justify-between transition-colors cursor-pointer text-right"
                  >
                    <span>مدیر کل (مهندس شایسته)</span>
                    <span className="font-mono text-[10px] text-purple-700 bg-purple-200/60 px-2 py-0.5 rounded">Super Admin</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleQuickLogin('user-admin-coop1')}
                    className="p-2.5 rounded-xl bg-sky-50 hover:bg-sky-100 border border-sky-200 text-sky-900 text-xs font-bold flex items-center justify-between transition-colors cursor-pointer text-right"
                  >
                    <span>مدیر تعاونی ۱ فرهنگیان (دکتر مهدوی)</span>
                    <span className="font-mono text-[10px] text-sky-700 bg-sky-200/60 px-2 py-0.5 rounded">Coop Admin</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleQuickLogin('user-member-1')}
                    className="p-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-900 text-xs font-bold flex items-center justify-between transition-colors cursor-pointer text-right"
                  >
                    <span>عضو تعاونی فرهنگیان (علی مرادی - واحد ۱۰۱)</span>
                    <span className="font-mono text-[10px] text-emerald-700 bg-emerald-200/60 px-2 py-0.5 rounded">Member</span>
                  </button>
                </div>
              </div>
            </form>
          ) : (
            /* گام ۲: وارد کردن کد تایید OTP */
            <form onSubmit={handleVerifyOtp} className="space-y-5">
              
              {/* شبیه‌ساز پیامک دریافتی در سیستم */}
              {simulatedOtpCode && (
                <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 space-y-1.5 animate-in slide-in-from-top-2">
                  <div className="flex items-center justify-between text-xs font-bold text-emerald-900">
                    <span className="flex items-center gap-1.5">
                      <MessageSquare className="w-4 h-4 text-emerald-600" />
                      شبیه‌ساز پیامک دریافتی کاربر:
                    </span>
                    <button
                      type="button"
                      onClick={fillSimulatedCode}
                      className="text-[11px] bg-emerald-600 text-white px-2 py-0.5 rounded-lg hover:bg-emerald-700 transition-colors cursor-pointer"
                    >
                      درج خودکار کد
                    </button>
                  </div>
                  <p className="text-xs text-emerald-800 leading-relaxed">
                    «مسکن‌یار: کد تایید ورود شما <span className="font-mono font-bold text-sm bg-white px-1.5 py-0.5 rounded border border-emerald-300">{simulatedOtpCode}</span> است. (اعتبار ۲ دقیقه)»
                  </p>
                </div>
              )}

              <div className="space-y-3 text-center">
                <div className="text-xs text-slate-600">
                  کد ۵ رقمی ارسال‌شده به شماره <span className="font-mono font-bold text-slate-900">{toPersianDigits(mobile)}</span> را وارد کنید:
                </div>

                {/* کامپوننت فیلدهای ورودی ۵ رقمی */}
                <OtpInput
                  length={5}
                  value={otpCode}
                  onChange={setOtpCode}
                  disabled={isLoading}
                />

                {/* شمارش معکوس */}
                <div className="text-xs text-slate-500 flex items-center justify-center gap-1.5 pt-1">
                  {timeLeft > 0 ? (
                    <span>
                      زمان باقیمانده تا ارسال مجدد: <span className="font-mono font-bold text-slate-800">{toPersianDigits(timeLeft)} ثانیه</span>
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleSendMobile()}
                      className="text-emerald-700 font-bold hover:underline cursor-pointer"
                    >
                      ارسال مجدد پیامک تایید
                    </button>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <button
                  type="submit"
                  disabled={isLoading || otpCode.length !== 5}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold py-3.5 rounded-2xl text-sm transition-all shadow-md cursor-pointer flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>تایید کد و ورود به سامانه</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => { setStep('MOBILE'); setOtpCode(''); }}
                  className="w-full text-slate-500 hover:text-slate-800 text-xs py-2 font-medium transition-colors cursor-pointer text-center"
                >
                  ویرایش شماره تلفن همراه
                </button>
              </div>

            </form>
          )}

        </div>

      </div>
    </div>
  );
};
