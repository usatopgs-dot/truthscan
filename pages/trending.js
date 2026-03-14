import { useState, useEffect } from "react";
import Head from "next/head";
import Link from "next/link";

const VC = {
  TRUE:       { color: "#00e676", label: "✅ TRUE",       bg: "rgba(0,230,118,0.07)"  },
  FALSE:      { color: "#ff1744", label: "❌ FAKE",        bg: "rgba(255,23,68,0.07)"  },
  MISLEADING: { color: "#ff9100", label: "⚠️ MISLEADING", bg: "rgba(255,145,0,0.07)" },
};

export default function Trending() {
  const [items, setItems]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [hasRedis, setHasRedis] = useState(false);

  useEffect(() => {
    fetch("/api/trending")
      .then(r => r.json())
      .then(data => {
        setItems(data.trending || []);
        setHasRedis(data.hasRedis || false);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  // Stats
  const fakeCount     = items.filter(i => i.verdict === "FALSE").length;
  const misleadCount  = items.filter(i => i.verdict === "MISLEADING").length;
  const trueCount     = items.filter(i => i.verdict === "TRUE").length;
  const totalChecks   = items.reduce((s, i) => s + (i.count || 1), 0);

  return (
    <>
      <Head>
        <title>Trending — TruthScan</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link href="https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
        <style>{`
          * { margin:0; padding:0; box-sizing:border-box; }
          body { background:#080810; }
          @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.5} }
          @keyframes fadeUp { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        `}</style>
      </Head>

      <div style={{ minHeight:"100vh", background:"#080810", fontFamily:"'Inter',sans-serif", padding:"28px 16px",
        backgroundImage:"radial-gradient(ellipse at 20% 50%,rgba(255,23,68,0.04) 0%,transparent 55%),radial-gradient(ellipse at 80% 10%,rgba(0,212,255,0.04) 0%,transparent 55%)" }}>
        <div style={{ maxWidth:660, margin:"0 auto" }}>

          {/* Header */}
          <div style={{ marginBottom:28 }}>
            <Link href="/" style={{ color:"#444", fontSize:12, textDecoration:"none" }}>← Back</Link>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginTop:10, flexWrap:"wrap", gap:10 }}>
              <div>
                <h1 style={{ fontFamily:"'Space Mono',monospace", fontSize:22, fontWeight:700,
                  color:"#fff", letterSpacing:3, textTransform:"uppercase" }}>📈 Trending Today</h1>
                <p style={{ color:"#444", fontSize:12, marginTop:4 }}>
                  {new Date().toDateString()} — Most checked news
                </p>
              </div>
              {/* Live indicator */}
              <div style={{ display:"flex", alignItems:"center", gap:6,
                padding:"5px 12px", borderRadius:20,
                border:"1px solid rgba(255,23,68,0.3)", background:"rgba(255,23,68,0.05)" }}>
                <div style={{ width:6, height:6, borderRadius:"50%", background:"#ff1744", animation:"pulse 1.5s infinite" }} />
                <span style={{ color:"#ff6666", fontSize:11, fontFamily:"'Space Mono',monospace" }}>LIVE</span>
              </div>
            </div>
          </div>

          {/* Stats row */}
          {!loading && items.length > 0 && (
            <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:10, marginBottom:24 }}>
              {[
                { label:"Total Checks", value:totalChecks, color:"#00d4ff" },
                { label:"Fake Detected", value:fakeCount + misleadCount, color:"#ff1744" },
                { label:"Verified True", value:trueCount, color:"#00e676" },
              ].map((s,i) => (
                <div key={i} style={{ background:"rgba(255,255,255,0.02)", border:"1px solid #1a1a28",
                  borderRadius:12, padding:"14px 16px", textAlign:"center" }}>
                  <div style={{ color:s.color, fontSize:24, fontWeight:700, fontFamily:"'Space Mono',monospace" }}>{s.value}</div>
                  <div style={{ color:"#444", fontSize:10, letterSpacing:2, marginTop:4 }}>{s.label}</div>
                </div>
              ))}
            </div>
          )}

          {/* No Redis setup */}
          {!loading && !hasRedis && (
            <div style={{ padding:"24px", background:"rgba(255,145,0,0.07)",
              border:"1px solid rgba(255,145,0,0.2)", borderRadius:12, marginBottom:24 }}>
              <div style={{ color:"#ff9100", fontSize:14, fontWeight:700, marginBottom:10 }}>
                ⚙️ Setup Required for Trending
              </div>
              <p style={{ color:"#cc8800", fontSize:13, lineHeight:1.7, marginBottom:14 }}>
                Trending needs a free database. Setup takes 3 minutes:
              </p>
              <div style={{ display:"flex", flexDirection:"column", gap:8, marginBottom:16 }}>
                {[
                  "Go to upstash.com → Sign up free",
                  "Create Redis Database → Copy REST URL & Token",
                  "Vercel → Settings → Environment Variables → Add:",
                  "UPSTASH_REDIS_REST_URL = your_url",
                  "UPSTASH_REDIS_REST_TOKEN = your_token",
                  "Redeploy → Trending is live! ✅"
                ].map((s,i) => (
                  <div key={i} style={{ display:"flex", gap:10 }}>
                    <span style={{ color:"#ff9100", fontWeight:700, flexShrink:0, fontSize:12 }}>{i+1 <= 6 ? i+1+"." : ""}</span>
                    <span style={{ color:s.startsWith("UPSTASH") ? "#00d4ff" : "#888", fontSize:13,
                      fontFamily: s.startsWith("UPSTASH") ? "monospace" : "inherit" }}>{s}</span>
                  </div>
                ))}
              </div>
              <a href="https://upstash.com" target="_blank" rel="noreferrer"
                style={{ display:"inline-block", padding:"9px 20px",
                  background:"linear-gradient(135deg,#ff9100,#ff6600)",
                  borderRadius:8, color:"#fff", fontSize:12, fontWeight:700,
                  textDecoration:"none", fontFamily:"'Space Mono',monospace", letterSpacing:1 }}>
                → SETUP FREE DB AT UPSTASH.COM
              </a>
            </div>
          )}

          {/* Loading */}
          {loading && (
            <div style={{ textAlign:"center", padding:"60px 20px" }}>
              <div style={{ fontSize:32, marginBottom:12, animation:"pulse 1s infinite" }}>📡</div>
              <p style={{ color:"#444", fontSize:14 }}>Loading trending data...</p>
            </div>
          )}

          {/* Empty */}
          {!loading && hasRedis && items.length === 0 && (
            <div style={{ textAlign:"center", padding:"60px 20px" }}>
              <div style={{ fontSize:48, marginBottom:16 }}>📭</div>
              <p style={{ color:"#444", fontSize:15, marginBottom:8 }}>No data yet today</p>
              <p style={{ color:"#333", fontSize:13 }}>As users check news, trending data will appear here.</p>
              <Link href="/" style={{ display:"inline-block", marginTop:20, padding:"10px 24px",
                background:"linear-gradient(135deg,#00aaff,#0055ff)", borderRadius:8,
                color:"#fff", fontSize:13, textDecoration:"none",
                fontFamily:"'Space Mono',monospace", letterSpacing:2 }}>
                CHECK SOME NEWS →
              </Link>
            </div>
          )}

          {/* Trending list */}
          {!loading && items.length > 0 && (
            <>
              <div style={{ color:"#333", fontSize:10, letterSpacing:3, fontFamily:"'Space Mono',monospace", marginBottom:14 }}>
                TODAY'S MOST CHECKED
              </div>
              {items.map((item, i) => {
                const vc = VC[item.verdict] || VC.MISLEADING;
                return (
                  <div key={i} style={{ display:"flex", gap:14, alignItems:"flex-start",
                    background:"rgba(255,255,255,0.02)", border:`1px solid ${vc.color}15`,
                    borderLeft:`3px solid ${vc.color}`, borderRadius:12,
                    padding:"14px 16px", marginBottom:10,
                    animation:`fadeUp 0.3s ease ${i*0.05}s both` }}>

                    {/* Rank */}
                    <div style={{ color:"#333", fontSize:18, fontWeight:700,
                      fontFamily:"'Space Mono',monospace", flexShrink:0, minWidth:28 }}>
                      {i+1}
                    </div>

                    {/* Content */}
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:6, flexWrap:"wrap" }}>
                        <span style={{ color:vc.color, fontSize:12, fontWeight:700,
                          fontFamily:"'Space Mono',monospace" }}>{vc.label}</span>
                        <span style={{ background:`${vc.color}20`, color:vc.color,
                          fontSize:10, padding:"2px 8px", borderRadius:10, fontWeight:700 }}>
                          {item.confidence}%
                        </span>
                        {item.count > 1 && (
                          <span style={{ background:"rgba(255,255,255,0.05)", color:"#666",
                            fontSize:10, padding:"2px 8px", borderRadius:10 }}>
                            🔁 {item.count} checks
                          </span>
                        )}
                      </div>
                      <p style={{ color:"#888", fontSize:13, lineHeight:1.5,
                        overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                        {item.snippet}...
                      </p>
                    </div>
                  </div>
                );
              })}
            </>
          )}

          {/* Nav */}
          <div style={{ display:"flex", justifyContent:"center", gap:16, marginTop:32 }}>
            <Link href="/" style={{ color:"#444", fontSize:12, textDecoration:"none" }}>🛡️ Check News</Link>
            <Link href="/history" style={{ color:"#444", fontSize:12, textDecoration:"none" }}>📋 History</Link>
          </div>
        </div>
      </div>
    </>
  );
}
