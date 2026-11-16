/**
 * Only allow same-site relative paths as a post-login destination,
 * so a crafted ?next= link cannot send users to another site.
 */
export function safeNextPath(value: string | null | undefined, fallback = "/dashboard") {
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.startsWith("/\\")) {
    return fallback;
  }
  return value;
}
