/**
 * 生成 src/content/chapters/ch24.json 以及 local/m5/ch24/*
 * 运行：bun scripts/gen-ch24.ts
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const preamble = `/**
 * Ch24 作业：商品助手把 Agent 事件收成可测的纯函数。
 *
 * 场景：用户问「机械键盘还有货吗」，假事件数组依次吐
 * text_delta → tool_call(lookupProduct) → tool_result → agent_end。
 * 你抽出增量、折叠成快照、拦住 bash、审计调用、拼 UI 行。
 *
 * 没有供应商 Key 也能全绿：测的是事件数组，不是真 Agent。
 * 全绿 = 你掌握了 Ch24。
 */

type SessionEvent =
  | { type: "text_delta"; delta: string }
  | { type: "tool_call"; name: string; args: Record<string, unknown> }
  | { type: "tool_result"; name: string; ok: boolean; text: string }
  | { type: "agent_end" }
  | { type: "aborted" };

type BlockDecision = { block: true; reason: "forbidden" } | { block: false };

type Audit = { name: string; args: Record<string, unknown>; blocked: boolean };

type UiRow =
  | { kind: "assistant"; text: string }
  | { kind: "tool"; name: string; status: "call" | "ok" | "error" | "blocked"; text: string };

type SessionSnap = {
  text: string;
  tools: string[];
  ended: boolean;
  aborted: boolean;
};`;

const functions = [
  {
    name: "filterTextDeltas",
    testSuite: "filterTextDeltas",
    skeleton: `/**
 * 【场景】商品助手气泡要按到达顺序显示 token。用户问机械键盘库存，
 * 流里先「KB」再夹一次 lookupProduct，再「-001」。tool_* / agent_end / aborted 不是字，忽略。
 *
 * 【转换点】判别联合：\`type === "text_delta"\` 之后才有 \`delta\`。
 * Java 老手别写成一堆 instanceof；看 \`type\` 字段收窄即可。
 *
 * 任务：按原序返回每个 text_delta 的 delta。不要 mutate events。空数组 → []。
 * 示例：
 *   [{type:"text_delta",delta:"KB"},{type:"tool_call",name:"lookupProduct",args:{}},{type:"text_delta",delta:"-001"}]
 *     → ["KB","-001"]
 *   [{type:"text_delta",delta:"无"},{type:"text_delta",delta:"线鼠标"}] → ["无","线鼠标"]
 *   [] / 只有 agent_end → []
 *
 * 提示：filter + map。不要 join。忽略 tool_* / agent_end / aborted。
 */
export function filterTextDeltas(events: SessionEvent[]): string[] {
  throw new Error("TODO");
}`,
  },
  {
    name: "reduceSessionEvents",
    testSuite: "reduceSessionEvents",
    skeleton: `/**
 * 【场景】一次库存问答结束，UI 要一句全文、调过哪些工具、是否正常结束。
 *
 * 【转换点】必须调用 filterTextDeltas(events)，再 .join("")。
 * tools：每个 tool_call 的 name 按原序。ended / aborted：是否出现过该类型。
 *
 * 任务：返回 SessionSnap。空数组 → 全是空/false。
 * 示例：
 *   机械键盘：deltas 机+械键盘，一个 lookupProduct tool_call，末尾 agent_end
 *     → { text:"机械键盘", tools:["lookupProduct"], ended:true, aborted:false }
 *   无线鼠标 deltas + aborted、无 agent_end
 *     → { text:"无线鼠标", tools:[], ended:false, aborted:true }
 *   [] → { text:"", tools:[], ended:false, aborted:false }
 *
 * 提示：text 用 filterTextDeltas。不要 mutate。
 */
export function reduceSessionEvents(events: SessionEvent[]): SessionSnap {
  throw new Error("TODO");
}`,
  },
  {
    name: "blockDangerousTool",
    testSuite: "blockDangerousTool",
    skeleton: `/**
 * 【场景】课程商品助手只允许查货和算价。模型若吐 bash / write，必须拦住。
 * 这就是作业版 beforeToolCall。
 *
 * 【转换点】白名单：只有 lookupProduct 和 calcLineTotal 放行。
 * 其它一切（bash write edit rm "" lookup）→ { block:true, reason:"forbidden" }。
 *
 * 任务：返回 BlockDecision。放行对象不要带 reason 字段。
 * 示例：
 *   "lookupProduct" / "calcLineTotal" → { block:false }
 *   "bash" / "write" / "edit" / "rm" / "" / "lookup" → { block:true, reason:"forbidden" }
 *
 * 提示：=== 比较两个合法名。不要 includes("lookup")。
 */
export function blockDangerousTool(name: string): BlockDecision {
  throw new Error("TODO");
}`,
  },
  {
    name: "auditToolCall",
    testSuite: "auditToolCall",
    skeleton: `/**
 * 【场景】后台要记一笔审计：谁被调了、参数是什么、有没有拦。
 *
 * 【转换点】必须调用 blockDangerousTool(name)。
 * 返回 { name, args, blocked: blockDangerousTool(name).block }。
 * 不要 mutate args（测试会 freeze）。args 原样放进返回对象。
 *
 * 任务：返回 Audit。
 * 示例：
 *   ("lookupProduct", {sku:"KB-001"}) → { name:"lookupProduct", args:{sku:"KB-001"}, blocked:false }
 *   ("bash", {cmd:"ls"}) → { name:"bash", args:{cmd:"ls"}, blocked:true }
 *   ("write", {path:"/tmp/x"}) → blocked true
 *
 * 提示：可浅拷贝 args，但 toEqual 要与传入内容相同。
 */
export function auditToolCall(name: string, args: Record<string, unknown>): Audit {
  throw new Error("TODO");
}`,
  },
  {
    name: "abortFlag",
    testSuite: "abortFlag",
    skeleton: `/**
 * 【场景】用户点了停止。事件里会出现 aborted，不一定有 agent_end。
 *
 * 【转换点】存在任意 type === "aborted" → true，否则 false。空数组 false。
 * 不要 mutate。agent_end 不是 abort。
 *
 * 任务：返回 boolean。
 * 示例：
 *   [{type:"text_delta",delta:"机"},{type:"aborted"}] → true
 *   [{type:"agent_end"}] → false
 *   [] → false
 *
 * 提示：some。不要把 ended 当成 aborted。
 */
export function abortFlag(events: SessionEvent[]): boolean {
  throw new Error("TODO");
}`,
  },
  {
    name: "uiRowsFromEvents",
    testSuite: "uiRowsFromEvents",
    skeleton: `/**
 * 【场景】聊天区要画出助手气泡 + 工具行。这是 Ch26 接到网页之前的纯数据。
 *
 * 【转换点】必须调用 reduceSessionEvents 和 blockDangerousTool。
 * 1. const snap = reduceSessionEvents(events)
 * 2. 若 snap.text.length > 0，先 push { kind:"assistant", text: snap.text }
 * 3. 再按原序扫 tool_call（只有它触发工具行）：
 *    - blockDangerousTool(ev.name).block → { kind:"tool", name, status:"blocked", text:"forbidden" }
 *    - 否则在该 tool_call **之后**找**第一条**同名 tool_result：
 *        ok===true → status "ok"；ok===false → status "error"；找不到 → status "call" text ""
 * 4. 不要因为 aborted / agent_end 再多推一行（abort 用 abortFlag）
 *
 * 任务：返回 UiRow[]。空数组 → []。
 * 示例：
 *   查询成功（text_delta + lookupProduct 成功 + agent_end）→ assistant 行 + tool ok 行
 *   只有 bash tool_call → [{kind:"tool", name:"bash", status:"blocked", text:"forbidden"}]
 *   只有 calcLineTotal tool_call、无 result → status "call"
 *   lookupProduct + ok:false "未找到该 SKU" → status "error"（无 delta 则没有 assistant 行）
 *   [] → []
 *
 * 提示：先全文、再工具行。拦截了就不要再去配对 result。
 */
export function uiRowsFromEvents(events: SessionEvent[]): UiRow[] {
  throw new Error("TODO");
}`,
  },
];

const assignment = `${preamble}

${functions.map((f) => f.skeleton).join("\n\n")}
`;

const testSource = `const KB_OK: SessionEvent[] = [
  { type: "text_delta", delta: "KB-001 库存 120" },
  { type: "tool_call", name: "lookupProduct", args: { sku: "KB-001" } },
  { type: "tool_result", name: "lookupProduct", ok: true, text: "KB-001 机械键盘 库存 120 单价 599" },
  { type: "agent_end" },
];

