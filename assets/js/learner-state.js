/**
 * 学习进度 + 作业草稿。存在本机 localStorage,刷新不丢。
 * (src/lib/learnerState.ts 的经典脚本移植,localStorage 键名保持不变,
 *  旧站(React 版)的进度/草稿在同一 origin 下直接延续。)
 */
(function (root) {
  "use strict";

  var LEARNER_STORAGE_KEY = "ts-learn:learner-state:v1";
  var LEGACY_CODE_PREFIX = "ts-learn-code:";

  function emptyState() {
    return { version: 1, updatedAt: "", completedChapters: [], drafts: {} };
  }

  function normalizeState(raw) {
    if (!raw || typeof raw !== "object") return null;
    if (raw.version !== 1) return null;
    var completed = Array.isArray(raw.completedChapters)
      ? raw.completedChapters.filter(function (id) { return typeof id === "string"; })
      : [];
    var drafts = {};
    if (raw.drafts && typeof raw.drafts === "object") {
      Object.keys(raw.drafts).forEach(function (k) {
        var v = raw.drafts[k];
        if (!v || typeof v !== "object") return;
        var functions;
        if (v.functions && typeof v.functions === "object") {
          functions = {};
          Object.keys(v.functions).forEach(function (name) {
            if (typeof v.functions[name] === "string") functions[name] = v.functions[name];
          });
        }
        drafts[k] = { functions: functions };
      });
    }
    return {
      version: 1,
      updatedAt: typeof raw.updatedAt === "string" ? raw.updatedAt : "",
      completedChapters: Array.from(new Set(completed)),
      drafts: drafts,
    };
  }

  function loadLocal() {
    try {
      var raw = localStorage.getItem(LEARNER_STORAGE_KEY);
      if (!raw) return emptyState();
      return normalizeState(JSON.parse(raw)) || emptyState();
    } catch (e) {
      return emptyState();
    }
  }

  function writeLocal(state) {
    try {
      localStorage.setItem(LEARNER_STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      /* quota / 隐私模式 */
    }
  }

  var progressListeners = new Set();
  var snapshot = { state: loadLocal() };

  function emit(patch) {
    snapshot = Object.assign({}, snapshot, patch);
    progressListeners.forEach(function (l) { l(); });
  }

  function persist(next, notifyProgress) {
    writeLocal(next);
    if (notifyProgress) emit({ state: next });
    else snapshot = Object.assign({}, snapshot, { state: next });
  }

  function mutate(updater, notifyProgress) {
    var next = Object.assign({}, updater(snapshot.state), {
      version: 1,
      updatedAt: new Date().toISOString(),
    });
    persist(next, notifyProgress);
  }

  function pruneDraft(draft) {
    if (!draft) return undefined;
    var functions;
    if (draft.functions) {
      functions = {};
      Object.keys(draft.functions).forEach(function (name) {
        if (draft.functions[name].length > 0) functions[name] = draft.functions[name];
      });
    }
    var next = {};
    if (functions && Object.keys(functions).length) next.functions = functions;
    return next.functions ? next : undefined;
  }

  var api = {
    /** 订阅进度变化(完成勾选会通知;草稿保存刻意不通知,避免抖动)。 */
    subscribeProgress: function (listener) {
      progressListeners.add(listener);
      return function () { progressListeners.delete(listener); };
    },
    getProgressSnapshot: function () {
      return snapshot;
    },
    isComplete: function (chapterId) {
      return snapshot.state.completedChapters.indexOf(chapterId) !== -1;
    },
    setChapterComplete: function (chapterId, complete) {
      mutate(function (s) {
        var set = new Set(s.completedChapters);
        if (complete) set.add(chapterId);
        else set.delete(chapterId);
        return Object.assign({}, s, { completedChapters: Array.from(set) });
      }, true);
    },
    toggleChapterComplete: function (chapterId) {
      api.setChapterComplete(chapterId, !api.isComplete(chapterId));
    },
    getFunctionDraft: function (chapterId, funcName) {
      var d = snapshot.state.drafts[chapterId];
      return d && d.functions ? d.functions[funcName] : undefined;
    },
    saveFunctionDraft: function (chapterId, funcName, code, skeleton) {
      mutate(function (s) {
        var prev = s.drafts[chapterId] || {};
        var functions = Object.assign({}, prev.functions || {});
        if (!code || code === skeleton) delete functions[funcName];
        else functions[funcName] = code;
        var draft = pruneDraft(Object.assign({}, prev, { functions: functions }));
        var drafts = Object.assign({}, s.drafts);
        if (draft) drafts[chapterId] = draft;
        else delete drafts[chapterId];
        return Object.assign({}, s, { drafts: drafts });
      }, false);
    },
    /** 把搬家前 `ts-learn-code:chXX` 的草稿并进统一状态。 */
    migrateLegacyDrafts: function () {
      var keys = [];
      for (var i = 0; i < localStorage.length; i++) {
        var k = localStorage.key(i);
        if (k && k.indexOf(LEGACY_CODE_PREFIX) === 0) keys.push(k);
      }
      if (keys.length === 0) return;

      mutate(function (s) {
        var drafts = Object.assign({}, s.drafts);
        keys.forEach(function (k) {
          var chapterId = k.slice(LEGACY_CODE_PREFIX.length);
          try {
            var parsed = JSON.parse(localStorage.getItem(k) || "{}");
            var functions = Object.assign({}, (drafts[chapterId] && drafts[chapterId].functions) || {});
            Object.keys(parsed).forEach(function (name) {
              var code = parsed[name];
              if (typeof code === "string" && code.length && !functions[name]) functions[name] = code;
            });
            var draft = pruneDraft({ functions: functions });
            if (draft) drafts[chapterId] = draft;
          } catch (e) {
            /* skip bad key */
          }
          localStorage.removeItem(k);
        });
        return Object.assign({}, s, { drafts: drafts });
      }, false);
    },
  };

  api.migrateLegacyDrafts();
  root.TSLearnState = api;
})(typeof globalThis !== "undefined" ? globalThis : this);
