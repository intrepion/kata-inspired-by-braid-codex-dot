import { test } from "node:test";
import assert from "node:assert/strict";
import {
  Engine,
  LEVELS,
  HISTORY_LIMIT,
  MAX_JUMP_HEIGHT,
} from "../src/engine.ts";
test("reversal restores motion and branches from the recovered past", () => {
  const e = new Engine();
  for (let i = 0; i < 30; i++) e.tick({ right: true });
  const x = e.state.player.x;
  for (let i = 0; i < 20; i++) e.tick({ rewind: true });
  assert.ok(e.state.player.x < x);
  const at = e.state.player.x;
  e.tick({ left: true });
  assert.ok(e.state.player.x < at);
  assert.equal(e.history.length, 11);
});
const run = (e: Engine, n: number, input = {}) => {
  for (let i = 0; i < n; i++) e.tick(input);
};
function walk(e: Engine, target: number) {
  let limit = 400;
  while (
    Math.abs(e.state.player.x - target) > 4 &&
    limit-- &&
    !e.state.dead &&
    !e.complete
  )
    e.tick(e.state.player.x < target ? { right: true } : { left: true });
  assert.ok(limit > 0, "walk reaches target");
}
function retrieve(e: Engine, x: number) {
  walk(e, x - 12);
  run(e, 60);
  assert.ok(
    e.state.player.y > 500,
    `keeper enters deep vault hour ${e.index + 1} x${e.state.player.x} y${e.state.player.y} dead${e.state.dead}`,
  );
}
function returnBefore(e: Engine, edge: number) {
  let limit = 500;
  while (
    (e.state.player.y > 318 ||
      e.state.player.x > edge - 15 ||
      !e.state.player.grounded) &&
    e.history.length &&
    limit--
  )
    e.tick({ rewind: true });
  assert.ok(e.state.player.y <= 318, "rewind escapes vault");
  assert.ok(e.state.player.x <= edge - 15, "rewind reaches takeoff");
}
function cross(e: Engine, a: number, b: number) {
  walk(e, a - 15);
  e.tick({ jump: true, right: true });
  let limit = 80;
  while (
    (e.state.player.x < b + 6 || !e.state.player.grounded) &&
    limit-- &&
    !e.state.dead &&
    !e.complete
  )
    e.tick({ right: true });
  assert.ok(
    !e.state.dead,
    `crossing survives hour ${e.index + 1} x${e.state.player.x}`,
  );
  assert.ok(
    e.state.player.y <= 318,
    `crossing lands above vault: hour ${e.index + 1} pit ${a}-${b} x${e.state.player.x} y${e.state.player.y}`,
  );
}
test("amber memories survive reversal while restart clears them", () => {
  const e = new Engine();
  retrieve(e, 320);
  assert.equal(e.memories.size, 1);
  returnBefore(e, 250);
  assert.equal(e.memories.size, 1);
  e.restart();
  assert.equal(e.memories.size, 0);
  assert.equal(e.history.length, 0);
});
test("all authored temporal solutions reach their exits through ordinary physics", () => {
  for (let index = 0; index < LEVELS.length; index++) {
    const e = new Engine(index);
    for (const [a, b] of e.level.pits) {
      const memory = e.level.memories.find((m) => m.x > a && m.x < b);
      const bell = e.level.bell;
      if (memory) {
        retrieve(e, memory.x);
        assert.ok(e.memories.has(memory.id));
        returnBefore(e, a);
      } else if (bell && bell.x > a && bell.x < b) {
        retrieve(e, bell.x);
        assert.ok(e.bell);
        returnBefore(e, a);
      }
      cross(e, a, b);
      if (
        (e.level.hazard === "spikes" && b === 350) ||
        (e.level.hazard === "pendulum" && b === 330)
      ) {
        walk(e, e.index === 3 ? 338 : 355);
        e.tick({ right: true, jump: true });
        run(e, 40, { right: true });
        assert.ok(!e.state.dead);
      }
    }
    walk(e, 930);
    assert.ok(e.complete, `hour ${index + 1} complete`);
  }
});
test("ordinary platforming cannot complete any hour without temporal retrievals", () => {
  for (let i = 0; i < LEVELS.length; i++) {
    const e = new Engine(i);
    for (const [a, b] of e.level.pits) {
      cross(e, a, b);
      if ((i === 1 && b === 350) || (i === 3 && b === 330)) {
        walk(e, i === 3 ? 338 : 355);
        e.tick({ right: true, jump: true });
        run(e, 40, { right: true });
      }
    }
    run(e, 220, { right: true });
    assert.equal(e.complete, false);
    assert.equal(e.memories.size, 0);
    assert.ok(e.state.player.x <= 876, "gate cannot be crossed");
  }
});
test("vault depth exceeds jump reach; recovered memory cannot be carried out by jumping", () => {
  assert.ok(590 - 350 > MAX_JUMP_HEIGHT + 32);
  const e = new Engine();
  retrieve(e, 320);
  let highest = 558;
  e.tick({ jump: true });
  for (let i = 0; i < 100; i++) {
    e.tick({ jump: true, right: true });
    highest = Math.min(highest, e.state.player.y);
  }
  assert.ok(highest > 350);
  assert.equal(e.complete, false);
});
test("death freezes time and rewind recovers before collision", () => {
  const e = new Engine(1);
  cross(e, 220, 350);
  run(e, 30, { right: true });
  assert.ok(e.state.dead);
  const time = e.state.time;
  run(e, 30, { right: true });
  assert.equal(e.state.time, time);
  e.tick({ rewind: true });
  assert.equal(e.state.dead, false);
  assert.ok(e.state.time < time);
});
test("bell and bridge persist while blue hazard returns to its earlier position", () => {
  const e = new Engine(3);
  run(e, 80);
  const previous = e.hazardRect()!.x;
  e.tick();
  assert.notEqual(e.hazardRect()!.x, previous);
  e.tick({ rewind: true });
  assert.equal(e.hazardRect()!.x, previous);
  const b = new Engine(2);
  cross(b, 220, 350);
  retrieve(b, 600);
  assert.ok(b.bell);
  returnBefore(b, 530);
  assert.ok(b.bell);
  assert.ok(b.solids.some((s) => s.x === 530 && s.y === 350));
  b.restart();
  assert.equal(b.bell, false);
});
test("save restores branch history, death and amber progress; invalid saves fail closed", () => {
  const e = new Engine();
  retrieve(e, 320);
  const restored = Engine.restore(e.serialize())!;
  assert.ok(restored);
  assert.equal(restored.memories.size, 1);
  const y = restored.state.player.y;
  run(restored, 70, { rewind: true });
  assert.ok(restored.state.player.y < y);
  assert.equal(restored.memories.size, 1);
  for (const raw of [
    "bad",
    "null",
    "{}",
    e.serialize().replace('"version":1', '"version":9'),
    e.serialize().replace('"w":24', '"w":999'),
  ])
    assert.equal(Engine.restore(raw), undefined);
});
test("history is bounded and holding jump does not cause repeated jumps", () => {
  const e = new Engine();
  run(e, HISTORY_LIMIT + 200);
  assert.equal(e.history.length, HISTORY_LIMIT);
  e.tick({ jump: true });
  run(e, 80, { jump: true });
  assert.equal(e.state.player.y, 318);
  assert.ok(e.state.player.grounded);
  e.tick();
  e.tick({ jump: true });
  assert.ok(e.state.player.y < 318);
});
test("completed hour rejects further simulation and restart permits fresh play", () => {
  const e = new Engine();
  retrieve(e, 320);
  returnBefore(e, 250);
  cross(e, 250, 390);
  walk(e, 930);
  const before = e.serialize();
  run(e, 100, { rewind: true, left: true });
  assert.equal(e.serialize(), before);
  e.restart();
  e.tick({ right: true });
  assert.ok(e.state.player.x > 65);
  assert.equal(e.complete, false);
});
