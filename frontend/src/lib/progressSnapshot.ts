/** Pure canvas snapshot — no extra image library required. */

export interface ProgressSnapshotInput {
  username: string;
  level: number;
  totalPower: number;
  currentStreak: number;
  bestStreak: number;
  equippedTitle: string;
  accentHex?: string;
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

/** Draw a dark/cyan hunter card and return a PNG blob. */
export async function renderProgressSnapshot(
  input: ProgressSnapshotInput
): Promise<Blob> {
  const W = 1080;
  const H = 608;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas unavailable');

  const accent = input.accentHex || '#00e5ff';

  // Background
  const bg = ctx.createLinearGradient(0, 0, W, H);
  bg.addColorStop(0, '#050a14');
  bg.addColorStop(0.55, '#0a1628');
  bg.addColorStop(1, '#071018');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  // Subtle grid
  ctx.strokeStyle = 'rgba(0, 229, 255, 0.06)';
  ctx.lineWidth = 1;
  for (let x = 0; x < W; x += 48) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, H);
    ctx.stroke();
  }
  for (let y = 0; y < H; y += 48) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(W, y);
    ctx.stroke();
  }

  // Card panel
  roundRect(ctx, 48, 48, W - 96, H - 96, 16);
  ctx.fillStyle = 'rgba(15, 23, 42, 0.72)';
  ctx.fill();
  ctx.strokeStyle = `${accent}66`;
  ctx.lineWidth = 2;
  ctx.stroke();

  // Brand
  ctx.fillStyle = 'rgba(103, 232, 249, 0.75)';
  ctx.font = '600 22px ui-sans-serif, system-ui, sans-serif';
  ctx.fillText('THE DEV MONARCH', 88, 110);

  ctx.fillStyle = '#ffffff';
  ctx.font = '700 52px ui-sans-serif, system-ui, sans-serif';
  ctx.fillText(input.username.slice(0, 28), 88, 175);

  ctx.fillStyle = '#fbbf24';
  ctx.font = 'italic 600 28px ui-sans-serif, system-ui, sans-serif';
  ctx.fillText(input.equippedTitle.slice(0, 40), 88, 220);

  // Stat tiles
  const tiles = [
    { label: 'LEVEL', value: String(input.level) },
    { label: 'POWER', value: input.totalPower.toLocaleString() },
    { label: 'STREAK', value: String(input.currentStreak) },
    { label: 'BEST', value: String(Math.max(input.bestStreak, input.currentStreak)) },
  ];
  const tileW = 210;
  const gap = 20;
  const startX = 88;
  const tileY = 280;
  tiles.forEach((t, i) => {
    const x = startX + i * (tileW + gap);
    roundRect(ctx, x, tileY, tileW, 140, 12);
    ctx.fillStyle = 'rgba(8, 16, 32, 0.9)';
    ctx.fill();
    ctx.strokeStyle = `${accent}44`;
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.fillStyle = 'rgba(148, 163, 184, 0.9)';
    ctx.font = '700 14px ui-monospace, monospace';
    ctx.fillText(t.label, x + 20, tileY + 40);

    ctx.fillStyle = accent;
    ctx.font = '700 42px ui-monospace, monospace';
    ctx.fillText(t.value, x + 20, tileY + 100);
  });

  ctx.fillStyle = 'rgba(100, 116, 139, 0.9)';
  ctx.font = '500 18px ui-sans-serif, system-ui, sans-serif';
  ctx.fillText('Hunter System · Progress Snapshot', 88, H - 72);

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) reject(new Error('Failed to encode image'));
      else resolve(blob);
    }, 'image/png');
  });
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
