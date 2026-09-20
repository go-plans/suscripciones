import { useCallback, useEffect, useState } from 'react'
import {
  fetchResumen,
  fetchVencimientosProveedores,
} from '../lib/api'
import { fmtDate, fmtUSD } from '../lib/format'
import { errMsg } from '../lib/err'
import type { VencimientoProveedor } from '../lib/types'
import {
  Badge,
  Card,
  ErrorMsg,
  Loading,
  PageHeader,
  StatCard,
  Table,
  Td,
} from '../components/ui'

export default function Dashboard() {
  const [resumen, setResumen] = useState<Awaited<ReturnType<typeof fetchResumen>> | null>(null)
  const [vencimientos, setVencimientos] = useState<VencimientoProveedor[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')

  const cargar = useCallback(async () => {
    try {
      const [r, v] = await Promise.all([fetchResumen(), fetchVencimientosProveedores()])
      setResumen(r)
      setVencimientos(v)
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

  if (cargando) return <Loading />
  if (error) return <ErrorMsg message={error} />

  return (
    <div className="space-y-6">
      <PageHeader title="Dashboard" subtitle="Resumen general del negocio" />

      {resumen ? (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
          <StatCard label="Clientes" value={resumen.clientes} />
          <StatCard
            label="Suscripciones activas"
            value={resumen.suscripcionesActivas}
          />
          <StatCard
            label="Suscripciones vencidas"
            value={resumen.suscripcionesVencidas}
            hint={resumen.suscripcionesVencidas > 0 ? 'Revisar cobros pendientes' : undefined}
          />
          <StatCard
            label="Comisiones pendientes"
            value={fmtUSD(resumen.comisionesPendientesUSD)}
          />
          <StatCard
            label="Ingresos del mes"
            value={fmtUSD(resumen.ingresosMesUSD)}
          />
        </div>
      ) : (
        <Loading />
      )}

      <Card title="Vencimientos de proveedores (próximos 3 días)">
        {vencimientos.length === 0 ? (
          <p className="text-sm text-slate-400">
            No hay cuentas madre por vencer en los próximos 3 días.
          </p>
        ) : (
          <Table
            headers={['Proveedor', 'Plataforma', 'Cuenta', 'Cupos', 'Costo', 'Fecha corte', '']}
          >
            {vencimientos.map((v) => (
              <tr key={v.id}>
                <Td>{v.proveedor}</Td>
                <Td>{v.plataforma}</Td>
                <Td className="font-mono text-xs">{v.correo_cuenta}</Td>
                <Td>
                  {v.cupos_ocupados}/{v.cupos_totales}
                </Td>
                <Td>{fmtUSD(v.costo_renovacion_usd)}</Td>
                <Td>{fmtDate(v.fecha_corte_proveedor)}</Td>
                <Td>
                  <Badge
                    value={v.dias_restantes < 0 ? 'vencida' : String(v.dias_restantes)}
                  />
                </Td>
              </tr>
            ))}
          </Table>
        )}
      </Card>
    </div>
  )
}