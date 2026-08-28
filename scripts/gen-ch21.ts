/**
 * 生成 src/content/chapters/ch21.json
 * 运行：bun scripts/gen-ch21.ts
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const preamble = `/**
 * Ch21 作业：商品助手的 SSE 帧（纯函数）。
 *
 * 场景：服务端把 token 写成 data: 行，用空行结束一帧。
 * Ch11 的 joinSsePayloads 是客户端解析；本章是服务端写出同一份帧。
 * 真路由在仓库 local/m4/ch21/app.ts；本题禁止 import。
 *
 * 全绿 = 你掌握了 Ch21。
 */`;

const functions = [
  {
    name: "formatSseEvent",
    testSuite: "formatSseEvent",
    skeleton: `/**
 * 【场景】商品助手要把一个 token 写成 SSE 帧。机械键盘的第一个字是「机」。
 *
 * 【转换点】SSE 一帧：可选 event: 行 + 必有 data: 行 + 空行（\\n\\n）结束。
 * 冒号后面有一个空格：\`data: \${data}\`。不要 trim data。
 * eventName === undefined → 只有 data 行；传了（包括 ""）→ 先 event 再 data。
 *
 * 任务：拼出完整一帧（含结尾空行）。
 * 示例：
 *   formatSseEvent("机") → "data: 机\\n\\n"
 *   formatSseEvent("tok", "delta") → "event: delta\\ndata: tok\\n\\n"
 *   formatSseEvent("") → "data: \\n\\n"
 *   formatSseEvent("hello world") → "data: hello world\\n\\n"
 *
 * 提示：用 === undefined 区分「没传 event」和「传了空串」。
 */
export function formatSseEvent(data: string, eventName?: string): string {
  throw new Error("TODO");
}`,
  },
  {
    name: "formatSseComment",
    testSuite: "formatSseComment",
    skeleton: `/**
 * 【场景】代理或网关会掐空闲连接。隔几秒发一行注释当 keep-alive。
 *
 * 【转换点】SSE 注释行以冒号开头：\`: \${text}\\n\\n\`（冒号、空格、正文、空行）。
 * 浏览器 / EventSource 会丢掉注释，不当成 token。
 *
 * 任务：返回注释帧。
 * 示例：
 *   formatSseComment("keep-alive") → ": keep-alive\\n\\n"
 *   formatSseComment("ping") → ": ping\\n\\n"
 *   formatSseComment("") → ": \\n\\n"
 *
 * 提示：不要写成 data: 行。空 text 仍保留冒号后的空格。
 */
export function formatSseComment(text: string): string {
  throw new Error("TODO");
}`,
  },
  {
    name: "splitSse",
    testSuite: "splitSse",
    skeleton: `/**
 * 【场景】TCP 不会按帧切开。缓冲区里可能是半帧，也可能一次来两帧。
 *
 * 【转换点】按 "\\n\\n" split。完整段（除最后一段）是 frames；最后一段是 rest（可能不完整）。
 * 跳过空的完整帧（开头的 \\n\\n）。不要 trim 帧内容。
 *
 * 任务：返回 { frames, rest }。
 * 示例：
 *   "data: a\\n\\ndata: b\\n\\n" → { frames: ["data: a", "data: b"], rest: "" }
 *   "data: a\\n\\ndata: b" → { frames: ["data: a"], rest: "data: b" }
 *   "" → { frames: [], rest: "" }
 *   "data: 机" → { frames: [], rest: "data: 机" }
 *   "\\n\\ndata: x\\n\\n" → { frames: ["data: x"], rest: "" }
 *
 * 提示：split 后 pop 最后一段当 rest；其余 filter 掉 ""。
 */
export function splitSse(buffer: string): { frames: string[]; rest: string } {
  throw new Error("TODO");
}`,
  },
  {
    name: "encodeTokenDelta",
    testSuite: "encodeTokenDelta",
    skeleton: `/**
 * 【场景】模型吐出一个 token「机」，要立刻推给课程站 Chat UI。
 *
 * 【转换点】必须调用 formatSseEvent(token)，不要自己再拼 data: 行，也不要加 event 名。
 *
 * 任务：把 token 编成默认 data 帧。
 * 示例：
 *   encodeTokenDelta("机") → "data: 机\\n\\n"
 *   encodeTokenDelta("hello world") → "data: hello world\\n\\n"
 *   encodeTokenDelta("") → "data: \\n\\n"
 *
 * 提示：return formatSseEvent(token);
 */
export function encodeTokenDelta(token: string): string {
  throw new Error("TODO");
}`,
  },
  {
    name: "endStream",
    testSuite: "endStream",
    skeleton: `/**
 * 【场景】token 推完了，客户端要知道可以停。OpenAI 风格约定最后一帧 data 是 [DONE]。
 *
 * 【转换点】必须调用 formatSseEvent("[DONE]")。这是正文约定，不是 HTTP 状态码，也不是连接关闭魔法。
 *
 * 任务：返回结束帧。
 * 示例：
 *   endStream() → "data: [DONE]\\n\\n"
 *
 * 提示：return formatSseEvent("[DONE]"); 不要加 event 名。
 */
