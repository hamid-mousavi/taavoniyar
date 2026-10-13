-- =========================================================================
-- سامانه یکپارچه مدیریت تعاونی‌های مسکن (مسکن‌یار)
-- اسکریپت استاندارد ایجاد جداول پایگاه داده PostgreSQL (نسخه سازگار با Supabase و Local Postgres)
-- نگارش: فاز ۲ + ماژول هزینه‌های جاری
-- پشتیبانی کامل از: Supabase, Local Docker Postgres, Linux VPS, Cloud SQL, Neon
-- ویژگی‌ها:
-- ۱. شناسه‌های امن و منعطف (VARCHAR(64) با مقدار پیش‌فرض gen_random_uuid())
-- ۲. مبالغ کاملاً ریالی و عدد صحیح (BIGINT) بدون ممیز اعشاری
-- ۳. معماری چندمستأجری (Multi-Tenant) با تفکیک بر اساس cooperative_id
-- ۴. غیرفعال‌سازی محدودیت‌های پیش‌فرض RLS در Supabase برای کارکرد بدون مانع Anon Key
-- =========================================================================

-- فعال‌سازی توابع تولید UUID استاندارد در PostgreSQL
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ساخت انواع شمارشی با مدیریت ایمن در صورت اجرای مجدد (Idempotent ENUMs)
DO $$ BEGIN
  CREATE TYPE user_role_enum AS ENUM ('SUPER_ADMIN', 'COOP_ADMIN', 'MEMBER');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE unit_status_enum AS ENUM ('AVAILABLE', 'ASSIGNED', 'RESERVED');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE installment_stage_enum AS ENUM (
    'LAND_SHARE', 'FOUNDATION', 'ROUGH_CONSTRUCTION', 
    'FACILITIES', 'FINISHING', 'DELIVERY', 'OTHER'
  );
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE installment_status_enum AS ENUM ('PENDING', 'PARTIAL', 'PAID', 'OVERDUE');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE payment_method_enum AS ENUM (
    'ONLINE_SANDBOX', 'OFFLINE_RECEIPT', 'CASH_DESK', 'CARD_TO_CARD', 'MANAGER_REGISTERED'
  );
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE payment_status_enum AS ENUM ('PENDING_APPROVAL', 'APPROVED', 'REJECTED', 'SUCCESS');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE announcement_priority_enum AS ENUM ('NORMAL', 'IMPORTANT', 'URGENT');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE audit_action_enum AS ENUM (
    'CREATE', 'UPDATE', 'DELETE', 
    'PAYMENT_SUBMITTED', 'PAYMENT_APPROVED', 'PAYMENT_REJECTED', 
    'LOGIN_OTP', 'UNIT_ASSIGNED'
  );
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE fee_category_enum AS ENUM (
    'MONTHLY_CHARGE', 'ELEVATOR', 'SECURITY', 'UTILITIES', 'REPAIR', 'OTHER'
  );
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE fee_status_enum AS ENUM ('PENDING', 'PAID', 'OVERDUE');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- ۱. جدول کاربران (users)
CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(64) PRIMARY KEY DEFAULT gen_random_uuid()::text,
  mobile VARCHAR(11) NOT NULL UNIQUE,
  full_name VARCHAR(150) NOT NULL,
  national_code VARCHAR(10) NOT NULL UNIQUE,
  father_name VARCHAR(100),
  avatar_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT check_iranian_mobile CHECK (mobile ~ '^09[0-9]{9}$'),
  CONSTRAINT check_iranian_national_code CHECK (national_code ~ '^[0-9]{10}$')
);

