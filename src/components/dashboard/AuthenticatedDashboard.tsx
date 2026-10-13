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
  LogIn,
  ArrowRight,
  ExternalLink,
  ChevronLeft
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { dataService } from '../../services/dataService';
import { 
  formatRial, 
  formatToman, 
  formatJalaliDate, 
  toPersianDigits 
} from '../../utils/persian';

interface AuthenticatedDashboardProps {
  onOpenTenantSwitcher?: () => void;
  onOpenLogin?: () => void;
}

export const AuthenticatedDashboard: React.FC<AuthenticatedDashboardProps> = () => {
  const { session, switchTenant, quickLoginAs } = useAuth();
  const [, setTick] = useState(0);

  useEffect(() => {
    const unsub = dataService.subscribe(() => setTick(t => t + 1));
    return unsub;
  }, []);

  const allCooperatives = dataService.getAllCooperatives();
  const allUsers = dataService.getAllUsers();
  const allPayments = dataService.getPayments(null, true);

  // اگر کاربر وارد نشده باشد: نمایش پورتال عمومی تعاونی‌ها
  if (!session) {
    return (
      <div className="space-y-8 animate-in fade-in duration-300">
        
        {/* بنر اصلی سامانه */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950 rounded-3xl p-8 sm:p-12 text-white shadow-xl">
          <div className="max-w-3xl space-y-4">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
              <span className="text-xs font-bold text-emerald-300">پورتال یکپارچه تعاونی‌های مسکن</span>
            </div>
            
            <h2 className="text-2xl sm:text-4xl font-black tracking-tight leading-tight">
              مدیریت شفاف پروژه‌های مسکن، اقساط ساخت و واریزی‌های اعضا
            </h2>
            
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-normal">
              سامانه مسکن‌یار بستر رسمی نظارت بر روند پیشرفت ساخت، پرداخت آنلاین شتابی اقساط و شارژ ماهانه، و استعلام شفاف وضعیت واحدهای مسکونی برای اعضا و مدیران تعاونی‌ها است.
            </p>

            <div className="pt-2 flex flex-wrap items-center gap-3">
              <span className="text-xs text-slate-400">ورود سریع به عنوان:</span>
              <button
                onClick={() => quickLoginAs('user-member-1')}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 shadow-sm"
              >
                <span>علی مرادی (عضو تعاونی)</span>
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={() => quickLoginAs('user-admin-coop1')}
                className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold border border-white/20 transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <span>مهندس اکبری (مدیر تعاونی)</span>
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={() => quickLoginAs('user-super-admin')}
                className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold border border-white/20 transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <span>مدیر ارشد سامانه</span>
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* آمار تجمیعی پروژه‌ها */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-1">
            <span className="text-xs font-bold text-slate-500">پروژه‌های مسکونی فعال</span>
            <div className="text-2xl font-black text-slate-900">{toPersianDigits(allCooperatives.length)} پروژه</div>
            <p className="text-[11px] text-slate-400">تحت نظارت و انقیاد مالی</p>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-1">
            <span className="text-xs font-bold text-slate-500">مجموع اعضای سهام‌دار</span>
            <div className="text-2xl font-black text-emerald-700">{toPersianDigits(dataService.getMembers(null, true).length)} عضو</div>
            <p className="text-[11px] text-slate-400">دارای قرارداد ساخت و واحد</p>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-1">
            <span className="text-xs font-bold text-slate-500">تراکنش‌های تسویه‌شده</span>
            <div className="text-2xl font-black text-slate-900">{toPersianDigits(allPayments.filter(p => p.status === 'SUCCESS' || p.status === 'APPROVED').length)} واریزی</div>
            <p className="text-[11px] text-slate-400">درگاه شاپرک و فیش‌های بانکی</p>
          </div>
        </div>

        {/* فهرست پروژه‌های تعاونی‌ها */}
        <div className="space-y-4">
          <h3 className="text-base font-black text-slate-900">پروژه‌های مسکونی در حال احداث:</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {allCooperatives.map(coop => (
              <div key={coop.id} className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full">
                    {coop.projectName}
                  </span>
                  <span className="text-xs text-slate-500 font-mono">{toPersianDigits(coop.totalUnits)} واحد</span>
                </div>

                <h4 className="font-bold text-sm text-slate-900">{coop.name}</h4>
                <p className="text-xs text-slate-500 leading-relaxed">{coop.address}</p>

                <div className="pt-2 border-t border-slate-100 text-xs text-slate-600 flex justify-between">
                  <span>بانک عامل:</span>
                  <span className="font-bold">{coop.bankAccountInfo.bankName}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    );
  }

  // کاربر وارد شده است
  const { user, activeRole, activeCooperative } = session;
  const myMembership = session.activeMembership;

  const accessibleUnits = dataService.getUnits(activeCooperative?.id || null, session.isGlobalSuperAdmin)
    .filter(u => activeRole === 'MEMBER' ? u.assignedMemberId === myMembership?.id : true);

  const accessiblePayments = dataService.getPayments(
    activeCooperative?.id || null, 
    session.isGlobalSuperAdmin, 
    activeRole === 'MEMBER' ? myMembership?.id : undefined
  );

  const pendingReceipts = dataService.getReceipts(activeCooperative?.id || null, session.isGlobalSuperAdmin)
    .filter(r => {
      const pay = accessiblePayments.find(p => p.id === r.paymentId);
      return pay && pay.status === 'PENDING_APPROVAL';
    });

  const myInstallments = dataService.getAllInstallmentItems(activeCooperative?.id || null, session.isGlobalSuperAdmin).filter(i => {
    if (activeRole === 'MEMBER' && myMembership) {
      const plan = dataService.getInstallmentPlans(activeCooperative?.id || null, session.isGlobalSuperAdmin)
        .find(p => p.memberId === myMembership.id);
      return plan ? i.planId === plan.id : false;
    }
    return false;
  });

  const myMonthlyFees = dataService.getMonthlyFees(
    activeCooperative?.id || null, 
    session.isGlobalSuperAdmin, 
    activeRole === 'MEMBER' ? myMembership?.id : undefined
  );

  const memberTotalPaid = myInstallments.reduce((sum, i) => sum + i.paidAmountRial, 0);
  const memberTotalDue = myInstallments.reduce((sum, i) => sum + i.amountRial, 0);

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      {/* بنر خوش‌آمدگویی کاربر */}
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
                  activeRole === 'COOP_ADMIN' ? 'bg-amber-500/30 text-amber-200 border border-amber-400/30' :
                  'bg-emerald-500/30 text-emerald-200 border border-emerald-400/30'
                }`}>
                  {activeRole === 'SUPER_ADMIN' ? 'مدیر ارشد سامانه' :
                   activeRole === 'COOP_ADMIN' ? 'مدیر تعاونی مسکن' : 'عضو تعاونی'}
                </span>
              </div>
              <p className="text-xs text-slate-300 font-medium">
                کد ملی: <span className="font-mono dir-ltr">{user.nationalCode}</span> • موبایل: <span className="font-mono dir-ltr">{user.mobile}</span>
              </p>
            </div>
          </div>

          {/* تعاونی فعال */}
          {activeCooperative && (
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10 flex items-center gap-3">
              <Building2 className="w-8 h-8 text-emerald-400 shrink-0" />
              <div>
                <div className="text-[11px] text-slate-300 font-medium">پروژه تحت قرارداد شما:</div>
                <div className="text-sm font-bold text-white">{activeCooperative.name}</div>
                <div className="text-xs text-emerald-300 font-medium">{activeCooperative.projectName}</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ۱. نمایش مخصوص مدیر کل سیستم (SUPER_ADMIN) */}
      {activeRole === 'SUPER_ADMIN' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            
            <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-2">
              <div className="text-xs text-slate-500 font-bold">کل تعاونی‌های فعال</div>
              <div className="text-2xl font-black text-slate-900">{toPersianDigits(allCooperatives.length)} تعاونی</div>
              <p className="text-[11px] text-slate-400">پروژه‌های مروارید، یاسمن و البرز</p>
            </div>

            <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-2">
              <div className="text-xs text-slate-500 font-bold">مجموع اعضای تحت پوشش</div>
              <div className="text-2xl font-black text-emerald-700">
                {toPersianDigits(dataService.getMembers(null, true).length)} عضو
              </div>
              <p className="text-[11px] text-slate-400">با پرونده مالی فعال</p>
            </div>

            <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-2">
              <div className="text-xs text-slate-500 font-bold">گردش مالی تجمیعی ثبت‌شده</div>
              <div className="text-base font-black text-slate-900 font-mono">
                {formatRial(accessiblePayments.reduce((s: number, p) => s + p.amountRial, 0))}
              </div>
              <p className="text-[11px] text-slate-400">واریزی‌های آنلاین و فیش‌ها</p>
            </div>

          </div>

          {/* تعاونی‌های تحت نظارت مدیر کل */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
            <h3 className="font-bold text-sm text-slate-900">پروژه‌های مسکونی تحت مدیریت:</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {allCooperatives.map(coop => (
                <div key={coop.id} className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 text-sm">{coop.name}</span>
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded">فعال</span>
                  </div>
                  <p className="text-xs text-emerald-800 font-medium">پروژه: {coop.projectName}</p>
                  <div className="text-xs text-slate-500">بانک: {coop.bankAccountInfo.bankName}</div>
                  <button
                    onClick={() => switchTenant(coop.id)}
                    className="w-full mt-2 bg-white hover:bg-slate-100 border border-slate-200 text-slate-800 text-xs font-bold py-2 rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <ArrowLeftRight className="w-3.5 h-3.5 text-emerald-600" />
                    <span>ورود به این تعاونی</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ۲. نمایش مخصوص مدیر تعاونی (COOP_ADMIN) */}
      {activeRole === 'COOP_ADMIN' && activeCooperative && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            
            <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-2">
              <div className="text-xs text-slate-500 font-bold">تعداد واحدهای پروژه</div>
              <div className="text-2xl font-black text-slate-900">{toPersianDigits(activeCooperative.totalUnits)} واحد</div>
              <p className="text-[11px] text-slate-400">{activeCooperative.projectName}</p>
            </div>

            <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-2">
              <div className="text-xs text-slate-500 font-bold">فیش‌های در انتظار بررسی و تایید</div>
              <div className="text-2xl font-black text-amber-600">{toPersianDigits(pendingReceipts.length)} فیش</div>
              <p className="text-[11px] text-slate-400">نیازمند بازبینی مدیر تعاونی</p>
            </div>

            <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-2">
              <div className="text-xs text-slate-500 font-bold">مجموع دریافتی‌های تاییدشده</div>
              <div className="text-base font-black text-emerald-700 font-mono">
                {formatRial(accessiblePayments.filter(p => p.status === 'SUCCESS' || p.status === 'APPROVED').reduce((s, p) => s + p.amountRial, 0))}
              </div>
              <p className="text-[11px] text-slate-400">واریزشده به حساب تعاونی</p>
            </div>

          </div>

          {/* کارتابل فیش‌های منتظر بررسی مدیر */}
          {pendingReceipts.length > 0 && (
            <div className="p-6 rounded-3xl bg-amber-50/70 border border-amber-200 space-y-4">
              <div className="flex items-center gap-2 text-amber-900 font-bold text-sm">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <span>فیش‌های نیازمند اقدام در تعاونی {activeCooperative.name}:</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {pendingReceipts.map(rec => (
                  <div key={rec.id} className="p-4 rounded-2xl bg-white border border-amber-200 flex items-center gap-4 text-xs">
                    <img src={rec.fileUrl} alt="" className="w-16 h-16 rounded-xl object-cover shrink-0 border border-slate-200" />
                    <div className="space-y-1">
                      <div className="font-bold text-slate-900">شماره ارجاع: {rec.referenceNumber}</div>
                      <div className="text-slate-500">{rec.bankName} - {toPersianDigits(rec.depositDate)}</div>
                      <span className="inline-block text-[10px] bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded">
                        در انتظار بررسی کارتابل
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* حساب بانکی تعاونی */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-2 text-xs">
            <h3 className="font-bold text-sm text-slate-900">اطلاعات حساب بانکی تعاونی جهت دریافت اقساط:</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              <div className="p-3 bg-slate-50 rounded-xl">
                <span className="text-slate-500">بانک: </span>
                <span className="font-bold text-slate-800">{activeCooperative.bankAccountInfo.bankName}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl">
                <span className="text-slate-500">شماره حساب: </span>
                <span className="font-bold font-mono text-slate-800">{activeCooperative.bankAccountInfo.accountNumber}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl">
                <span className="text-slate-500">شماره شبا: </span>
                <span className="font-bold font-mono text-slate-800">{activeCooperative.bankAccountInfo.shebaNumber}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ۳. نمایش مخصوص عضو (MEMBER) */}
      {activeRole === 'MEMBER' && (
        <div className="space-y-6">
          
          {/* کارت مشخصات واحد مسکونی عضو */}
          {accessibleUnits.length > 0 && (
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    <Home className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-slate-900">مشخصات واحد مسکونی اختصاص‌یافته به شما</h3>
                    <p className="text-xs text-slate-500">{activeCooperative?.name} - {activeCooperative?.projectName}</p>
                  </div>
                </div>

                <span className="bg-emerald-100 text-emerald-800 text-xs px-3 py-1 rounded-full font-bold">
                  تخصیص قطعی
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
                    <span className="text-lg font-black text-emerald-700">{toPersianDigits(unit.areaM2)} مترمربع</span>
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

          {/* خلاصه تعهدات و وضعیت اقساط عضو */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-2">
              <div className="text-xs text-slate-500 font-bold">کل مبلغ قرارداد ساخت</div>
              <div className="text-base font-black text-slate-900 font-mono">{formatRial(memberTotalDue)}</div>
              <div className="text-[11px] text-slate-400">{formatToman(memberTotalDue)}</div>
            </div>

            <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-2">
              <div className="text-xs text-slate-500 font-bold">مجموع واریزی‌های تاییدشده</div>
              <div className="text-base font-black text-emerald-700 font-mono">{formatRial(memberTotalPaid)}</div>
              <div className="text-[11px] text-emerald-600 font-medium">تسویه‌شده در سیستم</div>
            </div>

            <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-2">
              <div className="text-xs text-slate-500 font-bold">مانده تعهدات ساختمانی</div>
              <div className="text-base font-black text-rose-600 font-mono">{formatRial(memberTotalDue - memberTotalPaid)}</div>
              <div className="text-[11px] text-rose-700 font-medium">{formatToman(memberTotalDue - memberTotalPaid)}</div>
            </div>
          </div>

          {/* جدول اقساط عضو */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <CalendarDays className="w-4 h-4 text-emerald-600" />
                <h3 className="font-bold text-sm text-slate-900">جدول اقساط و سررسیدهای ساخت شما</h3>
              </div>
              <span className="text-xs text-slate-500">{toPersianDigits(myInstallments.length)} قسط</span>
            </div>

            <div className="space-y-3">
              {myInstallments.map(item => (
                <div key={item.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div className="space-y-1">
                    <div className="font-bold text-slate-900 text-sm">{item.stageTitle}</div>
                    <div className="text-slate-500">سررسید: {formatJalaliDate(item.dueDate)}</div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-left font-mono space-y-0.5">
                      <div className="font-bold text-slate-900">{formatRial(item.amountRial)}</div>
                      <div className="text-[10px] text-emerald-700">پرداخت‌شده: {formatRial(item.paidAmountRial)}</div>
                    </div>

                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                      item.status === 'PAID' ? 'bg-emerald-100 text-emerald-800' :
                      item.status === 'PARTIAL' ? 'bg-indigo-100 text-indigo-800' :
                      'bg-amber-100 text-amber-800'
                    }`}>
                      {item.status === 'PAID' ? 'تسویه کامل' : item.status === 'PARTIAL' ? 'پرداخت ناقص' : 'در انتظار پرداخت'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* جدول هزینه‌های جاری و شارژ ماهانه */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Coins className="w-4 h-4 text-teal-600" />
                <h3 className="font-bold text-sm text-slate-900">هزینه‌های جاری و شارژ ماهانه شما</h3>
              </div>
              <span className="text-xs text-slate-500">{toPersianDigits(myMonthlyFees.length)} صورتحساب</span>
            </div>

            <div className="divide-y divide-slate-100 border border-slate-200 rounded-2xl overflow-hidden">
              {myMonthlyFees.map(fee => {
                const isPaid = fee.status === 'PAID';
                return (
                  <div key={fee.id} className="p-4 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs hover:bg-slate-50">
                    <div className="space-y-0.5">
                      <div className="font-bold text-slate-900 text-sm flex items-center gap-2">
                        <span>{fee.title}</span>
                        {fee.paidByManager && (
                          <span className="text-[10px] bg-sky-100 text-sky-800 px-2 py-0.5 rounded-full font-bold">
                            تسویه توسط مدیر تعاونی
                          </span>
                        )}
                      </div>
                      <div className="text-slate-500">موعد پرداخت: {formatJalaliDate(fee.dueDate)}</div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-left font-mono font-bold text-slate-900 text-sm">
                        {formatRial(fee.amountRial)}
                      </div>

                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                        isPaid ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {isPaid ? 'تسویه‌شده' : 'در انتظار پرداخت'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      )}

    </div>
  );
};
