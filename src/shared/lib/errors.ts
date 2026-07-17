// Mapea cualquier error del flujo de generación (imagen/video) a un mensaje
// amigable para el usuario del kiosco, sin filtrar detalles técnicos (códigos
// HTTP, URLs, "fal.ai", request_id, timeouts en ms, etc.).

export type FriendlyErrorKind = 'connection' | 'server' | 'unknown';

export interface FriendlyError {
  kind: FriendlyErrorKind;
  title: string;
  description: string;
}

// Errores de dominio de la app: representan un fallo del lado del servicio de
// generación (HTTP 4xx/5xx, FAILED, timeout). Se detectan por `name` para no
// acoplar este módulo a las tres clases de error de cada juego.
const DOMAIN_ERROR_NAMES = new Set(['FluxError', 'ImageError', 'VideoError']);

/** ¿El error viene de que no hay conexión / falló el fetch en red? */
function isConnectionError(err: unknown): boolean {
  if (typeof navigator !== 'undefined' && navigator.onLine === false) return true;
  // Los fetch que fallan por red lanzan un TypeError (no una de nuestras clases).
  if (err instanceof TypeError) {
    const msg = err.message.toLowerCase();
    return (
      msg.includes('failed to fetch') ||
      msg.includes('load failed') ||
      msg.includes('network') ||
      msg.includes('networkerror')
    );
  }
  return false;
}

export function toFriendlyError(err: unknown): FriendlyError {
  if (isConnectionError(err)) {
    return {
      kind: 'connection',
      title: 'Sin conexión',
      description: 'No pudimos conectarnos. Revisá internet y probá de nuevo.',
    };
  }

  if (err instanceof Error && DOMAIN_ERROR_NAMES.has(err.name)) {
    return {
      kind: 'server',
      title: 'Problema en el servidor',
      description: 'El servicio no está respondiendo bien. Probá de nuevo en un momento.',
    };
  }

  return {
    kind: 'unknown',
    title: 'Algo salió mal',
    description: 'Ocurrió un error inesperado. Probá de nuevo.',
  };
}
