import { supabase, SUPABASE_KEY, SUPABASE_URL } from './supabase'
import { hoy, round2 } from './format'
import { errMsg } from './err'
import type {
  CatalogoItem,
  ComisionRow,
  CuentaMadre,
  CuentaMadreRow,
  Moneda,
  PagoRow,
  PlanRow,
  Plataforma,
  Proveedor,
  SuscripcionRow,
  Usuario,
  VencimientoProveedor,
} from './types'

// ---------- Caché en memoria (TTL 20s) para agilizar la navegación ----------
const cache = new Map<string, { at: number; data: unknown }>()
const TTL = 20_000

async function cached<T>(key: string, fn: () => Promise<T>): Promise<T> {
  const hit = cache.get(key)
  if (hit && Date.now() - hit.at < TTL) return hit.data as T
  const data = await fn()
  cache.set(key, { at: Date.now(), data })
  return data
}

function invalidar(...keys: string[]) {
  for (const k of keys) cache.delete(k)
}

// ---------------------------------------------------------------- Clientes
export async function fetchClientes(): Promise<Usuario[]> {
  return cached('clientes', async () => {
    const { data, error } = await supabase
      .from('usuarios')
      .select('*')
      .eq('rol', 'cliente')
      .order('nombre')
    if (error) throw new Error(errMsg(error))
    return (data ?? []) as Usuario[]
  })
}

export async function fetchAgentes(): Promise<Usuario[]> {
  return cached('agentes', async () => {
    const { data, error } = await supabase
      .from('usuarios')
      .select('id, nombre, email')
      .eq('rol', 'agente')
      .order('nombre')
    if (error) throw new Error(errMsg(error))
    return (data ?? []) as Usuario[]
  })
}

export async function crearCliente(input: {
  nombre: string
  email?: string
  telefono?: string
  referido_por?: string | null
}): Promise<string> {
  const { data, error } = await supabase
    .from('usuarios')
    .insert({
      rol: 'cliente',
      nombre: input.nombre,
      email: input.email || null,
      telefono: input.telefono || null,
      referido_por: input.referido_por || null,
    })
    .select('id')
    .single()
  if (error) throw new Error(errMsg(error))
  invalidar('clientes')
  return (data as { id: string }).id
}

export async function actualizarCliente(
  id: string,
  input: { nombre: string; email?: string; telefono?: string },
): Promise<void> {
  const { error } = await supabase
    .from('usuarios')
    .update({
      nombre: input.nombre,
      email: input.email || null,
      telefono: input.telefono || null,
    })
    .eq('id', id)
  if (error) throw new Error(errMsg(error))
  invalidar('clientes')
}

export async function eliminarCliente(id: string): Promise<void> {
  const { error } = await supabase.from('usuarios').delete().eq('id', id)
  if (error) throw new Error(errMsg(error))
  invalidar('clientes', 'susc', 'pagos', 'resumen', 'comisiones')
}

// -------------------------------------------------------------- Proveedores
export async function fetchProveedores(): Promise<Proveedor[]> {
  return cached('proveedores', async () => {
    const { data, error } = await supabase
      .from('proveedores')
      .select('*')
      .order('nombre')
    if (error) throw new Error(errMsg(error))
    return (data ?? []) as Proveedor[]
  })
}

export async function crearProveedor(input: {
  nombre: string
  contacto?: string
  metodo_pago_preferido?: string
}): Promise<string> {
  const { data, error } = await supabase
    .from('proveedores')
    .insert({
      nombre: input.nombre,
      contacto: input.contacto || null,
      metodo_pago_preferido: input.metodo_pago_preferido || null,
    })
    .select('id')
    .single()
  if (error) throw new Error(errMsg(error))
  invalidar('proveedores')
  return (data as { id: string }).id
}

export async function eliminarProveedor(id: string): Promise<void> {
  const { error } = await supabase.from('proveedores').delete().eq('id', id)
  if (error) throw new Error(errMsg(error))
  invalidar('proveedores', 'cuentas', 'vencimientos', 'resumen')
}

// ------------------------------------------------- Plataformas y planes
export async function fetchPlataformas(): Promise<Plataforma[]> {
  // Catálogo activo (para selects y venta)
  return cached('plataformas', async () => {
    const { data, error } = await supabase
      .from('plataformas')
      .select('*')
      .eq('activa', true)
      .order('nombre')
    if (error) throw new Error(errMsg(error))
    return (data ?? []) as Plataforma[]
  })
}

