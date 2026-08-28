/**
 * 用标准答案跑一遍 Ch14 测试，确认生成的 JSON 能绿。
 * 运行：bun scripts/verify-ch14.ts
 */
import chapter from "../src/content/chapters/ch14.json";
import shared from "../src/content/shared.json";
import { runFunctionTest } from "../src/lib/tsRunner";
import type { FuncDef, Section } from "../src/types";

const solutions: Record<string, string> = {
  needRerun: `export function needRerun(prevDeps: unknown[] | null, nextDeps: unknown[]): boolean {
  if (prevDeps === null) return true;
  if (prevDeps.length !== nextDeps.length) return true;
  for (let i = 0; i < prevDeps.length; i++) {
    if (!Object.is(prevDeps[i], nextDeps[i])) return true;
  }
  return false;
}`,
  registerCleanup: `export function registerCleanup(
  cleanups: Array<() => void>,
  fn: () => void,
): Array<() => void> {
  return [...cleanups, fn];
}`,
  fakeEffectCycle: `export function fakeEffectCycle(
  prevDeps: unknown[] | null,
  nextDeps: unknown[],
  log: string[],
): unknown[] {
  if (needRerun(prevDeps, nextDeps)) {
    if (prevDeps !== null) log.push("cleanup");
    log.push("setup");
    return nextDeps.slice();
  }
  return prevDeps === null ? [] : prevDeps.slice();
}`,
  staleFlagGuard: `export function staleFlagGuard(
  requestId: number,
  latestId: number,
  payload: string,
): string | null {
  return requestId === latestId ? payload : null;
}`,
  debouncePlan: `export function debouncePlan(nowMs: number, waitMs: number): number {
  return nowMs + waitMs;
}`,
  abortWhenUnmount: `export function abortWhenUnmount(mounted: boolean, payload: string): string | null {
  return mounted ? payload : null;
}`,
};

const expectedNames = [
  "needRerun",
  "registerCleanup",
  "fakeEffectCycle",
  "staleFlagGuard",
  "debouncePlan",
  "abortWhenUnmount",
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

wire(ch.id === "ch14", `id === ch14 (got ${ch.id})`);
wire(ch.num === "14", `num === 14 (got ${ch.num})`);
wire(ch.title === "hooks 心智", `title (got ${ch.title})`);
wire(ch.runMode === "browser", `runMode === browser (got ${ch.runMode})`);
wire(ch.testName === "ch14_assignment", `testName (got ${ch.testName})`);
wire(ch.interleaved === true, "interleaved === true");
wire(ch.tutorialMd.startsWith("# Ch14 · hooks 心智"), "H1");
wire(ch.tutorialMd.includes("作业 ↔ 教程对应表"), "front matter 对应表");
wire(ch.tutorialMd.includes("Ch15"), "下一步指向 Ch15");
wire(ch.tutorialMd.includes("表单与列表"), "下一步含 表单与列表");
wire(ch.preamble.includes("禁止 setTimeout"), "preamble 禁止 setTimeout");
wire(ch.preamble.includes("import react"), "preamble 提 import react");

wire(!/from\s+["']react["']/.test(ch.assignment), 'assignment 无 from "react"');
wire(!/from\s+["']react["']/.test(ch.testSource), 'testSource 无 from "react"');
wire(!/^\s*import\s+/m.test(ch.assignment), "assignment 无 import");
wire(!/^\s*import\s+/m.test(ch.testSource), "testSource 无 import");

wire(!hasIdentCall(ch.assignment, "setTimeout"), "assignment 无 setTimeout(");
wire(!hasIdentCall(ch.testSource, "setTimeout"), "testSource 无 setTimeout(");
wire(!hasIdentCall(ch.assignment, "fetch"), "assignment 无 fetch(");
wire(!hasIdentCall(ch.testSource, "fetch"), "testSource 无 fetch(");

wire(
  ch.tutorialMd.includes("useState") && ch.tutorialMd.includes("useEffect"),
  "教程含 useState / useEffect 心智",
);
wire(
  ch.tutorialMd.includes("<") && ch.tutorialMd.includes("sku"),
  "教程含 JSX 示例（< 与 sku）",
);
wire(ch.tutorialMd.includes("ngOnInit") || ch.tutorialMd.includes("componentDidMount"), "教程点名生命周期误区");
wire(ch.tutorialMd.includes("__enter__") || ch.tutorialMd.includes("__exit__"), "教程对照 Python context manager");

wire(ch.reviewMd.includes("cleanup"), "闪卡覆盖 cleanup");
wire(ch.reviewMd.includes("deps"), "闪卡覆盖 deps");
wire(ch.reviewMd.includes("stale"), "闪卡覆盖 stale");

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
  wire(!hasIdentCall(f.skeleton, "setTimeout"), `${f.name} skeleton 无 setTimeout(`);
  wire(!hasIdentCall(f.skeleton, "fetch"), `${f.name} skeleton 无 fetch(`);
}

wire(
  ch.functions.find((f) => f.name === "fakeEffectCycle")?.skeleton.includes("needRerun") === true,
  "fakeEffectCycle 骨架提示复用 needRerun",
);
wire(solutions.fakeEffectCycle.includes("needRerun"), "solutions.fakeEffectCycle 调用 needRerun");

const secNums = ["14.1", "14.2", "14.3", "14.4", "14.5", "14.6"];
for (const n of secNums) {
  const s = ch.sections.find((x) => x.secNum === n);
  wire(!!s && s.heading.includes("§" + n), `H2 含 §${n}`);
}

wire(
  ch.sections.find((s) => s.secNum === "14.1")?.exerciseFunctions.includes("needRerun") === true,
  "§14.1 → needRerun",
);
wire(
  ch.sections.find((s) => s.secNum === "14.2")?.exerciseFunctions.includes("registerCleanup") === true,
  "§14.2 → registerCleanup",
);
wire(
  ch.sections.find((s) => s.secNum === "14.3")?.exerciseFunctions.includes("fakeEffectCycle") === true,
  "§14.3 → fakeEffectCycle",
);
wire(
  ch.sections.find((s) => s.secNum === "14.4")?.exerciseFunctions.includes("staleFlagGuard") === true,
  "§14.4 → staleFlagGuard",
);
wire(
  ch.sections.find((s) => s.secNum === "14.5")?.exerciseFunctions.includes("debouncePlan") === true,
  "§14.5 → debouncePlan",
);
wire(
  ch.sections.find((s) => s.secNum === "14.6")?.exerciseFunctions.includes("abortWhenUnmount") === true,
  "§14.6 → abortWhenUnmount",
);

const forbiddenMatchers = [".toThrow", ".toContain", ".toMatch", ".toBeTruthy", ".toBeFalsy"];
for (const m of forbiddenMatchers) {
  wire(!ch.testSource.includes(m), `expect 不用 ${m}`);
}

const allowed = [".toBe(", ".toEqual(", ".toBeNull(", ".toBeInstanceOf("];
wire(
  allowed.some((m) => ch.testSource.includes(m)),
  "测试使用允许的 expect matcher",
);

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
