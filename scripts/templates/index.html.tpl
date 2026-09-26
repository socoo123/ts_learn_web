<!doctype html>
<html lang="zh-CN" data-theme="parchment">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>{{TITLE}}</title>
    <link rel="stylesheet" href="{{SITE_ROOT}}assets/css/style.css" />
    <script>
      try {
        var t = localStorage.getItem("ts-theme");
        document.documentElement.setAttribute(
          "data-theme",
          t === "dracula" ? "dracula" : "parchment",
        );
      } catch (e) {
        document.documentElement.setAttribute("data-theme", "parchment");
      }
    </script>
  </head>
  <body>
    <header class="topbar">
      <div class="topbar-inner">
        <a class="brand" href="{{SITE_ROOT}}index.html"><span class="brand-logo">TS</span><span>TypeScript 学习</span></a>
        <div data-header-progress></div>
        <nav class="topnav">
          <a class="nav-link active" href="{{SITE_ROOT}}index.html">课程地图</a>
          <a class="nav-link" href="https://www.typescriptlang.org/docs/" target="_blank" rel="noreferrer">TS 文档 ↗</a>
          <div class="theme-toggle" data-theme-toggle role="group" aria-label="主题切换">
            <button type="button" data-theme-value="parchment" title="护眼米色" aria-pressed="false">☀️<span class="tt-text">护眼</span></button>
            <button type="button" data-theme-value="dracula" title="德古拉深色" aria-pressed="false">🌙<span class="tt-text">德古拉</span></button>
          </div>
        </nav>
      </div>
    </header>

    <main class="wrap"><div id="page-root"></div></main>

    <footer class="site-footer">TypeScript 学习 · 交互式课程 · 浏览器内转译运行</footer>

    <script>window.SITE_ROOT = "{{SITE_ROOT}}";</script>
    <script src="{{SITE_ROOT}}assets/js/vendor/marked.umd.js"></script>
    <script src="{{SITE_ROOT}}assets/js/vendor/hljs.common.min.js"></script>
    <script src="{{SITE_ROOT}}assets/js/data.js"></script>
    <script src="{{SITE_ROOT}}assets/js/learner-state.js"></script>
    <script src="{{SITE_ROOT}}assets/js/app-common.js"></script>
    <script src="{{SITE_ROOT}}assets/js/mermaid-theme.js"></script>
    <script src="{{SITE_ROOT}}assets/js/diagrams.js"></script>
    <script src="{{SITE_ROOT}}assets/js/markdown.js"></script>
    <script src="{{SITE_ROOT}}assets/js/index.js"></script>
  </body>
</html>
