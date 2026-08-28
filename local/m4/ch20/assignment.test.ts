import { describe, expect, test } from "bun:test";
import {
  deleteBySku,
  fromRow,
  insertProductInput,
  listInStockSql,
  toRow,
  updateStock,
} from "./assignment";
import { app } from "./app";

const KB = {
  id: 1,
  name: "机械键盘",
  category: "电脑外设",
  price: 599,
  stock: 120,
  sku: "KB-001",
};
const MS = {
  id: 2,
  name: "无线鼠标",
  category: "电脑外设",
  price: 159,
  stock: 300,
  sku: "MS-002",
};
const CUP = {
  id: 9,
  name: "智能水杯",
  category: "生活用品",
  price: 199,
  stock: 0,
  sku: "CP-009",
};
const SQL_IN_STOCK =
  "SELECT id, name, category, price, stock, sku FROM products WHERE stock > 0 ORDER BY id ASC";
const SQL_DELETE = "DELETE FROM products WHERE sku = ?";

describe("toRow", () => {
  test("机械键盘 KB-001 → 同行", () => {
    expect(toRow(KB)).toEqual(KB);
  });
  test("无线鼠标 MS-002 → 同行（防硬编码键盘）", () => {
    expect(toRow(MS)).toEqual(MS);
  });
  test("水杯 stock 0 原样抄；返回新对象", () => {
    const p = { ...CUP };
    const row = toRow(p);
    expect(row).toEqual(CUP);
    row.stock = 99;
    expect(p.stock).toBe(0);
  });
});

describe("fromRow", () => {
  test("合法键盘行 → Product", () => {
    expect(fromRow(KB)).toEqual(KB);
  });
  test("鼠标行；水杯 stock 0 也合法", () => {
    expect(fromRow(MS)).toEqual(MS);
    expect(fromRow(CUP)).toEqual(CUP);
  });
  test("id 字符串 / null / 非对象 → null", () => {
    expect(fromRow({ id: "1" })).toBeNull();
    expect(fromRow(null)).toBeNull();
    expect(fromRow(undefined)).toBeNull();
    expect(fromRow([])).toBeNull();
  });
  test("多字段忽略；id 0 非法", () => {
    expect(fromRow({ ...KB, extra: "x" })).toEqual(KB);
    expect(fromRow({ ...KB, id: 0 })).toBeNull();
    expect(fromRow({ ...KB, stock: -1 })).toBeNull();
  });
});

describe("listInStockSql", () => {
  test("精确 SELECT 在库", () => {
    expect(listInStockSql()).toBe(SQL_IN_STOCK);
  });
  test("必须是 stock > 0，排除 CP-009", () => {
    const sql = listInStockSql();
    expect(sql.includes("stock > 0")).toBe(true);
    expect(sql.includes("CP-009")).toBe(false);
  });
});

describe("insertProductInput", () => {
  test("合法键盘五字段", () => {
    expect(
      insertProductInput({
        name: "机械键盘",
        category: "电脑外设",
        price: 599,
        stock: 120,
        sku: "KB-001",
      }),
    ).toEqual({
      ok: true,
      value: { name: "机械键盘", category: "电脑外设", price: 599, stock: 120, sku: "KB-001" },
    });
  });
  test("鼠标；水杯 trim + stock 0", () => {
    expect(
      insertProductInput({
        name: "无线鼠标",
        category: "电脑外设",
        price: 159,
        stock: 300,
        sku: "MS-002",
      }),
    ).toEqual({
      ok: true,
      value: { name: "无线鼠标", category: "电脑外设", price: 159, stock: 300, sku: "MS-002" },
    });
    expect(
      insertProductInput({
        name: "  智能水杯  ",
        category: "  生活用品  ",
        price: 199,
        stock: 0,
        sku: "CP-009",
      }),
    ).toEqual({
      ok: true,
      value: { name: "智能水杯", category: "生活用品", price: 199, stock: 0, sku: "CP-009" },
    });
  });
  test("坏 sku → SKU；缺键 SHAPE", () => {
    expect(insertProductInput({ name: "机械键盘" })).toEqual({ ok: false, error: "SHAPE" });
    expect(
      insertProductInput({
        name: "机械键盘",
        category: "电脑外设",
        price: 599,
        stock: 120,
        sku: "kb-001",
      }),
    ).toEqual({ ok: false, error: "SKU" });
  });
});

