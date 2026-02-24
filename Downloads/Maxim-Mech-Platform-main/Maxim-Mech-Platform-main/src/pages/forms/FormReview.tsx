import { useState, useEffect } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { useUser } from '@/contexts/UserContext'
import { useFormSubmissions } from '@/contexts/FormSubmissionsContext'
import { usePresence } from '@/contexts/PresenceContext'
import { Card } from '@/components/ui/Card'
import { EditingPresence } from '@/components/EditingPresence'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Textarea } from '@/components/ui/Textarea'
import { IconDownload } from '@/components/icons/NavIcons'
import { PdfViewer } from '@/components/PdfViewer'
import { NotFound } from '@/components/ui/NotFound'
import { MOCK_FORM_TEMPLATES, MOCK_FORM_TEMPLATE } from '@/data/mock'
import { MOCK_APP_USERS } from '@/data/mock'
import type { FormSubmissionStatus } from '@/types'

const STATUS_VARIANT: Record<FormSubmissionStatus, 'default' | 'warning' | 'success' | 'danger' | 'info'> = {
  draft: 'default',
  pending_site_signatures: 'warning',
  submitted: 'warning',
  approved: 'success',
  rejected: 'danger',
  archived: 'info',
}

const STATUS_LABEL: Record<FormSubmissionStatus, string> = {
  draft: 'Draft',
  pending_site_signatures: 'Awaiting site sign-offs',
  submitted: 'Submitted',
  approved: 'Approved',
  rejected: 'Rejected',
  archived: 'Archived',
}

