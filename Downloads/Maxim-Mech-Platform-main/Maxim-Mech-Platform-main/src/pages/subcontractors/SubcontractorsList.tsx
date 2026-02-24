import { Link } from 'react-router-dom'
import { useUser } from '@/contexts/UserContext'
import { useSubcontractors } from '@/contexts/SubcontractorsContext'
import { Card, CardHeader, CardDescription } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'

const EXPIRING_DAYS = 30

export function SubcontractorsList() {
  const { user } = useUser()
  const { subcontractors, certifications } = useSubcontractors()
  const isOwnerOrHr = user?.role === 'owner' || user?.role === 'hr'

  if (!isOwnerOrHr) return null

  const now = new Date()
  const in30 = new Date(now.getTime() + EXPIRING_DAYS * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
  const today = now.toISOString().slice(0, 10)
  const certsExpiringSoon = certifications.filter(
    (c) => c.expiresAt >= today && c.expiresAt <= in30 && c.status !== 'expired'
  ).length

  const total = subcontractors.length
  const active = subcontractors.filter((s) => s.status === 'active').length

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="font-display font-bold text-display-xl text-neutral-900 dark:text-white tracking-tight">
          Subcontractors
        </h1>
        <p className="text-neutral-500 dark:text-neutral-400 mt-1">
          Track subcontractor companies, contacts, certifications, and expiration dates.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card padding="md">
          <p className="text-2xl font-bold text-neutral-900 dark:text-white">{total}</p>
          <p className="text-sm text-neutral-500 dark:text-neutral-400">Total subcontractors</p>
        </Card>
        <Card padding="md">
          <p className="text-2xl font-bold text-neutral-900 dark:text-white">{active}</p>
          <p className="text-sm text-neutral-500 dark:text-neutral-400">Active</p>
        </Card>
        <Card padding="md">
          <p className="text-2xl font-bold text-neutral-900 dark:text-white">{certsExpiringSoon}</p>
          <p className="text-sm text-neutral-500 dark:text-neutral-400">Certs expiring (30 days)</p>
        </Card>
      </div>

      <Card padding="lg">
        <CardHeader>Who they are</CardHeader>
        <CardDescription>Company, primary contact, status, and certification summary.</CardDescription>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-600">
                <th className="py-2 pr-4 font-medium text-neutral-600 dark:text-neutral-400">Company</th>
                <th className="py-2 pr-4 font-medium text-neutral-600 dark:text-neutral-400">Contact</th>
                <th className="py-2 pr-4 font-medium text-neutral-600 dark:text-neutral-400">Status</th>
                <th className="py-2 pr-4 font-medium text-neutral-600 dark:text-neutral-400">Certifications</th>
                <th className="py-2 pr-4 font-medium text-neutral-600 dark:text-neutral-400"></th>
              </tr>
            </thead>
            <tbody>
              {subcontractors.map((s) => {
                const certs = certifications.filter((c) => c.subcontractorId === s.id)
                const expiring = certs.filter((c) => c.status === 'expiring-soon').length
                const expired = certs.filter((c) => c.status === 'expired').length
                return (
                  <tr key={s.id} className="border-b border-slate-100 dark:border-slate-700/50">
                    <td className="py-3 pr-4">
                      <span className="font-medium text-neutral-900 dark:text-white">{s.companyName}</span>
                    </td>
                    <td className="py-3 pr-4 text-neutral-700 dark:text-neutral-300">
                      {s.primaryContactName}
                      {s.primaryContactEmail && (
                        <span className="block text-xs text-neutral-500">{s.primaryContactEmail}</span>
                      )}
                    </td>
                    <td className="py-3 pr-4">
                      <Badge variant={s.status === 'active' ? 'success' : 'default'}>
                        {s.status}
                      </Badge>
                    </td>
                    <td className="py-3 pr-4 text-sm text-neutral-600 dark:text-neutral-400">
                      {certs.length} cert{certs.length !== 1 ? 's' : ''}
                      {expiring > 0 && (
                        <span className="ml-1 text-amber-600 dark:text-amber-400">
                          ({expiring} expiring soon)
                        </span>
                      )}
                      {expired > 0 && expiring === 0 && (
                        <span className="ml-1 text-red-600 dark:text-red-400">({expired} expired)</span>
                      )}
                    </td>
                    <td className="py-3 pr-4">
                      <Link
                        to={`/subcontractors/${s.id}`}
                        className="text-brand-600 dark:text-brand-400 hover:underline text-sm font-medium"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
