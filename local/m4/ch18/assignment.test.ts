import { describe, expect, test } from "bun:test";
import {
  errorToJson,
  parseCreateBody,
  parseIdParam,
  parseSearchQuery,
  patchBody,
  validateOr400,
  type CreateBody,
} from "./assignment";
import { app } from "./app";

const KEYBOARD: CreateBody = {
  name: "机械键盘",
  price: 599,
  sku: "KB-001",
  stock: 120,
};

const BOOK: CreateBody = {
  name: "设计模式",
  price: 75.5,
  sku: "BK-005",
  stock: 200,
};

describe("parseIdParam", () => {
  test('"1" → 1', () => {
    expect(parseIdParam("1")).toBe(1);
  });
  test('"10" → 10（防硬编码 1）', () => {
    expect(parseIdParam("10")).toBe(10);
  });
  test("非法：0 / abc / 1.5 / 空 / 12abc", () => {
    expect(parseIdParam("0")).toBeNull();
    expect(parseIdParam("abc")).toBeNull();
    expect(parseIdParam("1.5")).toBeNull();
    expect(parseIdParam("")).toBeNull();
    expect(parseIdParam("12abc")).toBeNull();
  });
  test("失败不 throw", () => {
    expect(parseIdParam("nope")).toBeNull();
  });
});

describe("parseSearchQuery", () => {
  test("只有 q → limit 缺省 10", () => {
    expect(parseSearchQuery({ q: "键盘" })).toEqual({ q: "键盘", limit: 10 });
  });
  test("q + limit 数字", () => {
    expect(parseSearchQuery({ q: "键盘", limit: 5 })).toEqual({ q: "键盘", limit: 5 });
  });
  test("另一词 + 数字字符串 limit（防硬编码）", () => {
    expect(parseSearchQuery({ q: "鼠标", limit: "20" })).toEqual({ q: "鼠标", limit: 20 });
  });
  test("空白 q / 无 q → null", () => {
    expect(parseSearchQuery({ q: "  " })).toBeNull();
    expect(parseSearchQuery({ limit: 10 })).toBeNull();
  });
  test("limit 0 / 101 / x → 整单 null", () => {
    expect(parseSearchQuery({ q: "键盘", limit: 0 })).toBeNull();
    expect(parseSearchQuery({ q: "键盘", limit: 101 })).toBeNull();
    expect(parseSearchQuery({ q: "键盘", limit: "x" })).toBeNull();
  });
  test("多余键忽略；q 会 trim", () => {
    expect(parseSearchQuery({ q: " 键盘 ", extra: true })).toEqual({ q: "键盘", limit: 10 });
  });
});

describe("parseCreateBody", () => {
  test("合法机械键盘", () => {
    expect(parseCreateBody(KEYBOARD)).toEqual(KEYBOARD);
  });
  test("另一件：设计模式 75.5（防硬编码）", () => {
    expect(parseCreateBody(BOOK)).toEqual(BOOK);
  });
  test("stock 0 合法；price 0 / 小写 sku 非法", () => {
    expect(parseCreateBody({ ...KEYBOARD, stock: 0 })).toEqual({ ...KEYBOARD, stock: 0 });
    expect(parseCreateBody({ ...KEYBOARD, price: 0 })).toBeNull();
    expect(parseCreateBody({ ...KEYBOARD, sku: "kb-001" })).toBeNull();
  });
  test("非 object / 缺字段 / 类型错 → null", () => {
    expect(parseCreateBody(null)).toBeNull();
    expect(parseCreateBody("nope")).toBeNull();
    expect(parseCreateBody([])).toBeNull();
    expect(parseCreateBody({ name: "机械键盘", price: 599, sku: "KB-001" })).toBeNull();
    expect(parseCreateBody({ ...KEYBOARD, price: "599" })).toBeNull();
  });
});

describe("errorToJson", () => {
  test("sku 再 price，保序", () => {
    expect(errorToJson([{ path: ["sku"] }, { path: ["price"] }])).toEqual({
      error: "VALIDATION",
      fields: ["sku", "price"],
    });
  });
  test("空 issues；空 path → \"\"", () => {
    expect(errorToJson([])).toEqual({ error: "VALIDATION", fields: [] });
    expect(errorToJson([{ path: [] }])).toEqual({ error: "VALIDATION", fields: [""] });
  });
  test("去重保序；嵌套 path 用点拼接", () => {
    expect(
      errorToJson([{ path: ["sku"] }, { path: ["sku"] }, { path: ["price"] }]),
    ).toEqual({ error: "VALIDATION", fields: ["sku", "price"] });
    expect(errorToJson([{ path: ["items", 0, "sku"] }])).toEqual({
      error: "VALIDATION",
      fields: ["items.0.sku"],
    });
  });
});

