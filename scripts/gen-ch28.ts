/**
 * 生成 src/content/chapters/ch28.json 与 local/m6/ch28/
 * 运行：bun scripts/gen-ch28.ts
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const preamble = `/**
 * Ch28 作业：Agent 循环怎么转（读 pi-agent-core，纯函数）。
 *
 * 场景：商品助手 Agent 收到「机械键盘和无线鼠标还有货吗」——
 * prompt → LLM 流 → 工具并行 → 结果追加 → 再调 LLM，直到模型不再要工具。
 * 本章用假事件流 / 假状态把这个循环的每个判定点写成纯函数。
 * 作业不 import 真 Pi 包、不打网、不装新依赖；事实全部来自本机安装包
 * （packages/agent 的编译产物 agent-loop.js / types.d.ts）与官方 docs。
 *
 * 全绿 = 你掌握了 Ch28。本地：bun test local/m6/ch28
 */

export type LoopPhase = "llm" | "tools" | "end";

export type TurnSnapshot = {
  stopReason: string;
  toolCallCount: number;
  steering: number;
  followUp: number;
};

export type AgentEventSim = { type: string };

export type QueueKind = "steer" | "followUp";

export type LoopGap = "loop-start" | "after-turn-end" | "would-stop";

export type SimMessage = { role: "user" | "assistant" | "toolResult"; text: string };

export type SimAgentState = { systemPrompt: string; model: string; messages: SimMessage[] };`;

const functions = [
  {
    name: "loopContinues",
    testSuite: "loopContinues",
    skeleton: `/**
 * 【场景】LLM 刚流完一条 assistant 消息，里面带了 2 个 lookupProduct 调用
 * （查 KB-001 机械键盘和 MS-002 无线鼠标）。循环要不要再转一圈？
 *
 * 【转换点】内层循环的继续条件 🔴：stopReason === "toolUse" **且** 消息里
 * 真的有 toolCall，两个条件缺一不可。其余 stopReason（stop / error / aborted）
 * 都不再继续——error / aborted 即使带了 toolCall 也立刻退出，工具不会执行。
 *
 * 任务：返回是否继续下一轮（执行工具后再调 LLM）。
 * 示例：
 *   loopContinues("toolUse", 2) → true（查两个商品，继续）
 *   loopContinues("toolUse", 1) → true
 *   loopContinues("toolUse", 0) → false（说要工具却没给，防死循环）
 *   loopContinues("stop", 0) → false（模型答完了）
 *   loopContinues("error", 2) → false（出错的调用不执行）
 *
 * 提示：一个 && 就够，但两个操作数都要用上。
 */
export function loopContinues(stopReason: string, toolCallCount: number): boolean {
  throw new Error("TODO");
}`,
  },
  {
    name: "nextPhase",
    testSuite: "nextPhase",
    skeleton: `/**
 * 【场景】一轮 turn 刚结束，你拿着快照问调度器：下一步干什么？
 *
 * 【转换点】下一阶段判定 🔴，优先级固定：
 *   ① stopReason 是 "error" / "aborted" → "end"（立刻收摊，队列再多也不看）
 *   ② stopReason === "toolUse" 且 toolCallCount > 0 → "tools"（排队中的 steer
 *      不插队，等工具跑完在缝隙②注入）
 *   ③ 该停了（没要工具）：steering 或 followUp 有货 → "llm"（注入后重启一轮）
 *   ④ 否则 → "end"
 *
 * 任务：返回 "llm" | "tools" | "end"。
 * 示例：
 *   nextPhase({ stopReason: "toolUse", toolCallCount: 2, steering: 1, followUp: 0 }) → "tools"
 *   nextPhase({ stopReason: "stop", toolCallCount: 0, steering: 1, followUp: 0 }) → "llm"
 *   nextPhase({ stopReason: "stop", toolCallCount: 0, steering: 0, followUp: 1 }) → "llm"
 *   nextPhase({ stopReason: "error", toolCallCount: 2, steering: 1, followUp: 1 }) → "end"
 *
 * 提示：先判 error/aborted，再判 toolUse，最后才看两个队列。
 */
export function nextPhase(turn: TurnSnapshot): LoopPhase {
  throw new Error("TODO");
}`,
  },
  {
    name: "orderAgentEvents",
    testSuite: "orderAgentEvents",
    skeleton: `/**
 * 【场景】测试想录一段 Agent 事件流回放，先校验它嵌套合法。
 *
 * 【转换点】事件嵌套 🔴：agent_start → (turn_start → message_start /
 * message_update / message_end → tool_execution_start / update / end →
 * turn_end)* → agent_end。规则：必须以 agent_start 开头、agent_end 结尾；
 * turn 必须配对且至少一个；message_update 只能出现在 message_start 之后、
 * message_end 之前（消息不可嵌套）；tool_execution_update/end 只能出现在
 * 自己的 start 之后。其它未知事件一律不合法。
 *
 * 任务：合法 → true，否则 false。
 * 示例：
 *   [agent_start, turn_start, message_start, message_end, turn_end, agent_end] → true
 *   [turn_start, ..., agent_end] → false（缺 agent_start）
 *   [agent_start, turn_start, message_update, turn_end, agent_end] → false（update 游离）
 *   [] → false
 *
 * 提示：剥掉首尾后按 turn 分段扫描，用两个布尔（消息开没开、工具开没开）当栈。
 */
export function orderAgentEvents(events: AgentEventSim[]): boolean {
  throw new Error("TODO");
}`,
  },
  {
    name: "splitTurns",
    testSuite: "splitTurns",
    skeleton: `/**
 * 【场景】UI 想给每轮 turn 画一张卡（第 1 轮查库存、第 2 轮总结），要把事件流切块。
 *
 * 【转换点】turn 边界就是 turn_start … turn_end（含端点）。事件流里还有
 * agent_start / agent_end / agent_settled 这类 run 级事件——它们不属于任何
 * turn，跳过。没有 turn 的流 → 空数组。
 *
 * 任务：返回事件数组的数组，每 组是一轮 turn（含 turn_start / turn_end）。
 * 示例：
 *   [agent_start, turn_start, message_end, turn_end, agent_end] →
 *     [[turn_start, message_end, turn_end]]（run 级事件被跳过）
 *   [agent_start, agent_end] → []
 *   [] → []
 *
 * 提示：见到 turn_start 开新组，见到 turn_end 关组；组外的事件直接丢弃。
 */
export function splitTurns(events: AgentEventSim[]): AgentEventSim[][] {
  throw new Error("TODO");
}`,
  },
  {
    name: "deliverQueuedAt",
    testSuite: "deliverQueuedAt",
    skeleton: `/**
 * 【场景】用户在模型流式输出时连发两句：「改成只查无线鼠标」（steer）和
 * 「做完再顺便算总价」（followUp）。它们分别在循环的哪个缝隙被投递？
 *
 * 【转换点】三个投递缝隙 🔴：
 *   loop-start（进循环先排一次 steering——用户等待时输入的）
 *   after-turn-end（每轮工具跑完、turn_end 之后、下次 LLM 调用前——再排 steering）
 *   would-stop（本该停了——只在这查 followUp，有货就重启循环）
 * steer 占前两个缝隙；followUp 只占第三个。互不交叉。
 *
 * 任务：该队列在该缝隙会不会被投递？
 * 示例：
 *   deliverQueuedAt("steer", "after-turn-end") → true
 *   deliverQueuedAt("steer", "loop-start") → true
 *   deliverQueuedAt("steer", "would-stop") → false
 *   deliverQueuedAt("followUp", "would-stop") → true
 *   deliverQueuedAt("followUp", "loop-start") → false
 *
 * 提示：不是查表背 6 格——steer = 除 would-stop 外的缝隙，followUp = 只有 would-stop。
 */
