/**
 * انواع داده و ساختار جداول پایگاه‌داده سامانه مدیریت تعاونی‌های مسکن (مسکن‌یار)
 * طراحی شده بر اساس معماری چندمستأجری (Multi-Tenant) و امنیت دسترسی نقش‌محور (RBAC)
 */

// نقش‌های کاربری در سیستم
export type UserRole = 'SUPER_ADMIN' | 'COOP_ADMIN' | 'MEMBER';

// وضعیت واحد ساختمانی
export type UnitStatus = 'AVAILABLE' | 'ASSIGNED' | 'RESERVED';

// عنوان مرحله ساخت قسط
export type InstallmentStage = 
  | 'LAND_SHARE'         // سهم زمین و جواز
  | 'FOUNDATION'         // اسکلت و فونداسیون
  | 'ROUGH_CONSTRUCTION' // سفت‌کاری
  | 'FACILITIES'         // تأسیسات مکانیکی و برقی
  | 'FINISHING'          // نازک‌کاری و نما
  | 'DELIVERY'           // تحویل موقت و انشعابات
  | 'OTHER';             // سایر هزینه‌های مشترک

// وضعیت قسط
export type InstallmentStatus = 'PENDING' | 'PARTIAL' | 'PAID' | 'OVERDUE';

// روش پرداخت
export type PaymentMethod = 
  | 'ONLINE_SANDBOX' 
  | 'OFFLINE_RECEIPT' 
  | 'CASH_DESK' 
  | 'CARD_TO_CARD'
  | 'MANAGER_REGISTERED';

// نوع هزینه‌های جاری و ماهانه
export type FeeCategory = 
  | 'MONTHLY_CHARGE'     // شارژ ماهیانه ساختمان
  | 'ELEVATOR'           // سرویس و نگهداری آسانسور
  | 'SECURITY'           // نگهبانی و سرایداری
  | 'UTILITIES'          // قبوض مشترک (آب، برق، گاز)
  | 'REPAIR'             // تعمیرات و تأسیسات اضطراری
  | 'OTHER'              // سایر هزینه‌های مصوب مجمع
  | string;              // پشتیبانی از دسته‌بندی‌های دلخواه پویا

export interface FeeCategoryItem {
  id: string;
  name: string;
  title: string;
  isCustom?: boolean;
  cooperativeId?: string;
}

// ویژگی‌های مشترک حذف ایمن (Soft Delete) برای امکان بازیابی داده‌ها
export interface SoftDeletable {
  isDeleted?: boolean;
  deletedAt?: string;
  deletedBy?: string;
}

// وضعیت هزینه ماهانه
export type FeeStatus = 'PENDING' | 'PAID' | 'OVERDUE';

/**
 * جدول ۱۱: هزینه‌های جاری و ماهانه مسکن (MonthlyFee)
 * هزینه‌هایی که قسط ساخت نیستند و به صورت ماهانه/دوره‌ای توسط ساکنین و اعضا باید پرداخت شوند
 */
export interface MonthlyFee extends SoftDeletable {
  id: string;
  cooperativeId: string;
  unitId?: string;
  memberId: string;
  title: string;
  amountRial: number;           // مبلغ ریالی عدد صحیح
  dueDate: string;              // تاریخ سررسید (ISO)
  periodMonth: number;          // ماه شمسی (۱ تا ۱۲)
  periodYear: number;           // سال شمسی (مثال: ۱۴۰۳)
  feeCategory: FeeCategory;     // دسته‌بندی هزینه
  status: FeeStatus;            // وضعیت تسویه
  paidAmountRial: number;       // مبلغ پرداخت‌شده
  paidAt?: string;              // تاریخ پرداخت
  paidByManager?: boolean;      // آیا توسط مدیر تعاونی تسویه ثبت شده است؟
  paymentReference?: string;    // شماره پیگیری یا فیش
  notes?: string;               // توضیحات اضافی
  createdAt: string;
}

// وضعیت پرداخت
export type PaymentStatus = 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED' | 'SUCCESS';

// اولویت اطلاعیه
export type AnnouncementPriority = 'NORMAL' | 'IMPORTANT' | 'URGENT';

// نوع عملیات لاگ حسابرسی
export type AuditAction = 
  | 'CREATE' 
  | 'UPDATE' 
  | 'DELETE' 
  | 'PAYMENT_SUBMITTED' 
  | 'PAYMENT_APPROVED' 
  | 'PAYMENT_REJECTED' 
  | 'LOGIN_OTP'
  | 'UNIT_ASSIGNED';

// ========================
// جداول مدل داده (Entities)
// ========================

/**
 * جدول ۱: کاربر (User)
 * اطلاعات هویتی پایه اعضا و مدیران
 */
