import { useState, useMemo, useEffect } from 'react'
import { Link, useSearchParams, useLocation } from 'react-router-dom'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'
import { IconDownload } from '@/components/icons/NavIcons'
import { useUser } from '@/contexts/UserContext'
import { useDocuments } from '@/contexts/DocumentsContext'
import { useSignableTemplates } from '@/contexts/SignableTemplatesContext'
import { canUserViewDocument } from '@/utils/documentAccess'
import { canUserAccessTemplate } from '@/utils/templateAccess'
import { MOCK_SIGNATURE_REQUESTS, MOCK_FORM_TEMPLATES } from '@/data/mock'
import { useFormSubmissions } from '@/contexts/FormSubmissionsContext'
import { useSignableSubmissions } from '@/contexts/SignableSubmissionsContext'

export type LibraryView = 'templates' | 'submissions' | 'documents' | 'signing'

const VIEWS: { value: LibraryView; label: string }[] = [
  { value: 'templates', label: 'Templates' },
  { value: 'submissions', label: 'Submissions' },
  { value: 'documents', label: 'Documents' },
  { value: 'signing', label: 'Signing' },
]

type SubmissionFilter = 'all' | 'draft' | 'pending_site_signatures' | 'submitted' | 'approved' | 'rejected' | 'archived'

