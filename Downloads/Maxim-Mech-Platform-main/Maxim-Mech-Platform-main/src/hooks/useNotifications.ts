import { useState, useMemo } from 'react'
import { MOCK_NOTIFICATIONS } from '@/data/mock'

export function useNotifications() {
  const [list, setList] = useState(MOCK_NOTIFICATIONS)
  const [open, setOpen] = useState(false)

  const unreadCount = useMemo(() => list.filter((n) => !n.read).length, [list])

  const markRead = (id: string) => {
    setList((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)))
  }

  const markAllRead = () => {
    setList((prev) => prev.map((n) => ({ ...n, read: true })))
  }

  return { notifications: list, unreadCount, markRead, markAllRead, open, setOpen }
}
