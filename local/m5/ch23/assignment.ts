/**
 * Ch23 作业：商品助手最小 Agent + Tool 的纯函数。
 *
 * 场景：用户问「机械键盘还有货吗」或「2件多少钱」。
 * 你先给出两个工具的 JSON Schema 形定义，再实现查找 / 小计 /
 * 该不该调工具 / 格式化 / 接线。假流会先吐 tool_call 再吐 text。
 *
 * 打开本文件改 TODO，然后：bun test local/m5/ch23
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

type LookupHit = { sku: string; name: string; stock: number; price: number };

/**
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
}

/**
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
}

/**
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
}

/**
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
}

/**
 * 【场景】假决策表：还没有真模型时，用关键词模拟「模型要不要调工具」。
 * 「2件机械键盘多少钱」该算账；「KB-001 还有货吗」该查询；「用 bash 查」不要建议危险工具。
 *
 * 【转换点】按这个顺序，先到先得：
 *   1. 含 "bash" 或 "写文件" → null
 *   2. 含 "小计" 或 "多少钱" → "calcLineTotal"
 *   3. 含 "库存" 或 /[A-Z]{2}-\d{3}/ → "lookupProduct"
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
}

/**
 * 【场景】工具跑完，要把结果变成给模型看的一句文本。
 * 键盘命中：「KB-001 机械键盘 库存 120 单价 599」。算账：「小计 1198」。
 *
 * 【转换点】按 name 分：
 *   lookupProduct + LookupHit 形（sku/name/stock/price 且类型对）
 *     → `${sku} ${name} 库存 ${stock} 单价 ${price}`
 *   lookupProduct + null → "未找到该 SKU"
 *   calcLineTotal + 有限 number → `小计 ${payload}`
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
}

/**
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
}
