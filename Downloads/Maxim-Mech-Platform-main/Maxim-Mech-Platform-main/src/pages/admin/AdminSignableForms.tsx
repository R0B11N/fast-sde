import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Card, CardHeader, CardDescription } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Badge } from '@/components/ui/Badge'
import { MOCK_APP_USERS } from '@/data/mock'
import { useSignableTemplates } from '@/contexts/SignableTemplatesContext'
import type { UserRole } from '@/types'

const ROLE_OPTIONS: { value: UserRole; label: string }[] = [
  { value: 'owner', label: 'Owners' },
  { value: 'hr', label: 'HR' },
  { value: 'supervisor', label: 'Supervisors' },
  { value: 'labourer', label: 'Labourers' },
]

export function AdminSignableForms() {
  const { templates, addTemplate, updateTemplate } = useSignableTemplates()
  const [showAdd, setShowAdd] = useState(false)
  const [newName, setNewName] = useState('')
  const [newDescription, setNewDescription] = useState('')
  const [newAssignRoles, setNewAssignRoles] = useState<UserRole[]>(['supervisor'])
  const [newAssignUserIds, setNewAssignUserIds] = useState<string[]>([])
  const [newSchedule, setNewSchedule] = useState<'daily' | 'weekly' | 'monthly' | 'once'>('daily')

  const toggleRole = (role: UserRole) => {
    setNewAssignRoles((prev) => (prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]))
  }

  const toggleUser = (userId: string) => {
    setNewAssignUserIds((prev) => (prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]))
  }

  const addForm = () => {
    if (!newName.trim()) return
    if (newAssignRoles.length === 0 && newAssignUserIds.length === 0) {
      alert('Assign to at least one role or specific person.')
      return
    }
    addTemplate({
      id: `sf-${Date.now()}`,
      name: newName.trim(),
      description: newDescription.trim(),
      assignedToRoles: newAssignRoles,
      assignedToUserIds: newAssignUserIds.length > 0 ? newAssignUserIds : undefined,
      schedule: newSchedule,
      createdAt: new Date().toISOString().slice(0, 10),
      createdBy: 'Alex Chen',
      active: true,
    })
    setNewName('')
    setNewDescription('')
    setNewAssignRoles(['supervisor'])
    setNewAssignUserIds([])
    setNewSchedule('daily')
    setShowAdd(false)
  }

  const setActive = (id: string, active: boolean) => {
    updateTemplate(id, { active })
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display font-bold text-2xl text-neutral-900 dark:text-white">Custom forms to sign</h1>
          <p className="text-neutral-500 dark:text-neutral-400 mt-0.5">Add and manage forms that supervisors (or others) must fill out and sign on a schedule</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Link to="/admin/users" className="text-sm text-neutral-600 dark:text-neutral-400 hover:underline">Users</Link>
          <Link to="/admin/templates" className="text-sm text-neutral-600 dark:text-neutral-400 hover:underline">Templates</Link>
          <Link to="/library?view=templates" className="text-sm text-neutral-600 dark:text-neutral-400 hover:underline">Forms & documents</Link>
          <Link to="/admin/notifications" className="text-sm text-neutral-600 dark:text-neutral-400 hover:underline">Notifications</Link>
          <Button onClick={() => setShowAdd(true)}>Add new form to sign</Button>
        </div>
      </div>

      {showAdd && (
        <Card padding="lg">
          <CardHeader>Add new custom form to sign</CardHeader>
          <CardDescription>Assign by role and/or to specific people. Everyone assigned will see the form in Daily forms.</CardDescription>
          <div className="mt-4 space-y-4 max-w-xl">
            <Input label="Form name" value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="e.g. Daily Safety Checklist" />
            <Textarea label="Description (optional)" value={newDescription} onChange={(e) => setNewDescription(e.target.value)} placeholder="What this form is for" rows={2} />
            <div>
              <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">Assign by role</p>
              <div className="flex flex-wrap gap-2">
                {ROLE_OPTIONS.map((r) => (
                  <label key={r.value} className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={newAssignRoles.includes(r.value)} onChange={() => toggleRole(r.value)} className="rounded border-neutral-300 text-brand-600" />
                    <span className="text-sm">{r.label}</span>
                  </label>
                ))}
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">Or assign to specific people</p>
              <div className="flex flex-wrap gap-2">
                {MOCK_APP_USERS.map((u) => (
                  <label key={u.id} className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={newAssignUserIds.includes(u.id)} onChange={() => toggleUser(u.id)} className="rounded border-neutral-300 text-brand-600" />
                    <span className="text-sm">{u.name} ({u.role})</span>
                  </label>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">Schedule</label>
              <select value={newSchedule} onChange={(e) => setNewSchedule(e.target.value as 'daily' | 'weekly' | 'monthly' | 'once')} className="w-full min-h-[44px] px-4 rounded-xl border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white" aria-label="Schedule">
                <option value="daily">Daily (every day)</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="once">Once (one-time sign)</option>
              </select>
            </div>
            <div className="flex gap-2">
              <Button onClick={addForm}>Add form</Button>
              <Button variant="ghost" onClick={() => setShowAdd(false)}>Cancel</Button>
            </div>
          </div>
        </Card>
      )}

      <Card padding="none">
        <ul className="divide-y divide-neutral-200 dark:divide-neutral-700">
          {templates.map((t) => (
            <li key={t.id} className="p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <p className="font-medium text-neutral-900 dark:text-white">{t.name}</p>
                <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-0.5">{t.description}</p>
                <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-1">
                  Assigned to: {t.assignedToRoles.length > 0 ? t.assignedToRoles.join(', ') : '—'}
                  {t.assignedToUserIds?.length ? ` + ${t.assignedToUserIds.length} person(s)` : ''} · {t.schedule} · Created {t.createdAt}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Badge variant={t.active ? 'success' : 'default'}>{t.active ? 'Active' : 'Inactive'}</Badge>
                <Button size="sm" variant="secondary" onClick={() => setActive(t.id, !t.active)}>{t.active ? 'Deactivate' : 'Activate'}</Button>
              </div>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  )
}
