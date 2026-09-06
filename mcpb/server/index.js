#!/usr/bin/env node
// MCPB launcher for SnipperApp 3's bundled MCP server.
// The server (snipper-mcp) ships inside the app; this script only finds it and
// hands over stdio, so Claude Desktop can install it as a one-click extension.
const { spawn } = require("node:child_process");
const { existsSync } = require("node:fs");
const path = require("node:path");

const home = process.env.HOME || "";
const candidates = [
  "/Applications/SnipperApp 3.app/Contents/MacOS/snipper-mcp",
  path.join(home, "Applications/SnipperApp 3.app/Contents/MacOS/snipper-mcp"),
  "/Applications/Setapp/SnipperApp 3.app/Contents/MacOS/snipper-mcp",
  process.env.SNIPPER_MCP_PATH || "",
].filter(Boolean);

const bin = candidates.find((p) => existsSync(p));
if (!bin) {
  console.error(
    "SnipperApp 3 is not installed (looked in /Applications, ~/Applications and /Applications/Setapp).\n" +
      "Install it from the Mac App Store: https://apps.apple.com/us/app/snipperapp-3-code-snippets/id6757330954?mt=12\n" +
      "or set SNIPPER_MCP_PATH to the snipper-mcp binary.",
  );
  process.exit(1);
}

const child = spawn(bin, [], { stdio: "inherit" });
child.on("error", (err) => { console.error(`Could not start ${bin}: ${err.message}`); process.exit(1); });
child.on("exit", (code, signal) => process.exit(code ?? (signal ? 1 : 0)));
for (const sig of ["SIGINT", "SIGTERM", "SIGHUP"]) process.on(sig, () => child.kill(sig));
