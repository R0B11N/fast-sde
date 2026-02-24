import { Link } from 'react-router-dom'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { MOCK_INSPECTION_SCHEDULES, MOCK_INSPECTION_RESULTS } from '@/data/mock'

export function ScheduledInspections() {
  const schedules = MOCK_INSPECTION_SCHEDULES
  const results = MOCK_INSPECTION_RESULTS

  return (
    <div className="space-y-6 animate-fade-in">
      <Link to="/safety" className="inline-flex items-center gap-1 text-sm text-brand-600 dark:text-brand-400 hover:underline">← Health & safety</Link>
      <div>
        <h1 className="font-display font-bold text-display-xl text-neutral-900 dark:text-white tracking-tight">Scheduled inspections</h1>
        <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-0.5">Predefined checklists; complete on schedule and track results.</p>
      </div>
      <Card padding="lg">
        <h2 className="font-display font-semibold text-lg text-neutral-900 dark:text-white mb-3">Upcoming / due</h2>
        {schedules.length === 0 ? (
          <EmptyState title="No scheduled inspections" description="Add inspection schedules in Admin (mock)." />
        ) : (
          <ul className="space-y-3">
            {schedules.map((s) => {
              const lastResult = results.filter((r) => r.scheduleId === s.id).sort((a, b) => b.completedAt.localeCompare(a.completedAt))[0]
              return (
                <li key={s.id}>
                  <Card padding="md" className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div>
                      <p className="font-medium text-neutral-900 dark:text-white">{s.title}</p>
                      <p className="text-sm text-neutral-500 dark:text-neutral-400">{s.siteName} · Due {s.nextDue} · {s.frequency}</p>
                      {lastResult && <p className="text-xs text-neutral-400 mt-1">Last completed {new Date(lastResult.completedAt).toLocaleDateString()} by {lastResult.completedBy}</p>}
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="default">{s.assignedToRole ?? '—'}</Badge>
                      <Link to="/forms/new/t1"><Button size="sm" variant="outline">Start inspection</Button></Link>
                    </div>
                  </Card>
                </li>
              )
            })}
          </ul>
        )}
      </Card>
      <Card padding="lg">
        <h2 className="font-display font-semibold text-lg text-neutral-900 dark:text-white mb-3">Recent results</h2>
        {results.length === 0 ? (
          <p className="text-sm text-neutral-500 dark:text-neutral-400">No inspection results yet.</p>
        ) : (
          <ul className="space-y-2">
            {results.map((r) => (
              <li key={r.id}>
                <Link to={`/safety/inspections/result/${r.id}`} className="block py-2 px-3 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800">
                  <span className="font-medium text-neutral-900 dark:text-white">{r.title}</span>
                  <span className="text-sm text-neutral-500 dark:text-neutral-400 ml-2">{r.siteName} · {new Date(r.completedAt).toLocaleString()} by {r.completedBy}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  )
}
