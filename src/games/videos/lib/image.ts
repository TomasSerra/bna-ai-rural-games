// Primer paso del flujo de video: estiliza la selfie con nano-banana/edit.

import {
  GenerationServiceError,
  generationFetch,
  httpGenerationError,
  parseGenerationJson,
  stringifyGenerationPayload,
} from '@shared/lib/errors';

const APP_NAMESPACE = 'fal-ai/nano-banana';
const MODEL_PATH = 'edit';

const SUBMIT_URL = `https://queue.fal.run/${APP_NAMESPACE}/${MODEL_PATH}`;
const REQUESTS_BASE = `https://queue.fal.run/${APP_NAMESPACE}/requests`;

const POLL_INTERVAL_MS = 1500;
const POLL_TIMEOUT_MS = 120_000;

export const IMAGE_MODEL = `${APP_NAMESPACE}/${MODEL_PATH}`;

interface SubmitResponse {
  request_id: string;
  status_url?: string;
  response_url?: string;
}

type FalStatus = 'IN_QUEUE' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';

interface StatusResponse {
  status: FalStatus;
  queue_position?: number;
  logs?: unknown[];
}

interface ResultImage {
  url: string;
  width?: number;
  height?: number;
  content_type?: string;
}

interface ResultResponse {
  images?: ResultImage[];
  has_nsfw_concepts?: boolean[];
  detail?: string;
  error?: string;
}

interface GenerateArgs {
  apiKey: string;
  prompt: string;
  /** Base64-encoded JPEG/PNG, no `data:` prefix. */
  inputImageBase64: string;
  /** Optional reference image (e.g. mate gourd). Public path under /public. */
  extraReferenceUrl?: string | null;
  signal?: AbortSignal;
}

function authHeaders(apiKey: string): HeadersInit {
  return {
    Authorization: `Key ${apiKey}`,
    Accept: 'application/json',
  };
}

export interface GenerateImageResult {
  blob: Blob;
  url: string;
  /** Base64, sin prefijo data:, que alimenta el paso de video. */
  base64: string;
}

const referenceDataUrlCache = new Map<string, Promise<string>>();

function getReferenceDataUrl(url: string, friendlyName: string): Promise<string> {
  const cached = referenceDataUrlCache.get(url);
  if (cached) return cached;
  const promise = (async () => {
    const response = await generationFetch('IMG', 'REF', url);
    if (!response.ok) {
      const detail = await response.text().catch(() => '');
      throw httpGenerationError('IMG', 'REF', response, detail);
    }
    let blob: Blob;
    try {
      blob = await response.blob();
    } catch (cause) {
      throw new GenerationServiceError(`No pude leer la referencia de ${friendlyName}.`, {
        target: 'IMG',
        stage: 'DECODE',
        reason: 'INVALID',
        cause,
      });
    }
    return await blobToDataUrl(blob);
  })();
  referenceDataUrlCache.set(url, promise);
  return promise;
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string' && reader.result.includes(',')) {
        resolve(reader.result);
        return;
      }
      reject(new GenerationServiceError('La imagen decodificada está vacía.', {
        target: 'IMG',
        stage: 'DECODE',
        reason: 'EMPTY',
      }));
    };
    reader.onerror = () => reject(new GenerationServiceError('No pude decodificar la imagen.', {
      target: 'IMG',
      stage: 'DECODE',
      reason: 'INVALID',
      cause: reader.error,
    }));
    reader.readAsDataURL(blob);
  });
}

function dataUrlToBase64(dataUrl: string): string {
  return dataUrl.slice(dataUrl.indexOf(',') + 1);
}

