import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  build: {
    // Keep syntax compatible with older iOS Safari devices.
    target: "es2019",
    rollupOptions: {
      output: {
        manualChunks: {
          "react-vendor": ["react", "react-dom"]
        }
      }
    }
  },
  server: {
    port: 5180,
    host: true,
    proxy: {
      "/api": process.env.FRAMEWORKX_API_URL ?? "http://127.0.0.1:5100"
    }
  },
  preview: {
    allowedHosts: ["frameworkx.lenz-service.de"],
    proxy: {
      "/api": process.env.FRAMEWORKX_API_URL ?? "http://127.0.0.1:5100"
    }
  }
});
