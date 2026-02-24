import { useNavigate } from 'react-router-dom'
import { Card, CardHeader, CardDescription } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { useUser } from '@/contexts/UserContext'
import { useScannedPdfs } from '@/contexts/ScannedPdfsContext'

export function LibraryUpload() {
  const navigate = useNavigate()
  const { user } = useUser()
  const { addPdf } = useScannedPdfs()

  const isOwnerOrHr = user?.role === 'owner' || user?.role === 'hr'
  if (!isOwnerOrHr) {
    navigate('/library', { replace: true })
    return null
  }

  const handleUpload = () => {
    const id = `pdf-${Date.now()}`
    const name = `Uploaded form ${new Date().toLocaleDateString()}.pdf`
    addPdf({
      id,
      name,
      uploadedAt: new Date().toISOString().slice(0, 19) + 'Z',
      uploadedBy: user?.name ?? 'HR',
    })
    navigate(`/library/template/${id}/edit`, { replace: true })
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-2xl">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => navigate('/library?view=templates')} className="no-print -ml-2">
          ← Back
        </Button>
      </div>
      <Card padding="lg">
        <CardHeader>Upload PDF</CardHeader>
        <CardDescription>
          Upload a PDF form (e.g. safety checklist, inspection sheet). You will then place fillable fields (text, date, signature) on the document and assign the form to roles or specific people. Once assigned, when they fill and sign it becomes a submission.
        </CardDescription>
        <div className="mt-6 flex flex-col items-start gap-4">
          <div className="w-full min-h-[200px] rounded-xl border-2 border-dashed border-neutral-300 dark:border-neutral-600 flex flex-col items-center justify-center gap-2 bg-neutral-50/50 dark:bg-neutral-800/30">
            <p className="text-sm text-neutral-500 dark:text-neutral-400">Drop your PDF here or click to browse</p>
            <Button onClick={handleUpload}>Select PDF (mock upload)</Button>
          </div>
          <p className="text-xs text-neutral-500 dark:text-neutral-400">
            After upload you will add fields on the document (DocuSign-style), set schedule and assignment, then save. The form becomes a template others can fill and sign.
          </p>
        </div>
      </Card>
    </div>
  )
}
