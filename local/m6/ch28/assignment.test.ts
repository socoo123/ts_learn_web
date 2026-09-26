import { describe, expect, test } from "bun:test";
import {
  agentStateAfter,
  deliverQueuedAt,
  isSettled,
  loopContinues,
  nextPhase,
  orderAgentEvents,
  splitTurns,
} from "./assignment";

describe("loopContinues", () => {
  test("toolUse 且有调用 → 继续", () => {
    expect(loopContinues("toolUse", 2)).toBe(true);
    expect(loopContinues("toolUse", 1)).toBe(true);
  });
  test("两个条件缺一不可（防只看 stopReason）", () => {
    expect(loopContinues("toolUse", 0)).toBe(false);
    expect(loopContinues("stop", 0)).toBe(false);
  });
  test("error / aborted 即使带调用也立刻停", () => {
    expect(loopContinues("error", 2)).toBe(false);
    expect(loopContinues("aborted", 1)).toBe(false);
  });
});

describe("nextPhase", () => {
  test("toolUse 有调用 → 先执行工具（steer 不插队）", () => {
    expect(nextPhase({ stopReason: "toolUse", toolCallCount: 2, steering: 1, followUp: 0 })).toBe("tools");
  });
  test("该停时 steer / followUp 都能再启一轮 LLM", () => {
    expect(nextPhase({ stopReason: "stop", toolCallCount: 0, steering: 1, followUp: 0 })).toBe("llm");
    expect(nextPhase({ stopReason: "stop", toolCallCount: 0, steering: 0, followUp: 1 })).toBe("llm");
  });
  test("队列全空 → end；error / aborted 无视队列", () => {
    expect(nextPhase({ stopReason: "stop", toolCallCount: 0, steering: 0, followUp: 0 })).toBe("end");
    expect(nextPhase({ stopReason: "error", toolCallCount: 2, steering: 1, followUp: 1 })).toBe("end");
    expect(nextPhase({ stopReason: "aborted", toolCallCount: 0, steering: 0, followUp: 0 })).toBe("end");
  });
});

describe("orderAgentEvents", () => {
  test("合法完整流（查库存再回答）", () => {
    const run = [
      { type: "agent_start" },
      { type: "turn_start" },
      { type: "message_start" },
      { type: "message_update" },
      { type: "message_end" },
      { type: "tool_execution_start" },
      { type: "tool_execution_end" },
      { type: "tool_execution_start" },
      { type: "tool_execution_end" },
      { type: "turn_end" },
      { type: "turn_start" },
      { type: "message_start" },
      { type: "message_update" },
      { type: "message_end" },
      { type: "turn_end" },
      { type: "agent_end" },
    ];
    expect(orderAgentEvents(run)).toBe(true);
  });
  test("缺 agent_start / agent_end → false", () => {
    const ok = [
      { type: "agent_start" },
      { type: "turn_start" },
      { type: "message_start" },
      { type: "message_end" },
      { type: "turn_end" },
      { type: "agent_end" },
    ];
    expect(orderAgentEvents(ok.slice(1))).toBe(false);
    expect(orderAgentEvents(ok.slice(0, -1))).toBe(false);
  });
  test("message_update 游离 → false", () => {
    expect(
      orderAgentEvents([
        { type: "agent_start" },
        { type: "turn_start" },
        { type: "message_update" },
        { type: "turn_end" },
        { type: "agent_end" },
      ]),
    ).toBe(false);
    expect(
      orderAgentEvents([
        { type: "agent_start" },
        { type: "turn_start" },
        { type: "message_start" },
        { type: "message_end" },
        { type: "message_update" },
        { type: "turn_end" },
        { type: "agent_end" },
      ]),
    ).toBe(false);
  });
  test("turn 未关闭 / 工具未配对 / 空数组 → false", () => {
    expect(
      orderAgentEvents([
        { type: "agent_start" },
        { type: "turn_start" },
        { type: "message_start" },
        { type: "message_end" },
        { type: "agent_end" },
      ]),
    ).toBe(false);
    expect(
      orderAgentEvents([
        { type: "agent_start" },
        { type: "turn_start" },
        { type: "tool_execution_end" },
        { type: "turn_end" },
        { type: "agent_end" },
      ]),
    ).toBe(false);
    expect(orderAgentEvents([])).toBe(false);
  });
});

