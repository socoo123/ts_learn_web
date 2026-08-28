/**
 * 用标准答案跑一遍 Ch16 测试，确认生成的 JSON 能绿。
 * 运行：bun scripts/verify-ch16.ts
 */
import chapter from "../src/content/chapters/ch16.json";
import shared from "../src/content/shared.json";
import { runFunctionTest } from "../src/lib/tsRunner";
import type { FuncDef, Section } from "../src/types";

const solutions: Record<string, string> = {
  parseHashRoute: `export function parseHashRoute(hash: string): HashRoute {
  const withoutHash = hash.startsWith("#") ? hash.slice(1) : hash;
  const parts = withoutHash.split("/").filter((p) => p.length > 0);
  return {
    moduleId: parts[0] ?? null,
    chapterId: parts[1] ?? null,
  };
}`,
  matchModuleChapter: `export function matchModuleChapter(
  catalog: CatalogModule[],
  moduleId: string,
  chapterId: string,
): boolean {
  const mod = catalog.find((m) => m.id === moduleId);
  if (!mod) return false;
  return mod.chapters.some((c) => c.id === chapterId);
}`,
  fetchStateReduce: `export function fetchStateReduce(state: FetchState, action: FetchAction): FetchState {
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
}`,
  isStaleSuccess: `export function isStaleSuccess(fetchedAt: number, nowMs: number, ttlMs: number): boolean {
  return nowMs - fetchedAt >= ttlMs;
}`,
  retryableError: `export function retryableError(httpStatus: number): boolean {
  return httpStatus === 408 || httpStatus === 429
    || (httpStatus >= 500 && httpStatus <= 599);
}`,
  buildQueryString: `export function buildQueryString(
  params: Record<string, string | number | null | undefined>,
): string {
  const parts: string[] = [];
  for (const key of Object.keys(params)) {
    const v = params[key];
    if (v === null || v === undefined) continue;
    parts.push(encodeURIComponent(key) + "=" + encodeURIComponent(String(v)));
  }
  return parts.join("&");
}`,
  selectChapterTitle: `export function selectChapterTitle(
  catalog: CatalogModule[],
  hash: string,
): string | null {
  const { moduleId, chapterId } = parseHashRoute(hash);
  if (moduleId === null || chapterId === null) return null;
  if (!matchModuleChapter(catalog, moduleId, chapterId)) return null;
  const mod = catalog.find((m) => m.id === moduleId);
  const ch = mod?.chapters.find((c) => c.id === chapterId);
  return ch?.title ?? null;
}`,
};

const expectedNames = [
  "parseHashRoute",
  "matchModuleChapter",
  "fetchStateReduce",
  "isStaleSuccess",
  "retryableError",
  "buildQueryString",
  "selectChapterTitle",
];

const ch = chapter as {
  id: string;
  num: string;
  title: string;
  runMode: string;
  testName: string;
  tutorialMd: string;
  assignment: string;
  testSource: string;
  reviewMd: string;
  interleaved: boolean;
  preamble: string;
  functions: FuncDef[];
  sections: Section[];
};

let wiringFailed = 0;

function wire(ok: boolean, msg: string) {
  console.log(ok ? `WIRE PASS  ${msg}` : `WIRE FAIL  ${msg}`);
  if (!ok) wiringFailed++;
}

function hasIdentCall(src: string, name: string): boolean {
  return new RegExp(`\\b${name}\\s*\\(`).test(src);
}

wire(ch.id === "ch16", `id === ch16 (got ${ch.id})`);
wire(ch.num === "16", `num === 16 (got ${ch.num})`);
wire(ch.title === "路由与数据获取心智", `title (got ${ch.title})`);
wire(ch.runMode === "browser", `runMode === browser (got ${ch.runMode})`);
wire(ch.testName === "ch16_assignment", `testName (got ${ch.testName})`);
wire(ch.interleaved === true, "interleaved === true");
wire(ch.tutorialMd.startsWith("# Ch16 · 路由与数据获取心智"), "H1");
wire(ch.tutorialMd.includes("作业 ↔ 教程对应表"), "front matter 对应表");
wire(ch.tutorialMd.includes("Ch17"), "下一步指向 Ch17");
wire(ch.tutorialMd.includes("Hono 第一个 API"), "下一步含 Hono 第一个 API");
wire(ch.tutorialMd.includes("M3"), "说明 M3 结束");
wire(ch.tutorialMd.includes("local"), "下一步是 local 后端");
wire(ch.tutorialMd.includes("```mermaid"), "至少 1 个 mermaid");
wire(ch.tutorialMd.includes("color:#1f1f1f"), "mermaid 带 color:#1f1f1f");
wire(ch.tutorialMd.includes("@GetMapping") || ch.tutorialMd.includes("getRequestURI"), "Java 对照 GetMapping/URI");
wire(ch.tutorialMd.includes("window.location.hash"), "Python/前端对照 hash");
wire(ch.tutorialMd.includes("staleFlagGuard") || ch.tutorialMd.includes("Ch14"), "连上 Ch14 stale");
wire(ch.tutorialMd.includes("Ch11"), "连上 Ch11");

wire(ch.preamble.includes("type HashRoute"), "preamble 含 HashRoute");
wire(ch.preamble.includes("type CatalogModule"), "preamble 含 CatalogModule");
wire(ch.preamble.includes("type FetchState"), "preamble 含 FetchState");
wire(ch.preamble.includes("type FetchAction"), "preamble 含 FetchAction");

