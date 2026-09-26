# TypeScript 学习站 · 权威计划

> **本文件是本项目的唯一大纲。** 任何会话（包括清空上下文后）在生成、改写、优化某一章之前，**必须先读本文对应章节 + §4 生成 SOP**。
> 对照项目：`/Users/zy/ai_learn/python_learning`（Java → Python 全栈）。本课是其后的 TypeScript 线。
> 生成章节 = 直接写 `src/content/` 的 JSON，**禁止**另写 `tutorial.md` / `review.md` / 五件套目录。站点就在仓库根目录。

---

## 0. 30 秒定位

面向 **15 年 Java 后端**、且 **Python 课在前** 的学习者。

目标：会写 TypeScript，能做前后端，最后能用 **Pi Agent SDK** 做 Agent。

| 做 | 不做 |
|---|---|
| 语法 / 类型 / JS 背景 / React 前端 / Hono 后端 / Pi Agent | LeetCode、运维、Docker/K8s、教程 markdown 文件 |
| 只做网页；作业在浏览器或本地跑测试 | 先写 md 再烘焙（Python 课那套） |
| M1–M5 共 **26 章** + M6 共 **5 章**（**已完成**，2026-09-26） | 不 clone Pi 仓库当课程内容（读本机安装包 `node_modules/@earendil-works/pi-coding-agent` 内的 docs/dist 即可） |

不重复 Python M5 的 LLM / Prompt / RAG / ReAct 原理。M5 只教 **Pi 的 TypeScript 写法**；M6 教 **怎么读 Pi 本身**（仓库结构 / Agent 循环 / 扩展体系 / Session / 嵌入方式）。

---

## 1. 学习者画像

- Java 很熟：OOP、泛型、Spring、JUnit、Maven。
- Python 课会先学：动态类型、pytest、FastAPI、LLM 概念。
- 本课对照：**Java + 刚学的 Python**，不是从 hello world 教起。
- 真正要小心的是：结构类型、`any`/`unknown`、`this`、Event Loop、类型在运行时蒸发、zod。

---

## 2. 学习方式（和 Python 课同一套）

每章网页上仍是「费曼五步」，但内容都在 JSON 里，没有独立 md：

1. 预览猜（激活 Java/Python 直觉）
2. 交错式：讲完 §N.M → 立刻做对应函数
3. 测试红绿（浏览器或本地）
4. 费曼：大白话讲清 1–2 个「为什么」
5. 闪卡（JSON 里的 `reviewMd`，页面上交互）

铁律：

- **讲过才考，考的必讲过。**
- 每章一条业务主线（默认电商商品/订单；M5 改为「商品助手 Agent」）。
- 禁止 `add(a,b)` / `foo` 玩具题。
- 跳读标记：🟢 秒懂 / 🟡 注意差异 / 🔴 TS 或 JS 特有。

---

## 3. 交付形态

### 3.1 仓库里有什么、没有什么

```
ts_learn_web/                 ← 仓库根 = 站点根（双击 index.html 即用，零构建）
├── PLAN.md
├── AGENTS.md
├── index.html              ← 生成：课程地图
├── chapters/chNN.html      ← 生成：每章一页
├── assets/                 ← css / js / vendor（Monaco、typescript、mermaid）
├── .cursor/rules/
├── package.json            ← 只服务脚本（bun test / mermaid 校验），看站不需要
├── src/
│   ├── types.ts
│   └── content/
│       ├── index.json      ← 模块/章节目录
│       ├── shared.json     ← mock 数据
│       └── chapters/chXX.json
├── scripts/                ← 生成/校验章节 JSON；render-pages.ts 烘静态页
└── local/                  ← 仅 Local 章的可运行 TS（Hono / Pi），无教程 md
```

**禁止创建**：`chXX/tutorial.md`、`review.md`、`SYLLABUS.md`（大纲只在 PLAN.md）、每章一个 markdown 教程目录、再套一层 `web/` 子包。

教程正文、作业骨架、测试、闪卡 **全部写进** `src/content/chapters/chXX.json`。

### 3.2 章节 JSON 约定（生成时必须遵守）

`runMode`：

| 值 | 章节 | 网页 |
|---|---|---|
| `"browser"` | M1 全、M2 全、M3 全 | Monaco + 浏览器转译 TS + 小测试器，交错式 |
| `"local"` | M4 全、M5 全 | 只读教程 + 🔒 + `local/` 路径 + `bun test` 命令 |

字段（与 Python 课 web JSON 对齐，方便套同一套前端）：

```ts
{
  id: "ch01",
  num: "01",
  title: "...",
  runMode: "browser" | "local",
  tutorialMd: string,          // 完整教程（markdown 字符串，不是文件）
  assignment: string,          // TS 骨架，实现处 throw new Error("TODO")
  testName: string,
  testSource: string,
  reviewMd: string,            // 闪卡 markdown 字符串
  interleaved: true,
  sections: [{ id, heading, secNum, body, exerciseFunctions }],
  functions: [{ name, testSuite, skeleton }],
  preamble: string,
  localHint?: string           // 仅 local：仓库路径 + 命令
}
```

格式红线（交错式解析依赖这些）：

1. 教程 H2 里，要挂练习的节必须含 `§N.M`（如 `## §1.2 元组不存在，用元组？不对，TS 用元组 type`）。
2. 文前有「作业 ↔ 教程对应表」，每题一行：`` | `funcName` | §N.M | 知识点 | ``
3. 每个作业函数必须出现在对应表 **且** 出现在某节的 `exerciseFunctions`。
4. 函数名 **camelCase**。测试套件名 `testSuite` = 函数名（浏览器小测试器用这个过滤）。
5. 作业函数顶格 `export function name(...)`（或 `export async function`）。骨架保留签名 + docstring 注释 + `throw new Error("TODO")`。
6. H1：`# Ch{NN} · 标题`（中间是 `·`）。
7. browser 章禁止 import：`hono` / `@hono/*` / `drizzle-orm` / `better-sqlite3` / `@earendil-works/*` / `node:fs` / `node:http`。一旦需要这些 → 必须是 local。

### 3.3 技术栈（搭站时按这个，生成内容时假定已有）

- 站点：零构建静态多页。`src/content/*.json` 经 `bun scripts/render-pages.ts` 生成 `index.html` + `chapters/chNN.html`。日常双击 `index.html`（或 `启动学习站.command`）。主题护眼 / 德古拉。
- browser 运行：本地 Monaco + `assets/js/vendor/typescript.js` 转译 + 自研 `expect()`（不引入 Pyodide）。file:// 下类型红线降级，编辑和判题仍可用。
- M3 可加小组件预览窗。
- 后端：Hono + zod + SQLite/drizzle（轻量）。
- Agent：`@earendil-works/pi-ai` → `pi-agent-core` → `pi-coding-agent`（见 M5）。文档：https://pi.dev/docs/latest/sdk
- 包管理：Bun。

---

## 4. 生成 SOP（用户说「生成 chNN / 学 chNN / 写第 N 章」时）

0. **读本文件**：§0–§5 + 该章在 §7 的大纲。**不扩纲、不缩纲、不把别章内容塞进来。**
1. 看 §9 进度表：已有 `chXX.json` 则先读再改；没有则新建。
2. 内容只写 `src/content/chapters/chXX.json` +（local 章）`local/` 代码；不要借机改大纲或另起子包。
3. 按该章「作业函数」列表写 **完整实现** → 测试能绿 → 再擦成 `throw new Error("TODO")`。
4. 教程按 Python 课优化标准写（§5）：Java/Python 对照、真实场景、❌/✅、对应表、预览猜、费曼、闪卡。
5. `sections` 按 H2 切开，`exerciseFunctions` 挂上。`interleaved: true`。
6. 更新 `src/content/index.json` 该章标题（若还没有该条目，补上）。
7. 内容 JSON 有变就烘静态页：`bun scripts/render-pages.ts`（只改一章可加 `--chapter chNN`）。看站双击 `index.html`，不必 npm / vite。
8. 更新本文件 §9 进度表该章为 ✅ 和日期。
9. **不 git commit**（除非用户明确说提交）。
10. **禁止生成 M6 / Ch27+**，除非用户明确说「M5 学完了，开 M6」或「开始研究 Pi」。

用户说「重新优化 chNN」：同样 SOP，先对照 §5 诊断（≤10 行）再重写，不等确认。

### 4.1 原理 + mermaid（改某章教程时对照）

