import { useState, useEffect, useRef } from "react";
import Head from "next/head";
import Link from "next/link";

const FREE_LIMIT = 5;

// ── Verdict config ───────────────────────────────────────────────
const VC = {
  TRUE:        { color: "#00e676", bg: "rgba(0,230,118,0.07)",  label: "✅ VERIFIED TRUE"   },
  FALSE:       { color: "#ff1744", bg: "rgba(255,23,68,0.07)",  label: "❌ FAKE NEWS"        },
  MISLEADING:  { color: "#ff9100", bg: "rgba(255,145,0,0.07)", label: "⚠️ MISLEADING"       },
  REAL:        { color: "#00e676", bg: "rgba(0,230,118,0.07)",  label: "✅ IMAGE LOOKS REAL" },
  FAKE:        { color: "#ff1744", bg: "rgba(255,23,68,0.07)",  label: "❌ FAKE IMAGE"       },
  MANIPULATED: { color: "#ff9100", bg: "rgba(255,145,0,0.07)", label: "🖼️ MANIPULATED"      },
};

export default function TruthScan() {
  const [tab, setTab]             = useState("text"); // text | url | image
  const [textInput, setTextInput] = useState("");
  const [urlInput, setUrlInput]   = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [result, setResult]       = useState(null);
  const [loading, setLoading]     = useState(false);
  const [freeChecks, setFreeChecks] = useState(0);
  const [apiKey, setApiKey]       = useState("");
  const [showModal, setShowModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [tempKey, setTempKey]     = useState("");
  const [showKeyText, setShowKeyText] = useState(false);
  const [error, setError]         = useState("");
  const [copied, setCopied]       = useState(false);
  const [votes, setVotes]         = useState(null);   // {agree, disagree, userVote}
  const [voting, setVoting]       = useState(false);
  const fileRef = useRef();

  // ── Load saved state ─────────────────────────────────────────────
  useEffect(() => {
    const today     = new Date().toDateString();
    const savedDate = localStorage.getItem("ts_date");
    const saved     = parseInt(localStorage.getItem("ts_checks") || "0");
    const key       = localStorage.getItem("ts_key") || "";
    if (savedDate === today) setFreeChecks(saved);
    else { localStorage.setItem("ts_date", today); localStorage.setItem("ts_checks", "0"); }
    setApiKey(key);
  }, []);

  const remaining = FREE_LIMIT - freeChecks;
  const canCheck  = !!apiKey || remaining > 0;

  // ── Image pick ────────────────────────────────────────────────────
  const onImagePick = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setImagePreview(ev.target.result);
    reader.readAsDataURL(file);
    setResult(null);
    setError("");
  };

  // ── Analyze ───────────────────────────────────────────────────────
  const analyze = async () => {
    if (loading) return;
    if (!canCheck) { setShowModal(true); return; }

    setLoading(true);
    setResult(null);
    setError("");

    try {
      let body = { userApiKey: apiKey || null };

      if (tab === "text") {
        if (!textInput.trim()) { setError("Please paste some text first."); setLoading(false); return; }
        body = { ...body, type: "text", text: textInput.trim() };
      } else if (tab === "url") {
        if (!urlInput.trim()) { setError("Please enter a URL first."); setLoading(false); return; }
        const url = urlInput.startsWith("http") ? urlInput.trim() : `https://${urlInput.trim()}`;
        body = { ...body, type: "url", url };
      } else if (tab === "image") {
        if (!imageFile) { setError("Please select an image first."); setLoading(false); return; }
        const base64 = await fileToBase64(imageFile);
        body = { ...body, type: "image", image: base64, imageMime: imageFile.type };
      }

      const res = await fetch("/api/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Something went wrong.");

      setResult(data.result);
      setVotes(null); // reset votes for new result
      // Fetch existing votes for this content
      fetchVotes(input_hash(tab === "text" ? textInput : tab === "url" ? urlInput : imageFile?.name || ""));

      // Save to history
      saveToHistory({
        type: tab,
        input: tab === "text" ? textInput : tab === "url" ? urlInput : imageFile?.name,
        result: data.result,
        date: new Date().toISOString()
      });

      // Update free check count
      if (!apiKey) {
        const nc = freeChecks + 1;
        setFreeChecks(nc);
        localStorage.setItem("ts_checks", String(nc));
        localStorage.setItem("ts_date", new Date().toDateString());
      }
    } catch (e) {
      setError(e.message);
    }
    setLoading(false);
  };

  // ── History ───────────────────────────────────────────────────────
  const saveToHistory = (item) => {
    try {
      const existing = JSON.parse(localStorage.getItem("ts_history") || "[]");
      const updated = [item, ...existing].slice(0, 50); // keep last 50
      localStorage.setItem("ts_history", JSON.stringify(updated));
    } catch {}
  };

  // ── Key helpers ───────────────────────────────────────────────────
  const saveKey = (key) => { localStorage.setItem("ts_key", key.trim()); setApiKey(key.trim()); };
  const removeKey = () => { localStorage.removeItem("ts_key"); setApiKey(""); };

  const vc = result ? VC[result.verdict] : null;

  // ── Share card text ───────────────────────────────────────────────
  const shareText = result
    ? `🛡️ TruthScan Result\n\n${vc?.label}\nConfidence: ${result.confidence}%\n\n📋 ${result.summary}\n\n🔍 Analysis:\n${result.reasons?.map(r => `• ${r}`).join("\n")}\n\nCheck news at TruthScan ✅`
    : "";

  const handleShare = () => {
    if (navigator.share) navigator.share({ text: shareText });
    else { navigator.clipboard.writeText(shareText); setCopied(true); setTimeout(() => setCopied(false), 2000); }
  };

  // ── Vote helpers ─────────────────────────────────────────────────
  const input_hash = (str) => {
    let hash = 0;
    for (let i = 0; i < Math.min(str.length, 100); i++) {
      hash = ((hash << 5) - hash) + str.charCodeAt(i);
      hash |= 0;
    }
    return Math.abs(hash).toString(36);
  };

  const fetchVotes = async (key) => {
    try {
      const res = await fetch(`/api/vote?key=${key}`);
      const data = await res.json();
      const userVote = localStorage.getItem(`vote_${key}`);
      setVotes({ agree: data.agree || 0, disagree: data.disagree || 0, userVote });
    } catch {}
  };

  const castVote = async (type) => {
    if (!result || voting) return;
    const key = input_hash(tab === "text" ? textInput : tab === "url" ? urlInput : imageFile?.name || "");
    const existing = localStorage.getItem(`vote_${key}`);
    if (existing) return; // already voted
    setVoting(true);
    try {
      const res = await fetch("/api/vote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key, type, verdict: result.verdict })
      });
      const data = await res.json();
      localStorage.setItem(`vote_${key}`, type);
      setVotes({ agree: data.agree, disagree: data.disagree, userVote: type });
    } catch {}
    setVoting(false);
  };

  // ── Render ────────────────────────────────────────────────────────
  return (
    <>
      <Head>
        <title>TruthScan — AI Fake News Detector</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link href="https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
        <style>{`
          * { margin:0; padding:0; box-sizing:border-box; }
          body { background:#080810; }
          ::selection { background:rgba(0,212,255,0.2); }
          textarea::placeholder, input::placeholder { color:#2a2a3a; }
          @keyframes fadeUp { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
          @keyframes scan { 0%{margin-left:-35%} 100%{margin-left:135%} }
          @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.5} }
        `}</style>
      </Head>

      <div style={{
        minHeight: "100vh", background: "#080810",
        fontFamily: "'Inter', sans-serif", padding: "28px 16px",
        backgroundImage:
          "radial-gradient(ellipse at 10% 40%, rgba(0,212,255,0.05) 0%, transparent 55%)," +
          "radial-gradient(ellipse at 90% 10%, rgba(255,23,68,0.05) 0%, transparent 55%)"
      }}>
        <div style={{ maxWidth: 660, margin: "0 auto" }}>

          {/* ── Header ── */}
          <div style={{ textAlign: "center", marginBottom: 36 }}>
            <div style={{ fontSize: 42, marginBottom: 8 }}>🛡️</div>
            <h1 style={{
              fontFamily: "'Space Mono',monospace",
              fontSize: 32, fontWeight: 700, letterSpacing: 5,
              background: "linear-gradient(135deg,#fff 0%,#00d4ff 100%)",
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
              margin: "0 0 5px", textTransform: "uppercase"
            }}>TruthScan</h1>
            <p style={{ color: "#444", fontSize: 10, letterSpacing: 3, fontFamily: "'Space Mono',monospace" }}>
              AI-POWERED FAKE NEWS DETECTOR
            </p>

            {/* Nav links */}
            <div style={{ display: "flex", justifyContent: "center", gap: 16, marginTop: 14 }}>
              <span style={{ color: "#00d4ff", fontSize: 12, borderBottom: "1px solid #00d4ff", paddingBottom: 2 }}>
                Check News
              </span>
              <Link href="/history" style={{ color: "#444", fontSize: 12, textDecoration: "none" }}>
                📋 History
              </Link>
            </div>

            {/* Status badge */}
            <div style={{ marginTop: 14 }}>
              {apiKey ? (
                <div style={{
                  display: "inline-flex", alignItems: "center", gap: 8,
                  padding: "5px 14px", borderRadius: 20,
                  border: "1px solid rgba(0,230,118,0.25)",
                  background: "rgba(0,230,118,0.05)"
                }}>
                  <Dot color="#00e676" glow />
                  <span style={{ color: "#00e676", fontSize: 11 }}>Unlimited — Your API Key Active</span>
                  <button onClick={removeKey} style={{ background: "none", border: "none", color: "#555", cursor: "pointer", fontSize: 10 }}>✕</button>
                </div>
              ) : (
                <div style={{
                  display: "inline-flex", alignItems: "center", gap: 8,
                  padding: "5px 14px", borderRadius: 20,
                  border: "1px solid #1e1e30", background: "rgba(255,255,255,0.02)"
                }}>
                  <Dot color={remaining > 0 ? "#00d4ff" : "#ff1744"} />
                  <span style={{ color: "#555", fontSize: 11 }}>
                    {remaining > 0 ? `${remaining}/${FREE_LIMIT} free checks left today` : "Daily limit reached"}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* ── Tabs ── */}
          <div style={{
            display: "flex", gap: 4, marginBottom: 16,
            background: "rgba(255,255,255,0.02)",
            border: "1px solid #1a1a28", borderRadius: 12, padding: 4
          }}>
            {[
              { id: "text",  icon: "📝", label: "Text" },
              { id: "url",   icon: "🔗", label: "URL" },
              { id: "image", icon: "🖼️", label: "Image" },
            ].map(t => (
              <button
                key={t.id}
                onClick={() => { setTab(t.id); setResult(null); setError(""); }}
                style={{
                  flex: 1, padding: "10px 8px",
                  background: tab === t.id ? "rgba(0,170,255,0.15)" : "transparent",
                  border: tab === t.id ? "1px solid rgba(0,170,255,0.3)" : "1px solid transparent",
                  borderRadius: 9, cursor: "pointer",
                  color: tab === t.id ? "#00aaff" : "#444",
                  fontSize: 13, fontWeight: tab === t.id ? 600 : 400,
                  transition: "all 0.2s", display: "flex",
                  alignItems: "center", justifyContent: "center", gap: 6
                }}
              >
                <span>{t.icon}</span> {t.label}
              </button>
            ))}
          </div>

          {/* ── Input Area ── */}
          <div style={{
            background: "rgba(255,255,255,0.02)",
            border: "1px solid #1a1a28", borderRadius: 14,
            padding: "20px 22px", marginBottom: 12
          }}>
            {/* TEXT tab */}
            {tab === "text" && (
              <>
                <label style={{ color: "#444", fontSize: 10, letterSpacing: 3, fontFamily: "'Space Mono',monospace", display: "block", marginBottom: 12 }}>
                  PASTE NEWS / HEADLINE / WHATSAPP MESSAGE
                </label>
                <textarea
                  value={textInput}
                  onChange={e => setTextInput(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && e.ctrlKey && analyze()}
                  placeholder="Paste news in any language — English, Hindi (हिंदी), Punjabi (ਪੰਜਾਬੀ), Urdu, Tamil, or any other..."
                  rows={5}
                  style={{
                    width: "100%", background: "transparent", border: "none",
                    color: "#ddd", fontSize: 15, lineHeight: 1.75,
                    resize: "vertical", outline: "none",
                    fontFamily: "'Inter',sans-serif", boxSizing: "border-box"
                  }}
                />
              </>
            )}

            {/* URL tab */}
            {tab === "url" && (
              <>
                <label style={{ color: "#444", fontSize: 10, letterSpacing: 3, fontFamily: "'Space Mono',monospace", display: "block", marginBottom: 12 }}>
                  PASTE NEWS ARTICLE URL / LINK
                </label>
                <input
                  type="url"
                  value={urlInput}
                  onChange={e => setUrlInput(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && analyze()}
                  placeholder="https://example.com/news-article"
                  style={{
                    width: "100%", background: "transparent", border: "none",
                    color: "#ddd", fontSize: 15, outline: "none",
                    fontFamily: "'Inter',sans-serif", boxSizing: "border-box",
                    padding: "8px 0"
                  }}
                />
                <p style={{ color: "#2a2a3a", fontSize: 11, marginTop: 10 }}>
                  AI will fetch and analyze the full article content
                </p>
              </>
            )}

            {/* IMAGE tab */}
            {tab === "image" && (
              <>
                <label style={{ color: "#444", fontSize: 10, letterSpacing: 3, fontFamily: "'Space Mono',monospace", display: "block", marginBottom: 12 }}>
                  UPLOAD IMAGE TO CHECK
                </label>
                {imagePreview ? (
                  <div style={{ position: "relative" }}>
                    <img src={imagePreview} alt="preview"
                      style={{ width: "100%", maxHeight: 240, objectFit: "contain", borderRadius: 8, background: "#0f0f1a" }}
                    />
                    <button
                      onClick={() => { setImageFile(null); setImagePreview(null); setResult(null); }}
                      style={{
                        position: "absolute", top: 8, right: 8,
                        background: "rgba(0,0,0,0.7)", border: "none",
                        borderRadius: "50%", width: 28, height: 28,
                        color: "#fff", cursor: "pointer", fontSize: 14
                      }}
                    >✕</button>
                  </div>
                ) : (
                  <div
                    onClick={() => fileRef.current.click()}
                    style={{
                      border: "2px dashed #1e1e30", borderRadius: 10,
                      padding: "40px 20px", textAlign: "center", cursor: "pointer",
                      transition: "border-color 0.2s"
                    }}
                    onMouseOver={e => e.currentTarget.style.borderColor = "#2a2a4a"}
                    onMouseOut={e => e.currentTarget.style.borderColor = "#1e1e30"}
                  >
                    <div style={{ fontSize: 32, marginBottom: 8 }}>📸</div>
                    <p style={{ color: "#444", fontSize: 13 }}>Click to upload image</p>
                    <p style={{ color: "#2a2a3a", fontSize: 11, marginTop: 4 }}>JPG, PNG, WEBP supported</p>
                  </div>
                )}
                <input ref={fileRef} type="file" accept="image/*" onChange={onImagePick} style={{ display: "none" }} />
              </>
            )}

            {loading && <ScanBar />}
          </div>

          {/* ── Analyze Button ── */}
          <button
            onClick={analyze}
            disabled={loading}
            style={{
              width: "100%", padding: "15px",
              background: loading ? "rgba(255,255,255,0.04)" : "linear-gradient(135deg,#00aaff 0%,#0055ff 100%)",
              border: "none", borderRadius: 10,
              color: loading ? "#333" : "#fff",
              fontSize: 13, fontWeight: 700,
              fontFamily: "'Space Mono',monospace", letterSpacing: 3,
              cursor: loading ? "not-allowed" : "pointer",
              textTransform: "uppercase", transition: "all 0.2s",
              marginBottom: 24
            }}
          >
            {loading ? "SCANNING..." : tab === "image" ? "ANALYZE IMAGE" : tab === "url" ? "FETCH & ANALYZE" : "ANALYZE NOW"}
          </button>

          {/* ── Error ── */}
          {error && (
            <div style={{
              padding: "16px 18px", marginBottom: 20,
              background: error.includes("BLOCKED") ? "rgba(255,145,0,0.07)" : "rgba(255,23,68,0.07)",
              border: error.includes("BLOCKED") ? "1px solid rgba(255,145,0,0.25)" : "1px solid rgba(255,23,68,0.2)",
              borderRadius: 10
            }}>
              {error.includes("BLOCKED") ? (
                <>
                  <div style={{ color: "#ff9100", fontSize: 14, fontWeight: 700, marginBottom: 10 }}>
                    🚫 This website blocked TruthScan
                  </div>
                  <p style={{ color: "#cc8800", fontSize: 13, lineHeight: 1.6, marginBottom: 12 }}>
                    This website does not allow TruthScan to scan it directly.<br/>
                    Please follow these steps:
                  </p>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                      <span style={{ color: "#ff9100", fontWeight: 700, flexShrink: 0 }}>1.</span>
                      <span style={{ color: "#aaa", fontSize: 13 }}>Open the news article in your browser</span>
                    </div>
                    <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                      <span style={{ color: "#ff9100", fontWeight: 700, flexShrink: 0 }}>2.</span>
                      <span style={{ color: "#aaa", fontSize: 13 }}>Select all text using <strong style={{color:"#fff"}}>Ctrl+A</strong> then copy with <strong style={{color:"#fff"}}>Ctrl+C</strong></span>
                    </div>
                    <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                      <span style={{ color: "#ff9100", fontWeight: 700, flexShrink: 0 }}>3.</span>
                      <span style={{ color: "#aaa", fontSize: 13 }}>Paste it in the <strong style={{color:"#fff"}}>📝 Text tab</strong> and scan</span>
                    </div>
                  </div>
                  <button
                    onClick={() => { setTab("text"); setError(""); setUrlInput(""); }}
                    style={{
                      marginTop: 14, padding: "9px 20px",
                      background: "linear-gradient(135deg,#ff9100,#ff6600)",
                      border: "none", borderRadius: 8,
                      color: "#fff", fontSize: 12, fontWeight: 700,
                      cursor: "pointer", fontFamily: "'Space Mono',monospace", letterSpacing: 1
                    }}
                  >
                    📝 SWITCH TO TEXT TAB →
                  </button>
                </>
              ) : (
                <span style={{ color: "#ff6b8a", fontSize: 13 }}>⚠️ {error}</span>
              )}
            </div>
          )}

          {/* ── Result ── */}
          {result && vc && (
            <div style={{
              background: vc.bg, border: `1px solid ${vc.color}25`,
              borderRadius: 14, padding: "24px",
              marginBottom: 24, animation: "fadeUp 0.4s ease"
            }}>
              {/* Verdict row */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10, marginBottom: 16 }}>
                <span style={{ color: vc.color, fontSize: 17, fontWeight: 800, fontFamily: "'Space Mono',monospace", letterSpacing: 1 }}>
                  {vc.label}
                </span>
                <ConfidenceBar value={result.confidence} color={vc.color} />
              </div>

              {/* Summary */}
              <p style={{ color: "#ccc", fontSize: 15, lineHeight: 1.75, borderLeft: `3px solid ${vc.color}`, paddingLeft: 14, marginBottom: 18 }}>
                {result.summary}
              </p>

              {/* Language detected badge */}
              {result.language_detected && result.language_detected !== "English" && (
                <div style={{
                  display: "inline-flex", alignItems: "center", gap: 6,
                  padding: "5px 12px", borderRadius: 20, marginBottom: 10, marginRight: 8,
                  background: "rgba(0,212,255,0.07)",
                  border: "1px solid rgba(0,212,255,0.2)"
                }}>
                  <span style={{ fontSize: 13 }}>🌍</span>
                  <span style={{ color: "#00d4ff", fontSize: 11, fontFamily: "'Space Mono',monospace" }}>
                    {result.language_detected.toUpperCase()} DETECTED
                  </span>
                </div>
              )}

              {/* Credibility Score */}
              {result.source_credibility !== undefined && (
                <div style={{
                  padding: "14px 16px", borderRadius: 10, marginBottom: 18,
                  background: "rgba(255,255,255,0.02)",
                  border: "1px solid #1e1e30"
                }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                    <span style={{ color: "#555", fontSize: 10, letterSpacing: 3, fontFamily: "'Space Mono',monospace" }}>
                      SOURCE CREDIBILITY
                    </span>
                    <span style={{
                      fontSize: 13, fontWeight: 700, fontFamily: "'Space Mono',monospace",
                      color: result.source_credibility >= 80 ? "#00e676" :
                             result.source_credibility >= 50 ? "#ff9100" : "#ff1744"
                    }}>
                      {result.source_credibility}/100
                    </span>
                  </div>
                  {/* Score bar */}
                  <div style={{ height: 6, background: "#111", borderRadius: 3, overflow: "hidden", marginBottom: 8 }}>
                    <div style={{
                      height: "100%", borderRadius: 3,
                      width: `${result.source_credibility}%`,
                      background: result.source_credibility >= 80
                        ? "linear-gradient(90deg, #00c853, #00e676)"
                        : result.source_credibility >= 50
                        ? "linear-gradient(90deg, #ff6f00, #ff9100)"
                        : "linear-gradient(90deg, #b71c1c, #ff1744)",
                      transition: "width 0.6s ease"
                    }} />
                  </div>
                  {/* Stars */}
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ display: "flex", gap: 2 }}>
                      {[1,2,3,4,5].map(i => (
                        <span key={i} style={{
                          fontSize: 12,
                          color: i <= Math.round(result.source_credibility / 20) ? "#ffd700" : "#333"
                        }}>★</span>
                      ))}
                    </div>
                    {result.source_note && (
                      <span style={{ color: "#555", fontSize: 12 }}>{result.source_note}</span>
                    )}
                  </div>
                </div>
              )}

              {/* Timeline badge */}
              {result.timeline && (
                <div style={{
                  display: "inline-flex", alignItems: "center", gap: 8,
                  padding: "8px 14px", borderRadius: 8, marginBottom: 18,
                  background: result.timeline === "CURRENT"  ? "rgba(0,230,118,0.08)"  :
                               result.timeline === "PAST"    ? "rgba(100,100,255,0.08)" :
                               result.timeline === "FUTURE"  ? "rgba(255,23,68,0.08)"  :
                               "rgba(255,255,255,0.04)",
                  border: result.timeline === "CURRENT"  ? "1px solid rgba(0,230,118,0.2)"  :
                          result.timeline === "PAST"    ? "1px solid rgba(100,100,255,0.2)" :
                          result.timeline === "FUTURE"  ? "1px solid rgba(255,23,68,0.2)"  :
                          "1px solid #2a2a3a"
                }}>
                  <span style={{ fontSize: 14 }}>
                    {result.timeline === "CURRENT" ? "🟢" :
                     result.timeline === "PAST"    ? "🔵" :
                     result.timeline === "FUTURE"  ? "🔴" : "⚪"}
                  </span>
                  <div>
                    <div style={{
                      fontSize: 11, fontWeight: 700, letterSpacing: 2,
                      fontFamily: "'Space Mono',monospace",
                      color: result.timeline === "CURRENT" ? "#00e676" :
                             result.timeline === "PAST"    ? "#8888ff" :
                             result.timeline === "FUTURE"  ? "#ff4466" : "#666"
                    }}>
                      {result.timeline === "CURRENT" ? "🟢 CURRENT NEWS" :
                       result.timeline === "PAST"    ? "🔵 OLD NEWS" :
                       result.timeline === "FUTURE"  ? "🔴 FUTURE CLAIM" : "⚪ UNKNOWN DATE"}
                    </div>
                    {result.timeline_note && (
                      <div style={{ color: "#666", fontSize: 12, marginTop: 2 }}>
                        {result.timeline_note}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Reasons */}
              <div style={{ color: "#333", fontSize: 10, letterSpacing: 3, fontFamily: "'Space Mono',monospace", marginBottom: 10 }}>
                ANALYSIS POINTS
              </div>
              {result.reasons?.map((r, i) => (
                <div key={i} style={{ display: "flex", gap: 10, marginBottom: 10 }}>
                  <span style={{ color: vc.color, flexShrink: 0 }}>›</span>
                  <span style={{ color: "#bbb", fontSize: 14, lineHeight: 1.6 }}>{r}</span>
                </div>
              ))}

              {/* Warning */}
              {result.warning && (
                <div style={{ marginTop: 16, padding: "12px 16px", background: "rgba(255,145,0,0.08)", border: "1px solid rgba(255,145,0,0.2)", borderRadius: 8, color: "#ffaa44", fontSize: 13 }}>
                  ⚠️ {result.warning}
                </div>
              )}

              {/* ── Community Votes ── */}
              <div style={{
                padding: "16px 18px", borderRadius: 10, marginBottom: 4,
                background: "rgba(255,255,255,0.02)",
                border: "1px solid #1a1a28"
              }}>
                <div style={{ color: "#333", fontSize: 10, letterSpacing: 3, fontFamily: "'Space Mono',monospace", marginBottom: 12 }}>
                  COMMUNITY VERDICT
                </div>
                <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                  {/* Agree button */}
                  <button
                    onClick={() => castVote("agree")}
                    disabled={voting || votes?.userVote}
                    style={{
                      padding: "9px 18px", borderRadius: 8, cursor: votes?.userVote ? "not-allowed" : "pointer",
                      background: votes?.userVote === "agree" ? "rgba(0,230,118,0.15)" : "rgba(0,230,118,0.06)",
                      border: votes?.userVote === "agree" ? "1px solid rgba(0,230,118,0.5)" : "1px solid rgba(0,230,118,0.2)",
                      color: "#00e676", fontSize: 13, fontWeight: 600,
                      display: "flex", alignItems: "center", gap: 6, transition: "all 0.2s"
                    }}
                  >
                    👍 Agree
                    {votes && <span style={{ color: "#00e676", fontFamily: "'Space Mono',monospace", fontSize: 12 }}>
                      {votes.agree}
                    </span>}
                  </button>

                  {/* Disagree button */}
                  <button
                    onClick={() => castVote("disagree")}
                    disabled={voting || votes?.userVote}
                    style={{
                      padding: "9px 18px", borderRadius: 8, cursor: votes?.userVote ? "not-allowed" : "pointer",
                      background: votes?.userVote === "disagree" ? "rgba(255,23,68,0.15)" : "rgba(255,23,68,0.06)",
                      border: votes?.userVote === "disagree" ? "1px solid rgba(255,23,68,0.5)" : "1px solid rgba(255,23,68,0.2)",
                      color: "#ff4466", fontSize: 13, fontWeight: 600,
                      display: "flex", alignItems: "center", gap: 6, transition: "all 0.2s"
                    }}
                  >
                    👎 Disagree
                    {votes && <span style={{ color: "#ff4466", fontFamily: "'Space Mono',monospace", fontSize: 12 }}>
                      {votes.disagree}
                    </span>}
                  </button>

                  {/* Total + bar */}
                  {votes && (votes.agree + votes.disagree) > 0 && (
                    <div style={{ flex: 1, minWidth: 100 }}>
                      <div style={{ height: 5, background: "#111", borderRadius: 3, overflow: "hidden" }}>
                        <div style={{
                          height: "100%", borderRadius: 3,
                          width: `${Math.round((votes.agree / (votes.agree + votes.disagree)) * 100)}%`,
                          background: "linear-gradient(90deg, #00e676, #00aaff)"
                        }}/>
                      </div>
                      <div style={{ color: "#333", fontSize: 10, marginTop: 4, fontFamily: "'Space Mono',monospace" }}>
                        {votes.agree + votes.disagree} total votes
                      </div>
                    </div>
                  )}

                  {votes?.userVote && (
                    <span style={{ color: "#444", fontSize: 11 }}>✓ You voted</span>
                  )}
                </div>
              </div>

              {/* Action buttons */}
              <div style={{ display: "flex", gap: 10, marginTop: 18, flexWrap: "wrap" }}>
                <button
                  onClick={() => setShowShareModal(true)}
                  style={{
                    padding: "9px 20px",
                    background: "rgba(0,170,255,0.1)",
                    border: "1px solid rgba(0,170,255,0.2)",
                    borderRadius: 8, color: "#00aaff",
                    fontSize: 12, cursor: "pointer",
                    fontFamily: "'Space Mono',monospace", letterSpacing: 1
                  }}
                >
                  📤 SHARE RESULT
                </button>
                <button
                  onClick={() => { setResult(null); setTextInput(""); setUrlInput(""); setImageFile(null); setImagePreview(null); }}
                  style={{
                    padding: "9px 20px",
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid #2a2a3a",
                    borderRadius: 8, color: "#555",
                    fontSize: 12, cursor: "pointer",
                    fontFamily: "'Space Mono',monospace", letterSpacing: 1
                  }}
                >
                  🔄 CHECK ANOTHER
                </button>
              </div>
            </div>
          )}

          {/* ── Add Key CTA ── */}
          {!apiKey && (
            <div style={{ textAlign: "center", border: "1px dashed #1a1a28", borderRadius: 12, padding: "22px 20px" }}>
              {remaining <= 0 ? (
                <>
                  <p style={{ color: "#666", fontSize: 13, marginBottom: 14, lineHeight: 1.7 }}>
                    Free limit reached. Add your <strong style={{ color: "#00d4ff" }}>free Gemini API key</strong> for unlimited checks.
                  </p>
                  <a href="https://aistudio.google.com" target="_blank" rel="noreferrer"
                    style={{ color: "#00d4ff", fontSize: 11, display: "block", marginBottom: 12 }}>
                    → Get free key at aistudio.google.com
                  </a>
                  <button onClick={() => setShowModal(true)} style={{
                    padding: "10px 24px",
                    background: "linear-gradient(135deg,#00aaff,#0055ff)",
                    border: "none", borderRadius: 8, color: "#fff",
                    fontSize: 12, fontWeight: 700, cursor: "pointer",
                    fontFamily: "'Space Mono',monospace", letterSpacing: 2
                  }}>ADD API KEY →</button>
                </>
              ) : (
                <button onClick={() => setShowModal(true)} style={{
                  background: "none", border: "1px solid #2a2a3a", borderRadius: 8,
                  padding: "8px 18px", color: "#444", fontSize: 11, cursor: "pointer",
                  fontFamily: "'Space Mono',monospace", letterSpacing: 2
                }}>HAVE A GEMINI KEY? ADD FOR UNLIMITED →</button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Share Modal ── */}
      {showShareModal && result && vc && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.9)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: 16 }}>
          <div style={{ background: "#0e0e1a", border: "1px solid #1e1e30", borderRadius: 16, padding: "28px", maxWidth: 420, width: "100%" }}>
            <h2 style={{ color: "#fff", fontFamily: "'Space Mono',monospace", fontSize: 16, letterSpacing: 2, marginBottom: 20 }}>SHARE RESULT</h2>

            {/* Share card preview */}
            <div style={{
              background: vc.bg, border: `1px solid ${vc.color}30`,
              borderRadius: 12, padding: "20px", marginBottom: 20
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                <span style={{ fontSize: 20 }}>🛡️</span>
                <span style={{ color: "#666", fontSize: 11, fontFamily: "'Space Mono',monospace", letterSpacing: 2 }}>TRUTHSCAN</span>
              </div>
              <div style={{ color: vc.color, fontSize: 16, fontWeight: 800, marginBottom: 8, fontFamily: "'Space Mono',monospace" }}>
                {vc.label}
              </div>
              <p style={{ color: "#aaa", fontSize: 13, lineHeight: 1.6, marginBottom: 10 }}>{result.summary}</p>
              <div style={{ color: vc.color, fontSize: 12, fontWeight: 700 }}>Confidence: {result.confidence}%</div>
            </div>

            <div style={{ display: "flex", gap: 10 }}>
              <button
                onClick={() => setShowShareModal(false)}
                style={{ flex: 1, padding: 11, background: "transparent", border: "1px solid #2a2a3a", borderRadius: 8, color: "#666", cursor: "pointer", fontSize: 12 }}
              >
                Cancel
              </button>
              <button
                onClick={() => { handleShare(); setShowShareModal(false); }}
                style={{
                  flex: 2, padding: 11,
                  background: "linear-gradient(135deg,#00aaff,#0055ff)",
                  border: "none", borderRadius: 8,
                  color: "#fff", fontSize: 12, fontWeight: 700,
                  cursor: "pointer", fontFamily: "'Space Mono',monospace", letterSpacing: 1
                }}
              >
                {copied ? "✅ COPIED!" : "📤 SHARE / COPY"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── API Key Modal ── */}
      {showModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.88)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: 16 }}>
          <div style={{ background: "#0e0e1a", border: "1px solid #1e1e30", borderRadius: 16, padding: "30px 26px", maxWidth: 440, width: "100%" }}>
            <h2 style={{ color: "#fff", fontFamily: "'Space Mono',monospace", fontSize: 17, letterSpacing: 2, marginBottom: 6 }}>ADD YOUR API KEY</h2>
            <p style={{ color: "#555", fontSize: 13, marginBottom: 20, lineHeight: 1.7 }}>
              Get a free key from{" "}
              <a href="https://aistudio.google.com" target="_blank" rel="noreferrer" style={{ color: "#00d4ff" }}>
                aistudio.google.com
              </a>{" "}— no card needed.
            </p>
            <div style={{ position: "relative", marginBottom: 12 }}>
              <input
                type={showKeyText ? "text" : "password"}
                placeholder="Paste your Gemini API key (AIza...)"
                value={tempKey}
                onChange={e => setTempKey(e.target.value)}
                style={{
                  width: "100%", padding: "13px 44px 13px 14px",
                  background: "rgba(255,255,255,0.04)", border: "1px solid #2a2a3a",
                  borderRadius: 8, color: "#fff", fontSize: 14, outline: "none",
                  boxSizing: "border-box", fontFamily: "monospace"
                }}
              />
              <button onClick={() => setShowKeyText(!showKeyText)}
                style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "#444", cursor: "pointer", fontSize: 15 }}>
                {showKeyText ? "🙈" : "👁️"}
              </button>
            </div>
            <div style={{ padding: "10px 14px", background: "rgba(0,212,255,0.04)", border: "1px solid rgba(0,212,255,0.1)", borderRadius: 8, marginBottom: 18 }}>
              <p style={{ color: "#555", fontSize: 11, margin: 0, lineHeight: 1.6 }}>
                🔒 <strong style={{ color: "#777" }}>Stored in YOUR browser only.</strong> We never see your key.
              </p>
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => { setShowModal(false); setTempKey(""); }}
                style={{ flex: 1, padding: 11, background: "transparent", border: "1px solid #2a2a3a", borderRadius: 8, color: "#666", cursor: "pointer", fontSize: 12 }}>
                Cancel
              </button>
              <button
                onClick={() => { if (tempKey.trim()) { saveKey(tempKey); setTempKey(""); setShowModal(false); } }}
                disabled={!tempKey.trim()}
                style={{
                  flex: 2, padding: 11,
                  background: tempKey.trim() ? "linear-gradient(135deg,#00aaff,#0055ff)" : "#111",
                  border: "none", borderRadius: 8,
                  color: tempKey.trim() ? "#fff" : "#333",
                  cursor: tempKey.trim() ? "pointer" : "not-allowed",
                  fontSize: 12, fontWeight: 700,
                  fontFamily: "'Space Mono',monospace", letterSpacing: 1
                }}
              >
                SAVE & ACTIVATE
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ── Helpers ──────────────────────────────────────────────────────
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload  = () => resolve(reader.result.split(",")[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function Dot({ color, glow }) {
  return <div style={{ width: 7, height: 7, borderRadius: "50%", background: color, boxShadow: glow ? `0 0 6px ${color}` : "none", flexShrink: 0 }} />;
}

function ConfidenceBar({ value, color }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <div style={{ width: 80, height: 5, background: "#111", borderRadius: 3, overflow: "hidden" }}>
        <div style={{ width: `${value}%`, height: "100%", background: color, borderRadius: 3 }} />
      </div>
      <span style={{ color, fontSize: 12, fontWeight: 700, fontFamily: "'Space Mono',monospace" }}>{value}%</span>
    </div>
  );
}

function ScanBar() {
  return (
    <div style={{ height: 3, background: "#111", borderRadius: 2, marginTop: 10, overflow: "hidden" }}>
      <div style={{ height: "100%", width: "35%", background: "linear-gradient(90deg,transparent,#00d4ff,transparent)", animation: "scan 1.2s ease-in-out infinite" }} />
    </div>
  );
}
