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

// =========================================================================
// ۱. کاربران سامانه (مدیر ارشد، مدیران تعاونی، حسابدار و اعضا)
// =========================================================================

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

export const coopManager1: User = {
  id: 'user-manager-negin',
  mobile: '09121112233',
  fullName: 'مهندس حمیدرضا تهرانی',
  nationalCode: '0079812345',
  fatherName: 'محمد',
  avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
  isActive: true,
  createdAt: '2024-01-05T09:00:00Z',
  updatedAt: '2024-01-05T09:00:00Z'
};

export const coopManager2: User = {
  id: 'user-manager-mehr',
  mobile: '09129998877',
  fullName: 'دکتر محسن ناصری',
  nationalCode: '0061234567',
  fatherName: 'ابراهیم',
  avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
  isActive: true,
  createdAt: '2024-01-10T10:00:00Z',
  updatedAt: '2024-01-10T10:00:00Z'
};

export const coopAccountant1: User = {
  id: 'user-accountant-negin',
  mobile: '09122223344',
  fullName: 'خانم سارا رستگار',
  nationalCode: '0065432198',
  fatherName: 'بهروز',
  avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
  isActive: true,
  createdAt: '2024-01-12T11:00:00Z',
  updatedAt: '2024-01-12T11:00:00Z'
};

export const memberUser1: User = {
  id: 'user-member-sadeghi',
  mobile: '09123334455',
  fullName: 'مهندس رضا صادقی',
  nationalCode: '0081234567',
  fatherName: 'اسدالله',
  avatarUrl: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80',
  isActive: true,
  createdAt: '2024-01-15T10:00:00Z',
  updatedAt: '2024-01-15T10:00:00Z'
};

export const memberUser2: User = {
  id: 'user-member-ahmadi',
  mobile: '09124445566',
  fullName: 'دکتر مریم احمدی',
  nationalCode: '0054321987',
  fatherName: 'کامبیز',
  avatarUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
  isActive: true,
  createdAt: '2024-01-20T14:30:00Z',
  updatedAt: '2024-01-20T14:30:00Z'
};

export const memberUser3: User = {
  id: 'user-member-karimi',
  mobile: '09125556677',
  fullName: 'آقای علی کریمی',
  nationalCode: '0043219876',
  fatherName: 'حسن',
  avatarUrl: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150&auto=format&fit=crop&q=80',
  isActive: true,
  createdAt: '2024-02-01T08:15:00Z',
  updatedAt: '2024-02-01T08:15:00Z'
};

export const seedUsers: User[] = [
  superAdminUser,
  coopManager1,
  coopManager2,
  coopAccountant1,
  memberUser1,
  memberUser2,
  memberUser3
];

// =========================================================================
// ۲. تعاونی‌های مسکن (Cooperatives)
// =========================================================================

export const coop1: Cooperative = {
  id: 'coop-negin-alborz',
  name: 'تعاونی مسکن اساتید و نخبگان - نگین البرز',
  code: 'COOP-NEGIN',
  projectName: 'برج مسکونی نگین البرز (منطقه ۲۲)',
  address: 'تهران، انتهای بزرگراه همت غرب، شمال دریاچه شهدای خلیج فارس، بلوار کوهک',
  totalUnits: 84,
  bankAccountInfo: {
    bankName: 'بانک ملت (شعبه مستقل مرکزی)',
    accountNumber: '4829103847',
    shebaNumber: 'IR650120000000004829103847',
    cardHolderName: 'تعاونی مسکن نگین البرز'
  },
  isActive: true,
  createdAt: '2024-01-02T08:00:00Z'
};

export const coop2: Cooperative = {
  id: 'coop-omid-mehregan',
  name: 'تعاونی مسکن امید پرسنل - مجتمع مهرگان',
  code: 'COOP-MEHR',
  projectName: 'پروژه ۱۲۰ واحدی مسکونی مهرگان',
  address: 'تهران، سعادت‌آباد، خیابان صرافهای شمالی، کوچه هفدهم',
  totalUnits: 120,
  bankAccountInfo: {
    bankName: 'بانک ملی ایران (شعبه دانشگاه)',
    accountNumber: '0105829104008',
    shebaNumber: 'IR8201700000000105829104008',
    cardHolderName: 'تعاونی مسکن امید پرسنل'
  },
  isActive: true,
  createdAt: '2024-01-08T09:30:00Z'
};

