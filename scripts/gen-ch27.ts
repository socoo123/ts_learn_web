/**
 * 生成 src/content/chapters/ch27.json 与 local/m6/ch27/
 * 运行：bun scripts/gen-ch27.ts
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const preamble = `/**
 * Ch27 作业：Pi 的仓库地图与四种运行模式（纯函数）。
 *
 * 场景：你要「读 Pi」，先得有地图——monorepo 四包各管什么、一条命令
 * 怎么落进四种运行模式、配置与资源放在哪。作业不 import 真 Pi 包、
 * 不 clone 仓库、不装新依赖；事实全部来自本机安装包与官方文档。
 *
 * 全绿 = 你掌握了 Ch27。本地：bun test local/m6/ch27
 */

export type PiMode = "tui" | "print" | "json" | "rpc";

export type ModeInfo = {
  ctxMode: PiMode;
  hasUI: boolean;
  canPromptUser: boolean;
};

export type ResourceScope = "global" | "project";

export type ResearchPaths = { docs: string; examples: string; dist: string };`;

const functions = [
  {
    name: "packageRole",
    testSuite: "packageRole",
    skeleton: `/**
 * 【场景】新同事指着 Pi 仓库问「packages/agent 是干嘛的」。地图第一层：四个包各管一段。
 *
 * 【转换点】Pi 是 monorepo：packages/ai（调模型）、packages/agent（Agent 循环）、
 * packages/tui（终端组件）、packages/coding-agent（CLI + 四种运行模式 + SDK，主包）。
 * 入参可能带 "packages/" 前缀，也可能只有短名。不认识的 → null。
 *
 * 任务：返回中文职责描述；未知包 → null。
 * 示例：
 *   packageRole("packages/ai") 与 packageRole("ai") 返回同一句
 *   packageRole("tui") / packageRole("coding-agent") 也要对（不要只写 ai 分支）
 *   packageRole("web") → null
 *
 * 提示：先归一化（去掉 "packages/" 前缀），再查表。
 */
export function packageRole(pkg: string): string | null {
  throw new Error("TODO");
}`,
  },
  {
    name: "modeOfInvocation",
    testSuite: "modeOfInvocation",
    skeleton: `/**
 * 【场景】同一条 pi 命令，参数决定它以哪种模式跑。argv 是去掉程序名后的参数数组。
 *
 * 【转换点】四种运行模式 🔴：--mode 后跟 "rpc" / "json" 选对应模式；
 * "-p" 或 "--print" → print（单发）；都没有 → tui（默认交互）。
 * "--mode" 后面的值不认识（或缺了）→ null，不要瞎猜成 tui。
 *
 * 任务：返回模式；参数无效 → null。
 * 示例：
 *   modeOfInvocation([]) → "tui"
 *   modeOfInvocation(["-p", "机械键盘还有货吗"]) → "print"
 *   modeOfInvocation(["--mode", "rpc", "--no-session"]) → "rpc"
 *   modeOfInvocation(["--mode", "json"]) → "json"
 *   modeOfInvocation(["--mode", "gui"]) → null
 *
 * 提示：先找 "--mode" 的下一位；再查 -p / --print；最后才是默认 tui。
 */
export function modeOfInvocation(argv: string[]): PiMode | null {
  throw new Error("TODO");
}`,
  },
  {
    name: "modeCapability",
    testSuite: "modeCapability",
    skeleton: `/**
 * 【场景】扩展代码里常写 ctx.mode / ctx.hasUI 分支。你要背下这张行为表。
 *
 * 【转换点】官方 Mode Behavior 表：tui 与 rpc 的 hasUI、canPromptUser 都是 true
 * （rpc 的对话框走 extension_ui 协议）；json 与 print 都是 false（无 UI、不能问用户）。
 * ctxMode 原样回填。不认识的模式 → null。
 *
 * 任务：返回 ModeInfo；未知 → null。
 * 示例：
 *   modeCapability("tui") → { ctxMode: "tui", hasUI: true, canPromptUser: true }
 *   modeCapability("rpc") → { ctxMode: "rpc", hasUI: true, canPromptUser: true }
 *   modeCapability("json") → { ctxMode: "json", hasUI: false, canPromptUser: false }
 *   modeCapability("print") → { ctxMode: "print", hasUI: false, canPromptUser: false }
 *   modeCapability("web") → null
 *
 * 提示：rpc 也算「有 UI」是最容易记错的一条。custom() 只在 tui 可用，但不在本表字段里。
 */
export function modeCapability(mode: string): ModeInfo | null {
  throw new Error("TODO");
}`,
  },
  {
    name: "pickRunMode",
    testSuite: "pickRunMode",
    skeleton: `/**
 * 【场景】产品经理提需求，你来选运行模式。
 *
 * 【转换点】按关键词判断，顺序固定：
 *   含「嵌」→ "rpc"（嵌进网页 / IDE / 其他语言的进程外程序）
 *   否则含「单发」→ "print"（CI 一次性提问拿结果）
 *   否则含「事件流」→ "json"（无人值守流水线解析结构化事件）
 *   否则含「终端」→ "tui"（人在终端里交互）
 *   都不命中 → null
 *
 * 任务：返回推荐模式；不认识的需求 → null。
 * 示例：
 *   pickRunMode("把商品助手嵌进网页，客户端是 Python") → "rpc"
 *   pickRunMode("CI 里单发一个 prompt 拿结果就走") → "print"
 *   pickRunMode("流水线要解析事件流") → "json"
 *   pickRunMode("我在终端里交互式改代码") → "tui"
 *   pickRunMode("帮我写周报") → null
 *
 * 提示：一条一条按顺序 if，别跳步。
 */
export function pickRunMode(scenario: string): PiMode | null {
  throw new Error("TODO");
}`,
  },
  {
    name: "agentDirEntry",
    testSuite: "agentDirEntry",
    skeleton: `/**
 * 【场景】打开 ~/.pi/agent/，新同事问每个条目是什么。
 *
 * 【转换点】全局目录地图：extensions/ skills/ prompts/ themes/ 是四类资源；
 * sessions/ 存会话文件；settings.json 全局设置；models.json 自定义模型；
 * auth.json 凭据；models-store.json 远程模型目录的本地缓存。不认识 → null。
 *
 * 任务：返回中文说明；未知条目 → null。
 * 示例：
 *   agentDirEntry("settings.json") → "全局设置（与项目 .pi/settings.json 深合并）"
 *   agentDirEntry("sessions") → "会话存储（session.jsonl 按项目分目录）"
 *   agentDirEntry("auth.json") → "凭据（API Key / OAuth）"
 *   agentDirEntry("logs") → null
 *
 * 提示：查表函数。注意 models.json 与 models-store.json 是两个东西。
 */
export function agentDirEntry(name: string): string | null {
  throw new Error("TODO");
}`,
  },
  {
    name: "resourceScope",
    testSuite: "resourceScope",
    skeleton: `/**
 * 【场景】一段资源路径摆在这，它是全项目生效还是只对当前项目生效？
 *
 * 【转换点】两层作用域 🔴：~/.pi/agent/** 是 global；项目里的 .pi/** 与
 * .agents/skills/** 是 project。特例：~/.agents/skills/** 也是 global——
 * 必须先查它，否则会掉进后面的 project 规则。都不匹配 → null。
 *
 * 任务：返回 "global" | "project"；不认识 → null。
 * 示例：
 *   resourceScope("~/.pi/agent/extensions/price.ts") → "global"
 *   resourceScope("~/.agents/skills/pdf/SKILL.md") → "global"（先查这条！）
 *   resourceScope("shop/.pi/extensions/audit.ts") → "project"
 *   resourceScope("shop/.agents/skills/pdf/SKILL.md") → "project"
 *   resourceScope("/tmp/notes.txt") → null
 *
 * 提示：startsWith 判 "~" 开头的两条 global 规则；project 用 includes。
 */
