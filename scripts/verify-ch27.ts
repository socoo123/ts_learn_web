/**
 * 用标准答案跑一遍 Ch27 测试，确认生成的 JSON 与 local 能绿。
 * 运行：bun scripts/verify-ch27.ts
 */
import { spawnSync } from "node:child_process";
import { cpSync, existsSync, mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import chapter from "../src/content/chapters/ch27.json";
import shared from "../src/content/shared.json";
import { runFunctionTest } from "../assets/js/runner-core.js";
import type { FuncDef, Section } from "../src/types";

const solutions: Record<string, string> = {
  packageRole: `export function packageRole(pkg: string): string | null {
  const short = pkg.startsWith("packages/") ? pkg.slice("packages/".length) : pkg;
  const roles: Record<string, string> = {
    "ai": "pi-ai：LLM 提供商抽象（模型、流式、认证）",
    "agent": "pi-agent-core：Agent 循环与消息类型",
    "tui": "pi-tui：终端 UI 组件",
    "coding-agent": "pi 主包：CLI、四种运行模式、SDK 与扩展体系",
  };
  return roles[short] ?? null;
}`,
  modeOfInvocation: `export function modeOfInvocation(argv: string[]): PiMode | null {
  const i = argv.indexOf("--mode");
  if (i !== -1) {
    const v = argv[i + 1];
    if (v === "rpc" || v === "json") return v;
    return null;
  }
  if (argv.includes("-p") || argv.includes("--print")) return "print";
  return "tui";
}`,
  modeCapability: `export function modeCapability(mode: string): ModeInfo | null {
  const table: Record<string, ModeInfo> = {
    tui: { ctxMode: "tui", hasUI: true, canPromptUser: true },
    rpc: { ctxMode: "rpc", hasUI: true, canPromptUser: true },
    json: { ctxMode: "json", hasUI: false, canPromptUser: false },
    print: { ctxMode: "print", hasUI: false, canPromptUser: false },
  };
  return table[mode] ?? null;
}`,
  pickRunMode: `export function pickRunMode(scenario: string): PiMode | null {
  if (scenario.includes("嵌")) return "rpc";
  if (scenario.includes("单发")) return "print";
  if (scenario.includes("事件流")) return "json";
  if (scenario.includes("终端")) return "tui";
  return null;
}`,
  agentDirEntry: `export function agentDirEntry(name: string): string | null {
  const entries: Record<string, string> = {
    "extensions": "全局扩展目录（*.ts 或 */index.ts 自动发现）",
    "skills": "全局技能目录（SKILL.md）",
    "prompts": "全局提示模板（斜杠命令）",
    "themes": "主题目录",
    "sessions": "会话存储（session.jsonl 按项目分目录）",
    "settings.json": "全局设置（与项目 .pi/settings.json 深合并）",
    "models.json": "自定义模型与供应商",
    "auth.json": "凭据（API Key / OAuth）",
    "models-store.json": "远程模型目录的本地缓存",
  };
  return entries[name] ?? null;
}`,
  resourceScope: `export function resourceScope(path: string): ResourceScope | null {
  if (path.startsWith("~/.pi/agent") || path.startsWith("~/.agents/skills")) return "global";
  if (path.includes("/.pi/") || path.startsWith(".pi/") || path.includes(".agents/skills")) {
    return "project";
  }
  return null;
}`,
  researchEntryPaths: `export function researchEntryPaths(installRoot: string): ResearchPaths | null {
  const root = installRoot.trim().replace(/\\/+$/, "");
  if (root === "") return null;
  return { docs: root + "/docs", examples: root + "/examples", dist: root + "/dist" };
}`,
};

const expectedNames = [
  "packageRole",
  "modeOfInvocation",
  "modeCapability",
  "pickRunMode",
  "agentDirEntry",
  "resourceScope",
  "researchEntryPaths",
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
  localHint?: string;
  functions: FuncDef[];
  sections: Section[];
};

let wiringFailed = 0;

function wire(ok: boolean, msg: string) {
  console.log(ok ? `WIRE PASS  ${msg}` : `WIRE FAIL  ${msg}`);
  if (!ok) wiringFailed++;
}

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const localDir = join(root, "local/m6/ch27");

wire(ch.id === "ch27", `id === ch27 (got ${ch.id})`);
wire(ch.num === "27", `num === 27 (got ${ch.num})`);
wire(ch.title === "仓库地图与四种运行模式", `title (got ${ch.title})`);
wire(ch.runMode === "local", `runMode === local (got ${ch.runMode})`);
wire(ch.testName === "ch27_assignment", `testName (got ${ch.testName})`);
wire(ch.interleaved === true, "interleaved === true");
wire(ch.localHint === "bun test local/m6/ch27", `localHint (got ${ch.localHint})`);
wire(ch.tutorialMd.startsWith("# Ch27 · 仓库地图与四种运行模式"), "H1");
wire(ch.tutorialMd.includes("作业 ↔ 教程对应表"), "front matter 对应表");
wire(ch.tutorialMd.includes("```mermaid"), "至少 1 个 mermaid");
wire(ch.tutorialMd.includes("color:#1f1f1f"), "mermaid 带 color:#1f1f1f");
wire(ch.tutorialMd.includes("Maven"), "Java 对照 Maven");
wire(ch.tutorialMd.includes("workspace") || ch.tutorialMd.includes("uv"), "Python 对照 workspace/uv");
wire(ch.tutorialMd.includes("四种运行模式"), "教程含四种运行模式");
wire(ch.tutorialMd.includes("--mode"), "教程含 --mode");
wire(ch.tutorialMd.includes("~/.pi/agent"), "教程含 ~/.pi/agent");
wire(ch.tutorialMd.includes("packages/ai") && ch.tutorialMd.includes("packages/agent"), "教程含 packages 路径");
wire(ch.tutorialMd.includes("dist/modes") || ch.tutorialMd.includes("dist\\"), "教程含 dist 入口");
wire(ch.tutorialMd.includes("docs") && ch.tutorialMd.includes("examples"), "教程含 docs/examples 入口");
wire(ch.tutorialMd.includes("@earendil-works"), "教程指明事实源包名");
wire(ch.tutorialMd.includes("clone"), "教程说明不 clone");
for (const n of expectedNames) {
  wire(ch.tutorialMd.includes(n), `教程含 ${n}`);
}
wire(ch.tutorialMd.includes("无线鼠标"), "教程含无线鼠标（商品铺主线）");
wire(
  !ch.tutorialMd.includes("bun add @mariozechner") &&
    !ch.tutorialMd.includes("npm install @mariozechner"),
  "不教安装过时 @mariozechner",
);

const homeworkBlob = `${ch.assignment}\n${ch.testSource}\n${ch.preamble}`;
wire(!/^\s*import\s+/m.test(ch.assignment), "JSON assignment 无 import");
wire(!/^\s*import\s+/m.test(ch.testSource), "testSource 无 import");
wire(!/^\s*import\s+/m.test(ch.preamble), "preamble 无 import");
wire(!/\bhono\b/i.test(homeworkBlob), "JSON 作业侧无 hono");
wire(!homeworkBlob.includes("@earendil-works"), "JSON 作业侧无 @earendil-works");
wire(!homeworkBlob.includes("pi-coding-agent"), "JSON 作业侧无 pi-coding-agent");
wire(!/\bfetch\s*\(/.test(homeworkBlob), "JSON 作业侧无 fetch(");
wire(!/\bsetTimeout\s*\(/.test(homeworkBlob), "JSON 作业侧无 setTimeout(");

wire(ch.preamble.includes("type PiMode"), "preamble 含 PiMode");
wire(ch.preamble.includes("type ModeInfo"), "preamble 含 ModeInfo");
wire(ch.preamble.includes("type ResourceScope"), "preamble 含 ResourceScope");
wire(ch.preamble.includes("type ResearchPaths"), "preamble 含 ResearchPaths");
wire(ch.preamble.includes("bun test local/m6/ch27"), "preamble 含本地命令");

wire(ch.reviewMd.includes("四种运行模式") || ch.reviewMd.includes("--mode"), "闪卡含模式");
wire(ch.reviewMd.includes("agents/skills") || ch.reviewMd.includes("global"), "闪卡含作用域");
wire(ch.reviewMd.includes("models-store"), "闪卡含 models-store 坑");
wire(ch.reviewMd.includes("hasUI"), "闪卡含 hasUI");
wire(ch.reviewMd.includes("dist"), "闪卡含研究入口");

const fnNames = ch.functions.map((f) => f.name);
wire(
  expectedNames.length === fnNames.length && expectedNames.every((n, i) => n === fnNames[i]),
  `functions 顺序一致 [${fnNames.join(", ")}]`,
);

for (const f of ch.functions) {
  wire(f.testSuite === f.name, `testSuite === name (${f.name})`);
  wire(f.skeleton.includes(`export function ${f.name}`), `export function ${f.name}`);
  wire(f.skeleton.includes('throw new Error("TODO")'), `${f.name} skeleton TODO`);
  wire(f.skeleton.includes("【场景】") && f.skeleton.includes("【转换点】"), `${f.name} 场景/转换点`);
  wire(ch.tutorialMd.includes("`" + f.name + "`"), `对应表含 ${f.name}`);
  wire(
    ch.sections.some((s) => s.exerciseFunctions.includes(f.name)),
    `${f.name} 挂在某节 exerciseFunctions`,
  );
}

const secNums = ["27.1", "27.2", "27.3", "27.4", "27.5", "27.6", "27.7"];
for (const n of secNums) {
  const s = ch.sections.find((x) => x.secNum === n);
  wire(!!s && s.heading.includes("§" + n), `H2 含 §${n}`);
}

const secFnPairs: Array<[string, string]> = [
  ["27.1", "packageRole"],
  ["27.2", "modeOfInvocation"],
  ["27.3", "modeCapability"],
  ["27.4", "pickRunMode"],
  ["27.5", "agentDirEntry"],
  ["27.6", "resourceScope"],
  ["27.7", "researchEntryPaths"],
];
for (const [n, fn] of secFnPairs) {
  wire(
    ch.sections.find((s) => s.secNum === n)?.exerciseFunctions.includes(fn) === true,
    `§${n} → ${fn}`,
  );
}

const forbiddenMatchers = [".toThrow", ".toContain", ".toMatch", ".toBeTruthy", ".toBeFalsy"];
for (const m of forbiddenMatchers) {
  wire(!ch.testSource.includes(m), `expect 不用 ${m}`);
}
wire(ch.testSource.includes(".toBe("), "JSON 测试含 toBe");
wire(ch.testSource.includes(".toEqual("), "JSON 测试含 toEqual");
wire(ch.testSource.includes(".toBeNull("), "JSON 测试含 toBeNull");
wire(ch.testSource.includes("无线鼠标") || ch.testSource.includes("MS-002"), "JSON 测试含无线鼠标或 MS-002");
wire(ch.testSource.includes("Object.freeze"), "JSON 测试 freeze");
wire(ch.testSource.includes("机械键盘"), "JSON 测试含机械键盘");
wire(
  ch.testSource.includes("packages/agent") && ch.testSource.includes("coding-agent"),
  "JSON 测试防硬编码（不止 ai）",
);
wire(ch.testSource.includes("--mode"), "JSON 测试含 --mode");

const localFiles = ["assignment.ts", "assignment.test.ts", "demo.ts"];
for (const name of localFiles) {
  wire(existsSync(join(localDir, name)), `local 存在 ${name}`);
}
wire(!existsSync(join(localDir, "app.ts")), "M6 章无 app.ts（研究章）");

const assignmentLocal = existsSync(join(localDir, "assignment.ts"))
  ? readFileSync(join(localDir, "assignment.ts"), "utf8")
  : "";
const testLocal = existsSync(join(localDir, "assignment.test.ts"))
  ? readFileSync(join(localDir, "assignment.test.ts"), "utf8")
  : "";
const demoLocal = existsSync(join(localDir, "demo.ts"))
  ? readFileSync(join(localDir, "demo.ts"), "utf8")
  : "";

wire(assignmentLocal.includes('throw new Error("TODO")'), "local assignment 含 TODO");
for (const n of expectedNames) {
  wire(
    assignmentLocal.includes(`export function ${n}`),
    `local assignment export function ${n}`,
  );
}
wire(!assignmentLocal.includes("pi-coding-agent"), "local assignment 无 pi-coding-agent");
wire(!assignmentLocal.includes("@earendil-works"), "local assignment 无 @earendil-works");
wire(!/\bhono\b/i.test(assignmentLocal), "local assignment 无 hono");
wire(!/^\s*import\s+/m.test(assignmentLocal), "local assignment 无 import（本章不用 zod）");
wire(testLocal.includes("bun:test"), "local test 用 bun:test");
for (const n of expectedNames) {
  wire(testLocal.includes(n), `local test 含 ${n}`);
}
wire(testLocal.includes("Object.freeze"), "local test freeze");
wire(!testLocal.includes("pi-coding-agent") && !testLocal.includes("@earendil-works"), "local test 不 import 真包");
wire(!testLocal.includes("demo.ts") && !testLocal.includes("./demo"), "local test 不 import demo.ts");
wire(demoLocal.includes("docs"), "demo.ts 含 docs 入口");
wire(demoLocal.includes("examples"), "demo.ts 含 examples 入口");
wire(demoLocal.includes("dist"), "demo.ts 含 dist 入口");
wire(demoLocal.includes("createAgentSession"), "demo.ts 含 SDK 复制区");
wire(demoLocal.includes("无 Key") || demoLocal.includes("不需要 Key") || demoLocal.includes("不需要 API Key"), "demo.ts 注明无 Key");
wire(demoLocal.includes("clone"), "demo.ts 说明不 clone");
const demoWithoutStrings = demoLocal.replace(/`[\s\S]*?`/g, "").replace(/\/\*[\s\S]*?\*\//g, "");
wire(!/\bfetch\s*\(/.test(demoWithoutStrings), "demo.ts 去掉字符串后无真 fetch(");
wire(
  !/^(?:import|export)\s.+\sfrom\s+['"]@earendil-works/m.test(demoWithoutStrings),
  "demo.ts 去掉字符串后无真 import 包",
);

// tutorialMd 必须能由 sections 机械重拼（公式同 gen 脚本）
const rebuilt = `# Ch27 · 仓库地图与四种运行模式\n\n${ch.sections
  .map((s) => (s.heading ? `## ${s.heading}\n\n${s.body}` : s.body))
  .join("\n\n")}\n`;
wire(rebuilt === ch.tutorialMd, "tutorialMd 与 sections 重拼一致");

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

mkdirSync(join(root, "local/m6"), { recursive: true });
const tmp = mkdtempSync(join(root, "local/m6", "ch27-verify-"));
try {
  cpSync(localDir, tmp, { recursive: true });
  const filled = `${ch.preamble}\n\n${ch.functions
    .map((f) => solutions[f.name])
    .join("\n\n")}\n`;
  writeFileSync(join(tmp, "assignment.ts"), filled);
  const r = spawnSync("bun", ["test", join(tmp, "assignment.test.ts")], {
    encoding: "utf8",
    cwd: root,
  });
  const bunOk = r.status === 0;
  console.log(bunOk ? "PASS bun test (mkdtemp + solutions)" : `FAIL bun test\n${r.stdout}\n${r.stderr}`);
  if (!bunOk) failed++;
  const stillTodo = readFileSync(join(localDir, "assignment.ts"), "utf8").includes(
    'throw new Error("TODO")',
  );
  if (!stillTodo) {
    console.error("FAIL student assignment.ts 被改掉了（应仍是 TODO）");
    failed++;
  } else {
    console.log("PASS student assignment.ts 仍是 TODO");
  }
} finally {
  rmSync(tmp, { recursive: true, force: true });
}

if (failed) {
  console.error(`\n${failed} suite(s) failed`);
  process.exit(1);
}
console.log("\nall green");
