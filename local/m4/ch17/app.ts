import { Hono } from "hono";
import {
  createdStatus,
  getProductById,
  healthPayload,
  listProducts,
  notFoundBody,
  parseIdParam,
} from "./assignment";

type Product = {
  id: number;
  name: string;
  category: string;
  price: number;
  stock: number;
  sku: string;
};

export const PRODUCTS: Product[] = [
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

export const app = new Hono();
app.get("/health", (c) => c.json(healthPayload()));
app.get("/products", (c) => c.json(listProducts(PRODUCTS)));
app.get("/products/:id", (c) => {
  const id = parseIdParam(c.req.param("id"));
  if (id === null) return c.json(notFoundBody(), 404);
  const p = getProductById(PRODUCTS, id);
  if (!p) return c.json(notFoundBody(), 404);
  return c.json(p);
});
app.post("/products", (c) => c.json({ ok: true }, createdStatus() as 201));
