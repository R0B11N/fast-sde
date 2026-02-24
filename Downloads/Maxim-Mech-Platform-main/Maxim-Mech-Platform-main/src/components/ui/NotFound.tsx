import { ReactNode } from 'react'

interface NotFoundProps {
  /** Page/section title (e.g. "Document not found") */
  title: string
  /** Optional extra message */
  message?: string
  /** Back link or button (e.g. <Link to="...">Back to ...</Link>) */
  backAction: ReactNode
}

export function NotFound({ title, message, backAction }: NotFoundProps) {
  return (
    <div className="max-w-3xl mx-auto space-y-4 animate-fade-in">
      <p className="text-neutral-700 dark:text-neutral-300 font-medium">{title}</p>
      {message && <p className="text-neutral-500 dark:text-neutral-400 text-sm">{message}</p>}
      <div className="text-brand-600 dark:text-brand-400 hover:underline">{backAction}</div>
    </div>
  )
}
