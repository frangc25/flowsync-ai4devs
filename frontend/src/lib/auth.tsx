import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'

import { api, type SignupInput } from '@/lib/api'

const TOKEN_KEY = 'flowsync.token'

interface AuthContextValue {
  token: string | null
  login: (email: string, password: string) => Promise<void>
  signup: (input: SignupInput) => Promise<void>
  logout: () => Promise<void>
  clearSession: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

function readToken() {
  try {
    return localStorage.getItem(TOKEN_KEY)
  } catch {
    return null
  }
}

function writeToken(token: string | null) {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token)
    else localStorage.removeItem(TOKEN_KEY)
  } catch {
    // almacenamiento no disponible: la sesión dura lo que dure la pestaña
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(readToken)

  const setSession = useCallback((value: string | null) => {
    writeToken(value)
    setToken(value)
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      token,
      login: async (email, password) => setSession((await api.login({ email, password })).token),
      signup: async (input) => setSession((await api.signup(input)).token),
      logout: async () => {
        if (token) await api.logout(token).catch(() => undefined)
        setSession(null)
      },
      clearSession: () => setSession(null),
    }),
    [token, setSession],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>')
  return ctx
}
