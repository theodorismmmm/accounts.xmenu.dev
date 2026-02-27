import { createClient } from "@supabase/supabase-js";

// Simple in-memory rate limiter (per serverless instance).
// Note: resets on cold starts. For persistent limiting, use a distributed store (e.g. Vercel KV).
const RATE_LIMIT_WINDOW_MS = 60_000; // 1 minute
const RATE_LIMIT_MAX = 5; // max 5 login attempts per IP per window (inclusive)
const _attempts = new Map();

function isRateLimited(ip) {
  const now = Date.now();
  // Prune expired entries to prevent unbounded Map growth
  for (const [key, val] of _attempts) {
    if (now > val.resetAt) _attempts.delete(key);
  }
  let entry = _attempts.get(ip);
  if (!entry || now > entry.resetAt) {
    entry = { count: 0, resetAt: now + RATE_LIMIT_WINDOW_MS };
  }
  entry.count++;
  _attempts.set(ip, entry);
  return entry.count >= RATE_LIMIT_MAX;
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method Not Allowed" });

  const ip =
    (req.headers["x-forwarded-for"] || "").split(",")[0].trim() ||
    req.socket?.remoteAddress ||
    "unknown";

  if (isRateLimited(ip)) {
    return res.status(429).json({ error: "Too many login attempts. Please wait before trying again." });
  }

  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    return res.status(500).json({ error: "Server not configured" });
  }

  const { email, password } = req.body || {};

  if (!email || typeof email !== "string" || !password || typeof password !== "string") {
    return res.status(400).json({ error: "email and password are required" });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: false },
  });

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error || !data.session) {
    return res.status(401).json({ error: "Invalid email or password" });
  }

  const session = data.session;
  return res.status(200).json({
    token: session.access_token,
    token_type: "Bearer",
    expires_at: session.expires_at
      ? new Date(session.expires_at * 1000).toISOString()
      : null,
    refresh_token: session.refresh_token,
  });
}
