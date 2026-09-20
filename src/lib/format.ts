// Formateadores de moneda y fecha (es-VE)
// Convención del negocio: punto para miles, coma para decimales.
// Símbolos: USD, VES (no "Bs.S"), USDT.

const locale = 'es-VE'

const money = (currency: string) =>
  new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    currencyDisplay: 'code',
  })

export const fmtUSD = (n: number | string | null | undefined): string =>
  money('USD').format(Number(n ?? 0))

export const fmtVES = (n: number | string | null | undefined): string =>
  money('VES').format(Number(n ?? 0))

export const fmtUSDT = (n: number | string | null | undefined): string =>
  `USDT ${new Intl.NumberFormat(locale, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(n ?? 0))}`

export const fmtNum = (n: number | string | null | undefined, decimals = 2): string =>
  new Intl.NumberFormat(locale, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(Number(n ?? 0))

export const fmtDate = (iso: string): string =>
  new Intl.DateTimeFormat(locale, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(iso))

export const fmtDateTime = (iso: string): string =>
  new Intl.DateTimeFormat(locale, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(iso))

export const hoy = (): string => new Date().toISOString().slice(0, 10)

export const round2 = (n: number): number => Math.round(n * 100) / 100