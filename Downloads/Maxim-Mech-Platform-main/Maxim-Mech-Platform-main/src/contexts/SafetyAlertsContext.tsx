import React, { createContext, useContext, useState, useCallback } from 'react'
import type { SafetyAlert } from '@/types'
import { MOCK_SAFETY_ALERTS } from '@/data/mock'

interface SafetyAlertsContextValue {
  alerts: SafetyAlert[]
  addAlert: (alert: Omit<SafetyAlert, 'id'>) => void
  updateAlert: (id: string, updates: Partial<Omit<SafetyAlert, 'id'>>) => void
  removeAlert: (id: string) => void
}

const SafetyAlertsContext = createContext<SafetyAlertsContextValue | null>(null)

export function SafetyAlertsProvider({ children }: { children: React.ReactNode }) {
  const [alerts, setAlerts] = useState<SafetyAlert[]>(MOCK_SAFETY_ALERTS)

  const addAlert = useCallback((alert: Omit<SafetyAlert, 'id'>) => {
    setAlerts((prev) => [...prev, { ...alert, id: `sa-${Date.now()}` }])
  }, [])

  const updateAlert = useCallback((id: string, updates: Partial<Omit<SafetyAlert, 'id'>>) => {
    setAlerts((prev) =>
      prev.map((a) => (a.id === id ? { ...a, ...updates } : a))
    )
  }, [])

  const removeAlert = useCallback((id: string) => {
    setAlerts((prev) => prev.filter((a) => a.id !== id))
  }, [])

  return (
    <SafetyAlertsContext.Provider value={{ alerts, addAlert, updateAlert, removeAlert }}>
      {children}
    </SafetyAlertsContext.Provider>
  )
}

export function useSafetyAlerts() {
  const ctx = useContext(SafetyAlertsContext)
  if (!ctx)
    return {
      alerts: MOCK_SAFETY_ALERTS,
      addAlert: () => {},
      updateAlert: () => {},
      removeAlert: () => {},
    }
  return ctx
}