const MOUSE_ABORT: SessionEvent[] = [
  { type: "text_delta", delta: "无" },
  { type: "text_delta", delta: "线鼠标" },
  { type: "aborted" },
];

describe("filterTextDeltas", () => {
  it("夹杂 tool_call 仍按序收 delta", () => {
    const events: SessionEvent[] = [
      { type: "text_delta", delta: "KB" },
      { type: "tool_call", name: "lookupProduct", args: {} },
      { type: "text_delta", delta: "-001" },
    ];
    Object.freeze(events);
    expect(filterTextDeltas(events)).toEqual(["KB", "-001"]);
    expect(events.length).toBe(3);
  });
  it("无线鼠标增量（防硬编码机械键盘）", () => {
    const events: SessionEvent[] = [
      { type: "text_delta", delta: "无" },
      { type: "text_delta", delta: "线鼠标" },
    ];
    Object.freeze(events);
    expect(filterTextDeltas(events)).toEqual(["无", "线鼠标"]);
  });
  it("空数组 / 只有 agent_end → []", () => {
    expect(filterTextDeltas([])).toEqual([]);
    const onlyEnd: SessionEvent[] = [{ type: "agent_end" }];
    Object.freeze(onlyEnd);
    expect(filterTextDeltas(onlyEnd)).toEqual([]);
    expect(onlyEnd.find((e) => e.type === "text_delta") ?? null).toBeNull();
  });
  it("忽略 tool_* / aborted，不 mutate", () => {
    const events: SessionEvent[] = [
      { type: "text_delta", delta: "机" },
      { type: "tool_call", name: "bash", args: { cmd: "ls" } },
      { type: "tool_result", name: "bash", ok: true, text: "x" },
      { type: "aborted" },
    ];
    Object.freeze(events);
    expect(filterTextDeltas(events)).toEqual(["机"]);
    expect(events.length).toBe(4);
  });
});

describe("reduceSessionEvents", () => {
  it("机械键盘 deltas + lookupProduct + agent_end", () => {
    const events: SessionEvent[] = [
      { type: "text_delta", delta: "机" },
      { type: "text_delta", delta: "械键盘" },
      { type: "tool_call", name: "lookupProduct", args: { sku: "KB-001" } },
      { type: "agent_end" },
    ];
    Object.freeze(events);
    expect(reduceSessionEvents(events)).toEqual({
      text: "机械键盘",
      tools: ["lookupProduct"],
      ended: true,
      aborted: false,
    });
  });
  it("无线鼠标 + aborted、无 agent_end（防硬编码）", () => {
    Object.freeze(MOUSE_ABORT);
    expect(reduceSessionEvents(MOUSE_ABORT)).toEqual({
      text: "无线鼠标",
      tools: [],
      ended: false,
      aborted: true,
    });
  });
  it("空数组全是空/false；两个工具按序", () => {
    expect(reduceSessionEvents([])).toEqual({
      text: "",
      tools: [],
      ended: false,
      aborted: false,
    });
    const two: SessionEvent[] = [
      { type: "tool_call", name: "lookupProduct", args: { sku: "KB-001" } },
      { type: "tool_call", name: "calcLineTotal", args: { qty: 2, unitPrice: 599 } },
    ];
    Object.freeze(two);
    expect(reduceSessionEvents(two)).toEqual({
      text: "",
      tools: ["lookupProduct", "calcLineTotal"],
      ended: false,
      aborted: false,
    });
  });
});

describe("blockDangerousTool", () => {
  it("课程只放行 lookupProduct / calcLineTotal", () => {
    expect(blockDangerousTool("lookupProduct")).toEqual({ block: false });
    expect(blockDangerousTool("calcLineTotal")).toEqual({ block: false });
    const allowed = blockDangerousTool("lookupProduct");
    expect(("reason" in allowed ? allowed.reason : null) ?? null).toBeNull();
  });
  it("bash / write / edit / rm / 空 / lookup 全拦", () => {
    expect(blockDangerousTool("bash")).toEqual({ block: true, reason: "forbidden" });
    expect(blockDangerousTool("write")).toEqual({ block: true, reason: "forbidden" });
    expect(blockDangerousTool("edit")).toEqual({ block: true, reason: "forbidden" });
    expect(blockDangerousTool("rm")).toEqual({ block: true, reason: "forbidden" });
    expect(blockDangerousTool("")).toEqual({ block: true, reason: "forbidden" });
    expect(blockDangerousTool("lookup")).toEqual({ block: true, reason: "forbidden" });
  });
  it("blocked 字段是 boolean", () => {
    expect(blockDangerousTool("lookupProduct").block).toBe(false);
    expect(blockDangerousTool("bash").block).toBe(true);
  });
});

describe("auditToolCall", () => {
  it("lookupProduct 不拦，args 原样", () => {
    const args: Record<string, unknown> = { sku: "KB-001" };
    Object.freeze(args);
    expect(auditToolCall("lookupProduct", args)).toEqual({
      name: "lookupProduct",
      args: { sku: "KB-001" },
      blocked: false,
    });
    expect(args).toEqual({ sku: "KB-001" });
  });
  it("bash / write 要拦（防硬编码只认 lookupProduct）", () => {
    const bashArgs: Record<string, unknown> = { cmd: "ls" };
    Object.freeze(bashArgs);
    expect(auditToolCall("bash", bashArgs)).toEqual({
      name: "bash",
      args: { cmd: "ls" },
      blocked: true,
    });
    expect(auditToolCall("write", { path: "/tmp/x" })).toEqual({
      name: "write",
      args: { path: "/tmp/x" },
      blocked: true,
    });
    expect(auditToolCall("calcLineTotal", { qty: 2, unitPrice: 599 })).toEqual({
      name: "calcLineTotal",
      args: { qty: 2, unitPrice: 599 },
      blocked: false,
    });
  });
  it("freeze args 后仍能 toEqual；不 mutate", () => {
    const args: Record<string, unknown> = { sku: "MS-002" };
    Object.freeze(args);
    const out = auditToolCall("lookupProduct", args);
    expect(out.blocked).toBe(false);
    expect(out.args).toEqual({ sku: "MS-002" });
    expect(args).toEqual({ sku: "MS-002" });
  });
});

describe("abortFlag", () => {
  it("有 aborted → true", () => {
    const events: SessionEvent[] = [
      { type: "text_delta", delta: "机" },
      { type: "aborted" },
    ];
    Object.freeze(events);
    expect(abortFlag(events)).toBe(true);
  });
  it("只有 agent_end / 空 → false", () => {
    expect(abortFlag([{ type: "agent_end" }])).toBe(false);
    expect(abortFlag([])).toBe(false);
    const ended: SessionEvent[] = [{ type: "agent_end" }];
    Object.freeze(ended);
    expect(ended.find((e) => e.type === "aborted") ?? null).toBeNull();
  });
  it("无线鼠标 aborted 也是 true（防硬编码）", () => {
    Object.freeze(MOUSE_ABORT);
    expect(abortFlag(MOUSE_ABORT)).toBe(true);
    expect(abortFlag(KB_OK)).toBe(false);
  });
});

