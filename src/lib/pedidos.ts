// Pedidos de la tienda (#/tienda): mensajes de WhatsApp + enlace de la
// imagen de cada diseño de gift card (public/apple/<id>.png).
import { WHATSAPP_PEDIDOS } from './giftcards'

export const linkWhatsApp = (texto: string): string =>
  `https://wa.me/${WHATSAPP_PEDIDOS}?text=${encodeURIComponent(texto)}`

export const msjPedidoGiftCard = (valor: string, precio: string, diseno: string): string =>
  [
    'Hola! 👋 Quiero comprar una Apple Gift Card 🍎',
    `💳 Valor: ${valor}`,
    `💰 Precio: ${precio}`,
    `🎨 Diseño: ${diseno}`,
    '',
    '¿Me indican cómo proceder con el pago?',
  ].join('\n')

export const msjPedidoPlan = (plataforma: string, plan: string, precio: string): string =>
  [
    'Hola! 👋 Quiero contratar un plan',
    `📺 Plataforma: ${plataforma}`,
    `📦 Plan: ${plan}`,
    `💰 Precio: ${precio}`,
    '',
    '¿Me indican cómo proceder con el pago?',
  ].join('\n')

export const msjContactoPedido = (nombre: string, detalle: string): string =>
  [
    `Hola ${nombre} 👋`,
    'Aquí Go Plans respecto a tu pedido:',
    `📦 ${detalle}`,
    '',
    '¿Seguimos con el pago?',
  ].join('\n')

// Ruta de la imagen de un diseño (public/apple/<id>.png) con el base de Vite.
export const rutaImagenDiseno = (id: string): string =>
  `${import.meta.env.BASE_URL}apple/${id}.png`