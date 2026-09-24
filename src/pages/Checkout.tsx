import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import BarraTienda from '../components/tienda/BarraTienda'
import { useCarrito } from '../components/tienda/CarritoProvider'
import { useAuth } from '../lib/auth'
import { crearPedido, fetchTasaBcv, fetchTasaEurDelDia } from '../lib/api'
import {
  DATOS_COBRO,
  METODOS_PAGO,
  etiquetaMetodo,
  fmtMonedaCobro,
  monedaCobro,
  montoCobro,
  type MetodoPago,
  type TasasCobro,
} from '../lib/pagos'
import { linkWhatsApp, msjPedidoCheckout } from '../lib/pedidos'
import { round2 } from '../lib/format'
import type { LineaCarrito } from '../lib/carrito'

// Precio de referencia de una línea (lo que el cliente ya conoce de la tienda)
function precioRefLinea(l: LineaCarrito): string {
  return l.tipo === 'giftcard' ? `${l.precio_ref.toFixed(2)} €` : `${l.precio_ref.toFixed(2)} $`
}

export default function Checkout() {
  const { session, perfil } = useAuth()
  const { lineas, vaciar } = useCarrito()

  const [tasas, setTasas] = useState<TasasCobro>({ bcv: null, eur: null })
  const [nombre, setNombre] = useState(() => perfil?.nombre ?? '')
  const [telefono, setTelefono] = useState(() => perfil?.telefono ?? '')
  const [metodo, setMetodo] = useState<MetodoPago>('pagomovil')
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState('')
  const [completado, setCompletado] = useState(false)

  useEffect(() => {
    if (!nombre && perfil?.nombre) setNombre(perfil.nombre)
    if (!telefono && perfil?.telefono) setTelefono(perfil.telefono)
  }, [nombre, telefono, perfil])

  useEffect(() => {
    let vivo = true
    const cargar = async () => {
      const [bv, eur] = await Promise.all([fetchTasaBcv(), fetchTasaEurDelDia()])
      if (vivo) setTasas({ bcv: bv.tasa, eur })
    }
    void cargar()
    return () => {
      vivo = false
    }
  }, [])

  // Total del carrito según el método (null si falta una tasa y no se puede)
  const totalPorMetodo = useMemo(() => {
    const fn = (m: MetodoPago): number | null => {
      let acc = 0
      for (const l of lineas) {
        const sub = montoCobro(m, l.precio_ref, l.ref_moneda, tasas)
        if (sub == null) return null
        acc += sub * l.cantidad
      }
      return round2(acc)
    }
    // Cache por método (computed bajo demanda en el render)
    return Object.fromEntries(METODOS_PAGO.map((m) => [m.id, fn(m.id)])) as Record<MetodoPago, number | null>
  }, [lineas, tasas])

  const monedaMetodo = monedaCobro(metodo)
  const totalMetodo = totalPorMetodo[metodo]

  const confirmar = async () => {
    if (!nombre.trim()) {
      setError('Escribe tu nombre para registrar el pedido.')
      return
    }
    if (totalMetodo == null) {
      setError('Falta la tasa para calcular tu monto. Intenta de nuevo en un momento o elige otro método.')
      return
    }
    setEnviando(true)
    setError('')

    const lineasMsj = lineas.map((l) => {
      const sub = montoCobro(metodo, l.precio_ref, l.ref_moneda, tasas) ?? 0
      return {
        cantidad: l.cantidad,
        texto: `${l.titulo} (${l.detalle}) · ${fmtMonedaCobro(monedaMetodo, round2(sub * l.cantidad))}`,
      }
    })

    const msj = msjPedidoCheckout({
      cliente: nombre.trim(),
      lineas: lineasMsj,
      total: fmtMonedaCobro(monedaMetodo, totalMetodo),
      metodo: etiquetaMetodo(metodo),
      instrucciones: DATOS_COBRO[metodo],
    })

    let falloGuardado = false
    let falloMsg = ''
    if (session) {
      for (const l of lineas) {
        const sub = montoCobro(metodo, l.precio_ref, l.ref_moneda, tasas) ?? 0
        const res = await crearPedido({
          tipo: l.tipo,
          plataforma: l.plataforma,
          duracion_dias: l.duracion_dias ?? null,
          precio_usd: l.precio_usd ?? null,
          valor_giftcard_usd: l.valor_giftcard_usd ?? null,
          precio_giftcard_eur: l.precio_giftcard_eur ?? null,
          diseno_giftcard: l.diseno_giftcard ?? null,
          cliente_id: session.user.id,
          cliente_nombre: nombre.trim(),
          cliente_contacto: telefono.trim() || null,
          metodo_pago: metodo,
          moneda_cobro: monedaMetodo,
          monto_cobro: round2(sub * l.cantidad),
        })
        if (!res.ok) {
          falloGuardado = true
          falloMsg = res.error ?? ''
        }
      }
    }

    window.open(linkWhatsApp(msj), '_blank', 'noopener')
    setEnviando(false)

    if (falloGuardado) {
      setError(
        `El pedido se envió por WhatsApp ✅ pero no se guardó en el panel (${falloMsg}). ` +
          'Pide al admin que aplique la migración 0012 para que los pedidos queden registrados.',
      )
      return
    }

    vaciar()
    setCompletado(true)
  }

  // ---------- Pantalla de éxito ----------
  if (completado) {
    return (
      <div className="min-h-screen bg-slate-50">
        <BarraTienda volver />
        <div className="mx-auto max-w-xl px-4 py-16 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-3xl">
            ✅
          </div>
          <h1 className="mt-4 text-2xl font-bold text-slate-900">¡Pedido enviado!</h1>
          <p className="mt-2 text-sm text-slate-500">
            Te abrimos WhatsApp con tu pedido y las instrucciones de pago. Una vez que pagues, el
            equipo de Go Plans confirma la entrega por el mismo chat.
          </p>
          <Link
            to="/tienda"
            className="mt-6 inline-block rounded-full bg-indigo-600 px-8 py-3 text-sm font-semibold text-white hover:bg-indigo-700"
          >
            Volver a la tienda
          </Link>
        </div>
      </div>
    )
  }

  // ---------- Carrito vacío ----------
  if (lineas.length === 0) {
    return (
      <div className="min-h-screen bg-slate-50">
        <BarraTienda volver />
        <div className="mx-auto max-w-xl px-4 py-16 text-center">
          <h1 className="text-2xl font-bold text-slate-900">No hay nada que pagar</h1>
          <p className="mt-2 text-sm text-slate-500">Tu carrito está vacío. Añade algo primero.</p>
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
        <h1 className="text-2xl font-bold text-slate-900">Checkout</h1>
        <p className="mt-1 text-sm text-slate-500">
          Revisa tu pedido, elige cómo pagar y confirma. Se abrirá WhatsApp con todo listo.
        </p>

        {/* Aviso de sesión */}
        {!session ? (
          <div className="mt-5 rounded-2xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-800">
            Para finalizar necesitas una cuenta gratuita: así el pedido queda a tu nombre en el
            panel. Tu carrito <strong>no se pierde</strong>.
            <div className="mt-3 flex flex-wrap gap-2">
              <Link
                to="/registro"
                className="rounded-full bg-amber-600 px-5 py-2 text-xs font-semibold text-white hover:bg-amber-700"
              >
                Crear cuenta
              </Link>
              <Link
                to="/ingreso"
                className="rounded-full border border-amber-400 px-5 py-2 text-xs font-semibold text-amber-800 hover:bg-amber-100"
              >
                Ya tengo cuenta
              </Link>
            </div>
          </div>
        ) : null}

        {/* 1 · Resumen */}
        <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-bold text-slate-900">1 · Resumen del pedido</h2>
          <div className="mt-3 space-y-2">
            {lineas.map((l) => (
              <div key={l.clave} className="flex items-baseline justify-between gap-3 text-sm">
                <p className="min-w-0 flex-1 truncate text-slate-700">
                  <span className="font-semibold">
                    {l.cantidad > 1 ? `${l.cantidad}× ` : ''}
                    {l.titulo}
                  </span>
                  <span className="ml-1 text-xs text-slate-400">({l.detalle})</span>
                </p>
                <p className="shrink-0 text-xs text-slate-500">{precioRefLinea(l)} c/u</p>
              </div>
            ))}
          </div>
        </section>

        {/* 2 · Tus datos */}
        <section className="mt-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-bold text-slate-900">2 · Tus datos</h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <label className="block text-xs font-medium text-slate-600">
              Nombre *
              <input
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Tu nombre"
                className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-indigo-400 focus:outline-none"
              />
            </label>
            <label className="block text-xs font-medium text-slate-600">
              Teléfono (para coordinar la entrega)
              <input
                value={telefono}
                onChange={(e) => setTelefono(e.target.value)}
                placeholder="+58 412 000 00 00"
                className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-indigo-400 focus:outline-none"
              />
            </label>
          </div>
        </section>

        {/* 3 · Método de pago */}
        <section className="mt-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-bold text-slate-900">3 · Método de pago</h2>

          <div className="mt-2 text-[11px] text-slate-400">
            {tasas.bcv ? `Tasa BCV: ${round2(tasas.bcv).toFixed(2)} Bs/USD` : 'Tasa BCV: pendiente'} ·{' '}
            {tasas.eur ? `Tasa € en Bs: ${round2(tasas.eur).toFixed(2)}` : 'Tasa €: pendiente'}
          </div>

          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {METODOS_PAGO.map((m) => {
              const total = totalPorMetodo[m.id]
              const disponible = total != null
              const activo = metodo === m.id
              return (
                <button
                  key={m.id}
                  disabled={!disponible}
                  onClick={() => setMetodo(m.id)}
                  className={`rounded-2xl border-2 p-4 text-left transition-all ${
                    activo
                      ? 'border-indigo-600 bg-indigo-50'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  } ${disponible ? '' : 'cursor-not-allowed opacity-50'}`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-lg">{m.icono}</span>
                    <span className="text-sm font-bold text-slate-900">{m.nombre}</span>
                  </div>
                  <p className="mt-1 text-xs text-slate-500">{m.descripcion}</p>
                  <p className="mt-2 text-base font-extrabold text-indigo-600">
                    {disponible ? fmtMonedaCobro(monedaCobro(m.id), total!) : '—'}
                  </p>
                </button>
              )
            })}
          </div>

          {/* Instrucciones del método + nota de Pago Móvil anclado al € */}
          <div className="mt-4 rounded-xl bg-slate-50 p-4 text-xs leading-relaxed text-slate-600">
            {DATOS_COBRO[metodo] ? (
              <p>
                <strong className="text-slate-800">Cómo pagar · {etiquetaMetodo(metodo)}:</strong>{' '}
                {DATOS_COBRO[metodo]}
              </p>
            ) : (
              <p className="text-amber-700">
                ⚠️ Aún estamos cargando los datos de cobro de <strong>{etiquetaMetodo(metodo)}</strong>.
                Tu pedido queda registrado igual y te pasamos los datos por WhatsApp.
              </p>
            )}
            {metodo === 'pagomovil' ? (
              <p className="mt-1 text-[11px] text-slate-400">
                Pago Móvil: las Apple Gift Cards van ancladas al euro (€ → Bs); los planes usan la
                tasa BCV (USD → Bs).
              </p>
            ) : null}
          </div>
        </section>

        {error ? (
          <p className="mt-4 rounded-xl bg-red-50 p-3 text-xs text-red-700">{error}</p>
        ) : null}

        {/* Confirmar */}
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Link to="/carrito" className="text-sm font-medium text-indigo-600 hover:underline">
            ← Volver al carrito
          </Link>
          {session ? (
            <button
              onClick={() => void confirmar()}
              disabled={enviando || totalMetodo == null}
              className="rounded-full bg-indigo-600 px-10 py-3.5 text-sm font-semibold text-white shadow-md transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {enviando ? 'Enviando…' : `Confirmar pedido · ${fmtMonedaCobro(monedaMetodo, totalMetodo ?? 0)}`}
            </button>
          ) : (
            <Link
              to="/registro"
              className="rounded-full bg-indigo-600 px-10 py-3.5 text-center text-sm font-semibold text-white shadow-md hover:bg-indigo-700"
            >
              Crear cuenta para finalizar
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}