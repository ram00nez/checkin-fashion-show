import React from 'react';

interface InputProps {
  type: 'text' | 'email' | 'password';
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  className?: string;
  placeholder?: string;
  label?: string;
  error?: string;
  id: string;
  required?: boolean;
  autoComplete?: string;
  disabled?: boolean;
}

export function Input({
  type,
  value,
  onChange,
  className = '',
  placeholder = '',
  label,
  error,
  id,
}: InputProps) {
  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={id}
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          {label}
        </label>
      )}
      <input
        type={type}
        value={value}
        onChange={onChange}
        id={id}
        className={`
          w-full rounded-lg border border-gray-300 px-4 py-2 text-gray-900 
          focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20
          disabled:bg-gray-100 disabled:text-gray-500
          ${error ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}
          ${className}
        `}
        placeholder={placeholder}
      />
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
}

Input.displayName = 'Input';

export default Input;