export const seedCooperatives: Cooperative[] = [coop1, coop2];

// =========================================================================
// ۳. عضویت‌ها در تعاونی‌ها (Memberships)
// =========================================================================

export const seedMemberships: Membership[] = [
  // عضویت سراسری سوپر ادمین
  {
    id: 'mem-superadmin',
    userId: 'user-superadmin',
    cooperativeId: 'GLOBAL',
    role: 'SUPER_ADMIN',
    membershipNumber: 'ADMIN-001',
    isActive: true,
    joinedAt: '2024-01-01T08:00:00Z'
  },
  // مدیر تعاونی نگین البرز
  {
    id: 'mem-manager-negin',
    userId: 'user-manager-negin',
    cooperativeId: 'coop-negin-alborz',
    role: 'COOP_ADMIN',
    membershipNumber: 'DIR-01',
    isActive: true,
    joinedAt: '2024-01-05T09:00:00Z'
  },
  // حسابدار تعاونی نگین البرز
  {
    id: 'mem-acc-negin',
    userId: 'user-accountant-negin',
    cooperativeId: 'coop-negin-alborz',
    role: 'COOP_ADMIN',
    membershipNumber: 'ACC-01',
    isActive: true,
    joinedAt: '2024-01-12T11:00:00Z'
  },
  // عضو ۱ (مهندس صادقی) - تعاونی نگین البرز
  {
    id: 'mem-sadeghi',
    userId: 'user-member-sadeghi',
    cooperativeId: 'coop-negin-alborz',
    role: 'MEMBER',
    membershipNumber: 'MBR-1012',
    isActive: true,
    joinedAt: '2024-01-15T10:00:00Z'
  },
  // عضو ۲ (دکتر احمدی) - تعاونی نگین البرز
  {
    id: 'mem-ahmadi',
    userId: 'user-member-ahmadi',
    cooperativeId: 'coop-negin-alborz',
    role: 'MEMBER',
    membershipNumber: 'MBR-1025',
    isActive: true,
    joinedAt: '2024-01-20T14:30:00Z'
  },
  // عضو ۳ (آقای کریمی) - تعاونی نگین البرز
  {
    id: 'mem-karimi',
    userId: 'user-member-karimi',
    cooperativeId: 'coop-negin-alborz',
    role: 'MEMBER',
    membershipNumber: 'MBR-1006',
    isActive: true,
    joinedAt: '2024-02-01T08:15:00Z'
  },
  // مدیر تعاونی مهرگان
  {
    id: 'mem-manager-mehr',
    userId: 'user-manager-mehr',
    cooperativeId: 'coop-omid-mehregan',
    role: 'COOP_ADMIN',
    membershipNumber: 'DIR-02',
    isActive: true,
    joinedAt: '2024-01-10T10:00:00Z'
  }
];

// =========================================================================
// ۴. واحدهای مسکونی (Residential Units)
// =========================================================================

export const seedUnits: Unit[] = [
  {
    id: 'unit-12',
    cooperativeId: 'coop-negin-alborz',
    unitNumber: '12',
    block: 'A',
    floor: 4,
    areaM2: 115,
    parkingNumber: 'P-12',
    storageNumber: 'S-04',
    assignedMemberId: 'mem-sadeghi',
    status: 'ASSIGNED',
    createdAt: '2024-01-16T08:00:00Z'
  },
  {
    id: 'unit-25',
    cooperativeId: 'coop-negin-alborz',
    unitNumber: '25',
    block: 'B',
    floor: 7,
    areaM2: 140,
    parkingNumber: 'P-25',
    storageNumber: 'S-12',
    assignedMemberId: 'mem-ahmadi',
    status: 'ASSIGNED',
    createdAt: '2024-01-20T08:00:00Z'
  },
  {
    id: 'unit-06',
    cooperativeId: 'coop-negin-alborz',
    unitNumber: '06',
    block: 'A',
    floor: 2,
    areaM2: 95,
    parkingNumber: 'P-06',
    storageNumber: 'S-02',
    assignedMemberId: 'mem-karimi',
    status: 'ASSIGNED',
    createdAt: '2024-02-01T08:00:00Z'
  },
  {
    id: 'unit-18',
    cooperativeId: 'coop-negin-alborz',
    unitNumber: '18',
    block: 'A',
    floor: 6,
    areaM2: 125,
    parkingNumber: 'P-18',
    storageNumber: 'S-07',
    assignedMemberId: undefined,
    status: 'AVAILABLE',
    createdAt: '2024-01-16T08:00:00Z'
  },
  {
    id: 'unit-30',
    cooperativeId: 'coop-negin-alborz',
    unitNumber: '30',
    block: 'B',
    floor: 8,
    areaM2: 160,
    parkingNumber: 'P-30',
    storageNumber: 'S-15',
    assignedMemberId: undefined,
    status: 'AVAILABLE',
    createdAt: '2024-01-16T08:00:00Z'
  },
  {
    id: 'unit-mehr-01',
    cooperativeId: 'coop-omid-mehregan',
    unitNumber: '101',
    block: '1',
    floor: 1,
    areaM2: 105,
    parkingNumber: 'P-01',
    storageNumber: 'S-01',
    assignedMemberId: undefined,
    status: 'AVAILABLE',
    createdAt: '2024-01-10T09:00:00Z'
  }
];

