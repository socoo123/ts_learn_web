/**
 * Ch24 · 真跑 @earendil-works/pi-agent-core 的最小示例。
 *
 * 本文件只给阅读 / 复制。测试禁止 import 本文件（包没有装进本课）。
 *
 * 作业全绿不需要本文件、不需要 API Key：假事件数组就能绿。
 * 真要跑 Agent：自行准备依赖与供应商 Key，把下面「复制区」拷到新文件再跑。
 *
 * 文档：https://pi.dev/docs/latest/sdk
 *
 * 不要用过时的包名。本章不讲 createAgentSession（那是 Ch25）。
 */

const COPY_WHEN_YOU_HAVE_A_KEY = `
import { Agent } from '@earendil-works/pi-agent-core';

const agent = new Agent({
  streamFn,
  initialState: { tools, systemPrompt, model },
  beforeToolCall: async ({ toolCall }) => {
    if (toolCall.name === "bash") {
      return { block: true, reason: "bash is disabled", terminate: true };
    }
  },
});

agent.subscribe((event) => {
  if (event.type === "message_update" && event.assistantMessageEvent.type === "text_delta") {
    process.stdout.write(event.assistantMessageEvent.delta);
  }
  if (event.type === "tool_execution_start") {
    // tool_call 开始
  }
});
`;

if (false) {
  // 有 Key 时把 COPY_WHEN_YOU_HAVE_A_KEY 拷出去跑；这里故意不 import 真包。
  console.log(COPY_WHEN_YOU_HAVE_A_KEY);
}
