// Perhitungan skor akhir observasi.
// Rumus: Σ(skor × bobot) / (scaleMax × Σbobot) × 100  -> nilai 0..100

export type ScoredItem = { weight: number; score: number };

export function computeFinalScore(
  items: ScoredItem[],
  scaleMax: number,
): number {
  const totalWeight = items.reduce((sum, it) => sum + it.weight, 0);
  if (totalWeight === 0 || scaleMax === 0) return 0;

  const weighted = items.reduce((sum, it) => sum + it.score * it.weight, 0);
  const final = (weighted / (scaleMax * totalWeight)) * 100;
  return Math.round(final * 10) / 10; // 1 angka di belakang koma
}

export function scoreCategory(finalScore: number): {
  label: string;
  color: string;
} {
  if (finalScore >= 86) return { label: "Sangat Baik", color: "green" };
  if (finalScore >= 71) return { label: "Baik", color: "blue" };
  if (finalScore >= 56) return { label: "Cukup", color: "yellow" };
  return { label: "Perlu Pembinaan", color: "red" };
}
