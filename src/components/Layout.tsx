import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { useEffect, useState, type ComponentType } from 'react'
import { useAuth } from '../lib/auth'
import {
  IconCard,
  IconDashboard,
  IconInbox,
  IconList,
  IconLogout,
  IconMenu,
  IconPackage,
  IconPercent,
  IconServer,
  IconStore,
  IconUsers,
  IconX,
} from './icons'

const nav = [
  { to: '/', label: 'Dashboard', icon: IconDashboard, end: true },
  { to: '/clientes', label: 'Clientes', icon: IconUsers },
  { to: '/suscripciones', label: 'Suscripciones', icon: IconPackage },
  { to: '/pedidos', label: 'Pedidos', icon: IconInbox },
  { to: '/plataformas', label: 'Plataformas', icon: IconStore },
  { to: '/planes', label: 'Planes', icon: IconList },
  { to: '/cuentas-madre', label: 'Cuentas madre', icon: IconServer },
  { to: '/proveedores', label: 'Proveedores', icon: IconStore },
  { to: '/pagos', label: 'Pagos', icon: IconCard },
  { to: '/comisiones', label: 'Comisiones', icon: IconPercent },
]

interface NavItem {
  to: string
  label: string
  icon: ComponentType<{ className?: string }>
  end?: boolean
}

function NavList({ onClick }: { onClick?: () => void }) {
  return (
    <>
      {(nav as NavItem[]).map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.end}
          onClick={onClick}
          className={({ isActive }) =>
            `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
              isActive
                ? 'bg-indigo-50 text-indigo-700'
                : 'text-slate-600 hover:bg-slate-100'
            }`
          }
        >
          <item.icon className="h-[18px] w-[18px]" />
          {item.label}
        </NavLink>
      ))}
    </>
  )
}

export default function Layout() {
  const { session, salir } = useAuth()
  const [abierto, setAbierto] = useState(false)
  const location = useLocation()

  // Al navegar (móvil) se cierra el drawer automáticamente
  useEffect(() => setAbierto(false), [location.pathname])

  const cerrar = () => setAbierto(false)

  return (
    <div className="min-h-screen md:flex">
      {/* Barra superior (móvil) */}
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3 md:hidden">
        <button
          onClick={() => setAbierto(true)}
          className="rounded-lg p-2 text-slate-600 transition-colors hover:bg-slate-100"
          aria-label="Abrir menú"
        >
          <IconMenu className="h-6 w-6" />
        </button>
        <div className="text-center">
          <h1 className="text-base font-bold text-slate-900">Suscripciones</h1>
          <p className="text-xs text-slate-400">Panel administrativo</p>
        </div>
        <button
          onClick={() => void salir()}
          className="rounded-lg p-2 text-slate-600 transition-colors hover:bg-slate-100"
          aria-label="Cerrar sesión"
        >
          <IconLogout className="h-5 w-5" />
        </button>
      </header>

      {/* Drawer de navegación (móvil) */}
      {abierto ? (
        <div className="fixed inset-0 z-40 md:hidden">
          <div
            className="absolute inset-0 bg-slate-900/50"
            onClick={cerrar}
            aria-hidden="true"
          />
          <aside className="absolute inset-y-0 left-0 flex w-72 max-w-[85vw] flex-col border-r border-slate-200 bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
              <div>
                <h1 className="text-base font-bold text-slate-900">Suscripciones</h1>
                <p className="text-xs text-slate-400">Panel administrativo</p>
              </div>
              <button
                onClick={cerrar}
                className="rounded-lg p-2 text-slate-600 transition-colors hover:bg-slate-100"
                aria-label="Cerrar menú"
              >
                <IconX />
              </button>
            </div>
            <nav className="flex-1 space-y-1 overflow-y-auto p-3">
              <NavList onClick={cerrar} />
            </nav>
            <div className="border-t border-slate-200 p-3">
              <p className="truncate px-3 pb-2 text-xs text-slate-400">
                {session?.user?.email}
              </p>
              <button
                onClick={() => {
                  cerrar()
                  void salir()
                }}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100"
              >
                <IconLogout className="h-[18px] w-[18px]" />
                Cerrar sesión
              </button>
            </div>
          </aside>
        </div>
      ) : null}

      {/* Sidebar (escritorio) */}
      <aside className="hidden w-60 shrink-0 flex-col border-r border-slate-200 bg-white md:flex">
        <div className="border-b border-slate-200 px-5 py-4">
          <h1 className="text-base font-bold text-slate-900">Suscripciones</h1>
          <p className="text-xs text-slate-400">Panel administrativo</p>
        </div>
        <nav className="flex-1 space-y-1 p-3">
          <NavList />
        </nav>
        <div className="border-t border-slate-200 p-3">
          <p className="truncate px-3 pb-2 text-xs text-slate-400">{session?.user?.email}</p>
          <button
            onClick={() => void salir()}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100"
          >
            <IconLogout className="h-[18px] w-[18px]" />
            Cerrar sesión
          </button>
        </div>
      </aside>

      <main className="min-w-0 flex-1 p-4 md:p-6">
        <Outlet />
      </main>
    </div>
  )
}