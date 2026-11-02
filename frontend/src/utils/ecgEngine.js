// =============================================================
//  ECG Waveform Generation Engine
//  Generates realistic PQRST waveform cycle matching original math
// =============================================================

export function generateECGCycle(N = 320) {
  const g = (t, mu, sigma) => Math.exp(-0.5 * ((t - mu) / sigma) ** 2);
  const pts = new Float32Array(N);

  for (let i = 0; i < N; i++) {
    const t = i / N;
    let y = 0;
    y += g(t, 0.10, 0.014) * 0.18; // P wave
    y -= g(t, 0.27, 0.007) * 0.13; // Q dip
    y += g(t, 0.32, 0.013) * 1.00; // R spike
    y -= g(t, 0.38, 0.009) * 0.24; // S dip
    y += g(t, 0.56, 0.046) * 0.30; // T wave
    pts[i] = y;
  }

  return pts;
}

