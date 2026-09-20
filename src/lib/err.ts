// Mensaje de error robusto a partir de cualquier excepción
export const errMsg = (e: unknown): string =>
  (e as { message?: string })?.message ?? 'Error desconocido'