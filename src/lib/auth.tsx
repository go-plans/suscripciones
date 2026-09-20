import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from './supabase'
import { errMsg } from './err'
import type { Rol } from './types'

// Perfil del usuario autenticado: su propia fila en `usuarios`
// (creada por el trigger auto_crear_usuario_cliente al registrarse).
export interface PerfilPropio {
  rol: Rol
  nombre: string
  email: string | null
  telefono: string | null
}

interface AuthContextValue {
  session: Session | null
  cargando: boolean
  rol: Rol | null
  rolCargando: boolean
  perfil: PerfilPropio | null
  entrar: (email: string, password: string) => Promise<void>
  registrar: (
    email: string,
    password: string,
    datos: { nombre: string; telefono: string },
  ) => Promise<boolean>
  salir: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [cargando, setCargando] = useState(true)
  const [rol, setRol] = useState<Rol | null>(null)
  const [rolCargando, setRolCargando] = useState(false)
  const [perfil, setPerfil] = useState<PerfilPropio | null>(null)

  // Carga la fila propia en `usuarios` (rol, nombre, teléfono).
  const cargarPerfil = async (userId: string | undefined) => {
    if (!userId) {
      setRol(null)
      setPerfil(null)
      return
    }
    setRolCargando(true)
    const { data, error } = await supabase
      .from('usuarios')
      .select('rol, nombre, email, telefono')
      .eq('id', userId)
      .maybeSingle()
    if (!error) {
      setPerfil((data as PerfilPropio | null) ?? null)
      setRol(data ? (data as PerfilPropio).rol : null)
    }
    setRolCargando(false)
  }

  useEffect(() => {
    let activo = true
    const cargarPerfilActivo = async (userId: string | undefined) => {
      if (!activo) return
      await cargarPerfil(userId)
    }

    supabase.auth.getSession().then(({ data }) => {
      if (!activo) return
      setSession(data.session)
      if (data.session) void cargarPerfilActivo(data.session.user.id)
      setCargando(false)
    })

    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      if (!activo) return
      setSession(s)
      if (s) void cargarPerfilActivo(s.user.id)
      else {
        setRol(null)
        setRolCargando(false)
        setPerfil(null)
      }
    })
    return () => {
      activo = false
      sub.subscription.unsubscribe()
    }
  }, [])

  const entrar = async (email: string, password: string): Promise<void> => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error)
      throw new Error(
        error.message === 'Invalid login credentials'
          ? 'Correo o contraseña incorrectos'
          : error.message,
      )
    // Carga inmediata del perfil (onAuthStateChange también lo hará).
    const { data } = await supabase.auth.getUser()
    if (data.user) await cargarPerfil(data.user.id)
  }

  // Registro público: se crea la cuenta de Supabase Auth con los datos
  // (nombre y teléfono) como metadatos; el trigger auto_crear_usuario_
  // cliente inserta la fila en `usuarios` con rol 'cliente'.
  // Devuelve true si ya quedó una sesión iniciada (confirmación de
  // correo desactivada) o false si falta confirmar el correo.
  const registrar = async (
    email: string,
    password: string,
    datos: { nombre: string; telefono: string },
  ): Promise<boolean> => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { nombre: datos.nombre, telefono: datos.telefono },
      },
    })
    if (error) throw new Error(errMsg(error))
    return Boolean(data.session)
  }

  const salir = async (): Promise<void> => {
    await supabase.auth.signOut()
    setSession(null)
    setRol(null)
    setRolCargando(false)
    setPerfil(null)
  }

  return (
    <AuthContext.Provider
      value={{ session, cargando, rol, rolCargando, perfil, entrar, registrar, salir }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>')
  return ctx
}