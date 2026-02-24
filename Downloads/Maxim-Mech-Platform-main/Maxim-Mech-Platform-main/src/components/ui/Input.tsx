import React from 'react'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  hint?: string
}

export function Input({ label, error, hint, className = '', id, ...props }: InputProps) {
  const inputId = id || `input-${Math.random().toString(36).slice(2)}`
  return (
    <div className="w-full">
      {label && (
        <label htmlFor={inputId} className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
          {label}
          {props.required && <span className="text-red-500 dark:text-red-400" aria-hidden="true"> *</span>}
        </label>
      )}
      <input
        id={inputId}
        className={`
          w-full min-h-[44px] px-4 rounded-xl border bg-white/90 dark:bg-neutral-800/90
          text-neutral-900 dark:text-white placeholder:text-neutral-400 dark:placeholder:text-neutral-500
          focus:outline-none focus:ring-2 focus:ring-brand-400/50 focus:border-brand-400
          transition-all duration-200
          ${error ? 'border-red-500' : 'border-slate-200 dark:border-slate-500/50'}
          ${className}
        `}
        {...props}
      />
      {error && <p className="mt-1.5 text-sm text-red-600 dark:text-red-400">{error}</p>}
      {hint && !error && <p className="mt-1.5 text-sm text-neutral-500 dark:text-neutral-400">{hint}</p>}
    </div>
  )
}
