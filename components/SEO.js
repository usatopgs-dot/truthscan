// components/SEO.js
// ✅ Meta Tags + Open Graph + Schema Markup — ਸਭ ਇੱਕੋ ਥਾਂ

import Head from "next/head";

export default function SEO({
  title = "TruthScan — Free AI Fake News Detector",
  description = "Check if news is real or fake using AI. Supports Hindi, Punjabi, English, Urdu. 100% Free. No signup needed.",
  url = "https://truthscan.frontendin.com",
  image = "https://truthscan.frontendin.com/og-image.png",
  type = "website",
  article = null // { publishedTime, author, tags }
}) {
  const siteName = "TruthScan";
  const twitterHandle = "@truthscan";

  // Schema Markup — WebApplication
  const schemaWebApp = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "name": "TruthScan",
    "url": "https://truthscan.frontendin.com",
    "description": description,
    "applicationCategory": "UtilitiesApplication",
    "operatingSystem": "Any",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "USD"
    },
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "4.8",
      "ratingCount": "150"
    },
    "featureList": [
      "AI-powered fake news detection",
      "Supports Hindi, Punjabi, English, Urdu",
      "URL article checker",
      "Image manipulation detector",
      "Source credibility score",
      "Free to use"
    ]
  };

  // Schema — BreadcrumbList
  const schemaBreadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "TruthScan",
        "item": "https://truthscan.frontendin.com"
      }
    ]
  };

  // Schema — Article (only for blog pages)
  const schemaArticle = article ? {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": title,
    "description": description,
    "url": url,
    "image": image,
    "datePublished": article.publishedTime,
    "author": {
      "@type": "Person",
      "name": article.author || "TruthScan Team"
    },
    "publisher": {
      "@type": "Organization",
      "name": "TruthScan",
      "url": "https://truthscan.frontendin.com"
    }
  } : null;

  return (
    <Head>
      {/* ── Basic Meta ── */}
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content="fake news detector, fact checker india, news checker, AI fact check, hindi fake news checker, punjabi news check, whatsapp fake news, fake news detector india 2026, news verify india" />
      <meta name="author" content="TruthScan" />
      <meta name="robots" content="index, follow" />
      <link rel="canonical" href={url} />

      {/* ── Open Graph (Facebook, WhatsApp, LinkedIn) ── */}
      <meta property="og:type" content={type} />
      <meta property="og:site_name" content={siteName} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={url} />
      <meta property="og:image" content={image} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:locale" content="en_IN" />
      <meta property="og:locale:alternate" content="hi_IN" />
      <meta property="og:locale:alternate" content="pa_IN" />
      {article && <meta property="article:published_time" content={article.publishedTime} />}
      {article?.tags?.map(tag => <meta key={tag} property="article:tag" content={tag} />)}

      {/* ── Twitter Card ── */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:site" content={twitterHandle} />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />

      {/* ── WhatsApp specific ── */}
      <meta property="og:image:type" content="image/png" />

      {/* ── Schema Markup ── */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaWebApp) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaBreadcrumb) }}
      />
      {schemaArticle && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaArticle) }}
        />
      )}
    </Head>
  );
}
