/**
 * 用标准答案跑一遍 Ch09 测试，确认生成的 JSON 能绿。
 * 运行：bun scripts/verify-ch09.ts
 */
import chapter from "../src/content/chapters/ch09.json";
import shared from "../src/content/shared.json";
import { runFunctionTest } from "../assets/js/runner-core.js";
import type { FuncDef, Section } from "../src/types";

const solutions: Record<string, string> = {
  readPkgName: `export function readPkgName(pkgJson: string): string {
  const pkg = JSON.parse(pkgJson);
  if (typeof pkg.name !== "string") {
    throw new Error("NO_NAME");
  }
  return pkg.name;
}`,
  isModuleType: `export function isModuleType(pkgJson: string): boolean {
  const pkg = JSON.parse(pkgJson);
  return pkg.type === "module";
}`,
  depVersion: `export function depVersion(pkgJson: string, name: string): string | null {
  const pkg = JSON.parse(pkgJson);
  const v = pkg.dependencies?.[name];
  return typeof v === "string" ? v : null;
}`,
  hasDevDep: `export function hasDevDep(pkgJson: string, name: string): boolean {
  const pkg = JSON.parse(pkgJson);
  return Object.keys(pkg.devDependencies ?? {}).includes(name);
}`,
  scriptCommand: `export function scriptCommand(pkgJson: string, script: string): string | null {
  const pkg = JSON.parse(pkgJson);
  const cmd = pkg.scripts?.[script];
  return typeof cmd === "string" ? cmd : null;
}`,
  collectDepNames: `export function collectDepNames(pkgJson: string): string[] {
  const pkg = JSON.parse(pkgJson);
  return Object.keys(pkg.dependencies ?? {}).sort();
}`,
  assertCaretRange: `export function assertCaretRange(version: string): boolean {
  return version.startsWith("^");
}`,
};

const expectedNames = [
  "readPkgName",
  "isModuleType",
  "depVersion",
  "hasDevDep",
  "scriptCommand",
  "collectDepNames",
  "assertCaretRange",
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

wire(ch.id === "ch09", `id === ch09 (got ${ch.id})`);
wire(ch.num === "09", `num === 09 (got ${ch.num})`);
wire(ch.title === "包与运行时", `title (got ${ch.title})`);
wire(ch.runMode === "browser", `runMode === browser (got ${ch.runMode})`);
wire(ch.testName === "ch09_assignment", `testName (got ${ch.testName})`);
wire(ch.interleaved === true, "interleaved === true");
wire(ch.tutorialMd.startsWith("# Ch09 · 包与运行时"), "H1");
wire(ch.tutorialMd.includes("作业 ↔ 教程对应表"), "front matter 对应表");
wire(ch.tutorialMd.includes("Ch10"), "下一步指向 Ch10");
wire(ch.tutorialMd.includes("shop-agent"), "教程含 shop-agent");
wire(ch.tutorialMd.includes("pom.xml"), "对照 Maven pom.xml");
wire(ch.tutorialMd.includes("pyproject.toml"), "对照 Python pyproject.toml");
wire(ch.tutorialMd.includes("node_modules"), "讲 node_modules");
wire(ch.tutorialMd.includes("~/.m2") || ch.tutorialMd.includes(".m2"), "对照 Maven 本地仓库");
wire(ch.preamble.includes("JSON.parse") || ch.preamble.includes("解析"), "preamble 解析字符串");
wire(ch.preamble.includes("禁止") && ch.preamble.includes("bun add"), "作业声明禁止 bun add");
wire(!ch.testSource.includes("bun add"), "测试不 bun add");
wire(!ch.testSource.includes("npm install"), "测试不 npm install");
wire(ch.testSource.includes("shop-agent"), "测试夹具 shop-agent");
wire(ch.testSource.includes("ts-learn-web"), "测试夹具 ts-learn-web");
wire(ch.testSource.includes("NO_NAME"), "测试查 NO_NAME");
wire(!ch.testSource.includes(".toThrow"), "测试不用 .toThrow");
wire(ch.reviewMd.includes("zod") && ch.reviewMd.includes("typescript"), "闪卡 dep vs devDep");
wire(ch.reviewMd.includes("^") || ch.reviewMd.includes("caret") || ch.reviewMd.includes("兼容范围"), "闪卡覆盖 ^");
wire(ch.reviewMd.includes("Bun"), "闪卡覆盖 Bun");
wire(ch.reviewMd.includes("module") || ch.reviewMd.includes("CJS"), "闪卡覆盖 type module");

const fnNames = ch.functions.map((f) => f.name);
wire(
  expectedNames.length === fnNames.length && expectedNames.every((n, i) => n === fnNames[i]),
  `functions 顺序与大纲一致 [${fnNames.join(", ")}]`,
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

const secNums = ["9.1", "9.2", "9.3", "9.4", "9.5", "9.6", "9.7"];
for (const n of secNums) {
  const s = ch.sections.find((x) => x.secNum === n);
  wire(!!s && s.heading.includes("§" + n), `H2 含 §${n}`);
}

wire(
  ch.sections.find((s) => s.secNum === "9.1")?.exerciseFunctions.includes("readPkgName") === true,
  "§9.1 → readPkgName",
);
wire(
  ch.sections.find((s) => s.secNum === "9.2")?.exerciseFunctions.includes("isModuleType") === true,
  "§9.2 → isModuleType",
);
wire(
  ch.sections.find((s) => s.secNum === "9.3")?.exerciseFunctions.includes("depVersion") === true,
  "§9.3 → depVersion",
);
wire(
  ch.sections.find((s) => s.secNum === "9.4")?.exerciseFunctions.includes("hasDevDep") === true,
  "§9.4 → hasDevDep",
);
wire(
  ch.sections.find((s) => s.secNum === "9.5")?.exerciseFunctions.includes("scriptCommand") === true,
  "§9.5 → scriptCommand",
);
wire(
  ch.sections.find((s) => s.secNum === "9.6")?.exerciseFunctions.includes("collectDepNames") === true,
  "§9.6 → collectDepNames",
);
wire(
  ch.sections.find((s) => s.secNum === "9.7")?.exerciseFunctions.includes("assertCaretRange") === true,
  "§9.7 → assertCaretRange",
);

const forbidden = [
  "drizzle-orm",
  "better-sqlite3",
  "@earendil-works/",
  "node:fs",
  "node:http",
  "trpc",
  "@trpc",
];
const blob = `${ch.assignment}\n${ch.testSource}\n${ch.preamble}`;
for (const bad of forbidden) {
  wire(!blob.toLowerCase().includes(bad.toLowerCase()), `无禁用依赖 ${bad}`);
}
wire(!/^\s*import\s+.*from\s+["']hono["']/m.test(blob), "assignment/tests 无 import hono");
wire(!ch.tutorialMd.includes("Docker") && !ch.tutorialMd.includes("docker"), "教程不讲 Docker");
wire(!ch.tutorialMd.includes("GitHub Actions") && !ch.tutorialMd.includes("github actions"), "教程不讲 CI");
wire(!ch.tutorialMd.includes("npm publish"), "教程不讲 npm publish");

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
