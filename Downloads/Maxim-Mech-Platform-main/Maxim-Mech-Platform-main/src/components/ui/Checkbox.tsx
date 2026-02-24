import React from 'react'

interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: string
  description?: string
}

export function Checkbox({ label, description, className = '', id, ...props }: CheckboxProps) {
  const inputId = id || `cb-${Math.random().toString(36).slice(2)}`
  return (
    <label htmlFor={inputId} className={`flex items-start gap-3 cursor-pointer group min-h-[44px] py-2 ${className}`}>
      <input
        id={inputId}
        type="checkbox"
        className="mt-1 h-5 w-5 rounded border-neutral-300 dark:border-neutral-600 text-brand-600 focus:ring-brand-500 shrink-0"
        {...props}
      />
      <span className="flex flex-col">
        <span className="text-sm font-medium text-neutral-900 dark:text-white">{label}</span>
        {description && <span className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">{description}</span>}
      </span>
    </label>
  )
}
