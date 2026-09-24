// Carrito de la tienda — persistencia en localStorage para que sobreviva
// navegación, cierre de pestaña y el registro de cuenta.

export interface LineaCarrito {
  clave: string // único: 'gc:<diseno>:<valor>' | 'plan:<plataforma>:<dias>'
  tipo: 'giftcard' | 'plan'
  plataforma: string
  titulo: string
  detalle: string
  // Precio de referencia: EUR para gift cards, USD para planes.
  // Es la base de Pago Móvil (con tasa) y el número exacto para USDT/USDC/etc.
  precio_ref: number
  ref_moneda: 'EUR' | 'USD'
  cantidad: number
  // Campos para crear el pedido en el checkout:
  duracion_dias?: number
  precio_usd?: number
  valor_giftcard_usd?: number
  precio_giftcard_eur?: number
  diseno_giftcard?: string
}

export const CLAVE_CARRITO = 'goplans_carrito_v1'

export function leerCarrito(): LineaCarrito[] {
  try {
    const raw = localStorage.getItem(CLAVE_CARRITO)
    if (!raw) return []
    const arr = JSON.parse(raw) as LineaCarrito[]
    return Array.isArray(arr) ? arr : []
  } catch {
    return []
  }
}

function persistir(lineas: LineaCarrito[]): void {
  try {
    localStorage.setItem(CLAVE_CARRITO, JSON.stringify(lineas))
  } catch {
    // almacenamiento no disponible: el carrito vive solo en memoria
  }
}

export function totalArticulos(lineas: LineaCarrito[]): number {
  return lineas.reduce((acc, l) => acc + l.cantidad, 0)
}

// Suma del precio de referencia por moneda (EUR gift cards, USD planes).
export function totalRef(lineas: LineaCarrito[]): { eur: number; usd: number } {
  return lineas.reduce(
    (acc, l) => {
      if (l.ref_moneda === 'EUR') acc.eur += l.precio_ref * l.cantidad
      else acc.usd += l.precio_ref * l.cantidad
      return acc
    },
    { eur: 0, usd: 0 },
  )
}

// Conviértelo en la línea del carrito (uniforma el formato).
export function agregarALocal(lineas: LineaCarrito[], linea: LineaCarrito): LineaCarrito[] {
  const i = lineas.findIndex((l) => l.clave === linea.clave)
  if (i >= 0) {
    const copia = [...lineas]
    copia[i] = { ...copia[i], cantidad: copia[i].cantidad + (linea.cantidad ?? 1) }
    return copia
  }
  return [...lineas, { ...linea, cantidad: linea.cantidad ?? 1 }]
}

export function quitarDelLocal(lineas: LineaCarrito[], clave: string): LineaCarrito[] {
  return lineas.filter((l) => l.clave !== clave)
}

export function setCantidadLocal(lineas: LineaCarrito[], clave: string, cantidad: number): LineaCarrito[] {
  if (cantidad <= 0) return quitarDelLocal(lineas, clave)
  return lineas.map((l) => (l.clave === clave ? { ...l, cantidad } : l))
}

export { persistir }