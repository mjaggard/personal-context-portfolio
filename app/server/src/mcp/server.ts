import { Router, Request, Response } from "express";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { IncomingMessage } from "node:http";
import { registerTools } from "./tools.js";
import { validateToken } from "../auth/jwt.js";

export const mcpRouter = Router();

// Create a new MCP server instance with tools registered
function createMcpServer(): McpServer {
  const server = new McpServer({
    name: "personal-context-portfolio",
    version: "1.0.0",
  });
  registerTools(server);
  return server;
}

// Map of session ID to { transport, userId }
const sessions = new Map<
  string,
  { transport: StreamableHTTPServerTransport; userId: string }
>();

async function authenticateRequest(
  req: Request,
): Promise<string> {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    throw new Error("Missing or invalid Authorization header");
  }
  return validateToken(authHeader.slice(7));
}

mcpRouter.post("/", async (req: Request, res: Response) => {
  let userId: string;
  try {
    userId = await authenticateRequest(req);
  } catch {
    res.status(401).json({ error: "Invalid or expired token" });
    return;
  }

  // Attach auth info to the request so the transport passes it to tool handlers
  (req as unknown as IncomingMessage & { auth?: unknown }).auth = {
    token: req.headers.authorization!.slice(7),
    clientId: "portfolio-app",
    scopes: [],
    extra: { userId },
  };

  // Check for existing session
  const sessionId = req.headers["mcp-session-id"] as string | undefined;

  if (sessionId && sessions.has(sessionId)) {
    const session = sessions.get(sessionId)!;
    await session.transport.handleRequest(req, res, req.body);
    return;
  }

  // New session — create transport and server
  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: () => crypto.randomUUID(),
    onsessioninitialized: (id) => {
      sessions.set(id, { transport, userId });
    },
  });

  transport.onclose = () => {
    const sid = [...sessions.entries()].find(
      ([, s]) => s.transport === transport,
    )?.[0];
    if (sid) sessions.delete(sid);
  };

  const server = createMcpServer();
  await server.connect(transport);
  await transport.handleRequest(req, res, req.body);
});

// Handle GET for SSE streams (session resumption)
mcpRouter.get("/", async (req: Request, res: Response) => {
  const sessionId = req.headers["mcp-session-id"] as string | undefined;
  if (!sessionId || !sessions.has(sessionId)) {
    res.status(400).json({ error: "Invalid or missing session ID" });
    return;
  }

  const session = sessions.get(sessionId)!;
  await session.transport.handleRequest(req, res);
});

// Handle DELETE for session cleanup
mcpRouter.delete("/", async (req: Request, res: Response) => {
  const sessionId = req.headers["mcp-session-id"] as string | undefined;
  if (!sessionId || !sessions.has(sessionId)) {
    res.status(400).json({ error: "Invalid or missing session ID" });
    return;
  }

  const session = sessions.get(sessionId)!;
  await session.transport.handleRequest(req, res);
  sessions.delete(sessionId);
});
