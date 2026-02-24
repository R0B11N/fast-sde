import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useUser } from '@/contexts/UserContext'
import { useInjuryReports } from '@/contexts/InjuryReportsContext'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { downloadCsv } from '@/utils/exportCsv'

export function InjuryReports() {
  const { user } = useUser()
  const { reports } = useInjuryReports()
  const [filter, setFilter] = useState<'all' | 'open' | 'closed'>('all')

  if (user?.role !== 'hr' && user?.role !== 'owner') return null

  const filtered = reports.filter((r) => {
    if (filter === 'all') return true
    if (filter === 'open') return r.status !== 'closed'
    return r.status === 'closed'
  })

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display font-bold text-display-xl text-neutral-900 dark:text-white tracking-tight">Injury reports</h1>
          <p className="text-neutral-500 dark:text-neutral-400 mt-1">Track and manage workplace injury reports in depth</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link to="/injury-reports/analytics"><Button variant="secondary">Analytics & metrics</Button></Link>
          <Button variant="secondary" onClick={() => {
            const rows = filtered.map((r) => ({
              id: r.id,
              site: r.siteName,
              description: r.description,
              injuredPerson: r.injuredPersonName ?? '',
              type: r.injuryType ?? '',
              bodyPart: r.bodyPart ?? '',
              severity: r.severity,
              status: r.status,
              reportedBy: r.reportedBy,
              reportedAt: r.reportedAt,
            }))
            downloadCsv(rows, `injury-reports-${new Date().toISOString().slice(0, 10)}.csv`)
          }}>Export CSV</Button>
          <Button leftIcon={<PlusIcon />}>New report</Button>
        </div>
      </div>

      <div className="flex gap-2">
        {(['all', 'open', 'closed'] as const).map((f) => (
          <Button key={f} variant={filter === f ? 'primary' : 'ghost'} size="sm" onClick={() => setFilter(f)}>
            {f === 'all' ? 'All' : f === 'open' ? 'Open' : 'Closed'}
          </Button>
        ))}
      </div>

      <ul className="space-y-3">
        {filtered.map((r) => (
          <li key={r.id}>
            <Link to={`/injury-reports/${r.id}`}>
              <Card padding="md" hover className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <p className="font-medium text-neutral-900 dark:text-white">{r.siteName} — {r.description.slice(0, 60)}{r.description.length > 60 ? '…' : ''}</p>
                  <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-0.5">
                    Reported by {r.reportedBy} · {r.reportedAt} · Severity: {r.severity}
                  </p>
                </div>
                <Badge variant={r.status === 'closed' ? 'default' : r.severity === 'major' ? 'danger' : 'warning'}>{r.status}</Badge>
              </Card>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}

function PlusIcon() {
  return <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
}
