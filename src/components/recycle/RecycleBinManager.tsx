import React, { useState, useEffect } from 'react';
import { 
  Trash2, 
  RotateCcw, 
  Search, 
  Filter, 
  Building2, 
  User, 
  Home, 
  CalendarDays, 
  Coins, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  ShieldAlert, 
  X,
  RefreshCw
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { dataService, RecycleItem } from '../../services/dataService';
import { formatJalaliDate, toPersianDigits } from '../../utils/persian';

export const RecycleBinManager: React.FC = () => {
  const { session } = useAuth();
  const [items, setItems] = useState<RecycleItem[]>([]);
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // مودال تایید حذف قطعی
  const [permanentDeleteItem, setPermanentDeleteItem] = useState<RecycleItem | null>(null);

  const loadData = () => {
    if (!session) return;
    const coopId = session.isGlobalSuperAdmin ? null : session.activeCooperative?.id || null;
    const list = dataService.getRecycleBinItems(coopId);
    setItems(list);
  };

  useEffect(() => {
    loadData();
    const unsub = dataService.subscribe(loadData);
    return unsub;
  }, [session]);

  const handleRestore = (item: RecycleItem) => {
    if (!session) return;
    setErrorMsg(null);
    try {
      dataService.restoreItem(item.entityType, item.id, {
        id: session.user.id,
        fullName: session.user.fullName,
        role: session.activeRole
      });
      setSuccessMsg(`آیتم «${item.title}» با موفقیت به سیستم بازگردانده شد.`);
      loadData();
      setTimeout(() => setSuccessMsg(null), 3500);
    } catch (err: any) {
      setErrorMsg(err.message || 'خطا در بازیابی اطلاعات');
    }
  };

  const handlePermanentDelete = () => {
    if (!permanentDeleteItem || !session) return;
    setErrorMsg(null);
    try {
      dataService.permanentDeleteItem(permanentDeleteItem.entityType, permanentDeleteItem.id, {
        id: session.user.id,
        fullName: session.user.fullName,
        role: session.activeRole
      });
      setSuccessMsg(`آیتم «${permanentDeleteItem.title}» به صورت دائم و غیرقابل بازگشت حذف شد.`);
      setPermanentDeleteItem(null);
      loadData();
      setTimeout(() => setSuccessMsg(null), 3500);
    } catch (err: any) {
      setErrorMsg(err.message || 'خطا در حذف دائم');
    }
  };

  const getEntityIcon = (type: string) => {
    switch (type) {
      case 'cooperative': return <Building2 className="w-4 h-4 text-purple-600" />;
      case 'user': return <User className="w-4 h-4 text-blue-600" />;
      case 'member': return <User className="w-4 h-4 text-emerald-600" />;
      case 'unit': return <Home className="w-4 h-4 text-amber-600" />;
      case 'installmentPlan': return <CalendarDays className="w-4 h-4 text-indigo-600" />;
      case 'monthlyFee': return <Coins className="w-4 h-4 text-rose-600" />;
      default: return <Trash2 className="w-4 h-4 text-slate-600" />;
    }
  };

  const filteredItems = items.filter(item => {
    const matchesType = typeFilter === 'ALL' || item.entityType === typeFilter;
    const matchesSearch = !searchTerm.trim() || 
      item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.entityTypeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.details && item.details.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (item.deletedBy && item.deletedBy.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesType && matchesSearch;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* هدر سطل بازیافت */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-rose-950 rounded-3xl p-6 sm:p-8 text-white shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="p-2 bg-rose-500/20 text-rose-300 rounded-xl border border-rose-500/30">
                <Trash2 className="w-5 h-5" />
              </span>
              <span className="text-xs font-bold text-rose-300">امنیت اطلاعات و حذف ایمن (Soft Delete)</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black">
              سطل بازیافت مرکزی و بازیابی داده‌ها
            </h2>
            <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
              تمام اطلاعات حذف‌شده در سامانه مسکن‌یار (شامل کاربران، تعاونی‌ها، اعضا، واحدها، اقساط و شارژها) ابتدا به این بخش منتقل می‌شوند و در هر زمان با یک کلیک قابل بازگردانی به چرخه عملیاتی هستند.
            </p>
          </div>

          <div className="flex items-center gap-2 bg-white/10 p-3 rounded-2xl border border-white/10 shrink-0">
            <RotateCcw className="w-5 h-5 text-emerald-400" />
            <div className="text-right">
              <div className="text-[11px] text-slate-300">مجموع اقلام حذف‌شده:</div>
              <div className="text-lg font-black text-white">{toPersianDigits(items.length)} رکورد</div>
            </div>
          </div>
        </div>
      </div>

      {/* پیام‌های وضعیت */}
      {successMsg && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg(null)} className="text-emerald-600 hover:text-emerald-800">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600" />
            <span>{errorMsg}</span>
          </div>
          <button onClick={() => setErrorMsg(null)} className="text-rose-600 hover:text-rose-800">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* فیلترها و جستجو */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        
        {/* جستجو */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
          <input
            type="text"
            placeholder="جستجو در عنوان، جزئیات، حذف‌کننده..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pr-9 pl-4 py-2 rounded-xl border border-slate-200 text-xs focus:border-slate-800 outline-none"
          />
        </div>

        {/* فیلتر نوع موجودیت */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
          {[
            { id: 'ALL', label: 'همه اقلام' },
            { id: 'cooperative', label: 'تعاونی‌ها' },
            { id: 'user', label: 'کاربران' },
            { id: 'member', label: 'اعضا' },
            { id: 'unit', label: 'واحدها' },
            { id: 'installmentPlan', label: 'اقساط' },
            { id: 'monthlyFee', label: 'هزینه و شارژ' }
          ].map(f => (
            <button
              key={f.id}
              onClick={() => setTypeFilter(f.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-colors cursor-pointer ${
                typeFilter === f.id
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

      </div>

      {/* لیست اقلام سطل بازیافت */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        {filteredItems.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div className="text-sm font-bold text-slate-700">هیچ رکوردی در سطل بازیافت موجود نیست</div>
            <p className="text-xs text-slate-400">تمام داده‌های سیستم فعال و در دسترس هستند.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                <tr>
                  <th className="p-4">نوع موجودیت</th>
                  <th className="p-4">عنوان رکورد</th>
                  <th className="p-4">تعاونی / جزئیات</th>
                  <th className="p-4">زمان حذف</th>
                  <th className="p-4">توسط</th>
                  <th className="p-4 text-center">عملیات بازیابی</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredItems.map(item => (
                  <tr key={`${item.entityType}-${item.id}`} className="hover:bg-slate-50/80 transition-colors">
                    
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <span className="p-2 rounded-xl bg-slate-100">
                          {getEntityIcon(item.entityType)}
                        </span>
                        <span className="font-bold text-slate-700">{item.entityTypeName}</span>
                      </div>
                    </td>

                    <td className="p-4">
                      <div className="font-bold text-slate-900">{item.title}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{item.id}</div>
                    </td>

                    <td className="p-4 text-slate-600">
                      {item.details || (item.cooperativeName ? `تعاونی: ${item.cooperativeName}` : '-')}
                    </td>

                    <td className="p-4 text-slate-500 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span>{formatJalaliDate(item.deletedAt, true)}</span>
                      </div>
                    </td>

                    <td className="p-4 text-slate-600">
                      {item.deletedBy || 'سیستم'}
                    </td>

                    <td className="p-4">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleRestore(item)}
                          className="px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold border border-emerald-200 transition-colors cursor-pointer flex items-center gap-1.5 shadow-xs"
                          title="بازگرداندن این آیتم به سیستم"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>بازیابی</span>
                        </button>

                        {(session?.activeRole === 'SUPER_ADMIN' || session?.activeRole === 'COOP_ADMIN') && (
                          <button
                            onClick={() => setPermanentDeleteItem(item)}
                            className="p-1.5 rounded-xl text-rose-500 hover:bg-rose-50 hover:text-rose-700 transition-colors cursor-pointer"
                            title="حذف قطعی و همیشگی"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>

                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* مودال تایید حذف قطعی */}
      {permanentDeleteItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <ShieldAlert className="w-6 h-6 shrink-0" />
              <h3 className="font-bold text-base text-slate-900">تایید حذف قطعی و دائمی</h3>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              آیا از حذف دائمی رکورد «<span className="font-bold text-slate-900">{permanentDeleteItem.title}</span>» اطمینان دارید؟
              <br />
              <span className="text-rose-600 font-bold block pt-1">
                این عملیات به هیچ عنوان قابل بازگشت نخواهد بود.
              </span>
            </p>

            <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setPermanentDeleteItem(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 text-xs font-bold hover:bg-slate-50 transition-colors cursor-pointer"
              >
                انصراف
              </button>
              <button
                type="button"
                onClick={handlePermanentDelete}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-colors cursor-pointer shadow-sm"
              >
                حذف قطعی برای همیشه
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
