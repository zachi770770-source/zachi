const DEFAULT_REDIRECT = "/dashboard";

/**
 * Sanitises a post-auth redirect target.
 * Allows only internal absolute paths ("/dashboard", "/journal?x=1").
 * Rejects external URLs, protocol-relative ("//evil.com") and anything
 * that does not start with a single "/". Falls back to /dashboard.
 */
export function safeRedirect(
  target: string | null | undefined,
  fallback: string = DEFAULT_REDIRECT,
): string {
  if (!target) return fallback;
  // Must start with exactly one "/" (internal path), not "//" or "/\".
  if (!target.startsWith("/")) return fallback;
  if (target.startsWith("//") || target.startsWith("/\\")) return fallback;
  // Guard against backslash tricks that some browsers treat as "/".
  if (target.includes("\\")) return fallback;
  return target;
}
