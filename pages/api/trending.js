// pages/api/trending.js
// ✅ Trending fake news — stores checks in Vercel KV or local memory
// Uses in-memory store (resets on redeploy — upgrade to Vercel KV for persistence)

// In-memory trending store
const store = global._trending || (global._trending = {
  checks: [],   // Last 500 checks
  counts: {},   // verdict counts per topic
});

// Save a check to trending
export function saveTrending({ text, verdict, confidence, type }) {
  if (!text || !verdict) return;
  const snippet = text.slice(0, 80).replace(/\n/g, " ");
  const item = {
    id: Date.now(),
    snippet,
    verdict,
    confidence,
    type,
    date: new Date().toISOString(),
    votes: { agree: 0, disagree: 0 }
  };
  store.checks.unshift(item);
  if (store.checks.length > 500) store.checks.pop();
}

export default async function handler(req, res) {
  // GET — fetch trending
  if (req.method === "GET") {
    const { filter = "all", limit = 20 } = req.query;

    let items = [...store.checks];

    // Filter by verdict
    if (filter !== "all") {
      items = items.filter(i => i.verdict === filter.toUpperCase());
    }

    // Stats
    const total   = store.checks.length;
    const fake    = store.checks.filter(i => i.verdict === "FALSE").length;
    const real    = store.checks.filter(i => i.verdict === "TRUE").length;
    const mislead = store.checks.filter(i => i.verdict === "MISLEADING").length;

    return res.status(200).json({
      items: items.slice(0, parseInt(limit)),
      stats: { total, fake, real, mislead }
    });
  }

  // POST — add a vote
  if (req.method === "POST") {
    const { id, vote } = req.body; // vote = "agree" | "disagree"
    const item = store.checks.find(i => i.id === id);
    if (item && (vote === "agree" || vote === "disagree")) {
      item.votes[vote]++;
    }
    return res.status(200).json({ ok: true });
  }

  res.status(405).end();
}
