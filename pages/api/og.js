// pages/api/og.js
// Dynamic OG Image for WhatsApp/Facebook preview

export default function handler(req, res) {
  const { title = "TruthScan", verdict = "", confidence = "" } = req.query;

  const verdictColor =
    verdict === "TRUE" ? "#059669" :
    verdict === "FALSE" ? "#dc2626" :
    verdict === "MISLEADING" ? "#d97706" : "#10b981";

  const html = `
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8"/>
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  body {
    width:1200px; height:630px;
    background: linear-gradient(135deg, #f0fdf9 0%, #ecfdf5 50%, #f0f9ff 100%);
    font-family: Arial, sans-serif;
    display:flex; align-items:center; justify-content:center;
    overflow:hidden;
  }
  .card {
    background:white; border-radius:32px;
    padding:60px; width:1100px;
    box-shadow:0 20px 60px rgba(0,0,0,0.1);
    border:2px solid #e2e8f0;
  }
  .logo { font-size:28px; color:#64748b; margin-bottom:20px; }
  .title {
    font-size:52px; font-weight:900; color:#0f172a;
    line-height:1.1; margin-bottom:24px;
  }
  .verdict {
    display:inline-flex; align-items:center; gap:12px;
    padding:12px 28px; border-radius:40px;
    background:${verdictColor}15; border:2px solid ${verdictColor}40;
    color:${verdictColor}; font-size:24px; font-weight:700;
  }
  .footer {
    margin-top:32px; color:#94a3b8; font-size:20px;
    display:flex; align-items:center; gap:8px;
  }
</style>
</head>
<body>
<div class="card">
  <div class="logo">🛡️ TruthScan — AI Fake News Detector</div>
  <div class="title">${decodeURIComponent(title)}</div>
  ${verdict ? `<div class="verdict">${verdict === "TRUE" ? "✅ VERIFIED TRUE" : verdict === "FALSE" ? "❌ FAKE NEWS" : "⚠️ MISLEADING"} · ${confidence}% confidence</div>` : ""}
  <div class="footer">
    <span>truthscan.frontendin.com</span>
    <span>·</span>
    <span>Free AI Fact Checker</span>
  </div>
</div>
</body>
</html>`;

  res.setHeader("Content-Type", "text/html");
  res.send(html);
}
