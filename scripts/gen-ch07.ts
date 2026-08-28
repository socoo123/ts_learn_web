/**
 * 生成 src/content/chapters/ch07.json
 * 运行：bun scripts/gen-ch07.ts
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const preamble = `/**
 * Ch07 作业：用 zod 校验边界数据。
 *
 * 场景：接口丢过来一份 unknown JSON——商品、Agent 工具调用参数、下单 payload。
 * TS 的 interface / type 编译后蒸发，挡不住脏数据。Ch02 的 assertProductShape
 * 只返回 boolean；本章用 zod 真正 parse。
 *
 * 本页已注入全局 z（zod）和 PRODUCTS，不要写 import。
 * 真实项目会写 import { z } from "zod"；本页运行器已注入，import 行会被剥掉。
 *
 * 约定：合法商品形如
 *   { id: 1, name: "机械键盘", category: "电脑外设",
 *     price: 599, stock: 120, sku: "KB-001" }
 * stock / price 为 0 仍是合法 number（CP-009 库存就是 0）。
 *
 * 全绿 = 你掌握了 Ch07，M1 收官。
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
    name: "productSchema",
    testSuite: "productSchema",
    skeleton: `/**
 * 【场景】仓储接口刚把 products.json 吐过来。先定义「一件合法商品」长什么样。
 *
 * 【转换点】z.object。Java 用 Bean Validation 注解；Python 用 Pydantic BaseModel；
 * TS 的 interface 编译后蒸发，运行时要靠 schema。
 *
 * 任务：返回 z.object({ id, name, category, price, stock, sku })，
 * 类型分别是 number / string / string / number / number / string。
 *
 * 真实项目常写：
 *   export const productSchema = z.object({ ... });
 * 本页写成函数，方便挂成一道练习。
 *
 * 示例：
 *   productSchema().parse(PRODUCTS[0])  -> 与 PRODUCTS[0] 深等
 *   productSchema().parse(CP-009)       -> 仍成功（stock 0 是合法 number）
 *   productSchema().parse({ name: 1 })  -> 抛错
 *
 * 提示：return z.object({ id: z.number(), name: z.string(), ... });
 *       六个字段都要。少写一个，parse 合法商品时那个键会被剥掉，测试会红。
 */
export function productSchema() {
  throw new Error("TODO");
}`,
  },
  {
    name: "parseProduct",
    testSuite: "parseProduct",
    skeleton: `/**
 * 【场景】单个商品详情接口：body 是 unknown，校验通过才交给页面。
 *
 * 【转换点】schema.parse。成功返回数据；失败抛错（调用方用 try/catch）。
 * 复用 productSchema()，不要另写一份字段清单。
 *
 * 任务：return productSchema().parse(data)，得到 Product。
 * 示例：
 *   parseProduct(PRODUCTS[0])  -> 机械键盘那件
 *   parseProduct(PRODUCTS[1])  -> 无线鼠标那件
 *   parseProduct({ name: 1 })  -> 抛错
 *   parseProduct("nope")       -> 抛错
 *
 * 提示：一行转给 parse。不要 data as Product——那是撒谎，不是校验。
 */
export function parseProduct(data: unknown): Product {
  throw new Error("TODO");
}`,
  },
  {
    name: "safeParseProduct",
    testSuite: "safeParseProduct",
    skeleton: `/**
 * 【场景】推荐位：脏数据不要把整页打爆，校验失败就当「没有这件商品」。
 *
 * 【转换点】safeParse vs parse。safeParse 不抛错，返回
 *   { success: true, data } 或 { success: false, error }。
 * 本题失败时返回 null（不要把 error 对象丢给调用方）。
 *
 * 任务：成功 → 商品对象；失败 → null。
 * 示例：
 *   safeParseProduct(PRODUCTS[0])     -> 机械键盘那件
 *   safeParseProduct({ name: 1 })     -> null
 *   safeParseProduct(null)            -> null
 *   safeParseProduct("nope")          -> null
 *
 * 提示：
 *   const r = productSchema().safeParse(data);
 *   return r.success ? r.data : null;
 */
export function safeParseProduct(data: unknown): Product | null {
  throw new Error("TODO");
}`,
  },
  {
    name: "parseProductList",
    testSuite: "parseProductList",
    skeleton: `/**
 * 【场景】商品列表接口：一整份数组都要过校验，有一件脏的就整份拒绝。
 *
 * 【转换点】z.array(schema)。对标 Java List<@Valid Product>、Pydantic list[Product]。
 * 空数组 [] 是合法列表。非数组（单个对象、字符串）要抛错。
 *
 * 任务：z.array(productSchema()).parse(data)，或对每个元素 parseProduct。
 * 示例：
 *   parseProductList(PRODUCTS)                    -> 10 件，与 PRODUCTS 深等
 *   parseProductList([])                          -> []
 *   parseProductList([PRODUCTS[0], PRODUCTS[4]])  -> 键盘 + 设计模式
 *   parseProductList(PRODUCTS[0])                 -> 抛错（那是对象不是数组）
 *
 * 提示：return z.array(productSchema()).parse(data);
 */
