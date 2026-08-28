/**
 * 生成 src/content/chapters/ch10.json
 * 运行：bun scripts/gen-ch10.ts
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const preamble = `/**
 * Ch10 作业：读精简 tsconfig、写一份给无类型 JS 商店 SDK 的声明。
 *
 * 场景：仓库里有一份老的 shop.js（lookupProduct / calcLineTotal），没有类型。
 * 你先读 tsconfig 里 strict 开了什么，再给这份 JS 写出 .d.ts 文本。
 * 不读磁盘、不 import fs——入参就是 JSON 字符串。
 *
 * 约定：
 *   - 非法 JSON → throw new Error("NO_JSON")
 *   - 缺 compilerOptions（或它不是对象）→ 当 {}
 *   - 作业给的都是合法 JSON（没有注释、没有尾逗号）
 *
 * 全绿 = 你掌握了 Ch10。
 */`;

const functions = [
  {
    name: "readStrict",
    testSuite: "readStrict",
    skeleton: `/**
 * 【场景】打开仓库的 tsconfig.json，看 strict 开没开。
 * 开了才敢说「没标类型会被骂」；没开则接近 Python 默认的 mypy。
 *
 * 【转换点】compilerOptions.strict。Java 的 javac 没有这个开关——类型错了就是编译失败。
 * Python 的 mypy 默认很松，--strict 才一捆打开。TS 用 JSON 里的布尔开关。
 *
 * 任务：JSON.parse 后读 compilerOptions.strict，返回 !!strict。
 * 缺 compilerOptions 当 {}。缺 strict → false。非法 JSON → throw new Error("NO_JSON")。
 * 示例：
 *   readStrict('{"compilerOptions":{"strict":true}}')   -> true
 *   readStrict('{"compilerOptions":{"strict":false}}')  -> false
 *   readStrict("{}")                                    -> false
 *   readStrict("{")                                     -> 抛 Error("NO_JSON")
 *
 * 提示：try/catch JSON.parse；co = parsed.compilerOptions ?? {}；return !!co.strict;
 */
export function readStrict(tsconfigJson: string): boolean {
  throw new Error("TODO");
}`,
  },
  {
    name: "readNoImplicitAny",
    testSuite: "readNoImplicitAny",
    skeleton: `/**
 * 【场景】同事写了 function lookupProduct(sku) 没标类型。
 * noImplicitAny 开着，tsc 会红；关着就默成 any，跟没写类型一样。
 *
 * 【转换点】显式标志优先，否则由 strict 暗示。
 * 若 noImplicitAny 是布尔值，用它（可覆盖 strict）。
 * 否则 strict === true → true；再否则 false。
 *
 * 任务：按上面的规则返回 boolean。非法 JSON 同样抛 "NO_JSON"。
 * 示例：
 *   {"compilerOptions":{"strict":true}}                      -> true（暗示）
 *   {"compilerOptions":{"strict":true,"noImplicitAny":false}} -> false（显式覆盖）
 *   {"compilerOptions":{"noImplicitAny":true}}               -> true（显式）
 *   {}                                                       -> false
 *
 * 提示：typeof co.noImplicitAny === "boolean" 才算显式。
 */
export function readNoImplicitAny(tsconfigJson: string): boolean {
  throw new Error("TODO");
}`,
  },
  {
    name: "readTarget",
    testSuite: "readTarget",
    skeleton: `/**
 * 【场景】看这份 tsconfig 要发出哪一代 JS。本课心里记 ES2020 即可。
 *
 * 【转换点】compilerOptions.target。点到为止：它决定 emit 的语法下限
 * （可选链、空值合并算不算「已经有」）。不要卷 bundler / polyfill 大战。
 *
 * 任务：target 是 string 就原样返回，否则 null。非法 JSON → "NO_JSON"。
 * 示例：
 *   {"compilerOptions":{"target":"ES2020"}}  -> "ES2020"
 *   {"compilerOptions":{"target":"ES2017"}}  -> "ES2017"
 *   {}                                       -> null
 *
 * 提示：typeof co.target === "string" ? co.target : null
 */
export function readTarget(tsconfigJson: string): string | null {
  throw new Error("TODO");
}`,
  },
  {
    name: "readModuleKind",
    testSuite: "readModuleKind",
    skeleton: `/**
 * 【场景】看模块怎么发出去。函数叫 readModuleKind，因为 module 像关键字。
 *
 * 【转换点】compilerOptions.module。本课心里按 ESM / bundler 理解 import/export。
 * 不考 AMD、UMD、也不考 paths 映射。
 *
 * 任务：module 是 string 就原样返回，否则 null。非法 JSON → "NO_JSON"。
 * 示例：
 *   {"compilerOptions":{"module":"ESNext"}}     -> "ESNext"
 *   {"compilerOptions":{"module":"CommonJS"}}   -> "CommonJS"
 *   {}                                          -> null
 *
 * 提示：读的字段名是 "module"，函数名是 readModuleKind。
 */
