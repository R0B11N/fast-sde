import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useInjuryReports } from '@/contexts/InjuryReportsContext'
import { Card, CardHeader, CardDescription } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import type { InjuryReport, InjuryType, BodyPart, InjuryMechanism } from '@/types'

const INJURY_TYPE_LABELS: Record<InjuryType, string> = {
  laceration: 'Laceration',
  fracture: 'Fracture',
  strain: 'Strain',
  sprain: 'Sprain',
  burn: 'Burn',
  contusion: 'Contusion',
  amputation: 'Amputation',
  puncture: 'Puncture',
  other: 'Other',
}

const BODY_PART_LABELS: Record<BodyPart, string> = {
  hand: 'Hand',
  finger: 'Finger',
  arm: 'Arm',
  back: 'Back',
  shoulder: 'Shoulder',
  head: 'Head',
  eye: 'Eye',
  leg: 'Leg',
  knee: 'Knee',
  foot: 'Foot',
  torso: 'Torso',
  other: 'Other',
}

const MECHANISM_LABELS: Record<InjuryMechanism, string> = {
  'struck-by': 'Struck by',
  'struck-against': 'Struck against',
  'caught-in': 'Caught in',
  'fall-same-level': 'Fall same level',
  'fall-elevation': 'Fall from elevation',
  overexertion: 'Overexertion',
  'contact-with': 'Contact with',
  exposure: 'Exposure',
  other: 'Other',
}

function formatLabel(s: string): string {
  return INJURY_TYPE_LABELS[s as InjuryType] ?? BODY_PART_LABELS[s as BodyPart] ?? MECHANISM_LABELS[s as InjuryMechanism] ?? s.replace(/-/g, ' ')
}

