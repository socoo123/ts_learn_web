import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getChapterSummary, getModule, loadChapter, shared } from "../data/curriculum";
import type { Chapter, FuncDef } from "../types";
import MarkdownView from "../components/MarkdownView";
import ExerciseRunner from "../components/ExerciseRunner";
import RunModeBadge from "../components/RunModeBadge";
import Flashcards from "../components/Flashcards";
import ChapterCompleteToggle from "../components/ChapterCompleteToggle";
import { getFunctionDraft, saveFunctionDraft } from "../lib/learnerState";

type Block = { type: "md"; text: string } | { type: "exercise"; func: FuncDef };

function buildBlocks(chapter: Chapter): Block[] {
  const blocks: Block[] = [];
  let mdBuf = "";
  const flush = () => {
    if (mdBuf.trim()) blocks.push({ type: "md", text: mdBuf });
    mdBuf = "";
  };
  for (const s of chapter.sections) {
    const secMd = (s.heading ? `## ${s.heading}\n\n` : "") + s.body;
    if (s.exerciseFunctions.length) {
      flush();
      blocks.push({ type: "md", text: secMd });
      for (const fname of s.exerciseFunctions) {
        const f = chapter.functions.find((x) => x.name === fname);
        if (f) blocks.push({ type: "exercise", func: f });
      }
    } else {
      mdBuf += secMd + "\n\n";
    }
  }
  flush();
  return blocks;
}

