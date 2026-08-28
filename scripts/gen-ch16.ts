/**
 * 生成 src/content/chapters/ch16.json
 * 运行：bun scripts/gen-ch16.ts
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const preamble = `/**
 * Ch16 作业：课程地图的 hash 路由 + 远程数据四态。
 *
 * 场景：地址栏是 #/m3/ch14，打开 hooks 章；拉章节 JSON 会经历
 * idle → loading → success / error。查询串 sku=KB-001 给商品页用。
 * 作业是纯函数：解析 URL、判断章属模块、归约四态、ttl、重试、拼 query。
 *
 * 运行器没有路由器库，禁止 import react，禁止真的网络请求。
 * 教程里的页面跳转只是心智，不在本题编译。
 *
 * 全绿 = 你掌握了 Ch16。
 */

type HashRoute = {
  moduleId: string | null;
  chapterId: string | null;
};

type CatalogChapter = { id: string; title: string };
type CatalogModule = { id: string; chapters: CatalogChapter[] };

type FetchState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; data: unknown }
  | { status: "error"; message: string };

type FetchAction =
  | { type: "start" }
  | { type: "ok"; data: unknown }
  | { type: "fail"; message: string }
  | { type: "reset" };`;

const functions = [
  {
    name: "parseHashRoute",
    testSuite: "parseHashRoute",
    skeleton: `/**
 * 【场景】课程地图点开 hooks 章，地址栏变成 #/m3/ch14。
 * SPA 不整页刷新，只靠 hash 告诉你：现在在哪个模块、哪一章。
 *
 * 【转换点】去掉开头的 # 和空段，按 / 切开。
 * Java 的 HttpServletRequest.getRequestURI() 拿到的是服务器路径（整页请求）；
 * Python FastAPI 的 path 也是服务端。这里是 window.location.hash，纯字符串。
 *
 * 任务：第 1 段 → moduleId，第 2 段 → chapterId；没有则 null。多于两段只用前两段。
 * 示例：
 *   "#/m3/ch14"        → { moduleId: "m3", chapterId: "ch14" }
 *   "#/m3"             → { moduleId: "m3", chapterId: null }
 *   "#/"、""、"#"      → { moduleId: null, chapterId: null }
 *   "m3/ch14"（无 #）  → 同样能解析
 *   "#/m3/ch14/extra"  → 只用前两段 { m3, ch14 }
 *   "#/m2/ch11"        → { moduleId: "m2", chapterId: "ch11" }
 *
 * 提示：先去掉 #，split("/") 后 filter 掉空字符串。不要查 catalog。
 */
export function parseHashRoute(hash: string): HashRoute {
  throw new Error("TODO");
}`,
  },
  {
    name: "matchModuleChapter",
    testSuite: "matchModuleChapter",
    skeleton: `/**
 * 【场景】hash 写了 #/m3/ch11。ch11 是「fetch、JSON、Stream 概念」，但它属于 m2，
 * 不在 Web 前端模块。课程地图不能假装打开 hooks 章。
 *
 * 【转换点】找到 id === moduleId 的模块，再看 chapters 里有没有 id === chapterId。
 * Spring 的 @GetMapping("/m3/{id}") 只保证路径形状；章是否属于该模块是业务校验。
 *
 * 任务：模块存在且章在该模块 → true；否则 false（模块不存在、章在别的模块、空 catalog）。
 * 示例：
 *   catalog, "m3", "ch14" → true
 *   catalog, "m3", "ch11" → false（ch11 在 m2）
 *   catalog, "m9", "ch14" → false
 *   [], "m3", "ch14"      → false
 *
 * 提示：find 模块，再 some 章。不要 mutate catalog。
 */
export function matchModuleChapter(
  catalog: CatalogModule[],
  moduleId: string,
  chapterId: string,
): boolean {
  throw new Error("TODO");
}`,
  },
  {
    name: "fetchStateReduce",
    testSuite: "fetchStateReduce",
    skeleton: `/**
 * 【场景】点开 ch14，要拉章节 JSON。开始是 idle；点进去 start → loading；
 * 假数据回来 ok → success（data 为章节对象）；文件没有 fail → error "NO_JSON"。
 *
 * 【转换点】判别联合：四态互斥。不要用 data: T | null 一个字段表示「没拉 / 在拉 / 失败」。
 * Java 容易写成 Product p = null; boolean loading; String err; 三个字段互相撒谎。
 *
 * 任务：按 action.type 返回新 state，不要改传入的原 state。
 *   start → { status: "loading" }（无论之前是什么，含覆盖 success）
 *   ok    → { status: "success", data }
 *   fail  → { status: "error", message }
 *   reset → { status: "idle" }
 *   未知  → 原 state 同一引用（default: return state）
 *
 * 提示：switch。start 不要保留旧 data。未知分支 return state，不要 {...state}。
 */
export function fetchStateReduce(state: FetchState, action: FetchAction): FetchState {
  throw new Error("TODO");
}`,
  },
  {
    name: "isStaleSuccess",
    testSuite: "isStaleSuccess",
    skeleton: `/**
 * 【场景】hooks 章 JSON 拉成功了，但过了 ttl 还展示旧标题就过时。
 * 和 Ch14 的 staleFlagGuard 同名不同层：那边是 effect 闭包过期，这边是缓存过期。
 * 过期了要重新 start（Ch11 再 parse JSON），不是继续信 success 里那份 data。
 *
 * 【转换点】nowMs - fetchedAt >= ttlMs → true（过期）。刚好相等也算过期。
 *
 * 任务：返回是否 stale。ttlMs=0 → 立刻 stale。
 * 示例：
 *   fetchedAt=1000, now=1300, ttl=300 → true
 *   fetchedAt=1000, now=1300, ttl=301 → false
 *   ttl=0 → true
 *
 * 提示：用 >=，不要只写 >。
 */
