import { Hono } from "hono";
import { authHeaderOk, corsHeaders, onErrorPayload } from "./assignment";

export const app = new Hono();
const ALLOW = ["http://localhost:5173"];
const TOKEN = "shop-secret";

app.use("/*", async (c, next) => {
  const origin = c.req.header("Origin") ?? "";
  for (const [k, v] of Object.entries(corsHeaders(origin, ALLOW))) c.header(k, v);
  if (c.req.method === "OPTIONS") return c.body(null, 204);
  await next();
});

app.use("/admin/*", async (c, next) => {
  if (!authHeaderOk(c.req.header("Authorization"), TOKEN)) {
    throw new Error("UNAUTHORIZED");
  }
  await next();
});

app.get("/health", (c) => c.json({ ok: true }));
app.get("/admin/products", (c) => c.json({ items: [] }));
app.get("/boom", () => {
  throw new Error("boom");
});

app.onError((err, c) => {
  const p = onErrorPayload(err);
  return c.json(p.body, p.status as 401 | 403 | 500);
});
