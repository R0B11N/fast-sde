import React, { createContext, useContext, useState, useCallback } from 'react'
import type { ScannedPdfDocument } from '@/types'
import { MOCK_SCANNED_PDFS } from '@/data/mock'

interface ScannedPdfsContextValue {
  pdfs: ScannedPdfDocument[]
  addPdf: (doc: ScannedPdfDocument) => void
  getPdf: (id: string) => ScannedPdfDocument | undefined
}

const ScannedPdfsContext = createContext<ScannedPdfsContextValue | null>(null)

export function ScannedPdfsProvider({ children }: { children: React.ReactNode }) {
  const [pdfs, setPdfs] = useState<ScannedPdfDocument[]>(MOCK_SCANNED_PDFS)
  const addPdf = useCallback((doc: ScannedPdfDocument) => {
    setPdfs((prev) => (prev.some((p) => p.id === doc.id) ? prev : [...prev, doc]))
  }, [])
  const getPdf = useCallback(
    (id: string) => pdfs.find((p) => p.id === id),
    [pdfs]
  )
  return (
    <ScannedPdfsContext.Provider value={{ pdfs, addPdf, getPdf }}>
      {children}
    </ScannedPdfsContext.Provider>
  )
}

export function useScannedPdfs() {
  const ctx = useContext(ScannedPdfsContext)
  if (!ctx) return { pdfs: MOCK_SCANNED_PDFS, addPdf: () => {}, getPdf: (_: string) => undefined }
  return ctx
}
