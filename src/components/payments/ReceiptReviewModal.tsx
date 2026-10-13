import React, { useState } from 'react';
import { 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  ZoomIn, 
  ZoomOut, 
  RotateCw, 
  ExternalLink, 
  Calendar, 
  Clock, 
  Building, 
  User, 
  CreditCard, 
  FileText, 
  X,
  ShieldCheck,
  Check
} from 'lucide-react';
import { 
  formatRial, 
  formatToman, 
  formatJalaliDate, 
  toPersianDigits 
} from '../../utils/persian';
import { Payment, Receipt, InstallmentItem, MonthlyFee, User as UserModel, Cooperative, Unit } from '../../types/database';

interface ReceiptReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApprove: (paymentId: string) => void;
  onReject: (paymentId: string, reason: string) => void;
  payment: Payment;
  receipt: Receipt;
  memberUser?: UserModel;
  cooperative?: Cooperative;
  installmentItem?: InstallmentItem;
  monthlyFee?: MonthlyFee;
  unit?: Unit;
}

const COMMON_REJECT_REASONS = [
  'مغایرت مبلغ مندرج در فیش با واریزی واقعی به حساب',
  'تصویر فیش تار، ناخوانا یا ناقص است',
  'شماره ارجاع / پیگیری در صورت‌حساب بانکی تعاونی یافت نشد',
  'مبلغ به حساب دیگری غیر از حساب رسمی تعاونی واریز گردیده است',
  'فیش واریزی تکراری است و قبلاً در سیستم ثبت و تایید شده است'
];

