import React, { useState } from 'react';
import { 
  Upload, 
  Check, 
  Copy, 
  AlertCircle, 
  FileText, 
  X, 
  Building, 
  CreditCard, 
  Calendar, 
  Clock, 
  Sparkles,
  Image as ImageIcon
} from 'lucide-react';
import { 
  formatRial, 
  formatToman, 
  formatJalaliDate, 
  toPersianDigits 
} from '../../utils/persian';
import { Cooperative } from '../../types/database';

interface ReceiptUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (receiptData: {
    amountRial: number;
    bankName: string;
    referenceNumber: string;
    depositDate: string;
    depositTime?: string;
    depositAccount?: string;
    fileUrl: string;
    originalFileName: string;
    mimeType?: string;
    fileSizeBytes?: number;
  }) => void;
  cooperative: Cooperative;
  itemTitle: string;
  defaultAmountRial: number;
}

// چند نمونه تصویر واقعی فیش برای تست سریع در ساندباکس
const SAMPLE_RECEIPTS = [
  {
    title: 'فیش واریز پایا (بانک ملی)',
    bank: 'بانک ملی ایران',
    ref: '۹۸۳۴۱۱۹۰۲',
    account: '۶۰۳۷۹۹۷۱۴۳۲۱۸۹۰۰',
    url: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=700&auto=format&fit=crop&q=80',
    fileName: 'fish-variz-paya-melli.jpg'
  },
  {
    title: 'رسید کارت‌به‌کارت (آپ / ملت)',
    bank: 'بانک ملت',
    ref: '۷۷۱۲۹۰۶۶۴',
    account: '۶۱۰۴۳۳۷۸۹۲۳۴۵۶۱۱',
    url: 'https://images.unsplash.com/photo-1554224154-26032ffc0d07?w=700&auto=format&fit=crop&q=80',
    fileName: 'resid-kart-be-kart-mellat.jpg'
  },
  {
    title: 'فیش حواله ساتنا (بانک صادرات)',
    bank: 'بانک صادرات ایران',
    ref: '۵۵۰۹۲۳۴۱۸',
    account: '۶۰۳۷۶۹۱۸۷۶۵۴۳۲۱۰',
    url: 'https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=700&auto=format&fit=crop&q=80',
    fileName: 'fish-satna-saderat.jpg'
  }
];

