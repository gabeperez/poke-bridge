#!/usr/bin/env tsx
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const POKE_API_URL = "https://poke.com/api/v1/inbound/api-message";
const API_KEY = process.env.POKE_API_KEY;

function logError(message: string, error?: unknown) {
  const detail = error instanceof Error ? error.stack || error.message : error ? String(error) : "";
  process.stderr.write(detail ? `[poke-bridge] ${message}: ${detail}\n` : `[poke-bridge] ${message}\n`);
}

async function sendToPoke(message: string): Promise<{ ok: boolean; text: string }> {
  if (!API_KEY) {
    return { ok: false, text: "POKE_API_KEY is not set in the environment." };
  }

  const payload = {
    message: `[VoiceOS] ${message}`,
    source: "VoiceOS",
  };

  try {
    const response = await fetch(POKE_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${API_KEY}`,
      },
      body: JSON.stringify(payload),
    });

    const responseText = await response.text();

    if (!response.ok) {
      logError("Poke API request failed", `${response.status} ${response.statusText} ${responseText}`);
      return { ok: false, text: `Poke API request failed (${response.status}). ${responseText}` };
    }

    return { ok: true, text: responseText };
  } catch (error) {
    logError("Unexpected error", error);
    return { ok: false, text: `Error: ${error instanceof Error ? error.message : String(error)}` };
  }
}

const server = new McpServer({
  name: "poke-bridge",
  version: "1.0.0",
});

server.tool(
  "send_to_poke",
  "Send a message or instruction to your Poke AI assistant. Poke can take action using email, calendar, reminders, and other integrations. Use for tasks like: setting reminders, drafting emails, scheduling events, or any voice-triggered workflow.",
  {
    message: z.string().min(1).describe("The message or instruction to send to Poke"),
  },
  async ({ message }) => {
    const result = await sendToPoke(message);
    return {
      content: [{ type: "text", text: result.ok ? `✅ Sent to Poke: "${message}"` : `❌ ${result.text}` }],
      isError: !result.ok,
    };
  }
);

server.tool(
  "poke_reminder",
  "Set a reminder via Poke. Poke will create the reminder and notify you at the right time.",
  {
    task: z.string().describe("What to be reminded about"),
    when: z.string().describe("When the reminder should trigger, e.g. 'tomorrow at 9am'"),
  },
  async ({ task, when }) => {
    const result = await sendToPoke(`Set a reminder: ${task} — ${when}`);
    return {
      content: [{ type: "text", text: result.ok ? `✅ Reminder set: "${task}" for ${when}` : `❌ ${result.text}` }],
      isError: !result.ok,
    };
  }
);

server.tool(
  "poke_draft_email",
  "Ask Poke to draft and optionally send an email on your behalf.",
  {
    recipient: z.string().describe("Who to send the email to"),
    subject: z.string().describe("Email subject line"),
    context: z.string().describe("What the email should say or cover"),
  },
  async ({ recipient, subject, context }) => {
    const result = await sendToPoke(`Draft an email to ${recipient} with subject '${subject}'. Context: ${context}`);
    return {
      content: [{ type: "text", text: result.ok ? `✅ Asked Poke to draft email to ${recipient} re: ${subject}` : `❌ ${result.text}` }],
      isError: !result.ok,
    };
  }
);

server.tool(
  "poke_schedule",
  "Ask Poke to add an event to your calendar.",
  {
    event: z.string().describe("Name of the event"),
    when: z.string().describe("Date and time, e.g. 'Monday at 10am'"),
    details: z.string().optional().describe("Optional details like attendees or location"),
  },
  async ({ event, when, details }) => {
    const parts = [`Add to my calendar: ${event} on ${when}`];
    if (details) parts.push(`Details: ${details}`);
    const result = await sendToPoke(parts.join(" — "));
    return {
      content: [{ type: "text", text: result.ok ? `✅ Asked Poke to schedule: ${event} — ${when}` : `❌ ${result.text}` }],
      isError: !result.ok,
    };
  }
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((error) => {
  logError("Fatal error", error);
  process.exit(1);
});
