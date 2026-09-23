import { CONFIG } from "./config";

const { style: STYLE } = CONFIG;

const PIPS: [number, number][][] = [
  [[90, 90]],
  [[48, 132], [132, 48]],
  [[48, 132], [90, 90], [132, 48]],
  [[48, 48], [48, 132], [132, 48], [132, 132]],
  [[48, 48], [48, 132], [90, 90], [132, 48], [132, 132]],
  [[48, 48], [48, 90], [48, 132], [132, 48], [132, 90], [132, 132]],
];

/** Grid position of each face in the unfolded die (3 wide, 4 tall). */
const CROSS: [number, number][] = [
  [1, 1],
  [1, 2],
  [2, 1],
  [0, 1],
  [1, 0],
  [1, 3],
];

const sprite = (pips: [number, number][]) => {
  const size = 128;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const context = canvas.getContext("2d")!;
  context.fillStyle = STYLE.pip;
  context.scale(size / 180, size / 180);
  for (const [x, y] of pips) {
    context.beginPath();
    context.arc(x, y, 14, 0, Math.PI * 2);
    context.fill();
  }
  return canvas;
};

const SPRITES = PIPS.map(sprite);

/**
 * Draws a die unfolded into a cross, with its top-left corner at (left, top), outlining the face
 * at index `own` in red.
 */
export const drawCross = (
  context: CanvasRenderingContext2D,
  values: number[],
  own: number,
  left: number,
  top: number,
  face: number,
) => {
  context.fillStyle = STYLE.face;
  context.beginPath();
  context.rect(left + face, top, face, face * 4);
  context.rect(left, top + face, face * 3, face);
  context.fill();

  if (face >= 2.5) {
    values.forEach((value, i) => {
      const [col, row] = CROSS[i]!;
      context.drawImage(SPRITES[value - 1]!, left + col * face, top + row * face, face, face);
    });
  }

  const [col, row] = CROSS[own]!;
  const ring = Math.max(0.75, face * 0.1);
  context.strokeStyle = STYLE.highlight;
  context.lineWidth = ring;
  context.strokeRect(
    left + col * face + ring / 2,
    top + row * face + ring / 2,
    face - ring,
    face - ring,
  );
};
