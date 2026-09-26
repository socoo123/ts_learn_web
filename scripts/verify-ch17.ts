/**
 * 用标准答案跑一遍 Ch17 测试，确认生成的 JSON 能绿，
 * 并用 solutions 覆盖临时 assignment.ts 跑 bun test。
 * 运行：bun scripts/verify-ch17.ts
 */
import { spawnSync } from "node:child_process";
import { cpSync, existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import chapter from "../src/content/chapters/ch17.json";
import shared from "../src/content/shared.json";
import { runFunctionTest } from "../assets/js/runner-core.js";
import type { FuncDef, Section } from "../src/types";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const localDir = join(repoRoot, "local/m4/ch17");

const solutions: Record<string, string> = {
  parseIdParam: `export function parseIdParam(raw: string): number | null {
  if (!/^\\d+$/.test(raw)) return null;
  const n = Number(raw);
  if (!Number.isFinite(n) || n < 1) return null;
  return n;
}`,
  getProductById: `export function getProductById(products: Product[], id: number): Product | null {
  return products.find((p) => p.id === id) ?? null;
}`,
  listProducts: `export function listProducts(products: Product[]): Product[] {
  return products.slice();
}`,
  healthPayload: `export function healthPayload(): { ok: true; service: "shop-api" } {
  return { ok: true, service: "shop-api" };
}`,
  notFoundBody: `export function notFoundBody(): { error: "NOT_FOUND" } {
  return { error: "NOT_FOUND" };
}`,
  createdStatus: `export function createdStatus(): number {
  return 201;
}`,
};

const expectedNames = [
  "parseIdParam",
  "getProductById",
  "listProducts",
  "healthPayload",
  "notFoundBody",
  "createdStatus",
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

wire(ch.id === "ch17", `id === ch17 (got ${ch.id})`);
wire(ch.num === "17", `num === 17 (got ${ch.num})`);
wire(ch.title === "Hono 第一个 API", `title (got ${ch.title})`);
wire(ch.runMode === "local", `runMode === local (got ${ch.runMode})`);
wire(ch.interleaved === true, "interleaved === true");
wire(ch.localHint === "bun test local/m4/ch17", `localHint (got ${JSON.stringify(ch.localHint)})`);
wire(ch.testName === "ch17_assignment", `testName (got ${ch.testName})`);
wire(ch.tutorialMd.startsWith("# Ch17 · Hono 第一个 API"), "H1");
wire(ch.tutorialMd.includes("作业 ↔ 教程对应表"), "front matter 对应表");
wire(ch.tutorialMd.includes("Ch18"), "下一步指向 Ch18");
wire(ch.tutorialMd.includes("zod 校验路径 / 查询 / body"), "下一步含 Ch18 标题");
wire(ch.tutorialMd.includes("打开 `local/m4/ch17/assignment.ts`"), "学习路径打开 assignment.ts");
wire(ch.tutorialMd.includes("bun test local/m4/ch17"), "学习路径 bun test");
wire(ch.tutorialMd.includes("```mermaid"), "至少 1 个 mermaid");
wire(ch.tutorialMd.includes("color:#1f1f1f"), "mermaid 带 color:#1f1f1f");
wire(ch.tutorialMd.includes("@RestController"), "Java 对照 RestController");
wire(ch.tutorialMd.includes("@GetMapping"), "Java 对照 GetMapping");
wire(ch.tutorialMd.includes("@app.get"), "Python 对照 FastAPI @app.get");
wire(ch.tutorialMd.includes("new Hono()"), "Hono new Hono()");
wire(ch.tutorialMd.includes("c.json"), "Hono c.json");
wire(ch.tutorialMd.includes("c.req.param"), "Hono c.req.param");
wire(ch.tutorialMd.includes("中间件"), "不讲：点到中间件");
wire(ch.tutorialMd.includes("Ch19"), "不讲指向 Ch19");
wire(ch.tutorialMd.includes("Ch18"), "不讲指向 Ch18 zod");
wire(ch.preamble.includes("type Product"), "preamble 含 Product");

const honoImport = /from\s+["']hono["']/;
wire(!honoImport.test(ch.assignment), 'assignment 无 from "hono"');
wire(!honoImport.test(ch.testSource), 'testSource 无 from "hono"');
wire(!honoImport.test(ch.preamble), 'preamble 无 from "hono"');

const localFiles = ["assignment.ts", "app.ts", "assignment.test.ts"];
for (const f of localFiles) {
  wire(existsSync(join(localDir, f)), `local 存在 ${f}`);
}

const assignmentSrc = existsSync(join(localDir, "assignment.ts"))
  ? readFileSync(join(localDir, "assignment.ts"), "utf8")
  : "";
const appSrc = existsSync(join(localDir, "app.ts"))
  ? readFileSync(join(localDir, "app.ts"), "utf8")
  : "";
const localTestSrc = existsSync(join(localDir, "assignment.test.ts"))
  ? readFileSync(join(localDir, "assignment.test.ts"), "utf8")
  : "";

const exportFns = assignmentSrc.match(/export function \w+/g) ?? [];
wire(exportFns.length === 6, `assignment.ts 6 个 export function (got ${exportFns.length})`);
for (const n of expectedNames) {
  wire(assignmentSrc.includes(`export function ${n}`), `assignment.ts export function ${n}`);
}
wire(assignmentSrc.includes('throw new Error("TODO")'), "assignment.ts 含 TODO");

wire(appSrc.includes("new Hono"), "app.ts new Hono");
wire(appSrc.includes("/health"), "app.ts /health");
wire(appSrc.includes("/products/:id"), "app.ts /products/:id");
wire(!/\blisten\b/.test(appSrc), "app.ts 无 listen");
wire(localTestSrc.includes("app.request"), "local 测试用 app.request");
wire(!/\blisten\b/.test(localTestSrc), "local 测试无 listen");
wire(localTestSrc.includes('from "bun:test"'), "local 测试 bun:test");
wire(localTestSrc.includes("12abc"), 'local 测试含 "12abc"');
wire(localTestSrc.includes('"0"'), 'local 测试含 "0"');
wire(localTestSrc.includes("/products/1"), "local HTTP /products/1");
wire(localTestSrc.includes("/products/99"), "local HTTP /products/99");
wire(localTestSrc.includes("/products/abc"), "local HTTP /products/abc");
wire(localTestSrc.includes('method: "POST"') || localTestSrc.includes("method: 'POST'"), "local HTTP POST");

wire(ch.reviewMd.toLowerCase().includes("hono"), "闪卡含 Hono");
wire(ch.reviewMd.includes("param") || ch.reviewMd.includes("字符串"), "闪卡含 param/字符串");
wire(ch.reviewMd.includes("NOT_FOUND") || ch.reviewMd.includes("404"), "闪卡含 404 JSON");
wire(ch.reviewMd.includes("201"), "闪卡含 201");
wire(ch.reviewMd.includes("纯函数"), "闪卡含纯函数");
wire(ch.reviewMd.includes("listen"), "闪卡含禁止 listen");

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

const secNums = ["17.1", "17.2", "17.3", "17.4", "17.5", "17.6"];
for (const n of secNums) {
  const s = ch.sections.find((x) => x.secNum === n);
  wire(!!s && s.heading.includes("§" + n), `H2 含 §${n}`);
}

wire(
  ch.sections.find((s) => s.secNum === "17.1")?.exerciseFunctions.includes("parseIdParam") === true,
  "§17.1 → parseIdParam",
);
wire(
  ch.sections.find((s) => s.secNum === "17.2")?.exerciseFunctions.includes("getProductById") === true,
  "§17.2 → getProductById",
);
wire(
  ch.sections.find((s) => s.secNum === "17.3")?.exerciseFunctions.includes("listProducts") === true,
  "§17.3 → listProducts",
);
wire(
  ch.sections.find((s) => s.secNum === "17.4")?.exerciseFunctions.includes("healthPayload") === true,
  "§17.4 → healthPayload",
);
wire(
  ch.sections.find((s) => s.secNum === "17.5")?.exerciseFunctions.includes("notFoundBody") === true,
  "§17.5 → notFoundBody",
);
wire(
  ch.sections.find((s) => s.secNum === "17.6")?.exerciseFunctions.includes("createdStatus") === true,
  "§17.6 → createdStatus",
);

wire(ch.testSource.includes("12abc"), 'JSON 测试含 "12abc"');
wire(ch.testSource.includes("parseIdParam(\"0\")") || ch.testSource.includes('parseIdParam("0")'), 'JSON 测试含 "0"');
wire(ch.testSource.includes("CP-009"), "JSON 测试含 CP-009");
wire(ch.testSource.includes("KB-001"), "JSON 测试含 KB-001");

const forbiddenMatchers = [".toThrow", ".toContain", ".toMatch", ".toBeTruthy", ".toBeFalsy"];
for (const m of forbiddenMatchers) {
  wire(!ch.testSource.includes(m), `expect 不用 ${m}`);
}

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

const studentTodo = assignmentSrc.includes('throw new Error("TODO")');
const tmpDir = mkdtempSync(join(repoRoot, "local/m4", "ch17-verify-"));
try {
  cpSync(localDir, tmpDir, { recursive: true });
  const solved = `${ch.preamble}\n\n${expectedNames.map((n) => solutions[n]).join("\n\n")}\n`;
  writeFileSync(join(tmpDir, "assignment.ts"), solved);
  const r = spawnSync("bun", ["test", join(tmpDir, "assignment.test.ts")], {
    encoding: "utf8",
    cwd: repoRoot,
  });
  const bunOut = `${r.stdout ?? ""}\n${r.stderr ?? ""}`.replace(/\x1b\[[0-9;]*m/g, "");
  const bunOk = r.status === 0;
  console.log(bunOk ? "PASS temp bun test" : "FAIL temp bun test");
  if (!bunOk) {
    console.log(bunOut);
    failed++;
  } else {
    const tail = bunOut.trim().split("\n").slice(-4);
    for (const ln of tail) console.log("  ", ln);
  }
} finally {
  rmSync(tmpDir, { recursive: true, force: true });
}

const stillTodo = readFileSync(join(localDir, "assignment.ts"), "utf8").includes(
  'throw new Error("TODO")',
);
wire(studentTodo && stillTodo, "临时 bun test 未改学生 TODO");
if (!stillTodo) failed++;

if (failed || wiringFailed) {
  console.error(`\nverify failed`);
  process.exit(1);
}
console.log("\nall green");
