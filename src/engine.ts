export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}
export interface Player extends Rect {
  vx: number;
  vy: number;
  grounded: boolean;
  coyote: number;
  buffer: number;
}
export interface Snapshot {
  player: Player;
  time: number;
  dead: boolean;
}
export interface Input {
  left?: boolean;
  right?: boolean;
  jump?: boolean;
  rewind?: boolean;
}
export interface Memory {
  x: number;
  y: number;
  id: string;
}
export interface Level {
  title: string;
  subtitle: string;
  rule: string;
  letter: string;
  platforms: Rect[];
  memories: Memory[];
  bell?: Memory;
  hazard?: "spikes" | "pendulum";
  pits: [number, number][];
}
const ground = (pits: [number, number][]): Rect[] => {
  const result: Rect[] = [];
  let start = 0;
  for (const [a, b] of pits) {
    result.push({ x: start, y: 350, w: a - start, h: 290 });
    result.push({ x: a, y: 590, w: b - a, h: 50 });
    start = b;
  }
  result.push({ x: start, y: 350, w: 960 - start, h: 290 });
  return result;
};
const level = (l: Omit<Level, "platforms">): Level => ({
  ...l,
  platforms: ground(l.pits),
});
export const LEVELS: Level[] = [
  level({
    title: "The first thing lost",
    subtitle: "HOUR I · THE ROOT CELLAR",
    rule: "Drop into the vault. Touch the amber memory, then hold rewind to return above. Jump across to the door.",
    letter:
      "I used to think keeping something meant never letting it go. The garden taught me otherwise.",
    pits: [[250, 390]],
    memories: [{ x: 320, y: 563, id: "root" }],
  }),
  level({
    title: "Two versions of a day",
    subtitle: "HOUR II · THE DIVIDED GARDEN",
    rule: "Each vault keeps a memory. Retrieve one, rewind out, then make a new path to the other.",
    letter:
      "You cannot walk every path at once. But you can carry a little of each with you.",
    pits: [
      [220, 350],
      [560, 690],
    ],
    memories: [
      { x: 285, y: 563, id: "rain" },
      { x: 625, y: 563, id: "sun" },
    ],
    hazard: "spikes",
  }),
  level({
    title: "What the bell remembers",
    subtitle: "HOUR III · THE SILENT BELL",
    rule: "The far vault holds a bell. Touch it: its amber bridge remembers, even when you rewind.",
    letter:
      "The bell does not ask which day you came from. It only asks whether you listened.",
    pits: [
      [220, 350],
      [530, 670],
    ],
    memories: [{ x: 285, y: 563, id: "song" }],
    bell: { x: 600, y: 559, id: "bell" },
  }),
  level({
    title: "A future worth returning to",
    subtitle: "HOUR IV · THE TIDAL CLOCK",
    rule: "Blue pendulums reverse with you. Amber remembers. Recover both memories and wake the bell to open the last crossing.",
    letter:
      "The hours were never mine to own. Only mine to fill. I will keep the light on for whoever comes next.",
    pits: [
      [200, 330],
      [520, 650],
      [740, 865],
    ],
    memories: [
      { x: 265, y: 563, id: "light" },
      { x: 585, y: 563, id: "home" },
    ],
    bell: { x: 802, y: 559, id: "bell" },
    hazard: "pendulum",
  }),
];
export const HISTORY_LIMIT = 1800;
export const MAX_JUMP_HEIGHT = 110.25;
const intersects = (a: Rect, b: Rect) =>
  a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
