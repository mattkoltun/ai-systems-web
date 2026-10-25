# AI Systems — Engineering Field Guide

An interactive field guide for engineers covering execution environments (workspaces, sandboxes, containers, and shells), agent loops, planning, tool calls, harness architecture, goal verification, and a build blueprint. Two interactive traces show an incident investigation and a coding task.

## Local development

Requires Node.js 24. No third-party packages or secrets are needed.

```bash
npm run dev
# visit http://localhost:3000
```

## Production build

```bash
npm run build
npm run preview
# visit http://localhost:3000
```

The output is written to `dist/` and is directly deployable to Vercel or any static host.

## Deploy to Vercel

The existing [ai-systems-web Vercel project](https://vercel.com/devign-solutions/ai-systems-web) can deploy this repository. Connect `mattkoltun/ai-systems-web` under the project's Git settings if it is not already connected. Set the project root to the repository root. `vercel.json` selects the Other framework preset, runs `npm run build`, and serves `dist`; no environment variables are required.

Push a commit to the branch configured as Production Branch in Vercel to trigger a production deployment. Preview deployments use other connected branches or pull requests.

## Structure

- `index.html`: semantic page content.
- `styles.css`: responsive styles.
- `app.js`: interactive loop trace and tool-choice exercise.
- `scripts/build.mjs`: dependency-free build, copying static content to `dist`.
- `scripts/serve.mjs`: local HTTP development/preview server.
- `package.json`: npm scripts.
- `vercel.json`: Vercel build and output settings.
- `.nvmrc`: Node.js version for local development.
- `package-lock.json`: npm lockfile for reproducible installs.

The site is framework-free and uses no runtime dependencies. The `npm run build` command copies its static assets rather than transpiling or bundling JavaScript.
