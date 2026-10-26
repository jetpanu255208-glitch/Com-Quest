'use client';

import React, { useState } from 'react';
import { Eye, EyeOff, Lock } from 'lucide-react';
import { FormInput } from './FormInput';

interface PasswordInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: string;
  id: string;
  error?: string;
  helperText?: string;
}

export const PasswordInput = React.forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ label, id, error, helperText, ...props }, ref) => {
    const [showPassword, setShowPassword] = useState(false);

    return (
      <FormInput
        ref={ref}
        id={id}
        label={label}
        type={showPassword ? 'text' : 'password'}
        error={error}
        helperText={helperText}
        icon={<Lock className="w-4 h-4" />}
        rightElement={
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="p-1.5 text-slate-400 hover:text-cyan-300 transition-colors focus:outline-none"
            aria-label={showPassword ? 'ซ่อนรหัสผ่าน' : 'แสดงรหัสผ่าน'}
            tabIndex={-1}
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        }
        {...props}
      />
    );
  }
);

PasswordInput.displayName = 'PasswordInput';
