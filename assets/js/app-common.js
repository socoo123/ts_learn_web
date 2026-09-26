/**
 * 页面公共外壳:主题切换 + 头部进度条。
 * 模板里每个页面都有 <header class="topbar">… 的骨架,这里只负责接行为。
 * 主题持久化键 "ts-theme"(与旧 React 版一致);切换后广播
 * ts-theme-change 事件,mermaid 图监听后按新主题重渲。
 */
(function (root) {
  "use strict";

  var THEME_STORAGE_KEY = "ts-theme";

  function readStoredTheme() {
    try {
      var raw = localStorage.getItem(THEME_STORAGE_KEY);
      if (raw === "parchment" || raw === "dracula") return raw;
    } catch (e) {
      /* localStorage 不可用时静默回退默认主题 */
    }
    return "parchment";
  }

  function applyTheme(theme) {
    document.documentElement.setAttribute("data-theme", theme);
  }

  function persistTheme(theme) {
    try {
      localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch (e) {
      /* 同上 */
    }
    applyTheme(theme);
    document.dispatchEvent(new CustomEvent("ts-theme-change", { detail: { theme: theme } }));
  }

  function h(tag, attrs, children) {
    var el = document.createElement(tag);
    if (attrs) {
      Object.keys(attrs).forEach(function (k) {
        if (k === "class") el.className = attrs[k];
        else if (k === "text") el.textContent = attrs[k];
        else if (k.slice(0, 2) === "on") el.addEventListener(k.slice(2), attrs[k]);
        else el.setAttribute(k, attrs[k]);
      });
    }
    (children || []).forEach(function (c) { el.appendChild(c); });
    return el;
  }

  function progressBar(value, max, size) {
    var pct = Math.min(100, Math.round((value / Math.max(max, 1)) * 100));
    var track = h("div", { class: "progress-track " + (size || "md") });
    var fill = h("div", { class: "progress-fill" });
    fill.style.width = pct + "%";
    track.appendChild(fill);
    return track;
  }

  /** 头部进度(所有页面共用):进度 x/y + 细条,订阅 TSLearnState 实时更新。 */
  function initHeaderProgress() {
    var host = document.querySelector("[data-header-progress]");
    if (!host || !root.TSLearnState) return;
    var total = 0;
    if (root.TS_LEARN && root.TS_LEARN.index) {
      root.TS_LEARN.index.modules.forEach(function (m) { total += m.chapters.length; });
    }
    if (total <= 0) return;

    var label = h("div", { class: "hp-label", text: "进度 0/" + total });
    var bar = progressBar(0, total, "sm");
    var link = h("a", { href: (root.SITE_ROOT || "./") + "index.html", title: "已学 0 / " + total + " 章" }, [label, bar]);
    link.className = "header-progress";
    host.appendChild(link);

    function refresh() {
      var done = root.TSLearnState.getProgressSnapshot().state.completedChapters.length;
      label.textContent = "进度 " + done + "/" + total;
      link.title = "已学 " + done + " / " + total + " 章";
      bar.querySelector(".progress-fill").style.width = Math.min(100, Math.round((done / total) * 100)) + "%";
    }
    root.TSLearnState.subscribeProgress(refresh);
    refresh();
  }

  document.addEventListener("DOMContentLoaded", function () {
    // 主题切换按钮组
    document.querySelectorAll("[data-theme-toggle]").forEach(function (box) {
      function paint(current) {
        box.querySelectorAll("button").forEach(function (btn) {
          btn.classList.toggle("active", btn.getAttribute("data-theme-value") === current);
          btn.setAttribute("aria-pressed", btn.getAttribute("data-theme-value") === current ? "true" : "false");
        });
      }
      box.querySelectorAll("button").forEach(function (btn) {
        btn.addEventListener("click", function () {
          var theme = btn.getAttribute("data-theme-value");
          persistTheme(theme);
          paint(theme);
        });
      });
      paint(document.documentElement.getAttribute("data-theme") || readStoredTheme());
    });

    initHeaderProgress();
  });
})(typeof globalThis !== "undefined" ? globalThis : this);