describe("uiRowsFromEvents", () => {
  it("查询成功：assistant + tool ok", () => {
    Object.freeze(KB_OK);
    expect(uiRowsFromEvents(KB_OK)).toEqual([
      { kind: "assistant", text: "KB-001 库存 120" },
      {
        kind: "tool",
        name: "lookupProduct",
        status: "ok",
        text: "KB-001 机械键盘 库存 120 单价 599",
      },
    ]);
  });
  it("拦 bash；calcLineTotal 还在调", () => {
    const bash: SessionEvent[] = [
      { type: "tool_call", name: "bash", args: { cmd: "ls" } },
      { type: "agent_end" },
    ];
    Object.freeze(bash);
    expect(uiRowsFromEvents(bash)).toEqual([
      { kind: "tool", name: "bash", status: "blocked", text: "forbidden" },
    ]);
    const calling: SessionEvent[] = [
      { type: "tool_call", name: "calcLineTotal", args: { qty: 2, unitPrice: 599 } },
    ];
    Object.freeze(calling);
    expect(uiRowsFromEvents(calling)).toEqual([
      { kind: "tool", name: "calcLineTotal", status: "call", text: "" },
    ]);
  });
  it("失败结果无 assistant；空数组 []", () => {
    const missing: SessionEvent[] = [
      { type: "tool_call", name: "lookupProduct", args: { sku: "NO-SKU" } },
      { type: "tool_result", name: "lookupProduct", ok: false, text: "未找到该 SKU" },
    ];
    Object.freeze(missing);
    expect(uiRowsFromEvents(missing)).toEqual([
      { kind: "tool", name: "lookupProduct", status: "error", text: "未找到该 SKU" },
    ]);
    expect(uiRowsFromEvents([])).toEqual([]);
  });
  it("先全文再工具；aborted 不多推一行；拦了就不配对 result", () => {
    const laterText: SessionEvent[] = [
      { type: "tool_call", name: "lookupProduct", args: { sku: "KB-001" } },
      { type: "text_delta", delta: "稍后回复" },
    ];
    Object.freeze(laterText);
    expect(uiRowsFromEvents(laterText)).toEqual([
      { kind: "assistant", text: "稍后回复" },
      { kind: "tool", name: "lookupProduct", status: "call", text: "" },
    ]);
    expect(uiRowsFromEvents([{ type: "aborted" }])).toEqual([]);
    expect(uiRowsFromEvents([{ type: "agent_end" }])).toEqual([]);
    const blockedResult: SessionEvent[] = [
      { type: "tool_call", name: "bash", args: { cmd: "ls" } },
      { type: "tool_result", name: "bash", ok: true, text: "should ignore" },
    ];
    Object.freeze(blockedResult);
    expect(uiRowsFromEvents(blockedResult)).toEqual([
      { kind: "tool", name: "bash", status: "blocked", text: "forbidden" },
    ]);
  });
});
`;

function sec(
  id: string,
  heading: string,
  secNum: string | null,
  body: string,
  exerciseFunctions: string[],
) {
  return { id, heading, secNum, body, exerciseFunctions };
}

const sections = [
  sec(
    "intro",
    "",
    null,
    `> **预计**：1 天 ｜ **前置**：Ch23（最小 Agent + Tool）
