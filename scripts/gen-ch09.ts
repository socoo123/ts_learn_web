/**
 * 生成 src/content/chapters/ch09.json
 * 运行：bun scripts/gen-ch09.ts
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const preamble = `/**
 * Ch09 作业：解析 package.json 字符串。
 *
 * 场景：电商助手 shop-agent 的清单是一份 JSON 文本。CI / 启动脚本
 * 要读 name、type、scripts、dependencies，决定这是不是 ESM、zod
 * 装在哪、dev 脚本怎么跑。本课作业只解析字符串，不读磁盘、不装包。
 *
 * 对照：Java 读 pom.xml，Python 读 pyproject.toml。TS / Node / Bun
 * 读 package.json。本课统一 Bun；作业禁止 bun add / npm install。
 *
 * 约定：入参是 JSON 文本。非法 JSON 让 JSON.parse 抛错（测试用 try/catch）。
 * 缺 name 抛 new Error("NO_NAME")。找不到的依赖 / 脚本返回 null，不是 ""。
 *
 * 全绿 = 你掌握了 Ch09。
 */`;

const functions = [
  {
    name: "readPkgName",
    testSuite: "readPkgName",
    skeleton: `/**
 * 【场景】启动脚本要先确认「这是哪个项目」：shop-agent 还是课程站。
 *
 * 【转换点】JSON.parse 读 name。Java 的 pom.xml <artifactId>；
 * Python 的 pyproject.toml [project] name；这边是 package.json 的 name 字段。
 *
 * 任务：解析 pkgJson，返回 pkg.name。没有 name（不是 string）则
 * throw new Error("NO_NAME")。非法 JSON 让 JSON.parse 自己抛。
 * 示例：
 *   readPkgName('{"name":"shop-agent"}')     -> "shop-agent"
 *   readPkgName('{"name":"ts-learn-web"}')   -> "ts-learn-web"
 *   readPkgName("{}")                        -> 抛 Error("NO_NAME")
 *   readPkgName("{")                         -> 抛（非法 JSON）
 *
 * 提示：const pkg = JSON.parse(pkgJson);
 *       if (typeof pkg.name !== "string") throw new Error("NO_NAME");
 */
export function readPkgName(pkgJson: string): string {
  throw new Error("TODO");
}`,
  },
  {
    name: "isModuleType",
    testSuite: "isModuleType",
    skeleton: `/**
 * 【场景】shop-agent 要用 import / export。Node 默认把 .js 当 CJS
 * （require / module.exports）。必须看到 "type": "module" 才按 ESM 跑。
 *
 * 【转换点】缺 type 在 Node lore 里等于 CJS。本题：只有精确等于
 * "module" 才 true；缺字段、"commonjs" 都是 false。
 *
 * 任务：JSON.parse 后返回 pkg.type === "module"。
 * 示例：
 *   isModuleType('{"type":"module"}')     -> true
 *   isModuleType('{"name":"bare-shop"}')  -> false   // 缺 type
 *   isModuleType('{"type":"commonjs"}')   -> false
 *
 * 提示：不要因为「本课都是 ESM」就写 return true。
 */
export function isModuleType(pkgJson: string): boolean {
  throw new Error("TODO");
}`,
  },
  {
    name: "depVersion",
    testSuite: "depVersion",
    skeleton: `/**
 * 【场景】排障：线上报 zod 行为不对。先看 runtime 依赖写的是哪个版本范围。
 *
 * 【转换点】只查 dependencies，不查 devDependencies。
 * Java 的 <scope>compile</scope> 才进运行时；typescript 这种编译器用的
 * 写在 devDependencies，depVersion 必须当它不存在。
 *
 * 任务：返回 dependencies[name]（string）；没有这个键、或没有
 * dependencies 字段 → null（不是 ""）。
 * 示例：
 *   depVersion(SHOP_PKG, "zod")         -> "^3.23.8"
 *   depVersion(SITE_PKG, "zod")         -> "^4.4.3"   // 防硬编码
 *   depVersion(SHOP_PKG, "react")       -> null
 *   depVersion(SHOP_PKG, "typescript")  -> null       // 它在 devDependencies
 *
 * 提示：const v = pkg.dependencies?.[name];
 *       return typeof v === "string" ? v : null;
 */
export function depVersion(pkgJson: string, name: string): string | null {
  throw new Error("TODO");
}`,
  },
  {
    name: "hasDevDep",
    testSuite: "hasDevDep",
    skeleton: `/**
 * 【场景】CI 要确认「能 tsc」：typescript 必须在 devDependencies 里。
 * react / zod 即使在 dependencies 里，也不算 devDep。
 *
 * 【转换点】dependency vs devDependency。
 * runtime（zod、decimal、react）→ dependencies；
 * 只在开发/编译用（typescript、vite、@types/*）→ devDependencies。
 * 打包进生产的是前者；tsc 本身不进浏览器包。
 *
 * 任务：name 是 devDependencies 的键 → true，否则 false。
 * 示例：
 *   hasDevDep(SHOP_PKG, "typescript")  -> true
 *   hasDevDep(SITE_PKG, "vite")        -> true
 *   hasDevDep(SITE_PKG, "react")       -> false  // 只在 dependencies
 *   hasDevDep(SHOP_PKG, "react")       -> false
 *
 * 提示：Object.keys(pkg.devDependencies ?? {}).includes(name)
 *       缺 devDependencies 字段 → false，不要抛。
 */
export function hasDevDep(pkgJson: string, name: string): boolean {
  throw new Error("TODO");
}`,
  },
  {
    name: "scriptCommand",
    testSuite: "scriptCommand",
    skeleton: `/**
 * 【场景】同事说「跑 dev」。Maven 是 mvn spring-boot:run；
 * Python 是 uv run …；这边是 package.json 的 scripts.dev。
 *
 * 【转换点】scripts 是「名字 → 命令字符串」。本课 shop-agent 的
 * dev 是 bun run src/index.ts；课程站的 dev 是 vite。作业读字符串，
 * 不要真的执行命令。
 *
 * 任务：返回 scripts[script]；缺 scripts 或缺这个名字 → null。
 * 示例：
 *   scriptCommand(SHOP_PKG, "dev")    -> "bun run src/index.ts"
 *   scriptCommand(SITE_PKG, "dev")    -> "vite"
 *   scriptCommand(SITE_PKG, "build")  -> "vite build"
 *   scriptCommand(SHOP_PKG, "start")  -> null
 *
 * 提示：const cmd = pkg.scripts?.[script];
 *       return typeof cmd === "string" ? cmd : null;
 */
