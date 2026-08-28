/**
 * 生成 src/content/chapters/ch23.json + local/m5/ch23/
 * 运行：bun scripts/gen-ch23.ts
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const preamble = `/**
 * Ch23 作业：商品助手最小 Agent + Tool 的纯函数。
 *
 * 场景：用户问「机械键盘还有货吗」或「2件多少钱」。
 * 你先给出两个工具的 JSON Schema 形定义，再实现按 SKU 查找、
 * 算行小计、该不该调工具、把结果格式化成给模型看的文本，最后接线。
 *
 * 没有供应商 Key 也能全绿：测的是纯函数和假 tool_call，不是真模型。
 * 全绿 = 你掌握了 Ch23。本地：bun test local/m5/ch23
 */

type Product = {
  id: number;
  name: string;
  category: string;
  price: number;
  stock: number;
  sku: string;
};

type ToolParamProp = { type: string; description: string };

type AgentToolDef = {
  name: string;
  label: string;
  description: string;
  parameters: {
    type: "object";
    required: string[];
    properties: Record<string, ToolParamProp>;
  };
};

type LookupHit = { sku: string; name: string; stock: number; price: number };`;

const functions = [
  {
    name: "lookupProductTool",
    testSuite: "lookupProductTool",
    skeleton: `/**
 * 【场景】商品助手要让模型「看见」一个查 SKU 的工具。先交出工具清单，
 * 不是去调 HTTP。机械键盘 KB-001、无线鼠标 MS-002 都走这一个工具。
 *
 * 【转换点】作业不 import 任何 schema 库。返回冻结的 JSON Schema 形对象：
 * type 必须是字面量 "object"，required 含 "sku"。name 不要写成 bash / write / edit。
 *
 * 任务：精确返回下面这个对象（测试 toEqual 整个对象）。
 * 示例：
 *   lookupProductTool().name → "lookupProduct"
 *   lookupProductTool().parameters.required → ["sku"]
 *   sku 的 description → "商品 SKU，例如 KB-001"
 *
 * 提示：原样返回。不要动态拼 description。
 */
export function lookupProductTool(): AgentToolDef {
  throw new Error("TODO");
}`,
  },
  {
    name: "calcLineTotalTool",
    testSuite: "calcLineTotalTool",
    skeleton: `/**
 * 【场景】用户问「2件机械键盘多少钱」。模型还需要一个算行小计的工具：
 * 数量 × 单价。键盘 599、鼠标 159 都用同一套参数。
 *
 * 【转换点】两个 required：qty 和 unitPrice，都是 number。
 * 这是给模型看的 schema，不是去执行乘法（执行在 executeCalc）。
 *
 * 任务：精确返回计算小计那个工具定义。
 * 示例：
 *   name → "calcLineTotal"；label → "计算小计"
 *   required → ["qty", "unitPrice"]
 *   qty.description → "购买数量，整数 ≥ 1"
 *
 * 提示：两个 properties 都要有 type + description。
 */
export function calcLineTotalTool(): AgentToolDef {
  throw new Error("TODO");
}`,
  },
  {
    name: "executeLookup",
    testSuite: "executeLookup",
    skeleton: `/**
 * 【场景】模型真的调了 lookupProduct，参数是 sku。目录里找机械键盘 /
 * 无线鼠标 / 智能水杯。找不到就当没这条。
 *
 * 【转换点】按**精确 sku** find。命中只返回 { sku, name, stock, price }，
 * 不要整份 Product（不要 id / category）。CP-009 库存 0 仍返回——缺货也是查到了。
 * sku 空串或找不到 → null。不要 mutate products。
 *
 * 任务：LookupHit 或 null。
 * 示例：
 *   KB-001 → { sku:"KB-001", name:"机械键盘", stock:120, price:599 }
 *   MS-002 → { sku:"MS-002", name:"无线鼠标", stock:300, price:159 }
 *   CP-009 → stock 0 的 LookupHit；"NOPE" / "" → null
 *
 * 提示：find。空串先挡掉。返回新对象。
 */
export function executeLookup(products: Product[], sku: string): LookupHit | null {
  throw new Error("TODO");
}`,
  },
  {
    name: "executeCalc",
    testSuite: "executeCalc",
    skeleton: `/**
 * 【场景】模型调了 calcLineTotal：2 件键盘 599 → 1198；3 件鼠标 159 → 477。
 *
 * 【转换点】qty 必须 Number.isInteger 且 ≥ 1。
 * unitPrice 必须 typeof "number" 且 Number.isFinite 且 ≥ 0。
 * 否则 null（不要 NaN，不要 Infinity，不要 0 件）。
 *
 * 任务：合格则 qty * unitPrice，否则 null。
 * 示例：
 *   (2, 599) → 1198；（3, 159) → 477
 *   qty 为 0 / -1 / 1.5 / NaN / Infinity，或 unitPrice 为 -1 → null
 *
 * 提示：先校验再乘。不要 toFixed。
 */
export function executeCalc(qty: number, unitPrice: number): number | null {
  throw new Error("TODO");
}`,
  },
  {
    name: "shouldCallTool",
    testSuite: "shouldCallTool",
    skeleton: `/**
 * 【场景】假决策表：还没有真模型时，用关键词模拟「模型要不要调工具」。
 * 「2件机械键盘多少钱」该算账；「KB-001 还有货吗」该查询；「用 bash 查」不要建议危险工具。
 *
 * 【转换点】按这个顺序，先到先得：
 *   1. 含 "bash" 或 "写文件" → null
 *   2. 含 "小计" 或 "多少钱" → "calcLineTotal"
 *   3. 含 "库存" 或 /[A-Z]{2}-\\d{3}/ → "lookupProduct"
 *   4. 否则 null
 *
 * 任务：返回工具名或 null。
 * 示例：
 *   "2件机械键盘多少钱" / "帮我算小计" → calcLineTotal
 *   "机械键盘还有库存吗" / "KB-001 还有货吗" → lookupProduct
 *   "你好" / "用 bash 查一下" / "写文件保存订单" / "" → null
 *
 * 提示：includes + test。危险词永远第一优先。
 */
export function shouldCallTool(userText: string): "lookupProduct" | "calcLineTotal" | null {
  throw new Error("TODO");
}`,
  },
  {
    name: "formatToolResult",
    testSuite: "formatToolResult",
    skeleton: `/**
 * 【场景】工具跑完，要把结果变成给模型看的一句文本。
 * 键盘命中：「KB-001 机械键盘 库存 120 单价 599」。算账：「小计 1198」。
 *
 * 【转换点】按 name 分：
 *   lookupProduct + LookupHit 形（sku/name/stock/price 且类型对）
 *     → \`\${sku} \${name} 库存 \${stock} 单价 \${price}\`
 *   lookupProduct + null → "未找到该 SKU"
 *   calcLineTotal + 有限 number → \`小计 \${payload}\`
 *   其它（错搭配、缺字段、字符串数字）→ ""
 *
 * 任务：返回字符串。
 * 示例：
 *   lookup + 键盘 hit → "KB-001 机械键盘 库存 120 单价 599"
 *   lookup + 鼠标 hit → "MS-002 无线鼠标 库存 300 单价 159"
 *   lookup + null → "未找到该 SKU"；calc + 1198 → "小计 1198"；calc + "1198" → ""
 *
 * 提示：先看 name，再认 payload 形状。不要 JSON.stringify。
 */
export function formatToolResult(name: "lookupProduct" | "calcLineTotal", payload: unknown): string {
  throw new Error("TODO");
}`,
  },
  {
    name: "applyToolCall",
    testSuite: "applyToolCall",
    skeleton: `/**
 * 【场景】假流吐出 tool_call 之后，Agent 循环要真正执行并得到一句文本。
 * 这是综合题：把查找 / 计算 / 格式化接在一起。
 *
 * 【转换点】必须调用前面的函数，不要复制实现：
 *   lookupProduct → formatToolResult("lookupProduct", executeLookup(products, args.sku ?? ""))
 *   calcLineTotal → formatToolResult("calcLineTotal", executeCalc(args.qty ?? 0, args.unitPrice ?? -1))
 *
 * 任务：返回格式化后的字符串。
 * 示例：
 *   lookup KB-001 → "KB-001 机械键盘 库存 120 单价 599"
 *   lookup NOPE → "未找到该 SKU"
 *   calc {qty:2, unitPrice:599} → "小计 1198"
 *
 * 提示：缺 sku 当 ""；缺 qty 当 0；缺 unitPrice 当 -1。
 */
