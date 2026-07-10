import type { IncomingMessage, ServerResponse } from 'node:http';
import type { Plugin } from 'vite';

// The functions under `api/` are Vercel serverless functions: Vercel serves
// them automatically in production, but the plain Vite dev server does not know
// about the `api/` folder, so `/api/*` 404s during `vite`. This plugin runs the
// same handlers as Express-style middleware in dev, so the frontend can call
// `/api/send-email` at localhost:5173 exactly like in production.

type VercelResponse = {
  status: (code: number) => VercelResponse;
  json: (body: unknown) => void;
  setHeader: (name: string, value: string) => void;
};

function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', (chunk) => {
      data += chunk;
    });
    req.on('end', () => resolve(data));
    req.on('error', reject);
  });
}

export function apiDevServer(): Plugin {
  return {
    name: 'api-dev-server',
    configureServer(server) {
      server.middlewares.use(async (req, res: ServerResponse, next) => {
        const url = req.url?.split('?')[0];
        if (!url || !url.startsWith('/api/')) {
          next();
          return;
        }

        const rawBody = await readBody(req);

        // Adapt Node's res into the Vercel-style response the handler expects.
        const vercelRes: VercelResponse = {
          status(code) {
            res.statusCode = code;
            return vercelRes;
          },
          setHeader(name, value) {
            res.setHeader(name, value);
            return undefined as unknown as void;
          },
          json(body) {
            res.end(JSON.stringify(body));
          },
        };

        try {
          // ssrLoadModule compiles the TS handler on the fly and picks up any
          // edits without restarting the dev server.
          const modulePath = `.${url}.ts`;
          const mod = await server.ssrLoadModule(modulePath);
          const handler = mod.default as (
            request: { method?: string; body?: unknown },
            response: VercelResponse,
          ) => Promise<void> | void;

          await handler({ method: req.method, body: rawBody }, vercelRes);
        } catch (err) {
          server.config.logger.error(`[api-dev-server] ${url} failed: ${String(err)}`);
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: 'Error interno del servidor de desarrollo.' }));
        }
      });
    },
  };
}
