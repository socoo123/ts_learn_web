import { Hono } from "hono";
import {
  errorToJson,
  parseCreateBody,
  parseIdParam,
  parseSearchQuery,
  patchBody,
  type CreateBody,
} from "./assignment";

/** 演示 PATCH 用的内存常量：机械键盘。不接数据库（Ch20）。 */
const KEYBOARD: CreateBody = {
  name: "机械键盘",
  price: 599,
  sku: "KB-001",
  stock: 120,
};

export const app = new Hono();

app.get("/products/:id", (c) => {
  const id = parseIdParam(c.req.param("id"));
  if (id === null) return c.json(errorToJson([{ path: ["id"] }]), 400);
  return c.json({ id });
});

app.get("/search", (c) => {
  const parsed = parseSearchQuery({ ...c.req.query() });
  if (parsed === null) return c.json(errorToJson([{ path: ["q"] }]), 400);
  return c.json(parsed);
});

app.post("/products", async (c) => {
  let body: unknown;
  try {
    body = await c.req.json();
  } catch {
    return c.json(errorToJson([{ path: [] }]), 400);
  }
  const parsed = parseCreateBody(body);
  if (parsed === null) return c.json(errorToJson([{ path: ["body"] }]), 400);
  return c.json(parsed, 201);
});

app.patch("/products/:id", async (c) => {
  const id = parseIdParam(c.req.param("id"));
  if (id === null) return c.json(errorToJson([{ path: ["id"] }]), 400);
  let patch: unknown;
  try {
    patch = await c.req.json();
  } catch {
    return c.json(errorToJson([{ path: [] }]), 400);
  }
  const next = patchBody(KEYBOARD, patch);
  if (next === null) return c.json(errorToJson([{ path: ["body"] }]), 400);
  return c.json({ id, ...next });
});