export default function ChapterPage() {
  const { moduleId, chapterId } = useParams();
  const module = moduleId ? getModule(moduleId) : undefined;
  const summary = moduleId && chapterId ? getChapterSummary(moduleId, chapterId) : undefined;
  const [chapter, setChapter] = useState<Chapter | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<"missing" | "fail" | null>(null);
  const [codes, setCodes] = useState<Record<string, string>>({});

  useEffect(() => {
    let cancelled = false;
    setChapter(null);
    setLoadError(null);
    setCodes({});

    if (!summary || !chapterId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    loadChapter(chapterId)
      .then((ch) => {
        if (cancelled) return;
        if (!ch) {
          setLoadError("missing");
          return;
        }
        setChapter(ch);
        const next: Record<string, string> = {};
        for (const f of ch.functions) {
          next[f.name] = getFunctionDraft(ch.id, f.name) ?? f.skeleton;
        }
        setCodes(next);
      })
      .catch(() => {
        if (!cancelled) setLoadError("fail");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [chapterId, summary]);

  function handleCodeChange(name: string, code: string) {
    setCodes((prev) => {
      const next = { ...prev, [name]: code };
      if (chapter) {
        const f = chapter.functions.find((x) => x.name === name);
        saveFunctionDraft(chapter.id, name, code, f?.skeleton ?? "");
      }
      return next;
    });
  }

  if (!module || !summary) {
    return (
      <div className="rounded-lg border border-border-subtle bg-bg-card p-8 text-center text-drac-comment">
        章节不存在。<Link to="/" className="text-accent">返回首页</Link>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="rounded-lg border border-border-subtle bg-bg-card p-8 text-center text-drac-comment">
        加载章节内容…
      </div>
    );
  }

  if (loadError || !chapter) {
    return (
      <div className="rounded-lg border border-border-subtle bg-bg-card p-8 text-center text-drac-comment">
        {loadError === "missing" ? "本章内容尚未生成。" : "章节内容加载失败。"}{" "}
        <Link to={`/m/${module.id}`} className="text-accent">返回模块</Link>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <nav className="text-sm text-drac-comment">
        <Link to="/" className="hover:text-drac-fg">课程地图</Link>
        <span className="mx-2">/</span>
        <Link to={`/m/${module.id}`} className="hover:text-drac-fg">{module.title}</Link>
        <span className="mx-2">/</span>
        <span className="text-drac-fg">Ch{chapter.num}</span>
      </nav>

      <header className="flex flex-wrap items-start justify-between gap-3 border-b border-border-subtle pb-5">
        <div>
          <div className="font-mono text-sm text-accent">第 {chapter.num} 课</div>
          <h1 className="mt-1 text-2xl font-bold text-drac-fg">{chapter.title}</h1>
        </div>
        <RunModeBadge mode={chapter.runMode} />
      </header>

      {chapter.runMode === "local" && (
        <LocalNotice chapter={chapter} moduleDir={module.dir} />
      )}

      {chapter.interleaved ? (
        <div className="space-y-2">
          {buildBlocks(chapter).map((b, i) =>
            b.type === "md" ? (
              <MarkdownView key={i}>{b.text}</MarkdownView>
            ) : chapter.runMode === "local" ? (
              <LocalExerciseCard key={`ex-${b.func.name}`} func={b.func} />
            ) : (
              <ExerciseRunner
                key={`ex-${b.func.name}`}
                chapter={chapter}
                shared={shared}
                func={b.func}
                codes={codes}
                onCodeChange={handleCodeChange}
              />
            ),
          )}
        </div>
      ) : (
        <>
          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-drac-fg">📖 教程</h2>
            <MarkdownView>{chapter.tutorialMd}</MarkdownView>
          </section>
          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-drac-fg">✏️ 作业</h2>
            {chapter.runMode === "local" ? (
              <p className="text-sm text-drac-comment">请按上方命令在仓库 local/ 目录完成作业。</p>
            ) : (
              <p className="text-sm text-drac-comment">请用交错式章节学习（本章未拆练习块）。</p>
            )}
          </section>
        </>
      )}

      {chapter.reviewMd.trim() && (
        <details className="group rounded-lg border border-border-subtle bg-bg-card p-5">
          <summary className="cursor-pointer list-none text-lg font-semibold text-drac-fg">
            🧠 记忆闪卡 <span className="ml-2 text-xs font-normal text-drac-comment group-open:hidden">点开复习</span>
          </summary>
          <div className="mt-4">
            <Flashcards reviewMd={chapter.reviewMd} />
          </div>
        </details>
      )}

      <ChapterCompleteToggle chapterId={chapter.id} />
    </div>
  );
}

function LocalNotice({
  chapter,
  moduleDir,
}: {
  chapter: { num: string; localHint?: string };
  moduleDir: string;
}) {
  const cmd = chapter.localHint ?? `bun test ${moduleDir}/ch${chapter.num}`;
  return (
    <div className="rounded-lg border border-drac-orange/30 bg-drac-orange/5 p-6">
      <div className="font-semibold text-drac-orange">🔒 本章在本地运行</div>
      <p className="mt-3 text-sm text-drac-fg">
        这章依赖 Bun / Hono，浏览器里跑不了。请在仓库的 <code className="rounded bg-bg-elev px-1.5 py-0.5 text-accent">local/</code> 目录改 TODO，然后用下面命令跑测试。
      </p>
      <div className="mt-3 flex items-center gap-2 rounded-md border border-border-subtle bg-bg-card p-3">
        <code className="flex-1 font-mono text-xs text-drac-fg">{cmd}</code>
        <CopyButton text={cmd} />
      </div>
    </div>
  );
}

function LocalExerciseCard({ func }: { func: FuncDef }) {
  return (
    <div className="rounded-lg border border-drac-orange/20 bg-bg-card p-4">
      <div className="font-mono text-sm text-accent">{func.name}</div>
      <p className="mt-1 text-sm text-drac-comment">
        🔒 在本地 <code className="rounded bg-bg-elev px-1 text-accent">assignment.ts</code> 里实现本题，不要在浏览器跑。
      </p>
    </div>
  );
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() =>
        navigator.clipboard?.writeText(text).then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        })
      }
      className="rounded border border-border-subtle px-2 py-1 text-xs text-drac-fg hover:bg-bg-elev"
    >
      {copied ? "已复制 ✓" : "复制"}
    </button>
  );
}
