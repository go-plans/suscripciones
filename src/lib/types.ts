// Tipos que reflejan el esquema de Supabase (docs/02-base-de-datos.md)

export type Rol = 'admin' | 'agente' | 'cliente'

export interface Usuario {
  id: string
  rol: Rol
  nombre: string
  email: string | null
  telefono: string | null
  referido_por: string | null
  created_at: string
}

export interface Plataforma {
  id: string
  nombre: string
  logo_url: string | null
  activa: boolean
  aplica_comision: boolean
  created_at: string
}

export interface Plan {
  id: string
  plataforma_id: string
  duracion_dias: number
  precio_venta_usd: number
  precio_referencia_usd: number | null
}

export interface PlanRow extends Plan {
  plataformas?: { nombre?: string } | null
}

// Fila de la vista pública v_catalogo_publico (venta en la tienda)
export interface CatalogoItem {
  plataforma: string
  logo_url: string | null
  duracion_dias: number
  precio_venta_usd: number
  precio_referencia_usd: number | null
}

export type TipoPedido = 'plan' | 'giftcard'

export type EstadoPedido = 'nuevo' | 'contactado' | 'completado' | 'cancelado'

// Pedido de la tienda (tabla `pedidos`): gift cards y planes solicitados
// por clientes registrados; se gestionan en el panel admin.
export interface Pedido {
  id: string
  tipo: TipoPedido
  plataforma: string
  duracion_dias: number | null
  precio_usd: number | null
  valor_giftcard_usd: number | null
  precio_giftcard_eur: number | null
  diseno_giftcard: string | null
  cliente_id: string | null
  cliente_nombre: string | null
  cliente_contacto: string | null
  estado: EstadoPedido
  created_at: string
  // Cobro cotizado en el checkout (v0.5.0)
  metodo_pago: string | null
  moneda_cobro: string | null
  monto_cobro: number | null
}

export interface Proveedor {
  id: string
  nombre: string
  contacto: string | null
  metodo_pago_preferido: string | null
}

export type EstadoCuenta = 'activa' | 'suspendida' | 'baja'

export interface CuentaMadre {
  id: string
  proveedor_id: string | null
  plataforma_id: string
  correo_cuenta: string
  cupos_totales: number
  cupos_ocupados: number
  costo_renovacion_usd: number
  fecha_corte_proveedor: string | null
  estado: EstadoCuenta
}

export interface CuentaMadreRow extends CuentaMadre {
  proveedores?: { nombre?: string } | null
  plataformas?: { nombre?: string } | null
}

export type EstadoSuscripcion = 'activa' | 'vencida' | 'cancelada'

export interface Suscripcion {
  id: string
  cliente_id: string
  plan_id: string
  cuenta_madre_id: string
  fecha_inicio: string
  fecha_corte_cliente: string
  estado: EstadoSuscripcion
}

export interface SuscripcionRow extends Suscripcion {
  usuarios?: { nombre?: string; email?: string | null } | null
  planes?: PlanRow | null
  cuentas_madre?: {
    correo_cuenta?: string
    cupos_ocupados?: number
    cupos_totales?: number
    plataformas?: { nombre?: string } | null
  } | null
}

export type EstadoComision = 'pendiente' | 'liquidada'

export interface Comision {
  id: string
  agente_id: string
  pago_id: string
  monto_comision_usd: number
  estado: EstadoComision
  created_at: string
}

export interface ComisionRow extends Comision {
  usuarios?: { nombre?: string } | null
}

export interface TasaCambio {
  id: string
  fecha: string
  tasa_bcv: number
}

export type Moneda = 'USD' | 'BS' | 'USDT'

export interface PagoIngreso {
  id: string
  cliente_id: string
  monto_pagado: number
  moneda: Moneda
  tasa_bcv_aplicada: number | null
  tasa_cambio_binance: number | null
  equivalente_usd: number
  metodo_pago: string | null
  fecha_pago: string
}

export interface PagoRow extends PagoIngreso {
  usuarios?: { nombre?: string } | null
}

export interface PagoSuscripcion {
  id: string
  pago_ingreso_id: string
  suscripcion_id: string
  monto_asignado_usd: number
}

export interface VencimientoProveedor {
  id: string
  proveedor: string
  plataforma: string
  correo_cuenta: string
  cupos_ocupados: number
  cupos_totales: number
  costo_renovacion_usd: number
  fecha_corte_proveedor: string
  dias_restantes: number
}