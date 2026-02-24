import React, { createContext, useContext, useState, useCallback } from 'react'
import type { InjuryReport } from '@/types'
import { MOCK_INJURY_REPORTS } from '@/data/mock'

interface InjuryReportsContextValue {
  reports: InjuryReport[]
  getReport: (id: string) => InjuryReport | undefined
  updateReport: (id: string, updates: Partial<Omit<InjuryReport, 'id'>>) => void
}

const InjuryReportsContext = createContext<InjuryReportsContextValue | null>(null)

export function InjuryReportsProvider({ children }: { children: React.ReactNode }) {
  const [reports, setReports] = useState<InjuryReport[]>(MOCK_INJURY_REPORTS)

  const getReport = useCallback((id: string) => reports.find((r) => r.id === id), [reports])

  const updateReport = useCallback((id: string, updates: Partial<Omit<InjuryReport, 'id'>>) => {
    setReports((prev) => prev.map((r) => (r.id === id ? { ...r, ...updates } : r)))
  }, [])

  return (
    <InjuryReportsContext.Provider value={{ reports, getReport, updateReport }}>
      {children}
    </InjuryReportsContext.Provider>
  )
}

export function useInjuryReports() {
  const ctx = useContext(InjuryReportsContext)
  if (!ctx)
    return {
      reports: MOCK_INJURY_REPORTS,
      getReport: (id: string) => MOCK_INJURY_REPORTS.find((r) => r.id === id),
      updateReport: () => {},
    }
  return ctx
}
