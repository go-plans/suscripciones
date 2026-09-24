import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../lib/auth'
import { crearPedido } from '../../lib/api'
import { msjPedidoPlan, linkWhatsApp } from '../../lib/pedidos'
import { precioUsd } from '../../lib/tienda'
import type { PlanTienda } from '../../lib/tienda'

// Botón "Contratar" de un plan:
//  · sin sesión → registro de cuenta (flujo "registro + WhatsApp")
//  · con sesión → registra el pedido en el panel admin y abre WhatsApp
//    con el pedido prellenado.
export default function ContratarPlan({
  className = '',
  plataforma,
  plan,
  etiqueta = 'Contratar',
}: {
  className?: string
  plataforma: string
  plan: PlanTienda
  etiqueta?: string
}) {
  const { session, perfil } = useAuth()
  const [enviando, setEnviando] = useState(false)
  const [listo, setListo] = useState(false)
  const [error, setError] = useState('')

  if (!session) {
    return (
      <Link to="/registro" className={className}>
        {etiqueta}
      </Link>
    )
  }

  const comprar = async () => {
    if (enviando) return
    setEnviando(true)
    setError('')
    const r = await crearPedido({
      tipo: 'plan',
      plataforma,
      duracion_dias: plan.duracion_dias,
      precio_usd: plan.precio_venta_usd,
      valor_giftcard_usd: null,
      precio_giftcard_eur: null,
      diseno_giftcard: null,
      cliente_id: session.user.id,
      cliente_nombre: perfil?.nombre ?? null,
      cliente_contacto: perfil?.telefono ?? null,
    })
    setEnviando(false)
    if (r.ok) {
      setListo(true)
    } else {
      // Si la migración de `pedidos` aún no está aplicada, el pedido se
      // sigue tramitando por WhatsApp y avisamos suavemente.
      setError(r.error ?? 'No se pudo registrar el pedido automáticamente')
    }
    window.open(
      linkWhatsApp(msjPedidoPlan(plataforma, plan.etiqueta, precioUsd(plan.precio_venta_usd))),
      '_blank',
      'noopener,noreferrer',
    )
  }

  return (
    <span className="flex flex-col items-center gap-1">
      <button onClick={() => void comprar()} disabled={enviando} className={className}>
        {enviando ? 'Enviando…' : listo ? 'Pedido enviado ✓' : etiqueta}
      </button>
      {error ? <span className="text-[10px] text-amber-500">{error}</span> : null}
    </span>
  )
}