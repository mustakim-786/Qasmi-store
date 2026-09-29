import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

type ResourceType = "image" | "video";
interface SignRequest { resourceType?: ResourceType; optimize?: boolean; fileName?: string; fileSize?: number; mimeType?: string; }

function json(body: unknown, status: number, headers: HeadersInit) {
  return new Response(JSON.stringify(body), { status, headers: { ...headers, "Content-Type": "application/json" } });
}

function allowedCorsHeaders(req: Request): HeadersInit | null {
  const origin = req.headers.get("origin");
  const origins = (Deno.env.get("ALLOWED_ORIGINS") || "").split(",").map((value) => value.trim()).filter(Boolean);
  if (!origin) return {};
  if (!origins.includes(origin)) return null;
  return {
    "Access-Control-Allow-Origin": origin,
    "Vary": "Origin",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
  };
}

async function sha1Hex(value: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-1", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest)).map((part) => part.toString(16).padStart(2, "0")).join("");
}

async function requireAdmin(req: Request) {
  const authorization = req.headers.get("authorization") || "";
  const token = authorization.startsWith("Bearer ") ? authorization.slice(7) : "";
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const publishableKey = Deno.env.get("SUPABASE_ANON_KEY");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!token || !supabaseUrl || !publishableKey || !serviceRoleKey) return { status: 401 as const };
  const userClient = createClient(supabaseUrl, publishableKey);
  const { data: userData, error: userError } = await userClient.auth.getUser(token);
  if (userError || !userData.user) return { status: 401 as const };
  const serviceClient = createClient(supabaseUrl, serviceRoleKey);
  const { data: membership, error: membershipError } = await serviceClient
    .from("admin_users").select("user_id").eq("user_id", userData.user.id).maybeSingle();
  if (membershipError || !membership) return { status: 403 as const };
  return { status: 200 as const };
}

Deno.serve(async (req: Request) => {
  const cors = allowedCorsHeaders(req);
  if (!cors) return json({ error: "Origin is not allowed" }, 403, {});
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405, cors);

  try {
    const authorization = await requireAdmin(req);
    if (authorization.status !== 200) return json({ error: authorization.status === 401 ? "Unauthorized" : "Forbidden" }, authorization.status, cors);
    const body = await req.json() as SignRequest;
    const resourceType = body.resourceType;
    if (resourceType !== "image" && resourceType !== "video") return json({ error: "Invalid resource type" }, 400, cors);
    const allowedMimeTypes = resourceType === "image"
      ? ["image/jpeg", "image/png", "image/webp", "image/avif"]
      : ["video/mp4", "video/webm", "video/quicktime"];
    const maxBytes = resourceType === "image" ? 10 * 1024 * 1024 : 100 * 1024 * 1024;
    if (!body.fileName || typeof body.fileSize !== "number" || body.fileSize < 1 || body.fileSize > maxBytes || !body.mimeType || !allowedMimeTypes.includes(body.mimeType)) {
      return json({ error: "File does not meet the upload policy" }, 400, cors);
    }

    const cloudName = Deno.env.get("CLOUDINARY_CLOUD_NAME");
    const apiKey = Deno.env.get("CLOUDINARY_API_KEY");
    const apiSecret = Deno.env.get("CLOUDINARY_API_SECRET");
    if (!cloudName || !apiKey || !apiSecret) return json({ error: "Upload service is not configured" }, 500, cors);

    const timestamp = Math.floor(Date.now() / 1000);
    const folder = `qasmi-store/${resourceType}s`;
    const tags = `qasmi-store,${resourceType}`;
    const eager = body.optimize ? (resourceType === "image" ? "f_auto,q_auto" : "f_auto,q_auto,vs_auto") : undefined;
    const allowedFormats = resourceType === "image" ? "jpg,jpeg,png,webp,avif" : "mp4,webm,mov";
    const params: Record<string, string> = { allowed_formats: allowedFormats, folder, tags, timestamp: String(timestamp) };
    if (eager) params.eager = eager;
    const canonical = Object.keys(params).sort().map((key) => `${key}=${params[key]}`).join("&");
    const signature = await sha1Hex(canonical + apiSecret);
    return json({ signature, timestamp, apiKey, cloudName, folder, tags, eager, allowedFormats, resourceType }, 200, cors);
  } catch {
    return json({ error: "Upload authorization failed" }, 500, cors);
  }
});
