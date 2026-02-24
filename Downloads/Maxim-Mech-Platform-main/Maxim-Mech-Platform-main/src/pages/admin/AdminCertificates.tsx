import { useState } from 'react'
import { Card, CardHeader, CardDescription } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { MOCK_APP_USERS } from '@/data/mock'
import { useUser } from '@/contexts/UserContext'
import { useCertificates } from '@/contexts/CertificatesContext'
import { pdfDataUrlToImageDataUrls } from '@/utils/pdfToImages'
import type { Certificate } from '@/types'

const EXPIRING_DAYS = 30

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function getExpirationStatus(expirationDate: string): 'current' | 'expiring-soon' | 'expired' {
  const exp = new Date(expirationDate)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  exp.setHours(0, 0, 0, 0)
  const daysLeft = Math.ceil((exp.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
  if (daysLeft < 0) return 'expired'
  if (daysLeft <= EXPIRING_DAYS) return 'expiring-soon'
  return 'current'
}

function clampExpirationDate(value: string): string {
  if (!value || value.length < 10) return value
  const year = value.slice(0, 4)
  if (year.length > 4) return value.slice(0, 10)
  const y = parseInt(year, 10)
  if (y > 9999) return '9999' + value.slice(4)
  return value.slice(0, 10)
}

export function AdminCertificates() {
  const { user } = useUser()
  const { certificates, addCertificate, updateCertificate, removeCertificate } = useCertificates()
  const [showUpload, setShowUpload] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [holderName, setHolderName] = useState('')
  const [holderUserId, setHolderUserId] = useState('')
  const [expirationDate, setExpirationDate] = useState('')
  const [pdfFile, setPdfFile] = useState<File | null>(null)
  const [pdfDataUrl, setPdfDataUrl] = useState<string | null>(null)
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null)
  const [viewCertId, setViewCertId] = useState<string | null>(null)

  const isEditing = editingId != null
  const viewCert = viewCertId ? certificates.find((c) => c.id === viewCertId) : null
  const editingCert = isEditing ? certificates.find((c) => c.id === editingId) : null

  const openEdit = (cert: Certificate) => {
    setEditingId(cert.id)
    setName(cert.name)
    setHolderName(cert.holderName)
    setHolderUserId(cert.holderUserId ?? '')
    setExpirationDate(cert.expirationDate)
    setPdfFile(null)
    setPdfDataUrl(null)
    setShowUpload(true)
  }

  const closeForm = () => {
    setShowUpload(false)
    setEditingId(null)
    setName('')
    setHolderName('')
    setHolderUserId('')
    setExpirationDate('')
    setPdfFile(null)
    setPdfDataUrl(null)
  }

  const handleFileSelect = (file: File | null) => {
    setPdfFile(file)
    if (!file) {
      setPdfDataUrl(null)
      return
    }
    const reader = new FileReader()
    reader.onload = () => setPdfDataUrl(reader.result as string)
    reader.readAsDataURL(file)
  }

  const effectiveHolderName = holderName.trim() || (holderUserId ? MOCK_APP_USERS.find((u) => u.id === holderUserId)?.name : null) || ''

  const handleSave = () => {
    if (!name.trim() || !effectiveHolderName || !expirationDate) return
    const clampedDate = clampExpirationDate(expirationDate)
    if (isEditing && editingId) {
      updateCertificate(editingId, {
        name: name.trim(),
        holderName: effectiveHolderName,
        holderUserId: holderUserId || undefined,
        expirationDate: clampedDate,
        fileName: pdfFile?.name ?? editingCert?.fileName,
        fileDataUrl: pdfDataUrl ?? editingCert?.fileDataUrl,
      })
      closeForm()
      return
    }
    const cert: Certificate = {
      id: `cert-${Date.now()}`,
      name: name.trim(),
      holderName: effectiveHolderName,
      holderUserId: holderUserId || undefined,
      expirationDate: clampedDate,
      uploadedAt: editingCert?.uploadedAt ?? new Date().toISOString(),
      uploadedBy: editingCert?.uploadedBy ?? user?.name ?? 'HR',
      fileName: pdfFile?.name ?? editingCert?.fileName,
      fileDataUrl: pdfDataUrl ?? undefined,
    }
    addCertificate(cert)
    closeForm()
  }

  const confirmDelete = (id: string) => {
    removeCertificate(id)
    setPendingDeleteId(null)
    if (viewCertId === id) setViewCertId(null)
  }

  const printCertificate = async (cert: Certificate) => {
    const status = getExpirationStatus(cert.expirationDate)
    const statusLabel = status === 'expired' ? 'Expired' : status === 'expiring-soon' ? 'Expiring soon' : 'Current'
    let pdfImages: string[] = []
    if (cert.fileDataUrl) {
      try {
        pdfImages = await pdfDataUrlToImageDataUrls(cert.fileDataUrl)
      } catch {
        pdfImages = []
      }
    }
    const pdfEmbed = pdfImages.length > 0
      ? `<div class="pdf-section" style="margin-top: 1.5rem;">
  <h3 style="margin: 0 0 0.5rem 0; font-size: 0.95rem;">Attached PDF</h3>
  <div class="pdf-pages">${pdfImages
    .map(
      (src) =>
        `<img class="pdf-page-img" src="${src.replace(/&/g, '&amp;').replace(/"/g, '&quot;')}" style="width:100%; max-width:100%; height:auto; display:block; margin-bottom:1rem; page-break-inside:avoid;" alt="PDF page" />`
    )
    .join('')}</div>
