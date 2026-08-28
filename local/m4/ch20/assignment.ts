/**
 * Ch20 作业：商品表 CRUD 的边界纯函数。
 *
 * 场景：10 件商品落到 products。CP-009 库存 0，在库列表要排除。
 * 删除只用 ? 占位。真正写库在 app.ts。
 *
 * 打开本文件改 TODO，然后：bun test local/m4/ch20
 */

export type Product = {
  id: number;
  name: string;
  category: string;
  price: number;
  stock: number;
  sku: string;
};

export type ProductRow = {
  id: number;
  name: string;
  category: string;
  price: number;
  stock: number;
  sku: string;
};

export type InsertInput = {
  name: string;
  category: string;
  price: number;
  stock: number;
  sku: string;
};

export type InsertOk = { ok: true; value: InsertInput };
export type InsertErr = { ok: false; error: "SHAPE" | "SKU" | "NAME" | "PRICE" | "STOCK" | "CATEGORY" };

/**
 * 【场景】上架机械键盘 KB-001 前，先把内存里的 Product 抄成表行。
 *
 * 【转换点】对照 JPA 把 Entity 交给 EntityManager。TS 类型编译后蒸发，
 * 这一步只是抄 6 个字段，返回**新对象**，不要改 p。
 *
 * 任务：复制 id / name / category / price / stock / sku。
 * 示例：
 *   机械键盘 {id:1,name:"机械键盘",...,sku:"KB-001"} → 同行
 *   无线鼠标 MS-002 → 同行（别只硬编码键盘）
 *   智能水杯 stock 0 也原样抄
 *
 * 提示：字面量新对象。不要 return p。
 */
export function toRow(p: Product): ProductRow {
  throw new Error("TODO");
}

/**
 * 【场景】SELECT 回来的是 unknown。JDBC ResultSet.getInt 还算靠谱；
 * SQLite 行可能是 {id:"1"}。类型在运行时不存在，要自己认。
 *
 * 【转换点】不是非 null 对象 → null。要求：id 整数 ≥ 1；
 * name / category / sku 非空字符串（不 trim）；price 有限数 ≥ 0；
 * stock 整数 ≥ 0（0 合法，CP-009）。多字段忽略；类型错 → null。
 *
 * 任务：合法行 → Product；否则 null。fromRow 是 toRow 的逆。
 * 示例：
 *   键盘行 → Product
 *   {id:"1"} / null → null
 *   水杯 stock 0 → Product
 *
 * 提示：Number.isInteger / Number.isFinite。数组也不是行。
 */
export function fromRow(row: unknown): Product | null {
  throw new Error("TODO");
}

/**
 * 【场景】货架列表不要缺货。Ch01 已用 stock > 0 滤掉智能水杯 CP-009。
 *
 * 【转换点】把那条过滤写成 SQL。精确字符串，不要分号、不要改列序。
 *
 * 任务：返回
 *   SELECT id, name, category, price, stock, sku FROM products WHERE stock > 0 ORDER BY id ASC
 * 示例：
 *   调用 → 上面这一整句
 *   必须是 stock > 0（>= 会把 CP-009 带回来）
 *
 * 提示：原样返回。不要拼 sku。
 */
export function listInStockSql(): string {
  throw new Error("TODO");
}

/**
 * 【场景】POST /products 的 JSON。形状不对、sku 小写、名字全空格，都是 400。
 *
 * 【转换点】先 SHAPE（不是对象 / 缺键），再 SKU → NAME → CATEGORY → PRICE → STOCK。
 * sku 必须 /^[A-Z]{2}-\d{3}$/（KB-001 过，kb-001 / KB-01 / "" 不过）。
 * name / category：string，trim 后非空，value 里存 trim 后的。
 * price：typeof number、有限、≥ 0（0 合法）。stock：整数 ≥ 0（0 合法）。
 *
 * 任务：成功 { ok:true, value }；失败 { ok:false, error }。先到先得。
 * 示例：
 *   键盘五字段 → ok，value 原样（name 已 trim）
 *   {sku:"kb-001", ...} → {ok:false, error:"SKU"}
 *   缺 sku → SHAPE，不是 SKU
 *
 * 提示：数组 / null 是 SHAPE。"sku" in o 才算有键。
 */
export function insertProductInput(raw: unknown): InsertOk | InsertErr {
  throw new Error("TODO");
}

/**
 * 【场景】PATCH 库存：键盘 120 卖出 1 件 → 119。不能把库存改成负数。
 *
 * 【转换点】current 必须是整数 ≥ 0，否则 null。delta 必须是整数（可负），否则 null。
 * next = current + delta；next < 0 → null，否则 next。
 *
 * 任务：算出新库存，或拒绝。
 * 示例：
 *   (120, -1) → 119
 *   (0, -1) → null；（0, 5) → 5；（30, 0) → 30
 *
 * 提示：Number.isInteger。不要改传入值以外的东西。
 */
export function updateStock(current: number, delta: number): number | null {
  throw new Error("TODO");
}

/**
 * 【场景】DELETE /products/:sku。有人会传 KB-001'; DROP TABLE products;--
 *
 * 【转换点】永远返回带 ? 的语句，**不要**把 sku 拼进字符串。
 * 对照 PreparedStatement 的 ?，不是 Statement 字符串拼接。
 *
 * 任务：始终返回 DELETE FROM products WHERE sku = ?
 * 示例：
 *   "KB-001" → 上面这句
 *   "MS-002" → 还是这句
 *   "KB-001'; DROP TABLE products;--" → 还是这句
 *
 * 提示：忽略参数。app.ts 会用绑定参数传入 sku。
 */
export function deleteBySku(sku: string): string {
  throw new Error("TODO");
}
