import { NavLink, Outlet } from 'react-router-dom'

const nav = [
  { to: '/', label: 'Dashboard', icon: '📊' },
  { to: '/clientes', label: 'Clientes', icon: '👥' },
  { to: '/suscripciones', label: 'Suscripciones', icon: '📦' },
  { to: '/cuentas-madre', label: 'Cuentas madre', icon: '🗄️' },
  { to: '/proveedores', label: 'Proveedores', icon: '🤝' },
  { to: '/pagos', label: 'Pagos', icon: '💳' },
  { to: '/comisiones', label: 'Comisiones', icon: '💰' },
]

export default function Layout() {
  return (
    <div className="flex min-h-screen">
      <aside className="w-60 shrink-0 border-r border-slate-200 bg-white">
        <div className="border-b border-slate-200 px-5 py-4">
          <h1 className="text-base font-bold text-slate-900">Suscripciones</h1>
          <p className="text-xs text-slate-400">Panel administrativo</p>
        </div>
        <nav className="space-y-1 p-3">
          {nav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-indigo-50 text-indigo-700'
                    : 'text-slate-600 hover:bg-slate-100'
                }`
              }
            >
              <span>{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>
      <main className="flex-1 p-6">
        <Outlet />
      </main>
    </div>
  )
}