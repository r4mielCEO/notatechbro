const MAX_INLINE_LENGTH = 200;

/** Keep hook-controlled text on one readable terminal line. */
export function inlineCode(value: string): string {
  const clean = value
    .replace(/[\u0000-\u001f\u007f-\u009f]/g, " ")
    .replace(/`/g, "'")
    .replace(/\s+/g, " ")
    .trim();
  const shortened = clean.length > MAX_INLINE_LENGTH ? `${clean.slice(0, MAX_INLINE_LENGTH - 1)}…` : clean;
  return `\`${shortened}\``;
}
