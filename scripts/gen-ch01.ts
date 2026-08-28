/**
 * 生成 src/content/chapters/ch01.json
 * 运行：bun scripts/gen-ch01.ts
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const preamble = `/**
 * Ch01 作业：电商后台工具函数。
 *
 * 场景：给电商后台写一组工具——算订单金额、解析 SKU、生成价格标签、
 * 找有货商品、看运行时类型、盘点缺货和汇总。
 * 8 个函数，每个砸在一个 Java / Python → TypeScript 的转换点上。
 *
 * 约定：商品对象形如
 *   { id: 1, name: "机械键盘", category: "电脑外设",
 *     price: 599, stock: 120, sku: "KB-001" }
 * 类型在编译期检查；点「运行测试」时已经擦成 JS，靠测试兜底行为。
 *
 * 全绿 = 你掌握了 Ch01。
 */`;

const functions = [
  {
    name: "calcLineTotal",
    testSuite: "calcLineTotal",
    skeleton: `/**
 * 【场景】订单中心：计算一个订单行的金额（单价 × 数量）。
 *
 * 【转换点】类型注解。Java 的 double/int 编译期硬约束；
 * Python 的注解运行时不强制；TS 的 : number 在 tsc / 编辑器里真的会挡，
 * 但发出去的 JS 里类型蒸发。
 *
 * 任务：返回 price * quantity。
 * 示例：
 *   calcLineTotal(599.0, 2)  -> 1198
 *   calcLineTotal(89, 3)     -> 267
 *   calcLineTotal(599.0, 0)  -> 0
 */
export function calcLineTotal(price: number, quantity: number): number {
  throw new Error("TODO");
}`,
  },
  {
    name: "parseSku",
    testSuite: "parseSku",
    skeleton: `/**
 * 【场景】仓储：SKU 规则是 "类目前缀-序号"，如 "KB-001"。
 * 拆成 [前缀, 序号]，序号转成 number（去掉前导零，方便排序）。
 *
 * 【转换点】元组类型 [string, number]。Java 要返回两个值得造 record；
 * Python 用 tuple[str, int]；TS 用元组类型，运行时其实是数组。
 *
 * 任务：按 "-" split，返回 [prefix, Number(num)]。
 * 示例：
 *   parseSku("KB-001")  -> ["KB", 1]
 *   parseSku("BK-005")  -> ["BK", 5]
 *   parseSku("MN-003")  -> ["MN", 3]   // 前导零必须去掉
 *
 * 提示：
 *   sku.split("-")           -> ["KB", "001"]
 *   const [prefix, num] = …  解构
 *   Number("001")            -> 1
 */
export function parseSku(sku: string): [string, number] {
  throw new Error("TODO");
}`,
  },
  {
    name: "formatPriceTag",
    testSuite: "formatPriceTag",
    skeleton: `/**
 * 【场景】运营后台：生成商品价格标签，默认人民币，可切美元。
 *
 * 【转换点】默认参数 + 模板字符串 + toFixed(2)。
 * Java 要为可选货币写重载；TS / Python 一个默认参数搞定。
 *
 * 任务：返回 "名称 货币符号价格（两位小数）"。
 * 示例：
 *   formatPriceTag("机械键盘", 599.0)                 -> "机械键盘 ¥599.00"
 *   formatPriceTag("无线鼠标", 159.0, "$")            -> "无线鼠标 $159.00"
 *   formatPriceTag("设计模式", 75.5)                  -> "设计模式 ¥75.50"
 *
 * 提示：\`\${name} \${currency}\${price.toFixed(2)}\`
 */
export function formatPriceTag(name: string, price: number, currency = "¥"): string {
  throw new Error("TODO");
}`,
  },
  {
    name: "renderPriceList",
    testSuite: "renderPriceList",
    skeleton: `/**
 * 【场景】对账导出：把商品列表渲成多行文本，每行一个价格标签。
 * 直接复用上面的 formatPriceTag。
 *
 * 【转换点】map + join。对标 Java stream().map() + String.join。
 *
 * 任务：对每个商品调用 formatPriceTag(name, price, currency)，
 * 用 "\\n" 拼成一个字符串。空列表返回 ""。
 * 示例：
 *   renderPriceList([{ name: "无线鼠标", price: 159.0 },
 *                    { name: "设计模式", price: 75.5 }])
 *     -> "无线鼠标 ¥159.00\\n设计模式 ¥75.50"
 *   renderPriceList([]) -> ""
 */
export function renderPriceList(
  products: { name: string; price: number }[],
  currency = "¥",
): string {
  throw new Error("TODO");
}`,
  },
  {
    name: "firstInStockName",
    testSuite: "firstInStockName",
    skeleton: `/**
 * 【场景】推荐位：展示第一个有货商品名；全缺货或列表为空则不展示。
 *
 * 【转换点】T | null + 提前 return。
 * Python 课可以用 if stock:（0 是 falsy）。本课不要靠 JS 的 truthiness：
 * 显式写 stock > 0。没找到返回 null（不是 undefined）。
 *
 * 任务：返回第一个 stock > 0 的 name；没有则 null。
 * 示例：
 *   firstInStockName([{ name: "智能水杯", stock: 0 },
 *                     { name: "机械键盘", stock: 120 }])  -> "机械键盘"
 *   firstInStockName([{ name: "智能水杯", stock: 0 }])    -> null
 *   firstInStockName([])                                  -> null
 */
