export class Audio {
  enabled = false;
  private ctx?: AudioContext;
  private next = 0;
  private note = 0;
  toggle() {
    this.enabled = !this.enabled;
    if (this.enabled) {
      this.ctx ??= new AudioContext();
      void this.ctx.resume();
    }
    return this.enabled;
  }
  tone(freq: number, duration = 0.35) {
    if (!this.enabled || !this.ctx) return;
    const c = this.ctx,
      o = c.createOscillator(),
      g = c.createGain();
    o.type = "sine";
    o.frequency.value = freq;
    g.gain.setValueAtTime(0, c.currentTime);
    g.gain.linearRampToValueAtTime(0.045, c.currentTime + 0.02);
    g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + duration);
    o.connect(g);
    g.connect(c.destination);
    o.start();
    o.stop(c.currentTime + duration);
  }
  update(active: boolean, rewind: boolean) {
    if (!active || !this.enabled || !this.ctx) return;
    if (this.ctx.currentTime < this.next) return;
    this.next = this.ctx.currentTime + 1.6;
    const notes = [196, 246.94, 293.66, 369.99, 293.66, 246.94, 220, 293.66];
    this.tone(notes[this.note++ % notes.length] * (rewind ? 0.5 : 1), 1.4);
  }
}
