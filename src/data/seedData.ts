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
  AuditLog
} from '../types/database';

// ۱. لیست ۳ تعاونی مسکن
export const seedCooperatives: Cooperative[] = [
  {
    id: 'coop-1',
    name: 'تعاونی مسکن فرهنگیان منطقه ۵ تهران',
    code: 'MASKAN-FARHANG-05',
    projectName: 'پروژه مسکونی مروارید چیتگر',
    address: 'تهران، منطقه ۲۲، دریاچه شهدای خلیج فارس، میدان ساحل، برج مروارید',
    totalUnits: 48,
    bankAccountInfo: {
      bankName: 'بانک ملی ایران',
      accountNumber: '۰۱۰۸۴۵۶۷۸۹۰۰۳',
      shebaNumber: 'IR640170000000108456789003',
      cardHolderName: 'تعاونی مسکن فرهنگیان'
    },
    isActive: true,
    createdAt: '2024-01-15T08:00:00Z'
  },
  {
    id: 'coop-2',
    name: 'تعاونی مسکن کادر درمان بیمارستان رازی',
    code: 'MASKAN-RAZI-MED',
    projectName: 'پروژه مسکونی یاسمن الهیه',
    address: 'تهران، شمیرانات، الهیه، خیابان فرشته، بن‌بست یاسمن، پروژه کادر درمان',
    totalUnits: 64,
    bankAccountInfo: {
      bankName: 'بانک ملت',
      accountNumber: '۴۷۵۸۲۹۳۰۱۱',
      shebaNumber: 'IR82012000000004758293011',
      cardHolderName: 'تعاونی مسکن کادر درمان رازی'
    },
    isActive: true,
    createdAt: '2024-03-01T08:00:00Z'
  },
  {
    id: 'coop-3',
    name: 'تعاونی مسکن کارکنان گروه صنعتی پارس',
    code: 'MASKAN-PARS-IND',
    projectName: 'پروژه بزرگ البرز فردیس',
    address: 'کرج، فردیس، بلوار شهدای فردیس، مجتمع مسکونی البرز پارس',
    totalUnits: 120,
    bankAccountInfo: {
      bankName: 'بانک صادرات ایران',
      accountNumber: '۰۲۰۹۸۷۶۵۴۳۰۰۵',
      shebaNumber: 'IR450190000000209876543005',
      cardHolderName: 'تعاونی مسکن گروه صنعتی پارس'
    },
    isActive: true,
    createdAt: '2024-05-10T08:00:00Z'
  }
];

