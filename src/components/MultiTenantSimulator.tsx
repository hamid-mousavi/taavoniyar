import React, { useState } from 'react';
import { 
  ShieldCheck, 
  UserCheck, 
  Building, 
  Lock, 
  Eye, 
  AlertTriangle,
  ArrowRight,
  Database
} from 'lucide-react';
import { UserRole } from '../types/database';
import { 
  seedUsers, 
  seedCooperatives, 
  seedMemberships, 
  seedUnits, 
  seedPayments, 
  seedAnnouncements 
} from '../data/seedData';
import { formatRial, toPersianDigits } from '../utils/persian';

export const MultiTenantSimulator: React.FC = () => {
  // نقش و کاربر فعال در شبیه‌ساز
  const [selectedUserScenario, setSelectedUserScenario] = useState<string>('superadmin');

  // سناریوهای تعریف‌شده
  const scenarios = [
    {
      id: 'superadmin',
      title: 'مدیر کل سامانه (Super Admin)',
      user: seedUsers[0], // مهندس شایسته
      role: 'SUPER_ADMIN' as UserRole,
      coopId: null,
      description: 'دسترسی نامحدود به تمامی ۳ تعاونی، گزارش‌های تجمیعی مالی، و ارسال اطلاعیه سراسری.'
    },
    {
      id: 'coopadmin-1',
      title: 'مدیر تعاونی ۱ - فرهنگیان (Coop Admin)',
      user: seedUsers[1], // دکتر مهدوی
      role: 'COOP_ADMIN' as UserRole,
      coopId: 'coop-1',
      description: 'فقط دسترسی به اعضا، واحدها، فیش‌ها و اطلاعیه‌های تعاونی مسکن فرهنگیان (پروژه مروارید).'
    },
    {
      id: 'member-1',
      title: 'عضو تعاونی فرهنگیان - علی مرادی (Member)',
      user: seedUsers[4], // علی مرادی
      role: 'MEMBER' as UserRole,
      coopId: 'coop-1',
      description: 'تنها دسترسی به وضعیت واحد ۱۰۱، اقساط شخصی خودش و ثبت فیش‌های پرداخت خود.'
    }
  ];

  const currentScenario = scenarios.find(s => s.id === selectedUserScenario) || scenarios[0];

  // اعمال فیلترهای امنیتی سروری بر اساس کانتکست
  const visibleCooperatives = seedCooperatives.filter(c => {
    if (currentScenario.role === 'SUPER_ADMIN') return true;
    return c.id === currentScenario.coopId;
  });

  const visibleUnits = seedUnits.filter(u => {
    if (currentScenario.role === 'SUPER_ADMIN') return true;
    if (currentScenario.role === 'COOP_ADMIN') return u.cooperativeId === currentScenario.coopId;
    // عضو: فقط واحد منتسب به خودش
    const myMembership = seedMemberships.find(m => m.userId === currentScenario.user.id);
    return u.assignedMemberId === myMembership?.id;
  });

  const visiblePayments = seedPayments.filter(p => {
    if (currentScenario.role === 'SUPER_ADMIN') return true;
    if (currentScenario.role === 'COOP_ADMIN') return p.cooperativeId === currentScenario.coopId;
    const myMembership = seedMemberships.find(m => m.userId === currentScenario.user.id);
    return p.memberId === myMembership?.id;
  });

  const visibleAnnouncements = seedAnnouncements.filter(a => {
    if (currentScenario.role === 'SUPER_ADMIN') return true;
    // سراسری یا اختصاصی تعاونی کاربر
    return a.cooperativeId === null || a.cooperativeId === currentScenario.coopId;
  });

  // محاسبه مجموع مبالغ قابل مشاهده
  const totalVisibleMoney = visiblePayments.reduce((sum, p) => sum + p.amountRial, 0);

  // شبیه‌سازی کوئری SQL تولیدشده در لایه داده
  const simulatedSqlQuery = () => {
    if (currentScenario.role === 'SUPER_ADMIN') {
      return `SELECT * FROM payments WHERE deleted_at IS NULL; -- دسترسی مدیر کل به کل ردیف‌ها`;
    }
    if (currentScenario.role === 'COOP_ADMIN') {
      return `SELECT * FROM payments WHERE cooperative_id = '${currentScenario.coopId}' AND deleted_at IS NULL; -- فیلتر سفت‌وسخت تعاونی`;
    }
    const myMembership = seedMemberships.find(m => m.userId === currentScenario.user.id);
    return `SELECT * FROM payments WHERE cooperative_id = '${currentScenario.coopId}' AND member_id = '${myMembership?.id}' AND deleted_at IS NULL; -- فیلتر اختصاصی کاربر`;
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      {/* هدر بخش شبیه‌ساز */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h2 className="text-xl font-black text-slate-900">شبیه‌ساز سطح دسترسی و ایزولاسیون چندمستأجری (RBAC)</h2>
            </div>
            <p className="text-xs text-slate-500">
              بررسی عملی عدم نشت داده (Data Leaks) بین تعاونی‌ها و نقش‌های مختلف سامانه
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs font-semibold bg-slate-100 text-slate-700 px-3 py-1.5 rounded-xl border border-slate-200">
            <Lock className="w-4 h-4 text-emerald-600" />
            <span>Server-Authoritative Context</span>
          </div>
        </div>

        {/* انتخاب نقش شبیه‌سازی‌شده */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-4 border-t border-slate-100">
          {scenarios.map((sc) => {
            const isSelected = selectedUserScenario === sc.id;
            return (
              <button
                key={sc.id}
                onClick={() => setSelectedUserScenario(sc.id)}
                className={`p-4 rounded-2xl text-right cursor-pointer transition-all border ${
                  isSelected
                    ? 'bg-slate-900 text-white border-slate-900 shadow-md ring-2 ring-emerald-400'
                    : 'bg-slate-50 text-slate-800 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    isSelected ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
                  }`}>
                    {sc.role}
                  </span>
                  <UserCheck className={`w-4 h-4 ${isSelected ? 'text-emerald-400' : 'text-slate-400'}`} />
                </div>
                <div className="font-bold text-sm leading-snug">{sc.title}</div>
                <p className={`text-xs mt-1 leading-relaxed ${isSelected ? 'text-slate-300' : 'text-slate-500'}`}>
                  {sc.user.fullName} ({toPersianDigits(sc.user.mobile)})
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* وضعیت دید جاری و نتایج کوئری */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* ستون خلاصه دسترسی کاربر جاری */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center gap-2 text-slate-900 font-bold text-sm border-b border-slate-100 pb-3">
            <Eye className="w-4 h-4 text-emerald-600" />
            <span>خروجی مجاز کوئری برای این کانتکست:</span>
          </div>

          <div className="space-y-3">
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
              <span className="text-slate-600">تعاونی‌های قابل رویت:</span>
              <span className="font-bold text-slate-900">{toPersianDigits(visibleCooperatives.length)} از {toPersianDigits(seedCooperatives.length)}</span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
              <span className="text-slate-600">واحدهای قابل رویت:</span>
              <span className="font-bold text-slate-900">{toPersianDigits(visibleUnits.length)} از {toPersianDigits(seedUnits.length)}</span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
              <span className="text-slate-600">تراکنش‌های قابل رویت:</span>
              <span className="font-bold text-slate-900">{toPersianDigits(visiblePayments.length)} از {toPersianDigits(seedPayments.length)}</span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
              <span className="text-slate-600">اطلاعیه‌های در دسترس:</span>
              <span className="font-bold text-slate-900">{toPersianDigits(visibleAnnouncements.length)} از {toPersianDigits(seedAnnouncements.length)}</span>
            </div>

            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between text-xs">
              <span className="text-emerald-800 font-bold">مجموع مبلغ مالی قابل رویت:</span>
              <span className="font-mono font-bold text-emerald-900">{formatRial(totalVisibleMoney)}</span>
            </div>
          </div>

          {/* کوئری SQL ایزوله شده */}
          <div className="space-y-1.5 pt-2">
            <div className="text-[11px] font-bold text-slate-500 flex items-center gap-1">
              <Database className="w-3.5 h-3.5 text-slate-400" />
              <span>کوئری سروری اجرا شده با پارامترهای کانتکست:</span>
            </div>
            <pre className="p-3 rounded-xl bg-slate-900 text-emerald-400 text-[11px] font-mono leading-relaxed overflow-x-auto whitespace-pre-wrap">
              {simulatedSqlQuery()}
            </pre>
          </div>
        </div>

        {/* لیست رکوردهای بازگشتی به این کاربر */}
        <div className="lg:col-span-2 bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="font-bold text-sm text-slate-800">
              داده‌های بازگردانده شده در پاسخ API به کاربر {currentScenario.user.fullName}
            </h3>
            <span className="text-xs text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full font-bold">
              تضمین عدم نشت داده
            </span>
          </div>

          {/* پیش‌نمایش تراکنش‌های مجاز */}
          <div className="space-y-2">
            <div className="text-xs font-bold text-slate-700">تراکنش‌های مالی مجاز:</div>
            {visiblePayments.length === 0 ? (
              <div className="p-4 rounded-xl bg-slate-50 text-slate-500 text-xs text-center">
                هیچ پرداختی برای این کاربر قابل نمایش نیست.
              </div>
            ) : (
              <div className="divide-y divide-slate-100 border border-slate-200 rounded-2xl overflow-hidden">
                {visiblePayments.map((p) => (
                  <div key={p.id} className="p-3 bg-white flex items-center justify-between text-xs hover:bg-slate-50">
                    <div className="space-y-0.5">
                      <div className="font-bold text-slate-900 flex items-center gap-2">
                        <span className="font-mono text-[11px]">{p.trackingCode}</span>
                        <span className="text-[10px] bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded font-mono">
                          {p.method}
                        </span>
                      </div>
                      <div className="text-slate-500 text-[11px]">تعاونی: {p.cooperativeId}</div>
                    </div>
                    <div className="text-left font-mono font-bold text-emerald-700">
                      {formatRial(p.amountRial)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* پیش‌نمایش واحدهای مجاز */}
          <div className="space-y-2 pt-2">
            <div className="text-xs font-bold text-slate-700">واحدهای مسکونی در دسترس این کانتکست:</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {visibleUnits.map((u) => (
                <div key={u.id} className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900">واحد {toPersianDigits(u.unitNumber)} (بلوک {u.block})</span>
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded">
                      {toPersianDigits(u.areaM2)} م²
                    </span>
                  </div>
                  <div className="text-slate-500 text-[11px]">طبقه {toPersianDigits(u.floor)} | تعاونی {u.cooperativeId}</div>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};
