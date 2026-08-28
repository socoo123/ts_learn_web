import { useState } from "react";
import Editor from "@monaco-editor/react";
import type { Chapter, FuncDef, SharedContent } from "../types";
import { runFunctionTest } from "../lib/tsRunner";
import { configureMonaco } from "../lib/monaco";
import Terminal from "./Terminal";

type Status = "idle" | "loading" | "running" | "passed" | "failed" | "error";

interface Props {
  chapter: Chapter;
  shared: SharedContent;
  func: FuncDef;
  codes: Record<string, string>;
  onCodeChange: (name: string, code: string) => void;
}

export default function ExerciseRunner({ chapter, shared, func, codes, onCodeChange }: Props) {
  const code = codes[func.name] ?? func.skeleton;
  const [output, setOutput] = useState("");
  const [status, setStatus] = useState<Status>("idle");

  async function handleRun() {
    try {
      setStatus("running");
      const res = await runFunctionTest({
        testSource: chapter.testSource,
        preamble: chapter.preamble,
        functions: chapter.functions,
        codes: { ...codes, [func.name]: code },
        activeFunction: func.testSuite || func.name,
        productsJson: shared.mocks["products.json"] ?? "[]",
      });
      setOutput(res.output || "(无输出)");
      setStatus(res.returncode === 0 ? "passed" : "failed");
    } catch (e) {
      setOutput("❌ " + (e instanceof Error ? e.message : String(e)));
      setStatus("error");
    }
  }

  function handleReset() {
    onCodeChange(func.name, func.skeleton);
    setOutput("");
    setStatus("idle");
  }

  const busy = status === "running";
  const editorHeight = Math.min(620, Math.max(280, func.skeleton.split("\n").length * 20 + 28));

  return (
    <div className="my-4 rounded-lg border border-border-subtle bg-bg-card p-3">
      <div className="mb-2 flex items-center gap-2">
        <span className="rounded bg-drac-pink/15 px-2 py-0.5 font-mono text-xs text-drac-pink">
          ✏️ {func.name}()
        </span>
        <button
          onClick={handleRun}
          disabled={busy}
          className="ml-auto rounded-md bg-accent px-3 py-1.5 text-xs font-semibold text-drac-bg transition hover:brightness-110 disabled:opacity-60"
        >
          {busy ? "运行中…" : "▶ 运行测试"}
        </button>
        <button
          onClick={handleReset}
          disabled={busy}
          className="rounded-md border border-border-subtle px-2 py-1.5 text-xs text-drac-fg hover:bg-bg-elev disabled:opacity-50"
        >
          ↺ 重置
        </button>
      </div>
      <div className="overflow-hidden rounded-md border border-border-subtle">
        <Editor
          height={editorHeight}
          defaultLanguage="typescript"
          theme="dracula"
          beforeMount={configureMonaco}
          value={code}
          onChange={(v) => onCodeChange(func.name, v ?? "")}
          options={{
            fontSize: 13,
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            tabSize: 2,
            fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
            lineNumbers: "on",
            automaticLayout: true,
          }}
        />
      </div>
      <div className="mt-2">
        <Terminal output={output} status={status} />
      </div>
    </div>
  );
}
