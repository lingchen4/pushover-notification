import type { InputHTMLAttributes } from 'react';

type InputProps = InputHTMLAttributes<HTMLInputElement>;

export function Input({ className = '', ...props }: Readonly<InputProps>) {
  return (
    <input
      className={`w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none ${className}`}
      {...props}
    />
  );
}