export function resourceScope(path: string): ResourceScope | null {
  throw new Error("TODO");
}`,
  },
  {
    name: "researchEntryPaths",
    testSuite: "researchEntryPaths",
    skeleton: `/**
 * 【场景】不 clone 仓库，本机 npm 安装包里就有全部文档与可读源码。给安装根目录，报出三个研究入口。
 *
 * 【转换点】安装包内固定三个目录：docs/（全部官方文档）、examples/（sdk 01–13 与
 * extensions 示例）、dist/（编译产物，可读 JS + d.ts，dist/modes/ 下就是四种模式）。
 * 入参先 trim、去掉末尾多余的 "/"；空串 → null。
 *
 * 任务：返回 { docs, examples, dist } 三个绝对路径。
 * 示例：
 *   researchEntryPaths("/npm/pi") → { docs: "/npm/pi/docs", examples: "/npm/pi/examples", dist: "/npm/pi/dist" }
 *   researchEntryPaths("/npm/pi/") → 同上（尾斜杠不影响）
 *   researchEntryPaths("   ") → null
 *
 * 提示：replace(/\\/+$/, "") 去尾斜杠；三个字段都要拼。
 */
export function researchEntryPaths(installRoot: string): ResearchPaths | null {
  throw new Error("TODO");
}`,
  },
];

const assignment = `${preamble}

${functions.map((f) => f.skeleton).join("\n\n")}
`;

const testSource = `describe("packageRole", () => {
  it("packages/ 前缀与短名等价", () => {
    expect(packageRole("packages/ai")).toBe("pi-ai：LLM 提供商抽象（模型、流式、认证）");
    expect(packageRole("ai")).toBe("pi-ai：LLM 提供商抽象（模型、流式、认证）");
    expect(packageRole("packages/agent")).toBe("pi-agent-core：Agent 循环与消息类型");
  });
  it("四个包都认（防硬编码 ai）", () => {
    expect(packageRole("agent")).toBe("pi-agent-core：Agent 循环与消息类型");
    expect(packageRole("tui")).toBe("pi-tui：终端 UI 组件");
    expect(packageRole("coding-agent")).toBe("pi 主包：CLI、四种运行模式、SDK 与扩展体系");
  });
  it("未知 → null", () => {
    expect(packageRole("web")).toBeNull();
    expect(packageRole("")).toBeNull();
    expect(packageRole("packages/web")).toBeNull();
  });
});

describe("modeOfInvocation", () => {
  it("默认 tui；-p / --print → print", () => {
    expect(modeOfInvocation([])).toBe("tui");
    expect(modeOfInvocation(["-p", "机械键盘还有货吗"])).toBe("print");
    expect(modeOfInvocation(["--print"])).toBe("print");
  });
  it("--mode rpc / json；参数顺序无关", () => {
    const args: string[] = ["--mode", "rpc", "--no-session"];
    Object.freeze(args);
    expect(modeOfInvocation(args)).toBe("rpc");
    expect(modeOfInvocation(["--no-session", "--mode", "rpc"])).toBe("rpc");
    expect(modeOfInvocation(["--mode", "json"])).toBe("json");
  });
  it("不认识的 --mode → null；悬空 --mode → null", () => {
    expect(modeOfInvocation(["--mode", "gui"])).toBeNull();
    expect(modeOfInvocation(["--mode"])).toBeNull();
  });
});

describe("modeCapability", () => {
  it("tui / rpc 有 UI 能问用户", () => {
    expect(modeCapability("tui")).toEqual({ ctxMode: "tui", hasUI: true, canPromptUser: true });
    expect(modeCapability("rpc")).toEqual({ ctxMode: "rpc", hasUI: true, canPromptUser: true });
  });
  it("json / print 无 UI（防硬编码 tui）", () => {
    expect(modeCapability("json")).toEqual({ ctxMode: "json", hasUI: false, canPromptUser: false });
    expect(modeCapability("print")).toEqual({ ctxMode: "print", hasUI: false, canPromptUser: false });
  });
  it("未知 → null", () => {
    expect(modeCapability("web")).toBeNull();
  });
});

describe("pickRunMode", () => {
  it("嵌进别的程序 → rpc", () => {
    expect(pickRunMode("把商品助手嵌进网页，客户端是 Python")).toBe("rpc");
    expect(pickRunMode("问无线鼠标还有货吗的那个助手要嵌进 IDE")).toBe("rpc");
  });
  it("单发 / 事件流 / 终端", () => {
    expect(pickRunMode("CI 里单发一个 prompt 拿结果就走")).toBe("print");
    expect(pickRunMode("流水线要解析事件流")).toBe("json");
    expect(pickRunMode("我在终端里交互式改代码")).toBe("tui");
  });
  it("不认识 → null", () => {
    expect(pickRunMode("帮我写周报")).toBeNull();
  });
});

describe("agentDirEntry", () => {
  it("settings / sessions / models 两兄弟", () => {
    expect(agentDirEntry("settings.json")).toBe("全局设置（与项目 .pi/settings.json 深合并）");
    expect(agentDirEntry("sessions")).toBe("会话存储（session.jsonl 按项目分目录）");
    expect(agentDirEntry("models.json")).toBe("自定义模型与供应商");
    expect(agentDirEntry("models-store.json")).toBe("远程模型目录的本地缓存");
  });
  it("资源目录与凭据", () => {
    expect(agentDirEntry("extensions")).toBe("全局扩展目录（*.ts 或 */index.ts 自动发现）");
    expect(agentDirEntry("skills")).toBe("全局技能目录（SKILL.md）");
    expect(agentDirEntry("prompts")).toBe("全局提示模板（斜杠命令）");
    expect(agentDirEntry("themes")).toBe("主题目录");
    expect(agentDirEntry("auth.json")).toBe("凭据（API Key / OAuth）");
  });
  it("未知 → null", () => {
    expect(agentDirEntry("logs")).toBeNull();
  });
});

describe("resourceScope", () => {
  it("~ 开头都是 global（含 ~/.agents 特例）", () => {
    expect(resourceScope("~/.pi/agent/extensions/price.ts")).toBe("global");
    expect(resourceScope("~/.pi/agent/settings.json")).toBe("global");
    expect(resourceScope("~/.agents/skills/pdf/SKILL.md")).toBe("global");
  });
  it("项目内 .pi / .agents 是 project", () => {
    expect(resourceScope("shop/.pi/extensions/audit.ts")).toBe("project");
    expect(resourceScope("shop/.pi/skills/pdf/SKILL.md")).toBe("project");
    expect(resourceScope("shop/.agents/skills/pdf/SKILL.md")).toBe("project");
  });
  it("不认识 → null", () => {
    expect(resourceScope("/tmp/notes.txt")).toBeNull();
  });
});

