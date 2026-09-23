import { CONFIG } from "./config";
import { drawCross } from "./cross";
import { SEED, descend, isUniform, survivors, type Generation } from "./dice";

const { layout: LAYOUT, style: STYLE } = CONFIG;

const INTERVAL = 1000 / CONFIG.fps;
const HOLD_FRAMES = Math.round(CONFIG.fps * CONFIG.hold);
const COLUMNS = 6;

export type Rect = { x: number; y: number; width: number; height: number };

type Row = {
  generation: Generation;
  born: number;
  /** Per face, how visible its lineage is, easing toward `target`. */
  opacity: number[];
  target: number[];
};

const clamp = (n: number, min = 0, max = 1) => Math.min(max, Math.max(min, n));

const cubic = (a: number, b: number, c: number, d: number, t: number) => {
  const u = 1 - t;
  return u * u * u * a + 3 * u * u * t * b + 3 * u * t * t * c + t * t * t * d;
};

const measure = ({ width, height }: Rect) => {
  const padding = width * LAYOUT.padding;
  const spread = width - padding * 2;
  const column = spread / COLUMNS;
  const face = column * LAYOUT.face;
  const cross = face * 4;
  const top = padding + cross / 2;

  return {
    face,
    cross,
    x: (i: number) => padding + column * (i + 0.5),
    y: (g: number) => top + g * (cross + column * LAYOUT.rowGap),
    anchor: height * LAYOUT.anchor,
  };
};

/** One die rolled from its own faces until they all match, drawn as a scrolling tree of crosses. */
export class World {
  private generations: Generation[] = [];
  private rows: Row[] = [];
  private held = 0;
  private offset = 0;

  get latest() {
    return this.generations.at(-1)!;
  }

  begin(now: number) {
    this.generations = [];
    this.rows = [];
    this.held = 0;
    this.offset = 0;
    return this.grow(SEED, now);
  }

  /** Advances one generation, returning the new die if there is one. */
  step(now: number): Generation | undefined {
    if (!isUniform(this.latest)) return this.grow(descend(this.latest), now);
    if (this.held++ >= HOLD_FRAMES) return this.begin(now);
  }

  draw(context: CanvasRenderingContext2D, rect: Rect, now: number, dt: number) {
    const layout = measure(rect);
    const { face, cross, x, y } = layout;

    const focus = Math.max(0, y(this.rows.length - 1) + cross / 2 - layout.anchor);
    this.offset =
      focus < this.offset
        ? focus
        : this.offset + (focus - this.offset) * (1 - Math.exp(-dt / LAYOUT.smoothing));

    const fade = 1 - Math.exp(-dt / (STYLE.fade / 3));

    context.save();
    context.beginPath();
    context.rect(rect.x, rect.y, rect.width, rect.height);
    context.clip();
    context.translate(rect.x, rect.y - this.offset);

    this.rows.forEach((row, g) => {
      row.opacity = row.opacity.map((o, i) => o + (row.target[i]! - o) * fade);

      const center = y(g);
      const reach = g === 0 ? center - cross / 2 : y(g - 1) + cross / 2;
      if (center + cross / 2 < this.offset || reach > this.offset + rect.height) return;

      const progress = g === 0 ? 1 : clamp((now - row.born) / INTERVAL);
      const { values, parents } = row.generation;

      context.strokeStyle = STYLE.edge;
      context.lineWidth = STYLE.edgeWidth;
      parents.forEach((parent, i) => {
        const x0 = x(parent);
        const y0 = y(g - 1) + cross / 2;
        const x1 = x(i);
        const y1 = center - cross / 2;
        const mid = (y0 + y1) / 2;

        context.globalAlpha = row.opacity[i]!;
        context.beginPath();
        context.moveTo(x0, y0);
        if (progress >= 1) {
          context.bezierCurveTo(x0, mid, x1, mid, x1, y1);
        } else {
          for (let s = 1; s <= 16; s++) {
            const t = (s / 16) * progress;
            context.lineTo(cubic(x0, x0, x1, x1, t), cubic(y0, mid, mid, y1, t));
          }
        }
        context.stroke();
      });

      if (progress < 1) return;
      values.forEach((_, i) => {
        context.globalAlpha = row.opacity[i]!;
        drawCross(context, values, i, x(i) - face * 1.5, center - cross / 2, face);
      });
    });

    context.restore();
  }

  private grow(generation: Generation, now: number) {
    this.generations.push(generation);
    this.rows.push({
      generation,
      born: now,
      opacity: generation.values.map(() => 1),
      target: generation.values.map(() => 1),
    });

    const alive = survivors(this.generations);
    this.rows.forEach((row, g) => {
      row.target = row.target.map((_, i) => (alive[g]!.has(i) ? 1 : STYLE.extinct));
    });

    return generation;
  }
}
