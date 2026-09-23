import { CONFIG } from "./config";
import { SEED, descend, isUniform, survivors, type Generation } from "./dice";
import { toRoman } from "./roman";
import { Sound } from "./sound";
import { Tree } from "./tree";

const INTERVAL = 1000 / CONFIG.fps;
const HOLD_FRAMES = Math.round(CONFIG.fps * CONFIG.hold);

const svg = document.getElementById("stage") as unknown as SVGSVGElement;
const camera = document.getElementById("camera") as unknown as SVGGElement;
const sum = document.getElementById("sum")!;
const toggle = document.getElementById("sound") as HTMLButtonElement;

const tree = new Tree(
  svg,
  document.getElementById("edges") as unknown as SVGGElement,
  document.getElementById("nodes") as unknown as SVGGElement,
);
const sound = new Sound();

const { style } = CONFIG;
Object.entries({
  "--tick": `${INTERVAL}ms`,
  "--background": style.background,
  "--face": style.face,
  "--pip": style.pip,
  "--edge": style.edge,
  "--highlight": style.highlight,
  "--sum": style.sum,
  "--edge-width": String(style.edgeWidth),
  "--extinct": String(style.extinct),
  "--fade": `${style.fade}ms`,
}).forEach(([key, value]) => document.documentElement.style.setProperty(key, value));

let generations: Generation[] = [];
let held = 0;
let offset = 0;

const show = (generation: Generation, animate = true) => {
  generations.push(generation);
  tree.add(generation, { animate });
  tree.prune(survivors(generations));
  sum.textContent = toRoman(generation.values.reduce((a, b) => a + b, 0));
};

const advance = (generation: Generation) => {
  show(generation);
  sound.play(generation.values, { settled: isUniform(generation) });
};

const restart = () => {
  generations = [];
  held = 0;
  offset = 0;
  tree.clear();
  advance(SEED);
};

const step = () => {
  const latest = generations.at(-1)!;

  if (!isUniform(latest)) {
    advance(descend(latest));
    return;
  }

  if (held++ >= HOLD_FRAMES) restart();
};

const resize = () => {
  tree.resize(innerWidth, innerHeight, SEED.values.length);
  const history = generations;
  generations = [];
  tree.clear();
  history.forEach((generation) => show(generation, false));
  offset = tree.focus(innerHeight);
};

let last = performance.now();
let elapsed = 0;

const loop = (now: number) => {
  const dt = now - last;
  last = now;
  elapsed += dt;

  if (elapsed > INTERVAL * 4) elapsed = INTERVAL;
  while (elapsed >= INTERVAL) {
    step();
    elapsed -= INTERVAL;
  }

  const target = tree.focus(innerHeight);
  offset =
    target < offset
      ? target
      : offset + (target - offset) * (1 - Math.exp(-dt / CONFIG.camera.smoothing));
  camera.setAttribute("transform", `translate(0,${-offset})`);

  requestAnimationFrame(loop);
};

if (CONFIG.sound.enabled) {
  toggle.hidden = false;

  toggle.addEventListener("click", async () => {
    const on = await sound.toggle();
    toggle.textContent = on ? "🔊" : "🔇";
    toggle.setAttribute("aria-label", on ? "Mute" : "Unmute");
    toggle.classList.toggle("on", on);

    const latest = generations.at(-1);
    if (on && latest) sound.play(latest.values, { settled: isUniform(latest) });
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

tree.resize(innerWidth, innerHeight, SEED.values.length);
restart();
addEventListener("resize", resize);
requestAnimationFrame(loop);
