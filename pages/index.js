import { useState, useEffect, useRef } from "react";
import Head from "next/head";
import Link from "next/link";

const FREE_LIMIT = 5;

const VC = {
  TRUE:        { color:"#059669", light:"#d1fae5", border:"#6ee7b7", label:"✅ VERIFIED TRUE",   icon:"✓" },
  FALSE:       { color:"#dc2626", light:"#fee2e2", border:"#fca5a5", label:"❌ FAKE NEWS",        icon:"✗" },
  MISLEADING:  { color:"#d97706", light:"#fef3c7", border:"#fcd34d", label:"⚠️ MISLEADING",       icon:"!" },
  REAL:        { color:"#059669", light:"#d1fae5", border:"#6ee7b7", label:"✅ IMAGE LOOKS REAL", icon:"✓" },
  FAKE:        { color:"#dc2626", light:"#fee2e2", border:"#fca5a5", label:"❌ FAKE IMAGE",        icon:"✗" },
  MANIPULATED: { color:"#d97706", light:"#fef3c7", border:"#fcd34d", label:"⚠️ MANIPULATED",      icon:"!" },
};

const TL = {
  CURRENT: { color:"#059669", label:"🟢 CURRENT NEWS" },
  PAST:    { color:"#7c3aed", label:"🔵 OLD NEWS"     },
  FUTURE:  { color:"#dc2626", label:"🔴 FUTURE CLAIM" },
  UNKNOWN: { color:"#64748b", label:"⚪ UNKNOWN DATE"  },
};