export async function fetchPlataformasTodas(): Promise<Plataforma[]> {
  return cached('plataformas_todas', async () => {
    const { data, error } = await supabase
      .from('plataformas')
      .select('*')
      .order('nombre')
    if (error) throw new Error(errMsg(error))
    return (data ?? []) as Plataforma[]
  })
}

export async function crearPlataforma(input: {
  nombre: string
  activa?: boolean
  aplica_comision?: boolean
}): Promise<string> {
  const { data, error } = await supabase
    .from('plataformas')
    .insert({
      nombre: input.nombre,
      activa: input.activa ?? true,
      aplica_comision: input.aplica_comision ?? false,
    })
    .select('id')
    .single()
  if (error) throw new Error(errMsg(error))
  invalidar('plataformas', 'plataformas_todas', 'planes')
  return (data as { id: string }).id
}

export async function actualizarPlataforma(
  id: string,
  input: { nombre: string; activa: boolean; aplica_comision: boolean },
): Promise<void> {
  const { error } = await supabase
    .from('plataformas')
    .update(input)
    .eq('id', id)
  if (error) throw new Error(errMsg(error))
  invalidar('plataformas', 'plataformas_todas', 'planes', 'resumen')
}

export async function eliminarPlataforma(id: string): Promise<void> {
  const { error } = await supabase.from('plataformas').delete().eq('id', id)
  if (error) throw new Error(errMsg(error))
  invalidar('plataformas', 'plataformas_todas', 'planes', 'susc', 'cuentas', 'vencimientos', 'resumen')
}

// --------------------------------------------------------------- Tienda pública
// Vista `v_catalogo_publico`: legible con la anon key (RLS → solo
// plataformas activas). La tienda vive en las rutas /tienda, /registro
// e /ingreso, fuera del panel administrativo.
export async function fetchCatalogoPublico(): Promise<CatalogoItem[]> {
  const { data, error } = await supabase
    .from('v_catalogo_publico')
    .select('*')
    .order('plataforma')
    .order('duracion_dias')
  if (error) throw new Error(errMsg(error))
  return (data ?? []) as CatalogoItem[]
}

export async function fetchPlanes(): Promise<PlanRow[]> {
  return cached('planes', async () => {
    const { data, error } = await supabase
      .from('planes')
      .select('*, plataformas(nombre)')
      .order('duracion_dias')
    if (error) throw new Error(errMsg(error))
    return (data ?? []) as PlanRow[]
  })
}

export async function crearPlan(input: {
  plataforma_id: string
  duracion_dias: number
  precio_venta_usd: number
}): Promise<string> {
  const { data, error } = await supabase
    .from('planes')
    .insert(input)
    .select('id')
    .single()
  if (error) throw new Error(errMsg(error))
  invalidar('planes', 'resumen')
  return (data as { id: string }).id
}

// ---------------------------------------------------------- Cuentas madre
export async function fetchCuentasMadre(): Promise<CuentaMadreRow[]> {
  return cached('cuentas', async () => {
    const { data, error } = await supabase
      .from('cuentas_madre')
      .select('*, proveedores(nombre), plataformas(nombre)')
      .order('fecha_corte_proveedor', { ascending: true, nullsFirst: true })
    if (error) throw new Error(errMsg(error))
    return (data ?? []) as CuentaMadreRow[]
  })
}

export async function crearCuentaMadre(input: {
  proveedor_id: string | null
  plataforma_id: string
  correo_cuenta: string
  cupos_totales: number
  costo_renovacion_usd: number
  fecha_corte_proveedor: string | null
}): Promise<string> {
  const { data, error } = await supabase
    .from('cuentas_madre')
    .insert({
      proveedor_id: input.proveedor_id ?? null,
      plataforma_id: input.plataforma_id,
      correo_cuenta: input.correo_cuenta,
      cupos_totales: input.cupos_totales,
      costo_renovacion_usd: input.costo_renovacion_usd,
      fecha_corte_proveedor: input.fecha_corte_proveedor || null,
    })
    .select('id')
    .single()
  if (error) throw new Error(errMsg(error))
  invalidar('cuentas', 'vencimientos', 'resumen')
  return (data as { id: string }).id
}

export async function cambiarEstadoCuenta(
  id: string,
  estado: CuentaMadre['estado'],
): Promise<void> {
  const { error } = await supabase
    .from('cuentas_madre')
    .update({ estado })
    .eq('id', id)
  if (error) throw new Error(errMsg(error))
  invalidar('cuentas', 'vencimientos', 'resumen')
}