export function applyToolCall(
  products: Product[],
  name: "lookupProduct" | "calcLineTotal",
  args: { sku?: string; qty?: number; unitPrice?: number },
): string {
  throw new Error("TODO");
}`,
  },
];

const assignment = `${preamble}

${functions.map((f) => f.skeleton).join("\n\n")}
`;

const testSource = `const catalog = PRODUCTS as Product[];

const LOOKUP_TOOL: AgentToolDef = {
  name: "lookupProduct",
  label: "查询商品",
  description: "按 SKU 查商品名称、库存和单价",
  parameters: {
    type: "object",
    required: ["sku"],
    properties: {
      sku: { type: "string", description: "商品 SKU，例如 KB-001" },
    },
  },
};

const CALC_TOOL: AgentToolDef = {
  name: "calcLineTotal",
  label: "计算小计",
  description: "数量乘单价得到行小计",
  parameters: {
    type: "object",
    required: ["qty", "unitPrice"],
    properties: {
      qty: { type: "number", description: "购买数量，整数 ≥ 1" },
      unitPrice: { type: "number", description: "单价" },
    },
  },
};

const KB_HIT: LookupHit = { sku: "KB-001", name: "机械键盘", stock: 120, price: 599 };
const MS_HIT: LookupHit = { sku: "MS-002", name: "无线鼠标", stock: 300, price: 159 };
const CUP_HIT: LookupHit = { sku: "CP-009", name: "智能水杯", stock: 0, price: 199 };

describe("lookupProductTool", () => {
  it("精确返回查询商品工具", () => {
    expect(lookupProductTool()).toEqual(LOOKUP_TOOL);
  });
  it("name / label / sku description 对得上", () => {
    const t = lookupProductTool();
    expect(t.name).toBe("lookupProduct");
    expect(t.label).toBe("查询商品");
    expect(t.parameters.properties.sku.description).toBe("商品 SKU，例如 KB-001");
  });
  it("required 只有 sku；name 不是 bash / write / edit", () => {
    expect(lookupProductTool().parameters.required).toEqual(["sku"]);
    expect(lookupProductTool().name).toBe("lookupProduct");
  });
});

describe("calcLineTotalTool", () => {
  it("精确返回计算小计工具", () => {
    expect(calcLineTotalTool()).toEqual(CALC_TOOL);
  });
  it("qty / unitPrice 都是 number（防只抄查询工具）", () => {
    const t = calcLineTotalTool();
    expect(t.name).toBe("calcLineTotal");
    expect(t.parameters.properties.qty.type).toBe("number");
    expect(t.parameters.properties.unitPrice.type).toBe("number");
    expect(t.parameters.properties.qty.description).toBe("购买数量，整数 ≥ 1");
  });
  it("required 是 qty 与 unitPrice", () => {
    expect(calcLineTotalTool().parameters.required).toEqual(["qty", "unitPrice"]);
  });
});

describe("executeLookup", () => {
  it("KB-001 → 机械键盘 LookupHit", () => {
    Object.freeze(catalog);
    expect(executeLookup(catalog, "KB-001")).toEqual(KB_HIT);
  });
  it("MS-002 → 无线鼠标（防硬编码键盘）", () => {
    Object.freeze(catalog);
    expect(executeLookup(catalog, "MS-002")).toEqual(MS_HIT);
  });
  it("CP-009 库存 0 仍返回；NOPE / 空串 → null", () => {
    Object.freeze(catalog);
    expect(executeLookup(catalog, "CP-009")).toEqual(CUP_HIT);
    expect(executeLookup(catalog, "NOPE")).toBeNull();
    expect(executeLookup(catalog, "")).toBeNull();
  });
  it("不 mutate products；不返回整份 Product", () => {
    const copy = catalog.slice();
    Object.freeze(copy);
    const hit = executeLookup(copy, "KB-001");
    expect(copy.length).toBe(10);
    expect(copy[0].stock).toBe(120);
    expect(hit).toEqual(KB_HIT);
  });
});

describe("executeCalc", () => {
  it("2 件键盘 599 → 1198", () => {
    expect(executeCalc(2, 599)).toBe(1198);
  });
  it("3 件鼠标 159 → 477（防硬编码 1198）", () => {
    expect(executeCalc(3, 159)).toBe(477);
  });
  it("qty 非法或 unitPrice 非法 → null", () => {
    expect(executeCalc(0, 599)).toBeNull();
    expect(executeCalc(-1, 599)).toBeNull();
    expect(executeCalc(1.5, 599)).toBeNull();
    expect(executeCalc(Number.NaN, 599)).toBeNull();
    expect(executeCalc(Number.POSITIVE_INFINITY, 599)).toBeNull();
    expect(executeCalc(1, -1)).toBeNull();
    expect(executeCalc(1, Number.POSITIVE_INFINITY)).toBeNull();
  });
});

describe("shouldCallTool", () => {
  it("多少钱 / 小计 → calcLineTotal", () => {
    expect(shouldCallTool("2件机械键盘多少钱")).toBe("calcLineTotal");
    expect(shouldCallTool("帮我算小计")).toBe("calcLineTotal");
  });
  it("库存或 SKU → lookupProduct（含 KB-001 正则）", () => {
    expect(shouldCallTool("机械键盘还有库存吗")).toBe("lookupProduct");
    expect(shouldCallTool("KB-001 还有货吗")).toBe("lookupProduct");
    expect(shouldCallTool("MS-002")).toBe("lookupProduct");
  });
  it("你好 / 空串 / bash / 写文件 → null", () => {
    expect(shouldCallTool("你好")).toBeNull();
    expect(shouldCallTool("")).toBeNull();
    expect(shouldCallTool("用 bash 查一下")).toBeNull();
    expect(shouldCallTool("写文件保存订单")).toBeNull();
  });
});

describe("formatToolResult", () => {
  it("lookup 键盘 hit → 库存句", () => {
    expect(formatToolResult("lookupProduct", KB_HIT)).toBe("KB-001 机械键盘 库存 120 单价 599");
  });
  it("lookup 无线鼠标 hit；calc 1198 / 477", () => {
    expect(formatToolResult("lookupProduct", MS_HIT)).toBe("MS-002 无线鼠标 库存 300 单价 159");
    expect(formatToolResult("calcLineTotal", 1198)).toBe("小计 1198");
    expect(formatToolResult("calcLineTotal", 477)).toBe("小计 477");
  });
  it("null / 错搭配 / 缺字段 / 字符串数字 → 约定值", () => {
    expect(formatToolResult("lookupProduct", null)).toBe("未找到该 SKU");
    expect(formatToolResult("lookupProduct", 1198)).toBe("");
    expect(formatToolResult("calcLineTotal", KB_HIT)).toBe("");
    expect(formatToolResult("calcLineTotal", "1198")).toBe("");
    expect(formatToolResult("lookupProduct", { sku: "KB-001", name: "机械键盘", stock: 120 })).toBe("");
    expect(formatToolResult("calcLineTotal", Number.NaN)).toBe("");
  });
});

