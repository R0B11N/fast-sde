import React, { createContext, useContext, useState } from 'react'

interface FrankContextValue {
  isOpen: boolean
  openChat: () => void
  closeChat: () => void
}

const FrankContext = createContext<FrankContextValue | null>(null)

export function FrankProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setOpen] = useState(false)
  return (
    <FrankContext.Provider value={{ isOpen, openChat: () => setOpen(true), closeChat: () => setOpen(false) }}>
      {children}
    </FrankContext.Provider>
  )
}

export function useFrank() {
  const ctx = useContext(FrankContext)
  if (!ctx) throw new Error('useFrank must be used within FrankProvider')
  return ctx
}
