import { Hono } from "hono";
import { streamSSE } from "hono/streaming";

/** Mock 商品名 token：机械键盘。测试请用这个常量，不要在断言里另写一份。 */
export const TOKENS = ["机", "械", "键盘"];

export const app = new Hono();

app.get("/health", (c) => c.json({ ok: true }));

app.get("/stream", (c) =>
  streamSSE(c, async (stream) => {
    for (const token of TOKENS) {
      await stream.writeSSE({ data: token });
    }
    await stream.writeSSE({ data: "[DONE]" });
  }),
);