export async function generateImage({
  apiKey,
  prompt,
  inputImageBase64,
  extraReferenceUrl,
  signal,
}: GenerateArgs): Promise<GenerateImageResult> {
  const extraDataUrl = extraReferenceUrl
    ? await getReferenceDataUrl(extraReferenceUrl, 'la referencia del objeto')
    : null;

  const photoDataUrl = `data:image/jpeg;base64,${inputImageBase64}`;
  const image_urls = [photoDataUrl, extraDataUrl ?? photoDataUrl];

  const submit = await generationFetch('IMG', 'SUBMIT', SUBMIT_URL, {
    method: 'POST',
    headers: {
      ...authHeaders(apiKey),
      'Content-Type': 'application/json',
    },
    body: stringifyGenerationPayload('IMG', {
      prompt,
      image_urls,
      num_images: 1,
      output_format: 'jpeg',
      aspect_ratio: '9:16',
    }),
    signal,
  });

  if (!submit.ok) {
    const detail = await submit.text().catch(() => '');
    throw httpGenerationError('IMG', 'SUBMIT', submit, detail);
  }

  const submitBody = await parseGenerationJson<SubmitResponse>('IMG', 'SUBMIT', submit);
  if (!submitBody.request_id) {
    throw new GenerationServiceError('La respuesta no incluyó request_id.', {
      target: 'IMG',
      stage: 'SUBMIT',
      reason: 'EMPTY',
    });
  }
  const requestId = submitBody.request_id;

  await waitUntilDone(requestId, apiKey, signal);
  const resultUrl = await fetchResultImageUrl(requestId, apiKey, signal);

  const imageResponse = await generationFetch('IMG', 'DOWNLOAD', resultUrl, { signal }, requestId);
  if (!imageResponse.ok) {
    const detail = await imageResponse.text().catch(() => '');
    throw httpGenerationError('IMG', 'DOWNLOAD', imageResponse, detail, requestId);
  }

  let blob: Blob;
  try {
    blob = await imageResponse.blob();
  } catch (cause) {
    throw new GenerationServiceError('No pude leer los bytes de la imagen generada.', {
      target: 'IMG',
      stage: 'DECODE',
      reason: 'INVALID',
      requestId,
      cause,
    });
  }
  const base64 = dataUrlToBase64(await blobToDataUrl(blob));
  if (!base64) {
    throw new GenerationServiceError('La imagen generada está vacía.', {
      target: 'IMG',
      stage: 'DECODE',
      reason: 'EMPTY',
      requestId,
    });
  }
  return { blob, url: resultUrl, base64 };
}

async function waitUntilDone(
  requestId: string,
  apiKey: string,
  signal: AbortSignal | undefined,
): Promise<void> {
  const statusUrl = `${REQUESTS_BASE}/${requestId}/status`;
  const start = Date.now();

  while (Date.now() - start < POLL_TIMEOUT_MS) {
    if (signal?.aborted) throw new DOMException('Aborted', 'AbortError');

    const response = await generationFetch(
      'IMG',
      'POLL',
      statusUrl,
      { headers: authHeaders(apiKey), signal },
      requestId,
    );
    if (!response.ok) {
      const detail = await response.text().catch(() => '');
      throw httpGenerationError('IMG', 'POLL', response, detail, requestId);
    }
    const body = await parseGenerationJson<StatusResponse>('IMG', 'POLL', response, requestId);

    switch (body.status) {
      case 'COMPLETED':
        return;
      case 'FAILED':
        throw new GenerationServiceError('fal.ai reportó FAILED al generar la imagen.', {
          target: 'IMG',
          stage: 'POLL',
          reason: 'FAILED',
          requestId,
        });
      case 'IN_QUEUE':
      case 'IN_PROGRESS':
        await sleep(POLL_INTERVAL_MS, signal);
        break;
      default:
        throw new GenerationServiceError('fal.ai devolvió un estado desconocido.', {
          target: 'IMG',
          stage: 'POLL',
          reason: 'INVALID',
          requestId,
          detail: String(body.status),
        });
    }
  }

  throw new GenerationServiceError('Timeout esperando la imagen.', {
    target: 'IMG',
    stage: 'POLL',
    reason: 'TIMEOUT',
    requestId,
  });
}

async function fetchResultImageUrl(
  requestId: string,
  apiKey: string,
  signal: AbortSignal | undefined,
): Promise<string> {
  const response = await generationFetch(
    'IMG',
    'RESULT',
    `${REQUESTS_BASE}/${requestId}`,
    { headers: authHeaders(apiKey), signal },
    requestId,
  );
  if (!response.ok) {
    const detail = await response.text().catch(() => '');
    throw httpGenerationError('IMG', 'RESULT', response, detail, requestId);
  }
  const body = await parseGenerationJson<ResultResponse>('IMG', 'RESULT', response, requestId);

  if (body.has_nsfw_concepts?.some(Boolean)) {
    console.warn('[fal] has_nsfw_concepts flagged but showing image anyway');
  }
  const url = body.images?.[0]?.url;
  if (!url) {
    throw new GenerationServiceError('El resultado no incluyó una imagen.', {
      target: 'IMG',
      stage: 'RESULT',
      reason: 'EMPTY',
      requestId,
      detail: body.error || body.detail,
    });
  }
  return url;
}

function sleep(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(new DOMException('Aborted', 'AbortError'));
      return;
    }
    const timer = setTimeout(() => {
      signal?.removeEventListener('abort', onAbort);
      resolve();
    }, ms);
    const onAbort = () => {
      clearTimeout(timer);
      reject(new DOMException('Aborted', 'AbortError'));
    };
    signal?.addEventListener('abort', onAbort);
  });
}
