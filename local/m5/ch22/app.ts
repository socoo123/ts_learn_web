/**
 * Ch22 本地假流：商品助手回答「机械键盘还有货吗」。
 * 不联网、不起端口、不 import 真模型包。
 *
 * bun test 会 for-await 本 generator，再把事件交给 assignment.ts 的纯函数。
 */

export type PiUsage = { input: number; output: number };

export type PiEvent =
  | { type: "start" }
  | { type: "text_delta"; delta: string }
  | { type: "done"; reason: "stop" | "length" | "toolUse"; usage?: PiUsage }
  | { type: "error"; reason: "error" | "aborted" };

/** 用户问机械键盘库存时，假模型会流式吐出的事件。 */
export const SHOP_FAKE_EVENTS: PiEvent[] = [
  { type: "start" },
  { type: "text_delta", delta: "KB-001" },
  { type: "text_delta", delta: " 库存 " },
  { type: "text_delta", delta: "120" },
  { type: "done", reason: "stop", usage: { input: 12, output: 4 } },
];

export async function* fakeShopStream(): AsyncGenerator<PiEvent> {
  for (const event of SHOP_FAKE_EVENTS) {
    yield event;
  }
}

export async function collectFromAsync(stream: AsyncIterable<PiEvent>): Promise<PiEvent[]> {
  const events: PiEvent[] = [];
  for await (const event of stream) {
    events.push(event);
  }
  return events;
}
