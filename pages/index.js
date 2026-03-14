import { useState, useEffect, useRef } from "react";
import Head from "next/head";
import Link from "next/link";

const FREE_LIMIT = 5;

const VC = {
  TRUE:        { color: "#00e676", bg: "rgba(0,230,118,0.07)",  label: "✅ VERIFIED TRUE"   },
  FALSE:       { color: "#ff1744", bg: "rgba(255,23,68,0.07)",  label: "❌ FAKE NEWS"        },
  MISLEADING:  { color: "#ff9100", bg: "rgba(255,145,0,0.07)", label: "⚠️ MISLEADING"       },
  REAL:        { color: "#00e676", bg: "rgba(0,230,118,0.07)",  label: "✅ IMAGE LOOKS REAL" },
  FAKE:        { color: "#ff1744", bg: "rgba(255,23,68,0.07)",  label: "❌ FAKE IMAGE"       },
  MANIPULATED: { color: "#ff9100", bg: "rgba(255,145,0,0.07)", label: "🖼️ MANIPULATED"      },
};

const TL = {
  CURRENT: { color: "#00e676", icon: "🟢", label: "CURRENT NEWS" },
  PAST:    { color: "#8888ff", icon: "🔵", label: "OLD NEWS"     },
  FUTURE:  { color: "#ff1744", icon: "🔴", label: "FUTURE CLAIM" },
  UNKNOWN: { color: "#555",    icon: "⚪", label: "UNKNOWN DATE" },
};

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
  const fileRef = useRef();

  useEffect(() => {
    const today = new Date().toDateString();
    const saved = localStorage.getItem("ts_date");
    const cnt   = parseInt(localStorage.getItem("ts_checks") || "0");
    const key   = localStorage.getItem("ts_key") || "";
    if (saved === today) setFreeChecks(cnt);
    else { localStorage.setItem("ts_date", today); localStorage.setItem("ts_checks", "0"); }
    setApiKey(key);
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
      } else if (tab === "image") {
        if (!imageFile) { setError("Please select an image."); setLoading(false); return; }
        const b64 = await toBase64(imageFile);
        body = { ...body, type: "image", image: b64, imageMime: imageFile.type };
      }

      const res  = await fetch("/api/check", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Something went wrong.");
      setResult(data.result);

      // Save history
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

  const shareText = result && vc ? `🛡️ TruthScan\n\n${vc.label}\nConfidence: ${result.confidence}%\n\n${result.summary}\n\nReasons:\n${result.reasons?.map(r => `• ${r}`).join("\n")}` : "";

  const handleShare = () => {
    if (navigator.share) navigator.share({ text: shareText });
    else { navigator.clipboard.writeText(shareText); setCopied(true); setTimeout(() => setCopied(false), 2000); }
    setShowShare(false);
  };

  return (
    <>
      <Head>
        <title>TruthScan — AI Fake News Detector</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link href="https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
        <style>{`
          @keyframes fadeUp { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
          @keyframes scan { 0%{margin-left:-35%} 100%{margin-left:135%} }
        `}</style>
      </Head>

      <div style={{ minHeight:"100vh", background:"#080810", fontFamily:"'Inter',sans-serif", padding:"28px 16px",
        backgroundImage:"radial-gradient(ellipse at 10% 40%,rgba(0,212,255,0.05) 0%,transparent 55%),radial-gradient(ellipse at 90% 10%,rgba(255,23,68,0.05) 0%,transparent 55%)" }}>
        <div style={{ maxWidth:660, margin:"0 auto" }}>

          {/* Header */}
          <div style={{ textAlign:"center", marginBottom:32 }}>
            <div style={{ fontSize:42, marginBottom:8 }}>🛡️</div>
            <h1 style={{ fontFamily:"'Space Mono',monospace", fontSize:30, fontWeight:700, letterSpacing:5,
              background:"linear-gradient(135deg,#fff 0%,#00d4ff 100%)", WebkitBackgroundClip:"text",
              WebkitTextFillColor:"transparent", margin:"0 0 5px", textTransform:"uppercase" }}>TruthScan</h1>
            <p style={{ color:"#444", fontSize:10, letterSpacing:3, fontFamily:"'Space Mono',monospace" }}>AI-POWERED FAKE NEWS DETECTOR</p>

            {/* Nav */}
            <div style={{ display:"flex", justifyContent:"center", gap:20, marginTop:14 }}>
              <span style={{ color:"#00d4ff", fontSize:12, borderBottom:"1px solid #00d4ff", paddingBottom:2, cursor:"pointer" }}>Check News</span>
              <Link href="/history" style={{ color:"#444", fontSize:12, textDecoration:"none" }}>📋 History</Link>
            </div>

            {/* Status */}
            <div style={{ marginTop:14 }}>
              {apiKey ? (
                <div style={{ display:"inline-flex", alignItems:"center", gap:8, padding:"5px 14px", borderRadius:20,
                  border:"1px solid rgba(0,230,118,0.25)", background:"rgba(0,230,118,0.05)" }}>
                  <Dot color="#00e676" glow />
                  <span style={{ color:"#00e676", fontSize:11 }}>Unlimited — Your API Key Active</span>
                  <button onClick={removeKey} style={{ background:"none", border:"none", color:"#555", cursor:"pointer", fontSize:10 }}>✕</button>
                </div>
              ) : (
                <div style={{ display:"inline-flex", alignItems:"center", gap:8, padding:"5px 14px", borderRadius:20,
                  border:"1px solid #1e1e30", background:"rgba(255,255,255,0.02)" }}>
                  <Dot color={remaining > 0 ? "#00d4ff" : "#ff1744"} />
                  <span style={{ color:"#555", fontSize:11 }}>
                    {remaining > 0 ? `${remaining}/${FREE_LIMIT} free checks left today` : "Daily limit reached — Add API key"}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Tabs */}
          <div style={{ display:"flex", gap:4, marginBottom:14, background:"rgba(255,255,255,0.02)",
            border:"1px solid #1a1a28", borderRadius:12, padding:4 }}>
            {[{id:"text",icon:"📝",label:"Text"},{id:"url",icon:"🔗",label:"URL"},{id:"image",icon:"🖼️",label:"Image"}].map(t => (
              <button key={t.id} onClick={() => { setTab(t.id); setResult(null); setError(""); }}
                style={{ flex:1, padding:"10px 8px", cursor:"pointer", transition:"all 0.2s",
                  background:tab===t.id?"rgba(0,170,255,0.15)":"transparent",
                  border:tab===t.id?"1px solid rgba(0,170,255,0.3)":"1px solid transparent",
                  borderRadius:9, color:tab===t.id?"#00aaff":"#444",
                  fontSize:13, fontWeight:tab===t.id?600:400,
                  display:"flex", alignItems:"center", justifyContent:"center", gap:6 }}>
                {t.icon} {t.label}
              </button>
            ))}
          </div>

          {/* Input */}
          <div style={{ background:"rgba(255,255,255,0.02)", border:"1px solid #1a1a28", borderRadius:14, padding:"20px 22px", marginBottom:12 }}>
            {tab === "text" && (
              <>
                <label style={{ color:"#444", fontSize:10, letterSpacing:3, fontFamily:"'Space Mono',monospace", display:"block", marginBottom:12 }}>
                  PASTE NEWS / HEADLINE / WHATSAPP MESSAGE
                </label>
                <textarea value={textInput} onChange={e => setTextInput(e.target.value)}
                  onKeyDown={e => e.key==="Enter" && e.ctrlKey && analyze()}
                  placeholder="Paste news in any language — English, Hindi (हिंदी), Punjabi (ਪੰਜਾਬੀ), Urdu, or any other..."
                  rows={5} style={{ width:"100%", background:"transparent", border:"none", color:"#ddd",
                    fontSize:15, lineHeight:1.75, resize:"vertical", outline:"none",
                    fontFamily:"'Inter',sans-serif", boxSizing:"border-box" }} />
              </>
            )}
            {tab === "url" && (
              <>
                <label style={{ color:"#444", fontSize:10, letterSpacing:3, fontFamily:"'Space Mono',monospace", display:"block", marginBottom:12 }}>
                  PASTE NEWS ARTICLE URL / LINK
                </label>
                <input type="url" value={urlInput} onChange={e => setUrlInput(e.target.value)}
                  onKeyDown={e => e.key==="Enter" && analyze()}
                  placeholder="https://example.com/news-article"
                  style={{ width:"100%", background:"transparent", border:"none", color:"#ddd",
                    fontSize:15, outline:"none", fontFamily:"'Inter',sans-serif", boxSizing:"border-box", padding:"8px 0" }} />
                <p style={{ color:"#2a2a3a", fontSize:11, marginTop:10 }}>AI will fetch and analyze the full article</p>
              </>
            )}
            {tab === "image" && (
              <>
                <label style={{ color:"#444", fontSize:10, letterSpacing:3, fontFamily:"'Space Mono',monospace", display:"block", marginBottom:12 }}>
                  UPLOAD IMAGE TO CHECK
                </label>
                {imagePreview ? (
                  <div style={{ position:"relative" }}>
                    <img src={imagePreview} alt="preview" style={{ width:"100%", maxHeight:240, objectFit:"contain", borderRadius:8, background:"#0f0f1a" }} />
                    <button onClick={() => { setImageFile(null); setImagePreview(null); setResult(null); }}
                      style={{ position:"absolute", top:8, right:8, background:"rgba(0,0,0,0.7)", border:"none",
                        borderRadius:"50%", width:28, height:28, color:"#fff", cursor:"pointer", fontSize:14 }}>✕</button>
                  </div>
                ) : (
                  <div onClick={() => fileRef.current.click()} style={{ border:"2px dashed #1e1e30", borderRadius:10,
                    padding:"40px 20px", textAlign:"center", cursor:"pointer" }}>
                    <div style={{ fontSize:32, marginBottom:8 }}>📸</div>
                    <p style={{ color:"#444", fontSize:13 }}>Click to upload image</p>
                    <p style={{ color:"#2a2a3a", fontSize:11, marginTop:4 }}>JPG, PNG, WEBP supported</p>
                  </div>
                )}
                <input ref={fileRef} type="file" accept="image/*" onChange={onImagePick} style={{ display:"none" }} />
              </>
            )}
            {loading && <ScanBar />}
          </div>

          {/* Analyze button */}
          <button onClick={analyze} disabled={loading}
            style={{ width:"100%", padding:"15px", border:"none", borderRadius:10,
              background:loading?"rgba(255,255,255,0.04)":"linear-gradient(135deg,#00aaff 0%,#0055ff 100%)",
              color:loading?"#333":"#fff", fontSize:13, fontWeight:700,
              fontFamily:"'Space Mono',monospace", letterSpacing:3,
              cursor:loading?"not-allowed":"pointer", textTransform:"uppercase",
              transition:"all 0.2s", marginBottom:24 }}>
            {loading ? "SCANNING..." : tab==="image" ? "ANALYZE IMAGE" : tab==="url" ? "FETCH & ANALYZE" : "ANALYZE NOW"}
          </button>

          {/* Error */}
          {error && (
            <div style={{ padding:"16px 18px", marginBottom:20, borderRadius:10,
              background:error.includes("BLOCKED")?"rgba(255,145,0,0.07)":"rgba(255,23,68,0.07)",
              border:error.includes("BLOCKED")?"1px solid rgba(255,145,0,0.25)":"1px solid rgba(255,23,68,0.2)" }}>
              {error.includes("BLOCKED") ? (
                <>
                  <div style={{ color:"#ff9100", fontSize:14, fontWeight:700, marginBottom:10 }}>🚫 This website blocked TruthScan</div>
                  <p style={{ color:"#cc8800", fontSize:13, lineHeight:1.6, marginBottom:12 }}>
                    This website does not allow TruthScan to scan it directly. Please follow these steps:
                  </p>
                  <div style={{ display:"flex", flexDirection:"column", gap:8, marginBottom:14 }}>
                    {["Open the news article in your browser", "Select all text using Ctrl+A then copy with Ctrl+C", "Paste it in the 📝 Text tab and scan"].map((s,i) => (
                      <div key={i} style={{ display:"flex", gap:10 }}>
                        <span style={{ color:"#ff9100", fontWeight:700, flexShrink:0 }}>{i+1}.</span>
                        <span style={{ color:"#aaa", fontSize:13 }}>{s}</span>
                      </div>
                    ))}
                  </div>
                  <button onClick={() => { setTab("text"); setError(""); setUrlInput(""); }}
                    style={{ padding:"9px 20px", background:"linear-gradient(135deg,#ff9100,#ff6600)",
                      border:"none", borderRadius:8, color:"#fff", fontSize:12, fontWeight:700,
                      cursor:"pointer", fontFamily:"'Space Mono',monospace", letterSpacing:1 }}>
                    📝 SWITCH TO TEXT TAB →
                  </button>
                </>
              ) : (
                <span style={{ color:"#ff6b8a", fontSize:13 }}>⚠️ {error}</span>
              )}
            </div>
          )}

          {/* Result */}
          {result && vc && (
            <div style={{ background:vc.bg, border:`1px solid ${vc.color}25`, borderRadius:14,
              padding:24, marginBottom:24, animation:"fadeUp 0.4s ease" }}>

              {/* Verdict + confidence */}
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:10, marginBottom:16 }}>
                <span style={{ color:vc.color, fontSize:17, fontWeight:800, fontFamily:"'Space Mono',monospace", letterSpacing:1 }}>
                  {vc.label}
                </span>
                <ConfBar value={result.confidence} color={vc.color} />
              </div>

              {/* Language badge */}
              {result.language_detected && result.language_detected.toLowerCase() !== "english" && (
                <div style={{ display:"inline-flex", alignItems:"center", gap:6,
                  padding:"4px 12px", borderRadius:20, marginBottom:12,
                  background:"rgba(0,212,255,0.07)", border:"1px solid rgba(0,212,255,0.2)" }}>
                  <span style={{ fontSize:12 }}>🌍</span>
                  <span style={{ color:"#00d4ff", fontSize:11, fontFamily:"'Space Mono',monospace" }}>
                    {result.language_detected.toUpperCase()} DETECTED
                  </span>
                </div>
              )}

              {/* Summary */}
              <p style={{ color:"#ccc", fontSize:15, lineHeight:1.75,
                borderLeft:`3px solid ${vc.color}`, paddingLeft:14, marginBottom:18 }}>
                {result.summary}
              </p>

              {/* Credibility score */}
              {result.source_credibility !== undefined && (
                <div style={{ padding:"14px 16px", borderRadius:10, marginBottom:16,
                  background:"rgba(255,255,255,0.02)", border:"1px solid #1e1e30" }}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
                    <span style={{ color:"#444", fontSize:10, letterSpacing:3, fontFamily:"'Space Mono',monospace" }}>SOURCE CREDIBILITY</span>
                    <span style={{ fontSize:13, fontWeight:700, fontFamily:"'Space Mono',monospace",
                      color: result.source_credibility>=80?"#00e676":result.source_credibility>=50?"#ff9100":"#ff1744" }}>
                      {result.source_credibility}/100
                    </span>
                  </div>
                  <div style={{ height:6, background:"#111", borderRadius:3, overflow:"hidden", marginBottom:8 }}>
                    <div style={{ height:"100%", borderRadius:3, width:`${result.source_credibility}%`,
                      background: result.source_credibility>=80?"linear-gradient(90deg,#00c853,#00e676)":
                                  result.source_credibility>=50?"linear-gradient(90deg,#ff6f00,#ff9100)":
                                  "linear-gradient(90deg,#b71c1c,#ff1744)" }} />
                  </div>
                  <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                    <div style={{ display:"flex", gap:2 }}>
                      {[1,2,3,4,5].map(i => (
                        <span key={i} style={{ fontSize:12, color:i<=Math.round(result.source_credibility/20)?"#ffd700":"#333" }}>★</span>
                      ))}
                    </div>
                    {result.source_note && <span style={{ color:"#555", fontSize:12 }}>{result.source_note}</span>}
                  </div>
                </div>
              )}

              {/* Timeline */}
              {tl && (
                <div style={{ display:"inline-flex", alignItems:"center", gap:8,
                  padding:"8px 14px", borderRadius:8, marginBottom:16,
                  background:tl.color==="#00e676"?"rgba(0,230,118,0.07)":tl.color==="#8888ff"?"rgba(136,136,255,0.07)":tl.color==="#ff1744"?"rgba(255,23,68,0.07)":"rgba(255,255,255,0.03)",
                  border:`1px solid ${tl.color}25` }}>
                  <span style={{ fontSize:14 }}>{tl.icon}</span>
                  <div>
                    <div style={{ fontSize:10, fontWeight:700, letterSpacing:2, fontFamily:"'Space Mono',monospace", color:tl.color }}>
                      {tl.label}
                    </div>
                    {result.timeline_note && <div style={{ color:"#555", fontSize:11, marginTop:2 }}>{result.timeline_note}</div>}
                  </div>
                </div>
              )}

              {/* Analysis points */}
              <div style={{ color:"#333", fontSize:10, letterSpacing:3, fontFamily:"'Space Mono',monospace", marginBottom:10 }}>ANALYSIS POINTS</div>
              {result.reasons?.map((r,i) => (
                <div key={i} style={{ display:"flex", gap:10, marginBottom:10 }}>
                  <span style={{ color:vc.color, flexShrink:0 }}>›</span>
                  <span style={{ color:"#bbb", fontSize:14, lineHeight:1.6 }}>{r}</span>
                </div>
              ))}

              {/* Warning */}
              {result.warning && (
                <div style={{ marginTop:16, padding:"12px 16px", background:"rgba(255,145,0,0.08)",
                  border:"1px solid rgba(255,145,0,0.2)", borderRadius:8, color:"#ffaa44", fontSize:13 }}>
                  ⚠️ {result.warning}
                </div>
              )}

              {/* Action buttons */}
              <div style={{ display:"flex", gap:10, marginTop:18, flexWrap:"wrap" }}>
                <button onClick={() => setShowShare(true)}
                  style={{ padding:"9px 20px", background:"rgba(0,170,255,0.1)",
                    border:"1px solid rgba(0,170,255,0.2)", borderRadius:8, color:"#00aaff",
                    fontSize:12, cursor:"pointer", fontFamily:"'Space Mono',monospace", letterSpacing:1 }}>
                  📤 SHARE
                </button>
                <button onClick={() => { setResult(null); setTextInput(""); setUrlInput(""); setImageFile(null); setImagePreview(null); }}
                  style={{ padding:"9px 20px", background:"rgba(255,255,255,0.04)",
                    border:"1px solid #2a2a3a", borderRadius:8, color:"#555",
                    fontSize:12, cursor:"pointer", fontFamily:"'Space Mono',monospace", letterSpacing:1 }}>
                  🔄 CHECK ANOTHER
                </button>
              </div>
            </div>
          )}

          {/* Add Key CTA */}
          {!apiKey && (
            <div style={{ textAlign:"center", border:"1px dashed #1a1a28", borderRadius:12, padding:"22px 20px" }}>
              {remaining <= 0 ? (
                <>
                  <p style={{ color:"#666", fontSize:13, marginBottom:14, lineHeight:1.7 }}>
                    Free limit reached. Add your <strong style={{ color:"#00d4ff" }}>free Gemini API key</strong> for unlimited checks.
                  </p>
                  <a href="https://aistudio.google.com" target="_blank" rel="noreferrer"
                    style={{ color:"#00d4ff", fontSize:11, display:"block", marginBottom:12 }}>
                    → Get free key at aistudio.google.com
                  </a>
                  <button onClick={() => setShowModal(true)}
                    style={{ padding:"10px 24px", background:"linear-gradient(135deg,#00aaff,#0055ff)",
                      border:"none", borderRadius:8, color:"#fff", fontSize:12, fontWeight:700,
                      cursor:"pointer", fontFamily:"'Space Mono',monospace", letterSpacing:2 }}>
                    ADD API KEY →
                  </button>
                </>
              ) : (
                <button onClick={() => setShowModal(true)}
                  style={{ background:"none", border:"1px solid #2a2a3a", borderRadius:8,
                    padding:"8px 18px", color:"#444", fontSize:11, cursor:"pointer",
                    fontFamily:"'Space Mono',monospace", letterSpacing:2 }}>
                  HAVE A GEMINI KEY? ADD FOR UNLIMITED →
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Share Modal */}
      {showShare && result && vc && (
        <Modal onClose={() => setShowShare(false)}>
          <h2 style={{ color:"#fff", fontFamily:"'Space Mono',monospace", fontSize:16, letterSpacing:2, marginBottom:20 }}>SHARE RESULT</h2>
          <div style={{ background:vc.bg, border:`1px solid ${vc.color}30`, borderRadius:12, padding:20, marginBottom:20 }}>
            <div style={{ color:"#555", fontSize:11, fontFamily:"'Space Mono',monospace", letterSpacing:2, marginBottom:8 }}>🛡️ TRUTHSCAN</div>
            <div style={{ color:vc.color, fontSize:16, fontWeight:800, marginBottom:8, fontFamily:"'Space Mono',monospace" }}>{vc.label}</div>
            <p style={{ color:"#aaa", fontSize:13, lineHeight:1.6, marginBottom:8 }}>{result.summary}</p>
            <div style={{ color:vc.color, fontSize:12, fontWeight:700 }}>Confidence: {result.confidence}%</div>
          </div>
          <div style={{ display:"flex", gap:10 }}>
            <button onClick={() => setShowShare(false)}
              style={{ flex:1, padding:11, background:"transparent", border:"1px solid #2a2a3a", borderRadius:8, color:"#666", cursor:"pointer", fontSize:12 }}>
              Cancel
            </button>
            <button onClick={handleShare}
              style={{ flex:2, padding:11, background:"linear-gradient(135deg,#00aaff,#0055ff)",
                border:"none", borderRadius:8, color:"#fff", fontSize:12, fontWeight:700,
                cursor:"pointer", fontFamily:"'Space Mono',monospace", letterSpacing:1 }}>
              {copied ? "✅ COPIED!" : "📤 SHARE / COPY"}
            </button>
          </div>
        </Modal>
      )}

      {/* API Key Modal */}
      {showModal && (
        <Modal onClose={() => { setShowModal(false); setTempKey(""); }}>
          <h2 style={{ color:"#fff", fontFamily:"'Space Mono',monospace", fontSize:17, letterSpacing:2, marginBottom:6 }}>ADD YOUR API KEY</h2>
          <p style={{ color:"#555", fontSize:13, marginBottom:20, lineHeight:1.7 }}>
            Get a free key from{" "}
            <a href="https://aistudio.google.com" target="_blank" rel="noreferrer" style={{ color:"#00d4ff" }}>aistudio.google.com</a>
            {" "}— no card needed.
          </p>
          <div style={{ position:"relative", marginBottom:12 }}>
            <input type={showKeyText?"text":"password"} placeholder="Paste your Gemini API key (AIza...)"
              value={tempKey} onChange={e => setTempKey(e.target.value)}
              style={{ width:"100%", padding:"13px 44px 13px 14px", background:"rgba(255,255,255,0.04)",
                border:"1px solid #2a2a3a", borderRadius:8, color:"#fff", fontSize:14, outline:"none",
                boxSizing:"border-box", fontFamily:"monospace" }} />
            <button onClick={() => setShowKeyText(!showKeyText)}
              style={{ position:"absolute", right:12, top:"50%", transform:"translateY(-50%)",
                background:"none", border:"none", color:"#444", cursor:"pointer", fontSize:15 }}>
              {showKeyText?"🙈":"👁️"}
            </button>
          </div>
          <div style={{ padding:"10px 14px", background:"rgba(0,212,255,0.04)", border:"1px solid rgba(0,212,255,0.1)", borderRadius:8, marginBottom:18 }}>
            <p style={{ color:"#555", fontSize:11, margin:0, lineHeight:1.6 }}>
              🔒 <strong style={{ color:"#777" }}>Stored in YOUR browser only.</strong> We never see your key.
            </p>
          </div>
          <div style={{ display:"flex", gap:10 }}>
            <button onClick={() => { setShowModal(false); setTempKey(""); }}
              style={{ flex:1, padding:11, background:"transparent", border:"1px solid #2a2a3a", borderRadius:8, color:"#666", cursor:"pointer", fontSize:12 }}>
              Cancel
            </button>
            <button onClick={() => { if(tempKey.trim()){ saveKey(tempKey); setTempKey(""); setShowModal(false); } }}
              disabled={!tempKey.trim()}
              style={{ flex:2, padding:11, background:tempKey.trim()?"linear-gradient(135deg,#00aaff,#0055ff)":"#111",
                border:"none", borderRadius:8, color:tempKey.trim()?"#fff":"#333",
                cursor:tempKey.trim()?"pointer":"not-allowed", fontSize:12, fontWeight:700,
                fontFamily:"'Space Mono',monospace", letterSpacing:1 }}>
              SAVE & ACTIVATE
            </button>
          </div>
        </Modal>
      )}
    </>
  );
}

// ── Helpers ──────────────────────────────────────────────────────
function toBase64(file) {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload  = () => res(r.result.split(",")[1]);
    r.onerror = rej;
    r.readAsDataURL(file);
  });
}

function Dot({ color, glow }) {
  return <div style={{ width:7, height:7, borderRadius:"50%", background:color, boxShadow:glow?`0 0 6px ${color}`:"none", flexShrink:0 }} />;
}

function ConfBar({ value, color }) {
  return (
    <div style={{ display:"flex", alignItems:"center", gap:8 }}>
      <div style={{ width:80, height:5, background:"#111", borderRadius:3, overflow:"hidden" }}>
        <div style={{ width:`${value}%`, height:"100%", background:color, borderRadius:3 }} />
      </div>
      <span style={{ color, fontSize:12, fontWeight:700, fontFamily:"'Space Mono',monospace" }}>{value}%</span>
    </div>
  );
}

function ScanBar() {
  return (
    <div style={{ height:3, background:"#111", borderRadius:2, marginTop:10, overflow:"hidden" }}>
      <div style={{ height:"100%", width:"35%", background:"linear-gradient(90deg,transparent,#00d4ff,transparent)", animation:"scan 1.2s ease-in-out infinite" }} />
    </div>
  );
}

function Modal({ children, onClose }) {
  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.88)",
      display:"flex", alignItems:"center", justifyContent:"center", zIndex:100, padding:16 }}
      onClick={e => e.target===e.currentTarget && onClose()}>
      <div style={{ background:"#0e0e1a", border:"1px solid #1e1e30", borderRadius:16,
        padding:"30px 26px", maxWidth:440, width:"100%" }}>
        {children}
      </div>
    </div>
  );
}
