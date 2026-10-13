import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  BrainCircuit, 
  TrendingUp, 
  AlertTriangle, 
  ShieldAlert, 
  CheckCircle2, 
  RefreshCw, 
  Key, 
  Layers, 
  Coins, 
  CalendarDays, 
  Users, 
  FileText, 
  Printer, 
  Copy, 
  Check, 
  ArrowUpRight,
  PieChart,
  Lightbulb,
  ExternalLink,
  Lock,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { dataService } from '../../services/dataService';
import { formatRial, formatToman, toPersianDigits } from '../../utils/persian';

interface AiAnalysisResult {
  healthScore: number;
  riskLevel: 'کم' | 'متوسط' | 'بالا' | 'بحرانی';
  executiveSummary: string;
  cashflowAnalysis: string;
  overdueRiskAssessment: string;
  strategicRecommendations: string[];
  budgetForecast: string;
}

export const FinancialGroqDashboard: React.FC = () => {
  const { session } = useAuth();
  const [groqConfigured, setGroqConfigured] = useState<boolean>(false);
  const [groqSource, setGroqSource] = useState<string>('');
  const [fallbackKey, setFallbackKey] = useState<string>('');
  const [selectedModel, setSelectedModel] = useState<string>('llama-3.3-70b-versatile');
  const [customPrompt, setCustomPrompt] = useState<string>('');

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [analysisResult, setAnalysisResult] = useState<AiAnalysisResult | null>(null);
  const [copied, setCopied] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [latencyMs, setLatencyMs] = useState<number | null>(null);

  // واکشی آمار مالی تعاونی فعال
  const allCoops = dataService.getAllCooperatives();
  const activeCoop = session?.activeCooperative || allCoops[0];
  const coopId = activeCoop?.id || null;

  const installmentPlans = dataService.getInstallmentPlans(coopId, false);
  const installmentItems = dataService.getAllInstallmentItems(coopId, false);
  const monthlyFees = dataService.getMonthlyFees(coopId, false);
  const members = dataService.getMembers(coopId, false);

  const totalContractRial = installmentPlans.reduce((sum, p) => sum + p.totalCostRial, 0);
  const totalCollectedRial = installmentItems.reduce((sum, i) => sum + i.paidAmountRial, 0);
  const totalOverdueItems = installmentItems.filter(i => i.status === 'OVERDUE' || (new Date(i.dueDate) < new Date() && i.status === 'PENDING'));
  const totalOverdueRial = totalOverdueItems.reduce((sum, i) => sum + (i.amountRial - i.paidAmountRial), 0);

  const monthlyFeeCollectedRial = monthlyFees.filter(f => f.status === 'PAID').reduce((sum, f) => sum + f.paidAmountRial, 0);
  const monthlyFeeOverdueRial = monthlyFees.filter(f => f.status === 'PENDING').reduce((sum, f) => sum + f.amountRial, 0);

  const overdueMemberIds = new Set([
    ...totalOverdueItems.map(i => {
      const plan = installmentPlans.find(p => p.id === i.planId);
      return plan?.memberId;
    }).filter(Boolean),
    ...monthlyFees.filter(f => f.status === 'PENDING').map(f => f.memberId)
  ]);

  // بررسی وضعیت کلید Groq از سرور و لوکال
  useEffect(() => {
    fetch('/api/ai/groq-status')
      .then(res => res.json())
      .then(data => {
        setGroqConfigured(data.configured);
        setGroqSource(data.source);
      })
      .catch(() => {});

    const saved = localStorage.getItem('maskanyar_groq_fallback_key');
    if (saved) {
      setFallbackKey(saved);
    }
  }, []);

  const handleSaveFallbackKey = (val: string) => {
    setFallbackKey(val);
    if (val.trim()) {
      localStorage.setItem('maskanyar_groq_fallback_key', val.trim());
    } else {
      localStorage.removeItem('maskanyar_groq_fallback_key');
    }
  };

  const handleRunAnalysis = async () => {
    setIsLoading(true);
    setError(null);
    const start = performance.now();

    try {
      const res = await fetch('/api/ai/financial-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cooperativeName: activeCoop?.name,
          financialStats: {
            totalContractRial,
            totalCollectedRial,
            totalOverdueRial,
            monthlyFeeCollectedRial,
            monthlyFeeOverdueRial,
            membersCount: members.length,
            overdueMembersCount: overdueMemberIds.size
          },
          customPrompt,
          groqApiKey: fallbackKey,
          model: selectedModel
        })
      });

      const json = await res.json();
      setLatencyMs(Math.round(performance.now() - start));

      if (!json.success) {
        throw new Error(json.message || 'خطا در دریافت تحلیل هوش مصنوعی');
      }

      setAnalysisResult(json.data);
    } catch (err: any) {
      setError(err.message || 'خطا در برقراری ارتباط با سرور تحلیل هوش مصنوعی');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyReport = () => {
    if (!analysisResult) return;
    const text = `گزارش تحلیل مالی هوشمند تعاونی مسکن ${activeCoop?.name || ''}
امتیاز سلامت مالی: ${analysisResult.healthScore} از ۱۰۰ (${analysisResult.riskLevel})

خلاصه اجرایی:
${analysisResult.executiveSummary}

تحلیل جریان نقدی:
${analysisResult.cashflowAnalysis}

ارزیابی ریسک معوقات:
${analysisResult.overdueRiskAssessment}

توصیه‌های راهبردی:
${analysisResult.strategicRecommendations.map((r, i) => `${i + 1}. ${r}`).join('\n')}

پیش‌بینی ۶ ماه آینده:
${analysisResult.budgetForecast}
`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  const getHealthColor = (score: number) => {
    if (score >= 80) return 'text-emerald-700 bg-emerald-50 border-emerald-300';
    if (score >= 60) return 'text-blue-700 bg-blue-50 border-blue-300';
    if (score >= 40) return 'text-amber-700 bg-amber-50 border-amber-300';
    return 'text-rose-700 bg-rose-50 border-rose-300';
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* سربرگ داشبورد هوشمند */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <BrainCircuit className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-900">داشبورد هوشمند مالی تعاونی (Groq AI)</h2>
              <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                <span>تعاونی: {activeCoop?.name}</span>
                <span>•</span>
                <span>پروژه: {activeCoop?.projectName}</span>
              </div>
            </div>
          </div>
        </div>

        {/* وضعیت اتصال به کلید Groq */}
        <div className="flex items-center gap-2">
          {groqConfigured ? (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>کلید Groq در Secrets فعال است</span>
            </div>
          ) : fallbackKey ? (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-800 text-xs font-bold">
              <Key className="w-4 h-4 text-blue-600" />
              <span>کلید Groq در تنظیمات مرورگر فعال است</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-bold">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              <span>کلید GROQ_API_KEY تنظیم نشده</span>
            </div>
          )}
        </div>
      </div>

      {/* کارت‌های شاخص‌های مالی پروژه */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-1">
          <div className="text-xs text-slate-500 font-medium">کل تعهدات ساخت واحدها</div>
          <div className="text-base font-black font-mono text-slate-900">{formatRial(totalContractRial)}</div>
          <div className="text-[11px] text-slate-400 font-sans">{formatToman(totalContractRial)}</div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-1">
          <div className="text-xs text-slate-500 font-medium">مجموع اقساط وصول‌شده</div>
          <div className="text-base font-black font-mono text-emerald-700">{formatRial(totalCollectedRial)}</div>
          <div className="text-[11px] text-slate-400 font-sans">{formatToman(totalCollectedRial)}</div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-1">
          <div className="text-xs text-slate-500 font-medium">معوقات سررسید گذشته اقساط</div>
          <div className="text-base font-black font-mono text-rose-600">{formatRial(totalOverdueRial)}</div>
          <div className="text-[11px] text-slate-400 font-sans">
            {toPersianDigits(overdueMemberIds.size)} عضو دارای معوقه
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-1">
          <div className="text-xs text-slate-500 font-medium">شارژ و هزینه‌های جاری</div>
          <div className="text-base font-black font-mono text-teal-700">{formatRial(monthlyFeeCollectedRial)}</div>
          <div className="text-[11px] text-amber-600 font-sans">
            معوق جاری: {formatToman(monthlyFeeOverdueRial)}
          </div>
        </div>
      </div>

      {/* پنل تنظیمات کلید و دستور تحلیل */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
        
        {/* کادر ورود کلید پشتیبان در صورت عدم تنظیم در سکرت‌ها */}
        {!groqConfigured && (
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-slate-800">
              <span className="flex items-center gap-1.5">
                <Key className="w-4 h-4 text-amber-600" />
                <span>تنظیم کلید پشتیبان Groq API (Fallback Key)</span>
              </span>
              <a 
                href="https://console.groq.com/keys" 
                target="_blank" 
                rel="noreferrer" 
                className="text-emerald-700 hover:underline flex items-center gap-1 text-[11px]"
              >
                <span>دریافت رایگان کلید از Groq Console</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            <input
              type="password"
              placeholder="gsk_..."
              value={fallbackKey}
              onChange={(e) => handleSaveFallbackKey(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-slate-300 bg-white font-mono text-xs outline-none focus:border-purple-600"
            />
            <span className="text-[10px] text-slate-500 block">
              نکته: برای امنیت پایدار، می‌توانید متغیر <code>GROQ_API_KEY</code> را مستقیماً در پنل Secrets تعریف کنید.
            </span>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="space-y-1">
            <label className="font-bold text-slate-700">مدل استنتاج هوش مصنوعی Groq:</label>
            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-slate-300 bg-white font-mono outline-none"
            >
              <option value="llama-3.3-70b-versatile">Llama 3.3 70B Versatile (دقیق‌ترین تحلیل سازمانی)</option>
              <option value="llama-3.1-8b-instant">Llama 3.1 8B Instant (فوق سریع و بلادرنگ)</option>
            </select>
          </div>

          <div className="sm:col-span-2 space-y-1">
            <label className="font-bold text-slate-700">سوال یا تمرکز ویژه تحلیلی (اختیاری):</label>
            <input
              type="text"
              placeholder="مثال: راهکار کنترل تاخیر در اقساط سفت‌کاری و پیش‌بینی بودجه انشعابات"
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-slate-300 bg-white outline-none"
            />
          </div>
        </div>

        <div className="pt-2 flex items-center justify-between border-t border-slate-100">
          <div className="text-xs text-slate-500">
            {latencyMs !== null && (
              <span>زمان پردازش استنتاج Groq: <strong className="font-mono text-purple-700">{latencyMs} میلی‌ثانیه</strong></span>
            )}
          </div>

          <button
            onClick={handleRunAnalysis}
            disabled={isLoading || (!groqConfigured && !fallbackKey.trim())}
            className="flex items-center gap-2 bg-purple-700 hover:bg-purple-800 disabled:opacity-50 text-white px-6 py-2.5 rounded-2xl text-xs font-bold transition-all shadow-sm cursor-pointer"
          >
            {isLoading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin text-purple-200" />
                <span>در حال تحلیل جریان نقدی با Groq AI...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-amber-300" />
                <span>اجرای تحلیل هوشمند مالی پروژه</span>
              </>
            )}
          </button>
        </div>

        {error && (
          <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </div>

      {/* نتایج گزارش تحلیل هوشمند */}
      {analysisResult && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6 animate-in fade-in duration-300">
          
          {/* نوار امتیاز و ابزارها */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-6">
            <div className="flex items-center gap-4">
              <div className={`px-4 py-3 rounded-2xl border text-center ${getHealthColor(analysisResult.healthScore)}`}>
                <div className="text-2xl font-black font-mono">{toPersianDigits(analysisResult.healthScore)}</div>
                <div className="text-[10px] font-bold">شاخص سلامت مالی (از ۱۰۰)</div>
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-900 text-base">سطح ریسک نقدینگی:</span>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                    analysisResult.riskLevel === 'کم' ? 'bg-emerald-100 text-emerald-800' :
                    analysisResult.riskLevel === 'متوسط' ? 'bg-blue-100 text-blue-800' :
                    analysisResult.riskLevel === 'بالا' ? 'bg-amber-100 text-amber-800' :
                    'bg-rose-100 text-rose-800'
                  }`}>
                    {analysisResult.riskLevel}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  تولید شده توسط مدل {selectedModel} در محیط فوق سریع Groq Cloud
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleCopyReport}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-bold cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'کپی شد' : 'کپی گزارش'}</span>
              </button>

              <button
                onClick={() => window.print()}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold cursor-pointer shadow-xs"
              >
                <Printer className="w-3.5 h-3.5 text-emerald-400" />
                <span>چاپ نسخه مجمع</span>
              </button>
            </div>
          </div>

          {/* خلاصه مدیریتی */}
          <div className="p-4 rounded-2xl bg-purple-50/60 border border-purple-100 space-y-1.5">
            <h4 className="font-bold text-purple-900 text-xs flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-purple-700" />
              <span>خلاصه اجرایی وضعیت مالی (Executive Summary)</span>
            </h4>
            <p className="text-xs text-slate-700 leading-relaxed">
              {analysisResult.executiveSummary}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* تحلیل جریان نقدینگی */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
              <h4 className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4 text-emerald-600" />
                <span>تحلیل جریان نقدی و تراز دریافتی‌ها</span>
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                {analysisResult.cashflowAnalysis}
              </p>
            </div>

            {/* ارزیابی ریسک معوقات */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
              <h4 className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <span>ارزیابی ریسک معوقات اعضا و اقساط</span>
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                {analysisResult.overdueRiskAssessment}
              </p>
            </div>
          </div>

          {/* توصیه‌های راهبردی هیئت مدیره */}
          <div className="space-y-3">
            <h4 className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
              <Lightbulb className="w-4 h-4 text-amber-500" />
              <span>اقدامات و توصیه‌های کلیدی پیشنهادی هوش مصنوعی برای هیئت مدیره:</span>
            </h4>
            <div className="space-y-2">
              {analysisResult.strategicRecommendations.map((rec, idx) => (
                <div key={idx} className="p-3 bg-white rounded-2xl border border-slate-200 flex items-start gap-2.5 text-xs text-slate-800">
                  <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 font-bold font-mono text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                    {toPersianDigits(idx + 1)}
                  </span>
                  <span className="leading-relaxed">{rec}</span>
                </div>
              ))}
            </div>
          </div>

          {/* پیش‌بینی بودجه ۶ ماه آینده */}
          <div className="p-4 rounded-2xl bg-emerald-50/50 border border-emerald-100 space-y-1.5">
            <h4 className="font-bold text-emerald-900 text-xs flex items-center gap-1.5">
              <CalendarDays className="w-4 h-4 text-emerald-700" />
              <span>پیش‌بینی بودجه و نقدینگی دوره ۶ ماه آینده</span>
            </h4>
            <p className="text-xs text-slate-700 leading-relaxed">
              {analysisResult.budgetForecast}
            </p>
          </div>

        </div>
      )}

    </div>
  );
};
