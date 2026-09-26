/**
 * Ch30 · Session 与 Compaction 复制区（M6）。
 *
 * 本文件只给阅读 / 复制。测试禁止 import 本文件。
 * 全部真代码都在字符串里，if (false) 守护，不执行、不打网、不需要 Key。
 *
 * 事实源：本机安装包 docs/session-format.md · compaction.md · sessions.md · settings.md
 * 以及 dist/core/compaction/compaction.js（pi v0.85.1）。
 * 不要 clone 仓库；不要在课程仓库装 @earendil-works/*。
 */

const READ_THE_DOCS = `
ROOT="$(npm root -g)/@earendil-works/pi-coding-agent"
sed -n '1,80p' "$ROOT/docs/session-format.md"
sed -n '25,80p' "$ROOT/docs/compaction.md"
sed -n '114,130p' "$ROOT/docs/settings.md"
`;

const SESSION_JSONL = `
{"type":"session","version":3,"id":"sess-shop","timestamp":"2026-09-26T00:00:00.000Z","cwd":"/shop"}
{"type":"message","id":"u1","parentId":null,"timestamp":"2026-09-26T00:00:01.000Z","message":{"role":"user","content":"查 KB-001 机械键盘","timestamp":1}}
{"type":"message","id":"a1","parentId":"u1","timestamp":"2026-09-26T00:00:02.000Z","message":{"role":"assistant","content":[{"type":"text","text":"库存 12"}],"stopReason":"stop","timestamp":2}}
{"type":"message","id":"u2","parentId":"a1","timestamp":"2026-09-26T00:00:03.000Z","message":{"role":"user","content":"再查 MS-002 无线鼠标","timestamp":3}}
{"type":"compaction","id":"cmp1","parentId":"u2","timestamp":"2026-09-26T00:01:00.000Z","summary":"已确认 KB-001 现货 12","firstKeptEntryId":"u2","tokensBefore":50000}
`;

const SHOULD_COMPACT = `
export function shouldCompact(contextTokens, contextWindow, settings) {
  if (!settings.enabled) return false;
  return contextTokens > contextWindow - settings.reserveTokens;
}
`;

const SETTINGS_MERGE = `
// ~/.pi/agent/settings.json
{ "compaction": { "enabled": true, "reserveTokens": 16384, "keepRecentTokens": 20000 } }
// .pi/settings.json 只改余量 → 合并后 enabled 仍 true，reserveTokens 8192，keepRecentTokens 20000
{ "compaction": { "reserveTokens": 8192 } }
// contextWindow 的按模型覆盖不在 compaction 上，在 models.json：
// providers.openai.modelOverrides["gpt-5.6-sol"].contextWindow = 1050000
// 没有这项就用模型自带窗口。SessionManager.appendCompaction(summary, firstKeptEntryId, tokensBefore)
`;

if (false) {
  console.log(READ_THE_DOCS);
  console.log(SESSION_JSONL);
  console.log(SHOULD_COMPACT);
  console.log(SETTINGS_MERGE);
}
