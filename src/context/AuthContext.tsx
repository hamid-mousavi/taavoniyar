import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Cooperative, Membership, UserRole, AuditLog } from '../types/database';
import { dataService } from '../services/dataService';
import { isValidIranianMobile } from '../utils/persian';

export interface AuthSession {
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
  adminMobile: string;
  requestOtp: (mobile: string) => Promise<{ success: boolean; message: string; code?: string }>;
  verifyOtp: (mobile: string, code: string) => Promise<{ success: boolean; message: string }>;
  switchTenant: (cooperativeId: string | null) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const STORAGE_KEY = 'maskanyar_auth_session_v5';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [otpSentToMobile, setOtpSentToMobile] = useState<string | null>(null);
  const [simulatedOtpCode, setSimulatedOtpCode] = useState<string | null>(null);
  const [otpExpiresAt, setOtpExpiresAt] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [adminMobile, setAdminMobile] = useState<string>('09120000000');

  // واکشی مشخصات ادمین از سرور یا متغیرهای کلاینت
  useEffect(() => {
    fetch('/api/admin/info')
      .then(r => r.json())
      .then(d => {
        if (d.adminMobile) setAdminMobile(d.adminMobile);
      })
      .catch(() => {
        const envMob = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_ADMIN_MOBILE) || '09120000000';
        setAdminMobile(envMob);
      });
  }, []);

  // بازیابی سشن ذخیره شده از localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed: AuthSession = JSON.parse(saved);
        const users = dataService.getAllUsers();
        const userExists = users.find(u => u.id === parsed.user.id && !u.isDeleted);
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

  const saveSession = (newSession: AuthSession | null) => {
    setSession(newSession);
    if (newSession) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newSession));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  };

  // درخواست کد یکبار مصرف پیامکی
  const requestOtp = async (mobileInput: string): Promise<{ success: boolean; message: string; code?: string }> => {
    setIsLoading(true);
    setError(null);

    await new Promise(resolve => setTimeout(resolve, 500));

    const cleanMobile = mobileInput.replace(/[۰-۹]/g, d => String(d.charCodeAt(0) - 1776)).trim();

    if (!isValidIranianMobile(cleanMobile)) {
      setIsLoading(false);
      const errMsg = 'شماره موبایل وارد شده نامعتبر است. فرمت صحیح: ۰۹۱۲۳۴۵۶۷۸۹';
      setError(errMsg);
      return { success: false, message: errMsg };
    }

    // بررسی وجود کاربر در دیتابیس
    const allUsers = dataService.getAllUsers();
    const user = allUsers.find(u => u.mobile === cleanMobile && !u.isDeleted);

    if (!user) {
      setIsLoading(false);
      const errMsg = 'کاربری با این شماره موبایل در سامانه ثبت نشده است. لطفاً با مدیر تعاونی یا ادمین کل تماس حاصل فرمایید.';
      setError(errMsg);
      return { success: false, message: errMsg };
    }

    // تولید کد ۵ رقمی تصادفی
    const code = Math.floor(10000 + Math.random() * 90000).toString();
    const expiresAt = Date.now() + 120 * 1000;

    setOtpSentToMobile(cleanMobile);
    setSimulatedOtpCode(code);
    setOtpExpiresAt(expiresAt);
    setIsLoading(false);

    return {
      success: true,
      message: `کد تایید ورود برای شماره ${cleanMobile} پیامک شد.`,
      code
    };
  };

  // تایید کد پیامکی و ساخت نشست چندمستأجری با تفکیک دقیق دسترسی
  const verifyOtp = async (mobileInput: string, codeInput: string): Promise<{ success: boolean; message: string }> => {
    setIsLoading(true);
    setError(null);

    await new Promise(resolve => setTimeout(resolve, 400));

    const cleanMobile = mobileInput.replace(/[۰-۹]/g, d => String(d.charCodeAt(0) - 1776)).trim();
    const cleanCode = codeInput.replace(/[۰-۹]/g, d => String(d.charCodeAt(0) - 1776)).trim();

    if (!otpSentToMobile || otpSentToMobile !== cleanMobile) {
      setIsLoading(false);
      const msg = 'ابتدا شماره موبایل خود را وارد کرده و درخواست کد نمایید.';
      setError(msg);
      return { success: false, message: msg };
    }

    if (otpExpiresAt && Date.now() > otpExpiresAt) {
      setIsLoading(false);
      const msg = 'کد تایید منقضی شده است. مجدداً درخواست ارسال کد نمایید.';
      setError(msg);
      return { success: false, message: msg };
    }

    // اعتبارسنجی کد دریافتی (یا مستر کد ۱۲۳۴۵ برای تست سریع)
    if (cleanCode !== simulatedOtpCode && cleanCode !== '12345') {
      setIsLoading(false);
      const msg = 'کد پیامک وارد شده صحیح نمی‌باشد.';
      setError(msg);
      return { success: false, message: msg };
    }

    const allUsers = dataService.getAllUsers();
    const user = allUsers.find(u => u.mobile === cleanMobile && !u.isDeleted);

    if (!user) {
      setIsLoading(false);
      const msg = 'کاربر در سامانه یافت نشد.';
      setError(msg);
      return { success: false, message: msg };
    }

    const allMemberships = dataService.getAllMemberships();
    const allCooperatives = dataService.getAllCooperatives();

    const userMemberships = allMemberships.filter(m => m.userId === user.id && m.isActive && !m.isDeleted);
    
    // آیا مدیر ارشد کل سامانه است؟
    const isSuperAdmin = userMemberships.some(m => m.role === 'SUPER_ADMIN') || 
      user.id === 'user-superadmin' || 
      user.mobile === adminMobile;

    let initialMembership: Membership | null = null;
    let initialCooperative: Cooperative | null = null;
    let initialRole: UserRole = 'MEMBER';

    if (isSuperAdmin) {
      initialRole = 'SUPER_ADMIN';
      initialMembership = userMemberships[0] || null;
      initialCooperative = null; // مدیر ارشد دید سراسری دارد
    } else if (userMemberships.length > 0) {
      // مدیر تعاونی یا عضو عادی
      initialMembership = userMemberships[0];
      initialRole = initialMembership.role;
      initialCooperative = allCooperatives.find(c => c.id === initialMembership!.cooperativeId && !c.isDeleted) || null;
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

    // ثبت لاگ ورود
    dataService.addAuditLog({
      cooperativeId: initialCooperative?.id || null,
      userId: user.id,
      userFullName: user.fullName,
      userRole: initialRole,
      action: 'LOGIN_OTP',
      entityType: 'USER',
      entityId: user.id,
      description: `ورود موفق کاربر «${user.fullName}» با نقش «${initialRole}» از طریق رمز یکبارمصرف پیامکی`,
      ipAddress: '127.0.0.1'
    });

    setOtpSentToMobile(null);
    setSimulatedOtpCode(null);
    setOtpExpiresAt(null);
    setIsLoading(false);

    return { success: true, message: 'ورود موفقیت‌آمیز بود.' };
  };

  // سوییچ تعاونی منحصراً برای سوپر ادمین سامانه
  const switchTenant = (cooperativeId: string | null) => {
    if (!session) return;

    // فقط مدیر ارشد اجازه تغییر تعاونی دارد
    if (!session.isGlobalSuperAdmin) {
      console.warn('مدیر تعاونی یا عضو عادی حق تغییر تعاونی را ندارد.');
      return;
    }

    if (cooperativeId === null) {
      const updated: AuthSession = {
        ...session,
        activeCooperative: null,
        activeRole: 'SUPER_ADMIN',
        activeMembership: session.memberships[0] || null
      };
      saveSession(updated);
      return;
    }

    const allCooperatives = dataService.getAllCooperatives();
    const targetCoop = allCooperatives.find(c => c.id === cooperativeId && !c.isDeleted);
    if (!targetCoop) return;

    const updated: AuthSession = {
      ...session,
      activeCooperative: targetCoop,
      activeRole: 'SUPER_ADMIN'
    };
    saveSession(updated);
  };

  const logout = () => {
    if (session) {
      dataService.addAuditLog({
        cooperativeId: session.activeCooperative?.id || null,
        userId: session.user.id,
        userFullName: session.user.fullName,
        userRole: session.activeRole,
        action: 'UPDATE',
        entityType: 'USER',
        entityId: session.user.id,
        description: `خروج کاربر «${session.user.fullName}» از سامانه`
      });
    }
    saveSession(null);
    setOtpSentToMobile(null);
    setSimulatedOtpCode(null);
    setOtpExpiresAt(null);
    setError(null);
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
        adminMobile,
        requestOtp,
        verifyOtp,
        switchTenant,
        logout
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
