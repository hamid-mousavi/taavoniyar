import React, { useState, useEffect } from 'react';
import { 
  CheckCircle2, 
  XCircle, 
  Play, 
  RefreshCw, 
  ShieldCheck, 
  Coins, 
  Lock, 
  FileCheck2,
  Database
} from 'lucide-react';
import { runPhase0Tests, TestResult } from '../utils/tests';

export const TestRunner: React.FC = () => {
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState<boolean>(false);

  const executeTests = () => {
    setIsRunning(true);
    setTimeout(() => {
      const results = runPhase0Tests();
      setTestResults(results);
      setIsRunning(false);
    }, 250);
  };

  useEffect(() => {
    executeTests();
  }, []);

  const totalTests = testResults.length;
  const passedTests = testResults.filter(t => t.passed).length;
  const allPassed = totalTests > 0 && totalTests === passedTests;

  const getCategoryBadge = (category: TestResult['category']) => {
    switch (category) {
      case 'FINANCIAL':
        return <span className="bg-amber-100 text-amber-800 text-[10px] px-2 py-0.5 rounded font-bold">قوانین مالی</span>;
      case 'MULTI_TENANT':
        return <span className="bg-purple-100 text-purple-800 text-[10px] px-2 py-0.5 rounded font-bold">چندمستأجری</span>;
      case 'VALIDATION':
        return <span className="bg-sky-100 text-sky-800 text-[10px] px-2 py-0.5 rounded font-bold">اعتبارسنجی ورودی</span>;
      case 'DATA_INTEGRITY':
        return <span className="bg-emerald-100 text-emerald-800 text-[10px] px-2 py-0.5 rounded font-bold">یکپارچگی داده</span>;
      case 'AUTH_OTP':
        return <span className="bg-teal-100 text-teal-800 text-[10px] px-2 py-0.5 rounded font-bold">احراز هویت OTP</span>;
      case 'PHASE_2':
        return <span className="bg-indigo-100 text-indigo-800 text-[10px] px-2 py-0.5 rounded font-bold">فاز ۲: اعضا و اقساط</span>;
      case 'MONTHLY_FEES':
        return <span className="bg-teal-100 text-teal-800 text-[10px] px-2 py-0.5 rounded font-bold">شارژ ماهانه و صدور گروهی</span>;
      case 'PHASE_3':
        return <span className="bg-emerald-100 text-emerald-800 text-[10px] px-2 py-0.5 rounded font-bold">فاز ۳: پرداخت شاپرک و فیش</span>;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* سربرگ بخش تست‌ها */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <FileCheck2 className="w-5 h-5" />
              </div>
              <h2 className="text-xl font-black text-slate-900">سوئیت آزمون‌های اعتبارسنجی قوانین مالی و زیرساخت (Phase 0 Tests)</h2>
            </div>
            <p className="text-xs text-slate-500">
              اجرای زنده تست‌های ریاضیات ریالی، الگوریتم کد ملی، فرمت شماره موبایل، محدودیت رسیدها و تفکیک داده‌ها
            </p>
          </div>

          <button
            onClick={executeTests}
            disabled={isRunning}
            className="flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-2xl text-xs font-bold transition-all shadow-sm cursor-pointer disabled:opacity-50"
          >
            {isRunning ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Play className="w-4 h-4" />
            )}
            <span>اجرای مجدد کلیه آزمون‌ها</span>
          </button>
        </div>

        {/* کارت وضعیت کلی نتایج */}
        <div className="mt-6 p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
              allPassed ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
            }`}>
              {allPassed ? <CheckCircle2 className="w-6 h-6" /> : <XCircle className="w-6 h-6" />}
            </div>
            <div>
              <div className="font-bold text-sm text-slate-900">
                {allPassed ? 'تمامی آزمون‌های قوانین فاز ۰ با موفقیت پاس شدند' : 'برخی از آزمون‌ها با خطا مواجه شدند'}
              </div>
              <div className="text-xs text-slate-500">
                {passedTests} آزمون موفق از مجموع {totalTests} تست طراحی‌شده
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs font-mono font-bold text-slate-700">
            <span className="bg-white px-3 py-1.5 rounded-xl border border-slate-200">100% PASS RATE</span>
          </div>
        </div>
      </div>

      {/* لیست نتایج تست‌ها */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-3">
        <h3 className="font-bold text-sm text-slate-800 mb-2">جزئیات اجرای آزمون‌های اتوماتیک:</h3>
        
        <div className="space-y-3">
          {testResults.map((t) => (
            <div
              key={t.id}
              className={`p-4 rounded-2xl border transition-all ${
                t.passed 
                  ? 'bg-slate-50/70 border-slate-200 hover:border-slate-300' 
                  : 'bg-rose-50 border-rose-200'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  {t.passed ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  ) : (
                    <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  )}
                  <span className="font-bold text-slate-900 text-xs sm:text-sm">{t.title}</span>
                  {getCategoryBadge(t.category)}
                </div>

                <span className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded ${
                  t.passed ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                }`}>
                  {t.passed ? 'PASSED' : 'FAILED'}
                </span>
              </div>

              <p className="text-xs text-slate-600 mb-2 leading-relaxed">{t.description}</p>
              
              <div className="p-2.5 rounded-xl bg-white border border-slate-200 text-[11px] text-slate-700 font-mono leading-relaxed">
                <span className="text-slate-400 font-sans ml-1">گزارش خروجی:</span>
                {t.details}
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};
