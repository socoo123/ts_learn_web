/**
 * 生成 src/content/chapters/ch06.json
 * 运行：bun scripts/gen-ch06.ts
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const preamble = `/**
 * Ch06 作业：并行拉商品详情（内存 mock）。
 *
 * 场景：详情页要一次拉多个 SKU。没有真网络——catalog 从参数传入，
 * 函数返回立刻 settle 的 Promise（Promise.resolve / async return）。
 * 7 个函数：包装 Promise → async/await → 抛错 → unknown 收窄 →
 * Promise.all → allSettled → 失败再试一次。
 *
 * 约定：目录项至少有 sku + name。测试会注入 PRODUCTS（全量 10 件），
 * 也会注入更短的子集——不要在函数里读隐藏全局，用参数 products。
 *
 * 禁止：setTimeout、fetch、真网络。本页测试 4 秒超时，Promise 必须立刻 settle。
 *
 * 全绿 = 你掌握了 Ch06。
 */

type CatalogItem = {
  sku: string;
  name: string;
};`;

const functions = [
  {
    name: "delayValue",
    testSuite: "delayValue",
    skeleton: `/**
 * 【场景】详情页骨架：先有一个「马上能拿到的值」，用 Promise 包起来，
 * 好和后面真的异步加载走同一套 await。
 *
 * 【转换点】包装 Promise。Java 的 CompletableFuture.completedFuture(x)；
 * Python asyncio 里 async def 里 return x 也会变成可 await 的东西。
 * TS 用 Promise.resolve(value)，或 async 函数直接 return value。
 *
 * 任务：返回一个立刻 fulfilled、值为 value 的 Promise。不要 setTimeout。
 * 示例：
 *   await delayValue(42)           -> 42
 *   await delayValue("机械键盘")    -> "机械键盘"
 *   await delayValue(0)            -> 0
 *   delayValue(1) 本身是 Promise（还没 await 就 instanceof Promise）
 *
 * 提示：return Promise.resolve(value);
 *       或 export async function delayValue<T>(value: T) { return value; }
 */
export function delayValue<T>(value: T): Promise<T> {
  throw new Error("TODO");
}`,
  },
  {
    name: "loadProductAsync",
    testSuite: "loadProductAsync",
    skeleton: `/**
 * 【场景】商品详情：按 SKU 从【传入的】目录里找一件。找到返回 { sku, name }，
 * 找不到返回 null（不要抛）。这是「软失败」——缺货页还能展示「未找到」。
 *
 * 【转换点】async/await。函数标了 async，返回值永远是 Promise。
 * 就算你同步 find 完直接 return，调用方也要 await。
 * 对标 Python async def、Java CompletableFuture.supplyAsync（但本题立刻完成）。
 *
 * 任务：在 products 里找 sku 相等的项；找到返回该对象（或 { sku, name }），
 * 否则 null。空目录、没有这个 SKU，都是 null。
 * 示例：
 *   await loadProductAsync("KB-001", PRODUCTS)  -> 机械键盘（sku KB-001）
 *   await loadProductAsync("MS-002", PRODUCTS)  -> 无线鼠标
 *   await loadProductAsync("NOPE", PRODUCTS)    -> null
 *   await loadProductAsync("KB-001", [])        -> null
 *
 * 提示：products.find(p => p.sku === sku) ?? null
 *       不要写死 "机械键盘"；不要忽略 products 参数去读全局。
 */
export async function loadProductAsync(
  sku: string,
  products: CatalogItem[],
): Promise<CatalogItem | null> {
  throw new Error("TODO");
}`,
  },
  {
    name: "loadOrThrow",
    testSuite: "loadOrThrow",
    skeleton: `/**
 * 【场景】下单前必须拿到商品：SKU 不存在就失败，不能悄悄 null。
 * 这是「硬失败」——后面 allSettled 靠它统计失败次数。
 *
 * 【转换点】async 函数里 throw = 返回 rejected Promise。
 * 调用 loadOrThrow(...) 这一行本身不抛；await 的时候才进 catch。
 * Java 方法 throws 会在调用点编译期逼你处理；TS 的 async 不会。
 *
 * 任务：找到就返回该对象；找不到 throw new Error("NOT_FOUND:" + sku)。
 * 示例：
 *   await loadOrThrow("KB-001", PRODUCTS)  -> 机械键盘
 *   await loadOrThrow("BK-005", PRODUCTS)  -> 设计模式
 *   await loadOrThrow("NOPE", PRODUCTS)    -> 拒绝，message 是 "NOT_FOUND:NOPE"
 *
 * 提示：找不到就 throw，不要 return。测试用 try/await/catch 接，没有 .toThrow。
 */
export async function loadOrThrow(
  sku: string,
  products: CatalogItem[],
): Promise<CatalogItem> {
  throw new Error("TODO");
}`,
  },
  {
    name: "readErrorMessage",
    testSuite: "readErrorMessage",
    skeleton: `/**
 * 【场景】catch 到错误以后要展示给客服：有的是 Error，有的上游直接 reject 了字符串，
 * 有的是奇怪对象。strict 下 catch (e) 的 e 是 unknown（Ch03 收窄）。
 *
 * 【转换点】unknown narrowing。Java catch (Exception e) 已经有类型；
 * Python except Exception as e 也有。TS 必须先 instanceof / typeof 再碰字段。
 *
 * 任务（同步函数，不是 async）：
 *   err 是 Error      -> err.message
 *   err 是 string     -> 原样返回
 *   其它（null、普通对象…） -> "unknown"
 * 示例：
 *   readErrorMessage(new Error("NOT_FOUND:NOPE"))  -> "NOT_FOUND:NOPE"
 *   readErrorMessage("boom")                       -> "boom"
 *   readErrorMessage(null)                         -> "unknown"
 *   readErrorMessage({ msg: "x" })                 -> "unknown"
 *
 * 提示：if (err instanceof Error) return err.message;
 *       if (typeof err === "string") return err;
 *       return "unknown";
 */
export function readErrorMessage(err: unknown): string {
  throw new Error("TODO");
}`,
  },
  {
    name: "loadMany",
    testSuite: "loadMany",
    skeleton: `/**
 * 【场景】一次拉多个详情：对比页、购物车回填。缺的那件用 null 占位，不要整批失败。
 * 复用 loadProductAsync。顺序必须和 skus 一致。
 *
 * 【转换点】Promise.all。对标 Java CompletableFuture.allOf、Python asyncio.gather。
 * all 会「按数组下标」对齐结果。空数组 → []。
 *
 * 任务：Promise.all(skus.map(sku => loadProductAsync(sku, products)))
 * 示例：
 *   await loadMany(["KB-001", "MS-002"], PRODUCTS)
 *     -> 第一件机械键盘、第二件无线鼠标
 *   await loadMany(["MS-002", "KB-001"], PRODUCTS)
 *     -> 顺序跟着 skus，先鼠标后键盘（不要按目录顺序排）
 *   await loadMany(["KB-001", "NOPE"], PRODUCTS)
 *     -> [商品, null]
 *   await loadMany([], PRODUCTS)  -> []
 *
 * 提示：不要 for + await 串行也行（本题立刻完成，测不出来快慢），但请写 Promise.all。
 */