> **目标**：① \`subscribe\` 看 \`text_delta\` / \`tool_call\`；② \`beforeToolCall\` 可拦危险工具；③ 用**假事件数组**抽出增量、快照、审计和 UI 行。
> 你 15 年 Java：Servlet \`Filter\` / Spring AOP 在调用前拦截。Python 课的 Flask/Django \`before_request\` 中间件是同一类闸门——本章把这扇闸接到 \`@earendil-works/pi-agent-core\`。Python 课已经讲过 RAG——本章**不重复**。

> 📐 **本教程的契约**：下面每一节（§24.1–§24.6）都**精确对应**作业里的题。讲过的才考，考的必讲过。卡住时按作业函数名回查对应小节。
> **不讲**：\`createAgentSession\`（Ch25）、Hono SSE 协议（Ch26）。作业禁止 bash / 任意写文件。JSON 作业是纯函数：假事件进、快照/行出。

---`,
    [],
  ),
  sec(
    "sec-map",
    "🗺️ 本章地图",
    null,
    `本章主线：**商品助手 Agent** 的第二层——事件怎么流、危险工具怎么拦。用户问机械键盘库存，模型可能先吐字、再调 \`lookupProduct\`；若它想调 \`bash\`，\`beforeToolCall\` 必须挡住。

读完这章 + 完成作业，你将能够：

- 从假事件数组里按序收集 \`text_delta.delta\`
- 折叠成 \`SessionSnap\`（全文、工具名、ended / aborted）
- 用白名单拦住 bash / write（作业版 \`beforeToolCall\`）
- 写出一笔审计记录
- 判断用户有没有点停止（\`aborted\` vs \`agent_end\`）
- 拼出聊天区 UI 行（必须复用 reduce + block）

**作业 ↔ 教程对应表**（学哪节，就去做哪题）：

| 作业题 | 对应小节 | 核心知识点 |
|--------|----------|-----------|
| \`filterTextDeltas\` | §24.1 | 只收 \`text_delta\` |
| \`reduceSessionEvents\` | §24.2 | 调用 filterTextDeltas 再折叠 |
| \`blockDangerousTool\` | §24.3 | 只放行 lookupProduct / calcLineTotal |
| \`auditToolCall\` | §24.4 | 调用 blockDangerousTool 做审计 |
| \`abortFlag\` | §24.5 | aborted ≠ agent_end |
| \`uiRowsFromEvents\` | §24.6 | 复用 reduce + block 拼 UI 行 |

本地文件：\`local/m5/ch24/assignment.ts\`（改 TODO）、\`app.ts\`（假 async generator，不联网）、\`assignment.test.ts\`、\`demo.ts\`（真 \`pi-agent-core\` 示例，测试不要 import 它）。

跑测试：\`bun test local/m5/ch24\`。

---`,
    [],
  ),
  sec(
    "sec-path",
    "⏱️ 学习路径：费曼五步（约 50–70 分钟）",
    null,
    `| 步 | 你要做 | 在哪做 |
|----|--------|--------|
| ① 预览猜（2 分钟） | 猜 subscribe 看到的事件、beforeToolCall 怎么拦 bash | 本页 ① |
| ② 先动手 | 打开 \`local/m5/ch24/assignment.ts\` 改 TODO | 仓库 local/ |
| ③ 提取+反馈 | \`bun test local/m5/ch24\` 看红绿 | 终端 |
| ④ 费曼（2 分钟） | 大白话讲清「为什么作业不给 bash」 | 本页 ④ |
| ⑤ 存闪卡 | 章末闪卡标复习日期 | 闪卡 |

> 💡 网页这一章是只读的。不要在浏览器里改代码。没有 API Key 作业也能绿——测的是假事件。真跑 Agent 见 \`demo.ts\`（要 Key，本课测试不跑它）。
> \`reduceSessionEvents\` **必须调用** \`filterTextDeltas\`。\`auditToolCall\` 调用 \`blockDangerousTool\`。\`uiRowsFromEvents\` 调用这俩。

---`,
    [],
  ),
  sec(
    "sec-guess",
    "① 预览猜（2 分钟 · 激活你的 Java / Python 直觉）",
    null,
    `先别看答案，凭经验猜一猜（猜错没关系）：

1. Java \`Filter.doFilter\` 能在 Servlet 前 return 403；Pi 的 \`beforeToolCall\` 拦 bash 该返回什么形状？
2. 本机没有 API Key，\`bun test local/m5/ch24\` 还能绿吗？
3. 事件数组是 \`[]\`：\`reduceSessionEvents\` 的 ended / aborted 该是 true 还是 false？
4. 模型调用了 \`lookup\`（不是 \`lookupProduct\`），放行还是拦？
5. 流里有 \`aborted\` 没有 \`agent_end\`，聊天区要不要多画一行「已停止」？作业怎么表示 abort？
6. \`uiRowsFromEvents\` 为什么必须调用 \`reduceSessionEvents\`，而不是自己再 filter 一遍 delta？

> 猜完，带着验证心态进入正文。第 2、4、5 题是本章的 🔴。

---`,
    [],
  ),
  sec(
    "sec-world",
    "subscribe 事件 + beforeToolCall 闸门 🔴",
    null,
    `Ch23 你已经会 \`new Agent({ tools, streamFn })\`。本章只加两件事：

1. **\`agent.subscribe\`**：看这一回合到底发生了什么（文本增量、工具开始/结束）。
2. **\`beforeToolCall\`**：工具真正执行前拦一刀。课程**只允许** \`lookupProduct\` / \`calcLineTotal\`。

包名是 \`@earendil-works/pi-agent-core\`。文档：https://pi.dev/docs/latest/sdk

真 API（复制到有 Key 的文件才能跑；作业**不要** import 这个包）：

\`\`\`ts
import { Agent } from "@earendil-works/pi-agent-core";

agent.subscribe((event) => {
  if (event.type === "message_update" && event.assistantMessageEvent.type === "text_delta") {
    process.stdout.write(event.assistantMessageEvent.delta);
  }
  if (event.type === "tool_execution_start") {
    // tool_call 开始
  }
});

const agent = new Agent({
  streamFn,
  initialState: { tools, systemPrompt, model },
  beforeToolCall: async ({ toolCall }) => {
    if (toolCall.name === "bash") {
      return { block: true, reason: "bash is disabled", terminate: true };
    }
  },
});
\`\`\`

真事件比作业类型更细：\`prompt\` → \`agent_start\` → \`turn_start\` → \`message_*\` → 若有工具则 \`tool_execution_start\` / \`tool_execution_end\` → \`toolResult\` → 下一 turn 文本。作业收成五种：\`text_delta\` / \`tool_call\` / \`tool_result\` / \`agent_end\` / \`aborted\`。没有 Key 也能绿。

\`\`\`mermaid
flowchart TD
    user["用户问机械键盘库存"] --> prompt["prompt"]
    prompt --> startN["agent_start"]
    startN --> turn["turn_start"]
    turn --> msg["message_update / text_delta"]
    msg --> branch{"要调工具?"}
    branch -->|"否"| endN["agent_end"]
    branch -->|"是"| tStart["tool_execution_start"]
    tStart --> gate["beforeToolCall"]
    gate -->|"bash"| blocked["block true 拦住"]
    gate -->|"lookupProduct"| tEnd["tool_execution_end"]
    tEnd --> res["toolResult"]
    res --> next["下一 turn 文本"]
    next --> endN
    blocked --> abortN["aborted / terminate"]

    style user fill:#FFE082,stroke:#F9A825,color:#1f1f1f
    style prompt fill:#FFE082,stroke:#F9A825,color:#1f1f1f
    style startN fill:#80DEEA,stroke:#0097A7,color:#1f1f1f
    style turn fill:#80DEEA,stroke:#0097A7,color:#1f1f1f
    style msg fill:#80DEEA,stroke:#0097A7,color:#1f1f1f
    style branch fill:#CE93D8,stroke:#7B1FA2,color:#1f1f1f
    style tStart fill:#80DEEA,stroke:#0097A7,color:#1f1f1f
    style gate fill:#CE93D8,stroke:#7B1FA2,color:#1f1f1f
    style blocked fill:#EF9A9A,stroke:#C62828,color:#1f1f1f
    style tEnd fill:#A5D6A7,stroke:#388E3C,color:#1f1f1f
    style res fill:#A5D6A7,stroke:#388E3C,color:#1f1f1f
    style next fill:#A5D6A7,stroke:#388E3C,color:#1f1f1f
    style endN fill:#A5D6A7,stroke:#388E3C,color:#1f1f1f
    style abortN fill:#EF9A9A,stroke:#C62828,color:#1f1f1f
\`\`\`

### Java：Filter / AOP 拦截

\`\`\`java
public class ToolGuardFilter implements Filter {
    public void doFilter(ServletRequest req, ServletResponse res, FilterChain chain)
            throws IOException, ServletException {
        String tool = req.getParameter("tool");
        if ("bash".equals(tool)) {
            throw new SecurityException("forbidden");
        }
        chain.doFilter(req, res); // 放行 lookupProduct
    }
}

@Around("execution(* AgentTool.execute(..))")
public Object around(ProceedingJoinPoint pjp) throws Throwable {
    String name = (String) pjp.getArgs()[0];
    if ("bash".equals(name)) {
        return Map.of("block", true, "reason", "forbidden");
    }
    return pjp.proceed();
}
\`\`\`

\`Filter\` 在进入 Servlet 前就能 return；\`@Around\` 在方法前后各插一刀。\`beforeToolCall\` 就是 Agent 的这一刀。

### Python：\`before_request\` 中间件

\`\`\`python
@app.before_request
def guard_tool():
    name = request.headers.get("X-Tool-Name", "")
    if name not in ("lookupProduct", "calcLineTotal"):
        abort(403, "forbidden")
\`\`\`

Flask 的 \`before_request\`、Django 的 middleware \`process_request\`：请求还没进 view 就拦。Pi 把「请求」换成了一次 \`toolCall\`。

### 作业怎么测（无 Key）

作业里的 \`SessionEvent\` 是**教学用精简版**：

| 真 API | 作业 |
|---|---|
| \`message_update\` + \`text_delta\` | \`{ type: "text_delta", delta }\` |
| \`tool_execution_start\` | \`{ type: "tool_call", name, args }\` |
| 工具结果 | \`{ type: "tool_result", name, ok, text }\` |
| 回合结束 | \`{ type: "agent_end" }\` |
| 用户停止 / terminate | \`{ type: "aborted" }\` |

本地 \`app.ts\` 用 \`async function*\` **假**生成同一条管道。\`for await\` 收进数组，再交给上面 6 个纯函数。没有 \`fetch\`、没有端口、没有 Key、不给学生敞开 bash。

### ❌ / ✅

\`\`\`ts
// ❌ 作业 import @earendil-works/pi-agent-core（本课没装，也没有 Key）
// ❌ 测试里调真实 fetch / 等 setTimeout
// ❌ 把 bash / write 留给学生当「合法工具」
// ❌ 把 RAG / createAgentSession / Hono SSE 再讲一遍当作业
// ✅ 认 text_delta / tool_call；作业吃 SessionEvent[]；bash 一律 forbidden
\`\`\`

### 本课怎么算「会了」

打开 \`local/m5/ch24/assignment.ts\`，\`bun test local/m5/ch24\`。六个纯函数全绿，再加：假 async generator 能被收齐，\`uiRowsFromEvents\` 画出 KB-001 的 assistant + lookupProduct ok 行。**全绿 = 这题掌握。** 想真跑 Agent：自行准备包和 Key，复制 \`demo.ts\` 里的片段。

---`,
    [],
  ),
  sec(
    "sec-24.1",
    "§24.1 只收 text_delta（对应：`filterTextDeltas`）🟡",
    "24.1",
    `判别联合你在 Ch03 写过：看 \`type\` 收窄。\`text_delta\` 才有 \`delta\`；\`tool_call\` / \`tool_result\` / \`agent_end\` / \`aborted\` 没有字。

\`\`\`ts
function filterTextDeltas(events: SessionEvent[]): string[] {
  return events.filter((e) => e.type === "text_delta").map((e) => e.delta);
}

filterTextDeltas([
  { type: "text_delta", delta: "KB" },
  { type: "tool_call", name: "lookupProduct", args: {} },
  { type: "text_delta", delta: "-001" },
]); // ["KB","-001"]

filterTextDeltas([
  { type: "text_delta", delta: "无" },
  { type: "text_delta", delta: "线鼠标" },
]); // ["无","线鼠标"]

filterTextDeltas([]); // []
filterTextDeltas([{ type: "agent_end" }]); // []
\`\`\`

\`filter\` + \`map\` 会得到**新数组**。不要 \`events.push\`，不要改传入的对象。

对照：Java 从 SSE 行抽出 \`delta.content\` 放进 \`List<String>\`；Python 把非空 \`delta\` append 到 list。Ch22 你收过模型流；本章中间会夹 \`tool_call\`，规则一样——只收字。

### ❌ / ✅

\`\`\`ts
// ❌ return events.map(e => (e as any).delta)  → tool_call 变成 undefined
// ❌ 硬编码 ["KB","-001"]
// ❌ events.splice 改原数组
// ✅ 只在 type === "text_delta" 时收 delta
\`\`\`

> ✅ **做 \`filterTextDeltas\`**：按序收增量。

---`,
    ["filterTextDeltas"],
  ),
  sec(
    "sec-24.2",
    "§24.2 折叠成 SessionSnap（对应：`reduceSessionEvents`）🟡",
    "24.2",
    `UI 定稿需要四件事：全文、调过哪些工具、是否 \`agent_end\`、是否 \`aborted\`。

**必须调用** \`filterTextDeltas\`，不要复制一份 filter——后面改收集规则时拼全文会一起对。

\`\`\`ts
function reduceSessionEvents(events: SessionEvent[]): SessionSnap {
  return {
    text: filterTextDeltas(events).join(""),
    tools: events.filter((e) => e.type === "tool_call").map((e) => e.name),
    ended: events.some((e) => e.type === "agent_end"),
    aborted: events.some((e) => e.type === "aborted"),
  };
}

reduceSessionEvents([
  { type: "text_delta", delta: "机" },
  { type: "text_delta", delta: "械键盘" },
  { type: "tool_call", name: "lookupProduct", args: { sku: "KB-001" } },
  { type: "agent_end" },
]);
// { text:"机械键盘", tools:["lookupProduct"], ended:true, aborted:false }

reduceSessionEvents([
  { type: "text_delta", delta: "无" },
  { type: "text_delta", delta: "线鼠标" },
  { type: "aborted" },
]);
// { text:"无线鼠标", tools:[], ended:false, aborted:true }

reduceSessionEvents([]);
// { text:"", tools:[], ended:false, aborted:false }
\`\`\`

\`join("")\`：中间不要空格。token 自己带着空格（\`" 库存 "\`）时才会出现空格。\`tools\` 只看 \`tool_call\` 的 \`name\`，按原序；\`tool_result\` 不进这个数组。

对照：Java Stream \`map\` + \`collect\` 折成 DTO；Python 一次 for 循环填 \`dataclass\`。这里折成 \`SessionSnap\`。

### ❌ / ✅

\`\`\`ts
// ❌ 硬编码 return { text:"机械键盘", tools:["lookupProduct"], ... }
// ❌ 自己再写一遍 filter，不调用 filterTextDeltas
// ❌ 把 tool_result 的 name 也推进 tools
// ✅ filterTextDeltas(events).join("")；只收集 tool_call
\`\`\`

> ✅ **做 \`reduceSessionEvents\`**：调用 filterTextDeltas。

---`,
    ["reduceSessionEvents"],
  ),
  sec(
    "sec-24.3",
    "§24.3 作业版 beforeToolCall（对应：`blockDangerousTool`）🔴",
    "24.3",
    `真 API 返回 \`{ block: true, reason: "bash is disabled", terminate: true }\`。作业收成两种：放行 \`{ block: false }\`，拦截 \`{ block: true, reason: "forbidden" }\`。

课程**只允许**两个商品工具。其它一切都是危险的——包括看起来像查询的 \`lookup\`、空字符串、\`write\` / \`edit\` / \`rm\`。

\`\`\`ts
function blockDangerousTool(name: string): BlockDecision {
  if (name === "lookupProduct" || name === "calcLineTotal") {
    return { block: false };
  }
  return { block: true, reason: "forbidden" };
}

blockDangerousTool("lookupProduct");  // { block: false }
blockDangerousTool("calcLineTotal");  // { block: false }
blockDangerousTool("bash");           // { block: true, reason: "forbidden" }
blockDangerousTool("write");          // { block: true, reason: "forbidden" }
blockDangerousTool("");               // { block: true, reason: "forbidden" }
blockDangerousTool("lookup");         // { block: true, reason: "forbidden" }  ← 不是 lookupProduct
\`\`\`

放行对象**不要**带 \`reason\` 字段。拦截的 \`reason\` 必须是字面量 \`"forbidden"\`，不要翻译。

这就是 Java Filter 的 \`chain.doFilter\` vs \`throw\`；Python \`before_request\` 的放行 vs \`abort(403)\`。

\`\`\`mermaid
flowchart TD
    callN["tool_call 到来"] --> gate["blockDangerousTool"]
    gate -->|"lookupProduct / calcLineTotal"| allow["block false"]
    gate -->|"bash write edit rm lookup 空串"| deny["block true forbidden"]
    allow --> exec["允许执行"]
    deny --> stop["拦住 不给学生 bash"]

    style callN fill:#FFE082,stroke:#F9A825,color:#1f1f1f
    style gate fill:#80DEEA,stroke:#0097A7,color:#1f1f1f
    style allow fill:#A5D6A7,stroke:#388E3C,color:#1f1f1f
    style deny fill:#EF9A9A,stroke:#C62828,color:#1f1f1f
    style exec fill:#A5D6A7,stroke:#388E3C,color:#1f1f1f
    style stop fill:#EF9A9A,stroke:#C62828,color:#1f1f1f
\`\`\`

### ❌ / ✅

\`\`\`ts
// ❌ name.includes("lookup")  → lookup 被放行，lookupProduct 也依赖碰巧
// ❌ 黑名单只写 bash，忘了 write / edit / rm / ""
// ❌ 放行时返回 { block:false, reason:"forbidden" } 多一个字段
// ✅ 白名单两个名字 === ；其它一律 forbidden
\`\`\`

> ✅ **做 \`blockDangerousTool\`**：只放行两个商品工具。

---`,
    ["blockDangerousTool"],
  ),
  sec(
    "sec-24.4",
    "§24.4 审计一行（对应：`auditToolCall`）🟢",
    "24.4",
    `后台不只拦，还要记账：谁被调、参数是什么、拦没拦。**必须调用** \`blockDangerousTool(name)\`。

\`\`\`ts
function auditToolCall(name: string, args: Record<string, unknown>): Audit {
  return { name, args, blocked: blockDangerousTool(name).block };
}

auditToolCall("lookupProduct", { sku: "KB-001" });
// { name:"lookupProduct", args:{sku:"KB-001"}, blocked:false }

auditToolCall("bash", { cmd: "ls" });
// { name:"bash", args:{cmd:"ls"}, blocked:true }

auditToolCall("write", { path: "/tmp/x" });
// blocked true
\`\`\`

不要 mutate \`args\`。测试会 \`Object.freeze(args)\`。可以把同一个对象放进返回值，也可以浅拷贝 \`{ ...args }\`——\`toEqual\` 看的是内容。

对照：Java 拦截 Filter 里打 MDC / 审计日志再 \`chain.doFilter\`；Python 中间件里 \`logger.info\` 再放行。作业只返回结构，不写文件。

### ❌ / ✅

\`\`\`ts
// ❌ 自己再写一遍 if name === "bash"，不调用 blockDangerousTool
// ❌ args.blocked = true 改传入对象（freeze 会炸）
// ❌ 丢掉 args 或硬编码 {sku:"KB-001"}
// ✅ blocked: blockDangerousTool(name).block ；args 原样
\`\`\`

> ✅ **做 \`auditToolCall\`**：调用 blockDangerousTool。

---`,
    ["auditToolCall"],
  ),
  sec(
    "sec-24.5",
    "§24.5 停止了吗（对应：`abortFlag`）🟡",
    "24.5",
    `用户点停止、或 \`beforeToolCall\` \`terminate: true\`，事件里会出现 \`aborted\`。正常说完是 \`agent_end\`。两件事不是同一个。

- 存在任意 \`type === "aborted"\` → \`true\`
- **\`[]\` 是 \`false\`**：还什么都没发生，不是停止
- 只有 \`agent_end\` → \`false\`

\`\`\`ts
function abortFlag(events: SessionEvent[]): boolean {
  return events.some((e) => e.type === "aborted");
}

abortFlag([
  { type: "text_delta", delta: "机" },
  { type: "aborted" },
]); // true

abortFlag([{ type: "agent_end" }]); // false
abortFlag([]); // false
\`\`\`

\`uiRowsFromEvents\` **不要**因为 aborted 多推一行；abort 用本题的 boolean。聊天区画行是 §24.6，停止标记是本题。

### ❌ / ✅

\`\`\`ts
// ❌ return events.length === 0  → 空数组被你判成停止
// ❌ 把 agent_end 当成 aborted
// ❌ 只看最后一项（前面的 aborted 也算）
// ✅ some type === "aborted"
\`\`\`

> ✅ **做 \`abortFlag\`**：有 aborted 才是 true。

---`,
    ["abortFlag"],
  ),
  sec(
    "sec-24.6",
    "§24.6 拼 UI 行（对应：`uiRowsFromEvents`）🔴",
    "24.6",
    `聊天区先出助手全文，再按 \`tool_call\` 原序出工具行。这是 Ch26 接到网页之前的纯数据，本题**不要** import 框架。

**必须调用** \`reduceSessionEvents\` 和 \`blockDangerousTool\`（验收会查源码调用）。

规则：

1. \`const snap = reduceSessionEvents(events)\`
2. \`rows: UiRow[] = []\`
3. 若 \`snap.text.length > 0\`，push \`{ kind: "assistant", text: snap.text }\`（全文在前，即使 delta 写在 tool_call 后面）
4. 再按原序扫 \`tool_call\`（其它类型不当「造 tool 行」的触发器）：
   - \`blockDangerousTool(ev.name).block\` → \`{ kind:"tool", name, status:"blocked", text:"forbidden" }\`（**不要**再配对 result）
   - 否则在**该 tool_call 之后**找**第一条**同名 \`tool_result\`：
     - 找到且 \`ok===true\` → \`status:"ok"\`，\`text\` 用 result.text
     - 找到且 \`ok===false\` → \`status:"error"\`
     - 找不到 → \`status:"call"\`，\`text:""\`
5. **不要**因为 aborted / agent_end 再多推一行

\`\`\`ts
function uiRowsFromEvents(events: SessionEvent[]): UiRow[] {
  const snap = reduceSessionEvents(events);
  const rows: UiRow[] = [];
  if (snap.text.length > 0) {
    rows.push({ kind: "assistant", text: snap.text });
  }
  for (const [i, ev] of events.entries()) {
    if (ev.type !== "tool_call") continue;
    if (blockDangerousTool(ev.name).block) {
      rows.push({ kind: "tool", name: ev.name, status: "blocked", text: "forbidden" });
      continue;
    }
    const later = events.slice(i + 1).find((x) => x.type === "tool_result" && x.name === ev.name);
    if (later && later.type === "tool_result" && later.ok === true) {
      rows.push({ kind: "tool", name: ev.name, status: "ok", text: later.text });
    } else if (later && later.type === "tool_result" && later.ok === false) {
      rows.push({ kind: "tool", name: ev.name, status: "error", text: later.text });
    } else {
      rows.push({ kind: "tool", name: ev.name, status: "call", text: "" });
    }
  }
  return rows;
}

uiRowsFromEvents([
  { type: "text_delta", delta: "KB-001 库存 120" },
  { type: "tool_call", name: "lookupProduct", args: { sku: "KB-001" } },
  { type: "tool_result", name: "lookupProduct", ok: true, text: "KB-001 机械键盘 库存 120 单价 599" },
  { type: "agent_end" },
]);
// [
//   { kind:"assistant", text:"KB-001 库存 120" },
//   { kind:"tool", name:"lookupProduct", status:"ok", text:"KB-001 机械键盘 库存 120 单价 599" },
// ]

uiRowsFromEvents([
  { type: "tool_call", name: "bash", args: { cmd: "ls" } },
  { type: "agent_end" },
]);
// [{ kind:"tool", name:"bash", status:"blocked", text:"forbidden" }]

uiRowsFromEvents([
  { type: "tool_call", name: "calcLineTotal", args: { qty: 2, unitPrice: 599 } },
]);
// [{ kind:"tool", name:"calcLineTotal", status:"call", text:"" }]

uiRowsFromEvents([]); // []
\`\`\`

失败结果：\`ok:false\` + \`"未找到该 SKU"\` → \`status:"error"\`。若没有 text_delta，就没有 assistant 行。

### ❌ / ✅

\`\`\`ts
// ❌ 自己再 filter delta，不调用 reduceSessionEvents
// ❌ bash 已经 blocked 还去配对 tool_result 画成 ok
// ❌ aborted / agent_end 再 push 一行
// ❌ 按事件到达交错画气泡（delta 在 tool 后也应先 assistant 再 tool）
// ✅ 先 snap.text；再扫 tool_call；拦截用 blockDangerousTool
\`\`\`

> ✅ **做 \`uiRowsFromEvents\`**：复用 reduce + block。

---`,
    ["uiRowsFromEvents"],
  ),
  sec(
    "sec-pits",
    "⚠️ Java / Python 老手几个坑",
    null,
    `1. **把 bash 当成「合法系统工具」留给作业。** 课程白名单只有 lookupProduct / calcLineTotal。Filter 默认拒绝。
2. **没有 Key 就不会写作业。** 假事件数组就能绿。真跑才要 Key，见 \`demo.ts\`。
3. **\`lookup\` 当成 \`lookupProduct\`。** 必须 === 全名。
4. **\`reduceSessionEvents\` 不调用 \`filterTextDeltas\`。** 测试能蒙对，验收脚本会查调用。
5. **\`uiRowsFromEvents\` 自己再扫一遍 delta。** 必须调用 reduce；拦截必须调用 blockDangerousTool。
6. **aborted 和 agent_end 画成 UI 行。** abort 用 \`abortFlag\`；行函数不要多推。
7. **作业 import \`@earendil-works/pi-agent-core\` / hono / fetch。** JSON 作业是纯函数。真示例只在 \`demo.ts\` 的字符串里。
8. **mutate events / args。** 测试 freeze。返回新对象。
9. **本章就去讲 \`createAgentSession\`。** 那是 Ch25。Hono SSE 是 Ch26。RAG 不重复。
10. **给学生写文件系统。** 作业禁止 write / edit / bash。

---`,
    [],
  ),
  sec(
    "sec-homework",
    "📝 本章作业",
    null,
    `上面 6 个函数按节交错出现。每个注释里有【场景】【转换点】、示例和提示。

**完成方式**：打开仓库 \`local/m5/ch24/assignment.ts\`，把 \`throw new Error("TODO")\` 换成实现，然后：

\`\`\`bash
bun test local/m5/ch24
\`\`\`

\`app.ts\` 是假 \`async function*\`，不联网。\`demo.ts\` 是真 \`pi-agent-core\` 抄写稿，**测试不要 import 它**（包没装）。

卡住就回对应 §：\`filterTextDeltas\` → §24.1，\`reduceSessionEvents\` → §24.2（请调用 filterTextDeltas），\`blockDangerousTool\` → §24.3（只放行两个商品工具），\`uiRowsFromEvents\` → §24.6（请调用 reduce + block）。

---`,
    [],
  ),
  sec(
    "sec-check",
    "✅ 自测：你真的掌握了吗？",
    null,
    `- [ ] 能说清 Java Filter / Python before_request 和 \`beforeToolCall\` 的对应
- [ ] 没有 Key 时作业为什么还能绿
- [ ] \`filterTextDeltas\` 忽略 tool_* / agent_end / aborted，不 mutate
- [ ] \`reduceSessionEvents\` 调用了 \`filterTextDeltas\`
- [ ] 只放行 lookupProduct / calcLineTotal；bash / lookup / "" 都 forbidden
- [ ] \`auditToolCall\` 调用了 \`blockDangerousTool\`；freeze args 不炸
- [ ] \`aborted\` 是停止，\`agent_end\` 是正常结束；空数组两者都 false
- [ ] \`uiRowsFromEvents\` 先全文再工具行；拦 bash 不再配对 result
- [ ] \`bun test local/m5/ch24\` 全绿

---`,
    [],
  ),
  sec(
    "sec-feynman",
    "🎓 费曼挑战",
    null,
    `用大白话讲给「Java 同事」听。讲不清 = 还没真懂。

任选一题（1–2 分钟）：

1. 「商品助手为什么不能给模型 bash？\`beforeToolCall\` 和 Servlet Filter 怎么对上？没有 Key 测试怎么绿？」— 卡壳重读总述 + §24.3
2. 「为什么 \`lookup\` 要拦、\`lookupProduct\` 要放？白名单和黑名单差在哪？」— 卡壳重读 §24.3
3. 「聊天区为什么先画全文再画工具？abort 为什么不占一行？」— 卡壳重读 §24.5 + §24.6

---`,
    [],
  ),
  sec(
    "sec-next",
    "⏭️ 下一步",
    null,
    `Ch24 掌握后，你已经会订阅 Agent 事件、在工具执行前拦截、把假事件收成 UI 行。下一章是 **Ch25 · createAgentSession**：会话、steer、和 CLI 同一套 harness。本章**不讲** \`createAgentSession\`。Hono 把这些行编成 SSE 是 Ch26。不要在本章作业里开 bash 或写文件系统。`,
    [],
  ),
];

