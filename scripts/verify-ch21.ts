/**
 * 用标准答案跑一遍 Ch21 测试，确认生成的 JSON 与 local 能绿。
 * 运行：bun scripts/verify-ch21.ts
 */
import { spawnSync } from "node:child_process";
import { cpSync, existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import chapter from "../src/content/chapters/ch21.json";
import shared from "../src/content/shared.json";
import { runFunctionTest } from "../assets/js/runner-core.js";
import type { FuncDef, Section } from "../src/types";

const solutions: Record<string, string> = {
  formatSseEvent: `export function formatSseEvent(data: string, eventName?: string): string {
  if (eventName === undefined) return \`data: \${data}\\n\\n\`;
  return \`event: \${eventName}\\ndata: \${data}\\n\\n\`;
}`,
  formatSseComment: `export function formatSseComment(text: string): string {
  return \`: \${text}\\n\\n\`;
}`,
  splitSse: `export function splitSse(buffer: string): { frames: string[]; rest: string } {
  const parts = buffer.split("\\n\\n");
  const rest = parts.pop() ?? "";
  const frames = parts.filter((p) => p !== "");
  return { frames, rest };
}`,
  encodeTokenDelta: `export function encodeTokenDelta(token: string): string {
  return formatSseEvent(token);
}`,
  endStream: `export function endStream(): string {
  return formatSseEvent("[DONE]");
}`,
  concatAssistantText: `export function concatAssistantText(tokens: string[]): string {
  return tokens.join("");
}`,
};

const expectedNames = [
  "formatSseEvent",
  "formatSseComment",
  "splitSse",
  "encodeTokenDelta",
  "endStream",
  "concatAssistantText",
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
const localDir = join(root, "local/m4/ch21");

wire(ch.id === "ch21", `id === ch21 (got ${ch.id})`);
wire(ch.num === "21", `num === 21 (got ${ch.num})`);
wire(ch.title === "SSE 流式响应", `title (got ${ch.title})`);
wire(ch.runMode === "local", `runMode === local (got ${ch.runMode})`);
wire(ch.testName === "ch21_assignment", `testName (got ${ch.testName})`);
wire(ch.interleaved === true, "interleaved === true");
wire(ch.localHint === "bun test local/m4/ch21", `localHint (got ${ch.localHint})`);
wire(ch.tutorialMd.startsWith("# Ch21 · SSE 流式响应"), "H1");
wire(ch.tutorialMd.includes("作业 ↔ 教程对应表"), "front matter 对应表");
wire(ch.tutorialMd.includes("Ch22"), "下一步指向 Ch22");
wire(ch.tutorialMd.includes("pi-ai：调模型 + 流式"), "下一步含 Ch22 标题");
wire(ch.tutorialMd.includes("Ch11"), "对照/前置含 Ch11");
wire(ch.tutorialMd.includes("joinSsePayloads") || ch.tutorialMd.includes("data:"), "Ch11 读帧 / data: 协议");
wire(ch.tutorialMd.includes("```mermaid"), "至少 1 个 mermaid");
wire(ch.tutorialMd.includes("color:#1f1f1f"), "mermaid 带 color:#1f1f1f");
wire(ch.tutorialMd.includes("SseEmitter"), "Java 对照 SseEmitter");
wire(
  ch.tutorialMd.includes("AsyncContext") || ch.tutorialMd.toLowerCase().includes("servlet"),
  "Java 对照 Servlet async",
);
wire(ch.tutorialMd.includes("StreamingResponse"), "Python 对照 StreamingResponse");
wire(ch.tutorialMd.toLowerCase().includes("fastapi"), "Python 对照 FastAPI");
wire(ch.tutorialMd.includes("text/event-stream"), "讲 Content-Type text/event-stream");
wire(ch.tutorialMd.includes("[DONE]"), "讲 [DONE] 约定");
wire(ch.tutorialMd.includes("streamSSE"), "教程简述 Hono streamSSE");
wire(!/drizzle/i.test(ch.tutorialMd), "教程不讲 drizzle");
wire(!/\bPi Agent\b/.test(ch.tutorialMd) && !ch.tutorialMd.includes("@earendil"), "教程不讲 Pi Agent");
wire(!ch.tutorialMd.includes("corsHeaders"), "教程不讲 CORS 作业函数");

wire(!/from\s+["']hono["']/.test(ch.assignment), 'assignment 无 from "hono"');
wire(!/from\s+["']hono["']/.test(ch.testSource), 'testSource 无 from "hono"');
wire(!/from\s+["']hono["']/.test(ch.preamble), 'preamble 无 from "hono"');
wire(!/^\s*import\s+/m.test(ch.assignment), "assignment 无 import");
wire(!/^\s*import\s+/m.test(ch.testSource), "testSource 无 import");

const homeworkBlob = `${ch.assignment}\n${ch.testSource}\n${ch.preamble}`;
wire(!/\bhono\b/i.test(homeworkBlob), "JSON 作业侧无 hono");
wire(!homeworkBlob.includes("@hono/"), "作业侧无 @hono/");
wire(!/drizzle/i.test(homeworkBlob), "作业侧无 drizzle");
wire(!homeworkBlob.includes("pi-ai"), "作业侧无 pi-ai");
wire(!homeworkBlob.includes("node:http"), "作业侧无 node:http");
wire(!/\bsetTimeout\b/.test(homeworkBlob), "作业侧无 setTimeout");
wire(!/\bfetch\s*\(/.test(homeworkBlob), "作业侧无 fetch(");

wire(ch.reviewMd.includes("text/event-stream") || ch.reviewMd.includes("SseEmitter"), "闪卡含 SSE / SseEmitter");
wire(ch.reviewMd.includes("[DONE]"), "闪卡含 [DONE]");
wire(ch.reviewMd.includes("keep-alive") || ch.reviewMd.includes("注释"), "闪卡含 keep-alive/注释");
wire(ch.reviewMd.includes("rest") || ch.reviewMd.includes("半帧"), "闪卡含 rest/半帧");
wire(ch.reviewMd.includes("Ch11") || ch.reviewMd.includes("joinSsePayloads"), "闪卡含 Ch11 对照");

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
  (ch.functions.find((f) => f.name === "encodeTokenDelta")?.skeleton ?? "").includes("formatSseEvent"),
  "encodeTokenDelta 骨架提示调用 formatSseEvent",
);
wire(
  (ch.functions.find((f) => f.name === "endStream")?.skeleton ?? "").includes("formatSseEvent"),
  "endStream 骨架提示调用 formatSseEvent",
);

const secNums = ["21.1", "21.2", "21.3", "21.4", "21.5", "21.6"];
for (const n of secNums) {
  const s = ch.sections.find((x) => x.secNum === n);
  wire(!!s && s.heading.includes("§" + n), `H2 含 §${n}`);
}

wire(
  ch.sections.find((s) => s.secNum === "21.1")?.exerciseFunctions.includes("formatSseEvent") === true,
  "§21.1 → formatSseEvent",
);
wire(
  ch.sections.find((s) => s.secNum === "21.2")?.exerciseFunctions.includes("formatSseComment") === true,
  "§21.2 → formatSseComment",
);
wire(
  ch.sections.find((s) => s.secNum === "21.3")?.exerciseFunctions.includes("splitSse") === true,
  "§21.3 → splitSse",
);
wire(
  ch.sections.find((s) => s.secNum === "21.4")?.exerciseFunctions.includes("encodeTokenDelta") === true,
  "§21.4 → encodeTokenDelta",
);
wire(
  ch.sections.find((s) => s.secNum === "21.5")?.exerciseFunctions.includes("endStream") === true,
  "§21.5 → endStream",
);
wire(
  ch.sections.find((s) => s.secNum === "21.6")?.exerciseFunctions.includes("concatAssistantText") ===
    true,
  "§21.6 → concatAssistantText",
);

const forbiddenMatchers = [".toThrow", ".toContain", ".toMatch", ".toBeTruthy", ".toBeFalsy"];
for (const m of forbiddenMatchers) {
  wire(!ch.testSource.includes(m), `expect 不用 ${m}`);
}

wire(ch.testSource.includes('["无", "线", "鼠标"]') || ch.testSource.includes('["无","线","鼠标"]'), "测试含无线鼠标防硬编码");
wire(ch.testSource.includes("Object.freeze"), "concatAssistantText 测试 freeze 数组");
wire(hasIdentCall(solutions.encodeTokenDelta, "formatSseEvent"), "encodeTokenDelta 答案调用 formatSseEvent");
wire(hasIdentCall(solutions.endStream, "formatSseEvent"), "endStream 答案调用 formatSseEvent");

const mermaidBlocks = ch.tutorialMd.split("```mermaid");
wire(mermaidBlocks.length >= 2, "至少 1 个 mermaid 围栏");
const mermaidInBlockquote = /(^|\n)>[^\n]*\n```mermaid/.test(ch.tutorialMd);
wire(!mermaidInBlockquote, "mermaid 不在 blockquote 内");

const localFiles = ["assignment.ts", "app.ts", "assignment.test.ts"];
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

wire(assignmentLocal.includes('throw new Error("TODO")'), "local assignment 含 TODO");
for (const n of expectedNames) {
  wire(
    assignmentLocal.includes(`export function ${n}`),
    `local assignment export function ${n}`,
  );
}
wire(!/from\s+["']hono["']/.test(assignmentLocal), "local assignment 无 import hono");
wire(!/^\s*import\s+/m.test(assignmentLocal), "local assignment 无 import");
wire(appLocal.includes("streamSSE"), "app.ts 含 streamSSE");
wire(appLocal.includes('from "hono/streaming"') || appLocal.includes("from 'hono/streaming'"), "app.ts import hono/streaming");
wire(appLocal.includes("writeSSE"), "app.ts 含 writeSSE");
wire(!/\.listen\b/.test(appLocal) && !appLocal.includes("Bun.serve"), "app.ts 无 listen");
wire(appLocal.includes("new Hono"), "app.ts 含 new Hono");
wire(appLocal.includes("TOKENS"), "app.ts 导出 TOKENS");
wire(appLocal.includes("/stream") && appLocal.includes("/health"), "app.ts 含 /stream 与 /health");
wire(testLocal.includes("bun:test"), "local test 用 bun:test");
wire(testLocal.includes("app.request"), "local test 用 app.request");
wire(testLocal.includes("/stream"), "local test 打 /stream");
wire(testLocal.includes("text/event-stream"), "local test 查 Content-Type");
wire(testLocal.includes("splitSse") && testLocal.includes("concatAssistantText"), "local test 用 splitSse+concat 还原");
wire(testLocal.includes("[DONE]"), "local test 断言 [DONE]");
wire(testLocal.includes("TOKENS"), "local test 用 TOKENS 常量");

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

const tmp = mkdtempSync(join(root, "local/m4", "ch21-verify-"));
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
