export function escapeRegExp(str: string) {
  return String(str).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
