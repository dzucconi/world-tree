import { CONFIG } from "./config";

const { sound: SOUND } = CONFIG;

/**
 * One sine partial per face value. Each partial's level follows the share of faces showing that
 * value, so the tone collapses to a single pitch as the die converges.
 */
export class Sound {
  private context?: AudioContext;
  private master!: GainNode;
  private accent!: GainNode;
  private partials: GainNode[] = [];
  private on = false;

  get enabled() {
    return this.on;
  }

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

  play(values: number[], { settled = false } = {}) {
    if (!this.on || !this.context) return;
    const now = this.context.currentTime;

    this.partials.forEach((partial, i) => {
      const share = values.filter((value) => value === i + 1).length / values.length;
      partial.gain.setTargetAtTime(share, now, SOUND.glide);
    });

    const accent = this.accent.gain;
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
    this.accent = new GainNode(context, { gain: 1 - SOUND.pulse });
    this.accent.connect(this.master).connect(context.destination);

    this.partials = SOUND.partials.map((ratio) => {
      const gain = new GainNode(context, { gain: 0 });
      const oscillator = new OscillatorNode(context, {
        type: SOUND.waveform,
        frequency: SOUND.fundamental * ratio,
      });
      oscillator.connect(gain).connect(this.accent);
      oscillator.start();
      return gain;
    });

    return context;
  }
}