// =========================================================================
// ۵. برنامه‌های اقساط ساختمانی (Installment Plans)
// =========================================================================

export const seedInstallmentPlans: InstallmentPlan[] = [
  {
    id: 'plan-unit-12',
    cooperativeId: 'coop-negin-alborz',
    unitId: 'unit-12',
    memberId: 'mem-sadeghi',
    title: 'قرارداد ساخت واحد ۱۲ - برج نگین البرز',
    totalCostRial: 4500000000, // ۴۵۰ میلیون تومان
    createdAt: '2024-01-16T08:00:00Z'
  },
  {
    id: 'plan-unit-25',
    cooperativeId: 'coop-negin-alborz',
    unitId: 'unit-25',
    memberId: 'mem-ahmadi',
    title: 'قرارداد ساخت واحد ۲۵ - برج نگین البرز',
    totalCostRial: 6000000000, // ۶۰۰ میلیون تومان
    createdAt: '2024-01-21T09:00:00Z'
  },
  {
    id: 'plan-unit-06',
    cooperativeId: 'coop-negin-alborz',
    unitId: 'unit-06',
    memberId: 'mem-karimi',
    title: 'قرارداد ساخت واحد ۶ - برج نگین البرز',
    totalCostRial: 3800000000, // ۳۸۰ میلیون تومان
    createdAt: '2024-02-02T10:00:00Z'
  }
];

// =========================================================================
// ۶. اقساط سررسید شده ساختمانی (Installment Items)
// =========================================================================