// ----------------------------------------------------------- Suscripciones
export async function fetchSuscripciones(): Promise<SuscripcionRow[]> {
  return cached('susc', async () => {
    const { data, error } = await supabase
      .from('suscripciones')
      .select(
        '*, usuarios(nombre, email), planes(precio_venta_usd, duracion_dias, plataformas(nombre)), cuentas_madre(correo_cuenta, cupos_ocupados, cupos_totales)',
      )
      .order('fecha_corte_cliente')
      .limit(300)
    if (error) throw new Error(errMsg(error))
    return (data ?? []) as SuscripcionRow[]
  })
}

export async function crearSuscripcion(input: {
  cliente_id: string
  plan_id: string
  cuenta_madre_id: string
  fecha_inicio: string
  fecha_corte_cliente: string
  estado: 'activa' | 'vencida' | 'cancelada'
}): Promise<string> {
  const { data, error } = await supabase
    .from('suscripciones')
    .insert({
      cliente_id: input.cliente_id,
      plan_id: input.plan_id,
      cuenta_madre_id: input.cuenta_madre_id,
      fecha_inicio: input.fecha_inicio,
      fecha_corte_cliente: input.fecha_corte_cliente,
      estado: input.estado,
    })
    .select('id')
    .single()
  if (error) throw new Error(errMsg(error))
  invalidar('susc', 'cuentas', 'resumen')
  return (data as { id: string }).id
}

export async function cambiarEstadoSuscripcion(
  id: string,
  estado: SuscripcionRow['estado'],
): Promise<void> {
  const { error } = await supabase
    .from('suscripciones')
    .update({ estado })
    .eq('id', id)
  if (error) throw new Error(errMsg(error))
  invalidar('susc', 'cuentas', 'resumen')
}

// -------------------------------------------------------------- Comisiones
export async function fetchComisiones(): Promise<ComisionRow[]> {
  return cached('comisiones', async () => {
    const { data, error } = await supabase
      .from('comisiones')
      .select('*, usuarios(nombre)')
      .order('created_at', { ascending: false })
      .limit(200)
    if (error) throw new Error(errMsg(error))
    return (data ?? []) as ComisionRow[]
  })
}

export async function liquidarComision(id: string): Promise<void> {
  const { error } = await supabase
    .from('comisiones')
    .update({ estado: 'liquidada' })
    .eq('id', id)
  if (error) throw new Error(errMsg(error))
  invalidar('comisiones', 'resumen')
}

// ------------------------------------------------------------- Tasa BCV
export async function fetchTasaDelDia(): Promise<number | null> {
  return cached('tasa', async () => {
    const { data, error } = await supabase
      .from('tasas_cambio')
      .select('tasa_bcv')
      .order('fecha', { ascending: false })
      .limit(1)
    if (error) throw new Error(errMsg(error))
    const row = data?.[0] as { tasa_bcv?: number } | undefined
    return row?.tasa_bcv ?? null
  })
}

export type FuenteTasa = 'bcv-directo' | 'sistema' | 'ninguna'

/**
 * Tasa oficial del día directamente del sitio del BCV.
 * 1) Invoca la Edge Function `fetch-bcv` (scrape server-side de
 *    bcv.org.ve — el navegador NO puede leer el sitio por CORS).
 * 2) Si la función no está desplegada, cae a la última tasa
 *    almacenada en `tasas_cambio` (que también proviene del BCV).
 */
