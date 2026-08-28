/**
 * Ch23 · 真跑 @earendil-works/pi-agent-core 的最小示例。
 *
 * 本文件只给阅读 / 复制。测试禁止 import 本文件（包没有装进本课）。
 *
 * 作业全绿不需要本文件、不需要 API Key：假 streamFn / 假 tool_call 就能绿。
 * 真要跑 Agent：
 *   1. bun add @earendil-works/pi-agent-core
 *   2. export OPENAI_API_KEY=...   （或其它供应商的 Key）
 *   3. 把下面「复制区」拷到新文件再 bun 跑
 *
 * 文档：https://pi.dev/docs/latest/sdk
 *
 * 不要用过时的 @mariozechner/* 。本章不讲 beforeToolCall（Ch24）、
 * createAgentSession（Ch25）、Hono+SSE（Ch26）。
 */

const COPY_WHEN_YOU_HAVE_A_KEY = `
import { Agent } from '@earendil-works/pi-agent-core';
import { Type } from 'typebox';

const lookupProduct: AgentTool = {
  name: 'lookupProduct',
  label: '查询商品',
  description: '按 SKU 查商品名称、库存和单价',
  parameters: Type.Object({ sku: Type.String({ description: '商品 SKU，例如 KB-001' }) }),
  execute: async (_id, params) => {
    if (params.sku !== 'KB-001') throw new Error('NOT_FOUND');
    return { content: [{ type: 'text', text: 'KB-001 机械键盘 库存 120 单价 599' }] };
  },
};

const calcLineTotal: AgentTool = {
  name: 'calcLineTotal',
  label: '计算小计',
  description: '数量乘单价得到行小计',
  parameters: Type.Object({
    qty: Type.Number({ description: '购买数量，整数 ≥ 1' }),
    unitPrice: Type.Number({ description: '单价' }),
  }),
  execute: async (_id, params) => {
    if (!Number.isInteger(params.qty) || params.qty < 1) throw new Error('BAD_QTY');
    return { content: [{ type: 'text', text: '小计 ' + String(params.qty * params.unitPrice) }] };
  },
};

const agent = new Agent({
  initialState: {
    systemPrompt: '你是商品助手。只用 lookupProduct 和 calcLineTotal。禁止 bash 和写文件。',
    model,
    tools: [lookupProduct, calcLineTotal],
  },
  streamFn: models.streamSimple.bind(models),
});
await agent.prompt('机械键盘还有货吗');
`;

if (false) {
  // 有 Key 时把 COPY_WHEN_YOU_HAVE_A_KEY 拷出去跑；这里故意不 import 真包。
  console.log(COPY_WHEN_YOU_HAVE_A_KEY);
}
