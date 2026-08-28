/**
 * 生成 src/content/chapters/ch04.json
 * 运行：bun scripts/gen-ch04.ts
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const preamble = `/**
 * Ch04 作业：商品补丁与按类目建索引。
 *
 * 场景：运营改一条库存、目录页只露名称和价格、按 SKU / 类目建索引。
 * 7 个函数，每个砸在一个泛型或工具类型上。
 *
 * 约定：商品对象形如
 *   { id: 1, name: "机械键盘", category: "电脑外设",
 *     price: 599, stock: 120, sku: "KB-001" }
 *
 * Partial / Pick / Omit / Record 只在编译期存在，运行时蒸发（Ch01）。
 * 点「运行测试」时已经擦成 JS，靠测试兜底行为——测不到「你写没写 Partial」，
 * 只能测合并、抽字段、建索引这些运行时结果。
 *
 * 全绿 = 你掌握了 Ch04。
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
    name: "firstOf",
    testSuite: "firstOf",
    skeleton: `/**
 * 【场景】推荐位 / 队列：取出列表里的第一件商品（或第一个数字、第一段文案）。
 * 空列表没有「第一件」，返回 null。
 *
 * 【转换点】泛型函数 \`function firstOf<T>\`。
 * Java 要写 \`<T> T firstOf(List<T>)\`；Python 用 TypeVar；
 * TS 的 T 多数时候**不用手写**，调用时从参数推断。
 * 类型在发出的 JS 里蒸发（Ch01），运行时就是 \`items[0]\`。
 *
 * 任务：返回数组第一个元素；空数组返回 null（不是 undefined）。
 * 示例：
 *   firstOf([1, 2, 3])                         -> 1
 *   firstOf(["KB-001", "MS-002"])              -> "KB-001"
 *   firstOf(PRODUCTS)                          -> PRODUCTS[0]  // 机械键盘
 *   firstOf([])                                -> null
 *
 * 提示：看 \`items.length\`；不要写死返回 PRODUCTS[0]。
 */
export function firstOf<T>(items: T[]): T | null {
  throw new Error("TODO");
}`,
  },
  {
    name: "pluck",
    testSuite: "pluck",
    skeleton: `/**
 * 【场景】报表：从商品对象上抽一个字段——有时要 sku，有时要 price。
 * 键必须是对象上真有的字段，编译期挡住 \`"weight"\` 这种拼错。
 *
 * 【转换点】\`K extends keyof T\`。Java 没有 keyof，只能反射 + 强转；
 * Python 的 getattr 运行时才爆。TS 的 key 被约束成 T 的键，返回类型是 T[K]。
 *
 * 任务：返回 obj[key]。
 * 示例：
 *   pluck(PRODUCTS[0], "sku")    -> "KB-001"
 *   pluck(PRODUCTS[0], "price")  -> 599
 *   pluck({ a: 1, b: "hi" }, "b") -> "hi"
 *
 * 提示：\`return obj[key]\`。不要写死 \`obj.sku\`。
 */
export function pluck<T, K extends keyof T>(obj: T, key: K): T[K] {
  throw new Error("TODO");
}`,
  },
  {
    name: "patchProduct",
    testSuite: "patchProduct",
    skeleton: `/**
 * 【场景】运营后台：只改库存（或缺货下架），其它字段保持原样。
 * 入参 patch 不必给全字段——这就是 Partial<Product>。
 *
 * 【转换点】Partial<T> = 每个字段变成可选。只在编译期存在，运行时就是普通对象。
 * 【铁律】不要改传入的 base：返回新对象。Java 老手容易 base.setStock(0)。
 *
 * 任务：浅合并，\`{ ...base, ...patch }\`。空 patch 得到一份字段相同的新对象。
 * 示例：
 *   patchProduct(PRODUCTS[0], { stock: 0 }).stock          -> 0
 *   patchProduct(PRODUCTS[0], { stock: 0 }).name           -> "机械键盘"
 *   patchProduct(PRODUCTS[0], { stock: 0 }) 之后
 *     PRODUCTS[0].stock 仍是 120
 *   patchProduct(PRODUCTS[0], {}).price                    -> 599
 *
 * 提示：展开运算符；不要 \`base.stock = …; return base\`。
 */
export function patchProduct(base: Product, patch: Partial<Product>): Product {
  throw new Error("TODO");
}`,
  },
  {
    name: "catalogCard",
    testSuite: "catalogCard",
    skeleton: `/**
 * 【场景】目录页卡片：访客只该看到名称和价格，不要把库存/SKU 漏出去。
 *
 * 【转换点】Pick<Product, "name" | "price"> = 只保留这两个键。
 * 注意：\`return p\` 在类型上往往能过（结构类型，多出来的字段赋值常放行），
 * 但运行时对象还带着 id/stock，测试会红。必须自己造一个只有两键的新对象。
 *
 * 任务：返回 { name, price }。
 * 示例：
 *   catalogCard(PRODUCTS[0]) -> { name: "机械键盘", price: 599 }
 *   catalogCard(PRODUCTS[4]) -> { name: "设计模式", price: 75.5 }
 *
 * 提示：\`return { name: p.name, price: p.price }\`。
 */
export function catalogCard(p: Product): Pick<Product, "name" | "price"> {
  throw new Error("TODO");
}`,
  },
  {
    name: "withoutStock",
    testSuite: "withoutStock",
    skeleton: `/**
 * 【场景】把商品同步给不需要库存的下游（广告、公开 API）：去掉 stock 键。
 * 不是把 stock 改成 0，是**这个字段不存在**。
 *
 * 【转换点】Omit<Product, "stock"> = 去掉列出的键，其余保留。和 Pick 相反。
 *
 * 任务：返回没有 stock 键的对象，其它字段原样。不要改传入的 p。
 * 示例：
 *   withoutStock(PRODUCTS[0])
 *     -> { id: 1, name: "机械键盘", category: "电脑外设",
 *          price: 599, sku: "KB-001" }
 *   withoutStock(PRODUCTS[8])  // 智能水杯，原 stock 就是 0
 *     -> 结果里仍然没有 stock 这个键
 *
 * 提示：\`const { stock, ...rest } = p; return rest;\`
 *       或逐个抄 id/name/category/price/sku。解构细节 Ch05 再展开。
 */