export function scriptCommand(pkgJson: string, script: string): string | null {
  throw new Error("TODO");
}`,
  },
  {
    name: "collectDepNames",
    testSuite: "collectDepNames",
    skeleton: `/**
 * 【场景】安全审计：列出会进运行时的包名。不要把 typescript
 * 算进去——它不在 dependencies。
 *
 * 【转换点】Object.keys(dependencies ?? {})。JSON 对象键顺序不稳定，
 * 必须 sort()，测试才好对。空对象或缺字段 → []。
 *
 * 任务：返回 runtime 依赖名，字典序排序。不要包含 devDependencies。
 * 示例：
 *   collectDepNames(SHOP_PKG)  -> ["uuid", "zod"]        // 不是插入序
 *   collectDepNames(SITE_PKG)  -> ["react", "zod"]
 *   collectDepNames('{"name":"empty-shop","dependencies":{}}')  -> []
 *   collectDepNames('{"name":"nodeps-shop"}')                   -> []
 *
 * 提示：return Object.keys(pkg.dependencies ?? {}).sort();
 */
export function collectDepNames(pkgJson: string): string[] {
  throw new Error("TODO");
}`,
  },
  {
    name: "assertCaretRange",
    testSuite: "assertCaretRange",
    skeleton: `/**
 * 【场景】依赖写 "^4.4.3" 还是 "4.4.3"？前者是兼容范围，后者是钉死。
 * 排障时先 depVersion 拿到字符串，再问：这是不是 caret 范围？
 *
 * 【转换点】semver 的 ^。本课只考「是不是以 ^ 开头」，不解析完整区间。
 * "~1.0.0" 是 tilde（另一套范围），本题算 false。空串 false。
 *
 * 任务：version.startsWith("^")。
 * 示例：
 *   assertCaretRange("^4.4.3")  -> true
 *   assertCaretRange("^0.1.0")  -> true
 *   assertCaretRange("4.4.3")   -> false   // 钉死
 *   assertCaretRange("~1.0.0")  -> false
 *   assertCaretRange("")        -> false
 *
 * 提示：一行 return version.startsWith("^");
 * 交错式：本题不要调用 depVersion（那题可能还是 TODO）。
 */
export function assertCaretRange(version: string): boolean {
  throw new Error("TODO");
}`,
  },
];

const assignment = `${preamble}

${functions.map((f) => f.skeleton).join("\n\n")}
`;

const shopPkg = {
  name: "shop-agent",
  version: "0.2.0",
  type: "module",
  scripts: {
    dev: "bun run src/index.ts",
    test: "bun test",
  },
  dependencies: {
    zod: "^3.23.8",
    uuid: "^10.0.0",
  },
  devDependencies: {
    typescript: "^5.5.4",
  },
};

const sitePkg = {
  name: "ts-learn-web",
  version: "0.1.0",
  type: "module",
  scripts: {
    dev: "vite",
    build: "vite build",
    preview: "vite preview",
  },
  dependencies: {
    zod: "^4.4.3",
    react: "^18.3.1",
  },
  devDependencies: {
    typescript: "^5.5.4",
    vite: "^5.4.3",
  },
};

const cjsPkg = { name: "legacy-shop", type: "commonjs" };
const noTypePkg = { name: "bare-shop", version: "1.0.0" };
const noNamePkg = { version: "1.0.0", type: "module" };
const emptyDepsPkg = { name: "empty-shop", dependencies: {} };
const noDepsPkg = { name: "nodeps-shop" };
const tsAsDepPkg = {
  name: "oops-shop",
  dependencies: { typescript: "^5.5.4" },
};
const noScriptsPkg = { name: "silent-shop", type: "module" };

function jsonLit(obj: unknown): string {
  return JSON.stringify(JSON.stringify(obj));
}

const testSource = `const SHOP_PKG = ${jsonLit(shopPkg)};
const SITE_PKG = ${jsonLit(sitePkg)};
const CJS_PKG = ${jsonLit(cjsPkg)};
const NO_TYPE_PKG = ${jsonLit(noTypePkg)};
const NO_NAME_PKG = ${jsonLit(noNamePkg)};
const EMPTY_DEPS_PKG = ${jsonLit(emptyDepsPkg)};
const NO_DEPS_PKG = ${jsonLit(noDepsPkg)};
const TS_AS_DEP_PKG = ${jsonLit(tsAsDepPkg)};
const NO_SCRIPTS_PKG = ${jsonLit(noScriptsPkg)};

function threw(fn: () => unknown): boolean {
  try {
    fn();
    return false;
  } catch {
    return true;
  }
}

function errorMessage(fn: () => unknown): string | null {
  try {
    fn();
    return null;
  } catch (e) {
    return e instanceof Error ? e.message : String(e);
  }
}

describe("readPkgName", () => {
  it("电商 shop-agent", () => {
    expect(readPkgName(SHOP_PKG)).toBe("shop-agent");
  });
  it("课程站 ts-learn-web（防硬编码）", () => {
    expect(readPkgName(SITE_PKG)).toBe("ts-learn-web");
  });
  it("最小 JSON 只有 name", () => {
    expect(readPkgName('{"name":"shop-agent"}')).toBe("shop-agent");
  });
  it("另一份最小 JSON（防硬编码 shop-agent）", () => {
    expect(readPkgName('{"name":"ts-learn-web"}')).toBe("ts-learn-web");
  });
  it("缺 name 抛 NO_NAME", () => {
    expect(errorMessage(() => readPkgName("{}"))).toBe("NO_NAME");
    expect(errorMessage(() => readPkgName(NO_NAME_PKG))).toBe("NO_NAME");
  });
  it("NO_NAME 是 Error", () => {
    let err: unknown;
    try {
      readPkgName("{}");
    } catch (e) {
      err = e;
    }
    expect(err).toBeInstanceOf(Error);
  });
  it("非法 JSON 会抛", () => {
    expect(threw(() => readPkgName("{"))).toBe(true);
    expect(threw(() => readPkgName("not-json"))).toBe(true);
  });
});