// ۲. کاربران سامانه (شامل مدیر کل، مدیران تعاونی و ۱۰ عضو)
export const seedUsers: User[] = [
  // مدیر کل (سوپر ادمین کلیه تعاونی‌ها)
  {
    id: 'user-superadmin',
    mobile: '09121111111',
    fullName: 'مهندس محمدرضا شایسته',
    nationalCode: '0080000010',
    fatherName: 'احمد',
    avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80',
    isActive: true,
    createdAt: '2024-01-01T08:00:00Z',
    updatedAt: '2024-01-01T08:00:00Z'
  },
  // مدیر تعاونی ۱ (فرهنگیان)
  {
    id: 'user-admin-coop1',
    mobile: '09122222222',
    fullName: 'دکتر علیرضا مهدوی',
    nationalCode: '0012345679',
    fatherName: 'حسین',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    isActive: true,
    createdAt: '2024-01-15T08:00:00Z',
    updatedAt: '2024-01-15T08:00:00Z'
  },
  // مدیر تعاونی ۲ (کادر درمان)
  {
    id: 'user-admin-coop2',
    mobile: '09123333333',
    fullName: 'سرکار خانم دکتر سارا کریمی',
    nationalCode: '0021345678',
    fatherName: 'محسن',
    avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    isActive: true,
    createdAt: '2024-03-01T08:00:00Z',
    updatedAt: '2024-03-01T08:00:00Z'
  },
  // مدیر تعاونی ۳ (گروه صنعتی پارس)
  {
    id: 'user-admin-coop3',
    mobile: '09124444444',
    fullName: 'مهندس حمید صفوی',
    nationalCode: '1270000012',
    fatherName: 'اصغر',
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    isActive: true,
    createdAt: '2024-05-10T08:00:00Z',
    updatedAt: '2024-05-10T08:00:00Z'
  },
  // ۱۰ عضو تعاونی‌ها (اعضای واقعی با اطلاعات کامل)
  {
    id: 'user-member-1',
    mobile: '09125555501',
    fullName: 'علی مرادی',
    nationalCode: '0031245683',
    fatherName: 'عباس',
    avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
    isActive: true,
    createdAt: '2024-01-20T10:00:00Z',
    updatedAt: '2024-01-20T10:00:00Z'
  },
  {
    id: 'user-member-2',
    mobile: '09125555502',
    fullName: 'مریم حسینی',
    nationalCode: '0041235671',
    fatherName: 'جواد',
    avatarUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
    isActive: true,
    createdAt: '2024-01-22T11:00:00Z',
    updatedAt: '2024-01-22T11:00:00Z'
  },
  {
    id: 'user-member-3',
    mobile: '09125555503',
    fullName: 'حسین کاظمی',
    nationalCode: '0052345677',
    fatherName: 'اکبر',
    avatarUrl: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80',
    isActive: true,
    createdAt: '2024-02-01T09:00:00Z',
    updatedAt: '2024-02-01T09:00:00Z'
  },
  {
    id: 'user-member-4',
    mobile: '09125555504',
    fullName: 'فاطمه ابراهیمی',
    nationalCode: '0063456782',
    fatherName: 'مهدی',
    avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
    isActive: true,
    createdAt: '2024-02-05T14:00:00Z',
    updatedAt: '2024-02-05T14:00:00Z'
  },
  {
    id: 'user-member-5',
    mobile: '09125555505',
    fullName: 'رضا نوری',
    nationalCode: '0074567898',
    fatherName: 'امیر',
    avatarUrl: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150&auto=format&fit=crop&q=80',
    isActive: true,
    createdAt: '2024-03-05T08:30:00Z',
    updatedAt: '2024-03-05T08:30:00Z'
  },
  {
    id: 'user-member-6',
    mobile: '09125555506',
    fullName: 'زهرا صادقی',
    nationalCode: '0085678903',
    fatherName: 'محمد',
    avatarUrl: 'https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?w=150&auto=format&fit=crop&q=80',
    isActive: true,
    createdAt: '2024-03-10T12:00:00Z',
    updatedAt: '2024-03-10T12:00:00Z'
  },
  {
    id: 'user-member-7',
    mobile: '09125555507',
    fullName: 'امید نجفی',
    nationalCode: '0096789019',
    fatherName: 'بهروز',
    avatarUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&auto=format&fit=crop&q=80',
    isActive: true,
    createdAt: '2024-03-15T16:00:00Z',
    updatedAt: '2024-03-15T16:00:00Z'
  },
  {
    id: 'user-member-8',
    mobile: '09125555508',
    fullName: 'الهام قاسم‌زاده',
    nationalCode: '0450123451',
    fatherName: 'سید تقی',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    isActive: true,
    createdAt: '2024-05-15T11:00:00Z',
    updatedAt: '2024-05-15T11:00:00Z'
  },
  {
    id: 'user-member-9',
    mobile: '09125555509',
    fullName: 'مهدی تهرانی',
    nationalCode: '0451234567',
    fatherName: 'داوود',
    avatarUrl: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=150&auto=format&fit=crop&q=80',
    isActive: true,
    createdAt: '2024-05-20T09:30:00Z',
    updatedAt: '2024-05-20T09:30:00Z'
  },
  {
    id: 'user-member-10',
    mobile: '09125555510',
    fullName: 'سارا باقری',
    nationalCode: '0452345672',
    fatherName: 'کامران',
    avatarUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
    isActive: true,
    createdAt: '2024-05-25T13:45:00Z',
    updatedAt: '2024-05-25T13:45:00Z'
  }
];

