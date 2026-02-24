import { useState, useEffect, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { Button } from '@/components/ui/Button'

interface PdfViewerProps {
  /** Data URL of the PDF (or image) to display. */
  fileDataUrl: string
  /** Display name for the file (e.g. "Safety Handbook.pdf"). */
  fileName?: string
  /** Button label for quick view. */
  quickViewLabel?: string
  /** Button label for open in new tab. */
  openInNewTabLabel?: string
  /** Size of the action buttons. */
  size?: 'sm' | 'md' | 'lg'
}

/**
 * Renders "Quick view" (modal with iframe) and "Open in new tab" so users can view a PDF without downloading.
 */
export function PdfViewer({
  fileDataUrl,
  fileName,
  quickViewLabel = 'Quick view',
  openInNewTabLabel = 'Open in new tab',
  size = 'sm',
}: PdfViewerProps) {
  const [showModal, setShowModal] = useState(false)
  const [mounted, setMounted] = useState(false)
  const closeButtonRef = useRef<HTMLButtonElement>(null)
  useEffect(() => setMounted(true), [])

  const closeModal = useCallback(() => setShowModal(false), [])

  useEffect(() => {
    if (!showModal) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const previouslyFocused = document.activeElement as HTMLElement | null
    const focusClose = () => {
      closeButtonRef.current?.focus()
    }
    const t = setTimeout(focusClose, 50)
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeModal()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => {
      clearTimeout(t)
      document.body.style.overflow = prev
      document.removeEventListener('keydown', onKeyDown)
      previouslyFocused?.focus()
    }
  }, [showModal, closeModal])

  const openInNewTab = () => {
    const w = window.open('', '_blank')
    if (!w) return
    w.document.write(`
      <!DOCTYPE html>
      <html><head><meta charset="utf-8"><title>${fileName ? escapeHtml(fileName) : 'Document'}</title>
      <style>body{margin:0;height:100vh;display:flex;flex-direction:column;}
      .toolbar{padding:8px 12px;background:#f1f5f9;border-bottom:1px solid #e2e8f0;display:flex;gap:8px;align-items:center;}
      .toolbar a{color:#475569;text-decoration:none;font-size:14px;}
      iframe{flex:1;width:100%;border:none;}
      </style></head>
      <body>
        <div class="toolbar">
          <a href="#" onclick="window.close();return false;">Close</a>
          <span style="color:#64748b;font-size:14px;">${fileName ? escapeHtml(fileName) : 'Document'}</span>
        </div>
        <iframe src="${fileDataUrl.replace(/"/g, '&quot;')}" title="${fileName ? escapeHtml(fileName) : 'Document'}"></iframe>
      </body></html>
    `)
    w.document.close()
  }

  return (
    <>
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          size={size}
          onClick={() => setShowModal(true)}
        >
          {quickViewLabel}
        </Button>
        <Button
          type="button"
          variant="outline"
          size={size}
          onClick={openInNewTab}
        >
          {openInNewTabLabel}
        </Button>
      </div>

      {showModal && mounted &&
        createPortal(
          <div
            className="fixed inset-0 z-[9999] flex flex-col bg-black/70"
            role="dialog"
            aria-modal="true"
            aria-label="View document"
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              width: '100vw',
              height: '100vh',
              maxHeight: '-webkit-fill-available',
            }}
          >
            <div className="flex shrink-0 items-center justify-between gap-4 px-4 py-3 bg-neutral-100 dark:bg-neutral-800 border-b border-neutral-200 dark:border-neutral-700">
              <span className="font-medium text-neutral-900 dark:text-white truncate">
                {fileName ?? 'Document'}
              </span>
              <div className="flex items-center gap-2 shrink-0">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={openInNewTab}
                >
                  Open in new tab
                </Button>
                <button
                  ref={closeButtonRef}
                  type="button"
                  onClick={closeModal}
                  className="p-2 rounded-lg hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-600 dark:text-neutral-400"
                  aria-label="Close (Escape)"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            <div
              className="w-full flex-1 bg-white overflow-hidden"
              style={{
                flex: '1 1 0',
                minHeight: 0,
                height: 'calc(100vh - 56px)',
              }}
            >
              <iframe
                src={fileDataUrl}
                title={fileName ?? 'Document'}
                className="w-full h-full border-0 bg-white block"
                style={{
                  display: 'block',
                  width: '100%',
                  height: '100%',
                  minHeight: 'calc(100vh - 56px)',
                }}
              />
            </div>
          </div>,
          document.body
        )}
    </>
  )
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}
