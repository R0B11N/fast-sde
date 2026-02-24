import { useState, useRef, useEffect } from 'react'
import { Link, useParams, useNavigate, useLocation } from 'react-router-dom'
import { Card, CardHeader, CardDescription } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { MOCK_APP_USERS } from '@/data/mock'
import { useScannedPdfs } from '@/contexts/ScannedPdfsContext'
import { useSignableTemplates } from '@/contexts/SignableTemplatesContext'
import type { PlacedFormField, SignableFormTemplate, UserRole } from '@/types'

const ROLE_OPTIONS: { value: UserRole; label: string }[] = [
  { value: 'owner', label: 'Owners' },
  { value: 'hr', label: 'HR' },
  { value: 'supervisor', label: 'Supervisors' },
  { value: 'labourer', label: 'Labourers' },
]

const FIELD_TYPES: { value: PlacedFormField['type']; label: string }[] = [
  { value: 'text', label: 'Text' },
  { value: 'date', label: 'Date' },
  { value: 'signature', label: 'Signature (by text)' },
]

const DEFAULT_FIELD_WIDTH = 28
const DEFAULT_FIELD_HEIGHT = 6
const MIN_WIDTH = 5
const MAX_WIDTH = 80
const MIN_HEIGHT = 3
const MAX_HEIGHT = 40

function clampWidth(w: number) { return Math.max(MIN_WIDTH, Math.min(MAX_WIDTH, w)) }
function clampHeight(h: number) { return Math.max(MIN_HEIGHT, Math.min(MAX_HEIGHT, h)) }

