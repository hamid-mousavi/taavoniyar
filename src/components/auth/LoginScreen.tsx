import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  Phone, 
  ShieldCheck, 
  ArrowLeft, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  MessageSquare, 
  Sparkles, 
  Lock,
  Copy,
  Check
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { toPersianDigits, isValidIranianMobile } from '../../utils/persian';

export const LoginScreen: React.FC = () => {
  const { 
    requestOtp, 
    verifyOtp, 
    isLoading, 
    error, 
    simulatedOtpCode, 
    otpExpiresAt, 
    adminMobile 
  } = useAuth();

  const [step, setStep] = useState<'MOBILE' | 'OTP'>('MOBILE');
  const [mobile, setMobile] = useState<string>('');
  const [otpCode, setOtpCode] = useState<string>('');
  const [timeLeft, setTimeLeft] = useState<number>(120);
  const [localError, setLocalError] = useState<string | null>(null);

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
    if (!res.success) {
      setLocalError(res.message);
    }
  };

  const fillSimulatedCode = () => {
    if (simulatedOtpCode) {
      setOtpCode(simulatedOtpCode);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 selection:bg-emerald-500 selection:text-white">
      {/* زمینه نوری جذاب و شرکتی */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl"></div>
      </div>

      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* سربرگ برند سامانه */}
        <div className="p-8 bg-slate-950 text-white text-center space-y-3 relative">
          <div className="w-16 h-16 rounded-2xl bg-linear-to-tr from-emerald-500 to-teal-400 mx-auto flex items-center justify-center text-white shadow-xl shadow-emerald-500/20">
            <Building2 className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight">مسکن‌یار</h1>
            <p className="text-xs text-slate-400 mt-1">
              سامانه مدیریت یکپارچه و چندمستأجری تعاونی‌های مسکن
            </p>
          </div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-[11px] font-bold">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>ورود امن دو مرحله‌ای (OTP)</span>
          </div>
        </div>

        {/* بدنه فرم */}
        <div className="p-6 sm:p-8 space-y-6">
          
          {(localError || error) && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span className="leading-relaxed">{localError || error}</span>
            </div>
          )}

          {/* مرحله اول: ورود شماره موبایل */}
          {step === 'MOBILE' ? (
            <form onSubmit={handleSendMobile} className="space-y-4">
              <div className="space-y-1.5 text-right">
                <label className="text-xs font-bold text-slate-700">
                  شماره تلفن همراه عضو یا مدیر تعاونی:
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute right-3.5 top-3.5" />
                  <input
                    type="tel"
                    required
                    autoFocus
                    placeholder="09123456789"
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value)}
                    dir="ltr"
                    className="w-full pr-10 pl-4 py-3 rounded-2xl border border-slate-300 focus:border-emerald-600 outline-none font-mono text-sm tracking-wider"
                  />
                </div>
                <p className="text-[11px] text-slate-400">
                  کد تایید یکبار مصرف به این شماره ارسال خواهد شد.
                </p>
              </div>

              {/* حساب‌های تست و ارائه سامانه بدون نیاز به دیتابیس */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5 text-right">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-800">حساب‌های آزمایشی و ارائه (کلیک برای درج):</span>
                  <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-mono font-bold">
                    Mock Data
                  </span>
                </div>
                <div className="grid grid-cols-1 gap-1.5">
                  <button
                    type="button"
                    onClick={() => setMobile(adminMobile)}
                    className={`w-full py-2 px-3 rounded-xl border text-xs font-mono transition-all cursor-pointer flex items-center justify-between text-right ${
                      mobile === adminMobile 
                        ? 'bg-purple-50 border-purple-300 text-purple-900 font-bold ring-1 ring-purple-200' 
                        : 'bg-white hover:bg-slate-100 border-slate-200 text-slate-700'
                    }`}
                  >
                    <span className="text-[11px] font-sans flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-purple-600"></span>
                      <span>مدیر ارشد سامانه (Super Admin)</span>
                    </span>
                    <span className="font-bold text-purple-700">{adminMobile}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setMobile('09121112233')}
                    className={`w-full py-2 px-3 rounded-xl border text-xs font-mono transition-all cursor-pointer flex items-center justify-between text-right ${
                      mobile === '09121112233' 
                        ? 'bg-sky-50 border-sky-300 text-sky-900 font-bold ring-1 ring-sky-200' 
                        : 'bg-white hover:bg-slate-100 border-slate-200 text-slate-700'
                    }`}
                  >
                    <span className="text-[11px] font-sans flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-sky-600"></span>
                      <span>مدیر تعاونی مسکن (مهندس تهرانی)</span>
                    </span>
                    <span className="font-bold text-sky-700">09121112233</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setMobile('09123334455')}
                    className={`w-full py-2 px-3 rounded-xl border text-xs font-mono transition-all cursor-pointer flex items-center justify-between text-right ${
                      mobile === '09123334455' 
                        ? 'bg-emerald-50 border-emerald-300 text-emerald-900 font-bold ring-1 ring-emerald-200' 
                        : 'bg-white hover:bg-slate-100 border-slate-200 text-slate-700'
                    }`}
                  >
                    <span className="text-[11px] font-sans flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
                      <span>عضو تعاونی - خریدار واحد ۱۲ (صادقی)</span>
                    </span>
                    <span className="font-bold text-emerald-700">09123334455</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setMobile('09124445566')}
                    className={`w-full py-2 px-3 rounded-xl border text-xs font-mono transition-all cursor-pointer flex items-center justify-between text-right ${
                      mobile === '09124445566' 
                        ? 'bg-amber-50 border-amber-300 text-amber-900 font-bold ring-1 ring-amber-200' 
                        : 'bg-white hover:bg-slate-100 border-slate-200 text-slate-700'
                    }`}
                  >
                    <span className="text-[11px] font-sans flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-amber-600"></span>
                      <span>عضو با معوقه - خریدار واحد ۲۵ (احمدی)</span>
                    </span>
                    <span className="font-bold text-amber-700">09124445566</span>
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading || !mobile.trim()}
                className="w-full py-3.5 px-4 rounded-2xl bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white font-bold text-sm transition-all shadow-md shadow-emerald-700/20 cursor-pointer flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>در حال بررسی شماره...</span>
                  </>
                ) : (
                  <>
                    <span>دریافت کد تایید پیامکی</span>
                    <ArrowLeft className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          ) : (
            /* مرحله دوم: ورود کد تایید پیامک */
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              
              <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs">
                <div>
                  <span className="text-slate-500">ارسال به شماره: </span>
                  <span className="font-bold font-mono text-slate-900">{mobile}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setStep('MOBILE')}
                  className="text-emerald-700 hover:underline font-bold text-[11px] cursor-pointer"
                >
                  تغییر شماره
                </button>
              </div>

              {/* شبیه‌ساز پیامک دریافتی کاربر */}
              {simulatedOtpCode && (
                <div className="p-4 rounded-2xl bg-linear-to-r from-amber-50 to-orange-50 border border-amber-200/80 space-y-2 text-right">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-amber-900 font-bold text-xs">
                      <MessageSquare className="w-4 h-4 text-amber-600" />
                      <span>پیامک دریافتی در تلفن همراه:</span>
                    </div>
                    <span className="text-[10px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full font-bold">
                      شبیه‌ساز پیامک
                    </span>
                  </div>

                  <div className="p-2.5 bg-white rounded-xl border border-amber-200 text-xs text-slate-800 leading-relaxed">
                    کد تایید ورود شما به سامانه مسکن‌یار:{' '}
                    <span className="font-mono font-black text-sm text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-300">
                      {simulatedOtpCode}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={fillSimulatedCode}
                    className="w-full py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-[11px] font-bold transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>درج خودکار کد ({simulatedOtpCode})</span>
                  </button>
                </div>
              )}

              <div className="space-y-1.5 text-right">
                <label className="text-xs font-bold text-slate-700">کد ۵ رقمی تایید پیامک‌شده:</label>
                <input
                  type="text"
                  maxLength={5}
                  required
                  autoFocus
                  placeholder="-----"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value)}
                  dir="ltr"
                  className="w-full py-3 rounded-2xl border border-slate-300 focus:border-emerald-600 outline-none font-mono text-center text-xl tracking-[0.5em] font-black"
                />
              </div>

              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>اعتبار کد: {toPersianDigits(timeLeft)} ثانیه</span>
                {timeLeft <= 0 && (
                  <button
                    type="button"
                    onClick={() => handleSendMobile()}
                    className="text-emerald-700 font-bold hover:underline cursor-pointer"
                  >
                    ارسال مجدد کد
                  </button>
                )}
              </div>

              <button
                type="submit"
                disabled={isLoading || otpCode.length !== 5}
                className="w-full py-3.5 px-4 rounded-2xl bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white font-bold text-sm transition-all shadow-md shadow-emerald-700/20 cursor-pointer flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>در حال اعتبارسنجی نشست...</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4" />
                    <span>تایید و ورود به سامانه</span>
                  </>
                )}
              </button>
            </form>
          )}

        </div>

        {/* فوتر مینیمال */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 text-center text-[11px] text-slate-400">
          سامانه مسکن‌یار • ویرایش امنیتی ۵.۰ پروداکشن
        </div>

      </div>
    </div>
  );
};
