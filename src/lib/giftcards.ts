// Apple Gift Cards — catálogo de tarjetas de regalo (#/tienda/apple)
// Las tarifas viven en código (no en la BD): valor USD → precio de venta EUR.

export interface TarjetaRegalo {
  valor_usd: number
  precio_eur: number
}

// Diseños de tarjeta que el cliente puede elegir al comprar.
// Cada diseño tiene su imagen propia en public/apple/<id>.png
// (las subirá el dueño de la tienda). Mientras no exista la imagen,
// se muestra un placeholder CSS con este gradiente.
export interface DisenoGiftCard {
  id: string
  nombre: string
  descripcion: string
  gradiente: string
  texto: string // color del texto sobre la tarjeta
}

export const SLUG_APPLE = 'apple'

// WhatsApp al que se envía cada pedido (+58 424 6603660 → formato wa.me)
export const WHATSAPP_PEDIDOS = '584246603660'

// Tarifas fijas: 💵 valor de la tarjeta (USD) → 💶 precio de venta (EUR)
export const TARJETAS_APPLE: TarjetaRegalo[] = [
  { valor_usd: 2, precio_eur: 3.1 },
  { valor_usd: 3, precio_eur: 4.3 },
  { valor_usd: 4, precio_eur: 5.5 },
  { valor_usd: 5, precio_eur: 6.75 },
  { valor_usd: 6, precio_eur: 8 },
  { valor_usd: 7, precio_eur: 9.2 },
  { valor_usd: 8, precio_eur: 10.4 },
  { valor_usd: 9, precio_eur: 11.6 },
  { valor_usd: 10, precio_eur: 13 },
  { valor_usd: 15, precio_eur: 18.75 },
  { valor_usd: 20, precio_eur: 25 },
  { valor_usd: 25, precio_eur: 30.75 },
  { valor_usd: 30, precio_eur: 36.5 },
  { valor_usd: 35, precio_eur: 42.25 },
  { valor_usd: 40, precio_eur: 48 },
  { valor_usd: 50, precio_eur: 60.5 },
  { valor_usd: 60, precio_eur: 72 },
  { valor_usd: 75, precio_eur: 88.75 },
  { valor_usd: 100, precio_eur: 117 },
]

// Diseños disponibles (id = nombre del archivo en public/apple/)
export const DISENOS_APPLE: DisenoGiftCard[] = [
  {
    id: 'clasico',
    nombre: 'Apple Gift Card',
    descripcion: 'Blanca con arcoíris',
    gradiente: 'linear-gradient(135deg,#F5F5F7 0%,#FFFFFF 100%)',
    texto: '#1D1D1F',
  },
  {
    id: 'appstore',
    nombre: 'App Store & iTunes',
    descripcion: 'Azul clásico',
    gradiente: 'linear-gradient(135deg,#2997FF 0%,#0A60FF 100%)',
    texto: '#FFFFFF',
  },
  {
    id: 'noche',
    nombre: 'Apple Gift Card · Noche',
    descripcion: 'Negro carbón',
    gradiente: 'linear-gradient(135deg,#3A3A3C 0%,#161617 100%)',
    texto: '#FFFFFF',
  },
]

export function disenoPorId(id: string | null | undefined): DisenoGiftCard {
  return DISENOS_APPLE.find((d) => d.id === id) ?? DISENOS_APPLE[0]
}

// Precio EUR: "30.75 €" (punto decimal, como la lista de tarifas)
export const euro = (n: number): string =>
  `${new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n)} €`

// Valor USD: "$25" (sin decimales, como los mosaicos de Apple)
export const dolar = (n: number): string =>
  `$${new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(n)}`

// "Desde 3.10 €" para la tarjeta del catálogo (la tarifa más barata)
export const desdeGiftCardsEur = (): string => {
  const min = Math.min(...TARJETAS_APPLE.map((t) => t.precio_eur))
  return euro(min)
}