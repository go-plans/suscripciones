import { Link } from 'react-router-dom'
import BarraTienda from '../components/tienda/BarraTienda'
import { useCarrito } from '../components/tienda/CarritoProvider'
import { totalRef } from '../lib/carrito'
import { euro } from '../lib/giftcards'
import { precioUsd } from '../lib/tienda'

const EMOJI: Record<string, string> = {
  Apple: '🍎',
  Spotify: '🎵',
  Canva: '🎨',
  'Google One': '🗂️',
}

function preciolinea(l: {
  tipo: 'giftcard' | 'plan'
  precio_ref: number
  ref_moneda: 'EUR' | 'USD'
}): string {
  if (l.tipo === 'giftcard') return euro(l.precio_ref)
  return precioUsd(l.precio_ref)
}

// Página pública del carrito (#/carrito): revisar líneas, cantidades y pasar
// al checkout.
export default function Carrito() {
  const { lineas, setCantidad, quitar, total } = useCarrito()
  const refs = totalRef(lineas)

  if (lineas.length === 0) {
    return (
      <div className="min-h-screen bg-slate-50">
        <BarraTienda volver />
        <div className="mx-auto max-w-3xl px-4 py-16 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-slate-200 text-3xl">
            🛒
          </div>
          <h1 className="mt-4 text-2xl font-bold text-slate-900">Tu carrito está vacío</h1>
          <p className="mt-2 text-sm text-slate-500">
            Añade una gift card o un plan desde la tienda y vuelve aquí para pagar.
          </p>
          <Link
            to="/tienda"
            className="mt-6 inline-block rounded-full bg-indigo-600 px-8 py-3 text-sm font-semibold text-white hover:bg-indigo-700"
          >
            Ir a la tienda
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <BarraTienda volver />
      <div className="mx-auto max-w-3xl px-4 py-10">
        <h1 className="text-2xl font-bold text-slate-900">Tu carrito</h1>
        <p className="mt-1 text-sm text-slate-500">
          {total} artículo{total === 1 ? '' : 's'} · revisa los montos y continúa al checkout
        </p>

        <div className="mt-6 space-y-3">
          {lineas.map((l) => (
            <div
              key={l.clave}
              className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
            >
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-2xl">
                {EMOJI[l.plataforma] ?? '📦'}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-slate-800">{l.titulo}</p>
                <p className="truncate text-xs text-slate-500">{l.detalle}</p>
                <p className="mt-0.5 text-sm font-bold text-indigo-600">
                  {preciolinea(l)} <span className="text-[10px] font-medium text-slate-400">c/u</span>
                </p>
              </div>

              {/* Cantidad */}
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setCantidad(l.clave, l.cantidad - 1)}
                  className="flex h-7 w-7 items-center justify-center rounded-full border border-slate-300 text-slate-600 hover:bg-slate-100"
                  aria-label="Restar uno"
                >
                  −
                </button>
                <span className="w-7 text-center text-sm font-semibold text-slate-800">
                  {l.cantidad}
                </span>
                <button
                  onClick={() => setCantidad(l.clave, l.cantidad + 1)}
                  className="flex h-7 w-7 items-center justify-center rounded-full border border-slate-300 text-slate-600 hover:bg-slate-100"
                  aria-label="Sumar uno"
                >
                  +
                </button>
              </div>

              <p className="w-20 text-right text-sm font-bold text-slate-800">
                {l.tipo === 'giftcard' ? euro(l.precio_ref * l.cantidad) : precioUsd(l.precio_ref * l.cantidad)}
              </p>

              <button
                onClick={() => quitar(l.clave)}
                className="text-slate-400 hover:text-red-600"
                aria-label="Quitar del carrito"
              >
                ✕
              </button>
            </div>
          ))}
        </div>

        {/* Totales de referencia */}
        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          {(refs.eur > 0 || refs.usd > 0) && (
            <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
              <span className="text-slate-500">
                <strong className="text-slate-800">Subtotal de referencia:</strong>
                {refs.eur > 0 ? ` ${euro(refs.eur)}` : ''}
                {refs.usd > 0 ? ` ${precioUsd(refs.usd)}` : ''}
              </span>
              {lineas.some((l) => l.tipo === 'giftcard') ? (
                <span className="text-xs text-slate-400">
                  Las gift cards se cotizan en € (Pago Móvil anclado al euro).
                </span>
              ) : null}
            </div>
          )}
          <p className="mt-2 text-xs text-slate-400">
            El total exacto según tu método de pago (Bs, USDT, USDC, Zinli o Binance) se calcula en
            el checkout.
          </p>
        </div>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Link to="/tienda" className="text-sm font-medium text-indigo-600 hover:underline">
            ← Seguir comprando
          </Link>
          <Link
            to="/checkout"
            className="rounded-full bg-indigo-600 px-10 py-3.5 text-center text-sm font-semibold text-white shadow-md transition-colors hover:bg-indigo-700"
          >
            Finalizar compra →
          </Link>
        </div>
      </div>
    </div>
  )
}