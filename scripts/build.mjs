import { mkdir, copyFile } from 'node:fs/promises';
await mkdir('dist', { recursive: true });
const assets = ['index.html', 'styles.css', 'app.js'];
await Promise.all(assets.map(asset => copyFile(asset, `dist/${asset}`)));
console.log(`Build completed: ${assets.map(asset => `dist/${asset}`).join(', ')}`);