const clone = (s: Snapshot): Snapshot => ({ ...s, player: { ...s.player } });
export class Engine {
  index: number;
  state: Snapshot;
  history: Snapshot[] = [];
  memories = new Set<string>();
  bell = false;
  complete = false;
  rewinding = false;
  private jumpHeld = false;
  constructor(index = 0) {
    this.index = index;
    this.state = this.initial();
  }
  get level() {
    return LEVELS[this.index];
  }
  private initial(): Snapshot {
    return {
      player: {
        x: 65,
        y: 318,
        w: 24,
        h: 32,
        vx: 0,
        vy: 0,
        grounded: true,
        coyote: 6,
        buffer: 0,
      },
      time: 0,
      dead: false,
    };
  }
  restart() {
    this.state = this.initial();
    this.history = [];
    this.memories.clear();
    this.bell = false;
    this.complete = false;
    this.rewinding = false;
    this.jumpHeld = false;
  }
  clearInput() {
    this.jumpHeld = false;
  }
  get ready() {
    return (
      this.memories.size === this.level.memories.length &&
      (!this.level.bell || this.bell)
    );
  }
  get solids(): Rect[] {
    const result = [...this.level.platforms];
    if (this.level.bell && this.bell) {
      const [x, end] = this.level.pits.at(-1)!;
      result.push({ x, y: 350, w: end - x, h: 16 });
    }
    if (!this.ready) result.push({ x: 900, y: 0, w: 16, h: 640 });
    return result;
  }
  hazardRect(): Rect | undefined {
    if (this.level.hazard === "pendulum")
      return {
        x: 374 + Math.sin(this.state.time / 48) * 35,
        y: 297,
        w: 24,
        h: 53,
      };
    if (this.level.hazard === "spikes") return { x: 417, y: 334, w: 32, h: 16 };
  }
  tick(input: Input = {}) {
    this.rewinding = !!input.rewind && !this.complete;
    if (this.complete) return;
    if (input.rewind) {
      const last = this.history.pop();
      if (last) this.state = clone(last);
      this.jumpHeld = !!input.jump;
      return;
    }
    const jumpPressed = !!input.jump && !this.jumpHeld;
    this.jumpHeld = !!input.jump;
    if (this.state.dead) return;
    this.history.push(clone(this.state));
    // Retain the room origin even after the rolling past fills up.
    if (this.history.length > HISTORY_LIMIT) this.history.splice(1, 1);
    const p = this.state.player;
    this.state.time++;
    p.coyote = p.grounded ? 6 : Math.max(0, p.coyote - 1);
    p.buffer = jumpPressed ? 7 : Math.max(0, p.buffer - 1);
    if (p.buffer && p.coyote) {
      p.vy = -10.5;
      p.grounded = false;
      p.coyote = 0;
      p.buffer = 0;
    }
    p.vx = ((input.right ? 1 : 0) - (input.left ? 1 : 0)) * 3.7;
    p.x += p.vx;
    p.x = Math.max(0, Math.min(960 - p.w, p.x));
    for (const r of this.solids)
      if (intersects(p, r)) {
        if (p.vx > 0) p.x = r.x - p.w;
        else if (p.vx < 0) p.x = r.x + r.w;
      }
    const oldBottom = p.y + p.h;
    p.vy = Math.min(p.vy + 0.5, 13);
    p.y += p.vy;
    p.grounded = false;
    for (const r of this.solids)
      if (intersects(p, r)) {
        if (p.vy >= 0 && oldBottom <= r.y + 1) {
          p.y = r.y - p.h;
          p.vy = 0;
          p.grounded = true;
        } else if (p.vy < 0) {
          p.y = r.y + r.h;
          p.vy = 0;
        }
      }
    for (const m of this.level.memories)
      if (intersects(p, { x: m.x - 13, y: m.y - 13, w: 26, h: 26 }))
        this.memories.add(m.id);
    const b = this.level.bell;
    if (b && intersects(p, { x: b.x - 18, y: b.y - 23, w: 36, h: 46 }))
      this.bell = true;
    const hazard = this.hazardRect();
    if (p.y > 640 || (hazard && intersects(p, hazard))) this.state.dead = true;
    if (this.ready && p.x > 919 && p.y < 350) this.complete = true;
  }
  serialize() {
    return JSON.stringify({
      version: 1,
      index: this.index,
      state: this.state,
      history: this.history,
      memories: [...this.memories],
      bell: this.bell,
      complete: this.complete,
    });
  }
  static restore(raw: string): Engine | undefined {
    try {
      if (raw.length > 650000) return;
      const d = JSON.parse(raw);
      if (
        d.version !== 1 ||
        !Number.isInteger(d.index) ||
        d.index < 0 ||
        d.index >= LEVELS.length
      )
        return;
      const valid = (s: Snapshot) =>
        s &&
        Number.isSafeInteger(s.time) &&
        s.time >= 0 &&
        typeof s.dead === "boolean" &&
        s.player &&
        ["x", "y", "vx", "vy", "coyote", "buffer"].every((k) =>
          Number.isFinite(s.player[k as keyof Player]),
        ) &&
        s.player.x >= 0 &&
        s.player.x <= 936 &&
        s.player.y >= -300 &&
        s.player.y <= 700 &&
        s.player.w === 24 &&
        s.player.h === 32 &&
        Math.abs(s.player.vx) <= 3.7 &&
        Math.abs(s.player.vy) <= 13 &&
        typeof s.player.grounded === "boolean" &&
        s.player.coyote >= 0 &&
        s.player.coyote <= 6 &&
        s.player.buffer >= 0 &&
        s.player.buffer <= 7;
      if (
        !valid(d.state) ||
        !Array.isArray(d.history) ||
        d.history.length > HISTORY_LIMIT ||
        !d.history.every(valid) ||
        !Array.isArray(d.memories) ||
        typeof d.bell !== "boolean" ||
        typeof d.complete !== "boolean"
      )
        return;
      const e = new Engine(d.index);
      const allowed = new Set(e.level.memories.map((m) => m.id));
      if (
        d.memories.some(
          (m: unknown) => typeof m !== "string" || !allowed.has(m),
        )
      )
        return;
      e.state = clone(d.state);
      e.history = d.history.map(clone);
      e.memories = new Set(d.memories);
      e.bell = !!e.level.bell && d.bell;
      if (
        d.complete &&
        (!e.ready ||
          e.state.dead ||
          e.state.player.x <= 919 ||
          e.state.player.y >= 350)
      )
        return;
      e.complete = d.complete;
      return e;
    } catch {
      return;
    }
  }
}
