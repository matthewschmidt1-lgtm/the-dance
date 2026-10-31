// Minimal static server for Railway (or any Node host). No dependencies.
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;
const ROOT = path.join(__dirname, 'public');

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.json': 'application/json; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8'
};

const SECURITY_HEADERS = {
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'X-Frame-Options': 'DENY',
  'Content-Security-Policy': "default-src 'self'; style-src 'self' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; img-src 'self' data:; script-src 'self'"
};

function send(res, status, body, type, extra = {}) {
  res.writeHead(status, { 'Content-Type': type, ...SECURITY_HEADERS, ...extra });
  res.end(body);
}

const server = http.createServer((req, res) => {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    return send(res, 405, 'Method not allowed', 'text/plain; charset=utf-8', { Allow: 'GET, HEAD' });
  }
  if (req.url === '/healthz') return send(res, 200, 'ok', 'text/plain; charset=utf-8');

  let pathname;
  try { pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname); }
  catch (e) { return send(res, 400, 'Bad request', 'text/plain; charset=utf-8'); }

  const filePath = path.normalize(path.join(ROOT, pathname === '/' ? 'index.html' : pathname));
  if (!filePath.startsWith(ROOT + path.sep) && filePath !== ROOT) {
    return send(res, 403, 'Forbidden', 'text/plain; charset=utf-8');
  }

  fs.stat(filePath, (err, stat) => {
    // Unknown paths fall back to the app shell so shared links never 404.
    const target = !err && stat.isFile() ? filePath : path.join(ROOT, 'index.html');
    const ext = path.extname(target);
    fs.readFile(target, (readErr, data) => {
      if (readErr) return send(res, 500, 'Server error', 'text/plain; charset=utf-8');
      const cache = ext === '.webp' || ext === '.png' ? 'public, max-age=86400' : 'no-cache';
      send(res, 200, req.method === 'HEAD' ? '' : data, TYPES[ext] || 'application/octet-stream', { 'Cache-Control': cache });
    });
  });
});

server.listen(PORT, () => console.log(`POWER PLAY running on port ${PORT}`));