describe("applyToolCall", () => {
  it("lookup KB-001 → 格式化句", () => {
    Object.freeze(catalog);
    expect(applyToolCall(catalog, "lookupProduct", { sku: "KB-001" })).toBe(
      "KB-001 机械键盘 库存 120 单价 599",
    );
  });
  it("lookup 无线鼠标；calc 2×599 与 3×159", () => {
    Object.freeze(catalog);
    expect(applyToolCall(catalog, "lookupProduct", { sku: "MS-002" })).toBe(
      "MS-002 无线鼠标 库存 300 单价 159",
    );
    expect(applyToolCall(catalog, "calcLineTotal", { qty: 2, unitPrice: 599 })).toBe("小计 1198");
    expect(applyToolCall(catalog, "calcLineTotal", { qty: 3, unitPrice: 159 })).toBe("小计 477");
  });
  it("lookup NOPE → 未找到；缺参走默认", () => {
    Object.freeze(catalog);
    expect(applyToolCall(catalog, "lookupProduct", { sku: "NOPE" })).toBe("未找到该 SKU");
    expect(applyToolCall(catalog, "lookupProduct", {})).toBe("未找到该 SKU");
    expect(applyToolCall(catalog, "calcLineTotal", {})).toBe("");
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
    `> **预计**：1 天 ｜ **前置**：Ch22（统一模型流）、Ch07（运行时形状）
> **目标**：① \`new Agent({ tools, streamFn })\`；② 模型决定调不调工具；③ 用两个商品工具（查询 + 小计）把 Agent 循环拆成可测的纯函数。
> 你 15 年 Java：Spring \`@Service\` 方法是**你**在 Controller 里调用的。Agent 的 Tool 是**模型**看 schema 之后才决定调不调。Python 课已经讲过 Prompt / RAG / ReAct **原理**——本章**不重复**那些，只教 TypeScript 里 \`@earendil-works/pi-agent-core\` 怎么挂最小 Tool。

> 📐 **本教程的契约**：下面每一节（§23.1–§23.7）都**精确对应**作业里的题。讲过的才考，考的必讲过。卡住时按作业函数名回查对应小节。
> **不讲**：\`beforeToolCall\` 细（Ch24）、\`createAgentSession\`（Ch25）、Hono+SSE（Ch26）。**禁止**给学生 bash / 写文件系统工具。JSON 作业是纯函数：目录和参数进、字符串出。

---`,
    [],
  ),
  sec(
    "sec-map",
    "🗺️ 本章地图",
    null,
    `本章主线：**商品助手 Agent** 第一次真正「会用工具」。用户问库存，模型可能先 \`tool_call lookupProduct\`（sku \`KB-001\`），你查目录得到库存 120，再把一句文本喂回模型，最后才 \`text_delta\`。

读完这章 + 完成作业，你将能够：

- 交出 \`lookupProduct\` / \`calcLineTotal\` 的 JSON Schema 形工具定义（作业不 import TypeBox）
- 按精确 SKU 查出 \`LookupHit\`（缺货 CP-009 也算命中）
- 校验数量和单价后算行小计
- 用关键词表模拟「该不该调工具」（含拒绝 bash / 写文件）
- 把工具结果格式化成给模型看的一句文本
- 用 \`applyToolCall\` 把查找 / 计算 / 格式化接在一起

**作业 ↔ 教程对应表**（学哪节，就去做哪题）：

| 作业题 | 对应小节 | 核心知识点 |
|--------|----------|-----------|
| \`lookupProductTool\` | §23.1 | 查询工具的 JSON Schema 形定义 |
| \`calcLineTotalTool\` | §23.2 | 小计工具的 JSON Schema 形定义 |
| \`executeLookup\` | §23.3 | 精确 SKU → LookupHit / null |
| \`executeCalc\` | §23.4 | 整数件数 × 有限单价 |
| \`shouldCallTool\` | §23.5 | 假决策表；拒绝危险工具 |
| \`formatToolResult\` | §23.6 | hit / null / 数字 → 一句文本 |
| \`applyToolCall\` | §23.7 | 复用前面三个函数接线 |

本地文件：\`local/m5/ch23/assignment.ts\`（改 TODO）、\`app.ts\`（假 \`streamFn\`：先 tool_call 再 text，不联网）、\`assignment.test.ts\`、\`demo.ts\`（真 \`pi-agent-core\` 复制区，测试不要 import 它）。

跑测试：\`bun test local/m5/ch23\`。

---`,
    [],
  ),
  sec(
    "sec-path",
    "⏱️ 学习路径：费曼五步（约 60–80 分钟）",
    null,
    `| 步 | 你要做 | 在哪做 |
|----|--------|--------|
| ① 预览猜（2 分钟） | 猜 Agent 和「直接 stream」差在哪；谁决定调工具 | 本页 ① |
| ② 先动手 | 打开 \`local/m5/ch23/assignment.ts\` 改 TODO | 仓库 local/ |
| ③ 提取+反馈 | \`bun test local/m5/ch23\` 看红绿 | 终端 |
| ④ 费曼（2 分钟） | 大白话讲清「为什么 execute 失败要 throw」 | 本页 ④ |
| ⑤ 存闪卡 | 章末闪卡标复习日期 | 闪卡 |

> 💡 网页这一章是只读的。不要在浏览器里改代码。没有 API Key 作业也能绿——测的是纯函数 + 假事件。真跑 Agent 见 \`demo.ts\`（要 Key + 装包，本课测试不跑它）。
> \`applyToolCall\` **必须调用** \`executeLookup\` / \`executeCalc\` / \`formatToolResult\`。

---`,
    [],
  ),
  sec(
    "sec-guess",
    "① 预览猜（2 分钟 · 激活你的 Java / Python 直觉）",
    null,
    `先别看答案，凭经验猜一猜（猜错没关系）：

1. Java 里 \`productService.lookup("KB-001")\` 是谁调用的？Agent 的 \`lookupProduct\` 呢——还是你在 if 里调，还是模型看了 schema 才调？
2. 本机没有 \`OPENAI_API_KEY\`，\`bun test local/m5/ch23\` 还能绿吗？假的 \`streamFn\` 测的是什么？
3. 工具 execute 找不到 SKU：把 \`"未找到"\` 当成功 content 返回，和 throw，Agent 循环各会怎么理解？
4. 用户说「用 bash 查一下库存」：该建议 \`lookupProduct\`，还是什么都不调？
5. 智能水杯 CP-009 库存是 0：算「没查到」还是「查到了，只是没货」？
6. \`applyToolCall\` 为什么不许把查找逻辑再写一遍？

> 猜完，带着验证心态进入正文。第 1、2、3 题是本章的 🔴。

---`,
    [],
  ),
  sec(
    "sec-world",
    "最小 Agent：tools + 假 streamFn 🔴",
    null,
    `Ch22 的 \`@earendil-works/pi-ai\` 是**统一模型流**：你订阅 \`text_delta\`。本章往上走一层：\`@earendil-works/pi-agent-core\` 的 \`Agent\` 会在流里看到 \`tool_call\`，然后去跑你登记的 Tool，再把结果送回模型。

包名是 \`@earendil-works/pi-agent-core\`（不要用过时的 \`@mariozechner/*\`）。文档：https://pi.dev/docs/latest/sdk

**模型决定调不调工具。** 你只负责：工具清单（schema）+ \`execute\`。不要写 \`if (user.includes("库存")) lookup()\` 当真循环——作业里的 \`shouldCallTool\` 只是**没有 Key 时的假决策表**，用来练分支，不是 Pi 运行时。

真 API（复制到有 Key 的环境；作业**不要** import）：

\`\`\`ts
import { Agent } from "@earendil-works/pi-agent-core";
import { Type } from "typebox";

const lookupProduct: AgentTool = {
  name: "lookupProduct",
  label: "查询商品",
  description: "按 SKU 查商品名称、库存和单价",
  parameters: Type.Object({ sku: Type.String({ description: "商品 SKU，例如 KB-001" }) }),
  execute: async (_id, params) => {
    // 查目录；失败 throw，不要把错误当 content 返回
    return { content: [{ type: "text", text: "KB-001 机械键盘 库存 120 单价 599" }] };
  },
};

const agent = new Agent({
  initialState: {
    systemPrompt: "你是商品助手。只用 lookupProduct 和 calcLineTotal。禁止 bash 和写文件。",
    model, // 点到即可：从 Ch22 的 builtinModels 取一个
    tools: [lookupProduct, calcLineTotal],
  },
  streamFn: models.streamSimple.bind(models), // 作业用假 streamFn
});
await agent.prompt("机械键盘还有货吗");
\`\`\`

\`streamFn\` 即使是假的，也能测循环心智：先吐 \`tool_call\`，你执行工具，再吐 \`text_delta\`。本地 \`app.ts\` 的 \`fakeToolThenTextStream\` 就是这条假管道，不联网。

### Java：\`@Service\` 方法 vs Tool

\`\`\`java
@Service
public class ProductLookupService {
    public Product lookup(String sku) {
        return catalog.findBySku(sku); // Controller 里你亲自调用
    }
}
\`\`\`

Spring 是**你的代码**决定何时调 Service。Agent 是**模型**读了 \`name\` / \`description\` / \`parameters\` 之后才可能 \`tool_call\`。同一套查找逻辑，调用权换了人。

### Python：LangChain tool / FastAPI 依赖

\`\`\`python
from langchain_core.tools import tool

@tool
def lookup_product(sku: str) -> str:
    """按 SKU 查商品名称、库存和单价"""
    ...
\`\`\`

LangChain 的 \`@tool\` 更接近本章：schema + 函数交给模型。FastAPI 的 \`Depends\` 仍是**框架**注入，不是模型选择。不要把 Python 课的 ReAct 原理再讲一遍——这里只记 TypeScript 的挂法。

### 真 AgentTool 用 TypeBox；作业用 JSON Schema 形对象

真 API：\`parameters: Type.Object({ ... })\`（TypeBox）。作业**禁止** import \`typebox\` / zod：返回一个冻结的 JSON Schema 形对象（\`type: "object"\`、\`required\`、\`properties\`）。形状对齐，方便以后换真 Tool。

### execute 失败要 throw 🟡

真 \`execute\`：**失败 throw**。不要 \`return { content: [{ type: "text", text: "出错了" }] }\` 假装成功——模型会把那句话当成工具真的查到了。

作业是纯函数，测试器用 \`.toBeNull\` 不接 throw：\`executeLookup\` 找不到返回 \`null\`，\`formatToolResult\` 再变成 \`"未找到该 SKU"\`。这是测试友好的拆法，**不要**把「作业返回 null」理解成「真 Tool 该返回错误字符串」。

### 禁止 bash / 写文件 🟡

商品助手只需要查目录和算小计。**不要**登记 bash、写文件系统、随便 edit 的工具。\`shouldCallTool\` 见到 \`"bash"\` / \`"写文件"\` 直接 \`null\`。

### ❌ / ✅

\`\`\`ts
// ❌ 作业 import 真包去 new Agent、去 fetch 模型
// ❌ execute 找不到 SKU 还当成功 content 返回 "未找到"
// ❌ 给学生 bash / 写文件工具「方便调试」
// ❌ 把 Prompt / RAG / ReAct 再实现一遍当作业
// ✅ 假 streamFn 先 tool_call 再 text；作业纯函数；真 API 见 demo.ts
\`\`\`

\`\`\`mermaid
flowchart TD
    user["用户问机械键盘库存"] --> agent["new Agent"]
    agent --> stream["假或真 streamFn"]
    stream --> decide{"模型要调工具?"}
    decide -->|"tool_call"| exec["execute 查目录"]
    exec --> fmt["结果回模型"]
    fmt --> stream2["再进 streamFn"]
    decide -->|"text"| say["text_delta 库存 120"]
    say --> doneN["done stop"]

    style user fill:#FFE082,stroke:#F9A825,color:#1f1f1f
    style agent fill:#80DEEA,stroke:#0097A7,color:#1f1f1f
    style stream fill:#80DEEA,stroke:#0097A7,color:#1f1f1f
    style stream2 fill:#80DEEA,stroke:#0097A7,color:#1f1f1f
    style decide fill:#CE93D8,stroke:#7B1FA2,color:#1f1f1f
    style exec fill:#A5D6A7,stroke:#388E3C,color:#1f1f1f
    style fmt fill:#A5D6A7,stroke:#388E3C,color:#1f1f1f
    style say fill:#A5D6A7,stroke:#388E3C,color:#1f1f1f
    style doneN fill:#A5D6A7,stroke:#388E3C,color:#1f1f1f
\`\`\`

无 Key：测试用假事件。真跑要供应商 Key + \`bun add @earendil-works/pi-agent-core\`，见 \`demo.ts\`。测试**禁止** import \`demo.ts\`。

### 本课怎么算「会了」

打开 \`local/m5/ch23/assignment.ts\`，\`bun test local/m5/ch23\`。七个纯函数全绿，再加：假 async generator 第一件是 \`tool_call lookupProduct\`，接着 \`applyToolCall\` 能吐出键盘那句库存。**全绿 = 这题掌握。**

---`,
    [],
  ),
  sec(
    "sec-23.1",
    "§23.1 查询工具的 schema（对应：`lookupProductTool`）🟡",
    "23.1",
    `模型「看见」的是工具的名字、中文标签、自然语言描述和参数 schema，不是你的 TypeScript 类型（类型会蒸发，Ch07 讲过）。

真 API 用 \`Type.Object({ sku: Type.String({ description: "..." }) })\`。作业返回普通对象，字段对齐 JSON Schema：

\`\`\`ts
function lookupProductTool(): AgentToolDef {
  return {
    name: "lookupProduct",
    label: "查询商品",
    description: "按 SKU 查商品名称、库存和单价",
    parameters: {
      type: "object",
      required: ["sku"],
      properties: {
        sku: { type: "string", description: "商品 SKU，例如 KB-001" },
      },
    },
  };
}

lookupProductTool().name; // "lookupProduct"
lookupProductTool().parameters.required; // ["sku"]
\`\`\`

\`name\` 不要用 \`bash\` / \`write\` / \`edit\`。商品助手只查目录。

对照：Java 的 OpenAPI \`@Schema(description=...)\` 给**调用方文档**看；这里的 description 给**模型**看，写清楚「按 SKU 查」它才知道何时调。

### ❌ / ✅

\`\`\`ts
// ❌ name: "bash" 或 "search" 随便起
// ❌ 漏 required，模型可能不传 sku
// ❌ import typebox 写进作业
// ✅ 整个对象精确相等；name 就是 lookupProduct
\`\`\`

> ✅ **做 \`lookupProductTool\`**：精确返回查询工具定义。

---`,
    ["lookupProductTool"],
  ),
  sec(
    "sec-23.2",
    "§23.2 小计工具的 schema（对应：`calcLineTotalTool`）🟡",
    "23.2",
    `第二个工具：数量乘单价。用户问「2件机械键盘多少钱」时，模型可能先查单价再算，或直接拿已知单价来调这个工具。

\`\`\`ts
function calcLineTotalTool(): AgentToolDef {
  return {
    name: "calcLineTotal",
    label: "计算小计",
    description: "数量乘单价得到行小计",
    parameters: {
      type: "object",
      required: ["qty", "unitPrice"],
      properties: {
        qty: { type: "number", description: "购买数量，整数 ≥ 1" },
        unitPrice: { type: "number", description: "单价" },
      },
    },
  };
}

calcLineTotalTool().parameters.required; // ["qty", "unitPrice"]
\`\`\`

两个参数都是 \`number\`。schema **不执行**乘法——执行在 \`executeCalc\`。Java 老手别把「方法签名」和「方法体」写进同一个作业函数。

### ❌ / ✅

\`\`\`ts
// ❌ 只抄 lookupProductTool，required 仍是 ["sku"]
// ❌ qty 写成 string
// ❌ 在这个函数里直接 return 2 * 599
// ✅ 精确返回小计工具定义
\`\`\`

> ✅ **做 \`calcLineTotalTool\`**：精确返回小计工具定义。

---`,
    ["calcLineTotalTool"],
  ),
  sec(
    "sec-23.3",
    "§23.3 按 SKU 查目录（对应：`executeLookup`）🟡",
    "23.3",
    `这是工具的**方法体**（作业版）。按精确 \`sku\` \`find\`。命中只掏四字段：\`sku\` / \`name\` / \`stock\` / \`price\`。

智能水杯 CP-009 \`stock\` 为 **0** 仍返回：缺货是查到了，不是没这条 SKU。找不到或 \`sku === ""\` → \`null\`。

真 \`AgentTool.execute\` 失败要 **throw**。作业返回 \`null\` 是为了纯函数好测，后面 \`formatToolResult\` 再变成 \`"未找到该 SKU"\`。

\`\`\`ts
function executeLookup(products: Product[], sku: string): LookupHit | null {
  if (sku === "") return null;
  const found = products.find((p) => p.sku === sku);
  if (!found) return null;
  return { sku: found.sku, name: found.name, stock: found.stock, price: found.price };
}

executeLookup(catalog, "KB-001");
// { sku:"KB-001", name:"机械键盘", stock:120, price:599 }

executeLookup(catalog, "MS-002");
// { sku:"MS-002", name:"无线鼠标", stock:300, price:159 }

executeLookup(catalog, "CP-009"); // stock 0，仍是 hit
executeLookup(catalog, "NOPE");   // null
executeLookup(catalog, "");       // null
\`\`\`

不要 mutate \`products\`。测试会 \`Object.freeze\`。不要 \`return found\`——那会带上 \`id\` / \`category\`，\`toEqual\` 会红。

### ❌ / ✅

\`\`\`ts
// ❌ return found 整份 Product
// ❌ stock === 0 当成找不到
// ❌ products.splice 改原数组
// ❌ 真 Tool 里 return 错误字符串当成功 content（应该 throw）
// ✅ 精确 sku；四字段；0 库存仍 hit
\`\`\`

> ✅ **做 \`executeLookup\`**：键盘 + 鼠标 + 水杯 0 库存。

---`,
    ["executeLookup"],
  ),
  sec(
    "sec-23.4",
    "§23.4 行小计（对应：`executeCalc`）🟢",
    "23.4",
    `件数必须是整数且 ≥ 1。单价必须是有限 number 且 ≥ 0。否则 \`null\`。

\`\`\`ts
function executeCalc(qty: number, unitPrice: number): number | null {
  if (!Number.isInteger(qty) || qty < 1) return null;
  if (typeof unitPrice !== "number" || !Number.isFinite(unitPrice) || unitPrice < 0) {
    return null;
  }
  return qty * unitPrice;
}

executeCalc(2, 599); // 1198  两件机械键盘
executeCalc(3, 159); // 477   三件无线鼠标
executeCalc(0, 599); // null
executeCalc(1.5, 599); // null
executeCalc(1, -1); // null
\`\`\`

\`Number.isInteger(1.5)\` 是 false；\`Number.isInteger(NaN)\` / \`Infinity\` 也是 false。\`Number.isFinite(-1)\` 是 true，所以单价还要 \`>= 0\`。

对照 Java \`if (qty < 1) throw\`；这里返回 \`null\` 让格式化函数去说「这不是一句小计」。

### ❌ / ✅

\`\`\`ts
// ❌ qty 为 0 仍乘出 0 当成功
// ❌ unitPrice 为 Infinity 当成功
// ❌ 只对 599 写死 1198
// ✅ 校验后再乘；鼠标 477 也要对
\`\`\`

> ✅ **做 \`executeCalc\`**：1198 和 477；一串非法 → null。

---`,
    ["executeCalc"],
  ),
  sec(
    "sec-23.5",
    "§23.5 假决策表（对应：`shouldCallTool`）🔴",
    "23.5",
    `真循环里**模型**决定调哪个工具。没有 Key 时用关键词模拟，方便测试分支。顺序是契约，不要打乱：

1. 含 \`"bash"\` 或 \`"写文件"\` → \`null\`（不要建议危险工具）
2. 含 \`"小计"\` 或 \`"多少钱"\` → \`"calcLineTotal"\`
3. 含 \`"库存"\` 或 \`/[A-Z]{2}-\\d{3}/\` → \`"lookupProduct"\`
4. 否则 \`null\`

\`\`\`ts
function shouldCallTool(userText: string): "lookupProduct" | "calcLineTotal" | null {
  if (userText.includes("bash") || userText.includes("写文件")) return null;
  if (userText.includes("小计") || userText.includes("多少钱")) return "calcLineTotal";
  if (userText.includes("库存") || /[A-Z]{2}-\\d{3}/.test(userText)) return "lookupProduct";
  return null;
}

shouldCallTool("2件机械键盘多少钱"); // calcLineTotal
shouldCallTool("帮我算小计");           // calcLineTotal
shouldCallTool("机械键盘还有库存吗");   // lookupProduct
shouldCallTool("KB-001 还有货吗");      // lookupProduct（正则命中 SKU）
shouldCallTool("你好");                 // null
shouldCallTool("用 bash 查一下");       // null
shouldCallTool("写文件保存订单");       // null
shouldCallTool("");                     // null
\`\`\`

「KB-001 还有货吗」没有「库存」二字，靠 SKU 正则。先检查危险词：即使用户同时说了库存，也不要建议 bash。

\`\`\`mermaid
flowchart TD
    startN["userText"] --> danger{"含 bash 或写文件?"}
    danger -->|"是"| no1["返回 null"]
    danger -->|"否"| calc{"含小计或多少钱?"}
    calc -->|"是"| tCalc["calcLine<br/>Total"]
    calc -->|"否"| look{"含库存或 SKU?"}
    look -->|"是"| tLook["lookup<br/>Product"]
    look -->|"否"| no2["返回 null"]

    style startN fill:#FFE082,stroke:#F9A825,color:#1f1f1f
    style danger fill:#EF9A9A,stroke:#C62828,color:#1f1f1f
    style no1 fill:#EF9A9A,stroke:#C62828,color:#1f1f1f
    style calc fill:#80DEEA,stroke:#0097A7,color:#1f1f1f
    style tCalc fill:#A5D6A7,stroke:#388E3C,color:#1f1f1f
    style look fill:#80DEEA,stroke:#0097A7,color:#1f1f1f
    style tLook fill:#A5D6A7,stroke:#388E3C,color:#1f1f1f
    style no2 fill:#CE93D8,stroke:#7B1FA2,color:#1f1f1f
\`\`\`

### ❌ / ✅

\`\`\`ts
// ❌ 先看库存，导致「用 bash 查库存」仍去 lookup
// ❌ 硬编码只认「机械键盘」四个字
// ❌ 把这张表当成真 Agent 运行时（真运行时是模型决定）
// ✅ 危险词优先；多少钱优先于 SKU
\`\`\`

> ✅ **做 \`shouldCallTool\`**：算账 / 查询 / 拒绝危险词。

---`,
    ["shouldCallTool"],
  ),
  sec(
    "sec-23.6",
    "§23.6 格式化工具结果（对应：`formatToolResult`）🟡",
    "23.6",
    `真 Tool 的 \`content: [{ type: "text", text: "..." }]\` 就是一句给模型看的话。作业把这句话纯函数化。

\`\`\`ts
function formatToolResult(
  name: "lookupProduct" | "calcLineTotal",
  payload: unknown,
): string {
  if (name === "lookupProduct") {
    if (payload === null) return "未找到该 SKU";
    if (payload !== null && typeof payload === "object") {
      const o = payload as Record<string, unknown>;
      if (
        typeof o.sku === "string" &&
        typeof o.name === "string" &&
        typeof o.stock === "number" &&
        typeof o.price === "number"
      ) {
        return \`\${o.sku} \${o.name} 库存 \${o.stock} 单价 \${o.price}\`;
      }
    }
    return "";
  }
  if (typeof payload === "number" && Number.isFinite(payload)) return \`小计 \${payload}\`;
  return "";
}

formatToolResult("lookupProduct", { sku:"KB-001", name:"机械键盘", stock:120, price:599 });
// "KB-001 机械键盘 库存 120 单价 599"

formatToolResult("lookupProduct", { sku:"MS-002", name:"无线鼠标", stock:300, price:159 });
// "MS-002 无线鼠标 库存 300 单价 159"

formatToolResult("lookupProduct", null); // "未找到该 SKU"
formatToolResult("calcLineTotal", 1198); // "小计 1198"
formatToolResult("calcLineTotal", 477);  // "小计 477"
formatToolResult("calcLineTotal", "1198"); // ""  字符串数字不算
\`\`\`

错 name 搭配、缺字段、\`NaN\` → \`""\`。lookup 的 \`null\` 是特例，不是空串。

### ❌ / ✅

\`\`\`ts
// ❌ calc 的 payload 是 "1198" 也拼出「小计 1198」
// ❌ lookup 缺 price 仍拼一句
// ❌ JSON.stringify 整份 hit
// ✅ 认形状；键盘句和鼠标句都要对
\`\`\`

> ✅ **做 \`formatToolResult\`**：两句库存 + 两句小计 + 一串空串。

---`,
    ["formatToolResult"],
  ),
  sec(
    "sec-23.7",
    "§23.7 接线（对应：`applyToolCall`）🔴",
    "23.7",
    `假 \`streamFn\` 吐出 \`{ type: "tool_call", name: "lookupProduct", args: { sku: "KB-001" } }\` 之后，循环要执行工具。本题**必须调用**前面的函数，不要复制 \`find\` / 乘法。

\`\`\`ts
function applyToolCall(
  products: Product[],
  name: "lookupProduct" | "calcLineTotal",
  args: { sku?: string; qty?: number; unitPrice?: number },
): string {
  if (name === "lookupProduct") {
    return formatToolResult("lookupProduct", executeLookup(products, args.sku ?? ""));
  }
  return formatToolResult("calcLineTotal", executeCalc(args.qty ?? 0, args.unitPrice ?? -1));
}

applyToolCall(catalog, "lookupProduct", { sku: "KB-001" });
// "KB-001 机械键盘 库存 120 单价 599"

applyToolCall(catalog, "lookupProduct", { sku: "NOPE" });
// "未找到该 SKU"

applyToolCall(catalog, "calcLineTotal", { qty: 2, unitPrice: 599 });
// "小计 1198"
\`\`\`

缺 \`sku\` 当 \`""\`（查不到）。缺 \`qty\` 当 \`0\`、缺 \`unitPrice\` 当 \`-1\`（\`executeCalc\` 会 null，格式化成 \`""\`）。

本地测试会 \`for await\` \`fakeToolThenTextStream()\`：第一件必须是 \`tool_call lookupProduct\`，然后把同样的 args 交给 \`applyToolCall\`。

### ❌ / ✅

\`\`\`ts
// ❌ 自己再写一遍 find，不调用 executeLookup
// ❌ 硬编码 return "KB-001 机械键盘 库存 120 单价 599"
// ❌ 缺参时 throw（应用默认值走进已有函数）
// ✅ 两行调用；NOPE 和鼠标小计也能绿
\`\`\`

> ✅ **做 \`applyToolCall\`**：调用 executeLookup / executeCalc / formatToolResult。

---`,
    ["applyToolCall"],
  ),
  sec(
    "sec-pits",
    "⚠️ Java / Python 老手几个坑",
    null,
    `1. **以为 Tool 像 \`@Service\` 一样由你调用。** 真循环里是模型决定。作业 \`shouldCallTool\` 只是假决策表。
2. **没有 Key 就不会写作业。** 假 \`streamFn\` / 纯函数就能绿。真跑才要 Key，见 \`demo.ts\`。
3. **execute 把错误字符串当成功 content。** 真 API 失败要 throw。作业 \`null\` ≠ 真 Tool 返回 "未找到"。
4. **给学生 bash / 写文件。** 商品助手禁止。危险词一律不调工具。
5. **CP-009 stock 0 当成找不到。** 缺货是 hit。
6. **\`return found\` 整份 Product。** 只要四字段。
7. **\`applyToolCall\` 不调用前面的函数。** 测试能蒙对，验收脚本会查调用。
8. **作业 import 真包 / hono / fetch / setTimeout。** JSON 作业是纯函数。真示例只在 \`demo.ts\` 的复制区。
9. **把 Prompt / RAG / ReAct 再讲一遍。** 原理在 Python 课。本章只挂最小 Tool。
10. **本章就去写 \`beforeToolCall\` / \`createAgentSession\` / Hono SSE。** 那是 Ch24 / Ch25 / Ch26。

---`,
    [],
  ),
  sec(
    "sec-homework",
    "📝 本章作业",
    null,
    `上面 7 个函数按节交错出现。每个注释里有【场景】【转换点】、示例和提示。

**完成方式**：打开仓库 \`local/m5/ch23/assignment.ts\`，把 \`throw new Error("TODO")\` 换成实现，然后：

\`\`\`bash
bun test local/m5/ch23
\`\`\`

\`app.ts\` 是假 \`async function*\`：先 \`tool_call\` 再 \`text_delta\`，不联网。\`demo.ts\` 是真包抄写稿，**测试不要 import 它**（包没装）。

卡住就回对应 §：\`lookupProductTool\` → §23.1，\`executeLookup\` → §23.3（0 库存仍 hit），\`shouldCallTool\` → §23.5（bash 为 null），\`applyToolCall\` → §23.7（请调用前面的函数）。

---`,
    [],
  ),
  sec(
    "sec-check",
    "✅ 自测：你真的掌握了吗？",
    null,
    `- [ ] 能说清 Agent vs 直接 stream：谁在循环里跑 Tool
- [ ] 能说清「模型决定调工具」，\`shouldCallTool\` 只是假表
- [ ] 真 execute 失败要 throw；作业 null 是测试拆法
- [ ] 没有 Key 时假 streamFn 为什么还能绿
- [ ] 不登记 bash / 写文件；危险词返回 null
- [ ] CP-009 stock 0 仍是 LookupHit
- [ ] \`applyToolCall\` 调用了 \`executeLookup\` / \`executeCalc\` / \`formatToolResult\`
- [ ] \`bun test local/m5/ch23\` 全绿

---`,
    [],
  ),
  sec(
    "sec-feynman",
    "🎓 费曼挑战",
    null,
    `用大白话讲给「Java 同事」听。讲不清 = 还没真懂。

任选一题（1–2 分钟）：

1. 「Spring \`@Service.lookup\` 是我在 Controller 里调的。Agent 的 Tool 是谁决定调？没有 Key 测试怎么绿？」— 卡壳重读总述
2. 「工具找不到 SKU，为什么不能把『未找到』当成功文本返回？作业为什么又返回 null？」— 卡壳重读总述 + §23.3 + §23.6
3. 「用户说用 bash 查库存，为什么两个工具都不调？\`applyToolCall\` 为什么必须调用前面的函数？」— 卡壳重读 §23.5 + §23.7

---`,
    [],
  ),
  sec(
    "sec-next",
    "⏭️ 下一步",
    null,
    `Ch23 掌握后，你已经会挂两个最小 Tool、用假 \`streamFn\` 走完「先 tool_call 再 text」。下一章是 **Ch24 · 自定义 Tool 与事件**：\`subscribe\` 看 \`text_delta\` / \`tool_call\`，\`beforeToolCall\` 可拦。本章不要提前实现拦截器，也不要上 \`createAgentSession\`（Ch25）或 Hono+SSE（Ch26）。不要在作业里开放 bash 或写文件系统。`,
    [],
  ),
];

const tutorialMd = `# Ch23 · pi-agent-core：最小 Agent + Tool

${sections
  .map((s) => (s.heading ? `## ${s.heading}\n\n${s.body}` : s.body))
  .join("\n\n")}
`;

const reviewMd = `# Ch23 · 记忆闪卡

> 先回忆，再翻答案。连续 2 次秒答 → 退役。

## 🔖 闪卡

| # | 正面（问题） | 背面（答案） | 掌握 |
|---|---|---|---|
| 1 | Agent 和 Ch22 直接 stream 差在哪？ | stream 只吐 token。\`new Agent({ tools, streamFn })\` 会在 \`tool_call\` 时跑 Tool，再把结果送回模型。 | ⬜ |
| 2 | 谁决定调不调 \`lookupProduct\`？\`shouldCallTool\` 是真运行时吗？ | **模型**看 schema 决定。作业那张关键词表只是无 Key 时的假决策，不是 Pi 运行时。 | ⬜ |
| 3 | 真 \`execute\` 找不到 SKU 该怎么办？作业为什么返回 null？ | 真 API **throw**，不要把错误当成功 content。作业纯函数用 null，\`formatToolResult\` 再变成「未找到该 SKU」。 | ⬜ |
| 4 | 没有 API Key，作业能绿吗？假 streamFn 测什么？ | 能绿。假事件：先 \`tool_call lookupProduct\` 再 \`text_delta\`。真跑要 Key + \`bun add @earendil-works/pi-agent-core\`，见 demo.ts。 | ⬜ |
| 5 | 为什么禁止 bash / 写文件工具？\`shouldCallTool("用 bash 查一下")\`？ | 商品助手只需查目录和算小计。危险词一律 \`null\`，不要建议危险工具。 | ⬜ |
| 6 | \`applyToolCall\` 必须怎么写？ | 必须调用 \`executeLookup\` / \`executeCalc\` / \`formatToolResult\`。缺 sku 当 ""；缺 qty 当 0；缺 unitPrice 当 -1。 | ⬜ |
| 7 | 真 AgentTool 的 parameters 用什么？作业呢？ | 真 API：TypeBox \`Type.Object\`。作业：冻结 JSON Schema 形对象，不 import typebox/zod。 | ⬜ |
| 8 | CP-009 库存 0，\`executeLookup\` 返回什么？ | 仍是 LookupHit（stock 0）。缺货是查到了。空串 / NOPE 才是 null。 | ⬜ |
| 9 | Spring \`@Service\` 和 Tool 的调用权差在哪？ | Service 由你的 Controller 调用。Tool 由模型选择。Python LangChain \`@tool\` 更接近本章；FastAPI \`Depends\` 仍是框架注入。 | ⬜ |

## 🎓 费曼自检

- [ ] 能说清 Agent vs 直接 stream、模型决定调工具
- [ ] 能说清 execute 要 throw、无 Key 假 streamFn、禁止 bash
- [ ] 能说清 applyToolCall 复用前面的函数
`;

const chapter = {
  id: "ch23",
  num: "23",
  title: "pi-agent-core：最小 Agent + Tool",
  runMode: "local" as const,
  tutorialMd,
  assignment,
  testName: "ch23_assignment",
  testSource,
  reviewMd,
  interleaved: true,
  sections,
  functions,
  preamble,
  localHint: "bun test local/m5/ch23",
};

const out = join(dirname(fileURLToPath(import.meta.url)), "../src/content/chapters/ch23.json");
mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, JSON.stringify(chapter, null, 2) + "\n");
console.log("wrote", out);

