import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
const root = resolve(process.argv[2] ?? '.');
const port = Number(process.env.PORT ?? 3000);
createServer(async (req, res) => {
  const path = new URL(req.url, 'http://localhost').pathname;
  if (path !== '/' && path !== '/index.html') {
    res.writeHead(404); res.end('Not Found'); return;
  }
  try {
    const html = await readFile(resolve(root, 'index.html'));
    res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
    res.end(html);
  } catch (error) {
    res.writeHead(500); res.end(String(error));
  }
}).listen(port, () => console.log(`Serving http://localhost:${port}`));
