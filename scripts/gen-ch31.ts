/**
 * 生成 src/content/chapters/ch31.json 与 local/m6/ch31/
 * 运行：bun scripts/gen-ch31.ts
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const preamble = `/**
 * Ch31 作业：SDK 嵌入 vs RPC（纯函数）。
 *
 * 场景：商品后台要嵌一个会查 KB-001 / MS-002 的 Agent。同进程用 SDK，
 * 别的语言或要隔离崩溃就拉起 pi --mode rpc，只想把一轮事件倒进日志
 * 就用 --mode json。作业把选型、JSONL 分帧、命令编码、id 对上响应、
 * prompt 的接受语义、select 对话框应答、以及 RPC 命令到 SDK 方法的
 * 对照写成纯函数。不 import 真 Pi 包、不装新依赖。事实来自本机
 * docs/sdk.md、rpc.md、json.md（pi v0.85.1）。
 *
 * 全绿 = 你掌握了 Ch31。本地：bun test local/m6/ch31
 */

export type Integration = "sdk" | "rpc" | "json";

export type RpcCommand = {
  type: string;
  id: string;
  message?: string;
  streamingBehavior?: string;
  customInstructions?: string;
};

export type RpcFrame = {
  type: string;
  id?: string;
  command?: string;
  success?: boolean;
};

export type UiRequest = {
  type: string;
  id: string;
  method: string;
  options?: string[];
};

export type UiResponse = {
  type: "extension_ui_response";
  id: string;
  value?: string;
  cancelled?: boolean;
};

export type PromptReading = "accepted" | "rejected" | "stream";
`;

const functions = [
  {
    name: "pickIntegration",
    testSuite: "pickIntegration",
    skeleton: `/**
 * 【场景】商品后台要嵌 Agent。先选路：同进程、子进程隔离、跨语言，还是只倒一轮事件。
 *
 * 【转换点】三条集成 🟡（docs/sdk.md、rpc.md、json.md）：
 *   "in-process"     → "sdk"   同进程 createAgentSession，类型安全
 *   "isolate"        → "rpc"   子进程，宿主崩不随它崩
 *   "cross-language" → "rpc"   stdin/stdout JSONL，Python 等也能写客户端
 *   "one-shot"       → "json"  pi --mode json，只有事件流，没有命令回路
 *   其它字符串 → null
 *
 * 任务：返回 "sdk" | "rpc" | "json"；不认识 → null。
 * 示例：
 *   pickIntegration("in-process") → "sdk"
 *   pickIntegration("isolate") → "rpc"
 *   pickIntegration("cross-language") → "rpc"
 *   pickIntegration("one-shot") → "json"
 *   pickIntegration("tui") → null
 *
 * 提示：四个字面量各走一支，别用 includes 去猜中文句子。
 */
export function pickIntegration(need: string): Integration | null {
  throw new Error("TODO");
}`,
  },
  {
    name: "splitJsonl",
    testSuite: "splitJsonl",
    skeleton: `/**
 * 【场景】Python 商品服务读 pi --mode rpc 的 stdout。帧界必须和官方一致，否则一条 JSON 会被切成两半。
 *
 * 【转换点】LF-only 分帧 🔴（rpc.md Framing）：
 *   只按 \\n（U+000A）切开。
 *   每条记录若以 \\r 结尾，剥掉这一个 \\r（接受 \\r\\n）。
 *   U+2028、U+2029 是 JSON 字符串里的合法字符，不是帧界。Node readline 会把它们当换行，官方点名不合规。
 *   剥完是空串的记录丢掉（末尾多一个 \\n 不产生空帧）。
 *   最后一行没有 \\n 也算一条记录。
 *
 * 任务：返回记录字符串数组。
 * 示例：
 *   "{\\"a\\":1}\\r\\n{\\"b\\":2}\\n" → ['{"a":1}', '{"b":2}']
 *   一条记录内部含 U+2028，后面再跟 \\n 和第二条 → 仍然是 2 条，U+2028 留在第一条里
 *   "" → []
 *
 * 提示：用 charCode 10 找 \\n，不要用 split(/\\n|\\u2028/)。空串过滤放在剥 \\r 之后。
 */
export function splitJsonl(input: string): string[] {
  throw new Error("TODO");
}`,
  },
  {
    name: "encodeCommand",
    testSuite: "encodeCommand",
    skeleton: `/**
 * 【场景】往 RPC 的 stdin 写一行：让商品助手去查键盘，或者在它已经在跑时改口。
 *
 * 【转换点】命令是一行 JSON，以 \\n 结尾 🟡。键的顺序固定，缺的可选键不要写进去：
 *   必有 type、id（id 用来和稍后的 response 对上）。
 *   有 message 才写 message。
 *   有 streamingBehavior 才写（"steer" 或 "followUp"：Agent 正在流式输出时，prompt 必须带它，否则命令被拒绝）。
 *   有 customInstructions 才写（compact 用）。
 *   行尾只有 \\n，不要 \\r\\n。
 *
 * 任务：返回那一行，含末尾换行。
 * 示例：
 *   { type:"prompt", id:"req-1", message:"查 KB-001 机械键盘" }
 *     → '{"type":"prompt","id":"req-1","message":"查 KB-001 机械键盘"}\\n'
 *   再加 streamingBehavior:"steer" → 键序 type, id, message, streamingBehavior
 *   { type:"compact", id:"req-3", customInstructions:"聚焦库存数字" }
 *     → 没有 message 键
 *
 * 提示：按这个顺序组对象再 JSON.stringify，最后加 "\\n"。
 */
export function encodeCommand(cmd: RpcCommand): string {
  throw new Error("TODO");
}`,
  },
  {
    name: "matchResponseTo",
    testSuite: "matchResponseTo",
    skeleton: `/**
 * 【场景】stdout 上 prompt 的 response、后面的 agent 事件、另一条命令的 response 混在一起。要按 id 找回「这条命令被接受了没有」。
 *
 * 【转换点】id 关联 🔴：response 帧的 type 是 "response"，并带回你发出的 id。
 *   同 id 的 bash_execution_update 不是 response。
 *   没有 id 的 agent_start 也不是。
 *   多条时取第一条 type==="response" 且 id 相等的。没有 → null。
 *   不改入参数组。
 *
 * 任务：返回那一帧；找不到 → null。
 * 示例：
 *   帧列表里先有 bash_execution_update id req-1，再有 response id req-1 success true
 *     → 返回那条 response，不是 update
 *   id 不存在 → null
 *
 * 提示：按数组顺序找，两个条件都要满足。
 */
