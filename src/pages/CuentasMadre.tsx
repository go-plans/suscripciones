import { useCallback, useEffect, useState } from 'react'
import {
  cambiarEstadoCuenta,
  crearCuentaMadre,
  fetchCuentasMadre,
  fetchPlataformas,
  fetchProveedores,
} from '../lib/api'
import type { CuentaMadreRow } from '../lib/types'
import { fmtDate, fmtUSD, hoy } from '../lib/format'
import {
  Badge,
  Button,
  ErrorMsg,
  Field,
  Input,
  Loading,
  Modal,
  Select,
  Table,
  Td,
} from '../components/ui'

const vacio = {
  proveedor_id: '',
  plataforma_id: '',
  correo_cuenta: '',
  cupos_totales: '4',
  costo_renovacion_usd: '',
  fecha_corte_proveedor: hoy(),
}

export default function CuentasMadre() {
  const [cuentas, setCuentas] = useState<CuentaMadreRow[]>([])
  const [plataformas, setPlataformas] = useState<Array<{ id: string; nombre: string }>>([])
  const [proveedores, setProveedores] = useState<Array<{ id: string; nombre: string }>>([])
  const [error, setError] = useState('')
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState(vacio)

  const cargar = useCallback(async () => {
    try {
      const [c, p, pr] = await Promise.all([
        fetchCuentasMadre(),
        fetchPlataformas(),
        fetchProveedores(),
      ])
      setCuentas(c)
      setPlataformas(p)
      setProveedores(pr)
      setError('')
    } catch (e) {
      setError((e as Error).message)
    }
  }, [])

  useEffect(() => {
    void cargar()
  }, [cargar])

  const guardar = async () => {
    try {
      await crearCuentaMadre({
        proveedor_id: form.proveedor_id,
        plataforma_id: form.plataforma_id,
        correo_cuenta: form.correo_cuenta,
        cupos_totales: Number(form.cupos_totales),
        costo_renovacion_usd: Number(form.costo_renovacion_usd),
        fecha_corte_proveedor: form.fecha_corte_proveedor,
      })
      setModal(false)
      setForm(vacio)
      await cargar()
    } catch (e) {
      setError((e as Error).message)
    }
  }

  const cambiarEstado = async (c: CuentaMadreRow) => {
    const nuevo = c.estado === 'activa' ? 'suspendida' : 'activa'
    try {
      await cambiarEstadoCuenta(c.id, nuevo)
      await cargar()
    } catch (e) {
      setError((e as Error).message)
    }
  }

  if (error) return <ErrorMsg message={error} />

  return (
    <div className="space-y-5">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Cuentas madre</h1>
          <p className="text-sm text-slate-500">Inventario comprado a proveedores</p>
        </div>
        <Button onClick={() => setModal(true)}>+ Nueva cuenta madre</Button>
      </header>

      {cuentas.length === 0 ? (
        <Loading />
      ) : (
        <Table
          headers={['Correo', 'Proveedor', 'Plataforma', 'Cupos', 'Costo', 'Fecha corte', 'Estado', '']}
        >
          {cuentas.map((c) => (
            <tr key={c.id}>
              <Td className="font-mono text-xs font-medium">{c.correo_cuenta}</Td>
              <Td>{c.proveedores?.nombre ?? '—'}</Td>
              <Td>{c.plataformas?.nombre ?? '—'}</Td>
              <Td>
                {c.cupos_ocupados}/{c.cupos_totales}
              </Td>
              <Td>{fmtUSD(c.costo_renovacion_usd)}</Td>
              <Td>{fmtDate(c.fecha_corte_proveedor)}</Td>
              <Td>
                <Badge value={c.estado} />
              </Td>
              <Td>
                <Button variant="secondary" onClick={() => void cambiarEstado(c)}>
                  {c.estado === 'activa' ? 'Suspender' : 'Activar'}
                </Button>
              </Td>
            </tr>
          ))}
        </Table>
      )}

      <Modal open={modal} title="Nueva cuenta madre" onClose={() => setModal(false)}>
        <div className="space-y-3">
          <Field label="Proveedor *">
            <Select
              value={form.proveedor_id}
              onChange={(e) => setForm({ ...form, proveedor_id: e.target.value })}
            >
              <option value="">Selecciona…</option>
              {proveedores.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nombre}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Plataforma *">
            <Select
              value={form.plataforma_id}
              onChange={(e) => setForm({ ...form, plataforma_id: e.target.value })}
            >
              <option value="">Selecciona…</option>
              {plataformas.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nombre}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Correo de la cuenta *">
            <Input
              value={form.correo_cuenta}
              onChange={(e) => setForm({ ...form, correo_cuenta: e.target.value })}
              placeholder="cuenta@proveedor.com"
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Cupos totales *">
              <Input
                type="number"
                min={1}
                value={form.cupos_totales}
                onChange={(e) => setForm({ ...form, cupos_totales: e.target.value })}
              />
            </Field>
            <Field label="Costo renovación (USD) *">
              <Input
                type="number"
                step="0.01"
                min={0}
                value={form.costo_renovacion_usd}
                onChange={(e) => setForm({ ...form, costo_renovacion_usd: e.target.value })}
              />
            </Field>
          </div>
          <Field label="Fecha corte al proveedor *">
            <Input
              type="date"
              value={form.fecha_corte_proveedor}
              onChange={(e) => setForm({ ...form, fecha_corte_proveedor: e.target.value })}
            />
          </Field>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setModal(false)}>
              Cancelar
            </Button>
            <Button
              onClick={() => void guardar()}
              disabled={
                !form.proveedor_id ||
                !form.plataforma_id ||
                !form.correo_cuenta.trim() ||
                !form.costo_renovacion_usd
              }
            >
              Guardar
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}