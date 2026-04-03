# SA ERP Web App Mode

This project now includes a web-first mode so you can host an interactive demo for free.

## What This Does

- Runs the existing React renderer as a standalone web app
- Uses a browser-safe mock API when Electron APIs are not available
- Uses hash routing for static hosting compatibility (GitHub Pages, Netlify, Vercel)

## Commands

Run web app locally:

npm run web:dev

Build static web app bundle:

npm run web:build

Preview built bundle:

npm run web:preview

## Output Directory

The web build output is generated to:

- dist/renderer

## Free Hosting Options

### 1) GitHub Pages

- Build with npm run web:build
- Upload dist/renderer contents to a gh-pages branch
- Enable GitHub Pages for that branch

### 2) Netlify

- Build command: npm run web:build
- Publish directory: dist/renderer

### 3) Vercel

- Framework preset: Other
- Build command: npm run web:build
- Output directory: dist/renderer

## Notes

- This is a demo web mode based on mocked data/API behavior.
- Desktop-only capabilities and deep native integrations remain part of the Electron app.
