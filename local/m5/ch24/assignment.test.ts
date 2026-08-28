import { describe, expect, test } from "bun:test";
import {
  abortFlag,
  auditToolCall,
  blockDangerousTool,
  filterTextDeltas,
  reduceSessionEvents,
  uiRowsFromEvents,
} from "./assignment";
import {
  collectFromAsync,
  DANGEROUS_EVENTS,
  fakeSessionStream,
  SHOP_SESSION_EVENTS,
  type SessionEvent,
} from "./app";

const KB_OK: SessionEvent[] = [
  { type: "text_delta", delta: "KB-001 库存 120" },
  { type: "tool_call", name: "lookupProduct", args: { sku: "KB-001" } },
  { type: "tool_result", name: "lookupProduct", ok: true, text: "KB-001 机械键盘 库存 120 单价 599" },
  { type: "agent_end" },
];

const MOUSE_ABORT: SessionEvent[] = [
  { type: "text_delta", delta: "无" },
  { type: "text_delta", delta: "线鼠标" },
  { type: "aborted" },
];

describe("filterTextDeltas", () => {
  test("夹杂 tool_call 仍按序收 delta", () => {
    const events: SessionEvent[] = [
      { type: "text_delta", delta: "KB" },
      { type: "tool_call", name: "lookupProduct", args: {} },
      { type: "text_delta", delta: "-001" },
    ];
    Object.freeze(events);
    expect(filterTextDeltas(events)).toEqual(["KB", "-001"]);
    expect(events.length).toBe(3);
  });
  test("无线鼠标增量（防硬编码机械键盘）", () => {
    const events: SessionEvent[] = [
      { type: "text_delta", delta: "无" },
      { type: "text_delta", delta: "线鼠标" },
    ];
    Object.freeze(events);
    expect(filterTextDeltas(events)).toEqual(["无", "线鼠标"]);
  });
  test("空数组 / 只有 agent_end → []", () => {
    expect(filterTextDeltas([])).toEqual([]);
    const onlyEnd: SessionEvent[] = [{ type: "agent_end" }];
    Object.freeze(onlyEnd);
    expect(filterTextDeltas(onlyEnd)).toEqual([]);
  });
  test("忽略 tool_* / aborted，不 mutate", () => {
    const events: SessionEvent[] = [
      { type: "text_delta", delta: "机" },
      { type: "tool_call", name: "bash", args: { cmd: "ls" } },
      { type: "tool_result", name: "bash", ok: true, text: "x" },
      { type: "aborted" },
    ];
    Object.freeze(events);
    expect(filterTextDeltas(events)).toEqual(["机"]);
    expect(events.length).toBe(4);
  });
});

describe("reduceSessionEvents", () => {
  test("机械键盘 deltas + lookupProduct + agent_end", () => {
    const events: SessionEvent[] = [
      { type: "text_delta", delta: "机" },
      { type: "text_delta", delta: "械键盘" },
      { type: "tool_call", name: "lookupProduct", args: { sku: "KB-001" } },
      { type: "agent_end" },
    ];
    Object.freeze(events);
    expect(reduceSessionEvents(events)).toEqual({
      text: "机械键盘",
      tools: ["lookupProduct"],
      ended: true,
      aborted: false,
    });
  });
  test("无线鼠标 + aborted、无 agent_end（防硬编码）", () => {
    Object.freeze(MOUSE_ABORT);
    expect(reduceSessionEvents(MOUSE_ABORT)).toEqual({
      text: "无线鼠标",
      tools: [],
      ended: false,
      aborted: true,
    });
  });
  test("空数组全是空/false；两个工具按序", () => {
    expect(reduceSessionEvents([])).toEqual({
      text: "",
      tools: [],
      ended: false,
      aborted: false,
    });
    const two: SessionEvent[] = [
      { type: "tool_call", name: "lookupProduct", args: { sku: "KB-001" } },
      { type: "tool_call", name: "calcLineTotal", args: { qty: 2, unitPrice: 599 } },
    ];
    Object.freeze(two);
    expect(reduceSessionEvents(two)).toEqual({
      text: "",
      tools: ["lookupProduct", "calcLineTotal"],
      ended: false,
      aborted: false,
    });
  });
});

describe("blockDangerousTool", () => {
  test("课程只放行 lookupProduct / calcLineTotal", () => {
    expect(blockDangerousTool("lookupProduct")).toEqual({ block: false });
    expect(blockDangerousTool("calcLineTotal")).toEqual({ block: false });
  });
  test("bash / write / edit / rm / 空 / lookup 全拦", () => {
    expect(blockDangerousTool("bash")).toEqual({ block: true, reason: "forbidden" });
    expect(blockDangerousTool("write")).toEqual({ block: true, reason: "forbidden" });
    expect(blockDangerousTool("edit")).toEqual({ block: true, reason: "forbidden" });
    expect(blockDangerousTool("rm")).toEqual({ block: true, reason: "forbidden" });
    expect(blockDangerousTool("")).toEqual({ block: true, reason: "forbidden" });
    expect(blockDangerousTool("lookup")).toEqual({ block: true, reason: "forbidden" });
  });
  test("blocked 字段是 boolean", () => {
    expect(blockDangerousTool("lookupProduct").block).toBe(false);
    expect(blockDangerousTool("bash").block).toBe(true);
  });
});

