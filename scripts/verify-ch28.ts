/**
 * 用标准答案跑一遍 Ch28 测试，确认生成的 JSON 与 local 能绿。
 * 运行：bun scripts/verify-ch28.ts
 */
import { spawnSync } from "node:child_process";
import { cpSync, existsSync, mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import chapter from "../src/content/chapters/ch28.json";
import shared from "../src/content/shared.json";
import { runFunctionTest } from "../assets/js/runner-core.js";
import type { FuncDef, Section } from "../src/types";

const solutions: Record<string, string> = {
  loopContinues: `export function loopContinues(stopReason: string, toolCallCount: number): boolean {
  return stopReason === "toolUse" && toolCallCount > 0;
}`,
  nextPhase: `export function nextPhase(turn: TurnSnapshot): LoopPhase {
  if (turn.stopReason === "error" || turn.stopReason === "aborted") return "end";
  if (turn.stopReason === "toolUse" && turn.toolCallCount > 0) return "tools";
  if (turn.steering > 0 || turn.followUp > 0) return "llm";
  return "end";
}`,
  orderAgentEvents: `export function orderAgentEvents(events: AgentEventSim[]): boolean {
  if (events.length === 0) return false;
  if (events[0].type !== "agent_start") return false;
  if (events[events.length - 1].type !== "agent_end") return false;
  const inner = events.slice(1, -1);
  let j = 0;
  let sawTurn = false;
  while (j < inner.length) {
    if (inner[j].type !== "turn_start") return false;
    j++;
    let messageOpen = false;
    let toolOpen = false;
    while (j < inner.length && inner[j].type !== "turn_end") {
      const t = inner[j].type;
      if (t === "message_start") {
        if (messageOpen) return false;
        messageOpen = true;
      } else if (t === "message_update") {
        if (!messageOpen) return false;
      } else if (t === "message_end") {
        if (!messageOpen) return false;
        messageOpen = false;
      } else if (t === "tool_execution_start") {
        if (toolOpen) return false;
        toolOpen = true;
      } else if (t === "tool_execution_update") {
        if (!toolOpen) return false;
      } else if (t === "tool_execution_end") {
        if (!toolOpen) return false;
        toolOpen = false;
      } else {
        return false;
      }
      j++;
    }
    if (j >= inner.length) return false;
    if (messageOpen || toolOpen) return false;
    j++;
    sawTurn = true;
  }
  return sawTurn;
}`,
  splitTurns: `export function splitTurns(events: AgentEventSim[]): AgentEventSim[][] {
  const groups: AgentEventSim[][] = [];
  let current: AgentEventSim[] | null = null;
  for (const e of events) {
    if (e.type === "turn_start") {
      current = [e];
    } else if (current !== null) {
      current.push(e);
      if (e.type === "turn_end") {
        groups.push(current);
        current = null;
      }
    }
  }
  if (current !== null) groups.push(current);
  return groups;
}`,
  deliverQueuedAt: `export function deliverQueuedAt(kind: QueueKind, gap: LoopGap): boolean {
  if (kind === "steer") return gap === "loop-start" || gap === "after-turn-end";
  return gap === "would-stop";
}`,
  agentStateAfter: `export function agentStateAfter(state: SimAgentState, incoming: SimMessage[]): SimAgentState {
  return { ...state, messages: [...state.messages, ...incoming] };
}`,
  isSettled: `export function isSettled(events: AgentEventSim[]): boolean {
  if (events.length === 0) return false;
  if (events[events.length - 1].type !== "agent_settled") return false;
  return events.some((e) => e.type === "agent_end");
}`,
};

const expectedNames = [
  "loopContinues",
  "nextPhase",
  "orderAgentEvents",
  "splitTurns",
  "deliverQueuedAt",
  "agentStateAfter",
  "isSettled",
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
  localHint?: string;
  functions: FuncDef[];
  sections: Section[];
};

let wiringFailed = 0;

function wire(ok: boolean, msg: string) {
  console.log(ok ? `WIRE PASS  ${msg}` : `WIRE FAIL  ${msg}`);
  if (!ok) wiringFailed++;
}

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const localDir = join(root, "local/m6/ch28");

wire(ch.id === "ch28", `id === ch28 (got ${ch.id})`);
wire(ch.num === "28", `num === 28 (got ${ch.num})`);
wire(ch.title === "Agent 循环怎么转（读 pi-agent-core）", `title (got ${ch.title})`);
wire(ch.runMode === "local", `runMode === local (got ${ch.runMode})`);
wire(ch.testName === "ch28_assignment", `testName (got ${ch.testName})`);
wire(ch.interleaved === true, "interleaved === true");
wire(ch.localHint === "bun test local/m6/ch28", `localHint (got ${ch.localHint})`);
wire(ch.tutorialMd.startsWith("# Ch28 · Agent 循环怎么转（读 pi-agent-core）"), "H1");
wire(ch.tutorialMd.includes("作业 ↔ 教程对应表"), "front matter 对应表");
const mermaidCount = ch.tutorialMd.split("```mermaid").length - 1;
wire(mermaidCount >= 5 && mermaidCount <= 8, `mermaid 5–8 张 (got ${mermaidCount})`);
wire(ch.tutorialMd.includes("color:#1f1f1f"), "mermaid 带 color:#1f1f1f");
wire(ch.tutorialMd.includes("CompletableFuture"), "Java 对照 CompletableFuture");
wire(ch.tutorialMd.includes("asyncio"), "Python 对照 asyncio");
wire(ch.tutorialMd.includes("pi-agent-core"), "教程含 pi-agent-core");
wire(ch.tutorialMd.includes("agent-loop"), "教程含 agent-loop");
wire(ch.tutorialMd.includes("stopReason"), "教程含 stopReason");
wire(ch.tutorialMd.includes("toolUse"), "教程含 toolUse");
wire(ch.tutorialMd.includes("agent_settled"), "教程含 agent_settled");
wire(ch.tutorialMd.includes("agent_end"), "教程含 agent_end");
wire(ch.tutorialMd.includes("turn_start") && ch.tutorialMd.includes("turn_end"), "教程含 turn 边界");
wire(ch.tutorialMd.includes("AgentState"), "教程含 AgentState");
wire(ch.tutorialMd.includes("streamingMessage"), "教程含 streamingMessage");
wire(ch.tutorialMd.includes("steer") && ch.tutorialMd.includes("followUp"), "教程含 steer/followUp");
wire(ch.tutorialMd.includes("queue_update") || ch.tutorialMd.includes("streamingBehavior"), "教程含队列 API");
wire(ch.tutorialMd.includes("packages/agent"), "教程含 packages/agent");
wire(ch.tutorialMd.includes("@earendil-works"), "教程指明事实源包名");
wire(ch.tutorialMd.includes("clone"), "教程说明不 clone");
for (const n of expectedNames) {
  wire(ch.tutorialMd.includes(n), `教程含 ${n}`);
}
wire(ch.tutorialMd.includes("无线鼠标"), "教程含无线鼠标（商品铺主线）");
wire(ch.tutorialMd.includes("机械键盘"), "教程含机械键盘（商品铺主线）");
wire(ch.tutorialMd.includes("Ch29"), "教程预告 Ch29");
wire(
  !ch.tutorialMd.includes("bun add @mariozechner") &&
    !ch.tutorialMd.includes("npm install @mariozechner"),
  "不教安装过时 @mariozechner",
);

const homeworkBlob = `${ch.assignment}\n${ch.testSource}\n${ch.preamble}`;
wire(!/^\s*import\s+/m.test(ch.assignment), "JSON assignment 无 import");
wire(!/^\s*import\s+/m.test(ch.testSource), "testSource 无 import");
wire(!/^\s*import\s+/m.test(ch.preamble), "preamble 无 import");
wire(!/\bhono\b/i.test(homeworkBlob), "JSON 作业侧无 hono");
wire(!homeworkBlob.includes("@earendil-works"), "JSON 作业侧无 @earendil-works");
wire(!homeworkBlob.includes("pi-coding-agent"), "JSON 作业侧无 pi-coding-agent");
wire(!/\bfetch\s*\(/.test(homeworkBlob), "JSON 作业侧无 fetch(");
wire(!/\bsetTimeout\s*\(/.test(homeworkBlob), "JSON 作业侧无 setTimeout(");

wire(ch.preamble.includes("type LoopPhase"), "preamble 含 LoopPhase");
wire(ch.preamble.includes("type TurnSnapshot"), "preamble 含 TurnSnapshot");
wire(ch.preamble.includes("type AgentEventSim"), "preamble 含 AgentEventSim");
wire(ch.preamble.includes("type QueueKind"), "preamble 含 QueueKind");
wire(ch.preamble.includes("type LoopGap"), "preamble 含 LoopGap");
wire(ch.preamble.includes("type SimMessage"), "preamble 含 SimMessage");
wire(ch.preamble.includes("type SimAgentState"), "preamble 含 SimAgentState");
wire(ch.preamble.includes("bun test local/m6/ch28"), "preamble 含本地命令");

wire(ch.reviewMd.includes("agent_settled"), "闪卡含 agent_settled");
wire(ch.reviewMd.includes("steer"), "闪卡含 steer");
wire(ch.reviewMd.includes("followUp"), "闪卡含 followUp");
wire(ch.reviewMd.includes("toolUse"), "闪卡含 toolUse");
wire(ch.reviewMd.includes("turn"), "闪卡含 turn 边界");

const fnNames = ch.functions.map((f) => f.name);
wire(
  expectedNames.length === fnNames.length && expectedNames.every((n, i) => n === fnNames[i]),
  `functions 顺序一致 [${fnNames.join(", ")}]`,
);

for (const f of ch.functions) {
  wire(f.testSuite === f.name, `testSuite === name (${f.name})`);
  wire(f.skeleton.includes(`export function ${f.name}`), `export function ${f.name}`);
  wire(f.skeleton.includes('throw new Error("TODO")'), `${f.name} skeleton TODO`);
  wire(f.skeleton.includes("【场景】") && f.skeleton.includes("【转换点】"), `${f.name} 场景/转换点`);
  wire(ch.tutorialMd.includes("`" + f.name + "`"), `对应表含 ${f.name}`);
  wire(
    ch.sections.some((s) => s.exerciseFunctions.includes(f.name)),
    `${f.name} 挂在某节 exerciseFunctions`,
  );
}

const secNums = ["28.1", "28.2", "28.3", "28.4", "28.5", "28.6", "28.7"];
for (const n of secNums) {
  const s = ch.sections.find((x) => x.secNum === n);
  wire(!!s && s.heading.includes("§" + n), `H2 含 §${n}`);
}

const secFnPairs: Array<[string, string]> = [
  ["28.1", "loopContinues"],
  ["28.2", "nextPhase"],
  ["28.3", "orderAgentEvents"],
  ["28.4", "splitTurns"],
  ["28.5", "deliverQueuedAt"],
  ["28.6", "agentStateAfter"],
  ["28.7", "isSettled"],
];
for (const [n, fn] of secFnPairs) {
  wire(
    ch.sections.find((s) => s.secNum === n)?.exerciseFunctions.includes(fn) === true,
    `§${n} → ${fn}`,
  );
}

const forbiddenMatchers = [".toThrow", ".toContain", ".toMatch", ".toBeTruthy", ".toBeFalsy"];
for (const m of forbiddenMatchers) {
  wire(!ch.testSource.includes(m), `expect 不用 ${m}`);
}
wire(ch.testSource.includes(".toBe("), "JSON 测试含 toBe");
wire(ch.testSource.includes(".toEqual("), "JSON 测试含 toEqual");
wire(ch.testSource.includes("Object.freeze"), "JSON 测试 freeze");
wire(ch.testSource.includes("机械键盘"), "JSON 测试含机械键盘");
wire(ch.testSource.includes("无线鼠标") || ch.testSource.includes("MS-002"), "JSON 测试含无线鼠标或 MS-002");
wire(ch.testSource.includes("agent_settled"), "JSON 测试含 agent_settled");
wire(ch.testSource.includes("would-stop"), "JSON 测试含 would-stop 缝隙");
wire(
  ch.testSource.includes('"error"') && ch.testSource.includes('"aborted"'),
  "JSON 测试防只看 toolUse",
);

const localFiles = ["assignment.ts", "assignment.test.ts", "demo.ts"];
for (const name of localFiles) {
  wire(existsSync(join(localDir, name)), `local 存在 ${name}`);
}
wire(!existsSync(join(localDir, "app.ts")), "M6 章无 app.ts（研究章）");

const assignmentLocal = existsSync(join(localDir, "assignment.ts"))
  ? readFileSync(join(localDir, "assignment.ts"), "utf8")
  : "";
const testLocal = existsSync(join(localDir, "assignment.test.ts"))
  ? readFileSync(join(localDir, "assignment.test.ts"), "utf8")
  : "";
const demoLocal = existsSync(join(localDir, "demo.ts"))
  ? readFileSync(join(localDir, "demo.ts"), "utf8")
  : "";

wire(assignmentLocal.includes('throw new Error("TODO")'), "local assignment 含 TODO");
for (const n of expectedNames) {
  wire(
    assignmentLocal.includes(`export function ${n}`),
    `local assignment export function ${n}`,
  );
}
wire(!assignmentLocal.includes("pi-coding-agent"), "local assignment 无 pi-coding-agent");
wire(!assignmentLocal.includes("@earendil-works"), "local assignment 无 @earendil-works");
wire(!/\bhono\b/i.test(assignmentLocal), "local assignment 无 hono");
wire(!/^\s*import\s+/m.test(assignmentLocal), "local assignment 无 import（本章不用 zod）");
wire(testLocal.includes("bun:test"), "local test 用 bun:test");
for (const n of expectedNames) {
  wire(testLocal.includes(n), `local test 含 ${n}`);
}
wire(testLocal.includes("Object.freeze"), "local test freeze");
wire(!testLocal.includes("pi-coding-agent") && !testLocal.includes("@earendil-works"), "local test 不 import 真包");
wire(!testLocal.includes("demo.ts") && !testLocal.includes("./demo"), "local test 不 import demo.ts");
wire(demoLocal.includes("agent-loop"), "demo.ts 含 agent-loop 复制区");
wire(demoLocal.includes("subscribe"), "demo.ts 含事件订阅复制区");
wire(demoLocal.includes("steer") && demoLocal.includes("followUp"), "demo.ts 含 steer/followUp 复制区");
wire(demoLocal.includes("agent.state") || demoLocal.includes("AgentState"), "demo.ts 含 AgentState 复制区");
wire(demoLocal.includes("无 Key") || demoLocal.includes("不需要 Key") || demoLocal.includes("不需要 API Key"), "demo.ts 注明无 Key");
wire(demoLocal.includes("clone"), "demo.ts 说明不 clone");
const demoWithoutStrings = demoLocal.replace(/`[\s\S]*?`/g, "").replace(/\/\*[\s\S]*?\*\//g, "");
wire(!/\bfetch\s*\(/.test(demoWithoutStrings), "demo.ts 去掉字符串后无真 fetch(");
wire(
  !/^(?:import|export)\s.+\sfrom\s+['"]@earendil-works/m.test(demoWithoutStrings),
  "demo.ts 去掉字符串后无真 import 包",
);

// tutorialMd 必须能由 sections 机械重拼（公式同 gen 脚本）
const rebuilt = `# Ch28 · Agent 循环怎么转（读 pi-agent-core）\n\n${ch.sections
  .map((s) => (s.heading ? `## ${s.heading}\n\n${s.body}` : s.body))
  .join("\n\n")}\n`;
wire(rebuilt === ch.tutorialMd, "tutorialMd 与 sections 重拼一致");

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

mkdirSync(join(root, "local/m6"), { recursive: true });
const tmp = mkdtempSync(join(root, "local/m6", "ch28-verify-"));
try {
  cpSync(localDir, tmp, { recursive: true });
  const filled = `${ch.preamble}\n\n${ch.functions
    .map((f) => solutions[f.name])
    .join("\n\n")}\n`;
  writeFileSync(join(tmp, "assignment.ts"), filled);
  const r = spawnSync("bun", ["test", join(tmp, "assignment.test.ts")], {
    encoding: "utf8",
    cwd: root,
  });
  const bunOk = r.status === 0;
  console.log(bunOk ? "PASS bun test (mkdtemp + solutions)" : `FAIL bun test\n${r.stdout}\n${r.stderr}`);
  if (!bunOk) failed++;
  const stillTodo = readFileSync(join(localDir, "assignment.ts"), "utf8").includes(
    'throw new Error("TODO")',
  );
  if (!stillTodo) {
    console.error("FAIL student assignment.ts 被改掉了（应仍是 TODO）");
    failed++;
  } else {
    console.log("PASS student assignment.ts 仍是 TODO");
  }
} finally {
  rmSync(tmp, { recursive: true, force: true });
}

if (failed) {
  console.error(`\n${failed} suite(s) failed`);
  process.exit(1);
}
console.log("\nall green");
