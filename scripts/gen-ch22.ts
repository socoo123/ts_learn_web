/**
 * 生成 src/content/chapters/ch22.json
 * 运行：bun scripts/gen-ch22.ts
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const preamble = `/**
 * Ch22 作业：商品助手把模型流收成可测的纯函数。
 *
 * 场景：用户问「机械键盘还有货吗」，假事件数组依次吐
 * start → text_delta → done（带 usage）。
 * 你抽出增量、用量、结束原因，再拼成助手全文和 SSE。
 *
 * 没有供应商 Key 也能全绿：测的是事件数组，不是真模型。
 * 全绿 = 你掌握了 Ch22。
 */

type PiUsage = { input: number; output: number };

type PiEvent =
  | { type: "start" }
  | { type: "text_delta"; delta: string }
  | { type: "done"; reason: "stop" | "length" | "toolUse"; usage?: PiUsage }
  | { type: "error"; reason: "error" | "aborted" };`;

const functions = [
  {
    name: "collectTextDeltas",
    testSuite: "collectTextDeltas",
    skeleton: `/**
 * 【场景】商品助手气泡要按到达顺序显示 token。用户问机械键盘库存，
 * 流里先「机」再「械键盘」。start / done / error 不是字，忽略。
 *
 * 【转换点】判别联合：\`type === "text_delta"\` 之后才有 \`delta\`。
 * Java 老手别写成一堆 instanceof；看 \`type\` 字段收窄即可。
 *
 * 任务：按原序返回每个 text_delta 的 delta。不要 mutate events。空数组 → []。
 * 示例：
 *   [{type:"start"},{type:"text_delta",delta:"机"},{type:"text_delta",delta:"械键盘"},{type:"done",reason:"stop"}]
 *     → ["机","械键盘"]
 *   [{type:"text_delta",delta:"无"},{type:"text_delta",delta:"线鼠标"}] → ["无","线鼠标"]
 *   [] → []
 *
 * 提示：filter + map。不要 join。
 */
export function collectTextDeltas(events: PiEvent[]): string[] {
  throw new Error("TODO");
}`,
  },
  {
    name: "collectUsage",
    testSuite: "collectUsage",
    skeleton: `/**
 * 【场景】一次库存问答结束，后台要记消耗了多少 token。
 *
 * 【转换点】只看 type === "done" 且带 usage 的事件。取**最后一次**这样的 usage。
 * 没有 → null。error 没有 usage。done 不带 usage 字段就跳过（别当成 0）。
 *
 * 任务：返回 PiUsage 或 null。
 * 示例：
 *   末尾 done {input:12,output:4} → {input:12,output:4}
 *   只有 start + text_delta → null
 *   先有 usage 的 done、后一个 done 没有 usage → 仍返回前面那个 usage
 *
 * 提示：走一遍，见到带 usage 的 done 就覆盖。不要 mutate。
 */
export function collectUsage(events: PiEvent[]): PiUsage | null {
  throw new Error("TODO");
}`,
  },
  {
    name: "stopReason",
    testSuite: "stopReason",
    skeleton: `/**
 * 【场景】流结束了吗？正常说完是 stop；用户点停止是 aborted；超长是 length。
 *
 * 【转换点】从左到右，记下每一个 type 为 "done" 或 "error" 的 reason。
 * 返回**最后一个**这样的 reason；一个都没有 → null。
 *
 * 任务：string | null（reason 原样，不要翻译）。
 * 示例：
 *   末尾 done/stop → "stop"
 *   末尾 error/aborted → "aborted"
 *   只有 start + deltas → null
 *   [] → null
 *
 * 提示：error 的 reason 是 "error" | "aborted"；done 的是 "stop" | "length" | "toolUse"。
 */
export function stopReason(events: PiEvent[]): string | null {
  throw new Error("TODO");
}`,
  },
  {
    name: "joinAssistant",
    testSuite: "joinAssistant",
    skeleton: `/**
 * 【场景】气泡定稿：把所有增量拼成一句「机械键盘」或「KB-001 库存 120」。
 *
 * 【转换点】必须调用 collectTextDeltas(events)，再 .join("")。
 * 不要自己再写一遍 filter。空数组 → ""。
 *
 * 任务：返回助手全文。
 * 示例：
 *   机械键盘那串 deltas → "机械键盘"
 *   无线鼠标 deltas → "无线鼠标"
 *   [] → ""
 *
 * 提示：collectTextDeltas(events).join("")。中间不要空格。
 */
export function joinAssistant(events: PiEvent[]): string {
  throw new Error("TODO");
}`,
  },
  {
    name: "isStillStreaming",
    testSuite: "isStillStreaming",
    skeleton: `/**
 * 【场景】商品助手 UI 要不要还显示「正在输入」。数组是「到目前为止收到的事件」。
 *
 * 【转换点】没有 done 且没有 error → true（包括 []：还什么都没来，也算仍在流）。
 * 出现过任意 done 或 error → false（后面就算还有 delta 也已经终态）。
 *
 * 任务：返回 boolean。
 * 示例：
 *   [] → true
 *   start + text_delta → true
 *   含 done 或 error → false
 *
 * 提示：some。不要看数组是不是空就当结束。
 */
export function isStillStreaming(events: PiEvent[]): boolean {
  throw new Error("TODO");
}`,
  },
  {
    name: "toSseFromPiDeltas",
    testSuite: "toSseFromPiDeltas",
    skeleton: `/**
 * 【场景】以后要把这股流接到网页（Ch11/Ch21 的 SSE）。现在先把假事件编成 data 帧。
 *
 * 【转换点】每个 text_delta 追加 \`data: \${delta}\\n\\n\`（冒号后面有空格）。
 * 结束帧看 stopReason：
 *   "error" | "aborted" → 末尾再追加 data: [ERROR]\\n\\n 一次
 *   "stop" | "length" | "toolUse" → 末尾 data: [DONE]\\n\\n 一次
 *   仍在流（stopReason 为 null）→ 不要结束帧
 * 空数组 → ""。
 *
 * 任务：返回整段 SSE 字符串。
 * 示例：
 *   仍在流 deltas "机","械" → "data: 机\\n\\ndata: 械\\n\\n"
 *   上面再加 done/stop → 再多一段 data: [DONE]\\n\\n
 *   只有 error/aborted、无 done → 增量 + data: [ERROR]\\n\\n
 *   [] → ""
 *
 * 提示：增量可复用 collectTextDeltas；结束帧调用 stopReason。不要 mutate。
 */
