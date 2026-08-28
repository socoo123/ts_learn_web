/**
 * 生成 src/content/chapters/ch25.json 与 local/m5/ch25/
 * 运行：bun scripts/gen-ch25.ts
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const preamble = `/**
 * Ch25 作业：商品助手会话的配置对象（不打网、不装包）。
 *
 * 场景：用 createAgentSession 包一层商店会话。CLI \`pi\` 和 SDK
 * 是同一套 harness。作业只测配置 / 日志 / dispose / steer 替换。
 * 没有供应商 Key 也能全绿。真跑见 local/m5/ch25/demo.ts。
 *
 * 全绿 = 你掌握了 Ch25。本地：bun test local/m5/ch25
 */

export type MemoryKind = "inMemory" | "file";

export type ShopSessionConfig = {
  systemPrompt: string;
  tools: string[];
  memory: MemoryKind;
  hasKey: boolean;
};

export type ShopSession = {
  config: ShopSessionConfig;
  disposed: boolean;
  logs: string[];
};

export const SHOP_SYSTEM_PROMPT =
  "你是商品助手。只用 lookupProduct 和 calcLineTotal。禁止 bash 和写文件。";`;

const functions = [
  {
    name: "sessionConfig",
    testSuite: "sessionConfig",
    skeleton: `/**
 * 【场景】开一个商品助手会话前，先写死系统提示和工具白名单。
 * 机械键盘库存问答只许 lookupProduct / calcLineTotal，不要默认 bash。
 *
 * 【转换点】返回配置对象，不是真去 import createAgentSession。
 * hasKey 原样放进对象。memory 作业里永远 "inMemory"（测试不落盘）。
 *
 * 任务：精确返回
 *   { systemPrompt: SHOP_SYSTEM_PROMPT, tools: ["lookupProduct","calcLineTotal"], memory: "inMemory", hasKey }
 * 示例：
 *   sessionConfig(false).hasKey → false；tools 恰好那两个、这个顺序
 *   sessionConfig(true).hasKey → true；systemPrompt 是 SHOP_SYSTEM_PROMPT
 *   tools 里不能出现 bash / write / edit
 *
 * 提示：用常量 SHOP_SYSTEM_PROMPT，不要自己再抄一遍不同的句子。
 */
export function sessionConfig(hasKey: boolean): ShopSessionConfig {
  throw new Error("TODO");
}`,
  },
  {
    name: "pickMemoryManager",
    testSuite: "pickMemoryManager",
    skeleton: `/**
 * 【场景】SessionManager 有两种：内存会话 vs 按 cwd 落盘。
 * 作业测试永远走内存；file 只是让你能「点名」那个工厂。
 *
 * 【转换点】返回**工厂调用的文本**，不是真的 SessionManager。
 * inMemory 带括号（无参）。file 的 create 还要 cwd，所以**不要**括号。
 *
 * 任务：
 *   "inMemory" → "SessionManager.inMemory()"
 *   "file" → "SessionManager.create"
 * 示例：
 *   pickMemoryManager("inMemory") → "SessionManager.inMemory()"
 *   pickMemoryManager("file") → "SessionManager.create"
 *
 * 提示：精确字符串。不要返回 "SessionManager.inMemory"（缺括号）或 "SessionManager.create()"。
 */
export function pickMemoryManager(kind: MemoryKind): string {
  throw new Error("TODO");
}`,
  },
  {
    name: "createShopSession",
    testSuite: "createShopSession",
    skeleton: `/**
 * 【场景】对应 SDK 的 createAgentSession：得到一个还没 dispose 的会话。
 * 无 Key 时也要能造出对象，只是真 prompt 不会去打网。
 *
 * 【转换点】**必须调用** sessionConfig(hasKey)。disposed 起手 false，logs 起手 []。
 *
 * 任务：返回 { config: sessionConfig(hasKey), disposed: false, logs: [] }
 * 示例：
 *   createShopSession(false).config.hasKey → false，disposed false，logs []
 *   createShopSession(true).config.tools → ["lookupProduct","calcLineTotal"]
 *   createShopSession(false).config.systemPrompt → SHOP_SYSTEM_PROMPT
 *
 * 提示：不要手写一份和 sessionConfig 重复的对象字面量。
 */
export function createShopSession(hasKey: boolean): ShopSession {
  throw new Error("TODO");
}`,
  },
  {
    name: "subscribeToLog",
    testSuite: "subscribeToLog",
    skeleton: `/**
 * 【场景】session.subscribe 把事件记进日志。用户问机械键盘，再 steer 改口。
 * 无线鼠标那条也要能记，别只硬编码「机械键盘」。
 *
 * 【转换点】不可变：禁止改传入的 session / logs。
 * 已 dispose → 不追加，仍返回**新对象**（disposed 保持 true，logs 用 slice 拷贝）。
 * 未 dispose → logs 为 [...旧, line]。空字符串 "" 也要追加。
 *
 * 任务：返回新的 ShopSession。
 * 示例：
 *   新 session + "prompt:机械键盘" → logs ["prompt:机械键盘"]
 *   再订 "steer:只报库存" → ["prompt:机械键盘","steer:只报库存"]
 *   dispose 后再订 "late" → logs 不变，disposed 仍 true
 *
 * 提示：spread / slice。不要 session.logs.push。
 */
export function subscribeToLog(session: ShopSession, line: string): ShopSession {
  throw new Error("TODO");
}`,
  },
  {
    name: "disposeSafe",
    testSuite: "disposeSafe",
    skeleton: `/**
 * 【场景】对照 Java try-with-resources / Python with：用完要关。
 * 作业没有真资源，只把 disposed 翻成 true。
 *
 * 【转换点】永远返回新对象 { config: session.config, disposed: true, logs: session.logs.slice() }。
 * 已经 disposed 再调：仍是新对象，disposed true，logs 内容相同。禁止 mutate 输入。
 *
 * 任务：安全关掉会话旗标。
 * 示例：
 *   新 session → disposed true，logs []
 *   先订过两条 log 再 dispose → 旗标 true，两条 log 还在（拷贝）
 *   dispose 两次 → 两次都是新对象，都是 disposed true
 *
 * 提示：slice 拷贝 logs。config 沿用原引用即可。
 */
export function disposeSafe(session: ShopSession): ShopSession {
  throw new Error("TODO");
}`,
  },
  {
    name: "steerNote",
    testSuite: "steerNote",
    skeleton: `/**
 * 【场景】流式/跑工具时插入 steer。当前草稿可能是「KB-001 库」，
 * 用户改口「只报库存 120」。不是把字符串拼到草稿后面。
 *
 * 【转换点】steer 语义：整段**替换**未完成草稿。
 * steerText.trim() === "" → 返回 currentDraft 原样（不 trim draft）。
 * 否则返回 steerText **原样**（只是用 trim 判断空，不 trim 返回值）。
 *
 * 任务：返回下一份助手草稿。
 * 示例：
 *   "KB-001 库" + "只报库存 120" → "只报库存 120"
 *   "无线鼠标还" + "改口报 MS-002" → "改口报 MS-002"
 *   "KB-001 库" + "   " 或 "" → "KB-001 库"
 *
 * 提示：不要 currentDraft + steerText。不要 trim 返回值。
 */
