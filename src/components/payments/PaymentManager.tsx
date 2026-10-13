import React, { useState, useEffect } from 'react';
import { 
  CreditCard, 
  Upload, 
  Inbox, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Building2, 
  FileText, 
  ShieldCheck, 
  Search, 
  Filter, 
  ArrowUpRight, 
  XCircle, 
  Download, 
  Eye, 
  RefreshCw,
  Coins,
  ChevronRight,
  ExternalLink,
  Check,
  Building
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { dataService } from '../../services/dataService';
import { 
  formatRial, 
  formatToman, 
  formatJalaliDate, 
  toPersianDigits 
} from '../../utils/persian';
import { 
  Payment, 
  Receipt, 
  InstallmentItem, 
  MonthlyFee, 
  Cooperative, 
  User as UserModel,
  Unit 
} from '../../types/database';
import { ShaparakGatewayModal } from './ShaparakGatewayModal';
import { ReceiptUploadModal } from './ReceiptUploadModal';
import { ReceiptReviewModal } from './ReceiptReviewModal';
import { DigitalPaymentReceiptModal } from './DigitalPaymentReceiptModal';

export const PaymentManager: React.FC = () => {
  const { session } = useAuth();
  const [, setTick] = useState(0);

  // اشتراک در تغییرات داده برای رفرش آنی
  useEffect(() => {
    const unsub = dataService.subscribe(() => setTick(t => t + 1));
    return unsub;
  }, []);

  const [activeSubTab, setActiveSubTab] = useState<'gateway' | 'uploadReceipt' | 'reviewInbox' | 'ledger'>('gateway');
  
  // انتخاب تعاونی فعال
  const allCooperatives = dataService.getAllCooperatives();
  const [selectedCoopId, setSelectedCoopId] = useState<string>(
    session?.activeCooperative?.id || allCooperatives[0]?.id || 'coop-1'
  );

  useEffect(() => {
    if (session?.activeCooperative?.id) {
      setSelectedCoopId(session.activeCooperative.id);
    }
  }, [session?.activeCooperative?.id]);

  const activeCoop = allCooperatives.find(c => c.id === selectedCoopId) || allCooperatives[0];

  // متغیرهای نشست
  const isSuperAdmin = session?.isGlobalSuperAdmin || false;
  const isCoopAdmin = session?.activeRole === 'COOP_ADMIN' || isSuperAdmin;
  const isMember = session?.activeRole === 'MEMBER';
  const currentMemberId = session?.activeMembership?.id;

  // واکشی داده‌ها
  const allPayments = dataService.getPayments(selectedCoopId, isSuperAdmin);
  const allReceipts = dataService.getReceipts(selectedCoopId, isSuperAdmin);
  const allInstallments = dataService.getAllInstallmentItems(selectedCoopId, isSuperAdmin);
  const allMonthlyFees = dataService.getMonthlyFees(selectedCoopId, isSuperAdmin);
  const allUnits = dataService.getUnits(selectedCoopId, isSuperAdmin);
  const allUsers = dataService.getAllUsers();
  const allMemberships = dataService.getMemberships(selectedCoopId);

  // اقساط و هزینه‌های قابل پرداخت
  // اگر کاربر عضو است، فقط موارد خودش، در غیر این صورت همه موارد
  const unpaidInstallments = allInstallments.filter(item => {
    const isDue = item.status !== 'PAID';
    if (isMember && currentMemberId) {
      const plan = dataService.getInstallmentPlans(selectedCoopId, isSuperAdmin).find(p => p.id === item.planId);
      return isDue && plan?.memberId === currentMemberId;
    }
    return isDue;
  });

  const unpaidFees = allMonthlyFees.filter(fee => {
    const isDue = fee.status !== 'PAID';
    if (isMember && currentMemberId) {
      return isDue && fee.memberId === currentMemberId;
    }
    return isDue;
  });

  // شمارنده‌ها
  const pendingReceiptsCount = allPayments.filter(p => p.status === 'PENDING_APPROVAL').length;
  const approvedPaymentsCount = allPayments.filter(p => p.status === 'APPROVED' || p.status === 'SUCCESS').length;
  const totalApprovedRial = allPayments
    .filter(p => p.status === 'APPROVED' || p.status === 'SUCCESS')
    .reduce((sum, p) => sum + p.amountRial, 0);

  // استیت‌های مودال‌ها
  const [isGatewayOpen, setIsGatewayOpen] = useState(false);
  const [gatewayTarget, setGatewayTarget] = useState<{
    targetType: 'INSTALLMENT' | 'MONTHLY_FEE';
    targetId: string;
    itemTitle: string;
    amountRial: number;
    memberId: string;
  } | null>(null);

  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploadTarget, setUploadTarget] = useState<{
    targetType: 'INSTALLMENT' | 'MONTHLY_FEE';
    targetId: string;
    itemTitle: string;
    amountRial: number;
    memberId: string;
  } | null>(null);

  const [selectedReviewPayment, setSelectedReviewPayment] = useState<Payment | null>(null);
  const [selectedVoucherPayment, setSelectedVoucherPayment] = useState<Payment | null>(null);

  // جستجو و فیلترها در دفترکل و کارتابل
  const [ledgerSearch, setLedgerSearch] = useState('');
  const [ledgerStatusFilter, setLedgerStatusFilter] = useState<string>('ALL');
  const [reviewFilter, setReviewFilter] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'>('PENDING');

  // شروع پرداخت آنلاین شاپرک
  const handleStartOnlinePay = (targetType: 'INSTALLMENT' | 'MONTHLY_FEE', targetId: string, title: string, remainingRial: number, memberId: string) => {
    setGatewayTarget({
      targetType,
      targetId,
      itemTitle: title,
      amountRial: remainingRial,
      memberId
    });
    setIsGatewayOpen(true);
  };

  // پردازش موفقیت پرداخت آنلاین ساندباکس
  const handleGatewaySuccess = (res: { trackingCode: string; cardMasked: string; gatewayName: string }) => {
    if (!gatewayTarget || !session) return;
    setIsGatewayOpen(false);

    try {
      const { payment } = dataService.createOnlineSandboxPayment({
        cooperativeId: selectedCoopId,
        memberId: gatewayTarget.memberId,
        targetType: gatewayTarget.targetType,
        targetId: gatewayTarget.targetId,
        amountRial: gatewayTarget.amountRial,
        gatewayName: res.gatewayName,
        cardMasked: res.cardMasked
      }, {
        id: session.user.id,
        fullName: session.user.fullName,
        role: session.activeRole
      });

      // نمایش رسید رسمی پرداخت
      setSelectedVoucherPayment(payment);
    } catch (err: any) {
      alert(err.message || 'خطا در ثبت پرداخت آنلاین');
    }
  };

  // شروع آپلود فیش دستی
  const handleStartUploadReceipt = (targetType: 'INSTALLMENT' | 'MONTHLY_FEE', targetId: string, title: string, remainingRial: number, memberId: string) => {
    setUploadTarget({
      targetType,
      targetId,
      itemTitle: title,
      amountRial: remainingRial,
      memberId
    });
    setIsUploadModalOpen(true);
  };

  // ثبت نهایی فیش دستی
  const handleReceiptSubmit = (receiptData: any) => {
    if (!uploadTarget || !session) return;
    try {
      dataService.submitOfflineReceiptPayment({
        cooperativeId: selectedCoopId,
        memberId: uploadTarget.memberId,
        targetType: uploadTarget.targetType,
        targetId: uploadTarget.targetId,
        amountRial: receiptData.amountRial,
        bankName: receiptData.bankName,
        referenceNumber: receiptData.referenceNumber,
        depositDate: receiptData.depositDate,
        depositTime: receiptData.depositTime,
        depositAccount: receiptData.depositAccount,
        fileUrl: receiptData.fileUrl,
        originalFileName: receiptData.originalFileName,
        fileSizeBytes: receiptData.fileSizeBytes,
        mimeType: receiptData.mimeType
      }, {
        id: session.user.id,
        fullName: session.user.fullName,
        role: session.activeRole
      });
      setIsUploadModalOpen(false);
      setActiveSubTab('reviewInbox');
    } catch (err: any) {
      alert(err.message || 'خطا در ثبت فیش');
    }
  };

  // تایید فیش توسط مدیر
  const handleApproveReceipt = (paymentId: string) => {
    if (!session) return;
    try {
      dataService.approveReceiptPayment(paymentId, {
        id: session.user.id,
        fullName: session.user.fullName,
        role: session.activeRole
      });
      setSelectedReviewPayment(null);
    } catch (err: any) {
      alert(err.message || 'خطا در تایید فیش');
    }
  };

  // رد فیش توسط مدیر
  const handleRejectReceipt = (paymentId: string, reason: string) => {
    if (!session) return;
    try {
      dataService.rejectReceiptPayment(paymentId, reason, {
        id: session.user.id,
        fullName: session.user.fullName,
        role: session.activeRole
      });
      setSelectedReviewPayment(null);
    } catch (err: any) {
      alert(err.message || 'خطا در رد فیش');
    }
  };

  // فیلتر کردن پرداخت‌ها در کارتابل بررسی
  const reviewPayments = allPayments.filter(p => {
    if (reviewFilter === 'PENDING') return p.status === 'PENDING_APPROVAL';
    if (reviewFilter === 'APPROVED') return p.status === 'APPROVED' || p.status === 'SUCCESS';
    if (reviewFilter === 'REJECTED') return p.status === 'REJECTED';
    return true;
  });

  // فیلتر کردن دفترکل
  const filteredLedger = allPayments.filter(p => {
    const matchesStatus = ledgerStatusFilter === 'ALL' || p.status === ledgerStatusFilter;
    const matchesSearch = !ledgerSearch || 
      p.trackingCode.toLowerCase().includes(ledgerSearch.toLowerCase()) ||
      p.gatewayName?.toLowerCase().includes(ledgerSearch.toLowerCase()) ||
      p.amountRial.toString().includes(ledgerSearch);
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      {/* سربرگ مدیریت مالی پروداکشن */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">امور مالی و پرداخت‌ها</h2>
          <p className="text-xs text-slate-500 mt-1">
            پرداخت شتابی اقساط و شارژ، بارگذاری فیش‌های بانکی و کارتابل تایید حسابداری
          </p>
        </div>

        <div className="flex items-center gap-2 bg-white px-3.5 py-2 rounded-xl border border-slate-200 shadow-xs">
          <Building2 className="w-4 h-4 text-emerald-600" />
          <span className="text-xs font-bold text-slate-500">پروژه فعال:</span>
          <select
            value={selectedCoopId}
            onChange={(e) => setSelectedCoopId(e.target.value)}
            className="text-xs font-bold text-slate-900 bg-transparent focus:outline-hidden cursor-pointer"
          >
            {allCooperatives.map(c => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.projectName})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* کارت‌های شاخص‌های کلیدی مالی */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-bold text-slate-500">کل دریافتی‌های تایید شده:</span>
            <div className="text-lg font-black text-emerald-700">{formatRial(totalApprovedRial)}</div>
            <div className="text-[11px] text-slate-400 font-medium">معادل {formatToman(totalApprovedRial)}</div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Coins className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-bold text-slate-500">فیش‌های در انتظار بررسی:</span>
            <div className="text-2xl font-black text-amber-600">{toPersianDigits(pendingReceiptsCount)} فیش</div>
            <div className="text-[11px] text-amber-700 font-medium">نیازمند اقدام در کارتابل</div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <Inbox className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-bold text-slate-500">تراکنش‌های تایید شده:</span>
            <div className="text-2xl font-black text-slate-900">{toPersianDigits(approvedPaymentsCount)} تراکنش</div>
            <div className="text-[11px] text-emerald-600 font-medium">شاپرک و فیش‌های معتبر</div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-bold text-slate-500">بدهی‌های سررسیدشده جاری:</span>
            <div className="text-2xl font-black text-rose-600">{toPersianDigits(unpaidInstallments.length + unpaidFees.length)} مورد</div>
            <div className="text-[11px] text-slate-400 font-medium">قسط ساخت و شارژ ماهانه</div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center">
            <Clock className="w-6 h-6" />
          </div>
        </div>

      </div>

      {/* منوی تب‌های فرعی */}
      <div className="bg-white p-1.5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-wrap items-center gap-1.5">
        
        <button
          onClick={() => setActiveSubTab('gateway')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all ${
            activeSubTab === 'gateway'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <CreditCard className="w-4 h-4" />
          <span>پرداخت آنلاین شاپرک</span>
          <span className="bg-slate-700 text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold">
            {toPersianDigits(unpaidInstallments.length + unpaidFees.length)}
          </span>
        </button>

        <button
          onClick={() => setActiveSubTab('uploadReceipt')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all ${
            activeSubTab === 'uploadReceipt'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Upload className="w-4 h-4" />
          <span>ثبت فیش واریز بانکی</span>
        </button>

        <button
          onClick={() => setActiveSubTab('reviewInbox')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all ${
            activeSubTab === 'reviewInbox'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Inbox className="w-4 h-4" />
          <span>کارتابل بررسی فیش‌ها</span>
          {pendingReceiptsCount > 0 && (
            <span className="bg-amber-500 text-slate-900 font-black text-[10px] px-2 py-0.5 rounded-full">
              {toPersianDigits(pendingReceiptsCount)} نیازمند اقدام
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveSubTab('ledger')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all ${
            activeSubTab === 'ledger'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>دفترکل تراکنش‌ها</span>
          <span className="bg-slate-200 text-slate-700 text-[10px] px-1.5 py-0.5 rounded-full">
            {toPersianDigits(allPayments.length)}
          </span>
        </button>

      </div>

      {/* ۱. تب درگاه پرداخت آنلاین شاپرک */}
      {activeSubTab === 'gateway' && (
        <div className="space-y-6">
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-emerald-600" />
              <span>اقساط و هزینه‌های قابل پرداخت آنلاین ({activeCoop.name}):</span>
            </h3>

            {unpaidInstallments.length === 0 && unpaidFees.length === 0 ? (
              <div className="bg-white p-12 text-center rounded-3xl border border-slate-200 space-y-3">
                <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
                <h4 className="font-bold text-slate-800">هیچ بدهی سررسیدشده‌ای یافت نشد!</h4>
                <p className="text-xs text-slate-500">تمامی اقساط و هزینه‌ها در این پروژه تسویه شده‌اند.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* اقساط ساختمانی */}
                {unpaidInstallments.map(item => {
                  const plan = dataService.getInstallmentPlans(selectedCoopId, isSuperAdmin).find(p => p.id === item.planId);
                  const remaining = item.amountRial - item.paidAmountRial;
                  const membership = allMemberships.find(m => m.id === plan?.memberId);
                  const memberUser = allUsers.find(u => u.id === membership?.userId);

                  return (
                    <div 
                      key={item.id} 
                      className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs hover:border-emerald-300 transition-all space-y-4"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="space-y-1">
                          <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
                            قسط ساختمانی پروژه
                          </span>
                          <h4 className="text-sm font-black text-slate-900">{item.stageTitle}</h4>
                          <p className="text-xs text-slate-500">عضو متعهد: {memberUser?.fullName || 'عضو تعاونی'}</p>
                        </div>

                        <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                          item.status === 'OVERDUE' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'
                        }`}>
                          {item.status === 'OVERDUE' ? 'سررسید گذشته' : 'در انتظار پرداخت'}
                        </span>
                      </div>

                      <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <span className="text-slate-500 text-[11px]">کل مبلغ قسط:</span>
                          <div className="font-bold text-slate-800 mt-0.5">{formatRial(item.amountRial)}</div>
                        </div>
                        <div>
                          <span className="text-slate-500 text-[11px]">مانده قابل پرداخت:</span>
                          <div className="font-black text-rose-600 mt-0.5">{formatRial(remaining)}</div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between gap-3 pt-1">
                        <span className="text-[11px] text-slate-500">
                          سررسید: {item.dueDate.slice(0, 10)}
                        </span>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleStartUploadReceipt(
                              'INSTALLMENT', 
                              item.id, 
                              item.stageTitle, 
                              remaining, 
                              plan?.memberId || ''
                            )}
                            className="px-3 py-2 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-bold transition-colors flex items-center gap-1.5"
                          >
                            <Upload className="w-3.5 h-3.5" />
                            <span>ثبت فیش</span>
                          </button>

                          <button
                            onClick={() => handleStartOnlinePay(
                              'INSTALLMENT', 
                              item.id, 
                              item.stageTitle, 
                              remaining, 
                              plan?.memberId || ''
                            )}
                            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-600/20 flex items-center gap-1.5 transition-all"
                          >
                            <CreditCard className="w-3.5 h-3.5" />
                            <span>پرداخت آنلاین شاپرک</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {/* هزینه‌ها و شارژهای ماهانه */}
                {unpaidFees.map(fee => {
                  const membership = allMemberships.find(m => m.id === fee.memberId);
                  const memberUser = allUsers.find(u => u.id === membership?.userId);
                  const remaining = fee.amountRial - fee.paidAmountRial;

                  return (
                    <div 
                      key={fee.id} 
                      className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs hover:border-teal-300 transition-all space-y-4"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="space-y-1">
                          <span className="text-[11px] font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-md">
                            شارژ و هزینه ماهانه
                          </span>
                          <h4 className="text-sm font-black text-slate-900">{fee.title}</h4>
                          <p className="text-xs text-slate-500">ساکن/عضو: {memberUser?.fullName || 'عضو تعاونی'}</p>
                        </div>

                        <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-700">
                          سررسید {fee.dueDate.slice(0, 10)}
                        </span>
                      </div>

                      <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <span className="text-slate-500 text-[11px]">مبلغ شارژ:</span>
                          <div className="font-bold text-slate-800 mt-0.5">{formatRial(fee.amountRial)}</div>
                        </div>
                        <div>
                          <span className="text-slate-500 text-[11px]">مانده بدهی:</span>
                          <div className="font-black text-rose-600 mt-0.5">{formatRial(remaining)}</div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between gap-3 pt-1">
                        <span className="text-[11px] text-slate-500">
                          دوره: ماه {fee.periodMonth} سال {fee.periodYear}
                        </span>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleStartUploadReceipt(
                              'MONTHLY_FEE', 
                              fee.id, 
                              fee.title, 
                              remaining, 
                              fee.memberId
                            )}
                            className="px-3 py-2 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-bold transition-colors flex items-center gap-1.5"
                          >
                            <Upload className="w-3.5 h-3.5" />
                            <span>ثبت فیش</span>
                          </button>

                          <button
                            onClick={() => handleStartOnlinePay(
                              'MONTHLY_FEE', 
                              fee.id, 
                              fee.title, 
                              remaining, 
                              fee.memberId
                            )}
                            className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-md shadow-teal-600/20 flex items-center gap-1.5 transition-all"
                          >
                            <CreditCard className="w-3.5 h-3.5" />
                            <span>پرداخت آنلاین شاپرک</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}

              </div>
            )}
          </div>
        </div>
      )}

      {/* ۲. تب بارگذاری و ثبت فیش دستی */}
      {activeSubTab === 'uploadReceipt' && (
        <div className="space-y-6">
          {/* کارت شماره حساب و شبای رسمی */}
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white p-6 sm:p-8 rounded-3xl shadow-lg space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-700 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-teal-500/20 border border-teal-500/30 flex items-center justify-center text-teal-400">
                  <Building className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-base">{activeCoop.name}</h3>
                  <p className="text-xs text-slate-400 mt-0.5">اطلاعات حساب و شبای واریز رسمی جهت انتقال کارت‌به‌کارت یا پایا</p>
                </div>
              </div>

              <span className="text-xs font-bold bg-teal-500/20 text-teal-300 border border-teal-500/30 px-3 py-1 rounded-xl w-fit">
                حساب بانکی تایید شده تعاونی
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs pt-2">
              <div className="bg-white/5 p-4 rounded-2xl border border-white/10 space-y-1">
                <span className="text-slate-400">بانک و شعبه:</span>
                <div className="font-bold text-sm text-white">{activeCoop.bankAccountInfo.bankName}</div>
                <div className="text-[11px] text-slate-400">بنام: {activeCoop.bankAccountInfo.cardHolderName}</div>
              </div>

              <div className="bg-white/5 p-4 rounded-2xl border border-white/10 space-y-1">
                <span className="text-slate-400">شماره حساب:</span>
                <div className="font-mono font-bold text-sm text-white">{activeCoop.bankAccountInfo.accountNumber}</div>
              </div>

              <div className="bg-white/5 p-4 rounded-2xl border border-white/10 space-y-1">
                <span className="text-slate-400">شماره شبا (IBAN):</span>
                <div className="font-mono font-bold text-sm text-teal-300 dir-ltr">{activeCoop.bankAccountInfo.shebaNumber}</div>
              </div>
            </div>
          </div>

          {/* راهنمای بارگذاری و انتخاب بدهی */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Upload className="w-4 h-4 text-teal-600" />
                <span>انتخاب بدهی جهت ارسال فیش واریز بانکی:</span>
              </h3>
            </div>

            {unpaidInstallments.length === 0 && unpaidFees.length === 0 ? (
              <p className="text-xs text-slate-500">موردی برای واریز یافت نشد.</p>
            ) : (
              <div className="divide-y divide-slate-100">
                {unpaidInstallments.map(item => {
                  const plan = dataService.getInstallmentPlans(selectedCoopId, isSuperAdmin).find(p => p.id === item.planId);
                  const remaining = item.amountRial - item.paidAmountRial;
                  const membership = allMemberships.find(m => m.id === plan?.memberId);
                  const memberUser = allUsers.find(u => u.id === membership?.userId);

                  return (
                    <div key={item.id} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <div className="font-bold text-xs text-slate-800">{item.stageTitle}</div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          عضو: {memberUser?.fullName || 'عضو'} • مانده: {formatRial(remaining)}
                        </div>
                      </div>

                      <button
                        onClick={() => handleStartUploadReceipt('INSTALLMENT', item.id, item.stageTitle, remaining, plan?.memberId || '')}
                        className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>بارگذاری فیش برای این قسط</span>
                      </button>
                    </div>
                  );
                })}

                {unpaidFees.map(fee => {
                  const remaining = fee.amountRial - fee.paidAmountRial;
                  const membership = allMemberships.find(m => m.id === fee.memberId);
                  const memberUser = allUsers.find(u => u.id === membership?.userId);

                  return (
                    <div key={fee.id} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <div className="font-bold text-xs text-slate-800">{fee.title}</div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          عضو: {memberUser?.fullName || 'عضو'} • مبلغ: {formatRial(remaining)}
                        </div>
                      </div>

                      <button
                        onClick={() => handleStartUploadReceipt('MONTHLY_FEE', fee.id, fee.title, remaining, fee.memberId)}
                        className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>بارگذاری فیش برای این شارژ</span>
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ۳. تب کارتابل بررسی فیش‌ها (مدیر تعاونی) */}
      {activeSubTab === 'reviewInbox' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-200 space-y-5">
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-black text-slate-900">
                  کارتابل بررسی و تایید فیش‌های واریزی
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  بررسی تصویر فیش، مطابقت با پرینت بانکی، تایید رسمی و ثبت در دفترکل حسابداری
                </p>
              </div>

              {/* فیلتر وضعیت در کارتابل */}
              <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl text-xs font-bold">
                {[
                  { id: 'PENDING', label: 'در انتظار تایید', badge: pendingReceiptsCount },
                  { id: 'APPROVED', label: 'تایید شده', badge: approvedPaymentsCount },
                  { id: 'REJECTED', label: 'رد شده', badge: allPayments.filter(p => p.status === 'REJECTED').length },
                  { id: 'ALL', label: 'همه فیش‌ها' }
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setReviewFilter(tab.id as any)}
                    className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 text-xs ${
                      reviewFilter === tab.id
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <span>{tab.label}</span>
                    {tab.badge !== undefined && tab.badge > 0 && (
                      <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                        tab.id === 'PENDING' ? 'bg-amber-500 text-white' : 'bg-slate-200 text-slate-700'
                      }`}>
                        {toPersianDigits(tab.badge)}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* فهرست فیش‌ها برای بررسی */}
            {reviewPayments.length === 0 ? (
              <div className="p-12 text-center text-slate-500 space-y-2">
                <Inbox className="w-10 h-10 text-slate-300 mx-auto" />
                <p className="text-xs font-bold">هیچ فیشی در این دسته یافت نشد.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {reviewPayments.map(payment => {
                  const receipt = allReceipts.find(r => r.paymentId === payment.id);
                  const membership = allMemberships.find(m => m.id === payment.memberId);
                  const memberUser = allUsers.find(u => u.id === membership?.userId);

                  return (
                    <div 
                      key={payment.id} 
                      className={`p-4 rounded-2xl border transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                        payment.status === 'PENDING_APPROVAL' 
                          ? 'bg-amber-50/40 border-amber-200 hover:border-amber-300'
                          : payment.status === 'APPROVED' || payment.status === 'SUCCESS'
                          ? 'bg-white border-slate-200 hover:border-emerald-300'
                          : 'bg-rose-50/30 border-rose-200'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        {receipt?.fileUrl ? (
                          <img
                            src={receipt.fileUrl}
                            alt="فیش"
                            className="w-16 h-16 object-cover rounded-xl border border-slate-200 shadow-xs shrink-0 cursor-pointer"
                            onClick={() => setSelectedReviewPayment(payment)}
                          />
                        ) : (
                          <div className="w-16 h-16 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 shrink-0">
                            <CreditCard className="w-6 h-6" />
                          </div>
                        )}

                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-black text-sm text-slate-900">
                              {formatRial(payment.amountRial)}
                            </span>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              payment.status === 'PENDING_APPROVAL' ? 'bg-amber-100 text-amber-800' :
                              payment.status === 'APPROVED' || payment.status === 'SUCCESS' ? 'bg-emerald-100 text-emerald-800' :
                              'bg-rose-100 text-rose-800'
                            }`}>
                              {payment.status === 'PENDING_APPROVAL' ? 'در انتظار بررسی مدیر' :
                               payment.status === 'APPROVED' || payment.status === 'SUCCESS' ? 'تایید شده' : 'رد شده'}
                            </span>
                          </div>

                          <div className="text-xs text-slate-600 font-medium">
                            عضو: <span className="font-bold text-slate-800">{memberUser?.fullName || 'عضو تعاونی'}</span>
                            {receipt?.bankName && <span> • بانک: {receipt.bankName}</span>}
                          </div>

                          <div className="text-[11px] text-slate-400 font-mono">
                            کد رهگیری / ارجاع: {payment.trackingCode} • تاریخ واریز: {payment.paidAt.slice(0, 10)}
                          </div>

                          {receipt?.rejectReason && (
                            <div className="text-xs text-rose-700 bg-rose-50 p-1.5 rounded-lg font-bold">
                              دلیل رد: {receipt.rejectReason}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {receipt && (
                          <button
                            onClick={() => setSelectedReviewPayment(payment)}
                            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>بررسی دقیق فیش</span>
                          </button>
                        )}

                        <button
                          onClick={() => setSelectedVoucherPayment(payment)}
                          className="px-3 py-2 border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-bold transition-colors"
                          title="رسید الکترونیکی"
                        >
                          <FileText className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

          </div>
        </div>
      )}

      {/* ۴. تب دفترکل و تاریخچه تراکنش‌ها */}
      {activeSubTab === 'ledger' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-200 space-y-5">
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-black text-slate-900">
                  دفترکل جامع تراکنش‌ها و پرداخت‌های مالی
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  ثبت دائمی پرداخت‌های آنلاین شاپرک، فیش‌های واریزی تایید شده و پرداخت‌های ثبت‌شده توسط مدیر
                </p>
              </div>

              {/* جستجو و فیلتر */}
              <div className="flex items-center gap-3">
                <div className="relative">
                  <input
                    type="text"
                    value={ledgerSearch}
                    onChange={(e) => setLedgerSearch(e.target.value)}
                    placeholder="جستجو در کد رهگیری..."
                    className="text-xs px-3 py-2 pr-8 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 w-48"
                  />
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-2.5" />
                </div>

                <select
                  value={ledgerStatusFilter}
                  onChange={(e) => setLedgerStatusFilter(e.target.value)}
                  className="text-xs px-3 py-2 rounded-xl border border-slate-300 font-bold text-slate-700"
                >
                  <option value="ALL">همه وضعیت‌ها</option>
                  <option value="SUCCESS">موفق (شاپرک)</option>
                  <option value="APPROVED">تایید شده (فیش)</option>
                  <option value="PENDING_APPROVAL">در انتظار تایید</option>
                  <option value="REJECTED">رد شده</option>
                </select>
              </div>
            </div>

            {/* جدول دفترکل */}
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                    <th className="p-3 rounded-r-xl">شناسه و کد پیگیری</th>
                    <th className="p-3">عضو واریزکننده</th>
                    <th className="p-3">مبلغ ریالی</th>
                    <th className="p-3">روش پرداخت</th>
                    <th className="p-3">وضعیت</th>
                    <th className="p-3">تاریخ پرداخت</th>
                    <th className="p-3 rounded-l-xl text-center">عملیات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredLedger.map(payment => {
                    const membership = allMemberships.find(m => m.id === payment.memberId);
                    const memberUser = allUsers.find(u => u.id === membership?.userId);

                    return (
                      <tr key={payment.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="p-3 font-mono font-bold text-slate-900 dir-ltr text-left">
                          {payment.trackingCode}
                        </td>
                        <td className="p-3 font-bold text-slate-800">
                          {memberUser?.fullName || 'عضو تعاونی'}
                        </td>
                        <td className="p-3 font-black text-emerald-700">
                          {formatRial(payment.amountRial)}
                        </td>
                        <td className="p-3">
                          <span className="font-medium text-slate-700">
                            {payment.method === 'ONLINE_SANDBOX' ? 'درگاه آنلاین شاپرک' :
                             payment.method === 'OFFLINE_RECEIPT' ? 'فیش واریز بانکی' : 'تسویه مستقیم دفتر تعاونی'}
                          </span>
                        </td>
                        <td className="p-3">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            payment.status === 'SUCCESS' || payment.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-800' :
                            payment.status === 'PENDING_APPROVAL' ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-800'
                          }`}>
                            {payment.status === 'SUCCESS' || payment.status === 'APPROVED' ? 'تایید شده' :
                             payment.status === 'PENDING_APPROVAL' ? 'در انتظار بررسی' : 'رد شده'}
                          </span>
                        </td>
                        <td className="p-3 font-mono text-slate-600">
                          {payment.paidAt.slice(0, 10)}
                        </td>
                        <td className="p-3 text-center">
                          <button
                            onClick={() => setSelectedVoucherPayment(payment)}
                            className="p-1.5 hover:bg-slate-200 rounded-lg text-slate-700 transition-colors"
                            title="مشاهده رسید الکترونیکی معتبر"
                          >
                            <FileText className="w-4 h-4 text-emerald-600" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

          </div>
        </div>
      )}

      {/* مودال درگاه پرداخت آنلاین شاپرک */}
      {gatewayTarget && (
        <ShaparakGatewayModal
          isOpen={isGatewayOpen}
          onClose={() => setIsGatewayOpen(false)}
          onSuccess={handleGatewaySuccess}
          cooperativeName={activeCoop.name}
          projectName={activeCoop.projectName}
          amountRial={gatewayTarget.amountRial}
          itemTitle={gatewayTarget.itemTitle}
        />
      )}

      {/* مودال آپلود و ثبت فیش دستی */}
      {uploadTarget && (
        <ReceiptUploadModal
          isOpen={isUploadModalOpen}
          onClose={() => setIsUploadModalOpen(false)}
          onSubmit={handleReceiptSubmit}
          cooperative={activeCoop}
          itemTitle={uploadTarget.itemTitle}
          defaultAmountRial={uploadTarget.amountRial}
        />
      )}

      {/* مودال کارتابل اعتبارسنجی فیش (مدیر تعاونی) */}
      {selectedReviewPayment && (
        <ReceiptReviewModal
          isOpen={!!selectedReviewPayment}
          onClose={() => setSelectedReviewPayment(null)}
          onApprove={handleApproveReceipt}
          onReject={handleRejectReceipt}
          payment={selectedReviewPayment}
          receipt={allReceipts.find(r => r.paymentId === selectedReviewPayment.id)!}
          memberUser={allUsers.find(u => u.id === allMemberships.find(m => m.id === selectedReviewPayment.memberId)?.userId)}
          cooperative={activeCoop}
          installmentItem={allInstallments.find(i => i.id === selectedReviewPayment.installmentItemId)}
          monthlyFee={allMonthlyFees.find(f => f.id === selectedReviewPayment.installmentItemId)}
        />
      )}

      {/* مودال رسید الکترونیکی چاپی */}
      {selectedVoucherPayment && (
        <DigitalPaymentReceiptModal
          isOpen={!!selectedVoucherPayment}
          onClose={() => setSelectedVoucherPayment(null)}
          payment={selectedVoucherPayment}
          receipt={allReceipts.find(r => r.paymentId === selectedVoucherPayment.id)}
          cooperative={activeCoop}
          payerUser={allUsers.find(u => u.id === allMemberships.find(m => m.id === selectedVoucherPayment.memberId)?.userId)}
          itemTitle="قسط ساختمانی یا هزینه شارژ مسکن"
        />
      )}

    </div>
  );
};
