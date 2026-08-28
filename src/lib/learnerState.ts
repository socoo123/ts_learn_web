/**
 * 学习进度 + 作业草稿。存在本机 localStorage，刷新不丢。
 */
export const LEARNER_STORAGE_KEY = "ts-learn:learner-state:v1";
const LEGACY_CODE_PREFIX = "ts-learn-code:";

export interface ChapterDraft {
  functions?: Record<string, string>;
}

export interface LearnerState {
  version: 1;
  updatedAt: string;
  completedChapters: string[];
  drafts: Record<string, ChapterDraft>;
}

export interface LearnerSnapshot {
  state: LearnerState;
}

export function emptyState(): LearnerState {
  return { version: 1, updatedAt: "", completedChapters: [], drafts: {} };
}

export function normalizeState(raw: unknown): LearnerState | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  if (o.version !== 1) return null;
  const completed = Array.isArray(o.completedChapters)
    ? o.completedChapters.filter((id): id is string => typeof id === "string")
    : [];
  const drafts: Record<string, ChapterDraft> = {};
  if (o.drafts && typeof o.drafts === "object") {
    for (const [k, v] of Object.entries(o.drafts as Record<string, unknown>)) {
      if (!v || typeof v !== "object") continue;
      const d = v as ChapterDraft;
      drafts[k] = {
        functions:
          d.functions && typeof d.functions === "object"
            ? Object.fromEntries(
                Object.entries(d.functions).filter(([, code]) => typeof code === "string"),
              )
            : undefined,
      };
    }
  }
  return {
    version: 1,
    updatedAt: typeof o.updatedAt === "string" ? o.updatedAt : "",
    completedChapters: [...new Set(completed)],
    drafts,
  };
}

function loadLocal(): LearnerState {
  try {
    const raw = localStorage.getItem(LEARNER_STORAGE_KEY);
    if (!raw) return emptyState();
    return normalizeState(JSON.parse(raw)) ?? emptyState();
  } catch {
    return emptyState();
  }
}

function writeLocal(state: LearnerState) {
  try {
    localStorage.setItem(LEARNER_STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* quota / 隐私模式 */
  }
}

type Listener = () => void;
const progressListeners = new Set<Listener>();

let snapshot: LearnerSnapshot = {
  state: typeof localStorage !== "undefined" ? loadLocal() : emptyState(),
};

function emit(patch: Partial<LearnerSnapshot>) {
  snapshot = { ...snapshot, ...patch };
  progressListeners.forEach((l) => l());
}

function persist(next: LearnerState, notifyProgress: boolean) {
  writeLocal(next);
  if (notifyProgress) emit({ state: next });
  else snapshot = { ...snapshot, state: next };
}

function mutate(updater: (s: LearnerState) => LearnerState, notifyProgress: boolean) {
  const next: LearnerState = {
    ...updater(snapshot.state),
    version: 1,
    updatedAt: new Date().toISOString(),
  };
  persist(next, notifyProgress);
}

export function subscribeProgress(listener: Listener): () => void {
  progressListeners.add(listener);
  return () => progressListeners.delete(listener);
}

export function getProgressSnapshot(): LearnerSnapshot {
  return snapshot;
}

export function isComplete(chapterId: string): boolean {
  return snapshot.state.completedChapters.includes(chapterId);
}

export function setChapterComplete(chapterId: string, complete: boolean) {
  mutate((s) => {
    const set = new Set(s.completedChapters);
    if (complete) set.add(chapterId);
    else set.delete(chapterId);
    return { ...s, completedChapters: [...set] };
  }, true);
}

export function toggleChapterComplete(chapterId: string) {
  setChapterComplete(chapterId, !isComplete(chapterId));
}

export function getFunctionDraft(chapterId: string, funcName: string): string | undefined {
  return snapshot.state.drafts[chapterId]?.functions?.[funcName];
}

function pruneDraft(draft: ChapterDraft | undefined): ChapterDraft | undefined {
  if (!draft) return undefined;
  const functions = draft.functions
    ? Object.fromEntries(Object.entries(draft.functions).filter(([, v]) => v.length > 0))
    : undefined;
  const next: ChapterDraft = {};
  if (functions && Object.keys(functions).length) next.functions = functions;
  return next.functions ? next : undefined;
}

export function saveFunctionDraft(chapterId: string, funcName: string, code: string, skeleton: string) {
  mutate((s) => {
    const prev = s.drafts[chapterId] ?? {};
    const functions = { ...(prev.functions ?? {}) };
    if (!code || code === skeleton) delete functions[funcName];
    else functions[funcName] = code;
    const draft = pruneDraft({ ...prev, functions });
    const drafts = { ...s.drafts };
    if (draft) drafts[chapterId] = draft;
    else delete drafts[chapterId];
    return { ...s, drafts };
  }, false);
}

/** 把搬家前 `ts-learn-code:chXX` 的草稿并进统一状态。 */
export function migrateLegacyDrafts(): void {
  if (typeof localStorage === "undefined") return;
  const keys: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k?.startsWith(LEGACY_CODE_PREFIX)) keys.push(k);
  }
  if (keys.length === 0) return;

  mutate((s) => {
    const drafts = { ...s.drafts };
    for (const k of keys) {
      const chapterId = k.slice(LEGACY_CODE_PREFIX.length);
      try {
        const parsed = JSON.parse(localStorage.getItem(k) ?? "{}") as Record<string, unknown>;
        const functions: Record<string, string> = { ...(drafts[chapterId]?.functions ?? {}) };
        for (const [name, code] of Object.entries(parsed)) {
          if (typeof code === "string" && code.length && !functions[name]) functions[name] = code;
        }
        const draft = pruneDraft({ functions });
        if (draft) drafts[chapterId] = draft;
      } catch {
        /* skip bad key */
      }
      localStorage.removeItem(k);
    }
    return { ...s, drafts };
  }, false);
}