const tutorialMd = `# Ch24 · 自定义 Tool 与事件

${sections
  .map((s) => (s.heading ? `## ${s.heading}\n\n${s.body}` : s.body))
  .join("\n\n")}
`;

const reviewMd = `# Ch24 · 记忆闪卡

> 先回忆，再翻答案。连续 2 次秒答 → 退役。

## 🔖 闪卡

| # | 正面（问题） | 背面（答案） | 掌握 |
|---|---|---|---|
| 1 | \`agent.subscribe\` 里文本增量、工具开始分别是什么事件？ | 真 API：\`message_update\` + \`assistantMessageEvent.type === "text_delta"\`；工具开始是 \`tool_execution_start\`。作业收成 \`text_delta\` / \`tool_call\`。 | ⬜ |
| 2 | \`beforeToolCall\` 拦 bash 返回什么？作业版呢？ | 真 API：\`{ block: true, reason: "bash is disabled", terminate: true }\`。作业：\`{ block: true, reason: "forbidden" }\`。只放行 lookupProduct / calcLineTotal。 | ⬜ |
| 3 | 课程允许哪两个工具？\`lookup\` / \`""\` / bash 呢？ | 只允许 \`lookupProduct\`、\`calcLineTotal\`。其它一切（含 \`lookup\`、空串、bash、write）→ forbidden。 | ⬜ |
| 4 | \`aborted\` 和 \`agent_end\` 差在哪？空数组？ | \`aborted\` = 用户停止 / terminate。\`agent_end\` = 正常结束。\`abortFlag([]) === false\`。UI 行不要为它们多推一行。 | ⬜ |
| 5 | \`uiRowsFromEvents\` 必须调用谁？行的顺序？ | 必须调用 \`reduceSessionEvents\` 和 \`blockDangerousTool\`。先 assistant 全文（若有），再按 tool_call 原序。拦了就不要配对 result。 | ⬜ |
| 6 | 没有 API Key，作业能绿吗？测试可以 import pi-agent-core 吗？ | 能绿：假 \`SessionEvent[]\` / async generator。测试禁止 import 该包、禁止联网。真跑看 \`demo.ts\`。 | ⬜ |
| 7 | \`reduceSessionEvents\` / \`auditToolCall\` 必须调用谁？ | reduce 必须调用 \`filterTextDeltas\`。audit 必须调用 \`blockDangerousTool\`。不要复制一份 if。 | ⬜ |
| 8 | Java Filter / Python before_request 对应本章哪段 API？ | \`beforeToolCall\`（作业 \`blockDangerousTool\`）。默认拒绝，白名单放行商品工具。 | ⬜ |

## 🎓 费曼自检

- [ ] 能说清 subscribe 事件 vs 作业五种 SessionEvent
- [ ] 能说清 beforeToolCall {block:true} 与 Filter
- [ ] 能说清无 Key 假事件也能绿、uiRows 复用 reduce
`;

