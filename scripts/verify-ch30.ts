/**
 * 用标准答案跑一遍 Ch30 测试，确认生成的 JSON 与 local 能绿。
 * 运行：bun scripts/verify-ch30.ts
 */
import { spawnSync } from "node:child_process";
import { cpSync, existsSync, mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import chapter from "../src/content/chapters/ch30.json";
import shared from "../src/content/shared.json";
import { runFunctionTest } from "../assets/js/runner-core.js";
import type { FuncDef, Section } from "../src/types";

const solutions: Record<string, string> = {
  shouldCompact: `export function shouldCompact(
  contextTokens: number,
  contextWindow: number,
  settings: CompactSettings,
): boolean {
  if (!settings.enabled) return false;
  return contextTokens > contextWindow - settings.reserveTokens;
}`,
  isValidCutPoint: `export function isValidCutPoint(role: string): boolean {
  return (
    role === "user" ||
    role === "assistant" ||
    role === "bashExecution" ||
    role === "custom" ||
    role === "branchSummary" ||
    role === "compactionSummary"
  );
}`,
  findCutPoint: `export function findCutPoint(entries: CutEntry[], keepRecentTokens: number): CutPoint | null {
  const turnStart = new Set(["user", "bashExecution", "custom", "branchSummary", "compactionSummary"]);
  const cutPoints: number[] = [];
  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i];
    if (entry && isValidCutPoint(entry.role)) cutPoints.push(i);
  }
  if (cutPoints.length === 0) return null;
  let cutIndex = cutPoints[0]!;
  let accumulated = 0;
  for (let i = entries.length - 1; i >= 0; i--) {
    const entry = entries[i];
    if (!entry || entry.tokens === 0) continue;
    accumulated += entry.tokens;
    if (accumulated >= keepRecentTokens) {
      for (const c of cutPoints) {
        if (c >= i) {
          cutIndex = c;
          break;
        }
      }
      break;
    }
  }
  const role = entries[cutIndex]!.role;
  let turnStartIndex = -1;
  if (!turnStart.has(role)) {
    for (let i = cutIndex; i >= 0; i--) {
      const prev = entries[i];
      if (prev && turnStart.has(prev.role)) {
        turnStartIndex = i;
        break;
      }
    }
  }
  return {
    firstKeptEntryId: entries[cutIndex]!.id,
    isSplitTurn: !turnStart.has(role) && turnStartIndex !== -1,
  };
}`,
  buildEntryTree: `export function buildEntryTree(entries: EntryLink[]): EntryNode[] {
  const nodes: EntryNode[] = entries.map((e) => ({ id: e.id, children: [] }));
  const byId = new Map(nodes.map((n) => [n.id, n]));
  for (const e of entries) {
    if (e.parentId === null) continue;
    const parent = byId.get(e.parentId);
    if (parent) parent.children.push(e.id);
  }
  return nodes;
}`,
  pathToLeaf: `export function pathToLeaf(entries: EntryLink[], leafId: string): string[] | null {
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
}`,
  contextAfterCompaction: `export function contextAfterCompaction(
  entries: BranchEntry[],
  summary: string,
  firstKeptEntryId: string,
): ContextPiece[] | null {
  const start = entries.findIndex((e) => e.id === firstKeptEntryId);
  if (start < 0) return null;
  const out: ContextPiece[] = [{ kind: "summary", text: summary }];
  for (let i = start; i < entries.length; i++) {
    const e = entries[i];
    if (!e) continue;
    if (e.kind === "message" || e.kind === "custom_message") {
      out.push({ kind: "kept", id: e.id, role: e.role ?? "custom", text: e.text ?? "" });
    } else if (e.kind === "branch_summary") {
      out.push({ kind: "kept", id: e.id, role: "branchSummary", text: e.text ?? "" });
    }
  }
  return out;
}`,
  mergeCompactionSettings: `export function mergeCompactionSettings(
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
}`,
};

const expectedNames = [
  "shouldCompact",
  "isValidCutPoint",
  "findCutPoint",
  "buildEntryTree",
  "pathToLeaf",
  "contextAfterCompaction",
  "mergeCompactionSettings",
];

const ch = chapter as {
  id: string;
  num: string;
  title: string;
  runMode: string;
  testName: string;
  tutorialMd: string;
  assignment: string;
  testSource: string;
  reviewMd: string;
  interleaved: boolean;
  preamble: string;
  localHint?: string;
  functions: FuncDef[];
  sections: Section[];
};

let wiringFailed = 0;

function wire(ok: boolean, msg: string) {
  console.log(ok ? `WIRE PASS  ${msg}` : `WIRE FAIL  ${msg}`);
  if (!ok) wiringFailed++;
}

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const localDir = join(root, "local/m6/ch30");

wire(ch.id === "ch30", `id === ch30 (got ${ch.id})`);
wire(ch.num === "30", `num === 30 (got ${ch.num})`);
wire(ch.title === "Session 与 Compaction", `title (got ${ch.title})`);
wire(ch.runMode === "local", `runMode === local (got ${ch.runMode})`);
wire(ch.testName === "ch30_assignment", `testName (got ${ch.testName})`);
wire(ch.interleaved === true, "interleaved === true");
wire(ch.localHint === "bun test local/m6/ch30", `localHint (got ${ch.localHint})`);
wire(ch.tutorialMd.startsWith("# Ch30 · Session 与 Compaction"), "H1");
wire(ch.tutorialMd.includes("作业 ↔ 教程对应表"), "front matter 对应表");
const mermaidCount = (ch.tutorialMd.match(/```mermaid/g) ?? []).length;
wire(mermaidCount >= 5 && mermaidCount <= 8, `mermaid 数量 5–8（got ${mermaidCount}）`);
wire(ch.tutorialMd.includes("color:#1f1f1f"), "mermaid 带 color:#1f1f1f");
wire(ch.tutorialMd.includes("Git"), "Java/Git 对照");
wire(ch.tutorialMd.includes("jsonl") || ch.tutorialMd.includes("JSON.parse"), "Python jsonl 对照");
wire(ch.tutorialMd.includes("parentId"), "教程含 parentId");
wire(ch.tutorialMd.includes("firstKeptEntryId"), "教程含 firstKeptEntryId");
wire(ch.tutorialMd.includes("reserveTokens"), "教程含 reserveTokens");
wire(ch.tutorialMd.includes("keepRecentTokens"), "教程含 keepRecentTokens");
wire(ch.tutorialMd.includes("16384"), "教程含默认 16384");
wire(ch.tutorialMd.includes("20000"), "教程含默认 20000");
wire(ch.tutorialMd.includes("toolResult"), "教程含 toolResult");
wire(ch.tutorialMd.includes("split"), "教程含 split turn");
wire(ch.tutorialMd.includes("modelOverrides"), "教程含 modelOverrides");
wire(ch.tutorialMd.includes("branch_summary") || ch.tutorialMd.includes("分支摘要"), "教程含分支摘要");
wire(ch.tutorialMd.includes("SessionManager"), "教程含 SessionManager");
wire(ch.tutorialMd.includes("version"), "教程含 session version");
wire(ch.tutorialMd.includes("custom_message"), "教程含 custom_message");
wire(ch.tutorialMd.includes("@earendil-works"), "教程指明事实源包名");
wire(ch.tutorialMd.includes("clone"), "教程说明不 clone");
wire(ch.tutorialMd.includes("retainedTail"), "教程标明 retainedTail");
for (const n of expectedNames) {
  wire(ch.tutorialMd.includes(n), `教程含 ${n}`);
}
wire(ch.tutorialMd.includes("无线鼠标"), "教程含无线鼠标");
wire(ch.tutorialMd.includes("KB-001"), "教程含 KB-001");
wire(
  !ch.tutorialMd.includes("bun add @mariozechner") && !ch.tutorialMd.includes("npm install @mariozechner"),
  "不教安装过时包",
);

const homeworkBlob = `${ch.assignment}\n${ch.testSource}\n${ch.preamble}`;
wire(!/^\s*import\s+/m.test(ch.assignment), "JSON assignment 无 import");
wire(!/^\s*import\s+/m.test(ch.testSource), "testSource 无 import");
wire(!/^\s*import\s+/m.test(ch.preamble), "preamble 无 import");
wire(!/\bhono\b/i.test(homeworkBlob), "JSON 作业侧无 hono");
wire(!homeworkBlob.includes("@earendil-works"), "JSON 作业侧无 @earendil-works");
wire(!homeworkBlob.includes("pi-coding-agent"), "JSON 作业侧无 pi-coding-agent");
wire(!/\bfetch\s*\(/.test(homeworkBlob), "JSON 作业侧无 fetch(");
wire(!/\bsetTimeout\s*\(/.test(homeworkBlob), "JSON 作业侧无 setTimeout(");

wire(ch.preamble.includes("type CompactSettings"), "preamble 含 CompactSettings");
wire(ch.preamble.includes("type CutPoint"), "preamble 含 CutPoint");
wire(ch.preamble.includes("type EntryNode"), "preamble 含 EntryNode");
wire(ch.preamble.includes("type ContextPiece"), "preamble 含 ContextPiece");
wire(ch.preamble.includes("type MergedCompaction"), "preamble 含 MergedCompaction");
wire(ch.preamble.includes("bun test local/m6/ch30"), "preamble 含本地命令");

wire(ch.reviewMd.includes("toolResult"), "闪卡含 toolResult");
wire(ch.reviewMd.includes("16384"), "闪卡含 16384");
wire(ch.reviewMd.includes("firstKeptEntryId"), "闪卡含 firstKeptEntryId");
wire(ch.reviewMd.includes("modelOverrides"), "闪卡含 modelOverrides");
wire(ch.reviewMd.includes("split"), "闪卡含 split");

const fnNames = ch.functions.map((f) => f.name);
wire(
  expectedNames.length === fnNames.length && expectedNames.every((n, i) => n === fnNames[i]),
  `functions 顺序一致 [${fnNames.join(", ")}]`,
);

for (const f of ch.functions) {
  wire(f.testSuite === f.name, `testSuite === name (${f.name})`);
  wire(f.skeleton.includes(`export function ${f.name}`), `export function ${f.name}`);
  wire(f.skeleton.includes('throw new Error("TODO")'), `${f.name} skeleton TODO`);
  wire(f.skeleton.includes("【场景】") && f.skeleton.includes("【转换点】"), `${f.name} 场景/转换点`);
  wire(ch.tutorialMd.includes("`" + f.name + "`"), `对应表含 ${f.name}`);
  wire(
    ch.sections.some((s) => s.exerciseFunctions.includes(f.name)),
    `${f.name} 挂在某节 exerciseFunctions`,
  );
}

const secNums = ["30.1", "30.2", "30.3", "30.4", "30.5", "30.6", "30.7"];
for (const n of secNums) {
  const s = ch.sections.find((x) => x.secNum === n);
  wire(!!s && s.heading.includes("§" + n), `H2 含 §${n}`);
}

const secFnPairs: Array<[string, string]> = [
  ["30.1", "shouldCompact"],
  ["30.2", "isValidCutPoint"],
  ["30.3", "findCutPoint"],
  ["30.4", "buildEntryTree"],
  ["30.5", "pathToLeaf"],
  ["30.6", "contextAfterCompaction"],
  ["30.7", "mergeCompactionSettings"],
];
for (const [n, fn] of secFnPairs) {
  wire(
    ch.sections.find((s) => s.secNum === n)?.exerciseFunctions.includes(fn) === true,
    `§${n} → ${fn}`,
  );
}

const forbiddenMatchers = [".toThrow", ".toContain", ".toMatch", ".toBeTruthy", ".toBeFalsy"];
for (const m of forbiddenMatchers) {
  wire(!ch.testSource.includes(m), `expect 不用 ${m}`);
}
wire(ch.testSource.includes(".toBe("), "JSON 测试含 toBe");
wire(ch.testSource.includes(".toEqual("), "JSON 测试含 toEqual");
wire(ch.testSource.includes(".toBeNull("), "JSON 测试含 toBeNull");
wire(ch.testSource.includes("无线鼠标"), "JSON 测试含无线鼠标");
wire(ch.testSource.includes("KB-001"), "JSON 测试含 KB-001");
wire(ch.testSource.includes("Object.freeze"), "JSON 测试 freeze");
wire(ch.testSource.includes("183616"), "JSON 测试含阈值边界");
wire(ch.testSource.includes("1050000"), "JSON 测试含 modelOverrides 窗口");

const localFiles = ["assignment.ts", "assignment.test.ts", "demo.ts"];
for (const name of localFiles) {
  wire(existsSync(join(localDir, name)), `local 存在 ${name}`);
}
wire(!existsSync(join(localDir, "app.ts")), "M6 章无 app.ts");

const assignmentLocal = existsSync(join(localDir, "assignment.ts"))
  ? readFileSync(join(localDir, "assignment.ts"), "utf8")
  : "";
const testLocal = existsSync(join(localDir, "assignment.test.ts"))
  ? readFileSync(join(localDir, "assignment.test.ts"), "utf8")
  : "";
const demoLocal = existsSync(join(localDir, "demo.ts"))
  ? readFileSync(join(localDir, "demo.ts"), "utf8")
  : "";

wire(assignmentLocal.includes('throw new Error("TODO")'), "local assignment 含 TODO");
for (const n of expectedNames) {
  wire(assignmentLocal.includes(`export function ${n}`), `local assignment export function ${n}`);
}
wire(!assignmentLocal.includes("pi-coding-agent"), "local assignment 无 pi-coding-agent");
wire(!assignmentLocal.includes("@earendil-works"), "local assignment 无 @earendil-works");
wire(!/\bhono\b/i.test(assignmentLocal), "local assignment 无 hono");
wire(!/^\s*import\s+/m.test(assignmentLocal), "local assignment 无 import");
wire(testLocal.includes("bun:test"), "local test 用 bun:test");
for (const n of expectedNames) {
  wire(testLocal.includes(n), `local test 含 ${n}`);
}
wire(testLocal.includes("Object.freeze"), "local test freeze");
wire(!testLocal.includes("pi-coding-agent") && !testLocal.includes("@earendil-works"), "local test 不 import 真包");
wire(!testLocal.includes("demo.ts") && !testLocal.includes("./demo"), "local test 不 import demo.ts");
wire(demoLocal.includes("session-format.md") && demoLocal.includes("compaction.md"), "demo.ts 含 session/compaction 文档");
wire(demoLocal.includes("sessions.md") && demoLocal.includes("settings.md"), "demo.ts 含 sessions/settings 文档");
wire(demoLocal.includes("firstKeptEntryId"), "demo.ts 含 firstKeptEntryId");
wire(demoLocal.includes("SessionManager") || demoLocal.includes("appendCompaction"), "demo.ts 含 SessionManager");
wire(demoLocal.includes("16384"), "demo.ts 含 16384");
wire(demoLocal.includes("modelOverrides"), "demo.ts 含 modelOverrides");
wire(demoLocal.includes("无线鼠标"), "demo.ts 含无线鼠标");
wire(demoLocal.includes("不需要 Key") || demoLocal.includes("无 Key"), "demo.ts 注明无 Key");
wire(demoLocal.includes("clone"), "demo.ts 说明不 clone");
const demoWithoutStrings = demoLocal.replace(/`[\s\S]*?`/g, "").replace(/\/\*[\s\S]*?\*\//g, "");
wire(!/\bfetch\s*\(/.test(demoWithoutStrings), "demo.ts 去掉字符串后无真 fetch(");
wire(
  !/^(?:import|export)\s.+\sfrom\s+['"]@earendil-works/m.test(demoWithoutStrings),
  "demo.ts 去掉字符串后无真 import 包",
);

const rebuilt = `# Ch30 · Session 与 Compaction\n\n${ch.sections
  .map((s) => (s.heading ? `## ${s.heading}\n\n${s.body}` : s.body))
  .join("\n\n")}\n`;
wire(rebuilt === ch.tutorialMd, "tutorialMd 与 sections 重拼一致");

if (wiringFailed) {
  console.error(`\n${wiringFailed} wiring check(s) failed`);
  process.exit(1);
}
console.log("wiring OK");

let failed = 0;
for (const f of ch.functions) {
  const res = await runFunctionTest({
    testSource: ch.testSource,
    preamble: ch.preamble,
    functions: ch.functions,
    codes: solutions,
    activeFunction: f.testSuite,
    productsJson: shared.mocks["products.json"],
  });
  const ok = res.returncode === 0;
  console.log(ok ? `PASS ${f.name}` : `FAIL ${f.name}\n${res.output}`);
  if (!ok) failed++;
}

if (failed) {
  console.error(`\n${failed} suite(s) failed`);
  process.exit(1);
}

mkdirSync(join(root, "local/m6"), { recursive: true });
const tmp = mkdtempSync(join(root, "local/m6", "ch30-verify-"));
try {
  cpSync(localDir, tmp, { recursive: true });
  const filled = `${ch.preamble}\n\n${ch.functions.map((f) => solutions[f.name]).join("\n\n")}\n`;
  writeFileSync(join(tmp, "assignment.ts"), filled);
  const r = spawnSync("bun", ["test", join(tmp, "assignment.test.ts")], {
    encoding: "utf8",
    cwd: root,
  });
  const bunOk = r.status === 0;
  console.log(bunOk ? "PASS bun test (mkdtemp + solutions)" : `FAIL bun test\n${r.stdout}\n${r.stderr}`);
  if (!bunOk) failed++;
  const stillTodo = readFileSync(join(localDir, "assignment.ts"), "utf8").includes('throw new Error("TODO")');
  if (!stillTodo) {
    console.error("FAIL student assignment.ts 被改掉了（应仍是 TODO）");
    failed++;
  } else {
    console.log("PASS student assignment.ts 仍是 TODO");
  }
} finally {
  rmSync(tmp, { recursive: true, force: true });
}

if (failed) {
  console.error(`\n${failed} suite(s) failed`);
  process.exit(1);
}
console.log("\nall green");
