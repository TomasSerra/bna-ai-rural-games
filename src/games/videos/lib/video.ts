// Segundo paso del flujo de video: anima la imagen estilizada con PixVerse.

import {
  GenerationServiceError,
  generationFetch,
  httpGenerationError,
  parseGenerationJson,
  stringifyGenerationPayload,
} from '@shared/lib/errors';

const SUBMIT_URL = 'https://queue.fal.run/fal-ai/pixverse/v4.5/image-to-video';

const POLL_INTERVAL_MS = 3000;
const POLL_TIMEOUT_MS = 360_000;

export const VIDEO_MODEL = 'fal-ai/pixverse/v4.5/image-to-video';

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
  /** Base64, sin prefijo data:, de la imagen ya estilizada. */
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
  blob: Blob;
  url: string;
}

export async function generateVideo(args: GenerateArgs): Promise<GenerateResult> {
  // La moderación de PixVerse puede responder 422 de forma no determinista.
  // Conservamos exactamente un reintento automático para ese caso.
  try {
    return await generateVideoOnce(args);
  } catch (err) {
    if (
      err instanceof GenerationServiceError
      && err.target === 'VID'
      && err.stage === 'SUBMIT'
      && err.httpStatus === 422
      && !args.signal?.aborted
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

  const submit = await generationFetch('VID', 'SUBMIT', SUBMIT_URL, {
    method: 'POST',
    headers: {
      ...authHeaders(apiKey),
      'Content-Type': 'application/json',
    },
    body: stringifyGenerationPayload('VID', {
      prompt,
      image_url,
      duration: '5',
      resolution: '720p',
      negative_prompt: 'extra fingers, warped hands, flickering, watermark, text',
    }),
    signal,
  });

  if (!submit.ok) {
    const detail = await submit.text().catch(() => '');
    throw httpGenerationError('VID', 'SUBMIT', submit, detail);
  }

  const submitBody = await parseGenerationJson<SubmitResponse>('VID', 'SUBMIT', submit);
  if (!submitBody.request_id) {
    throw new GenerationServiceError('La respuesta no incluyó request_id.', {
      target: 'VID',
      stage: 'SUBMIT',
      reason: 'EMPTY',
    });
  }
  const requestId = submitBody.request_id;
  const statusUrl = submitBody.status_url
    ?? `${SUBMIT_URL}/requests/${requestId}/status`;
  const resultEndpoint = submitBody.response_url
    ?? `${SUBMIT_URL}/requests/${requestId}`;

  await waitUntilDone(statusUrl, requestId, apiKey, signal);
  const resultUrl = await fetchResultVideoUrl(resultEndpoint, requestId, apiKey, signal);

  const videoResponse = await generationFetch('VID', 'DOWNLOAD', resultUrl, { signal }, requestId);
  if (!videoResponse.ok) {
    const detail = await videoResponse.text().catch(() => '');
    throw httpGenerationError('VID', 'DOWNLOAD', videoResponse, detail, requestId);
  }

  let blob: Blob;
  try {
    blob = await videoResponse.blob();
  } catch (cause) {
    throw new GenerationServiceError('No pude leer los bytes del video generado.', {
      target: 'VID',
      stage: 'DECODE',
      reason: 'INVALID',
      requestId,
      cause,
    });
  }
  if (blob.size === 0) {
    throw new GenerationServiceError('El video generado está vacío.', {
      target: 'VID',
      stage: 'DECODE',
      reason: 'EMPTY',
      requestId,
    });
  }
  return { blob, url: resultUrl };
}

async function waitUntilDone(
  statusUrl: string,
  requestId: string,
  apiKey: string,
  signal: AbortSignal | undefined,
): Promise<void> {
  const start = Date.now();

  while (Date.now() - start < POLL_TIMEOUT_MS) {
    if (signal?.aborted) throw new DOMException('Aborted', 'AbortError');

    const response = await generationFetch(
      'VID',
      'POLL',
      statusUrl,
      { headers: authHeaders(apiKey), signal },
      requestId,
    );
    if (!response.ok) {
      const detail = await response.text().catch(() => '');
      throw httpGenerationError('VID', 'POLL', response, detail, requestId);
    }
    const body = await parseGenerationJson<StatusResponse>('VID', 'POLL', response, requestId);

    switch (body.status) {
      case 'COMPLETED':
        return;
      case 'FAILED':
        throw new GenerationServiceError('fal.ai reportó FAILED al generar el video.', {
          target: 'VID',
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
          target: 'VID',
          stage: 'POLL',
          reason: 'INVALID',
          requestId,
          detail: String(body.status),
        });
    }
  }

  throw new GenerationServiceError('Timeout esperando el video.', {
    target: 'VID',
    stage: 'POLL',
    reason: 'TIMEOUT',
    requestId,
  });
}

async function fetchResultVideoUrl(
  resultEndpoint: string,
  requestId: string,
  apiKey: string,
  signal: AbortSignal | undefined,
): Promise<string> {
  const response = await generationFetch(
    'VID',
    'RESULT',
    resultEndpoint,
    { headers: authHeaders(apiKey), signal },
    requestId,
  );
  if (!response.ok) {
    const detail = await response.text().catch(() => '');
    throw httpGenerationError('VID', 'RESULT', response, detail, requestId);
  }
  const body = await parseGenerationJson<ResultResponse>('VID', 'RESULT', response, requestId);

  const url = body.video?.url;
  if (!url) {
    throw new GenerationServiceError('El resultado no incluyó un video.', {
      target: 'VID',
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
