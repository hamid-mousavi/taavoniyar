import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  Plus, 
  MapPin, 
  CreditCard, 
  CheckCircle2, 
  AlertCircle,
  X,
  Search,
  Pencil,
  Trash2,
  Database,
  ExternalLink,
  ShieldCheck,
  RefreshCw,
  Home
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { dataService } from '../../services/dataService';
import { Cooperative } from '../../types/database';
import { toPersianDigits } from '../../utils/persian';
import { isSupabaseConfigured } from '../../lib/supabase';
import { dbClient } from '../../lib/dbClient';

export const CooperativeManager: React.FC = () => {
  const { session } = useAuth();
  const [cooperatives, setCooperatives] = useState<Cooperative[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedCoop, setSelectedCoop] = useState<Cooperative | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isDbConnected, setIsDbConnected] = useState<boolean>(dbClient.isConnected() || isSupabaseConfigured());

  useEffect(() => {
    dbClient.checkStatus().then(st => setIsDbConnected(st.connected || isSupabaseConfigured())).catch(() => {});
    const unsub = dbClient.subscribe(() => {
      setIsDbConnected(dbClient.isConnected() || isSupabaseConfigured());
    });
    return unsub;
  }, []);

  // فرم ثبت و ویرایش
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    projectName: '',
    address: '',
    totalUnits: 50,
    bankName: '',
    accountNumber: '',
    shebaNumber: '',
    cardHolderName: '',
    isActive: true
  });

  const loadData = () => {
    if (!session) return;
    const coops = dataService.getCooperatives(
      session.activeCooperative?.id || null,
      session.isGlobalSuperAdmin
    );
    setCooperatives(coops);
  };

  useEffect(() => {
    loadData();
    const unsub = dataService.subscribe(loadData);
    return unsub;
  }, [session]);

  // باز کردن مودال ثبت
  const handleOpenCreateModal = () => {
    setFormData({
      name: '',
      code: `MASKAN-${Date.now().toString().slice(-4)}`,
      projectName: '',
      address: '',
      totalUnits: 60,
      bankName: 'بانک مسکن',
      accountNumber: '',
      shebaNumber: 'IR',
      cardHolderName: '',
      isActive: true
    });
    setError(null);
    setIsCreateModalOpen(true);
  };

  // باز کردن مودال ویرایش
  const handleOpenEditModal = (coop: Cooperative) => {
    setSelectedCoop(coop);
    setFormData({
      name: coop.name,
      code: coop.code,
      projectName: coop.projectName,
      address: coop.address,
      totalUnits: coop.totalUnits,
      bankName: coop.bankAccountInfo.bankName,
      accountNumber: coop.bankAccountInfo.accountNumber,
      shebaNumber: coop.bankAccountInfo.shebaNumber,
      cardHolderName: coop.bankAccountInfo.cardHolderName,
      isActive: coop.isActive
    });
    setError(null);
    setIsEditModalOpen(true);
  };

  // ثبت تعاونی جدید
  const handleCreateCoop = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (!session) return;

    if (!formData.name || !formData.projectName || !formData.code) {
      setError('نام تعاونی، عنوان پروژه و شناسه الزامی است.');
      return;
    }

    try {
      const created = dataService.createCooperative(formData, {
        id: session.user.id,
        fullName: session.user.fullName,
        role: session.activeRole
      });

      setSuccessMsg(`تعاونی مسکن «${created.name}» با موفقیت ثبت شد${isDbConnected ? ' و با دیتابیس همگام گردید.' : '.'}`);
      setIsCreateModalOpen(false);
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setError(err.message);
    }
  };

  // ویرایش تعاونی
  const handleUpdateCoop = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCoop || !session) return;
    setError(null);

    try {
      const updated = dataService.updateCooperative(selectedCoop.id, formData, {
        id: session.user.id,
        fullName: session.user.fullName,
        role: session.activeRole
      });

      setSuccessMsg(`مشخصات تعاونی «${updated.name}» با موفقیت ویرایش و به‌روزرسانی شد.`);
      setIsEditModalOpen(false);
      setSelectedCoop(null);
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setError(err.message);
    }
  };

  // باز کردن تأیید حذف
  const handleOpenDeleteModal = (coop: Cooperative) => {
    setSelectedCoop(coop);
    setIsDeleteModalOpen(true);
    setError(null);
  };

  // تأیید نهایی حذف
  const handleConfirmDelete = () => {
    if (!selectedCoop || !session) return;
    setError(null);

    try {
      dataService.deleteCooperative(selectedCoop.id, {
        id: session.user.id,
        fullName: session.user.fullName,
        role: session.activeRole
      });

      setSuccessMsg(`تعاونی «${selectedCoop.name}» با موفقیت از پایگاه داده حذف گردید.`);
      setIsDeleteModalOpen(false);
      setSelectedCoop(null);
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const filtered = cooperatives.filter(c => 
    c.name.includes(searchTerm) || 
    c.projectName.includes(searchTerm) || 
    c.code.includes(searchTerm)
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* سربرگ بخش با وضعیت دیتابیس */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Building2 className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-black text-slate-900">مدیریت تعاونی‌های مسکن و پروژه‌ها</h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            تعریف، ویرایش و حذف نهادهای تعاونی، مشخصات پروژه و اطلاعات حساب‌های بانکی
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* نشانگر وضعیت اتصال دیتابیس */}
          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-bold border ${
            isDbConnected 
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
              : 'bg-amber-50 text-amber-700 border-amber-200'
          }`}>
            <Database className="w-3.5 h-3.5" />
            <span>{isDbConnected ? 'دیتابیس: متصل به Supabase' : 'دیتابیس: حالت محلی (Postgres)'}</span>
          </div>

          {/* دکمه افزودن تعاونی (فقط مدیر کل) */}
          {session?.isGlobalSuperAdmin && (
            <button
              onClick={handleOpenCreateModal}
              className="flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-5 py-3 rounded-2xl text-xs font-bold transition-all shadow-sm cursor-pointer shrink-0"
            >
              <Plus className="w-4 h-4 text-emerald-400" />
              <span>ثبت تعاونی جدید</span>
            </button>
          )}
        </div>
      </div>

      {successMsg && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* جستجو و فیلتر */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="جستجو بر اساس نام تعاونی، پروژه یا شناسه..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-4 pr-10 py-3 rounded-2xl bg-white border border-slate-200 text-xs outline-none focus:border-emerald-500 transition-all"
          />
          <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-3.5 pointer-events-none" />
        </div>
        <div className="text-xs text-slate-500 font-bold bg-white px-4 py-3 rounded-2xl border border-slate-200 shrink-0">
          {toPersianDigits(filtered.length)} تعاونی مسکن
        </div>
      </div>

      {/* کارت‌های تعاونی‌ها */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map((coop) => (
          <div key={coop.id} className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between space-y-4 hover:border-slate-300 transition-all">
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-bold bg-slate-100 text-slate-700 px-2.5 py-1 rounded-lg">
                  {coop.code}
                </span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  coop.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                }`}>
                  {coop.isActive ? 'فعال' : 'غیرفعال'}
                </span>
              </div>

              <div>
                <h3 className="font-black text-slate-900 text-base leading-snug">{coop.name}</h3>
                <div className="text-xs text-emerald-700 font-bold mt-1">پروژه: {coop.projectName}</div>
              </div>

              <div className="flex items-start gap-2 text-xs text-slate-500">
                <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                <span className="leading-relaxed">{coop.address}</span>
              </div>
            </div>

            {/* اطلاعات بانکی و مشخصات واحدها */}
            <div className="pt-4 border-t border-slate-100 space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">تعداد کل واحدها:</span>
                <span className="font-bold text-slate-800">{toPersianDigits(coop.totalUnits)} واحد مسکونی</span>
              </div>

              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 text-[11px]">بانک واریز اقساط:</span>
                  <span className="font-bold text-slate-900">{coop.bankAccountInfo.bankName}</span>
                </div>
                <div className="text-slate-500 text-[11px] truncate">
                  شماره شبا: <span className="font-mono font-bold text-slate-800">{coop.bankAccountInfo.shebaNumber}</span>
                </div>
                {coop.bankAccountInfo.cardHolderName && (
                  <div className="text-slate-500 text-[11px]">
                    به نام: <span className="font-medium text-slate-800">{coop.bankAccountInfo.cardHolderName}</span>
                  </div>
                )}
              </div>

              {/* نوار عملیات: ویرایش و حذف */}
              {(session?.isGlobalSuperAdmin || session?.activeRole === 'COOP_ADMIN') && (
                <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-2">
                  <button
                    onClick={() => handleOpenEditModal(coop)}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold transition-all cursor-pointer"
                  >
                    <Pencil className="w-3.5 h-3.5 text-slate-500" />
                    <span>ویرایش</span>
                  </button>

                  {session?.isGlobalSuperAdmin && (
                    <button
                      onClick={() => handleOpenDeleteModal(coop)}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-[11px] font-bold transition-all cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                      <span>حذف</span>
                    </button>
                  )}
                </div>
              )}
            </div>

          </div>
        ))}
      </div>

      {/* مودال ثبت یا ویرایش تعاونی */}
      {(isCreateModalOpen || isEditModalOpen) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden relative max-h-[90vh] flex flex-col">
            
            <div className="p-6 bg-slate-900 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-emerald-400" />
                <h3 className="font-bold text-base">
                  {isEditModalOpen ? `ویرایش تعاونی مسکن «${selectedCoop?.name}»` : 'ثبت تعاونی مسکن جدید'}
                </h3>
              </div>
              <button
                onClick={() => { setIsCreateModalOpen(false); setIsEditModalOpen(false); }}
                className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={isEditModalOpen ? handleUpdateCoop : handleCreateCoop} className="p-6 space-y-4 overflow-y-auto text-xs">
              {error && (
                <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700">نام رسمی تعاونی *</label>
                  <input
                    type="text"
                    required
                    placeholder="مثال: تعاونی مسکن نخبگان دانشگاهی"
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    className="w-full p-3 rounded-xl border border-slate-300 focus:border-emerald-600 outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700">کد / شناسه تعاونی *</label>
                  <input
                    type="text"
                    required
                    placeholder="MASKAN-ELITE-01"
                    dir="ltr"
                    value={formData.code}
                    onChange={e => setFormData({ ...formData, code: e.target.value })}
                    className="w-full p-3 rounded-xl border border-slate-300 focus:border-emerald-600 outline-none font-mono text-left"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700">نام پروژه ساختمانی *</label>
                  <input
                    type="text"
                    required
                    placeholder="پروژه برج آفتاب"
                    value={formData.projectName}
                    onChange={e => setFormData({ ...formData, projectName: e.target.value })}
                    className="w-full p-3 rounded-xl border border-slate-300 focus:border-emerald-600 outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700">تعداد کل واحدها *</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={formData.totalUnits}
                    onChange={e => setFormData({ ...formData, totalUnits: parseInt(e.target.value) || 1 })}
                    className="w-full p-3 rounded-xl border border-slate-300 focus:border-emerald-600 outline-none font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-slate-700">آدرس پروژه *</label>
                <input
                  type="text"
                  required
                  placeholder="تهران، منطقه ۲۲، بلوار کوهک، پروژه مسکونی..."
                  value={formData.address}
                  onChange={e => setFormData({ ...formData, address: e.target.value })}
                  className="w-full p-3 rounded-xl border border-slate-300 focus:border-emerald-600 outline-none"
                />
              </div>

              {/* اطلاعات حساب بانکی جهت دریافت اقساط */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="font-bold text-slate-900 flex items-center gap-1.5">
                  <CreditCard className="w-4 h-4 text-emerald-600" />
                  <span>اطلاعات حساب بانکی واریز اقساط اعضا</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-600">نام بانک *</label>
                    <input
                      type="text"
                      required
                      placeholder="بانک مسکن / ملی"
                      value={formData.bankName}
                      onChange={e => setFormData({ ...formData, bankName: e.target.value })}
                      className="w-full p-2.5 rounded-xl border border-slate-300 focus:border-emerald-600 outline-none bg-white"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-600">شماره حساب *</label>
                    <input
                      type="text"
                      required
                      placeholder="0102030405006"
                      dir="ltr"
                      value={formData.accountNumber}
                      onChange={e => setFormData({ ...formData, accountNumber: e.target.value })}
                      className="w-full p-2.5 rounded-xl border border-slate-300 focus:border-emerald-600 outline-none font-mono bg-white text-left"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-600">شماره شبا (IBAN) *</label>
                    <input
                      type="text"
                      required
                      placeholder="IR120120000000000000000000"
                      dir="ltr"
                      value={formData.shebaNumber}
                      onChange={e => setFormData({ ...formData, shebaNumber: e.target.value })}
                      className="w-full p-2.5 rounded-xl border border-slate-300 focus:border-emerald-600 outline-none font-mono bg-white text-left text-[11px]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-600">نام صاحب حساب *</label>
                    <input
                      type="text"
                      required
                      placeholder="تعاونی مسکن..."
                      value={formData.cardHolderName}
                      onChange={e => setFormData({ ...formData, cardHolderName: e.target.value })}
                      className="w-full p-2.5 rounded-xl border border-slate-300 focus:border-emerald-600 outline-none bg-white"
                    />
                  </div>
                </div>
              </div>

              {isEditModalOpen && (
                <div className="flex items-center gap-2 pt-2">
                  <input
                    type="checkbox"
                    id="isActiveCoop"
                    checked={formData.isActive}
                    onChange={e => setFormData({ ...formData, isActive: e.target.checked })}
                    className="w-4 h-4 rounded text-emerald-600 cursor-pointer"
                  />
                  <label htmlFor="isActiveCoop" className="font-bold text-slate-700 cursor-pointer">
                    تعاونی در وضعیت فعال قرار دارد
                  </label>
                </div>
              )}

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => { setIsCreateModalOpen(false); setIsEditModalOpen(false); }}
                  className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold transition-all shadow-sm cursor-pointer"
                >
                  {isEditModalOpen ? 'ذخیره تغییرات' : 'ثبت قطعی تعاونی'}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* مودال تأیید حذف تعاونی */}
      {isDeleteModalOpen && selectedCoop && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-slate-200 p-6 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>

            <div className="text-center space-y-2">
              <h3 className="font-black text-slate-900 text-base">
                حذف تعاونی مسکن «{selectedCoop.name}»
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                آیا از حذف این تعاونی اطمینان دارید؟ با حذف تعاونی، تمامی اعضا، واحدها و اطلاعات مرتبط از پایگاه داده حذف یا تفکیک خواهند شد. این عملیات غیرقابل بازگشت است.
              </p>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => { setIsDeleteModalOpen(false); setSelectedCoop(null); }}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-xs font-bold hover:bg-slate-50 transition-colors cursor-pointer"
              >
                انصراف
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all cursor-pointer shadow-sm"
              >
                تأیید و حذف نهایی
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
