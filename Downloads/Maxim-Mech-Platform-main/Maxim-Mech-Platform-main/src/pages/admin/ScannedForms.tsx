import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Card, CardHeader, CardDescription } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { MOCK_SCANNED_PDFS, MOCK_SIGNABLE_FORM_TEMPLATES } from '@/data/mock'
import type { ScannedPdfDocument } from '@/types'

export function ScannedForms() {
  const location = useLocation()
  const [pdfs, setPdfs] = useState<ScannedPdfDocument[]>(MOCK_SCANNED_PDFS)
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    const state = location.state as { message?: string } | null
    if (state?.message) {
      setMessage(state.message)
      window.history.replaceState({}, '') // clear state so message doesn't reappear on refresh
    }
  }, [location.state])

  const formsFromPdf = (pdfId: string) =>
    MOCK_SIGNABLE_FORM_TEMPLATES.filter((t) => t.sourcePdfId === pdfId)

  const addPdf = () => {
    const name = `Scanned form ${pdfs.length + 1}.pdf`
    setPdfs((prev) => [
      ...prev,
      { id: `pdf-${Date.now()}`, name, uploadedAt: new Date().toISOString().slice(0, 19) + 'Z', uploadedBy: 'Morgan Reed' },
    ])
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display font-bold text-2xl text-neutral-900 dark:text-white">Scanned PDF forms</h1>
          <p className="text-neutral-500 dark:text-neutral-400 mt-0.5">Upload PDFs and add fillable fields (text, date, signature). Assign to Supervisor or Labourer on a daily, weekly, or monthly schedule.</p>
        </div>
        <div className="flex gap-2">
          <Link to="/admin/signable-forms" className="text-sm text-neutral-600 dark:text-neutral-400 hover:underline">Custom forms</Link>
          <Button onClick={addPdf}>Upload PDF</Button>
        </div>
      </div>

      {message && (
        <div className="rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-700 px-4 py-3 text-sm text-emerald-800 dark:text-emerald-200">
          {message}
        </div>
      )}

      <Card padding="lg">
        <CardHeader>Uploaded PDFs</CardHeader>
        <CardDescription>Scan or upload a PDF, then add fields and create a form to assign to roles.</CardDescription>
        <ul className="mt-4 space-y-3">
          {pdfs.map((pdf) => {
            const linked = formsFromPdf(pdf.id)
            return (
              <li key={pdf.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 rounded-xl border border-neutral-200 dark:border-neutral-600 bg-neutral-50/50 dark:bg-neutral-800/50">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 font-medium">PDF</span>
                  <div>
                    <p className="font-medium text-neutral-900 dark:text-white">{pdf.name}</p>
                    <p className="text-sm text-neutral-500 dark:text-neutral-400">Uploaded {new Date(pdf.uploadedAt).toLocaleDateString()} by {pdf.uploadedBy}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {linked.length > 0 && (
                    <span className="text-sm text-neutral-500">{linked.length} form(s) created</span>
                  )}
                  <Link to={`/admin/scanned-forms/${pdf.id}/edit`}>
                    <Button size="sm">{linked.length > 0 ? 'Edit form / Add another' : 'Add fields & create form'}</Button>
                  </Link>
                </div>
              </li>
            )
          })}
        </ul>
      </Card>
    </div>
  )
}
