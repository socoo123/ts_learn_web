/**
 * 生成 src/content/chapters/ch26.json 与 local/m5/ch26/
 * 运行：bun scripts/gen-ch26.ts
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const preamble = `/**
 * Ch26 作业：商品助手的前后端数据协议（纯函数）。
 *
 * 场景：用户 POST /chat「机械键盘还有货吗」。服务端把 Pi 事件写成 SSE；
 * React 用 reducer 折成 Ch24 的 UiRow。JSON 作业不 import 服务端框架 / 不 fetch。
 * 真最小服务在 local/m5/ch26/app.ts；无 Key 也能全绿。
 *
 * 全绿 = 你掌握了 Ch26。本地：bun test local/m5/ch26
 *
 * 本页已注入全局 z（zod）。真实 local/m5/ch26/assignment.ts 需要
 * import { z } from "zod"；本页运行器会剥掉 import。
 */

export type PiEvent =
  | { type: "text_delta"; delta: string }
  | { type: "tool_call"; name: string; args: Record<string, unknown> }
  | { type: "tool_result"; name: string; ok: boolean; text: string }
  | { type: "agent_end" }
  | { type: "aborted" };

export type UiRow =
  | { kind: "assistant"; text: string }
  | { kind: "tool"; name: string; status: "call" | "ok" | "error" | "blocked"; text: string };

export type ChatState = {
  rows: UiRow[];
  ended: boolean;
  aborted: boolean;
};

export type ChatRequest = { message: string; sku?: string };

export type ToolRow = Extract<UiRow, { kind: "tool" }>;`;

const functions = [
  {
    name: "piEventToSse",
    testSuite: "piEventToSse",
    skeleton: `/**
 * 【场景】服务端要把一条 Pi 事件推给课程站 Chat UI。机械键盘第一个字是「机」。
 *
 * 【转换点】沿用 Ch21：\`data: \${payload}\\n\\n\`（冒号后有空格）。
 * type === "agent_end" → payload 固定 "[DONE]"（不是 JSON）。
 * 其它事件 → JSON.stringify(event) 原样当 payload。不要 mutate。
 *
 * 任务：返回完整一帧（含结尾空行）。
 * 示例：
 *   { type:"text_delta", delta:"机" } → 'data: {"type":"text_delta","delta":"机"}\\n\\n'
 *   { type:"agent_end" } → "data: [DONE]\\n\\n"
 *   { type:"aborted" } → 'data: {"type":"aborted"}\\n\\n'（不要变成 [DONE]）
 *   lookupProduct 的 tool_call 也走 JSON.stringify
 *
 * 提示：先判断 agent_end，再 JSON.stringify。测试会 freeze 事件。
 */
export function piEventToSse(event: PiEvent): string {
  throw new Error("TODO");
}`,
  },
  {
    name: "chatRequestSchema",
    testSuite: "chatRequestSchema",
    skeleton: `/**
 * 【场景】POST /chat 的 JSON body。用户问「机械键盘还有货吗」，可选带 sku。
 *
 * 【转换点】TS 类型编译后蒸发 🔴。HTTP 边界必须 zod（对照 Ch07 / Ch18）。
 * 本函数**返回 schema**（像 Ch07 的 productSchema），不要在这里 parse。
 *
 * 规则：
 *   message: trim 后 1–500 字
 *   sku: 可选；若出现则 trim 后至少 1 字
 *   多余键丢掉
 *
 * 任务：return z.object({ ... })
 * 示例（调用方 safeParse）：
 *   { message:"机械键盘还有货吗" } → 成功，data 无 sku
 *   { message:"  无线鼠标  ", sku:"MS-002" } → message "无线鼠标"
 *   { message:"   " } / 缺 message / 501 字 → success false
 *
 * 提示：z.string().trim().min(1).max(500)；sku 用 .optional()。
 */
export function chatRequestSchema() {
  throw new Error("TODO");
}`,
  },
  {
    name: "reduceChatFromSse",
    testSuite: "reduceChatFromSse",
    skeleton: `/**
 * 【场景】React 侧每收到一帧 data 就折一次 ChatState。对照 Ch13 的 reduceChat。
 *
 * 【转换点】**必须调用** endOfTurn(payload)。payload 是 data 行内容，不是整帧。
 * ended 已经是 true → 原样返回**同一引用**（后续帧丢掉）。
 * 不要 mutate state / rows。
 *
 * 规则：
 *   endOfTurn → { rows: state.rows.slice(), ended:true, aborted:state.aborted }
 *   JSON aborted → aborted true，拷贝 rows，ended 仍 false
 *   text_delta → 若还没有 assistant 行就 push；否则改那一行的 text（拼 delta）
 *   tool_call → 末尾追加 { kind:"tool", name, status:"call", text:"" }
 *   tool_result → 从后往前找同名且 status:"call" 的工具行，改成 ok/error
 *   坏 JSON / 找不到配对 / 未知 type → 同一引用
 *
 * 任务：返回下一份 ChatState。
 * 示例：
 *   空 state + '{"type":"text_delta","delta":"机"}' → assistant "机"
 *   再 + "线鼠标" 增量 → "无线鼠标"（防硬编码机械键盘）
 *   "[DONE]" → ended true
 *
 * 提示：ended 早退必须在 endOfTurn 之前；函数声明会提升，可以调用后面的 endOfTurn。
 */
export function reduceChatFromSse(state: ChatState, payload: string): ChatState {
  throw new Error("TODO");
}`,
  },
  {
    name: "toolRowView",
    testSuite: "toolRowView",
    skeleton: `/**
 * 【场景】Chat 列表要把工具行画成一行字。沿用 Ch24 UiRow。
 *
 * 【转换点】按 status 拼中文标签。text 为空时不要多一个空格。
 *
 * 格式：
 *   call     → \`[tool:\${name}] 调用中\`
 *   ok       → text 空：\`[tool:\${name}] 成功\`；否则 \`[tool:\${name}] 成功 \${text}\`
 *   error    → 同上，词换成「失败」
 *   blocked  → 同上，词换成「已拦截」
 *
 * 示例：
 *   lookupProduct / ok / "KB-001 库存 120" → "[tool:lookupProduct] 成功 KB-001 库存 120"
 *   calcLineTotal / call / "" → "[tool:calcLineTotal] 调用中"
 *   bash / blocked / "forbidden" → "[tool:bash] 已拦截 forbidden"
 *   lookupProduct / error / "未找到该 SKU" → "[tool:lookupProduct] 失败 未找到该 SKU"
 *
 * 提示：四个 status 分别处理。不要漏 calcLineTotal / bash（防硬编码 lookupProduct）。
 */
export function toolRowView(row: ToolRow): string {
  throw new Error("TODO");
}`,
  },
  {
    name: "assistantRowView",
    testSuite: "assistantRowView",
    skeleton: `/**
 * 【场景】助手气泡的纯文本视图。课程站 Chat 心智：UI = f(state)。
 *
 * 【转换点】固定前缀「助手：」。不要 trim。空字符串也要前缀。
 *
 * 任务：返回 \`助手：\${text}\`
 * 示例：
 *   "KB-001 库存 120" → "助手：KB-001 库存 120"
 *   "MS-002 无线鼠标 库存 300" → "助手：MS-002 无线鼠标 库存 300"
 *   "" → "助手："
 *   "  还在生成" → "助手：  还在生成"（保留左空格）
 *
 * 提示：模板字符串。不要 trim。
 */