export function withoutStock(p: Product): Omit<Product, "stock"> {
  throw new Error("TODO");
}`,
  },
  {
    name: "indexBySku",
    testSuite: "indexBySku",
    skeleton: `/**
 * 【场景】仓储：用 SKU 当主键，O(1) 查商品。重复 sku 以后写入的为准。
 *
 * 【转换点】Record<string, Product> ≈ Java 的 Map<String, Product>、
 * Python 的 dict[str, Product]。运行时是**普通对象**，不是 Map。
 *
 * 任务：返回 { [sku]: product }。空列表返回 {}。
 * 示例：
 *   indexBySku(PRODUCTS)["CP-009"].name  -> "智能水杯"
 *   indexBySku(PRODUCTS)["KB-001"].name  -> "机械键盘"
 *   indexBySku([])                      -> {}
 *   两个相同 sku，后者覆盖前者
 *
 * 提示：\`const out: Record<string, Product> = {}; out[p.sku] = p;\`
 */
export function indexBySku(products: Product[]): Record<string, Product> {
  throw new Error("TODO");
}`,
  },
  {
    name: "groupByCategory",
    testSuite: "groupByCategory",
    skeleton: `/**
 * 【场景】类目页：把商品按 category 分成几桶，桶内保持原列表顺序。
 *
 * 【转换点】综合：Record 累加（§4.6）+ 按字段取值（§4.2 的 pluck 思路）。
 * 值不是单个 Product，是 Product[]。不要 sort，不要改传入的数组。
 *
 * 任务：返回 { [category]: Product[] }。空列表返回 {}。
 * 示例（全量 PRODUCTS）：
 *   groupByCategory(PRODUCTS)["图书"].length      -> 2
 *     // Python编程:从入门到实践、设计模式（这个顺序）
 *   groupByCategory(PRODUCTS)["电脑外设"].length  -> 4
 *   groupByCategory(PRODUCTS)["生活用品"][0].sku  -> "CP-009"  // 智能水杯
 *   groupByCategory([])                           -> {}
 *
 * 提示：和 indexBySku 一样先准备 \`{}\`；
 *       \`const cat = pluck(p, "category")\` 或 \`p.category\`；
 *       没有这个桶就 \`out[cat] = []\`，再 \`push(p)\`。
 */
export function groupByCategory(products: Product[]): Record<string, Product[]> {
  throw new Error("TODO");
}`,
  },
];

const assignment = `${preamble}

${functions.map((f) => f.skeleton).join("\n\n")}
`;

const testSource = `describe("firstOf", () => {
  it("数字数组取第一个", () => {
    expect(firstOf([1, 2, 3])).toBe(1);
  });
  it("字符串数组取第一个", () => {
    expect(firstOf(["KB-001", "MS-002"])).toBe("KB-001");
  });
  it("全量商品取第一个是机械键盘", () => {
    expect(firstOf(PRODUCTS)).toEqual(PRODUCTS[0]);
  });
  it("空数组返回 null", () => {
    expect(firstOf([])).toBeNull();
  });
  it("单元素数组", () => {
    expect(firstOf([99])).toBe(99);
  });
});

describe("pluck", () => {
  it("抽 sku", () => {
    expect(pluck(PRODUCTS[0], "sku")).toBe("KB-001");
  });
  it("抽 price（专治写死 obj.sku）", () => {
    expect(pluck(PRODUCTS[0], "price")).toBe(599);
  });
  it("抽 name", () => {
    expect(pluck(PRODUCTS[4], "name")).toBe("设计模式");
  });
  it("非 Product 对象也能抽字段", () => {
    expect(pluck({ a: 1, b: "hi" }, "b")).toBe("hi");
  });
  it("抽 category", () => {
    expect(pluck(PRODUCTS[8], "category")).toBe("生活用品");
  });
});

describe("patchProduct", () => {
  it("只改 stock，其它字段保留", () => {
    const result = patchProduct(PRODUCTS[0], { stock: 0 });
    expect(result).toEqual({
      id: 1,
      name: "机械键盘",
      category: "电脑外设",
      price: 599,
      stock: 0,
      sku: "KB-001",
    });
  });
  it("不修改传入的 base", () => {
    const base = {
      id: 1,
      name: "机械键盘",
      category: "电脑外设",
      price: 599,
      stock: 120,
      sku: "KB-001",
    };
    const result = patchProduct(base, { stock: 0 });
    expect(base.stock).toBe(120);
    expect(result.stock).toBe(0);
  });
  it("改 result 不影响 base（必须是新对象）", () => {
    const base = {
      id: 9,
      name: "智能水杯",
      category: "生活用品",
      price: 199,
      stock: 0,
      sku: "CP-009",
    };
    const result = patchProduct(base, { name: "新水杯" });
    result.name = "被改了";
    expect(base.name).toBe("智能水杯");
  });
  it("空 patch 字段与原对象相同", () => {
    expect(patchProduct(PRODUCTS[0], {})).toEqual(PRODUCTS[0]);
  });
  it("一次补丁多个字段", () => {
    const result = patchProduct(PRODUCTS[1], { price: 129, stock: 10 });
    expect(result.price).toBe(129);
    expect(result.stock).toBe(10);
    expect(result.sku).toBe("MS-002");
    expect(result.name).toBe("无线鼠标");
  });
});

describe("catalogCard", () => {
  it("机械键盘卡片", () => {
    expect(catalogCard(PRODUCTS[0])).toEqual({ name: "机械键盘", price: 599 });
  });
  it("设计模式带小数价", () => {
    expect(catalogCard(PRODUCTS[4])).toEqual({ name: "设计模式", price: 75.5 });
  });
  it("智能水杯", () => {
    expect(catalogCard(PRODUCTS[8])).toEqual({ name: "智能水杯", price: 199 });
  });
  it("只有两个键（专治 return p）", () => {
    expect(Object.keys(catalogCard(PRODUCTS[0])).length).toBe(2);
  });
});

