import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  CreditCard, 
  Lock, 
  AlertCircle, 
  CheckCircle2, 
  RefreshCw, 
  Clock, 
  ArrowRight, 
  X,
  FileText,
  Building,
  Smartphone
} from 'lucide-react';
import { 
  formatRial, 
  formatToman, 
  formatJalaliDate, 
  toPersianDigits 
} from '../../utils/persian';

interface ShaparakGatewayModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (result: {
    trackingCode: string;
    cardMasked: string;
    gatewayName: string;
    rrn: string;
    amountRial: number;
  }) => void;
  cooperativeName: string;
  projectName: string;
  amountRial: number;
  itemTitle: string;
}

// تشخیص بانک از روی ۶ رقم اول کارت
function detectBank(pan: string): { name: string; color: string; logoText: string } {
  const clean = pan.replace(/\D/g, '');
  if (clean.startsWith('603799')) return { name: 'بانک ملی ایران', color: 'from-amber-600 to-yellow-600', logoText: 'ملی' };
  if (clean.startsWith('610433')) return { name: 'بانک ملت', color: 'from-red-600 to-rose-700', logoText: 'ملت' };
  if (clean.startsWith('603769')) return { name: 'بانک صادرات ایران', color: 'from-blue-700 to-indigo-800', logoText: 'صادرات' };
  if (clean.startsWith('627353')) return { name: 'بانک تجارت', color: 'from-cyan-700 to-blue-800', logoText: 'تجارت' };
  if (clean.startsWith('589210')) return { name: 'بانک سپه', color: 'from-emerald-700 to-teal-800', logoText: 'سپه' };
  if (clean.startsWith('621986')) return { name: 'بانک سامان', color: 'from-sky-500 to-blue-600', logoText: 'سامان' };
  if (clean.startsWith('502229')) return { name: 'بانک پاسارگاد', color: 'from-amber-500 to-amber-700', logoText: 'پاسارگاد' };
  if (clean.startsWith('504172')) return { name: 'بانک رسالت', color: 'from-teal-600 to-emerald-700', logoText: 'رسالت' };
  return { name: 'کارت عضو شتاب', color: 'from-slate-700 to-slate-900', logoText: 'شتاب' };
}

