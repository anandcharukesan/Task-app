import React, { useState } from 'react';
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
  const [isHovered, setIsHovered] = useState(false);

  const sizeMap = {
    sm: 'w-4 h-4',
    md: 'w-[22px] h-[22px]',
    lg: 'w-6 h-6',
  };

  const iconSizeMap = {
    sm: 11,
    md: 14,
    lg: 16,
  };

  return (
    <div className="relative inline-flex items-center justify-center">
      <button
        type="button"
        role="checkbox"
        aria-checked={checked}
        aria-label={ariaLabel}
        disabled={disabled}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={(e) => {
          e.stopPropagation();
          if (!disabled) onChange(!checked);
        }}
        className={`group relative flex items-center justify-center shrink-0 rounded-full transition-all duration-200 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1A73E8] disabled:opacity-50 ${sizeMap[size]} ${
          checked
            ? 'bg-transparent text-[#1A73E8] dark:text-[#8AB4F8]'
            : 'border-2 border-[#5F6368] hover:border-[#0B57D0] hover:bg-[#D3E3FD] dark:border-[#9AA0A6] dark:hover:border-[#8AB4F8] dark:hover:bg-[#1A3A60] bg-transparent'
        }`}
      >
        {checked ? (
          <Check
            size={iconSizeMap[size] + 2}
            strokeWidth={2.8}
            className="text-[#1A73E8] dark:text-[#8AB4F8] transition-transform duration-200 scale-100 hover:scale-110"
          />
        ) : (
          <Check
            size={iconSizeMap[size]}
            strokeWidth={2.8}
            className="text-[#0B57D0] dark:text-[#8AB4F8] opacity-0 group-hover:opacity-100 scale-75 group-hover:scale-100 transition-all duration-200"
          />
        )}
      </button>

      {/* Google Tasks Tooltip matching screenshot: "Mark completed" / "Mark uncompleted" */}
      {isHovered && (
        <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 px-2 py-0.5 rounded bg-[#1F1F1F] dark:bg-[#E3E3E3] text-white dark:text-[#1F1F1F] text-[11px] font-normal whitespace-nowrap shadow-md pointer-events-none transition-opacity duration-150 z-50 animate-in fade-in zoom-in-95">
          {checked ? 'Mark uncompleted' : 'Mark completed'}
        </div>
      )}
    </div>
  );
};
