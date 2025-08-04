import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import vitePluginCsp from "vite-plugin-csp";

export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    mode === 'development' && componentTagger(),
    vitePluginCsp({
      policy: {
        'default-src': ["self"],
        'script-src': [
          "self",
          "https://apis.google.com",
          "https://www.gstatic.com",
          "https://accounts.google.com",
          "https://edjqlzzptewjsuutfafj.supabase.co",
          "unsafe-inline",
          "unsafe-eval",
          "blob:",
          "data:"
        ],
        'style-src': [
          "self",
          "https://fonts.googleapis.com",
          "unsafe-inline"
        ],
        'img-src': [
          "self",
          "https://*.googleusercontent.com",
          "data:",
          "blob:"
        ],
        'font-src': [
          "self",
          "https://fonts.gstatic.com"
        ],
        'connect-src': [
          "self",
          "https://*.googleapis.com",
          "https://*.google.com",
          "https://edjqlzzptewjsuutfafj.supabase.co"
        ],
        'frame-src': [
          "https://accounts.google.com"
        ],
        'worker-src': [
          "self",
          "blob:"
        ]
      },
      onDev: mode === 'development' ? "permissive" : "full"
    })
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));