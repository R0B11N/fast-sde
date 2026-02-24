import { Link } from 'react-router-dom'
import { useUser } from '@/contexts/UserContext'
import { Card, CardHeader, CardDescription } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { MOCK_SIGNATURE_REQUESTS, MOCK_SUPERVISOR_BY_LABOURER, MOCK_ASSIGNED_JOBS_LABOURER } from '@/data/mock'

export function DashboardLabourer() {
  const { user } = useUser()
  const needSignature = MOCK_SIGNATURE_REQUESTS.filter((sr) => sr.requiredSigners.some((s) => s.status === 'pending'))
  const supervisorName = (user?.name && MOCK_SUPERVISOR_BY_LABOURER[user.name]) || 'Your supervisor'

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display font-bold text-display-xl text-neutral-900 dark:text-white tracking-tight">Today</h1>
          <p className="text-neutral-500 dark:text-neutral-400 mt-1">Your assignments, documents & safety</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link to="/forms/new/t2"><Button size="sm">Report incident</Button></Link>
          <Link to="/forms/new/t4"><Button size="sm" variant="secondary">Report near-miss</Button></Link>
          <Link to="/forms/new/t5"><Button size="sm" variant="secondary">Report hazard</Button></Link>
        </div>
      </div>

      <Card>
        <CardHeader>Your supervisor</CardHeader>
        <CardDescription>Contact for assignments and safety questions</CardDescription>
        <p className="mt-3 text-lg font-medium text-neutral-900 dark:text-white">{supervisorName}</p>
      </Card>

      <Card>
        <CardHeader>Jobs assigned to you</CardHeader>
        <CardDescription>Your current assignments</CardDescription>
        <ul className="mt-4 space-y-2">
          {MOCK_ASSIGNED_JOBS_LABOURER.map((job) => (
            <li key={job.id} className="flex items-center justify-between py-2 px-3 rounded-xl bg-neutral-50 dark:bg-neutral-700/50">
              <div>
                <p className="font-medium text-neutral-900 dark:text-white">{job.title}</p>
                <p className="text-sm text-neutral-500 dark:text-neutral-400">{job.site} · Due {job.due}</p>
              </div>
            </li>
          ))}
        </ul>
      </Card>

      <Card>
        <CardHeader>Documents requiring your signature</CardHeader>
        <CardDescription>Review the documentation and sign to acknowledge you received and understand the contents. If you have any questions, please contact HR</CardDescription>
        <ul className="mt-4 space-y-2">
          {needSignature.length === 0 ? (
            <li className="text-sm text-neutral-500">Nothing pending</li>
          ) : (
            needSignature.map((sr) => (
              <li key={sr.id}>
                <Link to={`/signing/${sr.id}/sign`} className="flex items-center justify-between py-3 px-4 rounded-xl bg-brand-50 dark:bg-brand-950/40 border border-brand-200 dark:border-brand-800 hover:bg-brand-100 dark:hover:bg-brand-900/40 transition-colors">
                  <span className="font-medium text-neutral-900 dark:text-white">{sr.documentName}</span>
                  <Button size="sm">Sign</Button>
                </Link>
              </li>
            ))
          )}
        </ul>
      </Card>

      <Card>
        <CardHeader>Recently acknowledged</CardHeader>
        <CardDescription>Policies you've signed</CardDescription>
        <ul className="mt-4 space-y-2">
          <li className="py-2 px-3 rounded-xl text-sm text-neutral-600 dark:text-neutral-400">Site Safety Briefing — Feb 8, 2025</li>
          <li className="py-2 px-3 rounded-xl text-sm text-neutral-600 dark:text-neutral-400">PPE Policy — Jan 15, 2025</li>
        </ul>
      </Card>

      <Card>
        <CardHeader>Safety announcements</CardHeader>
        <CardDescription>Latest from site</CardDescription>
        <div className="mt-4 p-4 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
          <p className="text-sm font-medium text-amber-900 dark:text-amber-200">Winter conditions — extra caution on scaffolding</p>
          <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">Posted Feb 9, 2025</p>
        </div>
      </Card>
    </div>
  )
}
