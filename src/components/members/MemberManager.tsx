import React, { useState, useEffect } from 'react';
import { 
  Users, 
  UserPlus, 
  Search, 
  Phone, 
  CreditCard, 
  Home, 
  CheckCircle2, 
  AlertCircle, 
  X,
  Shield,
  Filter,
  Check,
  Building2,
  Pencil,
  Trash2,
  Database,
  UserCheck,
  UserX,
  Layers
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { dataService } from '../../services/dataService';
import { User, Membership, Unit, UserRole } from '../../types/database';
import { 
  toPersianDigits, 
  isValidIranianNationalCode, 
  isValidIranianMobile,
  formatJalaliDate
} from '../../utils/persian';
import { isSupabaseConfigured } from '../../lib/supabase';
import { dbClient } from '../../lib/dbClient';

export const MemberManager: React.FC = () => {
  const { session } = useAuth();
  const [members, setMembers] = useState<{ user: User; membership: Membership; unit?: Unit }[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [activeTab, setActiveTab] = useState<'members' | 'users'>('members');
  const [searchTerm, setSearchTerm] = useState('');
  
  // مودال‌ها
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditMemberModalOpen, setIsEditMemberModalOpen] = useState(false);
  const [isEditUserModalOpen, setIsEditUserModalOpen] = useState(false);
  const [isDeleteMemberModalOpen, setIsDeleteMemberModalOpen] = useState(false);
  const [isDeleteUserModalOpen, setIsDeleteUserModalOpen] = useState(false);
  
  // آیتم‌های انتخاب شده
  const [selectedMember, setSelectedMember] = useState<{ user: User; membership: Membership; unit?: Unit } | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

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

  // فرم ثبت
  const [createFormData, setCreateFormData] = useState({
    fullName: '',
    mobile: '',
    nationalCode: '',
    fatherName: '',
    role: 'MEMBER' as UserRole,
    cooperativeId: ''
  });

  // فرم ویرایش
  const [editFormData, setEditFormData] = useState({
    fullName: '',
    mobile: '',
    nationalCode: '',
    fatherName: '',
    role: 'MEMBER' as UserRole,
    membershipNumber: '',
    isActive: true
  });

  const allCoops = dataService.getAllCooperatives();

  const loadData = () => {
    if (!session) return;
    const list = dataService.getMembers(
      session.activeCooperative?.id || null,
      session.isGlobalSuperAdmin
    );
    setMembers(list);
    setAllUsers(dataService.getAllUsers());
  };

  useEffect(() => {
    loadData();
    const unsub = dataService.subscribe(loadData);
    return unsub;
  }, [session]);

  // باز کردن مودال ثبت عضو
  const openCreateModal = () => {
    setCreateFormData({
      fullName: '',
      mobile: '',
      nationalCode: '',
      fatherName: '',
      role: 'MEMBER',
      cooperativeId: session?.activeCooperative?.id || allCoops[0]?.id || ''
    });
    setError(null);
    setIsCreateModalOpen(true);
  };

  // باز کردن مودال ویرایش عضو
  const openEditMemberModal = (item: { user: User; membership: Membership; unit?: Unit }) => {
    setSelectedMember(item);
    setEditFormData({
      fullName: item.user.fullName,
      mobile: item.user.mobile,
      nationalCode: item.user.nationalCode,
      fatherName: item.user.fatherName || '',
      role: item.membership.role,
      membershipNumber: item.membership.membershipNumber,
      isActive: item.membership.isActive
    });
    setError(null);
    setIsEditMemberModalOpen(true);
  };

  // باز کردن مودال ویرایش کاربر مستقیم
  const openEditUserModal = (user: User) => {
    setSelectedUser(user);
    setEditFormData({
      fullName: user.fullName,
      mobile: user.mobile,
      nationalCode: user.nationalCode,
      fatherName: user.fatherName || '',
      role: 'MEMBER',
      membershipNumber: '',
      isActive: user.isActive
    });
    setError(null);
    setIsEditUserModalOpen(true);
  };

  // ثبت عضو جدید
  const handleRegisterMember = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (!session) return;

    try {
      const result = dataService.registerMember({
        cooperativeId: createFormData.cooperativeId,
        fullName: createFormData.fullName,
        mobile: createFormData.mobile,
        nationalCode: createFormData.nationalCode,
        fatherName: createFormData.fatherName,
        role: createFormData.role
      }, {
        id: session.user.id,
        fullName: session.user.fullName,
        role: session.activeRole
      });

      setSuccessMsg(`کاربر «${result.user.fullName}» با موفقیت در تعاونی ثبت شد${isDbConnected ? ' و به دیتابیس Supabase منتقل گردید.' : '.'}`);
      setIsCreateModalOpen(false);
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setError(err.message);
    }
  };

  // ثبت ویرایش عضو
  const handleUpdateMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMember || !session) return;
    setError(null);

    try {
      // به‌روزرسانی کاربر
      dataService.updateUser(selectedMember.user.id, {
        fullName: editFormData.fullName,
        mobile: editFormData.mobile,
        nationalCode: editFormData.nationalCode,
        fatherName: editFormData.fatherName,
        isActive: editFormData.isActive
      }, {
        id: session.user.id,
        fullName: session.user.fullName,
        role: session.activeRole
      });

      // به‌روزرسانی پرونده عضویت
      dataService.updateMembership(selectedMember.membership.id, {
        role: editFormData.role,
        membershipNumber: editFormData.membershipNumber,
        isActive: editFormData.isActive
      }, {
        id: session.user.id,
        fullName: session.user.fullName,
        role: session.activeRole
      });

      setSuccessMsg(`مشخصات عضو «${editFormData.fullName}» با موفقیت به‌روزرسانی شد.`);
      setIsEditMemberModalOpen(false);
      setSelectedMember(null);
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setError(err.message);
    }
  };

  // ثبت ویرایش کاربر مستقل
  const handleUpdateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser || !session) return;
    setError(null);

    try {
      dataService.updateUser(selectedUser.id, {
        fullName: editFormData.fullName,
        mobile: editFormData.mobile,
        nationalCode: editFormData.nationalCode,
        fatherName: editFormData.fatherName,
        isActive: editFormData.isActive
      }, {
        id: session.user.id,
        fullName: session.user.fullName,
        role: session.activeRole
      });

      setSuccessMsg(`مشخصات هویتی کاربر «${editFormData.fullName}» با موفقیت ویرایش شد.`);
      setIsEditUserModalOpen(false);
      setSelectedUser(null);
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setError(err.message);
    }
  };

  // حذف پرونده عضویت
  const handleConfirmDeleteMember = () => {
    if (!selectedMember || !session) return;
    setError(null);

    try {
      dataService.deleteMember(selectedMember.membership.id, {
        id: session.user.id,
        fullName: session.user.fullName,
        role: session.activeRole
      });

      setSuccessMsg(`عضو «${selectedMember.user.fullName}» با موفقیت از تعاونی حذف شد.`);
      setIsDeleteMemberModalOpen(false);
      setSelectedMember(null);
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setError(err.message);
    }
  };

  // حذف کامل کاربر
  const handleConfirmDeleteUser = () => {
    if (!selectedUser || !session) return;
    setError(null);

    try {
      dataService.deleteUser(selectedUser.id, {
        id: session.user.id,
        fullName: session.user.fullName,
        role: session.activeRole
      });

      setSuccessMsg(`کاربر «${selectedUser.fullName}» با موفقیت از کل پایگاه داده حذف گردید.`);
      setIsDeleteUserModalOpen(false);
      setSelectedUser(null);
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setError(err.message);
    }
  };

  // اعتبارسنجی زنده در فرم
  const isCreateMobileValid = isValidIranianMobile(createFormData.mobile);
  const isCreateNationalCodeValid = isValidIranianNationalCode(createFormData.nationalCode);

  const filteredMembers = members.filter(({ user, membership }) => {
    const term = searchTerm.toLowerCase();
    return (
      user.fullName.toLowerCase().includes(term) ||
      user.nationalCode.includes(term) ||
      user.mobile.includes(term) ||
      membership.membershipNumber.toLowerCase().includes(term)
    );
  });

  const filteredUsers = allUsers.filter(u => {
    const term = searchTerm.toLowerCase();
    return (
      u.fullName.toLowerCase().includes(term) ||
      u.nationalCode.includes(term) ||
      u.mobile.includes(term)
    );
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* سربرگ بخش با نشانگر دیتابیس */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-black text-slate-900">مدیریت اعضای تعاونی و کاربران سامانه</h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            ثبت، ویرایش و حذف اعضا، مدیریت پرونده‌های عضویت و یکپارچه‌سازی با PostgreSQL
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* نشانگر وضعیت دیتابیس */}
          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-bold border ${
            isDbConnected 
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
              : 'bg-amber-50 text-amber-700 border-amber-200'
          }`}>
            <Database className="w-3.5 h-3.5" />
            <span>{isDbConnected ? 'دیتابیس: متصل به Supabase' : 'دیتابیس: محلی'}</span>
          </div>

          {session?.activeRole !== 'MEMBER' && (
            <button
              onClick={openCreateModal}
              className="flex items-center justify-center gap-2 bg-emerald-700 hover:bg-emerald-800 text-white px-5 py-3 rounded-2xl text-xs font-bold transition-all shadow-sm cursor-pointer shrink-0"
            >
              <UserPlus className="w-4 h-4 text-emerald-300" />
              <span>ثبت کاربر و عضو جدید</span>
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

      {/* تب‌های جابجایی بین اعضای تعاونی و کل کاربران */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 p-1.5 bg-slate-200/70 rounded-2xl w-fit">
          <button
            onClick={() => setActiveTab('members')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'members'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            اعضای تعاونی فعال ({toPersianDigits(filteredMembers.length)})
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'users'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            پایگاه داده تمام کاربران ({toPersianDigits(filteredUsers.length)})
          </button>
        </div>

        {/* فیلد جستجو */}
        <div className="relative w-full sm:w-80">
          <input
            type="text"
            placeholder="جستجو با نام، کد ملی، شماره موبایل..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-4 pr-10 py-2.5 rounded-2xl bg-white border border-slate-200 text-xs outline-none focus:border-emerald-500 transition-all"
          />
          <Search className="w-4 h-4 text-slate-400 absolute right-3 top-3 pointer-events-none" />
        </div>
      </div>

      {/* حالت اول: جدول اعضای تعاونی */}
      {activeTab === 'members' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-600 border-b border-slate-200">
                  <th className="py-4 px-5 font-bold">نام و نام خانوادگی</th>
                  <th className="py-4 px-4 font-bold">کد ملی</th>
                  <th className="py-4 px-4 font-bold">شماره موبایل</th>
                  <th className="py-4 px-4 font-bold">شماره عضویت</th>
                  <th className="py-4 px-4 font-bold">واحد منتسب</th>
                  <th className="py-4 px-4 font-bold">نقش در تعاونی</th>
                  <th className="py-4 px-4 font-bold">وضعیت</th>
                  <th className="py-4 px-4 font-bold text-center">عملیات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredMembers.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-400 text-xs">
                      هیچ عضوی با این مشخصات یافت نشد.
                    </td>
                  </tr>
                ) : (
                  filteredMembers.map((item) => (
                    <tr key={item.membership.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-5 font-bold text-slate-900 flex items-center gap-2.5">
                        <img
                          src={item.user.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150'}
                          alt=""
                          className="w-8 h-8 rounded-full object-cover border border-slate-200"
                        />
                        <div>
                          <div>{item.user.fullName}</div>
                          {item.user.fatherName && (
                            <div className="text-[10px] text-slate-400 font-normal">فرزند {item.user.fatherName}</div>
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-700">
                        {toPersianDigits(item.user.nationalCode)}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-slate-600">
                        {toPersianDigits(item.user.mobile)}
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                        {item.membership.membershipNumber}
                      </td>
                      <td className="py-3.5 px-4">
                        {item.unit ? (
                          <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-800 text-[11px] font-bold px-2.5 py-1 rounded-xl border border-emerald-200">
                            <Home className="w-3.5 h-3.5 text-emerald-600" />
                            <span>واحد {toPersianDigits(item.unit.unitNumber)} (بلوک {item.unit.block})</span>
                          </span>
                        ) : (
                          <span className="text-slate-400 text-[11px]">فاقد واحد</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          item.membership.role === 'COOP_ADMIN' 
                            ? 'bg-sky-100 text-sky-800' 
                            : item.membership.role === 'SUPER_ADMIN'
                            ? 'bg-purple-100 text-purple-800'
                            : 'bg-slate-100 text-slate-800'
                        }`}>
                          {item.membership.role === 'COOP_ADMIN' ? 'مدیر تعاونی' : item.membership.role === 'SUPER_ADMIN' ? 'مدیر کل' : 'عضو'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          item.membership.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                        }`}>
                          {item.membership.isActive ? 'فعال' : 'غیرفعال'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center justify-center gap-1.5">
                          {(session?.isGlobalSuperAdmin || session?.activeRole === 'COOP_ADMIN') && (
                            <>
                              <button
                                onClick={() => openEditMemberModal(item)}
                                className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                                title="ویرایش مشخصات و عضویت"
                              >
                                <Pencil className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => {
                                  setSelectedMember(item);
                                  setIsDeleteMemberModalOpen(true);
                                  setError(null);
                                }}
                                className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                                title="حذف عضو از تعاونی"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* حالت دوم: جدول تمامی کاربران سیستم */}
      {activeTab === 'users' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-600 border-b border-slate-200">
                  <th className="py-4 px-5 font-bold">نام و نام خانوادگی</th>
                  <th className="py-4 px-4 font-bold">کد ملی</th>
                  <th className="py-4 px-4 font-bold">شماره تلفن همراه</th>
                  <th className="py-4 px-4 font-bold">نام پدر</th>
                  <th className="py-4 px-4 font-bold">وضعیت حساب</th>
                  <th className="py-4 px-4 font-bold text-center">عملیات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-5 font-bold text-slate-900 flex items-center gap-2.5">
                      <img
                        src={user.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150'}
                        alt=""
                        className="w-8 h-8 rounded-full object-cover border border-slate-200"
                      />
                      <span>{user.fullName}</span>
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-700">
                      {toPersianDigits(user.nationalCode)}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-600">
                      {toPersianDigits(user.mobile)}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">
                      {user.fatherName || '—'}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        user.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                      }`}>
                        {user.isActive ? 'فعال' : 'مسدود'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center justify-center gap-1.5">
                        {(session?.isGlobalSuperAdmin || session?.activeRole === 'COOP_ADMIN') && (
                          <>
                            <button
                              onClick={() => openEditUserModal(user)}
                              className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                              title="ویرایش هویت کاربر"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            {session?.isGlobalSuperAdmin && (
                              <button
                                onClick={() => {
                                  setSelectedUser(user);
                                  setIsDeleteUserModalOpen(true);
                                  setError(null);
                                }}
                                className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                                title="حذف کامل کاربر از دیتابیس"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* مودال ثبت عضو و کاربر جدید */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-slate-200 overflow-hidden relative">
            
            <div className="p-6 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-emerald-400" />
                <h3 className="font-bold text-base">ثبت‌نام عضو و کاربر جدید</h3>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleRegisterMember} className="p-6 space-y-4 text-xs">
              {error && (
                <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* انتخاب تعاونی مسکن */}
              {session?.isGlobalSuperAdmin ? (
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700">تعاونی مسکن مقصد *</label>
                  <select
                    required
                    value={createFormData.cooperativeId}
                    onChange={e => setCreateFormData({ ...createFormData, cooperativeId: e.target.value })}
                    className="w-full p-3 rounded-xl border border-slate-300 focus:border-emerald-600 outline-none bg-white"
                  >
                    {allCoops.length === 0 ? (
                      <option value="">ابتدا یک تعاونی مسکن ایجاد فرمایید</option>
                    ) : (
                      allCoops.map(c => (
                        <option key={c.id} value={c.id}>
                          {c.name} ({c.projectName})
                        </option>
                      ))
                    )}
                  </select>
                </div>
              ) : session?.activeCooperative ? (
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700">تعاونی مسکن تحت مدیریت شما</label>
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 font-bold text-xs flex items-center justify-between">
                    <span>{session.activeCooperative.name} ({session.activeCooperative.projectName})</span>
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-semibold">پروژه فعال</span>
                  </div>
                </div>
              ) : null}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700">نام و نام خانوادگی *</label>
                  <input
                    type="text"
                    required
                    placeholder="مثال: علیرضا محمدی"
                    value={createFormData.fullName}
                    onChange={e => setCreateFormData({ ...createFormData, fullName: e.target.value })}
                    className="w-full p-3 rounded-xl border border-slate-300 focus:border-emerald-600 outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700">نام پدر</label>
                  <input
                    type="text"
                    placeholder="مثال: حسین"
                    value={createFormData.fatherName}
                    onChange={e => setCreateFormData({ ...createFormData, fatherName: e.target.value })}
                    className="w-full p-3 rounded-xl border border-slate-300 focus:border-emerald-600 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="font-bold text-slate-700">شماره موبایل *</label>
                    {createFormData.mobile && (
                      <span className={`text-[10px] font-bold ${isCreateMobileValid ? 'text-emerald-600' : 'text-rose-500'}`}>
                        {isCreateMobileValid ? 'صحیح ✓' : 'نامعتبر'}
                      </span>
                    )}
                  </div>
                  <input
                    type="tel"
                    required
                    placeholder="09123456789"
                    dir="ltr"
                    value={createFormData.mobile}
                    onChange={e => setCreateFormData({ ...createFormData, mobile: e.target.value })}
                    className={`w-full p-3 rounded-xl border outline-none font-mono text-left ${
                      createFormData.mobile && !isCreateMobileValid
                        ? 'border-rose-300 bg-rose-50/50'
                        : 'border-slate-300 focus:border-emerald-600'
                    }`}
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="font-bold text-slate-700">کد ملی (۱۰ رقم) *</label>
                    {createFormData.nationalCode && (
                      <span className={`text-[10px] font-bold ${isCreateNationalCodeValid ? 'text-emerald-600' : 'text-rose-500'}`}>
                        {isCreateNationalCodeValid ? 'معتبر ✓' : 'الگوریتم نامعتبر'}
                      </span>
                    )}
                  </div>
                  <input
                    type="text"
                    required
                    maxLength={10}
                    placeholder="0010350829"
                    dir="ltr"
                    value={createFormData.nationalCode}
                    onChange={e => setCreateFormData({ ...createFormData, nationalCode: e.target.value })}
                    className={`w-full p-3 rounded-xl border outline-none font-mono text-left ${
                      createFormData.nationalCode && !isCreateNationalCodeValid
                        ? 'border-rose-300 bg-rose-50/50'
                        : 'border-slate-300 focus:border-emerald-600'
                    }`}
                  />
                  <p className="text-[11px] text-slate-400">
                    کد ملی معتبر ۱۰ رقمی متقاضی (صفرهای ابتدایی به طور خودکار تنظیم می‌شوند).
                  </p>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-slate-700">نقش سازمانی در تعاونی</label>
                <select
                  value={createFormData.role}
                  onChange={e => setCreateFormData({ ...createFormData, role: e.target.value as UserRole })}
                  className="w-full p-3 rounded-xl border border-slate-300 focus:border-emerald-600 outline-none bg-white"
                >
                  <option value="MEMBER">عضو عادی تعاونی (خریدار واحد)</option>
                  <option value="ACCOUNTANT">حسابدار تعاونی</option>
                  {session?.isGlobalSuperAdmin && (
                    <option value="COOP_ADMIN">مدیر اجرایی تعاونی (دسترسی مدیریت تعاونی)</option>
                  )}
                  {session?.isGlobalSuperAdmin && (
                    <option value="SUPER_ADMIN">مدیر ارشد سامانه</option>
                  )}
                </select>
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  disabled={!createFormData.fullName || !isCreateMobileValid || !isCreateNationalCodeValid}
                  className="px-6 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white font-bold transition-all shadow-sm cursor-pointer"
                >
                  ثبت نام قطعی عضو
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* مودال ویرایش عضو و پرونده */}
      {isEditMemberModalOpen && selectedMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-slate-200 overflow-hidden relative">
            <div className="p-6 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Pencil className="w-5 h-5 text-emerald-400" />
                <h3 className="font-bold text-base">ویرایش مشخصات و پرونده عضویت</h3>
              </div>
              <button
                onClick={() => setIsEditMemberModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleUpdateMember} className="p-6 space-y-4 text-xs">
              {error && (
                <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700">نام و نام خانوادگی *</label>
                  <input
                    type="text"
                    required
                    value={editFormData.fullName}
                    onChange={e => setEditFormData({ ...editFormData, fullName: e.target.value })}
                    className="w-full p-3 rounded-xl border border-slate-300 focus:border-emerald-600 outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700">نام پدر</label>
                  <input
                    type="text"
                    value={editFormData.fatherName}
                    onChange={e => setEditFormData({ ...editFormData, fatherName: e.target.value })}
                    className="w-full p-3 rounded-xl border border-slate-300 focus:border-emerald-600 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700">شماره تلفن همراه *</label>
                  <input
                    type="tel"
                    required
                    dir="ltr"
                    value={editFormData.mobile}
                    onChange={e => setEditFormData({ ...editFormData, mobile: e.target.value })}
                    className="w-full p-3 rounded-xl border border-slate-300 focus:border-emerald-600 outline-none font-mono text-left"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700">کد ملی *</label>
                  <input
                    type="text"
                    required
                    maxLength={10}
                    dir="ltr"
                    value={editFormData.nationalCode}
                    onChange={e => setEditFormData({ ...editFormData, nationalCode: e.target.value })}
                    className="w-full p-3 rounded-xl border border-slate-300 focus:border-emerald-600 outline-none font-mono text-left"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700">شماره پرونده عضویت</label>
                  <input
                    type="text"
                    value={editFormData.membershipNumber}
                    onChange={e => setEditFormData({ ...editFormData, membershipNumber: e.target.value })}
                    className="w-full p-3 rounded-xl border border-slate-300 focus:border-emerald-600 outline-none font-mono"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700">نقش در تعاونی</label>
                  <select
                    value={editFormData.role}
                    onChange={e => setEditFormData({ ...editFormData, role: e.target.value as UserRole })}
                    className="w-full p-3 rounded-xl border border-slate-300 focus:border-emerald-600 outline-none bg-white"
                  >
                    <option value="MEMBER">عضو عادی</option>
                    <option value="COOP_ADMIN">مدیر تعاونی</option>
                    <option value="ACCOUNTANT">حسابدار</option>
                    {session?.isGlobalSuperAdmin && (
                      <option value="SUPER_ADMIN">مدیر ارشد سامانه</option>
                    )}
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="isActiveMember"
                  checked={editFormData.isActive}
                  onChange={e => setEditFormData({ ...editFormData, isActive: e.target.checked })}
                  className="w-4 h-4 rounded text-emerald-600 cursor-pointer"
                />
                <label htmlFor="isActiveMember" className="font-bold text-slate-700 cursor-pointer">
                  عضو در تعاونی فعال است
                </label>
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsEditMemberModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold transition-all shadow-sm cursor-pointer"
                >
                  ذخیره تغییرات
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* مودال ویرایش کاربر مستقل */}
      {isEditUserModalOpen && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-slate-200 overflow-hidden relative">
            <div className="p-6 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Pencil className="w-5 h-5 text-emerald-400" />
                <h3 className="font-bold text-base">ویرایش اطلاعات هویتی کاربر</h3>
              </div>
              <button
                onClick={() => setIsEditUserModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleUpdateUser} className="p-6 space-y-4 text-xs">
              {error && (
                <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700">نام و نام خانوادگی *</label>
                  <input
                    type="text"
                    required
                    value={editFormData.fullName}
                    onChange={e => setEditFormData({ ...editFormData, fullName: e.target.value })}
                    className="w-full p-3 rounded-xl border border-slate-300 focus:border-emerald-600 outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700">نام پدر</label>
                  <input
                    type="text"
                    value={editFormData.fatherName}
                    onChange={e => setEditFormData({ ...editFormData, fatherName: e.target.value })}
                    className="w-full p-3 rounded-xl border border-slate-300 focus:border-emerald-600 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700">شماره موبایل *</label>
                  <input
                    type="tel"
                    required
                    dir="ltr"
                    value={editFormData.mobile}
                    onChange={e => setEditFormData({ ...editFormData, mobile: e.target.value })}
                    className="w-full p-3 rounded-xl border border-slate-300 focus:border-emerald-600 outline-none font-mono text-left"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700">کد ملی *</label>
                  <input
                    type="text"
                    required
                    maxLength={10}
                    dir="ltr"
                    value={editFormData.nationalCode}
                    onChange={e => setEditFormData({ ...editFormData, nationalCode: e.target.value })}
                    className="w-full p-3 rounded-xl border border-slate-300 focus:border-emerald-600 outline-none font-mono text-left"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="isActiveUser"
                  checked={editFormData.isActive}
                  onChange={e => setEditFormData({ ...editFormData, isActive: e.target.checked })}
                  className="w-4 h-4 rounded text-emerald-600 cursor-pointer"
                />
                <label htmlFor="isActiveUser" className="font-bold text-slate-700 cursor-pointer">
                  حساب کاربری فعال و مجاز به ورود است
                </label>
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsEditUserModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold transition-all shadow-sm cursor-pointer"
                >
                  ذخیره تغییرات
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* مودال تأیید حذف عضو از تعاونی */}
      {isDeleteMemberModalOpen && selectedMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-slate-200 p-6 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>

            <div className="text-center space-y-2">
              <h3 className="font-black text-slate-900 text-base">
                حذف عضویت «{selectedMember.user.fullName}»
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                آیا از لغو پرونده عضویت شماره {selectedMember.membership.membershipNumber} اطمینان دارید؟ 
                {selectedMember.unit && ' واحد مسکونی تخصیص‌یافته به ایشان آزاد خواهد شد.'}
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
                onClick={() => { setIsDeleteMemberModalOpen(false); setSelectedMember(null); }}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-xs font-bold hover:bg-slate-50 transition-colors cursor-pointer"
              >
                انصراف
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteMember}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all cursor-pointer shadow-sm"
              >
                تأیید و حذف عضو
              </button>
            </div>
          </div>
        </div>
      )}

      {/* مودال تأیید حذف کامل کاربر */}
      {isDeleteUserModalOpen && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-slate-200 p-6 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>

            <div className="text-center space-y-2">
              <h3 className="font-black text-slate-900 text-base">
                حذف کامل کاربر «{selectedUser.fullName}»
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                این عملیات کاربر را به همراه کلیه سوابق عضویت و انتساب‌ها به صورت دائمی از پایگاه داده حذف می‌کند. آیا مطمئن هستید؟
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
                onClick={() => { setIsDeleteUserModalOpen(false); setSelectedUser(null); }}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-xs font-bold hover:bg-slate-50 transition-colors cursor-pointer"
              >
                انصراف
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteUser}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all cursor-pointer shadow-sm"
              >
                تأیید و حذف دائمی کاربر
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
