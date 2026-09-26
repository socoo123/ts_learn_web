import { describe, expect, test } from "bun:test";
import {
  buildEntryTree,
  contextAfterCompaction,
  findCutPoint,
  isValidCutPoint,
  mergeCompactionSettings,
  pathToLeaf,
  shouldCompact,
} from "./assignment";

describe("shouldCompact", () => {
  test("越过 contextWindow - reserveTokens 才触发", () => {
    expect(shouldCompact(183617, 200000, { enabled: true, reserveTokens: 16384 })).toBe(true);
    expect(shouldCompact(90000, 200000, { enabled: true, reserveTokens: 16384 })).toBe(false);
  });
  test("刚好等于阈值不算越过", () => {
    expect(shouldCompact(183616, 200000, { enabled: true, reserveTokens: 16384 })).toBe(false);
  });
  test("enabled false 时再满也不自动压", () => {
    expect(shouldCompact(999999, 200000, { enabled: false, reserveTokens: 16384 })).toBe(false);
  });
});

describe("isValidCutPoint", () => {
  test("user / assistant / bashExecution / custom 可切", () => {
    expect(isValidCutPoint("user")).toBe(true);
    expect(isValidCutPoint("assistant")).toBe(true);
    expect(isValidCutPoint("bashExecution")).toBe(true);
    expect(isValidCutPoint("custom")).toBe(true);
  });
  test("branchSummary 与 compactionSummary 也可切", () => {
    expect(isValidCutPoint("branchSummary")).toBe(true);
    expect(isValidCutPoint("compactionSummary")).toBe(true);
  });
  test("toolResult 与非消息角色不可切", () => {
    expect(isValidCutPoint("toolResult")).toBe(false);
    expect(isValidCutPoint("model_change")).toBe(false);
    expect(isValidCutPoint("")).toBe(false);
  });
});

describe("findCutPoint", () => {
  test("从新往回攒够预算，切在 turn 起点", () => {
    const entries = [
      { id: "u1", role: "user", tokens: 30 },
      { id: "a1", role: "assistant", tokens: 10 },
      { id: "u2", role: "user", tokens: 12 },
      { id: "a2", role: "assistant", tokens: 10 },
    ];
    Object.freeze(entries);
    expect(findCutPoint(entries, 20)).toEqual({ firstKeptEntryId: "u2", isSplitTurn: false });
  });
  test("一轮太长：切在 assistant 上，isSplitTurn true", () => {
    const entries = [
      { id: "u1", role: "user", tokens: 5 },
      { id: "a1", role: "assistant", tokens: 5 },
      { id: "tr", role: "toolResult", tokens: 5 },
      { id: "u2", role: "user", tokens: 5 },
      { id: "a2", role: "assistant", tokens: 8 },
    ];
    expect(findCutPoint(entries, 20)).toEqual({ firstKeptEntryId: "a1", isSplitTurn: true });
  });
  test("没攒够 keepRecentTokens：从最早的合法切点留整段", () => {
    const entries = [
      { id: "u1", role: "user", tokens: 5 },
      { id: "a1", role: "assistant", tokens: 5 },
      { id: "u2", role: "user", tokens: 5 },
    ];
    expect(findCutPoint(entries, 100)).toEqual({ firstKeptEntryId: "u1", isSplitTurn: false });
  });
  test("溢出落在末尾 toolResult：后面没有合法切点，保持最早切点", () => {
    const entries = [
      { id: "u1", role: "user", tokens: 5 },
      { id: "t1", role: "toolResult", tokens: 100 },
    ];
    Object.freeze(entries);
    expect(findCutPoint(entries, 10)).toEqual({ firstKeptEntryId: "u1", isSplitTurn: false });
    expect(entries.map((e) => e.id)).toEqual(["u1", "t1"]);
  });
  test("tokens 为 0 的条目跳过；没有合法切点 → null", () => {
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
  test("parentId 链成树，孩子按出现顺序", () => {
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
  test("两条根：查键盘与另一段会话并排", () => {
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
  test("父 id 不存在：节点仍在，没有人把它收成孩子", () => {
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
  test("根到叶：当前在替代品那一支", () => {
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
  test("叶就是根", () => {
    expect(pathToLeaf([{ id: "u1", parentId: null }], "u1")).toEqual(["u1"]);
  });
  test("叶不存在、父链断开、成环 → null", () => {
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
  test("摘要 + 从 firstKept 起的消息（含自身），custom 不进上下文", () => {
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
  test("保留段里的 branch_summary 以 branchSummary 角色留下", () => {
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
  test("切点不存在 → null；text 缺失当空串", () => {
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
  test("project 覆盖同键，缺的 keepRecentTokens 回退默认 20000", () => {
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
  test("modelOverrides 里的 contextWindow 盖过模型自带窗口", () => {
    const overrides = { "gpt-5.6-sol": { contextWindow: 1050000 } };
    Object.freeze(overrides["gpt-5.6-sol"]);
    expect(mergeCompactionSettings({}, {}, "gpt-5.6-sol", 272000, overrides)).toEqual({
      enabled: true,
      reserveTokens: 16384,
      keepRecentTokens: 20000,
      contextWindow: 1050000,
    });
  });
  test("没有这项覆盖、或覆盖对象不含 contextWindow → 回退 base；enabled false 不被默认吃掉", () => {
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
