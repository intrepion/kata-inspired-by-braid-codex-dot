import { Engine } from "./engine";
export function render(
  ctx: CanvasRenderingContext2D,
  e: Engine,
  wallTime: number,
) {
  const { player: p, time } = e.state;
  const t = time / 60;
  ctx.clearRect(0, 0, 960, 640);
  const bg = ctx.createLinearGradient(0, 0, 0, 640);
  bg.addColorStop(0, "#182d46");
  bg.addColorStop(0.6, "#2d5260");
  bg.addColorStop(1, "#0b2330");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, 960, 640);
  ctx.fillStyle = "#dbd7bc";
  ctx.globalAlpha = 0.75;
  ctx.beginPath();
  ctx.arc(745, 88, 38, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;
  // Distant observatory, stars, quiet moving water.
  for (let i = 0; i < 55; i++) {
    ctx.fillStyle = `rgba(202,230,225,${0.15 + (i % 4) * 0.1})`;
    ctx.fillRect((i * 173 + 31) % 960, 20 + ((i * 47) % 200), 1.5, 1.5);
  }
  ctx.strokeStyle = "#91b6b22b";
  ctx.lineWidth = 2;
  for (let i = 0; i < 7; i++) {
    const x = 40 + i * 145;
    ctx.beginPath();
    ctx.moveTo(x, 340);
    ctx.lineTo(x, 150);
    ctx.bezierCurveTo(x, 70, x + 90, 70, x + 90, 150);
    ctx.lineTo(x + 90, 340);
    ctx.stroke();
  }
  ctx.fillStyle = "#16303e88";
  ctx.beginPath();
  ctx.moveTo(0, 300);
  for (let x = 0; x <= 960; x += 20)
    ctx.lineTo(x, 275 + Math.sin(x / 120) * 30);
  ctx.lineTo(960, 640);
  ctx.lineTo(0, 640);
  ctx.fill();
  // Dial behind the level, reversing with the world clock.
  ctx.save();
  ctx.translate(485, 210);
  ctx.strokeStyle = "#b6d3c52a";
  ctx.lineWidth = 1;
  for (const radius of [93, 100, 121]) {
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
    ctx.stroke();
  }
  for (let i = 0; i < 12; i++) {
    const a = (i * Math.PI) / 6;
    ctx.beginPath();
    ctx.moveTo(Math.cos(a) * 103, Math.sin(a) * 103);
    ctx.lineTo(Math.cos(a) * 114, Math.sin(a) * 114);
    ctx.stroke();
  }
  ctx.rotate(t / 15);
  ctx.beginPath();
  ctx.moveTo(-18, 0);
  ctx.lineTo(83, 0);
  ctx.stroke();
  ctx.restore();
  for (const r of e.level.platforms) {
    ctx.fillStyle = "#172f39";
    ctx.fillRect(r.x, r.y, r.w, r.h);
    ctx.fillStyle = "#80a6a0";
    ctx.fillRect(r.x, r.y, r.w, 4);
    ctx.fillStyle = "#3b6262";
    ctx.fillRect(r.x, r.y + 4, r.w, 12);
    ctx.strokeStyle = "#43606a44";
    for (let y = r.y + 25; y < 640; y += 29) {
      ctx.beginPath();
      ctx.moveTo(r.x, y);
      ctx.lineTo(r.x + r.w, y);
      ctx.stroke();
      for (
        let x = r.x + (Math.round(y / 29) % 2) * 25;
        x < r.x + r.w;
        x += 50
      ) {
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x, y + 29);
        ctx.stroke();
      }
    }
    ctx.strokeStyle = "#4e8181";
    ctx.lineWidth = 1;
    for (let x = r.x + 18; x < r.x + r.w - 4; x += 31) {
      ctx.beginPath();
      ctx.moveTo(x, r.y);
      ctx.lineTo(x - 3, r.y - 9);
      ctx.lineTo(x + 3, r.y - 15);
      ctx.stroke();
    }
  }
  for (const [a, b] of e.level.pits) {
    const glow = ctx.createLinearGradient(0, 350, 0, 590);
    glow.addColorStop(0, "#68aec90b");
    glow.addColorStop(1, "#548bab39");
    ctx.fillStyle = glow;
    ctx.fillRect(a, 350, b - a, 240);
    ctx.strokeStyle = "#7bacbd22";
    for (let y = 395; y < 580; y += 30) {
      ctx.beginPath();
      ctx.moveTo(a + 10, y);
      ctx.bezierCurveTo(
        a + 45,
        y + Math.sin(t + y) * 4,
        b - 45,
        y - 3,
        b - 10,
        y,
      );
      ctx.stroke();
    }
    ctx.fillStyle = "#82b1bd";
    ctx.font = "10px system-ui";
    ctx.textAlign = "center";
    ctx.fillText("VAULT", (a + b) / 2, 617);
  }
  if (e.bell) {
    const [a, b] = e.level.pits.at(-1)!;
    ctx.fillStyle = "#c39b56";
    ctx.fillRect(a, 350, b - a, 9);
    ctx.strokeStyle = "#e7c684";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(a, 350);
    ctx.quadraticCurveTo((a + b) / 2, 332, b, 350);
    ctx.stroke();
  }
  for (const m of e.level.memories) {
    if (e.memories.has(m.id)) {
      ctx.strokeStyle = "#d5b97566";
      ctx.beginPath();
      ctx.arc(m.x, m.y, 14, 0, Math.PI * 2);
      ctx.stroke();
      continue;
    }
    const r = 22 + Math.sin(t * 2) * 3;
    const glow = ctx.createRadialGradient(m.x, m.y, 0, m.x, m.y, r * 2);
    glow.addColorStop(0, "#efcf9388");
    glow.addColorStop(1, "#efcf9300");
    ctx.fillStyle = glow;
    ctx.fillRect(m.x - r * 2, m.y - r * 2, r * 4, r * 4);
    ctx.save();
    ctx.translate(m.x, m.y);
    ctx.rotate(Math.PI / 4);
    ctx.fillStyle = "#f5d28b";
    ctx.fillRect(-8, -8, 16, 16);
    ctx.strokeStyle = "#fff3c5";
    ctx.strokeRect(-5, -5, 10, 10);
    ctx.restore();
  }
  const bell = e.level.bell;
  if (bell) {
    ctx.fillStyle = e.bell ? "#f3d18b" : "#ae925c";
    ctx.beginPath();
    ctx.moveTo(bell.x - 15, bell.y + 6);
    ctx.quadraticCurveTo(bell.x - 16, bell.y - 20, bell.x, bell.y - 21);
    ctx.quadraticCurveTo(bell.x + 16, bell.y - 20, bell.x + 15, bell.y + 6);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.arc(bell.x, bell.y + 10, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.font = "10px system-ui";
    ctx.textAlign = "center";
    ctx.fillText(e.bell ? "AWAKE" : "TOUCH THE BELL", bell.x, bell.y - 33);
  }
  const hazard = e.hazardRect();
  if (hazard) {
    if (e.level.hazard === "spikes") {
      ctx.fillStyle = "#af9bac";
      for (let x = hazard.x; x < hazard.x + hazard.w; x += 8) {
        ctx.beginPath();
        ctx.moveTo(x, 350);
        ctx.lineTo(x + 4, 334);
        ctx.lineTo(x + 8, 350);
        ctx.fill();
      }
    } else {
      ctx.strokeStyle = "#8cc7d7";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(386, 175);
      ctx.lineTo(hazard.x + 12, 310);
      ctx.stroke();
      ctx.fillStyle = "#7fafc2";
      ctx.beginPath();
      ctx.arc(hazard.x + 12, 318, 18, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#c4e9ed";
      ctx.stroke();
      ctx.fillStyle = "#b8d7dc";
      ctx.font = "10px system-ui";
      ctx.textAlign = "center";
      ctx.fillText("BLUE TIME", 386, 163);
    }
  }
  // Door: objectives drawn directly into the world.
  ctx.fillStyle = e.ready ? "#dab772" : "#304e60";
  ctx.beginPath();
  ctx.roundRect(914, 276, 36, 74, [18, 18, 0, 0]);
  ctx.fill();
  ctx.strokeStyle = e.ready ? "#fff0b9" : "#73929c";
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = "#122c3a";
  ctx.fillRect(920, 308, 24, 42);
  ctx.fillStyle = e.ready ? "#f4d992" : "#6a8994";
  ctx.beginPath();
  ctx.arc(938, 328, 2, 0, Math.PI * 2);
  ctx.fill();
  if (!e.ready) {
    ctx.fillStyle = "#8cafbe66";
    ctx.fillRect(900, 0, 3, 350);
  }
  ctx.textAlign = "center";
  ctx.fillStyle = e.ready ? "#f4d992" : "#90b1bd";
  ctx.font = "10px system-ui";
  ctx.fillText(e.ready ? "RETURN" : "MEMORIES OPEN THE WAY", 855, 260);
  // Iona, a hand-drawn silhouette with a warm lantern.
  ctx.save();
  ctx.translate(p.x + 12, p.y + 16);
  if (e.state.dead) ctx.rotate(-0.6);
  ctx.fillStyle = "#142b3e";
  ctx.beginPath();
  ctx.moveTo(-8, -1);
  ctx.lineTo(-13, 17);
  ctx.lineTo(12, 17);
  ctx.lineTo(7, -1);
  ctx.fill();
  ctx.fillStyle = "#d1a782";
  ctx.beginPath();
  ctx.arc(0, -9, 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#dde0bd";
  ctx.beginPath();
  ctx.moveTo(-8, -12);
  ctx.quadraticCurveTo(0, -24, 8, -12);
  ctx.lineTo(7, -5);
  ctx.lineTo(-7, -5);
  ctx.fill();
  ctx.fillStyle = "#a16f67";
  ctx.fillRect(-7, -3, 16, 4);
  ctx.fillStyle = "#82a7aa";
  ctx.fillRect(-9, 3, 18, 12);
  ctx.fillStyle = "#152a36";
  const walk = p.grounded ? Math.sin(t * 12) * 2 : 0;
  ctx.fillRect(-7, 14, 5, 5 + walk);
  ctx.fillRect(3, 14, 5, 5 - walk);
  ctx.strokeStyle = "#debf9a";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(7, 2);
  ctx.lineTo(17, 7);
  ctx.stroke();
  const light = ctx.createRadialGradient(18, 9, 1, 18, 9, 45);
  light.addColorStop(0, "#ffdd9477");
  light.addColorStop(1, "#ffdd9400");
  ctx.fillStyle = light;
  ctx.fillRect(-28, -37, 92, 92);
  ctx.fillStyle = "#f8d693";
  ctx.fillRect(15, 7, 7, 9);
  ctx.restore();
  if (e.rewinding) {
    ctx.fillStyle = "#7fcbe912";
    ctx.fillRect(0, 0, 960, 640);
    for (let i = 0; i < e.history.length; i += 12) {
      if (i < e.history.length - 120) continue;
      const past = e.history[i].player;
      ctx.fillStyle = "#aae3ed18";
      ctx.fillRect(past.x, past.y, 24, 32);
    }
  }
  // Decorative fireflies: reduced motion uses stable positions.
  const motion = matchMedia("(prefers-reduced-motion: reduce)").matches
    ? 0
    : wallTime / 3000;
  for (let i = 0; i < 12; i++) {
    ctx.fillStyle = "#f3d59c77";
    ctx.beginPath();
    ctx.arc(
      (i * 83 + 49) % 960,
      220 + Math.sin(i * 12 + motion) * 60,
      1.4,
      0,
      Math.PI * 2,
    );
    ctx.fill();
  }
}
