// Pedidos de la tienda (#/tienda): mensajes de WhatsApp + enlace de la
// imagen de cada diseño de gift card (public/apple/<id>.png).
import { WHATSAPP_PEDIDOS } from './giftcards'

export const linkWhatsApp = (texto: string): string =>
  `https://wa.me/${WHATSAPP_PEDIDOS}?text=${encodeURIComponent(texto)}`

export const msjContactoPedido = (nombre: string, detalle: string): string =>
  [
    `Hola ${nombre} 👋`,
    'Aquí Go Plans respecto a tu pedido:',
    `📦 ${detalle}`,
    '',
    '¿Seguimos con el pago?',
  ].join('\n')

export interface LineaMsjCheckout {
  cantidad: number
  texto: string
}

// Mensaje del resumen completo del carrito (checkout): líneas + total por el
// método elegido + instrucciones de pago del negocio.
export function msjPedidoCheckout(o: {
  cliente: string
  lineas: LineaMsjCheckout[]
  total: string
  metodo: string
  instrucciones: string | null
}): string {
  const partes = [
    `Hola! 🛒 Nuevo pedido de ${o.cliente}`,
    '',
    ...o.lineas.map((l) => `${l.cantidad > 1 ? `${l.cantidad}× ` : ''}• ${l.texto}`),
    '',
    `Total a pagar: ${o.total}`,
    `Método de pago: ${o.metodo}`,
  ]
  if (o.instrucciones) partes.push(`Instrucciones: ${o.instrucciones}`)
  else partes.push('Instrucciones de pago: te las confirmo por este chat')
  partes.push('', 'Confirmo el pedido ✅ ¿Cómo sigo con el pago?')
  return partes.join('\n')
}

// Ruta de la imagen de un diseño (public/apple/<id>.png) con el base de Vite.
export const rutaImagenDiseno = (id: string): string =>
  `${import.meta.env.BASE_URL}apple/${id}.png`