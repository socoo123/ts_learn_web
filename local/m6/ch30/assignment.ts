/**
 * Ch30 作业：Session 与 Compaction（纯函数）。
 *
 * 场景：商品助手的会话是 session.jsonl 上的一棵追加树。打开本文件改 TODO，然后：
 * bun test local/m6/ch30
 *
 * 不要 import 真 Pi 包 / 不要 clone 仓库 / 不装新依赖。
 */

/**
 * Ch30 作业：Session 与 Compaction（纯函数）。
 *
 * 场景：商品助手的会话写在 session.jsonl 里——追加式树，不是一张会被
 * UPDATE 的表。对话太长时要 compaction：算出该不该压、从哪一条切、
 * 切完下次发给模型的是什么。不 import 真 Pi 包、不装新依赖；事实来自
 * 本机安装包 docs/session-format.md、compaction.md、sessions.md、
 * settings.md 与 dist/core/compaction/compaction.js（pi v0.85.1）。
 *
 * 全绿 = 你掌握了 Ch30。本地：bun test local/m6/ch30
 */

export type CompactSettings = { enabled: boolean; reserveTokens: number };

export type CutEntry = { id: string; role: string; tokens: number };

export type CutPoint = { firstKeptEntryId: string; isSplitTurn: boolean };

export type EntryLink = { id: string; parentId: string | null };

export type EntryNode = { id: string; children: string[] };

export type BranchEntry = { id: string; kind: string; role?: string; text?: string };

export type ContextPiece =
  | { kind: "summary"; text: string }
  | { kind: "kept"; id: string; role: string; text: string };

export type CompactionPartial = {
  enabled?: boolean;
  reserveTokens?: number;
  keepRecentTokens?: number;
};

export type WindowOverride = { contextWindow?: number };

export type MergedCompaction = {
  enabled: boolean;
  reserveTokens: number;
  keepRecentTokens: number;
  contextWindow: number;
};

/**
 * 【场景】商品助手查完 KB-001 机械键盘又追问 MS-002 无线鼠标，上下文快顶满窗口。要不要自动压一版摘要？
 *
 * 【转换点】自动 compaction 的触发式 🔴（dist compaction.js 的 shouldCompact）：
 *   enabled 为 false → 一律 false（自动关了；/compact 手动仍可用，那条不走这个函数）。
 *   否则 contextTokens > contextWindow - reserveTokens 才为 true。
 *   相等不算越过。reserveTokens 默认 16384，给模型的回答留空。
 *
 * 任务：返回是否该自动 compact。
 * 示例：
 *   shouldCompact(183617, 200000, { enabled: true, reserveTokens: 16384 }) → true
 *   shouldCompact(183616, 200000, { enabled: true, reserveTokens: 16384 }) → false（刚好等于阈值）
 *   shouldCompact(90000, 200000, { enabled: true, reserveTokens: 16384 }) → false
 *   shouldCompact(999999, 200000, { enabled: false, reserveTokens: 16384 }) → false
 *
 * 提示：先看 enabled；再用严格大于。200000 - 16384 = 183616。
 */
export function shouldCompact(
  contextTokens: number,
  contextWindow: number,
  settings: CompactSettings,
): boolean {
  throw new Error("TODO");
}

/**
 * 【场景】摘要要切掉旧对话、留下最近一段。切点只能落在「能独立进上下文」的消息上。
 *
 * 【转换点】合法切点角色 🔴（compaction.md Cut Point Rules + isCutPointMessage）：
 *   可切：user、assistant、bashExecution、custom、branchSummary、compactionSummary。
 *   toolResult 永远不可切——它必须跟着前面的 tool call，不能变成保留段的开头。
 *   其它字符串（model_change、空串）→ false。
 *
 * 任务：角色能当切点 → true，否则 false。
 * 示例：
 *   isValidCutPoint("user") → true
 *   isValidCutPoint("assistant") → true
 *   isValidCutPoint("bashExecution") → true
 *   isValidCutPoint("custom") → true
 *   isValidCutPoint("toolResult") → false
 *   isValidCutPoint("model_change") → false
 *
 * 提示：六个角色白名单；不要把 entry 的 type（message / compaction）和 message 的 role 混在一起。
 */
