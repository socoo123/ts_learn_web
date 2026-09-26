/**
 * 用标准答案跑一遍 Ch02 测试，确认生成的 JSON 能绿。
 * 运行：bun scripts/verify-ch02.ts
 */
import chapter from "../src/content/chapters/ch02.json";
import shared from "../src/content/shared.json";
import { runFunctionTest } from "../assets/js/runner-core.js";
import type { FuncDef } from "../src/types";

const solutions: Record<string, string> = {
  labelProduct: `export function labelProduct(item: { name: string; price: number }): string {
  return \`\${item.name} ¥\${item.price.toFixed(2)}\`;
}`,
  asOrderLine: `export function asOrderLine(p: {
  sku: string;
  name: string;
  price: number;
  quantity?: number;
}): { sku: string; name: string; price: number; quantity: number } {
  return {
    sku: p.sku,
    name: p.name,
    price: p.price,
    quantity: p.quantity === undefined ? 1 : p.quantity,
  };
}`,
  pickSku: `export function pickSku(item: { sku: string }): string {
  return item.sku;
}`,
  mergeNamed: `export function mergeNamed(
  a: { name: string },
  b: { sku: string },
): { name: string; sku: string } {
  return { name: a.name, sku: b.sku };
}`,
  freezeName: `export function freezeName(p: { readonly name: string; price: number }): string {
  return p.name;
}`,
  acceptDuck: `export function acceptDuck(quacker: { name: string; price: number }): string {
  return labelProduct(quacker);
}`,
  assertProductShape: `export function assertProductShape(v: unknown): boolean {
  if (v === null || typeof v !== "object" || Array.isArray(v)) return false;
  const o = v as Record<string, unknown>;
  return typeof o.name === "string" && typeof o.price === "number";
}`,
};

const ch = chapter as {
  preamble: string;
  testSource: string;
  functions: FuncDef[];
};

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
