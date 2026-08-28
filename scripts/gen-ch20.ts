/**
 * 生成 src/content/chapters/ch20.json
 * 运行：bun scripts/gen-ch20.ts
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const preamble = `/**
 * Ch20 作业：商品表 CRUD 的边界纯函数。真正写库在 local/m4/ch20/app.ts。
 *
 * 场景：把 shared.json 的 10 件商品落到 products 表。
 * 智能水杯 CP-009 库存 0，在库列表 SQL 必须排除它。
 * 删除只用 ? 占位，不要把 sku 拼进 SQL。
 *
 * 全绿 = 你掌握了 Ch20。本地：bun test local/m4/ch20
 */

type Product = {
  id: number;
  name: string;
  category: string;
  price: number;
  stock: number;
  sku: string;
};

type ProductRow = {
  id: number;
  name: string;
  category: string;
  price: number;
  stock: number;
  sku: string;
};

type InsertInput = {
  name: string;
  category: string;
  price: number;
  stock: number;
  sku: string;
};

type InsertOk = { ok: true; value: InsertInput };
type InsertErr = { ok: false; error: "SHAPE" | "SKU" | "NAME" | "PRICE" | "STOCK" | "CATEGORY" };`;

const functions = [
  {
    name: "toRow",
    testSuite: "toRow",
    skeleton: `/**
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
}`,
  },
  {
    name: "fromRow",
    testSuite: "fromRow",
    skeleton: `/**
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
}`,
  },
  {
    name: "listInStockSql",
    testSuite: "listInStockSql",
    skeleton: `/**
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
}`,
  },
  {
    name: "insertProductInput",
    testSuite: "insertProductInput",
    skeleton: `/**
 * 【场景】POST /products 的 JSON。形状不对、sku 小写、名字全空格，都是 400。
 *
 * 【转换点】先 SHAPE（不是对象 / 缺键），再 SKU → NAME → CATEGORY → PRICE → STOCK。
 * sku 必须 /^[A-Z]{2}-\\d{3}$/（KB-001 过，kb-001 / KB-01 / "" 不过）。
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
}`,
  },
  {
    name: "updateStock",
    testSuite: "updateStock",
    skeleton: `/**
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
}`,
  },
  {
    name: "deleteBySku",
    testSuite: "deleteBySku",
    skeleton: `/**
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
}`,
  },
];

const assignment = `${preamble}

${functions.map((f) => f.skeleton).join("\n\n")}
`;

const testSource = `const KB = {
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
  it("机械键盘 KB-001 → 同行", () => {
    expect(toRow(KB)).toEqual(KB);
  });
  it("无线鼠标 MS-002 → 同行（防硬编码键盘）", () => {
    expect(toRow(MS)).toEqual(MS);
  });
  it("水杯 stock 0 原样抄；返回新对象", () => {
    const p = {
      id: 9,
      name: "智能水杯",
      category: "生活用品",
      price: 199,
      stock: 0,
      sku: "CP-009",
    };
    const row = toRow(p);
    expect(row).toEqual(CUP);
    row.stock = 99;
    expect(p.stock).toBe(0);
  });
});

describe("fromRow", () => {
  it("合法键盘行 → Product", () => {
    expect(fromRow(KB)).toEqual(KB);
  });
  it("鼠标行；水杯 stock 0 也合法", () => {
    expect(fromRow(MS)).toEqual(MS);
    expect(fromRow(CUP)).toEqual(CUP);
  });
  it("id 字符串 / null / 非对象 → null", () => {
    expect(fromRow({ id: "1" })).toBeNull();
    expect(fromRow(null)).toBeNull();
    expect(fromRow(undefined)).toBeNull();
    expect(fromRow(1)).toBeNull();
    expect(fromRow("KB-001")).toBeNull();
    expect(fromRow([])).toBeNull();
  });
  it("id 0、负库存、多字段忽略、类型错", () => {
    const extra = {
      id: 1,
      name: "机械键盘",
      category: "电脑外设",
      price: 599,
      stock: 120,
      sku: "KB-001",
      extra: "x",
    };
    expect(fromRow(extra)).toEqual(KB);
    expect(
      fromRow({
        id: 0,
        name: "机械键盘",
        category: "电脑外设",
        price: 599,
        stock: 120,
        sku: "KB-001",
      }),
    ).toBeNull();
    expect(
      fromRow({
        id: 1.5,
        name: "机械键盘",
        category: "电脑外设",
        price: 599,
        stock: 120,
        sku: "KB-001",
      }),
    ).toBeNull();
    expect(
      fromRow({
        id: 1,
        name: "机械键盘",
        category: "电脑外设",
        price: 599,
        stock: -1,
        sku: "KB-001",
      }),
    ).toBeNull();
    expect(
      fromRow({
        id: 1,
        name: "",
        category: "电脑外设",
        price: 599,
        stock: 120,
        sku: "KB-001",
      }),
    ).toBeNull();
    expect(
      fromRow({
        id: 1,
        name: "机械键盘",
        category: "电脑外设",
        price: Number.NaN,
        stock: 120,
        sku: "KB-001",
      }),
    ).toBeNull();
  });
});

describe("listInStockSql", () => {
  it("精确 SELECT 在库", () => {
    expect(listInStockSql()).toBe(SQL_IN_STOCK);
  });
  it("第二次调用仍是同一句（防蒙对）", () => {
    expect(listInStockSql()).toBe(
      "SELECT id, name, category, price, stock, sku FROM products WHERE stock > 0 ORDER BY id ASC",
    );
  });
  it("必须是 stock > 0，排除 CP-009", () => {
    const sql = listInStockSql();
    expect(sql.includes("stock > 0")).toBe(true);
    expect(sql.includes("stock >=")).toBe(false);
    expect(sql.includes("CP-009")).toBe(false);
    expect(sql.includes(";")).toBe(false);
  });
});

describe("insertProductInput", () => {
  it("合法键盘五字段", () => {
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
      value: {
        name: "机械键盘",
        category: "电脑外设",
        price: 599,
        stock: 120,
        sku: "KB-001",
      },
    });
  });
  it("合法鼠标；水杯 trim + stock 0", () => {
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
      value: {
        name: "无线鼠标",
        category: "电脑外设",
        price: 159,
        stock: 300,
        sku: "MS-002",
      },
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
      value: {
        name: "智能水杯",
        category: "生活用品",
        price: 199,
        stock: 0,
        sku: "CP-009",
      },
    });
  });
  it("SHAPE 与 SKU 优先", () => {
    expect(insertProductInput(null)).toEqual({ ok: false, error: "SHAPE" });
    expect(insertProductInput("x")).toEqual({ ok: false, error: "SHAPE" });
    expect(insertProductInput([])).toEqual({ ok: false, error: "SHAPE" });
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
    expect(
      insertProductInput({
        name: "机械键盘",
        category: "电脑外设",
        price: 599,
        stock: 120,
        sku: "KB-01",
      }),
    ).toEqual({ ok: false, error: "SKU" });
    expect(
      insertProductInput({
        name: "机械键盘",
        category: "电脑外设",
        price: 599,
        stock: 120,
        sku: "",
      }),
    ).toEqual({ ok: false, error: "SKU" });
    expect(
      insertProductInput({
        name: "",
        category: "",
        price: -1,
        stock: -1,
        sku: "kb-001",
      }),
    ).toEqual({ ok: false, error: "SKU" });
  });
  it("NAME → CATEGORY → PRICE → STOCK；price/stock 0 合法", () => {
    const base = {
      name: "机械键盘",
      category: "电脑外设",
      price: 599,
      stock: 120,
      sku: "KB-001",
    };
    expect(insertProductInput({ ...base, name: "   " })).toEqual({ ok: false, error: "NAME" });
    expect(insertProductInput({ ...base, name: 1 })).toEqual({ ok: false, error: "NAME" });
    expect(insertProductInput({ ...base, category: "" })).toEqual({ ok: false, error: "CATEGORY" });
    expect(insertProductInput({ ...base, name: "  x  ", category: "  " })).toEqual({
      ok: false,
      error: "CATEGORY",
    });
    expect(insertProductInput({ ...base, price: -1, stock: -1 })).toEqual({
      ok: false,
      error: "PRICE",
    });
    expect(insertProductInput({ ...base, price: Number.NaN })).toEqual({
      ok: false,
      error: "PRICE",
    });
    expect(insertProductInput({ ...base, price: "599" })).toEqual({ ok: false, error: "PRICE" });
    expect(insertProductInput({ ...base, stock: 1.5 })).toEqual({ ok: false, error: "STOCK" });
    expect(insertProductInput({ ...base, stock: -1 })).toEqual({ ok: false, error: "STOCK" });
    expect(insertProductInput({ ...base, price: 0, stock: 0 })).toEqual({
      ok: true,
      value: {
        name: "机械键盘",
        category: "电脑外设",
        price: 0,
        stock: 0,
        sku: "KB-001",
      },
    });
  });
});

describe("updateStock", () => {
  it("键盘 120 减 1 → 119", () => {
    expect(updateStock(120, -1)).toBe(119);
  });
  it("鼠标 300 减 1 → 299（防硬编码 119）", () => {
    expect(updateStock(300, -1)).toBe(299);
  });
  it("边界：0-1 空；0+5；delta 0；非法 current/delta", () => {
    expect(updateStock(0, -1)).toBeNull();
    expect(updateStock(0, 5)).toBe(5);
    expect(updateStock(30, 0)).toBe(30);
    expect(updateStock(-1, 1)).toBeNull();
    expect(updateStock(1.5, 1)).toBeNull();
    expect(updateStock(1, 1.5)).toBeNull();
  });
});

describe("deleteBySku", () => {
  it("KB-001 仍是占位 SQL", () => {
    expect(deleteBySku("KB-001")).toBe(SQL_DELETE);
  });
  it("MS-002 同一句（防硬编码键盘）", () => {
    expect(deleteBySku("MS-002")).toBe(SQL_DELETE);
  });
  it("注入串也不拼接", () => {
    expect(deleteBySku("KB-001'; DROP TABLE products;--")).toBe(
      "DELETE FROM products WHERE sku = ?",
    );
  });
});
`;

function sec(
  id: string,
  heading: string,
  secNum: string | null,
  body: string,
  exerciseFunctions: string[],
) {
  return { id, heading, secNum, body, exerciseFunctions };
}

const sections = [
  sec(
    "intro",
    "",
    null,
    `> **预计**：1 天 ｜ **前置**：Ch17（Hono 路由 / \`c.json\`）
> **目标**：① \`Product\` ↔ 表行；② 在库 SQL 排除 CP-009；③ 插入输入校验；④ 改库存不让变负；⑤ 删除用 \`?\` 占位。
> 你 15 年 Java：\`@Entity\` / JDBC \`ResultSet\`。Python：SQLAlchemy model / \`sqlite3\` row。本章只 CRUD **一张** \`products\` 表。

> 📐 **本教程的契约**：下面每一节（§20.1–§20.6）都**精确对应**作业里的题。讲过的才考，考的必讲过。卡住时按作业函数名回查对应小节。
> **不讲**：迁移、连接池、生产配置。\`app.ts\` 已经写好内存 SQLite，你填纯函数。网页运行器没有 sqlite，作业禁止 \`import\`。

---`,
    [],
  ),
  sec(
    "sec-map",
    "🗺️ 本章地图",
    null,
    `本章作业是一条完整主线：**把 10 件商品落到 SQLite，再按 HTTP 做 CRUD**。机械键盘 KB-001、无线鼠标 MS-002 要能查到；智能水杯 CP-009 库存 0，在库列表里消失。删除即使用注入串当 sku，表也不能被 drop。

读完这章 + 完成作业，你将能够：

- 把 \`Product\` 抄成表行，再从 unknown 行认回来（类型蒸发后的边界）
- 写出 \`stock > 0\` 的 SELECT（Ch01 那条过滤的 SQL 版）
- 按 SHAPE → SKU → NAME → CATEGORY → PRICE → STOCK 校验插入
- 用整数加减库存，拒绝变成负数
- 删除永远用 \`?\`，对照 JDBC \`PreparedStatement\`

**作业 ↔ 教程对应表**（学哪节，就去做哪题）：

| 作业题 | 对应小节 | 核心知识点 |
|--------|----------|-----------|
| \`toRow\` | §20.1 | Product 抄成行，不 mutate |
| \`fromRow\` | §20.2 | unknown 行 → Product 或 null |
| \`listInStockSql\` | §20.3 | \`stock > 0\` 排除 CP-009 |
| \`insertProductInput\` | §20.4 | 插入校验顺序与 trim |
| \`updateStock\` | §20.5 | 整数库存，拒绝负数 |
| \`deleteBySku\` | §20.6 | \`?\` 占位，防注入 |

本地文件：\`local/m4/ch20/assignment.ts\`（改 TODO）、\`app.ts\`（Hono + \`bun:sqlite\` 内存库，不用改）、\`assignment.test.ts\`。

---`,
    [],
  ),
  sec(
    "sec-path",
    "⏱️ 学习路径：费曼五步（约 50–70 分钟）",
    null,
    `| 步 | 你要做 | 在哪做 |
|----|--------|--------|
| ① 预览猜（2 分钟） | 猜类型蒸发、\`ResultSet\` vs 行对象、为什么不能拼 sku | 本页 ① |
| ② 先动手 | 打开 \`local/m4/ch20/assignment.ts\` 改 TODO | 仓库 local/ |
| ③ 提取+反馈 | \`bun test local/m4/ch20\` 看红绿 | 终端 |
| ④ 费曼（2 分钟） | 大白话讲清「为什么 fromRow 吃 unknown」 | 本页 ④ |
| ⑤ 存闪卡 | 章末闪卡标复习日期 | 闪卡 |

> 💡 网页这一章是只读的。不要在浏览器里改代码。JSON 作业是纯函数；真的 \`CREATE TABLE\` 只在 \`local/m4/ch20/app.ts\`。
> \`fromRow\` 是 \`toRow\` 的逆。\`deleteBySku\` 忽略参数，永远同一句 SQL。

---`,
    [],
  ),
  sec(
    "sec-guess",
    "① 预览猜（2 分钟 · 激活你的 Java / Python 直觉）",
    null,
    `先别看答案，凭经验猜一猜（猜错没关系）：

1. Java 里 \`Product\` 是 \`@Entity\`，运行时还在。TS 的 \`type Product\` 编译完还在吗？从 SQLite 读回来的 \`row.id\` 一定是 number 吗？
2. JDBC \`ResultSet.getInt("id")\` 和 \`row.id\` 哪个会在 \`id\` 实际是 \`"1"\` 时悄悄给你错的东西？
3. Ch01 用 \`stock > 0\` 滤掉智能水杯。写成 SQL 如果用 \`stock >= 0\`，CP-009 会出现在货架上吗？
4. 有人把 sku 拼进 SQL。sku 是 \`KB-001'; DROP TABLE products;--\` 时会发生什么？
5. \`insertProductInput\` 缺 \`sku\` 键，同时又 \`name: ""\`，错误码该是 SHAPE 还是 NAME？
6. 库存 0 的水杯再 \`delta: -1\`，该返回 0 还是拒绝？

> 猜完，带着验证心态进入正文。第 1、2、4 题是本章的 🔴。

---`,
    [],
  ),
  sec(
    "sec-world",
    "行对象、类型蒸发、drizzle 只是概念 🔴",
    null,
    `Ch17 的商品还在内存数组里。进程一停，库存没了。本章用 SQLite **一张** \`products\` 表记住 10 件货。作业测的是边界纯函数：怎么抄行、怎么认行、SQL 长什么样、输入合不合法。真正的 \`db.query\` 已写在 \`app.ts\`。

| | Java | Python | 本章 |
|---|---|---|---|
| 表映射 | JPA \`@Entity\` | SQLAlchemy model | **概念上** drizzle \`sqliteTable\`（作业不 import） |
| 读行 | JDBC \`ResultSet.getInt / getString\` | \`sqlite3\` row | \`fromRow(unknown)\`：类型蒸发，自己认 |
| 写行 | \`entityManager.persist\` | \`session.add\` | \`toRow\` 抄字段 + \`INSERT\` 绑定参数 |
| 在库 | \`WHERE stock > 0\` | 同左 | \`listInStockSql\` 精确这一句 |

### Java：Entity 还在，ResultSet 要按列取

\`\`\`java
@Entity
@Table(name = "products")
public class Product {
    @Id private Long id;
    private String name;
    private String category;
    private BigDecimal price;
    private int stock;
    private String sku;
}

PreparedStatement ps = conn.prepareStatement(
    "SELECT id, name, category, price, stock, sku FROM products WHERE stock > 0");
ResultSet rs = ps.executeQuery();
while (rs.next()) {
    long id = rs.getLong("id");
    String name = rs.getString("name");
}
\`\`\`

JPA Entity 运行时还是对象。JDBC 调错 getter 会爆。TS 没有这一层。

### Python：SQLAlchemy model vs sqlite3 行

\`\`\`python
class Product(Base):
    __tablename__ = "products"
    id = Column(Integer, primary_key=True)
    name = Column(String)
    category = Column(String)
    price = Column(Float)
    stock = Column(Integer)
    sku = Column(String, unique=True)

row = conn.execute("SELECT * FROM products WHERE sku = ?", ("KB-001",)).fetchone()
# sqlite3 行没有类型，你自己认
\`\`\`

### TypeScript：类型蒸发；drizzle 是 typed schema（教程概念，不考 import）

\`type Product\` 在 \`tsc\` 之后消失。\`row.id\` 运行时可能是 number、string、甚至 undefined。所以 \`fromRow\` 的参数是 \`unknown\`。

生产里常用 drizzle 把「表长什么样」写成 **仍能在 TS 里检查** 的 schema——对照 JPA Entity，但它**不是**运行时反射实体，只是列定义 + 类型。作业**不要** \`import\` drizzle。

\`\`\`ts
import { sqliteTable, integer, text, real } from "drizzle-orm/sqlite-core";

export const products = sqliteTable("products", {
  id: integer("id").primaryKey(),
  name: text("name").notNull(),
  category: text("category").notNull(),
  price: real("price").notNull(),
  stock: integer("stock").notNull(),
  sku: text("sku").notNull().unique(),
});
\`\`\`

\`app.ts\` 用 Bun 自带的 \`bun:sqlite\` + \`:memory:\`，不接连接池、不搞迁移。

\`\`\`mermaid
flowchart LR
    j["Java JPA Entity<br/>────────<br/>@Entity 对表<br/>运行时对象还在"]
    t["TS 类型加 drizzle 概念<br/>────────<br/>interface 编译后蒸发<br/>sqliteTable 补 typed schema"]
    j ~~~ t

    style j fill:#90CAF9,stroke:#1976D2,color:#1f1f1f
    style t fill:#A5D6A7,stroke:#388E3C,color:#1f1f1f
\`\`\`

### HTTP 怎么接到纯函数

\`\`\`mermaid
sequenceDiagram
    participant C as 课程站
    participant H as Hono
    participant F as 纯函数
    participant D as SQLite内存库

    C->>H: GET /products
    H->>F: 调用 listInStockSql
    F-->>H: SELECT 且 stock 大于 0
    H->>D: prepare 后 all
    D-->>H: 行对象数组
    loop 每一行
        H->>F: 调用 fromRow
        F-->>H: Product 或 null
    end
    H-->>C: JSON 列表不含 CP-009
\`\`\`

### ❌ 把 SELECT 结果当成已经是 Product

\`\`\`ts
// ❌ function shelf(rows: ProductRow[]) { return rows.map(r => r.name); }
//    调用方随便塞 {id:"1"}，编译期过、运行期炸
// ❌ 作业 import drizzle-orm / bun:sqlite（网页运行器没有）
// ✅ fromRow(unknown)：认出来才当 Product
\`\`\`

### 本课怎么算「会了」

打开 \`local/m4/ch20/assignment.ts\`，\`bun test local/m4/ch20\`。纯函数全绿，再加：GET \`/products\` 没有 CP-009、有 KB-001 和 MS-002；POST 合法 201、坏 sku 400；PATCH 改库存；DELETE；注入 sku 删不掉表。**全绿 = 这题掌握。**

---`,
    [],
  ),
  sec(
    "sec-20.1",
    "§20.1 抄成表行（对应：`toRow`）🟢",
    "20.1",
    `内存里的 \`Product\` 和表行字段一样，但边界要**新对象**。对照 \`new ProductEntity()\` 再 setter，不要把同一个引用塞进两个层。

\`\`\`java
ProductRow row = new ProductRow();
row.setId(p.getId());
row.setName(p.getName());
// …六个字段。不要 row = p;
\`\`\`

\`\`\`ts
function toRow(p: Product): ProductRow {
  return {
    id: p.id,
    name: p.name,
    category: p.category,
    price: p.price,
    stock: p.stock,
    sku: p.sku,
  };
}

toRow({ id: 1, name: "机械键盘", category: "电脑外设", price: 599, stock: 120, sku: "KB-001" });
toRow({ id: 2, name: "无线鼠标", category: "电脑外设", price: 159, stock: 300, sku: "MS-002" });
toRow({ id: 9, name: "智能水杯", category: "生活用品", price: 199, stock: 0, sku: "CP-009" });
// stock 0 也抄，不要擅自改成 1
\`\`\`

\`app.ts\` 种子数据：对 shared.json 每件商品 \`toRow\`，再 \`INSERT\` 六个绑定参数。

\`\`\`mermaid
flowchart LR
    p["内存 Product"] -->|"toRow"| r["表行 ProductRow"]
    r -->|"fromRow"| p2["再变成 Product"]

    style p fill:#FFE082,stroke:#F9A825,color:#1f1f1f
    style r fill:#80DEEA,stroke:#0097A7,color:#1f1f1f
    style p2 fill:#A5D6A7,stroke:#388E3C,color:#1f1f1f
\`\`\`

### ❌ / ✅

\`\`\`ts
// ❌ return p;          // 后面改 row.stock 会改到货架上那件
// ❌ p.stock = p.stock; return p;
// ✅ 字面量新对象，六字段
\`\`\`

> ✅ **做 \`toRow\`**：抄 6 字段。测试会改返回值的 stock，原对象必须不动。

---`,
    ["toRow"],
  ),
  sec(
    "sec-20.2",
    "§20.2 unknown 行认回来（对应：`fromRow`）🔴",
    "20.2",
    `这是 \`toRow\` 的逆，也是本章最 TS 的一题。SQLite / JSON 给你的是 **unknown**。\`type ProductRow\` 在运行时不存在——和 JPA 托管实体、JDBC 按列 getter 都不一样。

规则（全过才返回 Product，否则 \`null\`）：

| 字段 | 合法 |
|------|------|
| 整体 | 非 null 对象，不是数组 |
| \`id\` | 整数 ≥ 1 |
| \`name\` / \`category\` / \`sku\` | 非空字符串（**不 trim**，\`"  "\` 算非空） |
| \`price\` | \`typeof number\` 且 \`Number.isFinite\` 且 ≥ 0 |
| \`stock\` | 整数 ≥ 0（**0 合法**，CP-009） |
| 多出来的键 | 忽略 |
| 缺键 / 错类型 | null |

\`\`\`ts
function fromRow(row: unknown): Product | null {
  if (row === null || typeof row !== "object" || Array.isArray(row)) return null;
  const r = row as Record<string, unknown>;
  const { id, name, category, price, stock, sku } = r;
  if (typeof id !== "number" || !Number.isInteger(id) || id < 1) return null;
  if (typeof name !== "string" || name.length === 0) return null;
  if (typeof category !== "string" || category.length === 0) return null;
  if (typeof sku !== "string" || sku.length === 0) return null;
  if (typeof price !== "number" || !Number.isFinite(price) || price < 0) return null;
  if (typeof stock !== "number" || !Number.isInteger(stock) || stock < 0) return null;
  return { id, name, category, price, stock, sku };
}

fromRow({ id: 1, name: "机械键盘", category: "电脑外设", price: 599, stock: 120, sku: "KB-001" });
fromRow({ id: "1" }); // null
fromRow(null);        // null
fromRow({ ...键盘, extra: true }); // 忽略 extra
fromRow({ ...水杯, stock: 0 });    // 合法
\`\`\`

\`{id:"1"}\` 在 Java 里 \`getLong\` 对不上列类型；在 TS 里如果你写 \`row.id as number\`，静默得到字符串。认不出来就 \`null\`。

sku 这里**不**跑 \`KB-001\` 正则——那是插入校验。库里已经有的行，只问「像不像 Product」。

### ❌ / ✅

\`\`\`ts
// ❌ return row as Product
// ❌ id: Number(row.id) 把 "1" 救成 1（本题要类型已经是 number）
// ❌ stock === 0 当成非法（缺货水杯要能读回来）
// ✅ unknown → 字段检查 → 新 Product
\`\`\`

> ✅ **做 \`fromRow\`**：键盘 / 鼠标 / 水杯 0 库存过；\`{id:"1"}\`、\`null\`、数组不过。

---`,
    ["fromRow"],
  ),
  sec(
    "sec-20.3",
    "§20.3 在库 SQL（对应：`listInStockSql`）🟢",
    "20.3",
    `Ch01 就说过：货架 \`stock > 0\`。智能水杯 CP-009 库存 0，**必须排除**。把同一句话写成 SQL，列序与 \`ORDER BY id ASC\` 固定。

\`\`\`sql
SELECT id, name, category, price, stock, sku FROM products WHERE stock > 0 ORDER BY id ASC
\`\`\`

\`stock >= 0\` 会把水杯带回来。不要分号、不要 \`SELECT *\`。作业要精确字符串。

\`\`\`ts
function listInStockSql(): string {
  return "SELECT id, name, category, price, stock, sku FROM products WHERE stock > 0 ORDER BY id ASC";
}
\`\`\`

\`app.ts\`：\`db.query(listInStockSql()).all()\`，再 \`map(fromRow)\`。GET \`/products\` 测 9 件、没有 CP-009、有 KB-001 和 MS-002。

### ❌ / ✅

\`\`\`ts
// ❌ WHERE stock >= 0
// ❌ 把 CP-009 写进 SQL 当黑名单（应靠 stock）
// ❌ SELECT *
// ✅ 精确这一句，stock > 0
\`\`\`

> ✅ **做 \`listInStockSql\`**：\`toBe\` 整句相等。

---`,
    ["listInStockSql"],
  ),
  sec(
    "sec-20.4",
    "§20.4 插入输入（对应：`insertProductInput`）🟡",
    "20.4",
    `POST body 是 \`unknown\`。成功才有 \`InsertInput\`（无 id，id 由库生成）。失败用字面量错误码，方便 \`app.ts\` 回 400。

**检查顺序（先到先得）**：SHAPE → SKU → NAME → CATEGORY → PRICE → STOCK。

| error | 何时 |
|-------|------|
| \`SHAPE\` | \`null\` / 非对象 / 数组 / 缺 \`name,category,price,stock,sku\` 任一键 |
| \`SKU\` | 不是 string，或不匹配 \`/^[A-Z]{2}-\\d{3}$/\`。\`KB-001\` 过；\`kb-001\`、\`KB-01\`、\`""\` 不过 |
| \`NAME\` | 不是 string，或 \`trim\` 后为空 |
| \`CATEGORY\` | 不是 string，或 \`trim\` 后为空 |
| \`PRICE\` | 不是 \`typeof number\`，或非有限，或 \`< 0\`。**0 合法** |
| \`STOCK\` | 不是整数，或 \`< 0\`。**0 合法** |

成功时：\`value.name\` / \`value.category\` 是 **trim 后**的；sku / price / stock **原样**。

\`\`\`ts
insertProductInput({
  name: "机械键盘", category: "电脑外设", price: 599, stock: 120, sku: "KB-001",
}); // ok

insertProductInput({
  name: "  智能水杯  ", category: "  生活用品  ", price: 199, stock: 0, sku: "CP-009",
}); // ok，name/category 已 trim，stock 0

insertProductInput(null);                 // SHAPE
insertProductInput({ name: "机械键盘" }); // SHAPE（缺键，不是 NAME）
insertProductInput({ ...五键, sku: "kb-001" }); // SKU
insertProductInput({ ...五键, sku: "kb-001", name: "" }); // 仍是 SKU（顺序）
\`\`\`

\`\`\`mermaid
flowchart TD
    start["raw unknown"] --> shape{"是对象且五键齐全?"}
    shape -->|"否"| eShape["error SHAPE"]
    shape -->|"是"| sku{"sku 匹配 AA-000?"}
    sku -->|"否"| eSku["error SKU"]
    sku -->|"是"| name{"name trim 后非空?"}
    name -->|"否"| eName["error NAME"]
    name -->|"是"| cat{"category trim 后非空?"}
    cat -->|"否"| eCat["error CATEGORY"]
    cat -->|"是"| price{"price 是有限数且大于等于 0?"}
    price -->|"否"| ePrice["error PRICE"]
    price -->|"是"| stock{"stock 是整数且大于等于 0?"}
    stock -->|"否"| eStock["error STOCK"]
    stock -->|"是"| ok["ok true 加 trimmed value"]

    style start fill:#FFE082,stroke:#F9A825,color:#1f1f1f
    style shape fill:#80DEEA,stroke:#0097A7,color:#1f1f1f
    style sku fill:#80DEEA,stroke:#0097A7,color:#1f1f1f
    style name fill:#80DEEA,stroke:#0097A7,color:#1f1f1f
    style cat fill:#80DEEA,stroke:#0097A7,color:#1f1f1f
    style price fill:#80DEEA,stroke:#0097A7,color:#1f1f1f
    style stock fill:#80DEEA,stroke:#0097A7,color:#1f1f1f
    style ok fill:#A5D6A7,stroke:#388E3C,color:#1f1f1f
    style eShape fill:#EF9A9A,stroke:#C62828,color:#1f1f1f
    style eSku fill:#EF9A9A,stroke:#C62828,color:#1f1f1f
    style eName fill:#EF9A9A,stroke:#C62828,color:#1f1f1f
    style eCat fill:#EF9A9A,stroke:#C62828,color:#1f1f1f
    style ePrice fill:#EF9A9A,stroke:#C62828,color:#1f1f1f
    style eStock fill:#EF9A9A,stroke:#C62828,color:#1f1f1f
\`\`\`

Ch18 创建价 0 非法；**本章 price 0 合法**（免费赠品也能入库）。库存 0 两边都合法。sku 正则与 Ch18 相同。

### ❌ / ✅

\`\`\`ts
// ❌ 缺键当 SKU（应 SHAPE）
// ❌ 先查 name 再查 sku（顺序错）
// ❌ price: "599" 用 Number 救回来
// ❌ value 里留下 "  机械键盘  "
// ✅ 顺序固定；trim 只进 value 的 name/category
\`\`\`

> ✅ **做 \`insertProductInput\`**：键盘 + 鼠标两条成功；坏 sku / 缺键 / 顺序题都要过。

---`,
    ["insertProductInput"],
  ),
  sec(
    "sec-20.5",
    "§20.5 改库存（对应：`updateStock`）🟡",
    "20.5",
    `PATCH \`/products/:sku/stock\` body 是 \`{ delta: number }\`。先按 sku 找到行，再算新库存。算不出来（\`null\`）→ 409；没这 sku → 404。

\`current\` 必须是整数 ≥ 0（库里脏成 1.5 / -3 直接拒绝）。\`delta\` 必须是整数，**可以是负数**。\`next = current + delta\`，\`next < 0\` → \`null\`。

\`\`\`ts
function updateStock(current: number, delta: number): number | null {
  if (!Number.isInteger(current) || current < 0) return null;
  if (!Number.isInteger(delta)) return null;
  const next = current + delta;
  return next < 0 ? null : next;
}

updateStock(120, -1); // 119  机械键盘卖一件
updateStock(300, -1); // 299  鼠标，防硬编码 119
updateStock(0, -1);   // null 水杯不能再减
updateStock(0, 5);    // 5    补货
updateStock(30, 0);   // 30   没改
\`\`\`

对照 Java \`if (stock + delta < 0) throw\`；这里不 throw，返回 \`null\` 让路由映射 409。

### ❌ / ✅

\`\`\`ts
// ❌ Math.max(0, current + delta) 把 -1 悄悄变成 0
// ❌ 允许 1.5 件
// ❌ current 为 0 一律拒绝（补货 +5 合法）
// ✅ 整数加减；只有 next < 0 才 null
\`\`\`

> ✅ **做 \`updateStock\`**：119 / 299 / 四个边界。

---`,
    ["updateStock"],
  ),
  sec(
    "sec-20.6",
    "§20.6 删除占位 SQL（对应：`deleteBySku`）🔴",
    "20.6",
    `综合题：函数**永远**返回同一句，忽略 \`sku\`。真正的值由 \`app.ts\` 绑定。这是 JDBC \`PreparedStatement.setString(1, sku)\`，不是 \`Statement\` 拼字符串。

\`\`\`java
// ✅ ps = conn.prepareStatement("DELETE FROM products WHERE sku = ?");
//    ps.setString(1, sku);
// ❌ stmt.execute("DELETE FROM products WHERE sku = '" + sku + "'");
\`\`\`

\`\`\`ts
function deleteBySku(sku: string): string {
  return "DELETE FROM products WHERE sku = ?";
}

deleteBySku("KB-001");
deleteBySku("MS-002");
deleteBySku("KB-001'; DROP TABLE products;--");
// 三句完全一样
\`\`\`

如果写成 \`"DELETE FROM products WHERE sku = '" + sku + "'"\`，注入串会变成：先删 KB-001，再试图 \`DROP TABLE\`。即便驱动一次只跑一条语句，**键盘已经没了**。绑定 \`?\` 时，整段注入只是一个找不到的 sku → 404，KB-001 还在。

本题不必调用前面的函数；概念上它和 \`listInStockSql\` 一样是「返回 SQL 字符串」，和 \`fromRow\` 一样是边界。

### ❌ / ✅

\`\`\`ts
// ❌ "DELETE FROM products WHERE sku = '" + sku + "'"
// ❌ 对注入串 throw
// ❌ 只对 KB-001 返回占位句、其它 sku 拼接
// ✅ 永远 DELETE FROM products WHERE sku = ?
\`\`\`

> ✅ **做 \`deleteBySku\`**：三个 sku 同一句。HTTP 测试会打注入路径，表必须还在。

---`,
    ["deleteBySku"],
  ),
  sec(
    "sec-pits",
    "⚠️ Java / Python 老手几个坑",
    null,
    `1. **以为 \`type Product\` 运行时还在。** 蒸发了。\`fromRow\` 吃 unknown。drizzle schema 是编译期补丁，不是 JPA 反射。
2. **把 sqlite 行当成 ResultSet。** 没有 \`getInt\`。\`{id:"1"}\` 要你自己变成 null。
3. **\`return p\` 当 toRow。** 改库存会改到原对象。
4. **\`stock >= 0\` 当在库。** CP-009 会摆上货架。Ch01 就是 \`>\`。
5. **缺键报 SKU。** 缺键是 SHAPE。键齐了才看正则。
6. **price \`0\` 当非法。** 本章允许；不要把 Ch18 创建价规则原样搬过来。
7. **\`Math.max(0, current+delta)\`。** 超卖应 409，不是默默变 0。
8. **拼 sku 进 SQL。** 永远 \`?\`。Python 也是 \`?\` / \`:sku\`，不是 f-string。
9. **作业 import 框架或 sqlite。** JSON 作业是纯函数；\`bun:sqlite\` 只在 \`app.ts\`。
10. **不要在 app.ts 里 listen。** 测试 \`app.request\`。流式响应留给 Ch21。

---`,
    [],
  ),
  sec(
    "sec-homework",
    "📝 本章作业",
    null,
    `上面 6 个函数按节交错出现。每个注释里有【场景】【转换点】、示例和提示。

**完成方式**：打开仓库 \`local/m4/ch20/assignment.ts\`，把 \`throw new Error("TODO")\` 换成实现，然后：

\`\`\`bash
bun test local/m4/ch20
\`\`\`

\`app.ts\` 不用改（内存库、种子 10 件、GET/POST/PATCH/DELETE 已接好）。不要 \`listen\` 端口，测试用 \`app.request\`。

卡住就回对应 §：\`toRow\` → §20.1，\`fromRow\` → §20.2，\`listInStockSql\` → §20.3，\`insertProductInput\` → §20.4，\`updateStock\` → §20.5，\`deleteBySku\` → §20.6。

---`,
    [],
  ),
  sec(
    "sec-check",
    "✅ 自测：你真的掌握了吗？",
    null,
    `- [ ] 能说清 JPA Entity 运行时还在、TS 类型会蒸发
- [ ] \`toRow\` 新对象；改 row 不动原 Product
- [ ] \`fromRow({id:"1"})\` 是 null；水杯 stock 0 不是 null
- [ ] 在库 SQL 是 \`stock > 0\`，GET 列表没有 CP-009
- [ ] 插入校验顺序 SHAPE → SKU → NAME → CATEGORY → PRICE → STOCK
- [ ] \`(0,-1)\` 改库存是 null，不是 0
- [ ] 删除 SQL 永远带 \`?\`；注入 sku 删不掉表
- [ ] \`bun test local/m4/ch20\` 全绿

---`,
    [],
  ),
  sec(
    "sec-feynman",
    "🎓 费曼挑战",
    null,
    `用大白话讲给「Java 同事」听。讲不清 = 还没真懂。

任选一题（1–2 分钟）：

1. 「为什么不能把 SELECT 的行 \`as Product\`？JDBC \`getLong\` 和 \`row.id\` 差在哪？drizzle 的 \`sqliteTable\` 又补了哪一层？」— 卡壳重读总述 + §20.2
2. 「货架为什么用 \`stock > 0\` 而不是 \`>=\`？智能水杯会出现在哪？」— 卡壳重读 §20.3
3. 「删除为什么必须 \`?\`？sku 里出现分号和 DROP TABLE 时，拼接和绑定各发生什么？」— 卡壳重读 §20.6

---`,
    [],
  ),
  sec(
    "sec-next",
    "⏭️ 下一步",
    null,
    `Ch20 掌握后，商品已经能在内存 SQLite 里 CRUD。下一章是 **Ch21 · SSE 流式响应**：还是这条 API，换成一块一块把文本推给前端，为后面的模型 token 流铺路。本章不要提前写 event-stream。`,
    [],
  ),
];

const tutorialMd = `# Ch20 · 轻量持久化

${sections
  .map((s) => (s.heading ? `## ${s.heading}\n\n${s.body}` : s.body))
  .join("\n\n")}
`;

const reviewMd = `# Ch20 · 记忆闪卡

> 先回忆，再翻答案。连续 2 次秒答 → 退役。

## 🔖 闪卡

| # | 正面（问题） | 背面（答案） | 掌握 |
|---|---|---|---|
| 1 | TS 的 \`type Product\` 编译后还在吗？为什么 \`fromRow\` 要吃 \`unknown\`？ | 类型蒸发。SQLite 行可能是 \`{id:"1"}\`。不能 \`as Product\`。对照 JDBC 按列 getter / JPA Entity 运行时还在。 | ⬜ |
| 2 | drizzle \`sqliteTable("products", { ... })\` 对照 Java 什么？作业要 import 吗？ | 对照 JPA \`@Entity\` 的**列定义 + 类型**，不是运行时实体。作业不 import；纯函数自己认行。 | ⬜ |
| 3 | 在库 SQL 为什么必须 \`stock > 0\`？CP-009 呢？ | Ch01 同一条：库存 0 不上架。\`>= 0\` 会把智能水杯带回来。 | ⬜ |
| 4 | \`insertProductInput\` 缺 \`sku\` 键、同时 \`name: ""\`，error 是什么？顺序？ | \`SHAPE\`。SHAPE → SKU → NAME → CATEGORY → PRICE → STOCK，缺键走不到 NAME。 | ⬜ |
| 5 | sku \`kb-001\` / \`KB-01\` / \`""\` 分别？正则？ | 都是 \`SKU\`。\`/^[A-Z]{2}-\\d{3}$/\`。KB-001 过。 | ⬜ |
| 6 | \`updateStock(0, -1)\` 和 \`(0, 5)\`？为什么不要 \`Math.max(0, ...)\`？ | 前者 null（409），后者 5。\`Math.max\` 会把超卖悄悄变成 0。 | ⬜ |
| 7 | \`deleteBySku("KB-001'; DROP TABLE products;--")\` 返回什么？ | 仍是 \`DELETE FROM products WHERE sku = ?\`。绑定后只是找不到的 sku，表还在。 | ⬜ |
| 8 | \`toRow\` 为什么不能 \`return p\`？水杯 stock 0 抄不抄？ | 要新对象，改 row 不能动货架。0 也原样抄。 | ⬜ |
| 9 | Python \`sqlite3\` row 和 SQLAlchemy model 哪个更像 \`fromRow\`？ | 裸 \`sqlite3\` 行：无类型，自己认。SQLAlchemy 更像 JPA / drizzle schema。 | ⬜ |

## 🎓 费曼自检

- [ ] 能说清类型蒸发、JDBC vs 行对象、drizzle 只是 typed schema
- [ ] 能说清 \`stock > 0\`、校验顺序、\`?\` 防注入
`;

const chapter = {
  id: "ch20",
  num: "20",
  title: "轻量持久化",
  runMode: "local" as const,
  tutorialMd,
  assignment,
  testName: "ch20_assignment",
  testSource,
  reviewMd,
  interleaved: true,
  sections,
  functions,
  preamble,
  localHint: "bun test local/m4/ch20",
};

const out = join(dirname(fileURLToPath(import.meta.url)), "../src/content/chapters/ch20.json");
mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, JSON.stringify(chapter, null, 2) + "\n");
console.log("wrote", out);

const localDir = join(dirname(fileURLToPath(import.meta.url)), "../local/m4/ch20");
mkdirSync(localDir, { recursive: true });

const localAssignment = `/**
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

${functions.map((f) => f.skeleton).join("\n\n")}
`;

const appSource = `import { Database } from "bun:sqlite";
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
db.run(\`CREATE TABLE products (
  id INTEGER PRIMARY KEY,
  name TEXT,
  category TEXT,
  price REAL,
  stock INTEGER,
  sku TEXT UNIQUE
)\`);

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
`;

const localTest = `import { describe, expect, test } from "bun:test";
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
`;

writeFileSync(join(localDir, "assignment.ts"), localAssignment);
writeFileSync(join(localDir, "app.ts"), appSource);
writeFileSync(join(localDir, "assignment.test.ts"), localTest);
console.log("wrote", localDir);