export function firstInStockName(
  products: { name: string; stock: number }[],
): string | null {
  throw new Error("TODO");
}`,
  },
  {
    name: "debugTypeName",
    testSuite: "debugTypeName",
    skeleton: `/**
 * 【场景】排查线上日志：打印一个值在【运行时】的 JS 类型名。
 *
 * 【转换点】typeof vs TS 类型。编辑器里你标了 string / number，
 * 转译之后那些字蒸发了，只剩 JS 的 typeof。
 *
 * 任务：返回 typeof value（就是那六个字符串之一）。
 * 示例：
 *   debugTypeName(42)       -> "number"
 *   debugTypeName("hi")     -> "string"
 *   debugTypeName(true)     -> "boolean"
 *   debugTypeName([1, 2])   -> "object"   // 数组也是 object
 *
 * 提示：return typeof value;
 */
export function debugTypeName(value: unknown): string {
  throw new Error("TODO");
}`,
  },
  {
    name: "outOfStockSkus",
    testSuite: "outOfStockSkus",
    skeleton: `/**
 * 【场景】补货工单：挑出缺货（stock === 0）商品的 sku，保持原顺序。
 *
 * 【转换点】对象类型 + filter + map。
 * Java 是 stream filter/map；Python 是带 if 的推导式；TS 用数组方法。
 *
 * 任务：返回缺货 sku 列表。
 * 示例（全量 10 个商品里只有智能水杯缺货）：
 *   outOfStockSkus(PRODUCTS)  -> ["CP-009"]
 *   outOfStockSkus([])        -> []
 */
export function outOfStockSkus(
  products: { sku: string; stock: number }[],
): string[] {
  throw new Error("TODO");
}`,
  },
  {
    name: "inventorySummary",
    testSuite: "inventorySummary",
    skeleton: `/**
 * 【场景】盘点报表：种数、价格区间、总货值。
 *
 * 【转换点】聚合 + 对象字面量。最后一题尽量复用前面的思路。
 *
 * 任务：返回对象，4 个键：
 *   count      商品种数
 *   minPrice   最低价
 *   maxPrice   最高价
 *   totalValue 总货值 = sum(price * stock)
 * 假设 products 非空。
 * 示例（全量 10 个商品）：
 *   inventorySummary(PRODUCTS)
 *     -> { count: 10, minPrice: 75.5, maxPrice: 2199, totalValue: 549055 }
 *
 * 提示：Math.min(...products.map(p => p.price))
 *       products.reduce((s, p) => s + p.price * p.stock, 0)
 */
export function inventorySummary(
  products: { price: number; stock: number }[],
): { count: number; minPrice: number; maxPrice: number; totalValue: number } {
  throw new Error("TODO");
}`,
  },
];

const assignment = `${preamble}

${functions.map((f) => f.skeleton).join("\n\n")}
`;

const testSource = `describe("calcLineTotal", () => {
  it("float 单价 × 数量", () => {
    expect(calcLineTotal(599.0, 2)).toBe(1198);
  });
  it("int 单价也能算（TS 只有 number）", () => {
    expect(calcLineTotal(89, 3)).toBe(267);
  });
  it("数量为 0", () => {
    expect(calcLineTotal(599.0, 0)).toBe(0);
  });
  it("带小数的单价", () => {
    expect(calcLineTotal(75.5, 2)).toBe(151);
  });
});

describe("parseSku", () => {
  it("键盘 SKU", () => {
    expect(parseSku("KB-001")).toEqual(["KB", 1]);
  });
  it("图书 SKU", () => {
    expect(parseSku("BK-005")).toEqual(["BK", 5]);
  });
  it("前导零必须去掉", () => {
    expect(parseSku("MN-003")).toEqual(["MN", 3]);
  });
  it("运行时是数组（元组会擦成 Array）", () => {
    expect(Array.isArray(parseSku("KB-001"))).toBe(true);
  });
});

describe("formatPriceTag", () => {
  it("默认人民币两位小数", () => {
    expect(formatPriceTag("机械键盘", 599.0)).toBe("机械键盘 ¥599.00");
  });
  it("自定义货币符号", () => {
    expect(formatPriceTag("无线鼠标", 159.0, "$")).toBe("无线鼠标 $159.00");
  });
  it("75.5 必须补成 75.50", () => {
    expect(formatPriceTag("设计模式", 75.5)).toBe("设计模式 ¥75.50");
  });
  it("整数价格也要 .00", () => {
    expect(formatPriceTag("Python编程:从入门到实践", 89)).toBe("Python编程:从入门到实践 ¥89.00");
  });
});

