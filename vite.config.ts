import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// Estes valores são públicos no navegador. Os fallbacks evitam uma tela branca
// quando o ambiente de publicação não disponibiliza o arquivo .env local.
const DEFAULT_SUPABASE_URL = "https://zzsibjquwzcrsbdbqwog.supabase.co";
const DEFAULT_SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp6c2lianF1d3pjcnNiZGJxd29nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA4MjA5MjYsImV4cCI6MjA4NjM5NjkyNn0.1w0Ij_4_K9_nrsfbUTE0LDE259KwSF6DlUwjLSPyyKA";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "VITE_SUPABASE_");

  return {
    define: {
      "import.meta.env.VITE_SUPABASE_URL": JSON.stringify(
        env.VITE_SUPABASE_URL || DEFAULT_SUPABASE_URL,
      ),
      "import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY": JSON.stringify(
        env.VITE_SUPABASE_PUBLISHABLE_KEY || DEFAULT_SUPABASE_PUBLISHABLE_KEY,
      ),
    },
    server: {
      host: "::",
      port: 8080,
      hmr: {
        overlay: false,
      },
    },
    plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
      dedupe: ["react", "react-dom", "react/jsx-runtime", "@tanstack/react-query"],
    },
    optimizeDeps: {
      include: ["react", "react-dom", "react/jsx-runtime", "@tanstack/react-query"],
    },
  };
});
