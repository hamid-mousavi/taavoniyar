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
  Wrench,
  Terminal,
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
  const { isAuthenticated, session } = useAuth();
  const [isToolsDropdownOpen, setIsToolsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [isDbConnected, setIsDbConnected] = useState<boolean>(dbClient.isConnected() || isSupabaseConfigured());

  useEffect(() => {
    dbClient.checkStatus().then(st => setIsDbConnected(st.connected || isSupabaseConfigured())).catch(() => {});
    const unsub = dbClient.subscribe(() => {
      setIsDbConnected(dbClient.isConnected() || isSupabaseConfigured());
    });
    return unsub;
  }, []);

  // بستن منوی کشویی هنگام کلیک خارج از آن
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsToolsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // تب‌های عملیاتی و اصلی سامانه پروداکشن
  const mainTabs = [
    { id: 'dashboard', label: 'داشبورد', icon: LayoutDashboard },
    { id: 'payments', label: 'امور مالی و پرداخت‌ها', icon: CreditCard },
    { id: 'monthlyFees', label: 'شارژ و خدمات جاری', icon: Coins },
    { id: 'installments', label: 'اقساط ساختمانی', icon: CalendarDays },
    { id: 'units', label: 'واحدها و نقشه', icon: Home },
    { id: 'members', label: 'اعضای تعاونی', icon: Users },
    { id: 'cooperatives', label: 'پروژه‌ها و تعاونی‌ها', icon: Layers },
    { id: 'aiDashboard', label: 'داشبورد هوش مصنوعی', icon: Sparkles },
    { id: 'recycleBin', label: 'سطل بازیافت', icon: Trash2 },
    { id: 'docs', label: 'راهنمای سامانه', icon: BookOpen },
  ];

  // ابزارهای سیستمی و دیتابیس (منوی کشویی مرتب)
  const systemTools = [
    { id: 'supabase', label: 'پایگاه داده و مهاجرت (Postgres)', icon: Database },
    { id: 'erd', label: 'نمودار روابط داده‌ای (ERD)', icon: Layers },
    { id: 'database', label: 'کاوشگر اطلاعات پایه', icon: Database },
    { id: 'simulator', label: 'شبیه‌ساز چندمستأجری', icon: Terminal },
    { id: 'tests', label: 'تست‌های اعتبارسنجی', icon: Activity },
    { id: 'sql', label: 'کدهای اسکریپت SQL', icon: FileCode },
  ];

  const isCurrentTabInTools = systemTools.some(t => t.id === activeTab);

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
            <button
              onClick={() => setActiveTab('supabase')}
              className={`hidden sm:flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl border transition-all cursor-pointer ${
                isDbConnected
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100 shadow-xs'
                  : 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'
              }`}
              title="مشاهده و تست اتصال پایگاه داده PostgreSQL / Supabase"
            >
              <Database className="w-3.5 h-3.5" />
              <span>{isDbConnected ? 'دیتابیس: متصل به Supabase' : 'دیتابیس: تنظیم Secret'}</span>
            </button>

            <div className="hidden md:flex items-center gap-2 text-xs text-slate-500 font-medium bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span>{todayJalali}</span>
            </div>

            {/* کنترل حساب کاربری */}
            <UserMenu onOpenLogin={onOpenLogin} />
          </div>

        </div>

        {/* نوار ناوبری اصلی تب‌ها */}
        <div className="flex items-center justify-between overflow-x-auto pb-2 pt-1 border-t border-slate-100 no-scrollbar gap-2">
          
          {/* تب‌های تجاری اصلی */}
          <nav className="flex items-center gap-1">
            {mainTabs.map((tab) => {
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
          </nav>

          {/* منوی کشویی ابزارهای فنی و دیتابیس */}
          <div className="relative shrink-0" ref={dropdownRef}>
            <button
              onClick={() => setIsToolsDropdownOpen(!isToolsDropdownOpen)}
              className={`whitespace-nowrap px-3 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 border ${
                isCurrentTabInTools
                  ? 'bg-emerald-50 text-emerald-900 border-emerald-300'
                  : 'bg-slate-50 text-slate-600 hover:text-slate-900 border-slate-200 hover:bg-slate-100'
              }`}
            >
              <Database className="w-3.5 h-3.5 text-slate-500" />
              <span>تنظیمات پایگاه‌داده و ابزارها</span>
              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isToolsDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {isToolsDropdownOpen && (
              <div className="absolute left-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-slate-200 py-1.5 z-50 animate-in fade-in zoom-in-95 duration-150">
                <div className="px-3 py-2 text-[11px] font-bold text-slate-400 border-b border-slate-100">
                  ابزارهای سیستمی و یکپارچگی داده
                </div>
                {systemTools.map(tool => {
                  const ToolIcon = tool.icon;
                  const isToolActive = activeTab === tool.id;
                  return (
                    <button
                      key={tool.id}
                      onClick={() => {
                        setActiveTab(tool.id);
                        setIsToolsDropdownOpen(false);
                      }}
                      className={`w-full text-right px-3.5 py-2.5 text-xs font-medium flex items-center gap-2.5 transition-colors ${
                        isToolActive
                          ? 'bg-slate-900 text-white font-bold'
                          : 'text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <ToolIcon className={`w-4 h-4 ${isToolActive ? 'text-emerald-400' : 'text-slate-400'}`} />
                      <span>{tool.label}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

        </div>

      </div>
    </header>
  );
};
