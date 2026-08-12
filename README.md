# Image Optimizer

A full-stack image compression tool built with React, Tailwind CSS, Node.js, Express.js and Sharp.js.

## Features

- Upload up to 10 images at once
- Drag-and-drop upload
- JPEG, PNG, WebP and TIFF support
- Adjustable quality from 10% to 100%
- Convert output format during optimization
- Shows original size, optimized size and savings
- Download individual files or all optimized images
- Server-side processing with Sharp.js
- No permanent image storage
- Responsive modern UI
- Health endpoint at `/api/health`

## Run locally

```bash
npm install
npm run dev
```

Frontend: http://localhost:5173  
API: http://localhost:3001

## Production

```bash
npm install
npm run build
npm start
```

The Express server serves the built frontend and API from one service.

## Deploy on Render

This repository includes `render.yaml`. Push the project to GitHub and create a new Render Web Service from the repository. Render will use the build/start commands automatically.

## API

`POST /api/optimize`

Multipart form fields:

- `images`: one or more image files
- `quality`: 10–100
- `format`: jpeg | png | webp | tiff

Response includes a `dataUrl` for each optimized image, plus original/optimized byte sizes and percentage saved.

## Notes

For production workloads with large files, consider object storage and streaming downloads instead of embedding output data as data URLs.