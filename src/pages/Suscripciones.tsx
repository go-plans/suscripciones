import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  cambiarEstadoSuscripcion,
  crearSuscripcion,
  fetchClientes,
  fetchCuentasMadre,
  fetchPlanes,
  fetchSuscripciones,
} from '../lib/api'
import type { CuentaMadreRow, PlanRow, SuscripcionRow, Usuario } from '../lib/types'
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
import { NuevoCliente, NuevaCuenta, NuevoPlan } from '../components/inline'
import { IconSearch } from '../components/icons'

const vacio = {
  cliente_id: '',
  plan_id: '',
  cuenta_madre_id: '',
  fecha_inicio: hoy(),
  fecha_corte_cliente: hoy(),
  estado: 'activa' as 'activa' | 'vencida' | 'cancelada',
}

type FormState = typeof vacio

export default function Suscripciones() {
  const [susc, setSusc] = useState<SuscripcionRow[]>([])
  const [clientes, setClientes] = useState<Usuario[]>([])
  const [planes, setPlanes] = useState<PlanRow[]>([])
  const [cuentas, setCuentas] = useState<CuentaMadreRow[]>([])
  const [busqueda, setBusqueda] = useState('')
  const [error, setError] = useState('')
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState<FormState>(vacio)

  const cargar = useCallback(async () => {
    try {
      const [s, c, p, cm] = await Promise.all([
        fetchSuscripciones(),
        fetchClientes(),
        fetchPlanes(),
        fetchCuentasMadre(),
      ])
      setSusc(s)
      setClientes(c)
      setPlanes(p)
      setCuentas(cm)
      setError('')
    } catch (e) {
      setError((e as Error).message)
    }
  }, [])

  useEffect(() => {
    void cargar()
  }, [cargar])

  // Tras crear una entidad inline: recargar listas y seleccionarla en el formulario
  const cargarY = async (actualizar: (f: FormState) => FormState) => {
    await cargar()
    setForm((f) => actualizar(f))
  }

  const cuentasDisponibles = cuentas.filter(
    (cm) => cm.estado === 'activa' && cm.cupos_ocupados < cm.cupos_totales,
  )

  const filtradas = useMemo(() => {
    const q = busqueda.trim().toLowerCase()
    if (!q) return susc
    return susc.filter((s) =>
      [
        s.usuarios?.nombre,
        s.planes?.plataformas?.nombre,
        s.cuentas_madre?.correo_cuenta,
      ]
        .filter(Boolean)
        .some((v) => v!.toLowerCase().includes(q)),
    )
  }, [susc, busqueda])

  const guardar = async () => {
    try {
      await crearSuscripcion({
        cliente_id: form.cliente_id,
        plan_id: form.plan_id,
        cuenta_madre_id: form.cuenta_madre_id,
        fecha_inicio: form.fecha_inicio,
        fecha_corte_cliente: form.fecha_corte_cliente,
        estado: form.estado,
      })
      setModal(false)
      setForm({ ...vacio })
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

  if (error) return <ErrorMsg message={error} />

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Suscripciones</h1>
          <p className="text-sm text-slate-500">
            Contratos por cliente · también sirve para registrar suscripciones vendidas antes
            del sistema
          </p>
        </div>
        <Button onClick={() => { setForm({ ...vacio }); setModal(true) }}>
          + Nueva suscripción
        </Button>
      </header>

      <div className="relative max-w-sm">
        <IconSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <Input
          className="pl-9"
          placeholder="Buscar por cliente, plataforma o cuenta…"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
        />
      </div>

      <p className="text-xs text-slate-400">
        Mostrando {filtradas.length} de {susc.length} suscripciones.
      </p>

      {susc.length === 0 ? (
        <Loading />
      ) : (
        <Table
          headers={['Cliente', 'Plan', 'Cuenta madre', 'Inicio', 'Corte', 'Estado', 'Acciones']}
        >
          {filtradas.map((s) => (
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
                <div className="flex flex-wrap gap-2">
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
            <NuevoCliente onCreated={(id) => void cargarY((f) => ({ ...f, cliente_id: id }))} />
          </Field>
          <Field label="Plan *">
            <Select
              value={form.plan_id}
              onChange={(e) => setForm({ ...form, plan_id: e.target.value })}
            >
              <option value="">Selecciona…</option>
              {planes.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.plataformas?.nombre ?? '?'} — {p.duracion_dias}d — {fmtUSD(p.precio_venta_usd)}
                </option>
              ))}
            </Select>
            <NuevoPlan onCreated={(id) => void cargarY((f) => ({ ...f, plan_id: id }))} />
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
            <NuevaCuenta onCreated={(id) => void cargarY((f) => ({ ...f, cuenta_madre_id: id }))} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Fecha de inicio *">
              <Input
                type="date"
                value={form.fecha_inicio}
                onChange={(e) => setForm({ ...form, fecha_inicio: e.target.value })}
              />
            </Field>
            <Field label="Fecha de corte (cliente) *">
              <Input
                type="date"
                value={form.fecha_corte_cliente}
                onChange={(e) => setForm({ ...form, fecha_corte_cliente: e.target.value })}
              />
            </Field>
          </div>
          <Field label="Estado *">
            <Select
              value={form.estado}
              onChange={(e) =>
                setForm({ ...form, estado: e.target.value as FormState['estado'] })
              }
            >
              <option value="activa">Activa</option>
              <option value="vencida">Vencida</option>
              <option value="cancelada">Cancelada</option>
            </Select>
          </Field>
          <p className="text-xs text-slate-400">
            Para suscripciones vendidas antes del sistema: escribe la fecha real de inicio y el
            estado actual.
          </p>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setModal(false)}>
              Cancelar
            </Button>
            <Button
              onClick={() => void guardar()}
              disabled={
                !form.cliente_id ||
                !form.plan_id ||
                !form.cuenta_madre_id ||
                !form.fecha_inicio ||
                !form.fecha_corte_cliente
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