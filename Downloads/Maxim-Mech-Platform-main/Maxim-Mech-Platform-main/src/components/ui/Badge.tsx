import React from 'react'

type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'info'

interface BadgeProps {
  children: React.ReactNode
  variant?: BadgeVariant
  className?: string
}

const variants: Record<BadgeVariant, string> = {
  default: 'bg-neutral-100/90 dark:bg-neutral-700/80 text-neutral-700 dark:text-neutral-300 border border-neutral-200/50 dark:border-neutral-600/50',
  success: 'bg-emerald-100/90 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200/50 dark:border-emerald-800/50',
  warning: 'bg-amber-100/90 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300 border border-amber-200/50 dark:border-amber-800/50',
  danger: 'bg-red-100/90 dark:bg-red-900/40 text-red-800 dark:text-red-300 border border-red-200/50 dark:border-red-800/50',
  info: 'bg-brand-100/90 dark:bg-brand-900/40 text-brand-800 dark:text-brand-300 border border-brand-200/50 dark:border-brand-800/50',
}

export function Badge({ children, variant = 'default', className = '' }: BadgeProps) {
  return (
    <span className={`inline-flex items-center rounded-lg px-2.5 py-0.5 text-xs font-medium tracking-tight ${variants[variant]} ${className}`}>
      {children}
    </span>
  )
}
