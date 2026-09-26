/**
 * 生成 src/content/chapters/ch29.json 与 local/m6/ch29/
 * 运行：bun scripts/gen-ch29.ts
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const preamble = `/**
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
};`;

const functions = [
  {
    name: "extensionFactoryOk",
    testSuite: "extensionFactoryOk",
    skeleton: `/**
 * 【场景】同事交来一个「价格护栏」扩展文件，先做入口体检：这代码能被当作扩展加载吗？
 *
 * 【转换点】extension 的唯一入口约定 🔴：默认导出一个工厂函数，
 * 形如 export default (async) function (pi) {...} 或 export default (pi) => {...}。
 * 具名导出不算、默认导出对象不算、CJS 的 module.exports 不算。
 *
 * 任务：代码字符串是合法的 extension 入口 → true，否则 false。
 * 示例：
 *   extensionFactoryOk("export default function (pi) { pi.on(\\"tool_call\\", () => {}); }") → true
 *   extensionFactoryOk("export default async function priceGuard(pi) {}") → true（async 工厂合法）
 *   extensionFactoryOk("export default (pi) => { pi.registerCommand(\\"stock\\", {}); }") → true（箭头工厂）
 *   extensionFactoryOk("export function helper(pi) {}") → false（只有具名导出）
 *   extensionFactoryOk("export default { setup(pi) {} }") → false（导出的是对象不是函数）
 *
 * 提示：几条正则就够：export default + (async )?function，或 export default 后跟箭头函数。
 */
export function extensionFactoryOk(code: string): boolean {
  throw new Error("TODO");
}`,
  },
  {
    name: "skillFromFrontmatter",
    testSuite: "skillFromFrontmatter",
    skeleton: `/**
 * 【场景】运营写了个「库存查询」技能 SKILL.md，加载器要判断它合不合法、叫什么。
 *
 * 【转换点】SKILL.md 的 frontmatter 🔴：文件首行必须是 ---，块必须闭合；
 * name 与 description 都必填，缺 description 的技能 warning 后**不加载**。
 * 值里可以带冒号——必须按**第一个**冒号切分（split(":") 会切碎值）。
 *
 * 任务：返回 { name, description }；不合法 / 缺必填 → null。
 * 示例：
 *   "---\\nname: stock-check\\ndescription: 查 KB-001 与 MS-002 库存\\n---\\n# 正文"
 *     → { name: "stock-check", description: "查 KB-001 与 MS-002 库存" }
 *   description 值带冒号 "Use when: 库存问题" → 原样保留
 *   "---\\nname: x\\n---\\n正文" → null（缺 description 不加载）
 *   首行不是 --- / frontmatter 没闭合 → null
 *
 * 提示：split("\\n") 后逐行扫；line.indexOf(":") 拿第一个冒号；两端 trim。
 */
export function skillFromFrontmatter(md: string): SkillInfo | null {
  throw new Error("TODO");
}`,
  },
  {
    name: "skillInvocationMode",
    testSuite: "skillInvocationMode",
    skeleton: `/**
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
}`,
  },
  {
    name: "slashNamesFromDir",
    testSuite: "slashNamesFromDir",
    skeleton: `/**
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
}`,
  },
  {
    name: "resourceKindOf",
    testSuite: "resourceKindOf",
    skeleton: `/**
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
}`,
  },
  {
    name: "parseInstallSpec",
    testSuite: "parseInstallSpec",
    skeleton: `/**
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
}`,
  },
  {
    name: "bundledResources",
    testSuite: "bundledResources",
    skeleton: `/**
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
}`,
  },
];

const assignment = `${preamble}

${functions.map((f) => f.skeleton).join("\n\n")}
`;

const testSource = `describe("extensionFactoryOk", () => {
  it("默认导出工厂：匿名/具名、sync/async", () => {
    expect(extensionFactoryOk("export default function (pi) { pi.on(\\"tool_call\\", () => {}); }")).toBe(true);
    expect(extensionFactoryOk("export default async function (pi) { await setup(pi); }")).toBe(true);
    expect(extensionFactoryOk("export default function priceGuard(pi) { pi.registerCommand(\\"stock\\", {}); }")).toBe(true);
  });
  it("默认导出箭头工厂（含 async 箭头）", () => {
    expect(extensionFactoryOk("export default (pi) => { pi.registerTool({}); }")).toBe(true);
    expect(extensionFactoryOk("export default async (pi) => { await warmUp(); }")).toBe(true);
  });
  it("不是工厂 → false（防只看 export 字样）", () => {
    expect(extensionFactoryOk("export function helper(pi) {}")).toBe(false);
    expect(extensionFactoryOk("export default { setup(pi) {} }")).toBe(false);
    expect(extensionFactoryOk("module.exports = function (pi) {}")).toBe(false);
    expect(extensionFactoryOk("")).toBe(false);
  });
});

describe("skillFromFrontmatter", () => {
  it("合法 SKILL.md → {name, description}", () => {
    const md = "---\\nname: stock-check\\ndescription: 查 KB-001 机械键盘与 MS-002 无线鼠标的库存价格，缺货给替代\\n---\\n# 库存查询";
    expect(skillFromFrontmatter(md)).toEqual({
      name: "stock-check",
      description: "查 KB-001 机械键盘与 MS-002 无线鼠标的库存价格，缺货给替代",
    });
  });
  it("值里带冒号：按第一个冒号切", () => {
    const md = "---\\nname: stock-check\\ndescription: Use when: 库存或价格问题\\n---\\n正文";
    expect(skillFromFrontmatter(md)).toEqual({ name: "stock-check", description: "Use when: 库存或价格问题" });
  });
  it("缺 description / 值为空 → null（不加载）", () => {
    expect(skillFromFrontmatter("---\\nname: stock-check\\n---\\n正文")).toBeNull();
    expect(skillFromFrontmatter("---\\nname: stock-check\\ndescription:\\n---\\n正文")).toBeNull();
  });
  it("没有 frontmatter / 未闭合 → null", () => {
    expect(skillFromFrontmatter("# 库存查询\\n---\\nname: x\\n---")).toBeNull();
    expect(skillFromFrontmatter("---\\nname: stock-check\\ndescription: 查库存\\n")).toBeNull();
  });
});

describe("skillInvocationMode", () => {
  it("默认 model：模型可见，也可 /skill:name", () => {
    expect(skillInvocationMode("---\\nname: stock-check\\ndescription: 查库存\\n---\\n")).toBe("model");
    expect(skillInvocationMode("---\\nname: vip\\ndescription: VIP 价格\\ndisable-model-invocation: false\\n---\\n")).toBe("model");
  });
  it("disable-model-invocation: true → 仅命令", () => {
    expect(skillInvocationMode("---\\nname: vip-price\\ndescription: 内部 VIP 价格规则\\ndisable-model-invocation: true\\n---\\n")).toBe("command");
  });
  it("技能本身不合法 → null", () => {
    expect(skillInvocationMode("---\\nname: vip-price\\n---\\n")).toBeNull();
    expect(skillInvocationMode("没有 frontmatter 的技能")).toBeNull();
  });
});

describe("slashNamesFromDir", () => {
  it("prompts 目录 → 命令名（去 .md 保序）", () => {
    expect(slashNamesFromDir(["order.md", "restock.md"])).toEqual(["order", "restock"]);
  });
  it("非 .md 与子目录都不收（non-recursive）；不改入参", () => {
    const files = ["order.md", "notes.txt", "sub/extra.md", "README.MD", "draft.md.bak", "pr.md"];
    Object.freeze(files);
    expect(slashNamesFromDir(files)).toEqual(["order", "pr"]);
    expect(files).toEqual(["order.md", "notes.txt", "sub/extra.md", "README.MD", "draft.md.bak", "pr.md"]);
  });
  it("空目录与光杆 .md", () => {
    expect(slashNamesFromDir([])).toEqual([]);
    expect(slashNamesFromDir([".md"])).toEqual([]);
  });
});

describe("resourceKindOf", () => {
  it("extension：*.ts / */index.ts（含 .js）", () => {
    expect(resourceKindOf("~/.pi/agent/extensions/price-guard.ts")).toBe("extension");
    expect(resourceKindOf(".pi/extensions/audit/index.ts")).toBe("extension");
    expect(resourceKindOf("shop-kit/extensions/helper.js")).toBe("extension");
  });
  it("skill / prompt / theme 各归其位", () => {
    expect(resourceKindOf("~/.pi/agent/skills/pdf/SKILL.md")).toBe("skill");
    expect(resourceKindOf(".agents/skills/stock-check/SKILL.md")).toBe("skill");
    expect(resourceKindOf("~/.pi/agent/prompts/order.md")).toBe("prompt");
    expect(resourceKindOf(".pi/prompts/restock.md")).toBe("prompt");
    expect(resourceKindOf("~/.pi/agent/themes/dracula.json")).toBe("theme");
    expect(resourceKindOf("themes/dark.json")).toBe("theme");
  });
  it("目录对但后缀不对 / 路径不认识 → null", () => {
    expect(resourceKindOf("extensions/readme.md")).toBeNull();
    expect(resourceKindOf("~/.pi/agent/settings.json")).toBeNull();
    expect(resourceKindOf("src/components/OrderButton.tsx")).toBeNull();
  });
});

