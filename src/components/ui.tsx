import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode, SelectHTMLAttributes } from 'react'
import { IconSearch, IconX } from './icons'

// ---------- Botones ----------
type BtnVariant = 'primary' | 'secondary' | 'danger' | 'ghost'

export function Button({
  variant = 'primary',
  className = '',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: BtnVariant }) {
  const styles: Record<BtnVariant, string> = {
    primary:
      'bg-indigo-600 text-white hover:bg-indigo-700 disabled:bg-indigo-300',
    secondary:
      'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50',
    danger: 'bg-rose-600 text-white hover:bg-rose-700',
    ghost: 'text-slate-600 hover:bg-slate-100',
  }
  return (
    <button
      className={`inline-flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed ${styles[variant]} ${className}`}
      {...props}
    />
  )
}

// ---------- Campos ----------
export function Input({ className = '', ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={`w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 ${className}`}
      {...props}
    />
  )
}

export function Select({ className = '', ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={`w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 ${className}`}
      {...props}
    />
  )
}

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block space-y-1">
      <span className="text-xs font-medium uppercase tracking-wide text-slate-500">
        {label}
      </span>
      {children}
    </label>
  )
}

// ---------- Tablas ----------
export function Table({ headers, children }: { headers: string[]; children: ReactNode }) {
  return (
    <div className="max-h-[72vh] overflow-auto rounded-xl border border-slate-200 bg-white shadow-sm">
      <table className="w-full min-w-max text-left text-sm">
        <thead className="sticky top-0 z-10 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
          <tr>
            {headers.map((h) => (
              <th key={h} className="border-b border-slate-200 bg-slate-50 px-4 py-3 font-semibold">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">{children}</tbody>
      </table>
    </div>
  )
}

export function Td({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <td className={`px-4 py-3 align-middle ${className}`}>{children}</td>
}

// ---------- Badges ----------
const badgeColors: Record<string, string> = {
  activa: 'bg-emerald-100 text-emerald-700',
  vencida: 'bg-rose-100 text-rose-700',
  cancelada: 'bg-slate-200 text-slate-600',
  suspendida: 'bg-amber-100 text-amber-700',
  baja: 'bg-slate-200 text-slate-600',
  pendiente: 'bg-amber-100 text-amber-700',
  liquidada: 'bg-emerald-100 text-emerald-700',
  admin: 'bg-purple-100 text-purple-700',
  agente: 'bg-sky-100 text-sky-700',
  cliente: 'bg-slate-200 text-slate-600',
  nuevo: 'bg-indigo-100 text-indigo-700',
  contactado: 'bg-amber-100 text-amber-700',
  completado: 'bg-emerald-100 text-emerald-700',
  cancelado: 'bg-slate-200 text-slate-600',
}

export function Badge({ value }: { value: string }) {
  const color = badgeColors[value] ?? 'bg-slate-200 text-slate-600'
  return (
    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${color}`}>
      {value}
    </span>
  )
}

// ---------- Tarjetas ----------
export function Card({ title, children }: { title?: string; children: ReactNode }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      {title ? (
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
          {title}
        </h2>
      ) : null}
      {children}
    </div>
  )
}

export function StatCard({
  label,
  value,
  hint,
}: {
  label: string
  value: string | number
  hint?: string
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-bold text-slate-900">{value}</p>
      {hint ? <p className="mt-1 text-xs text-slate-400">{hint}</p> : null}
    </div>
  )
}

// ---------- Modal ----------
export function Modal({
  open,
  title,
  onClose,
  children,
}: {
  open: boolean
  title: string
  onClose: () => void
  children: ReactNode
}) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-5 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
          <Button variant="ghost" onClick={onClose} aria-label="Cerrar">
            <IconX />
          </Button>
        </div>
        {children}
      </div>
    </div>
  )
}

// ---------- Estados de carga/error ----------
export function Loading() {
  return <p className="py-8 text-center text-sm text-slate-400">Cargando…</p>
}

export function ErrorMsg({ message }: { message: string }) {
  return (
    <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{message}</p>
  )
}

// ---------- Encabezado de página estándar ----------
export function PageHeader({
  title,
  subtitle,
  children,
}: {
  title: string
  subtitle?: string
  children?: ReactNode
}) {
  return (
    <header className="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h1 className="text-xl font-bold text-slate-900">{title}</h1>
        {subtitle ? <p className="text-sm text-slate-500">{subtitle}</p> : null}
      </div>
      {children}
    </header>
  )
}

// ---------- Búsqueda estándar ----------
export function Buscador({
  value,
  onChange,
  placeholder,
}: {
  value: string
  onChange: (v: string) => void
  placeholder?: string
}) {
  return (
    <div className="relative max-w-sm">
      <IconSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
      <Input
        className="pl-9"
        placeholder={placeholder ?? 'Buscar…'}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  )
}

// ---------- Estado vacío ----------
export function EmptyState({ message = 'Sin registros por ahora.' }: { message?: string }) {
  return <p className="py-8 text-center text-sm text-slate-400">{message}</p>
}

// ---------- Pie de modal estándar (Cancelar + Guardar) ----------
export function ModalFooter({
  onCancel,
  onSave,
  saveLabel = 'Guardar',
  disabled = false,
  guardando = false,
}: {
  onCancel: () => void
  onSave: () => void
  saveLabel?: string
  disabled?: boolean
  guardando?: boolean
}) {
  return (
    <div className="flex justify-end gap-2 pt-2">
      <Button variant="secondary" onClick={onCancel} disabled={guardando}>
        Cancelar
      </Button>
      <Button onClick={onSave} disabled={disabled || guardando}>
        {guardando ? 'Guardando…' : saveLabel}
      </Button>
    </div>
  )
}