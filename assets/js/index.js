/**
 * 课程地图(首页)控制器:合并了原 React 版 Home + ModulePage。
 * 数据来自 data.js 的 window.TS_LEARN = { index, shared, generated[] }。
 */
(function (root) {
  "use strict";

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
    (children || []).forEach(function (c) { if (c) el.appendChild(c); });
    return el;
  }

  function progressBarLabeled(value, max, label) {
    var pct = Math.min(100, Math.round((value / Math.max(max, 1)) * 100));
    var wrap = h("div", { class: "progress-wrap" });
    wrap.appendChild(
      h("div", { class: "progress-label" }, [
        h("span", { text: label || "" }),
        h("span", { text: value + "/" + max + " · " + pct + "%" }),
      ]),
    );
    var track = h("div", { class: "progress-track md", role: "progressbar", "aria-valuemin": "0", "aria-valuemax": String(max), "aria-valuenow": String(value) });
    var fill = h("div", { class: "progress-fill" });
    fill.style.width = pct + "%";
    track.appendChild(fill);
    wrap.appendChild(track);
    return wrap;
  }

  function runModeBadge(mode) {
    return h(
      "span",
      { class: "runmode-badge " + (mode === "browser" ? "browser" : "local") },
      [h("span", { text: mode === "browser" ? "🟢 浏览器运行" : "🔒 本地运行" })],
    );
  }

  document.addEventListener("DOMContentLoaded", function () {
    var mount = document.getElementById("page-root");
    var data = root.TS_LEARN;
    var state = root.TSLearnState;
    if (!mount || !data || !state) return;

    var modules = data.index.modules;
    var generated = new Set(data.generated);
    var allChapters = [];
    modules.forEach(function (m) { allChapters = allChapters.concat(m.chapters); });
    var available = modules.filter(function (m) { return m.available; }).length;

    // ===== hero =====
    var statValue1, statValue2, heroProgressWrap, heroSub;
    var hero = h("section", { class: "hero" }, [
      h("div", { class: "hero-watermark", text: "TS" }),
      h("p", { class: "hero-kicker", text: "交互式 TypeScript 课程" }),
      h("h1", {}, [
        document.createTextNode("从 Java / Python 到 TypeScript"),
        h("span", { class: "hero-accent", text: " · 最后用 Pi 做 Agent" }),
      ]),
      (heroSub = h("p", { class: "hero-sub", text: "" })),
      h("div", { class: "hero-stats" }, [
        h("div", { class: "stat" }, [
          (statValue1 = h("div", { class: "stat-value", text: "" })),
          h("div", { class: "stat-label", text: "模块" }),
        ]),
        h("div", { class: "stat" }, [
          (statValue2 = h("div", { class: "stat-value", text: "" })),
          h("div", { class: "stat-label", text: "已学章节" }),
        ]),
        h("div", { class: "stat" }, [
          h("div", { class: "stat-value", text: "浏览器 · 本地" }),
          h("div", { class: "stat-label", text: "运行方式" }),
        ]),
      ]),
      (heroProgressWrap = h("div", { class: "hero-progress-wrap" }, [
        h("p", { class: "hero-progress-note", text: "进度存在本机浏览器；学完一章后在章末勾选「已学完」。" }),
      ])),
    ]);
    heroSub.textContent =
      allChapters.length + " 章 / " + modules.length + " 大模块。点开章节读教程，直接在网页里写函数、点运行看测试红绿。" +
      "语言 / 背景 / 前端章在浏览器里跑；后端和 Pi Agent 章在本地跑。";

    // ===== 模块区块 + 章节行 =====
    var moduleSections = [];
    var rowsById = {}; // chapterId -> {row, toggle, meta}
    var moduleProgressWraps = {}; // moduleId -> 替换函数

    modules.forEach(function (m, i) {
      var list = h("div", { class: "chapter-list" });
      m.chapters.forEach(function (ch) {
        var ready = generated.has(ch.id);
        var metaSpan;
        var toggle = h("button", {
          type: "button",
          class: "complete-toggle-btn",
          title: "标为已学完",
          disabled: ready ? null : "disabled",
          onclick: function () { state.toggleChapterComplete(ch.id); },
        });

        var numChip = h("span", { class: "chapter-num", text: ch.num });
        var titleBlock = h("div", { class: "chapter-info" }, [
          h("div", { class: "chapter-title", text: ch.title }),
          (metaSpan = h("div", { class: "chapter-meta", text: "" })),
        ]);

        var content = [numChip, titleBlock, runModeBadge(ch.runMode)];
        var row = h("div", { class: "chapter-row" }, [toggle]);
        if (ready) {
          row.classList.add("ready");
          row.appendChild(
            h(
              "a",
              { href: "chapters/" + ch.id + ".html", class: "chapter-link" },
              content.concat([h("span", { class: "chapter-arrow", text: "→" })]),
            ),
          );
        } else {
          row.classList.add("not-ready");
          row.appendChild(h("div", { class: "chapter-link" }, content));
        }
        rowsById[ch.id] = { row: row, toggle: toggle, meta: metaSpan, ready: ready };
        list.appendChild(row);
      });
      if (m.chapters.length === 0) {
        list.appendChild(h("div", { class: "notice-card", text: "本模块内容待生成。" }));
      }

      var progressHost = h("div", { class: "module-progress-wrap" });
      var section = h("section", { class: "module-section" }, [
        h("div", { class: "module-head" }, [
          h("span", { class: "module-index", text: String(i + 1).padStart(2, "0") }),
          h("span", { class: "module-title", text: m.title }),
          h("span", { class: "module-sub", text: m.subtitle }),
        ]),
        progressHost,
        list,
      ]);
      moduleProgressWraps[m.id] = { host: progressHost, chapters: m.chapters };
      moduleSections.push(section);
    });

    // ===== 怎么学 =====
    var steps = [
      ["1", "读教程", "每节对照 Java / Python 讲透，讲过的才考。"],
      ["2", "写作业", "网页编辑器里填实现，点「运行测试」。"],
      ["3", "看红绿", "测试即时反馈，全绿即掌握，勾选「已学完」。"],
    ].map(function (s) {
      return h("div", { class: "step-card" }, [
        h("div", { class: "step-no", text: s[0] }),
        h("h3", { text: s[1] }),
        h("p", { text: s[2] }),
      ]);
    });

    var page = h("div", { class: "page-stack" }, [
      hero,
      h("section", {}, [h("h2", { class: "section-title", text: "课程地图" })].concat(moduleSections)),
      h("section", {}, [h("h2", { class: "section-title", text: "怎么学" }), h("div", { class: "steps-grid" }, steps)]),
    ]);
    mount.appendChild(page);

    // ===== 进度联动 =====
    function refresh() {
      var doneIds = new Set(state.getProgressSnapshot().state.completedChapters);
      var doneCount = 0;
      Object.keys(rowsById).forEach(function (id) {
        var r = rowsById[id];
        var learned = doneIds.has(id);
        if (learned) doneCount++;
        r.row.classList.toggle("learned", learned);
        r.toggle.classList.toggle("on", learned);
        r.toggle.title = learned ? "取消已学完" : "标为已学完";
        r.toggle.setAttribute("aria-pressed", learned ? "true" : "false");
        r.toggle.textContent = learned ? "✓" : "";
        if (!r.ready) r.meta.textContent = "内容待生成";
        else r.meta.textContent = learned ? "已学完" : "";
        r.meta.classList.toggle("done", learned && r.ready);
      });
      statValue1.textContent = available + " / " + modules.length;
      statValue2.textContent = doneCount + " / " + allChapters.length;

      var heroBar = heroProgressWrap.querySelector(".progress-wrap");
      if (heroBar) heroProgressWrap.removeChild(heroBar);
      heroProgressWrap.insertBefore(progressBarLabeled(doneCount, allChapters.length, "总进度"), heroProgressWrap.firstChild);

      Object.keys(moduleProgressWraps).forEach(function (mid) {
        var mp = moduleProgressWraps[mid];
        var done = mp.chapters.filter(function (ch) { return doneIds.has(ch.id); }).length;
        mp.host.textContent = "";
        if (mp.chapters.length > 0) mp.host.appendChild(progressBarLabeled(done, mp.chapters.length, "本模块进度"));
      });
    }
    state.subscribeProgress(refresh);
    refresh();
  });
})(typeof globalThis !== "undefined" ? globalThis : this);
