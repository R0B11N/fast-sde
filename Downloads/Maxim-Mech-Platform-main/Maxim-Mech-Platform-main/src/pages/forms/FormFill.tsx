import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Checkbox } from '@/components/ui/Checkbox'
import { MOCK_FORM_TEMPLATES, MOCK_FORM_TEMPLATE } from '@/data/mock'
import { useFormSubmissions } from '@/contexts/FormSubmissionsContext'
import { useUser } from '@/contexts/UserContext'
import type { FormField } from '@/types'

export function FormFill() {
  const { templateId } = useParams()
  const navigate = useNavigate()
  const { user } = useUser()
  const { addSubmission } = useFormSubmissions()
  const template = templateId ? (MOCK_FORM_TEMPLATES[templateId] ?? MOCK_FORM_TEMPLATE) : MOCK_FORM_TEMPLATE

  const [values, setValues] = useState<Record<string, string | boolean>>({})
  const [photos, setPhotos] = useState<Record<string, string>>({})
  const [geo, setGeo] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const updateField = (id: string, value: string | boolean) => setValues((v) => ({ ...v, [id]: value }))

  const handlePhoto = (fieldId: string) => {
    // Mock: simulate upload
    setPhotos((p) => ({ ...p, [fieldId]: 'uploaded-photo-placeholder.jpg' }))
  }

  const saveDraft = () => {
    setSaving(true)
    setTimeout(() => { setSaving(false); navigate('/library?view=submissions') }, 600)
  }

  const submit = () => {
    setSaving(true)
    const id = `f-${Date.now()}`
    const now = new Date().toISOString()
    const by = user?.name ?? 'User'
    if (templateId === 't3') {
      addSubmission({
        id,
        templateId: 't3',
        templateName: template.name,
        status: 'pending_site_signatures',
        submittedAt: now,
        submittedBy: by,
        siteName: 'North Site',
        workflowType: 'site_meeting',
        siteSignerIds: ['3', '5'],
        siteSignatures: [],
        auditEvents: [
          { id: 'e1', type: 'draft_created', at: now, by },
          { id: 'e2', type: 'submitted', at: now, by },
        ],
      })
      setTimeout(() => { setSaving(false); navigate(`/forms/${id}`) }, 400)
      return
    }
    if (templateId === 't2' || templateId === 't4' || templateId === 't5') {
      const fieldValues: Record<string, string | number | boolean> = {}
      Object.entries(values).forEach(([k, v]) => {
        if (typeof v === 'number') fieldValues[k] = v
        else if (typeof v === 'boolean') fieldValues[k] = v
        else if (v != null && v !== '') fieldValues[k] = String(v)
      })
      const siteName = (values.irf3 || values.nmf1 || values.hzf2) as string | undefined
      addSubmission({
        id,
        templateId: templateId!,
        templateName: template.name,
        status: 'submitted',
        submittedAt: now,
        submittedBy: by,
        siteName: siteName?.trim() || undefined,
        fieldValues: Object.keys(fieldValues).length ? fieldValues : undefined,
        auditEvents: [
          { id: 'e1', type: 'draft_created', at: now, by },
          { id: 'e2', type: 'submitted', at: now, by },
        ],
      })
      setTimeout(() => { setSaving(false); navigate(`/forms/${id}`) }, 400)
      return
    }
    setTimeout(() => { setSaving(false); navigate('/library?view=submissions') }, 600)
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      <div className="flex items-center gap-4">
        <Link to="/library?view=submissions" className="touch-target p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-400">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
        </Link>
        <div>
          <h1 className="font-display font-bold text-xl text-neutral-900 dark:text-white">{template.name}</h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400">{template.description}</p>
        </div>
      </div>

      {template.id === 't2' && (
        <Card padding="lg" className="border-l-4 border-brand-500">
          <h2 className="font-display font-semibold text-lg text-neutral-900 dark:text-white mb-4">When did it happen?</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Date of incident"
              type="date"
              required
              value={(values.irf0_date as string) || ''}
              onChange={(e) => updateField('irf0_date', e.target.value)}
            />
            <Input
              label="Time of incident"
              type="time"
              required
              value={(values.irf0_time as string) || ''}
              onChange={(e) => updateField('irf0_time', e.target.value)}
            />
          </div>
        </Card>
      )}

      {geo === null && (
        <button
          type="button"
          onClick={() => setGeo('Location: 49.28° N, 123.12° W (mock)')}
          className="text-sm text-brand-600 dark:text-brand-400 hover:underline"
        >
          + Add location
        </button>
      )}
      {geo && <p className="text-xs text-neutral-500 dark:text-neutral-400">{geo}</p>}

      {template.id === 't2' && (
        <Card padding="lg">
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">Incident Type</label>
            <select
              value={(values.incidentType as string) || 'internal'}
              onChange={(e) => updateField('incidentType', e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white"
            >
              <option value="internal">Internal Incident</option>
              <option value="subcontractor">Subcontractor Incident</option>
            </select>
          </div>
        </Card>
      )}

      {template.sections.map((section) => (
        <Card key={section.id} padding="lg">
          <h2 className="font-display font-semibold text-lg text-neutral-900 dark:text-white mb-4">{section.title}</h2>
          <div className="space-y-4">
            {section.fields.map((field) => (
              <FieldRenderer
                key={field.id}
                field={field}
                value={values[field.id]}
                photo={photos[field.id]}
                onValue={(v) => updateField(field.id, v)}
                onPhoto={() => handlePhoto(field.id)}
              />
            ))}
          </div>
        </Card>
      ))}

      <div className="flex flex-col-reverse sm:flex-row gap-3 justify-end sticky bottom-4 bg-[rgb(var(--color-bg))] py-2">
        <Button variant="secondary" onClick={saveDraft} disabled={saving}>Save as draft</Button>
        <Button onClick={submit} disabled={saving}>{saving ? 'Saving...' : 'Submit'}</Button>
      </div>
    </div>
  )
}

function FieldRenderer({
  field,
  value,
  photo,
  onValue,
  onPhoto,
}: {
  field: FormField
  value?: string | boolean
  photo?: string
  onValue: (v: string | boolean) => void
  onPhoto: () => void
}) {
  if (field.type === 'text')
    return <Input label={field.label} required={field.required} value={(value as string) || ''} onChange={(e) => onValue(e.target.value)} />
  if (field.type === 'textarea')
    return <Textarea label={field.label} required={field.required} value={(value as string) || ''} onChange={(e) => onValue(e.target.value)} />
  if (field.type === 'checkbox')
    return <Checkbox label={field.label} checked={value === true} onChange={(e) => onValue(e.target.checked)} />
  if (field.type === 'date')
    return <Input label={field.label} type="date" required={field.required} value={(value as string) || ''} onChange={(e) => onValue(e.target.value)} />
  if (field.type === 'time')
    return <Input label={field.label} type="time" required={field.required} value={(value as string) || ''} onChange={(e) => onValue(e.target.value)} />
  if (field.type === 'photo')
    return (
      <div>
        <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">{field.label}</label>
        <button
          type="button"
          onClick={onPhoto}
          className="w-full min-h-[120px] rounded-xl border-2 border-dashed border-neutral-300 dark:border-neutral-600 hover:border-brand-500 hover:bg-brand-50/50 dark:hover:bg-brand-950/30 flex flex-col items-center justify-center gap-2 text-neutral-500 dark:text-neutral-400 transition-colors"
        >
          {photo ? <span className="text-sm text-brand-600">{photo}</span> : <>📷 Add photo</>}
        </button>
      </div>
    )
  return null
}
