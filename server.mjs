import { createReadStream } from 'node:fs';
import { readFile, stat } from 'node:fs/promises';
import { createServer } from 'node:http';
import { extname, join, normalize, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import renderCertificate from './api/render-certificate.js';

const PORT = Number(process.env.PORT || 3000);
const ROOT_DIR = fileURLToPath(new URL('.', import.meta.url));
const DIST_DIR = join(ROOT_DIR, 'dist');
const INDEX_FILE = join(DIST_DIR, 'index.html');

const mimeTypes = {
  '.avif': 'image/avif',
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.ico': 'image/x-icon',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.mp4': 'video/mp4',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.webm': 'video/webm',
  '.webp': 'image/webp',
};

function isPathInside(parent, child) {
  const normalizedParent = `${normalize(parent)}${sep}`;
  const normalizedChild = normalize(child);
  return normalizedChild.startsWith(normalizedParent);
}

async function readJsonBody(request) {
  const chunks = [];
  for await (const chunk of request) {
    chunks.push(Buffer.from(chunk));
  }

  const text = Buffer.concat(chunks).toString('utf8').trim();
  return text ? JSON.parse(text) : {};
}

function createApiResponse(response) {
  return {
    setHeader: (name, value) => response.setHeader(name, value),
    status: (code) => ({
      send: (value) => {
        response.statusCode = code;
        response.end(value);
      },
      json: (value) => {
        response.statusCode = code;
        response.setHeader('Content-Type', 'application/json; charset=utf-8');
        response.end(JSON.stringify(value));
      },
    }),
  };
}

async function handleCertificateApi(request, response) {
  try {
    const body = await readJsonBody(request);
    await renderCertificate(
      {
        method: request.method,
        body,
        headers: request.headers,
      },
      createApiResponse(response),
    );
  } catch (error) {
    response.statusCode = 400;
    response.setHeader('Content-Type', 'application/json; charset=utf-8');
    response.end(JSON.stringify({ error: error instanceof Error ? error.message : 'Invalid request.' }));
  }
}

async function serveFile(filePath, response) {
  const fileStat = await stat(filePath);
  if (!fileStat.isFile()) return false;

  response.statusCode = 200;
  response.setHeader('Content-Type', mimeTypes[extname(filePath).toLowerCase()] || 'application/octet-stream');
  createReadStream(filePath).pipe(response);
  return true;
}

async function handleStatic(request, response) {
  const requestUrl = new URL(request.url || '/', `http://${request.headers.host || 'localhost'}`);
  const pathname = decodeURIComponent(requestUrl.pathname);
  const filePath = join(DIST_DIR, pathname === '/' ? 'index.html' : pathname);

  if (isPathInside(DIST_DIR, filePath)) {
    try {
      if (await serveFile(filePath, response)) return;
    } catch {
      // Fall through to the SPA entrypoint.
    }
  }

  response.statusCode = 200;
  response.setHeader('Content-Type', 'text/html; charset=utf-8');
  response.end(await readFile(INDEX_FILE));
}

const server = createServer((request, response) => {
  if ((request.url || '').startsWith('/api/render-certificate')) {
    void handleCertificateApi(request, response);
    return;
  }

  void handleStatic(request, response);
});

server.listen(PORT, () => {
  console.log(`Ecossistema Seven listening on port ${PORT}`);
});
