import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { fetchCatalogoPublico } from '../lib/api'
import { agruparCatalogo, esGoogle, varianteHorizontal, type PlataformaTienda } from '../lib/tienda'
import { useAuth } from '../lib/auth'
import { errMsg } from '../lib/err'
import { ErrorMsg } from '../components/ui'
import { IconLogout } from '../components/icons'
import TarjetasGoogle from '../components/tienda/TarjetasGoogle'
import TarjetasHorizontales from '../components/tienda/TarjetasHorizontales'

export default function Tienda() {
  const { session, rol, perfil, salir } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [plataformas, setPlataformas] = useState<PlataformaTienda[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')
  const registrado = (location.state as { registrado?: boolean } | null)?.registrado

  useEffect(() => {
    let activo = true
    fetchCatalogoPublico()
      .then((items) => {
        if (activo) setPlataformas(agruparCatalogo(items))
      })
      .catch((e) => {
        if (activo) setError(errMsg(e))
      })
      .finally(() => {
        if (activo) setCargando(false)
      })
    return () => {
      activo = false
    }
  }, [])

  const salirDeTienda = async () => {
    await salir()
    navigate('/tienda', { replace: true })
  }

  const saludo = perfil?.nombre || (session?.user.email ?? '').split('@')[0] || ''

  return (
    <div className="min-h-screen bg-white">
      {/* Barra de navegación */}
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
          <Link to="/tienda" className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-sm font-black text-white">
              S
            </span>
            <span className="text-lg font-bold text-slate-900">Suscripciones</span>
          </Link>
          <nav className="flex items-center gap-2 text-sm">
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

      {/* Aviso tras registrarse */}
      {registrado ? (
        <div className="border-b border-emerald-200 bg-emerald-50 px-4 py-3 text-center text-sm font-medium text-emerald-800">
          ✅ ¡Cuenta creada con éxito! Ya tienes una cuenta de cliente.
        </div>
      ) : null}

      {/* Catálogo */}
      {cargando ? (
        <p className="py-24 text-center text-sm text-slate-400">Cargando planes…</p>
      ) : error ? (
        <div className="mx-auto max-w-lg px-4 py-24">
          <ErrorMsg message={error} />
        </div>
      ) : plataformas.length === 0 ? (
        <p className="py-24 text-center text-sm text-slate-400">
          El catálogo está vacío. Vuelve pronto.
        </p>
      ) : (
        plataformas.map((p) =>
          esGoogle(p.nombre) ? (
            <TarjetasGoogle key={p.nombre} p={p} />
          ) : (
            <TarjetasHorizontales key={p.nombre} p={p} variante={varianteHorizontal(p.nombre)} />
          ),
        )
      )}

      {/* Pie con descargo legal */}
      <footer className="border-t border-slate-200 bg-white py-8">
        <p className="mx-auto max-w-2xl px-4 text-center text-xs leading-relaxed text-slate-400">
          Los precios se expresan en dólares estadounidenses (USD). El equivalente en bolívares
          (VES) se calcula con la <strong>tasa de cambio oficial del BCV</strong> al momento de
          cada pago. Al contratar aceptas ser parte de un plan familiar compartido gestionado por{' '}
          <strong>Suscripciones</strong>.
        </p>
      </footer>
    </div>
  )
}