export async function loadMany(
  skus: string[],
  products: CatalogItem[],
): Promise<Array<CatalogItem | null>> {
  throw new Error("TODO");
}`,
  },
  {
    name: "loadManySettled",
    testSuite: "loadManySettled",
    skeleton: `/**
 * 【场景】运营批量核对 SKU：有的存在、有的填错。要一份摘要——成功几件、失败几件，
 * 而不是第一件失败就把整批打掉。复用 loadOrThrow。
 *
 * 【转换点】Promise.allSettled。all 遇到第一个 reject 就整笔失败；
 * allSettled 等全部结束，每项是 { status: "fulfilled", value } 或
 * { status: "rejected", reason }——这是 Ch03 的判别联合。
 *
 * 任务：对每个 sku 调 loadOrThrow，allSettled 之后数 fulfilled / rejected。
 * 空数组 → { ok: 0, failed: 0 }。
 * 示例：
 *   await loadManySettled(["KB-001", "NOPE"], PRODUCTS)     -> { ok: 1, failed: 1 }
 *   await loadManySettled(["KB-001", "MS-002"], PRODUCTS)   -> { ok: 2, failed: 0 }
 *   await loadManySettled(["NOPE", "XX"], PRODUCTS)         -> { ok: 0, failed: 2 }
 *   await loadManySettled([], PRODUCTS)                     -> { ok: 0, failed: 0 }
 *
 * 提示：不要用 loadProductAsync（缺货是 null，allSettled 会全算 fulfilled）。
 *       if (r.status === "fulfilled") ok++; else failed++;
 */
export async function loadManySettled(
  skus: string[],
  products: CatalogItem[],
): Promise<{ ok: number; failed: number }> {
  throw new Error("TODO");
}`,
  },
  {
    name: "retryOnce",
    testSuite: "retryOnce",
    skeleton: `/**
 * 【场景】偶发失败再试一次：第一次目录服务抖了一下，第二次就好。
 * 只再试一次，不要死循环。第二次还失败，把第二次的错误原样抛出去。
 *
 * 【转换点】失败再试一次。fn: () => Promise<T> 是 Ch05 的函数类型。
 * 第一次成功就不要调第二次。对标「catch 住再 await fn()」。
 *
 * 任务：await fn()；若 reject，再 await fn() 一次；第二次失败则拒绝。
 * 示例：
 *   闭包第一次 reject、第二次 resolve("机械键盘")  -> "机械键盘"（fn 被调 2 次）
 *   始终 resolve(42)                              -> 42（fn 只调 1 次）
 *   始终 reject(new Error("DOWN"))                -> catch 到 message "DOWN"（fn 调 2 次）
 *
 * 提示：
 *   try { return await fn(); } catch { return await fn(); }
 *   不要 setTimeout 做间隔；本题立刻 settle。
 */
export async function retryOnce<T>(fn: () => Promise<T>): Promise<T> {
  throw new Error("TODO");
}`,
  },
];

const assignment = `${preamble}

${functions.map((f) => f.skeleton).join("\n\n")}
`;

const testSource = `describe("delayValue", () => {
  it("数字 42", async () => {
    expect(await delayValue(42)).toBe(42);
  });
  it("字符串", async () => {
    expect(await delayValue("机械键盘")).toBe("机械键盘");
  });
  it("另一条字符串，拦住写死机械键盘", async () => {
    expect(await delayValue("无线鼠标")).toBe("无线鼠标");
  });
  it("0 也要原样（专治 if (!value)）", async () => {
    expect(await delayValue(0)).toBe(0);
  });
  it("空串也要原样", async () => {
    expect(await delayValue("")).toBe("");
  });
  it("返回值是 Promise（还没 await）", () => {
    expect(delayValue(1)).toBeInstanceOf(Promise);
  });
});

describe("loadProductAsync", () => {
  it("KB-001 是机械键盘", async () => {
    const p = await loadProductAsync("KB-001", PRODUCTS);
    expect(p === null).toBe(false);
    expect(p.sku).toBe("KB-001");
    expect(p.name).toBe("机械键盘");
  });
  it("MS-002 是无线鼠标（专治写死机械键盘）", async () => {
    const p = await loadProductAsync("MS-002", PRODUCTS);
    expect(p === null).toBe(false);
    expect(p.sku).toBe("MS-002");
    expect(p.name).toBe("无线鼠标");
  });
  it("BK-005 是设计模式", async () => {
    const p = await loadProductAsync("BK-005", PRODUCTS);
    expect(p === null).toBe(false);
    expect(p.name).toBe("设计模式");
  });
  it("不存在返回 null，不抛", async () => {
    expect(await loadProductAsync("NOPE", PRODUCTS)).toBeNull();
  });
  it("空目录返回 null", async () => {
    expect(await loadProductAsync("KB-001", [])).toBeNull();
  });
  it("只在传入的目录里找（专治读隐藏全局）", async () => {
    const catalog = [{ sku: "XX-1", name: "演示商品" }];
    const hit = await loadProductAsync("XX-1", catalog);
    expect(hit === null).toBe(false);
    expect(hit.name).toBe("演示商品");
    expect(await loadProductAsync("KB-001", catalog)).toBeNull();
  });
  it("库存为 0 的 CP-009 仍然算找到", async () => {
    const p = await loadProductAsync("CP-009", PRODUCTS);
    expect(p === null).toBe(false);
    expect(p.name).toBe("智能水杯");
  });
});

describe("loadOrThrow", () => {
  it("KB-001 成功", async () => {
    const p = await loadOrThrow("KB-001", PRODUCTS);
    expect(p.sku).toBe("KB-001");
    expect(p.name).toBe("机械键盘");
  });
  it("BK-005 成功（专治写死机械键盘）", async () => {
    const p = await loadOrThrow("BK-005", PRODUCTS);
    expect(p.name).toBe("设计模式");
  });
  it("missing throws NOT_FOUND:NOPE", async () => {
    let msg = "";
    try {
      await loadOrThrow("NOPE", PRODUCTS);
    } catch (e) {
      msg = e instanceof Error ? e.message : "";
    }
    expect(msg).toBe("NOT_FOUND:NOPE");
  });
  it("另一条缺失 sku，拦住写死 NOPE", async () => {
    let msg = "";
    try {
      await loadOrThrow("XX-999", PRODUCTS);
    } catch (e) {
      msg = e instanceof Error ? e.message : "";
    }
    expect(msg).toBe("NOT_FOUND:XX-999");
  });
  it("空目录也会抛，带上 sku", async () => {
    let msg = "";
    try {
      await loadOrThrow("KB-001", []);
    } catch (e) {
      msg = e instanceof Error ? e.message : "";
    }
    expect(msg).toBe("NOT_FOUND:KB-001");
  });
  it("抛出的是 Error 实例", async () => {
    let err: unknown = null;
    try {
      await loadOrThrow("NOPE", PRODUCTS);
    } catch (e) {
      err = e;
    }
    expect(err).toBeInstanceOf(Error);
  });
});

