/**
 * Ch25 · 真跑 @earendil-works/pi-coding-agent 的最小示例。
 *
 * 本文件只给阅读 / 复制。测试禁止 import 本文件（包没有装进本课）。
 *
 * 作业全绿不需要本文件、不需要 API Key：配置对象就能绿。
 * 无 Key 不要跑下面这段。真要开会话：
 *   1. 自行安装 @earendil-works/pi-coding-agent（本课作业不要装）
 *   2. export 供应商 Key（如 OPENAI_API_KEY）
 *   3. 把下面「复制区」拷到新文件再跑
 *
 * 文档：https://pi.dev/docs/latest/sdk
 *
 * 不要用过时的 @mariozechner/* 。不要默认开启 bash。
 * 本章不讲 Hono+SSE（那是 Ch26）。
 */

const COPY_WHEN_YOU_HAVE_A_KEY = `
import { createAgentSession, SessionManager } from "@earendil-works/pi-coding-agent";

const { session } = await createAgentSession({
  sessionManager: SessionManager.inMemory(),
  // 可选：modelRuntime: await ModelRuntime.create(),
  tools: ["lookupProduct", "calcLineTotal"],
  customTools: [lookupProduct, calcLineTotal],
});

await session.prompt("机械键盘还有货吗");
await session.steer("改口只报 SKU 和库存数字");
session.subscribe((event) => {
  console.log(event);
});
session.dispose();
`;

if (false) {
  // 有 Key 时把 COPY_WHEN_YOU_HAVE_A_KEY 拷出去跑；这里故意不 import 真包。
  console.log(COPY_WHEN_YOU_HAVE_A_KEY);
}
