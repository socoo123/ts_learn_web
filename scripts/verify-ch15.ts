/**
 * 用标准答案跑一遍 Ch15 测试，确认生成的 JSON 能绿。
 * 运行：bun scripts/verify-ch15.ts
 */
import chapter from "../src/content/chapters/ch15.json";
import shared from "../src/content/shared.json";
import { runFunctionTest } from "../assets/js/runner-core.js";
import type { FuncDef, Section } from "../src/types";

const solutions: Record<string, string> = {
  controlledInputNext: `export function controlledInputNext(prev: string, incoming: string, maxLen: number): string {
  return incoming.length <= maxLen ? incoming : prev;
}`,
  validatePrompt: `export function validatePrompt(text: string): "ok" | "empty" | "too_long" {
  const t = text.trim();
  if (t.length === 0) return "empty";
  if (t.length > 200) return "too_long";
  return "ok";
}`,
  trimAndRejectEmpty: `export function trimAndRejectEmpty(text: string): string | null {
  const t = text.trim();
  return t.length === 0 ? null : t;
}`,
  listKeysUnique: `export function listKeysUnique(keys: string[]): boolean {
  return new Set(keys).size === keys.length;
}`,
  scrollPinDecision: `export function scrollPinDecision(
  userNearBottom: boolean,
  isOwnMessage: boolean,
): "pin" | "stay" {
  return userNearBottom || isOwnMessage ? "pin" : "stay";
}`,
  renderLines: `export function renderLines(content: string): string[] {
  if (content === "") return [];
  return content.split("\\n");
}`,
  buildOutgoingMessage: `export function buildOutgoingMessage(text: string, nowMs: number): OutgoingMessage | null {
  if (validatePrompt(text) !== "ok") return null;
  const content = trimAndRejectEmpty(text);
  if (content === null) return null;
  return { id: \`user-\${nowMs}\`, role: "user", content, ts: nowMs };
}`,
};

const expectedNames = [
  "controlledInputNext",
  "validatePrompt",
  "trimAndRejectEmpty",
  "listKeysUnique",
  "scrollPinDecision",
  "renderLines",
  "buildOutgoingMessage",
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

wire(ch.id === "ch15", `id === ch15 (got ${ch.id})`);
wire(ch.num === "15", `num === 15 (got ${ch.num})`);
wire(ch.title === "表单与列表（Chat UI 基础）", `title (got ${ch.title})`);
wire(ch.runMode === "browser", `runMode === browser (got ${ch.runMode})`);
wire(ch.testName === "ch15_assignment", `testName (got ${ch.testName})`);
wire(ch.interleaved === true, "interleaved === true");
wire(ch.tutorialMd.startsWith("# Ch15 · 表单与列表（Chat UI 基础）"), "H1");
wire(ch.tutorialMd.includes("作业 ↔ 教程对应表"), "front matter 对应表");
wire(ch.tutorialMd.includes("Ch16"), "下一步指向 Ch16");
wire(ch.tutorialMd.includes("路由与数据获取心智"), "下一步含 路由与数据获取心智");
wire(ch.preamble.includes("type ChatRole"), "preamble 含 ChatRole");
wire(ch.preamble.includes("type OutgoingMessage"), "preamble 含 OutgoingMessage");

wire(!/from\s+["']react["']/.test(ch.assignment), 'assignment 无 from "react"');
wire(!/from\s+["']react["']/.test(ch.testSource), 'testSource 无 from "react"');
wire(!/^\s*import\s+/m.test(ch.assignment), "assignment 无 import");
wire(!/^\s*import\s+/m.test(ch.testSource), "testSource 无 import");

wire(ch.reviewMd.includes("受控"), "闪卡覆盖 受控");
wire(ch.reviewMd.includes("key"), "闪卡覆盖 key");
wire(ch.reviewMd.includes("pin"), "闪卡覆盖 pin");

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

const buildSkel = ch.functions.find((f) => f.name === "buildOutgoingMessage")?.skeleton ?? "";
wire(
  buildSkel.includes("validatePrompt") || buildSkel.includes("trimAndRejectEmpty"),
  "buildOutgoingMessage 骨架提示调用 validatePrompt 或 trimAndRejectEmpty",
);

const secNums = ["15.1", "15.2", "15.3", "15.4", "15.5", "15.6", "15.7"];
for (const n of secNums) {
  const s = ch.sections.find((x) => x.secNum === n);
  wire(!!s && s.heading.includes("§" + n), `H2 含 §${n}`);
}

wire(
  ch.sections.find((s) => s.secNum === "15.1")?.exerciseFunctions.includes("controlledInputNext") ===
    true,
  "§15.1 → controlledInputNext",
);
wire(
  ch.sections.find((s) => s.secNum === "15.2")?.exerciseFunctions.includes("validatePrompt") === true,
  "§15.2 → validatePrompt",
);
wire(
  ch.sections.find((s) => s.secNum === "15.3")?.exerciseFunctions.includes("trimAndRejectEmpty") ===
    true,
  "§15.3 → trimAndRejectEmpty",
);
wire(
  ch.sections.find((s) => s.secNum === "15.4")?.exerciseFunctions.includes("listKeysUnique") === true,
  "§15.4 → listKeysUnique",
);
wire(
  ch.sections.find((s) => s.secNum === "15.5")?.exerciseFunctions.includes("scrollPinDecision") ===
    true,
  "§15.5 → scrollPinDecision",
);
wire(
  ch.sections.find((s) => s.secNum === "15.6")?.exerciseFunctions.includes("renderLines") === true,
  "§15.6 → renderLines",
);
wire(
  ch.sections.find((s) => s.secNum === "15.7")?.exerciseFunctions.includes("buildOutgoingMessage") ===
    true,
  "§15.7 → buildOutgoingMessage",
);

wire(ch.testSource.includes("slice") || ch.testSource.includes("超长不"), "测试覆盖超长不 slice");
wire(ch.testSource.includes("m1") && ch.testSource.includes("重复"), "测试覆盖重复 key");

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
