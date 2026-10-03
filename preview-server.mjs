// A read-only local server for the delivered preview. No npm packages required.
import { createServer } from 'node:http';
import { readFile, stat, realpath } from 'node:fs/promises';
import { resolve, relative, extname, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('./', import.meta.url));
const mime = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg', '.ico': 'image/x-icon', '.woff2': 'font/woff2',
  '.md': 'text/plain; charset=utf-8', '.txt': 'text/plain; charset=utf-8',
};

function respond(res, status, message) {
  res.writeHead(status, { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' });
  res.end(message);
}

const server = createServer(async (req, res) => {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.setHeader('Allow', 'GET, HEAD');
    return respond(res, 405, 'Read-only preview server');
  }
  let pathname;
  try {
    pathname = decodeURIComponent(new URL(req.url, 'http://127.0.0.1:4177').pathname);
  } catch {
    return respond(res, 400, 'Invalid path');
  }
  if (pathname.includes('\0') || pathname.includes('\\')) return respond(res, 400, 'Invalid path');
  if (pathname === '/') pathname = '/preview/index.html';
  const target = resolve(root, '.' + pathname);
  const rel = relative(root, target);
  if (rel === '..' || rel.startsWith('..' + sep) || resolve(root, rel) !== target) {
    return respond(res, 403, 'Path outside preview');
  }
  try {
    // Resolve symlinks as well, so an output link cannot expose another directory.
    const actualRoot = await realpath(root);
    const actualTarget = await realpath(target);
    const actualRelative = relative(actualRoot, actualTarget);
    if (actualRelative === '..' || actualRelative.startsWith('..' + sep) || resolve(actualRoot, actualRelative) !== actualTarget) {
      return respond(res, 403, 'Path outside preview');
    }
    const info = await stat(actualTarget);
    if (!info.isFile()) return respond(res, 404, 'File not found');
    const data = await readFile(actualTarget);
    res.writeHead(200, {
      'Content-Type': mime[extname(target).toLowerCase()] || 'application/octet-stream',
      'Content-Length': data.byteLength,
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
      'Content-Security-Policy': "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self'; base-uri 'none'; frame-ancestors 'none'",
    });
    res.end(req.method === 'HEAD' ? undefined : data);
  } catch (error) {
    if (error.code === 'ENOENT' || error.code === 'ENOTDIR') return respond(res, 404, 'File not found');
    respond(res, 500, 'Preview file read failed');
  }
});

server.listen(4177, '127.0.0.1', () => {
  console.log('知间离线预览：http://127.0.0.1:4177/preview/index.html');
});
server.on('error', (error) => { console.error(`Preview server: ${error.message}`); process.exitCode = 1; });
