/**
 * 用标准答案跑一遍 Ch18 测试，确认生成的 JSON 能绿，local bun test 也能绿。
 * 运行：bun scripts/verify-ch18.ts
 */
import { cpSync, existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import chapter from "../src/content/chapters/ch18.json";
import shared from "../src/content/shared.json";
import { runFunctionTest } from "../assets/js/runner-core.js";
import type { FuncDef, Section } from "../src/types";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const localDir = join(root, "local/m4/ch18");

const solutions: Record<string, string> = {
  parseIdParam: `export function parseIdParam(raw: string): number | null {
  const schema = z
    .string()
    .regex(/^\\d+$/)
    .transform(Number)
    .pipe(z.number().int().min(1));
  const r = schema.safeParse(raw);
  return r.success ? r.data : null;
}`,
  parseSearchQuery: `export function parseSearchQuery(input: Record<string, unknown>): SearchQuery | null {
  const schema = z.object({
    q: z.string().trim().min(1),
    limit: z
      .union([
        z.number().int().min(1).max(100),
        z.string().regex(/^\\d+$/).transform(Number).pipe(z.number().int().min(1).max(100)),
      ])
      .optional()
      .default(10),
  });
  const r = schema.safeParse(input);
  return r.success ? r.data : null;
}`,
  parseCreateBody: `export function parseCreateBody(input: unknown): CreateBody | null {
  const schema = z.object({
    name: z.string().trim().min(1),
    price: z.number().gt(0),
    sku: z.string().regex(/^[A-Z]{2}-\\d{3}$/),
    stock: z.number().int().min(0),
  });
  const r = schema.safeParse(input);
  return r.success ? r.data : null;
}`,
  errorToJson: `export function errorToJson(issues: Array<{ path: (string | number)[] }>): ValidationFail {
  const fields: string[] = [];
  for (const issue of issues) {
    const key = issue.path.map(String).join(".");
    if (!fields.includes(key)) fields.push(key);
  }
  return { error: "VALIDATION", fields };
}`,
  validateOr400: `export function validateOr400<T>(
  parsed:
    | { success: true; data: T }
    | { success: false; error: { issues: Array<{ path: (string | number)[] }> } },
): { status: 200; data: T } | { status: 400; body: ValidationFail } {
  if (parsed.success) return { status: 200, data: parsed.data };
  return { status: 400, body: errorToJson(parsed.error.issues) };
}`,
  patchBody: `export function patchBody(current: CreateBody, patch: unknown): CreateBody | null {
  if (patch === null || typeof patch !== "object" || Array.isArray(patch)) return null;
  return parseCreateBody({ ...current, ...patch });
}`,
};

const expectedNames = [
  "parseIdParam",
  "parseSearchQuery",
  "parseCreateBody",
  "errorToJson",
  "validateOr400",
  "patchBody",
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

wire(ch.id === "ch18", `id === ch18 (got ${ch.id})`);
wire(ch.num === "18", `num === 18 (got ${ch.num})`);
wire(ch.title === "zod 校验路径 / 查询 / body", `title (got ${ch.title})`);
wire(ch.runMode === "local", `runMode === local (got ${ch.runMode})`);
wire(ch.localHint === "bun test local/m4/ch18", `localHint (got ${ch.localHint})`);
wire(ch.testName === "ch18_assignment", `testName (got ${ch.testName})`);
wire(ch.interleaved === true, "interleaved === true");
wire(ch.tutorialMd.startsWith("# Ch18 · zod 校验路径 / 查询 / body"), "H1");
wire(ch.tutorialMd.includes("作业 ↔ 教程对应表"), "front matter 对应表");
wire(ch.tutorialMd.includes("Ch19"), "下一步指向 Ch19");
wire(ch.tutorialMd.includes("中间件、CORS、错误处理"), "下一步含中间件标题");
wire(ch.tutorialMd.includes("```mermaid"), "至少 1 个 mermaid");
wire(ch.tutorialMd.includes("color:#1f1f1f"), "mermaid 带 color:#1f1f1f");
wire(ch.tutorialMd.includes("Pydantic"), "对照 Pydantic");
wire(
  ch.tutorialMd.includes("Bean Validation") || ch.tutorialMd.includes("Jakarta"),
  "对照 Bean Validation / Jakarta",
);
wire(ch.tutorialMd.includes("Ch07"), "连上 Ch07");
wire(ch.tutorialMd.includes("parseIdParam"), "教程出现 parseIdParam");
wire(ch.tutorialMd.includes("c.req.param"), "❌ 信 param 当 number");
wire(!ch.tutorialMd.includes("drizzle"), "不讲 drizzle");
wire(ch.tutorialMd.includes("local/m4/ch18"), "学习路径含 local 路径");

wire(ch.preamble.includes("type SearchQuery"), "preamble 含 SearchQuery");
wire(ch.preamble.includes("type CreateBody"), "preamble 含 CreateBody");
wire(ch.preamble.includes("type ValidationFail"), "preamble 含 ValidationFail");

wire(!/from\s+["']hono["']/.test(ch.assignment), 'JSON assignment 无 from "hono"');
wire(!/from\s+["']hono["']/.test(ch.testSource), 'JSON testSource 无 from "hono"');
wire(!/^\s*import\s*\{\s*z\s*\}\s*from\s*["']zod["']/m.test(ch.assignment), "JSON assignment 无 import { z }");
wire(!/^\s*import\s*\{\s*z\s*\}\s*from\s*["']zod["']/m.test(ch.testSource), "JSON testSource 无 import { z }");
wire(!/^\s*import\s+/m.test(ch.assignment), "JSON assignment 无 import");
wire(!/^\s*import\s+/m.test(ch.testSource), "JSON testSource 无 import");

const forbiddenMatchers = [".toThrow", ".toContain", ".toMatch", ".toBeTruthy", ".toBeFalsy"];
for (const m of forbiddenMatchers) {
  wire(!ch.testSource.includes(m), `JSON expect 不用 ${m}`);
}

wire(solutions.parseIdParam.includes("z."), "solutions.parseIdParam 真正用 z.");
wire(solutions.parseCreateBody.includes("z."), "solutions.parseCreateBody 真正用 z.");
wire(solutions.validateOr400.includes("errorToJson"), "solutions.validateOr400 调用 errorToJson");
wire(solutions.patchBody.includes("parseCreateBody"), "solutions.patchBody 调用 parseCreateBody");

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

const secNums = ["18.1", "18.2", "18.3", "18.4", "18.5", "18.6"];
for (const n of secNums) {
  const s = ch.sections.find((x) => x.secNum === n);
  wire(!!s && s.heading.includes("§" + n), `H2 含 §${n}`);
}

wire(
  ch.sections.find((s) => s.secNum === "18.1")?.exerciseFunctions.includes("parseIdParam") === true,
  "§18.1 → parseIdParam",
);
wire(
  ch.sections.find((s) => s.secNum === "18.2")?.exerciseFunctions.includes("parseSearchQuery") ===
    true,
  "§18.2 → parseSearchQuery",
);
wire(
  ch.sections.find((s) => s.secNum === "18.3")?.exerciseFunctions.includes("parseCreateBody") ===
    true,
  "§18.3 → parseCreateBody",
);
wire(
  ch.sections.find((s) => s.secNum === "18.4")?.exerciseFunctions.includes("errorToJson") === true,
  "§18.4 → errorToJson",
);
wire(
  ch.sections.find((s) => s.secNum === "18.5")?.exerciseFunctions.includes("validateOr400") === true,
  "§18.5 → validateOr400",
);
wire(
  ch.sections.find((s) => s.secNum === "18.6")?.exerciseFunctions.includes("patchBody") === true,
  "§18.6 → patchBody",
);

wire(ch.reviewMd.toLowerCase().includes("string"), "闪卡含 path 是 string");
wire(ch.reviewMd.includes("400") && ch.reviewMd.includes("404"), "闪卡含 400 vs 404");
wire(ch.reviewMd.toLowerCase().includes("safeparse"), "闪卡含 safeParse");
wire(ch.reviewMd.toLowerCase().includes("sku"), "闪卡含 sku 正则");
wire(ch.reviewMd.toLowerCase().includes("patch"), "闪卡含 patch 再校验");

const localFiles = ["assignment.ts", "app.ts", "assignment.test.ts"];
for (const name of localFiles) {
  wire(existsSync(join(localDir, name)), `local 文件存在 ${name}`);
}

const assignmentSrc = existsSync(join(localDir, "assignment.ts"))
  ? readFileSync(join(localDir, "assignment.ts"), "utf8")
  : "";
const appSrc = existsSync(join(localDir, "app.ts"))
  ? readFileSync(join(localDir, "app.ts"), "utf8")
  : "";
const testSrc = existsSync(join(localDir, "assignment.test.ts"))
  ? readFileSync(join(localDir, "assignment.test.ts"), "utf8")
  : "";

wire(/from\s+["']zod["']/.test(assignmentSrc), "local assignment.ts import zod");
wire(!/from\s+["']hono["']/.test(assignmentSrc), "local assignment.ts 无 import hono");
for (const n of expectedNames) {
  wire(assignmentSrc.includes(`export function ${n}`), `local assignment 导出 ${n}`);
}
wire(assignmentSrc.includes('throw new Error("TODO")'), "local assignment.ts 仍是 TODO");
wire((assignmentSrc.match(/throw new Error\("TODO"\)/g) ?? []).length >= 6, "local 6 个 TODO");

wire(appSrc.includes("new Hono"), "app.ts 含 new Hono");
wire(appSrc.includes("/products/:id"), "app.ts 含 /products/:id");
wire(appSrc.includes("/search"), "app.ts 含 /search");
wire(appSrc.includes("await c.req.json()"), "app.ts POST/PATCH 用 await c.req.json()");
wire(!/\.listen\s*\(/.test(appSrc) && !appSrc.includes("app.listen"), "app.ts 无 listen");
wire(testSrc.includes("bun:test"), "local test 用 bun:test");
wire(testSrc.includes("app.request"), "local test 用 app.request");

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

const tmp = mkdtempSync(join(root, "local/m4", ".verify-ch18-"));
try {
  cpSync(localDir, tmp, { recursive: true });
  const localSolved = `import { z } from "zod";

export type SearchQuery = { q: string; limit: number };
export type CreateBody = { name: string; price: number; sku: string; stock: number };
export type ValidationFail = { error: "VALIDATION"; fields: string[] };

${expectedNames.map((n) => solutions[n]).join("\n\n")}
`;
  writeFileSync(join(tmp, "assignment.ts"), localSolved);
  const r = spawnSync("bun", ["test", join(tmp, "assignment.test.ts")], {
    encoding: "utf8",
    cwd: root,
  });
  const bunOk = r.status === 0;
  console.log(bunOk ? "PASS tmp bun test" : `FAIL tmp bun test\n${r.stdout}\n${r.stderr}`);
  if (!bunOk) failed++;
} finally {
  rmSync(tmp, { recursive: true, force: true });
}

const stillTodo = readFileSync(join(localDir, "assignment.ts"), "utf8");
if (!stillTodo.includes('throw new Error("TODO")')) {
  console.error("student assignment.ts was mutated (TODO missing)");
  process.exit(1);
}

if (failed) {
  console.error(`\n${failed} suite(s) failed`);
  process.exit(1);
}
console.log("\nall green");
