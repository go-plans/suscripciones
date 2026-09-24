import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../lib/auth'
import { IconCart, IconLogout } from '../icons'
import { useCarrito } from './CarritoProvider'

// Barra superior compartida de la tienda pública (#/tienda y detalle de plataforma)
export default function BarraTienda({ volver = false }: { volver?: boolean }) {
  const { session, rol, perfil, salir } = useAuth()
  const { total } = useCarrito()
  const navigate = useNavigate()

  const salirDeTienda = async () => {
    await salir()
    navigate('/tienda', { replace: true })
  }

  const saludo = perfil?.nombre || (session?.user.email ?? '').split('@')[0] || ''

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
        <div className="flex items-center gap-3">
          {volver ? (
            <Link
              to="/tienda"
              className="inline-flex items-center gap-1.5 rounded-full border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-100"
            >
              ← Tienda
            </Link>
          ) : null}
          <Link to="/tienda" className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-sm font-black text-white" style={{ fontFamily: 'var(--font-display), "Google Sans", system-ui' }}>GP</span>
            <span className="text-lg font-bold text-slate-900" style={{ fontFamily: 'var(--font-display), "Google Sans", system-ui' }}>Go Plans</span>
          </Link>
        </div>
        <nav className="flex items-center gap-2 text-sm">
          <Link
            to="/carrito"
            aria-label={`Carrito (${total} artículo${total === 1 ? '' : 's'})`}
            className="relative inline-flex items-center justify-center rounded-full border border-slate-300 p-2 text-slate-600 transition-colors hover:bg-slate-100"
          >
            <IconCart className="h-5 w-5" />
            {total > 0 ? (
              <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-indigo-600 px-1 text-[10px] font-bold text-white">
                {total}
              </span>
            ) : null}
          </Link>
          {session ? (
            <>
              {rol === 'admin' ? (
                <Link
                  to="/"
                  className="rounded-full bg-indigo-600 px-4 py-2 font-semibold text-white hover:bg-indigo-700"
                >
                  Panel admin
                </Link>
              ) : (
                <span className="hidden max-w-[10rem] truncate px-2 text-slate-600 sm:inline">
                  Hola, {saludo} 👋
                </span>
              )}
              <button
                onClick={salirDeTienda}
                className="inline-flex items-center gap-1 rounded-full border border-slate-300 px-3 py-2 text-slate-600 hover:bg-slate-100"
              >
                <IconLogout className="h-4 w-4" /> Salir
              </button>
            </>
          ) : (
            <>
              <Link
                to="/ingreso"
                className="rounded-full border border-slate-300 px-4 py-2 font-semibold text-slate-700 hover:bg-slate-100"
              >
                Ingresar
              </Link>
              <Link
                to="/registro"
                className="rounded-full bg-indigo-600 px-4 py-2 font-semibold text-white hover:bg-indigo-700"
              >
                Registrarse
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  )
}