import { Link } from 'react-router-dom'
import type { PlataformaTienda, PlanTienda } from '../../lib/tienda'
import { precioUsd } from '../../lib/tienda'

// ---------- Colores Google ----------
const GOOGLE = {
  blue: '#4285F4',
  red: '#EA4335',
  yellow: '#FBBC05',
  green: '#34A853',
  dark: '#202124',
  mid: '#5F6368',
  light: '#9AA0A6',
  bg: '#F1F3F4',
  bgAlt: '#F8F9FA',
  link: '#1a73e8',
}

// Texto "1 año" con cada letra en color Google
function AnoGoogle({ className = '' }: { className?: string }) {
  const letters = [
    { char: '1', color: GOOGLE.blue },
    { char: ' ', color: '' },
    { char: 'a', color: GOOGLE.red },
    { char: 'ñ', color: GOOGLE.yellow },
    { char: 'o', color: GOOGLE.green },
  ]
  return (
    <span className={className}>
      {letters.map((l, i) =>
        l.char === ' ' ? (
          <span key={i}>&nbsp;</span>
        ) : (
          <span key={i} style={{ color: l.color }}>
            {l.char}
          </span>
        ),
      )}
    </span>
  )
}

// ---------- Tarjeta de precio (variante Google: vertical) ----------
function CartaPrecio({ plan, destacada }: { plan: PlanTienda; destacada?: boolean }) {
  const tachado = plan.precio_referencia_usd
  const esAno = plan.meses === 12
  return (
    <div
      className="relative rounded-[30px] p-[3px]"
      style={
        destacada
          ? { backgroundImage: `linear-gradient(135deg, ${GOOGLE.blue}, ${GOOGLE.red}, ${GOOGLE.yellow}, ${GOOGLE.green})` }
          : undefined
      }
    >
      <div
        className={`flex h-full flex-col items-center gap-2 rounded-[27px] bg-white px-6 py-8 text-center ${
          destacada ? '' : 'border-2 border-[#E0E0E0]'
        }`}
      >
        {plan.ahorroPct ? (
          <span
            className={`absolute -top-3 right-4 rounded-full px-3 py-1 text-xs font-bold ${
              destacada
                ? 'bg-gradient-to-r from-[#4285F4] to-[#34A853] text-white'
                : 'bg-[#F1F3F4] text-[#5F6368]'
            }`}
          >
            Ahorra {plan.ahorroPct}%
          </span>
        ) : null}

        {/* Etiqueta de duración */}
        {esAno ? (
          <AnoGoogle className="text-2xl font-extrabold tracking-tight md:text-3xl" />
        ) : (
          <p className="text-2xl font-extrabold tracking-tight text-[#202124] md:text-3xl">
            {plan.etiquetaCorta}
          </p>
        )}

        <div className="mt-2">
          {tachado ? (
            <p className="text-sm text-[#9AA0A6] line-through">{precioUsd(tachado)}</p>
          ) : null}
          <p
            className={`text-4xl font-extrabold ${
              destacada ? 'text-[#4285F4]' : 'text-[#202124]'
            }`}
          >
            {precioUsd(plan.precio_venta_usd)}
          </p>
        </div>
        <Link
          to="/registro"
          className={`mt-auto rounded-full px-6 py-3 text-sm font-semibold transition-colors ${
            destacada
              ? 'bg-[#4285F4] text-white hover:bg-[#1a73e8]'
              : 'bg-[#F8F9FA] text-[#1a73e8] hover:bg-[#E8F0FE]'
          }`}
        >
          Contratar
        </Link>
      </div>
    </div>
  )
}

