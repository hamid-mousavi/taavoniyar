-- =========================================================================
-- بسته جامع ایجاد جداول و داده‌های اولیه سامانه مدیریت تعاونی‌های مسکن (مسکن‌یار)
-- نگارش: جامع (DDL Schema + Supabase RLS Fix + Seed Data)
-- جهت اجرای مستقیم در:
-- ۱. تب SQL Editor در داشبورد Supabase
-- ۲. پایگاه داده محلی (Local PostgreSQL / Docker) با دستور: psql -f complete_migration.sql
-- ۳. سرور لینوکس اختصاصی (VPS)
-- =========================================================================

-- فعال‌سازی افزونه‌های استاندارد
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ساخت انواع شمارشی بدون خطا در اجرای مجدد (Idempotent ENUMs)
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

-- غیرفعال‌سازی موانع RLS در Supabase برای جلوگیری از خطای مجوز
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

-- =========================================================================
-- بخش دوم: درج داده‌های اولیه آزمایشی (Seed Data)
-- =========================================================================

-- ۱. تعاونی‌های مسکن
INSERT INTO cooperatives (id, name, code, project_name, address, total_units, bank_name, account_number, sheba_number, card_holder_name, is_active)
VALUES
('coop-1', 'تعاونی مسکن فرهنگیان منطقه ۵ تهران', 'MASKAN-FARHANG-05', 'پروژه مسکونی مروارید چیتگر', 'تهران، منطقه ۲۲، دریاچه شهدای خلیج فارس، میدان ساحل، برج مروارید', 48, 'بانک ملی ایران', '۰۱۰۸۴۵۶۷۸۹۰۰۳', 'IR640170000000108456789003', 'تعاونی مسکن فرهنگیان', TRUE),
('coop-2', 'تعاونی مسکن کادر درمان بیمارستان رازی', 'MASKAN-RAZI-MED', 'پروژه مسکونی یاسمن الهیه', 'تهران، شمیرانات، الهیه، خیابان فرشته، بن‌بست یاسمن، پروژه کادر درمان', 64, 'بانک ملت', '۴۷۵۸۲۹۳۰۱۱', 'IR82012000000004758293011', 'تعاونی مسکن کادر درمان رازی', TRUE),
('coop-3', 'تعاونی مسکن کارکنان گروه صنعتی پارس', 'MASKAN-PARS-IND', 'پروژه بزرگ البرز فردیس', 'کرج، فردیس، بلوار شهدای فردیس، مجتمع مسکونی البرز پارس', 120, 'بانک صادرات ایران', '۰۲۰۹۸۷۶۵۴۳۰۰۵', 'IR450190000000209876543005', 'تعاونی مسکن گروه صنعتی پارس', TRUE)
ON CONFLICT (id) DO NOTHING;