describe("renderPriceList", () => {
  it("两件商品用换行拼接", () => {
    const items = [
      { name: "无线鼠标", price: 159.0 },
      { name: "设计模式", price: 75.5 },
    ];
    expect(renderPriceList(items)).toBe("无线鼠标 ¥159.00\\n设计模式 ¥75.50");
  });
  it("单件没有多余换行", () => {
    expect(renderPriceList([{ name: "机械键盘", price: 599.0 }])).toBe("机械键盘 ¥599.00");
  });
  it("空列表返回空串", () => {
    expect(renderPriceList([])).toBe("");
  });
  it("自定义货币传给每一行", () => {
    expect(renderPriceList([{ name: "降噪耳机", price: 1299.0 }], "$")).toBe("降噪耳机 $1299.00");
  });
});

describe("firstInStockName", () => {
  it("全量数据第一个有货是机械键盘", () => {
    expect(firstInStockName(PRODUCTS)).toBe("机械键盘");
  });
  it("跳过缺货取后面（专治不看 stock）", () => {
    const items = [
      { name: "智能水杯", stock: 0 },
      { name: "机械键盘", stock: 120 },
    ];
    expect(firstInStockName(items)).toBe("机械键盘");
  });
  it("全缺货返回 null", () => {
    expect(firstInStockName([{ name: "智能水杯", stock: 0 }])).toBeNull();
  });
  it("空列表返回 null", () => {
    expect(firstInStockName([])).toBeNull();
  });
});

describe("debugTypeName", () => {
  it("number", () => {
    expect(debugTypeName(42)).toBe("number");
  });
  it("string", () => {
    expect(debugTypeName("hi")).toBe("string");
  });
  it("boolean", () => {
    expect(debugTypeName(true)).toBe("boolean");
  });
  it("数组的 typeof 是 object", () => {
    expect(debugTypeName([1, 2])).toBe("object");
  });
});

describe("outOfStockSkus", () => {
  it("全量数据只有 CP-009", () => {
    expect(outOfStockSkus(PRODUCTS)).toEqual(["CP-009"]);
  });
  it("空列表", () => {
    expect(outOfStockSkus([])).toEqual([]);
  });
  it("保持原顺序、可有多个", () => {
    const items = [
      { sku: "A-1", stock: 0 },
      { sku: "B-2", stock: 3 },
      { sku: "C-3", stock: 0 },
    ];
    expect(outOfStockSkus(items)).toEqual(["A-1", "C-3"]);
  });
});

describe("inventorySummary", () => {
  it("count", () => {
    expect(inventorySummary(PRODUCTS).count).toBe(10);
  });
  it("价格区间", () => {
    const s = inventorySummary(PRODUCTS);
    expect(s.minPrice).toBe(75.5);
    expect(s.maxPrice).toBe(2199);
  });
  it("总货值手工验算", () => {
    expect(inventorySummary(PRODUCTS).totalValue).toBe(549055);
  });
  it("完整对象", () => {
    expect(inventorySummary(PRODUCTS)).toEqual({
      count: 10,
      minPrice: 75.5,
      maxPrice: 2199,
      totalValue: 549055,
    });
  });
});
`;

const reviewMd = `# Ch01 · 记忆闪卡

> 先回忆，再翻答案。连续 2 次秒答 → 退役。

## 🔖 闪卡

| # | 正面（问题） | 背面（答案） | 掌握 |
|---|---|---|---|
| 1 | TS 标了 \`: number\`，tsc 会挡错类型吗？浏览器里点运行还会挡吗？ | tsc / 编辑器红线会挡。本页「运行测试」已经转成 JS，类型蒸发，只测运行时行为 | ⬜ |
| 2 | Python 注解和 TS 注解最关键的差别？ | Python 注解运行时不强制；TS 编译期硬约束，但发出去的 JS 里类型没了 | ⬜ |
| 3 | \`.ts\` 文件最终谁在跑？浏览器 / Node / Bun 懂 TS 吗？ | 最终跑的是 JS。浏览器只懂 JS；Bun 能直接跑 TS（内部仍会转译）；\`tsc\` 显式发出 JS | ⬜ |
| 4 | Java \`int\` 和 \`double\` 在 TS 里怎么写？ | 都是 \`number\`。TS 没有整数类型（BigInt 另说，本章不考） | ⬜ |
| 5 | 返回「前缀 + 序号」两个值，TS 类型怎么写？运行时是什么？ | 类型 \`: [string, number]\`；运行时是数组，\`Array.isArray\` 为 true | ⬜ |
| 6 | \`"001"\` 怎么变成数字 \`1\`？ | \`Number("001")\` 或 \`parseInt("001", 10)\` | ⬜ |
| 7 | 默认参数怎么替代 Java 方法重载？ | 签名里写 \`currency = "¥"\`；调用可省略，或按位置传入 | ⬜ |
| 8 | 价格保留两位小数怎么写？返回什么类型？ | \`price.toFixed(2)\`，返回 **string**（不是 number） | ⬜ |
| 9 | 把数组变成换行文本，方法名是谁、主语是谁？ | \`lines.join("\\n")\`，主语是**数组**（Python 的 join 主语是分隔符，别写反） | ⬜ |
| 10 | 本题找有货为什么必须 \`stock > 0\`，不要 \`if (stock)\`？ | JS 里 0 是 falsy，语义碰巧对，但本课要求显式比较，避免和「没填 / undefined」搅在一起 | ⬜ |
| 11 | 「没有值」本章用 \`null\` 还是 \`undefined\`？ | 用 \`null\`。\`string \\| null\`，找不到就 \`return null\` | ⬜ |
| 12 | \`typeof [1, 2]\` 是什么？\`typeof null\` 呢？ | 都是 \`"object"\`。\`typeof\` 是 JS 运行时操作符，不是 TS 的类型系统 | ⬜ |
| 13 | 过滤缺货 sku 的数组方法怎么写？ | \`products.filter(p => p.stock === 0).map(p => p.sku)\` | ⬜ |
| 14 | 本课「掌握」的标准是什么？ | 对应函数的测试全绿 | ⬜ |

## 🎓 费曼自检

- [ ] 能说清「TS 类型何时挡、何时蒸发」
- [ ] 能说清 JS / TS / 浏览器 / Node / Bun 各干什么
- [ ] 能说清为什么本题用 \`stock > 0\` 而不是 truthiness
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
    `> **预计**：1 天 ｜ **前置**：无
