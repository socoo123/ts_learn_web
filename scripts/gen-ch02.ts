/**
 * 生成 src/content/chapters/ch02.json
 * 运行：bun scripts/gen-ch02.ts
 *
 * 注意：2026-08-25 已在 JSON 里加了「原理 + mermaid」样板。
 * 不要直接重跑本脚本覆盖，除非把同样的图和机制段一并写回来。
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const preamble = `/**
 * Ch02 作业：商品 Product 与订单行 OrderLine 的结构兼容。
 *
 * 场景：电商后台要把「商品」当成「能贴标签 / 能下单 / 能取 SKU」的形状来用。
 * TS 只看结构，不看类名——这是本课最重要的一章。
 *
 * 约定：完整商品形如
 *   { id: 1, name: "机械键盘", category: "电脑外设",
 *     price: 599, stock: 120, sku: "KB-001" }
 * 订单行形如
 *   { sku: "KB-001", name: "机械键盘", price: 599, quantity: 1 }
 * 函数参数往往只要求「子集形状」；多出来的字段编译期可能行、也可能被多余属性检查拦住。
 *
 * 全绿 = 你掌握了 Ch02。
 */`;

const functions = [
  {
    name: "labelProduct",
    testSuite: "labelProduct",
    skeleton: `/**
 * 【场景】货架价签：只要拿得到名称和单价，就能打印标签。
 * 完整商品还带 sku / stock / category，函数并不需要它们。
 *
 * 【转换点】结构类型。Java 要先实现同一个接口 / 继承同一个类；
 * TS 只要求入参「长得像」{ name: string; price: number }。
 *
 * 任务：返回 "名称 ¥价格（两位小数）"。
 * 示例：
 *   labelProduct({ name: "机械键盘", price: 599 })  -> "机械键盘 ¥599.00"
 *   labelProduct({ name: "设计模式", price: 75.5 })  -> "设计模式 ¥75.50"
 *   labelProduct(带 sku/stock 的完整商品)           -> 仍然只读 name 和 price
 *
 * 提示：\`\${item.name} ¥\${item.price.toFixed(2)}\`
 * 完整商品当变量传入是允许的（结构兼容）；别去读用不到的字段。
 */
export function labelProduct(item: { name: string; price: number }): string {
  throw new Error("TODO");
}`,
  },
  {
    name: "asOrderLine",
    testSuite: "asOrderLine",
    skeleton: `/**
 * 【场景】加购：把商品（或半成品）收成订单行。订单行只要
 * sku / name / price / quantity，不要把 stock、category 拷进去。
 *
 * 【转换点】结构兼容 + 多余字段。可选 quantity? 没传则默认 1；
 * 传了 0 就是 0（「没买」和「没填」不是一回事）。
 * 新鲜对象字面量多写字段，编辑器会做多余属性检查（见教程 §2.2）。
 *
 * 任务：返回 { sku, name, price, quantity }，缺 quantity 时用 1。
 * 示例：
 *   asOrderLine({ sku: "KB-001", name: "机械键盘", price: 599 })
 *     -> { sku: "KB-001", name: "机械键盘", price: 599, quantity: 1 }
 *   asOrderLine({ sku: "MS-002", name: "无线鼠标", price: 159, quantity: 3 })
 *     -> { sku: "MS-002", name: "无线鼠标", price: 159, quantity: 3 }
 *   asOrderLine({ sku: "CP-009", name: "智能水杯", price: 199, quantity: 0 })
 *     -> quantity 必须是 0，不是 1
 *
 * 提示：新建对象，逐个抄四个字段。不要 ...p 展开，否则 stock 会漏进去。
 *       quantity 用 p.quantity === undefined ? 1 : p.quantity
 */
export function asOrderLine(p: {
  sku: string;
  name: string;
  price: number;
  quantity?: number;
}): { sku: string; name: string; price: number; quantity: number } {
  throw new Error("TODO");
}`,
  },
  {
    name: "pickSku",
    testSuite: "pickSku",
    skeleton: `/**
 * 【场景】扫码枪 / 补货单：很多对象都带 sku——商品、订单行、甚至
 * 只有 { sku: "KB-001" } 的最小结构。函数只认这一块。
 *
 * 【转换点】interface 描述最小形状。名字叫 HasSku 还是 Product 不重要，
 * 有 string 类型的 sku 字段就能传进来。
 *
 * 任务：返回 item.sku。
 * 示例：
 *   pickSku({ sku: "KB-001" })                         -> "KB-001"
 *   pickSku(完整商品 PRODUCTS[0])                      -> "KB-001"
 *   pickSku({ sku: "BK-005", name: "设计模式", price: 75.5, quantity: 2 })
 *                                                      -> "BK-005"
 *
 * 提示：一行 return item.sku。
 * 等价写法：interface HasSku { sku: string } ；参数写成 HasSku。
 */
export function pickSku(item: { sku: string }): string {
  throw new Error("TODO");
}`,
  },
  {
    name: "mergeNamed",
    testSuite: "mergeNamed",
    skeleton: `/**
 * 【场景】运营拼一张「名字 + SKU」卡片：左边表只有 name，右边表只有 sku，
 * 合成一个新形状。
 *
 * 【转换点】两个 interface 合并。Named & HasSku，或 interface 多重 extends。
 * 只要把 a.name 和 b.sku 收进新对象；两边多出来的字段不要带上。
 *
 * 任务：返回 { name: a.name, sku: b.sku }。
 * 示例：
 *   mergeNamed({ name: "机械键盘" }, { sku: "KB-001" })
 *     -> { name: "机械键盘", sku: "KB-001" }
 *   mergeNamed({ name: "无线鼠标" }, { sku: "MS-002" })
 *     -> { name: "无线鼠标", sku: "MS-002" }
 *   mergeNamed({ name: "设计模式", price: 75.5 }, { sku: "BK-005", stock: 200 })
 *     -> { name: "设计模式", sku: "BK-005" }   // 没有 price / stock
 *
 * 提示：return { name: a.name, sku: b.sku };
 */
