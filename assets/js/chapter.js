/**
 * 章节页控制器(src/routes/ChapterPage.tsx 的移植)。
 * 数据:内嵌 <script type="application/json" id="chapter-data"> + data.js 的课程索引。
 * buildBlocks 与原版逐行一致:按 sections 交错输出「教程块 / 作业块」。
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

  /** 块类型:md(教程) / exercise(作业函数)。 */
  function buildBlocks(chapter) {
    var blocks = [];
    var mdBuf = "";
    function flush() {
      if (mdBuf.trim()) blocks.push({ type: "md", text: mdBuf });
      mdBuf = "";
    }
    chapter.sections.forEach(function (s) {
      var secMd = (s.heading ? "## " + s.heading + "\n\n" : "") + s.body;
      if (s.exerciseFunctions.length) {
        flush();
        blocks.push({ type: "md", text: secMd });
        s.exerciseFunctions.forEach(function (fname) {
          var f = chapter.functions.find(function (x) { return x.name === fname; });
          if (f) blocks.push({ type: "exercise", func: f });
        });
      } else {
        mdBuf += secMd + "\n\n";
      }
    });
    flush();
    return blocks;
  }

  function copyText(text, btn) {
    function done() {
      btn.textContent = "已复制 ✓";
      setTimeout(function () { btn.textContent = "复制"; }, 1500);
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(done, function () { fallback(); });
    } else {
      fallback();
    }
    function fallback() {
      // file:// 下部分浏览器没有 Clipboard API:用临时 textarea + execCommand
      var ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      try {
        document.execCommand("copy");
        done();
      } catch (e) {
        /* 放弃 */
      }
      document.body.removeChild(ta);
    }
  }

  function runModeBadge(mode) {
    return h(
      "span",
      { class: "runmode-badge " + (mode === "browser" ? "browser" : "local") },
      [h("span", { text: mode === "browser" ? "🟢 浏览器运行" : "🔒 本地运行" })],
    );
  }

  function LocalNotice(chapter, moduleDir) {
    var cmd = chapter.localHint || "bun test " + moduleDir + "/ch" + chapter.num;
    var copyBtn = h("button", {
      type: "button",
      class: "copy-btn",
      text: "复制",
      onclick: function () { copyText(cmd, copyBtn); },
    });
    return h("div", { class: "local-notice" }, [
      h("div", { class: "ln-title", text: "🔒 本章在本地运行" }),
      h("p", {}, [
        document.createTextNode("这章依赖 Bun / Hono，浏览器里跑不了。请在仓库的 "),
        h("code", { text: "local/" }),
        document.createTextNode(" 目录改 TODO，然后用下面命令跑测试。"),
      ]),
      h("div", { class: "ln-cmd" }, [h("code", { text: cmd }), copyBtn]),
    ]);
  }

  function LocalExerciseCard(func) {
    var copyBtn = h("button", {
      type: "button",
      class: "copy-btn",
      text: "复制骨架",
      onclick: function () { copyText(func.skeleton, copyBtn); },
    });
    var pre = h("pre", { text: func.skeleton });
    return h("div", { class: "local-exercise-card" }, [
      h("div", { class: "le-name", text: func.name }),
      h("p", {}, [
        document.createTextNode("🔒 在本地 "),
        h("code", { text: "assignment.ts" }),
        document.createTextNode(" 里实现本题，不要在浏览器跑。"),
      ]),
      copyBtn,
      pre,
    ]);
  }

  function CompleteToggle(chapterId, state) {
    var card = h("div", { class: "complete-card" });
    var title = h("span", { class: "cc-title" });
    var sub = h("span", { class: "cc-sub" });
    var input = h("input", { type: "checkbox" });
    input.addEventListener("change", function () {
      state.setChapterComplete(chapterId, input.checked);
    });
    card.appendChild(
      h("label", {}, [
        input,
        h("span", {}, [title, sub, h("span", { class: "cc-note", text: "进度存在本机浏览器（localStorage），刷新不会丢。" })]),
      ]),
    );
    function paint() {
      var done = state.isComplete(chapterId);
      card.classList.toggle("done", done);
      input.checked = done;
      title.textContent = done ? "已学完本章" : "我已学完本章";
      sub.textContent = done
        ? "进度已勾选，可在首页和模块列表里看到。"
        : "学完教程和作业后勾选，外面的进度条会跟着更新。";
    }
    state.subscribeProgress(paint);
    paint();
    return card;
  }

  document.addEventListener("DOMContentLoaded", function () {
    var mount = document.getElementById("page-root");
    var state = root.TSLearnState;
    var dataEl = document.getElementById("chapter-data");
    var navEl = document.getElementById("chapter-nav");
    if (!mount || !dataEl || !state || !root.TS_LEARN || !root.TSMarkdown) return;

    var chapter;
    try {
      chapter = JSON.parse(dataEl.textContent);
    } catch (e) {
      mount.appendChild(h("div", { class: "notice-card", text: "章节数据解析失败。" }));
      return;
    }
    var nav = {};
    try {
      nav = JSON.parse(navEl ? navEl.textContent : "{}");
    } catch (e) {
      nav = {};
    }

    var module = null;
    root.TS_LEARN.index.modules.forEach(function (m) {
      if (!module && m.chapters.some(function (c) { return c.id === chapter.id; })) module = m;
    });

    // ===== 面包屑 + 头部 =====
    var breadcrumb = h("nav", { class: "breadcrumb" }, [
      h("a", { href: root.SITE_ROOT + "index.html", text: "课程地图" }),
      h("span", { class: "sep", text: "/" }),
      h("span", { text: module ? module.title : "" }),
      h("span", { class: "sep", text: "/" }),
      h("span", { text: "Ch" + chapter.num }),
    ]);

    var header = h("header", { class: "chapter-header" }, [
      h("div", {}, [
        h("div", { class: "chapter-kicker", text: "第 " + chapter.num + " 课" }),
        h("h1", { text: chapter.title }),
      ]),
      runModeBadge(chapter.runMode),
    ]);

    // ===== 主体块 =====
    var page = h("div", { class: "page-stack" }, [breadcrumb, header]);

    if (chapter.runMode === "local" && module) {
      page.appendChild(LocalNotice(chapter, module.dir));
    }

    var codes = {};
    chapter.functions.forEach(function (f) {
      codes[f.name] = state.getFunctionDraft(chapter.id, f.name) != null
        ? state.getFunctionDraft(chapter.id, f.name)
        : f.skeleton;
    });

    function handleCodeChange(name, code) {
      codes[name] = code;
      var f = chapter.functions.find(function (x) { return x.name === name; });
      state.saveFunctionDraft(chapter.id, name, code, f ? f.skeleton : "");
    }

    var blocksHost = h("div", { class: "blocks" });
    if (chapter.interleaved) {
      buildBlocks(chapter).forEach(function (b) {
        if (b.type === "md") {
          var md = h("div", {});
          root.TSMarkdown.renderMarkdown(md, b.text);
          blocksHost.appendChild(md);
        } else if (chapter.runMode === "local") {
          blocksHost.appendChild(LocalExerciseCard(b.func));
        } else if (root.TSExercise) {
          var slot = h("div", {});
          root.TSExercise.mount(slot, chapter, root.TS_LEARN.shared, b.func, codes, handleCodeChange);
          blocksHost.appendChild(slot);
        } else {
          blocksHost.appendChild(h("div", { class: "notice-card", text: "本章作业模块加载失败(exercise.js 缺失)。" }));
        }
      });
    } else {
      var tut = h("div", {});
      root.TSMarkdown.renderMarkdown(tut, chapter.tutorialMd);
      blocksHost.appendChild(h("section", { class: "blocks" }, [h("h2", { class: "section-title", text: "📖 教程" }), tut]));
      blocksHost.appendChild(
        h("section", { class: "blocks" }, [
          h("h2", { class: "section-title", text: "✏️ 作业" }),
          h("p", { text: chapter.runMode === "local" ? "请按上方命令在仓库 local/ 目录完成作业。" : "请用交错式章节学习（本章未拆练习块）。" }),
        ]),
      );
    }
    page.appendChild(blocksHost);

    // ===== 记忆闪卡 =====
    if (chapter.reviewMd && chapter.reviewMd.trim()) {
      var fcBody = h("div", { class: "fc-body" });
      root.TSMarkdown.renderMarkdown(fcBody, chapter.reviewMd);
      page.appendChild(
        h("details", { class: "flashcards" }, [
          h("summary", {}, [
            document.createTextNode("🧠 记忆闪卡"),
            h("span", { class: "fc-hint", text: "点开复习" }),
          ]),
          fcBody,
        ]),
      );
    }

    // ===== 完成开关 + 前后章 =====
    page.appendChild(CompleteToggle(chapter.id, state));

    if (nav.prev || nav.next) {
      var pn = h("div", { class: "prevnext" });
      if (nav.prev) {
        pn.appendChild(
          h("a", { href: nav.prev.id + ".html" }, [
            h("div", { class: "pn-label", text: "← 上一章 Ch" + nav.prev.num }),
            h("span", { class: "pn-title", text: nav.prev.title }),
          ]),
        );
      }
      if (nav.next) {
        pn.appendChild(
          h("a", { class: "pn-next", href: nav.next.id + ".html" }, [
            h("div", { class: "pn-label", text: "下一章 Ch" + nav.next.num + " →" }),
            h("span", { class: "pn-title", text: nav.next.title }),
          ]),
        );
      }
      page.appendChild(pn);
    }

    mount.appendChild(page);
  });
})(typeof globalThis !== "undefined" ? globalThis : this);
