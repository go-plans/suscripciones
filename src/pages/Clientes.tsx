import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  actualizarCliente,
  crearCliente,
  eliminarCliente,
  fetchAgentes,
  fetchClientes,
} from '../lib/api'
import type { Usuario } from '../lib/types'
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
import { IconSearch } from '../components/icons'

const vacio = { nombre: '', email: '', telefono: '', referido_por: '' }

export default function Clientes() {
  const [clientes, setClientes] = useState<Usuario[]>([])
  const [agentes, setAgentes] = useState<Usuario[]>([])
  const [busqueda, setBusqueda] = useState('')
  const [error, setError] = useState('')
  const [modal, setModal] = useState(false)
  const [editando, setEditando] = useState<Usuario | null>(null)
  const [form, setForm] = useState(vacio)

  const cargar = useCallback(async () => {
    try {
      const [c, a] = await Promise.all([fetchClientes(), fetchAgentes()])
      setClientes(c)
      setAgentes(a)
      setError('')
    } catch (e) {
      setError((e as Error).message)
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
    try {
      if (editando) {
        await actualizarCliente(editando.id, { nombre: form.nombre, email: form.email, telefono: form.telefono })
      } else {
        await crearCliente(form)
      }
      setModal(false)
      await cargar()
    } catch (e) {
      setError((e as Error).message)
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
      setError((e as Error).message)
    }
  }

  if (error) return <ErrorMsg message={error} />

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Clientes</h1>
          <p className="text-sm text-slate-500">Alta, baja y modificación de clientes</p>
        </div>
        <Button onClick={abrirNuevo}>+ Nuevo cliente</Button>
      </header>

      <div className="relative max-w-sm">
        <IconSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <Input
          className="pl-9"
          placeholder="Buscar por nombre, email o teléfono…"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
        />
      </div>

      <p className="text-xs text-slate-400">
        Mostrando {filtrados.length} de {clientes.length} clientes.
      </p>

      {clientes.length === 0 ? (
        <Loading />
      ) : (
        <Table
          headers={['Nombre', 'Email', 'Teléfono', 'Referido por', 'Registro', 'Acciones']}
        >
          {filtrados.map((c) => {
            const agente = agentes.find((a) => a.id === c.referido_por)
            return (
              <tr key={c.id}>
                <Td className="font-medium">{c.nombre}</Td>
                <Td>{c.email ?? '—'}</Td>
                <Td>{c.telefono ?? '—'}</Td>
                <Td>{agente?.nombre ?? '—'}</Td>
                <Td>{new Date(c.created_at).toLocaleDateString('es-VE')}</Td>
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

      <div className="text-xs text-slate-400">
        <Badge value="cliente" /> rol asignado automáticamente a los clientes
      </div>
    </div>
  )
}