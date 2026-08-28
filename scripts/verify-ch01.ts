/**
 * 用标准答案跑一遍 Ch01 测试，确认生成的 JSON 能绿。
 * 运行：bun scripts/verify-ch01.ts
 */
import chapter from "../src/content/chapters/ch01.json";
import shared from "../src/content/shared.json";
import { runFunctionTest } from "../src/lib/tsRunner";
import type { FuncDef } from "../src/types";

const solutions: Record<string, string> = {
  calcLineTotal: `export function calcLineTotal(price: number, quantity: number): number {
  return price * quantity;
}`,
  parseSku: `export function parseSku(sku: string): [string, number] {
  const [prefix, num] = sku.split("-");
  return [prefix, Number(num)];
}`,
  formatPriceTag: `export function formatPriceTag(name: string, price: number, currency = "¥"): string {
  return \`\${name} \${currency}\${price.toFixed(2)}\`;
}`,
  renderPriceList: `export function renderPriceList(
  products: { name: string; price: number }[],
  currency = "¥",
): string {
  return products.map((p) => formatPriceTag(p.name, p.price, currency)).join("\\n");
}`,
  firstInStockName: `export function firstInStockName(
  products: { name: string; stock: number }[],
): string | null {
  for (const p of products) {
    if (p.stock > 0) return p.name;
  }
  return null;
}`,
  debugTypeName: `export function debugTypeName(value: unknown): string {
  return typeof value;
}`,
  outOfStockSkus: `export function outOfStockSkus(
  products: { sku: string; stock: number }[],
): string[] {
  return products.filter((p) => p.stock === 0).map((p) => p.sku);
}`,
  inventorySummary: `export function inventorySummary(
  products: { price: number; stock: number }[],
): { count: number; minPrice: number; maxPrice: number; totalValue: number } {
  return {
    count: products.length,
    minPrice: Math.min(...products.map((p) => p.price)),
    maxPrice: Math.max(...products.map((p) => p.price)),
    totalValue: products.reduce((sum, p) => sum + p.price * p.stock, 0),
  };
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
