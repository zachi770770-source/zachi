import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV === "development";

/**
 * CSP ללא nonce, כדי לשמר Static Generation (עמודי השיווק נשארים
 * מהירים וניתנים ל-cache). 'unsafe-inline' ב-script-src נדרש עבור
 * סקריפטי האתחול הקצרים של GTM/GA/Meta Pixel שנטענים דרך next/script
 * רק לאחר הסכמת עוגיות. הדומיינים המורשים מוגבלים לספקי האנליטיקה
 * הנתמכים בלבד - ראו src/components/analytics/AnalyticsScripts.tsx.
 */
const cspHeader = `
  default-src 'self';
  script-src 'self' 'unsafe-inline' https://www.googletagmanager.com https://connect.facebook.net${isDev ? " 'unsafe-eval'" : ""};
  style-src 'self' 'unsafe-inline';
  img-src 'self' data: blob: https://www.google-analytics.com https://www.facebook.com;
  font-src 'self' data:;
  connect-src 'self' https://www.google-analytics.com https://analytics.google.com https://www.googletagmanager.com;
  object-src 'none';
  base-uri 'self';
  form-action 'self';
  frame-ancestors 'none';
  upgrade-insecure-requests;
`
  .replace(/\s{2,}/g, " ")
  .trim();

const securityHeaders = [
  { key: "Content-Security-Policy", value: cspHeader },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
];

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
