/**
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
