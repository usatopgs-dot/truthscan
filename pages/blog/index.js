// pages/blog/index.js
import Link from "next/link";
import SEO from "../../components/SEO";

const POSTS = [
  {
    slug: "how-to-detect-fake-news",
    title: "How to Detect Fake News Using AI in 2026",
    desc: "Learn how AI-powered tools can help you identify fake news, misinformation, and misleading content online.",
    date: "March 10, 2026",
    readTime: "5 min read",
    tags: ["Fake News", "AI", "Fact Check"],
    emoji: "🔍"
  },
  {
    slug: "whatsapp-fake-news-checker",
    title: "How to Check WhatsApp Forwards Before Sharing",
    desc: "Stop spreading misinformation! Learn how to verify WhatsApp forwards using TruthScan in seconds.",
    date: "March 8, 2026",
    readTime: "4 min read",
    tags: ["WhatsApp", "Fake News", "India"],
    emoji: "📱"
  },
  {
    slug: "fake-news-india-2025",
    title: "Top Fake News Stories in India — How to Stay Safe",
    desc: "Fake news is a growing problem in India. Here's how to identify and avoid misinformation.",
    date: "March 5, 2026",
    readTime: "6 min read",
    tags: ["India", "Misinformation", "Media"],
    emoji: "🇮🇳"
  },
];

export default function Blog() {
  return (
    <>
      <SEO
        title="Blog — TruthScan | Fake News Tips & Guides"
        description="Learn how to detect fake news, verify WhatsApp forwards, and stay safe from misinformation in India."
        url="https://truthscan.frontendin.com/blog"
      />

      <div style={{ minHeight:"100vh", background:"linear-gradient(135deg,#f0fdf9,#f0f9ff)", padding:"32px 16px 60px" }}>
        <div style={{ maxWidth:720, margin:"0 auto" }}>

          {/* Header */}
          <div style={{ marginBottom:36 }}>
            <Link href="/" style={{ color:"#64748b", fontSize:13, display:"inline-flex", alignItems:"center", gap:6, marginBottom:20 }}>
              ← Back to TruthScan
            </Link>
            <h1 style={{ fontFamily:"'Syne',sans-serif", fontSize:34, fontWeight:800, color:"#0f172a", marginBottom:8 }}>
              📝 Blog
            </h1>
            <p style={{ color:"#64748b", fontSize:15 }}>
              Tips, guides, and news about fact-checking and misinformation
            </p>
          </div>

          {/* Posts */}
          {POSTS.map(post => (
            <Link key={post.slug} href={`/blog/${post.slug}`}
              style={{ display:"block", textDecoration:"none", marginBottom:16 }}>
              <div style={{ background:"#fff", border:"1px solid #e2e8f0", borderRadius:20,
                padding:24, transition:"all 0.2s",
                boxShadow:"0 1px 3px rgba(0,0,0,0.04)" }}
                onMouseOver={e => { e.currentTarget.style.borderColor="#10b981"; e.currentTarget.style.boxShadow="0 4px 20px rgba(16,185,129,0.1)"; }}
                onMouseOut={e => { e.currentTarget.style.borderColor="#e2e8f0"; e.currentTarget.style.boxShadow="0 1px 3px rgba(0,0,0,0.04)"; }}>

                <div style={{ display:"flex", gap:16, alignItems:"flex-start" }}>
                  <div style={{ fontSize:36, flexShrink:0 }}>{post.emoji}</div>
                  <div style={{ flex:1 }}>
                    <h2 style={{ color:"#0f172a", fontSize:18, fontWeight:700,
                      fontFamily:"'Syne',sans-serif", marginBottom:8, lineHeight:1.4 }}>
                      {post.title}
                    </h2>
                    <p style={{ color:"#64748b", fontSize:14, lineHeight:1.6, marginBottom:12 }}>
                      {post.desc}
                    </p>
                    <div style={{ display:"flex", alignItems:"center", gap:12, flexWrap:"wrap" }}>
                      <span style={{ color:"#94a3b8", fontSize:12 }}>{post.date}</span>
                      <span style={{ color:"#94a3b8", fontSize:12 }}>·</span>
                      <span style={{ color:"#94a3b8", fontSize:12 }}>{post.readTime}</span>
                      <div style={{ display:"flex", gap:6 }}>
                        {post.tags.map(tag => (
                          <span key={tag} style={{ padding:"2px 10px", borderRadius:10,
                            background:"#f0fdf4", border:"1px solid #bbf7d0",
                            color:"#059669", fontSize:11, fontWeight:500 }}>
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </>
  );
}
