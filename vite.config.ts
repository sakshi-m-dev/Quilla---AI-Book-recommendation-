import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

function devApiPlugin() {
  return {
    name: "dev-api-middleware",
    configureServer(server: any) {
      server.middlewares.use(async (req: any, res: any, next: any) => {
        const url = req.url?.split("?")[0] || "";
        let handlerPath = "";
        if (url.startsWith("/api/auth")) handlerPath = "./api/auth.ts";
        else if (url.startsWith("/api/conversations")) handlerPath = "./api/conversations.ts";
        else if (url.startsWith("/api/messages")) handlerPath = "./api/messages.ts";
        else if (url.startsWith("/api/tbr")) handlerPath = "./api/tbr.ts";
        else if (url.startsWith("/api/chat")) handlerPath = "./api/chat.ts";

        if (handlerPath) {
          try {
            const mod = await server.ssrLoadModule(handlerPath);
            await mod.default(req, res);
          } catch (err: any) {
            console.error("[Vite Dev API Handler Error]", err);
            res.statusCode = 500;
            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify({ error: err.message || "Internal Server Error" }));
          }
        } else {
          next();
        }
      });
    },
  };
}

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [react(), devApiPlugin(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