export function matchResponseTo(frames: RpcFrame[], id: string): RpcFrame | null {
  throw new Error("TODO");
}`,
  },
  {
    name: "promptAcceptSemantics",
    testSuite: "promptAcceptSemantics",
    skeleton: `/**
 * 【场景】商品助手收到「查无线鼠标」。response 上 success true 之后，模型仍可能在事件流里报错。不要再等第二条同 id 的 response。
 *
 * 【转换点】prompt 的接受语义 🔴（rpc.md）：
 *   type "response" 且 command "prompt" 且 success true  → "accepted"
 *     （已接受、已排队、或立刻处理了。不是「模型已经答完」。）
 *   同上且 success false → "rejected"（接受之前就被拒绝，例如正在流式输出却没给 streamingBehavior）
 *   type 是 agent_end / message_end / turn_end / tool_execution_end / message_update → "stream"
 *     （接受之后的成败走事件流，不会再为同一个 id 发第二条 response）
 *   其它（compact 的 response、extension_ui_request、agent_start）→ null
 *
 * 任务：返回 "accepted" | "rejected" | "stream"；对不上 → null。
 * 示例：
 *   { type:"response", command:"prompt", success:true } → "accepted"
 *   { type:"response", command:"prompt", success:false } → "rejected"
 *   { type:"agent_end" } → "stream"
 *   { type:"response", command:"compact", success:true } → null
 *
 * 提示：先看是不是 prompt 的 response，再看是不是那五种事件。
 */
export function promptAcceptSemantics(frame: RpcFrame): PromptReading | null {
  throw new Error("TODO");
}`,
  },
  {
    name: "answerUiRequest",
    testSuite: "answerUiRequest",
    skeleton: `/**
 * 【场景】价格护栏扩展在 RPC 里调用 ctx.ui.select，stdout 打出一张选择框。客户端要回一帧。
 *
 * 【转换点】extension UI 子协议 🟡（rpc.md，本题只做 select）：
 *   请求 type 必须是 "extension_ui_request" 且 method 是 "select"，否则 null
 *     （notify 等 fire-and-forget 不需要应答；confirm 不在本题）。
 *   choice 为 null → { type:"extension_ui_response", id, cancelled:true }，不要带 value。
 *   choice 是 options 里的字符串 → { type:"extension_ui_response", id, value:choice }，不要带 cancelled。
 *   choice 不在 options 里（或没有 options）→ null。
 *   id 必须原样带回。不改入参。
 *
 * 任务：返回应答对象；不该答或选项非法 → null。
 * 示例：
 *   select，options ["Allow","Block"]，choice "Allow"
 *     → { type:"extension_ui_response", id, value:"Allow" }
 *   choice null → { type:"extension_ui_response", id, cancelled:true }
 *   choice "Nope" → null
 *   method "notify" → null
 *
 * 提示：options.includes。两个成功返回的对象键不一样。
 */
export function answerUiRequest(request: UiRequest, choice: string | null): UiResponse | null {
  throw new Error("TODO");
}`,
  },
  {
    name: "sdkEquivalent",
    testSuite: "sdkEquivalent",
    skeleton: `/**
 * 【场景】已经会写 RPC 命令的人改用同进程 SDK。同一件事方法名叫什么？
 *
 * 【转换点】命令 ↔ SDK 🟢（综合，rpc-mode.js 的 handler 对得上 AgentSession）：
 *   prompt      → "session.prompt"
 *   steer       → "session.steer"
 *   follow_up   → "session.followUp"
 *   abort       → "session.abort"
 *   compact     → "session.compact"
 *   get_entries → "session.sessionManager.getEntries"
 *   get_state   → "session fields"
 *     （没有同名方法。处理器读的是 session 上的 model、thinkingLevel、isStreaming、
 *      isCompacting、steeringMode、followUpMode、sessionFile、sessionId、sessionName、
 *      autoCompactionEnabled、messageCount、pendingMessageCount。作业用这一个固定字符串代表这次快照。）
 *   subscribe 不是 RPC 命令（SDK 用 session.subscribe 收事件，RPC 把事件直接打到 stdout）→ null
 *   其它 → null
 *
 * 任务：返回上面的字符串；不认识 → null。
 * 示例：
 *   sdkEquivalent("prompt") → "session.prompt"
 *   sdkEquivalent("follow_up") → "session.followUp"
 *   sdkEquivalent("get_state") → "session fields"
 *   sdkEquivalent("get_entries") → "session.sessionManager.getEntries"
 *   sdkEquivalent("subscribe") → null
 *
 * 提示：一张表。get_state 的值就是 "session fields" 这四个字中间一个空格。
 */
export function sdkEquivalent(command: string): string | null {
  throw new Error("TODO");
}`,
  },
];

const assignment = `${preamble}

${functions.map((f) => f.skeleton).join("\n\n")}
`;

const testSource = `describe("pickIntegration", () => {
  it("同进程走 SDK，隔离或跨语言走 RPC", () => {
    expect(pickIntegration("in-process")).toBe("sdk");
    expect(pickIntegration("isolate")).toBe("rpc");
    expect(pickIntegration("cross-language")).toBe("rpc");
  });
  it("只倒一轮事件走 json", () => {
    expect(pickIntegration("one-shot")).toBe("json");
  });
  it("不认识的需求 → null", () => {
    expect(pickIntegration("tui")).toBeNull();
    expect(pickIntegration("")).toBeNull();
  });
});

describe("splitJsonl", () => {
  it("只按 LF 切，并剥掉行尾 CR", () => {
    expect(splitJsonl('{"a":1}\\r\\n{"b":2}\\n')).toEqual(['{"a":1}', '{"b":2}']);
    expect(splitJsonl('{"a":1}\\n{"b":2}')).toEqual(['{"a":1}', '{"b":2}']);
  });
  it("U+2028 / U+2029 留在记录内部", () => {
    const lineSep = '{"msg":"价格\\u2028护栏"}\\n{"sku":"MS-002"}\\n';
    const parts = splitJsonl(lineSep);
    expect(parts.length).toBe(2);
    expect(parts[0]).toBe('{"msg":"价格\\u2028护栏"}');
    expect(parts[1]).toBe('{"sku":"MS-002"}');
    const para = '{"q":"KB-001\\u2029库存"}\\n{"ok":true}';
    const paraParts = splitJsonl(para);
    expect(paraParts.length).toBe(2);
    expect(paraParts[0]).toBe('{"q":"KB-001\\u2029库存"}');
  });
  it("空串、尾部换行、空行都不多出帧", () => {
    expect(splitJsonl("")).toEqual([]);
    expect(splitJsonl('{"a":1}\\n')).toEqual(['{"a":1}']);
    expect(splitJsonl('{"a":1}\\n\\n{"b":2}\\n')).toEqual(['{"a":1}', '{"b":2}']);
  });
});

describe("encodeCommand", () => {
  it("prompt 一行：type、id、message，以 LF 结尾", () => {
    expect(encodeCommand({ type: "prompt", id: "req-1", message: "查 KB-001 机械键盘" })).toBe(
      '{"type":"prompt","id":"req-1","message":"查 KB-001 机械键盘"}\\n',
    );
  });
  it("正在输出时改口：带上 streamingBehavior，键序固定", () => {
    expect(
      encodeCommand({
        type: "prompt",
        id: "req-2",
        message: "改查 MS-002 无线鼠标",
        streamingBehavior: "steer",
      }),
    ).toBe('{"type":"prompt","id":"req-2","message":"改查 MS-002 无线鼠标","streamingBehavior":"steer"}\\n');
  });
  it("compact 不写 message 键", () => {
    const line = encodeCommand({ type: "compact", id: "req-3", customInstructions: "聚焦库存数字" });
    expect(line).toBe('{"type":"compact","id":"req-3","customInstructions":"聚焦库存数字"}\\n');
    expect(line.includes("\\r")).toBe(false);
  });
});

