import React, { useState, useEffect } from 'react';
import { 
  CalendarDays, 
  Plus, 
  Coins, 
  CheckCircle2, 
  AlertCircle, 
  X, 
  Home, 
  User, 
  Calculator, 
  Clock, 
  ArrowRight,
  Sparkles,
  Layers,
  Users,
  Trash2,
  Check,
  Calendar
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { dataService } from '../../services/dataService';
import { 
  InstallmentPlan, 
  InstallmentItem, 
  InstallmentStage, 
  Unit, 
  Membership, 
  User as UserType 
} from '../../types/database';
import { 
  formatRial, 
  formatToman, 
  toPersianDigits, 
  formatJalaliDate,
  formatJalaliDateShort,
  createDateFromJalali,
  getCurrentJalaliDate
} from '../../utils/persian';
import { JalaliDatePicker } from '../common/JalaliDatePicker';

interface StagePreset {
  stage: InstallmentStage;
  title: string;
  percent: number;
}

const DEFAULT_STAGES: StagePreset[] = [
  { stage: 'LAND_SHARE', title: 'قسط اول: سهم زمین و جواز ساخت', percent: 30 },
  { stage: 'FOUNDATION', title: 'قسط دوم: اسکلت، فونداسیون و سقف', percent: 25 },
  { stage: 'ROUGH_CONSTRUCTION', title: 'قسط سوم: سفت‌کاری و تیغه‌چینی', percent: 20 },
  { stage: 'FACILITIES', title: 'قسط چهارم: لوله‌کشی و تأسیسات', percent: 15 },
  { stage: 'FINISHING', title: 'قسط پنجم: نازک‌کاری، نما و تحویل موقت', percent: 10 }
];

export const InstallmentPlanManager: React.FC = () => {
  const { session } = useAuth();
  const [plans, setPlans] = useState<InstallmentPlan[]>([]);
  const [items, setItems] = useState<InstallmentItem[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [members, setMembers] = useState<{ user: UserType; membership: Membership; unit?: Unit }[]>([]);
  
  // مودال ایجاد برنامه جدید
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // فرم برنامه اقساط
  const [formScope, setFormScope] = useState<'SINGLE_UNIT' | 'ALL_MEMBERS'>('SINGLE_UNIT');
  const [calculationMode, setCalculationMode] = useState<'MONTHS' | 'STAGES'>('MONTHS');
  const [monthsCount, setMonthsCount] = useState<number>(12); // تعداد ماه‌های اقساط
  const [startDateIso, setStartDateIso] = useState<string>(new Date().toISOString());

  const [formCoopId, setFormCoopId] = useState('');
  const [formUnitId, setFormUnitId] = useState('');
  const [formMemberId, setFormMemberId] = useState('');
  const [formTitle, setFormTitle] = useState('برنامه اقساط ساختمانی');
  const [formTotalCostRial, setFormTotalCostRial] = useState<number>(24000000000); // ۲۴ میلیارد ریال (۲.۴ میلیارد تومان)

  // لیست اقساط در فرم
  const [stageItems, setStageItems] = useState<{
    stage: InstallmentStage;
    stageTitle: string;
    dueDate: string;
    amountRial: number;
  }[]>([]);

  // مودال تسویه قسط توسط مدیر به نیابت از عضو
  const [settlingItem, setSettlingItem] = useState<InstallmentItem | null>(null);
  const [settleAmountRial, setSettleAmountRial] = useState<number>(0);
  const [settleMethod, setSettleMethod] = useState<'CASH_DESK' | 'CARD_TO_CARD' | 'MANAGER_REGISTERED'>('CASH_DESK');
  const [settleRefNumber, setSettleRefNumber] = useState('');
  const [settleNotes, setSettleNotes] = useState('');

  // مودال حذف برنامه اقساط
  const [deletingPlan, setDeletingPlan] = useState<InstallmentPlan | null>(null);

  const loadData = () => {
    if (!session) return;
    const pList = dataService.getInstallmentPlans(
      session.activeCooperative?.id || null,
      session.isGlobalSuperAdmin
    );
    const iList = dataService.getAllInstallmentItems(
      session.activeCooperative?.id || null,
      session.isGlobalSuperAdmin
    );
    const uList = dataService.getUnits(
      session.activeCooperative?.id || null,
      session.isGlobalSuperAdmin
    );
    const mList = dataService.getMembers(
      session.activeCooperative?.id || null,
      session.isGlobalSuperAdmin
    );

    setPlans(pList);
    setItems(iList);
    setUnits(uList);
    setMembers(mList);
  };

  useEffect(() => {
    loadData();
    const unsub = dataService.subscribe(loadData);
    return unsub;
  }, [session]);

  const allCoops = dataService.getAllCooperatives();

  // محاسبه خودکار بر اساس تعداد ماه یا مراحل ۵ گانه
  const recalculateDistribution = (totalRial: number, mode: 'MONTHS' | 'STAGES', months: number, startIso: string) => {
    const start = new Date(startIso);
    let allocated = 0;

    if (mode === 'MONTHS') {
      const count = Math.max(1, months || 12);
      const amountPerMonth = Math.round(totalRial / count);
      const newItems = [];

      for (let m = 0; m < count; m++) {
        const dueDate = new Date(start.getFullYear(), start.getMonth() + m + 1, 15).toISOString();
        let amount = amountPerMonth;
        if (m === count - 1) {
          amount = totalRial - allocated;
        } else {
          allocated += amount;
        }

        const stages: InstallmentStage[] = ['LAND_SHARE', 'FOUNDATION', 'ROUGH_CONSTRUCTION', 'FACILITIES', 'FINISHING'];
        const stageIndex = Math.min(stages.length - 1, Math.floor((m / count) * stages.length));

        newItems.push({
          stage: stages[stageIndex],
          stageTitle: `قسط ماه ${toPersianDigits(m + 1)} از ${toPersianDigits(count)}`,
          dueDate,
          amountRial: amount
        });
      }
      setStageItems(newItems);
    } else {
      // مراحل ۵ گانه
      const newStages = DEFAULT_STAGES.map((preset, idx) => {
        const dueDate = new Date(start.getFullYear(), start.getMonth() + (idx + 1) * 3, 15).toISOString();
        let amount = Math.round((totalRial * preset.percent) / 100);

        if (idx === DEFAULT_STAGES.length - 1) {
          amount = totalRial - allocated;
        } else {
          allocated += amount;
        }

        return {
          stage: preset.stage,
          stageTitle: preset.title,
          dueDate,
          amountRial: amount
        };
      });
      setStageItems(newStages);
    }
  };

  const handleOpenModal = () => {
    const currentCoopId = session?.activeCooperative?.id || allCoops[0]?.id || '';
    setFormCoopId(currentCoopId);
    setFormScope('SINGLE_UNIT');
    setCalculationMode('MONTHS');
    setMonthsCount(12);
    const start = new Date().toISOString();
    setStartDateIso(start);

    const coopUnits = units.filter(u => u.cooperativeId === currentCoopId && u.assignedMemberId);
    const defaultUnit = coopUnits[0] || units[0];

    if (defaultUnit) {
      setFormUnitId(defaultUnit.id);
      setFormMemberId(defaultUnit.assignedMemberId || '');
      setFormTitle(`قرارداد ساخت واحد ${defaultUnit.unitNumber}`);
    } else {
      setFormUnitId('');
      setFormMemberId('');
      setFormTitle('قرارداد مالی ساخت واحد');
    }

    setFormTotalCostRial(24000000000);
    recalculateDistribution(24000000000, 'MONTHS', 12, start);
    setError(null);
    setIsModalOpen(true);
  };

  const handleUnitChange = (unitId: string) => {
    setFormUnitId(unitId);
    const foundUnit = units.find(u => u.id === unitId);
    if (foundUnit && foundUnit.assignedMemberId) {
      setFormMemberId(foundUnit.assignedMemberId);
      setFormTitle(`قرارداد ساخت واحد ${foundUnit.unitNumber}`);
    }
  };

  // مجموع اقساط
  const sumOfStageItems = stageItems.reduce((sum, item) => sum + (Number(item.amountRial) || 0), 0);
  const diffRial = formTotalCostRial - sumOfStageItems;
  const isSumExact = diffRial === 0;

  const handleCreatePlan = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!session) return;

    if (formScope === 'ALL_MEMBERS') {
      // صدور گروهی برای کلیه اعضا
      try {
        const result = dataService.createBulkInstallmentPlans({
          cooperativeId: formCoopId,
          targetFilter: 'ASSIGNED_UNITS_ONLY',
          title: formTitle,
          totalCostRial: formTotalCostRial,
          monthsCount: calculationMode === 'MONTHS' ? monthsCount : 5,
          startDate: startDateIso
        }, {
          id: session.user.id,
          fullName: session.user.fullName,
          role: session.activeRole
        });

        setSuccessMsg(`برنامه اقساط «${formTitle}» برای کلیه اعضای تعاونی (${toPersianDigits(result.plans.length)} واحد و مجموع ${toPersianDigits(result.itemsCount)} قسط) صادر شد.`);
        setIsModalOpen(false);
        setTimeout(() => setSuccessMsg(null), 4000);
      } catch (err: any) {
        setError(err.message);
      }
      return;
    }

    // صدور انفرادی برای یک واحد
    if (!formUnitId || !formMemberId) {
      setError('لطفاً واحد مسکونی دارای عضو را انتخاب فرمایید.');
      return;
    }

    if (!isSumExact) {
      setError(`خطای عدم تطابق: مجموع اقساط با کل برآورد همخوانی ندارد. اختلاف: ${diffRial.toLocaleString()} ریال.`);
      return;
    }

    try {
      const created = dataService.createInstallmentPlanWithItems({
        cooperativeId: formCoopId,
        unitId: formUnitId,
        memberId: formMemberId,
        title: formTitle,
        totalCostRial: formTotalCostRial,
        items: stageItems
      }, {
        id: session.user.id,
        fullName: session.user.fullName,
        role: session.activeRole
      });

      setSuccessMsg(`برنامه اقساط «${created.plan.title}» با ${toPersianDigits(created.items.length)} قسط با موفقیت ثبت شد.`);
      setIsModalOpen(false);
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setError(err.message);
    }
  };

  // حذف برنامه اقساط (Soft Delete)
  const handleDeletePlan = () => {
    if (!deletingPlan || !session) return;
    setError(null);

    try {
      dataService.deleteInstallmentPlan(deletingPlan.id, {
        id: session.user.id,
        fullName: session.user.fullName,
        role: session.activeRole
      });

      setSuccessMsg(`برنامه اقساط «${deletingPlan.title}» به سطل بازیافت منتقل شد.`);
      setDeletingPlan(null);
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* سربرگ بخش اقساط */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <CalendarDays className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-black text-slate-900">برنامه‌ریزی مالی و تقویم اقساط واحدها</h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            تعریف قرارداد ساخت، صدور گروهی اقساط برای کل اعضا، تعیین تعداد ماه‌ها، تقویم شمسی و تسهیم دقیق ریاضی
          </p>
        </div>

        {session?.activeRole !== 'MEMBER' && (
          <button
            onClick={handleOpenModal}
            className="flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-5 py-3 rounded-2xl text-xs font-bold transition-all shadow-sm cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4 text-emerald-400" />
            <span>صدور برنامه اقساط (انفرادی / کل اعضا)</span>
          </button>
        )}
      </div>

      {successMsg && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* لیست برنامه‌های اقساط */}
      <div className="space-y-4">
        {plans.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 text-slate-400 text-xs">
            هنوز هیچ برنامه اقساطی صادر نشده است. روی دکمه «صدور برنامه اقساط» کلیک کنید.
          </div>
        ) : (
          plans.map((plan) => {
            const planItems = items.filter(i => i.planId === plan.id);
            const unit = units.find(u => u.id === plan.unitId);
            const member = members.find(m => m.membership.id === plan.memberId);
            const totalPaid = planItems.reduce((sum, i) => sum + i.paidAmountRial, 0);
            const percent = plan.totalCostRial > 0 ? Math.round((totalPaid / plan.totalCostRial) * 100) : 0;

            return (
              <div key={plan.id} className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
                
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-base text-slate-900">{plan.title}</span>
                      <span className="bg-slate-100 text-slate-700 text-[10px] font-bold px-2 py-0.5 rounded">
                        واحد {unit ? toPersianDigits(unit.unitNumber) : '-'}
                      </span>
                    </div>
                    <div className="text-xs text-slate-500">
                      عضو متعهد: <span className="font-bold text-slate-800">{member?.user.fullName || 'عضو تعاونی'}</span> | تعداد اقساط: <span className="font-mono font-bold text-slate-700">{toPersianDigits(planItems.length)} قسط</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-left sm:text-right font-mono">
                      <div className="font-black text-slate-900 text-base">{formatRial(plan.totalCostRial)}</div>
                      <div className="text-[11px] text-slate-400 font-sans">{formatToman(plan.totalCostRial)}</div>
                    </div>

                    {session?.activeRole !== 'MEMBER' && (
                      <button
                        onClick={() => setDeletingPlan(plan)}
                        className="p-2 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                        title="حذف برنامه اقساط (انتقال به بازیافت)"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* نوار پیشرفت تسویه اقساط */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500">پیشرفت تسویه مالی قرارداد:</span>
                    <span className="font-bold text-emerald-800 font-mono">{toPersianDigits(percent)}٪</span>
                  </div>
                  <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-linear-to-r from-emerald-500 to-teal-500 rounded-full transition-all duration-300"
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>

                {/* ریز اقساط */}
                <div className="space-y-2 pt-2">
                  <div className="text-xs font-bold text-slate-700">اقساط سررسید ماهانه / مرحله‌ای:</div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 text-xs">
                    {planItems.map(item => (
                      <div key={item.id} className="p-3 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-900 text-[11px] truncate">{item.stageTitle}</span>
                          <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full ${
                            item.status === 'PAID' ? 'bg-emerald-100 text-emerald-800' :
                            item.status === 'PARTIAL' ? 'bg-indigo-100 text-indigo-800' :
                            item.status === 'OVERDUE' ? 'bg-rose-100 text-rose-800' :
                            'bg-amber-100 text-amber-800'
                          }`}>
                            {item.status === 'PAID' ? 'تسویه' : item.status === 'PARTIAL' ? 'ناقص' : item.status === 'OVERDUE' ? 'معوق' : 'در انتظار'}
                          </span>
                        </div>
                        
                        <div className="flex items-center justify-between text-[11px] font-mono text-slate-600">
                          <span>مبلغ: {formatRial(item.amountRial)}</span>
                          <span className="text-slate-500 font-sans">{formatJalaliDateShort(item.dueDate)}</span>
                        </div>

                        {item.status !== 'PAID' && session?.activeRole !== 'MEMBER' && (
                          <button
                            type="button"
                            onClick={() => {
                              setSettlingItem(item);
                              setSettleAmountRial(item.amountRial - item.paidAmountRial);
                              setSettleRefNumber(`INST-${Date.now().toString().slice(-4)}`);
                              setSettleNotes('تسویه حضوری در دفتر تعاونی');
                            }}
                            className="w-full mt-1.5 py-1 px-2 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-[10px] font-bold border border-emerald-200 transition-colors cursor-pointer flex items-center justify-center gap-1"
                          >
                            <Coins className="w-3 h-3 text-emerald-600" />
                            <span>ثبت پرداخت توسط مدیر (تسویه)</span>
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            );
          })
        )}
      </div>

      {/* مودال ایجاد برنامه اقساط */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden relative max-h-[90vh] flex flex-col">
            
            <div className="p-6 bg-slate-900 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <CalendarDays className="w-5 h-5 text-emerald-400" />
                <h3 className="font-bold text-base">صدور برنامه مالی و جدول اقساط ساخت</h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreatePlan} className="p-6 space-y-4 overflow-y-auto text-xs flex-1">
              {error && (
                <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* تعیین دامنه: انفرادی یا کل اعضا */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-700">دامنه صدور برنامه اقساط:</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setFormScope('SINGLE_UNIT')}
                    className={`p-3 rounded-2xl border font-bold text-center cursor-pointer transition-all ${
                      formScope === 'SINGLE_UNIT'
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-900 ring-2 ring-emerald-500/20'
                        : 'bg-white border-slate-200 text-slate-600'
                    }`}
                  >
                    یک واحد مشخص (عضو معین)
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormScope('ALL_MEMBERS')}
                    className={`p-3 rounded-2xl border font-bold text-center cursor-pointer transition-all ${
                      formScope === 'ALL_MEMBERS'
                        ? 'bg-purple-50 border-purple-500 text-purple-900 ring-2 ring-purple-500/20'
                        : 'bg-white border-slate-200 text-slate-600'
                    }`}
                  >
                    صدور برای کل اعضای تعاونی (تمام واحدها)
                  </button>
                </div>
              </div>

              {/* در صورت صدور انفرادی: انتخاب واحد */}
              {formScope === 'SINGLE_UNIT' && (
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700">انتخاب واحد مسکونی و عضو مربوطه *</label>
                  <select
                    value={formUnitId}
                    onChange={e => handleUnitChange(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 bg-white font-medium outline-none"
                    required
                  >
                    {units
                      .filter(u => u.assignedMemberId)
                      .map(u => {
                        const member = members.find(m => m.membership.id === u.assignedMemberId);
                        return (
                          <option key={u.id} value={u.id}>
                            واحد {u.unitNumber} (بلوک {u.block}) - عضو: {member?.user.fullName} ({member?.membership.membershipNumber})
                          </option>
                        );
                      })}
                  </select>
                </div>
              )}

              {/* عنوان و کل مبلغ */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700">عنوان قرارداد ساخت *</label>
                  <input
                    type="text"
                    required
                    value={formTitle}
                    onChange={e => setFormTitle(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700">کل مبلغ برآورد ساخت هر واحد (ریال) *</label>
                  <input
                    type="number"
                    step="500000000"
                    required
                    value={formTotalCostRial}
                    onChange={e => {
                      const val = parseInt(e.target.value) || 0;
                      setFormTotalCostRial(val);
                      recalculateDistribution(val, calculationMode, monthsCount, startDateIso);
                    }}
                    className="w-full p-2.5 rounded-xl border border-slate-300 outline-none font-mono"
                  />
                  <span className="text-[10px] text-slate-500 font-sans block">
                    معادل: {formatToman(formTotalCostRial)}
                  </span>
                </div>
              </div>

              {/* نحوه محاسبه و تقسیم اقساط: تعداد ماه یا مراحل ساخت */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800">شیوه زمان‌بندی و تقسیم مبالغ:</span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setCalculationMode('MONTHS');
                        recalculateDistribution(formTotalCostRial, 'MONTHS', monthsCount, startDateIso);
                      }}
                      className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        calculationMode === 'MONTHS' ? 'bg-emerald-700 text-white shadow-xs' : 'bg-white text-slate-600 border'
                      }`}
                    >
                      بر حسب تعداد ماه (ماهانه)
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setCalculationMode('STAGES');
                        recalculateDistribution(formTotalCostRial, 'STAGES', monthsCount, startDateIso);
                      }}
                      className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        calculationMode === 'STAGES' ? 'bg-emerald-700 text-white shadow-xs' : 'bg-white text-slate-600 border'
                      }`}
                    >
                      بر مبنای ۵ مرحله ساختمانی
                    </button>
                  </div>
                </div>

                {calculationMode === 'MONTHS' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-200">
                    <div className="space-y-1.5">
                      <label className="font-bold text-slate-700">تعداد ماه‌های دوره اقساط:</label>
                      <div className="flex items-center gap-2">
                        <select
                          value={monthsCount}
                          onChange={e => {
                            const m = parseInt(e.target.value) || 12;
                            setMonthsCount(m);
                            recalculateDistribution(formTotalCostRial, 'MONTHS', m, startDateIso);
                          }}
                          className="flex-1 p-2 rounded-xl border border-slate-300 bg-white font-mono text-xs font-bold"
                        >
                          <option value="6">۶ ماهه</option>
                          <option value="12">۱۲ ماهه (۱ ساله)</option>
                          <option value="18">۱۸ ماهه (۱.۵ ساله)</option>
                          <option value="24">۲۴ ماهه (۲ ساله)</option>
                          <option value="36">۳۶ ماهه (۳ ساله)</option>
                          <option value="48">۴۸ ماهه (۴ ساله)</option>
                        </select>
                        <input
                          type="number"
                          min="1"
                          max="60"
                          placeholder="دلخواه"
                          value={monthsCount}
                          onChange={e => {
                            const m = parseInt(e.target.value) || 1;
                            setMonthsCount(m);
                            recalculateDistribution(formTotalCostRial, 'MONTHS', m, startDateIso);
                          }}
                          className="w-20 p-2 rounded-xl border border-slate-300 bg-white font-mono text-xs text-center"
                        />
                      </div>
                      <span className="text-[10px] text-slate-500 block">
                        مبلغ هر قسط ماهانه: {formatToman(Math.round(formTotalCostRial / monthsCount))}
                      </span>
                    </div>

                    <JalaliDatePicker
                      label="تاریخ شروع دوره اقساط"
                      value={startDateIso}
                      onChange={iso => {
                        setStartDateIso(iso);
                        recalculateDistribution(formTotalCostRial, calculationMode, monthsCount, iso);
                      }}
                    />
                  </div>
                )}
              </div>

              {/* پیش‌نمایش اقساط */}
              {formScope === 'SINGLE_UNIT' && (
                <div className="space-y-2">
                  <div className="font-bold text-slate-700 flex items-center justify-between">
                    <span>پیش‌نمایش سررسیدها و مبالغ ({toPersianDigits(stageItems.length)} قسط):</span>
                    <span className="font-mono text-emerald-700">{formatRial(sumOfStageItems)}</span>
                  </div>

                  <div className="max-h-48 overflow-y-auto space-y-1.5 border border-slate-200 rounded-2xl p-2 bg-slate-50/50">
                    {stageItems.map((item, idx) => (
                      <div key={idx} className="p-2 bg-white rounded-xl border border-slate-200 flex items-center justify-between text-[11px]">
                        <span className="font-bold text-slate-800">{item.stageTitle}</span>
                        <div className="flex items-center gap-3 font-mono text-slate-600">
                          <span>{formatRial(item.amountRial)}</span>
                          <span className="text-slate-400 font-sans">{formatJalaliDateShort(item.dueDate)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-bold cursor-pointer"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold cursor-pointer shadow-sm"
                >
                  {formScope === 'ALL_MEMBERS' ? 'صدور گروهی برای تمام اعضا' : 'ثبت قطعی برنامه اقساط'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* مودال تایید حذف برنامه اقساط (Soft Delete) */}
      {deletingPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl border border-slate-200 p-6 space-y-4 text-center">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900">آیا از حذف این برنامه اقساط اطمینان دارید؟</h3>
              <p className="text-xs text-slate-500 mt-1">
                برنامه «{deletingPlan.title}» و کلیه اقساط تابعه آن به سطل بازیافت منتقل می‌شوند و در صورت لزوم قابل بازیابی خواهند بود.
              </p>
            </div>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeletingPlan(null)}
                className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-bold text-xs cursor-pointer"
              >
                انصراف
              </button>
              <button
                type="button"
                onClick={handleDeletePlan}
                className="px-6 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs cursor-pointer shadow-sm"
              >
                بله، انتقال به بازیافت
              </button>
            </div>
          </div>
        </div>
      )}

      {/* مودال تسویه قسط توسط مدیر */}
      {settlingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-slate-200 overflow-hidden relative">
            <div className="p-6 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Coins className="w-5 h-5 text-emerald-400" />
                <h3 className="font-bold text-base">تسویه مستقیم قسط توسط مدیر</h3>
              </div>
              <button
                onClick={() => setSettlingItem(null)}
                className="w-8 h-8 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={(e) => {
              e.preventDefault();
              if (!settlingItem || !session) return;
              try {
                dataService.recordManagerInstallmentPayment(settlingItem.id, {
                  amountRial: settleAmountRial,
                  paymentMethod: settleMethod,
                  referenceNumber: settleRefNumber,
                  notes: settleNotes
                }, {
                  id: session.user.id,
                  fullName: session.user.fullName,
                  role: session.activeRole
                });
                setSuccessMsg('پرداخت قسط با موفقیت ثبت شد.');
                setSettlingItem(null);
                setTimeout(() => setSuccessMsg(null), 3000);
              } catch (err: any) {
                setError(err.message);
              }
            }} className="p-6 space-y-4 text-xs">
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                <div className="font-bold text-slate-900">{settlingItem.stageTitle}</div>
                <div className="font-mono font-bold text-emerald-700 text-sm mt-1">{formatRial(settlingItem.amountRial)}</div>
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-slate-700">مبلغ دریافتی (ریال):</label>
                <input
                  type="number"
                  value={settleAmountRial}
                  onChange={e => setSettleAmountRial(parseInt(e.target.value) || 0)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 font-mono outline-none"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-slate-700">روش دریافت:</label>
                <select
                  value={settleMethod}
                  onChange={e => setSettleMethod(e.target.value as any)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 bg-white outline-none"
                >
                  <option value="CASH_DESK">پرداخت نقدی / پوز دفتر تعاونی</option>
                  <option value="CARD_TO_CARD">کارت به کارت به حساب تعاونی</option>
                  <option value="MANAGER_REGISTERED">چک بانکی / واریز مستقیم</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-slate-700">شماره ارجاع / فیش:</label>
                <input
                  type="text"
                  value={settleRefNumber}
                  onChange={e => setSettleRefNumber(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 font-mono outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-slate-700">یادداشت:</label>
                <input
                  type="text"
                  value={settleNotes}
                  onChange={e => setSettleNotes(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setSettlingItem(null)}
                  className="px-5 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-bold cursor-pointer"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold cursor-pointer shadow-sm"
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
