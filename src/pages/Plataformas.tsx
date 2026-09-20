import { useCallback, useEffect, useState } from 'react'
import {
  actualizarPlataforma,
  crearPlataforma,
  eliminarPlataforma,
  fetchPlataformasTodas,
} from '../lib/api'
import type { Plataforma } from '../lib/types'
import { fmtDate } from '../lib/format'
import {
  Badge,
  Button,
  ErrorMsg,
  Field,
  Input,
  Loading,
  Modal,
  Table,
  Td,
} from '../components/ui'
import { IconCheck, IconTrash, IconX } from '../components/icons'

const vacio = { nombre: '', activa: true, aplica_comision: false }

export default function Plataformas() {
  const [plataformas, setPlataformas] = useState<Plataforma[]>([])
  const [error, setError] = useState('')
  const [modal, setModal] = useState(false)
  const [editando, setEditando] = useState<Plataforma | null>(null)
  const [form, setForm] = useState(vacio)

  const cargar = useCallback(async () => {
    try {
      setPlataformas(await fetchPlataformasTodas())
      setError('')
    } catch (e) {
      setError((e as Error).message)
    }
  }, [])

  useEffect(() => {
    void cargar()
  }, [cargar])

  const abrirNuevo = () => {
    setEditando(null)
    setForm(vacio)
    setModal(true)
  }

  const abrirEditar = (p: Plataforma) => {
    setEditando(p)
    setForm({ nombre: p.nombre, activa: p.activa, aplica_comision: p.aplica_comision })
    setModal(true)
  }

  const guardar = async () => {
    try {
      if (editando) {
        await actualizarPlataforma(editando.id, form)
      } else {
        await crearPlataforma(form)
      }
      setModal(false)
      await cargar()
    } catch (e) {
      setError((e as Error).message)
    }
  }

  const borrar = async (p: Plataforma) => {
    if (
      !window.confirm(
        `¿Eliminar "${p.nombre}"?\n\nOJO: se borrarán también sus planes, cuentas madre y suscripciones asociadas.`,
      )
    )
      return
    try {
      await eliminarPlataforma(p.id)
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
          <h1 className="text-xl font-bold text-slate-900">Plataformas</h1>
          <p className="text-sm text-slate-500">
            Catálogo de servicios y si generan comisión de referido (30%)
          </p>
        </div>
        <Button onClick={abrirNuevo}>+ Nueva plataforma</Button>
      </header>

      {plataformas.length === 0 ? (
        <Loading />
      ) : (
        <Table headers={['Nombre', 'Estado', 'Comisión 30%', 'Registro', 'Acciones']}>
          {plataformas.map((p) => (
            <tr key={p.id}>
              <Td className="font-medium">{p.nombre}</Td>
              <Td>
                <Badge value={p.activa ? 'activa' : 'baja'} />
              </Td>
              <Td>
                {p.aplica_comision ? (
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700">
                    <IconCheck className="h-3.5 w-3.5" /> Sí
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-xs text-slate-400">
                    <IconX className="h-3.5 w-3.5" /> No
                  </span>
                )}
              </Td>
              <Td>{fmtDate(p.created_at)}</Td>
              <Td>
                <div className="flex gap-2">
                  <Button variant="secondary" onClick={() => abrirEditar(p)}>
                    Editar
                  </Button>
                  <Button variant="danger" onClick={() => void borrar(p)}>
                    <IconTrash className="h-4 w-4" /> Eliminar
                  </Button>
                </div>
              </Td>
            </tr>
          ))}
        </Table>
      )}

      <p className="text-xs text-slate-400">
        La comisión del 30% se genera automáticamente solo en las plataformas marcadas (p. ej.
        Google One).
      </p>

      <Modal
        open={modal}
        title={editando ? 'Editar plataforma' : 'Nueva plataforma'}
        onClose={() => setModal(false)}
      >
        <div className="space-y-3">
          <Field label="Nombre *">
            <Input
              value={form.nombre}
              onChange={(e) => setForm({ ...form, nombre: e.target.value })}
              placeholder="Netflix, Spotify…"
            />
          </Field>
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              className="h-4 w-4 accent-indigo-600"
              checked={form.activa}
              onChange={(e) => setForm({ ...form, activa: e.target.checked })}
            />
            Activa (disponible para venta)
          </label>
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
            <Button variant="secondary" onClick={() => setModal(false)}>
              Cancelar
            </Button>
            <Button onClick={() => void guardar()} disabled={!form.nombre.trim()}>
              Guardar
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}