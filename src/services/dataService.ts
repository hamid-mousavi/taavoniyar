/**
 * سرویس مدیریت داده‌های چندمستأجری سامانه (Stateful Data Service)
 * داده‌های اولیه را از seedData بارگذاری کرده و تغییرات را با کانتکست امنیتی اعمال می‌کند.
 */

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
  UserRole,
  InstallmentStage,
  MonthlyFee,
  FeeCategory,
  FeeCategoryItem
} from '../types/database';
import {
  seedCooperatives,
  seedUsers,
  seedMemberships,
  seedUnits,
  seedInstallmentPlans,
  seedInstallmentItems,
  seedPayments,
  seedReceipts,
  seedAnnouncements,
  seedAuditLogs,
  seedMonthlyFees
} from '../data/seedData';
import { isValidIranianNationalCode, isValidIranianMobile, cleanAndPadNationalCode } from '../utils/persian';
import { getSupabaseClient } from '../lib/supabase';
import { dbClient } from '../lib/dbClient';

export interface RecycleItem {
  id: string;
  entityType: 'cooperative' | 'user' | 'member' | 'unit' | 'installmentPlan' | 'monthlyFee';
  entityTypeName: string;
  title: string;
  cooperativeId?: string | null;
  cooperativeName?: string;
  deletedAt: string;
  deletedBy?: string;
  details?: string;
}

const STORE_KEY_PREFIX = 'maskanyar_store_v5_';

class DataService {
  private cooperatives: Cooperative[] = [];
  private users: User[] = [];
  private memberships: Membership[] = [];
  private units: Unit[] = [];
  private installmentPlans: InstallmentPlan[] = [];
  private installmentItems: InstallmentItem[] = [];
  private payments: Payment[] = [];
  private receipts: Receipt[] = [];
  private announcements: Announcement[] = [];
  private auditLogs: AuditLog[] = [];
  private monthlyFees: MonthlyFee[] = [];
  private customFeeCategories: FeeCategoryItem[] = [];
  private listeners: (() => void)[] = [];

  constructor() {
    this.initData();
  }

  private initData() {
    try {
      this.cooperatives = this.loadOrInit('cooperatives', seedCooperatives);
      this.users = this.loadOrInit('users', seedUsers);
      this.memberships = this.loadOrInit('memberships', seedMemberships);
      this.units = this.loadOrInit('units', seedUnits);
      this.installmentPlans = this.loadOrInit('installmentPlans', seedInstallmentPlans);
      this.installmentItems = this.loadOrInit('installmentItems', seedInstallmentItems);
      this.payments = this.loadOrInit('payments', seedPayments);
      this.receipts = this.loadOrInit('receipts', seedReceipts);
      this.announcements = this.loadOrInit('announcements', seedAnnouncements);
      this.auditLogs = this.loadOrInit('auditLogs', seedAuditLogs);
      this.monthlyFees = this.loadOrInit('monthlyFees', seedMonthlyFees);
      this.customFeeCategories = this.loadOrInit('fee_categories', []);

      // اگر تعاونی ثبت‌شده‌ای وجود نداشت، بارگذاری داده‌های کامل ماک برای ارائه و تست بدون دیتابیس
      if (this.cooperatives.length === 0) {
        this.loadPresentationMockData();
      }

      // اطمینان از وجود کاربر سوپر ادمین
      if (!this.users.some(u => u.id === 'user-superadmin')) {
        this.users.unshift(seedUsers[0]);
        this.persist('users', this.users);
      }

      // همگام‌سازی شماره ادمین با متغیرهای محیطی سرور
      if (typeof window !== 'undefined' && typeof fetch !== 'undefined') {
        fetch('/api/admin/info')
          .then(r => r.json())
          .then(info => {
            if (info && info.adminMobile) {
              const admin = this.users.find(u => u.id === 'user-superadmin');
              if (admin && admin.mobile !== info.adminMobile) {
                admin.mobile = info.adminMobile;
                if (info.adminFullName) admin.fullName = info.adminFullName;
                if (info.adminNationalCode) admin.nationalCode = info.adminNationalCode;
                this.persist('users', this.users);
              }
            }
          })
          .catch(() => {});
      }
    } catch {
      this.resetToDefaults();
    }
  }

