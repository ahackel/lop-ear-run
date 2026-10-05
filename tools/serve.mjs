// Minimal static dev server. Sends no-store so the browser never runs stale engine code
// (AudioWorklet module imports are cached aggressively and survive normal reloads). The workshop saves through it:
// POST /save {kind, build} writes an animal's build into animals/<kind>.js (see tools/rig-format.js).
import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import { spliceBuild } from './rig-format.js';

const root = path.resolve(process.argv[2] || '.');
const port = +(process.env.PORT || 8323);
const TYPES = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8', '.svg': 'image/svg+xml',
  '.png': 'image/png', '.webmanifest': 'application/manifest+json', '.mp3': 'audio/mpeg', '.wav': 'audio/wav', '.ico': 'image/x-icon', '.md': 'text/plain; charset=utf-8',
};

async function save(req, res) {
  let body = '';
  for await (const chunk of req) body += chunk;
  const { kind, build } = JSON.parse(body);
  if (!/^[a-z]+$/.test(kind) || kind === 'kit' || !build || typeof build !== 'object') throw new Error('which animal?');
  const file = path.join(root, 'animals', `${kind}.js`);
  await fs.writeFile(file, spliceBuild(await fs.readFile(file, 'utf8'), build));
  res.writeHead(200, { 'Content-Type': 'text/plain' }).end(`saved animals/${kind}.js`);
}

http.createServer(async (req, res) => {
  if (req.method === 'POST' && req.url === '/save') {
    try { await save(req, res); } catch (e) { res.writeHead(400, { 'Content-Type': 'text/plain' }).end(String(e.message || e)); }
    return;
  }
  try {
    let p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
    let file = path.join(root, p);
    if (!file.startsWith(root)) { res.writeHead(403).end(); return; }
    if ((await fs.stat(file)).isDirectory()) file = path.join(file, 'index.html');
    const body = await fs.readFile(file);
    res.writeHead(200, { 'Content-Type': TYPES[path.extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
    res.end(body);
  } catch {
    res.writeHead(404, { 'Content-Type': 'text/plain' }).end('not found');
  }
}).listen(port, () => console.log(`Lop Hop dev server → http://localhost:${port}`));
