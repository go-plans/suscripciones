import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import Layout from './components/Layout'
import Clientes from './pages/Clientes'
import Comisiones from './pages/Comisiones'
import CuentasMadre from './pages/CuentasMadre'
import Dashboard from './pages/Dashboard'
import Pagos from './pages/Pagos'
import Proveedores from './pages/Proveedores'
import Suscripciones from './pages/Suscripciones'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="clientes" element={<Clientes />} />
          <Route path="suscripciones" element={<Suscripciones />} />
          <Route path="cuentas-madre" element={<CuentasMadre />} />
          <Route path="proveedores" element={<Proveedores />} />
          <Route path="pagos" element={<Pagos />} />
          <Route path="comisiones" element={<Comisiones />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}