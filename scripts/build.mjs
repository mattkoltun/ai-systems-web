import { mkdir, copyFile } from 'node:fs/promises';
await mkdir('dist', { recursive: true });
await mkdir('dist/assets', { recursive: true });
const assets = ['index.html', 'styles.css', 'app.js', 'assets/agent-core.png', 'assets/site-icon.png'];
await Promise.all(assets.map(asset => copyFile(asset, `dist/${asset}`)));
console.log(`Build completed: ${assets.map(asset => `dist/${asset}`).join(', ')}`);
