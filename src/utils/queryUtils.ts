export function generatePgParameters(arr: unknown[]) {
  return arr.map((_, i) => `$${i + 1}`).join(', ');
}
export function generatePairedPgParameters(arr: unknown[]) {
  return arr.map((_, i) => `($${2 * i + 1}, $${2 * i + 2})`).join(', ');
}
