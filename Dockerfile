# Runs the launcher only. SnipperApp 3 (and its bundled snipper-mcp binary) exists
# on macOS, so in a container the launcher serves the static tool manifest: it
# answers initialize / tools/list and returns a clear error on tools/call.
# This is what registries use for introspection checks.
FROM node:20-alpine
WORKDIR /app
COPY mcpb/server ./server
ENTRYPOINT ["node", "/app/server/index.js"]
