import React, { useRef, useEffect } from 'react';
import { toPersianDigits } from '../../utils/persian';

interface OtpInputProps {
  length?: number;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export const OtpInput: React.FC<OtpInputProps> = ({
  length = 5,
  value,
  onChange,
  disabled = false
}) => {
  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    // فوکوس روی اولین خانه خالی
    const firstEmptyIndex = value.length < length ? value.length : length - 1;
    inputsRef.current[firstEmptyIndex]?.focus();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    let char = e.target.value;
    // تبدیل ارقام فارسی به انگلیسی در مقدار خام
    char = char.replace(/[۰-۹]/g, d => String(d.charCodeAt(0) - 1776));
    char = char.replace(/[^0-9]/g, '');

    if (!char) {
      // حذف کاراکتر
      const newValue = value.slice(0, index) + value.slice(index + 1);
      onChange(newValue);
      return;
    }

    const lastChar = char.slice(-1);
    const valueArray = value.split('');
    valueArray[index] = lastChar;
    const newValue = valueArray.join('').slice(0, length);
    onChange(newValue);

    // حرکت به فیلد بعدی
    if (index < length - 1 && lastChar) {
      inputsRef.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === 'Backspace' && !value[index] && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    let pastedData = e.clipboardData.getData('text/plain');
    pastedData = pastedData.replace(/[۰-۹]/g, d => String(d.charCodeAt(0) - 1776));
    const numbersOnly = pastedData.replace(/[^0-9]/g, '').slice(0, length);
    onChange(numbersOnly);
    const focusIndex = Math.min(numbersOnly.length, length - 1);
    inputsRef.current[focusIndex]?.focus();
  };

  return (
    <div className="flex items-center justify-center gap-2.5 sm:gap-3" dir="ltr">
      {Array.from({ length }).map((_, idx) => {
        const digit = value[idx] || '';
        return (
          <input
            key={idx}
            ref={el => { inputsRef.current[idx] = el; }}
            type="text"
            inputMode="numeric"
            maxLength={1}
            disabled={disabled}
            value={digit ? toPersianDigits(digit) : ''}
            onChange={e => handleChange(e, idx)}
            onKeyDown={e => handleKeyDown(e, idx)}
            onPaste={handlePaste}
            className={`w-12 h-14 sm:w-14 sm:h-16 text-center text-xl sm:text-2xl font-bold rounded-2xl border transition-all duration-150 outline-none ${
              digit
                ? 'border-emerald-600 bg-emerald-50/50 text-emerald-950 ring-2 ring-emerald-500/20'
                : 'border-slate-300 bg-white text-slate-900 focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10'
            } disabled:bg-slate-100 disabled:opacity-50`}
          />
        );
      })}
    </div>
  );
};
