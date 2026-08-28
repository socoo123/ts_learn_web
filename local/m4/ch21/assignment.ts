/**
 * Ch21 作业：商品助手的 SSE 帧（纯函数）。
 *
 * 场景：服务端把 token 写成 data: 行，用空行结束一帧。
 * Ch11 的 joinSsePayloads 是客户端解析；本章是服务端写出同一份帧。
 * 真路由在仓库 local/m4/ch21/app.ts；本题禁止 import。
 *
 * 打开本文件改 TODO，然后：bun test local/m4/ch21
 */

/**
 * 【场景】商品助手要把一个 token 写成 SSE 帧。机械键盘的第一个字是「机」。
 *
 * 【转换点】SSE 一帧：可选 event: 行 + 必有 data: 行 + 空行（\n\n）结束。
 * 冒号后面有一个空格：`data: ${data}`。不要 trim data。
 * eventName === undefined → 只有 data 行；传了（包括 ""）→ 先 event 再 data。
 *
 * 任务：拼出完整一帧（含结尾空行）。
 * 示例：
 *   formatSseEvent("机") → "data: 机\n\n"
 *   formatSseEvent("tok", "delta") → "event: delta\ndata: tok\n\n"
 *   formatSseEvent("") → "data: \n\n"
 *   formatSseEvent("hello world") → "data: hello world\n\n"
 *
 * 提示：用 === undefined 区分「没传 event」和「传了空串」。
 */
export function formatSseEvent(data: string, eventName?: string): string {
  throw new Error("TODO");
}

/**
 * 【场景】代理或网关会掐空闲连接。隔几秒发一行注释当 keep-alive。
 *
 * 【转换点】SSE 注释行以冒号开头：`: ${text}\n\n`（冒号、空格、正文、空行）。
 * 浏览器 / EventSource 会丢掉注释，不当成 token。
 *
 * 任务：返回注释帧。
 * 示例：
 *   formatSseComment("keep-alive") → ": keep-alive\n\n"
 *   formatSseComment("ping") → ": ping\n\n"
 *   formatSseComment("") → ": \n\n"
 *
 * 提示：不要写成 data: 行。空 text 仍保留冒号后的空格。
 */
export function formatSseComment(text: string): string {
  throw new Error("TODO");
}

/**
 * 【场景】TCP 不会按帧切开。缓冲区里可能是半帧，也可能一次来两帧。
 *
 * 【转换点】按 "\n\n" split。完整段（除最后一段）是 frames；最后一段是 rest（可能不完整）。
 * 跳过空的完整帧（开头的 \n\n）。不要 trim 帧内容。
 *
 * 任务：返回 { frames, rest }。
 * 示例：
 *   "data: a\n\ndata: b\n\n" → { frames: ["data: a", "data: b"], rest: "" }
 *   "data: a\n\ndata: b" → { frames: ["data: a"], rest: "data: b" }
 *   "" → { frames: [], rest: "" }
 *   "data: 机" → { frames: [], rest: "data: 机" }
 *   "\n\ndata: x\n\n" → { frames: ["data: x"], rest: "" }
 *
 * 提示：split 后 pop 最后一段当 rest；其余 filter 掉 ""。
 */
export function splitSse(buffer: string): { frames: string[]; rest: string } {
  throw new Error("TODO");
}

/**
 * 【场景】模型吐出一个 token「机」，要立刻推给课程站 Chat UI。
 *
 * 【转换点】必须调用 formatSseEvent(token)，不要自己再拼 data: 行，也不要加 event 名。
 *
 * 任务：把 token 编成默认 data 帧。
 * 示例：
 *   encodeTokenDelta("机") → "data: 机\n\n"
 *   encodeTokenDelta("hello world") → "data: hello world\n\n"
 *   encodeTokenDelta("") → "data: \n\n"
 *
 * 提示：return formatSseEvent(token);
 */
export function encodeTokenDelta(token: string): string {
  throw new Error("TODO");
}

/**
 * 【场景】token 推完了，客户端要知道可以停。OpenAI 风格约定最后一帧 data 是 [DONE]。
 *
 * 【转换点】必须调用 formatSseEvent("[DONE]")。这是正文约定，不是 HTTP 状态码，也不是连接关闭魔法。
 *
 * 任务：返回结束帧。
 * 示例：
 *   endStream() → "data: [DONE]\n\n"
 *
 * 提示：return formatSseEvent("[DONE]"); 不要加 event 名。
 */
export function endStream(): string {
  throw new Error("TODO");
}

/**
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
}
