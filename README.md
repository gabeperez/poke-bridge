# poke-bridge

> Send voice commands to your [Poke](https://poke.com) AI assistant via [VoiceOS](https://voiceos.com).

Say something → VoiceOS routes it → Poke acts on it → reply arrives in iMessage.

---

## What It Does

`poke-bridge` is a local [MCP](https://modelcontextprotocol.io) server that bridges VoiceOS (a voice-controlled macOS AI assistant) to Poke (an iMessage-based AI assistant). Speak a command, and it gets forwarded to Poke's API — which then executes it using your email, calendar, reminders, and other connected integrations.

```
You speak → VoiceOS → poke-bridge (MCP stdio) → Poke API → Poke acts → iMessage reply
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

## Requirements

- macOS
- [VoiceOS](https://voiceos.com) installed
- [Poke](https://poke.com) account with a **V2 API key** (from [Kitchen](https://poke.com/kitchen) → API Keys)
- Node.js (via [nvm](https://github.com/nvm-sh/nvm) or direct install)

---

## Setup

### 1. Clone the repo

```bash
git clone https://github.com/gabeperez/poke-bridge.git
cd poke-bridge
```

### 2. Install dependencies

```bash
npm install
```

### 3. Add your Poke API key

Copy the example start script and add your key:

```bash
cp start.sh.example start.sh
chmod +x start.sh
```

Open `start.sh` and replace `your_v2_key_here` with your actual Poke V2 API key:

```bash
export POKE_API_KEY="your_v2_key_here"
```

> ⚠️ `start.sh` is gitignored — your key will never be committed.

### 4. Connect to VoiceOS

Open VoiceOS → **Settings → Integrations → Custom Integrations → Add**

| Field | Value |
|---|---|
| **Name** | 🌴 Poke |
| **Launch command** | `/absolute/path/to/poke-bridge/start.sh` |

Use the full absolute path — no spaces in the path, no inline env vars (VoiceOS throws `ENAMETOOLONG` otherwise). This is why we use a wrapper script.

---

## Voice Command Examples

- *"Ask Poke to remind me to call the client tomorrow at 9am"*
- *"Tell Poke to draft an email to the team about Friday's deadline"*
- *"Have Poke add a team standup to my calendar Monday at 10am"*
- *"Send to Poke: what's on my calendar today?"*

---

## How Messages Appear

Poke receives API messages as a webhook — they don't appear on your side of the iMessage thread, but Poke acts on them and replies normally. Every message is prefixed with `[VoiceOS]` so Poke knows the source context.

---

## Project Structure

```
poke-bridge/
├── poke-bridge.ts     # MCP server (TypeScript)
├── start.sh           # Launch wrapper with API key (gitignored)
├── start.sh.example   # Template — copy to start.sh and add your key
├── package.json
├── tsconfig.json
└── README.md
```

---

## Why a Wrapper Script?

VoiceOS launches MCP servers via stdio and doesn't support inline environment variables in the launch command (`KEY=value command` throws `ENAMETOOLONG`). The `start.sh` wrapper exports the key before launching the TypeScript server, keeping things clean.

---

## API Reference

This bridge uses the [Poke V2 API](https://poke.com/docs/developers/api):

```
POST https://poke.com/api/v1/inbound/api-message
Authorization: Bearer YOUR_V2_KEY
Content-Type: application/json

{ "message": "[VoiceOS] your instruction here", "source": "VoiceOS" }
```

> ⚠️ The legacy `/api/v1/inbound-sms/webhook` endpoint and `pk_`-prefixed V1 keys are **not** supported. You must use a V2 key created in [Kitchen](https://poke.com/kitchen).

---

## Contributing

PRs welcome. If you add new tools (e.g. `poke_search`, `poke_task`), follow the existing pattern in `poke-bridge.ts` and update this README.

---

## License

MIT
