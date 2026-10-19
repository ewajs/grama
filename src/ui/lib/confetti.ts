/** One piece of confetti in flight, in canvas pixels. */
type Piece = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  angle: number;
  spin: number;
  size: number;
  color: string;
};

/** How long a burst lasts, in milliseconds. */
export const CONFETTI_DURATION = 1800;

const GRAVITY = 0.0012;
const PIECES = 110;

/**
 * Bursts confetti from the top center of a canvas, then clears it.
 * @param colors CSS colors to pick from.
 * @returns A function that stops it early.
 */
export function burst(canvas: HTMLCanvasElement, colors: readonly string[]): () => void {
  const context = canvas.getContext('2d');
  if (!context) return () => {};
  const scale = devicePixelRatio;
  canvas.width = canvas.clientWidth * scale;
  canvas.height = canvas.clientHeight * scale;

  const pieces: Piece[] = Array.from({ length: PIECES }, (_, index) => ({
    x: canvas.width / 2,
    y: canvas.height * 0.3,
    vx: (Math.random() - 0.5) * 1.1 * scale,
    vy: (-0.5 - Math.random() * 0.7) * scale,
    angle: Math.random() * Math.PI,
    spin: (Math.random() - 0.5) * 0.02,
    size: (6 + Math.random() * 6) * scale,
    color: colors[index % colors.length] ?? 'gold',
  }));

  const start = performance.now();
  let last = start;
  let frame = requestAnimationFrame(function draw(now) {
    const elapsed = now - start;
    const step = now - last;
    last = now;
    context.clearRect(0, 0, canvas.width, canvas.height);
    if (elapsed > CONFETTI_DURATION) return;
    // Fades out over the last third.
    context.globalAlpha = Math.min(1, (CONFETTI_DURATION - elapsed) / (CONFETTI_DURATION / 3));
    for (const piece of pieces) {
      piece.vy += GRAVITY * scale * step;
      piece.x += piece.vx * step;
      piece.y += piece.vy * step;
      piece.angle += piece.spin * step;
      context.save();
      context.translate(piece.x, piece.y);
      context.rotate(piece.angle);
      context.fillStyle = piece.color;
      context.fillRect(-piece.size / 2, -piece.size / 4, piece.size, piece.size / 2);
      context.restore();
    }
    frame = requestAnimationFrame(draw);
  });
  return () => {
    cancelAnimationFrame(frame);
    context.clearRect(0, 0, canvas.width, canvas.height);
  };
}