export function isValidCutPoint(role: string): boolean {
  throw new Error("TODO");
}

/**
 * 【场景】窗口超了，要从商品对话里挑 firstKeptEntryId：这一条以及它后面的留下，更早的送去摘要。
 *
 * 【转换点】从新往回累积 token 🔴（findCutPoint 的教学合同，对齐 dist 的走法）：
 *   1. 合法切点下标 = isValidCutPoint(role) 为 true 的下标。一个都没有 → null。
 *   2. 默认切点 = 最早的合法切点（没攒够 keepRecentTokens 就整段从这儿留）。
 *   3. 从最后一条往回走。tokens === 0 的跳过（不加、也不因此停下）。
 *      累计 >= keepRecentTokens 时，在切点里找第一个 >= 当前下标的，改成它；
 *      找不到（溢出落在末尾的 toolResult 上、后面没有合法切点）就保持默认。然后停。
 *   4. isSplitTurn：切点角色不是 turn 起点，且从切点往前找得到 turn 起点。
 *      turn 起点：user、bashExecution、custom、branchSummary、compactionSummary。
 *      assistant 是合法切点，但不是 turn 起点——一轮太长切在 assistant 上就是 split turn。
 *   不改入参数组。
 *
 * 任务：返回 { firstKeptEntryId, isSplitTurn }；没有合法切点 → null。
 * 示例（keepRecentTokens = 20）：
 *   [user 30, assistant 10, user 12, assistant 10] → 切在第二条 user 上，isSplitTurn false
 *   [user 5, assistant 5, toolResult 5, user 5, assistant 8] → 切在第一条 assistant，isSplitTurn true
 *   全是 toolResult → null
 *
 * 提示：复用 isValidCutPoint。先收集切点下标，再倒序累加。
 */
export function findCutPoint(entries: CutEntry[], keepRecentTokens: number): CutPoint | null {
  throw new Error("TODO");
}

/**
 * 【场景】/tree 要画出商品会话：查键盘的主干，和中途改问替代品的那一支。
 *
 * 【转换点】追加式树 🟡：每条 entry 有 id 与 parentId（第一条 parentId 为 null）。
 *   按输入顺序返回节点 { id, children }。children 是直接孩子的 id，顺序跟它们在输入里出现的顺序一致。
 *   parentId 指向不存在的 id → 这条自己还在结果里，只是没有父节点收留它（孤儿）。
 *   不改入参。header 不在这个数组里（它没有 id / parentId）。
 *
 * 任务：链接数组 → 节点数组（保序）。
 * 示例：
 *   [{id:"u1",parentId:null},{id:"a1",parentId:"u1"},{id:"u2",parentId:"a1"},{id:"alt",parentId:"a1"}]
 *     → u1.children ["a1"]，a1.children ["u2","alt"]，u2 与 alt 的 children 为 []
 *   parentId 指向 "missing" 的节点仍然出现，且没有任何节点的 children 含它
 *
 * 提示：先按输入建节点，再用 parentId 把 id 推进父节点的 children。别排序。
 */
export function buildEntryTree(entries: EntryLink[]): EntryNode[] {
  throw new Error("TODO");
}

/**
 * 【场景】活动分支就是「从根走到当前叶」的那条路径。叶在替代品那一支上时，键盘的后半段不在路径里。
 *
 * 【转换点】沿 parentId 从叶回溯到 parentId === null，再反转成根→叶 🟡。
 *   叶 id 不在数组里 → null。
 *   走到一半 parentId 指向不存在的 id → null（链断了）。
 *   出现环 → null。
 *   不改入参。可以先用 buildEntryTree 看形状，实现时直接走 parentId 即可。
 *
 * 任务：返回 id 数组（根在前）；走不通 → null。
 * 示例：
 *   叶 "alt"，父链 u1 → a1 → alt → ["u1","a1","alt"]
 *   叶 "u1"（parentId null）→ ["u1"]
 *   叶不存在 / 父 id 缺失 / a↔b 互为父 → null
 *
 * 提示：Map 按 id 索引；用 seen 防环；收集完 reverse。
 */
