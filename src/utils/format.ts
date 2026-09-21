// No currency symbol — the ₹ sign broke when exported CSVs were opened in
// Excel (encoding mismatch), so amounts are plain numbers everywhere,
// including on-screen, to keep the UI and CSV exports consistent.
export function fmtMoney(n: number | null | undefined): string {
  return Number(n || 0).toFixed(2);
}
