import React, { useState, useRef, useEffect } from 'react';
import { 
  Building2, 
  Calendar, 
  LayoutDashboard, 
  CreditCard, 
  Coins, 
  CalendarDays, 
  Home, 
  Users, 
  Layers, 
  Database, 
  ChevronDown,
  Activity,
  FileCode,
  ShieldCheck,
  Sparkles,
  Trash2,
  BookOpen
} from 'lucide-react';
import { formatJalaliDate } from '../utils/persian';
import { UserMenu } from './auth/UserMenu';
import { useAuth } from '../context/AuthContext';
import { isSupabaseConfigured } from '../lib/supabase';
import { dbClient } from '../lib/dbClient';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenLogin: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab, onOpenLogin }) => {
  const todayJalali = formatJalaliDate(new Date(), false);
  const { session } = useAuth();

  const [isDbConnected, setIsDbConnected] = useState<boolean>(dbClient.isConnected() || isSupabaseConfigured());

  useEffect(() => {
    dbClient.checkStatus().then(st => setIsDbConnected(st.connected || isSupabaseConfigured())).catch(() => {});
    const unsub = dbClient.subscribe(() => {
      setIsDbConnected(dbClient.isConnected() || isSupabaseConfigured());
    });
    return unsub;
  }, []);

  const role = session?.activeRole || 'MEMBER';

  // تب‌های نقش‌محور پروداکشن (بدون ابزارهای اضافی تست و شبیه‌ساز)
  let visibleTabs: { id: string; label: string; icon: React.ComponentType<{ className?: string }> }[] = [];

  if (role === 'SUPER_ADMIN') {
    visibleTabs = [
      { id: 'dashboard', label: 'داشبورد مدیریتی', icon: LayoutDashboard },
      { id: 'cooperatives', label: 'تعاونی‌ها و پروژه‌ها', icon: Layers },
      { id: 'members', label: 'مدیران و کاربران', icon: Users },
      { id: 'payments', label: 'امور مالی و واریزی‌ها', icon: CreditCard },
      { id: 'logs', label: 'لاگ‌های امنیتی', icon: ShieldCheck },
      { id: 'aiDashboard', label: 'داشبورد هوش مصنوعی', icon: Sparkles },
      { id: 'recycleBin', label: 'سطل بازیافت', icon: Trash2 },
      { id: 'docs', label: 'راهنمای سامانه', icon: BookOpen },
    ];
  } else if (role === 'COOP_ADMIN') {
    visibleTabs = [
      { id: 'dashboard', label: 'داشبورد تعاونی', icon: LayoutDashboard },
      { id: 'members', label: 'اعضای تعاونی', icon: Users },
      { id: 'units', label: 'واحدها و قراردادها', icon: Home },
      { id: 'installments', label: 'اقساط ساختمانی', icon: CalendarDays },
      { id: 'monthlyFees', label: 'شارژ و خدمات جاری', icon: Coins },
      { id: 'payments', label: 'امور مالی و فیش‌ها', icon: CreditCard },
      { id: 'logs', label: 'لاگ‌های تعاونی', icon: ShieldCheck },
      { id: 'aiDashboard', label: 'داشبورد هوش مصنوعی', icon: Sparkles },
      { id: 'recycleBin', label: 'سطل بازیافت', icon: Trash2 },
      { id: 'docs', label: 'راهنمای مدیر', icon: BookOpen },
    ];
  } else {
    // MEMBER
    visibleTabs = [
      { id: 'dashboard', label: 'کارتابل من', icon: LayoutDashboard },
      { id: 'installments', label: 'اقساط ساختمانی من', icon: CalendarDays },
      { id: 'monthlyFees', label: 'شارژ و هزینه‌های جاری', icon: Coins },
      { id: 'payments', label: 'پرداخت آنلاین و فیش‌ها', icon: CreditCard },
      { id: 'docs', label: 'راهنمای عضو', icon: BookOpen },
    ];
  }

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* نوار بالایی: برند، تاریخ و کنترل حساب کاربری */}
        <div className="flex items-center justify-between h-18">
          
          {/* لوگو و نام سامانه */}
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-2xl bg-slate-900 flex items-center justify-center text-emerald-400 shadow-md">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-black text-slate-900 tracking-tight">مسکن‌یار</h1>
                <span className="text-[10px] text-slate-400 font-semibold border-r border-slate-200 pr-2">
                  سامانه مدیریت تعاونی‌های مسکن
                </span>
              </div>
            </div>
          </div>

          {/* نوار وضعیت کاربر */}
          <div className="flex items-center gap-3">
            {session?.isGlobalSuperAdmin && (
              <button
                onClick={() => setActiveTab('supabase')}
                className={`hidden sm:flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl border transition-all cursor-pointer ${
                  isDbConnected
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100 shadow-xs'
                    : 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'
                }`}
                title="مشاهده و تست اتصال پایگاه داده PostgreSQL"
              >
                <Database className="w-3.5 h-3.5" />
                <span>{isDbConnected ? 'دیتابیس: متصل' : 'دیتابیس: تنظیم Secret'}</span>
              </button>
            )}

            <div className="hidden md:flex items-center gap-2 text-xs text-slate-500 font-medium bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span>{todayJalali}</span>
            </div>

            {/* کنترل حساب کاربری */}
            <UserMenu onOpenLogin={onOpenLogin} />
          </div>

        </div>

        {/* نوار ناوبری اصلی تب‌ها */}
        <div className="flex items-center justify-start overflow-x-auto pb-2 pt-1 border-t border-slate-100 no-scrollbar gap-1.5">
          {visibleTabs.map((tab) => {
            const isActive = activeTab === tab.id;
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`whitespace-nowrap px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-150 cursor-pointer flex items-center gap-2 ${
                  isActive
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-400' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

      </div>
    </header>
  );
};
