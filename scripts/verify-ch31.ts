/**
 * 用标准答案跑一遍 Ch31 测试，确认生成的 JSON 与 local 能绿。
 * 运行：bun scripts/verify-ch31.ts
 */
import { spawnSync } from "node:child_process";
import { cpSync, existsSync, mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import chapter from "../src/content/chapters/ch31.json";
import shared from "../src/content/shared.json";
import { runFunctionTest } from "../assets/js/runner-core.js";
import type { FuncDef, Section } from "../src/types";

const solutions: Record<string, string> = {
  pickIntegration: `export function pickIntegration(need: string): Integration | null {
  if (need === "in-process") return "sdk";
  if (need === "isolate" || need === "cross-language") return "rpc";
  if (need === "one-shot") return "json";
  return null;
}`,
  splitJsonl: `export function splitJsonl(input: string): string[] {
  const out: string[] = [];
  let start = 0;
  for (let i = 0; i <= input.length; i++) {
    if (i === input.length || input.charCodeAt(i) === 10) {
      let rec = input.slice(start, i);
      if (rec.endsWith("\\r")) rec = rec.slice(0, -1);
      if (rec !== "") out.push(rec);
      start = i + 1;
    }
  }
  return out;
}`,
  encodeCommand: `export function encodeCommand(cmd: RpcCommand): string {
  const obj: Record<string, string> = { type: cmd.type, id: cmd.id };
  if (cmd.message !== undefined) obj.message = cmd.message;
  if (cmd.streamingBehavior !== undefined) obj.streamingBehavior = cmd.streamingBehavior;
  if (cmd.customInstructions !== undefined) obj.customInstructions = cmd.customInstructions;
  return JSON.stringify(obj) + "\\n";
}`,
  matchResponseTo: `export function matchResponseTo(frames: RpcFrame[], id: string): RpcFrame | null {
  for (const frame of frames) {
    if (frame.type === "response" && frame.id === id) return frame;
  }
  return null;
}`,
  promptAcceptSemantics: `export function promptAcceptSemantics(frame: RpcFrame): PromptReading | null {
  if (frame.type === "response" && frame.command === "prompt") {
    if (frame.success === true) return "accepted";
    if (frame.success === false) return "rejected";
    return null;
  }
  const stream = new Set(["agent_end", "message_end", "turn_end", "tool_execution_end", "message_update"]);
  if (stream.has(frame.type)) return "stream";
  return null;
}`,
  answerUiRequest: `export function answerUiRequest(request: UiRequest, choice: string | null): UiResponse | null {
  if (request.type !== "extension_ui_request" || request.method !== "select") return null;
  if (choice === null) return { type: "extension_ui_response", id: request.id, cancelled: true };
  if (!(request.options ?? []).includes(choice)) return null;
  return { type: "extension_ui_response", id: request.id, value: choice };
}`,
  sdkEquivalent: `export function sdkEquivalent(command: string): string | null {
  switch (command) {
    case "prompt":
      return "session.prompt";
    case "steer":
      return "session.steer";
    case "follow_up":
      return "session.followUp";
    case "abort":
      return "session.abort";
    case "compact":
      return "session.compact";
    case "get_entries":
      return "session.sessionManager.getEntries";
    case "get_state":
      return "session fields";
    default:
      return null;
  }
}`,
};

const expectedNames = [
  "pickIntegration",
  "splitJsonl",
  "encodeCommand",
  "matchResponseTo",
  "promptAcceptSemantics",
  "answerUiRequest",
  "sdkEquivalent",
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
const localDir = join(root, "local/m6/ch31");

wire(ch.id === "ch31", `id === ch31 (got ${ch.id})`);
wire(ch.num === "31", `num === 31 (got ${ch.num})`);
wire(ch.title === "SDK 嵌入 vs RPC", `title (got ${ch.title})`);
wire(ch.runMode === "local", `runMode === local (got ${ch.runMode})`);
wire(ch.testName === "ch31_assignment", `testName (got ${ch.testName})`);
wire(ch.interleaved === true, "interleaved === true");
wire(ch.localHint === "bun test local/m6/ch31", `localHint (got ${ch.localHint})`);
wire(ch.tutorialMd.startsWith("# Ch31 · SDK 嵌入 vs RPC"), "H1");
wire(ch.tutorialMd.includes("作业 ↔ 教程对应表"), "front matter 对应表");
wire(ch.tutorialMd.includes("课程完结"), "收官指向课程完结");
const mermaidCount = (ch.tutorialMd.match(/```mermaid/g) ?? []).length;
wire(mermaidCount >= 5 && mermaidCount <= 8, `mermaid 数量 5–8（got ${mermaidCount}）`);
wire(ch.tutorialMd.includes("color:#1f1f1f"), "mermaid 带 color:#1f1f1f");
wire(ch.tutorialMd.includes("ProcessBuilder"), "Java ProcessBuilder 对照");
wire(ch.tutorialMd.includes("subprocess"), "Python subprocess 对照");
wire(ch.tutorialMd.includes("createAgentSession"), "教程含 createAgentSession");
wire(ch.tutorialMd.includes("inMemory"), "教程含 inMemory");
wire(ch.tutorialMd.includes("subscribe"), "教程含 subscribe");
wire(ch.tutorialMd.includes("readline"), "教程含 readline");
wire(ch.tutorialMd.includes("U+2028"), "教程含 U+2028");
wire(ch.tutorialMd.includes("U+2029"), "教程含 U+2029");
wire(ch.tutorialMd.includes("extension_ui_request"), "教程含 extension_ui_request");
wire(ch.tutorialMd.includes("success"), "教程含 success 语义");
wire(ch.tutorialMd.includes("streamingBehavior"), "教程含 streamingBehavior");
wire(ch.tutorialMd.includes("--mode rpc") || ch.tutorialMd.includes("--mode rpc".replace("--mode rpc", "mode rpc")) || ch.tutorialMd.includes("mode rpc"), "教程含 rpc 模式");
wire(ch.tutorialMd.includes("mode json") || ch.tutorialMd.includes("--mode json"), "教程含 json 模式");
wire(ch.tutorialMd.includes("@earendil-works"), "教程指明事实源包名");
wire(ch.tutorialMd.includes("clone"), "教程说明不 clone");
for (const n of expectedNames) wire(ch.tutorialMd.includes(n), `教程含 ${n}`);
wire(ch.tutorialMd.includes("无线鼠标"), "教程含无线鼠标");
wire(ch.tutorialMd.includes("KB-001"), "教程含 KB-001");

const homeworkBlob = `${ch.assignment}\n${ch.testSource}\n${ch.preamble}`;
wire(!/^\s*import\s+/m.test(ch.assignment), "JSON assignment 无 import");
wire(!/^\s*import\s+/m.test(ch.testSource), "testSource 无 import");
wire(!/^\s*import\s+/m.test(ch.preamble), "preamble 无 import");
wire(!/\bhono\b/i.test(homeworkBlob), "JSON 作业侧无 hono");
wire(!homeworkBlob.includes("@earendil-works"), "JSON 作业侧无 @earendil-works");
wire(!homeworkBlob.includes("pi-coding-agent"), "JSON 作业侧无 pi-coding-agent");
wire(!/\bfetch\s*\(/.test(homeworkBlob), "JSON 作业侧无 fetch(");
wire(!/\bsetTimeout\s*\(/.test(homeworkBlob), "JSON 作业侧无 setTimeout(");
wire(ch.preamble.includes("type Integration"), "preamble 含 Integration");
wire(ch.preamble.includes("type RpcCommand"), "preamble 含 RpcCommand");
wire(ch.preamble.includes("type UiResponse"), "preamble 含 UiResponse");
wire(ch.preamble.includes("bun test local/m6/ch31"), "preamble 含本地命令");
wire(ch.reviewMd.includes("U+2028"), "闪卡含 U+2028");
wire(ch.reviewMd.includes("success"), "闪卡含 success");
wire(ch.reviewMd.includes("followUp"), "闪卡含 followUp");
wire(ch.reviewMd.includes("select"), "闪卡含 select");

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
  wire(ch.sections.some((s) => s.exerciseFunctions.includes(f.name)), `${f.name} 挂在某节`);
}
for (const [n, fn] of [
  ["31.1", "pickIntegration"],
  ["31.2", "splitJsonl"],
  ["31.3", "encodeCommand"],
  ["31.4", "matchResponseTo"],
  ["31.5", "promptAcceptSemantics"],
  ["31.6", "answerUiRequest"],
  ["31.7", "sdkEquivalent"],
] as Array<[string, string]>) {
  const s = ch.sections.find((x) => x.secNum === n);
  wire(!!s && s.heading.includes("§" + n), `H2 含 §${n}`);
  wire(s?.exerciseFunctions.includes(fn) === true, `§${n} → ${fn}`);
}
for (const m of [".toThrow", ".toContain", ".toMatch", ".toBeTruthy", ".toBeFalsy"]) {
  wire(!ch.testSource.includes(m), `expect 不用 ${m}`);
}
wire(ch.testSource.includes(".toBe("), "JSON 测试含 toBe");
wire(ch.testSource.includes(".toEqual("), "JSON 测试含 toEqual");
wire(ch.testSource.includes(".toBeNull("), "JSON 测试含 toBeNull");
wire(ch.testSource.includes("无线鼠标"), "JSON 测试含无线鼠标");
wire(ch.testSource.includes("KB-001"), "JSON 测试含 KB-001");
wire(ch.testSource.includes("Object.freeze"), "JSON 测试 freeze");
wire(ch.testSource.includes("extension_ui_response"), "JSON 测试含 UI 应答");
wire(ch.testSource.includes("session fields"), "JSON 测试含 session fields");

for (const name of ["assignment.ts", "assignment.test.ts", "demo.ts"]) {
  wire(existsSync(join(localDir, name)), `local 存在 ${name}`);
}
wire(!existsSync(join(localDir, "app.ts")), "M6 章无 app.ts");

const assignmentLocal = readFileSync(join(localDir, "assignment.ts"), "utf8");
const testLocal = readFileSync(join(localDir, "assignment.test.ts"), "utf8");
const demoLocal = readFileSync(join(localDir, "demo.ts"), "utf8");
wire(assignmentLocal.includes('throw new Error("TODO")'), "local assignment 含 TODO");
for (const n of expectedNames) {
  wire(assignmentLocal.includes(`export function ${n}`), `local assignment export ${n}`);
}
wire(!assignmentLocal.includes("pi-coding-agent"), "local assignment 无 pi-coding-agent");
wire(!assignmentLocal.includes("@earendil-works"), "local assignment 无 @earendil-works");
wire(!/^\s*import\s+/m.test(assignmentLocal), "local assignment 无 import");
wire(testLocal.includes("bun:test"), "local test 用 bun:test");
wire(testLocal.includes("Object.freeze"), "local test freeze");
wire(!testLocal.includes("./demo"), "local test 不 import demo");
wire(demoLocal.includes("sdk.md") && demoLocal.includes("rpc.md") && demoLocal.includes("json.md"), "demo 含三篇文档");
wire(demoLocal.includes("createAgentSession") && demoLocal.includes("inMemory"), "demo 含 SDK 启动");
wire(demoLocal.includes("subscribe"), "demo 含 subscribe");
wire(demoLocal.includes("extension_ui_response"), "demo 含 UI 应答");
wire(demoLocal.includes("U+2028"), "demo 含 U+2028");
wire(demoLocal.includes("无线鼠标") && demoLocal.includes("KB-001"), "demo 含商品");
wire(demoLocal.includes("不需要 Key"), "demo 注明无 Key");
wire(demoLocal.includes("clone"), "demo 说明不 clone");
const demoWithoutStrings = demoLocal.replace(/`[\s\S]*?`/g, "").replace(/\/\*[\s\S]*?\*\//g, "");
wire(!/\bfetch\s*\(/.test(demoWithoutStrings), "demo 去字符串后无 fetch");
wire(!/^(?:import|export)\s.+\sfrom\s+['"]@earendil-works/m.test(demoWithoutStrings), "demo 去字符串后无真 import");

const rebuilt = `# Ch31 · SDK 嵌入 vs RPC\n\n${ch.sections
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
const tmp = mkdtempSync(join(root, "local/m6", "ch31-verify-"));
try {
  cpSync(localDir, tmp, { recursive: true });
  writeFileSync(join(tmp, "assignment.ts"), `${ch.preamble}\n\n${ch.functions.map((f) => solutions[f.name]).join("\n\n")}\n`);
  const r = spawnSync("bun", ["test", join(tmp, "assignment.test.ts")], { encoding: "utf8", cwd: root });
  const bunOk = r.status === 0;
  console.log(bunOk ? "PASS bun test (mkdtemp + solutions)" : `FAIL bun test\n${r.stdout}\n${r.stderr}`);
  if (!bunOk) failed++;
  const stillTodo = readFileSync(join(localDir, "assignment.ts"), "utf8").includes('throw new Error("TODO")');
  console.log(stillTodo ? "PASS student assignment.ts 仍是 TODO" : "FAIL student assignment 被改掉");
  if (!stillTodo) failed++;
} finally {
  rmSync(tmp, { recursive: true, force: true });
}

if (failed) {
  console.error(`\n${failed} suite(s) failed`);
  process.exit(1);
}
console.log("\nall green");
