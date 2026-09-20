// Helpers del catálogo público de venta (#/tienda)
import type { CatalogoItem } from './types'
import { round2 } from './format'

export const MES = 30

export const mesesDe = (dias: number): number => Math.round(dias / MES)

export interface PlanTienda {
  duracion_dias: number
  precio_venta_usd: number
  precio_referencia_usd: number | null
  meses: number
  etiqueta: string // 'Por 1 mes' · 'Por 6 meses' · 'Por 1 año'
  etiquetaCorta: string // '1 mes' · '6 meses' · '1 año'
  precioMes: number // equivalente mensual del plan
  ahorroPct: number | null // null cuando no hay descuento visible
}

export interface PlataformaTienda {
  nombre: string
  logo_url: string | null
  precioMensual: number | null // plan de 1 mes (base de los ahorros)
  planes: PlanTienda[]
}

export const etiquetaDuracion = (dias: number): string => {
  const m = mesesDe(dias)
  if (m === 1) return 'Por 1 mes'
  if (m === 6) return 'Por 6 meses'
  if (m === 12) return 'Por 1 año'
  return `Por ${m} meses`
}

export const etiquetaCorta = (dias: number): string => {
  const m = mesesDe(dias)
  if (m === 1) return '1 mes'
  if (m === 12) return '1 año'
  return `${m} meses`
}

interface Agrupado {
  nombre: string
  logo_url: string | null
  filas: CatalogoItem[]
}

export function agruparCatalogo(items: CatalogoItem[]): PlataformaTienda[] {
  const mapa = new Map<string, Agrupado>()
  for (const it of items) {
    const g = mapa.get(it.plataforma)
    if (g) g.filas.push(it)
    else mapa.set(it.plataforma, { nombre: it.plataforma, logo_url: it.logo_url, filas: [it] })
  }
  const lista: PlataformaTienda[] = []
  for (const [nombre, g] of mapa) {
    const ordenados = [...g.filas].sort((a, b) => a.duracion_dias - b.duracion_dias)
    const mensual = ordenados.find((p) => p.duracion_dias === MES)
    const base = mensual?.precio_venta_usd ?? null
    lista.push({
      nombre,
      logo_url: g.logo_url,
      precioMensual: base,
      planes: ordenados.map((p) => {
        const meses = mesesDe(p.duracion_dias)
        // Ahorro visible:
        //  · el plan mensual se compara con su precio de referencia (tachado), si existe;
        //  · el resto se compara contra el equivalente a mes completo (base × meses).
        let ahorroPct: number | null = null
        if (meses === 1) {
          const ref = p.precio_referencia_usd
          if (ref && ref > p.precio_venta_usd) {
            ahorroPct = Math.round((1 - p.precio_venta_usd / ref) * 100)
          }
        } else if (base && base > 0) {
          ahorroPct = Math.round((1 - p.precio_venta_usd / (base * meses)) * 100)
        }
        if (ahorroPct !== null && ahorroPct <= 0) ahorroPct = null
        return {
          duracion_dias: p.duracion_dias,
          precio_venta_usd: p.precio_venta_usd,
          precio_referencia_usd: p.precio_referencia_usd,
          meses,
          etiqueta: etiquetaDuracion(p.duracion_dias),
          etiquetaCorta: etiquetaCorta(p.duracion_dias),
          precioMes: round2(p.precio_venta_usd / meses),
          ahorroPct,
        }
      }),
    })
  }
  return lista
}

// Variantes de diseño por plataforma
export const esGoogle = (nombre: string): boolean => /google/i.test(nombre)
export const esSpotify = (nombre: string): boolean => /spotify/i.test(nombre)
export const esCanva = (nombre: string): boolean => /canva/i.test(nombre)

export type VarianteHorizontal = 'spotify' | 'canva' | 'generica'

export function varianteHorizontal(nombre: string): VarianteHorizontal {
  if (esSpotify(nombre)) return 'spotify'
  if (esCanva(nombre)) return 'canva'
  return 'generica'
}

// Precio compacto para la tienda: "2.99$" (sin espacio, $ al final, punto decimal)
export const precioUsd = (n: number): string => {
  const s = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n)
  return `${s}$`
}