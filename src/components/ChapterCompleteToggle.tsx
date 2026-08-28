import { useLearnerProgress } from "../hooks/useLearnerProgress";

export default function ChapterCompleteToggle({ chapterId }: { chapterId: string }) {
  const { isComplete, toggleComplete } = useLearnerProgress();
  const done = isComplete(chapterId);

  return (
    <div
      className={`rounded-xl border p-5 transition ${
        done
          ? "border-drac-green/40 bg-drac-green/10"
          : "border-border-subtle bg-bg-card"
      }`}
    >
      <label className="flex cursor-pointer items-start gap-3">
        <input
          type="checkbox"
          checked={done}
          onChange={() => toggleComplete(chapterId)}
          className="mt-1 h-5 w-5 shrink-0 cursor-pointer rounded border-border-strong accent-drac-green"
        />
        <span>
          <span className="block text-base font-semibold text-drac-fg">
            {done ? "已学完本章" : "我已学完本章"}
          </span>
          <span className="mt-1 block text-sm text-drac-comment">
            {done
              ? "进度已勾选，可在首页和模块列表里看到。"
              : "学完教程和作业后勾选，外面的进度条会跟着更新。"}
          </span>
          <span className="mt-1 block text-xs text-drac-comment">
            进度存在本机浏览器（localStorage），刷新不会丢。
          </span>
        </span>
      </label>
    </div>
  );
}
