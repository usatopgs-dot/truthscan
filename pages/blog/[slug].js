// pages/blog/[slug].js
import Link from "next/link";
import SEO from "../../components/SEO";

const POSTS = {
  "how-to-detect-fake-news": {
    title: "How to Detect Fake News Using AI in 2026",
    desc: "Learn how AI-powered tools can help you identify fake news, misinformation, and misleading content online.",
    date: "March 10, 2026",
    readTime: "5 min read",
    tags: ["Fake News", "AI", "Fact Check"],
    emoji: "🔍",
    content: `
## What is Fake News?

Fake news is false or misleading information presented as real news. It spreads rapidly on social media, WhatsApp, and other platforms — especially in India.

## Why is Fake News Dangerous?

Fake news can cause panic, spread hate, influence elections, and harm innocent people. In India alone, thousands of fake news stories circulate every day on WhatsApp groups.

## How AI Detects Fake News

Modern AI models can analyze text, images, and URLs to identify:

- **False claims** — statements that contradict verified facts
- **Misleading context** — real content used in a false context  
- **Manipulated images** — photos edited to change meaning
- **Old news** — past events presented as current news

## How to Use TruthScan

1. **Copy** the news text or URL
2. **Paste** it into TruthScan
3. **Click** Analyze Now
4. **Read** the AI verdict with reasons

TruthScan supports **Hindi, Punjabi, English, Urdu** and more languages — making it perfect for Indian users.

## 5 Tips to Spot Fake News

1. **Check the source** — Is it a trusted news outlet?
2. **Check the date** — Is it old news being recycled?
3. **Reverse image search** — Is the image from somewhere else?
4. **Read multiple sources** — Do other outlets report the same?
5. **Use TruthScan** — Let AI do the heavy lifting!

## Conclusion

AI-powered fact-checking tools like TruthScan make it easy to verify news in seconds. Bookmark [truthscan.frontendin.com](https://truthscan.frontendin.com) and check before you share!
    `
  },
  "whatsapp-fake-news-checker": {
    title: "How to Check WhatsApp Forwards Before Sharing",
    desc: "Stop spreading misinformation! Learn how to verify WhatsApp forwards using TruthScan in seconds.",
    date: "March 8, 2026",
    readTime: "4 min read",
    tags: ["WhatsApp", "Fake News", "India"],
    emoji: "📱",
    content: `
## The WhatsApp Fake News Problem

India has over 500 million WhatsApp users. Every day, millions of fake news messages are forwarded across groups — from health myths to political propaganda.

## Why People Forward Fake News

- They trust the sender (family/friends)
- The content looks real
- No easy way to verify quickly
- Emotional content spreads faster

## How to Check WhatsApp Forwards

### Method 1 — Copy & Paste (Easiest)
1. **Long press** the message in WhatsApp
2. **Copy** the text
3. Open **TruthScan** 
4. **Paste** in the Text tab
5. Click **Analyze Now**
6. Get instant AI verdict!

### Method 2 — Screenshot Check
1. **Take screenshot** of the WhatsApp message
2. Open **TruthScan**
3. Go to **Image tab**
4. Upload the screenshot
5. AI will analyze the content!

## What TruthScan Checks

✅ Is the claim true or false?  
✅ Is the source credible?  
✅ Is this old news being recycled?  
✅ Is the image manipulated?

## Conclusion

Before forwarding any WhatsApp message, spend 10 seconds on [TruthScan](https://truthscan.frontendin.com). Help stop the spread of fake news in India!
    `
  },
  "fake-news-india-2025": {
    title: "Top Fake News Stories in India — How to Stay Safe",
    desc: "Fake news is a growing problem in India. Here's how to identify and avoid misinformation.",
    date: "March 5, 2026",
    readTime: "6 min read",
    tags: ["India", "Misinformation", "Media"],
    emoji: "🇮🇳",
    content: `
## Fake News in India — A Growing Crisis

India ranks among the top countries for fake news circulation. With 500M+ WhatsApp users and 450M+ internet users, misinformation spreads at alarming speed.

## Common Types of Fake News in India

### 1. Health Misinformation
False cures, fake vaccine side effects, and medical myths spread rapidly — especially after COVID-19.

### 2. Political Propaganda  
Edited videos, fake quotes attributed to politicians, and misleading statistics during elections.

### 3. Religious Misinformation
Content designed to cause communal tension — one of the most dangerous categories.

### 4. Financial Scams
Fake government scheme announcements, lottery wins, and investment fraud.

### 5. Old News Recycled
Events from years ago presented as breaking news to cause panic.

## How to Protect Yourself

1. **Pause before sharing** — Ask yourself: "Is this really true?"
2. **Check the date** — Many viral stories are years old
3. **Verify the source** — Trusted sources matter
4. **Use fact-checkers** — Tools like TruthScan can help
5. **Report fake news** — Help protect your community

## TruthScan for Indian Users

TruthScan is built specifically with Indian users in mind:

- ✅ Supports Hindi, Punjabi, Urdu, Tamil, Telugu
- ✅ Includes Indian news source credibility scores
- ✅ Works on mobile and desktop
- ✅ Completely free

## Conclusion

Stay safe from fake news. Use [TruthScan](https://truthscan.frontendin.com) to verify any news before believing or sharing it.
    `
  }
};

