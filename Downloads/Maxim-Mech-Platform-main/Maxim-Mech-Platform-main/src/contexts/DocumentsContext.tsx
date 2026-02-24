import React, { createContext, useContext, useState } from 'react'
import type { DocumentRecord } from '@/types'
import { MOCK_DOCUMENTS } from '@/data/mock'

interface DocumentsContextValue {
  documents: DocumentRecord[]
  setDocuments: React.Dispatch<React.SetStateAction<DocumentRecord[]>>
}

const DocumentsContext = createContext<DocumentsContextValue | null>(null)

export function DocumentsProvider({ children }: { children: React.ReactNode }) {
  const [documents, setDocuments] = useState<DocumentRecord[]>(MOCK_DOCUMENTS)
  return (
    <DocumentsContext.Provider value={{ documents, setDocuments }}>
      {children}
    </DocumentsContext.Provider>
  )
}

export function useDocuments() {
  const ctx = useContext(DocumentsContext)
  if (!ctx) return { documents: MOCK_DOCUMENTS, setDocuments: () => {} }
  return ctx
}