-- ۲. جدول تعاونی‌های مسکن (cooperatives)
CREATE TABLE IF NOT EXISTS cooperatives (
  id VARCHAR(64) PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name VARCHAR(200) NOT NULL,
  code VARCHAR(50) NOT NULL UNIQUE,
  project_name VARCHAR(200) NOT NULL,
  address TEXT NOT NULL,
  total_units INTEGER NOT NULL CHECK (total_units > 0),
  bank_name VARCHAR(100) NOT NULL,
  account_number VARCHAR(50) NOT NULL,
  sheba_number VARCHAR(50) NOT NULL,
  card_holder_name VARCHAR(150) NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- اصلاح طول ستون در صورت وجود قبلی جدول در دیتابیس
DO $$ BEGIN
  ALTER TABLE cooperatives ALTER COLUMN sheba_number TYPE VARCHAR(50);
EXCEPTION WHEN others THEN null; END $$;

-- ۳. جدول عضویت و انتساب نقش کاربر در تعاونی (memberships)
CREATE TABLE IF NOT EXISTS memberships (
  id VARCHAR(64) PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  cooperative_id VARCHAR(64) NOT NULL REFERENCES cooperatives(id) ON DELETE CASCADE,
  role user_role_enum NOT NULL DEFAULT 'MEMBER',
  membership_number VARCHAR(50) NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_user_coop UNIQUE (user_id, cooperative_id)
);

CREATE INDEX IF NOT EXISTS idx_memberships_coop_id ON memberships(cooperative_id);
CREATE INDEX IF NOT EXISTS idx_memberships_user_id ON memberships(user_id);
CREATE INDEX IF NOT EXISTS idx_memberships_role ON memberships(role);

-- ۴. جدول واحدهای مسکونی (units)
CREATE TABLE IF NOT EXISTS units (
  id VARCHAR(64) PRIMARY KEY DEFAULT gen_random_uuid()::text,
  cooperative_id VARCHAR(64) NOT NULL REFERENCES cooperatives(id) ON DELETE CASCADE,
  unit_number VARCHAR(20) NOT NULL,
  block VARCHAR(50) NOT NULL,
  floor INTEGER NOT NULL,
  area_m2 NUMERIC(6, 2) NOT NULL CHECK (area_m2 > 0),
  parking_number VARCHAR(50),
  storage_number VARCHAR(50),
  assigned_member_id VARCHAR(64) REFERENCES memberships(id) ON DELETE SET NULL,
  status unit_status_enum NOT NULL DEFAULT 'AVAILABLE',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_coop_block_unit UNIQUE (cooperative_id, block, unit_number)
);

CREATE INDEX IF NOT EXISTS idx_units_coop_id ON units(cooperative_id);
CREATE INDEX IF NOT EXISTS idx_units_status ON units(status);

-- ۵. جدول سرفصل برنامه اقساط واحدها (installment_plans)
CREATE TABLE IF NOT EXISTS installment_plans (
  id VARCHAR(64) PRIMARY KEY DEFAULT gen_random_uuid()::text,
  cooperative_id VARCHAR(64) NOT NULL REFERENCES cooperatives(id) ON DELETE CASCADE,
  unit_id VARCHAR(64) NOT NULL REFERENCES units(id) ON DELETE CASCADE,
  member_id VARCHAR(64) NOT NULL REFERENCES memberships(id) ON DELETE RESTRICT,
  title VARCHAR(200) NOT NULL,
  total_cost_rial BIGINT NOT NULL CHECK (total_cost_rial > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_plans_coop_member ON installment_plans(cooperative_id, member_id);

-- ۶. جدول ریز اقساط و موعدهای سررسید (installment_items)
CREATE TABLE IF NOT EXISTS installment_items (
  id VARCHAR(64) PRIMARY KEY DEFAULT gen_random_uuid()::text,
  plan_id VARCHAR(64) NOT NULL REFERENCES installment_plans(id) ON DELETE CASCADE,
  cooperative_id VARCHAR(64) NOT NULL REFERENCES cooperatives(id) ON DELETE CASCADE,
  stage installment_stage_enum NOT NULL,
  stage_title VARCHAR(255) NOT NULL,
  due_date TIMESTAMPTZ NOT NULL,
  amount_rial BIGINT NOT NULL CHECK (amount_rial > 0),
  paid_amount_rial BIGINT NOT NULL DEFAULT 0 CHECK (paid_amount_rial >= 0),
  status installment_status_enum NOT NULL DEFAULT 'PENDING',
  penalty_per_day_rial BIGINT DEFAULT 0 CHECK (penalty_per_day_rial >= 0)
);

CREATE INDEX IF NOT EXISTS idx_items_plan_id ON installment_items(plan_id);
CREATE INDEX IF NOT EXISTS idx_items_coop_status ON installment_items(cooperative_id, status);
CREATE INDEX IF NOT EXISTS idx_items_due_date ON installment_items(due_date);

-- ۷. جدول تراکنش‌های پرداخت (payments)
CREATE TABLE IF NOT EXISTS payments (
  id VARCHAR(64) PRIMARY KEY DEFAULT gen_random_uuid()::text,
  cooperative_id VARCHAR(64) NOT NULL REFERENCES cooperatives(id) ON DELETE RESTRICT,
  member_id VARCHAR(64) NOT NULL REFERENCES memberships(id) ON DELETE RESTRICT,
  installment_item_id VARCHAR(64) REFERENCES installment_items(id) ON DELETE RESTRICT,
  amount_rial BIGINT NOT NULL CHECK (amount_rial > 0),
  method payment_method_enum NOT NULL,
  status payment_status_enum NOT NULL DEFAULT 'PENDING_APPROVAL',
  tracking_code VARCHAR(100) NOT NULL UNIQUE,
  gateway_name VARCHAR(100),
  paid_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payments_coop_id ON payments(cooperative_id);
CREATE INDEX IF NOT EXISTS idx_payments_member_id ON payments(member_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);

-- ۸. جدول رسیدهای واریز بانکی آفلاین (receipts)
CREATE TABLE IF NOT EXISTS receipts (
  id VARCHAR(64) PRIMARY KEY DEFAULT gen_random_uuid()::text,
  payment_id VARCHAR(64) NOT NULL UNIQUE REFERENCES payments(id) ON DELETE CASCADE,
  cooperative_id VARCHAR(64) NOT NULL REFERENCES cooperatives(id) ON DELETE RESTRICT,
  file_url TEXT NOT NULL,
  original_file_name VARCHAR(255) NOT NULL,
  mime_type VARCHAR(100) NOT NULL,
  file_size_bytes BIGINT NOT NULL CHECK (file_size_bytes <= 2097152),
  bank_name VARCHAR(100) NOT NULL,
  reference_number VARCHAR(100) NOT NULL,
  deposit_date DATE NOT NULL,
  deposit_time TIME,
  deposit_account VARCHAR(50),
  reviewed_by VARCHAR(64) REFERENCES users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  reject_reason TEXT,
  ocr_extracted_json JSONB
);

CREATE INDEX IF NOT EXISTS idx_receipts_coop_id ON receipts(cooperative_id);
CREATE INDEX IF NOT EXISTS idx_receipts_ref_number ON receipts(reference_number);

-- ۹. جدول اطلاعیه‌ها (announcements)
CREATE TABLE IF NOT EXISTS announcements (
  id VARCHAR(64) PRIMARY KEY DEFAULT gen_random_uuid()::text,
  cooperative_id VARCHAR(64) REFERENCES cooperatives(id) ON DELETE CASCADE,
  author_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  priority announcement_priority_enum NOT NULL DEFAULT 'NORMAL',
  published_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  view_count INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_announcements_coop_pub ON announcements(cooperative_id, published_at DESC);

-- ۱۰. جدول لاگ حسابرسی تراکنش‌ها و تغییرات (audit_logs)
CREATE TABLE IF NOT EXISTS audit_logs (
  id VARCHAR(64) PRIMARY KEY DEFAULT gen_random_uuid()::text,
  cooperative_id VARCHAR(64) REFERENCES cooperatives(id) ON DELETE SET NULL,
  user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  user_full_name VARCHAR(150) NOT NULL,
  user_role user_role_enum NOT NULL,
  action audit_action_enum NOT NULL,
  entity_type VARCHAR(50) NOT NULL,
  entity_id VARCHAR(64) NOT NULL,
  description TEXT NOT NULL,
  previous_state JSONB,
  new_state JSONB,
  ip_address VARCHAR(45),
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_coop_time ON audit_logs(cooperative_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON audit_logs(entity_type, entity_id);

-- ۱۱. جدول هزینه‌های جاری و ماهانه مسکن (monthly_fees)
CREATE TABLE IF NOT EXISTS monthly_fees (
  id VARCHAR(64) PRIMARY KEY DEFAULT gen_random_uuid()::text,
  cooperative_id VARCHAR(64) NOT NULL REFERENCES cooperatives(id) ON DELETE CASCADE,
  unit_id VARCHAR(64) REFERENCES units(id) ON DELETE SET NULL,
  member_id VARCHAR(64) NOT NULL REFERENCES memberships(id) ON DELETE RESTRICT,
  title VARCHAR(255) NOT NULL,
  amount_rial BIGINT NOT NULL CHECK (amount_rial > 0),
  due_date TIMESTAMPTZ NOT NULL,
  period_month INTEGER NOT NULL CHECK (period_month BETWEEN 1 AND 12),
  period_year INTEGER NOT NULL CHECK (period_year > 1400),
  fee_category fee_category_enum NOT NULL DEFAULT 'MONTHLY_CHARGE',
  status fee_status_enum NOT NULL DEFAULT 'PENDING',
  paid_amount_rial BIGINT NOT NULL DEFAULT 0 CHECK (paid_amount_rial >= 0),
  paid_at TIMESTAMPTZ,
  paid_by_manager BOOLEAN NOT NULL DEFAULT FALSE,
  payment_reference VARCHAR(100),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_monthly_fees_coop ON monthly_fees(cooperative_id);
CREATE INDEX IF NOT EXISTS idx_monthly_fees_member ON monthly_fees(member_id);
CREATE INDEX IF NOT EXISTS idx_monthly_fees_status ON monthly_fees(status);
CREATE INDEX IF NOT EXISTS idx_monthly_fees_due ON monthly_fees(due_date);

-- =========================================================================
-- تنظیمات مجوزها و امنیت برای Supabase (غیرفعال‌سازی موانع RLS در محیط توسعه)
-- این بخش باعث می‌شود دسترسی‌های کلاینت Anon Key بدون خطای 403 یا Policy انجام شود.
-- =========================================================================
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE cooperatives DISABLE ROW LEVEL SECURITY;
ALTER TABLE memberships DISABLE ROW LEVEL SECURITY;
ALTER TABLE units DISABLE ROW LEVEL SECURITY;
ALTER TABLE installment_plans DISABLE ROW LEVEL SECURITY;
ALTER TABLE installment_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE payments DISABLE ROW LEVEL SECURITY;
ALTER TABLE receipts DISABLE ROW LEVEL SECURITY;
ALTER TABLE announcements DISABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE monthly_fees DISABLE ROW LEVEL SECURITY;