> **目标**：① 分清 JS / TS / 浏览器 / Node / Bun；② 写出带类型的函数并让测试全绿。
> 你 15 年 Java，Python 课也在前面。语法扫一眼就会，真正要小心的是：**类型在编译期硬约束、在运行时蒸发**。

> 📐 **本教程的契约**：下面每一节（§1.1–§1.6）都**精确对应**作业里的题。讲过的才考，考的必讲过。卡住时按作业函数名回查对应小节。

---`,
    [],
  ),
  sec(
    "sec-map",
    "🗺️ 本章地图",
    null,
    `本章作业是一条完整主线：**你在给电商后台写一组工具函数**。8 个函数，每个砸在一个转换点上。

读完这章 + 完成作业，你将能够：

- 说出 JS、TS、浏览器、Node、Bun 各自是什么，\`tsc\` 实际做了什么
- 给参数和返回值写类型注解，知道它和 Python 注解的关键差别
- 用元组类型 \`[string, number]\` 拆 SKU
- 用默认参数 + 模板字符串 + \`toFixed(2)\` 做价格标签
- 用 \`map\` + \`join\` 拼多行文本
- 用 \`string | null\` + \`stock > 0\` 找第一个有货商品
- 用 \`typeof\` 看运行时类型，并解释「TS 类型为什么日志里看不见」
- 用对象类型 + \`filter\` / 聚合做缺货清单和盘点

**作业 ↔ 教程对应表**（学哪节，就去做哪题）：

| 作业题 | 对应小节 | 核心知识点 |
|--------|----------|-----------|
| \`calcLineTotal\` | §1.1 | 类型注解 + number |
| \`parseSku\` | §1.2 | 元组 \`[string, number]\`、split |
| \`formatPriceTag\` | §1.3 | 默认参数、模板字符串、\`toFixed(2)\` |
| \`renderPriceList\` | §1.3 | \`map\` + \`join\` |
| \`firstInStockName\` | §1.4 | \`T \\| null\`、提前 return、显式 \`stock > 0\` |
| \`debugTypeName\` | §1.5 | \`typeof\` vs TS 类型（运行时只剩 JS） |
| \`outOfStockSkus\` | §1.6 | 对象类型、过滤 |
| \`inventorySummary\` | §1.6 | 聚合 + 对象字面量 |

---`,
    [],
  ),
  sec(
    "sec-path",
    "⏱️ 学习路径：费曼五步（约 60–90 分钟）",
    null,
    `| 步 | 你要做 | 在哪做 |
|----|--------|--------|
| ① 预览猜（2 分钟） | 看下面的差异，先猜 TS 怎么实现 | 本页 ① |
| ② 先动手 | 每节后面的编辑器里**先试着写** | 本节练习 |
| ③ 提取+反馈 | 点「运行测试」看红绿 | 本节练习 |
| ④ 费曼（2 分钟） | 大白话讲清「类型何时挡、何时蒸发」 | 本页 ④ |
| ⑤ 存闪卡 | 章末闪卡标复习日期 | 闪卡 |

> 💡 别从头读到尾。先扫 ① → 写作业 → **哪题卡了，回对应 § 查** → 改 → 再跑。
> 后面的题会调用你前面写过的函数（比如 \`renderPriceList\` 调用 \`formatPriceTag\`），所以建议按顺序做。

---`,
    [],
  ),
  sec(
    "sec-guess",
    "① 预览猜（2 分钟 · 激活你的 Java / Python 直觉）",
    null,
    `先别看答案，凭经验猜一猜（猜错没关系）：

1. \`function calcLineTotal(price: number, quantity: number)\` 标了类型，调用时传两个字符串：\`tsc\` 会怎样？本页点「运行测试」会怎样？
2. Java 方法要返回「前缀、序号」两个值，得造个 record。TS 怎么写返回类型？
3. Java 给方法加个「可选货币符号」要写重载。TS 怎么做到一个函数两种调法？
4. Python 课里 \`if stock:\` 可以跳过 0。本题为什么要求写成 \`stock > 0\`？
5. 编辑器里 \`const sku: string = "KB-001"\`，转成 JS 跑起来以后，\`string\` 这个字还在不在？
6. 你写的是 \`.ts\` 文件。浏览器里真正执行的是 TS 还是 JS？

> 猜完，带着验证心态进入正文。

---`,
    [],
  ),
  sec(
    "sec-world",
    "世界地图：谁编译、谁运行 🟡",
    null,
    `先把名字分清，后面所有章都建立在这张图上。

| 概念 | Java | Python | TypeScript |
|---|---|---|---|
| 你写的文件 | \`.java\` | \`.py\` | **\`.ts\`** |
| 编译 | \`javac\` → \`.class\` | 通常不编译（mypy 可选） | **\`tsc\` 擦掉类型，发出 \`.js\`** |
| 运行 | JVM | CPython | **浏览器或 Node / Bun 跑 JS** |
| 类型 | 硬约束 | 注解不强制 | **编译期硬约束，运行时蒸发** |
| 包 | Maven | uv | bun / npm + \`package.json\` |

### 四样东西，别混

- **JavaScript（JS）**：浏览器和 Node 真正执行的语言。没有类型注解。
- **TypeScript（TS）**：JS 的超集。多出来的全是**给编译器看的类型**。
- **浏览器**：只懂 JS。本课网页把你的 TS **转译**成 JS 再跑测试。
- **Node / Bun**：在电脑上跑 JS。**Bun 能直接跑 \`.ts\`**（内部仍会转），本课本地章统一用 Bun。

\`\`\`ts
// 你写的（TS）
function calcLineTotal(price: number, quantity: number): number {
  return price * quantity;
}

// tsc / 本页转译之后（JS）——类型没了
function calcLineTotal(price, quantity) {
  return price * quantity;
}
\`\`\`

> 🟡 **和 Python 课的衔接**：Python 注解是文档 + mypy；运行时鸭子类型。
> TS 更像 Java：**写的时候真挡**。但发出去的代码又像「被擦掉类型的 JS」，这一点 Java 没有（bytecode 还留着类型信息给 JVM）。

### 本课怎么算「会了」

编辑器红线 ≈ \`tsc\`（编译期）。点「运行测试」≈ 跑 JS（运行时）。**测试全绿 = 这题掌握。**

---`,
    [],
  ),
  sec(
    "sec-1.1",
    "§1.1 类型注解 + number（对应：`calcLineTotal`）🔴",
    "1.1",
    `### Java 对照：类型错了，编译就挂

\`\`\`java
double calcLineTotal(double price, int quantity) {
    return price * quantity;
}
calcLineTotal(599.0, 2);      // ✅ 1198.0
calcLineTotal("599", "2");    // ❌ 编译失败
\`\`\`

### Python（你刚学过）：注解不强制

\`\`\`python
def calc_line_total(price: float, quantity: int) -> float:
    return price * quantity

calc_line_total("599", "2")   # 运行到 * 才 TypeError；mypy 才会提前骂
\`\`\`

### TypeScript：编译期硬约束，运行时蒸发

\`\`\`ts
function calcLineTotal(price: number, quantity: number): number {
  return price * quantity;
}

calcLineTotal(599.0, 2);      // ✅
calcLineTotal(89, 3);         // ✅  只有 number，没有 int/double 之分
calcLineTotal("599", "2");    // ❌ tsc / 编辑器红线：string 不能当 number
\`\`\`

> 🤯 **转换点**：TS 的 \`: number\` **不是** Python 那种建议，也 **不是** 运行时的 \`instanceof\`。
> 它只存在于编译期。本页点运行时，字符串乘法在 JS 里可能被强制转换（\`"599" * 2 === 1198\`），所以**不能靠运行测试来证明类型对了**——要看编辑器红线。

### 没有 \`int\`，只有 \`number\`

Java 把 \`int\` / \`long\` / \`double\` 分开。TS 跟 JS 一样，数字全是 IEEE 754 的 \`number\`（\`89\` 和 \`89.0\` 是同一个东西）。

\`\`\`ts
// ❌ 没有这个类型
function f(qty: int) {}

// ✅
function f(qty: number) {}
\`\`\`

### 真实场景

JSON 里单价经常是 \`599\` 或 \`599.0\`，在 TS 里都是 \`number\`，直接乘：

\`\`\`ts
calcLineTotal(599.0, 2);   // 1198
calcLineTotal(89, 3);      // 267
calcLineTotal(599.0, 0);   // 0
\`\`\`

> ✅ **做 \`calcLineTotal\`**：\`return price * quantity;\` 注解照抄。

---`,
    ["calcLineTotal"],
  ),
  sec(
    "sec-1.2",
    "§1.2 元组 `[string, number]`（对应：`parseSku`）🟡",
    "1.2",
    `### Java 对照：返回两个值要先造类型

\`\`\`java
record SkuParts(String prefix, int seq) {}
SkuParts parseSku(String sku) { ... }
\`\`\`

### TypeScript：元组类型

\`\`\`ts
function parseSku(sku: string): [string, number] {
  const [prefix, num] = sku.split("-");
  return [prefix, Number(num)];
}

parseSku("KB-001");   // ["KB", 1]
parseSku("MN-003");   // ["MN", 3]  —— Number("003") === 3
\`\`\`

元组 **看起来像** Python 的 \`tuple[str, int]\`，但运行时就是 **数组**。\`Array.isArray(parseSku("KB-001")) === true\`。类型 \`: [string, number]\` 只在编译期约束「先 string 后 number、长度 2」。

### 解构：一行接住

\`\`\`ts
const [prefix, num] = "KB-001".split("-");
// prefix === "KB"（string）
// num    === "001"（还是 string！）必须 Number(num)
\`\`\`

> 🟡 \`split\` 的返回类型是 \`string[]\`，不是元组。所以你要自己 \`Number(...)\`，并在返回值上标 \`: [string, number]\`。

### ❌ / ✅

\`\`\`ts
// ❌ 忘了转数字，序号带着前导零
return [prefix, num];           // num 是 "001"

// ❌ parseInt 不写进制（习惯上要写 10）
return [prefix, parseInt(num)];

// ✅
return [prefix, Number(num)];
// 或
return [prefix, parseInt(num, 10)];
\`\`\`

> ✅ **做 \`parseSku\`**：split → 解构 → \`Number\` → 返回元组。测试会查 \`"MN-003"\` 的序号必须是 \`3\`。

---`,
    ["parseSku"],
  ),
  sec(
    "sec-1.3",
    "§1.3 默认参数 + 模板字符串 + map/join（对应：`formatPriceTag`、`renderPriceList`）🟡",
    "1.3",
    `### 默认参数：不必写重载

\`\`\`java
String formatPriceTag(String name, double price) { return formatPriceTag(name, price, "¥"); }
String formatPriceTag(String name, double price, String currency) { ... }
\`\`\`

\`\`\`ts
function formatPriceTag(name: string, price: number, currency = "¥"): string {
  return \`\${name} \${currency}\${price.toFixed(2)}\`;
}

formatPriceTag("机械键盘", 599.0);        // "机械键盘 ¥599.00"
formatPriceTag("无线鼠标", 159.0, "$");   // "无线鼠标 $159.00"
formatPriceTag("设计模式", 75.5);         // "设计模式 ¥75.50"  ← 必须两位
\`\`\`

**\`toFixed(2)\` 返回 string**，不是 number。\`75.5.toFixed(2) === "75.50"\`。对账文案要的就是字符串。

### 模板字符串

反引号 \`\\\`...\\\`\`，\`\${表达式}\` 嵌值。对标 Java \`String.format\`、Python f-string。

### \`map\` + \`join\`：主语是数组

Python 课里 \`join\` 的主语是**分隔符**：\`"\\n".join(lines)\`。
TS / JS 反过来：主语是**数组**。

\`\`\`ts
const lines = products.map((p) => formatPriceTag(p.name, p.price, currency));
return lines.join("\\n");
\`\`\`

空数组 \`join\` 得到 \`""\`。单元素不会多一个换行。

\`\`\`ts
function renderPriceList(
  products: { name: string; price: number }[],
  currency = "¥",
): string {
  return products
    .map((p) => formatPriceTag(p.name, p.price, currency))
    .join("\\n");
}
\`\`\`

> ⚠️ 请先把上面的 \`formatPriceTag\` 写对再做这题——运行器会拼上你已经写过的函数。
>
> ✅ **做 \`formatPriceTag\` / \`renderPriceList\`**：见上。后者复用前者。

---`,
    ["formatPriceTag", "renderPriceList"],
  ),
  sec(
    "sec-1.4",
    "§1.4 `T | null` 与显式比较（对应：`firstInStockName`）🟡",
    "1.4",
    `### 联合：要么有名字，要么没有

\`\`\`ts
function firstInStockName(
  products: { name: string; stock: number }[],
): string | null {
  for (const p of products) {
    if (p.stock > 0) return p.name;   // 提前 return
  }
  return null;
}
\`\`\`

\`string | null\` 读作「string 或 null」。Java 的 \`String\` 本来就能 null；TS 开了 \`strictNullChecks\` 之后，你必须**写在类型里**，调用方才会被提醒要处理空。

找不到时返回 **\`null\`**，不要 \`undefined\`（本章统一：有意的空值用 null）。

### 为什么不要 \`if (p.stock)\` 🔴

Python 课利用了 truthiness：\`if p["stock"]:\` 把 0 当缺货。
JS 里 0 同样 falsy，**碰巧能跑**。但本课要求：

\`\`\`ts
// ❌ 靠 JS 把 0 当假——和「没填 / undefined」搅在一起，后面 Agent 工具参数会踩坑
if (p.stock) return p.name;

// ✅ 题意就是库存大于 0
if (p.stock > 0) return p.name;
\`\`\`

测试有一条「第一个 stock 为 0、第二个有货」，专治「不看 stock 直接取 \`products[0]\`」。

> ✅ **做 \`firstInStockName\`**：循环 + \`stock > 0\` + 提前 return，兜底 \`null\`。

---`,
    ["firstInStockName"],
  ),
  sec(
    "sec-1.5",
    "§1.5 `typeof` vs TS 类型（对应：`debugTypeName`）🔴",
    "1.5",
    `这是整章最重要的「为什么」。

### 编译之后，类型字不见了

\`\`\`ts
function label(sku: string): string {
  return sku.toUpperCase();
}
\`\`\`

\`tsc\` 发出的 JS 里没有 \`string\` 这个词。运行时只剩 JS 值。所以：

- **TS 类型**：给编译器 / 编辑器看（\`string\`、\`number\`、\`string | null\`）
- **\`typeof\`**：JS 运行时操作符，只返回一小撮字符串

\`\`\`ts
typeof 42        // "number"
typeof "hi"      // "string"
typeof true      // "boolean"
typeof undefined // "undefined"
typeof function () {}  // "function"
typeof [1, 2]    // "object"   ← 数组不是 "array"
typeof null      // "object"   ← 历史包袱，知道即可
\`\`\`

\`typeof\` **不可能**返回 \`"string | null"\` 或 \`"Product"\`。那些是 TS 的，运行时不存在。

### 和 Python \`type(x).__name__\` 不同

Python 的 \`type([1,2]).__name__\` 是 \`"list"\`。JS 的 \`typeof [1,2]\` 是 \`"object"\`。要判断数组用 \`Array.isArray\`（\`parseSku\` 的测试里你已经见过）。

### 本题

\`\`\`ts
function debugTypeName(value: unknown): string {
  return typeof value;
}

debugTypeName(42);      // "number"
debugTypeName("hi");    // "string"
debugTypeName([1, 2]);  // "object"
\`\`\`

参数写成 \`unknown\`：调用方什么都能传，函数里不能当 number 用，除非再收窄（Ch03）。本章只调用 \`typeof\`，正好安全。

> ✅ **做 \`debugTypeName\`**：一行 \`return typeof value;\`

---`,
    ["debugTypeName"],
  ),
  sec(
    "sec-1.6",
    "§1.6 对象类型、过滤、聚合（对应：`outOfStockSkus`、`inventorySummary`）🟡",
    "1.6",
    `### 对象类型：先当「字段清单」

\`\`\`ts
function outOfStockSkus(
  products: { sku: string; stock: number }[],
): string[] {
  return products.filter((p) => p.stock === 0).map((p) => p.sku);
}
\`\`\`

\`{ sku: string; stock: number }\` 的意思是：给我一个带这两个字段的对象。多出来的 \`name\` / \`price\` 不影响（为什么能这样，**Ch02 结构类型**再讲，本章不考）。

取值用 **点号**：\`p.sku\`、\`p.stock\`。这和 Python 的 \`p["sku"]\`、Java 的 \`p.getSku()\` 都不同。

### 过滤：\`filter\` + \`map\`

\`\`\`java
products.stream().filter(p -> p.getStock() == 0).map(Product::getSku).toList();
\`\`\`

\`\`\`python
[p["sku"] for p in products if p["stock"] == 0]
\`\`\`

\`\`\`ts
products.filter((p) => p.stock === 0).map((p) => p.sku)
\`\`\`

比较用 **\`===\`**（严格相等）。别写 \`==\`。

全量 mock 里只有 \`CP-009\`（智能水杯）库存为 0。

### 聚合 + 对象字面量

\`\`\`ts
function inventorySummary(
  products: { price: number; stock: number }[],
): { count: number; minPrice: number; maxPrice: number; totalValue: number } {
  return {
    count: products.length,
    minPrice: Math.min(...products.map((p) => p.price)),
    maxPrice: Math.max(...products.map((p) => p.price)),
    totalValue: products.reduce((sum, p) => sum + p.price * p.stock, 0),
  };
}
\`\`\`

\`Math.min(...数组)\` 需要展开。空数组会得到 \`-Infinity\`，所以本题假设列表非空。

总货值手工验算过：**549055**（\`75.5 * 200\` 那件「设计模式」别丢了）。

> ✅ **做 \`outOfStockSkus\`**：filter + map。
> ✅ **做 \`inventorySummary\`**：一个对象字面量，四个键。

---`,
    ["outOfStockSkus", "inventorySummary"],
  ),
  sec(
    "sec-tooling",
    "§1.7 工具链怎么摸一下（不考命令细节）",
    "1.7",
    `本章作业在网页里就能绿。但你得知道本地以后怎么跑（M4 / M5 会用到）：

\`\`\`bash
bun ch01.ts          # Bun 直接跑 TypeScript
npx tsc --noEmit     # 只做类型检查，不发文件
\`\`\`

| 用途 | Java | Python | 本课 TS |
|------|------|--------|---------|
| 跑起来 | \`java …\` | \`uv run python\` | **Bun** |
| 类型检查 | 编译器自带 | mypy | **tsc / 编辑器** |
| 测试 | JUnit | pytest | 本页小测试器；本地 \`bun test\` |
| 包 | Maven | uv | bun + \`package.json\` |

> 本课统一 **Bun**，不纠结 npm / pnpm。虚拟环境那套 Python 故事这里没有——\`node_modules\` 按项目隔离，Ch09 再讲。

---`,
    [],
  ),
  sec(
    "sec-pits",
    "§1.8 Java / Python 老手几个坑 ⚠️",
    "1.8",
    `1. **没有 \`int\`**，不要从 Java 抄过来。
2. **\`===\` 不是 \`==\`**。本题比较库存用 \`===\`。
3. **\`toFixed\` 得到 string**，再拿去当 number 加会拼串。
4. **\`join\` 主语是数组**，不是分隔符。
5. **找不到用 \`null\`**，别 \`return;\` 变成 \`undefined\`。
6. **\`typeof [] === "object"\`**，不要以为能看到 \`"array"\` 或 TS 的 \`number[]\`。
7. **本页测试不替代 tsc**：类型错了也可能「算对」。看红线。

---`,
    [],
  ),
  sec(
    "sec-homework",
    "📝 本章作业",
    null,
    `上面 8 个函数按节交错出现。每个注释里有【场景】【转换点】、示例和提示。

**完成方式**：在编辑器里改 \`throw new Error("TODO")\`，点「▶ 运行测试」。全绿 = 这题过了。

卡住就回对应 §：\`parseSku\` → §1.2，\`debugTypeName\` → §1.5，\`inventorySummary\` → §1.6。

---`,
    [],
  ),
  sec(
    "sec-check",
    "✅ 自测：你真的掌握了吗？",
    null,
    `- [ ] 能画清 JS / TS / 浏览器 / Bun 的分工（世界地图）
- [ ] 能说清「TS 注解何时挡、运行时为什么不管」
- [ ] 知道 \`number\` 没有 int/double 之分
- [ ] 能写 \`: [string, number]\` 并 \`Number\` 掉前导零
- [ ] 能用 \`toFixed(2)\` 和 \`join("\\n")\`
- [ ] 坚持 \`stock > 0\` 和 \`return null\`
- [ ] 8 个作业全绿

---`,
    [],
  ),
  sec(
    "sec-feynman",
    "🎓 费曼挑战",
    null,
    `用大白话讲给「Java 同事」听。讲不清 = 还没真懂。

任选一题（1–2 分钟）：

1. 「Python 的类型注解不强制，TS 的为什么说会挡？那我在网页里点运行，为什么字符串乘法有时还能算出数？」— 卡壳重读世界地图 + §1.1 + §1.5
2. 「\`typeof [1,2]\` 为什么不是 \`array\`？这和我在编辑器里看到的 \`number[]\` 是一回事吗？」— 卡壳重读 §1.5
3. 「找有货为什么不许写 \`if (p.stock)\`？」— 卡壳重读 §1.4

---`,
    [],
  ),
  sec(
    "sec-next",
    "⏭️ 下一步",
    null,
    `Ch01 掌握后，进 **Ch02 · 结构类型 vs 名义类型**——本课最重要的一章。Java 的 \`class Dog\` 不能赋给无关的 \`class Cat\`；TS 只看形状。本章你已经在用对象类型，Ch02 会解释「为什么多一个字段有时行、有时编辑器又骂」。`,
    [],
  ),
];

const tutorialMd = `# Ch01 · 世界地图 & 工具链 & 第一个带类型的函数

${sections
  .map((s) => (s.heading ? `## ${s.heading}\n\n${s.body}` : s.body))
  .join("\n\n")}
`;

const chapter = {
  id: "ch01",
  num: "01",
  title: "世界地图 & 工具链 & 第一个带类型的函数",
  runMode: "browser",
  tutorialMd,
  assignment,
  testName: "ch01_assignment",
  testSource,
  reviewMd,
  interleaved: true,
  sections,
  functions,
  preamble,
};

const out = join(dirname(fileURLToPath(import.meta.url)), "../src/content/chapters/ch01.json");
mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, JSON.stringify(chapter, null, 2) + "\n");
console.log("wrote", out);
