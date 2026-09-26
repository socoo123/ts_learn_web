/**
 * 静态页生成器:src/content/*.json → index.html + chapters/chNN.html + assets/js/data.js
 *
 * 运行:bun scripts/render-pages.ts [--chapter ch07]
 * 幂等:输出与磁盘内容一致时不写盘(内容变更零 diff)。
 * 这是"作者侧"工具(与 gen-chNN.ts 同一批),日常看站不需要跑它——
 * 双击 index.html 即可;只有内容 JSON 变了才需要重新生成。
 */
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";

const ROOT = resolve(import.meta.dir, "..");
const CONTENT_DIR = join(ROOT, "src", "content");
const CHAPTERS_DIR = join(CONTENT_DIR, "chapters");

type ChapterSummary = { id: string; num: string; title: string; runMode: string };
type Module = { id: string; title: string; subtitle: string; dir: string; available: boolean; chapters: ChapterSummary[] };

/** JSON 序列化后把 < 转义,防止内嵌 <script type="application/json"> 被 </script 破壳。 */
function embedJson(value: unknown): string {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}

function render(tpl: string, tokens: Record<string, string>): string {
  return tpl.replace(/\{\{(\w+)\}\}/g, (_, key: string) => tokens[key] ?? "");
}

function writeIfChanged(path: string, content: string, emitted: string[]): void {
  if (existsSync(path) && readFileSync(path, "utf8") === content) return;
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, content, "utf8");
  emitted.push(path.slice(ROOT.length + 1));
}

function parseChapterArg(): string | undefined {
  const argv = process.argv.slice(2);
  const i = argv.indexOf("--chapter");
  if (i !== -1) return argv[i + 1]; // --chapter ch07
  const eq = argv.find((a) => a.startsWith("--chapter="));
  return eq ? eq.split("=")[1] : undefined; // --chapter=ch07
}

function main(): void {
  const onlyChapter = parseChapterArg();

  const index = JSON.parse(readFileSync(join(CONTENT_DIR, "index.json"), "utf8")) as { modules: Module[] };
  const shared = JSON.parse(readFileSync(join(CONTENT_DIR, "shared.json"), "utf8"));

  const generatedIds = readdirSync(CHAPTERS_DIR)
    .filter((f) => /^ch\d+\.json$/.test(f))
    .map((f) => f.replace(/\.json$/, ""))
    .sort();
  const generatedSet = new Set(generatedIds);

  const flat: ChapterSummary[] = index.modules.flatMap((m) => m.chapters);
  const emitted: string[] = [];

  // ===== data.js =====
  const dataJs =
    "/* 由 scripts/render-pages.ts 生成;课程索引 + 共享 mock + 已生成章节清单 */\n" +
    `window.TS_LEARN = { index: ${embedJson(index)}, shared: ${embedJson(shared)}, generated: ${embedJson(generatedIds)} };\n`;
  writeIfChanged(join(ROOT, "assets", "js", "data.js"), dataJs, emitted);

  // ===== index.html =====
  const indexTpl = readFileSync(join(ROOT, "scripts", "templates", "index.html.tpl"), "utf8");
  writeIfChanged(
    join(ROOT, "index.html"),
    render(indexTpl, {
      TITLE: "TypeScript 学习 · 交互式课程",
      SITE_ROOT: "./",
    }),
    emitted,
  );

  // ===== chapters/chNN.html =====
  const chapterTpl = readFileSync(join(ROOT, "scripts", "templates", "chapter.html.tpl"), "utf8");
  const browserScripts = [
    `    <script src="{{SITE_ROOT}}assets/js/vendor/vs/loader.js"></script>`,
    `    <script src="{{SITE_ROOT}}assets/js/runner-core.js"></script>`,
    `    <script src="{{SITE_ROOT}}assets/js/monaco-setup.js"></script>`,
    `    <script src="{{SITE_ROOT}}assets/js/exercise.js"></script>`,
  ].join("\n");

  for (const summary of flat) {
    if (!generatedSet.has(summary.id)) continue;
    if (onlyChapter && summary.id !== onlyChapter) continue;

    const chapterPath = join(CHAPTERS_DIR, `${summary.id}.json`);
    const chapter = JSON.parse(readFileSync(chapterPath, "utf8"));

    const pos = flat.findIndex((c) => c.id === summary.id);
    const prev = pos > 0 ? flat[pos - 1] : null;
    const next = pos >= 0 && pos < flat.length - 1 ? flat[pos + 1] : null;

    writeIfChanged(
      join(ROOT, "chapters", `${summary.id}.html`),
      render(chapterTpl, {
        TITLE: `Ch${chapter.num} · ${chapter.title} — TypeScript 学习`,
        SITE_ROOT: "../",
        CHAPTER_JSON: embedJson(chapter),
        CHAPTER_NAV: embedJson({
          prev: prev ? { id: prev.id, num: prev.num, title: prev.title } : null,
          next: next ? { id: next.id, num: next.num, title: next.title } : null,
        }),
        BROWSER_SCRIPTS: chapter.runMode === "browser" ? browserScripts.replace(/\{\{SITE_ROOT\}\}/g, "../") : "",
      }),
      emitted,
    );
  }

  const target = onlyChapter ? ` (仅 ${onlyChapter})` : "";
  if (emitted.length) {
    console.log(`render-pages: 写出 ${emitted.length} 个文件${target}`);
    for (const f of emitted) console.log(`  ${f}`);
  } else {
    console.log(`render-pages: 全部最新,无需写盘${target}`);
  }
}

main();