export function parseProductList(data: unknown): Product[] {
  throw new Error("TODO");
}`,
  },
  {
    name: "parseAndLabel",
    testSuite: "parseAndLabel",
    skeleton: `/**
 * 【场景】货架价签：先确认 JSON 真是一件商品，再打印 "名称 ¥价格"。
 *
 * 【转换点】z.infer。真实项目：
 *   const schema = z.object({ ... });
 *   type Product = z.infer<typeof schema>;   // 只存在于编译期
 * 本页 schema 是函数，等价：z.infer<ReturnType<typeof productSchema>>。
 * infer 不是运行时函数，JS 里没有 z.infer()。本页 preamble 手写了同形状的 Product。
 *
 * 任务：parse 成功后返回 \`\${p.name} ¥\${p.price.toFixed(2)}\`。
 * 非法数据抛错（跟 parseProduct 一样）。
 * 示例：
 *   parseAndLabel(PRODUCTS[0])  -> "机械键盘 ¥599.00"
 *   parseAndLabel(PRODUCTS[4])  -> "设计模式 ¥75.50"
 *   parseAndLabel({ name: "赠品", price: 0, ...六字段齐全 }) -> "赠品 ¥0.00"
 *   parseAndLabel({ name: 1 })  -> 抛错
 *
 * 提示：const p = parseProduct(data); 然后模板字符串。请先把 §7.2 写绿。
 */
export function parseAndLabel(data: unknown): string {
  throw new Error("TODO");
}`,
  },
  {
    name: "parseToolArgs",
    testSuite: "parseToolArgs",
    skeleton: `/**
 * 【场景】Agent 要调「加购」工具。模型吐出来的 arguments 是 unknown JSON，
 * 必须是 { sku: string, quantity: number }。缺字段、类型不对 → 直接抛错
 * （工具参数要严格，别 silent 成 null）。
 *
 * 【转换点】给工具调用写一个小 z.object。M5 的 AgentTool 就是这个形状。
 * quantity 为 0 是合法 number（「没买」也要能表达）。
 *
 * 任务：parse 成功返回 { sku, quantity }。失败抛错。
 * 示例：
 *   parseToolArgs({ sku: "KB-001", quantity: 2 })  -> { sku: "KB-001", quantity: 2 }
 *   parseToolArgs({ sku: "MS-002", quantity: 0 })  -> { sku: "MS-002", quantity: 0 }
 *   parseToolArgs({ sku: "KB-001" })               -> 抛错（缺 quantity）
 *   parseToolArgs({ sku: "KB-001", quantity: "2" })-> 抛错（string 不是 number）
 *
 * 提示：z.object({ sku: z.string(), quantity: z.number() }).parse(data)
 *       未知键默认会被剥掉；不要用 .strict()（本题不考拒绝多余字段）。
 */
export function parseToolArgs(data: unknown): { sku: string; quantity: number } {
  throw new Error("TODO");
}`,
  },
  {
    name: "parseOrderPayload",
    testSuite: "parseOrderPayload",
    skeleton: `/**
 * 【场景】下单 payload：sku + quantity 必填，note 可选。
 * 没传 note、或传了 null，统一成 null；传了字符串就保留。
 *
 * 【转换点】综合。sku/quantity 与 parseToolArgs 相同；再加
 *   note: z.string().nullable().optional()
 * 缺省时自己补 null（.default(null)，或 parse 之后 note ?? null）。
 *
 * 任务：返回 { sku, quantity, note }，note 类型是 string | null。
 * 示例：
 *   parseOrderPayload({ sku: "KB-001", quantity: 2 })
 *     -> { sku: "KB-001", quantity: 2, note: null }
 *   parseOrderPayload({ sku: "KB-001", quantity: 2, note: "急" })
 *     -> { sku: "KB-001", quantity: 2, note: "急" }
 *   parseOrderPayload({ sku: "KB-001", quantity: 2, note: null })
 *     -> note 仍是 null
 *   parseOrderPayload({ sku: 1, quantity: 2 })  -> 抛错
 *
 * 提示：不要先 parseToolArgs 再从结果里找 note——zod 默认剥掉未知键，note 会丢。
 *       一次 parse 三个字段，或缺 note 时用 ?? null。
 */
export function parseOrderPayload(
  data: unknown,
): { sku: string; quantity: number; note: string | null } {
  throw new Error("TODO");
}`,
  },
];

const assignment = `${preamble}

${functions.map((f) => f.skeleton).join("\n\n")}
`;

const testSource = `const GIFT = {
  id: 99,
  name: "赠品",
  category: "生活用品",
  price: 0,
  stock: 1,
  sku: "GF-099",
};

function threw(fn: () => unknown): boolean {
  try {
    fn();
    return false;
  } catch {
    return true;
  }
}

describe("productSchema", () => {
  it("parse 全量第一件，与 PRODUCTS[0] 深等", () => {
    expect(productSchema().parse(PRODUCTS[0])).toEqual(PRODUCTS[0]);
  });
  it("另一件设计模式（防硬编码机械键盘）", () => {
    expect(productSchema().parse(PRODUCTS[4])).toEqual(PRODUCTS[4]);
  });
  it("CP-009 库存 0 仍是合法 number", () => {
    const cup = PRODUCTS.find((p) => p.sku === "CP-009");
    expect(productSchema().parse(cup)).toEqual(cup);
    expect(productSchema().parse(cup).stock).toBe(0);
  });
  it("price 为 0 也能 parse", () => {
    expect(productSchema().parse(GIFT).price).toBe(0);
    expect(productSchema().parse(GIFT).name).toBe("赠品");
  });
  it("返回的是带 parse 的 schema，不是商品对象", () => {
    const s = productSchema();
    expect(typeof s.parse).toBe("function");
  });
});

