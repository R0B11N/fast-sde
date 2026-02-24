import { Link, useParams } from 'react-router-dom'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { MOCK_INSPECTION_RESULTS } from '@/data/mock'

export function InspectionResultDetail() {
  const { id } = useParams()
  const result = MOCK_INSPECTION_RESULTS.find((r) => r.id === id)

  if (!result) {
    return (
      <div className="space-y-4 animate-fade-in">
        <p className="text-neutral-500 dark:text-neutral-400">Result not found.</p>
        <Link to="/safety/inspections" className="text-brand-600 dark:text-brand-400 hover:underline">← Scheduled inspections</Link>
      </div>
    )
  }

  const passCount = result.items.filter((i) => i.result === 'pass').length
  const failCount = result.items.filter((i) => i.result === 'fail').length

  return (
    <div className="space-y-6 animate-fade-in max-w-2xl">
      <Link to="/safety/inspections" className="inline-flex items-center gap-1 text-sm text-brand-600 dark:text-brand-400 hover:underline">← Scheduled inspections</Link>
      <div>
        <h1 className="font-display font-bold text-display-xl text-neutral-900 dark:text-white tracking-tight">{result.title}</h1>
        <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-0.5">{result.siteName} · Completed {new Date(result.completedAt).toLocaleString()} by {result.completedBy}</p>
      </div>
      <Card padding="lg">
        <div className="flex gap-4 mb-4">
          <Badge variant="success">Pass: {passCount}</Badge>
          <Badge variant={failCount > 0 ? 'danger' : 'default'}>Fail: {failCount}</Badge>
        </div>
        <ul className="space-y-2">
          {result.items.map((item) => (
            <li key={item.id} className="flex items-start gap-3 py-2 border-b border-neutral-100 dark:border-neutral-700 last:border-0">
              <Badge variant={item.result === 'pass' ? 'success' : item.result === 'fail' ? 'danger' : 'default'} className="shrink-0">{item.result ?? 'na'}</Badge>
              <div>
                <p className="font-medium text-neutral-900 dark:text-white">{item.label}</p>
                {item.note && <p className="text-sm text-neutral-500 dark:text-neutral-400">{item.note}</p>}
              </div>
            </li>
          ))}
        </ul>
        {result.submissionId && (
          <p className="mt-4 text-sm text-neutral-500 dark:text-neutral-400">
            <Link to={`/forms/${result.submissionId}`} className="text-brand-600 dark:text-brand-400 hover:underline">View linked submission</Link>
          </p>
        )}
      </Card>
    </div>
  )
}
