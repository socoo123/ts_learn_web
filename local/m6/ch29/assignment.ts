/**
 * Ch29 作业：扩展四件套 Extension / Skill / Template / Package（纯函数）。
 *
 * 场景：把商品助手的能力沉淀成资产——价格护栏扩展、库存查询技能、
 * 下单模板、共享包 shop-kit。打开本文件改 TODO，然后：bun test local/m6/ch29
 *
 * 不要 import 真 Pi 包 / 不要 clone 仓库 / 不装新依赖。
 */

/**
 * Ch29 作业：扩展四件套 Extension / Skill / Template / Package（纯函数）。
 *
 * 场景：商品助手要沉淀团队资产——价格护栏扩展、库存查询技能、
 * 下单斜杠模板、共享包 shop-kit。四种资源各管什么、放哪、怎么被
 * 加载，作业用「解析 + 判断」把加载规则写成纯函数。不 import 真
 * Pi 包、不装新依赖；事实全部来自本机安装包 docs/（extensions.md、
 * skills.md、prompt-templates.md、packages.md）与官方文档。
 *
 * 全绿 = 你掌握了 Ch29。本地：bun test local/m6/ch29
 */

export type SkillInfo = { name: string; description: string };

export type SkillInvocation = "model" | "command";

export type ResourceKind = "extension" | "skill" | "prompt" | "theme";

export type InstallSpec = { source: "npm" | "git" | "local"; name: string; ref: string | null };

export type PiPackageResources = {
  extensions: string[];
  skills: string[];
  prompts: string[];
  themes: string[];
};

/**
 * 【场景】同事交来一个「价格护栏」扩展文件，先做入口体检：这代码能被当作扩展加载吗？
 *
 * 【转换点】extension 的唯一入口约定 🔴：默认导出一个工厂函数，
 * 形如 export default (async) function (pi) {...} 或 export default (pi) => {...}。
 * 具名导出不算、默认导出对象不算、CJS 的 module.exports 不算。
 *
 * 任务：代码字符串是合法的 extension 入口 → true，否则 false。
 * 示例：
 *   extensionFactoryOk("export default function (pi) { pi.on(\"tool_call\", () => {}); }") → true
 *   extensionFactoryOk("export default async function priceGuard(pi) {}") → true（async 工厂合法）
 *   extensionFactoryOk("export default (pi) => { pi.registerCommand(\"stock\", {}); }") → true（箭头工厂）
 *   extensionFactoryOk("export function helper(pi) {}") → false（只有具名导出）
 *   extensionFactoryOk("export default { setup(pi) {} }") → false（导出的是对象不是函数）
 *
 * 提示：几条正则就够：export default + (async )?function，或 export default 后跟箭头函数。
 */
export function extensionFactoryOk(code: string): boolean {
  throw new Error("TODO");
}

/**
 * 【场景】运营写了个「库存查询」技能 SKILL.md，加载器要判断它合不合法、叫什么。
 *
 * 【转换点】SKILL.md 的 frontmatter 🔴：文件首行必须是 ---，块必须闭合；
 * name 与 description 都必填，缺 description 的技能 warning 后**不加载**。
 * 值里可以带冒号——必须按**第一个**冒号切分（split(":") 会切碎值）。
 *
 * 任务：返回 { name, description }；不合法 / 缺必填 → null。
 * 示例：
 *   "---\nname: stock-check\ndescription: 查 KB-001 与 MS-002 库存\n---\n# 正文"
 *     → { name: "stock-check", description: "查 KB-001 与 MS-002 库存" }
 *   description 值带冒号 "Use when: 库存问题" → 原样保留
 *   "---\nname: x\n---\n正文" → null（缺 description 不加载）
 *   首行不是 --- / frontmatter 没闭合 → null
 *
 * 提示：split("\n") 后逐行扫；line.indexOf(":") 拿第一个冒号；两端 trim。
 */
export function skillFromFrontmatter(md: string): SkillInfo | null {
  throw new Error("TODO");
}

/**
 * 【场景】「内部 VIP 价格规则」技能很敏感：不该让模型看单子时自作主张用，运营明确敲命令才展开。
 *
 * 【转换点】技能两种触发 🟡：默认 "model"（name+description 进系统提示，模型可自发用，
 * /skill:name 也可用）；frontmatter 写 disable-model-invocation: true → "command"
 * （从系统提示隐藏，只能 /skill:name）。false / 缺省都算 "model"；只认字面 "true"。
 * 技能本身不合法（skillFromFrontmatter 为 null）→ null。
 *
 * 任务：返回 "model" | "command"；非法技能 → null。
 * 示例：
 *   "...disable-model-invocation: true..." → "command"
 *   "...disable-model-invocation: false..." → "model"
 *   没有 disable-model-invocation 行 → "model"
 *   缺 description 的 SKILL.md → null
 *
 * 提示：先调 skillFromFrontmatter 校验；再用正则找 disable-model-invocation 的值。
 */
export function skillInvocationMode(md: string): SkillInvocation | null {
  throw new Error("TODO");
}