export function readModuleKind(tsconfigJson: string): string | null {
  throw new Error("TODO");
}`,
  },
  {
    name: "strictImplies",
    testSuite: "strictImplies",
    skeleton: `/**
 * 【场景】有人问：「我只写了 strict: true，到底还开了哪些检查？」
 * 这题不解析 JSON，只认一张固定白名单。
 *
 * 【转换点】strict 是一捆开关，不是单个检查。Java javac 没有这张菜单；
 * Python mypy --strict 同样是一捆打开。
 *
 * 任务：flag 属于下面集合则 true，其余（target / jsx / skipLibCheck / strict 本身）false：
 *   noImplicitAny, strictNullChecks, noImplicitThis, alwaysStrict,
 *   strictBindCallApply, strictFunctionTypes, strictPropertyInitialization,
 *   useUnknownInCatchVariables
 *
 * 示例：
 *   strictImplies("noImplicitAny")      -> true
 *   strictImplies("strictNullChecks")   -> true
 *   strictImplies("target")             -> false
 *   strictImplies("skipLibCheck")       -> false
 *
 * 提示：写一个 Set / 数组 includes。不要去 parse tsconfig。
 */
export function strictImplies(flag: string): boolean {
  throw new Error("TODO");
}`,
  },
  {
    name: "declareFunctionLine",
    testSuite: "declareFunctionLine",
    skeleton: `/**
 * 【场景】给无类型 shop.js 补一行环境声明。没有函数体，tsc 也不会发出 JS。
 *
 * 【转换点】declare function vs function。后者要有函数体、会进运行时；
 * 前者只给编译器看，和 Ch01 的类型一样会蒸发。Python 对标 .pyi 里的 def ...: ...
 *
 * 任务：精确返回 \`declare function \${name}(\${params}): \${ret};\`
 * 不要多空格、不要漏分号。
 * 示例：
 *   declareFunctionLine("lookupProduct", "sku: string", "Product | null")
 *     -> "declare function lookupProduct(sku: string): Product | null;"
 *   declareFunctionLine("calcLineTotal", "price: number, quantity: number", "number")
 *     -> "declare function calcLineTotal(price: number, quantity: number): number;"
 *   declareFunctionLine("ping", "", "void")
 *     -> "declare function ping(): void;"
 */
export function declareFunctionLine(name: string, params: string, ret: string): string {
  throw new Error("TODO");
}`,
  },
  {
    name: "shopApiDts",
    testSuite: "shopApiDts",
    skeleton: `/**
 * 【场景】shop.js 是第三方 JS SDK，Ch07 / Ch23 会调 lookupProduct、calcLineTotal。
 * 没有 .d.ts 时，tsc 要么报找不到名字，要么把参数收成 any。
 * 本题返回 shop.d.ts 的源码字符串（快照），不写磁盘。
 *
 * 【转换点】ambient 文件。.d.ts 只有类型，运行时蒸发——它不校验 JSON。
 * 脏数据还是要 Ch07 的 zod。@types/node 就是同一思路：JS 运行时 + 社区补的声明。
 *
 * 任务：精确返回下面三行（\\n 拼接，末尾带一个换行）。可复用 declareFunctionLine。
 *
 * declare function lookupProduct(sku: string): { name: string; price: number } | null;
 * declare function calcLineTotal(price: number, quantity: number): number;
 * declare const SHOP_VERSION: string;
 *
 * 提示：前两行用 declareFunctionLine；第三行手写 declare const。join("\\n") + "\\n"。
 */
export function shopApiDts(): string {
  throw new Error("TODO");
}`,
  },
];

const assignment = `${preamble}

${functions.map((f) => f.skeleton).join("\n\n")}
`;

const testSource = `const TSCONFIG_A = JSON.stringify({
  compilerOptions: {
    strict: true,
    target: "ES2020",
    module: "ESNext",
  },
});

const TSCONFIG_B = JSON.stringify({
  compilerOptions: {
    strict: false,
    noImplicitAny: true,
    target: "ES2017",
    module: "CommonJS",
  },
});

const TSCONFIG_OVERRIDE = JSON.stringify({
  compilerOptions: {
    strict: true,
    noImplicitAny: false,
  },
});

const SHOP_API_DTS =
  "declare function lookupProduct(sku: string): { name: string; price: number } | null;\\n" +
  "declare function calcLineTotal(price: number, quantity: number): number;\\n" +
  "declare const SHOP_VERSION: string;\\n";

function catchErr(fn: () => unknown): unknown {
  try {
    fn();
    return null;
  } catch (e) {
    return e;
  }
}

describe("readStrict", () => {
  it("A：strict true", () => {
    expect(readStrict(TSCONFIG_A)).toBe(true);
  });
  it("B：strict false（第二份 fixture，防硬编码 true）", () => {
    expect(readStrict(TSCONFIG_B)).toBe(false);
  });
  it("缺 compilerOptions → false", () => {
    expect(readStrict("{}")).toBe(false);
  });
  it("compilerOptions 为空对象 → false", () => {
    expect(readStrict('{"compilerOptions":{}}')).toBe(false);
  });
  it("合法 JSON 但根是 null → false", () => {
    expect(readStrict("null")).toBe(false);
  });
  it("非法 JSON 抛 NO_JSON", () => {
    const err = catchErr(() => readStrict("{"));
    expect(err).toBeInstanceOf(Error);
    expect((err as Error).message).toBe("NO_JSON");
  });
});

