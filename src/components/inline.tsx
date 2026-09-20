// Registro inline: crear entidades desde cualquier formulario sin salir de la pestaña
import { useState } from 'react'
import {
  crearCliente,
  crearCuentaMadre,
  crearPlan,
  crearPlataforma,
  crearProveedor,
  fetchAgentes,
  fetchPlataformas,
  fetchProveedores,
} from '../lib/api'
import type { Plataforma, Proveedor, Usuario } from '../lib/types'
import { Button, ErrorMsg, Field, Input, Modal, Select } from './ui'
import { IconPlus } from './icons'

const enlace = 'mt-1.5 inline-flex items-center gap-1 text-xs font-medium text-indigo-600 hover:text-indigo-800'

// ------------------------------------------------------------- Nuevo cliente
export function NuevoCliente({ onCreated }: { onCreated: (id: string) => void }) {
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({ nombre: '', email: '', telefono: '', referido_por: '' })
  const [agentes, setAgentes] = useState<Usuario[]>([])
  const [err, setErr] = useState('')

  const abrir = async () => {
    setErr('')
    setAgentes(await fetchAgentes().catch(() => []))
    setOpen(true)
  }

  const guardar = async () => {
    try {
      const id = await crearCliente(form)
      setOpen(false)
      setForm({ nombre: '', email: '', telefono: '', referido_por: '' })
      onCreated(id)
    } catch (e) {
      setErr((e as Error).message)
    }
  }

  return (
    <>
      <button type="button" className={enlace} onClick={() => void abrir()}>
        <IconPlus width={13} height={13} /> Registrar nuevo cliente
      </button>
      <Modal open={open} title="Registrar cliente" onClose={() => setOpen(false)}>
        <div className="space-y-3">
          {err ? <ErrorMsg message={err} /> : null}
          <Field label="Nombre *">
            <Input value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} />
          </Field>
          <Field label="Email">
            <Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </Field>
          <Field label="Teléfono">
            <Input value={form.telefono} onChange={(e) => setForm({ ...form, telefono: e.target.value })} />
          </Field>
          <Field label="Referido por (agente)">
            <Select
              value={form.referido_por}
              onChange={(e) => setForm({ ...form, referido_por: e.target.value })}
            >
              <option value="">Sin referido</option>
              {agentes.map((a) => (
                <option key={a.id} value={a.id}>{a.nombre}</option>
              ))}
            </Select>
          </Field>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={() => void guardar()} disabled={!form.nombre.trim()}>Crear y seleccionar</Button>
          </div>
        </div>
      </Modal>
    </>
  )
}

// --------------------------------------------------------------- Nuevo plan
export function NuevoPlan({ onCreated }: { onCreated: (id: string) => void }) {
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({ plataforma_id: '', duracion_dias: '30', precio: '' })
  const [plataformas, setPlataformas] = useState<Plataforma[]>([])
  const [err, setErr] = useState('')

  const abrir = async () => {
    setErr('')
    setPlataformas(await fetchPlataformas().catch(() => []))
    setOpen(true)
  }

  const guardar = async () => {
    try {
      const id = await crearPlan({
        plataforma_id: form.plataforma_id,
        duracion_dias: Number(form.duracion_dias),
        precio_venta_usd: Number(form.precio),
      })
      setOpen(false)
      setForm({ plataforma_id: '', duracion_dias: '30', precio: '' })
      onCreated(id)
    } catch (e) {
      setErr((e as Error).message)
    }
  }

  return (
    <>
      <button type="button" className={enlace} onClick={() => void abrir()}>
        <IconPlus width={13} height={13} /> Registrar nuevo plan
      </button>
      <Modal open={open} title="Registrar plan" onClose={() => setOpen(false)}>
        <div className="space-y-3">
          {err ? <ErrorMsg message={err} /> : null}
          <Field label="Plataforma *">
            <Select
              value={form.plataforma_id}
              onChange={(e) => setForm({ ...form, plataforma_id: e.target.value })}
            >
              <option value="">Selecciona…</option>
              {plataformas.map((p) => (
                <option key={p.id} value={p.id}>{p.nombre}</option>
              ))}
            </Select>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Duración (días) *">
              <Input
                type="number" min={1}
                value={form.duracion_dias}
                onChange={(e) => setForm({ ...form, duracion_dias: e.target.value })}
              />
            </Field>
            <Field label="Precio venta (USD) *">
              <Input
                type="number" min={0} step="0.01"
                value={form.precio}
                onChange={(e) => setForm({ ...form, precio: e.target.value })}
              />
            </Field>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button
              onClick={() => void guardar()}
              disabled={!form.plataforma_id || !form.precio}
            >
              Crear y seleccionar
            </Button>
          </div>
        </div>
      </Modal>
    </>
  )
}