describe("matchResponseTo", () => {
  it("同 id 的 update 不是 response；取第一条对得上的 response", () => {
    const frames = [
      { type: "bash_execution_update", id: "req-1" },
      { type: "response", id: "req-1", command: "prompt", success: true },
      { type: "agent_start" },
      { type: "response", id: "req-2", command: "get_state", success: true },
    ];
    Object.freeze(frames);
    expect(matchResponseTo(frames, "req-1")).toEqual({
      type: "response",
      id: "req-1",
      command: "prompt",
      success: true,
    });
    expect(matchResponseTo(frames, "req-2")).toEqual({
      type: "response",
      id: "req-2",
      command: "get_state",
      success: true,
    });
  });
  it("没有这条 id 的 response → null", () => {
    expect(matchResponseTo([{ type: "agent_end" }, { type: "response", id: "req-9", command: "prompt", success: true }], "req-1")).toBeNull();
    expect(matchResponseTo([], "req-1")).toBeNull();
  });
});

describe("promptAcceptSemantics", () => {
  it("success true 是已接受，false 是接受前拒绝", () => {
    expect(promptAcceptSemantics({ type: "response", command: "prompt", success: true })).toBe("accepted");
    expect(promptAcceptSemantics({ type: "response", command: "prompt", success: false })).toBe("rejected");
  });
  it("接受之后的失败走事件流", () => {
    expect(promptAcceptSemantics({ type: "agent_end" })).toBe("stream");
    expect(promptAcceptSemantics({ type: "message_end" })).toBe("stream");
    expect(promptAcceptSemantics({ type: "tool_execution_end" })).toBe("stream");
  });
  it("别的命令的 response、UI 请求，不是 prompt 的接受语义", () => {
    expect(promptAcceptSemantics({ type: "response", command: "compact", success: true })).toBeNull();
    expect(promptAcceptSemantics({ type: "extension_ui_request", id: "uuid-1" })).toBeNull();
    expect(promptAcceptSemantics({ type: "agent_start" })).toBeNull();
  });
});

describe("answerUiRequest", () => {
  it("select 选中选项 → value 帧", () => {
    const req = {
      type: "extension_ui_request",
      id: "uuid-1",
      method: "select",
      options: ["Allow", "Block"],
    };
    Object.freeze(req.options);
    Object.freeze(req);
    expect(answerUiRequest(req, "Allow")).toEqual({
      type: "extension_ui_response",
      id: "uuid-1",
      value: "Allow",
    });
    expect(req.options).toEqual(["Allow", "Block"]);
  });
  it("choice 为 null → cancelled，不带 value", () => {
    expect(
      answerUiRequest(
        { type: "extension_ui_request", id: "uuid-1", method: "select", options: ["Allow", "Block"] },
        null,
      ),
    ).toEqual({ type: "extension_ui_response", id: "uuid-1", cancelled: true });
  });
  it("选项不对、或不是 select → null", () => {
    expect(
      answerUiRequest(
        { type: "extension_ui_request", id: "uuid-1", method: "select", options: ["Allow", "Block"] },
        "Nope",
      ),
    ).toBeNull();
    expect(
      answerUiRequest({ type: "extension_ui_request", id: "uuid-5", method: "notify" }, "Allow"),
    ).toBeNull();
    expect(answerUiRequest({ type: "response", id: "req-1", method: "select", options: ["Allow"] }, "Allow")).toBeNull();
  });
});

