import { describe, expect, test } from "bun:test";
import {
  answerUiRequest,
  encodeCommand,
  matchResponseTo,
  pickIntegration,
  promptAcceptSemantics,
  sdkEquivalent,
  splitJsonl,
} from "./assignment";

describe("pickIntegration", () => {
  test("同进程走 SDK，隔离或跨语言走 RPC", () => {
    expect(pickIntegration("in-process")).toBe("sdk");
    expect(pickIntegration("isolate")).toBe("rpc");
    expect(pickIntegration("cross-language")).toBe("rpc");
  });
  test("只倒一轮事件走 json", () => {
    expect(pickIntegration("one-shot")).toBe("json");
  });
  test("不认识的需求 → null", () => {
    expect(pickIntegration("tui")).toBeNull();
    expect(pickIntegration("")).toBeNull();
  });
});

describe("splitJsonl", () => {
  test("只按 LF 切，并剥掉行尾 CR", () => {
    expect(splitJsonl('{"a":1}\r\n{"b":2}\n')).toEqual(['{"a":1}', '{"b":2}']);
    expect(splitJsonl('{"a":1}\n{"b":2}')).toEqual(['{"a":1}', '{"b":2}']);
  });
  test("U+2028 / U+2029 留在记录内部", () => {
    const lineSep = '{"msg":"价格\u2028护栏"}\n{"sku":"MS-002"}\n';
    const parts = splitJsonl(lineSep);
    expect(parts.length).toBe(2);
    expect(parts[0]).toBe('{"msg":"价格\u2028护栏"}');
    expect(parts[1]).toBe('{"sku":"MS-002"}');
    const para = '{"q":"KB-001\u2029库存"}\n{"ok":true}';
    const paraParts = splitJsonl(para);
    expect(paraParts.length).toBe(2);
    expect(paraParts[0]).toBe('{"q":"KB-001\u2029库存"}');
  });
  test("空串、尾部换行、空行都不多出帧", () => {
    expect(splitJsonl("")).toEqual([]);
    expect(splitJsonl('{"a":1}\n')).toEqual(['{"a":1}']);
    expect(splitJsonl('{"a":1}\n\n{"b":2}\n')).toEqual(['{"a":1}', '{"b":2}']);
  });
});

describe("encodeCommand", () => {
  test("prompt 一行：type、id、message，以 LF 结尾", () => {
    expect(encodeCommand({ type: "prompt", id: "req-1", message: "查 KB-001 机械键盘" })).toBe(
      '{"type":"prompt","id":"req-1","message":"查 KB-001 机械键盘"}\n',
    );
  });
  test("正在输出时改口：带上 streamingBehavior，键序固定", () => {
    expect(
      encodeCommand({
        type: "prompt",
        id: "req-2",
        message: "改查 MS-002 无线鼠标",
        streamingBehavior: "steer",
      }),
    ).toBe('{"type":"prompt","id":"req-2","message":"改查 MS-002 无线鼠标","streamingBehavior":"steer"}\n');
  });
  test("compact 不写 message 键", () => {
    const line = encodeCommand({ type: "compact", id: "req-3", customInstructions: "聚焦库存数字" });
    expect(line).toBe('{"type":"compact","id":"req-3","customInstructions":"聚焦库存数字"}\n');
    expect(line.includes("\r")).toBe(false);
  });
});

describe("matchResponseTo", () => {
  test("同 id 的 update 不是 response；取第一条对得上的 response", () => {
    const frames = [
      { type: "bash_execution_update", id: "req-1" },
      { type: "response", id: "req-1", command: "prompt", success: true },
      { type: "agent_start" },
      { type: "response", id: "req-2", command: "get_state", success: true },
    ];
    Object.freeze(frames);
    expect(matchResponseTo(frames, "req-1")).toEqual({
      type: "response",
      id: "req-1",
      command: "prompt",
      success: true,
    });
    expect(matchResponseTo(frames, "req-2")).toEqual({
      type: "response",
      id: "req-2",
      command: "get_state",
      success: true,
    });
  });
  test("没有这条 id 的 response → null", () => {
    expect(matchResponseTo([{ type: "agent_end" }, { type: "response", id: "req-9", command: "prompt", success: true }], "req-1")).toBeNull();
    expect(matchResponseTo([], "req-1")).toBeNull();
  });
});

describe("promptAcceptSemantics", () => {
  test("success true 是已接受，false 是接受前拒绝", () => {
    expect(promptAcceptSemantics({ type: "response", command: "prompt", success: true })).toBe("accepted");
    expect(promptAcceptSemantics({ type: "response", command: "prompt", success: false })).toBe("rejected");
  });
  test("接受之后的失败走事件流", () => {
    expect(promptAcceptSemantics({ type: "agent_end" })).toBe("stream");
    expect(promptAcceptSemantics({ type: "message_end" })).toBe("stream");
    expect(promptAcceptSemantics({ type: "tool_execution_end" })).toBe("stream");
  });
  test("别的命令的 response、UI 请求，不是 prompt 的接受语义", () => {
    expect(promptAcceptSemantics({ type: "response", command: "compact", success: true })).toBeNull();
    expect(promptAcceptSemantics({ type: "extension_ui_request", id: "uuid-1" })).toBeNull();
    expect(promptAcceptSemantics({ type: "agent_start" })).toBeNull();
  });
});

describe("answerUiRequest", () => {
  test("select 选中选项 → value 帧", () => {
    const req = {
      type: "extension_ui_request",
      id: "uuid-1",
      method: "select",
      options: ["Allow", "Block"],
    };
    Object.freeze(req.options);
    Object.freeze(req);
    expect(answerUiRequest(req, "Allow")).toEqual({
      type: "extension_ui_response",
      id: "uuid-1",
      value: "Allow",
    });
    expect(req.options).toEqual(["Allow", "Block"]);
  });
  test("choice 为 null → cancelled，不带 value", () => {
    expect(
      answerUiRequest(
        { type: "extension_ui_request", id: "uuid-1", method: "select", options: ["Allow", "Block"] },
        null,
      ),
    ).toEqual({ type: "extension_ui_response", id: "uuid-1", cancelled: true });
  });
  test("选项不对、或不是 select → null", () => {
    expect(
      answerUiRequest(
        { type: "extension_ui_request", id: "uuid-1", method: "select", options: ["Allow", "Block"] },
        "Nope",
      ),
    ).toBeNull();
    expect(
      answerUiRequest({ type: "extension_ui_request", id: "uuid-5", method: "notify" }, "Allow"),
    ).toBeNull();
    expect(answerUiRequest({ type: "response", id: "req-1", method: "select", options: ["Allow"] }, "Allow")).toBeNull();
  });
});

describe("sdkEquivalent", () => {
  test("prompt / steer / follow_up / abort / compact 对得上方法", () => {
    expect(sdkEquivalent("prompt")).toBe("session.prompt");
    expect(sdkEquivalent("steer")).toBe("session.steer");
    expect(sdkEquivalent("follow_up")).toBe("session.followUp");
    expect(sdkEquivalent("abort")).toBe("session.abort");
    expect(sdkEquivalent("compact")).toBe("session.compact");
  });
  test("get_entries 走 SessionManager；get_state 是字段快照", () => {
    expect(sdkEquivalent("get_entries")).toBe("session.sessionManager.getEntries");
    expect(sdkEquivalent("get_state")).toBe("session fields");
  });
  test("subscribe 不是 RPC 命令", () => {
    expect(sdkEquivalent("subscribe")).toBeNull();
    expect(sdkEquivalent("")).toBeNull();
  });
});