export function steerNote(currentDraft: string, steerText: string): string {
  throw new Error("TODO");
}`,
  },
];

const assignment = `${preamble}

${functions.map((f) => f.skeleton).join("\n\n")}
`;

const testSource = `describe("sessionConfig", () => {
  it("hasKey false：内存、白名单工具、系统提示", () => {
    const cfg = sessionConfig(false);
    expect(cfg.hasKey).toBe(false);
    expect(cfg.memory).toBe("inMemory");
    expect(cfg.systemPrompt).toBe(SHOP_SYSTEM_PROMPT);
    expect(cfg.tools).toEqual(["lookupProduct", "calcLineTotal"]);
  });
  it("hasKey true 原样；tools 不含 bash/write/edit", () => {
    const cfg = sessionConfig(true);
    expect(cfg.hasKey).toBe(true);
    expect(cfg.memory).toBe("inMemory");
    expect(cfg.tools).toEqual(["lookupProduct", "calcLineTotal"]);
    expect(cfg.tools.includes("bash")).toBe(false);
    expect(cfg.tools.includes("write")).toBe(false);
    expect(cfg.tools.includes("edit")).toBe(false);
  });
  it("两次调用都是 inMemory（作业不落盘）", () => {
    expect(sessionConfig(false).memory).toBe("inMemory");
    expect(sessionConfig(true).memory).toBe("inMemory");
  });
});

describe("pickMemoryManager", () => {
  it("inMemory 带括号", () => {
    expect(pickMemoryManager("inMemory")).toBe("SessionManager.inMemory()");
  });
  it("file 是 create、不要括号", () => {
    expect(pickMemoryManager("file")).toBe("SessionManager.create");
  });
  it("两种都不是空串", () => {
    expect(pickMemoryManager("inMemory") === "").toBe(false);
    expect(pickMemoryManager("file") === "").toBe(false);
  });
});

describe("createShopSession", () => {
  it("无 Key：hasKey false，disposed false，logs 空", () => {
    const s = createShopSession(false);
    expect(s.config.hasKey).toBe(false);
    expect(s.disposed).toBe(false);
    expect(s.logs).toEqual([]);
    expect(s.logs[0] ?? null).toBeNull();
  });
  it("有 Key：tools 白名单；systemPrompt 是常量", () => {
    const s = createShopSession(true);
    expect(s.config.hasKey).toBe(true);
    expect(s.config.tools).toEqual(["lookupProduct", "calcLineTotal"]);
    expect(s.config.systemPrompt).toBe(SHOP_SYSTEM_PROMPT);
    expect(s.config.memory).toBe("inMemory");
    expect(s.disposed).toBe(false);
  });
  it("config 来自 sessionConfig；无 bash", () => {
    const s = createShopSession(false);
    expect(s.config).toEqual(sessionConfig(false));
    expect(s.config.tools.includes("bash")).toBe(false);
  });
});

describe("subscribeToLog", () => {
  it("新 session 记机械键盘 prompt", () => {
    const s0 = createShopSession(false);
    Object.freeze(s0);
    Object.freeze(s0.logs);
    Object.freeze(s0.config);
    const s1 = subscribeToLog(s0, "prompt:机械键盘");
    expect(s1.logs).toEqual(["prompt:机械键盘"]);
    expect(s1.disposed).toBe(false);
    expect(s0.logs).toEqual([]);
  });
  it("再订 steer；无线鼠标防硬编码", () => {
    const s1 = subscribeToLog(createShopSession(false), "prompt:机械键盘");
    const s2 = subscribeToLog(s1, "steer:只报库存");
    expect(s2.logs).toEqual(["prompt:机械键盘", "steer:只报库存"]);
    const mouse = subscribeToLog(createShopSession(true), "prompt:无线鼠标");
    expect(mouse.logs).toEqual(["prompt:无线鼠标"]);
    expect(mouse.config.hasKey).toBe(true);
  });
  it("空 line 也追加；dispose 后不再追加", () => {
    const empty = subscribeToLog(createShopSession(false), "");
    expect(empty.logs).toEqual([""]);
    const open = subscribeToLog(createShopSession(false), "prompt:机械键盘");
    const dead = disposeSafe(open);
    Object.freeze(dead);
    Object.freeze(dead.logs);
    const late = subscribeToLog(dead, "late");
    expect(late.disposed).toBe(true);
    expect(late.logs).toEqual(["prompt:机械键盘"]);
    expect(dead.logs).toEqual(["prompt:机械键盘"]);
  });
  it("不 mutate 传入 session（freeze）", () => {
    const s0 = createShopSession(false);
    Object.freeze(s0);
    Object.freeze(s0.logs);
    subscribeToLog(s0, "prompt:MS-002");
    expect(s0.logs.length).toBe(0);
    expect(s0.disposed).toBe(false);
  });
});

describe("disposeSafe", () => {
  it("新 session dispose → 旗标 true，logs 空拷贝", () => {
    const s0 = createShopSession(false);
    Object.freeze(s0);
    Object.freeze(s0.logs);
    const d = disposeSafe(s0);
    expect(d.disposed).toBe(true);
    expect(d.logs).toEqual([]);
    expect(s0.disposed).toBe(false);
    expect(d.config).toEqual(s0.config);
  });
  it("带 log 再 dispose；再调仍是新对象", () => {
    const logged = subscribeToLog(createShopSession(true), "prompt:无线鼠标");
    const d1 = disposeSafe(logged);
    expect(d1.disposed).toBe(true);
    expect(d1.logs).toEqual(["prompt:无线鼠标"]);
    Object.freeze(d1);
    Object.freeze(d1.logs);
    const d2 = disposeSafe(d1);
    expect(d2.disposed).toBe(true);
    expect(d2.logs).toEqual(["prompt:无线鼠标"]);
    expect(d1 === d2).toBe(false);
  });
  it("不 mutate 输入；返回 logs 是拷贝", () => {
    const s0 = subscribeToLog(createShopSession(false), "prompt:机械键盘");
    Object.freeze(s0);
    Object.freeze(s0.logs);
    const d = disposeSafe(s0);
    d.logs.push("mutated");
    expect(s0.logs).toEqual(["prompt:机械键盘"]);
    expect(s0.disposed).toBe(false);
  });
});

