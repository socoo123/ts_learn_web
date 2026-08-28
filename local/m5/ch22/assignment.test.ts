import { describe, expect, test } from "bun:test";
import {
  collectTextDeltas,
  collectUsage,
  isStillStreaming,
  joinAssistant,
  stopReason,
  toSseFromPiDeltas,
} from "./assignment";
import { collectFromAsync, fakeShopStream, type PiEvent } from "./app";

const KB_EVENTS: PiEvent[] = [
  { type: "start" },
  { type: "text_delta", delta: "机" },
  { type: "text_delta", delta: "械键盘" },
  { type: "done", reason: "stop", usage: { input: 12, output: 4 } },
];

const MOUSE_EVENTS: PiEvent[] = [
  { type: "text_delta", delta: "无" },
  { type: "text_delta", delta: "线鼠标" },
  { type: "done", reason: "stop", usage: { input: 3, output: 9 } },
];

describe("collectTextDeltas", () => {
  test("机械键盘增量按序，忽略 start/done", () => {
    const events: PiEvent[] = [
      { type: "start" },
      { type: "text_delta", delta: "机" },
      { type: "text_delta", delta: "械键盘" },
      { type: "done", reason: "stop" },
    ];
    Object.freeze(events);
    expect(collectTextDeltas(events)).toEqual(["机", "械键盘"]);
    expect(events.length).toBe(4);
  });
  test("无线鼠标增量（防硬编码机械键盘）", () => {
    const events: PiEvent[] = [
      { type: "text_delta", delta: "无" },
      { type: "text_delta", delta: "线鼠标" },
    ];
    Object.freeze(events);
    expect(collectTextDeltas(events)).toEqual(["无", "线鼠标"]);
  });
  test("空数组 / 没有 delta → []", () => {
    expect(collectTextDeltas([])).toEqual([]);
    const onlyTerminal: PiEvent[] = [
      { type: "start" },
      { type: "done", reason: "stop" },
      { type: "error", reason: "aborted" },
    ];
    Object.freeze(onlyTerminal);
    expect(collectTextDeltas(onlyTerminal)).toEqual([]);
  });
  test("不 mutate events", () => {
    const events: PiEvent[] = [
      { type: "text_delta", delta: "KB-001" },
      { type: "text_delta", delta: " 库存 " },
      { type: "text_delta", delta: "120" },
    ];
    Object.freeze(events);
    collectTextDeltas(events);
    expect(events.length).toBe(3);
  });
});

describe("collectUsage", () => {
  test("最后一个带 usage 的 done", () => {
    Object.freeze(KB_EVENTS);
    expect(collectUsage(KB_EVENTS)).toEqual({ input: 12, output: 4 });
  });
  test("另一组 usage（防硬编码 12/4）", () => {
    Object.freeze(MOUSE_EVENTS);
    expect(collectUsage(MOUSE_EVENTS)).toEqual({ input: 3, output: 9 });
  });
  test("没有 usage / 空 / error → null", () => {
    expect(collectUsage([])).toBeNull();
    expect(collectUsage([{ type: "start" }, { type: "text_delta", delta: "机" }])).toBeNull();
    expect(collectUsage([{ type: "done", reason: "stop" }])).toBeNull();
    expect(collectUsage([{ type: "error", reason: "error" }])).toBeNull();
  });
  test("后一个 done 没有 usage 时保留前面的；后一个覆盖", () => {
    const keep: PiEvent[] = [
      { type: "done", reason: "stop", usage: { input: 1, output: 2 } },
      { type: "done", reason: "length" },
    ];
    Object.freeze(keep);
    expect(collectUsage(keep)).toEqual({ input: 1, output: 2 });
    const override: PiEvent[] = [
      { type: "done", reason: "stop", usage: { input: 1, output: 2 } },
      { type: "done", reason: "stop", usage: { input: 8, output: 7 } },
    ];
    Object.freeze(override);
    expect(collectUsage(override)).toEqual({ input: 8, output: 7 });
  });
});

describe("stopReason", () => {
  test("末尾 done/stop → stop", () => {
    const events: PiEvent[] = [
      { type: "start" },
      { type: "text_delta", delta: "机" },
      { type: "done", reason: "stop" },
    ];
    Object.freeze(events);
    expect(stopReason(events)).toBe("stop");
  });
  test("末尾 error/aborted → aborted；error/error → error", () => {
    const aborted: PiEvent[] = [
      { type: "text_delta", delta: "机" },
      { type: "error", reason: "aborted" },
    ];
    Object.freeze(aborted);
    expect(stopReason(aborted)).toBe("aborted");
    expect(stopReason([{ type: "error", reason: "error" }])).toBe("error");
  });
  test("只有 start+deltas / 空 → null", () => {
    expect(stopReason([])).toBeNull();
    const streaming: PiEvent[] = [{ type: "start" }, { type: "text_delta", delta: "机" }];
    Object.freeze(streaming);
    expect(stopReason(streaming)).toBeNull();
  });
  test("多个终端取最后一个；length / toolUse", () => {
    const both: PiEvent[] = [
      { type: "done", reason: "stop" },
      { type: "error", reason: "aborted" },
    ];
    Object.freeze(both);
    expect(stopReason(both)).toBe("aborted");
    expect(stopReason([{ type: "done", reason: "length" }])).toBe("length");
    expect(stopReason([{ type: "done", reason: "toolUse" }])).toBe("toolUse");
  });
});

