/** @type {import('next').NextConfig} */
const nextConfig = {
  // ✅ Compress all responses
  compress: true,

  // ✅ Optimize images
  images: {
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 60,
  },

  // ✅ Cache headers for speed
  async headers() {
    return [
      {
        source: "/sw.js",
        headers: [{ key: "Cache-Control", value: "public, max-age=0, must-revalidate" }],
      },
      {
        source: "/:all*(svg|jpg|png|webp|avif|ico|woff2)",
        headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
      },
      {
        source: "/sitemap.xml",
        headers: [{ key: "Cache-Control", value: "public, max-age=3600" }],
      },
    ];
  },

  // ✅ Powered by header remove
  poweredByHeader: false,
};

module.exports = nextConfig;