export function FormFromPdfEditor() {
  const { pdfId } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const { getPdf } = useScannedPdfs()
  const { templates, addTemplate, updateTemplateBySourcePdf } = useSignableTemplates()
  const pdf = pdfId ? getPdf(pdfId) : undefined
  const existing = pdfId ? templates.find((t) => t.sourcePdfId === pdfId) : undefined
  const pageRef = useRef<HTMLDivElement>(null)
  const isLibraryRoute = location.pathname.includes('/library/')
  const backHref = isLibraryRoute ? '/library?view=templates' : '/admin/scanned-forms'

  const [name, setName] = useState(existing?.name ?? pdf?.name.replace('.pdf', '') ?? '')
  const [description, setDescription] = useState(existing?.description ?? '')
  const [schedule, setSchedule] = useState<SignableFormTemplate['schedule']>(existing?.schedule ?? 'daily')
  const [assignedToRoles, setAssignedToRoles] = useState<UserRole[]>(existing?.assignedToRoles ?? ['supervisor'])
  const [assignedToUserIds, setAssignedToUserIds] = useState<string[]>(existing?.assignedToUserIds ?? [])
  const [fields, setFields] = useState<PlacedFormField[]>(existing?.placedFields ?? [])
  const [placeMode, setPlaceMode] = useState<PlacedFormField['type'] | null>(null)
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null)
  const [dragState, setDragState] = useState<
    | null
    | { type: 'move'; fieldId: string; startPctX: number; startPctY: number; startFieldX: number; startFieldY: number }
    | { type: 'resize'; fieldId: string; startPctX: number; startPctY: number; startFieldX: number; startFieldY: number; startW: number; startH: number }
  >(null)

  const toggleRole = (role: UserRole) => {
    setAssignedToRoles((prev) => (prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]))
  }

  const toggleUser = (userId: string) => {
    setAssignedToUserIds((prev) => (prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]))
  }

  const addFieldAtPosition = (xPct: number, yPct: number) => {
    if (!placeMode) return
    const id = `f-${Date.now()}`
    setFields((prev) => [
      ...prev,
      {
        id,
        type: placeMode,
        label: placeMode === 'signature' ? 'Signature' : placeMode === 'date' ? 'Date' : 'Text',
        required: false,
        page: 1,
        x: Math.max(0, Math.min(100 - DEFAULT_FIELD_WIDTH, xPct)),
        y: Math.max(0, Math.min(100 - DEFAULT_FIELD_HEIGHT, yPct)),
        width: DEFAULT_FIELD_WIDTH,
        height: DEFAULT_FIELD_HEIGHT,
      },
    ])
    setSelectedFieldId(id)
    setPlaceMode(null)
  }

  const handlePageClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = pageRef.current
    if (!el) return
    if ((e.target as HTMLElement).closest('[data-field-overlay]')) return
    if (placeMode) {
      const rect = el.getBoundingClientRect()
      const xPct = ((e.clientX - rect.left) / rect.width) * 100
      const yPct = ((e.clientY - rect.top) / rect.height) * 100
      addFieldAtPosition(xPct, yPct)
      return
    }
    setSelectedFieldId(null)
  }

  const handleFieldMouseDown = (e: React.MouseEvent, f: PlacedFormField) => {
    if ((e.target as HTMLElement).closest('[data-resize-handle]')) return
    e.stopPropagation()
    setPlaceMode(null)
    setSelectedFieldId(f.id)
    const { x: startPctX, y: startPctY } = pctFromPage(e.clientX, e.clientY)
    setDragState({
      type: 'move',
      fieldId: f.id,
      startPctX,
      startPctY,
      startFieldX: f.x ?? 0,
      startFieldY: f.y ?? 0,
    })
  }

  const handleResizeMouseDown = (e: React.MouseEvent, f: PlacedFormField) => {
    e.stopPropagation()
    e.preventDefault()
    setPlaceMode(null)
    setSelectedFieldId(f.id)
    const { x: startPctX, y: startPctY } = pctFromPage(e.clientX, e.clientY)
    setDragState({
      type: 'resize',
      fieldId: f.id,
      startPctX,
      startPctY,
      startFieldX: f.x ?? 0,
      startFieldY: f.y ?? 0,
      startW: f.width ?? DEFAULT_FIELD_WIDTH,
      startH: f.height ?? DEFAULT_FIELD_HEIGHT,
    })
  }

  const setFieldSize = (id: string, widthPct: number, heightPct: number) => {
    setFields((prev) =>
      prev.map((f) =>
        f.id === id ? { ...f, width: clampWidth(widthPct), height: clampHeight(heightPct) } : f
      )
    )
  }

  const updateField = (id: string, updates: Partial<PlacedFormField>) => {
    setFields((prev) => prev.map((f) => (f.id === id ? { ...f, ...updates } : f)))
  }

  const pctFromPage = (clientX: number, clientY: number) => {
    const el = pageRef.current
    if (!el) return { x: 0, y: 0 }
    const rect = el.getBoundingClientRect()
    return {
      x: ((clientX - rect.left) / rect.width) * 100,
      y: ((clientY - rect.top) / rect.height) * 100,
    }
  }

  useEffect(() => {
    if (!dragState || !pageRef.current) return
    const onMove = (e: MouseEvent) => {
      const { x: pctX, y: pctY } = pctFromPage(e.clientX, e.clientY)
      if (dragState.type === 'move') {
        const f = fields.find((f) => f.id === dragState.fieldId)
        if (!f) return
        const w = f.width ?? DEFAULT_FIELD_WIDTH
        const h = f.height ?? DEFAULT_FIELD_HEIGHT
        const dx = pctX - dragState.startPctX
        const dy = pctY - dragState.startPctY
        const newX = Math.max(0, Math.min(100 - w, (f.x ?? 0) + dx))
        const newY = Math.max(0, Math.min(100 - h, (f.y ?? 0) + dy))
        updateField(dragState.fieldId, { x: newX, y: newY })
      } else {
        const f = fields.find((f) => f.id === dragState.fieldId)
        if (!f) return
        const newW = clampWidth(pctX - (f.x ?? 0))
        const newH = clampHeight(pctY - (f.y ?? 0))
        updateField(dragState.fieldId, { width: newW, height: newH })
      }
    }
    const onUp = () => setDragState(null)
    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onUp)
    return () => {
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseup', onUp)
    }
  }, [dragState])

  const removeField = (id: string) => {
    setFields((prev) => prev.filter((f) => f.id !== id))
    if (selectedFieldId === id) setSelectedFieldId(null)
  }

  const hasSignature = fields.some((f) => f.type === 'signature')

  const save = () => {
    if (!name.trim() || !pdfId) return
    if (!hasSignature) {
      alert('Add at least one Signature field so the submitter can sign by text.')
      return
    }
    if (assignedToRoles.length === 0 && assignedToUserIds.length === 0) {
      alert('Assign to at least one role or specific person.')
      return
    }
    const payload: SignableFormTemplate = {
      id: existing?.id ?? `sf-${pdfId}`,
      name: name.trim(),
      description: description.trim(),
      assignedToRoles,
      assignedToUserIds: assignedToUserIds.length ? assignedToUserIds : undefined,
      schedule,
      createdAt: existing?.createdAt ?? new Date().toISOString().slice(0, 10),
      createdBy: existing?.createdBy ?? 'HR',
      active: true,
      sourcePdfId: pdfId,
      placedFields: fields.length ? fields : undefined,
    }
    if (existing) {
      updateTemplateBySourcePdf(pdfId!, payload)
    } else {
      addTemplate(payload)
    }
    const redirectTo = isLibraryRoute ? '/library?view=templates' : '/admin/scanned-forms'
    navigate(redirectTo, { state: { message: 'Form saved. It is available as a template and can be assigned.' } })
  }

  if (!pdf) {
    return (
      <div className="space-y-4 animate-fade-in">
        <p className="text-neutral-500 dark:text-neutral-400">PDF not found.</p>
        <Link to={backHref} className="text-brand-600 dark:text-brand-400 hover:underline">Back</Link>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-4">
        <Link to={backHref} className="touch-target p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-400">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
        </Link>
        <div>
          <h1 className="font-display font-bold text-2xl text-neutral-900 dark:text-white">Add fields on PDF</h1>
          <p className="text-neutral-500 dark:text-neutral-400 mt-0.5">Based on: {pdf.name} — click on the document to place fields like DocuSign.</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* PDF preview — click to place fields */}
        <Card padding="lg" className="lg:col-span-2">
          <CardHeader>Document</CardHeader>
          <CardDescription>Select a field type below, then click on the page where the field should appear.</CardDescription>
          <div className="mt-3 flex flex-wrap gap-2">
            {FIELD_TYPES.map((t) => (
              <Button
                key={t.value}
                size="sm"
                variant={placeMode === t.value ? 'primary' : 'outline'}
                onClick={() => setPlaceMode(placeMode === t.value ? null : t.value)}
              >
                {t.label}
              </Button>
            ))}
            {placeMode && <span className="text-sm text-neutral-500 self-center">→ Click on the page to place</span>}
          </div>
          <div
            ref={pageRef}
            className="relative mt-4 mx-auto bg-white shadow-lg border border-neutral-300 dark:border-neutral-500 rounded-sm overflow-hidden text-neutral-900"
            style={{ aspectRatio: '210/297', maxWidth: '100%', cursor: placeMode ? 'crosshair' : 'default' }}
            onClick={handlePageClick}
            role={placeMode ? 'button' : undefined}
            aria-label={placeMode ? `Click to place ${placeMode} field` : 'PDF page'}
          >
            {/* Mock PDF content — keep paper look and readable text in both themes */}
            <div className="absolute inset-0 p-6 text-neutral-600 text-sm pointer-events-none select-none">
              <div className="border-b border-neutral-300 pb-2 mb-4 font-medium text-neutral-700">{pdf.name}</div>
              <div className="space-y-2 opacity-80">
                <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit.</p>
                <p>Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.</p>
                <p>Ut enim ad minim veniam, quis nostrud exercitation.</p>
              </div>
            </div>
            {/* Placed fields as overlays — drag to move, drag corner to resize */}
            {fields.map((f) => (
              <div
                key={f.id}
                data-field-overlay
                className={`absolute border-2 min-h-[20px] rounded flex items-center justify-center text-xs font-medium overflow-visible select-none ${
                  selectedFieldId === f.id
                    ? 'border-brand-500 bg-brand-100 text-brand-900 z-10'
                    : 'border-neutral-500 bg-neutral-100 text-neutral-800 z-[1]'
                } ${dragState?.fieldId === f.id ? (dragState.type === 'resize' ? 'cursor-nwse-resize' : 'cursor-grabbing') : 'cursor-grab'}`}
                style={{
                  left: `${f.x ?? 0}%`,
                  top: `${f.y ?? 0}%`,
                  width: `${f.width ?? DEFAULT_FIELD_WIDTH}%`,
                  height: `${f.height ?? DEFAULT_FIELD_HEIGHT}%`,
                }}
                onMouseDown={(e) => handleFieldMouseDown(e, f)}
                onClick={(e) => { e.stopPropagation(); setPlaceMode(null); setSelectedFieldId(f.id) }}
              >
                <span className="truncate px-1 pointer-events-none">{f.label || f.type}</span>
                {selectedFieldId === f.id && (
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); e.preventDefault(); removeField(f.id) }}
                    onMouseDown={(e) => e.stopPropagation()}
                    className="absolute -top-1.5 -right-1.5 w-6 h-6 flex items-center justify-center rounded-full shadow-md text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/80 border-2 border-red-400 dark:border-red-600 hover:bg-red-200 dark:hover:bg-red-800/80 font-bold text-sm leading-none z-20"
                    aria-label="Remove field"
                  >
                    ×
                  </button>
                )}
                <div
                  data-resize-handle
                  className="absolute bottom-0 right-0 w-3 h-3 border-2 border-neutral-600 bg-white dark:bg-neutral-700 border-t-0 border-l-0 rounded-bl cursor-nwse-resize"
                  onMouseDown={(e) => handleResizeMouseDown(e, f)}
                  aria-label="Resize field"
                />
              </div>
            ))}
          </div>
        </Card>

        {/* Field list + form settings */}
        <div className="space-y-4">
          <Card padding="lg">
            <CardHeader>Fields on document</CardHeader>
            <CardDescription>Edit label and type. Submissions are geo-tagged.</CardDescription>
            <ul className="mt-3 space-y-2 max-h-[240px] overflow-y-auto">
              {fields.map((f) => (
                <li
                  key={f.id}
                  className={`rounded-lg border p-2 text-sm ${selectedFieldId === f.id ? 'border-brand-500 bg-brand-50/50 dark:bg-brand-950/30' : 'border-neutral-200 dark:border-neutral-600'}`}
                >
                  <div className="flex items-center gap-2 flex-wrap">
                    <select
                      value={f.type}
                      onChange={(e) => updateField(f.id, { type: e.target.value as PlacedFormField['type'] })}
                      className="min-h-[32px] px-2 rounded border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white text-xs"
                    >
                      {FIELD_TYPES.map((t) => (
                        <option key={t.value} value={t.value}>{t.label}</option>
                      ))}
                    </select>
                    <input
                      value={f.label}
                      onChange={(e) => updateField(f.id, { label: e.target.value })}
                      placeholder="Label"
                      className="flex-1 min-w-[80px] min-h-[32px] px-2 rounded border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white text-xs"
                    />
                    <label className="flex items-center gap-1 text-xs">
                      <input type="checkbox" checked={!!f.required} onChange={(e) => updateField(f.id, { required: e.target.checked })} className="rounded border-neutral-300 text-brand-600" />
                      Req
                    </label>
                    <button
                      type="button"
                      onClick={() => removeField(f.id)}
                      className="shrink-0 min-w-[32px] min-h-[32px] flex items-center justify-center rounded-md border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/50 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40 hover:border-red-300 dark:hover:border-red-700 font-medium text-sm"
                      aria-label="Remove field"
                    >
                      Remove
                    </button>
                  </div>
                  <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                    <label className="flex items-center gap-1.5">
                      <span className="text-neutral-500 min-w-[52px]">Width %</span>
                      <input
                        type="number"
                        min={MIN_WIDTH}
                        max={MAX_WIDTH}
                        value={Math.round(f.width ?? DEFAULT_FIELD_WIDTH)}
                        onChange={(e) => setFieldSize(f.id, Number(e.target.value) || DEFAULT_FIELD_WIDTH, f.height ?? DEFAULT_FIELD_HEIGHT)}
                        className="w-14 min-h-[28px] px-1.5 rounded border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white"
                        aria-label="Field width percentage"
                      />
                    </label>
                    <label className="flex items-center gap-1.5">
                      <span className="text-neutral-500 min-w-[52px]">Height %</span>
                      <input
                        type="number"
                        min={MIN_HEIGHT}
                        max={MAX_HEIGHT}
                        value={Math.round(f.height ?? DEFAULT_FIELD_HEIGHT)}
                        onChange={(e) => setFieldSize(f.id, f.width ?? DEFAULT_FIELD_WIDTH, Number(e.target.value) || DEFAULT_FIELD_HEIGHT)}
                        className="w-14 min-h-[28px] px-1.5 rounded border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white"
                        aria-label="Field height percentage"
                      />
                    </label>
                  </div>
                  <p className="text-xs text-neutral-500 mt-1">Position: {typeof f.x === 'number' ? `${Math.round(f.x)}%, ${Math.round(f.y ?? 0)}%` : '—'}</p>
                </li>
              ))}
            </ul>
            {!hasSignature && fields.length > 0 && (
              <p className="mt-2 text-xs text-amber-600 dark:text-amber-400">Add a Signature field on the document.</p>
            )}
          </Card>

          <Card padding="lg">
            <CardHeader>Form details</CardHeader>
            <Input label="Form name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Daily Safety Checklist" className="text-sm" />
            <Input label="Description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Optional" className="text-sm mt-2" />
            <div className="mt-3">
              <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1">Schedule</label>
              <select value={schedule} onChange={(e) => setSchedule(e.target.value as SignableFormTemplate['schedule'])} className="w-full min-h-[36px] px-3 rounded-lg border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white text-sm">
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="once">Once</option>
              </select>
            </div>
            <div className="mt-3">
              <p className="text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1">Assign by role</p>
              <div className="flex flex-wrap gap-1.5">
                {ROLE_OPTIONS.map((r) => (
                  <label key={r.value} className="flex items-center gap-1 cursor-pointer text-xs">
                    <input type="checkbox" checked={assignedToRoles.includes(r.value)} onChange={() => toggleRole(r.value)} className="rounded border-neutral-300 text-brand-600" />
                    {r.label}
                  </label>
                ))}
              </div>
            </div>
            <div className="mt-2">
              <p className="text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1">Or specific people</p>
              <div className="flex flex-wrap gap-1.5">
                {MOCK_APP_USERS.map((u) => (
                  <label key={u.id} className="flex items-center gap-1 cursor-pointer text-xs">
                    <input type="checkbox" checked={assignedToUserIds.includes(u.id)} onChange={() => toggleUser(u.id)} className="rounded border-neutral-300 text-brand-600" />
                    {u.name}
                  </label>
                ))}
              </div>
            </div>
          </Card>
        </div>
      </div>

      <div className="flex gap-2">
        <Button onClick={save} disabled={!name.trim() || !hasSignature}>Save form</Button>
        <Link to={backHref}><Button variant="ghost">Cancel</Button></Link>
      </div>
    </div>
  )
}
