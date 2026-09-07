#!/usr/bin/env node
// Launcher for SnipperApp 3's bundled MCP server (snipper-mcp).
//
// On a Mac with SnipperApp 3 installed it hands stdio to the real server.
// Anywhere else (a registry's container, a Mac without the app) it serves the
// static tool manifest itself: `initialize` and `tools/list` work, `tools/call`
// returns a clear "not installed" error. That keeps introspection honest without
// pretending the tools can run.
"use strict";
const { spawn } = require("node:child_process");
const { existsSync } = require("node:fs");
const path = require("node:path");
const readline = require("node:readline");

const VERSION = "1.0.3";
const APP_STORE = "https://apps.apple.com/us/app/snipperapp-3-code-snippets/id6757330954?mt=12";
const home = process.env.HOME || "";
const candidates = [
  process.env.SNIPPER_MCP_PATH || "",
  "/Applications/SnipperApp 3.app/Contents/MacOS/snipper-mcp",
  path.join(home, "Applications/SnipperApp 3.app/Contents/MacOS/snipper-mcp"),
  "/Applications/Setapp/SnipperApp 3.app/Contents/MacOS/snipper-mcp",
].filter(Boolean);

const bin = process.platform === "darwin" ? candidates.find((p) => existsSync(p)) : null;

if (bin) {
  const child = spawn(bin, [], { stdio: "inherit" });
  child.on("error", (err) => { process.stderr.write(`Could not start ${bin}: ${err.message}\n`); process.exit(1); });
  child.on("exit", (code, signal) => process.exit(code ?? (signal ? 1 : 0)));
  for (const sig of ["SIGINT", "SIGTERM", "SIGHUP"]) process.on(sig, () => child.kill(sig));
} else {
  serveManifest();
}

function serveManifest() {
  const { tools } = require("./tools.json");
  const notInstalled =
    "SnipperApp 3 is not installed on this machine, so snippet tools cannot run. " +
    `Install it from the Mac App Store (${APP_STORE}) or Setapp (https://setapp.com/apps/snipperapp-3), ` +
    "or set SNIPPER_MCP_PATH to the snipper-mcp binary. This launcher exposes the tool manifest only.";
  const write = (msg) => process.stdout.write(JSON.stringify(msg) + "\n");
  const reply = (id, result) => write({ jsonrpc: "2.0", id, result });
  const fail = (id, code, message) => write({ jsonrpc: "2.0", id, error: { code, message } });

  const rl = readline.createInterface({ input: process.stdin, crlfDelay: Infinity });
  rl.on("line", (line) => {
    if (!line.trim()) return;
    let msg;
    try { msg = JSON.parse(line); } catch { return write({ jsonrpc: "2.0", id: null, error: { code: -32700, message: "Parse error" } }); }
    const { id, method, params } = msg;
    const isNotification = id === undefined || id === null;
    switch (method) {
      case "initialize":
        return reply(id, {
          protocolVersion: (params && params.protocolVersion) || "2024-11-05",
          capabilities: { tools: {}, resources: {} },
          serverInfo: { name: "snipper", version: `${VERSION}-launcher` },
          instructions: notInstalled,
        });
      case "notifications/initialized":
      case "notifications/cancelled":
        return;
      case "ping":
        return reply(id, {});
      case "tools/list":
        return reply(id, { tools });
      case "tools/call":
        return reply(id, { content: [{ type: "text", text: notInstalled }], isError: true });
      case "resources/list":
        return reply(id, { resources: [] });
      case "resources/templates/list":
        return reply(id, { resourceTemplates: [] });
      case "prompts/list":
        return reply(id, { prompts: [] });
      default:
        if (!isNotification) fail(id, -32601, `Method not found: ${method}`);
    }
  });
  rl.on("close", () => process.exit(0));
}