> 样板章是 **Ch02**。图用 mermaid（不要 D2）。Ch01–Ch26 已按此补完（§9.2），不要再开补图批次。

改某一章教程 / 补图时对照（不扩纲）：

- 只写该章 `src/content/chapters/chXX.json` 教程正文。不改 `assignment` / `testSource` / `functions` / `local/`，不 git commit。
- 先读该章大纲 + 现有 JSON。已有 mermaid：保留能用的，差的补、糊的改，不要无故删光重画。
- **章地图** 1 张（学习路径 / 编译期 vs 运行时 / 数据流，选最能一句话概括本章的那种）。
- 每个 **🔴** 节：第一段代码前 8–15 行「机制」（为什么，不是再抄语法）+ 尽量 1 张关系图。🟡 节按需，不必节节都图。
- 图只画**本章已讲**的关系。禁止把别章知识点画进来。
- 围栏：` ```mermaid `。节点含 `()[]?/=:+` 等必须双引号；每个 `style` 带 `color:#1f1f1f`；subgraph 用 50 色阶浅底，节点用 200 色阶（见 Ch02）。德古拉换色由站点 `MermaidBlock` 做，JSON 不要写第二套色。
- 改完用章节 `sections` **重拼** `tutorialMd`（H1 + 各节 `## heading` + body），两处必须一致。
- 密度参照 Ch02：大约 5–8 张图、3–5 段机制。不要堆成图册。不要重跑 `scripts/gen-chXX.ts`（会覆盖补图）。

---

## 5. 质量标准

### 教程

- 每个知识点 ≥ 2 例：1 个 Java（或 Python）对照最小例 + 1 个电商/Agent 场景例。不用 foo/bar。
- Java 老手易错点：❌ → ✅ 成对出现。
- 作业用到的每个知识点必须有专节；不讲作业用不到的东西（可放「延伸阅读」并标明不考）。
- **原理与图**（样板：Ch02）：每个 🔴 转换点在第一段代码前用 8–15 行讲清「为什么」；每章至少 1 张章地图 + 若干关系图。图用 ` ```mermaid `（站点已渲成 SVG）。节点含特殊字符必须加双引号；`style` 写 `color:#1f1f1f`（德古拉由 `MermaidBlock` 换色）。不扩纲、不改作业/测试；`tutorialMd` 与 `sections[].body` 同步。

### 作业

- 6–10 个导出函数（M3 前端章允许部分是纯函数 + 1 个小组件）。
- 每题注释含【场景】【转换点】任务、≥ 2 个输入→输出示例、提示（点知识点，不给完整答案）。
- 最后一题尽量复用前面函数。

### 测试

- 每函数一组：正常 ≥ 2、边界 ≥ 1。
- 断言值手工验算；mock 与 `shared.json` 一致。
- 能拦住硬编码/蒙对。

### 闪卡

- 覆盖全部 🔴/🟡；正面具体问题，背面 ≤ 3 行。

---

## 6. 课程地图（现行：31 章 / 6 模块）

| 模块 | id | 目录 | 章节 | runMode |
|---|---|---|---|---|
| M1 TypeScript 语言核心 | m1 | — | Ch01–07 | browser |
| M2 背景知识 | m2 | — | Ch08–11 | browser |
| M3 Web 前端 | m3 | — | Ch12–16 | browser |
| M4 Web 后端 | m4 | `local/m4/` | Ch17–21 | local |
| M5 用 Pi 做 Agent | m5 | `local/m5/` | Ch22–26 | local |
| M6 研究 Pi | m6 | `local/m6/` | Ch27–31 | local |

`index.json` 的 `available`：M1–M6 全为 `true`。M6 各章**无 `app.ts`**（研究章不建 HTTP 服务，真代码进 `demo.ts` 复制区）。

---

## 7. 逐章大纲

共享 mock（写入 `shared.json`，各章共用）：`products.json`（10 个商品，字段 `id, name, category, price, stock, sku`，与 Python 课同款数据，其中 `CP-009` 库存为 0）。

---

# M1 · TypeScript 语言核心（Ch01–Ch07）

> 目标：别写出「Java 语法拼的 TS」，也别把 TS 当成「带类型的 Python」。

---

## Ch01 · 世界地图 & 工具链 & 第一个带类型的函数

**预计**：1 天 ｜ **前置**：无 ｜ **runMode**：browser

**目标**：分清 JS / TS / 浏览器 / Node / Bun；写出带类型的函数并让测试全绿。

**对照**：

| 概念 | Java | Python | TypeScript |
|---|---|---|---|
| 编译 | javac | 解释 + mypy 可选 | `tsc` 擦类型，发出 JS |
| 运行 | JVM | CPython | 浏览器或 Node/Bun 跑 JS |
| 类型 | 硬约束 | 注解不强制 | **编译期硬约束，运行时蒸发** |
| 包 | Maven | uv | bun / npm + `package.json` |

**知识点**：`.ts` vs `.js`；类型注解在参数/返回值；`tsc` 与 Bun 直接跑；本课「测试全绿 = 掌握」；和 Python 注解的关键差别（TS 真的会挡）。

**主线**：电商金额/SKU 工具函数（可与 Python Ch01 同题，改成 TS 真正检查类型）。

**作业函数**（必须全有，可加减说明不可换主线）：

| 函数 | § | 知识点 |
|---|---|---|
| `calcLineTotal` | §1.1 | 类型注解 + number |
| `parseSku` | §1.2 | 元组 ` [string, number]`、split |
| `formatPriceTag` | §1.3 | 默认参数、模板字符串、`.toFixed(2)` |
| `renderPriceList` | §1.3 | `map` + `join` |
| `firstInStockName` | §1.4 | `T \| null`、提前 return（**不要**教 JS truthiness 当主方案，显式 `stock > 0`） |
| `debugTypeName` | §1.5 | `typeof` vs TS 类型（运行时只剩 JS） |
| `outOfStockSkus` | §1.6 | 对象类型、过滤 |
| `inventorySummary` | §1.6 | 聚合 + 对象字面量 |

**不讲**：结构类型（Ch02）、泛型（Ch04）、zod（Ch07）、React。

---

## Ch02 · 结构类型 vs 名义类型

**预计**：1 天 ｜ **前置**：Ch01 ｜ **runMode**：browser ｜ **🔴 本课最重要的一章**

**目标**：理解「形状一样就能赋值」；知道多余属性检查、类型别名 vs interface。

**对照**：Java `class Dog` 不能赋给无关的 `class Cat`（名义类型）；TS 只看结构。Python Protocol 接近，但运行时不查。

**知识点**：structural typing；fresh object excess property check；`interface` vs `type`；可选属性 `?`；只读 `readonly`；索引签名点到为止。

**主线**：商品 `Product`、订单行 `OrderLine` 两个接口互相赋值、函数参数兼容。

**作业函数**：

| 函数 | § | 知识点 |
|---|---|---|
| `labelProduct` | §2.1 | 只要求有 `name`+`price` 的结构即可 |
| `asOrderLine` | §2.2 | 结构兼容、多余字段 |
| `pickSku` | §2.3 | interface 最小结构 |
| `mergeNamed` | §2.4 | 两个 interface 合并形状 |
| `freezeName` | §2.5 | readonly |
| `acceptDuck` | §2.6 | 函数参数结构类型（鸭子） |
| `assertProductShape` | §2.7 | 类型谓词雏形（返回 boolean，真正谓词在 Ch03） |

**不讲**：判别联合（Ch03）、泛型（Ch04）。

---

## Ch03 · 联合、字面量、narrowing

**预计**：1 天 ｜ **前置**：Ch02 ｜ **runMode**：browser

**目标**：会写 `string | null`、判别联合；会用 `typeof` / `in` / 等值缩小。Agent 工具结果几乎全是这个。

**对照**：Java Optional / sealed class；Python `str | None` + match。

**知识点**：union、literal、`strictNullChecks`、narrowing、discriminated union（`type: "ok" | "err"`）、可选链 `?.`、空值合并 `??`。**不要**用 `== null` 讲一堆 JS 怪癖，用 TS 写法。

**主线**：库存查询结果 = 成功 | 缺货 | 找不到。

**作业函数**：

