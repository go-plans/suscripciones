import { lazy, Suspense } from 'react'
import { HashRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider, useAuth } from './lib/auth'
import Layout from './components/Layout'
import { IconLock } from './components/icons'
import { CarritoProvider } from './components/tienda/CarritoProvider'

// Carga perezosa: cada página se compila al visitarse (app inicial más rápida)
const Login = lazy(() => import('./pages/Login'))
const Tienda = lazy(() => import('./pages/Tienda'))
const TiendaPlataforma = lazy(() => import('./pages/TiendaPlataforma'))
const Carrito = lazy(() => import('./pages/Carrito'))
const Checkout = lazy(() => import('./pages/Checkout'))
const Registro = lazy(() => import('./pages/Registro'))
const Ingreso = lazy(() => import('./pages/Ingreso'))
const Dashboard = lazy(() => import('./pages/Dashboard'))
const Clientes = lazy(() => import('./pages/Clientes'))
const Suscripciones = lazy(() => import('./pages/Suscripciones'))
const Plataformas = lazy(() => import('./pages/Plataformas'))
const CuentasMadre = lazy(() => import('./pages/CuentasMadre'))
const Proveedores = lazy(() => import('./pages/Proveedores'))
const Pagos = lazy(() => import('./pages/Pagos'))
const Comisiones = lazy(() => import('./pages/Comisiones'))
const Planes = lazy(() => import('./pages/Planes'))
const Pedidos = lazy(() => import('./pages/Pedidos'))

// Guard: sin sesión activa nadie llega al panel (todas sus llamadas usan
// la anon key y el RLS de la BD solo deja actuar al admin autenticado).
// Los clientes registrados (rol 'cliente') son redirigidos a la tienda.
function Protegida() {
  const { session, cargando, rol, rolCargando } = useAuth()
  if (cargando || (session && rolCargando))
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-slate-400">
        Verificando sesión…
      </div>
    )
  if (!session) return <Navigate to="/login" replace />
  if (rol !== 'admin') return <Navigate to="/tienda" replace />
  return <Layout />
}

export default function App() {
  return (
    <AuthProvider>
      <HashRouter>
        <Suspense
          fallback={
            <div className="flex min-h-screen items-center justify-center gap-2 text-sm text-slate-400">
              <IconLock className="h-4 w-4 animate-pulse" /> Cargando…
            </div>
          }
        >
          <CarritoProvider>
            <Routes>
              {/* Rutas públicas del sitio de venta */}
              <Route path="/tienda" element={<Tienda />} />
              <Route path="/tienda/:slug" element={<TiendaPlataforma />} />
              <Route path="/carrito" element={<Carrito />} />
              <Route path="/checkout" element={<Checkout />} />
              <Route path="/registro" element={<Registro />} />
              <Route path="/ingreso" element={<Ingreso />} />
              <Route path="/login" element={<Login />} />
            <Route element={<Protegida />}>
              <Route index element={<Dashboard />} />
              <Route path="clientes" element={<Clientes />} />
              <Route path="suscripciones" element={<Suscripciones />} />
              <Route path="plataformas" element={<Plataformas />} />
              <Route path="planes" element={<Planes />} />
              <Route path="pedidos" element={<Pedidos />} />
              <Route path="cuentas-madre" element={<CuentasMadre />} />
              <Route path="proveedores" element={<Proveedores />} />
              <Route path="pagos" element={<Pagos />} />
              <Route path="comisiones" element={<Comisiones />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Routes>
        </CarritoProvider>
        </Suspense>
      </HashRouter>
    </AuthProvider>
  )
}