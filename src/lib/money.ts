export function formatZAR(amount: number | string): string {
  const n = typeof amount === "string" ? parseFloat(amount) : amount;
  return `R ${n.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, " ")}`;
}

export const round2 = (n: number) => Math.round(n * 100) / 100;

export const VAT_RATE = 0.15;

export function calcVat(inclusiveAmount: number) {
  const vat = round2((inclusiveAmount * VAT_RATE) / (1 + VAT_RATE));
  const net = round2(inclusiveAmount - vat);
  return { net, vat, total: inclusiveAmount };
}
