/**
 * 生成 src/content/chapters/ch19.json
 * 运行：bun scripts/gen-ch19.ts
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const preamble = `/**
 * Ch19 作业：商品 API 给课程站跨域；后台 token shop-secret；出错不要甩 stack。
 *
 * 场景：前端在 http://localhost:5173，只给允许名单回 CORS 头。
 * 后台 /admin 要 Bearer。统一错误 JSON，不要把 stack 给浏览器。
 * 作业是纯函数：算头、包错误、拼日志、鉴权、错误体、洋葱顺序。
 *
 * 全绿 = 你掌握了 Ch19。
 */`;

const functions = [
  {
    name: "corsHeaders",
    testSuite: "corsHeaders",
    skeleton: `/**
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
}`,
  },
  {
    name: "wrapError",
    testSuite: "wrapError",
    skeleton: `/**
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
}`,
  },
  {
    name: "logLine",
    testSuite: "logLine",
    skeleton: `/**
 * 【场景】访问日志要一行：方法、路径、状态。GET /products 200。
 *
 * 【转换点】模板字符串拼起来，空格分隔。404 也一样拼，不要改写成文字。
 *
 * 任务：返回 \`\${method} \${path} \${status}\`。
 * 示例：
 *   ("GET", "/products", 200) → "GET /products 200"
 *   ("POST", "/products", 201) → "POST /products 201"
 *   ("GET", "/nope", 404) → "GET /nope 404"
 *
 * 提示：三个值原样拼。不要 pad 状态码。
 */
