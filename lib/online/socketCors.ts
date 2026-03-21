import type { CorsOptions } from "cors";

const DEFAULT_ORIGINS = [
  "http://localhost:3000",
  "http://127.0.0.1:3000",
  "http://localhost:3001",
  "http://127.0.0.1:3001",
] as const;

function parseExtraOrigins(): string[] {
  const raw = process.env.SOCKET_CORS_ORIGINS;
  if (!raw?.trim()) return [];
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

/** When SOCKET_CORS_ALLOW_VERCEL=1, allow any https origin on *.vercel.app (previews + production). */
function isAllowedVercelHost(origin: string): boolean {
  if (process.env.SOCKET_CORS_ALLOW_VERCEL !== "1") return false;
  try {
    const u = new URL(origin);
    return u.protocol === "https:" && u.hostname.endsWith(".vercel.app");
  } catch {
    return false;
  }
}

/**
 * CORS for Socket.IO (Engine.IO polling + WebSocket).
 * With `credentials: true`, the browser requires a concrete
 * `Access-Control-Allow-Origin` value (not `*`), so we echo the request origin when allowed.
 */
export function getSocketIoCorsOptions(): CorsOptions {
  const allowed = new Set<string>([...DEFAULT_ORIGINS, ...parseExtraOrigins()]);

  return {
    origin: (origin, callback) => {
      if (!origin) {
        callback(null, true);
        return;
      }
      if (allowed.has(origin)) {
        callback(null, origin);
        return;
      }
      if (isAllowedVercelHost(origin)) {
        callback(null, origin);
        return;
      }
      callback(new Error("Not allowed by CORS"), false);
    },
    credentials: true,
    methods: ["GET", "POST", "OPTIONS"],
  };
}
