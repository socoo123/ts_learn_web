/**
 * 浏览器内 TypeScript 运行器。
 *
 * 编辑器里 Monaco 做编译期红线；点「运行测试」则：
 * 1. 拼 preamble + 各函数实现
 * 2. tsc 转译成 JS（类型擦掉，和真实 tsc/Bun 一样）
 * 3. 用自研 expect()/describe()/it() 跑该函数的测试套件
 */
import ts from "typescript";
import { z } from "zod";
import type { FuncDef } from "../types";

export interface RunResult {
  returncode: number;
  output: string;
}

export interface FunctionRunOptions {
  testSource: string;
  preamble: string;
  functions: FuncDef[];
  codes: Record<string, string>;
  activeFunction: string;
  productsJson: string;
}

interface TestCase {
  suite: string;
  name: string;
  fn: () => unknown;
}

const TEST_TIMEOUT_MS = 4000;

function withTimeout(value: unknown, ms: number): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`测试超时（>${ms}ms）。不要用真实等待，Promise 应立即 settle。`)), ms);
    Promise.resolve(value).then(
      (v) => {
        clearTimeout(timer);
        resolve(v);
      },
      (e) => {
        clearTimeout(timer);
        reject(e);
      },
    );
  });
}

class AssertionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AssertionError";
  }
}

function deepEqual(a: unknown, b: unknown): boolean {
  if (Object.is(a, b)) return true;
  if (typeof a !== typeof b) return false;
  if (a === null || b === null) return a === b;
  if (typeof a !== "object") return false;
  if (Array.isArray(a) !== Array.isArray(b)) return false;
  if (Array.isArray(a) && Array.isArray(b)) {
    return a.length === b.length && a.every((x, i) => deepEqual(x, b[i]));
  }
  const ao = a as Record<string, unknown>;
  const bo = b as Record<string, unknown>;
  const ak = Object.keys(ao);
  const bk = Object.keys(bo);
  if (ak.length !== bk.length) return false;
  return ak.every((k) => deepEqual(ao[k], bo[k]));
}

function repr(v: unknown): string {
  if (typeof v === "string") return JSON.stringify(v);
  if (typeof v === "undefined") return "undefined";
  try {
    return JSON.stringify(v);
  } catch {
    return String(v);
  }
}

function expect(actual: unknown) {
  return {
    toBe(expected: unknown) {
      if (!Object.is(actual, expected)) {
        throw new AssertionError(`期望 ${repr(expected)}，实际 ${repr(actual)}`);
      }
    },
    toEqual(expected: unknown) {
      if (!deepEqual(actual, expected)) {
        throw new AssertionError(`期望 ${repr(expected)}，实际 ${repr(actual)}`);
      }
    },
    toBeNull() {
      if (actual !== null) {
        throw new AssertionError(`期望 null，实际 ${repr(actual)}`);
      }
    },
    toBeInstanceOf(ctor: Function) {
      if (!(actual instanceof ctor)) {
        throw new AssertionError(`期望 instanceof ${ctor.name}，实际 ${repr(actual)}`);
      }
    },
  };
}

function stripExports(source: string): string {
  return source
    .replace(/^\s*import\s+type\s+[^;]+;\s*$/gm, "")
    .replace(/^\s*import\s+[^;]+;\s*$/gm, "")
    .replace(/\bexport\s+async\s+function\b/g, "async function")
    .replace(/\bexport\s+function\b/g, "function")
    .replace(/\bexport\s+type\b/g, "type")
    .replace(/\bexport\s+interface\b/g, "interface")
    .replace(/\bexport\s+const\b/g, "const")
    .replace(/\bexport\s+let\b/g, "let")
    .replace(/\bexport\s+\{[^}]*\}\s*;?/g, "");
}

function transpile(source: string): { js: string; errors: string[] } {
  const result = ts.transpileModule(source, {
    compilerOptions: {
      target: ts.ScriptTarget.ES2020,
      module: ts.ModuleKind.None,
      strict: true,
      removeComments: false,
    },
    reportDiagnostics: true,
    fileName: "assignment.ts",
  });
  const errors = (result.diagnostics ?? [])
    .filter((d) => d.category === ts.DiagnosticCategory.Error)
    .map((d) => {
      const msg = ts.flattenDiagnosticMessageText(d.messageText, "\n");
      if (d.start != null) {
        const line =
          source.slice(0, d.start).split("\n").length;
        return `assignment.ts:${line}: ${msg}`;
      }
      return msg;
    });
  return { js: result.outputText, errors };
}

function assembleAssignment(opts: FunctionRunOptions): string {
  const bodies = opts.functions
    .map((f) => opts.codes[f.name] ?? f.skeleton)
    .join("\n\n");
  return `${opts.preamble}\n\n${bodies}\n`;
}

export async function runFunctionTest(opts: FunctionRunOptions): Promise<RunResult> {
  const assignment = stripExports(assembleAssignment(opts));
  const tests = stripExports(opts.testSource);
  const combined = `${assignment}\n\n${tests}\n`;
  const { js, errors } = transpile(combined);

  const lines: string[] = [];
  if (errors.length) {
    lines.push("⚠️ 转译诊断（语法）：");
    for (const e of errors) lines.push("  " + e);
    lines.push("");
  }

  const collected: TestCase[] = [];
  let currentSuite = "";

  function describe(suite: string, fn: () => void) {
    currentSuite = suite;
    fn();
  }
  function it(name: string, fn: () => unknown) {
    collected.push({ suite: currentSuite, name, fn });
  }

  let products: unknown = [];
  try {
    products = JSON.parse(opts.productsJson);
  } catch (e) {
    return {
      returncode: 1,
      output: "❌ 无法解析 products.json：" + (e instanceof Error ? e.message : String(e)),
    };
  }

  try {
    const runner = new Function(
      "describe",
      "it",
      "expect",
      "PRODUCTS",
      "z",
      js + "\n//# sourceURL=assignment.js",
    );
    runner(describe, it, expect, products, z);
  } catch (e) {
    const msg = e instanceof Error ? `${e.name}: ${e.message}` : String(e);
    return { returncode: 1, output: lines.concat(["❌ 运行失败", msg]).join("\n") };
  }

  const suite = opts.activeFunction;
  const cases = collected.filter((c) => c.suite === suite);
  if (cases.length === 0) {
    const known = [...new Set(collected.map((c) => c.suite))].join(", ");
    return {
      returncode: 1,
      output: `❌ 没有找到测试套件 "${suite}"。已有：${known || "(空)"}`,
    };
  }

  let passed = 0;
  let failed = 0;
  lines.push(`▶ ${suite}  ·  ${cases.length} 个用例\n`);
  for (const c of cases) {
    try {
      await withTimeout(c.fn(), TEST_TIMEOUT_MS);
      lines.push(`  ✅ ${c.name}`);
      passed++;
    } catch (e) {
      failed++;
      const msg = e instanceof Error ? e.message : String(e);
      lines.push(`  ❌ ${c.name}`);
      lines.push(`     ${msg}`);
    }
  }
  lines.push("");
  if (failed === 0) {
    lines.push(`全绿 ${passed}/${cases.length}  ·  这题过了`);
  } else {
    lines.push(`失败 ${failed}  ·  通过 ${passed}/${cases.length}`);
  }

  return { returncode: failed === 0 ? 0 : 1, output: lines.join("\n") };
}
