/**
 * Ch23 本地假流：商品助手先 tool_call 再 text。
 * 不联网、不起端口、不 import 真 Agent 包。
 *
 * bun test 会 for-await 本 generator，再把 args 交给 assignment.ts。
 */

export type Product = {
  id: number;
  name: string;
  category: string;
  price: number;
  stock: number;
  sku: string;
};

export type FakeAgentEvent =
  | { type: "tool_call"; name: string; args: { sku?: string; qty?: number; unitPrice?: number } }
  | { type: "text_delta"; delta: string }
  | { type: "done"; reason: "stop" };

/** 与 shared.json 一致的 10 件商品。CP-009 库存 0。 */
export const SHOP_PRODUCTS: Product[] = [
  { id: 1, name: "机械键盘", category: "电脑外设", price: 599, stock: 120, sku: "KB-001" },
  { id: 2, name: "无线鼠标", category: "电脑外设", price: 159, stock: 300, sku: "MS-002" },
  { id: 3, name: "27寸4K显示器", category: "电脑外设", price: 2199, stock: 45, sku: "MN-003" },
  { id: 4, name: "Python编程:从入门到实践", category: "图书", price: 89, stock: 500, sku: "BK-004" },
  { id: 5, name: "设计模式", category: "图书", price: 75.5, stock: 200, sku: "BK-005" },
  { id: 6, name: "降噪耳机", category: "影音设备", price: 1299, stock: 80, sku: "HP-006" },
  { id: 7, name: "蓝牙音箱", category: "影音设备", price: 399, stock: 150, sku: "SP-007" },
  { id: 8, name: "USB-C扩展坞", category: "电脑外设", price: 269, stock: 220, sku: "DK-008" },
  { id: 9, name: "智能水杯", category: "生活用品", price: 199, stock: 0, sku: "CP-009" },
  { id: 10, name: "人体工学椅", category: "生活用品", price: 1599, stock: 30, sku: "CH-010" },
];

export async function* fakeToolThenTextStream(): AsyncGenerator<FakeAgentEvent> {
  yield { type: "tool_call", name: "lookupProduct", args: { sku: "KB-001" } };
  yield { type: "text_delta", delta: "KB-001 库存 120" };
  yield { type: "done", reason: "stop" };
}

export async function collectFromAsync(stream: AsyncIterable<FakeAgentEvent>): Promise<FakeAgentEvent[]> {
  const events: FakeAgentEvent[] = [];
  for await (const event of stream) {
    events.push(event);
  }
  return events;
}
