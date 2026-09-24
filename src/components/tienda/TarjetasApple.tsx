import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../lib/auth'
import { crearPedido } from '../../lib/api'
import {
  TARJETAS_APPLE,
  DISENOS_APPLE,
  disenoPorId,
  euro,
  dolar,
  type TarjetaRegalo,
  type DisenoGiftCard,
} from '../../lib/giftcards'
import { rutaImagenDiseno, linkWhatsApp, msjPedidoGiftCard } from '../../lib/pedidos'
import { IconoApple } from './IconosMarca'

const FONT_DISPLAY = 'var(--font-display), system-ui, sans-serif'

// Dónde se puede usar (nombres en inglés, como en apple.com)
const HARDWARE = ['Mac', 'iPhone', 'iPad', 'Watch', 'Accessories']
const SERVICIOS = [
  'App Store',
  'Arcade',
  'Music',
  'TV',
  'iTunes',
  'Apple One',
  'Fitness+',
  'iCloud+',
  'News+',
  'Books',
]

function Chip({ nombre }: { nombre: string }) {
  return (
    <span className="rounded-full border border-[#D2D2D7] bg-white px-4 py-1.5 text-sm font-medium text-[#1D1D1F]">
      {nombre}
    </span>
  )
}

// ---------- Visual de una tarjeta ----------
// Renderiza la imagen propia del diseño (public/apple/<id>.png) y, si aún
// no existe, un placeholder CSS con el logo y el monto seleccionado.
function VisualTarjeta({
  diseno,
  monto,
  grande,
}: {
  diseno: DisenoGiftCard
  monto: TarjetaRegalo | null
  grande?: boolean
}) {
  const [rota, setRota] = useState(false)
  const src = rutaImagenDiseno(diseno.id)
  const clase = grande
    ? 'h-52 w-full max-w-sm'
    : 'h-16 w-28'

  if (!rota) {
    return (
      <img
        src={src}
        alt={diseno.nombre}
        loading="lazy"
        onError={() => setRota(true)}
        className={`${clase} rounded-2xl object-cover shadow-lg`}
      />
    )
  }

  return (
    <div
      className={`${clase} flex flex-col items-center justify-center overflow-hidden rounded-2xl shadow-lg`}
      style={{ background: diseno.gradiente, color: diseno.texto }}
    >
      <IconoApple className={grande ? 'h-9 w-9' : 'h-5 w-5'} fill={diseno.texto} />
      {grande ? (
        <>
          <p className="mt-2 text-3xl font-extrabold tracking-tight" style={{ fontFamily: FONT_DISPLAY }}>
            {monto ? dolar(monto.valor_usd) : '$…'}
          </p>
          <p className="text-[10px] font-semibold uppercase tracking-widest opacity-80">
            Apple Gift Card
          </p>
        </>
      ) : null}
    </div>
  )
}

// ---------- Botón de compra (gift card) ----------
//  · sin sesión → registro de cuenta
//  · con sesión → registra el pedido (monto + diseño) y abre WhatsApp
function ComprarGiftCard({ diseno, monto }: { diseno: DisenoGiftCard; monto: TarjetaRegalo }) {
  const { session, perfil } = useAuth()
  const [enviando, setEnviando] = useState(false)
  const [listo, setListo] = useState(false)
  const [error, setError] = useState('')

  if (!session) {
    return (
      <Link
        to="/registro"
        className="block w-full rounded-full bg-[#0071E3] px-8 py-3 text-center text-sm font-semibold text-white transition-colors hover:bg-[#0077ED]"
      >
        Comprar
      </Link>
    )
  }

  const comprar = async () => {
    if (enviando) return
    setEnviando(true)
    setError('')
    const r = await crearPedido({
      tipo: 'giftcard',
      plataforma: 'Apple',
      duracion_dias: null,
      precio_usd: null,
      valor_giftcard_usd: monto.valor_usd,
      precio_giftcard_eur: monto.precio_eur,
      diseno_giftcard: diseno.id,
      cliente_id: session.user.id,
      cliente_nombre: perfil?.nombre ?? null,
      cliente_contacto: perfil?.telefono ?? null,
    })
    setEnviando(false)
    if (r.ok) {
      setListo(true)
    } else {
      setError(r.error ?? 'No se pudo registrar el pedido automáticamente')
    }
    window.open(
      linkWhatsApp(
        msjPedidoGiftCard(dolar(monto.valor_usd), euro(monto.precio_eur), diseno.nombre),
      ),
      '_blank',
      'noopener,noreferrer',
    )
  }

  return (
    <span className="flex flex-col items-stretch gap-1">
      <button
        onClick={() => void comprar()}
        disabled={enviando}
        className="w-full rounded-full bg-[#0071E3] px-8 py-3 text-center text-sm font-semibold text-white transition-colors hover:bg-[#0077ED] disabled:opacity-60"
      >
        {enviando ? 'Enviando…' : listo ? 'Pedido enviado ✓' : 'Comprar'}
      </button>
      {error ? <span className="text-center text-[10px] text-amber-500">{error}</span> : null}
    </span>
  )
}

