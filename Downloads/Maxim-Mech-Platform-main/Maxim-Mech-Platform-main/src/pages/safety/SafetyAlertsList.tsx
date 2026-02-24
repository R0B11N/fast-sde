import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Card, CardHeader, CardDescription } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { EmptyState } from '@/components/ui/EmptyState'
import { useSafetyAlerts } from '@/contexts/SafetyAlertsContext'
import { useUser } from '@/contexts/UserContext'
import type { SafetyAlert } from '@/types'

export function SafetyAlertsList() {
  const { user } = useUser()
  const { alerts, addAlert, updateAlert, removeAlert } = useSafetyAlerts()
  const [editingId, setEditingId] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [siteNamesText, setSiteNamesText] = useState('')
  const [expiresAt, setExpiresAt] = useState('')

  const isHr = user?.role === 'owner' || user?.role === 'hr'

  const openCreate = () => {
    setEditingId(null)
    setTitle('')
    setBody('')
    setSiteNamesText('')
    setExpiresAt('')
    setShowForm(true)
  }

  const openEdit = (a: SafetyAlert) => {
    setEditingId(a.id)
    setTitle(a.title)
    setBody(a.body)
    setSiteNamesText(a.siteNames?.join(', ') ?? '')
    setExpiresAt(a.expiresAt ? a.expiresAt.slice(0, 10) : '')
    setShowForm(true)
  }

  const closeForm = () => {
    setShowForm(false)
    setEditingId(null)
  }

  const save = () => {
    const sites = siteNamesText.trim() ? siteNamesText.split(',').map((s) => s.trim()).filter(Boolean) : undefined
    if (editingId) {
      updateAlert(editingId, {
        title: title.trim(),
        body: body.trim(),
        siteNames: sites,
        expiresAt: expiresAt.trim() || undefined,
      })
    } else {
      addAlert({
        title: title.trim(),
        body: body.trim(),
        siteNames: sites,
        publishedAt: new Date().toISOString(),
        expiresAt: expiresAt.trim() || undefined,
      })
    }
    closeForm()
  }

  const confirmDelete = (id: string) => {
    removeAlert(id)
    setDeleteId(null)
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <Link to="/safety" className="inline-flex items-center gap-1 text-sm text-brand-600 dark:text-brand-400 hover:underline">← Health & safety</Link>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display font-bold text-display-xl text-neutral-900 dark:text-white tracking-tight">Safety alerts & bulletins</h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-0.5">
            {isHr ? 'HR posts alerts for sites and roles. Create, edit, or delete below.' : 'Site and role-based alerts. Acknowledge when required.'}
          </p>
        </div>
        {isHr && (
          <Button size="sm" onClick={openCreate}>Create alert</Button>
        )}
      </div>

      {showForm && (
        <Card padding="lg">
          <CardHeader>{editingId ? 'Edit alert' : 'New alert'}</CardHeader>
          <CardDescription>Post a safety bulletin. Optionally limit by sites and set an expiry date.</CardDescription>
          <div className="mt-4 space-y-4 max-w-xl">
            <Input label="Title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Ice on north lot" required />
            <Textarea label="Message" value={body} onChange={(e) => setBody(e.target.value)} placeholder="Alert text..." rows={4} />
            <Input label="Sites (comma-separated, optional)" value={siteNamesText} onChange={(e) => setSiteNamesText(e.target.value)} placeholder="e.g. North Site, West Site" />
            <Input label="Expires (optional)" type="date" value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)} />
            <div className="flex gap-2">
              <Button onClick={save} disabled={!title.trim() || !body.trim()}>{editingId ? 'Save changes' : 'Publish alert'}</Button>
              <Button variant="ghost" onClick={closeForm}>Cancel</Button>
            </div>
          </div>
        </Card>
      )}

      {alerts.length === 0 ? (
        <Card padding="lg">
          <EmptyState
            title="No safety alerts"
            description={isHr ? 'Create an alert to post to sites. Alerts can have an expiry date.' : 'No active alerts.'}
            action={isHr ? <Button size="sm" onClick={openCreate}>Create alert</Button> : undefined}
          />
        </Card>
      ) : (
        <ul className="space-y-3">
          {alerts.map((a) => (
            <li key={a.id}>
              <Card padding="md" className="border-l-4 border-amber-500">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <p className="font-medium text-neutral-900 dark:text-white">{a.title}</p>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-neutral-500">{new Date(a.publishedAt).toLocaleString()}{a.expiresAt ? ` · Expires ${new Date(a.expiresAt).toLocaleDateString()}` : ''}</span>
                    {isHr && (
                      <>
                        <Button type="button" variant="ghost" size="sm" onClick={() => openEdit(a)} aria-label="Edit alert">Edit</Button>
                        <Button type="button" variant="ghost" size="sm" className="text-red-600 hover:text-red-700 dark:text-red-400" onClick={() => setDeleteId(a.id)} aria-label="Delete alert">Delete</Button>
                      </>
                    )}
                  </div>
                </div>
                <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-2">{a.body}</p>
                {a.siteNames?.length ? <p className="text-xs text-neutral-500 mt-2">Sites: {a.siteNames.join(', ')}</p> : null}
              </Card>
            </li>
          ))}
        </ul>
      )}

      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" role="dialog" aria-modal="true" onClick={() => setDeleteId(null)}>
          <Card padding="lg" className="max-w-md w-full shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h2 className="font-display font-bold text-xl text-neutral-900 dark:text-white">Delete this alert?</h2>
            <p className="mt-2 text-neutral-600 dark:text-neutral-400">This cannot be undone.</p>
            <div className="mt-6 flex gap-3 justify-end">
              <Button variant="ghost" onClick={() => setDeleteId(null)}>Cancel</Button>
              <Button variant="danger" onClick={() => confirmDelete(deleteId)}>Delete</Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
