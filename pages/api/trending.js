// pages/api/trending.js
// Stores trending fake news checks using Upstash Redis (FREE tier)
// Setup: upstash.com → Create Redis DB → Add to Vercel env vars

const UPSTASH_URL   = process.env.UPSTASH_REDIS_REST_URL;
const UPSTASH_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;

// ── Redis helpers ─────────────────────────────────────────────────
async function redis(command, ...args) {
  if (!UPSTASH_URL || !UPSTASH_TOKEN) return null;
  try {
    const res = await fetch(`${UPSTASH_URL}/${[command, ...args].map(encodeURIComponent).join("/")}`, {
      headers: { Authorization: `Bearer ${UPSTASH_TOKEN}` }
    });
    const data = await res.json();
    return data.result;
  } catch { return null; }
}

// ── Save a check to trending ──────────────────────────────────────
async function saveCheck(verdict, snippet, confidence) {
  if (!UPSTASH_URL) return; // No Redis configured

  const today = new Date().toDateString();
  const key   = `trending:${today}`;
  const item  = JSON.stringify({
    verdict,
    snippet: snippet.slice(0, 80),
    confidence,
    time: new Date().toISOString(),
    count: 1
  });

  // Add to sorted set by timestamp, keep last 100
  await redis("LPUSH", key, item);
  await redis("LTRIM", key, "0", "99");
  await redis("EXPIRE", key, "172800"); // 2 days TTL
}

// ── Get today's trending ──────────────────────────────────────────
async function getTrending() {
  if (!UPSTASH_URL) return [];

  const today    = new Date().toDateString();
  const key      = `trending:${today}`;
  const raw      = await redis("LRANGE", key, "0", "49");
  if (!raw || !Array.isArray(raw)) return [];

  const items = raw.map(r => { try { return JSON.parse(r); } catch { return null; } }).filter(Boolean);

  // Count duplicates by snippet similarity
  const counts = {};
  items.forEach(item => {
    const k = item.verdict + ":" + item.snippet.slice(0, 30);
    if (!counts[k]) counts[k] = { ...item, count: 0 };
    counts[k].count++;
  });

  return Object.values(counts)
    .sort((a, b) => b.count - a.count)
    .slice(0, 20);
}

// ── Handler ───────────────────────────────────────────────────────
export default async function handler(req, res) {
  if (req.method === "POST") {
    // Save new check
    const { verdict, snippet, confidence } = req.body;
    if (verdict && snippet) {
      await saveCheck(verdict, snippet, confidence || 70);
    }
    return res.status(200).json({ ok: true });
  }

  if (req.method === "GET") {
    const trending = await getTrending();
    return res.status(200).json({ trending, hasRedis: !!UPSTASH_URL });
  }

  return res.status(405).end();
}