export function assistantRowView(text: string): string {
  throw new Error("TODO");
}`,
  },
  {
    name: "endOfTurn",
    testSuite: "endOfTurn",
    skeleton: `/**
 * 【场景】流有没有说完？Ch21 约定最后一帧 data 是 [DONE]。
 *
 * 【转换点】[DONE] → true。JSON \`{"type":"agent_end"}\` 也 true（有人忘了转 [DONE]）。
 * aborted、text_delta、空串、"DONE"（没括号）、"[done]" 全是 false。
 * 连接断开 ≠ 说完；本函数只看 payload 字符串。
 *
 * 任务：返回 boolean。
 * 示例：
 *   "[DONE]" → true
 *   '{"type":"agent_end"}' → true
 *   '{"type":"aborted"}' → false
 *   '{"type":"text_delta","delta":"机"}' → false
 *   "" / "DONE" / "[done]" → false
 *
 * 提示：先 === "[DONE]"；再 try JSON.parse 看 type。parse 失败就 false。
 */
export function endOfTurn(payload: string): boolean {
  throw new Error("TODO");
}`,
  },
];

const assignment = `${preamble}

${functions.map((f) => f.skeleton).join("\n\n")}
`;

const testSource = `function emptyChat(): ChatState {
  return { rows: [], ended: false, aborted: false };
}

function parsed(input: unknown): ChatRequest | null {
  const r = chatRequestSchema().safeParse(input);
  return r.success ? r.data : null;
}

describe("piEventToSse", () => {
  it("text_delta 机 / 无线鼠标", () => {
    const ev: PiEvent = { type: "text_delta", delta: "机" };
    Object.freeze(ev);
    expect(piEventToSse(ev)).toBe('data: {"type":"text_delta","delta":"机"}\\n\\n');
    const mouse: PiEvent = { type: "text_delta", delta: "无线鼠标" };
    Object.freeze(mouse);
    expect(piEventToSse(mouse)).toBe('data: {"type":"text_delta","delta":"无线鼠标"}\\n\\n');
  });
  it("agent_end 是 [DONE]，不是 JSON", () => {
    const ev: PiEvent = { type: "agent_end" };
    Object.freeze(ev);
    expect(piEventToSse(ev)).toBe("data: [DONE]\\n\\n");
    expect(piEventToSse(ev) === 'data: {"type":"agent_end"}\\n\\n').toBe(false);
  });
  it("aborted / tool_call 走 JSON；不 mutate", () => {
    const aborted: PiEvent = { type: "aborted" };
    Object.freeze(aborted);
    expect(piEventToSse(aborted)).toBe('data: {"type":"aborted"}\\n\\n');
    const args: Record<string, unknown> = { sku: "KB-001" };
    Object.freeze(args);
    const call: PiEvent = { type: "tool_call", name: "lookupProduct", args };
    Object.freeze(call);
    expect(piEventToSse(call)).toBe(
      'data: {"type":"tool_call","name":"lookupProduct","args":{"sku":"KB-001"}}\\n\\n',
    );
    expect(args).toEqual({ sku: "KB-001" });
    const result: PiEvent = {
      type: "tool_result",
      name: "lookupProduct",
      ok: true,
      text: "KB-001 库存 120",
    };
    Object.freeze(result);
    expect(piEventToSse(result)).toBe(
      'data: {"type":"tool_result","name":"lookupProduct","ok":true,"text":"KB-001 库存 120"}\\n\\n',
    );
  });
});

describe("chatRequestSchema", () => {
  it("机械键盘成功；trim；无 sku", () => {
    expect(parsed({ message: "机械键盘还有货吗" })).toEqual({ message: "机械键盘还有货吗" });
    expect(parsed({ message: "  机械键盘还有货吗  " })).toEqual({ message: "机械键盘还有货吗" });
  });
  it("无线鼠标 + sku（防硬编码）", () => {
    expect(parsed({ message: "无线鼠标还有货吗", sku: "MS-002" })).toEqual({
      message: "无线鼠标还有货吗",
      sku: "MS-002",
    });
    expect(parsed({ message: "  无线鼠标  ", sku: "  MS-002  " })).toEqual({
      message: "无线鼠标",
      sku: "MS-002",
    });
  });
  it("失败：空 / 缺字段 / 太长 / 类型错", () => {
    expect(parsed({ message: "   " })).toBeNull();
    expect(parsed({ message: "" })).toBeNull();
    expect(parsed({ sku: "KB-001" })).toBeNull();
    expect(parsed(null)).toBeNull();
    expect(parsed({ message: 1 })).toBeNull();
    expect(parsed({ message: "x", sku: "" })).toBeNull();
    expect(parsed({ message: "x", sku: "   " })).toBeNull();
    expect(parsed({ message: "a".repeat(501) })).toBeNull();
    expect(parsed({ message: "a".repeat(500) })).toEqual({ message: "a".repeat(500) });
  });
  it("多余键丢掉", () => {
    expect(parsed({ message: "查库存", extra: 1 })).toEqual({ message: "查库存" });
  });
});

describe("reduceChatFromSse", () => {
  it("text_delta 累积；无线鼠标防硬编码", () => {
    const s0 = emptyChat();
    Object.freeze(s0);
    Object.freeze(s0.rows);
    const s1 = reduceChatFromSse(s0, '{"type":"text_delta","delta":"无"}');
    const s2 = reduceChatFromSse(s1, '{"type":"text_delta","delta":"线鼠标"}');
    expect(s2.rows).toEqual([{ kind: "assistant", text: "无线鼠标" }]);
    expect(s2.ended).toBe(false);
    expect(s0.rows).toEqual([]);
    const kb = reduceChatFromSse(emptyChat(), '{"type":"text_delta","delta":"机"}');
    expect(kb.rows).toEqual([{ kind: "assistant", text: "机" }]);
  });
  it("tool_call / tool_result 配对；[DONE] 结束", () => {
    let s = emptyChat();
    s = reduceChatFromSse(s, '{"type":"text_delta","delta":"KB-001 库存 120"}');
    s = reduceChatFromSse(
      s,
      '{"type":"tool_call","name":"lookupProduct","args":{"sku":"KB-001"}}',
    );
    s = reduceChatFromSse(
      s,
      '{"type":"tool_result","name":"lookupProduct","ok":true,"text":"KB-001 机械键盘 库存 120 单价 599"}',
    );
    const done = reduceChatFromSse(s, "[DONE]");
    expect(done.ended).toBe(true);
    expect(done.aborted).toBe(false);
    expect(done.rows).toEqual([
      { kind: "assistant", text: "KB-001 库存 120" },
      {
        kind: "tool",
        name: "lookupProduct",
        status: "ok",
        text: "KB-001 机械键盘 库存 120 单价 599",
      },
    ]);
  });
  it("aborted / 坏 JSON / 已 ended 同一引用 / JSON agent_end", () => {
    const aborted = reduceChatFromSse(emptyChat(), '{"type":"aborted"}');
    expect(aborted.aborted).toBe(true);
    expect(aborted.ended).toBe(false);
    expect(aborted.rows).toEqual([]);
    const s0 = emptyChat();
    Object.freeze(s0);
    Object.freeze(s0.rows);
    expect(reduceChatFromSse(s0, "not-json") === s0).toBe(true);
    const ended = reduceChatFromSse(emptyChat(), "[DONE]");
    Object.freeze(ended);
    Object.freeze(ended.rows);
    expect(reduceChatFromSse(ended, '{"type":"text_delta","delta":"机"}') === ended).toBe(true);
    const viaJson = reduceChatFromSse(emptyChat(), '{"type":"agent_end"}');
    expect(viaJson.ended).toBe(true);
    const err = reduceChatFromSse(
      reduceChatFromSse(emptyChat(), '{"type":"tool_call","name":"lookupProduct","args":{}}'),
      '{"type":"tool_result","name":"lookupProduct","ok":false,"text":"未找到该 SKU"}',
    );
    expect(err.rows).toEqual([
      { kind: "tool", name: "lookupProduct", status: "error", text: "未找到该 SKU" },
    ]);
    const orphan = emptyChat();
    Object.freeze(orphan);
    Object.freeze(orphan.rows);
    expect(
      reduceChatFromSse(
        orphan,
        '{"type":"tool_result","name":"lookupProduct","ok":true,"text":"x"}',
      ) === orphan,
    ).toBe(true);
  });
});