export function toSseFromPiDeltas(events: PiEvent[]): string {
  throw new Error("TODO");
}`,
  },
];

const assignment = `${preamble}

${functions.map((f) => f.skeleton).join("\n\n")}
`;

const testSource = `const KB_EVENTS: PiEvent[] = [
  { type: "start" },
  { type: "text_delta", delta: "机" },
  { type: "text_delta", delta: "械键盘" },
  { type: "done", reason: "stop", usage: { input: 12, output: 4 } },
];

const MOUSE_EVENTS: PiEvent[] = [
  { type: "text_delta", delta: "无" },
  { type: "text_delta", delta: "线鼠标" },
  { type: "done", reason: "stop", usage: { input: 3, output: 9 } },
];

describe("collectTextDeltas", () => {
  it("机械键盘增量按序，忽略 start/done", () => {
    const events: PiEvent[] = [
      { type: "start" },
      { type: "text_delta", delta: "机" },
      { type: "text_delta", delta: "械键盘" },
      { type: "done", reason: "stop" },
    ];
    Object.freeze(events);
    expect(collectTextDeltas(events)).toEqual(["机", "械键盘"]);
    expect(events.length).toBe(4);
  });
  it("无线鼠标增量（防硬编码机械键盘）", () => {
    const events: PiEvent[] = [
      { type: "text_delta", delta: "无" },
      { type: "text_delta", delta: "线鼠标" },
    ];
    Object.freeze(events);
    expect(collectTextDeltas(events)).toEqual(["无", "线鼠标"]);
  });
  it("空数组 / 没有 delta → []", () => {
    expect(collectTextDeltas([])).toEqual([]);
    const onlyTerminal: PiEvent[] = [
      { type: "start" },
      { type: "done", reason: "stop" },
      { type: "error", reason: "aborted" },
    ];
    Object.freeze(onlyTerminal);
    expect(collectTextDeltas(onlyTerminal)).toEqual([]);
  });
  it("不 mutate events", () => {
    const events: PiEvent[] = [
      { type: "text_delta", delta: "KB-001" },
      { type: "text_delta", delta: " 库存 " },
      { type: "text_delta", delta: "120" },
    ];
    Object.freeze(events);
    collectTextDeltas(events);
    expect(events.length).toBe(3);
  });
});

describe("collectUsage", () => {
  it("最后一个带 usage 的 done", () => {
    Object.freeze(KB_EVENTS);
    expect(collectUsage(KB_EVENTS)).toEqual({ input: 12, output: 4 });
  });
  it("另一组 usage（防硬编码 12/4）", () => {
    Object.freeze(MOUSE_EVENTS);
    expect(collectUsage(MOUSE_EVENTS)).toEqual({ input: 3, output: 9 });
  });
  it("没有 usage / 空 / error → null", () => {
    expect(collectUsage([])).toBeNull();
    expect(collectUsage([{ type: "start" }, { type: "text_delta", delta: "机" }])).toBeNull();
    expect(collectUsage([{ type: "done", reason: "stop" }])).toBeNull();
    expect(collectUsage([{ type: "error", reason: "error" }])).toBeNull();
  });
  it("后一个 done 没有 usage 时保留前面的；后一个覆盖", () => {
    const keep: PiEvent[] = [
      { type: "done", reason: "stop", usage: { input: 1, output: 2 } },
      { type: "done", reason: "length" },
    ];
    Object.freeze(keep);
    expect(collectUsage(keep)).toEqual({ input: 1, output: 2 });
    const override: PiEvent[] = [
      { type: "done", reason: "stop", usage: { input: 1, output: 2 } },
      { type: "done", reason: "stop", usage: { input: 8, output: 7 } },
    ];
    Object.freeze(override);
    expect(collectUsage(override)).toEqual({ input: 8, output: 7 });
  });
});

describe("stopReason", () => {
  it("末尾 done/stop → stop", () => {
    const events: PiEvent[] = [
      { type: "start" },
      { type: "text_delta", delta: "机" },
      { type: "done", reason: "stop" },
    ];
    Object.freeze(events);
    expect(stopReason(events)).toBe("stop");
  });
  it("末尾 error/aborted → aborted；error/error → error", () => {
    const aborted: PiEvent[] = [
      { type: "text_delta", delta: "机" },
      { type: "error", reason: "aborted" },
    ];
    Object.freeze(aborted);
    expect(stopReason(aborted)).toBe("aborted");
    expect(stopReason([{ type: "error", reason: "error" }])).toBe("error");
  });
  it("只有 start+deltas / 空 → null", () => {
    expect(stopReason([])).toBeNull();
    const streaming: PiEvent[] = [{ type: "start" }, { type: "text_delta", delta: "机" }];
    Object.freeze(streaming);
    expect(stopReason(streaming)).toBeNull();
  });
  it("多个终端取最后一个；length / toolUse", () => {
    const both: PiEvent[] = [
      { type: "done", reason: "stop" },
      { type: "error", reason: "aborted" },
    ];
    Object.freeze(both);
    expect(stopReason(both)).toBe("aborted");
    expect(stopReason([{ type: "done", reason: "length" }])).toBe("length");
    expect(stopReason([{ type: "done", reason: "toolUse" }])).toBe("toolUse");
  });
});

