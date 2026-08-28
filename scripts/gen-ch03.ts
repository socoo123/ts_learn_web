/**
 * 生成 src/content/chapters/ch03.json
 * 运行：bun scripts/gen-ch03.ts
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const preamble = `/**
 * Ch03 作业：库存查询结果处理。
 *
 * 场景：电商后台查一件商品，结果只有三种——查到且有货、查到但缺货、根本没有这个 SKU。
 * 7 个函数，从 \`number | null\` 一路写到判别联合数组汇总。
 * Agent 调工具拿到的结果，几乎全是这种「成功 | 失败」联合。
 *
 * 约定：商品对象形如
 *   { id: 1, name: "机械键盘", category: "电脑外设",
 *     price: 599, stock: 120, sku: "KB-001" }
 * 下面的 StockResult 是本章主类型：靠 type 字段区分三种结果。
 *
 * 全绿 = 你掌握了 Ch03。
 */

type StockResult =
  | { type: "ok"; product: { name: string; stock: number } }
  | { type: "out"; sku: string }
  | { type: "missing"; sku: string };`;

const functions = [
  {
    name: "formatOptionalPrice",
    testSuite: "formatOptionalPrice",
    skeleton: `/**
 * 【场景】商品详情页：有的 SKU 还没定好价（运营填了 null），有的是正式售价。
 * 0 元赠品也是合法价格，必须显示 ¥0.00，不能当成「没定价」。
 *
 * 【转换点】联合类型 number | null + strictNullChecks。
 * Java 用 Optional<Double> / null；Python 用 float | None；
 * TS 必须把 null 写进类型，否则 tsc 直接红线。
 *
 * 任务：null → "定价待定"；有数字 → "¥" + 两位小数（toFixed(2)）。
 * 示例：
 *   formatOptionalPrice(599)    -> "¥599.00"
 *   formatOptionalPrice(75.5)   -> "¥75.50"
 *   formatOptionalPrice(0)      -> "¥0.00"     // 0 元不是没定价
 *   formatOptionalPrice(null)   -> "定价待定"
 *
 * 提示：用 price === null 判断，不要 if (!price)——0 是 falsy。
 */
export function formatOptionalPrice(price: number | null): string {
  throw new Error("TODO");
}`,
  },
  {
    name: "statusLabel",
    testSuite: "statusLabel",
    skeleton: `/**
 * 【场景】库存徽标：后台只允许两种状态，页面上要显示中文。
 *
 * 【转换点】字面量联合 "in_stock" | "out"。
 * 比 status: string 窄得多：传 "IN_STOCK" / "缺货" tsc 会挡。
 * 对标 Java enum、Python Literal["in_stock", "out"]。
 *
 * 任务：
 *   "in_stock" -> "有货"
 *   "out"      -> "缺货"
 * 示例：
 *   statusLabel("in_stock")  -> "有货"
 *   statusLabel("out")       -> "缺货"
 *
 * 提示：status === "in_stock" ? "有货" : "缺货"。类型已经保证没有第三种。
 */
export function statusLabel(status: "in_stock" | "out"): string {
  throw new Error("TODO");
}`,
  },
  {
    name: "narrowId",
    testSuite: "narrowId",
    skeleton: `/**
 * 【场景】订单中心：商品标识有时是数字主键（1），有时是 SKU 字符串（"KB-001"）。
 * 展示时数字要加 # 前缀；已经是 SKU 的原样返回。
 *
 * 【转换点】typeof 收窄。联合 string | number 在 if (typeof id === "number")
 * 之后，TS 知道这一支只剩 number，另一支只剩 string。
 *
 * 任务：number → "#" + id；string → 原样返回。
 * 示例：
 *   narrowId(1)         -> "#1"
 *   narrowId(9)         -> "#9"
 *   narrowId("KB-001")  -> "KB-001"
 *   narrowId(0)         -> "#0"       // 0 也是数字，不要靠 if (id)
 *
 * 提示：if (typeof id === "number") return "#" + id; return id;
 */
export function narrowId(id: string | number): string {
  throw new Error("TODO");
}`,
  },
  {
    name: "readField",
    testSuite: "readField",
    skeleton: `/**
 * 【场景】搜索框：有人按 SKU 搜，有人按商品名搜。入参是二选一的对象。
 *
 * 【转换点】in 收窄。'sku' in obj 之后，TS 把联合收成带 sku 的那一支，
 * 才能点 obj.sku。对标 Python if "sku" in d；Java 没有等价运算符。
 *
 * 任务：有 sku 字段就返回 sku；否则返回 name。
 * 两个字段都在时，优先 sku（SKU 更精确）。
 * 示例：
 *   readField({ sku: "KB-001" })                         -> "KB-001"
 *   readField({ name: "机械键盘" })                       -> "机械键盘"
 *   readField({ sku: "MS-002", name: "无线鼠标" })        -> "MS-002"
 *   readField({ sku: "" })                               -> ""        // 空串也算有字段
 *
 * 提示：if ("sku" in obj) return obj.sku; return obj.name;
 */
export function readField(obj: { sku: string } | { name: string }): string {
  throw new Error("TODO");
}`,
  },
  {
    name: "handleStockResult",
    testSuite: "handleStockResult",
    skeleton: `/**
 * 【场景】库存查询接口的三种结果：成功（带商品）、缺货、找不到。
 * 这就是 Agent 工具返回值的日常形状。
 *
 * 【转换点】判别联合（discriminated union）。三个对象共用字面量字段 type，
 * switch (r.type) 之后每一支只能看见自己的字段。
 * 对标 Java sealed interface + switch、Python match。
 *
 * 任务（中文标签，含 name 或 sku）：
 *   { type: "ok", product }      -> "有货：{name} ×{stock}"
 *   { type: "out", sku }         -> "缺货：{sku}"
 *   { type: "missing", sku }     -> "未找到：{sku}"
 * 示例：
 *   handleStockResult({ type: "ok", product: { name: "机械键盘", stock: 120 } })
 *     -> "有货：机械键盘 ×120"
 *   handleStockResult({ type: "out", sku: "CP-009" })
 *     -> "缺货：CP-009"
 *   handleStockResult({ type: "missing", sku: "XX-999" })
 *     -> "未找到：XX-999"
 *
 * 提示：switch (r.type) { case "ok": ... case "out": ... case "missing": ... }
 *       漏掉一支，tsc 会抱怨函数没有返回值。
 */
