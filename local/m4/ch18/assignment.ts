import { z } from "zod";

/**
 * Ch18 作业：HTTP 边界用 zod 校验 path / query / body。
 *
 * 场景：创建、搜索商品。非法 id、空 q、缺 sku 的 body 都是 400，不要 500。
 * Ch07 已教 z.object / safeParse；本章接到 Hono 的字符串边界。
 *
 * 本文件需要 `import { z } from "zod"`（Bun 本地跑）。网页 JSON 作业不要 import，
 * 那边运行器已注入全局 z。
 *
 * 全绿 = 你掌握了 Ch18。命令：bun test local/m4/ch18
 */

export type SearchQuery = { q: string; limit: number };
export type CreateBody = { name: string; price: number; sku: string; stock: number };
export type ValidationFail = { error: "VALIDATION"; fields: string[] };

/**
 * 【场景】GET /products/:id。Hono 的 c.req.param("id") 永远是 string。
 * 「abc」「0」不是合法商品 id，不要 Number("abc") → NaN 再 500。
 *
 * 【转换点】用 zod schema，不要手写 if。行为与 Ch17 的 parseIdParam 对齐，
 * 但必须走 schema：/^\d+$/ 且整数 ≥ 1。失败返回 null，不要 throw。
 *
 * 任务：合法数字串 → number；否则 null。
 * 示例：
 *   "1" → 1；"10" → 10
 *   "0" / "abc" / "1.5" / "" / "12abc" → null
 *
 * 提示：z.string().regex(/^\d+$/).transform(Number).pipe(z.number().int().min(1))
 *       然后 safeParse。不要 c.req.param("id") as unknown as number。
 */
export function parseIdParam(raw: string): number | null {
  throw new Error("TODO");
}

/**
 * 【场景】GET /search?q=键盘&limit=5。查询串全是字符串；limit 可缺省。
 *
 * 【转换点】q trim 后长度 ≥ 1；limit 缺省 10，出现则必须是 1–100 的整数
 *（number 或纯数字字符串）。0 / 101 / "x" → 整单 null。多余键忽略。
 *
 * 任务：成功 → { q, limit }；失败 → null。
 * 示例：
 *   { q: "键盘" }              → { q: "键盘", limit: 10 }
 *   { q: "键盘", limit: 5 }    → { q: "键盘", limit: 5 }
 *   { q: "  " }                → null
 *   { limit: 10 }              → null（无 q）
 *
 * 提示：z.object({ q: z.string().trim().min(1), limit: ...optional().default(10) })
 */
export function parseSearchQuery(input: Record<string, unknown>): SearchQuery | null {
  throw new Error("TODO");
}

/**
 * 【场景】POST /products 的 JSON body：上架一件商品。缺 sku、price 为 0、
 * sku 写成小写 kb-001，都是客户端错，400，不是 500。
 *
 * 【转换点】name trim 后非空；price 是 number 且 > 0（75.5 合法，0 不合法）；
 * sku 匹配 /^[A-Z]{2}-\d{3}$/；stock 整数 ≥ 0（0 = 缺货，合法）。
 * 不是 object / 缺字段 / 类型错 → null。
 *
 * 任务：合法 → CreateBody；否则 null。
 * 示例：
 *   { name: "机械键盘", price: 599, sku: "KB-001", stock: 120 } → 原样（name 已 trim）
 *   price: 0 或 sku: "kb-001" → null
 *
 * 提示：z.object + safeParse。price 用 .gt(0) 或 .positive()，不要 coerce 字符串价格。
 */
export function parseCreateBody(input: unknown): CreateBody | null {
  throw new Error("TODO");
}

/**
 * 【场景】校验失败要给前端一张「哪些字段坏了」的 400 JSON，不要把 ZodError
 * 整棵树丢出去，也不要变成 500。
 *
 * 【转换点】每个 issue 的 path 用 "." 拼接；空 path → ""。去重但保序。
 *
 * 任务：返回 { error: "VALIDATION", fields }。
 * 示例：
 *   [{ path: ["sku"] }, { path: ["price"] }] → { error: "VALIDATION", fields: ["sku", "price"] }
 *   [] → { error: "VALIDATION", fields: [] }
 *
 * 提示：map path.join(".")，再用 includes 去重。不要 sort。
 */
export function errorToJson(issues: Array<{ path: (string | number)[] }>): ValidationFail {
  throw new Error("TODO");
}

/**
 * 【场景】handler 里不要 schema.parse 直接 throw。safeParse 之后分 200 / 400。
 *
 * 【转换点】success → { status: 200, data }；失败 → { status: 400, body: errorToJson(...) }。
 * 必须调用 errorToJson，不要手写一份 fields。
 *
 * 任务：把 safeParse 的两种结果收成 HTTP 形状。
 *
 * 提示：if (parsed.success) return { status: 200, data: parsed.data };
 */
export function validateOr400<T>(
  parsed:
    | { success: true; data: T }
    | { success: false; error: { issues: Array<{ path: (string | number)[] }> } },
): { status: 200; data: T } | { status: 400; body: ValidationFail } {
  throw new Error("TODO");
}

/**
 * 【场景】PATCH /products/:id：只改价格或库存。合并后再整体校验，
 * 免得「只改了 price: 0」溜进数据库。
 *
 * 【转换点】patch 必须是 object（非 null、非数组）。与 current 浅合并，
 * 再走 parseCreateBody。不要 mutate current。空对象 {} → 等于 current。
 *
 * 任务：合并后整体合法 → 新对象；否则 null。
 * 示例：
 *   { price: 0 } 合并后非法 → null
 *   { stock: 0 } 合法（缺货）
 *
 * 提示：{ ...current, ...patch } 然后 parseCreateBody。请先把 §18.3 写绿。
 */
export function patchBody(current: CreateBody, patch: unknown): CreateBody | null {
  throw new Error("TODO");
}
