import { lazy, Suspense } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import Layout from './components/Layout'

// Carga perezosa: cada página se compila al visitarse (app inicial más rápida)
const Dashboard = lazy(() => import('./pages/Dashboard'))
const Clientes = lazy(() => import('./pages/Clientes'))
const Suscripciones = lazy(() => import('./pages/Suscripciones'))
const Plataformas = lazy(() => import('./pages/Plataformas'))
const CuentasMadre = lazy(() => import('./pages/CuentasMadre'))
const Proveedores = lazy(() => import('./pages/Proveedores'))
const Pagos = lazy(() => import('./pages/Pagos'))
const Comisiones = lazy(() => import('./pages/Comisiones'))

export default function App() {
  return (
    <BrowserRouter>
      <Suspense
        fallback={<div className="p-10 text-center text-sm text-slate-400">Cargando…</div>}
      >
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="clientes" element={<Clientes />} />
            <Route path="suscripciones" element={<Suscripciones />} />
            <Route path="plataformas" element={<Plataformas />} />
            <Route path="cuentas-madre" element={<CuentasMadre />} />
            <Route path="proveedores" element={<Proveedores />} />
            <Route path="pagos" element={<Pagos />} />
            <Route path="comisiones" element={<Comisiones />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </Suspense>
    </BrowserRouter>
  )
}