import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { api, tokenStorage } from './api'

interface AuthContextValue {
  isAuthenticated: boolean
  isLoading: boolean
  login: (username: string, password: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(!!tokenStorage.getAccess())
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    setIsAuthenticated(!!tokenStorage.getAccess())
  }, [])

  async function login(username: string, password: string) {
    setIsLoading(true)
    try {
      const { data } = await api.post('/auth/token/', { username, password })
      tokenStorage.set(data.access, data.refresh)
      setIsAuthenticated(true)
    } finally {
      setIsLoading(false)
    }
  }

  function logout() {
    tokenStorage.clear()
    setIsAuthenticated(false)
  }

  return (
    <AuthContext.Provider value={{ isAuthenticated, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
