import React from 'react';
import { AlertTriangle, XCircle, Info } from 'lucide-react';

interface ErrorMessageProps {
  message: string | null | undefined;
  variant?: 'error' | 'warning' | 'info';
  onDismiss?: () => void;
  className?: string;
}

export const ErrorMessage: React.FC<ErrorMessageProps> = ({
  message,
  variant = 'error',
  onDismiss,
  className = '',
}) => {
  if (!message) return null;

  const styleMap = {
    error: {
      bg: 'bg-red-950/40 border-red-500/40 text-red-200',
      icon: <XCircle className="w-5 h-5 text-red-400 shrink-0" />,
      accent: 'border-l-4 border-l-red-500',
    },
    warning: {
      bg: 'bg-amber-950/40 border-amber-500/40 text-amber-200',
      icon: <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />,
      accent: 'border-l-4 border-l-amber-500',
    },
    info: {
      bg: 'bg-cyan-950/40 border-cyan-500/40 text-cyan-200',
      icon: <Info className="w-5 h-5 text-cyan-400 shrink-0" />,
      accent: 'border-l-4 border-l-cyan-500',
    },
  };

  const style = styleMap[variant];

  return (
    <div
      role="alert"
      className={`
        relative flex items-start gap-3 p-3.5 rounded-lg border text-sm
        backdrop-blur-md shadow-sm transition-all
        ${style.bg} ${style.accent} ${className}
      `}
    >
      <div className="mt-0.5">{style.icon}</div>
      <div className="flex-1 font-thai leading-relaxed break-words">{message}</div>
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          className="text-slate-400 hover:text-white transition-colors p-1"
          aria-label="Dismiss error"
        >
          ✕
        </button>
      )}
    </div>
  );
};
