/**
 * 用标准答案跑一遍 Ch11 测试，确认生成的 JSON 能绿。
 * 运行：bun scripts/verify-ch11.ts
 */
import chapter from "../src/content/chapters/ch11.json";
import shared from "../src/content/shared.json";
import { runFunctionTest } from "../src/lib/tsRunner";
import type { FuncDef, Section } from "../src/types";

const solutions: Record<string, string> = {
  parseJsonProduct: `export function parseJsonProduct(raw: string): Product | null {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }
  const r = PRODUCT_SCHEMA.safeParse(parsed);
  return r.success ? r.data : null;
}`,
  stringifyPretty: `export function stringifyPretty(value: unknown): string {
  return JSON.stringify(value, null, 2);
}`,
  readAllTextFromChunks: `export function readAllTextFromChunks(chunks: string[]): string {
  return chunks.join("");
}`,
  joinSsePayloads: `export function joinSsePayloads(raw: string): string {
  let out = "";
  for (const line of raw.split("\\n")) {
    if (line.startsWith("data: ")) out += line.slice(6);
    else if (line.startsWith("data:")) out += line.slice(5);
  }
  return out;
}`,
  takeNChunks: `export function takeNChunks(chunks: string[], n: number): string[] {
  if (n <= 0) return [];
  return chunks.slice(0, n);
}`,
  decodeUtf8Chunks: `export function decodeUtf8Chunks(chunks: Uint8Array[]): string {
  let total = 0;
  for (const c of chunks) total += c.length;
  const joined = new Uint8Array(total);
  let offset = 0;
  for (const c of chunks) {
    joined.set(c, offset);
    offset += c.length;
  }
  return new TextDecoder("utf-8").decode(joined);
}`,
  collectStreamToString: `export function collectStreamToString(reader: FakeReader): string {
  const collected: Uint8Array[] = [];
  while (true) {
    const r = reader.read();
    if (r.done) break;
    collected.push(r.value);
  }
  return decodeUtf8Chunks(collected);
}`,
};