describe("parseProduct", () => {
  it("成功：机械键盘", () => {
    expect(parseProduct(PRODUCTS[0])).toEqual(PRODUCTS[0]);
  });
  it("成功：无线鼠标（防硬编码）", () => {
    expect(parseProduct(PRODUCTS[1]).name).toBe("无线鼠标");
    expect(parseProduct(PRODUCTS[1]).sku).toBe("MS-002");
  });
  it("stock 0 的智能水杯", () => {
    const cup = PRODUCTS.find((p) => p.sku === "CP-009");
    expect(parseProduct(cup).stock).toBe(0);
  });
  it("price 0 的赠品", () => {
    expect(parseProduct(GIFT).price).toBe(0);
  });
  it("字段类型不对会抛错", () => {
    expect(threw(() => parseProduct({ name: 1 }))).toBe(true);
  });
  it("非对象字符串会抛错，且是 Error", () => {
    let err: unknown;
    try {
      parseProduct("nope");
    } catch (e) {
      err = e;
    }
    expect(err).toBeInstanceOf(Error);
  });
});

describe("safeParseProduct", () => {
  it("合法商品返回对象", () => {
    expect(safeParseProduct(PRODUCTS[0])).toEqual(PRODUCTS[0]);
  });
  it("另一件（防硬编码）", () => {
    expect(safeParseProduct(PRODUCTS[4]).name).toBe("设计模式");
  });
  it("非法对象返回 null，不抛错", () => {
    expect(safeParseProduct({ name: 1 })).toBeNull();
  });
  it("null 输入返回 null", () => {
    expect(safeParseProduct(null)).toBeNull();
  });
  it("字符串返回 null", () => {
    expect(safeParseProduct("nope")).toBeNull();
  });
  it("失败不要返回 error 对象", () => {
    const r = safeParseProduct(1);
    expect(r).toBeNull();
  });
  it("price 0 仍是成功", () => {
    expect(safeParseProduct(GIFT).price).toBe(0);
  });
});

describe("parseProductList", () => {
  it("全量 PRODUCTS", () => {
    expect(parseProductList(PRODUCTS)).toEqual(PRODUCTS);
  });
  it("两件子集（防硬编码整表）", () => {
    expect(parseProductList([PRODUCTS[0], PRODUCTS[4]])).toEqual([
      PRODUCTS[0],
      PRODUCTS[4],
    ]);
  });
  it("空数组是合法列表", () => {
    expect(parseProductList([])).toEqual([]);
  });
  it("列表里含库存 0", () => {
    const cup = PRODUCTS.find((p) => p.sku === "CP-009");
    expect(parseProductList([cup])[0].stock).toBe(0);
  });
  it("单个对象不是数组，抛错", () => {
    expect(threw(() => parseProductList(PRODUCTS[0]))).toBe(true);
  });
  it("数组里有脏元素，整份抛错", () => {
    expect(threw(() => parseProductList([PRODUCTS[0], { name: 1 }]))).toBe(true);
  });
});

describe("parseAndLabel", () => {
  it("机械键盘价签", () => {
    expect(parseAndLabel(PRODUCTS[0])).toBe("机械键盘 ¥599.00");
  });
  it("设计模式价签（防硬编码键盘）", () => {
    expect(parseAndLabel(PRODUCTS[4])).toBe("设计模式 ¥75.50");
  });
  it("0 元赠品", () => {
    expect(parseAndLabel(GIFT)).toBe("赠品 ¥0.00");
  });
  it("非法数据抛错", () => {
    expect(threw(() => parseAndLabel({ name: 1 }))).toBe(true);
  });
});

describe("parseToolArgs", () => {
  it("合法加购", () => {
    expect(parseToolArgs({ sku: "KB-001", quantity: 2 })).toEqual({
      sku: "KB-001",
      quantity: 2,
    });
  });
  it("另一件（防硬编码 KB-001）", () => {
    expect(parseToolArgs({ sku: "MS-002", quantity: 3 }).sku).toBe("MS-002");
    expect(parseToolArgs({ sku: "MS-002", quantity: 3 }).quantity).toBe(3);
  });
  it("quantity 为 0 合法", () => {
    expect(parseToolArgs({ sku: "KB-001", quantity: 0 })).toEqual({
      sku: "KB-001",
      quantity: 0,
    });
  });
  it("缺 quantity 抛错", () => {
    expect(threw(() => parseToolArgs({ sku: "KB-001" }))).toBe(true);
  });
  it("quantity 是字符串抛错", () => {
    expect(threw(() => parseToolArgs({ sku: "KB-001", quantity: "2" }))).toBe(true);
  });
  it("多余键被剥掉，只留 sku 和 quantity", () => {
    expect(parseToolArgs({ sku: "HP-006", quantity: 1, extra: true })).toEqual({
      sku: "HP-006",
      quantity: 1,
    });
  });
});

