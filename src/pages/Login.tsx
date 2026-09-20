import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/auth'
import { errMsg } from '../lib/err'
import { Button, Field, Input } from '../components/ui'
import { IconLock } from '../components/icons'

export default function Login() {
  const { session, entrar } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [cargando, setCargando] = useState(false)

  // Si ya hay sesión (p.ej. tras recargar), ir directo al panel
  useEffect(() => {
    if (session) navigate('/', { replace: true })
  }, [session, navigate])

  const enviar = async (e: FormEvent) => {
    e.preventDefault()
    setCargando(true)
    setError('')
    try {
      await entrar(email.trim(), password)
      navigate('/', { replace: true })
    } catch (err) {
      setError(errMsg(err))
      setCargando(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
      <form
        onSubmit={enviar}
        className="w-full max-w-sm space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white">
            <IconLock className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Go Plans</h1>
            <p className="text-sm text-slate-500">Panel administrativo</p>
          </div>
        </div>

        {error ? (
          <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>
        ) : null}

        <Field label="Correo">
          <Input
            type="email"
            autoComplete="email"
            required
            placeholder="admin@tuempresa.app"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </Field>
        <Field label="Contraseña">
          <Input
            type="password"
            autoComplete="current-password"
            required
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </Field>

        <Button type="submit" disabled={cargando} className="w-full justify-center">
          {cargando ? 'Entrando…' : 'Entrar'}
        </Button>
        {cargando ? null : (
          <p className="text-center text-xs text-slate-400">
            Acceso restringido al personal autorizado.
          </p>
        )}
      </form>
    </div>
  )
}