describe("readNoImplicitAny", () => {
  it("strict true 且未写 noImplicitAny → 暗示 true", () => {
    expect(readNoImplicitAny(TSCONFIG_A)).toBe(true);
  });
  it("B：strict false 但显式 noImplicitAny true", () => {
    expect(readNoImplicitAny(TSCONFIG_B)).toBe(true);
  });
  it("strict true 可被 noImplicitAny false 覆盖", () => {
    expect(readNoImplicitAny(TSCONFIG_OVERRIDE)).toBe(false);
  });
  it("空对象 → false", () => {
    expect(readNoImplicitAny("{}")).toBe(false);
  });
  it("只写 noImplicitAny false", () => {
    expect(readNoImplicitAny('{"compilerOptions":{"noImplicitAny":false}}')).toBe(false);
  });
  it("非法 JSON 抛 NO_JSON", () => {
    const err = catchErr(() => readNoImplicitAny("not-json"));
    expect(err).toBeInstanceOf(Error);
    expect((err as Error).message).toBe("NO_JSON");
  });
});

describe("readTarget", () => {
  it("A：ES2020", () => {
    expect(readTarget(TSCONFIG_A)).toBe("ES2020");
  });
  it("B：ES2017（第二份 fixture，防硬编码 ES2020）", () => {
    expect(readTarget(TSCONFIG_B)).toBe("ES2017");
  });
  it("缺 target → null", () => {
    expect(readTarget("{}")).toBeNull();
  });
  it("target 不是 string → null", () => {
    expect(readTarget('{"compilerOptions":{"target":2020}}')).toBeNull();
  });
  it("非法 JSON 抛 NO_JSON", () => {
    const err = catchErr(() => readTarget("{"));
    expect(err).toBeInstanceOf(Error);
    expect((err as Error).message).toBe("NO_JSON");
  });
});

describe("readModuleKind", () => {
  it("A：ESNext", () => {
    expect(readModuleKind(TSCONFIG_A)).toBe("ESNext");
  });
  it("B：CommonJS（第二份 fixture，防硬编码）", () => {
    expect(readModuleKind(TSCONFIG_B)).toBe("CommonJS");
  });
  it("缺 module → null", () => {
    expect(readModuleKind('{"compilerOptions":{"strict":true}}')).toBeNull();
  });
  it("根是数组 → null", () => {
    expect(readModuleKind("[]")).toBeNull();
  });
  it("非法 JSON 抛 NO_JSON", () => {
    const err = catchErr(() => readModuleKind("{"));
    expect(err).toBeInstanceOf(Error);
    expect((err as Error).message).toBe("NO_JSON");
  });
});

describe("strictImplies", () => {
  it("noImplicitAny 随 strict 打开", () => {
    expect(strictImplies("noImplicitAny")).toBe(true);
  });
  it("strictNullChecks 随 strict 打开", () => {
    expect(strictImplies("strictNullChecks")).toBe(true);
  });
  it("useUnknownInCatchVariables 也在白名单", () => {
    expect(strictImplies("useUnknownInCatchVariables")).toBe(true);
  });
  it("alwaysStrict / noImplicitThis / 其余白名单", () => {
    expect(strictImplies("alwaysStrict")).toBe(true);
    expect(strictImplies("noImplicitThis")).toBe(true);
    expect(strictImplies("strictBindCallApply")).toBe(true);
    expect(strictImplies("strictFunctionTypes")).toBe(true);
    expect(strictImplies("strictPropertyInitialization")).toBe(true);
  });
  it("target 不是随 strict 打开的检查", () => {
    expect(strictImplies("target")).toBe(false);
  });
  it("jsx / skipLibCheck / strict 本身 → false", () => {
    expect(strictImplies("jsx")).toBe(false);
    expect(strictImplies("skipLibCheck")).toBe(false);
    expect(strictImplies("strict")).toBe(false);
  });
  it("空字符串 → false", () => {
    expect(strictImplies("")).toBe(false);
  });
});

describe("declareFunctionLine", () => {
  it("商品查询一行", () => {
    expect(declareFunctionLine("lookupProduct", "sku: string", "Product | null")).toBe(
      "declare function lookupProduct(sku: string): Product | null;",
    );
  });
  it("金额计算（两参数，防硬编码 lookupProduct）", () => {
    expect(
      declareFunctionLine("calcLineTotal", "price: number, quantity: number", "number"),
    ).toBe("declare function calcLineTotal(price: number, quantity: number): number;");
  });
  it("无参数", () => {
    expect(declareFunctionLine("ping", "", "void")).toBe("declare function ping(): void;");
  });
  it("返回联合类型", () => {
    expect(declareFunctionLine("stockOf", "sku: string", "number | null")).toBe(
      "declare function stockOf(sku: string): number | null;",
    );
  });
});

