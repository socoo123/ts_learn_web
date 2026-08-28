import { describe, expect, test } from "bun:test";
import {
  concatAssistantText,
  encodeTokenDelta,
  endStream,
  formatSseComment,
  formatSseEvent,
  splitSse,
} from "./assignment";
import { app, TOKENS } from "./app";

describe("formatSseEvent", () => {
  test("只有 data 行：机 / hello world", () => {
    expect(formatSseEvent("机")).toBe("data: 机\n\n");
    expect(formatSseEvent("hello world")).toBe("data: hello world\n\n");
  });
  test("带 event 名：delta", () => {
    expect(formatSseEvent("tok", "delta")).toBe("event: delta\ndata: tok\n\n");
    expect(formatSseEvent("机", "token")).toBe("event: token\ndata: 机\n\n");
  });
  test("空 data；空 event 名仍输出 event 行", () => {
    expect(formatSseEvent("")).toBe("data: \n\n");
    expect(formatSseEvent("x", "")).toBe("event: \ndata: x\n\n");
    expect(formatSseEvent("机", undefined)).toBe("data: 机\n\n");
  });
});

describe("formatSseComment", () => {
  test("keep-alive / ping", () => {
    expect(formatSseComment("keep-alive")).toBe(": keep-alive\n\n");
    expect(formatSseComment("ping")).toBe(": ping\n\n");
  });
  test("空 text 仍保留冒号后空格", () => {
    expect(formatSseComment("")).toBe(": \n\n");
  });
  test("不要写成 data 行", () => {
    expect(formatSseComment("keep-alive")).toBe(": keep-alive\n\n");
    const c = formatSseComment("keep-alive");
    expect(c === "data: keep-alive\n\n").toBe(false);
  });
});

describe("splitSse", () => {
  test("两帧都完整", () => {
    expect(splitSse("data: a\n\ndata: b\n\n")).toEqual({
      frames: ["data: a", "data: b"],
      rest: "",
    });
  });
  test("第二帧不完整留在 rest", () => {
    expect(splitSse("data: a\n\ndata: b")).toEqual({
      frames: ["data: a"],
      rest: "data: b",
    });
  });
  test("空串 / 半帧 / 前导空帧", () => {
    expect(splitSse("")).toEqual({ frames: [], rest: "" });
    expect(splitSse("data: 机")).toEqual({ frames: [], rest: "data: 机" });
    expect(splitSse("\n\ndata: x\n\n")).toEqual({ frames: ["data: x"], rest: "" });
  });
  test("不 trim 帧内容", () => {
    expect(splitSse("data:  hello\n\n")).toEqual({
      frames: ["data:  hello"],
      rest: "",
    });
  });
});

describe("encodeTokenDelta", () => {
  test("机 / hello world 与 formatSseEvent 相同", () => {
    expect(encodeTokenDelta("机")).toBe("data: 机\n\n");
    expect(encodeTokenDelta("机")).toBe(formatSseEvent("机"));
    expect(encodeTokenDelta("hello world")).toBe(formatSseEvent("hello world"));
  });
  test("空 token", () => {
    expect(encodeTokenDelta("")).toBe("data: \n\n");
    expect(encodeTokenDelta("")).toBe(formatSseEvent(""));
  });
  test("不要加 event 名", () => {
    expect(encodeTokenDelta("tok")).toBe(formatSseEvent("tok"));
    expect(encodeTokenDelta("tok") === formatSseEvent("tok", "delta")).toBe(false);
  });
});

describe("endStream", () => {
  test("OpenAI 风格 [DONE] 帧", () => {
    expect(endStream()).toBe("data: [DONE]\n\n");
    expect(endStream()).toBe(formatSseEvent("[DONE]"));
  });
  test("不带 event 名", () => {
    expect(endStream() === formatSseEvent("[DONE]", "done")).toBe(false);
    expect(endStream() === formatSseEvent("[DONE]", "")).toBe(false);
  });
  test("多次调用结果相同", () => {
    expect(endStream()).toBe(endStream());
    expect(endStream()).toBe("data: [DONE]\n\n");
  });
});

describe("concatAssistantText", () => {
  test("机械键盘 token 拼接", () => {
    expect(concatAssistantText(["机", "械", "键盘"])).toBe("机械键盘");
  });
  test("无线鼠标（防硬编码机械键盘）", () => {
    expect(concatAssistantText(["无", "线", "鼠标"])).toBe("无线鼠标");
  });
  test("空数组 / 不插空格 / 不 mutate", () => {
    expect(concatAssistantText([])).toBe("");
    expect(concatAssistantText(["hello", "world"])).toBe("helloworld");
    expect(concatAssistantText(["hello ", "world"])).toBe("hello world");
    const tokens = ["机", "械"];
    Object.freeze(tokens);
    expect(concatAssistantText(tokens)).toBe("机械");
    expect(tokens.length).toBe(2);
  });
});

describe("app HTTP", () => {
  test("GET /health", async () => {
    const res = await app.request("/health");
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
  });
  test("GET /stream 是 text/event-stream，能还原机械键盘，最后 [DONE]", async () => {
    const res = await app.request("/stream");
    expect(res.status).toBe(200);
    const ct = res.headers.get("Content-Type") ?? "";
    expect(ct.includes("text/event-stream")).toBe(true);
    const body = await res.text();
    const { frames, rest } = splitSse(body);
    expect(rest).toBe("");
    expect(frames.length).toBe(TOKENS.length + 1);
    expect(frames[frames.length - 1]).toBe("data: [DONE]");
    const payloads = frames.slice(0, -1).map((f) => f.slice("data: ".length));
    expect(payloads).toEqual([...TOKENS]);
    expect(concatAssistantText(payloads)).toBe("机械键盘");
    expect(concatAssistantText(payloads)).toBe(TOKENS.join(""));
  });
});
