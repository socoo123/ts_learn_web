/**
 * Ch26 最小 Hono：POST /chat 把假 Pi 事件写成 SSE。
 * 不 listen、不 fetch、不 import 真 Pi 包、不开放 shell 工具。
 *
 * bun test 用 app.request。
 */
import { Hono } from "hono";
import { streamSSE } from "hono/streaming";
import { chatRequestSchema, piEventToSse, type PiEvent } from "./assignment";

export const app = new Hono();

export const KEYBOARD_EVENTS: PiEvent[] = [
  { type: "text_delta", delta: "KB-001 " },
  { type: "text_delta", delta: "库存 120" },
  { type: "tool_call", name: "lookupProduct", args: { sku: "KB-001" } },
  {
    type: "tool_result",
    name: "lookupProduct",
    ok: true,
    text: "KB-001 机械键盘 库存 120 单价 599",
  },
  { type: "agent_end" },
];

export const MOUSE_EVENTS: PiEvent[] = [
  { type: "text_delta", delta: "MS-002 库存 300" },
  { type: "tool_call", name: "lookupProduct", args: { sku: "MS-002" } },
  {
    type: "tool_result",
    name: "lookupProduct",
    ok: true,
    text: "MS-002 无线鼠标 库存 300 单价 159",
  },
  { type: "agent_end" },
];

export function eventsForMessage(message: string): PiEvent[] {
  if (message.includes("鼠标") || message.includes("MS-002")) return MOUSE_EVENTS;
  return KEYBOARD_EVENTS;
}

function sseData(event: PiEvent): string {
  const frame = piEventToSse(event);
  if (frame.startsWith("data: ") && frame.endsWith("\n\n")) {
    return frame.slice("data: ".length, -2);
  }
  return frame;
}

app.get("/health", (c) => c.json({ ok: true }));

app.post("/chat", async (c) => {
  let body: unknown;
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: "VALIDATION" }, 400);
  }
  const parsed = chatRequestSchema().safeParse(body);
  if (!parsed.success) return c.json({ error: "VALIDATION" }, 400);
  const events = eventsForMessage(parsed.data.message);
  return streamSSE(c, async (stream) => {
    for (const ev of events) {
      await stream.writeSSE({ data: sseData(ev) });
    }
  });
});