describe("researchEntryPaths", () => {
  it("拼出三个研究入口", () => {
    expect(researchEntryPaths("/npm/pi")).toEqual({
      docs: "/npm/pi/docs",
      examples: "/npm/pi/examples",
      dist: "/npm/pi/dist",
    });
  });
  it("尾斜杠归一（含多个）", () => {
    expect(researchEntryPaths("/npm/pi/")).toEqual(researchEntryPaths("/npm/pi"));
    expect(researchEntryPaths("/npm/pi//")).toEqual(researchEntryPaths("/npm/pi"));
  });
  it("空 / 空白 → null", () => {
    expect(researchEntryPaths("")).toBeNull();
    expect(researchEntryPaths("   ")).toBeNull();
  });
});
`;

function sec(
  id: string,
  heading: string,
  secNum: string | null,
  body: string,
  exerciseFunctions: string[],
) {
  return { id, heading, secNum, body, exerciseFunctions };
}

const sections = [
  sec(
    "intro",
    "",
    null,
    `> **预计**：1 天 ｜ **前置**：Ch26（M5 收官：session、SSE、UiRow 都见过）
> **目标**：① 拿到 Pi 的「楼层图」——monorepo 四包职责、四种运行模式、配置与资源放哪；② 能在本机安装包里自己找到 docs / examples / dist，为 Ch28–Ch31 的深挖备好入口。
> 你 15 年 Java：Maven 多模块 + 一个 jar 多种入口（web / runner / batch）。Python：uv workspace。本章读的是**真实仓库的结构**，不是玩具示例。
> M6 起课程从「用 Pi」转向「读 Pi」：所有事实来自本机安装包（\`@earendil-works/pi-coding-agent\` v0.85.x）与 https://pi.dev/docs/latest 。

> 📐 **本教程的契约**：下面每一节（§27.1–§27.7）都**精确对应**作业里的题。讲过的才考，考的必讲过。卡住时按作业函数名回查对应小节。
> **不讲**：Agent 循环内部（Ch28）、Extension/Skill/Template/Package 的写法（Ch29）、Session 文件格式（Ch30）、RPC 协议细节（Ch31）。也不 clone 仓库、不装新依赖。

---`,
    [],
  ),
  sec(
    "sec-map",
    "🗺️ 本章地图",
    null,
    `本章主线：**给 Pi 画地图**。M5 你已经会调 \`createAgentSession\`、挂工具、转 SSE；M6 开始反过来问「这玩意儿自己是怎么搭的」。第一站不是读代码，是**认路**：四个包、四种模式、两层数据目录。

读完这章 + 完成作业，你将能够：

- 说出 monorepo 四包（ai / agent / tui / coding-agent）各管什么、谁依赖谁
- 看参数说出运行模式（\`pi\` / \`pi -p\` / \`pi --mode json\` / \`pi --mode rpc\`）
- 背出模式行为表：哪种模式 \`ctx.hasUI\`、哪种不能问用户
- 按需求选模式（嵌网页 → rpc；CI 单发 → print）
- 逐条说出 \`~/.pi/agent/\` 下每个条目，分清 global / project 资源
- 在本机安装包里定位 docs / examples / dist 三个研究入口

**作业 ↔ 教程对应表**（学哪节，就去做哪题）：

| 作业题 | 对应小节 | 核心知识点 |
|--------|----------|-----------|
| \`packageRole\` | §27.1 | monorepo 四包职责 |
| \`modeOfInvocation\` | §27.2 | 参数 → 四种运行模式 |
| \`modeCapability\` | §27.3 | ctx.mode / hasUI / canPromptUser 行为表 |
| \`pickRunMode\` | §27.4 | 需求场景 → 选模式 |
| \`agentDirEntry\` | §27.5 | \`~/.pi/agent/\` 目录地图 |
| \`resourceScope\` | §27.6 | global vs project 作用域 |
| \`researchEntryPaths\` | §27.7 | 安装包 docs / examples / dist |

本地文件：\`local/m6/ch27/assignment.ts\`（改 TODO）、\`assignment.test.ts\`、\`demo.ts\`（真 Pi 片段复制区，测试不要 import）。M6 章**没有** \`app.ts\`——研究章不建 HTTP 服务。

跑测试：\`bun test local/m6/ch27\`。

---`,
    [],
  ),
  sec(
    "sec-path",
    "⏱️ 学习路径：费曼五步（约 60–90 分钟）",
    null,
    `| 步 | 你要做 | 在哪做 |
|----|--------|--------|
| ① 预览猜（2 分钟） | 猜四模式、两层配置、\`--mode rpc\` 的 hasUI | 本页 ① |
| ② 先动手 | 打开 \`local/m6/ch27/assignment.ts\` 改 TODO | 仓库 local/ |
| ③ 提取+反馈 | \`bun test local/m6/ch27\` 看红绿 | 终端 |
| ④ 费曼（2 分钟） | 大白话讲清「为什么同一包能跑出四种模式」 | 本页 ④ |
| ⑤ 存闪卡 | 章末闪卡标复习日期 | 闪卡 |

> 💡 网页这一章是只读的。作业全是查表与路径判断的纯函数，无 Key 也全绿。
> 边做边在本机跑 §27.7 的探索命令，地图会对得更牢。

---`,
    [],
  ),
  sec(
    "sec-guess",
    "① 预览猜（2 分钟 · 激活你的 Java / Python 直觉）",
    null,
    `先别看答案，凭经验猜一猜（猜错没关系）：

1. \`pi\`、\`pi -p "你好"\`、\`pi --mode rpc\`、\`pi --mode json\` 是四个程序还是同一个程序的四种模式？
2. Maven 多模块里 web 依赖 service 依赖 common；Pi 的 \`packages/ai\`、\`packages/agent\`、\`packages/coding-agent\` 谁在最底层？
3. \`~/.pi/agent/settings.json\` 和项目里的 \`.pi/settings.json\` 都写了 compaction，听谁的？
4. 扩展放 \`~/.pi/agent/extensions/\` 和放项目的 \`.pi/extensions/\`，作用范围差在哪？
5. 不 clone GitHub 仓库，你能在本机哪个目录读到 Pi 全部官方文档和 13 个 SDK 示例？
6. \`pi --mode rpc\` 跑起来后，扩展里的 \`ctx.hasUI\` 是 true 还是 false？

> 猜完，带着验证心态进入正文。第 1、3、6 题是本章的 🔴。

---`,
    [],
  ),
  sec(
    "sec-world",
    "研究方法：把安装包当源码读 🔴",
    null,
    `**为什么 M6 先讲地图**：你已经会「用」SDK（M5），接下来四章要「读」它。读真实工程和读教程最大的区别是：**文件不止 3 个**。没有地图，你会陷在目录里；有了地图，每章只需要钻一条巷子。

**机制（先想清楚再背）**：Pi 发布为一个 npm 包，里面同时装了三样东西——编译后的源码（\`dist/\`，JS + d.ts）、**全部官方文档**（\`docs/*.md\`，和 pi.dev 同源）、**可运行示例**（\`examples/sdk/01–13\`）。所以「研究 Pi」不需要 clone 仓库：本机安装包就是一份冻结的快照，还免去了 build。这和 Java 世界「读源码去 Maven Central 下 sources.jar」是一个思路；Python 是 \`site-packages\` 里直接读 \`.py\`。

| | Java | Python | Pi |
|---|---|---|---|
| 仓库形态 | Maven 多模块 | uv / poetry workspace | monorepo \`packages/*\` |
| 一个包多种入口 | Spring Boot: web / CommandLineRunner / batch | 同一 CLI 多子命令 | **四种运行模式** |
| 读源码 | sources.jar | site-packages | 安装包 \`dist/\` + \`docs/\` |

仓库分层（依赖自下而上）：

\`\`\`mermaid
flowchart TB
    subgraph repo["pi monorepo（github.com/earendil-works/pi）"]
        direction TB
        ai["packages/ai<br/>pi-ai：LLM 提供商抽象<br/>模型目录 · 流式 · 认证"]
        agent["packages/agent<br/>pi-agent-core：Agent 循环<br/>与消息类型"]
        tui["packages/tui<br/>pi-tui：终端 UI 组件"]
        ca["packages/coding-agent<br/>主包：CLI · 四种运行模式<br/>SDK · 扩展体系 · 会话"]
        ai --> agent
        agent --> ca
        tui --> ca
    end
    user["你的项目<br/>M5 商品助手"] -->|"npm 包"| ca
    docs["docs/ · examples/ · dist/<br/>随包分发"] -.->|"研究入口"| user

    style repo fill:#E3F2FD,stroke:#1976D2,color:#1f1f1f
    style ai fill:#90CAF9,stroke:#1976D2,color:#1f1f1f
    style agent fill:#A5D6A7,stroke:#388E3C,color:#1f1f1f
    style tui fill:#CE93D8,stroke:#7B1FA2,color:#1f1f1f
    style ca fill:#FFE082,stroke:#F9A825,color:#1f1f1f
    style user fill:#80DEEA,stroke:#0097A7,color:#1f1f1f
    style docs fill:#FFCC80,stroke:#F57C00,color:#1f1f1f
\`\`\`

证据就在本机：\`ls dist/modes/\` 会看到四个目录——\`interactive/\`、\`print-mode\`、\`json-event\`、\`rpc/\`。**四种运行模式不是四个产品，是同一套 harness 的四个壳**：

\`\`\`mermaid
flowchart LR
    cli["pi 命令<br/>（或 SDK 调用）"] --> q1{"参数?"}
    q1 -->|"默认"| tuiM["tui<br/>全屏终端交互"]
    q1 -->|"-p"| printM["print<br/>单发即走"]
    q1 -->|"--mode json"| jsonM["json<br/>事件流到 stdout"]
    q1 -->|"--mode rpc"| rpcM["rpc<br/>stdin/stdout JSONL"]

    style cli fill:#FFE082,stroke:#F9A825,color:#1f1f1f
    style q1 fill:#80DEEA,stroke:#0097A7,color:#1f1f1f
    style tuiM fill:#90CAF9,stroke:#1976D2,color:#1f1f1f
    style printM fill:#A5D6A7,stroke:#388E3C,color:#1f1f1f
    style jsonM fill:#CE93D8,stroke:#7B1FA2,color:#1f1f1f
    style rpcM fill:#FFCC80,stroke:#F57C00,color:#1f1f1f
\`\`\`

对照 Java：像同一个 Service 挂了 REST / gRPC / 定时三种 transport；Python：FastAPI 同一 app 用 uvicorn 跑或 TestClient 跑。**内核（AgentSession）不变，壳决定 IO**。Ch28 读内核，Ch31 读 rpc 壳的协议。

### ❌ / ✅

\`\`\`ts
// ❌ 研究第一步就 git clone 整个仓库（不需要，也超出课程红线）
// ❌ 以为 --mode rpc 是「另一个人写的另一个程序」
// ❌ 在作业里 import 真 Pi 包（作业是纯函数查表）
// ✅ 读本机安装包：dist/ 看结构、docs/ 读文档、examples/ 抄最小示例
\`\`\`

---`,
    [],
  ),
  sec(
    "sec-27.1",
    "§27.1 四个包各管什么（对应：`packageRole`）🟡",
    "27.1",
    `Maven 老手看 monorepo 先看 \`<modules>\`。Pi 的 \`packages/\` 四个目录，自下而上：

| 目录 | npm 包名 | 职责 |
|---|---|---|
| \`packages/ai\` | pi-ai | LLM 提供商抽象：模型目录、流式事件、认证（M5 Ch22 用过 \`getModel\`） |
| \`packages/agent\` | pi-agent-core | **Agent 循环**与消息类型（Ch28 整章读它） |
| \`packages/tui\` | pi-tui | 终端 UI 组件（扩展画自定义界面用） |
| \`packages/coding-agent\` | 主包 | CLI、四种运行模式、SDK（\`createAgentSession\`）、扩展/技能/会话体系 |

\`\`\`ts
function packageRole(pkg: string): string | null {
  const short = pkg.startsWith("packages/") ? pkg.slice("packages/".length) : pkg;
  const roles: Record<string, string> = {
    "ai": "pi-ai：LLM 提供商抽象（模型、流式、认证）",
    "agent": "pi-agent-core：Agent 循环与消息类型",
    "tui": "pi-tui：终端 UI 组件",
    "coding-agent": "pi 主包：CLI、四种运行模式、SDK 与扩展体系",
  };
  return roles[short] ?? null;
}
\`\`\`

要点：**归一化再查表**（\`packages/ai\` 和 \`ai\` 是同一个包）；未知返回 \`null\` 而不是猜。这是全书反复出现的「边界数据别信」习惯（Ch07 zod、Ch18 HTTP 门口）。

依赖方向：\`ai ← agent ← coding-agent\`，\`tui ← coding-agent\`。所以 Ch22 讲的 \`pi-ai\` 是最底层——它根本不知道「Agent」是什么，只知道「调模型」。

### ❌ / ✅

\`\`\`ts
// ❌ 只写 if (pkg === "ai") 一个分支（测试四个包都考）
// ❌ 未知包返回 "" 或 undefined（要 null）
// ✅ 先去 "packages/" 前缀再查表；查不到 → null
\`\`\`

> ✅ **做 \`packageRole\`**：四包职责一句话说清。

---`,
    ["packageRole"],
  ),
  sec(
    "sec-27.2",
    "§27.2 参数决定模式（对应：`modeOfInvocation`）🔴",
    "27.2",
    `**机制**：为什么同一份代码能跑出四种形态？因为「模式」只是**入口函数不同**——\`InteractiveMode\` / \`runPrintMode\` / \`runRpcMode\` 是 SDK 导出的三个函数（\`dist/modes/\` 里第四个 json 是事件流写法）。CLI 解析完参数挑一个入口，把同一个 \`AgentSessionRuntime\` 塞进去。你在 Ch25 已经见过 \`createAgentSession\`；模式就是「谁拿着 session 做 IO」。

| 命令 | 模式 | 典型用途 |
|---|---|---|
| \`pi\` | tui | 人在终端里交互 |
| \`pi -p "问一句"\` | print | 单发拿结果就走（CI / 脚本） |
| \`pi --mode json\` | json | 事件流写 stdout，无人值守解析 |
| \`pi --mode rpc --no-session\` | rpc | 嵌进别的程序（Ch31 整章协议） |

\`\`\`ts
function modeOfInvocation(argv: string[]): PiMode | null {
  const i = argv.indexOf("--mode");
  if (i !== -1) {
    const v = argv[i + 1];
    if (v === "rpc" || v === "json") return v;
    return null; // 不认识 / 悬空
  }
  if (argv.includes("-p") || argv.includes("--print")) return "print";
  return "tui";
}
\`\`\`

顺序有讲究：**先查 \`--mode\`**（它是显式声明），再查 \`-p\`，最后默认 tui。\`--mode gui\` 这种不认识的值返回 \`null\`—— CLI 世界里无效参数应该报错退出，不是悄悄退回默认（对照 Java：\`IllegalArgumentException\`，不要 catch 成默认值）。

测试会 \`Object.freeze\` 参数数组：你的函数不许改入参。

### ❌ / ✅

\`\`\`ts
// ❌ includes("--mode") 就返回 "rpc"（--mode json 呢？）
// ❌ "--mode" 在末尾时读 argv[i+1] === undefined 当 tui
// ❌ 先查 -p 再查 --mode（显式声明应该赢）
// ✅ indexOf("--mode") 看下一位；rpc/json 之外 → null
\`\`\`

> ✅ **做 \`modeOfInvocation\`**：参数 → 四模式，无效 → null。

---`,
    ["modeOfInvocation"],
  ),
  sec(
    "sec-27.3",
    "§27.3 模式行为表（对应：`modeCapability`）🟡",
    "27.3",
    `扩展代码到处是 \`ctx.mode\` / \`ctx.hasUI\` 分支，这张表来自官方 Mode Behavior：

| 模式 | ctx.mode | ctx.hasUI | 能问用户？ | 备注 |
|---|---|---|---|---|
| Interactive | \`"tui"\` | true | ✅ | 全终端渲染；\`ctx.ui.custom()\` 只在这可用 |
| RPC | \`"rpc"\` | true | ✅ | 对话框走 extension_ui 协议（Ch31）；\`custom()\` 返回 undefined |
| JSON | \`"json"\` | false | ❌ | 事件流到 stdout；UI 方法是 no-op |
| Print | \`"print"\` | false | ❌ | 单发；扩展不能弹任何问题 |

\`\`\`ts
function modeCapability(mode: string): ModeInfo | null {
  const table: Record<string, ModeInfo> = {
    tui: { ctxMode: "tui", hasUI: true, canPromptUser: true },
    rpc: { ctxMode: "rpc", hasUI: true, canPromptUser: true },
    json: { ctxMode: "json", hasUI: false, canPromptUser: false },
    print: { ctxMode: "print", hasUI: false, canPromptUser: false },
  };
  return table[mode] ?? null;
}
\`\`\`

最容易记错的一条：**rpc 也是「有 UI」**——因为它能通过协议把确认框推给宿主程序代答。Java 直觉是「没有浏览器/终端 = 没有 UI」；这里 hasUI 的语义是「**存在一条能到用户面前的交互通道**」，rpc 的通道就是 JSON 协议。

### ❌ / ✅

\`\`\`ts
// ❌ rpc 的 hasUI 写 false（对话框能通过协议送达）
// ❌ print 写 canPromptUser: true（单发模式没人在听）
// ✅ 查表返回新对象；未知模式 → null
\`\`\`

> ✅ **做 \`modeCapability\`**：rpc 有 UI 是考点。

---`,
    ["modeCapability"],
  ),
  sec(
    "sec-27.4",
    "§27.4 按需求选模式（对应：`pickRunMode`）🟢",
    "27.4",
    `把 §27.2–§27.3 的表倒过来用：需求 → 模式。

| 需求关键词 | 选它 | 为什么 |
|---|---|---|
| 嵌进网页 / IDE / 其他语言 | rpc | 进程外、协议化，宿主语言不限（Ch31） |
| CI 单发一个 prompt | print | 拿结果就退出，不留会话 |
| 流水线解析结构化事件 | json | 事件流写 stdout，接 \`|\` 管道 |
| 人在终端交互 | tui | 全屏编辑器 + 历史 + 斜杠命令 |

\`\`\`ts
function pickRunMode(scenario: string): PiMode | null {
  if (scenario.includes("嵌")) return "rpc";
  if (scenario.includes("单发")) return "print";
  if (scenario.includes("事件流")) return "json";
  if (scenario.includes("终端")) return "tui";
  return null;
}
\`\`\`

「嵌」排第一：嵌进宿主程序是最强信号——宿主要的是**持续会话 + 事件流 + 双向命令**，只有 rpc 给得了。测试还有一条 \`pickRunMode("问无线鼠标还有货吗的助手要嵌进 IDE")\` → \`"rpc"\`：关键词是「嵌」，不是商品名——别硬编码场景字符串。对照选型：Java 里选 REST 还是 gRPC 还是 MQ，也是先问「谁调、多久、要不要流」。

都不命中返回 \`null\`——需求听不懂就别推荐，别硬塞 tui。

### ❌ / ✅

\`\`\`ts
// ❌ 顺序乱来（先查「终端」会把「嵌进网页在终端展示」判成 tui）
// ❌ 兜底 return "tui"（不认识就别推荐）
// ✅ 嵌 > 单发 > 事件流 > 终端，逐条 if
\`\`\`

> ✅ **做 \`pickRunMode\`**：关键词顺序就是优先级。

---`,
    ["pickRunMode"],
  ),
  sec(
    "sec-27.5",
    "§27.5 ~/.pi/agent/ 目录地图（对应：`agentDirEntry`）🔴",
    "27.5",
    `**机制**：为什么配置分两层？Pi 要同时服务「你这台机器的所有项目」和「单个项目」——全局层（\`~/.pi/agent/\`）放身份与偏好（凭据、默认模型、全局扩展），项目层（\`<项目>/.pi/\`）放项目约定（项目扩展、项目设置）。和 Git 的 \`~/.gitconfig\` vs \`repo/.git/config\`、Maven 的 \`~/.m2/settings.xml\` vs \`pom.xml\` 完全同构。**合并规则：项目覆盖全局，嵌套对象按键深合并**（Ch30 的 \`mergeCompactionSettings\` 会动手实现它）。

\`\`\`mermaid
flowchart TB
    subgraph agentDir["~/.pi/agent/（全局层）"]
        direction TB
        res["extensions/ · skills/ · prompts/ · themes/"]
        sess["sessions/（session.jsonl 按项目分目录）"]
        set["settings.json（全局设置）"]
        mod["models.json（自定义模型）<br/>models-store.json（目录缓存）"]
        auth["auth.json（凭据）"]
    end
    proj["项目 <cwd>/.pi/<br/>settings.json · extensions/ · skills/ · prompts/"] -->|"深合并 覆盖全局"| set
    agentsMd["AGENTS.md（从 cwd 向上找）"] -.->|"上下文文件"| proj

    style agentDir fill:#E3F2FD,stroke:#1976D2,color:#1f1f1f
    style res fill:#90CAF9,stroke:#1976D2,color:#1f1f1f
    style sess fill:#A5D6A7,stroke:#388E3C,color:#1f1f1f
    style set fill:#FFE082,stroke:#F9A825,color:#1f1f1f
    style mod fill:#CE93D8,stroke:#7B1FA2,color:#1f1f1f
    style auth fill:#EF9A9A,stroke:#C62828,color:#1f1f1f
    style proj fill:#80DEEA,stroke:#0097A7,color:#1f1f1f
    style agentsMd fill:#FFCC80,stroke:#F57C00,color:#1f1f1f
\`\`\`

逐条对应 \`agentDirEntry\` 的表：四个资源目录、\`sessions/\`、\`settings.json\`、\`models.json\`、\`auth.json\`、\`models-store.json\`。

注意 \`models.json\` 和 \`models-store.json\` 是**两个东西**：前者是你手写的自定义模型/供应商声明；后者是 Pi 从 pi.dev 拉的远程模型目录缓存（四小时节流刷新）。一个是「你告诉 Pi 的」，一个是「Pi 自己记的」。

### ❌ / ✅

\`\`\`ts
// ❌ models.json 与 models-store.json 混为一谈
// ❌ 以为 sessions/ 是全局共享一个文件（按项目 cwd 分目录、一回合一个 jsonl）
// ✅ 查表；auth.json 描述里带上 OAuth；未知 → null
\`\`\`

> ✅ **做 \`agentDirEntry\`**：每个条目一句话。

---`,
    ["agentDirEntry"],
  ),
  sec(
    "sec-27.6",
    "§27.6 global 还是 project（对应：`resourceScope`）🔴",
    "27.6",
    `**机制**：一条路径判断作用域，看的是**锚点**而不是文件名。\`~\` 开头锚在用户主目录 → global；\`.pi/\`、\`.agents/skills/\` 锚在项目里 → project。坑在 \`.agents/skills\` 有**两个家**：\`~/.agents/skills/\` 是全局技能目录之一，\`<项目>/.agents/skills/\` 是项目技能目录（还会沿父目录向上找到 git 根）。所以判定必须**先查 \`~\` 前缀**，再查项目模式——顺序反了，\`~/.agents/skills/...\` 会因为包含 \`.agents/skills\` 被误判成 project。

\`\`\`mermaid
flowchart TD
    p["一条资源路径"] --> homeQ{"~ 开头?"}
    homeQ -->|"是"| g["global"]
    homeQ -->|"否"| piQ{"含 /.pi/ 或以 .pi/ 开头<br/>或含 .agents/skills?"}
    piQ -->|"是"| pr["project"]
    piQ -->|"否"| n["null 不认识"]

    style p fill:#FFE082,stroke:#F9A825,color:#1f1f1f
    style homeQ fill:#80DEEA,stroke:#0097A7,color:#1f1f1f
    style piQ fill:#80DEEA,stroke:#0097A7,color:#1f1f1f
    style g fill:#90CAF9,stroke:#1976D2,color:#1f1f1f
    style pr fill:#A5D6A7,stroke:#388E3C,color:#1f1f1f
    style n fill:#EF9A9A,stroke:#C62828,color:#1f1f1f
\`\`\`

\`\`\`ts
function resourceScope(path: string): ResourceScope | null {
  if (path.startsWith("~/.pi/agent") || path.startsWith("~/.agents/skills")) return "global";
  if (path.includes("/.pi/") || path.startsWith(".pi/") || path.includes(".agents/skills")) {
    return "project";
  }
  return null;
}
\`\`\`

为什么这重要：项目里的 \`.pi/extensions/\` **只在该项目被信任（trust）后才加载**——克隆一个陌生仓库不能让里面的代码自动在你机器上跑。安全模型和浏览器「站点隔离」、Java「不执行来源不明 jar」同一个道理。

### ❌ / ✅

\`\`\`ts
// ❌ 先查 .agents/skills 再查 ~（~/.agents/... 会误判 project）
// ❌ 任意路径都给个答案（/tmp/x → null）
// ✅ ~ 前缀两条 global 规则优先；项目特征用 includes
\`\`\`

> ✅ **做 \`resourceScope\`**：先 ~ 后项目，都不中 → null。

---`,
    ["resourceScope"],
  ),
  sec(
    "sec-27.7",
    "§27.7 三个研究入口（对应：`researchEntryPaths`）🟡",
    "27.7",
    `M6 后面四章的事实源就是你本机的安装包。给它根目录，三个入口固定存在：

| 入口 | 里面有什么 | 你怎么用 |
|---|---|---|
| \`<root>/docs\` | 全部官方文档（sdk.md、rpc.md、compaction.md、session-format.md…） | Ch28–Ch31 逐章精读 |
| \`<root>/examples\` | \`sdk/01–13\` 最小到全控示例；\`extensions/\` 扩展示例 | 抄最小可运行片段 |
| \`<root>/dist\` | 编译产物：JS + d.ts；\`dist/modes/\` 四模式入口 | 看真导出、真类型 |

\`\`\`ts
function researchEntryPaths(installRoot: string): ResearchPaths | null {
  const root = installRoot.trim().replace(/\\/+$/, "");
  if (root === "") return null;
  return { docs: root + "/docs", examples: root + "/examples", dist: root + "/dist" };
}
\`\`\`

本机真实根目录（教程里查得到、作业里不硬编码）：

\`\`\`bash
npm root -g
# /opt/homebrew/lib/node_modules
ls "$(npm root -g)/@earendil-works/pi-coding-agent/docs"   # 全部文档
ls "$(npm root -g)/@earendil-works/pi-coding-agent/examples/sdk"  # 01–13
ls "$(npm root -g)/@earendil-works/pi-coding-agent/dist/modes"    # 四模式
\`\`\`

这题综合了路径归一化（trim、去尾斜杠）和「空输入 → null」的边界习惯。对照 Java：\`Path.normalize()\`；这里手写是因为 JSON 作业不 import 任何模块。

### ❌ / ✅

\`\`\`ts
// ❌ 返回 "/npm/pi//docs"（没去重复尾斜杠）
// ❌ 空串也拼出 "/docs"
// ✅ trim + replace(/\\/+$/, "")；空 → null；三个字段都拼
\`\`\`

> ✅ **做 \`researchEntryPaths\`**：然后 \`bun test local/m6/ch27\`。

---`,
    ["researchEntryPaths"],
  ),
  sec(
    "sec-pits",
    "⚠️ Java / Python 老手几个坑",
    null,
    `1. **研究第一步就 clone 仓库。** 安装包里 docs/dist/examples 齐全，够了；课程也禁止 clone。
2. **以为四种模式是四个产品。** 同一 harness 四个壳，\`dist/modes/\` 四个目录就是证据。
3. **\`--mode gui\` 静默退回 tui。** 无效参数返回 null / 报错，不是兜底。
4. **先查 \`.agents/skills\` 再查 \`~\`。** \`~/.agents/skills/\` 是 global，顺序反了必错。
5. **rpc 的 hasUI 记成 false。** 有交互通道就算有 UI，对话框走协议代答。
6. **models.json 与 models-store.json 混谈。** 一个你声明，一个 Pi 缓存。
7. **全局 settings 与项目 settings 当成二选一。** 是深合并，项目覆盖全局。
8. **以为项目 \`.pi/extensions\` 无条件加载。** 要先过项目信任（trust）。
9. **作业里 import 真 Pi 包 / fetch。** M6 作业全是纯函数查表，红线不变。
10. **没有 Key 就觉得研究不了。** 读文档和 dist 不需要 Key；Ch31 的协议作业也不打网。

---`,
    [],
  ),
  sec(
    "sec-homework",
    "📝 本章作业",
    null,
    `上面 7 个函数按节交错出现。每个注释里有【场景】【转换点】、示例和提示。

**完成方式**：打开仓库 \`local/m6/ch27/assignment.ts\`，把 \`throw new Error("TODO")\` 换成实现，然后：

\`\`\`bash
bun test local/m6/ch27
\`\`\`

M6 没有 \`app.ts\`：本章不建 HTTP 服务。真 Pi 片段（SDK 最小示例、探索命令）在 \`demo.ts\` 复制区，**测试不要 import 它**。

卡住就回对应 §：\`packageRole\` → §27.1，\`modeOfInvocation\` → §27.2，\`modeCapability\` → §27.3，\`pickRunMode\` → §27.4，\`agentDirEntry\` → §27.5，\`resourceScope\` → §27.6（先查 ~），\`researchEntryPaths\` → §27.7。

---`,
    [],
  ),
  sec(
    "sec-check",
    "✅ 自测：你真的掌握了吗？",
    null,
    `- [ ] 能对同事说出四包职责和依赖方向（ai ← agent ← coding-agent；tui ← coding-agent）
- [ ] 看到 \`pi -p\` / \`--mode json\` / \`--mode rpc\` 能立刻说出模式与典型用途
- [ ] 背得出行为表：tui/rpc 有 UI 能问；json/print 都不行
- [ ] \`--mode\` 的值不认识会返回 null，而不是默默 tui
- [ ] 能逐条说 \`~/.pi/agent/\` 条目；分清 models.json / models-store.json
- [ ] 知道 \`~/.agents/skills\` 是 global、项目 \`.agents/skills\` 是 project，判定顺序不能反
- [ ] 本机能三秒找到 docs / examples / dist 三个研究入口
- [ ] \`bun test local/m6/ch27\` 全绿；没有 clone 仓库、没有装新依赖、没有 import 真 Pi 包

---`,
    [],
  ),
  sec(
    "sec-feynman",
    "🎓 费曼挑战",
    null,
    `用大白话讲给「Java 同事」听。讲不清 = 还没真懂。

任选一题（1–2 分钟）：

1. 「为什么说 Pi 的四种模式不是四个产品？拿 Maven/Spring 打比方。」— 卡壳重读总述
2. 「\`~/.pi/agent\` 和项目 \`.pi\` 的关系，像你用过的哪两个 Git/Maven 配置？合并规则是什么？」— 卡壳重读 §27.5
3. 「不 clone 仓库，你怎么读 Pi 的文档和源码？\`resourceScope\` 那个 \`~/.agents\` 的坑在讲什么？」— 卡壳重读 §27.6 + §27.7

---`,
    [],
  ),
  sec(
    "sec-next",
    "⏭️ 下一步",
    null,
    `Ch27 掌握后，你有了地图。**Ch28 进第一条巷子**：\`packages/agent\`（pi-agent-core）——Agent 循环怎么转：prompt → LLM 流 → 工具并行执行 → 结果追加 → 再调 LLM，直到模型不再要工具。你会用事件嵌套顺序、\`agent_end\` vs \`agent_settled\`、steer / followUp 的投递缝隙把循环钉在墙上。

读之前可以先做一件事：打开 \`<root>/docs/sdk.md\` 搜 \`agent_settled\`，带着「这事件和 agent_end 差在哪」进 Ch28。`,
    [],
  ),
];

