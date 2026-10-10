import React from 'react';
import { Check } from 'lucide-react';

interface CheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  'aria-label'?: string;
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
}

export const Checkbox: React.FC<CheckboxProps> = ({
  checked,
  onChange,
  'aria-label': ariaLabel = 'Toggle completion',
  size = 'md',
  disabled = false,
}) => {
  const sizeMap = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  };

  const iconSizeMap = {
    sm: 11,
    md: 13,
    lg: 16,
  };

  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      aria-label={ariaLabel}
      disabled={disabled}
      onClick={(e) => {
        e.stopPropagation();
        if (!disabled) onChange(!checked);
      }}
      className={`group relative flex items-center justify-center shrink-0 rounded-full transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:opacity-50 ${sizeMap[size]} ${
        checked
          ? 'bg-[#1A73E8] text-white border-transparent dark:bg-[#8AB4F8] dark:text-[#202124]'
          : 'border-2 border-[#5F6368] hover:border-[#1A73E8] dark:border-[#9AA0A6] dark:hover:border-[#8AB4F8] bg-transparent'
      }`}
    >
      {checked ? (
        <Check size={iconSizeMap[size]} strokeWidth={3} className="animate-in zoom-in-50 duration-150" />
      ) : (
        <span className="w-full h-full rounded-full opacity-0 group-hover:opacity-10 bg-[#1A73E8] dark:bg-[#8AB4F8] transition-opacity" />
      )}
    </button>
  );
};