/**
 * 【场景】商品运营的 prompts 目录里躺着一堆文件，UI 要列出能敲哪些斜杠命令。
 *
 * 【转换点】prompt template 规则 🟢：文件名（去 .md）就是命令名——
 * order.md → /order。只收目录顶层 .md（发现是 non-recursive，子目录不扫）；
 * .txt / .MD / .md.bak 都不算。保持输入顺序，不改入参数组。
 *
 * 任务：返回命令名数组（保序）。
 * 示例：
 *   slashNamesFromDir(["order.md", "restock.md"]) → ["order", "restock"]
 *   slashNamesFromDir(["order.md", "notes.txt", "sub/extra.md", "pr.md"]) → ["order", "pr"]
 *   slashNamesFromDir([]) → []
 *
 * 提示：endsWith(".md") 过滤；includes("/") 的是子目录，跳过；再 slice 掉末尾 ".md"。
 */
export function slashNamesFromDir(files: string[]): string[] {
  throw new Error("TODO");
}

/**
 * 【场景】新人整理资源目录：一条条路径摆过来，各归哪类资源的坑位？
 *
 * 【转换点】四类资源按**目录段**定型、按**后缀**验真 🟡：
 *   extensions/ → 只认 .ts / .js（*/index.ts 也算）
 *   skills/     → .md（含 SKILL.md；~/.agents/skills、项目 .agents/skills 都是技能目录）
 *   prompts/    → .md
 *   themes/     → .json
 * 目录命中但后缀不对 → null；目录都不认识 → null。
 *
 * 任务：返回 "extension" | "skill" | "prompt" | "theme"；不认识 → null。
 * 示例：
 *   resourceKindOf("~/.pi/agent/extensions/price-guard.ts") → "extension"
 *   resourceKindOf(".agents/skills/stock-check/SKILL.md") → "skill"
 *   resourceKindOf("~/.pi/agent/prompts/order.md") → "prompt"
 *   resourceKindOf("themes/dark.json") → "theme"
 *   resourceKindOf("extensions/readme.md") → null（目录对但后缀不对）
 *
 * 提示：includes("/extensions/") 或 startsWith("extensions/") 算命中，四类同理，逐类判定。
 */
export function resourceKindOf(path: string): ResourceKind | null {
  throw new Error("TODO");
}

/**
 * 【场景】团队共享包 shop-kit 有三种装法：npm 发版、git 私仓、本地路径。给一条 install spec，拆出来源。
 *
 * 【转换点】install spec 三来源 🔴：
 *   npm:xxx   → npm。坑：scoped 包 npm:@scope/pkg@1.2.3 里第一个 @ 是名字的一部分，
 *               版本在**最后一个** @ 后面；npm:@scope/pkg 无版本时别把 scope 的 @ 当分隔。
 *   git:xxx   → git。坑：git:git@github.com:user/repo 的最后一个 @ 属于用户名（切完剩 "git"，
 *               没斜杠没冒号）→ 不是 ref；github.com/u/r@v1 的 @v1 才是 ref。
 *               https:// ssh:// git:// 协议 URL 也算 git。
 *   /x ./x ../x → local（不拷贝，原地加载）。
 *   裸 shorthand（github.com/u/r 无前缀）、空串 → null。
 *
 * 任务：返回 { source, name, ref }；不认识 → null（ref 无则 null）。
 * 示例：
 *   parseInstallSpec("npm:@foo/bar@1.0.0") → { source: "npm", name: "@foo/bar", ref: "1.0.0" }
 *   parseInstallSpec("npm:@foo/bar") → { source: "npm", name: "@foo/bar", ref: null }
 *   parseInstallSpec("git:github.com/user/repo@v1") → { source: "git", name: "github.com/user/repo", ref: "v1" }
 *   parseInstallSpec("git:git@github.com:user/repo") → { source: "git", name: "git@github.com:user/repo", ref: null }
 *   parseInstallSpec("./packages/shop-kit") → { source: "local", name: "./packages/shop-kit", ref: null }
 *
 * 提示：npm 分 scoped / 非 scoped 两支；git 用「最后一个 @ 前还含 / 或 :」判定它是不是 ref。
 */
export function parseInstallSpec(spec: string): InstallSpec | null {
  throw new Error("TODO");
}

/**
 * 【场景】shop-kit 的 package.json 摆在这，装完之后商店里会多出哪些扩展 / 技能 / 模板 / 主题？
 *
 * 【转换点】Pi package 的资源声明 🟡（综合）：
 *   有 pi manifest（package.json 的 pi 键）→ 只按 manifest 的四个数组，
 *     缺哪个键 = 那类为空（不会退回约定目录）；路径去掉开头的 "./" 归一。
 *   没有 pi manifest → 四个约定目录 extensions/ skills/ prompts/ themes/。
 *   JSON 解析失败 / 不是对象 → null。
 *
 * 任务：返回 { extensions, skills, prompts, themes } 四个数组；坏输入 → null。
 * 示例：
 *   '{"pi":{"skills":["./skills/stock-check"]}}'
 *     → { extensions: [], skills: ["skills/stock-check"], prompts: [], themes: [] }
 *   '{"name":"plain"}'（无 manifest）
 *     → { extensions: ["extensions/"], skills: ["skills/"], prompts: ["prompts/"], themes: ["themes/"] }
 *   "{oops" → null
 *
 * 提示：JSON.parse 要 try/catch；normalize 函数过滤非字符串并 strip 前缀 "./"。
 */
export function bundledResources(pkgJson: string): PiPackageResources | null {
  throw new Error("TODO");
}
