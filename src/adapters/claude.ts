import { normalizePayload } from "../core/normalize.js";
import type { NormalizedAction } from "../core/types.js";

export function normalizeClaudePayload(payload: unknown): NormalizedAction {
  return normalizePayload(payload);
}
