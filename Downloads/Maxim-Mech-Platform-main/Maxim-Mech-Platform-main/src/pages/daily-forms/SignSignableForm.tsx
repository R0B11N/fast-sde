import { useState } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { Card, CardHeader, CardDescription } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useSignableSubmissions } from '@/contexts/SignableSubmissionsContext'
import { useSignableTemplates } from '@/contexts/SignableTemplatesContext'
import { useUser } from '@/contexts/UserContext'
import { MOCK_APP_USERS } from '@/data/mock'

export function SignSignableForm() {
  const { submissionId } = useParams()
  const navigate = useNavigate()
  const { user } = useUser()
  const { getSubmission, updateSubmission } = useSignableSubmissions()
  const { templates } = useSignableTemplates()
  const submission = submissionId ? getSubmission(submissionId) : undefined
  const template = submission ? templates.find((t) => t.id === submission.signableFormId) : undefined

  const [signatureText, setSignatureText] = useState(user?.name ?? '')
  const [loading, setLoading] = useState(false)
  const [signed, setSigned] = useState(false)

  const siteSignerIds = submission?.siteSignerIds ?? []
  const siteSignatures = submission?.siteSignatures ?? []
  const isSiteSigner = user?.id && siteSignerIds.includes(user.id)
  const hasSigned = user?.id && siteSignatures.some((s) => s.userId === user.id)

  const sign = () => {
    if (!submission?.id || !user?.id || !signatureText.trim()) return
    setLoading(true)
    const newSignatures = [...siteSignatures, { userId: user.id, signedAt: new Date().toISOString() }]
    updateSubmission(submission.id, { siteSignatures: newSignatures })
    setTimeout(() => {
      setLoading(false)
      setSigned(true)
    }, 400)
  }

  if (!submission) {
    return (
      <div className="max-w-xl mx-auto space-y-4 animate-fade-in">
        <p className="text-neutral-500 dark:text-neutral-400">Form not found.</p>
        <Link to="/library?view=signing" className="text-brand-600 dark:text-brand-400 hover:underline">Back to Signing</Link>
      </div>
    )
  }

  if (!isSiteSigner) {
    return (
      <div className="max-w-xl mx-auto space-y-4 animate-fade-in">
        <p className="text-neutral-500 dark:text-neutral-400">You are not required to sign this form.</p>
        <Link to="/library?view=signing" className="text-brand-600 dark:text-brand-400 hover:underline">Back to Signing</Link>
      </div>
    )
  }

  if (hasSigned || signed) {
    return (
      <div className="max-w-xl mx-auto space-y-6 animate-fade-in">
        <Card padding="lg" className="text-center">
          <div className="text-5xl text-emerald-500 mb-4">✓</div>
          <CardHeader>You have signed</CardHeader>
          <CardDescription>Your signature has been recorded on this form.</CardDescription>
          <Button className="mt-4" onClick={() => navigate('/library?view=signing')}>Back to Signing</Button>
        </Card>
      </div>
    )
  }

  const getName = (userId: string) => MOCK_APP_USERS.find((u) => u.id === userId)?.name ?? userId

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      <div className="flex items-center gap-4">
        <Link to="/library?view=signing" className="touch-target p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-400">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
        </Link>
        <div>
          <h1 className="font-display font-bold text-xl text-neutral-900 dark:text-white">Sign: {submission.templateName}</h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400">Filled and signed by {submission.submittedBy}; your signature is required.</p>
        </div>
      </div>

      <Card padding="lg">
        <CardHeader>Form summary</CardHeader>
        <CardDescription>Review the details below, then add your signature.</CardDescription>
        <div className="mt-4 space-y-2 text-sm">
          {template?.placedFields?.filter((f) => f.type !== 'signature').map((f) => (
            <div key={f.id} className="flex justify-between gap-4 py-1 border-b border-neutral-100 dark:border-neutral-700">
              <span className="text-neutral-500 dark:text-neutral-400">{f.label}</span>
              <span className="text-neutral-900 dark:text-white font-medium">{submission.fieldValues[f.id] ?? '—'}</span>
            </div>
          ))}
          <div className="flex justify-between gap-4 py-1 border-b border-neutral-100 dark:border-neutral-700">
            <span className="text-neutral-500 dark:text-neutral-400">Supervisor signature</span>
            <span className="text-neutral-900 dark:text-white font-medium">{submission.signatureText}</span>
          </div>
        </div>
        <div className="mt-6">
          <Input
            label="Your signature (type your full name)"
            value={signatureText}
            onChange={(e) => setSignatureText(e.target.value)}
            placeholder="Full name"
            required
          />
        </div>
        <p className="mt-2 text-xs text-neutral-500 dark:text-neutral-400">
          Signatures: {siteSignatures.length} of {siteSignerIds.length} — {siteSignerIds.map(getName).join(', ')}
        </p>
        <Button className="w-full mt-4" onClick={sign} disabled={loading || !signatureText.trim()}>
          {loading ? 'Saving…' : 'Sign'}
        </Button>
      </Card>
    </div>
  )
}