describe("parseOrderPayload", () => {
  it("没传 note → null", () => {
    expect(parseOrderPayload({ sku: "KB-001", quantity: 2 })).toEqual({
      sku: "KB-001",
      quantity: 2,
      note: null,
    });
  });
  it("有 note 保留", () => {
    expect(parseOrderPayload({ sku: "KB-001", quantity: 2, note: "急" })).toEqual({
      sku: "KB-001",
      quantity: 2,
      note: "急",
    });
  });
  it("另一件 + 留言（防硬编码）", () => {
    expect(parseOrderPayload({ sku: "MS-002", quantity: 1, note: "包装好" })).toEqual({
      sku: "MS-002",
      quantity: 1,
      note: "包装好",
    });
  });
  it("显式 note: null", () => {
    expect(parseOrderPayload({ sku: "KB-001", quantity: 1, note: null }).note).toBeNull();
  });
  it("quantity 0 且没 note", () => {
    expect(parseOrderPayload({ sku: "CP-009", quantity: 0 })).toEqual({
      sku: "CP-009",
      quantity: 0,
      note: null,
    });
  });
  it("sku 类型不对抛错", () => {
    expect(threw(() => parseOrderPayload({ sku: 1, quantity: 2 }))).toBe(true);
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
    `> **预计**：1 天 ｜ **前置**：Ch01–Ch06（尤其 Ch01 类型蒸发、Ch02 \`assertProductShape\`）
> **目标**：明白 **TS 类型编译后蒸发**；边界数据必须用 zod。为 M4 / M5 铺路。
> 你 15 年 Java：\`@NotNull\` / \`@Valid\` 在运行时还在。TS 的 \`interface Product\` **挡不住 JSON**。

> 📐 **本教程的契约**：下面每一节（§7.1–§7.7）都**精确对应**作业里的题。讲过的才考，考的必讲过。卡住时按作业函数名回查对应小节。
> 浏览器章可以用 zod（纯 JS）。**不要**上 tRPC。

---`,
    [],
  ),
  sec(
    "sec-map",
    "🗺️ 本章地图",
    null,
    `本章作业是一条完整主线：**校验 \`products.json\` 的形状，再校验 Agent 工具参数**。7 个函数，从 schema 走到下单 payload。

读完这章 + 完成作业，你将能够：

- 说清为什么 \`data as Product\` 是谎言，zod \`parse\` 才是门卫
- 对照 Java Bean Validation、Python Pydantic，写出 \`z.object\` / \`z.array\`
- 分清 \`parse\`（失败抛错）和 \`safeParse\`（失败返回结果对象）
- 用 \`z.infer\` 从 schema 推出类型（它只存在于编译期）
- 给 Agent 工具参数写一个严格的小 schema（为 M5 铺路）
- 处理可选字段缺省成 \`null\`，并且 **0 是合法 number**

**作业 ↔ 教程对应表**（学哪节，就去做哪题）：

| 作业题 | 对应小节 | 核心知识点 |
|--------|----------|-----------|
| \`productSchema\` | §7.1 | 导出 schema（\`z.object\`） |
| \`parseProduct\` | §7.2 | \`parse\` 成功 |
| \`safeParseProduct\` | §7.3 | \`safeParse\` 失败返回 null |
| \`parseProductList\` | §7.4 | \`z.array\` |
| \`parseAndLabel\` | §7.5 | \`z.infer\`（类型只在编译期） |
| \`parseToolArgs\` | §7.6 | 工具参数对象（为 Agent 铺路） |
| \`parseOrderPayload\` | §7.7 | 综合：可选 note + 缺省 null |

> ⚠️ **本页已注入全局 \`z\`（zod）和 \`PRODUCTS\`，不要写 \`import { z } from "zod"\`。** 真实 \`.ts\` 文件里要 import；本页运行器会剥掉 import 行，并把 \`z\` 当全局塞进来。

---`,
    [],
  ),
  sec(
    "sec-path",
    "⏱️ 学习路径：费曼五步（约 60–90 分钟）",
    null,
    `| 步 | 你要做 | 在哪做 |
|----|--------|--------|
| ① 预览猜（2 分钟） | 看下面的差异，先猜运行时谁把关 | 本页 ① |
| ② 先动手 | 每节后面的编辑器里**先试着写** | 本节练习 |
| ③ 提取+反馈 | 点「运行测试」看红绿 | 本节练习 |
| ④ 费曼（2 分钟） | 大白话讲清「interface 为什么挡不住 JSON」 | 本页 ④ |
| ⑤ 存闪卡 | 章末闪卡标复习日期 | 闪卡 |

> 💡 别从头读到尾。先扫 ① → 写作业 → **哪题卡了，回对应 § 查** → 改 → 再跑。
> 后面的题要复用 \`productSchema()\` / \`parseProduct\`，建议按顺序做。

---`,
    [],
  ),
  sec(
    "sec-guess",
    "① 预览猜（2 分钟 · 激活你的 Java / Python 直觉）",
    null,
    `先别看答案，凭经验猜一猜（猜错没关系）：

1. \`const p = JSON.parse(body) as Product\`。JSON 里缺了 \`sku\`，tsc 会红吗？页面跑起来会怎样？
2. Ch02 的 \`assertProductShape\` 返回 \`true/false\`。和 \`schema.parse(data)\` 差在哪？
3. Java 的 \`@Valid\` + \`@NotNull\` 在运行时还在不在？TS 的 \`interface Product\` 呢？
4. \`parse\` 失败 vs \`safeParse\` 失败，调用方代码分别怎么写？
5. \`type Product = z.infer<typeof schema>\` 发出去的 JS 里还有这行吗？
6. \`stock: 0\` 的智能水杯，\`z.number()\` 过不过？\`if (stock)\` 会怎样？
7. 本页作业要不要写 \`import { z } from "zod"\`？

> 猜完，带着验证心态进入正文。第 1 题是整章的 🔴。

---`,
    [],
  ),
  sec(
    "sec-world",
    "世界地图：类型蒸发之后，谁在门口 🔴",
    null,
    `Ch01 说过：\`tsc\` 擦掉类型，发出 JS。Ch02 的 \`assertProductShape\` 是手写 boolean 雏形。本章把门口换成 **zod**——和 Java / Python 同一类东西：运行时校验。

| | Java | Python | TypeScript |
|---|---|---|---|
| 静态类型 | 编译期硬约束 | 注解可选（mypy） | **编译期硬约束** |
| 运行时类型 | bytecode 还留着；\`instanceof\` | 鸭子；Pydantic 可选 | **蒸发**，没有 \`Product\` 类 |
| 边界校验 | Bean Validation（\`@NotNull\` \`@Valid\`） | **Pydantic** \`model_validate\` | **zod** \`parse\` / \`safeParse\` |

### Java 对照：注解在运行时还在

\`\`\`java
public class Product {
    @NotNull String name;
    @DecimalMin("0") BigDecimal price;
}
// Spring @Valid @RequestBody Product body
// 缺字段 → 400，不是「编译过了就算」
\`\`\`

### Python 对照：Pydantic（你刚学过）

\`\`\`python
from pydantic import BaseModel

class Product(BaseModel):
    id: int
    name: str
    category: str
    price: float
    stock: int
    sku: str

Product.model_validate({"name": 1})   # ValidationError
\`\`\`

### TypeScript：interface 是编译期的，JSON 是运行时的 🔴

\`\`\`ts
interface Product {
  id: number;
  name: string;
  category: string;
  price: number;
  stock: number;
  sku: string;
}

const data: unknown = JSON.parse('{"name":1}');
const p = data as Product;   // ❌ tsc 不红，运行时 p.name 是数字 1
p.name.toUpperCase();        // 💥 运行时炸
\`\`\`

\`as Product\` 是对编译器说「信我」。编译器信了；JSON 不信你。

\`\`\`ts
// ✅ 门口有人查证件
const p = productSchema().parse(data);  // 不合法就抛错，合法才往下走
\`\`\`

> 🤯 **转换点**：TS 类型 = 给同事和 tsc 看的图纸。zod schema = 给运行时看的门卫。图纸和门卫要**同一份字段清单**，否则你以为有 \`sku\`，JSON 里可能没有。
>
> Ch02 的 \`assertProductShape\` 只回答 yes/no。zod 还能：**失败时抛出带路径的错**，成功时把数据收成「形状对了」的对象（默认剥掉未知键）。

### 本课怎么算「会了」

编辑器红线 ≈ 你有没有把 \`unknown\` 乱当 Product 用。点「运行测试」≈ 真的 parse 了一份 JSON。**测试全绿 = 这题掌握。**

---`,
    [],
  ),
  sec(
    "sec-7.1",
    "§7.1 `z.object`：先写门卫（对应：`productSchema`）🔴",
    "7.1",
    `一件商品六个字段，和 \`shared.json\` / 前几章完全一样。

### 真实项目 vs 本页练习

\`\`\`ts
// 真实项目（.ts 文件）
import { z } from "zod";
export const productSchema = z.object({
  id: z.number(),
  name: z.string(),
  category: z.string(),
  price: z.number(),
  stock: z.number(),
  sku: z.string(),
});
\`\`\`

本页**不要 import**。写成函数，方便挂成一道练习：

\`\`\`ts
function productSchema() {
  return z.object({
    id: z.number(),
    name: z.string(),
    category: z.string(),
    price: z.number(),
    stock: z.number(),
    sku: z.string(),
  });
}

productSchema().parse(PRODUCTS[0]);  // ✅ 机械键盘，原样返回
productSchema().parse(PRODUCTS[8]);  // ✅ 智能水杯，stock 仍是 0
\`\`\`

\`z.number()\` **接受 0**。0 不是「没填」，也不是非法。CP-009 库存为 0，必须能过。

### 少写一个字段会怎样

zod 对象**默认剥掉未知键**（zod 3 / 4 都这样；想拒绝多余键才 \`.strict()\`，本题不用）。

如果你的 schema **漏了 \`stock\`**：\`parse(PRODUCTS[0])\` 会成功，但结果里没有 \`stock\`，和 \`PRODUCTS[0]\` 深等就会红。六个字段都要写上。

### ❌ / ✅

\`\`\`ts
// ❌ 返回已经 parse 好的商品——本题要返回 schema，测试会调 .parse
return PRODUCTS[0];

// ❌ 只写 name/price（Ch02 那块最小形状）——缺 id/sku/stock
return z.object({ name: z.string(), price: z.number() });

// ❌ import { z } from "zod"  —— 本页已注入，import 会被剥掉；写了也没必要

// ✅ 返回 z.object({ 六个字段 })
\`\`\`

> ✅ **做 \`productSchema\`**：\`return z.object({ ... })\`。测试会 \`productSchema().parse(PRODUCTS[0])\` 深等，并专门查 CP-009 的 \`stock === 0\`。

---`,
    ["productSchema"],
  ),
  sec(
    "sec-7.2",
    "§7.2 `parse`：成功拿到数据，失败就抛（对应：`parseProduct`）🟡",
    "7.2",
    `详情接口：要么给你一件真商品，要么让调用方进 \`catch\`。不要返回半残对象。

\`\`\`ts
function parseProduct(data: unknown): Product {
  return productSchema().parse(data);
}

parseProduct(PRODUCTS[0]);           // ✅ 机械键盘
parseProduct(PRODUCTS[1]);           // ✅ 无线鼠标
parseProduct({ name: 1 });           // ❌ 抛错
parseProduct("nope");                // ❌ 抛错
\`\`\`

抛出来的是 \`ZodError\`，它 **instanceof Error**。测试用 try/catch 查「有没有抛」，不使用 \`.toThrow\`（本页小测试器没有这个 API）。

### 和 \`as\` 的对照 🔴

\`\`\`ts
// ❌ 没校验，只是让 tsc 闭嘴
function parseProduct(data: unknown): Product {
  return data as Product;
}

// ✅ 先查证件。本页编辑器把 z.parse 标成返回 unknown，
//    真实项目里 parse 的返回类型已经是 z.infer<typeof schema>。
//    若编辑器红线，校验之后再 as Product 可以；未校验就 as 不行。
return productSchema().parse(data);
\`\`\`

请复用 \`productSchema()\`，不要复制一份字段。后面列表题还要用。

> ✅ **做 \`parseProduct\`**：一行 \`.parse(data)\`。测试会查另一件商品（防硬编码键盘），以及 \`{ name: 1 }\` / \`"nope"\` 必须抛。

---`,
    ["parseProduct"],
  ),
  sec(
    "sec-7.3",
    "§7.3 `safeParse`：失败返回 null（对应：`safeParseProduct`）🟡",
    "7.3",
    `推荐位吃到脏 JSON，不要把整页打爆。\`safeParse\` **不抛错**。

\`\`\`ts
const r = productSchema().safeParse(data);
// r.success === true  → r.data 是商品
// r.success === false → r.error 是 ZodError，里面有 issues
\`\`\`

本题约定更简单：失败一律 **\`null\`**。不要把 \`error\` 对象返回去——调用方只想知道「有没有这件货」。

\`\`\`ts
function safeParseProduct(data: unknown): Product | null {
  const r = productSchema().safeParse(data);
  return r.success ? r.data : null;
}

safeParseProduct(PRODUCTS[0]);   // ✅ 对象
safeParseProduct({ name: 1 });   // null
safeParseProduct(null);          // null   ← JSON 里的 null
safeParseProduct("nope");        // null
\`\`\`

### 何时 parse、何时 safeParse

| | \`parse\` | \`safeParse\` |
|---|---|---|
| 成功 | 返回数据 | \`{ success: true, data }\` |
| 失败 | **抛错** | \`{ success: false, error }\`，不抛 |
| 适合 | 边界必须合法（下单、工具参数） | 展示位、试探、不想炸栈 |

Ch06 你写过 \`catch\` 里 \`err\` 是 \`unknown\`。\`parse\` 失败走那条路；\`safeParse\` 用 \`success\` 收窄，不必 catch。

> ✅ **做 \`safeParseProduct\`**：看 \`r.success\`。测试会查 \`null\` 输入、字符串、以及失败结果必须是 \`null\` 不是 error 对象。

---`,
    ["safeParseProduct"],
  ),
  sec(
    "sec-7.4",
    "§7.4 `z.array`：整份列表（对应：`parseProductList`）🟡",
    "7.4",
    `列表接口不是「我随便给一个对象」。必须是**数组**，且**每一件**都过商品 schema。

\`\`\`ts
function parseProductList(data: unknown): Product[] {
  return z.array(productSchema()).parse(data);
}

parseProductList(PRODUCTS);       // ✅ 10 件
parseProductList([]);             // ✅ 空列表合法
parseProductList(PRODUCTS[0]);    // ❌ 那是对象，不是数组
parseProductList([PRODUCTS[0], { name: 1 }]);  // ❌ 有一件脏的，整份拒绝
\`\`\`

对标：

- Java：\`List<@Valid Product>\` —— 有一件校验失败，整份 400
- Pydantic：\`list[Product]\`

也可以 \` (data as unknown[]).map(parseProduct) \`，但先确认是数组，否则 \`map\` 会炸得很难看。\`z.array\` 一步到位。

空数组 \`[]\`：**零件合法商品**，不是失败。不要把它和「字段缺失」搞混。

> ✅ **做 \`parseProductList\`**：\`z.array(productSchema()).parse(data)\`。测试会查全量、空数组、单对象当列表（必须抛）、数组里夹脏数据。

---`,
    ["parseProductList"],
  ),
  sec(
    "sec-7.5",
    "§7.5 `z.infer`：类型从 schema 长出来（对应：`parseAndLabel`）🔴",
    "7.5",
    `schema 已经是唯一真相。再手写一份 \`interface Product\` 会漂——改了 schema 忘改 interface。

真实项目：

\`\`\`ts
import { z } from "zod";

const schema = z.object({
  id: z.number(),
  name: z.string(),
  category: z.string(),
  price: z.number(),
  stock: z.number(),
  sku: z.string(),
});

type Product = z.infer<typeof schema>;
// Product 就是 { id: number; name: string; ... }，和 schema 同步
\`\`\`

本页 \`productSchema\` 是函数：

\`\`\`ts
type Product = z.infer<ReturnType<typeof productSchema>>;
\`\`\`

**\`z.infer\` 只存在于编译期。** 运行时没有 \`z.infer()\` 这个函数。\`tsc\` 发出的 JS 里这行 type 直接消失——和 Ch01 的类型蒸发是同一件事。

本页编辑器给 \`z\` 的类型桩比较瘦，\`z.infer<...>\` 可能画红线；作业 preamble 里手写了同形状的 \`Product\`，语义一样。装了真正的 \`zod\` 类型之后，infer 是绿的。

### 本题：parse 完再贴价签

\`\`\`ts
function parseAndLabel(data: unknown): string {
  const p = parseProduct(data);   // 这里的 p 已经是 Product
  return \`\${p.name} ¥\${p.price.toFixed(2)}\`;
}

parseAndLabel(PRODUCTS[0]);  // "机械键盘 ¥599.00"
parseAndLabel(PRODUCTS[4]);  // "设计模式 ¥75.50"
parseAndLabel(GIFT);         // "赠品 ¥0.00"   ← 0 元也要两位小数
parseAndLabel({ name: 1 });  // 抛错
\`\`\`

请复用 \`parseProduct\`（或自己 \`.parse\`）。不要硬编码 \`"机械键盘 ¥599.00"\`。

> ✅ **做 \`parseAndLabel\`**：parse → 模板字符串 + \`toFixed(2)\`。测试会查设计模式和 0 元赠品，专治硬编码。

---`,
    ["parseAndLabel"],
  ),
  sec(
    "sec-7.6",
    "§7.6 工具参数：模型吐的 JSON 不可信（对应：`parseToolArgs`）🔴",
    "7.6",
    `M5 做 Agent 时，模型会决定调哪个工具、参数是什么。那串 arguments **不是**你的 TS 函数实参——是 JSON。形状错了（\`quantity\` 写成字符串 \`"2"\`、漏字段）必须挡在门口。

本题模拟「加购」工具：只要 \`sku: string\` + \`quantity: number\`。

\`\`\`ts
function parseToolArgs(data: unknown): { sku: string; quantity: number } {
  return z
    .object({
      sku: z.string(),
      quantity: z.number(),
    })
    .parse(data);
}

parseToolArgs({ sku: "KB-001", quantity: 2 });
// -> { sku: "KB-001", quantity: 2 }

parseToolArgs({ sku: "KB-001", quantity: 0 });
// -> quantity 0 合法（「这次买 0 件」）

parseToolArgs({ sku: "KB-001" });                 // ❌ 缺 quantity，抛错
parseToolArgs({ sku: "KB-001", quantity: "2" });  // ❌ string ≠ number，抛错
\`\`\`

工具参数用 **\`parse\`（抛错）**，不要 silent 成 null。调用方 catch 之后才能告诉模型「参数不合法，再试」。

### 多余字段

\`\`\`ts
parseToolArgs({ sku: "HP-006", quantity: 1, extra: true });
// -> { sku: "HP-006", quantity: 1 }   默认剥掉 extra
\`\`\`

zod 4 和 3 一样：普通 \`z.object\` **剥未知键**。想「多一个键就失败」才 \`.strict()\`。本题不要求 strict；测试用 \`toEqual\` 精确匹配两个键，所以剥掉是预期行为。

> ✅ **做 \`parseToolArgs\`**：小 \`z.object\` + \`parse\`。测试会查 quantity 0、缺字段、字符串数量、以及多余键被剥掉。

---`,
    ["parseToolArgs"],
  ),
  sec(
    "sec-7.7",
    "§7.7 综合：下单 payload（对应：`parseOrderPayload`）🟡",
    "7.7",
    `下单比加购多一个可选留言。\`sku\` / \`quantity\` 仍必填；\`note\` 可以没有。

约定：

- 没传 \`note\` → \`note: null\`
- \`note: null\` → 仍是 \`null\`
- \`note: "急"\` → 保留字符串

\`\`\`ts
function parseOrderPayload(
  data: unknown,
): { sku: string; quantity: number; note: string | null } {
  const parsed = z
    .object({
      sku: z.string(),
      quantity: z.number(),
      note: z.string().nullable().optional().default(null),
    })
    .parse(data);
  return parsed;
}
\`\`\`

没有 \`.default\` 也可以：\`z.string().nullable().optional()\`，然后 \`note: parsed.note ?? null\`。两种都行。

\`\`\`ts
parseOrderPayload({ sku: "KB-001", quantity: 2 });
// -> { sku: "KB-001", quantity: 2, note: null }

parseOrderPayload({ sku: "KB-001", quantity: 2, note: "急" });
// -> { ..., note: "急" }

parseOrderPayload({ sku: "CP-009", quantity: 0 });
// -> quantity 0，note null

parseOrderPayload({ sku: 1, quantity: 2 });  // ❌ sku 不是 string
\`\`\`

### 不要先 \`parseToolArgs\` 再找 note

\`parseToolArgs\` 的 schema 没有 \`note\`，**未知键会被剥掉**。先调它，结果里就没有留言了。综合题请一次 parse 三个字段（sku/quantity 的写法可以抄 §7.6）。

> ✅ **做 \`parseOrderPayload\`**：三个字段；缺 note 补 \`null\`。测试会查「急」、另一件防硬编码、显式 null、quantity 0、sku 类型错误。

---`,
    ["parseOrderPayload"],
  ),
  sec(
    "sec-pits",
    "§7.8 Java / Python 老手几个坑 ⚠️",
    "7.8",
    `1. **\`interface\` 挡不住 JSON。** 对标的是 Bean Validation / Pydantic，不是 \`implements\`。
2. **不要 \`data as Product\`。** 那是对 tsc 撒谎。先 \`parse\`。
3. **\`z.infer\` 不是函数。** 写 \`type P = z.infer<typeof schema>\`；运行时没这行。
4. **0 是合法 number。** \`stock: 0\`、\`price: 0\`、\`quantity: 0\` 都必须过。别写 \`z.number().positive()\`（本题没要求）。
5. **\`parse\` 抛、\`safeParse\` 不抛。** 选错会让测试红（要么该 catch 的没抛，要么该 null 的炸了）。
6. **失败返回 null，不是 error 对象。** \`safeParseProduct\` 只要 \`Product | null\`。
7. **本页不要 import zod。** 全局已注入 \`z\` 和 \`PRODUCTS\`。
8. **默认剥未知键。** 漏写 schema 字段，合法商品 parse 完会少键。多余键想拒绝才 \`.strict()\`（不考）。
9. **不要上 tRPC。** 那是后面的栈；本章只学门口的 schema。

---`,
    [],
  ),
  sec(
    "sec-homework",
    "📝 本章作业",
    null,
    `上面 7 个函数按节交错出现。每个注释里有【场景】【转换点】、示例和提示。

**完成方式**：在编辑器里改 \`throw new Error("TODO")\`，点「▶ 运行测试」。全绿 = 这题过了。

卡住就回对应 §：\`productSchema\` → §7.1，\`safeParseProduct\` → §7.3，\`parseToolArgs\` → §7.6。

---`,
    [],
  ),
  sec(
    "sec-check",
    "✅ 自测：你真的掌握了吗？",
    null,
    `- [ ] 能说清「TS 类型蒸发，所以 JSON 入口必须 zod」
- [ ] 能对照 Java \`@Valid\` / Python Pydantic 说出 zod 的位置
- [ ] 知道 \`parse\` 抛错、\`safeParse\` 返回 \`{ success }\`
- [ ] 知道 \`z.infer\` 只在编译期，运行时没有
- [ ] 坚持 0 是合法 number（库存 / 价格 / 数量）
- [ ] 不会写 \`data as Product\` 冒充校验
- [ ] 7 个作业全绿

---`,
    [],
  ),
  sec(
    "sec-feynman",
    "🎓 费曼挑战",
    null,
    `用大白话讲给「Java 同事」听。讲不清 = 还没真懂。

任选一题（1–2 分钟）：

1. 「我都写了 \`interface Product\`，为什么 \`JSON.parse\` 之后还要 zod？\`as Product\` 不行吗？」— 卡壳重读世界地图 + §7.1 + §7.2
2. 「Pydantic 的 \`model_validate\` 和 \`parse\` / \`safeParse\` 怎么对应？失败时我该抛还是该返回 null？」— 卡壳重读 §7.2 + §7.3
3. 「\`type Product = z.infer<typeof schema>\` 既然会蒸发，写它有什么用？和手写 interface 比，谁才是真相？」— 卡壳重读 §7.5

---`,
    [],
  ),
  sec(
    "sec-next",
    "⏭️ 下一步",
    null,
    `Ch07 掌握后，**M1 收官**。下一章进 **Ch08 · Event Loop**（M2 背景知识）：宏任务 / 微任务顺序，流式回调为什么「看起来乱」。zod 会在 M4（Hono 校验 body）和 M5（Agent 工具参数）再次出现，那时不再重讲 \`z.object\`。`,
    [],
  ),
];

const tutorialMd = `# Ch07 · 运行时校验：zod

${sections
  .map((s) => (s.heading ? `## ${s.heading}\n\n${s.body}` : s.body))
  .join("\n\n")}
`;

const reviewMd = `# Ch07 · 记忆闪卡

> 先回忆，再翻答案。连续 2 次秒答 → 退役。

## 🔖 闪卡

| # | 正面（问题） | 背面（答案） | 掌握 |
|---|---|---|---|
| 1 | \`interface Product\` 挡得住 \`JSON.parse\` 出来的脏数据吗？ | 挡不住。类型编译后蒸发。门口要用 zod（或手写检查）。这是本章 🔴 | ⬜ |
| 2 | \`const p = data as Product\` 错在哪？ | \`as\` 只让 tsc 闭嘴，运行时不查。缺字段、类型错都会当成 Product 往下传 | ⬜ |
| 3 | Java Bean Validation / Python Pydantic 在 TS 里的对标是什么？ | **zod**。\`z.object({...}).parse(data)\` ≈ \`@Valid\` / \`model_validate\` | ⬜ |
| 4 | \`parse\` 失败和 \`safeParse\` 失败有什么差别？ | \`parse\` 抛 \`ZodError\`；\`safeParse\` 不抛，返回 \`{ success: false, error }\` | ⬜ |
| 5 | 本题 \`safeParseProduct\` 失败应返回什么？ | **\`null\`**，不是 error 对象，也不要抛 | ⬜ |
| 6 | \`z.infer<typeof schema>\` 运行时还在吗？ | 不在。它是类型运算符，只存在于编译期。JS 里没有 \`z.infer()\` | ⬜ |
| 7 | \`stock: 0\` / \`price: 0\` / \`quantity: 0\`，\`z.number()\` 过不过？ | 过。0 是合法 number。不要用 truthiness 把它当「没填」 | ⬜ |
| 8 | 本页要不要 \`import { z } from "zod"\`？ | 不要。已注入全局 \`z\` 和 \`PRODUCTS\`。真实项目的 \`.ts\` 文件才 import | ⬜ |
| 9 | \`z.object\` 遇到未知键默认怎样？想拒绝才用什么？ | 默认**剥掉**。\`.strict()\` 才会因多余键失败。本题不考 strict | ⬜ |
| 10 | 列表校验用什么？空数组算不算合法？ | \`z.array(schema)\`。\`[]\` 合法。非数组、或元素有一件脏，整份失败 | ⬜ |
| 11 | Agent 工具参数为什么不能信模型吐的 JSON？ | 那是运行时字符串/对象，不是 TS 实参。缺字段、\`quantity: "2"\` 必须 parse 挡掉 | ⬜ |
| 12 | 可选 \`note\` 没传，本题要返回什么？ | \`note: null\`（不是 \`undefined\`，也不是缺这个键） | ⬜ |

## 🎓 费曼自检

- [ ] 能说清「图纸（类型）vs 门卫（zod）」
- [ ] 能说清 parse / safeParse 何时用哪个
- [ ] 能说清 infer 蒸发、0 合法、不要 as 冒充校验
`;

const chapter = {
  id: "ch07",
  num: "07",
  title: "运行时校验：zod",
  runMode: "browser",
  tutorialMd,
  assignment,
  testName: "ch07_assignment",
  testSource,
  reviewMd,
  interleaved: true,
  sections,
  functions,
  preamble,
};

const out = join(dirname(fileURLToPath(import.meta.url)), "../src/content/chapters/ch07.json");
mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, JSON.stringify(chapter, null, 2) + "\n");
console.log("wrote", out);