export function pathToLeaf(entries: EntryLink[], leafId: string): string[] | null {
  throw new Error("TODO");
}

/**
 * 【场景】压完摘要后，下次发给模型的不是整份 jsonl，而是「摘要 + 从 firstKeptEntryId 起保留的消息」。
 *
 * 【转换点】重建上下文 🔴（buildSessionContext 的教学合同）：
 *   结果第一条永远是 { kind:"summary", text:summary }（摘要本身）。
 *   从 firstKeptEntryId 这条起（含它自己）走到末尾：
 *     kind "message" → { kind:"kept", id, role: entry.role, text }
 *     kind "custom_message" → kept，role 用 entry.role，缺省 "custom"（它进模型上下文）
 *     kind "branch_summary" → kept，role 固定 "branchSummary"，text 用 entry.text
 *     custom / model_change / label / session_info / thinking_level_change / compaction → 跳过
 *       （custom 是扩展状态，不进 LLM；label 只是书签）
 *   text 缺失当 ""。firstKeptEntryId 找不到 → null。不改入参。
 *
 * 任务：返回 ContextPiece[]；切点不存在 → null。
 * 示例：
 *   条目含 m1 用户「查 KB-001」、m2 助手、custom 计数、m3 用户「再查 MS-002 无线鼠标」、custom_message 价格护栏
 *   firstKept = m3，summary = "已确认 KB-001 现货 12"
 *     → [summary, kept m3, kept 价格护栏]；m1/m2/custom 不在结果里
 *
 * 提示：findIndex 定位起点；只挑三种 kind。summary 对象不要带 id。
 */
export function contextAfterCompaction(
  entries: BranchEntry[],
  summary: string,
  firstKeptEntryId: string,
): ContextPiece[] | null {
  throw new Error("TODO");
}

/**
 * 【场景】全局 settings 留 16384 的余量，商品项目把余量改成 8192；当前模型也许在 models.json 里把窗口拉长了。
 * 阈值要用合并后的 reserveTokens，和回退后的 contextWindow。
 *
 * 【转换点】两层回退 🟡（综合，对齐 settings-manager 的 ?? 与 models.json 的 modelOverrides）：
 *   compaction 三键：project 有值用 project，否则用 global，再否则用默认
 *     enabled ?? true，reserveTokens ?? 16384，keepRecentTokens ?? 20000。
 *     false 和 0 都算「有值」（用 ?? 而不是 ||）。v0.85.1 的 compaction 对象只有这三键，是标量，同键覆盖即可。
 *   contextWindow：modelOverrides[modelId].contextWindow 是 number 就用它；
 *     该模型没有覆盖、或覆盖对象里没有 contextWindow → 回退 baseContextWindow。
 *   不改入参。得到的 reserveTokens 与 contextWindow 就是 shouldCompact 的后两个输入。
 *
 * 任务：返回 { enabled, reserveTokens, keepRecentTokens, contextWindow }。
 * 示例：
 *   global {enabled:true, reserveTokens:16384} + project {reserveTokens:8192}
 *     + 模型不在 overrides、base 200000
 *     → enabled true，reserve 8192，keep 20000，contextWindow 200000
 *   overrides {"gpt-5.6-sol":{contextWindow:1050000}}，modelId "gpt-5.6-sol"，base 272000
 *     → contextWindow 1050000
 *   project {enabled:false}，其余缺省，base 128000 → enabled false，reserve 16384，keep 20000，窗口 128000
 *
 * 提示：三键各自 ?? 两级；窗口先取出覆盖对象再判断 typeof === "number"。
 */
export function mergeCompactionSettings(
  globalSettings: CompactionPartial,
  projectSettings: CompactionPartial,
  modelId: string,
  baseContextWindow: number,
  modelOverrides: Record<string, WindowOverride>,
): MergedCompaction {
  throw new Error("TODO");
}
