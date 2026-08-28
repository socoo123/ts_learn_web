/**
 * 用标准答案跑一遍 Ch07 测试，确认生成的 JSON 能绿。
 * 运行：bun scripts/verify-ch07.ts
 */
import chapter from "../src/content/chapters/ch07.json";
import shared from "../src/content/shared.json";
import { runFunctionTest } from "../src/lib/tsRunner";
import type { FuncDef, Section } from "../src/types";

const solutions: Record<string, string> = {
  productSchema: `export function productSchema() {
  return z.object({
    id: z.number(),
    name: z.string(),
    category: z.string(),
    price: z.number(),
    stock: z.number(),
    sku: z.string(),
  });
}`,
  parseProduct: `export function parseProduct(data: unknown): Product {
  return productSchema().parse(data);
}`,
  safeParseProduct: `export function safeParseProduct(data: unknown): Product | null {
  const r = productSchema().safeParse(data);
  return r.success ? r.data : null;
}`,
  parseProductList: `export function parseProductList(data: unknown): Product[] {
  return z.array(productSchema()).parse(data);
}`,
  parseAndLabel: `export function parseAndLabel(data: unknown): string {
  const p = parseProduct(data);
  return \`\${p.name} ¥\${p.price.toFixed(2)}\`;
}`,
  parseToolArgs: `export function parseToolArgs(data: unknown): { sku: string; quantity: number } {
  return z.object({
    sku: z.string(),
    quantity: z.number(),
  }).parse(data);
}`,
  parseOrderPayload: `export function parseOrderPayload(
  data: unknown,
): { sku: string; quantity: number; note: string | null } {
  return z.object({
    sku: z.string(),
    quantity: z.number(),
    note: z.string().nullable().optional().default(null),
  }).parse(data);
}`,
};

const expectedNames = [
  "productSchema",
  "parseProduct",
  "safeParseProduct",
  "parseProductList",
  "parseAndLabel",
  "parseToolArgs",
  "parseOrderPayload",
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
  functions: FuncDef[];
  sections: Section[];
};

let wiringFailed = 0;

function wire(ok: boolean, msg: string) {
  console.log(ok ? `WIRE PASS  ${msg}` : `WIRE FAIL  ${msg}`);
  if (!ok) wiringFailed++;
}

wire(ch.id === "ch07", `id === ch07 (got ${ch.id})`);
wire(ch.num === "07", `num === 07 (got ${ch.num})`);
wire(ch.title === "运行时校验：zod", `title (got ${ch.title})`);
wire(ch.runMode === "browser", `runMode === browser (got ${ch.runMode})`);
wire(ch.testName === "ch07_assignment", `testName (got ${ch.testName})`);
wire(ch.interleaved === true, "interleaved === true");
wire(ch.tutorialMd.startsWith("# Ch07 · 运行时校验：zod"), "H1");
wire(ch.tutorialMd.includes("作业 ↔ 教程对应表"), "front matter 对应表");
wire(ch.preamble.includes("本页已注入全局 z"), "preamble 注入 z");
wire(ch.preamble.includes("PRODUCTS"), "preamble 含 PRODUCTS");
wire(!/^\s*import\s+.*from\s+["']zod["']/m.test(ch.assignment), "assignment 无 import zod");
wire(!/^\s*import\s+.*from\s+["']zod["']/m.test(ch.testSource), "testSource 无 import zod");
wire(ch.tutorialMd.includes("Ch08"), "下一步指向 Ch08");
wire(ch.reviewMd.includes("蒸发") || ch.reviewMd.includes("挡不住"), "闪卡覆盖蒸发");
wire(ch.reviewMd.includes("safeParse") || ch.reviewMd.includes("safeParse"), "闪卡覆盖 parse/safeParse");

const fnNames = ch.functions.map((f) => f.name);
wire(
  expectedNames.length === fnNames.length && expectedNames.every((n, i) => n === fnNames[i]),
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

const secNums = ["7.1", "7.2", "7.3", "7.4", "7.5", "7.6", "7.7"];
for (const n of secNums) {
  const s = ch.sections.find((x) => x.secNum === n);
  wire(!!s && s.heading.includes("§" + n), `H2 含 §${n}`);
}

wire(
  ch.sections.find((s) => s.secNum === "7.1")?.exerciseFunctions.includes("productSchema") === true,
  "§7.1 → productSchema",
);
wire(
  ch.sections.find((s) => s.secNum === "7.2")?.exerciseFunctions.includes("parseProduct") === true,
  "§7.2 → parseProduct",
);
wire(
  ch.sections.find((s) => s.secNum === "7.3")?.exerciseFunctions.includes("safeParseProduct") === true,
  "§7.3 → safeParseProduct",
);
wire(
  ch.sections.find((s) => s.secNum === "7.4")?.exerciseFunctions.includes("parseProductList") === true,
  "§7.4 → parseProductList",
);
wire(
  ch.sections.find((s) => s.secNum === "7.5")?.exerciseFunctions.includes("parseAndLabel") === true,
  "§7.5 → parseAndLabel",
);
wire(
  ch.sections.find((s) => s.secNum === "7.6")?.exerciseFunctions.includes("parseToolArgs") === true,
  "§7.6 → parseToolArgs",
);
wire(
  ch.sections.find((s) => s.secNum === "7.7")?.exerciseFunctions.includes("parseOrderPayload") === true,
  "§7.7 → parseOrderPayload",
);

const forbidden = [
  "hono",
  "@hono/",
  "drizzle-orm",
  "better-sqlite3",
  "@earendil-works/",
  "node:fs",
  "node:http",
  "trpc",
  "@trpc",
];
const blob = `${ch.assignment}\n${ch.testSource}\n${ch.preamble}`;
for (const bad of forbidden) {
  wire(!blob.toLowerCase().includes(bad.toLowerCase()), `无禁用依赖 ${bad}`);
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
console.log("\nall green");
