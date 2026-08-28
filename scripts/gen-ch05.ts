/**
 * 生成 src/content/chapters/ch05.json
 * 运行：bun scripts/gen-ch05.ts
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const preamble = `/**
 * Ch05 作业：把订单行计算拆成模块函数。
 *
 * 场景：促销价、拆 SKU、打标签、打补丁、闭包计数、价格管道、最后拼一条货架标记。
 * 7 个函数，每个砸在一个「函数 / 模块 / this / 解构」转换点上。
 *
 * 约定：本页把多个 export function 拼在一个文件里模拟模块；
 * 真正的多文件 import 在 M4 本地章再跑。作业只用 named export，不要 default。
 *
 * 全绿 = 你掌握了 Ch05。
 */`;

const functions = [
  {
    name: "discountedPrice",
    testSuite: "discountedPrice",
    skeleton: `/**
 * 【场景】促销引擎：原价 × (1 - 折扣率) 得到折后价。
 *
 * 【转换点】箭头函数 + 函数类型 (price: number, rate: number) => number。
 * Java 方法必须挂在类上；TS 里函数是值，可以赋给带这个签名的变量。
 * 作业仍用 export function（本课 named export）；教程里看过箭头写法即可。
 *
 * 任务：返回 price * (1 - rate)。
 * 示例：
 *   discountedPrice(100, 0.1)  -> 90
 *   discountedPrice(599, 0)    -> 599
 *   discountedPrice(0, 0.5)    -> 0
 *
 * 提示：不要写 price || 0 之类——0 元商品是合法原价。
 */
export function discountedPrice(price: number, rate: number): number {
  throw new Error("TODO");
}`,
  },
  {
    name: "splitSku",
    testSuite: "splitSku",
    skeleton: `/**
 * 【场景】仓储：SKU 规则是 "类目前缀-序号"，如 "KB-001"。
 * 拆成命名字段 { prefix, seq }，序号转成 number（去掉前导零）。
 *
 * 【转换点】解构。Ch01 的 parseSku 返回元组 [string, number]；
 * 本题返回对象，调用方按名字取字段，不靠下标。
 *
 * 任务：sku.split("-") 解构出两段，Number 掉序号，返回对象。
 * 示例：
 *   splitSku("KB-001")  -> { prefix: "KB", seq: 1 }
 *   splitSku("MN-003")  -> { prefix: "MN", seq: 3 }
 *   splitSku("MS-002")  -> { prefix: "MS", seq: 2 }
 *
 * 提示：const [prefix, seq] = sku.split("-"); 然后 { prefix, seq: Number(seq) }
 */
export function splitSku(sku: string): { prefix: string; seq: number } {
  throw new Error("TODO");
}`,
  },
  {
    name: "restTags",
    testSuite: "restTags",
    skeleton: `/**
 * 【场景】运营给商品打营销标签：第一个是主标签，后面可以跟任意多个。
 *
 * 【转换点】rest 参数 ...rest: string[]。Java 是 String... tags；
 * Python 是 *rest。少写 ...rest 就接不住第二、第三个标签。
 *
 * 任务：返回 [first, ...rest]（全部标签，主标签在前）。
 * 示例：
 *   restTags("sale")                  -> ["sale"]
 *   restTags("sale", "new", "hot")    -> ["sale", "new", "hot"]
 *   restTags("new", "hot")            -> ["new", "hot"]
 *
 * 提示：return [first, ...rest];  不要只 return [first]。
 */
export function restTags(first: string, ...rest: string[]): string[] {
  throw new Error("TODO");
}`,
  },
  {
    name: "mergeProductPatch",
    testSuite: "mergeProductPatch",
    skeleton: `/**
 * 【场景】商品中心打补丁：base 是当前商品三件套，patch 只带要改的字段
 * （Ch04 的 Partial）。合并出新对象，库存改成 0 也要保留 0。
 *
 * 【转换点】对象 spread。{ ...base, ...patch } 从左到右覆盖。
 * 必须新建对象，禁止改 base（Java 老手容易 base.price = patch.price）。
 *
 * 任务：返回合并后的新对象；不修改入参 base。
 * 示例：
 *   mergeProductPatch({ name: "机械键盘", price: 599, stock: 120 }, { price: 499 })
 *     -> { name: "机械键盘", price: 499, stock: 120 }
 *   mergeProductPatch({ name: "智能水杯", price: 199, stock: 10 }, { stock: 0 })
 *     -> stock 必须是 0
 *   mergeProductPatch(base, {})  -> 字段与 base 相同，但不是同一个引用
 *
 * 提示：return { ...base, ...patch };  不要 Object.assign(base, patch)。
 */
export function mergeProductPatch(
  base: { name: string; price: number; stock: number },
  patch: Partial<{ name: string; price: number; stock: number }>,
): { name: string; price: number; stock: number } {
  throw new Error("TODO");
}`,
  },
  {
    name: "bindCounter",
    testSuite: "bindCounter",
    skeleton: `/**
 * 【场景】进货扫描：每扫一件，计数 +1 并返回新值。要能同时开两台扫描枪，
 * 互不干扰。本题禁止 DOM、禁止靠对象方法的 this。
 *
 * 【转换点】this / 箭头 / 闭包。Java 实例方法抽出 this 还在；
 * JS 普通方法抽成回调会丢 this。作业用闭包包住 n，返回 () => number。
 *
 * 任务：返回一个函数；每调用一次，内部计数 +1 并返回新值。
 * 示例：
 *   const n = bindCounter(0); n() -> 1; n() -> 2
 *   const m = bindCounter(5); m() -> 6
 *   两个计数器互不影响
 *
 * 提示：let n = start; return () => ++n;
 */
