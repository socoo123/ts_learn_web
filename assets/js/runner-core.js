/**
 * 浏览器内 TypeScript 运行器(经典脚本版,src/lib/tsRunner.ts 的移植)。
 *
 * 编辑器里 Monaco 做编译期红线;点「运行测试」则:
 * 1. 拼 preamble + 各函数实现
 * 2. tsc 转译成 JS(类型擦掉,和真实 tsc/Bun 一样)
 * 3. 用自研 expect()/describe()/it() 跑该函数的测试套件
 *
 * 同一份文件被两处使用:
 * - 站点页面:经典 <script> 加载 → window.TSLearnRunner(ts/z 从全局懒取,由 exercise.js 懒注入)
 * - scripts/verify-chNN.ts:bun 以 CJS 导入 → require("typescript") / require("zod")
 * (CJS 分支带 typeof window === "undefined" 守卫,防止被 Monaco AMD 的全局 require 误入。)
 */
(function (root, factory) {
  "use strict";
  var api;
  if (typeof module === "object" && module.exports && typeof require === "function" && typeof window === "undefined") {
    api = factory(
      function () { return require("typescript"); },
      function () { return require("zod").z; },
    );
    module.exports = { runFunctionTest: api.runFunctionTest };
  } else {
    api = factory(
      function () { return root.ts; },
      function () { return root.z; },
    );
    root.TSLearnRunner = api;
  }
})(typeof globalThis !== "undefined" ? globalThis : this, function (loadTs, loadZ) {
  function RunResult(returncode, output) {
    return { returncode: returncode, output: output };
  }

  var TEST_TIMEOUT_MS = 4000;

  function withTimeout(value, ms) {
    return new Promise(function (resolve, reject) {
      var timer = setTimeout(function () {
        reject(new Error("测试超时（>" + ms + "ms）。不要用真实等待，Promise 应立即 settle。"));
      }, ms);
      Promise.resolve(value).then(
        function (v) {
          clearTimeout(timer);
          resolve(v);
        },
        function (e) {
          clearTimeout(timer);
          reject(e);
        },
      );
    });
  }

  function AssertionError(message) {
    var err = new Error(message);
    err.name = "AssertionError";
    return err;
  }

  function deepEqual(a, b) {
    if (Object.is(a, b)) return true;
    if (typeof a !== typeof b) return false;
    if (a === null || b === null) return a === b;
    if (typeof a !== "object") return false;
    if (Array.isArray(a) !== Array.isArray(b)) return false;
    if (Array.isArray(a) && Array.isArray(b)) {
      return a.length === b.length && a.every(function (x, i) { return deepEqual(x, b[i]); });
    }
    var ak = Object.keys(a);
    var bk = Object.keys(b);
    if (ak.length !== bk.length) return false;
    return ak.every(function (k) { return deepEqual(a[k], b[k]); });
  }

  function repr(v) {
    if (typeof v === "string") return JSON.stringify(v);
    if (typeof v === "undefined") return "undefined";
    try {
      return JSON.stringify(v);
    } catch (e) {
      return String(v);
    }
  }

  function expect(actual) {
    return {
      toBe: function (expected) {
        if (!Object.is(actual, expected)) {
          throw AssertionError("期望 " + repr(expected) + "，实际 " + repr(actual));
        }
      },
      toEqual: function (expected) {
        if (!deepEqual(actual, expected)) {
          throw AssertionError("期望 " + repr(expected) + "，实际 " + repr(actual));
        }
      },
      toBeNull: function () {
        if (actual !== null) {
          throw AssertionError("期望 null，实际 " + repr(actual));
        }
      },
      toBeInstanceOf: function (ctor) {
        if (!(actual instanceof ctor)) {
          throw AssertionError("期望 instanceof " + ctor.name + "，实际 " + repr(actual));
        }
      },
    };
  }

  function stripExports(source) {
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

  function transpile(ts, source) {
    var result = ts.transpileModule(source, {
      compilerOptions: {
        target: ts.ScriptTarget.ES2020,
        module: ts.ModuleKind.None,
        strict: true,
        removeComments: false,
      },
      reportDiagnostics: true,
      fileName: "assignment.ts",
    });
    var errors = (result.diagnostics || [])
      .filter(function (d) { return d.category === ts.DiagnosticCategory.Error; })
      .map(function (d) {
        var msg = ts.flattenDiagnosticMessageText(d.messageText, "\n");
        if (d.start != null) {
          var line = source.slice(0, d.start).split("\n").length;
          return "assignment.ts:" + line + ": " + msg;
        }
        return msg;
      });
    return { js: result.outputText, errors: errors };
  }

  function assembleAssignment(opts) {
    var bodies = opts.functions
      .map(function (f) { return opts.codes[f.name] != null ? opts.codes[f.name] : f.skeleton; })
      .join("\n\n");
    return opts.preamble + "\n\n" + bodies + "\n";
  }

  async function runFunctionTest(opts) {
    var ts = loadTs();
    var z = loadZ();
    if (!ts || !z) {
      return RunResult(1, "❌ 运行器尚未就绪（typescript / zod 还在加载）。请稍等片刻再点「运行测试」。");
    }

    var assignment = stripExports(assembleAssignment(opts));
    var tests = stripExports(opts.testSource);
    var combined = assignment + "\n\n" + tests + "\n";
    var transpiled = transpile(ts, combined);

    var lines = [];
    if (transpiled.errors.length) {
      lines.push("⚠️ 转译诊断（语法）：");
      transpiled.errors.forEach(function (e) { lines.push("  " + e); });
      lines.push("");
    }

    var collected = [];
    var currentSuite = "";

    function describe(suite, fn) {
      currentSuite = suite;
      fn();
    }
    function it(name, fn) {
      collected.push({ suite: currentSuite, name: name, fn: fn });
    }

    var products;
    try {
      products = JSON.parse(opts.productsJson);
    } catch (e) {
      return RunResult(1, "❌ 无法解析 products.json：" + (e instanceof Error ? e.message : String(e)));
    }

    try {
      var runner = new Function(
        "describe",
        "it",
        "expect",
        "PRODUCTS",
        "z",
        transpiled.js + "\n//# sourceURL=assignment.js",
      );
      runner(describe, it, expect, products, z);
    } catch (e) {
      var msg = e instanceof Error ? e.name + ": " + e.message : String(e);
      return RunResult(1, lines.concat(["❌ 运行失败", msg]).join("\n"));
    }

    var suite = opts.activeFunction;
    var cases = collected.filter(function (c) { return c.suite === suite; });
    if (cases.length === 0) {
      var known = Array.from(new Set(collected.map(function (c) { return c.suite; }))).join(", ");
      return RunResult(1, '❌ 没有找到测试套件 "' + suite + '"。已有：' + (known || "(空)"));
    }

    var passed = 0;
    var failed = 0;
    lines.push("▶ " + suite + "  ·  " + cases.length + " 个用例\n");
    for (var ci = 0; ci < cases.length; ci++) {
      var c = cases[ci];
      try {
        await withTimeout(c.fn(), TEST_TIMEOUT_MS);
        lines.push("  ✅ " + c.name);
        passed++;
      } catch (e) {
        failed++;
        var failureMsg = e instanceof Error ? e.message : String(e);
        lines.push("  ❌ " + c.name);
        lines.push("     " + failureMsg);
      }
    }
    lines.push("");
    if (failed === 0) {
      lines.push("全绿 " + passed + "/" + cases.length + "  ·  这题过了");
    } else {
      lines.push("失败 " + failed + "  ·  通过 " + passed + "/" + cases.length);
    }

    return RunResult(failed === 0 ? 0 : 1, lines.join("\n"));
  }

  return { runFunctionTest: runFunctionTest };
});
