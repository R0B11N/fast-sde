import React, { createContext, useContext, useState } from 'react'
import type { User, UserRole } from '@/types'

interface UserContextValue {
  user: User | null
  setUser: (u: User | null) => void
  login: (email: string, _password: string) => void
  logout: () => void
  switchRole: (role: UserRole) => void
}

const UserContext = createContext<UserContextValue | null>(null)

const MOCK_USERS: User[] = [
  { id: '1', name: 'Alex Chen', email: 'alex@maximmechanical.com', role: 'owner', active: true },
  { id: '4', name: 'Morgan Reed', email: 'morgan@maximmechanical.com', role: 'hr', active: true },
  { id: '2', name: 'Jordan Smith', email: 'jordan@maximmechanical.com', role: 'supervisor', active: true },
  { id: '6', name: 'Pat Davis', email: 'pat@maximmechanical.com', role: 'supervisor', active: true },
  { id: '7', name: 'Frank', email: 'frank@maximmechanical.com', role: 'supervisor', active: true },
  { id: '3', name: 'Sam Williams', email: 'sam@maximmechanical.com', role: 'labourer', active: true },
  { id: '5', name: 'Taylor Brown', email: 'taylor@maximmechanical.com', role: 'labourer', active: true },
]

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)

  const login = (email: string, _password: string) => {
    const found = MOCK_USERS.find((u) => u.email.toLowerCase() === email.toLowerCase())
    setUser(found || { id: 'guest', name: 'Guest', email, role: 'labourer', active: true })
  }

  const logout = () => setUser(null)

  const switchRole = (role: UserRole) => {
    if (!user) return
    setUser({ ...user, role })
  }

  return (
    <UserContext.Provider value={{ user, setUser, login, logout, switchRole }}>
      {children}
    </UserContext.Provider>
  )
}

export function useUser() {
  const ctx = useContext(UserContext)
  if (!ctx) throw new Error('useUser must be used within UserProvider')
  return ctx
}