// ۳. پیوند عضویت کاربران در تعاونی‌ها (Membership)
export const seedMemberships: Membership[] = [
  // مدیر کل در سطح سیستم دسترسی به همه دارد، اما رکورد سازمانی نیز دارد
  { id: 'mem-super', userId: 'user-superadmin', cooperativeId: 'coop-1', role: 'SUPER_ADMIN', membershipNumber: 'SA-001', joinedAt: '2024-01-01T08:00:00Z', isActive: true },
  
  // مدیران هر تعاونی
  { id: 'mem-admin-1', userId: 'user-admin-coop1', cooperativeId: 'coop-1', role: 'COOP_ADMIN', membershipNumber: 'ADM-101', joinedAt: '2024-01-15T08:00:00Z', isActive: true },
  { id: 'mem-admin-2', userId: 'user-admin-coop2', cooperativeId: 'coop-2', role: 'COOP_ADMIN', membershipNumber: 'ADM-201', joinedAt: '2024-03-01T08:00:00Z', isActive: true },
  { id: 'mem-admin-3', userId: 'user-admin-coop3', cooperativeId: 'coop-3', role: 'COOP_ADMIN', membershipNumber: 'ADM-301', joinedAt: '2024-05-10T08:00:00Z', isActive: true },

  // اعضای تعاونی ۱ (فرهنگیان - ۴ عضو)
  { id: 'mem-c1-u1', userId: 'user-member-1', cooperativeId: 'coop-1', role: 'MEMBER', membershipNumber: 'FARHANG-101', joinedAt: '2024-01-20T10:00:00Z', isActive: true },
  { id: 'mem-c1-u2', userId: 'user-member-2', cooperativeId: 'coop-1', role: 'MEMBER', membershipNumber: 'FARHANG-102', joinedAt: '2024-01-22T11:00:00Z', isActive: true },
  { id: 'mem-c1-u3', userId: 'user-member-3', cooperativeId: 'coop-1', role: 'MEMBER', membershipNumber: 'FARHANG-103', joinedAt: '2024-02-01T09:00:00Z', isActive: true },
  { id: 'mem-c1-u4', userId: 'user-member-4', cooperativeId: 'coop-1', role: 'MEMBER', membershipNumber: 'FARHANG-104', joinedAt: '2024-02-05T14:00:00Z', isActive: true },

  // اعضای تعاونی ۲ (کادر درمان - ۳ عضو)
  { id: 'mem-c2-u5', userId: 'user-member-5', cooperativeId: 'coop-2', role: 'MEMBER', membershipNumber: 'RAZI-201', joinedAt: '2024-03-05T08:30:00Z', isActive: true },
  { id: 'mem-c2-u6', userId: 'user-member-6', cooperativeId: 'coop-2', role: 'MEMBER', membershipNumber: 'RAZI-202', joinedAt: '2024-03-10T12:00:00Z', isActive: true },
  { id: 'mem-c2-u7', userId: 'user-member-7', cooperativeId: 'coop-2', role: 'MEMBER', membershipNumber: 'RAZI-203', joinedAt: '2024-03-15T16:00:00Z', isActive: true },

  // اعضای تعاونی ۳ (گروه صنعتی پارس - ۳ عضو)
  { id: 'mem-c3-u8', userId: 'user-member-8', cooperativeId: 'coop-3', role: 'MEMBER', membershipNumber: 'PARS-301', joinedAt: '2024-05-15T11:00:00Z', isActive: true },
  { id: 'mem-c3-u9', userId: 'user-member-9', cooperativeId: 'coop-3', role: 'MEMBER', membershipNumber: 'PARS-302', joinedAt: '2024-05-20T09:30:00Z', isActive: true },
  { id: 'mem-c3-u10', userId: 'user-member-10', cooperativeId: 'coop-3', role: 'MEMBER', membershipNumber: 'PARS-303', joinedAt: '2024-05-25T13:45:00Z', isActive: true }
];

// ۴. واحدهای ساختمانی (Units)
export const seedUnits: Unit[] = [
  // واحدهای تعاونی ۱ (پروژه مروارید چیتگر)
  { id: 'unit-101', cooperativeId: 'coop-1', unitNumber: '۱۰۱', block: 'A', floor: 1, areaM2: 95.5, parkingNumber: 'P-12', storageNumber: 'S-04', assignedMemberId: 'mem-c1-u1', status: 'ASSIGNED', createdAt: '2024-01-16T08:00:00Z' },
  { id: 'unit-102', cooperativeId: 'coop-1', unitNumber: '۱۰۲', block: 'A', floor: 1, areaM2: 110.0, parkingNumber: 'P-13', storageNumber: 'S-05', assignedMemberId: 'mem-c1-u2', status: 'ASSIGNED', createdAt: '2024-01-16T08:00:00Z' },
  { id: 'unit-201', cooperativeId: 'coop-1', unitNumber: '۲۰۱', block: 'A', floor: 2, areaM2: 95.5, parkingNumber: 'P-22', storageNumber: 'S-14', assignedMemberId: 'mem-c1-u3', status: 'ASSIGNED', createdAt: '2024-01-16T08:00:00Z' },
  { id: 'unit-202', cooperativeId: 'coop-1', unitNumber: '۲۰۲', block: 'A', floor: 2, areaM2: 125.0, parkingNumber: 'P-23', storageNumber: 'S-15', assignedMemberId: 'mem-c1-u4', status: 'ASSIGNED', createdAt: '2024-01-16T08:00:00Z' },
  { id: 'unit-301', cooperativeId: 'coop-1', unitNumber: '۳۰۱', block: 'A', floor: 3, areaM2: 110.0, parkingNumber: 'P-31', storageNumber: 'S-21', status: 'AVAILABLE', createdAt: '2024-01-16T08:00:00Z' },

  // واحدهای تعاونی ۲ (پروژه یاسمن الهیه)
  { id: 'unit-y101', cooperativeId: 'coop-2', unitNumber: '۱۰۱', block: 'یاس', floor: 1, areaM2: 140.0, parkingNumber: 'P1-08', storageNumber: 'ST-01', assignedMemberId: 'mem-c2-u5', status: 'ASSIGNED', createdAt: '2024-03-02T08:00:00Z' },
  { id: 'unit-y201', cooperativeId: 'coop-2', unitNumber: '۲۰۱', block: 'یاس', floor: 2, areaM2: 165.0, parkingNumber: 'P1-12', storageNumber: 'ST-06', assignedMemberId: 'mem-c2-u6', status: 'ASSIGNED', createdAt: '2024-03-02T08:00:00Z' },
  { id: 'unit-y301', cooperativeId: 'coop-2', unitNumber: '۳۰۱', block: 'یاس', floor: 3, areaM2: 180.0, parkingNumber: 'P2-03', storageNumber: 'ST-11', assignedMemberId: 'mem-c2-u7', status: 'ASSIGNED', createdAt: '2024-03-02T08:00:00Z' },

  // واحدهای تعاونی ۳ (پروژه البرز فردیس)
  { id: 'unit-a1', cooperativeId: 'coop-3', unitNumber: '۱', block: 'B1', floor: 1, areaM2: 85.0, parkingNumber: 'PRK-01', storageNumber: 'ANB-01', assignedMemberId: 'mem-c3-u8', status: 'ASSIGNED', createdAt: '2024-05-12T08:00:00Z' },
  { id: 'unit-a2', cooperativeId: 'coop-3', unitNumber: '۲', block: 'B1', floor: 1, areaM2: 90.0, parkingNumber: 'PRK-02', storageNumber: 'ANB-02', assignedMemberId: 'mem-c3-u9', status: 'ASSIGNED', createdAt: '2024-05-12T08:00:00Z' },
  { id: 'unit-a3', cooperativeId: 'coop-3', unitNumber: '۳', block: 'B1', floor: 2, areaM2: 85.0, parkingNumber: 'PRK-03', storageNumber: 'ANB-03', assignedMemberId: 'mem-c3-u10', status: 'ASSIGNED', createdAt: '2024-05-12T08:00:00Z' }
];