const tutorialMd = `# Ch27 · 仓库地图与四种运行模式

${sections
  .map((s) => (s.heading ? `## ${s.heading}\n\n${s.body}` : s.body))
  .join("\n\n")}
`;

const reviewMd = `# Ch27 · 记忆闪卡

> 先回忆，再翻答案。连续 2 次秒答 → 退役。

## 🔖 闪卡

| # | 正面（问题） | 背面（答案） | 掌握 |
|---|---|---|---|
| 1 | Pi monorepo 四个包各管什么？依赖方向？ | ai=LLM 抽象、agent=Agent 循环、tui=终端组件、coding-agent=CLI/SDK/四模式主包；ai ← agent ← coding-agent，tui ← coding-agent。 | ⬜ |
| 2 | \`pi\` / \`pi -p\` / \`--mode json\` / \`--mode rpc\` 分别是什么模式？ | tui（默认交互）、print（单发）、json（事件流到 stdout）、rpc（stdin/stdout JSONL 嵌入）。 | ⬜ |
| 3 | 哪些模式 ctx.hasUI 为 true？rpc 能问用户吗？ | tui 和 rpc 为 true；rpc 对话框走 extension_ui 协议代答，canPromptUser 也是 true；json/print 全 false。 | ⬜ |
| 4 | \`--mode gui\` 这种参数该返回什么？ | null（无效参数报错/拒绝），不能静默退回默认 tui。 | ⬜ |
| 5 | \`~/.pi/agent/\` 里 sessions/ 和两个 models 文件分别是什么？ | sessions/=按项目分目录的会话 jsonl；models.json=你声明的自定义模型；models-store.json=Pi 拉的远程目录缓存。 | ⬜ |
| 6 | \`~/.agents/skills/\` 和项目 \`.agents/skills/\` 各是什么作用域？判定顺序？ | 前者 global，后者 project（还会向上找到 git 根）。必须先查 \`~\` 前缀再查项目特征，否则误判。 | ⬜ |
| 7 | 全局与项目 settings.json 冲突听谁的？ | 深合并，项目覆盖全局（嵌套对象按键合并）。 | ⬜ |
| 8 | 不 clone 仓库，去哪读 Pi 文档 / 示例 / 源码？ | 安装包三入口：\`<root>/docs\`、\`<root>/examples\`（sdk 01–13）、\`<root>/dist\`（含 dist/modes 四模式）。 | ⬜ |
| 9 | M6 作业红线？没有 Key 能研究吗？ | 不 clone、不装新依赖、作业不 import 真 Pi 包；读 docs/dist 不需要 Key。 | ⬜ |

## 🎓 费曼自检

- [ ] 能用 Maven/Spring 类比讲清 monorepo 分层与「一个包四种入口」
- [ ] 能讲清两层配置（global/project）与 trust 的安全含义
- [ ] 能指出本机三个研究入口并现场打开
`;

