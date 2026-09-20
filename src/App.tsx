import { lazy, Suspense } from 'react'
import { HashRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider, useAuth } from './lib/auth'
import Layout from './components/Layout'
import { IconLock } from './components/icons'

// Carga perezosa: cada página se compila al visitarse (app inicial más rápida)
const Login = lazy(() => import('./pages/Login'))
const Dashboard = lazy(() => import('./pages/Dashboard'))
const Clientes = lazy(() => import('./pages/Clientes'))
const Suscripciones = lazy(() => import('./pages/Suscripciones'))
const Plataformas = lazy(() => import('./pages/Plataformas'))
const CuentasMadre = lazy(() => import('./pages/CuentasMadre'))
const Proveedores = lazy(() => import('./pages/Proveedores'))
const Pagos = lazy(() => import('./pages/Pagos'))
const Comisiones = lazy(() => import('./pages/Comisiones'))

// Guard: sin sesión activa nadie llega al panel (todas sus llamadas usan
// la anon key y el RLS de la BD solo deja actuar al admin autenticado).
function Protegida() {
  const { session, cargando } = useAuth()
  if (cargando)
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-slate-400">
        Verificando sesión…
      </div>
    )
  if (!session) return <Navigate to="/login" replace />
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
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route element={<Protegida />}>
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
      </HashRouter>
    </AuthProvider>
  )
}