describe("joinAssistant", () => {
  it("机械键盘 deltas → 机械键盘", () => {
    const events: PiEvent[] = [
      { type: "start" },
      { type: "text_delta", delta: "机" },
      { type: "text_delta", delta: "械键盘" },
      { type: "done", reason: "stop" },
    ];
    Object.freeze(events);
    expect(joinAssistant(events)).toBe("机械键盘");
  });
  it("无线鼠标（防硬编码）", () => {
    const events: PiEvent[] = [
      { type: "text_delta", delta: "无" },
      { type: "text_delta", delta: "线鼠标" },
    ];
    Object.freeze(events);
    expect(joinAssistant(events)).toBe("无线鼠标");
  });
  it("空 / 无 delta → 空串", () => {
    expect(joinAssistant([])).toBe("");
    expect(joinAssistant([{ type: "start" }, { type: "done", reason: "stop" }])).toBe("");
  });
});

describe("isStillStreaming", () => {
  it("空数组仍在流", () => {
    expect(isStillStreaming([])).toBe(true);
  });
  it("只有 start + deltas → true", () => {
    const events: PiEvent[] = [{ type: "start" }, { type: "text_delta", delta: "机" }];
    Object.freeze(events);
    expect(isStillStreaming(events)).toBe(true);
    expect(isStillStreaming([{ type: "text_delta", delta: "无" }, { type: "text_delta", delta: "线鼠标" }])).toBe(
      true,
    );
  });
  it("出现 done 或 error → false", () => {
    expect(isStillStreaming(KB_EVENTS)).toBe(false);
    expect(isStillStreaming([{ type: "error", reason: "aborted" }])).toBe(false);
    expect(isStillStreaming([{ type: "done", reason: "length" }])).toBe(false);
    const after: PiEvent[] = [
      { type: "done", reason: "stop" },
      { type: "text_delta", delta: "晚到" },
    ];
    Object.freeze(after);
    expect(isStillStreaming(after)).toBe(false);
  });
});

