import React, { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, ChevronDown, Clock } from 'lucide-react';
import { 
  gregorianToJalali, 
  jalaliToGregorian, 
  toPersianDigits, 
  PERSIAN_MONTH_NAMES,
  formatJalaliDateShort
} from '../../utils/persian';

interface JalaliDatePickerProps {
  value: string | Date; // ISO string or Date
  onChange: (isoString: string) => void;
  label?: string;
  required?: boolean;
  className?: string;
  minYear?: number;
  maxYear?: number;
}

export const JalaliDatePicker: React.FC<JalaliDatePickerProps> = ({
  value,
  onChange,
  label,
  required = false,
  className = '',
  minYear = 1400,
  maxYear = 1408
}) => {
  const parseJalali = (val: string | Date) => {
    try {
      const d = typeof val === 'string' ? new Date(val) : val;
      if (isNaN(d.getTime())) {
        const now = new Date();
        const [jy, jm, jd] = gregorianToJalali(now.getFullYear(), now.getMonth() + 1, now.getDate());
        return { jy, jm, jd };
      }
      const [jy, jm, jd] = gregorianToJalali(d.getFullYear(), d.getMonth() + 1, d.getDate());
      return { jy, jm, jd };
    } catch {
      const now = new Date();
      const [jy, jm, jd] = gregorianToJalali(now.getFullYear(), now.getMonth() + 1, now.getDate());
      return { jy, jm, jd };
    }
  };

  const initial = parseJalali(value);
  const [year, setYear] = useState<number>(initial.jy);
  const [month, setMonth] = useState<number>(initial.jm);
  const [day, setDay] = useState<number>(initial.jd);

  useEffect(() => {
    const parsed = parseJalali(value);
    setYear(parsed.jy);
    setMonth(parsed.jm);
    setDay(parsed.jd);
  }, [value]);

  const maxDaysInMonth = (m: number, y: number) => {
    if (m <= 6) return 31;
    if (m <= 11) return 30;
    // اسفند: سال‌های کبیسه ۳۰ روز، عادی ۲۹ روز
    const isLeap = [1403, 1407, 1411].includes(y);
    return isLeap ? 30 : 29;
  };

  const notifyChange = (y: number, m: number, d: number) => {
    const maxD = maxDaysInMonth(m, y);
    const validD = Math.min(d, maxD);
    const [gy, gm, gd] = jalaliToGregorian(y, m, validD);
    const dateObj = new Date(Date.UTC(gy, gm - 1, gd, 12, 0, 0));
    onChange(dateObj.toISOString());
  };

  const handleYearChange = (newYear: number) => {
    setYear(newYear);
    notifyChange(newYear, month, day);
  };

  const handleMonthChange = (newMonth: number) => {
    setMonth(newMonth);
    notifyChange(year, newMonth, day);
  };

  const handleDayChange = (newDay: number) => {
    setDay(newDay);
    notifyChange(year, month, newDay);
  };

  const setQuickToday = () => {
    const now = new Date();
    const [jy, jm, jd] = gregorianToJalali(now.getFullYear(), now.getMonth() + 1, now.getDate());
    setYear(jy);
    setMonth(jm);
    setDay(jd);
    notifyChange(jy, jm, jd);
  };

  const setQuickNextMonth = () => {
    let nextM = month + 1;
    let nextY = year;
    if (nextM > 12) {
      nextM = 1;
      nextY += 1;
    }
    setYear(nextY);
    setMonth(nextM);
    notifyChange(nextY, nextM, day);
  };

  const years: number[] = [];
  for (let y = minYear; y <= maxYear; y++) {
    years.push(y);
  }

  const days: number[] = [];
  const currentMaxDays = maxDaysInMonth(month, year);
  for (let d = 1; d <= currentMaxDays; d++) {
    days.push(d);
  }

  return (
    <div className={`space-y-1.5 ${className}`}>
      {label && (
        <div className="flex items-center justify-between text-xs font-bold text-slate-700">
          <span className="flex items-center gap-1.5">
            <CalendarIcon className="w-3.5 h-3.5 text-emerald-600" />
            <span>{label}</span>
            {required && <span className="text-rose-500">*</span>}
          </span>
          <span className="font-mono text-[11px] text-slate-500 font-normal">
            {formatJalaliDateShort(value)}
          </span>
        </div>
      )}

      <div className="bg-white border border-slate-200 rounded-2xl p-2 shadow-sm space-y-2">
        <div className="grid grid-cols-3 gap-1.5 text-xs">
          {/* انتخاب روز */}
          <div className="space-y-1">
            <label className="text-[10px] text-slate-500 font-medium">روز</label>
            <div className="relative">
              <select
                value={Math.min(day, currentMaxDays)}
                onChange={(e) => handleDayChange(parseInt(e.target.value, 10))}
                className="w-full appearance-none bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 pr-2 font-mono text-xs font-bold text-slate-800 outline-none focus:border-emerald-600 focus:bg-white transition-all cursor-pointer"
              >
                {days.map((d) => (
                  <option key={d} value={d}>
                    {toPersianDigits(d)}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3 h-3 text-slate-400 absolute left-2 top-2.5 pointer-events-none" />
            </div>
          </div>

          {/* انتخاب ماه */}
          <div className="space-y-1">
            <label className="text-[10px] text-slate-500 font-medium">ماه</label>
            <div className="relative">
              <select
                value={month}
                onChange={(e) => handleMonthChange(parseInt(e.target.value, 10))}
                className="w-full appearance-none bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 pr-2 text-xs font-bold text-slate-800 outline-none focus:border-emerald-600 focus:bg-white transition-all cursor-pointer"
              >
                {PERSIAN_MONTH_NAMES.map((name, idx) => (
                  <option key={idx + 1} value={idx + 1}>
                    {name}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3 h-3 text-slate-400 absolute left-2 top-2.5 pointer-events-none" />
            </div>
          </div>

          {/* انتخاب سال */}
          <div className="space-y-1">
            <label className="text-[10px] text-slate-500 font-medium">سال</label>
            <div className="relative">
              <select
                value={year}
                onChange={(e) => handleYearChange(parseInt(e.target.value, 10))}
                className="w-full appearance-none bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 pr-2 font-mono text-xs font-bold text-slate-800 outline-none focus:border-emerald-600 focus:bg-white transition-all cursor-pointer"
              >
                {years.map((y) => (
                  <option key={y} value={y}>
                    {toPersianDigits(y)}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3 h-3 text-slate-400 absolute left-2 top-2.5 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* دکمه‌های سریع تاریخ */}
        <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-[11px]">
          <button
            type="button"
            onClick={setQuickToday}
            className="text-emerald-700 hover:text-emerald-900 font-medium hover:underline cursor-pointer"
          >
            امروز
          </button>
          <button
            type="button"
            onClick={setQuickNextMonth}
            className="text-slate-500 hover:text-slate-800 font-medium hover:underline cursor-pointer"
          >
            سررسید ماه بعد
          </button>
        </div>
      </div>
    </div>
  );
};
