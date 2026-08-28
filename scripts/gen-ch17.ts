/**
 * 生成 src/content/chapters/ch17.json
 * 运行：bun scripts/gen-ch17.ts
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const preamble = `/**
 * Ch17 作业：商品目录 API 的纯函数。
 *
 * 场景：Hono 把 HTTP 接到这 6 个函数。真路由在仓库
 * local/m4/ch17/app.ts；网页运行器没有 Hono，所以本题禁止 import "hono"。
 * 打开 assignment.ts 改 TODO，跑 bun test local/m4/ch17。
 *
 * 全绿 = 你掌握了 Ch17。
 */

type Product = {
  id: number;
  name: string;
  category: string;
  price: number;
  stock: number;
  sku: string;
};`;

const functions = [
  {
    name: "parseIdParam",
    testSuite: "parseIdParam",
    skeleton: `/**
 * 【场景】GET /products/:id。Hono 的 c.req.param("id") 永远是 string。
 * 「1」要变成数字 1；「abc」不能当 id。
 *
 * 【转换点】整段匹配 /^\\d+$/ 再 Number(raw)。有限数且 ≥ 1 才返回，否则 null。
 * Spring @PathVariable Long 会帮你转；FastAPI id: int 也会。
 * Hono 不转，你自己把字符串变成 id。
 *
 * 任务：合法正整数 id 返回 number，否则 null。
 * 示例：
 *   "1" → 1；"10" → 10；"01" → 1
 *   "0" / "-1" / "abc" / "" / "1.5" / "1e2" / "12abc" → null
 *
 * 提示：先 /^\\d+$/.test(raw)，再 Number。不要 parseInt（"12abc" 会变成 12）。
 */
