import { useState, useEffect, useRef } from "react";
import Head from "next/head";
import Link from "next/link";

const FREE_LIMIT = 5;

const VC = {
  TRUE:        { color: "#22d3a0", glow: "rgba(34,211,160,0.3)",  bg: "rgba(34,211,160,0.06)",  label: "VERIFIED TRUE",   icon: "✓" },
  FALSE:       { color: "#ff4d6d", glow: "rgba(255,77,109,0.3)",  bg: "rgba(255,77,109,0.06)",  label: "FAKE NEWS",        icon: "✗" },
  MISLEADING:  { color: "#fbbf24", glow: "rgba(251,191,36,0.3)",  bg: "rgba(251,191,36,0.06)",  label: "MISLEADING",       icon: "!" },
  REAL:        { color: "#22d3a0", glow: "rgba(34,211,160,0.3)",  bg: "rgba(34,211,160,0.06)",  label: "IMAGE LOOKS REAL", icon: "✓" },
  FAKE:        { color: "#ff4d6d", glow: "rgba(255,77,109,0.3)",  bg: "rgba(255,77,109,0.06)",  label: "FAKE IMAGE",       icon: "✗" },
  MANIPULATED: { color: "#fbbf24", glow: "rgba(251,191,36,0.3)",  bg: "rgba(251,191,36,0.06)",  label: "MANIPULATED",      icon: "!" },
};

const TL = {
  CURRENT: { color: "#22d3a0", icon: "●", label: "CURRENT" },
  PAST:    { color: "#818cf8", icon: "●", label: "OLD NEWS" },
  FUTURE:  { color: "#ff4d6d", icon: "●", label: "FUTURE CLAIM" },
  UNKNOWN: { color: "#475569", icon: "●", label: "UNKNOWN" },
};

