import {
  User,
  Cooperative,
  Membership,
  Unit,
  InstallmentPlan,
  InstallmentItem,
  Payment,
  Receipt,
  Announcement,
  AuditLog,
  MonthlyFee
} from '../types/database';

// بازیابی مشخصات مدیر ارشد سامانه از متغیرهای محیطی
const DEFAULT_ADMIN_MOBILE = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_ADMIN_MOBILE) || '09120000000';
const DEFAULT_ADMIN_NAME = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_ADMIN_FULL_NAME) || 'مدیر ارشد سامانه';
const DEFAULT_ADMIN_NATIONAL_CODE = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_ADMIN_NATIONAL_CODE) || '0010350829';

export const superAdminUser: User = {
  id: 'user-superadmin',
  mobile: DEFAULT_ADMIN_MOBILE,
  fullName: DEFAULT_ADMIN_NAME,
  nationalCode: DEFAULT_ADMIN_NATIONAL_CODE,
  fatherName: 'سامانه',
  avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80',
  isActive: true,
  createdAt: '2024-01-01T08:00:00Z',
  updatedAt: '2024-01-01T08:00:00Z'
};

// پایگاه داده کاملاً تمیز بدون اطلاعات ساختگی یا دمو
// تعاونی‌ها، واحدها، اقساط و اعضا توسط ادمین و مدیران به صورت واقعی تعریف می‌شوند
export const seedCooperatives: Cooperative[] = [];
export const seedUsers: User[] = [superAdminUser];
export const seedMemberships: Membership[] = [
  {
    id: 'mem-superadmin',
    userId: 'user-superadmin',
    cooperativeId: 'GLOBAL',
    role: 'SUPER_ADMIN',
    membershipNumber: 'ADMIN-001',
    isActive: true,
    joinedAt: new Date().toISOString()
  }
];
export const seedUnits: Unit[] = [];
export const seedInstallmentPlans: InstallmentPlan[] = [];
export const seedInstallmentItems: InstallmentItem[] = [];
export const seedPayments: Payment[] = [];
export const seedReceipts: Receipt[] = [];
export const seedAnnouncements: Announcement[] = [];
export const seedAuditLogs: AuditLog[] = [
  {
    id: 'log-init-1',
    cooperativeId: null,
    userId: 'user-superadmin',
    userFullName: DEFAULT_ADMIN_NAME,
    userRole: 'SUPER_ADMIN',
    action: 'CREATE',
    entityType: 'USER',
    entityId: 'user-superadmin',
    description: `راه‌اندازی اولیه سامانه مسکن‌یار و تعریف حساب مدیر ارشد با شماره ${DEFAULT_ADMIN_MOBILE}`,
    ipAddress: '127.0.0.1',
    timestamp: new Date().toISOString()
  }
];
export const seedMonthlyFees: MonthlyFee[] = [];
