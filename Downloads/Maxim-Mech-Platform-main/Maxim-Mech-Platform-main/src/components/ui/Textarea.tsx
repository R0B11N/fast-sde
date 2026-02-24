import React from 'react'

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
}

export function Textarea({ label, error, className = '', id, ...props }: TextareaProps) {
  const inputId = id || `ta-${Math.random().toString(36).slice(2)}`
  return (
    <div className="w-full">
      {label && (
        <label htmlFor={inputId} className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
          {label}
        </label>
      )}
      <textarea
        id={inputId}
        className={`
          w-full min-h-[100px] px-4 py-3 rounded-xl border bg-white dark:bg-neutral-800
          text-neutral-900 dark:text-white placeholder:text-neutral-400
          focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent
          ${error ? 'border-red-500' : 'border-neutral-300 dark:border-neutral-600'}
          ${className}
        `}
        {...props}
      />
      {error && <p className="mt-1.5 text-sm text-red-600 dark:text-red-400">{error}</p>}
    </div>
  )
}
