import React, { createContext, useContext, useState, useCallback } from 'react'
import type {
  Subcontractor,
  SubcontractorCertification,
  SubcontractorJobAssignment,
  SubcontractorPersonnel,
  SubcontractorPersonnelCertification,
  SubcontractorPersonnelJobAssignment,
  SubcontractorPersonnelCheckIn,
} from '@/types'
import {
  MOCK_SUBCONTRACTORS,
  MOCK_SUBCONTRACTOR_CERTIFICATIONS,
  MOCK_SUBCONTRACTOR_JOB_ASSIGNMENTS,
  MOCK_SUBCONTRACTOR_PERSONNEL,
  MOCK_SUBCONTRACTOR_PERSONNEL_CERTIFICATIONS,
  MOCK_SUBCONTRACTOR_PERSONNEL_JOB_ASSIGNMENTS,
  MOCK_SUBCONTRACTOR_PERSONNEL_CHECK_INS,
} from '@/data/mock'

const EXPIRING_DAYS = 30

function certStatusFromExpiry(expiresAt: string): 'current' | 'expiring-soon' | 'expired' {
  const today = new Date().toISOString().slice(0, 10)
  const in30 = new Date(Date.now() + EXPIRING_DAYS * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
  if (expiresAt < today) return 'expired'
  if (expiresAt <= in30) return 'expiring-soon'
  return 'current'
}

interface SubcontractorsContextValue {
  subcontractors: Subcontractor[]
  certifications: SubcontractorCertification[]
  jobAssignments: SubcontractorJobAssignment[]
  updateSubcontractor: (id: string, updates: Partial<Omit<Subcontractor, 'id'>>) => void
  addCertification: (cert: Omit<SubcontractorCertification, 'id' | 'status'>) => SubcontractorCertification
  updateCertification: (id: string, updates: Partial<Pick<SubcontractorCertification, 'name' | 'issuedAt' | 'expiresAt'>>) => void
  removeCertification: (id: string) => void
  addJobAssignment: (assignment: Omit<SubcontractorJobAssignment, 'id'>) => void
  removeJobAssignment: (id: string) => void
  // Contractor personnel (workers) and their job assignments
  personnel: SubcontractorPersonnel[]
  personnelCertifications: SubcontractorPersonnelCertification[]
  personnelJobAssignments: SubcontractorPersonnelJobAssignment[]
  personnelCheckIns: SubcontractorPersonnelCheckIn[]
  addPersonnel: (p: Omit<SubcontractorPersonnel, 'id'>) => SubcontractorPersonnel
  updatePersonnel: (id: string, updates: Partial<Pick<SubcontractorPersonnel, 'name' | 'email'>>) => void
  removePersonnel: (id: string) => void
  addPersonnelCertification: (cert: Omit<SubcontractorPersonnelCertification, 'id' | 'status'>) => SubcontractorPersonnelCertification
  updatePersonnelCertification: (id: string, updates: Partial<Pick<SubcontractorPersonnelCertification, 'name' | 'issuedAt' | 'expiresAt'>>) => void
  removePersonnelCertification: (id: string) => void
  addPersonnelJobAssignment: (a: Omit<SubcontractorPersonnelJobAssignment, 'id'>) => void
  removePersonnelJobAssignment: (id: string) => void
}

const SubcontractorsContext = createContext<SubcontractorsContextValue | null>(null)

export function SubcontractorsProvider({ children }: { children: React.ReactNode }) {
  const [subcontractors, setSubcontractors] = useState<Subcontractor[]>(MOCK_SUBCONTRACTORS)
  const [certifications, setCertifications] = useState<SubcontractorCertification[]>(MOCK_SUBCONTRACTOR_CERTIFICATIONS)
  const [jobAssignments, setJobAssignments] = useState<SubcontractorJobAssignment[]>(MOCK_SUBCONTRACTOR_JOB_ASSIGNMENTS)
  const [personnel, setPersonnel] = useState<SubcontractorPersonnel[]>(MOCK_SUBCONTRACTOR_PERSONNEL)
  const [personnelCertifications, setPersonnelCertifications] = useState<SubcontractorPersonnelCertification[]>(MOCK_SUBCONTRACTOR_PERSONNEL_CERTIFICATIONS)
  const [personnelJobAssignments, setPersonnelJobAssignments] = useState<SubcontractorPersonnelJobAssignment[]>(MOCK_SUBCONTRACTOR_PERSONNEL_JOB_ASSIGNMENTS)
  const [personnelCheckIns, setPersonnelCheckIns] = useState<SubcontractorPersonnelCheckIn[]>(MOCK_SUBCONTRACTOR_PERSONNEL_CHECK_INS)

  const updateSubcontractor = useCallback((id: string, updates: Partial<Omit<Subcontractor, 'id'>>) => {
    setSubcontractors((prev) => prev.map((s) => (s.id === id ? { ...s, ...updates } : s)))
  }, [])

  const addCertification = useCallback(
    (cert: Omit<SubcontractorCertification, 'id' | 'status'>): SubcontractorCertification => {
      const status = certStatusFromExpiry(cert.expiresAt)
      const newCert: SubcontractorCertification = {
        ...cert,
        id: `scc-${Date.now()}`,
        status,
      }
      setCertifications((prev) => [...prev, newCert])
      return newCert
    },
    []
  )

  const updateCertification = useCallback(
    (id: string, updates: Partial<Pick<SubcontractorCertification, 'name' | 'issuedAt' | 'expiresAt'>>) => {
      setCertifications((prev) =>
        prev.map((c) => {
          if (c.id !== id) return c
          const next = { ...c, ...updates }
          if (updates.expiresAt !== undefined) next.status = certStatusFromExpiry(updates.expiresAt)
          return next
        })
      )
    },
    []
  )

  const removeCertification = useCallback((id: string) => {
    setCertifications((prev) => prev.filter((c) => c.id !== id))
  }, [])

  const addJobAssignment = useCallback((assignment: Omit<SubcontractorJobAssignment, 'id'>) => {
    setJobAssignments((prev) => [
      ...prev,
      { ...assignment, id: `sja-${Date.now()}` },
    ])
  }, [])

  const removeJobAssignment = useCallback((id: string) => {
    setJobAssignments((prev) => prev.filter((a) => a.id !== id))
  }, [])

  const addPersonnel = useCallback((p: Omit<SubcontractorPersonnel, 'id'>): SubcontractorPersonnel => {
    const newP: SubcontractorPersonnel = { ...p, id: `sp-${Date.now()}` }
    setPersonnel((prev) => [...prev, newP])
    return newP
  }, [])

  const updatePersonnel = useCallback((id: string, updates: Partial<Pick<SubcontractorPersonnel, 'name' | 'email'>>) => {
    setPersonnel((prev) => prev.map((p) => (p.id === id ? { ...p, ...updates } : p)))
  }, [])

  const removePersonnel = useCallback((id: string) => {
    setPersonnel((prev) => prev.filter((p) => p.id !== id))
    setPersonnelCertifications((prev) => prev.filter((c) => c.personnelId !== id))
    setPersonnelJobAssignments((prev) => prev.filter((a) => a.personnelId !== id))
    setPersonnelCheckIns((prev) => prev.filter((c) => c.personnelId !== id))
  }, [])

  const addPersonnelCertification = useCallback(
    (cert: Omit<SubcontractorPersonnelCertification, 'id' | 'status'>): SubcontractorPersonnelCertification => {
      const status = certStatusFromExpiry(cert.expiresAt)
      const newC: SubcontractorPersonnelCertification = { ...cert, id: `spc-${Date.now()}`, status }
      setPersonnelCertifications((prev) => [...prev, newC])
      return newC
    },
    []
  )

  const updatePersonnelCertification = useCallback(
    (id: string, updates: Partial<Pick<SubcontractorPersonnelCertification, 'name' | 'issuedAt' | 'expiresAt'>>) => {
      setPersonnelCertifications((prev) =>
        prev.map((c) => {
          if (c.id !== id) return c
          const next = { ...c, ...updates }
          if (updates.expiresAt !== undefined) next.status = certStatusFromExpiry(updates.expiresAt)
          return next
        })
      )
    },
    []
  )

  const removePersonnelCertification = useCallback((id: string) => {
    setPersonnelCertifications((prev) => prev.filter((c) => c.id !== id))
  }, [])

  const addPersonnelJobAssignment = useCallback((a: Omit<SubcontractorPersonnelJobAssignment, 'id'>) => {
    setPersonnelJobAssignments((prev) => [...prev, { ...a, id: `spja-${Date.now()}` }])
  }, [])

  const removePersonnelJobAssignment = useCallback((id: string) => {
    setPersonnelJobAssignments((prev) => prev.filter((x) => x.id !== id))
  }, [])

  return (
    <SubcontractorsContext.Provider
      value={{
        subcontractors,
        certifications,
        jobAssignments,
        updateSubcontractor,
        addCertification,
        updateCertification,
        removeCertification,
        addJobAssignment,
        removeJobAssignment,
        personnel,
        personnelCertifications,
        personnelJobAssignments,
        personnelCheckIns,
        addPersonnel,
        updatePersonnel,
        removePersonnel,
        addPersonnelCertification,
        updatePersonnelCertification,
        removePersonnelCertification,
        addPersonnelJobAssignment,
        removePersonnelJobAssignment,
      }}
    >
      {children}
    </SubcontractorsContext.Provider>
  )
}

const noopPersonnelCert = (): SubcontractorPersonnelCertification =>
  ({ id: '', personnelId: '', name: '', issuedAt: '', expiresAt: '', status: 'current' })

export function useSubcontractors() {
  const ctx = useContext(SubcontractorsContext)
  if (!ctx)
    return {
      subcontractors: MOCK_SUBCONTRACTORS,
      certifications: MOCK_SUBCONTRACTOR_CERTIFICATIONS,
      jobAssignments: MOCK_SUBCONTRACTOR_JOB_ASSIGNMENTS,
      updateSubcontractor: () => {},
      addCertification: () => ({ id: '', subcontractorId: '', name: '', issuedAt: '', expiresAt: '', status: 'current' as const }),
      updateCertification: () => {},
      removeCertification: () => {},
      addJobAssignment: () => {},
      removeJobAssignment: () => {},
      personnel: MOCK_SUBCONTRACTOR_PERSONNEL,
      personnelCertifications: MOCK_SUBCONTRACTOR_PERSONNEL_CERTIFICATIONS,
      personnelJobAssignments: MOCK_SUBCONTRACTOR_PERSONNEL_JOB_ASSIGNMENTS,
      personnelCheckIns: MOCK_SUBCONTRACTOR_PERSONNEL_CHECK_INS,
      addPersonnel: () => ({ id: '', subcontractorId: '', name: '', email: undefined }),
      updatePersonnel: () => {},
      removePersonnel: () => {},
      addPersonnelCertification: () => noopPersonnelCert(),
      updatePersonnelCertification: () => {},
      removePersonnelCertification: () => {},
      addPersonnelJobAssignment: () => {},
      removePersonnelJobAssignment: () => {},
    }
  return ctx
}
