/**
 * mermaid 懒加载 + 图渲染(src/components/MermaidBlock.tsx 的移植)。
 * mermaid.min.js 3.4MB 只在有图的页面注入;主题切换时
 * (ts-theme-change 事件)所有活跃图按新主题重渲。
 */
(function (root) {
  "use strict";

  var SITE_ROOT = root.SITE_ROOT || "./";
  var mermaidPromise = null;
  var renderSeq = 0;
  /** chapterId -> host 元素上挂的渲染登记(host.__tsChart = source) */
  var liveHosts = new Set();

  function currentTheme() {
    var t = document.documentElement.getAttribute("data-theme");
    return t === "dracula" ? "dracula" : "parchment";
  }

  function ensureMermaid() {
    if (mermaidPromise) return mermaidPromise;
    mermaidPromise = new Promise(function (resolve, reject) {
      // mermaid.min.js 已被包进函数，形参 define 挡住 monaco loader 的全局 define，
      // 否则内部 UMD 走 AMD、globalThis.mermaid 不落地。
      var s = document.createElement("script");
      s.src = SITE_ROOT + "assets/js/vendor/mermaid.min.js?v=2";
      s.onload = function () {
        resolve(root.mermaid);
      };
      s.onerror = function () {
        mermaidPromise = null;
        reject(new Error("mermaid.min.js 加载失败"));
      };
      document.head.appendChild(s);
    });
    return mermaidPromise;
  }

  function parseErrorMessage(err) {
    if (err instanceof Error && err.message) return err.message;
    if (typeof err === "string") return err;
    if (err && typeof err === "object" && typeof err.str === "string") return err.str;
    return "Failed to render mermaid diagram";
  }

  function renderMermaid(host, chart) {
    var source = String(chart).trim();
    host.__tsChart = source;
    liveHosts.add(host);
    renderSeq++;
    var renderId = "mermaid-" + renderSeq + "-" + currentTheme() + "-" + Math.random().toString(36).slice(2, 8);
    var theme = currentTheme();
    var T = root.TSMermaidTheme;

    ensureMermaid()
      .then(function (mermaid) {
        mermaid.initialize(T.mermaidInitConfig(theme));
        return mermaid.render(renderId, T.adaptMermaidSource(source, theme));
      })
      .then(function (result) {
        if (host.__tsChart !== source) return; // 已被重渲取代
        host.innerHTML = result.svg;
        var svgEl = host.querySelector("svg");
        if (svgEl) {
          T.fitMermaidSvg(svgEl);
          T.lockMermaidLabels(host, theme);
        }
      })
      .catch(function (err) {
        if (host.__tsChart !== source) return;
        host.innerHTML = "";
        var pre = document.createElement("pre");
        pre.className = "mermaid-block mermaid-error";
        pre.textContent = parseErrorMessage(err);
        host.parentNode.replaceChild(pre, host);
        liveHosts.delete(host);
      });
  }

  /** 主题切换:全部活跃图重渲(对齐 React 版 [chart, theme] effect 依赖)。 */
  document.addEventListener("ts-theme-change", function () {
    var hosts = Array.from(liveHosts);
    hosts.forEach(function (host) {
      if (!document.contains(host)) {
        liveHosts.delete(host);
        return;
      }
      renderMermaid(host, host.__tsChart);
    });
  });

  root.TSDiagrams = { ensureMermaid: ensureMermaid, renderMermaid: renderMermaid };
})(typeof globalThis !== "undefined" ? globalThis : this);