describe("steerNote", () => {
  it("替换键盘草稿，不是拼接", () => {
    expect(steerNote("KB-001 库", "只报库存 120")).toBe("只报库存 120");
    expect(steerNote("KB-001 库", "只报库存 120") === "KB-001 库只报库存 120").toBe(false);
  });
  it("无线鼠标 / MS-002 防硬编码", () => {
    expect(steerNote("无线鼠标还", "改口报 MS-002")).toBe("改口报 MS-002");
  });
  it("空白或空 steer 保留草稿原样", () => {
    expect(steerNote("KB-001 库", "   ")).toBe("KB-001 库");
    expect(steerNote("KB-001 库", "")).toBe("KB-001 库");
    expect(steerNote("KB-001 库  ", "")).toBe("KB-001 库  ");
  });
  it("非空 steer 原样返回（不 trim 两端）", () => {
    expect(steerNote("KB-001 库", "  改口")).toBe("  改口");
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
    `> **预计**：1 天 ｜ **前置**：Ch24（自定义 Tool 与事件）
> **目标**：① \`createAgentSession\` + \`SessionManager.inMemory()\`；② 分清 \`prompt\` / \`steer\`；③ 知道 CLI \`pi\` 和 SDK 是**同一套** harness；④ 无 Key 时测配置对象，不打网。
> 你 15 年 Java：会话有 scope，\`try-with-resources\` 结束会 \`close\`。Python：\`with\` 上下文管理器。本章把这套心智接到 Pi 的 session。

> 📐 **本教程的契约**：下面每一节（§25.1–§25.6）都**精确对应**作业里的题。讲过的才考，考的必讲过。卡住时按作业函数名回查对应小节。
> **不讲**：Hono + SSE 接线（Ch26）、不重复 RAG、不把 M6 扩展四件套（Extension / Skill / Template / Package）当作业。作业禁止默认 bash、禁止任意写文件。JSON 作业是纯函数：配置进、对象出。

---`,
    [],
  ),
  sec(
    "sec-map",
    "🗺️ 本章地图",
    null,
    `本章主线：**商品助手**怎么被 SDK 包成一次会话。用户问「机械键盘还有货吗」，会话只带 \`lookupProduct\` 和 \`calcLineTotal\`。跑着的时候可以 \`steer\` 改口「只报 SKU 和库存数字」。用完 \`dispose\`。

读完这章 + 完成作业，你将能够：

- 写出商店会话的配置（系统提示 + 工具白名单 + 内存 + 有没有 Key）
- 分清 \`SessionManager.inMemory()\` 和 \`SessionManager.create(cwd)\`
- 用 \`createShopSession\` 包出还没关掉的会话（必须调用 \`sessionConfig\`）
- 不可变地追加 subscribe 日志；dispose 之后不再记
- 安全地把 disposed 翻成 true（对照 try-with-resources）
- 用 \`steerNote\` 演示：steer 是**整段替换**草稿，不是字符串拼接

**作业 ↔ 教程对应表**（学哪节，就去做哪题）：

| 作业题 | 对应小节 | 核心知识点 |
|--------|----------|-----------|
| \`sessionConfig\` | §25.1 | 系统提示 + 工具白名单 + inMemory + hasKey |
| \`pickMemoryManager\` | §25.2 | inMemory() vs create（无括号） |
| \`createShopSession\` | §25.3 | 调用 sessionConfig，起手未 dispose |
| \`subscribeToLog\` | §25.4 | 不可变追加；dispose 后不加 |
| \`disposeSafe\` | §25.5 | 新对象翻旗，对照 close / with |
| \`steerNote\` | §25.6 | steer 替换草稿，不是拼接 |

本地文件：\`local/m5/ch25/assignment.ts\`（改 TODO）、\`app.ts\`（假无 Key 运行时，不联网）、\`assignment.test.ts\`、\`demo.ts\`（真 \`createAgentSession\` 复制区，测试不要 import 它）。

跑测试：\`bun test local/m5/ch25\`。

---`,
    [],
  ),
  sec(
    "sec-path",
    "⏱️ 学习路径：费曼五步（约 50–70 分钟）",
    null,
    `| 步 | 你要做 | 在哪做 |
|----|--------|--------|
| ① 预览猜（2 分钟） | 猜 prompt 和 steer 差在哪、没有 Key 测试怎么绿 | 本页 ① |
| ② 先动手 | 打开 \`local/m5/ch25/assignment.ts\` 改 TODO | 仓库 local/ |
| ③ 提取+反馈 | \`bun test local/m5/ch25\` 看红绿 | 终端 |
| ④ 费曼（2 分钟） | 大白话讲清「steer 为什么不是 +=」 | 本页 ④ |
| ⑤ 存闪卡 | 章末闪卡标复习日期 | 闪卡 |

> 💡 网页这一章是只读的。不要在浏览器里改代码。没有 API Key 作业也能绿——测的是配置对象。真打模型见 \`demo.ts\`（要 Key，本课测试不跑它）。
> \`createShopSession\` **必须调用** \`sessionConfig\`。\`steerNote\` 用 trim 判断空，但返回值不 trim。

---`,
    [],
  ),
  sec(
    "sec-guess",
    "① 预览猜（2 分钟 · 激活你的 Java / Python 直觉）",
    null,
    `先别看答案，凭经验猜一猜（猜错没关系）：

1. Java 里 \`try (Session s = open())\` 结束会怎样？Pi 的 \`session.dispose()\` 对应哪一步？Python 的 \`with\` 呢？
2. \`SessionManager.inMemory()\` 会不会在磁盘留下会话文件？要落盘该调哪个？
3. 流式输出到一半，用户说「改口只报库存」。该把新句子 **拼到** 当前草稿后面，还是 **整段换成** 新指令？
4. 本机没有供应商 Key，\`bun test local/m5/ch25\` 还能绿吗？测试可以 \`import "@earendil-works/pi-coding-agent"\` 吗？
5. 商品助手如果默认带上 bash 工具，模型会不会把库存表 \`rm\` 掉？白名单该留哪两个？
6. CLI 敲 \`pi\` 和代码里 \`createAgentSession\` 是两套循环，还是同一套 harness？

> 猜完，带着验证心态进入正文。第 3、4、5 题是本章的 🔴。

---`,
    [],
  ),
  sec(
    "sec-world",
    "createAgentSession：CLI 与 SDK 同一套 🔴",
    null,
    `M5 的商品助手已经会调模型（Ch22）、会跑最小 Agent + Tool（Ch23）、会看事件和拦危险工具（Ch24）。本章把这些收进 **一次会话**：

包名是 \`@earendil-works/pi-coding-agent\`（CLI 与 SDK 同一套 harness，不要用过时的 \`@mariozechner/*\`）。文档：https://pi.dev/docs/latest/sdk

**\`prompt\`** = 用户发一轮，等到这轮结束（含工具调用）。  
**\`steer\`** = 流式 / 正在跑工具时插入新指令；等**当前工具结束**再生效。它**不是**把字符串拼到当前草稿后面。  
**\`SessionManager.inMemory()\`** = 无文件。\`SessionManager.create(cwd)\` 才落盘。  
**无 Key**：作业测纯配置；\`demo.ts\` 才是真跑（要 Key）。测试禁止 import 真包，禁止联网。

| | Java | Python | 本章 Pi |
|---|---|---|---|
| 开会话 | \`try (Session s = Session.open())\` 会话 scope | \`with Session() as s:\` | \`createAgentSession({ sessionManager, tools, customTools })\` |
| 用户一轮 | 方法调用，阻塞到返回 | 同左 | \`await session.prompt("机械键盘还有货吗")\` |
| 中途改口 | 没有标准 API，常自己取消再发 | 同左 | \`await session.steer("改口只报 SKU 和库存数字")\` |
| 关会话 | \`close()\` / try-with-resources | \`__exit__\` / context manager | \`session.dispose()\` |
| 日志 | listener / observer | callback | \`session.subscribe((event) => { ... })\` |

### Java：会话 scope + try-with-resources

\`\`\`java
public class ShopSession implements AutoCloseable {
    public void prompt(String userTurn) { /* 等到本轮结束 */ }
    public void steer(String instruction) { /* 等当前工具结束，再换指令 */ }
    @Override public void close() { /* 释放；对应 dispose */ }
}

try (ShopSession session = new ShopSession()) {
    session.prompt("机械键盘还有货吗");
    session.steer("改口只报 SKU 和库存数字");
} // close() == dispose
\`\`\`

Java 老手熟悉「离开 try 块一定关」。Pi 的 \`dispose\` 就是这件事。作业没有真句柄，只翻 \`disposed\` 旗。

### Python：context manager

\`\`\`python
class ShopSession:
    def __enter__(self):
        return self
    def __exit__(self, exc_type, exc, tb):
        self.dispose()
    def prompt(self, text): ...
    def steer(self, text): ...

with ShopSession() as session:
    session.prompt("机械键盘还有货吗")
    session.steer("改口只报 SKU 和库存数字")
\`\`\`

\`with\` 结束走 \`__exit__\`。不要把会话当成永远活着的全局单例。

### TypeScript：真 API（复制区；作业不要 import）

真跑需要装包和供应商 Key。**作业和 \`bun test\` 禁止联网、禁止装这个包**——测配置对象。真示例在 \`local/m5/ch25/demo.ts\`（字符串里，测试不要 import）。**无 Key 不要跑这段。**

\`\`\`ts
import { createAgentSession, SessionManager } from "@earendil-works/pi-coding-agent";

const { session } = await createAgentSession({
  sessionManager: SessionManager.inMemory(),
  // 可选：modelRuntime: await ModelRuntime.create(),
  tools: ["lookupProduct", "calcLineTotal"], // 课程只允许商品工具；不要默认 bash
  customTools: [lookupProduct, calcLineTotal],
});

await session.prompt("机械键盘还有货吗");
await session.steer("改口只报 SKU 和库存数字"); // 运行中插入，等当前工具结束再生效
session.subscribe((event) => { /* 日志 */ });
session.dispose();
\`\`\`

CLI 敲 \`pi\` 走的是**同一套** session 循环、同一套 \`SessionManager\`、同一套工具白名单。不要为 CLI 再写一个 Agent。SDK 只是把那套循环嵌进你的进程。

作业里的 \`ShopSession\` 是**教学用精简版**：

- \`config\`：系统提示、工具名、内存、有没有 Key
- \`logs\`：subscribe 记下来的行（纯字符串）
- \`disposed\`：关没关
- 不接 Hono、不发 SSE（那是 Ch26）、不实现 RAG、不开放 bash

\`\`\`mermaid
flowchart LR
    cli["CLI 命令 pi<br/>────────<br/>同一套 harness<br/>SessionManager 加 tools"]
    sdk["SDK createAgentSession<br/>────────<br/>同一套 harness<br/>prompt 和 steer"]
    cli ~~~ sdk

    style cli fill:#E1F5FE,stroke:#0277BD,color:#1f1f1f
    style sdk fill:#F3E5F5,stroke:#7B1FA2,color:#1f1f1f
\`\`\`

\`\`\`mermaid
flowchart TD
    start["createAgent<br/>Session"] --> mem{"哪种 SessionManager?"}
    mem -->|"inMemory"| ram["内存、不落盘"]
    mem -->|"create cwd"| disk["文件、按 cwd 落盘"]
    ram --> promptN["prompt 等整轮结束"]
    disk --> promptN
    promptN --> toolN["lookupProduct 等商品工具"]
    toolN --> steerN["steer 等当前工具结束"]
    steerN --> logN["subscribe 记日志"]
    logN --> endN["dispose 释放"]

    style start fill:#FFE082,stroke:#F9A825,color:#1f1f1f
    style mem fill:#80DEEA,stroke:#0097A7,color:#1f1f1f
    style ram fill:#A5D6A7,stroke:#388E3C,color:#1f1f1f
    style disk fill:#FFCC80,stroke:#F57C00,color:#1f1f1f
    style promptN fill:#80DEEA,stroke:#0097A7,color:#1f1f1f
    style toolN fill:#A5D6A7,stroke:#388E3C,color:#1f1f1f
    style steerN fill:#CE93D8,stroke:#7B1FA2,color:#1f1f1f
    style logN fill:#80DEEA,stroke:#0097A7,color:#1f1f1f
    style endN fill:#EF9A9A,stroke:#C62828,color:#1f1f1f
\`\`\`

本地 \`app.ts\` 提供 \`fakeKeylessRuntime()\`：\`{ hasKey: false, memory: "inMemory" }\`。没有 \`fetch\`、没有端口、没有真包。无 Key 集成测试直接 skip——作业不打网。

### ❌ / ✅

\`\`\`ts
// ❌ 作业 import @earendil-works/pi-coding-agent（本课没装，也没有 Key）
// ❌ 默认打开 bash / write / edit
// ❌ 把 steer 当成 draft += instruction
// ❌ 为 CLI 和 SDK 各写一套循环
// ❌ 本章去接 Hono+SSE 或再讲一遍 RAG
// ✅ 配置对象 + inMemory；prompt 等一轮；steer 替换；dispose 对照 close
\`\`\`

### 本课怎么算「会了」

打开 \`local/m5/ch25/assignment.ts\`，\`bun test local/m5/ch25\`。六个纯函数全绿，再加：无 Key 时 \`createShopSession(false).config.hasKey === false\`，tools 只有商品两个。**全绿 = 这题掌握。** 想真开会话：装包 + Key + 复制 \`demo.ts\` 里的片段。无 Key 不要跑那段。

---`,
    [],
  ),
  sec(
    "sec-25.1",
    "§25.1 会话配置（对应：`sessionConfig`）🟢",
    "25.1",
    `真 API 的 \`createAgentSession({ tools, customTools, sessionManager })\` 参数很多。作业先写成一个纯对象，方便测、禁止联网。

系统提示锁死商品助手，工具**恰好** \`lookupProduct\`、\`calcLineTotal\` 这个顺序。\`memory\` 作业里永远 \`"inMemory"\`——测试不落盘。\`hasKey\` 原样放入（\`true\` / \`false\` 都要测）。

\`\`\`ts
const SHOP_SYSTEM_PROMPT =
  "你是商品助手。只用 lookupProduct 和 calcLineTotal。禁止 bash 和写文件。";

function sessionConfig(hasKey: boolean): ShopSessionConfig {
  return {
    systemPrompt: SHOP_SYSTEM_PROMPT,
    tools: ["lookupProduct", "calcLineTotal"],
    memory: "inMemory",
    hasKey,
  };
}

sessionConfig(false).hasKey; // false
sessionConfig(true).hasKey;  // true
sessionConfig(false).tools;  // ["lookupProduct","calcLineTotal"]  没有 bash
\`\`\`

对照：Java 构造 \`SessionConfig\` POJO；Python dataclass。不要在这个函数里 \`fetch\` Key，也**不要**把 \`memory\` 改成 \`"file"\`——那是下一题 pick 的事。

### ❌ / ✅

\`\`\`ts
// ❌ tools: ["bash"] 或默认一堆文件系统工具
// ❌ hasKey 写死 false（true 那条会红）
// ❌ 自己另写一句系统提示，不用 SHOP_SYSTEM_PROMPT
// ✅ 常量 + 两个商品工具 + inMemory + 原样 hasKey
\`\`\`

> ✅ **做 \`sessionConfig\`**：false / true 都过；tools 白名单。

---`,
    ["sessionConfig"],
  ),
  sec(
    "sec-25.2",
    "§25.2 选 SessionManager（对应：`pickMemoryManager`）🟢",
    "25.2",
    `真 API：

- \`SessionManager.inMemory()\` — 无文件，适合测试
- \`SessionManager.create(cwd)\` — 按工作目录落盘，适合 CLI 长期会话

作业返回**工厂文本**，让你记住括号差在哪：无参的 inMemory **带** \`()\`；create 还要 cwd，所以返回 \`"SessionManager.create"\` **不要**括号。

\`\`\`ts
function pickMemoryManager(kind: MemoryKind): string {
  if (kind === "inMemory") return "SessionManager.inMemory()";
  return "SessionManager.create";
}

pickMemoryManager("inMemory"); // "SessionManager.inMemory()"
pickMemoryManager("file");     // "SessionManager.create"
\`\`\`

\`MemoryKind\` 已收窄，不会有第三种。作业会话的 \`config.memory\` 仍然永远 \`"inMemory"\`（§25.1）；本题只考「你会点名」。

对照：Java 里 \`Map\` 后端 vs 把会话序列化到文件；Python 里 dict vs 写 json 到 cwd。

### ❌ / ✅

\`\`\`ts
// ❌ "SessionManager.inMemory"     缺括号
// ❌ "SessionManager.create()"     多了括号（还没给 cwd）
// ❌ 两种都返回 inMemory
// ✅ inMemory 带 ()；file 是 create 这个标识
\`\`\`

> ✅ **做 \`pickMemoryManager\`**：两个字符串都要精确。

---`,
    ["pickMemoryManager"],
  ),
  sec(
    "sec-25.3",
    "§25.3 创建商店会话（对应：`createShopSession`）🟡",
    "25.3",
    `对应 \`const { session } = await createAgentSession(...)\`。作业同步返回一个还没关的 \`ShopSession\`。

**必须调用** \`sessionConfig(hasKey)\`，不要复制一份配置字面量——以后改白名单时会话会一起对。

\`\`\`ts
function createShopSession(hasKey: boolean): ShopSession {
  return { config: sessionConfig(hasKey), disposed: false, logs: [] };
}

createShopSession(false).config.hasKey; // false
createShopSession(false).disposed;      // false
createShopSession(false).logs;          // []
createShopSession(true).config.tools;   // ["lookupProduct","calcLineTotal"]
createShopSession(false).config.systemPrompt; // SHOP_SYSTEM_PROMPT
\`\`\`

无 Key 时对象照样造得出：\`hasKey: false\`。真 \`session.prompt\` 才需要 Key——那是 demo 的事，测试 skip 联网。

\`logs: []\` 表示还没有任何 subscribe 行。第一格 \`logs[0]\` 不存在（测试里会当成 null 哨兵）。

### ❌ / ✅

\`\`\`ts
// ❌ 手写 { systemPrompt, tools, ... } 不调用 sessionConfig
// ❌ disposed: true 起手（还没 prompt 就关了）
// ❌ logs: null
// ✅ { config: sessionConfig(hasKey), disposed: false, logs: [] }
\`\`\`

> ✅ **做 \`createShopSession\`**：调用 sessionConfig。

---`,
    ["createShopSession"],
  ),
  sec(
    "sec-25.4",
    "§25.4 订阅日志（对应：`subscribeToLog`）🔴",
    "25.4",
    `真 API：\`session.subscribe((event) => { ... })\` 在会话活着时收事件。作业简化成追加一行字符串。

规则（不可变）：

| 状态 | 行为 |
|------|------|
| \`disposed === false\` | 新对象，\`logs: [...session.logs, line]\`，连 \`""\` 也追加 |
| \`disposed === true\` | **不追加**，新对象 \`{ config, disposed: true, logs: session.logs.slice() }\` |

禁止 \`session.logs.push\`、禁止改 \`session.disposed\`。测试会 \`Object.freeze\`。

\`\`\`ts
function subscribeToLog(session: ShopSession, line: string): ShopSession {
  if (session.disposed) {
    return { config: session.config, disposed: true, logs: session.logs.slice() };
  }
  return { config: session.config, disposed: false, logs: [...session.logs, line] };
}

const s0 = createShopSession(false);
const s1 = subscribeToLog(s0, "prompt:机械键盘");
// s1.logs → ["prompt:机械键盘"]；s0.logs 仍是 []

const s2 = subscribeToLog(s1, "steer:只报库存");
// ["prompt:机械键盘","steer:只报库存"]

subscribeToLog(createShopSession(false), "prompt:无线鼠标");
// ["prompt:无线鼠标"]  ← 防硬编码机械键盘

const dead = disposeSafe(s2);
subscribeToLog(dead, "late"); // logs 不变，disposed 仍 true
\`\`\`

对照：Java 在 \`closed\` 后还 \`addListener\` 应被忽略；Python 在 \`__exit__\` 之后 callback 不该再改 list。

### ❌ / ✅

\`\`\`ts
// ❌ session.logs.push(line); return session
// ❌ dispose 后仍追加 "late"
// ❌ 空字符串直接忽略（未 dispose 时 "" 也是一行）
// ✅ 新对象；dispose 后 slice 拷贝、不追加
\`\`\`

> ✅ **做 \`subscribeToLog\`**：freeze 不能炸；无线鼠标那条也要过。

---`,
    ["subscribeToLog"],
  ),
  sec(
    "sec-25.5",
    "§25.5 关掉会话（对应：`disposeSafe`）🟡",
    "25.5",
    `真 API：\`session.dispose()\`。Java \`close()\` / try-with-resources；Python \`with\` 的 \`__exit__\`。作业没有真资源，只翻旗。

永远返回新对象：

\`\`\`ts
{ config: session.config, disposed: true, logs: session.logs.slice() }
\`\`\`

已经 disposed 再调：仍返回**新对象**（不要 \`return session\`），旗标还是 true，logs 内容相同。不 mutate 输入。

\`\`\`ts
function disposeSafe(session: ShopSession): ShopSession {
  return { config: session.config, disposed: true, logs: session.logs.slice() };
}

const open = createShopSession(false);
const d1 = disposeSafe(open); // open.disposed 仍 false；d1.disposed true
const d2 = disposeSafe(d1);   // d1 !== d2，都是 disposed true
\`\`\`

\`slice()\` 很重要：调用方若改返回值的 logs，不能伤到原 session。这和 Java 里 close 之后原对象还在、只是不能再用是同一类边界。

### ❌ / ✅

\`\`\`ts
// ❌ session.disposed = true; return session
// ❌ 第二次 dispose 直接 return 同一个引用
// ❌ logs 不拷贝（后面 push 会改到旧会话）
// ✅ 每次新对象；disposed true；logs.slice()
\`\`\`

> ✅ **做 \`disposeSafe\`**：freeze 输入；两次 dispose 两个对象。

---`,
    ["disposeSafe"],
  ),
  sec(
    "sec-25.6",
    "§25.6 steer 替换草稿（对应：`steerNote`）🔴",
    "25.6",
    `这是本章最容易用 Java/Python 字符串习惯踩坑的题。

\`session.steer("改口只报 SKU 和库存数字")\` 的语义：**当前工具跑完之后**，用 steer **整段替换**还没完成的助手草稿。不是 \`currentDraft + steerText\`。

作业规则：

- \`steerText.trim() === ""\` → 返回 \`currentDraft\` **原样**（不要 trim draft）
- 否则返回 \`steerText\` **原样**（只用 trim 判断是不是空指令，返回值不去 trim）

\`\`\`ts
function steerNote(currentDraft: string, steerText: string): string {
  if (steerText.trim() === "") return currentDraft;
  return steerText;
}

steerNote("KB-001 库", "只报库存 120"); // "只报库存 120"  不是 "KB-001 库只报库存 120"
steerNote("无线鼠标还", "改口报 MS-002"); // "改口报 MS-002"
steerNote("KB-001 库", "   "); // "KB-001 库"
steerNote("KB-001 库", "");    // "KB-001 库"
steerNote("KB-001 库  ", "");  // "KB-001 库  "  draft 空白保留
steerNote("KB-001 库", "  改口"); // "  改口"  steer 两端空格保留
\`\`\`

\`\`\`mermaid
flowchart LR
    draft["当前草稿<br/>KB-001 库"] --> q{"steerText trim 后空?"}
    q -->|"是"| keep["保留草稿原样"]
    q -->|"否"| replace["整段换成 steerText"]

    style draft fill:#FFE082,stroke:#F9A825,color:#1f1f1f
    style q fill:#80DEEA,stroke:#0097A7,color:#1f1f1f
    style keep fill:#A5D6A7,stroke:#388E3C,color:#1f1f1f
    style replace fill:#A5D6A7,stroke:#388E3C,color:#1f1f1f
\`\`\`

真会话里，steer 插在工具还在跑的时候：当前 \`lookupProduct("KB-001")\` 会跑完，然后模型按新指令说话。作业用两行字符串把「替换 vs 拼接」钉死。

### ❌ / ✅

\`\`\`ts
// ❌ return currentDraft + steerText
// ❌ return currentDraft.trim()
// ❌ return steerText.trim()  （非空 steer 也去 trim）
// ❌ 硬编码只处理「机械键盘」
// ✅ 空指令（trim 后）保留 draft；否则原样返回 steerText
\`\`\`

> ✅ **做 \`steerNote\`**：替换不拼接；鼠标那条也要过。

---`,
    ["steerNote"],
  ),
  sec(
    "sec-pits",
    "⚠️ Java / Python 老手几个坑",
    null,
    `1. **以为 CLI \`pi\` 和 SDK 是两套产品。** 同一套 harness。\`createAgentSession\` 就是把 CLI 那套嵌进进程。
2. **没有 Key 就不会写作业。** 配置对象就能绿。真跑才要供应商 Key，见 \`demo.ts\`。无 Key 不要跑复制区。
3. **默认带 bash。** 商品助手只许 \`lookupProduct\` / \`calcLineTotal\`。bash 能把店砸了。
4. **\`steer\` 当成 \`draft += msg\`。** 是整段替换未完成草稿，等当前工具结束再生效。
5. **\`SessionManager.inMemory()\` 和 \`create(cwd)\` 搞反。** 作业测试永远内存；create 才落盘。
6. **\`createShopSession\` 不调用 \`sessionConfig\`。** 测试能蒙对，验收脚本会查调用。
7. **\`subscribeToLog\` 里 \`push\`。** freeze 会红。dispose 后还 push 更红。
8. **\`dispose\` 改原对象。** 对照 close：返回新快照，输入不动。第二次 dispose 也要新对象。
9. **作业 import \`@earendil-works/pi-coding-agent\` / hono / fetch。** JSON 作业是纯函数。真示例只在 \`demo.ts\` 的字符串里。
10. **本章去接 Hono+SSE，或把 M6 扩展四件套当作业。** 接线是 Ch26；扩展四件套整段暂停。

---`,
    [],
  ),
  sec(
    "sec-homework",
    "📝 本章作业",
    null,
    `上面 6 个函数按节交错出现。每个注释里有【场景】【转换点】、示例和提示。

**完成方式**：打开仓库 \`local/m5/ch25/assignment.ts\`，把 \`throw new Error("TODO")\` 换成实现，然后：

\`\`\`bash
bun test local/m5/ch25
\`\`\`

\`app.ts\` 是 \`fakeKeylessRuntime\`，不联网。\`demo.ts\` 是真 \`createAgentSession\` 抄写稿，**测试不要 import 它**（包没装）。无 Key 集成测试 skip。

卡住就回对应 §：\`sessionConfig\` → §25.1，\`createShopSession\` → §25.3（请调用 sessionConfig），\`subscribeToLog\` → §25.4（请不要 mutate），\`steerNote\` → §25.6（请替换不要拼接）。

---`,
    [],
  ),
  sec(
    "sec-check",
    "✅ 自测：你真的掌握了吗？",
    null,
    `- [ ] 能说清 CLI \`pi\` 和 \`createAgentSession\` 是同一套 harness
- [ ] 没有 Key 时作业为什么还能绿；测试为什么不能 import 真包
- [ ] \`sessionConfig\` 工具恰好两个商品函数，没有 bash
- [ ] \`inMemory()\` 带括号；\`create\` 不带（还要 cwd）
- [ ] \`createShopSession\` 调用了 \`sessionConfig\`
- [ ] \`subscribeToLog\` 不 mutate；dispose 后不加 late
- [ ] \`disposeSafe\` 对照 try-with-resources / \`with\`
- [ ] \`steerNote\` 替换草稿，不是拼接
- [ ] \`bun test local/m5/ch25\` 全绿

---`,
    [],
  ),
  sec(
    "sec-feynman",
    "🎓 费曼挑战",
    null,
    `用大白话讲给「Java 同事」听。讲不清 = 还没真懂。

任选一题（1–2 分钟）：

1. 「\`pi\` 命令和代码里 \`createAgentSession\` 为啥不是两套循环？没有 Key 测试怎么绿？」— 卡壳重读总述
2. 「为什么 \`steer\` 不是把新指令 \`+\` 到当前草稿？工具还在跑时 steer 什么时候生效？」— 卡壳重读 §25.6
3. 「Java 的 try-with-resources 对应 session 的哪一步？dispose 之后 subscribe 为什么不能再记日志？」— 卡壳重读 §25.4 + §25.5

---`,
    [],
  ),
  sec(
    "sec-next",
    "⏭️ 下一步",
    null,
    `Ch25 掌握后，你已经会用 \`createAgentSession\` 的心智包一层商品助手会话：内存 SessionManager、prompt / steer、dispose。下一章是 **Ch26 · 打通：Hono + SSE + React 数据协议**：把会话事件编成 SSE 推到网页。本章不要提前写 Hono 接线，也不要默认开启 bash。`,
    [],
  ),
];

const tutorialMd = `# Ch25 · createAgentSession

${sections
  .map((s) => (s.heading ? `## ${s.heading}\n\n${s.body}` : s.body))
  .join("\n\n")}
`;

const reviewMd = `# Ch25 · 记忆闪卡

> 先回忆，再翻答案。连续 2 次秒答 → 退役。

## 🔖 闪卡

| # | 正面（问题） | 背面（答案） | 掌握 |
|---|---|---|---|
| 1 | \`SessionManager.inMemory()\` 和 \`SessionManager.create(cwd)\` 差在哪？作业用哪个？ | inMemory 无文件；create 才按 cwd 落盘。作业 \`config.memory\` 永远 \`"inMemory"\`。pick 时 inMemory 字符串带 \`()\`，create 不带括号。 | ⬜ |
| 2 | \`prompt\` 和 \`steer\` 各干什么？steer 是拼接吗？ | prompt = 用户发一轮，等到结束。steer = 流式/跑工具时插入新指令，等当前工具结束再生效，**整段替换**未完成草稿，不是 \`+=\`。 | ⬜ |
| 3 | \`session.dispose()\` 对照 Java / Python 什么？作业怎么测？ | Java try-with-resources / \`AutoCloseable.close()\`；Python \`with\` / \`__exit__\`。作业 \`disposeSafe\` 返回新对象、翻 \`disposed\`，不 mutate 输入。 | ⬜ |
| 4 | 商品助手 tools 白名单是哪两个？为什么不要默认 bash？ | \`lookupProduct\`、\`calcLineTotal\`。bash/write/edit 能改文件、砸店。课程只允许商品工具。 | ⬜ |
| 5 | 没有供应商 Key，作业能绿吗？测试可以 import \`pi-coding-agent\` 吗？ | 能绿：测 \`ShopSessionConfig\` 等纯对象。测试禁止 import 真包、禁止联网。真跑看 \`demo.ts\`，要 Key；无 Key skip。 | ⬜ |
| 6 | \`subscribeToLog\` 为什么不能 \`push\`？dispose 后再订 \`"late"\`？ | 不可变：新对象 + spread/slice。freeze 会抓住 mutate。已 dispose 不追加，logs 保持原内容。空 \`""\` 在未 dispose 时也要追加。 | ⬜ |
| 7 | \`createShopSession\` 必须怎么写？无 Key 时 hasKey？ | 必须调用 \`sessionConfig(hasKey)\`。\`disposed: false\`，\`logs: []\`。无 Key → \`hasKey: false\`，对象照样能造。 | ⬜ |
| 8 | CLI \`pi\` 和 SDK \`createAgentSession\` 是两套吗？ | 不是。同一套 harness（同一 SessionManager、同一工具、同一 prompt/steer）。SDK 是把 CLI 那套嵌进进程。 | ⬜ |
| 9 | \`steerNote("KB-001 库", "   ")\` 和 \`"只报库存 120"\`？ | 空白 trim 后为空 → 保留 \`"KB-001 库"\`。非空 → 整段换成 \`"只报库存 120"\`，不是拼在后面。 | ⬜ |

## 🎓 费曼自检

- [ ] 能说清 inMemory vs create、prompt vs steer
- [ ] 能说清无 Key 测配置、dispose 对照 close
- [ ] 能说清工具白名单和 subscribeToLog 不 mutate
`;

const chapter = {
  id: "ch25",
  num: "25",
  title: "createAgentSession",
  runMode: "local" as const,
  tutorialMd,
  assignment,
  testName: "ch25_assignment",
  testSource,
  reviewMd,
  interleaved: true,
  sections,
  functions,
  preamble,
  localHint: "bun test local/m5/ch25",
};

const out = join(dirname(fileURLToPath(import.meta.url)), "../src/content/chapters/ch25.json");
mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, JSON.stringify(chapter, null, 2) + "\n");
console.log("wrote", out);

