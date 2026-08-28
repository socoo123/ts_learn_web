/**
 * 用标准答案跑一遍 Ch26 测试，确认生成的 JSON 与 local 能绿。
 * 运行：bun scripts/verify-ch26.ts
 */
import { spawnSync } from "node:child_process";
import { cpSync, existsSync, mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import chapter from "../src/content/chapters/ch26.json";
import shared from "../src/content/shared.json";
import { runFunctionTest } from "../src/lib/tsRunner";
import type { FuncDef, Section } from "../src/types";

const solutions: Record<string, string> = {
  piEventToSse: `export function piEventToSse(event: PiEvent): string {
  if (event.type === "agent_end") return "data: [DONE]\\n\\n";
  return \`data: \${JSON.stringify(event)}\\n\\n\`;
}`,
  chatRequestSchema: `export function chatRequestSchema() {
  return z.object({
    message: z.string().trim().min(1).max(500),
    sku: z.string().trim().min(1).optional(),
  });
}`,
  reduceChatFromSse: `export function reduceChatFromSse(state: ChatState, payload: string): ChatState {
  if (state.ended) return state;
  if (endOfTurn(payload)) {
    return { rows: state.rows.slice(), ended: true, aborted: state.aborted };
  }
  let ev: unknown;
  try {
    ev = JSON.parse(payload);
  } catch {
    return state;
  }
  if (!ev || typeof ev !== "object" || !("type" in ev)) return state;
  const event = ev as PiEvent;
  if (event.type === "aborted") {
    return { rows: state.rows.slice(), ended: false, aborted: true };
  }
  if (event.type === "text_delta") {
    const rows = state.rows.slice();
    const idx = rows.findIndex((r) => r.kind === "assistant");
    if (idx === -1) {
      rows.push({ kind: "assistant", text: event.delta });
    } else {
      const cur = rows[idx] as Extract<UiRow, { kind: "assistant" }>;
      rows[idx] = { kind: "assistant", text: cur.text + event.delta };
    }
    return { rows, ended: false, aborted: state.aborted };
  }
  if (event.type === "tool_call") {
    return {
      rows: [...state.rows, { kind: "tool", name: event.name, status: "call", text: "" }],
      ended: false,
      aborted: state.aborted,
    };
  }
  if (event.type === "tool_result") {
    const rows = state.rows.slice();
    for (let i = rows.length - 1; i >= 0; i--) {
      const r = rows[i];
      if (r.kind === "tool" && r.name === event.name && r.status === "call") {
        rows[i] = {
          kind: "tool",
          name: event.name,
          status: event.ok ? "ok" : "error",
          text: event.text,
        };
        return { rows, ended: false, aborted: state.aborted };
      }
    }
    return state;
  }
  return state;
}`,
  toolRowView: `export function toolRowView(row: ToolRow): string {
  const head = \`[tool:\${row.name}]\`;
  if (row.status === "call") return \`\${head} 调用中\`;
  const word =
    row.status === "ok" ? "成功" : row.status === "error" ? "失败" : "已拦截";
  return row.text.length > 0 ? \`\${head} \${word} \${row.text}\` : \`\${head} \${word}\`;
}`,
  assistantRowView: `export function assistantRowView(text: string): string {
  return \`助手：\${text}\`;
}`,
  endOfTurn: `export function endOfTurn(payload: string): boolean {
  if (payload === "[DONE]") return true;
  try {
    const ev = JSON.parse(payload) as { type?: string };
    return ev.type === "agent_end";
  } catch {
    return false;
  }
}`,
};

const expectedNames = [
  "piEventToSse",
  "chatRequestSchema",
  "reduceChatFromSse",
  "toolRowView",
  "assistantRowView",
  "endOfTurn",
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
const localDir = join(root, "local/m5/ch26");

wire(ch.id === "ch26", `id === ch26 (got ${ch.id})`);
wire(ch.num === "26", `num === 26 (got ${ch.num})`);
wire(ch.title === "打通：Hono + SSE + React 数据协议", `title (got ${ch.title})`);
wire(ch.runMode === "local", `runMode === local (got ${ch.runMode})`);
wire(ch.testName === "ch26_assignment", `testName (got ${ch.testName})`);
wire(ch.interleaved === true, "interleaved === true");
wire(ch.localHint === "bun test local/m5/ch26", `localHint (got ${ch.localHint})`);
wire(ch.tutorialMd.startsWith("# Ch26 · 打通：Hono + SSE + React 数据协议"), "H1");
wire(ch.tutorialMd.includes("作业 ↔ 教程对应表"), "front matter 对应表");
wire(ch.tutorialMd.includes("```mermaid"), "至少 1 个 mermaid");
wire(ch.tutorialMd.includes("color:#1f1f1f"), "mermaid 带 color:#1f1f1f");
wire(ch.tutorialMd.includes("SseEmitter"), "Java 对照 SseEmitter");
wire(
  ch.tutorialMd.includes("StreamingResponse") || ch.tutorialMd.includes("StreamingResponse"),
  "Python 对照 StreamingResponse",
);
wire(ch.tutorialMd.includes("EventSource"), "教程含 EventSource");
wire(ch.tutorialMd.includes("[DONE]"), "教程含 [DONE]");
wire(ch.tutorialMd.includes("piEventToSse"), "教程含 piEventToSse");
wire(ch.tutorialMd.includes("chatRequestSchema"), "教程含 chatRequestSchema");
wire(ch.tutorialMd.includes("reduceChatFromSse"), "教程含 reduceChatFromSse");
wire(ch.tutorialMd.includes("lookupProduct") && ch.tutorialMd.includes("calcLineTotal"), "教程含商品工具");
wire(ch.tutorialMd.includes("bash"), "教程提到禁止 bash");
wire(ch.tutorialMd.includes("不要把") && ch.tutorialMd.includes("学习站"), "教程声明不要改学习站成聊天产品");
wire(
  ch.tutorialMd.includes("M6") && (ch.tutorialMd.includes("暂停") || ch.tutorialMd.includes("暂停")),
  "教程声明 M6 暂停",
);
wire(ch.tutorialMd.includes("Ch13") || ch.tutorialMd.includes("reduceChat"), "教程对照 Ch13 reducer");
wire(ch.tutorialMd.includes("Ch21"), "教程对照 Ch21 SSE");
wire(ch.tutorialMd.includes("Ch24") || ch.tutorialMd.includes("UiRow"), "教程对照 Ch24 UiRow");
wire(ch.tutorialMd.includes("zod"), "教程含 zod");
wire(ch.tutorialMd.includes("Hono"), "教程含 Hono");
wire(
  !ch.tutorialMd.includes("bun add @mariozechner") &&
    !ch.tutorialMd.includes("npm install @mariozechner"),
  "不教安装过时 @mariozechner",
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

wire(ch.preamble.includes("type PiEvent"), "preamble 含 PiEvent");
wire(ch.preamble.includes("type UiRow"), "preamble 含 UiRow");
wire(ch.preamble.includes("type ChatState"), "preamble 含 ChatState");
wire(ch.preamble.includes("type ChatRequest"), "preamble 含 ChatRequest");
wire(ch.preamble.includes("text_delta"), "preamble 含 text_delta");
wire(ch.preamble.includes("agent_end"), "preamble 含 agent_end");

wire(ch.reviewMd.includes("EventSource"), "闪卡含 EventSource");
wire(ch.reviewMd.includes("[DONE]"), "闪卡含 [DONE]");
wire(ch.reviewMd.includes("zod") || ch.reviewMd.includes("chatRequestSchema"), "闪卡含 zod/schema");
wire(ch.reviewMd.includes("endOfTurn") || ch.reviewMd.includes("reduceChatFromSse"), "闪卡含 reducer/endOfTurn");
wire(ch.reviewMd.includes("Key"), "闪卡含无 Key");
wire(ch.reviewMd.includes("bash"), "闪卡含 bash");

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
  (ch.functions.find((f) => f.name === "reduceChatFromSse")?.skeleton ?? "").includes("endOfTurn"),
  "reduceChatFromSse 骨架提示调用 endOfTurn",
);

const secNums = ["26.1", "26.2", "26.3", "26.4", "26.5", "26.6"];
for (const n of secNums) {
  const s = ch.sections.find((x) => x.secNum === n);
  wire(!!s && s.heading.includes("§" + n), `H2 含 §${n}`);
}

wire(
  ch.sections.find((s) => s.secNum === "26.1")?.exerciseFunctions.includes("piEventToSse") === true,
  "§26.1 → piEventToSse",
);
wire(
  ch.sections.find((s) => s.secNum === "26.2")?.exerciseFunctions.includes("chatRequestSchema") === true,
  "§26.2 → chatRequestSchema",
);
wire(
  ch.sections.find((s) => s.secNum === "26.3")?.exerciseFunctions.includes("reduceChatFromSse") === true,
  "§26.3 → reduceChatFromSse",
);
wire(
  ch.sections.find((s) => s.secNum === "26.4")?.exerciseFunctions.includes("toolRowView") === true,
  "§26.4 → toolRowView",
);
wire(
  ch.sections.find((s) => s.secNum === "26.5")?.exerciseFunctions.includes("assistantRowView") === true,
  "§26.5 → assistantRowView",
);
wire(
  ch.sections.find((s) => s.secNum === "26.6")?.exerciseFunctions.includes("endOfTurn") === true,
  "§26.6 → endOfTurn",
);

const forbiddenMatchers = [".toThrow", ".toContain", ".toMatch", ".toBeTruthy", ".toBeFalsy"];
for (const m of forbiddenMatchers) {
  wire(!ch.testSource.includes(m), `expect 不用 ${m}`);
}
wire(ch.testSource.includes(".toBe("), "JSON 测试含 toBe");
wire(ch.testSource.includes(".toEqual("), "JSON 测试含 toEqual");
wire(ch.testSource.includes(".toBeNull("), "JSON 测试含 toBeNull");
wire(ch.testSource.includes("无线鼠标") || ch.testSource.includes("MS-002"), "JSON 测试含无线鼠标或 MS-002");
wire(ch.testSource.includes("Object.freeze"), "JSON 测试 freeze");
wire(ch.testSource.includes("lookupProduct") && ch.testSource.includes("calcLineTotal"), "JSON 测试含商品工具");
wire(ch.testSource.includes("bash"), "JSON 测试含 bash");
wire(ch.testSource.includes("[DONE]"), "JSON 测试含 [DONE]");

wire(hasIdentCall(solutions.reduceChatFromSse, "endOfTurn"), "reduceChatFromSse 答案调用 endOfTurn");
wire(solutions.chatRequestSchema.includes("z.object"), "chatRequestSchema 答案用 z.object");
wire(solutions.piEventToSse.includes("[DONE]"), "piEventToSse 答案含 [DONE]");

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
wire(assignmentLocal.includes('from "zod"'), "local assignment import zod");
wire(!assignmentLocal.includes("pi-coding-agent"), "local assignment 无 pi-coding-agent");
wire(!assignmentLocal.includes("@earendil-works"), "local assignment 无 @earendil-works");
wire(!/\bhono\b/i.test(assignmentLocal), "local assignment 无 hono");
wire(appLocal.includes("Hono") || appLocal.includes("hono"), "app.ts 含 Hono");
wire(appLocal.includes("streamSSE") || appLocal.includes("streamSSE"), "app.ts 含 streamSSE");
wire(appLocal.includes("piEventToSse"), "app.ts 用 piEventToSse");
wire(appLocal.includes("chatRequestSchema"), "app.ts 用 chatRequestSchema");
wire(!/\.listen\b/.test(appLocal) && !appLocal.includes("Bun.serve"), "app.ts 无 listen");
wire(!appLocal.includes("pi-coding-agent") && !appLocal.includes("@earendil-works"), "app.ts 无真包");
wire(!/\bfetch\s*\(/.test(appLocal), "app.ts 无 fetch");
wire(appLocal.includes("lookupProduct"), "app.ts 假事件含 lookupProduct");
wire(!appLocal.includes("bash"), "app.ts 不开放 bash");
wire(testLocal.includes("bun:test"), "local test 用 bun:test");
wire(testLocal.includes("piEventToSse"), "local test 含 piEventToSse");
wire(testLocal.includes("reduceChatFromSse"), "local test 含 reduceChatFromSse");
wire(testLocal.includes("Object.freeze"), "local test freeze");
wire(testLocal.includes("/chat"), "local test 打 POST /chat");
wire(!testLocal.includes("pi-coding-agent") && !testLocal.includes("@earendil-works"), "local test 不 import 真包");
wire(!testLocal.includes("demo.ts") && !testLocal.includes("./demo"), "local test 不 import demo.ts");
wire(demoLocal.includes("fetch"), "demo.ts 含 fetch 复制区");
wire(demoLocal.includes("reduceChatFromSse"), "demo.ts 含 reduceChatFromSse");
wire(demoLocal.includes("无 Key") || demoLocal.includes("不需要 API Key"), "demo.ts 注明无 Key");
wire(
  demoLocal.includes("不要把") && (demoLocal.includes("学习站") || demoLocal.includes("聊天产品")),
  "demo.ts 声明不要改学习站",
);
wire(demoLocal.includes("EventSource"), "demo.ts 提到 EventSource");
const demoWithoutStrings = demoLocal.replace(/`[\s\S]*?`/g, "").replace(/\/\*[\s\S]*?\*\//g, "");
wire(!/\bfetch\s*\(/.test(demoWithoutStrings), "demo.ts 去掉字符串后无真 fetch(");
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
const tmp = mkdtempSync(join(root, "local/m5", "ch26-verify-"));
try {
  cpSync(localDir, tmp, { recursive: true });
  const filled = `import { z } from "zod";\n\n${ch.preamble}\n\n${ch.functions
    .map((f) => solutions[f.name])
    .join("\n\n")}\n`;
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
