/**
 * Ch28 作业：Agent 循环怎么转（读 pi-agent-core，纯函数）。
 *
 * 场景：商品助手 Agent 收到「机械键盘和无线鼠标还有货吗」——
 * prompt → LLM 流 → 工具并行 → 结果追加 → 再调 LLM，直到模型不再要工具。
 * 打开本文件改 TODO，然后：bun test local/m6/ch28
 *
 * 不要 import 真 Pi 包 / 不打网 / 不装新依赖。
 */

/**
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

export type SimAgentState = { systemPrompt: string; model: string; messages: SimMessage[] };

/**
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
}

/**
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
}

/**
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
}

/**
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
}

/**
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
}

/**
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
}

/**
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
}
