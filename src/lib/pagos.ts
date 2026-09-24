// Métodos de pago del checkout (#/checkout).
//  · Pago Móvil → bolívares. Las Apple Gift Cards van ANCLADAS AL EURO
//    (precio EUR × tasa_eur_bs); los planes usan la tasa BCV (USD → Bs).
//  · USDT / USDC / Zinli / Binance → mismo número que el precio de
//    referencia: gift cards en EUR (3.10 USDT por una de 3.10 €),
//    planes en USD (2.99 USDT por el plan de 2.99 $).

export type MetodoPago = 'pagomovil' | 'usdt' | 'usdc' | 'zinli' | 'binance'

export interface MetodoInfo {
  id: MetodoPago
  nombre: string
  moneda: 'BS' | 'USDT' | 'USDC' | 'USD'
  descripcion: string
  icono: string
}

export const METODOS_PAGO: MetodoInfo[] = [
  { id: 'pagomovil', nombre: 'Pago Móvil', moneda: 'BS', descripcion: 'Bolívares (Bs)', icono: '🏦' },
  { id: 'usdt', nombre: 'USDT', moneda: 'USDT', descripcion: 'Tether', icono: '₮' },
  { id: 'usdc', nombre: 'USDC', moneda: 'USDC', descripcion: 'USD Coin', icono: '🪙' },
  { id: 'zinli', nombre: 'Zinli', moneda: 'USD', descripcion: 'Tarjeta virtual prepagada', icono: '💳' },
  { id: 'binance', nombre: 'Binance', moneda: 'USDT', descripcion: 'Pago P2P de Binance', icono: '🟡' },
]

/**
 * Datos de cobro del negocio (lo que el cliente ve como instrucciones).
 * ⚠️ PENDIENTE: el dueño debe proveer estos datos (ver sección final del
 * resumen de la sesión). Hasta entonces el checkout avisa "datos por
 * confirmar" pero el pedido se registra igual.
 */
export const DATOS_COBRO: Record<MetodoPago, string | null> = {
  pagomovil: null, // 'PENDIENTE — teléfono + cédula + banco'
  usdt: null, // 'PENDIENTE — dirección TRC20'
  usdc: null, // 'PENDIENTE — dirección de red'
  zinli: null, // 'PENDIENTE — número de tarjeta / teléfono'
  binance: null, // 'PENDIENTE — correo o ID de pago'
}

export const etiquetaMetodo = (m: MetodoPago): string =>
  METODOS_PAGO.find((x) => x.id === m)?.nombre ?? m

// ---------- Cálculo del cobro ----------

export interface TasasCobro {
  bcv: number | null // USD → Bs
  eur: number | null // € → Bs (gift cards)
}

// Monto a cobrar para una línea del carrito según el método.
//  · pagomovil: gift card → precio_eur × tasa_eur ; plan → precio_usd × tasa_bcv
//  · cripto / Zinli: el mismo número del precio de referencia (EUR o USD)
export function montoCobro(
  metodo: MetodoPago,
  precioRef: number,
  refMoneda: 'EUR' | 'USD',
  tasas: TasasCobro,
): number | null {
  if (metodo === 'pagomovil') {
    const t = refMoneda === 'EUR' ? tasas.eur : tasas.bcv
    if (t == null || t <= 0) return null
    return precioRef * t
  }
  return precioRef
}

export function monedaCobro(metodo: MetodoPago): 'BS' | 'USDT' | 'USDC' | 'USD' {
  return METODOS_PAGO.find((x) => x.id === metodo)?.moneda ?? 'USDT'
}

// ---------- Formato ----------

const n2 = new Intl.NumberFormat('en-US', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

const nBs = new Intl.NumberFormat('es-VE', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

export const fmtUsd = (n: number): string => `${n2.format(n)} USD`
export const fmtMonedaCobro = (moneda: string, monto: number): string => {
  if (moneda === 'BS') return `${nBs.format(monto)} Bs`
  return `${n2.format(monto)} ${moneda}`
}

export const fmtPrecioCobro = (m: MetodoPago, precioRef: number, refMoneda: 'EUR' | 'USD', tasas: TasasCobro): string => {
  const monto = montoCobro(m, precioRef, refMoneda, tasas)
  return monto == null ? '—' : fmtMonedaCobro(monedaCobro(m), monto)
}