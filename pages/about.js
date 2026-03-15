// pages/about.js
import Link from "next/link";
import SEO from "../components/SEO";

export default function About() {
  return (
    <>
      <SEO
        title="About TruthScan — AI Fake News Detector"
        description="TruthScan is a free AI-powered fake news detector built for Indian users. Learn about our mission and how we work."
        url="https://truthscan.frontendin.com/about"
      />
      <Page title="About TruthScan" emoji="🛡️">
        <Section title="What is TruthScan?">
          TruthScan is a free AI-powered fact-checking tool built for Indian users. It helps you verify news, WhatsApp forwards, images, and URLs in seconds — before you believe or share them.
        </Section>
        <Section title="Our Mission">
          Fake news is a serious problem in India. Our mission is to give every person — regardless of language or tech knowledge — a simple, free tool to verify information instantly.
        </Section>
        <Section title="How It Works">
          TruthScan uses advanced AI models (Groq and Google Gemini) to analyze text, URLs, and images. It checks for false claims, misleading context, manipulated images, and recycled old news. Results include a verdict (TRUE / FALSE / MISLEADING), confidence score, source credibility rating, and detailed analysis points.
        </Section>
        <Section title="Languages Supported">
          TruthScan supports English, Hindi (हिंदी), Punjabi (ਪੰਜਾਬੀ), Urdu, Tamil, Telugu, Bengali, Marathi, Gujarati, and more.
        </Section>
        <Section title="Is It Free?">
          Yes! TruthScan is 100% free to use. Every user gets 5 free checks per day using our server. For unlimited checks, users can add their own free Gemini API key from Google AI Studio.
        </Section>
        <Section title="Who Built This?">
          TruthScan is built and maintained by the team at <a href="https://frontendin.com" style={{ color:"#059669" }}>frontendin.com</a> — a platform dedicated to useful web tools for Indian users.
        </Section>
        <FooterLinks />
      </Page>
    </>
  );
}

// ── Shared components ────────────────────────────────────────────
export function Page({ title, emoji, children }) {
  return (
    <div style={{ minHeight:"100vh", background:"linear-gradient(135deg,#f0fdf9,#f0f9ff)", padding:"32px 16px 60px" }}>
      <div style={{ maxWidth:720, margin:"0 auto" }}>
        <Link href="/" style={{ color:"#64748b", fontSize:13, display:"inline-block", marginBottom:20 }}>← TruthScan</Link>
        <div style={{ background:"#fff", border:"1px solid #e2e8f0", borderRadius:24, padding:"32px 28px", boxShadow:"0 1px 3px rgba(0,0,0,0.04)" }}>
          <div style={{ fontSize:40, marginBottom:14 }}>{emoji}</div>
          <h1 style={{ fontFamily:"'Syne',sans-serif", fontSize:28, fontWeight:800, color:"#0f172a", marginBottom:24 }}>{title}</h1>
          {children}
        </div>
      </div>
    </div>
  );
}

export function Section({ title, children }) {
  return (
    <div style={{ marginBottom:24 }}>
      <h2 style={{ fontFamily:"'Syne',sans-serif", fontSize:17, fontWeight:700, color:"#0f172a", marginBottom:8 }}>{title}</h2>
      <p style={{ color:"#475569", fontSize:15, lineHeight:1.8 }}>{children}</p>
    </div>
  );
}

export function FooterLinks() {
  const links = [
    { href:"/about",          label:"About" },
    { href:"/disclaimer",     label:"Disclaimer" },
    { href:"/privacy-policy", label:"Privacy Policy" },
    { href:"/terms",          label:"Terms & Conditions" },
  ];
  return (
    <div style={{ borderTop:"1px solid #e2e8f0", paddingTop:20, marginTop:8, display:"flex", gap:16, flexWrap:"wrap" }}>
      {links.map(l => (
        <Link key={l.href} href={l.href} style={{ color:"#0891b2", fontSize:13 }}>{l.label}</Link>
      ))}
    </div>
  );
}