describe("toolRowView", () => {
  it("ok / call", () => {
    expect(
      toolRowView({ kind: "tool", name: "lookupProduct", status: "ok", text: "KB-001 库存 120" }),
    ).toBe("[tool:lookupProduct] 成功 KB-001 库存 120");
    expect(toolRowView({ kind: "tool", name: "calcLineTotal", status: "call", text: "" })).toBe(
      "[tool:calcLineTotal] 调用中",
    );
  });
  it("error / blocked；空 text 不多空格", () => {
    expect(
      toolRowView({ kind: "tool", name: "lookupProduct", status: "error", text: "未找到该 SKU" }),
    ).toBe("[tool:lookupProduct] 失败 未找到该 SKU");
    expect(toolRowView({ kind: "tool", name: "bash", status: "blocked", text: "forbidden" })).toBe(
      "[tool:bash] 已拦截 forbidden",
    );
    expect(toolRowView({ kind: "tool", name: "lookupProduct", status: "ok", text: "" })).toBe(
      "[tool:lookupProduct] 成功",
    );
    expect(toolRowView({ kind: "tool", name: "calcLineTotal", status: "error", text: "" })).toBe(
      "[tool:calcLineTotal] 失败",
    );
  });
});

describe("assistantRowView", () => {
  it("机械键盘 / 无线鼠标", () => {
    expect(assistantRowView("KB-001 库存 120")).toBe("助手：KB-001 库存 120");
    expect(assistantRowView("MS-002 无线鼠标 库存 300")).toBe("助手：MS-002 无线鼠标 库存 300");
  });
  it("空串仍有前缀；不 trim", () => {
    expect(assistantRowView("")).toBe("助手：");
    expect(assistantRowView("  还在生成")).toBe("助手：  还在生成");
  });
});