wire(!/from\s+["']react["']/.test(ch.assignment), 'assignment 无 from "react"');
wire(!/from\s+["']react["']/.test(ch.testSource), 'testSource 无 from "react"');
wire(!/^\s*import\s+/m.test(ch.assignment), "assignment 无 import");
wire(!/^\s*import\s+/m.test(ch.testSource), "testSource 无 import");

const homeworkBlob = `${ch.assignment}\n${ch.testSource}\n${ch.preamble}`;
wire(!/react-router/i.test(homeworkBlob), "作业侧无 react-router");
wire(!/react-router/i.test(ch.assignment + ch.testSource), "assignment/test 无 react-router");
wire(!hasIdentCall(ch.assignment, "fetch"), "assignment 无 fetch(");
wire(!hasIdentCall(ch.testSource, "fetch"), "testSource 无 fetch(");
wire(!hasIdentCall(homeworkBlob, "fetch"), "preamble/作业 无 fetch(");
wire(!/<Route[\s>]/.test(ch.assignment), "作业无 Route 组件");
wire(!ch.testSource.includes("index.json"), "testSource 不读 index.json");
wire(ch.testSource.includes("const CATALOG"), "testSource 自带 CATALOG 夹具");

wire(ch.reviewMd.includes("loading"), "闪卡含 loading");
wire(ch.reviewMd.toLowerCase().includes("hash"), "闪卡含 hash");
wire(ch.reviewMd.toLowerCase().includes("retry"), "闪卡含 retry");

const fnNames = ch.functions.map((f) => f.name);
wire(
  expectedNames.length === fnNames.length && expectedNames.every((n, i) => n === fnNames[i]),
  `functions 顺序一致 [${fnNames.join(", ")}]`,
);

for (const f of ch.functions) {
  wire(f.testSuite === f.name, `testSuite === name (${f.name})`);
  wire(
    f.skeleton.includes(`export function ${f.name}`),
    `export function ${f.name}`,
  );
  wire(f.skeleton.includes('throw new Error("TODO")'), `${f.name} skeleton TODO`);
  wire(f.skeleton.includes("【场景】") && f.skeleton.includes("【转换点】"), `${f.name} 场景/转换点`);
  wire(ch.tutorialMd.includes("`" + f.name + "`"), `对应表含 ${f.name}`);
  wire(
    ch.sections.some((s) => s.exerciseFunctions.includes(f.name)),
    `${f.name} 挂在某节 exerciseFunctions`,
  );
}

const selectSkel = ch.functions.find((f) => f.name === "selectChapterTitle")?.skeleton ?? "";
wire(
  selectSkel.includes("parseHashRoute") && selectSkel.includes("matchModuleChapter"),
  "selectChapterTitle 骨架提示复用 parse+match",
);

const secNums = ["16.1", "16.2", "16.3", "16.4", "16.5", "16.6", "16.7"];
for (const n of secNums) {
  const s = ch.sections.find((x) => x.secNum === n);
  wire(!!s && s.heading.includes("§" + n), `H2 含 §${n}`);
}

wire(
  ch.sections.find((s) => s.secNum === "16.1")?.exerciseFunctions.includes("parseHashRoute") === true,
  "§16.1 → parseHashRoute",
);
wire(
  ch.sections.find((s) => s.secNum === "16.2")?.exerciseFunctions.includes("matchModuleChapter") ===
    true,
  "§16.2 → matchModuleChapter",
);
wire(
  ch.sections.find((s) => s.secNum === "16.3")?.exerciseFunctions.includes("fetchStateReduce") ===
    true,
  "§16.3 → fetchStateReduce",
);
wire(
  ch.sections.find((s) => s.secNum === "16.4")?.exerciseFunctions.includes("isStaleSuccess") === true,
  "§16.4 → isStaleSuccess",
);
wire(
  ch.sections.find((s) => s.secNum === "16.5")?.exerciseFunctions.includes("retryableError") === true,
  "§16.5 → retryableError",
);
wire(
  ch.sections.find((s) => s.secNum === "16.6")?.exerciseFunctions.includes("buildQueryString") ===
    true,
  "§16.6 → buildQueryString",
);
wire(
  ch.sections.find((s) => s.secNum === "16.7")?.exerciseFunctions.includes("selectChapterTitle") ===
    true,
  "§16.7 → selectChapterTitle",
);

wire(ch.testSource.includes("idle") && ch.testSource.includes("loading"), "测试含 idle/loading");
wire(ch.testSource.includes("NO_JSON"), "测试含 loading→error NO_JSON");
wire(ch.testSource.includes("encodeURIComponent"), "测试含中文/空格编码");
wire(ch.testSource.includes("机械 键盘"), "测试含中文空格查询串");

const forbiddenMatchers = [".toThrow", ".toContain", ".toMatch", ".toBeTruthy", ".toBeFalsy"];
for (const m of forbiddenMatchers) {
  wire(!ch.testSource.includes(m), `expect 不用 ${m}`);
}

const forbidden = [
  "hono",
  "@hono/",
  "drizzle-orm",
  "better-sqlite3",
  "@earendil-works/",
  "node:fs",
  "node:http",
];
for (const bad of forbidden) {
  wire(!homeworkBlob.toLowerCase().includes(bad.toLowerCase()), `无禁用依赖 ${bad}`);
}

if (wiringFailed) {
  console.error(`\n${wiringFailed} wiring check(s) failed`);
  process.exit(1);
}
console.log("wiring OK");

let failed = 0;
for (const f of ch.functions) {
  const res = await runFunctionTest({
    testSource: ch.testSource,
    preamble: ch.preamble,
    functions: ch.functions,
    codes: solutions,
    activeFunction: f.testSuite,
    productsJson: shared.mocks["products.json"],
  });
  const ok = res.returncode === 0;
  console.log(ok ? `PASS ${f.name}` : `FAIL ${f.name}\n${res.output}`);
  if (!ok) failed++;
}

if (failed) {
  console.error(`\n${failed} suite(s) failed`);
  process.exit(1);
}
console.log("\nall green");
