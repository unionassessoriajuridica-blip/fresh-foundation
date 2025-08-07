import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

export default defineConfig(({ mode }) => {
  // Carrega as variáveis de ambiente
  const env = loadEnv(mode, process.cwd(), "");

  return {
    server: {
      host: "::",
      port: 8080,
    },
    plugins: [react(), mode === "production" && componentTagger()].filter(
      Boolean
    ),
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    define: {
      "import.meta.env.VITE_APP_URL": JSON.stringify(env.VITE_APP_URL),
      "import.meta.env.VITE_GOOGLE_CLIENT_ID": JSON.stringify(
        env.VITE_GOOGLE_CLIENT_ID
      ),
      "import.meta.env.VITE_GOOGLE_CLIENT_SECRET": JSON.stringify(
        env.VITE_GOOGLE_CLIENT_SECRET
      ),
      "import.meta.env.MODE": JSON.stringify(mode),
    },
    envPrefix: "VITE_",
    build: {
      rollupOptions: {
        plugins: [
          {
            name: "html-transform",
            transformIndexHtml(html: string) {
              return html.replace(
                /%VITE_GOOGLE_CLIENT_ID%/g,
                env.VITE_GOOGLE_CLIENT_ID || ""
              );
            },
          },
        ],
      },
    },
  };
});
