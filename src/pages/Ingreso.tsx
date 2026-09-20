import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/auth'
import { supabase } from '../lib/supabase'
import { errMsg } from '../lib/err'
import { Button, Field, Input } from '../components/ui'
import { IconLock } from '../components/icons'

export default function Ingreso() {
  const { entrar } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [cargando, setCargando] = useState(false)

  const enviar = async (e: FormEvent) => {
    e.preventDefault()
    setCargando(true)
    setError('')
    try {
      await entrar(email.trim(), password)
      // Redirige según el rol: admin al panel, cliente a la tienda.
      const { data } = await supabase.auth.getUser()
      const uid = data.user?.id
      const { data: fila } = uid
        ? await supabase.from('usuarios').select('rol').eq('id', uid).maybeSingle()
        : { data: null }
      navigate(fila?.rol === 'admin' ? '/' : '/tienda', { replace: true })
    } catch (err) {
      setError(errMsg(err))
      setCargando(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4 py-10">
      <div className="w-full max-w-md space-y-4">
        <Link
          to="/tienda"
          className="inline-flex items-center gap-1 text-sm font-medium text-indigo-600 hover:text-indigo-700"
        >
          ← Volver a la tienda
        </Link>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white">
              <IconLock className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">Entrar</h1>
              <p className="text-sm text-slate-500">Con el correo de tu cuenta</p>
            </div>
          </div>

          {error ? (
            <p className="mt-4 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>
          ) : null}

          <form onSubmit={enviar} className="mt-4 space-y-4">
            <Field label="Correo">
              <Input
                type="email"
                required
                autoComplete="email"
                placeholder="ana@correo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </Field>
            <Field label="Contraseña">
              <Input
                type="password"
                required
                autoComplete="current-password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </Field>

            <Button type="submit" disabled={cargando} className="w-full justify-center">
              {cargando ? 'Entrando…' : 'Entrar'}
            </Button>
          </form>

          <p className="mt-4 text-center text-sm text-slate-500">
            ¿No tienes cuenta?{' '}
            <Link to="/registro" className="font-semibold text-indigo-600 hover:underline">
              Regístrate
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}