const chapter = {
  id: "ch27",
  num: "27",
  title: "仓库地图与四种运行模式",
  runMode: "local" as const,
  tutorialMd,
  assignment,
  testName: "ch27_assignment",
  testSource,
  reviewMd,
  interleaved: true,
  sections,
  functions,
  preamble,
  localHint: "bun test local/m6/ch27",
};

const root = dirname(fileURLToPath(import.meta.url));
const out = join(root, "../src/content/chapters/ch27.json");
mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, JSON.stringify(chapter, null, 2) + "\n");
console.log("wrote", out);

const localDir = join(root, "../local/m6/ch27");
mkdirSync(localDir, { recursive: true });

const localAssignment = `/**
 * Ch27 作业：Pi 的仓库地图与四种运行模式（纯函数）。
 *
 * 场景：你要「读 Pi」，先得有地图——四包职责、四种运行模式、资源放哪。
 * 打开本文件改 TODO，然后：bun test local/m6/ch27
 *
 * 不要 import 真 Pi 包 / 不要 clone 仓库 / 不装新依赖。
 */

${preamble}

${functions.map((f) => f.skeleton).join("\n\n")}
`;

const localTest = `import { describe, expect, test } from "bun:test";
import {
  agentDirEntry,
  modeCapability,
  modeOfInvocation,
  packageRole,
  pickRunMode,
  researchEntryPaths,
  resourceScope,
} from "./assignment";

describe("packageRole", () => {
  test("packages/ 前缀与短名等价", () => {
    expect(packageRole("packages/ai")).toBe("pi-ai：LLM 提供商抽象（模型、流式、认证）");
    expect(packageRole("ai")).toBe("pi-ai：LLM 提供商抽象（模型、流式、认证）");
    expect(packageRole("packages/agent")).toBe("pi-agent-core：Agent 循环与消息类型");
  });
  test("四个包都认（防硬编码 ai）", () => {
    expect(packageRole("tui")).toBe("pi-tui：终端 UI 组件");
    expect(packageRole("coding-agent")).toBe("pi 主包：CLI、四种运行模式、SDK 与扩展体系");
  });
  test("未知 → null", () => {
    expect(packageRole("web")).toBeNull();
    expect(packageRole("packages/web")).toBeNull();
  });
});

describe("modeOfInvocation", () => {
  test("默认 tui；-p / --print → print", () => {
    expect(modeOfInvocation([])).toBe("tui");
    expect(modeOfInvocation(["-p", "机械键盘还有货吗"])).toBe("print");
    expect(modeOfInvocation(["--print"])).toBe("print");
  });
  test("--mode rpc / json；freeze 不改入参", () => {
    const args: string[] = ["--mode", "rpc", "--no-session"];
    Object.freeze(args);
    expect(modeOfInvocation(args)).toBe("rpc");
    expect(modeOfInvocation(["--no-session", "--mode", "rpc"])).toBe("rpc");
    expect(modeOfInvocation(["--mode", "json"])).toBe("json");
    expect(args).toEqual(["--mode", "rpc", "--no-session"]);
  });
  test("不认识 / 悬空 --mode → null", () => {
    expect(modeOfInvocation(["--mode", "gui"])).toBeNull();
    expect(modeOfInvocation(["--mode"])).toBeNull();
  });
});

describe("modeCapability", () => {
  test("四种模式行为表", () => {
    expect(modeCapability("tui")).toEqual({ ctxMode: "tui", hasUI: true, canPromptUser: true });
    expect(modeCapability("rpc")).toEqual({ ctxMode: "rpc", hasUI: true, canPromptUser: true });
    expect(modeCapability("json")).toEqual({ ctxMode: "json", hasUI: false, canPromptUser: false });
    expect(modeCapability("print")).toEqual({ ctxMode: "print", hasUI: false, canPromptUser: false });
  });
  test("未知 → null", () => {
    expect(modeCapability("web")).toBeNull();
  });
});

describe("pickRunMode", () => {
  test("嵌 → rpc；其余三类", () => {
    expect(pickRunMode("把商品助手嵌进网页，客户端是 Python")).toBe("rpc");
    expect(pickRunMode("问无线鼠标还有货吗的助手要嵌进 IDE")).toBe("rpc");
    expect(pickRunMode("CI 里单发一个 prompt 拿结果就走")).toBe("print");
    expect(pickRunMode("流水线要解析事件流")).toBe("json");
    expect(pickRunMode("我在终端里交互式改代码")).toBe("tui");
  });
  test("不认识 → null", () => {
    expect(pickRunMode("帮我写周报")).toBeNull();
  });
});

describe("agentDirEntry", () => {
  test("配置与数据条目", () => {
    expect(agentDirEntry("settings.json")).toBe("全局设置（与项目 .pi/settings.json 深合并）");
    expect(agentDirEntry("sessions")).toBe("会话存储（session.jsonl 按项目分目录）");
    expect(agentDirEntry("models.json")).toBe("自定义模型与供应商");
    expect(agentDirEntry("models-store.json")).toBe("远程模型目录的本地缓存");
    expect(agentDirEntry("auth.json")).toBe("凭据（API Key / OAuth）");
  });
  test("资源目录；未知 → null", () => {
    expect(agentDirEntry("extensions")).toBe("全局扩展目录（*.ts 或 */index.ts 自动发现）");
    expect(agentDirEntry("skills")).toBe("全局技能目录（SKILL.md）");
    expect(agentDirEntry("prompts")).toBe("全局提示模板（斜杠命令）");
    expect(agentDirEntry("themes")).toBe("主题目录");
    expect(agentDirEntry("logs")).toBeNull();
  });
});

describe("resourceScope", () => {
  test("~ 开头都是 global（含 ~/.agents 特例）", () => {
    expect(resourceScope("~/.pi/agent/extensions/price.ts")).toBe("global");
    expect(resourceScope("~/.pi/agent/settings.json")).toBe("global");
    expect(resourceScope("~/.agents/skills/pdf/SKILL.md")).toBe("global");
  });
  test("项目内 .pi / .agents 是 project；其它 null", () => {
    expect(resourceScope("shop/.pi/extensions/audit.ts")).toBe("project");
    expect(resourceScope("shop/.pi/skills/pdf/SKILL.md")).toBe("project");
    expect(resourceScope("shop/.agents/skills/pdf/SKILL.md")).toBe("project");
    expect(resourceScope("/tmp/notes.txt")).toBeNull();
  });
});

describe("researchEntryPaths", () => {
  test("拼出三个研究入口；尾斜杠归一", () => {
    const paths = researchEntryPaths("/npm/pi");
    expect(paths).toEqual({ docs: "/npm/pi/docs", examples: "/npm/pi/examples", dist: "/npm/pi/dist" });
    expect(researchEntryPaths("/npm/pi/")).toEqual(paths);
    expect(researchEntryPaths("/npm/pi//")).toEqual(paths);
  });
  test("空 / 空白 → null", () => {
    expect(researchEntryPaths("")).toBeNull();
    expect(researchEntryPaths("   ")).toBeNull();
  });
});
`;

