import React, { useState } from 'react';
import { 
  LogIn, 
  LogOut, 
  Building2, 
  ChevronDown, 
  User as UserIcon, 
  Shield, 
  ArrowLeftRight 
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { TenantSwitcherModal } from './TenantSwitcherModal';
import { toPersianDigits } from '../../utils/persian';

interface UserMenuProps {
  onOpenLogin: () => void;
}

export const UserMenu: React.FC<UserMenuProps> = ({ onOpenLogin }) => {
  const { session, isAuthenticated, logout } = useAuth();
  const [isSwitcherOpen, setIsSwitcherOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  if (!isAuthenticated || !session) {
    return (
      <button
        onClick={onOpenLogin}
        className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer"
      >
        <LogIn className="w-4 h-4 text-emerald-400" />
        <span>ورود به حساب کاربری</span>
      </button>
    );
  }

  const roleLabel = 
    session.activeRole === 'SUPER_ADMIN' ? 'مدیر کل' :
    session.activeRole === 'COOP_ADMIN' ? 'مدیر تعاونی' : 'عضو تعاونی';

  const roleColor = 
    session.activeRole === 'SUPER_ADMIN' ? 'bg-purple-100 text-purple-800 border-purple-200' :
    session.activeRole === 'COOP_ADMIN' ? 'bg-sky-100 text-sky-800 border-sky-200' :
    'bg-emerald-100 text-emerald-800 border-emerald-200';

  return (
    <>
      <div className="relative">
        <div className="flex items-center gap-2">
          
          {/* نمایش تعاونی فعال */}
          {session.isGlobalSuperAdmin ? (
            <button
              onClick={() => setIsSwitcherOpen(true)}
              className="hidden sm:flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-800 px-3 py-1.5 rounded-xl text-xs font-semibold border border-slate-200 transition-colors cursor-pointer"
              title="تغییر تعاونی یا پروژه فعال (مخصوص مدیر ارشد)"
            >
              <Building2 className="w-3.5 h-3.5 text-emerald-600" />
              <span className="max-w-[150px] truncate">
                {session.activeCooperative ? session.activeCooperative.name : 'دید سراسری (همه تعاونی‌ها)'}
              </span>
              <ArrowLeftRight className="w-3 h-3 text-slate-400" />
            </button>
          ) : session.activeCooperative ? (
            <div className="hidden sm:flex items-center gap-2 bg-slate-100 text-slate-800 px-3 py-1.5 rounded-xl text-xs font-semibold border border-slate-200">
              <Building2 className="w-3.5 h-3.5 text-emerald-600" />
              <span className="max-w-[150px] truncate">{session.activeCooperative.name}</span>
            </div>
          ) : null}

          {/* اطلاعات کاربر و منوی پروفایل */}
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2.5 p-1.5 pl-3 rounded-2xl hover:bg-slate-100 border border-transparent hover:border-slate-200 transition-all cursor-pointer"
          >
            <img
              src={session.user.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150'}
              alt={session.user.fullName}
              className="w-8 h-8 rounded-full object-cover ring-2 ring-emerald-500/20"
            />
            <div className="text-right hidden md:block">
              <div className="text-xs font-bold text-slate-900 leading-tight">
                {session.user.fullName}
              </div>
              <div className="flex items-center gap-1 mt-0.5">
                <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded border ${roleColor}`}>
                  {roleLabel}
                </span>
              </div>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
          </button>
        </div>

        {/* منوی بازشونده کشویی */}
        {dropdownOpen && (
          <div className="absolute left-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-slate-200 py-2 z-50 text-right animate-in fade-in-50 slide-in-from-top-2">
            
            <div className="px-4 py-3 border-b border-slate-100">
              <div className="font-bold text-sm text-slate-900">{session.user.fullName}</div>
              <div className="font-mono text-xs text-slate-500 mt-0.5">{toPersianDigits(session.user.mobile)}</div>
              <div className="mt-2 text-[11px] text-slate-600 bg-slate-50 p-2 rounded-xl border border-slate-200">
                <span className="text-slate-400">تعاونی جاری:</span>{' '}
                <span className="font-semibold text-slate-800">
                  {session.activeCooperative ? session.activeCooperative.name : 'دید فراگیر سراسری'}
                </span>
              </div>
            </div>

            <div className="p-1 space-y-0.5">
              <button
                onClick={() => {
                  setDropdownOpen(false);
                  setIsSwitcherOpen(true);
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 rounded-xl transition-colors cursor-pointer text-right"
              >
                <ArrowLeftRight className="w-4 h-4 text-emerald-600" />
                <span>تغییر تعاونی / پروژه فعال</span>
              </button>

              <button
                onClick={() => {
                  setDropdownOpen(false);
                  logout();
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer text-right"
              >
                <LogOut className="w-4 h-4 text-rose-500" />
                <span>خروج از حساب کاربری</span>
              </button>
            </div>

          </div>
        )}
      </div>

      {/* مودال انتخاب تعاونی */}
      <TenantSwitcherModal
        isOpen={isSwitcherOpen}
        onClose={() => setIsSwitcherOpen(false)}
      />
    </>
  );
};
