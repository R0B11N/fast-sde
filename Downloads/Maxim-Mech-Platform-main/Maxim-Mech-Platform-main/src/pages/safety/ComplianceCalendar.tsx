import { Link } from 'react-router-dom'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { MOCK_COMPLIANCE_CALENDAR } from '@/data/mock'

export function ComplianceCalendar() {
  const events = [...MOCK_COMPLIANCE_CALENDAR].sort((a, b) => a.dueDate.localeCompare(b.dueDate))
  const now = new Date().toISOString().slice(0, 10)

  return (
    <div className="space-y-6 animate-fade-in">
      <Link to="/safety" className="inline-flex items-center gap-1 text-sm text-brand-600 dark:text-brand-400 hover:underline">← Health & safety</Link>
      <div>
        <h1 className="font-display font-bold text-display-xl text-neutral-900 dark:text-white tracking-tight">Compliance calendar</h1>
        <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-0.5">Certificate expirations, inspection due dates, and report deadlines.</p>
      </div>
      <Card padding="lg">
        {events.length === 0 ? (
          <p className="text-sm text-neutral-500 dark:text-neutral-400">No compliance events scheduled.</p>
        ) : (
          <ul className="space-y-3">
            {events.map((e) => {
              const isOverdue = e.dueDate < now
              return (
                <li key={e.id}>
                  <div className="flex flex-wrap items-center justify-between gap-2 py-2 border-b border-neutral-100 dark:border-neutral-700 last:border-0">
                    <div>
                      <p className="font-medium text-neutral-900 dark:text-white">{e.title}</p>
                      <p className="text-sm text-neutral-500 dark:text-neutral-400">{e.siteName && `${e.siteName} · `}{e.dueDate}{e.metadata?.requirement && ` · ${e.metadata.requirement}`}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={e.type === 'certificate_expiry' || e.type === 'subcontractor_cert_expiry' ? 'warning' : e.type === 'inspection_due' ? 'default' : 'default'}>{e.type.replace(/_/g, ' ')}</Badge>
                      {isOverdue && <Badge variant="danger">Overdue</Badge>}
                      {e.recordId && e.type === 'certificate_expiry' && <Link to="/certificates"><span className="text-sm text-brand-600 dark:text-brand-400 hover:underline">View</span></Link>}
                      {e.recordId && e.type === 'inspection_due' && <Link to="/safety/inspections"><span className="text-sm text-brand-600 dark:text-brand-400 hover:underline">View</span></Link>}
                      {(e.type === 'subcontractor_cert_expiry' || e.type === 'subcontractor_insurance_expiry') && (e.metadata?.subcontractorId ?? e.recordId) && (
                        <Link to={`/subcontractors/${e.metadata?.subcontractorId ?? e.recordId}`}><span className="text-sm text-brand-600 dark:text-brand-400 hover:underline">View</span></Link>
                      )}
                    </div>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </Card>
    </div>
  )
}
