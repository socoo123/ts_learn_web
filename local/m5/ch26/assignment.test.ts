import { describe, expect, test } from "bun:test";
import {
  assistantRowView,
  chatRequestSchema,
  endOfTurn,
  piEventToSse,
  reduceChatFromSse,
  toolRowView,
  type ChatState,
  type PiEvent,
} from "./assignment";
import { KEYBOARD_EVENTS, MOUSE_EVENTS, app, eventsForMessage } from "./app";

function emptyChat(): ChatState {
  return { rows: [], ended: false, aborted: false };
}

function parsed(input: unknown) {
  const r = chatRequestSchema().safeParse(input);
  return r.success ? r.data : null;
}

function ssePayloads(body: string): string[] {
  return body
    .split("\n\n")
    .filter((f) => f.startsWith("data: "))
    .map((f) => f.slice("data: ".length));
}

describe("piEventToSse", () => {
  test("text_delta / agent_end / aborted", () => {
    const ev: PiEvent = { type: "text_delta", delta: "机" };
    Object.freeze(ev);
    expect(piEventToSse(ev)).toBe('data: {"type":"text_delta","delta":"机"}\n\n');
    expect(piEventToSse({ type: "agent_end" })).toBe("data: [DONE]\n\n");
    expect(piEventToSse({ type: "aborted" })).toBe('data: {"type":"aborted"}\n\n');
  });
});

describe("chatRequestSchema", () => {
  test("trim、sku、失败", () => {
    expect(parsed({ message: "机械键盘还有货吗" })).toEqual({ message: "机械键盘还有货吗" });
    expect(parsed({ message: "  无线鼠标  ", sku: "MS-002" })).toEqual({
      message: "无线鼠标",
      sku: "MS-002",
    });
    expect(parsed({ message: "   " })).toBeNull();
    expect(parsed({ message: "a".repeat(501) })).toBeNull();
  });
});

describe("reduceChatFromSse", () => {
  test("累积无线鼠标；[DONE]；freeze", () => {
    const s0 = emptyChat();
    Object.freeze(s0);
    Object.freeze(s0.rows);
    const s1 = reduceChatFromSse(s0, '{"type":"text_delta","delta":"无"}');
    const s2 = reduceChatFromSse(s1, '{"type":"text_delta","delta":"线鼠标"}');
    expect(s2.rows).toEqual([{ kind: "assistant", text: "无线鼠标" }]);
    expect(s0.rows).toEqual([]);
    const done = reduceChatFromSse(s2, "[DONE]");
    expect(done.ended).toBe(true);
  });
});

describe("toolRowView / assistantRowView / endOfTurn", () => {
  test("四种 status 与结束判定", () => {
    expect(toolRowView({ kind: "tool", name: "calcLineTotal", status: "call", text: "" })).toBe(
      "[tool:calcLineTotal] 调用中",
    );
    expect(toolRowView({ kind: "tool", name: "bash", status: "blocked", text: "forbidden" })).toBe(
      "[tool:bash] 已拦截 forbidden",
    );
    expect(assistantRowView("MS-002 无线鼠标 库存 300")).toBe("助手：MS-002 无线鼠标 库存 300");
    expect(endOfTurn("[DONE]")).toBe(true);
    expect(endOfTurn('{"type":"aborted"}')).toBe(false);
  });
});

describe("app HTTP", () => {
  test("GET /health", async () => {
    const res = await app.request("/health");
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
  });
  test("POST /chat 机械键盘 → SSE + [DONE] + reduce", async () => {
    const res = await app.request("/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: "机械键盘还有货吗" }),
    });
    expect(res.status).toBe(200);
    const ct = res.headers.get("Content-Type") ?? "";
    expect(ct.includes("text/event-stream")).toBe(true);
    const body = await res.text();
    expect(body.includes("[DONE]")).toBe(true);
    expect(body.includes("KB-001")).toBe(true);
    const payloads = ssePayloads(body);
    expect(payloads[payloads.length - 1]).toBe("[DONE]");
    let state = emptyChat();
    for (const p of payloads) state = reduceChatFromSse(state, p);
    expect(state.ended).toBe(true);
    expect(state.rows.some((r) => r.kind === "assistant" && r.text.includes("KB-001"))).toBe(true);
  });
  test("POST /chat 无线鼠标防硬编码；空 message 400", async () => {
    const res = await app.request("/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: "无线鼠标还有货吗" }),
    });
    expect(res.status).toBe(200);
    const body = await res.text();
    expect(body.includes("MS-002")).toBe(true);
    expect(eventsForMessage("无线鼠标还有货吗")).toEqual(MOUSE_EVENTS);
    expect(eventsForMessage("机械键盘还有货吗")).toEqual(KEYBOARD_EVENTS);
    const bad = await app.request("/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: "   " }),
    });
    expect(bad.status).toBe(400);
  });
});