describe("parseInstallSpec", () => {
  it("npm：scoped 的 @ 是名字的一部分", () => {
    expect(parseInstallSpec("npm:@foo/bar@1.0.0")).toEqual({ source: "npm", name: "@foo/bar", ref: "1.0.0" });
    expect(parseInstallSpec("npm:@foo/bar")).toEqual({ source: "npm", name: "@foo/bar", ref: null });
  });
  it("npm：非 scoped 有版本 / 无版本", () => {
    expect(parseInstallSpec("npm:pi-skills")).toEqual({ source: "npm", name: "pi-skills", ref: null });
    expect(parseInstallSpec("npm:pkg@2.1.7")).toEqual({ source: "npm", name: "pkg", ref: "2.1.7" });
  });
  it("git：@v1 是 ref；git@ 用户名不是", () => {
    expect(parseInstallSpec("git:github.com/user/repo@v1")).toEqual({ source: "git", name: "github.com/user/repo", ref: "v1" });
    expect(parseInstallSpec("git:github.com/user/repo")).toEqual({ source: "git", name: "github.com/user/repo", ref: null });
    expect(parseInstallSpec("git:git@github.com:user/repo")).toEqual({ source: "git", name: "git@github.com:user/repo", ref: null });
  });
  it("local 路径与非法输入", () => {
    expect(parseInstallSpec("/opt/packages/shop-kit")).toEqual({ source: "local", name: "/opt/packages/shop-kit", ref: null });
    expect(parseInstallSpec("./packages/shop-kit")).toEqual({ source: "local", name: "./packages/shop-kit", ref: null });
    expect(parseInstallSpec("github.com/user/repo")).toBeNull();
    expect(parseInstallSpec("")).toBeNull();
  });
});