// ۵. برنامه‌های اقساط (InstallmentPlan)
export const seedInstallmentPlans: InstallmentPlan[] = [
  { id: 'plan-c1-u1', cooperativeId: 'coop-1', unitId: 'unit-101', memberId: 'mem-c1-u1', title: 'برنامه اقساط ساخت واحد ۱۰۱ مروارید', totalCostRial: 18000000000, createdAt: '2024-01-21T08:00:00Z' },
  { id: 'plan-c1-u2', cooperativeId: 'coop-1', unitId: 'unit-102', memberId: 'mem-c1-u2', title: 'برنامه اقساط ساخت واحد ۱۰۲ مروارید', totalCostRial: 21000000000, createdAt: '2024-01-23T08:00:00Z' },
  { id: 'plan-c1-u3', cooperativeId: 'coop-1', unitId: 'unit-201', memberId: 'mem-c1-u3', title: 'برنامه اقساط ساخت واحد ۲۰۱ مروارید', totalCostRial: 18000000000, createdAt: '2024-02-02T08:00:00Z' },
  { id: 'plan-c1-u4', cooperativeId: 'coop-1', unitId: 'unit-202', memberId: 'mem-c1-u4', title: 'برنامه اقساط ساخت واحد ۲۰۲ مروارید', totalCostRial: 24000000000, createdAt: '2024-02-06T08:00:00Z' },

  { id: 'plan-c2-u5', cooperativeId: 'coop-2', unitId: 'unit-y101', memberId: 'mem-c2-u5', title: 'قرارداد ساخت واحد ۱۰۱ یاسمن', totalCostRial: 35000000000, createdAt: '2024-03-06T08:00:00Z' },
  { id: 'plan-c2-u6', cooperativeId: 'coop-2', unitId: 'unit-y201', memberId: 'mem-c2-u6', title: 'قرارداد ساخت واحد ۲۰۱ یاسمن', totalCostRial: 42000000000, createdAt: '2024-03-11T08:00:00Z' },
  { id: 'plan-c2-u7', cooperativeId: 'coop-2', unitId: 'unit-y301', memberId: 'mem-c2-u7', title: 'قرارداد ساخت واحد ۳۰۱ یاسمن', totalCostRial: 48000000000, createdAt: '2024-03-16T08:00:00Z' },

  { id: 'plan-c3-u8', cooperativeId: 'coop-3', unitId: 'unit-a1', memberId: 'mem-c3-u8', title: 'برنامه مالی ساخت واحد ۱ البرز', totalCostRial: 12000000000, createdAt: '2024-05-16T08:00:00Z' },
  { id: 'plan-c3-u9', cooperativeId: 'coop-3', unitId: 'unit-a2', memberId: 'mem-c3-u9', title: 'برنامه مالی ساخت واحد ۲ البرز', totalCostRial: 13000000000, createdAt: '2024-05-21T08:00:00Z' },
  { id: 'plan-c3-u10', cooperativeId: 'coop-3', unitId: 'unit-a3', memberId: 'mem-c3-u10', title: 'برنامه مالی ساخت واحد ۳ البرز', totalCostRial: 12000000000, createdAt: '2024-05-26T08:00:00Z' }
];

