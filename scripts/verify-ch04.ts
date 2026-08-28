/**
 * 用标准答案跑一遍 Ch04 测试，确认生成的 JSON 能绿。
 * 运行：bun scripts/verify-ch04.ts
 */
import chapter from "../src/content/chapters/ch04.json";
import shared from "../src/content/shared.json";
import { runFunctionTest } from "../src/lib/tsRunner";
import type { FuncDef, Section } from "../src/types";

const solutions: Record<string, string> = {
  firstOf: `export function firstOf<T>(items: T[]): T | null {
  return items.length === 0 ? null : items[0];
}`,
  pluck: `export function pluck<T, K extends keyof T>(obj: T, key: K): T[K] {
  return obj[key];
}`,
  patchProduct: `export function patchProduct(base: Product, patch: Partial<Product>): Product {
  return { ...base, ...patch };
}`,
  catalogCard: `export function catalogCard(p: Product): Pick<Product, "name" | "price"> {
  return { name: p.name, price: p.price };
}`,
  withoutStock: `export function withoutStock(p: Product): Omit<Product, "stock"> {
  const { stock, ...rest } = p;
  return rest;
}`,
  indexBySku: `export function indexBySku(products: Product[]): Record<string, Product> {
  const out: Record<string, Product> = {};
  for (const p of products) {
    out[p.sku] = p;
  }
  return out;
}`,
  groupByCategory: `export function groupByCategory(products: Product[]): Record<string, Product[]> {
  const out: Record<string, Product[]> = {};
  for (const p of products) {
    const cat = pluck(p, "category");
    if (!out[cat]) out[cat] = [];
    out[cat].push(p);
  }
  return out;
}`,
};

const expectedNames = [
  "firstOf",
  "pluck",
  "patchProduct",
  "catalogCard",
  "withoutStock",
  "indexBySku",
  "groupByCategory",
];

const ch = chapter as {
  id: string;
  num: string;
  title: string;
  runMode: string;
  tutorialMd: string;
  assignment: string;
  testName: string;
  testSource: string;
  interleaved: boolean;
  preamble: string;
  functions: FuncDef[];
  sections: Section[];
};

const wiring: string[] = [];
if (ch.id !== "ch04") wiring.push(`id=${ch.id}`);
if (ch.num !== "04") wiring.push(`num=${ch.num}`);
if (ch.title !== "泛型与工具类型") wiring.push(`title=${ch.title}`);
if (ch.runMode !== "browser") wiring.push(`runMode=${ch.runMode}`);
if (ch.testName !== "ch04_assignment") wiring.push(`testName=${ch.testName}`);
if (ch.interleaved !== true) wiring.push("interleaved");
if (!ch.tutorialMd.startsWith("# Ch04 · 泛型与工具类型")) wiring.push("H1");
if (!ch.tutorialMd.includes("作业 ↔ 教程对应表")) wiring.push("对应表");
if (!ch.preamble.includes("type Product")) wiring.push("preamble Product");

const names = ch.functions.map((f) => f.name);
if (names.join(",") !== expectedNames.join(",")) {
  wiring.push(`functions=${names.join(",")}`);
}
for (const f of ch.functions) {
  if (f.testSuite !== f.name) wiring.push(`testSuite ${f.name}`);
  if (!f.skeleton.includes(`export function ${f.name}`)) {
    wiring.push(`export ${f.name}`);
  }
  if (!f.skeleton.includes('throw new Error("TODO")')) {
    wiring.push(`TODO ${f.name}`);
  }
  if (!ch.tutorialMd.includes(`\`${f.name}\``)) {
    wiring.push(`table/tutorial missing ${f.name}`);
  }
}

const exercised = new Set(ch.sections.flatMap((s) => s.exerciseFunctions));
for (const name of expectedNames) {
  if (!exercised.has(name)) wiring.push(`exerciseFunctions missing ${name}`);
}
for (const s of ch.sections) {
  if (s.exerciseFunctions.length > 0 && !(s.heading.includes("§") || s.secNum)) {
    wiring.push(`H2 missing §: ${s.heading}`);
  }
  if (s.secNum && !s.heading.includes(`§${s.secNum}`)) {
    wiring.push(`heading/secNum mismatch: ${s.heading}`);
  }
}

const forbidden = [
  "hono",
  "@hono/",
  "drizzle-orm",
  "better-sqlite3",
  "@earendil-works/",
  "node:fs",
  "node:http",
];
const blob = `${ch.assignment}\n${ch.testSource}\n${ch.preamble}`;
for (const bad of forbidden) {
  if (blob.includes(bad)) wiring.push(`forbidden import ${bad}`);
}

if (wiring.length) {
  console.error("WIRING FAIL:\n" + wiring.map((w) => "  - " + w).join("\n"));
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
