import React, { createContext, useContext, useState, useCallback, useEffect } from 'react'
import { MOCK_HR_TODOS } from '@/data/mock'
import type { HRTodoItem } from '@/types'

const STORAGE_KEY = 'maxim-hr-todos'

interface HRTodosContextValue {
  todos: HRTodoItem[]
  addTodo: (item: Omit<HRTodoItem, 'id' | 'createdAt'>) => void
  updateTodo: (id: string, patch: Partial<Pick<HRTodoItem, 'title' | 'dueDate' | 'dueTime' | 'recurrence' | 'completed' | 'completedAt' | 'linkTo'>>) => void
  removeTodo: (id: string) => void
  toggleComplete: (id: string) => void
}

const HRTodosContext = createContext<HRTodosContextValue | null>(null)

function loadTodos(): HRTodoItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return MOCK_HR_TODOS
    const parsed = JSON.parse(raw) as HRTodoItem[]
    return Array.isArray(parsed) ? parsed : MOCK_HR_TODOS
  } catch {
    return MOCK_HR_TODOS
  }
}

function saveTodos(items: HRTodoItem[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
  } catch {
    // ignore
  }
}

export function HRTodosProvider({ children }: { children: React.ReactNode }) {
  const [todos, setTodos] = useState<HRTodoItem[]>(loadTodos)

  useEffect(() => {
    saveTodos(todos)
  }, [todos])

  const addTodo = useCallback((item: Omit<HRTodoItem, 'id' | 'createdAt'>) => {
    const id = 'ht-' + Date.now()
    const newItem: HRTodoItem = {
      ...item,
      id,
      createdAt: new Date().toISOString(),
    }
    setTodos((prev) => [newItem, ...prev])
  }, [])

  const updateTodo = useCallback((id: string, patch: Partial<Pick<HRTodoItem, 'title' | 'dueDate' | 'recurrence' | 'completed' | 'completedAt' | 'linkTo'>>) => {
    setTodos((prev) =>
      prev.map((t) => (t.id === id ? { ...t, ...patch } : t))
    )
  }, [])

  const removeTodo = useCallback((id: string) => {
    setTodos((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const toggleComplete = useCallback((id: string) => {
    setTodos((prev) =>
      prev.map((t) => {
        if (t.id !== id) return t
        const completed = !t.completed
        return { ...t, completed, completedAt: completed ? new Date().toISOString() : undefined }
      })
    )
  }, [])

  const value: HRTodosContextValue = {
    todos,
    addTodo,
    updateTodo,
    removeTodo,
    toggleComplete,
  }

  return <HRTodosContext.Provider value={value}>{children}</HRTodosContext.Provider>
}

export function useHRTodos() {
  const ctx = useContext(HRTodosContext)
  if (!ctx)
    return {
      todos: MOCK_HR_TODOS,
      addTodo: () => {},
      updateTodo: () => {},
      removeTodo: () => {},
      toggleComplete: () => {},
    }
  return ctx
}
