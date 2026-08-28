import { Database } from "bun:sqlite";
import { Hono } from "hono";
import {
  deleteBySku,
  fromRow,
  insertProductInput,
  listInStockSql,
  toRow,
  updateStock,
} from "./assignment";

type Product = {
  id: number;
  name: string;
  category: string;
  price: number;
  stock: number;
  sku: string;
};

const SEED: Product[] = [
  { id: 1, name: "机械键盘", category: "电脑外设", price: 599.0, stock: 120, sku: "KB-001" },
  { id: 2, name: "无线鼠标", category: "电脑外设", price: 159.0, stock: 300, sku: "MS-002" },
  { id: 3, name: "27寸4K显示器", category: "电脑外设", price: 2199.0, stock: 45, sku: "MN-003" },
  { id: 4, name: "Python编程:从入门到实践", category: "图书", price: 89.0, stock: 500, sku: "BK-004" },
  { id: 5, name: "设计模式", category: "图书", price: 75.5, stock: 200, sku: "BK-005" },
  { id: 6, name: "降噪耳机", category: "影音设备", price: 1299.0, stock: 80, sku: "HP-006" },
  { id: 7, name: "蓝牙音箱", category: "影音设备", price: 399.0, stock: 150, sku: "SP-007" },
  { id: 8, name: "USB-C扩展坞", category: "电脑外设", price: 269.0, stock: 220, sku: "DK-008" },
  { id: 9, name: "智能水杯", category: "生活用品", price: 199.0, stock: 0, sku: "CP-009" },
  { id: 10, name: "人体工学椅", category: "生活用品", price: 1599.0, stock: 30, sku: "CH-010" },
];

const db = new Database(":memory:");
db.run(`CREATE TABLE products (
  id INTEGER PRIMARY KEY,
  name TEXT,
  category TEXT,
  price REAL,
  stock INTEGER,
  sku TEXT UNIQUE
)`);

const insertStmt = db.query(
  "INSERT INTO products (id, name, category, price, stock, sku) VALUES (?, ?, ?, ?, ?, ?)",
);
for (const p of SEED) {
  const row = toRow(p);
  insertStmt.run(row.id, row.name, row.category, row.price, row.stock, row.sku);
}

export const app = new Hono();

app.get("/products", (c) => {
  const rows = db.query(listInStockSql()).all();
  const items: Product[] = [];
  for (const row of rows) {
    const p = fromRow(row);
    if (p) items.push(p);
  }
  return c.json(items);
});

app.post("/products", async (c) => {
  let body: unknown;
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: "SHAPE" }, 400);
  }
  const parsed = insertProductInput(body);
  if (!parsed.ok) return c.json({ error: parsed.error }, 400);
  const maxRow = db.query("SELECT COALESCE(MAX(id), 0) AS maxId FROM products").get() as {
    maxId: number;
  };
  const id = maxRow.maxId + 1;
  const row = toRow({ id, ...parsed.value });
  try {
    db.query(
      "INSERT INTO products (id, name, category, price, stock, sku) VALUES (?, ?, ?, ?, ?, ?)",
    ).run(row.id, row.name, row.category, row.price, row.stock, row.sku);
  } catch {
    return c.json({ error: "SKU" }, 409);
  }
  return c.json({ id, ...parsed.value }, 201);
});

app.patch("/products/:sku/stock", async (c) => {
  const sku = c.req.param("sku");
  const found = db
    .query("SELECT id, name, category, price, stock, sku FROM products WHERE sku = ?")
    .get(sku);
  if (!found) return c.json({ error: "NOT_FOUND" }, 404);
  const product = fromRow(found);
  if (!product) return c.json({ error: "NOT_FOUND" }, 404);
  let body: unknown;
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: "SHAPE" }, 400);
  }
  const delta =
    body !== null && typeof body === "object" && "delta" in body
      ? (body as { delta: unknown }).delta
      : Number.NaN;
  const next = updateStock(product.stock, typeof delta === "number" ? delta : Number.NaN);
  if (next === null) return c.json({ error: "CONFLICT" }, 409);
  db.query("UPDATE products SET stock = ? WHERE sku = ?").run(next, sku);
  return c.json({ ...product, stock: next });
});

app.delete("/products/:sku", (c) => {
  const sku = c.req.param("sku");
  const sql = deleteBySku(sku);
  const result = db.query(sql).run(sku);
  if (result.changes === 0) return c.json({ error: "NOT_FOUND" }, 404);
  return c.body(null, 204);
});