</div>`
      : cert.fileName
        ? `<div class="pdf-section">
  <h3>Attached PDF</h3>
  <p class="pdf-name">${escapeHtml(cert.fileName)}</p>
</div>`
        : `<div class="pdf-section">
  <h3>Attached PDF</h3>
  <p class="pdf-name">No file attached</p>
</div>`
    const hasPdfImages = pdfImages.length > 0
    const printScript = hasPdfImages
      ? `<script>
(function(){
  var printed = false;
  function doPrint(){ if(printed) return; printed = true; window.print(); }
  var imgs = document.querySelectorAll('.pdf-page-img');
  if(!imgs.length){ setTimeout(doPrint, 50); return; }
  var n = imgs.length, done = 0;
  imgs.forEach(function(img){
    if(img.complete){ done++; if(done===n) doPrint(); }
    else img.onload = function(){ done++; if(done===n) doPrint(); };
  });
  setTimeout(doPrint, 6000);
})();
</script>`
      : `<script>setTimeout(function(){ window.print(); }, 50);</script>`
    const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>${escapeHtml(cert.name)} - ${escapeHtml(cert.holderName)}</title>
<style>
  body { font-family: system-ui, sans-serif; padding: 2rem; max-width: 800px; margin: 0 auto; color: #111; }
  h1 { font-size: 1.5rem; margin-bottom: 0.5rem; }
  .meta { color: #555; font-size: 0.9rem; margin-bottom: 1.5rem; }
  table { width: 100%; border-collapse: collapse; margin-top: 1rem; }
  th, td { text-align: left; padding: 0.5rem 0.75rem; border-bottom: 1px solid #e2e8f0; }
  th { font-weight: 600; color: #475569; width: 40%; }
  .pdf-section { margin-top: 2rem; padding: 1rem; border: 1px dashed #cbd5e1; background: #f8fafc; border-radius: 0.5rem; }
  .pdf-section h3 { margin: 0 0 0.5rem 0; font-size: 0.95rem; }
  @media print { body { padding: 1rem; } .pdf-pages img { max-width: 100% !important; } }
</style></head>
<body>
  <h1>${escapeHtml(cert.name)}</h1>
  <p class="meta">Certificate · ${statusLabel} · Printed ${new Date().toLocaleDateString()}</p>
  <table>
    <tr><th>Holder</th><td>${escapeHtml(cert.holderName)}</td></tr>
    <tr><th>Expiration date</th><td>${escapeHtml(cert.expirationDate)}</td></tr>
    <tr><th>Uploaded by</th><td>${escapeHtml(cert.uploadedBy)}</td></tr>
    <tr><th>Uploaded</th><td>${new Date(cert.uploadedAt).toLocaleDateString()}</td></tr>
  </table>
  ${pdfEmbed}
  ${printScript}
</body></html>`
    const iframe = document.createElement('iframe')
    iframe.setAttribute('title', 'Certificate print')
    iframe.style.position = 'absolute'
    iframe.style.left = '-9999px'
    iframe.style.top = '0'
    iframe.style.width = '0'
    iframe.style.height = '0'
    iframe.style.border = 'none'
    document.body.appendChild(iframe)
    const doc = iframe.contentWindow?.document
    if (!doc) {
      document.body.removeChild(iframe)
      return
    }
    doc.open()
    doc.write(html)
    doc.close()
    iframe.contentWindow?.focus()
    setTimeout(() => {
      if (iframe.parentNode) document.body.removeChild(iframe)
    }, 12000)
  }

  const expiringSoon = certificates.filter((c) => getExpirationStatus(c.expirationDate) === 'expiring-soon')
  const expired = certificates.filter((c) => getExpirationStatus(c.expirationDate) === 'expired')

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display font-bold text-2xl text-neutral-900 dark:text-white">Certificates</h1>
          <p className="text-neutral-500 dark:text-neutral-400 mt-0.5">
            View and upload certificates with expiration dates. When a certificate is close to expiration, the system sends an email to HR.
          </p>
        </div>
        <Button onClick={() => setShowUpload(true)}>Upload certificate</Button>
      </div>

      {(expiringSoon.length > 0 || expired.length > 0) && (
        <Card padding="md" className="bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800">
          <p className="text-sm text-amber-800 dark:text-amber-200">
            <strong>Expiration reminders:</strong> When a certificate is within {EXPIRING_DAYS} days of expiring, the system sends an email to HR so you can follow up with the holder.
            {expiringSoon.length > 0 && (
              <span className="block mt-1">
                {expiringSoon.length} certificate(s) expiring soon.
              </span>
            )}
            {expired.length > 0 && (
              <span className="block mt-1 text-red-700 dark:text-red-300">
                {expired.length} certificate(s) expired.
              </span>
            )}
          </p>
        </Card>
      )}

      {showUpload && (
        <Card padding="lg">
          <CardHeader>{isEditing ? 'Edit certificate' : 'Upload certificate'}</CardHeader>
          <CardDescription>
            {isEditing ? 'Update the certificate details below.' : 'Add a certificate with expiration date. HR will receive an email when it is close to expiring.'}
          </CardDescription>
          <div className="mt-4 space-y-4 max-w-xl">
            <Input label="Certificate name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. First Aid Level 1" />
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Holder</label>
              <select
                aria-label="Certificate holder"
                value={holderUserId}
                onChange={(e) => {
                  const u = MOCK_APP_USERS.find((x) => x.id === e.target.value)
                  setHolderUserId(e.target.value)
                  setHolderName(u ? u.name : '')
                }}
                className="w-full min-h-[40px] px-3 rounded-lg border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white text-sm"
              >
                <option value="">Select person</option>
                {MOCK_APP_USERS.map((u) => (
                  <option key={u.id} value={u.id}>{u.name}</option>
                ))}
              </select>
              <Input label="Or holder name" value={holderName} onChange={(e) => setHolderName(e.target.value)} placeholder="If not in list" className="mt-2" />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Expiration date (year max 4 digits)</label>
              <input
                type="date"
                max="9999-12-31"
                value={expirationDate}
                onChange={(e) => setExpirationDate(clampExpirationDate(e.target.value))}
                className="w-full min-h-[40px] px-3 rounded-lg border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white text-sm"
                aria-label="Expiration date"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Upload PDF (optional)</label>
              <input
                type="file"
                accept=".pdf,application/pdf"
                onChange={(e) => handleFileSelect(e.target.files?.[0] ?? null)}
                className="block w-full text-sm text-neutral-600 dark:text-neutral-400 file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-brand-100 file:text-brand-700 dark:file:bg-brand-900/40 dark:file:text-brand-300 hover:file:bg-brand-200 dark:hover:file:bg-brand-800/50 file:cursor-pointer cursor-pointer border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-800"
                aria-label="Upload certificate PDF"
              />
              {(pdfFile || editingCert?.fileName) && (
                <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
                  Selected: {pdfFile ? pdfFile.name : editingCert?.fileName}
                </p>
              )}
            </div>
            <div className="flex gap-2">
              <Button type="button" onClick={handleSave} disabled={!name.trim() || !effectiveHolderName || !expirationDate}>
                {isEditing ? 'Update certificate' : 'Save certificate'}
              </Button>
              <Button type="button" variant="ghost" onClick={closeForm}>Cancel</Button>
            </div>
          </div>
        </Card>
      )}

      <Card padding="lg">
        <CardHeader>All certificates</CardHeader>
        <CardDescription>Filter by status: current, expiring soon ({EXPIRING_DAYS} days), or expired.</CardDescription>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="border-b border-neutral-200 dark:border-neutral-600">
                <th className="py-2 pr-4 font-medium text-neutral-600 dark:text-neutral-400">Certificate</th>
                <th className="py-2 pr-4 font-medium text-neutral-600 dark:text-neutral-400">Holder</th>
                <th className="py-2 pr-4 font-medium text-neutral-600 dark:text-neutral-400">Expires</th>
                <th className="py-2 pr-4 font-medium text-neutral-600 dark:text-neutral-400">Uploaded</th>
                <th className="py-2 pr-4 font-medium text-neutral-600 dark:text-neutral-400">Status</th>
                <th className="py-2 font-medium text-neutral-600 dark:text-neutral-400">Actions</th>
              </tr>
            </thead>
            <tbody>
              {certificates.map((c) => {
                const status = getExpirationStatus(c.expirationDate)
                return (
                  <tr key={c.id} className="border-b border-neutral-100 dark:border-neutral-700">
                    <td className="py-3 pr-4">
                      <span className="font-medium text-neutral-900 dark:text-white">{c.name}</span>
                      {c.fileName && (
                        <span className="block text-xs text-neutral-500 dark:text-neutral-400">{c.fileName}</span>
                      )}
                    </td>
                    <td className="py-3 pr-4 text-neutral-700 dark:text-neutral-300">{c.holderName}</td>
                    <td className="py-3 pr-4 text-neutral-700 dark:text-neutral-300">{c.expirationDate}</td>
                    <td className="py-3 pr-4 text-neutral-500 dark:text-neutral-400">{c.uploadedBy} · {new Date(c.uploadedAt).toLocaleDateString()}</td>
                    <td className="py-3 pr-4">
                      {status === 'expired' && <Badge variant="danger">Expired</Badge>}
                      {status === 'expiring-soon' && <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-200">Expiring soon</Badge>}
                      {status === 'current' && <Badge variant="success">Current</Badge>}
                      {status === 'expiring-soon' && c.expirationReminderSentAt && (
                        <span className="block text-xs text-neutral-500 mt-1">Reminder sent to HR (simulated)</span>
                      )}
                    </td>
                    <td className="py-3">
                      <div className="flex items-center gap-2">
                        <Button type="button" variant="ghost" size="sm" onClick={() => setViewCertId(c.id)} aria-label="Quick view certificate">View</Button>
                        <Button type="button" variant="ghost" size="sm" onClick={() => openEdit(c)} aria-label="Edit certificate">Edit</Button>
                        <Button type="button" variant="ghost" size="sm" className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300" onClick={() => setPendingDeleteId(c.id)} aria-label="Delete certificate">Delete</Button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        {certificates.length === 0 && (
          <EmptyState
            title="No certificates yet"
            description="Upload a certificate with expiration date to get started. HR will receive a reminder when it is close to expiring."
            compact
          />
        )}
      </Card>

      {/* Quick view modal */}
      {viewCert && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 dark:bg-black/60 animate-fade-in no-print"
          onClick={() => setViewCertId(null)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="view-cert-title"
        >
          <Card
            padding="lg"
            className="max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-xl animate-fade-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <h2 id="view-cert-title" className="font-display font-bold text-xl text-neutral-900 dark:text-white">
                {viewCert.name}
              </h2>
              <div className="flex items-center gap-2 shrink-0">
                <Button type="button" size="sm" onClick={() => printCertificate(viewCert)}>Print</Button>
                <button
                  type="button"
                  onClick={() => setViewCertId(null)}
                  className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-500 dark:text-neutral-400"
                  aria-label="Close"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
            </div>
            <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
              {getExpirationStatus(viewCert.expirationDate) === 'expired' && <Badge variant="danger" className="mr-2">Expired</Badge>}
              {getExpirationStatus(viewCert.expirationDate) === 'expiring-soon' && <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-200 mr-2">Expiring soon</Badge>}
              {getExpirationStatus(viewCert.expirationDate) === 'current' && <Badge variant="success" className="mr-2">Current</Badge>}
              Uploaded by {viewCert.uploadedBy} · {new Date(viewCert.uploadedAt).toLocaleDateString()}
              {viewCert.expirationReminderSentAt && (
                <span className="block mt-1 text-xs text-neutral-500 dark:text-neutral-400">HR expiration reminder sent (simulated)</span>
              )}
            </p>
            <dl className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              <div>
                <dt className="font-medium text-neutral-500 dark:text-neutral-400">Holder</dt>
                <dd className="text-neutral-900 dark:text-white">{viewCert.holderName}</dd>
              </div>
              <div>
                <dt className="font-medium text-neutral-500 dark:text-neutral-400">Expiration date</dt>
                <dd className="text-neutral-900 dark:text-white">{viewCert.expirationDate}</dd>
              </div>
            </dl>
            <div className="mt-4 flex-1 min-h-0 border border-neutral-200 dark:border-neutral-600 rounded-lg bg-neutral-50 dark:bg-neutral-800/50 overflow-hidden flex flex-col">
              <div className="p-3 border-b border-neutral-200 dark:border-neutral-600 bg-neutral-100/80 dark:bg-neutral-800 font-medium text-sm text-neutral-700 dark:text-neutral-300">
                Attached PDF {viewCert.fileName && <span className="font-normal text-neutral-500 dark:text-neutral-400">· {viewCert.fileName}</span>}
              </div>
              <div className="flex-1 min-h-[200px] flex flex-col">
                {viewCert.fileDataUrl ? (
                  <iframe
                    src={viewCert.fileDataUrl}
                    title="Attached PDF"
                    className="w-full flex-1 min-h-[300px] border-0"
                  />
                ) : viewCert.fileName ? (
                  <div className="p-4 flex flex-col items-center justify-center min-h-[200px] text-center">
                    <p className="text-neutral-700 dark:text-neutral-300 font-medium">{viewCert.fileName}</p>
                    <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
                      PDF was not stored in this session. Re-upload to view and print the document.
                    </p>
                  </div>
                ) : (
                  <div className="p-4 flex items-center justify-center min-h-[200px]">
                    <p className="text-neutral-500 dark:text-neutral-400">No PDF attached</p>
                  </div>
                )}
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Delete confirmation popup */}
      {pendingDeleteId && (() => {
        const cert = certificates.find((c) => c.id === pendingDeleteId)
        return (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 dark:bg-black/60 animate-fade-in"
            onClick={() => setPendingDeleteId(null)}
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-cert-title"
          >
            <Card
              padding="lg"
              className="max-w-md w-full shadow-xl animate-fade-in"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 id="delete-cert-title" className="font-display font-bold text-xl text-neutral-900 dark:text-white">Delete certificate?</h2>
              <p className="mt-2 text-neutral-600 dark:text-neutral-400">
                {cert ? (
                  <>Are you sure you want to delete <strong>{cert.name}</strong> for {cert.holderName}? This cannot be undone.</>
                ) : (
                  'Are you sure? This cannot be undone.'
                )}
              </p>
              <div className="mt-6 flex gap-3 justify-end">
                <Button type="button" variant="ghost" onClick={() => setPendingDeleteId(null)}>Cancel</Button>
                <Button type="button" variant="danger" onClick={() => cert && confirmDelete(cert.id)}>Confirm delete</Button>
              </div>
            </Card>
          </div>
        )
      })()}
    </div>
  )
}
