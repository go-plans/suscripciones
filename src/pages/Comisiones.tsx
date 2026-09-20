import { useCallback, useEffect, useMemo, useState } from 'react'
import { fetchComisiones, liquidarComision } from '../lib/api'
import type { ComisionRow } from '../lib/types'
import { fmtDateTime, fmtUSD } from '../lib/format'
import { errMsg } from '../lib/err'
import {
  Badge,
  Button,
  Card,
  EmptyState,
  ErrorMsg,
  Loading,
  PageHeader,
  Select,
  StatCard,
  Table,
  Td,
} from '../components/ui'

export default function Comisiones() {
  const [comisiones, setComisiones] = useState<ComisionRow[]>([])
  const [filtro, setFiltro] = useState<'todas' | 'pendiente' | 'liquidada'>('todas')
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')

  const cargar = useCallback(async () => {
    try {
      setComisiones(await fetchComisiones())
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

  const filtradas = useMemo(
    () => (filtro === 'todas' ? comisiones : comisiones.filter((c) => c.estado === filtro)),
    [comisiones, filtro],
  )

  const liquidar = async (id: string) => {
    if (!window.confirm('¿Marcar esta comisión como liquidada?')) return
    try {
      await liquidarComision(id)
      await cargar()
    } catch (e) {
      setError(errMsg(e))
    }
  }

  const resumen = useMemo(() => {
    let pendiente = 0
    let liquidada = 0
    for (const c of comisiones) {
      if (c.estado === 'pendiente') pendiente += Number(c.monto_comision_usd)
      else liquidada += Number(c.monto_comision_usd)
    }
    return { pendiente, liquidada }
  }, [comisiones])

  if (cargando) return <Loading />
  if (error) return <ErrorMsg message={error} />

  return (
    <div className="space-y-6">
      <PageHeader
        title="Comisiones de referidos"
        subtitle="30% del equivalente USD, generadas por trigger"
      />

      <div className="grid grid-cols-2 gap-4 lg:w-1/2">
        <StatCard label="Pendientes" value={fmtUSD(resumen.pendiente)} />
        <StatCard label="Liquidadas" value={fmtUSD(resumen.liquidada)} />
      </div>

      <Card title="Historial">
        {comisiones.length === 0 ? (
          <EmptyState message="Todavía no hay comisiones generadas." />
        ) : (
          <>
            <div className="mb-3 flex items-center gap-2">
              <span className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Filtrar
              </span>
              <Select
                className="w-48"
                value={filtro}
                onChange={(e) => setFiltro(e.target.value as typeof filtro)}
              >
                <option value="todas">Todas</option>
                <option value="pendiente">Pendientes</option>
                <option value="liquidada">Liquidadas</option>
              </Select>
            </div>
            <Table headers={['Agente', 'Fecha', 'Monto USD', 'Estado', 'Acciones']}>
              {filtradas.map((c) => (
                <tr key={c.id}>
                  <Td className="font-medium">{c.usuarios?.nombre ?? '—'}</Td>
                  <Td>{fmtDateTime(c.created_at)}</Td>
                  <Td className="font-semibold">{fmtUSD(c.monto_comision_usd)}</Td>
                  <Td>
                    <Badge value={c.estado} />
                  </Td>
                  <Td>
                    {c.estado === 'pendiente' ? (
                      <Button variant="secondary" onClick={() => void liquidar(c.id)}>
                        Liquidar
                      </Button>
                    ) : (
                      <span className="text-xs text-slate-400">—</span>
                    )}
                  </Td>
                </tr>
              ))}
            </Table>
          </>
        )}
      </Card>
    </div>
  )
}