export function mergeNamed(
  a: { name: string },
  b: { sku: string },
): { name: string; sku: string } {
  throw new Error("TODO");
}`,
  },
  {
    name: "freezeName",
    testSuite: "freezeName",
    skeleton: `/**
 * 【场景】价签上的商品名印出去就不能改，单价还允许后续调价。
 *
 * 【转换点】readonly。给 name 标上 readonly 后，函数里 p.name = "别的"
 * 会被 tsc / 编辑器拦住。这是编译期约束：发出去的 JS 里 readonly 蒸发了，
 * 除非你再 Object.freeze（本题不必 freeze）。
 *
 * 任务：返回 p.name。不要去改它。
 * 示例：
 *   freezeName({ name: "机械键盘", price: 599 })  -> "机械键盘"
 *   freezeName({ name: "设计模式", price: 75.5 })  -> "设计模式"
 *   freezeName({ name: "赠品", price: 0 })        -> "赠品"
 *
 * 提示：return p.name;
 */
export function freezeName(p: { readonly name: string; price: number }): string {
  throw new Error("TODO");
}`,
  },
  {
    name: "acceptDuck",
    testSuite: "acceptDuck",
    skeleton: `/**
 * 【场景】打印价签的函数并不在乎你是 Product、OrderLine，还是临时拼的对象。
 * 只要会「报出 name 和 price」，就能当鸭子用。
 *
 * 【转换点】函数参数的结构类型（鸭子类型）。Java 必须 implements 同一个接口；
 * TS 看调用处的实参形状。Python Protocol 接近，但运行时不查。
 *
 * 任务：格式与 labelProduct 相同："名称 ¥价格（两位小数）"。
 * 可以直接复用 labelProduct(quacker)。
 * 示例：
 *   acceptDuck({ name: "机械键盘", price: 599 })     -> "机械键盘 ¥599.00"
 *   acceptDuck({ name: "设计模式", price: 75.5 })     -> "设计模式 ¥75.50"
 *   acceptDuck({ name: "匿名配件", price: 12.5 })     -> "匿名配件 ¥12.50"
 *
 * 提示：return labelProduct(quacker);  或自己拼同样的模板字符串。
 */
export function acceptDuck(quacker: { name: string; price: number }): string {
  throw new Error("TODO");
}`,
  },
  {
    name: "assertProductShape",
    testSuite: "assertProductShape",
    skeleton: `/**
 * 【场景】接口刚进来一份 unknown JSON。TS 类型在运行时蒸发了，
 * 不能靠 interface Product 挡住脏数据。先用 boolean 问一句：
 * 「它现在长得像能交给 labelProduct 的东西吗？」
 *
 * 【转换点】类型谓词雏形。本题返回 boolean，不是 \`v is Product\`
 * （真正的类型谓词 / 判别联合在 Ch03）。复用前面的「name+price 形状」。
 *
 * 任务：v 是非 null 对象（不是数组），且 name 为 string、price 为 number
 * 时返回 true，否则 false。多余字段可以有。
 * 示例：
 *   assertProductShape({ name: "机械键盘", price: 599 })          -> true
 *   assertProductShape({ name: "x", price: 1, sku: "A" })        -> true
 *   assertProductShape({ name: "", price: 0 })                   -> true
 *   assertProductShape(null)                                     -> false
 *   assertProductShape([{ name: "机械键盘", price: 599 }])       -> false
 *   assertProductShape({ name: "x" })                            -> false
 *   assertProductShape({ name: "x", price: "599" })              -> false
 *
 * 提示：先挡 null / 非 object / Array.isArray；再查 typeof name / price。
 *       记得 Ch01：typeof null === "object"。
 */
export function assertProductShape(v: unknown): boolean {
  throw new Error("TODO");
}`,
  },
];

const assignment = `${preamble}

${functions.map((f) => f.skeleton).join("\n\n")}
`;

const testSource = `describe("labelProduct", () => {
  it("全量第一个商品", () => {
    expect(labelProduct(PRODUCTS[0])).toBe("机械键盘 ¥599.00");
  });
  it("小数价格必须两位（防硬编码键盘）", () => {
    expect(labelProduct(PRODUCTS[4])).toBe("设计模式 ¥75.50");
  });
  it("变量带多余字段仍然只读 name/price", () => {
    const item = { name: "测试品", price: 10, stock: 99, sku: "XX-1" };
    expect(labelProduct(item)).toBe("测试品 ¥10.00");
  });
  it("价格为 0", () => {
    expect(labelProduct({ name: "赠品", price: 0 })).toBe("赠品 ¥0.00");
  });
});

describe("asOrderLine", () => {
  it("缺省 quantity 为 1", () => {
    expect(asOrderLine({ sku: "KB-001", name: "机械键盘", price: 599 })).toEqual({
      sku: "KB-001",
      name: "机械键盘",
      price: 599,
      quantity: 1,
    });
  });
  it("指定 quantity", () => {
    expect(asOrderLine({ sku: "MS-002", name: "无线鼠标", price: 159, quantity: 3 })).toEqual({
      sku: "MS-002",
      name: "无线鼠标",
      price: 159,
      quantity: 3,
    });
  });
  it("quantity 为 0 不能当成没传", () => {
    expect(asOrderLine({ sku: "CP-009", name: "智能水杯", price: 199, quantity: 0 })).toEqual({
      sku: "CP-009",
      name: "智能水杯",
      price: 199,
      quantity: 0,
    });
  });
  it("丢掉多余字段 stock / category（专治 ...展开）", () => {
    const p = {
      sku: "KB-001",
      name: "机械键盘",
      price: 599,
      stock: 120,
      category: "电脑外设",
    };
    expect(asOrderLine(p)).toEqual({
      sku: "KB-001",
      name: "机械键盘",
      price: 599,
      quantity: 1,
    });
  });
});

