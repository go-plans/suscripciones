import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  fetchClientes,
  fetchPagos,
  fetchSuscripciones,
  fetchTasaBcv,
  fetchTasaDelDia,
  registrarPago,
} from '../lib/api'
import type { Moneda, PagoRow, SuscripcionRow, Usuario } from '../lib/types'
import { fmtDate, fmtNum, fmtUSDT, fmtUSD, fmtVES, round2 } from '../lib/format'
import { errMsg } from '../lib/err'
import {
  Button,
  Card,
  EmptyState,
  ErrorMsg,
  Field,
  Input,
  Loading,
  PageHeader,
  Select,
  Table,
  Td,
} from '../components/ui'
import { NuevoCliente } from '../components/inline'
import { IconRefresh } from '../components/icons'

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
  tasa_binance: '',
  metodo_pago: '',
}

type FormState = typeof estadoInicial

export default function Pagos() {
  const [clientes, setClientes] = useState<Usuario[]>([])
  const [susc, setSusc] = useState<SuscripcionRow[]>([])
  const [pagos, setPagos] = useState<PagoRow[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')
  const [exito, setExito] = useState('')
  const [form, setForm] = useState<FormState>(estadoInicial)
  const [asign, setAsign] = useState<Record<string, Asignacion>>({})
  const [guardando, setGuardando] = useState(false)
  const [reflejando, setReflejando] = useState(false)

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
      setError(errMsg(e))
    } finally {
      setCargando(false)
    }
  }, [])

  useEffect(() => {
    void cargar()
  }, [cargar])

  const cargarY = async (actualizar: (f: FormState) => FormState) => {
    await cargar()
    setForm((f) => actualizar(f))
  }

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
  const tasaBinanceNum = useMemo(() => Number(form.tasa_binance) || 0, [form.tasa_binance])

  // Equivalente en USD según la moneda recibida (calculadora BCV / Binance 1:1 con USD)
  const equivalente = useMemo(() => {
    if (form.moneda === 'BS') return tasaNum > 0 ? round2(montoNum / tasaNum) : 0
    return round2(montoNum) // USD y USDT 1:1 con el dólar
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

  const reflejarTasa = async () => {
    setReflejando(true)
    setError('')
    setExito('')
    try {
      const r = await fetchTasaBcv()
      if (r.tasa != null) {
        setForm((f) => ({ ...f, tasa: String(r.tasa) }))
        setExito(
          r.fuente === 'bcv-directo'
            ? `Tasa BCV oficial reflejada: ${fmtNum(r.tasa, 4)} VES/USD (fuente: bcv.org.ve)`
            : `Tasa reflejada: ${fmtNum(r.tasa, 4)} VES/USD (última del sistema, origen BCV)`,
        )
      } else {
        setError(
          'No se pudo obtener la tasa del BCV. Verifica la conexión o ejecuta la Edge Function fetch-bcv.',
        )
      }
    } catch (e) {
      setError(errMsg(e))
    } finally {
      setReflejando(false)
    }
  }

  const guardar = async () => {
    if (guardando) return
    setGuardando(true)
    setError('')
    setExito('')
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
        tasa_cambio_binance: form.moneda === 'USDT' ? tasaBinanceNum || null : null,
        equivalente_usd: equivalente,
        metodo_pago: form.metodo_pago,
        asignados,
      })
      setExito(
        'Pago registrado correctamente. Si la plataforma genera comisión (30%), ya quedó pendiente para el agente referido.',
      )
      setForm(estadoInicial)
      const t = await fetchTasaDelDia()
      if (t != null) setForm((f) => ({ ...f, tasa: String(t) }))
      setPagos(await fetchPagos())
    } catch (e) {
      setError(errMsg(e))
    } finally {
      setGuardando(false)
    }
  }

  const puedeGuardar =
    !!form.cliente_id &&
    montoNum > 0 &&
    equivalente > 0 &&
    totalAsignado > 0 &&
    Math.abs(diferencia) < 0.01

  const fmtMontopago = (p: PagoRow) =>
    p.moneda === 'BS'
      ? fmtVES(p.monto_pagado)
      : p.moneda === 'USDT'
        ? fmtUSDT(p.monto_pagado)
        : fmtUSD(p.monto_pagado)

  if (cargando) return <Loading />

  return (
    <div className="space-y-6">
      <PageHeader
        title="Pagos (calculadora BCV)"
        subtitle="Registra el cobro y distribúyelo entre las suscripciones activas del cliente"
      />

      {exito ? (
        <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{exito}</p>
      ) : null}
      {error ? <ErrorMsg message={error} /> : null}

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
              <NuevoCliente
                onCreated={(id) => void cargarY((f) => ({ ...f, cliente_id: id }))}
              />
            </Field>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
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
              {form.moneda === 'BS' ? (
                <Field label="Tasa BCV *">
                  <Input
                    type="number"
                    min={0}
                    step="0.0001"
                    value={form.tasa}
                    onChange={(e) => setForm({ ...form, tasa: e.target.value })}
                  />
                </Field>
              ) : form.moneda === 'USDT' ? (
                <Field label="Tasa Binance *">
                  <Input
                    type="number"
                    min={0}
                    step="0.0001"
                    value={form.tasa_binance}
                    onChange={(e) => setForm({ ...form, tasa_binance: e.target.value })}
                  />
                </Field>
              ) : (
                <Field label="Tasa">
                  <Input value="No aplica (1:1)" disabled />
                </Field>
              )}
            </div>

            {form.moneda === 'BS' ? (
              <div className="flex flex-wrap items-center gap-2">
                <Button variant="secondary" onClick={() => void reflejarTasa()} disabled={reflejando}>
                  <IconRefresh className={`h-4 w-4 ${reflejando ? 'animate-spin' : ''}`} />
                  {reflejando ? 'Reflejando…' : 'Reflejar tasa'}
                </Button>
                <span className="text-xs text-slate-400">
                  Trae la tasa oficial del día desde el sitio del BCV (bcv.org.ve) vía
                  la Edge Function `fetch-bcv`; si no está desplegada, usa la última guardada.
                </span>
              </div>
            ) : form.moneda === 'USDT' ? (
              <p className="text-xs text-slate-400">
                La tasa de Binance se guarda como referencia con el cobro en USDT (el equival
                en USD es 1:1).
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

        <Card title="2 · Equivalente USD (calculadora)">
          <div className="rounded-xl bg-indigo-50 p-4 text-center">
            <p className="text-xs font-medium uppercase tracking-wide text-indigo-500">
              Equivalente en USD
            </p>
            <p className="text-4xl font-bold text-indigo-700">{fmtUSD(equivalente)}</p>
            <p className="mt-1 text-xs text-indigo-400">
              {form.moneda === 'BS'
                ? `${fmtVES(montoNum)} ÷ tasa ${tasaNum}`
                : form.moneda === 'USDT'
                  ? `${fmtUSDT(montoNum)} = ${fmtUSD(montoNum)} (1:1)`
                  : `${fmtUSD(montoNum)} 1:1 con USD`}
            </p>
          </div>

          <h3 className="mb-2 mt-4 text-sm font-semibold text-slate-700">
            Distribución en suscripciones activas
          </h3>
          {activasDelCliente.length === 0 ? (
            <p className="text-sm text-slate-400">Este cliente no tiene suscripciones activas.</p>
          ) : (
            <>
              <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
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
              <p className="mb-2 text-xs text-slate-400">
                Repartir automáticamente divide el equivalente en partes iguales entre las
                suscripciones marcadas; la última recibe el resto para que cuadre exacto.
              </p>
              <div className="space-y-2">
                {activasDelCliente.map((s) => {
                  const a = asign[s.id] ?? { checked: true, monto: '0' }
                  return (
                    <div
                      key={s.id}
                      className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white px-3 py-2"
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
                          {s.usuarios?.nombre} · vence: {fmtDate(s.fecha_corte_cliente)}
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
            <Button onClick={() => void guardar()} disabled={!puedeGuardar || guardando}>
              {guardando ? 'Registrando…' : 'Registrar pago'}
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
          <EmptyState message="Todavía no hay pagos registrados." />
        ) : (
          <Table headers={['Cliente', 'Fecha', 'Monto', 'Moneda', 'Tasa', 'Equivalent USD', 'Método']}>
            {pagos.map((p) => (
              <tr key={p.id}>
                <Td className="font-medium">{p.usuarios?.nombre ?? '—'}</Td>
                <Td>{fmtDate(p.fecha_pago)}</Td>
                <Td>{fmtMontopago(p)}</Td>
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
                <Td>
                  {p.moneda === 'USDT'
                    ? p.tasa_cambio_binance != null
                      ? fmtNum(p.tasa_cambio_binance, 4)
                      : '—'
                    : p.tasa_bcv_aplicada != null
                      ? fmtNum(p.tasa_bcv_aplicada, 4)
                      : '—'}
                </Td>
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