import { NavLink, Outlet } from 'react-router-dom'
import type { ComponentType } from 'react'
import { useAuth } from '../lib/auth'
import {
  IconCard,
  IconDashboard,
  IconLogout,
  IconPackage,
  IconPercent,
  IconServer,
  IconStore,
  IconUsers,
} from './icons'

const nav = [
  { to: '/', label: 'Dashboard', icon: IconDashboard, end: true },
  { to: '/clientes', label: 'Clientes', icon: IconUsers },
  { to: '/suscripciones', label: 'Suscripciones', icon: IconPackage },
  { to: '/plataformas', label: 'Plataformas', icon: IconStore },
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

export default function Layout() {
  const { session, salir } = useAuth()
  return (
    <div className="flex min-h-screen">
      <aside className="flex w-60 shrink-0 flex-col border-r border-slate-200 bg-white">
        <div className="border-b border-slate-200 px-5 py-4">
          <h1 className="text-base font-bold text-slate-900">Suscripciones</h1>
          <p className="text-xs text-slate-400">Panel administrativo</p>
        </div>
        <nav className="flex-1 space-y-1 p-3">
          {(nav as NavItem[]).map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
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
      <main className="min-w-0 flex-1 p-6">
        <Outlet />
      </main>
    </div>
  )
}