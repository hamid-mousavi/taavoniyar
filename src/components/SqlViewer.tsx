import React, { useState } from 'react';
import { Database, Copy, Check, Terminal, FileCode, ShieldCheck, Download, Layers, HardDrive } from 'lucide-react';

const SCHEMA_SQL = `-- =========================================================================
-- سامانه مدیریت تعاونی‌های مسکن (مسکن‌یار) - ساختار جداول (DDL Migration)
-- سازگار با PostgreSQL 14+ و Supabase
-- =========================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

DO $$ BEGIN CREATE TYPE user_role_enum AS ENUM ('SUPER_ADMIN', 'COOP_ADMIN', 'MEMBER'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE unit_status_enum AS ENUM ('AVAILABLE', 'ASSIGNED', 'RESERVED'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE installment_stage_enum AS ENUM ('LAND_SHARE', 'FOUNDATION', 'ROUGH_CONSTRUCTION', 'FACILITIES', 'FINISHING', 'DELIVERY', 'OTHER'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE installment_status_enum AS ENUM ('PENDING', 'PARTIAL', 'PAID', 'OVERDUE'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE payment_method_enum AS ENUM ('ONLINE_SANDBOX', 'OFFLINE_RECEIPT', 'CASH_DESK', 'CARD_TO_CARD', 'MANAGER_REGISTERED'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE payment_status_enum AS ENUM ('PENDING_APPROVAL', 'APPROVED', 'REJECTED', 'SUCCESS'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE announcement_priority_enum AS ENUM ('NORMAL', 'IMPORTANT', 'URGENT'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE audit_action_enum AS ENUM ('CREATE', 'UPDATE', 'DELETE', 'PAYMENT_SUBMITTED', 'PAYMENT_APPROVED', 'PAYMENT_REJECTED', 'LOGIN_OTP', 'UNIT_ASSIGNED'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE fee_category_enum AS ENUM ('MONTHLY_CHARGE', 'ELEVATOR', 'SECURITY', 'UTILITIES', 'REPAIR', 'OTHER'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE fee_status_enum AS ENUM ('PENDING', 'PAID', 'OVERDUE'); EXCEPTION WHEN duplicate_object THEN null; END $$;

-- ۱. جدول کاربران
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

-- ۲. جدول تعاونی‌ها
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

-- ۳. جدول عضویت‌ها
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

-- ۴. جدول واحدها
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

-- ۵. جدول برنامه‌های اقساط
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

-- ۶. جدول ریز اقساط
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

-- ۷. جدول تراکنش‌های پرداخت
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

-- ۸. جدول رسیدهای واریز آفلاین
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

-- ۹. جدول اطلاعیه‌ها
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

-- ۱۰. جدول لاگ‌های حسابرسی
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

-- ۱۱. جدول هزینه‌های جاری ماهانه
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

-- غیرفعال‌سازی محدودیت‌های RLS در Supabase برای کارکرد روان کلید Anon
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
`;

