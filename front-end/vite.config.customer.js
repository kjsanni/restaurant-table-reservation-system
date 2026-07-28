import { fileURLToPath, URL } from "node:url";

import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import Icons from "unplugin-icons/vite";

export default defineConfig({
  server: {
    port: 8082,
    proxy: {
      "/api": {
        target: "http://localhost:8000",
        changeOrigin: true,
      },
    },
  },
  define: {
    __VUE_PROD_HYDRATION_MISMATCH_DETAILS__: false,
    __VITE_PORTAL_MODE__: JSON.stringify("customer"),
  },
  plugins: [Icons({ compiler: "vue3" }), vue()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  build: {
    rollupOptions: {
      input: {
        main: fileURLToPath(new URL("./index.customer.html", import.meta.url)),
      },
      output: {
        manualChunks: (id) => {
          if (id.includes("vuestic-ui")) return "vuestic-ui";
        },
      },
    },
  },
});
