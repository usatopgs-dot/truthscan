# 🛡️ TruthScan — AI Fake News Detector (Final Version)

## ✨ All Features

- 📝 **Text Check** — Paste any news/WhatsApp message (any language)
- 🔗 **URL Checker** — Paste link, AI fetches & analyzes
- 🖼️ **Image Detection** — Upload image, detect fake/manipulated
- 📋 **History Page** — All past checks with filters
- 📤 **Share Card** — Share result on WhatsApp
- 🚫 **Blocked Site Message** — Clear instructions when site blocks scan
- 🟢 **Timeline Badge** — CURRENT / OLD / FUTURE news detection
- 📊 **Credibility Score** — Source trust score (BBC=95, WhatsApp=15)
- 🌍 **Multi-Language** — Hindi, Punjabi, Urdu, Tamil, English + more
- 🔑 **BYOK** — User adds own Gemini key for unlimited checks
- 🆓 **Free Tier** — 5 free checks/day via Groq

---

## 🚀 Deploy on Vercel

### Step 1 — Get FREE Groq API Key
→ https://console.groq.com → Sign up → API Keys → Create Key (gsk_...)

### Step 2 — Upload to GitHub
```bash
git init
git add .
git commit -m "TruthScan Final"
git remote add origin https://github.com/YOUR_NAME/truthscan.git
git push -u origin main
```

### Step 3 — Deploy on Vercel
→ https://vercel.com → New Project → Import GitHub repo

### Step 4 — Add Environment Variable
```
Vercel → Settings → Environment Variables
GROQ_API_KEY = gsk_your_key_here
```

### Step 5 — Deploy! 🎉
Your app → https://truthscan.vercel.app

---

## 💰 Total Cost = $0.00
- Groq API → Free (14,400 req/day)
- Vercel → Free
- User's Gemini key → Their cost

## 📁 Structure
```
truthscan/
├── pages/
│   ├── index.js        ← Main UI
│   ├── history.js      ← History page
│   ├── _app.js
│   └── api/
│       └── check.js    ← 🔒 Server API (keys hidden)
├── styles/
│   └── globals.css
├── .env.example
└── package.json
```