describe("readErrorMessage", () => {
  it("Error 取 message", () => {
    expect(readErrorMessage(new Error("NOT_FOUND:NOPE"))).toBe("NOT_FOUND:NOPE");
  });
  it("另一条 Error，拦住写死 NOT_FOUND", () => {
    expect(readErrorMessage(new Error("DOWN"))).toBe("DOWN");
  });
  it("字符串原样返回", () => {
    expect(readErrorMessage("boom")).toBe("boom");
  });
  it("另一条字符串", () => {
    expect(readErrorMessage("timeout")).toBe("timeout");
  });
  it("null 是 unknown", () => {
    expect(readErrorMessage(null)).toBe("unknown");
  });
  it("普通对象是 unknown", () => {
    expect(readErrorMessage({ msg: "x" })).toBe("unknown");
  });
});

describe("loadMany", () => {
  it("两件存在，顺序与 skus 一致", async () => {
    const rows = await loadMany(["KB-001", "MS-002"], PRODUCTS);
    expect(rows.length).toBe(2);
    expect(rows[0] === null).toBe(false);
    expect(rows[1] === null).toBe(false);
    expect(rows[0].name).toBe("机械键盘");
    expect(rows[1].name).toBe("无线鼠标");
  });
  it("反过来先鼠标后键盘（专治按目录排序）", async () => {
    const rows = await loadMany(["MS-002", "KB-001"], PRODUCTS);
    expect(rows[0].name).toBe("无线鼠标");
    expect(rows[1].name).toBe("机械键盘");
  });
  it("存在 + 缺失：null 占位", async () => {
    const rows = await loadMany(["KB-001", "NOPE"], PRODUCTS);
    expect(rows.length).toBe(2);
    expect(rows[0].name).toBe("机械键盘");
    expect(rows[1]).toBeNull();
  });
  it("空数组返回 []", async () => {
    expect(await loadMany([], PRODUCTS)).toEqual([]);
  });
  it("全缺失全是 null", async () => {
    const rows = await loadMany(["NOPE", "XX"], PRODUCTS);
    expect(rows.length).toBe(2);
    expect(rows[0]).toBeNull();
    expect(rows[1]).toBeNull();
  });
  it("只在传入目录里找", async () => {
    const catalog = [{ sku: "AA-1", name: "演示A" }, { sku: "BB-2", name: "演示B" }];
    const rows = await loadMany(["BB-2", "KB-001", "AA-1"], catalog);
    expect(rows[0].name).toBe("演示B");
    expect(rows[1]).toBeNull();
    expect(rows[2].name).toBe("演示A");
  });
});

describe("loadManySettled", () => {
  it("一成一败", async () => {
    expect(await loadManySettled(["KB-001", "NOPE"], PRODUCTS)).toEqual({
      ok: 1,
      failed: 1,
    });
  });
  it("两成两败（专治写死 1/1）", async () => {
    expect(
      await loadManySettled(["KB-001", "NOPE", "MS-002", "XX"], PRODUCTS),
    ).toEqual({ ok: 2, failed: 2 });
  });
  it("全部成功", async () => {
    expect(await loadManySettled(["KB-001", "MS-002"], PRODUCTS)).toEqual({
      ok: 2,
      failed: 0,
    });
  });
  it("全部失败", async () => {
    expect(await loadManySettled(["NOPE", "XX"], PRODUCTS)).toEqual({
      ok: 0,
      failed: 2,
    });
  });
  it("空数组计数为 0", async () => {
    expect(await loadManySettled([], PRODUCTS)).toEqual({ ok: 0, failed: 0 });
  });
  it("三件全在（含库存 0 的水杯）", async () => {
    expect(
      await loadManySettled(["KB-001", "CP-009", "BK-005"], PRODUCTS),
    ).toEqual({ ok: 3, failed: 0 });
  });
});

describe("retryOnce", () => {
  it("第一次失败第二次成功", async () => {
    let n = 0;
    const fn = () => {
      n++;
      if (n === 1) return Promise.reject(new Error("temp"));
      return Promise.resolve("机械键盘");
    };
    expect(await retryOnce(fn)).toBe("机械键盘");
    expect(n).toBe(2);
  });
  it("另一条成功值，拦住写死机械键盘", async () => {
    let n = 0;
    const fn = () => {
      n++;
      if (n === 1) return Promise.reject(new Error("temp"));
      return Promise.resolve(42);
    };
    expect(await retryOnce(fn)).toBe(42);
    expect(n).toBe(2);
  });
  it("第一次就成功，不重试", async () => {
    let n = 0;
    const fn = () => {
      n++;
      return Promise.resolve("无线鼠标");
    };
    expect(await retryOnce(fn)).toBe("无线鼠标");
    expect(n).toBe(1);
  });
  it("两次都失败，抛第二次的错误", async () => {
    let n = 0;
    let msg = "";
    const fn = () => {
      n++;
      return Promise.reject(new Error(n === 1 ? "FIRST" : "SECOND"));
    };
    try {
      await retryOnce(fn);
    } catch (e) {
      msg = e instanceof Error ? e.message : "";
    }
    expect(msg).toBe("SECOND");
    expect(n).toBe(2);
  });
  it("始终失败，message 原样（专治写死 SECOND）", async () => {
    let n = 0;
    let msg = "";
    const fn = () => {
      n++;
      return Promise.reject(new Error("DOWN"));
    };
    try {
      await retryOnce(fn);
    } catch (e) {
      msg = e instanceof Error ? e.message : "";
    }
    expect(msg).toBe("DOWN");
    expect(n).toBe(2);
  });
});
`;

const reviewMd = `# Ch06 · 记忆闪卡

> 先回忆，再翻答案。连续 2 次秒答 → 退役。

## 🔖 闪卡