describe("isModuleType", () => {
  it("shop-agent 是 module", () => {
    expect(isModuleType(SHOP_PKG)).toBe(true);
  });
  it("课程站也是 module（防硬编码只认 shop-agent）", () => {
    expect(isModuleType(SITE_PKG)).toBe(true);
  });
  it("缺 type → false（Node 默认 CJS）", () => {
    expect(isModuleType(NO_TYPE_PKG)).toBe(false);
    expect(isModuleType('{"name":"bare-shop"}')).toBe(false);
  });
  it("type commonjs → false", () => {
    expect(isModuleType(CJS_PKG)).toBe(false);
    expect(isModuleType('{"type":"commonjs"}')).toBe(false);
  });
  it("非法 JSON 会抛", () => {
    expect(threw(() => isModuleType("{"))).toBe(true);
  });
});

describe("depVersion", () => {
  it("shop-agent 的 zod", () => {
    expect(depVersion(SHOP_PKG, "zod")).toBe("^3.23.8");
  });
  it("课程站的 zod（防硬编码 ^3.23.8）", () => {
    expect(depVersion(SITE_PKG, "zod")).toBe("^4.4.3");
  });
  it("shop-agent 没有 react → null", () => {
    expect(depVersion(SHOP_PKG, "react")).toBeNull();
  });
  it("课程站有 react", () => {
    expect(depVersion(SITE_PKG, "react")).toBe("^18.3.1");
  });
  it("typescript 在 devDependencies，depVersion 当没有", () => {
    expect(depVersion(SHOP_PKG, "typescript")).toBeNull();
    expect(depVersion(SITE_PKG, "typescript")).toBeNull();
  });
  it("缺 dependencies 字段 → null", () => {
    expect(depVersion(NO_DEPS_PKG, "zod")).toBeNull();
  });
  it("uuid 在 shop-agent 的 dependencies", () => {
    expect(depVersion(SHOP_PKG, "uuid")).toBe("^10.0.0");
  });
});

describe("hasDevDep", () => {
  it("typescript 在 shop-agent 的 devDependencies", () => {
    expect(hasDevDep(SHOP_PKG, "typescript")).toBe(true);
  });
  it("vite 在课程站的 devDependencies（防硬编码 typescript）", () => {
    expect(hasDevDep(SITE_PKG, "vite")).toBe(true);
    expect(hasDevDep(SITE_PKG, "typescript")).toBe(true);
  });
  it("react 只在 dependencies → false", () => {
    expect(hasDevDep(SITE_PKG, "react")).toBe(false);
  });
  it("shop-agent 根本没有 react", () => {
    expect(hasDevDep(SHOP_PKG, "react")).toBe(false);
  });
  it("zod 是 runtime 依赖，不是 devDep", () => {
    expect(hasDevDep(SHOP_PKG, "zod")).toBe(false);
    expect(hasDevDep(SITE_PKG, "zod")).toBe(false);
  });
  it("typescript 写在 dependencies 也不算 hasDevDep", () => {
    expect(hasDevDep(TS_AS_DEP_PKG, "typescript")).toBe(false);
  });
  it("缺 devDependencies 字段 → false", () => {
    expect(hasDevDep(NO_DEPS_PKG, "typescript")).toBe(false);
  });
});

describe("scriptCommand", () => {
  it("shop-agent 的 dev 是 bun", () => {
    expect(scriptCommand(SHOP_PKG, "dev")).toBe("bun run src/index.ts");
  });
  it("课程站的 dev 是 vite（防硬编码 bun 命令）", () => {
    expect(scriptCommand(SITE_PKG, "dev")).toBe("vite");
  });
  it("课程站的 build / preview", () => {
    expect(scriptCommand(SITE_PKG, "build")).toBe("vite build");
    expect(scriptCommand(SITE_PKG, "preview")).toBe("vite preview");
  });
  it("shop-agent 的 test", () => {
    expect(scriptCommand(SHOP_PKG, "test")).toBe("bun test");
  });
  it("没有这个脚本 → null", () => {
    expect(scriptCommand(SHOP_PKG, "start")).toBeNull();
    expect(scriptCommand(SITE_PKG, "start")).toBeNull();
  });
  it("缺 scripts 字段 → null", () => {
    expect(scriptCommand(NO_SCRIPTS_PKG, "dev")).toBeNull();
  });
});

describe("collectDepNames", () => {
  it("shop-agent 只要 runtime 键，且排序", () => {
    expect(collectDepNames(SHOP_PKG)).toEqual(["uuid", "zod"]);
  });
  it("课程站（防硬编码 uuid/zod）", () => {
    expect(collectDepNames(SITE_PKG)).toEqual(["react", "zod"]);
  });
  it("不要包含 typescript / vite", () => {
    const shop = collectDepNames(SHOP_PKG);
    const site = collectDepNames(SITE_PKG);
    expect(shop.includes("typescript")).toBe(false);
    expect(site.includes("typescript")).toBe(false);
    expect(site.includes("vite")).toBe(false);
  });
  it("空 dependencies → []", () => {
    expect(collectDepNames(EMPTY_DEPS_PKG)).toEqual([]);
  });
  it("缺 dependencies 字段 → []", () => {
    expect(collectDepNames(NO_DEPS_PKG)).toEqual([]);
  });
  it("插入序和字典序不同，必须 sort", () => {
    const messy = '{"name":"x","dependencies":{"zod":"^1.0.0","react":"^18.0.0","uuid":"^10.0.0"}}';
    expect(collectDepNames(messy)).toEqual(["react", "uuid", "zod"]);
  });
});

