import React from 'react';

interface AuthCardProps {
  title: string;
  subtitle?: string;
  badge?: string;
  variant?: 'student' | 'teacher';
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
}

export const AuthCard: React.FC<AuthCardProps> = ({
  title,
  subtitle,
  badge,
  variant = 'student',
  children,
  footer,
  className = '',
}) => {
  const isTeacher = variant === 'teacher';

  const glowColor = isTeacher
    ? 'shadow-[0_0_40px_rgba(245,158,11,0.12)] border-amber-500/30'
    : 'shadow-[0_0_40px_rgba(0,240,255,0.12)] border-cyan-500/30';

  const badgeColor = isTeacher
    ? 'text-amber-400 bg-amber-950/60 border-amber-500/40'
    : 'text-cyan-400 bg-cyan-950/60 border-cyan-500/40';

  const accentGradient = isTeacher
    ? 'from-amber-400 via-orange-400 to-amber-500'
    : 'from-cyan-400 via-sky-400 to-blue-500';

  return (
    <div className={`w-full max-w-md mx-auto ${className}`}>
      <div
        className={`
          relative rounded-xl bg-slate-950/85 backdrop-blur-xl border
          ${glowColor} transition-all duration-300
          overflow-hidden
        `}
      >
        {/* Top Accent Strip */}
        <div className={`h-1 w-full bg-gradient-to-r ${accentGradient}`} />

        {/* Decorative Circuit/Scanline Lines */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/5 rounded-full blur-2xl pointer-events-none" />

        {/* Header */}
        <div className="px-6 pt-6 pb-4 sm:px-8 sm:pt-8 text-center border-b border-slate-800/80">
          {badge && (
            <div className="inline-block mb-3">
              <span
                className={`
                  px-2.5 py-1 text-[11px] font-mono uppercase tracking-wider
                  border rounded-full ${badgeColor} shadow-sm
                `}
              >
                {badge}
              </span>
            </div>
          )}
          <h1 className="text-2xl sm:text-3xl font-cyber font-bold tracking-tight text-white">
            {title}
          </h1>
          {subtitle && (
            <p className="mt-2 text-xs sm:text-sm text-slate-400 font-thai leading-relaxed">
              {subtitle}
            </p>
          )}
        </div>

        {/* Body Content */}
        <div className="p-6 sm:p-8 space-y-5">{children}</div>

        {/* Footer */}
        {footer && (
          <div className="px-6 py-4 sm:px-8 bg-slate-900/60 border-t border-slate-800/80 text-center text-xs text-slate-400 font-thai">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};
