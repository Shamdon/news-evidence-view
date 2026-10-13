import http from 'node:http';
import { readFile, realpath, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createProviderRegistry } from '../providers/registry.mjs';
import { validateQuery, validateReportURL } from '../providers/usgs.mjs';
const ROOT = fileURLToPath(new URL('../', import.meta.url));
const COUNTRY = fileURLToPath(
  new URL(
    '../../src/data/local_data/natural_earth/countries.json',
    import.meta.url,
  ),
);
const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
};
function send(res, code, value) {
  res.writeHead(code, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(value));
}
async function body(req) {
  if (
    !/^application\/json(?:\s*;\s*charset=utf-8)?$/i.test(
      req.headers['content-type'] ?? '',
    )
  )
    throw Object.assign(new Error('Use application/json.'), { status: 415 });
  const chunks = [];
  let size = 0;
  for await (const c of req) {
    size += c.length;
    if (size > 16384)
      throw Object.assign(new Error('Request body too large.'), {
        status: 413,
      });
    chunks.push(c);
  }
  try {
    const value = JSON.parse(Buffer.concat(chunks).toString('utf8'));
    if (!value || typeof value !== 'object' || Array.isArray(value))
      throw new Error();
    return value;
  } catch {
    throw Object.assign(new Error('Invalid JSON object.'), { status: 400 });
  }
}
export function createNewsServer({
  providers = {},
  root = ROOT,
  countriesPath = COUNTRY,
} = {}) {
  const registry = createProviderRegistry(providers);
  let activeRequests = 0;
  let requestTimes = []; // Only timestamps: no report content, URL or client identifiers.
  const activeControllers = new Set();
  const server = http.createServer(async (req, res) => {
    res.setHeader(
      'Content-Security-Policy',
      "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; connect-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'; form-action 'self'",
    );
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'no-referrer');
    let reservedSlot = false;
    const abort = new AbortController();
    req.on('aborted', () => abort.abort());
    res.on('close', () => {
      if (!res.writableEnded) abort.abort();
    });
    try {
      const port = server.address()?.port;
      const hosts = new Set([
        `127.0.0.1:${port}`,
        `localhost:${port}`,
        `[::1]:${port}`,
      ]);
      if (!hosts.has(req.headers.host))
        return send(res, 403, { error: 'Untrusted Host.' });
      const origins = new Set([...hosts].map((host) => `http://${host}`));
      if (req.headers.origin && !origins.has(req.headers.origin))
        return send(res, 403, { error: 'Foreign Origin rejected.' });
      const target = req.url ?? '';
      if (
        target.length > 2048 ||
        !target.startsWith('/') ||
        target.startsWith('//') ||
        /[\\\x00-\x1f]/.test(target)
      )
        return send(res, 400, { error: 'Invalid request path.' });
      const rawPath = target.split('?')[0];
      let pathname;
      try {
        pathname = decodeURIComponent(rawPath);
      } catch {
        return send(res, 400, { error: 'Invalid request path.' });
      }
      if (
        pathname.includes('\\') ||
        pathname
          .split('/')
          .some(
            (segment) =>
              segment === '..' || segment === '.' || segment.startsWith('.'),
          ) ||
        /[\x00-\x1f]/.test(pathname)
      )
        return send(res, 404, { error: 'Not found.' });
      if (
        req.method === 'POST' &&
        (pathname === '/api/retrieve' || pathname === '/api/acquire')
      ) {
        const now = Date.now();
        requestTimes = requestTimes.filter((time) => now - time < 60000);
        if (activeRequests >= 4 || requestTimes.length >= 30) {
          res.setHeader('Retry-After', '60');
          return send(res, 429, {
            error: 'Local retrieval limit reached. Wait before trying again.',
          });
        }
        requestTimes.push(now);
        activeRequests++;
        reservedSlot = true;
        activeControllers.add(abort);
      }
      if (req.method === 'POST' && pathname === '/api/retrieve') {
        const input = await body(req);
        const provider = registry.get(input.provider);
        const query = validateQuery(input.query);
        const result = await provider.retrieve(query, { signal: abort.signal });
        return send(res, 200, result);
      }
      if (req.method === 'POST' && pathname === '/api/acquire') {
        const input = await body(req);
        validateReportURL(input.url);
        const result = await registry
          .get('usgs')
          .acquire(input.url, { signal: abort.signal });
        return send(res, 200, result);
      }
      if (req.method !== 'GET' && req.method !== 'HEAD')
        return send(res, 405, { error: 'Method not allowed.' });
      let candidate, allowedRoot;
      if (pathname === '/assets/countries.json') {
        candidate = countriesPath;
        allowedRoot = path.dirname(countriesPath);
      } else {
        const asset =
          pathname === '/' ? 'presentation/index.html' : pathname.slice(1);
        if (
          !/^(?:presentation|domain|geography|application)\/[a-zA-Z0-9_/-]+\.(?:html|mjs|js|css|json|svg)$/.test(
            asset,
          )
        )
          return send(res, 404, { error: 'Not found.' });
        const canonicalRoot = await realpath(root);
        candidate = path.resolve(canonicalRoot, asset);
        allowedRoot = path.resolve(canonicalRoot, asset.split('/')[0]);
      }
      // Canonical path containment prevents symlink escape, including symlinked directories.
      const resolved = await realpath(candidate),
        boundary = path.resolve(allowedRoot);
      if (resolved !== boundary && !resolved.startsWith(boundary + path.sep))
        return send(res, 404, { error: 'Not found.' });
      // The allowlisted root itself must not be a symlink outside its expected path.
      if ((await realpath(boundary)) !== boundary)
        return send(res, 404, { error: 'Not found.' });
      const info = await stat(resolved);
      if (!info.isFile() || info.size > 30_000_000)
        return send(res, 404, { error: 'Not found.' });
      const content = await readFile(resolved);
      res.writeHead(200, {
        'Content-Type':
          TYPES[path.extname(resolved)] ?? 'application/octet-stream',
      });
      res.end(req.method === 'HEAD' ? undefined : content);
    } catch (error) {
      if (res.destroyed || res.writableEnded) return;
      if (error.code === 'ENOENT' || error.code === 'ENOTDIR')
        return send(res, 404, { error: 'Not found.' });
      // Only fixed application messages cross this boundary, never provider exceptions.
      const safe = [
        'Use application/json.',
        'Request body too large.',
        'Invalid JSON object.',
        'Unknown evidence provider.',
        'Invalid query.',
        'Use valid YYYY-MM-DD dates.',
        'Select one to seven calendar days.',
        'Coordinates must be a valid latitude/longitude pair.',
        'Radius must be greater than zero and at most 1000 km.',
        'Unsupported URL. Use a USGS earthquake event page or paste report text.',
        'USGS report acquisition failed or timed out. Paste report text instead.',
      ];
      send(res, error.status ?? (safe.includes(error.message) ? 400 : 502), {
        error: safe.includes(error.message)
          ? error.message
          : 'Request failed. Try again later.',
      });
    } finally {
      if (reservedSlot) {
        activeRequests--;
        activeControllers.delete(abort);
      }
    }
  });
  server.abortPending = () => {
    for (const controller of activeControllers) controller.abort();
  };
  server.requestTimeout = 15000;
  server.headersTimeout = 10000;
  server.maxHeadersCount = 30;
  return server;
}