describe("validateOr400", () => {
  test("success → 200 + data", () => {
    expect(validateOr400({ success: true, data: KEYBOARD })).toEqual({
      status: 200,
      data: KEYBOARD,
    });
  });
  test("另一件 success（防硬编码）", () => {
    expect(validateOr400({ success: true, data: BOOK }).status).toBe(200);
    expect(validateOr400({ success: true, data: { q: "鼠标", limit: 3 } })).toEqual({
      status: 200,
      data: { q: "鼠标", limit: 3 },
    });
  });
  test("fail → 400，body 走 errorToJson", () => {
    const issues = [{ path: ["sku"] }, { path: ["price"] }];
    expect(validateOr400({ success: false, error: { issues } })).toEqual({
      status: 400,
      body: errorToJson(issues),
    });
  });
});

describe("patchBody", () => {
  test("空对象等于 current", () => {
    expect(patchBody(KEYBOARD, {})).toEqual(KEYBOARD);
  });
  test("改 stock 0 合法；改 price 0 非法", () => {
    expect(patchBody(KEYBOARD, { stock: 0 })).toEqual({ ...KEYBOARD, stock: 0 });
    expect(patchBody(KEYBOARD, { price: 0 })).toBeNull();
  });
  test("改另一件的 name（防硬编码键盘）且不 mutate", () => {
    const current = { ...BOOK };
    const frozen = Object.freeze({ ...BOOK });
    expect(patchBody(frozen, { name: "重构" })).toEqual({ ...BOOK, name: "重构" });
    expect(current).toEqual(BOOK);
    expect(frozen).toEqual(BOOK);
  });
  test("非 object / 数组 / null → null", () => {
    expect(patchBody(KEYBOARD, null)).toBeNull();
    expect(patchBody(KEYBOARD, [])).toBeNull();
    expect(patchBody(KEYBOARD, "nope")).toBeNull();
  });
});

describe("HTTP /products/:id", () => {
  test("合法 id 200", async () => {
    const res = await app.request("/products/1");
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ id: 1 });
  });
  test("另一 id（防硬编码）", async () => {
    const res = await app.request("/products/10");
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ id: 10 });
  });
  test("非法 id 是 400 不是 404/500", async () => {
    const res = await app.request("/products/abc");
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "VALIDATION", fields: ["id"] });
  });
});

describe("HTTP /search", () => {
  test("q=键盘 缺省 limit 10", async () => {
    const res = await app.request("/search?q=" + encodeURIComponent("键盘"));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ q: "键盘", limit: 10 });
  });
  test("q + limit", async () => {
    const res = await app.request("/search?q=" + encodeURIComponent("鼠标") + "&limit=5");
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ q: "鼠标", limit: 5 });
  });
  test("空 q / 无 q 都 400", async () => {
    const empty = await app.request("/search?q=" + encodeURIComponent("  "));
    expect(empty.status).toBe(400);
    const noQ = await app.request("/search?limit=10");
    expect(noQ.status).toBe(400);
    const body = (await noQ.json()) as { error: string };
    expect(body.error).toBe("VALIDATION");
  });
});

describe("HTTP POST /products", () => {
  test("合法 body 201", async () => {
    const res = await app.request("/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(KEYBOARD),
    });
    expect(res.status).toBe(201);
    expect(await res.json()).toEqual(KEYBOARD);
  });
  test("另一件 201（防硬编码）", async () => {
    const res = await app.request("/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(BOOK),
    });
    expect(res.status).toBe(201);
    expect(await res.json()).toEqual(BOOK);
  });
  test("缺 sku → 400 不是 500", async () => {
    const res = await app.request("/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "机械键盘", price: 599, stock: 120 }),
    });
    expect(res.status).toBe(400);
    const body = (await res.json()) as { error: string };
    expect(body.error).toBe("VALIDATION");
  });
  test("非法 JSON → 400", async () => {
    const res = await app.request("/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{not json",
    });
    expect(res.status).toBe(400);
  });
});

describe("HTTP PATCH /products/:id", () => {
  test("补丁 stock 0 → 200", async () => {
    const res = await app.request("/products/1", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stock: 0 }),
    });
    expect(res.status).toBe(200);
    const body = (await res.json()) as CreateBody & { id: number };
    expect(body.id).toBe(1);
    expect(body.stock).toBe(0);
    expect(body.sku).toBe("KB-001");
  });
  test("补丁 price 0 → 400", async () => {
    const res = await app.request("/products/1", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ price: 0 }),
    });
    expect(res.status).toBe(400);
  });
  test("非法 id → 400", async () => {
    const res = await app.request("/products/abc", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    expect(res.status).toBe(400);
  });
});