export function InjuryAnalytics() {
  const { reports } = useInjuryReports()
  const [dateRange, setDateRange] = useState<'all' | 'ytd' | '90'>('all')

  const filtered = useMemo(() => {
    if (dateRange === 'all') return reports
    const now = new Date()
    const cut = dateRange === 'ytd'
      ? new Date(now.getFullYear(), 0, 1).toISOString().slice(0, 10)
      : new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
    return reports.filter((r) => (r.dateOfInjury ?? r.reportedAt.slice(0, 10)) >= cut)
  }, [reports, dateRange])

  const byPerson = useMemo(() => {
    const map = new Map<string, { name: string; reports: InjuryReport[] }>()
    filtered.forEach((r) => {
      const name = r.injuredPersonName || 'Unknown'
      const existing = map.get(name)
      if (existing) existing.reports.push(r)
      else map.set(name, { name, reports: [r] })
    })
    return Array.from(map.values()).sort((a, b) => b.reports.length - a.reports.length)
  }, [filtered])

  const byType = useMemo(() => {
    const map = new Map<string, number>()
    filtered.forEach((r) => {
      const t = r.injuryType || 'other'
      map.set(t, (map.get(t) ?? 0) + 1)
    })
    return Array.from(map.entries()).map(([k, v]) => ({ label: formatLabel(k), value: v })).sort((a, b) => b.value - a.value)
  }, [filtered])

  const byBodyPart = useMemo(() => {
    const map = new Map<string, number>()
    filtered.forEach((r) => {
      const t = r.bodyPart || 'other'
      map.set(t, (map.get(t) ?? 0) + 1)
    })
    return Array.from(map.entries()).map(([k, v]) => ({ label: formatLabel(k), value: v })).sort((a, b) => b.value - a.value)
  }, [filtered])

  const byMechanism = useMemo(() => {
    const map = new Map<string, number>()
    filtered.forEach((r) => {
      const t = r.mechanism || 'other'
      map.set(t, (map.get(t) ?? 0) + 1)
    })
    return Array.from(map.entries()).map(([k, v]) => ({ label: formatLabel(k), value: v })).sort((a, b) => b.value - a.value)
  }, [filtered])

  const bySeverity = useMemo(() => {
    const map = new Map<string, number>()
    filtered.forEach((r) => {
      map.set(r.severity, (map.get(r.severity) ?? 0) + 1)
    })
    return Array.from(map.entries()).map(([k, v]) => ({ label: k.charAt(0).toUpperCase() + k.slice(1), value: v }))
  }, [filtered])

  const bySite = useMemo(() => {
    const map = new Map<string, number>()
    filtered.forEach((r) => {
      map.set(r.siteName, (map.get(r.siteName) ?? 0) + 1)
    })
    return Array.from(map.entries()).map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value)
  }, [filtered])

  const byMonth = useMemo(() => {
    const map = new Map<string, number>()
    filtered.forEach((r) => {
      const date = r.dateOfInjury ?? r.reportedAt.slice(0, 10)
      const month = date.slice(0, 7)
      map.set(month, (map.get(month) ?? 0) + 1)
    })
    return Array.from(map.entries()).map(([label, value]) => ({ label, value })).sort()
  }, [filtered])

  const totals = useMemo(() => {
    const lostTime = filtered.filter((r) => r.lostTime).length
    const daysAway = filtered.reduce((s, r) => s + (r.daysAwayFromWork ?? 0), 0)
    const restrictedDays = filtered.reduce((s, r) => s + (r.restrictedDutyDays ?? 0), 0)
    const open = filtered.filter((r) => r.status !== 'closed').length
    const closed = filtered.filter((r) => r.status === 'closed').length
    const wsibReported = filtered.filter((r) => r.wsibReported).length
    const repeatInjuries = byPerson.filter((p) => p.reports.length > 1).length
    const repeatPersonCount = byPerson.filter((p) => p.reports.length > 1).reduce((s, p) => s + p.reports.length, 0)
    const recordables = filtered.length
    const MOCK_HOURS = 100000
    const trir = recordables * 200000 / MOCK_HOURS
    const dart = (daysAway + restrictedDays) * 200000 / MOCK_HOURS
    return { lostTime, daysAway, restrictedDays, open, closed, wsibReported, repeatInjuries, repeatPersonCount, trir, dart }
  }, [filtered, byPerson])

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display font-bold text-display-xl text-neutral-900 dark:text-white tracking-tight">Injury analytics</h1>
          <p className="text-neutral-500 dark:text-neutral-400 mt-1">Track types, who was injured, and key metrics</p>
        </div>
        <div className="flex gap-2">
          <Link to="/injury-reports"><Button variant="secondary">All reports</Button></Link>
          <div className="flex rounded-lg border border-neutral-200 dark:border-neutral-600 overflow-hidden">
            {(['all', 'ytd', '90'] as const).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setDateRange(r)}
                className={`px-3 py-1.5 text-sm font-medium ${dateRange === r ? 'bg-brand-100 dark:bg-brand-900/40 text-brand-700 dark:text-brand-300' : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'}`}
              >
                {r === 'all' ? 'All time' : r === 'ytd' ? 'YTD' : '90 days'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Summary metrics */}
      <Card padding="lg">
        <CardHeader>Summary metrics</CardHeader>
        <CardDescription>Totals for selected period ({filtered.length} injuries)</CardDescription>
        <div className="mt-4 grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
          <div className="rounded-xl border border-neutral-200 dark:border-neutral-600 p-4">
            <p className="text-2xl font-bold text-neutral-900 dark:text-white">{filtered.length}</p>
            <p className="text-sm text-neutral-500 dark:text-neutral-400">Total injuries</p>
          </div>
          <div className="rounded-xl border border-neutral-200 dark:border-neutral-600 p-4">
            <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">{totals.open}</p>
            <p className="text-sm text-neutral-500 dark:text-neutral-400">Open</p>
          </div>
          <div className="rounded-xl border border-neutral-200 dark:border-neutral-600 p-4">
            <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{totals.closed}</p>
            <p className="text-sm text-neutral-500 dark:text-neutral-400">Closed</p>
          </div>
          <div className="rounded-xl border border-neutral-200 dark:border-neutral-600 p-4">
            <p className="text-2xl font-bold text-neutral-900 dark:text-white">{totals.lostTime}</p>
            <p className="text-sm text-neutral-500 dark:text-neutral-400">Lost time</p>
          </div>
          <div className="rounded-xl border border-neutral-200 dark:border-neutral-600 p-4">
            <p className="text-2xl font-bold text-neutral-900 dark:text-white">{totals.daysAway}</p>
            <p className="text-sm text-neutral-500 dark:text-neutral-400">Days away</p>
          </div>
          <div className="rounded-xl border border-neutral-200 dark:border-neutral-600 p-4">
            <p className="text-2xl font-bold text-neutral-900 dark:text-white">{totals.restrictedDays}</p>
            <p className="text-sm text-neutral-500 dark:text-neutral-400">Restricted days</p>
          </div>
          <div className="rounded-xl border border-neutral-200 dark:border-neutral-600 p-4">
            <p className="text-2xl font-bold text-neutral-900 dark:text-white">{totals.wsibReported}</p>
            <p className="text-sm text-neutral-500 dark:text-neutral-400">WSIB reported</p>
          </div>
          <div className="rounded-xl border border-neutral-200 dark:border-neutral-600 p-4">
            <p className="text-2xl font-bold text-neutral-900 dark:text-white">{totals.repeatInjuries}</p>
            <p className="text-sm text-neutral-500 dark:text-neutral-400">Repeat injurers</p>
          </div>
          <div className="rounded-xl border border-neutral-200 dark:border-neutral-600 p-4">
            <p className="text-2xl font-bold text-neutral-900 dark:text-white">{totals.repeatPersonCount}</p>
            <p className="text-sm text-neutral-500 dark:text-neutral-400">Injuries (repeat)</p>
          </div>
          <div className="rounded-xl border border-neutral-200 dark:border-neutral-600 p-4">
            <p className="text-2xl font-bold text-neutral-900 dark:text-white">{totals.trir.toFixed(2)}</p>
            <p className="text-sm text-neutral-500 dark:text-neutral-400">TRIR (mock)</p>
          </div>
          <div className="rounded-xl border border-neutral-200 dark:border-neutral-600 p-4">
            <p className="text-2xl font-bold text-neutral-900 dark:text-white">{totals.dart.toFixed(2)}</p>
            <p className="text-sm text-neutral-500 dark:text-neutral-400">DART (mock)</p>
          </div>
        </div>
        <p className="mt-2 text-xs text-neutral-500 dark:text-neutral-400">TRIR = recordables × 200,000 / hours. DART = (days away + restricted) × 200,000 / hours. Hours = 100,000 (mock).</p>
      </Card>

      {/* Who was injured */}
      <Card padding="lg">
        <CardHeader>Who was injured</CardHeader>
        <CardDescription>Track individuals; click a report to view details</CardDescription>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-200 dark:border-neutral-600 text-left text-neutral-500 dark:text-neutral-400">
                <th className="py-2 pr-4 font-medium">Injured person</th>
                <th className="py-2 pr-4 font-medium">Count</th>
                <th className="py-2 pr-4 font-medium">Type</th>
                <th className="py-2 pr-4 font-medium">Body part</th>
                <th className="py-2 pr-4 font-medium">Site</th>
                <th className="py-2 pr-4 font-medium">Date</th>
                <th className="py-2 pr-4 font-medium">Severity</th>
                <th className="py-2 pr-4 font-medium">Report</th>
              </tr>
            </thead>
            <tbody>
              {byPerson.flatMap(({ name, reports: personReports }) =>
                personReports.map((r, i) => (
                  <tr key={r.id} className="border-b border-neutral-100 dark:border-neutral-700/50">
                    <td className="py-2 pr-4 font-medium text-neutral-900 dark:text-white">{i === 0 ? name : '—'}</td>
                    <td className="py-2 pr-4 text-neutral-600 dark:text-neutral-300">{i === 0 ? personReports.length : '—'}</td>
                    <td className="py-2 pr-4">{r.injuryType ? formatLabel(r.injuryType) : '—'}</td>
                    <td className="py-2 pr-4">{r.bodyPart ? formatLabel(r.bodyPart) : '—'}</td>
                    <td className="py-2 pr-4">{r.siteName}</td>
                    <td className="py-2 pr-4">{r.dateOfInjury ?? r.reportedAt.slice(0, 10)}</td>
                    <td className="py-2 pr-4"><Badge variant={r.severity === 'major' ? 'danger' : 'warning'}>{r.severity}</Badge></td>
                    <td className="py-2 pr-4"><Link to={`/injury-reports/${r.id}`} className="text-brand-600 dark:text-brand-400 hover:underline">View</Link></td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* By type, body part, mechanism */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Card padding="md">
          <CardHeader className="text-base">By injury type</CardHeader>
          <ul className="mt-2 space-y-1.5">
            {byType.length === 0 ? <li className="text-sm text-neutral-500">No data</li> : byType.map(({ label, value }) => (
              <li key={label} className="flex justify-between text-sm">
                <span className="text-neutral-700 dark:text-neutral-300">{label}</span>
                <span className="font-medium text-neutral-900 dark:text-white">{value}</span>
              </li>
            ))}
          </ul>
        </Card>
        <Card padding="md">
          <CardHeader className="text-base">By body part</CardHeader>
          <ul className="mt-2 space-y-1.5">
            {byBodyPart.length === 0 ? <li className="text-sm text-neutral-500">No data</li> : byBodyPart.map(({ label, value }) => (
              <li key={label} className="flex justify-between text-sm">
                <span className="text-neutral-700 dark:text-neutral-300">{label}</span>
                <span className="font-medium text-neutral-900 dark:text-white">{value}</span>
              </li>
            ))}
          </ul>
        </Card>
        <Card padding="md">
          <CardHeader className="text-base">By mechanism</CardHeader>
          <ul className="mt-2 space-y-1.5">
            {byMechanism.length === 0 ? <li className="text-sm text-neutral-500">No data</li> : byMechanism.map(({ label, value }) => (
              <li key={label} className="flex justify-between text-sm">
                <span className="text-neutral-700 dark:text-neutral-300">{label}</span>
                <span className="font-medium text-neutral-900 dark:text-white">{value}</span>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      {/* By severity, site, month */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Card padding="md">
          <CardHeader className="text-base">By severity</CardHeader>
          <ul className="mt-2 space-y-1.5">
            {bySeverity.map(({ label, value }) => (
              <li key={label} className="flex justify-between text-sm">
                <span className="text-neutral-700 dark:text-neutral-300">{label}</span>
                <span className="font-medium text-neutral-900 dark:text-white">{value}</span>
              </li>
            ))}
          </ul>
        </Card>
        <Card padding="md">
          <CardHeader className="text-base">By site</CardHeader>
          <ul className="mt-2 space-y-1.5">
            {bySite.length === 0 ? <li className="text-sm text-neutral-500">No data</li> : bySite.map(({ label, value }) => (
              <li key={label} className="flex justify-between text-sm">
                <span className="text-neutral-700 dark:text-neutral-300">{label}</span>
                <span className="font-medium text-neutral-900 dark:text-white">{value}</span>
              </li>
            ))}
          </ul>
        </Card>
        <Card padding="md">
          <CardHeader className="text-base">By month</CardHeader>
          <ul className="mt-2 space-y-1.5">
            {byMonth.length === 0 ? <li className="text-sm text-neutral-500">No data</li> : byMonth.slice(-12).map(({ label, value }) => (
              <li key={label} className="flex justify-between text-sm">
                <span className="text-neutral-700 dark:text-neutral-300">{label}</span>
                <span className="font-medium text-neutral-900 dark:text-white">{value}</span>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  )
}
