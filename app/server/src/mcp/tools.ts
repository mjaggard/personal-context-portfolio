import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import {
  getDocument,
  getDocuments,
  searchDocuments,
  VALID_FILE_NAMES,
} from "../services/weaviate.js";

function getUserId(extra: { authInfo?: { extra?: Record<string, unknown> } }): string | undefined {
  return extra.authInfo?.extra?.userId as string | undefined;
}

export function registerTools(server: McpServer): void {
  server.tool(
    "get_profile",
    `Get the user's basic profile/identity. Returns their identity.md which contains their name, role, organization, what they do, and what they're known for. Use this as a starting point to understand who you're working with.`,
    {},
    async (_params, extra) => {
      const userId = getUserId(extra);
      if (!userId) {
        return {
          content: [{ type: "text", text: "Error: Not authenticated" }],
        };
      }

      const doc = await getDocument(userId, "identity");
      if (!doc) {
        return {
          content: [
            {
              type: "text",
              text: "No identity file found. The user has not uploaded their identity.md yet.",
            },
          ],
        };
      }

      return { content: [{ type: "text", text: doc.content }] };
    },
  );

  server.tool(
    "search",
    `Search across the user's personal context portfolio using natural language. The portfolio contains files about: identity, role & responsibilities, current projects, team & relationships, tools & systems, communication style, goals & priorities, preferences & constraints, domain knowledge, and decision-making patterns. Use this to find specific information about the user when you're not sure which file contains what you need.`,
    { query: z.string().describe("Natural language search query") },
    async ({ query }, extra) => {
      const userId = getUserId(extra);
      if (!userId) {
        return {
          content: [{ type: "text", text: "Error: Not authenticated" }],
        };
      }

      const results = await searchDocuments(userId, query, 5);
      if (results.length === 0) {
        return {
          content: [
            {
              type: "text",
              text: "No matching results found. The user may not have uploaded any portfolio files yet.",
            },
          ],
        };
      }

      const formatted = results
        .map(
          (r) =>
            `## ${r.fileName} (relevance: ${(r.score * 100).toFixed(0)}%)\n\n${r.content}`,
        )
        .join("\n\n---\n\n");

      return { content: [{ type: "text", text: formatted }] };
    },
  );

  server.tool(
    "get_files",
    `Fetch specific portfolio files by name. Available files and when to use them:
- **identity**: Basic profile — who they are, role, organization
- **role-and-responsibilities**: What their weeks look like operationally
- **current-projects**: Active workstreams, status, priorities, definition of done
- **team-and-relationships**: Key people, interaction patterns, collaboration needs
- **tools-and-systems**: Tech stack, integrations, data sources
- **communication-style**: How they write, tone preferences, formatting preferences — fetch this for ANY writing task
- **goals-and-priorities**: What they're optimizing for, what they're ignoring
- **preferences-and-constraints**: Hard rules, strong opinions, constraints to respect
- **domain-knowledge**: Specialized knowledge the user has that general AI doesn't
- **decision-log**: How they make decisions, with real examples`,
    {
      files: z
        .array(z.enum(VALID_FILE_NAMES as unknown as [string, ...string[]]))
        .describe("Array of file names to fetch"),
    },
    async ({ files }, extra) => {
      const userId = getUserId(extra);
      if (!userId) {
        return {
          content: [{ type: "text", text: "Error: Not authenticated" }],
        };
      }

      const docs = await getDocuments(userId, files);

      if (Object.keys(docs).length === 0) {
        return {
          content: [
            {
              type: "text",
              text: `None of the requested files were found: ${files.join(", ")}. The user may not have uploaded them yet.`,
            },
          ],
        };
      }

      const formatted = Object.entries(docs)
        .map(([name, content]) => `## ${name}\n\n${content}`)
        .join("\n\n---\n\n");

      const missing = files.filter((f) => !(f in docs));
      const missingNote =
        missing.length > 0
          ? `\n\n---\n\nNote: The following requested files were not found: ${missing.join(", ")}`
          : "";

      return {
        content: [{ type: "text", text: formatted + missingNote }],
      };
    },
  );
}