export const seedInstallmentItems: InstallmentItem[] = [
  // اقساط واحد ۱۲ (مهندس صادقی) - وضعیت بسیار عالی
  {
    id: 'item-12-1',
    planId: 'plan-unit-12',
    cooperativeId: 'coop-negin-alborz',
    stage: 'LAND_SHARE',
    stageTitle: 'قسط اول: سهم زمین، تغییر کاربری و پروانه ساخت',
    dueDate: '2024-02-15T00:00:00Z',
    amountRial: 1200000000,
    paidAmountRial: 1200000000,
    status: 'PAID'
  },
  {
    id: 'item-12-2',
    planId: 'plan-unit-12',
    cooperativeId: 'coop-negin-alborz',
    stage: 'FOUNDATION',
    stageTitle: 'قسط دوم: گودبرداری، نیلینگ و بتن‌ریزی فونداسیون',
    dueDate: '2024-05-15T00:00:00Z',
    amountRial: 1000000000,
    paidAmountRial: 1000000000,
    status: 'PAID'
  },
  {
    id: 'item-12-3',
    planId: 'plan-unit-12',
    cooperativeId: 'coop-negin-alborz',
    stage: 'ROUGH_CONSTRUCTION',
    stageTitle: 'قسط سوم: اسکلت بتنی و سقف‌های مجتمع',
    dueDate: '2024-09-15T00:00:00Z',
    amountRial: 1100000000,
    paidAmountRial: 1100000000,
    status: 'PAID'
  },
  {
    id: 'item-12-4',
    planId: 'plan-unit-12',
    cooperativeId: 'coop-negin-alborz',
    stage: 'FACILITIES',
    stageTitle: 'قسط چهارم: لوله‌کشی و تأسیسات مکانیکی و برقی',
    dueDate: '2026-11-20T00:00:00Z',
    amountRial: 700000000,
    paidAmountRial: 0,
    status: 'PENDING'
  },
  {
    id: 'item-12-5',
    planId: 'plan-unit-12',
    cooperativeId: 'coop-negin-alborz',
    stage: 'FINISHING',
    stageTitle: 'قسط پنجم: نازک‌کاری، آسانسور و تحویل کلید',
    dueDate: '2027-04-15T00:00:00Z',
    amountRial: 500000000,
    paidAmountRial: 0,
    status: 'PENDING'
  },

  // اقساط واحد ۲۵ (دکتر احمدی) - شامل معوقه جهت نمایش چارت‌های مالی و آلارم‌ها
  {
    id: 'item-25-1',
    planId: 'plan-unit-25',
    cooperativeId: 'coop-negin-alborz',
    stage: 'LAND_SHARE',
    stageTitle: 'قسط اول: سهم زمین و جواز ساخت',
    dueDate: '2024-02-15T00:00:00Z',
    amountRial: 1800000000,
    paidAmountRial: 1800000000,
    status: 'PAID'
  },
  {
    id: 'item-25-2',
    planId: 'plan-unit-25',
    cooperativeId: 'coop-negin-alborz',
    stage: 'FOUNDATION',
    stageTitle: 'قسط دوم: گودبرداری و اجرای فونداسیون',
    dueDate: '2024-06-01T00:00:00Z',
    amountRial: 1400000000,
    paidAmountRial: 1400000000,
    status: 'PAID'
  },
  {
    id: 'item-25-3',
    planId: 'plan-unit-25',
    cooperativeId: 'coop-negin-alborz',
    stage: 'ROUGH_CONSTRUCTION',
    stageTitle: 'قسط سوم: اسکلت، سفت‌کاری و تیغه‌چینی',
    dueDate: '2024-10-01T00:00:00Z', // سررسید گذشته (معوقه)
    amountRial: 1300000000,
    paidAmountRial: 300000000, // ۱۰۰۰ میلیون ریال مانده معوق
    status: 'OVERDUE'
  },
  {
    id: 'item-25-4',
    planId: 'plan-unit-25',
    cooperativeId: 'coop-negin-alborz',
    stage: 'FACILITIES',
    stageTitle: 'قسط چهارم: موتورخانه و تأسیسات',
    dueDate: '2026-12-15T00:00:00Z',
    amountRial: 800000000,
    paidAmountRial: 0,
    status: 'PENDING'
  },
  {
    id: 'item-25-5',
    planId: 'plan-unit-25',
    cooperativeId: 'coop-negin-alborz',
    stage: 'FINISHING',
    stageTitle: 'قسط پنجم: نمای رومی و تحویل سند',
    dueDate: '2027-05-15T00:00:00Z',
    amountRial: 700000000,
    paidAmountRial: 0,
    status: 'PENDING'
  },

  // اقساط واحد ۶ (آقای کریمی)
  {
    id: 'item-06-1',
    planId: 'plan-unit-06',
    cooperativeId: 'coop-negin-alborz',
    stage: 'LAND_SHARE',
    stageTitle: 'قسط اول: سهم زمین و جواز ساخت',
    dueDate: '2024-03-01T00:00:00Z',
    amountRial: 1100000000,
    paidAmountRial: 1100000000,
    status: 'PAID'
  },
  {
    id: 'item-06-2',
    planId: 'plan-unit-06',
    cooperativeId: 'coop-negin-alborz',
    stage: 'FOUNDATION',
    stageTitle: 'قسط دوم: فونداسیون و بتن‌ریزی',
    dueDate: '2024-07-01T00:00:00Z',
    amountRial: 900000000,
    paidAmountRial: 900000000,
    status: 'PAID'
  },
  {
    id: 'item-06-3',
    planId: 'plan-unit-06',
    cooperativeId: 'coop-negin-alborz',
    stage: 'ROUGH_CONSTRUCTION',
    stageTitle: 'قسط سوم: اسکلت و سقف‌ها',
    dueDate: '2026-11-15T00:00:00Z',
    amountRial: 950000000,
    paidAmountRial: 0,
    status: 'PENDING'
  },
  {
    id: 'item-06-4',
    planId: 'plan-unit-06',
    cooperativeId: 'coop-negin-alborz',
    stage: 'FACILITIES',
    stageTitle: 'قسط چهارم: تأسیسات',
    dueDate: '2027-02-15T00:00:00Z',
    amountRial: 850000000,
    paidAmountRial: 0,
    status: 'PENDING'
  }
];

