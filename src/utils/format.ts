export function fmtMoney(n: number | null | undefined): string {
  return `$${Number(n || 0).toFixed(2)}`;
}
