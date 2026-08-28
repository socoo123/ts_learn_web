/**
 * 用标准答案跑一遍 Ch05 测试，确认生成的 JSON 能绿。
 * 运行：bun scripts/verify-ch05.ts
 */
import chapter from "../src/content/chapters/ch05.json";
import shared from "../src/content/shared.json";
import { runFunctionTest } from "../src/lib/tsRunner";
import type { FuncDef } from "../src/types";

const solutions: Record<string, string> = {
  discountedPrice: `export function discountedPrice(price: number, rate: number): number {
  return price * (1 - rate);
}`,
  splitSku: `export function splitSku(sku: string): { prefix: string; seq: number } {
  const [prefix, seq] = sku.split("-");
  return { prefix, seq: Number(seq) };
}`,
  restTags: `export function restTags(first: string, ...rest: string[]): string[] {
  return [first, ...rest];
}`,
  mergeProductPatch: `export function mergeProductPatch(
  base: { name: string; price: number; stock: number },
  patch: Partial<{ name: string; price: number; stock: number }>,
): { name: string; price: number; stock: number } {
  return { ...base, ...patch };
}`,
  bindCounter: `export function bindCounter(start: number): () => number {
  let n = start;
  return () => ++n;
}`,
  pipePrice: `export function pipePrice(price: number, fns: Array<(n: number) => number>): number {
  return fns.reduce((acc, fn) => fn(acc), price);
}`,
  exportMarker: `export function exportMarker(
  sku: string,
  price: number,
  rate: number,
  ...tags: string[]
): string {
  const { prefix } = splitSku(sku);
  const p = discountedPrice(price, rate);
  const tagList = tags.length === 0 ? [] : restTags(tags[0], ...tags.slice(1));
  return \`\${prefix} ¥\${p.toFixed(2)} [\${tagList.join(",")}]\`;
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
