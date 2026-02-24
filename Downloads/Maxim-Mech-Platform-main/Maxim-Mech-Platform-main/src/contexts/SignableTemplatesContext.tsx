import React, { createContext, useContext, useState, useCallback } from 'react'
import type { SignableFormTemplate } from '@/types'
import { MOCK_SIGNABLE_FORM_TEMPLATES } from '@/data/mock'

interface SignableTemplatesContextValue {
  templates: SignableFormTemplate[]
  addTemplate: (t: SignableFormTemplate) => void
  updateTemplateBySourcePdf: (sourcePdfId: string, updates: Partial<SignableFormTemplate>) => void
  updateTemplate: (id: string, updates: Partial<SignableFormTemplate>) => void
}

const SignableTemplatesContext = createContext<SignableTemplatesContextValue | null>(null)

export function SignableTemplatesProvider({ children }: { children: React.ReactNode }) {
  const [templates, setTemplates] = useState<SignableFormTemplate[]>(MOCK_SIGNABLE_FORM_TEMPLATES)
  const addTemplate = useCallback((t: SignableFormTemplate) => {
    setTemplates((prev) => (prev.some((x) => x.id === t.id) ? prev : [...prev, t]))
  }, [])
  const updateTemplateBySourcePdf = useCallback((sourcePdfId: string, updates: Partial<SignableFormTemplate>) => {
    setTemplates((prev) =>
      prev.map((t) => (t.sourcePdfId === sourcePdfId ? { ...t, ...updates } : t))
    )
  }, [])
  const updateTemplate = useCallback((id: string, updates: Partial<SignableFormTemplate>) => {
    setTemplates((prev) => prev.map((t) => (t.id === id ? { ...t, ...updates } : t)))
  }, [])
  return (
    <SignableTemplatesContext.Provider value={{ templates, addTemplate, updateTemplateBySourcePdf, updateTemplate }}>
      {children}
    </SignableTemplatesContext.Provider>
  )
}

export function useSignableTemplates() {
  const ctx = useContext(SignableTemplatesContext)
  if (!ctx)
    return {
      templates: MOCK_SIGNABLE_FORM_TEMPLATES,
      addTemplate: () => {},
      updateTemplateBySourcePdf: () => {},
      updateTemplate: () => {},
    }
  return ctx
}
