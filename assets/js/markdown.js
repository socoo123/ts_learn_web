/**
 * Markdown 渲染(src/components/MarkdownView.tsx 的移植):
 * marked(GFM)+ highlight.js + ```mermaid fence 拦截。
 * 对齐原 rehype-highlight 行为:无语言 → highlightAuto(detect:true),
 * 未知语言 → 原样保留(ignoreMissing:true)。
 */
(function (root) {
  "use strict";

  function highlightCodeBlock(codeEl) {
    var hljs = root.hljs;
    if (!hljs) return;
    var m = /language-([\w+-]+)/.exec(codeEl.className || "");
    var text = codeEl.textContent || "";
    if (m && m[1] === "mermaid") return; // 由 mermaid 分支处理
    if (!m) {
      codeEl.innerHTML = hljs.highlightAuto(text).value;
      return;
    }
    var lang = m[1];
    if (!hljs.getLanguage(lang)) return; // ignoreMissing
    codeEl.innerHTML = hljs.highlight(text, { language: lang, ignoreIllegals: true }).value;
  }

  /**
   * 把 markdown 渲染进 container:
   * marked 出 HTML → mermaid fence 换成 <div class="mermaid-block"> → 其余 code 高亮。
   */
  function renderMarkdown(container, mdText) {
    container.className = "tutorial";
    container.innerHTML = root.marked.parse(mdText, { gfm: true, breaks: false });

    // 1) mermaid fence:<pre><code class="language-mermaid"> → 图宿主
    var mermaidJobs = [];
    Array.from(container.querySelectorAll("pre > code")).forEach(function (codeEl) {
      var m = /language-([\w+-]+)/.exec(codeEl.className || "");
      if (!m || m[1] !== "mermaid") return;
      var pre = codeEl.parentNode;
      var host = document.createElement("div");
      host.className = "mermaid-block";
      pre.parentNode.replaceChild(host, pre);
      mermaidJobs.push([host, codeEl.textContent || ""]);
    });

    // 2) 普通代码高亮
    Array.from(container.querySelectorAll("pre > code")).forEach(highlightCodeBlock);

    // 3) mermaid 懒加载渲染
    if (mermaidJobs.length && root.TSDiagrams) {
      mermaidJobs.forEach(function (job) {
        root.TSDiagrams.renderMermaid(job[0], job[1]);
      });
    }
  }

  root.TSMarkdown = { renderMarkdown: renderMarkdown };
})(typeof globalThis !== "undefined" ? globalThis : this);