| 函数 | § | 知识点 |
|---|---|---|
| `formatOptionalPrice` | §3.1 | `number \| null` |
| `statusLabel` | §3.2 | 字面量联合 `"in_stock" \| "out"` |
| `narrowId` | §3.3 | `string \| number` + typeof |
| `readField` | §3.4 | `in` narrowing |
| `handleStockResult` | §3.5 | 判别联合 |
| `priceOrZero` | §3.6 | `??` vs `\|\|`（0 元商品） |
| `summarizeResults` | §3.7 | 联合数组综合 |

---

## Ch04 · 泛型与工具类型

**预计**：1 天 ｜ **前置**：Ch03 ｜ **runMode**：browser

**目标**：会写 `function first<T>`；会用 `Partial` / `Pick` / `Omit` / `Record`。条件类型只在延伸阅读。

**对照**：Java 泛型（有擦除、有不变性）；Python `TypeVar`。

**知识点**：泛型函数、约束 `extends`、工具类型上述四个、`Array<T>`。不讲 `infer`、不讲递归条件类型。

**主线**：商品补丁、按类目建索引。

**作业函数**：

| 函数 | § | 知识点 |
|---|---|---|
| `firstOf` | §4.1 | 泛型函数 |
| `pluck` | §4.2 | `keyof` + 泛型 |
| `patchProduct` | §4.3 | `Partial<Product>` |
| `catalogCard` | §4.4 | `Pick<Product, "name" \| "price">` |
| `withoutStock` | §4.5 | `Omit` |
| `indexBySku` | §4.6 | `Record<string, Product>` |
| `groupByCategory` | §4.7 | 综合 |

---

## Ch05 · 函数、模块、this、解构

**预计**：1 天 ｜ **前置**：Ch04 ｜ **runMode**：browser

**目标**：ESM `import/export`；解构与 rest；搞清 `this` 陷阱（Java 老手会栽）。

**知识点**：named / default export（本课 **作业只用 named export**）；解构、rest、spread；箭头函数词法 `this`；`void` 返回；函数类型 `(x: A) => B`。不讲 namespace、不讲 require。

**主线**：订单行计算拆成模块函数。

**作业函数**：

| 函数 | § | 知识点 |
|---|---|---|
| `discountedPrice` | §5.1 | 箭头函数、函数类型 |
| `splitSku` | §5.2 | 解构 |
| `restTags` | §5.3 | rest 参数 |
| `mergeProductPatch` | §5.4 | spread |
| `bindCounter` | §5.5 | this / 箭头（返回闭包计数，避免 DOM） |
| `pipePrice` | §5.6 | 函数当值传递 |
| `exportMarker` | §5.7 | 再导出组合（调用前面函数） |

---

## Ch06 · Promise、async/await、错误

**预计**：1 天 ｜ **前置**：Ch05 ｜ **runMode**：browser

**目标**：会写 async 函数；`catch` 的 err 是 `unknown`；`Promise.all`。对照 Python asyncio、Java CompletableFuture。

**知识点**：Promise 状态；async/await；`unknown` + 收窄；`Promise.all` / `allSettled`（allSettled 可考一题）；不要把假 fetch 写成依赖网络——用返回 Promise 的 mock 函数。

**主线**：并行拉多个商品详情（内存 mock）。

**作业函数**：

| 函数 | § | 知识点 |
|---|---|---|
| `delayValue` | §6.1 | 包装 Promise |
| `loadProductAsync` | §6.2 | async/await |
| `loadOrThrow` | §6.3 | 抛错 |
| `readErrorMessage` | §6.4 | `unknown` narrowing |
| `loadMany` | §6.5 | `Promise.all` |
| `loadManySettled` | §6.6 | `allSettled` 摘要 |
| `retryOnce` | §6.7 | 失败再试一次 |

---

## Ch07 · 运行时校验：zod

**预计**：1 天 ｜ **前置**：Ch06 ｜ **runMode**：browser

**目标**：明白 **TS 类型编译后蒸发**；边界数据必须用 zod。为 M4/M5 铺路。

**知识点**：`z.object` / `z.array` / `z.infer`；`safeParse` vs `parse`；错误路径。浏览器章可用 zod（纯 JS，允许）。**不要**上 trpc。

**主线**：校验 `products.json` 形状、校验「工具调用参数」。

**作业函数**：

| 函数 | § | 知识点 |
|---|---|---|
| `productSchema` | §7.1 | 导出 schema（测试 parse 合法商品） |
| `parseProduct` | §7.2 | parse 成功 |
| `safeParseProduct` | §7.3 | safeParse 失败返回 null |
| `parseProductList` | §7.4 | z.array |
| `Product` 类型 | — | `z.infer`（若不能当函数，则 `parseAndLabel` 使用推断类型） |
| `parseAndLabel` | §7.5 | infer |
| `parseToolArgs` | §7.6 | 工具参数对象（为 Agent 铺路） |
| `parseOrderPayload` | §7.7 | 综合 |

---

# M2 · 背景知识（Ch08–Ch11）

> 不是运维。是「为什么前端和 Agent 代码长这样」。

---

## Ch08 · Event Loop

**预计**：0.5–1 天 ｜ **前置**：Ch06 ｜ **runMode**：browser

**目标**：能口述宏任务/微任务顺序；理解流式回调为什么「看起来乱」。

**知识点**：call stack、macrotask（setTimeout）、microtask（Promise.then / queueMicrotask）；async 函数在 await 后的续体是微任务。**用可测的记录数组**（push 顺序）当作业，不要依赖真实计时器精度（可用假队列函数注入）。

**作业函数**：记录执行顺序的 `explainOrderA/B/C`、`queueVsTimeout`、`asyncBreak`、`flushMicrotasks` 等 6 题，全部纯函数 + 注入的 `scheduleMacro`/`scheduleMicro`，便于测试。

**不讲**：Node libuv 细节、集群、进程。

---

## Ch09 · 包与运行时

**预计**：0.5 天 ｜ **前置**：Ch01 ｜ **runMode**：browser

**目标**：能读 `package.json`；分清 dependency / devDependency；Bun vs npm 一句话；对照 Python uv、Maven。

**知识点**：`name`/`type: module`/`scripts`/`dependencies`；semver `^`；为什么有 `node_modules`；本课统一 Bun。作业用 **解析 package.json 字符串** 的纯函数（不要真装包）。

**作业函数**：`readPkgName`、`isModuleType`、`depVersion`、`hasDevDep`、`scriptCommand`、`collectDepNames`、`assertCaretRange`。

---

## Ch10 · tsconfig 与声明文件

**预计**：0.5 天 ｜ **前置**：Ch02 ｜ **runMode**：browser

**目标**：知道 `strict` 开了什么；第三方库为何需要 `@types`；`.d.ts` 是什么。

**知识点**：`compilerOptions.strict`、`noImplicitAny`、`target`/`module` 点到为止；`declare function`；ambient types。作业：**解析精简 tsconfig JSON** + 给一段「无类型 JS API」写声明字符串（返回声明文本，测试快照）。

**作业函数**（生成时冻结）：

| 函数 | § | 知识点 |
|---|---|---|
| `readStrict` | §10.1 | `compilerOptions.strict` |
| `readNoImplicitAny` | §10.2 | 显式标志，或由 strict 暗示 |
| `readTarget` | §10.3 | `target`（点到为止） |
| `readModuleKind` | §10.3 | `module` |
| `strictImplies` | §10.2 | strict 捆绑了哪些开关 |
| `declareFunctionLine` | §10.4 | `declare function` 文本 |
| `shopApiDts` | §10.5 | 无类型 JS 商店 API 的 `.d.ts` 快照 |

**不讲**：project references、path mapping 大战。

---

## Ch11 · fetch、JSON、Stream 概念

**预计**：1 天 ｜ **前置**：Ch06、Ch08 ｜ **runMode**：browser

**目标**：会 `JSON.parse/stringify` 类型化（配合 zod 只调用，不重讲 Ch07）；理解 `ReadableStream` 是 SSE/LLM 流的底层。作业用 **假 fetch / 假 reader**（注入），禁止真实网络。

**作业函数**：`parseJsonProduct`、`stringifyPretty`、`readAllTextFromChunks`、`joinSsePayloads`（把 `data: ...\n\n` 拼起来）、`takeNChunks`、`decodeUtf8Chunks`、`collectStreamToString`。

---

# M3 · Web 前端（Ch12–Ch16）

> 目标：能做 Chat UI / 消息列表，不为学全 React 生态。不学 Redux、Next.js 全栈、CSS-in-JS 大战。

作业以 **纯函数为主**（可测）：渲染数据变换、state reducer。组件示例放教程；若加组件，也要能对 props→文案做纯函数测试。

