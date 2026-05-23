const ALLOWED_ORIGINS = new Set([
  "https://www.rtmbusinessdirectory.com",
  "https://rtmbusinessdirectory.com",
  "https://grants.rtmbusinessdirectory.com",
  "http://localhost:5173",
  "http://localhost:3000",
  "http://127.0.0.1:5173",
  "http://127.0.0.1:3000",
]);

export function corsHeadersForRequest(req: Request): Record<string, string> {
  const origin = req.headers.get("Origin") ?? "";
  const allowOrigin = ALLOWED_ORIGINS.has(origin)
    ? origin
    : "https://www.rtmbusinessdirectory.com";

  return {
    "Access-Control-Allow-Origin": allowOrigin,
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Max-Age": "86400",
    "Vary": "Origin",
  };
}

export function handleCorsPreflight(req: Request): Response | null {
  if (req.method !== "OPTIONS") return null;
  return new Response("ok", { status: 200, headers: corsHeadersForRequest(req) });
}

export function jsonResponse(
  req: Request,
  body: unknown,
  status = 200,
): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeadersForRequest(req),
      "Content-Type": "application/json",
    },
  });
}
