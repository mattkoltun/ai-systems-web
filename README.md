# AI Systems — Engineering Field Guide

A visual, interactive technical introduction to AI models, tools, MCP, skills, harnesses, agents, connectors and AI products.

## Local development

Requires Node.js 20 or newer. No third-party dependencies.

```bash
npm run dev
# http://localhost:3000
```

## Build and preview

```bash
npm run build
npm run preview
```

Build output: `dist/index.html`.

## Deploy to Vercel

Import `mattkoltun/ai-systems-web` into Vercel. The included `vercel.json` sets `npm run build` and output directory `dist`.

All content, diagrams, styles and agent-loop interactions are implemented in `index.html`. The project is dependency-free.
