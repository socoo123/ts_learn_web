/**
 * Ch17 作业：商品目录 API 的纯函数。
 *
 * 场景：Hono 把 HTTP 接到这 6 个函数。路由已写在 app.ts，
 * 你只改本文件。不要 import "hono"，不要起端口。
 *
 * 全绿 = 你掌握了 Ch17。跑：bun test local/m4/ch17
 */

type Product = {
  id: number;
  name: string;
  category: string;
  price: number;
  stock: number;
  sku: string;
};

/**
 * 【场景】GET /products/:id。Hono 的 c.req.param("id") 永远是 string。
 * 「1」要变成数字 1；「abc」不能当 id。
 *
 * 【转换点】整段匹配 /^\d+$/ 再 Number(raw)。有限数且 ≥ 1 才返回，否则 null。
 * Spring @PathVariable Long 会帮你转；FastAPI id: int 也会。
 * Hono 不转，你自己把字符串变成 id。
 *
 * 任务：合法正整数 id 返回 number，否则 null。
 * 示例：
 *   "1" → 1；"10" → 10；"01" → 1
 *   "0" / "-1" / "abc" / "" / "1.5" / "1e2" / "12abc" → null
 *
 * 提示：先 /^\d+$/.test(raw)，再 Number。不要 parseInt（"12abc" 会变成 12）。
 */
export function parseIdParam(raw: string): number | null {
  throw new Error("TODO");
}

/**
 * 【场景】目录里按 id 拿一件商品。id=1 机械键盘；id=9 智能水杯（库存 0 也算找到）。
 *
 * 【转换点】find 到就返回该对象，找不到 null。不要改传入的 products。
 *
 * 任务：products 里 id 相等的那一件；没有则 null。
 * 示例：
 *   id=1 → 机械键盘 KB-001
 *   id=9 → 智能水杯，stock 0
 *   id=99 → null
 *
 * 提示：products.find((p) => p.id === id) ?? null
 */
export function getProductById(products: Product[], id: number): Product | null {
  throw new Error("TODO");
}

/**
 * 【场景】GET /products 返回整份目录。缺货的智能水杯也要在列表里。
 *
 * 【转换点】浅拷贝 products.slice()。不要 mutate 原数组，也不要过滤 stock。
 *
 * 任务：返回浅拷贝；空数组 → []。
 * 示例：
 *   10 件目录 → length 10，含 CP-009
 *   [] → []
 *   Object.is(返回值, 原数组) === false
 *
 * 提示：return products.slice();
 */
export function listProducts(products: Product[]): Product[] {
  throw new Error("TODO");
}

/**
 * 【场景】GET /health。负载均衡 / 探针要一眼看到服务活着。
 *
 * 【转换点】精确两键：{ ok: true, service: "shop-api" }。不要额外字段。
 *
 * 任务：返回该对象。
 * 示例：healthPayload() → { ok: true, service: "shop-api" }
 *
 * 提示：直接 return 字面量。
 */
export function healthPayload(): { ok: true; service: "shop-api" } {
  throw new Error("TODO");
}

/**
 * 【场景】id 不合法或商品不存在。HTTP 404，body 统一 { error: "NOT_FOUND" }。
 *
 * 【转换点】业务函数只负责 JSON 形状；status 404 由 Hono 的 c.json(body, 404) 填。
 *
 * 任务：精确返回 { error: "NOT_FOUND" }。
 * 示例：notFoundBody() → { error: "NOT_FOUND" }
 *
 * 提示：不要返回 404 这个数字，那是 createdStatus 另一题的分工。
 */
export function notFoundBody(): { error: "NOT_FOUND" } {
  throw new Error("TODO");
}

/**
 * 【场景】POST /products 创建成功。REST 约定用 201 Created，不是 200。
 *
 * 【转换点】对照 Spring @ResponseStatus(CREATED) / FastAPI status_code=201。
 * Hono：c.json(body, createdStatus() as 201)。
 *
 * 任务：返回 201。
 * 示例：createdStatus() → 201
 *
 * 提示：return 201; 不要返回 200。
 */
export function createdStatus(): number {
  throw new Error("TODO");
}