export function FormReview() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useUser()
  const { getSubmission, updateSubmission, addAuditEvent } = useFormSubmissions()
  const { getPresence, addPresence, removePresence } = usePresence()
  const submission = id ? getSubmission(id) : undefined
  const template = submission ? (MOCK_FORM_TEMPLATES[submission.templateId] ?? MOCK_FORM_TEMPLATE) : MOCK_FORM_TEMPLATE
  const [comment, setComment] = useState('')
  const [loading, setLoading] = useState(false)
  const [reviewError, setReviewError] = useState('')
  const currentlyViewing = id ? getPresence('form', id) : []

  useEffect(() => {
    if (!id || !user) return
    addPresence('form', id, { id: user.id, name: user.name })
    updateSubmission(id, { lastOpenedAt: new Date().toISOString(), lastOpenedBy: user.name })
    return () => removePresence('form', id, user.id)
  }, [id, user?.id])

  const isSiteMeeting = submission?.workflowType === 'site_meeting'
  const siteSignerIds = submission?.siteSignerIds ?? []
  const siteSignatures = submission?.siteSignatures ?? []
  const allSiteSigned = siteSignerIds.length > 0 && siteSignatures.length >= siteSignerIds.length
  const isRep = submission?.submittedBy === user?.name
  const isSiteSigner = user?.id && siteSignerIds.includes(user.id)
  const hasSigned = user?.id && siteSignatures.some((s) => s.userId === user.id)
  const canSignAsSite = isSiteMeeting && submission?.status === 'pending_site_signatures' && isSiteSigner && !hasSigned
  const canSubmitToHr = isSiteMeeting && submission?.status === 'pending_site_signatures' && allSiteSigned && isRep
  const canReview = submission?.status === 'submitted' && user && (user.role === 'owner' || user.role === 'hr' || user.role === 'supervisor')
  const canArchive = submission?.status === 'approved' && user?.role === 'hr'
  const isLabourer = user?.role === 'labourer'
  const isMySubmission = submission?.submittedBy === user?.name || isSiteSigner

  useEffect(() => {
    if (isLabourer && !isMySubmission) navigate('/library?view=submissions', { replace: true })
  }, [isLabourer, isMySubmission, navigate])

  const approve = () => {
    if (!submission?.id) return
    setReviewError('')
    setLoading(true)
    addAuditEvent(submission.id, { type: 'approved', at: new Date().toISOString(), by: user?.name ?? 'Unknown', comment: comment || undefined })
    updateSubmission(submission.id, {
      status: 'approved',
      reviewedAt: new Date().toISOString(),
      reviewedBy: user?.name,
      reviewComment: comment || undefined,
      lastEditedAt: new Date().toISOString(),
      lastEditedBy: user?.name,
    })
    setTimeout(() => { setLoading(false); navigate('/library?view=submissions') }, 400)
  }

  const reject = () => {
    if (!submission?.id) return
    if (!comment.trim()) {
      setReviewError('Please add a comment when rejecting.')
      return
    }
    setReviewError('')
    setLoading(true)
    addAuditEvent(submission.id, { type: 'rejected', at: new Date().toISOString(), by: user?.name ?? 'Unknown', comment })
    updateSubmission(submission.id, {
      status: 'rejected',
      reviewedAt: new Date().toISOString(),
      reviewedBy: user?.name,
      reviewComment: comment,
      lastEditedAt: new Date().toISOString(),
      lastEditedBy: user?.name,
    })
    setTimeout(() => { setLoading(false); navigate('/library?view=submissions') }, 400)
  }

  const archive = () => {
    if (!submission?.id || user?.role !== 'hr') return
    setLoading(true)
    addAuditEvent(submission.id, { type: 'archived', at: new Date().toISOString(), by: user?.name ?? 'HR' })
    updateSubmission(submission.id, {
      status: 'archived',
      archivedAt: new Date().toISOString(),
      archivedBy: user?.name,
      lastEditedAt: new Date().toISOString(),
      lastEditedBy: user?.name,
    })
    setTimeout(() => { setLoading(false); navigate('/library?view=submissions') }, 400)
  }

  const signAsSite = () => {
    if (!submission?.id || !user?.id) return
    setLoading(true)
    const newSignatures = [...siteSignatures, { userId: user.id, signedAt: new Date().toISOString() }]
    addAuditEvent(submission.id, { type: 'site_signed', at: new Date().toISOString(), by: user?.name ?? 'Site' })
    updateSubmission(submission.id, { siteSignatures: newSignatures })
    setTimeout(() => setLoading(false), 400)
  }

  const submitToHr = () => {
    if (!submission?.id) return
    setLoading(true)
    addAuditEvent(submission.id, { type: 'sent_to_hr', at: new Date().toISOString(), by: user?.name ?? 'Rep' })
    updateSubmission(submission.id, {
      status: 'submitted',
      submittedToHrAt: new Date().toISOString(),
    })
    setTimeout(() => { setLoading(false); navigate('/library?view=submissions') }, 400)
  }

  if (!submission) {
    return (
      <NotFound
        title="Submission not found."
        backAction={<Link to="/library?view=submissions">Back to submissions</Link>}
      />
    )
  }

  if (isLabourer && !isMySubmission) return null

  const auditEvents = submission.auditEvents ?? []

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
      <div className="flex flex-wrap items-center gap-4">
        <Link to="/library?view=submissions" className="no-print touch-target p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-400">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="font-display font-bold text-xl text-neutral-900 dark:text-white truncate">{submission.templateName}</h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            Submission #{submission.id}
            {submission.siteName && ` · ${submission.siteName}`}
            {' · '}
            <Badge variant={STATUS_VARIANT[submission.status]}>{STATUS_LABEL[submission.status]}</Badge>
            {submission.status !== 'draft' && submission.status !== 'submitted' && (
              <span className="ml-2 text-xs text-neutral-400">All H&S actions are tracked. HR has final authority for approval and archival.</span>
            )}
          </p>
        </div>
        <Button variant="outline" size="sm" className="no-print shrink-0" leftIcon={<IconDownload />} onClick={() => window.print()}>Save as PDF</Button>
      </div>

      <EditingPresence
        currentlyViewing={currentlyViewing}
        lastOpenedAt={submission.lastOpenedAt}
        lastOpenedBy={submission.lastOpenedBy}
        lastEditedAt={submission.lastEditedAt}
        lastEditedBy={submission.lastEditedBy}
      />

      {/* Attachments & preview */}
      {submission.attachments && submission.attachments.length > 0 && (
        <Card padding="lg">
          <h2 className="font-display font-semibold text-lg mb-4">Attachments</h2>
          <ul className="space-y-3">
            {submission.attachments.map((a) => (
              <li key={a.id} className="flex flex-col sm:flex-row sm:items-center gap-3 py-3 px-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/50">
                {a.type === 'photo' ? (
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-brand-100 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400 text-xl">🖼</span>
                ) : (
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-neutral-200 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-400 text-xl">📄</span>
                )}
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-neutral-900 dark:text-white">{a.name}</p>
                  {a.uploadedAt && <p className="text-xs text-neutral-500">{new Date(a.uploadedAt).toLocaleString()}</p>}
                </div>
                <div className="shrink-0">
                  {a.fileDataUrl ? (
                    <PdfViewer fileDataUrl={a.fileDataUrl} fileName={a.name} size="sm" />
                  ) : a.url ? (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(a.url!, '_blank', 'noopener')}
                    >
                      Open in new tab
                    </Button>
                  ) : (
                    <span className="text-sm text-neutral-500 dark:text-neutral-400">No preview available</span>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {/* Signatures: who signed, who pending, timestamps */}
      {submission.signatures && submission.signatures.length > 0 && (
        <Card padding="lg">
          <h2 className="font-display font-semibold text-lg mb-4">Signatures</h2>
          <ul className="space-y-2">
            {submission.signatures.map((s) => (
              <li key={s.id} className="flex items-center justify-between py-2 px-3 rounded-xl bg-neutral-50 dark:bg-neutral-700/50">
                <div>
                  <span className="font-medium text-neutral-900 dark:text-white">{s.name}</span>
                  <span className="text-sm text-neutral-500 dark:text-neutral-400 ml-2">({s.role})</span>
                </div>
                <div className="flex items-center gap-2">
                  {s.signedAt && <span className="text-xs text-neutral-500">{new Date(s.signedAt).toLocaleString()}</span>}
                  <Badge variant={s.status === 'signed' ? 'success' : 'warning'}>{s.status === 'signed' ? 'Signed' : 'Pending'}</Badge>
                </div>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {/* Audit timeline */}
      <Card padding="lg">
        <h2 className="font-display font-semibold text-lg mb-4">Audit timeline</h2>
        <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-3">All form actions are tracked for compliance.</p>
        <ul className="space-y-3 text-sm">
          {!auditEvents.length && (
            <>
              {submission.status !== 'draft' && (
                <li className="flex gap-3">
                  <span className="text-neutral-400 shrink-0 w-32">—</span>
                  <span>Draft created</span>
                </li>
              )}
              {submission.submittedAt && (
                <li className="flex gap-3">
                  <span className="text-neutral-400 shrink-0 w-32">{new Date(submission.submittedAt).toLocaleString()}</span>
                  <span>Submitted by {submission.submittedBy}</span>
                </li>
              )}
              {submission.reviewedAt && (
                <li className="flex gap-3">
                  <span className="text-neutral-400 shrink-0 w-32">{new Date(submission.reviewedAt).toLocaleString()}</span>
                  <span>{submission.status === 'approved' ? 'Approved' : 'Rejected'} by {submission.reviewedBy}{submission.reviewComment ? ` — ${submission.reviewComment}` : ''}</span>
                </li>
              )}
            </>
          )}
          {auditEvents.map((e) => (
            <li key={e.id} className="flex gap-3">
              <span className="text-neutral-400 shrink-0 w-32">{new Date(e.at).toLocaleString()}</span>
              <span>
                {e.type === 'draft_created' && 'Draft created'}
                {e.type === 'submitted' && 'Submitted'}
                {e.type === 'review_started' && 'Review started'}
                {e.type === 'approved' && 'Approved'}
                {e.type === 'rejected' && 'Rejected'}
                {e.type === 'archived' && 'Archived'}
                {e.type === 'site_signed' && 'Site sign-off'}
                {e.type === 'sent_to_hr' && 'Sent to HR'}
                {' by '}{e.by}{e.comment ? ` — ${e.comment}` : ''}
              </span>
            </li>
          ))}
        </ul>
      </Card>

      {/* Site meeting workflow: H&S rep filled → site sign-offs → then to HR */}
      {isSiteMeeting && (
        <Card padding="lg" className="no-print border-l-4 border-amber-500">
          <h2 className="font-display font-semibold text-lg mb-2">Site meeting workflow</h2>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-4">H&S rep fills form → meeting with site personnel → all sign off → then sent to HR.</p>
          <ol className="space-y-2 text-sm mb-4">
            <li className="flex items-center gap-2">
              <span className="flex h-6 w-6 rounded-full bg-emerald-500 text-white text-xs font-medium items-center justify-center">1</span>
              Filled by rep — {submission.submittedBy} ✓
            </li>
            <li className="flex items-center gap-2">
              <span className="flex h-6 w-6 rounded-full bg-amber-500 text-white text-xs font-medium items-center justify-center">2</span>
              Site sign-offs — {siteSignatures.length} of {siteSignerIds.length} signed
            </li>
            <li className="flex items-center gap-2">
              <span className="flex h-6 w-6 rounded-full bg-neutral-300 dark:bg-neutral-600 text-neutral-700 dark:text-neutral-300 text-xs font-medium items-center justify-center">3</span>
              {submission.status === 'submitted' || submission.submittedToHrAt ? 'Sent to HR ✓' : 'Send to HR after all sign'}
            </li>
          </ol>
          <div className="mb-4">
            <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">Site personnel sign-offs</p>
            <ul className="space-y-2">
              {siteSignerIds.map((uid) => {
                const person = MOCK_APP_USERS.find((u) => u.id === uid)
                const sig = siteSignatures.find((s) => s.userId === uid)
                return (
                  <li key={uid} className="flex items-center justify-between py-2 px-3 rounded-xl bg-neutral-50 dark:bg-neutral-700/50">
                    <span className="font-medium text-neutral-900 dark:text-white">{person?.name ?? uid}</span>
                    {sig ? <Badge variant="success">{new Date(sig.signedAt).toLocaleString()}</Badge> : <Badge variant="warning">Pending</Badge>}
                  </li>
                )
              })}
            </ul>
          </div>
          {canSignAsSite && (
            <Button onClick={signAsSite} disabled={loading}>{loading ? 'Signing...' : 'Sign as site personnel'}</Button>
          )}
          {canSubmitToHr && (
            <Button onClick={submitToHr} disabled={loading}>{loading ? 'Sending...' : 'Submit to HR'}</Button>
          )}
        </Card>
      )}

      {/* Form data — structured read-only */}
      {template.sections.map((section) => (
        <Card key={section.id} padding="lg">
          <h2 className="font-display font-semibold text-lg text-neutral-900 dark:text-white mb-4">{section.title}</h2>
          <div className="space-y-3 text-sm">
            {section.fields.map((f) => (
              <div key={f.id} className="flex flex-col gap-0.5">
                <span className="text-neutral-500 dark:text-neutral-400">{f.label}</span>
                <span className="text-neutral-900 dark:text-white">[Read-only value]</span>
              </div>
            ))}
          </div>
        </Card>
      ))}

      {/* Review actions: Approve / Reject + comment */}
      {canReview && (
        <Card padding="lg" className="no-print">
          <h2 className="font-display font-semibold text-lg mb-4">Review</h2>
          <Textarea
            label="Comments"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder={submission.status === 'submitted' ? 'Add feedback (required when rejecting)...' : 'Optional note for submitter'}
            className="mb-4"
          />
          {reviewError && <p className="text-sm text-red-600 dark:text-red-400 mb-2">{reviewError}</p>}
          <div className="flex flex-wrap gap-3">
            <Button variant="danger" onClick={reject} disabled={loading}>Reject</Button>
            <Button onClick={approve} disabled={loading}>{loading ? 'Processing...' : 'Approve'}</Button>
          </div>
        </Card>
      )}

      {/* Archive — HR only */}
      {canArchive && (
        <Card padding="lg" className="no-print">
          <h2 className="font-display font-semibold text-lg mb-2">Archive</h2>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-3">HR has final authority. Archiving moves this form to archived state.</p>
          <Button variant="secondary" onClick={archive} disabled={loading}>{loading ? 'Archiving...' : 'Archive form'}</Button>
        </Card>
      )}

      {/* Show review outcome for submitter */}
      {submission.status === 'rejected' && submission.reviewComment && isMySubmission && (
        <Card padding="lg">
          <h2 className="font-display font-semibold text-lg mb-2">Feedback</h2>
          <p className="text-neutral-700 dark:text-neutral-300">{submission.reviewComment}</p>
        </Card>
      )}
    </div>
  )
}
