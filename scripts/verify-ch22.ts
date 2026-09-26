/**
 * 用标准答案跑一遍 Ch22 测试，确认生成的 JSON 与 local 能绿。
 * 运行：bun scripts/verify-ch22.ts
 */
import { spawnSync } from "node:child_process";
import { cpSync, existsSync, mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import chapter from "../src/content/chapters/ch22.json";
import shared from "../src/content/shared.json";
import { runFunctionTest } from "../assets/js/runner-core.js";
import type { FuncDef, Section } from "../src/types";

const solutions: Record<string, string> = {
  collectTextDeltas: `export function collectTextDeltas(events: PiEvent[]): string[] {
  return events.filter((e) => e.type === "text_delta").map((e) => e.delta);
}`,
  collectUsage: `export function collectUsage(events: PiEvent[]): PiUsage | null {
  let found: PiUsage | null = null;
  for (const e of events) {
    if (e.type === "done" && e.usage) found = e.usage;
  }
  return found;
}`,
  stopReason: `export function stopReason(events: PiEvent[]): string | null {
  let last: string | null = null;
  for (const e of events) {
    if (e.type === "done" || e.type === "error") last = e.reason;
  }
  return last;
}`,
  joinAssistant: `export function joinAssistant(events: PiEvent[]): string {
  return collectTextDeltas(events).join("");
}`,
  isStillStreaming: `export function isStillStreaming(events: PiEvent[]): boolean {
  return !events.some((e) => e.type === "done" || e.type === "error");
}`,
  toSseFromPiDeltas: `export function toSseFromPiDeltas(events: PiEvent[]): string {
  let out = collectTextDeltas(events).map((d) => \`data: \${d}\\n\\n\`).join("");
  const reason = stopReason(events);
  if (reason === "error" || reason === "aborted") out += "data: [ERROR]\\n\\n";
  else if (reason === "stop" || reason === "length" || reason === "toolUse") {
    out += "data: [DONE]\\n\\n";
  }
  return out;
}`,
};

const expectedNames = [
  "collectTextDeltas",
  "collectUsage",
  "stopReason",
  "joinAssistant",
  "isStillStreaming",
  "toSseFromPiDeltas",
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
const localDir = join(root, "local/m5/ch22");

wire(ch.id === "ch22", `id === ch22 (got ${ch.id})`);
wire(ch.num === "22", `num === 22 (got ${ch.num})`);
wire(ch.title === "pi-ai：调模型 + 流式", `title (got ${ch.title})`);
wire(ch.runMode === "local", `runMode === local (got ${ch.runMode})`);
wire(ch.testName === "ch22_assignment", `testName (got ${ch.testName})`);
wire(ch.interleaved === true, "interleaved === true");
wire(ch.localHint === "bun test local/m5/ch22", `localHint (got ${ch.localHint})`);
wire(ch.tutorialMd.startsWith("# Ch22 · pi-ai：调模型 + 流式"), "H1");
wire(ch.tutorialMd.includes("作业 ↔ 教程对应表"), "front matter 对应表");
wire(ch.tutorialMd.includes("Ch23"), "下一步指向 Ch23");
wire(ch.tutorialMd.includes("pi-agent-core：最小 Agent + Tool"), "下一步含 Ch23 标题");
wire(ch.tutorialMd.includes("```mermaid"), "至少 1 个 mermaid");
wire(ch.tutorialMd.includes("color:#1f1f1f"), "mermaid 带 color:#1f1f1f");
wire(ch.tutorialMd.includes("@earendil-works/pi-ai"), "教程含 @earendil-works/pi-ai");
wire(ch.tutorialMd.includes("text_delta"), "教程含 text_delta");
wire(ch.tutorialMd.includes("builtinModels"), "教程含 builtinModels");
wire(ch.tutorialMd.includes("models.stream"), "教程含 models.stream");
wire(ch.tutorialMd.includes("HttpClient"), "Java 对照 HttpClient");
wire(ch.tutorialMd.toLowerCase().includes("httpx") || ch.tutorialMd.includes("stream=True"), "Python 对流对照");
wire(
  !ch.tutorialMd.includes("bun add @mariozechner") &&
    !ch.tutorialMd.includes("npm install @mariozechner"),
  "不教安装过时 @mariozechner",
);
wire(ch.tutorialMd.includes("@earendil-works/pi-ai"), "现行包名是 earendil-works");
wire(ch.tutorialMd.includes("Ch25") && ch.tutorialMd.includes("不讲"), "点到 createAgentSession 在 Ch25、本章不讲");
wire(
  !/export function (prompt|rag|react)/i.test(ch.assignment),
  "作业不导出 Prompt/RAG/ReAct",
);
wire(
  ch.tutorialMd.includes("不重复") && ch.tutorialMd.includes("RAG"),
  "教程声明不重复 Prompt/RAG/ReAct 原理",
);

const homeworkBlob = `${ch.assignment}\n${ch.testSource}\n${ch.preamble}`;
wire(!/^\s*import\s+/m.test(ch.assignment), "assignment 无 import");
wire(!/^\s*import\s+/m.test(ch.testSource), "testSource 无 import");
wire(!/^\s*import\s+/m.test(ch.preamble), "preamble 无 import");
wire(!/\bhono\b/i.test(homeworkBlob), "JSON 作业侧无 hono");
wire(!homeworkBlob.includes("@earendil-works"), "JSON 作业侧无 @earendil-works");
wire(!homeworkBlob.includes("pi-ai"), "JSON 作业侧无 pi-ai");
wire(!/\bfetch\s*\(/.test(homeworkBlob), "JSON 作业侧无 fetch(");
wire(!/\bsetTimeout\s*\(/.test(homeworkBlob), "JSON 作业侧无 setTimeout(");

wire(ch.preamble.includes('type PiUsage = { input: number; output: number }'), "preamble 含 PiUsage");
wire(ch.preamble.includes('type: "text_delta"'), "preamble 含 text_delta 联合");
wire(ch.preamble.includes('reason: "stop" | "length" | "toolUse"'), "preamble 含 done reason");
wire(ch.preamble.includes('reason: "error" | "aborted"'), "preamble 含 error reason");

wire(ch.reviewMd.includes("text_delta"), "闪卡含 text_delta");
wire(ch.reviewMd.includes("OPENAI_API_KEY") || ch.reviewMd.includes("API Key") || ch.reviewMd.includes("Key"), "闪卡含无 Key");
wire(ch.reviewMd.includes("isStillStreaming") || ch.reviewMd.includes("空"), "闪卡含空数组仍在流");
wire(ch.reviewMd.includes("[DONE]") || ch.reviewMd.includes("[ERROR]"), "闪卡含 SSE 结束帧");
wire(ch.reviewMd.includes("collectTextDeltas"), "闪卡含 join 调用 collectTextDeltas");

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
  (ch.functions.find((f) => f.name === "joinAssistant")?.skeleton ?? "").includes("collectTextDeltas"),
  "joinAssistant 骨架提示调用 collectTextDeltas",
);

const secNums = ["22.1", "22.2", "22.3", "22.4", "22.5", "22.6"];
for (const n of secNums) {
  const s = ch.sections.find((x) => x.secNum === n);
  wire(!!s && s.heading.includes("§" + n), `H2 含 §${n}`);
}

wire(
  ch.sections.find((s) => s.secNum === "22.1")?.exerciseFunctions.includes("collectTextDeltas") === true,
  "§22.1 → collectTextDeltas",
);
wire(
  ch.sections.find((s) => s.secNum === "22.2")?.exerciseFunctions.includes("collectUsage") === true,
  "§22.2 → collectUsage",
);
wire(
  ch.sections.find((s) => s.secNum === "22.3")?.exerciseFunctions.includes("stopReason") === true,
  "§22.3 → stopReason",
);
wire(
  ch.sections.find((s) => s.secNum === "22.4")?.exerciseFunctions.includes("joinAssistant") === true,
  "§22.4 → joinAssistant",
);
wire(
  ch.sections.find((s) => s.secNum === "22.5")?.exerciseFunctions.includes("isStillStreaming") === true,
  "§22.5 → isStillStreaming",
);
wire(
  ch.sections.find((s) => s.secNum === "22.6")?.exerciseFunctions.includes("toSseFromPiDeltas") === true,
  "§22.6 → toSseFromPiDeltas",
);

const forbiddenMatchers = [".toThrow", ".toContain", ".toMatch", ".toBeTruthy", ".toBeFalsy"];
for (const m of forbiddenMatchers) {
  wire(!ch.testSource.includes(m), `expect 不用 ${m}`);
}
wire(ch.testSource.includes(".toBe("), "JSON 测试含 toBe");
wire(ch.testSource.includes(".toEqual("), "JSON 测试含 toEqual");
wire(ch.testSource.includes(".toBeNull("), "JSON 测试含 toBeNull");
wire(ch.testSource.includes("无线鼠标") || ch.testSource.includes("线鼠标"), "JSON 测试含无线鼠标防硬编码");
wire(ch.testSource.includes("Object.freeze"), "JSON 测试 freeze events");

wire(hasIdentCall(solutions.joinAssistant, "collectTextDeltas"), "joinAssistant 答案调用 collectTextDeltas");
wire(hasIdentCall(solutions.toSseFromPiDeltas, "stopReason"), "toSseFromPiDeltas 答案调用 stopReason");

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
wire(!assignmentLocal.includes("pi-ai"), "local assignment 无 pi-ai");
wire(appLocal.includes("fakeShopStream"), "app.ts 含 fakeShopStream");
wire(appLocal.includes("AsyncGenerator") || appLocal.includes("async function*"), "app.ts 含 async generator");
wire(!/\.listen\b/.test(appLocal) && !appLocal.includes("Bun.serve"), "app.ts 无 listen");
wire(!appLocal.includes("pi-ai") && !appLocal.includes("@earendil-works"), "app.ts 无 pi-ai");
wire(!/\bfetch\s*\(/.test(appLocal), "app.ts 无 fetch");
wire(testLocal.includes("bun:test"), "local test 用 bun:test");
wire(testLocal.includes("fakeShopStream"), "local test 迭代 fakeShopStream");
wire(testLocal.includes("joinAssistant"), "local test 喂 joinAssistant");
wire(testLocal.includes("collectUsage"), "local test 喂 collectUsage");
wire(!testLocal.includes("pi-ai") && !testLocal.includes("@earendil-works"), "local test 不 import pi-ai");
wire(!testLocal.includes("demo.ts") && !testLocal.includes("./demo"), "local test 不 import demo.ts");
wire(demoLocal.includes("@earendil-works/pi-ai"), "demo.ts 含真包名");
wire(demoLocal.includes("builtinModels"), "demo.ts 含 builtinModels");
wire(demoLocal.includes("text_delta"), "demo.ts 含 text_delta");
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
const tmp = mkdtempSync(join(root, "local/m5", "ch22-verify-"));
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