describe("endOfTurn", () => {
  it("[DONE] 与 JSON agent_end 为 true", () => {
    expect(endOfTurn("[DONE]")).toBe(true);
    expect(endOfTurn('{"type":"agent_end"}')).toBe(true);
  });
  it("aborted / delta / 空 / 大小写 为 false", () => {
    expect(endOfTurn('{"type":"aborted"}')).toBe(false);
    expect(endOfTurn('{"type":"text_delta","delta":"机"}')).toBe(false);
    expect(endOfTurn("")).toBe(false);
    expect(endOfTurn("DONE")).toBe(false);
    expect(endOfTurn("[done]")).toBe(false);
    expect(endOfTurn("not-json")).toBe(false);
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
    `> **预计**：1–2 天 ｜ **前置**：Ch16（远程数据四态）、Ch21（SSE 帧）、Ch25（createAgentSession）
> **目标**：① 前后端约定一种事件 JSON（沿用 Ch24 的 UiRow）；② Hono 转 SSE；③ 前端 reducer 按 Ch13 心智折 state。
> 你 15 年 Java：\`SseEmitter\` + DTO。Python：FastAPI \`StreamingResponse\` + Pydantic。本章把同一份**数据协议**接到 TypeScript。

> 📐 **本教程的契约**：下面每一节（§26.1–§26.6）都**精确对应**作业里的题。讲过的才考，考的必讲过。卡住时按作业函数名回查对应小节。
> **不讲**：把课程学习站改成聊天产品、RAG、M6 扩展四件套、默认 bash、真供应商 Key。JSON 作业是纯函数：事件进、SSE/state 出。

---`,
    [],
  ),
  sec(
    "sec-map",
    "🗺️ 本章地图",
    null,
    `本章主线：**商品助手怎么被网页看见**。用户问「机械键盘还有货吗」，浏览器 \`POST /chat\`，Hono 用假 Pi 事件写成 SSE，React 用 \`reduceChatFromSse\` 折成气泡。课程站本身**不必**变成 ChatGPT；你只要会这套协议，就能接到 Ch12–Ch16 的 Chat 心智上。

读完这章 + 完成作业，你将能够：

- 把一条 Pi 事件编成 Ch21 风格的 SSE 帧（\`agent_end\` → \`[DONE]\`）
- 用 zod 校验 POST body（类型会蒸发）
- 不可变地折 SSE payload → \`ChatState\`（必须调用 \`endOfTurn\`）
- 把工具行 / 助手行收成可测的视图字符串
- 判断一回合有没有结束（\`[DONE]\` ≠ 连接断开）

**作业 ↔ 教程对应表**（学哪节，就去做哪题）：

| 作业题 | 对应小节 | 核心知识点 |
|--------|----------|-----------|
| \`piEventToSse\` | §26.1 | Pi 事件 → SSE 帧；\`agent_end\` → \`[DONE]\` |
| \`chatRequestSchema\` | §26.2 | POST /chat 的 zod schema |
| \`reduceChatFromSse\` | §26.3 | 调用 endOfTurn；不可变 reducer |
| \`toolRowView\` | §26.4 | Ch24 工具行文案 |
| \`assistantRowView\` | §26.5 | 助手气泡前缀 |
| \`endOfTurn\` | §26.6 | \`[DONE]\` / JSON \`agent_end\` |

本地文件：\`local/m5/ch26/assignment.ts\`（改 TODO）、\`app.ts\`（最小 Hono，\`app.request\` 不 listen）、\`assignment.test.ts\`、\`demo.ts\`（React fetch 复制区，测试不要 import）。

跑测试：\`bun test local/m5/ch26\`。

---`,
    [],
  ),
  sec(
    "sec-path",
    "⏱️ 学习路径：费曼五步（约 60–90 分钟）",
    null,
    `| 步 | 你要做 | 在哪做 |
|----|--------|--------|
| ① 预览猜（2 分钟） | 猜 EventSource 能不能 POST、\`[DONE]\` 是不是 HTTP 状态 | 本页 ① |
| ② 先动手 | 打开 \`local/m5/ch26/assignment.ts\` 改 TODO | 仓库 local/ |
| ③ 提取+反馈 | \`bun test local/m5/ch26\` 看红绿 | 终端 |
| ④ 费曼（2 分钟） | 大白话讲清「为什么 JSON 作业不写 Hono」 | 本页 ④ |
| ⑤ 存闪卡 | 章末闪卡标复习日期 | 闪卡 |

> 💡 网页这一章是只读的。不要在浏览器里改代码。没有 API Key 作业也能绿——测的是协议。\`app.ts\` 用假事件，不打网。
> \`reduceChatFromSse\` **必须调用** \`endOfTurn\`。\`chatRequestSchema\` 返回 schema，不要在函数里 parse。

---`,
    [],
  ),
  sec(
    "sec-guess",
    "① 预览猜（2 分钟 · 激活你的 Java / Python 直觉）",
    null,
    `先别看答案，凭经验猜一猜（猜错没关系）：

1. 浏览器 \`EventSource\` 能发 POST 吗？商品助手的 \`POST /chat\` 该用什么读流？
2. Java \`SseEmitter.complete()\` 和 body 里的 \`[DONE]\` 是一回事吗？
3. \`{ type: "agent_end" }\` 上电线应该仍是 JSON，还是收成 Ch21 的 \`[DONE]\`？
4. POST body 只写 TypeScript 类型、不跑 zod，运行时会发生什么？
5. 本机没有供应商 Key，\`bun test local/m5/ch26\` 还能绿吗？JSON 作业可以 \`import "hono"\` 吗？
6. 要把整个 TypeScript 学习站改成聊天产品，才算「打通」吗？

> 猜完，带着验证心态进入正文。第 1、3、4 题是本章的 🔴。

---`,
    [],
  ),
  sec(
    "sec-world",
    "数据协议：Hono 写 SSE，React 折 UiRow 🔴",
    null,
    `M5 已经会调模型（Ch22）、跑工具（Ch23）、看事件（Ch24）、包会话（Ch25）。缺的是**网页怎么看见**：

浏览器不能直接 \`import\` \`@earendil-works/pi-coding-agent\`（本课作业也没装这个包）。约定一份小 JSON，Hono 写成 SSE，前端用纯函数折成 Ch24 的 \`UiRow\`。这就是「打通」。

| | Java | Python | 本章 |
|---|---|---|---|
| 推流 | \`SseEmitter\` / Servlet 异步 | FastAPI \`StreamingResponse\` + \`yield\` | Hono \`streamSSE\`（只在 \`app.ts\`） |
| 入参校验 | \`@Valid @RequestBody\` | Pydantic | \`chatRequestSchema\` + zod |
| 结束约定 | \`emitter.complete()\` **另**加业务结束帧 | 生成器结束 **另**加 \`[DONE]\` | \`agent_end\` → \`data: [DONE]\\n\\n\` |
| UI state | 自己维护 List + 重绘 | 同左 | \`reduceChatFromSse\`（Ch13 心智） |

### Java：SseEmitter + DTO

\`\`\`java
public record ChatRequest(@NotBlank String message, String sku) {}

@PostMapping(value = "/chat", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
public SseEmitter chat(@Valid @RequestBody ChatRequest req) {
    SseEmitter emitter = new SseEmitter();
    emitter.send(SseEmitter.event().data(jsonOf(textDelta("机"))));
    emitter.send(SseEmitter.event().data("[DONE]")); // 业务结束 ≠ complete()
    return emitter;
}
\`\`\`

\`complete()\` 只是关连接。代理还开着时，客户端需要 \`[DONE]\` 才知道「这轮说完了」。

### Python：StreamingResponse + Pydantic

\`\`\`python
class ChatIn(BaseModel):
    message: str = Field(min_length=1, max_length=500)
    sku: str | None = None

@app.post("/chat")
def chat(body: ChatIn):
    def gen():
        yield 'data: {"type":"text_delta","delta":"机"}\\n\\n'
        yield "data: [DONE]\\n\\n"
    return StreamingResponse(gen(), media_type="text/event-stream")
\`\`\`

### 电线长什么样

\`\`\`
data: {"type":"text_delta","delta":"机"}

data: {"type":"tool_call","name":"lookupProduct","args":{"sku":"KB-001"}}

data: {"type":"tool_result","name":"lookupProduct","ok":true,"text":"KB-001 库存 120"}

data: [DONE]

\`\`\`

冒号后有空格，与 Ch11 / Ch21 对齐。\`agent_end\` **不要**原样 JSON 上电线——收成 \`[DONE]\`，前端 Ch21 的代码才能复用。

\`aborted\` 仍走 JSON：用户点停止 ≠ 正常说完。

### 🔴 EventSource 不能 POST

\`new EventSource("/chat")\` 只会 GET。商品助手要带 JSON body → 用 \`fetch\` + \`ReadableStream\`。这是 Java 老手最容易踩的坑（以为和 SSE GET 订阅一样）。

### 不要把学习站改成聊天产品

课程站的 Chat 心智在 Ch12–Ch16：列表、气泡、\`key\`、loading/error/success。本章 local 里一个最小 \`POST /chat\` 就够了。\`demo.ts\` 是复制区，测试不要 import。

作业禁止 bash、禁止任意写文件、禁止 import 真 Pi 包、禁止 JSON 作业里 \`fetch\` / \`setTimeout\`。

\`\`\`mermaid
flowchart LR
    post["React POST /chat<br/>JSON message"] --> zodN["chatRequest<br/>Schema"]
    zodN --> fake["假 Pi 事件<br/>text_delta / tool_*"]
    fake --> enc["piEventToSse"]
    enc --> sse["text/<br/>event-stream"]
    sse --> red["reduceChat<br/>FromSse"]
    red --> ui["UiRow 列表<br/>assistantRowView / toolRowView"]

    style post fill:#FFE082,stroke:#F9A825,color:#1f1f1f
    style zodN fill:#80DEEA,stroke:#0097A7,color:#1f1f1f
    style fake fill:#CE93D8,stroke:#7B1FA2,color:#1f1f1f
    style enc fill:#80DEEA,stroke:#0097A7,color:#1f1f1f
    style sse fill:#FFCC80,stroke:#F57C00,color:#1f1f1f
    style red fill:#A5D6A7,stroke:#388E3C,color:#1f1f1f
    style ui fill:#A5D6A7,stroke:#388E3C,color:#1f1f1f
\`\`\`

\`\`\`mermaid
flowchart TD
    payload["SSE data 行"] --> endedQ{"state.ended?"}
    endedQ -->|"是"| same["同一引用 丢掉"]
    endedQ -->|"否"| doneQ{"endOfTurn?"}
    doneQ -->|"是"| endN["ended true 拷贝 rows"]
    doneQ -->|"否"| parseQ{"JSON.parse"}
    parseQ -->|"aborted"| abortN["aborted true"]
    parseQ -->|"text_delta"| asst["累积 assistant 行"]
    parseQ -->|"tool_call"| callN["追加 status call"]
    parseQ -->|"tool_result"| resN["配对改 ok/error"]
    parseQ -->|"失败"| same

    style payload fill:#FFE082,stroke:#F9A825,color:#1f1f1f
    style endedQ fill:#80DEEA,stroke:#0097A7,color:#1f1f1f
    style doneQ fill:#80DEEA,stroke:#0097A7,color:#1f1f1f
    style parseQ fill:#80DEEA,stroke:#0097A7,color:#1f1f1f
    style same fill:#EF9A9A,stroke:#C62828,color:#1f1f1f
    style endN fill:#A5D6A7,stroke:#388E3C,color:#1f1f1f
    style abortN fill:#FFCC80,stroke:#F57C00,color:#1f1f1f
    style asst fill:#A5D6A7,stroke:#388E3C,color:#1f1f1f
    style callN fill:#CE93D8,stroke:#7B1FA2,color:#1f1f1f
    style resN fill:#CE93D8,stroke:#7B1FA2,color:#1f1f1f
\`\`\`

本地 \`app.ts\`：\`GET /health\` + \`POST /chat\`。问机械键盘走 KB-001 假事件；问无线鼠标走 MS-002。测试用 \`app.request\`，**不要** \`listen\`。无 Key。

### ❌ / ✅

\`\`\`ts
// ❌ JSON 作业 import "hono" / fetch / setTimeout
// ❌ EventSource POST（它只能 GET）
// ❌ agent_end 仍 JSON 上电线，前端 Ch21 对不上
// ❌ 默认 bash / 把学习站改成聊天产品
// ❌ 没有 Key 就不写作业
// ✅ 纯函数协议 + local 最小 Hono；假事件；[DONE]；zod 门口
\`\`\`

---`,
    [],
  ),
  sec(
    "sec-26.1",
    "§26.1 Pi 事件写成 SSE（对应：`piEventToSse`）🔴",
    "26.1",
    `Ch21 的 \`formatSseEvent("机")\` 得到 \`data: 机\\n\\n\`。本章 payload 多数是 **JSON 字符串**，只有结束帧是 \`[DONE]\`。

\`\`\`ts
function piEventToSse(event: PiEvent): string {
  if (event.type === "agent_end") return "data: [DONE]\\n\\n";
  return \`data: \${JSON.stringify(event)}\\n\\n\`;
}

piEventToSse({ type: "text_delta", delta: "机" });
// data: {"type":"text_delta","delta":"机"}\\n\\n

piEventToSse({ type: "agent_end" }); // data: [DONE]\\n\\n  不是 JSON
piEventToSse({ type: "aborted" });   // data: {"type":"aborted"}\\n\\n
\`\`\`

\`JSON.stringify\` 不改原对象。测试会 \`Object.freeze\`。无线鼠标那条也要过——不要只硬编码「机」。

\`lookupProduct\` 的 \`tool_call\` / \`tool_result\` 同样 stringify。不要给帧加 \`event:\` 名（和 Ch21 的 \`encodeTokenDelta\` 一样只写 data）。

### ❌ / ✅

\`\`\`ts
// ❌ data:机          少空格
// ❌ agent_end 输出 {"type":"agent_end"}
// ❌ aborted 也收成 [DONE]（停止 ≠ 说完）
// ❌ event.delta = event.delta.trim()
// ✅ agent_end → [DONE]；其余 JSON.stringify
\`\`\`

> ✅ **做 \`piEventToSse\`**：冒号后空格；结束帧是 \`[DONE]\`。

---`,
    ["piEventToSse"],
  ),
  sec(
    "sec-26.2",
    "§26.2 POST /chat 的 zod（对应：`chatRequestSchema`）🔴",
    "26.2",
    `TypeScript 的 \`ChatRequest\` 编译完就没了。HTTP 门口必须 zod。对照 Ch07 \`productSchema()\`：**本函数返回 schema**，parse 留给调用方 / \`app.ts\`。

\`\`\`ts
function chatRequestSchema() {
  return z.object({
    message: z.string().trim().min(1).max(500),
    sku: z.string().trim().min(1).optional(),
  });
}

chatRequestSchema().safeParse({ message: "机械键盘还有货吗" });
// { success: true, data: { message: "机械键盘还有货吗" } }

chatRequestSchema().safeParse({ message: "  无线鼠标  ", sku: "MS-002" });
// message 已 trim；sku 保留

chatRequestSchema().safeParse({ message: "   " }); // 失败
chatRequestSchema().safeParse({ sku: "KB-001" });  // 失败：缺 message
\`\`\`

JSON 作业不要 \`import { z }\`（运行器已注入）。本地 \`assignment.ts\` **必须** \`import { z } from "zod"\`。

多余键丢掉。\`sku: ""\` 或只含空格 → 失败（trim 后 min(1)）。501 字失败，500 字成功。

Java：\`@NotBlank @Size(max=500)\`。Python：\`Field(min_length=1, max_length=500)\`。不要 \`Number(body.message)\`。

### ❌ / ✅

\`\`\`ts
// ❌ 在 chatRequestSchema 里 safeParse 再返回 data|null（名字是 Schema）
// ❌ 不 trim，导致 "  " 当合法
// ❌ 作业 import hono 在 handler 里校验，JSON 题不跑路由
// ✅ return z.object({...})
\`\`\`

> ✅ **做 \`chatRequestSchema\`**：返回 schema；无线鼠标 + sku 也要过。

---`,
    ["chatRequestSchema"],
  ),
  sec(
    "sec-26.3",
    "§26.3 前端 reducer（对应：`reduceChatFromSse`）🔴",
    "26.3",
    `Ch13 的 \`reduceChat(state, action)\`：每次新对象。本章 action 是 **SSE data 字符串**。

**必须调用** \`endOfTurn(payload)\`（§26.6）。函数声明会提升。

\`\`\`ts
function reduceChatFromSse(state: ChatState, payload: string): ChatState {
  if (state.ended) return state; // 同一引用
  if (endOfTurn(payload)) {
    return { rows: state.rows.slice(), ended: true, aborted: state.aborted };
  }
  // JSON.parse → text_delta / tool_* / aborted
  // 坏 JSON → return state
}
\`\`\`

规则备忘：

| payload | 行为 |
|---------|------|
| 已 \`ended\` | 丢掉，同一引用 |
| \`endOfTurn\` | \`ended: true\`，rows 拷贝 |
| \`aborted\` JSON | \`aborted: true\`，**不要**多推一行 |
| \`text_delta\` | 没有 assistant 行就 push；有则拼到那一行（即使后面已经有 tool 行） |
| \`tool_call\` | 追加 \`status:"call"\` \`text:""\` |
| \`tool_result\` | 从后往前找同名 \`call\`，改 ok/error；找不到 → 同一引用 |

空数组起步：\`{ rows: [], ended: false, aborted: false }\`。

\`\`\`ts
const s1 = reduceChatFromSse(empty, '{"type":"text_delta","delta":"无"}');
const s2 = reduceChatFromSse(s1, '{"type":"text_delta","delta":"线鼠标"}');
// s2.rows[0].text === "无线鼠标"
\`\`\`

测试会 freeze。不要 \`state.rows.push\`。

### ❌ / ✅

\`\`\`ts
// ❌ 自己写 payload === "[DONE]" 而不调用 endOfTurn
// ❌ 已 ended 还把「机」拼进去
// ❌ aborted 再 push 一行「已停止」（abort 用旗标，行函数是视图）
// ✅ 调用 endOfTurn；freeze 不炸；无线鼠标也能累积
\`\`\`

> ✅ **做 \`reduceChatFromSse\`**：请调用 \`endOfTurn\`。

---`,
    ["reduceChatFromSse"],
  ),
  sec(
    "sec-26.4",
    "§26.4 工具行文案（对应：`toolRowView`）🟡",
    "26.4",
    `Ch24 已经有 \`UiRow\`。本题只做**展示字符串**，方便测，不必上 JSX。

\`\`\`ts
function toolRowView(row: ToolRow): string {
  const head = \`[tool:\${row.name}]\`;
  if (row.status === "call") return \`\${head} 调用中\`;
  const word =
    row.status === "ok" ? "成功" : row.status === "error" ? "失败" : "已拦截";
  return row.text.length > 0 ? \`\${head} \${word} \${row.text}\` : \`\${head} \${word}\`;
}
\`\`\`

\`calcLineTotal\` + \`call\` 防你写死 lookupProduct。\`bash\` + \`blocked\` 提醒：课程仍然禁止 bash，视图层要能画出「已拦截」。

空 \`text\` 不要变成 \`成功 \`（末尾空格）。

### ❌ / ✅

\`\`\`ts
// ❌ 只认 lookupProduct
// ❌ ok 空 text 返回 "[tool:x] 成功 "（多空格）
// ❌ 把 blocked 画成 ok
// ✅ 四个 status；bash / calcLineTotal 都要过
\`\`\`

> ✅ **做 \`toolRowView\`**：四种 status 的格式要精确。

---`,
    ["toolRowView"],
  ),
  sec(
    "sec-26.5",
    "§26.5 助手行文案（对应：`assistantRowView`）🟢",
    "26.5",
    `UI = \`f(state)\`（Ch12）。助手气泡的纯文本约定：

\`\`\`ts
function assistantRowView(text: string): string {
  return \`助手：\${text}\`;
}

assistantRowView("KB-001 库存 120");              // 助手：KB-001 库存 120
assistantRowView("MS-002 无线鼠标 库存 300");     // 防硬编码
assistantRowView("");                             // 助手：
assistantRowView("  还在生成");                   // 助手：  还在生成
\`\`\`

不要 \`trim\`。正在流式输出时，前端可能先拿到带空格的半句。

### ❌ / ✅

\`\`\`ts
// ❌ return text（没前缀）
// ❌ trim 掉「还在生成」前面的空格
// ❌ 空串返回 ""
// ✅ \`助手：\${text}\`
\`\`\`

> ✅ **做 \`assistantRowView\`**：前缀 + 原样 text。

---`,
    ["assistantRowView"],
  ),
  sec(
    "sec-26.6",
    "§26.6 回合结束（对应：`endOfTurn`）🔴",
    "26.6",
    `Ch21：\`[DONE]\` 是 **body 约定**，不是 HTTP 200，也不是 TCP 断开。代理可能还挂着连接。

\`reduceChatFromSse\` 已经调用本题。本题把规则钉死：

\`\`\`ts
function endOfTurn(payload: string): boolean {
  if (payload === "[DONE]") return true;
  try {
    const ev = JSON.parse(payload) as { type?: string };
    return ev.type === "agent_end";
  } catch {
    return false;
  }
}

endOfTurn("[DONE]");                 // true
endOfTurn('{"type":"agent_end"}');   // true（有人忘了转 [DONE]）
endOfTurn('{"type":"aborted"}');     // false
endOfTurn("");                       // false
endOfTurn("DONE");                   // false  没括号
endOfTurn("[done]");                 // false  大小写
\`\`\`

\`piEventToSse\` 已经把 \`agent_end\` 编成 \`[DONE]\`，所以正常路径 reducer 看到的是 \`[DONE]\`。兼容 JSON 是为了测试和抄错电线的人。

### ❌ / ✅

\`\`\`ts
// ❌ payload.length === 0 当结束
// ❌ aborted 当结束
// ❌ 只认 [DONE] 不认 JSON agent_end（作业要两条都 true）
// ✅ 先 === "[DONE]"，再 parse type
\`\`\`

> ✅ **做 \`endOfTurn\`**：说完才是 true。然后 \`bun test local/m5/ch26\`。

---`,
    ["endOfTurn"],
  ),
  sec(
    "sec-pits",
    "⚠️ Java / Python 老手几个坑",
    null,
    `1. **用 EventSource 打 POST /chat。** EventSource 只能 GET。用 \`fetch\` + \`getReader()\`。
2. **\`SseEmitter.complete()\` 当成 \`[DONE]\`。** 关连接 ≠ 业务说完。
3. **\`data:机\` 少空格。** Ch11 按 \`data: \` 切。
4. **\`agent_end\` 原样 JSON。** 前端 Ch21 在等 \`[DONE]\`。
5. **HTTP body 只信 TS 类型。** 运行时蒸发。\`chatRequestSchema\`。
6. **\`reduceChatFromSse\` 不调用 \`endOfTurn\`。** 测试能蒙对，验收查源码。
7. **\`rows.push\`。** freeze 会红。
8. **JSON 作业 import hono / fetch / 真 Pi 包。** 协议是纯函数；Hono 只在 \`app.ts\`。
9. **默认 bash / 把学习站改成聊天产品。** 工具仍是 lookupProduct / calcLineTotal。local 最小 server 即可。
10. **没有 Key 就不写。** 假事件就能绿。M6 整段暂停，不要去 clone Pi 当作业。

---`,
    [],
  ),
  sec(
    "sec-homework",
    "📝 本章作业",
    null,
    `上面 6 个函数按节交错出现。每个注释里有【场景】【转换点】、示例和提示。

**完成方式**：打开仓库 \`local/m5/ch26/assignment.ts\`，把 \`throw new Error("TODO")\` 换成实现，然后：

\`\`\`bash
bun test local/m5/ch26
\`\`\`

\`app.ts\` 已接 \`chatRequestSchema\` + \`piEventToSse\` + 假事件。不要 \`listen\` 端口。\`demo.ts\` 是 React \`fetch\` 抄写稿，**测试不要 import 它**。

卡住就回对应 §：\`piEventToSse\` → §26.1，\`chatRequestSchema\` → §26.2，\`reduceChatFromSse\` → §26.3（请调用 endOfTurn），\`endOfTurn\` → §26.6。

---`,
    [],
  ),
  sec(
    "sec-check",
    "✅ 自测：你真的掌握了吗？",
    null,
    `- [ ] 能对照 SseEmitter / StreamingResponse 说出 \`data: ...\\n\\n\`
- [ ] 知道 EventSource 不能 POST，要用 fetch 读流
- [ ] \`agent_end\` 上电线是 \`[DONE]\`；\`aborted\` 仍是 JSON
- [ ] \`chatRequestSchema\` 返回 schema；trim / 500 字 / 可选 sku
- [ ] \`reduceChatFromSse\` 调用了 \`endOfTurn\`；已 ended 同一引用
- [ ] 无线鼠标增量能拼对；不是硬编码机械键盘
- [ ] \`toolRowView\` 四种 status；bash 能画出已拦截
- [ ] \`bun test local/m5/ch26\` 全绿；\`POST /chat\` 能还原 KB-001 并以 \`[DONE]\` 结束
- [ ] 没有把学习站改成聊天产品；没有开放 bash；没有 import 真 Pi 包

---`,
    [],
  ),
  sec(
    "sec-feynman",
    "🎓 费曼挑战",
    null,
    `用大白话讲给「Java 同事」听。讲不清 = 还没真懂。

任选一题（1–2 分钟）：

1. 「为什么不能用 \`EventSource\` 接 \`POST /chat\`？没有 Key 测试怎么绿？」— 卡壳重读总述
2. 「\`SseEmitter.complete()\` 和 \`[DONE]\` 差在哪？\`agent_end\` 为什么不直接 JSON？」— 卡壳重读 §26.1 + §26.6
3. 「为什么 POST body 不能只写 TypeScript 接口？\`reduceChatFromSse\` 为什么必须调用 \`endOfTurn\`？」— 卡壳重读 §26.2 + §26.3

---`,
    [],
  ),
  sec(
    "sec-next",
    "⏭️ 下一步",
    null,
    `Ch26 掌握后，**M5 收官**：你会把商品助手会话编成 SSE，用 React 心智折成 UiRow。课程到此的现行大纲是 Ch01–Ch26。

**M6（研究 Pi / Ch27+）整段暂停。** 不要去 clone Pi 当课程内容，不要加第六张模块卡片。若以后要开 M6，需要你明确说「开 M6 / 开始研究 Pi」。

本章不要默认开启 bash，也不要把 TypeScript 学习站改成聊天产品——协议会了就够了。`,
    [],
  ),
];

const tutorialMd = `# Ch26 · 打通：Hono + SSE + React 数据协议

${sections
  .map((s) => (s.heading ? `## ${s.heading}\n\n${s.body}` : s.body))
  .join("\n\n")}
`;

const reviewMd = `# Ch26 · 记忆闪卡

> 先回忆，再翻答案。连续 2 次秒答 → 退役。

## 🔖 闪卡

| # | 正面（问题） | 背面（答案） | 掌握 |
|---|---|---|---|
| 1 | \`EventSource\` 能 POST /chat 吗？该用什么？ | 不能，只能 GET。POST JSON body 用 \`fetch\` + \`ReadableStream.getReader()\`。 | ⬜ |
| 2 | \`piEventToSse\` 对 \`agent_end\` / \`aborted\` / \`text_delta\` 分别输出什么？ | \`data: [DONE]\\n\\n\`；aborted 与 delta 都是 JSON data 帧。冒号后有空格。 | ⬜ |
| 3 | \`[DONE]\` 是 HTTP 状态码吗？\`complete()\` 等于说完了吗？ | 都不是。它是 body 约定。连接断开 ≠ 回合结束。 | ⬜ |
| 4 | 为什么 POST body 还要 zod？\`chatRequestSchema\` 返回什么？ | TS 类型运行时蒸发。返回 \`z.object\`，调用方 \`safeParse\`。message trim 1–500。 | ⬜ |
| 5 | \`reduceChatFromSse\` 必须调用谁？已 ended 再来 delta？ | 必须调用 \`endOfTurn\`。已 ended 返回同一引用，丢掉后续帧。 | ⬜ |
| 6 | 工具行 \`call\` / 空 text 的 \`ok\` / bash \`blocked\` 文案？ | \`[tool:name] 调用中\`；\`[tool:name] 成功\`（无末尾空格）；\`[tool:bash] 已拦截 forbidden\`。 | ⬜ |
| 7 | 没有 Key 作业能绿吗？JSON 作业可以 import hono / 真 Pi 包吗？ | 能绿：假事件。JSON 禁止 hono/fetch/Pi 包。Hono 只在 \`app.ts\`。 | ⬜ |
| 8 | 要把学习站改成聊天产品才算打通吗？bash 呢？ | 不必。最小 POST /chat + 协议即可。课程仍禁止 bash。M6 暂停。 | ⬜ |
| 9 | \`endOfTurn("[done]")\` / \`"DONE"\` / JSON \`agent_end\`？ | 前两个 false（大小写、缺括号）。JSON \`agent_end\` 与 \`[DONE]\` 为 true。 | ⬜ |

## 🎓 费曼自检

- [ ] 能说清 EventSource vs fetch、[DONE] vs complete
- [ ] 能说清类型蒸发所以要 zod、reducer 必须调 endOfTurn
- [ ] 能说清无 Key 假事件、不要改学习站、不要 bash
`;

const chapter = {
  id: "ch26",
  num: "26",
  title: "打通：Hono + SSE + React 数据协议",
  runMode: "local" as const,
  tutorialMd,
  assignment,
  testName: "ch26_assignment",
  testSource,
  reviewMd,
  interleaved: true,
  sections,
  functions,
  preamble,
  localHint: "bun test local/m5/ch26",
};

const root = dirname(fileURLToPath(import.meta.url));
const out = join(root, "../src/content/chapters/ch26.json");
mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, JSON.stringify(chapter, null, 2) + "\n");
console.log("wrote", out);

