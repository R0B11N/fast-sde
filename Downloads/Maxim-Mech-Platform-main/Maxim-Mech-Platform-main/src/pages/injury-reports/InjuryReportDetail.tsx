import { useState, useEffect } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useUser } from '@/contexts/UserContext'
import { useRootCause } from '@/contexts/RootCauseContext'
import { useInjuryReports } from '@/contexts/InjuryReportsContext'
import { useSubcontractors } from '@/contexts/SubcontractorsContext'
import { Card, CardHeader, CardDescription } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Breadcrumbs } from '@/components/ui/Breadcrumbs'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { MOCK_JOBS } from '@/data/mock'
import type { InjuryReport } from '@/types'

export function InjuryReportDetail() {
  const { id } = useParams()
  const { user } = useUser()
  const { getByLinked } = useRootCause()
  const { getReport, updateReport } = useInjuryReports()
  const { subcontractors } = useSubcontractors()
  const report = id ? getReport(id) : undefined
  const rootCause = id ? getByLinked('injury', id) : undefined

  const [isEditing, setIsEditing] = useState(false)
  const [form, setForm] = useState<Partial<InjuryReport>>({})

  useEffect(() => {
    if (report) setForm({ ...report })
  }, [report?.id, isEditing])

  if (user?.role !== 'hr' && user?.role !== 'owner') return null
  if (!report) {
    return (
      <div className="space-y-4 animate-fade-in">
        <Breadcrumbs items={[{ label: 'Injury reports', to: '/injury-reports' }, { label: 'Not found' }]} />
        <p className="text-neutral-500 dark:text-neutral-400">Report not found.</p>
        <Link to="/injury-reports" className="text-brand-600 dark:text-brand-400 hover:underline">Back to injury reports</Link>
      </div>
    )
  }

  const r = report
  const handleSave = () => {
    if (!id) return
    updateReport(id, {
      siteName: form.siteName?.trim(),
      reportedBy: form.reportedBy?.trim(),
      reportedAt: form.reportedAt?.trim(),
      status: form.status ?? r.status,
      severity: form.severity ?? r.severity,
      description: form.description?.trim(),
      followUpNotes: form.followUpNotes?.trim() || undefined,
      injuredPersonName: form.injuredPersonName?.trim() || r.injuredPersonName || undefined,
      injuredPersonId: form.injuredPersonId || undefined,
      injuryType: form.injuryType || undefined,
      bodyPart: form.bodyPart || undefined,
      mechanism: form.mechanism || undefined,
      dateOfInjury: form.dateOfInjury || undefined,
      lostTime: form.lostTime,
      daysAwayFromWork: form.daysAwayFromWork,
      restrictedDutyDays: form.restrictedDutyDays,
      jobId: form.jobId || undefined,
      wsibReported: form.wsibReported,
      wsibClaimNumber: form.wsibClaimNumber?.trim() || undefined,
      wsibReportedAt: form.wsibReportedAt || undefined,
      subcontractorId: form.subcontractorId || undefined,
    })
    setIsEditing(false)
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <Breadcrumbs items={[{ label: 'Injury reports', to: '/injury-reports' }, { label: r.siteName + ' — ' + (r.injuredPersonName || r.description).slice(0, 30) }]} />
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link to="/injury-reports" className="touch-target p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-400">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          </Link>
          <div>
            <h1 className="font-display font-bold text-display-xl text-neutral-900 dark:text-white tracking-tight">Injury report</h1>
            <p className="text-neutral-500 dark:text-neutral-400 mt-0.5">
              {!isEditing ? `${r.siteName} · ${r.reportedAt}` : 'Edit all fields below'}
            </p>
          </div>
        </div>
        {!isEditing ? (
          <Button onClick={() => setIsEditing(true)}>Edit</Button>
        ) : (
          <div className="flex gap-2">
            <Button onClick={handleSave}>Save</Button>
            <Button variant="ghost" onClick={() => setIsEditing(false)}>Cancel</Button>
          </div>
        )}
      </div>

      <Card padding="lg">
        <CardHeader>Details</CardHeader>
        {!isEditing ? (
          <div className="mt-4 space-y-3 text-sm">
            <p><span className="font-medium text-neutral-700 dark:text-neutral-300">Reported by:</span> {r.reportedBy}</p>
            <p><span className="font-medium text-neutral-700 dark:text-neutral-300">Injured person:</span> {r.injuredPersonName || '—'}</p>
            {r.injuryType && <p><span className="font-medium text-neutral-700 dark:text-neutral-300">Injury type:</span> {r.injuryType.replace(/-/g, ' ')}</p>}
            {r.bodyPart && <p><span className="font-medium text-neutral-700 dark:text-neutral-300">Body part:</span> {r.bodyPart.replace(/-/g, ' ')}</p>}
            {r.mechanism && <p><span className="font-medium text-neutral-700 dark:text-neutral-300">Mechanism:</span> {r.mechanism.replace(/-/g, ' ')}</p>}
            {r.dateOfInjury && <p><span className="font-medium text-neutral-700 dark:text-neutral-300">Date of injury:</span> {r.dateOfInjury}</p>}
            <p><span className="font-medium text-neutral-700 dark:text-neutral-300">Severity:</span> <Badge variant={r.severity === 'major' ? 'danger' : 'warning'}>{r.severity}</Badge></p>
            <p><span className="font-medium text-neutral-700 dark:text-neutral-300">Status:</span> <Badge>{r.status}</Badge></p>
            {r.lostTime && <p><span className="font-medium text-neutral-700 dark:text-neutral-300">Lost time:</span> Yes{r.daysAwayFromWork != null ? ` · ${r.daysAwayFromWork} day(s) away` : ''}{r.restrictedDutyDays != null ? ` · ${r.restrictedDutyDays} restricted` : ''}</p>}
            {r.subcontractorId && (
              <p>
                <span className="font-medium text-neutral-700 dark:text-neutral-300">Subcontractor:</span>{' '}
                <Link to={`/subcontractors/${r.subcontractorId}`} className="text-brand-600 dark:text-brand-400 hover:underline">
                  {subcontractors.find((s) => s.id === r.subcontractorId)?.companyName ?? r.subcontractorId}
                </Link>
              </p>
            )}
            <p><span className="font-medium text-neutral-700 dark:text-neutral-300">Description:</span></p>
            <p className="text-neutral-600 dark:text-neutral-400 pl-0">{r.description}</p>
            {r.photoUrl && (
              <div className="mt-3">
                <p className="font-medium text-neutral-700 dark:text-neutral-300 mb-1">Scene / injury photo</p>
                <img src={r.photoUrl} alt="Injury or scene" className="rounded-lg border border-neutral-200 dark:border-neutral-600 max-w-sm max-h-48 object-cover" />
              </div>
            )}
          </div>
        ) : (
          <div className="mt-4 space-y-3">
            <Input label="Injured person (name)" value={form.injuredPersonName ?? ''} onChange={(e) => setForm((f) => ({ ...f, injuredPersonName: e.target.value }))} placeholder="Who was injured" />
            <Input label="Site name" value={form.siteName ?? ''} onChange={(e) => setForm((f) => ({ ...f, siteName: e.target.value }))} />
            <Input label="Reported by" value={form.reportedBy ?? ''} onChange={(e) => setForm((f) => ({ ...f, reportedBy: e.target.value }))} />
            <Input label="Reported at" type="datetime-local" value={form.reportedAt ? form.reportedAt.slice(0, 16) : ''} onChange={(e) => setForm((f) => ({ ...f, reportedAt: e.target.value ? new Date(e.target.value).toISOString() : '' }))} />
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">Status</label>
              <select value={form.status ?? r.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as InjuryReport['status'] }))} className="w-full min-h-[44px] px-4 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white">
                <option value="draft">draft</option>
                <option value="submitted">submitted</option>
                <option value="under-review">under-review</option>
                <option value="closed">closed</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">Severity</label>
              <select value={form.severity ?? r.severity} onChange={(e) => setForm((f) => ({ ...f, severity: e.target.value as InjuryReport['severity'] }))} className="w-full min-h-[44px] px-4 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white">
                <option value="minor">minor</option>
                <option value="moderate">moderate</option>
                <option value="major">major</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">Injury type</label>
              <select value={form.injuryType ?? ''} onChange={(e) => setForm((f) => ({ ...f, injuryType: (e.target.value || undefined) as InjuryReport['injuryType'] }))} className="w-full min-h-[44px] px-4 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white" title="Injury type">
                <option value="">—</option>
                <option value="laceration">Laceration</option>
                <option value="fracture">Fracture</option>
                <option value="strain">Strain</option>
                <option value="sprain">Sprain</option>
                <option value="burn">Burn</option>
                <option value="contusion">Contusion</option>
                <option value="amputation">Amputation</option>
                <option value="puncture">Puncture</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">Body part</label>
              <select value={form.bodyPart ?? ''} onChange={(e) => setForm((f) => ({ ...f, bodyPart: (e.target.value || undefined) as InjuryReport['bodyPart'] }))} className="w-full min-h-[44px] px-4 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white" title="Body part">
                <option value="">—</option>
                <option value="hand">Hand</option>
                <option value="finger">Finger</option>
                <option value="arm">Arm</option>
                <option value="back">Back</option>
                <option value="shoulder">Shoulder</option>
                <option value="head">Head</option>
                <option value="eye">Eye</option>
                <option value="leg">Leg</option>
                <option value="knee">Knee</option>
                <option value="foot">Foot</option>
                <option value="torso">Torso</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">Mechanism</label>
              <select value={form.mechanism ?? ''} onChange={(e) => setForm((f) => ({ ...f, mechanism: (e.target.value || undefined) as InjuryReport['mechanism'] }))} className="w-full min-h-[44px] px-4 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white" title="Mechanism">
                <option value="">—</option>
                <option value="struck-by">Struck by</option>
                <option value="struck-against">Struck against</option>
                <option value="caught-in">Caught in</option>
                <option value="fall-same-level">Fall same level</option>
                <option value="fall-elevation">Fall from elevation</option>
                <option value="overexertion">Overexertion</option>
                <option value="contact-with">Contact with</option>
                <option value="exposure">Exposure</option>
                <option value="other">Other</option>
              </select>
            </div>
            <Input label="Date of injury" type="date" value={form.dateOfInjury ?? ''} onChange={(e) => setForm((f) => ({ ...f, dateOfInjury: e.target.value || undefined }))} />
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={form.lostTime ?? false} onChange={(e) => setForm((f) => ({ ...f, lostTime: e.target.checked }))} className="rounded border-slate-300" />
              <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Lost time injury</span>
            </label>
            {(form.lostTime ?? r.lostTime) && (
              <>
                <Input label="Days away from work" type="number" min={0} value={form.daysAwayFromWork ?? ''} onChange={(e) => setForm((f) => ({ ...f, daysAwayFromWork: e.target.value ? Number(e.target.value) : undefined }))} />
                <Input label="Restricted duty days" type="number" min={0} value={form.restrictedDutyDays ?? ''} onChange={(e) => setForm((f) => ({ ...f, restrictedDutyDays: e.target.value ? Number(e.target.value) : undefined }))} />
              </>
            )}
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">Job (optional)</label>
              <select value={form.jobId ?? ''} onChange={(e) => setForm((f) => ({ ...f, jobId: e.target.value || undefined }))} className="w-full min-h-[44px] px-4 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white">
                <option value="">—</option>
                {MOCK_JOBS.map((j) => (
                  <option key={j.id} value={j.id}>{j.title} — {j.siteName}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">Subcontractor (optional)</label>
              <select value={form.subcontractorId ?? ''} onChange={(e) => setForm((f) => ({ ...f, subcontractorId: e.target.value || undefined }))} className="w-full min-h-[44px] px-4 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white">
                <option value="">—</option>
                {subcontractors.map((s) => (
                  <option key={s.id} value={s.id}>{s.companyName}</option>
                ))}
              </select>
            </div>
            <Textarea label="Description" value={form.description ?? ''} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
          </div>
        )}
      </Card>

      <Card padding="lg">
        <CardHeader>Follow-up notes (HR)</CardHeader>
        <CardDescription>In-depth notes, next steps, and outcome</CardDescription>
        {!isEditing ? (
          <>
            <p className="mt-4 text-neutral-600 dark:text-neutral-400 min-h-[60px]">{r.followUpNotes || '—'}</p>
          </>
        ) : (
          <Textarea className="mt-4" value={form.followUpNotes ?? ''} onChange={(e) => setForm((f) => ({ ...f, followUpNotes: e.target.value }))} placeholder="Add follow-up notes..." />
        )}
      </Card>

      <Card padding="lg">
        <CardHeader>WSIB / workers&apos; comp</CardHeader>
        <CardDescription>Claim and reporting status</CardDescription>
        {!isEditing ? (
          (r.wsibReported ?? r.wsibClaimNumber) ? (
            <div className="mt-4 space-y-2 text-sm">
              <p><span className="font-medium text-neutral-700 dark:text-neutral-300">Reported to WSIB:</span> {r.wsibReported ? 'Yes' : 'No'}</p>
              {r.wsibClaimNumber && <p><span className="font-medium text-neutral-700 dark:text-neutral-300">Claim #:</span> {r.wsibClaimNumber}</p>}
              {r.wsibReportedAt && <p><span className="font-medium text-neutral-700 dark:text-neutral-300">Reported at:</span> {new Date(r.wsibReportedAt).toLocaleString()}</p>}
            </div>
          ) : (
            <p className="mt-2 text-sm text-neutral-500">No WSIB info on file.</p>
          )
        ) : (
          <div className="mt-4 space-y-3">
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={form.wsibReported ?? false} onChange={(e) => setForm((f) => ({ ...f, wsibReported: e.target.checked }))} className="rounded border-slate-300" />
              <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Reported to WSIB</span>
            </label>
            <Input label="Claim number" value={form.wsibClaimNumber ?? ''} onChange={(e) => setForm((f) => ({ ...f, wsibClaimNumber: e.target.value }))} />
            <Input label="Reported at" type="datetime-local" value={form.wsibReportedAt ? form.wsibReportedAt.slice(0, 16) : ''} onChange={(e) => setForm((f) => ({ ...f, wsibReportedAt: e.target.value ? new Date(e.target.value).toISOString() : undefined }))} />
          </div>
        )}
      </Card>

      {rootCause ? (
        <Card padding="lg">
          <CardHeader>Root cause analysis</CardHeader>
          <CardDescription>Analyzed by {rootCause.analyzedBy} · {new Date(rootCause.analyzedAt).toLocaleString()}</CardDescription>
          <div className="mt-4 space-y-2 text-sm">
            <p><span className="font-medium text-neutral-700 dark:text-neutral-300">Immediate cause:</span> {rootCause.immediateCause}</p>
            {rootCause.contributingCauses.length > 0 && <p><span className="font-medium text-neutral-700 dark:text-neutral-300">Contributing:</span> {rootCause.contributingCauses.join('; ')}</p>}
            {rootCause.underlyingCause && <p><span className="font-medium text-neutral-700 dark:text-neutral-300">Underlying:</span> {rootCause.underlyingCause}</p>}
          </div>
          <Link to={`/injury-reports/${id}/root-cause`} className="mt-3 inline-block"><Button size="sm" variant="ghost">Edit analysis</Button></Link>
        </Card>
      ) : (
        <Card padding="lg">
          <CardHeader>Root cause analysis</CardHeader>
          <CardDescription>Capture immediate, contributing, and underlying causes for prevention and regulatory reporting.</CardDescription>
          <Link to={`/injury-reports/${id}/root-cause`} className="mt-3 inline-block"><Button size="sm">Add root cause analysis</Button></Link>
        </Card>
      )}

      {!isEditing && (
        <Card padding="lg">
          <CardHeader>Update status</CardHeader>
          <div className="mt-3 flex flex-wrap gap-2">
            {r.status !== 'under-review' && <Button size="sm" variant="secondary" onClick={() => updateReport(id!, { status: 'under-review' })}>Mark under review</Button>}
            {r.status !== 'closed' && <Button size="sm" variant="secondary" onClick={() => updateReport(id!, { status: 'closed' })}>Close report</Button>}
          </div>
        </Card>
      )}
    </div>
  )
}