export const ReceiptUploadModal: React.FC<ReceiptUploadModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  cooperative,
  itemTitle,
  defaultAmountRial
}) => {
  const [amountRial, setAmountRial] = useState(defaultAmountRial);
  const [bankName, setBankName] = useState('بانک ملی ایران');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [depositDate, setDepositDate] = useState(new Date().toISOString().slice(0, 10));
  const [depositTime, setDepositTime] = useState('11:30');
  const [depositAccount, setDepositAccount] = useState('');
  
  // فایل و تصویر فیش
  const [fileUrl, setFileUrl] = useState(SAMPLE_RECEIPTS[0].url);
  const [fileName, setFileName] = useState(SAMPLE_RECEIPTS[0].fileName);
  const [fileSize, setFileSize] = useState(384000);
  
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCopy = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  // انتخاب فیش نمونه آماده
  const selectSampleReceipt = (sample: typeof SAMPLE_RECEIPTS[0]) => {
    setFileUrl(sample.url);
    setFileName(sample.fileName);
    setBankName(sample.bank);
    setReferenceNumber(sample.ref);
    setDepositAccount(sample.account);
    setErrorMessage(null);
  };

  // آپلود فایل از روی دستگاه
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      setErrorMessage('حجم فایل نباید بیشتر از ۲ مگابایت باشد.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setFileUrl(reader.result as string);
      setFileName(file.name);
      setFileSize(file.size);
      setErrorMessage(null);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!referenceNumber.trim()) {
      setErrorMessage('لطفاً شماره ارجاع یا پیگیری فیش را وارد کنید.');
      return;
    }

    if (amountRial <= 0) {
      setErrorMessage('مبلغ واریزی باید بزرگتر از صفر باشد.');
      return;
    }

    if (!fileUrl) {
      setErrorMessage('لطفاً تصویر فیش واریزی را بارگذاری نمایید.');
      return;
    }

    try {
      onSubmit({
        amountRial,
        bankName,
        referenceNumber: referenceNumber.trim(),
        depositDate,
        depositTime,
        depositAccount: depositAccount.trim(),
        fileUrl,
        originalFileName: fileName,
        fileSizeBytes: fileSize,
        mimeType: 'image/jpeg'
      });
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'خطا در ثبت فیش');
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-2xl w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* سربرگ */}
        <div className="bg-slate-900 text-white p-5 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-500/20 border border-teal-500/30 flex items-center justify-center text-teal-300">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base">بارگذاری و ثبت فیش واریز بانکی</h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                حواله پایا، ساتنا یا انتقال کارت‌به‌کارت به حساب رسمی تعاونی
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

        {/* کارت اطلاعات حساب بانکی تعاونی مقصد */}
        <div className="p-5 bg-teal-50/60 border-b border-teal-100">
          <div className="text-xs font-bold text-teal-900 mb-2 flex items-center gap-2">
            <Building className="w-4 h-4 text-teal-600" />
            <span>مشخصات حساب واریز رسمی {cooperative.name}:</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-white p-3.5 rounded-2xl border border-teal-200 shadow-xs">
            <div>
              <span className="text-slate-500">بانک و صاحب حساب:</span>
              <div className="font-bold text-slate-800 mt-0.5">
                {cooperative.bankAccountInfo.bankName} - {cooperative.bankAccountInfo.cardHolderName}
              </div>
            </div>

            <div>
              <span className="text-slate-500">شماره حساب:</span>
              <div className="font-mono font-bold text-slate-800 mt-0.5 flex items-center justify-between">
                <span>{cooperative.bankAccountInfo.accountNumber}</span>
                <button
                  type="button"
                  onClick={() => handleCopy(cooperative.bankAccountInfo.accountNumber, 'acc')}
                  className="text-teal-700 hover:text-teal-900 p-1 rounded-md"
                  title="کپی شماره حساب"
                >
                  {copiedField === 'acc' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            <div className="sm:col-span-2 pt-1 border-t border-slate-100">
              <span className="text-slate-500">شماره شبا (IBAN):</span>
              <div className="font-mono font-bold text-teal-900 mt-0.5 flex items-center justify-between bg-teal-50 px-2.5 py-1.5 rounded-lg dir-ltr">
                <span>{cooperative.bankAccountInfo.shebaNumber}</span>
                <button
                  type="button"
                  onClick={() => handleCopy(cooperative.bankAccountInfo.shebaNumber, 'sheba')}
                  className="text-teal-700 hover:text-teal-900 p-1 rounded-md dir-rtl flex items-center gap-1 text-[11px]"
                >
                  {copiedField === 'sheba' ? (
                    <span className="text-emerald-600 font-bold flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" /> کپی شد
                    </span>
                  ) : (
                    <span className="flex items-center gap-1">
                      <Copy className="w-3.5 h-3.5" /> کپی شبا
                    </span>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* خطای احتمالی */}
        {errorMessage && (
          <div className="mx-6 mt-4 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <div className="font-bold">{errorMessage}</div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* بخش انتخاب فیش نمونه یا آپلود شخصی */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <ImageIcon className="w-4 h-4 text-teal-600" />
                <span>تصویر یا مدرک فیش واریزی:</span>
              </label>
              <span className="text-[11px] text-slate-500">حداکثر ۲ مگابایت (JPG, PNG)</span>
            </div>

            {/* پیش‌نمایش تصویر و دکمه انتخاب فایل */}
            <div className="border-2 border-dashed border-slate-200 hover:border-teal-400 rounded-2xl p-4 flex flex-col sm:flex-row items-center gap-4 bg-slate-50/50 transition-colors">
              <img
                src={fileUrl}
                alt="پیش‌نمایش فیش"
                className="w-24 h-24 object-cover rounded-xl border border-slate-200 shadow-xs shrink-0"
              />
              <div className="flex-1 space-y-1.5 text-center sm:text-right">
                <div className="text-xs font-bold text-slate-800">{fileName}</div>
                <div className="text-[11px] text-slate-500">حجم: {Math.round(fileSize / 1024)} کیلوبایت</div>
                <div className="flex flex-wrap items-center gap-2 pt-1 justify-center sm:justify-start">
                  <label className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold cursor-pointer transition-colors shadow-xs">
                    <Upload className="w-3.5 h-3.5" />
                    <span>انتخاب تصویر فیش بانکی</span>
                    <input
                      type="file"
                      accept="image/*,application/pdf"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </label>

                  {/* گزینه اختیاری نمونه دمو در صورت نیاز */}
                  <div className="flex items-center gap-1 text-[11px] text-slate-400">
                    <span>یا نمونه:</span>
                    {SAMPLE_RECEIPTS.map((s, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => selectSampleReceipt(s)}
                        className="underline hover:text-teal-700"
                      >
                        {idx === 0 ? 'پایا' : idx === 1 ? 'کارت‌به‌کارت' : 'ساتنا'}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* فیلدهای متنی فیش */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* مبلغ */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                مبلغ واریزی به ریال:
              </label>
              <input
                type="number"
                value={amountRial}
                onChange={(e) => setAmountRial(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-teal-500 font-bold text-slate-800 text-sm"
              />
              <span className="text-[11px] text-slate-500 mt-1 block">
                معادل {formatToman(amountRial)}
              </span>
            </div>

            {/* شماره ارجاع / پیگیری */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                شماره پیگیری / ارجاع بانکی (RRN):
              </label>
              <input
                type="text"
                value={referenceNumber}
                onChange={(e) => setReferenceNumber(e.target.value)}
                placeholder="مثال: ۹۸۳۴۱۱۲۳"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-teal-500 font-bold text-slate-800 text-sm font-mono dir-ltr text-left"
                required
              />
            </div>

            {/* بانک مبدا */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                بانک واریزکننده (مبدا):
              </label>
              <input
                type="text"
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
                placeholder="مثال: بانک ملی شعبه مرکزی"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-teal-500 text-sm font-medium"
              />
            </div>

            {/* شماره حساب/کارت مبدا */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                شماره کارت یا حساب مبدا (اختیاری):
              </label>
              <input
                type="text"
                value={depositAccount}
                onChange={(e) => setDepositAccount(e.target.value)}
                placeholder="مثال: ۶۰۳۷... یا شماره حساب"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-teal-500 text-sm font-mono dir-ltr text-left"
              />
            </div>

            {/* تاریخ واریز */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                تاریخ مندرج در فیش:
              </label>
              <input
                type="date"
                value={depositDate}
                onChange={(e) => setDepositDate(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-teal-500 text-sm font-mono"
              />
            </div>

            {/* ساعت واریز */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                ساعت تقریبی واریز:
              </label>
              <input
                type="time"
                value={depositTime}
                onChange={(e) => setDepositTime(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-teal-500 text-sm font-mono"
              />
            </div>

          </div>

          {/* دکمه‌های فرم */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-bold transition-colors"
            >
              انصراف
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-lg shadow-teal-600/20 flex items-center gap-2 transition-all"
            >
              <Upload className="w-4 h-4" />
              <span>ارسال فیش جهت بررسی و تایید مدیر</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
