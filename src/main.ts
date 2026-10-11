import "./style.css";
import { Engine, LEVELS, type Input } from "./engine";
import { render } from "./render";
import { Audio } from "./audio";
const el = <T extends HTMLElement>(id: string) =>
  document.getElementById(id) as T;
const canvas = el<HTMLCanvasElement>("game"),
  ctx = canvas.getContext("2d")!;
const overlay = el("overlay"),
  audio = new Audio(),
  input: Input = {};
const SAVE = "hours-we-keep-v1";
let e = new Engine(),
  mode: "intro" | "playing" | "paused" | "complete" | "ending" = "intro";
let saveFailed = false;
try {
  const raw = localStorage.getItem(SAVE);
  const restored = raw && Engine.restore(raw);
  if (restored) e = restored;
  else if (raw)
    el("notice").textContent =
      "An unreadable save was ignored. A new journey is ready.";
} catch {
  saveFailed = true;
}
function clear() {
  keys.clear();
  pointers.clear();
  for (const k of Object.keys(input)) delete input[k as keyof Input];
  e.clearInput();
  document.querySelectorAll(".held").forEach((b) => b.classList.remove("held"));
}
function save() {
  try {
    localStorage.setItem(SAVE, e.serialize());
  } catch {
    if (!saveFailed)
      el("notice").textContent =
        "Storage unavailable. You can still play, but this visit will not save.";
    saveFailed = true;
  }
}
function panel(
  eyebrow: string,
  title: string,
  text: string,
  label: string,
  action: () => void,
  small = "",
) {
  clear();
  overlay.classList.remove("hidden");
  overlay.replaceChildren();
  const tag = document.createElement("p");
  tag.className = "eyebrow";
  tag.textContent = eyebrow;
  const heading = document.createElement("h2");
  heading.textContent = title;
  const body = document.createElement("p");
  body.textContent = text;
  const detail = document.createElement("p");
  detail.className = "small";
  detail.textContent = small;
  const button = document.createElement("button");
  button.textContent = label;
  button.addEventListener("click", action);
  overlay.append(tag, heading, body, detail, button);
}
function begin() {
  clear();
  mode = e.complete ? "complete" : "playing";
  if (e.complete) completed();
  else overlay.classList.add("hidden");
  save();
}
function intro() {
  panel(
    "A SHORT STORY IN FOUR HOURS",
    "Some things are worth returning for.",
    "The sea took the observatory. Iona came back for its light. Walk into the past, keep its amber memories, and reverse your way home.",
    e.state.time || e.complete ? "Continue journey" : "Enter the garden",
    begin,
    "Amber remembers across rewind. Restart clears this hour. Hold the labeled controls or use the keyboard.",
  );
}
function pause() {
  if (mode === "playing") {
    mode = "paused";
    save();
    panel(
      "THE WORLD CAN WAIT",
      "Take a breath.",
      "Time stands still here. Your past is waiting when you return.",
      "Resume",
      begin,
    );
  } else if (mode === "paused") begin();
}
function completed() {
  mode = "complete";
  save();
  const last = e.index === LEVELS.length - 1;
  panel(
    "HOUR RESTORED",
    e.level.title,
    e.level.letter,
    last ? "Light the observatory" : "Enter the next hour",
    () => {
      clear();
      if (last) {
        mode = "ending";
        panel(
          "THE OBSERVATORY IS ALIGHT",
          "You kept the light.",
          "At dawn, the sea drew back. A small amber window shone above the garden. Iona left the door open. Some futures are made by returning. Others begin when we finally go on.",
          "Begin again",
          () => {
            e = new Engine();
            save();
            mode = "intro";
            intro();
          },
          "All four hours restored · Thank you for keeping them.",
        );
      } else {
        e = new Engine(e.index + 1);
        mode = "playing";
        overlay.classList.add("hidden");
        save();
      }
    },
  );
}
const mapping: Record<string, keyof Input> = {
  ArrowLeft: "left",
  KeyA: "left",
  ArrowRight: "right",
  KeyD: "right",
  ArrowUp: "jump",
  KeyW: "jump",
  Space: "jump",
  KeyR: "rewind",
  ShiftLeft: "rewind",
  ShiftRight: "rewind",
};
const keys = new Set<string>(),
  pointers = new Map<number, keyof Input>();