const chapter = {
  id: "ch24",
  num: "24",
  title: "自定义 Tool 与事件",
  runMode: "local" as const,
  tutorialMd,
  assignment,
  testName: "ch24_assignment",
  testSource,
  reviewMd,
  interleaved: true,
  sections,
  functions,
  preamble,
  localHint: "bun test local/m5/ch24",
};

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const out = join(root, "src/content/chapters/ch24.json");
mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, JSON.stringify(chapter, null, 2) + "\n");
console.log("wrote", out);

const localDir = join(root, "local/m5/ch24");
mkdirSync(localDir, { recursive: true });

const localAssignment = `/**
 * Ch24 作业：商品助手把 Agent 事件收成可测的纯函数。
 *
 * 场景：用户问「机械键盘还有货吗」，假事件数组依次吐
 * text_delta → tool_call(lookupProduct) → tool_result → agent_end。
 * 你抽出增量、折叠成快照、拦住 bash、审计调用、拼 UI 行。
 *
 * 没有供应商 Key 也能全绿：测的是事件数组，不是真 Agent。
 * 打开本文件改 TODO，然后：bun test local/m5/ch24
 */

type SessionEvent =
  | { type: "text_delta"; delta: string }
  | { type: "tool_call"; name: string; args: Record<string, unknown> }
  | { type: "tool_result"; name: string; ok: boolean; text: string }
  | { type: "agent_end" }
  | { type: "aborted" };

type BlockDecision = { block: true; reason: "forbidden" } | { block: false };

type Audit = { name: string; args: Record<string, unknown>; blocked: boolean };

type UiRow =
  | { kind: "assistant"; text: string }
  | { kind: "tool"; name: string; status: "call" | "ok" | "error" | "blocked"; text: string };

type SessionSnap = {
  text: string;
  tools: string[];
  ended: boolean;
  aborted: boolean;
};

${functions.map((f) => f.skeleton).join("\n\n")}
`;

