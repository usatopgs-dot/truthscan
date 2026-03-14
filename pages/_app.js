import "../styles/globals.css";
import { useEffect } from "react";
import Head from "next/head";

export default function App({ Component, pageProps }) {
  useEffect(() => {
    // Register Service Worker for PWA
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
  }, []);

  return (
    <>
      <Head>
        {/* PWA Meta Tags */}
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#00d4ff" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="TruthScan" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
        <meta name="application-name" content="TruthScan" />
        <meta name="description" content="AI-powered fake news detector. Check any news in seconds." />
      </Head>
      <Component {...pageProps} />
    </>
  );
}
