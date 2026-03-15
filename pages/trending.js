// pages/trending.js — Trending Fake News Dashboard
import { useState, useEffect } from "react";
import Head from "next/head";
import Link from "next/link";
import SEO from "../components/SEO";

const VC = {
  TRUE:        { color:"#059669", bg:"#d1fae5", border:"#6ee7b7", label:"✅ TRUE",       icon:"✓" },
  FALSE:       { color:"#dc2626", bg:"#fee2e2", border:"#fca5a5", label:"❌ FAKE",        icon:"✗" },
  MISLEADING:  { color:"#d97706", bg:"#fef3c7", border:"#fcd34d", label:"⚠️ MISLEADING", icon:"!" },
};

export default function Trending() {
  const [items, setItems]     = useState([]);
  const [stats, setStats]     = useState({ total:0, fake:0, real:0, mislead:0 });
  const [filter, setFilter]   = useState("all");
  const [loading, setLoading] = useState(true);
  const [votes, setVotes]     = useState({});

  const fetchTrending = async (f = "all") => {
    setLoading(true);
    try {
      const res  = await fetch(`/api/trending?filter=${f}&limit=30`);
      const data = await res.json();
      setItems(data.items || []);
      setStats(data.stats || {});
    } catch {}
    setLoading(false);
  };

  useEffect(() => { fetchTrending(); }, []);

  const handleVote = async (id, vote) => {
    if (votes[id]) return; // already voted
    await fetch("/api/trending", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, vote })
    });
    setVotes(v => ({ ...v, [id]: vote }));
    fetchTrending(filter);
  };

  const handleFilter = (f) => {
    setFilter(f);
    fetchTrending(f);
  };

  const fakePercent  = stats.total ? Math.round((stats.fake / stats.total) * 100) : 0;
  const realPercent  = stats.total ? Math.round((stats.real / stats.total) * 100) : 0;
  const misleadPct   = stats.total ? Math.round((stats.mislead / stats.total) * 100) : 0;

  return (
    <>
      <SEO
        title="Trending Fake News Today — TruthScan"
        description="See what fake news is trending today in India. Live dashboard of verified and debunked news stories."
        url="https://truthscan.frontendin.com/trending"
      />

      <div style={{ minHeight:"100vh", background:"linear-gradient(135deg,#f0fdf9,#f0f9ff)", padding:"28px 16px 60px" }}>
        <div style={{ maxWidth:720, margin:"0 auto" }}>

          {/* Header */}
          <div style={{ marginBottom:28 }}>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:12, marginBottom:8 }}>
              <Link href="/" style={{ color:"#64748b", fontSize:13 }}>← TruthScan</Link>
              <Link href="/history" style={{ color:"#64748b", fontSize:13 }}>📋 My History</Link>
            </div>
            <h1 style={{ fontFamily:"'Syne',sans-serif", fontSize:30, fontWeight:800, color:"#0f172a", marginBottom:6 }}>
              📈 Trending Now
            </h1>
            <p style={{ color:"#64748b", fontSize:14 }}>
              Live fake news being checked by users today
            </p>
          </div>

          {/* Stats Cards */}
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(140px,1fr))", gap:12, marginBottom:24 }}>
            {[
              { label:"Total Checked", value:stats.total, color:"#0891b2", bg:"#f0f9ff", border:"#bae6fd", icon:"🔍" },
              { label:"Fake News",     value:stats.fake,  color:"#dc2626", bg:"#fef2f2", border:"#fecaca", icon:"❌", pct:fakePercent },
              { label:"Verified True", value:stats.real,  color:"#059669", bg:"#f0fdf4", border:"#bbf7d0", icon:"✅", pct:realPercent },
              { label:"Misleading",    value:stats.mislead,color:"#d97706",bg:"#fffbeb", border:"#fde68a", icon:"⚠️", pct:misleadPct },
            ].map(s => (
              <div key={s.label} style={{ background:s.bg, border:`1px solid ${s.border}`,
                borderRadius:16, padding:"16px 14px", textAlign:"center" }}>
                <div style={{ fontSize:22, marginBottom:6 }}>{s.icon}</div>
                <div style={{ fontSize:24, fontWeight:800, color:s.color,
                  fontFamily:"'Syne',sans-serif" }}>{s.value}</div>
                <div style={{ color:"#64748b", fontSize:11, marginTop:2 }}>{s.label}</div>
                {s.pct !== undefined && (
                  <div style={{ color:s.color, fontSize:12, fontWeight:600, marginTop:2 }}>{s.pct}%</div>
                )}
              </div>
            ))}
          </div>

          {/* Today's Meter */}
          {stats.total > 0 && (
            <div style={{ background:"#fff", border:"1px solid #e2e8f0", borderRadius:20,
              padding:"20px", marginBottom:20, boxShadow:"0 1px 3px rgba(0,0,0,0.04)" }}>
              <div style={{ color:"#64748b", fontSize:11, letterSpacing:"0.12em",
                fontFamily:"'JetBrains Mono',monospace", marginBottom:12 }}>TODAY'S BREAKDOWN</div>
              <div style={{ height:12, borderRadius:6, overflow:"hidden", display:"flex" }}>
                <div style={{ width:`${fakePercent}%`, background:"#ef4444", transition:"width 0.6s" }} />
                <div style={{ width:`${misleadPct}%`, background:"#f59e0b", transition:"width 0.6s" }} />
                <div style={{ width:`${realPercent}%`, background:"#10b981", transition:"width 0.6s" }} />
              </div>
              <div style={{ display:"flex", gap:16, marginTop:10, flexWrap:"wrap" }}>
                {[
                  { color:"#ef4444", label:`Fake ${fakePercent}%` },
                  { color:"#f59e0b", label:`Misleading ${misleadPct}%` },
                  { color:"#10b981", label:`True ${realPercent}%` },
                ].map(d => (
                  <div key={d.label} style={{ display:"flex", alignItems:"center", gap:6 }}>
                    <span style={{ width:10, height:10, borderRadius:"50%", background:d.color, display:"block" }} />
                    <span style={{ color:"#64748b", fontSize:12 }}>{d.label}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Filter Tabs */}
          <div style={{ display:"flex", gap:6, marginBottom:20, flexWrap:"wrap" }}>
            {[
              { id:"all",         label:"All" },
              { id:"false",       label:"❌ Fake" },
              { id:"misleading",  label:"⚠️ Misleading" },
              { id:"true",        label:"✅ True" },
            ].map(f => (
              <button key={f.id} onClick={() => handleFilter(f.id)}
                style={{ padding:"7px 16px", borderRadius:20, cursor:"pointer", fontSize:13,
                  border: filter===f.id ? "1px solid #10b981" : "1px solid #e2e8f0",
                  background: filter===f.id ? "#ecfdf5" : "#fff",
                  color: filter===f.id ? "#059669" : "#64748b",
                  fontWeight: filter===f.id ? 600 : 400 }}>
                {f.label}
              </button>
            ))}
          </div>

          {/* Items */}
          {loading ? (
            <div style={{ textAlign:"center", padding:"48px", color:"#94a3b8" }}>
              <div style={{ fontSize:32, marginBottom:12 }}>🔄</div>
              Loading trending...
            </div>
          ) : items.length === 0 ? (
            <div style={{ textAlign:"center", padding:"48px 20px",
              background:"#fff", border:"1px solid #e2e8f0", borderRadius:20 }}>
              <div style={{ fontSize:40, marginBottom:12 }}>📭</div>
              <p style={{ color:"#64748b", fontSize:15, marginBottom:16 }}>
                No checks yet today!
              </p>
              <Link href="/" style={{ display:"inline-block", padding:"10px 24px",
                background:"linear-gradient(135deg,#10b981,#0891b2)", borderRadius:12,
                color:"#fff", fontSize:13, fontWeight:700 }}>
                Be the first to check →
              </Link>
            </div>
          ) : (
            <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
              {items.map((item, idx) => {
                const vc = VC[item.verdict] || VC.MISLEADING;
                const userVote = votes[item.id];
                return (
                  <div key={item.id} style={{ background:"#fff", border:`1px solid ${vc.border}`,
                    borderLeft:`4px solid ${vc.color}`, borderRadius:16, padding:"16px 18px",
                    boxShadow:"0 1px 3px rgba(0,0,0,0.04)" }}>

                    <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", gap:12, marginBottom:10 }}>
                      <div style={{ display:"flex", alignItems:"center", gap:10, flexWrap:"wrap" }}>
                        {/* Rank */}
                        <span style={{ color:"#cbd5e1", fontSize:13, fontFamily:"'JetBrains Mono',monospace",
                          fontWeight:700, flexShrink:0 }}>#{idx+1}</span>
                        {/* Verdict badge */}
                        <span style={{ padding:"3px 12px", borderRadius:12, fontSize:12, fontWeight:700,
                          background:vc.bg, color:vc.color, border:`1px solid ${vc.border}` }}>
                          {vc.label}
                        </span>
                        {/* Confidence */}
                        <span style={{ color:"#94a3b8", fontSize:12,
                          fontFamily:"'JetBrains Mono',monospace" }}>
                          {item.confidence}%
                        </span>
                        {/* Type */}
                        <span style={{ color:"#94a3b8", fontSize:11 }}>
                          {item.type === "image" ? "🖼️" : item.type === "url" ? "🔗" : "📝"}
                        </span>
                      </div>
                      <span style={{ color:"#cbd5e1", fontSize:11, whiteSpace:"nowrap", flexShrink:0 }}>
                        {new Date(item.date).toLocaleTimeString("en-IN", { hour:"2-digit", minute:"2-digit" })}
                      </span>
                    </div>

                    {/* Snippet */}
                    <p style={{ color:"#475569", fontSize:13, lineHeight:1.5,
                      marginBottom:12, fontStyle:"italic" }}>
                      "{item.snippet}..."
                    </p>

                    {/* Community votes */}
                    <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                      <span style={{ color:"#94a3b8", fontSize:11 }}>Community:</span>
                      <button
                        onClick={() => handleVote(item.id, "agree")}
                        disabled={!!userVote}
                        style={{ display:"flex", alignItems:"center", gap:5, padding:"4px 12px",
                          background: userVote==="agree" ? "#ecfdf5" : "#f8fafc",
                          border: userVote==="agree" ? "1px solid #6ee7b7" : "1px solid #e2e8f0",
                          borderRadius:10, cursor: userVote ? "default" : "pointer",
                          color: userVote==="agree" ? "#059669" : "#64748b", fontSize:12 }}>
                        👍 {item.votes?.agree || 0}
                      </button>
                      <button
                        onClick={() => handleVote(item.id, "disagree")}
                        disabled={!!userVote}
                        style={{ display:"flex", alignItems:"center", gap:5, padding:"4px 12px",
                          background: userVote==="disagree" ? "#fef2f2" : "#f8fafc",
                          border: userVote==="disagree" ? "1px solid #fca5a5" : "1px solid #e2e8f0",
                          borderRadius:10, cursor: userVote ? "default" : "pointer",
                          color: userVote==="disagree" ? "#dc2626" : "#64748b", fontSize:12 }}>
                        👎 {item.votes?.disagree || 0}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* CTA */}
          <div style={{ textAlign:"center", marginTop:28 }}>
            <Link href="/" style={{ display:"inline-flex", alignItems:"center", gap:8,
              padding:"12px 28px", background:"linear-gradient(135deg,#10b981,#0891b2)",
              borderRadius:14, color:"#fff", fontSize:14, fontWeight:700 }}>
              🔍 Check News Now →
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