const localDir = join(dirname(fileURLToPath(import.meta.url)), "../local/m5/ch25");
mkdirSync(localDir, { recursive: true });

const localAssignment = `/**
 * Ch25 作业：商品助手会话的配置对象。
 *
 * 场景：createAgentSession 的教学版。不打网、不装包。
 * 打开本文件改 TODO，然后：bun test local/m5/ch25
 */

export type MemoryKind = "inMemory" | "file";

export type ShopSessionConfig = {
  systemPrompt: string;
  tools: string[];
  memory: MemoryKind;
  hasKey: boolean;
};

export type ShopSession = {
  config: ShopSessionConfig;
  disposed: boolean;
  logs: string[];
};

export const SHOP_SYSTEM_PROMPT =
  "你是商品助手。只用 lookupProduct 和 calcLineTotal。禁止 bash 和写文件。";

${functions.map((f) => f.skeleton).join("\n\n")}
`;

const appSource = `/**
 * Ch25 本地假运行时：无 Key、内存会话、不联网。
 * 不 listen、不 fetch、不 import 真包。
 *
 * bun test 用 fakeKeylessRuntime + assignment 的纯函数。
 */
import { type ShopSession } from "./assignment";

export const ALLOWED_TOOLS = ["lookupProduct", "calcLineTotal"];

export function fakeKeylessRuntime(): { hasKey: false; memory: "inMemory" } {
  return { hasKey: false, memory: "inMemory" as const };
}

export function describeShopSession(session: ShopSession): string {
  const key = session.config.hasKey ? "hasKey" : "noKey";
  const life = session.disposed ? "disposed" : "open";
  const tools = session.config.tools.join("+");
  return \`\${key}|\${session.config.memory}|\${life}|logs:\${session.logs.length}|\${tools}\`;
}
`;