describe("withoutStock", () => {
  it("机械键盘去掉 stock", () => {
    expect(withoutStock(PRODUCTS[0])).toEqual({
      id: 1,
      name: "机械键盘",
      category: "电脑外设",
      price: 599,
      sku: "KB-001",
    });
  });
  it("智能水杯原 stock 为 0，结果里仍然没有 stock 键", () => {
    const result = withoutStock(PRODUCTS[8]);
    expect(result).toEqual({
      id: 9,
      name: "智能水杯",
      category: "生活用品",
      price: 199,
      sku: "CP-009",
    });
    expect(Object.keys(result).length).toBe(5);
  });
  it("不修改传入对象", () => {
    const p = {
      id: 1,
      name: "机械键盘",
      category: "电脑外设",
      price: 599,
      stock: 120,
      sku: "KB-001",
    };
    withoutStock(p);
    expect(p.stock).toBe(120);
  });
  it("人体工学椅其它字段保留", () => {
    const result = withoutStock(PRODUCTS[9]);
    expect(result.name).toBe("人体工学椅");
    expect(result.sku).toBe("CH-010");
    expect(result.price).toBe(1599);
  });
});

describe("indexBySku", () => {
  it("CP-009 是智能水杯", () => {
    expect(indexBySku(PRODUCTS)["CP-009"]).toEqual({
      id: 9,
      name: "智能水杯",
      category: "生活用品",
      price: 199,
      stock: 0,
      sku: "CP-009",
    });
  });
  it("KB-001 是机械键盘", () => {
    expect(indexBySku(PRODUCTS)["KB-001"]).toEqual(PRODUCTS[0]);
  });
  it("空列表返回空对象", () => {
    expect(indexBySku([])).toEqual({});
  });
  it("全量 10 个 sku 键", () => {
    expect(Object.keys(indexBySku(PRODUCTS)).length).toBe(10);
  });
  it("重复 sku 后者覆盖", () => {
    const first = {
      id: 1,
      name: "旧键盘",
      category: "电脑外设",
      price: 599,
      stock: 120,
      sku: "KB-001",
    };
    const second = {
      id: 99,
      name: "新键盘",
      category: "电脑外设",
      price: 699,
      stock: 1,
      sku: "KB-001",
    };
    expect(indexBySku([first, second])["KB-001"].name).toBe("新键盘");
    expect(indexBySku([first, second])["KB-001"].id).toBe(99);
  });
});

describe("groupByCategory", () => {
  it("图书有 2 件，顺序是 Python 书再设计模式", () => {
    expect(groupByCategory(PRODUCTS)["图书"]).toEqual([PRODUCTS[3], PRODUCTS[4]]);
  });
  it("电脑外设有 4 件，保持原顺序", () => {
    const group = groupByCategory(PRODUCTS)["电脑外设"];
    expect(group.length).toBe(4);
    expect(group).toEqual([PRODUCTS[0], PRODUCTS[1], PRODUCTS[2], PRODUCTS[7]]);
  });
  it("生活用品包含智能水杯", () => {
    const life = groupByCategory(PRODUCTS)["生活用品"];
    expect(life.length).toBe(2);
    expect(life[0].sku).toBe("CP-009");
    expect(life[1].sku).toBe("CH-010");
  });
  it("影音设备两件", () => {
    expect(groupByCategory(PRODUCTS)["影音设备"]).toEqual([PRODUCTS[5], PRODUCTS[6]]);
  });
  it("空列表返回空对象", () => {
    expect(groupByCategory([])).toEqual({});
  });
  it("不修改传入数组的顺序", () => {
    const items = [PRODUCTS[4], PRODUCTS[0]];
    groupByCategory(items);
    expect(items[0].sku).toBe("BK-005");
    expect(items[1].sku).toBe("KB-001");
  });
});
`;

const reviewMd = `# Ch04 · 记忆闪卡

> 先回忆，再翻答案。连续 2 次秒答 → 退役。

## 🔖 闪卡

| # | 正面（问题） | 背面（答案） | 掌握 |
|---|---|---|---|
| 1 | \`firstOf([1,2])\` 不用写 \`firstOf<number>(...)\`，T 从哪来？ | 从参数推断。\`[1,2]\` 是 \`number[]\`，T 就是 number。Java 老写法常要显式 \`<T>\` | ⬜ |
| 2 | 泛型 T 在浏览器点「运行测试」时还在吗？ | 不在。和 Ch01 一样，转译成 JS 后蒸发。运行时就是普通函数 | ⬜ |
| 3 | Java \`List<Dog>\` 能当成 \`List<Animal>\` 吗？TS 的 \`firstOf\` 呢？ | Java 集合默认不变性，不能。TS 的 T 按实参推断；结构对上就能调，不搞那套名义不变性 | ⬜ |
| 4 | Python \`TypeVar("T")\` 和 TS \`<T>\` 关键差别？ | 心智像。Python 注解运行时不强制；TS 编译期硬约束，发出去的 JS 里 T 没了 | ⬜ |
| 5 | \`keyof Product\` 得到什么？ | 字符串字面量联合：\`"id" \\| "name" \\| "category" \\| "price" \\| "stock" \\| "sku"\` | ⬜ |
| 6 | \`K extends keyof T\` 拦的是什么？ | 不是 T 上的键就编译失败，比如 \`pluck(product, "weight")\`。返回类型跟着变成 \`T[K]\` | ⬜ |
| 7 | \`Partial<Product>\` 运行时是什么？能 \`instanceof Partial\` 吗？ | 运行时就是普通对象。Partial 是类型别名，蒸发了，没有这个类 | ⬜ |
| 8 | \`patchProduct\` 为什么禁止改 base？ | 调用方还拿着原对象当「改之前的快照」。要返回 \`{ ...base, ...patch }\` 新对象 | ⬜ |
| 9 | \`Pick\` 和 \`Omit\` 谁留谁删？目录卡片用哪个？ | Pick 留列出的键；Omit 删列出的键。卡片用 \`Pick<Product, "name" \\| "price">\` | ⬜ |
| 10 | \`catalogCard\` 写成 \`return p\` 类型能过吗？测试呢？ | 变量赋值常放过多余字段，类型往往绿。运行时多了 id/stock，\`toEqual\` / 键个数会红 | ⬜ |
| 11 | \`Record<string, Product>\` 运行时是 \`Map\` 吗？ | 不是。是普通对象 \`{}\`，用 \`out[sku] = p\`。对标 Java Map、Python dict 的**类型**，不是那个类 | ⬜ |
| 12 | \`Array<T>\` 和 \`T[]\` 有区别吗？ | 没有，同一件事的两种写法。本章作业用 \`T[]\` | ⬜ |
| 13 | 重复 sku 建索引谁赢？空列表返回什么？ | 后者覆盖（last-wins）。空列表返回 \`{}\`，不是 null | ⬜ |
| 14 | 条件类型 \`T extends U ? X : Y\` 本章考吗？ | 不考。延伸阅读里见过即可，不要写 \`infer\`、不要写递归条件类型 | ⬜ |

## 🎓 费曼自检

- [ ] 能说清「T 怎么推断、发出 JS 之后为什么看不见」
- [ ] 能说清 Partial / Pick / Omit / Record 都是编译期工具，测试只能测行为
- [ ] 能说清补丁为什么必须返回新对象
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
    `> **预计**：1 天 ｜ **前置**：Ch03（联合与 narrowing；本章独立可做）
