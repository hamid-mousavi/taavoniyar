-- =========================================================================
-- داده‌های آزمایشی اولیه سامانه مدیریت تعاونی‌های مسکن (مسکن‌یار)
-- شامل: ۳ تعاونی مسکن واقعی، ۱ مدیر کل، ۳ مدیر تعاونی، ۶ عضو، واحدها،
-- برنامه‌های اقساط، ریزاقساط، هزینه‌های جاری ماهانه، اطلاعیه‌ها و لاگ‌های حسابرسی
-- قابل اجرا در Supabase SQL Editor یا Local PostgreSQL
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
