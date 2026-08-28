/**
 * 用标准答案跑一遍 Ch08 测试，确认生成的 JSON 能绿。
 * 运行：bun scripts/verify-ch08.ts
 */
import chapter from "../src/content/chapters/ch08.json";
import shared from "../src/content/shared.json";
import { runFunctionTest } from "../src/lib/tsRunner";
import type { FuncDef, Section } from "../src/types";

const solutions: Record<string, string> = {
  explainOrderA: `export function explainOrderA(
  log: string[],
  scheduleMacro: Schedule,
  scheduleMicro: Schedule,
): void {
  log.push("A-sync-1");
  scheduleMacro(() => log.push("A-macro"));
  scheduleMicro(() => log.push("A-micro"));
  log.push("A-sync-2");
}`,
  explainOrderB: `export function explainOrderB(
  log: string[],
  scheduleMacro: Schedule,
  scheduleMicro: Schedule,
): void {
  log.push("B-sync");
  scheduleMicro(() => log.push("B-micro-1"));
  scheduleMicro(() => log.push("B-micro-2"));
  scheduleMacro(() => log.push("B-macro"));
}`,
  explainOrderC: `export function explainOrderC(
  log: string[],
  scheduleMacro: Schedule,
  scheduleMicro: Schedule,
): void {
  log.push("C-sync");
  scheduleMacro(() => {
    scheduleMicro(() => log.push("C-micro-from-macro"));
    log.push("C-macro");
  });
}`,
  queueVsTimeout: `export function queueVsTimeout(
  log: string[],
  scheduleMacro: Schedule,
  scheduleMicro: Schedule,
): void {
  log.push("Q-script");
  scheduleMacro(() => log.push("Q-timeout"));
  scheduleMicro(() => log.push("Q-then"));
}`,
  asyncBreak: `export function asyncBreak(
  log: string[],
  scheduleMacro: Schedule,
  scheduleMicro: Schedule,
): void {
  log.push("F-enter");
  scheduleMicro(() => log.push("F-after-await"));
  log.push("F-after-call");
}`,
  flushMicrotasks: `export function flushMicrotasks(
  micro: Array<() => void>,
  _macro: Array<() => void>,
): void {
  while (micro.length) {
    const job = micro.shift();
    if (job) job();
  }
}`,
};

