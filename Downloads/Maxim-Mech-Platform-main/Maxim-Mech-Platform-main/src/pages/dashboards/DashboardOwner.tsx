import { Link } from 'react-router-dom'
import { Card, CardHeader, CardDescription } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { MOCK_INCIDENTS } from '@/data/mock'
import { useFormSubmissions } from '@/contexts/FormSubmissionsContext'

export function DashboardOwner() {
  const { submissions } = useFormSubmissions()
  const pending = submissions.filter((f) => f.status === 'submitted')
  const recentIncidents = MOCK_INCIDENTS.slice(0, 3)

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display font-bold text-display-xl text-neutral-900 dark:text-white tracking-tight">Dashboard</h1>
          <p className="text-neutral-500 dark:text-neutral-400 mt-1">Owner — Job & site focused. You can also use Injury reports, Custom forms, and Scanned forms like HR.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link to="/forms/new/t2"><Button leftIcon={<PlusIcon />}>Report incident / near-miss</Button></Link>
          <Link to="/library"><Button variant="secondary">Forms & documents</Button></Link>
          <Link to="/jobs"><Button variant="secondary">Job management</Button></Link>
          <Link to="/injury-reports"><Button variant="secondary">Injury reports</Button></Link>
          <Link to="/admin/signable-forms"><Button variant="secondary">Custom forms</Button></Link>
          <Link to="/admin/users"><Button variant="secondary">Manage users</Button></Link>
        </div>
      </div>

      {/* Global search */}
      <div className="relative">
        <input
          type="search"
          placeholder="Search documents, submissions, incidents..."
          className="w-full min-h-[48px] pl-4 pr-12 rounded-xl border border-neutral-200 dark:border-neutral-600 bg-white/90 dark:bg-neutral-800/90 text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-brand-400/50 focus:border-brand-400 shadow-soft transition-all"
        />
        <Link to="/search" className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700 text-neutral-500">
          <SearchIcon className="w-5 h-5" />
        </Link>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card hover className="md:col-span-2">
          <CardHeader>Pending submissions</CardHeader>
          <CardDescription>Forms awaiting your review</CardDescription>
          <ul className="mt-4 space-y-2">
            {pending.length === 0 ? (
              <li className="text-sm text-neutral-500">No pending submissions</li>
            ) : (
              pending.map((f) => (
                <li key={f.id}>
                  <Link to={`/forms/${f.id}`} className="flex items-center justify-between py-2 px-3 rounded-xl hover:bg-neutral-50 dark:hover:bg-neutral-700/50 transition-colors">
                    <span className="font-medium text-neutral-900 dark:text-white">{f.templateName}</span>
                    <Badge variant="warning">{f.status}</Badge>
                  </Link>
                </li>
              ))
            )}
          </ul>
          <Link to="/forms?filter=submitted" className="mt-3 inline-block text-sm text-brand-600 dark:text-brand-400 hover:underline">View all</Link>
        </Card>

        <Card className="border-l-4 border-l-brand-500/50 dark:border-l-brand-400/50">
          <CardHeader>Compliance overview</CardHeader>
          <CardDescription>This period</CardDescription>
          <div className="mt-4 space-y-3">
            <div className="flex justify-between text-sm"><span className="text-neutral-500">Inspections completed</span><span className="font-medium">12</span></div>
            <div className="flex justify-between text-sm"><span className="text-neutral-500">Signatures pending</span><span className="font-medium">3</span></div>
            <div className="flex justify-between text-sm"><span className="text-neutral-500">Incidents (open)</span><span className="font-medium">1</span></div>
          </div>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>Recent incidents</CardHeader>
          <CardDescription>Latest reported incidents</CardDescription>
          <ul className="mt-4 space-y-2">
            {recentIncidents.map((i) => (
              <li key={i.id}>
                <Link to={`/search/incident/${i.id}`} className="flex items-center justify-between py-2 px-3 rounded-xl hover:bg-neutral-50 dark:hover:bg-neutral-700/50 transition-colors">
                  <span className="font-medium text-neutral-900 dark:text-white">{i.title}</span>
                  <Badge variant={i.severity === 'high' ? 'danger' : i.severity === 'medium' ? 'warning' : 'default'}>{i.status}</Badge>
                </Link>
              </li>
            ))}
          </ul>
          <Link to="/search?type=incidents" className="mt-3 inline-block text-sm text-brand-600 dark:text-brand-400 hover:underline">View all</Link>
        </Card>
      </div>
    </div>
  )
}

function PlusIcon() {
  return <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
}
function SearchIcon({ className }: { className?: string }) {
  return <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
}
