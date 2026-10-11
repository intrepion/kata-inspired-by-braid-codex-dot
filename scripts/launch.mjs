import { spawn } from "node:child_process";
import { openSync, writeFileSync } from "node:fs";
import net from "node:net";
const port = Number(process.argv[2] || 5191);
if (!Number.isInteger(port) || port < 1024 || port > 65535)
  throw Error("Invalid port");
const free = await new Promise((resolve) => {
  const probe = net.createServer();
  probe.once("error", () => resolve(false));
  probe.listen(port, "127.0.0.1", () => probe.close(() => resolve(true)));
});
if (!free)
  throw Error(
    `Port ${port} is occupied. Existing servers were left untouched.`,
  );
const log = openSync("play-server.log", "a");
const child = spawn(process.execPath, ["scripts/serve.mjs", String(port)], {
  cwd: process.cwd(),
  detached: true,
  stdio: ["ignore", log, log],
});
child.unref();
writeFileSync(".server.pid", String(child.pid));
console.log(
  `Session-only server PID ${child.pid}; http://127.0.0.1:${port}. No login/boot service installed.`,
);
