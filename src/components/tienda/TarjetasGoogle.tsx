import { Link } from 'react-router-dom'
import type { PlataformaTienda, PlanTienda } from '../../lib/tienda'
import { precioUsd } from '../../lib/tienda'

// ---------- Tarjeta de precio (variante Google: vertical) ----------
function CartaPrecio({ plan, destacada }: { plan: PlanTienda; destacada?: boolean }) {
  const tachado = plan.precio_referencia_usd
  return (
    <div
      className="relative rounded-[30px] p-[3px]"
      style={
        destacada
          ? { backgroundImage: 'linear-gradient(135deg,#4285F4,#EA4335,#FBBC05,#34A853)' }
          : undefined
      }
    >
      <div
        className={`flex h-full flex-col gap-3 rounded-[27px] bg-white p-6 ${
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

        <p className="text-sm font-semibold text-[#5F6368]">{plan.etiqueta}</p>
        <div>
          {tachado ? (
            <p className="text-sm text-[#9AA0A6] line-through">{precioUsd(tachado)}</p>
          ) : null}
          <p
            className={`text-3xl font-extrabold ${
              destacada ? 'text-[#4285F4]' : 'text-[#202124]'
            }`}
          >
            {precioUsd(plan.precio_venta_usd)}
          </p>
          <p className="text-xs text-[#5F6368]">
            {plan.meses === 1 ? 'único pago' : `equivale a ${precioUsd(plan.precioMes)} /mes`}
          </p>
        </div>
        <Link
          to="/registro"
          className={`mt-auto rounded-full px-4 py-2.5 text-center text-sm font-semibold transition-colors ${
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
    <section className="bg-[#FFFFFF] py-12">
      <div className="mx-auto max-w-5xl px-4">
        {/* Hero */}
        <div className="text-center">
          <h1 className="text-4xl font-extrabold tracking-tight text-[#202124] md:text-5xl">
            5 TB de almacenamiento
          </h1>
          <p className="mt-2 text-xl text-[#5F6368] md:text-2xl">en tu cuenta de Google</p>
          {/* Fila de integraciones */}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-2 text-sm font-medium text-[#5F6368]">
            {['Gmail', 'Google Photos', 'Google Drive', 'Google One', '+'].map((s) => (
              <span key={s} className="rounded-full bg-[#F1F3F4] px-4 py-1.5">
                {s}
              </span>
            ))}
            <span className="rounded-full bg-gradient-to-r from-[#1a73e8] to-[#34A853] px-4 py-1.5 text-white">
              ✦ Gemini Pro
            </span>
          </div>
        </div>

        {/* Comparativo: Pasa de esto → A esto */}
        <div className="mt-10">
          <p className="text-center text-sm font-semibold uppercase tracking-widest text-[#5F6368]">
            Pasa de esto → A esto
          </p>
          <div className="mt-4 grid items-center gap-4 md:grid-cols-[1fr_auto_1fr]">
            {/* Problema */}
            <div className="rounded-3xl bg-[#4A121A] p-6 text-left text-white">
              <p className="text-xs font-bold uppercase tracking-widest text-[#F28B82]">
                Se agotó el almacenamiento
              </p>
              <p className="mt-3 text-sm leading-relaxed text-[#FAD2CF]">
                No pudimos enviar ni recibir correos. Tu cuenta de Gmail está llena.
              </p>
              <div className="mt-4 h-3 w-full overflow-hidden rounded-full bg-white/20">
                <div className="h-full w-full rounded-full bg-[#EA4335]" />
              </div>
              <p className="mt-1 text-right text-xs text-[#F28B82]">100% usado</p>
              <div className="mt-5 flex flex-wrap gap-2">
                <span className="rounded-full border border-white/70 px-4 py-1.5 text-xs font-semibold">
                  Obtener oferta
                </span>
                <span className="rounded-full border border-white/70 px-4 py-1.5 text-xs font-semibold">
                  Liberar espacio
                </span>
              </div>
            </div>

            {/* Flecha */}
            <div className="hidden text-4xl font-black text-[#4285F4] md:block">→</div>
            <div className="block text-center text-4xl font-black text-[#4285F4] md:hidden">↓</div>

            {/* Solución */}
            <div className="rounded-3xl bg-[#18191B] p-6 text-white">
              <div className="flex items-center gap-2 text-xs text-[#9AA0A6]">
                <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-[#4285F4] text-[10px] font-black text-white">
                  G
                </span>
                tu cuenta · Google One
              </div>
              <p className="mt-4 text-sm text-[#BDC1C6]">5 TB de almacenamiento</p>
              <p className="mt-2 text-2xl font-bold text-[#34A853]">0% de 5 TB en uso</p>
              <div className="mt-4 h-3 w-full overflow-hidden rounded-full bg-white/10">
                <div className="h-full w-[2%] rounded-full bg-[#34A853]" />
              </div>
              <p className="mt-1 text-right text-xs text-[#9AA0A6]">Sobran 5 TB</p>
            </div>
          </div>
        </div>

        {/* Precios */}
        <div className="mt-12">
          <h2 className="text-center text-xl font-bold text-[#202124] md:text-2xl">
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