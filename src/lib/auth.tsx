import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from './supabase'

interface AuthContextValue {
  session: Session | null
  cargando: boolean
  entrar: (email: string, password: string) => Promise<void>
  salir: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    let activo = true
    supabase.auth.getSession().then(({ data }) => {
      if (activo) {
        setSession(data.session)
        setCargando(false)
      }
    })
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      if (activo) setSession(s)
    })
    return () => {
      activo = false
      sub.subscription.unsubscribe()
    }
  }, [])

  const entrar = async (email: string, password: string): Promise<void> => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw new Error(
      error.message === 'Invalid login credentials'
        ? 'Correo o contraseña incorrectos'
        : error.message,
    )
  }

  const salir = async (): Promise<void> => {
    await supabase.auth.signOut()
    setSession(null)
  }

  return (
    <AuthContext.Provider value={{ session, cargando, entrar, salir }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>')
  return ctx
}