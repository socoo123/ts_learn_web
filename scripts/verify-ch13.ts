/**
 * 用标准答案跑一遍 Ch13 测试，确认生成的 JSON 能绿。
 * 运行：bun scripts/verify-ch13.ts
 */
import chapter from "../src/content/chapters/ch13.json";
import shared from "../src/content/shared.json";
import { runFunctionTest } from "../src/lib/tsRunner";
import type { FuncDef, Section } from "../src/types";

const solutions: Record<string, string> = {
  appendMessage: `export function appendMessage(messages: ChatMessage[], msg: ChatMessage): ChatMessage[] {
  return [...messages, msg];
}`,
  updateMessageContent: `export function updateMessageContent(
  messages: ChatMessage[],
  id: string,
  content: string,
): ChatMessage[] {
  return messages.map((m) => (m.id === id ? { ...m, content } : m));
}`,
  removeMessage: `export function removeMessage(messages: ChatMessage[], id: string): ChatMessage[] {
  return messages.filter((m) => m.id !== id);
}`,
  toggleTyping: `export function toggleTyping(state: ChatState): ChatState {
  return { ...state, typing: !state.typing };
}`,
  initChatState: `export function initChatState(): ChatState {
  return { messages: [], typing: false };
}`,
  reduceChat: `export function reduceChat(state: ChatState, action: ChatAction): ChatState {
  switch (action.type) {
    case "append":
      return { messages: appendMessage(state.messages, action.message), typing: false };
    case "update":
      return { ...state, messages: updateMessageContent(state.messages, action.id, action.content) };
    case "remove":
      return { ...state, messages: removeMessage(state.messages, action.id) };
    case "toggleTyping":
      return toggleTyping(state);
    case "reset":
      return initChatState();
    default:
      return state;
  }
}`,
};

const expectedNames = [
  "appendMessage",
  "updateMessageContent",
  "removeMessage",
  "toggleTyping",
  "initChatState",
  "reduceChat",
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

wire(ch.id === "ch13", `id === ch13 (got ${ch.id})`);
wire(ch.num === "13", `num === 13 (got ${ch.num})`);
wire(ch.title === "React：组件、props、state 心智", `title (got ${ch.title})`);
wire(ch.runMode === "browser", `runMode === browser (got ${ch.runMode})`);
wire(ch.testName === "ch13_assignment", `testName (got ${ch.testName})`);
wire(ch.interleaved === true, "interleaved === true");
wire(ch.tutorialMd.startsWith("# Ch13 · React：组件、props、state 心智"), "H1");
wire(ch.tutorialMd.includes("作业 ↔ 教程对应表"), "front matter 对应表");
wire(ch.tutorialMd.includes("Ch14"), "下一步指向 Ch14");
wire(ch.tutorialMd.includes("hooks 心智"), "下一步含 hooks 心智");
wire(ch.preamble.includes("type ChatMessage"), "preamble 含 ChatMessage");
wire(ch.preamble.includes("type ChatState"), "preamble 含 ChatState");
wire(ch.preamble.includes("type ChatAction"), "preamble 含 ChatAction");

wire(!/from\s+["']react["']/.test(ch.assignment), 'assignment 无 from "react"');
wire(!/from\s+["']react["']/.test(ch.testSource), 'testSource 无 from "react"');
wire(!/^\s*import\s+/m.test(ch.assignment), "assignment 无 import");
wire(!/^\s*import\s+/m.test(ch.testSource), "testSource 无 import");

wire(
  ch.tutorialMd.includes("<") && (ch.tutorialMd.includes("props") || ch.tutorialMd.includes("Bubble")),
  "教程含 JSX 示例（< 与 props/Bubble）",
);

wire(ch.reviewMd.includes("不可变"), "闪卡覆盖 不可变");
wire(ch.reviewMd.includes("push"), "闪卡覆盖 push");
wire(ch.reviewMd.includes("props"), "闪卡覆盖 props");

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
  wire(!f.skeleton.includes(".push("), `${f.name} 骨架无 .push(`);
  wire(ch.tutorialMd.includes("`" + f.name + "`"), `对应表含 ${f.name}`);
  wire(
    ch.sections.some((s) => s.exerciseFunctions.includes(f.name)),
    `${f.name} 挂在某节 exerciseFunctions`,
  );
}

wire(
  ch.functions.find((f) => f.name === "reduceChat")?.skeleton.includes("appendMessage") === true,
  "reduceChat 骨架提示调用 appendMessage",
);

const secNums = ["13.1", "13.2", "13.3", "13.4", "13.5", "13.6"];
for (const n of secNums) {
  const s = ch.sections.find((x) => x.secNum === n);
  wire(!!s && s.heading.includes("§" + n), `H2 含 §${n}`);
}

wire(
  ch.sections.find((s) => s.secNum === "13.1")?.exerciseFunctions.includes("appendMessage") === true,
  "§13.1 → appendMessage",
);
wire(
  ch.sections.find((s) => s.secNum === "13.2")?.exerciseFunctions.includes("updateMessageContent") ===
    true,
  "§13.2 → updateMessageContent",
);
wire(
  ch.sections.find((s) => s.secNum === "13.3")?.exerciseFunctions.includes("removeMessage") === true,
  "§13.3 → removeMessage",
);
wire(
  ch.sections.find((s) => s.secNum === "13.4")?.exerciseFunctions.includes("toggleTyping") === true,
  "§13.4 → toggleTyping",
);
wire(
  ch.sections.find((s) => s.secNum === "13.5")?.exerciseFunctions.includes("initChatState") === true,
  "§13.5 → initChatState",
);
wire(
  ch.sections.find((s) => s.secNum === "13.6")?.exerciseFunctions.includes("reduceChat") === true,
  "§13.6 → reduceChat",
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