---

## Ch12 · 组件化心智

**预计**：0.5 天 ｜ **前置**：M1 ｜ **runMode**：browser

**目标**：为什么不是 JSP/服务端模板一把梭；UI = `f(state)`。

**作业函数**：`messageViewModel`、`bubbleClassName`、`splitUserAssistant`、`shouldShowTime`、`threadTitle`、`emptyStateText`、`countUnread`。

---

## Ch13 · React：组件、props、state 心智

**预计**：1 天 ｜ **前置**：Ch12 ｜ **runMode**：browser

**目标**：props 向下、state 在内部；不要直接改数组。教程给 JSX 示例，作业用 **reducer / immutable 更新** 纯函数模拟 setState。

**作业函数**：`appendMessage`、`updateMessageContent`、`removeMessage`、`toggleTyping`、`initChatState`、`reduceChat(state, action)`（综合）。

---

## Ch14 · hooks 心智：useState / useEffect

**预计**：1 天 ｜ **前置**：Ch13 ｜ **runMode**：browser

**目标**：effect 是同步外部系统，不是生命周期抄 Java。作业用纯函数表达「依赖变了要不要重跑」「cleanup 登记」。

**作业函数**：`needRerun(prevDeps, nextDeps)`、`registerCleanup`、`fakeEffectCycle`、`staleFlagGuard`、`debouncePlan`（返回下次执行时刻，不真等）、`abortWhenUnmount`。

**不讲**：useLayoutEffect、useReducer 深水、Zustand。

---

## Ch15 · 表单与列表（Chat UI 基础）

**预计**：1 天 ｜ **前置**：Ch13 ｜ **runMode**：browser

**目标**：受控输入；列表 `key`；消息气泡数据。

**作业函数**：`controlledInputNext`、`validatePrompt`、`trimAndRejectEmpty`、`listKeysUnique`、`scrollPinDecision`、`renderLines`、`buildOutgoingMessage`。

---

## Ch16 · 路由与数据获取心智

**预计**：1 天 ｜ **前置**：Ch14、Ch11 ｜ **runMode**：browser

**目标**：多页（课程地图那种）；loading / error / success。不引入 React Router 进测试（站点本身会用）。作业：URL 解析 + 远程数据状态机纯函数。

**作业函数**：`parseHashRoute`、`matchModuleChapter`、`fetchStateReduce`、`isStaleSuccess`、`retryableError`、`buildQueryString`、`selectChapterTitle`。

---

# M4 · Web 后端（Ch17–Ch21）

> 对照 Python FastAPI，更短，只服务 Agent。框架：**Hono**。Local：代码在 `local/m4/chXX/`，网页只读。

每章仍要：教程 JSON + 作业函数（尽量纯函数：handler 入参 c.json 的 mock）+ `local/` 里一个可 `bun test` 的文件。网页 `localHint` 写明命令。

---

## Ch17 · Hono 第一个 API

**预计**：1 天 ｜ **前置**：M1 ｜ **runMode**：local

**对照**：FastAPI / Spring `@RestController`。

**知识点**：`new Hono()`、`app.get/post`、`c.json`、路径参数。作业可测：从 mock Request 抽参数 + 返回 body 的纯函数，外加 `local/` 起一个最小 app 的测试。

**作业函数**：`getProductById`、`listProducts`、`healthPayload`、`notFoundBody`、`createdStatus`、`parseIdParam`。

---

## Ch18 · zod 校验路径 / 查询 / body

**预计**：1 天 ｜ **前置**：Ch07、Ch17 ｜ **runMode**：local

**对照**：Pydantic。

**作业函数**：`parseIdParam`（zod）、`parseSearchQuery`、`parseCreateBody`、`errorToJson`、`validateOr400`、`patchBody`。

---

## Ch19 · 中间件、CORS、错误处理

**预计**：1 天 ｜ **前置**：Ch17 ｜ **runMode**：local

**作业函数**：`corsHeaders`、`wrapError`、`logLine`、`authHeaderOk`、`onErrorPayload`、`composeMiddlewareOrder`（记录执行顺序）。

---

## Ch20 · 轻量持久化（SQLite + drizzle 概念）

**预计**：1 天 ｜ **前置**：Ch17 ｜ **runMode**：local

**目标**：会 CRUD 一张 `products` 表。不搞迁移大战、不搞连接池生产配置。

**作业**：`local/` 用 sqlite 内存库；网页作业函数可以是 SQL 字符串拼装校验或 repository 纯逻辑 + 集成测试在 local。

**函数**：`toRow`、`fromRow`、`listInStockSql`、`insertProductInput`、`updateStock`、`deleteBySku`。

---

## Ch21 · SSE 流式响应

**预计**：1 天 ｜ **前置**：Ch11、Ch17 ｜ **runMode**：local

**目标**：为 LLM token 流铺路。`text/event-stream`、`data:` 行。

**作业函数**：`formatSseEvent`、`formatSseComment`、`splitSse`、`encodeTokenDelta`、`endStream`、`concatAssistantText`。

**local**：Hono 一个 `/stream` 用 mock token 数组推 SSE；测试读 stream。

---

# M5 · 用 Pi 做 Agent（Ch22–Ch26）

> 官方文档：https://pi.dev/docs/latest/sdk  
> 包（以 `@earendil-works/*` 为准，不要用过时的 `@mariozechner/*`）：  
> `pi-ai` → `pi-agent-core` → `pi-coding-agent`  
> **不重复** Python 课的 Prompt/RAG/ReAct 原理课。  
> **禁止** 作业里给模型敞开 `bash` / 任意写文件系统。工具只用 mock 商品查询/下单。  
> 全部 local。无 API Key 时：测试用假 `streamFn`（不打网），教程说明真跑要 Key。

---

## Ch22 · pi-ai：调模型 + 流式

**预计**：1 天 ｜ **前置**：Ch06、Ch11、Ch21 ｜ **runMode**：local

**目标**：知道 Pi 最底层是统一模型流；能订阅文本增量。

**作业**：对 **假 stream**（异步 yield 事件）做 `collectTextDeltas`、`collectUsage`、`stopReason`、`joinAssistant`、`isStillStreaming`、`toSseFromPiDeltas`。教程展示真 `pi-ai` 最小示例（local 文件里，测试可 skip 无 key）。

---

## Ch23 · pi-agent-core：最小 Agent + Tool

**预计**：1 天 ｜ **前置**：Ch22、Ch07 ｜ **runMode**：local

**目标**：`new Agent({ tools, streamFn })`；模型决定调不调工具。

**作业**：定义 `lookupProduct` / `calcLineTotal` 两个 **AgentTool**（zod/typebox 按 Pi 当前 API）；纯函数 `executeLookup`、`executeCalc`；`shouldCallTool` 对 mock 决策表；`formatToolResult`。假 streamFn 模拟「先 tool_call 再 text」。

**作业函数**（生成时冻结）：

| 函数 | § | 知识点 |
|---|---|---|
| `lookupProductTool` | §23.1 | AgentTool 描述（JSON Schema 形，作业不 import TypeBox） |
| `calcLineTotalTool` | §23.2 | 第二个商品工具；禁止 bash |
| `executeLookup` | §23.3 | 按 SKU 查；CP-009 库存 0 仍命中 |
| `executeCalc` | §23.4 | qty×单价；非法 → null |
| `shouldCallTool` | §23.5 | 决策表：危险词 → null；多少钱 → calc；库存/SKU → lookup |
| `formatToolResult` | §23.6 | LookupHit / 小计 / 未找到 |
| `applyToolCall` | §23.7 | 调用 execute* + formatToolResult |

---

## Ch24 · 自定义 Tool 与事件

**预计**：1 天 ｜ **前置**：Ch23 ｜ **runMode**：local

**目标**：`subscribe` 看 `text_delta` / `tool_call`；`beforeToolCall` 可拦。

**作业**：`reduceSessionEvents`（事件数组 → UI 消息）、`filterTextDeltas`、`blockDangerousTool`、`auditToolCall`、`uiRowsFromEvents`、`abortFlag`。

---

## Ch25 · createAgentSession

**预计**：1 天 ｜ **前置**：Ch24 ｜ **runMode**：local

**目标**：`createAgentSession` + `SessionManager.inMemory()`；`prompt` / `steer` 是什么；CLI 与 SDK 同一套 harness。

