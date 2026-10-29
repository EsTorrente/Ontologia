import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
// GitHub Pages: set VITE_BASE=/repo-name/ when building. Default './' works for most static hosts.
export default defineConfig({ plugins: [react()], base: process.env.VITE_BASE || './' })