describe("pickSku", () => {
  it("完整商品", () => {
    expect(pickSku(PRODUCTS[0])).toBe("KB-001");
  });
  it("最小形状只有 sku", () => {
    expect(pickSku({ sku: "HP-006" })).toBe("HP-006");
  });
  it("订单行形状也能取（防只认 Product）", () => {
    const line = { sku: "BK-005", name: "设计模式", price: 75.5, quantity: 2 };
    expect(pickSku(line)).toBe("BK-005");
  });
  it("空字符串 sku 也是合法值", () => {
    expect(pickSku({ sku: "" })).toBe("");
  });
});

describe("mergeNamed", () => {
  it("商品名 + sku", () => {
    expect(mergeNamed({ name: "机械键盘" }, { sku: "KB-001" })).toEqual({
      name: "机械键盘",
      sku: "KB-001",
    });
  });
  it("另一件，防硬编码", () => {
    expect(mergeNamed({ name: "无线鼠标" }, { sku: "MS-002" })).toEqual({
      name: "无线鼠标",
      sku: "MS-002",
    });
  });
  it("只取 name 和 sku，丢掉两边多余字段", () => {
    const a = { name: "设计模式", price: 75.5 };
    const b = { sku: "BK-005", stock: 200 };
    expect(mergeNamed(a, b)).toEqual({ name: "设计模式", sku: "BK-005" });
  });
  it("空字符串也是合法值", () => {
    expect(mergeNamed({ name: "" }, { sku: "X" })).toEqual({ name: "", sku: "X" });
  });
});

describe("freezeName", () => {
  it("全量第一个商品名", () => {
    expect(freezeName(PRODUCTS[0])).toBe("机械键盘");
  });
  it("另一件，防硬编码", () => {
    expect(freezeName(PRODUCTS[4])).toBe("设计模式");
  });
  it("最小形状", () => {
    expect(freezeName({ name: "赠品", price: 0 })).toBe("赠品");
  });
  it("空名字", () => {
    expect(freezeName({ name: "", price: 1 })).toBe("");
  });
});

describe("acceptDuck", () => {
  it("完整商品当鸭子", () => {
    expect(acceptDuck(PRODUCTS[0])).toBe("机械键盘 ¥599.00");
  });
  it("另一件，防硬编码", () => {
    expect(acceptDuck(PRODUCTS[4])).toBe("设计模式 ¥75.50");
  });
  it("匿名对象只要 name+price", () => {
    expect(acceptDuck({ name: "匿名配件", price: 12.5 })).toBe("匿名配件 ¥12.50");
  });
  it("订单行形状也能叫（鸭子）", () => {
    const line = { sku: "MS-002", name: "无线鼠标", price: 159, quantity: 2 };
    expect(acceptDuck(line)).toBe("无线鼠标 ¥159.00");
  });
});

describe("assertProductShape", () => {
  it("完整商品为 true", () => {
    expect(assertProductShape(PRODUCTS[0])).toBe(true);
  });
  it("最小 name+price", () => {
    expect(assertProductShape({ name: "x", price: 1 })).toBe(true);
  });
  it("多余字段仍为 true", () => {
    const v = { name: "x", price: 1, sku: "A" };
    expect(assertProductShape(v)).toBe(true);
  });
  it("空名字和 0 元也是合法形状", () => {
    expect(assertProductShape({ name: "", price: 0 })).toBe(true);
  });
  it("null 不是对象", () => {
    expect(assertProductShape(null)).toBe(false);
  });
  it("数组即使元素长得像也不算", () => {
    expect(assertProductShape([{ name: "机械键盘", price: 599 }])).toBe(false);
  });
  it("缺 price", () => {
    expect(assertProductShape({ name: "x" })).toBe(false);
  });
  it("price 类型不对", () => {
    expect(assertProductShape({ name: "x", price: "599" })).toBe(false);
  });
  it("name 类型不对", () => {
    expect(assertProductShape({ name: 1, price: 1 })).toBe(false);
  });
  it("undefined / 数字", () => {
    expect(assertProductShape(undefined)).toBe(false);
    expect(assertProductShape(42)).toBe(false);
  });
});
`;

const reviewMd = `# Ch02 · 记忆闪卡

> 先回忆，再翻答案。连续 2 次秒答 → 退役。

## 🔖 闪卡

