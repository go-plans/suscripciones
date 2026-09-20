import { useCallback, useEffect, useState } from 'react'
import { crearProveedor, eliminarProveedor, fetchProveedores } from '../lib/api'
import type { Proveedor } from '../lib/types'
import {
  Button,
  ErrorMsg,
  Field,
  Input,
  Loading,
  Modal,
  Table,
  Td,
} from '../components/ui'

const vacio = { nombre: '', contacto: '', metodo_pago_preferido: '' }

export default function Proveedores() {
  const [proveedores, setProveedores] = useState<Proveedor[]>([])
  const [error, setError] = useState('')
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState(vacio)

  const cargar = useCallback(async () => {
    try {
      setProveedores(await fetchProveedores())
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
      await crearProveedor(form)
      setModal(false)
      setForm(vacio)
      await cargar()
    } catch (e) {
      setError((e as Error).message)
    }
  }

  const borrar = async (p: Proveedor) => {
    if (!window.confirm(`¿Eliminar proveedor "${p.nombre}"?`)) return
    try {
      await eliminarProveedor(p.id)
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
          <h1 className="text-xl font-bold text-slate-900">Proveedores</h1>
          <p className="text-sm text-slate-500">Quiénes te venden las cuentas madre</p>
        </div>
        <Button onClick={() => setModal(true)}>+ Nuevo proveedor</Button>
      </header>

      {proveedores.length === 0 ? (
        <Loading />
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