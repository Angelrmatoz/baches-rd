import { createRequire } from "node:module";
import path from "path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

const require = createRequire(import.meta.url);

// Resolver a la misma instalación física (evita mismatch react / react-dom)
const reactPath = path.dirname(require.resolve("react/package.json"));
const reactDomPath = path.dirname(require.resolve("react-dom/package.json"));

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    dedupe: ["react", "react-dom"],
    alias: {
      "@": path.resolve(__dirname, "./src"),
      react: reactPath,
      "react-dom": reactDomPath,
    },
  },
  optimizeDeps: {
    include: ["react", "react-dom", "react-router-dom"],
  },
});
