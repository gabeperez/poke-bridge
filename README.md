# poke-bridge

> An MCP server that connects AI assistants to [Poke](https://poke.com) — your iMessage-based AI agent.

Send instructions to Poke by voice, from Claude, from your terminal, or anywhere that supports MCP.

---

## Quick Video DEmo

https://github.com/user-attachments/assets/b5496a0f-8a88-4f0e-9eea-3f1e7859881f

---

## What Is Poke?

[Poke](https://poke.com) is an AI assistant you interact with over iMessage. It can send emails, manage your calendar, set reminders, and more — all through a simple text conversation. `poke-bridge` lets you trigger Poke programmatically from any MCP-compatible client or script.

---

## How It Works

```
Your client (VoiceOS / Claude / terminal / cron)
         ↓
   poke-bridge (MCP server)
         ↓
   Poke API (POST /inbound/api-message)
         ↓
   Poke acts on your instruction
         ↓
   Reply arrives in iMessage
```

---

## Tools Exposed

| Tool | What it does |
|---|---|
| `send_to_poke` | General-purpose — send any message or instruction |
| `poke_reminder` | Set a reminder with a task + time |
| `poke_draft_email` | Ask Poke to draft or send an email |
| `poke_schedule` | Add a calendar event via Poke |

---

## Configuration

| Variable | Required | Default | Description |
|---|---|---|---|
| `POKE_API_KEY` | Yes | — | Your Poke V2 API key from [Kitchen](https://poke.com/kitchen) |
| `POKE_SOURCE` | No | `poke-bridge` | Label prefixed to messages so Poke knows where they came from (e.g. `VoiceOS`, `Claude Desktop`, `Cursor`) |

---

## Requirements

- [Poke](https://poke.com) account with a **V2 API key** from [Kitchen](https://poke.com/kitchen) → API Keys
- Node.js 18+

---

## Setup

### 1. Clone and install

```bash
git clone https://github.com/gabeperez/poke-bridge.git
cd poke-bridge
npm install
```

### 2. Configure your API key

**macOS / Linux:**
```bash
cp start.sh.example start.sh
chmod +x start.sh
```
Open `start.sh` and replace `your_v2_key_here` with your Poke V2 API key.

**Windows:**
```cmd
copy start.cmd.example start.cmd
```
Open `start.cmd` and replace `your_v2_key_here` with your Poke V2 API key.

> ⚠️ `start.sh` and `start.cmd` are gitignored. Your key will never be committed.

---

## Usage

### With VoiceOS

[VoiceOS](https://voiceos.com) is a voice productivity app that lets you control your computer by speaking. Add poke-bridge as a custom integration:

**Settings → Integrations → Custom Integrations → Add**

| Field | Value |
|---|---|
| Name | 🌴 Poke |
| Launch command (macOS) | `/absolute/path/to/poke-bridge/start.sh` |
| Launch command (Windows) | `C:\absolute\path\to\poke-bridge\start.cmd` |

Then speak naturally:

- *"Ask Poke to remind me to call the client tomorrow at 9am"*
- *"Tell Poke to draft an email to the team about Friday's deadline"*
- *"Have Poke add a standup to my calendar Monday at 10am"*
- *"Ask Poke what's on my calendar today"*

> **Why a wrapper script?** VoiceOS throws `ENAMETOOLONG` if you pass inline env vars (`KEY=value command`). The wrapper script exports your key cleanly before launching the server. On Windows, `.sh` files won't work — use `start.cmd` instead.

---

### With Claude Desktop

Add to your Claude Desktop config:

- **macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows:** `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "poke": {
      "command": "/absolute/path/to/poke-bridge/node_modules/.bin/tsx",
      "args": ["/absolute/path/to/poke-bridge/poke-bridge.ts"],
      "env": {
        "POKE_API_KEY": "your_v2_key_here",
        "POKE_SOURCE": "Claude Desktop"
      }
    }
  }
}
```

**Windows** — use `tsx.cmd` and backslashes:
```json
{
  "mcpServers": {
    "poke": {
      "command": "C:\\path\\to\\poke-bridge\\node_modules\\.bin\\tsx.cmd",
      "args": ["C:\\path\\to\\poke-bridge\\poke-bridge.ts"],
      "env": {
        "POKE_API_KEY": "your_v2_key_here"
      }
    }
  }
}
```

Restart Claude Desktop after saving.

---

### With Cursor / Windsurf

Same config as Claude Desktop above. Add to your editor's MCP settings file and restart.

---

### From the terminal (no MCP needed)

**macOS / Linux:**
```bash
curl -X POST https://poke.com/api/v1/inbound/api-message \
  -H "Authorization: Bearer YOUR_KEY" \
  -H "Content-Type: application/json" \
  -d '{"message": "will it rain today?"}'
```

**Windows CMD** — use escaped double quotes, no single quotes:
```cmd
curl -X POST https://poke.com/api/v1/inbound/api-message -H "Authorization: Bearer YOUR_KEY" -H "Content-Type: application/json" -d "{\"message\": \"will it rain today?\"}"
```

Expected response:
```json
{"success": true, "message": "Message sent successfully"}
```

---

### From a cron job or script

```bash
#!/bin/bash
export POKE_API_KEY="your_v2_key_here"

curl -s -X POST https://poke.com/api/v1/inbound/api-message \
  -H "Authorization: Bearer $POKE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"message": "The build finished. Add a note to my todo list."}'
```

---

### From macOS Shortcuts

Use a **Get Contents of URL** action:

- **URL:** `https://poke.com/api/v1/inbound/api-message`
- **Method:** POST
- **Headers:** `Authorization: Bearer YOUR_KEY`, `Content-Type: application/json`
- **Request Body:** JSON — `{"message": "your instruction here", "source": "Shortcuts"}`

Pair it with a Siri phrase for fully voice-triggered Poke on iPhone or Apple Watch.

---

## How Messages Appear

Poke receives messages via API as a webhook — they don't show on your side of the iMessage thread, but Poke acts on them and replies normally in iMessage. Every message sent through this bridge is prefixed with `[poke-bridge]` (or your custom `POKE_SOURCE`) so Poke has context about where it came from.

---

## Project Structure

```
poke-bridge/
├── poke-bridge.ts      # MCP server source (TypeScript)
├── poke-bridge.mjs     # Runtime entrypoint used by launch scripts
├── start.sh            # macOS/Linux launch wrapper (gitignored)
├── start.sh.example    # macOS/Linux template
├── start.cmd           # Windows launch wrapper (gitignored)
├── start.cmd.example   # Windows template
├── package.json
├── tsconfig.json
├── .gitignore
└── README.md
```

---

## API Reference

This bridge uses the [Poke V2 API](https://poke.com/docs/developers/api):

```
POST https://poke.com/api/v1/inbound/api-message
Authorization: Bearer YOUR_V2_KEY
Content-Type: application/json

{"message": "[poke-bridge] your instruction here", "source": "poke-bridge"}
```

> ⚠️ The legacy `/api/v1/inbound-sms/webhook` endpoint and `pk_`-prefixed V1 keys are **not** supported. Create a V2 key in [Kitchen](https://poke.com/kitchen).

---

## Contributing

PRs welcome. Ideas for new tools: `poke_search`, `poke_task`, `poke_note`. Follow the existing pattern in `poke-bridge.ts` and update this README.

---

## License

MIT
