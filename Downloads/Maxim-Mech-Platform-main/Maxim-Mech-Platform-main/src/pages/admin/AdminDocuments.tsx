import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Card, CardHeader, CardDescription } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { MOCK_APP_USERS } from '@/data/mock'
import { useUser } from '@/contexts/UserContext'
import { useDocuments } from '@/contexts/DocumentsContext'
import type { DocumentRecord, DocumentVisibility, UserRole } from '@/types'

const ROLE_OPTIONS: { value: UserRole; label: string }[] = [
  { value: 'owner', label: 'Owner' },
  { value: 'hr', label: 'HR' },
  { value: 'supervisor', label: 'Supervisor' },
  { value: 'labourer', label: 'Labourer' },
]

export function AdminDocuments() {
  const { user } = useUser()
  const { documents: docs, setDocuments: setDocs } = useDocuments()
  const [showAdd, setShowAdd] = useState(false)
  const [saving, setSaving] = useState(false)
  const [newName, setNewName] = useState('')
  const [newType, setNewType] = useState('Policy')
  const [newVisibility, setNewVisibility] = useState<DocumentVisibility>('everyone')
  const [newVisibleToRoles, setNewVisibleToRoles] = useState<UserRole[]>(['owner', 'hr'])
  const [newVisibleToUserIds, setNewVisibleToUserIds] = useState<string[]>([])

  const toggleRole = (role: UserRole) => {
    setNewVisibleToRoles((prev) => (prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]))
  }

  const toggleUser = (userId: string) => {
    setNewVisibleToUserIds((prev) => (prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]))
  }

  const addDocument = () => {
    if (!newName.trim()) return
    if (newVisibility === 'restricted' && newVisibleToRoles.length === 0 && newVisibleToUserIds.length === 0) {
      alert('When restricted, select at least one role or person who can view.')
      return
    }
    setSaving(true)
    const newDoc: DocumentRecord = {
      id: `d-${Date.now()}`,
      name: newName.trim(),
      type: newType,
      date: new Date().toISOString().slice(0, 10),
      uploadedBy: user?.name,
      visibility: newVisibility,
      visibleToRoles: newVisibility === 'restricted' ? newVisibleToRoles : undefined,
      visibleToUserIds: newVisibility === 'restricted' && newVisibleToUserIds.length > 0 ? newVisibleToUserIds : undefined,
    }
    setDocs((prev) => [...prev, newDoc])
    setTimeout(() => {
      setNewName('')
      setNewVisibility('everyone')
      setNewVisibleToRoles(['owner', 'hr'])
      setNewVisibleToUserIds([])
      setShowAdd(false)
      setSaving(false)
    }, 400)
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display font-bold text-2xl text-neutral-900 dark:text-white">Document visibility</h1>
          <p className="text-neutral-500 dark:text-neutral-400 mt-0.5">Upload docs and choose who can see them: everyone (e.g. safety handbook) or restricted (e.g. owner + HR + submitter only).</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Link to="/documents" className="text-sm text-neutral-600 dark:text-neutral-400 hover:underline">Document library</Link>
          <Button onClick={() => setShowAdd(true)}>Upload document</Button>
        </div>
      </div>

      {showAdd && (
        <Card padding="lg">
          <CardHeader>Upload document</CardHeader>
          <CardDescription>Set visibility so everyone can view (e.g. safety handbook) or only certain people (e.g. owner, HR, and the person who submitted).</CardDescription>
          <div className="mt-4 space-y-4 max-w-xl">
            <Input label="Document name" value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="e.g. Safety Handbook 2025.pdf" />
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">Type</label>
              <select value={newType} onChange={(e) => setNewType(e.target.value)} className="w-full min-h-[44px] px-4 rounded-xl border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white">
                <option>Policy</option>
                <option>Inspection</option>
                <option>Incident</option>
                <option>Form</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">Who can view</label>
              <select value={newVisibility} onChange={(e) => setNewVisibility(e.target.value as DocumentVisibility)} className="w-full min-h-[44px] px-4 rounded-xl border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white">
                <option value="everyone">Everyone (e.g. safety handbook)</option>
                <option value="restricted">Restricted (owner + HR + selected people only)</option>
              </select>
            </div>
            {newVisibility === 'restricted' && (
              <>
                <div>
                  <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">Roles that can always view (e.g. owner, HR)</p>
                  <div className="flex flex-wrap gap-2">
                    {ROLE_OPTIONS.map((r) => (
                      <label key={r.value} className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" checked={newVisibleToRoles.includes(r.value)} onChange={() => toggleRole(r.value)} className="rounded border-neutral-300 text-brand-600" />
                        <span className="text-sm">{r.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">Specific people who can view (e.g. submitter)</p>
                  <div className="flex flex-wrap gap-2">
                    {MOCK_APP_USERS.map((u) => (
                      <label key={u.id} className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" checked={newVisibleToUserIds.includes(u.id)} onChange={() => toggleUser(u.id)} className="rounded border-neutral-300 text-brand-600" />
                        <span className="text-sm">{u.name} ({u.role})</span>
                      </label>
                    ))}
                  </div>
                </div>
              </>
            )}
            <div className="flex gap-2">
              <Button onClick={addDocument} disabled={saving}>{saving ? 'Adding…' : 'Upload'}</Button>
              <Button variant="ghost" onClick={() => setShowAdd(false)}>Cancel</Button>
            </div>
          </div>
        </Card>
      )}

      <Card padding="none">
        <CardHeader className="px-4 py-3">All documents</CardHeader>
        <CardDescription className="px-4 pb-3">Visibility controls who sees each doc in the Document library.</CardDescription>
        <ul className="divide-y divide-neutral-200 dark:divide-neutral-700">
          {docs.map((d) => (
            <li key={d.id} className="p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <p className="font-medium text-neutral-900 dark:text-white">{d.name}</p>
                <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-0.5">{d.type} · {d.date}{d.uploadedBy ? ` · Uploaded by ${d.uploadedBy}` : ''}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Badge variant={d.visibility === 'everyone' ? 'success' : 'default'}>
                  {d.visibility === 'everyone' ? 'Everyone' : 'Restricted'}
                </Badge>
                <Link to={`/documents/${d.id}`}><Button size="sm" variant="secondary">View</Button></Link>
              </div>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  )
}
