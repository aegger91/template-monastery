// Static server for dist/. With --watch it rebuilds when content, theme,
// public or src files change.
//
//   node scripts/serve.mjs [--watch] [--port 4747]
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIST = path.join(ROOT, process.env.OUT_DIR || 'dist');
const args = process.argv.slice(2);
const watch = args.includes('--watch');
const portArg = args.indexOf('--port');
const PORT = Number(portArg >= 0 ? args[portArg + 1] : process.env.PORT || 4747);
const HOST = process.env.HOST || '0.0.0.0';

const TYPES = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8', '.svg': 'image/svg+xml', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
  '.png': 'image/png', '.webp': 'image/webp', '.woff2': 'font/woff2', '.xml': 'application/xml', '.txt': 'text/plain; charset=utf-8', '.md': 'text/markdown; charset=utf-8'
};

function build() {
  return new Promise((resolve) => {
    const child = spawn(process.execPath, [path.join(ROOT, 'src/build.mjs')], { stdio: 'inherit', env: process.env });
    child.on('exit', (code) => resolve(code === 0));
  });
}

function resolveFile(urlPath) {
  let p = decodeURIComponent(urlPath.split('?')[0]);
  p = path.normalize(p).replace(/^(\.\.[/\\])+/, '');
  let file = path.join(DIST, p);
  if (!file.startsWith(DIST)) return null;
  if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, 'index.html');
  return fs.existsSync(file) ? file : null;
}

const server = http.createServer((req, res) => {
  const file = resolveFile(req.url);
  if (!file) {
    const notFound = path.join(DIST, '404.html');
    res.writeHead(404, { 'Content-Type': TYPES['.html'] });
    res.end(fs.existsSync(notFound) ? fs.readFileSync(notFound) : 'Not found');
    return;
  }
  res.writeHead(200, { 'Content-Type': TYPES[path.extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-cache' });
  fs.createReadStream(file).pipe(res);
});

if (watch || !fs.existsSync(DIST)) await build();

server.listen(PORT, HOST, () => console.log(`Serving ${path.relative(ROOT, DIST)}/ at http://localhost:${PORT}/`));

if (watch) {
  let timer = null;
  let running = false;
  const trigger = () => {
    clearTimeout(timer);
    timer = setTimeout(async () => {
      if (running) return trigger();
      running = true;
      await build();
      running = false;
    }, 150);
  };
  for (const dir of ['content', 'theme', 'public', 'src']) {
    fs.watch(path.join(ROOT, dir), { recursive: true }, trigger);
  }
  console.log('Watching content/, theme/, public/ and src/ for changes');
}