// ۶. ریز اقساط (InstallmentItem)
export const seedInstallmentItems: InstallmentItem[] = [
  // اقساط عضو ۱ (علی مرادی - فرهنگیان)
  {
    id: 'item-101-1',
    planId: 'plan-c1-u1',
    cooperativeId: 'coop-1',
    stage: 'LAND_SHARE',
    stageTitle: 'قسط اول: سهم زمین و پروانه ساختمانی',
    dueDate: '2024-02-15T00:00:00Z',
    amountRial: 5000000000, // ۵۰۰ میلیون تومان
    paidAmountRial: 5000000000,
    status: 'PAID'
  },
  {
    id: 'item-101-2',
    planId: 'plan-c1-u1',
    cooperativeId: 'coop-1',
    stage: 'FOUNDATION',
    stageTitle: 'قسط دوم: اجرای فونداسیون و اسکلت فلزی',
    dueDate: '2024-06-20T00:00:00Z',
    amountRial: 4000000000, // ۴۰۰ میلیون تومان
    paidAmountRial: 4000000000,
    status: 'PAID'
  },
  {
    id: 'item-101-3',
    planId: 'plan-c1-u1',
    cooperativeId: 'coop-1',
    stage: 'ROUGH_CONSTRUCTION',
    stageTitle: 'قسط سوم: سفت‌کاری و تیغه‌چینی طبقات',
    dueDate: '2024-11-01T00:00:00Z',
    amountRial: 4500000000, // ۴۵۰ میلیون تومان
    paidAmountRial: 0,
    status: 'PENDING'
  },
  {
    id: 'item-101-4',
    planId: 'plan-c1-u1',
    cooperativeId: 'coop-1',
    stage: 'FINISHING',
    stageTitle: 'قسط چهارم: نازک‌کاری و اجرای نما',
    dueDate: '2025-04-15T00:00:00Z',
    amountRial: 4500000000,
    paidAmountRial: 0,
    status: 'PENDING'
  },

  // اقساط عضو ۲ (مریم حسینی - فرهنگیان)
  {
    id: 'item-102-1',
    planId: 'plan-c1-u2',
    cooperativeId: 'coop-1',
    stage: 'LAND_SHARE',
    stageTitle: 'قسط اول: سهم زمین و پروانه ساختمانی',
    dueDate: '2024-02-15T00:00:00Z',
    amountRial: 6000000000,
    paidAmountRial: 6000000000,
    status: 'PAID'
  },
  {
    id: 'item-102-2',
    planId: 'plan-c1-u2',
    cooperativeId: 'coop-1',
    stage: 'FOUNDATION',
    stageTitle: 'قسط دوم: اجرای فونداسیون و اسکلت فلزی',
    dueDate: '2024-06-20T00:00:00Z',
    amountRial: 5000000000,
    paidAmountRial: 2500000000,
    status: 'PARTIAL'
  },

  // اقساط عضو ۵ (رضا نوری - کادر درمان)
  {
    id: 'item-201-1',
    planId: 'plan-c2-u5',
    cooperativeId: 'coop-2',
    stage: 'LAND_SHARE',
    stageTitle: 'قسط اول: خرید زمین الهیه و تجهیز کارگاه',
    dueDate: '2024-04-10T00:00:00Z',
    amountRial: 12000000000,
    paidAmountRial: 12000000000,
    status: 'PAID'
  },
  {
    id: 'item-201-2',
    planId: 'plan-c2-u5',
    cooperativeId: 'coop-2',
    stage: 'FOUNDATION',
    stageTitle: 'قسط دوم: گودبرداری و سازه نگهبان نیلینگ',
    dueDate: '2024-08-30T00:00:00Z',
    amountRial: 10000000000,
    paidAmountRial: 0,
    status: 'OVERDUE'
  },

  // اقساط عضو ۸ (الهام قاسم‌زاده - پارس)
  {
    id: 'item-301-1',
    planId: 'plan-c3-u8',
    cooperativeId: 'coop-3',
    stage: 'LAND_SHARE',
    stageTitle: 'قسط اول: سهم زمین پروژه فردیس',
    dueDate: '2024-06-15T00:00:00Z',
    amountRial: 4000000000,
    paidAmountRial: 4000000000,
    status: 'PAID'
  }
];