describe("joinAssistant", () => {
  test("机械键盘 deltas → 机械键盘", () => {
    const events: PiEvent[] = [
      { type: "start" },
      { type: "text_delta", delta: "机" },
      { type: "text_delta", delta: "械键盘" },
      { type: "done", reason: "stop" },
    ];
    Object.freeze(events);
    expect(joinAssistant(events)).toBe("机械键盘");
  });
  test("无线鼠标（防硬编码）", () => {
    const events: PiEvent[] = [
      { type: "text_delta", delta: "无" },
      { type: "text_delta", delta: "线鼠标" },
    ];
    Object.freeze(events);
    expect(joinAssistant(events)).toBe("无线鼠标");
  });
  test("空 / 无 delta → 空串", () => {
    expect(joinAssistant([])).toBe("");
    expect(joinAssistant([{ type: "start" }, { type: "done", reason: "stop" }])).toBe("");
  });
});

describe("isStillStreaming", () => {
  test("空数组仍在流", () => {
    expect(isStillStreaming([])).toBe(true);
  });
  test("只有 start + deltas → true", () => {
    const events: PiEvent[] = [{ type: "start" }, { type: "text_delta", delta: "机" }];
    Object.freeze(events);
    expect(isStillStreaming(events)).toBe(true);
    expect(
      isStillStreaming([
        { type: "text_delta", delta: "无" },
        { type: "text_delta", delta: "线鼠标" },
      ]),
    ).toBe(true);
  });
  test("出现 done 或 error → false", () => {
    expect(isStillStreaming(KB_EVENTS)).toBe(false);
    expect(isStillStreaming([{ type: "error", reason: "aborted" }])).toBe(false);
    expect(isStillStreaming([{ type: "done", reason: "length" }])).toBe(false);
    const after: PiEvent[] = [
      { type: "done", reason: "stop" },
      { type: "text_delta", delta: "晚到" },
    ];
    Object.freeze(after);
    expect(isStillStreaming(after)).toBe(false);
  });
});

describe("toSseFromPiDeltas", () => {
  test("仍在流：只有 data 行，没有 DONE", () => {
    const events: PiEvent[] = [
      { type: "text_delta", delta: "机" },
      { type: "text_delta", delta: "械" },
    ];
    Object.freeze(events);
    expect(toSseFromPiDeltas(events)).toBe("data: 机\n\ndata: 械\n\n");
  });
  test("机械键盘 + done → 末尾 DONE；无线鼠标防硬编码", () => {
    const kb: PiEvent[] = [
      { type: "start" },
      { type: "text_delta", delta: "机" },
      { type: "text_delta", delta: "械键盘" },
      { type: "done", reason: "stop" },
    ];
    Object.freeze(kb);
    expect(toSseFromPiDeltas(kb)).toBe("data: 机\n\ndata: 械键盘\n\ndata: [DONE]\n\n");
    const mouse: PiEvent[] = [
      { type: "text_delta", delta: "无" },
      { type: "text_delta", delta: "线鼠标" },
      { type: "done", reason: "stop" },
    ];
    Object.freeze(mouse);
    expect(toSseFromPiDeltas(mouse)).toBe("data: 无\n\ndata: 线鼠标\n\ndata: [DONE]\n\n");
  });
  test("error 无 done → ERROR；空 → 空串", () => {
    const aborted: PiEvent[] = [
      { type: "text_delta", delta: "机" },
      { type: "error", reason: "aborted" },
    ];
    Object.freeze(aborted);
    expect(toSseFromPiDeltas(aborted)).toBe("data: 机\n\ndata: [ERROR]\n\n");
    expect(toSseFromPiDeltas([{ type: "error", reason: "error" }])).toBe("data: [ERROR]\n\n");
    expect(toSseFromPiDeltas([])).toBe("");
    expect(toSseFromPiDeltas([{ type: "start" }])).toBe("");
  });
  test("两个终端看最后一个；length/toolUse 也是 DONE", () => {
    const errorLast: PiEvent[] = [
      { type: "text_delta", delta: "机" },
      { type: "done", reason: "stop" },
      { type: "error", reason: "aborted" },
    ];
    Object.freeze(errorLast);
    expect(toSseFromPiDeltas(errorLast)).toBe("data: 机\n\ndata: [ERROR]\n\n");
    const doneLast: PiEvent[] = [
      { type: "error", reason: "error" },
      { type: "text_delta", delta: "机" },
      { type: "done", reason: "stop" },
    ];
    Object.freeze(doneLast);
    expect(toSseFromPiDeltas(doneLast)).toBe("data: 机\n\ndata: [DONE]\n\n");
    expect(toSseFromPiDeltas([{ type: "done", reason: "length" }])).toBe("data: [DONE]\n\n");
    expect(toSseFromPiDeltas([{ type: "done", reason: "toolUse" }])).toBe("data: [DONE]\n\n");
  });
});

describe("fakeShopStream", () => {
  test("for-await 收齐后交给 joinAssistant / collectUsage", async () => {
    const events = await collectFromAsync(fakeShopStream());
    expect(joinAssistant(events)).toBe("KB-001 库存 120");
    expect(collectUsage(events)).toEqual({ input: 12, output: 4 });
    expect(stopReason(events)).toBe("stop");
    expect(isStillStreaming(events)).toBe(false);
    expect(collectTextDeltas(events)).toEqual(["KB-001", " 库存 ", "120"]);
  });
});
