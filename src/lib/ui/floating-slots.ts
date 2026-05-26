export const SLOT_IDS = {
  topRight: "phonara-floating-top-right",
  bottomRight: "phonara-floating-bottom-right",
  bottomLeft: "phonara-floating-bottom-left",
} as const;

export type SlotKey = keyof typeof SLOT_IDS;

export const Z = {
  badge: 50,
  hud: 60,
  modal: 100,
} as const;

export function getSlotElement(slot: SlotKey) {
  if (typeof document === "undefined") return null;
  return document.getElementById(SLOT_IDS[slot]);
}
