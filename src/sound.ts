import { CONFIG } from "./config";

const { sound: SOUND } = CONFIG;

type Voice = { accent: GainNode; partials: GainNode[] };

/**
 * One voice per world, each built on its own fundamental. A voice has one sine partial per face
 * value, and each partial's level follows the share of faces showing that value, so a world's
 * tone collapses to a single pitch as its die converges.
 */
export class Sound {
  private context?: AudioContext;
  private master!: GainNode;
  private voices: Voice[] = [];
  private on = false;

  constructor(private count: number) {}

  async toggle() {
    this.on = !this.on;
    const context = this.context ?? this.build();
    const now = context.currentTime;

    this.master.gain.cancelScheduledValues(now);
    this.master.gain.setTargetAtTime(this.on ? SOUND.volume : 0, now, 0.05);

    if (this.on) await context.resume();
    return this.on;
  }

  pause() {
    this.context?.suspend();
  }

  resume() {
    if (this.on) this.context?.resume();
  }

  play(voice: number, values: number[], { settled = false } = {}) {
    const target = this.voices[voice];
    if (!this.on || !this.context || !target) return;
    const now = this.context.currentTime;

    target.partials.forEach((partial, i) => {
      const share = values.filter((value) => value === i + 1).length / values.length;
      partial.gain.setTargetAtTime(share / this.count, now, SOUND.glide);
    });

    const accent = target.accent.gain;
    const current = accent.value;
    accent.cancelScheduledValues(now);
    if (settled) {
      accent.setValueAtTime(current, now);
      accent.setTargetAtTime(1, now, SOUND.bloom);
    } else {
      accent.setValueAtTime(1, now);
      accent.setTargetAtTime(1 - SOUND.pulse, now, SOUND.decay);
    }
  }

  private build() {
    const context = new AudioContext();
    this.context = context;

    this.master = new GainNode(context, { gain: 0 });
    this.master.connect(context.destination);

    this.voices = Array.from({ length: this.count }, (_, v) => {
      const { scale } = SOUND;
      const fundamental =
        SOUND.fundamental * scale[v % scale.length]! * 2 ** Math.floor(v / scale.length);

      const accent = new GainNode(context, { gain: 1 - SOUND.pulse });
      accent.connect(this.master);

      const partials = SOUND.partials.map((ratio) => {
        const gain = new GainNode(context, { gain: 0 });
        const oscillator = new OscillatorNode(context, {
          type: SOUND.waveform,
          frequency: fundamental * ratio,
        });
        oscillator.connect(gain).connect(accent);
        oscillator.start();
        return gain;
      });

      return { accent, partials };
    });

    return context;
  }
}
