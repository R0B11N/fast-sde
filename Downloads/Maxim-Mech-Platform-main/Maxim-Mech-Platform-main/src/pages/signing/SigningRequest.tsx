import { Link, useParams } from 'react-router-dom'
import { useUser } from '@/contexts/UserContext'
import { Card, CardHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { MOCK_SIGNATURE_REQUESTS } from '@/data/mock'

export function SigningRequest() {
  const { id } = useParams()
  const { user } = useUser()
  const isLabourer = user?.role === 'labourer'
  const isCurrentUserSigner = (r: (typeof MOCK_SIGNATURE_REQUESTS)[0]) =>
    r.requiredSigners.some((s) => s.userId === user?.id || s.name === user?.name)
  const requestsForLabourer = MOCK_SIGNATURE_REQUESTS.filter(isCurrentUserSigner)
  const requestList = isLabourer ? requestsForLabourer : MOCK_SIGNATURE_REQUESTS
  const request = id ? (isLabourer ? requestsForLabourer.find((r) => r.id === id) : MOCK_SIGNATURE_REQUESTS.find((r) => r.id === id)) : null

  if (!request && id) {
    return (
      <div className="space-y-4 animate-fade-in">
        <p className="text-neutral-500 dark:text-neutral-400">Request not found.</p>
        <Link to="/signing" className="text-brand-600 dark:text-brand-400 hover:underline">Back to signing</Link>
      </div>
    )
  }

  if (!request) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="font-display font-bold text-2xl text-neutral-900 dark:text-white">Signing & acknowledgements</h1>
          <p className="text-neutral-500 dark:text-neutral-400 mt-0.5">{isLabourer ? 'Documents waiting for your signature' : 'Signature requests and status'}</p>
        </div>
        {requestList.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-surface-dark-elevated/95 p-8 text-center">
            <p className="text-neutral-600 dark:text-neutral-400">
              {isLabourer ? 'No documents waiting for your signature right now.' : 'No signature requests.'}
            </p>
          </div>
        ) : (
          <ul className="space-y-3">
            {requestList.map((r) => {
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
                      <Badge variant={isPending ? 'warning' : 'success'}>{isPending ? 'Your signature needed' : 'Signed'}</Badge>
                    </Card>
                  </Link>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-4">
        <Link to="/signing" className="touch-target p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-400">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
        </Link>
        <div>
          <h1 className="font-display font-bold text-2xl text-neutral-900 dark:text-white">Signature request</h1>
          <p className="text-neutral-500 dark:text-neutral-400 mt-0.5">Required signers, reminders, due date</p>
        </div>
      </div>

      <Card padding="lg">
        <CardHeader>{request.documentName}</CardHeader>
        <div className="mt-2 flex flex-wrap items-center gap-4">
          <span className="inline-flex items-center gap-1.5 rounded-lg bg-amber-100 dark:bg-amber-900/30 px-3 py-1.5 text-sm font-medium text-amber-800 dark:text-amber-200">
            Due: {new Date(request.dueDate).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
          </span>
          <span className="text-sm text-neutral-500 dark:text-neutral-400">Reminders sent: {request.remindersSent}</span>
        </div>
        <div className="mt-4">
          <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">Required signers</p>
          <ul className="space-y-2">
            {request.requiredSigners.map((s) => (
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
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {!isLabourer && (
            <Button variant="ghost" size="sm">Send reminder</Button>
          )}
          <Link to={`/signing/${request.id}/sign`}>
            <Button size="sm">Sign</Button>
          </Link>
        </div>
      </Card>
    </div>
  )
}
