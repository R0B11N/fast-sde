import React, { createContext, useContext, useState, useCallback } from 'react'
import type { Certificate } from '@/types'
import { MOCK_CERTIFICATES } from '@/data/mock'

interface CertificatesContextValue {
  certificates: Certificate[]
  setCertificates: React.Dispatch<React.SetStateAction<Certificate[]>>
  addCertificate: (cert: Certificate) => void
  updateCertificate: (id: string, updates: Partial<Omit<Certificate, 'id'>>) => void
  removeCertificate: (id: string) => void
  markReminderSent: (id: string) => void
}

const CertificatesContext = createContext<CertificatesContextValue | null>(null)

export function CertificatesProvider({ children }: { children: React.ReactNode }) {
  const [certificates, setCertificates] = useState<Certificate[]>(MOCK_CERTIFICATES)

  const addCertificate = useCallback((cert: Certificate) => {
    setCertificates((prev) => [...prev, cert])
  }, [])

  const updateCertificate = useCallback((id: string, updates: Partial<Omit<Certificate, 'id'>>) => {
    setCertificates((prev) =>
      prev.map((c) => (c.id === id ? { ...c, ...updates } : c))
    )
  }, [])

  const removeCertificate = useCallback((id: string) => {
    setCertificates((prev) => prev.filter((c) => c.id !== id))
  }, [])

  const markReminderSent = useCallback((id: string) => {
    setCertificates((prev) =>
      prev.map((c) =>
        c.id === id ? { ...c, expirationReminderSentAt: new Date().toISOString() } : c
      )
    )
  }, [])

  return (
    <CertificatesContext.Provider value={{ certificates, setCertificates, addCertificate, updateCertificate, removeCertificate, markReminderSent }}>
      {children}
    </CertificatesContext.Provider>
  )
}

export function useCertificates() {
  const ctx = useContext(CertificatesContext)
  if (!ctx)
    return {
      certificates: MOCK_CERTIFICATES,
      setCertificates: () => {},
      addCertificate: () => {},
      updateCertificate: () => {},
      removeCertificate: () => {},
      markReminderSent: () => {},
    }
  return ctx
}
