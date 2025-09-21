const SHORTCODE_PATTERN = /\[[a-z0-9_-]+(?: [^\]]*)?\]/gi;

/**
 * Remove inline shortcodes like [cta-button] from snippets while leaving the
 * surrounding text untouched. Original document text should remain unmodified
 * elsewhere – use this helper only for user-facing snippets.
 */
export function stripShortcodes(input: string): string {
  return input.replace(SHORTCODE_PATTERN, "").replace(/\s{2,}/g, " ").trim();
}
