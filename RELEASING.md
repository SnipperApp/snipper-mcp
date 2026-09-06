# Releasing

1. Bump `version` in `mcpb/manifest.json` and `server.json`.
2. `npx @anthropic-ai/mcpb pack mcpb snipperapp-<version>.mcpb` and `shasum -a 256 snipperapp-<version>.mcpb`; put the hash in `server.json` (`fileSha256`) and the release URL in `identifier`.
3. `gh release create v<version> snipperapp-<version>.mcpb --title "v<version>" --notes "..."`.
4. Official MCP registry (one-time login, then per release):
   ```bash
   brew install mcp-publisher   # or download from github.com/modelcontextprotocol/registry/releases
   mcp-publisher login github    # device flow in the browser; namespace io.github.SnipperApp/*
   mcp-publisher publish         # reads server.json
   ```
5. Claude connectors directory (desktop extensions): submit the release .mcpb through the form linked at https://claude.com/docs/connectors/building/submission.
6. Smithery: "Local MCPB bundle publishing" at https://smithery.ai/docs/build/publish.