export function isStaleSuccess(fetchedAt: number, nowMs: number, ttlMs: number): boolean {
  throw new Error("TODO");
}`,
  },
  {
    name: "retryableError",
    testSuite: "retryableError",
    skeleton: `/**
 * 【场景】拉 ch14 JSON：502 网关抖一下可以再试；404 是章不存在，再试还是没有。
 *
 * 【转换点】可重试：408、429、500–599（含 500 和 599）。
 * 不可重试：400 / 401 / 403 / 404 / 200 / 0 / 199 / 499。
 *
 * 任务：httpStatus 落在可重试集合 → true，否则 false。
 * 示例：
 *   502 → true
 *   404 → false
 *   408 → true；429 → true；500 → true；599 → true
 *
 * 提示：先写两个等于，再写 500 <= s && s <= 599。不要对 404 返回 true。
 */
export function retryableError(httpStatus: number): boolean {
  throw new Error("TODO");
}`,
  },
  {
    name: "buildQueryString",
    testSuite: "buildQueryString",
    skeleton: `/**
 * 【场景】商品页要带 sku=KB-001；搜索框可能是空（null 表示「不要这个键」）。
 * 中文搜索「机械 键盘」必须编码，空格是 %20 不是 +。
 *
 * 【转换点】跳过值为 null / undefined 的键；其余键值都 encodeURIComponent，
 * 拼成 key=value，用 & 连接。不要前导 ?。按对象插入序。
 *
 * 任务：返回查询串（没有 ?）。不要改 params。
 * 示例：
 *   {}                              → ""
 *   { sku: "KB-001", limit: 10 }    → "sku=KB-001&limit=10"
 *   { sku: "KB-001", q: null }      → "sku=KB-001"
 *   { q: "机械 键盘" }              → "q=" + encodeURIComponent("机械 键盘")
 *
 * 提示：Object.keys 遍历；v == null 就 continue（同时跳过 null 和 undefined）。
 */
export function buildQueryString(
  params: Record<string, string | number | null | undefined>,
): string {
  throw new Error("TODO");
}`,
  },
  {
    name: "selectChapterTitle",
    testSuite: "selectChapterTitle",
    skeleton: `/**
 * 【场景】课程地图要根据 hash 显示章标题：#/m3/ch14 → 「hooks 心智」。
 * 写错模块（#/m3/ch11）或只写到模块（#/m3）就不要瞎猜一个标题。
 *
 * 【转换点】综合题：必须调用 parseHashRoute + matchModuleChapter，不要复制解析逻辑。
 * moduleId 或 chapterId 为 null → null；match 为 false → null；
 * 否则返回该章 title。
 *
 * 示例：
 *   "#/m3/ch14" → "hooks 心智"
 *   "#/m3/ch11" → null
 *   "#/m3"      → null
 *   "#/m2/ch11" → "fetch、JSON、Stream 概念"
 *
 * 提示：先 parse；任一段 null 就返回 null。再 match；false 就 null。
 * 命中后再从 catalog 里找出 title。
 */
export function selectChapterTitle(
  catalog: CatalogModule[],
  hash: string,
): string | null {
  throw new Error("TODO");
}`,
  },
];

const assignment = `${preamble}

${functions.map((f) => f.skeleton).join("\n\n")}
`;

const testSource = `const CATALOG: CatalogModule[] = [
  {
    id: "m2",
    chapters: [
      { id: "ch11", title: "fetch、JSON、Stream 概念" },
    ],
  },
  {
    id: "m3",
    chapters: [
      { id: "ch14", title: "hooks 心智" },
      { id: "ch15", title: "表单与列表（Chat UI 基础）" },
      { id: "ch16", title: "路由与数据获取心智" },
    ],
  },
];

function freezeCatalog(catalog: CatalogModule[]): CatalogModule[] {
  for (const mod of catalog) {
    for (const ch of mod.chapters) Object.freeze(ch);
    Object.freeze(mod.chapters);
    Object.freeze(mod);
  }
  Object.freeze(catalog);
  return catalog;
}

describe("parseHashRoute", () => {
  it("#/m3/ch14 → m3 / ch14", () => {
    expect(parseHashRoute("#/m3/ch14")).toEqual({
      moduleId: "m3",
      chapterId: "ch14",
    });
  });
  it("#/m3 → chapterId null", () => {
    expect(parseHashRoute("#/m3")).toEqual({
      moduleId: "m3",
      chapterId: null,
    });
  });
  it("#/、空串、# → 两段都 null", () => {
    expect(parseHashRoute("#/")).toEqual({ moduleId: null, chapterId: null });
    expect(parseHashRoute("")).toEqual({ moduleId: null, chapterId: null });
    expect(parseHashRoute("#")).toEqual({ moduleId: null, chapterId: null });
  });
  it("无 hash 的 m3/ch14 同样能解析", () => {
    expect(parseHashRoute("m3/ch14")).toEqual({
      moduleId: "m3",
      chapterId: "ch14",
    });
  });
  it("多于两段只用前两段", () => {
    expect(parseHashRoute("#/m3/ch14/extra")).toEqual({
      moduleId: "m3",
      chapterId: "ch14",
    });
  });
  it("#/m2/ch11 → m2 / ch11（防硬编码 m3/ch14）", () => {
    expect(parseHashRoute("#/m2/ch11")).toEqual({
      moduleId: "m2",
      chapterId: "ch11",
    });
  });
  it("中间多余斜杠丢掉空段；尾斜杠不影响", () => {
    expect(parseHashRoute("#//m3//ch14//")).toEqual({
      moduleId: "m3",
      chapterId: "ch14",
    });
    expect(parseHashRoute("#/m3/")).toEqual({
      moduleId: "m3",
      chapterId: null,
    });
  });
  it("#/m4/ch17 只解析字符串，不查目录", () => {
    expect(parseHashRoute("#/m4/ch17")).toEqual({
      moduleId: "m4",
      chapterId: "ch17",
    });
  });
});