const expectedNames = [
  "parseJsonProduct",
  "stringifyPretty",
  "readAllTextFromChunks",
  "joinSsePayloads",
  "takeNChunks",
  "decodeUtf8Chunks",
  "collectStreamToString",
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

function hasIdentCall(src: string, name: string): boolean {
  return new RegExp(`\\b${name}\\s*\\(`).test(src);
}

wire(ch.id === "ch11", `id === ch11 (got ${ch.id})`);
wire(ch.num === "11", `num === 11 (got ${ch.num})`);
wire(ch.title === "fetch、JSON、Stream 概念", `title (got ${ch.title})`);
wire(ch.runMode === "browser", `runMode === browser (got ${ch.runMode})`);
wire(ch.testName === "ch11_assignment", `testName (got ${ch.testName})`);
wire(ch.interleaved === true, "interleaved === true");
wire(ch.tutorialMd.startsWith("# Ch11 · fetch、JSON、Stream 概念"), "H1");
wire(ch.tutorialMd.includes("作业 ↔ 教程对应表"), "front matter 对应表");
wire(ch.tutorialMd.includes("Ch12"), "下一步指向 Ch12");
wire(ch.tutorialMd.includes("组件化心智"), "下一步标题含组件化心智");
wire(ch.preamble.includes("PRODUCT_SCHEMA"), "preamble 含 PRODUCT_SCHEMA");
wire(ch.preamble.includes("FakeReader"), "preamble 含 FakeReader");
wire(ch.preamble.includes("type Product"), "preamble 含 Product");
wire(!/^\s*import\s+/m.test(ch.assignment), "assignment 无 import");
wire(!/^\s*import\s+/m.test(ch.testSource), "testSource 无 import");

wire(!hasIdentCall(ch.assignment, "fetch"), "assignment 无 fetch(");
wire(!hasIdentCall(ch.testSource, "fetch"), "testSource 无 fetch(");
wire(!hasIdentCall(ch.assignment, "setTimeout"), "assignment 无 setTimeout(");
wire(!hasIdentCall(ch.testSource, "setTimeout"), "testSource 无 setTimeout(");

wire(ch.reviewMd.includes("parse") || ch.reviewMd.includes("JSON.parse"), "闪卡覆盖 parse");
wire(ch.reviewMd.includes("stringify") || ch.reviewMd.includes("JSON.stringify"), "闪卡覆盖 stringify");
wire(ch.reviewMd.includes("SSE") || ch.reviewMd.includes("data:"), "闪卡覆盖 SSE");
wire(
  ch.reviewMd.includes("UTF-8") || ch.reviewMd.includes("跨") || ch.reviewMd.includes("U+FFFD"),
  "闪卡覆盖 UTF-8 跨块",
);
wire(ch.reviewMd.includes("Reader") || ch.reviewMd.includes("reader"), "闪卡覆盖 reader");

const fnNames = ch.functions.map((f) => f.name);
wire(
  expectedNames.length === fnNames.length && expectedNames.every((n, i) => n === fnNames[i]),
  `functions 顺序一致 [${fnNames.join(", ")}]`,
);

for (const f of ch.functions) {
  wire(f.testSuite === f.name, `testSuite === name (${f.name})`);
  wire(
    f.skeleton.includes(`export function ${f.name}`),
    `export function ${f.name}`,
  );
  wire(!f.skeleton.includes("export async function"), `${f.name} 非 async`);
  wire(f.skeleton.includes('throw new Error("TODO")'), `${f.name} skeleton TODO`);
  wire(f.skeleton.includes("【场景】") && f.skeleton.includes("【转换点】"), `${f.name} 场景/转换点`);
  wire(ch.tutorialMd.includes("`" + f.name + "`"), `对应表含 ${f.name}`);
  wire(
    ch.sections.some((s) => s.exerciseFunctions.includes(f.name)),
    `${f.name} 挂在某节 exerciseFunctions`,
  );
}

wire(
  ch.functions.find((f) => f.name === "collectStreamToString")?.skeleton.includes("decodeUtf8Chunks") ===
    true,
  "collectStreamToString 骨架提示复用 decodeUtf8Chunks",
);

const secNums = ["11.1", "11.2", "11.3", "11.4", "11.5", "11.6", "11.7"];
for (const n of secNums) {
  const s = ch.sections.find((x) => x.secNum === n);
  wire(!!s && s.heading.includes("§" + n), `H2 含 §${n}`);
}

wire(
  ch.sections.find((s) => s.secNum === "11.1")?.exerciseFunctions.includes("parseJsonProduct") === true,
  "§11.1 → parseJsonProduct",
);
wire(
  ch.sections.find((s) => s.secNum === "11.2")?.exerciseFunctions.includes("stringifyPretty") === true,
  "§11.2 → stringifyPretty",
);
wire(
  ch.sections.find((s) => s.secNum === "11.3")?.exerciseFunctions.includes("readAllTextFromChunks") ===
    true,
  "§11.3 → readAllTextFromChunks",
);
wire(
  ch.sections.find((s) => s.secNum === "11.4")?.exerciseFunctions.includes("joinSsePayloads") === true,
  "§11.4 → joinSsePayloads",
);
wire(
  ch.sections.find((s) => s.secNum === "11.5")?.exerciseFunctions.includes("takeNChunks") === true,
  "§11.5 → takeNChunks",
);
wire(
  ch.sections.find((s) => s.secNum === "11.6")?.exerciseFunctions.includes("decodeUtf8Chunks") === true,
  "§11.6 → decodeUtf8Chunks",
);
wire(
  ch.sections.find((s) => s.secNum === "11.7")?.exerciseFunctions.includes("collectStreamToString") ===
    true,
  "§11.7 → collectStreamToString",
);

const forbiddenMatchers = [".toThrow", ".toContain", ".toMatch", ".toBeTruthy", ".toBeFalsy"];
for (const m of forbiddenMatchers) {
  wire(!ch.testSource.includes(m), `expect 不用 ${m}`);
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
