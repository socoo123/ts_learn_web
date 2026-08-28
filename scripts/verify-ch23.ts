/**
 * 用标准答案跑一遍 Ch23 测试，确认生成的 JSON 与 local 能绿。
 * 运行：bun scripts/verify-ch23.ts
 */
import { spawnSync } from "node:child_process";
import { cpSync, existsSync, mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import chapter from "../src/content/chapters/ch23.json";
import shared from "../src/content/shared.json";
import { runFunctionTest } from "../src/lib/tsRunner";
import type { FuncDef, Section } from "../src/types";

const solutions: Record<string, string> = {
  lookupProductTool: `export function lookupProductTool(): AgentToolDef {
  return {
    name: "lookupProduct",
    label: "查询商品",
    description: "按 SKU 查商品名称、库存和单价",
    parameters: {
      type: "object",
      required: ["sku"],
      properties: {
        sku: { type: "string", description: "商品 SKU，例如 KB-001" },
      },
    },
  };
}`,
  calcLineTotalTool: `export function calcLineTotalTool(): AgentToolDef {
  return {
    name: "calcLineTotal",
    label: "计算小计",
    description: "数量乘单价得到行小计",
    parameters: {
      type: "object",
      required: ["qty", "unitPrice"],
      properties: {
        qty: { type: "number", description: "购买数量，整数 ≥ 1" },
        unitPrice: { type: "number", description: "单价" },
      },
    },
  };
}`,
  executeLookup: `export function executeLookup(products: Product[], sku: string): LookupHit | null {
  if (sku === "") return null;
  const found = products.find((p) => p.sku === sku);
  if (!found) return null;
  return { sku: found.sku, name: found.name, stock: found.stock, price: found.price };
}`,
  executeCalc: `export function executeCalc(qty: number, unitPrice: number): number | null {
  if (!Number.isInteger(qty) || qty < 1) return null;
  if (typeof unitPrice !== "number" || !Number.isFinite(unitPrice) || unitPrice < 0) return null;
  return qty * unitPrice;
}`,
  shouldCallTool: `export function shouldCallTool(userText: string): "lookupProduct" | "calcLineTotal" | null {
  if (userText.includes("bash") || userText.includes("写文件")) return null;
  if (userText.includes("小计") || userText.includes("多少钱")) return "calcLineTotal";
  if (userText.includes("库存") || /[A-Z]{2}-\\d{3}/.test(userText)) return "lookupProduct";
  return null;
}`,
  formatToolResult: `export function formatToolResult(name: "lookupProduct" | "calcLineTotal", payload: unknown): string {
  if (name === "lookupProduct") {
    if (payload === null) return "未找到该 SKU";
    if (payload !== null && typeof payload === "object") {
      const o = payload as Record<string, unknown>;
      if (
        typeof o.sku === "string" &&
        typeof o.name === "string" &&
        typeof o.stock === "number" &&
        typeof o.price === "number"
      ) {
        return \`\${o.sku} \${o.name} 库存 \${o.stock} 单价 \${o.price}\`;
      }
    }
    return "";
  }
  if (typeof payload === "number" && Number.isFinite(payload)) return \`小计 \${payload}\`;
  return "";
}`,
  applyToolCall: `export function applyToolCall(
  products: Product[],
  name: "lookupProduct" | "calcLineTotal",
  args: { sku?: string; qty?: number; unitPrice?: number },
): string {
  if (name === "lookupProduct") {
    return formatToolResult("lookupProduct", executeLookup(products, args.sku ?? ""));
  }
  return formatToolResult("calcLineTotal", executeCalc(args.qty ?? 0, args.unitPrice ?? -1));
}`,
};

const expectedNames = [
  "lookupProductTool",
  "calcLineTotalTool",
  "executeLookup",
  "executeCalc",
  "shouldCallTool",
  "formatToolResult",
  "applyToolCall",
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

function hasIdentCall(src: string, name: string): boolean {
  return new RegExp(`\\b${name}\\s*\\(`).test(src);
}

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const localDir = join(root, "local/m5/ch23");

wire(ch.id === "ch23", `id === ch23 (got ${ch.id})`);
wire(ch.num === "23", `num === 23 (got ${ch.num})`);
wire(ch.title === "pi-agent-core：最小 Agent + Tool", `title (got ${ch.title})`);
wire(ch.runMode === "local", `runMode === local (got ${ch.runMode})`);
wire(ch.testName === "ch23_assignment", `testName (got ${ch.testName})`);
wire(ch.interleaved === true, "interleaved === true");
wire(ch.localHint === "bun test local/m5/ch23", `localHint (got ${ch.localHint})`);
wire(ch.tutorialMd.startsWith("# Ch23 · pi-agent-core：最小 Agent + Tool"), "H1");
wire(ch.tutorialMd.includes("作业 ↔ 教程对应表"), "front matter 对应表");
wire(ch.tutorialMd.includes("Ch24"), "下一步指向 Ch24");
wire(ch.tutorialMd.includes("自定义 Tool 与事件"), "下一步含 Ch24 标题");
wire(ch.tutorialMd.includes("```mermaid"), "至少 1 个 mermaid");
wire(ch.tutorialMd.includes("color:#1f1f1f"), "mermaid 带 color:#1f1f1f");
wire(ch.tutorialMd.includes("@earendil-works/pi-agent-core"), "教程含 @earendil-works/pi-agent-core");
wire(ch.tutorialMd.includes("new Agent"), "教程含 new Agent");
wire(ch.tutorialMd.includes("streamFn"), "教程含 streamFn");
wire(ch.tutorialMd.includes("AgentTool"), "教程含 AgentTool");
wire(ch.tutorialMd.includes("Type.Object"), "教程含 Type.Object");
wire(ch.tutorialMd.includes("@Service"), "Java 对照 @Service");
wire(
  ch.tutorialMd.includes("LangChain") || ch.tutorialMd.includes("FastAPI"),
  "Python 对照 LangChain / FastAPI",
);
wire(
  !ch.tutorialMd.includes("bun add @mariozechner") &&
    !ch.tutorialMd.includes("npm install @mariozechner"),
  "不教安装过时 @mariozechner",
);
wire(ch.tutorialMd.includes("Ch25") && ch.tutorialMd.includes("不讲"), "点到 createAgentSession 在 Ch25、本章不讲");
wire(ch.tutorialMd.includes("beforeToolCall"), "点到 beforeToolCall 留给 Ch24");
wire(
  !/export function (prompt|rag|react)/i.test(ch.assignment),
  "作业不导出 Prompt/RAG/ReAct",
);
wire(
  ch.tutorialMd.includes("不重复") && ch.tutorialMd.includes("RAG"),
  "教程声明不重复 Prompt/RAG/ReAct 原理",
);

const homeworkBlob = `${ch.assignment}\n${ch.testSource}\n${ch.preamble}`;
wire(!/^\s*import\s+/m.test(ch.assignment), "assignment 无 import");
wire(!/^\s*import\s+/m.test(ch.testSource), "testSource 无 import");
wire(!/^\s*import\s+/m.test(ch.preamble), "preamble 无 import");
wire(!/\bhono\b/i.test(homeworkBlob), "JSON 作业侧无 hono");
wire(!homeworkBlob.includes("@earendil-works"), "JSON 作业侧无 @earendil-works");
wire(!homeworkBlob.includes("pi-ai"), "JSON 作业侧无 pi-ai");
wire(!homeworkBlob.includes("pi-agent-core"), "JSON 作业侧无 pi-agent-core");
wire(!/\bfetch\s*\(/.test(homeworkBlob), "JSON 作业侧无 fetch(");
wire(!/\bsetTimeout\s*\(/.test(homeworkBlob), "JSON 作业侧无 setTimeout(");

wire(ch.preamble.includes("type Product ="), "preamble 含 Product");
wire(ch.preamble.includes("type ToolParamProp"), "preamble 含 ToolParamProp");
wire(ch.preamble.includes("type AgentToolDef"), "preamble 含 AgentToolDef");
wire(ch.preamble.includes("type LookupHit"), "preamble 含 LookupHit");

wire(ch.reviewMd.includes("Agent") && (ch.reviewMd.includes("stream") || ch.reviewMd.includes("streamFn")), "闪卡含 Agent vs stream");
wire(ch.reviewMd.includes("模型"), "闪卡含模型决定调工具");
wire(ch.reviewMd.includes("throw"), "闪卡含 execute throw");
wire(ch.reviewMd.includes("Key") || ch.reviewMd.includes("streamFn"), "闪卡含无 Key / 假 streamFn");
wire(ch.reviewMd.includes("bash"), "闪卡含禁止 bash");
wire(ch.reviewMd.includes("applyToolCall"), "闪卡含 applyToolCall 复用");

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

wire(
  (ch.functions.find((f) => f.name === "applyToolCall")?.skeleton ?? "").includes("executeLookup"),
  "applyToolCall 骨架提示调用 executeLookup",
);

const secNums = ["23.1", "23.2", "23.3", "23.4", "23.5", "23.6", "23.7"];
for (const n of secNums) {
  const s = ch.sections.find((x) => x.secNum === n);
  wire(!!s && s.heading.includes("§" + n), `H2 含 §${n}`);
}

wire(
  ch.sections.find((s) => s.secNum === "23.1")?.exerciseFunctions.includes("lookupProductTool") === true,
  "§23.1 → lookupProductTool",
);
wire(
  ch.sections.find((s) => s.secNum === "23.2")?.exerciseFunctions.includes("calcLineTotalTool") === true,
  "§23.2 → calcLineTotalTool",
);
wire(
  ch.sections.find((s) => s.secNum === "23.3")?.exerciseFunctions.includes("executeLookup") === true,
  "§23.3 → executeLookup",
);
wire(
  ch.sections.find((s) => s.secNum === "23.4")?.exerciseFunctions.includes("executeCalc") === true,
  "§23.4 → executeCalc",
);
wire(
  ch.sections.find((s) => s.secNum === "23.5")?.exerciseFunctions.includes("shouldCallTool") === true,
  "§23.5 → shouldCallTool",
);
wire(
  ch.sections.find((s) => s.secNum === "23.6")?.exerciseFunctions.includes("formatToolResult") === true,
  "§23.6 → formatToolResult",
);
wire(
  ch.sections.find((s) => s.secNum === "23.7")?.exerciseFunctions.includes("applyToolCall") === true,
  "§23.7 → applyToolCall",
);

const forbiddenMatchers = [".toThrow", ".toContain", ".toMatch", ".toBeTruthy", ".toBeFalsy"];
for (const m of forbiddenMatchers) {
  wire(!ch.testSource.includes(m), `expect 不用 ${m}`);
}
wire(ch.testSource.includes(".toBe("), "JSON 测试含 toBe");
wire(ch.testSource.includes(".toEqual("), "JSON 测试含 toEqual");
wire(ch.testSource.includes(".toBeNull("), "JSON 测试含 toBeNull");
wire(ch.testSource.includes("无线鼠标") || ch.testSource.includes("MS-002"), "JSON 测试含无线鼠标或 MS-002");
wire(ch.testSource.includes("Object.freeze"), "JSON 测试 freeze");
wire(ch.testSource.includes("477"), "JSON 测试含 477 防硬编码");

wire(hasIdentCall(solutions.applyToolCall, "executeLookup"), "applyToolCall 答案调用 executeLookup");
wire(hasIdentCall(solutions.applyToolCall, "executeCalc"), "applyToolCall 答案调用 executeCalc");
wire(hasIdentCall(solutions.applyToolCall, "formatToolResult"), "applyToolCall 答案调用 formatToolResult");

const localFiles = ["assignment.ts", "app.ts", "assignment.test.ts", "demo.ts"];
for (const name of localFiles) {
  wire(existsSync(join(localDir, name)), `local 存在 ${name}`);
}

const assignmentLocal = existsSync(join(localDir, "assignment.ts"))
  ? readFileSync(join(localDir, "assignment.ts"), "utf8")
  : "";
const appLocal = existsSync(join(localDir, "app.ts"))
  ? readFileSync(join(localDir, "app.ts"), "utf8")
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
wire(!/^\s*import\s+/m.test(assignmentLocal), "local assignment 无 import");
wire(!assignmentLocal.includes("pi-ai"), "local assignment 无 pi-ai");
wire(!assignmentLocal.includes("pi-agent-core"), "local assignment 无 pi-agent-core");
wire(!assignmentLocal.includes("@earendil-works"), "local assignment 无真包名");
wire(appLocal.includes("fakeToolThenTextStream"), "app.ts 含 fakeToolThenTextStream");
wire(appLocal.includes("SHOP_PRODUCTS"), "app.ts 含 SHOP_PRODUCTS");
wire(appLocal.includes("CP-009"), "app.ts 含 CP-009");
wire(appLocal.includes("AsyncGenerator") || appLocal.includes("async function*"), "app.ts 含 async generator");
wire(!/\.listen\b/.test(appLocal) && !appLocal.includes("Bun.serve"), "app.ts 无 listen");
wire(!appLocal.includes("pi-agent-core") && !appLocal.includes("@earendil-works"), "app.ts 无真包");
wire(!/\bfetch\s*\(/.test(appLocal), "app.ts 无 fetch");
wire(testLocal.includes("bun:test"), "local test 用 bun:test");
wire(testLocal.includes("fakeToolThenTextStream"), "local test 迭代 fakeToolThenTextStream");
wire(testLocal.includes("applyToolCall"), "local test 喂 applyToolCall");
wire(testLocal.includes("MS-002") || testLocal.includes("无线鼠标"), "local test 含无线鼠标防硬编码");
wire(!testLocal.includes("pi-agent-core") && !testLocal.includes("@earendil-works"), "local test 不 import 真包");
wire(!testLocal.includes("demo.ts") && !testLocal.includes("./demo"), "local test 不 import demo.ts");
wire(demoLocal.includes("@earendil-works/pi-agent-core"), "demo.ts 含真包名");
wire(demoLocal.includes("new Agent"), "demo.ts 含 new Agent");
wire(demoLocal.includes("AgentTool"), "demo.ts 含 AgentTool");
wire(demoLocal.includes("streamFn"), "demo.ts 含 streamFn");
wire(demoLocal.includes("lookupProduct"), "demo.ts 含 lookupProduct");
wire(demoLocal.includes("Type.Object"), "demo.ts 含 Type.Object");
wire(demoLocal.includes("bun add @earendil-works/pi-agent-core"), "demo.ts 说明 bun add");
wire(
  !demoLocal.includes("bun add @mariozechner") &&
    !demoLocal.includes("npm install @mariozechner") &&
    !demoLocal.includes("from '@mariozechner") &&
    !demoLocal.includes('from "@mariozechner'),
  "demo.ts 不教安装过时 @mariozechner",
);
const demoWithoutStrings = demoLocal.replace(/`[\s\S]*?`/g, "").replace(/\/\*[\s\S]*?\*\//g, "");
wire(
  !/^(?:import|export)\s.+\sfrom\s+['"]@earendil-works/m.test(demoWithoutStrings),
  "demo.ts 去掉字符串后无真 import 包",
);

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

mkdirSync(join(root, "local/m5"), { recursive: true });
const tmp = mkdtempSync(join(root, "local/m5", "ch23-verify-"));
try {
  cpSync(localDir, tmp, { recursive: true });
  const filled = `${ch.preamble}\n\n${ch.functions.map((f) => solutions[f.name]).join("\n\n")}\n`;
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