const appSource = `/**
 * Ch24 本地假流：商品助手回答「机械键盘还有货吗」。
 * 不联网、不起端口、不 import 真 Agent 包。
 *
 * bun test 会 for-await 本 generator，再把事件交给 assignment.ts 的纯函数。
 */

export type SessionEvent =
  | { type: "text_delta"; delta: string }
  | { type: "tool_call"; name: string; args: Record<string, unknown> }
  | { type: "tool_result"; name: string; ok: boolean; text: string }
  | { type: "agent_end" }
  | { type: "aborted" };

/** 用户问机械键盘库存时，假 Agent 会吐出的完整回合。 */
export const SHOP_SESSION_EVENTS: SessionEvent[] = [
  { type: "text_delta", delta: "KB-001" },
  { type: "text_delta", delta: " 库存 " },
  { type: "text_delta", delta: "120" },
  { type: "tool_call", name: "lookupProduct", args: { sku: "KB-001" } },
  {
    type: "tool_result",
    name: "lookupProduct",
    ok: true,
    text: "KB-001 机械键盘 库存 120 单价 599",
  },
  { type: "agent_end" },
];

/** 模型若想调 bash：作业必须拦住。 */
export const DANGEROUS_EVENTS: SessionEvent[] = [
  { type: "tool_call", name: "bash", args: { cmd: "ls" } },
  { type: "agent_end" },
];

export async function* fakeSessionStream(): AsyncGenerator<SessionEvent> {
  for (const event of SHOP_SESSION_EVENTS) {
    yield event;
  }
}

export async function collectFromAsync(
  stream: AsyncIterable<SessionEvent>,
): Promise<SessionEvent[]> {
  const events: SessionEvent[] = [];
  for await (const event of stream) {
    events.push(event);
  }
  return events;
}
`;

