import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Cooperative, Membership, UserRole, AuditLog } from '../types/database';
import { 
  seedUsers, 
  seedCooperatives, 
  seedMemberships, 
  seedAuditLogs 
} from '../data/seedData';
import { isValidIranianMobile } from '../utils/persian';

interface AuthSession {
  user: User;
  memberships: Membership[];
  activeMembership: Membership | null;
  activeCooperative: Cooperative | null;
  activeRole: UserRole;
  isGlobalSuperAdmin: boolean;
  token: string;
}

interface AuthContextType {
  session: AuthSession | null;
  isAuthenticated: boolean;
  otpSentToMobile: string | null;
  simulatedOtpCode: string | null;
  otpExpiresAt: number | null;
  isLoading: boolean;
  error: string | null;
  requestOtp: (mobile: string) => Promise<{ success: boolean; message: string; code?: string }>;
  verifyOtp: (mobile: string, code: string) => Promise<{ success: boolean; message: string }>;
  switchTenant: (cooperativeId: string | null) => void;
  logout: () => void;
  quickLoginAs: (userId: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const STORAGE_KEY = 'maskanyar_auth_session';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [otpSentToMobile, setOtpSentToMobile] = useState<string | null>(null);
  const [simulatedOtpCode, setSimulatedOtpCode] = useState<string | null>(null);
  const [otpExpiresAt, setOtpExpiresAt] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // بازیابی سشن ذخیره شده از localStorage در هنگام بارگذاری
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        // بررسی معتبر بودن کاربر
        const userExists = seedUsers.find(u => u.id === parsed.user.id);
        if (userExists) {
          setSession(parsed);
        } else {
          localStorage.removeItem(STORAGE_KEY);
        }
      }
    } catch {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  // ذخیره سشن در localStorage
  const saveSession = (newSession: AuthSession | null) => {
    setSession(newSession);
    if (newSession) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newSession));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  };

  // درخواست ارسال کد یکبار مصرف پیامکی
  const requestOtp = async (mobile: string): Promise<{ success: boolean; message: string; code?: string }> => {
    setIsLoading(true);
    setError(null);

    // تاخیر شبیه‌سازی شبکه
    await new Promise(resolve => setTimeout(resolve, 600));

    // اعتبارسنجی شماره موبایل
    if (!isValidIranianMobile(mobile)) {
      setIsLoading(false);
      const errMsg = 'شماره موبایل وارد شده نامعتبر است. فرمت صحیح: ۰۹۱۲۳۴۵۶۷۸۹';
      setError(errMsg);
      return { success: false, message: errMsg };
    }

    // تولید کد تصادفی ۵ رقمی (برای تست، اگر شماره در سید باشد یک کد مشخص‌تر هم می‌توان داد)
    const code = Math.floor(10000 + Math.random() * 90000).toString();
    const expiresAt = Date.now() + 120 * 1000; // ۲ دقیقه اعتبار

    setOtpSentToMobile(mobile);
    setSimulatedOtpCode(code);
    setOtpExpiresAt(expiresAt);
    setIsLoading(false);

    return {
      success: true,
      message: `کد تایید با موفقیت برای شماره ${mobile} پیامک شد.`,
      code
    };
  };

  // تایید کد پیامکی و ساخت نشست چندمستأجری
  const verifyOtp = async (mobile: string, code: string): Promise<{ success: boolean; message: string }> => {
    setIsLoading(true);
    setError(null);

    await new Promise(resolve => setTimeout(resolve, 500));

    if (!otpSentToMobile || otpSentToMobile !== mobile) {
      setIsLoading(false);
      const msg = 'ابتدا شماره موبایل خود را وارد کرده و درخواست کد نمایید.';
      setError(msg);
      return { success: false, message: msg };
    }

    if (otpExpiresAt && Date.now() > otpExpiresAt) {
      setIsLoading(false);
      const msg = 'کد تایید منقضی شده است. لطفاً مجدداً درخواست ارسال کد نمایید.';
      setError(msg);
      return { success: false, message: msg };
    }

    // بررسی صحت کد پیامکی (کد شبیه‌سازی‌شده یا کد عمومی مستر 12345 برای راحتی تست)
    if (code !== simulatedOtpCode && code !== '12345') {
      setIsLoading(false);
      const msg = 'کد وارد شده صحیح نمی‌باشد. لطفاً مجدداً بررسی فرمایید.';
      setError(msg);
      return { success: false, message: msg };
    }

    // یافتن کاربر در دیتابیس
    const user = seedUsers.find(u => u.mobile === mobile);
    if (!user) {
      setIsLoading(false);
      const msg = 'کاربری با این شماره موبایل در سیستم ثبت نشده است. با مدیر تعاونی تماس بگیرید.';
      setError(msg);
      return { success: false, message: msg };
    }

    // استخراج کلیه عضویت‌ها و نقش‌های کاربر
    const userMemberships = seedMemberships.filter(m => m.userId === user.id && m.isActive);
    const isSuperAdmin = userMemberships.some(m => m.role === 'SUPER_ADMIN') || user.id === 'user-superadmin';

    // تعیین تعاونی پیش‌فرض و نقش اولیه
    let initialMembership: Membership | null = null;
    let initialCooperative: Cooperative | null = null;
    let initialRole: UserRole = 'MEMBER';

    if (isSuperAdmin) {
      initialRole = 'SUPER_ADMIN';
      initialMembership = userMemberships[0] || null;
      initialCooperative = null; // مدیر کل در حالت کلی همه را می‌بیند
    } else if (userMemberships.length > 0) {
      initialMembership = userMemberships[0];
      initialRole = initialMembership.role;
      initialCooperative = seedCooperatives.find(c => c.id === initialMembership!.cooperativeId) || null;
    }

    const newSession: AuthSession = {
      user,
      memberships: userMemberships,
      activeMembership: initialMembership,
      activeCooperative: initialCooperative,
      activeRole: initialRole,
      isGlobalSuperAdmin: isSuperAdmin,
      token: `msk_jwt_${user.id}_${Date.now()}`
    };

    saveSession(newSession);

    // ثبت لاگ امنیتی در audit_logs
    const newLog: AuditLog = {
      id: `log-login-${Date.now()}`,
      cooperativeId: initialCooperative?.id || null,
      userId: user.id,
      userFullName: user.fullName,
      userRole: initialRole,
      action: 'LOGIN_OTP',
      entityType: 'USER',
      entityId: user.id,
      description: `ورود موفق کاربر با رمز یکبارمصرف پیامکی (OTP) با نقش ${initialRole}`,
      ipAddress: '188.253.30.12',
      timestamp: new Date().toISOString()
    };
    seedAuditLogs.unshift(newLog);

    // پاکسازی وضعیت OTP
    setOtpSentToMobile(null);
    setSimulatedOtpCode(null);
    setOtpExpiresAt(null);
    setIsLoading(false);

    return { success: true, message: 'ورود موفقیت‌آمیز بود.' };
  };

  // تغییر تعاونی یا نقش فعال در نشست چندمستأجری (Tenant Switching)
  const switchTenant = (cooperativeId: string | null) => {
    if (!session) return;

    if (cooperativeId === null && session.isGlobalSuperAdmin) {
      // مدیر کل به حالت دید سراسری برمی‌گردد
      const updated: AuthSession = {
        ...session,
        activeCooperative: null,
        activeRole: 'SUPER_ADMIN',
        activeMembership: session.memberships[0] || null
      };
      saveSession(updated);
      return;
    }

    const targetCoop = seedCooperatives.find(c => c.id === cooperativeId);
    if (!targetCoop) return;

    // بررسی دسترسی کاربر به این تعاونی
    if (session.isGlobalSuperAdmin) {
      const updated: AuthSession = {
        ...session,
        activeCooperative: targetCoop,
        activeRole: 'SUPER_ADMIN',
      };
      saveSession(updated);
      return;
    }

    const membershipInCoop = session.memberships.find(m => m.cooperativeId === cooperativeId);
    if (!membershipInCoop) {
      setError('شما عضویت فعالی در این تعاونی مسکن ندارید.');
      return;
    }

    const updated: AuthSession = {
      ...session,
      activeCooperative: targetCoop,
      activeMembership: membershipInCoop,
      activeRole: membershipInCoop.role
    };
    saveSession(updated);
  };

  // خروج از حساب کاربری
  const logout = () => {
    saveSession(null);
    setOtpSentToMobile(null);
    setSimulatedOtpCode(null);
    setOtpExpiresAt(null);
    setError(null);
  };

  // لاگین سریع با یک کلیک جهت تست و ارزیابی آسان توسط کاربر
  const quickLoginAs = (userId: string) => {
    const user = seedUsers.find(u => u.id === userId);
    if (!user) return;

    const userMemberships = seedMemberships.filter(m => m.userId === user.id && m.isActive);
    const isSuperAdmin = userMemberships.some(m => m.role === 'SUPER_ADMIN') || user.id === 'user-superadmin';

    let initialMembership: Membership | null = null;
    let initialCooperative: Cooperative | null = null;
    let initialRole: UserRole = 'MEMBER';

    if (isSuperAdmin) {
      initialRole = 'SUPER_ADMIN';
      initialMembership = userMemberships[0] || null;
      initialCooperative = null;
    } else if (userMemberships.length > 0) {
      initialMembership = userMemberships[0];
      initialRole = initialMembership.role;
      initialCooperative = seedCooperatives.find(c => c.id === initialMembership!.cooperativeId) || null;
    }

    const newSession: AuthSession = {
      user,
      memberships: userMemberships,
      activeMembership: initialMembership,
      activeCooperative: initialCooperative,
      activeRole: initialRole,
      isGlobalSuperAdmin: isSuperAdmin,
      token: `msk_quick_${user.id}_${Date.now()}`
    };

    saveSession(newSession);

    // ثبت لاگ
    const newLog: AuditLog = {
      id: `log-login-${Date.now()}`,
      cooperativeId: initialCooperative?.id || null,
      userId: user.id,
      userFullName: user.fullName,
      userRole: initialRole,
      action: 'LOGIN_OTP',
      entityType: 'USER',
      entityId: user.id,
      description: `ورود تستی سریع با نقش ${initialRole}`,
      ipAddress: '127.0.0.1',
      timestamp: new Date().toISOString()
    };
    seedAuditLogs.unshift(newLog);
  };

  return (
    <AuthContext.Provider
      value={{
        session,
        isAuthenticated: !!session,
        otpSentToMobile,
        simulatedOtpCode,
        otpExpiresAt,
        isLoading,
        error,
        requestOtp,
        verifyOtp,
        switchTenant,
        logout,
        quickLoginAs
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
