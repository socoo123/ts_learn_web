import type { Monaco } from "@monaco-editor/react";

/** 注册 Dracula 主题,并打开 TS 严格检查(编辑器红线 = 编译期)。 */
export function configureMonaco(monaco: Monaco) {
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
    noSemanticValidation: false,
    noSyntaxValidation: false,
  });

  // 运行器注入全局 z（zod）与 PRODUCTS；作业里不要写 import。
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
}
