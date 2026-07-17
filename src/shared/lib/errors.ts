export type GenerationTarget = 'IMG' | 'VID';
export type GenerationStage = 'REF' | 'SUBMIT' | 'POLL' | 'RESULT' | 'DOWNLOAD' | 'DECODE';
export type GenerationErrorReason =
  | 'NETWORK'
  | 'AUTH'
  | 'RATE'
  | 'PAYLOAD'
  | 'INPUT'
  | 'HTTP'
  | 'FAILED'
  | 'TIMEOUT'
  | 'EMPTY'
  | 'INVALID';

interface GenerationServiceErrorOptions {
  target: GenerationTarget;
  stage: GenerationStage;
  reason: GenerationErrorReason;
  httpStatus?: number;
  detail?: string;
  requestId?: string;
  cause?: unknown;
}

function sanitizeDiagnosticDetail(detail: string | undefined): string | undefined {
  if (!detail) return detail;
  return detail
    .replace(/data:[^;\s]+;base64,[a-z0-9+/=]+/gi, '[data URL omitida]')
    .replace(/\bfal_[a-z0-9_-]+\b/gi, '[API key omitida]')
    .slice(0, 2000);
}

export function reasonFromHttpStatus(status: number): GenerationErrorReason {
  if (status === 401 || status === 403) return 'AUTH';
  if (status === 408) return 'TIMEOUT';
  if (status === 413) return 'PAYLOAD';
  if (status === 422) return 'INPUT';
  if (status === 429) return 'RATE';
  return 'HTTP';
}

export class GenerationServiceError extends Error {
  readonly target: GenerationTarget;
  readonly stage: GenerationStage;
  readonly reason: GenerationErrorReason;
  readonly httpStatus?: number;
  readonly detail?: string;
  readonly requestId?: string;
  readonly code: string;

  constructor(message: string, options: GenerationServiceErrorOptions) {
    super(message, { cause: options.cause });
    this.name = 'GenerationServiceError';
    this.target = options.target;
    this.stage = options.stage;
    this.reason = options.reason;
    this.httpStatus = options.httpStatus;
    this.detail = sanitizeDiagnosticDetail(options.detail);
    this.requestId = options.requestId;
    this.code = [options.target, options.stage, options.reason, options.httpStatus]
      .filter((part) => part !== undefined)
      .join('-');
  }
}

export function httpGenerationError(
  target: GenerationTarget,
  stage: GenerationStage,
  response: Response,
  detail?: string,
  requestId?: string,
): GenerationServiceError {
  return new GenerationServiceError(
    `La solicitud falló con HTTP ${response.status} en ${stage}.`,
    {
      target,
      stage,
      reason: reasonFromHttpStatus(response.status),
      httpStatus: response.status,
      detail: detail || response.statusText,
      requestId,
    },
  );
}

export function fetchGenerationError(
  target: GenerationTarget,
  stage: GenerationStage,
  cause: unknown,
  requestId?: string,
): GenerationServiceError {
  return new GenerationServiceError(`Falló la conexión en ${stage}.`, {
    target,
    stage,
    reason: 'NETWORK',
    detail: cause instanceof Error ? cause.message : String(cause),
    requestId,
    cause,
  });
}

export async function generationFetch(
  target: GenerationTarget,
  stage: GenerationStage,
  input: RequestInfo | URL,
  init?: RequestInit,
  requestId?: string,
): Promise<Response> {
  try {
    return await fetch(input, init);
  } catch (cause) {
    throw fetchGenerationError(target, stage, cause, requestId);
  }
}

export async function parseGenerationJson<T>(
  target: GenerationTarget,
  stage: GenerationStage,
  response: Response,
  requestId?: string,
): Promise<T> {
  try {
    return (await response.json()) as T;
  } catch (cause) {
    throw new GenerationServiceError(`La respuesta de ${stage} no contiene JSON válido.`, {
      target,
      stage,
      reason: 'INVALID',
      requestId,
      detail: cause instanceof Error ? cause.message : String(cause),
      cause,
    });
  }
}

export function stringifyGenerationPayload(
  target: GenerationTarget,
  payload: unknown,
): string {
  try {
    return JSON.stringify(payload);
  } catch (cause) {
    throw new GenerationServiceError('No se pudo preparar el pedido de generación.', {
      target,
      stage: 'SUBMIT',
      reason: 'INVALID',
      detail: cause instanceof Error ? cause.message : String(cause),
      cause,
    });
  }
}

export type FriendlyErrorKind =
  | 'connection'
  | 'authentication'
  | 'rate-limit'
  | 'input'
  | 'timeout'
  | 'server'
  | 'response'
  | 'unknown';

export interface FriendlyError {
  kind: FriendlyErrorKind;
  title: string;
  description: string;
  code: string;
}

function friendlyGenerationError(err: GenerationServiceError): FriendlyError {
  switch (err.reason) {
    case 'NETWORK':
      return {
        kind: 'connection',
        title: 'Sin conexión',
        description: 'No pudimos comunicarnos con el servicio. Revisá internet y probá de nuevo.',
        code: err.code,
      };
    case 'AUTH':
      return {
        kind: 'authentication',
        title: 'Problema con la clave',
        description: 'La API key es inválida, venció o no tiene permisos para este modelo.',
        code: err.code,
      };
    case 'RATE':
      return {
        kind: 'rate-limit',
        title: 'Demasiadas solicitudes',
        description: 'El servicio alcanzó su límite temporal. Esperá un momento y reintentá.',
        code: err.code,
      };
    case 'PAYLOAD':
      return {
        kind: 'input',
        title: 'Imagen demasiado pesada',
        description: 'El servicio rechazó el tamaño de la imagen enviada.',
        code: err.code,
      };
    case 'INPUT':
      return {
        kind: 'input',
        title: 'Contenido rechazado',
        description: 'El servicio rechazó la imagen o los parámetros de generación.',
        code: err.code,
      };
    case 'TIMEOUT':
      return {
        kind: 'timeout',
        title: 'La generación tardó demasiado',
        description: 'Se agotó el tiempo de espera. Probá nuevamente.',
        code: err.code,
      };
    case 'FAILED':
      return {
        kind: 'server',
        title: 'La generación falló',
        description: 'El modelo no pudo completar esta generación. Probá nuevamente.',
        code: err.code,
      };
    case 'HTTP':
      return err.httpStatus !== undefined && err.httpStatus >= 500
        ? {
            kind: 'server',
            title: 'Problema en el servidor',
            description: 'El servicio no está respondiendo correctamente. Probá de nuevo.',
            code: err.code,
          }
        : {
            kind: 'response',
            title: 'Solicitud rechazada',
            description: 'El servicio respondió con un error inesperado.',
            code: err.code,
          };
    case 'EMPTY':
    case 'INVALID':
      return {
        kind: 'response',
        title: 'Respuesta inválida',
        description: 'El servicio respondió sin el resultado esperado.',
        code: err.code,
      };
  }
}

export function toFriendlyError(err: unknown): FriendlyError {
  if (err instanceof GenerationServiceError) return friendlyGenerationError(err);

  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    return {
      kind: 'connection',
      title: 'Sin conexión',
      description: 'No pudimos conectarnos. Revisá internet y probá de nuevo.',
      code: 'UNKNOWN',
    };
  }

  return {
    kind: 'unknown',
    title: 'Algo salió mal',
    description: 'Ocurrió un error inesperado. Probá de nuevo.',
    code: 'UNKNOWN',
  };
}
