import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  Users, 
  Home, 
  CalendarDays, 
  CreditCard, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  FileText, 
  ArrowLeftRight, 
  ShieldCheck, 
  Coins, 
  ArrowUpRight, 
  PieChart, 
  TrendingUp, 
  Check, 
  Sparkles,
  BarChart3
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { dataService } from '../../services/dataService';
import { 
  formatRial, 
  formatToman, 
  formatJalaliDate, 
  toPersianDigits 
} from '../../utils/persian';

export const AuthenticatedDashboard: React.FC = () => {
  const { session, switchTenant } = useAuth();
  const [, setTick] = useState(0);

  useEffect(() => {
    const unsub = dataService.subscribe(() => setTick(t => t + 1));
    return unsub;
  }, []);

  if (!session) return null;

  const { user, activeRole, activeCooperative } = session;
  const myMembership = session.activeMembership;
  const coopId = session.isGlobalSuperAdmin ? null : (activeCooperative?.id || null);

  const allCooperatives = dataService.getCooperatives(coopId, session.isGlobalSuperAdmin);
  const accessibleUnits = dataService.getUnits(coopId, session.isGlobalSuperAdmin)
    .filter(u => activeRole === 'MEMBER' ? u.assignedMemberId === myMembership?.id : true);

  const accessiblePayments = dataService.getPayments(
    coopId, 
    session.isGlobalSuperAdmin, 
    activeRole === 'MEMBER' ? myMembership?.id : undefined
  );

  const allInstallmentPlans = dataService.getInstallmentPlans(coopId, session.isGlobalSuperAdmin);
  const allInstallmentItems = dataService.getAllInstallmentItems(coopId, session.isGlobalSuperAdmin);
  const allMonthlyFees = dataService.getMonthlyFees(
    coopId, 
    session.isGlobalSuperAdmin, 
    activeRole === 'MEMBER' ? myMembership?.id : undefined
  );

  const pendingReceipts = dataService.getReceipts(coopId, session.isGlobalSuperAdmin)
    .filter(r => {
      const pay = accessiblePayments.find(p => p.id === r.paymentId);
      return pay && pay.status === 'PENDING_APPROVAL';
    });

  // محاسبات مالی دقیق (Financial Precision)
  const totalContractRial = allInstallmentPlans.reduce((sum, p) => sum + p.totalCostRial, 0);
  const totalCollectedInstallmentRial = allInstallmentItems.reduce((sum, i) => sum + i.paidAmountRial, 0);
  const overdueInstallmentItems = allInstallmentItems.filter(i => 
    i.status === 'OVERDUE' || (new Date(i.dueDate) < new Date() && i.status === 'PENDING')
  );
  const totalOverdueInstallmentRial = overdueInstallmentItems.reduce((sum, i) => sum + (i.amountRial - i.paidAmountRial), 0);

  const monthlyFeeCollectedRial = allMonthlyFees.filter(f => f.status === 'PAID').reduce((sum, f) => sum + f.paidAmountRial, 0);
  const monthlyFeeOverdueRial = allMonthlyFees.filter(f => f.status === 'PENDING').reduce((sum, f) => sum + f.amountRial, 0);

  const collectionPercent = totalContractRial > 0 
    ? Math.min(100, Math.round((totalCollectedInstallmentRial / totalContractRial) * 100)) 
    : 0;

  // تفکیک مراحل ساختمانی بر اساس اقساط صادرشده
  const STAGE_LABELS: Record<string, { title: string; color: string }> = {
    LAND_SHARE: { title: 'سهم زمین و جواز', color: 'from-amber-500 to-orange-500' },
    FOUNDATION: { title: 'گودبرداری و فونداسیون', color: 'from-blue-500 to-indigo-500' },
    ROUGH_CONSTRUCTION: { title: 'اسکلت و سفت‌کاری', color: 'from-emerald-500 to-teal-500' },
    FACILITIES: { title: 'تأسیسات مکانیکی و برقی', color: 'from-violet-500 to-purple-500' },
    FINISHING: { title: 'نازک‌کاری و تحویل واحدها', color: 'from-rose-500 to-pink-500' }
  };

  const stageBreakdown = Object.entries(STAGE_LABELS).map(([stageKey, meta]) => {
    const items = allInstallmentItems.filter(i => i.stage === stageKey);
    const totalRial = items.reduce((sum, i) => sum + i.amountRial, 0);
    const paidRial = items.reduce((sum, i) => sum + i.paidAmountRial, 0);
    const pct = totalRial > 0 ? Math.min(100, Math.round((paidRial / totalRial) * 100)) : 0;
    return { stageKey, stageTitle: meta.title, color: meta.color, totalRial, paidRial, pct, count: items.length };
  });

  // اطلاعات اقساط اختصاصی عضو
  const myInstallments = allInstallmentItems.filter(i => {
    if (activeRole === 'MEMBER' && myMembership) {
      const plan = allInstallmentPlans.find(p => p.memberId === myMembership.id);
      return plan ? i.planId === plan.id : false;
    }
    return false;
  });

  const memberTotalDue = myInstallments.reduce((sum, i) => sum + i.amountRial, 0);
  const memberTotalPaid = myInstallments.reduce((sum, i) => sum + i.paidAmountRial, 0);
  const memberProgressPercent = memberTotalDue > 0 ? Math.round((memberTotalPaid / memberTotalDue) * 100) : 0;

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      {/* بنر خوش‌آمدگویی و خلاصه وضعیت کانتکست */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950 rounded-3xl p-6 sm:p-8 text-white shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <img
              src={user.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150'}
              alt={user.fullName}
              className="w-16 h-16 rounded-2xl object-cover ring-4 ring-emerald-500/20 shadow-md"
            />
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h2 className="text-xl sm:text-2xl font-black">{user.fullName}</h2>
                <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                  activeRole === 'SUPER_ADMIN' ? 'bg-purple-500/30 text-purple-200 border border-purple-400/30' :
                  activeRole === 'COOP_ADMIN' ? 'bg-sky-500/30 text-sky-200 border border-sky-400/30' :
                  'bg-emerald-500/30 text-emerald-200 border border-emerald-400/30'
                }`}>
                  {activeRole === 'SUPER_ADMIN' ? 'مدیر ارشد سامانه' :
                   activeRole === 'COOP_ADMIN' ? 'مدیر تعاونی مسکن' : 'عضو تعاونی'}
                </span>
              </div>
              <p className="text-xs text-slate-300 font-medium">
                کد ملی: <span className="font-mono dir-ltr">{user.nationalCode}</span> • شماره تماس: <span className="font-mono dir-ltr">{user.mobile}</span>
              </p>
            </div>
          </div>

          {/* تعاونی فعال (کانتکست ایزوله‌شده) */}
          {activeCooperative ? (
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10 flex items-center gap-3">
              <Building2 className="w-8 h-8 text-emerald-400 shrink-0" />
              <div>
                <div className="text-[11px] text-slate-300 font-medium">پروژه و تعاونی فعال:</div>
                <div className="text-sm font-bold text-white">{activeCooperative.name}</div>
                <div className="text-xs text-emerald-300 font-medium">{activeCooperative.projectName}</div>
              </div>
            </div>
          ) : session.isGlobalSuperAdmin && (
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10 flex items-center gap-3">
              <ShieldCheck className="w-8 h-8 text-purple-400 shrink-0" />
              <div>
                <div className="text-[11px] text-slate-300 font-medium">سطح دید نظارتی:</div>
                <div className="text-sm font-bold text-white">دید فراگیر سراسری (کلیه تعاونی‌ها)</div>
                <div className="text-xs text-purple-300 font-medium">دسترسی تام ادمین کل</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ۱. نمایش داشبورد مدیر ارشد یا مدیر تعاونی با نمودارها و شاخص‌های مالی */}
      {(activeRole === 'SUPER_ADMIN' || activeRole === 'COOP_ADMIN') && (
        <div className="space-y-6">
          
          {/* کارت‌های شاخص‌های کلیدی مالی (KPI Cards) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            <div className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-xs space-y-1">
              <span className="text-xs font-bold text-slate-500">کل تعهدات قراردادهای ساخت</span>
              <div className="text-lg font-black text-slate-900 font-mono">{formatRial(totalContractRial)}</div>
              <div className="text-[11px] text-slate-400 font-medium">{formatToman(totalContractRial)}</div>
            </div>

            <div className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-xs space-y-1">
              <span className="text-xs font-bold text-emerald-700">کل وجوه وصول‌شده اقساط</span>
              <div className="text-lg font-black text-emerald-700 font-mono">{formatRial(totalCollectedInstallmentRial)}</div>
              <div className="text-[11px] text-emerald-600 font-medium">{formatToman(totalCollectedInstallmentRial)}</div>
            </div>

            <div className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-xs space-y-1">
              <span className="text-xs font-bold text-rose-600">اقساط معوق سررسید گذشته</span>
              <div className="text-lg font-black text-rose-600 font-mono">{formatRial(totalOverdueInstallmentRial)}</div>
              <div className="text-[11px] text-rose-700 font-medium">{toPersianDigits(overdueInstallmentItems.length)} قسط معوق</div>
            </div>

            <div className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-xs space-y-1">
              <span className="text-xs font-bold text-sky-700">شارژ و هزینه‌های وصولی</span>
              <div className="text-lg font-black text-sky-800 font-mono">{formatRial(monthlyFeeCollectedRial)}</div>
              <div className="text-[11px] text-slate-400 font-medium">معوق: {formatRial(monthlyFeeOverdueRial)}</div>
            </div>

          </div>

          {/* بخش نمودارها و گراف‌های مالی و ساختمانی (Visual Charts) */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* ۱. نمودار پیشرفت وصول مطالبات (Donut / Radial Progress Chart) */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <PieChart className="w-4 h-4 text-emerald-600" />
                  <h3 className="font-bold text-sm text-slate-900">نرخ وصول مطالبات ساختمانی</h3>
                </div>
                <span className="text-xs font-mono font-bold text-emerald-700">{toPersianDigits(collectionPercent)}%</span>
              </div>

              <div className="flex flex-col items-center justify-center py-4">
                {/* SVG دایره‌ای زیبا و واکنش‌گرا */}
                <div className="relative w-44 h-44 flex items-center justify-center">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      className="text-slate-100"
                      strokeWidth="10"
                      stroke="currentColor"
                      fill="transparent"
                    />
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      className="text-emerald-500 transition-all duration-1000 ease-out"
                      strokeWidth="10"
                      strokeDasharray={`${collectionPercent * 2.51} 251.2`}
                      strokeLinecap="round"
                      stroke="currentColor"
                      fill="transparent"
                    />
                  </svg>
                  <div className="absolute flex flex-col items-center justify-center text-center">
                    <span className="text-2xl font-black text-slate-900 font-mono">{toPersianDigits(collectionPercent)}%</span>
                    <span className="text-[10px] text-slate-400 font-bold">وصول نقدینگی</span>
                  </div>
                </div>

                <div className="w-full grid grid-cols-2 gap-2 mt-4 text-[11px] text-center">
                  <div className="p-2 rounded-xl bg-emerald-50 border border-emerald-100">
                    <span className="text-slate-500 block">وصول‌شده:</span>
                    <span className="font-bold text-emerald-800 font-mono">{formatToman(totalCollectedInstallmentRial)}</span>
                  </div>
                  <div className="p-2 rounded-xl bg-rose-50 border border-rose-100">
                    <span className="text-slate-500 block">مانده تعهدات:</span>
                    <span className="font-bold text-rose-800 font-mono">{formatToman(Math.max(0, totalContractRial - totalCollectedInstallmentRial))}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* ۲. نمودار مقایسه‌ای وضعیت اقساط و فیش‌ها (Bar Chart Comparison) */}
            <div className="lg:col-span-2 bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-indigo-600" />
                  <h3 className="font-bold text-sm text-slate-900">تراز توزیع واریزی‌ها و وضعیت اقساط</h3>
                </div>
                <span className="text-xs text-slate-400">تحلیل حسابرسی تعاونی</span>
              </div>

              <div className="space-y-4 py-2">
                {/* ستون ۱: وصول اقساط */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="font-bold text-slate-700">اقساط پرداخت‌شده و تسویه قطعی</span>
                    <span className="font-mono text-emerald-700 font-bold">{toPersianDigits(collectionPercent)}% ({formatToman(totalCollectedInstallmentRial)})</span>
                  </div>
                  <div className="w-full h-3 rounded-full bg-slate-100 overflow-hidden">
                    <div 
                      className="h-full bg-emerald-500 rounded-full transition-all duration-700" 
                      style={{ width: `${Math.max(4, collectionPercent)}%` }}
                    ></div>
                  </div>
                </div>

                {/* ستون ۲: معوقات */}
                {(() => {
                  const overduePercent = totalContractRial > 0 ? Math.round((totalOverdueInstallmentRial / totalContractRial) * 100) : 0;
                  return (
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="font-bold text-slate-700">اقساط معوق سررسید گذشته</span>
                        <span className="font-mono text-rose-600 font-bold">{toPersianDigits(overduePercent)}% ({formatToman(totalOverdueInstallmentRial)})</span>
                      </div>
                      <div className="w-full h-3 rounded-full bg-slate-100 overflow-hidden">
                        <div 
                          className="h-full bg-rose-500 rounded-full transition-all duration-700" 
                          style={{ width: `${Math.max(totalOverdueInstallmentRial > 0 ? 4 : 0, overduePercent)}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })()}

                {/* ستون ۳: شارژ ماهانه */}
                {(() => {
                  const totalFeeRial = monthlyFeeCollectedRial + monthlyFeeOverdueRial;
                  const feePercent = totalFeeRial > 0 ? Math.round((monthlyFeeCollectedRial / totalFeeRial) * 100) : 0;
                  return (
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="font-bold text-slate-700">نرخ وصول شارژ و خدمات جاری مجتمع</span>
                        <span className="font-mono text-sky-700 font-bold">{toPersianDigits(feePercent)}% ({formatToman(monthlyFeeCollectedRial)})</span>
                      </div>
                      <div className="w-full h-3 rounded-full bg-slate-100 overflow-hidden">
                        <div 
                          className="h-full bg-sky-500 rounded-full transition-all duration-700" 
                          style={{ width: `${Math.max(monthlyFeeCollectedRial > 0 ? 4 : 0, feePercent)}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* جعبه وضعیت فیش‌های منتظر اقدام */}
              <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Clock className="w-5 h-5 text-amber-600 shrink-0" />
                  <div>
                    <div className="text-xs font-bold text-amber-900">
                      فیش‌های واریزی در انتظار بازبینی و تایید: {toPersianDigits(pendingReceipts.length)} فقره
                    </div>
                    <div className="text-[11px] text-amber-700">
                      {pendingReceipts.length === 0 ? 'هیچ فیش معلقی وجود ندارد. تمام واریزی‌ها تسویه شده‌اند.' : 'جهت بررسی فیش‌های بانکی اعضا به تب امور مالی مراجعه نمایید.'}
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* ۳. نمودار پیشرفت تفکیکی فازهای ساختمانی و مالی پروژه (Construction Stages Progress) */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-600" />
                <h3 className="font-bold text-sm text-slate-900">پیشرفت مالی مراحل ساختمانی پروژه</h3>
              </div>
              <span className="text-xs text-slate-400">توزیع نقدینگی بر اساس مراحل مصوب ساخت</span>
            </div>

            <div className="space-y-4">
              {stageBreakdown.map(stage => (
                <div key={stage.stageKey} className="space-y-1.5 p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs gap-1">
                    <span className="font-bold text-slate-800 flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-slate-900"></span>
                      <span>{stage.stageTitle}</span>
                      <span className="text-[10px] text-slate-400 font-mono">({toPersianDigits(stage.count)} قسط)</span>
                    </span>
                    <div className="flex items-center gap-3 text-xs">
                      <span className="text-slate-500 font-medium">وصول: <strong className="text-emerald-700 font-mono">{formatToman(stage.paidRial)}</strong></span>
                      <span className="text-slate-400">از</span>
                      <span className="text-slate-600 font-bold font-mono">{formatToman(stage.totalRial)}</span>
                      <span className="font-black font-mono text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-lg text-[11px]">
                        {toPersianDigits(stage.pct)}%
                      </span>
                    </div>
                  </div>

                  <div className="w-full h-3 rounded-full bg-slate-200/70 overflow-hidden">
                    <div 
                      className={`h-full bg-gradient-to-r ${stage.color} rounded-full transition-all duration-700`}
                      style={{ width: `${Math.max(stage.paidRial > 0 ? 3 : 0, stage.pct)}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* تعاونی‌های تحت پوشش ادمین یا اطلاعات حساب بانکی تعاونی مدیر */}
          {activeRole === 'SUPER_ADMIN' ? (
            <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
              <h3 className="font-bold text-sm text-slate-900">تعاونی‌های مسکن ثبت‌شده در سامانه:</h3>
              {allCooperatives.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400 space-y-1">
                  <div>هیچ تعاونی ثبت‌شده‌ای وجود ندارد.</div>
                  <div className="text-slate-500 font-bold">از تب «تعاونی‌ها و پروژه‌ها» می‌توانید اولین تعاونی مسکن را ایجاد فرمایید.</div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {allCooperatives.map(coop => (
                    <div key={coop.id} className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900 text-sm">{coop.name}</span>
                        <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded">فعال</span>
                      </div>
                      <p className="text-emerald-800 font-medium">پروژه: {coop.projectName} ({toPersianDigits(coop.totalUnits)} واحد)</p>
                      <div className="text-slate-500">بانک عامل: {coop.bankAccountInfo.bankName}</div>
                      <button
                        onClick={() => switchTenant(coop.id)}
                        className="w-full mt-2 bg-white hover:bg-slate-100 border border-slate-200 text-slate-800 font-bold py-2 rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-2xs"
                      >
                        <ArrowLeftRight className="w-3.5 h-3.5 text-emerald-600" />
                        <span>فیلتر و مدیریت این تعاونی</span>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : activeCooperative && (
            <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-3 text-xs">
              <h3 className="font-bold text-sm text-slate-900">اطلاعات حساب بانکی رسمی پروژه جهت واریز اعضا:</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
                  <span className="text-slate-500 block mb-0.5">بانک عامل:</span>
                  <span className="font-bold text-slate-900 text-sm">{activeCooperative.bankAccountInfo.bankName}</span>
                </div>
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
                  <span className="text-slate-500 block mb-0.5">شماره حساب رسمی:</span>
                  <span className="font-bold font-mono text-slate-900 text-sm">{activeCooperative.bankAccountInfo.accountNumber}</span>
                </div>
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
                  <span className="text-slate-500 block mb-0.5">شناسه شبا (IBAN):</span>
                  <span className="font-bold font-mono text-slate-900 text-xs dir-ltr block">{activeCooperative.bankAccountInfo.shebaNumber}</span>
                </div>
              </div>
            </div>
          )}

        </div>
      )}

      {/* ۲. نمایش مخصوص عضو تعاونی (MEMBER) با درصد پیشرفت واریزی‌ها */}
      {activeRole === 'MEMBER' && (
        <div className="space-y-6">
          
          {/* مشخصات واحد مسکونی عضو */}
          {accessibleUnits.length > 0 && (
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    <Home className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-slate-900">مشخصات واحد مسکونی تخصیص‌یافته به شما</h3>
                    <p className="text-xs text-slate-500">{activeCooperative?.name} - {activeCooperative?.projectName}</p>
                  </div>
                </div>

                <span className="bg-emerald-100 text-emerald-800 text-xs px-3 py-1 rounded-full font-bold">
                  قرارداد قطعی
                </span>
              </div>

              {accessibleUnits.map(unit => (
                <div key={unit.id} className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                    <span className="text-slate-400 block mb-1">شماره واحد:</span>
                    <span className="text-lg font-black text-slate-900">واحد {toPersianDigits(unit.unitNumber)}</span>
                  </div>
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                    <span className="text-slate-400 block mb-1">بلوک و طبقه:</span>
                    <span className="text-lg font-black text-slate-900">بلوک {unit.block} - ط {toPersianDigits(unit.floor)}</span>
                  </div>
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                    <span className="text-slate-400 block mb-1">متراژ مفید:</span>
                    <span className="text-lg font-black text-emerald-700">{toPersianDigits(unit.areaM2)} م²</span>
                  </div>
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                    <span className="text-slate-400 block mb-1">پارکینگ / انباری:</span>
                    <span className="text-sm font-bold text-slate-800 font-mono mt-1 block">
                      {unit.parkingNumber || '-'} / {unit.storageNumber || '-'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* خلاصه مالی و گراف درصد تسویه تعهدات ساخت */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-xs space-y-2">
              <span className="text-xs text-slate-500 font-bold">کل مبلغ قرارداد ساخت واحد شما</span>
              <div className="text-lg font-black text-slate-900 font-mono">{formatRial(memberTotalDue)}</div>
              <div className="text-[11px] text-slate-400">{formatToman(memberTotalDue)}</div>
            </div>

            <div className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-xs space-y-2">
              <span className="text-xs text-emerald-700 font-bold">مجموع واریزی‌های تسویه‌شده</span>
              <div className="text-lg font-black text-emerald-700 font-mono">{formatRial(memberTotalPaid)}</div>
              <div className="text-[11px] text-emerald-600 font-medium">پیشرفت: {toPersianDigits(memberProgressPercent)}%</div>
            </div>

            <div className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-xs space-y-2">
              <span className="text-xs text-rose-600 font-bold">مانده تعهدات ساختمانی</span>
              <div className="text-lg font-black text-rose-600 font-mono">{formatRial(Math.max(0, memberTotalDue - memberTotalPaid))}</div>
              <div className="text-[11px] text-rose-700 font-medium">{formatToman(Math.max(0, memberTotalDue - memberTotalPaid))}</div>
            </div>
          </div>

          {/* نوار گرافیکی و چارت دایره‌ای پیشرفت تسویه اقساط عضو */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                  <PieChart className="w-4 h-4 text-emerald-600" />
                  <span>شاخص تسویه حساب تعهدات واحد مسکونی شما</span>
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">نسبت پرداخت‌های انجام‌شده به کل ارزش قرارداد</p>
              </div>
              <span className="font-mono font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-xl text-xs">
                {toPersianDigits(memberProgressPercent)}% تسویه شده
              </span>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-6 py-2">
              <div className="relative w-36 h-36 shrink-0 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  <circle
                    cx="50"
                    cy="50"
                    r="38"
                    className="text-slate-100"
                    strokeWidth="9"
                    stroke="currentColor"
                    fill="transparent"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="38"
                    className="text-emerald-500 transition-all duration-1000 ease-out"
                    strokeWidth="9"
                    strokeDasharray={`${memberProgressPercent * 2.38} 238.7`}
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="transparent"
                  />
                </svg>
                <div className="absolute flex flex-col items-center justify-center text-center">
                  <span className="text-xl font-black text-slate-900 font-mono">{toPersianDigits(memberProgressPercent)}%</span>
                  <span className="text-[9px] text-slate-400 font-bold">تسویه کل</span>
                </div>
              </div>

              <div className="flex-1 w-full space-y-3">
                <div className="space-y-1">
                  <div className="flex justify-between text-xs text-slate-600">
                    <span>پیشرفت تسویه واریزی‌ها</span>
                    <span className="font-mono font-bold text-emerald-700">{formatToman(memberTotalPaid)}</span>
                  </div>
                  <div className="w-full h-3 rounded-full bg-slate-100 overflow-hidden">
                    <div 
                      className="h-full bg-linear-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-700"
                      style={{ width: `${Math.max(memberTotalPaid > 0 ? 5 : 0, memberProgressPercent)}%` }}
                    ></div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="text-[11px] text-slate-400 block">اقساط پرداخت‌شده:</span>
                    <span className="font-bold text-emerald-700 font-mono text-sm">
                      {toPersianDigits(myInstallments.filter(i => i.status === 'PAID').length)} قسط
                    </span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="text-[11px] text-slate-400 block">اقساط در نوبت / مانده:</span>
                    <span className="font-bold text-slate-700 font-mono text-sm">
                      {toPersianDigits(myInstallments.filter(i => i.status !== 'PAID').length)} قسط
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>
      )}

    </div>
  );
};
