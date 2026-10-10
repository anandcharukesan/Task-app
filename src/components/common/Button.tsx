import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'text' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
  isLoading?: boolean;
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  icon,
  children,
  className = '',
  disabled,
  isLoading = false,
  ...props
}) => {
  const base =
    'inline-flex items-center justify-center font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed select-none';

  const sizeClasses = {
    sm: 'text-xs px-3 py-1.5 rounded-md gap-1.5 min-h-[32px]',
    md: 'text-sm px-4 py-2 rounded-lg gap-2 min-h-[40px]',
    lg: 'text-base px-5 py-2.5 rounded-lg gap-2.5 min-h-[44px]',
  };

  const variantClasses = {
    primary:
      'bg-[#1A73E8] hover:bg-[#1765CC] active:bg-[#1557B0] text-white shadow-xs dark:bg-[#8AB4F8] dark:hover:bg-[#93BAF9] dark:text-[#202124]',
    secondary:
      'bg-[#F1F3F4] hover:bg-[#E8EAED] active:bg-[#DADCE0] text-[#202124] dark:bg-[#303134] dark:hover:bg-[#3C4043] dark:text-[#E8EAED] border border-[#DADCE0] dark:border-[#3C4043]',
    text:
      'bg-transparent hover:bg-[#F1F3F4] text-[#1A73E8] dark:text-[#8AB4F8] dark:hover:bg-[#303134]',
    danger:
      'bg-[#D93025] hover:bg-[#C5221F] text-white shadow-xs dark:bg-[#F28B82] dark:hover:bg-[#EE675C] dark:text-[#202124]',
  };

  return (
    <button
      className={`${base} ${sizeClasses[size]} ${variantClasses[variant]} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {icon && <span className="shrink-0 flex items-center justify-center">{icon}</span>}
      <span className="truncate">{children}</span>
    </button>
  );
};
