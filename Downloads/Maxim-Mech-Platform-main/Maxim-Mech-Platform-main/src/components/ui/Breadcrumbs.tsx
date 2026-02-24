import { Link } from 'react-router-dom'

export interface BreadcrumbItem {
  label: string
  to?: string
}

export function Breadcrumbs({ items }: { items: BreadcrumbItem[] }) {
  return (
    <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-1 text-sm text-neutral-500 dark:text-neutral-400 mb-4">
      {items.map((item, i) => (
        <span key={i} className="flex items-center gap-1">
          {i > 0 && <span className="mx-0.5">/</span>}
          {item.to ? (
            <Link to={item.to} className="hover:text-brand-600 dark:hover:text-brand-400 hover:underline">
              {item.label}
            </Link>
          ) : (
            <span className="text-neutral-700 dark:text-neutral-300 font-medium">{item.label}</span>
          )}
        </span>
      ))}
    </nav>
  )
}
