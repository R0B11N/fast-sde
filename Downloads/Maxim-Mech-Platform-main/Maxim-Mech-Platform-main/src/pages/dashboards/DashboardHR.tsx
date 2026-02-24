import { Link } from 'react-router-dom'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts'
import { Card, CardHeader, CardDescription } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import {
  MOCK_JOBS,
  MOCK_JOB_CHECK_INS,
  MOCK_HR_INJURIES_BY_MONTH,
  MOCK_HR_FORMS_COMPLETION,
  MOCK_DAILY_FORMS_TO_COMPLETE,
  MOCK_HAZARD_REPORTS,
  MOCK_COMPLIANCE_CALENDAR,
} from '@/data/mock'
import { useSubcontractors } from '@/contexts/SubcontractorsContext'
import { useInjuryReports } from '@/contexts/InjuryReportsContext'
import { useSignableTemplates } from '@/contexts/SignableTemplatesContext'
import { useSafetyObservations } from '@/contexts/SafetyObservationsContext'
import { useCorrectiveActions } from '@/contexts/CorrectiveActionsContext'
import { useCertificates } from '@/contexts/CertificatesContext'

const TODAY = '2025-02-09'

const CHART_COLORS = {
  reported: '#f59e0b',
  closed: '#10b981',
  completed: '#0f3d7a',
  due: '#94a3b8',
  minor: '#3b82f6',
  moderate: '#f59e0b',
  major: '#ef4444',
}

