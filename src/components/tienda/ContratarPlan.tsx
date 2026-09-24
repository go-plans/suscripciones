import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useCarrito } from './CarritoProvider'
import type { PlanTienda } from '../../lib/tienda'

// Botón "Contratar / Añadir" de un plan: agrega la línea al carrito.
// El pago/Checkout (y el registro de pedido) ocurre en /#/checkout.
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
  const { agregar } = useCarrito()
  const [añadido, setAñadido] = useState(false)

  const añadir = () => {
    agregar({
      clave: `plan:${plataforma}:${plan.duracion_dias}`,
      tipo: 'plan',
      plataforma,
      titulo: plataforma,
      detalle: plan.etiqueta,
      precio_ref: plan.precio_venta_usd,
      ref_moneda: 'USD',
      cantidad: 1,
      duracion_dias: plan.duracion_dias,
      precio_usd: plan.precio_venta_usd,
    })
    setAñadido(true)
  }

  return (
    <span className="flex flex-col items-center gap-1">
      <button onClick={añadir} className={className}>
        {añadido ? '✓ En el carrito' : etiqueta}
      </button>
      {añadido ? (
        <Link to="/carrito" className="text-[10px] font-medium underline">
          Ver carrito
        </Link>
      ) : null}
    </span>
  )
}