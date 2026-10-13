import React, { useState } from 'react';
import { 
  Database, 
  Key, 
  Link2, 
  Table, 
  Info, 
  ArrowRight,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';

interface EntityDefinition {
  name: string;
  tableName: string;
  faTitle: string;
  category: 'CORE' | 'FINANCE' | 'SYSTEM';
  description: string;
  primaryKey: string;
  foreignKeys: { field: string; references: string; relationType: string }[];
  fields: { name: string; type: string; faName: string; isRequired: boolean; isUnique?: boolean; note?: string }[];
}

const ENTITIES: EntityDefinition[] = [
  {
    name: 'User',
    tableName: 'users',
    faTitle: 'کاربر (User)',
    category: 'CORE',
    description: 'مشخصات هویتی پایه اشخاص (اعضا، مدیران تعاونی و مدیر کل)',
    primaryKey: 'id (UUID)',
    foreignKeys: [],
    fields: [
      { name: 'id', type: 'UUID', faName: 'شناسه یکتا', isRequired: true, isUnique: true },
      { name: 'mobile', type: 'VARCHAR(11)', faName: 'شماره موبایل (کلید لاگین OTP)', isRequired: true, isUnique: true },
      { name: 'full_name', type: 'VARCHAR(150)', faName: 'نام و نام خانوادگی', isRequired: true },
      { name: 'national_code', type: 'VARCHAR(10)', faName: 'کد ملی (الگوریتم Mod 11)', isRequired: true, isUnique: true },
      { name: 'father_name', type: 'VARCHAR(100)', faName: 'نام پدر', isRequired: false },
      { name: 'avatar_url', type: 'TEXT', faName: 'آدرس تصویر پروفایل', isRequired: false },
      { name: 'is_active', type: 'BOOLEAN', faName: 'وضعیت فعال/غیرفعال', isRequired: true },
      { name: 'created_at', type: 'TIMESTAMPTZ', faName: 'تاریخ ثبت‌نام', isRequired: true },
      { name: 'updated_at', type: 'TIMESTAMPTZ', faName: 'تاریخ به‌روزرسانی', isRequired: true },
    ]
  },
  {
    name: 'Cooperative',
    tableName: 'cooperatives',
    faTitle: 'تعاونی مسکن (Cooperative)',
    category: 'CORE',
    description: 'نهاد مستقل تعاونی مسکن (مستأجر - Tenant). هر تعاونی پروژه، حساب بانکی و اعضای خود را دارد.',
    primaryKey: 'id (UUID)',
    foreignKeys: [],
    fields: [
      { name: 'id', type: 'UUID', faName: 'شناسه تعاونی', isRequired: true, isUnique: true },
      { name: 'name', type: 'VARCHAR(200)', faName: 'نام رسمی تعاونی', isRequired: true },
      { name: 'code', type: 'VARCHAR(50)', faName: 'شناسه ثبت یا کد ملی تعاونی', isRequired: true, isUnique: true },
      { name: 'project_name', type: 'VARCHAR(200)', faName: 'عنوان پروژه مسکونی', isRequired: true },
      { name: 'address', type: 'TEXT', faName: 'آدرس فیزیکی پروژه', isRequired: true },
      { name: 'total_units', type: 'INTEGER', faName: 'کل تعداد واحدها', isRequired: true },
      { name: 'bank_name', type: 'VARCHAR(100)', faName: 'نام بانک واریزی تعاونی', isRequired: true },
      { name: 'account_number', type: 'VARCHAR(50)', faName: 'شماره حساب بانکی', isRequired: true },
      { name: 'sheba_number', type: 'VARCHAR(50)', faName: 'شماره شبا (IR...) جهت دریافت اقساط', isRequired: true },
      { name: 'is_active', type: 'BOOLEAN', faName: 'وضعیت فعالیت', isRequired: true },
    ]
  },
  {
    name: 'Membership',
    tableName: 'memberships',
    faTitle: 'عضویت و نقش در تعاونی (Membership)',
    category: 'CORE',
    description: 'جدول پیوند N:M بین کاربر و تعاونی همراه با نقش (SUPER_ADMIN / COOP_ADMIN / MEMBER). کلید معماری چندمستأجری.',
    primaryKey: 'id (UUID)',
    foreignKeys: [
      { field: 'user_id', references: 'users(id)', relationType: 'N:1' },
      { field: 'cooperative_id', references: 'cooperatives(id)', relationType: 'N:1' }
    ],
    fields: [
      { name: 'id', type: 'UUID', faName: 'شناسه عضویت', isRequired: true, isUnique: true },
      { name: 'user_id', type: 'UUID', faName: 'ارجاع به کاربر', isRequired: true },
      { name: 'cooperative_id', type: 'UUID', faName: 'ارجاع به تعاونی', isRequired: true },
      { name: 'role', type: 'ENUM (UserRole)', faName: 'نقش کاربر در این تعاونی', isRequired: true },
      { name: 'membership_number', type: 'VARCHAR(50)', faName: 'شماره پرونده عضویت', isRequired: true },
      { name: 'is_active', type: 'BOOLEAN', faName: 'فعال بودن عضویت', isRequired: true },
      { name: 'joined_at', type: 'TIMESTAMPTZ', faName: 'تاریخ ورود به تعاونی', isRequired: true },
    ]
  },
  {
    name: 'Unit',
    tableName: 'units',
    faTitle: 'واحد مسکونی (Unit)',
    category: 'CORE',
    description: 'واحدهای فیزیکی احداثی در تعاونی، متراژ، پارکینگ، انباری و عضو منتسب‌شده.',
    primaryKey: 'id (UUID)',
    foreignKeys: [
      { field: 'cooperative_id', references: 'cooperatives(id)', relationType: 'N:1' },
      { field: 'assigned_member_id', references: 'memberships(id)', relationType: 'N:1 (اختیاری)' }
    ],
    fields: [
      { name: 'id', type: 'UUID', faName: 'شناسه واحد', isRequired: true, isUnique: true },
      { name: 'cooperative_id', type: 'UUID', faName: 'تعاونی مربوطه', isRequired: true },
      { name: 'unit_number', type: 'VARCHAR(20)', faName: 'شماره واحد', isRequired: true },
      { name: 'block', type: 'VARCHAR(50)', faName: 'نام/شماره بلوک', isRequired: true },
      { name: 'floor', type: 'INTEGER', faName: 'طبقه', isRequired: true },
      { name: 'area_m2', type: 'NUMERIC(6,2)', faName: 'متراژ مفید (متر مربع)', isRequired: true },
      { name: 'parking_number', type: 'VARCHAR(50)', faName: 'شماره پارکینگ', isRequired: false },
      { name: 'storage_number', type: 'VARCHAR(50)', faName: 'شماره انباری', isRequired: false },
      { name: 'status', type: 'ENUM (UnitStatus)', faName: 'وضعیت (AVAILABLE, ASSIGNED, RESERVED)', isRequired: true },
    ]
  },
  {
    name: 'InstallmentPlan',
    tableName: 'installment_plans',
    faTitle: 'سرفصل برنامه اقساط (InstallmentPlan)',
    category: 'FINANCE',
    description: 'قرارداد مالی کلی ساخت برای هر واحد مسکونی و تعهد کل ریالی عضو.',
    primaryKey: 'id (UUID)',
    foreignKeys: [
      { field: 'cooperative_id', references: 'cooperatives(id)', relationType: 'N:1' },
      { field: 'unit_id', references: 'units(id)', relationType: '1:1' },
      { field: 'member_id', references: 'memberships(id)', relationType: 'N:1' }
    ],
    fields: [
      { name: 'id', type: 'UUID', faName: 'شناسه برنامه اقساط', isRequired: true, isUnique: true },
      { name: 'cooperative_id', type: 'UUID', faName: 'تعاونی مالک', isRequired: true },
      { name: 'unit_id', type: 'UUID', faName: 'واحد اختصاص‌یافته', isRequired: true },
      { name: 'member_id', type: 'UUID', faName: 'عضو متعهد', isRequired: true },
      { name: 'title', type: 'VARCHAR(200)', faName: 'عنوان قرارداد اقساط', isRequired: true },
      { name: 'total_cost_rial', type: 'BIGINT', faName: 'کل مبلغ برآورد شده به ریال (عدد صحیح)', isRequired: true },
      { name: 'created_at', type: 'TIMESTAMPTZ', faName: 'تاریخ صدور قرارداد', isRequired: true },
    ]
  },
  {
    name: 'InstallmentItem',
    tableName: 'installment_items',
    faTitle: 'ریز اقساط و سررسیدها (InstallmentItem)',
    category: 'FINANCE',
    description: 'اقساط انفرادی بر حسب مراحل ساخت (زمین، فونداسیون، سفت‌کاری، نازک‌کاری) همراه با تاریخ سررسید و مبلغ ریالی.',
    primaryKey: 'id (UUID)',
    foreignKeys: [
      { field: 'plan_id', references: 'installment_plans(id)', relationType: 'N:1' },
      { field: 'cooperative_id', references: 'cooperatives(id)', relationType: 'N:1' }
    ],
    fields: [
      { name: 'id', type: 'UUID', faName: 'شناسه قسط', isRequired: true, isUnique: true },
      { name: 'plan_id', type: 'UUID', faName: 'ارجاع به برنامه اقساط', isRequired: true },
      { name: 'cooperative_id', type: 'UUID', faName: 'تعاونی', isRequired: true },
      { name: 'stage', type: 'ENUM (Stage)', faName: 'کد مرحله ساخت', isRequired: true },
      { name: 'stage_title', type: 'VARCHAR(255)', faName: 'عنوان مرحله (سفت‌کاری...) ', isRequired: true },
      { name: 'due_date', type: 'TIMESTAMPTZ', faName: 'موعد سررسید', isRequired: true },
      { name: 'amount_rial', type: 'BIGINT', faName: 'مبلغ قسط به ریال (عدد صحیح)', isRequired: true },
      { name: 'paid_amount_rial', type: 'BIGINT', faName: 'مبلغ پرداخت‌شده تا کنون', isRequired: true },
      { name: 'status', type: 'ENUM (Status)', faName: 'وضعیت (PENDING, PARTIAL, PAID, OVERDUE)', isRequired: true },
    ]
  },
  {
    name: 'Payment',
    tableName: 'payments',
    faTitle: 'تراکنش پرداخت (Payment)',
    category: 'FINANCE',
    description: 'ثبت پرداخت‌های بانکی آنلاین (ساندباکس) و واریزهای دستی فیش بانکی همراه با کد رهگیری.',
    primaryKey: 'id (UUID)',
    foreignKeys: [
      { field: 'cooperative_id', references: 'cooperatives(id)', relationType: 'N:1' },
      { field: 'member_id', references: 'memberships(id)', relationType: 'N:1' },
      { field: 'installment_item_id', references: 'installment_items(id)', relationType: 'N:1' }
    ],
    fields: [
      { name: 'id', type: 'UUID', faName: 'شناسه پرداخت', isRequired: true, isUnique: true },
      { name: 'cooperative_id', type: 'UUID', faName: 'تعاونی دریافت‌کننده', isRequired: true },
      { name: 'member_id', type: 'UUID', faName: 'عضو پرداخت‌کننده', isRequired: true },
      { name: 'installment_item_id', type: 'UUID', faName: 'قسط مربوطه', isRequired: true },
      { name: 'amount_rial', type: 'BIGINT', faName: 'مبلغ واریزشده به ریال', isRequired: true },
      { name: 'method', type: 'ENUM (Method)', faName: 'روش (ONLINE_SANDBOX یا OFFLINE_RECEIPT)', isRequired: true },
      { name: 'status', type: 'ENUM (Status)', faName: 'وضعیت (PENDING_APPROVAL, APPROVED, REJECTED, SUCCESS)', isRequired: true },
      { name: 'tracking_code', type: 'VARCHAR(100)', faName: 'کد رهگیری تراکنش یا فیش', isRequired: true, isUnique: true },
      { name: 'gateway_name', type: 'VARCHAR(100)', faName: 'نام درگاه / بانک', isRequired: false },
      { name: 'paid_at', type: 'TIMESTAMPTZ', faName: 'زمان دقیق پرداخت', isRequired: true },
    ]
  },
  {
    name: 'Receipt',
    tableName: 'receipts',
    faTitle: 'رسید و فیش بانکی (Receipt)',
    category: 'FINANCE',
    description: 'تصویر و مشخصات فیش واریز آفلاین به همراه نتیجه بررسی مدیر تعاونی.',
    primaryKey: 'id (UUID)',
    foreignKeys: [
      { field: 'payment_id', references: 'payments(id)', relationType: '1:1' },
      { field: 'cooperative_id', references: 'cooperatives(id)', relationType: 'N:1' },
      { field: 'reviewed_by', references: 'users(id)', relationType: 'N:1 (اختیاری)' }
    ],
    fields: [
      { name: 'id', type: 'UUID', faName: 'شناسه رسید', isRequired: true, isUnique: true },
      { name: 'payment_id', type: 'UUID', faName: 'پرداخت مربوطه', isRequired: true, isUnique: true },
      { name: 'file_url', type: 'TEXT', faName: 'آدرس ذخیره‌سازی در Object Storage', isRequired: true },
      { name: 'original_file_name', type: 'VARCHAR(255)', faName: 'نام اصلی فایل', isRequired: true },
      { name: 'mime_type', type: 'VARCHAR(100)', faName: 'نوع فایل (jpeg, png, pdf)', isRequired: true },
      { name: 'file_size_bytes', type: 'BIGINT', faName: 'حجم به بایت (حداکثر ۲MB)', isRequired: true },
      { name: 'bank_name', type: 'VARCHAR(100)', faName: 'نام بانک واریزکننده', isRequired: true },
      { name: 'reference_number', type: 'VARCHAR(100)', faName: 'شماره ارجاع / پیگیری بانکی', isRequired: true },
      { name: 'deposit_date', type: 'DATE', faName: 'تاریخ واریز مندرج در فیش', isRequired: true },
      { name: 'reject_reason', type: 'TEXT', faName: 'علت رد فیش در صورت عدم تایید', isRequired: false },
    ]
  },
  {
    name: 'Announcement',
    tableName: 'announcements',
    faTitle: 'اطلاعیه‌ها (Announcement)',
    category: 'SYSTEM',
    description: 'تابلوی اعلانات پروژه. اگر cooperative_id برابر null باشد، اطلاعیه سراسری توسط مدیر کل است.',
    primaryKey: 'id (UUID)',
    foreignKeys: [
      { field: 'cooperative_id', references: 'cooperatives(id)', relationType: 'N:1 (اختیاری - Nullable)' },
      { field: 'author_id', references: 'users(id)', relationType: 'N:1' }
    ],
    fields: [
      { name: 'id', type: 'UUID', faName: 'شناسه اطلاعیه', isRequired: true, isUnique: true },
      { name: 'cooperative_id', type: 'UUID', faName: 'تعاونی (Null = سراسری مدیر کل)', isRequired: false },
      { name: 'author_id', type: 'UUID', faName: 'نویسنده', isRequired: true },
      { name: 'title', type: 'VARCHAR(255)', faName: 'عنوان اطلاعیه', isRequired: true },
      { name: 'content', type: 'TEXT', faName: 'متن کامل خبر یا بخشنامه', isRequired: true },
      { name: 'priority', type: 'ENUM (Priority)', faName: 'اولویت (NORMAL, IMPORTANT, URGENT)', isRequired: true },
      { name: 'published_at', type: 'TIMESTAMPTZ', faName: 'تاریخ انتشار', isRequired: true },
      { name: 'view_count', type: 'INTEGER', faName: 'تعداد مشاهده', isRequired: true },
    ]
  },
  {
    name: 'AuditLog',
    tableName: 'audit_logs',
    faTitle: 'دفترکل رویدادنگاری حسابرسی (AuditLog)',
    category: 'SYSTEM',
    description: 'جدول غیرقابل ویرایش ثبت تمام تراکنش‌ها، تایید یا رد فیش‌ها، صدور قسط و ورود به سیستم.',
    primaryKey: 'id (UUID)',
    foreignKeys: [
      { field: 'cooperative_id', references: 'cooperatives(id)', relationType: 'N:1 (اختیاری)' },
      { field: 'user_id', references: 'users(id)', relationType: 'N:1' }
    ],
    fields: [
      { name: 'id', type: 'UUID', faName: 'شناسه لاگ', isRequired: true, isUnique: true },
      { name: 'cooperative_id', type: 'UUID', faName: 'تعاونی مربوطه', isRequired: false },
      { name: 'user_id', type: 'UUID', faName: 'کاربر اقدام‌کننده', isRequired: true },
      { name: 'user_full_name', type: 'VARCHAR(150)', faName: 'نام کاربر در لحظه ثبت', isRequired: true },
      { name: 'user_role', type: 'ENUM (UserRole)', faName: 'نقش کاربر در لحظه ثبت', isRequired: true },
      { name: 'action', type: 'ENUM (AuditAction)', faName: 'نوع عملیات', isRequired: true },
      { name: 'entity_type', type: 'VARCHAR(50)', faName: 'موجودیت هدف', isRequired: true },
      { name: 'entity_id', type: 'UUID', faName: 'شناسه موجودیت هدف', isRequired: true },
      { name: 'description', type: 'TEXT', faName: 'توضیحات فارسی رویداد', isRequired: true },
      { name: 'previous_state', type: 'JSONB', faName: 'وضعیت قبل از تغییر', isRequired: false },
      { name: 'new_state', type: 'JSONB', faName: 'وضعیت جدید پس از تغییر', isRequired: false },
      { name: 'ip_address', type: 'VARCHAR(45)', faName: 'آدرس IP کاربر', isRequired: false },
      { name: 'timestamp', type: 'TIMESTAMPTZ', faName: 'زمان دقیق رویداد', isRequired: true },
    ]
  }
];

export const ErdViewer: React.FC = () => {
  const [selectedEntity, setSelectedEntity] = useState<EntityDefinition>(ENTITIES[0]);

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      {/* سربرگ بخش ERD */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
                <Database className="w-5 h-5" />
              </div>
              <h2 className="text-xl font-black text-slate-900">نمودار رابطه موجودیت‌ها (ERD) و معماری پایگاه داده</h2>
            </div>
            <p className="text-xs text-slate-500">
              ۱۰ جدول پیوسته با تضمین رابطه منطقی، یکپارچگی ارجاعی (Foreign Key Integrity) و تفکیک چندمستأجری
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs font-semibold bg-emerald-50 text-emerald-700 px-3 py-2 rounded-xl border border-emerald-200">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>کنترل دسترسی سروری بر پایه cooperative_id</span>
          </div>
        </div>
      </div>

      {/* نقشه شماتیک و ارتباطات اصلی */}
      <div className="bg-slate-900 rounded-3xl p-6 sm:p-8 text-white space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-sm sm:text-base flex items-center gap-2">
            <Link2 className="w-4 h-4 text-sky-400" />
            گراف مفهومی روابط جدول‌ها در سیستم چندمستأجری
          </h3>
          <span className="text-xs text-slate-400">کلیک روی هر جدول جهت بررسی فیلدها</span>
        </div>

        {/* دیاگرام جعبه‌ای تعاملی */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {ENTITIES.map((ent) => {
            const isSelected = selectedEntity.name === ent.name;
            const badgeColor = 
              ent.category === 'CORE' 
                ? 'bg-sky-500/20 text-sky-300 border-sky-500/30' 
                : ent.category === 'FINANCE'
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                : 'bg-purple-500/20 text-purple-300 border-purple-500/30';

            return (
              <button
                key={ent.name}
                onClick={() => setSelectedEntity(ent)}
                className={`p-4 rounded-2xl text-right transition-all cursor-pointer border ${
                  isSelected
                    ? 'bg-slate-800 border-sky-400 shadow-lg shadow-sky-500/10 scale-102 ring-2 ring-sky-400/30'
                    : 'bg-slate-800/60 border-slate-700 hover:bg-slate-800 hover:border-slate-600'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${badgeColor}`}>
                    {ent.category === 'CORE' ? 'پایه' : ent.category === 'FINANCE' ? 'مالی' : 'سیستمی'}
                  </span>
                  <Table className="w-3.5 h-3.5 text-slate-400" />
                </div>
                <div className="font-bold text-xs sm:text-sm text-white truncate">{ent.faTitle}</div>
                <div className="text-[11px] font-mono text-slate-400 mt-1">{ent.tableName}</div>
                <div className="text-[10px] text-slate-400 mt-2 truncate">
                  {ent.fields.length} فیلد | {ent.foreignKeys.length} رابطه
                </div>
              </button>
            );
          })}
        </div>

        {/* توضیح روابط کلیدی */}
        <div className="bg-slate-800/70 p-4 rounded-2xl border border-slate-700 text-xs text-slate-300 space-y-2">
          <div className="font-bold text-sky-300 flex items-center gap-1.5">
            <Info className="w-4 h-4 text-sky-400" />
            منطق روابط کلیدی بین جدول‌ها:
          </div>
          <ul className="list-disc list-inside space-y-1 text-slate-300">
            <li><span className="font-semibold text-white">کاربر ↔ تعاونی:</span> رابطه چند-به-چند از طریق جدول واسط <code className="text-sky-300 font-mono">memberships</code>، زیرا یک کاربر می‌تواند در یک تعاونی عضو و در تعاونی دیگر مدیر باشد.</li>
            <li><span className="font-semibold text-white">تعاونی ↔ واحد مسکونی:</span> هر واحد دقیقاً متعلق به یک تعاونی است (1:N) و می‌تواند به یک عضو منتسب شود.</li>
            <li><span className="font-semibold text-white">واحد ↔ برنامه اقساط:</span> هر واحد دارای جدول اقساط متناظر است و اقساط ماهانه در <code className="text-emerald-300 font-mono">installment_items</code> شکسته می‌شوند.</li>
            <li><span className="font-semibold text-white">پرداخت ↔ فیش واریز:</span> در واریزهای دستی آفلاین، هر پرداخت دقیقاً یک رکورد رسید (<code className="text-emerald-300 font-mono">receipts</code>) با رابطه 1:1 دارد.</li>
          </ul>
        </div>
      </div>

      {/* جزئیات جدول انتخاب شده */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="bg-slate-900 text-white text-xs px-2.5 py-0.5 rounded-full font-mono font-bold">
                {selectedEntity.tableName}
              </span>
              <h3 className="text-lg font-black text-slate-900">{selectedEntity.faTitle}</h3>
            </div>
            <p className="text-xs text-slate-500">{selectedEntity.description}</p>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-xs bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200">
              <span className="text-slate-500">کلید اصلی: </span>
              <span className="font-mono font-bold text-slate-800">{selectedEntity.primaryKey}</span>
            </div>
          </div>
        </div>

        {/* لیست روابط خارجی (Foreign Keys) */}
        {selectedEntity.foreignKeys.length > 0 && (
          <div className="p-4 rounded-2xl bg-sky-50/70 border border-sky-100 space-y-2">
            <div className="text-xs font-bold text-sky-900 flex items-center gap-1.5">
              <Link2 className="w-3.5 h-3.5 text-sky-600" />
              کلیدهای خارجی و ارجاعات رابطه‌ای این جدول:
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              {selectedEntity.foreignKeys.map((fk, idx) => (
                <div key={idx} className="bg-white p-2.5 rounded-xl border border-sky-200 flex items-center justify-between">
                  <span className="font-mono text-slate-700">{fk.field}</span>
                  <div className="flex items-center gap-1.5 text-sky-700 font-medium">
                    <ArrowRight className="w-3.5 h-3.5" />
                    <span className="font-mono">{fk.references}</span>
                    <span className="text-[10px] bg-sky-100 text-sky-800 px-1.5 py-0.5 rounded font-bold">{fk.relationType}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* جدول فیلدهای موجودیت */}
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-600 border-b border-slate-200">
                <th className="py-3 px-4 font-bold">نام ستون (Column)</th>
                <th className="py-3 px-4 font-bold">نوع داده (Type)</th>
                <th className="py-3 px-4 font-bold">عنوان فارسی</th>
                <th className="py-3 px-4 font-bold">ضروری / یکتا</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {selectedEntity.fields.map((f, i) => (
                <tr key={i} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 px-4 font-mono font-bold text-slate-900 flex items-center gap-2">
                    {f.name === 'id' && <Key className="w-3.5 h-3.5 text-amber-500" />}
                    {f.name}
                  </td>
                  <td className="py-3 px-4 font-mono text-indigo-600 font-medium">{f.type}</td>
                  <td className="py-3 px-4 text-slate-700">{f.faName}</td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-1.5">
                      {f.isRequired ? (
                        <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded text-[10px] font-bold">NOT NULL</span>
                      ) : (
                        <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-[10px]">NULLABLE</span>
                      )}
                      {f.isUnique && (
                        <span className="bg-amber-100 text-amber-800 px-2 py-0.5 rounded text-[10px] font-bold">UNIQUE</span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      </div>

    </div>
  );
};
