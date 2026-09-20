import { Link } from 'react-router-dom'
import type { PlataformaTienda, PlanTienda, VarianteHorizontal } from '../../lib/tienda'
import { precioUsd } from '../../lib/tienda'

interface Tema {
  seccion: string
  titulo: string
  tarjeta: string
  duracion: string
  precio: string
  subtexto: string
  ref: string
  badge: string
  boton: string
  logo: string
}

const temas: Record<VarianteHorizontal, Tema> = {
  spotify: {
    seccion: 'bg-[#1DB954]',
    titulo: 'text-white',
    tarjeta: 'bg-[#0F0F0F] text-white',
    duracion: 'text-white',
    precio: 'text-white',
    subtexto: 'text-[#1DB954]',
    ref: 'text-[#9AA0A6]',
    badge: 'bg-white text-black',
    boton: 'bg-[#1DB954] text-black hover:bg-[#1ED760]',
    logo: 'bg-[#0F0F0F] text-[#1DB954]',
  },
  canva: {
    seccion: 'bg-gradient-to-br from-[#6D28D9] to-[#7D2AE8]',
    titulo: 'text-white',
    tarjeta: 'bg-white text-slate-900',
    duracion: 'text-slate-900',
    precio: 'text-slate-900',
    subtexto: 'text-[#00A8AE]',
    ref: 'text-slate-400',
    badge: 'bg-[#00C4CC] text-black',
    boton: 'bg-[#00C4CC] text-black hover:bg-[#00A8AE]',
    logo: 'bg-white text-[#6D28D9]',
  },
  generica: {
    seccion: 'bg-slate-100',
    titulo: 'text-slate-900',
    tarjeta: 'bg-white text-slate-900 border border-slate-200',
    duracion: 'text-slate-900',
    precio: 'text-slate-900',
    subtexto: 'text-slate-500',
    ref: 'text-slate-400',
    badge: 'bg-indigo-600 text-white',
    boton: 'bg-indigo-600 text-white hover:bg-indigo-700',
    logo: 'bg-indigo-600 text-white',
  },
}

function Fila({ plan, tema }: { plan: PlanTienda; tema: Tema }) {
  return (
    <div className={`relative rounded-3xl p-6 pr-8 ${tema.tarjeta}`}>
      {plan.ahorroPct ? (
        <span
          className={`absolute -top-3 right-5 rounded-full px-3 py-1 text-xs font-bold shadow-sm ${tema.badge}`}
        >
          ahorra {plan.ahorroPct}%
        </span>
      ) : null}
      <div className="flex flex-col gap-4 pt-1 sm:flex-row sm:items-center sm:gap-6">
        <div className="sm:w-36">
          <p className={`text-lg font-bold leading-tight ${tema.duracion}`}>{plan.etiqueta}</p>
          <p className={`text-xs ${tema.ref}`}>
          {plan.meses === 1 ? 'Mensual' : plan.meses === 6 ? 'Semestral' : 'Anual'}
        </p>
        </div>
        <div className="hidden h-12 w-px bg-current opacity-20 sm:block" />
        <div className="flex-1 pt-1 sm:pt-0">
          <p className={`text-[10px] font-medium uppercase tracking-wide ${tema.ref}`}>ref.</p>
          <p className={`text-3xl font-extrabold leading-tight ${tema.precio}`}>
            {precioUsd(plan.precio_venta_usd)}
          </p>
          <p className={`text-xs font-medium ${tema.subtexto}`}>{precioUsd(plan.precioMes)} /mes</p>
        </div>
        <Link
          to="/registro"
          className={`inline-flex items-center justify-center rounded-full px-6 py-3 text-sm font-bold transition-colors ${tema.boton}`}
        >
          Contratar
        </Link>
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
  const inicial = p.nombre.charAt(0).toUpperCase()
  return (
    <section className={`${t.seccion} py-12`}>
      <div className="mx-auto max-w-3xl px-4">
        {/* Header */}
        <div className="mb-8 flex flex-col items-center gap-2 text-center">
          <span
            className={`inline-flex h-14 w-14 items-center justify-center rounded-2xl text-2xl font-black shadow-md ${t.logo}`}
          >
            {inicial}
          </span>
          <p className={`mt-1 max-w-sm text-sm ${t.titulo} opacity-90`}>
            Planes flexibles y seguros de {p.nombre}
          </p>
          <h2 className={`text-3xl font-extrabold tracking-tight md:text-4xl ${t.titulo}`}>
            Planes
          </h2>
        </div>

        {/* Lista de tarjetas */}
        <div className="flex flex-col gap-7">
          {p.planes.length === 0 ? (
            <p className={`text-center text-sm ${t.titulo} opacity-80`}>
              Próximamente… eligiendo precios.
            </p>
          ) : (
            p.planes.map((plan) => <Fila key={plan.duracion_dias} plan={plan} tema={t} />)
          )}
        </div>
      </div>
    </section>
  )
}