// Cliente para fal.ai (pixverse v4.5 / image-to-video).
//
// Segundo paso del flujo: toma `prompt` + una sola `image_url` (la imagen YA
// estilizada por nano-banana) y la anima en un clip de 5 segundos SIN audio.
// pixverse usa la imagen como primer cuadro; el estilo y la escena ya vienen
// resueltos en la imagen, así que el prompt solo describe el movimiento. El
// aspect ratio (9:16) sale de la propia imagen.

const SUBMIT_URL = 'https://queue.fal.run/fal-ai/pixverse/v4.5/image-to-video';

const POLL_INTERVAL_MS = 3000;
const POLL_TIMEOUT_MS = 360_000; // el video tarda bastante más que un modelo de imagen

export const VIDEO_MODEL = 'fal-ai/pixverse/v4.5/image-to-video';

export class VideoError extends Error {
  constructor(
    message: string,
    public readonly status?: string,
    public readonly httpStatus?: number
  ) {
    super(message);
    this.name = 'VideoError';
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

interface ResultVideo {
  url: string;
  content_type?: string;
  file_name?: string;
  file_size?: number;
}

interface ResultResponse {
  video?: ResultVideo;
  detail?: string;
  error?: string;
}

interface GenerateArgs {
  apiKey: string;
  prompt: string;
  /** Base64-encoded JPEG/PNG, no `data:` prefix. La imagen YA estilizada. */
  inputImageBase64: string;
  signal?: AbortSignal;
}

function authHeaders(apiKey: string): HeadersInit {
  return {
    Authorization: `Key ${apiKey}`,
    Accept: 'application/json',
  };
}

export interface GenerateResult {
  /** MP4 bytes — used for the in-page <video> preview via createObjectURL. */
  blob: Blob;
  /** Public fal.media URL — encode this into the phone-scannable QR. */
  url: string;
}

export async function generateVideo(args: GenerateArgs): Promise<GenerateResult> {
  // fal/veo's content moderation produces non-deterministic 422s — the same
  // selfie+prompt sometimes passes on a retry. One automatic retry, then we
  // surface the error to the user.
  try {
    return await generateVideoOnce(args);
  } catch (err) {
    if (
      err instanceof VideoError &&
      err.httpStatus === 422 &&
      !args.signal?.aborted
    ) {
      return await generateVideoOnce(args);
    }
    throw err;
  }
}

async function generateVideoOnce({
  apiKey,
  prompt,
  inputImageBase64,
  signal,
}: GenerateArgs): Promise<GenerateResult> {
  const image_url = `data:image/jpeg;base64,${inputImageBase64}`;

  const submit = await fetch(SUBMIT_URL, {
    method: 'POST',
    headers: {
      ...authHeaders(apiKey),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      prompt,
      image_url,
      // pixverse v4.5 image-to-video: duración mínima 5s; el aspect ratio (9:16)
      // sale de la imagen, no es un parámetro. No genera audio.
      duration: '5',
      resolution: '720p',
      negative_prompt:
        'extra fingers, warped hands, flickering, watermark, text',
    }),
    signal,
  });

  if (!submit.ok) {
    const text = await submit.text().catch(() => '');
    if (submit.status === 401 || submit.status === 403) {
      throw new VideoError('API key inválida o sin permisos. Revisá tu clave en fal.ai/dashboard/keys.');
    }
    throw new VideoError(
      `Falló el envío a fal.ai (${submit.status}): ${text || submit.statusText}`,
      undefined,
      submit.status
    );
  }

  const submitBody = (await submit.json()) as SubmitResponse;
  if (!submitBody.request_id) {
    throw new VideoError('Respuesta inesperada de fal.ai: falta request_id.');
  }

  // veo expone una ruta anidada — usamos las URLs que devuelve el submit en vez
  // de construirlas a mano.
  const statusUrl = submitBody.status_url ?? `${SUBMIT_URL}/requests/${submitBody.request_id}/status`;
  const resultEndpoint = submitBody.response_url ?? `${SUBMIT_URL}/requests/${submitBody.request_id}`;

  await waitUntilDone(statusUrl, apiKey, signal);

  const resultUrl = await fetchResultVideoUrl(resultEndpoint, apiKey, signal);

  const videoResp = await fetch(resultUrl, { signal });
  if (!videoResp.ok) {
    throw new VideoError(`No pude descargar el video generado (${videoResp.status}).`);
  }
  const blob = await videoResp.blob();
  return { blob, url: resultUrl };
}

async function waitUntilDone(
  statusUrl: string,
  apiKey: string,
  signal: AbortSignal | undefined
): Promise<void> {
  const start = Date.now();

  while (Date.now() - start < POLL_TIMEOUT_MS) {
    if (signal?.aborted) throw new DOMException('Aborted', 'AbortError');

    const resp = await fetch(statusUrl, { headers: authHeaders(apiKey), signal });
    if (!resp.ok) {
      throw new VideoError(`Polling de estado falló (${resp.status}): ${resp.statusText}`);
    }
    const body = (await resp.json()) as StatusResponse;

    switch (body.status) {
      case 'COMPLETED':
        return;
      case 'FAILED':
        throw new VideoError('fal.ai reportó FAILED al generar el video.', body.status);
      case 'IN_QUEUE':
      case 'IN_PROGRESS':
      default:
        await sleep(POLL_INTERVAL_MS, signal);
        break;
    }
  }

  throw new VideoError('Timeout esperando el video (más de 6 minutos).');
}

async function fetchResultVideoUrl(
  resultEndpoint: string,
  apiKey: string,
  signal: AbortSignal | undefined
): Promise<string> {
  const resp = await fetch(resultEndpoint, {
    headers: authHeaders(apiKey),
    signal,
  });
  if (!resp.ok) {
    throw new VideoError(`No pude leer el resultado (${resp.status}): ${resp.statusText}`);
  }
  const body = (await resp.json()) as ResultResponse;

  const url = body.video?.url;
  if (!url) {
    throw new VideoError(
      body.error || body.detail || 'Resultado sin video — probá de nuevo.'
    );
  }
  return url;
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
