/**
 * Ch31 · SDK 嵌入 vs RPC 复制区（M6 收官）。
 *
 * 本文件只给阅读 / 复制。测试禁止 import 本文件。
 * 全部真代码都在字符串里，if (false) 守护，不执行、不打网、不需要 Key。
 *
 * 事实源：本机安装包 docs/sdk.md · rpc.md · json.md（pi v0.85.1）。
 * 不要 clone 仓库；不要在课程仓库装 @earendil-works/*。
 */

const READ_THE_DOCS = `
ROOT="$(npm root -g)/@earendil-works/pi-coding-agent"
sed -n '1,40p' "$ROOT/docs/sdk.md"
sed -n '20,80p' "$ROOT/docs/rpc.md"
sed -n '1,20p' "$ROOT/docs/json.md"
`;

const SDK_EMBED = `
import { createAgentSession, SessionManager } from "@earendil-works/pi-coding-agent";

const { session } = await createAgentSession({
  sessionManager: SessionManager.inMemory(),
});
session.subscribe((event) => {
  if (event.type === "message_update") {
    // 商品助手的文本增量
  }
});
await session.prompt("查 KB-001 机械键盘还有货吗");
await session.steer("改报 MS-002 无线鼠标");
`;

const RPC_FRAMES = `
# 启动：pi --mode rpc --no-session
# stdin 一行一个 JSON，只以 LF 结尾。不要用 readline（它会切开 U+2028 / U+2029）。
{"id":"req-1","type":"prompt","message":"查 KB-001 机械键盘"}
{"id":"req-1","type":"response","command":"prompt","success":true}
{"type":"agent_end"}
# success true 只表示已接受。之后的失败在事件里，没有第二条 response。
{"type":"extension_ui_request","id":"uuid-1","method":"select","title":"允许改价?","options":["Allow","Block"]}
{"type":"extension_ui_response","id":"uuid-1","value":"Allow"}
`;

if (false) {
  console.log(READ_THE_DOCS);
  console.log(SDK_EMBED);
  console.log(RPC_FRAMES);
}
