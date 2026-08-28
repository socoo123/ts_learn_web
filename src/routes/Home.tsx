import ModuleCard from "../components/ModuleCard";
import ProgressBar from "../components/ProgressBar";
import { modules } from "../data/curriculum";
import { useLearnerProgress } from "../hooks/useLearnerProgress";

export default function Home() {
  const available = modules.filter((m) => m.available).length;
  const { completedCount, totalChapters } = useLearnerProgress();

  return (
    <div className="space-y-12">
      <section className="relative overflow-hidden rounded-2xl border border-border-subtle bg-gradient-to-b from-bg-card to-bg-base p-8 sm:p-12">
        <div className="absolute right-6 top-6 select-none font-mono text-6xl opacity-10">TS</div>
        <p className="text-sm font-medium text-accent">交互式 TypeScript 课程</p>
        <h1 className="mt-2 max-w-2xl text-3xl font-bold leading-tight text-drac-fg sm:text-4xl">
          从 Java / Python 到 TypeScript
          <span className="text-accent"> · 最后用 Pi 做 Agent</span>
        </h1>
        <p className="mt-4 max-w-2xl text-drac-comment">
          26 章 / 5 大模块。点开章节读教程，直接在网页里写函数、点运行看测试红绿。
          语言 / 背景 / 前端章在浏览器里跑；后端和 Pi Agent 章在本地跑。
        </p>
        <div className="mt-6 flex flex-wrap gap-6 text-sm">
          <Stat label="模块" value={`${available} / ${modules.length}`} />
          <Stat label="已学章节" value={`${completedCount} / ${totalChapters}`} />
          <Stat label="运行方式" value="浏览器 · 本地" />
        </div>
        <div className="mt-6 max-w-xl">
          <ProgressBar value={completedCount} max={totalChapters} label="总进度" />
          <p className="mt-2 text-xs text-drac-comment">
            进度存在本机浏览器；学完一章后在章末勾选「已学完」。
          </p>
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-lg font-semibold text-drac-fg">课程地图</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {modules.map((m, i) => (
            <ModuleCard key={m.id} module={m} index={i} />
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-lg font-semibold text-drac-fg">怎么学</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <Step n="1" title="读教程" desc="每节对照 Java / Python 讲透，讲过的才考。" />
          <Step n="2" title="写作业" desc="网页编辑器里填实现，点「运行测试」。" />
          <Step n="3" title="看红绿" desc="测试即时反馈，全绿即掌握，勾选「已学完」。" />
        </div>
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xl font-bold text-drac-fg">{value}</div>
      <div className="text-xs text-drac-comment">{label}</div>
    </div>
  );
}

function Step({ n, title, desc }: { n: string; title: string; desc: string }) {
  return (
    <div className="rounded-xl border border-border-subtle bg-bg-card p-5">
      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent/15 text-sm font-bold text-accent">
        {n}
      </div>
      <h3 className="mt-3 font-semibold text-drac-fg">{title}</h3>
      <p className="mt-1 text-sm text-drac-comment">{desc}</p>
    </div>
  );
}