// ---------- Bloque de compra: diseño (izquierda) + monto (derecha) ----------
function CompraGiftCard() {
  const [disenoId, setDisenoId] = useState(disenoPorId('appstore').id)
  const [monto, setMonto] = useState<TarjetaRegalo>(TARJETAS_APPLE[0])
  const diseno = disenoPorId(disenoId)

  return (
    <div className="mt-10 grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      {/* 1 · Diseño */}
      <div>
        <h3 className="text-lg font-bold text-[#1D1D1F]" style={{ fontFamily: FONT_DISPLAY }}>
          1 · Elige el diseño de tu tarjeta
        </h3>
        <div className="mt-4 flex justify-center">
          <VisualTarjeta diseno={diseno} monto={monto} grande />
        </div>
        <div className="mt-5 grid grid-cols-3 gap-3">
          {DISENOS_APPLE.map((d) => {
            const activo = d.id === disenoId
            return (
              <button
                key={d.id}
                onClick={() => setDisenoId(d.id)}
                className={`rounded-2xl p-2 text-center transition-all ${
                  activo
                    ? 'border-2 border-[#0071E3] bg-[#F5F5F7] shadow-md'
                    : 'border-2 border-transparent hover:bg-[#F5F5F7]'
                }`}
              >
                <span className="mx-auto block">
                  <VisualTarjeta diseno={d} monto={null} />
                </span>
                <span className={`mt-1 block text-[11px] leading-tight font-medium ${activo ? 'text-[#0071E3]' : 'text-[#1D1D1F]'}`}>
                  {d.nombre}
                </span>
              </button>
            )
          })}
        </div>
        <p className="mt-3 text-center text-[11px] text-[#6E6E73]">
          Los diseños propios se suben a <code>public/apple/&lt;id&gt;.png</code>.
        </p>
      </div>

      {/* 2 · Monto */}
      <div>
        <h3 className="text-lg font-bold text-[#1D1D1F]" style={{ fontFamily: FONT_DISPLAY }}>
          2 · Elige el monto
        </h3>
        <div className="mt-4 max-h-[380px] space-y-2 overflow-y-auto pr-1">
          {TARJETAS_APPLE.map((t) => {
            const activo = monto.valor_usd === t.valor_usd
            return (
              <button
                key={t.valor_usd}
                onClick={() => setMonto(t)}
                className={`flex w-full items-center justify-between rounded-2xl border-2 px-4 py-3 text-left transition-all ${
                  activo
                    ? 'border-[#0071E3] bg-[#F5F5F7] shadow-sm'
                    : 'border-[#D2D2D7] bg-white hover:border-[#86868B]'
                }`}
              >
                <span className="text-lg font-extrabold tracking-tight text-[#1D1D1F]" style={{ fontFamily: FONT_DISPLAY }}>
                  {dolar(t.valor_usd)}
                </span>
                <span className={`text-sm font-semibold ${activo ? 'text-[#0071E3]' : 'text-[#6E6E73]'}`}>
                  {euro(t.precio_eur)}
                </span>
              </button>
            )
          })}
        </div>

        {/* Resumen + comprar */}
        <div className="mt-4 rounded-3xl border-2 border-[#0071E3] bg-[#F5F5F7] p-5">
          <div className="flex items-center justify-between gap-2 text-sm">
            <span className="text-[#6E6E73]">{diseno.nombre}</span>
            <span className="font-bold text-[#1D1D1F]">
              {dolar(monto.valor_usd)} · {euro(monto.precio_eur)}
            </span>
          </div>
          <div className="mt-3">
            <ComprarGiftCard diseno={diseno} monto={monto} />
          </div>
        </div>
      </div>
    </div>
  )
}

