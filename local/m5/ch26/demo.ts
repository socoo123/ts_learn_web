/**
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

const COPY_WHEN_YOU_WIRE_UI = `
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
    const parts = buffer.split("\\n\\n");
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
`;

if (false) {
  // 有自己的小页面时把 COPY_WHEN_YOU_WIRE_UI 拷出去跑；这里故意不 fetch。
  console.log(COPY_WHEN_YOU_WIRE_UI);
}