const TABS = [
  { id: "text",  icon: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>`, label: "Text" },
  { id: "url",   icon: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>`, label: "URL" },
  { id: "image", icon: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>`, label: "Image" },
];

export default function TruthScan() {
  const [tab, setTab]               = useState("text");
  const [textInput, setTextInput]   = useState("");
  const [urlInput, setUrlInput]     = useState("");
  const [imageFile, setImageFile]   = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [result, setResult]         = useState(null);
  const [loading, setLoading]       = useState(false);
  const [freeChecks, setFreeChecks] = useState(0);
  const [apiKey, setApiKey]         = useState("");
  const [showModal, setShowModal]   = useState(false);
  const [showShare, setShowShare]   = useState(false);
  const [tempKey, setTempKey]       = useState("");
  const [showKeyText, setShowKeyText] = useState(false);
  const [error, setError]           = useState("");
  const [copied, setCopied]         = useState(false);
  const [installPrompt, setInstallPrompt] = useState(null);
  const [showInstall, setShowInstall] = useState(false);
  const [mounted, setMounted]       = useState(false);
  const fileRef = useRef();

  useEffect(() => {
    setMounted(true);
    const today = new Date().toDateString();
    const saved = localStorage.getItem("ts_date");
    const cnt   = parseInt(localStorage.getItem("ts_checks") || "0");
    const key   = localStorage.getItem("ts_key") || "";
    if (saved === today) setFreeChecks(cnt);
    else { localStorage.setItem("ts_date", today); localStorage.setItem("ts_checks", "0"); }
    setApiKey(key);
    const handler = (e) => { e.preventDefault(); setInstallPrompt(e); setShowInstall(true); };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const remaining = FREE_LIMIT - freeChecks;
  const canCheck  = !!apiKey || remaining > 0;

  const onImagePick = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setImagePreview(ev.target.result);
    reader.readAsDataURL(file);
    setResult(null); setError("");
  };

  const analyze = async () => {
    if (loading) return;
    if (!canCheck) { setShowModal(true); return; }
    setLoading(true); setResult(null); setError("");
    try {
      let body = { userApiKey: apiKey || null };
      if (tab === "text") {
        if (!textInput.trim()) { setError("Please paste some text first."); setLoading(false); return; }
        body = { ...body, type: "text", text: textInput.trim() };
      } else if (tab === "url") {
        if (!urlInput.trim()) { setError("Please enter a URL."); setLoading(false); return; }
        const u = urlInput.startsWith("http") ? urlInput.trim() : `https://${urlInput.trim()}`;
        body = { ...body, type: "url", url: u };
      } else {
        if (!imageFile) { setError("Please select an image."); setLoading(false); return; }
        const b64 = await toBase64(imageFile);
        body = { ...body, type: "image", image: b64, imageMime: imageFile.type };
      }
      const res  = await fetch("/api/check", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Something went wrong.");
      setResult(data.result);
      try {
        const hist = JSON.parse(localStorage.getItem("ts_history") || "[]");
        hist.unshift({ type: tab, input: tab === "image" ? imageFile?.name : tab === "url" ? urlInput : textInput, result: data.result, date: new Date().toISOString() });
        localStorage.setItem("ts_history", JSON.stringify(hist.slice(0, 50)));
      } catch {}
      if (!apiKey) {
        const nc = freeChecks + 1;
        setFreeChecks(nc);
        localStorage.setItem("ts_checks", String(nc));
        localStorage.setItem("ts_date", new Date().toDateString());
      }
    } catch (e) { setError(e.message); }
    setLoading(false);
  };

  const saveKey   = (k) => { localStorage.setItem("ts_key", k.trim()); setApiKey(k.trim()); };
  const removeKey = ()  => { localStorage.removeItem("ts_key"); setApiKey(""); };
  const vc = result ? VC[result.verdict] : null;
  const tl = result?.timeline ? TL[result.timeline] || TL.UNKNOWN : null;
  const shareText = result && vc ? `🛡️ TruthScan\n\n${vc.label}\nConfidence: ${result.confidence}%\n\n${result.summary}\n\n${result.reasons?.map(r=>`• ${r}`).join("\n")}` : "";
  const handleShare = () => { if (navigator.share) navigator.share({ text: shareText }); else { navigator.clipboard.writeText(shareText); setCopied(true); setTimeout(()=>setCopied(false),2000); } setShowShare(false); };
  const handleInstall = async () => { if (!installPrompt) return; installPrompt.prompt(); const {outcome} = await installPrompt.userChoice; if (outcome==="accepted") setShowInstall(false); setInstallPrompt(null); };

  return (
    <>
      <Head>
        <title>TruthScan — AI Fake News Detector</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#0d0f1a" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-title" content="TruthScan" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link href="https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500;600&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet" />
        <style>{`
          *, *::before, *::after { margin:0; padding:0; box-sizing:border-box; }
          body { background:#0a0e1e; color:#e2e8f0; font-family:'DM Sans',sans-serif; -webkit-font-smoothing:antialiased; }
          ::selection { background:rgba(34,211,160,0.25); color:#fff; }
          textarea, input { font-family:'DM Sans',sans-serif; }
          textarea::placeholder, input::placeholder { color:#334155; }
          a { text-decoration:none; }
          button { font-family:'DM Sans',sans-serif; }

          @keyframes fadeUp   { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
          @keyframes fadeIn   { from{opacity:0} to{opacity:1} }
          @keyframes scanLine { 0%{left:-40%} 100%{left:140%} }
          @keyframes pulse    { 0%,100%{opacity:1} 50%{opacity:0.4} }
          @keyframes spin     { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
          @keyframes shimmer  { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
          @keyframes glow     { 0%,100%{box-shadow:0 0 20px rgba(34,211,160,0.2)} 50%{box-shadow:0 0 40px rgba(34,211,160,0.5)} }

          .tab-btn:hover { background:rgba(255,255,255,0.06) !important; }
          .tab-btn.active { background:rgba(34,211,160,0.1) !important; border-color:rgba(34,211,160,0.4) !important; color:#22d3a0 !important; }
          .analyze-btn:hover:not(:disabled) { transform:translateY(-1px); box-shadow:0 8px 30px rgba(34,211,160,0.3) !important; }
          .analyze-btn:active:not(:disabled) { transform:translateY(0); }
          .card { transition:border-color 0.2s; }
          .card:hover { border-color:rgba(255,255,255,0.08) !important; }
        `}</style>
      </Head>

      <div style={{ minHeight:"100vh", background:"#0f1724", position:"relative", overflow:"hidden" }}>

        {/* Background effects */}
        <div style={{ position:"fixed", inset:0, pointerEvents:"none", zIndex:0 }}>
          <div style={{ position:"absolute", top:"-15%", left:"55%", width:700, height:700,
            background:"radial-gradient(circle, rgba(34,211,160,0.18) 0%, transparent 65%)", borderRadius:"50%" }} />
          <div style={{ position:"absolute", bottom:"-10%", left:"-15%", width:600, height:600,
            background:"radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 65%)", borderRadius:"50%" }} />
          <div style={{ position:"absolute", top:"35%", right:"-8%", width:500, height:500,
            background:"radial-gradient(circle, rgba(236,72,153,0.1) 0%, transparent 65%)", borderRadius:"50%" }} />
          <div style={{ position:"absolute", top:"60%", left:"30%", width:400, height:400,
            background:"radial-gradient(circle, rgba(251,191,36,0.07) 0%, transparent 65%)", borderRadius:"50%" }} />
          {/* Grid */}
          <div style={{ position:"absolute", inset:0, opacity:0.04,
            backgroundImage:"linear-gradient(rgba(255,255,255,0.8) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.8) 1px,transparent 1px)",
            backgroundSize:"50px 50px" }} />
        </div>

        <div style={{ position:"relative", zIndex:1, maxWidth:680, margin:"0 auto", padding:"32px 20px 60px" }}>

          {/* Install Banner */}
          {showInstall && (
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between",
              padding:"12px 18px", marginBottom:20, borderRadius:14,
              background:"rgba(34,211,160,0.06)", border:"1px solid rgba(34,211,160,0.2)",
              animation:"fadeIn 0.4s ease", flexWrap:"wrap", gap:10 }}>
              <div style={{ display:"flex", alignItems:"center", gap:12 }}>
                <span style={{ fontSize:24 }}>📲</span>
                <div>
                  <div style={{ color:"#22d3a0", fontSize:13, fontWeight:600, fontFamily:"'Syne',sans-serif" }}>Install TruthScan</div>
                  <div style={{ color:"#475569", fontSize:12 }}>Add to home screen for quick access</div>
                </div>
              </div>
              <div style={{ display:"flex", gap:8 }}>
                <button onClick={() => setShowInstall(false)} style={{ padding:"6px 14px", background:"transparent",
                  border:"1px solid #1e293b", borderRadius:8, color:"#475569", cursor:"pointer", fontSize:12 }}>Later</button>
                <button onClick={handleInstall} style={{ padding:"6px 18px",
                  background:"linear-gradient(135deg,#22d3a0,#0891b2)", border:"none",
                  borderRadius:8, color:"#000", cursor:"pointer", fontSize:12, fontWeight:700 }}>Install</button>
              </div>
            </div>
          )}

          {/* Header */}
          <div style={{ textAlign:"center", marginBottom:44, animation:"fadeUp 0.6s ease" }}>
            {/* Logo mark */}
            <div style={{ display:"inline-flex", alignItems:"center", justifyContent:"center",
              width:72, height:72, borderRadius:20, marginBottom:20,
              background:"linear-gradient(135deg,rgba(34,211,160,0.25),rgba(8,145,178,0.2))",
              border:"1px solid rgba(34,211,160,0.4)",
              boxShadow:"0 0 50px rgba(34,211,160,0.25), 0 0 100px rgba(34,211,160,0.1), inset 0 1px 0 rgba(255,255,255,0.1)" }}>
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none">
                <path d="M12 2L3 7v5c0 5.25 3.75 10.15 9 11.25C17.25 22.15 21 17.25 21 12V7L12 2z"
                  fill="rgba(34,211,160,0.2)" stroke="#22d3a0" strokeWidth="1.5"/>
                <path d="M9 12l2 2 4-4" stroke="#22d3a0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>

            <h1 style={{ fontFamily:"'Syne',sans-serif", fontSize:40, fontWeight:800, letterSpacing:"-0.02em",
              background:"linear-gradient(135deg,#ffffff 20%,#22d3a0 60%,#0891b2 100%)",
              WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent",
              margin:"0 0 8px", lineHeight:1 }}>TruthScan</h1>
            <p style={{ color:"#64748b", fontSize:13, letterSpacing:"0.15em", fontFamily:"'JetBrains Mono',monospace",
              fontWeight:500 }}>AI-POWERED FACT CHECKER</p>

            {/* Nav */}
            <div style={{ display:"flex", justifyContent:"center", gap:6, marginTop:20 }}>
              <span style={{ padding:"6px 16px", borderRadius:20, background:"rgba(34,211,160,0.1)",
                border:"1px solid rgba(34,211,160,0.25)", color:"#22d3a0", fontSize:12, fontWeight:500,
                cursor:"default" }}>Check News</span>
              <Link href="/history" style={{ padding:"6px 16px", borderRadius:20, background:"transparent",
                border:"1px solid #1e293b", color:"#475569", fontSize:12, fontWeight:500,
                transition:"all 0.2s" }}>History</Link>
            </div>

            {/* Status pill */}
            <div style={{ marginTop:16 }}>
              {apiKey ? (
                <div style={{ display:"inline-flex", alignItems:"center", gap:8, padding:"6px 16px",
                  borderRadius:20, background:"rgba(34,211,160,0.08)", border:"1px solid rgba(34,211,160,0.2)" }}>
                  <span style={{ width:6, height:6, borderRadius:"50%", background:"#22d3a0",
                    boxShadow:"0 0 8px #22d3a0", display:"block", animation:"pulse 2s infinite" }} />
                  <span style={{ color:"#22d3a0", fontSize:12, fontWeight:500 }}>Unlimited · API Key Active</span>
                  <button onClick={removeKey} style={{ background:"none", border:"none", color:"#334155",
                    cursor:"pointer", fontSize:13, lineHeight:1, padding:"0 2px" }}>×</button>
                </div>
              ) : (
                <div style={{ display:"inline-flex", alignItems:"center", gap:8, padding:"6px 16px",
                  borderRadius:20, background:"rgba(255,255,255,0.03)", border:"1px solid #1e293b" }}>
                  <span style={{ width:6, height:6, borderRadius:"50%", display:"block",
                    background: remaining > 0 ? "#22d3a0" : "#ff4d6d" }} />
                  <span style={{ color:"#64748b", fontSize:12 }}>
                    {remaining > 0 ? `${remaining} of ${FREE_LIMIT} free checks left` : "Daily limit reached"}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Main card */}
          <div style={{ background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.08)", borderRadius:24,
            padding:24, marginBottom:12, backdropFilter:"blur(20px)",
            boxShadow:"0 4px 60px rgba(0,0,0,0.4), 0 0 0 1px rgba(34,211,160,0.05), inset 0 1px 0 rgba(255,255,255,0.06)",
            animation:"fadeUp 0.6s ease 0.1s both" }}>

            {/* Tabs */}
            <div style={{ display:"flex", gap:4, marginBottom:20, padding:4,
              background:"rgba(0,0,0,0.3)", borderRadius:14, border:"1px solid rgba(255,255,255,0.06)" }}>
              {TABS.map(t => (
                <button key={t.id}
                  onClick={() => { setTab(t.id); setResult(null); setError(""); }}
                  className={`tab-btn${tab===t.id?" active":""}`}
                  style={{ flex:1, padding:"10px 12px", border:"1px solid transparent",
                    borderRadius:10, cursor:"pointer", transition:"all 0.2s",
                    color: tab===t.id ? "#22d3a0" : "#64748b",
                    background: tab===t.id ? "rgba(34,211,160,0.1)" : "transparent",
                    borderColor: tab===t.id ? "rgba(34,211,160,0.3)" : "transparent",
                    fontSize:13, fontWeight:500, display:"flex",
                    alignItems:"center", justifyContent:"center", gap:7 }}>
                  <span dangerouslySetInnerHTML={{__html: t.icon}} />
                  {t.label}
                </button>
              ))}
            </div>

            {/* Input areas */}
            {tab === "text" && (
              <div>
                <label style={{ color:"#4a90a4", fontSize:11, letterSpacing:"0.12em",
                  fontFamily:"'JetBrains Mono',monospace", display:"block", marginBottom:10 }}>
                  PASTE NEWS · HEADLINE · WHATSAPP MESSAGE
                </label>
                <textarea value={textInput} onChange={e => setTextInput(e.target.value)}
                  onKeyDown={e => e.key==="Enter" && e.ctrlKey && analyze()}
                  placeholder="Paste news in any language — English, हिंदी, ਪੰਜਾਬੀ, Urdu..."
                  rows={6}
                  style={{ width:"100%", background:"transparent", border:"none", outline:"none",
                    color:"#e2e8f0", fontSize:15, lineHeight:1.8, resize:"none",
                    boxSizing:"border-box" }} />
                {textInput && (
                  <div style={{ display:"flex", justifyContent:"flex-end", marginTop:8 }}>
                    <span style={{ color:"#2d4a5e", fontSize:11, fontFamily:"'JetBrains Mono',monospace" }}>
                      {textInput.length} chars
                    </span>
                  </div>
                )}
              </div>
            )}

            {tab === "url" && (
              <div>
                <label style={{ color:"#4a90a4", fontSize:11, letterSpacing:"0.12em",
                  fontFamily:"'JetBrains Mono',monospace", display:"block", marginBottom:10 }}>
                  PASTE ARTICLE URL
                </label>
                <div style={{ display:"flex", alignItems:"center", gap:10,
                  background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.08)",
                  borderRadius:12, padding:"4px 4px 4px 16px" }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#334155" strokeWidth="2">
                    <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
                  </svg>
                  <input type="url" value={urlInput} onChange={e => setUrlInput(e.target.value)}
                    onKeyDown={e => e.key==="Enter" && analyze()}
                    placeholder="https://example.com/news-article"
                    style={{ flex:1, background:"transparent", border:"none", outline:"none",
                      color:"#1e293b", fontSize:15, padding:"10px 0" }} />
                  {urlInput && (
                    <button onClick={() => setUrlInput("")}
                      style={{ padding:"8px 12px", background:"rgba(255,255,255,0.05)",
                        border:"none", borderRadius:9, color:"#475569", cursor:"pointer", fontSize:12 }}>
                      Clear
                    </button>
                  )}
                </div>
                <p style={{ color:"#2d4a5e", fontSize:12, marginTop:10, fontFamily:"'JetBrains Mono',monospace" }}>
                  AI fetches and analyzes the full article text
                </p>
              </div>
            )}

            {tab === "image" && (
              <div>
                <label style={{ color:"#4a90a4", fontSize:11, letterSpacing:"0.12em",
                  fontFamily:"'JetBrains Mono',monospace", display:"block", marginBottom:10 }}>
                  UPLOAD IMAGE TO VERIFY
                </label>
                {imagePreview ? (
                  <div style={{ position:"relative", borderRadius:14, overflow:"hidden", border:"1px solid #1e293b" }}>
                    <img src={imagePreview} alt="preview"
                      style={{ width:"100%", maxHeight:260, objectFit:"contain", background:"#0f172a", display:"block" }} />
                    <button onClick={() => { setImageFile(null); setImagePreview(null); setResult(null); }}
                      style={{ position:"absolute", top:10, right:10,
                        background:"rgba(0,0,0,0.7)", border:"1px solid #334155",
                        borderRadius:8, width:32, height:32, color:"#94a3b8",
                        cursor:"pointer", fontSize:16, display:"flex", alignItems:"center", justifyContent:"center" }}>
                      ×
                    </button>
                  </div>
                ) : (
                  <div onClick={() => fileRef.current.click()}
                    style={{ border:"2px dashed rgba(34,211,160,0.2)", borderRadius:14,
                      padding:"48px 20px", textAlign:"center", cursor:"pointer",
                      transition:"all 0.2s", background:"rgba(34,211,160,0.02)" }}
                    onMouseOver={e => { e.currentTarget.style.borderColor="#334155"; e.currentTarget.style.background="rgba(34,211,160,0.03)"; }}
                    onMouseOut={e => { e.currentTarget.style.borderColor="#1e293b"; e.currentTarget.style.background="rgba(0,0,0,0.1)"; }}>
                    <div style={{ fontSize:36, marginBottom:12 }}>📸</div>
                    <p style={{ color:"#475569", fontSize:14, fontWeight:500, marginBottom:4 }}>Drop image or click to upload</p>
                    <p style={{ color:"#2d4a5e", fontSize:12, fontFamily:"'JetBrains Mono',monospace" }}>JPG · PNG · WEBP · GIF</p>
                  </div>
                )}
                <input ref={fileRef} type="file" accept="image/*" onChange={onImagePick} style={{ display:"none" }} />
              </div>
            )}

            {/* Scan progress bar */}
            {loading && (
              <div style={{ position:"relative", height:3, background:"rgba(255,255,255,0.04)",
                borderRadius:2, marginTop:16, overflow:"hidden" }}>
                <div style={{ position:"absolute", top:0, left:0, height:"100%", width:"40%",
                  background:"linear-gradient(90deg,transparent,#22d3a0,transparent)",
                  animation:"scanLine 1.4s ease-in-out infinite" }} />
              </div>
            )}
          </div>

          {/* Analyze button */}
          <button onClick={analyze} disabled={loading}
            className="analyze-btn"
            style={{ width:"100%", padding:"16px", border:"none", borderRadius:16,
              background: loading ? "rgba(255,255,255,0.04)" : "linear-gradient(135deg,#22d3a0 0%,#0891b2 100%)",
              color: loading ? "#334155" : "#0d1117",
              fontSize:14, fontWeight:700, fontFamily:"'Syne',sans-serif",
              letterSpacing:"0.08em", cursor: loading ? "not-allowed" : "pointer",
              textTransform:"uppercase", transition:"all 0.2s",
              boxShadow: loading ? "none" : "0 4px 30px rgba(34,211,160,0.4), 0 0 60px rgba(34,211,160,0.15)",
              marginBottom:20, display:"flex", alignItems:"center", justifyContent:"center", gap:10 }}>
            {loading ? (
              <>
                <span style={{ width:16, height:16, border:"2px solid #334155",
                  borderTopColor:"#22d3a0", borderRadius:"50%", display:"block",
                  animation:"spin 0.8s linear infinite" }} />
                ANALYZING...
              </>
            ) : (
              <>
                {tab === "image" ? "ANALYZE IMAGE" : tab === "url" ? "FETCH & ANALYZE" : "ANALYZE NOW"}
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M5 12h14M12 5l7 7-7 7"/>
                </svg>
              </>
            )}
          </button>

          {/* Error */}
          {error && (
            <div style={{ borderRadius:16, marginBottom:20, overflow:"hidden",
              animation:"fadeUp 0.3s ease" }}>
              {error.includes("BLOCKED") ? (
                <div style={{ padding:"20px 22px", background:"rgba(251,191,36,0.06)",
                  border:"1px solid rgba(251,191,36,0.2)", borderRadius:16 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:12 }}>
                    <div style={{ width:36, height:36, borderRadius:10,
                      background:"rgba(251,191,36,0.12)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:18 }}>🚫</div>
                    <div>
                      <div style={{ color:"#fbbf24", fontSize:14, fontWeight:700, fontFamily:"'Syne',sans-serif" }}>Website Blocked TruthScan</div>
                      <div style={{ color:"#78350f", fontSize:12, marginTop:1 }}>This site doesn't allow external scanning</div>
                    </div>
                  </div>
                  <div style={{ display:"flex", flexDirection:"column", gap:8, marginBottom:16 }}>
                    {["Open the news article in your browser", "Select all text with Ctrl+A then copy with Ctrl+C", "Come back and paste it in the Text tab"].map((s,i) => (
                      <div key={i} style={{ display:"flex", gap:12, alignItems:"flex-start" }}>
                        <span style={{ width:22, height:22, borderRadius:6, background:"rgba(251,191,36,0.15)",
                          color:"#fbbf24", fontSize:11, fontWeight:700, display:"flex", alignItems:"center",
                          justifyContent:"center", flexShrink:0 }}>{i+1}</span>
                        <span style={{ color:"#94a3b8", fontSize:13, paddingTop:3 }}>{s}</span>
                      </div>
                    ))}
                  </div>
                  <button onClick={() => { setTab("text"); setError(""); setUrlInput(""); }}
                    style={{ padding:"9px 20px", background:"rgba(251,191,36,0.15)",
                      border:"1px solid rgba(251,191,36,0.3)", borderRadius:10, color:"#fbbf24",
                      fontSize:12, fontWeight:600, cursor:"pointer" }}>
                    Switch to Text Tab →
                  </button>
                </div>
              ) : (
                <div style={{ padding:"14px 18px", background:"rgba(255,77,109,0.06)",
                  border:"1px solid rgba(255,77,109,0.2)", borderRadius:16,
                  color:"#f87171", fontSize:13, display:"flex", gap:10, alignItems:"flex-start" }}>
                  <span style={{ flexShrink:0, marginTop:1 }}>⚠️</span>
                  <span>{error}</span>
                </div>
              )}
            </div>
          )}

          {/* Result */}
          {result && vc && (
            <div style={{ animation:"fadeUp 0.5s ease" }}>

              {/* Verdict card */}
              <div style={{ padding:"24px", borderRadius:20, marginBottom:12,
                background: vc.bg, border:`1px solid ${vc.color}40`,
                boxShadow:`0 8px 40px ${vc.glow}, 0 1px 3px rgba(0,0,0,0.05)` }}>

                {/* Top row */}
                <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", marginBottom:20, gap:12 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:14 }}>
                    <div style={{ width:48, height:48, borderRadius:14, display:"flex",
                      alignItems:"center", justifyContent:"center", fontSize:22, fontWeight:800,
                      background:`${vc.color}18`, border:`1.5px solid ${vc.color}40`,
                      color:vc.color, fontFamily:"'Syne',sans-serif",
                      boxShadow:`0 0 20px ${vc.glow}` }}>
                      {vc.icon}
                    </div>
                    <div>
                      <div style={{ color:vc.color, fontSize:18, fontWeight:800,
                        fontFamily:"'Syne',sans-serif", letterSpacing:"-0.01em" }}>
                        {vc.label}
                      </div>
                      {result.language_detected && result.language_detected.toLowerCase() !== "english" && (
                        <div style={{ display:"inline-flex", alignItems:"center", gap:5, marginTop:5,
                          padding:"2px 10px", borderRadius:10,
                          background:"rgba(129,140,248,0.12)", border:"1px solid rgba(129,140,248,0.2)" }}>
                          <span style={{ fontSize:10 }}>🌍</span>
                          <span style={{ color:"#818cf8", fontSize:10, fontFamily:"'JetBrains Mono',monospace" }}>
                            {result.language_detected.toUpperCase()}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  {/* Confidence ring */}
                  <div style={{ textAlign:"center", flexShrink:0 }}>
                    <div style={{ fontSize:26, fontWeight:800, fontFamily:"'Syne',sans-serif", color:vc.color, lineHeight:1 }}>
                      {result.confidence}%
                    </div>
                    <div style={{ color:"#334155", fontSize:10, fontFamily:"'JetBrains Mono',monospace", marginTop:3 }}>CONFIDENCE</div>
                    <div style={{ width:60, height:4, background:"rgba(255,255,255,0.06)", borderRadius:2, marginTop:6, overflow:"hidden" }}>
                      <div style={{ height:"100%", width:`${result.confidence}%`, background:vc.color, borderRadius:2, transition:"width 0.8s ease" }} />
                    </div>
                  </div>
                </div>

                {/* Summary */}
                <div style={{ padding:"14px 16px", background:"rgba(255,255,255,0.04)", borderRadius:12, marginBottom:16,
                  borderLeft:`3px solid ${vc.color}60` }}>
                  <p style={{ color:"#d1e0ef", fontSize:15, lineHeight:1.75, margin:0 }}>
                    {result.summary}
                  </p>
                </div>

                {/* Source credibility */}
                {result.source_credibility !== undefined && (
                  <div style={{ padding:"14px 16px", background:"rgba(255,255,255,0.04)", borderRadius:12, marginBottom:14,
                    border:"1px solid rgba(255,255,255,0.07)" }}>
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
                      <span style={{ color:"#334155", fontSize:11, letterSpacing:"0.1em",
                        fontFamily:"'JetBrains Mono',monospace" }}>SOURCE CREDIBILITY</span>
                      <div style={{ display:"flex", gap:2 }}>
                        {[1,2,3,4,5].map(i => (
                          <span key={i} style={{ fontSize:12,
                            color: i<=Math.round(result.source_credibility/20) ? "#fbbf24" : "#1e3352" }}>★</span>
                        ))}
                        <span style={{ color: result.source_credibility>=80?"#22d3a0":result.source_credibility>=50?"#fbbf24":"#ff4d6d",
                          fontSize:12, fontWeight:700, fontFamily:"'JetBrains Mono',monospace", marginLeft:6 }}>
                          {result.source_credibility}/100
                        </span>
                      </div>
                    </div>
                    <div style={{ height:5, background:"rgba(255,255,255,0.05)", borderRadius:3, overflow:"hidden", marginBottom:8 }}>
                      <div style={{ height:"100%", borderRadius:3, width:`${result.source_credibility}%`,
                        background: result.source_credibility>=80 ? "linear-gradient(90deg,#22d3a0,#0891b2)" :
                                    result.source_credibility>=50 ? "linear-gradient(90deg,#f59e0b,#fbbf24)" :
                                    "linear-gradient(90deg,#dc2626,#ff4d6d)",
                        transition:"width 1s ease" }} />
                    </div>
                    {result.source_note && <p style={{ color:"#475569", fontSize:12, margin:0 }}>{result.source_note}</p>}
                  </div>
                )}

                {/* Timeline */}
                {tl && (
                  <div style={{ display:"inline-flex", alignItems:"center", gap:8,
                    padding:"7px 14px", borderRadius:20, marginBottom:16,
                    background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.08)" }}>
                    <span style={{ color:tl.color, fontSize:8, animation:"pulse 2s infinite" }}>●</span>
                    <span style={{ color:tl.color, fontSize:11, fontFamily:"'JetBrains Mono',monospace", fontWeight:500 }}>
                      {tl.label}
                    </span>
                    {result.timeline_note && (
                      <span style={{ color:"#334155", fontSize:11 }}>· {result.timeline_note}</span>
                    )}
                  </div>
                )}

                {/* Analysis points */}
                <div style={{ marginBottom:16 }}>
                  <div style={{ color:"#2d4a5e", fontSize:10, letterSpacing:"0.15em",
                    fontFamily:"'JetBrains Mono',monospace", marginBottom:10 }}>ANALYSIS POINTS</div>
                  <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                    {result.reasons?.map((r,i) => (
                      <div key={i} style={{ display:"flex", gap:12, alignItems:"flex-start",
                        padding:"10px 14px", background:"rgba(255,255,255,0.04)",
                        borderRadius:10, border:"1px solid #0f172a" }}>
                        <span style={{ color:vc.color, fontSize:12, flexShrink:0,
                          fontFamily:"'JetBrains Mono',monospace", marginTop:2 }}>
                          {String(i+1).padStart(2,"0")}
                        </span>
                        <span style={{ color:"#b0c4d8", fontSize:14, lineHeight:1.6 }}>{r}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Warning */}
                {result.warning && (
                  <div style={{ padding:"12px 16px", background:"rgba(251,191,36,0.06)",
                    border:"1px solid rgba(251,191,36,0.2)", borderRadius:12,
                    color:"#fbbf24", fontSize:13, marginBottom:16 }}>
                    ⚠️ {result.warning}
                  </div>
                )}

                {/* Action buttons */}
                <div style={{ display:"flex", gap:10, flexWrap:"wrap" }}>
                  <button onClick={() => setShowShare(true)}
                    style={{ flex:1, minWidth:120, padding:"10px 20px",
                      background:"rgba(255,255,255,0.07)", border:"1px solid rgba(255,255,255,0.1)",
                      borderRadius:12, color:"#94a3b8", fontSize:13, fontWeight:500,
                      cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:8,
                      transition:"all 0.2s" }}
                    onMouseOver={e => { e.currentTarget.style.background="rgba(255,255,255,0.08)"; e.currentTarget.style.color="#e2e8f0"; }}
                    onMouseOut={e => { e.currentTarget.style.background="rgba(255,255,255,0.05)"; e.currentTarget.style.color="#94a3b8"; }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/>
                    </svg>
                    Share
                  </button>
                  <button onClick={() => { setResult(null); setTextInput(""); setUrlInput(""); setImageFile(null); setImagePreview(null); }}
                    style={{ flex:1, minWidth:120, padding:"10px 20px",
                      background:"rgba(255,255,255,0.07)", border:"1px solid rgba(255,255,255,0.1)",
                      borderRadius:12, color:"#94a3b8", fontSize:13, fontWeight:500,
                      cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:8,
                      transition:"all 0.2s" }}
                    onMouseOver={e => { e.currentTarget.style.background="rgba(255,255,255,0.08)"; e.currentTarget.style.color="#e2e8f0"; }}
                    onMouseOut={e => { e.currentTarget.style.background="rgba(255,255,255,0.05)"; e.currentTarget.style.color="#94a3b8"; }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-3.49"/>
                    </svg>
                    Check Another
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Add key CTA */}
          {!apiKey && (
            <div style={{ padding:"22px", border:"1px dashed rgba(34,211,160,0.2)", borderRadius:20,
              textAlign:"center", animation:"fadeUp 0.6s ease 0.2s both" }}>
              {remaining <= 0 ? (
                <>
                  <div style={{ fontSize:28, marginBottom:12 }}>🔑</div>
                  <p style={{ color:"#475569", fontSize:14, marginBottom:6, lineHeight:1.6 }}>
                    Daily limit reached.
                  </p>
                  <p style={{ color:"#334155", fontSize:13, marginBottom:16 }}>
                    Add your free <span style={{ color:"#22d3a0" }}>Gemini API key</span> for unlimited checks
                  </p>
                  <a href="https://aistudio.google.com" target="_blank" rel="noreferrer"
                    style={{ color:"#0891b2", fontSize:12, display:"block", marginBottom:14,
                      fontFamily:"'JetBrains Mono',monospace" }}>
                    → aistudio.google.com (free, 2 min)
                  </a>
                  <button onClick={() => setShowModal(true)}
                    style={{ padding:"11px 28px",
                      background:"linear-gradient(135deg,#22d3a0,#0891b2)",
                      border:"none", borderRadius:12, color:"#0d1117",
                      fontSize:13, fontWeight:700, cursor:"pointer",
                      fontFamily:"'Syne',sans-serif", letterSpacing:"0.05em" }}>
                    ADD API KEY
                  </button>
                </>
              ) : (
                <button onClick={() => setShowModal(true)}
                  style={{ background:"none", border:"none", color:"#334155",
                    fontSize:12, cursor:"pointer", fontFamily:"'JetBrains Mono',monospace" }}>
                  Have a Gemini API key? Add for unlimited checks →
                </button>
              )}
            </div>
          )}

          {/* Footer */}
          <p style={{ textAlign:"center", color:"#2d4a5e", fontSize:11,
            fontFamily:"'JetBrains Mono',monospace", marginTop:32 }}>
            Powered by Groq · Gemini · Next.js 15
          </p>
        </div>
      </div>

      {/* Share Modal */}
      {showShare && result && vc && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.85)", backdropFilter:"blur(8px)",
          display:"flex", alignItems:"center", justifyContent:"center", zIndex:100, padding:20 }}
          onClick={e => e.target===e.currentTarget && setShowShare(false)}>
          <div style={{ background:"#0f1f30", border:"1px solid rgba(255,255,255,0.1)", borderRadius:24, padding:28,
            maxWidth:420, width:"100%", boxShadow:"0 24px 80px rgba(0,0,0,0.6)", animation:"fadeUp 0.3s ease" }}>
            <h2 style={{ color:"#0f172a", fontFamily:"'Syne',sans-serif", fontSize:18, fontWeight:700, marginBottom:20 }}>Share Result</h2>
            <div style={{ padding:18, background:vc.bg, border:`1px solid ${vc.color}40`, borderRadius:16, marginBottom:20 }}>
              <div style={{ color:vc.color, fontSize:15, fontWeight:700, fontFamily:"'Syne',sans-serif", marginBottom:8 }}>
                {vc.icon} {vc.label} · {result.confidence}%
              </div>
              <p style={{ color:"#94a3b8", fontSize:13, lineHeight:1.6, margin:0 }}>{result.summary}</p>
            </div>
            <div style={{ display:"flex", gap:10 }}>
              <button onClick={() => setShowShare(false)}
                style={{ flex:1, padding:12, background:"transparent", border:"1px solid rgba(255,255,255,0.1)",
                  borderRadius:12, color:"#475569", cursor:"pointer", fontSize:13 }}>Cancel</button>
              <button onClick={handleShare}
                style={{ flex:2, padding:12, background:"linear-gradient(135deg,#22d3a0,#0891b2)",
                  border:"none", borderRadius:12, color:"#0d1117", fontSize:13, fontWeight:700, cursor:"pointer" }}>
                {copied ? "✓ Copied!" : "Share / Copy"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* API Key Modal */}
      {showModal && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.85)", backdropFilter:"blur(8px)",
          display:"flex", alignItems:"center", justifyContent:"center", zIndex:100, padding:20 }}
          onClick={e => e.target===e.currentTarget && (setShowModal(false), setTempKey(""))}>
          <div style={{ background:"#0f1f30", border:"1px solid rgba(255,255,255,0.1)", borderRadius:24, padding:28,
            maxWidth:440, width:"100%", boxShadow:"0 24px 80px rgba(0,0,0,0.6)", animation:"fadeUp 0.3s ease" }}>
            <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:20 }}>
              <div style={{ width:40, height:40, borderRadius:12, background:"rgba(34,211,160,0.1)",
                border:"1px solid rgba(34,211,160,0.2)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:18 }}>🔑</div>
              <div>
                <h2 style={{ color:"#0f172a", fontFamily:"'Syne',sans-serif", fontSize:17, fontWeight:700, margin:0 }}>Add API Key</h2>
                <p style={{ color:"#334155", fontSize:12, margin:0, marginTop:2 }}>Unlock unlimited checks</p>
              </div>
            </div>
            <p style={{ color:"#475569", fontSize:13, marginBottom:20, lineHeight:1.7 }}>
              Get a free Gemini key from{" "}
              <a href="https://aistudio.google.com" target="_blank" rel="noreferrer"
                style={{ color:"#22d3a0", textDecoration:"underline" }}>aistudio.google.com</a>
              {" "}— no card needed.
            </p>
            <div style={{ position:"relative", marginBottom:14 }}>
              <input type={showKeyText?"text":"password"} placeholder="AIzaSy..."
                value={tempKey} onChange={e => setTempKey(e.target.value)}
                style={{ width:"100%", padding:"14px 50px 14px 16px",
                  background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.1)",
                  borderRadius:12, color:"#e2e8f0", fontSize:14, outline:"none",
                  boxSizing:"border-box", fontFamily:"'JetBrains Mono',monospace",
                  transition:"border-color 0.2s" }}
                onFocus={e => e.target.style.borderColor="#22d3a0"}
                onBlur={e => e.target.style.borderColor="#1e293b"} />
              <button onClick={() => setShowKeyText(!showKeyText)}
                style={{ position:"absolute", right:14, top:"50%", transform:"translateY(-50%)",
                  background:"none", border:"none", color:"#334155", cursor:"pointer", fontSize:16 }}>
                {showKeyText?"🙈":"👁️"}
              </button>
            </div>
            <div style={{ padding:"10px 14px", background:"rgba(34,211,160,0.07)",
              border:"1px solid rgba(34,211,160,0.2)", borderRadius:10, marginBottom:20 }}>
              <p style={{ color:"#334155", fontSize:12, margin:0 }}>
                🔒 Stored in your browser only — we never see your key
              </p>
            </div>
            <div style={{ display:"flex", gap:10 }}>
              <button onClick={() => { setShowModal(false); setTempKey(""); }}
                style={{ flex:1, padding:13, background:"transparent", border:"1px solid rgba(255,255,255,0.1)",
                  borderRadius:12, color:"#475569", cursor:"pointer", fontSize:13 }}>Cancel</button>
              <button onClick={() => { if(tempKey.trim()){ saveKey(tempKey); setTempKey(""); setShowModal(false); } }}
                disabled={!tempKey.trim()}
                style={{ flex:2, padding:13,
                  background:tempKey.trim()?"linear-gradient(135deg,#22d3a0,#0891b2)":"rgba(255,255,255,0.04)",
                  border:"none", borderRadius:12,
                  color:tempKey.trim()?"#0d1117":"#334155",
                  cursor:tempKey.trim()?"pointer":"not-allowed",
                  fontSize:13, fontWeight:700, fontFamily:"'Syne',sans-serif",
                  transition:"all 0.2s" }}>
                Save & Activate
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function toBase64(file) {
  return new Promise((res,rej) => { const r=new FileReader(); r.onload=()=>res(r.result.split(",")[1]); r.onerror=rej; r.readAsDataURL(file); });
}