// ۷. پرداخت‌ها (Payment) - شامل درگاه آنلاین ساندباکس و فیش واریزی
export const seedPayments: Payment[] = [
  // پرداخت آنلاین تایید شده توسط علی مرادی
  {
    id: 'pay-001',
    cooperativeId: 'coop-1',
    memberId: 'mem-c1-u1',
    installmentItemId: 'item-101-1',
    amountRial: 5000000000,
    method: 'ONLINE_SANDBOX',
    status: 'SUCCESS',
    trackingCode: 'TRX-SND-9823412',
    gatewayName: 'سامان کیش ساندباکس',
    paidAt: '2024-02-14T14:30:20Z',
    createdAt: '2024-02-14T14:30:20Z'
  },
  // پرداخت آفلاین فیش بانکی توسط علی مرادی (تایید شده توسط مدیر تعاونی ۱)
  {
    id: 'pay-002',
    cooperativeId: 'coop-1',
    memberId: 'mem-c1-u1',
    installmentItemId: 'item-101-2',
    amountRial: 4000000000,
    method: 'OFFLINE_RECEIPT',
    status: 'APPROVED',
    trackingCode: 'FIS-983411',
    paidAt: '2024-06-19T10:15:00Z',
    createdAt: '2024-06-19T11:00:00Z'
  },
  // پرداخت آفلاین جدید در انتظار بررسی توسط مریم حسینی
  {
    id: 'pay-003',
    cooperativeId: 'coop-1',
    memberId: 'mem-c1-u2',
    installmentItemId: 'item-102-2',
    amountRial: 2500000000,
    method: 'OFFLINE_RECEIPT',
    status: 'PENDING_APPROVAL',
    trackingCode: 'FIS-771290',
    paidAt: '2024-06-25T16:45:00Z',
    createdAt: '2024-06-25T17:10:00Z'
  },
  // پرداخت آنلاین عضو ۵ (رضا نوری در تعاونی کادر درمان)
  {
    id: 'pay-004',
    cooperativeId: 'coop-2',
    memberId: 'mem-c2-u5',
    installmentItemId: 'item-201-1',
    amountRial: 12000000000,
    method: 'ONLINE_SANDBOX',
    status: 'SUCCESS',
    trackingCode: 'TRX-SND-1102938',
    gatewayName: 'به‌پرداخت ملت ساندباکس',
    paidAt: '2024-04-09T09:12:00Z',
    createdAt: '2024-04-09T09:12:00Z'
  },
  // پرداخت رد شده (به دلیل شماره پیگیری نامعتبر)
  {
    id: 'pay-005',
    cooperativeId: 'coop-1',
    memberId: 'mem-c1-u3',
    installmentItemId: 'item-101-3',
    amountRial: 1000000000,
    method: 'OFFLINE_RECEIPT',
    status: 'REJECTED',
    trackingCode: 'FIS-INVALID-99',
    paidAt: '2024-07-01T11:00:00Z',
    createdAt: '2024-07-01T11:20:00Z'
  }
];

// ۸. رسیدهای بارگذاری شده (Receipt)
export const seedReceipts: Receipt[] = [
  {
    id: 'rec-001',
    paymentId: 'pay-002',
    cooperativeId: 'coop-1',
    fileUrl: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=600&auto=format&fit=crop&q=80',
    originalFileName: 'fish-variz-bank-melli-moradi.jpg',
    mimeType: 'image/jpeg',
    fileSizeBytes: 420100, // ۴۲۰ کیلوبایت
    bankName: 'بانک ملی شعبه صادقیه',
    referenceNumber: '۹۸۳۴۱۱۶۶۵',
    depositDate: '2024-06-19',
    depositTime: '10:15',
    depositAccount: '۶۰۳۷۹۹۷۱۴۳۲۱۸۹۰۰',
    reviewedBy: 'user-admin-coop1',
    reviewedAt: '2024-06-20T08:30:00Z'
  },
  {
    id: 'rec-002',
    paymentId: 'pay-003',
    cooperativeId: 'coop-1',
    fileUrl: 'https://images.unsplash.com/photo-1554224154-26032ffc0d07?w=600&auto=format&fit=crop&q=80',
    originalFileName: 'resid-pay-hoseini.jpg',
    mimeType: 'image/jpeg',
    fileSizeBytes: 615000,
    bankName: 'بانک ملت شعبه کاشانی',
    referenceNumber: '۷۷۱۲۹۰۳۴۲',
    depositDate: '2024-06-25',
    depositTime: '16:45',
    depositAccount: '۶۱۰۴۳۳۷۸۹۲۳۴۵۶۱۱'
    // هنوز reviewed نشده چون PENDING_APPROVAL است
  },
  {
    id: 'rec-003',
    paymentId: 'pay-005',
    cooperativeId: 'coop-1',
    fileUrl: 'https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=600&auto=format&fit=crop&q=80',
    originalFileName: 'resid-tashvishi.jpg',
    mimeType: 'image/jpeg',
    fileSizeBytes: 312000,
    bankName: 'بانک سپه',
    referenceNumber: '۰۰۰۰۱۲۳۴',
    depositDate: '2024-07-01',
    reviewedBy: 'user-admin-coop1',
    reviewedAt: '2024-07-02T09:00:00Z',
    rejectReason: 'تصویر ناخوانا است و مبلغ مندرج در فیش با ادعای واریز تطابق ندارد.'
  }
];