const localTest = `import { describe, expect, test } from "bun:test";
import {
  abortFlag,
  auditToolCall,
  blockDangerousTool,
  filterTextDeltas,
  reduceSessionEvents,
  uiRowsFromEvents,
} from "./assignment";
import {
  collectFromAsync,
  DANGEROUS_EVENTS,
  fakeSessionStream,
  SHOP_SESSION_EVENTS,
  type SessionEvent,
} from "./app";

const KB_OK: SessionEvent[] = [
  { type: "text_delta", delta: "KB-001 库存 120" },
  { type: "tool_call", name: "lookupProduct", args: { sku: "KB-001" } },
  { type: "tool_result", name: "lookupProduct", ok: true, text: "KB-001 机械键盘 库存 120 单价 599" },
  { type: "agent_end" },
];

const MOUSE_ABORT: SessionEvent[] = [
  { type: "text_delta", delta: "无" },
  { type: "text_delta", delta: "线鼠标" },
  { type: "aborted" },
];

describe("filterTextDeltas", () => {
  test("夹杂 tool_call 仍按序收 delta", () => {
    const events: SessionEvent[] = [
      { type: "text_delta", delta: "KB" },
      { type: "tool_call", name: "lookupProduct", args: {} },
      { type: "text_delta", delta: "-001" },
    ];
    Object.freeze(events);
    expect(filterTextDeltas(events)).toEqual(["KB", "-001"]);
    expect(events.length).toBe(3);
  });
  test("无线鼠标增量（防硬编码机械键盘）", () => {
    const events: SessionEvent[] = [
      { type: "text_delta", delta: "无" },
      { type: "text_delta", delta: "线鼠标" },
    ];
    Object.freeze(events);
    expect(filterTextDeltas(events)).toEqual(["无", "线鼠标"]);
  });
  test("空数组 / 只有 agent_end → []", () => {
    expect(filterTextDeltas([])).toEqual([]);
    const onlyEnd: SessionEvent[] = [{ type: "agent_end" }];
    Object.freeze(onlyEnd);
    expect(filterTextDeltas(onlyEnd)).toEqual([]);
  });
  test("忽略 tool_* / aborted，不 mutate", () => {
    const events: SessionEvent[] = [
      { type: "text_delta", delta: "机" },
      { type: "tool_call", name: "bash", args: { cmd: "ls" } },
      { type: "tool_result", name: "bash", ok: true, text: "x" },
      { type: "aborted" },
    ];
    Object.freeze(events);
    expect(filterTextDeltas(events)).toEqual(["机"]);
    expect(events.length).toBe(4);
  });
});

describe("reduceSessionEvents", () => {
  test("机械键盘 deltas + lookupProduct + agent_end", () => {
    const events: SessionEvent[] = [
      { type: "text_delta", delta: "机" },
      { type: "text_delta", delta: "械键盘" },
      { type: "tool_call", name: "lookupProduct", args: { sku: "KB-001" } },
      { type: "agent_end" },
    ];
    Object.freeze(events);
    expect(reduceSessionEvents(events)).toEqual({
      text: "机械键盘",
      tools: ["lookupProduct"],
      ended: true,
      aborted: false,
    });
  });
  test("无线鼠标 + aborted、无 agent_end（防硬编码）", () => {
    Object.freeze(MOUSE_ABORT);
    expect(reduceSessionEvents(MOUSE_ABORT)).toEqual({
      text: "无线鼠标",
      tools: [],
      ended: false,
      aborted: true,
    });
  });
  test("空数组全是空/false；两个工具按序", () => {
    expect(reduceSessionEvents([])).toEqual({
      text: "",
      tools: [],
      ended: false,
      aborted: false,
    });
    const two: SessionEvent[] = [
      { type: "tool_call", name: "lookupProduct", args: { sku: "KB-001" } },
      { type: "tool_call", name: "calcLineTotal", args: { qty: 2, unitPrice: 599 } },
    ];
    Object.freeze(two);
    expect(reduceSessionEvents(two)).toEqual({
      text: "",
      tools: ["lookupProduct", "calcLineTotal"],
      ended: false,
      aborted: false,
    });
  });
});

describe("blockDangerousTool", () => {
  test("课程只放行 lookupProduct / calcLineTotal", () => {
    expect(blockDangerousTool("lookupProduct")).toEqual({ block: false });
    expect(blockDangerousTool("calcLineTotal")).toEqual({ block: false });
  });
  test("bash / write / edit / rm / 空 / lookup 全拦", () => {
    expect(blockDangerousTool("bash")).toEqual({ block: true, reason: "forbidden" });
    expect(blockDangerousTool("write")).toEqual({ block: true, reason: "forbidden" });
    expect(blockDangerousTool("edit")).toEqual({ block: true, reason: "forbidden" });
    expect(blockDangerousTool("rm")).toEqual({ block: true, reason: "forbidden" });
    expect(blockDangerousTool("")).toEqual({ block: true, reason: "forbidden" });
    expect(blockDangerousTool("lookup")).toEqual({ block: true, reason: "forbidden" });
  });
  test("blocked 字段是 boolean", () => {
    expect(blockDangerousTool("lookupProduct").block).toBe(false);
    expect(blockDangerousTool("bash").block).toBe(true);
  });
});

describe("auditToolCall", () => {
  test("lookupProduct 不拦，args 原样", () => {
    const args: Record<string, unknown> = { sku: "KB-001" };
    Object.freeze(args);
    expect(auditToolCall("lookupProduct", args)).toEqual({
      name: "lookupProduct",
      args: { sku: "KB-001" },
      blocked: false,
    });
    expect(args).toEqual({ sku: "KB-001" });
  });
  test("bash / write 要拦（防硬编码只认 lookupProduct）", () => {
    const bashArgs: Record<string, unknown> = { cmd: "ls" };
    Object.freeze(bashArgs);
    expect(auditToolCall("bash", bashArgs)).toEqual({
      name: "bash",
      args: { cmd: "ls" },
      blocked: true,
    });
    expect(auditToolCall("write", { path: "/tmp/x" })).toEqual({
      name: "write",
      args: { path: "/tmp/x" },
      blocked: true,
    });
    expect(auditToolCall("calcLineTotal", { qty: 2, unitPrice: 599 })).toEqual({
      name: "calcLineTotal",
      args: { qty: 2, unitPrice: 599 },
      blocked: false,
    });
  });
  test("freeze args 后仍能 toEqual；不 mutate", () => {
    const args: Record<string, unknown> = { sku: "MS-002" };
    Object.freeze(args);
    const out = auditToolCall("lookupProduct", args);
    expect(out.blocked).toBe(false);
    expect(out.args).toEqual({ sku: "MS-002" });
    expect(args).toEqual({ sku: "MS-002" });
  });
});

describe("abortFlag", () => {
  test("有 aborted → true", () => {
    const events: SessionEvent[] = [
      { type: "text_delta", delta: "机" },
      { type: "aborted" },
    ];
    Object.freeze(events);
    expect(abortFlag(events)).toBe(true);
  });
  test("只有 agent_end / 空 → false", () => {
    expect(abortFlag([{ type: "agent_end" }])).toBe(false);
    expect(abortFlag([])).toBe(false);
  });
  test("无线鼠标 aborted 也是 true（防硬编码）", () => {
    Object.freeze(MOUSE_ABORT);
    expect(abortFlag(MOUSE_ABORT)).toBe(true);
    expect(abortFlag(KB_OK)).toBe(false);
  });
});

describe("uiRowsFromEvents", () => {
  test("查询成功：assistant + tool ok", () => {
    Object.freeze(KB_OK);
    expect(uiRowsFromEvents(KB_OK)).toEqual([
      { kind: "assistant", text: "KB-001 库存 120" },
      {
        kind: "tool",
        name: "lookupProduct",
        status: "ok",
        text: "KB-001 机械键盘 库存 120 单价 599",
      },
    ]);
  });
  test("拦 bash；calcLineTotal 还在调", () => {
    const bash: SessionEvent[] = [
      { type: "tool_call", name: "bash", args: { cmd: "ls" } },
      { type: "agent_end" },
    ];
    Object.freeze(bash);
    expect(uiRowsFromEvents(bash)).toEqual([
      { kind: "tool", name: "bash", status: "blocked", text: "forbidden" },
    ]);
    const calling: SessionEvent[] = [
      { type: "tool_call", name: "calcLineTotal", args: { qty: 2, unitPrice: 599 } },
    ];
    Object.freeze(calling);
    expect(uiRowsFromEvents(calling)).toEqual([
      { kind: "tool", name: "calcLineTotal", status: "call", text: "" },
    ]);
  });
  test("失败结果无 assistant；空数组 []", () => {
    const missing: SessionEvent[] = [
      { type: "tool_call", name: "lookupProduct", args: { sku: "NO-SKU" } },
      { type: "tool_result", name: "lookupProduct", ok: false, text: "未找到该 SKU" },
    ];
    Object.freeze(missing);
    expect(uiRowsFromEvents(missing)).toEqual([
      { kind: "tool", name: "lookupProduct", status: "error", text: "未找到该 SKU" },
    ]);
    expect(uiRowsFromEvents([])).toEqual([]);
  });
  test("先全文再工具；aborted 不多推一行；拦了就不配对 result", () => {
    const laterText: SessionEvent[] = [
      { type: "tool_call", name: "lookupProduct", args: { sku: "KB-001" } },
      { type: "text_delta", delta: "稍后回复" },
    ];
    Object.freeze(laterText);
    expect(uiRowsFromEvents(laterText)).toEqual([
      { kind: "assistant", text: "稍后回复" },
      { kind: "tool", name: "lookupProduct", status: "call", text: "" },
    ]);
    expect(uiRowsFromEvents([{ type: "aborted" }])).toEqual([]);
    expect(uiRowsFromEvents([{ type: "agent_end" }])).toEqual([]);
    const blockedResult: SessionEvent[] = [
      { type: "tool_call", name: "bash", args: { cmd: "ls" } },
      { type: "tool_result", name: "bash", ok: true, text: "should ignore" },
    ];
    Object.freeze(blockedResult);
    expect(uiRowsFromEvents(blockedResult)).toEqual([
      { kind: "tool", name: "bash", status: "blocked", text: "forbidden" },
    ]);
  });
});

describe("fakeSessionStream", () => {
  test("for-await 收齐后交给 uiRowsFromEvents / reduceSessionEvents", async () => {
    const events = await collectFromAsync(fakeSessionStream());
    expect(reduceSessionEvents(events)).toEqual({
      text: "KB-001 库存 120",
      tools: ["lookupProduct"],
      ended: true,
      aborted: false,
    });
    expect(uiRowsFromEvents(events)).toEqual([
      { kind: "assistant", text: "KB-001 库存 120" },
      {
        kind: "tool",
        name: "lookupProduct",
        status: "ok",
        text: "KB-001 机械键盘 库存 120 单价 599",
      },
    ]);
    expect(events).toEqual(SHOP_SESSION_EVENTS);
    expect(uiRowsFromEvents(DANGEROUS_EVENTS)).toEqual([
      { kind: "tool", name: "bash", status: "blocked", text: "forbidden" },
    ]);
  });
});
`;

const demoSource = `/**
 * Ch24 · 真跑 @earendil-works/pi-agent-core 的最小示例。
 *
 * 本文件只给阅读 / 复制。测试禁止 import 本文件（包没有装进本课）。
 *
 * 作业全绿不需要本文件、不需要 API Key：假事件数组就能绿。
 * 真要跑 Agent：自行准备依赖与供应商 Key，把下面「复制区」拷到新文件再跑。
 *
 * 文档：https://pi.dev/docs/latest/sdk
 *
 * 不要用过时的包名。本章不讲 createAgentSession（那是 Ch25）。
 */

const COPY_WHEN_YOU_HAVE_A_KEY = \`
import { Agent } from '@earendil-works/pi-agent-core';

const agent = new Agent({
  streamFn,
  initialState: { tools, systemPrompt, model },
  beforeToolCall: async ({ toolCall }) => {
    if (toolCall.name === "bash") {
      return { block: true, reason: "bash is disabled", terminate: true };
    }
  },
});

agent.subscribe((event) => {
  if (event.type === "message_update" && event.assistantMessageEvent.type === "text_delta") {
    process.stdout.write(event.assistantMessageEvent.delta);
  }
  if (event.type === "tool_execution_start") {
    // tool_call 开始
  }
});
\`;

if (false) {
  // 有 Key 时把 COPY_WHEN_YOU_HAVE_A_KEY 拷出去跑；这里故意不 import 真包。
  console.log(COPY_WHEN_YOU_HAVE_A_KEY);
}
`;

writeFileSync(join(localDir, "assignment.ts"), localAssignment);
writeFileSync(join(localDir, "app.ts"), appSource);
writeFileSync(join(localDir, "assignment.test.ts"), localTest);
writeFileSync(join(localDir, "demo.ts"), demoSource);
console.log("wrote", localDir);