function renderContent(content) {
  return content
    .trim()
    .split("\n")
    .map((line, i) => {
      if (line.startsWith("## ")) return <h2 key={i} style={{ fontSize:22, fontWeight:700, color:"#0f172a", margin:"28px 0 12px", fontFamily:"'Syne',sans-serif" }}>{line.slice(3)}</h2>;
      if (line.startsWith("### ")) return <h3 key={i} style={{ fontSize:18, fontWeight:600, color:"#1e293b", margin:"20px 0 8px" }}>{line.slice(4)}</h3>;
      if (line.startsWith("- ") || line.startsWith("* ")) return <li key={i} style={{ color:"#475569", fontSize:15, lineHeight:1.7, marginBottom:6, marginLeft:20 }}>{line.slice(2).replace(/\*\*(.*?)\*\*/g, "$1")}</li>;
      if (line.match(/^\d+\./)) return <li key={i} style={{ color:"#475569", fontSize:15, lineHeight:1.7, marginBottom:8, marginLeft:20 }}>{line.replace(/^\d+\.\s/, "")}</li>;
      if (line.startsWith("✅")) return <p key={i} style={{ color:"#475569", fontSize:15, lineHeight:1.7, marginBottom:6 }}>{line}</p>;
      if (line.trim() === "") return <br key={i} />;
      return <p key={i} style={{ color:"#475569", fontSize:15, lineHeight:1.8, marginBottom:12 }}>{line.replace(/\*\*(.*?)\*\*/g, "$1")}</p>;
    });
}

export default function BlogPost({ slug }) {
  const post = POSTS[slug];
  if (!post) return <div style={{ padding:40, textAlign:"center", color:"#64748b" }}>Post not found</div>;

  return (
    <>
      <SEO
        title={`${post.title} — TruthScan Blog`}
        description={post.desc}
        url={`https://truthscan.frontendin.com/blog/${slug}`}
        type="article"
        article={{ publishedTime: new Date(post.date).toISOString(), author: "TruthScan Team", tags: post.tags }}
      />

      <div style={{ minHeight:"100vh", background:"linear-gradient(135deg,#f0fdf9,#f0f9ff)", padding:"32px 16px 60px" }}>
        <div style={{ maxWidth:720, margin:"0 auto" }}>

          {/* Back */}
          <Link href="/blog" style={{ color:"#64748b", fontSize:13, display:"inline-flex", alignItems:"center", gap:6, marginBottom:24 }}>
            ← All Articles
          </Link>

          {/* Article header */}
          <div style={{ background:"#fff", border:"1px solid #e2e8f0", borderRadius:24, padding:"32px 28px", marginBottom:16, boxShadow:"0 1px 3px rgba(0,0,0,0.04)" }}>
            <div style={{ fontSize:40, marginBottom:16 }}>{post.emoji}</div>
            <h1 style={{ fontFamily:"'Syne',sans-serif", fontSize:28, fontWeight:800, color:"#0f172a", lineHeight:1.3, marginBottom:14 }}>
              {post.title}
            </h1>
            <div style={{ display:"flex", alignItems:"center", gap:12, flexWrap:"wrap", marginBottom:16 }}>
              <span style={{ color:"#94a3b8", fontSize:13 }}>{post.date}</span>
              <span style={{ color:"#e2e8f0" }}>·</span>
              <span style={{ color:"#94a3b8", fontSize:13 }}>{post.readTime}</span>
              <div style={{ display:"flex", gap:6 }}>
                {post.tags.map(tag => (
                  <span key={tag} style={{ padding:"2px 10px", borderRadius:10, background:"#f0fdf4", border:"1px solid #bbf7d0", color:"#059669", fontSize:11 }}>{tag}</span>
                ))}
              </div>
            </div>
            <p style={{ color:"#64748b", fontSize:16, lineHeight:1.7, borderLeft:"3px solid #10b981", paddingLeft:14 }}>
              {post.desc}
            </p>
          </div>

          {/* Article content */}
          <div style={{ background:"#fff", border:"1px solid #e2e8f0", borderRadius:24, padding:"32px 28px", marginBottom:16, boxShadow:"0 1px 3px rgba(0,0,0,0.04)" }}>
            {renderContent(post.content)}
          </div>

          {/* CTA */}
          <div style={{ background:"linear-gradient(135deg,#ecfdf5,#f0f9ff)", border:"1px solid #a7f3d0", borderRadius:20, padding:24, textAlign:"center" }}>
            <div style={{ fontSize:32, marginBottom:12 }}>🛡️</div>
            <h3 style={{ color:"#065f46", fontSize:18, fontWeight:700, fontFamily:"'Syne',sans-serif", marginBottom:8 }}>
              Try TruthScan Now — It's Free!
            </h3>
            <p style={{ color:"#64748b", fontSize:14, marginBottom:16 }}>
              Check any news in seconds. No signup needed.
            </p>
            <Link href="/" style={{ display:"inline-block", padding:"11px 28px",
              background:"linear-gradient(135deg,#10b981,#0891b2)", borderRadius:12,
              color:"#fff", fontSize:13, fontWeight:700 }}>
              Check News Now →
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}

export async function getStaticPaths() {
  return {
    paths: Object.keys(POSTS).map(slug => ({ params: { slug } })),
    fallback: false
  };
}

export async function getStaticProps({ params }) {
  return { props: { slug: params.slug } };
}