export interface User extends SoftDeletable {
  id: string;                     // شناسه یکتا (UUID)
  mobile: string;                 // شماره موبایل (کلید احراز هویت با OTP)
  fullName: string;               // نام و نام خانوادگی کامل
  nationalCode: string;           // کد ملی ۱۰ رقمی (اعتبارسنجی با الگوریتم mod 11)
  fatherName?: string;            // نام پدر
  avatarUrl?: string;             // تصویر پروفایل
  isActive: boolean;              // فعال/غیرفعال بودن حساب
  createdAt: string;              // تاریخ عضویت (ISO)
  updatedAt: string;              // تاریخ آخرین ویرایش (ISO)
}

/**
 * جدول ۲: تعاونی مسکن (Cooperative)
 * هر تعاونی یک نهاد مستقل با اعضا و واحدهای مختص خود است
 */
export interface Cooperative extends SoftDeletable {
  id: string;                     // شناسه یکتا
  name: string;                   // نام رسمی تعاونی (مثال: تعاونی مسکن فرهنگیان)
  code: string;                   // کد اختصاری یا شناسه ملی تعاونی
  projectName: string;            // عنوان پروژه مسکونی (مثال: برج مروارید)
  address: string;                // آدرس محل احداث پروژه
  totalUnits: number;             // کل تعداد واحدهای پروژه
  bankAccountInfo: {              // اطلاعات حساب و شبای واریز اختصاصی تعاونی
    bankName: string;
    accountNumber: string;
    shebaNumber: string;
    cardHolderName: string;
  };
  isActive: boolean;              // فعال بودن تعاونی
  createdAt: string;
}

/**
 * جدول ۳: عضویت کاربر در تعاونی (Membership)
 * پیوند بین کاربر و تعاونی همراه با نقش کاربر در همان تعاونی
 * این جدول کلید اصلی معماری چندمستأجری (Multi-Tenant) است
 */
export interface Membership extends SoftDeletable {
  id: string;
  userId: string;                 // ارجاع به جدول User
  cooperativeId: string;          // ارجاع به جدول Cooperative
  role: UserRole;                 // نقش در این تعاونی (SUPER_ADMIN, COOP_ADMIN, MEMBER)
  membershipNumber: string;       // شماره عضویت اختصاصی در دفتر تعاونی
  joinedAt: string;               // تاریخ پیوستن به تعاونی
  isActive: boolean;
}

/**
 * جدول ۴: واحد مسکونی (Unit)
 * مشخصات فیزیکی واحدهای متعلق به یک تعاونی
 */
export interface Unit extends SoftDeletable {
  id: string;
  cooperativeId: string;          // ارجاع به تعاونی مالک واحد (تضمین تفکیک مستأجر)
  unitNumber: string;             // شماره واحد (مثال: ۱۰۲)
  block: string;                  // نام یا شماره بلوک (مثال: A یا بهار)
  floor: number;                  // طبقه (مثال: ۳)
  areaM2: number;                 // متراژ مفید به متر مربع (مثال: ۱۰۵.۵)
  parkingNumber?: string;         // شماره پارکینگ اختصاصی
  storageNumber?: string;         // شماره انباری
  assignedMemberId?: string;      // ارجاع به Membership کاربر منتسب به این واحد
  status: UnitStatus;             // وضعیت تخصیص
  createdAt: string;
}

/**
 * جدول ۵: برنامه اقساط (InstallmentPlan)
 * سرفصل برنامه‌ریزی مالی برای هر واحد یا کل پروژه
 */
export interface InstallmentPlan extends SoftDeletable {
  id: string;
  cooperativeId: string;          // تعاونی مربوطه
  unitId: string;                 // واحد مربوطه
  memberId: string;               // عضو مربوطه (Membership id)
  title: string;                  // عنوان قرارداد (مثال: جدول اقساط واحد ۱۰۲ - قرارداد اولیه)
  totalCostRial: number;          // کل مبلغ برآورد شده به ریال (عدد صحیح دقیق)
  createdAt: string;
}

/**
 * جدول ۶: ریز اقساط (InstallmentItem)
 * سررسیدها و مبالغ ماهانه یا مرحله‌ای
 */
export interface InstallmentItem extends SoftDeletable {
  id: string;
  planId: string;                 // ارجاع به InstallmentPlan
  cooperativeId: string;          // تعاونی (برای کوئری‌های مستقیم و ایزولاسیون سریع)
  stage: InstallmentStage;        // مرحله ساخت
  stageTitle: string;             // عنوان قابل نمایش (مثال: قسط مرحله سفت‌کاری سقف دوم)
  dueDate: string;                // تاریخ سررسید (ISO)
  amountRial: number;             // مبلغ قابل پرداخت به ریال (عدد صحیح، بدون اعشار)
  paidAmountRial: number;         // مجموع مبالغ تایید شده پرداخت‌شده به ریال
  status: InstallmentStatus;      // وضعیت پرداخت قسط
  penaltyPerDayRial?: number;     // جریمه دیرکرد روزانه به ریال (در صورت تصویب مجمع)
}

