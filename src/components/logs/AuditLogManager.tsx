import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Search, 
  Filter, 
  Clock, 
  User, 
  Building2, 
  Layers, 
  CreditCard, 
  CalendarDays, 
  Home, 
  Activity, 
  FileText, 
  Download, 
  Printer, 
  Eye, 
  X,
  RotateCcw
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { dataService } from '../../services/dataService';
import { AuditLog, AuditAction } from '../../types/database';
import { formatJalaliDate, toPersianDigits } from '../../utils/persian';

export const AuditLogManager: React.FC = () => {
  const { session } = useAuth();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState<string>('ALL');
  const [entityFilter, setEntityFilter] = useState<string>('ALL');
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  const loadData = () => {
    if (!session) return;
    const coopId = session.isGlobalSuperAdmin ? null : session.activeCooperative?.id || null;
    const list = dataService.getAuditLogs(coopId, session.isGlobalSuperAdmin);
    setLogs(list);
  };

  useEffect(() => {
    loadData();
    const unsub = dataService.subscribe(loadData);
    return unsub;
  }, [session]);

  const getActionBadge = (action: AuditAction) => {
    switch (action) {
      case 'CREATE':
        return <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold text-[10px]">ثبت / ایجاد</span>;
      case 'UPDATE':
        return <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-800 border border-blue-200 font-bold text-[10px]">ویرایش / تغییر</span>;
      case 'DELETE':
        return <span className="px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-800 border border-rose-200 font-bold text-[10px]">حذف ایمن</span>;
      case 'PAYMENT_APPROVED':
        return <span className="px-2.5 py-0.5 rounded-full bg-purple-50 text-purple-800 border border-purple-200 font-bold text-[10px]">تایید پرداخت مالی</span>;
      case 'LOGIN_OTP':
        return <span className="px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 font-bold text-[10px]">ورود با OTP</span>;
      default:
        return <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 font-bold text-[10px]">{action}</span>;
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'SUPER_ADMIN': return 'مدیر ارشد سامانه';
      case 'COOP_ADMIN': return 'مدیر تعاونی';
      case 'ACCOUNTANT': return 'حسابدار';
      case 'MEMBER': return 'عضو تعاونی';
      default: return role;
    }
  };

  const filteredLogs = logs.filter(log => {
    const matchesAction = actionFilter === 'ALL' || log.action === actionFilter;
    const matchesEntity = entityFilter === 'ALL' || log.entityType === entityFilter;
    const matchesSearch = !searchTerm.trim() || 
      log.userFullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.entityId.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesAction && matchesEntity && matchesSearch;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* هدر بخش لاگ‌ها */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 rounded-3xl p-6 sm:p-8 text-white shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="p-2 bg-indigo-500/20 text-indigo-300 rounded-xl border border-indigo-500/30">
                <ShieldCheck className="w-5 h-5" />
              </span>
              <span className="text-xs font-bold text-indigo-300">امنیت، شفافیت و ردیابی حسابرسی (Audit Trail)</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black">
              گزارش جامع لاگ‌های امنیتی و رویدادهای مالی
            </h2>
            <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
              کلیه عملیات حساس مدیران و کاربران (ورود به سیستم، ثبت و ویرایش اعضا، صدور و حذف اقساط، تایید فیش‌ها و تغییرات داده‌ها) با شناسه عامل و زمان دقیق ثبت و ردیابی می‌شوند.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => window.print()}
              className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs font-bold flex items-center gap-2 transition-colors cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>چاپ دفتر لاگ</span>
            </button>
          </div>
        </div>
      </div>

      {/* فیلترها و جستجو */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        
        {/* جستجو */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
          <input
            type="text"
            placeholder="جستجو در شرح عملیات، نام اقدام‌کننده..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pr-9 pl-4 py-2 rounded-xl border border-slate-200 text-xs focus:border-slate-800 outline-none"
          />
        </div>

        {/* فیلتر نوع اقدام */}
        <div className="flex flex-wrap items-center gap-1.5 w-full md:w-auto">
          {[
            { id: 'ALL', label: 'همه اقدامات' },
            { id: 'CREATE', label: 'ثبت و صدور' },
            { id: 'UPDATE', label: 'ویرایش' },
            { id: 'DELETE', label: 'حذف ایمن' },
            { id: 'PAYMENT_APPROVED', label: 'تایید پرداخت' },
            { id: 'LOGIN_OTP', label: 'ورود OTP' }
          ].map(f => (
            <button
              key={f.id}
              onClick={() => setActionFilter(f.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                actionFilter === f.id
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

      </div>

      {/* جدول نمایش لاگ‌ها */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        {filteredLogs.length === 0 ? (
          <div className="p-12 text-center space-y-2">
            <Activity className="w-8 h-8 text-slate-300 mx-auto" />
            <div className="text-sm font-bold text-slate-700">هیچ لاگ یا رویدادی با این مشخصات یافت نشد</div>
            <p className="text-xs text-slate-400">تمام رویدادهای جدید به طور خودکار در این جدول درج می‌شوند.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                <tr>
                  <th className="p-4">زمان رویداد</th>
                  <th className="p-4">کاربر اقدام‌کننده</th>
                  <th className="p-4">نقش سازمانی</th>
                  <th className="p-4">نوع عملیات</th>
                  <th className="p-4">موجودیت</th>
                  <th className="p-4">شرح رویداد</th>
                  <th className="p-4 text-center">جزئیات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredLogs.map(log => (
                  <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-4 whitespace-nowrap text-slate-500 font-mono dir-ltr text-right">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span>{formatJalaliDate(log.timestamp, true)}</span>
                      </div>
                    </td>

                    <td className="p-4 font-bold text-slate-900 whitespace-nowrap">
                      {log.userFullName}
                    </td>

                    <td className="p-4 text-slate-600 whitespace-nowrap">
                      <span className="text-[11px] font-medium text-slate-700 bg-slate-100 px-2 py-0.5 rounded-lg">
                        {getRoleLabel(log.userRole)}
                      </span>
                    </td>

                    <td className="p-4 whitespace-nowrap">
                      {getActionBadge(log.action)}
                    </td>

                    <td className="p-4 text-slate-500 font-mono text-[11px]">
                      {log.entityType} ({log.entityId.slice(0, 10)}...)
                    </td>

                    <td className="p-4 text-slate-800 leading-relaxed max-w-md">
                      {log.description}
                    </td>

                    <td className="p-4 text-center">
                      <button
                        onClick={() => setSelectedLog(log)}
                        className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
                        title="مشاهده متادیتا و جزئیات کامل"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* مودال جزئیات لاگ */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-lg rounded-3xl p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2 text-slate-900 font-bold">
                <ShieldCheck className="w-5 h-5 text-indigo-600" />
                <span>جزئیات دقیق رکورد حسابرسی</span>
              </div>
              <button
                onClick={() => setSelectedLog(null)}
                className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 text-xs text-slate-700">
              <div className="flex justify-between p-2 rounded-xl bg-slate-50">
                <span className="text-slate-500 font-medium">شناسه لاگ:</span>
                <span className="font-mono text-slate-900 dir-ltr">{selectedLog.id}</span>
              </div>
              <div className="flex justify-between p-2 rounded-xl bg-slate-50">
                <span className="text-slate-500 font-medium">زمان دقیق ثبت:</span>
                <span className="font-mono text-slate-900 dir-ltr">{formatJalaliDate(selectedLog.timestamp, true)}</span>
              </div>
              <div className="flex justify-between p-2 rounded-xl bg-slate-50">
                <span className="text-slate-500 font-medium">کاربر و نقش:</span>
                <span className="font-bold text-slate-900">{selectedLog.userFullName} ({getRoleLabel(selectedLog.userRole)})</span>
              </div>
              <div className="flex justify-between p-2 rounded-xl bg-slate-50">
                <span className="text-slate-500 font-medium">عملیات:</span>
                <span>{getActionBadge(selectedLog.action)}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 space-y-1">
                <span className="text-slate-500 font-medium block">شرح کامل:</span>
                <span className="text-slate-900 font-medium block leading-relaxed">{selectedLog.description}</span>
              </div>
              {selectedLog.newState && (
                <div className="space-y-1 pt-1">
                  <span className="text-slate-500 font-bold block">داده‌های وضعیت جدید (State Payload):</span>
                  <pre className="p-3 rounded-xl bg-slate-900 text-emerald-400 font-mono text-[11px] overflow-x-auto max-h-48 dir-ltr">
                    {JSON.stringify(selectedLog.newState, null, 2)}
                  </pre>
                </div>
              )}
            </div>

            <div className="pt-3 flex justify-end border-t border-slate-100">
              <button
                type="button"
                onClick={() => setSelectedLog(null)}
                className="px-5 py-2 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-slate-800 transition-colors cursor-pointer"
              >
                بستن
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