export function logLine(method: string, path: string, status: number): string {
  throw new Error("TODO");
}`,
  },
  {
    name: "authHeaderOk",
    testSuite: "authHeaderOk",
    skeleton: `/**
 * 【场景】后台 /admin/products 要带 Authorization: Bearer shop-secret。
 *
 * 【转换点】整段 header 必须精确等于 \`Bearer \${expectedToken}\`。
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
}`,
  },
  {
    name: "onErrorPayload",
    testSuite: "onErrorPayload",
    skeleton: `/**
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
}`,
  },
  {
    name: "composeMiddlewareOrder",
    testSuite: "composeMiddlewareOrder",
    skeleton: `/**
 * 【场景】CORS 最外层，鉴权夹中间，日志靠里。洋葱：先入后出。
 *
 * 【转换点】进入：每个 name 推 \`\${name}>\`；然后 "handler"；退出：反过来每个 \`<\${name}\`。
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
}`,
  },
];

const assignment = `${preamble}

${functions.map((f) => f.skeleton).join("\n\n")}
`;

const testSource = `const ALLOW_5173 = ["http://localhost:5173"];
const CORS_STAR = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type,Authorization",
};

describe("corsHeaders", () => {
  it("课程站 5173 回显 origin，不是 *", () => {
    const origin = "http://localhost:5173";
    expect(corsHeaders(origin, ALLOW_5173)).toEqual({
      "Access-Control-Allow-Origin": origin,
      "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type,Authorization",
    });
  });
  it("evil origin → {}", () => {
    expect(corsHeaders("https://evil.example", ALLOW_5173)).toEqual({});
  });
  it("origin 空串且无 * → {}", () => {
    expect(corsHeaders("", ALLOW_5173)).toEqual({});
    expect(corsHeaders("", [])).toEqual({});
  });
  it("allowList 含 * → ACAO 为 *", () => {
    expect(corsHeaders("http://localhost:5173", ["*"])).toEqual(CORS_STAR);
    expect(corsHeaders("https://evil.example", ["*"])).toEqual(CORS_STAR);
    expect(corsHeaders("", ["*"])).toEqual(CORS_STAR);
  });
  it("精确匹配其它 origin（防硬编码 5173）", () => {
    const origin = "https://shop.example";
    expect(corsHeaders(origin, ["https://shop.example", "http://localhost:5173"])).toEqual({
      "Access-Control-Allow-Origin": origin,
      "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type,Authorization",
    });
  });
  it("不 mutate allowList", () => {
    const list = ["http://localhost:5173"];
    Object.freeze(list);
    expect(corsHeaders("http://localhost:5173", list)["Access-Control-Allow-Origin"]).toBe(
      "http://localhost:5173",
    );
    expect(list.length).toBe(1);
  });
});

describe("wrapError", () => {
  it("Error → message", () => {
    expect(wrapError(new Error("boom"))).toEqual({ message: "boom" });
    expect(wrapError(new Error("UNAUTHORIZED"))).toEqual({ message: "UNAUTHORIZED" });
  });
  it("string 原样", () => {
    expect(wrapError("NOPE")).toEqual({ message: "NOPE" });
    expect(wrapError("FORBIDDEN")).toEqual({ message: "FORBIDDEN" });
  });
  it("null / 1 / 普通对象 → INTERNAL", () => {
    expect(wrapError(null)).toEqual({ message: "INTERNAL" });
    expect(wrapError(1)).toEqual({ message: "INTERNAL" });
    expect(wrapError({ message: "boom" })).toEqual({ message: "INTERNAL" });
  });
});

describe("logLine", () => {
  it("GET /products 200", () => {
    expect(logLine("GET", "/products", 200)).toBe("GET /products 200");
  });
  it("POST /products 201", () => {
    expect(logLine("POST", "/products", 201)).toBe("POST /products 201");
  });
  it("404 也一样拼", () => {
    expect(logLine("GET", "/nope", 404)).toBe("GET /nope 404");
    expect(logLine("PUT", "/admin/products", 401)).toBe("PUT /admin/products 401");
  });
});

describe("authHeaderOk", () => {
  it("Bearer shop-secret → true", () => {
    expect(authHeaderOk("Bearer shop-secret", "shop-secret")).toBe(true);
  });
  it("缺头 / 空 / 半截 Bearer → false", () => {
    expect(authHeaderOk(undefined, "shop-secret")).toBe(false);
    expect(authHeaderOk("", "shop-secret")).toBe(false);
    expect(authHeaderOk("Bearer", "shop-secret")).toBe(false);
    expect(authHeaderOk("Bearer ", "shop-secret")).toBe(false);
  });
  it("Basic / 错 token / 多余空格 / 大小写 → false", () => {
    expect(authHeaderOk("Basic x", "shop-secret")).toBe(false);
    expect(authHeaderOk("Bearer wrong", "shop-secret")).toBe(false);
    expect(authHeaderOk("Bearer  shop-secret", "shop-secret")).toBe(false);
    expect(authHeaderOk(" Bearer shop-secret", "shop-secret")).toBe(false);
    expect(authHeaderOk("bearer shop-secret", "shop-secret")).toBe(false);
    expect(authHeaderOk("Bearer other-token", "other-token")).toBe(true);
  });
});

describe("onErrorPayload", () => {
  it("UNAUTHORIZED → 401", () => {
    expect(onErrorPayload(new Error("UNAUTHORIZED"))).toEqual({
      status: 401,
      body: { error: "UNAUTHORIZED" },
    });
    expect(onErrorPayload("UNAUTHORIZED")).toEqual({
      status: 401,
      body: { error: "UNAUTHORIZED" },
    });
  });
  it("FORBIDDEN → 403；boom → 500", () => {
    expect(onErrorPayload(new Error("FORBIDDEN"))).toEqual({
      status: 403,
      body: { error: "FORBIDDEN" },
    });
    expect(onErrorPayload(new Error("boom"))).toEqual({
      status: 500,
      body: { error: "boom" },
    });
  });
  it("123 → 500 INTERNAL；body 只有 error", () => {
    expect(onErrorPayload(123)).toEqual({
      status: 500,
      body: { error: "INTERNAL" },
    });
    const p = onErrorPayload(new Error("boom"));
    expect(Object.keys(p.body).length).toBe(1);
    expect(p.body.error).toBe("boom");
  });
});

describe("composeMiddlewareOrder", () => {
  it("cors/auth/log 洋葱：外层 CORS 先入后出", () => {
    expect(composeMiddlewareOrder(["cors", "auth", "log"])).toEqual([
      "cors>",
      "auth>",
      "log>",
      "handler",
      "<log",
      "<auth",
      "<cors",
    ]);
  });
  it("空栈只有 handler", () => {
    expect(composeMiddlewareOrder([])).toEqual(["handler"]);
  });
  it("单层 cors；两层防硬编码", () => {
    expect(composeMiddlewareOrder(["cors"])).toEqual(["cors>", "handler", "<cors"]);
    expect(composeMiddlewareOrder(["auth", "log"])).toEqual([
      "auth>",
      "log>",
      "handler",
      "<log",
      "<auth",
    ]);
  });
  it("不 mutate stack", () => {
    const stack = ["cors", "auth"];
    Object.freeze(stack);
    composeMiddlewareOrder(stack);
    expect(stack.length).toBe(2);
    expect(stack[0]).toBe("cors");
    expect(stack[1]).toBe("auth");
  });
});
`;

function sec(
  id: string,
  heading: string,
  secNum: string | null,
  body: string,
  exerciseFunctions: string[],
) {
  return { id, heading, secNum, body, exerciseFunctions };
}

const sections = [
  sec(
    "intro",
    "",
    null,
    `> **预计**：1 天 ｜ **前置**：Ch17（Hono 路由 / \`c.json\`）
> **目标**：① CORS 只回显允许的 Origin；② Bearer 精确鉴权；③ \`onError\` 统一 JSON，不把 stack 甩给浏览器；④ 中间件洋葱（先入后出）。
> 你 15 年 Java：\`Filter\` / \`FilterChain.doFilter\`、Spring \`@ControllerAdvice\`。Python：FastAPI \`middleware\` + \`exception_handler\`。本章把这三件事接到 Hono 的 \`app.use\` / \`app.onError\`。

> 📐 **本教程的契约**：下面每一节（§19.1–§19.6）都**精确对应**作业里的题。讲过的才考，考的必讲过。卡住时按作业函数名回查对应小节。
> **不讲**：校验库、数据库、Agent。\`app.ts\` 已经写好，你填纯函数。

---`,
    [],
  ),
  sec(
    "sec-map",
    "🗺️ 本章地图",
    null,
    `本章作业是一条完整主线：**商品 API 给课程站跨域**。前端在 \`http://localhost:5173\`；后台 token 是 \`shop-secret\`；\`/boom\` 这种炸掉的请求，浏览器只能看到 \`{ error: "boom" }\`，看不到 stack。

读完这章 + 完成作业，你将能够：

- 按允许名单决定要不要写 CORS 头（回显 origin，或 \`*\` 仅用于无凭证）
- 把 \`unknown\` 收成一句 \`message\`，普通对象不要装成 Error
- 拼一行访问日志
- 用精确的 \`Bearer <token>\` 判断后台钥匙
- 用 \`wrapError\` 产出 401 / 403 / 500 的统一 JSON
- 画出中间件洋葱：外层 CORS 先入后出

**作业 ↔ 教程对应表**（学哪节，就去做哪题）：

| 作业题 | 对应小节 | 核心知识点 |
|--------|----------|-----------|
| \`corsHeaders\` | §19.1 | 允许的 Origin 才回 CORS 头 |
| \`wrapError\` | §19.2 | unknown → message |
| \`logLine\` | §19.3 | 访问日志一行 |
| \`authHeaderOk\` | §19.4 | Bearer token |
| \`onErrorPayload\` | §19.5 | 统一错误 JSON + 状态码 |
| \`composeMiddlewareOrder\` | §19.6 | 洋葱顺序（综合） |

本地文件：\`local/m4/ch19/assignment.ts\`（改 TODO）、\`app.ts\`（完整 Hono，不用改）、\`assignment.test.ts\`。

---`,
    [],
  ),
  sec(
    "sec-path",
    "⏱️ 学习路径：费曼五步（约 50–70 分钟）",
    null,
    `| 步 | 你要做 | 在哪做 |
|----|--------|--------|
| ① 预览猜（2 分钟） | 猜 CORS 预检、Filter 进出、错误要不要带 stack | 本页 ① |
| ② 先动手 | 打开 \`local/m4/ch19/assignment.ts\` 改 TODO | 仓库 local/ |
| ③ 提取+反馈 | \`bun test local/m4/ch19\` 看红绿 | 终端 |
| ④ 费曼（2 分钟） | 大白话讲清「为什么 * 不能配 cookie」 | 本页 ④ |
| ⑤ 存闪卡 | 章末闪卡标复习日期 | 闪卡 |

> 💡 网页这一章是只读的。不要在浏览器里改代码。\`app.ts\` 已经接好 CORS / 鉴权 / \`onError\`，你把 6 个纯函数写对，HTTP 测试也会绿。
> \`onErrorPayload\` **必须调用** \`wrapError\`。\`composeMiddlewareOrder\` 退出要用 reverse。

---`,
    [],
  ),
  sec(
    "sec-guess",
    "① 预览猜（2 分钟 · 激活你的 Java / Python 直觉）",
    null,
    `先别看答案，凭经验猜一猜（猜错没关系）：

1. 课程站在 \`http://localhost:5173\`，商品 API 在另一端口。浏览器为什么先发 \`OPTIONS\`？这和 Spring MVC 的一次 GET 一样吗？
2. Servlet \`Filter\` 里 \`chain.doFilter\` 之后还能改响应吗？中间件是「管道」还是「洋葱」？
3. CORS 头写成 \`Access-Control-Allow-Origin: *\`，同时又 \`Allow-Credentials: true\` 带 cookie，浏览器会怎样？
4. Java 的 \`catch (Exception e)\` 拿到的一定是 \`Exception\`。TypeScript 的 \`catch (e)\` 呢？\`e.stack\` 能直接 \`c.json\` 给前端吗？
5. \`Authorization: Bearer shop-secret\` 多一个空格，算通过吗？
6. \`throw new Error("UNAUTHORIZED")\` 应该 401 还是 500？\`throw new Error("boom")\` 呢？

> 猜完，带着验证心态进入正文。第 2、3、4 题是本章的 🔴。

---`,
    [],
  ),
  sec(
    "sec-world",
    "Filter、CORS 预检、统一错误体 🔴",
    null,
    `Ch17 已经会 \`app.get\` / \`c.json\`。商品列表给**课程站**用时，浏览器会拦跨域：不是 API 自己崩了，是同源策略。再叠一层后台 \`/admin\`，还要把 \`throw\` 收成 JSON——这就是 Filter + CORS + \`@ControllerAdvice\` 三件事。

| | Java | Python | 本章 |
|---|---|---|---|
| 横切 | Servlet \`Filter\` / \`FilterChain.doFilter\` | FastAPI \`middleware\` | \`app.use\`：\`await next()\` 前进，返回后还能改响应 |
| 跨域 | Filter 里 \`setHeader\`，预检 OPTIONS | CORSMiddleware | \`corsHeaders\` 算出头，OPTIONS 直接 204 |
| 错误 | \`@ControllerAdvice\` + \`@ExceptionHandler\` | \`exception_handler\` | \`app.onError\` + \`onErrorPayload\` |

### Java：Filter 是洋葱，Advice 收异常

\`\`\`java
public class CorsFilter implements Filter {
    public void doFilter(ServletRequest req, ServletResponse res, FilterChain chain)
            throws IOException, ServletException {
        HttpServletRequest http = (HttpServletRequest) req;
        HttpServletResponse resp = (HttpServletResponse) res;
        String origin = http.getHeader("Origin");
        if (ALLOW.contains(origin)) {
            resp.setHeader("Access-Control-Allow-Origin", origin); // 回显，不要 *
        }
        if ("OPTIONS".equals(http.getMethod())) {
            resp.setStatus(204);
            return;
        }
        chain.doFilter(req, res); // 进去 handler；return 之后还能再改 resp
    }
}

@ControllerAdvice
public class ApiErrors {
    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, String>> onError(Exception e) {
        return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        // 不要 e.getStackTrace() 给浏览器
    }
}
\`\`\`

### Python：middleware + exception handler

\`\`\`python
@app.middleware("http")
async def cors(request, call_next):
    if request.method == "OPTIONS":
        return Response(status_code=204)
    response = await call_next(request)
    origin = request.headers.get("origin", "")
    if origin in ALLOW:
        response.headers["access-control-allow-origin"] = origin
    return response

@app.exception_handler(Exception)
async def on_error(request, exc):
    return JSONResponse({"error": str(exc)}, status_code=500)
\`\`\`

### TypeScript / Hono：\`app.use\` + \`onError\`（\`app.ts\` 已写好）

\`\`\`ts
app.use("/*", async (c, next) => {
  const origin = c.req.header("Origin") ?? "";
  for (const [k, v] of Object.entries(corsHeaders(origin, ALLOW))) c.header(k, v);
  if (c.req.method === "OPTIONS") return c.body(null, 204);
  await next();
});

app.use("/admin/*", async (c, next) => {
  if (!authHeaderOk(c.req.header("Authorization"), TOKEN)) {
    throw new Error("UNAUTHORIZED");
  }
  await next();
});

app.onError((err, c) => {
  const p = onErrorPayload(err);
  return c.json(p.body, p.status as 401 | 403 | 500);
});
\`\`\`

作业测的是中间那几个**纯函数**。框架只负责读头、写头、把 throw 交给 \`onError\`。

\`\`\`mermaid
flowchart TD
    req["请求进入"] --> corsIn["cors 入"]
    corsIn --> authIn["auth 入"]
    authIn --> logIn["log 入"]
    logIn --> h["handler"]
    h --> logOut["log 出"]
    logOut --> authOut["auth 出"]
    authOut --> corsOut["cors 出"]
    corsOut --> res["响应离开"]

    style req fill:#FFE082,stroke:#F9A825,color:#1f1f1f
    style corsIn fill:#80DEEA,stroke:#0097A7,color:#1f1f1f
    style authIn fill:#80DEEA,stroke:#0097A7,color:#1f1f1f
    style logIn fill:#80DEEA,stroke:#0097A7,color:#1f1f1f
    style h fill:#A5D6A7,stroke:#388E3C,color:#1f1f1f
    style logOut fill:#CE93D8,stroke:#7B1FA2,color:#1f1f1f
    style authOut fill:#CE93D8,stroke:#7B1FA2,color:#1f1f1f
    style corsOut fill:#CE93D8,stroke:#7B1FA2,color:#1f1f1f
    style res fill:#A5D6A7,stroke:#388E3C,color:#1f1f1f
\`\`\`

外层 CORS **先入后出**：进 handler 之前就把允许的 Origin 写上；出来时响应已经带着这张头。鉴权夹在中间：没 token 直接 throw，走 \`onError\`，不会进 \`/admin/products\`。

### ❌ 生产用 \`*\` 还带 cookie（点到为止）

\`\`\`http
Access-Control-Allow-Origin: *
Access-Control-Allow-Credentials: true
\`\`\`

浏览器会拒：带凭证时 ACAO 必须是**具体 origin**。作业里的 \`*\` **只**用于无 cookie 的公开接口（\`corsHeaders\` 看到名单含 \`*\` 才写 \`*\`）。课程站这一条主线用允许名单**回显** \`http://localhost:5173\`。

### 本课怎么算「会了」

打开 \`local/m4/ch19/assignment.ts\`，\`bun test local/m4/ch19\`。纯函数全绿，再加：带 Origin 的 GET \`/health\` 有 ACAO；evil 没有；OPTIONS 204；无 token 的 \`/admin/products\` 401；Bearer 对了 200；\`/boom\` 500 且 body 只有 \`error\`。**全绿 = 这题掌握。**

---`,
    [],
  ),
  sec(
    "sec-19.1",
    "§19.1 CORS 头：允许才回显（对应：`corsHeaders`）🔴",
    "19.1",
    `浏览器对跨域 GET 可能先发 **OPTIONS 预检**（问「我能不能带 Authorization / Content-Type」）。API 要在预检上写 CORS 头并 204，真正的 GET 也要带同样的 ACAO，前端才能读 body。

\`\`\`mermaid
sequenceDiagram
    participant B as 课程站 5173
    participant A as 商品 API
    B->>A: OPTIONS /health
    A-->>B: 204 加 CORS 头
    B->>A: GET /health
    A-->>B: 200 加 CORS 头
\`\`\`

### Java：Filter 里 setHeader

回显 **该 origin**，不要图省事写 \`*\`（课程站这条线有明确前端）。名单没有就**不写**这组头——evil 拿到的响应没有 ACAO，浏览器会拦住脚本读 body。

### TypeScript：先 \`*\`，再精确匹配

\`\`\`ts
function corsHeaders(origin: string, allowList: string[]): Record<string, string> {
  const acao = allowList.includes("*")
    ? "*"
    : allowList.includes(origin)
      ? origin
      : null;
  if (acao === null) return {};
  return {
    "Access-Control-Allow-Origin": acao,
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type,Authorization",
  };
}

corsHeaders("http://localhost:5173", ["http://localhost:5173"]);
// ACAO 是 http://localhost:5173，不是 *

corsHeaders("https://evil.example", ["http://localhost:5173"]); // {}
corsHeaders("", ["http://localhost:5173"]);                     // {}
corsHeaders("https://evil.example", ["*"]);                     // ACAO *
\`\`\`

Methods / Headers 字符串必须和上面**完全一致**（逗号后面没有空格）。origin 空串不算匹配，除非名单里真有 \`""\` 或 \`*\`。

\`app.ts\` 里：OPTIONS 用这些头之后 \`c.body(null, 204)\`，不再 \`next()\`。

### ❌ / ✅

\`\`\`ts
// ❌ 一律 Access-Control-Allow-Origin: *（evil 也能读）
// ❌ 生产 * 还配 Allow-Credentials: true（浏览器拒）
// ❌ origin 不在名单仍回 * 或回显
// ❌ Methods 写成 "GET, POST, OPTIONS"（多了空格，对不上测试）
// ✅ 有 * 才 *；否则精确匹配才回显该 origin；否则 {}
\`\`\`

> ✅ **做 \`corsHeaders\`**：允许名单决定 ACAO。

---`,
    ["corsHeaders"],
  ),
  sec(
    "sec-19.2",
    "§19.2 unknown → 一句话（对应：`wrapError`）🟡",
    "19.2",
    `\`throw "NOPE"\`、\`throw null\`、\`throw new Error("boom")\` 在 JS 里都能发生。\`catch (e)\` 的 \`e\` 是 **unknown**（Ch06），不是 Java 的 \`Exception e\`。

给浏览器的只能是一句话。\`err.stack\` 带文件路径，属于内部细节。

\`\`\`ts
function wrapError(err: unknown): { message: string } {
  if (err instanceof Error) return { message: err.message };
  if (typeof err === "string") return { message: err };
  return { message: "INTERNAL" };
}

wrapError(new Error("boom"));     // { message: "boom" }
wrapError("NOPE");                // { message: "NOPE" }
wrapError(null);                  // { message: "INTERNAL" }
wrapError(1);                     // { message: "INTERNAL" }
wrapError({ message: "boom" });   // INTERNAL——不是 Error
\`\`\`

普通对象长得像 \`{ message: "boom" }\` 也不算 Error。Java 老手容易写成「有 message 字段就当异常」——本题要 \`instanceof Error\`。

### ❌ / ✅

\`\`\`ts
// ❌ return { message: String(err) }  → null 变成 "null"
// ❌ (err as any).message  → 普通对象会漏出内部字段
// ❌ 把 err.stack 拼进 message
// ✅ Error / string / 其它 INTERNAL
\`\`\`

> ✅ **做 \`wrapError\`**：三分支，给后面的统一错误体用。

---`,
    ["wrapError"],
  ),
  sec(
    "sec-19.3",
    "§19.3 访问日志一行（对应：`logLine`）🟢",
    "19.3",
    `Filter 进出时常见：打一行 \`GET /products 200\`。本题只拼字符串，不写文件、不调 \`console\`（测试要的是返回值）。

\`\`\`java
log.info(request.getMethod() + " " + request.getRequestURI() + " " + status);
\`\`\`

\`\`\`ts
function logLine(method: string, path: string, status: number): string {
  return \`\${method} \${path} \${status}\`;
}

logLine("GET", "/products", 200);  // "GET /products 200"
logLine("POST", "/products", 201); // "POST /products 201"
logLine("GET", "/nope", 404);      // "GET /nope 404"
\`\`\`

404 不要改成 \`"NOT FOUND"\`。三个字段原样，中间一个空格。

### ❌ / ✅

\`\`\`ts
// ❌ 把 404 翻译成文字
// ❌ status 补成 "0200"
// ✅ 模板字符串三个值
\`\`\`

> ✅ **做 \`logLine\`**：一行日志。

---`,
    ["logLine"],
  ),
  sec(
    "sec-19.4",
    "§19.4 Bearer 必须整段相等（对应：`authHeaderOk`）🟡",
    "19.4",
    `后台 \`GET /admin/products\` 要钥匙。HTTP 约定是：

\`\`\`
Authorization: Bearer shop-secret
\`\`\`

不是 Basic，不是裸 token，也不是 \`Bearer\` 后面两个空格。

\`\`\`java
String h = request.getHeader("Authorization");
boolean ok = ("Bearer " + expected).equals(h); // 精确，不要 startsWith 完事
\`\`\`

\`\`\`ts
function authHeaderOk(header: string | undefined, expectedToken: string): boolean {
  return header === \`Bearer \${expectedToken}\`;
}

authHeaderOk("Bearer shop-secret", "shop-secret"); // true
authHeaderOk(undefined, "shop-secret");            // false
authHeaderOk("", "shop-secret");                   // false
authHeaderOk("Bearer", "shop-secret");             // false
authHeaderOk("Bearer ", "shop-secret");            // false（token 是空串，不是 shop-secret）
authHeaderOk("Basic x", "shop-secret");            // false
authHeaderOk("Bearer  shop-secret", "shop-secret"); // false（两个空格）
\`\`\`

\`app.ts\` 里鉴权失败 \`throw new Error("UNAUTHORIZED")\`，交给 §19.5，不要在中间件里自己 \`c.json\`。

### ❌ / ✅

\`\`\`ts
// ❌ header.includes(expectedToken)  → "Bearer wrong-shop-secret" 也会过
// ❌ trim / 忽略大小写  → 作业要精确
// ❌ 只检查 startsWith("Bearer")
// ✅ === \`Bearer \${expectedToken}\`
\`\`\`

> ✅ **做 \`authHeaderOk\`**：整段相等。

---`,
    ["authHeaderOk"],
  ),
  sec(
    "sec-19.5",
    "§19.5 统一错误 JSON（对应：`onErrorPayload`）🔴",
    "19.5",
    `Spring \`@ControllerAdvice\` 的价值：所有 handler / Filter 抛的异常，出口长一个样。Hono 是 \`app.onError\`。

本题**简化规则**（按这个测，不要去读对象上的 \`status\` 字段）：

| \`wrapError(err).message\` | status | body |
|---|---|---|
| \`"UNAUTHORIZED"\` | 401 | \`{ error: "UNAUTHORIZED" }\` |
| \`"FORBIDDEN"\` | 403 | \`{ error: "FORBIDDEN" }\` |
| 其它 | 500 | \`{ error: <那句 message> }\` |

所以 \`new Error("UNAUTHORIZED")\` → 401；\`new Error("boom")\` → 500 且 error 是 \`"boom"\`；\`123\` → 500 \`"INTERNAL"\`（因为 wrapError 走其它分支）。

**必须调用 \`wrapError\`**：字符串 \`"UNAUTHORIZED"\` 也要 401。只写 \`err instanceof Error && err.message === "UNAUTHORIZED"\` 会漏。

\`\`\`ts
function onErrorPayload(err: unknown): { status: number; body: { error: string } } {
  const { message } = wrapError(err);
  const status = message === "UNAUTHORIZED" ? 401
    : message === "FORBIDDEN" ? 403
    : 500;
  return { status, body: { error: message } };
}
\`\`\`

body **只有** \`error\` 一键。不要 \`stack\`、不要 \`name\`。\`/boom\` 的 HTTP 测试会查 \`{ error: "boom" }\`。

有人喜欢 \`Object.assign(new Error("UNAUTHORIZED"), { status: 401 })\` 这种 HTTPException。本题不看 \`status\` 字段——看 message 码。教程规定形状就是：\`throw new Error("UNAUTHORIZED")\` / \`"FORBIDDEN"\` / 其它。

### ❌ / ✅

\`\`\`ts
// ❌ c.json({ error: String(err), stack: err.stack })
// ❌ 一律 500
// ❌ 自己再写一遍 Error/string 分支，不调用 wrapError
// ✅ wrapError → 三档状态码；body 只有 error
\`\`\`

> ✅ **做 \`onErrorPayload\`**：调用 wrapError，401 / 403 / 500。

---`,
    ["onErrorPayload"],
  ),
  sec(
    "sec-19.6",
    "§19.6 洋葱顺序（对应：`composeMiddlewareOrder`）🔴",
    "19.6",
    `综合题：把 FilterChain 的「先入后出」变成一条数组。CORS 最外层：记录里第一个 \`cors>\`、最后一个 \`<cors\`。鉴权夹在中间。

进入：每个 name 推 \`\${name}>\`；然后固定 \`"handler"\`；退出：把栈 reverse，每个 \`<\${name}\`。

\`\`\`ts
function composeMiddlewareOrder(stack: string[]): string[] {
  const enter = stack.map((name) => \`\${name}>\`);
  const leave = [...stack].reverse().map((name) => \`<\${name}\`);
  return [...enter, "handler", ...leave];
}

composeMiddlewareOrder(["cors", "auth", "log"]);
// ["cors>","auth>","log>","handler","<log","<auth","<cors"]

composeMiddlewareOrder([]);        // ["handler"]
composeMiddlewareOrder(["cors"]);  // ["cors>","handler","<cors"]
\`\`\`

空栈也要有 handler（请求总得有人处理）。\`reverse\` 前先拷贝，**不要 mutate** 传入的 \`stack\`。

对照本节开头那张洋葱图：黄是进入，紫是退出，绿是 handler。

### ❌ / ✅

\`\`\`ts
// ❌ 进出都按原序：["cors>","auth>","handler","<cors","<auth"] 错了
// ❌ 忘记 handler
// ❌ stack.reverse() 改了原数组
// ✅ 进入原序，退出 reverse，中间 handler
\`\`\`

> ✅ **做 \`composeMiddlewareOrder\`**：洋葱记录。

---`,
    ["composeMiddlewareOrder"],
  ),
  sec(
    "sec-pits",
    "⚠️ Java / Python 老手几个坑",
    null,
    `1. **把 CORS 当成服务器自己的安全墙。** ACAO 是给浏览器看的。evil 用 curl 照样打得到。后台鉴权是 \`authHeaderOk\`，不是 CORS。
2. **生产 \`*\` 配 cookie。** 浏览器拒。作业 \`*\` 只覆盖无凭证。课程站主线回显 origin。
3. **Filter 当成单向管道。** \`await next()\` 之后还能改响应——洋葱。
4. **\`catch (e)\` 当 Java Exception。** 是 unknown。\`wrapError\` 三分支。
5. **\`e.stack\` 进 JSON。** 路径和代码行号不要给课程站。
6. **Bearer 用 includes / trim。** 必须整段 \`Bearer \${token}\`。
7. **鉴权失败自己 \`c.json(401)\`。** 本课约定 throw \`"UNAUTHORIZED"\`，让 \`onError\` 统一出口。
8. **\`onErrorPayload\` 不调用 \`wrapError\`。** 字符串码会对不上。
9. **洋葱退出不 reverse。** 外层 CORS 必须最后出来。
10. **作业 import 框架。** JSON 作业是纯函数；真 Hono 只在 \`local/m4/ch19/app.ts\`。

---`,
    [],
  ),
  sec(
    "sec-homework",
    "📝 本章作业",
    null,
    `上面 6 个函数按节交错出现。每个注释里有【场景】【转换点】、示例和提示。

**完成方式**：打开仓库 \`local/m4/ch19/assignment.ts\`，把 \`throw new Error("TODO")\` 换成实现，然后：

\`\`\`bash
bun test local/m4/ch19
\`\`\`

\`app.ts\` 不用改（CORS 中间件、\`/admin\` 鉴权、\`onError\` 已接好）。不要 \`listen\` 端口，测试用 \`app.request\`。

卡住就回对应 §：\`corsHeaders\` → §19.1，\`onErrorPayload\` → §19.5（请调用 wrapError），\`composeMiddlewareOrder\` → §19.6（请 reverse）。

---`,
    [],
  ),
  sec(
    "sec-check",
    "✅ 自测：你真的掌握了吗？",
    null,
    `- [ ] 能说清 OPTIONS 预检和真正 GET 各干什么
- [ ] 5173 回显 origin；evil 得到 {}；\`*\` 只用于无凭证
- [ ] \`wrapError\`：Error / string / INTERNAL，普通对象不是 Error
- [ ] \`Bearer shop-secret\` 精确匹配，多余空格 false
- [ ] UNAUTHORIZED → 401，boom → 500，body 没有 stack
- [ ] 洋葱：\`cors>\` 最先、\`<cors\` 最后
- [ ] \`bun test local/m4/ch19\` 全绿

---`,
    [],
  ),
  sec(
    "sec-feynman",
    "🎓 费曼挑战",
    null,
    `用大白话讲给「Java 同事」听。讲不清 = 还没真懂。

任选一题（1–2 分钟）：

1. 「课程站跨域打商品 API，为什么常常先看到 OPTIONS？Filter 里写 \`*\` 还带 cookie 为什么是错的？」— 卡壳重读总述 + §19.1
2. 「为什么不能把 \`e.printStackTrace()\` 那套 JSON 给浏览器？\`catch\` 在 TS 里为什么不是 Exception？」— 卡壳重读 §19.2 + §19.5
3. 「CORS、鉴权、handler 谁先跑谁后跑？和 \`FilterChain.doFilter\` 怎么对应？」— 卡壳重读总述洋葱图 + §19.6

---`,
    [],
  ),
  sec(
    "sec-next",
    "⏭️ 下一步",
    null,
    `Ch19 掌握后，跨域、鉴权和统一错误出口就齐了。下一章是 **Ch20 · 轻量持久化**：还是这条商品 API，用 SQLite 记住库存，对照「内存数组」和真正的表。中间件不用再写一遍；CRUD 接到现在这套 \`app.use\` / \`onError\` 外面即可。`,
    [],
  ),
];

const tutorialMd = `# Ch19 · 中间件、CORS、错误处理

${sections
  .map((s) => (s.heading ? `## ${s.heading}\n\n${s.body}` : s.body))
  .join("\n\n")}
`;

const reviewMd = `# Ch19 · 记忆闪卡

> 先回忆，再翻答案。连续 2 次秒答 → 退役。

## 🔖 闪卡

| # | 正面（问题） | 背面（答案） | 掌握 |
|---|---|---|---|
| 1 | 课程站 \`http://localhost:5173\` 打商品 API，CORS 头的 ACAO 应该写成 \`*\` 还是回显 origin？evil 呢？ | 允许名单精确匹配 → 回显该 origin。evil 不在名单 → 不写 CORS 头（\`{}\`）。\`*\` 只给无凭证的公开接口。 | ⬜ |
| 2 | 生产环境 ACAO=\`*\` 再加 \`Allow-Credentials: true\` 会怎样？ | 浏览器拒绝。带 cookie 时必须回显具体 origin。作业里的 \`*\` 约定是无 cookie。 | ⬜ |
| 3 | \`Authorization\` 怎样才算过？\`Bearer\` 后面两个空格呢？ | 整段精确等于 \`Bearer \${token}\`。多余空格、Basic、缺头、大小写都不行。 | ⬜ |
| 4 | \`throw new Error("UNAUTHORIZED")\` 和 \`throw new Error("boom")\` 状态码各是什么？ | 先 wrapError 看 message。UNAUTHORIZED → 401；boom → 500 且 error 是 boom。123 → 500 INTERNAL。 | ⬜ |
| 5 | 为什么不要把 \`err.stack\` 放进 JSON 给课程站？ | stack 有文件路径和代码行，是内部细节。客户端只要 \`{ error: message }\`。对照 \`@ControllerAdvice\` 只回安全字段。 | ⬜ |
| 6 | 中间件栈 \`["cors","auth","log"]\` 的进出顺序？空栈呢？ | \`cors>\` \`auth>\` \`log>\` \`handler\` \`<log\` \`<auth\` \`<cors\`。空栈仍有 \`handler\`。外层 CORS 先入后出。 | ⬜ |
| 7 | OPTIONS 预检成功返回什么状态？真正的 GET /health 呢？ | 预检 204 + CORS 头；GET 200 + 同样的 ACAO。evil Origin 的 GET 可以 200 但没有 ACAO。 | ⬜ |
| 8 | \`wrapError({ message: "boom" })\` 为什么是 INTERNAL？ | 普通对象不是 \`instanceof Error\`。不要鸭式辨认 message 字段。string 才原样。 | ⬜ |
| 9 | Hono 的 \`app.use\` / \`onError\` 分别对照 Java 什么？ | \`app.use\` ≈ Servlet Filter / FilterChain；\`onError\` ≈ \`@ControllerAdvice\`。FastAPI 是 middleware + exception_handler。 | ⬜ |

## 🎓 费曼自检

- [ ] 能说清 CORS 回显 vs \`*\` vs 不写头
- [ ] 能说清 Bearer 精确、401 vs 500、不要 stack
- [ ] 能说清洋葱先入后出，对照 FilterChain
`;

const chapter = {
  id: "ch19",
  num: "19",
  title: "中间件、CORS、错误处理",
  runMode: "local" as const,
  tutorialMd,
  assignment,
  testName: "ch19_assignment",
  testSource,
  reviewMd,
  interleaved: true,
  sections,
  functions,
  preamble,
  localHint: "bun test local/m4/ch19",
};

const out = join(dirname(fileURLToPath(import.meta.url)), "../src/content/chapters/ch19.json");
mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, JSON.stringify(chapter, null, 2) + "\n");
console.log("wrote", out);
