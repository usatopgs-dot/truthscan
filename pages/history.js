import { useState, useEffect } from "react";
import Head from "next/head";
import Link from "next/link";

const VC = {
  TRUE:        { color: "#00e676", label: "✅ TRUE"        },
  FALSE:       { color: "#ff1744", label: "❌ FALSE"        },
  MISLEADING:  { color: "#ff9100", label: "⚠️ MISLEADING"  },
  REAL:        { color: "#00e676", label: "✅ REAL"         },
  FAKE:        { color: "#ff1744", label: "❌ FAKE"         },
  MANIPULATED: { color: "#ff9100", label: "🖼️ MANIPULATED" },
};

const TYPE_ICON = { text: "📝", url: "🔗", image: "🖼️" };

export default function History() {
  const [history, setHistory] = useState([]);
  const [filter, setFilter]   = useState("all"); // all | TRUE | FALSE | MISLEADING

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("ts_history") || "[]");
      setHistory(saved);
    } catch {}
  }, []);

  const clearHistory = () => {
    if (confirm("Clear all history?")) {
      localStorage.removeItem("ts_history");
      setHistory([]);
    }
  };

  const filtered = filter === "all"
    ? history
    : history.filter(h => h.result?.verdict === filter);

  const formatDate = (iso) => {
    try {
      return new Date(iso).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
    } catch { return ""; }
  };

  return (
    <>
      <Head>
        <title>History — TruthScan</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link href="https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
        <style>{`* { margin:0; padding:0; box-sizing:border-box; } body { background:#080810; }`}</style>
      </Head>

      <div style={{ minHeight: "100vh", background: "#080810", fontFamily: "'Inter',sans-serif", padding: "28px 16px" }}>
        <div style={{ maxWidth: 660, margin: "0 auto" }}>

          {/* Header */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 28, flexWrap: "wrap", gap: 12 }}>
            <div>
              <Link href="/" style={{ color: "#444", fontSize: 12, textDecoration: "none" }}>← Back</Link>
              <h1 style={{
                fontFamily: "'Space Mono',monospace", fontSize: 22, fontWeight: 700,
                color: "#fff", letterSpacing: 3, textTransform: "uppercase", marginTop: 8
              }}>📋 Check History</h1>
              <p style={{ color: "#444", fontSize: 12, marginTop: 4 }}>{history.length} checks total</p>
            </div>
            {history.length > 0 && (
              <button onClick={clearHistory} style={{
                padding: "8px 16px", background: "rgba(255,23,68,0.08)",
                border: "1px solid rgba(255,23,68,0.2)", borderRadius: 8,
                color: "#ff4466", fontSize: 12, cursor: "pointer"
              }}>
                🗑️ Clear All
              </button>
            )}
          </div>

          {/* Filter tabs */}
          {history.length > 0 && (
            <div style={{ display: "flex", gap: 6, marginBottom: 20, flexWrap: "wrap" }}>
              {["all", "TRUE", "FALSE", "MISLEADING"].map(f => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  style={{
                    padding: "6px 14px", borderRadius: 20,
                    border: filter === f ? "1px solid #00aaff" : "1px solid #1e1e30",
                    background: filter === f ? "rgba(0,170,255,0.1)" : "transparent",
                    color: filter === f ? "#00aaff" : "#444",
                    fontSize: 12, cursor: "pointer"
                  }}
                >
                  {f === "all" ? "All" : VC[f]?.label || f}
                </button>
              ))}
            </div>
          )}

          {/* Empty state */}
          {history.length === 0 && (
            <div style={{ textAlign: "center", padding: "60px 20px" }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>📭</div>
              <p style={{ color: "#444", fontSize: 15, marginBottom: 20 }}>No checks yet</p>
              <Link href="/" style={{
                display: "inline-block", padding: "10px 24px",
                background: "linear-gradient(135deg,#00aaff,#0055ff)",
                borderRadius: 8, color: "#fff", fontSize: 13,
                textDecoration: "none", fontFamily: "'Space Mono',monospace", letterSpacing: 2
              }}>
                CHECK NEWS NOW →
              </Link>
            </div>
          )}

          {/* History list */}
          {filtered.map((item, i) => {
            const vc = VC[item.result?.verdict];
            return (
              <div key={i} style={{
                background: "rgba(255,255,255,0.02)",
                border: `1px solid ${vc?.color || "#1e1e30"}15`,
                borderLeft: `3px solid ${vc?.color || "#333"}`,
                borderRadius: 12, padding: "16px 18px",
                marginBottom: 10
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8, marginBottom: 8 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 14 }}>{TYPE_ICON[item.type] || "📝"}</span>
                    <span style={{ color: vc?.color || "#888", fontSize: 13, fontWeight: 700, fontFamily: "'Space Mono',monospace" }}>
                      {vc?.label || item.result?.verdict}
                    </span>
                    <span style={{
                      background: `${vc?.color}20`, color: vc?.color,
                      fontSize: 10, padding: "2px 8px", borderRadius: 10, fontWeight: 700
                    }}>
                      {item.result?.confidence}%
                    </span>
                  </div>
                  <span style={{ color: "#333", fontSize: 11, whiteSpace: "nowrap" }}>{formatDate(item.date)}</span>
                </div>

                {/* Input preview */}
                <p style={{ color: "#555", fontSize: 12, marginBottom: 8, fontFamily: "monospace", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {item.type === "image" ? `🖼️ ${item.input}` : item.input?.slice(0, 80) + (item.input?.length > 80 ? "..." : "")}
                </p>

                {/* Summary */}
                <p style={{ color: "#888", fontSize: 13, lineHeight: 1.5 }}>
                  {item.result?.summary}
                </p>
              </div>
            );
          })}

          {filtered.length === 0 && history.length > 0 && (
            <div style={{ textAlign: "center", padding: "40px", color: "#444", fontSize: 14 }}>
              No results for this filter
            </div>
          )}
        </div>
      </div>
    </>
  );
}