const demoSource = `/**
 * Ch27 · 研究入口复制区（M6 第一章）。
 *
 * 本文件只给阅读 / 复制。测试禁止 import 本文件。
 * 全部真代码都在字符串里，if (false) 守护，不执行、不打网、不需要 Key。
 *
 * 事实源：本机安装包（npm 全局）+ https://pi.dev/docs/latest
 * 不要 clone 仓库；不要在课程仓库装 @earendil-works/*（M6 作业是纯函数）。
 */

// 复制区 1：探索本机安装包（shell，粘到终端跑）
const EXPLORE_INSTALL = \`
npm root -g
# → /opt/homebrew/lib/node_modules（macOS Homebrew npm）

ROOT="$(npm root -g)/@earendil-works/pi-coding-agent"
ls "$ROOT/docs"        # 全部官方文档：sdk.md rpc.md compaction.md session-format.md ...
ls "$ROOT/examples"    # sdk/ 01–13、extensions/、plugins/
ls "$ROOT/examples/sdk" | head
ls "$ROOT/dist/modes"  # interactive/  print-mode  json-event  rpc/  ← 四种运行模式的证据
\`;

// 复制区 2：SDK 最小示例（来自官方 docs/sdk.md，Node 同进程嵌入）
const SDK_QUICKSTART = \`
import { createAgentSession, ModelRuntime, SessionManager } from "@earendil-works/pi-coding-agent";

const modelRuntime = await ModelRuntime.create();
const { session } = await createAgentSession({
  sessionManager: SessionManager.inMemory(),
  modelRuntime,
});

session.subscribe((event) => {
  if (event.type === "message_update" && event.assistantMessageEvent.type === "text_delta") {
    process.stdout.write(event.assistantMessageEvent.delta);
  }
});

await session.prompt("机械键盘还有货吗？");
\`;

// 复制区 3：看安装包里四种模式的真实入口（dist/modes）
const SEE_FOUR_MODES = \`
cat "$(npm root -g)/@earendil-works/pi-coding-agent/dist/modes/index.d.ts"
# 导出 InteractiveMode、runPrintMode、runRpcMode 等——
# 四种模式 = 同一 AgentSessionRuntime 的四个壳（§27.2 的证据）
\`;

if (false) {
  console.log(EXPLORE_INSTALL);
  console.log(SDK_QUICKSTART);
  console.log(SEE_FOUR_MODES);
}
`;

writeFileSync(join(localDir, "assignment.ts"), localAssignment);
writeFileSync(join(localDir, "assignment.test.ts"), localTest);
writeFileSync(join(localDir, "demo.ts"), demoSource);
console.log("wrote", localDir);
