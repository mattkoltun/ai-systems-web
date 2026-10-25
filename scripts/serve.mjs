import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
const root = resolve(process.argv[2] ?? '.');
const port = Number(process.env.PORT ?? 3000);
const files = new Map([
  ['/', ['index.html', 'text/html; charset=utf-8']],
  ['/index.html', ['index.html', 'text/html; charset=utf-8']],
  ['/styles.css', ['styles.css', 'text/css; charset=utf-8']],
  ['/app.js', ['app.js', 'text/javascript; charset=utf-8']]
]);
createServer(async (req, res) => {
  const pathname = new URL(req.url, 'http://localhost').pathname;
  const file = files.get(pathname);
  if (!file || (req.method !== 'GET' && req.method !== 'HEAD')) {
    res.writeHead(404); res.end('Not Found'); return;
  }
  try {
    const content = await readFile(resolve(root, file[0]));
    res.writeHead(200, { 'content-type': file[1] });
    res.end(req.method === 'HEAD' ? undefined : content);
  } catch (error) {
    res.writeHead(500); res.end(String(error));
  }
}).listen(port, () => console.log(`Serving http://localhost:${port}`));