export function DashboardHR() {
  const { templates } = useSignableTemplates()
  const { observations } = useSafetyObservations()
  const { actions: correctiveActions } = useCorrectiveActions()
  const { certificates } = useCertificates()
  const now = new Date()
  const in30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
  const expiringSoon = certificates.filter((c) => c.expirationDate <= in30Days && c.expirationDate >= now.toISOString().slice(0, 10)).length
  const complianceDue = MOCK_COMPLIANCE_CALENDAR.filter((e) => e.dueDate >= now.toISOString().slice(0, 10)).slice(0, 5).length
  const { reports: injuryReports } = useInjuryReports()
  const openInjuries = injuryReports.filter((r) => r.status !== 'closed')
  const activeJobs = MOCK_JOBS.filter((j) => j.status === 'active').length
  const checkedInToday = MOCK_JOB_CHECK_INS.filter((c) => c.date === TODAY && c.checkedInAt).length
  const totalAssignedToday = MOCK_JOB_CHECK_INS.filter((c) => c.date === TODAY).length
  const formsPending = MOCK_DAILY_FORMS_TO_COMPLETE.filter((f) => f.status !== 'signed').length
  const customForms = templates.filter((f) => f.active)
  const openHazards = MOCK_HAZARD_REPORTS.filter((h) => h.status !== 'closed').length
  const observationsThisMonth = observations.filter((o) => {
    const d = new Date(o.observedAt)
    return d.getMonth() === 1 && d.getFullYear() === 2025
  }).length
  const overdueCorrective = correctiveActions.filter((c) => c.status !== 'completed' && c.dueDate < TODAY).length
  const formCompletionRate = MOCK_HR_FORMS_COMPLETION.length ? Math.round((MOCK_HR_FORMS_COMPLETION.reduce((s, w) => s + w.completed, 0) / MOCK_HR_FORMS_COMPLETION.reduce((s, w) => s + w.due, 0)) * 100) : 0
  const { subcontractors, certifications } = useSubcontractors()
  const subcontractorCount = subcontractors.length
  const subcontractorCertsExpiring = certifications.filter(
    (c) => c.status === 'expiring-soon' || (c.status === 'current' && c.expiresAt <= in30Days && c.expiresAt >= now.toISOString().slice(0, 10))
  ).length

  const severityCounts = injuryReports.reduce(
    (acc, r) => {
      acc[r.severity] = (acc[r.severity] ?? 0) + 1
      return acc
    },
    {} as Record<string, number>
  )
  const severityData = Object.entries(severityCounts).map(([name, value]) => ({ name: name.charAt(0).toUpperCase() + name.slice(1), value }))
  const pieColors = severityData.map((d) => CHART_COLORS[d.name.toLowerCase() as keyof typeof CHART_COLORS] ?? '#94a3b8')

  return (
    <div className="animate-fade-in">
      {/* Header: minimal, one primary action */}
      <header className="mb-8">
        <h1 className="font-display font-bold text-display-xl text-neutral-900 dark:text-white tracking-tight">HR Dashboard</h1>
        <p className="text-neutral-500 dark:text-neutral-400 mt-1">Injury reports, forms, and job assignments</p>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <Link to="/forms/new/t2"><Button>Report incident / near-miss</Button></Link>
          <Button variant="secondary" onClick={() => window.print()}>Print / Save as PDF</Button>
          <button type="button" className="text-sm text-neutral-500 dark:text-neutral-400 hover:underline" onClick={() => alert('Scheduled report would be emailed weekly (mock).')}>Schedule weekly report</button>
          <nav className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
            <Link to="/safety" className="text-brand-600 dark:text-brand-400 hover:underline">Health & safety</Link>
            <Link to="/injury-reports/analytics" className="text-brand-600 dark:text-brand-400 hover:underline">Injury analytics</Link>
            <Link to="/injury-reports" className="text-brand-600 dark:text-brand-400 hover:underline">Injury reports</Link>
            <Link to="/jobs" className="text-brand-600 dark:text-brand-400 hover:underline">Jobs</Link>
            <Link to="/admin/signable-forms" className="text-brand-600 dark:text-brand-400 hover:underline">Forms</Link>
            <Link to="/subcontractors" className="text-brand-600 dark:text-brand-400 hover:underline">Subcontractors</Link>
            <Link to="/admin/documents" className="text-brand-600 dark:text-brand-400 hover:underline">Documents</Link>
            <Link to="/hr/todo" className="text-brand-600 dark:text-brand-400 hover:underline">Todo & calendar</Link>
            <a href="https://calendar.google.com/calendar" target="_blank" rel="noopener noreferrer" className="text-brand-600 dark:text-brand-400 hover:underline">Google Calendar</a>
          </nav>
        </div>
      </header>

      {/* Trend alert (mock) */}
      {openInjuries.length > 0 && (
        <section className="mb-6">
          <div className="rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-900/10 px-4 py-3 flex items-center gap-3">
            <span className="text-amber-600 dark:text-amber-400 font-medium">Trend:</span>
            <span className="text-sm text-amber-800 dark:text-amber-200">Rising incidents at North Site this month (mock alert). Review open injury reports.</span>
            <Link to="/injury-reports" className="text-sm font-medium text-amber-700 dark:text-amber-300 hover:underline ml-auto">View reports</Link>
          </div>
        </section>
      )}

      {/* At a glance: one card, compact grid */}
      <section className="mb-8">
        <Card padding="md">
          <CardHeader className="text-base">At a glance</CardHeader>
          <CardDescription>Leading indicators and key counts</CardDescription>
          <div className="mt-4 grid grid-cols-2 gap-x-8 gap-y-4 sm:grid-cols-3 lg:grid-cols-6">
            <Stat label="Observations (month)" value={observationsThisMonth} to="/safety/observations" />
            <Stat label="Open hazards" value={openHazards} to="/safety/hazards" />
            <Stat label="Overdue CAPA" value={overdueCorrective} to="/safety/corrective-actions" variant={overdueCorrective > 0 ? 'warning' : undefined} />
            <Stat label="Certs expiring (30d)" value={expiringSoon} to="/certificates" variant={expiringSoon > 0 ? 'warning' : undefined} />
            <Stat label="Compliance due" value={complianceDue} to="/safety/compliance-calendar" />
            <Stat label="Form completion" value={`${formCompletionRate}%`} />
          </div>
        </Card>
      </section>

      {/* Key metrics: single row, light */}
      <section className="mb-8">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          <StatCard label="Open injuries" value={openInjuries.length} href="/injury-reports?filter=open" highlight={openInjuries.length > 0} />
          <StatCard label="Active jobs" value={activeJobs} href="/jobs" />
          <StatCard label="Checked in today" value={`${checkedInToday}/${totalAssignedToday}`} sub="on site" href="/jobs" />
          <StatCard label="Forms pending" value={formsPending} href="/daily-forms" />
          <StatCard label="Subcontractors" value={subcontractorCount} sub={subcontractorCertsExpiring > 0 ? `${subcontractorCertsExpiring} certs soon` : undefined} href="/subcontractors" />
        </div>
      </section>

      {/* Charts: injury trend + severity */}
      <section className="mb-8 grid gap-6 lg:grid-cols-2">
        <Card padding="md">
          <CardHeader className="text-base">Injury trend</CardHeader>
          <CardDescription>Reported vs closed by month</CardDescription>
          <div className="mt-4 h-[240px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={MOCK_HR_INJURIES_BY_MONTH} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-neutral-200 dark:stroke-neutral-600" vertical={false} />
                <XAxis dataKey="month" tick={{ fill: 'currentColor', fontSize: 11 }} className="text-neutral-500" />
                <YAxis tick={{ fill: 'currentColor', fontSize: 11 }} className="text-neutral-500" allowDecimals={false} width={24} />
                <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid var(--color-neutral-200)' }} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="reported" name="Reported" fill={CHART_COLORS.reported} radius={[4, 4, 0, 0]} />
                <Bar dataKey="closed" name="Closed" fill={CHART_COLORS.closed} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <Card padding="md">
          <CardHeader className="text-base">Injury severity</CardHeader>
          <CardDescription>All time</CardDescription>
          <div className="mt-4 h-[240px] w-full">
            {severityData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={severityData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={72}
                    paddingAngle={2}
                    label={({ name, value }) => `${name}: ${value}`}
                    stroke="transparent"
                  >
                    {severityData.map((_, i) => (
                      <Cell key={i} fill={pieColors[i]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: 8 }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-neutral-500">No data yet</div>
            )}
          </div>
        </Card>
      </section>

      {/* Quick access: injuries + forms in one card */}
      <section className="mb-8">
        <Card padding="md">
          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <div className="flex items-center justify-between gap-2">
                <CardHeader className="text-base mb-0 pb-1">Open injury reports</CardHeader>
                <Link to="/injury-reports" className="text-sm text-brand-600 dark:text-brand-400 hover:underline">View all</Link>
              </div>
              <ul className="mt-2 space-y-1">
                {openInjuries.length === 0 ? (
                  <li className="text-sm text-neutral-500 py-2">None open</li>
                ) : (
                  openInjuries.slice(0, 5).map((r) => (
                    <li key={r.id}>
                      <Link to={`/injury-reports/${r.id}`} className="flex items-center justify-between gap-2 py-2 px-2 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800/50 text-sm">
                        <span className="text-neutral-900 dark:text-white truncate">{r.siteName} — {(r.injuredPersonName || r.description).slice(0, 30)}{(r.injuredPersonName || r.description).length > 30 ? '…' : ''}</span>
                        <Badge variant={r.severity === 'major' ? 'danger' : 'warning'} className="shrink-0">{r.status}</Badge>
                      </Link>
                    </li>
                  ))
                )}
              </ul>
            </div>
            <div>
              <div className="flex items-center justify-between gap-2">
                <CardHeader className="text-base mb-0 pb-1">Custom forms</CardHeader>
                <Link to="/admin/signable-forms" className="text-sm text-brand-600 dark:text-brand-400 hover:underline">Manage</Link>
              </div>
              <ul className="mt-2 space-y-1">
                {customForms.slice(0, 5).map((f) => (
                  <li key={f.id} className="flex items-center justify-between gap-2 py-2 px-2 rounded-lg text-sm">
                    <span className="text-neutral-900 dark:text-white">{f.name}</span>
                    <span className="text-neutral-500 dark:text-neutral-400 text-xs">{f.schedule}</span>
                  </li>
                ))}
                {customForms.length === 0 && <li className="text-sm text-neutral-500 py-2">No forms yet</li>}
              </ul>
            </div>
          </div>
        </Card>
      </section>

      {/* Form completion: smaller, at bottom */}
      <section>
        <Card padding="md">
          <CardHeader className="text-base">Form completion (4 weeks)</CardHeader>
          <div className="mt-3 h-[160px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={MOCK_HR_FORMS_COMPLETION} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-neutral-200 dark:stroke-neutral-600" vertical={false} />
                <XAxis dataKey="week" tick={{ fill: 'currentColor', fontSize: 11 }} className="text-neutral-500" />
                <YAxis tick={{ fill: 'currentColor', fontSize: 11 }} className="text-neutral-500" allowDecimals={false} width={24} />
                <Tooltip contentStyle={{ borderRadius: 8 }} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="completed" name="Completed" fill={CHART_COLORS.completed} radius={[4, 4, 0, 0]} />
                <Bar dataKey="due" name="Due" fill={CHART_COLORS.due} radius={[4, 4, 0, 0]} opacity={0.7} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </section>
    </div>
  )
}

function Stat({
  label,
  value,
  to,
  variant,
}: {
  label: string
  value: number | string
  to?: string
  variant?: 'warning'
}) {
  const content = (
    <div className="flex flex-col">
      <span className={`text-xl font-semibold tabular-nums ${variant === 'warning' ? 'text-amber-600 dark:text-amber-400' : 'text-neutral-900 dark:text-white'}`}>
        {value}
      </span>
      <span className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">{label}</span>
    </div>
  )
  if (to) {
    return <Link to={to} className="rounded-lg p-2 -m-2 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors">{content}</Link>
  }
  return content
}

function StatCard({
  label,
  value,
  sub,
  href,
  highlight,
}: {
  label: string
  value: number | string
  sub?: string
  href?: string
  highlight?: boolean
}) {
  const content = (
    <div className="rounded-xl border border-neutral-200 dark:border-neutral-600 bg-neutral-50/50 dark:bg-neutral-800/30 px-4 py-3 min-h-[5.5rem] flex flex-col justify-between">
      <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">{label}</p>
      <div>
        <p className={`mt-1 text-xl font-bold tabular-nums ${highlight ? 'text-amber-600 dark:text-amber-400' : 'text-neutral-900 dark:text-white'}`}>
          {value}
        </p>
        <p className={`mt-0.5 text-xs text-neutral-500 dark:text-neutral-400 ${sub ? '' : 'invisible'}`}>{sub || '\u00A0'}</p>
      </div>
    </div>
  )
  if (href) {
    return <Link to={href} className="block transition-opacity hover:opacity-90">{content}</Link>
  }
  return content
}