const SEED_SQL = `-- داده‌های اولیه تعاونی‌ها، کاربران و برنامه‌های اقساط
INSERT INTO cooperatives (id, name, code, project_name, address, total_units, bank_name, account_number, sheba_number, card_holder_name, is_active)
VALUES
('coop-1', 'تعاونی مسکن فرهنگیان منطقه ۵ تهران', 'MASKAN-FARHANG-05', 'پروژه مسکونی مروارید چیتگر', 'تهران، منطقه ۲۲، دریاچه چیتگر', 48, 'بانک ملی ایران', '۰۱۰۸۴۵۶۷۸۹۰۰۳', 'IR640170000000108456789003', 'تعاونی مسکن فرهنگیان', TRUE),
('coop-2', 'تعاونی مسکن کادر درمان بیمارستان رازی', 'MASKAN-RAZI-MED', 'پروژه مسکونی یاسمن الهیه', 'تهران، شمیرانات، الهیه', 64, 'بانک ملت', '۴۷۵۸۲۹۳۰۱۱', 'IR82012000000004758293011', 'تعاونی مسکن کادر درمان رازی', TRUE),
('coop-3', 'تعاونی مسکن کارکنان گروه صنعتی پارس', 'MASKAN-PARS-IND', 'پروژه بزرگ البرز فردیس', 'کرج، فردیس، بلوار شهدا', 120, 'بانک صادرات ایران', '۰۲۰۹۸۷۶۵۴۳۰۰۵', 'IR450190000000209876543005', 'تعاونی مسکن گروه صنعتی پارس', TRUE)
ON CONFLICT (id) DO NOTHING;

INSERT INTO users (id, mobile, full_name, national_code, father_name, is_active)
VALUES
('usr-super-admin', '09121111111', 'مهندس علیرضا سلیمانی (مدیر کل و ناظر عالیه)', '0012345678', 'محمود', TRUE),
('usr-admin-1', '09122222221', 'دکتر حمیدرضا احمدی (مدیر تعاونی فرهنگیان)', '0023456789', 'ابراهیم', TRUE),
('usr-mem-1', '09123333331', 'علی مرادی', '0056789012', 'حسین', TRUE)
ON CONFLICT (id) DO NOTHING;

INSERT INTO memberships (id, user_id, cooperative_id, role, membership_number, is_active)
VALUES
('mem-super', 'usr-super-admin', 'coop-1', 'SUPER_ADMIN', 'MEMBER-SUPER-01', TRUE),
('mem-admin-1', 'usr-admin-1', 'coop-1', 'COOP_ADMIN', 'MEMBER-C1-ADMIN', TRUE),
('mem-c1-u1', 'usr-mem-1', 'coop-1', 'MEMBER', 'FARHANG-101-01', TRUE)
ON CONFLICT (id) DO NOTHING;

INSERT INTO units (id, cooperative_id, unit_number, block, floor, area_m2, assigned_member_id, status)
VALUES
('unit-c1-101', 'coop-1', '۱۰۱', 'بلوک A', 1, 105.50, 'mem-c1-u1', 'ASSIGNED')
ON CONFLICT (id) DO NOTHING;

INSERT INTO installment_plans (id, cooperative_id, unit_id, member_id, title, total_cost_rial)
VALUES
('plan-c1-u1', 'coop-1', 'unit-c1-101', 'mem-c1-u1', 'برنامه پرداخت واحد ۱۰۱ - آقای علی مرادی', 18000000000)
ON CONFLICT (id) DO NOTHING;
`;

export const SqlViewer: React.FC = () => {
  const [selectedView, setSelectedView] = useState<'schema' | 'seed' | 'docker'>('schema');
  const [copied, setCopied] = useState(false);

  const getActiveCode = () => {
    if (selectedView === 'schema') return SCHEMA_SQL;
    if (selectedView === 'seed') return SEED_SQL;
    return `version: '3.8'
services:
  postgres:
    image: postgres:16-alpine
    container_name: maskanyar-postgres
    restart: always
    environment:
      POSTGRES_DB: maskanyar
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: maskanyar_secret_password
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./src/db/complete_migration.sql:/docker-entrypoint-initdb.d/init.sql
volumes:
  postgres_data:
`;
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(getActiveCode());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <FileCode className="w-5 h-5" />
              </div>
              <h2 className="text-xl font-black text-slate-900">کدهای مهاجرت پایگاه‌داده (PostgreSQL DDL & Seed)</h2>
            </div>
            <p className="text-xs text-slate-500">
              اسکریپت‌های استاندارد ساخت جداول، ایندکس‌های چندمستأجری و داکر برای استقرار محلی و ابری در Supabase
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-5 py-2.5 rounded-2xl text-xs font-bold transition-all shadow-sm cursor-pointer"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'در کلیپ‌بورد کپی شد' : 'کپی متن اسکریپت'}</span>
            </button>
          </div>
        </div>

        {/* فیلتر تب‌ها */}
        <div className="flex items-center gap-2 mt-6 pt-4 border-t border-slate-100">
          <button
            onClick={() => setSelectedView('schema')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              selectedView === 'schema' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            ساختار جداول (schema.sql)
          </button>
          <button
            onClick={() => setSelectedView('seed')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              selectedView === 'seed' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            داده‌های اولیه (seed.sql)
          </button>
          <button
            onClick={() => setSelectedView('docker')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              selectedView === 'docker' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            پیکربندی داکر (docker-compose.yml)
          </button>
        </div>
      </div>

      <div className="bg-slate-950 rounded-3xl p-6 border border-slate-800 shadow-xl overflow-hidden text-left" dir="ltr">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800 text-xs text-slate-400 font-mono">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-rose-500 inline-block"></span>
            <span className="w-3 h-3 rounded-full bg-amber-500 inline-block"></span>
            <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block"></span>
            <span className="ml-2 text-slate-300 font-semibold">
              {selectedView === 'schema' ? 'src/db/schema.sql' : selectedView === 'seed' ? 'src/db/seed.sql' : 'docker-compose.yml'}
            </span>
          </div>
          <span className="text-[11px] text-slate-500">PostgreSQL 14+ / Supabase compatible</span>
        </div>

        <pre className="mt-4 p-2 text-emerald-400 text-xs font-mono leading-relaxed overflow-x-auto whitespace-pre max-h-[600px]">
          {getActiveCode()}
        </pre>
      </div>

    </div>
  );
};
