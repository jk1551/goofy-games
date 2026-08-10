import { spawn } from "node:child_process";

const processes = [
  spawn("npm", ["run", "dev", "-w", "@goofy-games/server"], { stdio: "inherit", shell: true }),
  spawn("npm", ["run", "dev", "-w", "@goofy-games/client"], { stdio: "inherit", shell: true })
];

function shutdown(signal = "SIGTERM") {
  for (const child of processes) {
    if (!child.killed) {
      child.kill(signal);
    }
  }
}

for (const child of processes) {
  child.on("exit", (code) => {
    if (code && code !== 0) {
      shutdown();
      process.exitCode = code;
    }
  });
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
