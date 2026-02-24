import { useState, useRef } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { Card, CardHeader, CardDescription } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { MOCK_SIGNATURE_REQUESTS } from '@/data/mock'
import { useUser } from '@/contexts/UserContext'
import { IconDownload } from '@/components/icons/NavIcons'

const LOCATION_ENABLED = true

export function SignatureCapture() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useUser()
  const request = MOCK_SIGNATURE_REQUESTS.find((r) => r.id === id) || MOCK_SIGNATURE_REQUESTS[0]
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [signed, setSigned] = useState(false)
  const [name, setName] = useState(user?.name || '')
  const [location] = useState('49.28° N, 123.12° W')
  const [loading, setLoading] = useState(false)
  const [hasViewedDocument, setHasViewedDocument] = useState(false)
  const signedAt = new Date().toLocaleString()

  const handleDownload = () => {
    // Mock: In a real app, this would download the actual PDF
    const link = document.createElement('a')
    link.href = '#'
    link.download = `${request.documentName}.pdf`
    link.click()
  }

  const confirm = () => {
    setLoading(true)
    setTimeout(() => { setLoading(false); setSigned(true) }, 600)
  }

  const done = () => navigate('/library?view=signing')

  return (
    <div className="max-w-lg mx-auto space-y-6 animate-fade-in">
      <div className="flex items-center gap-4">
        <Link to="/library?view=signing" className="no-print touch-target p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-400">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
        </Link>
        <div>
          <h1 className="font-display font-bold text-xl text-neutral-900 dark:text-white">Sign</h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400">{request.documentName}</p>
        </div>
      </div>

      {!signed ? (
        <>
          <Card padding="lg">
            <CardHeader>Document Review</CardHeader>
            <CardDescription>Please review the documentation before signing. You can view and download the document below.</CardDescription>
            <div className="mt-4 space-y-3">
              <div className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800/50">
                <p className="font-medium text-neutral-900 dark:text-white mb-2">{request.documentName}</p>
                <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-3">Review the documentation and sign to acknowledge you received and understand the contents. If you have any questions, please contact HR.</p>
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" size="sm" onClick={() => setHasViewedDocument(true)}>
                    View Document
                  </Button>
                  <Button variant="outline" size="sm" leftIcon={<IconDownload />} onClick={handleDownload}>
                    Download
                  </Button>
                </div>
              </div>
            </div>
          </Card>

          <Card padding="lg">
            <CardHeader>Signing area</CardHeader>
            <CardDescription>Draw your signature below. Your name, role, timestamp{LOCATION_ENABLED ? ', and location' : ''} will be recorded.</CardDescription>
          <div className="relative mt-4 border-2 border-neutral-300 dark:border-neutral-600 rounded-xl bg-white dark:bg-neutral-800 min-h-[160px] flex items-center justify-center">
            <canvas ref={canvasRef} className="w-full h-40 touch-none rounded-xl" width={400} height={160} />
            <p className="absolute inset-0 flex items-center justify-center pointer-events-none text-sm text-neutral-400">Draw here</p>
          </div>
          <div className="mt-4 space-y-2">
            <Input label="Your name" value={name} onChange={(e) => setName(e.target.value)} required />
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              Role: <span className="font-medium text-neutral-700 dark:text-neutral-300">{user?.role ?? 'Labourer'}</span>
              {' · '}
              Timestamp: <span className="font-medium text-neutral-700 dark:text-neutral-300">{signedAt}</span>
            </p>
            {LOCATION_ENABLED && (
              <p className="text-xs text-neutral-500 dark:text-neutral-400">Location: {location}</p>
            )}
          </div>
          <Button className="w-full mt-4" onClick={confirm} disabled={loading || !hasViewedDocument}>
            {loading ? 'Signing...' : 'Confirm signature'}
          </Button>
          {!hasViewedDocument && (
            <p className="text-xs text-amber-600 dark:text-amber-400 mt-2 text-center">Please view or download the document before signing.</p>
          )}
        </Card>
        </>
      ) : (
        <Card padding="lg" className="text-center">
          <div className="text-4xl text-emerald-500 mb-3">✓</div>
          <p className="font-semibold text-neutral-900 dark:text-white">Signature recorded</p>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">You may close this page.</p>
          <Button className="mt-4" variant="secondary" onClick={done}>Done</Button>
        </Card>
      )}
    </div>
  )
}
