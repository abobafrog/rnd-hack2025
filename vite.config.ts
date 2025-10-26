import { jsxLocPlugin } from "@builder.io/vite-plugin-jsx-loc";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { defineConfig } from "vite";
import { vitePluginManusRuntime } from "vite-plugin-manus-runtime";

const plugins = [
  react(),
  tailwindcss(),
  jsxLocPlugin(),
  vitePluginManusRuntime(),
];

export default defineConfig(({ mode }) => ({
  plugins,
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "client", "src"),
      "@shared": path.resolve(__dirname, "shared"),
      "@assets": path.resolve(__dirname, "attached_assets"),
    },
  },
  envDir: path.resolve(__dirname),
  root: path.resolve(__dirname, "client"),
  publicDir: path.resolve(__dirname, "client", "public"),
  base: mode === "github-pages" ? "/uutki/" : "/",
  build: {
    outDir: path.resolve(__dirname, "docs"),
    emptyOutDir: true,
    // Optimize for GitHub Pages
    minify: "terser",
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
        pure_funcs: [
          "console.log",
          "console.info",
          "console.debug",
          "console.warn",
        ],
      },
    },
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ["react", "react-dom"],
          ui: [
            "@radix-ui/react-dialog",
            "@radix-ui/react-tabs",
            "@radix-ui/react-dropdown-menu",
          ],
          icons: ["lucide-react"],
          utils: ["wouter", "sonner"],
        },
        // Размещаем CSS и JS файлы в корне папки сборки
        chunkFileNames: "[name]-[hash].js",
        entryFileNames: "[name]-[hash].js",
        assetFileNames: "[name]-[hash].[ext]",
      },
    },
    // Optimize bundle size
    chunkSizeWarningLimit: 1000,
    target: "es2015",
  },
  server: {
    host: true,
    allowedHosts: [
      ".manuspre.computer",
      ".manus.computer",
      ".manus-asia.computer",
      ".manuscomputer.ai",
      ".manusvm.computer",
      "localhost",
      "127.0.0.1",
    ],
    fs: {
      strict: true,
      deny: ["**/.*"],
    },
    // Optimize for faster development
    hmr: {
      overlay: false, // Disable error overlay for faster loading
    },
  },
  // Optimize dependencies for faster loading
  optimizeDeps: {
    include: ["react", "react-dom", "wouter"],
    exclude: ["@radix-ui/react-dialog", "@radix-ui/react-tabs"],
  },
}));
