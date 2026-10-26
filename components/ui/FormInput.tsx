import React from 'react';

interface FormInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  id: string;
  error?: string;
  helperText?: string;
  icon?: React.ReactNode;
  rightElement?: React.ReactNode;
}

export const FormInput = React.forwardRef<HTMLInputElement, FormInputProps>(
  ({ label, id, error, helperText, icon, rightElement, className = '', ...props }, ref) => {
    return (
      <div className="w-full space-y-1.5">
        <label
          htmlFor={id}
          className="flex items-center justify-between text-xs font-cyber font-medium tracking-wide text-slate-300"
        >
          <span>
            {label}
            {props.required && <span className="text-cyan-400 ml-1 font-mono">*</span>}
          </span>
        </label>

        <div className="relative flex items-center">
          {icon && (
            <div className="absolute left-3.5 flex items-center pointer-events-none text-slate-400">
              {icon}
            </div>
          )}

          <input
            ref={ref}
            id={id}
            aria-invalid={Boolean(error)}
            aria-describedby={error ? `${id}-error` : helperText ? `${id}-helper` : undefined}
            className={`
              w-full rounded-md bg-slate-900/80 px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-500
              border transition-all duration-200 outline-none
              ${icon ? 'pl-10' : ''}
              ${rightElement ? 'pr-11' : ''}
              ${
                error
                  ? 'border-red-500/70 focus:border-red-400 focus:ring-2 focus:ring-red-500/20'
                  : 'border-slate-800 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20 hover:border-slate-700'
              }
              disabled:opacity-50 disabled:bg-slate-950
              ${className}
            `}
            {...props}
          />

          {rightElement && (
            <div className="absolute right-2 flex items-center">
              {rightElement}
            </div>
          )}
        </div>

        {error && (
          <p id={`${id}-error`} className="text-xs text-red-400 font-thai flex items-center gap-1 mt-1">
            <span>⚠</span> {error}
          </p>
        )}

        {!error && helperText && (
          <p id={`${id}-helper`} className="text-xs text-slate-400 font-thai mt-1">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

FormInput.displayName = 'FormInput';