const localDir = join(dirname(fileURLToPath(import.meta.url)), "../local/m5/ch23");
mkdirSync(localDir, { recursive: true });

const localAssignment = `/**
 * Ch23 作业：商品助手最小 Agent + Tool 的纯函数。
 *
 * 场景：用户问「机械键盘还有货吗」或「2件多少钱」。
 * 你先给出两个工具的 JSON Schema 形定义，再实现查找 / 小计 /
 * 该不该调工具 / 格式化 / 接线。假流会先吐 tool_call 再吐 text。
 *
 * 打开本文件改 TODO，然后：bun test local/m5/ch23
 */

${preamble.replace(/^\/\*\*[\s\S]*?\*\/\n\n/, "")}

${functions.map((f) => f.skeleton).join("\n\n")}
`;

const appSource = `/**
 * Ch23 本地假流：商品助手先 tool_call 再 text。
 * 不联网、不起端口、不 import 真 Agent 包。
 *
 * bun test 会 for-await 本 generator，再把 args 交给 assignment.ts。
 */

export type Product = {
  id: number;
  name: string;
  category: string;
  price: number;
  stock: number;
  sku: string;
};

export type FakeAgentEvent =
  | { type: "tool_call"; name: string; args: { sku?: string; qty?: number; unitPrice?: number } }
  | { type: "text_delta"; delta: string }
  | { type: "done"; reason: "stop" };

/** 与 shared.json 一致的 10 件商品。CP-009 库存 0。 */
export const SHOP_PRODUCTS: Product[] = [
  { id: 1, name: "机械键盘", category: "电脑外设", price: 599, stock: 120, sku: "KB-001" },
  { id: 2, name: "无线鼠标", category: "电脑外设", price: 159, stock: 300, sku: "MS-002" },
  { id: 3, name: "27寸4K显示器", category: "电脑外设", price: 2199, stock: 45, sku: "MN-003" },
  { id: 4, name: "Python编程:从入门到实践", category: "图书", price: 89, stock: 500, sku: "BK-004" },
  { id: 5, name: "设计模式", category: "图书", price: 75.5, stock: 200, sku: "BK-005" },
  { id: 6, name: "降噪耳机", category: "影音设备", price: 1299, stock: 80, sku: "HP-006" },
  { id: 7, name: "蓝牙音箱", category: "影音设备", price: 399, stock: 150, sku: "SP-007" },
  { id: 8, name: "USB-C扩展坞", category: "电脑外设", price: 269, stock: 220, sku: "DK-008" },
  { id: 9, name: "智能水杯", category: "生活用品", price: 199, stock: 0, sku: "CP-009" },
  { id: 10, name: "人体工学椅", category: "生活用品", price: 1599, stock: 30, sku: "CH-010" },
];

export async function* fakeToolThenTextStream(): AsyncGenerator<FakeAgentEvent> {
  yield { type: "tool_call", name: "lookupProduct", args: { sku: "KB-001" } };
  yield { type: "text_delta", delta: "KB-001 库存 120" };
  yield { type: "done", reason: "stop" };
}

export async function collectFromAsync(stream: AsyncIterable<FakeAgentEvent>): Promise<FakeAgentEvent[]> {
  const events: FakeAgentEvent[] = [];
  for await (const event of stream) {
    events.push(event);
  }
  return events;
}
`;