// ---------------------------------------------------------- Nueva cuenta madre
export function NuevaCuenta({ onCreated }: { onCreated: (id: string) => void }) {
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({
    correo_cuenta: '',
    plataforma_id: '',
    proveedor_id: '',
    cupos_totales: '4',
    costo_renovacion_usd: '',
    fecha_corte_proveedor: '',
  })
  const [plataformas, setPlataformas] = useState<Plataforma[]>([])
  const [proveedores, setProveedores] = useState<Proveedor[]>([])
  const [err, setErr] = useState('')

  const abrir = async () => {
    setErr('')
    const [pf, pr] = await Promise.all([
      fetchPlataformas().catch(() => []),
      fetchProveedores().catch(() => []),
    ])
    setPlataformas(pf)
    setProveedores(pr)
    setOpen(true)
  }

  const guardar = async () => {
    try {
      const id = await crearCuentaMadre({
        proveedor_id: form.proveedor_id || null,
        plataforma_id: form.plataforma_id,
        correo_cuenta: form.correo_cuenta,
        cupos_totales: Number(form.cupos_totales),
        costo_renovacion_usd: Number(form.costo_renovacion_usd),
        fecha_corte_proveedor: form.fecha_corte_proveedor || null,
      })
      setOpen(false)
      onCreated(id)
    } catch (e) {
      setErr((e as Error).message)
    }
  }

  return (
    <>
      <button type="button" className={enlace} onClick={() => void abrir()}>
        <IconPlus width={13} height={13} /> Registrar nueva cuenta madre
      </button>
      <Modal open={open} title="Registrar cuenta madre" onClose={() => setOpen(false)}>
        <div className="space-y-3">
          {err ? <ErrorMsg message={err} /> : null}
          <Field label="Correo de la cuenta *">
            <Input
              value={form.correo_cuenta}
              onChange={(e) => setForm({ ...form, correo_cuenta: e.target.value })}
            />
          </Field>
          <Field label="Plataforma *">
            <Select
              value={form.plataforma_id}
              onChange={(e) => setForm({ ...form, plataforma_id: e.target.value })}
            >
              <option value="">Selecciona…</option>
              {plataformas.map((p) => (
                <option key={p.id} value={p.id}>{p.nombre}</option>
              ))}
            </Select>
          </Field>
          <Field label="Proveedor">
            <Select
              value={form.proveedor_id}
              onChange={(e) => setForm({ ...form, proveedor_id: e.target.value })}
            >
              <option value="">Directo (sin proveedor)</option>
              {proveedores.map((pr) => (
                <option key={pr.id} value={pr.id}>{pr.nombre}</option>
              ))}
            </Select>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Cupos totales *">
              <Input
                type="number" min={1}
                value={form.cupos_totales}
                onChange={(e) => setForm({ ...form, cupos_totales: e.target.value })}
              />
            </Field>
            <Field label="Costo renov. (USD) *">
              <Input
                type="number" min={0} step="0.01"
                value={form.costo_renovacion_usd}
                onChange={(e) => setForm({ ...form, costo_renovacion_usd: e.target.value })}
              />
            </Field>
          </div>
          <Field label="Fecha corte al proveedor (vacío = cuenta eterna)">
            <Input
              type="date"
              value={form.fecha_corte_proveedor}
              onChange={(e) => setForm({ ...form, fecha_corte_proveedor: e.target.value })}
            />
          </Field>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button
              onClick={() => void guardar()}
              disabled={!form.correo_cuenta || !form.plataforma_id || !form.costo_renovacion_usd}
            >
              Crear y seleccionar
            </Button>
          </div>
        </div>
      </Modal>
    </>
  )
}

// ----------------------------------------------------------- Nuevo proveedor
export function NuevoProveedor({ onCreated }: { onCreated: (id: string) => void }) {
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({ nombre: '', contacto: '', metodo_pago_preferido: '' })
  const [err, setErr] = useState('')

  const guardar = async () => {
    try {
      const id = await crearProveedor(form)
      setOpen(false)
      setForm({ nombre: '', contacto: '', metodo_pago_preferido: '' })
      onCreated(id)
    } catch (e) {
      setErr((e as Error).message)
    }
  }

  return (
    <>
      <button type="button" className={enlace} onClick={() => { setErr(''); setOpen(true) }}>
        <IconPlus width={13} height={13} /> Registrar nuevo proveedor
      </button>
      <Modal open={open} title="Registrar proveedor" onClose={() => setOpen(false)}>
        <div className="space-y-3">
          {err ? <ErrorMsg message={err} /> : null}
          <Field label="Nombre *">
            <Input value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} />
          </Field>
          <Field label="Contacto">
            <Input value={form.contacto} onChange={(e) => setForm({ ...form, contacto: e.target.value })} />
          </Field>
          <Field label="Método de pago preferido">
            <Input
              value={form.metodo_pago_preferido}
              onChange={(e) => setForm({ ...form, metodo_pago_preferido: e.target.value })}
            />
          </Field>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={() => void guardar()} disabled={!form.nombre.trim()}>
              Crear y seleccionar
            </Button>
          </div>
        </div>
      </Modal>
    </>
  )
}

// ---------------------------------------------------------- Nueva plataforma
export function NuevaPlataforma({ onCreated }: { onCreated: (id: string) => void }) {
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({ nombre: '', aplica_comision: false })
  const [err, setErr] = useState('')

  const guardar = async () => {
    try {
      const id = await crearPlataforma({ nombre: form.nombre, aplica_comision: form.aplica_comision })
      setOpen(false)
      setForm({ nombre: '', aplica_comision: false })
      onCreated(id)
    } catch (e) {
      setErr((e as Error).message)
    }
  }

  return (
    <>
      <button type="button" className={enlace} onClick={() => { setErr(''); setOpen(true) }}>
        <IconPlus width={13} height={13} /> Registrar nueva plataforma
      </button>
      <Modal open={open} title="Registrar plataforma" onClose={() => setOpen(false)}>
        <div className="space-y-3">
          {err ? <ErrorMsg message={err} /> : null}
          <Field label="Nombre *">
            <Input value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} />
          </Field>
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              className="h-4 w-4 accent-indigo-600"
              checked={form.aplica_comision}
              onChange={(e) => setForm({ ...form, aplica_comision: e.target.checked })}
            />
            Genera comisión de referido (30%)
          </label>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={() => void guardar()} disabled={!form.nombre.trim()}>
              Crear y seleccionar
            </Button>
          </div>
        </div>
      </Modal>
    </>
  )
}