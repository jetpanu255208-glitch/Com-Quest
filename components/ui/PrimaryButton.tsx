import React from 'react';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';

interface PrimaryButtonProps {
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
}

export const PrimaryButton: React.FC<PrimaryButtonProps> = ({
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
}) => {
  const sizeClasses = {
    sm: 'px-3.5 py-1.5 text-xs font-semibold',
    md: 'px-5 py-2.5 text-sm font-bold tracking-wide',
    lg: 'px-7 py-3.5 text-base font-bold tracking-wider',
  };

  const baseClasses = `
    relative inline-flex items-center justify-center gap-2
    font-cyber uppercase transition-all duration-200 cursor-pointer
    select-none overflow-hidden whitespace-nowrap
    bg-gradient-to-r from-cyan-400 via-sky-400 to-cyan-500
    text-slate-950 font-bold
    shadow-[0_0_20px_rgba(0,240,255,0.4)]
    hover:shadow-[0_0_30px_rgba(0,240,255,0.7)]
    hover:brightness-110 active:scale-[0.98]
    disabled:opacity-50 disabled:pointer-events-none disabled:shadow-none
    pixel-corners-sm
    border border-cyan-200/60
    ${fullWidth ? 'w-full' : ''}
    ${sizeClasses[size]}
    ${className}
  `;

  const content = (
    <>
      {/* Corner pixel highlights */}
      <span className="absolute top-0 left-0 w-1.5 h-1.5 bg-white opacity-80" />
      <span className="absolute bottom-0 right-0 w-1.5 h-1.5 bg-slate-950 opacity-40" />
      
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
      ) : (
        icon && <span className="inline-flex shrink-0">{icon}</span>
      )}
      <span className="relative z-10 drop-shadow-sm">{children}</span>
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
