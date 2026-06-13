import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV !== "production";

// Client-side fetches (search, tags, content) go from the browser to the API origin,
// which is a DIFFERENT origin than the FE (e.g. notypie.dev → api.notypie.dev). It must be
// in connect-src or the browser's CSP blocks every client fetch (search silently fails).
// Derived from the same env that points the app at the API so the two never drift.
const apiOrigin = (() => {
  try {
    return new URL(process.env.NEXT_PUBLIC_API_BASE_URL ?? "").origin;
  } catch {
    return "";
  }
})();
// In dev, Next/Turbopack HMR uses a websocket on the same origin; allow ws/wss there.
const connectSrc = ["'self'", apiOrigin, isDev ? "ws: wss:" : ""]
  .filter(Boolean)
  .join(" ");

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      "img-src 'self' data: https:",
      "style-src 'self' 'unsafe-inline'",
      // 'unsafe-eval' is only needed for dev (React Refresh / Turbopack HMR)
      isDev
        ? "script-src 'self' 'unsafe-inline' 'unsafe-eval'"
        : "script-src 'self' 'unsafe-inline'",
      `connect-src ${connectSrc}`,
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join("; "),
  },
];

const nextConfig: NextConfig = {
  output: "standalone",
  experimental: {
    optimizePackageImports: [
      "@tanstack/react-query",
      "@tanstack/react-query-devtools",
    ],
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