// ---------- Página unificada de Apple Gift Cards (#/tienda/apple) ----------
export default function TarjetasApple() {
  return (
    <section className="bg-white">
      {/* Hero — estilo portada apple.com/shop/gift-cards */}
      <div
        className="py-16 text-center md:py-24"
        style={{ background: 'linear-gradient(180deg, #F5F5F7 0%, #FFFFFF 100%)' }}
      >
        <div className="mx-auto max-w-3xl px-4">
          <div className="flex items-center justify-center gap-3">
            <IconoApple className="h-10 w-10 text-[#1D1D1F]" fill="#1D1D1F" />
            <span
              className="text-2xl font-bold tracking-tight text-[#1D1D1F] md:text-3xl"
              style={{ fontFamily: FONT_DISPLAY }}
            >
              Apple Gift Card
            </span>
          </div>
          <h1
            className="mt-6 text-4xl font-extrabold tracking-tight text-[#1D1D1F] md:text-6xl"
            style={{ fontFamily: FONT_DISPLAY }}
          >
            For everything and&nbsp;everyone.
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-base text-[#6E6E73] md:text-lg">
            Productos, accesorios, apps, juegos, música, películas, series de TV, iCloud+ y mucho
            más. Esta tarjeta lo tiene todo. Y algo más.
          </p>
          <a
            href="#denominaciones"
            className="mt-8 inline-block rounded-full bg-[#0071E3] px-8 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#0077ED]"
          >
            Comprar
          </a>
        </div>
      </div>

      {/* Dónde se puede usar — chips en inglés (como en apple.com) */}
      <div className="mx-auto max-w-4xl px-4 py-12 text-center">
        <h2
          className="text-2xl font-bold text-[#1D1D1F] md:text-3xl"
          style={{ fontFamily: FONT_DISPLAY }}
        >
          ¿Dónde puedes usar tu Apple Gift Card?
        </h2>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
          {HARDWARE.map((h) => (
            <Chip key={h} nombre={h} />
          ))}
        </div>
        <div className="mt-2 flex flex-wrap items-center justify-center gap-2">
          {SERVICIOS.map((s) => (
            <Chip key={s} nombre={s} />
          ))}
        </div>
      </div>

      {/* Compra — diseño + monto (unión de la portada y la página de compra) */}
      <div id="denominaciones" className="mx-auto max-w-5xl px-4 pb-16">
        <div className="text-center">
          <h2
            className="text-3xl font-extrabold tracking-tight text-[#1D1D1F] md:text-4xl"
            style={{ fontFamily: FONT_DISPLAY }}
          >
            Comprar Apple Gift Card
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-base text-[#6E6E73]">
            Úsala para comprar en la App Store, Apple TV, Apple Music, iTunes, Apple Arcade, la app
            Apple Store, apple.com y en tiendas Apple.
          </p>
        </div>

        <CompraGiftCard />

        {/* Aviso anti-estafas (adaptado, no es el texto legal de Apple) */}
        <div className="mt-12 rounded-3xl border border-[#D2D2D7] bg-[#F5F5F7] p-6 text-center">
          <p className="text-sm leading-relaxed text-[#1D1D1F]">
            ⚠️ Ten cuidado con las estafas. <strong>No compartas el código de tu tarjeta</strong> con
            desconocidos: ninguna empresa o persona legítima pedirá pagos con tarjetas de regalo.
          </p>
          <p className="mt-2 text-xs text-[#6E6E73]">
            Cada tarjeta se entrega con su código y se canjea en la App Store y en los servicios de
            Apple.
          </p>
        </div>
      </div>
    </section>
  )
}