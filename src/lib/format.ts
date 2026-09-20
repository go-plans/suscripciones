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

// Las fechas tipo date ('YYYY-MM-DD') vienen UTC de la BD; en Venezuela (UTC-4)
// show un día antes si se parsean con new Date(iso). Se construyen en hora local.
const DATE_ONLY = /^(\d{4})-(\d{2})-(\d{2})$/

const dateLocal = (iso: string): Date => {
  const m = iso.match(DATE_ONLY)
  if (m) {
    const [, y, mo, d] = m
    return new Date(Number(y), Number(mo) - 1, Number(d), 12) // mediodía local
  }
  return new Date(iso)
}

export const fmtDate = (iso: string): string =>
  new Intl.DateTimeFormat(locale, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(dateLocal(iso))

export const fmtDateTime = (iso: string): string =>
  new Intl.DateTimeFormat(locale, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(dateLocal(iso))

// Fecha local (no UTC): en Venezuela (UTC-4) a partir de las 20:00 la
// fecha UTC es la del día siguiente y habría pagos mal fechados.
export const hoy = (): string => {
  const d = new Date()
  const mes = String(d.getMonth() + 1).padStart(2, '0')
  const dia = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${mes}-${dia}`
}

export const round2 = (n: number): number => Math.round(n * 100) / 100