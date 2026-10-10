import React from 'react';

interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon: React.ReactNode;
  'aria-label': string;
  variant?: 'ghost' | 'filled' | 'danger';
  size?: 'sm' | 'md' | 'lg';
}

export const IconButton: React.FC<IconButtonProps> = ({
  icon,
  'aria-label': ariaLabel,
  variant = 'ghost',
  size = 'md',
  className = '',
  disabled,
  ...props
}) => {
  const sizeClasses = {
    sm: 'w-8 h-8 p-1.5',
    md: 'w-10 h-10 p-2',
    lg: 'w-11 h-11 p-2.5',
  };

  const variantClasses = {
    ghost:
      'text-[#5F6368] hover:text-[#202124] hover:bg-[#F1F3F4] active:bg-[#E8EAED] dark:text-[#9AA0A6] dark:hover:text-[#E8EAED] dark:hover:bg-[#303134]',
    filled:
      'bg-[#F1F3F4] text-[#202124] hover:bg-[#E8EAED] dark:bg-[#303134] dark:text-[#E8EAED] dark:hover:bg-[#3C4043]',
    danger:
      'text-[#D93025] hover:bg-[#FCE8E6] dark:text-[#F28B82] dark:hover:bg-[#5C2B29]',
  };

  return (
    <button
      type="button"
      aria-label={ariaLabel}
      title={ariaLabel}
      disabled={disabled}
      className={`inline-flex items-center justify-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:opacity-40 disabled:cursor-not-allowed ${sizeClasses[size]} ${variantClasses[variant]} ${className}`}
      {...props}
    >
      {icon}
    </button>
  );
};
