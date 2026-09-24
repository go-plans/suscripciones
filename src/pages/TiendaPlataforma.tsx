import { useEffect, useState } from 'react'
import { Navigate, useParams } from 'react-router-dom'
import { fetchCatalogoPublico } from '../lib/api'
import {
  agruparCatalogo,
  esGoogle,
  varianteHorizontal,
  plataformaPorSlug,
  type PlataformaTienda,
} from '../lib/tienda'
import { errMsg } from '../lib/err'
import { ErrorMsg } from '../components/ui'
import BarraTienda from '../components/tienda/BarraTienda'
import TarjetasGoogle from '../components/tienda/TarjetasGoogle'
import TarjetasHorizontales from '../components/tienda/TarjetasHorizontales'
import TarjetasApple from '../components/tienda/TarjetasApple'
import { SLUG_APPLE } from '../lib/giftcards'

// Página de detalle de una plataforma (#/tienda/:slug)
// Muestra los planes con la estética de la marca (Google / Canva / Spotify / genérico).
export default function TiendaPlataforma() {
  const { slug = '' } = useParams()
  const [plataformas, setPlataformas] = useState<PlataformaTienda[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')
  const [noEncontrada, setNoEncontrada] = useState(false)

  useEffect(() => {
    if (slug === SLUG_APPLE) return
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
  }, [slug])

  const p = plataformaPorSlug(plataformas, slug)
  useEffect(() => {
    if (!cargando && !error && !p) setNoEncontrada(true)
  }, [cargando, error, p])

  // Apple Gift Cards: página propia con tarifas fijas en código (sin catálogo)
  if (slug === SLUG_APPLE) {
    return (
      <div className="min-h-screen bg-white">
        <BarraTienda volver />
        <TarjetasApple />
        <footer className="border-t border-slate-200 bg-white py-8">
          <p className="mx-auto max-w-2xl px-4 text-center text-xs leading-relaxed text-slate-400">
            Las tarjetas de regalo se pagan en EUR según la tarifa mostrada. Al contratar aceptas
            ser parte de un plan familiar compartido gestionado por <strong>Go Plans</strong>.
          </p>
        </footer>
      </div>
    )
  }

  if (noEncontrada) return <Navigate to="/tienda" replace />

  return (
    <div className="min-h-screen bg-white">
      <BarraTienda volver />

      {/* Contenido con la estética de la marca */}
      {cargando ? (
        <p className="py-24 text-center text-sm text-slate-400">Cargando planes…</p>
      ) : error ? (
        <div className="mx-auto max-w-lg px-4 py-24">
          <ErrorMsg message={error} />
        </div>
      ) : p ? (
        esGoogle(p.nombre) ? (
          <TarjetasGoogle p={p} />
        ) : (
          <TarjetasHorizontales p={p} variante={varianteHorizontal(p.nombre)} />
        )
      ) : null}

      {/* Pie con descargo legal */}
      <footer className="border-t border-slate-200 bg-white py-8">
        <p className="mx-auto max-w-2xl px-4 text-center text-xs leading-relaxed text-slate-400">
          Los precios se expresan en dólares estadounidenses (USD). El equivalente en bolívares
          (VES) se calcula con la <strong>tasa de cambio oficial del BCV</strong> al momento de
          cada pago. Al contratar aceptas ser parte de un plan familiar compartido gestionado por{' '}
          <strong>Go Plans</strong>.
        </p>
      </footer>
    </div>
  )
}