describe("matchModuleChapter", () => {
  it("m3 + ch14 属于该模块", () => {
    expect(matchModuleChapter(CATALOG, "m3", "ch14")).toBe(true);
  });
  it("m3 + ch11：章在别的模块 → false", () => {
    expect(matchModuleChapter(CATALOG, "m3", "ch11")).toBe(false);
  });
  it("模块不存在 → false", () => {
    expect(matchModuleChapter(CATALOG, "m9", "ch14")).toBe(false);
  });
  it("空 catalog → false", () => {
    expect(matchModuleChapter([], "m3", "ch14")).toBe(false);
  });
  it("m2 + ch11 true；m3 + ch16 true（防硬编码）", () => {
    expect(matchModuleChapter(CATALOG, "m2", "ch11")).toBe(true);
    expect(matchModuleChapter(CATALOG, "m3", "ch16")).toBe(true);
    expect(matchModuleChapter(CATALOG, "m3", "ch15")).toBe(true);
  });
  it("freeze 后不 mutate catalog", () => {
    const frozen = freezeCatalog([
      { id: "m3", chapters: [{ id: "ch14", title: "hooks 心智" }] },
    ]);
    expect(matchModuleChapter(frozen, "m3", "ch14")).toBe(true);
    expect(frozen.length).toBe(1);
    expect(frozen[0].chapters.length).toBe(1);
    expect(frozen[0].chapters[0].id).toBe("ch14");
  });
});

describe("fetchStateReduce", () => {
  it("综合：idle → loading → success（章节对象）", () => {
    let s: FetchState = { status: "idle" };
    s = fetchStateReduce(s, { type: "start" });
    expect(s).toEqual({ status: "loading" });
    const chapter = { id: "ch14", title: "hooks 心智" };
    s = fetchStateReduce(s, { type: "ok", data: chapter });
    expect(s).toEqual({ status: "success", data: chapter });
  });
  it("综合：loading → error NO_JSON → reset idle", () => {
    let s: FetchState = { status: "loading" };
    s = fetchStateReduce(s, { type: "fail", message: "NO_JSON" });
    expect(s).toEqual({ status: "error", message: "NO_JSON" });
    s = fetchStateReduce(s, { type: "reset" });
    expect(s).toEqual({ status: "idle" });
  });
  it("start 覆盖 success，不保留旧 data", () => {
    const prev: FetchState = { status: "success", data: { id: "ch14" } };
    Object.freeze(prev);
    const next = fetchStateReduce(prev, { type: "start" });
    expect(prev.status).toBe("success");
    expect(next).toEqual({ status: "loading" });
  });
  it("fail 用传入的 message；ok 用传入的 data（防硬编码）", () => {
    const err = fetchStateReduce({ status: "loading" }, { type: "fail", message: "TIMEOUT" });
    expect(err).toEqual({ status: "error", message: "TIMEOUT" });
    const ok = fetchStateReduce({ status: "loading" }, { type: "ok", data: { sku: "KB-001" } });
    expect(ok).toEqual({ status: "success", data: { sku: "KB-001" } });
  });
  it("未知 type 返回原 state 同一引用", () => {
    const state: FetchState = { status: "loading" };
    Object.freeze(state);
    const next = fetchStateReduce(state, { type: "nope" } as FetchAction);
    expect(Object.is(next, state)).toBe(true);
    expect(state.status).toBe("loading");
  });
  it("freeze idle：start 不 mutate 原 state", () => {
    const idle: FetchState = { status: "idle" };
    Object.freeze(idle);
    const next = fetchStateReduce(idle, { type: "start" });
    expect(idle.status).toBe("idle");
    expect(next.status).toBe("loading");
    expect(Object.is(next, idle)).toBe(false);
  });
});

describe("isStaleSuccess", () => {
  it("刚好 ttl 到期 → stale", () => {
    expect(isStaleSuccess(1000, 1300, 300)).toBe(true);
  });
  it("还差 1ms → 未过期", () => {
    expect(isStaleSuccess(1000, 1300, 301)).toBe(false);
  });
  it("now === fetchedAt 且 ttl=0 → 立刻 stale；ttl>0 则相等也是 0>=ttl？", () => {
    expect(isStaleSuccess(1000, 1000, 0)).toBe(true);
    expect(isStaleSuccess(500, 500, 1)).toBe(false);
  });
  it("ttlMs=0 非零时间差也 stale", () => {
    expect(isStaleSuccess(1000, 1001, 0)).toBe(true);
  });
  it("明显新鲜 / 明显过期（防硬编码 1000/1300）", () => {
    expect(isStaleSuccess(0, 10, 11)).toBe(false);
    expect(isStaleSuccess(0, 10, 10)).toBe(true);
    expect(isStaleSuccess(200, 900, 700)).toBe(true);
    expect(isStaleSuccess(200, 899, 700)).toBe(false);
  });
});

describe("retryableError", () => {
  it("408、429、500、599、502 可重试", () => {
    expect(retryableError(408)).toBe(true);
    expect(retryableError(429)).toBe(true);
    expect(retryableError(500)).toBe(true);
    expect(retryableError(599)).toBe(true);
    expect(retryableError(502)).toBe(true);
    expect(retryableError(501)).toBe(true);
  });
  it("400、401、403、404、200、0、199、499 不可重试", () => {
    expect(retryableError(400)).toBe(false);
    expect(retryableError(401)).toBe(false);
    expect(retryableError(403)).toBe(false);
    expect(retryableError(404)).toBe(false);
    expect(retryableError(200)).toBe(false);
    expect(retryableError(0)).toBe(false);
    expect(retryableError(199)).toBe(false);
    expect(retryableError(499)).toBe(false);
  });
  it("600 超出 5xx；404 找不到章不要狂重试", () => {
    expect(retryableError(600)).toBe(false);
    expect(retryableError(404)).toBe(false);
  });
});

