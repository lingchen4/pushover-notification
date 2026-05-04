import type { InputHTMLAttributes, ReactNode } from 'react';
import { Input } from './Input';

interface FormFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: ReactNode;
  helper?: string;
}

export function FormField({ label, helper, id, ...inputProps }: Readonly<FormFieldProps>) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <Input id={id} {...inputProps} />
      {helper && <p className="mt-1 text-xs text-gray-400">{helper}</p>}
    </div>
  );
}
