import React, { createContext, useContext, useState, useCallback } from 'react'
import type { FormSubmission, FormAuditEvent } from '@/types'
import { MOCK_FORM_SUBMISSIONS } from '@/data/mock'

interface FormSubmissionsContextValue {
  submissions: FormSubmission[]
  getSubmission: (id: string) => FormSubmission | undefined
  updateSubmission: (id: string, updates: Partial<FormSubmission>) => void
  addSubmission: (submission: FormSubmission) => void
  addAuditEvent: (submissionId: string, event: Omit<FormAuditEvent, 'id'>) => void
}

const FormSubmissionsContext = createContext<FormSubmissionsContextValue | null>(null)

export function FormSubmissionsProvider({ children }: { children: React.ReactNode }) {
  const [submissions, setSubmissions] = useState<FormSubmission[]>(MOCK_FORM_SUBMISSIONS)

  const getSubmission = useCallback(
    (id: string) => submissions.find((s) => s.id === id),
    [submissions]
  )

  const updateSubmission = useCallback((id: string, updates: Partial<FormSubmission>) => {
    setSubmissions((prev) =>
      prev.map((s) => (s.id === id ? { ...s, ...updates } : s))
    )
  }, [])

  const addSubmission = useCallback((submission: FormSubmission) => {
    setSubmissions((prev) => (prev.some((s) => s.id === submission.id) ? prev : [...prev, submission]))
  }, [])

  const addAuditEvent = useCallback((submissionId: string, event: Omit<FormAuditEvent, 'id'>) => {
    const newEvent: FormAuditEvent = { ...event, id: `ev-${Date.now()}` }
    setSubmissions((prev) =>
      prev.map((s) =>
        s.id === submissionId
          ? { ...s, auditEvents: [...(s.auditEvents ?? []), newEvent] }
          : s
      )
    )
  }, [])

  return (
    <FormSubmissionsContext.Provider value={{ submissions, getSubmission, updateSubmission, addSubmission, addAuditEvent }}>
      {children}
    </FormSubmissionsContext.Provider>
  )
}

export function useFormSubmissions() {
  const ctx = useContext(FormSubmissionsContext)
  if (!ctx)
    return {
      submissions: MOCK_FORM_SUBMISSIONS,
      getSubmission: (_: string) => undefined,
      updateSubmission: () => {},
      addSubmission: () => {},
      addAuditEvent: () => {},
    }
  return ctx
}
