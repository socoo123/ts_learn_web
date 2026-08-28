import { describe, expect, test } from "bun:test";
import {
  authHeaderOk,
  composeMiddlewareOrder,
  corsHeaders,
  logLine,
  onErrorPayload,
  wrapError,
} from "./assignment";
import { app } from "./app";

const ALLOW_5173 = ["http://localhost:5173"];
const CORS_STAR = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type,Authorization",
};

describe("corsHeaders", () => {
  test("课程站 5173 回显 origin，不是 *", () => {
    const origin = "http://localhost:5173";
    expect(corsHeaders(origin, ALLOW_5173)).toEqual({
      "Access-Control-Allow-Origin": origin,
      "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type,Authorization",
    });
  });
  test("evil origin → {}", () => {
    expect(corsHeaders("https://evil.example", ALLOW_5173)).toEqual({});
  });
  test('origin "" 且无 * → {}', () => {
    expect(corsHeaders("", ALLOW_5173)).toEqual({});
    expect(corsHeaders("", [])).toEqual({});
  });
  test('allowList 含 "*" → ACAO 为 *', () => {
    expect(corsHeaders("http://localhost:5173", ["*"])).toEqual(CORS_STAR);
    expect(corsHeaders("https://evil.example", ["*"])).toEqual(CORS_STAR);
    expect(corsHeaders("", ["*"])).toEqual(CORS_STAR);
  });
  test("精确匹配其它 origin（防硬编码 5173）", () => {
    const origin = "https://shop.example";
    expect(corsHeaders(origin, ["https://shop.example", "http://localhost:5173"])).toEqual({
      "Access-Control-Allow-Origin": origin,
      "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type,Authorization",
    });
  });
  test("不 mutate allowList", () => {
    const list = ["http://localhost:5173"];
    Object.freeze(list);
    expect(corsHeaders("http://localhost:5173", list)["Access-Control-Allow-Origin"]).toBe(
      "http://localhost:5173",
    );
    expect(list.length).toBe(1);
  });
});

describe("wrapError", () => {
  test("Error → message", () => {
    expect(wrapError(new Error("boom"))).toEqual({ message: "boom" });
    expect(wrapError(new Error("UNAUTHORIZED"))).toEqual({ message: "UNAUTHORIZED" });
  });
  test("string 原样", () => {
    expect(wrapError("NOPE")).toEqual({ message: "NOPE" });
    expect(wrapError("FORBIDDEN")).toEqual({ message: "FORBIDDEN" });
  });
  test("null / 1 / 普通对象 → INTERNAL", () => {
    expect(wrapError(null)).toEqual({ message: "INTERNAL" });
    expect(wrapError(1)).toEqual({ message: "INTERNAL" });
    expect(wrapError({ message: "boom" })).toEqual({ message: "INTERNAL" });
  });
});

describe("logLine", () => {
  test("GET /products 200", () => {
    expect(logLine("GET", "/products", 200)).toBe("GET /products 200");
  });
  test("POST /products 201", () => {
    expect(logLine("POST", "/products", 201)).toBe("POST /products 201");
  });
  test("404 也一样拼", () => {
    expect(logLine("GET", "/nope", 404)).toBe("GET /nope 404");
    expect(logLine("PUT", "/admin/products", 401)).toBe("PUT /admin/products 401");
  });
});

describe("authHeaderOk", () => {
  test("Bearer shop-secret → true", () => {
    expect(authHeaderOk("Bearer shop-secret", "shop-secret")).toBe(true);
  });
  test("缺头 / 空 / 半截 Bearer → false", () => {
    expect(authHeaderOk(undefined, "shop-secret")).toBe(false);
    expect(authHeaderOk("", "shop-secret")).toBe(false);
    expect(authHeaderOk("Bearer", "shop-secret")).toBe(false);
    expect(authHeaderOk("Bearer ", "shop-secret")).toBe(false);
  });
  test("Basic / 错 token / 多余空格 / 大小写 → false", () => {
    expect(authHeaderOk("Basic x", "shop-secret")).toBe(false);
    expect(authHeaderOk("Bearer wrong", "shop-secret")).toBe(false);
    expect(authHeaderOk("Bearer  shop-secret", "shop-secret")).toBe(false);
    expect(authHeaderOk(" Bearer shop-secret", "shop-secret")).toBe(false);
    expect(authHeaderOk("bearer shop-secret", "shop-secret")).toBe(false);
    expect(authHeaderOk("Bearer other-token", "other-token")).toBe(true);
  });
});

