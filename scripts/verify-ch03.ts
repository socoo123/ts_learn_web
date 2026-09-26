/**
 * 用标准答案跑一遍 Ch03 测试，确认生成的 JSON 能绿。
 * 运行：bun scripts/verify-ch03.ts
 */
import chapter from "../src/content/chapters/ch03.json";
import shared from "../src/content/shared.json";
import { runFunctionTest } from "../assets/js/runner-core.js";
import type { FuncDef, Section } from "../src/types";

const solutions: Record<string, string> = {
  formatOptionalPrice: `export function formatOptionalPrice(price: number | null): string {
  if (price === null) return "定价待定";
  return "¥" + price.toFixed(2);
}`,
  statusLabel: `export function statusLabel(status: "in_stock" | "out"): string {
  return status === "in_stock" ? "有货" : "缺货";
}`,
  narrowId: `export function narrowId(id: string | number): string {
  if (typeof id === "number") return "#" + id;
  return id;
}`,
  readField: `export function readField(obj: { sku: string } | { name: string }): string {
  if ("sku" in obj) return obj.sku;
  return obj.name;
}`,
  handleStockResult: `export function handleStockResult(r: StockResult): string {
  switch (r.type) {
    case "ok":
      return \`有货：\${r.product.name} ×\${r.product.stock}\`;
    case "out":
      return \`缺货：\${r.sku}\`;
    case "missing":
      return \`未找到：\${r.sku}\`;
  }
}`,
  priceOrZero: `export function priceOrZero(price: number | null | undefined): number {
  return price ?? 0;
}`,
  summarizeResults: `export function summarizeResults(
  results: StockResult[],
): { ok: number; out: number; missing: number } {
  const acc = { ok: 0, out: 0, missing: 0 };
  for (const r of results) {
    acc[r.type]++;
  }
  return acc;
}`,
};

const expectedFns = [
  "formatOptionalPrice",
  "statusLabel",
  "narrowId",
  "readField",
  "handleStockResult",
  "priceOrZero",
  "summarizeResults",
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

wire(ch.id === "ch03", `id === ch03 (got ${ch.id})`);
wire(ch.num === "03", `num === 03 (got ${ch.num})`);
wire(ch.title === "联合、字面量、narrowing", `title (got ${ch.title})`);
wire(ch.runMode === "browser", `runMode === browser (got ${ch.runMode})`);
wire(ch.testName === "ch03_assignment", `testName (got ${ch.testName})`);
wire(ch.interleaved === true, "interleaved === true");
wire(ch.tutorialMd.startsWith("# Ch03 · 联合、字面量、narrowing"), "H1");
wire(ch.tutorialMd.includes("作业 ↔ 教程对应表"), "front matter 对应表");
wire(ch.preamble.includes("StockResult"), "preamble 含 StockResult");

const fnNames = ch.functions.map((f) => f.name);
wire(
  expectedFns.length === fnNames.length && expectedFns.every((n, i) => n === fnNames[i]),
  `functions 顺序与大纲一致 [${fnNames.join(", ")}]`,
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

const secNums = ["3.1", "3.2", "3.3", "3.4", "3.5", "3.6", "3.7"];
for (const n of secNums) {
  const s = ch.sections.find((x) => x.secNum === n);
  wire(!!s && s.heading.includes("§" + n), `H2 含 §${n}`);
}

const forbidden = ["hono", "@hono/", "drizzle-orm", "better-sqlite3", "@earendil-works/", "node:fs", "node:http"];
const blob = ch.assignment + "\n" + ch.testSource + "\n" + ch.preamble;
for (const bad of forbidden) {
  wire(!blob.includes(bad), `无禁止 import ${bad}`);
}

wire(ch.testSource.includes("priceOrZero(0)"), "测试含 price 0");
wire(ch.testSource.includes("formatOptionalPrice(0)"), "formatOptionalPrice 测 0 元");
wire(ch.testSource.includes("narrowId(0)"), "narrowId 测数字 0");
wire(ch.testSource.includes('type: "ok"') && ch.testSource.includes('type: "out"') && ch.testSource.includes('type: "missing"'), "判别联合三支都有测试");

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