// =========================================================================
// ۷. شارژ و هزینه‌های جاری ماهانه (Monthly Fees)
// =========================================================================

export const seedMonthlyFees: MonthlyFee[] = [
  {
    id: 'fee-01',
    cooperativeId: 'coop-negin-alborz',
    memberId: 'mem-sadeghi',
    title: 'شارژ ماهیانه ساختمان و نگهبانی - مهر ۱۴۰۳',
    amountRial: 8500000,
    paidAmountRial: 8500000,
    dueDate: '2024-10-20T00:00:00Z',
    periodMonth: 7,
    periodYear: 1403,
    status: 'PAID',
    feeCategory: 'MONTHLY_CHARGE',
    paidAt: '2024-10-18T14:20:00Z',
    paymentReference: 'TRX-SND-984210',
    createdAt: '2024-10-01T08:00:00Z'
  },
  {
    id: 'fee-02',
    cooperativeId: 'coop-negin-alborz',
    memberId: 'mem-sadeghi',
    title: 'شارژ ماهیانه ساختمان و خدمات - آبان ۱۴۰۳',
    amountRial: 8500000,
    paidAmountRial: 8500000,
    dueDate: '2024-11-20T00:00:00Z',
    periodMonth: 8,
    periodYear: 1403,
    status: 'PAID',
    feeCategory: 'MONTHLY_CHARGE',
    paidAt: '2024-11-19T10:15:00Z',
    paymentReference: 'TRX-SND-119284',
    createdAt: '2024-11-01T08:00:00Z'
  },
  {
    id: 'fee-03',
    cooperativeId: 'coop-negin-alborz',
    memberId: 'mem-sadeghi',
    title: 'سرویس و بیمه آسانسورهای پروژه',
    amountRial: 12000000,
    paidAmountRial: 0,
    dueDate: '2026-11-10T00:00:00Z',
    periodMonth: 8,
    periodYear: 1405,
    status: 'PENDING',
    feeCategory: 'ELEVATOR',
    createdAt: '2026-10-01T09:00:00Z'
  },
  {
    id: 'fee-04',
    cooperativeId: 'coop-negin-alborz',
    memberId: 'mem-ahmadi',
    title: 'شارژ ماهیانه مجتمع - مهر ۱۴۰۳',
    amountRial: 8500000,
    paidAmountRial: 8500000,
    dueDate: '2024-10-20T00:00:00Z',
    periodMonth: 7,
    periodYear: 1403,
    status: 'PAID',
    feeCategory: 'MONTHLY_CHARGE',
    paidAt: '2024-10-22T16:00:00Z',
    paidByManager: true,
    paymentReference: 'کارت‌به‌کارت بانک ملت ۷۲۸۱',
    createdAt: '2024-10-01T08:00:00Z'
  },
  {
    id: 'fee-05',
    cooperativeId: 'coop-negin-alborz',
    memberId: 'mem-ahmadi',
    title: 'شارژ ماهیانه مجتمع - آبان ۱۴۰۳',
    amountRial: 8500000,
    paidAmountRial: 0,
    dueDate: '2024-11-20T00:00:00Z',
    periodMonth: 8,
    periodYear: 1403,
    status: 'PENDING',
    feeCategory: 'MONTHLY_CHARGE',
    createdAt: '2024-11-01T08:00:00Z'
  },
  {
    id: 'fee-06',
    cooperativeId: 'coop-negin-alborz',
    memberId: 'mem-karimi',
    title: 'شارژ ماهیانه ساختمان - مهر ۱۴۰۳',
    amountRial: 8500000,
    paidAmountRial: 8500000,
    dueDate: '2024-10-20T00:00:00Z',
    periodMonth: 7,
    periodYear: 1403,
    status: 'PAID',
    feeCategory: 'MONTHLY_CHARGE',
    paidAt: '2024-10-19T09:40:00Z',
    paymentReference: 'TRX-SND-447192',
    createdAt: '2024-10-01T08:00:00Z'
  }
];

// =========================================================================
// ۸. تراکنش‌های مالی و پرداخت‌ها (Payments)
// =========================================================================