/**
 * جدول ۷: پرداخت (Payment)
 * رکورد واریزی چه به صورت آنلاین و چه با بارگذاری فیش دستی
 */
export interface Payment {
  id: string;
  cooperativeId: string;          // تعاونی مربوطه
  memberId: string;               // عضو پرداخت‌کننده (Membership id)
  installmentItemId: string;      // قسط مربوطه
  amountRial: number;             // مبلغ واریزشده به ریال
  method: PaymentMethod;          // ONLINE_SANDBOX یا OFFLINE_RECEIPT
  status: PaymentStatus;          // PENDING_APPROVAL, APPROVED, REJECTED, SUCCESS
  trackingCode: string;           // کد رهگیری پرداخت آنلاین یا شماره پیگیری فیش
  gatewayName?: string;           // نام درگاه (سداد، به پرداخت، زرین‌پال ساندباکس)
  paidAt: string;                 // تاریخ و زمان واقعی پرداخت
  createdAt: string;
}

/**
 * جدول ۸: تصویر و اطلاعات فیش واریز آفلاین (Receipt)
 * متصل به پرداخت‌های از نوع OFFLINE_RECEIPT
 */
export interface Receipt {
  id: string;
  paymentId: string;              // ارجاع یک‌به‌یک به Payment
  cooperativeId: string;          // جهت کنترل دسترسی مدیر تعاونی
  fileUrl: string;                // مسیر یا آدرس تصویر فیش در آبجکت استوریج
  originalFileName: string;       // نام اصلی فایل آپلود شده
  mimeType: string;               // نوع فایل (image/jpeg, image/png, application/pdf)
  fileSizeBytes: number;          // حجم فایل به بایت (حداکثر ۲ مگابایت)
  bankName: string;               // نام بانک مبدا یا مقصد
  referenceNumber: string;        // شماره فیش / شماره ارجاع بانکی
  depositDate: string;            // تاریخ واریز مندرج در فیش
  depositTime?: string;           // ساعت واریز مندرج در فیش
  depositAccount?: string;        // شماره کارت یا حساب مبدا (اختیاری)
  reviewedBy?: string;            // کاربر بررسی‌کننده (شناسه مدیر تعاونی)
  reviewedAt?: string;            // تاریخ تایید یا رد فیش
  rejectReason?: string;          // دلیل رد فیش در صورت رد شدن
  ocrExtractedData?: {            // داده‌های استخراج شده با هوش مصنوعی (در فازهای بعد)
    detectedAmountRial?: number;
    detectedRef?: string;
    detectedDate?: string;
    confidenceScore?: number;
  };
}

/**
 * جدول ۹: اطلاعیه (Announcement)
 * پیام‌های عمومی یا اختصاصی تعاونی‌ها
 */
export interface Announcement {
  id: string;
  cooperativeId: string | null;   // null = سراسری برای همه تعاونی‌ها (فقط مدیر کل)، غیر null = مختص یک تعاونی
  authorId: string;               // شناسه کاربری نویسنده
  title: string;                  // عنوان اطلاعیه
  content: string;                // متن کامل اطلاعیه
  priority: AnnouncementPriority; // اولویت (عادی، مهم، فوری)
  publishedAt: string;            // تاریخ انتشار
  expiresAt?: string;             // تاریخ انقضا (اختیاری)
  viewCount: number;              // تعداد بازدید
}

/**
 * جدول ۱۰: لاگ حسابرسی و امنیتی (AuditLog)
 * ثبت تغییرناپذیر تمام تراکنش‌ها و وقایع حساس مالی
 */
export interface AuditLog {
  id: string;
  cooperativeId: string | null;   // تعاونی مربوطه
  userId: string;                 // کاربری که عمل را انجام داده
  userFullName: string;           // نام کاربر در زمان لاگ
  userRole: UserRole;             // نقش کاربر در زمان لاگ
  action: AuditAction;            // نوع عملیات
  entityType: 'PAYMENT' | 'RECEIPT' | 'INSTALLMENT' | 'UNIT' | 'USER' | 'ANNOUNCEMENT';
  entityId: string;               // شناسه رکورد مورد عملیات
  description: string;            // شرح متنی تغییر به زبان فارسی
  previousState?: Record<string, any>; // وضعیت قبلی رکورد (برای rollback و شفافیت مالی)
  newState?: Record<string, any>;      // وضعیت جدید رکورد
  ipAddress?: string;
  timestamp: string;
}

// ساختار کانتکست چندمستأجری برای احراز و جداسازی داده
export interface TenantSessionContext {
  currentUser: User;
  activeRole: UserRole;
  activeCooperativeId: string | null; // اگر SUPER_ADMIN باشد می‌تواند null یا مشخص باشد
  membershipId?: string;
}