export function handleStockResult(r: StockResult): string {
  throw new Error("TODO");
}`,
  },
  {
    name: "priceOrZero",
    testSuite: "priceOrZero",
    skeleton: `/**
 * 【场景】结算：价格可能还没填（null / undefined）。没填当 0 元算；
 * 但 0 元赠品必须仍是 0，不能被默认值顶掉。
 *
 * 【转换点】空值合并 ?? 。0 ?? 1 === 0，但 0 || 1 === 1。
 * 0 是合法价格，|| 会把它当成「没有」。必须用 ??，不要用 ||。
 *
 * 任务：null / undefined → 0；数字（含 0）原样返回。
 * 示例：
 *   priceOrZero(599)        -> 599
 *   priceOrZero(0)          -> 0      // 关键：0 元留下
 *   priceOrZero(null)       -> 0
 *   priceOrZero(undefined)  -> 0
 *
 * 提示：return price ?? 0;
 *       不要写 price || 0——语义碰巧对（因为兜底也是 0），但 §3.6 要的是 ??。
 */
export function priceOrZero(price: number | null | undefined): number {
  throw new Error("TODO");
}`,
  },
  {
    name: "summarizeResults",
    testSuite: "summarizeResults",
    skeleton: `/**
 * 【场景】客服看板：一批库存查询结果，按三种 type 计数。
 * 最后一题复用 §3.5 的判别联合：还是看 r.type，只是从「格式化」变成「汇总」。
 *
 * 【转换点】联合数组综合。空数组三种都是 0。
 *
 * 任务：返回 { ok, out, missing }，值为对应 type 的条数。
 * 示例：
 *   summarizeResults([])  -> { ok: 0, out: 0, missing: 0 }
 *   summarizeResults([
 *     { type: "ok", product: { name: "机械键盘", stock: 120 } },
 *     { type: "out", sku: "CP-009" },
 *     { type: "missing", sku: "XX-999" },
 *     { type: "ok", product: { name: "无线鼠标", stock: 300 } },
 *   ])  -> { ok: 2, out: 1, missing: 1 }
 *
 * 提示：acc = { ok: 0, out: 0, missing: 0 }；循环里 acc[r.type]++。
 *       也可以对每条调用 handleStockResult，再按「有货/缺货/未找到」前缀计数。
 */
export function summarizeResults(
  results: StockResult[],
): { ok: number; out: number; missing: number } {
  throw new Error("TODO");
}`,
  },
];

const assignment = `${preamble}

${functions.map((f) => f.skeleton).join("\n\n")}
`;

const testSource = `describe("formatOptionalPrice", () => {
  it("正式售价两位小数", () => {
    expect(formatOptionalPrice(599)).toBe("¥599.00");
  });
  it("带小数必须补成两位", () => {
    expect(formatOptionalPrice(75.5)).toBe("¥75.50");
  });
  it("0 元赠品显示 ¥0.00，不是待定", () => {
    expect(formatOptionalPrice(0)).toBe("¥0.00");
  });
  it("null 才是定价待定", () => {
    expect(formatOptionalPrice(null)).toBe("定价待定");
  });
  it("全量第一件机械键盘", () => {
    expect(formatOptionalPrice(PRODUCTS[0].price)).toBe("¥599.00");
  });
});

describe("statusLabel", () => {
  it("有货", () => {
    expect(statusLabel("in_stock")).toBe("有货");
  });
  it("缺货", () => {
    expect(statusLabel("out")).toBe("缺货");
  });
  it("两个取值必须不同（专治写死一个中文）", () => {
    expect(statusLabel("in_stock") === statusLabel("out")).toBe(false);
  });
  it("不要原样返回英文状态", () => {
    expect(statusLabel("in_stock")).toBe("有货");
    expect(statusLabel("out")).toBe("缺货");
  });
});

describe("narrowId", () => {
  it("数字主键加 #", () => {
    expect(narrowId(1)).toBe("#1");
  });
  it("另一个数字，拦住写死 #1", () => {
    expect(narrowId(9)).toBe("#9");
  });
  it("SKU 字符串原样返回", () => {
    expect(narrowId("KB-001")).toBe("KB-001");
  });
  it("另一条 SKU，拦住写死 KB-001", () => {
    expect(narrowId("CP-009")).toBe("CP-009");
  });
  it("数字 0 也要 #0（专治 if (id) 把 0 当假）", () => {
    expect(narrowId(0)).toBe("#0");
  });
});

describe("readField", () => {
  it("只有 sku", () => {
    expect(readField({ sku: "KB-001" })).toBe("KB-001");
  });
  it("只有 name", () => {
    expect(readField({ name: "机械键盘" })).toBe("机械键盘");
  });
  it("两个字段都在时优先 sku", () => {
    const both: { sku: string; name: string } = { sku: "MS-002", name: "无线鼠标" };
    expect(readField(both)).toBe("MS-002");
  });
  it("空串 sku 也算有字段", () => {
    expect(readField({ sku: "" })).toBe("");
  });
  it("另一件商品名，拦住写死机械键盘", () => {
    expect(readField({ name: "设计模式" })).toBe("设计模式");
  });
});