export const seedPayments: Payment[] = [
  {
    id: 'pay-online-01',
    cooperativeId: 'coop-negin-alborz',
    memberId: 'mem-sadeghi',
    installmentItemId: 'item-12-1',
    amountRial: 1200000000,
    method: 'ONLINE_SANDBOX',
    status: 'SUCCESS',
    trackingCode: 'TRX-SND-98432101',
    gatewayName: 'درگاه به‌پرداخت ملت',
    paidAt: '2024-02-14T11:20:00Z',
    createdAt: '2024-02-14T11:20:00Z'
  },
  {
    id: 'pay-online-02',
    cooperativeId: 'coop-negin-alborz',
    memberId: 'mem-sadeghi',
    installmentItemId: 'item-12-2',
    amountRial: 1000000000,
    method: 'ONLINE_SANDBOX',
    status: 'SUCCESS',
    trackingCode: 'TRX-SND-98432102',
    gatewayName: 'درگاه سداد ملی',
    paidAt: '2024-05-12T16:45:00Z',
    createdAt: '2024-05-12T16:45:00Z'
  },
  {
    id: 'pay-rec-01',
    cooperativeId: 'coop-negin-alborz',
    memberId: 'mem-ahmadi',
    installmentItemId: 'item-25-1',
    amountRial: 1800000000,
    method: 'OFFLINE_RECEIPT',
    status: 'SUCCESS',
    trackingCode: '847291039',
    gatewayName: 'فیش واریز ساتنا (بانک سامان)',
    paidAt: '2024-02-10T10:00:00Z',
    createdAt: '2024-02-10T10:00:00Z'
  },
  // یک فقره فیش در انتظار تایید برای نمایش در کارتابل مدیر
  {
    id: 'pay-rec-pending-01',
    cooperativeId: 'coop-negin-alborz',
    memberId: 'mem-ahmadi',
    installmentItemId: 'item-25-3',
    amountRial: 300000000,
    method: 'OFFLINE_RECEIPT',
    status: 'PENDING_APPROVAL',
    trackingCode: '554182903',
    gatewayName: 'فیش دستی بانک پاسارگاد',
    paidAt: '2026-10-18T12:00:00Z',
    createdAt: '2026-10-18T12:00:00Z'
  }
];

// =========================================================================
// ۹. فیش‌های واریزی پیوست‌شده (Receipts)
// =========================================================================

export const seedReceipts: Receipt[] = [
  {
    id: 'rec-01',
    paymentId: 'pay-rec-01',
    cooperativeId: 'coop-negin-alborz',
    fileUrl: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=600&auto=format&fit=crop&q=80',
    originalFileName: 'fish-variz-satna-1800m.jpg',
    mimeType: 'image/jpeg',
    fileSizeBytes: 345000,
    bankName: 'بانک سامان',
    referenceNumber: '847291039',
    depositDate: '1402/11/21',
    depositTime: '10:15',
    depositAccount: 'IR650120000000004829103847',
    reviewedBy: 'مهندس حمیدرضا تهرانی',
    reviewedAt: '2024-02-11T12:00:00Z'
  },
  {
    id: 'rec-pending-01',
    paymentId: 'pay-rec-pending-01',
    cooperativeId: 'coop-negin-alborz',
    fileUrl: 'https://images.unsplash.com/photo-1554224154-26032ffc0d07?w=600&auto=format&fit=crop&q=80',
    originalFileName: 'fish-pasargad-300m.jpg',
    mimeType: 'image/jpeg',
    fileSizeBytes: 280000,
    bankName: 'بانک پاسارگاد',
    referenceNumber: '554182903',
    depositDate: '1405/07/26',
    depositTime: '11:45',
    depositAccount: 'IR650120000000004829103847'
  }
];

// =========================================================================
// ۱۰. اطلاعیه‌های رسمی تعاونی (Announcements)
// =========================================================================