export function endStream(): string {
  throw new Error("TODO");
}`,
  },
  {
    name: "concatAssistantText",
    testSuite: "concatAssistantText",
    skeleton: `/**
 * 【场景】UI 把已经到达的 token 拼成助手气泡。机械键盘被切成 ["机","械","键盘"]。
 *
 * 【转换点】tokens.join("")。空数组 ""。不要 join(" ")——空格若需要，是某个 token 自己带的。
 * 不要 mutate 传入的数组。
 *
 * 任务：按顺序拼成一段助手文本。
 * 示例：
 *   ["机","械","键盘"] → "机械键盘"
 *   ["无","线","鼠标"] → "无线鼠标"
 *   [] → ""
 *
 * 提示：join("")。测试会 freeze 数组。
 */
export function concatAssistantText(tokens: string[]): string {
  throw new Error("TODO");
}`,
  },
];

const assignment = `${preamble}

${functions.map((f) => f.skeleton).join("\n\n")}
`;

const testSource = `describe("formatSseEvent", () => {
  it("只有 data 行：机 / hello world", () => {
    expect(formatSseEvent("机")).toBe("data: 机\\n\\n");
    expect(formatSseEvent("hello world")).toBe("data: hello world\\n\\n");
  });
  it("带 event 名：delta", () => {
    expect(formatSseEvent("tok", "delta")).toBe("event: delta\\ndata: tok\\n\\n");
    expect(formatSseEvent("机", "token")).toBe("event: token\\ndata: 机\\n\\n");
  });
  it("空 data；空 event 名仍输出 event 行", () => {
    expect(formatSseEvent("")).toBe("data: \\n\\n");
    expect(formatSseEvent("x", "")).toBe("event: \\ndata: x\\n\\n");
    expect(formatSseEvent("机", undefined)).toBe("data: 机\\n\\n");
  });
});

describe("formatSseComment", () => {
  it("keep-alive / ping", () => {
    expect(formatSseComment("keep-alive")).toBe(": keep-alive\\n\\n");
    expect(formatSseComment("ping")).toBe(": ping\\n\\n");
  });
  it("空 text 仍保留冒号后空格", () => {
    expect(formatSseComment("")).toBe(": \\n\\n");
  });
  it("不要写成 data 行", () => {
    expect(formatSseComment("keep-alive")).toBe(": keep-alive\\n\\n");
    const c = formatSseComment("keep-alive");
    expect(c === "data: keep-alive\\n\\n").toBe(false);
  });
});

describe("splitSse", () => {
  it("两帧都完整", () => {
    expect(splitSse("data: a\\n\\ndata: b\\n\\n")).toEqual({
      frames: ["data: a", "data: b"],
      rest: "",
    });
  });
  it("第二帧不完整留在 rest", () => {
    expect(splitSse("data: a\\n\\ndata: b")).toEqual({
      frames: ["data: a"],
      rest: "data: b",
    });
  });
  it("空串 / 半帧 / 前导空帧", () => {
    expect(splitSse("")).toEqual({ frames: [], rest: "" });
    expect(splitSse("data: 机")).toEqual({ frames: [], rest: "data: 机" });
    expect(splitSse("\\n\\ndata: x\\n\\n")).toEqual({ frames: ["data: x"], rest: "" });
  });
  it("不 trim 帧内容", () => {
    expect(splitSse("data:  hello\\n\\n")).toEqual({
      frames: ["data:  hello"],
      rest: "",
    });
  });
});

describe("encodeTokenDelta", () => {
  it("机 / hello world 与 formatSseEvent 相同", () => {
    expect(encodeTokenDelta("机")).toBe("data: 机\\n\\n");
    expect(encodeTokenDelta("机")).toBe(formatSseEvent("机"));
    expect(encodeTokenDelta("hello world")).toBe(formatSseEvent("hello world"));
  });
  it("空 token", () => {
    expect(encodeTokenDelta("")).toBe("data: \\n\\n");
    expect(encodeTokenDelta("")).toBe(formatSseEvent(""));
  });
  it("不要加 event 名", () => {
    expect(encodeTokenDelta("tok")).toBe(formatSseEvent("tok"));
    expect(encodeTokenDelta("tok") === formatSseEvent("tok", "delta")).toBe(false);
  });
});

describe("endStream", () => {
  it("OpenAI 风格 [DONE] 帧", () => {
    expect(endStream()).toBe("data: [DONE]\\n\\n");
    expect(endStream()).toBe(formatSseEvent("[DONE]"));
  });
  it("不带 event 名", () => {
    expect(endStream() === formatSseEvent("[DONE]", "done")).toBe(false);
    expect(endStream() === formatSseEvent("[DONE]", "")).toBe(false);
  });
  it("多次调用结果相同", () => {
    expect(endStream()).toBe(endStream());
    expect(endStream()).toBe("data: [DONE]\\n\\n");
  });
});

