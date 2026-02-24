import { Link } from 'react-router-dom'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { useFormSubmissions } from '@/contexts/FormSubmissionsContext'
import type { RiskLevel } from '@/types'

const HAZARD_TEMPLATE_ID = 't5'

function getRiskLevel(likelihood: number, impact: number): RiskLevel {
  const product = likelihood * impact
  if (product >= 20) return 'critical'
  if (product >= 15) return 'high'
  if (product >= 8) return 'medium'
  return 'low'
}

export function HazardsList() {
  const { submissions } = useFormSubmissions()
  const hazardSubmissions = submissions.filter((s) => s.templateId === HAZARD_TEMPLATE_ID)

  return (
    <div className="space-y-6 animate-fade-in">
      <Link to="/safety" className="inline-flex items-center gap-1 text-sm text-brand-600 dark:text-brand-400 hover:underline">← Health & safety</Link>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display font-bold text-display-xl text-neutral-900 dark:text-white tracking-tight">Hazard register</h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-0.5">Custom form by HR with risk scoring (likelihood × impact). Track by site and risk level.</p>
        </div>
        <Link to="/forms/new/t5"><Button size="sm">Report hazard</Button></Link>
      </div>
      {hazardSubmissions.length === 0 ? (
        <Card padding="lg">
          <EmptyState
            title="No hazard reports yet"
            description="Use the form above to submit a hazard report. HR creates the template with the text fields to fill out."
            action={<Link to="/forms/new/t5"><Button size="sm">Report hazard</Button></Link>}
          />
        </Card>
      ) : (
        <ul className="space-y-3">
          {hazardSubmissions.map((s) => {
            const l = s.fieldValues?.hzf5 != null ? Number(s.fieldValues.hzf5) : undefined
            const i = s.fieldValues?.hzf6 != null ? Number(s.fieldValues.hzf6) : undefined
            const riskLevel = typeof l === 'number' && !Number.isNaN(l) && typeof i === 'number' && !Number.isNaN(i) ? getRiskLevel(l, i) : null
            return (
              <li key={s.id}>
                <Link to={`/forms/${s.id}`}>
                  <Card hover padding="md" className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div>
                      <p className="font-medium text-neutral-900 dark:text-white">{s.siteName || s.templateName}</p>
                      <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-0.5">{s.templateName}</p>
                      <p className="text-xs text-neutral-400 mt-1">
                        {s.submittedBy && <>Submitted by {s.submittedBy} · </>}
                        {s.submittedAt ? new Date(s.submittedAt).toLocaleDateString() : 'Draft'}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {riskLevel && (
                        <Badge variant={riskLevel === 'critical' || riskLevel === 'high' ? 'danger' : riskLevel === 'medium' ? 'warning' : 'default'}>
                          Risk: {riskLevel}
                        </Badge>
                      )}
                      <Badge variant={s.status === 'approved' ? 'success' : s.status === 'rejected' ? 'danger' : s.status === 'submitted' ? 'warning' : 'default'}>
                        {s.status === 'pending_site_signatures' ? 'Awaiting sign-offs' : s.status}
                      </Badge>
                    </div>
                  </Card>
                </Link>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