describe("shopApiDts", () => {
  it("精确快照（含末尾换行）", () => {
    expect(shopApiDts()).toBe(SHOP_API_DTS);
  });
  it("trim 后正好三行（与骨架注释一致）", () => {
    expect(shopApiDts().trimEnd().split("\\n")).toEqual([
      "declare function lookupProduct(sku: string): { name: string; price: number } | null;",
      "declare function calcLineTotal(price: number, quantity: number): number;",
      "declare const SHOP_VERSION: string;",
    ]);
  });
  it("两次调用稳定", () => {
    expect(shopApiDts()).toBe(shopApiDts());
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
    `> **预计**：0.5 天 ｜ **前置**：Ch02（结构类型）、Ch01（类型蒸发）、Ch07（zod 是运行时门卫）
> **目标**：① 知道 \`strict\` 开了什么；② 第三方 JS 为何需要 \`@types\`；③ \`.d.ts\` 是什么。
> 你 15 年 Java：\`javac\` **没有**「把类型检查关掉」的开关。Python 的 mypy 默认很松，像 \`"strict": false\`。

> 📐 **本教程的契约**：下面每一节（§10.1–§10.5）都**精确对应**作业里的题。讲过的才考，考的必讲过。卡住时按作业函数名回查对应小节。
> **不讲**：多项目引用、路径别名大战。

---`,
    [],
  ),
  sec(
    "sec-map",
    "🗺️ 本章地图",
    null,
    `本章作业是一条完整主线：**先读一份精简 tsconfig 字符串，再给无类型的 \`shop.js\` 写出声明文本**。7 个函数，不碰文件系统。

读完这章 + 完成作业，你将能够：

- 说出 \`compilerOptions.strict\` 和 Java \`javac\`、Python \`mypy --strict\` 怎么对
- 分清「显式 \`noImplicitAny\`」和「被 strict 暗示」
- 点到为止地读 \`target\` / \`module\`（本课心里：ES2020 + ESM）
- 列出随 \`strict\` 一起打开的那一捆标志
- 写出 \`declare function\` 一行，知道它**不会**变成运行时函数
- 给一份 JS 商店 SDK 交一份 \`.d.ts\` 快照，并理解 \`@types/xxx\` 是同一回事

**作业 ↔ 教程对应表**（学哪节，就去做哪题）：

| 作业题 | 对应小节 | 核心知识点 |
|--------|----------|-----------|
| \`readStrict\` | §10.1 | \`compilerOptions.strict\` |
| \`readNoImplicitAny\` | §10.2 | 显式标志，或由 strict 暗示 |
| \`strictImplies\` | §10.2 | 哪些标志跟着 strict 一起开 |
| \`readTarget\` | §10.3 | \`target\`（点到为止） |
| \`readModuleKind\` | §10.3 | \`module\` |
| \`declareFunctionLine\` | §10.4 | \`declare function\` 文本 |
| \`shopApiDts\` | §10.5 | 给无类型 JS 商店 API 的环境声明快照 |

---`,
    [],
  ),
  sec(
    "sec-path",
    "⏱️ 学习路径：费曼五步（约 40–60 分钟）",
    null,
    `| 步 | 你要做 | 在哪做 |
|----|--------|--------|
| ① 预览猜（2 分钟） | 看下面的差异，先猜 TS 怎么实现 | 本页 ① |
| ② 先动手 | 每节后面的编辑器里**先试着写** | 本节练习 |
| ③ 提取+反馈 | 点「运行测试」看红绿 | 本节练习 |
| ④ 费曼（2 分钟） | 大白话讲清「.d.ts 为什么不是运行时校验」 | 本页 ④ |
| ⑤ 存闪卡 | 章末闪卡标复习日期 | 闪卡 |

> 💡 别从头读到尾。先扫 ① → 写作业 → **哪题卡了，回对应 § 查** → 改 → 再跑。
> 解析 tsconfig 的四题套路一样（\`JSON.parse\` + 读 \`compilerOptions\`）。\`shopApiDts\` 请复用 \`declareFunctionLine\`。

---`,
    [],
  ),
  sec(
    "sec-guess",
    "① 预览猜（2 分钟 · 激活你的 Java / Python 直觉）",
    null,
    `先别看答案，凭经验猜一猜（猜错没关系）：

1. Java 能在 \`pom.xml\` 里写一句话，让 javac **允许**未声明类型的参数吗？TS 的 \`"strict": false\` 在干什么？
2. Python 项目没跑 mypy，类型注解还在不在？TS 项目没开 \`noImplicitAny\`，\`function f(x)\` 的 \`x\` 是什么类型？
3. \`"strict": true\` 的同时又写 \`"noImplicitAny": false\`，哪个说了算？
4. \`declare function lookupProduct(sku: string): Product | null;\` 跑起来会不会真的有一个函数？发出去的 JS 里有这行吗？
5. 给 \`shop.js\` 写了完美的 \`.d.ts\`，接口却返回 \`{ name: 1 }\`。tsc 会挡吗？运行时谁挡？
6. \`@types/node\` 装的是 Node 运行时，还是一堆 \`.d.ts\`？

> 猜完，带着验证心态进入正文。第 4、5 题是本章的 🔴。

---`,
    [],
  ),
  sec(
    "sec-world",
    "世界地图：tsconfig、声明文件、蒸发 🔴",
    null,
    `先把三样东西分清。后面每一节都建立在这张图上。

| | Java | Python | TypeScript |
|---|---|---|---|
| 类型开没开 | **javac 一直严**，没有「strict 关掉」 | mypy **可选**；\`--strict\` 才一捆打开 | \`compilerOptions.strict\`（默认老项目常是关） |
| 第三方库的类型 | \`.class\` / 源码里自带 | 可能有 \`.pyi\` stub | **\`.d.ts\`**，或缺则装 \`@types/xxx\` |
| 运行时 | bytecode 还留着类型给 JVM | 注解不强制 | **蒸发**（Ch01 讲过） |

### 一份最小 tsconfig（心里这张就够）

\`\`\`json
{
  "compilerOptions": {
    "strict": true,
    "target": "ES2020",
    "module": "ESNext"
  }
}
\`\`\`

作业解析的是 **JSON 字符串**，不是磁盘文件。真实 \`tsconfig.json\` 允许注释和尾逗号（JSONC）；\`JSON.parse\` 不吃那套，所以本题给的都是合法 JSON。

> 🟡 **和 Python 课的衔接**：没开 mypy ≈ \`"strict": false\`。开了 \`mypy --strict\` ≈ \`"strict": true\`。差别是 TS 的开关写在 JSON 里，且 **tsc 默认就会跑**（只要你用 tsc / 编辑器）；mypy 要你主动跑。

### 电商主线

仓库里有一份老的 **\`shop.js\`**（没有类型）：查商品、算行金额。Ch07 用 zod 挡脏 JSON；Ch23 的 Agent 会调这两个函数。没有声明文件时，tsc 要么 **找不到名字**，要么把入参收成 **any**——strict 等于白开。

### 本课怎么算「会了」

编辑器红线 ≈ tsc 读了 tsconfig + \`.d.ts\`。点「运行测试」≈ 跑 JS（声明已经蒸发）。**测试全绿 = 这题掌握。**

---`,
    [],
  ),
  sec(
    "sec-10.1",
    "§10.1 \`compilerOptions.strict\`（对应：`readStrict`）🟡",
    "10.1",
    `### Java 对照：没有「把检查关掉」

\`javac\` 看到 \`void f(x)\` 这种没类型的参数，直接编译失败。你不能在配置里写 \`strict: false\` 让它闭嘴。

### Python 对照：mypy 默认很松

\`\`\`python
def lookup_product(sku):   # 没注解
    ...
\`\`\`

不跑 mypy，什么都不发生。跑了但不加 \`--strict\`，很多隐式 Any 也不会当错误。**这很像 TS 的 \`"strict": false\`。**

### TypeScript：一个布尔开关

\`\`\`ts
function readStrict(tsconfigJson: string): boolean {
  let parsed: unknown;
  try {
    parsed = JSON.parse(tsconfigJson);
  } catch {
    throw new Error("NO_JSON");
  }
  if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) {
    return false; // 没有 compilerOptions
  }
  const co = (parsed as Record<string, unknown>).compilerOptions;
  const opts =
    co !== null && typeof co === "object" && !Array.isArray(co)
      ? (co as Record<string, unknown>)
      : {};
  return !!opts.strict;
}
\`\`\`

### 真实场景

\`\`\`ts
readStrict('{"compilerOptions":{"strict":true}}');   // true
readStrict('{"compilerOptions":{"strict":false}}');  // false
readStrict("{}");                                    // false  ← 缺省当没开
readStrict("{");                                     // 抛 Error("NO_JSON")
\`\`\`

后面三题的 \`JSON.parse\` + 取 \`compilerOptions\` 都是这一套。非法 JSON **统一** \`throw new Error("NO_JSON")\`（message 必须是这六个字母，测试会查）。

### ❌ / ✅

\`\`\`ts
// ❌ import fs from "node:fs"；再读真实文件 —— 浏览器章禁止，本题入参就是字符串
// ❌ JSON.parse 失败把 SyntaxError 原样抛出去（message 不是 "NO_JSON"）
// ❌ 缺 strict 返回 null / undefined
// ✅ 缺 → false；!! 一下；catch 后 throw new Error("NO_JSON")
\`\`\`

> ✅ **做 \`readStrict\`**：parse → 取 \`compilerOptions\`（没有就 \`{}\`）→ \`!!strict\`。

---`,
    ["readStrict"],
  ),
  sec(
    "sec-10.2",
    "§10.2 \`noImplicitAny\` 与 strict 那一捆（对应：`readNoImplicitAny`、`strictImplies`）🔴",
    "10.2",
    `\`strict\` **不是**单独一项检查，而是一捆开关的总闸。这是 Java 老手最容易漏的点：javac 没有菜单；TS 有。

### 随 \`strict: true\` 打开的标志（本题白名单，记住这 8 个）

\`noImplicitAny\` · \`strictNullChecks\` · \`noImplicitThis\` · \`alwaysStrict\` · \`strictBindCallApply\` · \`strictFunctionTypes\` · \`strictPropertyInitialization\` · \`useUnknownInCatchVariables\`

\`target\` / \`module\` / \`jsx\` / \`skipLibCheck\` **不在**这捆里。\`strict\` 自己也不是「被自己暗示的成员」。

> 作业 \`strictImplies(flag)\` 是纯白名单：不 parse JSON。\`flag\` 在集合里 → \`true\`，否则 \`false\`。

### \`noImplicitAny\`：显式优先，否则看 strict

没标类型的参数，在 \`noImplicitAny\` 打开时是错误；关掉就是 \`any\`（Ch01 说的「编辑器不红」）。

规则（作业要写的）：

1. \`noImplicitAny\` **显式是 boolean** → 用它（可以覆盖 strict）
2. 否则 \`strict === true\` → \`true\`（暗示）
3. 否则 \`false\`

\`\`\`ts
readNoImplicitAny('{"compilerOptions":{"strict":true}}');
// true  ← 没写 noImplicitAny，被 strict 带上

readNoImplicitAny('{"compilerOptions":{"strict":true,"noImplicitAny":false}}');
// false ← 显式覆盖。总闸开着，也可以把某一项拧回去

readNoImplicitAny("{}");
// false
\`\`\`

\`typeof co.noImplicitAny === "boolean"\` 才算显式。缺这个键、或写了别的类型，走暗示逻辑。

### ❌ / ✅

\`\`\`ts
// ❌ 只看 strict，忽略显式 noImplicitAny: false
// ❌ 只看 noImplicitAny，忽略「strict 暗示」
// ❌ 把 "target" 算进 strictImplies
// ✅ 显式 boolean 优先；白名单用 Set / 数组
\`\`\`

> ✅ **做 \`readNoImplicitAny\`**：parse 同 §10.1，再按三条规则。
> ✅ **做 \`strictImplies\`**：八个字符串的白名单，不要去读 tsconfig。

---`,
    ["readNoImplicitAny", "strictImplies"],
  ),
  sec(
    "sec-10.3",
    "§10.3 \`target\` 与 \`module\`（对应：`readTarget`、`readModuleKind`）🟡",
    "10.3",
    `这两项**点到为止**。本课心里记：**\`target\`: ES2020**，模块按 **ESM / bundler** 理解 \`import\` / \`export\`。不卷打包器，也不讲 AMD / UMD。

### \`target\`：发出哪一代 JS

\`tsc\` 要把你写的 TS **擦成 JS**。\`target\` 决定「擦完的语法可以新到哪一年」。ES2020 已经有可选链 \`?.\`、空值合并 \`??\`（Ch03 用过）。再老的环境才需要降。

作业：\`compilerOptions.target\` 是 string 就原样返回，否则 \`null\`。

\`\`\`ts
readTarget('{"compilerOptions":{"target":"ES2020"}}');  // "ES2020"
readTarget('{"compilerOptions":{"target":"ES2017"}}');  // "ES2017"  ← 别写死 ES2020
readTarget("{}");                                       // null
\`\`\`

### \`module\`：\`import\` 怎么发出去

字段名是 \`module\`，作业函数叫 **\`readModuleKind\`**（\`module\` 像关键字，测试套件名必须等于函数名）。

\`\`\`ts
readModuleKind('{"compilerOptions":{"module":"ESNext"}}');    // "ESNext"
readModuleKind('{"compilerOptions":{"module":"CommonJS"}}');  // "CommonJS"
readModuleKind("{}");                                         // null
\`\`\`

本课后面的 local 章用 Bun，按 ESM 想就行。看到 CommonJS 的 \`require\` 认识即可，不考。

### ❌ / ✅

\`\`\`ts
// ❌ return "ES2020" 写死 —— 测试有第二份 fixture
// ❌ 缺字段返回 "" 而不是 null
// ❌ 函数命名成 readModule —— 对不上 testSuite
// ✅ typeof xxx === "string" ? xxx : null
\`\`\`

> ✅ **做 \`readTarget\` / \`readModuleKind\`**：parse 同 §10.1，分别读 \`target\` 和 \`module\`。

---`,
    ["readTarget", "readModuleKind"],
  ),
  sec(
    "sec-10.4",
    "§10.4 \`declare function\`（对应：`declareFunctionLine`）🔴",
    "10.4",
    `\`shop.js\` 里真有 \`lookupProduct\`。你的 \`.ts\` 文件要**调用**它。tsc 不读 \`shop.js\` 的实现当类型，它只看声明。

### \`function\` vs \`declare function\`

\`\`\`ts
function calcLineTotal(price: number, quantity: number): number {
  return price * quantity;   // 有函数体 → 发出 JS，运行时存在
}

declare function lookupProduct(sku: string): Product | null;
// 没有函数体 → 不发出 JS，只告诉 tsc「这个名字存在，签名长这样」
\`\`\`

🔴 **\`declare\` 行在运行时蒸发。** 和 Ch01 的 \`: number\` 同一命运。浏览器里点运行，看不到这行函数。

### Java / Python 对照

Java 没有单独的「只给编译器看的函数行」这种常用写法；第三方库的类型在 \`.class\` 里。最接近的是 \`native\` 方法或接口方法——有签名、没有你写的方法体。

Python 对标 **\`.pyi\` stub**：

\`\`\`python
def lookup_product(sku: str) -> Product | None: ...
\`\`\`

### 本题只拼字符串

\`\`\`ts
function declareFunctionLine(name: string, params: string, ret: string): string {
  return \`declare function \${name}(\${params}): \${ret};\`;
}

declareFunctionLine("lookupProduct", "sku: string", "Product | null");
// "declare function lookupProduct(sku: string): Product | null;"

declareFunctionLine("ping", "", "void");
// "declare function ping(): void;"
\`\`\`

空格、分号、\`function\` 这个词都要精确。测试是 \`toBe\` 快照。

> ✅ **做 \`declareFunctionLine\`**：一行模板字符串，末尾分号。

---`,
    ["declareFunctionLine"],
  ),
  sec(
    "sec-10.5",
    "§10.5 给 \`shop.js\` 写 \`.d.ts\`（对应：`shopApiDts`）🔴",
    "10.5",
    `把三行环境声明收成一份小文件——这就是你会放进 \`shop.d.ts\` 的内容。作业**返回字符串**，不写盘。

### 无类型 JS 会怎样

\`shop.js\` 大概长这样（实现你看不到也没关系）：

\`\`\`js
export function lookupProduct(sku) { /* 查货架 */ }
export function calcLineTotal(price, quantity) { return price * quantity; }
export const SHOP_VERSION = "1.0.0";
\`\`\`

在 TS 里 \`import { lookupProduct } from "./shop.js"\`：

- 没有声明 → **找不到模块 / 找不到名字**，或参数变成 **any**
- 有下面这份 \`.d.ts\` → 编辑器开始检查 \`sku\` 必须是 string

### 精确快照（测试 \`toBe\` 这一份，末尾带换行）

\`\`\`ts
declare function lookupProduct(sku: string): { name: string; price: number } | null;
declare function calcLineTotal(price: number, quantity: number): number;
declare const SHOP_VERSION: string;
\`\`\`

\`declare const\` 和环境变量、SDK 版本号同一套路：告诉 tsc「这个名字在运行时会有，类型是 string」，**不真的赋值**。

前两行请复用 \`declareFunctionLine\`：

\`\`\`ts
function shopApiDts(): string {
  return [
    declareFunctionLine(
      "lookupProduct",
      "sku: string",
      "{ name: string; price: number } | null",
    ),
    declareFunctionLine(
      "calcLineTotal",
      "price: number, quantity: number",
      "number",
    ),
    "declare const SHOP_VERSION: string;",
  ].join("\\n") + "\\n";
}
\`\`\`

### 🟡 \`@types/xxx\` 就是别人写好的 \`.d.ts\`

Node 的 \`fs\` / \`http\` 是 JavaScript。你装的 \`@types/node\`（DefinitelyTyped）是社区给这份 JS 补的声明包。lodash 没自带类型时，再装 \`@types/lodash\`。**装的是类型，不是第二份运行时。**

### 🔴 \`.d.ts\` 不是 zod

对照 Ch01：类型蒸发。对照 Ch07：zod 在**运行时** parse JSON。

\`shop.d.ts\` 写着 \`name: string\`。若 \`shop.js\` 真返回 \`{ name: 1 }\`：

- tsc **不挡**（它不运行 shop.js）
- 本页测试也**不挡**（测的是你返回的声明文本）
- 要挡脏数据 → Ch07 的 \`z.object\`

**.d.ts 是给编译器的图纸；zod 是门口的安检。**

### ❌ / ✅

\`\`\`ts
// ❌ 写成真正的 function lookupProduct() { return null } —— 那会进运行时
// ❌ 漏 declare const SHOP_VERSION
// ❌ 多空格、少分号、漏末尾换行
// ✅ 三行 join + 末尾 \\n；复用 declareFunctionLine
\`\`\`

> ✅ **做 \`shopApiDts\`**：快照必须和骨架注释里那三行一致。

---`,
    ["shopApiDts"],
  ),
  sec(
    "sec-pits",
    "§10.6 Java / Python 老手几个坑 ⚠️",
    "10.6",
    `1. **javac 没有 strict 开关。** 别把 Maven compiler plugin 的 \`source/target\` 当成 TS 的 \`strict\`。
2. **mypy 默认 ≠ tsc 开了 strict。** Python 课没跑 mypy 也能交作业；TS 开了 strict，没标类型的 \`sku\` 会红。
3. **\`noImplicitAny: false\` 能覆盖 \`strict: true\`。** 总闸开着，单项可以拧回去。
4. **\`declare function\` 不是函数。** 没有函数体、不进 JS。写成普通 \`function\` 就会要你写 \`return\`。
5. **\`.d.ts\` 不校验 JSON。** 图纸不是门卫。脏数据用 zod（Ch07）。
6. **\`@types/xxx\` 不是运行时依赖。** 它只给 tsc 看。别指望装了 \`@types/node\` 机器上就多出一个 Node。
7. **作业禁止 \`import fs\`。** 解析的是字符串。真实项目才会 \`tsc --showConfig\` 读文件。
8. **不讲多项目引用、路径别名。** 看见别慌，本章不考。

---`,
    [],
  ),
  sec(
    "sec-homework",
    "📝 本章作业",
    null,
    `上面 7 个函数按节交错出现。每个注释里有【场景】【转换点】、示例和提示。

**完成方式**：在编辑器里改 \`throw new Error("TODO")\`，点「▶ 运行测试」。全绿 = 这题过了。

卡住就回对应 §：\`readNoImplicitAny\` → §10.2，\`declareFunctionLine\` → §10.4，\`shopApiDts\` → §10.5。

---`,
    [],
  ),
  sec(
    "sec-check",
    "✅ 自测：你真的掌握了吗？",
    null,
    `- [ ] 能说清 javac 一直严、mypy 可选、TS 用 \`strict\` 总闸
- [ ] 知道 \`noImplicitAny\` 可被显式覆盖，也可被 strict 暗示
- [ ] 能列出至少 4 个随 strict 打开的标志，并知道 \`target\` 不在其中
- [ ] 能一句话解释 \`target\` / \`module\`（ES2020 + ESM 即可）
- [ ] 能区分 \`function\` 和 \`declare function\`
- [ ] 知道 \`.d.ts\` / \`@types\` 蒸发，挡不住脏 JSON
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

1. 「我已经写了 \`strict: true\`，为什么同事还能用 \`noImplicitAny: false\` 把隐式 any 放回来？strict 到底开了什么？」— 卡壳重读 §10.1 + §10.2
2. 「给 \`shop.js\` 写了 \`.d.ts\`，是不是就等于 Pydantic / zod 了？运行时 \`name\` 变成数字谁负责？」— 卡壳重读 §10.5 + 回想 Ch01 / Ch07
3. 「\`declare function lookupProduct(...)\` 和普通 function 差在哪？Python 的 \`.pyi\` 像不像这个？」— 卡壳重读 §10.4

---`,
    [],
  ),
  sec(
    "sec-next",
    "⏭️ 下一步",
    null,
    `Ch10 掌握后，进 **Ch11 · fetch、JSON、Stream 概念**。\`JSON.parse/stringify\` 的类型化（zod 只调用不重讲）、\`ReadableStream\` 是 SSE / LLM 流的底层。作业用假 fetch / 假 reader，禁止真实网络。\`.d.ts\` 给编译器看形状；下一章处理**真的字节和 JSON 字符串**。`,
    [],
  ),
];

const tutorialMd = `# Ch10 · tsconfig 与声明文件

${sections
  .map((s) => (s.heading ? `## ${s.heading}\n\n${s.body}` : s.body))
  .join("\n\n")}
`;

const reviewMd = `# Ch10 · 记忆闪卡

> 先回忆，再翻答案。连续 2 次秒答 → 退役。

## 🔖 闪卡

| # | 正面（问题） | 背面（答案） | 掌握 |
|---|---|---|---|
| 1 | \`"strict": true\` 是单项检查还是一捆？举 3 个跟着开的标志 | **一捆**。\`noImplicitAny\`、\`strictNullChecks\`、\`noImplicitThis\`、\`alwaysStrict\`、\`strictBindCallApply\`、\`strictFunctionTypes\`、\`strictPropertyInitialization\`、\`useUnknownInCatchVariables\` | ⬜ |
| 2 | javac 有没有类似 \`"strict": false\` 的总闸？mypy 呢？ | javac 一直严，没有这开关。mypy 默认松，\`--strict\` 才一捆打开，像 TS 的 strict | ⬜ |
| 3 | \`strict: true\` 但 \`noImplicitAny: false\`，隐式 any 还拦吗？ | **不拦**。显式 boolean 覆盖总闸里的那一项 | ⬜ |
| 4 | 只写了 \`strict: true\`、没写 \`noImplicitAny\`，\`readNoImplicitAny\` 应返回什么？ | \`true\`（被 strict 暗示）。空 tsconfig 才是 false | ⬜ |
| 5 | \`function f() {}\` 和 \`declare function f(): void;\` 运行时差在哪？ | 前者发出 JS，运行时存在。后者只给 tsc 看，**蒸发**，没有函数体 | ⬜ |
| 6 | \`.d.ts\` 能挡住 \`shop.js\` 返回 \`{ name: 1 }\` 吗？该用什么挡？ | 挡不住。声明不是运行时校验。脏 JSON 用 Ch07 的 zod | ⬜ |
| 7 | \`@types/node\` 装的是什么？DefinitelyTyped 是什么？ | 一堆 \`.d.ts\`（给 Node 的 JS API 补类型），不是第二份 Node 运行时。DefinitelyTyped 是社区声明仓库 | ⬜ |
| 8 | \`target\` / \`jsx\` / \`skipLibCheck\` 算不算 strict 那一捆？ | 不算。\`strictImplies\` 对它们返回 false。本课 \`target\` 心里记 ES2020 即可 | ⬜ |
| 9 | 作业为什么禁止 \`import fs\`？非法 JSON 要抛什么？ | 入参是 JSON **字符串**，不读磁盘。非法 → \`throw new Error("NO_JSON")\` | ⬜ |
| 10 | Python \`.pyi\` 和 TS \`.d.ts\` 像在哪？ | 都是「只给类型检查器看的签名 / stub」，运行时不执行。TS 的 \`declare\` 更明确标了「没有 emit」 | ⬜ |

## 🎓 费曼自检

- [ ] 能说清 strict 是一捆，且单项可覆盖
- [ ] 能说清 declare / .d.ts / @types 蒸发，不是运行时门卫
- [ ] 能对照 javac（一直严）和 mypy（可选 strict）
`;

const chapter = {
  id: "ch10",
  num: "10",
  title: "tsconfig 与声明文件",
  runMode: "browser",
  tutorialMd,
  assignment,
  testName: "ch10_assignment",
  testSource,
  reviewMd,
  interleaved: true,
  sections,
  functions,
  preamble,
};

const out = join(dirname(fileURLToPath(import.meta.url)), "../src/content/chapters/ch10.json");
mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, JSON.stringify(chapter, null, 2) + "\n");
console.log("wrote", out);
