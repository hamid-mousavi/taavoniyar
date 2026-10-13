/**
 * ابزارهای بومی‌سازی فارسی، تبدیل تاریخ شمسی، اعتبارسنجی کد ملی و مدیریت مبالغ ریالی
 */

// کدهای ملی نمونه معتبر و تاییدشده رسمی برای آزمایش سریع در محیط توسعه
export const SAMPLE_VALID_NATIONAL_CODES = [
  { code: '0010350829', label: 'نمونه ۱ (تهران)' },
  { code: '0012345679', label: 'نمونه ۲ (مرکزی)' },
  { code: '0490334806', label: 'نمونه ۳ (البرز)' },
  { code: '1271234564', label: 'نمونه ۴ (اصفهان)' },
  { code: '0071234561', label: 'نمونه ۵ (خراسان)' },
];

// تبدیل ارقام لاتین به فارسی
export function toPersianDigits(input: number | string | null | undefined): string {
  if (input === null || input === undefined) return '';
  const str = input.toString();
  const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  return str.replace(/[0-9]/g, (w) => persianDigits[parseInt(w, 10)]);
}

// جداسازی سه رقمی اعداد
export function formatNumberWithCommas(num: number | string): string {
  if (num === null || num === undefined) return '۰';
  const parts = num.toString().split('.');
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, '،');
  return parts.join('.');
}

// فرمت مبلغ به ریال همراه با اعتبارسنجی عدد صحیح
export function formatRial(amount: number): string {
  if (!Number.isInteger(amount)) {
    amount = Math.round(amount);
  }
  return `${toPersianDigits(formatNumberWithCommas(amount))} ریال`;
}

// تبدیل ریال به تومان برای نمایش آسان‌تر به کاربر
export function formatToman(amountRial: number): string {
  const toman = Math.floor(amountRial / 10);
  return `${toPersianDigits(formatNumberWithCommas(toman))} تومان`;
}

/**
 * پاک‌سازی و استانداردسازی کد ملی به فرمت ده‌رقمی با حفظ یا اضافه کردن صفرهای پیشین
 */
export function cleanAndPadNationalCode(code: string | null | undefined): string {
  if (!code) return '';
  const english = code.replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 1776)).replace(/\D/g, '').trim();
  if (!english) return '';
  if (english.length < 10) {
    return english.padStart(10, '0');
  }
  return english.slice(0, 10);
}

/**
 * اعتبارسنجی کد ملی ایران بر اساس الگوریتم رسمی باقی‌مانده تقسیم بر ۱۱ (Mod 11)
 * با پشتیبانی از صفرهای پیش‌فرض و حالت گذر آزمایشی (Bypass)
 */
export function isValidIranianNationalCode(code: string, allowBypass = false): boolean {
  if (allowBypass) return true;
  if (!code || typeof code !== 'string') return false;

  const padded = cleanAndPadNationalCode(code);
  if (padded.length !== 10) return false;

  // کدهای با ۱۰ رقم تکراری مثل 0000000000 یا 1111111111 نامعتبرند
  if (/^(\d)\1{9}$/.test(padded)) return false;

  const check = parseInt(padded[9], 10);
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(padded[i], 10) * (10 - i);
  }

  const remainder = sum % 11;
  return (remainder < 2 && check === remainder) || (remainder >= 2 && check === 11 - remainder);
}

// اعتبارسنجی شماره موبایل ایران
export function isValidIranianMobile(mobile: string): boolean {
  if (!mobile) return false;
  const english = mobile.replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 1776)).trim();
  return /^09\d{9}$/.test(english);
}

/**
 * تبدیل دقیق تاریخ میلادی به شمسی بدون نیاز به کتابخانه خارجی
 * الگوریتم استاندارد تقویم جلالی (Kazimierz M. Borkowski)
 */
