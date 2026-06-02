export function formatMET(totalSeconds: number): string {
  const d = Math.floor(totalSeconds / 86400);
  const h = Math.floor((totalSeconds % 86400) / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  return `${d}:${pad(h)}:${pad(m)}`;
}

export function formatUTC(): string {
  const now = new Date();
  return `${pad(now.getUTCHours())}:${pad(now.getUTCMinutes())}:${pad(now.getUTCSeconds())}`;
}

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

export function orbitPoint(
  cx: number,
  cy: number,
  r: number,
  angle: number
): { x: number; y: number } {
  return {
    x: cx + r * Math.cos(angle),
    y: cy + r * Math.sin(angle),
  };
}