const localTest = `import { describe, expect, test } from "bun:test";
import {
  applyToolCall,
  calcLineTotalTool,
  executeCalc,
  executeLookup,
  formatToolResult,
  lookupProductTool,
  shouldCallTool,
} from "./assignment";
import { SHOP_PRODUCTS, collectFromAsync, fakeToolThenTextStream } from "./app";

const LOOKUP_TOOL = {
  name: "lookupProduct",
  label: "查询商品",
  description: "按 SKU 查商品名称、库存和单价",
  parameters: {
    type: "object" as const,
    required: ["sku"],
    properties: {
      sku: { type: "string", description: "商品 SKU，例如 KB-001" },
    },
  },
};

const CALC_TOOL = {
  name: "calcLineTotal",
  label: "计算小计",
  description: "数量乘单价得到行小计",
  parameters: {
    type: "object" as const,
    required: ["qty", "unitPrice"],
    properties: {
      qty: { type: "number", description: "购买数量，整数 ≥ 1" },
      unitPrice: { type: "number", description: "单价" },
    },
  },
};

const KB_HIT = { sku: "KB-001", name: "机械键盘", stock: 120, price: 599 };
const MS_HIT = { sku: "MS-002", name: "无线鼠标", stock: 300, price: 159 };
const CUP_HIT = { sku: "CP-009", name: "智能水杯", stock: 0, price: 199 };

describe("lookupProductTool", () => {
  test("精确返回查询商品工具", () => {
    expect(lookupProductTool()).toEqual(LOOKUP_TOOL);
  });
  test("name / label 对得上", () => {
    const t = lookupProductTool();
    expect(t.name).toBe("lookupProduct");
    expect(t.label).toBe("查询商品");
  });
  test("required 只有 sku；不是 bash", () => {
    expect(lookupProductTool().parameters.required).toEqual(["sku"]);
    expect(lookupProductTool().name).toBe("lookupProduct");
  });
});

describe("calcLineTotalTool", () => {
  test("精确返回计算小计工具", () => {
    expect(calcLineTotalTool()).toEqual(CALC_TOOL);
  });
  test("qty / unitPrice 都是 number", () => {
    const t = calcLineTotalTool();
    expect(t.name).toBe("calcLineTotal");
    expect(t.parameters.properties.qty.type).toBe("number");
    expect(t.parameters.properties.unitPrice.type).toBe("number");
  });
  test("required 是 qty 与 unitPrice", () => {
    expect(calcLineTotalTool().parameters.required).toEqual(["qty", "unitPrice"]);
  });
});

describe("executeLookup", () => {
  test("KB-001 → 机械键盘 LookupHit", () => {
    Object.freeze(SHOP_PRODUCTS);
    expect(executeLookup(SHOP_PRODUCTS, "KB-001")).toEqual(KB_HIT);
  });
  test("MS-002 → 无线鼠标（防硬编码键盘）", () => {
    Object.freeze(SHOP_PRODUCTS);
    expect(executeLookup(SHOP_PRODUCTS, "MS-002")).toEqual(MS_HIT);
  });
  test("CP-009 库存 0 仍返回；NOPE / 空串 → null", () => {
    Object.freeze(SHOP_PRODUCTS);
    expect(executeLookup(SHOP_PRODUCTS, "CP-009")).toEqual(CUP_HIT);
    expect(executeLookup(SHOP_PRODUCTS, "NOPE")).toBeNull();
    expect(executeLookup(SHOP_PRODUCTS, "")).toBeNull();
  });
  test("不 mutate products", () => {
    Object.freeze(SHOP_PRODUCTS);
    executeLookup(SHOP_PRODUCTS, "KB-001");
    expect(SHOP_PRODUCTS.length).toBe(10);
    expect(SHOP_PRODUCTS[0]?.stock).toBe(120);
  });
});

describe("executeCalc", () => {
  test("2 件键盘 599 → 1198", () => {
    expect(executeCalc(2, 599)).toBe(1198);
  });
  test("3 件鼠标 159 → 477（防硬编码）", () => {
    expect(executeCalc(3, 159)).toBe(477);
  });
  test("非法 qty / unitPrice → null", () => {
    expect(executeCalc(0, 599)).toBeNull();
    expect(executeCalc(-1, 599)).toBeNull();
    expect(executeCalc(1.5, 599)).toBeNull();
    expect(executeCalc(Number.NaN, 599)).toBeNull();
    expect(executeCalc(Number.POSITIVE_INFINITY, 599)).toBeNull();
    expect(executeCalc(1, -1)).toBeNull();
  });
});

describe("shouldCallTool", () => {
  test("多少钱 / 小计 → calcLineTotal", () => {
    expect(shouldCallTool("2件机械键盘多少钱")).toBe("calcLineTotal");
    expect(shouldCallTool("帮我算小计")).toBe("calcLineTotal");
  });
  test("库存或 SKU → lookupProduct", () => {
    expect(shouldCallTool("机械键盘还有库存吗")).toBe("lookupProduct");
    expect(shouldCallTool("KB-001 还有货吗")).toBe("lookupProduct");
    expect(shouldCallTool("MS-002")).toBe("lookupProduct");
  });
  test("你好 / 空 / bash / 写文件 → null", () => {
    expect(shouldCallTool("你好")).toBeNull();
    expect(shouldCallTool("")).toBeNull();
    expect(shouldCallTool("用 bash 查一下")).toBeNull();
    expect(shouldCallTool("写文件保存订单")).toBeNull();
  });
});

describe("formatToolResult", () => {
  test("lookup 键盘 hit", () => {
    expect(formatToolResult("lookupProduct", KB_HIT)).toBe("KB-001 机械键盘 库存 120 单价 599");
  });
  test("lookup 无线鼠标；calc 1198 / 477", () => {
    expect(formatToolResult("lookupProduct", MS_HIT)).toBe("MS-002 无线鼠标 库存 300 单价 159");
    expect(formatToolResult("calcLineTotal", 1198)).toBe("小计 1198");
    expect(formatToolResult("calcLineTotal", 477)).toBe("小计 477");
  });
  test("null / 错搭配 / 字符串数字", () => {
    expect(formatToolResult("lookupProduct", null)).toBe("未找到该 SKU");
    expect(formatToolResult("lookupProduct", 1198)).toBe("");
    expect(formatToolResult("calcLineTotal", KB_HIT)).toBe("");
    expect(formatToolResult("calcLineTotal", "1198")).toBe("");
    expect(formatToolResult("lookupProduct", { sku: "KB-001", name: "机械键盘", stock: 120 })).toBe("");
  });
});

describe("applyToolCall", () => {
  test("lookup KB-001", () => {
    Object.freeze(SHOP_PRODUCTS);
    expect(applyToolCall(SHOP_PRODUCTS, "lookupProduct", { sku: "KB-001" })).toBe(
      "KB-001 机械键盘 库存 120 单价 599",
    );
  });
  test("lookup 无线鼠标；calc 1198 / 477", () => {
    Object.freeze(SHOP_PRODUCTS);
    expect(applyToolCall(SHOP_PRODUCTS, "lookupProduct", { sku: "MS-002" })).toBe(
      "MS-002 无线鼠标 库存 300 单价 159",
    );
    expect(applyToolCall(SHOP_PRODUCTS, "calcLineTotal", { qty: 2, unitPrice: 599 })).toBe("小计 1198");
    expect(applyToolCall(SHOP_PRODUCTS, "calcLineTotal", { qty: 3, unitPrice: 159 })).toBe("小计 477");
  });
  test("lookup NOPE；缺参", () => {
    Object.freeze(SHOP_PRODUCTS);
    expect(applyToolCall(SHOP_PRODUCTS, "lookupProduct", { sku: "NOPE" })).toBe("未找到该 SKU");
    expect(applyToolCall(SHOP_PRODUCTS, "lookupProduct", {})).toBe("未找到该 SKU");
    expect(applyToolCall(SHOP_PRODUCTS, "calcLineTotal", {})).toBe("");
  });
});

describe("fakeToolThenTextStream", () => {
  test("先 tool_call lookupProduct，再能 applyToolCall", async () => {
    const events = await collectFromAsync(fakeToolThenTextStream());
    expect(events[0]).toEqual({ type: "tool_call", name: "lookupProduct", args: { sku: "KB-001" } });
    expect(events[1]).toEqual({ type: "text_delta", delta: "KB-001 库存 120" });
    expect(events[2]).toEqual({ type: "done", reason: "stop" });
    expect(applyToolCall(SHOP_PRODUCTS, "lookupProduct", { sku: "KB-001" })).toBe(
      "KB-001 机械键盘 库存 120 单价 599",
    );
  });
});
`;

