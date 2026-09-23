import { CONFIG } from "./config";
import type { Generation } from "./dice";

const SVG_NS = "http://www.w3.org/2000/svg";

const PIPS: Record<number, [number, number][]> = {
  1: [[90, 90]],
  2: [[48, 132], [132, 48]],
  3: [[48, 132], [90, 90], [132, 48]],
  4: [[48, 48], [48, 132], [132, 48], [132, 132]],
  5: [[48, 48], [48, 132], [90, 90], [132, 48], [132, 132]],
  6: [[48, 48], [48, 90], [48, 132], [132, 48], [132, 90], [132, 132]],
};

/** Grid position of each face in the unfolded die (3 wide, 4 tall). */
const CROSS: [number, number][] = [
  [1, 1],
  [1, 2],
  [2, 1],
  [0, 1],
  [1, 0],
  [1, 3],
];

const SILHOUETTE = "M1,0H2V1H3V2H2V4H1V2H0V1H1Z";

const el = <K extends keyof SVGElementTagNameMap>(
  tag: K,
  attrs: Record<string, string | number> = {},
) => {
  const node = document.createElementNS(SVG_NS, tag);
  for (const [key, value] of Object.entries(attrs)) {
    node.setAttribute(key, String(value));
  }
  return node;
};

type Layout = {
  face: number;
  width: number;
  height: number;
  x: (i: number) => number;
  y: (g: number) => number;
};

const measure = (width: number, height: number, faces: number): Layout => {
  const { maxWidth, margin, face: size, rowGap, top: offset } = CONFIG.layout;
  const spread = Math.min(width - margin * 2, maxWidth);
  const column = spread / faces;
  const face = Math.max(size.min, Math.min(size.max, column * size.ratio));
  const crossHeight = face * 4;
  const gap = column * rowGap;
  const top = Math.max(48, height * offset) + crossHeight / 2;
  const left = (width - spread) / 2;

  return {
    face,
    width: face * 3,
    height: crossHeight,
    x: (i) => left + column * (i + 0.5),
    y: (g) => top + g * (crossHeight + gap),
  };
};

export class Tree {
  private layout!: Layout;
  private dice: SVGDefsElement;
  private nodes: SVGGElement[][] = [];
  private edges: SVGPathElement[][] = [];
  private extinct: boolean[][] = [];

  constructor(
    private svg: SVGSVGElement,
    private edgeLayer: SVGGElement,
    private nodeLayer: SVGGElement,
  ) {
    this.definePips();
    this.dice = el("defs");
    this.svg.prepend(this.dice);
  }

  get depth() {
    return this.nodes.length;
  }

  resize(width: number, height: number, faces: number) {
    this.layout = measure(width, height, faces);
    this.svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
  }

  /** Vertical offset that keeps the newest generation in view. */
  focus(height: number) {
    if (this.depth === 0) return 0;
    const bottom = this.layout.y(this.depth - 1) + this.layout.height / 2;
    return Math.max(0, bottom - height * CONFIG.camera.anchor);
  }

  clear() {
    this.dice.replaceChildren();
    this.edgeLayer.replaceChildren();
    this.nodeLayer.replaceChildren();
    this.nodes = [];
    this.edges = [];
    this.extinct = [];
  }

  add(generation: Generation, { animate = true } = {}) {
    const g = this.depth;
    const { x, y, face, width, height } = this.layout;
    const die = this.defineDie(generation, g);

    this.edges[g] = generation.parents.map((parent, i) => {
      const x0 = x(parent);
      const y0 = y(g - 1) + height / 2;
      const x1 = x(i);
      const y1 = y(g) - height / 2;
      const mid = (y0 + y1) / 2;

      const path = el("path", {
        class: animate ? "edge fresh" : "edge",
        d: `M${x0},${y0} C${x0},${mid} ${x1},${mid} ${x1},${y1}`,
        pathLength: 1,
      });
      this.edgeLayer.append(path);
      return path;
    });

    const ring = Math.max(1.5, face * 0.1);

    this.nodes[g] = generation.values.map((_, i) => {
      const [col, row] = CROSS[i]!;
      const group = el("g", {
        class: animate && g > 0 ? "node fresh" : "node",
        transform: `translate(${x(i) - width / 2},${y(g) - height / 2})`,
      });
      group.append(
        el("use", { href: `#${die}`, width, height }),
        el("rect", {
          class: "own",
          x: col * face + ring / 2,
          y: row * face + ring / 2,
          width: face - ring,
          height: face - ring,
          "stroke-width": ring,
        }),
      );
      this.nodeLayer.append(group);
      return group;
    });

    this.extinct[g] = generation.values.map(() => false);
  }

  /** Fades every face whose lineage has died out. */
  prune(alive: Set<number>[]) {
    alive.forEach((survivors, g) => {
      this.extinct[g]!.forEach((gone, i) => {
        if (gone || survivors.has(i)) return;
        this.extinct[g]![i] = true;
        this.nodes[g]![i]!.classList.add("extinct");
        this.edges[g]![i]?.classList.add("extinct");
      });
    });
  }

  /** The unfolded die for one generation, drawn once and reused by each of its faces. */
  private defineDie({ values }: Generation, g: number) {
    const id = `die-${g}`;
    const symbol = el("symbol", { id, viewBox: "0 0 3 4" });
    symbol.append(el("path", { class: "silhouette", d: SILHOUETTE }));
    values.forEach((value, i) => {
      const [col, row] = CROSS[i]!;
      symbol.append(
        el("use", {
          href: `#pips-${value}`,
          x: col,
          y: row,
          width: 1,
          height: 1,
          class: "pips",
        }),
      );
    });
    this.dice.append(symbol);
    return id;
  }

  private definePips() {
    const defs = el("defs");
    for (const [value, pips] of Object.entries(PIPS)) {
      const symbol = el("symbol", { id: `pips-${value}`, viewBox: "0 0 180 180" });
      for (const [cx, cy] of pips) {
        symbol.append(el("circle", { cx, cy, r: 14 }));
      }
      defs.append(symbol);
    }
    this.svg.prepend(defs);
  }
}