describe("sdkEquivalent", () => {
  it("prompt / steer / follow_up / abort / compact 对得上方法", () => {
    expect(sdkEquivalent("prompt")).toBe("session.prompt");
    expect(sdkEquivalent("steer")).toBe("session.steer");
    expect(sdkEquivalent("follow_up")).toBe("session.followUp");
    expect(sdkEquivalent("abort")).toBe("session.abort");
    expect(sdkEquivalent("compact")).toBe("session.compact");
  });
  it("get_entries 走 SessionManager；get_state 是字段快照", () => {
    expect(sdkEquivalent("get_entries")).toBe("session.sessionManager.getEntries");
    expect(sdkEquivalent("get_state")).toBe("session fields");
  });
  it("subscribe 不是 RPC 命令", () => {
    expect(sdkEquivalent("subscribe")).toBeNull();
    expect(sdkEquivalent("")).toBeNull();
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
    `> **预计**：1 天 ｜ **前置**：Ch25（\`createAgentSession\`）、Ch27（四种运行模式）、Ch30（会话与 compaction）
> **目标**：给「我的程序要嵌一个 Agent」选对路——同进程 SDK、子进程 RPC、或只出事件的 json 流；能写出协议正确的最小 RPC 客户端（分帧、编码、对 id、读接受语义、答 select）。
> 你 15 年 Java：同进程调一个库， vs 用 ProcessBuilder 拉起子进程走 stdin/stdout。Python 就是 \`import\` vs \`subprocess\`。Pi 把这两条都做成了一等公民，外加一条「跑完就把事件倒出来」的 json 模式。
> 事实源：本机 \`@earendil-works/pi-coding-agent\` v0.85.1 的 \`docs/sdk.md\`、\`rpc.md\`、\`json.md\`。不 clone 仓库。

> 📐 **本教程的契约**：§31.1–§31.7 各对应一道作业。
> **不讲**：再走一遍 Agent 循环的事件嵌套（Ch28）、会话树怎么切（Ch30）。这里只讲「你的程序怎么接上那套循环」。

---`,
    [],
  ),
  sec(
    "sec-map",
    "🗺️ 本章地图",
    null,
    `本章主线：**商品后台要一个会查 KB-001 机械键盘和 MS-002 无线鼠标的 Agent，它跑在哪**。Node 服务可以同进程调用；Python 后台或 IDE 插件更适合拉起 \`pi --mode rpc\`；一条批处理脚本只要把事件流接进日志，用 \`pi --mode json\`。

读完这章 + 完成作业，你将能够：

- 按「同进程 / 进程隔离 / 跨语言 / 只出一轮事件」四选一（实际三条路）
- 按官方规则切 JSONL：只认 \`\\n\`，剥行尾 \`\\r\`，不把 U+2028 / U+2029 当换行
- 把带 id 的命令编成一行，并在混杂的事件流里按 id 找回 response
- 分清 \`success: true\` 是「已接受」，之后的失败走事件、不再发第二条 response
- 给 \`extension_ui_request\` 的 select 回一帧；notify 不回
- 把 prompt / steer / follow_up / abort / compact / get_state / get_entries 对到 SDK

**作业 ↔ 教程对应表**：

| 作业题 | 对应小节 | 核心知识点 |
|--------|----------|-----------|
| \`pickIntegration\` | §31.1 | 场景 → sdk / rpc / json |
| \`splitJsonl\` | §31.2 | LF-only 分帧 |
| \`encodeCommand\` | §31.3 | 命令对象 → 一行 JSONL |
| \`matchResponseTo\` | §31.4 | 按 id 找 response |
| \`promptAcceptSemantics\` | §31.5 | success true = 已接受 |
| \`answerUiRequest\` | §31.6 | select 的应答帧 |
| \`sdkEquivalent\` | §31.7 | RPC 命令 ↔ SDK（综合） |

本地：\`local/m6/ch31/\` 三件套，没有 \`app.ts\`。跑 \`bun test local/m6/ch31\`。

---`,
    [],
  ),
  sec(
    "sec-path",
    "⏱️ 学习路径：费曼五步（约 60–90 分钟）",
    null,
    `| 步 | 你要做 | 在哪做 |
|----|--------|--------|
| ① 预览猜（2 分钟） | 猜三条路、分帧、success 的含义 | 本页 ① |
| ② 先动手 | 打开 \`local/m6/ch31/assignment.ts\` 改 TODO | 仓库 local/ |
| ③ 提取+反馈 | \`bun test local/m6/ch31\` | 终端 |
| ④ 费曼（2 分钟） | 讲清「success true 为什么还不等于做完了」 | 本页 ④ |
| ⑤ 存闪卡 | 章末闪卡 | 闪卡 |

> 💡 无 Key。对照本机 \`docs/rpc.md\` 的 Framing 与 Extension UI。

---`,
    [],
  ),
  sec(
    "sec-guess",
    "① 预览猜（2 分钟 · 激活你的 Java / Python 直觉）",
    null,
    `先别看答案：

1. Node 服务想要类型和 \`subscribe\`，该 \`import\` SDK，还是 \`spawn\` 一个 \`pi --mode rpc\`？
2. 商品后台是 Python。RPC 和 json 模式哪个能中途 \`steer\`、\`abort\`？
3. 切 stdout 时用 Node 的 readline，行不行？
4. \`{"type":"response","command":"prompt","success":true}\` 之后，模型报错还会不会再来一条同 id 的 response？
5. 扩展弹出 select，客户端要回什么 type？notify 要不要回？

> 第 3、4 题是本章的 🔴。

---`,
    [],
  ),
  sec(
    "sec-world",
    "三条路：同进程、子进程、只出事件 🔴",
    null,
    `**为什么不是一种嵌入**：调用方的约束不一样。同进程要的是类型和一次函数调用；跨语言或「插件崩了别带走 IDE」要的是进程边界；批处理要的是「跑完把事件留下」，不需要一条活着的命令通道。Pi 没有用一个「万能客户端接口」盖住这三件事。

| 路 | 怎么启动 | 你得到什么 | 商品例子 |
|---|---|---|---|
| SDK | \`createAgentSession({ sessionManager: SessionManager.inMemory() })\` | 类型安全的 \`session.prompt\` / \`steer\` / \`subscribe\` | Node 下单服务，查完库存直接写自己的库 |
| RPC | \`pi --mode rpc\` | stdin 写命令，stdout 出 response + 事件，一行一个 JSON | Python 后台，或 IDE 插件要隔离崩溃 |
| json | \`pi --mode json "查 KB-001"\` | stdout 只有事件（首行仍是 session header v3），进程跑完退出 | 把一轮查库存的事件倒进日志 |

SDK 侧最小形状（作业不调用，认得出即可）：

\`\`\`ts
import { createAgentSession, SessionManager } from "@earendil-works/pi-coding-agent";

const { session } = await createAgentSession({
  sessionManager: SessionManager.inMemory(),
});
const unsubscribe = session.subscribe((event) => {
  // text_delta、tool 事件，和 Ch28 是同一套
});
await session.prompt("查 KB-001 机械键盘还有货吗");
unsubscribe();
\`\`\`

\`subscribe\` 返回取消函数。RPC 没有 subscribe 命令：事件直接写到 stdout。json 模式也没有 stdin 命令回路，所以做不了中途 steer。

官方对 Node 用户的建议写在 rpc.md 开头：同进程优先用 \`AgentSession\` / \`createAgentSession\`，不要为了 TypeScript 再套一层子进程。子进程留给别的语言，或留给你确实要隔离的时候。

\`\`\`mermaid
flowchart TB
    need["商品程序要嵌 Agent"] --> q1{"同进程且要类型?"}
    q1 -->|"是"| sdk["SDK<br/>createAgentSession<br/>inMemory + subscribe"]
    q1 -->|"否"| q2{"还要来回发命令?<br/>steer / abort / compact"}
    q2 -->|"要，或跨语言，或隔离崩溃"| rpc["RPC<br/>pi --mode rpc<br/>stdin 命令 / stdout JSONL"]
    q2 -->|"不要，跑完即走"| jsonMode["json<br/>pi --mode json<br/>只有事件流"]

    style need fill:#FFE082,stroke:#F9A825,color:#1f1f1f
    style q1 fill:#80DEEA,stroke:#0097A7,color:#1f1f1f
    style q2 fill:#80DEEA,stroke:#0097A7,color:#1f1f1f
    style sdk fill:#A5D6A7,stroke:#388E3C,color:#1f1f1f
    style rpc fill:#90CAF9,stroke:#1976D2,color:#1f1f1f
    style jsonMode fill:#FFCC80,stroke:#F57C00,color:#1f1f1f
\`\`\`

### ❌ / ✅

\`\`\`ts
// ❌ Node 服务为了「稳定」去 spawn RPC（官方建议同进程直接用 SDK）
// ❌ 用 json 模式还想中途 steer（没有命令通道）
// ❌ 把 RPC 的 stdout 当「只有 response」（事件和 response 混在同一条流里）
// ✅ 类型和同进程 → SDK；隔离或跨语言 → RPC；只收集一轮事件 → json
\`\`\`

---`,
    [],
  ),
  sec(
    "sec-31.1",
    "§31.1 选型（对应：`pickIntegration`）🟡",
    "31.1",
    `作业把上一节收成四个稳定代号，避免用自然语言猜：

| need | 返回 | 对应约束 |
|---|---|---|
| \`"in-process"\` | \`"sdk"\` | 同进程、要类型 |
| \`"isolate"\` | \`"rpc"\` | 子进程隔离 |
| \`"cross-language"\` | \`"rpc"\` | 任何能写 stdin/stdout 的语言 |
| \`"one-shot"\` | \`"json"\` | 没有命令回路 |
| 其它 | \`null\` | 例如 \`"tui"\` 是给人用的交互模式，不是嵌入方案 |

\`\`\`ts
function pickIntegration(need: string): Integration | null {
  if (need === "in-process") return "sdk";
  if (need === "isolate" || need === "cross-language") return "rpc";
  if (need === "one-shot") return "json";
  return null;
}
\`\`\`

### ❌ / ✅

\`\`\`ts
// ❌ 看到「进程」两个字就返回 rpc（in-process 是 SDK）
// ❌ 空串返回 json（不认识就是 null）
// ✅ 四个字面量，精确相等
\`\`\`

> ✅ **做 \`pickIntegration\`**。

---`,
    ["pickIntegration"],
  ),
  sec(
    "sec-31.2",
    "§31.2 分帧（对应：`splitJsonl`）🔴",
    "31.2",
    `**机制**：RPC 和 json 模式的 stdout 都是 JSONL，帧界只有 LF（U+000A）。这不是「按行读」的口语那么松。JSON 字符串里可以出现 Unicode 行分隔符 U+2028 和段落分隔符 U+2029。Node 的 \`readline\` 会把这两个也当成换行，于是一条合法 JSON 被切成两截，\`JSON.parse\` 失败。rpc.md 的 Framing 因此点名：readline **不合规**。客户端要自己切。

规则：

1. 只在字符码 10 处切开。
2. 切下来的片段如果以 \`\\r\` 结尾，删掉这一个字符。这样 \`\\r\\n\` 输入也能用。
3. 剥完是空串就丢掉。文件末尾的换行不会多出一个空帧；中间的空行也丢掉。
4. 最后一段如果没有换行，仍然是一条记录。

\`\`\`mermaid
flowchart LR
    raw["stdout 字节"] --> scan["只找 U+000A"]
    scan --> strip["片段以 CR 结尾就剥掉"]
    strip --> drop["空片段丢掉"]
    drop --> rec["一条 JSON 记录"]
    bad["readline 还会切 U+2028 / U+2029"] -.->|"不合规"| raw

    style raw fill:#FFE082,stroke:#F9A825,color:#1f1f1f
    style scan fill:#80DEEA,stroke:#0097A7,color:#1f1f1f
    style strip fill:#90CAF9,stroke:#1976D2,color:#1f1f1f
    style drop fill:#CE93D8,stroke:#7B1FA2,color:#1f1f1f
    style rec fill:#A5D6A7,stroke:#388E3C,color:#1f1f1f
    style bad fill:#EF9A9A,stroke:#C62828,color:#1f1f1f
\`\`\`

\`\`\`ts
function splitJsonl(input: string): string[] {
  const out: string[] = [];
  let start = 0;
  for (let i = 0; i <= input.length; i++) {
    if (i === input.length || input.charCodeAt(i) === 10) {
      let rec = input.slice(start, i);
      if (rec.endsWith("\\r")) rec = rec.slice(0, -1);
      if (rec !== "") out.push(rec);
      start = i + 1;
    }
  }
  return out;
}
\`\`\`

商品例子：一条 \`{"msg":"价格\\u2028护栏"}\` 里的 U+2028 留在记录内部，后面的 \`{"sku":"MS-002"}\` 才是下一帧。

### ❌ / ✅

\`\`\`ts
// ❌ input.split(/\\r?\\n|\\u2028|\\u2029/) （把官方点名的两个字符当帧界）
// ❌ 用 readline 包一层再 parse
// ❌ 保留空行当一条记录（parse 会炸）
// ✅ charCode === 10；行尾单个 CR 剥掉；空串丢弃
\`\`\`

> ✅ **做 \`splitJsonl\`**。

---`,
    ["splitJsonl"],
  ),
  sec(
    "sec-31.3",
    "§31.3 写出一行命令（对应：`encodeCommand`）🟡",
    "31.3",
    `stdin 上每条命令是一个 JSON 对象加一个 LF。作业收的字段：

- \`type\`、\`id\` 必写。\`id\` 是你自己起的，response 会原样带回。
- \`message\`：prompt / steer / follow_up 的正文。没有就不要出现这个键。
- \`streamingBehavior\`：Agent 已经在流式输出时，再发 prompt 必须带 \`"steer"\` 或 \`"followUp"\`，否则这条命令 \`success: false\`。这两个词就是 Ch28 的两条缝：steer 在本轮工具跑完、下次模型调用之前；followUp 在 Agent 停下之后。
- \`customInstructions\`：\`compact\` 的可选说明。

键序固定为 type、id、message、streamingBehavior、customInstructions，方便测试用整行字符串比对。行尾是 \`\\n\` 不是 \`\\r\\n\`。

\`\`\`ts
function encodeCommand(cmd: RpcCommand): string {
  const obj: Record<string, string> = { type: cmd.type, id: cmd.id };
  if (cmd.message !== undefined) obj.message = cmd.message;
  if (cmd.streamingBehavior !== undefined) obj.streamingBehavior = cmd.streamingBehavior;
  if (cmd.customInstructions !== undefined) obj.customInstructions = cmd.customInstructions;
  return JSON.stringify(obj) + "\\n";
}
\`\`\`

查键盘：\`{"type":"prompt","id":"req-1","message":"查 KB-001 机械键盘"}\\n\`。已经在答、用户改口问无线鼠标：同一形状多一个 \`"streamingBehavior":"steer"\`。

### ❌ / ✅

\`\`\`ts
// ❌ 用 \\r\\n 结尾（帧界只认 LF，CR 会被对方剥掉，但我们写出的行不要带）
// ❌ 把 undefined 的 message 写成 null 放进 JSON
// ❌ 不写 id（后来对不上 response）
// ✅ 只放有值的键；stringify 后加一个 \\n
\`\`\`

> ✅ **做 \`encodeCommand\`**。

---`,
    ["encodeCommand"],
  ),
  sec(
    "sec-31.4",
    "§31.4 按 id 找回响应（对应：`matchResponseTo`）🔴",
    "31.4",
    `**机制**：stdout 是一条河，不是请求-响应的函数返回。你写下 \`prompt\` 之后，先等到一条 \`type: "response"\`，它的 \`id\` 等于你发的 id，\`command\` 是 \`"prompt"\`。与此同时、以及在这之后，同一条流里还有 \`agent_start\`、\`message_update\`、工具事件。\`bash\` 命令的 \`bash_execution_update\` 甚至会带上同一个 id——那仍是事件，不是 response。

所以匹配条件是两个：\`type === "response"\` 且 \`id\` 相等。按到达顺序取第一条。没有就 \`null\`。不要改输入数组。

\`\`\`mermaid
flowchart LR
    stdin["stdin<br/>prompt id req-1"] --> proc["pi --mode rpc"]
    proc --> upd["bash_execution_update<br/>id req-1"]
    proc --> resp["response<br/>id req-1 success true"]
    proc --> ev["agent_start<br/>没有 id"]
    upd --> skip["不是 response"]
    resp --> hit["matchResponseTo 命中"]

    style stdin fill:#FFE082,stroke:#F9A825,color:#1f1f1f
    style proc fill:#80DEEA,stroke:#0097A7,color:#1f1f1f
    style upd fill:#EF9A9A,stroke:#C62828,color:#1f1f1f
    style resp fill:#A5D6A7,stroke:#388E3C,color:#1f1f1f
    style ev fill:#CE93D8,stroke:#7B1FA2,color:#1f1f1f
    style skip fill:#FFCC80,stroke:#F57C00,color:#1f1f1f
    style hit fill:#90CAF9,stroke:#1976D2,color:#1f1f1f
\`\`\`

\`\`\`ts
function matchResponseTo(frames: RpcFrame[], id: string): RpcFrame | null {
  for (const frame of frames) {
    if (frame.type === "response" && frame.id === id) return frame;
  }
  return null;
}
\`\`\`

### ❌ / ✅

\`\`\`ts
// ❌ 只比 id，把 bash_execution_update 当成响应
// ❌ 用 command === "prompt" 当唯一条件（get_state 的 response 也要能按 id 找到）
// ❌ 找不到时返回空对象
// ✅ type 与 id 同时成立，否则 null
\`\`\`

> ✅ **做 \`matchResponseTo\`**。数组会被冻结。

---`,
    ["matchResponseTo"],
  ),
  sec(
    "sec-31.5",
    "§31.5 success true 是已接受（对应：`promptAcceptSemantics`）🔴",
    "31.5",
    `**机制**：RPC 的 response 在命令被**接受**时就写出，不等模型说完。\`success: true\` 的意思是：已经接手、已经排队、或已经当场处理（例如一条扩展命令）。\`success: false\` 是**接手之前**就拒绝了，比如 Agent 正在输出，而你的 prompt 没带 \`streamingBehavior\`。

接手之后的失败——模型报错、工具失败、用户 abort——走普通事件（\`message_end\`、\`tool_execution_end\`、\`agent_end\` 等），**不会**再为同一个 id 发第二条 response。SDK 里同一时刻是 \`preflightResult(true/false)\`：\`prompt()\` 这个 Promise 仍要等整轮跑完才 resolve，和 RPC「response 先返回、事件继续流」不是同一个等待点。别用 Java 的同步 RPC 直觉去等「返回值 = 最终结果」。

作业把一帧读成：

| 帧 | 返回 |
|---|---|
| response + command prompt + success true | \`"accepted"\` |
| response + command prompt + success false | \`"rejected"\` |
| agent_end / message_end / turn_end / tool_execution_end / message_update | \`"stream"\` |
| 其它（compact 的 response、extension_ui_request、agent_start） | \`null\` |

\`\`\`mermaid
flowchart LR
    cmd["prompt 命令"] --> resp{"response.success"}
    resp -->|"true"| acc["accepted<br/>事件继续流"]
    resp -->|"false"| rej["rejected<br/>还没接手"]
    acc --> later["之后的失败"]
    later --> stream["agent_end 等事件<br/>没有第二条 response"]

    style cmd fill:#FFE082,stroke:#F9A825,color:#1f1f1f
    style resp fill:#80DEEA,stroke:#0097A7,color:#1f1f1f
    style acc fill:#A5D6A7,stroke:#388E3C,color:#1f1f1f
    style rej fill:#EF9A9A,stroke:#C62828,color:#1f1f1f
    style later fill:#FFCC80,stroke:#F57C00,color:#1f1f1f
    style stream fill:#90CAF9,stroke:#1976D2,color:#1f1f1f
\`\`\`

\`\`\`ts
const STREAM = new Set(["agent_end", "message_end", "turn_end", "tool_execution_end", "message_update"]);

function promptAcceptSemantics(frame: RpcFrame): PromptReading | null {
  if (frame.type === "response" && frame.command === "prompt") {
    if (frame.success === true) return "accepted";
    if (frame.success === false) return "rejected";
    return null;
  }
  if (STREAM.has(frame.type)) return "stream";
  return null;
}
\`\`\`

### ❌ / ✅

\`\`\`ts
// ❌ 把 success true 理解成「无线鼠标已经查完」
// ❌ 失败时再发一次 prompt 等同 id 去要第二条 response（协议没有这条）
// ❌ 把 compact 的 success true 也标成 accepted（那不是 prompt 的接受语义）
// ✅ prompt 的 response 看 success；五种事件标 stream；其余 null
\`\`\`

> ✅ **做 \`promptAcceptSemantics\`**。

---`,
    ["promptAcceptSemantics"],
  ),
  sec(
    "sec-31.6",
    "§31.6 回答 select（对应：`answerUiRequest`）🟡",
    "31.6",
    `扩展在 RPC 里调用 \`ctx.ui.select\` / \`confirm\` / \`input\` / \`editor\` 时，pi 往 stdout 打 \`extension_ui_request\`，并**堵住**等 stdin 上同 id 的 \`extension_ui_response\`。\`notify\`、\`setStatus\` 这类是 fire-and-forget：有请求帧，不期待应答。

select 的请求长这样：\`type\`、\`id\`、\`method: "select"\`、\`title\`、\`options\`。应答两种：

- 用户选了选项里的一项：\`{ "type": "extension_ui_response", "id": "uuid-1", "value": "Allow" }\`
- 用户取消：\`{ "type": "extension_ui_response", "id": "uuid-1", "cancelled": true }\`

本题只做 select。method 不是 select、type 不是 \`extension_ui_request\`、或者 choice 不在 \`options\` 里，都返回 \`null\`。choice 为 \`null\` 表示取消。两个成功对象的键不要混：有 value 就不要带 cancelled，取消就不要带 value。

\`\`\`mermaid
flowchart LR
    ext["扩展 ctx.ui.select<br/>Allow 或 Block"] --> req["stdout<br/>extension_ui_request"]
    req --> client["商品客户端"]
    client -->|"选 Allow"| val["extension_ui_response<br/>value Allow"]
    client -->|"取消"| can["extension_ui_response<br/>cancelled true"]
    note["notify"] --> noResp["不回帧"]

    style ext fill:#FFE082,stroke:#F9A825,color:#1f1f1f
    style req fill:#80DEEA,stroke:#0097A7,color:#1f1f1f
    style client fill:#90CAF9,stroke:#1976D2,color:#1f1f1f
    style val fill:#A5D6A7,stroke:#388E3C,color:#1f1f1f
    style can fill:#FFCC80,stroke:#F57C00,color:#1f1f1f
    style note fill:#CE93D8,stroke:#7B1FA2,color:#1f1f1f
    style noResp fill:#EF9A9A,stroke:#C62828,color:#1f1f1f
\`\`\`

\`\`\`ts
function answerUiRequest(request: UiRequest, choice: string | null): UiResponse | null {
  if (request.type !== "extension_ui_request" || request.method !== "select") return null;
  if (choice === null) return { type: "extension_ui_response", id: request.id, cancelled: true };
  if (!(request.options ?? []).includes(choice)) return null;
  return { type: "extension_ui_response", id: request.id, value: choice };
}
\`\`\`

RPC 里 \`ctx.mode\` 是 \`"rpc"\`，\`ctx.hasUI\` 仍是 true，因为这套子协议把对话框接上了。真正的终端控件（\`custom()\` 等）在 RPC 里不可用，那是 Ch27 的模式差异，这里不考。

### ❌ / ✅

\`\`\`ts
// ❌ 给 notify 也回一帧（对方不读，还可能把别的命令弄乱）
// ❌ value 和 cancelled 同时带上
// ❌ 选项列表之外的字符串也当成选中
// ✅ 只服务 select；取消与选中是两种形状
\`\`\`

> ✅ **做 \`answerUiRequest\`**。options 数组会被冻结。

---`,
    ["answerUiRequest"],
  ),
  sec(
    "sec-31.7",
    "§31.7 命令对得上哪个方法（对应：`sdkEquivalent`）🟢",
    "31.7",
    `同一套 Agent，RPC 是字符串命令，SDK 是方法。对照来自 \`rpc-mode.js\` 的分支和 \`AgentSession\` 的方法表：

| RPC type | SDK |
|---|---|
| prompt | \`session.prompt\` |
| steer | \`session.steer\` |
| follow_up | \`session.followUp\`（驼峰，不是 follow_up） |
| abort | \`session.abort\` |
| compact | \`session.compact\` |
| get_entries | \`session.sessionManager.getEntries\` |
| get_state | \`session fields\` |

\`get_state\` 没有同名方法。处理器当场读 session 上的 model、thinkingLevel、isStreaming、isCompacting、steeringMode、followUpMode、sessionFile、sessionId、sessionName、autoCompactionEnabled，以及 \`messages.length\` 和 pending 计数。作业用固定字符串 \`"session fields"\` 代表这次快照，免得你去拼一个不存在的 \`session.getState()\`。

\`subscribe\` 只存在于 SDK。RPC 把事件写进 stdout，所以 \`sdkEquivalent("subscribe")\` 是 \`null\`。你在 §31.1 选了 SDK，才有这个函数；选了 RPC，就用 §31.2–§31.5 把流读完。

\`\`\`ts
function sdkEquivalent(command: string): string | null {
  switch (command) {
    case "prompt": return "session.prompt";
    case "steer": return "session.steer";
    case "follow_up": return "session.followUp";
    case "abort": return "session.abort";
    case "compact": return "session.compact";
    case "get_entries": return "session.sessionManager.getEntries";
    case "get_state": return "session fields";
    default: return null;
  }
}
\`\`\`

\`\`\`mermaid
flowchart LR
    rpcCmd["RPC prompt / steer / compact"] --> sdkCall["session.prompt<br/>session.steer<br/>session.compact"]
    entries["RPC get_entries"] --> mgr["session.sessionManager.getEntries"]
    state["RPC get_state"] --> fields["读 session 字段快照"]
    sub["session.subscribe"] --> onlySdk["只在 SDK<br/>RPC 无此命令"]

    style rpcCmd fill:#90CAF9,stroke:#1976D2,color:#1f1f1f
    style sdkCall fill:#A5D6A7,stroke:#388E3C,color:#1f1f1f
    style entries fill:#90CAF9,stroke:#1976D2,color:#1f1f1f
    style mgr fill:#A5D6A7,stroke:#388E3C,color:#1f1f1f
    style state fill:#FFE082,stroke:#F9A825,color:#1f1f1f
    style fields fill:#FFCC80,stroke:#F57C00,color:#1f1f1f
    style sub fill:#CE93D8,stroke:#7B1FA2,color:#1f1f1f
    style onlySdk fill:#EF9A9A,stroke:#C62828,color:#1f1f1f
\`\`\`

### ❌ / ✅

\`\`\`ts
// ❌ follow_up 映射成 session.follow_up（方法名是 followUp）
// ❌ get_state 映射成 session.getState（v0.85.1 没有这个方法）
// ❌ subscribe 映射成某条 RPC 命令（方向反了：它不是命令）
// ✅ 七个字面量；其余 null
\`\`\`

> ✅ **做 \`sdkEquivalent\`**。这是全章的对照表。

---`,
    ["sdkEquivalent"],
  ),
  sec(
    "sec-pits",
    "⚠️ Java / Python 老手几个坑",
    null,
    `1. **同进程还去拉子进程。** Node 里官方建议直接 \`createAgentSession\`。ProcessBuilder / subprocess 留给别的语言和隔离需求。
2. **json 模式当成长连接。** 它跑完就退出，没有 steer / abort 的 stdin。
3. **用 readline 切 RPC。** U+2028 和 U+2029 会把一条 JSON 切碎。只认 LF，再剥行尾 CR。
4. **success true 当成业务成功。** 它只表示命令被接受。查无线鼠标失败发生在后面的事件里，没有第二条 response。
5. **把 bash_execution_update 当成 response。** 它可能带着同一个 id，但 type 不是 response。
6. **流式期间裸发 prompt。** 必须带 streamingBehavior，否则 success false。
7. **给 notify 回 extension_ui_response。** 只有 select / confirm / input / editor 在等。本题只写 select。
8. **follow_up 的 SDK 名字写成 follow_up。** 方法是 \`session.followUp\`。
9. **发明 session.getState()。** get_state 是读一串字段。get_entries 才是 \`session.sessionManager.getEntries\`。
10. **忘记 inMemory。** 嵌入测试不想落 \`~/.pi/agent/sessions\` 时，把 \`SessionManager.inMemory()\` 传进去。这是 Ch25 的结论，这里仍是 SDK 的默认嵌入姿势。

---`,
    [],
  ),
  sec(
    "sec-homework",
    "📝 本章作业",
    null,
    `打开 \`local/m6/ch31/assignment.ts\`，替换 TODO，然后：

\`\`\`bash
bun test local/m6/ch31
\`\`\`

没有 \`app.ts\`。\`demo.ts\` 里是 SDK 启动片段和一条 RPC 帧，测试不要 import 它。

卡住就回：\`pickIntegration\` → §31.1，\`splitJsonl\` → §31.2（字符码 10），\`encodeCommand\` → §31.3（键序和 LF），\`matchResponseTo\` → §31.4，\`promptAcceptSemantics\` → §31.5，\`answerUiRequest\` → §31.6，\`sdkEquivalent\` → §31.7（\`"session fields"\` 这一个字符串）。

---`,
    [],
  ),
  sec(
    "sec-check",
    "✅ 自测：你真的掌握了吗？",
    null,
    `- [ ] 能按同进程、隔离、跨语言、只出事件选出 sdk / rpc / json
- [ ] 能说明 readline 为什么不合规，并手写只按 LF 切、剥 CR 的分帧
- [ ] 能写出带 id 的 prompt 行，以及正在输出时必须带的 streamingBehavior
- [ ] 能从混着 update 和 agent 事件的数组里按 id 抽出 response
- [ ] 能讲清 success true 与之后的 agent_end 各代表什么，以及为什么没有第二条 response
- [ ] 能写出 select 的 value 帧和 cancelled 帧，并拒绝 notify
- [ ] 能背出 follow_up → session.followUp、get_entries → sessionManager、get_state 没有同名方法
- [ ] \`bun test local/m6/ch31\` 全绿；没有 import 真包、没有装依赖、没有 clone

---`,
    [],
  ),
  sec(
    "sec-feynman",
    "🎓 费曼挑战",
    null,
    `讲给写过后端的同事听。

1. 「商品服务是 Python，为什么不直接 import Pi 的 TypeScript SDK？你选哪条路，帧怎么切？」— 卡壳重读地图和 §31.2。
2. 「response 的 success true 之后，用户还要等多久才知道查库存失败了？失败从哪条通道来？」— 卡壳重读 §31.5。
3. 「同一句 prompt，SDK 里是哪个方法，RPC 里是哪一行 JSON？get_state 为什么对不上一个方法名？」— 卡壳重读 §31.7。

---`,
    [],
  ),
  sec(
    "sec-next",
    "⏭️ 课程完结",
    null,
    `Ch31 是 M6 的最后一章，也是这门课的收官。你现在有一张从类型、到 Web、到「用 Pi 做 Agent」、再到「读 Pi 本身」的路径：仓库四包与四种模式（Ch27）、循环怎么转（Ch28）、扩展四件套（Ch29）、会话树和 compaction（Ch30）、以及今天这条嵌入选型。

接下来不必再等新章。打开本机安装包的 \`docs/\` 和 \`examples/\`，用这五章的地图往下读即可。仍不要为了学习去 clone 一份 Pi 仓库当教材。`,
    [],
  ),
];

const tutorialMd = `# Ch31 · SDK 嵌入 vs RPC

${sections.map((s) => (s.heading ? `## ${s.heading}\n\n${s.body}` : s.body)).join("\n\n")}
`;

const reviewMd = `# Ch31 · 记忆闪卡

> 先回忆，再翻答案。连续 2 次秒答 → 退役。

## 🔖 闪卡

| # | 正面（问题） | 背面（答案） | 掌握 |
|---|---|---|---|
| 1 | 同进程 TypeScript、跨语言、只倒一轮事件，各走哪条路？ | 同进程 SDK（createAgentSession + inMemory + subscribe）。跨语言或要隔离用 RPC（pi --mode rpc）。只出事件用 json（pi --mode json），没有命令回路。 | ⬜ |
| 2 | RPC 分帧的规则？readline 为什么不行？ | 只按 LF 切，行尾 CR 剥掉。U+2028 和 U+2029 留在 JSON 里。readline 会把这两个当换行，官方点名不合规。 | ⬜ |
| 3 | 正在流式输出时再 prompt，要带什么？ | streamingBehavior 为 steer 或 followUp。不带则 success false，命令在接受前被拒绝。 | ⬜ |
| 4 | success true 表示什么？失败之后还有第二条 response 吗？ | 表示已接受、已排队或已当场处理，不是模型答完。之后的失败走事件流，同一个 id 不会再有第二条 response。 | ⬜ |
| 5 | 怎么从 stdout 里找回某条命令的响应？ | type === "response" 且 id 相等。同 id 的 bash_execution_update 不是响应。 | ⬜ |
| 6 | select 怎么答？notify 呢？ | select 回 extension_ui_response，带 value 或 cancelled true，id 原样。notify 是 fire-and-forget，不回。 | ⬜ |
| 7 | follow_up、get_entries、get_state 在 SDK 里是什么？ | session.followUp；session.sessionManager.getEntries；get_state 没有同名方法，是读 session 字段快照。subscribe 只在 SDK。 | ⬜ |

## 🎓 费曼自检

- [ ] 能用 ProcessBuilder / subprocess 讲清何时不要用 SDK
- [ ] 能讲清分帧和 success true 这两件最容易写错的协议细节
- [ ] 能把七个 RPC 命令对到 SDK，包括 get_state 的例外
`;

const chapter = {
  id: "ch31",
  num: "31",
  title: "SDK 嵌入 vs RPC",
  runMode: "local" as const,
  tutorialMd,
  assignment,
  testName: "ch31_assignment",
  testSource,
  reviewMd,
  interleaved: true,
  sections,
  functions,
  preamble,
  localHint: "bun test local/m6/ch31",
};

const root = dirname(fileURLToPath(import.meta.url));
const out = join(root, "../src/content/chapters/ch31.json");
mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, JSON.stringify(chapter, null, 2) + "\n");
console.log("wrote", out);

const localDir = join(root, "../local/m6/ch31");
mkdirSync(localDir, { recursive: true });

const localAssignment = `/**
 * Ch31 作业：SDK 嵌入 vs RPC（纯函数）。
 *
 * 场景：商品后台要嵌一个 Agent。打开本文件改 TODO，然后：
 * bun test local/m6/ch31
 *
 * 不要 import 真 Pi 包 / 不要 clone 仓库 / 不装新依赖。
 */

${preamble}

${functions.map((f) => f.skeleton).join("\n\n")}
`;

const localTest = `import { describe, expect, test } from "bun:test";
import {
  answerUiRequest,
  encodeCommand,
  matchResponseTo,
  pickIntegration,
  promptAcceptSemantics,
  sdkEquivalent,
  splitJsonl,
} from "./assignment";

${testSource.replace(/\bit\(/g, "test(")}`;

const demoSource = `/**
 * Ch31 · SDK 嵌入 vs RPC 复制区（M6 收官）。
 *
 * 本文件只给阅读 / 复制。测试禁止 import 本文件。
 * 全部真代码都在字符串里，if (false) 守护，不执行、不打网、不需要 Key。
 *
 * 事实源：本机安装包 docs/sdk.md · rpc.md · json.md（pi v0.85.1）。
 * 不要 clone 仓库；不要在课程仓库装 @earendil-works/*。
 */

const READ_THE_DOCS = \`
ROOT="$(npm root -g)/@earendil-works/pi-coding-agent"
sed -n '1,40p' "$ROOT/docs/sdk.md"
sed -n '20,80p' "$ROOT/docs/rpc.md"
sed -n '1,20p' "$ROOT/docs/json.md"
\`;

const SDK_EMBED = \`
import { createAgentSession, SessionManager } from "@earendil-works/pi-coding-agent";

const { session } = await createAgentSession({
  sessionManager: SessionManager.inMemory(),
});
session.subscribe((event) => {
  if (event.type === "message_update") {
    // 商品助手的文本增量
  }
});
await session.prompt("查 KB-001 机械键盘还有货吗");
await session.steer("改报 MS-002 无线鼠标");
\`;

const RPC_FRAMES = \`
# 启动：pi --mode rpc --no-session
# stdin 一行一个 JSON，只以 LF 结尾。不要用 readline（它会切开 U+2028 / U+2029）。
{"id":"req-1","type":"prompt","message":"查 KB-001 机械键盘"}
{"id":"req-1","type":"response","command":"prompt","success":true}
{"type":"agent_end"}
# success true 只表示已接受。之后的失败在事件里，没有第二条 response。
{"type":"extension_ui_request","id":"uuid-1","method":"select","title":"允许改价?","options":["Allow","Block"]}
{"type":"extension_ui_response","id":"uuid-1","value":"Allow"}
\`;

if (false) {
  console.log(READ_THE_DOCS);
  console.log(SDK_EMBED);
  console.log(RPC_FRAMES);
}
`;

writeFileSync(join(localDir, "assignment.ts"), localAssignment);
writeFileSync(join(localDir, "assignment.test.ts"), localTest);
writeFileSync(join(localDir, "demo.ts"), demoSource);
console.log("wrote", localDir);
