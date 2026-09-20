import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { fetchCatalogoPublico } from '../lib/api'
import {
  agruparCatalogo,
  esGoogle,
  esCanva,
  esSpotify,
  slugPlataforma,
  taglinePlataforma,
  precioUsd,
  type PlataformaTienda,
} from '../lib/tienda'
import { errMsg } from '../lib/err'
import { ErrorMsg } from '../components/ui'
import BarraTienda from '../components/tienda/BarraTienda'
import { IconoGoogleG, IconoSpotify, IconoCanvaC } from '../components/tienda/IconosMarca'

const FONT_DISPLAY = 'var(--font-display), system-ui, sans-serif'

function precioDesde(p: PlataformaTienda): string | null {
  if (p.planes.length === 0) return null
  const min = Math.min(...p.planes.map((pl) => pl.precio_venta_usd))
  return precioUsd(min)
}

// ---------- Tarjeta de plataforma (estética de cada marca) ----------
function TarjetaMarca({ p }: { p: PlataformaTienda }) {
  const slug = slugPlataforma(p.nombre)
  const desde = precioDesde(p)

  const contenido = (children: React.ReactNode) => (
    <Link
      to={`/tienda/${slug}`}
      className="group flex h-full flex-col items-center justify-center rounded-3xl p-8 text-center transition-all duration-200 hover:-translate-y-1 hover:shadow-2xl"
    >
      {children}
    </Link>
  )

  if (esGoogle(p.nombre)) {
    return (
      <div className="relative rounded-3xl border-2 border-[#E0E0E0] bg-white p-[3px] transition-shadow hover:border-transparent hover:shadow-2xl">
        <div className="h-full">
          {contenido(
            <>
              <IconoGoogleG className="h-20 w-20 transition-transform group-hover:scale-105" />
              <h3 className="mt-5 text-2xl font-extrabold tracking-tight text-[#202124]">
                {p.nombre}
              </h3>
              <p className="mt-1 text-sm text-[#5F6368]">{taglinePlataforma(p.nombre)}</p>
              <p className="mt-4 text-sm font-semibold text-[#4285F4]">
                Desde {desde ?? '—'}
              </p>
              <span className="mt-5 rounded-full bg-[#F8F9FA] px-6 py-2.5 text-sm font-semibold text-[#1a73e8] transition-colors group-hover:bg-[#E8F0FE]">
                Ver planes →
              </span>
            </>,
          )}
        </div>
      </div>
    )
  }

  if (esCanva(p.nombre)) {
    return (
      <div className="relative rounded-3xl bg-gradient-to-br from-[#6D28D9] to-[#7D2AE8] p-[3px] transition-shadow hover:shadow-2xl">
        <div className="h-full rounded-[21px]">
          {contenido(
            <>
              <span className="flex h-20 w-20 items-center justify-center rounded-2xl bg-white text-[#6D28D9] shadow-lg transition-transform group-hover:scale-105">
                <IconoCanvaC className="h-12 w-12" />
              </span>
              <h3
                className="mt-5 text-3xl font-bold italic text-white"
                style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}
              >
                Canva
              </h3>
              <p className="text-lg font-black uppercase tracking-widest text-white/90">Pro</p>
              <p className="mt-1 text-sm text-white/85">
                {taglinePlataforma(p.nombre)}
              </p>
              <p className="mt-4 text-sm font-semibold text-white">
                Desde {desde ?? '—'}
              </p>
              <span className="mt-5 rounded-full bg-white px-6 py-2.5 text-sm font-bold text-[#6D28D9]">
                Ver planes →
              </span>
            </>,
          )}
        </div>
      </div>
    )
  }

  if (esSpotify(p.nombre)) {
    return (
      <div className="relative rounded-3xl bg-[#1DB954] p-[3px] transition-shadow hover:shadow-2xl">
        <div className="h-full rounded-[21px]">
          {contenido(
            <>
              <span className="flex h-20 w-20 items-center justify-center rounded-full bg-[#0F0F0F] shadow-lg transition-transform group-hover:scale-105">
                <IconoSpotify className="h-12 w-12 text-[#1DB954]" />
              </span>
              <h3 className="mt-5 text-2xl font-bold text-white">{p.nombre}</h3>
              <p className="mt-1 text-sm text-white/85">{taglinePlataforma(p.nombre)}</p>
              <p className="mt-4 text-sm font-semibold text-white">
                Desde {desde ?? '—'}
              </p>
              <span className="mt-5 rounded-full bg-white px-6 py-2.5 text-sm font-bold text-[#1DB954]">
                Ver planes →
              </span>
            </>,
          )}
        </div>
      </div>
    )
  }

  // Genérico
  const inicial = p.nombre.charAt(0).toUpperCase()
  return (
    <div className="relative rounded-3xl border border-slate-200 bg-white transition-shadow hover:shadow-2xl">
      <div className="h-full">
        {contenido(
          <>
            <span className="flex h-20 w-20 items-center justify-center rounded-2xl bg-indigo-600 text-3xl font-black text-white shadow-lg transition-transform group-hover:scale-105">
              {inicial}
            </span>
            <h3 className="mt-5 text-2xl font-extrabold tracking-tight text-slate-900">
              {p.nombre}
            </h3>
            <p className="mt-1 text-sm text-slate-500">{taglinePlataforma(p.nombre)}</p>
            <p className="mt-4 text-sm font-semibold text-indigo-600">
              Desde {desde ?? '—'}
            </p>
            <span className="mt-5 rounded-full bg-indigo-600 px-6 py-2.5 text-sm font-bold text-white transition-colors group-hover:bg-indigo-700">
              Ver planes →
            </span>
          </>,
        )}
      </div>
    </div>
  )
}

