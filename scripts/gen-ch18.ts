/**
 * 生成 src/content/chapters/ch18.json
 * 运行：bun scripts/gen-ch18.ts
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const preamble = `/**
 * Ch18 作业：HTTP 边界用 zod 校验 path / query / body。
 *
 * 场景：创建、搜索商品。非法 id、空 q、缺 sku 的 body 都是 400，不要 500。
 * Ch07 已教 z.object / safeParse；本章接到路径 / 查询 / JSON body 这些字符串边界。
 *
 * 本页已注入全局 z（zod），不要写 import。真实 local/m4/ch18/assignment.ts
 * 需要 import { z } from "zod"；本页运行器会剥掉 import 行。
 *
 * 全绿 = 你掌握了 Ch18。本地命令：bun test local/m4/ch18
 */

type SearchQuery = { q: string; limit: number };
type CreateBody = { name: string; price: number; sku: string; stock: number };
type ValidationFail = { error: "VALIDATION"; fields: string[] };`;

const functions = [
  {
    name: "parseIdParam",
    testSuite: "parseIdParam",
    skeleton: `/**
 * 【场景】GET /products/:id。路径参数永远是 string。
 * 「abc」「0」不是合法商品 id，不要 Number("abc") → NaN 再 500。
 *
 * 【转换点】用 zod schema，不要手写 if。行为与 Ch17 的 parseIdParam 对齐，
 * 但必须走 schema：/^\\d+$/ 且整数 ≥ 1。失败返回 null，不要 throw。
 *
 * 任务：合法数字串 → number；否则 null。
 * 示例：
 *   "1" → 1；"10" → 10
 *   "0" / "abc" / "1.5" / "" / "12abc" → null
 *
 * 提示：z.string().regex(/^\\d+$/).transform(Number).pipe(z.number().int().min(1))
 *       然后 safeParse。不要把 param 直接当 number。
 */
