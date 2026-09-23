export const CONFIG = {
  /** Generations per second, shared by every world. */
  fps: 12,
  /** Seconds a world lingers on its uniform die before starting over. */
  hold: 2,
  /** Seconds without pointer or keyboard activity before the cursor hides. */
  idle: 3,

  /** Worlds are laid out in a grid; columns and rows swap on a portrait screen. */
  grid: {
    columns: 4,
    rows: 2,
    /** Space between worlds, in px. */
    gutter: 2,
  },

  /** Sizes are fractions of a world's width unless noted. */
  layout: {
    /** Space around the tree inside its world. */
    padding: 0.08,
    /** Size of one face of a cross, as a fraction of the space between neighboring crosses. */
    face: 0.25,
    /** Vertical space between generations, in multiples of the space between neighboring crosses. */
    rowGap: 1,
    /** Where the bottom of the newest generation sits, as a fraction of the world's height. */
    anchor: 0.85,
    /** Time constant for the view catching up to the newest generation, in ms. */
    smoothing: 120,
  },

  style: {
    background: "black",
    /** Color of the lines between worlds. */
    grid: "#222",
    face: "white",
    pip: "black",
    edge: "white",
    highlight: "red",
    /** Width of the lineage lines, in px. */
    edgeWidth: 1,
    /** Opacity of lineages that have died out. */
    extinct: 0.15,
    /** How long a lineage takes to fade once it dies out, in ms. */
    fade: 600,
  },

  sound: {
    /** Show the sound toggle. Browsers require a click or key press before audio can start. */
    enabled: true,
    volume: 0.3,
    /** Frequency of the lowest world's first partial, in Hz. */
    fundamental: 110,
    /**
     * Each world gets its own fundamental, stepping through this scale and up an octave each
     * time it runs out.
     */
    scale: [1, 9 / 8, 5 / 4, 3 / 2, 5 / 3],
    /**
     * Frequency multiple of a world's fundamental for faces showing 1–6. Each partial is as loud
     * as the share of faces showing that number, so a world thins to a single pitch as it
     * converges.
     */
    partials: [1, 2, 3, 4, 5, 6],
    waveform: "sine" as OscillatorType,
    /** Seconds for a world's tone to morph toward each new die. */
    glide: 0.04,
    /** 0–1, how strongly each new generation accents the tone. 0 is a continuous drone. */
    pulse: 0.6,
    /** Time constant of each accent's decay, in seconds. */
    decay: 0.06,
    /** Time constant for a converged world's single tone swelling to full volume, in seconds. */
    bloom: 0.4,
  },
};