const localDir = join(root, "../local/m5/ch26");
mkdirSync(localDir, { recursive: true });

const localAssignment = `/**
 * Ch26 作业：商品助手的前后端数据协议（纯函数）。
 *
 * 场景：POST /chat「机械键盘还有货吗」。把 Pi 事件写成 SSE，再折成 UiRow。
 * 打开本文件改 TODO，然后：bun test local/m5/ch26
 *
 * 本文件需要 import zod。不要 import 服务端框架 / 真 Pi 包。
 */
import { z } from "zod";

export type PiEvent =
  | { type: "text_delta"; delta: string }
  | { type: "tool_call"; name: string; args: Record<string, unknown> }
  | { type: "tool_result"; name: string; ok: boolean; text: string }
  | { type: "agent_end" }
  | { type: "aborted" };

export type UiRow =
  | { kind: "assistant"; text: string }
  | { kind: "tool"; name: string; status: "call" | "ok" | "error" | "blocked"; text: string };

export type ChatState = {
  rows: UiRow[];
  ended: boolean;
  aborted: boolean;
};

export type ChatRequest = { message: string; sku?: string };

export type ToolRow = Extract<UiRow, { kind: "tool" }>;

${functions.map((f) => f.skeleton).join("\n\n")}
`;

const appSource = `/**
 * Ch26 最小 Hono：POST /chat 把假 Pi 事件写成 SSE。
 * 不 listen、不 fetch、不 import 真 Pi 包、不开放 shell 工具。
 *
 * bun test 用 app.request。
 */
import { Hono } from "hono";
import { streamSSE } from "hono/streaming";
import { chatRequestSchema, piEventToSse, type PiEvent } from "./assignment";

export const app = new Hono();

export const KEYBOARD_EVENTS: PiEvent[] = [
  { type: "text_delta", delta: "KB-001 " },
  { type: "text_delta", delta: "库存 120" },
  { type: "tool_call", name: "lookupProduct", args: { sku: "KB-001" } },
  {
    type: "tool_result",
    name: "lookupProduct",
    ok: true,
    text: "KB-001 机械键盘 库存 120 单价 599",
  },
  { type: "agent_end" },
];

export const MOUSE_EVENTS: PiEvent[] = [
  { type: "text_delta", delta: "MS-002 库存 300" },
  { type: "tool_call", name: "lookupProduct", args: { sku: "MS-002" } },
  {
    type: "tool_result",
    name: "lookupProduct",
    ok: true,
    text: "MS-002 无线鼠标 库存 300 单价 159",
  },
  { type: "agent_end" },
];

export function eventsForMessage(message: string): PiEvent[] {
  if (message.includes("鼠标") || message.includes("MS-002")) return MOUSE_EVENTS;
  return KEYBOARD_EVENTS;
}

function sseData(event: PiEvent): string {
  const frame = piEventToSse(event);
  if (frame.startsWith("data: ") && frame.endsWith("\\n\\n")) {
    return frame.slice("data: ".length, -2);
  }
  return frame;
}

app.get("/health", (c) => c.json({ ok: true }));

app.post("/chat", async (c) => {
  let body: unknown;
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: "VALIDATION" }, 400);
  }
  const parsed = chatRequestSchema().safeParse(body);
  if (!parsed.success) return c.json({ error: "VALIDATION" }, 400);
  const events = eventsForMessage(parsed.data.message);
  return streamSSE(c, async (stream) => {
    for (const ev of events) {
      await stream.writeSSE({ data: sseData(ev) });
    }
  });
});
`;

