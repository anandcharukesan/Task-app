import React, { forwardRef } from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  icon?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, icon, className = '', id, ...props }, ref) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="w-full flex flex-col gap-1.5">
        {label && (
          <label htmlFor={inputId} className="text-xs font-medium text-[#5F6368] dark:text-[#9AA0A6]">
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          {icon && (
            <div className="absolute left-3 text-[#5F6368] dark:text-[#9AA0A6] pointer-events-none">
              {icon}
            </div>
          )}
          <input
            id={inputId}
            ref={ref}
            className={`w-full text-sm bg-white dark:bg-[#292A2D] text-[#202124] dark:text-[#E8EAED] border border-[#DADCE0] dark:border-[#3C4043] rounded-lg px-3.5 py-2.5 transition-colors placeholder:text-[#80868B] dark:placeholder:text-[#9AA0A6] focus:outline-none focus:border-[#1A73E8] focus:ring-1 focus:ring-[#1A73E8] dark:focus:border-[#8AB4F8] dark:focus:ring-[#8AB4F8] disabled:opacity-50 disabled:bg-[#F1F3F4] dark:disabled:bg-[#303134] ${
              icon ? 'pl-9' : ''
            } ${error ? 'border-[#D93025] focus:border-[#D93025] focus:ring-[#D93025]' : ''} ${className}`}
            {...props}
          />
        </div>
        {error ? (
          <p className="text-xs text-[#D93025] dark:text-[#F28B82]">{error}</p>
        ) : helperText ? (
          <p className="text-xs text-[#5F6368] dark:text-[#9AA0A6]">{helperText}</p>
        ) : null}
      </div>
    );
  }
);

Input.displayName = 'Input';
