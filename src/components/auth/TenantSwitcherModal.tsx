import React from 'react';
import { Building2, Check, Globe, Shield, X, ArrowLeft } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { seedCooperatives } from '../../data/seedData';
import { toPersianDigits } from '../../utils/persian';

interface TenantSwitcherModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TenantSwitcherModal: React.FC<TenantSwitcherModalProps> = ({ isOpen, onClose }) => {
  const { session, switchTenant } = useAuth();

  if (!isOpen || !session) return null;

  const handleSelect = (coopId: string | null) => {
    switchTenant(coopId);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-slate-200 overflow-hidden relative">
        
        {/* سربرگ */}
        <div className="p-6 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base">انتخاب تعاونی و کانتکست فعال (Tenant)</h3>
              <p className="text-xs text-slate-400">تغییر محیط کاری و پروژه‌های تحت مدیریت</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* لیست تعاونی‌های قابل انتخاب */}
        <div className="p-6 space-y-3 max-h-[70vh] overflow-y-auto">
          
          {/* گزینه دید فراگیر برای مدیر کل */}
          {session.isGlobalSuperAdmin && (
            <button
              onClick={() => handleSelect(null)}
              className={`w-full p-4 rounded-2xl border text-right transition-all cursor-pointer flex items-center justify-between ${
                session.activeCooperative === null
                  ? 'bg-purple-50 border-purple-300 ring-2 ring-purple-500/20 shadow-xs'
                  : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
              }`}
            >
              <div className="flex items-center gap-3.5">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  session.activeCooperative === null ? 'bg-purple-600 text-white' : 'bg-slate-200 text-slate-600'
                }`}>
                  <Globe className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-bold text-slate-900 text-sm">دید فراگیر سراسری (کلیه تعاونی‌ها)</div>
                  <div className="text-xs text-slate-500">نظارت بر هر ۳ تعاونی، گزارش‌های کلان و بخشنامه‌ها</div>
                </div>
              </div>
              {session.activeCooperative === null && (
                <span className="w-6 h-6 rounded-full bg-purple-600 text-white flex items-center justify-center">
                  <Check className="w-3.5 h-3.5" />
                </span>
              )}
            </button>
          )}

          {/* تعاونی‌های اختصاصی */}
          {seedCooperatives.map((coop) => {
            const isSelected = session.activeCooperative?.id === coop.id;
            // بررسی اینکه آیا کاربر عضو یا مدیر این تعاونی است (یا مدیر کل است)
            const hasAccess = session.isGlobalSuperAdmin || session.memberships.some(m => m.cooperativeId === coop.id);
            const userRoleInThisCoop = session.memberships.find(m => m.cooperativeId === coop.id)?.role || (session.isGlobalSuperAdmin ? 'SUPER_ADMIN' : null);

            return (
              <button
                key={coop.id}
                disabled={!hasAccess}
                onClick={() => handleSelect(coop.id)}
                className={`w-full p-4 rounded-2xl border text-right transition-all flex items-center justify-between ${
                  !hasAccess
                    ? 'opacity-40 bg-slate-100 border-slate-200 cursor-not-allowed'
                    : isSelected
                    ? 'bg-emerald-50 border-emerald-300 ring-2 ring-emerald-500/20 shadow-xs cursor-pointer'
                    : 'bg-white border-slate-200 hover:bg-slate-50 cursor-pointer'
                }`}
              >
                <div className="flex items-center gap-3.5">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    isSelected ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600'
                  }`}>
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-bold text-slate-900 text-sm">{coop.name}</div>
                    <div className="text-xs text-emerald-800 font-medium">پروژه: {coop.projectName}</div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      {toPersianDigits(coop.totalUnits)} واحد | نقش شما: {
                        userRoleInThisCoop === 'SUPER_ADMIN' ? 'مدیر کل' :
                        userRoleInThisCoop === 'COOP_ADMIN' ? 'مدیر تعاونی' :
                        userRoleInThisCoop === 'MEMBER' ? 'عضو' : 'فاقد دسترسی'
                      }
                    </div>
                  </div>
                </div>

                {isSelected && (
                  <span className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center">
                    <Check className="w-3.5 h-3.5" />
                  </span>
                )}
              </button>
            );
          })}

        </div>

      </div>
    </div>
  );
};
