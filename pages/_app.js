import "../styles/globals.css";
import { useEffect } from "react";
import { useRouter } from "next/router";
import SEO from "../components/SEO";

// ── Google Analytics ──────────────────────────────────────────────
const GA_ID = process.env.NEXT_PUBLIC_GA_ID; // Add in Vercel env vars

function trackPageView(url) {
  if (!GA_ID || typeof window === "undefined") return;
  window.gtag?.("config", GA_ID, { page_path: url });
}

export default function App({ Component, pageProps }) {
  const router = useRouter();

  useEffect(() => {
    // ✅ Register Service Worker (PWA)
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }

    // ✅ Track page views on route change
    const handleRouteChange = (url) => trackPageView(url);
    router.events.on("routeChangeComplete", handleRouteChange);
    return () => router.events.off("routeChangeComplete", handleRouteChange);
  }, [router.events]);

  return (
    <>
      <SEO />

      {/* ✅ Google Analytics Script */}
      {GA_ID && (
        <>
          <script async src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`} />
          <script dangerouslySetInnerHTML={{ __html: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${GA_ID}', { page_path: window.location.pathname });
          `}} />
        </>
      )}

      <Component {...pageProps} />
    </>
  );
}
