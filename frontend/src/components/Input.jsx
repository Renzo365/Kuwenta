import React from 'react';

const Input = React.forwardRef(({
  label,
  error,
  type = 'text',
  placeholder = '',
  disabled = false,
  className = '',
  ...props
}, ref) => {
  return (
    <div className={`flex flex-col w-full gap-1.5 ${className}`}>
      {label && (
        <label className="text-sm font-semibold text-slate-300 dark:text-slate-300">
          {label}
        </label>
      )}
      <input
        type={type}
        placeholder={placeholder}
        disabled={disabled}
        ref={ref}
        className={`
          w-full px-4 py-2.5 rounded-xl border font-normal text-sm outline-none transition-all duration-200
          bg-slate-800/50 border-slate-700 text-slate-100 placeholder-slate-500
          focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20
          disabled:opacity-50 disabled:cursor-not-allowed
          ${error ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''}
        `}
        {...props}
      />
      {error && (
        <span className="text-xs text-red-500 font-medium">
          {error.message || error}
        </span>
      )}
    </div>
  );
});

Input.displayName = 'Input';

export default Input;