> **目标**：① 会写 \`function first<T>\`；② 会用 \`Partial\` / \`Pick\` / \`Omit\` / \`Record\`。
> 你 15 年 Java，Python 课也在前面。泛型不是新概念——真正要小心的是：**TS 的 T 会推断、会蒸发；工具类型只在编译期存在。**

> 📐 **本教程的契约**：下面每一节（§4.1–§4.7）都**精确对应**作业里的题。讲过的才考，考的必讲过。卡住时按作业函数名回查对应小节。
> 条件类型只在「延伸阅读」，**不考**。不讲 \`infer\`、不讲递归条件类型。

---`,
    [],
  ),
  sec(
    "sec-map",
    "🗺️ 本章地图",
    null,
    `本章作业是一条完整主线：**商品补丁 + 按类目建索引**。7 个函数，从「取第一个」走到「按类目分桶」。

读完这章 + 完成作业，你将能够：

- 写出 \`function firstOf<T>(items: T[]): T | null\`，并解释 T 从哪推断、运行时为什么看不见
- 对照 Java 泛型擦除 / 不变性，以及 Python 的 TypeVar
- 用 \`K extends keyof T\` 写一个类型安全的 \`pluck\`
- 用 \`Partial<Product>\` 做补丁，且**不改原对象**
- 用 \`Pick\` 做目录卡片、用 \`Omit\` 去掉库存字段
- 用 \`Record<string, Product>\` / \`Record<string, Product[]>\` 建 SKU 索引和类目分组
- 分清 \`Array<T>\` 和 \`T[]\`（同一件事）

**作业 ↔ 教程对应表**（学哪节，就去做哪题）：

| 作业题 | 对应小节 | 核心知识点 |
|--------|----------|-----------|
| \`firstOf\` | §4.1 | 泛型函数 |
| \`pluck\` | §4.2 | \`keyof\` + 泛型 |
| \`patchProduct\` | §4.3 | \`Partial<Product>\` |
| \`catalogCard\` | §4.4 | \`Pick<Product, "name" \\| "price">\` |
| \`withoutStock\` | §4.5 | \`Omit\` |
| \`indexBySku\` | §4.6 | \`Record<string, Product>\` |
| \`groupByCategory\` | §4.7 | 综合 |

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
| ④ 费曼（2 分钟） | 大白话讲清「工具类型为何测试测不到」 | 本页 ④ |
| ⑤ 存闪卡 | 章末闪卡标复习日期 | 闪卡 |

> 💡 别从头读到尾。先扫 ① → 写作业 → **哪题卡了，回对应 § 查** → 改 → 再跑。
> 最后一题 \`groupByCategory\` 会复用前面的 Record 累加和 \`pluck\` 思路，建议按顺序做。

---`,
    [],
  ),
  sec(
    "sec-guess",
    "① 预览猜（2 分钟 · 激活你的 Java / Python 直觉）",
    null,
    `先别看答案，凭经验猜一猜（猜错没关系）：

1. Java 的 \`List<Dog>\` 能不能赋给 \`List<Animal>\`？TS 里 \`firstOf(PRODUCTS)\` 的 T 是谁推出来的？
2. 你写了 \`Partial<Product>\`，浏览器里点「运行测试」之后，\`Partial\` 这个字还在不在？能 \`instanceof\` 吗？
3. 运营把库存改成 0：如果函数里写 \`base.stock = 0; return base\`，调用方手里的原对象会怎样？
4. 目录卡片只要 name 和 price。\`return p\` 让整个 Product 出去，**编译**会不会骂？**测试**会不会红？
5. \`Record<string, Product>\` 运行时是 Java 那种 \`HashMap\`，还是普通 \`{}\`？
6. \`keyof Product\` 是一个 string，还是一串字面量联合？

> 猜完，带着验证心态进入正文。

---`,
    [],
  ),
  sec(
    "sec-world",
    "世界地图：泛型在三相语言里 🟡",
    null,
    `先把「你已经会的泛型」对上 TS 的写法。细节在后面各节展开。

| 概念 | Java | Python | TypeScript |
|---|---|---|---|
| 声明 | \`static <T> T first(List<T> xs)\` | \`TypeVar("T")\` + \`list[T]\` | **\`function first<T>(xs: T[])\`** |
| 调用 | 老 javac 常要 \`Foo.<Product>first(list)\` | 不写 T，靠推断 / 注解 | **多数时候不写 \`<Product>\`，从参数推断** |
| 集合 | \`List<T>\` **不变性**：\`List<Dog>\` ≠ \`List<Animal>\` | \`list[Dog]\` 检查靠 mypy | **结构对上就能推 T**；\`T[]\` 和 \`Array<T>\` 相同 |
| 擦除 | 编译后剩 raw type，运行时还能看到一点 | 注解本来就不强制 | **和 Ch01 一样：发出 JS 后类型蒸发，什么都不剩** |
| 约束 | \`<T extends Product>\` | \`TypeVar("T", bound=Product)\` | **\`T extends Product\`**；键约束用 \`K extends keyof T\` |

### Java 不变性（你一定踩过）

\`\`\`java
List<Dog> dogs = new ArrayList<>();
List<Animal> animals = dogs;   // ❌ 编译失败：List 不变
dogs.add(new Dog());
// 如果上行能过，animals.get(0) 当 Animal 用没问题，
// 但 animals.add(new Cat()) 会把猫塞进狗列表——所以 Java 禁止。
\`\`\`

TS 不靠类名判别，只看形状（Ch02 的主题；本章记住一句）：**\`firstOf\` 的 T 不是类层次，是「这个数组里的元素长什么样」**。

\`\`\`ts
firstOf([1, 2, 3]);     // T = number
firstOf(PRODUCTS);      // T = Product（形状对上即可）
firstOf([]);            // T 推不出来也没关系，你返回 null
\`\`\`

### 擦除 vs 蒸发 🔴

Java 泛型会擦除，但 bytecode / 反射里还留着 raw type，\`instanceof List\` 还在。
TS 更彻底：**\`<T>\`、\`Partial<Product>\` 这些字发出 JS 之后一个都不剩**——和 Ch01 的 \`: number\` 同一条规则。

所以本章测试**不会**（也不能）断言「Partial 在运行时存在」。全绿只说明你的**合并 / 抽字段 / 建索引行为**对了。类型对不对，看编辑器红线。

---`,
    [],
  ),
  sec(
    "sec-4.1",
    "§4.1 泛型函数（对应：`firstOf`）🟡",
    "4.1",
    `### Java 对照：显式类型参数

\`\`\`java
static <T> T firstOf(List<T> items) {
    return items.isEmpty() ? null : items.get(0);
}
firstOf(List.of(1, 2, 3));          // Integer
firstOf(products);                   // Product
\`\`\`

### Python（你刚学过）：TypeVar

\`\`\`python
from typing import TypeVar
T = TypeVar("T")

def first_of(items: list[T]) -> T | None:
    return items[0] if items else None

first_of([1, 2, 3])          # 1
first_of([])                 # None
\`\`\`

### TypeScript：\`<T>\` 写在函数名后面 🟡

\`\`\`ts
function firstOf<T>(items: T[]): T | null {
  return items.length === 0 ? null : items[0];
}

firstOf([1, 2, 3]);              // 1，T 推断为 number
firstOf(["KB-001", "MS-002"]);   // "KB-001"
firstOf(PRODUCTS);               // 机械键盘那件
firstOf([]);                     // null
\`\`\`

调用时几乎不必写 \`firstOf<number>([1, 2, 3])\`。编辑器自己从 \`[1, 2, 3]\` 推出 T。这比老 Java 省事，和现代 Java / Python 的推断接近。

### \`Array<T>\` 就是 \`T[]\` 🟢

\`\`\`ts
let a: Array<number> = [1, 2];
let b: number[] = [1, 2];
// 完全同一件事。作业签名用 T[]。
\`\`\`

对标 Java \`List<T>\`、Python \`list[T]\`。没有 \`int[]\` / \`Integer[]\` 之分——元素类型是 T，数组还是数组。

### ❌ / ✅

\`\`\`ts
// ❌ 放弃类型，和没写泛型一样
function firstOf(items: any[]): any { ... }

// ❌ 空列表 return;  → undefined，测试要 null
function firstOf<T>(items: T[]): T | null {
  return items[0];   // 空数组的 [0] 是 undefined
}

// ❌ 写死电商数据，数字数组就挂
function firstOf<T>(items: T[]): T | null {
  return PRODUCTS[0] as T;
}

// ✅
function firstOf<T>(items: T[]): T | null {
  return items.length === 0 ? null : items[0];
}
\`\`\`

> 🤯 **转换点**：T 只在编译期帮你把「数字数组 → 数字、商品数组 → 商品」连起来。运行时没有 T，就是取下标 0。
>
> ✅ **做 \`firstOf\`**：判空返回 \`null\`，否则 \`items[0]\`。测试会用数字、字符串、\`PRODUCTS\`、\`[]\` 四种，专治硬编码。

---`,
    ["firstOf"],
  ),
  sec(
    "sec-4.2",
    "§4.2 `keyof` + 泛型约束（对应：`pluck`）🔴",
    "4.2",
    `报表有时要 SKU，有时要价格。你想写一个「按键取值」的函数，还要让拼错字段名在编译期爆掉。

### \`keyof\`：对象的键变成字面量联合 🔴

\`\`\`ts
type Product = {
  id: number;
  name: string;
  category: string;
  price: number;
  stock: number;
  sku: string;
};

type ProductKeys = keyof Product;
// "id" | "name" | "category" | "price" | "stock" | "sku"
\`\`\`

这不是 Java 的 \`getSku()\` 方法名，也不是 Python 的 \`dict.keys()\`（那是运行时）。\`keyof\` **只存在于类型世界**。

### Python / Java：没有编译期的键约束

\`\`\`python
def pluck(obj, key):
    return obj[key]          # key 写错，KeyError 到运行时才来
\`\`\`

\`\`\`java
Object pluck(Product p, String key) {
    // 只能反射，返回 Object，自己强转
}
\`\`\`

### TypeScript：\`K extends keyof T\` 🟡

\`extends\` 在这里是**约束**（和 Java \`<T extends Product>\` 同一类词），不是继承类。

\`\`\`ts
function pluck<T, K extends keyof T>(obj: T, key: K): T[K] {
  return obj[key];
}

pluck(PRODUCTS[0], "sku");     // "KB-001"，返回类型是 string
pluck(PRODUCTS[0], "price");   // 599，返回类型是 number
pluck({ a: 1, b: "hi" }, "b"); // "hi"
pluck(PRODUCTS[0], "weight");  // ❌ 编辑器红线：不是 Product 的键
\`\`\`

\`T[K]\` 读作「T 上键 K 的值类型」：抽 \`sku\` 得到 string，抽 \`price\` 得到 number。同一个函数，返回类型跟着 key 变。

### 真实场景

运营导出「只拿 SKU 列」或「只拿单价列」，不要为每个字段写一个 \`getSku\` / \`getPrice\`。

### ❌ / ✅

\`\`\`ts
// ❌ 写死字段，测 price 就挂
function pluck<T, K extends keyof T>(obj: T, key: K): T[K] {
  return (obj as Product).sku as T[K];
}

// ❌ 丢掉约束，key 变成普通 string，返回 any
function pluck(obj: Product, key: string) {
  return obj[key];
}

// ✅
function pluck<T, K extends keyof T>(obj: T, key: K): T[K] {
  return obj[key];
}
\`\`\`

> ✅ **做 \`pluck\`**：一行 \`return obj[key]\`。测试会抽 sku、price、name，还会抽 \`{ a, b }\` 这种非 Product，专治写死。

---`,
    ["pluck"],
  ),
  sec(
    "sec-4.3",
    "§4.3 `Partial<Product>` 做补丁（对应：`patchProduct`）🟡",
    "4.3",
    `运营只要把机械键盘的库存改成 0，不会每次提交 6 个字段。这就是「部分更新」。

### 工具类型：所有字段变可选 🟡

\`Partial<Product>\` 的意思：每个键都变成 \`?\`。\`{}\`、\`{ stock: 0 }\`、\`{ name: "新键盘", price: 699 }\` 都合法。\`{ weight: 1 }\` 不合法（多出来的键）。

它**不是** Java 的 \`Optional<Product>\`（那是「整个对象可能没有」）。也不是「Product 或 null」。

### Java 对照：你通常会 new 一个 builder / 手写 setter

\`\`\`java
product.setStock(0);   // 直接改原对象 —— 调用方的「旧快照」没了
\`\`\`

### Python

\`\`\`python
def patch_product(base: dict, patch: dict) -> dict:
    return { **base, **patch }    # 新 dict；别 base.update(patch)
\`\`\`

### TypeScript：浅合并，返回新对象 🔴

\`\`\`ts
function patchProduct(base: Product, patch: Partial<Product>): Product {
  return { ...base, ...patch };
}

const patched = patchProduct(PRODUCTS[0], { stock: 0 });
patched.stock;           // 0
patched.name;            // "机械键盘"（没在 patch 里，从 base 来）
PRODUCTS[0].stock;       // 仍是 120 —— 原对象不能动
\`\`\`

\`Partial\` 发出 JS 之后蒸发。运行时的 \`patch\` 就是 \`{ stock: 0 }\` 这种普通对象。测试只能查合并结果，**查不到你有没有在签名上写 Partial**——但编辑器会查。

### ❌ / ✅（不要改原件）

\`\`\`ts
// ❌ 可变，调用方的 base 被改掉
function patchProduct(base: Product, patch: Partial<Product>): Product {
  if (patch.stock !== undefined) base.stock = patch.stock;
  return base;
}

// ❌ 只返回 patch，name/sku 丢了
function patchProduct(base: Product, patch: Partial<Product>): Product {
  return patch as Product;
}

// ✅ 浅拷贝 + 覆盖
function patchProduct(base: Product, patch: Partial<Product>): Product {
  return { ...base, ...patch };
}
\`\`\`

空 patch \`{}\`：结果字段与 base 相同，但仍应是**另一份对象**。测试会改 \`result.name\`，再看 \`base.name\` 还在不在。

> ✅ **做 \`patchProduct\`**：\`return { ...base, ...patch }\`。测试会查「只改 stock 其它还在」、原对象 stock 不变、空 patch、一次改两个字段。

---`,
    ["patchProduct"],
  ),
  sec(
    "sec-4.4",
    "§4.4 `Pick` 做目录卡片（对应：`catalogCard`）🟡",
    "4.4",
    `目录页卡片给访客看：名称 + 价格。库存和 SKU 是后台的事，漏出去不好看，也不安全。

### \`Pick<T, K>\`：只留列出的键 🟡

\`\`\`ts
type CatalogCard = Pick<Product, "name" | "price">;
// 等价于 { name: string; price: number }
\`\`\`

Java 你会另写一个 \`ProductCardDTO\`。TS 用工具类型从现有 Product **切一刀**，不必维护第二套字段列表（改 name 类型时卡片跟着变）。

### Python

\`\`\`python
def catalog_card(p: dict) -> dict:
    return {"name": p["name"], "price": p["price"]}
\`\`\`

类型上 TypedDict / Pick 要自己造；运行时一样是新 dict。

### 真实场景

\`\`\`ts
function catalogCard(p: Product): Pick<Product, "name" | "price"> {
  return { name: p.name, price: p.price };
}

catalogCard(PRODUCTS[0]);   // { name: "机械键盘", price: 599 }
catalogCard(PRODUCTS[4]);   // { name: "设计模式", price: 75.5 }
\`\`\`

### ❌ / ✅：\`return p\` 是本章最阴的坑 🔴

结构类型下，**已经存在的变量**赋给「更窄的形状」往往能过：Product 有 name 和 price，多出来的 id/stock 在赋值时常常被忽略。

\`\`\`ts
// ❌ 类型经常是绿的，运行时对象仍有 6 个键
function catalogCard(p: Product): Pick<Product, "name" | "price"> {
  return p;
}

// ✅ 自己造只有两键的新对象（测试用 toEqual 精确比对）
function catalogCard(p: Product): Pick<Product, "name" | "price"> {
  return { name: p.name, price: p.price };
}
\`\`\`

Pick 蒸发后，运行时没有人帮你删字段。**类型说「我只要这两键」，值该你自己造。**

> ✅ **做 \`catalogCard\`**：返回 \`{ name, price }\`。测试会查键的个数 === 2，专治 \`return p\`。

---`,
    ["catalogCard"],
  ),
  sec(
    "sec-4.5",
    "§4.5 `Omit` 去掉库存（对应：`withoutStock`）🟡",
    "4.5",
    `公开 API / 广告素材不需要库存。不是把 \`stock: 0\` 发出去（智能水杯本来就是 0，发出去还是泄漏了「我们有这个字段」），而是**结果对象上没有 stock 这个键**。

### \`Omit<T, K>\`：删掉列出的键，其余保留 🟡

\`\`\`ts
type PublicProduct = Omit<Product, "stock">;
// { id, name, category, price, sku } —— 没有 stock
\`\`\`

和 Pick **相反**：Pick 白名单，Omit 黑名单。字段多的时候 Omit 更省事。

### ❌ / ✅

\`\`\`ts
// ❌ 还留着键，只是值改成 0 —— 智能水杯测例会挂（键还在）
function withoutStock(p: Product): Omit<Product, "stock"> {
  return { ...p, stock: 0 } as Omit<Product, "stock">;
}

// ❌ delete p.stock 改了原对象
function withoutStock(p: Product): Omit<Product, "stock"> {
  delete (p as { stock?: number }).stock;
  return p;
}

// ✅ 解构丢掉 stock；或手抄五个字段
function withoutStock(p: Product): Omit<Product, "stock"> {
  const { stock, ...rest } = p;
  return rest;
}
\`\`\`

\`const { stock, ...rest } = p\`：拿出 stock 丢掉，剩下的放进 rest。解构的系统讲法在 **Ch05**；本题够用这一行。

### 真实场景

\`\`\`ts
withoutStock(PRODUCTS[0]);
// { id: 1, name: "机械键盘", category: "电脑外设", price: 599, sku: "KB-001" }

withoutStock(PRODUCTS[8]);
// 智能水杯：原 stock 就是 0，结果里仍然不能出现 stock 键
\`\`\`

> ✅ **做 \`withoutStock\`**：新对象、无 stock 键、其它字段原样。测试会 \`toEqual\` 精确比对，并检查原对象的 stock 还在。

---`,
    ["withoutStock"],
  ),
  sec(
    "sec-4.6",
    "§4.6 `Record` 按 SKU 建索引（对应：`indexBySku`）🟡",
    "4.6",
    `仓储要用 SKU 当主键：给 \`CP-009\` 立刻拿到智能水杯，不要每次 \`find\`。

### \`Record<K, V>\`：键值都写进类型 🟡

\`\`\`ts
type SkuIndex = Record<string, Product>;
// 意思接近 { [sku: string]: Product }
\`\`\`

| | Java | Python | TypeScript |
|---|---|---|---|
| 类型 | \`Map<String, Product>\` | \`dict[str, Product]\` | **\`Record<string, Product>\`** |
| 运行时 | \`HashMap\` 对象 | \`dict\` | **普通 \`{}\`，不是 \`Map\`** |

Ch01 讲过：类型蒸发。\`Record\` 不会在运行时变成 Java Map。你就建一个对象，\`out[p.sku] = p\`。

\`\`\`ts
function indexBySku(products: Product[]): Record<string, Product> {
  const out: Record<string, Product> = {};
  for (const p of products) {
    out[p.sku] = p;
  }
  return out;
}

indexBySku(PRODUCTS)["CP-009"].name;   // "智能水杯"
indexBySku(PRODUCTS)["KB-001"].name;   // "机械键盘"
indexBySku([]);                        // {}
\`\`\`

### last-wins（后写入覆盖）

导入两份清单都有 \`KB-001\`，后面那份为准——循环里后赋值自然覆盖。不要为「重复」抛错（本题不考抛错，测试器也没有 \`toThrow\`）。

### ❌ / ✅

\`\`\`ts
// ❌ 用了 Map，测试期望普通对象上的 ["CP-009"]
function indexBySku(products: Product[]) {
  return new Map(products.map((p) => [p.sku, p]));
}

// ❌ 空列表返回 null
function indexBySku(products: Product[]) {
  if (products.length === 0) return null;
  ...
}

// ❌ 用 name 当键
out[p.name] = p;

// ✅ 对象 + sku 当键 + 后者覆盖
\`\`\`

> ✅ **做 \`indexBySku\`**：\`{}\` 累加。测试会查 \`CP-009\` 整件商品、10 个键、空对象、重复 sku 的名字是「新键盘」。

---`,
    ["indexBySku"],
  ),
  sec(
    "sec-4.7",
    "§4.7 综合：按类目分桶（对应：`groupByCategory`）🟡",
    "4.7",
    `类目页要把 10 件商品分成「电脑外设 / 图书 / 影音设备 / 生活用品」。桶内顺序 = 原列表顺序（先出现的在前）。

这题把前面的拼起来：

- §4.6 的 \`Record<string, …>\` 当字典
- 值从单个 Product 换成 \`Product[]\`
- §4.2 的取值：\`pluck(p, "category")\` 或 \`p.category\`
- 空列表同样返回 \`{}\`，不是 null

对标 Java \`Collectors.groupingBy\`、Python \`defaultdict(list)\`。TS 没有内置 groupingBy，自己 \`push\`。

\`\`\`ts
function groupByCategory(products: Product[]): Record<string, Product[]> {
  const out: Record<string, Product[]> = {};
  for (const p of products) {
    const cat = pluck(p, "category");   // 或 p.category
    if (!out[cat]) out[cat] = [];
    out[cat].push(p);
  }
  return out;
}
\`\`\`

全量 mock 手算过：

| 类目 | 件数 | 顺序（sku） |
|------|------|-------------|
| 电脑外设 | 4 | KB-001, MS-002, MN-003, DK-008 |
| 图书 | 2 | BK-004（Python 书）, BK-005（设计模式） |
| 影音设备 | 2 | HP-006, SP-007 |
| 生活用品 | 2 | **CP-009 智能水杯**, CH-010 |

### ❌ / ✅

\`\`\`ts
// ❌ sort 了，原顺序没了
out[cat].sort((a, b) => a.name.localeCompare(b.name));

// ❌ products.sort(...) 改了入参
products.sort((a, b) => a.category.localeCompare(b.category));

// ❌ 每类只留一件（写成了 indexByCategory）
out[p.category] = p;

// ✅ 没有桶就 []，再 push；不改传入数组
\`\`\`

> ⚠️ 若用 \`pluck\`，请先把 §4.2 写绿。也可以直接 \`p.category\`。
>
> ✅ **做 \`groupByCategory\`**：Record 累加 + push。测试会查图书 2 件的精确数组、电脑外设 4 件顺序、生活用品第一件是 CP-009、空对象、入参数组顺序不被改。

---`,
    ["groupByCategory"],
  ),
  sec(
    "sec-extra",
    "§4.8 延伸阅读：条件类型（不考）",
    "4.8",
    `你可能在 \`lib.es5.d.ts\` 里瞥到 \`T extends U ? X : Y\`。这是**条件类型**：看 T 能不能赋给 U，再选 X 或 Y。

\`\`\`ts
type NonNull<T> = T extends null ? never : T;
// NonNull<string | null> 能拆成更干净的 string（原理比这句复杂，知道有这语法即可）
\`\`\`

**本章不考。** 作业里不要写条件类型。更不要写 \`infer\`、不要写递归条件类型——那是进阶体操，本课大纲明确不做。

四个工具类型（Partial / Pick / Omit / Record）够你做完商品补丁和索引。它们内部其实用了映射类型 / 条件类型实现，你**当现成函数用**就行，不必会实现它们。

---`,
    [],
  ),
  sec(
    "sec-pits",
    "§4.9 Java / Python 老手几个坑 ⚠️",
    "4.9",
    `1. **T 会蒸发**，和 Ch01 的 \`: number\` 同一条。测试绿 ≠ 类型写对；类型对 ≠ 字段真的被删掉。
2. **不要为了过编译写 \`as Product\` / \`as any\` 硬转**，\`return p as Pick<...>\` 挡不住测试。
3. **Java \`List<Dog>\` 不变性**不要原样搬过来纠结；本章 T 靠推断，作业用不到协变/逆变。
4. **\`Partial\` 不是 \`Optional\`**，也不是 \`Product | null\`。
5. **补丁禁止改 base**。\`{ ...base, ...patch }\`。
6. **\`Record\` 不是 \`Map\`**。空索引是 \`{}\`。
7. **Omit 是删键**，不是把值改成 0。
8. **条件类型 / \`infer\` / 递归**——看到当没看到，本章不考。

---`,
    [],
  ),
  sec(
    "sec-homework",
    "📝 本章作业",
    null,
    `上面 7 个函数按节交错出现。每个注释里有【场景】【转换点】、示例和提示。

**完成方式**：在编辑器里改 \`throw new Error("TODO")\`，点「▶ 运行测试」。全绿 = 这题过了。

卡住就回对应 §：\`firstOf\` → §4.1，\`pluck\` → §4.2，\`patchProduct\` → §4.3，\`catalogCard\` → §4.4，\`withoutStock\` → §4.5，\`indexBySku\` → §4.6，\`groupByCategory\` → §4.7。

---`,
    [],
  ),
  sec(
    "sec-check",
    "✅ 自测：你真的掌握了吗？",
    null,
    `- [ ] 能写 \`function firstOf<T>\`，并说清 T 从参数推断、运行时蒸发
- [ ] 能对照 Java 擦除/不变性和 Python TypeVar 各说一句
- [ ] 能写 \`K extends keyof T\` 的 \`pluck\`
- [ ] 知道 Partial / Pick / Omit / Record 是编译期工具，测试只测行为
- [ ] 补丁返回新对象，不改 base
- [ ] \`catalogCard\` 造两键对象，不 \`return p\`
- [ ] \`indexBySku\` / \`groupByCategory\` 用普通对象当字典，空列表 \`{}\`
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

1. 「Partial / Pick 在运行时根本不存在，那作业测试怎么知道我用没用它们？类型和测试各拦什么？」— 卡壳重读世界地图 + §4.3 + §4.4
2. 「Java 泛型擦除和 TS 类型蒸发像在哪、不像在哪？\`List<Dog>\` 不能当 \`List<Animal>\` 跟 \`firstOf\` 有什么关系？」— 卡壳重读世界地图 + §4.1
3. 「为什么 \`patchProduct\` 必须 \`{ ...base, ...patch }\`，而 \`catalogCard\` 必须自己造对象不能 \`return p\`？」— 卡壳重读 §4.3 + §4.4

---`,
    [],
  ),
  sec(
    "sec-next",
    "⏭️ 下一步",
    null,
    `Ch04 掌握后，进 **Ch05 · 函数、模块、this、解构**。你会正式学 ESM \`import/export\`、解构与 rest（本章 \`withoutStock\` 偷用过一行）、箭头函数词法 \`this\`（Java 老手会栽）。作业仍然只用 named export。`,
    [],
  ),
];

const tutorialMd = `# Ch04 · 泛型与工具类型

${sections
  .map((s) => (s.heading ? `## ${s.heading}\n\n${s.body}` : s.body))
  .join("\n\n")}
`;

const chapter = {
  id: "ch04",
  num: "04",
  title: "泛型与工具类型",
  runMode: "browser",
  tutorialMd,
  assignment,
  testName: "ch04_assignment",
  testSource,
  reviewMd,
  interleaved: true,
  sections,
  functions,
  preamble,
};

const out = join(dirname(fileURLToPath(import.meta.url)), "../src/content/chapters/ch04.json");
mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, JSON.stringify(chapter, null, 2) + "\n");
console.log("wrote", out);