export function bindCounter(start: number): () => number {
  throw new Error("TODO");
}`,
  },
  {
    name: "pipePrice",
    testSuite: "pipePrice",
    skeleton: `/**
 * 【场景】价格管道：先减满减、再乘倍率、再打折……函数从左到右依次作用在价格上。
 *
 * 【转换点】函数当值传递。fns 的类型是 Array<(n: number) => number>。
 * 空数组表示「什么都不做」，原价返回。
 *
 * 任务：从左到右把每个 fn 应用到当前价格，返回最终值。
 * 示例：
 *   pipePrice(100, [(x) => x - 10, (x) => x * 2])  -> 180
 *   pipePrice(100, [(x) => x * 2, (x) => x - 10])  -> 190
 *   pipePrice(50, [])                               -> 50
 *
 * 提示：fns.reduce((acc, fn) => fn(acc), price)
 */
export function pipePrice(price: number, fns: Array<(n: number) => number>): number {
  throw new Error("TODO");
}`,
  },
  {
    name: "exportMarker",
    testSuite: "exportMarker",
    skeleton: `/**
 * 【场景】货架标记：SKU 前缀 + 折后价 + 标签列表，一条字符串打出去。
 *
 * 【转换点】再导出组合。必须调用前面的 splitSku、discountedPrice、restTags
 * （无标签时标签列表为空数组，写成 []）。本页不能真的拆文件，用函数调用模拟模块拼装。
 *
 * 任务：格式 "前缀 ¥折后价 [标签逗号拼接]"，价格 toFixed(2)。
 * 示例：
 *   exportMarker("KB-001", 599, 0.1, "sale", "new")  -> "KB ¥539.10 [sale,new]"
 *   exportMarker("MS-002", 159, 0, "hot")            -> "MS ¥159.00 [hot]"
 *   exportMarker("BK-005", 75.5, 0.2)                -> "BK ¥60.40 []"
 *
 * 提示：
 *   const { prefix } = splitSku(sku);
 *   const p = discountedPrice(price, rate);
 *   const tagList = tags.length === 0 ? [] : restTags(tags[0], ...tags.slice(1));
 *   return \`\${prefix} ¥\${p.toFixed(2)} [\${tagList.join(",")}]\`;
 */
export function exportMarker(
  sku: string,
  price: number,
  rate: number,
  ...tags: string[]
): string {
  throw new Error("TODO");
}`,
  },
];

const assignment = `${preamble}

${functions.map((f) => f.skeleton).join("\n\n")}
`;

const testSource = `describe("discountedPrice", () => {
  it("100 打九折", () => {
    expect(discountedPrice(100, 0.1)).toBe(90);
  });
  it("折扣率为 0 原价返回", () => {
    expect(discountedPrice(599, 0)).toBe(599);
  });
  it("原价 0 不能被 || 吃掉", () => {
    expect(discountedPrice(0, 0.5)).toBe(0);
  });
  it("键盘 599 打九折（防硬编码 90）", () => {
    expect(discountedPrice(599, 0.1)).toBe(539.1);
  });
  it("整数价打七五折（防硬编码 539.1）", () => {
    expect(discountedPrice(80, 0.25)).toBe(60);
  });
});

describe("splitSku", () => {
  it("键盘 SKU 拆成对象", () => {
    expect(splitSku("KB-001")).toEqual({ prefix: "KB", seq: 1 });
  });
  it("鼠标 SKU", () => {
    expect(splitSku("MS-002")).toEqual({ prefix: "MS", seq: 2 });
  });
  it("前导零必须去掉", () => {
    expect(splitSku("MN-003")).toEqual({ prefix: "MN", seq: 3 });
  });
  it("全量第一个商品", () => {
    expect(splitSku(PRODUCTS[0].sku)).toEqual({ prefix: "KB", seq: 1 });
  });
  it("返回对象不是数组（对比 Ch01 元组）", () => {
    expect(Array.isArray(splitSku("KB-001"))).toBe(false);
  });
});

describe("restTags", () => {
  it("只有主标签", () => {
    expect(restTags("sale")).toEqual(["sale"]);
  });
  it("主标签 + 两个附加（专治忽略 rest）", () => {
    expect(restTags("sale", "new", "hot")).toEqual(["sale", "new", "hot"]);
  });
  it("两个标签，顺序保持", () => {
    expect(restTags("new", "hot")).toEqual(["new", "hot"]);
  });
  it("四个标签，防硬编码长度 3", () => {
    expect(restTags("a", "b", "c", "d")).toEqual(["a", "b", "c", "d"]);
  });
});

describe("mergeProductPatch", () => {
  it("只改价格，其它字段保留", () => {
    expect(
      mergeProductPatch({ name: "机械键盘", price: 599, stock: 120 }, { price: 499 }),
    ).toEqual({ name: "机械键盘", price: 499, stock: 120 });
  });
  it("只改名字", () => {
    expect(
      mergeProductPatch({ name: "无线鼠标", price: 159, stock: 300 }, { name: "静音鼠标" }),
    ).toEqual({ name: "静音鼠标", price: 159, stock: 300 });
  });
  it("stock 打成 0 必须留下 0", () => {
    expect(
      mergeProductPatch({ name: "智能水杯", price: 199, stock: 10 }, { stock: 0 }),
    ).toEqual({ name: "智能水杯", price: 199, stock: 0 });
  });
  it("空补丁字段相同但不是同一引用", () => {
    const base = { name: "设计模式", price: 75.5, stock: 200 };
    const out = mergeProductPatch(base, {});
    expect(out).toEqual({ name: "设计模式", price: 75.5, stock: 200 });
    expect(out === base).toBe(false);
  });
  it("不修改入参 base（专治 Object.assign / 直接改字段）", () => {
    const base = { name: "机械键盘", price: 599, stock: 120 };
    mergeProductPatch(base, { price: 1, stock: 0 });
    expect(base).toEqual({ name: "机械键盘", price: 599, stock: 120 });
  });
  it("一次补丁两个字段", () => {
    expect(
      mergeProductPatch(
        { name: "降噪耳机", price: 1299, stock: 80 },
        { price: 999, stock: 50 },
      ),
    ).toEqual({ name: "降噪耳机", price: 999, stock: 50 });
  });
});

