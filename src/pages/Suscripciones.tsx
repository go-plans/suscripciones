import { useCallback, useEffect, useState } from 'react'
import {
  cambiarEstadoSuscripcion,
  crearSuscripcion,
  fetchClientes,
  fetchCuentasMadre,
  fetchPlanes,
  fetchPlataformas,
  fetchSuscripciones,
} from '../lib/api'
import type { CuentaMadreRow, Plan, Plataforma, SuscripcionRow, Usuario } from '../lib/types'
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
  cliente_id: '',
  plan_id: '',
  cuenta_madre_id: '',
  fecha_corte_cliente: '',
}

export default function Suscripciones() {
  const [susc, setSusc] = useState<SuscripcionRow[]>([])
  const [clientes, setClientes] = useState<Usuario[]>([])
  const [planes, setPlanes] = useState<Plan[]>([])
  const [plataformas, setPlataformas] = useState<Plataforma[]>([])
  const [cuentas, setCuentas] = useState<CuentaMadreRow[]>([])
  const [error, setError] = useState('')
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState(vacio)

  const cargar = useCallback(async () => {
    try {
      const [s, c, p, cm, pf] = await Promise.all([
        fetchSuscripciones(),
        fetchClientes(),
        fetchPlanes(),
        fetchCuentasMadre(),
        fetchPlataformas(),
      ])
      setSusc(s)
      setClientes(c)
      setPlanes(p)
      setCuentas(cm)
      setPlataformas(pf)
      setError('')
    } catch (e) {
      setError((e as Error).message)
    }
  }, [])

  useEffect(() => {
    void cargar()
  }, [cargar])

  const cuentasDisponibles = cuentas.filter(
    (cm) => cm.estado === 'activa' && cm.cupos_ocupados < cm.cupos_totales,
  )

  const guardar = async () => {
    try {
      await crearSuscripcion({
        cliente_id: form.cliente_id,
        plan_id: form.plan_id,
        cuenta_madre_id: form.cuenta_madre_id,
        fecha_corte_cliente: form.fecha_corte_cliente,
      })
      setModal(false)
      setForm({ ...vacio, fecha_corte_cliente: hoy() })
      await cargar()
    } catch (e) {
      setError((e as Error).message)
    }
  }

  const cambiarEstado = async (s: SuscripcionRow, estado: 'activa' | 'cancelada' | 'vencida') => {
    try {
      await cambiarEstadoSuscripcion(s.id, estado)
      await cargar()
    } catch (e) {
      setError((e as Error).message)
    }
  }

  const planLabel = (p: Plan) => {
    const pf = plataformas.find((x) => x.id === p.plataforma_id)
    return `${pf?.nombre ?? ''} — ${p.duracion_dias}d — ${fmtUSD(p.precio_venta_usd)}`
  }

  if (error) return <ErrorMsg message={error} />

  return (
    <div className="space-y-5">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Suscripciones</h1>
          <p className="text-sm text-slate-500">Contratos individuales por cliente</p>
        </div>
        <Button onClick={() => { setForm({ ...vacio, fecha_corte_cliente: hoy() }); setModal(true) }}>
          + Nueva suscripción
        </Button>
      </header>

      {susc.length === 0 ? (
        <Loading />
      ) : (
        <Table
          headers={['Cliente', 'Plan', 'Cuenta madre', 'Inicio', 'Corte', 'Estado', 'Acciones']}
        >
          {susc.map((s) => (
            <tr key={s.id}>
              <Td className="font-medium">{s.usuarios?.nombre ?? '—'}</Td>
              <Td>
                {s.planes?.plataformas?.nombre ?? '—'} · {s.planes?.duracion_dias ?? '—'}d ·{' '}
                {fmtUSD(s.planes?.precio_venta_usd ?? 0)}
              </Td>
              <Td className="font-mono text-xs">{s.cuentas_madre?.correo_cuenta ?? '—'}</Td>
              <Td>{fmtDate(s.fecha_inicio)}</Td>
              <Td>{fmtDate(s.fecha_corte_cliente)}</Td>
              <Td>
                <Badge value={s.estado} />
              </Td>
              <Td>
                <div className="flex gap-2">
                  {s.estado === 'activa' ? (
                    <Button variant="secondary" onClick={() => void cambiarEstado(s, 'cancelada')}>
                      Cancelar
                    </Button>
                  ) : null}
                  {s.estado === 'vencida' ? (
                    <Button variant="secondary" onClick={() => void cambiarEstado(s, 'activa')}>
                      Reactivar
                    </Button>
                  ) : null}
                </div>
              </Td>
            </tr>
          ))}
        </Table>
      )}

      <Modal open={modal} title="Nueva suscripción" onClose={() => setModal(false)}>
        <div className="space-y-3">
          <Field label="Cliente *">
            <Select
              value={form.cliente_id}
              onChange={(e) => setForm({ ...form, cliente_id: e.target.value })}
            >
              <option value="">Selecciona…</option>
              {clientes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Plan *">
            <Select
              value={form.plan_id}
              onChange={(e) => setForm({ ...form, plan_id: e.target.value })}
            >
              <option value="">Selecciona…</option>
              {planes.map((p) => (
                <option key={p.id} value={p.id}>
                  {planLabel(p)}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Cuenta madre *">
            <Select
              value={form.cuenta_madre_id}
              onChange={(e) => setForm({ ...form, cuenta_madre_id: e.target.value })}
            >
              <option value="">Selecciona…</option>
              {cuentasDisponibles.map((cm) => (
                <option key={cm.id} value={cm.id}>
                  {cm.correo_cuenta} ({cm.cupos_ocupados}/{cm.cupos_totales} ·{' '}
                  {cm.plataformas?.nombre ?? '?'})
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Fecha de corte (cliente) *">
            <Input
              type="date"
              value={form.fecha_corte_cliente}
              onChange={(e) => setForm({ ...form, fecha_corte_cliente: e.target.value })}
            />
          </Field>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setModal(false)}>
              Cancelar
            </Button>
            <Button
              onClick={() => void guardar()}
              disabled={
                !form.cliente_id || !form.plan_id || !form.cuenta_madre_id || !form.fecha_corte_cliente
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