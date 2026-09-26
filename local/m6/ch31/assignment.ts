/**
 * Ch31 作业：SDK 嵌入 vs RPC（纯函数）。
 *
 * 场景：商品后台要嵌一个 Agent。打开本文件改 TODO，然后：
 * bun test local/m6/ch31
 *
 * 不要 import 真 Pi 包 / 不要 clone 仓库 / 不装新依赖。
 */

/**
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


/**
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
}

/**
 * 【场景】Python 商品服务读 pi --mode rpc 的 stdout。帧界必须和官方一致，否则一条 JSON 会被切成两半。
 *
 * 【转换点】LF-only 分帧 🔴（rpc.md Framing）：
 *   只按 \n（U+000A）切开。
 *   每条记录若以 \r 结尾，剥掉这一个 \r（接受 \r\n）。
 *   U+2028、U+2029 是 JSON 字符串里的合法字符，不是帧界。Node readline 会把它们当换行，官方点名不合规。
 *   剥完是空串的记录丢掉（末尾多一个 \n 不产生空帧）。
 *   最后一行没有 \n 也算一条记录。
 *
 * 任务：返回记录字符串数组。
 * 示例：
 *   "{\"a\":1}\r\n{\"b\":2}\n" → ['{"a":1}', '{"b":2}']
 *   一条记录内部含 U+2028，后面再跟 \n 和第二条 → 仍然是 2 条，U+2028 留在第一条里
 *   "" → []
 *
 * 提示：用 charCode 10 找 \n，不要用 split(/\n|\u2028/)。空串过滤放在剥 \r 之后。
 */
export function splitJsonl(input: string): string[] {
  throw new Error("TODO");
}

/**
 * 【场景】往 RPC 的 stdin 写一行：让商品助手去查键盘，或者在它已经在跑时改口。
 *
 * 【转换点】命令是一行 JSON，以 \n 结尾 🟡。键的顺序固定，缺的可选键不要写进去：
 *   必有 type、id（id 用来和稍后的 response 对上）。
 *   有 message 才写 message。
 *   有 streamingBehavior 才写（"steer" 或 "followUp"：Agent 正在流式输出时，prompt 必须带它，否则命令被拒绝）。
 *   有 customInstructions 才写（compact 用）。
 *   行尾只有 \n，不要 \r\n。
 *
 * 任务：返回那一行，含末尾换行。
 * 示例：
 *   { type:"prompt", id:"req-1", message:"查 KB-001 机械键盘" }
 *     → '{"type":"prompt","id":"req-1","message":"查 KB-001 机械键盘"}\n'
 *   再加 streamingBehavior:"steer" → 键序 type, id, message, streamingBehavior
 *   { type:"compact", id:"req-3", customInstructions:"聚焦库存数字" }
 *     → 没有 message 键
 *
 * 提示：按这个顺序组对象再 JSON.stringify，最后加 "\n"。
 */
export function encodeCommand(cmd: RpcCommand): string {
  throw new Error("TODO");
}

/**
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
}

/**
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
}

/**
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
}

/**
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
}
