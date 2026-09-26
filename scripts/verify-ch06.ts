/**
 * 用标准答案跑一遍 Ch06 测试，确认生成的 JSON 能绿。
 * 运行：bun scripts/verify-ch06.ts
 */
import chapter from "../src/content/chapters/ch06.json";
import shared from "../src/content/shared.json";
import { runFunctionTest } from "../assets/js/runner-core.js";
import type { FuncDef, Section } from "../src/types";

const solutions: Record<string, string> = {
  delayValue: `export function delayValue<T>(value: T): Promise<T> {
  return Promise.resolve(value);
}`,
  loadProductAsync: `export async function loadProductAsync(
  sku: string,
  products: CatalogItem[],
): Promise<CatalogItem | null> {
  const found = products.find((p) => p.sku === sku);
  return found ?? null;
}`,
  loadOrThrow: `export async function loadOrThrow(
  sku: string,
  products: CatalogItem[],
): Promise<CatalogItem> {
  const found = products.find((p) => p.sku === sku);
  if (!found) throw new Error("NOT_FOUND:" + sku);
  return found;
}`,
  readErrorMessage: `export function readErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (typeof err === "string") return err;
  return "unknown";
}`,
  loadMany: `export async function loadMany(
  skus: string[],
  products: CatalogItem[],
): Promise<Array<CatalogItem | null>> {
  return Promise.all(skus.map((sku) => loadProductAsync(sku, products)));
}`,
  loadManySettled: `export async function loadManySettled(
  skus: string[],
  products: CatalogItem[],
): Promise<{ ok: number; failed: number }> {
  const results = await Promise.allSettled(
    skus.map((sku) => loadOrThrow(sku, products)),
  );
  let ok = 0;
  let failed = 0;
  for (const r of results) {
    if (r.status === "fulfilled") ok++;
    else failed++;
  }
  return { ok, failed };
}`,
  retryOnce: `export async function retryOnce<T>(fn: () => Promise<T>): Promise<T> {
  try {
    return await fn();
  } catch {
    return await fn();
  }
}`,
};

const expectedFns = [
  "delayValue",
  "loadProductAsync",
  "loadOrThrow",
  "readErrorMessage",
  "loadMany",
  "loadManySettled",
  "retryOnce",
] as const;

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
  functions: FuncDef[];
  sections: Section[];
};

let wiringFailed = 0;

function wire(ok: boolean, msg: string) {
  console.log(ok ? `WIRE PASS  ${msg}` : `WIRE FAIL  ${msg}`);
  if (!ok) wiringFailed++;
}

function isExported(skeleton: string, name: string): boolean {
  return (
    skeleton.includes(`export function ${name}`) ||
    skeleton.includes(`export async function ${name}`)
  );
}

wire(ch.id === "ch06", `id === ch06 (got ${ch.id})`);
wire(ch.num === "06", `num === 06 (got ${ch.num})`);
wire(ch.title === "Promise、async/await、错误", `title (got ${ch.title})`);
wire(ch.runMode === "browser", `runMode === browser (got ${ch.runMode})`);
wire(ch.testName === "ch06_assignment", `testName (got ${ch.testName})`);
wire(ch.interleaved === true, "interleaved === true");
wire(ch.tutorialMd.startsWith("# Ch06 · Promise、async/await、错误"), "H1");
wire(ch.tutorialMd.includes("作业 ↔ 教程对应表"), "front matter 对应表");
wire(ch.preamble.includes("CatalogItem"), "preamble 含 CatalogItem");
wire(ch.tutorialMd.includes("CompletableFuture"), "教程含 Java CompletableFuture");
wire(ch.tutorialMd.includes("asyncio"), "教程含 Python asyncio");
wire(ch.tutorialMd.includes("Ch07"), "下一步指向 Ch07");
wire(ch.tutorialMd.includes("unknown"), "教程强调 catch unknown");

const fnNames = ch.functions.map((f) => f.name);
wire(
  expectedFns.length === fnNames.length && expectedFns.every((n, i) => n === fnNames[i]),
  `functions 顺序与大纲一致 [${fnNames.join(", ")}]`,
);

for (const f of ch.functions) {
  wire(f.testSuite === f.name, `testSuite === name (${f.name})`);
  wire(isExported(f.skeleton, f.name), `export (async) function ${f.name}`);
  wire(f.skeleton.includes('throw new Error("TODO")'), `${f.name} skeleton TODO`);
  wire(f.skeleton.includes("【场景】") && f.skeleton.includes("【转换点】"), `${f.name} 场景/转换点`);
  wire(ch.tutorialMd.includes("`" + f.name + "`"), `对应表含 ${f.name}`);
  wire(
    ch.sections.some((s) => s.exerciseFunctions.includes(f.name)),
    `${f.name} 挂在某节 exerciseFunctions`,
  );
}

const secNums = ["6.1", "6.2", "6.3", "6.4", "6.5", "6.6", "6.7"];
for (const n of secNums) {
  const s = ch.sections.find((x) => x.secNum === n);
  wire(!!s && s.heading.includes("§" + n), `H2 含 §${n}`);
}

const forbidden = ["hono", "@hono/", "drizzle-orm", "better-sqlite3", "@earendil-works/", "node:fs", "node:http"];
const blob = ch.assignment + "\n" + ch.testSource + "\n" + ch.preamble;
for (const bad of forbidden) {
  wire(!blob.includes(bad), `无禁止 import ${bad}`);
}

wire(!ch.testSource.includes("setTimeout"), "测试无 setTimeout");
wire(!ch.assignment.includes("setTimeout("), "作业骨架无 setTimeout(");
wire(!/\bfetch\s*\(/.test(ch.testSource), "测试无 fetch(");
wire(!/\bfetch\s*\(/.test(ch.assignment), "作业骨架无 fetch(");
wire(!ch.testSource.includes(".toThrow"), "测试无 .toThrow");
wire(ch.testSource.includes("async ()"), "测试含 async it");
wire(ch.testSource.includes("无线鼠标"), "测试用无线鼠标拦住写死机械键盘");
wire(ch.testSource.includes("设计模式"), "测试用设计模式拦住写死机械键盘");
wire(ch.testSource.includes("演示商品") || ch.testSource.includes("演示A"), "测试用子集目录拦住读全局");
wire(ch.testSource.includes("NOT_FOUND:NOPE"), "loadOrThrow 测精确 message");
wire(ch.testSource.includes("{ msg: \"x\" }") || ch.testSource.includes("{ msg: 'x' }"), "readErrorMessage 测普通对象");
wire(ch.testSource.includes("Promise.all") || ch.tutorialMd.includes("Promise.all"), "讲过 Promise.all");

if (wiringFailed) {
  console.error(`\n${wiringFailed} wiring failed (still running suites)`);
}

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

if (wiringFailed || failed) {
  console.error(`\n${wiringFailed} wiring, ${failed} suite(s) failed`);
  process.exit(1);
}
console.log("\nall green");
