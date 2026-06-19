// Cliente para fal.ai (nano-banana / Gemini 2.5 Flash Image edit).
//
// Primer paso del flujo de video: toma la selfie + un prompt de estilización y
// devuelve una imagen estilizada (9:16) que preserva la identidad de la
// persona. Esa imagen se usa después como cuadro de referencia para animar el
// video con pixverse. Comparado con Flux Kontext, nano-banana/edit conserva
// mucho mejor la cara y el género cuando el estilo cambia (Pixar / caricatura).

const APP_NAMESPACE = 'fal-ai/nano-banana';
const MODEL_PATH = 'edit';

const SUBMIT_URL = `https://queue.fal.run/${APP_NAMESPACE}/${MODEL_PATH}`;
const REQUESTS_BASE = `https://queue.fal.run/${APP_NAMESPACE}/requests`;

const POLL_INTERVAL_MS = 1500;
const POLL_TIMEOUT_MS = 120_000;

export const IMAGE_MODEL = `${APP_NAMESPACE}/${MODEL_PATH}`;

export class ImageError extends Error {
  constructor(message: string, public readonly status?: string) {
    super(message);
    this.name = 'ImageError';
  }
}

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
  /** JPEG bytes — used for the in-page blurred <img> preview via createObjectURL. */
  blob: Blob;
  /** Public fal.media URL. */
  url: string;
  /** Base64 of the generated JPEG, no `data:` prefix — feeds the video step. */
  base64: string;
}

// Cache reference data URLs across generations — same files every time,
// no point re-fetching/re-encoding them.
const referenceDataUrlCache = new Map<string, Promise<string>>();

function getReferenceDataUrl(url: string, friendlyName: string): Promise<string> {
  const cached = referenceDataUrlCache.get(url);
  if (cached) return cached;
  const p = (async () => {
    const resp = await fetch(url);
    if (!resp.ok) {
      throw new ImageError(
        `No pude cargar la referencia de ${friendlyName} (${resp.status}) — verificá public${url}.`,
      );
    }
    const blob = await resp.blob();
    return await blobToDataUrl(blob);
  })();
  referenceDataUrlCache.set(url, p);
  return p;
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('No pude leer la imagen.'));
    reader.readAsDataURL(blob);
  });
}

/** Strip the `data:...;base64,` prefix and return the raw base64 payload. */
function dataUrlToBase64(dataUrl: string): string {
  const comma = dataUrl.indexOf(',');
  return comma === -1 ? dataUrl : dataUrl.slice(comma + 1);
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
  const image_urls = [photoDataUrl];
  if (extraDataUrl) {
    image_urls.push(extraDataUrl);
  } else {
    // nano-banana/edit locks identity noticeably better when it receives more
    // than one input image (multi-image "edit/compose" mode). When there is no
    // extra reference object, re-send the user photo as a second anchor so the
    // face stays faithful instead of being freely re-imagined.
    image_urls.push(photoDataUrl);
  }

  const submit = await fetch(SUBMIT_URL, {
    method: 'POST',
    headers: {
      ...authHeaders(apiKey),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      prompt,
      image_urls,
      num_images: 1,
      output_format: 'jpeg',
      aspect_ratio: '9:16',
    }),
    signal,
  });

  if (!submit.ok) {
    const text = await submit.text().catch(() => '');
    if (submit.status === 401 || submit.status === 403) {
      throw new ImageError('API key inválida o sin permisos. Revisá tu clave en fal.ai/dashboard/keys.');
    }
    throw new ImageError(
      `Falló el envío a fal.ai (${submit.status}): ${text || submit.statusText}`
    );
  }

  const { request_id } = (await submit.json()) as SubmitResponse;
  if (!request_id) {
    throw new ImageError('Respuesta inesperada de fal.ai: falta request_id.');
  }

  await waitUntilDone(request_id, apiKey, signal);

  const resultUrl = await fetchResultSampleUrl(request_id, apiKey, signal);

  const imgResp = await fetch(resultUrl, { signal });
  if (!imgResp.ok) {
    throw new ImageError(`No pude descargar la imagen generada (${imgResp.status}).`);
  }
  const blob = await imgResp.blob();
  const base64 = dataUrlToBase64(await blobToDataUrl(blob));
  return { blob, url: resultUrl, base64 };
}

async function waitUntilDone(
  requestId: string,
  apiKey: string,
  signal: AbortSignal | undefined
): Promise<void> {
  const statusUrl = `${REQUESTS_BASE}/${requestId}/status`;
  const start = Date.now();

  while (Date.now() - start < POLL_TIMEOUT_MS) {
    if (signal?.aborted) throw new DOMException('Aborted', 'AbortError');

    const resp = await fetch(statusUrl, { headers: authHeaders(apiKey), signal });
    if (!resp.ok) {
      throw new ImageError(`Polling de estado falló (${resp.status}): ${resp.statusText}`);
    }
    const body = (await resp.json()) as StatusResponse;

    switch (body.status) {
      case 'COMPLETED':
        return;
      case 'FAILED':
        throw new ImageError('fal.ai reportó FAILED al generar la imagen.', body.status);
      case 'IN_QUEUE':
      case 'IN_PROGRESS':
      default:
        await sleep(POLL_INTERVAL_MS, signal);
        break;
    }
  }

  throw new ImageError('Timeout esperando la imagen (más de 120s).');
}

async function fetchResultSampleUrl(
  requestId: string,
  apiKey: string,
  signal: AbortSignal | undefined
): Promise<string> {
  const resp = await fetch(`${REQUESTS_BASE}/${requestId}`, {
    headers: authHeaders(apiKey),
    signal,
  });
  if (!resp.ok) {
    throw new ImageError(`No pude leer el resultado (${resp.status}): ${resp.statusText}`);
  }
  const body = (await resp.json()) as ResultResponse;

  // fal.ai's NSFW detector has heavy false-positive rates on portrait
  // generations (close-ups). Since the user has already been charged once the
  // result comes back, we log the flag and still show the image rather than
  // throwing the credits away.
  if (body.has_nsfw_concepts?.some(Boolean)) {
    console.warn('[fal] has_nsfw_concepts flagged but showing image anyway', body.has_nsfw_concepts);
  }
  const first = body.images?.[0]?.url;
  if (!first) {
    throw new ImageError(
      body.error || body.detail || 'Resultado sin imagen — probá de nuevo.'
    );
  }
  return first;
}

function sleep(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(new DOMException('Aborted', 'AbortError'));
      return;
    }
    const t = setTimeout(() => {
      signal?.removeEventListener('abort', onAbort);
      resolve();
    }, ms);
    const onAbort = () => {
      clearTimeout(t);
      reject(new DOMException('Aborted', 'AbortError'));
    };
    signal?.addEventListener('abort', onAbort);
  });
}
