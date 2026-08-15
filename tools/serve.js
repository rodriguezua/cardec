/**
 * Minimal dependency-free static file server for local development.
 *
 * Serves the repository root so `web/` can import `../src/engine/*.js`
 * directly, with no bundler and no build step.
 *
 *   npm start          # http://localhost:5173/web/
 *   PORT=8080 npm start
 */

import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import { createServer } from 'node:http';
import { extname, join, normalize, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(fileURLToPath(new URL('..', import.meta.url)));
const PORT = Number(process.env.PORT ?? 5173);

const MIME = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.map': 'application/json; charset=utf-8',
  '.md': 'text/markdown; charset=utf-8',
  '.svg': 'image/svg+xml',
};

/** Resolve a request path to a file inside ROOT, or null if it escapes. */
async function resolveTarget(urlPath) {
  const decoded = decodeURIComponent(urlPath.split('?')[0]);
  const candidate = resolve(join(ROOT, normalize(decoded)));
  if (candidate !== ROOT && !candidate.startsWith(ROOT + sep)) return null;

  try {
    const info = await stat(candidate);
    if (!info.isDirectory()) return candidate;
  } catch {
    return null;
  }

  const index = join(candidate, 'index.html');
  try {
    await stat(index);
    return index;
  } catch {
    return null;
  }
}

const server = createServer(async (req, res) => {
  const target = await resolveTarget(req.url === '/' ? '/web/' : req.url);
  if (!target) {
    res.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' });
    res.end('Not found\n');
    return;
  }

  res.writeHead(200, {
    'content-type': MIME[extname(target)] ?? 'application/octet-stream',
    'cache-control': 'no-store',
  });
  createReadStream(target).pipe(res);
});

server.listen(PORT, () => {
  console.log(`cardec dev server: http://localhost:${PORT}/web/`);
});
