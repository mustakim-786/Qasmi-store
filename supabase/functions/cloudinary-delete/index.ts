import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

type ResourceType = "image" | "video";
function json(body: unknown, status: number, headers: HeadersInit) { return new Response(JSON.stringify(body), { status, headers: { ...headers, "Content-Type": "application/json" } }); }
function cors(req: Request): HeadersInit | null {
  const origin = req.headers.get("origin");
  const allowed = (Deno.env.get("ALLOWED_ORIGINS") || "").split(",").map((value) => value.trim()).filter(Boolean);
  if (!origin) return {};
  if (!allowed.includes(origin)) return null;
  return { "Access-Control-Allow-Origin": origin, "Vary": "Origin", "Access-Control-Allow-Methods": "POST, OPTIONS", "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey" };
}
async function sha1Hex(value: string) { const digest = await crypto.subtle.digest("SHA-1", new TextEncoder().encode(value)); return Array.from(new Uint8Array(digest)).map((part) => part.toString(16).padStart(2, "0")).join(""); }
async function authorized(req: Request) {
  const token = (req.headers.get("authorization") || "").replace(/^Bearer\s+/, "");
  const url = Deno.env.get("SUPABASE_URL"); const anon = Deno.env.get("SUPABASE_ANON_KEY"); const service = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!token || !url || !anon || !service) return 401;
  const { data, error } = await createClient(url, anon).auth.getUser(token);
  if (error || !data.user) return 401;
  const { data: member } = await createClient(url, service).from("admin_users").select("user_id").eq("user_id", data.user.id).maybeSingle();
  return member ? 200 : 403;
}
Deno.serve(async (req: Request) => {
  const headers = cors(req); if (!headers) return json({ error: "Origin is not allowed" }, 403, {});
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405, headers);
  try {
    const result = await authorized(req); if (result !== 200) return json({ error: result === 401 ? "Unauthorized" : "Forbidden" }, result, headers);
    const { publicId, resourceType } = await req.json() as { publicId?: string; resourceType?: ResourceType };
    if (!publicId || !/^[A-Za-z0-9_\-/]+$/.test(publicId) || (resourceType !== "image" && resourceType !== "video")) return json({ error: "Invalid delete request" }, 400, headers);
    const cloudName = Deno.env.get("CLOUDINARY_CLOUD_NAME"); const apiKey = Deno.env.get("CLOUDINARY_API_KEY"); const apiSecret = Deno.env.get("CLOUDINARY_API_SECRET");
    if (!cloudName || !apiKey || !apiSecret) return json({ error: "Media service is not configured" }, 500, headers);
    const timestamp = Math.floor(Date.now() / 1000); const signature = await sha1Hex(`invalidate=true&public_id=${publicId}&timestamp=${timestamp}${apiSecret}`);
    const form = new FormData(); form.set("public_id", publicId); form.set("timestamp", String(timestamp)); form.set("api_key", apiKey); form.set("invalidate", "true"); form.set("signature", signature);
    const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/destroy`, { method: "POST", body: form });
    if (!response.ok) return json({ error: "Media cleanup failed" }, 502, headers);
    return json({ ok: true }, 200, headers);
  } catch { return json({ error: "Media cleanup failed" }, 500, headers); }
});
