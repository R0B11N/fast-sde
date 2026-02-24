import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Card, CardHeader, CardDescription } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { useUser } from '@/contexts/UserContext'
import { usePinnedSafety } from '@/contexts/PinnedSafetyContext'
import { QuickCaptureModal } from '@/components/safety/QuickCaptureModal'
import type { UserRole } from '@/types'

const ACTIONS: { to: string; label: string; description: string; icon: string; cta?: string; roles?: UserRole[] }[] = [
  { to: '/safety/incidents', label: 'Incident reports', description: 'Fill out the incident report template (custom form by HR); submit and track below.', icon: '⚠', cta: 'View' },
  { to: '/forms/new/t3', label: 'Site Safety Meeting', description: 'H&S rep fills form → meeting with site → all sign off → then sent to HR', icon: '📋', cta: 'Start', roles: ['owner', 'hr', 'supervisor'] },
  { to: '/safety/hazards', label: 'Hazard register', description: 'Custom form by HR with risk scoring (likelihood × impact).', icon: '⚠', roles: ['owner', 'hr', 'supervisor'] },
  { to: '/safety/near-miss', label: 'Near-miss reports', description: 'Custom form by HR — submit and track near-miss reports', icon: '📋', roles: ['owner', 'hr', 'supervisor'] },
  { to: '/safety/observations', label: 'Safety observations', description: 'Positive and corrective observations', icon: '👁', roles: ['owner', 'hr', 'supervisor'] },
  { to: '/safety/inspections', label: 'Scheduled inspections', description: 'Predefined checklists; complete on schedule and view results.', icon: '📋', roles: ['owner', 'hr', 'supervisor'] },
  { to: '/certificates', label: 'Training & certifications', description: 'Certificates with expiry — HR uploads and manages; expiry reminders to HR', icon: '📜', roles: ['owner', 'hr'] },
  { to: '/safety/corrective-actions', label: 'Corrective & preventive actions (CAPA)', description: 'Track corrective and preventive actions from incidents and hazards.', icon: '✅', roles: ['owner', 'hr'] },
  { to: '/safety/alerts', label: 'Safety alerts & bulletins', description: 'HR posts and manages site and role-based alerts', icon: '📢', roles: ['owner', 'hr', 'supervisor', 'labourer'] },
  { to: '/safety/compliance-calendar', label: 'Compliance calendar', description: 'Certificate expirations, inspection due dates, report deadlines.', icon: '📅', roles: ['owner', 'hr'] },
  { to: '/safety/sites', label: 'Sites', description: 'Site overview: active job, personnel on site, hazards, incidents, injuries.', icon: '📍', roles: ['owner', 'hr', 'supervisor'] },
  { to: '/safety/regulations', label: 'Regulatory reference', description: 'OSHA / provincial OHS and WSIB reference for HR and legal.', icon: '📖', roles: ['owner', 'hr'] },
  { to: '/safety/analytics', label: 'Safety analytics', description: 'Incident trends, CAPA status, and injury report metrics.', icon: '📊', roles: ['owner', 'hr'] },
  { to: '/safety/qr-scan', label: 'Scan site QR', description: 'Point camera at site QR for pre-start checklist (mock).', icon: '📱', roles: ['owner', 'hr', 'supervisor', 'labourer'] },
]

export function SafetyHub() {
  const { user } = useUser()
  const { isPinned, togglePinned } = usePinnedSafety()
  const [quickCaptureOpen, setQuickCaptureOpen] = useState(false)
  const visibleActions = ACTIONS.filter((a) => !a.roles || (user && a.roles.includes(user.role)))
  const canPin = user?.role === 'owner' || user?.role === 'hr'

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display font-bold text-display-xl text-neutral-900 dark:text-white tracking-tight">Health & safety</h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-0.5">Incident reports, near-miss, and hazards are custom forms with text fields created by HR as templates. Fill them out and submit; track and review in the lists below. All H&S actions are tracked.</p>
        </div>
        <Button size="sm" variant="secondary" onClick={() => setQuickCaptureOpen(true)}>Quick report</Button>
      </div>
      {quickCaptureOpen && <QuickCaptureModal onClose={() => setQuickCaptureOpen(false)} />}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {visibleActions.map((action) => (
          <Card key={action.to} hover padding="lg" className="h-full flex flex-col relative">
            {canPin && (
              <button
                type="button"
                onClick={(e) => { e.preventDefault(); togglePinned(action.to, action.label) }}
                className="absolute top-3 right-3 p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700 text-neutral-500 dark:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
                aria-label={isPinned(action.to) ? 'Unpin from sidebar' : 'Pin to sidebar'}
                title={isPinned(action.to) ? 'Unpin from sidebar' : 'Pin to sidebar'}
              >
                {isPinned(action.to) ? (
                  <svg className="w-5 h-5 text-brand-600 dark:text-brand-400" fill="currentColor" viewBox="0 0 24 24" aria-hidden><path d="M16 12V4h1V2H7v2h1v8l-2 2v2h5.2v6h1.6v-6H18v-2l-2-2z" /></svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" /></svg>
                )}
              </button>
            )}
            <Link to={action.to} className="flex flex-col flex-1 min-w-0">
              <span className="text-2xl mb-2 block">{action.icon}</span>
              <CardHeader className="p-0 pr-8">{action.label}</CardHeader>
              <CardDescription className="mt-1 flex-1">{action.description}</CardDescription>
              <Button variant="outline" size="sm" className="mt-3 w-fit">{action.cta ?? 'View'}</Button>
            </Link>
          </Card>
        ))}
      </div>

      <Card padding="md" className="bg-amber-50/50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-800">
        <p className="text-sm text-amber-800 dark:text-amber-200">
          <strong>Compliance:</strong> Every form and report has an audit trail. Draft, submitted, approved, rejected, and archived states are clearly indicated. HR has final authority for approval and archival.
        </p>
      </Card>
    </div>
  )
}