export function deliverQueuedAt(kind: QueueKind, gap: LoopGap): boolean {
  throw new Error("TODO");
}`,
  },
  {
    name: "agentStateAfter",
    testSuite: "agentStateAfter",
    skeleton: `/**
 * 【场景】一轮结束：assistant 要了工具、两条 toolResult 回来了。把新消息
 * 落进 AgentState 的 messages——但不能弄脏旧数组（事件监听器和 UI 都拿着旧快照）。
 *
 * 【转换点】不可变更新 🟡：Pi 的 AgentState 给 messages 用 accessor，赋值新
 * 数组时会拷贝顶层数组。等价写法：{ ...state, messages: [...state.messages,
 * ...incoming] }——新对象、新数组、旧的一字不动。
 *
 * 任务：返回新 state（其余字段原样保留，messages 追加 incoming）。
 * 示例：
 *   state 有 1 条 user 消息，incoming 是 1 条 assistant + 2 条 toolResult
 *     → 结果 messages 共 4 条，末尾是 MS-002 的结果
 *   入参 state 的 messages 仍是 1 条（不许原地 push）
 *   incoming 为空 → 仍返回新对象、新数组
 *
 * 提示：spread 两层；千万别 state.messages.push(...)。
 */
export function agentStateAfter(state: SimAgentState, incoming: SimMessage[]): SimAgentState {
  throw new Error("TODO");
}`,
  },
  {
    name: "isSettled",
    testSuite: "isSettled",
    skeleton: `/**
 * 【场景】状态栏想在 Agent「真的不再动了」时才显示空闲。事件流摆在眼前，停了吗？
 *
 * 【转换点】agent_end ≠ 真停 🔴：它只是这一次 run 的最后一个事件，session 层
 * 还可能 auto-retry / compaction / follow-up 再起一轮。agent_settled 是
 * session 层事件，「不会再自动续了」才发。判定：最后一个事件必须是
 * agent_settled，且它之前存在 agent_end。
 *
 * 任务：真停 → true，否则 false。
 * 示例：
 *   [agent_start, …, turn_end, agent_end, agent_settled] → true
 *   [agent_start, …, agent_end] → false（还可能 retry / compaction / follow-up）
 *   [agent_start, …, agent_end, auto_retry_start] → false
 *   [agent_settled] → false（没跑过 run，哪来的停）
 *
 * 提示：先看尾事件，再回头找 agent_end。综合 §28.1–§28.6。
 */
export function isSettled(events: AgentEventSim[]): boolean {
  throw new Error("TODO");
}`,
  },
];

const assignment = `${preamble}

${functions.map((f) => f.skeleton).join("\n\n")}
`;

const testSource = `describe("loopContinues", () => {
  it("toolUse 且有调用 → 继续", () => {
    expect(loopContinues("toolUse", 2)).toBe(true);
    expect(loopContinues("toolUse", 1)).toBe(true);
  });
  it("两个条件缺一不可（防只看 stopReason）", () => {
    expect(loopContinues("toolUse", 0)).toBe(false);
    expect(loopContinues("stop", 0)).toBe(false);
  });
  it("error / aborted 即使带调用也立刻停", () => {
    expect(loopContinues("error", 2)).toBe(false);
    expect(loopContinues("aborted", 1)).toBe(false);
  });
});

describe("nextPhase", () => {
  it("toolUse 有调用 → 先执行工具（steer 不插队）", () => {
    expect(nextPhase({ stopReason: "toolUse", toolCallCount: 2, steering: 1, followUp: 0 })).toBe("tools");
  });
  it("该停时 steer / followUp 都能再启一轮 LLM", () => {
    expect(nextPhase({ stopReason: "stop", toolCallCount: 0, steering: 1, followUp: 0 })).toBe("llm");
    expect(nextPhase({ stopReason: "stop", toolCallCount: 0, steering: 0, followUp: 1 })).toBe("llm");
  });
  it("队列全空 → end；error / aborted 无视队列", () => {
    expect(nextPhase({ stopReason: "stop", toolCallCount: 0, steering: 0, followUp: 0 })).toBe("end");
    expect(nextPhase({ stopReason: "error", toolCallCount: 2, steering: 1, followUp: 1 })).toBe("end");
    expect(nextPhase({ stopReason: "aborted", toolCallCount: 0, steering: 0, followUp: 0 })).toBe("end");
  });
});