describe("bindCounter", () => {
  it("从 0 开始，连续两次", () => {
    const n = bindCounter(0);
    expect(n()).toBe(1);
    expect(n()).toBe(2);
  });
  it("从 5 开始（防硬编码 1、2）", () => {
    const n = bindCounter(5);
    expect(n()).toBe(6);
    expect(n()).toBe(7);
  });
  it("两个计数器互不共享状态", () => {
    const a = bindCounter(0);
    const b = bindCounter(0);
    expect(a()).toBe(1);
    expect(b()).toBe(1);
    expect(a()).toBe(2);
    expect(b()).toBe(2);
  });
  it("返回的是函数", () => {
    expect(bindCounter(0)).toBeInstanceOf(Function);
  });
  it("从 -1 起跳，边界", () => {
    const n = bindCounter(-1);
    expect(n()).toBe(0);
    expect(n()).toBe(1);
  });
});

describe("pipePrice", () => {
  it("先减 10 再乘 2", () => {
    expect(pipePrice(100, [(x) => x - 10, (x) => x * 2])).toBe(180);
  });
  it("先乘 2 再减 10（专治从右往左）", () => {
    expect(pipePrice(100, [(x) => x * 2, (x) => x - 10])).toBe(190);
  });
  it("空管道返回原价", () => {
    expect(pipePrice(50, [])).toBe(50);
  });
  it("单个函数", () => {
    expect(pipePrice(10, [(x) => x + 5])).toBe(15);
  });
  it("三个函数手工验算", () => {
    expect(pipePrice(100, [(x) => x + 5, (x) => x * 2, (x) => x - 10])).toBe(200);
  });
  it("原价 0 经空管道仍是 0", () => {
    expect(pipePrice(0, [])).toBe(0);
  });
});

describe("exportMarker", () => {
  it("键盘九折两个标签", () => {
    expect(exportMarker("KB-001", 599, 0.1, "sale", "new")).toBe("KB ¥539.10 [sale,new]");
  });
  it("鼠标零折扣一个标签", () => {
    expect(exportMarker("MS-002", 159, 0, "hot")).toBe("MS ¥159.00 [hot]");
  });
  it("无标签时空方括号", () => {
    expect(exportMarker("BK-005", 75.5, 0.2)).toBe("BK ¥60.40 []");
  });
  it("显示器九折（防硬编码 KB / 539.10）", () => {
    expect(exportMarker("MN-003", 2199, 0.1, "4k")).toBe("MN ¥1979.10 [4k]");
  });
  it("零折扣无标签", () => {
    expect(exportMarker("KB-001", 599, 0)).toBe("KB ¥599.00 []");
  });
});
`;

const reviewMd = `# Ch05 · 记忆闪卡

> 先回忆，再翻答案。连续 2 次秒答 → 退役。

## 🔖 闪卡

| # | 正面（问题） | 背面（答案） | 掌握 |
|---|---|---|---|
| 1 | 作业该用 named export 还是 default export？本页能真的拆成多文件 import 吗？ | 作业只用 \`export function\`（named）。本页把多个函数拼在一个文件里模拟模块，\`import\` 会被运行器剥掉；真多文件在 M4 | ⬜ |
| 2 | \`export default function f()\` 和 \`export function f()\` 引入时差在哪？ | default：\`import f from "./m"\`（名字可另起）。named：\`import { f } from "./m"\`（名字要对上，可用 \`as\`） | ⬜ |
| 3 | 函数类型 \`(price: number, rate: number) => number\` 写在哪？和 \`function\` 声明差在哪？ | 这是**值的类型**，用来标注变量 / 参数 / 数组元素。\`function foo(): number\` 是声明自己的签名 | ⬜ |
| 4 | TS 的 \`void\` 和 Java \`void\` 一样吗？ | 接近「调用方不使用返回值」。Java 方法不能有 return 值；TS 把返回值标 \`void\` 时，实现里仍可能 return，调用方应忽略 | ⬜ |
| 5 | Ch01 \`parseSku\` 返回元组，本题 \`splitSku\` 为什么改成对象？ | 元组靠下标；对象解构按**名字**取 \`prefix\` / \`seq\`，调用处更稳 | ⬜ |
| 6 | \`function restTags(first, ...rest)\` 只传 \`"sale"\` 时 \`rest\` 是什么？ | 空数组 \`[]\`。返回 \`[first, ...rest]\` 即 \`["sale"]\`。漏写 \`...rest\` 就接不住后面的标签 | ⬜ |
| 7 | \`{ ...base, ...patch }\` 会改 base 吗？\`patch\` 里 \`stock: 0\` 会丢掉吗？ | 展开得到**新对象**，base 不动。后写的覆盖先写的，\`0\` 是合法值，不会被丢掉（那是 \`\\|\\|\` 的坑） | ⬜ |
| 8 | Java 里把 \`obj.inc\` 抽成方法引用，\`this\` 还在吗？JS 普通方法呢？ | Java 还在（绑着实例）。JS 普通方法 \`const f = obj.inc; f()\` 会丢 \`this\`（严格模式是 \`undefined\`） | ⬜ |
| 9 | 箭头函数的 \`this\` 从哪来？作业 \`bindCounter\` 为什么可以不写 \`this\`？ | 箭头**词法**捕获外层 \`this\`，自己没有。作业用闭包包 \`let n\`，返回 \`() => ++n\`，根本不靠 \`this\` | ⬜ |
| 10 | \`bindCounter(0)\` 调两次得到两个函数，内部的 \`n\` 会共享吗？ | 不会。每次调用 \`bindCounter\` 新建一个闭包。共享 = 你把 \`n\` 提到了模块顶层 | ⬜ |
| 11 | \`pipePrice(100, [f, g])\` 先算谁？空数组呢？ | 从左到右：\`g(f(100))\`。空数组返回原价 | ⬜ |
| 12 | \`export { discountedPrice } from "./price"\` 是在干什么？ | 再导出：自己不实现，把别的模块的 named export 转发出去。本章作业用「调用前面的函数」模拟拼装 | ⬜ |

## 🎓 费曼自检

- [ ] 能说清 named / default 怎么 import，以及本页为什么不能真拆文件
- [ ] 能说清「Java 抽出方法 this 还在，JS 普通方法会丢，箭头 / 闭包不靠 this」
- [ ] 能说清 spread 不 mutate、\`0\` 不会被 \`\\|\\|\` 吃掉
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
    `> **预计**：1 天 ｜ **前置**：Ch04
