import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  fetchClientes,
  fetchPagos,
  fetchSuscripciones,
  fetchTasaDelDia,
  registrarPago,
} from '../lib/api'
import type { Moneda, PagoRow, SuscripcionRow, Usuario } from '../lib/types'
import { fmtBS, fmtDate, fmtUSD, round2 } from '../lib/format'
import {
  Button,
  Card,
  ErrorMsg,
  Field,
  Input,
  Loading,
  Select,
  Table,
  Td,
} from '../components/ui'

const METODOS_PAGO = [
  'Zelle',
  'Pago Movil',
  'Pago Movil Binance',
  'Efectivo',
  'Transferencia',
  'Otro',
]

interface Asignacion {
  checked: boolean
  monto: string
}

const estadoInicial = {
  cliente_id: '',
  monto: '',
  moneda: 'USD' as Moneda,
  tasa: '',
  metodo_pago: '',
}

export default function Pagos() {
  const [clientes, setClientes] = useState<Usuario[]>([])
  const [susc, setSusc] = useState<SuscripcionRow[]>([])
  const [pagos, setPagos] = useState<PagoRow[]>([])
  const [error, setError] = useState('')
  const [exito, setExito] = useState('')
  const [form, setForm] = useState(estadoInicial)
  const [asign, setAsign] = useState<Record<string, Asignacion>>({})

  const cargar = useCallback(async () => {
    try {
      const [c, s, p, t] = await Promise.all([
        fetchClientes(),
        fetchSuscripciones(),
        fetchPagos(),
        fetchTasaDelDia(),
      ])
      setClientes(c)
      setSusc(s)
      setPagos(p)
      setError('')
      if (t != null) setForm((f) => (f.tasa === '' ? { ...f, tasa: String(t) } : f))
    } catch (e) {
      setError((e as Error).message)
    }
  }, [])

  useEffect(() => {
    void cargar()
  }, [cargar])

  const activasDelCliente = useMemo(
    () => susc.filter((s) => s.cliente_id === form.cliente_id && s.estado === 'activa'),
    [susc, form.cliente_id],
  )

  // Prellenar asignación cuando cambia el cliente
  useEffect(() => {
    const next: Record<string, Asignacion> = {}
    for (const s of activasDelCliente) {
      next[s.id] = {
        checked: true,
        monto: String(s.planes?.precio_venta_usd ?? 0),
      }
    }
    setAsign(next)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.cliente_id, susc])

  const montoNum = useMemo(() => Number(form.monto) || 0, [form.monto])
  const tasaNum = useMemo(() => Number(form.tasa) || 0, [form.tasa])

  // Equivalente en USD según la moneda recibida (calculadora BCV)
  const equivalente = useMemo(() => {
    if (form.moneda === 'BS') return tasaNum > 0 ? round2(montoNum / tasaNum) : 0
    // USD y USDT se tratan 1:1 con el dólar
    return round2(montoNum)
  }, [form.moneda, montoNum, tasaNum])

  const totalAsignado = useMemo(
    () =>
      round2(
        Object.values(asign).reduce(
          (acc, a) => acc + (a.checked ? Number(a.monto) || 0 : 0),
          0,
        ),
      ),
    [asign],
  )

  const diferencia = round2(equivalente - totalAsignado)

  const repartirAutomatico = () => {
    const ids = Object.keys(asign).filter((id) => asign[id].checked)
    if (ids.length === 0) return
    const part = Math.floor((equivalente * 100) / ids.length) / 100
    let restante = round2(equivalente - part * (ids.length - 1))
    const next: Record<string, Asignacion> = {}
    ids.forEach((id, i) => {
      const monto = i === ids.length - 1 ? restante : part
      next[id] = { checked: true, monto: round2(monto).toFixed(2) }
    })
    setAsign((prev) => ({ ...prev, ...next }))
  }

  const guardar = async () => {
    try {
      const asignados = Object.entries(asign)
        .filter(([, a]) => a.checked && Number(a.monto) > 0)
        .map(([suscripcion_id, a]) => ({
          suscripcion_id,
          monto_usd: Number(a.monto),
        }))
      await registrarPago({
        cliente_id: form.cliente_id,
        monto_pagado: montoNum,
        moneda: form.moneda,
        tasa_bcv_aplicada: form.moneda === 'BS' ? tasaNum : null,
        equivalente_usd: equivalente,
        metodo_pago: form.metodo_pago,
        asignados,
      })
      setExito('Pago registrado correctamente ✓ (comisiones de 30% generadas por el trigger)')
      setForm(estadoInicial)
      const t = await fetchTasaDelDia()
      if (t != null) setForm((f) => ({ ...f, tasa: String(t) }))
      setPagos(await fetchPagos())
    } catch (e) {
      setError((e as Error).message)
    }
  }

  const puedeGuardar =
    !!form.cliente_id &&
    montoNum > 0 &&
    equivalente > 0 &&
    totalAsignado > 0 &&
    Math.abs(diferencia) < 0.01

  if (error) return <ErrorMsg message={error} />

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-xl font-bold text-slate-900">Pagos (calculadora BCV)</h1>
        <p className="text-sm text-slate-500">
          Registra el cobro y distribúyelo entre las suscripciones activas del cliente
        </p>
      </header>

      {exito ? (
        <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{exito}</p>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="1 · Datos del pago">
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
            <div className="grid grid-cols-3 gap-3">
              <Field label="Monto *">
                <Input
                  type="number"
                  min={0}
                  step="0.01"
                  value={form.monto}
                  onChange={(e) => setForm({ ...form, monto: e.target.value })}
                />
              </Field>
              <Field label="Moneda *">
                <Select
                  value={form.moneda}
                  onChange={(e) => setForm({ ...form, moneda: e.target.value as Moneda })}
                >
                  <option value="USD">USD</option>
                  <option value="BS">BS</option>
                  <option value="USDT">USDT</option>
                </Select>
              </Field>
              <Field label="Tasa BCV *">
                <Input
                  type="number"
                  min={0}
                  step="0.0001"
                  value={form.tasa}
                  onChange={(e) => setForm({ ...form, tasa: e.target.value })}
                />
              </Field>
            </div>
            {form.moneda === 'BS' ? (
              <p className="text-xs text-slate-400">
                💡 Tasa cargada automáticamente del día (cron `tasas-bcv-diaria`).{/*
              */}
              </p>
            ) : null}
            <Field label="Método de pago">
              <Select
                value={form.metodo_pago}
                onChange={(e) => setForm({ ...form, metodo_pago: e.target.value })}
              >
                <option value="">Selecciona…</option>
                {METODOS_PAGO.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
        </Card>

        <Card title="2 · Equivalente USD (calculadora BCV)">
          <div className="rounded-xl bg-indigo-50 p-4 text-center">
            <p className="text-xs font-medium uppercase tracking-wide text-indigo-500">
              Equivalente en USD
            </p>
            <p className="text-4xl font-bold text-indigo-700">{fmtUSD(equivalente)}</p>
            <p className="mt-1 text-xs text-indigo-400">
              {form.moneda === 'BS'
                ? `${fmtBS(montoNum)} ÷ tasa ${tasaNum}`
                : `${form.moneda} 1:1 con USD (tasa no aplica)`}
            </p>
          </div>

          <h3 className="mb-2 mt-4 text-sm font-semibold text-slate-700">
            Distribución en suscripciones activas
          </h3>
          {activasDelCliente.length === 0 ? (
            <p className="text-sm text-slate-400">Este cliente no tiene suscripciones activas.</p>
          ) : (
            <>
              <div className="mb-2 flex items-center justify-between">
                <Button variant="secondary" onClick={repartirAutomatico}>
                  Repartir automáticamente
                </Button>
                <span className="text-sm text-slate-600">
                  Asignado: <strong>{fmtUSD(totalAsignado)}</strong>
                  <span className={diferencia < 0 ? ' text-rose-600' : ' text-slate-400'}>
                    {' '}
                    (dif. {fmtUSD(Math.abs(diferencia))})
                  </span>
                </span>
              </div>
              <div className="space-y-2">
                {activasDelCliente.map((s) => {
                  const a = asign[s.id] ?? { checked: true, monto: '0' }
                  return (
                    <div
                      key={s.id}
                      className="flex items-center gap-3 rounded-lg border border-slate-200 px-3 py-2"
                    >
                      <input
                        type="checkbox"
                        className="h-4 w-4 accent-indigo-600"
                        checked={a.checked}
                        onChange={(e) =>
                          setAsign((prev) => ({
                            ...prev,
                            [s.id]: { ...a, checked: e.target.checked },
                          }))
                        }
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-slate-800">
                          {s.planes?.plataformas?.nombre ?? '?'} ·{' '}
                          {fmtUSD(s.planes?.precio_venta_usd ?? 0)}
                        </p>
                        <p className="truncate text-xs text-slate-400">
                          {s.usuarios?.nombre} — vence {fmtDate(s.fecha_corte_cliente)}
                        </p>
                      </div>
                      <Input
                        type="number"
                        min={0}
                        step="0.01"
                        className="w-28"
                        value={a.monto}
                        disabled={!a.checked}
                        onChange={(e) =>
                          setAsign((prev) => ({
                            ...prev,
                            [s.id]: { ...a, monto: e.target.value },
                          }))
                        }
                      />
                    </div>
                  )
                })}
              </div>
            </>
          )}

          <div className="mt-4 flex justify-end">
            <Button onClick={() => void guardar()} disabled={!puedeGuardar}>
              Registrar pago
            </Button>
          </div>
          {!puedeGuardar && form.cliente_id ? (
            <p className="mt-2 text-right text-xs text-amber-600">
              Total asignado ({fmtUSD(totalAsignado)}) debe igualar el equivalente (
              {fmtUSD(equivalente)}).
            </p>
          ) : null}
        </Card>
      </div>

      <Card title="Últimos pagos registrados">
        {pagos.length === 0 ? (
          <Loading />
        ) : (
          <Table headers={['Cliente', 'Fecha', 'Monto', 'Moneda', 'Tasa', 'Equivalent USD', 'Método']}>
            {pagos.map((p) => (
              <tr key={p.id}>
                <Td className="font-medium">{p.usuarios?.nombre ?? '—'}</Td>
                <Td>{fmtDate(p.fecha_pago)}</Td>
                <Td>
                  {p.moneda === 'BS' ? fmtBS(p.monto_pagado) : `$${p.monto_pagado}`}
                </Td>
                <Td>
                  <span
                    className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      p.moneda === 'BS'
                        ? 'bg-amber-100 text-amber-700'
                        : p.moneda === 'USDT'
                          ? 'bg-teal-100 text-teal-700'
                          : 'bg-emerald-100 text-emerald-700'
                    }`}
                  >
                    {p.moneda}
                  </span>
                </Td>
                <Td>{p.tasa_bcv_aplicada ?? '—'}</Td>
                <Td className="font-semibold">{fmtUSD(p.equivalente_usd)}</Td>
                <Td>{p.metodo_pago ?? '—'}</Td>
              </tr>
            ))}
          </Table>
        )}
      </Card>
    </div>
  )
}