export function Library() {
  const { user } = useUser()
  const location = useLocation()
  const [searchParams, setSearchParams] = useSearchParams()
  const view = (searchParams.get('view') as LibraryView) || 'templates'
  const [message, setMessage] = useState<string | null>(null)
  useEffect(() => {
    const state = location.state as { message?: string } | null
    if (state?.message) {
      setMessage(state.message)
      window.history.replaceState({}, '')
    }
  }, [location.state])
  const submissionFilter = (searchParams.get('status') as SubmissionFilter) || 'all'
  const [search, setSearch] = useState('')
  const [docTypeFilter, setDocTypeFilter] = useState<string>('all')
  const [docSiteFilter, setDocSiteFilter] = useState<string>('all')

  const { templates } = useSignableTemplates()
  const { documents } = useDocuments()
  const { submissions: formSubmissions } = useFormSubmissions()
  const { submissions: signableSubmissions } = useSignableSubmissions()
  const isOwnerOrHr = user?.role === 'owner' || user?.role === 'hr'
  const isLabourer = user?.role === 'labourer'

  const visibleTemplates = useMemo(
    () => templates.filter((t) => canUserAccessTemplate(t, user ?? null)),
    [templates, user]
  )
  const baseSubmissions = useMemo(() => {
    if (isLabourer) return formSubmissions.filter((f) => f.submittedBy === user?.name)
    return formSubmissions
  }, [formSubmissions, isLabourer, user?.name])
  const filteredSubmissions = useMemo(() => {
    let list = baseSubmissions
    if (submissionFilter !== 'all') list = list.filter((f) => f.status === submissionFilter)
    if (search.trim()) list = list.filter((f) => f.templateName.toLowerCase().includes(search.toLowerCase()))
    return list
  }, [baseSubmissions, submissionFilter, search])

  const visibleDocs = useMemo(
    () => documents.filter((d) => canUserViewDocument(d, user ?? null)),
    [documents, user]
  )
  const filteredDocs = useMemo(() => {
    let list = visibleDocs
    if (docTypeFilter !== 'all') list = list.filter((d) => d.type === docTypeFilter)
    if (docSiteFilter !== 'all') list = list.filter((d) => d.siteName === docSiteFilter)
    return list
  }, [visibleDocs, docTypeFilter, docSiteFilter])
  const docTypes = Array.from(new Set(visibleDocs.map((d) => d.type)))
  const docSites = Array.from(new Set(visibleDocs.map((d) => d.siteName).filter(Boolean))) as string[]

  const signingRequests = useMemo(() => {
    const isSigner = (r: (typeof MOCK_SIGNATURE_REQUESTS)[0]) =>
      r.requiredSigners.some((s) => s.userId === user?.id || s.name === user?.name)
    return isLabourer ? MOCK_SIGNATURE_REQUESTS.filter(isSigner) : MOCK_SIGNATURE_REQUESTS
  }, [user, isLabourer])

  const siteMeetingFormsAwaitingMySignature = useMemo(() => {
    if (!user?.id) return []
    return formSubmissions.filter(
      (s) =>
        s.workflowType === 'site_meeting' &&
        s.status === 'pending_site_signatures' &&
        s.siteSignerIds?.includes(user.id) &&
        !s.siteSignatures?.some((sig) => sig.userId === user.id)
    )
  }, [formSubmissions, user?.id])

  const signableFormsAwaitingMySignature = useMemo(() => {
    if (!user?.id) return []
    return signableSubmissions.filter(
      (s) =>
        s.workflowType === 'site_meeting' &&
        s.siteSignerIds?.includes(user.id) &&
        !s.siteSignatures?.some((sig) => sig.userId === user.id)
    )
  }, [signableSubmissions, user?.id])

  const setView = (v: LibraryView) => setSearchParams((p) => ({ ...Object.fromEntries(p), view: v }))
  const setSubmissionFilter = (f: SubmissionFilter) =>
    setSearchParams((p) => {
      const next: Record<string, string> = { ...Object.fromEntries(p), view: 'submissions' }
      if (f === 'all') delete next.status
      else next.status = f
      return next
    })

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display font-bold text-display-xl text-neutral-900 dark:text-white tracking-tight">
            Forms & documents
          </h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-0.5">
            Templates are PDFs with fillable fields (upload PDF, place fields, assign). Documents are PDFs with no fields — same upload to the system, view only. Submissions and signing below.
          </p>
        </div>
        {view === 'templates' && isOwnerOrHr && (
          <Link to="/library/upload">
            <Button leftIcon={<UploadIcon />}>Upload PDF (template)</Button>
          </Link>
        )}
        {view === 'documents' && isOwnerOrHr && (
          <div className="flex flex-wrap gap-2 shrink-0">
            <Link to="/library/upload-document">
              <Button variant="secondary" size="sm" leftIcon={<UploadIcon />}>Upload document</Button>
            </Link>
            <Button variant="secondary" size="sm" className="no-print" leftIcon={<IconDownload />} onClick={() => window.print()}>
              Save / print as PDF
            </Button>
          </div>
        )}
        {view === 'documents' && !isOwnerOrHr && (
          <Button variant="secondary" size="sm" className="no-print shrink-0" leftIcon={<IconDownload />} onClick={() => window.print()}>
            Save / print as PDF
          </Button>
        )}
      </div>

      {message && (
        <div className="rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-700 px-4 py-3 text-sm text-emerald-800 dark:text-emerald-200">
          {message}
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {VIEWS.map((v) => (
          <button
            key={v.value}
            type="button"
            onClick={() => setView(v.value)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
              view === v.value ? 'bg-brand-600 text-white' : 'bg-neutral-100 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-600'
            }`}
          >
            {v.label}
          </button>
        ))}
      </div>

      {/* Templates */}
      {view === 'templates' && (
        <>
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            Report forms and form templates (from uploaded PDFs). Assign to roles or people; when they fill and sign, it becomes a submission.
          </p>

          {/* Built-in report forms: Incident Report, Near-miss, Hazard */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-3">Report forms</h3>
            <ul className="space-y-3">
              {(['t2', 't4', 't5'] as const).map((templateId) => {
                const t = MOCK_FORM_TEMPLATES[templateId]
                if (!t) return null
                return (
                  <li key={t.id}>
                    <Card hover padding="md" className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      <div>
                        <p className="font-medium text-neutral-900 dark:text-white">{t.name}</p>
                        <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-0.5">{t.description}</p>
                      </div>
                      <Link to={`/forms/new/${t.id}`}>
                        <Button size="sm">{t.id === 't2' ? 'Report incident' : t.id === 't4' ? 'Report near-miss' : 'Report hazard'}</Button>
                      </Link>
                    </Card>
                  </li>
                )
              })}
            </ul>
          </div>

          <h3 className="text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-3">Form templates (from uploaded PDFs)</h3>
          <ul className="space-y-3">
            {visibleTemplates.map((t) => (
              <li key={t.id}>
                <Card hover padding="md" className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <p className="font-medium text-neutral-900 dark:text-white">{t.name}</p>
                    <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-0.5">
                      {t.description} · {t.schedule} · assigned to {t.assignedToRoles?.length ? t.assignedToRoles.join(', ') : ''}
                      {t.assignedToUserIds?.length ? ` + ${t.assignedToUserIds.length} person(s)` : ''}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {t.sourcePdfId && isOwnerOrHr && (
                      <Link to={`/library/template/${t.sourcePdfId}/edit`}>
                        <Button variant="outline" size="sm">Edit</Button>
                      </Link>
                    )}
                    <Link to="/daily-forms">
                      <span className="text-sm text-brand-600 dark:text-brand-400">Fill / assign</span>
                    </Link>
                  </div>
                </Card>
              </li>
            ))}
          </ul>
          {visibleTemplates.length === 0 && (
            <Card padding="lg" className="text-center text-neutral-500 dark:text-neutral-400">
              No PDF templates you can access. {isOwnerOrHr && 'Upload a PDF to create one.'}
            </Card>
          )}
        </>
      )}

      {/* Submissions */}
      {view === 'submissions' && (
        <>
          <div className="flex flex-col sm:flex-row gap-4">
            <input
              type="search"
              placeholder="Search forms..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 min-h-[44px] px-4 rounded-xl border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
            <div className="flex flex-wrap gap-2">
              {(['all', 'draft', 'pending_site_signatures', 'submitted', 'approved', 'rejected', 'archived'] as SubmissionFilter[]).map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setSubmissionFilter(f)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                    submissionFilter === f ? 'bg-brand-600 text-white' : 'bg-neutral-100 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300'
                  }`}
                >
                  {f === 'pending_site_signatures' ? 'Pending site signatures' : f.charAt(0).toUpperCase() + f.slice(1)}
                </button>
              ))}
            </div>
          </div>
          <ul className="space-y-3">
            {filteredSubmissions.map((sub) => (
              <li key={sub.id}>
                <Link
                  to={
                    isLabourer
                      ? `/forms/${sub.id}`
                      : sub.status === 'submitted' || sub.status === 'approved' || sub.status === 'rejected'
                        ? `/forms/${sub.id}`
                        : `/forms/new?draft=${sub.id}`
                  }
                >
                  <Card hover padding="md" className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div>
                      <p className="font-medium text-neutral-900 dark:text-white">{sub.templateName}</p>
                      <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-0.5">
                        {sub.siteName && `${sub.siteName} · `}
                        {sub.submittedAt ? new Date(sub.submittedAt).toLocaleDateString() : 'Draft'}
                      </p>
                    </div>
                    <Badge
                      variant={
                        sub.status === 'approved' ? 'success' : sub.status === 'rejected' ? 'danger' : sub.status === 'archived' ? 'info' : sub.status === 'pending_site_signatures' ? 'warning' : sub.status === 'submitted' ? 'warning' : 'default'
                      }
                    >
                      {sub.status === 'pending_site_signatures' ? 'Awaiting site sign-offs' : sub.status}
                    </Badge>
                  </Card>
                </Link>
              </li>
            ))}
          </ul>
          {filteredSubmissions.length === 0 && (
            <Card padding="lg">
              <EmptyState title="No submissions match your filters." description="Try changing the status filter or search." />
            </Card>
          )}
        </>
      )}

      {/* Documents */}
      {view === 'documents' && (
        <>
          <p className="text-sm text-neutral-500 dark:text-neutral-400">Documents are uploaded PDFs with no fillable fields (view only). Same upload flow as templates; only difference is no fields to enter.</p>
          <Card padding="md" className="no-print">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <label className="block text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-1">Type</label>
                <select
                  value={docTypeFilter}
                  onChange={(e) => setDocTypeFilter(e.target.value)}
                  className="w-full min-h-[44px] px-3 rounded-xl border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white"
                  aria-label="Filter by type"
                >
                  <option value="all">All</option>
                  {docTypes.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-1">Site</label>
                <select
                  value={docSiteFilter}
                  onChange={(e) => setDocSiteFilter(e.target.value)}
                  className="w-full min-h-[44px] px-3 rounded-xl border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white"
                  aria-label="Filter by site"
                >
                  <option value="all">All</option>
                  {docSites.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
            </div>
          </Card>
          <ul className="space-y-3 print:space-y-2">
            {filteredDocs.map((doc) => (
              <li key={doc.id}>
                <Link to={`/documents/${doc.id}`}>
                  <Card hover padding="md" className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div>
                      <p className="font-medium text-neutral-900 dark:text-white">{doc.name}</p>
                      <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-0.5">
                        {doc.type}
                        {doc.siteName ? ` · ${doc.siteName}` : ''} · {doc.date}
                      </p>
                    </div>
                    <span className="text-sm text-brand-600 dark:text-brand-400">View</span>
                  </Card>
                </Link>
              </li>
            ))}
          </ul>
          {filteredDocs.length === 0 && (
            <Card padding="lg">
              <EmptyState title="No documents match your filters." description="Try changing type or site filter." />
            </Card>
          )}
        </>
      )}

      {/* Signing */}
      {view === 'signing' && (
        <>
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            Documents and site meeting forms waiting for your signature, or signature requests you manage.
          </p>
          {siteMeetingFormsAwaitingMySignature.length > 0 && (
            <Card padding="md" className="border-l-4 border-amber-500">
              <h3 className="font-semibold text-neutral-900 dark:text-white mb-2">Site meeting forms — your sign-off needed</h3>
              <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-3">H&S rep has filled these; sign after the site meeting.</p>
              <ul className="space-y-2">
                {siteMeetingFormsAwaitingMySignature.map((s) => (
                  <li key={s.id}>
                    <Link to={`/forms/${s.id}`}>
                      <div className="flex items-center justify-between py-2 px-3 rounded-xl bg-amber-50 dark:bg-amber-900/20 hover:bg-amber-100 dark:hover:bg-amber-900/30 transition-colors">
                        <span className="font-medium text-neutral-900 dark:text-white">{s.templateName}</span>
                        <span className="text-sm text-brand-600 dark:text-brand-400">Sign →</span>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            </Card>
          )}
          {signableFormsAwaitingMySignature.length > 0 && (
            <Card padding="md" className="border-l-4 border-brand-500">
              <h3 className="font-semibold text-neutral-900 dark:text-white mb-2">Forms from your supervisor — your signature needed</h3>
              <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-3">Your supervisor has filled and signed these; add your signature.</p>
              <ul className="space-y-2">
                {signableFormsAwaitingMySignature.map((s) => (
                  <li key={s.id}>
                    <Link to={`/daily-forms/sign/${s.id}`}>
                      <div className="flex items-center justify-between py-2 px-3 rounded-xl bg-brand-50 dark:bg-brand-900/20 hover:bg-brand-100 dark:hover:bg-brand-900/30 transition-colors">
                        <span className="font-medium text-neutral-900 dark:text-white">{s.templateName}</span>
                        <span className="text-sm text-brand-600 dark:text-brand-400">Sign →</span>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            </Card>
          )}
          {signingRequests.length === 0 && siteMeetingFormsAwaitingMySignature.length === 0 && signableFormsAwaitingMySignature.length === 0 ? (
            <Card padding="lg" className="text-center text-neutral-500 dark:text-neutral-400">
              {isLabourer ? 'No documents or site meeting forms waiting for your signature right now.' : 'No signature requests.'}
            </Card>
          ) : signingRequests.length > 0 ? (
            <ul className="space-y-3">
              {signingRequests.map((r) => {
                const mySigner = r.requiredSigners.find((s) => s.userId === user?.id || s.name === user?.name)
                const isPending = mySigner?.status === 'pending'
                return (
                  <li key={r.id}>
                    <Link to={`/signing/${r.id}`}>
                      <Card hover padding="md" className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <div>
                          <p className="font-medium text-neutral-900 dark:text-white">{r.documentName}</p>
                          <p className="text-sm text-neutral-500 dark:text-neutral-400">Due {new Date(r.dueDate).toLocaleDateString()}</p>
                        </div>
                        <Badge variant={isPending ? 'warning' : 'success'}>
                          {isPending ? 'Your signature needed' : 'Signed'}
                        </Badge>
                      </Card>
                    </Link>
                  </li>
                )
              })}
            </ul>
          ) : null}
        </>
      )}
    </div>
  )
}

function UploadIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
    </svg>
  )
}
