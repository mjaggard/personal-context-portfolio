import { useState } from "react";

interface Props {
  token: string | null;
}

export function SetupGuide({ token }: Props) {
  const [copied, setCopied] = useState<string | null>(null);

  const serverUrl =
    import.meta.env.VITE_SERVER_URL || window.location.origin;

  function copyToClipboard(text: string, label: string) {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(label);
      setTimeout(() => setCopied(null), 2000);
    });
  }

  const claudeCodeConfig = JSON.stringify(
    {
      mcpServers: {
        "personal-context": {
          type: "streamable-http",
          url: `${serverUrl}/mcp`,
          headers: {
            Authorization: `Bearer ${token || "YOUR_JWT_TOKEN"}`,
          },
        },
      },
    },
    null,
    2,
  );

  const claudeCoworkConfig = JSON.stringify(
    {
      mcpServers: {
        "personal-context": {
          type: "streamable-http",
          url: `${serverUrl}/mcp`,
          headers: {
            Authorization: `Bearer ${token || "YOUR_JWT_TOKEN"}`,
          },
        },
      },
    },
    null,
    2,
  );

  return (
    <div style={{ marginTop: "2rem" }}>
      <h2>Setup Instructions</h2>

      <p style={{ color: "#666", lineHeight: 1.6 }}>
        Connect your Personal Context Portfolio to Claude so it can
        automatically understand who you are, how you work, and what you're
        working on.
      </p>

      <h3>Claude Code (CLI)</h3>
      <p>
        Add this to your Claude Code MCP settings file (
        <code>~/.claude/settings.json</code> or project{" "}
        <code>.mcp.json</code>):
      </p>
      <div style={{ position: "relative" }}>
        <pre
          style={{
            background: "#1e1e1e",
            color: "#d4d4d4",
            padding: "1rem",
            borderRadius: "8px",
            overflow: "auto",
            fontSize: "0.85rem",
            lineHeight: 1.5,
          }}
        >
          {claudeCodeConfig}
        </pre>
        <button
          onClick={() => copyToClipboard(claudeCodeConfig, "claude-code")}
          style={{
            position: "absolute",
            top: "0.5rem",
            right: "0.5rem",
            padding: "0.25rem 0.75rem",
            background: copied === "claude-code" ? "#4ade80" : "#3b3b3b",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
            fontSize: "0.8rem",
          }}
        >
          {copied === "claude-code" ? "Copied!" : "Copy"}
        </button>
      </div>

      <h3>Claude Co-work (Web)</h3>
      <p>
        In Claude Co-work, go to <strong>Settings &rarr; MCP Servers</strong>{" "}
        and add a new Streamable HTTP server with the configuration:
      </p>
      <div style={{ position: "relative" }}>
        <pre
          style={{
            background: "#1e1e1e",
            color: "#d4d4d4",
            padding: "1rem",
            borderRadius: "8px",
            overflow: "auto",
            fontSize: "0.85rem",
            lineHeight: 1.5,
          }}
        >
          {claudeCoworkConfig}
        </pre>
        <button
          onClick={() => copyToClipboard(claudeCoworkConfig, "cowork")}
          style={{
            position: "absolute",
            top: "0.5rem",
            right: "0.5rem",
            padding: "0.25rem 0.75rem",
            background: copied === "cowork" ? "#4ade80" : "#3b3b3b",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
            fontSize: "0.8rem",
          }}
        >
          {copied === "cowork" ? "Copied!" : "Copy"}
        </button>
      </div>

      <h3>Available MCP Tools</h3>
      <p>Once connected, Claude will have access to these tools:</p>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ borderBottom: "2px solid #ddd", textAlign: "left" }}>
            <th style={{ padding: "0.5rem" }}>Tool</th>
            <th style={{ padding: "0.5rem" }}>Description</th>
          </tr>
        </thead>
        <tbody>
          <tr style={{ borderBottom: "1px solid #eee" }}>
            <td style={{ padding: "0.5rem", fontFamily: "monospace" }}>
              get_profile
            </td>
            <td style={{ padding: "0.5rem" }}>
              Returns your identity.md — the quick summary of who you are
            </td>
          </tr>
          <tr style={{ borderBottom: "1px solid #eee" }}>
            <td style={{ padding: "0.5rem", fontFamily: "monospace" }}>
              search
            </td>
            <td style={{ padding: "0.5rem" }}>
              Search across all your portfolio files using natural language
            </td>
          </tr>
          <tr style={{ borderBottom: "1px solid #eee" }}>
            <td style={{ padding: "0.5rem", fontFamily: "monospace" }}>
              get_files
            </td>
            <td style={{ padding: "0.5rem" }}>
              Fetch specific portfolio files by name (e.g., communication-style
              for writing tasks)
            </td>
          </tr>
        </tbody>
      </table>

      <h3>Token Note</h3>
      <p style={{ color: "#666", lineHeight: 1.6 }}>
        The configuration above includes your current access token. Keycloak
        tokens expire — you'll need to update the token periodically, or set
        up a long-lived service account token in Keycloak for persistent MCP
        access.
      </p>
    </div>
  );
}