describe("concatAssistantText", () => {
  it("机械键盘 token 拼接", () => {
    expect(concatAssistantText(["机", "械", "键盘"])).toBe("机械键盘");
  });
  it("无线鼠标（防硬编码机械键盘）", () => {
    expect(concatAssistantText(["无", "线", "鼠标"])).toBe("无线鼠标");
  });
  it("空数组 / 不插空格 / 不 mutate", () => {
    expect(concatAssistantText([])).toBe("");
    expect(concatAssistantText(["hello", "world"])).toBe("helloworld");
    expect(concatAssistantText(["hello ", "world"])).toBe("hello world");
    const tokens = ["机", "械"];
    Object.freeze(tokens);
    expect(concatAssistantText(tokens)).toBe("机械");
    expect(tokens.length).toBe(2);
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
    `> **预计**：1 天 ｜ **前置**：Ch11（客户端解析 \`data:\` 行）、Ch17（Hono 路由）
> **目标**：① 会写 SSE 帧（\`data:\` + 空行）；② 会切不完整缓冲区；③ 用 token 增量 + \`[DONE]\` 铺好 LLM 流。
> 你 15 年 Java：Servlet 异步 / Spring \`SseEmitter\`。Python：FastAPI \`StreamingResponse\` + \`yield\`。本章把同一份线协议接到 TypeScript 纯函数；Hono \`streamSSE\` 只在教程和 \`app.ts\` 里露一小段。

> 📐 **本教程的契约**：下面每一节（§21.1–§21.6）都**精确对应**作业里的题。讲过的才考，考的必讲过。卡住时按作业函数名回查对应小节。
> **不讲**：数据库 ORM、Agent SDK、中间件 / CORS（那是 Ch19 / Ch20）。作业禁止 \`import\` / 真 \`fetch\` / 真 \`setTimeout\`。

---`,
    [],
  ),
  sec(
    "sec-map",
    "🗺️ 本章地图",
    null,
    `本章作业是一条完整主线：**商品助手把「机械键盘」拆成 token 流，写成 SSE 帧推出去**。Ch11 的 \`joinSsePayloads\` 是**读** \`data:\` 行；本章是**写**同一份帧。两边必须字节级对得上：\`data: \${payload}\`（冒号后有空格）+ 空行。

读完这章 + 完成作业，你将能够：

- 拼一帧 \`data: 机\\n\\n\`，需要时再加 \`event:\` 行
- 写注释行做 keep-alive（\`:\` 开头，浏览器丢掉）
- 从 TCP 缓冲区切出完整帧，半帧留在 \`rest\`
- 用 \`formatSseEvent\` 编 token 增量和 \`[DONE]\`
- 把 token 数组 \`join("")\` 还原成助手气泡（UI 侧）

**作业 ↔ 教程对应表**（学哪节，就去做哪题）：

| 作业题 | 对应小节 | 核心知识点 |
|--------|----------|-----------|
| \`formatSseEvent\` | §21.1 | 写 \`data:\` 帧（+ 可选 \`event:\`） |
| \`formatSseComment\` | §21.2 | 注释行 keep-alive |
| \`splitSse\` | §21.3 | \`\\n\\n\` 切帧，rest 是半帧 |
| \`encodeTokenDelta\` | §21.4 | 调用 formatSseEvent 编 token |
| \`endStream\` | §21.5 | \`[DONE]\` 约定 |
| \`concatAssistantText\` | §21.6 | UI 侧 join（综合） |

本地文件：\`local/m4/ch21/assignment.ts\`（改 TODO）、\`app.ts\`（Hono \`streamSSE\`，不用改）、\`assignment.test.ts\`。

---`,
    [],
  ),
  sec(
    "sec-path",
    "⏱️ 学习路径：费曼五步（约 50–70 分钟）",
    null,
    `| 步 | 你要做 | 在哪做 |
|----|--------|--------|
| ① 预览猜（2 分钟） | 猜谁写 \`data:\`、空行干什么、\`[DONE]\` 是不是 HTTP | 本页 ① |
| ② 先动手 | 打开 \`local/m4/ch21/assignment.ts\` 改 TODO | 仓库 local/ |
| ③ 提取+反馈 | \`bun test local/m4/ch21\` 看红绿 | 终端 |
| ④ 费曼（2 分钟） | 大白话讲清「Ch11 解析 vs 本章写出」 | 本页 ④ |
| ⑤ 存闪卡 | 章末闪卡标复习日期 | 闪卡 |

> 💡 网页这一章是只读的。不要在浏览器里改代码。\`app.ts\` 已经用 \`streamSSE\` + \`writeSSE\` 写出和作业函数同一份帧。
> \`encodeTokenDelta\` / \`endStream\` **必须调用** \`formatSseEvent\`。

---`,
    [],
  ),
  sec(
    "sec-guess",
    "① 预览猜（2 分钟 · 激活你的 Java / Python 直觉）",
    null,
    `先别看答案，凭经验猜一猜（猜错没关系）：

1. Ch11 的 \`joinSsePayloads\` 读 \`data: 机\`。本章谁负责**写出**这一行？空行（\`\\n\\n\`）是分隔符还是 payload 的一部分？
2. Spring \`SseEmitter.send("机")\` 和 FastAPI \`yield "data: 机\\n\\n"\`，哪一个更接近你要手写的字符串？
3. 响应头 \`Content-Type\` 应该是 \`application/json\` 还是 \`text/event-stream\`？一次 JSON 能流式吐 token 吗？
4. \`: keep-alive\` 会不会出现在 Chat UI 的气泡里？EventSource 怎么处理冒号开头的行？
5. 最后一帧 \`data: [DONE]\` 是 HTTP 200 的另一种写法，还是 body 里的约定字符串？连接断开等于 \`[DONE]\` 吗？
6. 缓冲区里只有 \`"data: 机"\`（还没有空行），\`splitSse\` 应该交出一帧还是留在 rest？

> 猜完，带着验证心态进入正文。第 1、5、6 题是本章的 🔴。

---`,
    [],
  ),
  sec(
    "sec-world",
    "写帧 vs 读帧：同一份 \`data:\` 协议 🔴",
    null,
    `Ch11 你已经会从字节流里**抽出** \`data:\` payload。LLM 聊天要反过来：服务端一边生成 token，一边**写出**同样的帧。协议是对称的——写错一个空格，Ch11 的解析就会对不上。

| | Java | Python | 本章 |
|---|---|---|---|
| 推流 | Servlet 异步 \`AsyncContext\` / Spring \`SseEmitter\` | FastAPI \`StreamingResponse\` + \`yield\` | 纯函数拼帧；Hono \`streamSSE\` 只在 \`app.ts\` |
| 媒体类型 | \`text/event-stream\` | \`media_type="text/event-stream"\` | 同一 Content-Type |
| 一帧 | \`emitter.send(SseEmitter.event().data("机"))\` | \`yield f"data: {tok}\\n\\n"\` | \`formatSseEvent("机")\` |
| 客户端 | EventSource / 自己读行 | \`httpx\` 按行 | Ch11 \`joinSsePayloads\` |

### Java：Servlet 异步 / SseEmitter

\`\`\`java
@GetMapping(value = "/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
public SseEmitter stream() {
    SseEmitter emitter = new SseEmitter();
    emitter.send(SseEmitter.event().data("机"));
    emitter.send(SseEmitter.event().data("械"));
    emitter.send(SseEmitter.event().data("键盘"));
    emitter.send(SseEmitter.event().data("[DONE]")); // 约定，不是 HTTP 魔法
    emitter.complete();
    return emitter;
}
\`\`\`

底层就是往 \`PrintWriter\` 写 \`data: 机\\n\\n\` 再 \`flush\`。Servlet 3.0 \`AsyncContext\` 同理：把响应挂住，不要一次 \`return\` 整段 JSON。

### Python：FastAPI StreamingResponse + yield

\`\`\`python
from fastapi.responses import StreamingResponse

def gen():
    for tok in ["机", "械", "键盘"]:
        yield f"data: {tok}\\n\\n"
    yield "data: [DONE]\\n\\n"

@app.get("/stream")
def stream():
    return StreamingResponse(gen(), media_type="text/event-stream")
\`\`\`

\`yield\` 一块，客户端就能先看到「机」，不必等「机械键盘」整词生成完。

### TypeScript：先写纯函数，Hono 只包一层

作业测的是帧字符串。\`local/m4/ch21/app.ts\` 用 Hono 的 \`streamSSE\`（\`writeSSE({ data: token })\` 内部也是 \`data: \${token}\\n\\n\`）：

\`\`\`ts
import { Hono } from "hono";
import { streamSSE } from "hono/streaming";

app.get("/stream", (c) =>
  streamSSE(c, async (stream) => {
    for (const token of TOKENS) {
      await stream.writeSSE({ data: token }); // 等同 encodeTokenDelta(token)
    }
    await stream.writeSSE({ data: "[DONE]" }); // 等同 endStream()
  }),
);
\`\`\`

\`streamSSE\` 会带上 \`Content-Type: text/event-stream\`。作业**不要** \`import "hono"\`。

\`\`\`mermaid
sequenceDiagram
    participant U as Chat UI
    participant S as "Hono /stream"
    participant T as Mock tokens
    U->>S: GET /stream
    Note over S: "Content-Type: text/event-stream"
    T-->>S: 机
    S-->>U: "data: 机"
    T-->>S: 械
    S-->>U: "data: 械"
    T-->>S: 键盘
    S-->>U: "data: 键盘"
    S-->>U: "data: [DONE]"
    Note over U: concat 得到机械键盘
\`\`\`

\`\`\`mermaid
flowchart LR
    P["🟦 Ch21 服务端写<br/>────────<br/>formatSseEvent<br/>data 行加空行"]
    C["🟪 Ch11 客户端读<br/>────────<br/>joinSsePayloads<br/>抽出 payload 拼接"]
    P -->|"同一份帧"| C

    style P fill:#E1F5FE,stroke:#0277BD,color:#1f1f1f
    style C fill:#F3E5F5,stroke:#7B1FA2,color:#1f1f1f
\`\`\`

左边写出 \`data: 机\`，右边 Ch11 才能抽出 \`"机"\`。冒号后的空格两边都要认。

### 本课怎么算「会了」

打开 \`local/m4/ch21/assignment.ts\`，\`bun test local/m4/ch21\`。纯函数全绿，再加：\`GET /stream\` 的 Content-Type 含 \`text/event-stream\`；用 \`splitSse\` + \`concatAssistantText\` 能还原「机械键盘」；最后一帧是 \`data: [DONE]\`。**全绿 = 这题掌握。**

---`,
    [],
  ),
  sec(
    "sec-21.1",
    "§21.1 写出一帧（对应：`formatSseEvent`）🟡",
    "21.1",
    `SSE 一帧最少两行：\`data: <payload>\` 然后一个空行。空行就是 \`\\n\\n\`——上一行的换行 + 空行本身。

\`\`\`
data: 机

\`\`\`

对应字符串 \`"data: 机\\n\\n"\`。冒号后面**有一个空格**，和 Ch11 \`joinSsePayloads\` 切 6 个字符（\`data: \`）对齐。不要 trim payload：\`hello world\` 中间的空格是 token 的一部分。

可选的 \`event:\` 行写在 data **前面**：

\`\`\`
event: delta
data: tok

\`\`\`

### 锁死规则

- \`eventName === undefined\`（没传第二参）：只返回 \`data: \${data}\\n\\n\`
- 传了第二参（**包括空串 \`""\`**）：\`event: \${eventName}\\ndata: \${data}\\n\\n\`
- 空 data：\`data: \\n\\n\`（仍有那个空格）

\`undefined\` 和 \`""\` 不是一回事。\`if (eventName)\` 会把空串误判成「没有 event」。

### Java / Python

\`SseEmitter.event().name("delta").data("tok")\` 会写出 event + data。FastAPI 则是你自己 \`yield\` 两行。本题把这两行收成一个纯函数。

\`\`\`ts
function formatSseEvent(data: string, eventName?: string): string {
  if (eventName === undefined) return \`data: \${data}\\n\\n\`;
  return \`event: \${eventName}\\ndata: \${data}\\n\\n\`;
}

formatSseEvent("机");                 // "data: 机\\n\\n"
formatSseEvent("tok", "delta");       // "event: delta\\ndata: tok\\n\\n"
formatSseEvent("");                   // "data: \\n\\n"
formatSseEvent("hello world");        // 不要 trim
formatSseEvent("x", "");              // "event: \\ndata: x\\n\\n"
\`\`\`

### ❌ / ✅

\`\`\`ts
// ❌ "data:机\\n\\n"            —— 少了冒号后空格，Ch11 对不上
// ❌ trim(data)                —— "hello world" 会被弄坏
// ❌ if (eventName) 判断       —— 空串 "" 也会走「无 event」
// ❌ 忘记结尾 \\n\\n            —— splitSse 会一直等
// ✅ undefined 才省略 event 行；有空格；有空行
\`\`\`

> ✅ **做 \`formatSseEvent\`**：一帧的唯一入口。后面两题都调用它。

---`,
    ["formatSseEvent"],
  ),
  sec(
    "sec-21.2",
    "§21.2 注释行 keep-alive（对应：`formatSseComment`）🟢",
    "21.2",
    `SSE 规定：行首 \`:\` 是注释。代理 30 秒没看到字节可能掐连接，所以服务端会隔一阵发 \`: keep-alive\`。EventSource **丢掉**这些行，Chat UI 不会把 \`keep-alive\` 画进气泡。

格式：\`": \${text}\\n\\n"\`——冒号、空格、正文、空行。和 data 行一样用空行结束一帧。

\`\`\`ts
function formatSseComment(text: string): string {
  return \`: \${text}\\n\\n\`;
}

formatSseComment("keep-alive"); // ": keep-alive\\n\\n"
formatSseComment("ping");       // ": ping\\n\\n"
formatSseComment("");           // ": \\n\\n"
\`\`\`

Java \`SseEmitter\` 也可以发 comment；Python 就是 \`yield f": {text}\\n\\n"\`。空 text 仍保留冒号后的空格，和 data 空 payload 同一风格。

### ❌ / ✅

\`\`\`ts
// ❌ "data: keep-alive\\n\\n"   —— 会变成一个假 token
// ❌ ":keep-alive" 无空格
// ❌ 没有结尾空行
// ✅ ": \${text}\\n\\n"
\`\`\`

> ✅ **做 \`formatSseComment\`**：keep-alive 不是 token。

---`,
    ["formatSseComment"],
  ),
  sec(
    "sec-21.3",
    "§21.3 切开缓冲区（对应：`splitSse`）🔴",
    "21.3",
    `TCP / \`ReadableStream\` 按块到达，**不保证**一块正好是一帧。可能一次来两帧，也可能 \`"data: 机"\` 还没等到空行。所以要有缓冲区：完整帧拿走，半帧留着。

规则（作业锁死）：

1. 按 \`"\\n\\n"\` \`split\`。
2. **最后一段**永远是 \`rest\`（可能是 \`""\`，表示刚好切在帧边界）。
3. 前面的完整段放进 \`frames\`；**跳过空串**（开头的 \`\\n\\n\` 会产生空完整段）。
4. **不要 trim** 帧内容。\`"data:  hello"\` 里两个空格都要留着。

\`\`\`mermaid
flowchart TD
    buf["buffer 进来"] --> cut["按空白行切开"]
    cut --> last["最后一段是 rest"]
    cut --> full["前面是完整帧"]
    full --> skip{"空帧?"}
    skip -->|"是"| drop["丢掉"]
    skip -->|"否"| keep["推进 frames"]

    style buf fill:#FFE082,stroke:#F9A825,color:#1f1f1f
    style cut fill:#80DEEA,stroke:#0097A7,color:#1f1f1f
    style last fill:#CE93D8,stroke:#7B1FA2,color:#1f1f1f
    style full fill:#80DEEA,stroke:#0097A7,color:#1f1f1f
    style skip fill:#80DEEA,stroke:#0097A7,color:#1f1f1f
    style drop fill:#EF9A9A,stroke:#C62828,color:#1f1f1f
    style keep fill:#A5D6A7,stroke:#388E3C,color:#1f1f1f
\`\`\`

\`\`\`ts
function splitSse(buffer: string): { frames: string[]; rest: string } {
  const parts = buffer.split("\\n\\n");
  const rest = parts.pop() ?? "";
  const frames = parts.filter((p) => p !== "");
  return { frames, rest };
}

splitSse("data: a\\n\\ndata: b\\n\\n");
// { frames: ["data: a", "data: b"], rest: "" }

splitSse("data: a\\n\\ndata: b");
// { frames: ["data: a"], rest: "data: b" }

splitSse("");            // { frames: [], rest: "" }
splitSse("data: 机");    // { frames: [], rest: "data: 机" }
splitSse("\\n\\ndata: x\\n\\n"); // { frames: ["data: x"], rest: "" }
\`\`\`

取出 payload 时再 \`slice("data: ".length)\`——那是 Ch11 的事。本题只切帧，不解析字段。

### ❌ / ✅

\`\`\`ts
// ❌ split("\\n") 按单行切      —— 一帧里可能有 event + data 两行
// ❌ 把最后一段也当完整帧       —— 半帧会提前交给 UI
// ❌ trim 每一段               —— payload 前导空格丢了
// ❌ 保留空完整帧               —— 开头 \\n\\n 会多一个 ""
// ✅ pop rest；filter 空完整段
\`\`\`

> ✅ **做 \`splitSse\`**：流式读取的核心。\`/stream\` 测试会用它还原机械键盘。

---`,
    ["splitSse"],
  ),
  sec(
    "sec-21.4",
    "§21.4 token 增量（对应：`encodeTokenDelta`）🟢",
    "21.4",
    `模型不会一次吐出「机械键盘」四个字，而是 \`"机"\`、\`"械"\`、\`"键盘"\`。每一段都是一次 delta，立刻写成默认 data 帧（**不要** event 名）。

**必须调用** \`formatSseEvent(token)\`。自己再拼 \`data:\` 会和 §21.1 的空格规则分叉。

\`\`\`ts
function encodeTokenDelta(token: string): string {
  return formatSseEvent(token);
}

encodeTokenDelta("机");           // "data: 机\\n\\n"
encodeTokenDelta("hello world");  // 不 trim
encodeTokenDelta("");             // "data: \\n\\n"
\`\`\`

Hono \`writeSSE({ data: token })\` 内部也是 \`data: \${token}\`。作业函数就是把这件事变成可单测的纯函数。

### ❌ / ✅

\`\`\`ts
// ❌ 手写 "data:" + token + "\\n\\n" 却忘了空格
// ❌ formatSseEvent(token, "delta")  —— 本题不要 event 名
// ❌ 不调用 formatSseEvent
// ✅ return formatSseEvent(token)
\`\`\`

> ✅ **做 \`encodeTokenDelta\`**：调用 §21.1。

---`,
    ["encodeTokenDelta"],
  ),
  sec(
    "sec-21.5",
    "§21.5 结束约定（对应：`endStream`）🟡",
    "21.5",
    `HTTP 流结束有两种「完」：

1. 连接关掉了（TCP FIN / \`emitter.complete()\`）
2. **正文里**出现约定字符串 \`[DONE]\`

OpenAI 兼容接口常用第 2 种：最后一帧是 \`data: [DONE]\\n\\n\`。客户端看到它就停，不必把「连接断开」和「模型说完了」绑死——中间代理可能还开着。

这是**约定**，不是 HTTP 状态码，也不是浏览器内建魔法。\`200\` 早在第一帧之前就写出去了。

**必须调用** \`formatSseEvent("[DONE]")\`。

\`\`\`ts
function endStream(): string {
  return formatSseEvent("[DONE]");
}

endStream(); // "data: [DONE]\\n\\n"
\`\`\`

\`app.ts\` 里 \`writeSSE({ data: "[DONE]" })\` 写出同一帧。Ch11 的 \`joinSsePayloads\` 会把 \`[DONE]\` 也抽出来——UI 要自己丢掉这一段，不要画进气泡。本章作业的 \`concatAssistantText\` 只拼**真正的 token**，不含 \`[DONE]\`。

### ❌ / ✅

\`\`\`ts
// ❌ return "[DONE]"              —— 不是 SSE 帧
// ❌ formatSseEvent("[DONE]", "done")
// ❌ 以为 HTTP 200 就等于说完了
// ✅ formatSseEvent("[DONE]")
\`\`\`

> ✅ **做 \`endStream\`**：调用 §21.1，正文约定结束。

---`,
    ["endStream"],
  ),
  sec(
    "sec-21.6",
    "§21.6 气泡拼回去（对应：`concatAssistantText`）🟢",
    "21.6",
    `综合题：服务端流出来的是 token 数组，Chat UI 要显示一整句。这和 Ch11 的 \`readAllTextFromChunks\` 是同一句话：\`join("")\`，不要空格分隔。

\`\`\`ts
function concatAssistantText(tokens: string[]): string {
  return tokens.join("");
}

concatAssistantText(["机", "械", "键盘"]); // "机械键盘"
concatAssistantText(["无", "线", "鼠标"]); // "无线鼠标"
concatAssistantText([]);                  // ""
concatAssistantText(["hello", "world"]);  // "helloworld"
\`\`\`

空格如果该出现，会在某个 token 里（\`"hello "\`）。不要 mutate 原数组——测试会 \`Object.freeze\`。

本地 HTTP 测试的闭环：

1. \`GET /stream\` 读 body 文本
2. \`splitSse\` 切出 frames
3. 丢掉最后的 \`data: [DONE]\`
4. 每帧去掉 \`data: \` 前缀得到 token
5. \`concatAssistantText\` 得到 \`"机械键盘"\`

### ❌ / ✅

\`\`\`ts
// ❌ tokens.join(" ")     —— "机械键盘" 变成 "机 械 键盘"
// ❌ tokens.push 改原数组
// ❌ 硬编码 return "机械键盘"  —— 无线鼠标会拆穿
// ✅ join("")；[] → ""
\`\`\`

> ✅ **做 \`concatAssistantText\`**：UI 侧还原。然后 \`bun test local/m4/ch21\`。

---`,
    ["concatAssistantText"],
  ),
  sec(
    "sec-pits",
    "⚠️ Java / Python 老手几个坑",
    null,
    `1. **\`data:机\` 少空格。** Ch11 按 \`data: \`（6 字符）切。少空格，解析就错位。
2. **把 \`[DONE]\` 当 HTTP 状态。** 它是 body 里的 data 帧。状态码 200 在流开始时就定了。
3. **\`if (eventName)\` 省略 event 行。** 空串 \`""\` 也要输出 \`event: \`。用 \`=== undefined\`。
4. **按 \`\\n\` 切 SSE。** 一帧可以有 event + data 两行。分隔符是 \`\\n\\n\`。
5. **半帧当完整帧。** \`"data: 机"\` 没有空行 → 只能进 rest。
6. **注释写成 data。** \`: keep-alive\` 才会被 EventSource 丢掉。
7. **\`join(" ")\` 拼气泡。** token 之间的空格是模型自己吐的。
8. **作业 \`import "hono"\`。** \`streamSSE\` 只在 \`app.ts\`。JSON 作业是纯函数。
9. **真 \`fetch\` / \`setTimeout\` 等流。** 测试 4 秒超时；用字符串和 \`app.request\`。
10. **以为连接断开 == 说完。** 用 \`[DONE]\` 约定；代理可能还开着。

---`,
    [],
  ),
  sec(
    "sec-homework",
    "📝 本章作业",
    null,
    `上面 6 个函数按节交错出现。每个注释里有【场景】【转换点】、示例和提示。

**完成方式**：打开仓库 \`local/m4/ch21/assignment.ts\`，把 \`throw new Error("TODO")\` 换成实现，然后：

\`\`\`bash
bun test local/m4/ch21
\`\`\`

\`app.ts\` 不用改（\`streamSSE\` + mock token 已接好）。不要 \`listen\` 端口，测试用 \`app.request\`。

卡住就回对应 §：\`formatSseEvent\` → §21.1，\`splitSse\` → §21.3，\`endStream\` → §21.5（请调用 formatSseEvent）。

---`,
    [],
  ),
  sec(
    "sec-check",
    "✅ 自测：你真的掌握了吗？",
    null,
    `- [ ] 能对照 \`SseEmitter\` / FastAPI \`StreamingResponse\` 说出 \`data: 机\\n\\n\`
- [ ] 冒号后有空格；空 data 是 \`"data: \\n\\n"\`
- [ ] \`eventName === undefined\` 才省略 event 行；\`""\` 仍有 event 行
- [ ] 注释行 \`: keep-alive\` 不会进气泡
- [ ] \`splitSse\` 半帧留 rest；开头 \`\\n\\n\` 丢掉空帧
- [ ] \`encodeTokenDelta\` / \`endStream\` 调用 \`formatSseEvent\`
- [ ] \`[DONE]\` 是正文约定，不是 HTTP 魔法
- [ ] \`concatAssistantText(["无","线","鼠标"])\` 是无线鼠标，不是硬编码机械键盘
- [ ] \`bun test local/m4/ch21\` 全绿；\`/stream\` 能还原机械键盘

---`,
    [],
  ),
  sec(
    "sec-feynman",
    "🎓 费曼挑战",
    null,
    `用大白话讲给「Java 同事」听。讲不清 = 还没真懂。

任选一题（1–2 分钟）：

1. 「Ch11 已经会解析 \`data:\` 了，为什么还要再写一章？服务端少一个空格会发生什么？」— 卡壳重读总述 + §21.1
2. 「\`SseEmitter.complete()\` 和 body 里的 \`[DONE]\` 有什么区别？为什么代理场景更需要约定字符串？」— 卡壳重读 §21.5
3. 「缓冲区只有半帧时为什么不能交给 UI？\`splitSse\` 的 rest 是干什么的？」— 卡壳重读 §21.3

---`,
    [],
  ),
  sec(
    "sec-next",
    "⏭️ 下一步",
    null,
    `Ch21 掌握后，你会写也会切 SSE 帧，Chat UI 能把 token 拼回句子。下一章是 **Ch22 · pi-ai：调模型 + 流式**：把假 token 数组换成模型真正吐出的增量，再接到本章这套 \`encodeTokenDelta\` / \`[DONE]\` 上。中间件和 CORS 不用再写；流式协议已经对齐 Ch11 的解析。`,
    [],
  ),
];

const tutorialMd = `# Ch21 · SSE 流式响应

${sections
  .map((s) => (s.heading ? `## ${s.heading}\n\n${s.body}` : s.body))
  .join("\n\n")}
`;

const reviewMd = `# Ch21 · 记忆闪卡

> 先回忆，再翻答案。连续 2 次秒答 → 退役。

## 🔖 闪卡

| # | 正面（问题） | 背面（答案） | 掌握 |
|---|---|---|---|
| 1 | Ch11 \`joinSsePayloads\` 和本章 \`formatSseEvent\` 各干什么？冒号后为什么有空格？ | Ch11 读 payload；本章写同一份帧。\`data: \${data}\` 与客户端 slice(6) 对齐。 | ⬜ |
| 2 | \`formatSseEvent("机")\` 和 \`formatSseEvent("x", "")\` 各返回什么？ | 没传 event → 只有 data 行。传了空串 → 仍有 \`event: \` 行。用 \`=== undefined\` 区分。 | ⬜ |
| 3 | \`: keep-alive\` 会出现在助手气泡里吗？ | 不会。行首冒号是 SSE 注释，EventSource 丢掉。写成 \`data:\` 才会变成假 token。 | ⬜ |
| 4 | 缓冲区 \`"data: 机"\`（无空行）\`splitSse\` 的 frames / rest？ | frames \`[]\`，rest \`"data: 机"\`。半帧不能提前交给 UI。 | ⬜ |
| 5 | 开头 \`\\n\\n\` 为什么不能当一帧？ | split 会产生空完整段，要 skip。否则 frames 里多一个 \`""\`。 | ⬜ |
| 6 | \`[DONE]\` 是 HTTP 状态码吗？连接断开等于说完了吗？ | 都不是。它是 body 里的 data 约定（OpenAI 风格）。200 在第一帧前就定了。 | ⬜ |
| 7 | \`encodeTokenDelta\` / \`endStream\` 为什么必须调用 \`formatSseEvent\`？ | 空格、空行、event 规则只维护一处。手写 data 行容易和 Ch11 对不上。 | ⬜ |
| 8 | \`["机","械","键盘"]\` 和 \`["无","线","鼠标"]\` 各拼成什么？能 \`join(" ")\` 吗？ | 机械键盘；无线鼠标。不能插空格。空数组 \`""\`。不要硬编码。 | ⬜ |
| 9 | \`GET /stream\` 的 Content-Type？Java / Python 对照是什么？ | \`text/event-stream\`。Java \`SseEmitter\` / Servlet 异步；Python FastAPI \`StreamingResponse\` + \`yield\`。 | ⬜ |

## 🎓 费曼自检

- [ ] 能说清写帧 vs 读帧、冒号后空格
- [ ] 能说清 \`[DONE]\` 是约定、半帧留 rest
- [ ] 能对照 SseEmitter / StreamingResponse 说出 Hono \`streamSSE\`
`;

const chapter = {
  id: "ch21",
  num: "21",
  title: "SSE 流式响应",
  runMode: "local" as const,
  tutorialMd,
  assignment,
  testName: "ch21_assignment",
  testSource,
  reviewMd,
  interleaved: true,
  sections,
  functions,
  preamble,
  localHint: "bun test local/m4/ch21",
};

const out = join(dirname(fileURLToPath(import.meta.url)), "../src/content/chapters/ch21.json");
mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, JSON.stringify(chapter, null, 2) + "\n");
console.log("wrote", out);