describe("handleStockResult", () => {
  it("成功：机械键盘", () => {
    expect(
      handleStockResult({ type: "ok", product: { name: "机械键盘", stock: 120 } }),
    ).toBe("有货：机械键盘 ×120");
  });
  it("成功：另一件，拦住写死机械键盘", () => {
    expect(
      handleStockResult({ type: "ok", product: { name: "无线鼠标", stock: 300 } }),
    ).toBe("有货：无线鼠标 ×300");
  });
  it("缺货带 sku", () => {
    expect(handleStockResult({ type: "out", sku: "CP-009" })).toBe("缺货：CP-009");
  });
  it("找不到带 sku", () => {
    expect(handleStockResult({ type: "missing", sku: "XX-999" })).toBe("未找到：XX-999");
  });
  it("成功但库存为 0（type 是 ok，不是 out）", () => {
    expect(
      handleStockResult({ type: "ok", product: { name: "智能水杯", stock: 0 } }),
    ).toBe("有货：智能水杯 ×0");
  });
  it("另一条缺货 sku，拦住写死 CP-009", () => {
    expect(handleStockResult({ type: "out", sku: "HP-006" })).toBe("缺货：HP-006");
  });
});

describe("priceOrZero", () => {
  it("正价原样", () => {
    expect(priceOrZero(599)).toBe(599);
  });
  it("小数价原样", () => {
    expect(priceOrZero(75.5)).toBe(75.5);
  });
  it("0 元必须留下（?? 不是 ||）", () => {
    expect(priceOrZero(0)).toBe(0);
  });
  it("null 当 0", () => {
    expect(priceOrZero(null)).toBe(0);
  });
  it("undefined 当 0", () => {
    expect(priceOrZero(undefined)).toBe(0);
  });
});

describe("summarizeResults", () => {
  it("空数组三种都是 0", () => {
    expect(summarizeResults([])).toEqual({ ok: 0, out: 0, missing: 0 });
  });
  it("四种结果：2 成功 1 缺货 1 找不到", () => {
    const results = [
      { type: "ok", product: { name: "机械键盘", stock: 120 } },
      { type: "out", sku: "CP-009" },
      { type: "missing", sku: "XX-999" },
      { type: "ok", product: { name: "无线鼠标", stock: 300 } },
    ];
    expect(summarizeResults(results)).toEqual({ ok: 2, out: 1, missing: 1 });
  });
  it("全是缺货", () => {
    expect(
      summarizeResults([
        { type: "out", sku: "A" },
        { type: "out", sku: "B" },
        { type: "out", sku: "C" },
      ]),
    ).toEqual({ ok: 0, out: 3, missing: 0 });
  });
  it("只有找不到", () => {
    expect(summarizeResults([{ type: "missing", sku: "NOPE" }])).toEqual({
      ok: 0,
      out: 0,
      missing: 1,
    });
  });
  it("顺序不影响计数", () => {
    const results = [
      { type: "missing", sku: "X" },
      { type: "ok", product: { name: "设计模式", stock: 200 } },
      { type: "out", sku: "Y" },
    ];
    expect(summarizeResults(results)).toEqual({ ok: 1, out: 1, missing: 1 });
  });
});
`;

const reviewMd = `# Ch03 · 记忆闪卡

> 先回忆，再翻答案。连续 2 次秒答 → 退役。

## 🔖 闪卡

| # | 正面（问题） | 背面（答案） | 掌握 |
|---|---|---|---|
| 1 | \`number \\| null\` 和 Java \`Optional<Double>\`、Python \`float \\| None\` 怎么对应？ | 都是「有数或没有」。TS 开了 strictNullChecks 后必须把 \`null\` 写进类型，否则 \`number\` 不能接 \`null\` | ⬜ |
| 2 | \`strictNullChecks\` 开了会怎样？ | \`null\` / \`undefined\` 不能赋给普通类型；要写 \`T \\| null\`。没开则 \`null\` 到处能传，和 Java 老习惯一样藏 NPE | ⬜ |
| 3 | \`formatOptionalPrice(0)\` 为什么不能返回「定价待定」？ | 0 是合法价格（赠品 / 0 元购）。\`if (!price)\` 把 0 当假。用 \`price === null\` | ⬜ |
| 4 | 为什么库存状态写成 \`"in_stock" \\| "out"\` 而不是 \`string\`？ | 字面量联合：只能传这两个值，传错 tsc 挡。对标 Java enum / Python Literal | ⬜ |
| 5 | \`string \\| number\` 里怎么安全地给数字加 \`#\` 前缀？ | \`if (typeof id === "number")\` 收窄后再用。\`typeof\` 是运行时操作符，同时给 TS 当收窄条件 | ⬜ |
| 6 | \`narrowId(0)\` 为什么必须是 \`"#0"\`？ | 0 的 typeof 是 \`"number"\`。\`if (id)\` 会把 0 当假，走错分支 | ⬜ |
| 7 | 对象是 \`{ sku } \\| { name }\`，怎么安全点字段？ | \`'sku' in obj\`（或 \`'name' in obj\`）。in 之后 TS 收窄到对应那一支 | ⬜ |
| 8 | sku 和 name 都在时 \`readField\` 返回谁？ | 优先 sku（更精确）。先判断 \`'sku' in obj\` | ⬜ |
| 9 | 判别联合靠哪个字段把联合拆开？ | 共用的字面量标签，本章是 \`type: "ok" \\| "out" \\| "missing"\`。\`switch (r.type)\` 后每支只能看见自己的字段 | ⬜ |
| 10 | \`handleStockResult\` 漏写 \`case "missing"\` 会怎样？ | tsc 认为函数有的路没 return（strict）。这就是 exhaustive switch 的好处 | ⬜ |
| 11 | \`0 ?? 1\` 和 \`0 \\|\\| 1\` 各是多少？0 元商品用哪个？ | \`0 ?? 1 === 0\`，\`0 \\|\\| 1 === 1\`。合法的 0 必须用 \`??\`，否则被当成「没有」 | ⬜ |
| 12 | \`??\` 把谁当成「空」？\`\\|\\\|\` 呢？ | \`??\` 只把 \`null\` 和 \`undefined\` 当空。\`\\|\\\|\` 把 0 / "" / false / null / undefined 全当空 | ⬜ |
| 13 | 可选链 \`product?.price\` 干什么？后面常跟什么？ | 左边是 null/undefined 时整段短路成 undefined，不抛错。常写成 \`product?.price ?? 0\` | ⬜ |
| 14 | 判别联合的 \`type\` 字段运行时还在吗？和 Ch01「类型蒸发」冲突吗？ | 不冲突。\`type: "ok"\` 是**值**，会留在 JS 对象里。蒸发的是注解 \`StockResult\`，不是这个字段 | ⬜ |
| 15 | Agent 工具结果为什么几乎都是判别联合？ | 成功和失败形状不同（有 data / 有 message）。用 \`type\` 标签让 TS 在每一支只暴露该有的字段 | ⬜ |

## 🎓 费曼自检

- [ ] 能说清 \`??\` 和 \`\\|\\\|\` 对 0 的差别，以及 0 元商品该用哪个
- [ ] 能说清判别联合的 \`type\` 是运行时的值，不是蒸发掉的注解
- [ ] 能说清 \`typeof\` / \`in\` / 等值三种收窄各用在什么联合上
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
    `> **预计**：1 天 ｜ **前置**：Ch02
