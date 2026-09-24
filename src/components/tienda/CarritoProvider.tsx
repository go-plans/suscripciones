import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'
import {
  agregarALocal,
  leerCarrito,
  persistir,
  quitarDelLocal,
  setCantidadLocal,
  totalArticulos,
  type LineaCarrito,
} from '../../lib/carrito'

interface CarritoCtx {
  lineas: LineaCarrito[]
  total: number
  agregar: (linea: LineaCarrito) => number // devuelve la cantidad nueva de esa línea
  quitar: (clave: string) => void
  setCantidad: (clave: string, cantidad: number) => void
  vaciar: () => void
  refrescar: () => void
}

const Ctx = createContext<CarritoCtx | null>(null)

export function CarritoProvider({ children }: { children: ReactNode }) {
  const [lineas, setLineas] = useState<LineaCarrito[]>(() => leerCarrito())

  const mutar = useCallback((siguiente: LineaCarrito[] | ((prev: LineaCarrito[]) => LineaCarrito[])) => {
    setLineas((prev) => {
      const nueva = typeof siguiente === 'function' ? siguiente(prev) : siguiente
      persistir(nueva)
      return nueva
    })
  }, [])

  const agregar = useCallback(
    (linea: LineaCarrito) => {
      let nuevaCantidad = linea.cantidad ?? 1
      mutar((prev) => {
        const res = agregarALocal(prev, linea)
        const l = res.find((x) => x.clave === linea.clave)
        nuevaCantidad = l?.cantidad ?? 1
        return res
      })
      return nuevaCantidad
    },
    [mutar],
  )

  const quitar = useCallback((clave: string) => mutar((prev) => quitarDelLocal(prev, clave)), [mutar])
  const setCantidad = useCallback(
    (clave: string, cantidad: number) => mutar((prev) => setCantidadLocal(prev, clave, cantidad)),
    [mutar],
  )
  const vaciar = useCallback(() => mutar([]), [mutar])
  const refrescar = useCallback(() => setLineas(leerCarrito()), [])

  const value = useMemo<CarritoCtx>(
    () => ({
      lineas,
      total: totalArticulos(lineas),
      agregar,
      quitar,
      setCantidad,
      vaciar,
      refrescar,
    }),
    [lineas, agregar, quitar, setCantidad, vaciar, refrescar],
  )

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useCarrito(): CarritoCtx {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useCarrito debe usarse dentro de <CarritoProvider>')
  return ctx
}