| # | 正面（问题） | 背面（答案） | 掌握 |
|---|---|---|---|
| 1 | Java 里 \`class Dog\` 和无关的 \`class Cat\` 字段一样，能互赋吗？TS 呢？ | Java 不行（名义类型，看的是类名）。TS 行（结构类型，只看形状） | ⬜ |
| 2 | 函数只要 \`{ name, price }\`，完整商品（还带 sku/stock）当**变量**传入行不行？ | 行。多出来的字段只要不缺必填形状，结构兼容 | ⬜ |
| 3 | \`labelProduct({ name: "键盘", price: 599, sku: "KB-001" })\` 直接写字面量，编辑器为什么红？ | **新鲜对象**会做多余属性检查，字面量里多写的 \`sku\` 被当成很可能写错。先赋给变量再传入就不再查多余字段 | ⬜ |
| 4 | Python Protocol 和 TS 结构类型，运行时谁会检查形状？ | 都不查。Protocol 是静态；TS 类型编译后蒸发。运行时要自己写 boolean / zod | ⬜ |
| 5 | 描述对象形状时，\`interface A { x: number }\` 和 \`type A = { x: number }\` 差在哪？ | 对象形状几乎等价。interface 可声明合并、可被 class implements；联合 / 元组只能用 type | ⬜ |
| 6 | 把 \`Named\` 和 \`HasSku\` 合成一个形状，interface 和 type 各怎么写？ | \`interface C extends Named, HasSku {}\`；\`type C = Named & HasSku\` | ⬜ |
| 7 | \`quantity?: number\` 没传是什么？传 \`0\` 呢？能用逻辑或当默认值吗？ | 没传是 \`undefined\`，应默认 1。\`0\` 是合法数量。逻辑或会把 0 当成没传，要用 \`=== undefined\` 判断 | ⬜ |
| 8 | 参数标了 \`readonly name\`，函数里改 \`p.name\` 会怎样？运行时改得了吗？ | 编译期 / 编辑器红线会挡。发出去的 JS 里 readonly 蒸发，普通对象运行时仍能改（除非再 \`Object.freeze\`） | ⬜ |
| 9 | 为什么 \`acceptDuck\` 能吃 Product、也能吃临时 \`{ name, price }\`？ | 函数参数也是结构类型：实参「鸭子」只要有需要的字段。不要求 implements 某个名义接口 | ⬜ |
| 10 | \`assertProductShape\` 为什么必须单独挡 \`null\` 和数组？ | \`typeof null === "object"\`；数组也是 object。\`interface\` 在运行时不存在，这题只返回 boolean（真正 \`is Product\` 在 Ch03） | ⬜ |
| 11 | 索引签名 \`{ [key: string]: number }\` 本章要会写吗？ | 点到为止，不考。知道「任意 string 键」有这种写法即可 | ⬜ |
| 12 | 转订单行时 \`return { ...p, quantity: 1 }\` 错在哪？ | 展开会把 \`stock\` / \`category\` 一并拷进订单行。应新建对象，只抄 sku/name/price/quantity | ⬜ |

## 🎓 费曼自检

- [ ] 能说清「名义类型看名字、结构类型看形状」
- [ ] 能说清「新鲜字面量多余属性检查」和「变量多字段可以传入」为什么不一样
- [ ] 能说清 readonly / interface 在运行时蒸发，脏数据要自己查形状
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
    `> **预计**：1 天 ｜ **前置**：Ch01 ｜ **🔴 本课最重要的一章**
