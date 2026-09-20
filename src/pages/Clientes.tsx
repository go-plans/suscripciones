import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  actualizarCliente,
  crearCliente,
  eliminarCliente,
  fetchAgentes,
  fetchClientes,
} from '../lib/api'
import type { Usuario } from '../lib/types'
import { fmtDateTime } from '../lib/format'
import { errMsg } from '../lib/err'
import {
  Badge,
  Button,
  Buscador,
  EmptyState,
  ErrorMsg,
  Field,
  Input,
  Loading,
  Modal,
  ModalFooter,
  PageHeader,
  Select,
  Table,
  Td,
} from '../components/ui'

const vacio = { nombre: '', email: '', telefono: '', referido_por: '' }

export default function Clientes() {
  const [clientes, setClientes] = useState<Usuario[]>([])
  const [agentes, setAgentes] = useState<Usuario[]>([])
  const [busqueda, setBusqueda] = useState('')
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')
  const [modal, setModal] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const [editando, setEditando] = useState<Usuario | null>(null)
  const [form, setForm] = useState(vacio)

  const cargar = useCallback(async () => {
    try {
      const [c, a] = await Promise.all([fetchClientes(), fetchAgentes()])
      setClientes(c)
      setAgentes(a)
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

  const filtrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase()
    if (!q) return clientes
    return clientes.filter((c) =>
      [c.nombre, c.email, c.telefono].filter(Boolean).some((v) => v!.toLowerCase().includes(q)),
    )
  }, [clientes, busqueda])

  const abrirNuevo = () => {
    setEditando(null)
    setForm(vacio)
    setModal(true)
  }

  const abrirEditar = (c: Usuario) => {
    setEditando(c)
    setForm({
      nombre: c.nombre,
      email: c.email ?? '',
      telefono: c.telefono ?? '',
      referido_por: c.referido_por ?? '',
    })
    setModal(true)
  }

  const guardar = async () => {
    if (guardando) return
    setGuardando(true)
    try {
      if (editando) {
        await actualizarCliente(editando.id, { nombre: form.nombre, email: form.email, telefono: form.telefono })
      } else {
        await crearCliente(form)
      }
      setModal(false)
      await cargar()
    } catch (e) {
      setError(errMsg(e))
    } finally {
      setGuardando(false)
    }
  }

  const borrar = async (c: Usuario) => {
    if (
      !window.confirm(
        `¿Eliminar al cliente "${c.nombre}"?\n\nSe borrarán también sus suscripciones, pagos y comisiones asociadas.`,
      )
    )
      return
    try {
      await eliminarCliente(c.id)
      await cargar()
    } catch (e) {
      setError(errMsg(e))
    }
  }

  if (cargando) return <Loading />
  if (error) return <ErrorMsg message={error} />

  return (
    <div className="space-y-5">
      <PageHeader title="Clientes" subtitle="Alta, baja y modificación de clientes">
        <Button onClick={abrirNuevo}>+ Nuevo cliente</Button>
      </PageHeader>

      <Buscador
        value={busqueda}
        onChange={setBusqueda}
        placeholder="Buscar por nombre, email o teléfono…"
      />

      <p className="text-xs text-slate-400">
        Mostrando {filtrados.length} de {clientes.length} clientes.
      </p>

      {clientes.length === 0 ? (
        <EmptyState message="Todavía no hay clientes registrados." />
      ) : (
        <Table headers={['Nombre', 'Email', 'Teléfono', 'Referido por', 'Registro', 'Acciones']}>
          {filtrados.map((c) => {
            const agente = agentes.find((a) => a.id === c.referido_por)
            return (
              <tr key={c.id}>
                <Td className="font-medium">{c.nombre}</Td>
                <Td>{c.email ?? '—'}</Td>
                <Td>{c.telefono ?? '—'}</Td>
                <Td>{agente?.nombre ?? '—'}</Td>
                <Td>{fmtDateTime(c.created_at)}</Td>
                <Td>
                  <div className="flex gap-2">
                    <Button variant="secondary" onClick={() => abrirEditar(c)}>
                      Editar
                    </Button>
                    <Button variant="danger" onClick={() => void borrar(c)}>
                      Eliminar
                    </Button>
                  </div>
                </Td>
              </tr>
            )
          })}
        </Table>
      )}

      <Modal
        open={modal}
        title={editando ? 'Editar cliente' : 'Nuevo cliente'}
        onClose={() => setModal(false)}
      >
        <div className="space-y-3">
          <Field label="Nombre *">
            <Input
              value={form.nombre}
              onChange={(e) => setForm({ ...form, nombre: e.target.value })}
              placeholder="Juan Pérez"
            />
          </Field>
          <Field label="Email">
            <Input
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="cliente@correo.com"
            />
          </Field>
          <Field label="Teléfono">
            <Input
              value={form.telefono}
              onChange={(e) => setForm({ ...form, telefono: e.target.value })}
              placeholder="+58 412…"
            />
          </Field>
          {!editando ? (
            <Field label="Referido por (agente)">
              <Select
                value={form.referido_por}
                onChange={(e) => setForm({ ...form, referido_por: e.target.value })}
              >
                <option value="">Sin referido</option>
                {agentes.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.nombre}
                  </option>
                ))}
              </Select>
            </Field>
          ) : (
            <p className="text-xs text-slate-400">
              El referido no se modifica aquí (política de trazabilidad).
            </p>
          )}
          <ModalFooter
            onCancel={() => setModal(false)}
            onSave={() => void guardar()}
            disabled={!form.nombre.trim()}
            guardando={guardando}
          />
        </div>
      </Modal>

      <div className="text-xs text-slate-400">
        <Badge value="cliente" /> rol asignado automáticamente a los clientes
      </div>
    </div>
  )
}