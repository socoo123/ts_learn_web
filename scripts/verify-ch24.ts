/**
 * 用标准答案跑一遍 Ch24 测试，确认生成的 JSON 与 local 能绿。
 * 运行：bun scripts/verify-ch24.ts
 */
import { spawnSync } from "node:child_process";
import { cpSync, existsSync, mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import chapter from "../src/content/chapters/ch24.json";
import shared from "../src/content/shared.json";
import { runFunctionTest } from "../src/lib/tsRunner";
import type { FuncDef, Section } from "../src/types";

const solutions: Record<string, string> = {
  filterTextDeltas: `export function filterTextDeltas(events: SessionEvent[]): string[] {
  return events.filter((e) => e.type === "text_delta").map((e) => e.delta);
}`,
  reduceSessionEvents: `export function reduceSessionEvents(events: SessionEvent[]): SessionSnap {
  return {
    text: filterTextDeltas(events).join(""),
    tools: events.filter((e) => e.type === "tool_call").map((e) => e.name),
    ended: events.some((e) => e.type === "agent_end"),
    aborted: events.some((e) => e.type === "aborted"),
  };
}`,
  blockDangerousTool: `export function blockDangerousTool(name: string): BlockDecision {
  if (name === "lookupProduct" || name === "calcLineTotal") {
    return { block: false };
  }
  return { block: true, reason: "forbidden" };
}`,
  auditToolCall: `export function auditToolCall(name: string, args: Record<string, unknown>): Audit {
  return { name, args, blocked: blockDangerousTool(name).block };
}`,
  abortFlag: `export function abortFlag(events: SessionEvent[]): boolean {
  return events.some((e) => e.type === "aborted");
}`,
  uiRowsFromEvents: `export function uiRowsFromEvents(events: SessionEvent[]): UiRow[] {
  const snap = reduceSessionEvents(events);
  const rows: UiRow[] = [];
  if (snap.text.length > 0) {
    rows.push({ kind: "assistant", text: snap.text });
  }
  for (const [i, ev] of events.entries()) {
    if (ev.type !== "tool_call") continue;
    if (blockDangerousTool(ev.name).block) {
      rows.push({ kind: "tool", name: ev.name, status: "blocked", text: "forbidden" });
      continue;
    }
    const later = events.slice(i + 1).find((x) => x.type === "tool_result" && x.name === ev.name);
    if (later && later.type === "tool_result" && later.ok === true) {
      rows.push({ kind: "tool", name: ev.name, status: "ok", text: later.text });
    } else if (later && later.type === "tool_result" && later.ok === false) {
      rows.push({ kind: "tool", name: ev.name, status: "error", text: later.text });
    } else {
      rows.push({ kind: "tool", name: ev.name, status: "call", text: "" });
    }
  }
  return rows;
}`,
};

const expectedNames = [
  "filterTextDeltas",
  "reduceSessionEvents",
  "blockDangerousTool",
  "auditToolCall",
  "abortFlag",
  "uiRowsFromEvents",
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

function hasIdentCall(src: string, name: string): boolean {
  return new RegExp(`\\b${name}\\s*\\(`).test(src);
}

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const localDir = join(root, "local/m5/ch24");

wire(ch.id === "ch24", `id === ch24 (got ${ch.id})`);
wire(ch.num === "24", `num === 24 (got ${ch.num})`);
wire(ch.title === "自定义 Tool 与事件", `title (got ${ch.title})`);
wire(ch.runMode === "local", `runMode === local (got ${ch.runMode})`);
wire(ch.testName === "ch24_assignment", `testName (got ${ch.testName})`);
wire(ch.interleaved === true, "interleaved === true");
wire(ch.localHint === "bun test local/m5/ch24", `localHint (got ${ch.localHint})`);
wire(ch.tutorialMd.startsWith("# Ch24 · 自定义 Tool 与事件"), "H1");
wire(ch.tutorialMd.includes("作业 ↔ 教程对应表"), "front matter 对应表");
wire(ch.tutorialMd.includes("Ch25"), "下一步指向 Ch25");
wire(ch.tutorialMd.includes("createAgentSession"), "下一步含 Ch25 标题 createAgentSession");
wire(ch.tutorialMd.includes("```mermaid"), "至少 1 个 mermaid");
wire(ch.tutorialMd.includes("color:#1f1f1f"), "mermaid 带 color:#1f1f1f");
wire(ch.tutorialMd.includes("@earendil-works/pi-agent-core"), "教程含 @earendil-works/pi-agent-core");
wire(ch.tutorialMd.includes("beforeToolCall"), "教程含 beforeToolCall");
wire(ch.tutorialMd.includes("subscribe"), "教程含 subscribe");
wire(ch.tutorialMd.includes("text_delta"), "教程含 text_delta");
wire(ch.tutorialMd.includes("tool_call"), "教程含 tool_call");
wire(ch.tutorialMd.includes("Filter") || ch.tutorialMd.includes("AOP"), "Java 对照 Filter / AOP");
wire(
  ch.tutorialMd.includes("before_request") || ch.tutorialMd.toLowerCase().includes("before_request"),
  "Python 对照 before_request",
);
wire(!ch.tutorialMd.toLowerCase().includes("mariozechner"), "不教 mariozechner");
wire(ch.tutorialMd.includes("Ch25") && ch.tutorialMd.includes("不讲"), "点到 createAgentSession 在 Ch25、本章不讲");
wire(
  !/export function (prompt|rag|react)/i.test(ch.assignment),
  "作业不导出 Prompt/RAG/ReAct",
);
wire(ch.tutorialMd.includes("不重复") && ch.tutorialMd.includes("RAG"), "教程声明不重复 RAG");

const homeworkBlob = `${ch.assignment}\n${ch.testSource}\n${ch.preamble}`;
wire(!/^\s*import\s+/m.test(ch.assignment), "assignment 无 import");
wire(!/^\s*import\s+/m.test(ch.testSource), "testSource 无 import");
wire(!/^\s*import\s+/m.test(ch.preamble), "preamble 无 import");
wire(!/\bhono\b/i.test(homeworkBlob), "JSON 作业侧无 hono");
wire(!homeworkBlob.includes("@earendil-works"), "JSON 作业侧无 @earendil-works");
wire(!homeworkBlob.includes("pi-agent-core"), "JSON 作业侧无 pi-agent-core");
wire(!/\bfetch\s*\(/.test(homeworkBlob), "JSON 作业侧无 fetch(");
wire(!/\bsetTimeout\s*\(/.test(homeworkBlob), "JSON 作业侧无 setTimeout(");

wire(ch.preamble.includes("type SessionEvent ="), "preamble 含 SessionEvent");
wire(ch.preamble.includes('type: "text_delta"'), "preamble 含 text_delta 联合");
wire(ch.preamble.includes('type: "tool_call"'), "preamble 含 tool_call 联合");
wire(ch.preamble.includes('type: "aborted"'), "preamble 含 aborted 联合");

wire(ch.reviewMd.includes("subscribe"), "闪卡含 subscribe");
wire(ch.reviewMd.includes("beforeToolCall") || ch.reviewMd.includes("block: true"), "闪卡含 beforeToolCall / block");
wire(ch.reviewMd.includes("lookupProduct") && ch.reviewMd.includes("calcLineTotal"), "闪卡含只允许两个商品工具");
wire(ch.reviewMd.includes("aborted") && ch.reviewMd.includes("agent_end"), "闪卡含 abort vs agent_end");
wire(ch.reviewMd.includes("reduceSessionEvents") || ch.reviewMd.includes("uiRows"), "闪卡含 uiRows 复用 reduce");
wire(ch.reviewMd.includes("Key") || ch.reviewMd.includes("假"), "闪卡含无 Key 假事件");

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

wire(
  (ch.functions.find((f) => f.name === "reduceSessionEvents")?.skeleton ?? "").includes("filterTextDeltas"),
  "reduceSessionEvents 骨架提示调用 filterTextDeltas",
);
wire(
  (ch.functions.find((f) => f.name === "auditToolCall")?.skeleton ?? "").includes("blockDangerousTool"),
  "auditToolCall 骨架提示调用 blockDangerousTool",
);
wire(
  (ch.functions.find((f) => f.name === "uiRowsFromEvents")?.skeleton ?? "").includes("reduceSessionEvents") &&
    (ch.functions.find((f) => f.name === "uiRowsFromEvents")?.skeleton ?? "").includes("blockDangerousTool"),
  "uiRowsFromEvents 骨架提示调用 reduce + block",
);

const secNums = ["24.1", "24.2", "24.3", "24.4", "24.5", "24.6"];
for (const n of secNums) {
  const s = ch.sections.find((x) => x.secNum === n);
  wire(!!s && s.heading.includes("§" + n), `H2 含 §${n}`);
}

wire(
  ch.sections.find((s) => s.secNum === "24.1")?.exerciseFunctions.includes("filterTextDeltas") === true,
  "§24.1 → filterTextDeltas",
);
wire(
  ch.sections.find((s) => s.secNum === "24.2")?.exerciseFunctions.includes("reduceSessionEvents") === true,
  "§24.2 → reduceSessionEvents",
);
wire(
  ch.sections.find((s) => s.secNum === "24.3")?.exerciseFunctions.includes("blockDangerousTool") === true,
  "§24.3 → blockDangerousTool",
);
wire(
  ch.sections.find((s) => s.secNum === "24.4")?.exerciseFunctions.includes("auditToolCall") === true,
  "§24.4 → auditToolCall",
);
wire(
  ch.sections.find((s) => s.secNum === "24.5")?.exerciseFunctions.includes("abortFlag") === true,
  "§24.5 → abortFlag",
);
wire(
  ch.sections.find((s) => s.secNum === "24.6")?.exerciseFunctions.includes("uiRowsFromEvents") === true,
  "§24.6 → uiRowsFromEvents",
);

const forbiddenMatchers = [".toThrow", ".toContain", ".toMatch", ".toBeTruthy", ".toBeFalsy"];
for (const m of forbiddenMatchers) {
  wire(!ch.testSource.includes(m), `expect 不用 ${m}`);
}
wire(ch.testSource.includes(".toBe("), "JSON 测试含 toBe");
wire(ch.testSource.includes(".toEqual("), "JSON 测试含 toEqual");
wire(ch.testSource.includes(".toBeNull("), "JSON 测试含 toBeNull");
wire(ch.testSource.includes("无线鼠标") || ch.testSource.includes("线鼠标"), "JSON 测试含无线鼠标防硬编码");
wire(ch.testSource.includes("bash"), "JSON 测试含 bash 防硬编码");
wire(ch.testSource.includes("calcLineTotal"), "JSON 测试含 calcLineTotal 防硬编码");
wire(ch.testSource.includes("Object.freeze"), "JSON 测试 freeze");

wire(hasIdentCall(solutions.reduceSessionEvents, "filterTextDeltas"), "reduceSessionEvents 答案调用 filterTextDeltas");
wire(hasIdentCall(solutions.auditToolCall, "blockDangerousTool"), "auditToolCall 答案调用 blockDangerousTool");
wire(hasIdentCall(solutions.uiRowsFromEvents, "reduceSessionEvents"), "uiRowsFromEvents 答案调用 reduceSessionEvents");
wire(hasIdentCall(solutions.uiRowsFromEvents, "blockDangerousTool"), "uiRowsFromEvents 答案调用 blockDangerousTool");

const localFiles = ["assignment.ts", "app.ts", "assignment.test.ts", "demo.ts"];
for (const name of localFiles) {
  wire(existsSync(join(localDir, name)), `local 存在 ${name}`);
}

const assignmentLocal = existsSync(join(localDir, "assignment.ts"))
  ? readFileSync(join(localDir, "assignment.ts"), "utf8")
  : "";
const appLocal = existsSync(join(localDir, "app.ts"))
  ? readFileSync(join(localDir, "app.ts"), "utf8")
  : "";
const testLocal = existsSync(join(localDir, "assignment.test.ts"))
  ? readFileSync(join(localDir, "assignment.test.ts"), "utf8")
  : "";
const demoLocal = existsSync(join(localDir, "demo.ts"))
  ? readFileSync(join(localDir, "demo.ts"), "utf8")
  : "";

wire(assignmentLocal.includes('throw new Error("TODO")'), "local assignment 含 TODO");
for (const n of expectedNames) {
  wire(
    assignmentLocal.includes(`export function ${n}`),
    `local assignment export function ${n}`,
  );
}
wire(!/^\s*import\s+/m.test(assignmentLocal), "local assignment 无 import");
wire(!assignmentLocal.includes("@earendil-works"), "local assignment 无真包");
wire(!assignmentLocal.includes("pi-agent-core"), "local assignment 无 pi-agent-core");
wire(appLocal.includes("SHOP_SESSION_EVENTS"), "app.ts 含 SHOP_SESSION_EVENTS");
wire(appLocal.includes("DANGEROUS_EVENTS"), "app.ts 含 DANGEROUS_EVENTS");
wire(appLocal.includes("fakeSessionStream"), "app.ts 含 fakeSessionStream");
wire(appLocal.includes("collectFromAsync"), "app.ts 含 collectFromAsync");
wire(appLocal.includes("AsyncGenerator") || appLocal.includes("async function*"), "app.ts 含 async generator");
wire(!/\.listen\b/.test(appLocal) && !appLocal.includes("Bun.serve"), "app.ts 无 listen");
wire(!appLocal.includes("pi-agent-core") && !appLocal.includes("@earendil-works"), "app.ts 无真包");
wire(!/\bfetch\s*\(/.test(appLocal), "app.ts 无 fetch");
wire(testLocal.includes("bun:test"), "local test 用 bun:test");
wire(testLocal.includes("fakeSessionStream"), "local test 迭代 fakeSessionStream");
wire(testLocal.includes("uiRowsFromEvents"), "local test 喂 uiRowsFromEvents");
wire(testLocal.includes("reduceSessionEvents"), "local test 喂 reduceSessionEvents");
wire(testLocal.includes("无线鼠标") || testLocal.includes("线鼠标"), "local test 含无线鼠标");
wire(testLocal.includes("bash"), "local test 含 bash");
wire(testLocal.includes("calcLineTotal"), "local test 含 calcLineTotal");
wire(testLocal.includes("Object.freeze"), "local test freeze");
wire(!testLocal.includes("pi-agent-core") && !testLocal.includes("@earendil-works"), "local test 不 import 真包");
wire(!testLocal.includes("demo.ts") && !testLocal.includes("./demo"), "local test 不 import demo.ts");
wire(demoLocal.includes("@earendil-works/pi-agent-core"), "demo.ts 含真包名");
wire(demoLocal.includes("subscribe"), "demo.ts 含 subscribe");
wire(demoLocal.includes("beforeToolCall"), "demo.ts 含 beforeToolCall");
wire(demoLocal.includes("block: true"), "demo.ts 含 block: true");
wire(demoLocal.includes('toolCall.name === "bash"') || demoLocal.includes("toolCall.name === 'bash'"), "demo.ts 拦 bash");
const demoWithoutStrings = demoLocal.replace(/`[\s\S]*?`/g, "").replace(/\/\*[\s\S]*?\*\//g, "");
wire(
  !/^(?:import|export)\s.+\sfrom\s+['"]@earendil-works/m.test(demoWithoutStrings),
  "demo.ts 去掉字符串后无真 import 包",
);

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

mkdirSync(join(root, "local/m5"), { recursive: true });
const tmp = mkdtempSync(join(root, "local/m5", "ch24-verify-"));
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
  const stillTodo = readFileSync(join(localDir, "assignment.ts"), "utf8").includes(
    'throw new Error("TODO")',
  );
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
