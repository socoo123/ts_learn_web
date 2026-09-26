/**
 * 用标准答案跑一遍 Ch20 测试，确认生成的 JSON 与 local 能绿。
 * 运行：bun scripts/verify-ch20.ts
 */
import { spawnSync } from "node:child_process";
import { cpSync, existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import chapter from "../src/content/chapters/ch20.json";
import shared from "../src/content/shared.json";
import { runFunctionTest } from "../assets/js/runner-core.js";
import type { FuncDef, Section } from "../src/types";

const solutions: Record<string, string> = {
  toRow: `export function toRow(p: Product): ProductRow {
  return {
    id: p.id,
    name: p.name,
    category: p.category,
    price: p.price,
    stock: p.stock,
    sku: p.sku,
  };
}`,
  fromRow: `export function fromRow(row: unknown): Product | null {
  if (row === null || typeof row !== "object" || Array.isArray(row)) return null;
  const r = row as Record<string, unknown>;
  const { id, name, category, price, stock, sku } = r;
  if (typeof id !== "number" || !Number.isInteger(id) || id < 1) return null;
  if (typeof name !== "string" || name.length === 0) return null;
  if (typeof category !== "string" || category.length === 0) return null;
  if (typeof sku !== "string" || sku.length === 0) return null;
  if (typeof price !== "number" || !Number.isFinite(price) || price < 0) return null;
  if (typeof stock !== "number" || !Number.isInteger(stock) || stock < 0) return null;
  return { id, name, category, price, stock, sku };
}`,
  listInStockSql: `export function listInStockSql(): string {
  return "SELECT id, name, category, price, stock, sku FROM products WHERE stock > 0 ORDER BY id ASC";
}`,
  insertProductInput: `export function insertProductInput(raw: unknown): InsertOk | InsertErr {
  if (raw === null || typeof raw !== "object" || Array.isArray(raw)) {
    return { ok: false, error: "SHAPE" };
  }
  const o = raw as Record<string, unknown>;
  if (!("name" in o) || !("category" in o) || !("price" in o) || !("stock" in o) || !("sku" in o)) {
    return { ok: false, error: "SHAPE" };
  }
  const { name, category, price, stock, sku } = o;
  if (typeof sku !== "string" || !/^[A-Z]{2}-\\d{3}$/.test(sku)) {
    return { ok: false, error: "SKU" };
  }
  if (typeof name !== "string" || name.trim() === "") {
    return { ok: false, error: "NAME" };
  }
  if (typeof category !== "string" || category.trim() === "") {
    return { ok: false, error: "CATEGORY" };
  }
  if (typeof price !== "number" || !Number.isFinite(price) || price < 0) {
    return { ok: false, error: "PRICE" };
  }
  if (typeof stock !== "number" || !Number.isInteger(stock) || stock < 0) {
    return { ok: false, error: "STOCK" };
  }
  return {
    ok: true,
    value: { name: name.trim(), category: category.trim(), price, stock, sku },
  };
}`,
  updateStock: `export function updateStock(current: number, delta: number): number | null {
  if (typeof current !== "number" || !Number.isInteger(current) || current < 0) return null;
  if (typeof delta !== "number" || !Number.isInteger(delta)) return null;
  const next = current + delta;
  return next < 0 ? null : next;
}`,
  deleteBySku: `export function deleteBySku(_sku: string): string {
  return "DELETE FROM products WHERE sku = ?";
}`,
};

const expectedNames = [
  "toRow",
  "fromRow",
  "listInStockSql",
  "insertProductInput",
  "updateStock",
  "deleteBySku",
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
const localDir = join(root, "local/m4/ch20");

wire(ch.id === "ch20", `id === ch20 (got ${ch.id})`);
wire(ch.num === "20", `num === 20 (got ${ch.num})`);
wire(ch.title === "轻量持久化", `title (got ${ch.title})`);
wire(ch.runMode === "local", `runMode === local (got ${ch.runMode})`);
wire(ch.testName === "ch20_assignment", `testName (got ${ch.testName})`);
wire(ch.interleaved === true, "interleaved === true");
wire(ch.localHint === "bun test local/m4/ch20", `localHint (got ${ch.localHint})`);
wire(ch.tutorialMd.startsWith("# Ch20 · 轻量持久化"), "H1");
wire(ch.tutorialMd.includes("作业 ↔ 教程对应表"), "front matter 对应表");
wire(ch.tutorialMd.includes("Ch21"), "下一步指向 Ch21");
wire(ch.tutorialMd.includes("SSE 流式响应"), "下一步含 SSE 流式响应");
wire(ch.tutorialMd.includes("```mermaid"), "至少 1 个 mermaid");
wire(ch.tutorialMd.includes("color:#1f1f1f"), "mermaid 带 color:#1f1f1f");
wire(ch.tutorialMd.includes("JPA") || ch.tutorialMd.includes("@Entity"), "Java 对照 JPA");
wire(ch.tutorialMd.includes("ResultSet") || ch.tutorialMd.includes("JDBC"), "Java 对照 JDBC");
wire(
  ch.tutorialMd.includes("SQLAlchemy") &&
    (ch.tutorialMd.includes("sqlite3") || ch.tutorialMd.toLowerCase().includes("sqlite")),
  "Python 对照 SQLAlchemy / sqlite",
);
wire(/drizzle/i.test(ch.tutorialMd) && ch.tutorialMd.includes("sqliteTable"), "教程讲 drizzle sqliteTable");
wire(!/\bPi\b/.test(ch.tutorialMd) && !ch.tutorialMd.includes("@earendil"), "教程不讲 Pi");

wire(!/from\s+["']hono["']/.test(ch.assignment), 'assignment 无 from "hono"');
wire(!/from\s+["']hono["']/.test(ch.testSource), 'testSource 无 from "hono"');
wire(!/from\s+["']hono["']/.test(ch.preamble), 'preamble 无 from "hono"');
wire(!/^\s*import\s+/m.test(ch.assignment), "assignment 无 import");
wire(!/^\s*import\s+/m.test(ch.testSource), "testSource 无 import");

const homeworkBlob = `${ch.assignment}\n${ch.testSource}\n${ch.preamble}`;
wire(!/\bhono\b/i.test(homeworkBlob), "JSON 作业侧无 hono");
wire(!homeworkBlob.includes("drizzle-orm"), "JSON 作业侧无 drizzle-orm");
wire(!homeworkBlob.includes("bun:sqlite"), "JSON 作业侧无 bun:sqlite");
wire(!homeworkBlob.includes("better-sqlite3"), "JSON 作业侧无 better-sqlite3");
wire(!homeworkBlob.includes("node:fs"), "JSON 作业侧无 node:fs");

wire(ch.reviewMd.includes("unknown") || ch.reviewMd.includes("蒸发"), "闪卡含类型蒸发");
wire(ch.reviewMd.includes("stock > 0") || ch.reviewMd.includes("CP-009"), "闪卡含在库 SQL / CP-009");
wire(ch.reviewMd.includes("?") && ch.reviewMd.toLowerCase().includes("drop"), "闪卡含占位与注入");
wire(ch.reviewMd.includes("SHAPE") && ch.reviewMd.includes("SKU"), "闪卡含校验顺序");

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

const secNums = ["20.1", "20.2", "20.3", "20.4", "20.5", "20.6"];
for (const n of secNums) {
  const s = ch.sections.find((x) => x.secNum === n);
  wire(!!s && s.heading.includes("§" + n), `H2 含 §${n}`);
}

wire(
  ch.sections.find((s) => s.secNum === "20.1")?.exerciseFunctions.includes("toRow") === true,
  "§20.1 → toRow",
);
wire(
  ch.sections.find((s) => s.secNum === "20.2")?.exerciseFunctions.includes("fromRow") === true,
  "§20.2 → fromRow",
);
wire(
  ch.sections.find((s) => s.secNum === "20.3")?.exerciseFunctions.includes("listInStockSql") === true,
  "§20.3 → listInStockSql",
);
wire(
  ch.sections.find((s) => s.secNum === "20.4")?.exerciseFunctions.includes("insertProductInput") ===
    true,
  "§20.4 → insertProductInput",
);
wire(
  ch.sections.find((s) => s.secNum === "20.5")?.exerciseFunctions.includes("updateStock") === true,
  "§20.5 → updateStock",
);
wire(
  ch.sections.find((s) => s.secNum === "20.6")?.exerciseFunctions.includes("deleteBySku") === true,
  "§20.6 → deleteBySku",
);

const forbiddenMatchers = [".toThrow", ".toContain", ".toMatch", ".toBeTruthy", ".toBeFalsy"];
for (const m of forbiddenMatchers) {
  wire(!ch.testSource.includes(m), `expect 不用 ${m}`);
}

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
wire(!assignmentLocal.includes("bun:sqlite"), "local assignment 无 bun:sqlite");
wire(appLocal.includes("bun:sqlite"), "app.ts 用 bun:sqlite");
wire(appLocal.includes(":memory:"), "app.ts 用 :memory:");
wire(appLocal.includes("CREATE TABLE"), "app.ts CREATE TABLE");
wire(!/\.listen\b/.test(appLocal) && !appLocal.includes("Bun.serve"), "app.ts 无 listen");
wire(appLocal.includes("new Hono"), "app.ts 含 new Hono");
wire(
  expectedNames.every((n) => appLocal.includes(n)),
  "app.ts 调用全部纯函数",
);
wire(testLocal.includes("bun:test"), "local test 用 bun:test");
wire(testLocal.includes("app.request"), "local test 用 app.request");
wire(testLocal.includes("CP-009"), "local test 含 CP-009");
wire(testLocal.includes("DROP TABLE"), "local test 含 SQL 注入");
wire(testLocal.includes("/products"), "local test 打 /products");

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

const tmp = mkdtempSync(join(root, "local/m4", "ch20-verify-"));
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
