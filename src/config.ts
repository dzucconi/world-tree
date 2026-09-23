export const CONFIG = {
  /** Generations per second. */
  fps: 12,
  /** Seconds to linger on the uniform die before starting over. */
  hold: 2,
  /** Seconds without pointer or keyboard activity before the cursor hides. */
  idle: 3,

  layout: {
    /** Widest the six columns can spread, in px. */
    maxWidth: 720,
    /** Minimum space on either side of the tree, in px. */
    margin: 20,
    /** Size of one face of a cross, as a fraction of the column width, clamped to px. */
    face: { ratio: 0.25, min: 8, max: 30 },
    /** Vertical space between generations, in column widths. */
    rowGap: 1,
    /** Where the first generation sits, as a fraction of the viewport height. */
    top: 0.12,
  },

  camera: {
    /** Where the bottom of the newest generation sits, as a fraction of the viewport height. */
    anchor: 0.8,
    /** Time constant for the camera catching up, in ms. Lower is snappier. */
    smoothing: 120,
  },

  style: {
    background: "black",
    face: "white",
    pip: "black",
    edge: "white",
    highlight: "red",
    sum: "#111",
    edgeWidth: 1.25,
    /** Opacity of lineages that have died out. */
    extinct: 0.15,
    /** How long a lineage takes to fade once it dies out, in ms. */
    fade: 600,
  },

  sound: {
    /** Show the sound toggle. Browsers require a click or key press before audio can start. */
    enabled: true,
    volume: 0.25,
    /** Frequency the partials are built on, in Hz. */
    fundamental: 110,
    /**
     * Frequency multiple of the fundamental for faces showing 1–6. Each partial is as loud as
     * the share of faces showing that number, so the tone thins to a single pitch as it converges.
     * Try [1, 9 / 8, 5 / 4, 3 / 2, 5 / 3, 2] for a just major scale.
     */
    partials: [1, 2, 3, 4, 5, 6],
    waveform: "sine" as OscillatorType,
    /** Seconds for the tone to morph toward each new die. */
    glide: 0.04,
    /** 0–1, how strongly each new generation accents the tone. 0 is a continuous drone. */
    pulse: 0.6,
    /** Time constant of each accent's decay, in seconds. */
    decay: 0.06,
    /** Time constant for the final unison swelling to full volume, in seconds. */
    bloom: 0.4,
  },
};