describe("auditToolCall", () => {
  test("lookupProduct 不拦，args 原样", () => {
    const args: Record<string, unknown> = { sku: "KB-001" };
    Object.freeze(args);
    expect(auditToolCall("lookupProduct", args)).toEqual({
      name: "lookupProduct",
      args: { sku: "KB-001" },
      blocked: false,
    });
    expect(args).toEqual({ sku: "KB-001" });
  });
  test("bash / write 要拦（防硬编码只认 lookupProduct）", () => {
    const bashArgs: Record<string, unknown> = { cmd: "ls" };
    Object.freeze(bashArgs);
    expect(auditToolCall("bash", bashArgs)).toEqual({
      name: "bash",
      args: { cmd: "ls" },
      blocked: true,
    });
    expect(auditToolCall("write", { path: "/tmp/x" })).toEqual({
      name: "write",
      args: { path: "/tmp/x" },
      blocked: true,
    });
    expect(auditToolCall("calcLineTotal", { qty: 2, unitPrice: 599 })).toEqual({
      name: "calcLineTotal",
      args: { qty: 2, unitPrice: 599 },
      blocked: false,
    });
  });
  test("freeze args 后仍能 toEqual；不 mutate", () => {
    const args: Record<string, unknown> = { sku: "MS-002" };
    Object.freeze(args);
    const out = auditToolCall("lookupProduct", args);
    expect(out.blocked).toBe(false);
    expect(out.args).toEqual({ sku: "MS-002" });
    expect(args).toEqual({ sku: "MS-002" });
  });
});

describe("abortFlag", () => {
  test("有 aborted → true", () => {
    const events: SessionEvent[] = [
      { type: "text_delta", delta: "机" },
      { type: "aborted" },
    ];
    Object.freeze(events);
    expect(abortFlag(events)).toBe(true);
  });
  test("只有 agent_end / 空 → false", () => {
    expect(abortFlag([{ type: "agent_end" }])).toBe(false);
    expect(abortFlag([])).toBe(false);
  });
  test("无线鼠标 aborted 也是 true（防硬编码）", () => {
    Object.freeze(MOUSE_ABORT);
    expect(abortFlag(MOUSE_ABORT)).toBe(true);
    expect(abortFlag(KB_OK)).toBe(false);
  });
});

describe("uiRowsFromEvents", () => {
  test("查询成功：assistant + tool ok", () => {
    Object.freeze(KB_OK);
    expect(uiRowsFromEvents(KB_OK)).toEqual([
      { kind: "assistant", text: "KB-001 库存 120" },
      {
        kind: "tool",
        name: "lookupProduct",
        status: "ok",
        text: "KB-001 机械键盘 库存 120 单价 599",
      },
    ]);
  });
  test("拦 bash；calcLineTotal 还在调", () => {
    const bash: SessionEvent[] = [
      { type: "tool_call", name: "bash", args: { cmd: "ls" } },
      { type: "agent_end" },
    ];
    Object.freeze(bash);
    expect(uiRowsFromEvents(bash)).toEqual([
      { kind: "tool", name: "bash", status: "blocked", text: "forbidden" },
    ]);
    const calling: SessionEvent[] = [
      { type: "tool_call", name: "calcLineTotal", args: { qty: 2, unitPrice: 599 } },
    ];
    Object.freeze(calling);
    expect(uiRowsFromEvents(calling)).toEqual([
      { kind: "tool", name: "calcLineTotal", status: "call", text: "" },
    ]);
  });
  test("失败结果无 assistant；空数组 []", () => {
    const missing: SessionEvent[] = [
      { type: "tool_call", name: "lookupProduct", args: { sku: "NO-SKU" } },
      { type: "tool_result", name: "lookupProduct", ok: false, text: "未找到该 SKU" },
    ];
    Object.freeze(missing);
    expect(uiRowsFromEvents(missing)).toEqual([
      { kind: "tool", name: "lookupProduct", status: "error", text: "未找到该 SKU" },
    ]);
    expect(uiRowsFromEvents([])).toEqual([]);
  });
  test("先全文再工具；aborted 不多推一行；拦了就不配对 result", () => {
    const laterText: SessionEvent[] = [
      { type: "tool_call", name: "lookupProduct", args: { sku: "KB-001" } },
      { type: "text_delta", delta: "稍后回复" },
    ];
    Object.freeze(laterText);
    expect(uiRowsFromEvents(laterText)).toEqual([
      { kind: "assistant", text: "稍后回复" },
      { kind: "tool", name: "lookupProduct", status: "call", text: "" },
    ]);
    expect(uiRowsFromEvents([{ type: "aborted" }])).toEqual([]);
    expect(uiRowsFromEvents([{ type: "agent_end" }])).toEqual([]);
    const blockedResult: SessionEvent[] = [
      { type: "tool_call", name: "bash", args: { cmd: "ls" } },
      { type: "tool_result", name: "bash", ok: true, text: "should ignore" },
    ];
    Object.freeze(blockedResult);
    expect(uiRowsFromEvents(blockedResult)).toEqual([
      { kind: "tool", name: "bash", status: "blocked", text: "forbidden" },
    ]);
  });
});

describe("fakeSessionStream", () => {
  test("for-await 收齐后交给 uiRowsFromEvents / reduceSessionEvents", async () => {
    const events = await collectFromAsync(fakeSessionStream());
    expect(reduceSessionEvents(events)).toEqual({
      text: "KB-001 库存 120",
      tools: ["lookupProduct"],
      ended: true,
      aborted: false,
    });
    expect(uiRowsFromEvents(events)).toEqual([
      { kind: "assistant", text: "KB-001 库存 120" },
      {
        kind: "tool",
        name: "lookupProduct",
        status: "ok",
        text: "KB-001 机械键盘 库存 120 单价 599",
      },
    ]);
    expect(events).toEqual(SHOP_SESSION_EVENTS);
    expect(uiRowsFromEvents(DANGEROUS_EVENTS)).toEqual([
      { kind: "tool", name: "bash", status: "blocked", text: "forbidden" },
    ]);
  });
});
