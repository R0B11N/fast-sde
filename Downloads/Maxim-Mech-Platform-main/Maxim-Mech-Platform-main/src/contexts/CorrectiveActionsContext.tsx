import React, { createContext, useContext, useState, useCallback } from 'react'
import type { CorrectiveAction } from '@/types'
import { MOCK_CORRECTIVE_ACTIONS } from '@/data/mock'

interface CorrectiveActionsContextValue {
  actions: CorrectiveAction[]
  addAction: (action: Omit<CorrectiveAction, 'id'>) => void
  updateAction: (id: string, updates: Partial<Omit<CorrectiveAction, 'id'>>) => void
  removeAction: (id: string) => void
}

const CorrectiveActionsContext = createContext<CorrectiveActionsContextValue | null>(null)

export function CorrectiveActionsProvider({ children }: { children: React.ReactNode }) {
  const [actions, setActions] = useState<CorrectiveAction[]>(MOCK_CORRECTIVE_ACTIONS)

  const addAction = useCallback((action: Omit<CorrectiveAction, 'id'>) => {
    setActions((prev) => [...prev, { ...action, id: `ca-${Date.now()}` }])
  }, [])

  const updateAction = useCallback((id: string, updates: Partial<Omit<CorrectiveAction, 'id'>>) => {
    setActions((prev) =>
      prev.map((a) => (a.id === id ? { ...a, ...updates } : a))
    )
  }, [])

  const removeAction = useCallback((id: string) => {
    setActions((prev) => prev.filter((a) => a.id !== id))
  }, [])

  return (
    <CorrectiveActionsContext.Provider value={{ actions, addAction, updateAction, removeAction }}>
      {children}
    </CorrectiveActionsContext.Provider>
  )
}

export function useCorrectiveActions() {
  const ctx = useContext(CorrectiveActionsContext)
  if (!ctx)
    return {
      actions: MOCK_CORRECTIVE_ACTIONS,
      addAction: () => {},
      updateAction: () => {},
      removeAction: () => {},
    }
  return ctx
}
