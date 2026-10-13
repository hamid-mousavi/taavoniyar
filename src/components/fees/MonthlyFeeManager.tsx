import React, { useState, useEffect } from 'react';
import { 
  Coins, 
  Plus, 
  Users, 
  Calendar, 
  CheckCircle2, 
  AlertCircle, 
  X, 
  Search, 
  Filter, 
  CreditCard, 
  Sparkles,
  Layers,
  Wrench,
  ShieldCheck,
  Zap,
  Check,
  Pencil,
  Trash2,
  FolderPlus,
  CalendarDays,
  UserCheck
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { dataService } from '../../services/dataService';
import { MonthlyFee, FeeCategory, PaymentMethod, Unit, Membership, User, FeeCategoryItem } from '../../types/database';
import { 
  formatRial, 
  formatToman, 
  toPersianDigits, 
  formatJalaliDate,
  formatJalaliDateShort,
  getCurrentJalaliDate
} from '../../utils/persian';
import { JalaliDatePicker } from '../common/JalaliDatePicker';

export const MonthlyFeeManager: React.FC = () => {
  const { session } = useAuth();
  const [fees, setFees] = useState<MonthlyFee[]>([]);
  const [members, setMembers] = useState<{ user: User; membership: Membership; unit?: Unit }[]>([]);
  const [categories, setCategories] = useState<FeeCategoryItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'PAID'>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');

  // مودال صدور گروهی یا انفرادی هزینه
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const currentJalali = getCurrentJalaliDate();
  const [bulkForm, setBulkForm] = useState({
    title: 'شارژ ماهانه و نگهداری مجتمع',
    amountRial: 20000000, // ۲ میلیون تومان
    dueDate: new Date(Date.now() + 15 * 86400000).toISOString(),
    periodMonth: currentJalali.month,
    periodYear: currentJalali.year,
    feeCategory: 'MONTHLY_CHARGE',
    targetFilter: 'ASSIGNED_UNITS_ONLY' as 'ALL_MEMBERS' | 'ASSIGNED_UNITS_ONLY' | 'SINGLE_MEMBER',
    targetMemberId: '',
    monthsCount: 1,
    notes: 'مصوب جلسه هیئت مدیره تعاونی'
  });

  // مودال افزودن دسته‌بندی جدید
  const [isNewCatModalOpen, setIsNewCatModalOpen] = useState(false);
  const [newCatTitle, setNewCatTitle] = useState('');

  // مودال تسویه مستقیم توسط مدیر به نیابت از عضو
  const [settlingFee, setSettlingFee] = useState<MonthlyFee | null>(null);
  const [settleForm, setSettleForm] = useState({
    paymentMethod: 'CASH_DESK' as 'CASH_DESK' | 'CARD_TO_CARD' | 'MANAGER_REGISTERED',
    referenceNumber: '',
    paidAt: new Date().toISOString(),
    notes: 'تحویل نقدی در دفتر تعاونی'
  });

  // مودال ویرایش گواهی هزینه
  const [editingFee, setEditingFee] = useState<MonthlyFee | null>(null);
  const [editForm, setEditForm] = useState({
    title: '',
    amountRial: 0,
    dueDate: new Date().toISOString(),
    feeCategory: 'MONTHLY_CHARGE',
    notes: ''
  });

  // مودال تایید حذف گواهی
  const [deletingFee, setDeletingFee] = useState<MonthlyFee | null>(null);

  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const allCoops = dataService.getAllCooperatives();
  const activeCoopId = session?.activeCooperative?.id || allCoops[0]?.id || '';

  const loadData = () => {
    if (!session) return;
    const fList = dataService.getMonthlyFees(
      session.activeCooperative?.id || null,
      session.isGlobalSuperAdmin
    );
    const mList = dataService.getMembers(
      session.activeCooperative?.id || null,
      session.isGlobalSuperAdmin
    );
    const catList = dataService.getFeeCategories(session.activeCooperative?.id || undefined);
    setFees(fList);
    setMembers(mList);
    setCategories(catList);

    if (mList.length > 0 && !bulkForm.targetMemberId) {
      setBulkForm(prev => ({ ...prev, targetMemberId: mList[0].membership.id }));
    }
  };

  useEffect(() => {
    loadData();
    const unsub = dataService.subscribe(loadData);
    return unsub;
  }, [session]);

  // ثبت دسته‌بندی جدید
  const handleCreateCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatTitle.trim()) return;
    try {
      const added = dataService.addFeeCategory({
        title: newCatTitle.trim(),
        cooperativeId: activeCoopId
      });
      setCategories(dataService.getFeeCategories(activeCoopId));
      setBulkForm(prev => ({ ...prev, feeCategory: added.name }));
      setNewCatTitle('');
      setIsNewCatModalOpen(false);
      setSuccessMsg(`دسته‌بندی «${added.title}» با موفقیت افزوده شد.`);
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      setError(err.message);
    }
  };

  // اجرای صدور گروهی یا تک‌عضو
  const handleBulkIssue = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!session) return;

    try {
      const created = dataService.createBulkMonthlyFees({
        cooperativeId: activeCoopId,
        title: bulkForm.title,
        amountRial: bulkForm.amountRial,
        dueDate: bulkForm.dueDate,
        periodMonth: bulkForm.periodMonth,
        periodYear: bulkForm.periodYear,
        feeCategory: bulkForm.feeCategory,
        targetFilter: bulkForm.targetFilter,
        targetMemberId: bulkForm.targetMemberId,
        monthsCount: bulkForm.monthsCount,
        notes: bulkForm.notes
      }, {
        id: session.user.id,
        fullName: session.user.fullName,
        role: session.activeRole
      });

      setSuccessMsg(`تعداد ${toPersianDigits(created.length)} گواهی هزینه با عنوان «${bulkForm.title}» با موفقیت صادر شد.`);
      setIsBulkModalOpen(false);
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setError(err.message);
    }
  };

  // ثبت ویرایش گواهی
  const handleUpdateFee = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingFee || !session) return;
    setError(null);

    try {
      const updated = dataService.updateMonthlyFee(editingFee.id, {
        title: editForm.title,
        amountRial: editForm.amountRial,
        dueDate: editForm.dueDate,
        feeCategory: editForm.feeCategory,
        notes: editForm.notes
      }, {
        id: session.user.id,
        fullName: session.user.fullName,
        role: session.activeRole
      });

      setSuccessMsg(`گواهی هزینه «${updated.title}» با موفقیت ویرایش شد.`);
      setEditingFee(null);
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      setError(err.message);
    }
  };

  // حذف گواهی
  const handleDeleteFee = () => {
    if (!deletingFee || !session) return;
    setError(null);

    try {
      dataService.deleteMonthlyFee(deletingFee.id, {
        id: session.user.id,
        fullName: session.user.fullName,
        role: session.activeRole
      });

      setSuccessMsg(`گواهی هزینه «${deletingFee.title}» به سطل بازیافت منتقل شد.`);
      setDeletingFee(null);
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      setError(err.message);
    }
  };

  // ثبت مستقیم پرداخت توسط مدیر تعاونی
  const handleManagerSettle = (e: React.FormEvent) => {
    e.preventDefault();
    if (!settlingFee || !session) return;
    setError(null);

    try {
      const updated = dataService.recordManagerFeePayment(settlingFee.id, {
        paymentMethod: settleForm.paymentMethod,
        referenceNumber: settleForm.referenceNumber || `DESK-${Date.now().toString().slice(-4)}`,
        paidAt: settleForm.paidAt,
        notes: settleForm.notes
      }, {
        id: session.user.id,
        fullName: session.user.fullName,
        role: session.activeRole
      });

      setSuccessMsg(`هزینه «${updated.title}» با موفقیت توسط مدیر تعاونی تسویه شد.`);
      setSettlingFee(null);
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const getCategoryLabel = (cat: string) => {
    const found = categories.find(c => c.name === cat);
    if (found) return found.title;
    switch (cat) {
      case 'MONTHLY_CHARGE': return 'شارژ ماهیانه';
      case 'ELEVATOR': return 'نگهداری آسانسور';
      case 'SECURITY': return 'نگهبانی و سرایداری';
      case 'UTILITIES': return 'قبوض مشترک';
      case 'REPAIR': return 'تعمیرات تأسیسات';
      default: return cat;
    }
  };

  const filteredFees = fees.filter(f => {
    const member = members.find(m => m.membership.id === f.memberId);
    const memberName = member?.user.fullName || '';
    const matchesSearch = f.title.includes(searchTerm) || memberName.includes(searchTerm);
    const matchesStatus = statusFilter === 'ALL' || f.status === statusFilter;
    const matchesCategory = categoryFilter === 'ALL' || f.feeCategory === categoryFilter;
    return matchesSearch && matchesStatus && matchesCategory;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* سربرگ بخش هزینه‌های جاری */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center">
              <Coins className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-black text-slate-900">هزینه‌های جاری و شارژ ماهانه مسکن</h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            مدیریت شارژ ماهیانه، صدور گروهی همگانی یا انفرادی، ویرایش و حذف گواهی‌ها، تقویم شمسی و تسویه با تاریخ پرداخت
          </p>
        </div>

        {session?.activeRole !== 'MEMBER' && (
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => {
                setError(null);
                setIsNewCatModalOpen(true);
              }}
              className="flex items-center justify-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer"
            >
              <FolderPlus className="w-4 h-4 text-emerald-600" />
              <span>دسته‌بندی جدید +</span>
            </button>

            <button
              onClick={() => {
                setError(null);
                setIsBulkModalOpen(true);
              }}
              className="flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-5 py-2.5 rounded-2xl text-xs font-bold transition-all shadow-sm cursor-pointer shrink-0"
            >
              <Zap className="w-4 h-4 text-emerald-400" />
              <span>صدور شارژ و هزینه (گروهی / انفرادی)</span>
            </button>
          </div>
        )}
      </div>

      {successMsg && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* فیلترها و جستجو */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="جستجوی عنوان هزینه یا نام عضو..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-4 pr-10 py-3 rounded-2xl bg-white border border-slate-200 text-xs outline-none focus:border-emerald-500 transition-all"
          />
          <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-3.5 pointer-events-none" />
        </div>

        <div className="flex items-center gap-2">
          {/* فیلتر وضعیت */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="bg-white border border-slate-200 text-slate-700 text-xs rounded-2xl px-3 py-3 outline-none cursor-pointer"
          >
            <option value="ALL">تمام وضعیت‌ها</option>
            <option value="PENDING">در انتظار پرداخت</option>
            <option value="PAID">تسویه‌شده</option>
          </select>

          {/* فیلتر دسته‌بندی */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="bg-white border border-slate-200 text-slate-700 text-xs rounded-2xl px-3 py-3 outline-none cursor-pointer"
          >
            <option value="ALL">تمام دسته‌بندی‌ها</option>
            {categories.map((c) => (
              <option key={c.id} value={c.name}>{c.title}</option>
            ))}
          </select>
        </div>
      </div>

      {/* جدول نمایش هزینه‌ها */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-600 border-b border-slate-200">
                <th className="py-4 px-5 font-bold">عنوان هزینه و دوره</th>
                <th className="py-4 px-4 font-bold">نام عضو و واحد</th>
                <th className="py-4 px-4 font-bold">دسته‌بندی</th>
                <th className="py-4 px-4 font-bold">مبلغ (ریال)</th>
                <th className="py-4 px-4 font-bold">سررسید (شمسی)</th>
                <th className="py-4 px-4 font-bold">وضعیت</th>
                <th className="py-4 px-4 font-bold text-center">عملیات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredFees.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    هیچ رکورد هزینه‌ای یافت نشد.
                  </td>
                </tr>
              ) : (
                filteredFees.map((fee) => {
                  const member = members.find(m => m.membership.id === fee.memberId);
                  const isPaid = fee.status === 'PAID';

                  return (
                    <tr key={fee.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-5 font-bold text-slate-900">
                        <div>{fee.title}</div>
                        <div className="text-[10px] text-slate-400 font-normal">
                          دوره: {toPersianDigits(fee.periodYear)}/{toPersianDigits(fee.periodMonth.toString().padStart(2, '0'))}
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-800">{member?.user.fullName || 'عضو نامشخص'}</div>
                        <div className="text-[10px] text-slate-500 font-mono">
                          {member?.unit ? `واحد ${toPersianDigits(member.unit.unitNumber)} (بلوک ${member.unit.block})` : 'فاقد واحد تخصیصی'}
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="inline-block bg-slate-100 text-slate-700 px-2 py-0.5 rounded-lg text-[10px] font-bold">
                          {getCategoryLabel(fee.feeCategory)}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                        {formatRial(fee.amountRial)}
                      </td>

                      <td className="py-3.5 px-4 font-mono text-slate-600">
                        {formatJalaliDateShort(fee.dueDate)}
                      </td>

                      <td className="py-3.5 px-4">
                        {isPaid ? (
                          <div className="flex flex-col">
                            <span className="inline-flex items-center gap-1 text-emerald-700 font-bold text-[11px]">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>تسویه‌شده</span>
                            </span>
                            {fee.paidAt && (
                              <span className="text-[10px] text-slate-400 font-mono">
                                {formatJalaliDateShort(fee.paidAt)}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-amber-700 font-bold text-[11px]">
                            <CalendarDays className="w-3.5 h-3.5" />
                            <span>در انتظار پرداخت</span>
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {!isPaid && session?.activeRole !== 'MEMBER' && (
                            <button
                              onClick={() => {
                                setSettlingFee(fee);
                                setSettleForm({
                                  paymentMethod: 'CASH_DESK',
                                  referenceNumber: `CASH-${Date.now().toString().slice(-4)}`,
                                  paidAt: new Date().toISOString(),
                                  notes: 'تسویه حضوری در دفتر تعاونی'
                                });
                              }}
                              className="px-2.5 py-1 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold transition-all shadow-xs cursor-pointer inline-flex items-center gap-1"
                              title="تسویه مستقیم هزینه"
                            >
                              <CreditCard className="w-3 h-3" />
                              <span>تسویه</span>
                            </button>
                          )}

                          {session?.activeRole !== 'MEMBER' && (
                            <>
                              <button
                                onClick={() => {
                                  setEditingFee(fee);
                                  setEditForm({
                                    title: fee.title,
                                    amountRial: fee.amountRial,
                                    dueDate: fee.dueDate,
                                    feeCategory: fee.feeCategory,
                                    notes: fee.notes || ''
                                  });
                                }}
                                className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                                title="ویرایش گواهی هزینه"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </button>

                              <button
                                onClick={() => setDeletingFee(fee)}
                                className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                                title="حذف گواهی هزینه (انتقال به بازیافت)"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* مودال صدور گروهی یا انفرادی هزینه */}
      {isBulkModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-slate-200 overflow-hidden relative max-h-[90vh] flex flex-col">
            <div className="p-6 bg-slate-900 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-emerald-400" />
                <h3 className="font-bold text-base">صدور گواهی هزینه و شارژ (گروهی یا تک‌عضو)</h3>
              </div>
              <button
                onClick={() => setIsBulkModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleBulkIssue} className="p-6 space-y-4 text-xs overflow-y-auto flex-1">
              {error && (
                <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* انتخاب جامعه هدف */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-700">مشمولین صدور هزینه:</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setBulkForm({ ...bulkForm, targetFilter: 'ASSIGNED_UNITS_ONLY' })}
                    className={`p-2.5 rounded-xl border text-[11px] font-bold text-center cursor-pointer transition-all ${
                      bulkForm.targetFilter === 'ASSIGNED_UNITS_ONLY'
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-900 ring-2 ring-emerald-500/20'
                        : 'bg-white border-slate-200 text-slate-600'
                    }`}
                  >
                    ساکنین دارای واحد
                  </button>

                  <button
                    type="button"
                    onClick={() => setBulkForm({ ...bulkForm, targetFilter: 'ALL_MEMBERS' })}
                    className={`p-2.5 rounded-xl border text-[11px] font-bold text-center cursor-pointer transition-all ${
                      bulkForm.targetFilter === 'ALL_MEMBERS'
                        ? 'bg-purple-50 border-purple-500 text-purple-900 ring-2 ring-purple-500/20'
                        : 'bg-white border-slate-200 text-slate-600'
                    }`}
                  >
                    کلیه اعضای تعاونی
                  </button>

                  <button
                    type="button"
                    onClick={() => setBulkForm({ ...bulkForm, targetFilter: 'SINGLE_MEMBER' })}
                    className={`p-2.5 rounded-xl border text-[11px] font-bold text-center cursor-pointer transition-all ${
                      bulkForm.targetFilter === 'SINGLE_MEMBER'
                        ? 'bg-blue-50 border-blue-500 text-blue-900 ring-2 ring-blue-500/20'
                        : 'bg-white border-slate-200 text-slate-600'
                    }`}
                  >
                    یک عضو خاص
                  </button>
                </div>
              </div>

              {/* در صورت انتخاب یک عضو خاص */}
              {bulkForm.targetFilter === 'SINGLE_MEMBER' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 bg-blue-50/60 rounded-2xl border border-blue-100">
                  <div className="space-y-1.5">
                    <label className="font-bold text-slate-700">انتخاب عضو مورد نظر *</label>
                    <select
                      value={bulkForm.targetMemberId}
                      onChange={e => setBulkForm({ ...bulkForm, targetMemberId: e.target.value })}
                      className="w-full p-2.5 rounded-xl border border-slate-300 bg-white font-medium outline-none text-xs"
                      required
                    >
                      {members.map(m => (
                        <option key={m.membership.id} value={m.membership.id}>
                          {m.user.fullName} {m.unit ? `(واحد ${m.unit.unitNumber})` : ''}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-bold text-slate-700">تعداد ماه‌های صدور (مثلا ۳ ماهه)</label>
                    <input
                      type="number"
                      min="1"
                      max="24"
                      value={bulkForm.monthsCount}
                      onChange={e => setBulkForm({ ...bulkForm, monthsCount: parseInt(e.target.value) || 1 })}
                      className="w-full p-2.5 rounded-xl border border-slate-300 bg-white font-mono outline-none text-xs"
                    />
                  </div>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="font-bold text-slate-700">عنوان هزینه *</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: شارژ ماهانه و نگهداری آسانسور"
                  value={bulkForm.title}
                  onChange={e => setBulkForm({ ...bulkForm, title: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-300 outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700">مبلغ هر دوره (ریال) *</label>
                  <input
                    type="number"
                    step="500000"
                    required
                    value={bulkForm.amountRial}
                    onChange={e => setBulkForm({ ...bulkForm, amountRial: parseInt(e.target.value) || 0 })}
                    className="w-full p-2.5 rounded-xl border border-slate-300 outline-none font-mono"
                  />
                  <span className="text-[10px] text-slate-500 font-sans block">
                    معادل: {formatToman(bulkForm.amountRial)}
                  </span>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="font-bold text-slate-700">دسته‌بندی هزینه</label>
                    <button
                      type="button"
                      onClick={() => setIsNewCatModalOpen(true)}
                      className="text-[10px] text-emerald-700 font-bold hover:underline cursor-pointer"
                    >
                      + افزودن دسته جدید
                    </button>
                  </div>
                  <select
                    value={bulkForm.feeCategory}
                    onChange={e => setBulkForm({ ...bulkForm, feeCategory: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-300 bg-white outline-none"
                  >
                    {categories.map(c => (
                      <option key={c.id} value={c.name}>{c.title}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* تقویم شمسی برای تاریخ سررسید */}
              <JalaliDatePicker
                label="موعد سررسید پرداخت (تقویم شمسی)"
                value={bulkForm.dueDate}
                onChange={iso => setBulkForm({ ...bulkForm, dueDate: iso })}
              />

              <div className="space-y-1.5">
                <label className="font-bold text-slate-700">توضیحات و مصوبه مجمع</label>
                <input
                  type="text"
                  placeholder="توضیحات اختیاری..."
                  value={bulkForm.notes}
                  onChange={e => setBulkForm({ ...bulkForm, notes: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-300 outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsBulkModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-bold cursor-pointer"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold cursor-pointer shadow-sm"
                >
                  صدور قطعی هزینه
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* مودال افزودن دسته‌بندی هزینه جدید */}
      {isNewCatModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl border border-slate-200 overflow-hidden relative">
            <div className="p-5 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FolderPlus className="w-5 h-5 text-emerald-400" />
                <h3 className="font-bold text-sm">افزودن دسته‌بندی هزینه جدید</h3>
              </div>
              <button
                onClick={() => setIsNewCatModalOpen(false)}
                className="w-7 h-7 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateCategory} className="p-5 space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="font-bold text-slate-700">عنوان دسته‌بندی جدید *</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: هزینه نگهداری فضای سبز و استخر"
                  value={newCatTitle}
                  onChange={e => setNewCatTitle(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 outline-none"
                  autoFocus
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsNewCatModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-bold cursor-pointer"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold cursor-pointer shadow-sm"
                >
                  افزودن دسته‌بندی
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* مودال ویرایش گواهی هزینه */}
      {editingFee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-slate-200 overflow-hidden relative">
            <div className="p-6 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Pencil className="w-5 h-5 text-emerald-400" />
                <h3 className="font-bold text-base">ویرایش گواهی هزینه</h3>
              </div>
              <button
                onClick={() => setEditingFee(null)}
                className="w-8 h-8 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleUpdateFee} className="p-6 space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="font-bold text-slate-700">عنوان هزینه *</label>
                <input
                  type="text"
                  required
                  value={editForm.title}
                  onChange={e => setEditForm({ ...editForm, title: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-300 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700">مبلغ (ریال) *</label>
                  <input
                    type="number"
                    step="500000"
                    required
                    value={editForm.amountRial}
                    onChange={e => setEditForm({ ...editForm, amountRial: parseInt(e.target.value) || 0 })}
                    className="w-full p-2.5 rounded-xl border border-slate-300 outline-none font-mono"
                  />
                  <span className="text-[10px] text-slate-500 font-sans block">
                    {formatToman(editForm.amountRial)}
                  </span>
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700">دسته‌بندی</label>
                  <select
                    value={editForm.feeCategory}
                    onChange={e => setEditForm({ ...editForm, feeCategory: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-300 bg-white outline-none"
                  >
                    {categories.map(c => (
                      <option key={c.id} value={c.name}>{c.title}</option>
                    ))}
                  </select>
                </div>
              </div>

              <JalaliDatePicker
                label="موعد سررسید (شمسی)"
                value={editForm.dueDate}
                onChange={iso => setEditForm({ ...editForm, dueDate: iso })}
              />

              <div className="space-y-1.5">
                <label className="font-bold text-slate-700">توضیحات</label>
                <input
                  type="text"
                  value={editForm.notes}
                  onChange={e => setEditForm({ ...editForm, notes: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-300 outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingFee(null)}
                  className="px-5 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-bold cursor-pointer"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold cursor-pointer shadow-sm"
                >
                  ذخیره تغییرات
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* مودال تایید حذف گواهی (حذف ایمن) */}
      {deletingFee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl border border-slate-200 p-6 space-y-4 text-center">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900">آیا از حذف این گواهی هزینه اطمینان دارید؟</h3>
              <p className="text-xs text-slate-500 mt-1">
                گواهی «{deletingFee.title}» به سطل بازیافت منتقل شده و در صورت نیاز توسط مدیر قابل بازیابی خواهد بود.
              </p>
            </div>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeletingFee(null)}
                className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-bold text-xs cursor-pointer"
              >
                انصراف
              </button>
              <button
                type="button"
                onClick={handleDeleteFee}
                className="px-6 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs cursor-pointer shadow-sm"
              >
                بله، انتقال به سطل بازیافت
              </button>
            </div>
          </div>
        </div>
      )}

      {/* مودال تسویه مستقیم توسط مدیر همراه با تقویم شمسی تاریخ پرداخت */}
      {settlingFee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-slate-200 overflow-hidden relative">
            <div className="p-6 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-emerald-400" />
                <h3 className="font-bold text-base">تسویه مستقیم هزینه توسط مدیر</h3>
              </div>
              <button
                onClick={() => setSettlingFee(null)}
                className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleManagerSettle} className="p-6 space-y-4 text-xs">
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                <div className="font-bold text-slate-900 text-sm">{settlingFee.title}</div>
                <div className="font-mono font-bold text-emerald-700 text-base">{formatRial(settlingFee.amountRial)}</div>
              </div>

              {/* تاریخ پرداخت شمسی */}
              <JalaliDatePicker
                label="تاریخ دقیق پرداخت وجه (تقویم شمسی)"
                value={settleForm.paidAt}
                onChange={iso => setSettleForm({ ...settleForm, paidAt: iso })}
                required
              />

              <div className="space-y-1.5">
                <label className="font-bold text-slate-700">روش دریافت وجه:</label>
                <select
                  value={settleForm.paymentMethod}
                  onChange={e => setSettleForm({ ...settleForm, paymentMethod: e.target.value as any })}
                  className="w-full p-3 rounded-xl border border-slate-300 bg-white font-medium outline-none"
                >
                  <option value="CASH_DESK">پرداخت نقدی / پوز دفتر تعاونی</option>
                  <option value="CARD_TO_CARD">کارت به کارت به حساب تعاونی</option>
                  <option value="MANAGER_REGISTERED">چک بانکی / واریز مستقیم تایید مدیر</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-slate-700">شماره ارجاع / رسید</label>
                <input
                  type="text"
                  placeholder="مثال: پیگیری ۹۸۳۴ یا شماره فیش پوز"
                  value={settleForm.referenceNumber}
                  onChange={e => setSettleForm({ ...settleForm, referenceNumber: e.target.value })}
                  className="w-full p-3 rounded-xl border border-slate-300 outline-none font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-slate-700">یادداشت مدیر</label>
                <input
                  type="text"
                  placeholder="توضیحات واریز..."
                  value={settleForm.notes}
                  onChange={e => setSettleForm({ ...settleForm, notes: e.target.value })}
                  className="w-full p-3 rounded-xl border border-slate-300 outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setSettlingFee(null)}
                  className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-bold cursor-pointer"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold cursor-pointer shadow-sm"
                >
                  ثبت قطعی تسویه
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
