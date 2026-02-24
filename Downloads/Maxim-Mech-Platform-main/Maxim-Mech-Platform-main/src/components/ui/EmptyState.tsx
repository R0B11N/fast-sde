import { ReactNode } from 'react'

interface EmptyStateProps {
  /** Short heading (e.g. "No documents") */
  title: string
  /** Optional longer description */
  description?: string
  /** Optional action (link or button) */
  action?: ReactNode
  /** Use compact padding for inline use */
  compact?: boolean
}

export function EmptyState({ title, description, action, compact }: EmptyStateProps) {
  return (
    <div
      className={`text-center text-neutral-500 dark:text-neutral-400 ${compact ? 'py-6' : 'py-10 px-4'}`}
      role="status"
      aria-live="polite"
    >
      <p className="font-medium text-neutral-700 dark:text-neutral-300">{title}</p>
      {description && <p className="mt-1 text-sm">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}
