/** Helpers for the raw bandage message log. Browser- and server-safe. */
export type DevicePayload = Record<string, unknown>;

/** Keys whose value differs from the previous message (new keys count as changed). */
export function changedKeys(prev: DevicePayload | null, cur: DevicePayload): string[] {
  const keys = new Set([...Object.keys(cur), ...(prev ? Object.keys(prev) : [])]);
  return [...keys].filter((k) => !prev || JSON.stringify(prev[k]) !== JSON.stringify(cur[k]));
}

/** Turn any text from the bandage into a payload; text that isn't a JSON object is kept verbatim. */
export function toPayload(text: string): DevicePayload {
  try {
    const v: unknown = JSON.parse(text);
    if (v && typeof v === "object" && !Array.isArray(v)) return v as DevicePayload;
    return { value: v };
  } catch {
    return { unparsed_text: text };
  }
}
