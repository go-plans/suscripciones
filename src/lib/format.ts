// Formateadores de moneda y fecha (es-VE)

export const fmtUSD = (n: number | string | null | undefined): string =>
  new Intl.NumberFormat('es-VE', {
    style: 'currency',
    currency: 'USD',
  }).format(Number(n ?? 0))

export const fmtBS = (n: number | string | null | undefined): string =>
  new Intl.NumberFormat('es-VE', {
    style: 'currency',
    currency: 'VES',
    maximumFractionDigits: 2,
  }).format(Number(n ?? 0))

export const fmtDate = (iso: string): string =>
  new Intl.DateTimeFormat('es-VE', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(iso))

export const fmtDateTime = (iso: string): string =>
  new Intl.DateTimeFormat('es-VE', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(iso))

export const hoy = (): string => new Date().toISOString().slice(0, 10)

export const round2 = (n: number): number => Math.round(n * 100) / 100