const expectedFns = [
  "explainOrderA",
  "explainOrderB",
  "explainOrderC",
  "queueVsTimeout",
  "asyncBreak",
  "flushMicrotasks",
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

wire(ch.id === "ch08", `id === ch08 (got ${ch.id})`);
wire(ch.num === "08", `num === 08 (got ${ch.num})`);
wire(ch.title === "Event Loop", `title (got ${ch.title})`);
wire(ch.runMode === "browser", `runMode === browser (got ${ch.runMode})`);
wire(ch.testName === "ch08_assignment", `testName (got ${ch.testName})`);
wire(ch.interleaved === true, "interleaved === true");
wire(ch.tutorialMd.startsWith("# Ch08 · Event Loop"), "H1");
wire(ch.tutorialMd.includes("作业 ↔ 教程对应表"), "front matter 对应表");
wire(ch.preamble.includes("type Schedule"), "preamble 含 Schedule");
wire(ch.tutorialMd.includes("Executor") || ch.tutorialMd.includes("线程"), "教程含 Java 线程对照");
wire(ch.tutorialMd.includes("asyncio"), "教程含 Python asyncio");
wire(ch.tutorialMd.includes("Ch09"), "下一步指向 Ch09");
wire(ch.tutorialMd.includes("Ch06"), "衔接 Ch06");
wire(ch.tutorialMd.includes("onDelta") || ch.tutorialMd.includes("token"), "电商/Agent 流式场景");
wire(ch.reviewMd.includes("1 4 3 2") || ch.reviewMd.includes("1-4-3-2") || ch.reviewMd.includes("**1 4 3 2**"), "闪卡覆盖 1-4-3-2");
wire(ch.reviewMd.includes("after-await") || ch.reviewMd.includes("F-after-await"), "闪卡覆盖 await 切开");
wire(ch.reviewMd.includes("flush") || ch.reviewMd.includes("微队列"), "闪卡覆盖 flush 不跑宏");
wire(!ch.tutorialMd.toLowerCase().includes("libuv 的 timers"), "未展开 libuv 阶段细节");
wire(ch.tutorialMd.includes("不考") && ch.tutorialMd.includes("libuv"), "libuv 仅延伸阅读不考");

const fnNames = ch.functions.map((f) => f.name);
wire(
  expectedFns.length === fnNames.length && expectedFns.every((n, i) => n === fnNames[i]),
  `functions 顺序与大纲一致 [${fnNames.join(", ")}]`,
);

for (const f of ch.functions) {
  wire(f.testSuite === f.name, `testSuite === name (${f.name})`);
  wire(isExported(f.skeleton, f.name), `export function ${f.name}`);
  wire(f.skeleton.includes('throw new Error("TODO")'), `${f.name} skeleton TODO`);
  wire(f.skeleton.includes("【场景】") && f.skeleton.includes("【转换点】"), `${f.name} 场景/转换点`);
  wire(ch.tutorialMd.includes("`" + f.name + "`"), `对应表含 ${f.name}`);
  wire(
    ch.sections.some((s) => s.exerciseFunctions.includes(f.name)),
    `${f.name} 挂在某节 exerciseFunctions`,
  );
}

const secNums = ["8.1", "8.2", "8.3", "8.4", "8.5", "8.6"];
for (const n of secNums) {
  const s = ch.sections.find((x) => x.secNum === n);
  wire(!!s && s.heading.includes("§" + n), `H2 含 §${n}`);
}

wire(
  ch.sections.find((s) => s.secNum === "8.1")?.exerciseFunctions.includes("explainOrderA") === true,
  "§8.1 → explainOrderA",
);
wire(
  ch.sections.find((s) => s.secNum === "8.2")?.exerciseFunctions.includes("explainOrderB") === true,
  "§8.2 → explainOrderB",
);
wire(
  ch.sections.find((s) => s.secNum === "8.3")?.exerciseFunctions.includes("explainOrderC") === true,
  "§8.3 → explainOrderC",
);
wire(
  ch.sections.find((s) => s.secNum === "8.4")?.exerciseFunctions.includes("queueVsTimeout") === true,
  "§8.4 → queueVsTimeout",
);
wire(
  ch.sections.find((s) => s.secNum === "8.5")?.exerciseFunctions.includes("asyncBreak") === true,
  "§8.5 → asyncBreak",
);
wire(
  ch.sections.find((s) => s.secNum === "8.6")?.exerciseFunctions.includes("flushMicrotasks") === true,
  "§8.6 → flushMicrotasks",
);

const labels = [
  "A-sync-1",
  "A-sync-2",
  "A-micro",
  "A-macro",
  "B-sync",
  "B-micro-1",
  "B-micro-2",
  "B-macro",
  "C-sync",
  "C-macro",
  "C-micro-from-macro",
  "Q-script",
  "Q-then",
  "Q-timeout",
  "F-enter",
  "F-after-call",
  "F-after-await",
];
for (const lab of labels) {
  wire(ch.testSource.includes(lab), `测试含标签 ${lab}`);
  wire(ch.assignment.includes(lab), `作业含标签 ${lab}`);
}

wire(ch.testSource.includes("function runOneTurn"), "testSource 含 runOneTurn");
wire(ch.testSource.includes("makeLoop") || ch.testSource.includes("scheduleMicro"), "测试注入假调度器");

const forbidden = ["hono", "@hono/", "drizzle-orm", "better-sqlite3", "@earendil-works/", "node:fs", "node:http"];
const blob = ch.assignment + "\n" + ch.testSource + "\n" + ch.preamble;
for (const bad of forbidden) {
  wire(!blob.includes(bad), `无禁止 import ${bad}`);
}

function hasIdentCall(src: string, name: string): boolean {
  return new RegExp(`\\b${name}\\s*\\(`).test(src);
}

wire(!hasIdentCall(ch.assignment, "setTimeout"), "作业骨架无 setTimeout(");
wire(!hasIdentCall(ch.testSource, "setTimeout"), "测试无 setTimeout(");
wire(!hasIdentCall(ch.assignment, "setInterval"), "作业骨架无 setInterval(");
wire(!hasIdentCall(ch.testSource, "setInterval"), "测试无 setInterval(");
wire(!hasIdentCall(ch.assignment, "queueMicrotask"), "作业骨架无 queueMicrotask(");
wire(!hasIdentCall(ch.testSource, "queueMicrotask"), "测试无 queueMicrotask(");
wire(!hasIdentCall(ch.assignment, "fetch"), "作业骨架无 fetch(");
wire(!hasIdentCall(ch.testSource, "fetch"), "测试无 fetch(");
wire(!ch.testSource.includes(".toThrow"), "测试无 .toThrow");
wire(!ch.testSource.includes(".toContain"), "测试无 .toContain");
wire(
  ["toBe", "toEqual", "toBeNull", "toBeInstanceOf"].some((m) => ch.testSource.includes(m)),
  "测试使用允许的 expect matcher",
);

for (const f of ch.functions) {
  wire(!hasIdentCall(f.skeleton, "setTimeout"), `${f.name} skeleton 无 setTimeout(`);
}

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
