type MediaType = 'image' | 'video';

type SendEmailBody = {
  email?: unknown;
  mediaType?: unknown;
  mediaUrl?: unknown;
};

type ApiRequest = {
  method?: string;
  body?: unknown;
};

type ApiResponse = {
  status: (code: number) => ApiResponse;
  json: (body: unknown) => void;
  setHeader: (name: string, value: string) => void;
};

const BREVO_ENDPOINT = 'https://api.brevo.com/v3/smtp/email';
const DEFAULT_SENDER_NAME = 'BNA Campo Argentino';

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function parseBody(body: unknown): SendEmailBody {
  if (typeof body === 'string') {
    try {
      return JSON.parse(body) as SendEmailBody;
    } catch {
      return {};
    }
  }

  if (body && typeof body === 'object') return body as SendEmailBody;
  return {};
}

function isAbsoluteHttpUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' || url.protocol === 'http:';
  } catch {
    return false;
  }
}

function getEmailContent(mediaType: MediaType) {
  if (mediaType === 'image') {
    return {
      subject: 'Tu imagen de Campo Argentino',
      filename: 'bna-campo-argentina.jpg',
      mediaLabel: 'imagen',
      textContent: 'Te compartimos adjunta tu imagen generada en Campo Argentino.',
      htmlContent:
        '<p>Te compartimos adjunta tu imagen generada en <strong>Campo Argentino</strong>.</p>',
    };
  }

  return {
    subject: 'Tu video de Campo Argentino',
    filename: 'bna-campo-argentina.mp4',
    mediaLabel: 'video',
    textContent: 'Te compartimos adjunto tu video generado en Campo Argentino.',
    htmlContent:
      '<p>Te compartimos adjunto tu video generado en <strong>Campo Argentino</strong>.</p>',
  };
}

export default async function handler(req: ApiRequest, res: ApiResponse) {
  res.setHeader('Content-Type', 'application/json');

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Metodo no permitido.' });
    return;
  }

  const apiKey = process.env.BREVO_API_KEY;
  const senderEmail = process.env.BREVO_SENDER_EMAIL;
  const senderName = process.env.BREVO_SENDER_NAME || DEFAULT_SENDER_NAME;
  if (!apiKey || !senderEmail) {
    res.status(500).json({
      error: 'Falta configurar BREVO_API_KEY o BREVO_SENDER_EMAIL en el entorno.',
    });
    return;
  }

  const body = parseBody(req.body);
  const email = typeof body.email === 'string' ? body.email.trim() : '';
  const mediaType = body.mediaType === 'image' || body.mediaType === 'video' ? body.mediaType : null;
  const mediaUrl = typeof body.mediaUrl === 'string' ? body.mediaUrl.trim() : '';

  if (!isValidEmail(email)) {
    res.status(400).json({ error: 'Ingresá un email válido.' });
    return;
  }

  if (!mediaType) {
    res.status(400).json({ error: 'Tipo de archivo inválido.' });
    return;
  }

  if (!mediaUrl || !isAbsoluteHttpUrl(mediaUrl)) {
    res.status(400).json({ error: 'URL del archivo inválida.' });
    return;
  }

  const content = getEmailContent(mediaType);

  // Optional per-type Brevo templates: when the matching one is set, the email
  // subject and body are rendered from that template (which receives `params`
  // below, including the media URL). When empty, we fall back to inline HTML.
  const templateIdRaw =
    mediaType === 'image'
      ? process.env.BREVO_TEMPLATE_ID_IMAGE
      : process.env.BREVO_TEMPLATE_ID_VIDEO;
  const templateId = templateIdRaw ? Number(templateIdRaw) : null;

  const payload: Record<string, unknown> = {
    sender: {
      email: senderEmail,
      name: senderName,
    },
    to: [{ email }],
    // No attachment: the media is only shown inline in the template via
    // params.mediaUrl, and downloaded on demand via params.downloadUrl.
  };

  if (templateId && Number.isFinite(templateId)) {
    // The download button must point at the app's own download page (which
    // fetches the media and forces a real device download / iOS share sheet),
    // not at the raw media URL — a raw link just opens in the browser. This is
    // the same page the on-screen QR codes use. Falls back to the raw URL if the
    // app base URL isn't configured.
    const baseUrl = (process.env.PUBLIC_BASE_URL || '').replace(/\/$/, '');
    const downloadPath = mediaType === 'image' ? '/imagenes/descargar' : '/videos/descargar';
    const downloadUrl = baseUrl
      ? `${baseUrl}${downloadPath}?u=${encodeURIComponent(mediaUrl)}`
      : mediaUrl;

    payload.templateId = templateId;
    payload.params = {
      mediaType,
      mediaLabel: content.mediaLabel,
      // Bind the image src / video poster to mediaUrl, and the download button
      // href to downloadUrl.
      mediaUrl,
      downloadUrl,
    };
  } else {
    payload.subject = content.subject;
    payload.textContent = content.textContent;
    payload.htmlContent = content.htmlContent;
  }

  try {
    const brevoResponse = await fetch(BREVO_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'api-key': apiKey,
      },
      body: JSON.stringify(payload),
    });

    if (!brevoResponse.ok) {
      let detail = 'Brevo no pudo enviar el email.';
      try {
        const data = (await brevoResponse.json()) as { message?: string; error?: string };
        detail = data.message || data.error || detail;
      } catch {
        // Keep the generic message if Brevo returns a non-JSON response.
      }
      res.status(brevoResponse.status).json({ error: detail });
      return;
    }

    res.status(200).json({ ok: true });
  } catch {
    res.status(502).json({ error: 'No pudimos conectar con Brevo.' });
  }
}