| # | 正面（问题） | 背面（答案） | 掌握 |
|---|---|---|---|
| 1 | Promise 三个状态是什么？能从 fulfilled 回到 pending 吗？ | pending / fulfilled / rejected。终态不可逆，不能回去 | ⬜ |
| 2 | \`Promise.resolve(42)\` 对标 Java 的哪一句？作业为什么不许 \`setTimeout\`？ | \`CompletableFuture.completedFuture(42)\`。本页测试 4 秒超时，必须立刻 settle | ⬜ |
| 3 | \`async function f() { return 1; }\` 的返回类型是什么？调用 \`f()\` 立刻拿到 1 吗？ | 返回类型是 \`Promise<number>\`。\`f()\` 拿到的是 Promise，要 \`await\` 才是 1 | ⬜ |
| 4 | async 函数里 \`throw new Error("x")\`，调用方不 await 会怎样？ | 得到一个 rejected Promise，调用那一行不抛。没人接就变成 unhandled rejection | ⬜ |
| 5 | 为什么 \`loadOrThrow("NOPE")\` 不能用 Jest 那种 \`.toThrow\` 直接套在调用上？ | 调用本身返回 Promise，同步不抛。要 \`try { await loadOrThrow(...) } catch (e) { ... }\` | ⬜ |
| 6 | strict 下 \`catch (e)\` 的 e 是什么类型？能直接 \`.message\` 吗？ | \`unknown\`（Ch03）。必须 \`instanceof Error\` 或 \`typeof === "string"\` 再碰 | ⬜ |
| 7 | \`readErrorMessage(null)\` 和 \`readErrorMessage({ msg: "x" })\` 为什么都是 \`"unknown"\`？ | 不是 Error、也不是 string。乱对象没有约定字段，统一兜底 | ⬜ |
| 8 | \`Promise.all\` 里有一个 reject，其余的结果还在吗？ | 整笔失败（fail-fast），其它值拿不到。要摘要用 \`allSettled\` | ⬜ |
| 9 | \`Promise.all\` 的结果顺序按什么排？ | 按下标，和传入的 Promise 数组一致，不是完成时间 | ⬜ |
| 10 | \`allSettled\` 每一项靠哪个字段分成两支？运行时还在吗？ | \`status: "fulfilled" \\| "rejected"\`。这是值，不会蒸发（Ch03 判别联合） | ⬜ |
| 11 | 为什么 \`loadManySettled\` 必须调 \`loadOrThrow\` 而不是 \`loadProductAsync\`？ | 后者缺货返回 null，算 fulfilled。要统计失败必须是 rejected Promise | ⬜ |
| 12 | Python \`asyncio.gather\`、Java \`allOf\` 分别像 TS 的哪两个？ | gather ≈ \`Promise.all\`（一个失败整批挂）；allOf 等全部完成但不带各结果，更像「等齐」 | ⬜ |
| 13 | \`retryOnce\` 第一次成功会不会调第二次？两次都失败抛哪次的错？ | 成功不重试。两次失败抛**第二次**的 reason | ⬜ |
| 14 | \`loadProductAsync\` 的返回类型在运行时还保护 JSON 吗？下一章为什么是 zod？ | 不保护。类型蒸发，真接口给的是普通 JS 对象。边界数据要用运行时校验 | ⬜ |

## 🎓 费曼自检

- [ ] 能说清 async 函数永远返回 Promise，throw 变成 reject，要 await 才进 catch
- [ ] 能说清 catch (e) 是 unknown，必须按 Ch03 收窄
- [ ] 能说清 Promise.all 和 allSettled 差在「一挂全挂」还是「等齐再数」
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
    `> **预计**：1 天 ｜ **前置**：Ch05
