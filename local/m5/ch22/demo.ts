/**
 * Ch22 · 真跑 @earendil-works/pi-ai 的最小示例。
 *
 * 本文件只给阅读 / 复制。测试禁止 import 本文件（包没有装进本课）。
 *
 * 作业全绿不需要本文件、不需要 API Key：假事件数组就能绿。
 * 真要打模型：
 *   1. bun add @earendil-works/pi-ai
 *   2. export OPENAI_API_KEY=...   （或其它供应商的 Key）
 *   3. 把下面「复制区」拷到新文件再 bun 跑
 *
 * 文档：https://pi.dev/docs/latest/sdk
 * README：https://github.com/earendil-works/pi/blob/main/packages/ai/README.md
 *
 * 不要用过时的 @mariozechner/* 。本章不讲 Agent / Tool（那是 Ch23）。
 */

const COPY_WHEN_YOU_HAVE_A_KEY = `
import { builtinModels } from '@earendil-works/pi-ai/providers/all';

const models = builtinModels();
const model = models.getModel('openai', 'gpt-4o-mini')!;

const context = {
  systemPrompt: '你是商品助手。用户问库存时用 SKU 和数字简短回答。',
  messages: [
    { role: 'user', content: '机械键盘还有货吗？', timestamp: Date.now() },
  ],
};

const s = models.stream(model, context);
for await (const event of s) {
  switch (event.type) {
    case 'text_delta':
      process.stdout.write(event.delta);
      break;
    case 'done':
      console.log('\\nreason:', event.reason);
      console.log('usage:', event.message.usage);
      break;
    case 'error':
      console.error('error:', event.reason);
      break;
  }
}
`;

if (false) {
  // 有 Key 时把 COPY_WHEN_YOU_HAVE_A_KEY 拷出去跑；这里故意不 import 真包。
  console.log(COPY_WHEN_YOU_HAVE_A_KEY);
}
