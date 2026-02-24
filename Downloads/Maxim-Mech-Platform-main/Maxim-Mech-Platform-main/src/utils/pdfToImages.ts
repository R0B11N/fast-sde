import * as pdfjsLib from 'pdfjs-dist'
// Vite: resolve worker so it's copied to output and we get a valid URL
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.mjs?url'
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl

/**
 * Renders each page of a PDF (given as a data URL) to PNG image data URLs.
 * Use these in print HTML so the PDF content actually prints.
 */
export async function pdfDataUrlToImageDataUrls(dataUrl: string): Promise<string[]> {
  const base64 = dataUrl.split(',')[1]
  if (!base64) return []
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  const loadingTask = pdfjsLib.getDocument({ data: bytes })
  const pdf = await loadingTask.promise
  const numPages = pdf.numPages
  const scale = 2
  const out: string[] = []
  for (let i = 1; i <= numPages; i++) {
    const page = await pdf.getPage(i)
    const viewport = page.getViewport({ scale })
    const canvas = document.createElement('canvas')
    canvas.width = viewport.width
    canvas.height = viewport.height
    const ctx = canvas.getContext('2d')
    if (!ctx) continue
    await page.render({
      canvasContext: ctx,
      canvas,
      viewport,
      intent: 'print',
    }).promise
    out.push(canvas.toDataURL('image/png'))
  }
  return out
}
