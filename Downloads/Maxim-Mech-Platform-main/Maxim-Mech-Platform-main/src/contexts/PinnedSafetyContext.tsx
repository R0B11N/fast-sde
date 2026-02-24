import React, { createContext, useContext, useState, useCallback, useEffect } from 'react'

const STORAGE_KEY = 'maxim-pinned-safety'

export interface PinnedItem {
  to: string
  label: string
}

interface PinnedSafetyContextValue {
  pinned: PinnedItem[]
  isPinned: (to: string) => boolean
  togglePinned: (to: string, label: string) => void
}

const PinnedSafetyContext = createContext<PinnedSafetyContextValue | null>(null)

function loadPinned(): PinnedItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as PinnedItem[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function savePinned(items: PinnedItem[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
  } catch {
    // ignore
  }
}

export function PinnedSafetyProvider({ children }: { children: React.ReactNode }) {
  const [pinned, setPinned] = useState<PinnedItem[]>(loadPinned)

  useEffect(() => {
    savePinned(pinned)
  }, [pinned])

  const isPinned = useCallback(
    (to: string) => pinned.some((p) => p.to === to),
    [pinned]
  )

  const togglePinned = useCallback((to: string, label: string) => {
    setPinned((prev) => {
      const exists = prev.some((p) => p.to === to)
      if (exists) return prev.filter((p) => p.to !== to)
      return [...prev, { to, label }]
    })
  }, [])

  return (
    <PinnedSafetyContext.Provider value={{ pinned, isPinned, togglePinned }}>
      {children}
    </PinnedSafetyContext.Provider>
  )
}

export function usePinnedSafety() {
  const ctx = useContext(PinnedSafetyContext)
  if (!ctx)
    return {
      pinned: [] as PinnedItem[],
      isPinned: (_to: string) => false,
      togglePinned: (_to: string, _label: string) => {},
    }
  return ctx
}