> **目标**：① 会写 \`string | null\`、判别联合；② 会用 \`typeof\` / \`in\` / 等值缩小。Agent 工具结果几乎全是这个。
> 你 15 年 Java，Python 课也在前面。联合本身不新鲜；真正要小心的是：**收窄是编译期的事，标签字段是运行时的值，0 不是空。**

> 📐 **本教程的契约**：下面每一节（§3.1–§3.7）都**精确对应**作业里的题。讲过的才考，考的必讲过。卡住时按作业函数名回查对应小节。

---`,
    [],
  ),
  sec(
    "sec-map",
    "🗺️ 本章地图",
    null,
    `本章作业是一条完整主线：**库存查询结果 = 成功 | 缺货 | 找不到**。7 个函数，从「价格可能为空」走到「一批结果按 type 计数」。

读完这章 + 完成作业，你将能够：

- 写出 \`number | null\`，并在 \`strictNullChecks\` 下正确处理空值
- 用字面量联合 \`"in_stock" | "out"\` 代替随手 \`string\`
- 用 \`typeof\` 把 \`string | number\` 收到其中一支
- 用 \`in\` 判断对象联合的哪一种形状
- 写判别联合 \`type: "ok" | "out" | "missing"\`，\`switch\` 穷尽三个分支
- 用 \`??\` 给空值兜底，**留下 0 元**；知道 \`?.\` 可选链
- 对联合数组按标签计数

**作业 ↔ 教程对应表**（学哪节，就去做哪题）：

| 作业题 | 对应小节 | 核心知识点 |
|--------|----------|-----------|
| \`formatOptionalPrice\` | §3.1 | \`number \\| null\` |
| \`statusLabel\` | §3.2 | 字面量联合 \`"in_stock" \\| "out"\` |
| \`narrowId\` | §3.3 | \`string \\| number\` + typeof |
| \`readField\` | §3.4 | \`in\` narrowing |
| \`handleStockResult\` | §3.5 | 判别联合 |
| \`priceOrZero\` | §3.6 | \`??\` vs \`\\|\\\|\`（0 元商品） |
| \`summarizeResults\` | §3.7 | 联合数组综合 |

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
| ④ 费曼（2 分钟） | 大白话讲清「0 为什么不是空、type 为什么还在」 | 本页 ④ |
| ⑤ 存闪卡 | 章末闪卡标复习日期 | 闪卡 |

> 💡 别从头读到尾。先扫 ① → 写作业 → **哪题卡了，回对应 § 查** → 改 → 再跑。
> 最后一题 \`summarizeResults\` 复用 §3.5 的 \`type\` 标签（也可以直接调用 \`handleStockResult\`），建议按顺序做。

---`,
    [],
  ),
  sec(
    "sec-guess",
    "① 预览猜（2 分钟 · 激活你的 Java / Python 直觉）",
    null,
    `先别看答案，凭经验猜一猜（猜错没关系）：

1. Java 里价格可能没有，你写 \`Optional<Double>\`。TS 的参数类型怎么写？传 \`0\` 和传 \`null\` 是一回事吗？
2. 库存状态只有「有货 / 缺货」两种。写成 \`status: string\` 和写成 \`"in_stock" | "out"\`，tsc 对 \`statusLabel("maybe")\` 分别怎样？
3. 商品 id 可能是数字 \`1\` 或字符串 \`"KB-001"\`。你怎么在函数里安全地给数字加 \`#\`，又不把 SKU 改成 \`"#KB-001"\`？
4. 入参要么有 \`sku\` 要么有 \`name\`。Python 写 \`"sku" in d\`。TS 怎么让编辑器允许你点 \`obj.sku\`？
5. 查询结果三种形状（成功带商品、缺货带 sku、找不到带 sku）。Java 17 的 sealed + switch、Python 的 match，TS 靠什么字段把三支拆开？
6. 结算时没填价格当 0；但赠品价格就是 0。\`price || 599\` 会把 0 元商品变成 599 吗？该用 \`||\` 还是 \`??\`？

> 猜完，带着验证心态进入正文。

---`,
    [],
  ),
  sec(
    "sec-contrast",
    "对照地图：联合从哪来 🟡",
    null,
    `联合不是 TS 发明的。你已经在 Java / Python 里用过「这玩意儿可能是 A，也可能是 B」。差别在：**TS 逼你先收窄再碰字段**，而且收窄发生在编译期。

| 概念 | Java | Python | TypeScript |
|---|---|---|---|
| 可空 | \`Optional<T>\` / 裸 null | \`T \\| None\` | **\`T \\| null\`**（\`strictNullChecks\`） |
| 有限取值 | \`enum\` | \`Literal["a", "b"]\` | **字面量联合 \`"a" \\| "b"\`** |
| 按类型分支 | \`instanceof\` / sealed switch | \`match\` + \`isinstance\` | **\`typeof\` / \`in\` / 等值** |
| 多种结果形状 | sealed interface | \`TypedDict\` / dataclass + 标签 | **判别联合 \`type: "ok" \\| "err"\`** |
| 空值兜底 | \`orElse(0)\` | \`x or 0\`（0 会被吃掉） | **\`x ?? 0\`**（0 留下） |

> 🟢 **和 Python 课的衔接**：\`str | None\` 你写过，TS 写法几乎原样搬过来。
> 🟡 差别是 **tsc 真的会挡**：没收窄就 \`.toUpperCase()\`，编辑器红线。
> 和 Java 的衔接：\`Optional\` 是包装类；TS 没有包装，null 就写在联合里。Java 17+ 的 sealed class 最接近本章的判别联合。

### 本课怎么算「会了」

编辑器红线 ≈ 你有没有收窄。点「运行测试」≈ 三种结果、0 元、空数组这些**值**对不对。**测试全绿 = 这题掌握。**

---`,
    [],
  ),
  sec(
    "sec-3.1",
    "§3.1 `number | null`（对应：`formatOptionalPrice`）🔴",
    "3.1",
    `运营有时还没定好价，JSON 里是 \`null\`；定好了就是数字。0 元赠品也是数字 \`0\`。

### Java 对照：Optional 或裸 null

\`\`\`java
Optional<Double> price = Optional.empty();
String label = price.map(p -> String.format("¥%.2f", p)).orElse("定价待定");
\`\`\`

Java 的 \`Double\` 本来就能 null。NPE 是老熟人。\`Optional\` 是后来补的。

### Python（你刚学过）：\`float | None\`

\`\`\`python
def format_optional_price(price: float | None) -> str:
    if price is None:
        return "定价待定"
    return f"¥{price:.2f}"

format_optional_price(599)    # "¥599.00"
format_optional_price(None)   # "定价待定"
format_optional_price(0)      # "¥0.00" —— is None 才算空，0 不是
\`\`\`

### TypeScript：必须写在类型里 🔴

开了 \`strictNullChecks\`（本课默认开）之后，\`number\` **不能**接 \`null\`。要写联合：

\`\`\`ts
function formatOptionalPrice(price: number | null): string {
  if (price === null) return "定价待定";
  return "¥" + price.toFixed(2);
}

formatOptionalPrice(599);    // "¥599.00"
formatOptionalPrice(75.5);   // "¥75.50"
formatOptionalPrice(0);      // "¥0.00"
formatOptionalPrice(null);   // "定价待定"
\`\`\`

\`if (price === null)\` 之后，剩下的 \`price\` 被收窄成 \`number\`，才能调 \`.toFixed\`。这就是 **narrowing（收窄）**：联合被缩小成其中一支。

### ❌ / ✅：0 不是「没定价」

\`\`\`ts
// ❌ JS 把 0 当假——0 元赠品变成「定价待定」
if (!price) return "定价待定";

// ❌ 和 undefined 搅在一起；本题类型是 number | null，用 === null
if (price == null) return "定价待定";  // 本课不靠 == 的怪癖

// ✅ 只有 null 是没定价
if (price === null) return "定价待定";
return "¥" + price.toFixed(2);
\`\`\`

> 🤯 **转换点**：\`T | null\` 读作「T 或 null」。收窄用 **等值** \`===\`。
> 真实场景：机械键盘 599 → \`¥599.00\`；没填价 → \`定价待定\`；活动赠品 0 元 → \`¥0.00\`。
>
> ✅ **做 \`formatOptionalPrice\`**：\`=== null\` 走待定，否则 \`¥\` + \`toFixed(2)\`。

---`,
    ["formatOptionalPrice"],
  ),
  sec(
    "sec-3.2",
    "§3.2 字面量联合（对应：`statusLabel`）🟡",
    "3.2",
    `库存徽标只有两种：有货、缺货。不要写成 \`string\`，否则 \`"IN_STOCK"\`、\`"缺货"\`、\`"maybe"\` 都能传进来。

### Java 对照：enum

\`\`\`java
enum StockStatus { IN_STOCK, OUT }
String statusLabel(StockStatus s) {
    return s == StockStatus.IN_STOCK ? "有货" : "缺货";
}
\`\`\`

### Python：\`Literal\`

\`\`\`python
from typing import Literal
def status_label(status: Literal["in_stock", "out"]) -> str:
    return "有货" if status == "in_stock" else "缺货"
\`\`\`

### TypeScript：字符串字面量的联合 🟡

\`\`\`ts
function statusLabel(status: "in_stock" | "out"): string {
  return status === "in_stock" ? "有货" : "缺货";
}

statusLabel("in_stock");  // "有货"
statusLabel("out");       // "缺货"
statusLabel("maybe");     // ❌ tsc：不能传这个字符串
\`\`\`

\`"in_stock"\` 不是 \`string\`，是**值就是这一句**的类型。两个这样的类型用 \`|\` 拼起来，就是字面量联合。

### ❌ / ✅

\`\`\`ts
// ❌ 太宽，调用方随便传
function statusLabel(status: string): string { ... }

// ❌ 和 Java 常量名混用
statusLabel("IN_STOCK");

// ✅ 类型里写死两个合法值
function statusLabel(status: "in_stock" | "out"): string { ... }
\`\`\`

等值 \`status === "in_stock"\` 也是一种 narrowing：这一支 TS 知道是 \`"in_stock"\`，\`else\` 里只剩 \`"out"\`，不必再写 \`else if\`。

> 真实场景：\`CP-009\` 智能水杯 stock 为 0，徽标走 \`"out"\` → 「缺货」；\`KB-001\` 走 \`"in_stock"\` → 「有货」。
>
> ✅ **做 \`statusLabel\`**：两个分支两个中文。类型已经保证没有第三种。

---`,
    ["statusLabel"],
  ),
  sec(
    "sec-3.3",
    "§3.3 \`typeof\` 收窄（对应：\`narrowId\`）🔴",
    "3.3",
    `订单中心的商品标识不统一：老库用数字主键 \`1\`，新库用 SKU \`"KB-001"\`。展示时数字加 \`#\`，SKU 原样放出。

### Java 对照：重载或 instanceof

\`\`\`java
String narrowId(int id) { return "#" + id; }
String narrowId(String id) { return id; }
\`\`\`

Java 靠**重载**在编译期拆开。一个参数两种类型，得写成两个方法（或 \`Object\` + instanceof）。

### Python：\`isinstance\`

\`\`\`python
def narrow_id(id: str | int) -> str:
    if isinstance(id, int):
        return f"#{id}"
    return id
\`\`\`

### TypeScript：\`typeof\` 既是运行时检查，也是收窄条件 🔴

Ch01 你用 \`typeof\` 看过运行时类型名。本章用它**把联合拆开**：

\`\`\`ts
function narrowId(id: string | number): string {
  if (typeof id === "number") {
    return "#" + id;   // 这一支 id 是 number
  }
  return id;           // 这一支 id 是 string
}

narrowId(1);         // "#1"
narrowId(9);         // "#9"
narrowId("KB-001");  // "KB-001"
narrowId(0);         // "#0"
\`\`\`

\`typeof id === "number"\` 是 JS 运行时的比较，**同时也**是 TS 的 narrowing。这和 Ch01「类型蒸发」不矛盾：蒸发的是注解 \`string | number\`；\`typeof\` 检查的是值。

### ❌ / ✅

\`\`\`ts
// ❌ 没收窄就当 string 用
return id.toUpperCase();   // number 没有 toUpperCase

// ❌ 靠 truthiness：0 是假，会走错支
if (id) return "#" + id;

// ❌ 一律拼 # —— SKU 变成 "#KB-001"
return "#" + id;

// ✅ typeof 收窄
if (typeof id === "number") return "#" + id;
return id;
\`\`\`

> 真实场景：主键 \`1\` 展示 \`#1\`；SKU \`"KB-001"\` 保持 \`"KB-001"\`。数字 \`0\` 也是主键，必须 \`"#0"\`。
>
> ✅ **做 \`narrowId\`**：\`typeof id === "number"\` → \`"#" + id\`，否则原样返回。

---`,
    ["narrowId"],
  ),
  sec(
    "sec-3.4",
    "§3.4 \`in\` 收窄（对应：\`readField\`）🟡",
    "3.4",
    `搜索框两种入参：按 SKU 搜 \`{ sku: "KB-001" }\`，按名字搜 \`{ name: "机械键盘" }\`。形状不同，不是同一个字段。

### Java 对照：两个类型 + instanceof

\`\`\`java
sealed interface Query {}
record SkuQuery(String sku) implements Query {}
record NameQuery(String name) implements Query {}
\`\`\`

没有 \`in\`。你得先建成名义类型，再 \`instanceof\`。

### Python：\`in\` 字典

\`\`\`python
def read_field(obj: dict) -> str:
    if "sku" in obj:
        return obj["sku"]
    return obj["name"]
\`\`\`

### TypeScript：\`in\` 操作符会收窄 🟡

\`\`\`ts
function readField(obj: { sku: string } | { name: string }): string {
  if ("sku" in obj) return obj.sku;  // 这一支有 sku
  return obj.name;                   // 剩下的有 name
}

readField({ sku: "KB-001" });                  // "KB-001"
readField({ name: "机械键盘" });                // "机械键盘"
readField({ sku: "MS-002", name: "无线鼠标" }); // "MS-002" —— 都在时优先 sku
readField({ sku: "" });                        // "" —— 空串也算有这个字段
\`\`\`

\`"sku" in obj\` 问的是**对象上有没有这个键**，不是值是否为空。所以 \`{ sku: "" }\` 仍走 sku 支。

### ❌ / ✅

\`\`\`ts
// ❌ 没收窄就点 sku——name 那一支没有 sku
return obj.sku;

// ❌ 用 obj.sku 是否 truthy 当判断：空串 SKU 会掉进 name
if (obj.sku) return obj.sku;

// ✅ in 看字段在不在
if ("sku" in obj) return obj.sku;
return obj.name;
\`\`\`

两个字段都在时，**先判断 sku**（SKU 更精确）。这是本题约定，测试会查。

> 真实场景：扫码枪送来 \`{ sku: "KB-001" }\`；运营搜索框送来 \`{ name: "机械键盘" }\`。
>
> ✅ **做 \`readField\`**：\`if ("sku" in obj) return obj.sku; return obj.name;\`

---`,
    ["readField"],
  ),
  sec(
    "sec-3.5",
    "§3.5 判别联合（对应：\`handleStockResult\`）🔴",
    "3.5",
    `这是整章主线，也是 Agent 工具结果的日常形状。

库存查询只有三种结果，**字段还不一样**：

- 成功：有 \`product\`（名字 + 库存）
- 缺货：只有 \`sku\`
- 找不到：也只有 \`sku\`，但含义不同

如果写成一个大对象「所有字段可选」，调用方根本不知道哪几个有值。判别联合：三种对象**共用一个字面量标签** \`type\`。

### Java 对照：sealed + switch（Java 17+）

\`\`\`java
sealed interface StockResult {}
record Ok(String name, int stock) implements StockResult {}
record Out(String sku) implements StockResult {}
record Missing(String sku) implements StockResult {}

String handle(StockResult r) {
    return switch (r) {
        case Ok(var name, var stock) -> "有货：" + name + " ×" + stock;
        case Out(var sku) -> "缺货：" + sku;
        case Missing(var sku) -> "未找到：" + sku;
    };
}
\`\`\`

### Python：\`match\` + 标签

\`\`\`python
match r:
    case {"type": "ok", "product": p}:
        return f"有货：{p['name']} ×{p['stock']}"
    case {"type": "out", "sku": sku}:
        return f"缺货：{sku}"
    case {"type": "missing", "sku": sku}:
        return f"未找到：{sku}"
\`\`\`

### TypeScript：\`type\` 字段是**值**，不会蒸发 🔴

\`\`\`ts
type StockResult =
  | { type: "ok"; product: { name: string; stock: number } }
  | { type: "out"; sku: string }
  | { type: "missing"; sku: string };

function handleStockResult(r: StockResult): string {
  switch (r.type) {
    case "ok":
      return \`有货：\${r.product.name} ×\${r.product.stock}\`;
    case "out":
      return \`缺货：\${r.sku}\`;
    case "missing":
      return \`未找到：\${r.sku}\`;
  }
}

handleStockResult({ type: "ok", product: { name: "机械键盘", stock: 120 } });
// "有货：机械键盘 ×120"
handleStockResult({ type: "out", sku: "CP-009" });
// "缺货：CP-009"
handleStockResult({ type: "missing", sku: "XX-999" });
// "未找到：XX-999"
\`\`\`

\`switch (r.type)\` 之后：

- \`"ok"\` 支可以点 \`r.product\`，**没有** \`r.sku\`
- \`"out"\` / \`"missing"\` 支可以点 \`r.sku\`，**没有** \`r.product\`

漏掉 \`case "missing"\`，tsc 认为函数有的路径没 return——这就是穷尽检查。作业 preamble 里已经声明了 \`StockResult\`，直接用。

> 🟡 **和 Ch01 类型蒸发**：注解 \`StockResult\` 编译后没了；但 \`type: "ok"\` 是对象上的**字符串字段**，运行时还在。所以 \`switch (r.type)\` 在 JS 里照样能跑。蒸发的是类型名，不是标签值。

### ❌ / ✅

\`\`\`ts
// ❌ 当普通对象，所有字段可选——成功时 sku 也可能被点到
function handle(r: { type: string; product?: ...; sku?: string }) { ... }

// ❌ 用 if (r.product) 当成功——缺货对象没有 product，碰巧能跑，但缺货/找不到分不开

// ❌ type === "ok" 之后还写 r.product?.name（已经收窄了，不必 ?.）

// ✅ 标签字段 + switch 穷尽
switch (r.type) { case "ok": ... case "out": ... case "missing": ... }
\`\`\`

可选链 \`?.\` 用在「**还没收窄、对象可能是 null**」的时候。判别联合收窄之后，\`r.product\` 一定在，直接点。

\`type: "ok"\` 且 \`stock === 0\` 仍是成功支：「有货：智能水杯 ×0」。缺货是另一条结果 \`type: "out"\`，不要用库存数字去猜 type。

> 真实场景：查 \`KB-001\` → ok + 机械键盘；查 \`CP-009\` → out；查 \`XX-999\` → missing。M5 的 Agent 工具返回值，就是这种 \`ok | err\`。
>
> ✅ **做 \`handleStockResult\`**：\`switch (r.type)\` 三支，中文标签里带上 name 或 sku。

---`,
    ["handleStockResult"],
  ),
  sec(
    "sec-3.6",
    "§3.6 \`??\` vs \`||\`（对应：\`priceOrZero\`）🔴",
    "3.6",
    `结算时：没填价格当 0 元；**填了 0 就是 0 元赠品**，不能被默认值顶掉。这是本章最容易从 Java / Python 抄错的一行。

### 关键事实，先背下来 🔴

\`\`\`ts
0 ?? 1 === 0    // ?? 只把 null / undefined 当空
0 || 1 === 1    // || 把 0 / "" / false / null / undefined 全当空
\`\`\`

### Java 对照：\`orElse\` 不吃 0

\`\`\`java
Optional.of(0.0).orElse(1.0);   // 0.0 —— Optional 里有值就是有值
\`\`\`

### Python：\`or\` 会吃掉 0

\`\`\`python
price = 0
price or 1    # 1  ← 和 JS 的 || 一样，0 是 falsy
\`\`\`

Python 课里 \`x or default\` 对 0 是陷阱。TS 请改用 \`??\`。

### TypeScript：空值合并 \`??\` 🔴

\`\`\`ts
function priceOrZero(price: number | null | undefined): number {
  return price ?? 0;
}

priceOrZero(599);        // 599
priceOrZero(75.5);       // 75.5
priceOrZero(0);          // 0     ← 留下
priceOrZero(null);       // 0
priceOrZero(undefined);  // 0
\`\`\`

\`??\` 的左边只有 \`null\` 或 \`undefined\` 才走右边。\`0\` 不是空。

本题兜底恰好也是 0，所以 \`price || 0\` **碰巧也能绿**。不要被它骗：语义是错的。下一行 \`price || 599\` 就会把赠品卖成 599。作业要求你写 \`??\`，测试会查 \`0\`、\`null\`、\`undefined\`、正价。

### 可选链 \`?.\` 🟡

对象可能不存在时，先短路，再 \`??\`：

\`\`\`ts
const product = PRODUCTS.find((p) => p.sku === "NOPE"); // undefined
const price = product?.price ?? 0;   // 0，不抛错
\`\`\`

\`product?.price\`：\`product\` 是 \`null\` / \`undefined\` 时，整段是 \`undefined\`，不会去读 \`.price\`。

对标 Java \`Optional.ofNullable(product).map(p -> p.price).orElse(0)\`。
Python 没有 \`?.\`，得写 \`product.price if product is not None else 0\`。

### ❌ / ✅

\`\`\`ts
// ❌ 0 元商品变成兜底价
return price || 599;

// ❌ 和「没填」搅在一起（本题类型含 0）
if (!price) return 0;

// ✅ 只替换 null / undefined
return price ?? 0;

// ✅ 对象可能缺席：可选链 + 空值合并
return product?.price ?? 0;
\`\`\`

本课**不用** \`== null\` 去同时打 null 和 undefined——那是 JS 的宽松比较。有 \`null | undefined\` 就用 \`??\`。

> 真实场景：赠品定价 0 → 结算金额 0；运营还没填 \`null\` → 也当 0；\`CP-009\` 库存是 0 同样是合法数字，不要当「没有库存字段」。
>
> ✅ **做 \`priceOrZero\`**：一行 \`return price ?? 0;\`

---`,
    ["priceOrZero"],
  ),
  sec(
    "sec-3.7",
    "§3.7 联合数组综合（对应：`summarizeResults`）🟢",
    "3.7",
    `客服看板：一批查询结果，要数成功 / 缺货 / 找不到各多少条。最后一题**复用 §3.5 的判别联合**——还是看 \`r.type\`，只是从「格式化一句中文」变成「按标签计数」。

### Java / Python 对照

\`\`\`java
Map<String, Long> counts = results.stream()
    .collect(Collectors.groupingBy(r -> switch (r) {
        case Ok o -> "ok";
        case Out o -> "out";
        case Missing m -> "missing";
    }, Collectors.counting()));
\`\`\`

\`\`\`python
from collections import Counter
Counter(r["type"] for r in results)
\`\`\`

### TypeScript

\`\`\`ts
function summarizeResults(
  results: StockResult[],
): { ok: number; out: number; missing: number } {
  const acc = { ok: 0, out: 0, missing: 0 };
  for (const r of results) {
    acc[r.type]++;
  }
  return acc;
}

summarizeResults([]);  // { ok: 0, out: 0, missing: 0 }

summarizeResults([
  { type: "ok", product: { name: "机械键盘", stock: 120 } },
  { type: "out", sku: "CP-009" },
  { type: "missing", sku: "XX-999" },
  { type: "ok", product: { name: "无线鼠标", stock: 300 } },
]);
// { ok: 2, out: 1, missing: 1 }
\`\`\`

\`r.type\` 的类型是 \`"ok" | "out" | "missing"\`，正好当 \`acc\` 的键。空数组不要返回 \`null\`，三种都是 0。

也可以对每条先调 \`handleStockResult\`，再按「有货 / 缺货 / 未找到」前缀计数——运行器会拼上你已经写过的函数。两种做法测试都认。

> ⚠️ 请先把 \`handleStockResult\` 的三种 \`type\` 写熟再做这题。
>
> ✅ **做 \`summarizeResults\`**：初始 \`{ ok: 0, out: 0, missing: 0 }\`，循环 \`acc[r.type]++\`。

---`,
    ["summarizeResults"],
  ),
  sec(
    "sec-pits",
    "⚠️ Java / Python 老手几个坑",
    null,
    `1. **\`null\` 要写进联合**。开了 \`strictNullChecks\`，\`number\` 接不住 \`null\`。这不是 Python 那种注解建议。
2. **0 不是空**。\`if (!x)\`、\`x || default\`、Python 的 \`x or default\` 都会吃掉 0。价格和库存用 \`===\` / \`??\`。
3. **字面量联合不是 \`string\`**。能写成 \`"in_stock" | "out"\` 就别用 \`string\`。
4. **先收窄再点字段**。\`typeof\` / \`in\` / \`=== type\` 三件套，对应三种联合。
5. **判别联合的 \`type\` 是值**。会留在 JS 里；蒸发的是类型名 \`StockResult\`。
6. **收窄之后不必 \`?.\`**。\`?.\` 给「对象本身可能是 null」用，常跟 \`??\`。
7. **本课不靠 \`== null\`**。有 \`null | undefined\` 就写 \`??\`；只有 \`null\` 就 \`=== null\`。

---`,
    [],
  ),
  sec(
    "sec-homework",
    "📝 本章作业",
    null,
    `上面 7 个函数按节交错出现。每个注释里有【场景】【转换点】、示例和提示。

**完成方式**：在编辑器里改 \`throw new Error("TODO")\`，点「▶ 运行测试」。全绿 = 这题过了。

卡住就回对应 §：\`formatOptionalPrice\` → §3.1，\`handleStockResult\` → §3.5，\`priceOrZero\` → §3.6。

---`,
    [],
  ),
  sec(
    "sec-check",
    "✅ 自测：你真的掌握了吗？",
    null,
    `- [ ] 能写 \`number | null\`，并用 \`=== null\` 收窄（0 留下）
- [ ] 能用字面量联合代替 \`string\` 当状态
- [ ] 能用 \`typeof\` / \`in\` / \`switch (r.type)\` 三种收窄
- [ ] 能解释判别联合的 \`type\` 为什么运行时还在
- [ ] 能说出 \`0 ?? 1 === 0\` 且 \`0 || 1 === 1\`，0 元商品用 \`??\`
- [ ] 知道 \`?.\` 和 \`??\` 经常一起写
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

1. 「\`0 ?? 1\` 为什么是 0，\`0 || 1\` 为什么是 1？0 元商品结算该用哪个？Python 的 \`price or 1\` 踩的是哪个坑？」— 卡壳重读 §3.6
2. 「判别联合的 \`type: "ok"\` 编译之后还在对象上吗？这和 Ch01 说的『类型蒸发』打架吗？」— 卡壳重读 §3.5 + 对照地图
3. 「\`string | number\` 为什么不能直接 \`.toUpperCase()\`？\`typeof\` 收窄到底发生在编译期还是运行时？」— 卡壳重读 §3.3

---`,
    [],
  ),
  sec(
    "sec-next",
    "⏭️ 下一步",
    null,
    `Ch03 掌握后，进 **Ch04 · 泛型与工具类型**。你会写 \`function first<T>\`，并用 \`Partial\` / \`Pick\` / \`Omit\` / \`Record\` 做商品补丁和按类目索引。本章的联合是「这值是 A 或 B」；下一章是「这盒子里装哪种」。`,
    [],
  ),
];

const tutorialMd = `# Ch03 · 联合、字面量、narrowing

${sections
  .map((s) => (s.heading ? `## ${s.heading}\n\n${s.body}` : s.body))
  .join("\n\n")}
`;

const chapter = {
  id: "ch03",
  num: "03",
  title: "联合、字面量、narrowing",
  runMode: "browser",
  tutorialMd,
  assignment,
  testName: "ch03_assignment",
  testSource,
  reviewMd,
  interleaved: true,
  sections,
  functions,
  preamble,
};

const out = join(dirname(fileURLToPath(import.meta.url)), "../src/content/chapters/ch03.json");
mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, JSON.stringify(chapter, null, 2) + "\n");
console.log("wrote", out);
