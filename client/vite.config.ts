import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [tailwindcss(), reactRouter()],
  resolve: {
    tsconfigPaths: true,
  },
  server: {
    proxy: {
      // /api/search?ticker=AAPL -> http://localhost:8080/api/search?ticker=AAPL
      "/api": "http://localhost:8080",
    },
  },
});