describe("orderAgentEvents", () => {
  it("合法完整流（查库存再回答）", () => {
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
  it("缺 agent_start / agent_end → false", () => {
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
  it("message_update 游离 → false", () => {
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
  it("turn 未关闭 / 工具未配对 / 空数组 → false", () => {
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
  it("两轮各成一组（含端点）", () => {
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
  it("run 级事件不进任何组", () => {
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
  it("空流与无 turn 流 → 空数组", () => {
    expect(splitTurns([])).toEqual([]);
    expect(splitTurns([{ type: "agent_start" }, { type: "agent_end" }])).toEqual([]);
  });
});

describe("deliverQueuedAt", () => {
  it("steer 占 loop-start 与 after-turn-end 两个缝隙", () => {
    expect(deliverQueuedAt("steer", "loop-start")).toBe(true);
    expect(deliverQueuedAt("steer", "after-turn-end")).toBe(true);
  });
  it("steer 不在 would-stop；followUp 只在 would-stop", () => {
    expect(deliverQueuedAt("steer", "would-stop")).toBe(false);
    expect(deliverQueuedAt("followUp", "would-stop")).toBe(true);
    expect(deliverQueuedAt("followUp", "after-turn-end")).toBe(false);
    expect(deliverQueuedAt("followUp", "loop-start")).toBe(false);
  });
});

describe("agentStateAfter", () => {
  it("追加 assistant + 两条 toolResult，保序", () => {
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
  it("不可变：新对象新数组，其余字段原样", () => {
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
  it("空 incoming 也返回新数组", () => {
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
  it("尾事件 agent_settled 且之前有 agent_end → true", () => {
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
  it("只有 agent_end → false（还可能自动续）", () => {
    expect(
      isSettled([
        { type: "agent_start" },
        { type: "agent_end" },
      ]),
    ).toBe(false);
  });
  it("agent_end 之后还有 retry / settled 后又开新 run → false", () => {
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
  it("空流 / 孤儿 settled → false", () => {
    expect(isSettled([])).toBe(false);
    expect(isSettled([{ type: "agent_settled" }])).toBe(false);
  });
});
`;

function sec(
  id: string,
  heading: string,
  secNum: string | null,
  body: string,
  exerciseFunctions: string[],
) {
  return { id, heading, secNum, body, exerciseFunctions };
}

const sections = [
  sec(
    "intro",
    "",
    null,
    `> **预计**：1 天 ｜ **前置**：Ch27（地图已有：\`packages/agent\` 就是本章要进的巷子）
> **目标**：① 口述 Agent 循环全流程——prompt → LLM 流 → 工具并行 → 结果追加 → 再调 LLM，直到 \`stopReason !== "toolUse"\`；② 分清事件嵌套层级；③ 说清 steer / followUp 各在哪个缝隙投递、\`agent_end\` 和 \`agent_settled\` 差在哪。
> 你 15 年 Java：写过 \`while (true)\` 的调度主循环、用 \`CompletableFuture.allOf\` 聚合并行结果。Python：\`asyncio.gather\` + 事件循环。本章读的 \`agent-loop.js\` 就是一个双层 while——心智你早就有，本章把它钉在 Pi 的真实命名上。
> 事实源：本机安装包内 \`node_modules/@earendil-works/pi-agent-core/dist/\`（\`agent-loop.js\` / \`agent.d.ts\` / \`types.d.ts\`）+ \`docs/sdk.md\` / \`docs/extensions.md\`。

> 📐 **本教程的契约**：下面每一节（§28.1–§28.7）都**精确对应**作业里的题。讲过的才考，考的必讲过。卡住时按作业函数名回查对应小节。
> **不讲**：Extension / Skill / Template / Package 的写法（Ch29）、session.jsonl 与 compaction 细节（Ch30）、RPC 协议分帧（Ch31）。作业不 import 真 Pi 包、不打网。

---`,
    [],
  ),
  sec(
    "sec-map",
    "🗺️ 本章地图",
    null,
    `本章主线：**把 Agent 循环钉在墙上**。M5 你调 \`new Agent\` / \`createAgentSession\` 时把它当黑盒；本章打开 \`packages/agent\`（pi-agent-core）的 \`agent-loop.js\`，你会发现核心就一个双层 \`while\`：内层转「工具轮」，外层只管 followUp 续命。

读完这章 + 完成作业，你将能够：

- 说出循环的继续条件：\`stopReason === "toolUse"\` **且** 消息里真有 toolCall
- 拿到一轮快照，判出下一阶段是「调 LLM / 执行工具 / 结束」
- 校验事件嵌套顺序：\`agent_start ⊃ turn_start ⊃ message_* ⊃ tool_execution_* ⊃ turn_end ⊃ agent_end\`
- 把事件流按 turn 切块给 UI 用
- 说清 steer / followUp 各在哪三个缝隙中的哪个投递
- 不可变地更新 \`AgentState.messages\`（换新数组，不原地 push）
- 区分 \`agent_end\`（这次 run 结束）和 \`agent_settled\`（真不再动了）

**作业 ↔ 教程对应表**（学哪节，就去做哪题）：

| 作业题 | 对应小节 | 核心知识点 |
|--------|----------|-----------|
| \`loopContinues\` | §28.1 | 继续条件：toolUse + 有 toolCall |
| \`nextPhase\` | §28.2 | 快照 → 调 LLM / 执行工具 / 结束 |
| \`orderAgentEvents\` | §28.3 | 事件嵌套顺序校验 |
| \`splitTurns\` | §28.4 | 事件流按 turn 切分 |
| \`deliverQueuedAt\` | §28.5 | steer / followUp 的投递缝隙 |
| \`agentStateAfter\` | §28.6 | 不可变更新 state.messages |
| \`isSettled\` | §28.7 | agent_settled 才算真停（综合） |

本地文件：\`local/m6/ch28/assignment.ts\`（改 TODO）、\`assignment.test.ts\`、\`demo.ts\`（真 Pi 片段复制区，测试不要 import）。M6 章**没有** \`app.ts\`——研究章不建 HTTP 服务。

跑测试：\`bun test local/m6/ch28\`。

---`,
    [],
  ),
  sec(
    "sec-path",
    "⏱️ 学习路径：费曼五步（约 60–90 分钟）",
    null,
    `| 步 | 你要做 | 在哪做 |
|----|--------|--------|
| ① 预览猜（2 分钟） | 猜循环退出条件、steer 投递时机、settled 语义 | 本页 ① |
| ② 先动手 | 打开 \`local/m6/ch28/assignment.ts\` 改 TODO | 仓库 local/ |
| ③ 提取+反馈 | \`bun test local/m6/ch28\` 看红绿 | 终端 |
| ④ 费曼（2 分钟） | 大白话讲清「为什么 agent_end 不等于停」 | 本页 ④ |
| ⑤ 存闪卡 | 章末闪卡标复习日期 | 闪卡 |

> 💡 网页这一章是只读的。作业全部是对假事件流 / 假状态的纯函数，无 Key 也全绿。
> 想看真代码：按 §28.0 的命令打开本机安装包里的 \`agent-loop.js\` 对照。

---`,
    [],
  ),
  sec(
    "sec-guess",
    "① 预览猜（2 分钟 · 激活你的 Java / Python 直觉）",
    null,
    `先别看答案，凭经验猜一猜（猜错没关系）：

1. 一次 \`prompt()\` 一定只对应一次 LLM 调用吗？模型要了 2 个工具后会怎样？
2. 模型一条回复里带了 2 个 toolCall（查 KB-001 和 MS-002），两个工具是串行还是并行执行？
3. 工具结果怎么「回到」对话里？下一次 LLM 调用看到的是什么？
4. 模型正在流式输出，你插一句「改成只查无线鼠标」——它会打断当前输出吗？
5. 收到 \`agent_end\` 事件，Agent 是不是真的停了？
6. Java 里你写 \`while (true)\` 调度循环，退出条件集中在一处；Pi 的内层循环继续条件是哪两个？

> 猜完，带着验证心态进入正文。第 2、4、5 题是本章的 🔴。

---`,
    [],
  ),
  sec(
    "sec-world",
    "总览：为什么需要一个循环 🔴",
    null,
    `**机制（先想清楚再读代码）**：一次 LLM 调用只能「说一段话」或「要一批工具」——它自己不会等工具跑完再接着说。所以必须有人把工具结果**追加回消息列表**，再发起下一次 LLM 调用；如此往复，直到模型不再要工具。这个「送回去再问」的往复就是 Agent 循环。你写 Java 调度器时的 \`while (running) { task = queue.poll(); result = run(task); queue.offer(callback(result)); }\` 是同一个形状；Python 课 M5 讲过 ReAct 原理——本章只看它在 pi-agent-core 里的 TypeScript 落地（~200 行，双层 while）。

主线场景（贯穿全章）：用户问「机械键盘和无线鼠标还有货吗」→

\`\`\`mermaid
flowchart TB
    u["用户 prompt：机械键盘和无线鼠标还有货吗"] --> as["agent_start"]
    as --> ts["turn_start"]
    ts --> llm["流式调 LLM<br/>message_start / update / end"]
    llm --> q1{"stopReason 是 toolUse<br/>且有 toolCall?"}
    q1 -->|"是"| tools["并行执行工具<br/>tool_execution_start / end"]
    tools --> app["toolResult 追加进 messages"]
    app --> te["turn_end"]
    te --> sq{"steering 队列有货?"}
    sq -->|"有"| ts
    sq -->|"空"| fq{"本该停了：<br/>followUp 有货?"}
    q1 -->|"否"| fq
    fq -->|"有"| ts
    fq -->|"空"| ae["agent_end"]
    ae --> more{"session 层还会自动续吗?<br/>auto-retry / compaction / followUp"}
    more -->|"会（新一次 run）"| as
    more -->|"不会"| st["agent_settled：真停"]

    style u fill:#80DEEA,stroke:#0097A7,color:#1f1f1f
    style as fill:#FFE082,stroke:#F9A825,color:#1f1f1f
    style ts fill:#FFE082,stroke:#F9A825,color:#1f1f1f
    style llm fill:#90CAF9,stroke:#1976D2,color:#1f1f1f
    style q1 fill:#80DEEA,stroke:#0097A7,color:#1f1f1f
    style tools fill:#A5D6A7,stroke:#388E3C,color:#1f1f1f
    style app fill:#A5D6A7,stroke:#388E3C,color:#1f1f1f
    style te fill:#FFE082,stroke:#F9A825,color:#1f1f1f
    style sq fill:#80DEEA,stroke:#0097A7,color:#1f1f1f
    style fq fill:#80DEEA,stroke:#0097A7,color:#1f1f1f
    style ae fill:#CE93D8,stroke:#7B1FA2,color:#1f1f1f
    style more fill:#80DEEA,stroke:#0097A7,color:#1f1f1f
    style st fill:#EF9A9A,stroke:#C62828,color:#1f1f1f
\`\`\`

对照表：

| | Java | Python | pi-agent-core |
|---|---|---|---|
| 主循环 | \`while (true)\` 调度器 | asyncio 事件循环 | \`runLoop\` 双层 while |
| 并行聚合 | \`CompletableFuture.allOf\` | \`asyncio.gather\` | 默认 \`toolExecution: "parallel"\` |
| 结果回灌 | 回调重新入队 | await 后 append | toolResult 追加进 \`messages\` |
| 停止 | running 标志 | 任务清空 | \`stopReason !== "toolUse"\` 且队列空 |

**事件即协议**：循环每走一步都发事件（\`agent_start\` / \`turn_start\` / \`message_*\` / \`tool_execution_*\` / \`turn_end\` / \`agent_end\`）。TUI、json 模式、RPC、你的订阅回调，看到的都是同一条事件流——四种运行模式（Ch27）只是不同的「壳」。

想亲眼看真代码（不 clone 仓库，安装包里就有）：

\`\`\`bash
ROOT="$(npm root -g)/@earendil-works/pi-coding-agent"
ls "$ROOT/node_modules/@earendil-works/pi-agent-core/dist"   # agent-loop.js / agent.d.ts / types.d.ts
\`\`\`

### ❌ / ✅

\`\`\`ts
// ❌ 以为 prompt() = 一次 LLM 调用（模型要工具就是 N 次）
// ❌ 以为工具结果是「返回值」直接给模型（是追加成消息，下一轮整段重发）
// ❌ 在作业里 import 真 Pi 包（作业用假事件流测真机制）
// ✅ 读 agent-loop.js 对照本节流程图；作业全部纯函数复刻判定点
\`\`\`

---`,
    [],
  ),
  sec(
    "sec-28.1",
    "§28.1 循环什么时候继续（对应：`loopContinues`）🟡",
    "28.1",
    `pi-ai 的 \`StopReason\` 是七值联合（本机 \`pi-ai/dist/types.d.ts\` 原文）：

\`\`\`ts
type StopReason = "pending" | "stop" | "length" | "toolUse" | "error" | "aborted" | "deferred";
\`\`\`

循环只关心一个判定：**要工具吗？** 内层循环的继续条件是「这条 assistant 消息里有 toolCall」。模型表示「我要工具」的方式就是 \`stopReason: "toolUse"\`。两个条件必须同时成立：

| stopReason | toolCallCount | 继续？ | 发生什么 |
|---|---|---|---|
| \`"toolUse"\` | 2 | ✅ | 执行工具 → 结果追加 → 再调 LLM |
| \`"toolUse"\` | 0 | ❌ | 防死循环：说要工具却没给，不转 |
| \`"stop"\` | 0 | ❌ | 模型答完了，收尾 |
| \`"error"\` / \`"aborted"\` | 任意 | ❌ | **立刻** turn_end + agent_end，工具不执行 |

Java 对照：\`if (msg.stopReason == TOOL_USE && !msg.toolCalls.isEmpty())\`——和你写分发循环前先验 payload 是同一个肌肉记忆。Python：\`if msg.stop_reason == "tool_use" and msg.tool_calls:\`。

\`\`\`ts
function loopContinues(stopReason: string, toolCallCount: number): boolean {
  return stopReason === "toolUse" && toolCallCount > 0;
}
\`\`\`

\`"length"\` 值得一句话：输出被 token 上限截断时，消息里可能带着**参数残缺**的 toolCall——循环不会正常执行它们，而是整批判错（fail fast，和 Java 里「截断的报文别解析」同理）。这超出本章作业范围，知道即可。

### ❌ / ✅

\`\`\`ts
// ❌ return stopReason === "toolUse"（toolUse 但 0 个调用会死循环）
// ❌ return toolCallCount > 0（error 消息里也可能残留 toolCall）
// ✅ 两个条件 && 起来；error / aborted 一票否决
\`\`\`

> ✅ **做 \`loopContinues\`**：两个条件缺一不可。

---`,
    ["loopContinues"],
  ),
  sec(
    "sec-28.2",
    "§28.2 下一阶段是什么（对应：`nextPhase`）🔴",
    "28.2",
    `**机制**：为什么「该停了」还能复活？看 \`agent-loop.js\` 里内层循环的真身（本机编译产物，变量名保真）：

\`\`\`js
// 外层：只为一件事——本该停后查 followUp
while (true) {
  let hasMoreToolCalls = true;
  // 内层：有工具调用，或有待注入消息，就一直转
  while (hasMoreToolCalls || pendingMessages.length > 0) {
    /* 注入 pending 消息 → 流式调 LLM → 执行工具 → turn_end → 排 steering */
  }
  const followUpMessages = (await config.getFollowUpMessages?.()) || [];
  if (followUpMessages.length > 0) {
    pendingMessages = followUpMessages;
    continue; // 重启内层
  }
  break;
}
await emit({ type: "agent_end", messages: newMessages });
\`\`\`

注意内层条件是**或**：\`hasMoreToolCalls || pendingMessages.length > 0\`。所以「模型说 stop 但 steering 队列有货」时，循环照样再转一轮——steer 消息注入后再次调 LLM。这就是 §28.5 缝隙②的威力。

把一轮结束时的快照（stopReason、toolCallCount、两个队列长度）交给 \`nextPhase\`，按**固定优先级**判下一阶段：

1. \`"error"\` / \`"aborted"\` → \`"end"\`：立刻收摊，队列看都不看（对照 Java：异常路径不走正常关闭钩子）
2. \`"toolUse"\` 且有调用 → \`"tools"\`：工具优先；排队中的 steer 不插队，等工具跑完
3. 该停了，但 steering 或 followUp 有货 → \`"llm"\`：注入后重启一轮
4. 都空 → \`"end"\`

\`\`\`ts
function nextPhase(turn: TurnSnapshot): LoopPhase {
  if (turn.stopReason === "error" || turn.stopReason === "aborted") return "end";
  if (turn.stopReason === "toolUse" && turn.toolCallCount > 0) return "tools";
  if (turn.steering > 0 || turn.followUp > 0) return "llm";
  return "end";
}
\`\`\`

Java 对照：这就是一个三态状态机，像线程池的 RUNNING → SHUTDOWN → TIDYING → TERMINATED，转换条件写死且有序。电商场景例：助手查完两个商品（tools 轮）→ 总结回答（llm 轮）→ 用户 followUp「顺便算总价」→ 又一轮 llm → 真停。

### ❌ / ✅

\`\`\`ts
// ❌ 先看 steering 再判 toolUse（steer 会插队工具，错）
// ❌ error 时还想排空队列（异常路径没有「下一轮」）
// ✅ error/aborted → toolUse → 队列，从上往下一层层判
\`\`\`

> ✅ **做 \`nextPhase\`**：优先级顺序就是考点。

---`,
    ["nextPhase"],
  ),
  sec(
    "sec-28.3",
    "§28.3 事件嵌套怎么校验（对应：`orderAgentEvents`）🔴",
    "28.3",
    `**机制**：为什么事件是嵌套的而不是一条平铺日志？因为事件流是**增量 UI 协议**：外层事件开/关「容器」，内层事件更新「内容」。UI 按层订阅——气泡组件只关心 \`message_*\`，工具面板只关心 \`tool_execution_*\`，谁都不用解析别人的载荷。这和 XML SAX 的 \`startDocument / startElement / characters / endElement / endDocument\` 五层完全同构（Java 老手的肌肉记忆），也像结构化日志的 scope 嵌套。

Pi 的五层嵌套（core \`AgentEvent\`，本机 \`types.d.ts\`）：

\`\`\`mermaid
flowchart LR
    subgraph run["agent_start … agent_end：一次 run"]
        direction TB
        subgraph turn["turn_start … turn_end：一轮 = 一次 LLM 响应 + 工具"]
            direction LR
            subgraph msg["message_start / update / end：一条消息"]
                d["text_delta 等流式增量"]
            end
            subgraph tool["tool_execution_start / update / end：一个工具"]
                t["并行工具各一对 start / end"]
            end
            msg --> tool
        end
    end
    run --> settled["agent_settled：session 层（§28.7）"]

    style run fill:#E3F2FD,stroke:#1976D2,color:#1f1f1f
    style turn fill:#BBDEFB,stroke:#1976D2,color:#1f1f1f
    style msg fill:#90CAF9,stroke:#1976D2,color:#1f1f1f
    style d fill:#64B5F6,stroke:#1976D2,color:#1f1f1f
    style tool fill:#A5D6A7,stroke:#388E3C,color:#1f1f1f
    style t fill:#C8E6C9,stroke:#388E3C,color:#1f1f1f
    style settled fill:#EF9A9A,stroke:#C62828,color:#1f1f1f
\`\`\`

时序上，一轮 turn 里先 \`message_start → message_update* → message_end\`（assistant 流式），工具执行**在消息关闭之后**：\`tool_execution_start → update* → end\`。注入的 steer / 首轮 prompt 消息也是一对 \`message_start / message_end\`（没有 update）。

校验思路 = 编译原理的括号匹配：剥掉 \`agent_start\` 首和 \`agent_end\` 尾，剩下的按 \`turn_start … turn_end\` 分段；段内用两个布尔（「消息开没开」「工具开没开」）当栈。Python 里你用过一个 \`stack\` + \`dict\` 做同样的事；Java 用 \`Deque<Character>\` 校验 XML。

\`\`\`ts
function orderAgentEvents(events: { type: string }[]): boolean {
  if (events.length === 0) return false;
  if (events[0].type !== "agent_start") return false;
  if (events[events.length - 1].type !== "agent_end") return false;
  const inner = events.slice(1, -1);
  let j = 0;
  let sawTurn = false;
  while (j < inner.length) {
    if (inner[j].type !== "turn_start") return false;
    j++;
    let messageOpen = false;
    let toolOpen = false;
    while (j < inner.length && inner[j].type !== "turn_end") {
      const t = inner[j].type;
      if (t === "message_start") {
        if (messageOpen) return false; // 消息不可嵌套
        messageOpen = true;
      } else if (t === "message_update") {
        if (!messageOpen) return false;
      } else if (t === "message_end") {
        if (!messageOpen) return false;
        messageOpen = false;
      } else if (t === "tool_execution_start") {
        if (toolOpen) return false;
        toolOpen = true;
      } else if (t === "tool_execution_update") {
        if (!toolOpen) return false;
      } else if (t === "tool_execution_end") {
        if (!toolOpen) return false;
        toolOpen = false;
      } else {
        return false; // 未知事件
      }
      j++;
    }
    if (j >= inner.length) return false; // turn 没关
    if (messageOpen || toolOpen) return false;
    j++; // 跳过 turn_end
    sawTurn = true;
  }
  return sawTurn; // 至少一轮
}
\`\`\`

### ❌ / ✅

\`\`\`ts
// ❌ 只数事件个数对不对（顺序才是语义）
// ❌ 忘了「至少一个 turn」——agent_start 紧跟 agent_end 不是合法 run
// ✅ 剥首尾 → 按 turn 分段 → 两个布尔当栈
\`\`\`

> ✅ **做 \`orderAgentEvents\`**：一次跑通键盘 + 鼠标整条流。

---`,
    ["orderAgentEvents"],
  ),
  sec(
    "sec-28.4",
    "§28.4 事件流按 turn 切分（对应：`splitTurns`）🟡",
    "28.4",
    `UI 常按「轮」组织界面：第 1 轮卡片显示「查了 KB-001 和 MS-002 两个工具」，第 2 轮卡片显示总结回答。切分边界就是 \`turn_start … turn_end\`（含端点）；\`agent_start\` / \`agent_end\` / \`agent_settled\` 是 run 级事件，不属于任何一轮，跳过。

主线例子（完整事件流见 §28.3）：

| 输入 | 输出 |
|---|---|
| \`[agent_start, turn_start, …, turn_end, turn_start, …, turn_end, agent_end, agent_settled]\` | 两组：第 1 组含两个工具对，第 2 组含总结消息 |
| \`[agent_start, agent_end]\` | \`[]\`（没有 turn） |
| \`[]\` | \`[]\` |

\`\`\`ts
function splitTurns(events: AgentEventSim[]): AgentEventSim[][] {
  const groups: AgentEventSim[][] = [];
  let current: AgentEventSim[] | null = null;
  for (const e of events) {
    if (e.type === "turn_start") {
      current = [e];
    } else if (current !== null) {
      current.push(e);
      if (e.type === "turn_end") {
        groups.push(current);
        current = null;
      }
    }
  }
  if (current !== null) groups.push(current);
  return groups;
}
\`\`\`

Java 对照：\`Stream.collect(groupingBy)\` 是「有键可分」时的做法；这里是**增量扫描**——事件一条条来（流式！），没有回头路，就像你解析换行分帧的协议只能向前读。Python：生成器 + 状态变量同款。

为什么含端点：每组自带 \`turn_start / turn_end\`，回放时不用再猜边界；未闭合的尾组（录制中途崩溃）也整段吐出来，数据不丢——和 Ch31 RPC 的 JSONL 分帧同一个「边界自负」思路。

### ❌ / ✅

\`\`\`ts
// ❌ 把 agent_end 也塞进最后一组（run 级 ≠ turn 级）
// ❌ 用 filter(e => e.type !== "turn_start") 丢掉边界
// ✅ 见 turn_start 开组、turn_end 关组；组外事件丢弃
\`\`\`

> ✅ **做 \`splitTurns\`**：给 UI 的按轮分组器。

---`,
    ["splitTurns"],
  ),
  sec(
    "sec-28.5",
    "§28.5 steer / followUp 的投递缝隙（对应：`deliverQueuedAt`）🔴",
    "28.5",
    `**机制**：用户不会等 Agent 闲下来才说话。流式输出到一半时用户插的话，Pi 不打断当前流——它把插话排进两个队列之一，在循环的固定「缝隙」投递。看 \`agent-loop.js\` 的三个查队点（本机编译产物）：

\`\`\`js
// 缝隙① loop-start：进循环先查一次 steering（用户等待时输入的）
let pendingMessages = (await config.getSteeringMessages?.()) || [];
while (true) {
  while (hasMoreToolCalls || pendingMessages.length > 0) { /* 一轮 turn */ }
  // 缝隙③ would-stop：本该停了，只在这查 followUp
  const followUpMessages = (await config.getFollowUpMessages?.()) || [];
  if (followUpMessages.length > 0) { pendingMessages = followUpMessages; continue; }
  break;
}
// 缝隙② after-turn-end：每轮 turn_end 之后、下次 LLM 调用前，再排 steering
\`\`\`

\`\`\`mermaid
flowchart LR
    g1["缝隙① loop-start<br/>查 steering"] --> t1["turn 1：注入 → LLM → 工具"]
    t1 --> g2["缝隙② after-turn-end<br/>查 steering（工具已跑完）"]
    g2 --> t2["turn 2：注入后再调 LLM"]
    t2 --> g3["缝隙③ would-stop<br/>只在这查 followUp"]
    g3 -->|"有货：重启循环"| t3["再来一轮 turn"]
    g3 -->|"空"| end1["agent_end → agent_settled"]

    style g1 fill:#FFE082,stroke:#F9A825,color:#1f1f1f
    style t1 fill:#90CAF9,stroke:#1976D2,color:#1f1f1f
    style g2 fill:#FFE082,stroke:#F9A825,color:#1f1f1f
    style t2 fill:#90CAF9,stroke:#1976D2,color:#1f1f1f
    style g3 fill:#FFCC80,stroke:#F57C00,color:#1f1f1f
    style t3 fill:#90CAF9,stroke:#1976D2,color:#1f1f1f
    style end1 fill:#EF9A9A,stroke:#C62828,color:#1f1f1f
\`\`\`

官方语义（\`agent.d.ts\` 原文）：steer = **injected after the current assistant turn finishes**（本轮工具跑完后、下次 LLM 调用前）；followUp = **run only after the agent would otherwise stop**（本该停了才轮到它）。SDK 层 \`session.steer(text)\` / \`session.followUp(text)\` 就是往这两个队列塞消息；队列变化会发 \`queue_update\` 事件（带 \`steering\` / \`followUp\` 两个数组）。还有一条 API 规矩：流式期间直接 \`prompt()\` 不带 \`streamingBehavior\` 会**抛错**——必须明说 steer 还是 followUp。

\`\`\`ts
function deliverQueuedAt(kind: QueueKind, gap: LoopGap): boolean {
  if (kind === "steer") return gap === "loop-start" || gap === "after-turn-end";
  return gap === "would-stop";
}
\`\`\`

Java 对照：线程池 \`shutdown()\` 后「已提交任务跑完、新任务拒绝」vs \`shutdownNow()\` 抢断——两种「什么时候生效」的语义你早就会选；steer/followUp 是同一道题。电商场景：用户见助手在查库存，插话「改成只查无线鼠标」（steer，本轮工具跑完就注入）vs「查完顺便算总价」（followUp，等它真要停了再跑）。

### ❌ / ✅

\`\`\`ts
// ❌ 以为 steer 会打断当前流（不打断，等缝隙②）
// ❌ 以为 followUp 本轮就注入（它只占缝隙③）
// ❌ 六个组合背表（steer = 非 would-stop；followUp = 只有 would-stop）
\`\`\`

> ✅ **做 \`deliverQueuedAt\`**：三个缝隙，两种队列，互不交叉。

---`,
    ["deliverQueuedAt"],
  ),
  sec(
    "sec-28.6",
    "§28.6 不可变更新 state.messages（对应：`agentStateAfter`）🟡",
    "28.6",
    `\`AgentState\`（本机 \`agent.d.ts\`）是 Agent 的公开状态：

| 字段 | 类型 | 说明 |
|---|---|---|
| \`systemPrompt\` | string | 每次请求都带的系统提示 |
| \`model\` | Model | 当前模型 |
| \`thinkingLevel\` | ThinkingLevel | 推理档位 |
| \`tools\` | AgentTool[] | 可用工具（赋值时**拷贝顶层数组**） |
| \`messages\` | AgentMessage[] | 对话转录（赋值时**拷贝顶层数组**） |
| \`isStreaming\` | boolean（只读） | \`agent_end\` 的监听器都跑完才变 false |
| \`streamingMessage\` | AgentMessage（只读） | 当前流式中的半成品消息 |
| \`pendingToolCalls\` | ReadonlySet（只读） | 正在执行的工具调用 id |
| \`errorMessage\` | string（只读） | 最近一次失败/中止的原因 |

注意 \`agent.d.ts\` 的原话：**Assigning \`state.messages\` copies the top-level array**——messages 和 tools 是 accessor，赋值时做顶层数组拷贝（防御性拷贝，Java \`List.copyOf\` / \"unmodifiable view\" 同款思路）。为什么不可变：订阅回调和 UI（M3 的 reducer 心智）都可能拿着旧快照；原地 \`push\` 会把所有快照一起污染。

\`\`\`mermaid
flowchart LR
    old["state.messages（旧数组，1 条 user）"] --> sp["spread：[...old, ...incoming]"]
    inc["incoming：assistant + 2 条 toolResult"] --> sp
    sp --> newA["新数组（4 条）<br/>旧数组一字不动"]

    style old fill:#90CAF9,stroke:#1976D2,color:#1f1f1f
    style inc fill:#A5D6A7,stroke:#388E3C,color:#1f1f1f
    style sp fill:#FFE082,stroke:#F9A825,color:#1f1f1f
    style newA fill:#CE93D8,stroke:#7B1FA2,color:#1f1f1f
\`\`\`

\`\`\`ts
function agentStateAfter(state: SimAgentState, incoming: SimMessage[]): SimAgentState {
  return { ...state, messages: [...state.messages, ...incoming] };
}
\`\`\`

电商场景：user「机械键盘和无线鼠标还有货吗」→ 追加 assistant（要工具）+ 两条 toolResult（KB-001 剩 12、MS-002 剩 7）→ 下一轮 LLM 看到的就是这 4 条。对照 Ch13 的 \`appendMessage\`——同一个不可变更新模式，只是这次换到了 Agent 状态上。

### ❌ / ✅

\`\`\`ts
// ❌ state.messages.push(...incoming)（污染所有旧快照，freeze 的测试当场报错）
// ❌ return state（必须新对象 + 新数组）
// ✅ 两层 spread；空 incoming 也返回新数组
\`\`\`

> ✅ **做 \`agentStateAfter\`**：append-only，永不回头改。

---`,
    ["agentStateAfter"],
  ),
  sec(
    "sec-28.7",
    "§28.7 agent_end ≠ 真停（对应：`isSettled`）🔴",
    "28.7",
    `**机制**：\`agent_end\` 的文档原话——「the last event emitted for a run」。**一次 run**。但 session 层（coding-agent 包，Ch27 的主包）在 run 结束后还可能自动续命：auto-retry（provider 报错自动重试）、compaction（上下文超限先压缩再跑，Ch30 细讲）、follow-up（队列里还有话）。每续一次就是**新的一次 run**（新的 \`agent_start … agent_end\`）。只有确认「不会再自动续了」，session 才发 \`agent_settled\`。

关键分层（对着 Ch27 的地图看）：

- \`agent_end\` 在 **pi-agent-core** 的 \`AgentEvent\` 里
- \`agent_settled\` 只在 **coding-agent** 的 \`AgentSessionEvent\` 里（\`Exclude<AgentEvent, …>\` 之后再补的事件）——core 包根本不知道 retry/compaction 的存在

\`\`\`mermaid
flowchart TB
    ae["agent_end：这一次 run 的最后一个事件"] --> q{"session 层还会自动续吗?<br/>auto-retry / compaction / followUp"}
    q -->|"会"| ns["新一次 run：<br/>agent_start → … → agent_end"]
    ns --> q
    q -->|"不会"| st["agent_settled：不会再自动动了"]
    ui["状态栏 / RPC 客户端 / 扩展"] -.->|"等它，别等 agent_end"| st

    style ae fill:#CE93D8,stroke:#7B1FA2,color:#1f1f1f
    style q fill:#80DEEA,stroke:#0097A7,color:#1f1f1f
    style ns fill:#BBDEFB,stroke:#1976D2,color:#1f1f1f
    style st fill:#EF9A9A,stroke:#C62828,color:#1f1f1f
    style ui fill:#FFE082,stroke:#F9A825,color:#1f1f1f
\`\`\`

Java 对照：\`Thread.isAlive() == false\` 不等于「任务系统静默了」——重试框架可能再提交一次；你得等调度器自己的「全部完成」信号。Python：\`asyncio.gather\` 返回≠没有 retry 装饰器再跑。RPC 客户端同理（\`rpc-client.d.ts\` 原话：Resolves when \`agent_settled\` event is received）——Ch31 会再遇到它。

判定函数综合全章：**尾事件必须是 \`agent_settled\`，且它之前存在 \`agent_end\`**（没跑过 run 谈不上停）。

\`\`\`ts
function isSettled(events: AgentEventSim[]): boolean {
  if (events.length === 0) return false;
  if (events[events.length - 1].type !== "agent_settled") return false;
  return events.some((e) => e.type === "agent_end");
}
\`\`\`

四个反例都在作业里：只有 \`agent_end\`（还可能自动续）、\`agent_end\` 后跟 \`auto_retry_start\`、\`settled\` 后又冒出 \`agent_start\`（用户发了新 prompt）、孤儿 \`settled\`。

### ❌ / ✅

\`\`\`ts
// ❌ 收到 agent_end 就把状态栏切成「空闲」（retry 一来就穿帮）
// ❌ 只看「流里出现过 agent_settled」（后面又开新 run 了呢）
// ✅ 看尾事件 + 回头找 agent_end
\`\`\`

> ✅ **做 \`isSettled\`**：然后 \`bun test local/m6/ch28\`。

---`,
    ["isSettled"],
  ),
  sec(
    "sec-pits",
    "⚠️ Java / Python 老手几个坑",
    null,
    `1. **以为 prompt() = 一次 LLM 调用。** 模型要工具就是 N 次调用、N 轮 turn。
2. **继续条件只看 stopReason。** \`"toolUse"\` 但 0 个 toolCall 照样死循环——两个条件 &&。
3. **error / aborted 还等工具结果。** 立刻 turn_end + agent_end，工具根本不执行。
4. **把 steer 当「打断」。** 它不打断当前流，等本轮工具跑完的缝隙②。
5. **以为 followUp 本轮就注入。** 它只占缝隙③ would-stop。
6. **流式期间裸调 prompt()。** 不带 \`streamingBehavior\` 会抛错，必须明说 steer / followUp。
7. **收到 agent_end 就当停了。** auto-retry / compaction / followUp 还能续命；agent_settled 才是真停。
8. **在 core 的 AgentEvent 里找 agent_settled。** 它是 coding-agent 的 session 层事件，分层别搞混。
9. **原地 push state.messages。** accessor 只在**赋值**时拷贝；push 直接污染旧快照。
10. **作业里 import 真 Pi 包 / 打网。** M6 作业全是假数据纯函数，红线不变。

---`,
    [],
  ),
  sec(
    "sec-homework",
    "📝 本章作业",
    null,
    `上面 7 个函数按节交错出现。每个注释里有【场景】【转换点】、示例和提示。

**完成方式**：打开仓库 \`local/m6/ch28/assignment.ts\`，把 \`throw new Error("TODO")\` 换成实现，然后：

\`\`\`bash
bun test local/m6/ch28
\`\`\`

M6 没有 \`app.ts\`：本章不建 HTTP 服务。真 Pi 片段（事件订阅 switch、steer/followUp 示例、读 agent-loop.js 的命令）在 \`demo.ts\` 复制区，**测试不要 import 它**。

卡住就回对应 §：\`loopContinues\` → §28.1，\`nextPhase\` → §28.2，\`orderAgentEvents\` → §28.3，\`splitTurns\` → §28.4，\`deliverQueuedAt\` → §28.5，\`agentStateAfter\` → §28.6，\`isSettled\` → §28.7。

---`,
    [],
  ),
  sec(
    "sec-check",
    "✅ 自测：你真的掌握了吗？",
    null,
    `- [ ] 能在白板上画出循环全景图：prompt → LLM 流 → 工具并行 → 追加 → 再调 LLM → … → agent_end → agent_settled
- [ ] 背出继续条件：stopReason === "toolUse" **且** 有 toolCall；error / aborted 一票否决
- [ ] 拿快照能三秒判下一阶段：error → end；toolUse → tools；该停但有队列 → llm；空 → end
- [ ] 能写出五层事件嵌套，并说清 message_* 和 tool_execution_* 谁包谁（都不互相包，前后脚）
- [ ] 说得出三个缝隙各查哪个队列；steer 不打断、followUp 只在 would-stop
- [ ] 知道流式期间裸 prompt() 会抛错，要带 streamingBehavior
- [ ] state.messages 更新永远换新数组（两层 spread），绝不 push
- [ ] 能对同事讲清 agent_end 和 agent_settled 差在哪、各属于哪个包
- [ ] \`bun test local/m6/ch28\` 全绿；没 import 真 Pi 包、没打网、没装新依赖

---`,
    [],
  ),
  sec(
    "sec-feynman",
    "🎓 费曼挑战",
    null,
    `用大白话讲给「Java 同事」听。讲不清 = 还没真懂。

任选一题（1–2 分钟）：

1. 「用你写过的调度器循环，讲讲 Pi 的 Agent 循环为什么必须存在、什么时候退出？」— 卡壳重读总览 + §28.1
2. 「用户流式输出到一半插了两句话，一句 steer 一句 followUp——它们分别什么时候生效？为什么不干脆打断？」— 卡壳重读 §28.5
3. 「agent_end 都到了，为什么状态栏还不能显示空闲？」— 卡壳重读 §28.7

---`,
    [],
  ),
  sec(
    "sec-next",
    "⏭️ 下一步",
    null,
    `Ch28 掌握后，循环不是黑盒了。**Ch29 换个维度**：Pi 怎么被「扩展」——Extension（\`pi.on\` / \`pi.registerTool\`）、Skill（SKILL.md）、Template（斜杠命令）、Package（\`pi install\`）四件套各解决什么、放哪、怎么被加载。你会在事件生命周期图上看到本章事件的前后还有哪些钩子。

读之前可以先做一件事：打开安装包 \`docs/extensions.md\` 的 Lifecycle Overview，找到 \`agent_start\` 前面的 \`before_agent_start\` 和 \`input\`——想想扩展是在哪个缝隙「截住」prompt 的。`,
    [],
  ),
];

const tutorialMd = `# Ch28 · Agent 循环怎么转（读 pi-agent-core）

${sections
  .map((s) => (s.heading ? `## ${s.heading}\n\n${s.body}` : s.body))
  .join("\n\n")}
`;

const reviewMd = `# Ch28 · 记忆闪卡

> 先回忆，再翻答案。连续 2 次秒答 → 退役。

## 🔖 闪卡

| # | 正面（问题） | 背面（答案） | 掌握 |
|---|---|---|---|
| 1 | Agent 循环的继续条件？ | stopReason === "toolUse" 且消息里真有 toolCall；error/aborted 立刻退出、工具不执行。 | ⬜ |
| 2 | 一次 prompt() 是几次 LLM 调用？ | N 次：模型每要一轮工具就多一次调用，直到不再要工具。 | ⬜ |
| 3 | 一轮 turn 的完整事件序列？ | turn_start → message_start/update/end（assistant 流）→ tool_execution_start/update/end（每个工具一对）→ turn_end。 | ⬜ |
| 4 | 事件五层嵌套？ | agent_start ⊃ turn_start ⊃ message_* ⊃ tool_execution_* ⊃ turn_end ⊃ agent_end；agent_settled 在 session 层。 | ⬜ |
| 5 | steer 在哪些缝隙投递？ | loop-start 和 after-turn-end（本轮工具跑完、下次 LLM 前）；不打断当前流。 | ⬜ |
| 6 | followUp 在哪个缝隙投递？ | 只在 would-stop（本该停了）；有货就重启循环再来一轮。 | ⬜ |
| 7 | 流式期间裸调 prompt() 会怎样？ | 抛错；必须用 steer()/followUp() 或带 streamingBehavior 选项。 | ⬜ |
| 8 | 为什么 state.messages 要换新数组？ | 订阅回调/UI 拿着旧快照；Pi 的 accessor 只在赋值时拷贝顶层数组，push 会污染快照。 | ⬜ |
| 9 | agent_end 和 agent_settled 差在哪？ | agent_end 是一次 run 的最后事件（core）；session 还可能 auto-retry/compaction/followUp 再起 run；agent_settled（coding-agent）才是不会再自动动。 | ⬜ |

## 🎓 费曼自检

- [ ] 能用调度器/CompletableFuture 类比讲清双层 while 和并行工具
- [ ] 能白板画事件嵌套并解释为什么是嵌套不是平铺
- [ ] 能讲清三个投递缝隙与两种队列的对应
- [ ] 能解释 agent_end ≠ 停，以及它和 settled 各属于哪个包
`;

const chapter = {
  id: "ch28",
  num: "28",
  title: "Agent 循环怎么转（读 pi-agent-core）",
  runMode: "local" as const,
  tutorialMd,
  assignment,
  testName: "ch28_assignment",
  testSource,
  reviewMd,
  interleaved: true,
  sections,
  functions,
  preamble,
  localHint: "bun test local/m6/ch28",
};

const root = dirname(fileURLToPath(import.meta.url));
const out = join(root, "../src/content/chapters/ch28.json");
mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, JSON.stringify(chapter, null, 2) + "\n");
console.log("wrote", out);

const localDir = join(root, "../local/m6/ch28");
mkdirSync(localDir, { recursive: true });

const localAssignment = `/**
 * Ch28 作业：Agent 循环怎么转（读 pi-agent-core，纯函数）。
 *
 * 场景：商品助手 Agent 收到「机械键盘和无线鼠标还有货吗」——
 * prompt → LLM 流 → 工具并行 → 结果追加 → 再调 LLM，直到模型不再要工具。
 * 打开本文件改 TODO，然后：bun test local/m6/ch28
 *
 * 不要 import 真 Pi 包 / 不打网 / 不装新依赖。
 */

${preamble}

${functions.map((f) => f.skeleton).join("\n\n")}
`;

const localTest = `import { describe, expect, test } from "bun:test";
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
`;

const demoSource = `/**
 * Ch28 · Agent 循环研究复制区（M6 第二章）。
 *
 * 本文件只给阅读 / 复制。测试禁止 import 本文件。
 * 全部真代码都在字符串里，if (false) 守护，不执行、不打网、不需要 Key。
 *
 * 事实源：本机安装包 node_modules/@earendil-works/pi-agent-core/dist/
 * （agent-loop.js / agent.d.ts / types.d.ts）+ docs/sdk.md / extensions.md。
 * 不要 clone 仓库；不要在课程仓库装 @earendil-works/*（M6 作业是纯函数）。
 */

// 复制区 1：读真循环源码（shell，粘到终端跑）
const READ_AGENT_LOOP = \`
AGENT="$(npm root -g)/@earendil-works/pi-coding-agent/node_modules/@earendil-works/pi-agent-core"
ls "$AGENT/dist"          # agent-loop.js / agent.d.ts / types.d.ts
# 双层 while 的真身：内层 = 工具轮，外层 = followUp 续命
grep -n "while" "$AGENT/dist/agent-loop.js"
# steer / followUp 的投递缝隙（getSteeringMessages / getFollowUpMessages 查队点）
grep -n "getSteeringMessages\\|getFollowUpMessages" "$AGENT/dist/agent-loop.js"
\`;

// 复制区 2：订阅事件流（来自官方 docs/sdk.md，节选）
const SUBSCRIBE_EVENTS = \`
import { createAgentSession, ModelRuntime, SessionManager } from "@earendil-works/pi-coding-agent";

const modelRuntime = await ModelRuntime.create();
const { session } = await createAgentSession({
  sessionManager: SessionManager.inMemory(),
  modelRuntime,
});

session.subscribe((event) => {
  switch (event.type) {
    case "message_update":
      if (event.assistantMessageEvent.type === "text_delta") {
        process.stdout.write(event.assistantMessageEvent.delta);
      }
      break;
    case "tool_execution_start":
      console.log("Tool: " + event.toolName);
      break;
    case "tool_execution_end":
      console.log("Result: " + (event.isError ? "error" : "success"));
      break;
    case "turn_end":
      // event.message：本轮 assistant 响应；event.toolResults：本轮工具结果
      break;
    case "agent_end":
      // 一次 run 结束——但可能还有 retry / compaction / follow-up（§28.7）
      break;
  }
});

await session.prompt("机械键盘和无线鼠标还有货吗？");
\`;

// 复制区 3：steer / followUp（来自官方 docs/sdk.md）
const STEER_AND_FOLLOWUP = \`
// 流式期间直接 prompt 不带 streamingBehavior 会抛错，必须明说：
await session.prompt("改成只查无线鼠标", { streamingBehavior: "steer" });
await session.prompt("做完顺便算总价", { streamingBehavior: "followUp" });

// 或者显式排队：
await session.steer("改成只查无线鼠标");    // 本轮工具跑完后、下次 LLM 调用前注入
await session.followUp("做完顺便算总价");   // 只在 agent 本该停止后才投递
\`;

// 复制区 4：读 AgentState（来自官方 docs/sdk.md）
const READ_AGENT_STATE = \`
const state = session.agent.state;
// state.messages      对话转录（赋值新数组时拷贝顶层数组）
// state.model         当前模型
// state.systemPrompt  系统提示
// state.tools         可用工具
// state.streamingMessage  流式中的半成品消息（只读）
// state.isStreaming   agent_end 的监听器都跑完才变 false
session.agent.state.messages = newMessages; // 换新数组，不要原地 push
await session.agent.waitForIdle();
\`;

if (false) {
  console.log(READ_AGENT_LOOP);
  console.log(SUBSCRIBE_EVENTS);
  console.log(STEER_AND_FOLLOWUP);
  console.log(READ_AGENT_STATE);
}
`;

writeFileSync(join(localDir, "assignment.ts"), localAssignment);
writeFileSync(join(localDir, "assignment.test.ts"), localTest);
writeFileSync(join(localDir, "demo.ts"), demoSource);
console.log("wrote", localDir);
