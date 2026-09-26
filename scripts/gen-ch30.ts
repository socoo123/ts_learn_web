/**
 * 生成 src/content/chapters/ch30.json 与 local/m6/ch30/
 * 运行：bun scripts/gen-ch30.ts
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const preamble = `/**
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
};`;

const functions = [
  {
    name: "shouldCompact",
    testSuite: "shouldCompact",
    skeleton: `/**
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
}`,
  },
  {
    name: "isValidCutPoint",
    testSuite: "isValidCutPoint",
    skeleton: `/**
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
}`,
  },
  {
    name: "findCutPoint",
    testSuite: "findCutPoint",
    skeleton: `/**
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
}`,
  },
  {
    name: "buildEntryTree",
    testSuite: "buildEntryTree",
    skeleton: `/**
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
}`,
  },
  {
    name: "pathToLeaf",
    testSuite: "pathToLeaf",
    skeleton: `/**
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
}`,
  },
  {
    name: "contextAfterCompaction",
    testSuite: "contextAfterCompaction",
    skeleton: `/**
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
}`,
  },
  {
    name: "mergeCompactionSettings",
    testSuite: "mergeCompactionSettings",
    skeleton: `/**
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
}`,
  },
];

const assignment = `${preamble}

${functions.map((f) => f.skeleton).join("\n\n")}
`;

const testSource = `describe("shouldCompact", () => {
  it("越过 contextWindow - reserveTokens 才触发", () => {
    expect(shouldCompact(183617, 200000, { enabled: true, reserveTokens: 16384 })).toBe(true);
    expect(shouldCompact(90000, 200000, { enabled: true, reserveTokens: 16384 })).toBe(false);
  });
  it("刚好等于阈值不算越过", () => {
    expect(shouldCompact(183616, 200000, { enabled: true, reserveTokens: 16384 })).toBe(false);
  });
  it("enabled false 时再满也不自动压", () => {
    expect(shouldCompact(999999, 200000, { enabled: false, reserveTokens: 16384 })).toBe(false);
  });
});

describe("isValidCutPoint", () => {
  it("user / assistant / bashExecution / custom 可切", () => {
    expect(isValidCutPoint("user")).toBe(true);
    expect(isValidCutPoint("assistant")).toBe(true);
    expect(isValidCutPoint("bashExecution")).toBe(true);
    expect(isValidCutPoint("custom")).toBe(true);
  });
  it("branchSummary 与 compactionSummary 也可切", () => {
    expect(isValidCutPoint("branchSummary")).toBe(true);
    expect(isValidCutPoint("compactionSummary")).toBe(true);
  });
  it("toolResult 与非消息角色不可切", () => {
    expect(isValidCutPoint("toolResult")).toBe(false);
    expect(isValidCutPoint("model_change")).toBe(false);
    expect(isValidCutPoint("")).toBe(false);
  });
});

describe("findCutPoint", () => {
  it("从新往回攒够预算，切在 turn 起点", () => {
    const entries = [
      { id: "u1", role: "user", tokens: 30 },
      { id: "a1", role: "assistant", tokens: 10 },
      { id: "u2", role: "user", tokens: 12 },
      { id: "a2", role: "assistant", tokens: 10 },
    ];
    Object.freeze(entries);
    expect(findCutPoint(entries, 20)).toEqual({ firstKeptEntryId: "u2", isSplitTurn: false });
  });
  it("一轮太长：切在 assistant 上，isSplitTurn true", () => {
    const entries = [
      { id: "u1", role: "user", tokens: 5 },
      { id: "a1", role: "assistant", tokens: 5 },
      { id: "tr", role: "toolResult", tokens: 5 },
      { id: "u2", role: "user", tokens: 5 },
      { id: "a2", role: "assistant", tokens: 8 },
    ];
    expect(findCutPoint(entries, 20)).toEqual({ firstKeptEntryId: "a1", isSplitTurn: true });
  });
  it("没攒够 keepRecentTokens：从最早的合法切点留整段", () => {
    const entries = [
      { id: "u1", role: "user", tokens: 5 },
      { id: "a1", role: "assistant", tokens: 5 },
      { id: "u2", role: "user", tokens: 5 },
    ];
    expect(findCutPoint(entries, 100)).toEqual({ firstKeptEntryId: "u1", isSplitTurn: false });
  });
  it("溢出落在末尾 toolResult：后面没有合法切点，保持最早切点", () => {
    const entries = [
      { id: "u1", role: "user", tokens: 5 },
      { id: "t1", role: "toolResult", tokens: 100 },
    ];
    Object.freeze(entries);
    expect(findCutPoint(entries, 10)).toEqual({ firstKeptEntryId: "u1", isSplitTurn: false });
    expect(entries.map((e) => e.id)).toEqual(["u1", "t1"]);
  });
  it("tokens 为 0 的条目跳过；没有合法切点 → null", () => {
    expect(
      findCutPoint(
        [
          { id: "u1", role: "user", tokens: 0 },
          { id: "a1", role: "assistant", tokens: 5 },
        ],
        5,
      ),
    ).toEqual({ firstKeptEntryId: "a1", isSplitTurn: true });
    expect(findCutPoint([{ id: "t1", role: "toolResult", tokens: 50 }], 10)).toBeNull();
    expect(findCutPoint([], 20)).toBeNull();
  });
});

describe("buildEntryTree", () => {
  it("parentId 链成树，孩子按出现顺序", () => {
    const entries = [
      { id: "u1", parentId: null },
      { id: "a1", parentId: "u1" },
      { id: "u2", parentId: "a1" },
      { id: "alt", parentId: "a1" },
    ];
    Object.freeze(entries);
    expect(buildEntryTree(entries)).toEqual([
      { id: "u1", children: ["a1"] },
      { id: "a1", children: ["u2", "alt"] },
      { id: "u2", children: [] },
      { id: "alt", children: [] },
    ]);
    expect(entries[1]).toEqual({ id: "a1", parentId: "u1" });
  });
  it("两条根：查键盘与另一段会话并排", () => {
    expect(
      buildEntryTree([
        { id: "u1", parentId: null },
        { id: "u9", parentId: null },
      ]),
    ).toEqual([
      { id: "u1", children: [] },
      { id: "u9", children: [] },
    ]);
  });
  it("父 id 不存在：节点仍在，没有人把它收成孩子", () => {
    const tree = buildEntryTree([
      { id: "u1", parentId: null },
      { id: "x", parentId: "missing" },
    ]);
    expect(tree).toEqual([
      { id: "u1", children: [] },
      { id: "x", children: [] },
    ]);
  });
});

describe("pathToLeaf", () => {
  it("根到叶：当前在替代品那一支", () => {
    const entries = [
      { id: "u1", parentId: null },
      { id: "a1", parentId: "u1" },
      { id: "u2", parentId: "a1" },
      { id: "alt", parentId: "a1" },
    ];
    Object.freeze(entries);
    expect(pathToLeaf(entries, "alt")).toEqual(["u1", "a1", "alt"]);
    expect(pathToLeaf(entries, "u2")).toEqual(["u1", "a1", "u2"]);
  });
  it("叶就是根", () => {
    expect(pathToLeaf([{ id: "u1", parentId: null }], "u1")).toEqual(["u1"]);
  });
  it("叶不存在、父链断开、成环 → null", () => {
    expect(pathToLeaf([{ id: "u1", parentId: null }], "nope")).toBeNull();
    expect(pathToLeaf([{ id: "c", parentId: "gone" }], "c")).toBeNull();
    expect(
      pathToLeaf(
        [
          { id: "a", parentId: "b" },
          { id: "b", parentId: "a" },
        ],
        "a",
      ),
    ).toBeNull();
  });
});

describe("contextAfterCompaction", () => {
  it("摘要 + 从 firstKept 起的消息（含自身），custom 不进上下文", () => {
    const entries = [
      { id: "m1", kind: "message", role: "user", text: "查 KB-001 机械键盘" },
      { id: "m2", kind: "message", role: "assistant", text: "库存 12" },
      { id: "c1", kind: "custom", text: "扩展计数 1" },
      { id: "m3", kind: "message", role: "user", text: "再查 MS-002 无线鼠标" },
      { id: "m4", kind: "custom_message", role: "custom", text: "价格护栏：不低于 99" },
      { id: "lab", kind: "label", text: "checkpoint" },
    ];
    Object.freeze(entries);
    expect(contextAfterCompaction(entries, "已确认 KB-001 现货 12", "m3")).toEqual([
      { kind: "summary", text: "已确认 KB-001 现货 12" },
      { kind: "kept", id: "m3", role: "user", text: "再查 MS-002 无线鼠标" },
      { kind: "kept", id: "m4", role: "custom", text: "价格护栏：不低于 99" },
    ]);
  });
  it("保留段里的 branch_summary 以 branchSummary 角色留下", () => {
    const entries = [
      { id: "m1", kind: "message", role: "user", text: "查库存" },
      { id: "b1", kind: "branch_summary", text: "弃支试过替代品，用户没要" },
      { id: "mc", kind: "model_change" },
    ];
    expect(contextAfterCompaction(entries, "摘要", "b1")).toEqual([
      { kind: "summary", text: "摘要" },
      { kind: "kept", id: "b1", role: "branchSummary", text: "弃支试过替代品，用户没要" },
    ]);
  });
  it("切点不存在 → null；text 缺失当空串", () => {
    expect(contextAfterCompaction([], "摘要", "m1")).toBeNull();
    expect(
      contextAfterCompaction([{ id: "m1", kind: "message", role: "user" }], "", "m1"),
    ).toEqual([
      { kind: "summary", text: "" },
      { kind: "kept", id: "m1", role: "user", text: "" },
    ]);
  });
});

describe("mergeCompactionSettings", () => {
  it("project 覆盖同键，缺的 keepRecentTokens 回退默认 20000", () => {
    const globalSettings = { enabled: true, reserveTokens: 16384 };
    const projectSettings = { reserveTokens: 8192 };
    const overrides = {};
    Object.freeze(globalSettings);
    Object.freeze(projectSettings);
    Object.freeze(overrides);
    expect(
      mergeCompactionSettings(globalSettings, projectSettings, "claude-sonnet-4", 200000, overrides),
    ).toEqual({
      enabled: true,
      reserveTokens: 8192,
      keepRecentTokens: 20000,
      contextWindow: 200000,
    });
    expect(globalSettings).toEqual({ enabled: true, reserveTokens: 16384 });
  });
  it("modelOverrides 里的 contextWindow 盖过模型自带窗口", () => {
    const overrides = { "gpt-5.6-sol": { contextWindow: 1050000 } };
    Object.freeze(overrides["gpt-5.6-sol"]);
    expect(mergeCompactionSettings({}, {}, "gpt-5.6-sol", 272000, overrides)).toEqual({
      enabled: true,
      reserveTokens: 16384,
      keepRecentTokens: 20000,
      contextWindow: 1050000,
    });
  });
  it("没有这项覆盖、或覆盖对象不含 contextWindow → 回退 base；enabled false 不被默认吃掉", () => {
    const overrides = { "other-model": {} };
    expect(mergeCompactionSettings({}, {}, "claude-sonnet-4", 200000, overrides)).toEqual({
      enabled: true,
      reserveTokens: 16384,
      keepRecentTokens: 20000,
      contextWindow: 200000,
    });
    expect(mergeCompactionSettings({}, {}, "other-model", 200000, overrides).contextWindow).toBe(200000);
    expect(mergeCompactionSettings({}, { enabled: false }, "m", 128000, {})).toEqual({
      enabled: false,
      reserveTokens: 16384,
      keepRecentTokens: 20000,
      contextWindow: 128000,
    });
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
    `> **预计**：1 天 ｜ **前置**：Ch28（Agent 循环已经转起来；compaction 在 \`agent_end\` 之后还可能插入）
> **目标**：把「会话文件」当数据结构读——追加式树、entry 类型、活动分支；能手工推演一次 compaction 的触发与切点。
> 你 15 年 Java：这不是一张会被 UPDATE 的订单表，是 Git 提交那种「只追加、用 parent 指向前一条」的链。Python 侧就是一个 jsonl 文件，一行一个对象。
> 事实源：本机 \`@earendil-works/pi-coding-agent\` v0.85.1 的 \`docs/session-format.md\`、\`compaction.md\`、\`sessions.md\`、\`settings.md\`，外加 \`dist/core/compaction/compaction.js\`。不 clone 仓库。

> 📐 **本教程的契约**：§30.1–§30.7 各对应一道作业。讲过的才考，考的必讲过。
> **不讲**：RPC 帧怎么切（Ch31）、扩展怎么写（Ch29）。\`retainedTail\` 在文末标了不考。

---`,
    [],
  ),
  sec(
    "sec-map",
    "🗺️ 本章地图",
    null,
    `本章主线：**商品助手的对话落在磁盘上长什么样，太长了怎么切**。用户先问 KB-001 机械键盘，再追问 MS-002 无线鼠标；中途还可以从某一条分出「改问替代品」的另一支。文件只追加，当前读哪一支由叶决定。

读完这章 + 完成作业，你将能够：

- 认出 session.jsonl 的 header（v3）和九种 entry，说出谁进模型上下文、谁不进
- 用 \`id\` / \`parentId\` 把追加记录收成树，并走出根到当前叶的路径
- 用 \`contextTokens > contextWindow - reserveTokens\` 判断要不要自动 compact（默认余量 16384）
- 从新往回累积 \`keepRecentTokens\`（默认 20000），在合法切点停下，认出 split turn
- 用 summary + \`firstKeptEntryId\` 起的保留消息，拼出下次发给模型的上下文
- 深合并 global / project 的 compaction 三键，并用 \`modelOverrides\` 的 \`contextWindow\` 回退窗口

**作业 ↔ 教程对应表**：

| 作业题 | 对应小节 | 核心知识点 |
|--------|----------|-----------|
| \`shouldCompact\` | §30.1 | 触发式：窗口 − reserveTokens，严格大于 |
| \`isValidCutPoint\` | §30.2 | 六种角色可切，toolResult 不可 |
| \`findCutPoint\` | §30.3 | 从新往回累积 token → firstKeptEntryId / split turn |
| \`buildEntryTree\` | §30.4 | id / parentId → 树 |
| \`pathToLeaf\` | §30.5 | 根 → 叶的活动分支 |
| \`contextAfterCompaction\` | §30.6 | summary + 保留消息 |
| \`mergeCompactionSettings\` | §30.7 | 三键回退默认 + contextWindow 回退（综合） |

本地：\`local/m6/ch30/assignment.ts\`、\`assignment.test.ts\`、\`demo.ts\`。没有 \`app.ts\`。

跑测试：\`bun test local/m6/ch30\`。

---`,
    [],
  ),
  sec(
    "sec-path",
    "⏱️ 学习路径：费曼五步（约 60–90 分钟）",
    null,
    `| 步 | 你要做 | 在哪做 |
|----|--------|--------|
| ① 预览猜（2 分钟） | 猜触发式、切点、谁不进上下文 | 本页 ① |
| ② 先动手 | 打开 \`local/m6/ch30/assignment.ts\` 改 TODO | 仓库 local/ |
| ③ 提取+反馈 | \`bun test local/m6/ch30\` 看红绿 | 终端 |
| ④ 费曼（2 分钟） | 大白话讲清「为什么 toolResult 不能当切点」 | 本页 ④ |
| ⑤ 存闪卡 | 章末闪卡标复习日期 | 闪卡 |

> 💡 网页只读。作业是纯函数，无 Key。对照本机 \`docs/compaction.md\` 的 Cut Point Rules。

---`,
    [],
  ),
  sec(
    "sec-guess",
    "① 预览猜（2 分钟 · 激活你的 Java / Python 直觉）",
    null,
    `先别看答案：

1. session.jsonl 会不会在中途改掉旧行，还是只在文件末尾追加？
2. 自动 compact 的不等式是 \`>=\` 还是 \`>\`？余量默认留多少 token？
3. 切点能不能落在 tool 的返回值上？
4. \`custom\` 和 \`custom_message\` 谁会进下一次模型请求？
5. 项目 settings 只写了 \`reserveTokens: 8192\`，全局的 \`enabled: true\` 还在吗？
6. \`modelOverrides\` 写在 compaction 对象里，还是写在 models.json 的 provider 上？

> 第 2、3、4 题是本章的 🔴。猜完再往下读。

---`,
    [],
  ),
  sec(
    "sec-world",
    "会话文件是一棵只追加的树 🔴",
    null,
    `**为什么是树而不是数组**：商品对话会分支。问完键盘库存，你既可以继续问无线鼠标，也可以回到助手那条、改问「有没有便宜的替代品」。如果文件是一条会被改写的数组，旧分支就丢了。Pi 的做法和 Git 一样：每条记录带着 \`parentId\` 指向父记录，新分支只是多一个孩子，旧行不动。Python 里你把它读成 jsonl——\`split("\\n")\` 再 \`JSON.parse\`——就能自己走这棵树。

文件在 \`~/.pi/agent/sessions/--<path>--/<timestamp>_<uuid>.jsonl\`（工作目录里的 \`/\` 换成 \`-\`）。第一行是 **SessionHeader**，不是树节点：

\`\`\`json
{"type":"session","version":3,"id":"uuid","timestamp":"...","cwd":"/shop"}
\`\`\`

版本：v1 线性（加载时自动迁），v2 开始有 \`id\`/\`parentId\`，v3 把旧的 hookMessage 角色改名为 \`custom\`。当前写入的是 v3。header 没有 \`parentId\`，\`buildEntryTree\` 的输入不含它。

其后每一行是 entry，共有这些 \`type\`（作业会碰到其中几种）：

| type | 进不进模型上下文 | 商品助手里的例子 |
|---|---|---|
| \`message\` | 进。role 为 user / assistant / toolResult / bashExecution 等 | 「查 KB-001」 |
| \`model_change\` | 不进正文，只改当前模型 | 换到窗口更大的模型 |
| \`thinking_level_change\` | 不进正文 | 把思考调到 high |
| \`compaction\` | 变成摘要 + 保留段的起点 | 见 §30.6 |
| \`branch_summary\` | 进，角色 branchSummary | 弃支的摘要，见下面一节 |
| \`custom\` | **不进**。扩展自己的状态 | 价格护栏的计数 |
| \`custom_message\` | **进**。扩展注入的话 | 「不低于 99」 |
| \`label\` | 不进。书签，指着某条 \`targetId\` | checkpoint |
| \`session_info\` | 不进。\`/name\` 起的显示名 | 「盘库存」 |

\`SessionManager\` 把这棵树包成 API（作业不调用它，\`demo.ts\` 里有名单）：\`appendMessage\` / \`appendCompaction\` 负责追加，\`getLeafId\` / \`getBranch\` / \`buildSessionContext\` 负责读活动分支。\`inMemory()\` 不落盘，Ch25 用过。

\`\`\`mermaid
flowchart LR
    u1["u1 user<br/>parentId null<br/>查 KB-001 机械键盘"] --> a1["a1 assistant<br/>库存 12"]
    a1 --> u2["u2 user<br/>再查 MS-002 无线鼠标<br/>当前叶"]
    a1 --> alt["alt user<br/>改问替代品<br/>另一支"]

    style u1 fill:#90CAF9,stroke:#1976D2,color:#1f1f1f
    style a1 fill:#A5D6A7,stroke:#388E3C,color:#1f1f1f
    style u2 fill:#FFCC80,stroke:#F57C00,color:#1f1f1f
    style alt fill:#CE93D8,stroke:#7B1FA2,color:#1f1f1f
\`\`\`

header 画在树外面：它是文件元数据。当前叶是 u2 时，活动分支是 u1 → a1 → u2；alt 还在文件里，只是这轮不发给模型。

### ❌ / ✅

\`\`\`ts
// ❌ 把 session.jsonl 当数组，用下标当「上一句」（分支之后下标对不上父）
// ❌ 把 header 也塞进 id/parentId 树（它没有这两个字段）
// ❌ 以为 custom 和 custom_message 都会进上下文（只有后者进）
// ✅ 只追加；活动内容 = 从叶沿 parentId 走回根
\`\`\`

---`,
    [],
  ),
  sec(
    "sec-30.1",
    "§30.1 什么时候自动压（对应：`shouldCompact`）🔴",
    "30.1",
    `**机制**：模型的窗口是硬预算。Pi 不把窗口用满才压，而是提前留出 \`reserveTokens\`（默认 **16384**）给这一轮的回答。判定写在 \`dist/core/compaction/compaction.js\`：

\`\`\`ts
function shouldCompact(contextTokens, contextWindow, settings) {
  if (!settings.enabled) return false;
  return contextTokens > contextWindow - settings.reserveTokens;
}
\`\`\`

两个容易写错的点。第一，是 **严格大于**。\`200000 - 16384 = 183616\`，token 刚好 183616 时还不压。第二，\`enabled: false\` 直接返回 false——自动压关了；用户仍可 \`/compact\`，那条是手动路径，不走这个不等式。

多轮 Agent 里，Pi 在工具结果追加之后、下一次助手回复之前检查；也会在新的用户 prompt 之前、以及一轮 agent 结束之后检查。本轮工具已经把 run 收住、队列里又没有下一条要回的消息时，中间那次检查会跳过。这些时序知道即可，作业只考不等式。

\`\`\`mermaid
flowchart LR
    usage["contextTokens<br/>商品对话已用"] --> gate{"大于<br/>contextWindow 减 reserveTokens ?"}
    gate -->|"是，且 enabled"| yes["自动 compact<br/>先摘要再继续"]
    gate -->|"否，或 enabled 为 false"| no["这轮不自动压"]

    style usage fill:#FFE082,stroke:#F9A825,color:#1f1f1f
    style gate fill:#80DEEA,stroke:#0097A7,color:#1f1f1f
    style yes fill:#FFCC80,stroke:#F57C00,color:#1f1f1f
    style no fill:#A5D6A7,stroke:#388E3C,color:#1f1f1f
\`\`\`

商品例子：窗口 200000，余量 16384。查键盘加查鼠标才 90000，不压。堆到 183617，压。

### ❌ / ✅

\`\`\`ts
// ❌ 写成 >= （刚好卡在阈值会被多压一次）
// ❌ 忘了 enabled，关了自动压仍返回 true
// ❌ 用 keepRecentTokens 当阈值（那是「留下多少」，不是「何时触发」）
// ✅ enabled 为 false 就 false；否则 contextTokens > contextWindow - reserveTokens
\`\`\`

> ✅ **做 \`shouldCompact\`**：三个数，一个布尔。

---`,
    ["shouldCompact"],
  ),
  sec(
    "sec-30.2",
    "§30.2 切点角色（对应：`isValidCutPoint`）🔴",
    "30.2",
    `**机制**：切点是「保留段的第一句」。如果第一句是 toolResult，模型会看到一个没有 tool call 的工具结果——协议不接受这种孤儿。所以 toolResult **永远不能**当切点。它要么跟在被保留的 assistant（带着 tool call）后面一起留下，要么跟那个 call 一起进摘要。

源码 \`isCutPointMessage\` 的白名单是消息的 **role**，不是 entry 的 type：

| role | 可切？ | 是不是 turn 起点 |
|---|---|---|
| user | 是 | 是 |
| assistant | 是 | 否（切在这里 = split turn，§30.3） |
| bashExecution | 是 | 是 |
| custom | 是 | 是（custom_message 进上下文后 role 就是 custom） |
| branchSummary | 是 | 是 |
| compactionSummary | 是 | 是 |
| toolResult | **否** | 否 |

\`model_change\` 这类是 entry type，不是消息 role，作业里直接 false。

### ❌ / ✅

\`\`\`ts
// ❌ 只允许 user（assistant 也是合法切点，否则超长的一轮切不开）
// ❌ 允许 toolResult（保留段会以孤儿结果开头）
// ❌ 用 entry type "message" 判断（同一 type 下 role 不同，结论不同）
// ✅ 六个 role 白名单；toolResult 与其余字符串都是 false
\`\`\`

> ✅ **做 \`isValidCutPoint\`**。§30.3 会调用它。

---`,
    ["isValidCutPoint"],
  ),
  sec(
    "sec-30.3",
    "§30.3 从新往回找切点（对应：`findCutPoint`）🔴",
    "30.3",
    `**机制**：留下的是「最近的预算」，所以从**最新**一条往回加 token，而不是从文件头往前删。\`keepRecentTokens\` 默认 **20000**。累计一旦 \`>=\` 这个预算，就在这里附近切。文档里的口语是「通常切在 turn 边界」：一轮从 user（或 bash / custom / 摘要）开始，直到下一条同类消息之前，都算同一轮。一轮自己超了预算时，切点会落在这轮中间的 **assistant** 上，这叫 **split turn**——历史摘要和这轮前缀会各总结一次再合并。作业把这件事收成 \`isSplitTurn\`。

教学合同对齐 dist 里 \`findCutPoint\` 的走法（token 数由调用方算好，不用你估 chars/4）：

1. 收集 \`isValidCutPoint\` 为 true 的下标。没有 → \`null\`。
2. 默认切点 = 最早那个合法下标。循环结束都没攒够预算，就从这儿留，等于整段保留。
3. \`for\` 从最后一条走到第一条。\`tokens === 0\` 跳过。加上去之后若 \`>= keepRecentTokens\`，在切点下标里找**第一个 >= 当前下标**的，用它当切点。若当前下标已经在所有合法切点之后（典型：巨大的 toolResult 贴在末尾），内层找不到，**保持默认**——不能把切点挪到 toolResult 上。然后 \`break\`。
4. 切点角色属于 turn 起点（user / bashExecution / custom / branchSummary / compactionSummary）→ \`isSplitTurn: false\`。否则往前找 turn 起点，找到了就是 true。

\`\`\`mermaid
flowchart LR
    oldU["u1 user 30"] --> oldA["a1 assistant 10"]
    oldA --> newU["u2 user 12<br/>切在这里"]
    newU --> newA["a2 assistant 10<br/>从这里往回加"]

    style oldU fill:#EF9A9A,stroke:#C62828,color:#1f1f1f
    style oldA fill:#EF9A9A,stroke:#C62828,color:#1f1f1f
    style newU fill:#A5D6A7,stroke:#388E3C,color:#1f1f1f
    style newA fill:#A5D6A7,stroke:#388E3C,color:#1f1f1f
\`\`\`

keepRecentTokens = 20 时：a2 的 10 不够，加上 u2 的 12 得 22，切点就是 u2，它是 turn 起点，\`isSplitTurn\` 为 false。u1 和 a1 送去摘要。

另一组：\`[user 5, assistant 5, toolResult 5, user 5, assistant 8]\`，同样预算 20。加到第一条 assistant 才到 23，切点落在它身上，前面还有 user，所以 \`isSplitTurn\` 为 true。toolResult 那个下标被跳过，不会变成切点。

\`\`\`ts
const TURN_START = new Set(["user", "bashExecution", "custom", "branchSummary", "compactionSummary"]);

function findCutPoint(entries: CutEntry[], keepRecentTokens: number): CutPoint | null {
  const cutPoints: number[] = [];
  for (let i = 0; i < entries.length; i++) {
    if (isValidCutPoint(entries[i]!.role)) cutPoints.push(i);
  }
  if (cutPoints.length === 0) return null;
  let cutIndex = cutPoints[0]!;
  let accumulated = 0;
  for (let i = entries.length - 1; i >= 0; i--) {
    const tokens = entries[i]!.tokens;
    if (tokens === 0) continue;
    accumulated += tokens;
    if (accumulated >= keepRecentTokens) {
      for (const c of cutPoints) {
        if (c >= i) { cutIndex = c; break; }
      }
      break;
    }
  }
  const role = entries[cutIndex]!.role;
  let turnStart = -1;
  if (!TURN_START.has(role)) {
    for (let i = cutIndex; i >= 0; i--) {
      if (TURN_START.has(entries[i]!.role)) { turnStart = i; break; }
    }
  }
  return {
    firstKeptEntryId: entries[cutIndex]!.id,
    isSplitTurn: !TURN_START.has(role) && turnStart !== -1,
  };
}
\`\`\`

### ❌ / ✅

\`\`\`ts
// ❌ 从最旧往最新删，直到剩下的 token 少于预算（方向反了，切点会偏）
// ❌ 累计超过预算时如果角色是 toolResult 就用它当切点
// ❌ 没攒够预算却返回 null（应当从最早的合法切点留整段）
// ✅ 倒序累加；切点只从白名单下标里挑；assistant 切点 + 前面有 turn 起点 = split turn
\`\`\`

> ✅ **做 \`findCutPoint\`**。入参数组会被 \`Object.freeze\`。

---`,
    ["findCutPoint"],
  ),
  sec(
    "sec-30.4",
    "§30.4 把追加记录收成树（对应：`buildEntryTree`）🟡",
    "30.4",
    `活动分支只是树的一条路径。\`/tree\` 要的是整棵树：每个 id 的直接孩子。

做法：按输入顺序先做出 \`{ id, children: [] }\`，再扫一遍，把 \`parentId !== null\` 且父节点存在的 id \`push\` 进父的 \`children\`。孩子顺序就是它们被追加的顺序，不要排序。父 id 在数组里找不到时，这条节点仍要返回（孤儿），只是没有任何 \`children\` 含它。header 不会出现在输入里。

\`\`\`ts
function buildEntryTree(entries: EntryLink[]): EntryNode[] {
  const nodes = entries.map((e) => ({ id: e.id, children: [] as string[] }));
  const byId = new Map(nodes.map((n) => [n.id, n]));
  for (const e of entries) {
    if (e.parentId === null) continue;
    byId.get(e.parentId)?.children.push(e.id);
  }
  return nodes;
}
\`\`\`

商品形状：u1（问键盘）→ a1（库存 12）→ u2（问无线鼠标）和 alt（问替代品）。a1 的 children 是 \`["u2","alt"]\`，因为 u2 先追加。

### ❌ / ✅

\`\`\`ts
// ❌ 把 parentId 写进 children（children 装的是孩子 id）
// ❌ 父 id 缺失就丢掉该节点
// ❌ 给入参对象加 children 字段（测试冻结了原对象）
// ✅ 新节点数组；孩子按输入顺序 push
\`\`\`

> ✅ **做 \`buildEntryTree\`**。

---`,
    ["buildEntryTree"],
  ),
  sec(
    "sec-30.5",
    "§30.5 活动分支：根到叶（对应：`pathToLeaf`）🟡",
    "30.5",
    `叶是当前读写位置。\`getBranch\` 从叶走到根；给人看时要反转成根→叶。

沿 \`parentId\` 回溯即可，不必先建树。叶不存在、中途父 id 缺失、或者 a 的父是 b 而 b 的父是 a（环），都返回 \`null\`。用一个 \`seen\` 集合在环上停下来。

\`\`\`ts
function pathToLeaf(entries: EntryLink[], leafId: string): string[] | null {
  const byId = new Map(entries.map((e) => [e.id, e]));
  if (!byId.has(leafId)) return null;
  const path: string[] = [];
  const seen = new Set<string>();
  let cur: string | null = leafId;
  while (cur !== null) {
    if (seen.has(cur)) return null;
    const node = byId.get(cur);
    if (!node) return null;
    seen.add(cur);
    path.push(cur);
    cur = node.parentId;
  }
  path.reverse();
  return path;
}
\`\`\`

叶在 alt 上时路径是 \`["u1","a1","alt"]\`，u2 那条「问无线鼠标」不在里面。这就是「文件里有、这轮不发给模型」的原因。

### ❌ / ✅

\`\`\`ts
// ❌ 返回叶→根还不反转（合同是根在前）
// ❌ 父链断了仍把已经收集的 id 返回出去
// ❌ 环上无限循环
// ✅ seen + 反转；走不通就是 null
\`\`\`

> ✅ **做 \`pathToLeaf\`**。

---`,
    ["pathToLeaf"],
  ),
  sec(
    "sec-branch",
    "分支摘要：公共祖先 + 被弃的那一支",
    null,
    `\`/tree\` 从旧叶跳到另一支时，Pi 可以给**被离开的那一支**写一段摘要，挂在新位置上。这和 compaction 共用同一套摘要格式（Goal / Constraints / Progress / …），但触发不同：compaction 是上下文超预算或 \`/compact\`；分支摘要是导航。

步骤：找旧叶和新位置的**最深公共祖先**，收集从旧叶走回祖先的那些条目，按 token 预算从新到旧挑进摘要，再在导航点追加 \`branch_summary\`（字段 \`summary\` + \`fromId\`，\`fromId\` 是离开的那条）。

\`\`\`mermaid
flowchart TB
    anc["A 公共祖先<br/>问过 KB-001"] --> leftB["B"]
    leftB --> oldLeaf["D 被弃的叶<br/>替代品没要"]
    anc --> rightE["E"]
    rightE --> target["F 跳到这里"]
    target --> summ["branch_summary<br/>摘要 B 到 D"]

    style anc fill:#FFE082,stroke:#F9A825,color:#1f1f1f
    style leftB fill:#EF9A9A,stroke:#C62828,color:#1f1f1f
    style oldLeaf fill:#EF9A9A,stroke:#C62828,color:#1f1f1f
    style rightE fill:#90CAF9,stroke:#1976D2,color:#1f1f1f
    style target fill:#A5D6A7,stroke:#388E3C,color:#1f1f1f
    style summ fill:#CE93D8,stroke:#7B1FA2,color:#1f1f1f
\`\`\`

文件还是那一个。\`/fork\`、\`/clone\` 才会另存新文件，而且不写这段摘要。作业不单独设函数；§30.6 会把落在保留段里的 \`branch_summary\` 收进上下文。

---`,
    [],
  ),
  sec(
    "sec-30.6",
    "§30.6 压完之后模型看见什么（对应：`contextAfterCompaction`）🔴",
    "30.6",
    `**机制**：compaction 不改历史行，只在叶上**再追加**一条 \`compaction\`。下次组上下文时，这条摘要代替它之前的长对话。\`CompactionEntry\` 的三个你要记住的字段是 \`summary\`、\`firstKeptEntryId\`、\`tokensBefore\`。\`firstKeptEntryId\` 是保留段的**第一句，含它自己**——「Kept」就是留下。更早的消息不发给模型，它们的信息在 summary 里。

教学合同（旧格式，用 \`firstKeptEntryId\` 回放）：

1. 结果以 \`{ kind: "summary", text }\` 开头。
2. 从该 id 起到数组末尾：\`message\` 原样留下（用它的 role 和 text）；\`custom_message\` 留下（role 缺省 \`"custom"\`）；\`branch_summary\` 以 role \`"branchSummary"\` 留下。
3. \`custom\`、\`model_change\`、\`label\`、\`session_info\`、\`thinking_level_change\`、\`compaction\` 跳过。扩展状态和书签不是对模型说的话。
4. id 不存在 → \`null\`。text 缺失 → \`""\`。

\`\`\`mermaid
flowchart LR
    summ["summary<br/>已确认 KB-001 现货 12"] --> k1["kept m3 user<br/>再查 MS-002 无线鼠标"]
    k1 --> k2["kept custom_message<br/>价格护栏"]

    style summ fill:#FFE082,stroke:#F9A825,color:#1f1f1f
    style k1 fill:#A5D6A7,stroke:#388E3C,color:#1f1f1f
    style k2 fill:#90CAF9,stroke:#1976D2,color:#1f1f1f
\`\`\`

m1、m2 和夹在中间的 \`custom\` 计数不在这张图里：前两者被摘要吃掉，custom 本来就不进上下文。

\`\`\`ts
function contextAfterCompaction(entries: BranchEntry[], summary: string, firstKeptEntryId: string): ContextPiece[] | null {
  const start = entries.findIndex((e) => e.id === firstKeptEntryId);
  if (start < 0) return null;
  const out: ContextPiece[] = [{ kind: "summary", text: summary }];
  for (let i = start; i < entries.length; i++) {
    const e = entries[i]!;
    if (e.kind === "message") {
      out.push({ kind: "kept", id: e.id, role: e.role ?? "custom", text: e.text ?? "" });
    } else if (e.kind === "custom_message") {
      out.push({ kind: "kept", id: e.id, role: e.role ?? "custom", text: e.text ?? "" });
    } else if (e.kind === "branch_summary") {
      out.push({ kind: "kept", id: e.id, role: "branchSummary", text: e.text ?? "" });
    }
  }
  return out;
}
\`\`\`

> 延伸阅读（不考）：v0.85.1 里较新的 compaction 可以自带 \`retainedTail\`（已经物化的消息数组），重建时不必再去翻切点之前的行。旧文件只有 \`firstKeptEntryId\`。作业考的是这条仍在文档里的兼容路径。

### ❌ / ✅

\`\`\`ts
// ❌ 从 firstKept 的下一条开始留（丢掉切点那句用户话）
// ❌ 把 kind custom 也推进 kept（扩展状态不进 LLM）
// ❌ summary 对象上再塞一个 id
// ✅ 先放 summary，再从切点下标（含）扫到末尾，只收三种 kind
\`\`\`

> ✅ **做 \`contextAfterCompaction\`**。

---`,
    ["contextAfterCompaction"],
  ),
  sec(
    "sec-30.7",
    "§30.7 设置怎么合并（对应：`mergeCompactionSettings`）🟡",
    "30.7",
    `**机制**：\`~/.pi/agent/settings.json\` 是全局，项目 \`.pi/settings.json\` 盖在上面。\`settings-manager.js\` 的 \`deepMergeSettings\` 对嵌套对象递归合并；标量同键用项目的值，项目没写的键留着全局的。compaction 在 v0.85.1 只有三个标量：\`enabled\`（默认 true）、\`reserveTokens\`（默认 16384）、\`keepRecentTokens\`（默认 20000）。文档里的例子：全局 \`{ enabled: true, reserveTokens: 16384 }\`，项目只写 \`{ reserveTokens: 8192 }\`，合并结果是 enabled 仍为 true、余量变成 8192、keepRecentTokens 走默认 20000。

\`enabled: false\` 必须保住。用 \`||\` 会把 false 当成缺省，又变回 true。用 \`??\`。

\`modelOverrides\` **不在** compaction 对象上。它在 \`models.json\` 的 \`providers.<id>.modelOverrides\` 里，按模型 id 覆盖 \`contextWindow\`、\`maxTokens\` 等。\`shouldCompact\` 用的窗口是覆盖之后的那个：有 number 就用，没有就回退模型自带的 \`contextWindow\`。官方例子是把 \`gpt-5.6-sol\` 的窗口从 272000 抬到 1050000。未知模型 id、或覆盖对象里没有 \`contextWindow\`，都回退 base。

作业把两层合成一个结果，因为阈值 = 回退后的窗口 − 合并后的 reserveTokens。你可以用这个返回值去喂 §30.1。

\`\`\`mermaid
flowchart LR
    g["global compaction<br/>reserveTokens 16384"] --> merge["同键：项目优先<br/>缺键：默认 16384 / 20000"]
    p["project compaction<br/>reserveTokens 8192"] --> merge
    base["模型自带 contextWindow"] --> win{"该模型的<br/>modelOverrides.contextWindow<br/>是 number ?"}
    ov["models.json<br/>modelOverrides"] --> win
    win -->|"是"| useOv["用覆盖值"]
    win -->|"否"| useBase["回退 base"]

    style g fill:#90CAF9,stroke:#1976D2,color:#1f1f1f
    style p fill:#A5D6A7,stroke:#388E3C,color:#1f1f1f
    style merge fill:#FFE082,stroke:#F9A825,color:#1f1f1f
    style base fill:#CE93D8,stroke:#7B1FA2,color:#1f1f1f
    style ov fill:#FFCC80,stroke:#F57C00,color:#1f1f1f
    style win fill:#80DEEA,stroke:#0097A7,color:#1f1f1f
    style useOv fill:#A5D6A7,stroke:#388E3C,color:#1f1f1f
    style useBase fill:#90CAF9,stroke:#1976D2,color:#1f1f1f
\`\`\`

\`\`\`ts
function mergeCompactionSettings(
  globalSettings: CompactionPartial,
  projectSettings: CompactionPartial,
  modelId: string,
  baseContextWindow: number,
  modelOverrides: Record<string, WindowOverride>,
): MergedCompaction {
  const override = modelOverrides[modelId];
  const contextWindow =
    override !== undefined && typeof override.contextWindow === "number"
      ? override.contextWindow
      : baseContextWindow;
  return {
    enabled: projectSettings.enabled ?? globalSettings.enabled ?? true,
    reserveTokens: projectSettings.reserveTokens ?? globalSettings.reserveTokens ?? 16384,
    keepRecentTokens: projectSettings.keepRecentTokens ?? globalSettings.keepRecentTokens ?? 20000,
    contextWindow,
  };
}
\`\`\`

### ❌ / ✅

\`\`\`ts
// ❌ 用 || 合并 enabled（false 会被默认 true 吃掉）
// ❌ 在 compaction 对象里找 modelOverrides（v0.85.1 没有这个字段）
// ❌ 覆盖对象存在但没有 contextWindow 时当成 0
// ✅ 三键 ?? 两级；窗口只在 typeof number 时采用
\`\`\`

> ✅ **做 \`mergeCompactionSettings\`**。入参对象是冻结的。

---`,
    ["mergeCompactionSettings"],
  ),
  sec(
    "sec-pits",
    "⚠️ Java / Python 老手几个坑",
    null,
    `1. **把 jsonl 读成会改写的 List。** 分支靠 parentId，旧行保持原样。对照 Git 提交，不对照 \`ArrayList.set\`。
2. **header 算进树。** v3 头没有 id / parentId。
3. **触发式写成 >=。** 源码是 \`>\`。183616 在 200000 窗口、16384 余量下还不压。
4. **把 keepRecentTokens 当成触发阈值。** 它只决定留下多少；何时压看的是 reserveTokens。
5. **切在 toolResult 上。** 保留段不能以孤儿工具结果开头。
6. **没攒够预算就返回 null。** 应当从最早的合法切点把整段留下。
7. **firstKept 理解成「它后面的才留」。** 这个 id 自己就在保留段里。
8. **custom 送进模型。** 进上下文的是 custom_message；custom 是扩展状态。
9. **\`||\` 合并 enabled。** false 要保住，用 \`??\`。
10. **到 compaction 里找 modelOverrides。** 窗口覆盖在 models.json 的 provider 上；没有这项就用模型自带 contextWindow。

---`,
    [],
  ),
  sec(
    "sec-homework",
    "📝 本章作业",
    null,
    `7 个函数按节交错。注释里有【场景】【转换点】、示例和提示。

打开 \`local/m6/ch30/assignment.ts\`，替换 \`throw new Error("TODO")\`，然后：

\`\`\`bash
bun test local/m6/ch30
\`\`\`

没有 \`app.ts\`。真实片段在 \`demo.ts\`，测试不要 import 它。

卡住就回：\`shouldCompact\` → §30.1，\`isValidCutPoint\` → §30.2，\`findCutPoint\` → §30.3（先收集切点再倒序加），\`buildEntryTree\` → §30.4，\`pathToLeaf\` → §30.5，\`contextAfterCompaction\` → §30.6（含切点那条），\`mergeCompactionSettings\` → §30.7（\`??\` 与 contextWindow）。

---`,
    [],
  ),
  sec(
    "sec-check",
    "✅ 自测：你真的掌握了吗？",
    null,
    `- [ ] 能说出 header 为什么不在树上，以及九种 entry 里谁不进模型
- [ ] 能手算 200000 窗口、16384 余量下 183616 与 183617 的差别，并解释 enabled false
- [ ] 能背出六个可切 role，并说明 toolResult 为什么被排除
- [ ] 能走一遍倒序累加：没攒够、切在 user、切在 assistant（split turn）、末尾是巨大 toolResult
- [ ] 能从叶走回根，也能指出孤儿和环该返回 null
- [ ] 能画出 summary + firstKept 起的保留段，并跳过 custom / label
- [ ] 能合并一份只改了 reserveTokens 的项目 settings，并说出 contextWindow 从哪回退
- [ ] \`bun test local/m6/ch30\` 全绿；没有 import 真包、没有装依赖、没有 clone

---`,
    [],
  ),
  sec(
    "sec-feynman",
    "🎓 费曼挑战",
    null,
    `用大白话讲给写过订单表的同事听。

1. 「会话文件为什么像 Git 而不像一张可 UPDATE 的表？叶和分支各是什么？」— 卡壳重读本章地图那节。
2. 「为什么不能把切点放在工具结果上？一轮特别长时切点会落在哪？」— 卡壳重读 §30.2 和 §30.3。
3. 「项目只改了 reserveTokens，模型窗口又可能被 modelOverrides 改掉。你怎么得到 shouldCompact 要用的两个数？」— 卡壳重读 §30.7。

---`,
    [],
  ),
  sec(
    "sec-next",
    "⏭️ 下一步",
    null,
    `Ch30 你能读会话、能推演一次压摘要。**Ch31 是 M6 收官**：同一套 Agent，嵌进你的程序时有三条路——同进程 SDK（\`createAgentSession\` + \`SessionManager.inMemory()\` + \`subscribe\`）、子进程 RPC（\`pi --mode rpc\` 的 stdin/stdout JSONL）、以及只出不进的 json 事件流。RPC 那条要自己把帧切开：只按 \`\\n\` 切，剥掉行尾 \`\\r\`，别用会把 U+2028 当换行的 readline。

读之前可以打开安装包 \`docs/rpc.md\` 的 Framing 一节。`,
    [],
  ),
];

const tutorialMd = `# Ch30 · Session 与 Compaction

${sections
  .map((s) => (s.heading ? `## ${s.heading}\n\n${s.body}` : s.body))
  .join("\n\n")}
`;

const reviewMd = `# Ch30 · 记忆闪卡

> 先回忆，再翻答案。连续 2 次秒答 → 退役。

## 🔖 闪卡

| # | 正面（问题） | 背面（答案） | 掌握 |
|---|---|---|---|
| 1 | session.jsonl 的 header 算树节点吗？版本是多少？ | 不算。首行 type session、version 3，没有 id/parentId。v1 线性会在加载时迁到当前版本。 | ⬜ |
| 2 | custom 和 custom_message 谁进模型上下文？ | custom 是扩展状态，不进。custom_message 进。label / model_change / session_info 也不进正文。 | ⬜ |
| 3 | 自动 compact 的不等式？默认余量？ | enabled 为 false 则不触发。否则 contextTokens > contextWindow - reserveTokens。默认 reserveTokens 16384。相等不触发。 | ⬜ |
| 4 | keepRecentTokens 管什么？默认多少？ | 从最新往回留下大约这么多 token，默认 20000。它不决定「何时压」。 | ⬜ |
| 5 | 哪些 role 能当切点？ | user、assistant、bashExecution、custom、branchSummary、compactionSummary。toolResult 永远不能。 | ⬜ |
| 6 | 什么叫 split turn？ | 一轮自己超过 keepRecentTokens，切点落在这轮中间的 assistant 上（assistant 可切，但不是 turn 起点）。 | ⬜ |
| 7 | 没攒够预算时切点在哪？末尾是巨大 toolResult 呢？ | 没攒够：从最早的合法切点留整段。末尾 toolResult 后面没有合法切点：保持默认，不把切点放在 toolResult 上。 | ⬜ |
| 8 | firstKeptEntryId 含不含它自己？ | 含。保留段从这条开始。更早的进 summary。下次发给模型的是 summary 加上这些保留消息。 | ⬜ |
| 9 | 分支摘要挂在哪？ | /tree 跳走时，给被弃分支写摘要，追加在新位置。找的是新旧位置的最深公共祖先。/fork 与 /clone 另存文件且不写这段。 | ⬜ |
| 10 | global 与 project 的 compaction 怎么并？ | 同键项目优先，缺键留全局，再缺用默认 enabled true / 16384 / 20000。false 要用 ?? 保住。 | ⬜ |
| 11 | modelOverrides 在哪？和窗口什么关系？ | 在 models.json 的 providers.*.modelOverrides，不在 compaction 对象上。该模型有 number 型 contextWindow 就用，否则回退模型自带窗口。 | ⬜ |

## 🎓 费曼自检

- [ ] 能用 Git 的 parent 讲清活动分支和被留在文件里的另一支
- [ ] 能讲清 toolResult 不能当切点、以及 split turn 长什么样
- [ ] 能说出 reserveTokens、keepRecentTokens、contextWindow 各管哪一步
`;

const chapter = {
  id: "ch30",
  num: "30",
  title: "Session 与 Compaction",
  runMode: "local" as const,
  tutorialMd,
  assignment,
  testName: "ch30_assignment",
  testSource,
  reviewMd,
  interleaved: true,
  sections,
  functions,
  preamble,
  localHint: "bun test local/m6/ch30",
};

const root = dirname(fileURLToPath(import.meta.url));
const out = join(root, "../src/content/chapters/ch30.json");
mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, JSON.stringify(chapter, null, 2) + "\n");
console.log("wrote", out);

const localDir = join(root, "../local/m6/ch30");
mkdirSync(localDir, { recursive: true });

const localAssignment = `/**
 * Ch30 作业：Session 与 Compaction（纯函数）。
 *
 * 场景：商品助手的会话是 session.jsonl 上的一棵追加树。打开本文件改 TODO，然后：
 * bun test local/m6/ch30
 *
 * 不要 import 真 Pi 包 / 不要 clone 仓库 / 不装新依赖。
 */

