import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    // Local dev convenience: keep frontend calls same-origin to `/api/...`
    // and proxy them to the backend container/process on :3001.
    proxy: {
      "/api": {
        target: "http://localhost:3001",
        changeOrigin: true,
      },
      // Proxy Umami under `/umami` to avoid mixed-content issues in production
      // and to keep `src="/umami/script.js"` working during local dev.
      "/umami": {
        target: "http://svra-ubuntu-server-0161.virtual.cloud.tuke.sk:9000",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/umami/, ""),
      },
    },
  },
});
