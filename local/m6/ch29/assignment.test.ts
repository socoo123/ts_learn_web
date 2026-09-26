import { describe, expect, test } from "bun:test";
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
    expect(extensionFactoryOk("export default function (pi) { pi.on(\"tool_call\", () => {}); }")).toBe(true);
    expect(extensionFactoryOk("export default async function (pi) { await setup(pi); }")).toBe(true);
    expect(extensionFactoryOk("export default function priceGuard(pi) { pi.registerCommand(\"stock\", {}); }")).toBe(true);
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
    const md = "---\nname: stock-check\ndescription: 查 KB-001 机械键盘与 MS-002 无线鼠标的库存价格，缺货给替代\n---\n# 库存查询";
    expect(skillFromFrontmatter(md)).toEqual({
      name: "stock-check",
      description: "查 KB-001 机械键盘与 MS-002 无线鼠标的库存价格，缺货给替代",
    });
  });
  test("值里带冒号：按第一个冒号切", () => {
    const md = "---\nname: stock-check\ndescription: Use when: 库存或价格问题\n---\n正文";
    expect(skillFromFrontmatter(md)).toEqual({ name: "stock-check", description: "Use when: 库存或价格问题" });
  });
  test("缺 description / 值为空 → null（不加载）", () => {
    expect(skillFromFrontmatter("---\nname: stock-check\n---\n正文")).toBeNull();
    expect(skillFromFrontmatter("---\nname: stock-check\ndescription:\n---\n正文")).toBeNull();
  });
  test("没有 frontmatter / 未闭合 → null", () => {
    expect(skillFromFrontmatter("# 库存查询\n---\nname: x\n---")).toBeNull();
    expect(skillFromFrontmatter("---\nname: stock-check\ndescription: 查库存\n")).toBeNull();
  });
});

describe("skillInvocationMode", () => {
  test("默认 model：模型可见，也可 /skill:name", () => {
    expect(skillInvocationMode("---\nname: stock-check\ndescription: 查库存\n---\n")).toBe("model");
    expect(skillInvocationMode("---\nname: vip\ndescription: VIP 价格\ndisable-model-invocation: false\n---\n")).toBe("model");
  });
  test("disable-model-invocation: true → 仅命令", () => {
    expect(skillInvocationMode("---\nname: vip-price\ndescription: 内部 VIP 价格规则\ndisable-model-invocation: true\n---\n")).toBe("command");
  });
  test("技能本身不合法 → null", () => {
    expect(skillInvocationMode("---\nname: vip-price\n---\n")).toBeNull();
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
    const pkg = "{\"name\":\"shop-kit\",\"keywords\":[\"pi-package\"],\"pi\":{\"extensions\":[\"./extensions/price-guard.ts\"],\"skills\":[\"./skills/stock-check\"],\"prompts\":[\"./prompts/order.md\"],\"themes\":[\"./themes/shop-dark.json\"]}}";
    expect(bundledResources(pkg)).toEqual({
      extensions: ["extensions/price-guard.ts"],
      skills: ["skills/stock-check"],
      prompts: ["prompts/order.md"],
      themes: ["themes/shop-dark.json"],
    });
  });
  test("没有 manifest → 四个约定目录", () => {
    expect(bundledResources("{\"name\":\"plain\"}")).toEqual({
      extensions: ["extensions/"],
      skills: ["skills/"],
      prompts: ["prompts/"],
      themes: ["themes/"],
    });
  });
  test("manifest 缺键 = 该类为空；坏 JSON → null", () => {
    expect(bundledResources("{\"pi\":{\"skills\":[\"skills\"]}}")).toEqual({
      extensions: [],
      skills: ["skills"],
      prompts: [],
      themes: [],
    });
    expect(bundledResources("{oops")).toBeNull();
    expect(bundledResources("")).toBeNull();
  });
});
