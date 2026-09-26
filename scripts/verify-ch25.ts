/**
 * 用标准答案跑一遍 Ch25 测试，确认生成的 JSON 与 local 能绿。
 * 运行：bun scripts/verify-ch25.ts
 */
import { spawnSync } from "node:child_process";
import { cpSync, existsSync, mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import chapter from "../src/content/chapters/ch25.json";
import shared from "../src/content/shared.json";
import { runFunctionTest } from "../assets/js/runner-core.js";
import type { FuncDef, Section } from "../src/types";

const solutions: Record<string, string> = {
  sessionConfig: `export function sessionConfig(hasKey: boolean): ShopSessionConfig {
  return {
    systemPrompt: SHOP_SYSTEM_PROMPT,
    tools: ["lookupProduct", "calcLineTotal"],
    memory: "inMemory",
    hasKey,
  };
}`,
  pickMemoryManager: `export function pickMemoryManager(kind: MemoryKind): string {
  if (kind === "inMemory") return "SessionManager.inMemory()";
  return "SessionManager.create";
}`,
  createShopSession: `export function createShopSession(hasKey: boolean): ShopSession {
  return { config: sessionConfig(hasKey), disposed: false, logs: [] };
}`,
  subscribeToLog: `export function subscribeToLog(session: ShopSession, line: string): ShopSession {
  if (session.disposed) {
    return { config: session.config, disposed: true, logs: session.logs.slice() };
  }
  return { config: session.config, disposed: false, logs: [...session.logs, line] };
}`,
  disposeSafe: `export function disposeSafe(session: ShopSession): ShopSession {
  return { config: session.config, disposed: true, logs: session.logs.slice() };
}`,
  steerNote: `export function steerNote(currentDraft: string, steerText: string): string {
  if (steerText.trim() === "") return currentDraft;
  return steerText;
}`,
};

const expectedNames = [
  "sessionConfig",
  "pickMemoryManager",
  "createShopSession",
  "subscribeToLog",
  "disposeSafe",
  "steerNote",
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
const localDir = join(root, "local/m5/ch25");

wire(ch.id === "ch25", `id === ch25 (got ${ch.id})`);
wire(ch.num === "25", `num === 25 (got ${ch.num})`);
wire(ch.title === "createAgentSession", `title (got ${ch.title})`);
wire(ch.runMode === "local", `runMode === local (got ${ch.runMode})`);
wire(ch.testName === "ch25_assignment", `testName (got ${ch.testName})`);
wire(ch.interleaved === true, "interleaved === true");
wire(ch.localHint === "bun test local/m5/ch25", `localHint (got ${ch.localHint})`);
wire(ch.tutorialMd.startsWith("# Ch25 · createAgentSession"), "H1");
wire(ch.tutorialMd.includes("作业 ↔ 教程对应表"), "front matter 对应表");
wire(ch.tutorialMd.includes("Ch26"), "下一步指向 Ch26");
wire(ch.tutorialMd.includes("打通：Hono + SSE + React 数据协议"), "下一步含 Ch26 标题");
wire(ch.tutorialMd.includes("```mermaid"), "至少 1 个 mermaid");
wire(ch.tutorialMd.includes("color:#1f1f1f"), "mermaid 带 color:#1f1f1f");
wire(ch.tutorialMd.includes("createAgentSession"), "教程含 createAgentSession");
wire(ch.tutorialMd.includes("SessionManager.inMemory"), "教程含 SessionManager.inMemory");
wire(ch.tutorialMd.includes("prompt"), "教程含 prompt");
wire(ch.tutorialMd.includes("steer"), "教程含 steer");
wire(ch.tutorialMd.includes("dispose"), "教程含 dispose");
wire(ch.tutorialMd.includes("CLI") && ch.tutorialMd.includes("SDK") && ch.tutorialMd.includes("同一套"), "CLI 与 SDK 同一套");
wire(
  ch.tutorialMd.includes("无 Key") || ch.tutorialMd.includes("没有") && ch.tutorialMd.includes("Key"),
  "教程含无 Key skip",
);
wire(ch.tutorialMd.includes("@earendil-works/pi-coding-agent"), "教程含 @earendil-works/pi-coding-agent");
wire(
  !ch.tutorialMd.includes("bun add @mariozechner") &&
    !ch.tutorialMd.includes("npm install @mariozechner"),
  "不教安装过时 @mariozechner",
);
wire(
  ch.tutorialMd.includes("try-with-resources") || ch.tutorialMd.includes("AutoCloseable"),
  "Java 对照 try-with-resources / AutoCloseable",
);
wire(
  ch.tutorialMd.includes("with") &&
    (ch.tutorialMd.includes("context manager") ||
      ch.tutorialMd.includes("__exit__") ||
      ch.tutorialMd.includes("上下文")),
  "Python 对照 context manager",
);
wire(ch.tutorialMd.includes("lookupProduct") && ch.tutorialMd.includes("calcLineTotal"), "教程含商品工具白名单");
wire(ch.tutorialMd.includes("bash"), "教程提到禁止 bash");
wire(
  ch.tutorialMd.includes("不讲") && (ch.tutorialMd.includes("RAG") || ch.tutorialMd.includes("Hono")),
  "教程声明不讲 Hono/RAG 等",
);

const homeworkBlob = `${ch.assignment}\n${ch.testSource}\n${ch.preamble}`;
wire(!/^\s*import\s+/m.test(ch.assignment), "assignment 无 import");
wire(!/^\s*import\s+/m.test(ch.testSource), "testSource 无 import");
wire(!/^\s*import\s+/m.test(ch.preamble), "preamble 无 import");
wire(!/\bhono\b/i.test(homeworkBlob), "JSON 作业侧无 hono");
wire(!homeworkBlob.includes("@earendil-works"), "JSON 作业侧无 @earendil-works");
wire(!homeworkBlob.includes("pi-coding-agent"), "JSON 作业侧无 pi-coding-agent");
wire(!/\bfetch\s*\(/.test(homeworkBlob), "JSON 作业侧无 fetch(");
wire(!/\bsetTimeout\s*\(/.test(homeworkBlob), "JSON 作业侧无 setTimeout(");

wire(ch.preamble.includes("SHOP_SYSTEM_PROMPT"), "preamble 含 SHOP_SYSTEM_PROMPT");
wire(
  ch.preamble.includes("你是商品助手。只用 lookupProduct 和 calcLineTotal。禁止 bash 和写文件。"),
  "preamble 系统提示原文",
);
wire(ch.preamble.includes('type MemoryKind = "inMemory" | "file"'), "preamble 含 MemoryKind");
wire(ch.preamble.includes("type ShopSessionConfig"), "preamble 含 ShopSessionConfig");
wire(ch.preamble.includes("type ShopSession"), "preamble 含 ShopSession");

wire(ch.reviewMd.includes("inMemory") && ch.reviewMd.includes("create"), "闪卡含 inMemory vs create");
wire(ch.reviewMd.includes("prompt") && ch.reviewMd.includes("steer"), "闪卡含 prompt vs steer");
wire(ch.reviewMd.includes("dispose"), "闪卡含 dispose");
wire(ch.reviewMd.includes("lookupProduct") || ch.reviewMd.includes("白名单"), "闪卡含 tools 白名单");
wire(ch.reviewMd.includes("Key"), "闪卡含无 Key");
wire(ch.reviewMd.includes("subscribeToLog") || ch.reviewMd.includes("mutate") || ch.reviewMd.includes("push"), "闪卡含 subscribeToLog 不 mutate");

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
  (ch.functions.find((f) => f.name === "createShopSession")?.skeleton ?? "").includes("sessionConfig"),
  "createShopSession 骨架提示调用 sessionConfig",
);

const secNums = ["25.1", "25.2", "25.3", "25.4", "25.5", "25.6"];
for (const n of secNums) {
  const s = ch.sections.find((x) => x.secNum === n);
  wire(!!s && s.heading.includes("§" + n), `H2 含 §${n}`);
}

wire(
  ch.sections.find((s) => s.secNum === "25.1")?.exerciseFunctions.includes("sessionConfig") === true,
  "§25.1 → sessionConfig",
);
wire(
  ch.sections.find((s) => s.secNum === "25.2")?.exerciseFunctions.includes("pickMemoryManager") === true,
  "§25.2 → pickMemoryManager",
);
wire(
  ch.sections.find((s) => s.secNum === "25.3")?.exerciseFunctions.includes("createShopSession") === true,
  "§25.3 → createShopSession",
);
wire(
  ch.sections.find((s) => s.secNum === "25.4")?.exerciseFunctions.includes("subscribeToLog") === true,
  "§25.4 → subscribeToLog",
);
wire(
  ch.sections.find((s) => s.secNum === "25.5")?.exerciseFunctions.includes("disposeSafe") === true,
  "§25.5 → disposeSafe",
);
wire(
  ch.sections.find((s) => s.secNum === "25.6")?.exerciseFunctions.includes("steerNote") === true,
  "§25.6 → steerNote",
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
wire(ch.testSource.includes("lookupProduct") && ch.testSource.includes("calcLineTotal"), "JSON 测试含 tools 白名单");
wire(ch.testSource.includes("SHOP_SYSTEM_PROMPT"), "JSON 测试含 SHOP_SYSTEM_PROMPT");
wire(ch.testSource.includes("bash"), "JSON 测试检查不含 bash");

wire(hasIdentCall(solutions.createShopSession, "sessionConfig"), "createShopSession 答案调用 sessionConfig");

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
wire(!assignmentLocal.includes("pi-coding-agent"), "local assignment 无 pi-coding-agent");
wire(!assignmentLocal.includes("@earendil-works"), "local assignment 无 @earendil-works");
wire(assignmentLocal.includes("SHOP_SYSTEM_PROMPT"), "local assignment 含 SHOP_SYSTEM_PROMPT");
wire(appLocal.includes("fakeKeylessRuntime"), "app.ts 含 fakeKeylessRuntime");
wire(appLocal.includes("describeShopSession"), "app.ts 含 describeShopSession");
wire(!/\.listen\b/.test(appLocal) && !appLocal.includes("Bun.serve"), "app.ts 无 listen");
wire(!appLocal.includes("pi-coding-agent") && !appLocal.includes("@earendil-works"), "app.ts 无真包");
wire(!/\bfetch\s*\(/.test(appLocal), "app.ts 无 fetch");
wire(!/\bhono\b/i.test(appLocal), "app.ts 无 hono");
wire(testLocal.includes("bun:test"), "local test 用 bun:test");
wire(testLocal.includes("createShopSession"), "local test 含 createShopSession");
wire(testLocal.includes("subscribeToLog"), "local test 含 subscribeToLog");
wire(testLocal.includes("disposeSafe"), "local test 含 disposeSafe");
wire(testLocal.includes("steerNote"), "local test 含 steerNote");
wire(testLocal.includes("Object.freeze"), "local test freeze");
wire(!testLocal.includes("pi-coding-agent") && !testLocal.includes("@earendil-works"), "local test 不 import 真包");
wire(!testLocal.includes("demo.ts") && !testLocal.includes("./demo"), "local test 不 import demo.ts");
wire(demoLocal.includes("@earendil-works/pi-coding-agent"), "demo.ts 含真包名");
wire(demoLocal.includes("createAgentSession"), "demo.ts 含 createAgentSession");
wire(demoLocal.includes("SessionManager.inMemory"), "demo.ts 含 SessionManager.inMemory");
wire(demoLocal.includes("session.prompt"), "demo.ts 含 session.prompt");
wire(demoLocal.includes("session.steer"), "demo.ts 含 session.steer");
wire(demoLocal.includes("session.dispose"), "demo.ts 含 session.dispose");
wire(demoLocal.includes("无 Key") || demoLocal.includes("不要跑"), "demo.ts 注明无 Key 不要跑");
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
const tmp = mkdtempSync(join(root, "local/m5", "ch25-verify-"));
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
