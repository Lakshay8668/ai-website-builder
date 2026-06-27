import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// In production (Vercel), requests to /api/* are automatically routed
// to the serverless functions in the /api folder — no proxy needed.
//
// For local development, run `vercel dev` instead of `vite` to get the
// same /api routing locally (see README.md). Plain `npm run dev` will
// still work for UI changes, but AI generation calls will fail with a
// 404 until you either run `vercel dev` or deploy.
export default defineConfig({
  plugins: [react()],
})