const localTest = `import { describe, expect, test } from "bun:test";
import {
  assistantRowView,
  chatRequestSchema,
  endOfTurn,
  piEventToSse,
  reduceChatFromSse,
  toolRowView,
  type ChatState,
  type PiEvent,
} from "./assignment";
import { KEYBOARD_EVENTS, MOUSE_EVENTS, app, eventsForMessage } from "./app";

function emptyChat(): ChatState {
  return { rows: [], ended: false, aborted: false };
}

function parsed(input: unknown) {
  const r = chatRequestSchema().safeParse(input);
  return r.success ? r.data : null;
}

function ssePayloads(body: string): string[] {
  return body
    .split("\\n\\n")
    .filter((f) => f.startsWith("data: "))
    .map((f) => f.slice("data: ".length));
}

describe("piEventToSse", () => {
  test("text_delta / agent_end / aborted", () => {
    const ev: PiEvent = { type: "text_delta", delta: "机" };
    Object.freeze(ev);
    expect(piEventToSse(ev)).toBe('data: {"type":"text_delta","delta":"机"}\\n\\n');
    expect(piEventToSse({ type: "agent_end" })).toBe("data: [DONE]\\n\\n");
    expect(piEventToSse({ type: "aborted" })).toBe('data: {"type":"aborted"}\\n\\n');
  });
});

describe("chatRequestSchema", () => {
  test("trim、sku、失败", () => {
    expect(parsed({ message: "机械键盘还有货吗" })).toEqual({ message: "机械键盘还有货吗" });
    expect(parsed({ message: "  无线鼠标  ", sku: "MS-002" })).toEqual({
      message: "无线鼠标",
      sku: "MS-002",
    });
    expect(parsed({ message: "   " })).toBeNull();
    expect(parsed({ message: "a".repeat(501) })).toBeNull();
  });
});

describe("reduceChatFromSse", () => {
  test("累积无线鼠标；[DONE]；freeze", () => {
    const s0 = emptyChat();
    Object.freeze(s0);
    Object.freeze(s0.rows);
    const s1 = reduceChatFromSse(s0, '{"type":"text_delta","delta":"无"}');
    const s2 = reduceChatFromSse(s1, '{"type":"text_delta","delta":"线鼠标"}');
    expect(s2.rows).toEqual([{ kind: "assistant", text: "无线鼠标" }]);
    expect(s0.rows).toEqual([]);
    const done = reduceChatFromSse(s2, "[DONE]");
    expect(done.ended).toBe(true);
  });
});

describe("toolRowView / assistantRowView / endOfTurn", () => {
  test("四种 status 与结束判定", () => {
    expect(toolRowView({ kind: "tool", name: "calcLineTotal", status: "call", text: "" })).toBe(
      "[tool:calcLineTotal] 调用中",
    );
    expect(toolRowView({ kind: "tool", name: "bash", status: "blocked", text: "forbidden" })).toBe(
      "[tool:bash] 已拦截 forbidden",
    );
    expect(assistantRowView("MS-002 无线鼠标 库存 300")).toBe("助手：MS-002 无线鼠标 库存 300");
    expect(endOfTurn("[DONE]")).toBe(true);
    expect(endOfTurn('{"type":"aborted"}')).toBe(false);
  });
});

describe("app HTTP", () => {
  test("GET /health", async () => {
    const res = await app.request("/health");
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
  });
  test("POST /chat 机械键盘 → SSE + [DONE] + reduce", async () => {
    const res = await app.request("/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: "机械键盘还有货吗" }),
    });
    expect(res.status).toBe(200);
    const ct = res.headers.get("Content-Type") ?? "";
    expect(ct.includes("text/event-stream")).toBe(true);
    const body = await res.text();
    expect(body.includes("[DONE]")).toBe(true);
    expect(body.includes("KB-001")).toBe(true);
    const payloads = ssePayloads(body);
    expect(payloads[payloads.length - 1]).toBe("[DONE]");
    let state = emptyChat();
    for (const p of payloads) state = reduceChatFromSse(state, p);
    expect(state.ended).toBe(true);
    expect(state.rows.some((r) => r.kind === "assistant" && r.text.includes("KB-001"))).toBe(true);
  });
  test("POST /chat 无线鼠标防硬编码；空 message 400", async () => {
    const res = await app.request("/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: "无线鼠标还有货吗" }),
    });
    expect(res.status).toBe(200);
    const body = await res.text();
    expect(body.includes("MS-002")).toBe(true);
    expect(eventsForMessage("无线鼠标还有货吗")).toEqual(MOUSE_EVENTS);
    expect(eventsForMessage("机械键盘还有货吗")).toEqual(KEYBOARD_EVENTS);
    const bad = await app.request("/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: "   " }),
    });
    expect(bad.status).toBe(400);
  });
});
`;

