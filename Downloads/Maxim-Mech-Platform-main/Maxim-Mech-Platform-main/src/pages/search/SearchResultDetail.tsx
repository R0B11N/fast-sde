import { Link, useParams } from 'react-router-dom'
import { Card } from '@/components/ui/Card'
import { NotFound } from '@/components/ui/NotFound'
import { useDocuments } from '@/contexts/DocumentsContext'
import { useFormSubmissions } from '@/contexts/FormSubmissionsContext'
import { MOCK_INCIDENTS } from '@/data/mock'

export function SearchResultDetail() {
  const { type, id } = useParams<{ type: string; id: string }>()
  const { documents } = useDocuments()
  const { getSubmission } = useFormSubmissions()

  if (!type || !id) {
    return (
      <NotFound
        title="Invalid result."
        backAction={<Link to="/search">Back to search</Link>}
      />
    )
  }

  const doc = type === 'document' && documents.find((d) => d.id === id)
  const sub = type === 'submission' && getSubmission(id)
  const inc = type === 'incident' && MOCK_INCIDENTS.find((i) => i.id === id)

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
      <Link to="/search" className="inline-flex items-center gap-2 text-sm text-brand-600 dark:text-brand-400 hover:underline">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
        Back to search
      </Link>

      {doc && (
        <>
          <h1 className="font-display font-bold text-2xl text-neutral-900 dark:text-white">{doc.name}</h1>
          <Card padding="lg">
            <dl className="grid gap-2 text-sm">
              <div className="flex justify-between"><dt className="text-neutral-500">Type</dt><dd>{doc.type}</dd></div>
              <div className="flex justify-between"><dt className="text-neutral-500">Date</dt><dd>{doc.date}</dd></div>
              {doc.siteName && <div className="flex justify-between"><dt className="text-neutral-500">Site</dt><dd>{doc.siteName}</dd></div>}
            </dl>
            <Link to={`/documents/${doc.id}`} className="mt-4 inline-block text-sm text-brand-600 dark:text-brand-400 hover:underline">Open document</Link>
          </Card>
        </>
      )}

      {sub && (
        <>
          <h1 className="font-display font-bold text-2xl text-neutral-900 dark:text-white">{sub.templateName}</h1>
          <Card padding="lg">
            <dl className="grid gap-2 text-sm">
              <div className="flex justify-between"><dt className="text-neutral-500">Status</dt><dd>{sub.status}</dd></div>
              <div className="flex justify-between"><dt className="text-neutral-500">Site</dt><dd>{sub.siteName || '—'}</dd></div>
              {sub.submittedAt && <div className="flex justify-between"><dt className="text-neutral-500">Submitted</dt><dd>{new Date(sub.submittedAt).toLocaleString()}</dd></div>}
            </dl>
            <Link to={`/forms/${sub.id}`} className="mt-4 inline-block text-sm text-brand-600 dark:text-brand-400 hover:underline">Open submission</Link>
          </Card>
        </>
      )}

      {inc && (
        <>
          <h1 className="font-display font-bold text-2xl text-neutral-900 dark:text-white">{inc.title}</h1>
          <Card padding="lg">
            <dl className="grid gap-2 text-sm">
              <div className="flex justify-between"><dt className="text-neutral-500">Site</dt><dd>{inc.siteName}</dd></div>
              <div className="flex justify-between"><dt className="text-neutral-500">Date</dt><dd>{inc.date}</dd></div>
              <div className="flex justify-between"><dt className="text-neutral-500">Status</dt><dd>{inc.status}</dd></div>
              {inc.severity && <div className="flex justify-between"><dt className="text-neutral-500">Severity</dt><dd>{inc.severity}</dd></div>}
            </dl>
          </Card>
        </>
      )}

      {!doc && !sub && !inc && (
        <NotFound
          title="Result not found."
          message="The item may have been removed or the link is incorrect."
          backAction={<Link to="/search">Back to search</Link>}
        />
      )}
    </div>
  )
}
