import { describe, expect, test } from "bun:test";
import {
  createdStatus,
  getProductById,
  healthPayload,
  listProducts,
  notFoundBody,
  parseIdParam,
} from "./assignment";
import { PRODUCTS, app } from "./app";

describe("parseIdParam", () => {
  test('"1" → 1', () => {
    expect(parseIdParam("1")).toBe(1);
  });
  test('"10" → 10', () => {
    expect(parseIdParam("10")).toBe(10);
  });
  test('"01" → 1', () => {
    expect(parseIdParam("01")).toBe(1);
  });
  test('"0" → null', () => {
    expect(parseIdParam("0")).toBeNull();
  });
  test('"-1" → null', () => {
    expect(parseIdParam("-1")).toBeNull();
  });
  test('"abc" → null', () => {
    expect(parseIdParam("abc")).toBeNull();
  });
  test("空字符串 → null", () => {
    expect(parseIdParam("")).toBeNull();
  });
  test('"1.5" → null', () => {
    expect(parseIdParam("1.5")).toBeNull();
  });
  test('"1e2" → null', () => {
    expect(parseIdParam("1e2")).toBeNull();
  });
  test('"12abc" → null（不要 parseInt 丢尾部）', () => {
    expect(parseIdParam("12abc")).toBeNull();
  });
});

describe("getProductById", () => {
  test("id=1 → 机械键盘 KB-001", () => {
    const p = getProductById(PRODUCTS, 1);
    expect(p).toEqual(PRODUCTS[0]);
    expect(p?.name).toBe("机械键盘");
    expect(p?.sku).toBe("KB-001");
  });
  test("id=9 智能水杯 stock 0 也算找到", () => {
    const p = getProductById(PRODUCTS, 9);
    expect(p?.name).toBe("智能水杯");
    expect(p?.sku).toBe("CP-009");
    expect(p?.stock).toBe(0);
  });
  test("id=99 → null", () => {
    expect(getProductById(PRODUCTS, 99)).toBeNull();
  });
  test("小列表 id=7 蓝牙音箱；不要硬编码 PRODUCTS", () => {
    const tiny = [
      { id: 7, name: "蓝牙音箱", category: "影音设备", price: 399, stock: 150, sku: "SP-007" },
    ];
    expect(getProductById(tiny, 7)?.sku).toBe("SP-007");
    expect(getProductById(tiny, 1)).toBeNull();
  });
  test("不 mutate products", () => {
    const orig = PRODUCTS.map((p) => ({ ...p }));
    for (const p of orig) Object.freeze(p);
    Object.freeze(orig);
    const snapshot = orig.map((p) => ({ ...p }));
    getProductById(orig, 1);
    getProductById(orig, 99);
    expect(orig).toEqual(snapshot);
    expect(orig.length).toBe(10);
  });
});

describe("listProducts", () => {
  test("10 件浅拷贝，含缺货 CP-009", () => {
    const listed = listProducts(PRODUCTS);
    expect(listed.length).toBe(10);
    expect(Object.is(listed, PRODUCTS)).toBe(false);
    expect(listed[0]?.sku).toBe("KB-001");
    expect(listed[8]?.sku).toBe("CP-009");
    expect(listed[8]?.stock).toBe(0);
  });
  test("空数组 → []", () => {
    const orig: typeof PRODUCTS = [];
    Object.freeze(orig);
    expect(listProducts(orig)).toEqual([]);
    expect(orig.length).toBe(0);
  });
  test("不过滤 stock，不 mutate", () => {
    const orig = PRODUCTS.map((p) => ({ ...p }));
    for (const p of orig) Object.freeze(p);
    Object.freeze(orig);
    const snapshot = orig.map((p) => ({ ...p }));
    const listed = listProducts(orig);
    expect(orig).toEqual(snapshot);
    expect(listed.length).toBe(10);
    expect(listed.some((p) => p.stock === 0)).toBe(true);
  });
});

describe("healthPayload", () => {
  test("精确两键", () => {
    expect(healthPayload()).toEqual({ ok: true, service: "shop-api" });
  });
  test("再调一次仍是同一形状", () => {
    const a = healthPayload();
    const b = healthPayload();
    expect(a).toEqual({ ok: true, service: "shop-api" });
    expect(b).toEqual({ ok: true, service: "shop-api" });
  });
});

describe("notFoundBody", () => {
  test('精确 { error: "NOT_FOUND" }', () => {
    expect(notFoundBody()).toEqual({ error: "NOT_FOUND" });
  });
  test("不是数字 404", () => {
    const body = notFoundBody();
    expect(body.error).toBe("NOT_FOUND");
    expect(body).toEqual({ error: "NOT_FOUND" });
  });
});

describe("createdStatus", () => {
  test("返回 201 不是 200", () => {
    expect(createdStatus()).toBe(201);
  });
  test("再调一次仍是 201", () => {
    expect(createdStatus()).toBe(201);
    expect(createdStatus()).toBe(201);
  });
});

describe("HTTP", () => {
  test("GET /health → 200 + body", async () => {
    const res = await app.request("/health");
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true, service: "shop-api" });
  });
  test("GET /products → 200 长度 10", async () => {
    const res = await app.request("/products");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body)).toBe(true);
    expect(body.length).toBe(10);
    expect(body[0].sku).toBe("KB-001");
    expect(body[8].sku).toBe("CP-009");
  });
  test("GET /products/1 → 200 sku KB-001", async () => {
    const res = await app.request("/products/1");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.sku).toBe("KB-001");
    expect(body.name).toBe("机械键盘");
    expect(body.id).toBe(1);
  });
  test("GET /products/99 → 404 NOT_FOUND", async () => {
    const res = await app.request("/products/99");
    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({ error: "NOT_FOUND" });
  });
  test("GET /products/abc → 404 NOT_FOUND", async () => {
    const res = await app.request("/products/abc");
    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({ error: "NOT_FOUND" });
  });
  test("POST /products → 201", async () => {
    const res = await app.request("/products", { method: "POST" });
    expect(res.status).toBe(201);
    expect(await res.json()).toEqual({ ok: true });
  });
});
