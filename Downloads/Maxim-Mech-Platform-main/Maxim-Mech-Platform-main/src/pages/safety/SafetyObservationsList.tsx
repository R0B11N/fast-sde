import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Card, CardHeader, CardDescription } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Badge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'
import { useSafetyObservations } from '@/contexts/SafetyObservationsContext'
import { useUser } from '@/contexts/UserContext'
import type { SafetyObservation } from '@/types'

export function SafetyObservationsList() {
  const { user } = useUser()
  const { observations, addObservation, updateObservation, removeObservation } = useSafetyObservations()
  const [editingId, setEditingId] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [siteName, setSiteName] = useState('')
  const [type, setType] = useState<'positive' | 'corrective'>('positive')
  const [description, setDescription] = useState('')
  const [observedBy, setObservedBy] = useState('')
  const [observedAt, setObservedAt] = useState(() => new Date().toISOString().slice(0, 16))

  const isHr = user?.role === 'owner' || user?.role === 'hr'

  const openCreate = () => {
    setEditingId(null)
    setSiteName('')
    setType('positive')
    setDescription('')
    setObservedBy(user?.name ?? '')
    setObservedAt(new Date().toISOString().slice(0, 16))
    setShowForm(true)
  }

  const openEdit = (o: SafetyObservation) => {
    setEditingId(o.id)
    setSiteName(o.siteName)
    setType(o.type)
    setDescription(o.description)
    setObservedBy(o.observedBy)
    setObservedAt(o.observedAt.slice(0, 16))
    setShowForm(true)
  }

  const closeForm = () => {
    setShowForm(false)
    setEditingId(null)
  }

  const save = () => {
    const at = observedAt ? new Date(observedAt).toISOString() : new Date().toISOString()
    if (editingId) {
      updateObservation(editingId, {
        siteName: siteName.trim(),
        type,
        description: description.trim(),
        observedBy: observedBy.trim(),
        observedAt: at,
      })
    } else {
      addObservation({
        siteName: siteName.trim(),
        type,
        description: description.trim(),
        observedBy: observedBy.trim(),
        observedAt: at,
      })
    }
    closeForm()
  }

  const confirmDelete = (id: string) => {
    removeObservation(id)
    setDeleteId(null)
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <Link to="/safety" className="inline-flex items-center gap-1 text-sm text-brand-600 dark:text-brand-400 hover:underline">← Health & safety</Link>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display font-bold text-display-xl text-neutral-900 dark:text-white tracking-tight">Safety observations</h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-0.5">
            {isHr ? 'Positive and corrective observations. HR can add, edit, and remove entries.' : 'Positive and corrective observations by site.'}
          </p>
        </div>
        {isHr && (
          <Button size="sm" onClick={openCreate}>Add observation</Button>
        )}
      </div>

      {showForm && (
        <Card padding="lg">
          <CardHeader>{editingId ? 'Edit observation' : 'New observation'}</CardHeader>
          <CardDescription>Record a positive or corrective safety observation.</CardDescription>
          <div className="mt-4 space-y-4 max-w-xl">
            <Input label="Site name" value={siteName} onChange={(e) => setSiteName(e.target.value)} placeholder="e.g. North Site" required />
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">Type</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as 'positive' | 'corrective')}
                className="w-full px-4 py-3 rounded-xl border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white"
              >
                <option value="positive">Positive</option>
                <option value="corrective">Corrective</option>
              </select>
            </div>
            <Textarea label="Description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What was observed?" rows={3} required />
            <Input label="Observed by" value={observedBy} onChange={(e) => setObservedBy(e.target.value)} placeholder="Name" required />
            <Input label="Observed at" type="datetime-local" value={observedAt} onChange={(e) => setObservedAt(e.target.value)} />
            <div className="flex gap-2">
              <Button onClick={save} disabled={!siteName.trim() || !description.trim() || !observedBy.trim()}>{editingId ? 'Save changes' : 'Add observation'}</Button>
              <Button variant="ghost" onClick={closeForm}>Cancel</Button>
            </div>
          </div>
        </Card>
      )}

      {observations.length === 0 ? (
        <Card padding="lg">
          <EmptyState
            title="No safety observations"
            description={isHr ? 'Add a positive or corrective observation.' : 'No observations yet.'}
            action={isHr ? <Button size="sm" onClick={openCreate}>Add observation</Button> : undefined}
          />
        </Card>
      ) : (
        <ul className="space-y-3">
          {observations.map((o) => (
            <li key={o.id}>
              <Card padding="md" className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex-1">
                  <p className="font-medium text-neutral-900 dark:text-white">{o.siteName} · {o.type}</p>
                  <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-0.5">{o.description}</p>
                  <p className="text-xs text-neutral-400 mt-1">By {o.observedBy} · {new Date(o.observedAt).toLocaleString()}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={o.type === 'positive' ? 'success' : 'warning'}>{o.type}</Badge>
                  {isHr && (
                    <>
                      <Button type="button" variant="ghost" size="sm" onClick={() => openEdit(o)}>Edit</Button>
                      <Button type="button" variant="ghost" size="sm" className="text-red-600 hover:text-red-700 dark:text-red-400" onClick={() => setDeleteId(o.id)}>Delete</Button>
                    </>
                  )}
                </div>
              </Card>
            </li>
          ))}
        </ul>
      )}

      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" role="dialog" aria-modal="true" onClick={() => setDeleteId(null)}>
          <Card padding="lg" className="max-w-md w-full shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h2 className="font-display font-bold text-xl text-neutral-900 dark:text-white">Delete this observation?</h2>
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
