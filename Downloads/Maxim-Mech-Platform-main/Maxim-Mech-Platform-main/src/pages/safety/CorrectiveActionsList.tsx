import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Card, CardHeader, CardDescription } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Badge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'
import { useCorrectiveActions } from '@/contexts/CorrectiveActionsContext'
import { useUser } from '@/contexts/UserContext'
import { MOCK_APP_USERS } from '@/data/mock'
import { downloadCsv } from '@/utils/exportCsv'
import type { CorrectiveAction } from '@/types'

const SOURCE_TYPES: CorrectiveAction['sourceType'][] = ['injury', 'incident', 'near-miss', 'hazard']
const STATUSES: CorrectiveAction['status'][] = ['open', 'in-progress', 'completed']
const ACTION_TYPES: CorrectiveAction['actionType'][] = ['corrective', 'preventive']

export function CorrectiveActionsList() {
  const { user } = useUser()
  const { actions, addAction, updateAction, removeAction } = useCorrectiveActions()
  const [editingId, setEditingId] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [actionType, setActionType] = useState<CorrectiveAction['actionType']>('corrective')
  const [sourceType, setSourceType] = useState<CorrectiveAction['sourceType']>('incident')
  const [sourceId, setSourceId] = useState('')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [assignedTo, setAssignedTo] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [status, setStatus] = useState<CorrectiveAction['status']>('open')
  const [filterType, setFilterType] = useState<'all' | 'corrective' | 'preventive'>('all')

  const isHr = user?.role === 'owner' || user?.role === 'hr'
  const filteredActions = filterType === 'all' ? actions : actions.filter((a) => a.actionType === filterType)

  const openCreate = () => {
    setEditingId(null)
    setActionType('corrective')
    setSourceType('incident')
    setSourceId('')
    setTitle('')
    setDescription('')
    setAssignedTo('')
    setDueDate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10))
    setStatus('open')
    setShowForm(true)
  }

  const openEdit = (c: CorrectiveAction) => {
    setEditingId(c.id)
    setActionType(c.actionType)
    setSourceType(c.sourceType)
    setSourceId(c.sourceId)
    setTitle(c.title)
    setDescription(c.description)
    setAssignedTo(c.assignedTo)
    setDueDate(c.dueDate)
    setStatus(c.status)
    setShowForm(true)
  }

  const closeForm = () => {
    setShowForm(false)
    setEditingId(null)
  }

  const save = () => {
    if (editingId) {
      updateAction(editingId, {
        actionType,
        sourceType,
        sourceId: sourceId.trim(),
        title: title.trim(),
        description: description.trim(),
        assignedTo: assignedTo.trim(),
        dueDate: dueDate.trim(),
        status,
        ...(status === 'completed' ? { completedAt: new Date().toISOString() } : {}),
      })
    } else {
      addAction({
        actionType,
        sourceType,
        sourceId: sourceId.trim() || `ref-${Date.now()}`,
        title: title.trim(),
        description: description.trim(),
        assignedTo: assignedTo.trim(),
        dueDate: dueDate.trim(),
        status,
      })
    }
    closeForm()
  }

  const confirmDelete = (id: string) => {
    removeAction(id)
    setDeleteId(null)
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <Link to="/safety" className="inline-flex items-center gap-1 text-sm text-brand-600 dark:text-brand-400 hover:underline">← Health & safety</Link>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display font-bold text-display-xl text-neutral-900 dark:text-white tracking-tight">Corrective & preventive actions (CAPA)</h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-0.5">
            {isHr ? 'Corrective (after event) and preventive (to prevent recurrence). HR can add, edit, and remove.' : 'Track actions from incidents and hazards.'}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select value={filterType} onChange={(e) => setFilterType(e.target.value as 'all' | 'corrective' | 'preventive')} className="rounded-lg border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white px-3 py-1.5 text-sm">
            <option value="all">All</option>
            <option value="corrective">Corrective</option>
            <option value="preventive">Preventive</option>
          </select>
          <Button size="sm" variant="secondary" onClick={() => {
            const rows = filteredActions.map((a) => ({
              id: a.id,
              type: a.actionType,
              sourceType: a.sourceType,
              sourceId: a.sourceId,
              title: a.title,
              description: a.description,
              assignedTo: a.assignedTo,
              dueDate: a.dueDate,
              status: a.status,
            }))
            downloadCsv(rows, `capa-${new Date().toISOString().slice(0, 10)}.csv`)
          }}>Export CSV</Button>
          {isHr && (
            <Button size="sm" onClick={openCreate}>Add action</Button>
          )}
        </div>
      </div>

      {showForm && (
        <Card padding="lg">
          <CardHeader>{editingId ? 'Edit corrective action' : 'New corrective action'}</CardHeader>
          <CardDescription>Corrective = after an event; preventive = to prevent recurrence. Link to source and assign.</CardDescription>
          <div className="mt-4 space-y-4 max-w-xl">
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">Action type</label>
              <select value={actionType} onChange={(e) => setActionType(e.target.value as CorrectiveAction['actionType'])} className="w-full px-4 py-3 rounded-xl border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white">
                {ACTION_TYPES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">Source type</label>
              <select
                value={sourceType}
                onChange={(e) => setSourceType(e.target.value as CorrectiveAction['sourceType'])}
                className="w-full px-4 py-3 rounded-xl border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white"
              >
                {SOURCE_TYPES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
            <Input label="Source reference ID" value={sourceId} onChange={(e) => setSourceId(e.target.value)} placeholder="e.g. ir1, nm2" />
            <Input label="Title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Review glove policy" required />
            <Textarea label="Description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What needs to be done" rows={3} required />
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">Assigned to</label>
              <select
                value={assignedTo}
                onChange={(e) => setAssignedTo(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white"
              >
                <option value="">— Select —</option>
                {MOCK_APP_USERS.map((u) => (
                  <option key={u.id} value={u.name}>{u.name}</option>
                ))}
              </select>
            </div>
            <Input label="Due date" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} required />
            {editingId && (
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as CorrectiveAction['status'])}
                  className="w-full px-4 py-3 rounded-xl border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white"
                >
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
            )}
            <div className="flex gap-2">
              <Button onClick={save} disabled={!title.trim() || !description.trim() || !dueDate}>{editingId ? 'Save changes' : 'Add action'}</Button>
              <Button variant="ghost" onClick={closeForm}>Cancel</Button>
            </div>
          </div>
        </Card>
      )}

      {actions.length === 0 ? (
        <Card padding="lg">
          <EmptyState
            title="No corrective actions"
            description={isHr ? 'Add an action linked to an injury, incident, near-miss, or hazard.' : 'No actions yet.'}
            action={isHr ? <Button size="sm" onClick={openCreate}>Add corrective action</Button> : undefined}
          />
        </Card>
      ) : (
        <ul className="space-y-3">
          {filteredActions.map((c) => (
            <li key={c.id}>
              <Card padding="md" className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex-1">
                  <p className="font-medium text-neutral-900 dark:text-white">{c.title}</p>
                  <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-0.5">{c.description}</p>
                  <p className="text-xs text-neutral-400 mt-1">{c.actionType === 'preventive' ? 'Preventive' : 'Corrective'} · From {c.sourceType} · Assigned to {c.assignedTo} · Due {c.dueDate}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={c.actionType === 'preventive' ? 'default' : 'warning'}>{c.actionType}</Badge>
                  <Badge variant={c.status === 'completed' ? 'success' : c.status === 'in-progress' ? 'warning' : 'default'}>{c.status}</Badge>
                  {isHr && (
                    <>
                      <Button type="button" variant="ghost" size="sm" onClick={() => openEdit(c)}>Edit</Button>
                      <Button type="button" variant="ghost" size="sm" className="text-red-600 hover:text-red-700 dark:text-red-400" onClick={() => setDeleteId(c.id)}>Delete</Button>
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
            <h2 className="font-display font-bold text-xl text-neutral-900 dark:text-white">Delete this corrective action?</h2>
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
