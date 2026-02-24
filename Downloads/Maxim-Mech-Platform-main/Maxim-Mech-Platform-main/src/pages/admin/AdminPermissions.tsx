import { Card, CardHeader, CardDescription } from '@/components/ui/Card'
import type { UserRole } from '@/types'

const ROLES: UserRole[] = ['owner', 'hr', 'supervisor', 'labourer']

const FEATURES = [
  { name: 'Job management', owner: true, hr: true, supervisor: false, labourer: false },
  { name: 'Todo & calendar', owner: true, hr: true, supervisor: false, labourer: false },
  { name: 'Injury reports (full)', owner: true, hr: true, supervisor: false, labourer: false },
  { name: 'Injury analytics', owner: true, hr: true, supervisor: false, labourer: false },
  { name: 'Subcontractors', owner: true, hr: true, supervisor: false, labourer: false },
  { name: 'Admin (users, notifications, docs)', owner: true, hr: true, supervisor: false, labourer: false },
  { name: 'My jobs', owner: false, hr: false, supervisor: true, labourer: false },
  { name: 'Daily forms (sign/complete)', owner: false, hr: false, supervisor: true, labourer: true },
  { name: 'Check-in / check-out', owner: false, hr: false, supervisor: true, labourer: false },
  { name: 'Form review / approve', owner: false, hr: false, supervisor: true, labourer: false },
  { name: 'Report incident / near-miss / hazard', owner: true, hr: true, supervisor: true, labourer: true },
  { name: 'Library (templates, submissions, signing)', owner: true, hr: true, supervisor: true, labourer: true },
  { name: 'Documents (by visibility)', owner: true, hr: true, supervisor: true, labourer: true },
  { name: 'Certificates (view)', owner: true, hr: true, supervisor: false, labourer: false },
  { name: 'Audit log', owner: true, hr: true, supervisor: false, labourer: false },
]

export function AdminPermissions() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="font-display font-bold text-display-xl text-neutral-900 dark:text-white tracking-tight">Role permissions</h1>
        <p className="text-neutral-500 dark:text-neutral-400 mt-1">What each role can access (reference)</p>
      </div>
      <Card padding="md">
        <CardHeader className="text-base">Feature access by role</CardHeader>
        <CardDescription>✓ = can access. This is a static reference; actual enforcement is role-based in the app.</CardDescription>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b border-neutral-200 dark:border-neutral-600">
                <th className="text-left py-2 px-3 font-medium text-neutral-700 dark:text-neutral-300">Feature</th>
                {ROLES.map((r) => (
                  <th key={r} className="text-center py-2 px-3 font-medium text-neutral-700 dark:text-neutral-300 capitalize">{r}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {FEATURES.map((f, i) => (
                <tr key={i} className="border-b border-neutral-100 dark:border-neutral-700/50">
                  <td className="py-2 px-3 text-neutral-900 dark:text-white">{f.name}</td>
                  {ROLES.map((r) => (
                    <td key={r} className="text-center py-2 px-3">
                      {f[r] ? <span className="text-green-600 dark:text-green-400">✓</span> : '—'}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