function sync() {
  for (const value of ["left", "right", "jump", "rewind"] as const)
    input[value] =
      [...keys].some((k) => mapping[k] === value) ||
      [...pointers.values()].includes(value);
}
function release() {
  keys.clear();
  pointers.clear();
  clear();
}
document.addEventListener("keydown", (ev) => {
  if (mapping[ev.code]) {
    ev.preventDefault();
    if (mode === "playing") {
      keys.add(ev.code);
      sync();
    }
  }
  if (ev.code === "Escape" && !ev.repeat) {
    ev.preventDefault();
    pause();
  }
});
document.addEventListener("keyup", (ev) => {
  keys.delete(ev.code);
  sync();
});
document.querySelectorAll<HTMLButtonElement>("[data-hold]").forEach((b) => {
  b.addEventListener("pointerdown", (ev) => {
    ev.preventDefault();
    if (mode !== "playing") return;
    b.setPointerCapture(ev.pointerId);
    pointers.set(ev.pointerId, b.dataset.hold as keyof Input);
    b.classList.add("held");
    sync();
  });
  const end = (ev: PointerEvent) => {
    pointers.delete(ev.pointerId);
    b.classList.remove("held");
    sync();
  };
  b.addEventListener("pointerup", end);
  b.addEventListener("pointercancel", end);
  b.addEventListener("lostpointercapture", end);
});
el("pause").addEventListener("click", () => {
  release();
  pause();
});
el("restart").addEventListener("click", () => {
  release();
  e.restart();
  mode = "playing";
  overlay.classList.add("hidden");
  save();
  el("notice").textContent =
    "This hour begins again. Its amber memories have been cleared.";
});
el("sound").addEventListener("click", () => {
  const enabled = audio.toggle();
  el("sound").textContent = enabled ? "Sound on" : "Sound off";
  el("sound").setAttribute("aria-pressed", String(enabled));
});
window.addEventListener("blur", () => {
  release();
  if (mode === "playing") pause();
});
document.addEventListener("visibilitychange", () => {
  if (document.hidden) {
    release();
    if (mode === "playing") pause();
    save();
  }
});
window.addEventListener("pagehide", save);
let previous = performance.now(),
  acc = 0,
  lastSave = 0,
  lastMemories = e.memories.size,
  lastBell = e.bell,
  wasDead = e.state.dead;
function frame(now: number) {
  acc += Math.min(100, now - previous);
  previous = now;
  if (mode === "playing") {
    while (acc >= 1000 / 60) {
      e.tick(input);
      if (input.rewind) {
        e.tick(input);
        e.tick(input);
      }
      acc -= 1000 / 60;
      if (e.complete) {
        release();
        completed();
        break;
      }
    }
  } else acc = 0;
  if (e.memories.size > lastMemories) {
    audio.tone(523.25);
    el("notice").textContent =
      "An amber memory is yours. Hold rewind to return from the vault.";
  }
  if (e.bell && !lastBell) {
    audio.tone(392, 0.9);
    el("notice").textContent =
      "The bell remembers. Its bridge will remain when you rewind.";
  }
  if (e.state.dead && !wasDead) {
    release();
    audio.tone(130, 0.6);
    el("notice").textContent =
      "The blue world stopped. Hold rewind to recover, or restart this hour.";
  }
  lastMemories = e.memories.size;
  lastBell = e.bell;
  wasDead = e.state.dead;
  if (now - lastSave > 1000 && mode === "playing") {
    save();
    lastSave = now;
  }
  render(ctx, e, now);
  audio.update(mode === "playing" && !e.state.dead, e.rewinding);
  el("chapter").textContent = e.level.subtitle;
  el("status").textContent =
    `${e.memories.size} / ${e.level.memories.length} memories${e.level.bell ? ` · Bell ${e.bell ? "awake" : "silent"}` : ""}`;
  el("rule").textContent = e.level.rule;
  el("history").style.width = `${e.history.length / 18}%`;
  el("time-label").textContent =
    `YOUR PAST · ${(e.history.length / 60).toFixed(1)} s`;
  el("reversing").classList.toggle("active", e.rewinding && mode === "playing");
  el("pause").textContent = mode === "paused" ? "Resume" : "Pause";
  requestAnimationFrame(frame);
}
intro();
requestAnimationFrame(frame);