  private loadOrInit<T>(key: string, fallback: T): T {
    try {
      if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
        const saved = localStorage.getItem(STORE_KEY_PREFIX + key);
        if (saved) {
          return JSON.parse(saved);
        }
      }
    } catch {
      return fallback;
    }
    return fallback;
  }

  private persist(key: string, data: any) {
    try {
      if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
        localStorage.setItem(STORE_KEY_PREFIX + key, JSON.stringify(data));
      }
      this.notifyListeners();
    } catch (e) {
      console.error('Failed to persist to localStorage', e);
    }
  }

  public subscribe(listener: () => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notifyListeners() {
    this.listeners.forEach(l => l());
  }

  private async asyncSupabaseSync(table: string, action: 'upsert' | 'delete', data: any) {
    // ۱. همگام‌سازی مستقیم با PostgreSQL از طریق رشته اتصال سرور (dbClient)
    try {
      if (table === 'cooperatives') {
        if (action === 'upsert') {
          await dbClient.syncCooperative(data);
        } else if (action === 'delete') {
          await dbClient.deleteCooperative(data.id);
        }
      } else if (table === 'users') {
        if (action === 'upsert') {
          await dbClient.updateUser(data.id, data);
        } else if (action === 'delete') {
          await dbClient.deleteUser(data.id);
        }
      }
    } catch (dbErr) {
      console.warn(`[Database ConnectionString Sync] Error on ${table}:`, dbErr);
    }

    // ۲. همگام‌سازی از طریق کلاینت Supabase JS در صورت وجود
    try {
      const client = getSupabaseClient();
      if (!client) return;
      if (action === 'upsert') {
        await client.from(table).upsert(data);
      } else if (action === 'delete') {
        await client.from(table).delete().eq('id', data.id);
      }
    } catch (e) {
      console.warn(`[Supabase AutoSync] Failed to sync ${table}:`, e);
    }
  }

  /**
   * بارگذاری کامل داده‌های نمونه واقعی جهت تست و ارائه سامانه بدون نیاز به اتصال دیتابیس
   */
  public loadPresentationMockData() {
    this.cooperatives = [...seedCooperatives];
    this.users = [...seedUsers];
    this.memberships = [...seedMemberships];
    this.units = [...seedUnits];
    this.installmentPlans = [...seedInstallmentPlans];
    this.installmentItems = [...seedInstallmentItems];
    this.payments = [...seedPayments];
    this.receipts = [...seedReceipts];
    this.announcements = [...seedAnnouncements];
    this.auditLogs = [...seedAuditLogs];
    this.monthlyFees = [...seedMonthlyFees];
    this.customFeeCategories = [];

    this.persist('cooperatives', this.cooperatives);
    this.persist('users', this.users);
    this.persist('memberships', this.memberships);
    this.persist('units', this.units);
    this.persist('installmentPlans', this.installmentPlans);
    this.persist('installmentItems', this.installmentItems);
    this.persist('payments', this.payments);
    this.persist('receipts', this.receipts);
    this.persist('announcements', this.announcements);
    this.persist('auditLogs', this.auditLogs);
    this.persist('monthlyFees', this.monthlyFees);
    this.persist('fee_categories', this.customFeeCategories);

    this.notifyListeners();
  }

  public resetToDefaults() {
    this.loadPresentationMockData();
  }

  // ==========================================
  // متدهای واکشی بر اساس کانتکست امنیتی (Tenant Scoping)
  // ==========================================

  public getCooperatives(activeCoopId: string | null, isSuperAdmin: boolean, includeDeleted = false): Cooperative[] {
    const list = this.cooperatives.filter(c => includeDeleted ? true : !c.isDeleted);
    if (isSuperAdmin && !activeCoopId) {
      return [...list];
    }
    return list.filter(c => c.id === activeCoopId);
  }

  public getAllCooperatives(includeDeleted = false): Cooperative[] {
    return this.cooperatives.filter(c => includeDeleted ? true : !c.isDeleted);
  }

  public getAllUsers(includeDeleted = false): User[] {
    return this.users.filter(u => includeDeleted ? true : !u.isDeleted);
  }

  public getUserById(id: string): User | undefined {
    return this.users.find(u => u.id === id);
  }

  public getMemberships(activeCoopId?: string | null, includeDeleted = false): Membership[] {
    const list = this.memberships.filter(m => includeDeleted ? true : !m.isDeleted);
    if (!activeCoopId) return [...list];
    return list.filter(m => m.cooperativeId === activeCoopId);
  }

  public getAllMemberships(includeDeleted = false): Membership[] {
    return this.memberships.filter(m => includeDeleted ? true : !m.isDeleted);
  }

  public getCooperativeById(id: string): Cooperative | undefined {
    return this.cooperatives.find(c => c.id === id);
  }

  public getMembers(activeCoopId: string | null, isSuperAdmin: boolean, includeDeleted = false): { user: User; membership: Membership; unit?: Unit }[] {
    const filteredMemberships = this.memberships.filter(m => {
      if (!includeDeleted && m.isDeleted) return false;
      if (isSuperAdmin && !activeCoopId) return true;
      return m.cooperativeId === activeCoopId;
    });

    const result: { user: User; membership: Membership; unit?: Unit }[] = [];
    for (const m of filteredMemberships) {
      const user = this.users.find(u => u.id === m.userId);
      if (!user || (!includeDeleted && user.isDeleted)) continue;
      const unit = this.units.find(u => u.assignedMemberId === m.id && (!includeDeleted ? !u.isDeleted : true));
      result.push({ user, membership: m, unit: unit || undefined });
    }
    return result;
  }

  public getUnits(activeCoopId: string | null, isSuperAdmin: boolean, includeDeleted = false): Unit[] {
    return this.units.filter(u => {
      if (!includeDeleted && u.isDeleted) return false;
      if (isSuperAdmin && !activeCoopId) return true;
      return u.cooperativeId === activeCoopId;
    });
  }

  public getInstallmentPlans(activeCoopId: string | null, isSuperAdmin: boolean, includeDeleted = false): InstallmentPlan[] {
    return this.installmentPlans.filter(p => {
      if (!includeDeleted && p.isDeleted) return false;
      if (isSuperAdmin && !activeCoopId) return true;
      return p.cooperativeId === activeCoopId;
    });
  }

  public getInstallmentItemsByPlanId(planId: string, includeDeleted = false): InstallmentItem[] {
    return this.installmentItems.filter(i => {
      if (!includeDeleted && i.isDeleted) return false;
      return i.planId === planId;
    });
  }

  public getAllInstallmentItems(activeCoopId: string | null, isSuperAdmin: boolean, includeDeleted = false): InstallmentItem[] {
    return this.installmentItems.filter(i => {
      if (!includeDeleted && i.isDeleted) return false;
      if (isSuperAdmin && !activeCoopId) return true;
      return i.cooperativeId === activeCoopId;
    });
  }

  // ==========================================
  // عملیات ایجاد و مدیریت فاز ۲ (CRUD Operations)
  // ==========================================

  /**
   * ۱. افزودن تعاونی جدید (فقط مدیر کل)
   */
  public createCooperative(data: {
    name: string;
    code: string;
    projectName: string;
    address: string;
    totalUnits: number;
    bankName: string;
    accountNumber: string;
    shebaNumber: string;
    cardHolderName: string;
  }, executor: { id: string; fullName: string; role: UserRole }): Cooperative {
    if (executor.role !== 'SUPER_ADMIN') {
      throw new Error('فقط مدیر کل سامانه مجاز به ثبت تعاونی جدید است.');
    }

    const newCoop: Cooperative = {
      id: `coop-${Date.now()}`,
      name: data.name.trim(),
      code: data.code.trim().toUpperCase(),
      projectName: data.projectName.trim(),
      address: data.address.trim(),
      totalUnits: Number(data.totalUnits),
      bankAccountInfo: {
        bankName: data.bankName.trim(),
        accountNumber: data.accountNumber.trim(),
        shebaNumber: data.shebaNumber.trim(),
        cardHolderName: data.cardHolderName.trim()
      },
      isActive: true,
      createdAt: new Date().toISOString()
    };

    this.cooperatives.unshift(newCoop);
    this.persist('cooperatives', this.cooperatives);

    this.addAuditLog({
      cooperativeId: newCoop.id,
      userId: executor.id,
      userFullName: executor.fullName,
      userRole: executor.role,
      action: 'CREATE',
      entityType: 'COOPERATIVE' as any,
      entityId: newCoop.id,
      description: `تعریف تعاونی جدید «${newCoop.name}» با ${newCoop.totalUnits} واحد`,
      newState: newCoop
    });

    this.asyncSupabaseSync('cooperatives', 'upsert', {
      id: newCoop.id,
      name: newCoop.name,
      code: newCoop.code,
      project_name: newCoop.projectName,
      address: newCoop.address,
      total_units: newCoop.totalUnits,
      bank_name: newCoop.bankAccountInfo.bankName,
      account_number: newCoop.bankAccountInfo.accountNumber,
      sheba_number: newCoop.bankAccountInfo.shebaNumber,
      card_holder_name: newCoop.bankAccountInfo.cardHolderName,
      is_active: newCoop.isActive
    });

    return newCoop;
  }

  /**
   * ویرایش مشخصات تعاونی مسکن
   */
  public updateCooperative(id: string, data: Partial<{
    name: string;
    code: string;
    projectName: string;
    address: string;
    totalUnits: number;
    bankName: string;
    accountNumber: string;
    shebaNumber: string;
    cardHolderName: string;
    isActive: boolean;
  }>, executor: { id: string; fullName: string; role: UserRole }): Cooperative {
    if (executor.role === 'MEMBER') {
      throw new Error('اعضای عادی دسترسی ویرایش اطلاعات تعاونی را ندارند.');
    }

    const coop = this.cooperatives.find(c => c.id === id);
    if (!coop) {
      throw new Error('تعاونی مورد نظر یافت نشد.');
    }

    if (data.name !== undefined) coop.name = data.name.trim();
    if (data.code !== undefined) {
      const cleanCode = data.code.trim().toUpperCase();
      const duplicate = this.cooperatives.find(c => c.code === cleanCode && c.id !== id);
      if (duplicate) throw new Error('شناسه اختصاصی وارد شده برای تعاونی دیگری ثبت شده است.');
      coop.code = cleanCode;
    }
    if (data.projectName !== undefined) coop.projectName = data.projectName.trim();
    if (data.address !== undefined) coop.address = data.address.trim();
    if (data.totalUnits !== undefined) coop.totalUnits = Number(data.totalUnits);
    if (data.isActive !== undefined) coop.isActive = Boolean(data.isActive);
    if (data.bankName !== undefined || data.accountNumber !== undefined || data.shebaNumber !== undefined || data.cardHolderName !== undefined) {
      coop.bankAccountInfo = {
        bankName: data.bankName !== undefined ? data.bankName.trim() : coop.bankAccountInfo.bankName,
        accountNumber: data.accountNumber !== undefined ? data.accountNumber.trim() : coop.bankAccountInfo.accountNumber,
        shebaNumber: data.shebaNumber !== undefined ? data.shebaNumber.trim() : coop.bankAccountInfo.shebaNumber,
        cardHolderName: data.cardHolderName !== undefined ? data.cardHolderName.trim() : coop.bankAccountInfo.cardHolderName
      };
    }

    this.persist('cooperatives', this.cooperatives);

    this.addAuditLog({
      cooperativeId: coop.id,
      userId: executor.id,
      userFullName: executor.fullName,
      userRole: executor.role,
      action: 'UPDATE',
      entityType: 'COOPERATIVE' as any,
      entityId: coop.id,
      description: `ویرایش مشخصات تعاونی «${coop.name}»`,
      newState: coop
    });

    this.asyncSupabaseSync('cooperatives', 'upsert', {
      id: coop.id,
      name: coop.name,
      code: coop.code,
      project_name: coop.projectName,
      address: coop.address,
      total_units: coop.totalUnits,
      bank_name: coop.bankAccountInfo.bankName,
      account_number: coop.bankAccountInfo.accountNumber,
      sheba_number: coop.bankAccountInfo.shebaNumber,
      card_holder_name: coop.bankAccountInfo.cardHolderName,
      is_active: coop.isActive
    });

    return coop;
  }

  /**
   * حذف تعاونی مسکن (حذف ایمن با امکان بازیابی)
   */
  public deleteCooperative(id: string, executor: { id: string; fullName: string; role: UserRole }): boolean {
    if (executor.role !== 'SUPER_ADMIN') {
      throw new Error('فقط مدیر کل سامانه مجاز به حذف تعاونی مسکن است.');
    }

    const coop = this.cooperatives.find(c => c.id === id);
    if (!coop) {
      throw new Error('تعاونی مورد نظر یافت نشد.');
    }

    const nowIso = new Date().toISOString();
    coop.isDeleted = true;
    coop.deletedAt = nowIso;
    coop.deletedBy = executor.fullName;
    this.persist('cooperatives', this.cooperatives);

    // حذف ایمن اعضا و واحدهای وابسته در این تعاونی
    this.memberships.forEach(m => {
      if (m.cooperativeId === id) {
        m.isDeleted = true;
        m.deletedAt = nowIso;
        m.deletedBy = executor.fullName;
      }
    });
    this.persist('memberships', this.memberships);

    this.units.forEach(u => {
      if (u.cooperativeId === id) {
        u.isDeleted = true;
        u.deletedAt = nowIso;
        u.deletedBy = executor.fullName;
      }
    });
    this.persist('units', this.units);

    this.addAuditLog({
      cooperativeId: id,
      userId: executor.id,
      userFullName: executor.fullName,
      userRole: executor.role,
      action: 'DELETE',
      entityType: 'COOPERATIVE' as any,
      entityId: id,
      description: `حذف ایمن تعاونی «${coop.name}» (انتقال به سطل بازیافت)`,
      newState: undefined
    });

    return true;
  }

  /**
   * ۲. افزودن عضو جدید به تعاونی با اعتبارسنجی کد ملی و موبایل
   */
  public registerMember(params: {
    cooperativeId: string;
    fullName: string;
    mobile: string;
    nationalCode: string;
    fatherName?: string;
    role: UserRole;
    allowBypassMod11?: boolean;
  }, executor: { id: string; fullName: string; role: UserRole }): { user: User; membership: Membership } {
    // اعتبارسنجی کانتکست
    if (executor.role === 'MEMBER') {
      throw new Error('اعضای عادی دسترسی لازم جهت ثبت عضو جدید را ندارند.');
    }

    // اگر اقدام‌کننده مدیر تعاونی است، فقط مجاز به ثبت عضو عادی یا حسابدار در تعاونی خود است
    if (executor.role === 'COOP_ADMIN' && (params.role === 'COOP_ADMIN' || params.role === 'SUPER_ADMIN')) {
      throw new Error('تنها مدیر ارشد سامانه مجاز به تعریف و انتصاب مدیران تعاونی است.');
    }

    const cleanMobile = params.mobile.replace(/[۰-۹]/g, d => String(d.charCodeAt(0) - 1776)).trim();
    const cleanNationalCode = cleanAndPadNationalCode(params.nationalCode);

    if (!isValidIranianMobile(cleanMobile)) {
      throw new Error('شماره تلفن همراه نامعتبر است (الگوی صحیح: ۰۹۱۲۳۴۵۶۷۸۹)');
    }

    if (!isValidIranianNationalCode(cleanNationalCode, params.allowBypassMod11)) {
      throw new Error('کد ملی وارد شده طبق الگوریتم رسمی Mod 11 نامعتبر است.');
    }

    // بررسی تکراری نبودن شماره در تعاونی
    let user = this.users.find(u => u.mobile === cleanMobile || u.nationalCode === cleanNationalCode);
    if (!user) {
      user = {
        id: `user-${Date.now()}`,
        fullName: params.fullName.trim(),
        mobile: cleanMobile,
        nationalCode: cleanNationalCode,
        fatherName: params.fatherName?.trim(),
        avatarUrl: `https://images.unsplash.com/photo-${1500000000000 + (Date.now() % 1000000)}?w=150&auto=format&fit=crop&q=80`,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      this.users.push(user);
      this.persist('users', this.users);
    }

    // بررسی عدم عضویت تکراری در همان تعاونی
    const existingMembership = this.memberships.find(m => m.userId === user!.id && m.cooperativeId === params.cooperativeId);
    if (existingMembership) {
      throw new Error('این کاربر قبلاً در این تعاونی عضو شده است.');
    }

    const membershipNumber = `MEM-${Date.now().toString().slice(-4)}`;
    const newMembership: Membership = {
      id: `mem-${Date.now()}`,
      userId: user.id,
      cooperativeId: params.cooperativeId,
      role: params.role,
      membershipNumber,
      isActive: true,
      joinedAt: new Date().toISOString()
    };

    this.memberships.push(newMembership);
    this.persist('memberships', this.memberships);

    this.addAuditLog({
      cooperativeId: params.cooperativeId,
      userId: executor.id,
      userFullName: executor.fullName,
      userRole: executor.role,
      action: 'CREATE',
      entityType: 'USER',
      entityId: user.id,
      description: `ثبت‌نام عضو جدید «${user.fullName}» با کد عضویت ${membershipNumber}`,
      newState: { user, membership: newMembership }
    });

    this.asyncSupabaseSync('users', 'upsert', {
      id: user.id,
      mobile: user.mobile,
      full_name: user.fullName,
      national_code: user.nationalCode,
      father_name: user.fatherName || null,
      avatar_url: user.avatarUrl || null,
      is_active: user.isActive
    });

    this.asyncSupabaseSync('memberships', 'upsert', {
      id: newMembership.id,
      user_id: newMembership.userId,
      cooperative_id: newMembership.cooperativeId,
      role: newMembership.role,
      membership_number: newMembership.membershipNumber,
      is_active: newMembership.isActive
    });

    try {
      dbClient.syncUserAndMembership(user, newMembership);
    } catch {}

    return { user, membership: newMembership };
  }

  /**
   * ویرایش مشخصات کاربر / هویت فردی
   */
  public updateUser(userId: string, data: Partial<{
    fullName: string;
    mobile: string;
    nationalCode: string;
    fatherName: string;
    isActive: boolean;
  }>, executor: { id: string; fullName: string; role: UserRole }): User {
    if (executor.role === 'MEMBER' && executor.id !== userId) {
      throw new Error('شما دسترسی لازم برای ویرایش مشخصات سایر کاربران را ندارید.');
    }

    const user = this.users.find(u => u.id === userId);
    if (!user) {
      throw new Error('کاربر مورد نظر یافت نشد.');
    }

    if (data.fullName !== undefined) user.fullName = data.fullName.trim();
    if (data.fatherName !== undefined) user.fatherName = data.fatherName.trim();
    if (data.isActive !== undefined) user.isActive = Boolean(data.isActive);

    if (data.mobile !== undefined) {
      const cleanMobile = data.mobile.replace(/[۰-۹]/g, d => String(d.charCodeAt(0) - 1776)).trim();
      if (!isValidIranianMobile(cleanMobile)) {
        throw new Error('شماره تلفن همراه وارد شده نامعتبر است.');
      }
      const duplicate = this.users.find(u => u.mobile === cleanMobile && u.id !== userId);
      if (duplicate) throw new Error('این شماره همراه متعلق به کاربر دیگری است.');
      user.mobile = cleanMobile;
    }

    if (data.nationalCode !== undefined) {
      const cleanNationalCode = data.nationalCode.replace(/[۰-۹]/g, d => String(d.charCodeAt(0) - 1776)).trim();
      if (!isValidIranianNationalCode(cleanNationalCode)) {
        throw new Error('کد ملی وارد شده طبق الگوریتم رسمی نامعتبر است.');
      }
      const duplicate = this.users.find(u => u.nationalCode === cleanNationalCode && u.id !== userId);
      if (duplicate) throw new Error('این کد ملی متعلق به کاربر دیگری است.');
      user.nationalCode = cleanNationalCode;
    }

    user.updatedAt = new Date().toISOString();
    this.persist('users', this.users);

    this.addAuditLog({
      cooperativeId: 'SYSTEM',
      userId: executor.id,
      userFullName: executor.fullName,
      userRole: executor.role,
      action: 'UPDATE',
      entityType: 'USER',
      entityId: user.id,
      description: `ویرایش مشخصات کاربر «${user.fullName}»`,
      newState: user
    });

    this.asyncSupabaseSync('users', 'upsert', {
      id: user.id,
      mobile: user.mobile,
      full_name: user.fullName,
      national_code: user.nationalCode,
      father_name: user.fatherName || null,
      avatar_url: user.avatarUrl || null,
      is_active: user.isActive
    });

    return user;
  }

  /**
   * ویرایش پرونده عضویت و نقش در تعاونی
   */
  public updateMembership(membershipId: string, data: Partial<{
    role: UserRole;
    membershipNumber: string;
    isActive: boolean;
  }>, executor: { id: string; fullName: string; role: UserRole }): Membership {
    if (executor.role === 'MEMBER') {
      throw new Error('اعضای عادی دسترسی ویرایش پرونده عضویت را ندارند.');
    }

    const mem = this.memberships.find(m => m.id === membershipId);
    if (!mem) {
      throw new Error('پرونده عضویت مورد نظر یافت نشد.');
    }

    if (data.role !== undefined) mem.role = data.role;
    if (data.membershipNumber !== undefined) mem.membershipNumber = data.membershipNumber.trim();
    if (data.isActive !== undefined) mem.isActive = Boolean(data.isActive);

    this.persist('memberships', this.memberships);

    this.addAuditLog({
      cooperativeId: mem.cooperativeId,
      userId: executor.id,
      userFullName: executor.fullName,
      userRole: executor.role,
      action: 'UPDATE',
      entityType: 'MEMBERSHIP' as any,
      entityId: mem.id,
      description: `ویرایش پرونده عضویت شماره ${mem.membershipNumber}`,
      newState: mem
    });

    this.asyncSupabaseSync('memberships', 'upsert', {
      id: mem.id,
      user_id: mem.userId,
      cooperative_id: mem.cooperativeId,
      role: mem.role,
      membership_number: mem.membershipNumber,
      is_active: mem.isActive
    });

    return mem;
  }

  /**
   * حذف عضو از تعاونی (حذف ایمن با امکان بازیابی)
   */
  public deleteMember(membershipId: string, executor: { id: string; fullName: string; role: UserRole }): boolean {
    if (executor.role === 'MEMBER') {
      throw new Error('اعضای عادی دسترسی حذف عضو را ندارند.');
    }

    const mem = this.memberships.find(m => m.id === membershipId);
    if (!mem) {
      throw new Error('عضویت مورد نظر یافت نشد.');
    }

    const nowIso = new Date().toISOString();
    mem.isDeleted = true;
    mem.deletedAt = nowIso;
    mem.deletedBy = executor.fullName;

    // آزادسازی واحدهای متصل
    this.units.forEach(u => {
      if (u.assignedMemberId === membershipId) {
        u.assignedMemberId = undefined;
        u.status = 'AVAILABLE' as any;
      }
    });
    this.persist('units', this.units);
    this.persist('memberships', this.memberships);

    this.addAuditLog({
      cooperativeId: mem.cooperativeId,
      userId: executor.id,
      userFullName: executor.fullName,
      userRole: executor.role,
      action: 'DELETE',
      entityType: 'MEMBERSHIP' as any,
      entityId: mem.id,
      description: `حذف ایمن عضو با شماره پرونده ${mem.membershipNumber} (انتقال به سطل بازیافت)`,
      newState: undefined
    });

    return true;
  }

  /**
   * حذف کاربر از سامانه (حذف ایمن با امکان بازیابی)
   */
  public deleteUser(userId: string, executor: { id: string; fullName: string; role: UserRole }): boolean {
    if (executor.role !== 'SUPER_ADMIN') {
      throw new Error('فقط مدیر کل سامانه مجاز به حذف کامل کاربر از سامانه است.');
    }

    const user = this.users.find(u => u.id === userId);
    if (!user) {
      throw new Error('کاربر مورد نظر یافت نشد.');
    }

    const nowIso = new Date().toISOString();
    user.isDeleted = true;
    user.deletedAt = nowIso;
    user.deletedBy = executor.fullName;
    this.persist('users', this.users);

    // حذف ایمن عضویت‌های متصل
    const userMems = this.memberships.filter(m => m.userId === userId);
    for (const mem of userMems) {
      mem.isDeleted = true;
      mem.deletedAt = nowIso;
      mem.deletedBy = executor.fullName;
    }
    this.persist('memberships', this.memberships);

    this.addAuditLog({
      cooperativeId: 'SYSTEM',
      userId: executor.id,
      userFullName: executor.fullName,
      userRole: executor.role,
      action: 'DELETE',
      entityType: 'USER',
      entityId: user.id,
      description: `حذف ایمن کاربر «${user.fullName}» (انتقال به سطل بازیافت)`,
      newState: undefined
    });

    return true;
  }

  /**
   * ۳. تعریف واحد مسکونی جدید در پروژه
   */
  public createUnit(data: {
    cooperativeId: string;
    unitNumber: string;
    block: string;
    floor: number;
    areaM2: number;
    parkingNumber?: string;
    storageNumber?: string;
  }, executor: { id: string; fullName: string; role: UserRole }): Unit {
    if (executor.role === 'MEMBER') {
      throw new Error('عدم دسترسی مجاز جهت تعریف واحد.');
    }

    // بررسی عدم تکراری بودن شماره واحد در همان بلوک تعاونی
    const duplicate = this.units.find(
      u => u.cooperativeId === data.cooperativeId && 
           u.block === data.block && 
           u.unitNumber === data.unitNumber
    );

    if (duplicate) {
      throw new Error(`واحد ${data.unitNumber} در بلوک ${data.block} این تعاونی قبلاً ثبت شده است.`);
    }

    const newUnit: Unit = {
      id: `unit-${Date.now()}`,
      cooperativeId: data.cooperativeId,
      unitNumber: data.unitNumber.trim(),
      block: data.block.trim(),
      floor: Number(data.floor),
      areaM2: Number(data.areaM2),
      parkingNumber: data.parkingNumber?.trim(),
      storageNumber: data.storageNumber?.trim(),
      status: 'AVAILABLE',
      createdAt: new Date().toISOString()
    };

    this.units.push(newUnit);
    this.persist('units', this.units);

    this.addAuditLog({
      cooperativeId: data.cooperativeId,
      userId: executor.id,
      userFullName: executor.fullName,
      userRole: executor.role,
      action: 'CREATE',
      entityType: 'UNIT',
      entityId: newUnit.id,
      description: `تعریف واحد جدید ${newUnit.unitNumber} در بلوک ${newUnit.block} (متراژ: ${newUnit.areaM2} م²)`,
      newState: newUnit
    });

    return newUnit;
  }

  /**
   * ۴. تخصیص واحد مسکونی به عضو تعاونی (Unit Assignment)
   */
  public assignUnitToMember(unitId: string, memberId: string | null, executor: { id: string; fullName: string; role: UserRole }): Unit {
    if (executor.role === 'MEMBER') {
      throw new Error('تنها مدیران مجاز به تخصیص واحد هستند.');
    }

    const unitIndex = this.units.findIndex(u => u.id === unitId);
    if (unitIndex === -1) {
      throw new Error('واحد مورد نظر یافت نشد.');
    }

    const unit = this.units[unitIndex];

    if (memberId) {
      // بررسی اینکه آیا عضو در همان تعاونی است
      const membership = this.memberships.find(m => m.id === memberId);
      if (!membership || membership.cooperativeId !== unit.cooperativeId) {
        throw new Error('عضو انتخاب شده به این تعاونی تعلق ندارد.');
      }

      // بررسی اینکه آیا این عضو واحد دیگری ندارد
      const existingAssignedUnit = this.units.find(u => u.assignedMemberId === memberId && u.id !== unitId);
      if (existingAssignedUnit) {
        throw new Error(`این عضو قبلاً واحد ${existingAssignedUnit.unitNumber} را دریافت نموده است.`);
      }

      unit.assignedMemberId = memberId;
      unit.status = 'ASSIGNED';
    } else {
      // لغو تخصیص
      unit.assignedMemberId = undefined;
      unit.status = 'AVAILABLE';
    }

    this.units[unitIndex] = unit;
    this.persist('units', this.units);

    this.addAuditLog({
      cooperativeId: unit.cooperativeId,
      userId: executor.id,
      userFullName: executor.fullName,
      userRole: executor.role,
      action: 'UNIT_ASSIGNED',
      entityType: 'UNIT',
      entityId: unit.id,
      description: memberId 
        ? `تخصیص واحد ${unit.unitNumber} به عضو ${memberId}`
        : `لغو تخصیص واحد ${unit.unitNumber}`,
      newState: unit
    });

    return unit;
  }

  /**
   * حذف واحد مسکونی (حذف ایمن با امکان بازیابی)
   */
  public deleteUnit(unitId: string, executor: { id: string; fullName: string; role: UserRole }): boolean {
    if (executor.role === 'MEMBER') {
      throw new Error('اعضای عادی مجاز به حذف واحد نمی‌باشند.');
    }
    const unit = this.units.find(u => u.id === unitId);
    if (!unit) throw new Error('واحد ساختمانی یافت نشد.');

    unit.isDeleted = true;
    unit.deletedAt = new Date().toISOString();
    unit.deletedBy = executor.fullName;
    this.persist('units', this.units);

    this.addAuditLog({
      cooperativeId: unit.cooperativeId,
      userId: executor.id,
      userFullName: executor.fullName,
      userRole: executor.role,
      action: 'DELETE',
      entityType: 'UNIT',
      entityId: unit.id,
      description: `حذف ایمن واحد ${unit.unitNumber} (انتقال به سطل بازیافت)`,
      newState: undefined
    });
    return true;
  }

  /**
   * ۵. ایجاد برنامه اقساط و زمان‌بندی مراحل ساخت (Installment Plan & Items)
   * با کنترل عدم وجود خطای اعشار و تطابق دقیق مجموع اقساط با کل برآورد
   */
  public createInstallmentPlanWithItems(params: {
    cooperativeId: string;
    unitId: string;
    memberId: string;
    title: string;
    totalCostRial: number;
    items: {
      stage: InstallmentStage;
      stageTitle: string;
      dueDate: string;
      amountRial: number;
    }[];
  }, executor: { id: string; fullName: string; role: UserRole }): { plan: InstallmentPlan; items: InstallmentItem[] } {
    if (executor.role === 'MEMBER') {
      throw new Error('عضو مجاز به ایجاد برنامه اقساط نمی‌باشد.');
    }

    const totalCostRial = Math.round(params.totalCostRial);
    const sumOfItems = params.items.reduce((sum, item) => sum + Math.round(item.amountRial), 0);

    if (sumOfItems !== totalCostRial) {
      throw new Error(
        `خطای محاسباتی: مجموع اقساط (${sumOfItems.toLocaleString()} ریال) دقیقاً برابر با مبلغ کل قرارداد (${totalCostRial.toLocaleString()} ریال) نیست. اختلاف: ${(totalCostRial - sumOfItems).toLocaleString()} ریال.`
      );
    }

    const planId = `plan-${Date.now()}`;
    const newPlan: InstallmentPlan = {
      id: planId,
      cooperativeId: params.cooperativeId,
      unitId: params.unitId,
      memberId: params.memberId,
      title: params.title.trim(),
      totalCostRial,
      createdAt: new Date().toISOString()
    };

    const newItems: InstallmentItem[] = params.items.map((item, index) => ({
      id: `item-${Date.now()}-${index}`,
      planId,
      cooperativeId: params.cooperativeId,
      stage: item.stage,
      stageTitle: item.stageTitle.trim(),
      dueDate: item.dueDate,
      amountRial: Math.round(item.amountRial),
      paidAmountRial: 0,
      status: 'PENDING'
    }));

    this.installmentPlans.push(newPlan);
    this.installmentItems.push(...newItems);

    this.persist('installmentPlans', this.installmentPlans);
    this.persist('installmentItems', this.installmentItems);

    this.addAuditLog({
      cooperativeId: params.cooperativeId,
      userId: executor.id,
      userFullName: executor.fullName,
      userRole: executor.role,
      action: 'CREATE',
      entityType: 'INSTALLMENT',
      entityId: newPlan.id,
      description: `صدور برنامه اقساط «${newPlan.title}» به مبلغ کل ${totalCostRial.toLocaleString()} ریال در ${newItems.length} مرحله`,
      newState: { plan: newPlan, items: newItems }
    });

    return { plan: newPlan, items: newItems };
  }

  /**
   * صدور گروهی برنامه اقساط برای کلیه اعضا یا واحدهای پروژه با تقسیم‌بندی دلخواه ماه‌ها
   */
  public createBulkInstallmentPlans(params: {
    cooperativeId: string;
    targetFilter: 'ALL_MEMBERS' | 'ASSIGNED_UNITS_ONLY' | 'SELECTED_UNITS';
    unitIds?: string[];
    title: string;
    totalCostRial: number;
    monthsCount: number; // مثلا ۶، ۱۲، ۲۴، ۳۶ ماهه
    startDate?: string;
  }, executor: { id: string; fullName: string; role: UserRole }): { plans: InstallmentPlan[]; itemsCount: number } {
    if (executor.role === 'MEMBER') {
      throw new Error('تنها مدیر تعاونی مجاز به صدور گروهی برنامه اقساط است.');
    }

    let targetUnits = this.units.filter(u => u.cooperativeId === params.cooperativeId && !u.isDeleted);
    if (params.targetFilter === 'ASSIGNED_UNITS_ONLY') {
      targetUnits = targetUnits.filter(u => u.assignedMemberId);
    } else if (params.targetFilter === 'SELECTED_UNITS' && params.unitIds) {
      targetUnits = targetUnits.filter(u => params.unitIds!.includes(u.id));
    }

    if (targetUnits.length === 0) {
      throw new Error('هیچ واحدی برای ایجاد اقساط گروهی یافت نشد.');
    }

    const monthsCount = Math.max(1, params.monthsCount || 12);
    const amountPerMonth = Math.round(params.totalCostRial / monthsCount);
    const start = params.startDate ? new Date(params.startDate) : new Date();

    const createdPlans: InstallmentPlan[] = [];
    const createdItems: InstallmentItem[] = [];

    for (const unit of targetUnits) {
      const planId = `plan-bulk-${Date.now()}-${unit.id}`;
      const plan: InstallmentPlan = {
        id: planId,
        cooperativeId: params.cooperativeId,
        unitId: unit.id,
        memberId: unit.assignedMemberId || 'UNASSIGNED',
        title: `${params.title} - واحد ${unit.unitNumber}`,
        totalCostRial: params.totalCostRial,
        createdAt: new Date().toISOString()
      };
      createdPlans.push(plan);

      let allocated = 0;
      for (let m = 0; m < monthsCount; m++) {
        const dueDate = new Date(start.getFullYear(), start.getMonth() + m + 1, 15).toISOString();
        let amount = amountPerMonth;
        if (m === monthsCount - 1) {
          amount = params.totalCostRial - allocated;
        } else {
          allocated += amount;
        }

        const stages: InstallmentStage[] = ['LAND_SHARE', 'FOUNDATION', 'ROUGH_CONSTRUCTION', 'FACILITIES', 'FINISHING'];
        const stageIndex = Math.min(stages.length - 1, Math.floor((m / monthsCount) * stages.length));

        createdItems.push({
          id: `item-bulk-${Date.now()}-${unit.id}-${m}`,
          planId,
          cooperativeId: params.cooperativeId,
          stage: stages[stageIndex],
          stageTitle: `قسط ماه ${m + 1} از ${monthsCount} (${params.title})`,
          dueDate,
          amountRial: amount,
          paidAmountRial: 0,
          status: 'PENDING'
        });
      }
    }

    this.installmentPlans.push(...createdPlans);
    this.installmentItems.push(...createdItems);
    this.persist('installmentPlans', this.installmentPlans);
    this.persist('installmentItems', this.installmentItems);

    this.addAuditLog({
      cooperativeId: params.cooperativeId,
      userId: executor.id,
      userFullName: executor.fullName,
      userRole: executor.role,
      action: 'CREATE',
      entityType: 'INSTALLMENT',
      entityId: `bulk-plan-${Date.now()}`,
      description: `صدور گروهی برنامه اقساط «${params.title}» برای ${createdPlans.length} واحد (${monthsCount} ماهه، مجموع ${createdItems.length} قسط)`,
      newState: { plansCount: createdPlans.length, totalCostRial: params.totalCostRial }
    });

    return { plans: createdPlans, itemsCount: createdItems.length };
  }

  /**
   * حذف برنامه اقساط (حذف ایمن با امکان بازیابی)
   */
  public deleteInstallmentPlan(planId: string, executor: { id: string; fullName: string; role: UserRole }): boolean {
    if (executor.role === 'MEMBER') {
      throw new Error('تنها مدیر تعاونی مجاز به حذف برنامه اقساط است.');
    }
    const plan = this.installmentPlans.find(p => p.id === planId);
    if (!plan) throw new Error('برنامه اقساط یافت نشد.');

    const nowIso = new Date().toISOString();
    plan.isDeleted = true;
    plan.deletedAt = nowIso;
    plan.deletedBy = executor.fullName;
    this.persist('installmentPlans', this.installmentPlans);

    this.installmentItems.forEach(i => {
      if (i.planId === planId) {
        i.isDeleted = true;
        i.deletedAt = nowIso;
        i.deletedBy = executor.fullName;
      }
    });
    this.persist('installmentItems', this.installmentItems);

    this.addAuditLog({
      cooperativeId: plan.cooperativeId,
      userId: executor.id,
      userFullName: executor.fullName,
      userRole: executor.role,
      action: 'DELETE',
      entityType: 'INSTALLMENT',
      entityId: plan.id,
      description: `حذف ایمن برنامه اقساط «${plan.title}» (انتقال به سطل بازیافت)`,
      newState: undefined
    });
    return true;
  }

  // ==========================================
  // متدهای هزینه‌های جاری و ماهانه (شارژ ساختمان و خدمات)
  // ==========================================

  public getMonthlyFees(activeCoopId: string | null, isSuperAdmin: boolean, memberId?: string, includeDeleted = false): MonthlyFee[] {
    return this.monthlyFees.filter(f => {
      if (!includeDeleted && f.isDeleted) return false;
      const coopMatch = isSuperAdmin && !activeCoopId ? true : f.cooperativeId === activeCoopId;
      const memberMatch = memberId ? f.memberId === memberId : true;
      return coopMatch && memberMatch;
    });
  }

  /**
   * صدور هزینه جاری انفرادی
   */
  public createMonthlyFee(params: {
    cooperativeId: string;
    unitId?: string;
    memberId: string;
    title: string;
    amountRial: number;
    dueDate: string;
    periodMonth: number;
    periodYear: number;
    feeCategory: FeeCategory;
    notes?: string;
  }, executor: { id: string; fullName: string; role: UserRole }): MonthlyFee {
    if (executor.role === 'MEMBER') {
      throw new Error('تنها مدیران مجاز به تعریف هزینه یا شارژ هستند.');
    }

    const newFee: MonthlyFee = {
      id: `fee-${Date.now()}`,
      cooperativeId: params.cooperativeId,
      unitId: params.unitId,
      memberId: params.memberId,
      title: params.title.trim(),
      amountRial: Math.round(params.amountRial),
      dueDate: params.dueDate,
      periodMonth: params.periodMonth,
      periodYear: params.periodYear,
      feeCategory: params.feeCategory,
      status: 'PENDING',
      paidAmountRial: 0,
      notes: params.notes,
      createdAt: new Date().toISOString()
    };

    this.monthlyFees.unshift(newFee);
    this.persist('monthlyFees', this.monthlyFees);

    this.addAuditLog({
      cooperativeId: params.cooperativeId,
      userId: executor.id,
      userFullName: executor.fullName,
      userRole: executor.role,
      action: 'CREATE',
      entityType: 'PAYMENT',
      entityId: newFee.id,
      description: `صدور هزینه جاری «${newFee.title}» به مبلغ ${newFee.amountRial.toLocaleString()} ریال برای عضو`,
      newState: newFee
    });

    return newFee;
  }

  /**
   * صدور گروهی هزینه/شارژ برای کلیه اعضا، ساکنین یا یک عضو مشخص در چندین ماه متوالی (Bulk Issuing)
   */
  public createBulkMonthlyFees(params: {
    cooperativeId: string;
    title: string;
    amountRial: number;
    dueDate: string;
    periodMonth: number;
    periodYear: number;
    feeCategory: FeeCategory;
    targetFilter: 'ALL_MEMBERS' | 'ASSIGNED_UNITS_ONLY' | 'SINGLE_MEMBER';
    targetMemberId?: string;
    monthsCount?: number;
    notes?: string;
  }, executor: { id: string; fullName: string; role: UserRole }): MonthlyFee[] {
    if (executor.role === 'MEMBER') {
      throw new Error('تنها مدیر تعاونی مجاز به صدور گروهی هزینه‌ها است.');
    }

    let eligibleMemberships = this.memberships.filter(m => m.cooperativeId === params.cooperativeId && m.isActive && !m.isDeleted);

    if (params.targetFilter === 'ASSIGNED_UNITS_ONLY') {
      const assignedMemberIds = new Set(
        this.units.filter(u => u.cooperativeId === params.cooperativeId && u.assignedMemberId && !u.isDeleted).map(u => u.assignedMemberId!)
      );
      eligibleMemberships = eligibleMemberships.filter(m => assignedMemberIds.has(m.id));
    } else if (params.targetFilter === 'SINGLE_MEMBER') {
      if (!params.targetMemberId) throw new Error('لطفاً عضو مورد نظر را انتخاب نمایید.');
      eligibleMemberships = eligibleMemberships.filter(m => m.id === params.targetMemberId);
    }

    if (eligibleMemberships.length === 0) {
      throw new Error('هیچ عضو واجد شرایطی برای صدور این هزینه در تعاونی یافت نشد.');
    }

    const monthsCount = params.targetFilter === 'SINGLE_MEMBER' ? Math.max(1, params.monthsCount || 1) : 1;
    const createdFees: MonthlyFee[] = [];

    eligibleMemberships.forEach((m, memberIdx) => {
      const unit = this.units.find(u => u.assignedMemberId === m.id && !u.isDeleted);

      for (let mOffset = 0; mOffset < monthsCount; mOffset++) {
        let currentMonth = params.periodMonth + mOffset;
        let currentYear = params.periodYear;
        while (currentMonth > 12) {
          currentMonth -= 12;
          currentYear += 1;
        }

        const baseDue = new Date(params.dueDate);
        const feeDueDate = new Date(baseDue.getFullYear(), baseDue.getMonth() + mOffset, baseDue.getDate()).toISOString();
        const monthSuffix = monthsCount > 1 ? ` (دوره ${currentYear}/${currentMonth})` : '';

        createdFees.push({
          id: `fee-bulk-${Date.now()}-${memberIdx}-${mOffset}`,
          cooperativeId: params.cooperativeId,
          unitId: unit?.id,
          memberId: m.id,
          title: `${params.title.trim()}${monthSuffix}`,
          amountRial: Math.round(params.amountRial),
          dueDate: feeDueDate,
          periodMonth: currentMonth,
          periodYear: currentYear,
          feeCategory: params.feeCategory,
          status: 'PENDING',
          paidAmountRial: 0,
          notes: params.notes,
          createdAt: new Date().toISOString()
        });
      }
    });

    this.monthlyFees.unshift(...createdFees);
    this.persist('monthlyFees', this.monthlyFees);

    this.addAuditLog({
      cooperativeId: params.cooperativeId,
      userId: executor.id,
      userFullName: executor.fullName,
      userRole: executor.role,
      action: 'CREATE',
      entityType: 'PAYMENT',
      entityId: `bulk-fee-${Date.now()}`,
      description: `صدور هزینه «${params.title}» (${createdFees.length} گواهی صادر شد)`,
      newState: { count: createdFees.length, amountPerMember: params.amountRial }
    });

    return createdFees;
  }

  /**
   * ویرایش گواهی هزینه یا شارژ
   */
  public updateMonthlyFee(feeId: string, data: Partial<{
    title: string;
    amountRial: number;
    dueDate: string;
    feeCategory: string;
    notes?: string;
  }>, executor: { id: string; fullName: string; role: UserRole }): MonthlyFee {
    if (executor.role === 'MEMBER') {
      throw new Error('تنها مدیر تعاونی مجاز به ویرایش گواهی هزینه است.');
    }
    const fee = this.monthlyFees.find(f => f.id === feeId);
    if (!fee) throw new Error('گواهی هزینه یافت نشد.');

    if (data.title !== undefined) fee.title = data.title.trim();
    if (data.amountRial !== undefined) fee.amountRial = Math.round(data.amountRial);
    if (data.dueDate !== undefined) fee.dueDate = data.dueDate;
    if (data.feeCategory !== undefined) fee.feeCategory = data.feeCategory;
    if (data.notes !== undefined) fee.notes = data.notes.trim();

    this.persist('monthlyFees', this.monthlyFees);

    this.addAuditLog({
      cooperativeId: fee.cooperativeId,
      userId: executor.id,
      userFullName: executor.fullName,
      userRole: executor.role,
      action: 'UPDATE',
      entityType: 'PAYMENT',
      entityId: fee.id,
      description: `ویرایش گواهی هزینه «${fee.title}»`,
      newState: fee
    });
    return fee;
  }

  /**
   * حذف گواهی هزینه یا شارژ (حذف ایمن با امکان بازیابی)
   */
  public deleteMonthlyFee(feeId: string, executor: { id: string; fullName: string; role: UserRole }): boolean {
    if (executor.role === 'MEMBER') {
      throw new Error('تنها مدیر تعاونی مجاز به حذف گواهی هزینه است.');
    }
    const fee = this.monthlyFees.find(f => f.id === feeId);
    if (!fee) throw new Error('گواهی هزینه یافت نشد.');

    fee.isDeleted = true;
    fee.deletedAt = new Date().toISOString();
    fee.deletedBy = executor.fullName;
    this.persist('monthlyFees', this.monthlyFees);

    this.addAuditLog({
      cooperativeId: fee.cooperativeId,
      userId: executor.id,
      userFullName: executor.fullName,
      userRole: executor.role,
      action: 'DELETE',
      entityType: 'PAYMENT',
      entityId: fee.id,
      description: `حذف ایمن گواهی هزینه «${fee.title}» (انتقال به سطل بازیافت)`,
      newState: undefined
    });
    return true;
  }

  /**
   * ثبت مستقیم پرداخت توسط مدیر تعاونی به نیابت از عضو با امکان تعیین دقیق تاریخ پرداخت
   */
  public recordManagerFeePayment(feeId: string, params: {
    paymentMethod: 'CASH_DESK' | 'CARD_TO_CARD' | 'MANAGER_REGISTERED';
    referenceNumber: string;
    paidAt?: string;
    notes?: string;
  }, executor: { id: string; fullName: string; role: UserRole }): MonthlyFee {
    if (executor.role === 'MEMBER') {
      throw new Error('تنها مدیر مجاز به ثبت مستقیم پرداخت به نیابت از عضو است.');
    }

    const feeIndex = this.monthlyFees.findIndex(f => f.id === feeId);
    if (feeIndex === -1) {
      throw new Error('هزینه مورد نظر یافت نشد.');
    }

    const fee = this.monthlyFees[feeIndex];
    const prevStatus = fee.status;
    const paymentTimestamp = params.paidAt || new Date().toISOString();

    fee.status = 'PAID';
    fee.paidAmountRial = fee.amountRial;
    fee.paidAt = paymentTimestamp;
    fee.paidByManager = true;
    fee.paymentReference = params.referenceNumber.trim();
    if (params.notes) {
      fee.notes = (fee.notes ? fee.notes + ' - ' : '') + params.notes;
    }

    this.monthlyFees[feeIndex] = fee;
    this.persist('monthlyFees', this.monthlyFees);

    // ثبت رکورد پرداخت رسمی در payments
    const newPayment: Payment = {
      id: `pay-mgr-${Date.now()}`,
      cooperativeId: fee.cooperativeId,
      memberId: fee.memberId,
      installmentItemId: fee.id,
      amountRial: fee.amountRial,
      method: params.paymentMethod,
      status: 'APPROVED',
      trackingCode: params.referenceNumber || `MGR-REC-${Date.now().toString().slice(-6)}`,
      gatewayName: 'دفتر تعاونی (تایید مدیر)',
      paidAt: paymentTimestamp,
      createdAt: paymentTimestamp
    };

    this.payments.unshift(newPayment);
    this.persist('payments', this.payments);

    this.addAuditLog({
      cooperativeId: fee.cooperativeId,
      userId: executor.id,
      userFullName: executor.fullName,
      userRole: executor.role,
      action: 'PAYMENT_APPROVED',
      entityType: 'PAYMENT',
      entityId: fee.id,
      description: `تسویه مستقیم هزینه «${fee.title}» به مبلغ ${fee.amountRial.toLocaleString()} ریال توسط مدیر تعاونی در تاریخ ${paymentTimestamp.split('T')[0]}`,
      previousState: { status: prevStatus },
      newState: { status: 'PAID', payment: newPayment }
    });

    return fee;
  }

  // ==========================================
  // مدیریت دسته‌بندی‌های پویا برای هزینه‌ها
  // ==========================================

  public getFeeCategories(cooperativeId?: string): FeeCategoryItem[] {
    const defaults: FeeCategoryItem[] = [
      { id: 'cat-1', name: 'MONTHLY_CHARGE', title: 'شارژ ماهیانه ساختمان' },
      { id: 'cat-2', name: 'ELEVATOR', title: 'سرویس و نگهداری آسانسور' },
      { id: 'cat-3', name: 'SECURITY', title: 'نگهبانی و سرایداری' },
      { id: 'cat-4', name: 'UTILITIES', title: 'قبوض مشترک (آب، برق، گاز)' },
      { id: 'cat-5', name: 'REPAIR', title: 'تعمیرات و تأسیسات اضطراری' },
      { id: 'cat-6', name: 'OTHER', title: 'سایر هزینه‌های مصوب مجمع' },
    ];
    const customs = this.customFeeCategories.filter(c => !cooperativeId || !c.cooperativeId || c.cooperativeId === cooperativeId);
    return [...defaults, ...customs];
  }

  public addFeeCategory(params: { name?: string; title: string; cooperativeId?: string }): FeeCategoryItem {
    const title = params.title.trim();
    if (!title) throw new Error('عنوان دسته‌بندی نمی‌تواند خالی باشد.');
    const id = `cat-custom-${Date.now()}`;
    const name = params.name ? params.name.trim() : `CUSTOM_${Date.now()}`;
    const newItem: FeeCategoryItem = {
      id,
      name,
      title,
      isCustom: true,
      cooperativeId: params.cooperativeId
    };
    this.customFeeCategories.push(newItem);
    this.persist('fee_categories', this.customFeeCategories);
    return newItem;
  }

  // ==========================================
  // مدیریت سطل بازیافت مرکزی و بازیابی داده‌ها (Recycle Bin)
  // ==========================================

  public getRecycleBinItems(coopId?: string | null): RecycleItem[] {
    const items: RecycleItem[] = [];

    // تعاونی‌ها
    this.cooperatives.filter(c => c.isDeleted).forEach(c => {
      items.push({
        id: c.id,
        entityType: 'cooperative',
        entityTypeName: 'تعاونی مسکن',
        title: c.name,
        cooperativeId: c.id,
        cooperativeName: c.name,
        deletedAt: c.deletedAt || new Date().toISOString(),
        deletedBy: c.deletedBy,
        details: `پروژه: ${c.projectName} • ${c.totalUnits} واحد`
      });
    });

    // کاربران
    this.users.filter(u => u.isDeleted).forEach(u => {
      items.push({
        id: u.id,
        entityType: 'user',
        entityTypeName: 'کاربر سیستم',
        title: u.fullName,
        cooperativeId: null,
        deletedAt: u.deletedAt || new Date().toISOString(),
        deletedBy: u.deletedBy,
        details: `کد ملی: ${u.nationalCode} • موبایل: ${u.mobile}`
      });
    });

    // اعضای تعاونی (Memberships)
    this.memberships.filter(m => m.isDeleted).forEach(m => {
      if (coopId && m.cooperativeId !== coopId) return;
      const user = this.users.find(u => u.id === m.userId);
      const coop = this.cooperatives.find(c => c.id === m.cooperativeId);
      items.push({
        id: m.id,
        entityType: 'member',
        entityTypeName: 'عضو تعاونی',
        title: user ? user.fullName : m.membershipNumber,
        cooperativeId: m.cooperativeId,
        cooperativeName: coop?.name,
        deletedAt: m.deletedAt || new Date().toISOString(),
        deletedBy: m.deletedBy,
        details: `شماره عضویت: ${m.membershipNumber} • تعاونی: ${coop?.name || '-'}`
      });
    });

    // واحدها
    this.units.filter(u => u.isDeleted).forEach(u => {
      if (coopId && u.cooperativeId !== coopId) return;
      const coop = this.cooperatives.find(c => c.id === u.cooperativeId);
      items.push({
        id: u.id,
        entityType: 'unit',
        entityTypeName: 'واحد مسکونی',
        title: `واحد ${u.unitNumber} (بلوک ${u.block})`,
        cooperativeId: u.cooperativeId,
        cooperativeName: coop?.name,
        deletedAt: u.deletedAt || new Date().toISOString(),
        deletedBy: u.deletedBy,
        details: `طبقه ${u.floor} • متراژ: ${u.areaM2} م²`
      });
    });

    // برنامه‌های اقساط
    this.installmentPlans.filter(p => p.isDeleted).forEach(p => {
      if (coopId && p.cooperativeId !== coopId) return;
      const coop = this.cooperatives.find(c => c.id === p.cooperativeId);
      items.push({
        id: p.id,
        entityType: 'installmentPlan',
        entityTypeName: 'برنامه اقساط ساختمانی',
        title: p.title,
        cooperativeId: p.cooperativeId,
        cooperativeName: coop?.name,
        deletedAt: p.deletedAt || new Date().toISOString(),
        deletedBy: p.deletedBy,
        details: `مبلغ کل: ${p.totalCostRial.toLocaleString()} ریال`
      });
    });

    // گواهی‌های شارژ و هزینه
    this.monthlyFees.filter(f => f.isDeleted).forEach(f => {
      if (coopId && f.cooperativeId !== coopId) return;
      const coop = this.cooperatives.find(c => c.id === f.cooperativeId);
      items.push({
        id: f.id,
        entityType: 'monthlyFee',
        entityTypeName: 'گواهی هزینه و شارژ',
        title: f.title,
        cooperativeId: f.cooperativeId,
        cooperativeName: coop?.name,
        deletedAt: f.deletedAt || new Date().toISOString(),
        deletedBy: f.deletedBy,
        details: `مبلغ: ${f.amountRial.toLocaleString()} ریال • دوره: ${f.periodYear}/${f.periodMonth}`
      });
    });

    return items.sort((a, b) => new Date(b.deletedAt).getTime() - new Date(a.deletedAt).getTime());
  }

  public restoreItem(entityType: string, id: string, executor: { id: string; fullName: string; role: UserRole }): boolean {
    if (executor.role === 'MEMBER') throw new Error('اعضای عادی اجازه بازیابی اطلاعات را ندارند.');

    let restoredTitle = '';

    if (entityType === 'cooperative') {
      const item = this.cooperatives.find(c => c.id === id);
      if (item) {
        item.isDeleted = false;
        item.deletedAt = undefined;
        item.deletedBy = undefined;
        restoredTitle = item.name;
        this.persist('cooperatives', this.cooperatives);
      }
    } else if (entityType === 'user') {
      const item = this.users.find(u => u.id === id);
      if (item) {
        item.isDeleted = false;
        item.deletedAt = undefined;
        item.deletedBy = undefined;
        restoredTitle = item.fullName;
        this.persist('users', this.users);
      }
    } else if (entityType === 'member') {
      const item = this.memberships.find(m => m.id === id);
      if (item) {
        item.isDeleted = false;
        item.deletedAt = undefined;
        item.deletedBy = undefined;
        restoredTitle = item.membershipNumber;
        this.persist('memberships', this.memberships);
      }
    } else if (entityType === 'unit') {
      const item = this.units.find(u => u.id === id);
      if (item) {
        item.isDeleted = false;
        item.deletedAt = undefined;
        item.deletedBy = undefined;
        restoredTitle = `واحد ${item.unitNumber}`;
        this.persist('units', this.units);
      }
    } else if (entityType === 'installmentPlan') {
      const item = this.installmentPlans.find(p => p.id === id);
      if (item) {
        item.isDeleted = false;
        item.deletedAt = undefined;
        item.deletedBy = undefined;
        restoredTitle = item.title;
        this.persist('installmentPlans', this.installmentPlans);
        this.installmentItems.forEach(i => {
          if (i.planId === id) {
            i.isDeleted = false;
            i.deletedAt = undefined;
          }
        });
        this.persist('installmentItems', this.installmentItems);
      }
    } else if (entityType === 'monthlyFee') {
      const item = this.monthlyFees.find(f => f.id === id);
      if (item) {
        item.isDeleted = false;
        item.deletedAt = undefined;
        item.deletedBy = undefined;
        restoredTitle = item.title;
        this.persist('monthlyFees', this.monthlyFees);
      }
    }

    this.addAuditLog({
      cooperativeId: null,
      userId: executor.id,
      userFullName: executor.fullName,
      userRole: executor.role,
      action: 'UPDATE',
      entityType: 'USER',
      entityId: id,
      description: `بازیابی آیتم «${restoredTitle || id}» از سطل بازیافت`,
      newState: undefined
    });

    return true;
  }

  public permanentDeleteItem(entityType: string, id: string, executor: { id: string; fullName: string; role: UserRole }): boolean {
    if (executor.role !== 'SUPER_ADMIN' && executor.role !== 'COOP_ADMIN') {
      throw new Error('عدم دسترسی جهت حذف دائمی.');
    }

    if (entityType === 'cooperative') {
      this.cooperatives = this.cooperatives.filter(c => c.id !== id);
      this.persist('cooperatives', this.cooperatives);
    } else if (entityType === 'user') {
      this.users = this.users.filter(u => u.id !== id);
      this.persist('users', this.users);
    } else if (entityType === 'member') {
      this.memberships = this.memberships.filter(m => m.id !== id);
      this.persist('memberships', this.memberships);
    } else if (entityType === 'unit') {
      this.units = this.units.filter(u => u.id !== id);
      this.persist('units', this.units);
    } else if (entityType === 'installmentPlan') {
      this.installmentPlans = this.installmentPlans.filter(p => p.id !== id);
      this.installmentItems = this.installmentItems.filter(i => i.planId !== id);
      this.persist('installmentPlans', this.installmentPlans);
      this.persist('installmentItems', this.installmentItems);
    } else if (entityType === 'monthlyFee') {
      this.monthlyFees = this.monthlyFees.filter(f => f.id !== id);
      this.persist('monthlyFees', this.monthlyFees);
    }

    return true;
  }

  public emptyRecycleBin(coopId?: string | null, executor?: { id: string; fullName: string; role: UserRole }): void {
    if (coopId) {
      this.memberships = this.memberships.filter(m => !(m.cooperativeId === coopId && m.isDeleted));
      this.units = this.units.filter(u => !(u.cooperativeId === coopId && u.isDeleted));
      this.installmentPlans = this.installmentPlans.filter(p => !(p.cooperativeId === coopId && p.isDeleted));
      this.installmentItems = this.installmentItems.filter(i => !(i.cooperativeId === coopId && i.isDeleted));
      this.monthlyFees = this.monthlyFees.filter(f => !(f.cooperativeId === coopId && f.isDeleted));
    } else {
      this.cooperatives = this.cooperatives.filter(c => !c.isDeleted);
      this.users = this.users.filter(u => !u.isDeleted);
      this.memberships = this.memberships.filter(m => !m.isDeleted);
      this.units = this.units.filter(u => !u.isDeleted);
      this.installmentPlans = this.installmentPlans.filter(p => !p.isDeleted);
      this.installmentItems = this.installmentItems.filter(i => !i.isDeleted);
      this.monthlyFees = this.monthlyFees.filter(f => !f.isDeleted);
    }

    this.persist('cooperatives', this.cooperatives);
    this.persist('users', this.users);
    this.persist('memberships', this.memberships);
    this.persist('units', this.units);
    this.persist('installmentPlans', this.installmentPlans);
    this.persist('installmentItems', this.installmentItems);
    this.persist('monthlyFees', this.monthlyFees);
  }

  /**
   * ثبت مستقیم پرداخت قسط ساختمانی توسط مدیر تعاونی به نیابت از عضو (تسویه فوری)
   */
  public recordManagerInstallmentPayment(installmentItemId: string, params: {
    amountRial: number;
    paymentMethod: 'CASH_DESK' | 'CARD_TO_CARD' | 'MANAGER_REGISTERED';
    referenceNumber: string;
    notes?: string;
  }, executor: { id: string; fullName: string; role: UserRole }): InstallmentItem {
    if (executor.role === 'MEMBER') {
      throw new Error('تنها مدیر مجاز به ثبت مستقیم پرداخت است.');
    }

    const itemIndex = this.installmentItems.findIndex(i => i.id === installmentItemId);
    if (itemIndex === -1) {
      throw new Error('قسط مورد نظر یافت نشد.');
    }

    const item = this.installmentItems[itemIndex];
    const prevPaid = item.paidAmountRial;
    const payAmount = Math.round(params.amountRial);

    item.paidAmountRial = Math.min(item.amountRial, item.paidAmountRial + payAmount);
    item.status = item.paidAmountRial >= item.amountRial ? 'PAID' : 'PARTIAL';

    this.installmentItems[itemIndex] = item;
    this.persist('installmentItems', this.installmentItems);

    // یافتن عضو متعهد از روی plan
    const plan = this.installmentPlans.find(p => p.id === item.planId);
    const memberId = plan?.memberId || '';

    // ثبت در payments
    const newPayment: Payment = {
      id: `pay-mgr-${Date.now()}`,
      cooperativeId: item.cooperativeId,
      memberId,
      installmentItemId: item.id,
      amountRial: payAmount,
      method: params.paymentMethod,
      status: 'APPROVED',
      trackingCode: params.referenceNumber || `MGR-REC-${Date.now().toString().slice(-6)}`,
      gatewayName: 'دفتر تعاونی (تسویه مستقیم مدیر)',
      paidAt: new Date().toISOString(),
      createdAt: new Date().toISOString()
    };

    this.payments.unshift(newPayment);
    this.persist('payments', this.payments);

    this.addAuditLog({
      cooperativeId: item.cooperativeId,
      userId: executor.id,
      userFullName: executor.fullName,
      userRole: executor.role,
      action: 'PAYMENT_APPROVED',
      entityType: 'PAYMENT',
      entityId: item.id,
      description: `ثبت واریزی مستقیم قسط «${item.stageTitle}» به مبلغ ${payAmount.toLocaleString()} ریال توسط مدیر تعاونی`,
      previousState: { paidAmountRial: prevPaid },
      newState: { paidAmountRial: item.paidAmountRial, status: item.status }
    });

    return item;
  }

  // ==========================================
  // متدهای فاز ۳: پرداخت آنلاین ساندباکس و گردش‌کار فیش‌های دستی
  // ==========================================

  public getPayments(activeCoopId: string | null, isSuperAdmin: boolean, memberId?: string): Payment[] {
    return this.payments.filter(p => {
      const coopMatch = isSuperAdmin && !activeCoopId ? true : p.cooperativeId === activeCoopId;
      const memberMatch = memberId ? p.memberId === memberId : true;
      return coopMatch && memberMatch;
    });
  }

  public getReceipts(activeCoopId: string | null, isSuperAdmin: boolean): Receipt[] {
    return this.receipts.filter(r => {
      return isSuperAdmin && !activeCoopId ? true : r.cooperativeId === activeCoopId;
    });
  }

  public getPaymentById(paymentId: string): Payment | undefined {
    return this.payments.find(p => p.id === paymentId);
  }

  public getReceiptByPaymentId(paymentId: string): Receipt | undefined {
    return this.receipts.find(r => r.paymentId === paymentId);
  }

  /**
   * پرداخت آنلاین ساندباکس (شبیه‌ساز شاپرک / به‌پرداخت / سداد / زرین‌پال)
   */
  public createOnlineSandboxPayment(params: {
    cooperativeId: string;
    memberId: string;
    targetType: 'INSTALLMENT' | 'MONTHLY_FEE';
    targetId: string;
    amountRial: number;
    gatewayName: string;
    cardMasked?: string;
  }, executor: { id: string; fullName: string; role: UserRole }): { payment: Payment; trackingCode: string } {
    const trackingCode = `TRX-SND-${Date.now().toString().slice(-6)}${Math.floor(Math.random() * 900 + 100)}`;
    const paidAt = new Date().toISOString();

    const newPayment: Payment = {
      id: `pay-online-${Date.now()}`,
      cooperativeId: params.cooperativeId,
      memberId: params.memberId,
      installmentItemId: params.targetId,
      amountRial: Math.round(params.amountRial),
      method: 'ONLINE_SANDBOX',
      status: 'SUCCESS',
      trackingCode,
      gatewayName: params.gatewayName || 'ساندباکس شاپرک',
      paidAt,
      createdAt: paidAt
    };

    // اعمال تسویه مالی بر روی آیتم مقصد
    if (params.targetType === 'INSTALLMENT') {
      const itemIndex = this.installmentItems.findIndex(i => i.id === params.targetId);
      if (itemIndex !== -1) {
        const item = this.installmentItems[itemIndex];
        const newPaid = Math.min(item.amountRial, item.paidAmountRial + newPayment.amountRial);
        item.paidAmountRial = newPaid;
        item.status = newPaid >= item.amountRial ? 'PAID' : 'PARTIAL';
        this.installmentItems[itemIndex] = item;
        this.persist('installmentItems', this.installmentItems);
      }
    } else if (params.targetType === 'MONTHLY_FEE') {
      const feeIndex = this.monthlyFees.findIndex(f => f.id === params.targetId);
      if (feeIndex !== -1) {
        const fee = this.monthlyFees[feeIndex];
        fee.status = 'PAID';
        fee.paidAmountRial = fee.amountRial;
        fee.paidAt = paidAt;
        fee.paymentReference = trackingCode;
        this.monthlyFees[feeIndex] = fee;
        this.persist('monthlyFees', this.monthlyFees);
      }
    }

    this.payments.unshift(newPayment);
    this.persist('payments', this.payments);

    this.addAuditLog({
      cooperativeId: params.cooperativeId,
      userId: executor.id,
      userFullName: executor.fullName,
      userRole: executor.role,
      action: 'PAYMENT_APPROVED',
      entityType: 'PAYMENT',
      entityId: newPayment.id,
      description: `پرداخت آنلاین موفق درگاه ساندباکس به مبلغ ${newPayment.amountRial.toLocaleString()} ریال (کد رهگیری: ${trackingCode})`,
      newState: newPayment
    });

    return { payment: newPayment, trackingCode };
  }

  /**
   * بارگذاری و ثبت فیش پرداخت آفلاین (واریز دستی / کارت به کارت / پایا / ساتنا)
   */
  public submitOfflineReceiptPayment(params: {
    cooperativeId: string;
    memberId: string;
    targetType: 'INSTALLMENT' | 'MONTHLY_FEE';
    targetId: string;
    amountRial: number;
    bankName: string;
    referenceNumber: string;
    depositDate: string;
    depositTime?: string;
    depositAccount?: string;
    fileUrl: string;
    originalFileName: string;
    mimeType?: string;
    fileSizeBytes?: number;
  }, executor: { id: string; fullName: string; role: UserRole }): { payment: Payment; receipt: Receipt } {
    const cleanRef = params.referenceNumber.trim();

    // بررسی عدم تکراری بودن شماره پیگیری فیش در این تعاونی
    const isDuplicate = this.receipts.some(r => 
      r.cooperativeId === params.cooperativeId && 
      r.referenceNumber.toLowerCase() === cleanRef.toLowerCase()
    );

    if (isDuplicate) {
      throw new Error(`شماره پیگیری «${cleanRef}» قبلاً در سامانه ثبت شده است. از بارگذاری فیش تکراری خودداری نمایید.`);
    }

    const payId = `pay-rec-${Date.now()}`;
    const recId = `rec-${Date.now()}`;
    const now = new Date().toISOString();

    const newPayment: Payment = {
      id: payId,
      cooperativeId: params.cooperativeId,
      memberId: params.memberId,
      installmentItemId: params.targetId,
      amountRial: Math.round(params.amountRial),
      method: 'OFFLINE_RECEIPT',
      status: 'PENDING_APPROVAL',
      trackingCode: cleanRef,
      gatewayName: `فیش دستی (${params.bankName})`,
      paidAt: params.depositDate,
      createdAt: now
    };

    const newReceipt: Receipt = {
      id: recId,
      paymentId: payId,
      cooperativeId: params.cooperativeId,
      fileUrl: params.fileUrl,
      originalFileName: params.originalFileName || 'receipt.jpg',
      mimeType: params.mimeType || 'image/jpeg',
      fileSizeBytes: params.fileSizeBytes || 250000,
      bankName: params.bankName,
      referenceNumber: cleanRef,
      depositDate: params.depositDate,
      depositTime: params.depositTime,
      depositAccount: params.depositAccount
    };

    this.payments.unshift(newPayment);
    this.receipts.unshift(newReceipt);

    this.persist('payments', this.payments);
    this.persist('receipts', this.receipts);

    this.addAuditLog({
      cooperativeId: params.cooperativeId,
      userId: executor.id,
      userFullName: executor.fullName,
      userRole: executor.role,
      action: 'PAYMENT_SUBMITTED',
      entityType: 'RECEIPT',
      entityId: recId,
      description: `ثبت فیش واریز دستی به مبلغ ${newPayment.amountRial.toLocaleString()} ریال (شماره ارجاع: ${cleanRef}) جهت بررسی مدیر تعاونی`,
      newState: { payment: newPayment, receipt: newReceipt }
    });

    return { payment: newPayment, receipt: newReceipt };
  }

  /**
   * تایید فیش واریزی توسط مدیر تعاونی و ثبت در حسابداری (Approve Receipt)
   */
  public approveReceiptPayment(paymentId: string, executor: { id: string; fullName: string; role: UserRole }): { payment: Payment; receipt: Receipt } {
    if (executor.role === 'MEMBER') {
      throw new Error('تنها مدیران تعاونی مجاز به تایید فیش واریزی هستند.');
    }

    const payIndex = this.payments.findIndex(p => p.id === paymentId);
    if (payIndex === -1) {
      throw new Error('رکورد پرداخت مورد نظر یافت نشد.');
    }

    const payment = this.payments[payIndex];
    if (payment.status === 'APPROVED' || payment.status === 'SUCCESS') {
      throw new Error('این پرداخت قبلاً تایید شده است.');
    }

    const recIndex = this.receipts.findIndex(r => r.paymentId === paymentId);
    if (recIndex === -1) {
      throw new Error('رسید فیش مربوط به این پرداخت یافت نشد.');
    }

    const receipt = this.receipts[recIndex];
    const now = new Date().toISOString();

    // به‌روزرسانی پرداخت و رسید
    payment.status = 'APPROVED';
    receipt.reviewedBy = executor.id;
    receipt.reviewedAt = now;
    receipt.rejectReason = undefined;

    this.payments[payIndex] = payment;
    this.receipts[recIndex] = receipt;

    // اعمال تسویه مالی بر روی آیتم مقصد
    const instItemIndex = this.installmentItems.findIndex(i => i.id === payment.installmentItemId);
    if (instItemIndex !== -1) {
      const item = this.installmentItems[instItemIndex];
      const newPaid = Math.min(item.amountRial, item.paidAmountRial + payment.amountRial);
      item.paidAmountRial = newPaid;
      item.status = newPaid >= item.amountRial ? 'PAID' : 'PARTIAL';
      this.installmentItems[instItemIndex] = item;
      this.persist('installmentItems', this.installmentItems);
    } else {
      const feeIndex = this.monthlyFees.findIndex(f => f.id === payment.installmentItemId);
      if (feeIndex !== -1) {
        const fee = this.monthlyFees[feeIndex];
        fee.status = 'PAID';
        fee.paidAmountRial = fee.amountRial;
        fee.paidAt = now;
        fee.paymentReference = receipt.referenceNumber;
        this.monthlyFees[feeIndex] = fee;
        this.persist('monthlyFees', this.monthlyFees);
      }
    }

    this.persist('payments', this.payments);
    this.persist('receipts', this.receipts);

    this.addAuditLog({
      cooperativeId: payment.cooperativeId,
      userId: executor.id,
      userFullName: executor.fullName,
      userRole: executor.role,
      action: 'PAYMENT_APPROVED',
      entityType: 'PAYMENT',
      entityId: payment.id,
      description: `تایید رسمی فیش بانکی شماره «${receipt.referenceNumber}» به مبلغ ${payment.amountRial.toLocaleString()} ریال توسط مدیر تعاونی`,
      newState: { payment, receipt }
    });

    return { payment, receipt };
  }

  /**
   * رد فیش واریزی توسط مدیر تعاونی با ثبت دلیل رسمی (Reject Receipt)
   */
  public rejectReceiptPayment(paymentId: string, reason: string, executor: { id: string; fullName: string; role: UserRole }): { payment: Payment; receipt: Receipt } {
    if (executor.role === 'MEMBER') {
      throw new Error('تنها مدیران تعاونی مجاز به بررسی و رد فیش هستند.');
    }

    const cleanReason = reason?.trim();
    if (!cleanReason) {
      throw new Error('لطفاً دلیل رد فیش واریزی را ذکر فرمایید.');
    }

    const payIndex = this.payments.findIndex(p => p.id === paymentId);
    if (payIndex === -1) {
      throw new Error('رکورد پرداخت مورد نظر یافت نشد.');
    }

    const payment = this.payments[payIndex];
    const recIndex = this.receipts.findIndex(r => r.paymentId === paymentId);
    if (recIndex === -1) {
      throw new Error('رسید فیش مربوط به این پرداخت یافت نشد.');
    }

    const receipt = this.receipts[recIndex];
    const now = new Date().toISOString();

    payment.status = 'REJECTED';
    receipt.reviewedBy = executor.id;
    receipt.reviewedAt = now;
    receipt.rejectReason = cleanReason;

    this.payments[payIndex] = payment;
    this.receipts[recIndex] = receipt;

    this.persist('payments', this.payments);
    this.persist('receipts', this.receipts);

    this.addAuditLog({
      cooperativeId: payment.cooperativeId,
      userId: executor.id,
      userFullName: executor.fullName,
      userRole: executor.role,
      action: 'PAYMENT_REJECTED',
      entityType: 'PAYMENT',
      entityId: payment.id,
      description: `رد فیش بانکی شماره «${receipt.referenceNumber}» توسط مدیر تعاونی به دلیل: «${cleanReason}»`,
      newState: { payment, receipt, reason: cleanReason }
    });

    return { payment, receipt };
  }

  // ثبت لاگ
  public addAuditLog(log: Omit<AuditLog, 'id' | 'timestamp'>) {
    const newLog: AuditLog = {
      ...log,
      id: `log-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toISOString()
    };
    this.auditLogs.unshift(newLog);
    this.persist('auditLogs', this.auditLogs);
  }

  public getAuditLogs(coopId: string | null, isSuperAdmin: boolean): AuditLog[] {
    return this.auditLogs.filter(l => {
      if (isSuperAdmin && !coopId) return true;
      return l.cooperativeId === coopId || l.cooperativeId === null;
    });
  }

  // ==========================================
  // متدهای مهاجرت، پشتیبان‌گیری و همگام‌سازی (Migration & Export)
  // ==========================================

  public exportDatabaseJson(): string {
    const payload = {
      version: '2.0',
      exportedAt: new Date().toISOString(),
      database: 'PostgreSQL-Compatible-MaskanYar',
      data: {
        cooperatives: this.cooperatives,
        users: this.users,
        memberships: this.memberships,
        units: this.units,
        installmentPlans: this.installmentPlans,
        installmentItems: this.installmentItems,
        payments: this.payments,
        receipts: this.receipts,
        announcements: this.announcements,
        auditLogs: this.auditLogs,
        monthlyFees: this.monthlyFees
      }
    };
    return JSON.stringify(payload, null, 2);
  }

  public importDatabaseJson(jsonStr: string): { success: boolean; message: string; count?: number } {
    try {
      const parsed = JSON.parse(jsonStr);
      const data = parsed.data || parsed;

      if (!data.cooperatives || !data.users) {
        return { success: false, message: 'ساختار فایل پشتیبان معتبر نیست.' };
      }

      this.cooperatives = data.cooperatives || [];
      this.users = data.users || [];
      this.memberships = data.memberships || [];
      this.units = data.units || [];
      this.installmentPlans = data.installmentPlans || [];
      this.installmentItems = data.installmentItems || [];
      this.payments = data.payments || [];
      this.receipts = data.receipts || [];
      this.announcements = data.announcements || [];
      this.auditLogs = data.auditLogs || [];
      this.monthlyFees = data.monthlyFees || [];

      this.persist('cooperatives', this.cooperatives);
      this.persist('users', this.users);
      this.persist('memberships', this.memberships);
      this.persist('units', this.units);
      this.persist('installmentPlans', this.installmentPlans);
      this.persist('installmentItems', this.installmentItems);
      this.persist('payments', this.payments);
      this.persist('receipts', this.receipts);
      this.persist('announcements', this.announcements);
      this.persist('auditLogs', this.auditLogs);
      this.persist('monthlyFees', this.monthlyFees);

      return {
        success: true,
        message: 'بازیابی اطلاعات با موفقیت انجام شد و تمام موجودیت‌ها به‌روزرسانی شدند.'
      };
    } catch (e: any) {
      return { success: false, message: `خطا در بازخوانی فایل JSON: ${e.message}` };
    }
  }

  public async syncToSupabase(supabaseClient: any): Promise<{ success: boolean; logs: string[] }> {
    const logs: string[] = [];
    if (!supabaseClient) {
      return { success: false, logs: ['کلاینت Supabase متصل نیست. لطفا کلیدها را بررسی کنید.'] };
    }

    try {
      // ۱. تعاونی‌ها
      logs.push('در حال ارسال تعاونی‌ها به Supabase...');
      const coopsPayload = this.cooperatives.map(c => ({
        id: c.id,
        name: c.name,
        code: c.code,
        project_name: c.projectName,
        address: c.address,
        total_units: c.totalUnits,
        bank_name: c.bankAccountInfo.bankName,
        account_number: c.bankAccountInfo.accountNumber,
        sheba_number: c.bankAccountInfo.shebaNumber,
        card_holder_name: c.bankAccountInfo.cardHolderName,
        is_active: c.isActive
      }));
      const { error: errCoop } = await supabaseClient.from('cooperatives').upsert(coopsPayload);
      if (errCoop) throw new Error(`خطای درج تعاونی‌ها: ${errCoop.message}`);
      logs.push(`✅ ${coopsPayload.length} تعاونی در جدول cooperatives ثبت/به‌روز شد.`);

      // ۲. کاربران
      logs.push('در حال ارسال کاربران...');
      const usersPayload = this.users.map(u => ({
        id: u.id,
        mobile: u.mobile,
        full_name: u.fullName,
        national_code: u.nationalCode,
        father_name: u.fatherName || null,
        avatar_url: u.avatarUrl || null,
        is_active: u.isActive
      }));
      const { error: errUser } = await supabaseClient.from('users').upsert(usersPayload);
      if (errUser) throw new Error(`خطای درج کاربران: ${errUser.message}`);
      logs.push(`✅ ${usersPayload.length} کاربر در جدول users ثبت/به‌روز شد.`);

      // ۳. عضویت‌ها
      logs.push('در حال ارسال عضویت‌ها...');
      const memsPayload = this.memberships.map(m => ({
        id: m.id,
        user_id: m.userId,
        cooperative_id: m.cooperativeId,
        role: m.role,
        membership_number: m.membershipNumber,
        is_active: m.isActive
      }));
      const { error: errMem } = await supabaseClient.from('memberships').upsert(memsPayload);
      if (errMem) throw new Error(`خطای درج عضویت‌ها: ${errMem.message}`);
      logs.push(`✅ ${memsPayload.length} عضویت در جدول memberships ثبت/به‌روز شد.`);

      // ۴. واحدها
      logs.push('در حال ارسال واحدها...');
      const unitsPayload = this.units.map(u => ({
        id: u.id,
        cooperative_id: u.cooperativeId,
        unit_number: u.unitNumber,
        block: u.block,
        floor: u.floor,
        area_m2: u.areaM2,
        parking_number: u.parkingNumber || null,
        storage_number: u.storageNumber || null,
        assigned_member_id: u.assignedMemberId || null,
        status: u.status
      }));
      const { error: errUnits } = await supabaseClient.from('units').upsert(unitsPayload);
      if (errUnits) throw new Error(`خطای درج واحدها: ${errUnits.message}`);
      logs.push(`✅ ${unitsPayload.length} واحد ساختمانی در جدول units ثبت شد.`);

      // ۵. برنامه‌های اقساط
      logs.push('در حال ارسال برنامه‌های اقساط...');
      const plansPayload = this.installmentPlans.map(p => ({
        id: p.id,
        cooperative_id: p.cooperativeId,
        unit_id: p.unitId,
        member_id: p.memberId,
        title: p.title,
        total_cost_rial: p.totalCostRial
      }));
      const { error: errPlans } = await supabaseClient.from('installment_plans').upsert(plansPayload);
      if (errPlans) throw new Error(`خطای درج برنامه‌های اقساط: ${errPlans.message}`);
      logs.push(`✅ ${plansPayload.length} برنامه اقساط در installment_plans ثبت شد.`);

      // ۶. ریز اقساط
      logs.push('در حال ارسال ریز اقساط...');
      const itemsPayload = this.installmentItems.map(item => ({
        id: item.id,
        plan_id: item.planId,
        cooperative_id: item.cooperativeId,
        stage: item.stage,
        stage_title: item.stageTitle,
        due_date: item.dueDate,
        amount_rial: item.amountRial,
        paid_amount_rial: item.paidAmountRial,
        status: item.status,
        penalty_per_day_rial: item.penaltyPerDayRial || 0
      }));
      const { error: errItems } = await supabaseClient.from('installment_items').upsert(itemsPayload);
      if (errItems) throw new Error(`خطای درج اقساط: ${errItems.message}`);
      logs.push(`✅ ${itemsPayload.length} قسط در installment_items ثبت شد.`);

      // ۷. هزینه‌های جاری ماهانه
      logs.push('در حال ارسال هزینه‌های جاری و شارژ ساختمان...');
      const feesPayload = this.monthlyFees.map(f => ({
        id: f.id,
        cooperative_id: f.cooperativeId,
        unit_id: f.unitId || null,
        member_id: f.memberId,
        title: f.title,
        amount_rial: f.amountRial,
        due_date: f.dueDate,
        period_month: f.periodMonth,
        period_year: f.periodYear,
        fee_category: f.feeCategory,
        status: f.status,
        paid_amount_rial: f.paidAmountRial,
        paid_at: f.paidAt || null,
        paid_by_manager: f.paidByManager || false,
        payment_reference: f.paymentReference || null,
        notes: f.notes || null
      }));
      const { error: errFees } = await supabaseClient.from('monthly_fees').upsert(feesPayload);
      if (errFees) throw new Error(`خطای درج هزینه‌ها: ${errFees.message}`);
      logs.push(`✅ ${feesPayload.length} ردیف شارژ و هزینه ماهانه در monthly_fees ثبت شد.`);

      // ۸. اطلاعیه‌ها
      logs.push('در حال ارسال اطلاعیه‌ها...');
      const annPayload = this.announcements.map(a => ({
        id: a.id,
        cooperative_id: a.cooperativeId || null,
        author_id: a.authorId,
        title: a.title,
        content: a.content,
        priority: a.priority,
        view_count: a.viewCount
      }));
      const { error: errAnn } = await supabaseClient.from('announcements').upsert(annPayload);
      if (errAnn) throw new Error(`خطای درج اطلاعیه‌ها: ${errAnn.message}`);
      logs.push(`✅ ${annPayload.length} اطلاعیه در announcements ثبت شد.`);

      logs.push('🎉 همگام‌سازی کامل به پایان رسید! تمام داده‌ها اکنون در پایگاه داده ابری Supabase مستقر هستند.');
      return { success: true, logs };
    } catch (err: any) {
      logs.push(`❌ عملیات همگام‌سازی ناموفق بود: ${err.message}`);
      return { success: false, logs };
    }
  }

  /**
   * بارخوانی و دریافت تمام داده‌ها از Supabase PostgreSQL به کلاینت (Pull)
   */
  public async pullFromSupabase(supabaseClient?: any): Promise<{
    success: boolean;
    counts: Record<string, number>;
    logs: string[];
  }> {
    const client = supabaseClient || getSupabaseClient();
    const logs: string[] = [];
    const counts: Record<string, number> = {};

    if (!client) {
      return {
        success: false,
        counts,
        logs: ['کلاینت Supabase متصل نیست. لطفا آدرس و کلید عمومی را در بخش تنظیمات دیتابیس ثبت کنید.']
      };
    }

    try {
      logs.push('شروع بارخوانی داده‌ها از جداول PostgreSQL Supabase...');

      // ۱. تعاونی‌ها
      const { data: dbCoops, error: errCoop } = await client.from('cooperatives').select('*');
      if (errCoop) {
        if (errCoop.code === '42P01') {
          throw new Error('جداول در دیتابیس Supabase هنوز ایجاد نشده‌اند. ابتدا اسکریپت ساخت جداول را اجرا فرمایید.');
        }
        throw new Error(`خطای دریافت تعاونی‌ها: ${errCoop.message}`);
      }
      if (dbCoops && dbCoops.length > 0) {
        this.cooperatives = dbCoops.map((c: any) => ({
          id: c.id,
          name: c.name,
          code: c.code,
          projectName: c.project_name || c.projectName,
          address: c.address,
          totalUnits: Number(c.total_units || c.totalUnits || 0),
          bankAccountInfo: {
            bankName: c.bank_name || c.bankName || '',
            accountNumber: c.account_number || c.accountNumber || '',
            shebaNumber: c.sheba_number || c.shebaNumber || '',
            cardHolderName: c.card_holder_name || c.cardHolderName || ''
          },
          isActive: c.is_active ?? true,
          createdAt: c.created_at || new Date().toISOString()
        }));
        counts['cooperatives'] = this.cooperatives.length;
        this.persist('cooperatives', this.cooperatives);
        logs.push(`✅ دریافت ${this.cooperatives.length} تعاونی از دیتابیس.`);
      }

      // ۲. کاربران
      const { data: dbUsers, error: errUsers } = await client.from('users').select('*');
      if (errUsers) throw new Error(`خطای دریافت کاربران: ${errUsers.message}`);
      if (dbUsers && dbUsers.length > 0) {
        this.users = dbUsers.map((u: any) => ({
          id: u.id,
          mobile: u.mobile,
          fullName: u.full_name || u.fullName,
          nationalCode: u.national_code || u.nationalCode,
          fatherName: u.father_name || u.fatherName,
          avatarUrl: u.avatar_url || u.avatarUrl,
          isActive: u.is_active ?? true,
          createdAt: u.created_at || new Date().toISOString(),
          updatedAt: u.updated_at || new Date().toISOString()
        }));
        counts['users'] = this.users.length;
        this.persist('users', this.users);
        logs.push(`✅ دریافت ${this.users.length} کاربر از دیتابیس.`);
      }

      // ۳. عضویت‌ها
      const { data: dbMems, error: errMems } = await client.from('memberships').select('*');
      if (errMems) throw new Error(`خطای دریافت عضویت‌ها: ${errMems.message}`);
      if (dbMems && dbMems.length > 0) {
        this.memberships = dbMems.map((m: any) => ({
          id: m.id,
          userId: m.user_id || m.userId,
          cooperativeId: m.cooperative_id || m.cooperativeId,
          role: m.role,
          membershipNumber: m.membership_number || m.membershipNumber,
          isActive: m.is_active ?? true,
          joinedAt: m.joined_at || new Date().toISOString()
        }));
        counts['memberships'] = this.memberships.length;
        this.persist('memberships', this.memberships);
        logs.push(`✅ دریافت ${this.memberships.length} عضویت از دیتابیس.`);
      }

      // ۴. واحدها
      const { data: dbUnits, error: errUnits } = await client.from('units').select('*');
      if (!errUnits && dbUnits && dbUnits.length > 0) {
        this.units = dbUnits.map((u: any) => ({
          id: u.id,
          cooperativeId: u.cooperative_id || u.cooperativeId,
          unitNumber: u.unit_number || u.unitNumber,
          block: u.block,
          floor: Number(u.floor || 0),
          areaM2: Number(u.area_m2 || u.areaM2 || 0),
          parkingNumber: u.parking_number || u.parkingNumber,
          storageNumber: u.storage_number || u.storageNumber,
          assignedMemberId: u.assigned_member_id || u.assignedMemberId,
          status: u.status
        }));
        counts['units'] = this.units.length;
        this.persist('units', this.units);
        logs.push(`✅ دریافت ${this.units.length} واحد از دیتابیس.`);
      }

      this.notifyListeners();
      logs.push('🎉 اطلاعات با موفقیت از دیتابیس PostgreSQL سرور بازخوانی شد!');
      return { success: true, counts, logs };
    } catch (err: any) {
      logs.push(`❌ خطا در بارخوانی از سرور: ${err.message}`);
      return { success: false, counts, logs };
    }
  }
}

export const dataService = new DataService();