> **目标**：① 会写 async 函数；② \`catch\` 的 err 是 \`unknown\`；③ 会用 \`Promise.all\` / \`allSettled\`。
> 你 15 年 Java，Python 课也在前面。异步本身不新鲜——真正要小心的是：**async 永远返回 Promise；throw 变成 reject；catch 的 e 是 unknown；类型蒸发挡不住假 JSON。**

> 📐 **本教程的契约**：下面每一节（§6.1–§6.7）都**精确对应**作业里的题。讲过的才考，考的必讲过。卡住时按作业函数名回查对应小节。
> 禁止真网络、禁止 \`fetch\`、禁止用 \`setTimeout\` 做作业。用立刻 settle 的 mock Promise。

---`,
    [],
  ),
  sec(
    "sec-map",
    "🗺️ 本章地图",
    null,
    `本章作业是一条完整主线：**并行拉多个商品详情（内存 mock）**。7 个函数，从「把值包成 Promise」走到「失败再试一次」。

读完这章 + 完成作业，你将能够：

- 说出 Promise 三态，并用 \`Promise.resolve\` 包一个立刻完成的值
- 写出 \`async function\`，知道它**永远**返回 Promise
- 在 async 里 \`throw\`，用 \`try/await/catch\` 接到拒绝
- 把 \`catch (e)\` 的 \`unknown\` 收窄成 Error 或 string（接 Ch03）
- 用 \`Promise.all\` 按 SKU 列表对齐结果；用 \`allSettled\` 数成功/失败
- 对照 Java \`CompletableFuture\`、Python \`asyncio\`
- 给「偶发失败」写只重试一次的包装

**作业 ↔ 教程对应表**（学哪节，就去做哪题）：

| 作业题 | 对应小节 | 核心知识点 |
|--------|----------|-----------|
| \`delayValue\` | §6.1 | 包装 Promise |
| \`loadProductAsync\` | §6.2 | async/await |
| \`loadOrThrow\` | §6.3 | 抛错（throw → reject） |
| \`readErrorMessage\` | §6.4 | \`unknown\` narrowing |
| \`loadMany\` | §6.5 | \`Promise.all\` |
| \`loadManySettled\` | §6.6 | \`allSettled\` 摘要 |
| \`retryOnce\` | §6.7 | 失败再试一次 |

---`,
    [],
  ),
  sec(
    "sec-path",
    "⏱️ 学习路径：费曼五步（约 60–90 分钟）",
    null,
    `| 步 | 你要做 | 在哪做 |
|----|--------|--------|
| ① 预览猜（2 分钟） | 看下面的差异，先猜 TS 怎么实现 | 本页 ① |
| ② 先动手 | 每节后面的编辑器里**先试着写** | 本节练习 |
| ③ 提取+反馈 | 点「运行测试」看红绿 | 本节练习 |
| ④ 费曼（2 分钟） | 大白话讲清「async 为什么不在调用那一行抛」 | 本页 ④ |
| ⑤ 存闪卡 | 章末闪卡标复习日期 | 闪卡 |

> 💡 别从头读到尾。先扫 ① → 写作业 → **哪题卡了，回对应 § 查** → 改 → 再跑。
> 后面的题会调用你前面写过的函数（\`loadMany\` 调 \`loadProductAsync\`，\`loadManySettled\` 调 \`loadOrThrow\`），所以建议按顺序做。

---`,
    [],
  ),
  sec(
    "sec-guess",
    "① 预览猜（2 分钟 · 激活你的 Java / Python 直觉）",
    null,
    `先别看答案，凭经验猜一猜（猜错没关系）：

1. Java 里 \`CompletableFuture.completedFuture(42)\` 立刻有值。TS 怎么写一个「已经完成、值为 42」的 Promise？用 \`setTimeout(fn, 0)\` 可以吗？作业为什么不行？
2. \`async function f() { return "机械键盘"; }\` 调用 \`f()\` 拿到的是字符串还是 Promise？
3. async 函数里 \`throw new Error("NOT_FOUND:NOPE")\`。调用 \`loadOrThrow("NOPE")\` **不写 await**，会不会进 catch？
4. Python \`except Exception as e:\` 能 \`e.args\`。TS 写 \`catch (e) { console.log(e.message) }\`，strict 下编辑器红不红？
5. 一次查 \`["MS-002", "KB-001"]\`，\`Promise.all\` 回来的数组谁在前？
6. 四个 SKU 里两个不存在。用 \`Promise.all\` + \`loadOrThrow\` 会怎样？想数「成功几件失败几件」该换哪个 API？

> 猜完，带着验证心态进入正文。

---`,
    [],
  ),
  sec(
    "sec-contrast",
    "对照地图：Promise / Future / 协程 🟡",
    null,
    `异步不是 TS 发明的。你已经在 Java 里用过 Future，在 Python 课里用过 asyncio。差别在：**TS 的 Promise 是一等值；async/await 只是它的语法糖；类型在运行时蒸发。**

| 概念 | Java | Python | TypeScript |
|---|---|---|---|
| 立刻成功 | \`CompletableFuture.completedFuture(x)\` | \`async def\` 里 \`return x\` | **\`Promise.resolve(x)\`** |
| 立刻失败 | \`failedFuture(e)\` | \`raise\` 在 coroutine 里 | **\`Promise.reject(e)\`** |
| 等结果 | \`join()\` / \`get()\`（会阻塞线程） | \`await\` | **\`await\`（不阻塞线程，让出 Event Loop）** |
| 并行 | \`allOf\` | \`asyncio.gather\` | **\`Promise.all\`** |
| 等齐不短路 | 自己 \`handle\` 每个 future | \`return_exceptions=True\` | **\`Promise.allSettled\`** |
| catch 变量 | \`catch (Exception e)\` 有类型 | \`except Exception as e\` | **\`unknown\`，要收窄** 🔴 |

> 🟢 **和 Python 课的衔接**：\`async def\` / \`await\` 几乎原样搬过来。
> 🟡 **和 Java 的衔接**：\`CompletableFuture\` 像 Promise，但 Java 的 \`join()\` **阻塞线程**；浏览器/Node 的 \`await\` **不占线程**，把后续函数登记成微任务（细节 Ch08）。
> 🔴 **catch 是 unknown**：这是 TS 比 Java 别扭的地方，也是 Ch03 收窄的实战。

### Promise 三态 🟡

\`\`\`ts
// pending    进行中
// fulfilled  成功，带着一个值
// rejected   失败，带着一个 reason
\`\`\`

终态不可逆。fulfilled 了不会再变成 rejected。作业里所有 Promise **立刻**进入终态——因为我们用的是内存目录，不是网。

### 本课怎么算「会了」

编辑器红线 ≈ 你有没有给 \`catch (e)\` 收窄、有没有漏 \`await\`。点「运行测试」≈ 值对不对、缺 SKU 是 null 还是抛、并行顺序对不对。**测试全绿 = 这题掌握。**

---`,
    [],
  ),
  sec(
    "sec-6.1",
    "§6.1 包装 Promise（对应：`delayValue`）🟡",
    "6.1",
    `详情页先把「已经在手里的值」也统一成 Promise，后面真异步、假异步才能一套 \`await\`。

### Java 对照：completedFuture

\`\`\`java
CompletableFuture<Integer> f = CompletableFuture.completedFuture(42);
f.join();   // 42，当前线程等它（已经完成则立刻返回）
\`\`\`

### Python：async 里直接 return

\`\`\`python
async def delay_value(value):
    return value

await delay_value(42)          # 42
await delay_value("机械键盘")   # "机械键盘"
\`\`\`

### TypeScript：Promise.resolve 🟡

\`\`\`ts
function delayValue<T>(value: T): Promise<T> {
  return Promise.resolve(value);
}

await delayValue(42);            // 42
await delayValue("机械键盘");     // "机械键盘"
await delayValue(0);             // 0
delayValue(1) instanceof Promise; // true —— 还没 await 也是 Promise
\`\`\`

\`async function delayValue<T>(value: T) { return value; }\` **等价**：async 会把 return 包成 fulfilled Promise。两种写法测试都认。

### 真延迟 vs 作业延迟 🔴

生产里「等 300ms」是：

\`\`\`ts
// 真实延迟（本章作业禁止）
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
\`\`\`

本页测试 **4 秒超时**。\`setTimeout\` / \`fetch\` / 真网络都会红或挂起。作业必须立刻 settle：\`Promise.resolve\` 或 \`async return\`。

### ❌ / ✅

\`\`\`ts
// ❌ 同步返回值——调用方 await 到的不是你想的包装
function delayValue<T>(value: T) { return value; }

// ❌ 真的去等（测试超时）
return new Promise((r) => setTimeout(() => r(value), 300));

// ✅
return Promise.resolve(value);
\`\`\`

> 🤯 **转换点**：Promise 是对象，不是「以后会变成 T 的魔法」。\`await\` 是「等到终态，把值拆出来」。
> 真实场景：运营配置里已经写好的默认标题，也先 \`delayValue(title)\`，和好走网络的详情同一套 \`await\`。
>
> ✅ **做 \`delayValue\`**：一行 \`return Promise.resolve(value);\`

---`,
    ["delayValue"],
  ),
  sec(
    "sec-6.2",
    "§6.2 async/await（对应：`loadProductAsync`）🔴",
    "6.2",
    `按 SKU 从**传入的目录**找商品。找到返回对象，找不到 \`null\`。没有网——\`find\` 是同步的，但函数仍标 \`async\`，好和真接口同一套调用方式。

### Java 对照：supplyAsync / completedFuture

\`\`\`java
CompletableFuture<Product> load(String sku, List<Product> products) {
    return CompletableFuture.supplyAsync(() ->
        products.stream().filter(p -> p.sku.equals(sku)).findFirst().orElse(null)
    );
}
\`\`\`

Java 这条往往会占公共线程池。本题我们**立刻**完成，更接近 \`completedFuture\`。

### Python：async def + 线性查找

\`\`\`python
async def load_product_async(sku: str, products: list[dict]) -> dict | None:
    for p in products:
        if p["sku"] == sku:
            return p
    return None

await load_product_async("KB-001", PRODUCTS)  # 机械键盘
await load_product_async("NOPE", PRODUCTS)    # None
\`\`\`

### TypeScript：async 永远返回 Promise 🔴

\`\`\`ts
async function loadProductAsync(
  sku: string,
  products: CatalogItem[],
): Promise<CatalogItem | null> {
  const found = products.find((p) => p.sku === sku);
  return found ?? null;
}

await loadProductAsync("KB-001", PRODUCTS);  // { sku: "KB-001", name: "机械键盘", ... }
await loadProductAsync("MS-002", PRODUCTS);  // 无线鼠标
await loadProductAsync("NOPE", PRODUCTS);    // null
await loadProductAsync("KB-001", []);        // null —— 看参数，不是全局
\`\`\`

\`async\` 有两件事必须刻在手上：

1. **返回值永远是 Promise**。你 \`return null\`，调用方拿到 \`Promise<null>\`。
2. **调用方必须 await（或 \`.then\`）**。写 \`const p = loadProductAsync(...)\` 而不 await，\`p\` 是 Promise，不是商品。

\`CP-009\` 智能水杯库存是 0，**仍然算找到**。缺货不是「目录里没有」；「没有」才返回 null。Ch03 的 \`out / missing\` 别混进来。

### 目录从参数进来 🟡

测试会传 \`PRODUCTS\`，也会传只有 \`"XX-1"\` 的小数组。函数里不要自己去读一个隐藏的全局 catalog——**用 \`products\` 参数**。这和 Java 方法入参、Python 函数入参是同一纪律。

### ❌ / ✅

\`\`\`ts
// ❌ 写成同步函数还不返回 Promise——delayValue 那题已经拦过
// ❌ 找不到 throw——本题是软失败，返回 null
// ❌ 写死 return { sku: "KB-001", name: "机械键盘" }
// ❌ 忽略 products，去读全局 PRODUCTS

// ✅ find + ?? null
const found = products.find((p) => p.sku === sku);
return found ?? null;
\`\`\`

你可以 \`return await delayValue(found ?? null)\`，把 §6.1 串起来。测试认。

> ✅ **做 \`loadProductAsync\`**：\`find\` + \`?? null\`。async 关键字已经帮你包成 Promise。

---`,
    ["loadProductAsync"],
  ),
  sec(
    "sec-6.3",
    "§6.3 抛错：throw → reject（对应：`loadOrThrow`）🔴",
    "6.3",
    `下单前必须拿到商品。SKU 不在目录里就失败，不能悄悄 \`null\`。后面 \`loadManySettled\` 靠「拒绝」来数失败次数。

### Java 对照：异常在调用点

\`\`\`java
Product loadOrThrow(String sku, List<Product> products) {
    return products.stream()
        .filter(p -> p.sku.equals(sku))
        .findFirst()
        .orElseThrow(() -> new NoSuchElementException("NOT_FOUND:" + sku));
}
// 调用这行就会抛（除非你再包进 CompletableFuture）
\`\`\`

### Python：raise

\`\`\`python
async def load_or_throw(sku, products):
    for p in products:
        if p["sku"] == sku:
            return p
    raise KeyError(f"NOT_FOUND:{sku}")
\`\`\`

### TypeScript：async 里 throw = rejected Promise 🔴

\`\`\`ts
async function loadOrThrow(
  sku: string,
  products: CatalogItem[],
): Promise<CatalogItem> {
  const found = products.find((p) => p.sku === sku);
  if (!found) throw new Error("NOT_FOUND:" + sku);
  return found;
}
\`\`\`

这是整章最容易从 Java 抄错的一点：

\`\`\`ts
const p = loadOrThrow("NOPE", PRODUCTS);  // 这一行不抛！p 是 rejected Promise
try {
  await p;                                 // 这里才进 catch
} catch (e) {
  // e 是 unknown，见 §6.4
}
\`\`\`

message 必须是 \`"NOT_FOUND:" + sku\`。\`NOPE\` → \`"NOT_FOUND:NOPE"\`；\`XX-999\` → \`"NOT_FOUND:XX-999"\`。空目录找 \`KB-001\` 也是 \`"NOT_FOUND:KB-001"\`——没找到就是没找到。

本页小测试器**没有** \`.toThrow\`。测试这样写，你作业里排查也可以照抄：

\`\`\`ts
it("missing throws", async () => {
  let msg = "";
  try {
    await loadOrThrow("NOPE", PRODUCTS);
  } catch (e) {
    msg = e instanceof Error ? e.message : "";
  }
  expect(msg).toBe("NOT_FOUND:NOPE");
});
\`\`\`

### ❌ / ✅

\`\`\`ts
// ❌ return null —— 和 §6.2 搞混，后面 allSettled 会计成成功
// ❌ throw "NOT_FOUND:NOPE" 字符串——能 reject，但不是 Error，§6.4 要能区分
// ❌ throw new Error("not found") —— 测的是精确前缀
// ❌ 调用方不 await，以为 try/catch 能接到

// ✅
if (!found) throw new Error("NOT_FOUND:" + sku);
return found;
\`\`\`

> 真实场景：结算接口「这 SKU 必须存在」。详情页展示可以用 §6.2 的 null；下单通道用本节的 throw。
>
> ✅ **做 \`loadOrThrow\`**：找不到 \`throw new Error("NOT_FOUND:" + sku)\`。

---`,
    ["loadOrThrow"],
  ),
  sec(
    "sec-6.4",
    "§6.4 `unknown` 收窄（对应：`readErrorMessage`）🔴",
    "6.4",
    `这题是**同步**的，却是本章最重要的类型课。它把 Ch03 的 narrowing 接到真实的 \`catch\`。

strict 模式（本课默认）下：

\`\`\`ts
try {
  await loadOrThrow("NOPE", PRODUCTS);
} catch (e) {
  // e: unknown     ← 不是 any，不是 Error
  e.message;        // ❌ 红线
}
\`\`\`

### 为什么是 unknown 🔴

谁都能 reject：\`Error\`、字符串、\`null\`、\`{ msg: "x" }\`、甚至 \`undefined\`。TS 不肯假装它一定是 \`Error\`。Java 的 \`catch (Exception e)\` 已经把类型收成 Exception；Python 的 \`except Exception as e\` 也是。TS 要你**自己收窄**。

### Java / Python 对照

\`\`\`java
catch (Exception e) {
    return e.getMessage();
}
\`\`\`

\`\`\`python
except Exception as e:
    return str(e)
except Exception:
    ...
# 别人 raise "boom" 在 Python 3 里根本不是合法异常
\`\`\`

### TypeScript：instanceof + typeof 🔴

\`\`\`ts
function readErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (typeof err === "string") return err;
  return "unknown";
}

readErrorMessage(new Error("NOT_FOUND:NOPE")); // "NOT_FOUND:NOPE"
readErrorMessage(new Error("DOWN"));           // "DOWN"
readErrorMessage("boom");                      // "boom"
readErrorMessage(null);                        // "unknown"
readErrorMessage({ msg: "x" });                // "unknown"
\`\`\`

这就是 Ch03 的三件套：

| 联合 | 收窄 | 本题 |
|---|---|---|
| 类实例 | \`instanceof Error\` | 走 \`.message\` |
| \`string \\| …\` | \`typeof err === "string"\` | 原样返回 |
| 其它 | 剩下的 | 兜底 \`"unknown"\` |

\`{ msg: "x" }\` **不是** Error。不要写 \`err.msg\`，也不要 \`as any\`。

### ❌ / ✅

\`\`\`ts
// ❌ 直接 e.message —— unknown 上没有 message
// ❌ (e as Error).message —— null 会炸；普通对象 message 是 undefined
// ❌ JSON.stringify 一切 —— Error 的 message 会丢格式，也不是本题约定

// ✅ 先 instanceof，再 typeof string，否则 "unknown"
\`\`\`

> 真实场景：网关有时 \`reject(new Error(...))\`，老代码 \`reject("timeout")\`，偶发 \`reject(null)\`。客服工单只想看一句人话。
>
> ✅ **做 \`readErrorMessage\`**：三分支，同步函数，不要标 async。

---`,
    ["readErrorMessage"],
  ),
  sec(
    "sec-6.5",
    "§6.5 `Promise.all`（对应：`loadMany`）🟡",
    "6.5",
    `对比页一次要 2 个 SKU，购物车回填一次要 N 个。缺的那件用 \`null\` 占位，**不要**整批失败。复用 \`loadProductAsync\`。

### Java 对照：allOf（注意它不带各结果）

\`\`\`java
CompletableFuture.allOf(f1, f2, f3).join();
// 还得自己 f1.join()、f2.join() 去拿值
\`\`\`

### Python：asyncio.gather

\`\`\`python
rows = await asyncio.gather(
    load_product_async("KB-001", products),
    load_product_async("MS-002", products),
)
# 顺序和传入一致
\`\`\`

### TypeScript：Promise.all 按**下标**对齐 🟡

\`\`\`ts
async function loadMany(
  skus: string[],
  products: CatalogItem[],
): Promise<Array<CatalogItem | null>> {
  return Promise.all(skus.map((sku) => loadProductAsync(sku, products)));
}

await loadMany(["KB-001", "MS-002"], PRODUCTS);
// [机械键盘, 无线鼠标]

await loadMany(["MS-002", "KB-001"], PRODUCTS);
// [无线鼠标, 机械键盘]  ← 跟 skus，不是跟目录顺序

await loadMany(["KB-001", "NOPE"], PRODUCTS);
// [商品, null]

await loadMany([], PRODUCTS);
// []
\`\`\`

\`Promise.all\` 的结果数组**按下标**对应输入，不是谁先完成谁在前。本题所有 Promise 立刻完成，测不出来「完成时间」，但顺序约定仍然要守。

因为 \`loadProductAsync\` 找不到返回 \`null\`、**不 reject**，所以 \`all\` 不会整批挂。这是和下一题的分工。

### 串行 vs 并行

\`\`\`ts
// 🟡 串行：真网络时慢（本题立刻完成，测不出快慢）
const out = [];
for (const sku of skus) out.push(await loadProductAsync(sku, products));

// ✅ 并行发出去，一起等
await Promise.all(skus.map((sku) => loadProductAsync(sku, products)));
\`\`\`

作业请写 \`Promise.all\`。空数组：\`Promise.all([])\` 得到 \`[]\`。

### ❌ / ✅

\`\`\`ts
// ❌ 写死两件机械键盘
// ❌ 按 name / 目录顺序排序，不按 skus
// ❌ 缺的那件直接 skip，长度对不上 skus
// ❌ 忽略 products 参数

// ✅ map + Promise.all，缺的是 null 占位
\`\`\`

> ⚠️ 请先把 \`loadProductAsync\` 写对。运行器会拼上你已经写过的函数。
>
> ✅ **做 \`loadMany\`**：\`return Promise.all(skus.map(sku => loadProductAsync(sku, products)));\`

---`,
    ["loadMany"],
  ),
  sec(
    "sec-6.6",
    "§6.6 `allSettled` 摘要（对应：`loadManySettled`）🔴",
    "6.6",
    `运营批量核对 SKU：有的存在、有的填错。要一份 **{ ok, failed }**，而不是第一件失败就把整批打掉。复用 \`loadOrThrow\`。

### 为什么不是 Promise.all 🔴

\`\`\`ts
await Promise.all([
  loadOrThrow("KB-001", PRODUCTS), // 成功
  loadOrThrow("NOPE", PRODUCTS),   // 拒绝
]);
// 整笔 reject。成功那件的值你拿不到，也数不出「失败了几件」。
\`\`\`

### Python：gather(return_exceptions=True)

\`\`\`python
results = await asyncio.gather(*coros, return_exceptions=True)
ok = sum(1 for r in results if not isinstance(r, Exception))
\`\`\`

### TypeScript：allSettled 的判别联合 🔴

\`\`\`ts
async function loadManySettled(
  skus: string[],
  products: CatalogItem[],
): Promise<{ ok: number; failed: number }> {
  const results = await Promise.allSettled(
    skus.map((sku) => loadOrThrow(sku, products)),
  );
  let ok = 0;
  let failed = 0;
  for (const r of results) {
    if (r.status === "fulfilled") ok++;
    else failed++;
  }
  return { ok, failed };
}
\`\`\`

每一项是：

\`\`\`ts
type Settled<T> =
  | { status: "fulfilled"; value: T }
  | { status: "rejected"; reason: unknown };
\`\`\`

这就是 **Ch03 判别联合**。\`r.status === "fulfilled"\` 之后才能点 \`r.value\`；另一支点 \`r.reason\`。\`status\` 是**值**，运行时还在。

\`\`\`ts
await loadManySettled(["KB-001", "NOPE"], PRODUCTS);            // { ok: 1, failed: 1 }
await loadManySettled(["KB-001", "NOPE", "MS-002", "XX"], PRODUCTS); // { ok: 2, failed: 2 }
await loadManySettled(["KB-001", "MS-002"], PRODUCTS);          // { ok: 2, failed: 0 }
await loadManySettled(["NOPE", "XX"], PRODUCTS);                // { ok: 0, failed: 2 }
await loadManySettled([], PRODUCTS);                            // { ok: 0, failed: 0 }
\`\`\`

\`CP-009\` 库存 0 仍然 **ok**：\`loadOrThrow\` 只问「在不在目录里」。

### ❌ / ✅

\`\`\`ts
// ❌ 用 loadProductAsync：缺 SKU 是 null，status 全是 fulfilled，failed 永远 0
// ❌ 用 Promise.all + try/catch 包整批：一挂就进 catch，数不出「失败了几件」
// ❌ 空数组返回 null

// ✅ loadOrThrow + allSettled + 按 status 计数
\`\`\`

> ⚠️ 请先把 \`loadOrThrow\` 写对。失败必须是 rejected，不是 \`null\`。
>
> ✅ **做 \`loadManySettled\`**：\`allSettled\` → 循环 \`r.status\`。

---`,
    ["loadManySettled"],
  ),
  sec(
    "sec-6.7",
    "§6.7 失败再试一次（对应：`retryOnce`）🟡",
    "6.7",
    `偶发失败：第一次目录服务抖了一下，第二次就好。只再试**一次**。第二次还失败，把第二次的错误抛出去。最后一题复用前面的「reject / resolve」心智。

### Java / Python 对照

\`\`\`java
<T> T retryOnce(Supplier<T> fn) {
    try { return fn.get(); }
    catch (RuntimeException e) { return fn.get(); }  // 第二次失败就抛
}
\`\`\`

\`\`\`python
async def retry_once(fn):
    try:
        return await fn()
    except Exception:
        return await fn()
\`\`\`

### TypeScript：函数类型 \`() => Promise<T>\` 🟡

Ch05 的函数当值。\`fn\` 是「再调一次会再跑」的闭包——测试用它实现「第一次失败、第二次成功」。

\`\`\`ts
async function retryOnce<T>(fn: () => Promise<T>): Promise<T> {
  try {
    return await fn();
  } catch {
    return await fn();
  }
}
\`\`\`

行为表：

| fn 的表现 | 结果 | 调用次数 |
|---|---|---|
| 第一次就 fulfilled | 那个值 | 1（不要多调） |
| 第一次 reject、第二次 fulfilled | 第二次的值 | 2 |
| 两次都 reject | 拒绝，**reason 是第二次**的 | 2（不要第三次） |

\`\`\`ts
let n = 0;
const fn = () => {
  n++;
  if (n === 1) return Promise.reject(new Error("temp"));
  return Promise.resolve("机械键盘");
};
await retryOnce(fn);  // "机械键盘"，n === 2
\`\`\`

第一次失败的 \`temp\` 被吃掉；第二次的值留下。两次都失败时：

\`\`\`ts
// 第一次 FIRST，第二次 SECOND → catch 到 "SECOND"
\`\`\`

不要 \`setTimeout\` 做重试间隔。本题立刻 settle。

### ❌ / ✅

\`\`\`ts
// ❌ while (true) 死重试
// ❌ 成功了还再调一次
// ❌ catch 以后 return 默认值（"机械键盘" / 0），把失败吞掉
// ❌ 只调一次，从不重试

// ✅ try await fn；catch 再 await fn。第二次的拒绝自然往外传
\`\`\`

> ✅ **做 \`retryOnce\`**：两行 try/catch。第二次不要再包一层「再试」。

---`,
    ["retryOnce"],
  ),
  sec(
    "sec-extra",
    "§6.8 延伸阅读（不考）",
    "6.8",
    `下面这些**本章不考**，知道名字即可，别写进作业。

- **\`Promise.race\`**：谁先终态听谁。超时常用它，但超时本身要 \`setTimeout\`，本页测不了。
- **\`AbortController\`**：取消 fetch。Ch11 假 fetch 会再碰到。
- **真 \`fetch\` / JSON**：类型在编译期，JSON 在运行时。\`loadProductAsync\` 的 \`CatalogItem\` **挡不住**接口给你 \`{ sku: 1 }\`。这就是 **Ch07 zod**。
- **Event Loop / 微任务**：\`await\` 之后的代码为什么「看起来后执行」。Ch08。

---`,
    [],
  ),
  sec(
    "sec-pits",
    "§6.9 Java / Python 老手几个坑 ⚠️",
    "6.9",
    `1. **async 函数永远返回 Promise**。\`return 1\` 也是 \`Promise<number>\`。别以为调用那一行就拿到 1。
2. **throw 在 async 里不在调用点抛**。要 \`await\` 才进 catch。不 await 就是 unhandled rejection。
3. **\`catch (e)\` 是 unknown**。不要当 Java 的 \`Exception e\`。先 \`instanceof Error\`。
4. **作业禁止 \`setTimeout\` / \`fetch\`**。4 秒超时，必须 \`Promise.resolve\` / \`Promise.reject\`。
5. **目录是参数**。测试会换子集，写死 \`PRODUCTS\` 或写死「机械键盘」会红。
6. **\`Promise.all\` 一挂全挂**；要摘要用 \`allSettled\`。\`loadMany\` 用软失败（null），\`loadManySettled\` 用硬失败（throw）。
7. **all 的顺序是下标**，不是完成时间。
8. **库存 0 ≠ 找不到**。\`CP-009\` 在目录里，load 成功。
9. **类型蒸发**。\`Promise<CatalogItem>\` 在发出的 JS 里没了。真接口的 JSON 下一章用 zod 挡。

---`,
    [],
  ),
  sec(
    "sec-homework",
    "📝 本章作业",
    null,
    `上面 7 个函数按节交错出现。每个注释里有【场景】【转换点】、示例和提示。

**完成方式**：在编辑器里改 \`throw new Error("TODO")\`，点「▶ 运行测试」。全绿 = 这题过了。

卡住就回对应 §：\`delayValue\` → §6.1，\`loadOrThrow\` → §6.3，\`readErrorMessage\` → §6.4，\`loadManySettled\` → §6.6。

---`,
    [],
  ),
  sec(
    "sec-check",
    "✅ 自测：你真的掌握了吗？",
    null,
    `- [ ] 能说出 Promise 三态，并用 \`Promise.resolve\` 包立刻完成的值
- [ ] 能说清 async 函数永远返回 Promise，调用要 await
- [ ] 能说清 async 里 throw 变成 reject，不 await 接不到
- [ ] 能把 \`catch (e)\` 的 unknown 收窄成 Error / string / 兜底
- [ ] 能用 \`Promise.all\` 按 skus 顺序对齐；空数组 \`[]\`
- [ ] 能用 \`allSettled\` 数 ok / failed，并解释为什么不能用 loadProductAsync
- [ ] 能写只重试一次的 \`retryOnce\`，成功不重试、两次失败抛第二次
- [ ] 7 个作业全绿

---`,
    [],
  ),
  sec(
    "sec-feynman",
    "🎓 费曼挑战",
    null,
    `用大白话讲给「Java 同事」听。讲不清 = 还没真懂。

任选一题（1–2 分钟）：

1. 「我调用 \`loadOrThrow("NOPE")\` 包了 try/catch 却进不去 catch。Java 里 throw 不是立刻到 catch 吗？」— 卡壳重读 §6.3
2. 「\`catch (e) { console.log(e.message) }\` 为什么红线？Python / Java 都能直接拿 message。」— 卡壳重读 §6.4 + Ch03
3. 「四个 SKU 两个填错，我用 \`CompletableFuture.allOf\` 思路写了 \`Promise.all\`，为什么整批没了？想数失败件数该怎样？」— 卡壳重读 §6.5 + §6.6

---`,
    [],
  ),
  sec(
    "sec-next",
    "⏭️ 下一步",
    null,
    `Ch06 掌握后，进 **Ch07 · 运行时校验：zod**。

\`loadProductAsync\` 的返回类型 \`CatalogItem\` **编译之后就没了**。真要 \`fetch\` 一个 JSON，运行时可能是 \`{ sku: 1, name: null }\`，TS 不会挡。边界数据必须用 zod \`parse\` / \`safeParse\`。本章你已经会写 async 和收窄 unknown；下一章给「网上来的对象」加上运行时的形状检查。`,
    [],
  ),
];

const tutorialMd = `# Ch06 · Promise、async/await、错误

${sections
  .map((s) => (s.heading ? `## ${s.heading}\n\n${s.body}` : s.body))
  .join("\n\n")}
`;

const chapter = {
  id: "ch06",
  num: "06",
  title: "Promise、async/await、错误",
  runMode: "browser",
  tutorialMd,
  assignment,
  testName: "ch06_assignment",
  testSource,
  reviewMd,
  interleaved: true,
  sections,
  functions,
  preamble,
};

const out = join(dirname(fileURLToPath(import.meta.url)), "../src/content/chapters/ch06.json");
mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, JSON.stringify(chapter, null, 2) + "\n");
console.log("wrote", out);
