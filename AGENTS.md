# TypeScript 学习站

权威大纲：**[`PLAN.md`](./PLAN.md)**。清空上下文后先读它，再动手。

## 用户一说这些，就按 PLAN.md §4 SOP 执行

- 「生成 chNN」/「学 chNN」/「写第 N 章」/「重新优化 chNN」
- 读 `PLAN.md` 里该章大纲，**不扩纲不缩纲**
- 产出：`src/content/chapters/chXX.json`（教程/作业/测试/闪卡都在 JSON 里）
- JSON 有变就 `bun scripts/render-pages.ts`（可 `--chapter chNN`），刷新根目录 `index.html` 和 `chapters/`
- **不要**写 `tutorial.md` / `review.md`

## 硬限制

- 现行 **M1–M6 / Ch01–Ch31**（M6 已完成，进度看 `PLAN.md` §9）
- **M6 已开**（2026-09-15 用户明确说写）。生成 Ch28–31 前：读 `PLAN.md` §7「M6 · 研究 Pi」该章大纲 + §9.1 第 10 批（M6 生成约定），**样板章 = ch27**（JSON / gen / verify 三件照抄结构）
- M6 事实源：本机安装包 `<npm root -g>/@earendil-works/pi-coding-agent/` 内 `docs/` 与 `dist/` + https://pi.dev/docs/latest ；不编造 API、不 clone 仓库、不加 npm 依赖
- 原理 + mermaid 已补完（`PLAN.md` §9.2），不要再开补图批次
- 无 LeetCode、无运维
- 日常看站：双击 `index.html`，或双击 `启动学习站.command`（http，Monaco 红线完整）
- 不主动 git commit