describe("splitTurns", () => {
  test("两轮各成一组（含端点）", () => {
    const run = [
      { type: "agent_start" },
      { type: "turn_start" },
      { type: "message_start" },
      { type: "message_update" },
      { type: "message_end" },
      { type: "tool_execution_start" },
      { type: "tool_execution_end" },
      { type: "tool_execution_start" },
      { type: "tool_execution_end" },
      { type: "turn_end" },
      { type: "turn_start" },
      { type: "message_start" },
      { type: "message_end" },
      { type: "turn_end" },
      { type: "agent_end" },
      { type: "agent_settled" },
    ];
    const groups = splitTurns(run);
    expect(groups.length).toBe(2);
    expect(groups[0][0].type).toBe("turn_start");
    expect(groups[0][groups[0].length - 1].type).toBe("turn_end");
    expect(groups[1][0].type).toBe("turn_start");
    expect(groups[1][groups[1].length - 1].type).toBe("turn_end");
    expect(groups[0].length).toBe(9);
    expect(groups[1].length).toBe(4);
  });
  test("run 级事件不进任何组", () => {
    const run = [
      { type: "agent_start" },
      { type: "turn_start" },
      { type: "message_start" },
      { type: "message_end" },
      { type: "turn_end" },
      { type: "agent_end" },
      { type: "agent_settled" },
    ];
    const flat = splitTurns(run).flat();
    expect(flat.some((e) => e.type === "agent_start" || e.type === "agent_settled")).toBe(false);
  });
  test("空流与无 turn 流 → 空数组", () => {
    expect(splitTurns([])).toEqual([]);
    expect(splitTurns([{ type: "agent_start" }, { type: "agent_end" }])).toEqual([]);
  });
});

describe("deliverQueuedAt", () => {
  test("steer 占 loop-start 与 after-turn-end 两个缝隙", () => {
    expect(deliverQueuedAt("steer", "loop-start")).toBe(true);
    expect(deliverQueuedAt("steer", "after-turn-end")).toBe(true);
  });
  test("steer 不在 would-stop；followUp 只在 would-stop", () => {
    expect(deliverQueuedAt("steer", "would-stop")).toBe(false);
    expect(deliverQueuedAt("followUp", "would-stop")).toBe(true);
    expect(deliverQueuedAt("followUp", "after-turn-end")).toBe(false);
    expect(deliverQueuedAt("followUp", "loop-start")).toBe(false);
  });
});

describe("agentStateAfter", () => {
  test("追加 assistant + 两条 toolResult，保序", () => {
    const before = {
      systemPrompt: "你是商品助手",
      model: "anthropic/claude-fable-5-1",
      messages: [{ role: "user", text: "机械键盘和无线鼠标还有货吗？" } as SimMessage],
    };
    Object.freeze(before.messages);
    const after = agentStateAfter(before, [
      { role: "assistant", text: "我查一下 KB-001 和 MS-002 的库存" },
      { role: "toolResult", text: "KB-001 机械键盘有货，剩 12 件" },
      { role: "toolResult", text: "MS-002 无线鼠标有货，剩 7 件" },
    ]);
    expect(after.messages.length).toBe(4);
    expect(after.messages[3].text).toBe("MS-002 无线鼠标有货，剩 7 件");
    expect(after.messages[1].role).toBe("assistant");
    expect(before.messages.length).toBe(1);
  });
  test("不可变：新对象新数组，其余字段原样", () => {
    const before = {
      systemPrompt: "你是商品助手",
      model: "anthropic/claude-fable-5-1",
      messages: [{ role: "user", text: "机械键盘还有货吗" } as SimMessage],
    };
    const after = agentStateAfter(before, [{ role: "assistant", text: "KB-001 有货" }]);
    expect(after === before).toBe(false);
    expect(after.messages === before.messages).toBe(false);
    expect(after.systemPrompt).toBe("你是商品助手");
    expect(after.model).toBe("anthropic/claude-fable-5-1");
  });
  test("空 incoming 也返回新数组", () => {
    const before = {
      systemPrompt: "s",
      model: "m",
      messages: [] as SimMessage[],
    };
    const after = agentStateAfter(before, []);
    expect(after.messages.length).toBe(0);
    expect(after.messages === before.messages).toBe(false);
  });
});

describe("isSettled", () => {
  test("尾事件 agent_settled 且之前有 agent_end → true", () => {
    expect(
      isSettled([
        { type: "agent_start" },
        { type: "turn_start" },
        { type: "message_end" },
        { type: "turn_end" },
        { type: "agent_end" },
        { type: "agent_settled" },
      ]),
    ).toBe(true);
  });
  test("只有 agent_end → false（还可能自动续）", () => {
    expect(
      isSettled([
        { type: "agent_start" },
        { type: "agent_end" },
      ]),
    ).toBe(false);
  });
  test("agent_end 之后还有 retry / settled 后又开新 run → false", () => {
    expect(
      isSettled([
        { type: "agent_start" },
        { type: "agent_end" },
        { type: "auto_retry_start" },
      ]),
    ).toBe(false);
    expect(
      isSettled([
        { type: "agent_end" },
        { type: "agent_settled" },
        { type: "agent_start" },
      ]),
    ).toBe(false);
  });
  test("空流 / 孤儿 settled → false", () => {
    expect(isSettled([])).toBe(false);
    expect(isSettled([{ type: "agent_settled" }])).toBe(false);
  });
});
