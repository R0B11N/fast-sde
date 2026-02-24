import { Link } from 'react-router-dom'
import { useUser } from '@/contexts/UserContext'
import { Card, CardHeader, CardDescription } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { MOCK_INCIDENTS, MOCK_SIGNATURE_REQUESTS, MOCK_DAILY_FORMS_TO_COMPLETE } from '@/data/mock'
import { useFormSubmissions } from '@/contexts/FormSubmissionsContext'

export function DashboardSupervisor() {
  const { user } = useUser()
  const { submissions } = useFormSubmissions()
  const toSubmit = submissions.filter((f) => f.status === 'draft')
  const waitingSignatures = MOCK_SIGNATURE_REQUESTS.filter((sr) => sr.requiredSigners.some((s) => s.status === 'pending'))
  const recentIncidents = MOCK_INCIDENTS.slice(0, 2)
  const today = new Date().toISOString().slice(0, 10)
  const dailyFormsPending = MOCK_DAILY_FORMS_TO_COMPLETE.filter((f) => {
    if (f.dueDate > today || f.status === 'signed') return false
    if (f.assignedToUserId) return f.assignedToUserId === user?.id
    return f.assignedToRole === 'supervisor'
  }).length

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display font-bold text-display-xl text-neutral-900 dark:text-white tracking-tight">Supervisor dashboard</h1>
          <p className="text-neutral-500 dark:text-neutral-400 mt-1">Sites & teams</p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          <Link to="/daily-forms" className="w-full sm:w-auto"><Button className="w-full sm:w-auto">Daily forms to sign</Button></Link>
          <Link to="/forms/new/t2" className="w-full sm:w-auto"><Button variant="secondary" leftIcon={<PlusIcon />} className="w-full sm:w-auto">New incident report</Button></Link>
          <Link to="/forms/new/t1" className="w-full sm:w-auto"><Button variant="secondary" className="w-full sm:w-auto">New site inspection</Button></Link>
        </div>
      </div>

      {dailyFormsPending > 0 && (
        <Link to="/daily-forms">
          <Card hover padding="md" className="border-brand-200 dark:border-brand-800 bg-brand-50/50 dark:bg-brand-950/30">
            <div className="flex items-center justify-between">
              <div>
                <CardHeader>Daily forms to complete</CardHeader>
                <CardDescription>You have {dailyFormsPending} form{dailyFormsPending === 1 ? '' : 's'} to fill out and sign today</CardDescription>
              </div>
              <span className="text-brand-600 dark:text-brand-400 font-medium">Go to daily forms →</span>
            </div>
          </Card>
        </Link>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>Active sites</CardHeader>
          <CardDescription>North Site, West Site, East Site</CardDescription>
          <ul className="mt-4 space-y-2">
            {['North Site', 'West Site', 'East Site'].map((site) => (
              <li key={site}>
                <span className="block py-2 px-3 rounded-xl bg-neutral-50 dark:bg-neutral-700/50 text-sm font-medium">{site}</span>
              </li>
            ))}
          </ul>
        </Card>

        <Card>
          <CardHeader>Documents to submit</CardHeader>
          <CardDescription>Drafts ready for submission</CardDescription>
          <ul className="mt-4 space-y-2">
            {toSubmit.length === 0 ? <li className="text-sm text-neutral-500">No drafts</li> : toSubmit.map((f) => (
              <li key={f.id}><Link to={`/forms/${f.id}`} className="block py-2 px-3 rounded-xl hover:bg-neutral-50 dark:hover:bg-neutral-700/50 font-medium text-brand-600 dark:text-brand-400">{f.templateName}</Link></li>
            ))}
          </ul>
        </Card>

        <Card>
          <CardHeader>Waiting for labourer signatures</CardHeader>
          <CardDescription>Documents pending sign-off</CardDescription>
          <ul className="mt-4 space-y-2">
            {waitingSignatures.map((sr) => (
              <li key={sr.id}>
                <Link to={`/signing/${sr.id}`} className="flex items-center justify-between py-2 px-3 rounded-xl hover:bg-neutral-50 dark:hover:bg-neutral-700/50">
                  <span className="font-medium text-neutral-900 dark:text-white">{sr.documentName}</span>
                  <Badge variant="warning">Pending</Badge>
                </Link>
              </li>
            ))}
          </ul>
        </Card>

        <Card>
          <CardHeader>Recent incidents</CardHeader>
          <CardDescription>Latest at your sites</CardDescription>
          <ul className="mt-4 space-y-2">
            {recentIncidents.map((i) => (
              <li key={i.id}>
                <Link to={`/search/incident/${i.id}`} className="flex items-center justify-between py-2 px-3 rounded-xl hover:bg-neutral-50 dark:hover:bg-neutral-700/50">
                  <span className="font-medium text-neutral-900 dark:text-white">{i.title}</span>
                  <Badge variant="default">{i.status}</Badge>
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  )
}

function PlusIcon() {
  return <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
}
