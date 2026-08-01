import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// إعدادات بناء المشروع
export default defineConfig({
  plugins: [react()],
  server: { port: 3000, host: true },
  build: { outDir: "dist" },
});