describe("buildQueryString", () => {
  it("空对象 → 空串，不要 ?", () => {
    expect(buildQueryString({})).toBe("");
  });
  it("sku + limit 按插入序，无前导 ?", () => {
    expect(buildQueryString({ sku: "KB-001", limit: 10 })).toBe("sku=KB-001&limit=10");
  });
  it("跳过 null，保留 sku", () => {
    expect(buildQueryString({ sku: "KB-001", q: null })).toBe("sku=KB-001");
  });
  it("中文和空格必须 encodeURIComponent（空格 %20 不是 +）", () => {
    const got = buildQueryString({ q: "机械 键盘" });
    expect(got).toBe("q=" + encodeURIComponent("机械 键盘"));
    expect(got.includes(" ")).toBe(false);
    expect(got.includes("+")).toBe(false);
    expect(got.includes("%20")).toBe(true);
  });
  it("跳过 undefined；数字 0 要留下；& 必须编码", () => {
    expect(buildQueryString({ sku: "KB-001", q: undefined })).toBe("sku=KB-001");
    expect(buildQueryString({ stock: 0 })).toBe("stock=0");
    expect(buildQueryString({ q: "a&b" })).toBe("q=" + encodeURIComponent("a&b"));
  });
  it("插入序：三个键；freeze 不 mutate", () => {
    const params: Record<string, string | number | null | undefined> = {
      sku: "KB-001",
      q: null,
      limit: 10,
    };
    Object.freeze(params);
    expect(buildQueryString(params)).toBe("sku=KB-001&limit=10");
    expect(params).toEqual({ sku: "KB-001", q: null, limit: 10 });
  });
  it("不要前导 ?（防 '?sku=KB-001'）", () => {
    const s = buildQueryString({ sku: "MS-002" });
    expect(s).toBe("sku=MS-002");
    expect(s.startsWith("?")).toBe(false);
  });
});