**作业**：封装 `createShopSession`（注入假 modelRuntime 若可测，否则测配置对象）；`sessionConfig`、`pickMemoryManager`、`subscribeToLog`、`disposeSafe`。无 key 集成测试 skip。

**作业函数**（生成时冻结）：

| 函数 | § | 知识点 |
|---|---|---|
| `sessionConfig` | §25.1 | 系统提示 + 工具白名单 + 永远 inMemory |
| `pickMemoryManager` | §25.2 | `SessionManager.inMemory()` vs `SessionManager.create` |
| `createShopSession` | §25.3 | 调用 sessionConfig；disposed false |
| `subscribeToLog` | §25.4 | 不可变追加；dispose 后不加 |
| `disposeSafe` | §25.5 | 新对象翻旗，不 mutate |
| `steerNote` | §25.6 | steer 整段替换草稿，不是拼接 |

---

## Ch26 · 打通：Hono + SSE + React 数据协议

**预计**：1–2 天 ｜ **前置**：Ch16、Ch21、Ch25 ｜ **runMode**：local

**目标**：前后端约定一种事件 JSON（沿用 Ch24 的 UI row），Hono 转 SSE，前端 reducer 已在 M3 写过则复用。

**作业**：`piEventToSse`、`chatRequestSchema`、`reduceChatFromSse`、`toolRowView`、`assistantRowView`、`endOfTurn`。local 放一个最小 server + 说明如何对上课程站 Chat 心智（不必把整个学习站改成聊天产品）。

---

# M6 · 研究 Pi（Ch27–Ch31）

> 目标：从「会用 Pi 的 API」升级到「读得懂 Pi 本身」。事实源 = 本机安装包 `/opt/homebrew/lib/node_modules/@earendil-works/pi-coding-agent/` 内的 `docs/` 与 `dist/`（pi v0.85.x）+ https://pi.dev/docs/latest 。**不 clone 仓库、不新增 npm 依赖**；作业全部是纯函数（假数据测真机制），真 Pi 代码只进教程示例与各章 `demo.ts` 复制区（字符串 + `if (false)` 守护）。每章 local 三件套：`assignment.ts` / `assignment.test.ts` / `demo.ts`，**无 `app.ts`**。

---

## Ch27 · 仓库地图与四种运行模式

**预计**：1 天 ｜ **前置**：Ch26 ｜ **runMode**：local

**目标**：拿到一张 Pi 的「楼层图」——monorepo 四包各管什么、一条命令如何落进四种运行模式、配置与资源放哪；能自己在本机安装包里找到 docs / examples / dist 继续挖。

**知识点**：`packages/ai|agent|tui|coding-agent` 职责；四模式 `tui` / `print` / `json-event` / `rpc`（`ctx.mode` 四值）；`~/.pi/agent/` 全局目录 vs 项目 `.pi/`；安装包内研究入口。

**作业函数**（生成时冻结）：

| 函数 | § | 知识点 |
|---|---|---|
| `packageRole` | §27.1 | monorepo 四包职责映射 |
| `modeOfInvocation` | §27.2 | `-p` / `--mode rpc` / `--mode json` / 默认 → 四模式 |
| `modeCapability` | §27.3 | 模式行为表：ctx.mode / hasUI / 交互能力 |
| `pickRunMode` | §27.4 | 场景 → 选模式 |
| `agentDirEntry` | §27.5 | `~/.pi/agent/` 下各文件/目录作用 |
| `resourceScope` | §27.6 | 路径 → global / project 资源 |
| `researchEntryPaths` | §27.7 | 定位安装包 docs / examples / dist（综合） |

---

## Ch28 · Agent 循环怎么转（读 pi-agent-core）

**预计**：1 天 ｜ **前置**：Ch27 ｜ **runMode**：local

**目标**：能口述 Agent 循环全流程（prompt → LLM 流 → 工具并行 → 结果追加 → 再调 LLM → 直到 `stopReason !== "toolUse"`）；分清事件嵌套层级；明白 steer / followUp 各在哪个缝隙投递、`agent_end` 和 `agent_settled` 差在哪。

**知识点**：`Agent` / `AgentState`（messages、model、systemPrompt、tools、streamingMessage）；事件嵌套 agent_start ⊃ turn_start ⊃ message_* ⊃ tool_execution_*；`agent_end` 之后还可能 retry / compaction / follow-up，`agent_settled` 才是真停；steer=本轮工具跑完后、下次 LLM 调用前，followUp=agent 停止后。

**作业函数**（生成时冻结）：

| 函数 | § | 知识点 |
|---|---|---|
| `loopContinues` | §28.1 | `stopReason === "toolUse"` 且有 toolCalls → 继续 |
| `nextPhase` | §28.2 | 当前状态 → 下一阶段（调 LLM / 执行工具 / 结束） |
| `orderAgentEvents` | §28.3 | 事件嵌套顺序校验 |
| `splitTurns` | §28.4 | 事件流按 turn 切分 |
| `deliverQueuedAt` | §28.5 | steer / followUp 的投递缝隙 |
| `agentStateAfter` | §28.6 | 不可变更新 state.messages |
| `isSettled` | §28.7 | 尾事件 agent_settled 才算真停（综合） |

---

## Ch29 · 扩展四件套：Extension / Skill / Template / Package

**预计**：1 天 ｜ **前置**：Ch28 ｜ **runMode**：local

**目标**：分清四种扩展资源各自解决什么、放哪、怎么被加载；会读 SKILL.md frontmatter 和 Pi 包的 `pi` manifest；能写一个最小 extension 工厂（读懂即可，作业考解析与判断）。

**知识点**：extension（默认导出工厂 `(pi: ExtensionAPI) => {}`、`pi.on` / `pi.registerTool` / `pi.registerCommand`、jiti 加载 TS、`/reload` 热重载）；skill（SKILL.md + frontmatter `name` / `description` / `allowed-tools` / `disable-model-invocation`，模型自发 vs `/skill:name`）；prompt template（`prompts/*.md` → 斜杠命令）；Pi package（`pi.{extensions,skills,prompts,themes}` manifest、`pi install npm:pkg@1.0.0` / `git:github.com/u/r`、settings.json `packages`）。

**作业函数**（生成时冻结）：

