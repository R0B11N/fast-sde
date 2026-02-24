import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Card, CardHeader, CardDescription } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Checkbox } from '@/components/ui/Checkbox'
import type { UserRole } from '@/types'

const ROLE_OPTIONS: { role: UserRole; label: string; toggles: { key: string; label: string }[] }[] = [
  { role: 'owner', label: 'Owner / HR', toggles: [{ key: 'forms_pending', label: 'Form submissions pending review' }, { key: 'incidents', label: 'New incident reports' }, { key: 'digest', label: 'Daily digest' }] },
  { role: 'supervisor', label: 'Supervisor', toggles: [{ key: 'signatures', label: 'Signature reminders' }, { key: 'incidents_site', label: 'Incidents at my sites' }] },
  { role: 'labourer', label: 'Labourer', toggles: [{ key: 'signature_required', label: 'Documents requiring signature' }, { key: 'announcements', label: 'Safety announcements' }] },
]

export function AdminNotifications() {
  const [settings, setSettings] = useState<Record<string, boolean>>({
    forms_pending: true,
    incidents: true,
    digest: false,
    signatures: true,
    incidents_site: true,
    signature_required: true,
    announcements: true,
  })

  const toggle = (key: string) => setSettings((s) => ({ ...s, [key]: !s[key] }))

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display font-bold text-2xl text-neutral-900 dark:text-white">Notification settings</h1>
          <p className="text-neutral-500 dark:text-neutral-400 mt-0.5">Role-based email toggles (HR configures defaults)</p>
        </div>
        <div className="flex gap-2">
          <Link to="/admin/users" className="text-sm text-neutral-600 dark:text-neutral-400 hover:underline">Users</Link>
          <Link to="/admin/templates" className="text-sm text-neutral-600 dark:text-neutral-400 hover:underline">Templates</Link>
          <Link to="/admin/signable-forms" className="text-sm text-neutral-600 dark:text-neutral-400 hover:underline">Custom forms to sign</Link>
        </div>
      </div>

      <Card padding="lg">
        <CardHeader>Email notifications by role</CardHeader>
        <CardDescription>Enable or disable email types per role. Users can override in their profile (mock).</CardDescription>
        <div className="mt-6 space-y-6">
          {ROLE_OPTIONS.map(({ role, label, toggles }) => (
            <div key={role}>
              <h3 className="font-medium text-neutral-900 dark:text-white mb-3">{label}</h3>
              <ul className="space-y-2">
                {toggles.map((t) => (
                  <li key={t.key}>
                    <Checkbox label={t.label} checked={settings[t.key]} onChange={() => toggle(t.key)} />
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <Button className="mt-4">Save settings</Button>
      </Card>
    </div>
  )
}
