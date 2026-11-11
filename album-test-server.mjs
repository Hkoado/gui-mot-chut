import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';

const root = resolve('out');
const host = process.env.HOST ?? '127.0.0.1';
const port = Number(process.env.PORT ?? 3016);
const types = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.ttf': 'font/ttf', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.json': 'application/json' };
createServer(async (req, res) => {
  try {
    const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    const file = resolve(root, `.${pathname.endsWith('/') ? `${pathname}index.html` : pathname}`);
    if (!file.startsWith(root + sep)) { res.writeHead(403).end(); return; }
    let body;
    try { body = await readFile(file); }
    catch (error) {
      // Next static segment prefetch flattens the __PAGE__ separator in URLs.
      if (!pathname.endsWith('.__PAGE__.txt')) throw error;
      body = await readFile(file.replace(/\.__PAGE__\.txt$/, `${sep}__PAGE__.txt`));
    }
    res.writeHead(200, { 'Content-Type': types[extname(file)] ?? 'application/octet-stream' }).end(body);
  } catch { res.writeHead(404).end('Not found'); }
}).listen(port, host, () => {
  console.log(`Static preview listening on http://${host}:${port}`);
});