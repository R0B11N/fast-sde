import { Link } from 'react-router-dom'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { useFormSubmissions } from '@/contexts/FormSubmissionsContext'

const NEAR_MISS_TEMPLATE_ID = 't4'

export function NearMissList() {
  const { submissions } = useFormSubmissions()
  const nearMissSubmissions = submissions.filter((s) => s.templateId === NEAR_MISS_TEMPLATE_ID)

  return (
    <div className="space-y-6 animate-fade-in">
      <Link to="/safety" className="inline-flex items-center gap-1 text-sm text-brand-600 dark:text-brand-400 hover:underline">← Health & safety</Link>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display font-bold text-display-xl text-neutral-900 dark:text-white tracking-tight">Near-miss reports</h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-0.5">Custom form created by HR. Fill out the template and submit; track and follow up here.</p>
        </div>
        <Link to="/forms/new/t4"><Button size="sm">Report near-miss</Button></Link>
      </div>
      {nearMissSubmissions.length === 0 ? (
        <Card padding="lg">
          <EmptyState
            title="No near-miss reports yet"
            description="Use the form above to submit a near-miss report. HR creates the template with the text fields to fill out."
            action={<Link to="/forms/new/t4"><Button size="sm">Report near-miss</Button></Link>}
          />
        </Card>
      ) : (
        <ul className="space-y-3">
          {nearMissSubmissions.map((s) => (
            <li key={s.id}>
              <Link to={`/forms/${s.id}`}>
                <Card hover padding="md" className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <p className="font-medium text-neutral-900 dark:text-white">{s.siteName || '—'}</p>
                    <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-0.5">{s.templateName}</p>
                    <p className="text-xs text-neutral-400 mt-1">
                      {s.submittedBy && <>Submitted by {s.submittedBy} · </>}
                      {s.submittedAt ? new Date(s.submittedAt).toLocaleDateString() : 'Draft'}
                    </p>
                  </div>
                  <Badge variant={s.status === 'approved' ? 'success' : s.status === 'rejected' ? 'danger' : s.status === 'submitted' ? 'warning' : 'default'}>
                    {s.status === 'pending_site_signatures' ? 'Awaiting sign-offs' : s.status}
                  </Badge>
                </Card>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