export const seedAnnouncements: Announcement[] = [
  {
    id: 'anc-01',
    cooperativeId: 'coop-negin-alborz',
    authorId: 'user-manager-negin',
    title: 'گزارش پیشرفت عملیات اسکلت بتنی بلوک‌های A و B',
    content: 'به اطلاع اعضای محترم پروژه نگین البرز می‌رساند عملیات بتن‌ریزی سقف طبقه ششم با موفقیت به اتمام رسید. اعضای محترم لطفاً نسبت به تسویه اقساط سررسید شده اقدام فرمایند.',
    priority: 'IMPORTANT',
    publishedAt: '2024-10-05T10:00:00Z',
    viewCount: 42
  },
  {
    id: 'anc-02',
    cooperativeId: 'coop-negin-alborz',
    authorId: 'user-manager-negin',
    title: 'اطلاعیه مجمع عمومی فوق‌العاده نوبت دوم',
    content: 'مجمع عمومی سالیانه تعاونی در محل سالن اجتماعات پروژه در تاریخ جمعه ۲۵ آبان ساعت ۱۰ صبح برگزار خواهد شد.',
    priority: 'URGENT',
    publishedAt: '2024-10-15T14:00:00Z',
    viewCount: 58
  }
];

// =========================================================================
// ۱۱. لاگ‌های امنیتی و حسابرسی سامانه (Audit Logs)
// =========================================================================

export const seedAuditLogs: AuditLog[] = [
  {
    id: 'log-01',
    cooperativeId: null,
    userId: 'user-superadmin',
    userFullName: DEFAULT_ADMIN_NAME,
    userRole: 'SUPER_ADMIN',
    action: 'CREATE',
    entityType: 'USER',
    entityId: 'user-superadmin',
    description: `راه‌اندازی اولیه سامانه مسکن‌یار با شماره ${DEFAULT_ADMIN_MOBILE}`,
    ipAddress: '127.0.0.1',
    timestamp: '2024-01-01T08:00:00Z'
  },
  {
    id: 'log-02',
    cooperativeId: 'coop-negin-alborz',
    userId: 'user-superadmin',
    userFullName: DEFAULT_ADMIN_NAME,
    userRole: 'SUPER_ADMIN',
    action: 'CREATE',
    entityType: 'USER',
    entityId: 'coop-negin-alborz',
    description: 'ثبت و راه‌اندازی تعاونی مسکن نگین البرز و تعریف بانک عامل ملت',
    ipAddress: '192.168.1.10',
    timestamp: '2024-01-02T08:30:00Z'
  },
  {
    id: 'log-03',
    cooperativeId: 'coop-negin-alborz',
    userId: 'user-superadmin',
    userFullName: DEFAULT_ADMIN_NAME,
    userRole: 'SUPER_ADMIN',
    action: 'CREATE',
    entityType: 'USER',
    entityId: 'user-manager-negin',
    description: 'انتصاب مهندس حمیدرضا تهرانی به عنوان مدیر اجرایی تعاونی نگین البرز',
    ipAddress: '192.168.1.10',
    timestamp: '2024-01-05T09:15:00Z'
  },
  {
    id: 'log-04',
    cooperativeId: 'coop-negin-alborz',
    userId: 'user-manager-negin',
    userFullName: 'مهندس حمیدرضا تهرانی',
    userRole: 'COOP_ADMIN',
    action: 'CREATE',
    entityType: 'UNIT',
    entityId: 'unit-12',
    description: 'تخصیص قطعی واحد ۱۲ بلوک A به مهندس رضا صادقی',
    ipAddress: '178.252.189.44',
    timestamp: '2024-01-16T08:15:00Z'
  },
  {
    id: 'log-05',
    cooperativeId: 'coop-negin-alborz',
    userId: 'user-member-sadeghi',
    userFullName: 'مهندس رضا صادقی',
    userRole: 'MEMBER',
    action: 'PAYMENT_APPROVED',
    entityType: 'PAYMENT',
    entityId: 'pay-online-01',
    description: 'پرداخت آنلاین موفق قسط اول سهم زمین به مبلغ ۱,۲۰۰,۰۰۰,۰۰۰ ریال (کد رهگیری: TRX-SND-98432101)',
    ipAddress: '5.120.44.12',
    timestamp: '2024-02-14T11:20:00Z'
  },
  {
    id: 'log-06',
    cooperativeId: 'coop-negin-alborz',
    userId: 'user-manager-negin',
    userFullName: 'مهندس حمیدرضا تهرانی',
    userRole: 'COOP_ADMIN',
    action: 'UPDATE',
    entityType: 'PAYMENT',
    entityId: 'rec-01',
    description: 'تایید فیش بانکی ساتنا خانم دکتر مریم احمدی به مبلغ ۱,۸۰۰,۰۰۰,۰۰۰ ریال و تسویه قسط اول',
    ipAddress: '178.252.189.44',
    timestamp: '2024-02-11T12:00:00Z'
  }
];