describe("assertCaretRange", () => {
  it("^4.4.3 是 caret", () => {
    expect(assertCaretRange("^4.4.3")).toBe(true);
  });
  it("^0.1.0 也是 caret", () => {
    expect(assertCaretRange("^0.1.0")).toBe(true);
  });
  it("另一份 ^3.23.8（防硬编码只认 4.4.3）", () => {
    expect(assertCaretRange("^3.23.8")).toBe(true);
  });
  it("钉死 4.4.3 不是 caret", () => {
    expect(assertCaretRange("4.4.3")).toBe(false);
  });
  it("tilde ~1.0.0 不是 caret", () => {
    expect(assertCaretRange("~1.0.0")).toBe(false);
  });
  it("空串 false", () => {
    expect(assertCaretRange("")).toBe(false);
  });
  it("普通 1.0.0 / 星号都不是", () => {
    expect(assertCaretRange("1.0.0")).toBe(false);
    expect(assertCaretRange("*")).toBe(false);
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
    `> **预计**：0.5 天 ｜ **前置**：Ch01（世界地图里已经见过 Bun）
> **目标**：① 能读 \`package.json\`；② 分清 dependency / devDependency；③ Bun vs npm 一句话；④ 对照 Python uv、Java Maven。
> 你 15 年 Java：依赖写在 \`pom.xml\`。Python 课：\`pyproject.toml\` + uv。这边的清单是 **\`package.json\`**。

> 📐 **本教程的契约**：下面每一节（§9.1–§9.7）都**精确对应**作业里的题。讲过的才考，考的必讲过。卡住时按作业函数名回查对应小节。
> 作业 = **解析 package.json 字符串**。不要读磁盘、不要 \`bun add\`、不要 \`npm install\`。

---`,
    [],
  ),
  sec(
    "sec-map",
    "🗺️ 本章地图",
    null,
    `本章作业是一条完整主线：**给电商助手 shop-agent 写一组「读清单」工具**。7 个函数，全部吃 JSON 文本，吐字段。另有一份 \`ts-learn-web\` 形状的夹具，防止你把 name 写死成 \`shop-agent\`。

读完这章 + 完成作业，你将能够：

- 说出 \`package.json\` 对标 Maven \`pom.xml\`、Python \`pyproject.toml\`
- 读出 \`name\`；缺了要抛 \`NO_NAME\`
- 用 \`"type": "module"\` 判断 ESM（缺省按 CJS / false）
- 从 \`dependencies\` 取版本，**不翻** \`devDependencies\`
- 分清 runtime 依赖（zod）和编译期依赖（typescript）
- 读 \`scripts.dev\` 这类命令字符串
- 列出 runtime 包名并 **sort**
- 认出 semver 的 \`^\` 是兼容范围，不是钉死

**作业 ↔ 教程对应表**（学哪节，就去做哪题）：

| 作业题 | 对应小节 | 核心知识点 |
|--------|----------|-----------|
| \`readPkgName\` | §9.1 | \`name\` 字段、\`JSON.parse\`、\`NO_NAME\` |
| \`isModuleType\` | §9.2 | \`"type": "module"\` vs CJS |
| \`depVersion\` | §9.3 | \`dependencies[name]\`，不查 dev |
| \`hasDevDep\` | §9.4 | \`devDependencies\` vs runtime |
| \`scriptCommand\` | §9.5 | \`scripts[name]\` |
| \`collectDepNames\` | §9.6 | \`Object.keys\` + \`sort\` |
| \`assertCaretRange\` | §9.7 | semver \`^\` |

---`,
    [],
  ),
  sec(
    "sec-path",
    "⏱️ 学习路径：费曼五步（约 30–45 分钟）",
    null,
    `| 步 | 你要做 | 在哪做 |
|----|--------|--------|
| ① 预览猜（2 分钟） | 用 Maven / uv 的直觉猜 TS 清单 | 本页 ① |
| ② 先动手 | 每节后面的编辑器里**先试着写** | 本节练习 |
| ③ 提取+反馈 | 点「运行测试」看红绿 | 本节练习 |
| ④ 费曼（2 分钟） | 大白话讲清 dep vs devDep、\`^\`、Bun | 本页 ④ |
| ⑤ 存闪卡 | 章末闪卡标复习日期 | 闪卡 |

> 💡 别从头读到尾。先扫 ① → 写作业 → **哪题卡了，回对应 § 查** → 改 → 再跑。
> 本章每题自己 \`JSON.parse\`。交错式下后面的题**不要调用**前面的函数（那题可能还是 TODO），\`assertCaretRange\` 尤其只吃版本字符串。

---`,
    [],
  ),
  sec(
    "sec-guess",
    "① 预览猜（2 分钟 · 激活你的 Java / Python 直觉）",
    null,
    `先别看答案，凭经验猜一猜（猜错没关系）：

1. Maven 的 \`pom.xml\`、Python 的 \`pyproject.toml\`，在 TS 项目里对标哪个文件？
2. zod 运行时要用，typescript 只在编译时要用——分别该写进哪一个字段？
3. 不写 \`"type": "module"\`，Node 会把 \`.js\` 当成 ESM 还是 CJS？
4. \`"zod": "^4.4.3"\` 的 \`^\` 是「必须恰好 4.4.3」吗？
5. 为什么项目里会有巨大的 \`node_modules\`？Maven 不是丢 \`~/.m2\` 吗？
6. \`npm install -g typescript\` 当默认心智，错在哪？本课为什么统一 Bun？

> 猜完，带着验证心态进入正文。作业全程解析**字符串**，不会真的往你电脑里装包。

---`,
    [],
  ),
  sec(
    "sec-world",
    "世界地图：清单文件长什么样 🟡",
    null,
    `先把三份清单放在一起看。字段名不同，**角色一样**：这是谁、运行时依赖谁、开发时依赖谁、怎么启动。

### Java：\`pom.xml\`

\`\`\`xml
<project>
  <artifactId>shop-agent</artifactId>
  <dependencies>
    <dependency>
      <groupId>com.example</groupId>
      <artifactId>some-lib</artifactId>
      <version>4.6.0</version>
    </dependency>
  </dependencies>
</project>
\`\`\`

Maven 把 jar **缓存进** \`~/.m2/repository\`（用户级本地仓库），编译时 classpath 去那里找。项目目录里通常**没有**一份完整的依赖拷贝。

### Python：\`pyproject.toml\` + uv

\`\`\`toml
[project]
name = "shop-agent"
dependencies = ["pydantic>=2"]

[dependency-groups]
dev = ["mypy", "pytest"]
\`\`\`

\`uv add pydantic\` 写进清单，包进**这个项目的** \`.venv\`。和 Maven 全局缓存不同，和下面的 \`node_modules\` 更像：**按项目隔离**。

### TypeScript / Node / Bun：\`package.json\`

\`\`\`json
{
  "name": "shop-agent",
  "type": "module",
  "scripts": {
    "dev": "bun run src/index.ts",
    "test": "bun test"
  },
  "dependencies": {
    "zod": "^3.23.8",
    "uuid": "^10.0.0"
  },
  "devDependencies": {
    "typescript": "^5.5.4"
  }
}
\`\`\`

| 角色 | Java | Python | 本课 TS |
|------|------|--------|---------|
| 清单 | \`pom.xml\` | \`pyproject.toml\` | **\`package.json\`** |
| 装包 | \`mvn install\` | \`uv add\` / \`uv sync\` | **\`bun add\`**（本章作业不跑） |
| 运行时依赖 | \`<dependencies>\` | \`[project] dependencies\` | **\`dependencies\`** |
| 开发/编译依赖 | test/provided scope | \`[dependency-groups] dev\` | **\`devDependencies\`** |
| 隔离落点 | \`~/.m2\` 缓存 + classpath | 项目 \`.venv\` | 项目 **\`node_modules\`** |
| 跑起来 | \`mvn\` / IDE | \`uv run\` | **Bun** |

### 本课一句定调：统一 Bun

**Bun = 运行时 + 包管理 + 测试。** \`bun run src/index.ts\`、\`bun test\`、\`bun add zod\` 是同一条工具链。npm / pnpm 也能装包，本课**不纠结**，作业和本地章都按 Bun 写。

\`\`\`bash
# 真实项目里你会这么装（本章作业不要跑）
bun add zod              # 写入 dependencies
bun add -d typescript    # 写入 devDependencies
\`\`\`

> ❌ 心智：\`npm install -g typescript\`，全世界共用一份，像把所有 jar 塞进一台全局 JVM。
> ✅ 心智：每个项目一份 \`package.json\` + \`node_modules\`，像 Python 的 \`.venv\`。

### 为什么会有 \`node_modules\`？🟡

- **npm / Bun**：解析 \`package.json\` 后，把包装进**本项目**的 \`node_modules\`。运行 \`import "zod"\` 时，从这棵树往上找。所以它又大又该进 \`.gitignore\`。
- **Maven**：\`~/.m2/repository\` 是**本机共享缓存**，不是把依赖复制进每个工程目录。有本地仓库，但和 \`node_modules\`「项目内一份完整树」不是一回事。
- **uv**：\`.venv\` 也是项目内隔离，更接近 \`node_modules\`，而不是 \`~/.m2\`。

本课仓库真实的 \`package.json\` 也是这个形状（\`name\`: \`ts-learn-web\`、\`type\`: \`module\`、\`scripts.dev\`: \`vite\`）。作业**不读那个文件**，只解析下面这种字符串夹具。

### 本课怎么算「会了」

能指着一份 \`package.json\` 说出每个字段干什么，7 个解析函数测试全绿。**不会**要求你发到公共 registry 或搭流水线。

---`,
    [],
  ),
  sec(
    "sec-9.1",
    "§9.1 `name` 字段（对应：`readPkgName`）🟡",
    "9.1",
    `\`name\` 就是这份清单的身份证。对标 \`<artifactId>\` / \`[project] name\`。

### Java / Python 对照

\`\`\`java
// pom.xml: <artifactId>shop-agent</artifactId>
\`\`\`

\`\`\`python
# pyproject.toml: name = "shop-agent"
\`\`\`

### TypeScript：先 parse，再取字段

入参是 **字符串**，不是已经 parse 好的对象。非法 JSON 让 \`JSON.parse\` 抛（\`SyntaxError\`，也是 \`Error\`）。测试用 try/catch，没有 Jest 那种 \`.toThrow\`。

\`\`\`ts
function readPkgName(pkgJson: string): string {
  const pkg = JSON.parse(pkgJson);
  if (typeof pkg.name !== "string") {
    throw new Error("NO_NAME");
  }
  return pkg.name;
}

readPkgName('{"name":"shop-agent"}');    // "shop-agent"
readPkgName('{"name":"ts-learn-web"}');  // "ts-learn-web"
readPkgName("{}");                       // ❌ Error("NO_NAME")
readPkgName("{");                        // ❌ JSON.parse 抛
\`\`\`

> 🟡 **缺 name 和非法 JSON 不是一回事。** 前者你主动 \`throw new Error("NO_NAME")\`（测试会查 \`message\`）；后者不要包一层吞掉。

### ❌ / ✅

\`\`\`ts
// ❌ 硬编码，第二份夹具会红
return "shop-agent";

// ❌ 缺 name 返回 "" —— 本题要求抛 NO_NAME
if (!pkg.name) return "";

// ❌ try/catch 把非法 JSON 吞成 ""
try { return JSON.parse(pkgJson).name; } catch { return ""; }

// ✅
const pkg = JSON.parse(pkgJson);
if (typeof pkg.name !== "string") throw new Error("NO_NAME");
return pkg.name;
\`\`\`

电商场景：启动脚本先 \`readPkgName\`，日志里打印 \`shop-agent\`，避免连上错误的配置中心。

> ✅ **做 \`readPkgName\`**：\`JSON.parse\` → 检查 \`typeof name === "string"\` → 否则 \`NO_NAME\`。

---`,
    ["readPkgName"],
  ),
  sec(
    "sec-9.2",
    "§9.2 `type: \"module\"`（对应：`isModuleType`）🔴",
    "9.2",
    `这是 JS 特有的开关，Java / Python 没有对等物。

### Node 的默认是 CJS 🔴

- **不写 \`type\`**：\`.js\` 按 **CommonJS** 解析（\`require\` / \`module.exports\`）。这是历史默认，题里当 **false**。
- \`"type": "commonjs"\`：显式 CJS，也是 **false**。
- \`"type": "module"\`：\`.js\` 按 **ESM** 解析（\`import\` / \`export\`）。本题 **true**。本课作业和源码都走 ESM。

\`\`\`ts
function isModuleType(pkgJson: string): boolean {
  const pkg = JSON.parse(pkgJson);
  return pkg.type === "module";
}

isModuleType('{"type":"module"}');      // true
isModuleType('{"name":"bare-shop"}');   // false  ← 缺 type
isModuleType('{"type":"commonjs"}');    // false
isModuleType(SHOP_PKG);                 // true（夹具里写了 module）
\`\`\`

### 和 Python / Java 怎么类比（别类比过头）

Python 3 的 \`import\` 就是模块系统，没有「再开一个 type 字段」。Java 的 \`module-info.java\` 是另一套 JPMS，**不要**拿来硬套。记住一句话：**这份 JSON 没写 type，Node 当 CJS。**

### ❌ / ✅

\`\`\`ts
// ❌ 本课都是 ESM，于是永远 true —— 缺 type 那条会红
return true;

// ❌ 有 type 字段就 true（"commonjs" 也会中招）
return "type" in pkg;

// ✅ 精确等于
return pkg.type === "module";
\`\`\`

> ✅ **做 \`isModuleType\`**：一行 \`pkg.type === "module"\`。缺字段就是 false，不要抛。

---`,
    ["isModuleType"],
  ),
  sec(
    "sec-9.3",
    "§9.3 `dependencies` 里的版本（对应：`depVersion`）🟡",
    "9.3",
    `运行时 \`import "zod"\` 能成功，是因为 zod 写在 **\`dependencies\`**。版本值是字符串，常常带 \`^\`。

### 对照

\`\`\`xml
<!-- Maven：运行时依赖，没有 test scope -->
<dependency>
  <groupId>com.example</groupId>
  <artifactId>zod-like</artifactId>
  <version>4.4.3</version>
</dependency>
\`\`\`

\`\`\`toml
# Python
dependencies = ["pydantic>=2"]
\`\`\`

\`\`\`ts
function depVersion(pkgJson: string, name: string): string | null {
  const pkg = JSON.parse(pkgJson);
  const v = pkg.dependencies?.[name];
  return typeof v === "string" ? v : null;
}
\`\`\`

两份夹具 **zod 版本故意不同**，专治 \`return "^4.4.3"\`：

| 夹具 | \`depVersion(..., "zod")\` | \`depVersion(..., "react")\` |
|------|----------------------------|------------------------------|
| shop-agent | \`"^3.23.8"\` | \`null\` |
| ts-learn-web | \`"^4.4.3"\` | \`"^18.3.1"\` |

### 不要去 devDependencies 里找 🟡

\`typescript\` 在两份夹具的 \`devDependencies\` 里。\`depVersion(SHOP_PKG, "typescript")\` 必须是 **\`null\`**。运行时根本不 \`import "typescript"\`。

找不到、没有 \`dependencies\` 字段：返回 **\`null\`**，不是 \`""\`，也不要抛（非法 JSON 除外）。

### ❌ / ✅

\`\`\`ts
// ❌ 两个字段都翻一遍 —— typescript 会误报成有版本
return pkg.dependencies?.[name] ?? pkg.devDependencies?.[name] ?? null;

// ❌ 没有就 ""
return pkg.dependencies?.[name] ?? "";

// ✅ 只认 dependencies，缺了给 null
const v = pkg.dependencies?.[name];
return typeof v === "string" ? v : null;
\`\`\`

电商场景：shop-agent 启动前打日志 \`zod@^3.23.8\`，和课程站的 \`^4.4.3\` 不是同一个范围，别混着用同一份排障结论。

> ✅ **做 \`depVersion\`**：只读 \`dependencies[name]\`。

---`,
    ["depVersion"],
  ),
  sec(
    "sec-9.4",
    "§9.4 dependency vs devDependency（对应：`hasDevDep`）🟡",
    "9.4",
    `这是本章最值钱的分界。闪卡也会考。

| | \`dependencies\` | \`devDependencies\` |
|---|---|---|
| 何时用 | **运行时**还要 | 只在开发 / 编译 / 打包 |
| 电商例子 | **zod**（校验下单 JSON）、uuid（订单号） | **typescript**（\`tsc\`）、vite（课程站 dev server） |
| 会不会进生产包 | 通常会（bundler 按 import 图来） | 通常不会 |
| 对标 | Maven compile、Python \`dependencies\` | Maven test、Python dev group |

\`\`\`ts
function hasDevDep(pkgJson: string, name: string): boolean {
  const pkg = JSON.parse(pkgJson);
  return Object.keys(pkg.devDependencies ?? {}).includes(name);
}

hasDevDep(SHOP_PKG, "typescript");  // true
hasDevDep(SITE_PKG, "vite");        // true
hasDevDep(SITE_PKG, "react");       // false  ← react 在 dependencies
hasDevDep(SHOP_PKG, "zod");         // false
hasDevDep(SHOP_PKG, "react");       // false  ← 两边都没有
\`\`\`

> 🤯 **转换点**：有人把 typescript 写进 \`dependencies\` 也能 \`tsc\`，但语义错了——你在告诉「生产运行时需要 tsc」。本题有一份 \`oops-shop\` 夹具：typescript 只在 \`dependencies\` 里，\`hasDevDep\` 必须 **false**。

缺 \`devDependencies\` 字段：当 \`{}\`，返回 false，不要抛。

### ❌ / ✅

\`\`\`ts
// ❌ 在 dependencies 里找到也算 true
return name in (pkg.dependencies ?? {}) || name in (pkg.devDependencies ?? {});

// ❌ 把版本字符串当布尔：没这个键时 undefined 还好，空串会假
return !!pkg.devDependencies?.[name];

// ✅ 只问 devDependencies 有没有这个键
return Object.keys(pkg.devDependencies ?? {}).includes(name);
\`\`\`

> ✅ **做 \`hasDevDep\`**：只认 \`devDependencies\` 的键。

---`,
    ["hasDevDep"],
  ),
  sec(
    "sec-9.5",
    "§9.5 `scripts`（对应：`scriptCommand`）🟡",
    "9.5",
    `\`scripts\` 是一张「外号 → 命令」表。\`bun run dev\` / \`npm run dev\` 其实是去跑 \`scripts.dev\` 那串字符。

### 对照

| | 启动开发 |
|---|---|
| Java | \`mvn spring-boot:run\`（插件目标，不在 pom 里写成 scripts 表） |
| Python | \`uv run uvicorn ...\` 或 \`[project.scripts]\` |
| 本课 | \`package.json\` → \`scripts.dev\` |

shop-agent 夹具：

\`\`\`json
"scripts": {
  "dev": "bun run src/index.ts",
  "test": "bun test"
}
\`\`\`

课程站夹具（形状像本课仓库，但**不是**读活文件）：

\`\`\`json
"scripts": {
  "dev": "vite",
  "build": "vite build",
  "preview": "vite preview"
}
\`\`\`

\`\`\`ts
function scriptCommand(pkgJson: string, script: string): string | null {
  const pkg = JSON.parse(pkgJson);
  const cmd = pkg.scripts?.[script];
  return typeof cmd === "string" ? cmd : null;
}

scriptCommand(SHOP_PKG, "dev");    // "bun run src/index.ts"
scriptCommand(SITE_PKG, "dev");    // "vite"
scriptCommand(SITE_PKG, "build");  // "vite build"
scriptCommand(SHOP_PKG, "start");  // null
\`\`\`

作业**只返回字符串**，不要 \`exec\`、不要真开服务。

> ✅ **做 \`scriptCommand\`**：\`scripts[script]\`，缺了 \`null\`。

---`,
    ["scriptCommand"],
  ),
  sec(
    "sec-9.6",
    "§9.6 收集 runtime 包名（对应：`collectDepNames`）🟡",
    "9.6",
    `安全审计 / 许可证扫描：先列出 **会进运行时的包名**。\`typescript\` 不在这份名单里。

\`\`\`ts
function collectDepNames(pkgJson: string): string[] {
  const pkg = JSON.parse(pkgJson);
  return Object.keys(pkg.dependencies ?? {}).sort();
}
\`\`\`

**必须 \`sort()\`。** JSON 对象的键顺序是插入序，测试夹具故意把 \`zod\` 写在 \`uuid\` / \`react\` 前面，不排序就会红。

\`\`\`ts
collectDepNames(SHOP_PKG);
// 插入序是 zod, uuid → 排序后 ["uuid", "zod"]

collectDepNames(SITE_PKG);
// ["react", "zod"]

collectDepNames('{"name":"empty-shop","dependencies":{}}');  // []
collectDepNames('{"name":"nodeps-shop"}');                   // []
\`\`\`

缺字段用 \`?? {}\`，得到 \`[]\`，不要抛。

### ❌ / ✅

\`\`\`ts
// ❌ 合并 devDependencies —— typescript 会混进来
return Object.keys({ ...pkg.dependencies, ...pkg.devDependencies }).sort();

// ❌ 不 sort，第二份乱序夹具会红
return Object.keys(pkg.dependencies ?? {});

// ✅
return Object.keys(pkg.dependencies ?? {}).sort();
\`\`\`

> ✅ **做 \`collectDepNames\`**：只要 \`dependencies\` 的键，字典序。

---`,
    ["collectDepNames"],
  ),
  sec(
    "sec-9.7",
    "§9.7 semver 的 \`^\`（对应：`assertCaretRange`）🟡",
    "9.7",
    `\`package.json\` 里很少写死 \`"4.4.3"\`，更常见 \`"^4.4.3"\`。

### \`^\` 是兼容范围，不是钉死 🟡

对 \`≥1.0.0\` 的版本，\`^4.4.3\` 大致表示：**允许 4.x 的补丁和小版本，不允许 5.0.0**（主版本变了，按 semver 可能不兼容）。装包工具会在范围内挑一个，写进锁文件。

| 写法 | 含义（本题要记住的） | \`assertCaretRange\` |
|------|----------------------|----------------------|
| \`^4.4.3\` | caret，兼容范围 | **true** |
| \`^0.1.0\` | 也是 caret（0.x 规则更严，本题不挖） | **true** |
| \`4.4.3\` | 钉死这一格 | false |
| \`~1.0.0\` | tilde，另一套范围 | false |
| \`""\` | 空 | false |

本题**不解析**完整 semver，只问：字符串是否以 \`^\` 开头。

\`\`\`ts
function assertCaretRange(version: string): boolean {
  return version.startsWith("^");
}

assertCaretRange("^4.4.3");  // true
assertCaretRange("^0.1.0");  // true
assertCaretRange("4.4.3");   // false
assertCaretRange("~1.0.0");  // false
assertCaretRange("");        // false
\`\`\`

真实排障会先 \`depVersion(pkg, "zod")\` 拿到 \`"^3.23.8"\`，再交给本题。**作业测试是交错式**：本题不要调用 \`depVersion\`，那题可能还是 TODO。直接吃版本字符串。

### ❌ / ✅

\`\`\`ts
// ❌ 当成「包含数字 4.4.3」
return version.includes("4.4.3");

// ❌ 把 ~ 也算进去
return version.startsWith("^") || version.startsWith("~");

// ✅
return version.startsWith("^");
\`\`\`

> ✅ **做 \`assertCaretRange\`**：一行 \`startsWith("^")\`。空串自然是 false。

---`,
    ["assertCaretRange"],
  ),
  sec(
    "sec-bun",
    "§9.8 本课怎么用 Bun（不考装包，不考发布）",
    "9.8",
    `Ch01 摸过 \`bun xxx.ts\`。本章补上「包」这一侧，仍然**不要求你在作业里装任何东西**。

\`\`\`bash
bun run src/index.ts    # 直接跑 TS（shop-agent 的 scripts.dev）
bun test                # 测试
# bun add zod           # 真实项目才写；本章作业禁止
\`\`\`

| 一句话 | |
|---|---|
| Bun vs npm | Bun 是运行时兼包管理；npm 主要是包管理。本课统一 Bun，不 bikeshed pnpm。 |
| 和 uv | \`bun add\` ≈ \`uv add\`：改清单 + 装进项目隔离目录。 |
| 和 Maven | \`package.json\` ≈ \`pom.xml\`；\`node_modules\` ≠ \`~/.m2\` 那种全局本地仓库。 |

**不讲**：容器镜像、持续集成缓存、把包装上公共 registry。那是运维 / 发布，不是本章。

---`,
    [],
  ),
  sec(
    "sec-pits",
    "§9.9 Java / Python 老手几个坑 ⚠️",
    "9.9",
    `1. **\`type\` 缺省不是 ESM。** 没写就当 CJS，\`isModuleType\` 是 false。
2. **\`^\` 不是钉死。** \`"4.4.3"\` 才是 pin；\`~1.0.0\` 也不是 caret。
3. **typescript 进 devDependencies。** 用 \`depVersion\` 查 typescript 应得 \`null\`。
4. **不要 \`npm install -g\` 当默认。** 项目本地 \`node_modules\`，对标 \`.venv\` 不是全局 JVM。
5. **非法 JSON 不要吞。** \`JSON.parse\` 抛出来；只有缺 \`name\` 才 \`NO_NAME\`。
6. **找不到用 \`null\`。** 脚本、依赖版本都是 \`string | null\`，别 \`""\`。
7. **\`collectDepNames\` 要 sort。** 插入序不是字典序。
8. **作业不装包。** 看到 \`bun add\` 只是真实项目对照，测试夹具是字符串。
9. **\`node_modules\` 不是 \`~/.m2\`。** Maven 有本机仓库；npm 把树拷进项目。

---`,
    [],
  ),
  sec(
    "sec-homework",
    "📝 本章作业",
    null,
    `上面 7 个函数按节交错出现。每个注释里有【场景】【转换点】、示例和提示。

**完成方式**：在编辑器里改 \`throw new Error("TODO")\`，点「▶ 运行测试」。全绿 = 这题过了。

卡住就回对应 §：\`readPkgName\` → §9.1，\`isModuleType\` → §9.2，\`hasDevDep\` → §9.4，\`assertCaretRange\` → §9.7。

共享夹具：电商 \`"shop-agent"\` + 课程站 \`"ts-learn-web"\`。第二份就是来抓硬编码的。

---`,
    [],
  ),
  sec(
    "sec-check",
    "✅ 自测：你真的掌握了吗？",
    null,
    `- [ ] 能指着 \`package.json\` 说出对标 \`pom.xml\` / \`pyproject.toml\`
- [ ] 能分清 zod（runtime）和 typescript（dev）
- [ ] 知道缺 \`type\` 在 Node 里当 CJS，本题返回 false
- [ ] 知道 \`^\` 是兼容范围，\`~\` / 钉死都不是
- [ ] 能解释为什么会有 \`node_modules\`（项目隔离，不是 Maven 全局缓存那种用法）
- [ ] 能用一句话说清本课为什么用 Bun
- [ ] 7 个作业全绿（解析字符串，没真装包）

---`,
    [],
  ),
  sec(
    "sec-feynman",
    "🎓 费曼挑战",
    null,
    `用大白话讲给「Java 同事」听。讲不清 = 还没真懂。

任选一题（1–2 分钟）：

1. 「zod 为什么进 dependencies，typescript 为什么进 devDependencies？我把 tsc 也写进 dependencies 会怎样？」— 卡壳重读 §9.3 + §9.4
2. 「\`^4.4.3\` 是不是就是 4.4.3？\`~\` 呢？」— 卡壳重读 §9.7
3. 「为什么 Node 项目有 \`node_modules\`，Maven 却主要靠 \`~/.m2\`？那我 \`npm install -g\` 当默认，错在哪？」— 卡壳重读世界地图 + §9.8
4. 「不写 \`"type":"module"\` 会怎样？和 Python 的 import 能类比吗？」— 卡壳重读 §9.2

---`,
    [],
  ),
  sec(
    "sec-next",
    "⏭️ 下一步",
    null,
    `Ch09 掌握后，进 **Ch10 · tsconfig 与声明文件**。你会读精简的 \`tsconfig.json\`（\`strict\` / \`noImplicitAny\`），并给一段无类型 JS API 写 \`.d.ts\` 声明字符串。本章的 \`JSON.parse\` 清单手感会原样用上；不要提前挖 project references。`,
    [],
  ),
];

const tutorialMd = `# Ch09 · 包与运行时

${sections
  .map((s) => (s.heading ? `## ${s.heading}\n\n${s.body}` : s.body))
  .join("\n\n")}
`;

const reviewMd = `# Ch09 · 记忆闪卡

> 先回忆，再翻答案。连续 2 次秒答 → 退役。

## 🔖 闪卡

| # | 正面（问题） | 背面（答案） | 掌握 |
|---|---|---|---|
| 1 | \`package.json\` 对标 Java / Python 的哪份文件？ | Maven \`pom.xml\`；Python \`pyproject.toml\`。清单：名字、依赖、脚本 | ⬜ |
| 2 | zod 和 typescript 分别该进哪个字段？为什么？ | zod 是 **runtime** → \`dependencies\`；typescript 只在编译 → \`devDependencies\` | ⬜ |
| 3 | \`depVersion\` 为什么查不到 typescript？ | 它只看 \`dependencies\`。tsc 不进运行时，即使 dev 里有也返回 null | ⬜ |
| 4 | \`"zod": "^4.4.3"\` 的 \`^\` 是钉死 4.4.3 吗？ | 不是。\`^\` 是**兼容范围**（4.x，不跨 5）。钉死才写 \`"4.4.3"\`。这是本章 🟡 | ⬜ |
| 5 | \`"~1.0.0"\` 算 caret 吗？空串呢？ | 都不算。\`~\` 是 tilde；本题只认 \`startsWith("^")\` | ⬜ |
| 6 | 不写 \`"type":"module"\`，Node 把 \`.js\` 当什么？本题返回？ | 当 **CJS**（\`require\`）。\`isModuleType\` → **false**。\`commonjs\` 也是 false。这是本章 🔴 | ⬜ |
| 7 | Bun vs npm，本课用哪句？ | **Bun = 运行时 + 包管理 + 测试**。本课统一 Bun，不纠结 npm / pnpm | ⬜ |
| 8 | 为什么会有 \`node_modules\`？和 \`~/.m2\` 一样吗？ | 按**项目**把包装进目录，\`import\` 从这棵树解析。Maven 本地仓库是本机共享缓存，不是「每个工程一份完整树」 | ⬜ |
| 9 | \`npm install -g\` 当默认心智，错在哪？ | 全局一份，像共用 JVM。应对标项目本地（\`.venv\` / \`node_modules\`） | ⬜ |
| 10 | 非法 JSON 和缺 \`name\` 分别怎么处理？ | 非法：让 \`JSON.parse\` 抛。缺 name：\`throw new Error("NO_NAME")\` | ⬜ |
| 11 | 找不到的依赖版本 / 脚本返回什么？ | **\`null\`**，不是 \`""\` | ⬜ |
| 12 | \`collectDepNames\` 为什么要 \`sort\`？包不包括 typescript？ | JSON 键是插入序，测试要对稳定数组。只收集 \`dependencies\`，不含 dev | ⬜ |
| 13 | 本章作业为什么不许 \`bun add\`？ | 目标是会**读**清单。测试夹具是字符串；真装包留给你自己的项目 | ⬜ |

## 🎓 费曼自检

- [ ] 能说清 dep vs devDep（zod runtime vs typescript 编译）
- [ ] 能说清 \`^\` 不是 pin
- [ ] 能用一句话说清 Bun，以及 \`type:module\` / \`node_modules\`
`;

const chapter = {
  id: "ch09",
  num: "09",
  title: "包与运行时",
  runMode: "browser",
  tutorialMd,
  assignment,
  testName: "ch09_assignment",
  testSource,
  reviewMd,
  interleaved: true,
  sections,
  functions,
  preamble,
};

const out = join(dirname(fileURLToPath(import.meta.url)), "../src/content/chapters/ch09.json");
mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, JSON.stringify(chapter, null, 2) + "\n");
console.log("wrote", out);
