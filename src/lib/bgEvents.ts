export type BgEventType = "send" | "tbr-add" | "generating-start" | "generating-end";

export function triggerBgEffect(type: BgEventType) {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("quilla-bg-effect", { detail: { type } }));
  }
}
