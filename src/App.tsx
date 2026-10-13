import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { ArchitectureProposal } from './components/ArchitectureProposal';
import { ErdViewer } from './components/ErdViewer';
import { DatabaseBrowser } from './components/DatabaseBrowser';
import { MultiTenantSimulator } from './components/MultiTenantSimulator';
import { TestRunner } from './components/TestRunner';
import { SqlViewer } from './components/SqlViewer';
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
import { LoginModal } from './components/auth/LoginModal';
import { Building2, ShieldCheck, Database, CheckCircle2 } from 'lucide-react';

function MainAppContent() {
  const { isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [isLoginModalOpen, setIsLoginModalOpen] = useState<boolean>(false);

  // اگر کاربر لاگین کند، تب داشبورد فعال می‌شود
  useEffect(() => {
    if (isAuthenticated) {
      setActiveTab('dashboard');
    }
  }, [isAuthenticated]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-['Vazirmatn',sans-serif]">
      {/* نوار ناوبری پروداکشن */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenLogin={() => setIsLoginModalOpen(true)}
      />

      {/* بخش اصلی محتوا */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'dashboard' && <AuthenticatedDashboard />}
        {activeTab === 'payments' && <PaymentManager />}
        {activeTab === 'monthlyFees' && <MonthlyFeeManager />}
        {activeTab === 'installments' && <InstallmentPlanManager />}
        {activeTab === 'units' && <UnitManager />}
        {activeTab === 'members' && <MemberManager />}
        {activeTab === 'cooperatives' && <CooperativeManager />}
        {activeTab === 'aiDashboard' && <FinancialGroqDashboard />}
        {activeTab === 'recycleBin' && <RecycleBinManager />}
        {activeTab === 'docs' && <SystemDocsViewer />}
        {activeTab === 'supabase' && <SupabaseManager />}
        {activeTab === 'proposal' && <ArchitectureProposal />}
        {activeTab === 'erd' && <ErdViewer />}
        {activeTab === 'database' && <DatabaseBrowser />}
        {activeTab === 'simulator' && <MultiTenantSimulator />}
        {activeTab === 'tests' && <TestRunner />}
        {activeTab === 'sql' && <SqlViewer />}
      </main>

      {/* مودال ورود با OTP */}
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
      />

      {/* پاورقی پروداکشن تمیز و استاندارد */}
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
                  سامانه مدیریت یکپارچه و چندمستأجری تعاونی‌های مسکن کشور
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-6 text-xs text-slate-600 font-medium">
              <span className="flex items-center gap-1.5 text-emerald-700">
                <ShieldCheck className="w-4 h-4" />
                <span>رمزنگاری امن داده‌ها و تفکیک چندمستأجری</span>
              </span>
              <span>•</span>
              <span>پایگاه داده رابطه‌ای PostgreSQL</span>
              <span>•</span>
              <span>اتصال شتابی شاپرک</span>
            </div>

          </div>

          <div className="mt-6 pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400 font-normal">
            <div>
              تمامی حقوق مادی و معنوی برای تعاونی‌های مسکن عضو سامانه مسکن‌یار محفوظ است.
            </div>
            <div className="dir-ltr text-[11px] font-mono">
              v3.2.0 • Production Release
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