export const ShaparakGatewayModal: React.FC<ShaparakGatewayModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  cooperativeName,
  projectName,
  amountRial,
  itemTitle
}) => {
  const [gatewayType, setGatewayType] = useState<'BEHPARDAKHT' | 'SADAD' | 'ZARRINPAL'>('BEHPARDAKHT');
  
  // فیلدهای کارت
  const [cardNumber, setCardNumber] = useState('6037997143218900');
  const [cvv2, setCvv2] = useState('734');
  const [expMonth, setExpMonth] = useState('08');
  const [expYear, setExpYear] = useState('06');
  const [captchaInput, setCaptchaInput] = useState('');
  const [captchaCode, setCaptchaCode] = useState('4829');
  const [otpValue, setOtpValue] = useState('');
  
  // تایمر رمز پویا
  const [otpTimer, setOtpTimer] = useState(0);
  const [otpRequested, setOtpRequested] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // تولید کپچا جدید
  const regenerateCaptcha = () => {
    const randomCode = Math.floor(1000 + Math.random() * 9000).toString();
    setCaptchaCode(randomCode);
    setCaptchaInput('');
  };

  useEffect(() => {
    if (isOpen) {
      regenerateCaptcha();
      setErrorMessage(null);
      setIsProcessing(false);
      setOtpTimer(0);
      setOtpRequested(false);
    }
  }, [isOpen]);

  useEffect(() => {
    let interval: any;
    if (otpTimer > 0) {
      interval = setInterval(() => {
        setOtpTimer(t => t - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [otpTimer]);

  if (!isOpen) return null;

  const detectedBank = detectBank(cardNumber);

  // ارسال درخواست رمز پویا
  const handleRequestOtp = () => {
    setOtpTimer(120);
    setOtpRequested(true);
    // پر کردن خودکار رمز پویا برای تجربه کاربری راحت در ساندباکس
    setTimeout(() => {
      setOtpValue('948123');
    }, 1500);
  };

  // پردازش پرداخت موفق
  const handlePaySuccess = () => {
    setErrorMessage(null);
    setIsProcessing(true);

    setTimeout(() => {
      setIsProcessing(false);
      const rrn = `RRN-${Math.floor(100000000000 + Math.random() * 900000000000)}`;
      const trackingCode = `TRX-${Date.now().toString().slice(-6)}${Math.floor(100 + Math.random() * 900)}`;
      const cardMasked = `${cardNumber.slice(0, 4)}-${cardNumber.slice(4, 6)}**-****-${cardNumber.slice(-4)}`;
      
      const gatewayTitles: Record<string, string> = {
        BEHPARDAKHT: 'به‌پرداخت ملت (شاپرک)',
        SADAD: 'سداد بانک ملی (شاپرک)',
        ZARRINPAL: 'زرین‌پال شاپرک'
      };

      onSuccess({
        trackingCode,
        cardMasked,
        gatewayName: gatewayTitles[gatewayType],
        rrn,
        amountRial
      });
    }, 1200);
  };

  // شبیه‌سازی خطا در ساندباکس
  const handleSimulateError = (type: 'INSUFFICIENT_FUNDS' | 'INVALID_OTP' | 'NETWORK') => {
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      if (type === 'INSUFFICIENT_FUNDS') {
        setErrorMessage('خطای بانکی: موجودی حساب کافی نمی‌باشد (کد خطا: ۵۱).');
      } else if (type === 'INVALID_OTP') {
        setErrorMessage('رمز دوم یکبار مصرف (OTP) نامعتبر است یا منقضی شده است (کد خطا: ۵۵).');
      } else {
        setErrorMessage('خطای موقت در ارتباط با شبکه شاپرک. لطفاً دقایقی دیگر تلاش کنید.');
      }
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-2xl w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* سربرگ رسمی شاپرک */}
        <div className="bg-slate-900 text-white p-5 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 font-black text-sm">
              شاپرک
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm sm:text-base">درگاه پرداخت اینترنتی شاپرک</h3>
                <span className="bg-emerald-500/20 text-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-500/30 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" />
                  اتصال امن SSL
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                شبکه الکترونیکی پرداخت کارت • بانک مرکزی جمهوری اسلامی ایران
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* انتخاب سوییچ درگاه ساندباکس */}
        <div className="bg-slate-100 border-b border-slate-200 px-6 py-2.5 flex items-center justify-between text-xs">
          <span className="font-bold text-slate-600">انتخاب سوئیچ درگاه:</span>
          <div className="flex items-center gap-2">
            {[
              { id: 'BEHPARDAKHT', label: 'به‌پرداخت ملت' },
              { id: 'SADAD', label: 'سداد ملی' },
              { id: 'ZARRINPAL', label: 'زرین‌پال' }
            ].map(gw => (
              <button
                key={gw.id}
                onClick={() => setGatewayType(gw.id as any)}
                className={`px-3 py-1 rounded-lg font-bold text-[11px] transition-all ${
                  gatewayType === gw.id
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-white text-slate-600 hover:bg-slate-200 border border-slate-300'
                }`}
              >
                {gw.label}
              </button>
            ))}
          </div>
        </div>

        {/* جعبه اطلاعات پذیرنده و مبلغ */}
        <div className="p-6 bg-emerald-50/50 border-b border-emerald-100">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <div className="text-[11px] text-slate-500 font-medium">پذیرنده (تعاونی مسکن):</div>
              <div className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                <Building className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{cooperativeName}</span>
              </div>
              <div className="text-xs text-slate-600 font-medium">{projectName} • {itemTitle}</div>
            </div>

            <div className="space-y-1 bg-white p-3.5 rounded-2xl border border-emerald-200/80 shadow-xs text-left sm:text-right">
              <div className="text-[11px] text-slate-500 font-medium">مبلغ قابل پرداخت:</div>
              <div className="text-lg font-black text-emerald-700">
                {formatRial(amountRial)}
              </div>
              <div className="text-xs font-bold text-slate-600">
                معادل {formatToman(amountRial)}
              </div>
            </div>
          </div>
        </div>

        {/* خطای احتمالی */}
        {errorMessage && (
          <div className="mx-6 mt-4 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            <div className="font-bold">{errorMessage}</div>
          </div>
        )}

        {/* فرم مشخصات کارت بانکی */}
        <div className="p-6 space-y-5">
          {/* کارت نمادین کاربر */}
          <div className={`p-4 rounded-2xl bg-gradient-to-r ${detectedBank.color} text-white shadow-md relative overflow-hidden transition-all duration-300`}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-black tracking-wider">{detectedBank.name}</span>
              <span className="bg-white/20 text-[10px] font-bold px-2 py-0.5 rounded-md backdrop-blur-xs">
                شتاب
              </span>
            </div>
            <div className="text-base sm:text-lg font-mono font-black tracking-widest text-center py-2 dir-ltr">
              {cardNumber.match(/.{1,4}/g)?.join(' ') || cardNumber}
            </div>
            <div className="flex items-center justify-between text-[11px] mt-1 text-white/80 font-mono">
              <span>CVV2: {cvv2 || '---'}</span>
              <span>EXP: {expMonth}/{expYear}</span>
            </div>
          </div>

          <div className="space-y-4">
            {/* شماره کارت */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                شماره کارت ۱۶ رقمی:
              </label>
              <div className="relative">
                <input
                  type="text"
                  maxLength={19}
                  value={cardNumber}
                  onChange={(e) => setCardNumber(e.target.value.replace(/\D/g, ''))}
                  placeholder="xxxx xxxx xxxx xxxx"
                  className="w-full text-left font-mono font-bold tracking-widest px-4 py-2.5 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-slate-800 text-sm dir-ltr"
                />
                <CreditCard className="w-5 h-5 text-slate-400 absolute right-3 top-3 pointer-events-none" />
              </div>
            </div>

            {/* رمز دوم پویا و دریافت پیامکی */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-slate-700">
                  رمز دوم یکبار مصرف (رمز پویا):
                </label>
                <button
                  type="button"
                  onClick={handleRequestOtp}
                  disabled={otpTimer > 0}
                  className={`text-xs font-bold px-3 py-1 rounded-lg flex items-center gap-1.5 transition-all ${
                    otpTimer > 0 
                      ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                      : 'bg-emerald-100 hover:bg-emerald-200 text-emerald-800 border border-emerald-300'
                  }`}
                >
                  <Smartphone className="w-3.5 h-3.5" />
                  {otpTimer > 0 ? `ارسال شد (${toPersianDigits(otpTimer)} ثانیه)` : 'دریافت رمز پویا'}
                </button>
              </div>

              <div className="relative">
                <input
                  type="password"
                  maxLength={8}
                  value={otpValue}
                  onChange={(e) => setOtpValue(e.target.value)}
                  placeholder="رمز پیامک‌شده را وارد کنید"
                  className="w-full text-center font-mono font-bold tracking-widest px-4 py-2.5 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 text-slate-800 text-sm"
                />
                <Lock className="w-4 h-4 text-slate-400 absolute right-3 top-3 pointer-events-none" />
              </div>
              {otpRequested && (
                <p className="text-[11px] text-emerald-600 mt-1 font-medium">
                  ✓ در محیط تست ساندباکس، رمز پویا خودکار درج می‌گردد.
                </p>
              )}
            </div>

            {/* CVV2 و تاریخ انقضا */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  کد شناسایی دوم (CVV2):
                </label>
                <input
                  type="password"
                  maxLength={4}
                  value={cvv2}
                  onChange={(e) => setCvv2(e.target.value)}
                  placeholder="۳ یا ۴ رقم"
                  className="w-full text-center font-mono font-bold px-3 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  تاریخ انقضا:
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    maxLength={2}
                    value={expYear}
                    onChange={(e) => setExpYear(e.target.value)}
                    placeholder="سال (۰۶)"
                    className="w-1/2 text-center font-mono font-bold px-2 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 text-sm"
                  />
                  <span className="text-slate-400 font-bold">/</span>
                  <input
                    type="text"
                    maxLength={2}
                    value={expMonth}
                    onChange={(e) => setExpMonth(e.target.value)}
                    placeholder="ماه (۰۸)"
                    className="w-1/2 text-center font-mono font-bold px-2 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 text-sm"
                  />
                </div>
              </div>
            </div>

            {/* کد امنیتی کپچا */}
            <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-200">
              <div className="w-1/2">
                <input
                  type="text"
                  maxLength={4}
                  value={captchaInput}
                  onChange={(e) => setCaptchaInput(e.target.value)}
                  placeholder="کد مقابل را وارد کنید"
                  className="w-full text-center font-mono font-bold px-3 py-2 rounded-xl border border-slate-300 text-sm"
                />
              </div>

              <div className="w-1/2 flex items-center justify-between gap-2 bg-slate-200/80 px-3 py-2 rounded-xl">
                <span className="font-mono text-base font-black tracking-widest text-slate-800 line-through select-none">
                  {captchaCode}
                </span>
                <button
                  type="button"
                  onClick={regenerateCaptcha}
                  className="text-slate-500 hover:text-slate-800 p-1 rounded-md"
                  title="کد جدید"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* دکمه‌های پرداخت و انصراف */}
        <div className="p-6 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-6 py-3 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-bold transition-colors"
          >
            انصراف و بازگشت به پذیرنده
          </button>

          <button
            onClick={handlePaySuccess}
            disabled={isProcessing}
            className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-8 rounded-xl shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 text-xs transition-all disabled:opacity-50"
          >
            {isProcessing ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>در حال تبادل با مرکز شاپرک...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4 text-emerald-200" />
                <span>پرداخت و تکمیل تراکنش ({formatRial(amountRial)})</span>
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
};