export function parseIdParam(raw: string): number | null {
  throw new Error("TODO");
}`,
  },
  {
    name: "getProductById",
    testSuite: "getProductById",
    skeleton: `/**
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
}`,
  },
  {
    name: "listProducts",
    testSuite: "listProducts",
    skeleton: `/**
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
}`,
  },
  {
    name: "healthPayload",
    testSuite: "healthPayload",
    skeleton: `/**
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
}`,
  },
  {
    name: "notFoundBody",
    testSuite: "notFoundBody",
    skeleton: `/**
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
}`,
  },
  {
    name: "createdStatus",
    testSuite: "createdStatus",
    skeleton: `/**
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
}`,
  },
];

const assignment = `${preamble}

${functions.map((f) => f.skeleton).join("\n\n")}
`;

const testSource = `describe("parseIdParam", () => {
  it('"1" → 1', () => {
    expect(parseIdParam("1")).toBe(1);
  });
  it('"10" → 10', () => {
    expect(parseIdParam("10")).toBe(10);
  });
  it('"01" → 1（允许前导零）', () => {
    expect(parseIdParam("01")).toBe(1);
  });
  it('"0" → null', () => {
    expect(parseIdParam("0")).toBeNull();
  });
  it('"-1" → null', () => {
    expect(parseIdParam("-1")).toBeNull();
  });
  it('"abc" → null', () => {
    expect(parseIdParam("abc")).toBeNull();
  });
  it("空字符串 → null", () => {
    expect(parseIdParam("")).toBeNull();
  });
  it('"1.5" → null', () => {
    expect(parseIdParam("1.5")).toBeNull();
  });
  it('"1e2" → null（不要被 Number 科学计数骗）', () => {
    expect(parseIdParam("1e2")).toBeNull();
  });
  it('"12abc" → null（不要 parseInt 丢尾部）', () => {
    expect(parseIdParam("12abc")).toBeNull();
  });
});

describe("getProductById", () => {
  it("id=1 → 机械键盘 KB-001", () => {
    const p = getProductById(PRODUCTS, 1);
    expect(p).toEqual(PRODUCTS[0]);
    expect(p === null).toBe(false);
    if (p !== null) {
      expect(p.name).toBe("机械键盘");
      expect(p.sku).toBe("KB-001");
      expect(p.id).toBe(1);
    }
  });
  it("id=9 智能水杯 stock 0 也算找到", () => {
    const p = getProductById(PRODUCTS, 9);
    expect(p === null).toBe(false);
    if (p !== null) {
      expect(p.name).toBe("智能水杯");
      expect(p.sku).toBe("CP-009");
      expect(p.stock).toBe(0);
    }
  });
  it("id=99 → null", () => {
    expect(getProductById(PRODUCTS, 99)).toBeNull();
  });
  it("小列表 id=7 蓝牙音箱；不要硬编码 PRODUCTS", () => {
    const tiny = [
      { id: 7, name: "蓝牙音箱", category: "影音设备", price: 399, stock: 150, sku: "SP-007" },
    ];
    const hit = getProductById(tiny, 7);
    expect(hit === null).toBe(false);
    if (hit !== null) {
      expect(hit.sku).toBe("SP-007");
    }
    expect(getProductById(tiny, 1)).toBeNull();
  });
  it("不 mutate products", () => {
    const orig = PRODUCTS.map((p) => ({ ...p }));
    for (const p of orig) Object.freeze(p);
    Object.freeze(orig);
    const snapshot = orig.map((p) => ({ ...p }));
    getProductById(orig, 1);
    getProductById(orig, 99);
    expect(orig).toEqual(snapshot);
    expect(orig.length).toBe(10);
  });
});

describe("listProducts", () => {
  it("10 件浅拷贝，含缺货 CP-009", () => {
    const listed = listProducts(PRODUCTS);
    expect(listed.length).toBe(10);
    expect(Object.is(listed, PRODUCTS)).toBe(false);
    expect(listed[0].sku).toBe("KB-001");
    expect(listed[8].sku).toBe("CP-009");
    expect(listed[8].stock).toBe(0);
  });
  it("空数组 → []", () => {
    const orig: Product[] = [];
    Object.freeze(orig);
    expect(listProducts(orig)).toEqual([]);
    expect(orig.length).toBe(0);
  });
  it("不过滤 stock，不 mutate", () => {
    const orig = PRODUCTS.map((p) => ({ ...p }));
    for (const p of orig) Object.freeze(p);
    Object.freeze(orig);
    const snapshot = orig.map((p) => ({ ...p }));
    const listed = listProducts(orig);
    expect(orig).toEqual(snapshot);
    expect(listed.length).toBe(10);
    expect(listed.some((p) => p.stock === 0)).toBe(true);
  });
});

describe("healthPayload", () => {
  it("精确两键", () => {
    expect(healthPayload()).toEqual({ ok: true, service: "shop-api" });
  });
  it("再调一次仍是同一形状", () => {
    const a = healthPayload();
    const b = healthPayload();
    expect(a).toEqual({ ok: true, service: "shop-api" });
    expect(b).toEqual({ ok: true, service: "shop-api" });
  });
});

describe("notFoundBody", () => {
  it('精确 { error: "NOT_FOUND" }', () => {
    expect(notFoundBody()).toEqual({ error: "NOT_FOUND" });
  });
  it("不是数字 404、没有多余字段", () => {
    const body = notFoundBody();
    expect(body.error).toBe("NOT_FOUND");
    expect(body).toEqual({ error: "NOT_FOUND" });
  });
});

describe("createdStatus", () => {
  it("返回 201 不是 200", () => {
    expect(createdStatus()).toBe(201);
  });
  it("再调一次仍是 201", () => {
    expect(createdStatus()).toBe(201);
    expect(createdStatus()).toBe(201);
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
    `> **预计**：1 天 ｜ **前置**：M1（函数、类型、\`null\`）
> **目标**：① 分清 **框架只负责 HTTP**、**业务是纯函数**；② 会读 Hono 的 \`app.get\` / \`c.json\` / \`c.req.param\`；③ 对照 Java \`@RestController\`、Python FastAPI \`@app.get\`。
> 你 15 年 Java：这章就是最小的 \`@RestController\`。差别是 Hono 的路径参数**不会**自动变成 \`long\`——\`c.req.param("id")\` 永远是 string。

> 📐 **本教程的契约**：下面每一节（§17.1–§17.6）都**精确对应**作业里的题。讲过的才考，考的必讲过。卡住时按作业函数名回查对应小节。
> **不讲**：中间件（Ch19）、zod 校验路径 / 查询 / body（Ch18）、数据库。看见 \`app.use\` / \`z.object\` / SQL 先跳过。

---`,
    [],
  ),
  sec(
    "sec-map",
    "🗺️ 本章地图",
    null,
    `本章作业是一条完整主线：**商品目录 API**。10 件商品与 \`shared.json\` 一致：\`KB-001\` 机械键盘库存 120，\`CP-009\` 智能水杯库存 0。网页运行器没有 Hono，所以 JSON 作业仍是 6 个**纯函数**；真路由已经写在 \`local/m4/ch17/app.ts\`，你主要填 \`assignment.ts\`。

读完这章 + 完成作业，你将能够：

- 对照 \`@RestController\` / \`@GetMapping\` 和 FastAPI \`@app.get\`，说出 Hono 的 \`new Hono()\` + \`app.get/post\` 在干什么
- 解释为什么 \`c.req.param("id")\` 是 string，以及 \`parseIdParam\` 为什么不能用 \`parseInt\`
- 把查商品、列目录、health、404 JSON、201 抽成纯函数，handler 里只 \`c.json(...)\`
- 用 \`await app.request("/health")\` 测 HTTP，**不要** \`listen\` 占端口

**作业 ↔ 教程对应表**（学哪节，就去做哪题）：

| 作业题 | 对应小节 | 核心知识点 |
|--------|----------|-----------|
| \`parseIdParam\` | §17.1 | 路径参数字符串 → id（整段 \`/^\\d+$/\`） |
| \`getProductById\` | §17.2 | 按 id 查商品，找不到 null |
| \`listProducts\` | §17.3 | 列表浅拷贝，不过滤缺货 |
| \`healthPayload\` | §17.4 | GET /health 体 |
| \`notFoundBody\` | §17.5 | 404 JSON |
| \`createdStatus\` | §17.6 | POST 201（不是 200） |

---`,
    [],
  ),
  sec(
    "sec-path",
    "⏱️ 学习路径：费曼五步（约 50–70 分钟）",
    null,
    `| 步 | 你要做 | 在哪做 |
|----|--------|--------|
| ① 预览猜（2 分钟） | 看下面的差异，先猜 Hono 怎么接到纯函数 | 本页 ① |
| ② 先动手 | 打开 \`local/m4/ch17/assignment.ts\`，改 \`TODO\` | 仓库 |
| ③ 提取+反馈 | \`bun test local/m4/ch17\` | 终端 |
| ④ 费曼（2 分钟） | 大白话讲清「框架 vs 纯函数」 | 本页 ④ |
| ⑤ 存闪卡 | 章末闪卡标复习日期 | 闪卡 |

> 💡 别从头读到尾。先扫 ① → 打开 \`local/m4/ch17/assignment.ts\`，\`bun test local/m4/ch17\` → 哪题卡了，回对应 § 查 → 改 → 再跑。
> \`app.ts\` 已经写完整。不要在 handler 里写死 10 个商品，不要 \`listen\`。

---`,
    [],
  ),
  sec(
    "sec-guess",
    "① 预览猜（2 分钟 · 激活你的 Java / Python 直觉）",
    null,
    `先别看答案，凭经验猜一猜（猜错没关系）：

1. Spring \`@GetMapping("/products/{id}")\` 里 \`@PathVariable Long id\`，请求 \`/products/abc\` 会进方法体吗？Hono 的 \`c.req.param("id")\` 类型是什么？
2. FastAPI \`def get_product(id: int)\` 会把 \`"1"\` 变成 \`1\`。Hono 会吗？
3. 智能水杯库存是 0。\`GET /products/9\` 应该 404 还是 200？列表要不要把它滤掉？
4. 创建商品成功，Java 习惯 200 还是 201？\`createdStatus()\` 该返回哪个？
5. 测 API 要不要 \`app.listen(3000)\`？有没有不占端口的办法？
6. 业务判断（id 合不合法、商品在不在）写在 handler 里好，还是抽纯函数再 \`c.json\` 好？

> 猜完，带着验证心态进入正文。第 1、5 题是本章的 🔴。

---`,
    [],
  ),
  sec(
    "sec-world",
    "Hono = 最小的 @RestController 🔴",
    null,
    `M3 在浏览器里画 UI。本章起服务端：**接到一个 HTTP 请求，返回 JSON**。框架是 **Hono**（对照 FastAPI，更短）。

| | Java Spring | Python FastAPI | Hono |
|---|---|---|---|
| 应用 | \`@SpringBootApplication\` | \`app = FastAPI()\` | \`const app = new Hono()\` |
| GET | \`@GetMapping("/health")\` | \`@app.get("/health")\` | \`app.get("/health", handler)\` |
| POST | \`@PostMapping\` | \`@app.post\` | \`app.post\` |
| 路径参数 | \`@PathVariable Long id\`（常自动转） | \`id: int\`（会转） | \`c.req.param("id")\` **string** |
| JSON | \`return dto;\` / \`ResponseEntity\` | \`return dict\` | \`c.json(body)\` 或 \`c.json(body, status)\` |

\`local/m4/ch17/app.ts\` 已经按这张表写好了。你要填的是 handler **右边**那 6 个纯函数。

\`\`\`ts
import { Hono } from "hono";
const app = new Hono();
app.get("/health", (c) => c.json(healthPayload()));
app.get("/products/:id", (c) => {
  const id = parseIdParam(c.req.param("id"));
  if (id === null) return c.json(notFoundBody(), 404);
  const p = getProductById(PRODUCTS, id);
  if (!p) return c.json(notFoundBody(), 404);
  return c.json(p);
});
\`\`\`

\`\`\`mermaid
flowchart LR
    req["Request"] --> hono["Hono 路由"]
    hono --> fn["纯函数"]
    fn --> out["c.json"]

    style req fill:#FFE082,stroke:#F9A825,color:#1f1f1f
    style hono fill:#80DEEA,stroke:#0097A7,color:#1f1f1f
    style fn fill:#A5D6A7,stroke:#388E3C,color:#1f1f1f
    style out fill:#A5D6A7,stroke:#388E3C,color:#1f1f1f
\`\`\`

**handler 里不要写业务。** 查 id、拼 404、算 201，全是普通函数；Hono 只负责「这是 GET 还是 POST、status 填几」。

### ❌ / ✅

\`\`\`ts
// ❌ 在 handler 里写死 10 个商品，if (id === "1") return 机械键盘
// ❌ app.listen(3000) 再 curl——单测会抢端口、在 CI 里挂
// ✅ 抽 parseIdParam / getProductById，handler 里 c.json
// ✅ 测试：await app.request("/health")
\`\`\`

### 电商主线

\`PRODUCTS[0]\` 机械键盘 \`KB-001\`；\`PRODUCTS[8]\` 智能水杯 \`CP-009\` 库存 0。\`GET /products\` 10 件都在；\`GET /products/9\` 仍是 200（缺货 ≠ 没这件）；\`GET /products/99\` 和 \`GET /products/abc\` 都是 404 + \`{ error: "NOT_FOUND" }\`。

### 本课怎么算「会了」

打开 \`local/m4/ch17/assignment.ts\`，\`bun test local/m4/ch17\` 全绿。网页上的 6 个函数签名和本地作业一致，但**不要**在浏览器里跑 Hono。

---`,
    [],
  ),
  sec(
    "sec-17.1",
    "§17.1 路径参数是字符串（对应：`parseIdParam`）🔴",
    "17.1",
    `### Java 对照：\`@PathVariable\` 常常已经是数字

\`\`\`java
@RestController
public class ProductController {
  @GetMapping("/products/{id}")
  public Product get(@PathVariable long id) { // "abc" 进不了方法，先 400
    return catalog.get(id);
  }
}
\`\`\`

### Python 对照：FastAPI 声明 \`int\` 就会转

\`\`\`python
@app.get("/products/{id}")
def get_product(id: int):  # "1" → 1；"abc" → 422
    ...
\`\`\`

### TypeScript / Hono：\`param\` 永远是 string

\`\`\`ts
app.get("/products/:id", (c) => {
  const raw = c.req.param("id"); // string，哪怕 URL 是 /products/1
  const id = parseIdParam(raw);
});
\`\`\`

**整段**匹配 \`/^\\d+$/\`，再 \`Number(raw)\`。结果必须是有限数且 **≥ 1**。

| 输入 | 结果 | 为什么 |
|------|------|--------|
| \`"1"\` / \`"10"\` | 1 / 10 | 合法正整数 |
| \`"01"\` | 1 | \`Number("01")===1\`，允许 |
| \`"0"\` / \`"-1"\` | null | id 从 1 起；\`-1\` 过不了 \`\\d+\` |
| \`"abc"\` / \`""\` / \`"1.5"\` | null | 不是整段数字 |
| \`"1e2"\` | null | \`Number("1e2")===100\`，但 \`e\` 不是纯数字 |
| \`"12abc"\` | null | **不要** \`parseInt\`（它会丢掉 \`abc\` 得到 12） |

### ❌ / ✅

\`\`\`ts
// ❌ parseInt(raw, 10)           // "12abc" → 12
// ❌ Number(raw) 而不先 test     // "1e2" → 100
// ❌ 返回 0 当合法 id
// ✅ /^\\d+$/.test(raw) 再 Number，n >= 1 才返回
\`\`\`

> ✅ **做 \`parseIdParam\`**：合法正整数 → number，否则 null。

---`,
    ["parseIdParam"],
  ),
  sec(
    "sec-17.2",
    "§17.2 按 id 查商品（对应：`getProductById`）",
    "17.2",
    `目录就是那 10 件。\`GET /products/1\` 要机械键盘；\`GET /products/9\` 要智能水杯——**库存 0 也算找到**。只有 id 对不上才是「没有这件」。

### Java 对照

\`\`\`java
public Product getById(List<Product> products, long id) {
  return products.stream()
      .filter(p -> p.getId() == id)
      .findFirst()
      .orElse(null);
}
\`\`\`

### TypeScript

\`\`\`ts
function getProductById(products: Product[], id: number): Product | null {
  return products.find((p) => p.id === id) ?? null;
}

getProductById(PRODUCTS, 1);  // 机械键盘 KB-001
getProductById(PRODUCTS, 9);  // 智能水杯，stock 0
getProductById(PRODUCTS, 99); // null
\`\`\`

不要改 \`products\` 里的字段，也不要 \`splice\` 掉查到的那件。handler 拿到 \`null\` 再交给 \`notFoundBody\`（§17.5）。

### ❌ / ✅

\`\`\`ts
// ❌ if (id === 1) return { name: "机械键盘", ... }  // 硬编码
// ❌ if (p.stock === 0) return null                 // 缺货不是 404
// ❌ products[0] 永远当命中
// ✅ find id；找不到 null；原数组不动
\`\`\`

> ✅ **做 \`getProductById\`**：命中返回该对象，找不到 null。

---`,
    ["getProductById"],
  ),
  sec(
    "sec-17.3",
    "§17.3 列表（对应：`listProducts`）",
    "17.3",
    `\`GET /products\` 返回整份目录。运营后台要看见缺货件，才能去补 \`CP-009\`。

### Java / Python：返回副本还是原 List？

\`\`\`java
return new ArrayList<>(products); // 调用方 add 不影响仓库
\`\`\`

\`\`\`python
return products[:]  # 浅拷贝
\`\`\`

### TypeScript：\`slice()\`

\`\`\`ts
function listProducts(products: Product[]): Product[] {
  return products.slice();
}

listProducts(PRODUCTS).length; // 10，含智能水杯
listProducts([]);              // []
Object.is(listProducts(PRODUCTS), PRODUCTS); // false
\`\`\`

**不过滤** \`stock\`。过滤是另一条 API（本章没有 \`?in_stock=\`，那是 Ch18 的查询串）。

### ❌ / ✅

\`\`\`ts
// ❌ return products;                    // 同一引用，调用方 push 会脏仓库
// ❌ return products.filter(p => p.stock > 0)
// ❌ 在函数里 products.push(...)
// ✅ return products.slice()
\`\`\`

> ✅ **做 \`listProducts\`**：浅拷贝；空列表 \`[]\`；缺货也留下。

---`,
    ["listProducts"],
  ),
  sec(
    "sec-17.4",
    "§17.4 GET /health（对应：`healthPayload`）",
    "17.4",
    `探针、负载均衡、你自己 \`curl\` 看服务活着，都打 \`GET /health\`。body 要稳定、短。

### Java / FastAPI

\`\`\`java
@GetMapping("/health")
public Map<String, Object> health() {
  return Map.of("ok", true, "service", "shop-api");
}
\`\`\`

\`\`\`python
@app.get("/health")
def health():
    return {"ok": True, "service": "shop-api"}
\`\`\`

### Hono + 纯函数

\`\`\`ts
function healthPayload(): { ok: true; service: "shop-api" } {
  return { ok: true, service: "shop-api" };
}
app.get("/health", (c) => c.json(healthPayload()));
\`\`\`

精确这两键。不要加 \`version\`、\`uptime\`、\`timestamp\`——本题会用 \`toEqual\` 对整颗对象。

### ❌ / ✅

\`\`\`ts
// ❌ return { ok: true }                    // 少 service
// ❌ return { ok: true, service: "shop-api", extra: 1 }
// ✅ { ok: true, service: "shop-api" }
\`\`\`

> ✅ **做 \`healthPayload\`**：精确两键，不多不少。

---`,
    ["healthPayload"],
  ),
  sec(
    "sec-17.5",
    "§17.5 404 JSON（对应：`notFoundBody`）",
    "17.5",
    `id 解析失败（\`abc\`、\`0\`），或目录里没有 99 号：HTTP **404**，body **统一** \`{ error: "NOT_FOUND" }\`。

前端只认这一个 \`error\` 字符串，不要有时 \`message\`、有时 \`404\` 数字、有时中文「找不到」。

### 分工

| 谁 | 干什么 |
|----|--------|
| \`parseIdParam\` / \`getProductById\` | 判断「没有」 |
| \`notFoundBody()\` | 只负责 JSON 形状 |
| \`c.json(notFoundBody(), 404)\` | 才把 status 写成 404 |

Spring 可以 \`ResponseEntity.status(404).body(...)\`；FastAPI \`raise HTTPException(404, ...)\`。Hono 第二参就是 status。

\`\`\`ts
app.get("/products/:id", (c) => {
  const id = parseIdParam(c.req.param("id"));
  if (id === null) return c.json(notFoundBody(), 404);
  const p = getProductById(PRODUCTS, id);
  if (!p) return c.json(notFoundBody(), 404);
  return c.json(p);
});
\`\`\`

\`GET /products/99\` 和 \`GET /products/abc\` 的 body 相同。差别只在「为什么没有」：一个是查不到，一个是 id 根本不合法。本章都映射成同一 404。

### ❌ / ✅

\`\`\`ts
// ❌ return { error: 404 } 或 { message: "NOT_FOUND" }
// ❌ 在纯函数里 throw，让框架去猜
// ✅ return { error: "NOT_FOUND" }
\`\`\`

> ✅ **做 \`notFoundBody\`**：精确 \`{ error: "NOT_FOUND" }\`。

---`,
    ["notFoundBody"],
  ),
  sec(
    "sec-17.6",
    "§17.6 POST 201（对应：`createdStatus`）🔴",
    "17.6",
    `GET 成功默认 **200**。POST 创建成功，REST 约定 **201 Created**。很多人随手 \`c.json(body)\` 变成 200——本题专门拦住。

### Java / FastAPI

\`\`\`java
@PostMapping("/products")
@ResponseStatus(HttpStatus.CREATED) // 201
public Map<String, Boolean> create() {
  return Map.of("ok", true);
}
\`\`\`

\`\`\`python
@app.post("/products", status_code=201)
def create():
    return {"ok": True}
\`\`\`

### Hono

\`\`\`ts
function createdStatus(): number {
  return 201;
}
app.post("/products", (c) => c.json({ ok: true }, createdStatus() as 201));
\`\`\`

\`as 201\` 只是让 Hono 的类型把第二参当成字面量 201。运行时靠你返回的数字。

\`app.ts\` 已把六题串起来：health → 列表 → 按 id（parse + get + 404）→ POST 201。你在 \`assignment.ts\` 把函数填绿，HTTP 单测就会绿。

### ❌ / ✅

\`\`\`ts
// ❌ return 200
// ❌ return 201 写成字符串 "201"
// ✅ return 201
\`\`\`

> ✅ **做 \`createdStatus\`**：返回数字 201。然后 \`bun test local/m4/ch17\` 看 POST 的 status。

---`,
    ["createdStatus"],
  ),
  sec(
    "sec-pits",
    "⚠️ Java / Python 老手几个坑",
    null,
    `1. **以为 param 已经是 number。** Spring / FastAPI 常自动转；Hono 是 string。先 \`parseIdParam\`。
2. **\`parseInt("12abc")\`。** 会得到 12。整段 \`/^\\d+$/\` 才安全。\`Number("1e2")\` 同理是坑。
3. **缺货当 404。** \`CP-009\` 库存 0 仍是一件商品。404 只给「没有这个 id」。
4. **列表过滤 stock。** \`GET /products\` 要 10 件。过滤是以后的查询串（Ch18）。
5. **返回原数组。** \`listProducts\` 必须浅拷贝，调用方 \`push\` 不能脏仓库。
6. **创建返回 200。** \`@ResponseStatus(CREATED)\` / \`status_code=201\`。本题 \`createdStatus()\` 是 201。
7. **在 handler 里写死 10 个商品。** 测 \`getProductById(tiny, 7)\` 会拆穿。抽纯函数。
8. **\`app.listen\` 再测。** 抢端口、CI 挂。用 \`await app.request("/health")\`。
9. **作业 \`import "hono"\`。** 网页运行器没有 Hono；Hono 只出现在 \`local/m4/ch17/app.ts\`。
10. **不讲中间件、zod、数据库。** 看见 Ch18 / Ch19 / Ch20 的词，先回到这 6 个函数。

---`,
    [],
  ),
  sec(
    "sec-homework",
    "📝 本章作业",
    null,
    `上面 6 个函数按节交错出现。每个注释里有【场景】【转换点】、示例和提示。

**完成方式**：打开仓库 \`local/m4/ch17/assignment.ts\`，把 \`throw new Error("TODO")\` 换成实现。路由在 \`app.ts\`（已写完）。然后 \`bun test local/m4/ch17\`。全绿 = 这题过了。

卡住就回对应 §：\`parseIdParam\` → §17.1，\`getProductById\` → §17.2，\`createdStatus\` → §17.6。

提示只点知识点：\`/^\\d+$/\`、\`find\`、\`slice()\`、两键 JSON、201。不要 \`parseInt\`、不要 \`listen\`、不要在 handler 里写死商品。

---`,
    [],
  ),
  sec(
    "sec-check",
    "✅ 自测：你真的掌握了吗？",
    null,
    `- [ ] 能对照 \`@RestController\` / FastAPI \`@app.get\` 说出 \`new Hono()\` + \`app.get\` + \`c.json\`
- [ ] 知道 \`c.req.param("id")\` 是 string，\`parseIdParam("12abc")\` 必须是 null
- [ ] \`getProductById\` 能拿到机械键盘和缺货水杯；99 是 null；不 mutate
- [ ] \`listProducts\` 是浅拷贝、10 件、含 CP-009
- [ ] health 精确两键；404 JSON 精确 \`NOT_FOUND\`
- [ ] POST 是 201 不是 200
- [ ] 测试用 \`app.request\`，没有 \`listen\`
- [ ] 6 个作业全绿（\`bun test local/m4/ch17\`）

---`,
    [],
  ),
  sec(
    "sec-feynman",
    "🎓 费曼挑战",
    null,
    `用大白话讲给「Java 同事」听。讲不清 = 还没真懂。

任选一题（1–2 分钟）：

1. 「Hono 和 \`@RestController\` + \`@GetMapping\` 像在哪？\`c.req.param("id")\` 为什么不是 \`long\`？\`parseInt\` 为什么坑？」— 卡壳重读总述 + §17.1
2. 「为什么 handler 里不要写死 10 个商品？纯函数和 \`c.json\` 怎么分工？缺货为什么不是 404？」— 卡壳重读总述 + §17.2 + §17.5
3. 「测 API 为什么不要 \`listen\` 端口？201 和 200 差在哪？」— 卡壳重读 §17.4 + §17.6

---`,
    [],
  ),
  sec(
    "sec-next",
    "⏭️ 下一步",
    null,
    `Ch17 掌握后，进 **Ch18 · zod 校验路径 / 查询 / body**。本章把字符串 id、404 JSON、201 用手工规则挡住；下一章用 zod（对照 Pydantic）把路径 / 查询串 / POST body 校验收口——非法输入变成 400，而不是继续手写 \`/^\\d+$/\`。中间件（CORS、错误处理）留到 Ch19，数据库留到 Ch20。`,
    [],
  ),
];

const tutorialMd = `# Ch17 · Hono 第一个 API

${sections
  .map((s) => (s.heading ? `## ${s.heading}\n\n${s.body}` : s.body))
  .join("\n\n")}
`;

const reviewMd = `# Ch17 · 记忆闪卡

> 先回忆，再翻答案。连续 2 次秒答 → 退役。

## 🔖 闪卡

| # | 正面（问题） | 背面（答案） | 掌握 |
|---|---|---|---|
| 1 | Hono 怎么对照 Spring \`@RestController\` / FastAPI \`@app.get\`？ | \`new Hono()\` + \`app.get/post(path, handler)\` + \`c.json(body)\`。框架管 HTTP，业务是纯函数。 | ⬜ |
| 2 | \`c.req.param("id")\` 是 number 吗？\`parseInt("12abc")\` 行吗？ | **永远是 string。** 整段 \`/^\\d+$/\` 再 \`Number\`，且 ≥ 1。\`parseInt\` 会丢掉尾部变成 12。 | ⬜ |
| 3 | \`GET /products/99\` 和 \`/products/abc\` 的 JSON 是什么？status？ | 都是 404 + \`{ error: "NOT_FOUND" }\`。id 非法和找不到，本章同一形状。 | ⬜ |
| 4 | POST 创建成功该 200 还是 201？ | **201。** 对照 \`@ResponseStatus(CREATED)\` / FastAPI \`status_code=201\`。\`createdStatus()\` 返回 201。 | ⬜ |
| 5 | 为什么 handler 里不要写死 10 个商品？ | 业务是 \`getProductById\` / \`listProducts\` 等纯函数，测起来不依赖 HTTP。框架只 \`c.json\`。 | ⬜ |
| 6 | 单测为什么禁止 \`app.listen\`？用什么代替？ | listen 占端口、CI 易挂。\`await app.request("/health")\` 走内存里的 Request。 | ⬜ |
| 7 | 智能水杯库存 0，\`GET /products/9\` 和列表要不要丢掉它？ | 要保留。缺货 ≠ 不存在。404 只给没有这个 id。 | ⬜ |
| 8 | \`listProducts\` 为什么不能 \`return products\`？ | 要浅拷贝 \`slice()\`。同一引用的话，调用方 \`push\` 会脏仓库。 | ⬜ |
| 9 | health body 能不能加 \`uptime\`？ | 不能。精确 \`{ ok: true, service: "shop-api" }\` 两键。 | ⬜ |

## 🎓 费曼自检

- [ ] 能说清 Hono vs Spring / FastAPI，以及 param 是 string
- [ ] 能说清 404 JSON、201、纯函数与框架分工
- [ ] 能说清为什么禁止 listen、要用 \`app.request\`
`;

const chapter = {
  id: "ch17",
  num: "17",
  title: "Hono 第一个 API",
  runMode: "local",
  tutorialMd,
  assignment,
  testName: "ch17_assignment",
  testSource,
  reviewMd,
  interleaved: true,
  sections,
  functions,
  preamble,
  localHint: "bun test local/m4/ch17",
};

const out = join(dirname(fileURLToPath(import.meta.url)), "../src/content/chapters/ch17.json");
mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, JSON.stringify(chapter, null, 2) + "\n");
console.log("wrote", out);
