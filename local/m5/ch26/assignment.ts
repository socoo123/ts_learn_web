/**
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

/**
 * 【场景】服务端要把一条 Pi 事件推给课程站 Chat UI。机械键盘第一个字是「机」。
 *
 * 【转换点】沿用 Ch21：`data: ${payload}\n\n`（冒号后有空格）。
 * type === "agent_end" → payload 固定 "[DONE]"（不是 JSON）。
 * 其它事件 → JSON.stringify(event) 原样当 payload。不要 mutate。
 *
 * 任务：返回完整一帧（含结尾空行）。
 * 示例：
 *   { type:"text_delta", delta:"机" } → 'data: {"type":"text_delta","delta":"机"}\n\n'
 *   { type:"agent_end" } → "data: [DONE]\n\n"
 *   { type:"aborted" } → 'data: {"type":"aborted"}\n\n'（不要变成 [DONE]）
 *   lookupProduct 的 tool_call 也走 JSON.stringify
 *
 * 提示：先判断 agent_end，再 JSON.stringify。测试会 freeze 事件。
 */
export function piEventToSse(event: PiEvent): string {
  throw new Error("TODO");
}

/**
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
}

/**
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
}

/**
 * 【场景】Chat 列表要把工具行画成一行字。沿用 Ch24 UiRow。
 *
 * 【转换点】按 status 拼中文标签。text 为空时不要多一个空格。
 *
 * 格式：
 *   call     → `[tool:${name}] 调用中`
 *   ok       → text 空：`[tool:${name}] 成功`；否则 `[tool:${name}] 成功 ${text}`
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
}

/**
 * 【场景】助手气泡的纯文本视图。课程站 Chat 心智：UI = f(state)。
 *
 * 【转换点】固定前缀「助手：」。不要 trim。空字符串也要前缀。
 *
 * 任务：返回 `助手：${text}`
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
}

/**
 * 【场景】流有没有说完？Ch21 约定最后一帧 data 是 [DONE]。
 *
 * 【转换点】[DONE] → true。JSON `{"type":"agent_end"}` 也 true（有人忘了转 [DONE]）。
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
}