export async function fetchTasaBcv(): Promise<{ tasa: number | null; fuente: FuenteTasa }> {
  try {
    const res = await fetch(`${SUPABASE_URL}/functions/v1/fetch-bcv`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${SUPABASE_KEY}`,
        apikey: SUPABASE_KEY,
        'Content-Type': 'application/json',
      },
      body: '{}',
    })
    if (res.ok) {
      const data = (await res.json()) as { ok?: boolean; tasa_bcv?: number }
      const t = Number(data.tasa_bcv)
      if (data.ok && t > 0) {
        invalidar('tasa')
        return { tasa: t, fuente: 'bcv-directo' }
      }
    }
  } catch {
    // Edge Function no desplegada o sin conexión: se cae a la tasa almacenada.
  }
  const t = await fetchTasaDelDia()
  return t != null ? { tasa: t, fuente: 'sistema' } : { tasa: null, fuente: 'ninguna' }
}

// --------------------------------------------------------------- Pagos
export async function registrarPago(input: {
  cliente_id: string
  monto_pagado: number
  moneda: Moneda
  tasa_bcv_aplicada: number | null
  tasa_cambio_binance: number | null
  equivalente_usd: number
  metodo_pago: string
  asignados: Array<{ suscripcion_id: string; monto_usd: number }>
}): Promise<void> {
  // 1) Insertar el pago (ingreso)
  const { data, error } = await supabase
    .from('pagos_ingresos')
    .insert({
      cliente_id: input.cliente_id,
      monto_pagado: input.monto_pagado,
      moneda: input.moneda,
      tasa_bcv_aplicada: input.tasa_bcv_aplicada,
      tasa_cambio_binance: input.tasa_cambio_binance,
      equivalente_usd: input.equivalente_usd,
      metodo_pago: input.metodo_pago || null,
      fecha_pago: hoy(),
    })
    .select('id')
    .single()
  if (error) throw new Error(errMsg(error))

  const pagoId = (data as { id: string }).id

  // 2) Distribuir en suscripciones (trigger generará comisión si aplica)
  const rows = input.asignados.map((a) => ({
    pago_ingreso_id: pagoId,
    suscripcion_id: a.suscripcion_id,
    monto_asignado_usd: round2(a.monto_usd),
  }))
  if (rows.length > 0) {
    const { error: err2 } = await supabase.from('pago_suscripciones').insert(rows)
    if (err2) throw new Error(errMsg(err2))
  }
  invalidar('pagos', 'comisiones', 'resumen', 'tasa')
}

export async function fetchPagos(): Promise<PagoRow[]> {
  return cached('pagos', async () => {
    const { data, error } = await supabase
      .from('pagos_ingresos')
      .select('*, usuarios(nombre)')
      .order('fecha_pago', { ascending: false })
      .limit(100)
    if (error) throw new Error(errMsg(error))
    return (data ?? []) as PagoRow[]
  })
}

// ------------------------------------------------------------- Dashboard
export async function fetchVencimientosProveedores(): Promise<
  VencimientoProveedor[]
> {
  return cached('vencimientos', async () => {
    const { data, error } = await supabase
      .from('v_vencimientos_proveedores')
      .select('*')
      .order('dias_restantes')
    if (error) throw new Error(errMsg(error))
    return (data ?? []) as VencimientoProveedor[]
  })
}

export async function fetchResumen(): Promise<{
  clientes: number
  suscripcionesActivas: number
  suscripcionesVencidas: number
  comisionesPendientesUSD: number
  ingresosMesUSD: number
}> {
  return cached('resumen', async () => {
    const [clientes, activas, vencidas, comPend, ingresos] = await Promise.all([
      supabase
        .from('usuarios')
        .select('id', { count: 'exact', head: true })
        .eq('rol', 'cliente'),
      supabase
        .from('suscripciones')
        .select('id', { count: 'exact', head: true })
        .eq('estado', 'activa'),
      supabase
        .from('suscripciones')
        .select('id', { count: 'exact', head: true })
        .eq('estado', 'vencida'),
      supabase.from('comisiones').select('monto_comision_usd').eq('estado', 'pendiente'),
      supabase
        .from('pagos_ingresos')
        .select('equivalente_usd')
        .gte('fecha_pago', hoy().slice(0, 7) + '-01'),
    ])

    const sum = (rows: Array<{ equivalente_usd: number }>) =>
      rows.reduce((acc, r) => acc + Number(r.equivalente_usd ?? 0), 0)
    const sumCom = (rows: Array<{ monto_comision_usd: number }>) =>
      rows.reduce((acc, r) => acc + Number(r.monto_comision_usd ?? 0), 0)

    if (clientes.error || activas.error || vencidas.error || comPend.error || ingresos.error)
      throw new Error('No se pudo consultar el resumen')

    return {
      clientes: clientes.count ?? 0,
      suscripcionesActivas: activas.count ?? 0,
      suscripcionesVencidas: vencidas.count ?? 0,
      comisionesPendientesUSD: round2(
        sumCom((comPend.data ?? []) as Array<{ monto_comision_usd: number }>),
      ),
      ingresosMesUSD: round2(
        sum((ingresos.data ?? []) as Array<{ equivalente_usd: number }>),
      ),
    }
  })
}