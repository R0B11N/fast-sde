import React, { createContext, useContext, useState, useCallback } from 'react'
import type { SignableFormSubmission } from '@/types'
import { MOCK_SIGNABLE_SUBMISSIONS } from '@/data/mock'

interface SignableSubmissionsContextValue {
  submissions: SignableFormSubmission[]
  getSubmission: (id: string) => SignableFormSubmission | undefined
  addSubmission: (submission: SignableFormSubmission) => void
  updateSubmission: (id: string, updates: Partial<SignableFormSubmission>) => void
}

const SignableSubmissionsContext = createContext<SignableSubmissionsContextValue | null>(null)

export function SignableSubmissionsProvider({ children }: { children: React.ReactNode }) {
  const [submissions, setSubmissions] = useState<SignableFormSubmission[]>(MOCK_SIGNABLE_SUBMISSIONS)

  const getSubmission = useCallback(
    (id: string) => submissions.find((s) => s.id === id),
    [submissions]
  )

  const addSubmission = useCallback((submission: SignableFormSubmission) => {
    setSubmissions((prev) => (prev.some((s) => s.id === submission.id) ? prev : [...prev, submission]))
  }, [])

  const updateSubmission = useCallback((id: string, updates: Partial<SignableFormSubmission>) => {
    setSubmissions((prev) =>
      prev.map((s) => (s.id === id ? { ...s, ...updates } : s))
    )
  }, [])

  return (
    <SignableSubmissionsContext.Provider value={{ submissions, getSubmission, addSubmission, updateSubmission }}>
      {children}
    </SignableSubmissionsContext.Provider>
  )
}

export function useSignableSubmissions() {
  const ctx = useContext(SignableSubmissionsContext)
  if (!ctx)
    return {
      submissions: MOCK_SIGNABLE_SUBMISSIONS,
      getSubmission: (_: string) => undefined,
      addSubmission: () => {},
      updateSubmission: () => {},
    }
  return ctx
}
