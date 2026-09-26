/**
 * Monaco AMD 本地加载 + 配置(src/lib/monaco.ts 的移植)。
 * 只在 browser 章的页面加载(模板里排在 vs/loader.js 之后)。
 * file:// 下 Web Worker 被浏览器拦截 → 关掉语义校验(红线降级),
 * 编辑/运行/判题不受影响;http(启动学习站.command)下全功能。
 */
(function (root) {
  "use strict";

  var SITE_ROOT = root.SITE_ROOT || "./";
  var isFile = location.protocol === "file:";
  var vsUrl = new URL(SITE_ROOT + "assets/js/vendor/vs/", location.href).href;

  // Worker 走 blob 包一层 importScripts(标准 AMD 跨域方案;file: 下可能仍失败,可接受)
  root.MonacoEnvironment = {
    baseUrl: vsUrl,
    getWorkerUrl: function () {
      return URL.createObjectURL(
        new Blob(
          [
            "self.MonacoEnvironment={baseUrl:'" + vsUrl + "'};" +
              "importScripts('" + vsUrl + "vs/base/worker/workerMain.js');",
          ],
          { type: "text/javascript" },
        ),
      );
    },
  };

  /** 注册 Dracula 主题,并打开 TS 严格检查(编辑器红线 = 编译期)。monaco.ts:4-75 移植 */
  function configureMonaco(monaco) {
    monaco.editor.defineTheme("dracula", {
      base: "vs-dark",
      inherit: true,
      rules: [
        { token: "comment", foreground: "6272a4", fontStyle: "italic" },
        { token: "string", foreground: "f1fa8c" },
        { token: "keyword", foreground: "ff79c6" },
        { token: "number", foreground: "bd93f9" },
        { token: "type", foreground: "8be9fd" },
        { token: "function", foreground: "50fa7b" },
        { token: "variable", foreground: "f8f8f2" },
        { token: "constant", foreground: "bd93f9" },
        { token: "delimiter", foreground: "f8f8f2" },
        { token: "operator", foreground: "ff79c6" },
      ],
      colors: {
        "editor.background": "#0d0e13",
        "editor.foreground": "#f8f8f2",
        "editor.lineHighlightBackground": "#262833",
        "editor.selectionBackground": "#44475a",
        "editorCursor.foreground": "#ff79c6",
        "editorGutter.background": "#191a21",
        "editorLineNumber.foreground": "#6272a4",
        "editorLineNumber.activeForeground": "#f8f8f2",
        "editorWidget.background": "#21222c",
        "editor.border": "#44475a",
      },
    });

    monaco.languages.typescript.typescriptDefaults.setCompilerOptions({
      target: monaco.languages.typescript.ScriptTarget.ES2020,
      module: monaco.languages.typescript.ModuleKind.ESNext,
      strict: true,
      noImplicitAny: true,
      strictNullChecks: true,
      moduleResolution: monaco.languages.typescript.ModuleResolutionKind.NodeJs,
    });
    monaco.languages.typescript.typescriptDefaults.setDiagnosticsOptions({
      noSemanticValidation: isFile, // file:// 无 worker,语义校验必然失败
      noSyntaxValidation: false,
    });

    // 运行器注入全局 z(zod)与 PRODUCTS;作业里不要写 import。
    monaco.languages.typescript.typescriptDefaults.addExtraLib(
      `
declare const PRODUCTS: Array<{
  id: number;
  name: string;
  category: string;
  price: number;
  stock: number;
  sku: string;
}>;
interface ZodLike {
  parse(data: unknown): unknown;
  safeParse(data: unknown): { success: true; data: unknown } | { success: false; error: { issues: unknown[] } };
  optional(): ZodLike;
  nullable(): ZodLike;
}
declare const z: {
  object(shape: Record<string, unknown>): ZodLike;
  array(schema: unknown): ZodLike;
  string(): ZodLike;
  number(): ZodLike;
  boolean(): ZodLike;
  infer: unknown;
};
`,
      "ts:runner-globals.d.ts",
    );

    if (isFile) {
      console.info("[ts-learn] file:// 下 Monaco 无法起 TS worker,语义红线已关闭(语法高亮/编辑不受影响);用 启动学习站.command 走 http 可恢复完整智能提示。");
    }
  }

  var readyPromise = new Promise(function (resolve, reject) {
    if (typeof root.require !== "function") {
      reject(new Error("vs/loader.js 未加载"));
      return;
    }
    root.require.config({ paths: { vs: SITE_ROOT + "assets/js/vendor/vs" } });
    root.require(["vs/editor/editor.main"], function () {
      configureMonaco(root.monaco);
      resolve(root.monaco);
    }, function (err) {
      reject(err);
    });
  });

  var api = {
    whenReady: function () { return readyPromise; },
    createEditor: function (container, value, onChange, height) {
      return readyPromise.then(function (monaco) {
        container.textContent = "";
        var editor = monaco.editor.create(container, {
          value: value,
          language: "typescript",
          theme: "dracula",
          fontSize: 13,
          minimap: { enabled: false },
          scrollBeyondLastLine: false,
          tabSize: 2,
          fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
          lineNumbers: "on",
          automaticLayout: true,
        });
        editor.onDidChangeModelContent(function () {
          onChange(editor.getValue());
        });
        return { monaco: monaco, editor: editor };
      });
    },
  };

  root.TSMonaco = api;
})(typeof globalThis !== "undefined" ? globalThis : this);