describe("updateStock", () => {
  test("键盘 120 减 1 → 119", () => {
    expect(updateStock(120, -1)).toBe(119);
  });
  test("鼠标 300 减 1 → 299", () => {
    expect(updateStock(300, -1)).toBe(299);
  });
  test("0-1 空；0+5；delta 0", () => {
    expect(updateStock(0, -1)).toBeNull();
    expect(updateStock(0, 5)).toBe(5);
    expect(updateStock(30, 0)).toBe(30);
  });
});

describe("deleteBySku", () => {
  test("KB-001 / MS-002 / 注入串都是占位 SQL", () => {
    expect(deleteBySku("KB-001")).toBe(SQL_DELETE);
    expect(deleteBySku("MS-002")).toBe(SQL_DELETE);
    expect(deleteBySku("KB-001'; DROP TABLE products;--")).toBe(SQL_DELETE);
  });
});

describe("app HTTP", () => {
  test("GET /products 在库 9 件，排除 CP-009，含键盘和鼠标", async () => {
    const res = await app.request("/products");
    expect(res.status).toBe(200);
    const items = (await res.json()) as { sku: string }[];
    const skus = items.map((p) => p.sku);
    expect(items.length).toBe(9);
    expect(skus.includes("KB-001")).toBe(true);
    expect(skus.includes("MS-002")).toBe(true);
    expect(skus.includes("CP-009")).toBe(false);
  });

  test("POST 合法商品 201", async () => {
    const res = await app.request("/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "新键帽",
        category: "电脑外设",
        price: 49,
        stock: 10,
        sku: "KC-011",
      }),
    });
    expect(res.status).toBe(201);
    expect(await res.json()).toEqual({
      id: 11,
      name: "新键帽",
      category: "电脑外设",
      price: 49,
      stock: 10,
      sku: "KC-011",
    });
  });

  test("POST 坏 sku 400", async () => {
    const res = await app.request("/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "机械键盘",
        category: "电脑外设",
        price: 599,
        stock: 120,
        sku: "kb-001",
      }),
    });
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "SKU" });
  });

  test("PATCH CH-010 库存 -1 → 29", async () => {
    const res = await app.request("/products/CH-010/stock", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ delta: -1 }),
    });
    expect(res.status).toBe(200);
    const body = (await res.json()) as { sku: string; stock: number };
    expect(body.sku).toBe("CH-010");
    expect(body.stock).toBe(29);
  });

  test("PATCH CP-009 delta -1 → 409；缺 sku → 404", async () => {
    const conflict = await app.request("/products/CP-009/stock", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ delta: -1 }),
    });
    expect(conflict.status).toBe(409);
    const missing = await app.request("/products/ZZ-000/stock", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ delta: 1 }),
    });
    expect(missing.status).toBe(404);
  });

  test("DELETE KC-011 → 204", async () => {
    const res = await app.request("/products/KC-011", { method: "DELETE" });
    expect(res.status).toBe(204);
  });

  test("SQL 注入 sku 不能 drop 表，KB-001 还在", async () => {
    const evil = "KB-001'; DROP TABLE products;--";
    const res = await app.request("/products/" + encodeURIComponent(evil), { method: "DELETE" });
    expect(res.status).toBe(404);
    const list = await app.request("/products");
    expect(list.status).toBe(200);
    const items = (await list.json()) as { sku: string }[];
    expect(items.map((p) => p.sku).includes("KB-001")).toBe(true);
    expect(items.map((p) => p.sku).includes("CP-009")).toBe(false);
  });
});