// ---------- Sección de venta estilo Google (columna vertical) ----------
export default function TarjetasGoogle({ p }: { p: PlataformaTienda }) {
  return (
    <section className="bg-white py-12">
      <div className="mx-auto max-w-5xl px-4">
        {/* Hero */}
        <div className="text-center">
          <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 md:text-5xl" style={{ fontFamily: 'var(--font-display), "Google Sans", system-ui' }}>
            5 TB de almacenamiento
          </h1>
          <p className="mt-2 text-xl md:text-2xl" style={{ color: GOOGLE.mid }}>
            en tu cuenta de Google
          </p>
          {/* Fila de integraciones */}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-2 text-sm font-medium" style={{ color: GOOGLE.mid }}>
            {['Gmail', 'Google Photos', 'Google Drive', 'Google One', '+'].map((s) => (
              <span key={s} className="rounded-full px-4 py-1.5" style={{ background: GOOGLE.bg }}>
                {s}
              </span>
            ))}
            <span className="rounded-full px-4 py-1.5 text-white" style={{ background: `linear-gradient(135deg, ${GOOGLE.link}, ${GOOGLE.green})` }}>
              ✦ Gemini Pro
            </span>
          </div>
        </div>

        {/* Comparativo: Pasa de esto → A esto */}
        <div className="mt-10">
          <p className="text-center text-sm font-semibold uppercase tracking-widest" style={{ color: GOOGLE.mid }}>
            Pasa de esto → A esto
          </p>
          <div className="mt-4 grid items-center gap-4 md:grid-cols-[1fr_auto_1fr]">
            {/* Problema */}
            <div className="rounded-3xl p-6 text-left text-white" style={{ background: '#4A121A' }}>
              <p className="text-xs font-bold uppercase tracking-widest" style={{ color: '#F28B82' }}>
                Se agotó el almacenamiento
              </p>
              <p className="mt-3 text-sm leading-relaxed" style={{ color: '#FAD2CF' }}>
                No puedes enviar ni recibir correos electrónicos
              </p>
              <div className="mt-4 h-3 w-full overflow-hidden rounded-full" style={{ background: 'rgba(255,255,255,0.2)' }}>
                <div className="h-full w-full rounded-full" style={{ background: GOOGLE.red }} />
              </div>
              <p className="mt-1 text-right text-xs" style={{ color: '#F28B82' }}>16.44 GB de 15 GB en uso</p>
              <div className="mt-5 flex flex-wrap gap-2">
                <span className="rounded-full border px-4 py-1.5 text-xs font-semibold" style={{ borderColor: 'rgba(255,255,255,0.7)' }}>
                  Obtener oferta
                </span>
                <span className="rounded-full border px-4 py-1.5 text-xs font-semibold" style={{ borderColor: 'rgba(255,255,255,0.7)' }}>
                  Liberar espacio
                </span>
              </div>
            </div>

            {/* Flecha */}
            <div className="hidden text-4xl font-black md:block" style={{ color: GOOGLE.blue }}>→</div>
            <div className="block text-center text-4xl font-black md:hidden" style={{ color: GOOGLE.blue }}>↓</div>

            {/* Solución */}
            <div className="rounded-3xl p-6 text-white" style={{ background: '#18191B' }}>
              <div className="flex items-center gap-2 text-xs" style={{ color: GOOGLE.light }}>
                <span className="inline-flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-black text-white" style={{ background: GOOGLE.blue }}>
                  G
                </span>
                tu cuenta · Google One
              </div>
              <p className="mt-4 text-sm" style={{ color: '#BDC1C6' }}>5 TB de almacenamiento</p>
              <p className="mt-2 text-2xl font-bold" style={{ color: GOOGLE.green }}>0% de 5 TB en uso</p>
              <div className="mt-4 h-3 w-full overflow-hidden rounded-full" style={{ background: 'rgba(255,255,255,0.1)' }}>
                <div className="h-full w-[2%] rounded-full" style={{ background: GOOGLE.green }} />
              </div>
              <p className="mt-1 text-right text-xs" style={{ color: GOOGLE.light }}>Sobran 5 TB</p>
            </div>
          </div>
        </div>

        {/* Precios */}
        <div className="mt-12">
          <h2
            className="text-center text-xl font-bold md:text-2xl"
            style={{ fontFamily: 'var(--font-display), system-ui, sans-serif', color: GOOGLE.dark }}
          >
            Libera espacio en tu correo por:
          </h2>
          <div className="mt-8 grid gap-8 md:grid-cols-3 md:gap-5">
            {p.planes.map((plan, i) => (
              <CartaPrecio key={plan.duracion_dias} plan={plan} destacada={i === p.planes.length - 1} />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}