// ۹. اطلاعیه‌ها (Announcement)
export const seedAnnouncements: Announcement[] = [
  // اطلاعیه سراسری مدیر کل برای همه تعاونی‌ها (cooperativeId = null)
  {
    id: 'ann-global-1',
    cooperativeId: null,
    authorId: 'user-superadmin',
    title: 'دستورالعمل اجرایی مجمع عمومی سالیانه کلیه تعاونی‌های تحت نظارت',
    content: 'به اطلاع کلیه مدیران و اعضای محترم تعاونی‌های مسکن می‌رساند، با توجه به بخشنامه اداره تعاون، تقویم برگزاری مجامع عمومی تا پایان مهرماه اعلام خواهد شد.',
    priority: 'IMPORTANT',
    publishedAt: '2024-06-01T08:00:00Z',
    viewCount: 142
  },
  // اطلاعیه اختصاصی تعاونی فرهنگیان (coop-1)
  {
    id: 'ann-c1-1',
    cooperativeId: 'coop-1',
    authorId: 'user-admin-coop1',
    title: 'آغاز عملیات بتن‌ریزی سقف ششم و لزوم تسویه قسط سوم',
    content: 'با توجه به پیشرفت فیزیکی ۶۵ درصدی پروژه مروارید چیتگر، بتن‌ریزی سقف ششم آغاز شد. از کلیه اعضای محترم تقاضا می‌شود نسبت به واریز قسط سوم حداکثر تا موعد مقرر اقدام فرمایند.',
    priority: 'URGENT',
    publishedAt: '2024-06-20T10:00:00Z',
    viewCount: 38
  },
  // اطلاعیه اختصاصی تعاونی کادر درمان رازی (coop-2)
  {
    id: 'ann-c2-1',
    cooperativeId: 'coop-2',
    authorId: 'user-admin-coop2',
    title: 'گزارش پیشرفت عملیات گودبرداری و سازه نگهبان الهیه',
    content: 'عملیات حفاری و نیلینگ دیواره‌های شرقی پروژه یاسمن با نظارت مهندسین مشاور با موفقیت خاتمه یافت. گزارش تصویری در دفتر تعاونی قابل مشاهده است.',
    priority: 'NORMAL',
    publishedAt: '2024-06-15T12:00:00Z',
    viewCount: 52
  }
];

// ۱۰. لاگ‌های حسابرسی و امنیتی (AuditLog)
export const seedAuditLogs: AuditLog[] = [
  {
    id: 'log-001',
    cooperativeId: 'coop-1',
    userId: 'user-member-1',
    userFullName: 'علی مرادی',
    userRole: 'MEMBER',
    action: 'PAYMENT_SUBMITTED',
    entityType: 'PAYMENT',
    entityId: 'pay-001',
    description: 'پرداخت موفق آنلاین قسط اول به مبلغ ۵،۰۰۰،۰۰۰،۰۰۰ ریال از طریق درگاه ساندباکس',
    newState: { amountRial: 5000000000, trackingCode: 'TRX-SND-9823412', status: 'SUCCESS' },
    ipAddress: '5.218.42.19',
    timestamp: '2024-02-14T14:30:25Z'
  },
  {
    id: 'log-002',
    cooperativeId: 'coop-1',
    userId: 'user-member-1',
    userFullName: 'علی مرادی',
    userRole: 'MEMBER',
    action: 'CREATE',
    entityType: 'RECEIPT',
    entityId: 'rec-001',
    description: 'بارگذاری تصویر فیش بانکی به شماره ارجاع ۹۸۳۴۱۱۶۶۵ برای قسط دوم',
    newState: { referenceNumber: '۹۸۳۴۱۱۶۶۵', amountRial: 4000000000 },
    ipAddress: '5.218.42.19',
    timestamp: '2024-06-19T11:00:00Z'
  },
  {
    id: 'log-003',
    cooperativeId: 'coop-1',
    userId: 'user-admin-coop1',
    userFullName: 'دکتر علیرضا مهدوی',
    userRole: 'COOP_ADMIN',
    action: 'PAYMENT_APPROVED',
    entityType: 'RECEIPT',
    entityId: 'rec-001',
    description: 'تایید فیش واریز بانکی به مبلغ ۴،۰۰۰،۰۰۰،۰۰۰ ریال متعلق به علی مرادی',
    previousState: { status: 'PENDING_APPROVAL' },
    newState: { status: 'APPROVED', reviewedBy: 'user-admin-coop1' },
    ipAddress: '185.120.35.80',
    timestamp: '2024-06-20T08:30:00Z'
  },
  {
    id: 'log-004',
    cooperativeId: 'coop-1',
    userId: 'user-admin-coop1',
    userFullName: 'دکتر علیرضا مهدوی',
    userRole: 'COOP_ADMIN',
    action: 'PAYMENT_REJECTED',
    entityType: 'PAYMENT',
    entityId: 'pay-005',
    description: 'رد فیش واریزی به دلیل ناخوانا بودن و عدم تطابق مبلغ',
    previousState: { status: 'PENDING_APPROVAL' },
    newState: { status: 'REJECTED', rejectReason: 'تصویر ناخوانا است' },
    ipAddress: '185.120.35.80',
    timestamp: '2024-07-02T09:00:00Z'
  },
  {
    id: 'log-005',
    cooperativeId: null,
    userId: 'user-superadmin',
    userFullName: 'مهندس محمدرضا شایسته',
    userRole: 'SUPER_ADMIN',
    action: 'CREATE',
    entityType: 'ANNOUNCEMENT',
    entityId: 'ann-global-1',
    description: 'انتشار اطلاعیه سراسری مجامع عمومی تعاونی‌ها',
    newState: { title: 'دستورالعمل اجرایی مجمع عمومی سالیانه', priority: 'IMPORTANT' },
    ipAddress: '2.180.110.2',
    timestamp: '2024-06-01T08:00:00Z'
  }
];

