import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    // When running plain `vite` (not `netlify dev`), proxy function calls
    // to the Netlify Functions dev server started separately on :9999
    // via `netlify functions:serve`. If you use `netlify dev` instead,
    // this proxy is not needed (netlify dev handles it on one port).
    proxy: {
      "/.netlify/functions": {
        target: "http://localhost:9999",
        changeOrigin: true,
      },
    },
  },
});