describe("bundledResources", () => {
  it("pi manifest 四键全给（./ 前缀归一）", () => {
    const pkg = "{\\"name\\":\\"shop-kit\\",\\"keywords\\":[\\"pi-package\\"],\\"pi\\":{\\"extensions\\":[\\"./extensions/price-guard.ts\\"],\\"skills\\":[\\"./skills/stock-check\\"],\\"prompts\\":[\\"./prompts/order.md\\"],\\"themes\\":[\\"./themes/shop-dark.json\\"]}}";
    expect(bundledResources(pkg)).toEqual({
      extensions: ["extensions/price-guard.ts"],
      skills: ["skills/stock-check"],
      prompts: ["prompts/order.md"],
      themes: ["themes/shop-dark.json"],
    });
  });
  it("没有 manifest → 四个约定目录", () => {
    expect(bundledResources("{\\"name\\":\\"plain\\"}")).toEqual({
      extensions: ["extensions/"],
      skills: ["skills/"],
      prompts: ["prompts/"],
      themes: ["themes/"],
    });
  });
  it("manifest 缺键 = 该类为空；坏 JSON → null", () => {
    expect(bundledResources("{\\"pi\\":{\\"skills\\":[\\"skills\\"]}}")).toEqual({
      extensions: [],
      skills: ["skills"],
      prompts: [],
      themes: [],
    });
    expect(bundledResources("{oops")).toBeNull();
    expect(bundledResources("")).toBeNull();
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
    `> **预计**：1 天 ｜ **前置**：Ch28（Agent 循环、事件嵌套已在手上）
> **目标**：① 分清 **Extension / Skill / Template / Package** 四种扩展资源各自解决什么、放哪、怎么被加载；② 会读 SKILL.md frontmatter 与 Pi 包的 \`pi\` manifest；③ 认得出一个最小 extension 工厂——读懂即可，作业考的是**解析与判断**。
> 你 15 年 Java：Spring 给你 ApplicationContext，你挂 BeanPostProcessor / Filter；IDE 给你插件口。Pi 给开发者的是同一层——只是宿主换成了 Agent。
> 事实源不变：本机安装包（\`@earendil-works/pi-coding-agent\` v0.85.x）的 \`docs/extensions.md\`、\`skills.md\`、\`prompt-templates.md\`、\`packages.md\` + https://pi.dev/docs/latest 交叉核对。

> 📐 **本教程的契约**：下面每一节（§29.1–§29.7）都**精确对应**作业里的题。讲过的才考，考的必讲过。卡住时按作业函数名回查对应小节。
> **不讲**：Session 文件格式与 compaction 切点（Ch30）、RPC 协议（Ch31）、扩展的全部事件表（用到时查 docs/extensions.md）。

---`,
    [],
  ),
  sec(
    "sec-map",
    "🗺️ 本章地图",
    null,
    `本章主线：**把商品助手的能力沉淀成可复用资产**。Ch28 你看懂了 Agent 循环怎么转；这一章看「往循环上挂东西」的四种官方姿势——行为（extension 代码）、知识（skill 文档）、输入快捷方式（prompt 模板）、分发（package 把前三者打包进 settings）。

读完这章 + 完成作业，你将能够：

- 认出 extension 的唯一入口约定：默认导出工厂 \`(pi: ExtensionAPI) => {}\`，jiti 免编译加载 TS
- 解析 SKILL.md frontmatter，说清「缺 description 不加载」与渐进披露
- 用 \`disable-model-invocation: true\` 把敏感技能改成仅 \`/skill:name\` 可用
- 把 \`prompts/*.md\` 换算成斜杠命令名（发现是 non-recursive）
- 按目录段 + 后缀把任意路径归进四类资源
- 拆解 \`npm:@scope/pkg@1.2.3\`、\`git:github.com/u/r@v1\` 这类 install spec 的两个 \`@\` 坑
- 读 \`pi\` manifest，说出装完一个包会多出哪些资源（约定目录兜底规则）

**作业 ↔ 教程对应表**（学哪节，就去做哪题）：

| 作业题 | 对应小节 | 核心知识点 |
|--------|----------|-----------|
| \`extensionFactoryOk\` | §29.1 | 默认导出工厂 + jiti 加载 |
| \`skillFromFrontmatter\` | §29.2 | SKILL.md frontmatter 解析（缺 description 不加载） |
| \`skillInvocationMode\` | §29.3 | disable-model-invocation → 仅 /skill:name |
| \`slashNamesFromDir\` | §29.4 | prompts/*.md → 斜杠命令名 |
| \`resourceKindOf\` | §29.5 | 路径 → extension/skill/prompt/theme |
| \`parseInstallSpec\` | §29.6 | npm/git/local install spec 拆解 |
| \`bundledResources\` | §29.7 | pi manifest / 约定目录（综合） |

本地文件：\`local/m6/ch29/assignment.ts\`（改 TODO）、\`assignment.test.ts\`、\`demo.ts\`（真 Pi 片段复制区，测试不要 import）。M6 章**没有** \`app.ts\`——研究章不建 HTTP 服务。

跑测试：\`bun test local/m6/ch29\`。

---`,
    [],
  ),
  sec(
    "sec-path",
    "⏱️ 学习路径：费曼五步（约 60–90 分钟）",
    null,
    `| 步 | 你要做 | 在哪做 |
|----|--------|--------|
| ① 预览猜（2 分钟） | 猜入口约定、渐进披露、两个 \`@\` 的含义 | 本页 ① |
| ② 先动手 | 打开 \`local/m6/ch29/assignment.ts\` 改 TODO | 仓库 local/ |
| ③ 提取+反馈 | \`bun test local/m6/ch29\` 看红绿 | 终端 |
| ④ 费曼（2 分钟） | 大白话讲清「为什么要四种资源而不是一种」 | 本页 ④ |
| ⑤ 存闪卡 | 章末闪卡标复习日期 | 闪卡 |

> 💡 网页这一章是只读的。作业全是字符串解析与路径判定的纯函数，无 Key 也全绿。
> 边做边可以翻本机 \`docs/extensions.md\` 等四篇，对照官方原文。

---`,
    [],
  ),
  sec(
    "sec-guess",
    "① 预览猜（2 分钟 · 激活你的 Java / Python 直觉）",
    null,
    `先别看答案，凭经验猜一猜（猜错没关系）：

1. 扩展文件必须是编译后的 .js，还是直接放 .ts 就能跑？
2. 一个技能（SKILL.md）的**全文**是什么时候进模型上下文的：启动时，还是任务命中时？
3. SKILL.md 少写了 \`description\`，Pi 会怎么办——用空字符串兜底，还是不加载？
4. 用户敲 \`/order 机械键盘\`。扩展注册的命令、input 事件、\`/skill:\` 命令、prompt 模板，谁先被检查？
5. \`npm:@foo/bar@1.2.3\` 里两个 \`@\` 分别是什么？\`git:git@github.com:user/repo\` 最后一个 \`@\` 呢？
6. 想试用一个包但**不写进** settings.json，用什么命令行参数？

> 猜完，带着验证心态进入正文。第 2、4、5 题是本章的 🔴。

---`,
    [],
  ),
  sec(
    "sec-world",
    "扩展体系：同一张嘴，四种喂法 🔴",
    null,
    `**为什么是四种而不是一种**：给 Agent「加东西」的需求其实分四个正交维度——**改行为**（代码钩子）、**给知识**（按需加载的说明书）、**省输入**（一敲就展开的长 prompt）、**做分发**（把前三者打包给全组用）。Pi 没有把它们捏成一个「插件系统大接口」，而是各给一个最轻的机制：extension 是**被执行的代码**，skill / template 是**被扫描的数据**，package 是**安装器**。对照 Java：Spring 的 BeanPostProcessor（行为）、classpath 上的 SOP 文档（知识）、IDE Live Template（输入）、Maven starter（分发）——你早就见过这四个维度，只是没在一个产品里并排见过。

| 需求 | Java 世界 | Python 世界 | Pi 的答案 |
|---|---|---|---|
| 改行为 | BeanPostProcessor / Filter | setuptools entry_points 插件 | **extension**：\`*.ts\` 默认导出工厂 |
| 给知识 | wiki / SOP（人读） | docs/ + docstring | **skill**：SKILL.md，模型按需读 |
| 省输入 | IDE Live Template | cookiecutter | **template**：\`prompts/*.md\` → \`/name\` |
| 分发 | Maven starter（一个坐标一整套） | PyPI 包 | **package**：\`pi\` manifest + npm/git |

加载全景（谁喂给谁）：

\`\`\`mermaid
flowchart TB
    agent["商品助手 Agent<br/>（KB-001 / MS-002）"] --> loader["Pi 启动加载器<br/>trust 检查 → 扫描 → 注册"]
    subgraph res["四种扩展资源"]
        direction LR
        ext["Extension（代码）<br/>默认导出工厂<br/>拦事件 · 注册工具/命令"]
        skill["Skill（知识）<br/>SKILL.md<br/>name+description 进系统提示"]
        tpl["Template（输入）<br/>prompts/*.md<br/>斜杠命令展开"]
    end
    loader --> ext
    loader --> skill
    loader --> tpl
    pkg["Pi Package（分发）<br/>pi manifest · npm / git"] -.->|"pi install 装出<br/>前三者的组合"| loader

    style agent fill:#80DEEA,stroke:#0097A7,color:#1f1f1f
    style loader fill:#FFE082,stroke:#F9A825,color:#1f1f1f
    style res fill:#E3F2FD,stroke:#1976D2,color:#1f1f1f
    style ext fill:#90CAF9,stroke:#1976D2,color:#1f1f1f
    style skill fill:#A5D6A7,stroke:#388E3C,color:#1f1f1f
    style tpl fill:#CE93D8,stroke:#7B1FA2,color:#1f1f1f
    style pkg fill:#FFCC80,stroke:#F57C00,color:#1f1f1f
\`\`\`

**机制（一条输入的五道门）**：四种资源里有两种会「抢」用户输入——扩展命令和模板命令。官方文档给的处理顺序是铁律：**① 扩展命令**（\`registerCommand\` 注册的 \`/cmd\`）最先查，命中就直接执行不再往下；**② \`input\` 事件**（可改写 / 拦截，此刻 \`/skill:\` 和模板都还没展开）；**③ skill 命令**（\`/skill:name\` 展开成 SKILL.md 全文）；**④ prompt 模板**（\`/name\` 展开成模板内容）；**⑤ 才进 Agent 循环**（\`before_agent_start\` → …）。所以同一个名字，扩展命令会**压过**同名技能与模板。

\`\`\`mermaid
flowchart LR
    inp["用户输入<br/>/order 机械键盘"] --> q1{"① 扩展命令?<br/>registerCommand"}
    q1 -->|"命中"| extRun["扩展 handler 执行<br/>到此为止"]
    q1 -->|"否"| q2{"② input 事件<br/>可改写 / 拦截"}
    q2 --> q3{"③ skill 命令?<br/>/skill:stock-check"}
    q3 -->|"命中"| skillExp["展开 SKILL.md 全文<br/>参数拼成 User: args"]
    q3 -->|"否"| q4{"④ 模板命令?<br/>/order"}
    q4 -->|"命中"| tplExp["展开 prompts/order.md"]
    q4 -->|"否"| agentRun["⑤ 进入 Agent 循环<br/>before_agent_start ..."]

    style inp fill:#FFE082,stroke:#F9A825,color:#1f1f1f
    style q1 fill:#80DEEA,stroke:#0097A7,color:#1f1f1f
    style q2 fill:#80DEEA,stroke:#0097A7,color:#1f1f1f
    style q3 fill:#80DEEA,stroke:#0097A7,color:#1f1f1f
    style q4 fill:#80DEEA,stroke:#0097A7,color:#1f1f1f
    style extRun fill:#90CAF9,stroke:#1976D2,color:#1f1f1f
    style skillExp fill:#A5D6A7,stroke:#388E3C,color:#1f1f1f
    style tplExp fill:#CE93D8,stroke:#7B1FA2,color:#1f1f1f
    style agentRun fill:#FFCC80,stroke:#F57C00,color:#1f1f1f
\`\`\`

### ❌ / ✅

\`\`\`ts
// ❌ 以为扩展要编译成 .js 再放（jiti 直接加载 TS，免编译）
// ❌ 以为 skill 全文常驻系统提示（只有 name+description 常驻）
// ❌ 给「加能力」写一个巨大的配置文件（四种需求各走各的机制）
// ✅ 行为 → extension；知识 → skill；长 prompt → template；分发 → package
\`\`\`

---`,
    [],
  ),
  sec(
    "sec-29.1",
    "§29.1 extension 入口：默认导出工厂（对应：`extensionFactoryOk`）🟡",
    "29.1",
    `**机制**：为什么入口是「默认导出工厂」而不是配置文件？因为 Pi 对扩展不做**声明式解析**，而是**执行你的代码**——加载器（jiti）直接 import 这个 TS 模块（TypeScript 免编译），拿 \`default\` 导出当工厂函数调用，把 \`pi: ExtensionAPI\` 塞给你；你在函数体里 \`pi.on(...)\` 订阅事件、\`pi.registerTool(...)\` 注册工具、\`pi.registerCommand(...)\` 注册命令。工厂可以 sync 也可以 async（async 时 Pi 会 await 完才继续启动）。对照 Spring：工厂函数 ≈ \`@Bean\` 方法，\`pi\` ≈ ApplicationContext。

教程里的真扩展长这样（作业不写它，只要认得出）：

\`\`\`ts
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";

export default function (pi: ExtensionAPI) {
  // 拦危险命令：tool_call 事件返回 { block: true }
  pi.on("tool_call", async (event) => {
    if (event.toolName === "bash" && String(event.input.command).includes("rm -rf")) {
      return { block: true, reason: "价格护栏：危险命令需人工确认" };
    }
  });
  // 注册命令：/stock
  pi.registerCommand("stock", {
    description: "查 KB-001 机械键盘 / MS-002 无线鼠标现货",
    handler: async (_args, ctx) => ctx.ui.notify("KB-001 现货 12 件，MS-002 无线鼠标缺货", "info"),
  });
}
\`\`\`

放哪（§27.5 的地图）：\`~/.pi/agent/extensions/*.ts\` 或 \`*/index.ts\` 全局；\`.pi/extensions/\` 项目层（**先 trust 才加载**）。自动发现位置的扩展可以用 \`/reload\` 热重载；\`pi -e ./path.ts\` 只作快速试用。

加载链：

\`\`\`mermaid
flowchart LR
    f["extensions/price-guard.ts"] --> j["jiti 加载<br/>TS 免编译 · 也认 */index.ts"]
    j --> d{"default 导出<br/>是函数?"}
    d -->|"是"| invoke["调用工厂 pi: ExtensionAPI<br/>on · registerTool · registerCommand"]
    d -->|"否"| bad["不是扩展入口<br/>（对象 / 只有具名导出 / CJS）"]
    invoke --> ok["资源注册完成<br/>/reload 可热重载"]

    style f fill:#FFE082,stroke:#F9A825,color:#1f1f1f
    style j fill:#80DEEA,stroke:#0097A7,color:#1f1f1f
    style d fill:#80DEEA,stroke:#0097A7,color:#1f1f1f
    style invoke fill:#90CAF9,stroke:#1976D2,color:#1f1f1f
    style bad fill:#EF9A9A,stroke:#C62828,color:#1f1f1f
    style ok fill:#A5D6A7,stroke:#388E3C,color:#1f1f1f
\`\`\`

作业 \`extensionFactoryOk\` 的判定合同：\`export default function\` / \`export default async function\`（匿名具名都行）、\`export default\` 后跟箭头函数（含 async 箭头）→ true；只有具名 \`export function\`、默认导出对象、\`module.exports\`、空串 → false。

### ❌ / ✅

\`\`\`ts
// ❌ export function setup(pi) {} —— 没有默认导出，加载器拿不到工厂
// ❌ export default { on() {...} } —— 导出的是对象，Pi 要的是函数
// ❌ module.exports = fn —— CJS 写法，走 jiti 的 ESM 入口不认
// ✅ export default (pi) => {...} / export default async function (pi) {...}
\`\`\`

> ✅ **做 \`extensionFactoryOk\`**：几条正则给扩展入口做体检。

---`,
    ["extensionFactoryOk"],
  ),
  sec(
    "sec-29.2",
    "§29.2 skill：SKILL.md 与 frontmatter（对应：`skillFromFrontmatter`）🔴",
    "29.2",
    `**机制（渐进披露）**：技能的本质不是代码，是「**按需加载的说明书**」。启动时 Pi 只扫描出每个技能的 \`name + description\`，以极小的篇幅放进系统提示；全文（含 \`scripts/\`、\`references/\`）等模型判断任务匹配后，自己用 \`read\` 工具拉进来。为什么？**上下文是预算**——你不会把整本员工手册塞进每一条 SQL 的 WHERE 里。缺 \`description\` 为什么就不加载？因为披露完全靠 description——模型看不见它就永远不会拉它，加载等于白占一次扫描，所以官方规则是 warning 后**不加载**。

\`\`\`mermaid
flowchart LR
    scan["启动扫描 skills 目录<br/>~/.pi/agent/skills · ~/.agents/skills<br/>.pi/skills · .agents/skills（trust 后）"] --> fm["读 SKILL.md frontmatter<br/>name + description"]
    fm --> ok{"description 非空?"}
    ok -->|"否"| skip["warning · 不加载<br/>（披露无从谈起）"]
    ok -->|"是"| sp["name + description 进系统提示<br/>全文不进"]
    sp --> match["任务命中：查 KB-001 机械键盘<br/>与 MS-002 无线鼠标库存"]
    match --> read["模型用 read 拉全文<br/>按相对路径用 scripts / references"]

    style scan fill:#FFE082,stroke:#F9A825,color:#1f1f1f
    style fm fill:#80DEEA,stroke:#0097A7,color:#1f1f1f
    style ok fill:#80DEEA,stroke:#0097A7,color:#1f1f1f
    style skip fill:#EF9A9A,stroke:#C62828,color:#1f1f1f
    style sp fill:#A5D6A7,stroke:#388E3C,color:#1f1f1f
    style match fill:#FFCC80,stroke:#F57C00,color:#1f1f1f
    style read fill:#90CAF9,stroke:#1976D2,color:#1f1f1f
\`\`\`

frontmatter 字段表（官方）：

| 字段 | 必填 | 说明 |
|---|---|---|
| \`name\` | ✅ | ≤64 字符，小写字母/数字/连字符，无首尾/连续连字符；Pi **不要求**与目录同名（比 Agent Skills 标准宽松，方便共享目录） |
| \`description\` | ✅ | ≤1024 字符；写清「做什么 + 何时用」，模型靠它决定拉不拉全文 |
| \`allowed-tools\` | 可选 | 预授权工具列表（空格分隔，实验性） |
| \`disable-model-invocation\` | 可选 | \`true\` → 从系统提示隐藏（§29.3 专讲） |
| \`license\` / \`compatibility\` / \`metadata\` | 可选 | 元信息 |

解析要点（作业合同）：首行必须是 \`---\`，块必须闭合；\`key: value\` 按**第一个**冒号切（值里可以带冒号，\`split(":")\` 会切碎）；\`name\`、\`description\` 任何一个缺失或为空 → \`null\`。

\`\`\`ts
function skillFromFrontmatter(md: string): SkillInfo | null {
  const lines = md.split("\\n");
  if (lines[0]?.trim() !== "---") return null;
  const fields: Record<string, string> = {};
  let closed = false;
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i]!;
    if (line.trim() === "---") { closed = true; break; }
    const idx = line.indexOf(":");
    if (idx === -1) continue;
    fields[line.slice(0, idx).trim()] = line.slice(idx + 1).trim();
  }
  if (!closed) return null;
  const name = fields["name"] ?? "";
  const description = fields["description"] ?? "";
  return name === "" || description === "" ? null : { name, description };
}
\`\`\`

技能还能注册成 \`/skill:name\` 命令（§29.3 展开），参数直接拼在后面：\`/skill:stock-check KB-001\`。

### ❌ / ✅

\`\`\`ts
// ❌ split(":")[1] 取值（description 里带冒号就断在半截）
// ❌ frontmatter 块没闭合也返回解析结果
// ❌ description 缺失时用 name 兜底（官方：不加载 → null）
// ✅ indexOf(":") 第一个冒号切分；两必填齐了才返回
\`\`\`

> ✅ **做 \`skillFromFrontmatter\`**：把「缺 description 不加载」写进代码。

---`,
    ["skillFromFrontmatter"],
  ),
  sec(
    "sec-29.3",
    "§29.3 技能的两种触发（对应：`skillInvocationMode`）🟡",
    "29.3",
    `技能默认有**两条触发路径**：模型自发（\`name + description\` 在系统提示里，任务匹配就拉全文）和用户命令（\`/skill:name\`，永远可用）。frontmatter 写 \`disable-model-invocation: true\` → 技能从系统提示**隐藏**，模型无法自发使用，只剩 \`/skill:name\` 一条路。

什么时候需要这个开关？**敏感或昂贵的能力**。例：内部 VIP 价格规则技能——不该让模型看到「客户问价格」就自作主张套 VIP 折扣；运营明确敲 \`/skill:vip-price\` 才展开。对照 Java：相当于把一个 Bean 从自动装配里摘出来，只留显式 \`@Qualifier\` 引用。

| frontmatter | 系统提示 | 模型自发 | /skill:name |
|---|---|---|---|
| 缺省 / \`false\` | 有 name+description | ✅ | ✅ |
| \`true\` | 隐藏 | ❌ | ✅ |

\`\`\`ts
function skillInvocationMode(md: string): SkillInvocation | null {
  if (skillFromFrontmatter(md) === null) return null; // 非法技能先出局
  const m = md.match(/^disable-model-invocation:\\s*(\\S+)\\s*$/m);
  return m && m[1] === "true" ? "command" : "model";
}
\`\`\`

注意实现顺序：**先校验技能合法**（复用 §29.2），不合法直接 \`null\`——一个不会被加载的技能谈不上触发方式。只认字面 \`true\`（\`false\` / 缺省 / 其他值都算 \"model\"；YAML 的 yes/no 变体不在教学合同里）。

### ❌ / ✅

\`\`\`ts
// ❌ 只看 flag 不校验技能（缺 description 的也该 null）
// ❌ 把 "command" 理解成「技能被禁用」（/skill:name 仍可用！）
// ❌ flag 是 "TRUE" / "yes" 也当 true（只认字面 "true"）
// ✅ skillFromFrontmatter 先把非法技能挡在门外
\`\`\`

> ✅ **做 \`skillInvocationMode\`**：一个开关，两条触发路。

---`,
    ["skillInvocationMode"],
  ),
  sec(
    "sec-29.4",
    "§29.4 prompts/*.md → 斜杠命令（对应：`slashNamesFromDir`）🟢",
    "29.4",
    `prompt template 是最轻的资源：一个 \`*.md\` 文件，**文件名（去 \`.md\`）就是命令名**——\`order.md\` → \`/order\`。敲 \`/order 机械键盘 2\` 时模板内容展开成完整 prompt，参数用 \`$1\` \`$@\` 引用，还支持默认值 \`\${1:-7}\`。

\`prompts/order.md\` 示例（教程示意）：

\`\`\`markdown
---
description: 按商品与数量生成下单请求草稿
argument-hint: "<SKU> [qty]"
---
为 $1 生成下单请求草稿，数量 \${2:-1}。核对 KB-001 / MS-002 的当前库存再输出。
\`\`\`

加载规则（作业合同）：全局 \`~/.pi/agent/prompts/*.md\`、项目 \`.pi/prompts/*.md\`（trust 后）、包里的 \`prompts/\`；**发现是 non-recursive**——只扫目录顶层，子目录里的模板要显式加 settings 或走 manifest；非 \`.md\`（含 \`.MD\`、\`.md.bak\`、\`.txt\`）不收。\`description\` 可选（缺省用正文第一行），\`argument-hint\` 只影响补全菜单显示。

\`\`\`ts
function slashNamesFromDir(files: string[]): string[] {
  const names: string[] = [];
  for (const f of files) {
    if (!f.endsWith(".md") || f.includes("/")) continue;
    const base = f.slice(0, -3);
    if (base !== "") names.push(base);
  }
  return names;
}
\`\`\`

对照 §sec-world 的五道门：模板命令排在扩展命令、input 事件、skill 命令**之后**——所以如果扩展注册了同名 \`/order\`，模板永远轮不到。这也解释了为什么命名要带前缀（\`/shop-order\`）防撞车。

### ❌ / ✅

\`\`\`ts
// ❌ 大小写不敏感地收 .MD（endsWith(".md") 严格小写）
// ❌ 收子目录 sub/extra.md（non-recursive）
// ❌ 顺手把数组 sort 了（合同是保序）
// ✅ filter + slice(0, -3)；输入数组一个都不许动（测试会 Object.freeze）
\`\`\`

> ✅ **做 \`slashNamesFromDir\`**：目录清单 → 命令清单。

---`,
    ["slashNamesFromDir"],
  ),
  sec(
    "sec-29.5",
    "§29.5 路径 → 四类资源（对应：`resourceKindOf`）🟡",
    "29.5",
    `把 §29.1–§29.4 的「放哪」收拢成一张判定表：**目录段定类型，后缀验真身**。

| 目录段 | 认的后缀 | 类型 |
|---|---|---|
| \`extensions/\` | \`.ts\` / \`.js\`（含 \`*/index.ts\`） | extension |
| \`skills/\`（含 \`~/.agents/skills\`、项目 \`.agents/skills\`） | \`.md\`（含 \`SKILL.md\`） | skill |
| \`prompts/\` | \`.md\` | prompt |
| \`themes/\` | \`.json\` | theme |

\`\`\`mermaid
flowchart TD
    p["一条资源路径"] --> e{"extensions/ 段?"}
    e -->|"是"| eS{".ts / .js?"}
    eS -->|"是"| ext["extension"]
    eS -->|"否"| n1["null"]
    e -->|"否"| s{"skills/ 段?"}
    s -->|"是"| sS{".md?"}
    sS -->|"是"| sk["skill"]
    sS -->|"否"| n2["null"]
    s -->|"否"| pr{"prompts/ 段?"}
    pr -->|"是 .md"| pmt["prompt"]
    pr -->|"否"| th{"themes/ 段?"}
    th -->|"是 .json"| thm["theme"]
    th -->|"否"| n3["null"]

    style p fill:#FFE082,stroke:#F9A825,color:#1f1f1f
    style e fill:#80DEEA,stroke:#0097A7,color:#1f1f1f
    style eS fill:#80DEEA,stroke:#0097A7,color:#1f1f1f
    style s fill:#80DEEA,stroke:#0097A7,color:#1f1f1f
    style sS fill:#80DEEA,stroke:#0097A7,color:#1f1f1f
    style pr fill:#80DEEA,stroke:#0097A7,color:#1f1f1f
    style th fill:#80DEEA,stroke:#0097A7,color:#1f1f1f
    style ext fill:#90CAF9,stroke:#1976D2,color:#1f1f1f
    style sk fill:#A5D6A7,stroke:#388E3C,color:#1f1f1f
    style pmt fill:#CE93D8,stroke:#7B1FA2,color:#1f1f1f
    style thm fill:#FFCC80,stroke:#F57C00,color:#1f1f1f
    style n1 fill:#EF9A9A,stroke:#C62828,color:#1f1f1f
    style n2 fill:#EF9A9A,stroke:#C62828,color:#1f1f1f
    style n3 fill:#EF9A9A,stroke:#C62828,color:#1f1f1f
\`\`\`

两个容易漏的点：① \`extensions/readme.md\` 是 **null** 而不是 extension——目录对了但后缀不验真；② \`.agents/skills/…\` 也是技能目录（§27.6 讲过它的作用域坑），\`skills\` 段判定用 \`includes("/skills/")\` 天然覆盖它。

\`\`\`ts
function resourceKindOf(path: string): ResourceKind | null {
  const inDir = (dir: string) =>
    path.includes("/" + dir + "/") || path.startsWith(dir + "/");
  if (inDir("extensions")) return path.endsWith(".ts") || path.endsWith(".js") ? "extension" : null;
  if (inDir("skills")) return path.endsWith(".md") ? "skill" : null;
  if (inDir("prompts")) return path.endsWith(".md") ? "prompt" : null;
  if (inDir("themes")) return path.endsWith(".json") ? "theme" : null;
  return null;
}
\`\`\`

### ❌ / ✅

\`\`\`ts
// ❌ 只看后缀不看目录（把任意 .md 都判成 skill/prompt）
// ❌ extensions/ 下的 .md 也当扩展（后缀验真，null）
// ❌ 忘了包内路径 shop-kit/extensions/helper.js（includes 覆盖任意前缀）
// ✅ 四类顺序判定，目录段 + 后缀双条件
\`\`\`

> ✅ **做 \`resourceKindOf\`**：新人整理目录，一条路径一个坑位。

---`,
    ["resourceKindOf"],
  ),
  sec(
    "sec-29.6",
    "§29.6 安装来源：npm / git / local（对应：`parseInstallSpec`）🔴",
    "29.6",
    `**机制（为什么三种来源）**：包的分发场景不同——**团队公共能力**发 npm（版本语义、\`pi update\` 可管理）；**私有或个人**走 git（SSH key 认证、钉 tag/commit）；**本地开发**直接路径（不拷贝，改了就生效，适合写包时联调）。它们最终都写进 settings.json 的 \`packages\` 数组（默认用户层 \`~/.pi/agent/settings.json\`，\`-l\` 写项目层 \`.pi/settings.json\` 给全组共享）；npm 包装进 \`~/.pi/agent/npm/\`，git 克隆进 \`~/.pi/agent/git/<host>/<path>\`。**带版本的 spec 是钉死的**：\`pi update\` 不会移动它。

**两个 \`@\` 的歧义**是本题的 🔴：

1. npm scoped 包 \`npm:@scope/pkg@1.2.3\`——第一个 \`@\` 是 **scope 名字的一部分**，最后一个 \`@\` 后面才是版本。没版本的 \`npm:@scope/pkg\` 只有一个 \`@\`，不能把它当分隔符切开。
2. git 的 SSH shorthand \`git:git@github.com:user/repo@v1.0.0\`——中间的 \`@\` 属于 \`git@\` 用户名。判定法：取最后一个 \`@\`，若它**前面还含 \`/\` 或 \`:\`**（说明 host/path 都写完了），它才是 ref 分隔；若切完只剩 \`git\` 这种光杆，那是用户名的 \`@\`，整条是名字、无 ref。

\`\`\`mermaid
flowchart TB
    spec["install spec"] --> npmQ{"npm: 前缀?"}
    npmQ -->|"npm:@foo/bar@1.0.0"| npmDir["npm 包<br/>装进 ~/.pi/agent/npm/<br/>（项目层 .pi/npm/）"]
    npmQ -->|"否"| gitQ{"git: 或 https:// ssh:// git:// ?"}
    gitQ -->|"git:github.com/u/r@v1"| gitDir["git 克隆<br/>~/.pi/agent/git/host/path<br/>SSH key 认证"]
    gitQ -->|"否"| locQ{"/ 或 ./ 或 ../ 开头?"}
    locQ -->|"./packages/shop-kit"| local["本地路径<br/>不拷贝 · 原地加载"]
    locQ -->|"否"| bad["null<br/>（裸 shorthand 不收）"]
    npmDir --> set["settings.json packages 数组<br/>（-l 写项目层）"]
    gitDir --> set
    local --> set

    style spec fill:#FFE082,stroke:#F9A825,color:#1f1f1f
    style npmQ fill:#80DEEA,stroke:#0097A7,color:#1f1f1f
    style gitQ fill:#80DEEA,stroke:#0097A7,color:#1f1f1f
    style locQ fill:#80DEEA,stroke:#0097A7,color:#1f1f1f
    style npmDir fill:#90CAF9,stroke:#1976D2,color:#1f1f1f
    style gitDir fill:#A5D6A7,stroke:#388E3C,color:#1f1f1f
    style local fill:#CE93D8,stroke:#7B1FA2,color:#1f1f1f
    style bad fill:#EF9A9A,stroke:#C62828,color:#1f1f1f
    style set fill:#FFCC80,stroke:#F57C00,color:#1f1f1f
\`\`\`

试用不落盘：\`pi -e npm:@foo/bar\` 装进临时目录只活本次进程，不写 settings。

参考实现（分支逐条对上表）：

\`\`\`ts
function parseInstallSpec(spec: string): InstallSpec | null {
  const s = spec.trim();
  if (s === "") return null;
  if (s.startsWith("npm:")) {
    const rest = s.slice(4);
    if (rest === "") return null;
    if (rest.startsWith("@")) {                      // scoped：跳过开头的 @ 再找
      const at = rest.indexOf("@", 1);
      if (at === -1) return { source: "npm", name: rest, ref: null };
      return { source: "npm", name: rest.slice(0, at), ref: rest.slice(at + 1) };
    }
    const at = rest.lastIndexOf("@");                // 非 scoped：最后一个 @
    if (at > 0) return { source: "npm", name: rest.slice(0, at), ref: rest.slice(at + 1) };
    return { source: "npm", name: rest, ref: null };
  }
  if (s.startsWith("git:")) {
    const rest = s.slice(4);
    const at = rest.lastIndexOf("@");
    const namePart = rest.slice(0, at);
    if (at > 0 && (namePart.includes("/") || namePart.includes(":"))) {
      return { source: "git", name: namePart, ref: rest.slice(at + 1) };
    }
    return { source: "git", name: rest, ref: null }; // git@ 的 @ 不是 ref
  }
  if (s.startsWith("https://") || s.startsWith("ssh://") || s.startsWith("git://")) {
    return { source: "git", name: s, ref: null };    // 协议 URL 也是 git
  }
  if (s.startsWith("/") || s.startsWith("./") || s.startsWith("../")) {
    return { source: "local", name: s, ref: null };
  }
  return null;                                       // 裸 shorthand 不收
}
\`\`\`

### ❌ / ✅

\`\`\`ts
// ❌ lastIndexOf("@") 一把梭（npm:@foo/bar 会被切成 name:""）
// ❌ git:git@github.com:user/repo 解析出 ref:"github.com:user/repo"
// ❌ github.com/u/r 没前缀也放行（要 git: 或协议头）
// ✅ npm 分 scoped/非 scoped；git 看「最后一个 @ 前有没有 / 或 :」
\`\`\`

> ✅ **做 \`parseInstallSpec\`**：把三个坑写成三个分支。

---`,
    ["parseInstallSpec"],
  ),
  sec(
    "sec-29.7",
    "§29.7 pi manifest 与约定目录（对应：`bundledResources`）🟡",
    "29.7",
    `Pi package 把前三种资源打进一个 npm/git 包。声明资源有两条路：**显式 manifest**——\`package.json\` 里加 \`pi\` 键，四个数组指向包内路径（支持 glob 与 \`!\` 排除）；**约定目录**——没有 manifest 时自动扫 \`extensions/\`（.ts/.js）、\`skills/\`（SKILL.md 目录）、\`prompts/\`（.md）、\`themes/\`（.json）。给包打上 \`pi-package\` keyword，pi.dev 的 package gallery 能收录它。

shop-kit 的 \`package.json\`（教程示意）：

\`\`\`json
{
  "name": "shop-kit",
  "keywords": ["pi-package"],
  "pi": {
    "extensions": ["./extensions/price-guard.ts"],
    "skills": ["./skills/stock-check"],
    "prompts": ["./prompts/order.md"],
    "themes": ["./themes/shop-dark.json"]
  }
}
\`\`\`

\`\`\`mermaid
flowchart TB
    pj["shop-kit/package.json"] --> mq{"有 pi manifest?"}
    mq -->|"有"| man["只按 manifest 四键<br/>缺键 = 该类为空<br/>（不退回约定目录）"]
    mq -->|"没有"| conv["四个约定目录<br/>extensions/ · skills/ · prompts/ · themes/"]
    man --> out["装完出现：<br/>价格护栏扩展 + 库存技能 + /order 模板 + 主题"]
    conv --> out
    cli["pi install npm:shop-kit@1.0.0<br/>或 git:github.com/team/shop-kit@v1"] --> pj

    style pj fill:#FFE082,stroke:#F9A825,color:#1f1f1f
    style mq fill:#80DEEA,stroke:#0097A7,color:#1f1f1f
    style man fill:#90CAF9,stroke:#1976D2,color:#1f1f1f
    style conv fill:#A5D6A7,stroke:#388E3C,color:#1f1f1f
    style out fill:#CE93D8,stroke:#7B1FA2,color:#1f1f1f
    style cli fill:#FFCC80,stroke:#F57C00,color:#1f1f1f
\`\`\`

两个工程细节（教程知道即可，不进作业合同）：① **核心包不打包**——\`@earendil-works/pi-*\` 与 \`typebox\` 由 Pi 运行时提供，manifest 里要写进 \`peerDependencies\` 且范围 \`"*"\`（对照 Maven 的 \`provided\` scope）；第三方运行时依赖才进 \`dependencies\`（Pi 安装时会跑 \`npm install --omit=dev\`）。② 同一包全局和项目都装了：**项目条目赢**，身份按「npm 包名 / git URL 去 ref / 本地绝对路径」判定去重。

作业合同：manifest 存在 → 四个数组照抄（缺键补空数组、\`./\` 前缀剥掉）；manifest 不存在 → 返回四个约定目录名；JSON 坏了 / 不是对象 → \`null\`。

### ❌ / ✅

\`\`\`ts
// ❌ manifest 缺 prompts 键就拿约定目录 prompts/ 补（manifest 在就用 manifest）
// ❌ JSON.parse 不 try/catch（坏输入会炸测试）
// ❌ 保留 "./skills" 原样返回（合同要求归一成 "skills"）
// ✅ try { JSON.parse } catch { return null }；normalize 过滤非字符串
\`\`\`

> ✅ **做 \`bundledResources\`**：一份 package.json，算出装完多出什么。

---`,
    ["bundledResources"],
  ),
  sec(
    "sec-pits",
    "⚠️ Java / Python 老手几个坑",
    null,
    `1. **给扩展写配置文件当入口。** Pi 执行代码不解析声明：入口只有默认导出工厂，具名导出 / 导出对象 / CJS 都不是。
2. **以为扩展要先编译。** jiti 免编译加载 TS；\`*/index.ts\` 也能当多文件扩展入口。
3. **SKILL.md 缺 description 期待兜底。** 官方：warning 后不加载——渐进披露没有 description 就失效。
4. **把 \`disable-model-invocation: true\` 记成「禁用技能」。** 只是模型看不见；\`/skill:name\` 仍然可用。
5. **以为技能全文常驻上下文。** 常驻的只有 name+description，全文由模型按需 read。
6. **prompts 目录当递归扫。** 发现是 non-recursive，子目录不收。
7. **npm scoped 包用 lastIndexOf("@") 一把梭。** \`npm:@foo/bar\` 会切出空名；scope 的 @ 是名字的一部分。
8. **git shorthand 的最后一个 @ 都当 ref。** \`git:git@github.com:user/repo\` 的那个 @ 属于用户名——切完剩光杆 \`git\` 就是切错了。
9. **manifest 缺键拿约定目录补。** manifest 存在时缺键 = 该类为空；约定目录只在**完全没有** manifest 时生效。
10. **忘了项目层资源要先 trust。** \`.pi/extensions\`、\`.agents/skills\` 在项目被信任前不加载（§27.6 的安全模型）。

---`,
    [],
  ),
  sec(
    "sec-homework",
    "📝 本章作业",
    null,
    `上面 7 个函数按节交错出现。每个注释里有【场景】【转换点】、示例和提示。

**完成方式**：打开仓库 \`local/m6/ch29/assignment.ts\`，把 \`throw new Error("TODO")\` 换成实现，然后：

\`\`\`bash
bun test local/m6/ch29
\`\`\`

M6 没有 \`app.ts\`：本章不建 HTTP 服务。真 Pi 片段（最小扩展、SKILL.md、模板、\`pi install\` 命令）在 \`demo.ts\` 复制区，**测试不要 import 它**。

卡住就回对应 §：\`extensionFactoryOk\` → §29.1，\`skillFromFrontmatter\` → §29.2（第一个冒号切分），\`skillInvocationMode\` → §29.3（先校验再查 flag），\`slashNamesFromDir\` → §29.4（non-recursive），\`resourceKindOf\` → §29.5（目录段 + 后缀），\`parseInstallSpec\` → §29.6（两个 @ 坑），\`bundledResources\` → §29.7（manifest vs 约定目录）。

---`,
    [],
  ),
  sec(
    "sec-check",
    "✅ 自测：你真的掌握了吗？",
    null,
    `- [ ] 能说出 extension 的入口约定，以及为什么 Pi 选「执行代码」而不是「解析配置」
- [ ] 能讲清渐进披露：什么常驻系统提示、什么按需拉、缺 description 为什么不加载
- [ ] 知道 disable-model-invocation: true 关掉的是哪条触发路（/skill:name 仍在）
- [ ] 一条输入的五道门顺序能背：扩展命令 → input 事件 → skill → 模板 → Agent
- [ ] prompts 发现 non-recursive；文件名（去 .md）就是命令名
- [ ] 能对任意路径说出四类资源归属，包括 extensions/readme.md 这种「目录对后缀错」的 null
- [ ] npm:@scope/pkg@1.2.3 与 git:git@github.com:user/repo@v1 都拆得开
- [ ] 知道 manifest 缺键 = 该类为空，约定目录只在无 manifest 时兜底
- [ ] \`bun test local/m6/ch29\` 全绿；没有 import 真 Pi 包、没有装新依赖、没有 clone 仓库

---`,
    [],
  ),
  sec(
    "sec-feynman",
    "🎓 费曼挑战",
    null,
    `用大白话讲给「Java 同事」听。讲不清 = 还没真懂。

任选一题（1–2 分钟）：

1. 「Pi 为什么要把扩展拆成 extension / skill / template / package 四种，而不是一个万能插件接口？拿 Spring / IDE 打比方。」— 卡壳重读 sec-world
2. 「渐进披露解决什么预算问题？为什么缺 description 的技能干脆不加载？」— 卡壳重读 §29.2
3. 「\`npm:@foo/bar@1.0.0\` 和 \`git:git@github.com:user/repo\` 各自的 @ 有什么歧义，你怎么判定？」— 卡壳重读 §29.6

---`,
    [],
  ),
  sec(
    "sec-next",
    "⏭️ 下一步",
    null,
    `Ch29 掌握后，你能往 Pi 上挂自己的东西了。**Ch30 换个视角看数据**：会话本身——\`session.jsonl\` 的追加式树（\`id\`/\`parentId\` 链）、九种 entry 类型、活动分支；以及 compaction 的触发式（\`contextTokens > contextWindow - reserveTokens\`）与切点规则（从新往回累积 token、只在 turn 边界切、toolResult 永不可切）。

读之前可以先做一件事：打开安装包 \`docs/compaction.md\` 搜 \`keepRecentTokens\`，带着「从哪切、为什么 toolResult 不能切」进 Ch30。`,
    [],
  ),
];

const tutorialMd = `# Ch29 · 扩展四件套：Extension / Skill / Template / Package

${sections
  .map((s) => (s.heading ? `## ${s.heading}\n\n${s.body}` : s.body))
  .join("\n\n")}
`;

const reviewMd = `# Ch29 · 记忆闪卡

> 先回忆，再翻答案。连续 2 次秒答 → 退役。

## 🔖 闪卡

| # | 正面（问题） | 背面（答案） | 掌握 |
|---|---|---|---|
| 1 | extension 的入口约定是什么？ | 默认导出工厂：\`export default (async) function (pi) {...}\` 或箭头；jiti 免编译加载 TS；具名导出 / 导出对象 / module.exports 都不算。 | ⬜ |
| 2 | 扩展放哪会被自动发现？怎么热重载 / 临时试用？ | \`~/.pi/agent/extensions/*.ts\` 或 \`*/index.ts\` 全局、\`.pi/extensions/\` 项目（需 trust）；自动发现的可用 \`/reload\` 热重载；\`pi -e path\` 只作临时试用。 | ⬜ |
| 3 | skill 的渐进披露怎么运作？ | 启动只把 name+description 放进系统提示；全文（scripts/references）由模型任务匹配后用 read 按需拉取。 | ⬜ |
| 4 | SKILL.md 缺 description 会怎样？name 要和目录同名吗？ | warning 后不加载（披露靠 description）。name 规则：小写字母数字连字符 ≤64；Pi 不要求与目录同名（比标准宽松）。 | ⬜ |
| 5 | disable-model-invocation: true 关掉了什么？ | 技能从系统提示隐藏，模型不能自发用；用户仍可 \`/skill:name\` 触发。false/缺省 = 模型可见。 | ⬜ |
| 6 | prompts/*.md 怎么变成命令？发现规则？ | 文件名去 .md 即 /name；description 可选（缺省用正文第一行）；non-recursive 只扫顶层；参数 $1 $@ \${1:-默认}。 | ⬜ |
| 7 | 一条输入的命令处理顺序？ | ① 扩展命令 ② input 事件 ③ /skill: 命令 ④ prompt 模板 ⑤ 进入 Agent 循环——扩展命令压过同名技能与模板。 | ⬜ |
| 8 | npm:@scope/pkg@1.2.3 怎么拆？坑在哪？ | source npm、name @scope/pkg、ref 1.2.3；scope 的 @ 是名字一部分，无版本时不能把它当分隔符。 | ⬜ |
| 9 | git spec 的 @ 坑？ | git:github.com/u/r@v1 → ref v1；git:git@github.com:user/repo 的最后一个 @ 属于用户名（切完剩 git 无斜杠冒号）→ 无 ref；协议 URL（https:// 等）也算 git。 | ⬜ |
| 10 | pi manifest 与约定目录的关系？ | 有 manifest 只按四键（缺键 = 该类为空）；无 manifest 才扫 extensions/ skills/ prompts/ themes/；核心包写 peerDependencies "*"（不打包）。 | ⬜ |

## 🎓 费曼自检

- [ ] 能用 Spring / IDE 插件类比讲清「四种资源各管一个维度」
- [ ] 能讲清渐进披露与「缺 description 不加载」的因果
- [ ] 能现场拆 npm scoped 与 git shorthand 的两条 install spec
`;

const chapter = {
  id: "ch29",
  num: "29",
  title: "扩展四件套：Extension / Skill / Template / Package",
  runMode: "local" as const,
  tutorialMd,
  assignment,
  testName: "ch29_assignment",
  testSource,
  reviewMd,
  interleaved: true,
  sections,
  functions,
  preamble,
  localHint: "bun test local/m6/ch29",
};

const root = dirname(fileURLToPath(import.meta.url));
const out = join(root, "../src/content/chapters/ch29.json");
mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, JSON.stringify(chapter, null, 2) + "\n");
console.log("wrote", out);

