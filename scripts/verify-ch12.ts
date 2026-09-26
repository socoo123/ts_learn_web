/**
 * 用标准答案跑一遍 Ch12 测试，确认生成的 JSON 能绿。
 * 运行：bun scripts/verify-ch12.ts
 */
import chapter from "../src/content/chapters/ch12.json";
import shared from "../src/content/shared.json";
import { runFunctionTest } from "../assets/js/runner-core.js";
import type { FuncDef, Section } from "../src/types";

const solutions: Record<string, string> = {
  messageViewModel: `export function messageViewModel(msg: ChatMessage): {
  roleLabel: string;
  text: string;
  align: "left" | "right";
} {
  if (msg.role === "user") {
    return { roleLabel: "你", text: msg.content, align: "right" };
  }
  return { roleLabel: "助手", text: msg.content, align: "left" };
}`,
  bubbleClassName: `export function bubbleClassName(role: ChatRole): string {
  return role === "user" ? "bubble bubble-user" : "bubble bubble-assistant";
}`,
  splitUserAssistant: `export function splitUserAssistant(messages: ChatMessage[]): {
  user: ChatMessage[];
  assistant: ChatMessage[];
} {
  return {
    user: messages.filter((m) => m.role === "user"),
    assistant: messages.filter((m) => m.role === "assistant"),
  };
}`,
  shouldShowTime: `export function shouldShowTime(prev: ChatMessage | null, curr: ChatMessage): boolean {
  if (prev === null) return true;
  return curr.ts - prev.ts >= 5 * 60 * 1000;
}`,
  threadTitle: `export function threadTitle(messages: ChatMessage[]): string {
  const first = messages.find((m) => m.role === "user");
  if (!first) return "新对话";
  return first.content.length > 20 ? first.content.slice(0, 20) + "…" : first.content;
}`,
  emptyStateText: `export function emptyStateText(hasMessages: boolean, isLoading: boolean): string {
  if (isLoading) return "助手正在输入…";
  if (!hasMessages) return "还没有消息，问一个商品问题吧";
  return "";
}`,
  countUnread: `export function countUnread(messages: ChatMessage[], lastReadId: string | null): number {
  let start = 0;
  if (lastReadId !== null) {
    const idx = messages.findIndex((m) => m.id === lastReadId);
    if (idx >= 0) start = idx + 1;
  }
  let n = 0;
  for (let i = start; i < messages.length; i++) {
    if (messages[i].role === "assistant") n++;
  }
  return n;
}`,
};

const expectedNames = [
  "messageViewModel",
  "bubbleClassName",
  "splitUserAssistant",
  "shouldShowTime",
  "threadTitle",
  "emptyStateText",
  "countUnread",
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

wire(ch.id === "ch12", `id === ch12 (got ${ch.id})`);
wire(ch.num === "12", `num === 12 (got ${ch.num})`);
wire(ch.title === "组件化心智", `title (got ${ch.title})`);
wire(ch.runMode === "browser", `runMode === browser (got ${ch.runMode})`);
wire(ch.testName === "ch12_assignment", `testName (got ${ch.testName})`);
wire(ch.interleaved === true, "interleaved === true");
wire(ch.tutorialMd.startsWith("# Ch12 · 组件化心智"), "H1");
wire(ch.tutorialMd.includes("作业 ↔ 教程对应表"), "front matter 对应表");
wire(ch.tutorialMd.includes("Ch13"), "下一步指向 Ch13");
wire(ch.tutorialMd.includes("React：组件、props、state 心智"), "下一步标题含 Ch13 全名");
wire(ch.tutorialMd.includes("```mermaid"), "至少 1 个 mermaid");
wire(ch.tutorialMd.includes("color:#1f1f1f"), "mermaid 带 color:#1f1f1f");
wire(ch.preamble.includes("ChatRole"), "preamble 含 ChatRole");
wire(ch.preamble.includes("ChatMessage"), "preamble 含 ChatMessage");
wire(ch.preamble.includes("UI = f(state)") || ch.preamble.includes("f(state)"), "preamble 含 f(state)");

wire(!/^\s*import\s+.*\breact\b/im.test(ch.assignment), "assignment 无 react import");
wire(!/\bjsx\b/i.test(ch.assignment), "assignment 无 jsx");
wire(!/\buseState\b/.test(ch.assignment), "assignment 无 useState");
wire(!/^\s*import\s+/m.test(ch.assignment), "assignment 无 import");
wire(!/^\s*import\s+/m.test(ch.testSource), "testSource 无 import");
wire(!/node:fs/.test(ch.assignment + ch.testSource + ch.preamble), "无 node:fs");
wire(!/\bfetch\s*\(/.test(ch.assignment + ch.testSource), "无 fetch(");

wire(ch.reviewMd.includes("f(state)"), "闪卡覆盖 f(state)");
wire(ch.reviewMd.includes("JSP"), "闪卡覆盖 JSP");
wire(ch.reviewMd.includes("未读"), "闪卡覆盖未读");
wire(ch.reviewMd.includes("…"), "闪卡覆盖省略号");
wire(ch.reviewMd.includes("loading") || ch.reviewMd.includes("正在输入"), "闪卡覆盖 loading 优先");

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

const secNums = ["12.1", "12.2", "12.3", "12.4", "12.5", "12.6", "12.7"];
for (const n of secNums) {
  const s = ch.sections.find((x) => x.secNum === n);
  wire(!!s && s.heading.includes("§" + n), `H2 含 §${n}`);
}

wire(
  ch.sections.find((s) => s.secNum === "12.1")?.exerciseFunctions.includes("messageViewModel") === true,
  "§12.1 → messageViewModel",
);
wire(
  ch.sections.find((s) => s.secNum === "12.2")?.exerciseFunctions.includes("bubbleClassName") === true,
  "§12.2 → bubbleClassName",
);
wire(
  ch.sections.find((s) => s.secNum === "12.3")?.exerciseFunctions.includes("splitUserAssistant") === true,
  "§12.3 → splitUserAssistant",
);
wire(
  ch.sections.find((s) => s.secNum === "12.4")?.exerciseFunctions.includes("shouldShowTime") === true,
  "§12.4 → shouldShowTime",
);
wire(
  ch.sections.find((s) => s.secNum === "12.5")?.exerciseFunctions.includes("threadTitle") === true,
  "§12.5 → threadTitle",
);
wire(
  ch.sections.find((s) => s.secNum === "12.6")?.exerciseFunctions.includes("emptyStateText") === true,
  "§12.6 → emptyStateText",
);
wire(
  ch.sections.find((s) => s.secNum === "12.7")?.exerciseFunctions.includes("countUnread") === true,
  "§12.7 → countUnread",
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
