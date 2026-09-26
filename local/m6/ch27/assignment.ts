/**
 * Ch27 作业：Pi 的仓库地图与四种运行模式（纯函数）。
 *
 * 场景：你要「读 Pi」，先得有地图——四包职责、四种运行模式、资源放哪。
 * 打开本文件改 TODO，然后：bun test local/m6/ch27
 *
 * 不要 import 真 Pi 包 / 不要 clone 仓库 / 不装新依赖。
 */

/**
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

export type ResearchPaths = { docs: string; examples: string; dist: string };

/**
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
}

/**
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
}

/**
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
}

/**
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
}

/**
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
}

/**
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
}

/**
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
 * 提示：replace(/\/+$/, "") 去尾斜杠；三个字段都要拼。
 */
export function researchEntryPaths(installRoot: string): ResearchPaths | null {
  throw new Error("TODO");
}
