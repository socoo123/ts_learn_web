/**
 * Ch28 · Agent 循环研究复制区（M6 第二章）。
 *
 * 本文件只给阅读 / 复制。测试禁止 import 本文件。
 * 全部真代码都在字符串里，if (false) 守护，不执行、不打网、不需要 Key。
 *
 * 事实源：本机安装包 node_modules/@earendil-works/pi-agent-core/dist/
 * （agent-loop.js / agent.d.ts / types.d.ts）+ docs/sdk.md / extensions.md。
 * 不要 clone 仓库；不要在课程仓库装 @earendil-works/*（M6 作业是纯函数）。
 */

// 复制区 1：读真循环源码（shell，粘到终端跑）
const READ_AGENT_LOOP = `
AGENT="$(npm root -g)/@earendil-works/pi-coding-agent/node_modules/@earendil-works/pi-agent-core"
ls "$AGENT/dist"          # agent-loop.js / agent.d.ts / types.d.ts
# 双层 while 的真身：内层 = 工具轮，外层 = followUp 续命
grep -n "while" "$AGENT/dist/agent-loop.js"
# steer / followUp 的投递缝隙（getSteeringMessages / getFollowUpMessages 查队点）
grep -n "getSteeringMessages\|getFollowUpMessages" "$AGENT/dist/agent-loop.js"
`;

// 复制区 2：订阅事件流（来自官方 docs/sdk.md，节选）
const SUBSCRIBE_EVENTS = `
import { createAgentSession, ModelRuntime, SessionManager } from "@earendil-works/pi-coding-agent";

const modelRuntime = await ModelRuntime.create();
const { session } = await createAgentSession({
  sessionManager: SessionManager.inMemory(),
  modelRuntime,
});

session.subscribe((event) => {
  switch (event.type) {
    case "message_update":
      if (event.assistantMessageEvent.type === "text_delta") {
        process.stdout.write(event.assistantMessageEvent.delta);
      }
      break;
    case "tool_execution_start":
      console.log("Tool: " + event.toolName);
      break;
    case "tool_execution_end":
      console.log("Result: " + (event.isError ? "error" : "success"));
      break;
    case "turn_end":
      // event.message：本轮 assistant 响应；event.toolResults：本轮工具结果
      break;
    case "agent_end":
      // 一次 run 结束——但可能还有 retry / compaction / follow-up（§28.7）
      break;
  }
});

await session.prompt("机械键盘和无线鼠标还有货吗？");
`;

// 复制区 3：steer / followUp（来自官方 docs/sdk.md）
const STEER_AND_FOLLOWUP = `
// 流式期间直接 prompt 不带 streamingBehavior 会抛错，必须明说：
await session.prompt("改成只查无线鼠标", { streamingBehavior: "steer" });
await session.prompt("做完顺便算总价", { streamingBehavior: "followUp" });

// 或者显式排队：
await session.steer("改成只查无线鼠标");    // 本轮工具跑完后、下次 LLM 调用前注入
await session.followUp("做完顺便算总价");   // 只在 agent 本该停止后才投递
`;

// 复制区 4：读 AgentState（来自官方 docs/sdk.md）
const READ_AGENT_STATE = `
const state = session.agent.state;
// state.messages      对话转录（赋值新数组时拷贝顶层数组）
// state.model         当前模型
// state.systemPrompt  系统提示
// state.tools         可用工具
// state.streamingMessage  流式中的半成品消息（只读）
// state.isStreaming   agent_end 的监听器都跑完才变 false
session.agent.state.messages = newMessages; // 换新数组，不要原地 push
await session.agent.waitForIdle();
`;

if (false) {
  console.log(READ_AGENT_LOOP);
  console.log(SUBSCRIBE_EVENTS);
  console.log(STEER_AND_FOLLOWUP);
  console.log(READ_AGENT_STATE);
}
