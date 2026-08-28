/**
 * Ch19 作业：商品 API 的 CORS、鉴权、统一错误体（纯函数）。
 *
 * 场景：课程站跑在 http://localhost:5173，要跨域打商品 API。
 * 后台 token 是 shop-secret。出错只把 message 给浏览器，不要 stack。
 *
 * 打开本文件改 TODO，然后：bun test local/m4/ch19
 */

/**
 * 【场景】课程站 Origin 是 http://localhost:5173。只给允许名单里的前端回 CORS 头。
 * evil.example 不能读商品接口。
 *
 * 【转换点】对照 Servlet Filter 里 setHeader。allowList 含 "*" → ACAO 用 *（无 cookie 的公开接口）。
 * 否则精确匹配 origin 才回显该 origin（不要 *）。名单没有 → {}。
 *
 * 任务：返回要写到响应上的头。Methods / Headers 固定如下。
 * 示例：
 *   "http://localhost:5173" + ["http://localhost:5173"]
 *     → ACAO 回显该 origin
 *   "https://evil.example" + 上表 → {}
 *   origin "" 且无 * → {}
 *   allowList 含 "*" → ACAO 为 "*"
 *
 * 提示：includes("*") 优先；再 includes(origin)。不要 trim origin。
 */
export function corsHeaders(origin: string, allowList: string[]): Record<string, string> {
  throw new Error("TODO");
}

/**
 * 【场景】handler 里 throw 可能是 Error、字符串、甚至 null。浏览器只要一句话。
 *
 * 【转换点】unknown → { message }。instanceof Error 用 .message；string 原样；其它 INTERNAL。
 * 对照 Ch06：catch 的是 unknown，不是 Exception。
 *
 * 任务：抽出可给客户端看的 message。
 * 示例：
 *   new Error("boom") → { message: "boom" }
 *   "NOPE" → { message: "NOPE" }
 *   null / 1 → { message: "INTERNAL" }
 *
 * 提示：不要读 (err as any).message 当 Error——普通对象走 INTERNAL。
 */
export function wrapError(err: unknown): { message: string } {
  throw new Error("TODO");
}

/**
 * 【场景】访问日志要一行：方法、路径、状态。GET /products 200。
 *
 * 【转换点】模板字符串拼起来，空格分隔。404 也一样拼，不要改写成文字。
 *
 * 任务：返回 `${method} ${path} ${status}`。
 * 示例：
 *   ("GET", "/products", 200) → "GET /products 200"
 *   ("POST", "/products", 201) → "POST /products 201"
 *   ("GET", "/nope", 404) → "GET /nope 404"
 *
 * 提示：三个值原样拼。不要 pad 状态码。
 */
export function logLine(method: string, path: string, status: number): string {
  throw new Error("TODO");
}

/**
 * 【场景】后台 /admin/products 要带 Authorization: Bearer shop-secret。
 *
 * 【转换点】整段 header 必须精确等于 `Bearer ${expectedToken}`。
 * 缺头、空串、只有 Bearer、多余空格、Basic、错 token 都是 false。
 *
 * 任务：是不是这把钥匙。
 * 示例：
 *   "Bearer shop-secret" + "shop-secret" → true
 *   undefined / "" / "Bearer" / "Bearer " / "Basic x" → false
 *
 * 提示：=== 即可。不要 trim，不要忽略大小写。
 */
export function authHeaderOk(header: string | undefined, expectedToken: string): boolean {
  throw new Error("TODO");
}

/**
 * 【场景】throw new Error("UNAUTHORIZED") 给浏览器 401 JSON；boom 给 500。
 * 不要把 stack 甩出去。对照 Spring @ControllerAdvice。
 *
 * 【转换点】必须调用 wrapError 得到 message。
 *   "UNAUTHORIZED" → 401
 *   "FORBIDDEN" → 403
 *   其它 → 500，error 用 wrapError 的 message（123 → INTERNAL）
 *
 * 任务：返回 { status, body: { error } }。body 只有 error 一键。
 * 示例：
 *   new Error("UNAUTHORIZED") → { status: 401, body: { error: "UNAUTHORIZED" } }
 *   new Error("boom") → { status: 500, body: { error: "boom" } }
 *   123 → { status: 500, body: { error: "INTERNAL" } }
 *
 * 提示：先 wrapError。不要读 err.stack。本题不看对象上的 status 字段。
 */
export function onErrorPayload(err: unknown): { status: number; body: { error: string } } {
  throw new Error("TODO");
}

/**
 * 【场景】CORS 最外层，鉴权夹中间，日志靠里。洋葱：先入后出。
 *
 * 【转换点】进入：每个 name 推 `${name}>`；然后 "handler"；退出：反过来每个 `<${name}`。
 * 对照 FilterChain：doFilter 前进，return 之后还能改响应。
 *
 * 任务：记录进出顺序。空栈也要有 handler。
 * 示例：
 *   ["cors","auth","log"] → ["cors>","auth>","log>","handler","<log","<auth","<cors"]
 *   [] → ["handler"]
 *   ["cors"] → ["cors>","handler","<cors"]
 *
 * 提示：进入按原序；退出用 reverse。不要 mutate 传入的 stack。
 */
export function composeMiddlewareOrder(stack: string[]): string[] {
  throw new Error("TODO");
}
