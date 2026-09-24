import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  actualizarPlan,
  crearPlan,
  eliminarPlan,
  fetchPlanes,
  fetchPlataformasTodas,
} from '../lib/api'
import type { PlanRow, Plataforma } from '../lib/types'
import { errMsg } from '../lib/err'
import { etiquetaDuracion, precioUsd } from '../lib/tienda'
import {
  Button,
  Card,
  EmptyState,
  ErrorMsg,
  Field,
  Input,
  Loading,
  Modal,
  ModalFooter,
  PageHeader,
  Table,
  Td,
} from '../components/ui'
import { IconPencil, IconPlus, IconTrash } from '../components/icons'

interface FormPlan {
  plataforma_id: string
  duracion_dias: string
  precio_venta_usd: string
  precio_referencia_usd: string
}

const vacio: FormPlan = {
  plataforma_id: '',
  duracion_dias: '',
  precio_venta_usd: '',
  precio_referencia_usd: '',
}

export default function Planes() {
  const [planes, setPlanes] = useState<PlanRow[]>([])
  const [plataformas, setPlataformas] = useState<Plataforma[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')
  const [modal, setModal] = useState(false)
  const [editando, setEditando] = useState<PlanRow | null>(null)
  const [guardando, setGuardando] = useState(false)
  const [form, setForm] = useState<FormPlan>(vacio)

  const cargar = useCallback(async () => {
    try {
      const [pl, pf] = await Promise.all([fetchPlanes(), fetchPlataformasTodas()])
      setPlanes(pl)
      setPlataformas(pf)
      setError('')
    } catch (e) {
      setError(errMsg(e))
    } finally {
      setCargando(false)
    }
  }, [])

  useEffect(() => {
    void cargar()
  }, [cargar])

  // Agrupa los planes por plataforma (orden alfabético por nombre)
  const grupos = useMemo(() => {
    const mapa = new Map<string, PlanRow[]>()
    for (const pl of planes) {
      const nombre = pl.plataformas?.nombre ?? '?'
      const arr = mapa.get(nombre) ?? []
      arr.push(pl)
      mapa.set(nombre, arr)
    }
    return [...mapa.entries()].sort((a, b) => a[0].localeCompare(b[0]))
  }, [planes])

  const abrirNuevo = () => {
    setEditando(null)
    setForm({
      ...vacio,
      plataforma_id: plataformas.find((p) => p.activa)?.id ?? plataformas[0]?.id ?? '',
    })
    setModal(true)
  }

  const abrirEditar = (pl: PlanRow) => {
    setEditando(pl)
    setForm({
      plataforma_id: pl.plataforma_id,
      duracion_dias: String(pl.duracion_dias),
      precio_venta_usd: String(pl.precio_venta_usd),
      precio_referencia_usd: pl.precio_referencia_usd != null ? String(pl.precio_referencia_usd) : '',
    })
    setModal(true)
  }

  const validar = (): string => {
    const dias = Number(form.duracion_dias)
    const precio = Number(form.precio_venta_usd)
    if (!Number.isFinite(dias) || dias <= 0) return 'La duración debe ser un número positivo de días.'
    if (!Number.isFinite(precio) || precio < 0) return 'El precio de venta debe ser un número mayor o igual a 0.'
    if (!editando && !form.plataforma_id) return 'Selecciona una plataforma.'
    const ref = form.precio_referencia_usd.trim()
    if (ref && (!Number.isFinite(Number(ref)) || Number(ref) < 0)) return 'El precio de referencia no es válido.'
    return ''
  }

  const guardar = async () => {
    if (guardando) return
    const invalido = validar()
    if (invalido) {
      setError(invalido)
      return
    }
    setGuardando(true)
    setError('')
    try {
      const ref = form.precio_referencia_usd.trim() ? Number(form.precio_referencia_usd) : null
      if (editando) {
        await actualizarPlan(editando.id, {
          duracion_dias: Number(form.duracion_dias),
          precio_venta_usd: Number(form.precio_venta_usd),
          precio_referencia_usd: ref,
        })
      } else {
        await crearPlan({
          plataforma_id: form.plataforma_id,
          duracion_dias: Number(form.duracion_dias),
          precio_venta_usd: Number(form.precio_venta_usd),
          precio_referencia_usd: ref,
        })
      }
      setModal(false)
      await cargar()
    } catch (e) {
      setError(errMsg(e))
    } finally {
      setGuardando(false)
    }
  }

  const borrar = async (pl: PlanRow) => {
    const nombre = pl.plataformas?.nombre ?? '?'
    if (
      !window.confirm(
        `¿Eliminar el plan de ${etiquetaDuracion(pl.duracion_dias)} de "${nombre}"?\n\nSolo se borra del catálogo; no afecta suscripciones ya pagadas.`,
      )
    )
      return
    try {
      await eliminarPlan(pl.id)
      await cargar()
    } catch (e) {
      setError(errMsg(e))
    }
  }

  if (cargando) return <Loading />
  if (error && planes.length === 0) return <ErrorMsg message={error} />

  return (
    <div className="space-y-5">
      <PageHeader
        title="Planes"
        subtitle="Precios y duraciones del catálogo de venta (La tienda se actualiza al instante)"
      >
        <Button onClick={abrirNuevo}>
          <IconPlus className="h-4 w-4" /> Nuevo plan
        </Button>
      </PageHeader>

      {error ? <ErrorMsg message={error} /> : null}

      {grupos.length === 0 ? (
        <EmptyState message="Todavía no hay planes registrados." />
      ) : (
        grupos.map(([nombre, lista]) => (
          <Card key={nombre} title={nombre}>
            <Table headers={['Duración', 'Precio de venta', 'Ref.', 'Acciones']}>
              {lista.map((pl) => (
                <tr key={pl.id}>
                  <Td className="font-medium">{etiquetaDuracion(pl.duracion_dias)}</Td>
                  <Td>{precioUsd(pl.precio_venta_usd)}</Td>
                  <Td>
                    {pl.precio_referencia_usd != null ? (
                      <span className="text-sm line-through text-slate-400">
                        {precioUsd(pl.precio_referencia_usd)}
                      </span>
                    ) : (
                      '—'
                    )}
                  </Td>
                  <Td>
                    <div className="flex gap-2">
                      <Button variant="secondary" onClick={() => abrirEditar(pl)}>
                        <IconPencil className="h-4 w-4" /> Editar
                      </Button>
                      <Button variant="danger" onClick={() => void borrar(pl)}>
                        <IconTrash className="h-4 w-4" /> Eliminar
                      </Button>
                    </div>
                  </Td>
                </tr>
              ))}
            </Table>
          </Card>
        ))
      )}

      <Modal
        open={modal}
        title={editando ? 'Editar plan' : 'Nuevo plan'}
        onClose={() => setModal(false)}
      >
        <div className="space-y-3">
          {!editando ? (
            <Field label="Plataforma *">
              <select
                value={form.plataforma_id}
                onChange={(e) => setForm({ ...form, plataforma_id: e.target.value })}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 focus:border-indigo-400 focus:outline-none"
              >
                {plataformas.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nombre} {p.activa ? '' : '(inactiva)'}
                  </option>
                ))}
              </select>
            </Field>
          ) : null}
          <Field label="Duración (días) *">
            <Input
              type="number"
              min={1}
              value={form.duracion_dias}
              onChange={(e) => setForm({ ...form, duracion_dias: e.target.value })}
              placeholder="30, 180, 365…"
            />
          </Field>
          <Field label="Precio de venta (USD) *">
            <Input
              type="number"
              min={0}
              step="0.01"
              value={form.precio_venta_usd}
              onChange={(e) => setForm({ ...form, precio_venta_usd: e.target.value })}
              placeholder="2.99"
            />
          </Field>
          <Field label="Precio de referencia (USD, opcional)">
            <Input
              type="number"
              min={0}
              step="0.01"
              value={form.precio_referencia_usd}
              onChange={(e) => setForm({ ...form, precio_referencia_usd: e.target.value })}
              placeholder="P. ej. 5.99 para el precio tachado"
            />
          </Field>
          <ModalFooter
          onCancel={() => setModal(false)}
          onSave={() => void guardar()}
          disabled={!form.duracion_dias.trim() || !form.precio_venta_usd.trim()}
          guardando={guardando}
        />
        </div>
      </Modal>
    </div>
  )
}