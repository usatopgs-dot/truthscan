// pages/api/check.js
// ✅ Free tier  → Groq API (your hidden key)
// ✅ Own key    → Gemini API LATEST models (user's key)

import Groq from "groq-sdk";

// ── Latest Gemini Models (March 2026) ─────────────────────────────
const GEMINI_API_BASE = "https://generativelanguage.googleapis.com/v1beta/models";

// ── Fetch URL content ─────────────────────────────────────────────
// ── Fetch URL content ─────────────────────────────────────────────
async function fetchUrlContent(url) {
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; TruthScan/1.0)" },
      signal: AbortSignal.timeout(8000)
    });
    const html = await res.text();

    // ✅ Check if website blocked us (Access Denied)
    const isBlocked =
      res.status === 403 ||
      res.status === 401 ||
      html.toLowerCase().includes("access denied") ||
      html.toLowerCase().includes("you don\'t have permission") ||
      html.toLowerCase().includes("403 forbidden") ||
      html.toLowerCase().includes("enable javascript") ||
      html.toLowerCase().includes("please enable cookies");

    if (isBlocked) {
      throw new Error(
        "BLOCKED: This website does not allow scanning. Please copy the news text manually and paste it in the Text tab."
      );
    }

    const text = html
      .replace(/<script[\s\S]*?<\/script>/gi, "")
      .replace(/<style[\s\S]*?<\/style>/gi, "")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim().slice(0, 3000);

    if (!text || text.length < 100) {
      throw new Error(
        "BLOCKED: Could not read this website. Please copy the news text manually and paste it in the Text tab."
      );
    }

    return text;
  } catch (e) {
    if (e.message.startsWith("BLOCKED:")) throw e;
    throw new Error("Could not fetch the URL. Make sure it\'s a valid, public link.");
  }
}

// ── Groq text (Free tier) ─────────────────────────────────────────
async function analyzeWithGroq(prompt, apiKey) {
  const groq = new Groq({ apiKey });
  const completion = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    max_tokens: 1000, temperature: 0.2,
    messages: [
      { role: "system", content: "You are a professional fact-checking AI. Always respond with valid JSON only. No markdown. No extra text." },
      { role: "user", content: prompt }
    ]
  });
  return completion.choices?.[0]?.message?.content || "";
}

// ── Groq image (Free tier) ────────────────────────────────────────
async function analyzeImageWithGroq(base64Image, mimeType, apiKey) {
  const groq = new Groq({ apiKey });
  const completion = await groq.chat.completions.create({
    model: "meta-llama/llama-4-scout-17b-16e-instruct",
    max_tokens: 1000, temperature: 0.2,
    messages: [{
      role: "user",
      content: [
        { type: "image_url", image_url: { url: `data:${mimeType};base64,${base64Image}` } },
        { type: "text", text: `Analyze this image for fake/manipulated content. Respond ONLY with JSON:\n{"verdict":"REAL" or "FAKE" or "MANIPULATED" or "MISLEADING","confidence":0-100,"summary":"one sentence","reasons":["r1","r2","r3"],"warning":"or null"}` }
      ]
    }]
  });
  return completion.choices?.[0]?.message?.content || "";
}

// ── Gemini text with auto-fallback (User's own key) ───────────────
async function analyzeWithGemini(prompt, apiKey) {
  // ✅ Latest models — tries newest first, falls back automatically
  const models = [
    "gemini-2.5-flash",       // Best & latest (2026)
    "gemini-2.5-flash-lite",  // Faster, lighter
    "gemini-2.0-flash",       // Stable fallback
  ];

  for (const model of models) {
    try {
      const res = await fetch(`${GEMINI_API_BASE}/${model}:generateContent?key=${apiKey}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.2, maxOutputTokens: 1000 }
        })
      });
      const data = await res.json();
      if (!res.ok) continue; // Try next model
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
      if (text) return text;
    } catch { continue; }
  }
  throw new Error("All Gemini models failed. Please check your API key.");
}

// ── Gemini image with auto-fallback (User's own key) ──────────────
async function analyzeImageWithGemini(base64Image, mimeType, apiKey) {
  // gemini-2.5-flash is multimodal — handles both text AND images
  const models = ["gemini-2.5-flash", "gemini-2.0-flash"];
  const imagePrompt = `Analyze this image for fake/manipulated content. Respond ONLY with JSON:\n{"verdict":"REAL" or "FAKE" or "MANIPULATED" or "MISLEADING","confidence":0-100,"summary":"one sentence","reasons":["r1","r2","r3"],"warning":"or null"}`;

  for (const model of models) {
    try {
      const res = await fetch(`${GEMINI_API_BASE}/${model}:generateContent?key=${apiKey}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [
            { inline_data: { mime_type: mimeType, data: base64Image } },
            { text: imagePrompt }
          ]}],
          generationConfig: { temperature: 0.2, maxOutputTokens: 1000 }
        })
      });
      const data = await res.json();
      if (!res.ok) continue;
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
      if (text) return text;
    } catch { continue; }
  }
  throw new Error("Gemini image analysis failed. Check your API key.");
}

