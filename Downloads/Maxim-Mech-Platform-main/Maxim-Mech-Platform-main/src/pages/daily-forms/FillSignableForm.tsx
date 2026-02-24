import { useState, useCallback, useMemo } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { Card, CardHeader, CardDescription } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { MOCK_DAILY_FORMS_TO_COMPLETE, MOCK_JOBS, MOCK_JOB_ASSIGNMENTS, MOCK_APP_USERS } from '@/data/mock'
import { useSignableTemplates } from '@/contexts/SignableTemplatesContext'
import { useSignableSubmissions } from '@/contexts/SignableSubmissionsContext'
import { useUser } from '@/contexts/UserContext'
import type { PlacedFormField } from '@/types'

/** Labourers assigned to jobs where the given user is a supervisor */
function labourersForSupervisor(supervisorId: string) {
  const jobIds = MOCK_JOBS.filter((j) => (j.assignedSupervisorIds ?? []).includes(supervisorId)).map((j) => j.id)
  const labourerIds = new Set(MOCK_JOB_ASSIGNMENTS.filter((a) => jobIds.includes(a.jobId)).map((a) => a.userId))
  return MOCK_APP_USERS.filter((u) => u.role === 'labourer' && labourerIds.has(u.id))
}

export function FillSignableForm() {
  const { dailyFormId } = useParams()
  const navigate = useNavigate()
  const { user } = useUser()
  const { templates } = useSignableTemplates()
  const { addSubmission } = useSignableSubmissions()
  const dailyForm = MOCK_DAILY_FORMS_TO_COMPLETE.find((f) => f.id === dailyFormId)
  const template = templates.find((t) => t.id === dailyForm?.signableFormId)
  const fields = template?.placedFields ?? []

  const [values, setValues] = useState<Record<string, string>>({})
  const [signatureText, setSignatureText] = useState(user?.name ?? '')
  const [, setGeo] = useState<{ lat: number; lng: number; address?: string } | null>(null)
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [sendToLabourers, setSendToLabourers] = useState(false)
  const [selectedLabourerIds, setSelectedLabourerIds] = useState<string[]>([])

  const isSupervisor = user?.role === 'supervisor'
  const myLabourers = useMemo(() => (user?.id ? labourersForSupervisor(user.id) : []), [user?.id])
  const hasLabourers = myLabourers.length > 0

  const hasPosition = (f: PlacedFormField) => typeof f.x === 'number' && typeof f.y === 'number'
  const fieldsOnPdf = fields.filter(hasPosition)
  const fieldsListOnly = fields.filter((f) => !hasPosition(f))

  const captureGeo = useCallback(() => {
    if (!navigator.geolocation) {
      setGeo({ lat: 49.2827, lng: -123.1207, address: 'Location unavailable (mock)' })
      return
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => setGeo({ lat: pos.coords.latitude, lng: pos.coords.longitude, address: undefined }),
      () => setGeo({ lat: 49.2827, lng: -123.1207, address: 'Permission denied (mock)' })
    )
  }, [])

  const submit = () => {
    const required = fields.filter((f) => f.required)
    const missing = required.filter((f) => (f.type === 'signature' ? !signatureText.trim() : !values[f.id]?.trim()))
    if (missing.length > 0) {
      alert(`Please fill: ${missing.map((f) => f.label).join(', ')}`)
      return
    }
    if (sendToLabourers && selectedLabourerIds.length === 0) {
      alert('Select at least one labourer to send the form to for signing.')
      return
    }
    setLoading(true)
    captureGeo()
    const fieldValues: Record<string, string> = { ...values }
    fields.forEach((f) => {
      if (f.type === 'signature') fieldValues[f.id] = signatureText.trim()
    })
    const id = `ss-${Date.now()}`
    const now = new Date().toISOString()
    const submission = {
      id,
      signableFormId: template!.id,
      templateName: template!.name,
      dailyFormId: dailyForm!.id,
      submittedBy: user?.name ?? 'Unknown',
      submittedAt: now,
      fieldValues,
      signatureText: signatureText.trim(),
      ...(sendToLabourers && selectedLabourerIds.length > 0
        ? { workflowType: 'site_meeting' as const, siteSignerIds: selectedLabourerIds, siteSignatures: [] }
        : {}),
    }
    addSubmission(submission)
    setTimeout(() => {
      setLoading(false)
      setSubmitted(true)
    }, 800)
  }

  if (!dailyForm || !template) {
    return (
      <div className="space-y-4 animate-fade-in">
        <p className="text-neutral-500 dark:text-neutral-400">Form not found.</p>
        <Link to="/daily-forms" className="text-brand-600 dark:text-brand-400 hover:underline">Back to daily forms</Link>
      </div>
    )
  }

  if (fields.length === 0) {
    return (
      <div className="space-y-4 animate-fade-in">
        <p className="text-neutral-500 dark:text-neutral-400">This form has no fillable fields. Use Custom forms to add fields.</p>
        <Link to="/daily-forms" className="text-brand-600 dark:text-brand-400 hover:underline">Back to daily forms</Link>
      </div>
    )
  }

  if (submitted) {
    return (
      <div className="max-w-xl mx-auto space-y-6 animate-fade-in">
        <Card padding="lg" className="text-center">
          <div className="text-5xl text-emerald-500 mb-4">✓</div>
          <CardHeader>Form submitted</CardHeader>
          <CardDescription>Your responses and signature have been saved.</CardDescription>
          <Button className="mt-4" onClick={() => navigate('/daily-forms')}>Back to daily forms</Button>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
      <div className="flex items-center gap-4">
        <Link to="/daily-forms" className="touch-target p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-400">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
        </Link>
        <div>
          <h1 className="font-display font-bold text-xl text-neutral-900 dark:text-white">{template.name}</h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400">Due {new Date(dailyForm.dueDate).toLocaleDateString()}</p>
        </div>
      </div>

      {/* Document with fields on it (DocuSign-style) when fields have position */}
      {fieldsOnPdf.length > 0 && (
        <Card padding="lg">
          <CardHeader>Fill in the form</CardHeader>
          <CardDescription>Complete each field on the document below.</CardDescription>
          <div
            className="relative mx-auto mt-4 bg-white dark:bg-neutral-100 shadow-lg border border-neutral-300 dark:border-neutral-600 rounded-sm overflow-visible"
            style={{ aspectRatio: '210/297', maxWidth: '100%' }}
          >
            {/* Mock document background */}
            <div className="absolute inset-0 p-6 text-neutral-400 dark:text-neutral-500 text-sm pointer-events-none select-none">
              <div className="border-b border-neutral-200 dark:border-neutral-400 pb-2 mb-4 font-medium">{template.name}</div>
              <div className="space-y-2 opacity-60">
                <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit.</p>
                <p>Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.</p>
                <p>Ut enim ad minim veniam, quis nostrud exercitation.</p>
              </div>
            </div>
            {/* Input overlays at saved positions */}
            {fieldsOnPdf.map((f) => (
              <div
                key={f.id}
                className="absolute z-10 flex flex-col"
                style={{
                  left: `${f.x ?? 0}%`,
                  top: `${f.y ?? 0}%`,
                  width: `${f.width ?? 28}%`,
                  height: `${f.height ?? 6}%`,
                }}
              >
                {f.type === 'signature' ? (
                  <>
                    <label className="text-[10px] font-medium text-neutral-600 dark:text-neutral-400 truncate">{f.label}{f.required && <span className="text-red-500 dark:text-red-400"> *</span>}</label>
                    <input
                      type="text"
                      value={signatureText}
                      onChange={(e) => setSignatureText(e.target.value)}
                      placeholder="Type your name"
                      className="flex-1 min-h-0 w-full px-1 py-0.5 text-xs border border-neutral-300 dark:border-neutral-600 rounded bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white"
                    />
                  </>
                ) : f.type === 'date' ? (
                  <>
                    <label className="text-[10px] font-medium text-neutral-600 dark:text-neutral-400 truncate">{f.label}{f.required && <span className="text-red-500 dark:text-red-400"> *</span>}</label>
                    <input
                      type="date"
                      value={values[f.id] ?? ''}
                      onChange={(e) => setValues((v) => ({ ...v, [f.id]: e.target.value }))}
                      className="flex-1 min-h-0 w-full px-1 py-0.5 text-xs border border-neutral-300 dark:border-neutral-600 rounded bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white"
                    />
                  </>
                ) : (
                  <>
                    <label className="text-[10px] font-medium text-neutral-600 dark:text-neutral-400 truncate">{f.label}{f.required && <span className="text-red-500 dark:text-red-400"> *</span>}</label>
                    <input
                      type="text"
                      value={values[f.id] ?? ''}
                      onChange={(e) => setValues((v) => ({ ...v, [f.id]: e.target.value }))}
                      placeholder={f.label}
                      className="flex-1 min-h-0 w-full px-1 py-0.5 text-xs border border-neutral-300 dark:border-neutral-600 rounded bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white"
                    />
                  </>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Fallback: list of fields without position (or all if none have position) */}
      {fieldsListOnly.length > 0 && (
        <Card padding="lg">
          <CardHeader>{fieldsOnPdf.length > 0 ? 'Additional fields' : 'Fill out the form'}</CardHeader>
          <CardDescription>Complete all required fields and sign.</CardDescription>
          <div className="mt-4 space-y-4">
            {fieldsListOnly.filter((f) => f.type !== 'signature').map((f) => (
              <div key={f.id}>
                {f.type === 'date' ? (
                  <Input label={f.label} type="date" value={values[f.id] ?? ''} onChange={(e) => setValues((v) => ({ ...v, [f.id]: e.target.value }))} required={f.required} />
                ) : (
                  <Input label={f.label} value={values[f.id] ?? ''} onChange={(e) => setValues((v) => ({ ...v, [f.id]: e.target.value }))} required={f.required} />
                )}
              </div>
            ))}
            {fieldsListOnly.some((f) => f.type === 'signature') && (
              <div>
                <Input label="Signature (type your full name)" value={signatureText} onChange={(e) => setSignatureText(e.target.value)} placeholder="Full name" required />
              </div>
            )}
          </div>
        </Card>
      )}

      {/* If all fields are on PDF, we still need a signature if it's in fieldsOnPdf (already rendered above). Show submit and note. */}
      {fieldsOnPdf.length > 0 && !fieldsListOnly.some((f) => f.type === 'signature') && fields.some((f) => f.type === 'signature') && (
        <p className="text-xs text-neutral-500 dark:text-neutral-400">Sign in the signature field on the document above.</p>
      )}

      {isSupervisor && (
        <Card padding="md">
          <CardHeader className="text-base">Send to labourers to sign</CardHeader>
          <CardDescription>After you sign, your labourers can add their signature. They will see this form under Forms & documents → Signing or Daily forms → Waiting for your signature.</CardDescription>
          {hasLabourers ? (
            <>
              <label className="mt-3 flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={sendToLabourers}
                  onChange={(e) => { setSendToLabourers(e.target.checked); if (!e.target.checked) setSelectedLabourerIds([]) }}
                  className="rounded border-neutral-300 text-brand-600"
                />
                <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Also send to my labourers to sign</span>
              </label>
              {sendToLabourers && (
                <div className="mt-3 pl-6 space-y-2">
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">Select who must sign:</p>
                  {myLabourers.map((lab) => (
                    <label key={lab.id} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedLabourerIds.includes(lab.id)}
                        onChange={(e) => setSelectedLabourerIds((ids) => e.target.checked ? [...ids, lab.id] : ids.filter((i) => i !== lab.id))}
                        className="rounded border-neutral-300 text-brand-600"
                      />
                      <span className="text-sm text-neutral-800 dark:text-neutral-200">{lab.name}</span>
                    </label>
                  ))}
                </div>
              )}
            </>
          ) : (
            <p className="mt-3 text-sm text-neutral-500 dark:text-neutral-400">You have no labourers assigned to your jobs. Assign labourers in <Link to="/jobs" className="text-brand-600 dark:text-brand-400 hover:underline">Job management</Link> (or as supervisor on a job in My jobs) to send forms for their signature.</p>
          )}
        </Card>
      )}

      <Button className="w-full" onClick={submit} disabled={loading}>{loading ? 'Submitting…' : 'Submit'}</Button>
    </div>
  )
}
