# Personal Context Portfolio - MCP Server & Upload UI

An MCP (Model Context Protocol) server that serves your Personal Context Portfolio to Claude Code and Claude Co-work, plus a web UI for uploading and managing your portfolio files.

## Architecture

- **Server** (`server/`): Express + MCP server (TypeScript) with Weaviate for vector search and Keycloak JWT auth
- **Client** (`client/`): React upload UI (TypeScript + Vite) with Keycloak login

## Prerequisites

- Node.js 20+
- A running [Weaviate](https://weaviate.io/) instance (default: `localhost:8080`)
- A running [Keycloak](https://www.keycloak.org/) instance (default: `localhost:8180`) with a realm and client configured

## Setup

### 1. Configure environment

```bash
cp .env.example .env
# Edit .env with your Weaviate and Keycloak details
```

### 2. Keycloak configuration

In your Keycloak admin console:

1. Create a realm (e.g., `portfolio`)
2. Create a client (e.g., `portfolio-app`) with:
   - Client authentication: OFF (public client for the browser)
   - Valid redirect URIs: `http://localhost:5173/*`
   - Web origins: `http://localhost:5173`
3. Create users as needed

### 3. Install and run

```bash
# Server
cd server
npm install
npm run dev

# Client (in a separate terminal)
cd client
npm install
npm run dev
```

The server starts on `http://localhost:3001` and the client on `http://localhost:5173`.

## MCP Tools

The server exposes three MCP tools:

| Tool | Description |
|------|-------------|
| `get_profile` | Returns the user's identity.md — who they are, their role, what they do |
| `search` | Natural language search across all portfolio files using Weaviate vector search |
| `get_files` | Fetch specific portfolio files by name (e.g., `communication-style` for writing tasks) |

## Connecting to Claude

### Claude Code (CLI)

Add to `~/.claude/settings.json` or your project's `.mcp.json`:

```json
{
  "mcpServers": {
    "personal-context": {
      "type": "streamable-http",
      "url": "http://localhost:3001/mcp",
      "headers": {
        "Authorization": "Bearer YOUR_JWT_TOKEN"
      }
    }
  }
}
```

### Claude Co-work (Web)

In Claude Co-work, go to **Settings > MCP Servers** and add a new Streamable HTTP server:

- **URL**: `http://localhost:3001/mcp` (or your deployed server URL)
- **Headers**: `Authorization: Bearer YOUR_JWT_TOKEN`

### Getting a JWT Token

You can get a token from Keycloak using:

```bash
curl -X POST "http://localhost:8180/realms/portfolio/protocol/openid-connect/token" \
  -d "client_id=portfolio-app" \
  -d "username=YOUR_USERNAME" \
  -d "password=YOUR_PASSWORD" \
  -d "grant_type=password"
```

Or log in to the upload UI — the Setup Guide tab shows your current token in the configuration snippet.

## API Endpoints

All endpoints require a valid JWT in the `Authorization: Bearer <token>` header.

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/files` | List uploaded files |
| GET | `/api/files/:fileName` | Get a file's content |
| PUT | `/api/files/:fileName` | Upload/update a file |
| DELETE | `/api/files/:fileName` | Delete a file |
| POST | `/mcp` | MCP Streamable HTTP endpoint |
| GET | `/health` | Health check |

## Portfolio File Types

| File | Use case |
|------|----------|
| `identity` | Basic profile — who you are |
| `role-and-responsibilities` | What your weeks look like |
| `current-projects` | Active workstreams and status |
| `team-and-relationships` | Key people and collaboration |
| `tools-and-systems` | Your tech stack |
| `communication-style` | How you write (fetch for any writing task) |
| `goals-and-priorities` | What you're optimizing for |
| `preferences-and-constraints` | Hard rules and strong opinions |
| `domain-knowledge` | Your specialized expertise |
| `decision-log` | How you make decisions |
