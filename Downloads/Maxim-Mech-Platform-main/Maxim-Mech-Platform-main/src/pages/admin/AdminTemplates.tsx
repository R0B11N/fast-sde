import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Card, CardHeader, CardDescription } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { MOCK_FORM_TEMPLATES } from '@/data/mock'

const MOCK_TEMPLATES = Object.values(MOCK_FORM_TEMPLATES).map((t) => ({
  id: t.id,
  name: t.name,
  version: t.version,
  archived: t.archived,
  lastModified: '2025-02-01',
  category: t.category,
  regulatoryRef: (t as { regulatoryRef?: string }).regulatoryRef,
}))

export function AdminTemplates() {
  const [templates, setTemplates] = useState(MOCK_TEMPLATES)
  const [showCreate, setShowCreate] = useState(false)

  const archive = (id: string) => {
    setTemplates((prev) => prev.map((t) => (t.id === id ? { ...t, archived: true } : t)))
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display font-bold text-2xl text-neutral-900 dark:text-white">Form template management</h1>
          <p className="text-neutral-500 dark:text-neutral-400 mt-0.5">HR creates custom forms with text fields for incident reports, near-miss, hazards, site inspections, and more. Workers fill them out and submit; you review in Forms & documents and in each safety list.</p>
        </div>
        <div className="flex gap-2">
          <Link to="/admin/users" className="text-sm text-neutral-600 dark:text-neutral-400 hover:underline">Users</Link>
          <Link to="/admin/signable-forms" className="text-sm text-neutral-600 dark:text-neutral-400 hover:underline">Custom forms to sign</Link>
          <Link to="/admin/notifications" className="text-sm text-neutral-600 dark:text-neutral-400 hover:underline">Notifications</Link>
          <Button onClick={() => setShowCreate(true)}>Create template</Button>
        </div>
      </div>

      {showCreate && (
        <Card padding="lg">
          <CardHeader>Create or edit template</CardHeader>
          <CardDescription>Add a template with sections and text fields (e.g. Description, Location). Use it for incident reports, near-miss, hazards, or other custom forms.</CardDescription>
          <div className="mt-4 space-y-4">
            <input placeholder="Template name" className="w-full min-h-[44px] px-4 rounded-xl border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white" />
            <p className="text-sm text-neutral-500">Add sections and fields in the full editor.</p>
            <Button variant="ghost" onClick={() => setShowCreate(false)}>Cancel</Button>
          </div>
        </Card>
      )}

      <ul className="space-y-3">
        {templates.map((t) => (
          <li key={t.id}>
            <Card padding="md" className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <p className="font-medium text-neutral-900 dark:text-white">{t.name}</p>
                <p className="text-sm text-neutral-500 dark:text-neutral-400">
                  Version {t.version} · Modified {t.lastModified}
                  {t.category && t.category !== 'other' && <span className="ml-1">· {t.category.replace('_', '-')}</span>}
                  {t.regulatoryRef && <span className="ml-1">· Ref: {t.regulatoryRef}</span>}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={t.archived ? 'default' : 'success'}>{t.archived ? 'Archived' : 'Active'}</Badge>
                {!t.archived && <Button size="sm" variant="secondary" onClick={() => archive(t.id)}>Archive</Button>}
                <Button size="sm" variant="ghost">Edit</Button>
              </div>
            </Card>
          </li>
        ))}
      </ul>
    </div>
  )
}
