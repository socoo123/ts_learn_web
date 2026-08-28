/**
 * 用标准答案跑一遍 Ch10 测试，确认生成的 JSON 能绿。
 * 运行：bun scripts/verify-ch10.ts
 */
import chapter from "../src/content/chapters/ch10.json";
import shared from "../src/content/shared.json";
import { runFunctionTest } from "../src/lib/tsRunner";
import type { FuncDef, Section } from "../src/types";

const parseCo = `function parseCompilerOptions(tsconfigJson: string): Record<string, unknown> {
  let parsed: unknown;
  try {
    parsed = JSON.parse(tsconfigJson);
  } catch {
    throw new Error("NO_JSON");
  }
  if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) {
    return {};
  }
  const co = (parsed as Record<string, unknown>).compilerOptions;
  if (co === null || typeof co !== "object" || Array.isArray(co)) {
    return {};
  }
  return co as Record<string, unknown>;
}`;

const solutions: Record<string, string> = {
  readStrict: `${parseCo}
export function readStrict(tsconfigJson: string): boolean {
  return !!parseCompilerOptions(tsconfigJson).strict;
}`,
  readNoImplicitAny: `export function readNoImplicitAny(tsconfigJson: string): boolean {
  const co = parseCompilerOptions(tsconfigJson);
  if (typeof co.noImplicitAny === "boolean") return co.noImplicitAny;
  if (co.strict === true) return true;
  return false;
}`,
  readTarget: `export function readTarget(tsconfigJson: string): string | null {
  const t = parseCompilerOptions(tsconfigJson).target;
  return typeof t === "string" ? t : null;
}`,
  readModuleKind: `export function readModuleKind(tsconfigJson: string): string | null {
  const m = parseCompilerOptions(tsconfigJson).module;
  return typeof m === "string" ? m : null;
}`,
  strictImplies: `export function strictImplies(flag: string): boolean {
  const flags = new Set([
    "noImplicitAny",
    "strictNullChecks",
    "noImplicitThis",
    "alwaysStrict",
    "strictBindCallApply",
    "strictFunctionTypes",
    "strictPropertyInitialization",
    "useUnknownInCatchVariables",
  ]);
  return flags.has(flag);
}`,
  declareFunctionLine: `export function declareFunctionLine(name: string, params: string, ret: string): string {
  return \`declare function \${name}(\${params}): \${ret};\`;
}`,
  shopApiDts: `export function shopApiDts(): string {
  return [
    declareFunctionLine(
      "lookupProduct",
      "sku: string",
      "{ name: string; price: number } | null",
    ),
    declareFunctionLine(
      "calcLineTotal",
      "price: number, quantity: number",
      "number",
    ),
    "declare const SHOP_VERSION: string;",
  ].join("\\n") + "\\n";
}`,
};

const expectedNames = [
  "readStrict",
  "readNoImplicitAny",
  "readTarget",
  "readModuleKind",
  "strictImplies",
  "declareFunctionLine",
  "shopApiDts",
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

wire(ch.id === "ch10", `id === ch10 (got ${ch.id})`);
wire(ch.num === "10", `num === 10 (got ${ch.num})`);
wire(ch.title === "tsconfig 与声明文件", `title (got ${ch.title})`);
wire(ch.runMode === "browser", `runMode === browser (got ${ch.runMode})`);
wire(ch.testName === "ch10_assignment", `testName (got ${ch.testName})`);
wire(ch.interleaved === true, "interleaved === true");
wire(ch.tutorialMd.startsWith("# Ch10 · tsconfig 与声明文件"), "H1");
wire(ch.tutorialMd.includes("作业 ↔ 教程对应表"), "front matter 对应表");
wire(ch.tutorialMd.includes("Ch11"), "下一步指向 Ch11");
wire(ch.preamble.includes("NO_JSON"), "preamble 含 NO_JSON");
wire(!/^\s*import\s+.*\bfs\b/m.test(ch.assignment), "assignment 无 import fs");
wire(!/^\s*import\s+.*\bfs\b/m.test(ch.testSource), "testSource 无 import fs");
wire(!/node:fs/.test(ch.assignment + ch.testSource + ch.preamble), "无 node:fs");
wire(!/project references/i.test(ch.tutorialMd), "正文不出现 project references");
wire(!/path mapping/i.test(ch.tutorialMd), "正文不出现 path mapping");

wire(ch.reviewMd.includes("strict"), "闪卡覆盖 strict bundle");
wire(ch.reviewMd.includes("noImplicitAny"), "闪卡覆盖 noImplicitAny");
wire(ch.reviewMd.includes("declare"), "闪卡覆盖 declare vs function");
wire(ch.reviewMd.includes("@types"), "闪卡覆盖 @types");
wire(ch.reviewMd.includes("蒸发") || ch.reviewMd.includes("运行时"), "闪卡覆盖 d.ts 非运行时");

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
  wire(f.skeleton.includes('throw new Error("TODO")'), `${f.name} skeleton TODO`);
  wire(f.skeleton.includes("【场景】") && f.skeleton.includes("【转换点】"), `${f.name} 场景/转换点`);
  wire(ch.tutorialMd.includes("`" + f.name + "`"), `对应表含 ${f.name}`);
  wire(
    ch.sections.some((s) => s.exerciseFunctions.includes(f.name)),
    `${f.name} 挂在某节 exerciseFunctions`,
  );
}

const secNums = ["10.1", "10.2", "10.3", "10.4", "10.5"];
for (const n of secNums) {
  const s = ch.sections.find((x) => x.secNum === n);
  wire(!!s && s.heading.includes("§" + n), `H2 含 §${n}`);
}

wire(
  ch.sections.find((s) => s.secNum === "10.1")?.exerciseFunctions.includes("readStrict") === true,
  "§10.1 → readStrict",
);
wire(
  ch.sections.find((s) => s.secNum === "10.2")?.exerciseFunctions.includes("readNoImplicitAny") === true,
  "§10.2 → readNoImplicitAny",
);
wire(
  ch.sections.find((s) => s.secNum === "10.2")?.exerciseFunctions.includes("strictImplies") === true,
  "§10.2 → strictImplies",
);
wire(
  ch.sections.find((s) => s.secNum === "10.3")?.exerciseFunctions.includes("readTarget") === true,
  "§10.3 → readTarget",
);
wire(
  ch.sections.find((s) => s.secNum === "10.3")?.exerciseFunctions.includes("readModuleKind") === true,
  "§10.3 → readModuleKind",
);
wire(
  ch.sections.find((s) => s.secNum === "10.4")?.exerciseFunctions.includes("declareFunctionLine") === true,
  "§10.4 → declareFunctionLine",
);
wire(
  ch.sections.find((s) => s.secNum === "10.5")?.exerciseFunctions.includes("shopApiDts") === true,
  "§10.5 → shopApiDts",
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