const localDir = join(root, "../local/m6/ch29");
mkdirSync(localDir, { recursive: true });

const localAssignment = `/**
 * Ch29 作业：扩展四件套 Extension / Skill / Template / Package（纯函数）。
 *
 * 场景：把商品助手的能力沉淀成资产——价格护栏扩展、库存查询技能、
 * 下单模板、共享包 shop-kit。打开本文件改 TODO，然后：bun test local/m6/ch29
 *
 * 不要 import 真 Pi 包 / 不要 clone 仓库 / 不装新依赖。
 */

${preamble}

${functions.map((f) => f.skeleton).join("\n\n")}
`;

const localTest = `import { describe, expect, test } from "bun:test";
import {
  bundledResources,
  extensionFactoryOk,
  parseInstallSpec,
  resourceKindOf,
  skillFromFrontmatter,
  skillInvocationMode,
  slashNamesFromDir,
} from "./assignment";

describe("extensionFactoryOk", () => {
  test("默认导出工厂：匿名/具名、sync/async", () => {
    expect(extensionFactoryOk("export default function (pi) { pi.on(\\"tool_call\\", () => {}); }")).toBe(true);
    expect(extensionFactoryOk("export default async function (pi) { await setup(pi); }")).toBe(true);
    expect(extensionFactoryOk("export default function priceGuard(pi) { pi.registerCommand(\\"stock\\", {}); }")).toBe(true);
  });
  test("默认导出箭头工厂（含 async 箭头）", () => {
    expect(extensionFactoryOk("export default (pi) => { pi.registerTool({}); }")).toBe(true);
    expect(extensionFactoryOk("export default async (pi) => { await warmUp(); }")).toBe(true);
  });
  test("不是工厂 → false（防只看 export 字样）", () => {
    expect(extensionFactoryOk("export function helper(pi) {}")).toBe(false);
    expect(extensionFactoryOk("export default { setup(pi) {} }")).toBe(false);
    expect(extensionFactoryOk("module.exports = function (pi) {}")).toBe(false);
    expect(extensionFactoryOk("")).toBe(false);
  });
});

describe("skillFromFrontmatter", () => {
  test("合法 SKILL.md → {name, description}", () => {
    const md = "---\\nname: stock-check\\ndescription: 查 KB-001 机械键盘与 MS-002 无线鼠标的库存价格，缺货给替代\\n---\\n# 库存查询";
    expect(skillFromFrontmatter(md)).toEqual({
      name: "stock-check",
      description: "查 KB-001 机械键盘与 MS-002 无线鼠标的库存价格，缺货给替代",
    });
  });
  test("值里带冒号：按第一个冒号切", () => {
    const md = "---\\nname: stock-check\\ndescription: Use when: 库存或价格问题\\n---\\n正文";
    expect(skillFromFrontmatter(md)).toEqual({ name: "stock-check", description: "Use when: 库存或价格问题" });
  });
  test("缺 description / 值为空 → null（不加载）", () => {
    expect(skillFromFrontmatter("---\\nname: stock-check\\n---\\n正文")).toBeNull();
    expect(skillFromFrontmatter("---\\nname: stock-check\\ndescription:\\n---\\n正文")).toBeNull();
  });
  test("没有 frontmatter / 未闭合 → null", () => {
    expect(skillFromFrontmatter("# 库存查询\\n---\\nname: x\\n---")).toBeNull();
    expect(skillFromFrontmatter("---\\nname: stock-check\\ndescription: 查库存\\n")).toBeNull();
  });
});

describe("skillInvocationMode", () => {
  test("默认 model：模型可见，也可 /skill:name", () => {
    expect(skillInvocationMode("---\\nname: stock-check\\ndescription: 查库存\\n---\\n")).toBe("model");
    expect(skillInvocationMode("---\\nname: vip\\ndescription: VIP 价格\\ndisable-model-invocation: false\\n---\\n")).toBe("model");
  });
  test("disable-model-invocation: true → 仅命令", () => {
    expect(skillInvocationMode("---\\nname: vip-price\\ndescription: 内部 VIP 价格规则\\ndisable-model-invocation: true\\n---\\n")).toBe("command");
  });
  test("技能本身不合法 → null", () => {
    expect(skillInvocationMode("---\\nname: vip-price\\n---\\n")).toBeNull();
    expect(skillInvocationMode("没有 frontmatter 的技能")).toBeNull();
  });
});

describe("slashNamesFromDir", () => {
  test("prompts 目录 → 命令名（去 .md 保序）", () => {
    expect(slashNamesFromDir(["order.md", "restock.md"])).toEqual(["order", "restock"]);
  });
  test("非 .md 与子目录都不收（non-recursive）；不改入参", () => {
    const files = ["order.md", "notes.txt", "sub/extra.md", "README.MD", "draft.md.bak", "pr.md"];
    Object.freeze(files);
    expect(slashNamesFromDir(files)).toEqual(["order", "pr"]);
    expect(files).toEqual(["order.md", "notes.txt", "sub/extra.md", "README.MD", "draft.md.bak", "pr.md"]);
  });
  test("空目录与光杆 .md", () => {
    expect(slashNamesFromDir([])).toEqual([]);
    expect(slashNamesFromDir([".md"])).toEqual([]);
  });
});

describe("resourceKindOf", () => {
  test("extension：*.ts / */index.ts（含 .js）", () => {
    expect(resourceKindOf("~/.pi/agent/extensions/price-guard.ts")).toBe("extension");
    expect(resourceKindOf(".pi/extensions/audit/index.ts")).toBe("extension");
    expect(resourceKindOf("shop-kit/extensions/helper.js")).toBe("extension");
  });
  test("skill / prompt / theme 各归其位", () => {
    expect(resourceKindOf("~/.pi/agent/skills/pdf/SKILL.md")).toBe("skill");
    expect(resourceKindOf(".agents/skills/stock-check/SKILL.md")).toBe("skill");
    expect(resourceKindOf("~/.pi/agent/prompts/order.md")).toBe("prompt");
    expect(resourceKindOf(".pi/prompts/restock.md")).toBe("prompt");
    expect(resourceKindOf("~/.pi/agent/themes/dracula.json")).toBe("theme");
    expect(resourceKindOf("themes/dark.json")).toBe("theme");
  });
  test("目录对但后缀不对 / 路径不认识 → null", () => {
    expect(resourceKindOf("extensions/readme.md")).toBeNull();
    expect(resourceKindOf("~/.pi/agent/settings.json")).toBeNull();
    expect(resourceKindOf("src/components/OrderButton.tsx")).toBeNull();
  });
});

describe("parseInstallSpec", () => {
  test("npm：scoped 的 @ 是名字的一部分", () => {
    expect(parseInstallSpec("npm:@foo/bar@1.0.0")).toEqual({ source: "npm", name: "@foo/bar", ref: "1.0.0" });
    expect(parseInstallSpec("npm:@foo/bar")).toEqual({ source: "npm", name: "@foo/bar", ref: null });
  });
  test("npm：非 scoped 有版本 / 无版本", () => {
    expect(parseInstallSpec("npm:pi-skills")).toEqual({ source: "npm", name: "pi-skills", ref: null });
    expect(parseInstallSpec("npm:pkg@2.1.7")).toEqual({ source: "npm", name: "pkg", ref: "2.1.7" });
  });
  test("git：@v1 是 ref；git@ 用户名不是", () => {
    expect(parseInstallSpec("git:github.com/user/repo@v1")).toEqual({ source: "git", name: "github.com/user/repo", ref: "v1" });
    expect(parseInstallSpec("git:github.com/user/repo")).toEqual({ source: "git", name: "github.com/user/repo", ref: null });
    expect(parseInstallSpec("git:git@github.com:user/repo")).toEqual({ source: "git", name: "git@github.com:user/repo", ref: null });
  });
  test("local 路径与非法输入", () => {
    expect(parseInstallSpec("/opt/packages/shop-kit")).toEqual({ source: "local", name: "/opt/packages/shop-kit", ref: null });
    expect(parseInstallSpec("./packages/shop-kit")).toEqual({ source: "local", name: "./packages/shop-kit", ref: null });
    expect(parseInstallSpec("github.com/user/repo")).toBeNull();
    expect(parseInstallSpec("")).toBeNull();
  });
});

describe("bundledResources", () => {
  test("pi manifest 四键全给（./ 前缀归一）", () => {
    const pkg = "{\\"name\\":\\"shop-kit\\",\\"keywords\\":[\\"pi-package\\"],\\"pi\\":{\\"extensions\\":[\\"./extensions/price-guard.ts\\"],\\"skills\\":[\\"./skills/stock-check\\"],\\"prompts\\":[\\"./prompts/order.md\\"],\\"themes\\":[\\"./themes/shop-dark.json\\"]}}";
    expect(bundledResources(pkg)).toEqual({
      extensions: ["extensions/price-guard.ts"],
      skills: ["skills/stock-check"],
      prompts: ["prompts/order.md"],
      themes: ["themes/shop-dark.json"],
    });
  });
  test("没有 manifest → 四个约定目录", () => {
    expect(bundledResources("{\\"name\\":\\"plain\\"}")).toEqual({
      extensions: ["extensions/"],
      skills: ["skills/"],
      prompts: ["prompts/"],
      themes: ["themes/"],
    });
  });
  test("manifest 缺键 = 该类为空；坏 JSON → null", () => {
    expect(bundledResources("{\\"pi\\":{\\"skills\\":[\\"skills\\"]}}")).toEqual({
      extensions: [],
      skills: ["skills"],
      prompts: [],
      themes: [],
    });
    expect(bundledResources("{oops")).toBeNull();
    expect(bundledResources("")).toBeNull();
  });
});
`;

