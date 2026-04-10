import express from "express";
import cors from "cors";
import { config } from "./config.js";
import { initWeaviate } from "./services/weaviate.js";
import { uploadRouter } from "./routes/upload.js";
import { mcpRouter } from "./mcp/server.js";

const app = express();

app.use(cors({ origin: config.clientUrl, credentials: true }));
app.use(express.json({ limit: "1mb" }));

// REST API for file management
app.use("/api", uploadRouter);

// MCP endpoint (Streamable HTTP)
app.use("/mcp", mcpRouter);

// Health check
app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

async function start() {
  await initWeaviate();
  app.listen(config.port, () => {
    console.log(`Portfolio MCP server running on port ${config.port}`);
    console.log(`MCP endpoint: http://localhost:${config.port}/mcp`);
    console.log(`Upload API: http://localhost:${config.port}/api/files`);
  });
}

start().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
