import { describe, expect, test } from "bun:test";
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