// ۱۱. هزینه‌های جاری و ماهانه مسکن (شارژ ماهیانه و خدمات ساکنین)
export const seedMonthlyFees: any[] = [
  {
    id: 'fee-001',
    cooperativeId: 'coop-1',
    unitId: 'unit-101',
    memberId: 'mem-c1-u1', // علی مرادی
    title: 'شارژ ماهانه و نگهداری مجتمع - اردیبهشت',
    amountRial: 15000000, // ۱.۵ میلیون تومان
    dueDate: '2024-05-20T00:00:00Z',
    periodMonth: 2,
    periodYear: 1403,
    feeCategory: 'MONTHLY_CHARGE',
    status: 'PAID',
    paidAmountRial: 15000000,
    paidAt: '2024-05-18T11:20:00Z',
    paidByManager: false,
    paymentReference: 'CHG-984321',
    createdAt: '2024-05-01T08:00:00Z'
  },
  {
    id: 'fee-002',
    cooperativeId: 'coop-1',
    unitId: 'unit-101',
    memberId: 'mem-c1-u1', // علی مرادی
    title: 'شارژ ماهانه و نگهداری مجتمع - خرداد',
    amountRial: 15000000,
    dueDate: '2024-06-20T00:00:00Z',
    periodMonth: 3,
    periodYear: 1403,
    feeCategory: 'MONTHLY_CHARGE',
    status: 'PAID',
    paidAmountRial: 15000000,
    paidAt: '2024-06-15T16:00:00Z',
    paidByManager: true, // توسط مدیر تعاونی دستی ثبت شده
    paymentReference: 'DESK-REC-441',
    notes: 'تحویل نقدی در دفتر تعاونی توسط مدیر ثبت شد.',
    createdAt: '2024-06-01T08:00:00Z'
  },
  {
    id: 'fee-003',
    cooperativeId: 'coop-1',
    unitId: 'unit-101',
    memberId: 'mem-c1-u1', // علی مرادی
    title: 'شارژ ماهانه و نگهداری مجتمع - تیر',
    amountRial: 18000000, // ۱.۸ میلیون تومان
    dueDate: '2024-07-20T00:00:00Z',
    periodMonth: 4,
    periodYear: 1403,
    feeCategory: 'MONTHLY_CHARGE',
    status: 'PENDING',
    paidAmountRial: 0,
    createdAt: '2024-07-01T08:00:00Z'
  },
  {
    id: 'fee-004',
    cooperativeId: 'coop-1',
    unitId: 'unit-102',
    memberId: 'mem-c1-u2', // مریم حسینی
    title: 'سرویس دوره‌ای آسانسور و بیمه مجتمع',
    amountRial: 25000000, // ۲.۵ میلیون تومان
    dueDate: '2024-07-15T00:00:00Z',
    periodMonth: 4,
    periodYear: 1403,
    feeCategory: 'ELEVATOR',
    status: 'PENDING',
    paidAmountRial: 0,
    createdAt: '2024-07-01T08:00:00Z'
  },
  {
    id: 'fee-005',
    cooperativeId: 'coop-2',
    unitId: 'unit-y101',
    memberId: 'mem-c2-u5', // رضا نوری
    title: 'شارژ ماهانه برج یاسمن - تیر',
    amountRial: 35000000, // ۳.۵ میلیون تومان
    dueDate: '2024-07-25T00:00:00Z',
    periodMonth: 4,
    periodYear: 1403,
    feeCategory: 'MONTHLY_CHARGE',
    status: 'PAID',
    paidAmountRial: 35000000,
    paidAt: '2024-07-20T10:00:00Z',
    paidByManager: true,
    paymentReference: 'CARD-TO-CARD-9901',
    createdAt: '2024-07-01T08:00:00Z'
  }
];