-- ۲. کاربران (مدیران و اعضا)
INSERT INTO users (id, mobile, full_name, national_code, father_name, avatar_url, is_active)
VALUES
('usr-super-admin', '09121111111', 'مهندس علیرضا سلیمانی (مدیر کل و ناظر عالیه)', '0012345678', 'محمود', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150', TRUE),
('usr-admin-1', '09122222221', 'دکتر حمیدرضا احمدی (مدیر تعاونی فرهنگیان)', '0023456789', 'ابراهیم', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150', TRUE),
('usr-admin-2', '09122222222', 'سرکار خانم مریم کاظمی (مدیر تعاونی کادر درمان)', '0034567890', 'علی‌اکبر', 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150', TRUE),
('usr-admin-3', '09122222223', 'مهندس مصطفی نوری (مدیر تعاونی پارس)', '0045678901', 'غلامرضا', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150', TRUE),
('usr-mem-1', '09123333331', 'علی مرادی', '0056789012', 'حسین', 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150', TRUE),
('usr-mem-2', '09123333332', 'فاطمه صادقی', '0067890123', 'محمد', 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150', TRUE),
('usr-mem-3', '09123333333', 'حسین کریمی', '0078901234', 'جعفر', 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150', TRUE),
('usr-mem-4', '09123333334', 'زهرا حسینی', '0089012345', 'اسماعیل', 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150', TRUE),
('usr-mem-5', '09123333335', 'امیرحسین رضایی', '0090123456', 'قاسم', 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150', TRUE),
('usr-mem-6', '09123333336', 'سارا موسوی', '0101234567', 'مرتضی', 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150', TRUE)
ON CONFLICT (id) DO NOTHING;

-- ۳. عضویت‌ها و نقش‌ها در تعاونی‌ها (Memberships)
INSERT INTO memberships (id, user_id, cooperative_id, role, membership_number, is_active)
VALUES
('mem-super', 'usr-super-admin', 'coop-1', 'SUPER_ADMIN', 'MEMBER-SUPER-01', TRUE),
('mem-admin-1', 'usr-admin-1', 'coop-1', 'COOP_ADMIN', 'MEMBER-C1-ADMIN', TRUE),
('mem-c1-u1', 'usr-mem-1', 'coop-1', 'MEMBER', 'FARHANG-101-01', TRUE),
('mem-c1-u2', 'usr-mem-2', 'coop-1', 'MEMBER', 'FARHANG-102-02', TRUE),
('mem-admin-2', 'usr-admin-2', 'coop-2', 'COOP_ADMIN', 'MEMBER-C2-ADMIN', TRUE),
('mem-c2-u3', 'usr-mem-3', 'coop-2', 'MEMBER', 'RAZI-201-03', TRUE),
('mem-c2-u4', 'usr-mem-4', 'coop-2', 'MEMBER', 'RAZI-202-04', TRUE),
('mem-admin-3', 'usr-admin-3', 'coop-3', 'COOP_ADMIN', 'MEMBER-C3-ADMIN', TRUE),
('mem-c3-u5', 'usr-mem-5', 'coop-3', 'MEMBER', 'PARS-301-05', TRUE),
('mem-c3-u6', 'usr-mem-6', 'coop-3', 'MEMBER', 'PARS-302-06', TRUE)
ON CONFLICT (id) DO NOTHING;

-- ۴. واحدهای مسکونی (Units)
INSERT INTO units (id, cooperative_id, unit_number, block, floor, area_m2, parking_number, storage_number, assigned_member_id, status)
VALUES
('unit-c1-101', 'coop-1', '۱۰۱', 'بلوک A (اقاقیا)', 1, 105.50, 'P-12', 'S-04', 'mem-c1-u1', 'ASSIGNED'),
('unit-c1-102', 'coop-1', '۱۰۲', 'بلوک A (اقاقیا)', 1, 118.00, 'P-13', 'S-05', 'mem-c1-u2', 'ASSIGNED'),
('unit-c1-201', 'coop-1', '۲۰۱', 'بلوک A (اقاقیا)', 2, 105.50, 'P-14', 'S-06', NULL, 'AVAILABLE'),
('unit-c1-202', 'coop-1', '۲۰۲', 'بلوک B (نیلوفر)', 2, 125.00, 'P-15', 'S-07', NULL, 'RESERVED'),
('unit-c2-301', 'coop-2', '۳۰۱', 'بلوک پزشکان', 3, 140.00, 'P-B1-08', 'S-B1-02', 'mem-c2-u3', 'ASSIGNED'),
('unit-c2-302', 'coop-2', '۳۰۲', 'بلوک پزشکان', 3, 135.50, 'P-B1-09', 'S-B1-03', 'mem-c2-u4', 'ASSIGNED'),
('unit-c3-401', 'coop-3', '۴۰۱', 'برج البرز ۱', 4, 92.00, 'P-44', 'S-21', 'mem-c3-u5', 'ASSIGNED'),
('unit-c3-402', 'coop-3', '۴۰۲', 'برج البرز ۱', 4, 95.00, 'P-45', 'S-22', 'mem-c3-u6', 'ASSIGNED')
ON CONFLICT (id) DO NOTHING;

-- ۵. برنامه‌های اقساط (Installment Plans)
INSERT INTO installment_plans (id, cooperative_id, unit_id, member_id, title, total_cost_rial)
VALUES
('plan-c1-u1', 'coop-1', 'unit-c1-101', 'mem-c1-u1', 'برنامه پرداخت واحد ۱۰۱ - آقای علی مرادی', 18000000000),
('plan-c1-u2', 'coop-1', 'unit-c1-102', 'mem-c1-u2', 'برنامه پرداخت واحد ۱۰۲ - خانم فاطمه صادقی', 20000000000),
('plan-c2-u3', 'coop-2', 'unit-c2-301', 'mem-c2-u3', 'برنامه پرداخت واحد ۳۰۱ - آقای حسین کریمی', 32000000000),
('plan-c3-u5', 'coop-3', 'unit-c3-401', 'mem-c3-u5', 'برنامه پرداخت واحد ۴۰۱ - آقای امیرحسین رضایی', 15000000000)
ON CONFLICT (id) DO NOTHING;

-- ۶. ریز اقساط (Installment Items)
INSERT INTO installment_items (id, plan_id, cooperative_id, stage, stage_title, due_date, amount_rial, paid_amount_rial, status, penalty_per_day_rial)
VALUES
('item-c1-u1-1', 'plan-c1-u1', 'coop-1', 'LAND_SHARE', 'قسط ۱: سهم زمین و تراکم شهرداری', '2024-03-20T00:00:00Z', 5000000000, 5000000000, 'PAID', 0),
('item-c1-u1-2', 'plan-c1-u1', 'coop-1', 'FOUNDATION', 'قسط ۲: گودبرداری و اجرای اسکلت فلزی', '2024-06-20T00:00:00Z', 4000000000, 4000000000, 'PAID', 0),
('item-c1-u1-3', 'plan-c1-u1', 'coop-1', 'ROUGH_CONSTRUCTION', 'قسط ۳: سفت‌کاری و دیوارچینی', '2024-10-20T00:00:00Z', 3000000000, 1500000000, 'PARTIAL', 5000000),
('item-c1-u1-4', 'plan-c1-u1', 'coop-1', 'FACILITIES', 'قسط ۴: تأسیسات برقی و لوله‌کشی مکانیکی', '2025-01-20T00:00:00Z', 3000000000, 0, 'PENDING', 5000000),
('item-c1-u1-5', 'plan-c1-u1', 'coop-1', 'FINISHING', 'قسط ۵: نازک‌کاری و نصب کابینت و سرامیک', '2025-05-20T00:00:00Z', 2000000000, 0, 'PENDING', 5000000),
('item-c1-u1-6', 'plan-c1-u1', 'coop-1', 'DELIVERY', 'قسط ۶: تحویل کلید و اخذ پایان‌کار', '2025-09-20T00:00:00Z', 1000000000, 0, 'PENDING', 5000000)
ON CONFLICT (id) DO NOTHING;

-- ۷. هزینه‌های جاری و ماهانه مسکن (Monthly Fees)
INSERT INTO monthly_fees (id, cooperative_id, unit_id, member_id, title, amount_rial, due_date, period_month, period_year, fee_category, status, paid_amount_rial, notes)
VALUES
('fee-1', 'coop-1', 'unit-c1-101', 'mem-c1-u1', 'شارژ ماهیانه ساختمان و نظافت (مهر ۱۴۰۳)', 12000000, '2024-10-22T00:00:00Z', 7, 1403, 'MONTHLY_CHARGE', 'PAID', 12000000, 'واریز به موقع'),
('fee-2', 'coop-1', 'unit-c1-101', 'mem-c1-u1', 'سرویس دوره‌ای آسانسور و بیمه آتش‌سوزی (آبان ۱۴۰۳)', 8500000, '2024-11-21T00:00:00Z', 8, 1403, 'ELEVATOR', 'PENDING', 0, 'در انتظار پرداخت'),
('fee-3', 'coop-1', 'unit-c1-102', 'mem-c1-u2', 'شارژ ماهیانه ساختمان و سرایداری (مهر ۱۴۰۳)', 14000000, '2024-10-22T00:00:00Z', 7, 1403, 'MONTHLY_CHARGE', 'PAID', 14000000, 'تسویه آنلاین'),
('fee-4', 'coop-2', 'unit-c2-301', 'mem-c2-u3', 'شارژ ماهیانه و نگهبانی ۲۴ ساعته (مهر ۱۴۰۳)', 25000000, '2024-10-22T00:00:00Z', 7, 1403, 'SECURITY', 'PAID', 25000000, 'پرداخت شده'),
('fee-5', 'coop-3', 'unit-c3-401', 'mem-c3-u5', 'شارژ ماهیانه مجتمع مسکونی البرز (مهر ۱۴۰۳)', 9500000, '2024-10-22T00:00:00Z', 7, 1403, 'MONTHLY_CHARGE', 'OVERDUE', 0, 'سررسید گذشته')
ON CONFLICT (id) DO NOTHING;

-- ۸. اطلاعیه‌ها (Announcements)
INSERT INTO announcements (id, cooperative_id, author_id, title, content, priority, view_count)
VALUES
('ann-1', 'coop-1', 'usr-admin-1', 'اطلاعیه شروع عملیات بتن‌ریزی سقف طبقه پنجم', 'با سلام و احترام به اطلاع کلیه اعضای محترم پروژه برج مروارید چیتگر می‌رساند عملیات بتن‌ریزی سقف طبقه پنجم آغاز گردیده است. لطفا نسبت به تسویه قسط مرحله سوم اقدام فرمایید.', 'IMPORTANT', 42),
('ann-2', NULL, 'usr-super-admin', 'دستورالعمل نظارت بر واریزی‌های ریالی تعاونی‌های مسکن', 'به کلیه مدیران محترم تعاونی‌ها ابلاغ می‌گردد ثبت هرگونه واریزی فیش آفلاین منوط به تایید سیستمی شناسه رهگیری بانکی می‌باشد.', 'URGENT', 85)
ON CONFLICT (id) DO NOTHING;