// ---------- Página de inicio de la tienda (catálogo de productos) ----------
export default function Tienda() {
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

  const visibles = [...plataformas].sort((a, b) => {
    const rank = (n: string) => (esGoogle(n) ? 0 : esCanva(n) ? 1 : esSpotify(n) ? 2 : 3)
    return rank(a.nombre) - rank(b.nombre)
  })

  return (
    <div className="min-h-screen bg-white">
      <BarraTienda />

      {/* Aviso tras registrarse */}
      {registrado ? (
        <div className="border-b border-emerald-200 bg-emerald-50 px-4 py-3 text-center text-sm font-medium text-emerald-800">
          ✅ ¡Cuenta creada con éxito! Ya tienes una cuenta de cliente.
        </div>
      ) : null}

      {/* Hero */}
      <section className="bg-gradient-to-b from-[#F8F9FA] to-white py-16 text-center md:py-20">
        <h1
          className="text-4xl font-extrabold tracking-tight text-slate-900 md:text-5xl"
          style={{ fontFamily: FONT_DISPLAY }}
        >
          Tienda de suscripciones
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-base text-slate-500 md:text-lg">
          Elige tu plataforma favorita y contrata el plan que más te convenga. Pagas en
          USDT, USD o BS al cambio oficial BCV.
        </p>
      </section>

      {/* Catálogo de plataformas (tarjetas de marca) */}
      <section className="mx-auto max-w-5xl px-4 pb-16">
        <h2
          className="mb-8 text-center text-lg font-semibold uppercase tracking-widest text-slate-400"
          style={{ fontFamily: FONT_DISPLAY }}
        >
          Plataformas disponibles
        </h2>

        {cargando ? (
          <p className="py-20 text-center text-sm text-slate-400">Cargando planes…</p>
        ) : error ? (
          <div className="mx-auto max-w-lg">
            <ErrorMsg message={error} />
          </div>
        ) : visibles.length === 0 ? (
          <p className="py-20 text-center text-sm text-slate-400">
            El catálogo está vacío. Vuelve pronto.
          </p>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {visibles.map((p) => (
              <TarjetaMarca key={p.nombre} p={p} />
            ))}
          </div>
        )}
      </section>

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