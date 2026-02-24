import { Link } from 'react-router-dom'
import { Card } from '@/components/ui/Card'
import { MOCK_SITE_DETAILS } from '@/data/mock'

export function SitesList() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="font-display font-bold text-display-xl text-neutral-900 dark:text-white tracking-tight">Sites</h1>
        <p className="text-neutral-500 dark:text-neutral-400 mt-1">Site overview: active jobs, personnel, hazards, and incidents</p>
      </div>
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {MOCK_SITE_DETAILS.map((site) => (
          <li key={site.id}>
            <Link to={`/safety/sites/${site.id}`}>
              <Card padding="md" hover className="h-full">
                <p className="font-medium text-neutral-900 dark:text-white">{site.name}</p>
                {site.activeJobTitle && (
                  <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-0.5">{site.activeJobTitle}</p>
                )}
              </Card>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