describe("selectChapterTitle", () => {
  it("#/m3/ch14 → hooks 心智", () => {
    expect(selectChapterTitle(CATALOG, "#/m3/ch14")).toBe("hooks 心智");
  });
  it("#/m3/ch11 章不属于模块 → null", () => {
    expect(selectChapterTitle(CATALOG, "#/m3/ch11")).toBeNull();
  });
  it("#/m3 缺 chapterId → null", () => {
    expect(selectChapterTitle(CATALOG, "#/m3")).toBeNull();
  });
  it("#/m2/ch11 → fetch、JSON、Stream 概念", () => {
    expect(selectChapterTitle(CATALOG, "#/m2/ch11")).toBe("fetch、JSON、Stream 概念");
  });
  it("#/m3/ch16 与无 hash 的 m3/ch14（防硬编码）", () => {
    expect(selectChapterTitle(CATALOG, "#/m3/ch16")).toBe("路由与数据获取心智");
    expect(selectChapterTitle(CATALOG, "m3/ch14")).toBe("hooks 心智");
    expect(selectChapterTitle(CATALOG, "#/m3/ch15")).toBe("表单与列表（Chat UI 基础）");
  });
  it("空 hash / 空 catalog / 未知模块 → null", () => {
    expect(selectChapterTitle(CATALOG, "#/")).toBeNull();
    expect(selectChapterTitle(CATALOG, "")).toBeNull();
    expect(selectChapterTitle([], "#/m3/ch14")).toBeNull();
    expect(selectChapterTitle(CATALOG, "#/m4/ch17")).toBeNull();
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
    `> **预计**：1 天 ｜ **前置**：Ch14（hooks / staleFlagGuard）、Ch11（JSON / 假远程数据）
> **目标**：① 多页（课程地图那种 hash）；② loading / error / success 四态；③ URL 解析 + 远程数据状态机都是**纯函数**。
> 你 15 年 Java：\`@GetMapping\` / \`getRequestURI()\` 在服务端切路径；这里 hash 变了**不刷新整页**。Python：FastAPI 管 path，浏览器 \`window.location.hash\` 管这一课。

> 📐 **本教程的契约**：下面每一节（§16.1–§16.7）都**精确对应**作业里的题。讲过的才考，考的必讲过。卡住时按作业函数名回查对应小节。
> **不讲**：路由器库的 API、Next.js 文件路由、SWR / React Query 的库函数（一句话：那些库帮你写的，就是本章这些纯逻辑）。作业里不要写路由组件。

---`,
    [],
  ),
  sec(
    "sec-map",
    "🗺️ 本章地图",
    null,
    `本章作业是一条完整主线：**本课网站的课程地图**。hash \`#/m3/ch14\` 打开 hooks 章；拉章节 JSON 有 loading / error / success；商品查询串 \`sku=KB-001\`。7 个函数，全部纯函数；**不**把路由器库引进测试（运行器也没有）。

读完这章 + 完成作业，你将能够：

- 从 \`#/m3/ch14\` 解析出模块和章；缺段就是 \`null\`
- 判断「这章是否属于该模块」（\`m3\`+\`ch11\` 为假）
- 用判别联合表达远程数据四态，而不是一个 \`null\` 字段三件事
- 用 ttl 判断 success 是否过期（连上 Ch14 stale、Ch11 JSON）
- 知道 404 不要狂重试、查询串要 \`encodeURIComponent\`
- 用 \`selectChapterTitle\` 把 hash 变成章标题

**作业 ↔ 教程对应表**（学哪节，就去做哪题）：

| 作业题 | 对应小节 | 核心知识点 |
|--------|----------|-----------|
| \`parseHashRoute\` | §16.1 | 解析 \`#/m3/ch14\` |
| \`matchModuleChapter\` | §16.2 | 章是否属于该模块 |
| \`fetchStateReduce\` | §16.3 | idle / loading / success / error 状态机 |
| \`isStaleSuccess\` | §16.4 | 成功数据是否过期 |
| \`retryableError\` | §16.5 | 哪些 HTTP 状态可重试 |
| \`buildQueryString\` | §16.6 | 拼查询串，跳过 null |
| \`selectChapterTitle\` | §16.7 | 综合：hash → 标题 |

---`,
    [],
  ),
  sec(
    "sec-path",
    "⏱️ 学习路径：费曼五步（约 50–70 分钟）",
    null,
    `| 步 | 你要做 | 在哪做 |
|----|--------|--------|
| ① 预览猜（2 分钟） | 看 Spring path vs hash，先猜 TS 怎么拆 | 本页 ① |
| ② 先动手 | 每节后面的编辑器里**先试着写** | 本节练习 |
| ③ 提取+反馈 | 点「运行测试」看红绿 | 本节练习 |
| ④ 费曼（2 分钟） | 大白话讲清「为什么四态不能塞进一个 null」 | 本页 ④ |
| ⑤ 存闪卡 | 章末闪卡标复习日期 | 闪卡 |

> 💡 别从头读到尾。先扫 ① → 写作业 → **哪题卡了，回对应 § 查** → 改 → 再跑。
> \`selectChapterTitle\` **必须调用** \`parseHashRoute\` 和 \`matchModuleChapter\`，不要把解析再抄一遍。

---`,
    [],
  ),
  sec(
    "sec-guess",
    "① 预览猜（2 分钟 · 激活你的 Java / Python 直觉）",
    null,
    `先别看答案，凭经验猜一猜（猜错没关系）：

1. Spring \`@GetMapping("/m3/{chapterId}")\` 改 URL 会发生什么？课程站点 \`#/m3/ch14\`，整页刷新了吗？
2. FastAPI 的 \`/m3/ch14\` 跑在哪一侧？\`window.location.hash\` 变了，服务器一定收到请求吗？
3. 拉章节 JSON：还没开始、正在拉、成功、失败——用一个 \`data = null\` 够不够？Java 的 \`Product p = null\` 能区分这四种吗？
4. 成功结果放了 5 分钟，ttl 是 5 分钟，算过期吗？\`>=\` 还是 \`>\`？
5. 404 找不到 ch99，要不要自动再拉三次？502 呢？
6. 查询串 \`q=机械 键盘\`，空格写成 \`+\` 还是 \`%20\`？键是 \`null\` 时这个键还在不在？

> 猜完，带着验证心态进入正文。第 1、3 题是本章的 🔴。

---`,
    [],
  ),
  sec(
    "sec-world",
    "hash 路由不整页刷新；远程数据用四态 🔴",
    null,
    `Ch14 说 effect 同步外部系统；Ch11 说 JSON 从字符串变成对象。本章把两件事接到**课程地图**：hash 告诉你在哪一章，四态告诉你章节 JSON 拉到哪一步。

| | Java | Python | 本章心智 |
|---|---|---|---|
| 路径 | \`@GetMapping\` / \`HttpServletRequest.getRequestURI()\`，一次 HTTP，常整页 | FastAPI path 参数，服务端 | \`window.location.hash\`：\`#/m3/ch14\`，**不刷新整页** |
| 拉数 | \`RestTemplate\` + 一个 DTO，失败靠异常 | \`httpx\` + 一个 model | **idle / loading / success / error** 判别联合 |
| 过期 | 缓存 TTL 在网关 / Caffeine | FastAPI 背后的 cache | \`isStaleSuccess\`：success 过了 ttl 要重新 start |

### Java：服务端切路径（对照，不是作业）

\`\`\`java
@GetMapping("/m3/{chapterId}")
public String chapter(@PathVariable String chapterId, HttpServletRequest req) {
    String uri = req.getRequestURI(); // "/m3/ch14" — 浏览器会再要一整页
    return "chapter"; // JSP / Thymeleaf
}
\`\`\`

### Python：FastAPI path + 前端 hash

\`\`\`python
@app.get("/m3/{chapter_id}")
def chapter(chapter_id: str):
    return {"id": chapter_id}  # 这是服务器路由
\`\`\`

\`\`\`ts
// 浏览器：课程地图点 hooks 章
window.location.hash; // "#/m3/ch14"
// 只改 hash，文档不卸载。作业解析的就是这串字符。
\`\`\`

本课学习站自己就是这种多页：点模块 / 章，hash 变，UI 用纯函数算出「现在这一章的标题」。作业**不**引入路由器库。

远程数据不要这样：

\`\`\`ts
// ❌ 一个 null 表示三种意思：还没拉 / 正在拉 / 拉失败
type Bad = { data: Chapter | null; error?: string };
\`\`\`

\`\`\`ts
// ✅ 四态互斥，TypeScript 会逼你处理每一种
type FetchState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; data: unknown }
  | { status: "error"; message: string };
\`\`\`

\`\`\`mermaid
flowchart TD
    h["hash 变化<br/>hash /m3/ch14"] --> p["parseHashRoute"]
    p --> m{"match?"}
    m -->|"命中"| st["start → loading"]
    m -->|"未命中"| skip["不拉章节 JSON"]
    st --> ok["ok → success"]
    st --> fail["fail → error"]

    style h fill:#FFE082,stroke:#F9A825,color:#1f1f1f
    style p fill:#80DEEA,stroke:#0097A7,color:#1f1f1f
    style m fill:#80DEEA,stroke:#0097A7,color:#1f1f1f
    style st fill:#CE93D8,stroke:#7B1FA2,color:#1f1f1f
    style skip fill:#EF9A9A,stroke:#C62828,color:#1f1f1f
    style ok fill:#A5D6A7,stroke:#388E3C,color:#1f1f1f
    style fail fill:#EF9A9A,stroke:#C62828,color:#1f1f1f
\`\`\`

SWR / React Query 这类库，帮你写的就是：四态、ttl、可重试。本章先自己写纯函数，库才不是魔法。

### 本课怎么算「会了」

测试会 freeze catalog / FetchState。你若 mutate、或 \`fetchStateReduce\` 在 start 后还带着旧 data，会对不上。**全绿 = 这题掌握。**

---`,
    [],
  ),
  sec(
    "sec-16.1",
    "§16.1 解析 hash（对应：`parseHashRoute`）🔴",
    "16.1",
    `课程地图点 \`ch14\`，地址栏是 \`#/m3/ch14\`。作业只拿到这根字符串。

### Java 对照：URI 在服务器

\`\`\`java
String uri = request.getRequestURI(); // "/m3/ch14"
String[] parts = uri.split("/");
\`\`\`

这是一次真实导航。hash 变了，服务器可以完全不知道。

### Python 对照：FastAPI path vs 前端 hash

\`\`\`python
# 服务端
@app.get("/m3/{chapter_id}")
def chapter(chapter_id: str): ...

# 前端（浏览器）
# window.location.hash == "#/m3/ch14"
\`\`\`

### TypeScript：切段，丢掉空的

\`\`\`ts
function parseHashRoute(hash: string): HashRoute {
  const withoutHash = hash.startsWith("#") ? hash.slice(1) : hash;
  const parts = withoutHash.split("/").filter((p) => p.length > 0);
  return {
    moduleId: parts[0] ?? null,
    chapterId: parts[1] ?? null,
  };
}

parseHashRoute("#/m3/ch14");       // { moduleId: "m3", chapterId: "ch14" }
parseHashRoute("#/m3");            // { moduleId: "m3", chapterId: null }
parseHashRoute("#/");              // { null, null }
parseHashRoute("m3/ch14");         // 无 # 同样能解析
parseHashRoute("#/m3/ch14/extra"); // 只用前两段
parseHashRoute("#/m2/ch11");       // m2 / ch11
\`\`\`

不要去读目录文件：解析是语法，属不属于模块是 §16.2。

### ❌ / ✅

\`\`\`ts
// ❌ 写死只认 "#/m3/ch14"
// ❌ 不 filter 空段，"#//m3//ch14" 解析失败
// ❌ 第三段 extra 覆盖 chapterId
// ✅ 去 #、split、丢掉空段、只取 [0] [1]
\`\`\`

> ✅ **做 \`parseHashRoute\`**：两段 id，缺则 null。

---`,
    ["parseHashRoute"],
  ),
  sec(
    "sec-16.2",
    "§16.2 章必须属于模块（对应：`matchModuleChapter`）🟡",
    "16.2",
    `\`#/m3/ch11\` 语法合法，但 ch11 在 m2（fetch / JSON），不在 m3。地图不能打开一篇不属于这个模块的章。

### Java：路径对了 ≠ 资源属于这个聚合根

\`\`\`java
@GetMapping("/m3/{chapterId}")
public ResponseEntity<?> get(@PathVariable String chapterId) {
    // URI 能匹配，仍要查 chapter.moduleId 是不是 m3
    if (!chapterBelongsTo("m3", chapterId)) return ResponseEntity.notFound().build();
}
\`\`\`

### TypeScript：find 模块，再 some 章

\`\`\`ts
function matchModuleChapter(
  catalog: CatalogModule[],
  moduleId: string,
  chapterId: string,
): boolean {
  const mod = catalog.find((m) => m.id === moduleId);
  if (!mod) return false;
  return mod.chapters.some((c) => c.id === chapterId);
}

matchModuleChapter(catalog, "m3", "ch14"); // true
matchModuleChapter(catalog, "m3", "ch11"); // false
matchModuleChapter(catalog, "m9", "ch14"); // false
matchModuleChapter([], "m3", "ch14");      // false
\`\`\`

测试会 freeze catalog。不要 \`push\` 章进去「补救」匹配。

### ❌ / ✅

\`\`\`ts
// ❌ 全站扫描 chapterId，忽略 moduleId（m3+ch11 会误 true）
// ❌ 模块不存在时 throw
// ✅ 先锁定模块，再看它的 chapters
\`\`\`

> ✅ **做 \`matchModuleChapter\`**：模块内有这一章才 true。

---`,
    ["matchModuleChapter"],
  ),
  sec(
    "sec-16.3",
    "§16.3 远程数据四态（对应：`fetchStateReduce`）🔴",
    "16.3",
    `点开 ch14：\`start\` → loading；假数据成功则 \`ok\`（data 为章节对象）；没有 JSON 则 \`fail\`，message 像 \`"NO_JSON"\`。

### Java / Python：三个字段容易撒谎

\`\`\`java
Product data = null;
boolean loading = true;
String error = null; // loading 时 error 该不该清？data 留不留旧的？
\`\`\`

\`\`\`python
state = {"data": None, "loading": True, "error": None}
\`\`\`

TS 用判别联合：成功时一定有 \`data\`，失败时一定有 \`message\`，loading 两者都没有。

### TypeScript：按 action 返回新对象

\`\`\`ts
function fetchStateReduce(state: FetchState, action: FetchAction): FetchState {
  switch (action.type) {
    case "start":
      return { status: "loading" };
    case "ok":
      return { status: "success", data: action.data };
    case "fail":
      return { status: "error", message: action.message };
    case "reset":
      return { status: "idle" };
    default:
      return state;
  }
}
\`\`\`

规则：

- \`start\` **无论之前是什么**都变成 loading，包括覆盖 success（旧 data 丢掉）
- 未知 \`type\`：\`return state\` 同一引用，不要浅拷贝
- 不要 mutate 原 state（测试 freeze）

主线测试必跑：idle → loading → success；以及 loading → error → reset。

### ❌ / ✅

\`\`\`ts
// ❌ start 时 { status: "loading", data: state.data } 留着旧章节
// ❌ 未知 type 返回 { ...state }
// ❌ state.status = "loading"; return state
// ✅ switch；start 只返回 { status: "loading" }；default return state
\`\`\`

> ✅ **做 \`fetchStateReduce\`**：四态归约；综合两条链一次过。

---`,
    ["fetchStateReduce"],
  ),
  sec(
    "sec-16.4",
    "§16.4 成功结果会过期（对应：`isStaleSuccess`）🟡",
    "16.4",
    `Ch14 的 \`staleFlagGuard\`：组件卸了，晚到的响应不能再写 state。本章的 stale：success **已经写进去了**，但过了 ttl 不能再当真相——要重新 \`start\`，再用 Ch11 的方式把 JSON 收成对象。

### Java：缓存 TTL

\`\`\`java
boolean stale = now - fetchedAt >= ttlMs; // Caffeine / 自己写的过期
\`\`\`

### TypeScript：一个减法

\`\`\`ts
function isStaleSuccess(fetchedAt: number, nowMs: number, ttlMs: number): boolean {
  return nowMs - fetchedAt >= ttlMs;
}

isStaleSuccess(1000, 1300, 300); // true（刚好到期也过期）
isStaleSuccess(1000, 1300, 301); // false
isStaleSuccess(1000, 1000, 0);   // true（ttl=0 立刻 stale）
\`\`\`

相等用 \`>=\`。\`ttlMs = 0\` 时任何 \`now >= fetchedAt\` 都过期。

### ❌ / ✅

\`\`\`ts
// ❌ 只用 >，刚好 300ms 判成新鲜
// ❌ ttl=0 返回 false
// ✅ >= ttlMs
\`\`\`

> ✅ **做 \`isStaleSuccess\`**：到期（含相等）就是 stale。

---`,
    ["isStaleSuccess"],
  ),
  sec(
    "sec-16.5",
    "§16.5 哪些错误可重试（对应：`retryableError`）🟡",
    "16.5",
    `502 可能是网关抖一下；404 是这章没有 JSON。找不到章再拉一百次还是没有。

### Java / HTTP

\`\`\`java
// 408 Request Timeout、429 Too Many Requests、5xx → 可重试
// 404 Not Found、401、403 → 换参数前不要盲重试
\`\`\`

### TypeScript

\`\`\`ts
function retryableError(httpStatus: number): boolean {
  return httpStatus === 408 || httpStatus === 429
    || (httpStatus >= 500 && httpStatus <= 599);
}

retryableError(502); // true
retryableError(404); // false
retryableError(500); // true
retryableError(599); // true
retryableError(499); // false
\`\`\`

### ❌ / ✅

\`\`\`ts
// ❌ httpStatus >= 400 全重试（404 会狂打）
// ❌ 只写 500，漏 502 / 599
// ❌ 漏 408、429
// ✅ 408、429、闭区间 500–599
\`\`\`

> ✅ **做 \`retryableError\`**：404 必须是 false。

---`,
    ["retryableError"],
  ),
  sec(
    "sec-16.6",
    "§16.6 拼查询串（对应：`buildQueryString`）🔴",
    "16.6",
    `商品页：\`sku=KB-001&limit=10\`。搜索词 \`"机械 键盘"\` 必须编码。\`q: null\` 表示「这个键不要出现」，不是 \`"q=null"\`。

### Java：不要手搓脏 URL

\`\`\`java
// URLEncoder.encode(q, UTF_8) 空格会变成 +（form 编码）
// 本题跟浏览器 encodeURIComponent：空格是 %20
\`\`\`

### Python

\`\`\`python
from urllib.parse import urlencode, quote
urlencode({"q": "机械 键盘"}, quote_via=quote)  # 空格 %20
\`\`\`

### TypeScript：插入序、跳过 null、不要 \`?\`

\`\`\`ts
function buildQueryString(
  params: Record<string, string | number | null | undefined>,
): string {
  const parts: string[] = [];
  for (const key of Object.keys(params)) {
    const v = params[key];
    if (v === null || v === undefined) continue;
    parts.push(encodeURIComponent(key) + "=" + encodeURIComponent(String(v)));
  }
  return parts.join("&");
}

buildQueryString({});                           // ""
buildQueryString({ sku: "KB-001", limit: 10 }); // "sku=KB-001&limit=10"
buildQueryString({ sku: "KB-001", q: null });   // "sku=KB-001"
buildQueryString({ q: "机械 键盘" });           // q=%E6%9C%BA%E6%A2%B0%20%E9%94%AE%E7%9B%98
\`\`\`

测试会查：结果里没有空格、没有 \`+\`、有 \`%20\`；\`a&b\` 的 \`&\` 被编码。不要 mutate \`params\`。

### ❌ / ✅

\`\`\`ts
// ❌ 返回 "?sku=KB-001"（多了 ?）
// ❌ 不 encode，留下「机械 键盘」
// ❌ 空格用 +（那是 form urlencoded，不是 encodeURIComponent）
// ❌ params.q 被 delete 掉（mutate）
// ✅ 跳过 null/undefined；键值都 encodeURIComponent；无前导 ?
\`\`\`

> ✅ **做 \`buildQueryString\`**：编码 + 跳过空值 + 插入序。

---`,
    ["buildQueryString"],
  ),
  sec(
    "sec-16.7",
    "§16.7 综合：hash → 标题（对应：`selectChapterTitle`）🔴",
    "16.7",
    `课程地图要显示当前章标题。把 §16.1 和 §16.2 **串起来**，不要再写一遍 split。

必须调用 \`parseHashRoute\` + \`matchModuleChapter\`：

- \`moduleId\` 或 \`chapterId\` 为 null → null（\`#/m3\` 只有模块）
- match 为 false → null（\`#/m3/ch11\`）
- 否则返回该章 \`title\`

\`\`\`ts
function selectChapterTitle(catalog: CatalogModule[], hash: string): string | null {
  const { moduleId, chapterId } = parseHashRoute(hash);
  if (moduleId === null || chapterId === null) return null;
  if (!matchModuleChapter(catalog, moduleId, chapterId)) return null;
  const mod = catalog.find((m) => m.id === moduleId);
  const ch = mod?.chapters.find((c) => c.id === chapterId);
  return ch?.title ?? null;
}

selectChapterTitle(catalog, "#/m3/ch14"); // "hooks 心智"
selectChapterTitle(catalog, "#/m3/ch11"); // null
selectChapterTitle(catalog, "#/m3");      // null
selectChapterTitle(catalog, "#/m2/ch11"); // "fetch、JSON、Stream 概念"
\`\`\`

命中之后要从 catalog 取 \`title\`，不要写死 \`"hooks 心智"\`。

### ❌ / ✅

\`\`\`ts
// ❌ 自己再 split 一遍，不调用前两题
// ❌ hash 合法就返回第一章标题
// ✅ parse → 缺段 null → match → 再取 title
\`\`\`

> ✅ **做 \`selectChapterTitle\`**：复用 parse + match，返回 title 或 null。

---`,
    ["selectChapterTitle"],
  ),
  sec(
    "sec-pits",
    "⚠️ Java / Python 老手几个坑",
    null,
    `1. **把 hash 当成 Servlet path。** \`getRequestURI()\` 会打到服务器；\`#/m3/ch14\` 可以只在浏览器里变。
2. **一个 \`null\` 表示没拉 / 在拉 / 失败。** 用四态判别联合。
3. **start 之后还留着旧 success.data。** loading 不应携带 data。
4. **未知 action 返回拷贝。** \`default: return state\`，同一引用。
5. **ttl 用 \`>\`。** 刚好到期也要 stale；\`ttl=0\` 立刻过期。
6. **404 当 5xx 重试。** 章不存在不要狂打。408 / 429 / 500–599 才是可重试。
7. **查询串空格写成 \`+\`。** \`encodeURIComponent\` 是 \`%20\`。不要前导 \`?\`。
8. **\`m3+ch11\` 当 true。** 章必须属于该模块。
9. **综合题复制 split。** \`selectChapterTitle\` 调用前两题。
10. **作业 import 路由器库 / 真的发网络请求。** 运行器没有这些；作业是纯函数。

---`,
    [],
  ),
  sec(
    "sec-homework",
    "📝 本章作业",
    null,
    `上面 7 个函数按节交错出现。每个注释里有【场景】【转换点】、示例和提示。

**完成方式**：在编辑器里改 \`throw new Error("TODO")\`，点「▶ 运行测试」。全绿 = 这题过了。

卡住就回对应 §：\`parseHashRoute\` → §16.1，\`fetchStateReduce\` → §16.3，\`selectChapterTitle\` → §16.7（请复用 parse + match）。

提示只点知识点：去 \`#\`、\`split\` / \`filter\`、判别联合、\`>=\` ttl、\`encodeURIComponent\`。不要 mutate、不要前导 \`?\`。

---`,
    [],
  ),
  sec(
    "sec-check",
    "✅ 自测：你真的掌握了吗？",
    null,
    `- [ ] 能说清 hash 变了为什么可以不整页刷新，和 Spring \`getRequestURI\` 差在哪
- [ ] \`#/m3/ch14\` / \`#/m3\` / \`#/\` / 无 \`#\` 都能解析对
- [ ] \`m3+ch11\` 为 false：章必须属于模块
- [ ] 四态互斥；idle→loading→success 和 loading→error→reset 都能手写
- [ ] start 会盖掉旧 success；未知 action 同一引用
- [ ] ttl 相等即过期；连得上 Ch14 stale 和 Ch11 JSON
- [ ] 404 不重试，502 重试
- [ ] 查询串编码中文空格为 %20，跳过 null
- [ ] \`selectChapterTitle("#/m3/ch14")\` 得到「hooks 心智」
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

1. 「课程地图点 \`#/m3/ch14\`，为什么可以不整页刷新？这和 \`@GetMapping\` + \`getRequestURI()\` 是同一件事吗？」— 卡壳重读总述 + §16.1
2. 「拉章节 JSON 为什么不能用一个 \`data = null\`？loading 和 error 差在哪？start 为什么要丢掉旧 success？」— 卡壳重读总述 + §16.3
3. 「成功结果过了 ttl 为什么要重新拉？这和 Ch14 的 stale 闭包是不是同一个 stale？404 为什么不要重试？」— 卡壳重读 §16.4 + §16.5

---`,
    [],
  ),
  sec(
    "sec-next",
    "⏭️ 下一步",
    null,
    `Ch16 掌握后，**M3 Web 前端结束**。下一章是 **Ch17 · Hono 第一个 API**：离开浏览器作业，进入 **local 后端**——对照 FastAPI / Spring \`@RestController\`，用 Hono 写第一个 \`c.json\`。课程地图这套 hash + 四态，后面接到真正的 API 时不会丢；只是请求不再是作业里的假 \`ok\` / \`fail\`，而是你自己起的服务。`,
    [],
  ),
];

const tutorialMd = `# Ch16 · 路由与数据获取心智

${sections
  .map((s) => (s.heading ? `## ${s.heading}\n\n${s.body}` : s.body))
  .join("\n\n")}
`;

const reviewMd = `# Ch16 · 记忆闪卡

> 先回忆，再翻答案。连续 2 次秒答 → 退役。

## 🔖 闪卡

| # | 正面（问题） | 背面（答案） | 掌握 |
|---|---|---|---|
| 1 | \`#/m3/ch14\` 怎么解析？没有 \`#\` 的 \`m3/ch14\` 呢？ | 去掉开头 \`#\`，按 \`/\` 切开并丢掉空段。第 1 段 moduleId，第 2 段 chapterId。无 hash 同样能解析。缺段就是 null。 | ⬜ |
| 2 | 为什么 \`#/m3/ch11\` 不能当 hooks 章？ch11 明明存在。 | 章必须属于该模块。ch11 在 m2。\`matchModuleChapter("m3","ch11")\` 为 false。 | ⬜ |
| 3 | 远程数据为什么不能用一个 \`data: T \\| null\` 表示三种意思？四态是哪四个？ | idle / loading / success / error 互斥。null 分不清「还没拉」「正在拉」「拉失败」。loading 时不要留旧 data。 | ⬜ |
| 4 | fetchedAt=1000, now=1300, ttl=300 过期吗？ttl=301 呢？ttl=0 呢？ | \`now - fetchedAt >= ttl\` 即 stale（相等也过期）。300 → 过期；301 → 新鲜。ttl=0 立刻 stale。 | ⬜ |
| 5 | 404 和 502 哪个该自动 retry？找不到章为什么不要狂重试？ | 502（5xx）可重试；404 不可。再拉还是没有。可重试：408、429、500–599。 | ⬜ |
| 6 | \`{ q: "机械 键盘" }\` 拼查询串，空格变成什么？有没有前导 \`?\`？ | \`encodeURIComponent\`，空格是 %20 不是 +。不要前导 \`?\`。null / undefined 的键跳过。 | ⬜ |
| 7 | \`#/m3/ch14\` 的标题是什么？\`#/m3\` 和 \`#/m3/ch11\` 呢？ | 先 parse 再 match。都有且章属于模块 → 「hooks 心智」。缺段或 match 失败 → null。 | ⬜ |
| 8 | 已经 success 了再 dispatch start，下一态是什么？ | 一律 loading。重新拉会盖掉旧 success，不是留着旧 data 一边 loading。 | ⬜ |
| 9 | hash 变了会整页刷新吗？和 Spring \`getRequestURI\` 差在哪？ | 课程站这种 SPA：只改 hash，文档不卸载。\`getRequestURI\` 是服务器路径，通常伴随一次 HTTP。 | ⬜ |

## 🎓 费曼自检

- [ ] 能说清 hash 解析和章必须属于模块
- [ ] 能说清四态、ttl 过期、404 不重试
- [ ] 能说清 query encode 和综合选标题
`;

const chapter = {
  id: "ch16",
  num: "16",
  title: "路由与数据获取心智",
  runMode: "browser",
  tutorialMd,
  assignment,
  testName: "ch16_assignment",
  testSource,
  reviewMd,
  interleaved: true,
  sections,
  functions,
  preamble,
};

const out = join(dirname(fileURLToPath(import.meta.url)), "../src/content/chapters/ch16.json");
mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, JSON.stringify(chapter, null, 2) + "\n");
console.log("wrote", out);
