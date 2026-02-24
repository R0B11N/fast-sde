import React, { createContext, useContext, useState, useCallback } from 'react'

export type PresenceRecordType = 'document' | 'form' | 'subcontractor'

export interface PresenceEntry {
  userId: string
  userName: string
  openedAt: string
}

type PresenceKey = string

function presenceKey(type: PresenceRecordType, id: string): PresenceKey {
  return `${type}:${id}`
}

interface PresenceContextValue {
  /** Who is currently viewing each record (in this browser/session). */
  getPresence: (type: PresenceRecordType, recordId: string) => PresenceEntry[]
  addPresence: (type: PresenceRecordType, recordId: string, user: { id: string; name: string }) => void
  removePresence: (type: PresenceRecordType, recordId: string, userId: string) => void
}

const PresenceContext = createContext<PresenceContextValue | null>(null)

export function PresenceProvider({ children }: { children: React.ReactNode }) {
  const [presence, setPresence] = useState<Record<PresenceKey, PresenceEntry[]>>({})

  const getPresence = useCallback(
    (type: PresenceRecordType, recordId: string): PresenceEntry[] => {
      const key = presenceKey(type, recordId)
      return presence[key] ?? []
    },
    [presence]
  )

  const addPresence = useCallback(
    (type: PresenceRecordType, recordId: string, user: { id: string; name: string }) => {
      const key = presenceKey(type, recordId)
      const entry: PresenceEntry = {
        userId: user.id,
        userName: user.name,
        openedAt: new Date().toISOString(),
      }
      setPresence((prev) => {
        const list = prev[key] ?? []
        if (list.some((e) => e.userId === user.id)) return prev
        return { ...prev, [key]: [...list, entry] }
      })
    },
    []
  )

  const removePresence = useCallback(
    (type: PresenceRecordType, recordId: string, userId: string) => {
      const key = presenceKey(type, recordId)
      setPresence((prev) => {
        const list = (prev[key] ?? []).filter((e) => e.userId !== userId)
        if (list.length === 0) {
          const next = { ...prev }
          delete next[key]
          return next
        }
        return { ...prev, [key]: list }
      })
    },
    []
  )

  return (
    <PresenceContext.Provider value={{ getPresence, addPresence, removePresence }}>
      {children}
    </PresenceContext.Provider>
  )
}

export function usePresence() {
  const ctx = useContext(PresenceContext)
  if (!ctx)
    return {
      getPresence: () => [] as PresenceEntry[],
      addPresence: () => {},
      removePresence: () => {},
    }
  return ctx
}
