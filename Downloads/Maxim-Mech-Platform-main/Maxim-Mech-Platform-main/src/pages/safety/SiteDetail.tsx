import { Link, useParams } from 'react-router-dom'
import { Card, CardHeader, CardDescription } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Breadcrumbs } from '@/components/ui/Breadcrumbs'
import { MOCK_SITE_DETAILS, MOCK_JOBS, MOCK_JOB_CHECK_INS, MOCK_HAZARD_REPORTS, MOCK_INCIDENTS } from '@/data/mock'
import { useInjuryReports } from '@/contexts/InjuryReportsContext'

const TODAY = '2025-02-09'

export function SiteDetail() {
  const { id } = useParams()
  const { reports } = useInjuryReports()
  const site = id ? MOCK_SITE_DETAILS.find((s) => s.id === id) : undefined
  if (!site) {
    return (
      <div className="space-y-4 animate-fade-in">
        <Breadcrumbs items={[{ label: 'Sites', to: '/safety/sites' }, { label: 'Not found' }]} />
        <p className="text-neutral-500 dark:text-neutral-400">Site not found.</p>
        <Link to="/safety" className="text-brand-600 dark:text-brand-400 hover:underline">Back to Health & safety</Link>
      </div>
    )
  }

  const job = site.jobId ? MOCK_JOBS.find((j) => j.id === site.jobId) : undefined
  const checkInsToday = MOCK_JOB_CHECK_INS.filter((c) => c.date === TODAY && job && c.jobId === job.id)
  const hazards = MOCK_HAZARD_REPORTS.filter((h) => h.siteName === site.name)
  const incidents = MOCK_INCIDENTS.filter((i) => i.siteName === site.name)
  const injuries = reports.filter((r) => r.siteName === site.name)

  return (
    <div className="space-y-6 animate-fade-in">
      <Breadcrumbs items={[{ label: 'Health & safety', to: '/safety' }, { label: 'Sites', to: '/safety/sites' }, { label: site.name }]} />
      <div>
        <h1 className="font-display font-bold text-display-xl text-neutral-900 dark:text-white tracking-tight">{site.name}</h1>
        <p className="text-neutral-500 dark:text-neutral-400 mt-1">Site overview: active job, personnel, hazards, and incidents</p>
      </div>

      {job && (
        <Card padding="md">
          <CardHeader className="text-base">Active job</CardHeader>
          <CardDescription>Current work at this site</CardDescription>
          <div className="mt-3">
            <Link to={`/jobs/${job.id}`} className="font-medium text-brand-600 dark:text-brand-400 hover:underline">{job.title}</Link>
            <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-0.5">Status: {job.status}</p>
          </div>
        </Card>
      )}

      {job && checkInsToday.length > 0 && (
        <Card padding="md">
          <CardHeader className="text-base">Checked in today</CardHeader>
          <CardDescription>Personnel on site</CardDescription>
          <ul className="mt-3 space-y-2">
            {checkInsToday.filter((c) => c.checkedInAt).map((c) => (
              <li key={c.userId} className="flex items-center justify-between py-2 px-3 rounded-lg bg-neutral-50 dark:bg-neutral-800/50">
                <span className="text-sm font-medium text-neutral-900 dark:text-white">User {c.userId}</span>
                <span className="text-xs text-neutral-500">In at {c.checkedInAt ?? '—'}</span>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <Card padding="md">
        <div className="flex items-center justify-between gap-2">
          <CardHeader className="text-base mb-0">Open hazards</CardHeader>
          <Link to="/safety/hazards" className="text-sm text-brand-600 dark:text-brand-400 hover:underline">View all</Link>
        </div>
        {hazards.length === 0 ? (
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-2">No hazards at this site.</p>
        ) : (
          <ul className="mt-2 space-y-2">
            {hazards.slice(0, 5).map((h) => (
              <li key={h.id}>
                <Link to="/safety/hazards" className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800/50">
                  <span className="text-sm font-medium text-neutral-900 dark:text-white">{h.title}</span>
                  <Badge variant={h.riskLevel === 'critical' || h.riskLevel === 'high' ? 'danger' : 'warning'}>{h.status}</Badge>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card padding="md">
        <div className="flex items-center justify-between gap-2">
          <CardHeader className="text-base mb-0">Recent incidents</CardHeader>
          <Link to="/safety/incidents" className="text-sm text-brand-600 dark:text-brand-400 hover:underline">View all</Link>
        </div>
        {incidents.length === 0 ? (
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-2">No incidents at this site.</p>
        ) : (
          <ul className="mt-2 space-y-2">
            {incidents.map((i) => (
              <li key={i.id} className="flex items-center justify-between py-2 px-3 rounded-lg">
                <span className="text-sm font-medium text-neutral-900 dark:text-white">{i.title}</span>
                <Badge variant="default">{i.status}</Badge>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card padding="md">
        <div className="flex items-center justify-between gap-2">
          <CardHeader className="text-base mb-0">Injury reports at this site</CardHeader>
          <Link to="/injury-reports" className="text-sm text-brand-600 dark:text-brand-400 hover:underline">View all</Link>
        </div>
        {injuries.length === 0 ? (
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-2">No injury reports at this site.</p>
        ) : (
          <ul className="mt-2 space-y-2">
            {injuries.slice(0, 5).map((r) => (
              <li key={r.id}>
                <Link to={`/injury-reports/${r.id}`} className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800/50">
                  <span className="text-sm font-medium text-neutral-900 dark:text-white">{(r.injuredPersonName || r.description).slice(0, 40)}…</span>
                  <Badge variant={r.severity === 'major' ? 'danger' : 'warning'}>{r.status}</Badge>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  )
}
