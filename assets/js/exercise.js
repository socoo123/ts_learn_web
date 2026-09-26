/**
 * 浏览器作业卡(src/components/ExerciseRunner.tsx + Terminal.tsx 的移植)。
 * API:TSExercise.mount(slot, chapter, shared, func, codes, onCodeChange)
 * - 编辑器:Monaco(经 monaco-setup.js);10s 未就绪回退 textarea(草稿/判题不受影响)
 * - 运行:懒注入 vendor/typescript.js + vendor/zod.iife.js 后调 TSLearnRunner
 */
(function (root) {
  "use strict";

  var SITE_ROOT = root.SITE_ROOT || "./";
  var runtimePromise = null;

  /** 懒加载运行器依赖(9MB typescript + zod),只在第一次点「运行测试」时注入。 */
  function ensureRuntime() {
    if (runtimePromise) return runtimePromise;
    runtimePromise = new Promise(function (resolve, reject) {
      var pending = 2;
      ["typescript.js", "zod.iife.js"].forEach(function (file) {
        var s = document.createElement("script");
        s.src = SITE_ROOT + "assets/js/vendor/" + file;
        s.onload = function () {
          if (--pending === 0) resolve();
        };
        s.onerror = function () {
          runtimePromise = null;
          reject(new Error(file + " 加载失败"));
        };
        document.head.appendChild(s);
      });
    });
    return runtimePromise;
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
    (children || []).forEach(function (c) { if (c) el.appendChild(c); });
    return el;
  }

  /** Terminal.tsx 移植:固定深色小窗 + 状态胶囊。 */
  var PILL = {
    idle: { text: "待运行", cls: "p-idle" },
    loading: { text: "准备中…", cls: "p-loading" },
    running: { text: "运行中…", cls: "p-running" },
    passed: { text: "✅ 全绿", cls: "p-passed" },
    failed: { text: "❌ 有失败", cls: "p-failed" },
    error: { text: "⚠️ 出错", cls: "p-error" },
  };

  function Terminal() {
    var outputPre = h("pre", { class: "terminal-output", text: "点击「▶ 运行测试」查看结果。" });
    var pill = h("span", { class: "term-pill p-idle", text: PILL.idle.text });
    var box = h("div", { class: "terminal status-idle" }, [
      h("div", { class: "term-titlebar" }, [
        h("span", { class: "dot red" }),
        h("span", { class: "dot orange" }),
        h("span", { class: "dot green" }),
        h("span", { class: "term-label", text: "测试输出" }),
        pill,
      ]),
      outputPre,
    ]);
    return {
      el: box,
      set: function (status, output) {
        box.className = "terminal status-" + status;
        var p = PILL[status] || PILL.idle;
        pill.className = "term-pill " + p.cls;
        pill.textContent = p.text;
        if (output != null) outputPre.textContent = output;
      },
    };
  }

  function mount(slot, chapter, shared, func, codes, onCodeChange) {
    var currentCode = codes[func.name] != null ? codes[func.name] : func.skeleton;
    var status = "idle";
    var terminal = Terminal();

    var runBtn = h(
      "button",
      { type: "button", class: "btn-run", text: "▶ 运行测试" },
    );
    var resetBtn = h("button", { type: "button", class: "btn-reset", text: "↺ 重置" });

    var editorHost = h("div", { class: "ex-editor" });
    var editorHeight = Math.min(620, Math.max(280, func.skeleton.split("\n").length * 20 + 28));
    editorHost.style.height = editorHeight + "px";
    editorHost.appendChild(h("div", { class: "editor-loading", text: "编辑器加载中…" }));

    var card = h("div", { class: "exercise-card" }, [
      h("div", { class: "ex-head" }, [
        h("span", { class: "ex-name", text: "✏️ " + func.name + "()" }),
        runBtn,
        resetBtn,
      ]),
      editorHost,
      h("div", { style: "margin-top:0.5rem" }, [terminal.el]),
    ]);
    slot.appendChild(card);

    // ===== 编辑器:Monaco,10s 未就绪回退 textarea =====
    var editorHandle = null; // { setValue(v) }
    var gaveUp = false;

    function wireTextarea() {
      if (editorHandle || gaveUp) return;
      gaveUp = true;
      editorHost.textContent = "";
      var ta = h("textarea", { class: "editor-fallback", spellcheck: "false" });
      ta.value = currentCode;
      ta.style.height = editorHeight + "px";
      ta.addEventListener("input", function () {
        currentCode = ta.value;
        onCodeChange(func.name, ta.value);
      });
      editorHost.appendChild(ta);
      editorHandle = {
        setValue: function (v) {
          ta.value = v;
        },
      };
    }

    if (root.TSMonaco) {
      var timeout = setTimeout(wireTextarea, 10000);
      root.TSMonaco
        .createEditor(editorHost, currentCode, function (v) {
          currentCode = v;
          onCodeChange(func.name, v);
        }, editorHeight)
        .then(function (handle) {
          clearTimeout(timeout);
          if (gaveUp) {
            handle.editor.dispose();
            return;
          }
          editorHandle = {
            setValue: function (v) {
              handle.editor.setValue(v);
            },
          };
        })
        .catch(function () {
          clearTimeout(timeout);
          wireTextarea();
        });
    } else {
      wireTextarea();
    }

    // ===== 运行 / 重置 =====
    function setBusy(busy) {
      runBtn.disabled = busy;
      resetBtn.disabled = busy;
      runBtn.textContent = busy ? "运行中…" : "▶ 运行测试";
    }

    runBtn.addEventListener("click", function () {
      if (status === "running" || status === "loading") return;
      status = "loading";
      setBusy(true);
      terminal.set("loading");

      ensureRuntime()
        .then(function () {
          status = "running";
          terminal.set("running");
          return root.TSLearnRunner.runFunctionTest({
            testSource: chapter.testSource,
            preamble: chapter.preamble,
            functions: chapter.functions,
            codes: Object.assign({}, codes, (function () { var o = {}; o[func.name] = currentCode; return o; })()),
            activeFunction: func.testSuite || func.name,
            productsJson: (shared && shared.mocks && shared.mocks["products.json"]) || "[]",
          });
        })
        .then(function (res) {
          terminal.set(res.returncode === 0 ? "passed" : "failed", res.output || "(无输出)");
          status = res.returncode === 0 ? "passed" : "failed";
          setBusy(false);
        })
        .catch(function (e) {
          terminal.set("error", "❌ " + (e instanceof Error ? e.message : String(e)));
          status = "error";
          setBusy(false);
        });
    });

    resetBtn.addEventListener("click", function () {
      currentCode = func.skeleton;
      onCodeChange(func.name, func.skeleton);
      if (editorHandle) editorHandle.setValue(func.skeleton);
      terminal.set("idle", "点击「▶ 运行测试」查看结果。");
      status = "idle";
    });
  }

  root.TSExercise = { mount: mount, ensureRuntime: ensureRuntime };
})(typeof globalThis !== "undefined" ? globalThis : this);
