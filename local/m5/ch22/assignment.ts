/**
 * Ch22 作业：商品助手把模型流收成可测的纯函数。
 *
 * 场景：用户问「机械键盘还有货吗」，假事件数组依次吐
 * start → text_delta → done（带 usage）。
 * 你抽出增量、用量、结束原因，再拼成助手全文和 SSE。
 *
 * 没有供应商 Key 也能全绿：测的是事件数组，不是真模型。
 * 打开本文件改 TODO，然后：bun test local/m5/ch22
 */

type PiUsage = { input: number; output: number };

type PiEvent =
  | { type: "start" }
  | { type: "text_delta"; delta: string }
  | { type: "done"; reason: "stop" | "length" | "toolUse"; usage?: PiUsage }
  | { type: "error"; reason: "error" | "aborted" };

/**
 * 【场景】商品助手气泡要按到达顺序显示 token。用户问机械键盘库存，
 * 流里先「机」再「械键盘」。start / done / error 不是字，忽略。
 *
 * 【转换点】判别联合：`type === "text_delta"` 之后才有 `delta`。
 * Java 老手别写成一堆 instanceof；看 `type` 字段收窄即可。
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
}

/**
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
}

/**
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
}

/**
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
}

/**
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
}

/**
 * 【场景】以后要把这股流接到网页（Ch11/Ch21 的 SSE）。现在先把假事件编成 data 帧。
 *
 * 【转换点】每个 text_delta 追加 `data: ${delta}\n\n`（冒号后面有空格）。
 * 结束帧看 stopReason：
 *   "error" | "aborted" → 末尾再追加 data: [ERROR]\n\n 一次
 *   "stop" | "length" | "toolUse" → 末尾 data: [DONE]\n\n 一次
 *   仍在流（stopReason 为 null）→ 不要结束帧
 * 空数组 → ""。
 *
 * 任务：返回整段 SSE 字符串。
 * 示例：
 *   仍在流 deltas "机","械" → "data: 机\n\ndata: 械\n\n"
 *   上面再加 done/stop → 再多一段 data: [DONE]\n\n
 *   只有 error/aborted、无 done → 增量 + data: [ERROR]\n\n
 *   [] → ""
 *
 * 提示：增量可复用 collectTextDeltas；结束帧调用 stopReason。不要 mutate。
 */
export function toSseFromPiDeltas(events: PiEvent[]): string {
  throw new Error("TODO");
}