const demoSource = `/**
 * Ch26 · 把协议接到「课程站 Chat 心智」的复制区。
 *
 * 本文件只给阅读 / 复制。测试禁止 import 本文件。
 *
 * 作业全绿不需要本文件、不需要 API Key：纯函数 + app.ts 假事件就能绿。
 * 不要把 TypeScript 学习站改成聊天产品——Ch12–Ch16 已经教过列表/气泡/四态。
 * 不要用 EventSource 打 POST（它只能 GET）。不要默认 bash。
 * 不要 import @earendil-works/*（本课作业没装）。
 *
 * 真要在自己的小页面里接 POST /chat：
 *   1. 先 bun test local/m5/ch26 全绿
 *   2. 把下面「复制区」拷到你自己的前端（不要拷进课程站）
 */

const COPY_WHEN_YOU_WIRE_UI = \`
async function consumeShopChat(message: string) {
  const res = await fetch("/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message }),
  });
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let state = { rows: [], ended: false, aborted: false };
  while (!state.ended) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const parts = buffer.split("\\\\n\\\\n");
    buffer = parts.pop() ?? "";
    for (const frame of parts) {
      if (!frame.startsWith("data: ")) continue;
      const payload = frame.slice("data: ".length);
      state = reduceChatFromSse(state, payload);
      // 这里用 assistantRowView / toolRowView 画列表
      // 对照 Ch13 reduceChat、Ch16 idle/loading/success/error
    }
  }
}
\`;

if (false) {
  // 有自己的小页面时把 COPY_WHEN_YOU_WIRE_UI 拷出去跑；这里故意不 fetch。
  console.log(COPY_WHEN_YOU_WIRE_UI);
}
`;

writeFileSync(join(localDir, "assignment.ts"), localAssignment);
writeFileSync(join(localDir, "app.ts"), appSource);
writeFileSync(join(localDir, "assignment.test.ts"), localTest);
writeFileSync(join(localDir, "demo.ts"), demoSource);
console.log("wrote", localDir);