export const ReceiptReviewModal: React.FC<ReceiptReviewModalProps> = ({
  isOpen,
  onClose,
  onApprove,
  onReject,
  payment,
  receipt,
  memberUser,
  cooperative,
  installmentItem,
  monthlyFee,
  unit
}) => {
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [isRejecting, setIsRejecting] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  // مبلغ قسط یا هزینه
  const targetTotal = installmentItem ? installmentItem.amountRial : (monthlyFee ? monthlyFee.amountRial : 0);
  const targetRemaining = installmentItem 
    ? (installmentItem.amountRial - installmentItem.paidAmountRial)
    : (monthlyFee ? (monthlyFee.amountRial - monthlyFee.paidAmountRial) : 0);

  const isFullSettlement = payment.amountRial >= targetRemaining;

  const handleApprove = () => {
    setIsSubmitting(true);
    try {
      onApprove(payment.id);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmReject = () => {
    if (!rejectReason.trim()) return;
    setIsSubmitting(true);
    try {
      onReject(payment.id, rejectReason.trim());
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/75 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* سربرگ بررسی */}
        <div className="bg-slate-900 text-white p-5 flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm sm:text-base">کارتابل اعتبارسنجی و تایید فیش واریزی</h3>
                <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                  payment.status === 'PENDING_APPROVAL' 
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                    : payment.status === 'APPROVED'
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                    : 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                }`}>
                  {payment.status === 'PENDING_APPROVAL' ? 'در انتظار تایید مدیر' : payment.status === 'APPROVED' ? 'تایید شده' : 'رد شده'}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                شناسه پرداخت: {payment.id} • شماره ارجاع: {receipt.referenceNumber}
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

        {/* محتوای دو ستونه: تصویر فیش + تطبیق مالی */}
        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* ستون راست: پیش‌نمایش بزرگ و کنترل تصویر فیش */}
          <div className="lg:col-span-7 flex flex-col space-y-3">
            <div className="flex items-center justify-between text-xs font-bold text-slate-700">
              <span>تصویر مدرک واریزی ({receipt.originalFileName}):</span>
              
              <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200">
                <button
                  type="button"
                  onClick={() => setZoom(z => Math.max(0.6, z - 0.2))}
                  className="p-1.5 hover:bg-white rounded-lg text-slate-600 transition-colors"
                  title="کوچک‌نمایی"
                >
                  <ZoomOut className="w-4 h-4" />
                </button>
                <span className="text-[11px] font-mono px-1">{Math.round(zoom * 100)}%</span>
                <button
                  type="button"
                  onClick={() => setZoom(z => Math.min(2.5, z + 0.2))}
                  className="p-1.5 hover:bg-white rounded-lg text-slate-600 transition-colors"
                  title="بزرگ‌نمایی"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setRotation(r => (r + 90) % 360)}
                  className="p-1.5 hover:bg-white rounded-lg text-slate-600 transition-colors"
                  title="چرخش ۹۰ درجه"
                >
                  <RotateCw className="w-4 h-4" />
                </button>
                <a
                  href={receipt.fileUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="p-1.5 hover:bg-white rounded-lg text-slate-600 transition-colors"
                  title="مشاهده در تب جدید"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            </div>

            <div className="flex-1 min-h-[300px] bg-slate-900 rounded-2xl overflow-hidden flex items-center justify-center p-4 border border-slate-800 relative">
              <img
                src={receipt.fileUrl}
                alt="فیش واریزی"
                style={{
                  transform: `scale(${zoom}) rotate(${rotation}deg)`,
                  transition: 'transform 0.2s ease-in-out'
                }}
                className="max-h-[420px] max-w-full object-contain rounded-lg shadow-2xl"
              />
            </div>
            
            <div className="text-[11px] text-slate-500 flex items-center justify-between">
              <span>حجم فایل: {Math.round(receipt.fileSizeBytes / 1024)} KB</span>
              <span>نوع: {receipt.mimeType}</span>
            </div>
          </div>

          {/* ستون چپ: مقایسه تطبیقی داده‌ها و اطلاعات حسابداری */}
          <div className="lg:col-span-5 flex flex-col space-y-4">
            
            {/* کارت مشخصات ادعای واریز */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
              <div className="text-xs font-bold text-slate-800 pb-2 border-b border-slate-200 flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-emerald-600" />
                <span>اطلاعات استخراج‌شده از فیش واریزی:</span>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">مبلغ واریزی:</span>
                  <span className="font-black text-emerald-700 text-sm">{formatRial(payment.amountRial)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">شماره ارجاع / پیگیری:</span>
                  <span className="font-mono font-bold text-slate-800 dir-ltr">{receipt.referenceNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">بانک مبدا:</span>
                  <span className="font-bold text-slate-800">{receipt.bankName}</span>
                </div>
                {receipt.depositAccount && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">شماره حساب/کارت مبدا:</span>
                    <span className="font-mono font-bold text-slate-700 dir-ltr">{receipt.depositAccount}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-slate-500">تاریخ و ساعت واریز:</span>
                  <span className="font-bold text-slate-700">{receipt.depositDate} {receipt.depositTime || ''}</span>
                </div>
              </div>
            </div>

            {/* کارت مشخصات عضو و تعهد بدهی در سامانه */}
            <div className="bg-emerald-50/50 p-4 rounded-2xl border border-emerald-200 space-y-3">
              <div className="text-xs font-bold text-emerald-950 pb-2 border-b border-emerald-200 flex items-center gap-2">
                <User className="w-4 h-4 text-emerald-700" />
                <span>مشخصات متعهد و بدهی در سیستم:</span>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-600">عضو پرداخت‌کننده:</span>
                  <span className="font-bold text-slate-900">{memberUser?.fullName || 'عضو تعاونی'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">واحد منتسب:</span>
                  <span className="font-bold text-slate-900">
                    {unit ? `واحد ${unit.unitNumber} (بلوک ${unit.block})` : 'فاقد واحد تخصیص‌یافته'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">عنوان بدهی / قسط:</span>
                  <span className="font-bold text-slate-900">
                    {installmentItem?.stageTitle || monthlyFee?.title || 'بدهی جاری'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">مانده بدهی این آیتم:</span>
                  <span className="font-black text-rose-700">{formatRial(targetRemaining)}</span>
                </div>
              </div>

              {/* برچسب هوشمند بررسی تطابق مبلغ */}
              <div className="pt-2 border-t border-emerald-200">
                {isFullSettlement ? (
                  <div className="bg-emerald-100 text-emerald-800 text-[11px] font-bold p-2 rounded-xl flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>مبلغ واریزی پوشش‌دهنده کامل مانده بدهی است (تسویه ۱۰۰٪).</span>
                  </div>
                ) : (
                  <div className="bg-amber-100 text-amber-900 text-[11px] font-bold p-2 rounded-xl flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>واریز جزئی: پس از تایید، {formatRial(targetRemaining - payment.amountRial)} از این قسط باقی می‌ماند.</span>
                  </div>
                )}
              </div>
            </div>

            {/* بخش ثبت دلیل رد (در صورت انتخاب گزینه رد فیش) */}
            {isRejecting ? (
              <div className="bg-rose-50 border border-rose-200 p-4 rounded-2xl space-y-3 animate-in fade-in duration-200">
                <div className="text-xs font-bold text-rose-900 flex items-center justify-between">
                  <span>دلایل متداول رد فیش:</span>
                  <button
                    type="button"
                    onClick={() => setIsRejecting(false)}
                    className="text-[11px] text-slate-500 hover:text-slate-700 underline"
                  >
                    انصراف
                  </button>
                </div>

                <div className="space-y-1.5">
                  {COMMON_REJECT_REASONS.map((reason, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setRejectReason(reason)}
                      className={`w-full text-right text-[11px] p-2 rounded-lg border transition-colors ${
                        rejectReason === reason
                          ? 'bg-rose-600 text-white border-rose-600'
                          : 'bg-white text-slate-700 hover:bg-rose-100/50 border-rose-200'
                      }`}
                    >
                      {reason}
                    </button>
                  ))}
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    متن نهایی دلیل رد (ارسال به عضو):
                  </label>
                  <textarea
                    rows={2}
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    placeholder="علت رد فیش را بنویسید..."
                    className="w-full p-2.5 rounded-xl border border-rose-300 text-xs focus:ring-2 focus:ring-rose-500"
                  />
                </div>

                <button
                  type="button"
                  onClick={handleConfirmReject}
                  disabled={!rejectReason.trim() || isSubmitting}
                  className="w-full bg-rose-600 hover:bg-rose-700 text-white font-bold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-2 disabled:opacity-50 transition-colors"
                >
                  <XCircle className="w-4 h-4" />
                  <span>تایید رد فیش و ابلاغ به عضو</span>
                </button>
              </div>
            ) : null}

          </div>

        </div>

        {/* دکمه‌های اقدام کارتابل */}
        <div className="p-5 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="text-xs text-slate-500">
            {receipt.reviewedAt ? (
              <span>بررسی شده در {receipt.reviewedAt}</span>
            ) : (
              <span>اقدام به عنوان مدیر تعاونی مجاز</span>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-bold transition-colors"
            >
              بستن
            </button>

            {payment.status === 'PENDING_APPROVAL' && !isRejecting && (
              <>
                <button
                  type="button"
                  onClick={() => setIsRejecting(true)}
                  className="px-4 py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-300 text-xs font-bold flex items-center gap-1.5 transition-colors"
                >
                  <XCircle className="w-4 h-4 text-rose-600" />
                  <span>رد فیش واریزی</span>
                </button>

                <button
                  type="button"
                  onClick={handleApprove}
                  disabled={isSubmitting}
                  className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-lg shadow-emerald-600/20 flex items-center gap-2 transition-all"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>تایید و اعمال در حسابداری</span>
                </button>
              </>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
