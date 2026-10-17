import path from "path";
import type { NextConfig } from "next";

const supabaseHost = (() => {
  try {
    return new URL(process.env.NEXT_PUBLIC_SUPABASE_URL || "https://wiugpsnngyponfwtlvnj.supabase.co").hostname;
  } catch {
    return "wiugpsnngyponfwtlvnj.supabase.co";
  }
})();

const supabaseOrigin = `https://${supabaseHost}`;

// Report-Only first: browsers log violations without blocking anything. Switch the header key to
// "Content-Security-Policy" once the console shows no violations on real pages.
const cspReportOnly = [
  "default-src 'self'",
  // Next.js inlines its bootstrap scripts (no nonces here); dev mode also needs eval for fast refresh
  `script-src 'self' 'unsafe-inline'${process.env.NODE_ENV === "development" ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' data: https://fonts.gstatic.com",
  `img-src 'self' data: blob: ${supabaseOrigin}`,
  `connect-src 'self' ${supabaseOrigin} wss://${supabaseHost}`,
  // Menu PDFs are shown in an iframe from our storage
  `frame-src 'self' ${supabaseOrigin}`,
  "frame-ancestors 'none'",
  // Google sign-in posts to NextAuth, which redirects to Google
  "form-action 'self' https://accounts.google.com",
  "base-uri 'self'",
  "object-src 'none'",
].join("; ");

const nextConfig: NextConfig = {
  outputFileTracingRoot: path.join(__dirname),
  reactStrictMode: true,
  transpilePackages: ["framer-motion", "motion"],
  experimental: {
    optimizePackageImports: ["lucide-react"],
  },
  images: {
    // Only optimise images from our own Supabase Storage bucket (no open fetch proxy)
    remotePatterns: [
      {
        protocol: "https",
        hostname: supabaseHost,
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(self), microphone=(), geolocation=()",
          },
          {
            key: "Content-Security-Policy-Report-Only",
            value: cspReportOnly,
          },
        ],
      },
      {
        source: "/api/restaurants/(.*)/wifi",
        headers: [
          {
            key: "X-Robots-Tag",
            value: "noindex, nofollow",
          },
        ],
      },
      {
        source: "/r/(.*)/wifi",
        headers: [
          {
            key: "X-Robots-Tag",
            value: "noindex, nofollow",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
