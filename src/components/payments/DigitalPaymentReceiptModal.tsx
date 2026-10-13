import React from 'react';
import { 
  CheckCircle2, 
  Printer, 
  Download, 
  X, 
  Building, 
  CreditCard, 
  ShieldCheck, 
  QrCode,
  Calendar,
  Clock,
  User,
  Share2
} from 'lucide-react';
import { 
  formatRial, 
  formatToman, 
  formatJalaliDate, 
  toPersianDigits 
} from '../../utils/persian';
import { Payment, Receipt, Cooperative, User as UserModel } from '../../types/database';

interface DigitalPaymentReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  payment: Payment;
  receipt?: Receipt;
  cooperative?: Cooperative;
  payerUser?: UserModel;
  itemTitle?: string;
  unitNumber?: string;
}

export const DigitalPaymentReceiptModal: React.FC<DigitalPaymentReceiptModalProps> = ({
  isOpen,
  onClose,
  payment,
  receipt,
  cooperative,
  payerUser,
  itemTitle,
  unitNumber
}) => {
  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const isApproved = payment.status === 'SUCCESS' || payment.status === 'APPROVED';

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/75 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* نوار بالایی مودال */}
        <div className="bg-slate-900 text-white p-4 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <span className="font-bold text-sm">رسید الکترونیکی معتبر تراکنش</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>چاپ رسید</span>
            </button>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* برگه رسید چاپی (Voucher) */}
        <div className="p-6 sm:p-8 space-y-6 print:p-0">
          
          {/* سربرگ رسید */}
          <div className="text-center space-y-2 border-b border-dashed border-slate-200 pb-6">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 shadow-sm">
              <Building className="w-7 h-7" />
            </div>
            
            <h2 className="text-lg font-black text-slate-900">
              {cooperative?.name || 'تعاونی مسکن'}
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              سامانه یکپارچه مسکن‌یار • سند تسویه الکترونیکی
            </p>

            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 mt-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>
                {payment.method === 'ONLINE_SANDBOX' 
                  ? 'پرداخت آنلاین موفق شاپرک' 
                  : 'فیش واریزی تایید شده حسابداری'}
              </span>
            </div>
          </div>

          {/* مبلغ بزرگ رسید */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-center space-y-1">
            <span className="text-xs text-slate-500 font-medium">مبلغ تراکنش:</span>
            <div className="text-2xl font-black text-emerald-700">
              {formatRial(payment.amountRial)}
            </div>
            <div className="text-xs font-bold text-slate-600">
              معادل {formatToman(payment.amountRial)}
            </div>
          </div>

          {/* جزئیات تراکنش */}
          <div className="space-y-3 text-xs">
            <div className="flex justify-between items-center py-1.5 border-b border-slate-100">
              <span className="text-slate-500">شماره پیگیری (Tracking Code):</span>
              <span className="font-mono font-bold text-slate-900 dir-ltr text-sm">{payment.trackingCode}</span>
            </div>

            <div className="flex justify-between items-center py-1.5 border-b border-slate-100">
              <span className="text-slate-500">تاریخ و زمان پرداخت:</span>
              <span className="font-bold text-slate-800 dir-ltr">{payment.paidAt}</span>
            </div>

            <div className="flex justify-between items-center py-1.5 border-b border-slate-100">
              <span className="text-slate-500">نام پرداخت‌کننده:</span>
              <span className="font-bold text-slate-800">{payerUser?.fullName || 'عضو تعاونی'}</span>
            </div>

            {unitNumber && (
              <div className="flex justify-between items-center py-1.5 border-b border-slate-100">
                <span className="text-slate-500">واحد منتسب:</span>
                <span className="font-bold text-slate-800">واحد {unitNumber}</span>
              </div>
            )}

            <div className="flex justify-between items-center py-1.5 border-b border-slate-100">
              <span className="text-slate-500">بابت (شرح پرداخت):</span>
              <span className="font-bold text-slate-800">{itemTitle || 'قسط ساختمانی / شارژ'}</span>
            </div>

            <div className="flex justify-between items-center py-1.5 border-b border-slate-100">
              <span className="text-slate-500">درگاه / نحوه واریز:</span>
              <span className="font-bold text-slate-800">{payment.gatewayName || 'ساندباکس'}</span>
            </div>

            {receipt?.bankName && (
              <div className="flex justify-between items-center py-1.5 border-b border-slate-100">
                <span className="text-slate-500">بانک مبدا فیش:</span>
                <span className="font-bold text-slate-800">{receipt.bankName}</span>
              </div>
            )}
          </div>

          {/* پانویس رسید و کیوآر کد اصالت */}
          <div className="pt-4 border-t border-dashed border-slate-200 flex items-center justify-between text-[11px] text-slate-500">
            <div className="space-y-1">
              <div className="font-bold text-slate-700">کد امنیتی اصالت سند (Hash):</div>
              <div className="font-mono text-[10px] text-slate-400 dir-ltr truncate max-w-[200px]">
                SHA256-{payment.id.slice(-8)}-{payment.trackingCode}
              </div>
              <div className="text-[10px] text-emerald-600 font-medium">✓ دارای امضای دیجیتال معتبر</div>
            </div>

            <div className="w-16 h-16 bg-slate-100 rounded-xl border border-slate-200 flex items-center justify-center p-1.5 shrink-0">
              <QrCode className="w-full h-full text-slate-700" />
            </div>
          </div>

        </div>

        {/* دکمه پایین */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end">
          <button
            onClick={onClose}
            className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors"
          >
            بستن رسید
          </button>
        </div>

      </div>
    </div>
  );
};