const demoSource = `/**
 * Ch23 · 真跑 @earendil-works/pi-agent-core 的最小示例。
 *
 * 本文件只给阅读 / 复制。测试禁止 import 本文件（包没有装进本课）。
 *
 * 作业全绿不需要本文件、不需要 API Key：假 streamFn / 假 tool_call 就能绿。
 * 真要跑 Agent：
 *   1. bun add @earendil-works/pi-agent-core
 *   2. export OPENAI_API_KEY=...   （或其它供应商的 Key）
 *   3. 把下面「复制区」拷到新文件再 bun 跑
 *
 * 文档：https://pi.dev/docs/latest/sdk
 *
 * 不要用过时的 @mariozechner/* 。本章不讲 beforeToolCall（Ch24）、
 * createAgentSession（Ch25）、Hono+SSE（Ch26）。
 */

const COPY_WHEN_YOU_HAVE_A_KEY = \`
import { Agent } from '@earendil-works/pi-agent-core';
import { Type } from 'typebox';

const lookupProduct: AgentTool = {
  name: 'lookupProduct',
  label: '查询商品',
  description: '按 SKU 查商品名称、库存和单价',
  parameters: Type.Object({ sku: Type.String({ description: '商品 SKU，例如 KB-001' }) }),
  execute: async (_id, params) => {
    if (params.sku !== 'KB-001') throw new Error('NOT_FOUND');
    return { content: [{ type: 'text', text: 'KB-001 机械键盘 库存 120 单价 599' }] };
  },
};

const calcLineTotal: AgentTool = {
  name: 'calcLineTotal',
  label: '计算小计',
  description: '数量乘单价得到行小计',
  parameters: Type.Object({
    qty: Type.Number({ description: '购买数量，整数 ≥ 1' }),
    unitPrice: Type.Number({ description: '单价' }),
  }),
  execute: async (_id, params) => {
    if (!Number.isInteger(params.qty) || params.qty < 1) throw new Error('BAD_QTY');
    return { content: [{ type: 'text', text: '小计 ' + String(params.qty * params.unitPrice) }] };
  },
};

const agent = new Agent({
  initialState: {
    systemPrompt: '你是商品助手。只用 lookupProduct 和 calcLineTotal。禁止 bash 和写文件。',
    model,
    tools: [lookupProduct, calcLineTotal],
  },
  streamFn: models.streamSimple.bind(models),
});
await agent.prompt('机械键盘还有货吗');
\`;

if (false) {
  // 有 Key 时把 COPY_WHEN_YOU_HAVE_A_KEY 拷出去跑；这里故意不 import 真包。
  console.log(COPY_WHEN_YOU_HAVE_A_KEY);
}
`;

writeFileSync(join(localDir, "assignment.ts"), localAssignment);
writeFileSync(join(localDir, "app.ts"), appSource);
writeFileSync(join(localDir, "assignment.test.ts"), localTest);
writeFileSync(join(localDir, "demo.ts"), demoSource);
console.log("wrote", localDir);
