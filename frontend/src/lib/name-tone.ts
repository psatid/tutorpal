export type NameTone = "indigo" | "orange" | "cyan";

const tones: readonly NameTone[] = ["indigo", "orange", "cyan"];

/** Keep display colors stable when names differ only by Unicode form or spacing. */
export function getNameTone(name: string): NameTone {
  const normalized = name
    .normalize("NFC")
    .trim()
    .replace(/\s+/gu, " ")
    .toLowerCase();
  if (!normalized) return "indigo";

  let hash = 2166136261;
  for (const character of normalized) {
    hash = Math.imul(hash ^ character.codePointAt(0)!, 16777619) >>> 0;
  }
  hash ^= hash >>> 16;
  hash = Math.imul(hash, 0x85ebca6b);
  hash ^= hash >>> 13;
  hash = Math.imul(hash, 0xc2b2ae35);
  hash ^= hash >>> 16;
  return tones[(hash >>> 0) % tones.length] ?? "indigo";
}

export const nameToneAvatarClasses: Record<NameTone, string> = {
  indigo: "bg-[#533AFD] text-white",
  orange: "bg-[#A85800] text-white",
  cyan: "bg-[#08769B] text-white",
};

export const nameToneAccentClasses: Record<NameTone, string> = {
  indigo: "bg-[#533AFD]",
  orange: "bg-[#F79303]",
  cyan: "bg-[#17B5F3]",
};
