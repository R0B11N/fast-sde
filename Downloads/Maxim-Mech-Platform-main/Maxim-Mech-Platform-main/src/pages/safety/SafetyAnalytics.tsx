import { Link } from 'react-router-dom'
import { Card, CardHeader, CardDescription } from '@/components/ui/Card'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts'
import { useFormSubmissions } from '@/contexts/FormSubmissionsContext'
import { useCorrectiveActions } from '@/contexts/CorrectiveActionsContext'
import { MOCK_HR_INJURIES_BY_MONTH } from '@/data/mock'

const COLORS = ['#0f3d7a', '#f59e0b', '#10b981']

export function SafetyAnalytics() {
  const { submissions } = useFormSubmissions()
  const { actions } = useCorrectiveActions()

  const incidentSubmissions = submissions.filter((s) => s.templateId === 't2' && s.submittedAt)
  const incidentsByMonth: Record<string, number> = {}
  incidentSubmissions.forEach((s) => {
    if (s.submittedAt) {
      const key = s.submittedAt.slice(0, 7)
      incidentsByMonth[key] = (incidentsByMonth[key] ?? 0) + 1
    }
  })
  const incidentTrendData = Object.entries(incidentsByMonth)
    .map(([month, count]) => ({ month: month.slice(5) + '/' + month.slice(2, 4), count }))
    .sort((a, b) => a.month.localeCompare(b.month))
  if (incidentTrendData.length === 0) incidentTrendData.push({ month: '—', count: 0 })

  const capaByStatus = [
    { name: 'Open', value: actions.filter((a) => a.status === 'open').length },
    { name: 'In progress', value: actions.filter((a) => a.status === 'in-progress').length },
    { name: 'Completed', value: actions.filter((a) => a.status === 'completed').length },
  ].filter((d) => d.value > 0)
  if (capaByStatus.length === 0) capaByStatus.push({ name: 'No data', value: 1 })

  const injuryTrendData = MOCK_HR_INJURIES_BY_MONTH.map((m) => ({ month: m.month, reported: m.reported, closed: m.closed }))

  return (
    <div className="space-y-6 animate-fade-in">
      <Link to="/safety" className="inline-flex items-center gap-1 text-sm text-brand-600 dark:text-brand-400 hover:underline">← Health & safety</Link>
      <div>
        <h1 className="font-display font-bold text-display-xl text-neutral-900 dark:text-white tracking-tight">Safety analytics</h1>
        <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-0.5">Incident trends, injury reports, and CAPA status.</p>
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        <Card padding="lg">
          <CardHeader>Incident report trend (template t2)</CardHeader>
          <CardDescription>Submitted incidents by month</CardDescription>
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={incidentTrendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#0f3d7a" name="Incidents" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <Card padding="lg">
          <CardHeader>CAPA status</CardHeader>
          <CardDescription>Corrective and preventive actions by status</CardDescription>
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={capaByStatus} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                  {capaByStatus.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
      <Card padding="lg">
        <CardHeader>Injury reports (HR metric)</CardHeader>
        <CardDescription>Reported vs closed by month</CardDescription>
        <div className="mt-4 h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={injuryTrendData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="reported" fill="#f59e0b" name="Reported" />
              <Bar dataKey="closed" fill="#10b981" name="Closed" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  )
}
