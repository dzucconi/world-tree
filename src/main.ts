import { CONFIG } from "./config";
import { isUniform } from "./dice";
import { Sound } from "./sound";
import { World, type Rect } from "./world";

const INTERVAL = 1000 / CONFIG.fps;
const COUNT = CONFIG.grid.columns * CONFIG.grid.rows;

const canvas = document.getElementById("stage") as HTMLCanvasElement;
const context = canvas.getContext("2d")!;
const toggle = document.getElementById("sound") as HTMLButtonElement;

const worlds = Array.from({ length: COUNT }, () => new World());
const sound = new Sound(COUNT);

document.documentElement.style.setProperty("--background", CONFIG.style.background);

let cells: Rect[] = [];

const resize = () => {
  const ratio = devicePixelRatio || 1;
  canvas.width = Math.round(innerWidth * ratio);
  canvas.height = Math.round(innerHeight * ratio);
  context.setTransform(ratio, 0, 0, ratio, 0, 0);

  const portrait = innerHeight > innerWidth;
  const { gutter } = CONFIG.grid;
  const columns = portrait ? CONFIG.grid.rows : CONFIG.grid.columns;
  const rows = portrait ? CONFIG.grid.columns : CONFIG.grid.rows;
  const width = (innerWidth - gutter * (columns - 1)) / columns;
  const height = (innerHeight - gutter * (rows - 1)) / rows;

  cells = worlds.map((_, i) => ({
    x: (i % columns) * (width + gutter),
    y: Math.floor(i / columns) * (height + gutter),
    width,
    height,
  }));
};

const step = (now: number) => {
  worlds.forEach((world, i) => {
    const generation = world.step(now);
    if (generation) sound.play(i, generation.values, { settled: isUniform(generation) });
  });
};

let last = performance.now();
let elapsed = 0;

const loop = (now: number) => {
  const dt = Math.min(now - last, 100);
  last = now;
  elapsed += dt;

  while (elapsed >= INTERVAL) {
    step(now);
    elapsed -= INTERVAL;
  }

  context.globalAlpha = 1;
  context.fillStyle = CONFIG.style.grid;
  context.fillRect(0, 0, innerWidth, innerHeight);
  worlds.forEach((world, i) => {
    const cell = cells[i]!;
    context.globalAlpha = 1;
    context.fillStyle = CONFIG.style.background;
    context.fillRect(cell.x, cell.y, cell.width, cell.height);
    world.draw(context, cell, now, dt);
  });

  requestAnimationFrame(loop);
};

if (CONFIG.sound.enabled) {
  toggle.hidden = false;

  toggle.addEventListener("click", async () => {
    const on = await sound.toggle();
    toggle.textContent = on ? "🔊" : "🔇";
    toggle.setAttribute("aria-label", on ? "Mute" : "Unmute");
    toggle.classList.toggle("on", on);

    if (!on) return;
    worlds.forEach((world, i) =>
      sound.play(i, world.latest.values, { settled: isUniform(world.latest) }),
    );
  });

  document.addEventListener("visibilitychange", () =>
    document.hidden ? sound.pause() : sound.resume(),
  );
}

let idle: number | undefined;
const wake = () => {
  document.body.classList.remove("idle");
  clearTimeout(idle);
  idle = setTimeout(() => document.body.classList.add("idle"), CONFIG.idle * 1000);
};
["pointermove", "pointerdown", "keydown"].forEach((type) => addEventListener(type, wake));
wake();

addEventListener("dblclick", ({ target }) => {
  if (target instanceof Element && target.closest(".sound")) return;
  if (!document.fullscreenEnabled) return;
  if (document.fullscreenElement) document.exitFullscreen();
  else document.documentElement.requestFullscreen();
});

resize();
addEventListener("resize", resize);
worlds.forEach((world) => world.begin(performance.now()));
requestAnimationFrame(loop);