export function parseIdParam(raw: string): number | null {
  throw new Error("TODO");
}`,
  },
  {
    name: "parseSearchQuery",
    testSuite: "parseSearchQuery",
    skeleton: `/**
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
}`,
  },
  {
    name: "parseCreateBody",
    testSuite: "parseCreateBody",
    skeleton: `/**
 * 【场景】POST /products 的 JSON body：上架一件商品。缺 sku、price 为 0、
 * sku 写成小写 kb-001，都是客户端错，400，不是 500。
 *
 * 【转换点】name trim 后非空；price 是 number 且 > 0（75.5 合法，0 不合法）；
 * sku 匹配 /^[A-Z]{2}-\\d{3}$/；stock 整数 ≥ 0（0 = 缺货，合法）。
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
}`,
  },
  {
    name: "errorToJson",
    testSuite: "errorToJson",
    skeleton: `/**
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
}`,
  },
  {
    name: "validateOr400",
    testSuite: "validateOr400",
    skeleton: `/**
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
}`,
  },
  {
    name: "patchBody",
    testSuite: "patchBody",
    skeleton: `/**
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
}`,
  },
];

const assignment = `${preamble}

${functions.map((f) => f.skeleton).join("\n\n")}
`;

const testSource = `const KEYBOARD = {
  name: "机械键盘",
  price: 599,
  sku: "KB-001",
  stock: 120,
};

const BOOK = {
  name: "设计模式",
  price: 75.5,
  sku: "BK-005",
  stock: 200,
};

describe("parseIdParam", () => {
  it('"1" → 1', () => {
    expect(parseIdParam("1")).toBe(1);
  });
  it('"10" → 10（防硬编码 1）', () => {
    expect(parseIdParam("10")).toBe(10);
  });
  it("非法：0 / abc / 1.5 / 空 / 12abc", () => {
    expect(parseIdParam("0")).toBeNull();
    expect(parseIdParam("abc")).toBeNull();
    expect(parseIdParam("1.5")).toBeNull();
    expect(parseIdParam("")).toBeNull();
    expect(parseIdParam("12abc")).toBeNull();
  });
  it("失败不 throw", () => {
    expect(parseIdParam("nope")).toBeNull();
  });
});

describe("parseSearchQuery", () => {
  it("只有 q → limit 缺省 10", () => {
    expect(parseSearchQuery({ q: "键盘" })).toEqual({ q: "键盘", limit: 10 });
  });
  it("q + limit 数字", () => {
    expect(parseSearchQuery({ q: "键盘", limit: 5 })).toEqual({ q: "键盘", limit: 5 });
  });
  it("另一词 + 数字字符串 limit（防硬编码）", () => {
    expect(parseSearchQuery({ q: "鼠标", limit: "20" })).toEqual({ q: "鼠标", limit: 20 });
  });
  it("空白 q / 无 q → null", () => {
    expect(parseSearchQuery({ q: "  " })).toBeNull();
    expect(parseSearchQuery({ limit: 10 })).toBeNull();
  });
  it("limit 0 / 101 / x → 整单 null", () => {
    expect(parseSearchQuery({ q: "键盘", limit: 0 })).toBeNull();
    expect(parseSearchQuery({ q: "键盘", limit: 101 })).toBeNull();
    expect(parseSearchQuery({ q: "键盘", limit: "x" })).toBeNull();
  });
  it("多余键忽略；q 会 trim", () => {
    expect(parseSearchQuery({ q: " 键盘 ", extra: true })).toEqual({ q: "键盘", limit: 10 });
  });
});

describe("parseCreateBody", () => {
  it("合法机械键盘", () => {
    expect(parseCreateBody(KEYBOARD)).toEqual(KEYBOARD);
  });
  it("另一件：设计模式 75.5（防硬编码）", () => {
    expect(parseCreateBody(BOOK)).toEqual(BOOK);
  });
  it("stock 0 合法；price 0 / 小写 sku 非法", () => {
    expect(parseCreateBody({ ...KEYBOARD, stock: 0 })).toEqual({ ...KEYBOARD, stock: 0 });
    expect(parseCreateBody({ ...KEYBOARD, price: 0 })).toBeNull();
    expect(parseCreateBody({ ...KEYBOARD, sku: "kb-001" })).toBeNull();
  });
  it("非 object / 缺字段 / 类型错 → null", () => {
    expect(parseCreateBody(null)).toBeNull();
    expect(parseCreateBody("nope")).toBeNull();
    expect(parseCreateBody([])).toBeNull();
    expect(parseCreateBody({ name: "机械键盘", price: 599, sku: "KB-001" })).toBeNull();
    expect(parseCreateBody({ ...KEYBOARD, price: "599" })).toBeNull();
  });
});

describe("errorToJson", () => {
  it("sku 再 price，保序", () => {
    expect(errorToJson([{ path: ["sku"] }, { path: ["price"] }])).toEqual({
      error: "VALIDATION",
      fields: ["sku", "price"],
    });
  });
  it("空 issues；空 path → 空字符串字段", () => {
    expect(errorToJson([])).toEqual({ error: "VALIDATION", fields: [] });
    expect(errorToJson([{ path: [] }])).toEqual({ error: "VALIDATION", fields: [""] });
  });
  it("去重保序；嵌套 path 用点拼接", () => {
    expect(
      errorToJson([{ path: ["sku"] }, { path: ["sku"] }, { path: ["price"] }]),
    ).toEqual({ error: "VALIDATION", fields: ["sku", "price"] });
    expect(errorToJson([{ path: ["items", 0, "sku"] }])).toEqual({
      error: "VALIDATION",
      fields: ["items.0.sku"],
    });
  });
});

describe("validateOr400", () => {
  it("success → 200 + data", () => {
    expect(validateOr400({ success: true, data: KEYBOARD })).toEqual({
      status: 200,
      data: KEYBOARD,
    });
  });
  it("另一件 success（防硬编码）", () => {
    expect(validateOr400({ success: true, data: BOOK }).status).toBe(200);
    expect(validateOr400({ success: true, data: { q: "鼠标", limit: 3 } })).toEqual({
      status: 200,
      data: { q: "鼠标", limit: 3 },
    });
  });
  it("fail → 400，body 走 errorToJson", () => {
    const issues = [{ path: ["sku"] }, { path: ["price"] }];
    expect(validateOr400({ success: false, error: { issues } })).toEqual({
      status: 400,
      body: errorToJson(issues),
    });
  });
});

describe("patchBody", () => {
  it("空对象等于 current", () => {
    expect(patchBody(KEYBOARD, {})).toEqual(KEYBOARD);
  });
  it("改 stock 0 合法；改 price 0 非法", () => {
    expect(patchBody(KEYBOARD, { stock: 0 })).toEqual({ ...KEYBOARD, stock: 0 });
    expect(patchBody(KEYBOARD, { price: 0 })).toBeNull();
  });
  it("改另一件的 name（防硬编码键盘）且不 mutate", () => {
    const frozen = Object.freeze({ ...BOOK });
    expect(patchBody(frozen, { name: "重构" })).toEqual({ ...BOOK, name: "重构" });
    expect(frozen).toEqual(BOOK);
  });
  it("非 object / 数组 / null → null", () => {
    expect(patchBody(KEYBOARD, null)).toBeNull();
    expect(patchBody(KEYBOARD, [])).toBeNull();
    expect(patchBody(KEYBOARD, "nope")).toBeNull();
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
    `> **预计**：1 天 ｜ **前置**：Ch07（zod）、Ch17（Hono 第一个 API）
> **目标**：把 Ch07 的 \`z.object\` / \`safeParse\` 接到 **HTTP 边界**：path、query、JSON body。非法输入 **400**，不要 500。
> 你 15 年 Java：\`@PathVariable\` + Bean Validation；Python：Pydantic 的 \`Path\` / \`Query\` / \`Body\`。本章是同一扇门，换了框架。

> 📐 **本教程的契约**：§18.1–§18.6 精确对应 6 道作业。不重讲整个 Ch07，只调用。不讲中间件（Ch19）、不讲数据库（Ch20）。
> 🔒 **本章是 local**：打开 \`local/m4/ch18/assignment.ts\`，命令 \`bun test local/m4/ch18\`。

---`,
    [],
  ),
  sec(
    "sec-map",
    "🗺️ 本章地图",
    null,
    `主线：**创建 / 搜索商品**。路径 id 不合法、搜索词是空格、POST 缺 \`sku\`，一律 400，不要把 ZodError 炸成 500。

读完这章 + 完成作业，你将能够：

- 说清 \`c.req.param("id")\` 为什么永远是 string，为什么不能当 number 用
- 对照 Pydantic \`Query\` / Bean Validation，给 query 和 body 各写一份 schema
- 把 Zod issues 收成 \`{ error: "VALIDATION", fields }\`（400，不是 404）
- 用 \`safeParse\` + \`validateOr400\` 替代 handler 里直接 throw
- PATCH 时先浅合并再整体校验

**作业 ↔ 教程对应表**（学哪节，就去做哪题）：

| 作业题 | 对应小节 | 核心知识点 |
|--------|----------|-----------|
| \`parseIdParam\` | §18.1 | 路径 id 的 zod（与 Ch17 行为对齐，必须走 schema） |
| \`parseSearchQuery\` | §18.2 | 查询串 q + limit |
| \`parseCreateBody\` | §18.3 | POST body |
| \`errorToJson\` | §18.4 | Zod issues → 400 体 |
| \`validateOr400\` | §18.5 | safeParse 结果 → 200 或 400 |
| \`patchBody\` | §18.6 | Partial 补丁合并后再校验 |

> ⚠️ **网页 JSON 作业不要 \`import { z }\`**（运行器已注入）。**本地 \`assignment.ts\` 必须 \`import { z } from "zod"\`。** 两边都不要 import hono：Hono 只出现在 \`app.ts\`。

---`,
    [],
  ),
  sec(
    "sec-path",
    "⏱️ 学习路径：费曼五步（约 60–90 分钟）",
    null,
    `| 步 | 你要做 | 在哪做 |
|----|--------|--------|
| ① 预览猜（2 分钟） | 先猜非法 id 是 400 还是 404 | 本页 ① |
| ② 先动手 | 打开 \`local/m4/ch18/assignment.ts\` 改 TODO | 仓库 local/ |
| ③ 提取+反馈 | \`bun test local/m4/ch18\` 看红绿 | 终端 |
| ④ 费曼（2 分钟） | 大白话讲清「param 是 string」 | 本页 ④ |
| ⑤ 存闪卡 | 章末闪卡标复习日期 | 闪卡 |

> 💡 先扫 ① → 写作业 → **哪题卡了，回对应 §** → 再跑。\`patchBody\` 要调用 \`parseCreateBody\`，建议按顺序做。
> \`app.ts\` 已经写好：你主要填纯函数。不要在 app 里 \`listen\` 端口，测试用 \`app.request\`。

---`,
    [],
  ),
  sec(
    "sec-guess",
    "① 预览猜（2 分钟 · 激活你的 Java / Pydantic 直觉）",
    null,
    `先别看答案，凭经验猜一猜（猜错没关系）：

1. \`c.req.param("id")\` 的类型是 number 还是 string？\`Number("12abc")\` 会怎样？
2. \`GET /products/abc\` 应该 400、404 还是 500？和「id=99 找不到商品」是同一件事吗？
3. FastAPI 里 \`q: str = Query(min_length=1)\`、Spring \`@RequestParam\`，对应本章哪一个函数？
4. POST body 缺 \`sku\`，handler 里如果直接 \`body.sku.toUpperCase()\` 会怎样？
5. \`schema.parse(body)\` 抛错 vs \`safeParse\`，哪一种更容易变成 500？
6. PATCH \`{ price: 0 }\` 只改一个字段，为什么还要再跑一遍完整 schema？

> 猜完，带着验证心态进入正文。第 1、2 题是整章的 🔴。

---`,
    [],
  ),
  sec(
    "sec-world",
    "世界地图：校验发生在 HTTP 门口 🔴",
    null,
    `Ch07 教过：TS 类型蒸发，JSON 入口要 zod。Ch17 教过：Hono 把 Request 收成 \`c.json\`。本章把两件事 **焊在边界上**。

| | Java | Python FastAPI | 本章 TypeScript |
|---|---|---|---|
| 路径参数 | \`@PathVariable @Min(1) Long id\` | \`id: int = Path(ge=1)\` | \`parseIdParam\` + zod |
| 查询串 | \`@RequestParam @Size(min=1)\` | \`q: str = Query(min_length=1)\` | \`parseSearchQuery\` |
| JSON body | \`@Valid @RequestBody\` | Pydantic \`BaseModel\` | \`parseCreateBody\` |
| 失败状态 | \`MethodArgumentNotValidException\` → 400 | \`RequestValidationError\` → 422/400 | \`errorToJson\` → **400** |

FastAPI 默认校验失败是 **422**。本题约定跟很多内部 API 一样：**400 + \`VALIDATION\`**。不要 500，也不要把格式错误当成 404。

### ❌ 信路径参数是 number

\`\`\`ts
// ❌ param 是 string。Number("12abc") === 12，尾巴被吞掉
app.get("/products/:id", (c) => {
  const id = Number(c.req.param("id"));
  return c.json({ id }); // "abc" → NaN → 后续 500
});
\`\`\`

\`\`\`ts
// ✅ 先走 parseIdParam（zod）；失败明确 400
app.get("/products/:id", (c) => {
  const id = parseIdParam(c.req.param("id"));
  if (id === null) return c.json(errorToJson([{ path: ["id"] }]), 400);
  return c.json({ id });
});
\`\`\`

### 非法 JSON → 400；合法 → handler

\`\`\`mermaid
flowchart TD
    A["请求进入 Hono"] --> B{"JSON / 参数合法?"}
    B -->|"否"| C["400 VALIDATION"]
    B -->|"是"| D["handler 使用解析后的数据"]

    style A fill:#FFE082,stroke:#F9A825,color:#1f1f1f
    style B fill:#80DEEA,stroke:#0097A7,color:#1f1f1f
    style C fill:#EF9A9A,stroke:#C62828,color:#1f1f1f
    style D fill:#A5D6A7,stroke:#388E3C,color:#1f1f1f
\`\`\`

\`app.ts\` 里 POST 用 \`await c.req.json()\`：JSON 都不是合法对象时 catch 成 400，不要让框架把 SyntaxError 变成 500。

> 🤯 **转换点**：400 = 你送来的形状不对（门卫拒收）。404 = 形状对了，货架上没有这件。Ch17 把 \`abc\` 收成 404 是「找不到」；本章把非法 id 收成 **400**，因为根本不是一个 id。

---`,
    [],
  ),
  sec(
    "sec-18.1",
    "§18.1 路径 id：string → number（对应：`parseIdParam`）🔴",
    "18.1",
    `Ch17 的 \`parseIdParam\` 行为：整段 \`/^\\d+$/\` 且 ≥ 1，否则 null。本章 **必须走 zod**，不要再手写 \`if\`。

### Java / Pydantic

\`\`\`java
@GetMapping("/products/{id}")
Product get(@PathVariable @Min(1) long id) { ... }
// "abc" 根本进不了 long；"0" 触发 @Min → 400
\`\`\`

\`\`\`python
@app.get("/products/{id}")
def get(id: int = Path(ge=1)): ...
\`\`\`

### TypeScript：schema + safeParse，失败 null

\`\`\`ts
function parseIdParam(raw: string): number | null {
  const schema = z
    .string()
    .regex(/^\\d+$/)
    .transform(Number)
    .pipe(z.number().int().min(1));
  const r = schema.safeParse(raw);
  return r.success ? r.data : null;
}

parseIdParam("1");     // 1
parseIdParam("10");    // 10
parseIdParam("0");     // null
parseIdParam("abc");   // null
parseIdParam("1.5");   // null
parseIdParam("");      // null
parseIdParam("12abc"); // null（不要 parseInt 丢尾巴）
\`\`\`

不要 throw：handler 要自己变成 400。Ch07 的 \`parse\` 会抛；**HTTP 门口用 safeParse**。

### ❌ / ✅

\`\`\`ts
// ❌ Number(raw) 或 parseInt(raw, 10)——"12abc" 会变成 12
// ❌ 直接 c.req.param("id") as unknown as number
// ❌ schema.parse(raw) 抛给框架变 500
// ✅ regex + transform + pipe；safeParse；失败 null
\`\`\`

> ✅ **做 \`parseIdParam\`**：zod 走一遍。测试会查 \`"10"\`（防硬编码 1）和 \`"12abc"\`。

---`,
    ["parseIdParam"],
  ),
  sec(
    "sec-18.2",
    "§18.2 查询串 q + limit（对应：`parseSearchQuery`）🟡",
    "18.2",
    `搜索商品：\`q\` 必填（trim 后至少 1 个字），\`limit\` 可缺省为 10。查询串里的 \`limit=5\` 是 **字符串** \`"5"\`。

### Pydantic Query

\`\`\`python
class Search(BaseModel):
    q: str = Field(min_length=1)
    limit: int = Field(default=10, ge=1, le=100)
\`\`\`

### TypeScript

\`\`\`ts
parseSearchQuery({ q: "键盘" });              // { q: "键盘", limit: 10 }
parseSearchQuery({ q: "键盘", limit: 5 });    // limit 5
parseSearchQuery({ q: "鼠标", limit: "20" }); // 数字字符串也行 → 20
parseSearchQuery({ q: "  " });                // null
parseSearchQuery({ limit: 10 });              // null（无 q）
parseSearchQuery({ q: "键盘", limit: 0 });    // null
parseSearchQuery({ q: "键盘", limit: 101 });  // null
parseSearchQuery({ q: "键盘", limit: "x" });  // null
parseSearchQuery({ q: " 键盘 ", extra: 1 });  // { q: "键盘", limit: 10 } 多余键忽略
\`\`\`

limit 一旦出现，必须能变成 **1–100 的整数**。0、101、\`"x"\` 不是「当缺省 10」，是 **整单拒绝**。

\`q\` 用 \`z.string().trim().min(1)\`，输出里的 q 是 trim 过的。

### ❌ / ✅

\`\`\`ts
// ❌ 缺 limit 时返回 { q } 没有 limit 键
// ❌ limit: "x" 当成 10
// ❌ 不 trim，"  " 当合法搜索词
// ✅ 缺省 10；坏 limit 整单 null；多余键剥掉
\`\`\`

> ✅ **做 \`parseSearchQuery\`**：\`z.object\` + optional default。测试会查 \`"鼠标"\` + \`"20"\`。

---`,
    ["parseSearchQuery"],
  ),
  sec(
    "sec-18.3",
    "§18.3 POST body（对应：`parseCreateBody`）🔴",
    "18.3",
    `上架商品。对照 Ch07 的商品形状，但 **创建体没有 id**（id 是服务器发的）。字段更严：价格必须 \> 0，sku 有格式。

### Java / Pydantic

\`\`\`java
public class CreateProduct {
    @NotBlank String name;
    @DecimalMin(value = "0", inclusive = false) BigDecimal price;
    @Pattern(regexp = "^[A-Z]{2}-\\\\d{3}$") String sku;
    @Min(0) int stock; // 0 = 缺货，合法
}
\`\`\`

### TypeScript

\`\`\`ts
parseCreateBody({ name: "机械键盘", price: 599, sku: "KB-001", stock: 120 });
// → 原样

parseCreateBody({ name: "设计模式", price: 75.5, sku: "BK-005", stock: 200 });
// → 75.5 合法（> 0 的 number，不一定是整数）

parseCreateBody({ ...keyboard, stock: 0 });  // ✅ 缺货
parseCreateBody({ ...keyboard, price: 0 });  // null
parseCreateBody({ ...keyboard, sku: "kb-001" }); // null（必须大写 + 格式）
parseCreateBody(null);    // null
parseCreateBody([]);      // null
parseCreateBody({ name: "机械键盘", price: 599, sku: "KB-001" }); // 缺 stock → null
parseCreateBody({ ...keyboard, price: "599" }); // 字符串不是 number → null
\`\`\`

不要 \`z.coerce.number()\` 把 \`"599"\` 收成数字：本题 body 来自 JSON，价格就应该是 number。

sku：\`/^[A-Z]{2}-\\d{3}$/\`，例如 \`KB-001\`、\`BK-005\`。

### ❌ / ✅

\`\`\`ts
// ❌ price: z.number() 接受 0（创建价不能是 0）
// ❌ stock: z.number().positive() 把缺货拒掉
// ❌ sku 不写正则，kb-001 也能过
// ✅ price .gt(0)；stock .int().min(0)；sku 正则；safeParse → null
\`\`\`

> ✅ **做 \`parseCreateBody\`**：四个字段一份 schema。测试会查设计模式 75.5 和 \`kb-001\`。

---`,
    ["parseCreateBody"],
  ),
  sec(
    "sec-18.4",
    "§18.4 issues → 400 JSON（对应：`errorToJson`）🟡",
    "18.4",
    `ZodError 很大。前端只要知道：这是校验失败，以及哪些字段。

### Spring / FastAPI

\`\`\`java
// BindingResult.getFieldErrors() → 字段名列表
\`\`\`

\`\`\`python
# RequestValidationError.errors() → loc 路径
\`\`\`

### TypeScript：path 拼接、去重保序

\`\`\`ts
errorToJson([{ path: ["sku"] }, { path: ["price"] }]);
// { error: "VALIDATION", fields: ["sku", "price"] }

errorToJson([]);                          // fields: []
errorToJson([{ path: [] }]);              // fields: [""]
errorToJson([{ path: ["sku"] }, { path: ["sku"] }, { path: ["price"] }]);
// ["sku", "price"] 去重但不要 sort

errorToJson([{ path: ["items", 0, "sku"] }]);
// ["items.0.sku"]
\`\`\`

空 path 变成 \`""\`，不是跳过。这是「整份 JSON 都坏了」（比如非法 JSON）时的占位。

### ❌ / ✅

\`\`\`ts
// ❌ 返回 ZodError 原对象
// ❌ fields 按字母排序（price 跑到 sku 前面）
// ❌ 重复 sku 留两项
// ✅ join(".")；includes 去重；插入序
\`\`\`

> ✅ **做 \`errorToJson\`**：纯字符串处理，不必调用 zod。

---`,
    ["errorToJson"],
  ),
  sec(
    "sec-18.5",
    "§18.5 safeParse → 200 或 400（对应：`validateOr400`）🟡",
    "18.5",
    `handler 里替代「直接 throw」的写法。Ch07 的 \`parse\` 适合工具参数必须合法；HTTP 入口更适合 **safeParse + 明确状态码**。

\`\`\`ts
function validateOr400<T>(
  parsed:
    | { success: true; data: T }
    | { success: false; error: { issues: Array<{ path: (string | number)[] }> } },
): { status: 200; data: T } | { status: 400; body: ValidationFail } {
  if (parsed.success) return { status: 200, data: parsed.data };
  return { status: 400, body: errorToJson(parsed.error.issues) };
}

validateOr400({ success: true, data: keyboard });
// { status: 200, data: keyboard }

validateOr400({ success: false, error: { issues: [{ path: ["sku"] }] } });
// { status: 400, body: { error: "VALIDATION", fields: ["sku"] } }
\`\`\`

**必须调用 \`errorToJson\`**，不要复制一份 fields 逻辑。后面改 400 体的形状只改一处。

真实 handler 可以：

\`\`\`ts
const parsed = schema.safeParse(body);
const out = validateOr400(parsed);
if (out.status === 400) return c.json(out.body, 400);
return c.json(out.data, 201);
\`\`\`

中间件、统一 \`onError\` 是 **Ch19** 的事。本章先把「函数返回 200 | 400」写对。

### ❌ / ✅

\`\`\`ts
// ❌ success 时 throw；fail 时 status 500
// ❌ fail 时手写 { error: "VALIDATION", fields: issues.map(...) } 不调用 errorToJson
// ✅ 两路返回；失败走 errorToJson
\`\`\`

> ✅ **做 \`validateOr400\`**：调用 \`errorToJson\`。测试会用假 issues 对象，不必真的 ZodError。

---`,
    ["validateOr400"],
  ),
  sec(
    "sec-18.6",
    "§18.6 PATCH：合并后再校验（对应：`patchBody`）🔴",
    "18.6",
    `只改库存或价格。合并后必须 **整份还是合法 CreateBody**。\`price: 0\` 单独看是「改了一个数字」，合并后 schema 会拒绝。

### Java

\`\`\`java
// PATCH 不是「每个出现的字段单独 @Valid」就完了
// 合并到当前实体后，再跑一遍完整约束
\`\`\`

### TypeScript：浅合并 + parseCreateBody

\`\`\`ts
function patchBody(current: CreateBody, patch: unknown): CreateBody | null {
  if (patch === null || typeof patch !== "object" || Array.isArray(patch)) return null;
  return parseCreateBody({ ...current, ...patch });
}

patchBody(keyboard, {});             // 等于 current（仍要 parse 成功）
patchBody(keyboard, { stock: 0 });   // 合法缺货
patchBody(keyboard, { price: 0 });   // null
patchBody(keyboard, null);           // null
patchBody(keyboard, []);             // null（数组也是 object，要排除）
patchBody(book, { name: "重构" });   // 另一件，防硬编码键盘
\`\`\`

不要 mutate \`current\`。spread 出新对象再 parse。

\`app.ts\` 里 PATCH 的 id 只负责 \`parseIdParam\`；current 用内存里那件机械键盘常量即可，不接数据库。

### ❌ / ✅

\`\`\`ts
// ❌ current.price = patch.price; return current
// ❌ 只校验 patch 里出现的键，不跑完整 CreateBody
// ❌ 数组当 object 合并
// ✅ 非对象 null；浅合并；调用 parseCreateBody
\`\`\`

> ✅ **做 \`patchBody\`**：复用 \`parseCreateBody\`。测试会 freeze current，并查 \`price: 0\`。

---`,
    ["patchBody"],
  ),
  sec(
    "sec-pits",
    "⚠️ Java / Python 老手几个坑",
    null,
    `1. **路径参数是 string。** 不是 \`long id\`。\`Number("12abc")\` 会吞尾巴。
2. **格式错是 400，找不到才是 404。** \`abc\` 不是「没这件商品」。
3. **不要 \`schema.parse\` 直接 throw 出 handler。** 容易 500。safeParse → 400。
4. **limit 坏了不是悄悄当 10。** 整单 null。
5. **创建价 0 非法，库存 0 合法。** 和 Ch07「0 是合法 number」不矛盾：约束不同。
6. **sku 正则区分大小写。** \`kb-001\` 失败。
7. **PATCH 必须再校验。** 局部补丁可以拼出非法整体。
8. **非法 JSON 也是 400。** \`await c.req.json()\` 要 catch。
9. **本页 JSON 作业不要 import z / hono。** 本地 assignment.ts 要 import z；Hono 只在 app.ts。
10. **不要在 app.ts 里 listen。** 测试 \`app.request\`。中间件留给 Ch19。

---`,
    [],
  ),
  sec(
    "sec-homework",
    "📝 本章作业",
    null,
    `6 个纯函数按节交错出现。本地三件套：

- \`local/m4/ch18/assignment.ts\` — 你改 TODO（\`import { z } from "zod"\`）
- \`local/m4/ch18/app.ts\` — 已写好的 Hono，调用你的纯函数；POST 用 \`await c.req.json()\`
- \`local/m4/ch18/assignment.test.ts\` — \`bun test local/m4/ch18\`

卡住就回对应 §：\`parseIdParam\` → §18.1，\`parseCreateBody\` → §18.3，\`patchBody\` → §18.6（请复用 parseCreateBody）。

网页上的编辑器是只读提示；**真正改文件、跑测试在仓库 local/**。

---`,
    [],
  ),
  sec(
    "sec-check",
    "✅ 自测：你真的掌握了吗？",
    null,
    `- [ ] 能说清 path 永远是 string，为什么不能 \`Number(param)\`
- [ ] 非法 id / 空 q / 缺 sku → 400，不是 500，也不是 404
- [ ] \`parseIdParam\` 走了 zod，\`12abc\` 是 null
- [ ] 搜索缺 limit = 10；坏 limit 整单拒绝
- [ ] price 0 不能创建；stock 0 可以；sku 必须 \`AA-000\` 这种
- [ ] 400 体是 \`VALIDATION\` + fields；去重保序
- [ ] \`validateOr400\` 调用了 \`errorToJson\`
- [ ] PATCH 合并后再 \`parseCreateBody\`，不 mutate
- [ ] \`bun test local/m4/ch18\` 全绿

---`,
    [],
  ),
  sec(
    "sec-feynman",
    "🎓 费曼挑战",
    null,
    `用大白话讲给「Java 同事」听。讲不清 = 还没真懂。

任选一题（1–2 分钟）：

1. 「Hono 的 \`param("id")\` 为什么不能当成 \`long id\`？\`/products/abc\` 为什么是 400 不是 404？」— 卡壳重读世界地图 + §18.1
2. 「Pydantic 校验失败为什么不要变成 500？\`safeParse\` 和 \`parse\` 在 handler 里该用哪个？」— 卡壳重读 §18.4 + §18.5
3. 「PATCH 只改 \`price\`，为什么还要把整份 body 再跑一遍 schema？\`price: 0\` 和 \`stock: 0\` 为什么一个合法一个不合法？」— 卡壳重读 §18.3 + §18.6

---`,
    [],
  ),
  sec(
    "sec-next",
    "⏭️ 下一步",
    null,
    `Ch18 掌握后，下一章是 **Ch19 · 中间件、CORS、错误处理**：把「每个 handler 自己 catch」收成中间件和 \`onError\`，对照 Servlet Filter / Spring \`@ControllerAdvice\`。zod 门口已经会了；下一课管跨域、鉴权和统一错误形状。不要在本章提前写中间件。`,
    [],
  ),
];

const tutorialMd = `# Ch18 · zod 校验路径 / 查询 / body

${sections
  .map((s) => (s.heading ? `## ${s.heading}\n\n${s.body}` : s.body))
  .join("\n\n")}
`;

const reviewMd = `# Ch18 · 记忆闪卡

> 先回忆，再翻答案。连续 2 次秒答 → 退役。

## 🔖 闪卡

| # | 正面（问题） | 背面（答案） | 掌握 |
|---|---|---|---|
| 1 | \`c.req.param("id")\` 是 number 吗？\`Number("12abc")\` 会怎样？ | 永远是 **string**。\`Number("12abc")\` 是 NaN；\`parseInt\` 会变成 12。必须整段数字 + zod。 | ⬜ |
| 2 | \`GET /products/abc\` 用 400 还是 404？找不到 id=99 呢？ | 格式错 → **400 VALIDATION**。形状对但货架没有 → 404。不要 500。 | ⬜ |
| 3 | HTTP 门口用 \`parse\` 还是 \`safeParse\`？抛错容易变成什么？ | **safeParse**。\`parse\` throw 出 handler 容易 500。 | ⬜ |
| 4 | sku 正则是什么？\`kb-001\` 过吗？ | \`/^[A-Z]{2}-\\d{3}$/\`。小写不过。例：KB-001、BK-005。 | ⬜ |
| 5 | PATCH \`{ price: 0 }\` 和 \`{ stock: 0 }\` 哪个合法？为什么要合并后再校验？ | stock 0 合法（缺货）；price 0 非法。局部补丁可以拼出非法整体，必须再跑 \`parseCreateBody\`。 | ⬜ |
| 6 | 搜索只有 \`q\`、没有 limit，返回什么？limit 为 0 / 101 / \`"x"\` 呢？ | 缺省 \`limit: 10\`。坏 limit **整单 null**，不是悄悄当 10。 | ⬜ |
| 7 | \`errorToJson\` 的 fields 怎么来？重复 path 怎么办？ | path 用 \`.\` 拼接；空 path → \`""\`；去重但保序。 | ⬜ |
| 8 | Java \`@Valid\` / Pydantic \`Query\` 在本章对标什么？ | 路径 / 查询 / body 三份 zod schema，失败统一 400。 | ⬜ |

## 🎓 费曼自检

- [ ] 能说清 path 是 string、400 vs 404
- [ ] 能说清 safeParse、sku 正则、patch 再校验
`;

const chapter = {
  id: "ch18",
  num: "18",
  title: "zod 校验路径 / 查询 / body",
  runMode: "local" as const,
  tutorialMd,
  assignment,
  testName: "ch18_assignment",
  testSource,
  reviewMd,
  interleaved: true,
  sections,
  functions,
  preamble,
  localHint: "bun test local/m4/ch18",
};

const out = join(dirname(fileURLToPath(import.meta.url)), "../src/content/chapters/ch18.json");
mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, JSON.stringify(chapter, null, 2) + "\n");
console.log("wrote", out);