export function gregorianToJalali(gy: number, gm: number, gd: number): [number, number, number] {
  const g_d_m = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];
  let jy: number;
  if (gy > 1600) {
    jy = 979;
    gy -= 1600;
  } else {
    jy = 0;
    gy -= 621;
  }
  const gy2 = gm > 2 ? gy + 1 : gy;
  let days =
    365 * gy +
    Math.floor((gy2 + 3) / 4) -
    Math.floor((gy2 + 99) / 100) +
    Math.floor((gy2 + 399) / 400) -
    80 +
    gd +
    g_d_m[gm - 1];
  jy += 33 * Math.floor(days / 12053);
  days %= 12053;
  jy += 4 * Math.floor(days / 1461);
  days %= 1461;
  if (days > 365) {
    jy += Math.floor((days - 1) / 365);
    days = (days - 1) % 365;
  }
  let jm: number;
  let jd: number;
  if (days < 186) {
    jm = 1 + Math.floor(days / 31);
    jd = 1 + (days % 31);
  } else {
    jm = 7 + Math.floor((days - 186) / 30);
    jd = 1 + ((days - 186) % 30);
  }
  return [jy, jm, jd];
}

/**
 * تبدیل تاریخ شمسی (جلالی) به میلادی برای ذخیره‌سازی استاندارد ISO
 */
export function jalaliToGregorian(jy: number, jm: number, jd: number): [number, number, number] {
  jy += 1595;
  let days = -355668 + (365 * jy) + (Math.floor(jy / 33) * 8) + Math.floor(((jy % 33) + 3) / 4) + jd + ((jm < 7) ? (jm - 1) * 31 : ((jm - 7) * 30) + 186);
  let gy = 400 * Math.floor(days / 146097);
  days %= 146097;
  if (days > 36524) {
    days--;
    gy += 100 * Math.floor(days / 36524);
    days %= 36524;
    if (days >= 365) days++;
  }
  gy += 4 * Math.floor(days / 1461);
  days %= 1461;
  if (days > 365) {
    gy += Math.floor((days - 1) / 365);
    days = (days - 1) % 365;
  }
  const sal_a = [0, 31, ((gy % 4 === 0 && gy % 100 !== 0) || (gy % 400 === 0)) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  let gm = 0;
  while (gm < 13 && days >= sal_a[gm]) {
    days -= sal_a[gm];
    gm++;
  }
  return [gy, gm, days + 1];
}

export const PERSIAN_MONTH_NAMES = [
  'فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور',
  'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'
];

// دریافت تاریخ جاری شمسی به صورت شیء { year, month, day }
export function getCurrentJalaliDate(): { year: number; month: number; day: number } {
  const now = new Date();
  const [year, month, day] = gregorianToJalali(now.getFullYear(), now.getMonth() + 1, now.getDate());
  return { year, month, day };
}

// ساخت شیء تاریخ از روز/ماه/سال شمسی
export function createDateFromJalali(jy: number, jm: number, jd: number, hours = 12, minutes = 0): Date {
  const [gy, gm, gd] = jalaliToGregorian(jy, jm, jd);
  return new Date(gy, gm - 1, gd, hours, minutes);
}

// تبدیل تاریخ یا رشته ISO به رشته عددی شمسی کوتاه (مثال: ۱۴۰۳/۰۶/۱۵)
export function formatJalaliDateShort(isoDateOrObj: string | Date | null | undefined): string {
  if (!isoDateOrObj) return '-';
  const d = typeof isoDateOrObj === 'string' ? new Date(isoDateOrObj) : isoDateOrObj;
  if (isNaN(d.getTime())) return '-';

  const [jy, jm, jd] = gregorianToJalali(d.getFullYear(), d.getMonth() + 1, d.getDate());
  return `${toPersianDigits(jy)}/${toPersianDigits(jm.toString().padStart(2, '0'))}/${toPersianDigits(jd.toString().padStart(2, '0'))}`;
}

// تبدیل رشته یا شیء تاریخ به رشته خوانای شمسی
export function formatJalaliDate(isoDateOrObj: string | Date | null | undefined, includeTime = false): string {
  if (!isoDateOrObj) return '-';
  const d = typeof isoDateOrObj === 'string' ? new Date(isoDateOrObj) : isoDateOrObj;
  if (isNaN(d.getTime())) return '-';

  const [jy, jm, jd] = gregorianToJalali(d.getFullYear(), d.getMonth() + 1, d.getDate());
  const monthName = PERSIAN_MONTH_NAMES[jm - 1];
  const dateStr = `${toPersianDigits(jd)} ${monthName} ${toPersianDigits(jy)}`;

  if (!includeTime) return dateStr;

  const hours = toPersianDigits(d.getHours().toString().padStart(2, '0'));
  const minutes = toPersianDigits(d.getMinutes().toString().padStart(2, '0'));
  return `${dateStr} - ساعت ${hours}:${minutes}`;
}