// ── Main handler ──────────────────────────────────────────────────
export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();
  const { type, text, url, image, imageMime, userApiKey } = req.body;
  if (!type) return res.status(400).json({ error: "Missing type." });

  try {
    let resultText = "";
    const useOwnKey = !!userApiKey;

    if (type === "image") {
      if (!image) return res.status(400).json({ error: "No image provided." });
      resultText = useOwnKey
        ? await analyzeImageWithGemini(image, imageMime || "image/jpeg", userApiKey)
        : await analyzeImageWithGroq(image, imageMime || "image/jpeg", process.env.GROQ_API_KEY);
      const parsed = JSON.parse(resultText.replace(/```json|```/gi, "").trim());
      return res.status(200).json({ result: parsed, usedOwnKey: useOwnKey, checkType: "image" });
    }

    let contentToAnalyze = text;
    if (type === "url") {
      if (!url) return res.status(400).json({ error: "No URL provided." });
      contentToAnalyze = await fetchUrlContent(url);
      if (!contentToAnalyze || contentToAnalyze.length < 50)
        throw new Error("Could not extract content from this URL.");
    }

    if (!contentToAnalyze || contentToAnalyze.trim().length < 5)
      return res.status(400).json({ error: "Text is too short to analyze." });

    // ✅ Today's real date + language detection
    const today = new Date();
    const todayStr = today.toDateString();
    const todayISO = today.toISOString().split("T")[0];

    // ── Credibility Score: detect source from URL or text ──────────
    const SOURCE_SCORES = {

      // ── 🌍 International ──────────────────────────────────────
      "bbc.com":           { score: 95, label: "BBC News" },
      "reuters.com":       { score: 95, label: "Reuters" },
      "apnews.com":        { score: 94, label: "AP News" },
      "theguardian.com":   { score: 90, label: "The Guardian" },
      "nytimes.com":       { score: 88, label: "New York Times" },
      "bloomberg.com":     { score: 88, label: "Bloomberg" },
      "wsj.com":           { score: 87, label: "Wall Street Journal" },
      "washingtonpost.com":{ score: 86, label: "Washington Post" },
      "aljazeera.com":     { score: 84, label: "Al Jazeera" },
      "france24.com":      { score: 84, label: "France 24" },
      "dw.com":            { score: 88, label: "Deutsche Welle" },
      "cnn.com":           { score: 78, label: "CNN" },
      "foxnews.com":       { score: 60, label: "Fox News" },

      // ── 📺 Indian English ─────────────────────────────────────
      "thehindu.com":       { score: 90, label: "The Hindu" },
      "indianexpress.com":  { score: 85, label: "Indian Express" },
      "ndtv.com":           { score: 82, label: "NDTV" },
      "scroll.in":          { score: 82, label: "Scroll.in" },
      "thewire.in":         { score: 80, label: "The Wire" },
      "theprint.in":        { score: 80, label: "The Print" },
      "hindustantimes.com": { score: 80, label: "Hindustan Times" },
      "timesofindia.com":   { score: 78, label: "Times of India" },
      "livemint.com":       { score: 82, label: "Mint" },
      "economictimes.indiatimes.com": { score: 80, label: "Economic Times" },
      "indiatoday.in":      { score: 78, label: "India Today" },
      "news18.com":         { score: 75, label: "News18" },
      "firstpost.com":      { score: 74, label: "Firstpost" },
      "wionews.com":        { score: 74, label: "WION" },
      "deccanherald.com":   { score: 80, label: "Deccan Herald" },
      "telegraphindia.com": { score: 82, label: "The Telegraph India" },
      "businesstoday.in":   { score: 76, label: "Business Today" },

      // ── 📻 Indian Hindi ───────────────────────────────────────
      "aajtak.in":          { score: 72, label: "Aaj Tak" },
      "abplive.com":        { score: 70, label: "ABP Live" },
      "abpnews.abplive.com":{ score: 70, label: "ABP News" },
      "zeenews.india.com":  { score: 70, label: "Zee News" },
      "jagran.com":         { score: 72, label: "Dainik Jagran" },
      "bhaskar.com":        { score: 70, label: "Dainik Bhaskar" },
      "amarujala.com":      { score: 70, label: "Amar Ujala" },
      "livehindustan.com":  { score: 68, label: "Live Hindustan" },
      "navbharattimes.indiatimes.com": { score: 70, label: "Navbharat Times" },
      "jansatta.com":       { score: 68, label: "Jan Satta" },
      "tv9hindi.com":       { score: 65, label: "TV9 Bharatvarsh" },
      "news24online.com":   { score: 62, label: "News24" },

      // ── 🌾 Punjabi ────────────────────────────────────────────
      "punjabkesari.in":    { score: 68, label: "Punjab Kesari" },
      "tribuneindia.com":   { score: 78, label: "The Tribune" },
      "ajitjalandhar.com":  { score: 65, label: "Ajit Newspaper" },
      "jagbani.punjabkesari.in": { score: 65, label: "Jagbani" },
      "rozanaspokesman.com":{ score: 65, label: "Rozana Spokesman" },

      // ── 📡 TV Channels (YouTube/Web) ──────────────────────────
      "youtube.com":        { score: 30, label: "YouTube (Unverified)" },
      "timesnownews.com":   { score: 72, label: "Times Now" },
      "republic.world":     { score: 60, label: "Republic World" },
      "republicworld.com":  { score: 60, label: "Republic World" },
      "india.com":          { score: 55, label: "India.com" },
      "opindia.com":        { score: 40, label: "OpIndia" },
      "swarajyamag.com":    { score: 55, label: "Swarajya Mag" },
      "thequint.com":       { score: 78, label: "The Quint" },
      "newslaundry.com":    { score: 80, label: "Newslaundry" },
      "newsclick.in":       { score: 72, label: "NewsClick" },
      "medianamascarlive.com": { score: 62, label: "Media Nama" },

      // ── 🏛️ Official Sources ───────────────────────────────────
      "pib.gov.in":         { score: 92, label: "Press Info Bureau (Govt)" },
      "mygov.in":           { score: 90, label: "MyGov India (Govt)" },
      "who.int":            { score: 95, label: "World Health Organization" },
      "mohfw.gov.in":       { score: 90, label: "Ministry of Health India" },
      "wikipedia.org":      { score: 70, label: "Wikipedia" },

      // ── ⚠️ Social / Low Trust ─────────────────────────────────
      "whatsapp.com":       { score: 15, label: "WhatsApp Forward" },
      "facebook.com":       { score: 20, label: "Facebook Post" },
      "instagram.com":      { score: 22, label: "Instagram Post" },
      "twitter.com":        { score: 25, label: "Twitter/X Post" },
      "x.com":              { score: 25, label: "Twitter/X Post" },
      "telegram.org":       { score: 18, label: "Telegram Channel" },
      "reddit.com":         { score: 30, label: "Reddit Post" },
      "tiktok.com":         { score: 20, label: "TikTok Video" },
    };

    let sourceInfo = null;
    if (url) {
      try {
        const hostname = new URL(url).hostname.replace("www.", "");
        const matched = Object.keys(SOURCE_SCORES).find(k => hostname.includes(k));
        if (matched) sourceInfo = SOURCE_SCORES[matched];
        else sourceInfo = { score: 40, label: hostname };
      } catch {}
    }

    const prompt = `You are a professional fact-checking AI that supports ALL languages including Hindi, Punjabi, Urdu, Tamil, Telugu, Bengali, Marathi, Gujarati, and any other language.

IMPORTANT — Today's real date is: ${todayStr} (${todayISO}).
DO NOT treat any date in 2025 or 2026 as a future date — your training is outdated.

LANGUAGE RULE: 
- Detect the language of the content automatically.
- Respond in the SAME language as the content.
- If content is in Hindi → respond in Hindi
- If content is in Punjabi → respond in Punjabi  
- If content is in English → respond in English
- If content is in Urdu → respond in Urdu
- Always match the user's language exactly.
- Only the JSON keys must stay in English (verdict, summary, etc.) — but the VALUES (summary, reasons, timeline_note, source_note, warning) must be in the detected language.

Timeline classification:
- PAST: Published more than 7 days ago
- CURRENT: Published within last 7 days
- FUTURE: Claims future events (truly suspicious)

${sourceInfo ? `SOURCE INFO: This content is from "${sourceInfo.label}" which has a base credibility of ${sourceInfo.score}/100. Factor this into your analysis.` : "SOURCE: Unknown/unverified source. Be more cautious."}

Analyze this ${type === "url" ? "news article" : "news/message"} carefully:
Content: "${contentToAnalyze.slice(0, 2000)}"

Respond ONLY with JSON (no markdown, no extra text):
{
  "verdict": "TRUE" or "FALSE" or "MISLEADING",
  "confidence": number 0-100,
  "summary": "one clear sentence about accuracy",
  "timeline": "PAST" or "CURRENT" or "FUTURE" or "UNKNOWN",
  "timeline_note": "one sentence about when this news is from and relevance",
  "source_credibility": number 0-100,
  "source_note": "one sentence about how trustworthy this source is",
  "reasons": ["point 1", "point 2", "point 3"],
  "language_detected": "English" or "Hindi" or "Punjabi" or whatever language,
  "warning": "write warning if dangerous, else null"
}`;

    // Pass sourceInfo to response
    req._sourceInfo = sourceInfo;

    resultText = useOwnKey
      ? await analyzeWithGemini(prompt, userApiKey)
      : await analyzeWithGroq(prompt, process.env.GROQ_API_KEY);

    const parsed = JSON.parse(resultText.replace(/```json|```/gi, "").trim());
    // Merge server-side source info into result
    if (req._sourceInfo && !parsed.source_credibility) {
      parsed.source_credibility = req._sourceInfo.score;
      parsed.source_note = `This content is from ${req._sourceInfo.label}.`;
    }
    return res.status(200).json({ result: parsed, usedOwnKey: useOwnKey, checkType: type });

  } catch (err) {
    return res.status(500).json({ error: err.message || "Analysis failed." });
  }
}

export const config = { api: { bodyParser: { sizeLimit: "5mb" } } };