${preamble}

${functions.map((f) => f.skeleton).join("\n\n")}
`;

const localTest = `import { describe, expect, test } from "bun:test";
import {
  buildEntryTree,
  contextAfterCompaction,
  findCutPoint,
  isValidCutPoint,
  mergeCompactionSettings,
  pathToLeaf,
  shouldCompact,
} from "./assignment";

${testSource.replace(/\bit\(/g, "test(")}`;

const demoSource = `/**
 * Ch30 · Session 与 Compaction 复制区（M6）。
 *
 * 本文件只给阅读 / 复制。测试禁止 import 本文件。
 * 全部真代码都在字符串里，if (false) 守护，不执行、不打网、不需要 Key。
 *
 * 事实源：本机安装包 docs/session-format.md · compaction.md · sessions.md · settings.md
 * 以及 dist/core/compaction/compaction.js（pi v0.85.1）。
 * 不要 clone 仓库；不要在课程仓库装 @earendil-works/*。
 */

const READ_THE_DOCS = \`
ROOT="$(npm root -g)/@earendil-works/pi-coding-agent"
sed -n '1,80p' "$ROOT/docs/session-format.md"
sed -n '25,80p' "$ROOT/docs/compaction.md"
sed -n '114,130p' "$ROOT/docs/settings.md"
\`;

const SESSION_JSONL = \`
{"type":"session","version":3,"id":"sess-shop","timestamp":"2026-09-26T00:00:00.000Z","cwd":"/shop"}
{"type":"message","id":"u1","parentId":null,"timestamp":"2026-09-26T00:00:01.000Z","message":{"role":"user","content":"查 KB-001 机械键盘","timestamp":1}}
{"type":"message","id":"a1","parentId":"u1","timestamp":"2026-09-26T00:00:02.000Z","message":{"role":"assistant","content":[{"type":"text","text":"库存 12"}],"stopReason":"stop","timestamp":2}}
{"type":"message","id":"u2","parentId":"a1","timestamp":"2026-09-26T00:00:03.000Z","message":{"role":"user","content":"再查 MS-002 无线鼠标","timestamp":3}}
{"type":"compaction","id":"cmp1","parentId":"u2","timestamp":"2026-09-26T00:01:00.000Z","summary":"已确认 KB-001 现货 12","firstKeptEntryId":"u2","tokensBefore":50000}
\`;

const SHOULD_COMPACT = \`
export function shouldCompact(contextTokens, contextWindow, settings) {
  if (!settings.enabled) return false;
  return contextTokens > contextWindow - settings.reserveTokens;
}
\`;

const SETTINGS_MERGE = \`
// ~/.pi/agent/settings.json
{ "compaction": { "enabled": true, "reserveTokens": 16384, "keepRecentTokens": 20000 } }
// .pi/settings.json 只改余量 → 合并后 enabled 仍 true，reserveTokens 8192，keepRecentTokens 20000
{ "compaction": { "reserveTokens": 8192 } }
// contextWindow 的按模型覆盖不在 compaction 上，在 models.json：
// providers.openai.modelOverrides["gpt-5.6-sol"].contextWindow = 1050000
// 没有这项就用模型自带窗口。SessionManager.appendCompaction(summary, firstKeptEntryId, tokensBefore)
\`;

if (false) {
  console.log(READ_THE_DOCS);
  console.log(SESSION_JSONL);
  console.log(SHOULD_COMPACT);
  console.log(SETTINGS_MERGE);
}
`;

writeFileSync(join(localDir, "assignment.ts"), localAssignment);
writeFileSync(join(localDir, "assignment.test.ts"), localTest);
writeFileSync(join(localDir, "demo.ts"), demoSource);
console.log("wrote", localDir);
