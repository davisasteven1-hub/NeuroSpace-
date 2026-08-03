import { useState } from 'react';
import type { InputHTMLAttributes } from 'react';
import { Eye, EyeOff } from 'lucide-react';

type PasswordInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'type'>;

export function PasswordInput({ className = '', disabled, ...props }: PasswordInputProps) {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div className="relative">
      <input
        {...props}
        disabled={disabled}
        type={isVisible ? 'text' : 'password'}
        className={`${className} pr-10`}
      />
      <button
        type="button"
        disabled={disabled}
        aria-label={isVisible ? 'Hide password' : 'Show password'}
        onClick={() => setIsVisible((visible) => !visible)}
        className="absolute inset-y-0 right-0 flex items-center px-3 text-safe/70 transition-all duration-200 hover:text-safe hover:drop-shadow-[0_0_10px_rgba(0,255,136,0.7)] focus:outline-none focus:text-safe focus:drop-shadow-[0_0_10px_rgba(0,255,136,0.7)] disabled:cursor-not-allowed disabled:opacity-40"
      >
        {isVisible ? (
          <EyeOff size={16} className="drop-shadow-[0_0_4px_rgba(0,255,136,0.7)]" />
        ) : (
          <Eye size={16} className="drop-shadow-[0_0_4px_rgba(0,255,136,0.7)]" />
        )}
      </button>
    </div>
  );
}
