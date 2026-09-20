import crypto from "crypto";

/**
 * Generates a high-entropy, single-use checkout token for loyalty scans.
 */
export function generateCheckoutToken(): { rawToken: string; tokenHash: string } {
  const rawToken = crypto.randomBytes(24).toString("hex");
  const tokenHash = hashToken(rawToken);
  return { rawToken, tokenHash };
}

/**
 * Computes the SHA-256 hash of a checkout token.
 */
export function hashToken(rawToken: string): string {
  return crypto.createHash("sha256").update(rawToken).digest("hex");
}