const localTest = `import { describe, expect, test } from "bun:test";
import {
  SHOP_SYSTEM_PROMPT,
  createShopSession,
  disposeSafe,
  pickMemoryManager,
  sessionConfig,
  steerNote,
  subscribeToLog,
} from "./assignment";
import { ALLOWED_TOOLS, describeShopSession, fakeKeylessRuntime } from "./app";

describe("sessionConfig", () => {
  test("hasKey false / true；工具白名单", () => {
    const off = sessionConfig(false);
    expect(off.hasKey).toBe(false);
    expect(off.memory).toBe("inMemory");
    expect(off.systemPrompt).toBe(SHOP_SYSTEM_PROMPT);
    expect(off.tools).toEqual(["lookupProduct", "calcLineTotal"]);
    const on = sessionConfig(true);
    expect(on.hasKey).toBe(true);
    expect(on.tools.includes("bash")).toBe(false);
    expect(on.tools.includes("write")).toBe(false);
    expect(on.tools.includes("edit")).toBe(false);
  });
});

describe("pickMemoryManager", () => {
  test("inMemory 带括号；file 是 create", () => {
    expect(pickMemoryManager("inMemory")).toBe("SessionManager.inMemory()");
    expect(pickMemoryManager("file")).toBe("SessionManager.create");
  });
});

describe("createShopSession", () => {
  test("无 Key 配置对象；有 Key 的 tools", () => {
    const s = createShopSession(false);
    expect(s.config.hasKey).toBe(false);
    expect(s.disposed).toBe(false);
    expect(s.logs).toEqual([]);
    expect(s.config).toEqual(sessionConfig(false));
    const keyed = createShopSession(true);
    expect(keyed.config.tools).toEqual(["lookupProduct", "calcLineTotal"]);
    expect(keyed.config.systemPrompt).toBe(SHOP_SYSTEM_PROMPT);
  });
});

describe("subscribeToLog", () => {
  test("追加 prompt/steer；无线鼠标；freeze", () => {
    const s0 = createShopSession(false);
    Object.freeze(s0);
    Object.freeze(s0.logs);
    const s1 = subscribeToLog(s0, "prompt:机械键盘");
    const s2 = subscribeToLog(s1, "steer:只报库存");
    expect(s2.logs).toEqual(["prompt:机械键盘", "steer:只报库存"]);
    expect(s0.logs).toEqual([]);
    const mouse = subscribeToLog(createShopSession(false), "prompt:无线鼠标");
    expect(mouse.logs).toEqual(["prompt:无线鼠标"]);
  });
  test("空 line 追加；dispose 后再订不加", () => {
    expect(subscribeToLog(createShopSession(false), "").logs).toEqual([""]);
    const open = subscribeToLog(createShopSession(false), "prompt:机械键盘");
    const dead = disposeSafe(open);
    Object.freeze(dead);
    Object.freeze(dead.logs);
    const late = subscribeToLog(dead, "late");
    expect(late.disposed).toBe(true);
    expect(late.logs).toEqual(["prompt:机械键盘"]);
  });
});

describe("disposeSafe", () => {
  test("翻旗、拷贝 logs、第二次仍是新对象", () => {
    const s0 = createShopSession(false);
    Object.freeze(s0);
    Object.freeze(s0.logs);
    const d1 = disposeSafe(s0);
    expect(d1.disposed).toBe(true);
    expect(s0.disposed).toBe(false);
    const logged = subscribeToLog(createShopSession(true), "prompt:无线鼠标");
    const a = disposeSafe(logged);
    const b = disposeSafe(a);
    expect(a.disposed).toBe(true);
    expect(b.disposed).toBe(true);
    expect(a === b).toBe(false);
    expect(b.logs).toEqual(["prompt:无线鼠标"]);
  });
});

describe("steerNote", () => {
  test("替换不拼接；MS-002；空白保留草稿", () => {
    expect(steerNote("KB-001 库", "只报库存 120")).toBe("只报库存 120");
    expect(steerNote("无线鼠标还", "改口报 MS-002")).toBe("改口报 MS-002");
    expect(steerNote("KB-001 库", "   ")).toBe("KB-001 库");
    expect(steerNote("KB-001 库", "")).toBe("KB-001 库");
  });
});

describe("flow + app", () => {
  test("createShopSession(false) 再 subscribe/dispose", () => {
    const runtime = fakeKeylessRuntime();
    expect(runtime).toEqual({ hasKey: false, memory: "inMemory" });
    expect(ALLOWED_TOOLS).toEqual(["lookupProduct", "calcLineTotal"]);
    const s0 = createShopSession(runtime.hasKey);
    expect(describeShopSession(s0)).toBe(
      "noKey|inMemory|open|logs:0|lookupProduct+calcLineTotal",
    );
    const s1 = subscribeToLog(s0, "prompt:机械键盘");
    const s2 = subscribeToLog(s1, "steer:只报库存");
    const s3 = disposeSafe(s2);
    const s4 = subscribeToLog(s3, "late");
    expect(s4.logs).toEqual(["prompt:机械键盘", "steer:只报库存"]);
    expect(s4.disposed).toBe(true);
    expect(describeShopSession(s4)).toBe(
      "noKey|inMemory|disposed|logs:2|lookupProduct+calcLineTotal",
    );
    expect(s4.config.tools.includes("bash")).toBe(false);
  });
});
`;