describe("toSseFromPiDeltas", () => {
  it("仍在流：只有 data 行，没有 DONE", () => {
    const events: PiEvent[] = [
      { type: "text_delta", delta: "机" },
      { type: "text_delta", delta: "械" },
    ];
    Object.freeze(events);
    expect(toSseFromPiDeltas(events)).toBe("data: 机\\n\\ndata: 械\\n\\n");
  });
  it("机械键盘 + done → 末尾 DONE；无线鼠标防硬编码", () => {
    const kb: PiEvent[] = [
      { type: "start" },
      { type: "text_delta", delta: "机" },
      { type: "text_delta", delta: "械键盘" },
      { type: "done", reason: "stop" },
    ];
    Object.freeze(kb);
    expect(toSseFromPiDeltas(kb)).toBe("data: 机\\n\\ndata: 械键盘\\n\\ndata: [DONE]\\n\\n");
    const mouse: PiEvent[] = [
      { type: "text_delta", delta: "无" },
      { type: "text_delta", delta: "线鼠标" },
      { type: "done", reason: "stop" },
    ];
    Object.freeze(mouse);
    expect(toSseFromPiDeltas(mouse)).toBe("data: 无\\n\\ndata: 线鼠标\\n\\ndata: [DONE]\\n\\n");
  });
  it("error 无 done → ERROR；空 → 空串", () => {
    const aborted: PiEvent[] = [
      { type: "text_delta", delta: "机" },
      { type: "error", reason: "aborted" },
    ];
    Object.freeze(aborted);
    expect(toSseFromPiDeltas(aborted)).toBe("data: 机\\n\\ndata: [ERROR]\\n\\n");
    expect(toSseFromPiDeltas([{ type: "error", reason: "error" }])).toBe("data: [ERROR]\\n\\n");
    expect(toSseFromPiDeltas([])).toBe("");
    expect(toSseFromPiDeltas([{ type: "start" }])).toBe("");
  });
  it("两个终端看最后一个；length/toolUse 也是 DONE", () => {
    const errorLast: PiEvent[] = [
      { type: "text_delta", delta: "机" },
      { type: "done", reason: "stop" },
      { type: "error", reason: "aborted" },
    ];
    Object.freeze(errorLast);
    expect(toSseFromPiDeltas(errorLast)).toBe("data: 机\\n\\ndata: [ERROR]\\n\\n");
    const doneLast: PiEvent[] = [
      { type: "error", reason: "error" },
      { type: "text_delta", delta: "机" },
      { type: "done", reason: "stop" },
    ];
    Object.freeze(doneLast);
    expect(toSseFromPiDeltas(doneLast)).toBe("data: 机\\n\\ndata: [DONE]\\n\\n");
    expect(toSseFromPiDeltas([{ type: "done", reason: "length" }])).toBe("data: [DONE]\\n\\n");
    expect(toSseFromPiDeltas([{ type: "done", reason: "toolUse" }])).toBe("data: [DONE]\\n\\n");
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
    `> **预计**：1 天 ｜ **前置**：Ch06（async/await）、Ch11（Stream / SSE 帧）、Ch21（SSE 流式响应）
> **目标**：① 认 Pi 最底层是**统一模型流**；② 订阅 \`text_delta\`；③ 用**假事件数组**抽出增量 / usage / 结束原因，再编成 SSE。
> 你 15 年 Java：\`HttpClient\` 一行行读 SSE。Python 课已经讲过 LLM / Prompt / RAG / ReAct **原理**——本章**不重复**那些，只教 TypeScript 里 \`@earendil-works/pi-ai\` 怎么把各家模型收成同一种事件。

> 📐 **本教程的契约**：下面每一节（§22.1–§22.6）都**精确对应**作业里的题。讲过的才考，考的必讲过。卡住时按作业函数名回查对应小节。
> **不讲**：Agent / Tool（Ch23）、\`createAgentSession\`（Ch25）、Hono 接线（Ch26）。作业禁止 bash / 任意写文件。JSON 作业是纯函数：假事件进、字符串出。

---`,
    [],
  ),
  sec(
    "sec-map",
    "🗺️ 本章地图",
    null,
    `本章主线：**商品助手 Agent** 的最底层——模型怎么把「机械键盘还有货吗」流成字。用户问库存，流里先后吐 \`KB-001\`、\` 库存 \`、\`120\`，最后 \`done\` 带上 usage。

读完这章 + 完成作业，你将能够：

- 从事件数组里按序收集 \`text_delta.delta\`
- 取出最后一个带 usage 的 \`done\`
- 读出最后一个 \`done\` / \`error\` 的 \`reason\`
- 拼出助手全文（调用 \`collectTextDeltas\`）
- 判断「还在流」还是已经终态（空数组也算还在流）
- 把增量编成 Ch11/Ch21 那种 \`data: …\\n\\n\` SSE

**作业 ↔ 教程对应表**（学哪节，就去做哪题）：

| 作业题 | 对应小节 | 核心知识点 |
|--------|----------|-----------|
| \`collectTextDeltas\` | §22.1 | 只收 \`text_delta\` |
| \`collectUsage\` | §22.2 | 最后一次带 usage 的 done |
| \`stopReason\` | §22.3 | 最后一个 done / error 的 reason |
| \`joinAssistant\` | §22.4 | 调用 collectTextDeltas 再 join |
| \`isStillStreaming\` | §22.5 | 无 done 且无 error |
| \`toSseFromPiDeltas\` | §22.6 | SSE \`data:\` 帧 + DONE/ERROR |

本地文件：\`local/m5/ch22/assignment.ts\`（改 TODO）、\`app.ts\`（假 async generator，不联网）、\`assignment.test.ts\`、\`demo.ts\`（真 \`pi-ai\` 示例，测试不要 import 它）。

跑测试：\`bun test local/m5/ch22\`。

---`,
    [],
  ),
  sec(
    "sec-path",
    "⏱️ 学习路径：费曼五步（约 50–70 分钟）",
    null,
    `| 步 | 你要做 | 在哪做 |
|----|--------|--------|
| ① 预览猜（2 分钟） | 猜各家模型流为什么能收成同一种事件 | 本页 ① |
| ② 先动手 | 打开 \`local/m5/ch22/assignment.ts\` 改 TODO | 仓库 local/ |
| ③ 提取+反馈 | \`bun test local/m5/ch22\` 看红绿 | 终端 |
| ④ 费曼（2 分钟） | 大白话讲清「为什么空数组还在流」 | 本页 ④ |
| ⑤ 存闪卡 | 章末闪卡标复习日期 | 闪卡 |

> 💡 网页这一章是只读的。不要在浏览器里改代码。没有 API Key 作业也能绿——测的是假事件。真打模型见 \`demo.ts\`（要 Key，本课测试不跑它）。
> \`joinAssistant\` **必须调用** \`collectTextDeltas\`。\`toSseFromPiDeltas\` 用 \`stopReason\` 决定结束帧。

---`,
    [],
  ),
  sec(
    "sec-guess",
    "① 预览猜（2 分钟 · 激活你的 Java / Python 直觉）",
    null,
    `先别看答案，凭经验猜一猜（猜错没关系）：

1. Java \`HttpClient\` 读 SSE 是一行行 \`data:\`；Python OpenAI SDK 是 \`chunk.choices[0].delta.content\`。Pi 把这两家收成什么事件名？字段叫 \`content\` 还是 \`delta\`？
2. 本机没有 \`OPENAI_API_KEY\`，\`bun test local/m5/ch22\` 还能绿吗？
3. 事件数组是 \`[]\`：商品助手该显示「正在输入」还是「已结束」？
4. 两个 \`done\`，第一个带 usage、第二个不带：usage 取哪一个？
5. 流里先 \`done/stop\` 又来 \`error/aborted\`，SSE 结束帧该是 \`[DONE]\` 还是 \`[ERROR]\`？
6. 真 API 的 token 用量挂在事件上，还是挂在最终 message 上？作业为什么简化？

> 猜完，带着验证心态进入正文。第 2、3、5 题是本章的 🔴。

---`,
    [],
  ),
  sec(
    "sec-world",
    "统一模型流：各家 chunk → text_delta 🔴",
    null,
    `M5 做的是**商品助手 Agent**。Python 课已经讲过「模型为什么能说话、Prompt / RAG / ReAct 是什么」——这里不再上原理课。本章只解决 TypeScript 落地的第一层：

**Pi 的最底层 \`@earendil-works/pi-ai\` 是一条统一的模型流。** 你订阅 \`text_delta\`，不要为 OpenAI / Anthropic / 本地模型各写一套解析。

包名是 \`@earendil-works/pi-ai\`（不要用过时的 \`@mariozechner/*\`）。文档：https://pi.dev/docs/latest/sdk ；README：https://github.com/earendil-works/pi/blob/main/packages/ai/README.md

| | Java | Python | 本章 Pi |
|---|---|---|---|
| 流从哪来 | \`HttpClient\` + \`BodyHandlers.ofLines()\` 读 SSE | \`httpx\` 行 / \`openai\` \`stream=True\` 的 chunk | \`builtinModels()\` 然后 \`models.stream(model, context)\` |
| 一个字 | 解析 \`data:\` JSON 里的 \`delta.content\` | \`chunk.choices[0].delta.content\` | \`event.type === "text_delta"\` 然后 \`event.delta\` |
| 结束 | 看到 \`[DONE]\` 或连接关 | 迭代器耗尽 | \`done\`（\`stop\` / \`length\` / \`toolUse\`）或 \`error\`（\`error\` / \`aborted\`） |
| 用量 | 看最后一帧 usage | \`usage\` 字段因供应商而异 | 最终 message 的 \`usage: { input, output }\`；作业把 usage 挂在 \`done\` 上方便测 |

### Java：自己拆 SSE

\`\`\`java
HttpClient client = HttpClient.newHttpClient();
HttpRequest req = HttpRequest.newBuilder(URI.create(url))
    .header("Authorization", "Bearer " + apiKey)
    .POST(HttpRequest.BodyPublishers.ofString(jsonBody))
    .build();
client.send(req, HttpResponse.BodyHandlers.ofLines())
    .body()
    .forEach(line -> {
        if (line.startsWith("data: ")) {
            String payload = line.substring(6); // 冒号后有空格，和 Ch11 一样
            // OpenAI 形态：{"choices":[{"delta":{"content":"机"}}]}
        }
    });
\`\`\`

每家 JSON 形状不一样。Java 老手会为每个供应商写 Jackson DTO——这就是 Pi 要抹平的税。

### Python：SDK 已经帮你拆了一层

\`\`\`python
for chunk in client.chat.completions.create(model="gpt-4o-mini", messages=msgs, stream=True):
    delta = chunk.choices[0].delta.content  # 可能是 None
    if delta:
        print(delta, end="")
\`\`\`

换 Anthropic 又是另一套 \`event.type == "content_block_delta"\`。Python 课讲的是「流式是什么」；本章讲「TypeScript 里用哪一个事件名就够了」。

### TypeScript：\`builtinModels\` + \`stream\` + \`for await\`

真跑需要装包和供应商 Key（\`OPENAI_API_KEY\` 等）。**作业和 \`bun test\` 禁止联网、禁止装这个包**——用假事件。真示例在 \`local/m5/ch22/demo.ts\`（注释 / 字符串里，测试不要 import）。

\`\`\`ts
import { builtinModels } from "@earendil-works/pi-ai/providers/all";

const models = builtinModels();
const model = models.getModel("openai", "gpt-4o-mini")!;

const context = {
  systemPrompt: "你是商品助手。用户问库存时用 SKU 和数字简短回答。",
  messages: [
    { role: "user", content: "机械键盘还有货吗？", timestamp: Date.now() },
  ],
};

const s = models.stream(model, context);
for await (const event of s) {
  if (event.type === "text_delta") {
    process.stdout.write(event.delta); // 可能是 "KB-001" 再 " 库存 " 再 "120"
  } else if (event.type === "done") {
    console.log("reason", event.reason);           // stop | length | toolUse
    console.log("usage", event.message.usage);     // { input, output, ... }
  } else if (event.type === "error") {
    console.error(event.reason);                   // error | aborted
  }
}
\`\`\`

作业里的 \`PiEvent\` 是**教学用精简版**：

- \`start\` / \`text_delta\` / \`done\` / \`error\` 这四个够写纯函数
- 真 API 还有 \`text_start\`、\`thinking_delta\`、\`toolcall_*\`——**Ch23 才接 Tool**，本章当它们不存在
- 真 \`done\` 的 usage 在 \`event.message.usage\`；作业把 \`usage?: PiUsage\` 直接挂在 \`done\` 上，避免你在纯函数里钻 message

\`\`\`mermaid
flowchart TD
    user["用户问机械键盘库存"] --> unify["pi-ai 统一流"]
    unify --> startN["start"]
    startN --> d1["text_delta KB-001"]
    d1 --> d2["text_delta 库存 120"]
    d2 --> branch{"结束方式"}
    branch -->|"reason stop"| doneN["done + usage"]
    branch -->|"reason aborted"| errN["error"]
    doneN --> collect["collectText<br/>Deltas"]
    collect --> join["join<br/>Assistant"]
    join --> sse["SSE data 行加 DONE"]
    errN --> sseErr["SSE data 行加 ERROR"]

    style user fill:#FFE082,stroke:#F9A825,color:#1f1f1f
    style unify fill:#80DEEA,stroke:#0097A7,color:#1f1f1f
    style startN fill:#FFE082,stroke:#F9A825,color:#1f1f1f
    style d1 fill:#80DEEA,stroke:#0097A7,color:#1f1f1f
    style d2 fill:#80DEEA,stroke:#0097A7,color:#1f1f1f
    style branch fill:#CE93D8,stroke:#7B1FA2,color:#1f1f1f
    style doneN fill:#A5D6A7,stroke:#388E3C,color:#1f1f1f
    style errN fill:#EF9A9A,stroke:#C62828,color:#1f1f1f
    style collect fill:#A5D6A7,stroke:#388E3C,color:#1f1f1f
    style join fill:#A5D6A7,stroke:#388E3C,color:#1f1f1f
    style sse fill:#A5D6A7,stroke:#388E3C,color:#1f1f1f
    style sseErr fill:#EF9A9A,stroke:#C62828,color:#1f1f1f
\`\`\`

本地 \`app.ts\` 用 \`async function*\` **假**生成同一条管道：\`yield start\` → 几个 \`text_delta\` → \`done + usage\`。\`for await\` 收进数组，再交给上面 6 个纯函数。没有 \`fetch\`、没有端口、没有 Key。

### ❌ / ✅

\`\`\`ts
// ❌ 为 OpenAI / Anthropic 各写一套 chunk 解析当作业
// ❌ 测试里 import @earendil-works/pi-ai（本课没装，也没有 Key）
// ❌ 作业去调真实 fetch / 等 setTimeout
// ❌ 把 Prompt 工程、RAG、ReAct 再讲一遍当作业
// ✅ 认 text_delta / done / error；作业吃 PiEvent[]
\`\`\`

### 本课怎么算「会了」

打开 \`local/m5/ch22/assignment.ts\`，\`bun test local/m5/ch22\`。六个纯函数全绿，再加：假 async generator 能被收齐，\`joinAssistant\` 得到 \`KB-001 库存 120\`，\`collectUsage\` 拿到假 usage。**全绿 = 这题掌握。** 想真打模型：装包 + Key + 复制 \`demo.ts\` 里的片段。

---`,
    [],
  ),
  sec(
    "sec-22.1",
    "§22.1 只收 text_delta（对应：`collectTextDeltas`）🟡",
    "22.1",
    `判别联合你在 Ch03 写过：看 \`type\` 收窄。\`text_delta\` 才有 \`delta\`；\`start\` / \`done\` / \`error\` 没有字。

\`\`\`ts
function collectTextDeltas(events: PiEvent[]): string[] {
  return events.filter((e) => e.type === "text_delta").map((e) => e.delta);
}

collectTextDeltas([
  { type: "start" },
  { type: "text_delta", delta: "机" },
  { type: "text_delta", delta: "械键盘" },
  { type: "done", reason: "stop" },
]); // ["机","械键盘"]

collectTextDeltas([
  { type: "text_delta", delta: "无" },
  { type: "text_delta", delta: "线鼠标" },
]); // ["无","线鼠标"]

collectTextDeltas([]); // []
\`\`\`

\`filter\` + \`map\` 会得到**新数组**。不要 \`events.push\`，不要改传入的对象。

对照：Java 从 SSE 行抽出 \`delta.content\` 放进 \`List<String>\`；Python 把非空 \`delta\` append 到 list。Pi 已经帮你拆好，作业只做收集。

### ❌ / ✅

\`\`\`ts
// ❌ return events.map(e => (e as any).delta)  → start 变成 undefined
// ❌ 硬编码 ["机","械键盘"]
// ❌ events.splice 改原数组
// ✅ 只在 type === "text_delta" 时收 delta
\`\`\`

> ✅ **做 \`collectTextDeltas\`**：按序收增量。

---`,
    ["collectTextDeltas"],
  ),
  sec(
    "sec-22.2",
    "§22.2 最后一次带 usage 的 done（对应：`collectUsage`）🟡",
    "22.2",
    `真 API：\`done\` 事件上有最终 message，\`usage: { input, output }\` 在 message 上。作业简化为 \`done.usage?\`。

规则：**最后一个带 \`usage\` 字段的 \`done\`**。没有 → \`null\`。

- \`error\` 没有 usage（就算真 API 的 error message 里有部分计数，作业也不看）
- \`{ type: "done", reason: "stop" }\` 不带 usage → 跳过，别发明 \`{input:0,output:0}\`

\`\`\`ts
function collectUsage(events: PiEvent[]): PiUsage | null {
  let found: PiUsage | null = null;
  for (const e of events) {
    if (e.type === "done" && e.usage) found = e.usage;
  }
  return found;
}

collectUsage([
  { type: "done", reason: "stop", usage: { input: 12, output: 4 } },
]); // { input: 12, output: 4 }

collectUsage([
  { type: "done", reason: "stop", usage: { input: 1, output: 2 } },
  { type: "done", reason: "length" },
]); // { input: 1, output: 2 }  ← 后一个没 usage，不覆盖

collectUsage([{ type: "error", reason: "aborted" }]); // null
collectUsage([]); // null
\`\`\`

两个都带 usage：后面的覆盖前面的（「最后一次」）。

### ❌ / ✅

\`\`\`ts
// ❌ 见到第一个 done 就 return（后面可能还有带 usage 的）
// ❌ error 也去读 (e as any).usage
// ❌ 没有 usage 就返回 { input: 0, output: 0 }
// ✅ 只在 done && usage 时覆盖；否则保持 null
\`\`\`

> ✅ **做 \`collectUsage\`**：最后一次带 usage 的 done。

---`,
    ["collectUsage"],
  ),
  sec(
    "sec-22.3",
    "§22.3 最后一个终端 reason（对应：`stopReason`）🟡",
    "22.3",
    `Pi 把正常结束和失败分成两种事件：

| 事件 | reason |
|---|---|
| \`done\` | \`"stop"\` 说完了 · \`"length"\` 触顶 · \`"toolUse"\` 要调工具（Ch23 才真正接 Tool） |
| \`error\` | \`"error"\` 出错 · \`"aborted"\` 取消 |

本题只问：**最后一个** \`done\` 或 \`error\` 的 \`reason\`。没有终端事件 → \`null\`（还在流）。

\`\`\`ts
function stopReason(events: PiEvent[]): string | null {
  let last: string | null = null;
  for (const e of events) {
    if (e.type === "done" || e.type === "error") last = e.reason;
  }
  return last;
}

stopReason([{ type: "done", reason: "stop" }]);     // "stop"
stopReason([{ type: "error", reason: "aborted" }]); // "aborted"
stopReason([{ type: "start" }, { type: "text_delta", delta: "机" }]); // null
stopReason([]); // null

stopReason([
  { type: "done", reason: "stop" },
  { type: "error", reason: "aborted" },
]); // "aborted"  ← 最后那个终端
\`\`\`

\`toolUse\` 本章当作「流结束的一种 reason」记下即可，**不要**实现 Tool。

### ❌ / ✅

\`\`\`ts
// ❌ 只看 events.at(-1)，最后一项若是晚到的 text_delta 会丢 reason
// ❌ 把 aborted 翻译成 "cancelled"
// ❌ 空数组返回 "stop"
// ✅ 扫全部 done/error，留最后一个 reason
\`\`\`

> ✅ **做 \`stopReason\`**：最后一个终端的 reason。

---`,
    ["stopReason"],
  ),
  sec(
    "sec-22.4",
    "§22.4 拼出助手全文（对应：`joinAssistant`）🟢",
    "22.4",
    `气泡定稿就是增量连起来。**必须调用** \`collectTextDeltas\`，不要复制一份 filter——后面改收集规则时拼全文会一起对。

\`\`\`ts
function joinAssistant(events: PiEvent[]): string {
  return collectTextDeltas(events).join("");
}

joinAssistant([
  { type: "start" },
  { type: "text_delta", delta: "机" },
  { type: "text_delta", delta: "械键盘" },
  { type: "done", reason: "stop" },
]); // "机械键盘"

joinAssistant([
  { type: "text_delta", delta: "无" },
  { type: "text_delta", delta: "线鼠标" },
]); // "无线鼠标"

joinAssistant([]); // ""
\`\`\`

\`join("")\`：中间不要空格。token 自己带着空格（\`" 库存 "\`）时才会出现空格。

对照：Java \`String.join("", deltas)\`；Python \`"".join(deltas)\`。

### ❌ / ✅

\`\`\`ts
// ❌ 硬编码 return "机械键盘"
// ❌ 自己再写一遍 filter，不调用 collectTextDeltas
// ❌ join(" ") 多出空格
// ✅ collectTextDeltas(events).join("")
\`\`\`

> ✅ **做 \`joinAssistant\`**：调用 collectTextDeltas。

---`,
    ["joinAssistant"],
  ),
  sec(
    "sec-22.5",
    "§22.5 还在流吗（对应：`isStillStreaming`）🔴",
    "22.5",
    `UI 的「正在输入」看的是：**到目前为止的事件里，有没有终态**。

- 没有 \`done\` 且没有 \`error\` → \`true\`
- **\`[]\` 也是 \`true\`**：连接已发起、一帧都还没到，仍然算在流。不要把「空」当成「结束」
- 出现过任意 \`done\` 或 \`error\` → \`false\`（后面即使误多一个 delta，也已经终态）

\`\`\`ts
function isStillStreaming(events: PiEvent[]): boolean {
  return !events.some((e) => e.type === "done" || e.type === "error");
}

isStillStreaming([]); // true
isStillStreaming([{ type: "start" }, { type: "text_delta", delta: "机" }]); // true
isStillStreaming([{ type: "done", reason: "stop" }]); // false
isStillStreaming([{ type: "error", reason: "aborted" }]); // false
\`\`\`

这和 Java 里「InputStream.read() 返回 -1 才算结束」、Python 里「迭代器 StopIteration」是同一类判断：没看到结束标记，就不能当结束。空缓冲区 ≠ EOF。

### ❌ / ✅

\`\`\`ts
// ❌ return events.length > 0  → 空数组被你判成结束
// ❌ 只检查最后一个是不是 done（中间的 error 也该结束）
// ❌ 把 start 当成结束
// ✅ 全程没有 done 且没有 error
\`\`\`

> ✅ **做 \`isStillStreaming\`**：空数组为 true。

---`,
    ["isStillStreaming"],
  ),
  sec(
    "sec-22.6",
    "§22.6 编成 SSE（对应：`toSseFromPiDeltas`）🔴",
    "22.6",
    `Ch11 / Ch21 的帧格式：\`data: \` + payload + \`\\n\\n\`（**冒号后面有空格**）。本章把 Pi 增量编成同样的字节，以后 Ch26 再接到 Hono。本题**不要** import 框架。

规则：

1. 每个 \`text_delta\` 追加 \`data: \${delta}\\n\\n\`
2. 结束帧看 \`stopReason(events)\`：
   - \`"error"\` 或 \`"aborted"\` → 末尾一次 \`data: [ERROR]\\n\\n\`
   - \`"stop"\` / \`"length"\` / \`"toolUse"\` → 末尾一次 \`data: [DONE]\\n\\n\`
   - \`null\`（还在流）→ **不要**结束帧
3. 空数组 → \`""\`
4. \`[DONE]\` / \`[ERROR]\` 只追加在**全部增量之后**，各最多一次

两个终端都出现时：\`stopReason\` 已经取**最后那个**终端，所以先 done 后 error → \`[ERROR]\`；先 error 后 done → \`[DONE]\`。

\`\`\`ts
function toSseFromPiDeltas(events: PiEvent[]): string {
  let out = collectTextDeltas(events).map((d) => \`data: \${d}\\n\\n\`).join("");
  const reason = stopReason(events);
  if (reason === "error" || reason === "aborted") out += "data: [ERROR]\\n\\n";
  else if (reason === "stop" || reason === "length" || reason === "toolUse") {
    out += "data: [DONE]\\n\\n";
  }
  return out;
}

toSseFromPiDeltas([
  { type: "text_delta", delta: "机" },
  { type: "text_delta", delta: "械" },
]); // "data: 机\\n\\ndata: 械\\n\\n"  仍在流，无 DONE

toSseFromPiDeltas([
  { type: "text_delta", delta: "机" },
  { type: "done", reason: "stop" },
]); // "data: 机\\n\\ndata: [DONE]\\n\\n"

toSseFromPiDeltas([{ type: "error", reason: "aborted" }]); // "data: [ERROR]\\n\\n"
toSseFromPiDeltas([]); // ""
\`\`\`

复用 \`collectTextDeltas\` 和 \`stopReason\`，不要各写一套扫描。

### ❌ / ✅

\`\`\`ts
// ❌ "data:"+delta  少了冒号后的空格（对不上 Ch11）
// ❌ 还在流也拼 [DONE]
// ❌ 每个 delta 后面都跟一个 [DONE]
// ❌ 同时有 done 和 error 时只看「有没有 done」忽略先后
// ✅ 增量 data 行；结束帧看 stopReason；空串就是空串
\`\`\`

> ✅ **做 \`toSseFromPiDeltas\`**：SSE 帧 + 按 stopReason 结束。

---`,
    ["toSseFromPiDeltas"],
  ),
  sec(
    "sec-pits",
    "⚠️ Java / Python 老手几个坑",
    null,
    `1. **为每个供应商写 DTO。** Pi 的价值就是 \`text_delta\`。作业不要解析 OpenAI JSON。
2. **没有 Key 就不会写作业。** 假事件数组就能绿。真跑才要 \`OPENAI_API_KEY\` 等，见 \`demo.ts\`。
3. **空数组当成结束。** \`isStillStreaming([]) === true\`。没看到 done/error 就还在流。
4. **usage 取第一个 done / 从 error 上读。** 取最后一个**带 usage 字段**的 done。
5. **只看数组最后一项当 reason。** 最后一项可能是晚到的 delta。扫所有 done/error。
6. **\`joinAssistant\` 不调用 \`collectTextDeltas\`。** 测试能蒙对，验收脚本会查调用。
7. **SSE 写成 \`data:\` 没空格。** 和 Ch11 一样，冒号后有空格。
8. **还在流就发 \`[DONE]\`。** 结束帧只在有终端 reason 时发一次。
9. **作业 import \`@earendil-works/pi-ai\` / hono / fetch。** JSON 作业是纯函数。真示例只在 \`demo.ts\` 的注释里。
10. **本章就去定义 Tool / 开 Agent 循环。** 那是 Ch23。本章只处理文本流。

---`,
    [],
  ),
  sec(
    "sec-homework",
    "📝 本章作业",
    null,
    `上面 6 个函数按节交错出现。每个注释里有【场景】【转换点】、示例和提示。

**完成方式**：打开仓库 \`local/m5/ch22/assignment.ts\`，把 \`throw new Error("TODO")\` 换成实现，然后：

\`\`\`bash
bun test local/m5/ch22
\`\`\`

\`app.ts\` 是假 \`async function*\`，不联网。\`demo.ts\` 是真 \`pi-ai\` 抄写稿，**测试不要 import 它**（包没装）。

卡住就回对应 §：\`collectTextDeltas\` → §22.1，\`joinAssistant\` → §22.4（请调用 collectTextDeltas），\`isStillStreaming\` → §22.5（空数组为 true），\`toSseFromPiDeltas\` → §22.6（请看 stopReason）。

---`,
    [],
  ),
  sec(
    "sec-check",
    "✅ 自测：你真的掌握了吗？",
    null,
    `- [ ] 能说清 Java SSE / Python chunk 和 Pi \`text_delta\` 的对应
- [ ] 没有 Key 时作业为什么还能绿
- [ ] \`collectTextDeltas\` 忽略 start/done/error，不 mutate
- [ ] usage 取最后一个带该字段的 done；error 没有 usage
- [ ] \`stopReason\` 取最后一个终端；还在流是 null
- [ ] \`joinAssistant\` 调用了 \`collectTextDeltas\`
- [ ] \`[]\` 仍在流；有 done 或 error 则否
- [ ] SSE 冒号后有空格；结束帧按 stopReason 只追加一次
- [ ] \`bun test local/m5/ch22\` 全绿

---`,
    [],
  ),
  sec(
    "sec-feynman",
    "🎓 费曼挑战",
    null,
    `用大白话讲给「Java 同事」听。讲不清 = 还没真懂。

任选一题（1–2 分钟）：

1. 「OpenAI 和 Anthropic 的流长得不一样，为什么商品助手只订阅 \`text_delta\` 就够？没有 Key 测试怎么绿？」— 卡壳重读总述
2. 「为什么空的事件数组要显示正在输入，而不是显示说完了？」— 卡壳重读 §22.5
3. 「流里又有 done 又有 error，SSE 凭什么决定 \`[DONE]\` 还是 \`[ERROR]\`？」— 卡壳重读 §22.3 + §22.6

---`,
    [],
  ),
  sec(
    "sec-next",
    "⏭️ 下一步",
    null,
    `Ch22 掌握后，你已经会订阅统一模型流、把假事件收成文本和 SSE。下一章是 **Ch23 · pi-agent-core：最小 Agent + Tool**：模型可以决定调不调 \`lookupProduct\` 这类工具。本章的 \`toolUse\` 只是一个 reason 字符串；真正的 Tool 定义和假 \`streamFn\` 在下一章。不要在本章作业里开 bash 或写文件系统。`,
    [],
  ),
];

const tutorialMd = `# Ch22 · pi-ai：调模型 + 流式

${sections
  .map((s) => (s.heading ? `## ${s.heading}\n\n${s.body}` : s.body))
  .join("\n\n")}
`;

const reviewMd = `# Ch22 · 记忆闪卡

> 先回忆，再翻答案。连续 2 次秒答 → 退役。

## 🔖 闪卡

| # | 正面（问题） | 背面（答案） | 掌握 |
|---|---|---|---|
| 1 | Java 读 SSE、Python 读 \`delta.content\`，Pi 统一成什么事件？字段名？ | \`text_delta\`，字段是 \`delta\`（不是 content）。\`@earendil-works/pi-ai\` 的 \`models.stream\` + \`for await\`。 | ⬜ |
| 2 | 没有 OPENAI_API_KEY，作业能绿吗？测试可以 import pi-ai 吗？ | 能绿：假 \`PiEvent[]\` / async generator。测试禁止 import 该包、禁止联网。真跑看 \`demo.ts\`，需要供应商 Key。 | ⬜ |
| 3 | \`isStillStreaming([])\` 为什么是 true？ | 空 = 还一帧都没到，不是 EOF。没有 done 且没有 error 才算仍在流。出现任一个终端 → false。 | ⬜ |
| 4 | 两个 done，第一个有 usage、第二个没有，\`collectUsage\` 返回谁？ | 最后一个**带 usage 字段**的 done，所以仍是第一个的对象。error 没有 usage。都没有 → null。 | ⬜ |
| 5 | 先 \`done/stop\` 再 \`error/aborted\`，\`stopReason\` 和 SSE 结束帧？ | reason 是 \`"aborted"\`。\`toSseFromPiDeltas\` 看 stopReason：error/aborted → \`[ERROR]\`；stop/length/toolUse → \`[DONE]\`；仍在流不加结束帧。 | ⬜ |
| 6 | \`joinAssistant\` 必须怎么写？空数组？ | 必须调用 \`collectTextDeltas(events).join("")\`。\`[]\` → \`""\`。不要硬编码「机械键盘」。 | ⬜ |
| 7 | SSE 的 \`data:\` 后面有没有空格？还在流要不要 \`[DONE]\`？ | 有空格：\`data: \${delta}\\n\\n\`（同 Ch11/Ch21）。还在流不加 \`[DONE]\`。空数组 → \`""\`。 | ⬜ |
| 8 | 真 API 的 usage 在哪？作业为什么挂在 done 上？ | 真 API 在 \`done\` 的最终 \`message.usage\`（\`input\` / \`output\`）。作业精简为 \`done.usage?\`，纯函数好测。 | ⬜ |
| 9 | 本章作业要不要写 Tool / Prompt / RAG / ReAct？ | 不要。原理已在 Python 课。Tool 是 Ch23；\`createAgentSession\` 是 Ch25；Hono 是 Ch26。本章只处理文本流。 | ⬜ |

## 🎓 费曼自检

- [ ] 能说清统一流 vs 各家 chunk
- [ ] 能说清空数组仍在流、假事件无 Key 也能绿
- [ ] 能说清 stopReason 决定 SSE 结束帧
`;

const chapter = {
  id: "ch22",
  num: "22",
  title: "pi-ai：调模型 + 流式",
  runMode: "local" as const,
  tutorialMd,
  assignment,
  testName: "ch22_assignment",
  testSource,
  reviewMd,
  interleaved: true,
  sections,
  functions,
  preamble,
  localHint: "bun test local/m5/ch22",
};

const out = join(dirname(fileURLToPath(import.meta.url)), "../src/content/chapters/ch22.json");
mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, JSON.stringify(chapter, null, 2) + "\n");
console.log("wrote", out);
