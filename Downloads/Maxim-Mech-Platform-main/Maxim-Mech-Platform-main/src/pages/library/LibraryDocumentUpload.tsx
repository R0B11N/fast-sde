import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Card, CardHeader, CardDescription } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useUser } from '@/contexts/UserContext'
import { useDocuments } from '@/contexts/DocumentsContext'
import type { DocumentRecord, DocumentVisibility, UserRole } from '@/types'

const DOC_TYPES = ['Policy', 'Inspection', 'Incident', 'Safety', 'Other']
const ROLE_OPTIONS: { value: UserRole; label: string }[] = [
  { value: 'owner', label: 'Owner' },
  { value: 'hr', label: 'HR' },
  { value: 'supervisor', label: 'Supervisor' },
  { value: 'labourer', label: 'Labourer' },
]

export function LibraryDocumentUpload() {
  const navigate = useNavigate()
  const { user } = useUser()
  const { setDocuments } = useDocuments()
  const [name, setName] = useState('')
  const [type, setType] = useState('Policy')
  const [siteName, setSiteName] = useState('')
  const [visibility, setVisibility] = useState<DocumentVisibility>('everyone')
  const [visibleToRoles, setVisibleToRoles] = useState<UserRole[]>(['owner', 'hr'])
  const [saving, setSaving] = useState(false)
  const [fileDataUrl, setFileDataUrl] = useState<string | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  const isOwnerOrHr = user?.role === 'owner' || user?.role === 'hr'
  if (!isOwnerOrHr) {
    navigate('/library?view=documents', { replace: true })
    return null
  }

  const toggleRole = (role: UserRole) => {
    setVisibleToRoles((prev) => (prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]))
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    setSelectedFile(file ?? null)
    if (!file) {
      setFileDataUrl(null)
      return
    }
    const reader = new FileReader()
    reader.onload = () => setFileDataUrl(reader.result as string)
    reader.readAsDataURL(file)
  }

  const save = () => {
    if (!name.trim()) return
    setSaving(true)
    const newDoc: DocumentRecord = {
      id: `doc-${Date.now()}`,
      name: name.trim().endsWith('.pdf') ? name.trim() : `${name.trim()}.pdf`,
      type,
      siteName: siteName.trim() || undefined,
      date: new Date().toISOString().slice(0, 10),
      uploadedBy: user?.name,
      visibility,
      visibleToRoles: visibility === 'restricted' ? visibleToRoles : undefined,
      fileDataUrl: fileDataUrl ?? undefined,
    }
    setDocuments((prev) => [...prev, newDoc])
    setTimeout(() => {
      setSaving(false)
      navigate('/library?view=documents', { state: { message: 'Document uploaded. It has no fillable fields — view only.' } })
    }, 400)
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-2xl">
      <div className="flex items-center gap-4">
        <Link to="/library?view=documents" className="no-print -ml-2 text-sm text-brand-600 dark:text-brand-400 hover:underline">← Back to documents</Link>
      </div>
      <Card padding="lg">
        <CardHeader>Upload document</CardHeader>
        <CardDescription>
          Same as templates: upload a PDF to the system. Documents have no fillable fields — they are for viewing and distribution only. Set visibility so everyone or only certain roles can see it.
        </CardDescription>
        <div className="mt-6 space-y-4">
          <div className="w-full min-h-[120px] rounded-xl border-2 border-dashed border-neutral-300 dark:border-neutral-600 flex flex-col items-center justify-center gap-2 bg-neutral-50/50 dark:bg-neutral-800/30 py-6">
            <input
              id="library-doc-upload"
              type="file"
              accept=".pdf,application/pdf"
              onChange={handleFileChange}
              className="sr-only"
              aria-label="Choose PDF file"
            />
            <label htmlFor="library-doc-upload" className="cursor-pointer text-sm font-medium text-brand-600 dark:text-brand-400 hover:underline">
              {selectedFile ? selectedFile.name : 'Choose PDF to upload'}
            </label>
            {selectedFile && (
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                {selectedFile.name} · {(selectedFile.size / 1024).toFixed(1)} KB
              </p>
            )}
          </div>
          <Input label="Document name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Safety Handbook 2025.pdf" />
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1" id="library-doc-type-label">Type</label>
            <select id="library-doc-type" value={type} onChange={(e) => setType(e.target.value)} className="w-full min-h-[44px] px-3 rounded-xl border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white" aria-labelledby="library-doc-type-label">
              {DOC_TYPES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
          <Input label="Site (optional)" value={siteName} onChange={(e) => setSiteName(e.target.value)} placeholder="e.g. North Site" />
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1" id="library-doc-visibility-label">Visibility</label>
            <select id="library-doc-visibility" value={visibility} onChange={(e) => setVisibility(e.target.value as DocumentVisibility)} className="w-full min-h-[44px] px-3 rounded-xl border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white" aria-labelledby="library-doc-visibility-label">
              <option value="everyone">Everyone</option>
              <option value="restricted">Restricted (selected roles only)</option>
            </select>
          </div>
          {visibility === 'restricted' && (
            <div>
              <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">Roles that can view</p>
              <div className="flex flex-wrap gap-2">
                {ROLE_OPTIONS.map((r) => (
                  <label key={r.value} className="flex items-center gap-2 cursor-pointer text-sm">
                    <input type="checkbox" checked={visibleToRoles.includes(r.value)} onChange={() => toggleRole(r.value)} className="rounded border-neutral-300 text-brand-600" />
                    {r.label}
                  </label>
                ))}
              </div>
            </div>
          )}
          <div className="flex gap-2 pt-2">
            <Button onClick={save} disabled={!name.trim() || saving}>{saving ? 'Uploading...' : 'Upload document'}</Button>
            {selectedFile && (
              <button
                type="button"
                onClick={() => { setSelectedFile(null); setFileDataUrl(null); }}
                className="text-sm text-neutral-500 dark:text-neutral-400 hover:underline"
              >
                Clear file
              </button>
            )}
            <Link to="/library?view=documents"><Button variant="ghost">Cancel</Button></Link>
          </div>
        </div>
      </Card>
    </div>
  )
}
