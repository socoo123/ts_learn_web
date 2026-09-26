/**
 * 用标准答案跑一遍 Ch29 测试，确认生成的 JSON 与 local 能绿。
 * 运行：bun scripts/verify-ch29.ts
 */
import { spawnSync } from "node:child_process";
import { cpSync, existsSync, mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import chapter from "../src/content/chapters/ch29.json";
import shared from "../src/content/shared.json";
import { runFunctionTest } from "../assets/js/runner-core.js";
import type { FuncDef, Section } from "../src/types";

const solutions: Record<string, string> = {
  extensionFactoryOk: `export function extensionFactoryOk(code: string): boolean {
  if (/export\\s+default\\s+async\\s+function/.test(code)) return true;
  if (/export\\s+default\\s+function/.test(code)) return true;
  if (/export\\s+default\\s+async\\s*\\([^()]*\\)\\s*=>/.test(code)) return true;
  if (/export\\s+default\\s*\\([^()]*\\)\\s*=>/.test(code)) return true;
  if (/export\\s+default\\s+async\\s+\\w+\\s*=>/.test(code)) return true;
  if (/export\\s+default\\s+\\w+\\s*=>/.test(code)) return true;
  return false;
}`,
  skillFromFrontmatter: `export function skillFromFrontmatter(md: string): SkillInfo | null {
  const lines = md.split("\\n");
  if (lines[0]?.trim() !== "---") return null;
  const fields: Record<string, string> = {};
  let closed = false;
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i]!;
    if (line.trim() === "---") {
      closed = true;
      break;
    }
    const idx = line.indexOf(":");
    if (idx === -1) continue;
    fields[line.slice(0, idx).trim()] = line.slice(idx + 1).trim();
  }
  if (!closed) return null;
  const name = fields["name"] ?? "";
  const description = fields["description"] ?? "";
  if (name === "" || description === "") return null;
  return { name, description };
}`,
  skillInvocationMode: `export function skillInvocationMode(md: string): SkillInvocation | null {
  if (skillFromFrontmatter(md) === null) return null;
  const m = md.match(/^disable-model-invocation:\\s*(\\S+)\\s*$/m);
  return m !== null && m[1] === "true" ? "command" : "model";
}`,
  slashNamesFromDir: `export function slashNamesFromDir(files: string[]): string[] {
  const names: string[] = [];
  for (const f of files) {
    if (!f.endsWith(".md") || f.includes("/")) continue;
    const base = f.slice(0, -3);
    if (base !== "") names.push(base);
  }
  return names;
}`,
  resourceKindOf: `export function resourceKindOf(path: string): ResourceKind | null {
  const inDir = (dir: string) => path.includes("/" + dir + "/") || path.startsWith(dir + "/");
  if (inDir("extensions")) return path.endsWith(".ts") || path.endsWith(".js") ? "extension" : null;
  if (inDir("skills")) return path.endsWith(".md") ? "skill" : null;
  if (inDir("prompts")) return path.endsWith(".md") ? "prompt" : null;
  if (inDir("themes")) return path.endsWith(".json") ? "theme" : null;
  return null;
}`,
  parseInstallSpec: `export function parseInstallSpec(spec: string): InstallSpec | null {
  const s = spec.trim();
  if (s === "") return null;
  if (s.startsWith("npm:")) {
    const rest = s.slice(4);
    if (rest === "") return null;
    if (rest.startsWith("@")) {
      const at = rest.indexOf("@", 1);
      if (at === -1) return { source: "npm", name: rest, ref: null };
      return { source: "npm", name: rest.slice(0, at), ref: rest.slice(at + 1) };
    }
    const at = rest.lastIndexOf("@");
    if (at > 0) return { source: "npm", name: rest.slice(0, at), ref: rest.slice(at + 1) };
    return { source: "npm", name: rest, ref: null };
  }
  if (s.startsWith("git:")) {
    const rest = s.slice(4);
    const at = rest.lastIndexOf("@");
    const namePart = rest.slice(0, at);
    if (at > 0 && (namePart.includes("/") || namePart.includes(":"))) {
      return { source: "git", name: namePart, ref: rest.slice(at + 1) };
    }
    return { source: "git", name: rest, ref: null };
  }
  if (s.startsWith("https://") || s.startsWith("ssh://") || s.startsWith("git://")) {
    return { source: "git", name: s, ref: null };
  }
  if (s.startsWith("/") || s.startsWith("./") || s.startsWith("../")) {
    return { source: "local", name: s, ref: null };
  }
  return null;
}`,
  bundledResources: `export function bundledResources(pkgJson: string): PiPackageResources | null {
  let parsed: unknown;
  try {
    parsed = JSON.parse(pkgJson);
  } catch {
    return null;
  }
  if (typeof parsed !== "object" || parsed === null) return null;
  const pkg = parsed as { pi?: Record<string, unknown> };
  const normalize = (entry: unknown): string[] =>
    Array.isArray(entry)
      ? entry
          .filter((v): v is string => typeof v === "string")
          .map((v) => v.replace(/^\\.\\//, ""))
      : [];
  if (pkg.pi === undefined) {
    return {
      extensions: ["extensions/"],
      skills: ["skills/"],
      prompts: ["prompts/"],
      themes: ["themes/"],
    };
  }
  return {
    extensions: normalize(pkg.pi["extensions"]),
    skills: normalize(pkg.pi["skills"]),
    prompts: normalize(pkg.pi["prompts"]),
    themes: normalize(pkg.pi["themes"]),
  };
}`,
};

const expectedNames = [
  "extensionFactoryOk",
  "skillFromFrontmatter",
  "skillInvocationMode",
  "slashNamesFromDir",
  "resourceKindOf",
  "parseInstallSpec",
  "bundledResources",
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
const localDir = join(root, "local/m6/ch29");

wire(ch.id === "ch29", `id === ch29 (got ${ch.id})`);
wire(ch.num === "29", `num === 29 (got ${ch.num})`);
wire(ch.title === "扩展四件套：Extension / Skill / Template / Package", `title (got ${ch.title})`);
wire(ch.runMode === "local", `runMode === local (got ${ch.runMode})`);
wire(ch.testName === "ch29_assignment", `testName (got ${ch.testName})`);
wire(ch.interleaved === true, "interleaved === true");
wire(ch.localHint === "bun test local/m6/ch29", `localHint (got ${ch.localHint})`);
wire(ch.tutorialMd.startsWith("# Ch29 · 扩展四件套"), "H1");
wire(ch.tutorialMd.includes("作业 ↔ 教程对应表"), "front matter 对应表");
wire(ch.tutorialMd.includes("```mermaid"), "至少 1 个 mermaid");
const mermaidCount = (ch.tutorialMd.match(/```mermaid/g) ?? []).length;
wire(mermaidCount >= 5 && mermaidCount <= 8, `mermaid 数量 5–8（got ${mermaidCount}）`);
wire(ch.tutorialMd.includes("color:#1f1f1f"), "mermaid 带 color:#1f1f1f");
wire(ch.tutorialMd.includes("Maven") || ch.tutorialMd.includes("Spring"), "Java 对照 Maven/Spring");
wire(ch.tutorialMd.includes("entry_points") || ch.tutorialMd.includes("PyPI") || ch.tutorialMd.includes("cookiecutter"), "Python 对照 entry_points/PyPI/cookiecutter");
wire(ch.tutorialMd.includes("jiti"), "教程含 jiti");
wire(ch.tutorialMd.includes("export default"), "教程含 export default 入口");
wire(ch.tutorialMd.includes("SKILL.md"), "教程含 SKILL.md");
wire(ch.tutorialMd.includes("渐进披露"), "教程含渐进披露");
wire(ch.tutorialMd.includes("disable-model-invocation"), "教程含 disable-model-invocation");
wire(ch.tutorialMd.includes("/skill:"), "教程含 /skill: 命令");
wire(ch.tutorialMd.includes("prompts/"), "教程含 prompts/");
wire(ch.tutorialMd.includes("pi install"), "教程含 pi install");
wire(ch.tutorialMd.includes("manifest"), "教程含 pi manifest");
wire(ch.tutorialMd.includes("registerCommand") || ch.tutorialMd.includes("registerTool"), "教程含 registerCommand/registerTool");
wire(ch.tutorialMd.includes("/reload"), "教程含 /reload 热重载");
wire(ch.tutorialMd.includes("~/.pi/agent"), "教程含 ~/.pi/agent");
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

wire(ch.preamble.includes("type SkillInfo"), "preamble 含 SkillInfo");
wire(ch.preamble.includes("type SkillInvocation"), "preamble 含 SkillInvocation");
wire(ch.preamble.includes("type ResourceKind"), "preamble 含 ResourceKind");
wire(ch.preamble.includes("type InstallSpec"), "preamble 含 InstallSpec");
wire(ch.preamble.includes("type PiPackageResources"), "preamble 含 PiPackageResources");
wire(ch.preamble.includes("bun test local/m6/ch29"), "preamble 含本地命令");

wire(ch.reviewMd.includes("SKILL.md"), "闪卡含 SKILL.md");
wire(ch.reviewMd.includes("disable-model-invocation"), "闪卡含 disable-model-invocation");
wire(ch.reviewMd.includes("jiti"), "闪卡含 jiti");
wire(ch.reviewMd.includes("manifest"), "闪卡含 manifest/约定目录");
wire(ch.reviewMd.includes("披露"), "闪卡含渐进披露");

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

const secNums = ["29.1", "29.2", "29.3", "29.4", "29.5", "29.6", "29.7"];
for (const n of secNums) {
  const s = ch.sections.find((x) => x.secNum === n);
  wire(!!s && s.heading.includes("§" + n), `H2 含 §${n}`);
}

const secFnPairs: Array<[string, string]> = [
  ["29.1", "extensionFactoryOk"],
  ["29.2", "skillFromFrontmatter"],
  ["29.3", "skillInvocationMode"],
  ["29.4", "slashNamesFromDir"],
  ["29.5", "resourceKindOf"],
  ["29.6", "parseInstallSpec"],
  ["29.7", "bundledResources"],
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
wire(ch.testSource.includes("KB-001") || ch.testSource.includes("机械键盘"), "JSON 测试含 KB-001 或机械键盘");
wire(ch.testSource.includes("Object.freeze"), "JSON 测试 freeze");
wire(ch.testSource.includes("disable-model-invocation"), "JSON 测试含 disable-model-invocation");
wire(ch.testSource.includes("npm:@foo/bar@1.0.0"), "JSON 测试含 scoped npm spec");
wire(ch.testSource.includes("git:git@github.com:user/repo"), "JSON 测试含 git@ shorthand");

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
wire(demoLocal.includes("extensions.md") && demoLocal.includes("skills.md"), "demo.ts 含 extensions/skills 文档入口");
wire(demoLocal.includes("prompt-templates.md") && demoLocal.includes("packages.md"), "demo.ts 含 templates/packages 文档入口");
wire(demoLocal.includes("registerCommand") || demoLocal.includes("registerTool"), "demo.ts 含真扩展 API 复制区");
wire(demoLocal.includes("pi install"), "demo.ts 含 pi install");
wire(demoLocal.includes("SKILL.md"), "demo.ts 含 SKILL.md 复制区");
wire(demoLocal.includes("jiti"), "demo.ts 注明 jiti");
wire(demoLocal.includes("无 Key") || demoLocal.includes("不需要 Key") || demoLocal.includes("不需要 API Key"), "demo.ts 注明无 Key");
wire(demoLocal.includes("clone"), "demo.ts 说明不 clone");
const demoWithoutStrings = demoLocal.replace(/`[\s\S]*?`/g, "").replace(/\/\*[\s\S]*?\*\//g, "");
wire(!/\bfetch\s*\(/.test(demoWithoutStrings), "demo.ts 去掉字符串后无真 fetch(");
wire(
  !/^(?:import|export)\s.+\sfrom\s+['"]@earendil-works/m.test(demoWithoutStrings),
  "demo.ts 去掉字符串后无真 import 包",
);

// tutorialMd 必须能由 sections 机械重拼（公式同 gen 脚本）
const rebuilt = `# Ch29 · 扩展四件套：Extension / Skill / Template / Package\n\n${ch.sections
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
const tmp = mkdtempSync(join(root, "local/m6", "ch29-verify-"));
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