const demoSource = `/**
 * Ch29 · 扩展四件套复制区（M6 第三章）。
 *
 * 本文件只给阅读 / 复制。测试禁止 import 本文件。
 * 全部真代码都在字符串里，if (false) 守护，不执行、不打网、不需要 Key。
 *
 * 事实源：本机安装包 docs/extensions.md · skills.md · prompt-templates.md · packages.md
 * 不要 clone 仓库；不要在课程仓库装 @earendil-works/*（M6 作业是纯函数）。
 */

// 复制区 1：读官方四篇文档（shell，粘到终端跑）
const READ_THE_DOCS = \`
ROOT="$(npm root -g)/@earendil-works/pi-coding-agent"
ls "$ROOT/docs"                      # extensions.md skills.md prompt-templates.md packages.md ...
cat "$ROOT/docs/skills.md" | head -60
ls "$ROOT/examples/extensions"       # 几十个可运行扩展示例（permission-gate / todo / snake ...）
\`;

// 复制区 2：最小扩展（来自 docs/extensions.md 快速上手，商品助手版）
// 入口约定：默认导出工厂 (pi: ExtensionAPI) => {}；jiti 加载 TS 免编译。
const MINIMAL_EXTENSION = \`
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";

export default function (pi: ExtensionAPI) {
  pi.on("session_start", async (_event, ctx) => {
    ctx.ui.notify("价格护栏已加载", "info");
  });

  pi.on("tool_call", async (event) => {
    if (event.toolName === "bash" && event.input.command?.includes("rm -rf")) {
      const ok = await ctx.ui.confirm("危险!", "允许执行 rm -rf ?");
      if (!ok) return { block: true, reason: "用户拒绝" };
    }
  });

  pi.registerCommand("stock", {
    description: "查 KB-001 机械键盘现货",
    handler: async (_args, ctx) => {
      ctx.ui.notify("KB-001 现货 12 件 / MS-002 无线鼠标缺货", "info");
    },
  });
}
\`;

// 复制区 3：库存查询技能（SKILL.md 放 ~/.pi/agent/skills/stock-check/）
// 渐进披露：启动只进 name+description，全文由模型按需 read。
const STOCK_CHECK_SKILL = \`
---
name: stock-check
description: 查询商品库存与价格，缺货时按类目给出替代品建议。Use when 用户问 KB-001 / MS-002 等商品有没有货。
---

# 库存查询

## 步骤
1. 用 read 打开 data/products.json（10 个商品，CP-009 库存为 0）
2. 按 SKU 精确匹配；查不到按名称模糊匹配
3. 缺货时从同 category 里挑 price 最接近的替代品

## 参考脚本
./scripts/lookup.sh <SKU>
\`;

// 复制区 4：下单模板（prompts/order.md → 斜杠命令 /order）
const ORDER_TEMPLATE = \`
---
description: 按商品与数量生成下单请求草稿
argument-hint: "<SKU> [qty]"
---
为 $1 生成下单请求草稿，数量 \${2:-1}。先核对当前库存，再输出 JSON 草稿。
\`;

// 复制区 5：打成 Pi package 分享（packages.md）
const PACKAGE_AND_INSTALL = \`
# shop-kit/package.json 带 pi manifest + pi-package keyword
{
  "name": "shop-kit",
  "keywords": ["pi-package"],
  "peerDependencies": {
    "@earendil-works/pi-coding-agent": "*",
    "typebox": "*"
  },
  "pi": {
    "extensions": ["./extensions/price-guard.ts"],
    "skills": ["./skills/stock-check"],
    "prompts": ["./prompts/order.md"],
    "themes": ["./themes/shop-dark.json"]
  }
}

# 安装三来源（写进 settings.json 的 packages 数组）
pi install npm:@team/shop-kit@1.0.0        # npm：scope 的 @ 是名字一部分
pi install git:github.com/team/shop-kit@v1 # git：@v1 是钉住的 ref
pi install ./packages/shop-kit             # local：不拷贝，原地加载
pi -e npm:@team/shop-kit                   # 临时试用，不写 settings
pi list                                    # 看已装包
\`;

if (false) {
  console.log(READ_THE_DOCS);
  console.log(MINIMAL_EXTENSION);
  console.log(STOCK_CHECK_SKILL);
  console.log(ORDER_TEMPLATE);
  console.log(PACKAGE_AND_INSTALL);
}
`;

writeFileSync(join(localDir, "assignment.ts"), localAssignment);
writeFileSync(join(localDir, "assignment.test.ts"), localTest);
writeFileSync(join(localDir, "demo.ts"), demoSource);
console.log("wrote", localDir);