> **目标**：① 理解「形状一样就能赋值」；② 知道新鲜对象的多余属性检查；③ 分清 \`type\` 与 \`interface\`、可选 \`?\`、只读 \`readonly\`。
> 你 15 年 Java：\`class Dog\` 不能赋给无关的 \`class Cat\`。TS **只看结构，不看名字**。Python Protocol 接近，但运行时不查。

> 📐 **本教程的契约**：下面每一节（§2.1–§2.7）都**精确对应**作业里的题。讲过的才考，考的必讲过。卡住时按作业函数名回查对应小节。

---`,
    [],
  ),
  sec(
    "sec-map",
    "🗺️ 本章地图",
    null,
    `本章作业是一条完整主线：**商品 \`Product\` 和订单行 \`OrderLine\` 互相当形状用**。7 个函数，每个砸在一个「名字 vs 形状」的转换点上。

读完这章 + 完成作业，你将能够：

- 说出 Java 名义类型和 TS 结构类型的差别，对照 Python Protocol
- 用「只要有 \`name\`+\`price\`」的形状给商品贴价签（多字段的变量能传入）
- 解释为什么**新鲜对象字面量**多写字段会被多余属性检查拦住
- 用 \`interface\` 描述最小形状（只取 \`sku\`）
- 合并两个 interface 形状（\`extends\` / \`&\`）
- 用 \`readonly\` 在编译期锁住字段，并知道运行时它蒸发了
- 用函数参数的结构类型（鸭子）接受 Product / OrderLine / 匿名对象
- 对 \`unknown\` 做 boolean 形状检查（类型谓词雏形；真正的 \`is\` 在 Ch03）

**作业 ↔ 教程对应表**（学哪节，就去做哪题）：

| 作业题 | 对应小节 | 核心知识点 |
|--------|----------|-----------|
| \`labelProduct\` | §2.1 | 只要求有 \`name\`+\`price\` 的结构即可 |
| \`asOrderLine\` | §2.2 | 结构兼容、多余字段 |
| \`pickSku\` | §2.3 | interface 最小结构 |
| \`mergeNamed\` | §2.4 | 两个 interface 合并形状 |
| \`freezeName\` | §2.5 | readonly |
| \`acceptDuck\` | §2.6 | 函数参数结构类型（鸭子） |
| \`assertProductShape\` | §2.7 | 类型谓词雏形（返回 boolean） |

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
| ④ 费曼（2 分钟） | 大白话讲清「为什么形状一样就能赋，字面量却有时红」 | 本页 ④ |
| ⑤ 存闪卡 | 章末闪卡标复习日期 | 闪卡 |

> 💡 别从头读到尾。先扫 ① → 写作业 → **哪题卡了，回对应 § 查** → 改 → 再跑。
> \`acceptDuck\` 可以复用 \`labelProduct\`；\`assertProductShape\` 查的就是前面价签函数要的那块形状。建议按顺序做。

---`,
    [],
  ),
  sec(
    "sec-guess",
    "① 预览猜（2 分钟 · 激活你的 Java / Python 直觉）",
    null,
    `先别看答案，凭经验猜一猜（猜错没关系）：

1. Java 里 \`class Product\` 和无关的 \`class OrderLine\`，即使字段一样也不能互赋。TS 里把商品变量传给「只要 name+price」的函数，编译过不过？
2. \`labelProduct({ name: "机械键盘", price: 599, sku: "KB-001" })\` **直接写字面量**，编辑器会不会红？先赋给 \`const p = { ... }\` 再 \`labelProduct(p)\` 呢？
3. Python 课的 \`Protocol\` 和 TS 的对象类型，运行时会不会检查你真的有那些字段？
4. \`interface A { x: number }\` 和 \`type A = { x: number }\` 写对象形状时能当同一个东西用吗？差在哪？
5. 参数写成 \`{ readonly name: string }\`，函数里 \`p.name = "改掉"\` 会怎样？发出去的 JS 还能改吗？
6. 转订单行时图省事 \`return { ...商品, quantity: 1 }\`，订单对象上会多出什么？

> 猜完，带着验证心态进入正文。第 2 题是整章最容易栽的坑。

---`,
    [],
  ),
  sec(
    "sec-world",
    "世界地图：名义类型 vs 结构类型 🔴",
    null,
    `先把「看名字」和「看形状」分清。后面每一节都建立在这张图上。

| | Java | Python | TypeScript |
|---|---|---|---|
| 默认 | **名义类型**：类名不同就不能赋 | 鸭子类型（运行时）+ Protocol（静态） | **结构类型**：形状对了就能赋 |
| \`Dog\` → \`Cat\` | 即使字段一样也 ❌ | Protocol 静态能过；运行时不查 | 字段对了就 ✅ |
| 运行时 | \`instanceof\` 还认类 | 没有强制 | **类型蒸发**，没有 \`Product\` 这个运行时类（除非你自己写 class） |

### Java 对照：名字不对，字段白搭

\`\`\`java
class Dog { String name; }
class Cat { String name; }
Cat c = new Dog();   // ❌ 编译失败：Dog 不是 Cat
\`\`\`

你要先抽一个 \`interface Named { String getName(); }\`，两个类都 \`implements\`，编译器认的是**这张名义契约**，不是字段凑巧长得像。

### Python Protocol：静态接近，运行时不管

\`\`\`python
from typing import Protocol

class Named(Protocol):
    name: str

def greet(x: Named) -> str:
    return x.name

class Product:
    def __init__(self, name: str, price: float):
        self.name, self.price = name, price

greet(Product("机械键盘", 599))  # 静态检查能过（有 name）
# 运行时没人查形状；缺字段要等到属性访问才 AttributeError
\`\`\`

### TypeScript：只看结构 🔴

\`\`\`ts
interface Dog { name: string }
interface Cat { name: string }

const dog: Dog = { name: "旺财" };
const cat: Cat = dog;   // ✅ 形状一样就能赋，名字不重要
\`\`\`

### 电商场景

货架价签函数并不需要完整 \`Product\` 类。它只要会报出名称和单价：

\`\`\`ts
function labelProduct(item: { name: string; price: number }): string {
  return \`\${item.name} ¥\${item.price.toFixed(2)}\`;
}

const keyboard = {
  id: 1, name: "机械键盘", category: "电脑外设",
  price: 599, stock: 120, sku: "KB-001",
};
labelProduct(keyboard);   // ✅ 多出来的 id/sku/stock 不碍事
\`\`\`

> 🟡 **和 Python 课的衔接**：运行时 TS 跟 Python 一样是鸭子——类型不在。差别在**编译期**：TS 真的按结构挡；Python Protocol 只在 mypy 里挡。
>
> 🤯 **转换点**：别在脑子里把 \`interface Product\` 翻译成 \`class Product\`。它不是一张要 \`implements\` 的名义身份证，而是一份**字段清单**。

### 本课怎么算「会了」

编辑器红线 ≈ 结构兼容 / 多余属性检查（编译期）。点「运行测试」≈ 跑 JS（运行时，形状得你自己保证）。**测试全绿 = 这题掌握。**

---`,
    [],
  ),
  sec(
    "sec-2.1",
    "§2.1 结构类型：只要 name + price（对应：`labelProduct`）🔴",
    "2.1",
    `### Java 对照：得先有共同的类型名

\`\`\`java
String labelProduct(Product item) {   // 必须是 Product（或它的父类型）
    return item.getName() + " ¥" + item.getPrice();
}
labelProduct(someOrderLine);   // ❌ OrderLine 不是 Product
\`\`\`

### TypeScript：参数是一份清单，不是一张身份证

\`\`\`ts
function labelProduct(item: { name: string; price: number }): string {
  return \`\${item.name} ¥\${item.price.toFixed(2)}\`;
}

labelProduct({ name: "机械键盘", price: 599 });     // ✅ "机械键盘 ¥599.00"
labelProduct({ name: "设计模式", price: 75.5 });     // ✅ "设计模式 ¥75.50"
labelProduct({ name: "赠品", price: 0 });           // ✅ "赠品 ¥0.00"
\`\`\`

完整商品当**变量**传入也行——它**包含** \`name\` 和 \`price\`，多出来的当没看见：

\`\`\`ts
const keyboard = PRODUCTS[0];
// keyboard 有 sku、stock、category……
labelProduct(keyboard);   // ✅ 结构兼容
\`\`\`

### ❌ / ✅

\`\`\`ts
// ❌ 以为必须先 declare class Product，再 instanceof
function labelProduct(item: Product) { /* 本章作业不要造 class */ }

// ❌ 去读用不到的 sku，函数签名里没有它——也没必要
return item.sku + item.name;

// ✅ 签名只列用到的字段；实现只读 name 和 price
return \`\${item.name} ¥\${item.price.toFixed(2)}\`;
\`\`\`

> ⚠️ 直接写带多余字段的**字面量**有时会被骂，下一节专门讲。本题测试会把完整商品、带 stock 的变量、以及最小 \`{ name, price }\` 都传进来。
>
> ✅ **做 \`labelProduct\`**：模板字符串 + \`toFixed(2)\`，和 Ch01 的价签同一套路。

---`,
    ["labelProduct"],
  ),
  sec(
    "sec-2.2",
    "§2.2 多余属性检查 + 可选 \`?\`（对应：`asOrderLine`）🔴",
    "2.2",
    `结构类型有一条 Java 老手极容易忽略的例外：**新鲜对象字面量**会做多余属性检查。

### 新鲜 vs 变量 🔴

\`\`\`ts
function labelProduct(item: { name: string; price: number }): string { /* ... */ }

// ❌ 字面量多写了 sku —— 编译器认为你很可能写错字段名
labelProduct({ name: "机械键盘", price: 599, sku: "KB-001" });

// ✅ 先放进变量。变量的类型更宽，再赋给更窄的参数，多余字段不再检查
const p = { name: "机械键盘", price: 599, sku: "KB-001" };
labelProduct(p);
\`\`\`

为什么？字面量是「我现在就在构造这个参数」，多一个键十有八九是拼写错误（\`nmae\`、多写了 \`sku\`）。变量已经存在，TS 只问「它**至少**有没有缺的字段吗」。

> 🤯 **转换点**：Java 没有「新鲜对象」这一说，字段要么在类上，要么不在。TS 这套是**帮你抓笔误**，不是否定结构类型。

### 可选属性 \`?\` 🟡

订单行一定有 \`quantity\`；加购时商品本身往往没有，默认买 1 件。参数写成 \`quantity?: number\`：可以不传，传了必须是 \`number\`。

\`\`\`ts
function asOrderLine(p: {
  sku: string;
  name: string;
  price: number;
  quantity?: number;
}): { sku: string; name: string; price: number; quantity: number } {
  return {
    sku: p.sku,
    name: p.name,
    price: p.price,
    quantity: p.quantity === undefined ? 1 : p.quantity,
  };
}
\`\`\`

### 真实场景

\`\`\`ts
asOrderLine({ sku: "KB-001", name: "机械键盘", price: 599 });
// -> { sku: "KB-001", name: "机械键盘", price: 599, quantity: 1 }

asOrderLine({ sku: "MS-002", name: "无线鼠标", price: 159, quantity: 3 });
// -> quantity: 3

asOrderLine({ sku: "CP-009", name: "智能水杯", price: 199, quantity: 0 });
// -> quantity: 0   ← 0 不是「没传」
\`\`\`

### ❌ / ✅：不要把仓库字段拷进订单

\`\`\`ts
// ❌ 展开会把 stock / category 一并拷走，订单行形状被污染
return { ...p, quantity: p.quantity || 1 };

// ❌ \`|| 1\` 把 0 当成没传
quantity: p.quantity || 1;

// ✅ 新建对象，只抄四个字段；用 === undefined 区分「没填」和 0
return {
  sku: p.sku,
  name: p.name,
  price: p.price,
  quantity: p.quantity === undefined ? 1 : p.quantity,
};
\`\`\`

测试会拿带 \`stock\` / \`category\` 的**变量**传入（结构兼容，编译过），再用 \`toEqual\` 查返回值**不能**多那些键。

> ✅ **做 \`asOrderLine\`**：四个字段的新对象；缺 quantity 用 1；保留 0。

---`,
    ["asOrderLine"],
  ),
  sec(
    "sec-2.3",
    "§2.3 interface 最小结构（对应：`pickSku`）🟡",
    "2.3",
    `对象类型写多了会吵。\`interface\` 给这份字段清单起个名。**名字仍然不是身份证**——只是好念。

### Java 对照：interface 是名义契约

\`\`\`java
interface HasSku { String getSku(); }
class Product implements HasSku { ... }
String pickSku(HasSku item) { return item.getSku(); }
// 没 implements 的类，就算真有 getSku，也不能传（名义）
\`\`\`

### TypeScript：interface 是形状别名

\`\`\`ts
interface HasSku {
  sku: string;
}

function pickSku(item: HasSku): string {
  return item.sku;
}

pickSku({ sku: "KB-001" });           // ✅ 最小形状
pickSku(PRODUCTS[0]);                 // ✅ 完整商品含 sku
pickSku({ sku: "HP-006" });           // ✅ "HP-006"
\`\`\`

作业签名写成 \`item: { sku: string }\` 和写成 \`HasSku\` **完全等价**（结构类型不看名字）。你愿意在作业里声明 \`interface HasSku\` 再用它，也可以。

### 订单行也能取 SKU

\`\`\`ts
const line = { sku: "BK-005", name: "设计模式", price: 75.5, quantity: 2 };
pickSku(line);   // ✅ "BK-005" —— 有 sku 就行
\`\`\`

### 索引签名（点到为止，**不考**）🟡

有时你想说「任意 string 键，值都是 number」：

\`\`\`ts
interface PriceTable {
  [sku: string]: number;
}
const table: PriceTable = { "KB-001": 599, "MS-002": 159 };
\`\`\`

本章作业用不到。记住有这种写法；别在 \`pickSku\` 里用索引签名硬取字段。

### ❌ / ✅

\`\`\`ts
// ❌ 以为必须先 class Product implements HasSku
// ✅ 任何带 sku: string 的对象都能传

// ❌ return item["sku"] 也行，但本课对象字段用点号
return item.sku;
\`\`\`

> ✅ **做 \`pickSku\`**：\`return item.sku;\`

---`,
    ["pickSku"],
  ),
  sec(
    "sec-2.4",
    "§2.4 合并两个形状：interface vs type（对应：`mergeNamed`）🟡",
    "2.4",
    `运营要把「只有名字的表」和「只有 SKU 的表」拼成一张卡片。两边各是一个最小 interface。

### 先起两个名

\`\`\`ts
interface Named {
  name: string;
}
interface HasSku {
  sku: string;
}
\`\`\`

### 合并形状的两种写法 🟡

\`\`\`ts
// type：交叉类型
type NamedSku = Named & HasSku;

// interface：多重继承（仍然是形状，不是 Java 那种名义继承树）
interface NamedSku extends Named, HasSku {}
\`\`\`

对象形状上两者几乎一样。差别记住三句就够：

| | \`interface\` | \`type\` |
|---|---|---|
| 对象形状 | ✅ | ✅ |
| 合并 | \`extends\`；同名 interface 会**声明合并** | \`&\`；不能声明合并 |
| 联合 / 元组 | ❌ 不能 \`type A \\| B\` 那种 | ✅（联合留给 Ch03） |

本章作业只考「两个形状合成一个对象」。声明合并知道即可，不考。

### 电商场景

\`\`\`ts
function mergeNamed(a: Named, b: HasSku): { name: string; sku: string } {
  return { name: a.name, sku: b.sku };
}

mergeNamed({ name: "机械键盘" }, { sku: "KB-001" });
// -> { name: "机械键盘", sku: "KB-001" }

mergeNamed({ name: "无线鼠标" }, { sku: "MS-002" });
// -> { name: "无线鼠标", sku: "MS-002" }
\`\`\`

两边变量上多出来的 \`price\` / \`stock\` **不要**带进结果（又是「别展开」）：

\`\`\`ts
const a = { name: "设计模式", price: 75.5 };
const b = { sku: "BK-005", stock: 200 };
mergeNamed(a, b);   // -> { name: "设计模式", sku: "BK-005" }
\`\`\`

### ❌ / ✅

\`\`\`ts
// ❌ return { ...a, ...b } 会把 price、stock 拷进去
// ❌ 以为 Named 和 HasSku 是两个 Java 类，不能同时用
// ✅ 只抄 name 和 sku
return { name: a.name, sku: b.sku };
\`\`\`

> ✅ **做 \`mergeNamed\`**：一个对象字面量，两个键。

---`,
    ["mergeNamed"],
  ),
  sec(
    "sec-2.5",
    "§2.5 \`readonly\`（对应：`freezeName`）🔴",
    "2.5",
    `价签上的商品名印出去就不许改；单价以后可能调。TS 用 \`readonly\` 标在**属性**上。

### Java 对照：\`final\` 字段

\`\`\`java
class Tag {
    final String name;
    double price;
}
tag.name = "改掉";   // ❌ 编译失败
tag.price = 9.9;     // ✅
\`\`\`

### TypeScript：\`readonly\` 是编译期的 \`final\`

\`\`\`ts
function freezeName(p: { readonly name: string; price: number }): string {
  // p.name = "改掉";  // ❌ 编辑器红线：无法分配到只读属性
  p.price = 9.9;       // ✅ price 不是 readonly（本题不必改它）
  return p.name;
}

freezeName({ name: "机械键盘", price: 599 });   // "机械键盘"
freezeName({ name: "设计模式", price: 75.5 });   // "设计模式"
\`\`\`

也可以写成 interface：

\`\`\`ts
interface FrozenPriced {
  readonly name: string;
  price: number;
}
\`\`\`

### 运行时蒸发 🔴

\`tsc\` 发出的 JS 里没有 \`readonly\`。普通对象默认仍可变：

\`\`\`ts
const p = { name: "机械键盘", price: 599 };
freezeName(p);
p.name = "被改了";   // JS 运行时不会报错
\`\`\`

真要运行时锁住，用 \`Object.freeze\`（本题**不要** freeze，作业只返回名字）。记住：**readonly 帮的是同事和 tsc，不是黑客。**

### ❌ / ✅

\`\`\`ts
// ❌ 试图在函数里改名再返回
p.name = p.name.trim();

// ❌ 返回了 price（看错字段）
return String(p.price);

// ✅
return p.name;
\`\`\`

> ✅ **做 \`freezeName\`**：\`return p.name;\` 别赋值给 \`name\`。

---`,
    ["freezeName"],
  ),
  sec(
    "sec-2.6",
    "§2.6 函数参数也是结构类型（对应：`acceptDuck`）🔴",
    "2.6",
    `「鸭子类型」那句老话：走起来像鸭子、叫起来像鸭子，那它就是鸭子。TS 把这句话写进了**函数参数**。

### Java 对照：必须 implements

\`\`\`java
void acceptDuck(Priced quacker) { ... }
acceptDuck(product);      // Product 必须 implements Priced
acceptDuck(anonymousMap); // ❌ Map 不是 Priced
\`\`\`

### TypeScript：实参形状对了就能调

\`\`\`ts
function acceptDuck(quacker: { name: string; price: number }): string {
  return labelProduct(quacker);   // 形状一样，直接复用 §2.1
}

acceptDuck({ name: "机械键盘", price: 599 });     // ✅ 匿名鸭子
acceptDuck(PRODUCTS[0]);                         // ✅ 完整商品
acceptDuck({ sku: "MS-002", name: "无线鼠标", price: 159, quantity: 2 }); // ✅ 订单行
\`\`\`

返回格式与 \`labelProduct\` 相同：\`"无线鼠标 ¥159.00"\`。

> 🟡 Python 的 Protocol 作参数注解时几乎同一回事——静态按结构，运行时不查。TS 编译期更硬。

### ❌ / ✅

\`\`\`ts
// ❌ 先 if (!(quacker instanceof Product)) —— 作业里没有 Product 类
// ❌ 硬编码 return "机械键盘 ¥599.00"
// ✅ 复用 labelProduct，或写同样的模板字符串
return labelProduct(quacker);
\`\`\`

> ✅ **做 \`acceptDuck\`**：一行转给 \`labelProduct\` 最干净。请先把 §2.1 写绿。

---`,
    ["acceptDuck"],
  ),
  sec(
    "sec-2.7",
    "§2.7 类型谓词雏形：运行时 boolean（对应：`assertProductShape`）🔴",
    "2.7",
    `前面六题的「形状」都是给编译器看的。接口丢过来一份 \`unknown\` JSON 时，\`interface Product\` **帮不上忙**——它已经蒸发了。

本题只返回 **boolean**（「长得像不像能交给 \`labelProduct\` 的东西」）。真正的类型谓词 \`v is Product\`、判别联合，留给 **Ch03**，本章不要写 \`is\`。

### 复用前面的形状

\`labelProduct\` / \`acceptDuck\` 要的是：对象、\`name\` 为 string、\`price\` 为 number。多余字段可以有。

记得 Ch01：

- \`typeof null === "object"\`（必须单独挡 null）
- 数组的 \`typeof\` 也是 \`"object"\`（用 \`Array.isArray\`）

\`\`\`ts
function assertProductShape(v: unknown): boolean {
  if (v === null || typeof v !== "object" || Array.isArray(v)) return false;
  const o = v as Record<string, unknown>;
  return typeof o.name === "string" && typeof o.price === "number";
}
\`\`\`

\`as Record<string, unknown>\` 是「我先把它当字典查字段」。这不是作弊，是 unknown 收窄之前的临时看法。Ch03 会教更干净的 narrowing。

### 真实场景

\`\`\`ts
assertProductShape(PRODUCTS[0]);                         // true
assertProductShape({ name: "x", price: 1 });             // true
assertProductShape({ name: "x", price: 1, sku: "A" });   // true（多余字段 OK）
assertProductShape({ name: "", price: 0 });              // true（空串和 0 仍是对的类型）
assertProductShape(null);                                // false
assertProductShape([{ name: "机械键盘", price: 599 }]);  // false（数组）
assertProductShape({ name: "x" });                       // false（缺 price）
assertProductShape({ name: "x", price: "599" });         // false（类型不对）
assertProductShape(42);                                  // false
\`\`\`

### ❌ / ✅

\`\`\`ts
// ❌ return typeof v === "object"   —— null 和数组会混进来
// ❌ 只查 name 在不在，不查 typeof
// ❌ 写成 function f(v: unknown): v is Product  —— 那是 Ch03
// ✅ null / 非对象 / 数组 → false；再查两个字段的 typeof
\`\`\`

> ✅ **做 \`assertProductShape\`**：挡三件套（null、非 object、数组）+ 两个 typeof。形状对了，你就知道能拿去 \`labelProduct\`——但本题只返回 boolean。

---`,
    ["assertProductShape"],
  ),
  sec(
    "sec-pits",
    "§2.8 Java / Python 老手几个坑 ⚠️",
    "2.8",
    `1. **别把 interface 当成 class。** 没有 \`implements\` 也能赋，只要形状对。
2. **新鲜字面量多余属性会红，变量不会。** 这是本课最重要的编辑器行为。
3. **转订单行不要 \`...p\`。** 结构兼容指「能传入」，不是「要把多的字段拷走」。
4. **\`quantity?:\` 没传是 \`undefined\`。** \`0\` 是买了零件。不要 \`p.quantity || 1\`。
5. **\`readonly\` 只在编译期。** 和 Java \`final\` 的运行时语义不同。
6. **\`interface\` / \`type\` 写对象几乎等价。** 联合类型只能 \`type\`（Ch03）。
7. **运行时没有 Product。** 脏数据用 boolean 雏形（本题）或以后的 zod，不能靠 interface。
8. **索引签名本章不考。** 看见 \`[key: string]: ...\` 认识即可。

---`,
    [],
  ),
  sec(
    "sec-homework",
    "📝 本章作业",
    null,
    `上面 7 个函数按节交错出现。每个注释里有【场景】【转换点】、示例和提示。

**完成方式**：在编辑器里改 \`throw new Error("TODO")\`，点「▶ 运行测试」。全绿 = 这题过了。

卡住就回对应 §：\`labelProduct\` → §2.1，\`asOrderLine\` → §2.2，\`assertProductShape\` → §2.7。

---`,
    [],
  ),
  sec(
    "sec-check",
    "✅ 自测：你真的掌握了吗？",
    null,
    `- [ ] 能用一句话说清「名义看名字、结构看形状」
- [ ] 知道完整商品变量能传给只要 name+price 的函数
- [ ] 能解释新鲜字面量为什么会被多余属性检查拦住
- [ ] 会用 \`interface\` 描述最小形状，会合并两个形状
- [ ] 知道 \`?\` 与 0 的差别，转订单行不展开多余字段
- [ ] 知道 \`readonly\` 编译期挡、运行时蒸发
- [ ] 会对 unknown 做 boolean 形状检查（挡 null 和数组）
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

1. 「为什么 \`Product\` 能传给只要 \`name\`+\`price\` 的函数，但 \`labelProduct({ name, price, sku })\` 直接写字面量编辑器又红？」— 卡壳重读世界地图 + §2.1 + §2.2
2. 「Java 的 \`class Dog\` 不能赋给 \`class Cat\`，TS 为什么可以？这和 Python Protocol 像在哪、不像在哪？」— 卡壳重读世界地图 + §2.6
3. 「\`readonly\` 既然会蒸发，标它有什么用？那脏 JSON 来了谁把关？」— 卡壳重读 §2.5 + §2.7

---`,
    [],
  ),
  sec(
    "sec-next",
    "⏭️ 下一步",
    null,
    `Ch02 掌握后，进 **Ch03 · 联合、字面量、narrowing**。\`string | null\`、\`typeof\` / \`in\` 收窄、判别联合（\`type: "ok" | "err"\`）都在那儿。本章的 boolean 雏形会升级成真的类型谓词 \`v is Product\`。别提前写判别联合，那是下一章的主菜。`,
    [],
  ),
];

const tutorialMd = `# Ch02 · 结构类型 vs 名义类型

${sections
  .map((s) => (s.heading ? `## ${s.heading}\n\n${s.body}` : s.body))
  .join("\n\n")}
`;

const chapter = {
  id: "ch02",
  num: "02",
  title: "结构类型 vs 名义类型",
  runMode: "browser",
  tutorialMd,
  assignment,
  testName: "ch02_assignment",
  testSource,
  reviewMd,
  interleaved: true,
  sections,
  functions,
  preamble,
};

const out = join(dirname(fileURLToPath(import.meta.url)), "../src/content/chapters/ch02.json");
mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, JSON.stringify(chapter, null, 2) + "\n");
console.log("wrote", out);
