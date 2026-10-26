import React from 'react';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';

interface SecondaryButtonProps {
  children: React.ReactNode;
  href?: string;
  onClick?: (e: React.MouseEvent<HTMLElement>) => void;
  type?: 'button' | 'submit' | 'reset';
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  fullWidth?: boolean;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'outline' | 'ghost' | 'teacher';
}

export const SecondaryButton: React.FC<SecondaryButtonProps> = ({
  children,
  href,
  onClick,
  type = 'button',
  disabled = false,
  loading = false,
  icon,
  fullWidth = false,
  className = '',
  size = 'md',
  variant = 'outline',
}) => {
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-xs font-semibold',
    md: 'px-5 py-2.5 text-sm font-semibold tracking-wide',
    lg: 'px-6 py-3.5 text-base font-semibold tracking-wider',
  };

  const variantClasses = {
    outline: `
      bg-slate-900/70 hover:bg-slate-800/90
      text-cyan-300 hover:text-cyan-200
      border border-cyan-500/30 hover:border-cyan-400/70
      hover:shadow-[0_0_15px_rgba(0,240,255,0.25)]
    `,
    ghost: `
      bg-transparent hover:bg-slate-800/50
      text-slate-300 hover:text-white
      border border-transparent hover:border-slate-700
    `,
    teacher: `
      bg-amber-950/30 hover:bg-amber-900/40
      text-amber-300 hover:text-amber-200
      border border-amber-500/40 hover:border-amber-400/70
      hover:shadow-[0_0_15px_rgba(245,158,11,0.25)]
    `,
  };

  const baseClasses = `
    relative inline-flex items-center justify-center gap-2
    font-cyber uppercase transition-all duration-200 cursor-pointer
    select-none backdrop-blur-md active:scale-[0.98] whitespace-nowrap
    disabled:opacity-50 disabled:pointer-events-none disabled:shadow-none
    pixel-corners-sm
    ${fullWidth ? 'w-full' : ''}
    ${sizeClasses[size]}
    ${variantClasses[variant]}
    ${className}
  `;

  const content = (
    <>
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin text-current" />
      ) : (
        icon && <span className="inline-flex shrink-0">{icon}</span>
      )}
      <span className="relative z-10">{children}</span>
    </>
  );

  if (href && !disabled && !loading) {
    return (
      <Link href={href} className={baseClasses} onClick={onClick}>
        {content}
      </Link>
    );
  }

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={baseClasses}
    >
      {content}
    </button>
  );
};
