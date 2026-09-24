import type { PlataformaTienda, PlanTienda, VarianteHorizontal } from '../../lib/tienda'
import { precioUsd } from '../../lib/tienda'
import { IconoSpotify, WordmarkCanva } from './IconosMarca'
import ContratarPlan from './ContratarPlan'

interface Tema {
  seccion: string
  subtitulo: string
  tarjeta: string
  duracion: string
  precio: string
  subtexto: string
  ref: string
  badge: string
  boton: string
  logo: string
  logoText: string
  dividerColor: string
}

const temas: Record<VarianteHorizontal, Tema> = {
  spotify: {
    seccion: 'bg-[#1DB954]',
    subtitulo: 'text-white/90',
    tarjeta: 'bg-[#0F0F0F] text-white',
    duracion: 'text-[#1DB954]',
    precio: 'text-[#1DB954]',
    subtexto: 'text-[#1DB954]',
    ref: 'text-[#9AA0A6]',
    badge: 'bg-white text-black',
    boton: 'bg-[#1DB954] text-black hover:bg-[#1ED760]',
    logo: 'bg-[#0F0F0F] text-[#1DB954]',
    logoText: '♫',
    dividerColor: 'rgba(29,185,84,0.3)',
  },
  canva: {
    seccion: 'bg-gradient-to-br from-[#6D28D9] to-[#7D2AE8]',
    subtitulo: 'text-white/90',
    tarjeta: 'bg-white text-slate-900',
    duracion: 'text-slate-900',
    precio: 'text-slate-900',
    subtexto: 'text-[#00A8AE]',
    ref: 'text-slate-400',
    badge: 'bg-[#00C4CC] text-black',
    boton: 'bg-[#00C4CC] text-black hover:bg-[#00A8AE]',
    logo: 'bg-white text-[#6D28D9]',
    logoText: '✦',
    dividerColor: 'rgba(0,0,0,0.12)',
  },
  generica: {
    seccion: 'bg-slate-100',
    subtitulo: 'text-slate-500',
    tarjeta: 'bg-white text-slate-900 border border-slate-200',
    duracion: 'text-slate-900',
    precio: 'text-slate-900',
    subtexto: 'text-slate-500',
    ref: 'text-slate-400',
    badge: 'bg-indigo-600 text-white',
    boton: 'bg-indigo-600 text-white hover:bg-indigo-700',
    logo: 'bg-indigo-600 text-white',
    logoText: '✦',
    dividerColor: 'rgba(0,0,0,0.1)',
  },
}

function LogoCanva({ nombre }: { nombre: string }) {
  const sufijo = nombre.split(' ').slice(1).join(' ') || 'PRO'
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="flex items-center justify-center gap-3">
        <WordmarkCanva className="h-12 w-auto text-white drop-shadow-sm" fill="#FFFFFF" />
        <span className="rounded-lg bg-[#00C4CC] px-2.5 py-1 text-sm font-black uppercase tracking-wider text-black shadow">
          {sufijo}
        </span>
      </div>
    </div>
  )
}

function LogoSpotify() {
  return (
    <div className="flex items-center justify-center gap-3">
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[#0F0F0F] text-[#1ED760] shadow-md">
        <IconoSpotify className="h-8 w-8 text-[#1ED760]" fill="#1ED760" />
      </span>
      <span className="text-3xl font-extrabold tracking-tight text-white" style={{ fontFamily: 'var(--font-store)' }}>
        Spotify <span className="font-medium text-white/90">Premium</span>
      </span>
    </div>
  )
}

function LogoGenerico({ nombre, tema }: { nombre: string; tema: Tema }) {
  const inicial = nombre.charAt(0).toUpperCase()
  return (
    <span
      className={`inline-flex h-14 w-14 items-center justify-center rounded-2xl text-2xl font-black shadow-md ${tema.logo}`}
    >
      {inicial}
    </span>
  )
}

function Fila({ plan, tema, plataforma }: { plan: PlanTienda; tema: Tema; plataforma: string }) {
  return (
    <div className={`relative overflow-hidden rounded-3xl p-6 ${tema.tarjeta}`}>
      {plan.ahorroPct ? (
        <span
          className={`absolute -top-0 right-4 rounded-b-xl px-3 py-1 text-xs font-bold shadow-sm ${tema.badge}`}
        >
          ahorra {plan.ahorroPct}%
        </span>
      ) : null}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-6">
        <div className="sm:w-40">
          <p className={`text-xl font-bold leading-tight ${tema.duracion}`}>{plan.etiqueta}</p>
        </div>
        <div
          className="hidden h-14 w-px sm:block"
          style={{ background: tema.dividerColor }}
        />
        <div className="flex-1 pt-1 sm:pt-0">
          <p className={`text-[10px] font-medium uppercase tracking-wide ${tema.ref}`}>ref.</p>
          <p className={`text-3xl font-extrabold leading-tight ${tema.precio}`}>
            {precioUsd(plan.precio_venta_usd)}
          </p>
          <p className={`text-xs font-medium ${tema.subtexto}`}>
            {plan.meses === 1 ? '' : `${precioUsd(plan.precioMes)}/mes`}
          </p>
        </div>
        <div className="sm:w-40">
          <ContratarPlan
            plataforma={plataforma}
            plan={plan}
            etiqueta="Contratar"
            className={`w-full rounded-full px-5 py-2.5 text-sm font-semibold transition-colors ${tema.boton}`}
          />
        </div>
      </div>
    </div>
  )
}

// ---------- Sección de venta en filas horizontales (Spotify/Canva/genérico) ----------
export default function TarjetasHorizontales({
  p,
  variante,
}: {
  p: PlataformaTienda
  variante: VarianteHorizontal
}) {
  const t = temas[variante]
  const esCanva = variante === 'canva'
  const esSpotify = variante === 'spotify'
  return (
    <section className={`${t.seccion} py-12`}>
      <div className="mx-auto max-w-3xl px-4">
        {/* Header */}
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          {esCanva ? (
            <LogoCanva nombre={p.nombre} />
          ) : esSpotify ? (
            <LogoSpotify />
          ) : (
            <LogoGenerico nombre={p.nombre} tema={t} />
          )}

          {esCanva ? (
            <p className="mt-1 max-w-sm text-sm text-white/90">
              Todo el poder de Canva a tu alcance.
            </p>
          ) : esSpotify ? (
            <p className="mt-1 max-w-sm text-sm text-white/90">
              Escucha tu música favorita sin límites.
            </p>
          ) : (
            <p className={`mt-1 max-w-sm text-sm ${t.subtitulo}`}>
              Planes flexibles y seguros de {p.nombre}
            </p>
          )}

          <h2 className="text-3xl font-extrabold tracking-tight text-white md:text-4xl">
            Planes
          </h2>
        </div>

        {/* Lista de tarjetas */}
        <div className="flex flex-col gap-7">
          {p.planes.length === 0 ? (
            <p className={`text-center text-sm ${t.subtitulo}`}>
              Próximamente… eligiendo precios.
            </p>
          ) : (
            p.planes.map((plan) => <Fila key={plan.duracion_dias} plan={plan} tema={t} plataforma={p.nombre} />)
          )}
        </div>

        {/* Footer descargo */}
        <p className="mt-8 text-center text-xs leading-relaxed text-white/70">
          Todos los planes se calculan al cambio oficial BCV a la fecha de tu compra.
        </p>
      </div>
    </section>
  )
}