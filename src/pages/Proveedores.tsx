import { useCallback, useEffect, useState } from 'react'
import { crearProveedor, eliminarProveedor, fetchProveedores } from '../lib/api'
import type { Proveedor } from '../lib/types'
import { errMsg } from '../lib/err'
import {
  Button,
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

const vacio = { nombre: '', contacto: '', metodo_pago_preferido: '' }

export default function Proveedores() {
  const [proveedores, setProveedores] = useState<Proveedor[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')
  const [modal, setModal] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const [form, setForm] = useState(vacio)

  const cargar = useCallback(async () => {
    try {
      setProveedores(await fetchProveedores())
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

  const guardar = async () => {
    if (guardando) return
    setGuardando(true)
    try {
      await crearProveedor(form)
      setModal(false)
      setForm(vacio)
      await cargar()
    } catch (e) {
      setError(errMsg(e))
    } finally {
      setGuardando(false)
    }
  }

  const borrar = async (p: Proveedor) => {
    if (!window.confirm(`¿Eliminar proveedor "${p.nombre}"?`)) return
    try {
      await eliminarProveedor(p.id)
      await cargar()
    } catch (e) {
      setError(errMsg(e))
    }
  }

  if (cargando) return <Loading />
  if (error) return <ErrorMsg message={error} />

  return (
    <div className="space-y-5">
      <PageHeader title="Proveedores" subtitle="Quiénes te venden las cuentas madre">
        <Button onClick={() => setModal(true)}>+ Nuevo proveedor</Button>
      </PageHeader>

      {proveedores.length === 0 ? (
        <EmptyState message="Todavía no hay proveedores registrados." />
      ) : (
        <Table headers={['Nombre', 'Contacto', 'Método de pago', 'Acciones']}>
          {proveedores.map((p) => (
            <tr key={p.id}>
              <Td className="font-medium">{p.nombre}</Td>
              <Td>{p.contacto ?? '—'}</Td>
              <Td>{p.metodo_pago_preferido ?? '—'}</Td>
              <Td>
                <Button variant="danger" onClick={() => void borrar(p)}>
                  Eliminar
                </Button>
              </Td>
            </tr>
          ))}
        </Table>
      )}

      <Modal open={modal} title="Nuevo proveedor" onClose={() => setModal(false)}>
        <div className="space-y-3">
          <Field label="Nombre *">
            <Input
              value={form.nombre}
              onChange={(e) => setForm({ ...form, nombre: e.target.value })}
              placeholder="Almacén XYZ"
            />
          </Field>
          <Field label="Contacto">
            <Input
              value={form.contacto}
              onChange={(e) => setForm({ ...form, contacto: e.target.value })}
              placeholder="WhatsApp / Telegram"
            />
          </Field>
          <Field label="Método de pago preferido">
            <Input
              value={form.metodo_pago_preferido}
              onChange={(e) =>
                setForm({ ...form, metodo_pago_preferido: e.target.value })
              }
              placeholder="Zelle, Pago Móvil…"
            />
          </Field>
          <ModalFooter
            onCancel={() => setModal(false)}
            onSave={() => void guardar()}
            disabled={!form.nombre.trim()}
            guardando={guardando}
          />
        </div>
      </Modal>
    </div>
  )
}