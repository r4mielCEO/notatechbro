import { normalizePayload } from "../core/normalize.js";
import type { NormalizedAction } from "../core/types.js";

export function normalizeHermesPayload(payload: unknown): NormalizedAction {
  return normalizePayload(payload);
}
