// A compact colour palette and utilities for choropleth legends and styling

export const palette: string[] = [
  // 5-step sequential palette suitable on light backgrounds
  // From light to dark for increasing value
  "#dbeafe", // light
  "#93c5fd",
  "#60a5fa",
  "#3b82f6",
  "#1d4ed8", // dark
];

export const noDataColor: string = "#6b7280"; // dark grey

// Returns k-1 thresholds for k quantile classes (default k=5 gives 4 thresholds)
export function quantileBreaks(values: number[], k: number = 5): number[] {
  if (!Array.isArray(values) || values.length === 0) return [0, 0, 0, 0].slice(0, Math.max(0, k - 1));

  const filtered = values.filter((v) => Number.isFinite(v)).sort((a, b) => a - b);
  if (filtered.length === 0) return [0, 0, 0, 0].slice(0, Math.max(0, k - 1));

  const quantile = (p: number): number => {
    const n = filtered.length;
    if (n === 1) return filtered[0];
    const idx = (n - 1) * p;
    const lo = Math.floor(idx);
    const hi = Math.ceil(idx);
    const h = idx - lo;
    const a = filtered[lo];
    const b = filtered[hi];
    return a + (b - a) * h;
  };

  const thresholds: number[] = [];
  for (let i = 1; i < k; i += 1) {
    thresholds.push(quantile(i / k));
  }
  return thresholds;
}