describe("onErrorPayload", () => {
  test("UNAUTHORIZED → 401", () => {
    expect(onErrorPayload(new Error("UNAUTHORIZED"))).toEqual({
      status: 401,
      body: { error: "UNAUTHORIZED" },
    });
    expect(onErrorPayload("UNAUTHORIZED")).toEqual({
      status: 401,
      body: { error: "UNAUTHORIZED" },
    });
  });
  test("FORBIDDEN → 403；boom → 500", () => {
    expect(onErrorPayload(new Error("FORBIDDEN"))).toEqual({
      status: 403,
      body: { error: "FORBIDDEN" },
    });
    expect(onErrorPayload(new Error("boom"))).toEqual({
      status: 500,
      body: { error: "boom" },
    });
  });
  test("123 → 500 INTERNAL；body 只有 error", () => {
    expect(onErrorPayload(123)).toEqual({
      status: 500,
      body: { error: "INTERNAL" },
    });
    const p = onErrorPayload(new Error("boom"));
    expect(Object.keys(p.body)).toEqual(["error"]);
  });
});

describe("composeMiddlewareOrder", () => {
  test("cors/auth/log 洋葱：外层 CORS 先入后出", () => {
    expect(composeMiddlewareOrder(["cors", "auth", "log"])).toEqual([
      "cors>",
      "auth>",
      "log>",
      "handler",
      "<log",
      "<auth",
      "<cors",
    ]);
  });
  test("空栈只有 handler", () => {
    expect(composeMiddlewareOrder([])).toEqual(["handler"]);
  });
  test("单层 cors；两层防硬编码", () => {
    expect(composeMiddlewareOrder(["cors"])).toEqual(["cors>", "handler", "<cors"]);
    expect(composeMiddlewareOrder(["auth", "log"])).toEqual([
      "auth>",
      "log>",
      "handler",
      "<log",
      "<auth",
    ]);
  });
  test("不 mutate stack", () => {
    const stack = ["cors", "auth"];
    Object.freeze(stack);
    composeMiddlewareOrder(stack);
    expect(stack).toEqual(["cors", "auth"]);
  });
});

describe("app HTTP", () => {
  test("带 Origin 的 GET /health 有 ACAO 回显", async () => {
    const res = await app.request("/health", {
      headers: { Origin: "http://localhost:5173" },
    });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
    expect(res.headers.get("Access-Control-Allow-Origin")).toBe("http://localhost:5173");
  });
  test("evil origin 无 ACAO", async () => {
    const res = await app.request("/health", {
      headers: { Origin: "https://evil.example" },
    });
    expect(res.status).toBe(200);
    expect(res.headers.get("Access-Control-Allow-Origin")).toBeNull();
  });
  test("OPTIONS 204", async () => {
    const res = await app.request("/health", {
      method: "OPTIONS",
      headers: { Origin: "http://localhost:5173" },
    });
    expect(res.status).toBe(204);
    expect(res.headers.get("Access-Control-Allow-Origin")).toBe("http://localhost:5173");
    expect(res.headers.get("Access-Control-Allow-Methods")).toBe("GET,POST,OPTIONS");
  });
  test("/admin/products 无 token → 401", async () => {
    const res = await app.request("/admin/products");
    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ error: "UNAUTHORIZED" });
  });
  test("正确 Bearer → 200", async () => {
    const res = await app.request("/admin/products", {
      headers: { Authorization: "Bearer shop-secret" },
    });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ items: [] });
  });
  test("/boom → 500 {error:boom}，不要 stack", async () => {
    const res = await app.request("/boom");
    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({ error: "boom" });
  });
});
