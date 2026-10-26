import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  children: React.ReactNode;
}

export function Button({
  children,
  onClick,
  className = '',
  disabled,
  variant = 'primary',
  type = 'button',
  ...props
}: ButtonProps) {
  const baseStyles =
    'inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-all duration-200 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer';

  let variantStyles = '';
  switch (variant) {
    case 'primary':
      variantStyles = 'bg-gp text-white hover:bg-gp-d shadow-sm hover:shadow';
      break;
    case 'secondary':
      variantStyles = 'bg-gp-l text-gp hover:bg-emerald-100';
      break;
    case 'outline':
      variantStyles = 'border border-gp text-gp bg-white hover:bg-gp-l';
      break;
    case 'ghost':
      variantStyles = 'text-gp-gray hover:text-gp hover:bg-gray-50';
      break;
  }

  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={`${baseStyles} ${variantStyles} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
