import React from 'react'

interface CardProps {
  children: React.ReactNode
  className?: string
  padding?: 'none' | 'sm' | 'md' | 'lg'
  hover?: boolean
  /** Optional click handler (e.g. for stopping propagation in modals). */
  onClick?: (e: React.MouseEvent<HTMLDivElement>) => void
}

const paddingMap = {
  none: '',
  sm: 'p-4',
  md: 'p-5',
  lg: 'p-6',
}

export function Card({ children, className = '', padding = 'md', hover, onClick }: CardProps) {
  return (
    <div
      onClick={onClick}
      className={`
        rounded-2xl border
        bg-white/95 dark:bg-surface-dark-elevated/95 backdrop-blur-sm
        shadow-soft dark:shadow-dark-soft
        transition-all duration-300 ease-out
        border-slate-200/80 dark:border-slate-600/40
        ${paddingMap[padding]} ${hover ? 'hover:shadow-soft-lg dark:hover:shadow-dark-glow hover:border-brand-200/80 dark:hover:border-brand-500/30 hover:-translate-y-0.5' : ''} ${className}
      `}
    >
      {children}
    </div>
  )
}

export function CardHeader({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`font-display font-semibold text-lg tracking-tight text-neutral-900 dark:text-white mb-1 ${className}`}>{children}</div>
}

export function CardDescription({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <p className={`text-sm text-neutral-500 dark:text-neutral-400 ${className}`}>{children}</p>
}