> **目标**：① ESM \`import\` / \`export\`（作业只用 named export）；② 解构、rest、spread；③ 搞清 \`this\` 陷阱（Java 老手会栽）；④ 函数当值传递。
> 你 15 年 Java：方法挂在类上，抽成方法引用 \`this\` 还在。TS / JS 里**函数是值**，普通方法一抽就丢 \`this\`。Python 的 \`def\` 也是值，但没有 \`this\` 这套。

> 📐 **本教程的契约**：下面每一节（§5.1–§5.7）都**精确对应**作业里的题。讲过的才考，考的必讲过。卡住时按作业函数名回查对应小节。

---`,
    [],
  ),
  sec(
    "sec-map",
    "🗺️ 本章地图",
    null,
    `本章作业是一条完整主线：**把订单行计算拆成模块函数**。7 个函数，从折后价走到货架标记。

读完这章 + 完成作业，你将能够：

- 分清 named export 与 default export；知道本页如何「假装模块」
- 写出函数类型 \`(x: A) => B\`，并对照箭头函数
- 用解构把 SKU 拆成 \`{ prefix, seq }\`（对比 Ch01 元组）
- 用 rest 参数收任意多个标签
- 用 spread 合并补丁且**不改**原对象，保留 \`stock: 0\`
- 用闭包做计数器，并讲清为什么不靠 \`this\`
- 把函数放进数组从左到右管道执行
- 最后一题调用前面的函数拼出货架标记

**作业 ↔ 教程对应表**（学哪节，就去做哪题）：

| 作业题 | 对应小节 | 核心知识点 |
|--------|----------|-----------|
| \`discountedPrice\` | §5.1 | 箭头函数、函数类型 |
| \`splitSku\` | §5.2 | 解构 |
| \`restTags\` | §5.3 | rest 参数 |
| \`mergeProductPatch\` | §5.4 | spread |
| \`bindCounter\` | §5.5 | this / 箭头（闭包计数，无 DOM） |
| \`pipePrice\` | §5.6 | 函数当值传递 |
| \`exportMarker\` | §5.7 | 再导出组合（调用前面函数） |

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
| ④ 费曼（2 分钟） | 大白话讲清「为什么抽出方法会丢 this」 | 本页 ④ |
| ⑤ 存闪卡 | 章末闪卡标复习日期 | 闪卡 |

> 💡 别从头读到尾。先扫 ① → 写作业 → **哪题卡了，回对应 § 查** → 改 → 再跑。
> 最后一题 \`exportMarker\` 会调用 \`splitSku\` + \`discountedPrice\` + \`restTags\`，请按顺序做。

---`,
    [],
  ),
  sec(
    "sec-guess",
    "① 预览猜（2 分钟 · 激活你的 Java / Python 直觉）",
    null,
    `先别看答案，凭经验猜一猜（猜错没关系）：

1. Java 里 \`counter::inc\` 抽成回调，\`this\` 还指向那个对象吗？JS 里 \`const f = obj.inc; f();\` 呢？
2. \`export function foo()\` 和 \`export default function foo()\`，对面 \`import\` 写法有何不同？作业该用哪个？
3. Ch01 的 \`parseSku\` 返回 \`[string, number]\`。本题为什么改成 \`{ prefix, seq }\`？
4. \`function restTags(first, ...rest)\` 只传一个 \`"sale"\`，\`rest\` 是 \`undefined\` 还是 \`[]\`？
5. \`{ ...base, ...{ stock: 0 } }\` 得到的 stock 是 0 还是 base 的旧值？base 本身会被改掉吗？
6. 函数能不能放进数组里当元素，再从左到右挨个调用？

> 猜完，带着验证心态进入正文。第 1 题是整章最容易栽的坑。

---`,
    [],
  ),
  sec(
    "sec-world",
    "世界地图：函数是值，模块是文件 🟡",
    null,
    `先把「函数挂在哪」和「怎么跨文件拿」分清。后面每一节都建立在这张图上。

| | Java | Python | TypeScript |
|---|---|---|---|
| 函数默认位置 | 类的方法 | 模块顶层 \`def\`（也是值） | **函数是值**：可以赋变量、当参数、放数组 |
| 跨文件 | \`import com.shop.Price\` | \`from price import discounted_price\` | **ESM**：\`import { discountedPrice } from "./price.ts"\` |
| \`this\` | 实例方法抽出仍绑着对象 | 显式 \`self\`，没有偷偷的 this | **普通方法一抽就丢 this**；箭头词法捕获 |

### 本页怎么「假装模块」🟡

作业要求顶格 \`export function name(...)\`——这是 **named export**。

运行器会把本章所有函数**拼进同一个文件**再转译。\`import ... from\` 会被剥掉，所以：

- ✅ 作业里写多个 \`export function\`
- ❌ 作业里不要写 \`import { discountedPrice } from "./xxx"\`（本页跑不起来）
- 真正的多文件 \`import\` / \`export\` 在 **M4 本地章**再用 Bun 跑

教程下面会展示 \`export { foo }\`、named vs default 的对照，让你在脑子里有一张图。作业仍然全部 named、全部一个文件。

### named vs default（心里过一遍，作业只用 named）

\`\`\`ts
// named：名字是契约
export function discountedPrice(price: number, rate: number): number {
  return price * (1 - rate);
}
// 对面：import { discountedPrice } from "./price";

// default：一个模块最多一个，引入时可改名
export default function discountedPrice(price: number, rate: number): number {
  return price * (1 - rate);
}
// 对面：import calc from "./price";   // 叫 calc 也行
\`\`\`

\`\`\`ts
// 再导出：自己不实现，转发出去
export { discountedPrice } from "./price";
\`\`\`

> 本课作业**只用 named export**。不要写 \`export default\`。

### 不讲（标明，免得你去搜）

- \`namespace\` / \`/// <reference>\` —— 老写法，本课不碰
- \`require()\` / \`module.exports\` —— CommonJS，本课统一 ESM
- 浏览器 \`<script type="module">\` 的路径细节 —— M4 再说

### 本课怎么算「会了」

编辑器红线 ≈ 函数类型 / 解构形状（编译期）。点「运行测试」≈ 跑 JS。**测试全绿 = 这题掌握。**

---`,
    [],
  ),
  sec(
    "sec-5.1",
    "§5.1 箭头函数与函数类型（对应：`discountedPrice`）🟡",
    "5.1",
    `促销：折后价 = 原价 × (1 − 折扣率)。先当普通函数写对，再看「函数也是值」。

### Java 对照：方法必须挂在类型上

\`\`\`java
class Price {
    static double discountedPrice(double price, double rate) {
        return price * (1 - rate);
    }
}
Price.discountedPrice(100, 0.1);   // 90.0
\`\`\`

你也可以写 \`Function<Double, Double>\`，但日常就是类上的方法。

### Python：\`def\` 本身就是值

\`\`\`python
def discounted_price(price: float, rate: float) -> float:
    return price * (1 - rate)

calc = discounted_price          # 可以赋给变量
calc(100, 0.1)                   # 90.0
\`\`\`

### TypeScript：声明 vs 箭头 vs 函数类型 🟡

三种写法**运行时一样**（都是函数）。差别在「类型写在哪」和 \`this\`（§5.5）。

\`\`\`ts
// 1) 声明（作业用这个：named export）
export function discountedPrice(price: number, rate: number): number {
  return price * (1 - rate);
}

// 2) 箭头 + 函数类型：变量的类型是 (price, rate) => number
const discountedPrice: (price: number, rate: number) => number = (price, rate) =>
  price * (1 - rate);

// 3) 类型别名，给管道 / 回调复用（§5.6 会用到）
type DiscountFn = (price: number, rate: number) => number;
\`\`\`

函数类型读作：「一个函数，吃 A，吐 B」。Java 的 \`Function<A,B>\` / \`BiFunction\` 一家亲戚；TS 用箭头写法，两个参数也能写。

### \`void\`：调用方不取值 🟡

\`\`\`ts
type LogPrice = (n: number) => void;

const log: LogPrice = (n) => {
  console.log(n);   // 不需要 return
};
\`\`\`

Java 的 \`void\` 方法**不能** \`return 1\`。TS 的 \`void\` 意思更接近「调用方忽略返回值」——实现里偶尔 \`return x\` 编译器有时也放过。本章作业没有 \`void\` 函数；看见回调类型写成 \`() => void\` 时，知道是「别用它的返回值」。

### 真实场景

\`\`\`ts
discountedPrice(100, 0.1);   // 90
discountedPrice(599, 0);     // 599  ← 没打折
discountedPrice(0, 0.5);     // 0    ← 0 元商品
discountedPrice(599, 0.1);   // 539.1
discountedPrice(75.5, 0.2);  // 60.4
\`\`\`

### ❌ / ✅

\`\`\`ts
// ❌ 用 || 把 0 元当成没传
return (price || 0) * (1 - rate);

// ❌ 写成 100 * 0.9，硬编码
return 90;

// ✅
return price * (1 - rate);
\`\`\`

> ✅ **做 \`discountedPrice\`**：一行乘法。类型按骨架抄。心里记得：这个函数可以赋给 \`(price: number, rate: number) => number\` 变量。

---`,
    ["discountedPrice"],
  ),
  sec(
    "sec-5.2",
    "§5.2 解构到命名字段（对应：`splitSku`）🟡",
    "5.2",
    `Ch01 的 \`parseSku\` 返回元组 \`[string, number]\`，靠**位置**。本题返回对象，靠**名字**。仓储扫码仍然是 \`"KB-001"\` → 前缀 + 序号。

### Java 对照：还是 record

\`\`\`java
record SkuParts(String prefix, int seq) {}
new SkuParts("KB", 1);
\`\`\`

### Python：元组或字典都行

\`\`\`python
prefix, raw = sku.split("-")
return {"prefix": prefix, "seq": int(raw)}
\`\`\`

### TypeScript：数组解构 → 对象字面量

\`\`\`ts
function splitSku(sku: string): { prefix: string; seq: number } {
  const [prefix, seq] = sku.split("-");
  return { prefix, seq: Number(seq) };
}

splitSku("KB-001");   // { prefix: "KB", seq: 1 }
splitSku("MN-003");   // { prefix: "MN", seq: 3 }  —— Number("003") === 3
\`\`\`

\`{ prefix }\` 是简写，等于 \`{ prefix: prefix }\`。

调用处也可以解构：

\`\`\`ts
const { prefix, seq } = splitSku("MS-002");
// prefix === "MS", seq === 2
\`\`\`

> 🟡 和 Ch01 的差别：元组运行时是数组，\`Array.isArray\` 为 true。本题必须是对象，测试会查 \`Array.isArray(...) === false\`。

### 对象解构（同一套语法）

\`\`\`ts
const product = { name: "机械键盘", price: 599, stock: 120 };
const { name, price } = product;
// name === "机械键盘", price === 599
\`\`\`

### ❌ / ✅

\`\`\`ts
// ❌ 返回元组（那是 Ch01）
return [prefix, Number(seq)];

// ❌ 忘了 Number，seq 带着前导零字符串
return { prefix, seq };

// ✅
return { prefix, seq: Number(seq) };
\`\`\`

> ✅ **做 \`splitSku\`**：split → 数组解构 → \`Number\` → 返回对象。

---`,
    ["splitSku"],
  ),
  sec(
    "sec-5.3",
    "§5.3 rest 参数（对应：`restTags`）🟡",
    "5.3",
    `运营打标签：第一个是主标签（必有），后面可有可无、可有很多。

### Java 对照：可变参数

\`\`\`java
List<String> restTags(String first, String... rest) {
    var all = new ArrayList<String>();
    all.add(first);
    Collections.addAll(all, rest);
    return all;
}
restTags("sale");                    // [sale]
restTags("sale", "new", "hot");      // [sale, new, hot]
\`\`\`

### Python：\`*rest\`

\`\`\`python
def rest_tags(first: str, *rest: str) -> list[str]:
    return [first, *rest]
\`\`\`

### TypeScript：\`...rest: string[]\`

\`\`\`ts
function restTags(first: string, ...rest: string[]): string[] {
  return [first, ...rest];
}

restTags("sale");                 // ["sale"]          rest === []
restTags("sale", "new", "hot");   // ["sale", "new", "hot"]
restTags("new", "hot");           // ["new", "hot"]
\`\`\`

> 🤯 **转换点**：只传一个参数时，\`rest\` 是 **空数组**，不是 \`undefined\`。所以 \`[first, ...rest]\` 仍然安全。

rest **必须写在参数列表最后**。前面的 \`first\` 是普通参数。

数组这边的 \`...rest\` 叫 **spread**（下一节对象也有）。同一套三个点，出现位置不同：

| 位置 | 名字 | 作用 |
|---|---|---|
| 参数 \`...rest\` | rest | 把剩下的实参收成数组 |
| 数组 \`[first, ...rest]\` | spread | 把数组摊开 |

### ❌ / ✅

\`\`\`ts
// ❌ 忽略 rest，只返回主标签 —— 测试会拿三个标签来抓
return [first];

// ❌ 参数列表里没写 ...rest，第二、第三个标签根本接不住
function restTags(first: string): string[] { ... }

// ✅
return [first, ...rest];
\`\`\`

> ✅ **做 \`restTags\`**：\`return [first, ...rest];\`

---`,
    ["restTags"],
  ),
  sec(
    "sec-5.4",
    "§5.4 对象 spread（对应：`mergeProductPatch`）🔴",
    "5.4",
    `商品中心打补丁：base 是当前的 name / price / stock，patch 是 \`Partial<...>\`（Ch04 讲过，只带要改的键）。要一张**新**卡片，仓库里那张旧的不能动。

### Java 对照：不会默认复制，得 new 一个

\`\`\`java
Product merged = new Product(base.getName(), base.getPrice(), base.getStock());
if (patch.getPrice() != null) merged.setPrice(patch.getPrice());
// 一不小心 merged 和 base 是同一个引用，后面全乱
\`\`\`

### Python：字典展开（3.5+）

\`\`\`python
return { **base, **patch }
\`\`\`

### TypeScript：\`{ ...base, ...patch }\` 🔴

\`\`\`ts
function mergeProductPatch(
  base: { name: string; price: number; stock: number },
  patch: Partial<{ name: string; price: number; stock: number }>,
): { name: string; price: number; stock: number } {
  return { ...base, ...patch };
}
\`\`\`

从左到右：**后写的覆盖先写的**。\`patch\` 里有的键盖掉 \`base\`；没有的键保留 \`base\`。

\`\`\`ts
mergeProductPatch({ name: "机械键盘", price: 599, stock: 120 }, { price: 499 });
// -> { name: "机械键盘", price: 499, stock: 120 }

mergeProductPatch({ name: "智能水杯", price: 199, stock: 10 }, { stock: 0 });
// -> stock: 0   ← 0 是合法库存（缺货）

const base = { name: "设计模式", price: 75.5, stock: 200 };
const out = mergeProductPatch(base, {});
// out 字段相同，但 out === base 为 false
\`\`\`

### 不要 mutate 🔴

\`\`\`ts
// ❌ 改了调用方手里的对象
Object.assign(base, patch);
base.price = patch.price ?? base.price;

// ❌ || 把 stock: 0 当成没传
return { ...base, stock: patch.stock || base.stock };

// ✅ 新对象，0 也能覆盖
return { ...base, ...patch };
\`\`\`

> 🤯 **转换点**：spread 是浅拷贝。本题三字段都是 string / number，没有嵌套对象，浅拷贝就够。后面改嵌套结构再讲（M3 的 immutable 更新）。

测试会在调用后检查 **base 原封不动**，以及空补丁时 \`out === base\` 为 false。

> ✅ **做 \`mergeProductPatch\`**：\`return { ...base, ...patch };\` 一行。

---`,
    ["mergeProductPatch"],
  ),
  sec(
    "sec-5.5",
    "§5.5 \`this\`、箭头与闭包（对应：`bindCounter`）🔴",
    "5.5",
    `这是整章最重要的「为什么」。进货扫描枪：每扫一件 +1，返回新值。两台枪互不影响。本题**禁止 DOM**，作业用闭包，不靠 \`this\`。

### Java：抽出方法，\`this\` 还在 🔴

\`\`\`java
class Counter {
    int n;
    Counter(int start) { this.n = start; }
    int inc() { return ++n; }
}
Counter c = new Counter(0);
IntSupplier s = c::inc;   // 方法引用仍然绑着 c
s.getAsInt();             // 1
s.getAsInt();             // 2
\`\`\`

Java 老手的直觉：「函数是对象上的行为，抽出去也记得自己是谁。」

### JS 普通方法：一抽就丢 🔴

\`\`\`ts
const obj = {
  n: 0,
  inc() {
    return ++this.n;
  },
};

obj.inc();            // 1  —— 通过 obj. 调用，this 是 obj
const f = obj.inc;
f();                  // ❌ 严格模式 this 是 undefined，炸；非严格指向全局
\`\`\`

\`const f = obj.inc\` 只拿到了那张「函数纸」，纸上没有盖「属于 obj」的章。谁调用、点在谁前面，\`this\` 才是谁。

React 点击回调、\`setTimeout(obj.inc, 0)\` 都是这个坑。Java 没有这个坑。

### 箭头：没有自己的 \`this\`，词法向外找

\`\`\`ts
const obj = {
  n: 0,
  inc: () => {
    // 箭头不绑定 this。这里的 this 是外层（模块 / 类实例），不是 obj
    return ++this.n;   // 多半不是你想要的
  },
};
\`\`\`

箭头适合「我就是要外层那个 this」（class 字段初始化、React 里偶尔）。**不适合**用来写「我以为 this 是 obj」的对象方法。

### 作业：闭包，根本不需要 \`this\` ✅

把计数放进函数**外面的变量**里。返回的那个函数每次被调用，还能看见这个 \`n\`——这叫闭包。Python 的 \`nonlocal\`、Java 的 lambda 捕获 effectively final 局部变量，是亲戚；JS 的 \`let n\` 还可以被改。

\`\`\`ts
function bindCounter(start: number): () => number {
  let n = start;
  return () => ++n;
}

const a = bindCounter(0);
a();   // 1
a();   // 2

const b = bindCounter(0);
b();   // 1  —— 另一个闭包，另一个 n
a();   // 3  —— a 还是 a 的 n
\`\`\`

返回类型 \`() => number\` 就是 §5.1 的函数类型：不吃参数，吐一个 number。

### 对照表

| | Java 实例方法 | JS \`inc() { this.n }\` | 箭头 | 闭包（本题） |
|---|---|---|---|---|
| 抽出当回调 | \`this\` 还在 | **丢失** | 用外层 this | 不靠 this |
| 两份独立状态 | 两个实例 | 两个对象 | 看你捕获谁 | 调两次 \`bindCounter\` |

### ❌ / ✅

\`\`\`ts
// ❌ 模块顶层 let n —— 所有计数器共享
let n = 0;
export function bindCounter(start: number): () => number {
  n = start;
  return () => ++n;
}

// ❌ 普通方法抽出去（作业不要走 this）
return obj.inc;

// ❌ 返回 start + 1，没有记住状态
return () => start + 1;

// ✅ 每次 bindCounter 新建自己的 n
let n = start;
return () => ++n;
\`\`\`

> ✅ **做 \`bindCounter\`**：\`let n = start; return () => ++n;\` 测试会查连续调用、独立实例、以及返回值是函数。

---`,
    ["bindCounter"],
  ),
  sec(
    "sec-5.6",
    "§5.6 函数当值：价格管道（对应：`pipePrice`）🟡",
    "5.6",
    `满减、倍率、折扣……运营把规则排成一条管道，从左到右作用在价格上。函数是值，就可以放进数组。

### Java 对照：\`Function\` 接口 + \`andThen\`

\`\`\`java
Function<Double, Double> minus10 = x -> x - 10;
Function<Double, Double> times2 = x -> x * 2;
minus10.andThen(times2).apply(100.0);   // 180.0
\`\`\`

### Python：可调用对象放进 list

\`\`\`python
def pipe_price(price, fns):
    for fn in fns:
        price = fn(price)
    return price
\`\`\`

### TypeScript：\`Array<(n: number) => number>\`

\`\`\`ts
function pipePrice(price: number, fns: Array<(n: number) => number>): number {
  return fns.reduce((acc, fn) => fn(acc), price);
}

pipePrice(100, [(x) => x - 10, (x) => x * 2]);   // (100-10)*2 = 180
pipePrice(100, [(x) => x * 2, (x) => x - 10]);   // 100*2-10 = 190
pipePrice(50, []);                                // 50  空管道 = 原价
pipePrice(10, [(x) => x + 5]);                    // 15
pipePrice(100, [(x) => x + 5, (x) => x * 2, (x) => x - 10]); // 200
\`\`\`

> 🟡 **从左到右**。写反了 180 会变成 190，测试两条都有。

也可以传入包装过的 \`discountedPrice\`（请先把 §5.1 写绿）：

\`\`\`ts
pipePrice(100, [(n) => discountedPrice(n, 0.1), (n) => n - 10]);
// 90 再减 10 → 80
\`\`\`

作业测试用匿名箭头，不强制你先完成 §5.1；但类型就是这么回事：管道里每一格都是 \`(n: number) => number\`。

### ❌ / ✅

\`\`\`ts
// ❌ reduceRight 或从 fns.length-1 倒着走
// ❌ 空数组返回 0（0 元原价和「没管道」搅在一起）
// ✅ 以 price 为初始值，从左到右 fn(acc)
return fns.reduce((acc, fn) => fn(acc), price);
\`\`\`

> ✅ **做 \`pipePrice\`**：\`reduce\` 一行，初始值是 \`price\`。

---`,
    ["pipePrice"],
  ),
  sec(
    "sec-5.7",
    "§5.7 再导出与组合（对应：`exportMarker`）🟡",
    "5.7",
    `货架要一条标记：SKU 前缀 + 折后价 + 标签。真正的项目里这往往在 \`export { ... } from "./price"\` 的桶文件里拼。本页不能拆文件，就用**调用前面三个函数**模拟「模块拼装」。

### 真项目里的再导出（看一眼，作业别写 import）

\`\`\`ts
// price.ts
export function discountedPrice(price: number, rate: number): number { /* ... */ }
export function splitSku(sku: string): { prefix: string; seq: number } { /* ... */ }

// markers.ts —— 再导出 + 组合
export { discountedPrice, splitSku } from "./price";
export function exportMarker(...) { /* 调上面两个 */ }
\`\`\`

本页运行器会剥掉 \`import\`，多个 \`export function\` 已经在同一个作用域。你直接调用即可。

### 格式契约（测试按这个字符串比）

\`\`\`
前缀 + 空格 + ¥ + 折后价.toFixed(2) + 空格 + [标签逗号拼接]
\`\`\`

无标签时方括号仍在，里面是空串：\`[]\`。

\`\`\`ts
function exportMarker(
  sku: string,
  price: number,
  rate: number,
  ...tags: string[]
): string {
  const { prefix } = splitSku(sku);
  const p = discountedPrice(price, rate);
  const tagList = tags.length === 0 ? [] : restTags(tags[0], ...tags.slice(1));
  return \`\${prefix} ¥\${p.toFixed(2)} [\${tagList.join(",")}]\`;
}

exportMarker("KB-001", 599, 0.1, "sale", "new");  // "KB ¥539.10 [sale,new]"
exportMarker("MS-002", 159, 0, "hot");            // "MS ¥159.00 [hot]"
exportMarker("BK-005", 75.5, 0.2);                // "BK ¥60.40 []"
exportMarker("MN-003", 2199, 0.1, "4k");          // "MN ¥1979.10 [4k]"
\`\`\`

599 × 0.9 = 539.1 → \`"539.10"\`。75.5 × 0.8 = 60.4 → \`"60.40"\`。2199 × 0.9 = 1979.1 → \`"1979.10"\`。

无标签时不要去调 \`restTags()\`（它要求至少一个 \`first\`），用空数组即可；有标签时必须走 \`restTags\`，好把 §5.3 接上。

### ❌ / ✅

\`\`\`ts
// ❌ 硬编码 "KB ¥539.10 [sale,new]"
// ❌ 自己再 split / 自己算折后价，不调用前面的函数（后面改了折扣规则这里不会跟着绿）
// ❌ 标签用空格拼，或漏掉方括号
// ✅ 解构 prefix + discountedPrice + restTags + toFixed(2)
\`\`\`

> ⚠️ 请先把 \`splitSku\` / \`discountedPrice\` / \`restTags\` 写绿。
>
> ✅ **做 \`exportMarker\`**：三个调用 + 一条模板字符串。

---`,
    ["exportMarker"],
  ),
  sec(
    "sec-pits",
    "§5.8 Java / Python 老手几个坑 ⚠️",
    "5.8",
    `1. **JS 普通方法抽出会丢 \`this\`。** Java 方法引用不会。作业用闭包，不要靠 \`this\`。
2. **箭头没有自己的 \`this\`。** 它向外找。别用箭头当「以为 this 是 obj」的方法。
3. **作业只用 named \`export function\`。** 不要 \`export default\`。本页不要写 \`import\`。
4. **\`splitSku\` 返回对象不是元组。** \`Array.isArray\` 应为 false。
5. **rest 只传一个实参时是 \`[]\`，不是 \`undefined\`。** 漏写 \`...rest\` 会丢标签。
6. **spread 不改原对象。** \`Object.assign(base, patch)\` 会 mutate。\`stock: 0\` 用 spread 能盖上，用 \`||\` 会丢。
7. **管道从左到右。** 空数组返回原价，包括原价 0。
8. **\`void\` 不是 Java 那种「禁止 return」。** 看见 \`() => void\` 当「忽略返回值」即可。
9. **不讲 namespace / require。** 看见它们当文物。

---`,
    [],
  ),
  sec(
    "sec-homework",
    "📝 本章作业",
    null,
    `上面 7 个函数按节交错出现。每个注释里有【场景】【转换点】、示例和提示。

**完成方式**：在编辑器里改 \`throw new Error("TODO")\`，点「▶ 运行测试」。全绿 = 这题过了。

卡住就回对应 §：\`discountedPrice\` → §5.1，\`bindCounter\` → §5.5，\`exportMarker\` → §5.7。

---`,
    [],
  ),
  sec(
    "sec-check",
    "✅ 自测：你真的掌握了吗？",
    null,
    `- [ ] 能说清 named vs default，以及本页为什么不能真拆文件
- [ ] 能写出函数类型 \`(x: A) => B\`，知道 \`void\` 是「忽略返回值」
- [ ] 会把 \`split\` 解构进 \`{ prefix, seq }\`，对比 Ch01 元组
- [ ] 会写 rest 参数，只传一个时 rest 是 \`[]\`
- [ ] 会用 spread 合并补丁：不 mutate、保留 \`0\`
- [ ] 能用大白话讲清「Java this 还在、JS 普通方法会丢、闭包不靠 this」
- [ ] 会把函数放进数组从左到右管道执行
- [ ] 最后一题调用了前面三个函数
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

1. 「为什么我在 Java 里 \`obj::inc\` 没问题，在 TS 里 \`const f = obj.inc; f()\` 就炸？箭头函数能救吗？作业为什么改用闭包？」— 卡壳重读世界地图 + §5.5
2. 「\`export default\` 和 \`export function\` 对面怎么 import？这页为什么不许我写 import？」— 卡壳重读世界地图 + §5.7
3. 「\`{ ...base, ...patch }\` 和 \`base.stock = patch.stock\` 差在哪？为什么 \`stock: 0\` 要用 spread 而不是 \`||\`？」— 卡壳重读 §5.4

---`,
    [],
  ),
  sec(
    "sec-next",
    "⏭️ 下一步",
    null,
    `Ch05 掌握后，进 **Ch06 · Promise、async/await、错误**。函数当值、闭包、箭头都会在异步回调里再次出现。\`catch\` 的 err 是 \`unknown\`（Ch03 收窄），\`Promise.all\` 对照 Java \`CompletableFuture\` / Python asyncio。别提前写真 fetch，下一章用内存 mock。`,
    [],
  ),
];

const tutorialMd = `# Ch05 · 函数、模块、this、解构

${sections
  .map((s) => (s.heading ? `## ${s.heading}\n\n${s.body}` : s.body))
  .join("\n\n")}
`;

const chapter = {
  id: "ch05",
  num: "05",
  title: "函数、模块、this、解构",
  runMode: "browser",
  tutorialMd,
  assignment,
  testName: "ch05_assignment",
  testSource,
  reviewMd,
  interleaved: true,
  sections,
  functions,
  preamble,
};

const out = join(dirname(fileURLToPath(import.meta.url)), "../src/content/chapters/ch05.json");
mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, JSON.stringify(chapter, null, 2) + "\n");
console.log("wrote", out);
