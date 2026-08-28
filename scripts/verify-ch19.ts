/**
 * 用标准答案跑一遍 Ch19 测试，确认生成的 JSON 与 local 能绿。
 * 运行：bun scripts/verify-ch19.ts
 */
import { spawnSync } from "node:child_process";
import { cpSync, existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import chapter from "../src/content/chapters/ch19.json";
import shared from "../src/content/shared.json";
import { runFunctionTest } from "../src/lib/tsRunner";
import type { FuncDef, Section } from "../src/types";

const solutions: Record<string, string> = {
  corsHeaders: `export function corsHeaders(origin: string, allowList: string[]): Record<string, string> {
  const acao = allowList.includes("*")
    ? "*"
    : allowList.includes(origin)
      ? origin
      : null;
  if (acao === null) return {};
  return {
    "Access-Control-Allow-Origin": acao,
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type,Authorization",
  };
}`,
  wrapError: `export function wrapError(err: unknown): { message: string } {
  if (err instanceof Error) return { message: err.message };
  if (typeof err === "string") return { message: err };
  return { message: "INTERNAL" };
}`,
  logLine: `export function logLine(method: string, path: string, status: number): string {
  return \`\${method} \${path} \${status}\`;
}`,
  authHeaderOk: `export function authHeaderOk(header: string | undefined, expectedToken: string): boolean {
  return header === \`Bearer \${expectedToken}\`;
}`,
  onErrorPayload: `export function onErrorPayload(err: unknown): { status: number; body: { error: string } } {
  const { message } = wrapError(err);
  const status = message === "UNAUTHORIZED" ? 401 : message === "FORBIDDEN" ? 403 : 500;
  return { status, body: { error: message } };
}`,
  composeMiddlewareOrder: `export function composeMiddlewareOrder(stack: string[]): string[] {
  const enter = stack.map((name) => \`\${name}>\`);
  const leave = [...stack].reverse().map((name) => \`<\${name}\`);
  return [...enter, "handler", ...leave];
}`,
};

const expectedNames = [
  "corsHeaders",
  "wrapError",
  "logLine",
  "authHeaderOk",
  "onErrorPayload",
  "composeMiddlewareOrder",
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
const localDir = join(root, "local/m4/ch19");

wire(ch.id === "ch19", `id === ch19 (got ${ch.id})`);
wire(ch.num === "19", `num === 19 (got ${ch.num})`);
wire(ch.title === "中间件、CORS、错误处理", `title (got ${ch.title})`);
wire(ch.runMode === "local", `runMode === local (got ${ch.runMode})`);
wire(ch.testName === "ch19_assignment", `testName (got ${ch.testName})`);
wire(ch.interleaved === true, "interleaved === true");
wire(ch.localHint === "bun test local/m4/ch19", `localHint (got ${ch.localHint})`);
wire(ch.tutorialMd.startsWith("# Ch19 · 中间件、CORS、错误处理"), "H1");
wire(ch.tutorialMd.includes("作业 ↔ 教程对应表"), "front matter 对应表");
wire(ch.tutorialMd.includes("Ch20"), "下一步指向 Ch20");
wire(ch.tutorialMd.includes("轻量持久化"), "下一步含轻量持久化");
wire(ch.tutorialMd.includes("Ch17"), "前置/对照含 Ch17");
wire(ch.tutorialMd.includes("```mermaid"), "至少 1 个 mermaid");
wire(ch.tutorialMd.includes("color:#1f1f1f"), "mermaid 带 color:#1f1f1f");
wire(ch.tutorialMd.includes("Filter") || ch.tutorialMd.includes("FilterChain"), "Java 对照 Filter");
wire(ch.tutorialMd.includes("@ControllerAdvice"), "Java 对照 @ControllerAdvice");
wire(ch.tutorialMd.includes("OPTIONS"), "讲 CORS 预检 OPTIONS");
wire(ch.tutorialMd.toLowerCase().includes("fastapi"), "Python 对照 FastAPI");
wire(!/drizzle/i.test(ch.tutorialMd), "教程不讲 drizzle");
wire(!/\bPi\b/.test(ch.tutorialMd) && !ch.tutorialMd.includes("@earendil"), "教程不讲 Pi");

wire(!/from\s+["']hono["']/.test(ch.assignment), 'assignment 无 from "hono"');
wire(!/from\s+["']hono["']/.test(ch.testSource), 'testSource 无 from "hono"');
wire(!/from\s+["']hono["']/.test(ch.preamble), 'preamble 无 from "hono"');
wire(!/^\s*import\s+/m.test(ch.assignment), "assignment 无 import");
wire(!/^\s*import\s+/m.test(ch.testSource), "testSource 无 import");

const homeworkBlob = `${ch.assignment}\n${ch.testSource}\n${ch.preamble}`;
wire(!/\bhono\b/i.test(homeworkBlob), "JSON 作业侧无 hono");
wire(!homeworkBlob.includes("@hono/"), "作业侧无 @hono/");

wire(ch.reviewMd.toLowerCase().includes("cors"), "闪卡含 CORS");
wire(ch.reviewMd.includes("Bearer") || ch.reviewMd.toLowerCase().includes("bearer"), "闪卡含 Bearer");
wire(ch.reviewMd.includes("401") && ch.reviewMd.includes("500"), "闪卡含 401 vs 500");
wire(ch.reviewMd.includes("洋葱") || ch.reviewMd.includes("先入后出"), "闪卡含洋葱");
wire(ch.reviewMd.toLowerCase().includes("stack"), "闪卡含不要把 stack 给客户端");

const fnNames = ch.functions.map((f) => f.name);
wire(
  expectedNames.length === fnNames.length && expectedNames.every((n, i) => n === fnNames[i]),
  `functions 顺序一致 [${fnNames.join(", ")}]`,
);

for (const f of ch.functions) {
  wire(f.testSuite === f.name, `testSuite === name (${f.name})`);
  wire(
    f.skeleton.includes(`export function ${f.name}`),
    `export function ${f.name}`,
  );
  wire(f.skeleton.includes('throw new Error("TODO")'), `${f.name} skeleton TODO`);
  wire(f.skeleton.includes("【场景】") && f.skeleton.includes("【转换点】"), `${f.name} 场景/转换点`);
  wire(ch.tutorialMd.includes("`" + f.name + "`"), `对应表含 ${f.name}`);
  wire(
    ch.sections.some((s) => s.exerciseFunctions.includes(f.name)),
    `${f.name} 挂在某节 exerciseFunctions`,
  );
}

wire(
  (ch.functions.find((f) => f.name === "onErrorPayload")?.skeleton ?? "").includes("wrapError"),
  "onErrorPayload 骨架提示调用 wrapError",
);

const secNums = ["19.1", "19.2", "19.3", "19.4", "19.5", "19.6"];
for (const n of secNums) {
  const s = ch.sections.find((x) => x.secNum === n);
  wire(!!s && s.heading.includes("§" + n), `H2 含 §${n}`);
}

wire(
  ch.sections.find((s) => s.secNum === "19.1")?.exerciseFunctions.includes("corsHeaders") === true,
  "§19.1 → corsHeaders",
);
wire(
  ch.sections.find((s) => s.secNum === "19.2")?.exerciseFunctions.includes("wrapError") === true,
  "§19.2 → wrapError",
);
wire(
  ch.sections.find((s) => s.secNum === "19.3")?.exerciseFunctions.includes("logLine") === true,
  "§19.3 → logLine",
);
wire(
  ch.sections.find((s) => s.secNum === "19.4")?.exerciseFunctions.includes("authHeaderOk") === true,
  "§19.4 → authHeaderOk",
);
wire(
  ch.sections.find((s) => s.secNum === "19.5")?.exerciseFunctions.includes("onErrorPayload") ===
    true,
  "§19.5 → onErrorPayload",
);
wire(
  ch.sections.find((s) => s.secNum === "19.6")?.exerciseFunctions.includes("composeMiddlewareOrder") ===
    true,
  "§19.6 → composeMiddlewareOrder",
);

const forbiddenMatchers = [".toThrow", ".toContain", ".toMatch", ".toBeTruthy", ".toBeFalsy"];
for (const m of forbiddenMatchers) {
  wire(!ch.testSource.includes(m), `expect 不用 ${m}`);
}

const onionSol = solutions.composeMiddlewareOrder;
wire(onionSol.includes("handler"), "composeMiddlewareOrder 答案含 handler");
wire(/\breverse\b/.test(onionSol), "composeMiddlewareOrder 答案含 reverse（洋葱退出）");
wire(hasIdentCall(solutions.onErrorPayload, "wrapError"), "onErrorPayload 答案调用 wrapError");

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
wire(appLocal.includes("app.use"), "app.ts 含 app.use");
wire(appLocal.includes("onError"), "app.ts 含 onError");
wire(!/\.listen\b/.test(appLocal) && !appLocal.includes("Bun.serve"), "app.ts 无 listen");
wire(appLocal.includes("new Hono"), "app.ts 含 new Hono");
wire(appLocal.includes("corsHeaders") && appLocal.includes("authHeaderOk"), "app.ts 调用纯函数");
wire(testLocal.includes("bun:test"), "local test 用 bun:test");
wire(testLocal.includes("app.request"), "local test 用 app.request");
wire(testLocal.includes("/health") && testLocal.includes("/admin/products"), "local test 打 health/admin");
wire(testLocal.includes("OPTIONS") || testLocal.includes("options"), "local test 含 OPTIONS");
wire(testLocal.includes("/boom"), "local test 含 /boom");

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

const tmp = mkdtempSync(join(root, "local/m4", "ch19-verify-"));
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
