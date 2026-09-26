/**
 * Ch27 · 研究入口复制区（M6 第一章）。
 *
 * 本文件只给阅读 / 复制。测试禁止 import 本文件。
 * 全部真代码都在字符串里，if (false) 守护，不执行、不打网、不需要 Key。
 *
 * 事实源：本机安装包（npm 全局）+ https://pi.dev/docs/latest
 * 不要 clone 仓库；不要在课程仓库装 @earendil-works/*（M6 作业是纯函数）。
 */

// 复制区 1：探索本机安装包（shell，粘到终端跑）
const EXPLORE_INSTALL = `
npm root -g
# → /opt/homebrew/lib/node_modules（macOS Homebrew npm）

ROOT="$(npm root -g)/@earendil-works/pi-coding-agent"
ls "$ROOT/docs"        # 全部官方文档：sdk.md rpc.md compaction.md session-format.md ...
ls "$ROOT/examples"    # sdk/ 01–13、extensions/、plugins/
ls "$ROOT/examples/sdk" | head
ls "$ROOT/dist/modes"  # interactive/  print-mode  json-event  rpc/  ← 四种运行模式的证据
`;

// 复制区 2：SDK 最小示例（来自官方 docs/sdk.md，Node 同进程嵌入）
const SDK_QUICKSTART = `
import { createAgentSession, ModelRuntime, SessionManager } from "@earendil-works/pi-coding-agent";

const modelRuntime = await ModelRuntime.create();
const { session } = await createAgentSession({
  sessionManager: SessionManager.inMemory(),
  modelRuntime,
});

session.subscribe((event) => {
  if (event.type === "message_update" && event.assistantMessageEvent.type === "text_delta") {
    process.stdout.write(event.assistantMessageEvent.delta);
  }
});

await session.prompt("机械键盘还有货吗？");
`;

// 复制区 3：看安装包里四种模式的真实入口（dist/modes）
const SEE_FOUR_MODES = `
cat "$(npm root -g)/@earendil-works/pi-coding-agent/dist/modes/index.d.ts"
# 导出 InteractiveMode、runPrintMode、runRpcMode 等——
# 四种模式 = 同一 AgentSessionRuntime 的四个壳（§27.2 的证据）
`;

if (false) {
  console.log(EXPLORE_INSTALL);
  console.log(SDK_QUICKSTART);
  console.log(SEE_FOUR_MODES);
}