export default function TruthScan() {
  const [tab, setTab]                     = useState("text");
  const [textInput, setTextInput]         = useState("");
  const [urlInput, setUrlInput]           = useState("");
  const [imageFile, setImageFile]         = useState(null);
  const [imagePreview, setImagePreview]   = useState(null);
  const [result, setResult]               = useState(null);
  const [loading, setLoading]             = useState(false);
  const [freeChecks, setFreeChecks]       = useState(0);
  const [apiKey, setApiKey]               = useState("");
  const [showModal, setShowModal]         = useState(false);
  const [showShare, setShowShare]         = useState(false);
  const [tempKey, setTempKey]             = useState("");
  const [showKeyText, setShowKeyText]     = useState(false);
  const [error, setError]                 = useState("");
  const [copied, setCopied]               = useState(false);
  const [installPrompt, setInstallPrompt] = useState(null);
  const [showInstall, setShowInstall]     = useState(false);
  const fileRef = useRef();

  useEffect(() => {
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
      const res  = await fetch("/api/check", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify(body) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Something went wrong.");
      setResult(data.result);
      try {
        const hist = JSON.parse(localStorage.getItem("ts_history") || "[]");
        hist.unshift({ type:tab, input:tab==="image"?imageFile?.name:tab==="url"?urlInput:textInput, result:data.result, date:new Date().toISOString() });
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

  // Shared card style
  const card = { background:"#ffffff", border:"1px solid #e2e8f0", borderRadius:20,
    boxShadow:"0 1px 3px rgba(0,0,0,0.06), 0 4px 20px rgba(0,0,0,0.04)" };

  return (
    <>
      <Head>
        <title>TruthScan — AI Fake News Detector</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#f0fdf9" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-title" content="TruthScan" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link href="https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800&family=DM+Sans:wght@300;400;500;600&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet" />
      </Head>

      {/* Page wrapper */}
      <div style={{ minHeight:"100vh", padding:"28px 16px 60px", position:"relative" }}>

        {/* Decorative blobs */}
        <div style={{ position:"fixed", inset:0, pointerEvents:"none", overflow:"hidden", zIndex:0 }}>
          <div style={{ position:"absolute", top:"-100px", right:"-100px", width:400, height:400, borderRadius:"50%",
            background:"radial-gradient(circle, rgba(34,211,160,0.18) 0%, transparent 70%)" }} />
          <div style={{ position:"absolute", bottom:"-80px", left:"-80px", width:350, height:350, borderRadius:"50%",
            background:"radial-gradient(circle, rgba(56,189,248,0.15) 0%, transparent 70%)" }} />
          <div style={{ position:"absolute", top:"45%", left:"55%", width:300, height:300, borderRadius:"50%",
            background:"radial-gradient(circle, rgba(167,139,250,0.1) 0%, transparent 70%)" }} />
        </div>

        <div style={{ position:"relative", zIndex:1, maxWidth:660, margin:"0 auto" }}>

          {/* Install banner */}
          {showInstall && (
            <div style={{ ...card, padding:"12px 18px", marginBottom:20, borderColor:"#bbf7d0",
              display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:10,
              animation:"fadeIn 0.4s ease" }}>
              <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                <span style={{ fontSize:22 }}>📲</span>
                <div>
                  <div style={{ color:"#065f46", fontSize:13, fontWeight:600 }}>Install TruthScan App</div>
                  <div style={{ color:"#6ee7b7", fontSize:11 }}>Add to home screen for quick access</div>
                </div>
              </div>
              <div style={{ display:"flex", gap:8 }}>
                <button onClick={() => setShowInstall(false)}
                  style={{ padding:"6px 14px", background:"#f8fafc", border:"1px solid #e2e8f0",
                    borderRadius:8, color:"#64748b", cursor:"pointer", fontSize:12 }}>Later</button>
                <button onClick={handleInstall}
                  style={{ padding:"6px 18px", background:"linear-gradient(135deg,#10b981,#0891b2)",
                    border:"none", borderRadius:8, color:"#fff", cursor:"pointer", fontSize:12, fontWeight:700 }}>
                  Install
                </button>
              </div>
            </div>
          )}

          {/* Header */}
          <div style={{ textAlign:"center", marginBottom:36, animation:"fadeUp 0.5s ease" }}>
            <div style={{ display:"inline-flex", alignItems:"center", justifyContent:"center",
              width:68, height:68, borderRadius:20, marginBottom:16,
              background:"linear-gradient(135deg,#ecfdf5,#f0fdf4)",
              border:"1.5px solid #a7f3d0",
              boxShadow:"0 4px 20px rgba(16,185,129,0.15), 0 1px 3px rgba(0,0,0,0.04)" }}>
              <svg width="34" height="34" viewBox="0 0 24 24" fill="none">
                <path d="M12 2L3 7v5c0 5.25 3.75 10.15 9 11.25C17.25 22.15 21 17.25 21 12V7L12 2z"
                  fill="#d1fae5" stroke="#10b981" strokeWidth="1.5"/>
                <path d="M9 12l2 2 4-4" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <h1 style={{ fontFamily:"'Syne',sans-serif", fontSize:38, fontWeight:800,
              color:"#0f172a", margin:"0 0 6px", letterSpacing:"-0.02em" }}>TruthScan</h1>
            <p style={{ color:"#64748b", fontSize:12, letterSpacing:"0.15em",
              fontFamily:"'JetBrains Mono',monospace" }}>AI-POWERED FACT CHECKER</p>

            {/* Nav */}
            <div style={{ display:"flex", justifyContent:"center", gap:8, marginTop:18 }}>
              <span style={{ padding:"6px 18px", borderRadius:20,
                background:"linear-gradient(135deg,#ecfdf5,#f0fdf4)",
                border:"1px solid #a7f3d0", color:"#059669", fontSize:13, fontWeight:600 }}>
                Check News
              </span>
              <Link href="/history" style={{ padding:"6px 18px", borderRadius:20,
                background:"#f8fafc", border:"1px solid #e2e8f0",
                color:"#64748b", fontSize:13, fontWeight:500 }}>
                📋 History
              </Link>
            </div>

            {/* Status */}
            <div style={{ marginTop:14 }}>
              {apiKey ? (
                <div style={{ display:"inline-flex", alignItems:"center", gap:8, padding:"6px 16px",
                  borderRadius:20, background:"#ecfdf5", border:"1px solid #a7f3d0" }}>
                  <span style={{ width:7, height:7, borderRadius:"50%", background:"#10b981",
                    boxShadow:"0 0 0 3px rgba(16,185,129,0.2)", display:"block" }} />
                  <span style={{ color:"#065f46", fontSize:12, fontWeight:500 }}>Unlimited · API Key Active</span>
                  <button onClick={removeKey} style={{ background:"none", border:"none",
                    color:"#6ee7b7", cursor:"pointer", fontSize:15, lineHeight:1 }}>×</button>
                </div>
              ) : (
                <div style={{ display:"inline-flex", alignItems:"center", gap:8, padding:"6px 16px",
                  borderRadius:20, background:"#f8fafc", border:"1px solid #e2e8f0" }}>
                  <span style={{ width:7, height:7, borderRadius:"50%", display:"block",
                    background: remaining > 0 ? "#10b981" : "#ef4444" }} />
                  <span style={{ color:"#64748b", fontSize:12 }}>
                    {remaining > 0 ? `${remaining} of ${FREE_LIMIT} free checks left today` : "Daily limit reached"}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Main card */}
          <div style={{ ...card, padding:24, marginBottom:12, animation:"fadeUp 0.5s ease 0.1s both" }}>

            {/* Tabs */}
            <div style={{ display:"flex", gap:4, marginBottom:20, padding:4,
              background:"#f1f5f9", borderRadius:14, border:"1px solid #e2e8f0" }}>
              {[
                { id:"text",  label:"📝 Text"  },
                { id:"url",   label:"🔗 URL"   },
                { id:"image", label:"🖼️ Image" },
              ].map(t => (
                <button key={t.id} onClick={() => { setTab(t.id); setResult(null); setError(""); }}
                  style={{ flex:1, padding:"10px 8px", border:"1px solid transparent",
                    borderRadius:10, cursor:"pointer", transition:"all 0.15s",
                    fontSize:13, fontWeight:tab===t.id?600:400,
                    background: tab===t.id ? "#ffffff" : "transparent",
                    color: tab===t.id ? "#0f172a" : "#64748b",
                    borderColor: tab===t.id ? "#e2e8f0" : "transparent",
                    boxShadow: tab===t.id ? "0 1px 3px rgba(0,0,0,0.08)" : "none" }}>
                  {t.label}
                </button>
              ))}
            </div>

            {/* TEXT */}
            {tab === "text" && (
              <div>
                <label style={{ color:"#94a3b8", fontSize:10, letterSpacing:"0.12em",
                  fontFamily:"'JetBrains Mono',monospace", display:"block", marginBottom:10 }}>
                  PASTE NEWS · HEADLINE · WHATSAPP MESSAGE
                </label>
                <textarea value={textInput} onChange={e => setTextInput(e.target.value)}
                  onKeyDown={e => e.key==="Enter" && e.ctrlKey && analyze()}
                  placeholder="Paste news in any language — English, हिंदी, ਪੰਜਾਬੀ, Urdu, Tamil..."
                  rows={6}
                  style={{ width:"100%", background:"transparent", border:"none",
                    outline:"none", color:"#0f172a", fontSize:15, lineHeight:1.8,
                    resize:"none", boxSizing:"border-box" }} />
                {textInput && (
                  <div style={{ textAlign:"right", marginTop:6 }}>
                    <span style={{ color:"#cbd5e1", fontSize:11, fontFamily:"'JetBrains Mono',monospace" }}>
                      {textInput.length} chars
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* URL */}
            {tab === "url" && (
              <div>
                <label style={{ color:"#94a3b8", fontSize:10, letterSpacing:"0.12em",
                  fontFamily:"'JetBrains Mono',monospace", display:"block", marginBottom:10 }}>
                  PASTE ARTICLE URL
                </label>
                <div style={{ display:"flex", alignItems:"center", gap:10,
                  background:"#f8fafc", border:"1px solid #e2e8f0",
                  borderRadius:12, padding:"4px 4px 4px 14px" }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2">
                    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
                    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
                  </svg>
                  <input type="url" value={urlInput} onChange={e => setUrlInput(e.target.value)}
                    onKeyDown={e => e.key==="Enter" && analyze()}
                    placeholder="https://example.com/news-article"
                    style={{ flex:1, background:"transparent", border:"none", outline:"none",
                      color:"#0f172a", fontSize:15, padding:"10px 0" }} />
                  {urlInput && (
                    <button onClick={() => setUrlInput("")}
                      style={{ padding:"7px 12px", background:"#e2e8f0", border:"none",
                        borderRadius:9, color:"#64748b", cursor:"pointer", fontSize:12 }}>✕</button>
                  )}
                </div>
                <p style={{ color:"#94a3b8", fontSize:12, marginTop:8,
                  fontFamily:"'JetBrains Mono',monospace" }}>AI fetches and analyzes the full article</p>
              </div>
            )}

            {/* IMAGE */}
            {tab === "image" && (
              <div>
                <label style={{ color:"#94a3b8", fontSize:10, letterSpacing:"0.12em",
                  fontFamily:"'JetBrains Mono',monospace", display:"block", marginBottom:10 }}>
                  UPLOAD IMAGE TO VERIFY
                </label>
                {imagePreview ? (
                  <div style={{ position:"relative", borderRadius:14, overflow:"hidden",
                    border:"1px solid #e2e8f0" }}>
                    <img src={imagePreview} alt="preview"
                      style={{ width:"100%", maxHeight:260, objectFit:"contain", background:"#f8fafc", display:"block" }} />
                    <button onClick={() => { setImageFile(null); setImagePreview(null); setResult(null); }}
                      style={{ position:"absolute", top:10, right:10, background:"rgba(255,255,255,0.9)",
                        border:"1px solid #e2e8f0", borderRadius:8, width:32, height:32, color:"#64748b",
                        cursor:"pointer", fontSize:16, boxShadow:"0 1px 3px rgba(0,0,0,0.1)" }}>×</button>
                  </div>
                ) : (
                  <div onClick={() => fileRef.current.click()}
                    style={{ border:"2px dashed #cbd5e1", borderRadius:14, padding:"48px 20px",
                      textAlign:"center", cursor:"pointer", background:"#f8fafc", transition:"all 0.2s" }}
                    onMouseOver={e => { e.currentTarget.style.borderColor="#10b981"; e.currentTarget.style.background="#f0fdf4"; }}
                    onMouseOut={e => { e.currentTarget.style.borderColor="#cbd5e1"; e.currentTarget.style.background="#f8fafc"; }}>
                    <div style={{ fontSize:36, marginBottom:10 }}>📸</div>
                    <p style={{ color:"#64748b", fontSize:14, fontWeight:500, marginBottom:4 }}>Click to upload image</p>
                    <p style={{ color:"#94a3b8", fontSize:12, fontFamily:"'JetBrains Mono',monospace" }}>
                      JPG · PNG · WEBP
                    </p>
                  </div>
                )}
                <input ref={fileRef} type="file" accept="image/*" onChange={onImagePick} style={{ display:"none" }} />
              </div>
            )}

            {/* Scan bar */}
            {loading && (
              <div style={{ position:"relative", height:3, background:"#e2e8f0",
                borderRadius:2, marginTop:16, overflow:"hidden" }}>
                <div style={{ position:"absolute", top:0, height:"100%", width:"40%",
                  background:"linear-gradient(90deg,transparent,#10b981,transparent)",
                  animation:"scanLine 1.4s ease-in-out infinite" }} />
              </div>
            )}
          </div>

          {/* Analyze button */}
          <button onClick={analyze} disabled={loading}
            style={{ width:"100%", padding:"16px", border:"none", borderRadius:16,
              background: loading ? "#f1f5f9" : "linear-gradient(135deg,#10b981 0%,#0891b2 100%)",
              color: loading ? "#94a3b8" : "#ffffff",
              fontSize:14, fontWeight:700, fontFamily:"'Syne',sans-serif",
              letterSpacing:"0.06em", cursor: loading ? "not-allowed" : "pointer",
              textTransform:"uppercase", transition:"all 0.2s", marginBottom:16,
              boxShadow: loading ? "none" : "0 4px 20px rgba(16,185,129,0.3)",
              display:"flex", alignItems:"center", justifyContent:"center", gap:10 }}
            onMouseOver={e => { if (!loading) e.currentTarget.style.boxShadow="0 6px 28px rgba(16,185,129,0.4)"; }}
            onMouseOut={e => { if (!loading) e.currentTarget.style.boxShadow="0 4px 20px rgba(16,185,129,0.3)"; }}>
            {loading ? (
              <>
                <span style={{ width:16, height:16, border:"2px solid #cbd5e1",
                  borderTopColor:"#10b981", borderRadius:"50%", display:"block",
                  animation:"spin 0.8s linear infinite" }} />
                ANALYZING...
              </>
            ) : (
              <>
                {tab==="image" ? "ANALYZE IMAGE" : tab==="url" ? "FETCH & ANALYZE" : "ANALYZE NOW"}
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M5 12h14M12 5l7 7-7 7"/>
                </svg>
              </>
            )}
          </button>

          {/* Error */}
          {error && (
            <div style={{ marginBottom:16, borderRadius:16, overflow:"hidden", animation:"fadeUp 0.3s ease" }}>
              {error.includes("BLOCKED") ? (
                <div style={{ padding:"20px 22px", background:"#fffbeb",
                  border:"1px solid #fcd34d", borderRadius:16 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:12 }}>
                    <span style={{ fontSize:22 }}>🚫</span>
                    <div>
                      <div style={{ color:"#92400e", fontSize:14, fontWeight:700 }}>Website Blocked TruthScan</div>
                      <div style={{ color:"#b45309", fontSize:12 }}>This site doesn't allow external scanning</div>
                    </div>
                  </div>
                  <div style={{ display:"flex", flexDirection:"column", gap:8, marginBottom:14 }}>
                    {["Open the article in your browser","Select all text (Ctrl+A) then copy (Ctrl+C)","Paste it in the Text tab and scan"].map((s,i) => (
                      <div key={i} style={{ display:"flex", gap:10, alignItems:"flex-start" }}>
                        <span style={{ width:22, height:22, borderRadius:6, background:"#fef3c7",
                          border:"1px solid #fcd34d", color:"#d97706", fontSize:11, fontWeight:700,
                          display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>{i+1}</span>
                        <span style={{ color:"#78350f", fontSize:13, paddingTop:3 }}>{s}</span>
                      </div>
                    ))}
                  </div>
                  <button onClick={() => { setTab("text"); setError(""); setUrlInput(""); }}
                    style={{ padding:"9px 20px", background:"#fef3c7", border:"1px solid #fcd34d",
                      borderRadius:10, color:"#92400e", fontSize:12, fontWeight:600, cursor:"pointer" }}>
                    Switch to Text Tab →
                  </button>
                </div>
              ) : (
                <div style={{ padding:"14px 18px", background:"#fef2f2",
                  border:"1px solid #fecaca", borderRadius:16,
                  color:"#dc2626", fontSize:13, display:"flex", gap:10 }}>
                  <span>⚠️</span><span>{error}</span>
                </div>
              )}
            </div>
          )}

          {/* Result */}
          {result && vc && (
            <div style={{ animation:"fadeUp 0.5s ease" }}>
              <div style={{ ...card, padding:24, marginBottom:12,
                background:vc.light, borderColor:vc.border,
                boxShadow:`0 4px 24px rgba(0,0,0,0.06)` }}>

                {/* Verdict header */}
                <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between",
                  marginBottom:16, gap:12, flexWrap:"wrap" }}>
                  <div style={{ display:"flex", alignItems:"center", gap:12 }}>
                    <div style={{ width:46, height:46, borderRadius:14, background:"#ffffff",
                      border:`1.5px solid ${vc.border}`, display:"flex", alignItems:"center",
                      justifyContent:"center", fontSize:20, fontWeight:800, color:vc.color,
                      boxShadow:`0 2px 8px ${vc.color}20` }}>
                      {vc.icon}
                    </div>
                    <div>
                      <div style={{ color:vc.color, fontSize:17, fontWeight:800,
                        fontFamily:"'Syne',sans-serif" }}>{vc.label}</div>
                      {result.language_detected && result.language_detected.toLowerCase() !== "english" && (
                        <span style={{ display:"inline-flex", alignItems:"center", gap:4, marginTop:4,
                          padding:"2px 10px", borderRadius:10, background:"#ede9fe",
                          border:"1px solid #c4b5fd", color:"#7c3aed", fontSize:10,
                          fontFamily:"'JetBrains Mono',monospace" }}>
                          🌍 {result.language_detected.toUpperCase()}
                        </span>
                      )}
                    </div>
                  </div>
                  <div style={{ textAlign:"center" }}>
                    <div style={{ fontSize:28, fontWeight:800, fontFamily:"'Syne',sans-serif",
                      color:vc.color }}>{result.confidence}%</div>
                    <div style={{ color:"#94a3b8", fontSize:10, fontFamily:"'JetBrains Mono',monospace" }}>CONFIDENCE</div>
                    <div style={{ width:64, height:4, background:"rgba(255,255,255,0.7)",
                      borderRadius:2, marginTop:5, overflow:"hidden" }}>
                      <div style={{ height:"100%", width:`${result.confidence}%`,
                        background:vc.color, borderRadius:2 }} />
                    </div>
                  </div>
                </div>

                {/* Summary */}
                <div style={{ padding:"12px 16px", background:"rgba(255,255,255,0.7)",
                  borderRadius:12, marginBottom:14, borderLeft:`3px solid ${vc.color}` }}>
                  <p style={{ color:"#1e293b", fontSize:15, lineHeight:1.75, margin:0 }}>
                    {result.summary}
                  </p>
                </div>

                {/* Credibility */}
                {result.source_credibility !== undefined && (
                  <div style={{ padding:"12px 16px", background:"rgba(255,255,255,0.7)",
                    borderRadius:12, marginBottom:12, border:"1px solid rgba(255,255,255,0.9)" }}>
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
                      <span style={{ color:"#64748b", fontSize:10, letterSpacing:"0.1em",
                        fontFamily:"'JetBrains Mono',monospace" }}>SOURCE CREDIBILITY</span>
                      <div style={{ display:"flex", gap:2, alignItems:"center" }}>
                        {[1,2,3,4,5].map(i => (
                          <span key={i} style={{ fontSize:13,
                            color:i<=Math.round(result.source_credibility/20)?"#f59e0b":"#e2e8f0" }}>★</span>
                        ))}
                        <span style={{ color:result.source_credibility>=80?"#059669":result.source_credibility>=50?"#d97706":"#dc2626",
                          fontSize:12, fontWeight:700, marginLeft:6,
                          fontFamily:"'JetBrains Mono',monospace" }}>
                          {result.source_credibility}/100
                        </span>
                      </div>
                    </div>
                    <div style={{ height:5, background:"#e2e8f0", borderRadius:3, overflow:"hidden", marginBottom:6 }}>
                      <div style={{ height:"100%", borderRadius:3, width:`${result.source_credibility}%`,
                        background:result.source_credibility>=80?"linear-gradient(90deg,#059669,#10b981)":
                                   result.source_credibility>=50?"linear-gradient(90deg,#d97706,#f59e0b)":
                                   "linear-gradient(90deg,#dc2626,#ef4444)" }} />
                    </div>
                    {result.source_note && <p style={{ color:"#64748b", fontSize:12, margin:0 }}>{result.source_note}</p>}
                  </div>
                )}

                {/* Timeline */}
                {tl && (
                  <div style={{ display:"inline-flex", alignItems:"center", gap:8,
                    padding:"6px 14px", borderRadius:20, marginBottom:14,
                    background:"rgba(255,255,255,0.8)", border:"1px solid rgba(255,255,255,0.9)" }}>
                    <span style={{ color:tl.color, fontSize:14 }}>●</span>
                    <span style={{ color:tl.color, fontSize:12, fontWeight:600 }}>{tl.label}</span>
                    {result.timeline_note && <span style={{ color:"#94a3b8", fontSize:12 }}>· {result.timeline_note}</span>}
                  </div>
                )}

                {/* Analysis */}
                <div style={{ color:"#94a3b8", fontSize:10, letterSpacing:"0.15em",
                  fontFamily:"'JetBrains Mono',monospace", marginBottom:10 }}>ANALYSIS</div>
                <div style={{ display:"flex", flexDirection:"column", gap:8, marginBottom:14 }}>
                  {result.reasons?.map((r,i) => (
                    <div key={i} style={{ display:"flex", gap:10, padding:"10px 14px",
                      background:"rgba(255,255,255,0.8)", borderRadius:10,
                      border:"1px solid rgba(255,255,255,0.9)" }}>
                      <span style={{ color:vc.color, fontSize:11, fontFamily:"'JetBrains Mono',monospace",
                        flexShrink:0, fontWeight:700, marginTop:3 }}>
                        {String(i+1).padStart(2,"0")}
                      </span>
                      <span style={{ color:"#334155", fontSize:14, lineHeight:1.6 }}>{r}</span>
                    </div>
                  ))}
                </div>

                {/* Warning */}
                {result.warning && (
                  <div style={{ padding:"12px 16px", background:"#fffbeb", border:"1px solid #fcd34d",
                    borderRadius:10, color:"#92400e", fontSize:13, marginBottom:14 }}>
                    ⚠️ {result.warning}
                  </div>
                )}

                {/* Buttons */}
                <div style={{ display:"flex", gap:10, flexWrap:"wrap" }}>
                  <button onClick={() => setShowShare(true)}
                    style={{ flex:1, minWidth:120, padding:"10px 18px",
                      background:"#ffffff", border:"1px solid #e2e8f0", borderRadius:12,
                      color:"#475569", fontSize:13, fontWeight:500, cursor:"pointer",
                      display:"flex", alignItems:"center", justifyContent:"center", gap:6,
                      boxShadow:"0 1px 3px rgba(0,0,0,0.04)", transition:"all 0.15s" }}
                    onMouseOver={e => e.currentTarget.style.borderColor="#10b981"}
                    onMouseOut={e => e.currentTarget.style.borderColor="#e2e8f0"}>
                    📤 Share
                  </button>
                  <button onClick={() => { setResult(null); setTextInput(""); setUrlInput(""); setImageFile(null); setImagePreview(null); }}
                    style={{ flex:1, minWidth:120, padding:"10px 18px",
                      background:"#ffffff", border:"1px solid #e2e8f0", borderRadius:12,
                      color:"#475569", fontSize:13, fontWeight:500, cursor:"pointer",
                      display:"flex", alignItems:"center", justifyContent:"center", gap:6,
                      boxShadow:"0 1px 3px rgba(0,0,0,0.04)", transition:"all 0.15s" }}
                    onMouseOver={e => e.currentTarget.style.borderColor="#10b981"}
                    onMouseOut={e => e.currentTarget.style.borderColor="#e2e8f0"}>
                    🔄 Check Another
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Add key CTA */}
          {!apiKey && (
            <div style={{ ...card, padding:"22px", textAlign:"center",
              border:"1.5px dashed #cbd5e1" }}>
              {remaining <= 0 ? (
                <>
                  <div style={{ fontSize:28, marginBottom:10 }}>🔑</div>
                  <p style={{ color:"#475569", fontSize:14, marginBottom:6, lineHeight:1.6 }}>
                    Free limit reached for today.
                  </p>
                  <p style={{ color:"#94a3b8", fontSize:13, marginBottom:14 }}>
                    Add a free <span style={{ color:"#059669", fontWeight:600 }}>Gemini API key</span> for unlimited checks
                  </p>
                  <a href="https://aistudio.google.com" target="_blank" rel="noreferrer"
                    style={{ color:"#0891b2", fontSize:12, display:"block", marginBottom:14,
                      fontFamily:"'JetBrains Mono',monospace" }}>
                    → aistudio.google.com (free, 2 min)
                  </a>
                  <button onClick={() => setShowModal(true)}
                    style={{ padding:"11px 28px",
                      background:"linear-gradient(135deg,#10b981,#0891b2)",
                      border:"none", borderRadius:12, color:"#fff",
                      fontSize:13, fontWeight:700, cursor:"pointer",
                      boxShadow:"0 4px 14px rgba(16,185,129,0.3)" }}>
                    ADD API KEY
                  </button>
                </>
              ) : (
                <button onClick={() => setShowModal(true)}
                  style={{ background:"none", border:"none", color:"#94a3b8",
                    fontSize:12, cursor:"pointer", fontFamily:"'JetBrains Mono',monospace" }}>
                  Have a Gemini API key? Add for unlimited checks →
                </button>
              )}
            </div>
          )}

          <p style={{ textAlign:"center", color:"#cbd5e1", fontSize:11,
            fontFamily:"'JetBrains Mono',monospace", marginTop:28 }}>
            Powered by Groq · Gemini · Next.js 15
          </p>
        </div>
      </div>

      {/* Share Modal */}
      {showShare && result && vc && (
        <div style={{ position:"fixed", inset:0, background:"rgba(15,23,42,0.5)",
          backdropFilter:"blur(6px)", display:"flex", alignItems:"center",
          justifyContent:"center", zIndex:100, padding:20 }}
          onClick={e => e.target===e.currentTarget && setShowShare(false)}>
          <div style={{ background:"#ffffff", border:"1px solid #e2e8f0", borderRadius:24,
            padding:28, maxWidth:420, width:"100%",
            boxShadow:"0 20px 60px rgba(0,0,0,0.15)", animation:"fadeUp 0.3s ease" }}>
            <h2 style={{ color:"#0f172a", fontFamily:"'Syne',sans-serif", fontSize:18,
              fontWeight:700, marginBottom:20 }}>Share Result</h2>
            <div style={{ padding:18, background:vc.light, border:`1px solid ${vc.border}`,
              borderRadius:16, marginBottom:20 }}>
              <div style={{ color:vc.color, fontSize:15, fontWeight:700, marginBottom:8 }}>
                {vc.label} · {result.confidence}%
              </div>
              <p style={{ color:"#475569", fontSize:13, lineHeight:1.6, margin:0 }}>{result.summary}</p>
            </div>
            <div style={{ display:"flex", gap:10 }}>
              <button onClick={() => setShowShare(false)}
                style={{ flex:1, padding:12, background:"#f8fafc", border:"1px solid #e2e8f0",
                  borderRadius:12, color:"#64748b", cursor:"pointer", fontSize:13 }}>Cancel</button>
              <button onClick={handleShare}
                style={{ flex:2, padding:12, background:"linear-gradient(135deg,#10b981,#0891b2)",
                  border:"none", borderRadius:12, color:"#fff", fontSize:13, fontWeight:700,
                  cursor:"pointer", boxShadow:"0 4px 14px rgba(16,185,129,0.3)" }}>
                {copied ? "✓ Copied!" : "📤 Share / Copy"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* API Key Modal */}
      {showModal && (
        <div style={{ position:"fixed", inset:0, background:"rgba(15,23,42,0.5)",
          backdropFilter:"blur(6px)", display:"flex", alignItems:"center",
          justifyContent:"center", zIndex:100, padding:20 }}
          onClick={e => e.target===e.currentTarget && (setShowModal(false), setTempKey(""))}>
          <div style={{ background:"#ffffff", border:"1px solid #e2e8f0", borderRadius:24,
            padding:28, maxWidth:440, width:"100%",
            boxShadow:"0 20px 60px rgba(0,0,0,0.15)", animation:"fadeUp 0.3s ease" }}>
            <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:18 }}>
              <div style={{ width:42, height:42, borderRadius:12, background:"#ecfdf5",
                border:"1px solid #a7f3d0", display:"flex", alignItems:"center",
                justifyContent:"center", fontSize:20 }}>🔑</div>
              <div>
                <h2 style={{ color:"#0f172a", fontFamily:"'Syne',sans-serif", fontSize:17,
                  fontWeight:700, margin:0 }}>Add API Key</h2>
                <p style={{ color:"#64748b", fontSize:12, margin:0, marginTop:2 }}>Unlock unlimited checks</p>
              </div>
            </div>
            <p style={{ color:"#475569", fontSize:13, marginBottom:18, lineHeight:1.7 }}>
              Get a free key from{" "}
              <a href="https://aistudio.google.com" target="_blank" rel="noreferrer"
                style={{ color:"#059669", fontWeight:600 }}>aistudio.google.com</a>
              {" "}— no card required.
            </p>
            <div style={{ position:"relative", marginBottom:12 }}>
              <input type={showKeyText?"text":"password"} placeholder="Paste your Gemini key (AIza...)"
                value={tempKey} onChange={e => setTempKey(e.target.value)}
                style={{ width:"100%", padding:"13px 48px 13px 16px",
                  background:"#f8fafc", border:"1px solid #e2e8f0",
                  borderRadius:12, color:"#0f172a", fontSize:14, outline:"none",
                  boxSizing:"border-box", fontFamily:"'JetBrains Mono',monospace",
                  transition:"border-color 0.2s" }}
                onFocus={e => e.target.style.borderColor="#10b981"}
                onBlur={e => e.target.style.borderColor="#e2e8f0"} />
              <button onClick={() => setShowKeyText(!showKeyText)}
                style={{ position:"absolute", right:14, top:"50%", transform:"translateY(-50%)",
                  background:"none", border:"none", color:"#94a3b8", cursor:"pointer", fontSize:16 }}>
                {showKeyText?"🙈":"👁️"}
              </button>
            </div>
            <div style={{ padding:"10px 14px", background:"#f0fdf4",
              border:"1px solid #bbf7d0", borderRadius:10, marginBottom:18 }}>
              <p style={{ color:"#065f46", fontSize:12, margin:0 }}>
                🔒 Stored in your browser only — we never see your key
              </p>
            </div>
            <div style={{ display:"flex", gap:10 }}>
              <button onClick={() => { setShowModal(false); setTempKey(""); }}
                style={{ flex:1, padding:13, background:"#f8fafc", border:"1px solid #e2e8f0",
                  borderRadius:12, color:"#64748b", cursor:"pointer", fontSize:13 }}>Cancel</button>
              <button onClick={() => { if(tempKey.trim()){ saveKey(tempKey); setTempKey(""); setShowModal(false); } }}
                disabled={!tempKey.trim()}
                style={{ flex:2, padding:13,
                  background:tempKey.trim()?"linear-gradient(135deg,#10b981,#0891b2)":"#f1f5f9",
                  border:"none", borderRadius:12,
                  color:tempKey.trim()?"#ffffff":"#94a3b8",
                  cursor:tempKey.trim()?"pointer":"not-allowed",
                  fontSize:13, fontWeight:700, transition:"all 0.2s",
                  boxShadow:tempKey.trim()?"0 4px 14px rgba(16,185,129,0.3)":"none" }}>
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
