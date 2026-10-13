import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { LoginScreen } from './components/auth/LoginScreen';
import { AuthenticatedDashboard } from './components/dashboard/AuthenticatedDashboard';
import { CooperativeManager } from './components/cooperatives/CooperativeManager';
import { MemberManager } from './components/members/MemberManager';
import { UnitManager } from './components/units/UnitManager';
import { InstallmentPlanManager } from './components/installments/InstallmentPlanManager';
import { MonthlyFeeManager } from './components/fees/MonthlyFeeManager';
import { PaymentManager } from './components/payments/PaymentManager';
import { SupabaseManager } from './components/database/SupabaseManager';
import { FinancialGroqDashboard } from './components/ai/FinancialGroqDashboard';
import { RecycleBinManager } from './components/recycle/RecycleBinManager';
import { SystemDocsViewer } from './components/docs/SystemDocsViewer';
import { AuditLogManager } from './components/logs/AuditLogManager';
import { Building2, ShieldCheck } from 'lucide-react';

function MainAppContent() {
  const { isAuthenticated, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<string>('dashboard');

  // اگر کاربر لاگین نکرده باشد، منحصراً صفحه ورود امن با شماره همراه و شبیه‌ساز پیامک نمایش داده می‌شود
  if (!isAuthenticated) {
    return <LoginScreen />;
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-['Vazirmatn',sans-serif]">
      {/* نوار ناوبری اصلی */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenLogin={() => {}}
      />

      {/* بخش اصلی محتوای عملیاتی سامانه */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'dashboard' && <AuthenticatedDashboard />}
        {activeTab === 'payments' && <PaymentManager />}
        {activeTab === 'monthlyFees' && <MonthlyFeeManager />}
        {activeTab === 'installments' && <InstallmentPlanManager />}
        {activeTab === 'units' && <UnitManager />}
        {activeTab === 'members' && <MemberManager />}
        {activeTab === 'cooperatives' && <CooperativeManager />}
        {activeTab === 'logs' && <AuditLogManager />}
        {activeTab === 'aiDashboard' && <FinancialGroqDashboard />}
        {activeTab === 'recycleBin' && <RecycleBinManager />}
        {activeTab === 'docs' && <SystemDocsViewer />}
        {activeTab === 'supabase' && <SupabaseManager />}
      </main>

      {/* پاورقی پروداکشن */}
      <footer className="bg-white border-t border-slate-200 mt-16 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-slate-900 text-emerald-400 flex items-center justify-center">
                <Building2 className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-sm font-black text-slate-900">مسکن‌یار</h4>
                <p className="text-xs text-slate-500">
                  سامانه مدیریت یکپارچه مالی و حقوقی تعاونی‌های مسکن کشور
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-6 text-xs text-slate-600 font-medium">
              <span className="flex items-center gap-1.5 text-emerald-700">
                <ShieldCheck className="w-4 h-4" />
                <span>تفکیک چندمستأجری و ثبت امن لاگ‌های حسابرسی</span>
              </span>
              <span>•</span>
              <span>پایگاه داده رابطه‌ای PostgreSQL</span>
              <span>•</span>
              <span>تراز مالی و تسویه شتابی شاپرک</span>
            </div>

          </div>

          <div className="mt-6 pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400 font-normal">
            <div>
              تمامی حقوق مادی و معنوی برای تعاونی‌های مسکن عضو سامانه مسکن‌یار محفوظ است.
            </div>
            <div className="dir-ltr text-[11px] font-mono">
              v5.0.0 • Production Release
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainAppContent />
    </AuthProvider>
  );
}
