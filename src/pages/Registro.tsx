import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/auth'
import { errMsg } from '../lib/err'
import { Button, Field, Input } from '../components/ui'
import { IconLock } from '../components/icons'

export default function Registro() {
  const { registrar } = useAuth()
  const navigate = useNavigate()
  const [nombre, setNombre] = useState('')
  const [email, setEmail] = useState('')
  const [telefono, setTelefono] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [pendiente, setPendiente] = useState(false)
  const [cargando, setCargando] = useState(false)

  const enviar = async (e: FormEvent) => {
    e.preventDefault()
    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.')
      return
    }
    setCargando(true)
    setError('')
    try {
      const conSesion = await registrar(email.trim(), password, {
        nombre: nombre.trim(),
        telefono: telefono.trim(),
      })
      if (conSesion) {
        // Confirmación de correo desactivada: entra directo a la tienda.
        navigate('/tienda', { replace: true, state: { registrado: true } })
      } else {
        // Supabase pidió confirmar el correo antes de poder entrar.
        setPendiente(true)
        setCargando(false)
      }
    } catch (err) {
      const msg = errMsg(err)
      setError(
        /already registered|Email rate limit/i.test(msg)
          ? 'Ese correo ya tiene una cuenta. Prueba entrar.'
          : msg === 'Password should be at least 6 characters.'
            ? 'La contraseña debe tener al menos 6 caracteres.'
            : msg,
      )
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
              <h1 className="text-xl font-bold text-slate-900">Crear cuenta</h1>
              <p className="text-sm text-slate-500">Únete para contratar tu plan</p>
            </div>
          </div>

          {pendiente ? (
            <div className="mt-5 rounded-xl bg-emerald-50 px-4 py-4 text-sm text-emerald-800">
              <p className="font-semibold">¡Casi listo! 🎉</p>
              <p className="mt-1">
                Te enviamos un correo de confirmación a <strong>{email}</strong>. Ábrelo y pulsa el
                enlace para activar tu cuenta y poder entrar.
              </p>
              <Link
                to="/ingreso"
                className="mt-3 inline-block rounded-lg bg-emerald-600 px-4 py-2 text-white hover:bg-emerald-700"
              >
                Ir a entrar
              </Link>
            </div>
          ) : (
            <>
              {error ? (
                <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>
              ) : null}

              <form onSubmit={enviar} className="mt-4 space-y-4">
                <Field label="Nombre">
                  <Input
                    required
                    autoComplete="name"
                    placeholder="Ana Pérez"
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                  />
                </Field>
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
                <Field label="Teléfono (opcional)">
                  <Input
                    type="tel"
                    autoComplete="tel"
                    placeholder="+58 412 123 4567"
                    value={telefono}
                    onChange={(e) => setTelefono(e.target.value)}
                  />
                </Field>
                <Field label="Contraseña">
                  <Input
                    type="password"
                    required
                    autoComplete="new-password"
                    placeholder="Mínimo 6 caracteres"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </Field>

                <Button type="submit" disabled={cargando} className="w-full justify-center">
                  {cargando ? 'Creando cuenta…' : 'Crear cuenta'}
                </Button>
              </form>

              <p className="mt-4 text-center text-sm text-slate-500">
                ¿Ya tienes cuenta?{' '}
                <Link to="/ingreso" className="font-semibold text-indigo-600 hover:underline">
                  Entrar
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}