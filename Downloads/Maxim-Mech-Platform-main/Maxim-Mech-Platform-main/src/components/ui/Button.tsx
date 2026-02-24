import React from 'react'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: 'sm' | 'md' | 'lg'
  fullWidth?: boolean
  loading?: boolean
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
}

const variants: Record<Variant, string> = {
  primary: 'bg-gradient-to-b from-brand-600 to-brand-700 text-white hover:from-brand-500 hover:to-brand-600 active:from-brand-700 shadow-md hover:shadow-lg hover:-translate-y-0.5 border-0 transition-all duration-200',
  secondary: 'bg-slate-100/90 dark:bg-slate-600/40 text-neutral-900 dark:text-slate-100 hover:bg-slate-200/90 dark:hover:bg-slate-500/40 border border-slate-200/60 dark:border-slate-500/40 transition-all duration-200',
  ghost: 'bg-transparent hover:bg-slate-100 dark:hover:bg-slate-600/40 border-0 transition-colors duration-200',
  danger: 'bg-red-600 text-white hover:bg-red-500 active:bg-red-700 shadow-md hover:shadow-lg transition-all duration-200 border-0',
  outline: 'bg-transparent border-2 border-brand-500/80 text-brand-600 dark:text-brand-400 hover:bg-brand-50 dark:hover:bg-brand-950/50 hover:border-brand-500 transition-all duration-200',
}

const sizes = {
  sm: 'px-3 py-1.5 text-sm gap-1.5 min-h-[36px]',
  md: 'px-4 py-2.5 text-sm gap-2 min-h-[44px]',
  lg: 'px-6 py-3 text-base gap-2 min-h-[48px]',
}

export function Button({
  variant = 'primary',
  size = 'md',
  fullWidth,
  loading,
  leftIcon,
  rightIcon,
  className = '',
  children,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      type="button"
      className={`
        inline-flex items-center justify-center rounded-xl font-medium tracking-tight
        focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-neutral-900
        disabled:opacity-50 disabled:pointer-events-none disabled:hover:translate-y-0
        touch-target
        ${variants[variant]} ${sizes[size]} ${fullWidth ? 'w-full' : ''} ${className}
      `}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
      ) : (
        <>
          {leftIcon && <span className="shrink-0">{leftIcon}</span>}
          {children}
          {rightIcon && <span className="shrink-0">{rightIcon}</span>}
        </>
      )}
    </button>
  )
}