const demoSource = `/**
 * Ch25 · 真跑 @earendil-works/pi-coding-agent 的最小示例。
 *
 * 本文件只给阅读 / 复制。测试禁止 import 本文件（包没有装进本课）。
 *
 * 作业全绿不需要本文件、不需要 API Key：配置对象就能绿。
 * 无 Key 不要跑下面这段。真要开会话：
 *   1. 自行安装 @earendil-works/pi-coding-agent（本课作业不要装）
 *   2. export 供应商 Key（如 OPENAI_API_KEY）
 *   3. 把下面「复制区」拷到新文件再跑
 *
 * 文档：https://pi.dev/docs/latest/sdk
 *
 * 不要用过时的 @mariozechner/* 。不要默认开启 bash。
 * 本章不讲 Hono+SSE（那是 Ch26）。
 */

const COPY_WHEN_YOU_HAVE_A_KEY = \`
import { createAgentSession, SessionManager } from "@earendil-works/pi-coding-agent";

const { session } = await createAgentSession({
  sessionManager: SessionManager.inMemory(),
  // 可选：modelRuntime: await ModelRuntime.create(),
  tools: ["lookupProduct", "calcLineTotal"],
  customTools: [lookupProduct, calcLineTotal],
});

await session.prompt("机械键盘还有货吗");
await session.steer("改口只报 SKU 和库存数字");
session.subscribe((event) => {
  console.log(event);
});
session.dispose();
\`;

if (false) {
  // 有 Key 时把 COPY_WHEN_YOU_HAVE_A_KEY 拷出去跑；这里故意不 import 真包。
  console.log(COPY_WHEN_YOU_HAVE_A_KEY);
}
`;

writeFileSync(join(localDir, "assignment.ts"), localAssignment);
writeFileSync(join(localDir, "app.ts"), appSource);
writeFileSync(join(localDir, "assignment.test.ts"), localTest);
writeFileSync(join(localDir, "demo.ts"), demoSource);
console.log("wrote", localDir);