| 函数 | § | 知识点 |
|---|---|---|
| `extensionFactoryOk` | §29.1 | 代码字符串是否有 `export default` 工厂 |
| `skillFromFrontmatter` | §29.2 | 解析 SKILL.md → {name, description}（缺 description 不加载） |
| `skillInvocationMode` | §29.3 | `disable-model-invocation: true` → 仅 `/skill:name` |
| `slashNamesFromDir` | §29.4 | prompts/*.md → 斜杠命令名 |
| `resourceKindOf` | §29.5 | 路径 → extension/skill/prompt/theme |
| `parseInstallSpec` | §29.6 | `npm:@scope/pkg@1.2.3` / `git:github.com/u/r@v1` → 来源+包名 |
| `bundledResources` | §29.7 | `pi` manifest → 装完出现哪些资源（综合） |

---

## Ch30 · Session 与 Compaction

**预计**：1 天 ｜ **前置**：Ch28 ｜ **runMode**：local

**目标**：把「会话文件」当数据结构读：追加式树、entry 类型、活动分支；能手工推演一次 compaction 的触发与切点。

**知识点**：session.jsonl（SessionHeader v3 + entries，`id`/`parentId` 链成树）；entry 类型（message / model_change / thinking_level_change / compaction / branch_summary / custom / custom_message / label / session_info）；SessionManager 树 API；compaction 触发式 `contextTokens > contextWindow - reserveTokens`（默认 16384）；切点：从新往回累积 `keepRecentTokens`（默认 20000）、只在 turn 边界切、**toolResult 永远不可切**；`CompactionEntry { summary, firstKeptEntryId, tokensBefore }`；split turn；分支摘要（公共祖先 + 被弃分支）；global+project settings 深合并与 `compaction.modelOverrides` 回退。

**作业函数**（生成时冻结）：

| 函数 | § | 知识点 |
|---|---|---|
| `shouldCompact` | §30.1 | 触发式（contextWindow − reserveTokens） |
| `isValidCutPoint` | §30.2 | user/assistant/bashExecution/custom 可切，toolResult 不可 |
| `findCutPoint` | §30.3 | 从新往回累积 token、turn 边界 → firstKeptEntryId |
| `buildEntryTree` | §30.4 | id/parentId 数组 → 树 |
| `pathToLeaf` | §30.5 | 根→叶活动分支 |
| `contextAfterCompaction` | §30.6 | summary + firstKeptEntryId 之后的消息 = 下次发给 LLM 的 |
| `mergeCompactionSettings` | §30.7 | 深合并 + modelOverrides 回退（综合） |

---

## Ch31 · SDK 嵌入 vs RPC

**预计**：1 天 ｜ **前置**：Ch25、Ch27、Ch30 ｜ **runMode**：local

**目标**：给「我的程序要嵌一个 Agent」选对集成方式：同进程 SDK（`createAgentSession`）vs 子进程 RPC（`pi --mode rpc` 的 stdin/stdout JSONL）vs json 事件流；能写出协议正确的最小 RPC 客户端。

**知识点**：SDK：`createAgentSession` + `SessionManager.inMemory()` + `subscribe`；RPC：JSONL 命令（prompt/steer/follow_up/abort/get_state/compact/get_entries…）→ `{type:"response",success}` + 异步事件流 + `id` 关联；`success:true` 只代表「已接受」，失败走事件流；extension_ui_request/response 子协议；**LF-only 分帧**（只按 `\n` 切、剥尾部 `\r`；Node readline 会错切 U+2028/U+2029，官方点名不合规）；选型表（同进程类型安全 vs 进程隔离/跨语言）。

**作业函数**（生成时冻结）：

| 函数 | § | 知识点 |
|---|---|---|
| `pickIntegration` | §31.1 | 场景 → sdk / rpc / json |
| `splitJsonl` | §31.2 | 正确分帧：只按 `\n`、剥尾部 `\r`、U+2028 不切 |
| `encodeCommand` | §31.3 | 命令对象 → JSONL 行（含 id） |
| `matchResponseTo` | §31.4 | 事件流里按 id 找对应 response |
| `promptAcceptSemantics` | §31.5 | success:true=已接受；失败走事件流不二次 response |
| `answerUiRequest` | §31.6 | extension_ui_request(select) → 应答帧 |
| `sdkEquivalent` | §31.7 | RPC 命令 ↔ SDK 方法映射（综合） |

---

## 8. M6 研究 Pi · **已开（2026-09-15）**

用户已明确说「写 M6」，暂停解除。本节原「不要生成 Ch27+」的禁令由以下约定取代：

- 事实源以本机安装包（pi v0.85.x）内 `docs/` 与 `dist/` 为准 + https://pi.dev/docs/latest 交叉核对；**不 clone 仓库当课程内容**。
- 不新增 npm 依赖；作业不 import `@earendil-works/*`（延续 M5 假数据模式）。
- M6 各章 local 目录**无 `app.ts`**（研究章不建 HTTP 服务），真代码进 `demo.ts` 复制区。

---

## 9. 进度表

> ⬜ 未生成 ｜ ✅ 已生成（日期）

| 章 | 标题 | 状态 |
|---|---|---|
| 01 | 世界地图 & 工具链 & 第一个带类型的函数 | ✅ 2026-08-22 |
| 02 | 结构类型 vs 名义类型 | ✅ 2026-08-25（原理+mermaid 样板） |
| 03 | 联合、字面量、narrowing | ✅ 2026-08-23 |
| 04 | 泛型与工具类型 | ✅ 2026-08-23 |
| 05 | 函数、模块、this、解构 | ✅ 2026-08-23 |
| 06 | Promise、async/await、错误 | ✅ 2026-08-23 |
| 07 | 运行时校验：zod | ✅ 2026-08-23 |
| 08 | Event Loop | ✅ 2026-08-23 |
| 09 | 包与运行时 | ✅ 2026-08-23 |
| 10 | tsconfig 与声明文件 | ✅ 2026-08-23 |
| 11 | fetch、JSON、Stream 概念 | ✅ 2026-08-23 |
| 12 | 组件化心智 | ✅ 2026-08-23 |
| 13 | React：组件、props、state 心智 | ✅ 2026-08-23 |
| 14 | hooks 心智 | ✅ 2026-08-23 |
| 15 | 表单与列表（Chat UI 基础） | ✅ 2026-08-23 |
| 16 | 路由与数据获取心智 | ✅ 2026-08-23 |
| 17 | Hono 第一个 API | ✅ 2026-08-23 |
| 18 | zod 校验路径 / 查询 / body | ✅ 2026-08-23 |
| 19 | 中间件、CORS、错误处理 | ✅ 2026-08-23 |
| 20 | 轻量持久化 | ✅ 2026-08-23 |
| 21 | SSE 流式响应 | ✅ 2026-08-23 |
| 22 | pi-ai：调模型 + 流式 | ✅ 2026-08-23 |
| 23 | pi-agent-core：最小 Agent + Tool | ✅ 2026-08-23 |
| 24 | 自定义 Tool 与事件 | ✅ 2026-08-23 |
| 25 | createAgentSession | ✅ 2026-08-23 |
| 26 | 打通：Hono + SSE + React 数据协议 | ✅ 2026-08-23 |
| 27 | 仓库地图与四种运行模式 | ✅ 2026-09-15 |
| 28 | Agent 循环怎么转（读 pi-agent-core） | ✅ 2026-09-16 |
| 29 | 扩展四件套：Extension / Skill / Template / Package | ✅ 2026-09-16 |
| 30 | Session 与 Compaction | ✅ 2026-09-26 |
| 31 | SDK 嵌入 vs RPC | ✅ 2026-09-26 |

### 9.1 分批生成记录

> 当时每批 3 个 agent 并行写章。下列均为已完成记录。

#### 第 1 批 · 2026-08-23 · Ch02 / Ch03 / Ch04

| 章 | JSON | 作业函数 | verify | 备注 |
|---|---|---|---|---|
| 02 | `src/content/chapters/ch02.json` | 7：`labelProduct` `asOrderLine` `pickSku` `mergeNamed` `freezeName` `acceptDuck` `assertProductShape` | all green | 结构类型；谓词只返回 boolean |
| 03 | `src/content/chapters/ch03.json` | 7：`formatOptionalPrice` `statusLabel` `narrowId` `readField` `handleStockResult` `priceOrZero` `summarizeResults` | all green | 判别联合 + `??` 保 0 |
| 04 | `src/content/chapters/ch04.json` | 7：`firstOf` `pluck` `patchProduct` `catalogCard` `withoutStock` `indexBySku` `groupByCategory` | all green | 工具类型只测行为；条件类型不考 |

配套脚本：`scripts/gen-ch0{2,3,4}.ts`、`scripts/verify-ch0{2,3,4}.ts`。`index.json` 标题已对齐，未改。

**当时进度**：4 / 26。

#### 第 2 批 · 2026-08-23 · Ch05 / Ch06 / Ch07（M1 收尾）

| 章 | JSON | 作业函数 | verify | 备注 |
|---|---|---|---|---|
| 05 | `src/content/chapters/ch05.json` | 7：`discountedPrice` `splitSku` `restTags` `mergeProductPatch` `bindCounter` `pipePrice` `exportMarker` | all green | 闭包计数代替 DOM this |
| 06 | `src/content/chapters/ch06.json` | 7：`delayValue` `loadProductAsync` `loadOrThrow` `readErrorMessage` `loadMany` `loadManySettled` `retryOnce` | all green | 立刻 settle 的 Promise；测试 `await` |
| 07 | `src/content/chapters/ch07.json` | 7：`productSchema` `parseProduct` `safeParseProduct` `parseProductList` `parseAndLabel` `parseToolArgs` `parseOrderPayload` | all green | 运行器注入全局 `z`；`productSchema()` 函数导出 |

配套：`scripts/gen-ch0{5,6,7}.ts`、`scripts/verify-ch0{5,6,7}.ts`。为本批改了运行器：`runFunctionTest` 改为 async（单测 4s 超时）、注入 zod、剥掉 import。Ch01–04 回归仍绿。

**当时进度**：7 / 26（M1 完成）。

#### 第 3 批 · 2026-08-23 · Ch08 / Ch09 / Ch10（M2 前三章）

| 章 | JSON | 作业函数 | verify | 备注 |
|---|---|---|---|---|
| 08 | `src/content/chapters/ch08.json` | 6：`explainOrderA` `explainOrderB` `explainOrderC` `queueVsTimeout` `asyncBreak` `flushMicrotasks` | all green | 注入假调度器；禁止真 `setTimeout` |
| 09 | `src/content/chapters/ch09.json` | 7：`readPkgName` `isModuleType` `depVersion` `hasDevDep` `scriptCommand` `collectDepNames` `assertCaretRange` | all green | 解析 JSON 字符串，不真装包 |
| 10 | `src/content/chapters/ch10.json` | 7：`readStrict` `readNoImplicitAny` `readTarget` `readModuleKind` `strictImplies` `declareFunctionLine` `shopApiDts` | all green | 大纲原未列函数名，已回写 §7 |

配套：`scripts/gen-ch{08,09,10}.ts`、`scripts/verify-ch{08,09,10}.ts`。

**当时进度**：10 / 26。M2 还剩 Ch11。

#### 第 4 批 · 2026-08-23 · Ch11 / Ch12 / Ch13（M2 收尾 + M3 前两章）

| 章 | JSON | 作业函数 | verify | 备注 |
|---|---|---|---|---|
| 11 | `src/content/chapters/ch11.json` | 7：`parseJsonProduct` `stringifyPretty` `readAllTextFromChunks` `joinSsePayloads` `takeNChunks` `decodeUtf8Chunks` `collectStreamToString` | all green | 假 fetch / FakeReader；zod 只调用；UTF-8 跨块先拼再 decode |
| 12 | `src/content/chapters/ch12.json` | 7：`messageViewModel` `bubbleClassName` `splitUserAssistant` `shouldShowTime` `threadTitle` `emptyStateText` `countUnread` | all green | UI = f(state)；无 React API |
| 13 | `src/content/chapters/ch13.json` | 6：`appendMessage` `updateMessageContent` `removeMessage` `toggleTyping` `initChatState` `reduceChat` | all green | 不可变更新；教程 JSX、作业纯函数；`reduceChat` 综合 |

配套：`scripts/gen-ch{11,12,13}.ts`、`scripts/verify-ch{11,12,13}.ts`。`index.json` 标题已对齐，未改。运行器无需改动（Ch11 用已注入的全局 `z`）。

**当时进度**：13 / 26。M3 还剩 Ch14–16。

#### 第 5 批 · 2026-08-23 · Ch14 / Ch15 / Ch16（M3 收尾）

| 章 | JSON | 作业函数 | verify | 备注 |
|---|---|---|---|---|
| 14 | `src/content/chapters/ch14.json` | 6：`needRerun` `registerCleanup` `fakeEffectCycle` `staleFlagGuard` `debouncePlan` `abortWhenUnmount` | all green | effect ≠ 生命周期；禁止真 `setTimeout`；deps 用 Object.is |
| 15 | `src/content/chapters/ch15.json` | 7：`controlledInputNext` `validatePrompt` `trimAndRejectEmpty` `listKeysUnique` `scrollPinDecision` `renderLines` `buildOutgoingMessage` | all green | 受控输入超长拒绝不 slice；列表 key 唯一 |
| 16 | `src/content/chapters/ch16.json` | 7：`parseHashRoute` `matchModuleChapter` `fetchStateReduce` `isStaleSuccess` `retryableError` `buildQueryString` `selectChapterTitle` | all green | hash 课程地图；四态状态机；无 React Router |

配套：`scripts/gen-ch{14,15,16}.ts`、`scripts/verify-ch{14,15,16}.ts`。`index.json` 标题已对齐，未改。

**当时进度**：16 / 26。M1–M3（browser）完成。

#### 第 6 批 · 2026-08-23 · Ch17 / Ch18 / Ch19（M4 local 前三章）

| 章 | JSON | 作业函数 | verify | 备注 |
|---|---|---|---|---|
| 17 | `src/content/chapters/ch17.json` | 6：`parseIdParam` `getProductById` `listProducts` `healthPayload` `notFoundBody` `createdStatus` | all green | JSON 纯函数；Hono 在 `local/m4/ch17/app.ts`；`app.request` 不 listen |
| 18 | `src/content/chapters/ch18.json` | 6：`parseIdParam` `parseSearchQuery` `parseCreateBody` `errorToJson` `validateOr400` `patchBody` | all green | HTTP 边界走 zod；非法 → 400；local 才 `import { z }` |
| 19 | `src/content/chapters/ch19.json` | 6：`corsHeaders` `wrapError` `logLine` `authHeaderOk` `onErrorPayload` `composeMiddlewareOrder` | all green | CORS allowlist；Bearer；洋葱进出；onError 不甩 stack |

配套：`scripts/gen-ch{17,18,19}.ts`、`scripts/verify-ch{17,18,19}.ts`、`local/m4/ch{17,18,19}/`（assignment TODO + 完整 app + bun:test）。`index.json` 标题已对齐。本批基础设施：依赖 `hono@4.13.3`；`ChapterPage` 对 local 交错章显示 🔒 提示卡，不再挂 Monaco。

**当时进度**：19 / 26。M4 还剩 Ch20 / Ch21。

#### 第 7 批 · 2026-08-23 · Ch20 / Ch21 / Ch22（M4 收尾 + M5 首章）

| 章 | JSON | 作业函数 | verify | 备注 |
|---|---|---|---|---|
| 20 | `src/content/chapters/ch20.json` | 6：`toRow` `fromRow` `listInStockSql` `insertProductInput` `updateStock` `deleteBySku` | all green | JSON 纯函数；`bun:sqlite` 内存库在 `local/m4/ch20/`；drizzle 只在教程概念；SQL 用 `?` 防注入 |
| 21 | `src/content/chapters/ch21.json` | 6：`formatSseEvent` `formatSseComment` `splitSse` `encodeTokenDelta` `endStream` `concatAssistantText` | all green | 与 Ch11 `data:` 帧对称（服务端写）；Hono `streamSSE`；`[DONE]` 约定 |
| 22 | `src/content/chapters/ch22.json` | 6：`collectTextDeltas` `collectUsage` `stopReason` `joinAssistant` `isStillStreaming` `toSseFromPiDeltas` | all green | 假事件数组，无 Key 也能绿；真 `pi-ai` 只在 `demo.ts` 复制区；未装 `@earendil-works/pi-ai` |

配套：`scripts/gen-ch{20,21,22}.ts`、`scripts/verify-ch{20,21,22}.ts`、`local/m4/ch{20,21}/`、`local/m5/ch22/`。`index.json` 标题已对齐，未改。未新增 npm 依赖（sqlite 用 Bun 内置；SSE 用已有 hono；pi-ai 作业走假流）。

**当时进度**：22 / 26。M5 还剩 Ch23 / Ch24 / Ch25 / Ch26。

#### 第 8 批 · 2026-08-23 · Ch23 / Ch24 / Ch25（M5 中三章）

| 章 | JSON | 作业函数 | verify | 备注 |
|---|---|---|---|---|
| 23 | `src/content/chapters/ch23.json` | 7：`lookupProductTool` `calcLineTotalTool` `executeLookup` `executeCalc` `shouldCallTool` `formatToolResult` `applyToolCall` | all green | JSON 纯函数；假 `fakeToolThenTextStream` 在 `local/m5/ch23/`；真 `new Agent` 只在 `demo.ts` 复制区 |
| 24 | `src/content/chapters/ch24.json` | 6：`filterTextDeltas` `reduceSessionEvents` `blockDangerousTool` `auditToolCall` `abortFlag` `uiRowsFromEvents` | all green | 作业版 subscribe / `beforeToolCall`；bash 一律 `{block:true}`；假会话事件数组 |
| 25 | `src/content/chapters/ch25.json` | 6：`sessionConfig` `pickMemoryManager` `createShopSession` `subscribeToLog` `disposeSafe` `steerNote` | all green | 测配置对象不打网；`steer` 替换不是拼接；真 `createAgentSession` 只在 `demo.ts` |

配套：`scripts/gen-ch{23,24,25}.ts`、`scripts/verify-ch{23,24,25}.ts`、`local/m5/ch{23,24,25}/`。`index.json` 标题已对齐，未改。未新增 npm 依赖（作业走假事件 / 配置对象）。

**当时进度**：25 / 26。随后第 9 批完成 Ch26。

#### 第 9 批 · 2026-08-23 · Ch26（M5 收官）

| 章 | JSON | 作业函数 | verify | 备注 |
|---|---|---|---|---|
| 26 | `src/content/chapters/ch26.json` | 6：`piEventToSse` `chatRequestSchema` `reduceChatFromSse` `toolRowView` `assistantRowView` `endOfTurn` | all green | JSON 纯函数协议；Hono `streamSSE` 在 `local/m5/ch26/app.ts`；假事件无 Key；`reduceChatFromSse` 必须调用 `endOfTurn`；`agent_end` 上电线是 `[DONE]` |

配套：`scripts/gen-ch26.ts`、`scripts/verify-ch26.ts`、`local/m5/ch26/`（assignment TODO + 最小 app + bun:test + demo 复制区）。`index.json` 标题已对齐，未改。未新增 npm 依赖。

**进度**：26 / 26 章已生成。M1–M5 完成。M6（研究 Pi / Ch27+）整段暂停。

#### 第 10 批 · 2026-09-15 起 · M6 研究 Pi（Ch27–Ch31，完成）

M6 已开（用户 2026-09-15 明确说写 M6，暂停解除）。逐章生成，**每章 verify 全绿、§9 翻 ✅ 后再写下一章**。

| 章 | JSON | 作业函数 | verify | 备注 |
|---|---|---|---|---|
| 27 | `src/content/chapters/ch27.json` | 7：`packageRole` `modeOfInvocation` `modeCapability` `pickRunMode` `agentDirEntry` `resourceScope` `researchEntryPaths` | all green 2026-09-15 | **M6 样板章**；四包 / 四模式 / 目录地图 / 作用域 |
| 28 | `src/content/chapters/ch28.json` | 7：`loopContinues` `nextPhase` `orderAgentEvents` `splitTurns` `deliverQueuedAt` `agentStateAfter` `isSettled` | all green 2026-09-16 | 双层 while / 事件嵌套 / steer·followUp 三缝隙 / agent_end vs agent_settled；事实源 = 本机 pi-agent-core dist + docs/sdk.md |
| 29 | `src/content/chapters/ch29.json` | 7：`extensionFactoryOk` `skillFromFrontmatter` `skillInvocationMode` `slashNamesFromDir` `resourceKindOf` `parseInstallSpec` `bundledResources` | all green 2026-09-16 | 扩展四件套；默认导出工厂 / jiti、SKILL.md frontmatter 与渐进披露、disable-model-invocation、prompts→斜杠命令（non-recursive）、路径四类归属、install spec 两个 @ 坑、pi manifest vs 约定目录；事实源 = 本机 docs/extensions.md · skills.md · prompt-templates.md · packages.md |
| 30 | `src/content/chapters/ch30.json` | 7：`shouldCompact` `isValidCutPoint` `findCutPoint` `buildEntryTree` `pathToLeaf` `contextAfterCompaction` `mergeCompactionSettings` | all green 2026-09-26 | 追加式树 / 触发式严格大于 / toolResult 不可切 / split turn / summary+firstKeptEntryId；v0.85.1 compaction 只有三键，contextWindow 回退走 models.json 的 modelOverrides；事实源 = docs/session-format.md · compaction.md · sessions.md · settings.md + dist compaction.js |
| 31 | `src/content/chapters/ch31.json` | 7：`pickIntegration` `splitJsonl` `encodeCommand` `matchResponseTo` `promptAcceptSemantics` `answerUiRequest` `sdkEquivalent` | all green 2026-09-26 | SDK / RPC / json 选型；LF-only 分帧（U+2028/U+2029 不切）；success true = 已接受；select 应答帧；get_state 无同名方法。M6 收官。事实源 = docs/sdk.md · rpc.md · json.md |

**M6 生成约定（Ch28–31 必须照此；样板 = ch27 的 JSON + `scripts/gen-ch27.ts` + `scripts/verify-ch27.ts`）**：

1. 事实源：本机安装包 `<npm root -g>/@earendil-works/pi-coding-agent/`（pi v0.85.x）内 `docs/*.md` 与 `dist/`，+ https://pi.dev/docs/latest 交叉核对。写教程前**先读本机 docs 对应页**，不凭记忆编 API。
2. local 三件套：`assignment.ts` / `assignment.test.ts` / `demo.ts`。**无 `app.ts`**（研究章不建 HTTP 服务；真 Pi 代码进 `demo.ts` 复制区：模板字符串 + `if (false)` 守护，去字符串后不得有真 fetch/import）。
3. 作业纯函数、无 Key 可跑、不用 zod → local `assignment.ts` **无任何 import**（与 m4/m5 不同）。
4. 每章 7 函数 = §NN.1–§NN.7 七个练习节（一节一函数，heading 带 `§NN.x` + 反引号函数名 + 🔴/🟡/🟢）；16–18 节骨架照 ch27（intro / map+对应表 / path / guess / world+机制 / 7 练习节 / pits / homework / check / feynman / next）。
5. mermaid 5–8 张；每条 style 带 `color:#1f1f1f`；节点特殊字符双引号；`<br/>` 换行可用（旧章有先例）。节点 id **不得用 mermaid 关键字**（`call`/`click`/`class`/`style`/`default`/`end` 等，Ch29 曾因 `call` 当 id 在 11.17.0 报 Syntax error）；生成后跑 `node scripts/check-mermaid.mjs src/content/chapters/chNN.json` 全 OK（raw 与 flat 两种）再翻 ✅。商品铺 mock（KB-001/MS-002/无线鼠标）贯穿。
6. verify 与 ch26 版差异：`localHint: "bun test local/m6/chNN"`；local 检查三文件并**断言无 app.ts**；**新增**「tutorialMd 与 sections 重拼逐字符一致」检查；不检查 zod import。
7. 完成每章：`bun scripts/gen-chNN.ts` → `bun scripts/verify-chNN.ts` 全绿 → `index.json` m6 卡片**追加**该章条目（卡片随生成长）→ `bun scripts/render-pages.ts --chapter chNN` → 本表更新 → §9 进度翻 ✅。不 git commit。
8. 教程里「下一步」按 §7 大纲预告后一章；Ch31 是 M6 收官（next 指向「课程完结」）。

**进度**：5 / 5（Ch27 ✅ 2026-09-15、Ch28 ✅ 2026-09-16、Ch29 ✅ 2026-09-16、Ch30 ✅ 2026-09-26、Ch31 ✅ 2026-09-26）。M6 收官。

#### 样板 · 2026-08-25 · Ch02 原理 + mermaid

对照 §5「原理与图」。只改 `src/content/chapters/ch02.json` 教程正文（`tutorialMd` + `sections`），作业/测试未动。7 张 mermaid 关系图，语法渲染全绿。后续章已按此密度补完（§9.2）；不要重跑会覆盖样板的 `scripts/gen-ch02.ts`。

### 9.2 原理 + mermaid 补图记录

> 已完成。图规范见 §4.1。样板：Ch02。不要再开补图批次。

**完成**（2026-08-28）。Ch01–Ch26 原理 + mermaid 已按样板 Ch02 补完。

| 批 | 章 | 补图前 | 状态 |
|---|---|---|---|
| 0 样板 | 02 | 无图 → 7 张 | ✅ 2026-08-25 |
| 1 | 01 · 03 · 04 · 05 | 均无图（语言核心优先） | ✅ 2026-08-27 · 01:6 / 03:7 / 04:7 / 05:7 |
| 2 | 06 · 07 · 09 · 10 | 均无图 | ✅ 2026-08-27 · 06:8 / 07:6 / 09:6 / 10:6 |
| 3 | 08 · 11 · 12 · 13 | 已有 1–2 张 | ✅ 2026-08-27 · 08:8 / 11:6 / 12:6 / 13:6 |
| 4 | 14 · 15 · 16 · 17 | 已有 1–2 张 | ✅ 2026-08-27 · 14:7 / 15:6 / 16:6 / 17:6 |
| 5 | 18 · 19 · 20 · 21 | 已有 1–4 张 | ✅ 2026-08-27 · 18:6 / 19:6 / 20:7 / 21:6 |
| 6 | 22 · 23 · 24 · 25 | 已有 1–3 张 | ✅ 2026-08-28 · 22:5 / 23:5 / 24:5 / 25:6 |
| 7 | 26 | 已有 2 张（末批 1 章） | ✅ 2026-08-28 · 26:6 |

---

## 10. 禁止项（再强调）

- 不生成 LeetCode / 算法刷题章
- 不生成运维、Docker、K8s、CI 章
- 不写各章 `tutorial.md` 文件
- M6 事实以本机安装包 docs/dist 为准，不编造 API、不 clone 仓库当内容
- 不在 browser 章引入 Pi / Hono / sqlite
- 不在 M5/M6 作业中开放任意 `bash`
- 不主动 git commit / push
