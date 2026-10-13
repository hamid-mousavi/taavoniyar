import React, { useState } from 'react';
import { 
  Building2, 
  Users, 
  Home, 
  CalendarDays, 
  CreditCard, 
  Receipt as ReceiptIcon, 
  Bell, 
  FileText, 
  Search,
  Filter,
  CheckCircle,
  Clock,
  XCircle,
  ExternalLink,
  ShieldAlert
} from 'lucide-react';
import {
  seedCooperatives,
  seedUsers,
  seedMemberships,
  seedUnits,
  seedInstallmentPlans,
  seedInstallmentItems,
  seedPayments,
  seedReceipts,
  seedAnnouncements,
  seedAuditLogs
} from '../data/seedData';
import { 
  formatRial, 
  formatToman, 
  formatJalaliDate, 
  toPersianDigits 
} from '../utils/persian';

type TableView = 
  | 'cooperatives' 
  | 'users' 
  | 'memberships' 
  | 'units' 
  | 'installments' 
  | 'payments' 
  | 'receipts' 
  | 'announcements' 
  | 'auditLogs';

export const DatabaseBrowser: React.FC = () => {
  const [activeTable, setActiveTable] = useState<TableView>('cooperatives');
  const [filterCoopId, setFilterCoopId] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');

  const tableButtons: { id: TableView; label: string; count: number; icon: React.ReactNode }[] = [
    { id: 'cooperatives', label: 'تعاونی‌ها', count: seedCooperatives.length, icon: <Building2 className="w-4 h-4" /> },
    { id: 'users', label: 'کاربران', count: seedUsers.length, icon: <Users className="w-4 h-4" /> },
    { id: 'memberships', label: 'عضویت‌ها', count: seedMemberships.length, icon: <Users className="w-4 h-4" /> },
    { id: 'units', label: 'واحدها', count: seedUnits.length, icon: <Home className="w-4 h-4" /> },
    { id: 'installments', label: 'اقساط', count: seedInstallmentItems.length, icon: <CalendarDays className="w-4 h-4" /> },
    { id: 'payments', label: 'پرداخت‌ها', count: seedPayments.length, icon: <CreditCard className="w-4 h-4" /> },
    { id: 'receipts', label: 'فیش‌های واریزی', count: seedReceipts.length, icon: <ReceiptIcon className="w-4 h-4" /> },
    { id: 'announcements', label: 'اطلاعیه‌ها', count: seedAnnouncements.length, icon: <Bell className="w-4 h-4" /> },
    { id: 'auditLogs', label: 'لاگ حسابرسی', count: seedAuditLogs.length, icon: <FileText className="w-4 h-4" /> },
  ];

  const getCoopName = (id: string | null | undefined) => {
    if (!id) return 'سراسری (همه تعاونی‌ها)';
    const c = seedCooperatives.find(x => x.id === id);
    return c ? c.name : id;
  };

  const getUserName = (id: string | undefined) => {
    const u = seedUsers.find(x => x.id === id);
    return u ? u.fullName : id;
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* هدر بخش داده‌های آزمایشی */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-black text-slate-900">کاوشگر داده‌های آزمایشی اولیه (Seed Data Explorer)</h2>
            <p className="text-xs text-slate-500 mt-1">
              شامل ۳ تعاونی واقعی (فرهنگیان، کادر درمان، گروه صنعتی پارس)، ۱۰ عضو کامل، واحدها، اقساط، پرداختی‌ها و فیش‌های بانکی
            </p>
          </div>

          {/* فیلتر بر اساس تعاونی */}
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <select
              value={filterCoopId}
              onChange={(e) => setFilterCoopId(e.target.value)}
              className="bg-slate-50 border border-slate-200 text-slate-800 text-xs rounded-xl px-3 py-2 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="all">همه تعاونی‌ها (دید مدیر کل)</option>
              {seedCooperatives.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* دکمه‌های انتخاب جدول */}
        <div className="flex items-center gap-2 overflow-x-auto pt-5 pb-1 border-t border-slate-100 mt-5 no-scrollbar">
          {tableButtons.map((btn) => {
            const isCurrent = activeTable === btn.id;
            return (
              <button
                key={btn.id}
                onClick={() => {
                  setActiveTable(btn.id);
                  setSearchTerm('');
                }}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap cursor-pointer transition-all ${
                  isCurrent
                    ? 'bg-emerald-700 text-white shadow-xs'
                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                }`}
              >
                {btn.icon}
                <span>{btn.label}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                  isCurrent ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
                }`}>
                  {toPersianDigits(btn.count)}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* محتوای جدول انتخاب شده */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm overflow-hidden">
        
        {/* ۱. جدول تعاونی‌ها */}
        {activeTable === 'cooperatives' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-sm text-slate-800">لیست تعاونی‌های ثبت‌شده (Cooperative Tenants)</h3>
              <span className="text-xs text-slate-500">{toPersianDigits(seedCooperatives.length)} تعاونی مستقل</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {seedCooperatives.map((coop) => (
                <div key={coop.id} className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-bold bg-slate-200 text-slate-700 px-2 py-0.5 rounded">
                      {coop.code}
                    </span>
                    <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                      فعال
                    </span>
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm leading-snug">{coop.name}</h4>
                    <p className="text-xs text-emerald-700 font-medium mt-1">پروژه: {coop.projectName}</p>
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed">{coop.address}</p>
                  
                  <div className="pt-3 border-t border-slate-200 text-xs space-y-1 text-slate-600">
                    <div>تعداد کل واحدها: <span className="font-bold text-slate-800">{toPersianDigits(coop.totalUnits)} واحد</span></div>
                    <div>بانک دریافت اقساط: <span className="font-bold text-slate-800">{coop.bankAccountInfo.bankName}</span></div>
                    <div className="font-mono text-[11px] text-slate-500 truncate">شبا: {coop.bankAccountInfo.shebaNumber}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ۲. جدول کاربران */}
        {activeTable === 'users' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-sm text-slate-800">کاربران سامانه (شامل مدیر کل، مدیران تعاونی‌ها و اعضا)</h3>
              <span className="text-xs text-slate-500">{toPersianDigits(seedUsers.length)} کاربر</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-600 border-b border-slate-200">
                    <th className="py-3 px-4">نام و نام خانوادگی</th>
                    <th className="py-3 px-4">شماره موبایل</th>
                    <th className="py-3 px-4">کد ملی (اعتبارسنجی‌شده)</th>
                    <th className="py-3 px-4">نام پدر</th>
                    <th className="py-3 px-4">تاریخ عضویت</th>
                    <th className="py-3 px-4">وضعیت</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {seedUsers.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-50">
                      <td className="py-3 px-4 font-bold text-slate-900 flex items-center gap-2">
                        <img src={u.avatarUrl} alt="" className="w-7 h-7 rounded-full object-cover" />
                        <span>{u.fullName}</span>
                      </td>
                      <td className="py-3 px-4 font-mono font-medium text-slate-700">{toPersianDigits(u.mobile)}</td>
                      <td className="py-3 px-4 font-mono font-medium text-slate-700">{toPersianDigits(u.nationalCode)}</td>
                      <td className="py-3 px-4 text-slate-600">{u.fatherName || '-'}</td>
                      <td className="py-3 px-4 text-slate-600">{formatJalaliDate(u.createdAt)}</td>
                      <td className="py-3 px-4">
                        <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                          فعال
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ۳. جدول عضویت‌ها (Memberships) */}
        {activeTable === 'memberships' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-sm text-slate-800">جدول پیوند عضویت و نقش‌ها (Memberships)</h3>
              <span className="text-xs text-slate-500">{toPersianDigits(seedMemberships.length)} رکورد</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-600 border-b border-slate-200">
                    <th className="py-3 px-4">شماره پرونده</th>
                    <th className="py-3 px-4">نام کاربر</th>
                    <th className="py-3 px-4">تعاونی مسکن</th>
                    <th className="py-3 px-4">نقش سازمانی</th>
                    <th className="py-3 px-4">تاریخ پیوستن</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {seedMemberships
                    .filter(m => filterCoopId === 'all' || m.cooperativeId === filterCoopId)
                    .map((m) => {
                      const user = seedUsers.find(u => u.id === m.userId);
                      const coop = seedCooperatives.find(c => c.id === m.cooperativeId);
                      return (
                        <tr key={m.id} className="hover:bg-slate-50">
                          <td className="py-3 px-4 font-mono font-bold text-slate-800">{m.membershipNumber}</td>
                          <td className="py-3 px-4 font-bold text-slate-900">{user?.fullName}</td>
                          <td className="py-3 px-4 text-slate-700">{coop?.name}</td>
                          <td className="py-3 px-4">
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                              m.role === 'SUPER_ADMIN'
                                ? 'bg-purple-100 text-purple-800'
                                : m.role === 'COOP_ADMIN'
                                ? 'bg-sky-100 text-sky-800'
                                : 'bg-emerald-100 text-emerald-800'
                            }`}>
                              {m.role === 'SUPER_ADMIN' ? 'مدیر کل' : m.role === 'COOP_ADMIN' ? 'مدیر تعاونی' : 'عضو تعاونی'}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-slate-600">{formatJalaliDate(m.joinedAt)}</td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ۴. جدول واحدها */}
        {activeTable === 'units' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-sm text-slate-800">واحدهای مسکونی ثبت‌شده (Units)</h3>
              <span className="text-xs text-slate-500">{toPersianDigits(seedUnits.length)} واحد</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-600 border-b border-slate-200">
                    <th className="py-3 px-4">تعاونی / پروژه</th>
                    <th className="py-3 px-4">شماره واحد</th>
                    <th className="py-3 px-4">بلوک / طبقه</th>
                    <th className="py-3 px-4">متراژ (متر مربع)</th>
                    <th className="py-3 px-4">پارکینگ / انباری</th>
                    <th className="py-3 px-4">عضو منتسب‌شده</th>
                    <th className="py-3 px-4">وضعیت</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {seedUnits
                    .filter(u => filterCoopId === 'all' || u.cooperativeId === filterCoopId)
                    .map((unit) => {
                      const member = seedMemberships.find(m => m.id === unit.assignedMemberId);
                      const memberUser = member ? seedUsers.find(u => u.id === member.userId) : null;
                      return (
                        <tr key={unit.id} className="hover:bg-slate-50">
                          <td className="py-3 px-4 font-bold text-slate-800">{getCoopName(unit.cooperativeId)}</td>
                          <td className="py-3 px-4 font-bold text-slate-900 font-mono">واحد {toPersianDigits(unit.unitNumber)}</td>
                          <td className="py-3 px-4 text-slate-700">بلوک {unit.block} - طبقه {toPersianDigits(unit.floor)}</td>
                          <td className="py-3 px-4 font-bold text-emerald-800">{toPersianDigits(unit.areaM2)} م²</td>
                          <td className="py-3 px-4 text-slate-600 font-mono text-[11px]">{unit.parkingNumber || '-'} / {unit.storageNumber || '-'}</td>
                          <td className="py-3 px-4 font-medium text-slate-900">
                            {memberUser ? memberUser.fullName : <span className="text-slate-400">واگذار نشده</span>}
                          </td>
                          <td className="py-3 px-4">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              unit.status === 'ASSIGNED' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                            }`}>
                              {unit.status === 'ASSIGNED' ? 'تخصیص‌یافته' : 'موجود'}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ۵. جدول اقساط */}
        {activeTable === 'installments' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-sm text-slate-800">جدول سررسید اقساط و مبالغ ریالی (InstallmentItems)</h3>
              <span className="text-xs text-slate-500">{toPersianDigits(seedInstallmentItems.length)} قسط</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-600 border-b border-slate-200">
                    <th className="py-3 px-4">تعاونی</th>
                    <th className="py-3 px-4">مرحله ساخت و عنوان قسط</th>
                    <th className="py-3 px-4">موعد سررسید</th>
                    <th className="py-3 px-4">مبلغ قسط (ریال عدد صحیح)</th>
                    <th className="py-3 px-4">پرداخت‌شده</th>
                    <th className="py-3 px-4">وضعیت</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {seedInstallmentItems
                    .filter(i => filterCoopId === 'all' || i.cooperativeId === filterCoopId)
                    .map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50">
                        <td className="py-3 px-4 font-medium text-slate-800">{getCoopName(item.cooperativeId)}</td>
                        <td className="py-3 px-4 font-bold text-slate-900">{item.stageTitle}</td>
                        <td className="py-3 px-4 text-slate-600">{formatJalaliDate(item.dueDate)}</td>
                        <td className="py-3 px-4 font-mono font-bold text-slate-900">
                          {formatRial(item.amountRial)}
                          <div className="text-[10px] text-slate-400 font-normal">{formatToman(item.amountRial)}</div>
                        </td>
                        <td className="py-3 px-4 font-mono font-bold text-emerald-700">
                          {formatRial(item.paidAmountRial)}
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            item.status === 'PAID'
                              ? 'bg-emerald-100 text-emerald-800'
                              : item.status === 'PARTIAL'
                              ? 'bg-indigo-100 text-indigo-800'
                              : item.status === 'OVERDUE'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}>
                            {item.status === 'PAID' ? 'تسویه‌شده' : item.status === 'PARTIAL' ? 'پرداخت ناقص' : item.status === 'OVERDUE' ? 'معوق' : 'در انتظار'}
                          </span>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ۶. جدول پرداخت‌ها */}
        {activeTable === 'payments' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-sm text-slate-800">تراکنش‌های واریزی آنلاین و آفلاین (Payments)</h3>
              <span className="text-xs text-slate-500">{toPersianDigits(seedPayments.length)} تراکنش</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-600 border-b border-slate-200">
                    <th className="py-3 px-4">کد پیگیری</th>
                    <th className="py-3 px-4">تعاونی</th>
                    <th className="py-3 px-4">عضو</th>
                    <th className="py-3 px-4">مبلغ واریزی</th>
                    <th className="py-3 px-4">روش پرداخت</th>
                    <th className="py-3 px-4">تاریخ پرداخت</th>
                    <th className="py-3 px-4">وضعیت</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {seedPayments
                    .filter(p => filterCoopId === 'all' || p.cooperativeId === filterCoopId)
                    .map((pay) => {
                      const member = seedMemberships.find(m => m.id === pay.memberId);
                      const user = member ? seedUsers.find(u => u.id === member.userId) : null;
                      return (
                        <tr key={pay.id} className="hover:bg-slate-50">
                          <td className="py-3 px-4 font-mono font-bold text-slate-900">{pay.trackingCode}</td>
                          <td className="py-3 px-4 text-slate-700">{getCoopName(pay.cooperativeId)}</td>
                          <td className="py-3 px-4 font-bold text-slate-900">{user?.fullName}</td>
                          <td className="py-3 px-4 font-mono font-bold text-emerald-700">
                            {formatRial(pay.amountRial)}
                          </td>
                          <td className="py-3 px-4">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              pay.method === 'ONLINE_SANDBOX' ? 'bg-sky-100 text-sky-800' : 'bg-slate-100 text-slate-800'
                            }`}>
                              {pay.method === 'ONLINE_SANDBOX' ? 'آنلاین (ساندباکس)' : 'فیش بانکی دستی'}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-slate-600">{formatJalaliDate(pay.paidAt, true)}</td>
                          <td className="py-3 px-4">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              pay.status === 'SUCCESS' || pay.status === 'APPROVED'
                                ? 'bg-emerald-100 text-emerald-800'
                                : pay.status === 'PENDING_APPROVAL'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-rose-100 text-rose-800'
                            }`}>
                              {pay.status === 'SUCCESS' ? 'موفق آنلاین' : pay.status === 'APPROVED' ? 'تایید مدیر تعاونی' : pay.status === 'PENDING_APPROVAL' ? 'در انتظار بررسی' : 'رد شده'}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ۷. جدول فیش‌ها (Receipts) */}
        {activeTable === 'receipts' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-sm text-slate-800">رسیدها و فیش‌های واریزی بارگذاری‌شده (Receipts)</h3>
              <span className="text-xs text-slate-500">{toPersianDigits(seedReceipts.length)} فیش</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {seedReceipts
                .filter(r => filterCoopId === 'all' || r.cooperativeId === filterCoopId)
                .map((rec) => {
                  const pay = seedPayments.find(p => p.id === rec.paymentId);
                  const member = pay ? seedMemberships.find(m => m.id === pay.memberId) : null;
                  const user = member ? seedUsers.find(u => u.id === member.userId) : null;
                  return (
                    <div key={rec.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                      <div className="relative aspect-video rounded-xl overflow-hidden border border-slate-200 bg-slate-100">
                        <img src={rec.fileUrl} alt={rec.originalFileName} className="w-full h-full object-cover" />
                        <span className="absolute bottom-2 left-2 bg-slate-900/80 text-white text-[10px] px-2 py-0.5 rounded font-mono">
                          {toPersianDigits(Math.round(rec.fileSizeBytes / 1024))} KB
                        </span>
                      </div>
                      
                      <div className="space-y-1 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-900">{user?.fullName}</span>
                          <span className="font-mono text-emerald-700 font-bold">{pay ? formatRial(pay.amountRial) : ''}</span>
                        </div>
                        <div className="text-slate-500">بانک: <span className="font-semibold text-slate-700">{rec.bankName}</span></div>
                        <div className="text-slate-500">شماره ارجاع: <span className="font-mono font-bold text-slate-800">{rec.referenceNumber}</span></div>
                        <div className="text-slate-500">تاریخ فیش: {toPersianDigits(rec.depositDate)}</div>
                      </div>

                      {rec.rejectReason && (
                        <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-[11px] text-rose-800">
                          علت رد فیش: {rec.rejectReason}
                        </div>
                      )}

                      {rec.reviewedBy && (
                        <div className="text-[11px] text-slate-500 flex items-center justify-between pt-2 border-t border-slate-200">
                          <span>بررسی‌شده توسط:</span>
                          <span className="font-bold text-slate-700">{getUserName(rec.reviewedBy)}</span>
                        </div>
                      )}
                    </div>
                  );
                })}
            </div>
          </div>
        )}

        {/* ۸. جدول اطلاعیه‌ها */}
        {activeTable === 'announcements' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-sm text-slate-800">تابلوی اعلانات (Announcements)</h3>
              <span className="text-xs text-slate-500">{toPersianDigits(seedAnnouncements.length)} اطلاعیه</span>
            </div>
            <div className="space-y-3">
              {seedAnnouncements
                .filter(a => filterCoopId === 'all' || a.cooperativeId === filterCoopId || a.cooperativeId === null)
                .map((ann) => (
                  <div key={ann.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          ann.cooperativeId === null ? 'bg-purple-100 text-purple-800' : 'bg-sky-100 text-sky-800'
                        }`}>
                          {ann.cooperativeId === null ? 'سراسری مدیر کل' : getCoopName(ann.cooperativeId)}
                        </span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          ann.priority === 'URGENT' ? 'bg-rose-100 text-rose-800' : 'bg-slate-200 text-slate-700'
                        }`}>
                          {ann.priority === 'URGENT' ? 'فوری' : ann.priority === 'IMPORTANT' ? 'مهم' : 'عادی'}
                        </span>
                      </div>
                      <span className="text-xs text-slate-500">{formatJalaliDate(ann.publishedAt)}</span>
                    </div>
                    <h4 className="font-bold text-slate-900 text-sm">{ann.title}</h4>
                    <p className="text-xs text-slate-600 leading-relaxed">{ann.content}</p>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* ۹. جدول لاگ حسابرسی */}
        {activeTable === 'auditLogs' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-sm text-slate-800">دفترکل رویدادنگاری حسابرسی مالی و سیستمی (AuditLogs)</h3>
              <span className="text-xs text-slate-500">{toPersianDigits(seedAuditLogs.length)} رویداد</span>
            </div>
            <div className="space-y-2">
              {seedAuditLogs
                .filter(l => filterCoopId === 'all' || l.cooperativeId === filterCoopId || l.cooperativeId === null)
                .map((log) => (
                  <div key={log.id} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[10px] bg-slate-200 text-slate-800 px-1.5 py-0.5 rounded font-bold">
                          {log.action}
                        </span>
                        <span className="font-bold text-slate-900">{log.userFullName}</span>
                        <span className="text-slate-400">({log.userRole})</span>
                      </div>
                      <p className="text-slate-700 font-medium">{log.description}</p>
                    </div>
                    <div className="text-left sm:text-right text-[11px] text-slate-500 shrink-0">
                      <div>{formatJalaliDate(log.timestamp, true)}</div>
                      <div className="font-mono text-slate-400 text-[10px]">IP: {log.ipAddress || '-'}</div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

      </div>

    </div>
  );
};
