/**
 * 生成 src/content/chapters/ch12.json
 * 运行：bun scripts/gen-ch12.ts
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const preamble = `/**
 * Ch12 作业：商品助手 Chat 的消息列表——同一份 state 算出气泡、标题、空态、未读。
 *
 * 场景：货架上有机械键盘 KB-001、无线鼠标 MS-002。用户和助手在聊库存。
 * 你不拼一整页 HTML，也不写页面组件：只写纯函数，把 ChatMessage[] 变成视图模型。
 *
 * 心智：UI = f(state)。改 messages，视图重算；不要在函数里 incr 拼 HTML。
 *
 * 全绿 = 你掌握了 Ch12。
 */

type ChatRole = "user" | "assistant";

type ChatMessage = {
  id: string;
  role: ChatRole;
  content: string;
  ts: number; // epoch ms
};`;

const functions = [
  {
    name: "messageViewModel",
    testSuite: "messageViewModel",
    skeleton: `/**
 * 【场景】消息列表要画气泡：用户靠右叫「你」，助手靠左叫「助手」。
 * 机械键盘有货吗 / KB-001 库存 120 —— 同一条消息，先变成视图模型再交给 UI。
 *
 * 【转换点】UI = f(state)。Java 的 JSP 会在页面里 if/else 拼 HTML；
 * 这里只返回 { roleLabel, text, align }，不拼标签。
 *
 * 任务：user → { roleLabel: "你", text: content, align: "right" }；
 * assistant → { roleLabel: "助手", text: content, align: "left" }。
 * 示例：
 *   { id:"m1", role:"user", content:"机械键盘有货吗", ts:0 }
 *     -> { roleLabel:"你", text:"机械键盘有货吗", align:"right" }
 *   { id:"m2", role:"assistant", content:"KB-001 库存 120", ts:1 }
 *     -> { roleLabel:"助手", text:"KB-001 库存 120", align:"left" }
 *
 * 提示：看 msg.role 分支；text 用 msg.content，不要写死某一句。
 */
export function messageViewModel(msg: ChatMessage): {
  roleLabel: string;
  text: string;
  align: "left" | "right";
} {
  throw new Error("TODO");
}`,
  },
  {
    name: "bubbleClassName",
    testSuite: "bubbleClassName",
    skeleton: `/**
 * 【场景】气泡要换皮肤：用户一个 class，助手另一个。CSS 已经写好，你只负责字符串。
 *
 * 【转换点】class 也是 f(state) 的一小片。不要 return "<div class=...>".
 * Java Thymeleaf 会 th:classappend；这里只产出 class 字符串。
 *
 * 任务：user → "bubble bubble-user"；assistant → "bubble bubble-assistant"。
 * 精确匹配，不要多空格、不要漏 bubble。
 * 示例：
 *   bubbleClassName("user")       -> "bubble bubble-user"
 *   bubbleClassName("assistant")  -> "bubble bubble-assistant"
 *
 * 提示：两段 class，中间一个空格。
 */
export function bubbleClassName(role: ChatRole): string {
  throw new Error("TODO");
}`,
  },
  {
    name: "splitUserAssistant",
    testSuite: "splitUserAssistant",
    skeleton: `/**
 * 【场景】客服后台要左右两列：左边用户问机械键盘，右边助手答库存。
 * 原时间线还在用，不能改掉 messages。
 *
 * 【转换点】filter 保序；返回新数组。Java 的 stream().filter() 也是新 list；
 * 不要 messages.splice，也不要 push 进入参。
 *
 * 任务：按 role 拆成 { user, assistant }，各自保持原相对顺序。
 * 示例：
 *   [] -> { user: [], assistant: [] }
 *   全是 user -> assistant 为 []
 *   [user m1, asst m2, user m3] -> user [m1,m3]，assistant [m2]
 *
 * 提示：messages.filter(...) 两次。测完原数组 length 应不变。
 */
export function splitUserAssistant(messages: ChatMessage[]): {
  user: ChatMessage[];
  assistant: ChatMessage[];
} {
  throw new Error("TODO");
}`,
  },
  {
    name: "shouldShowTime",
    testSuite: "shouldShowTime",
    skeleton: `/**
 * 【场景】聊库存聊了很久，每条都画时间会刷屏。间隔够了才显示一行时间。
 *
 * 【转换点】阈值是 5 分钟（5 * 60 * 1000 ms）。prev 为 null 表示第一条，总显示。
 * 不是「格式化日期」（那是下一层），只回答要不要画。
 *
 * 任务：prev === null → true；curr.ts - prev.ts >= 5 分钟 → true；否则 false。
 * 示例：
 *   prev=null                              -> true
 *   间隔刚好 5 分钟                        -> true
 *   间隔 4 分 59 秒                        -> false
 *   同一毫秒                               -> false
 *
 * 提示：差值用毫秒。4*60*1000 + 59*1000 还没到阈值。
 */
export function shouldShowTime(prev: ChatMessage | null, curr: ChatMessage): boolean {
  throw new Error("TODO");
}`,
  },
  {
    name: "threadTitle",
    testSuite: "threadTitle",
    skeleton: `/**
 * 【场景】会话列表左侧要有标题。用第一条用户消息（问机械键盘那句），太长就截断。
 *
 * 【转换点】找第一条 role==="user" 的 content。长度 > 20 才截：
 * content.slice(0, 20) + "…"  （Unicode 省略号 …，不是三个点 ...）
 * 恰好 20 字不截。没有 user 或空列表 → "新对话"。
 *
 * 任务：按上面的规则返回标题字符串。
 * 示例：
 *   第一条用户 "机械键盘有货吗"            -> "机械键盘有货吗"
 *   很长的用户问题（>20）                  -> 前 20 字 + "…"
 *   [] 或全是助手                          -> "新对话"
 *
 * 提示：messages.find(m => m.role === "user")。省略号复制骨架里的 …。
 */
export function threadTitle(messages: ChatMessage[]): string {
  throw new Error("TODO");
}`,
  },
  {
    name: "emptyStateText",
    testSuite: "emptyStateText",
    skeleton: `/**
 * 【场景】对话区中央的提示：还没问机械键盘、助手正在打字、已经有气泡。
 *
 * 【转换点】loading 压过 empty。isLoading 为 true 时，不管有没有消息，都是输入中。
 * 有消息且没在加载 → 空字符串（不要占位「暂无」）。
 *
 * 任务：
 *   isLoading === true                    -> "助手正在输入…"
 *   !hasMessages && !isLoading            -> "还没有消息，问一个商品问题吧"
 *   hasMessages && !isLoading             -> ""
 *
 * 提示：先判断 isLoading。省略号同样是 …。
 */
export function emptyStateText(hasMessages: boolean, isLoading: boolean): string {
  throw new Error("TODO");
}`,
  },
  {
    name: "countUnread",
    testSuite: "countUnread",
    skeleton: `/**
 * 【场景】会话列表角标：用户读到哪条了，后面还有几条助手回复没看。
 * 用户自己发的「机械键盘有货吗」不算未读。
 *
 * 【转换点】lastReadId === null（或找不到这条 id）→ 数全部 assistant。
 * 否则从 lastReadId **之后**（不含自己）数 role==="assistant"。
 * 不要 mutate 原数组。
 *
 * 任务：返回未读助手条数。空列表 → 0。user 消息跳过。
 * 示例：[user m1, asst m2, asst m3]
 *   lastReadId "m1" -> 2
 *   lastReadId "m2" -> 1
 *   lastReadId "m3" -> 0
 *   lastReadId null -> 2
 *
 * 提示：findIndex 找到后从 idx+1 往后数。找不到就当 null。
 */
export function countUnread(messages: ChatMessage[], lastReadId: string | null): number {
  throw new Error("TODO");
}`,
  },
];

const assignment = `${preamble}

${functions.map((f) => f.skeleton).join("\n\n")}
`;

const testSource = `const T0 = 1_700_000_000_000;
const FIVE_MIN = 5 * 60 * 1000;

function msg(id: string, role: ChatRole, content: string, ts: number): ChatMessage {
  return { id, role, content, ts };
}

const USER_KB = msg("m1", "user", "机械键盘有货吗", T0);
const ASST_KB = msg("m2", "assistant", "KB-001 库存 120", T0 + 1000);
const USER_MS = msg("m3", "user", "无线鼠标呢", T0 + 2000);
const ASST_MS = msg("m4", "assistant", "MS-002 库存 300", T0 + 3000);

const THREAD = [USER_KB, ASST_KB, USER_MS, ASST_MS];

const LONG_TITLE = "机械键盘还有货吗？帮我看看库存和价格以及优惠";
const EXACT_20 = LONG_TITLE.slice(0, 20);

describe("messageViewModel", () => {
  it("用户问机械键盘 → 你 / 右对齐", () => {
    expect(messageViewModel(USER_KB)).toEqual({
      roleLabel: "你",
      text: "机械键盘有货吗",
      align: "right",
    });
  });
  it("助手答 KB-001 库存 → 助手 / 左对齐", () => {
    expect(messageViewModel(ASST_KB)).toEqual({
      roleLabel: "助手",
      text: "KB-001 库存 120",
      align: "left",
    });
  });
  it("另一句用户（防硬编码机械键盘）", () => {
    expect(messageViewModel(USER_MS)).toEqual({
      roleLabel: "你",
      text: "无线鼠标呢",
      align: "right",
    });
  });
  it("另一句助手（防硬编码 KB-001）", () => {
    expect(messageViewModel(ASST_MS).text).toBe("MS-002 库存 300");
    expect(messageViewModel(ASST_MS).align).toBe("left");
    expect(messageViewModel(ASST_MS).roleLabel).toBe("助手");
  });
  it("空文案仍保留 role 与对齐", () => {
    expect(messageViewModel(msg("m0", "user", "", 0))).toEqual({
      roleLabel: "你",
      text: "",
      align: "right",
    });
  });
});

describe("bubbleClassName", () => {
  it("user 精确 class", () => {
    expect(bubbleClassName("user")).toBe("bubble bubble-user");
  });
  it("assistant 精确 class（防硬编码 user）", () => {
    expect(bubbleClassName("assistant")).toBe("bubble bubble-assistant");
  });
  it("两次调用稳定、不多空格", () => {
    expect(bubbleClassName("user")).toBe(bubbleClassName("user"));
    expect(bubbleClassName("assistant")).toBe("bubble bubble-assistant");
  });
});

describe("splitUserAssistant", () => {
  it("交错消息保序拆成两列", () => {
    const r = splitUserAssistant(THREAD);
    expect(r.user.map((m) => m.id)).toEqual(["m1", "m3"]);
    expect(r.assistant.map((m) => m.id)).toEqual(["m2", "m4"]);
    expect(r.user[0].content).toBe("机械键盘有货吗");
    expect(r.assistant[0].content).toBe("KB-001 库存 120");
  });
  it("空列表 → 两个空数组", () => {
    expect(splitUserAssistant([])).toEqual({ user: [], assistant: [] });
  });
  it("全是 user → assistant 为 []", () => {
    const onlyUser = [USER_KB, USER_MS];
    const r = splitUserAssistant(onlyUser);
    expect(r.user.map((m) => m.id)).toEqual(["m1", "m3"]);
    expect(r.assistant).toEqual([]);
    expect(onlyUser.length).toBe(2);
  });
  it("全是 assistant → user 为 []", () => {
    const onlyAsst = [ASST_KB, ASST_MS];
    const r = splitUserAssistant(onlyAsst);
    expect(r.user).toEqual([]);
    expect(r.assistant.map((m) => m.id)).toEqual(["m2", "m4"]);
  });
  it("不 mutate 原数组 length", () => {
    const orig = [USER_KB, ASST_KB];
    const before = orig.length;
    splitUserAssistant(orig);
    expect(orig.length).toBe(before);
    expect(orig[0].id).toBe("m1");
    expect(orig[1].id).toBe("m2");
  });
});

describe("shouldShowTime", () => {
  it("第一条 prev=null → true", () => {
    expect(shouldShowTime(null, USER_KB)).toBe(true);
  });
  it("间隔刚好 5 分钟 → true", () => {
    const later = msg("m9", "assistant", "KB-001 库存 120", T0 + FIVE_MIN);
    expect(shouldShowTime(USER_KB, later)).toBe(true);
  });
  it("超过 5 分钟也显示（第二份正常）", () => {
    const later = msg("m9", "assistant", "MS-002 库存 300", T0 + FIVE_MIN + 1);
    expect(shouldShowTime(USER_KB, later)).toBe(true);
  });
  it("间隔 4 分 59 秒 → false", () => {
    const later = msg("m9", "assistant", "KB-001 库存 120", T0 + 4 * 60 * 1000 + 59 * 1000);
    expect(shouldShowTime(USER_KB, later)).toBe(false);
  });
  it("同一毫秒 → false", () => {
    const twin = msg("m9", "assistant", "KB-001 库存 120", T0);
    expect(shouldShowTime(USER_KB, twin)).toBe(false);
  });
});

describe("threadTitle", () => {
  it("短的第一条用户消息当标题", () => {
    expect(threadTitle(THREAD)).toBe("机械键盘有货吗");
  });
  it("另一条短标题（防硬编码机械键盘）", () => {
    expect(threadTitle([USER_MS])).toBe("无线鼠标呢");
  });
  it("超过 20 字截断并加 Unicode 省略号", () => {
    const longUser = msg("m1", "user", LONG_TITLE, T0);
    expect(threadTitle([longUser])).toBe(EXACT_20 + "…");
  });
  it("恰好 20 字不截断", () => {
    const exact = msg("m1", "user", EXACT_20, T0);
    expect(threadTitle([exact])).toBe(EXACT_20);
  });
  it("空列表 → 新对话", () => {
    expect(threadTitle([])).toBe("新对话");
  });
  it("只有助手 → 新对话", () => {
    expect(threadTitle([ASST_KB, ASST_MS])).toBe("新对话");
  });
  it("助手在前仍取第一条用户", () => {
    expect(threadTitle([ASST_KB, USER_MS])).toBe("无线鼠标呢");
  });
});

describe("emptyStateText", () => {
  it("空列表且未加载 → 引导问商品", () => {
    expect(emptyStateText(false, false)).toBe("还没有消息，问一个商品问题吧");
  });
  it("已有消息且未加载 → 空字符串", () => {
    expect(emptyStateText(true, false)).toBe("");
  });
  it("正在加载、还没有消息 → 助手正在输入", () => {
    expect(emptyStateText(false, true)).toBe("助手正在输入…");
  });
  it("正在加载、已有消息 → 仍是输入中（loading 优先）", () => {
    expect(emptyStateText(true, true)).toBe("助手正在输入…");
  });
});

describe("countUnread", () => {
  it("读到用户 m1 之后两条助手都未读", () => {
    const chat = [USER_KB, ASST_KB, ASST_MS];
    expect(countUnread(chat, "m1")).toBe(2);
  });
  it("读到助手 m2 → 还剩 1", () => {
    const chat = [USER_KB, ASST_KB, ASST_MS];
    expect(countUnread(chat, "m2")).toBe(1);
  });
  it("读到最后一条助手 → 0", () => {
    const chat = [USER_KB, ASST_KB, ASST_MS];
    expect(countUnread(chat, "m4")).toBe(0);
  });
  it("lastReadId 为 null → 全部助手", () => {
    expect(countUnread(THREAD, null)).toBe(2);
  });
  it("找不到 lastReadId → 当作 null", () => {
    expect(countUnread(THREAD, "ghost")).toBe(2);
  });
  it("空列表 → 0", () => {
    expect(countUnread([], null)).toBe(0);
    expect(countUnread([], "m1")).toBe(0);
  });
  it("user 消息不算未读", () => {
    const chat = [ASST_KB, USER_MS, ASST_MS];
    expect(countUnread(chat, "m2")).toBe(1);
    expect(countUnread([USER_KB, USER_MS], null)).toBe(0);
  });
  it("不 mutate 原数组 length", () => {
    const orig = [USER_KB, ASST_KB, ASST_MS];
    const before = orig.length;
    countUnread(orig, "m1");
    expect(orig.length).toBe(before);
    expect(orig[0].id).toBe("m1");
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
    `> **预计**：0.5 天 ｜ **前置**：M1（类型、函数、联合类型够用）
> **目标**：为什么不是 JSP / 服务端模板一把梭；**UI = f(state)**。
> 你 15 年 Java：\`<% if %>\` 写在 JSP 里，Servlet 改 request 再 \`forward\`。Python：Jinja / Django templates。这里先把「渲染」收成可测的纯函数。

> 📐 **本教程的契约**：下面每一节（§12.1–§12.7）都**精确对应**作业里的题。讲过的才考，考的必讲过。卡住时按作业函数名回查对应小节。
> **不讲**：React API（那是 Ch13）、hooks、Redux、Next.js、CSS-in-JS、虚拟 DOM 深水。作业全是纯函数，不要写页面标签。

---`,
    [],
  ),
  sec(
    "sec-map",
    "🗺️ 本章地图",
    null,
    `本章作业是一条完整主线：**商品助手 Chat 的消息列表**。同一份 \`messages: ChatMessage[]\`，算出气泡视图模型、class、两列拆分、时间戳、会话标题、空态文案、未读角标。不是在 JSP 里 if/else 拼 HTML。

读完这章 + 完成作业，你将能够：

- 用一句话说清 **UI = f(state)**：改 state，视图重算，不 incr HTML
- 对照 JSP / Thymeleaf / Jinja：服务端一把梭 vs 纯函数产出小片 view model
- 把 \`role\` 映射成文案 / 对齐 / class，而不把 HTML 写进函数
- 用时间戳阈值、截断省略号、loading 优先、未读只数助手 —— 全是对同一份 state 的查询

**作业 ↔ 教程对应表**（学哪节，就去做哪题）：

| 作业题 | 对应小节 | 核心知识点 |
|--------|----------|-----------|
| \`messageViewModel\` | §12.1 | 消息 → 视图模型（roleLabel / text / align） |
| \`bubbleClassName\` | §12.2 | role → CSS class 字符串 |
| \`splitUserAssistant\` | §12.3 | 按 role 拆成两列（保序） |
| \`shouldShowTime\` | §12.4 | 时间戳间隔决定是否显示时间 |
| \`threadTitle\` | §12.5 | 首条用户消息截断当标题 |
| \`emptyStateText\` | §12.6 | 空态 / 加载态文案 |
| \`countUnread\` | §12.7 | 未读助手消息计数 |

---`,
    [],
  ),
  sec(
    "sec-path",
    "⏱️ 学习路径：费曼五步（约 30–40 分钟）",
    null,
    `| 步 | 你要做 | 在哪做 |
|----|--------|--------|
| ① 预览猜（2 分钟） | 看 JSP 一把梭和 f(state) 的差别，先猜 TS 怎么拆 | 本页 ① |
| ② 先动手 | 每节后面的编辑器里**先试着写** | 本节练习 |
| ③ 提取+反馈 | 点「运行测试」看红绿 | 本节练习 |
| ④ 费曼（2 分钟） | 大白话讲清「为什么不在函数里拼 HTML」 | 本页 ④ |
| ⑤ 存闪卡 | 章末闪卡标复习日期 | 闪卡 |

> 💡 别从头读到尾。先扫 ① → 写作业 → **哪题卡了，回对应 § 查** → 改 → 再跑。
> 七题都吃同一份 \`ChatMessage[]\`。\`splitUserAssistant\` / \`countUnread\` 不要改原数组。

---`,
    [],
  ),
  sec(
    "sec-guess",
    "① 预览猜（2 分钟 · 激活你的 Java / Python 直觉）",
    null,
    `先别看答案，凭经验猜一猜（猜错没关系）：

1. JSP 里 \`<% if (user) { %> ... <% } %>\` 和「一个函数返回 { align, text }」差在哪？谁更好测？
2. Servlet 改了 \`request.setAttribute("messages", list)\` 再 \`forward\`，浏览器拿到的是什么？state 改一行，你是补丁 HTML 还是整页重画？
3. Django 模板 \`{% for m in messages %}\` 跑在哪一侧？商品助手 Chat 若每打一个字都 round-trip 服务器，会怎样？
4. 会话标题截断该用 \`...\` 三个点，还是一个 \`…\` 字符？\`length === 20\` 要不要加省略号？
5. 助手正在输入、同时列表里已有气泡，空态文案听谁的？
6. 未读角标数用户自己发的「机械键盘有货吗」吗？

> 猜完，带着验证心态进入正文。第 1、2 题是本章的 🔴。

---`,
    [],
  ),
  sec(
    "sec-world",
    "世界地图：UI = f(state)，不是 JSP 一把梭 🔴",
    null,
    `先把「页面怎么来的」分清。后面每一节都是对**同一份 state** 的查询。

| | Java | Python | 本章 TypeScript |
|---|---|---|---|
| 典型写法 | JSP / Thymeleaf 里 if/else 拼标签；Servlet \`setAttribute\` 再 \`forward\` | Jinja / Django templates 在服务端把 context 灌进 HTML | **纯函数** \`f(state) → view model\` |
| 改一行数据 | 常改 JSP 片段，或整页再渲染一次 | 模板再 render 一次，出一整页字符串 | **重算**小片 VM；不 incr 补丁 HTML |
| 怎么测 | 测 Servlet 还行，测 JSP 字符串很痛 | 测视图函数还行，测模板字符串同样痛 | 作业就是对 VM 的 \`toEqual\` |

### Java：服务端一把梭

\`\`\`jsp
<%-- chat.jsp：控制和标签缠在一起 --%>
<% for (Message m : messages) { %>
  <% if ("user".equals(m.getRole())) { %>
    <div class="bubble bubble-user"><%= m.getContent() %></div>
  <% } else { %>
    <div class="bubble bubble-assistant"><%= m.getContent() %></div>
  <% } %>
<% } %>
\`\`\`

\`\`\`java
// Servlet：改 request，再 forward。浏览器拿到的是一整页 HTML。
request.setAttribute("messages", messages);
request.getRequestDispatcher("/chat.jsp").forward(request, response);
\`\`\`

### Python：Jinja / Django 同一思路

\`\`\`html
{% for m in messages %}
  <div class="bubble bubble-{{ m.role }}">{{ m.content }}</div>
{% endfor %}
\`\`\`

模板很擅长**服务器上**生成完整文档。商品助手 Chat 却是：用户打一个字、助手流式吐库存，state 一直在变。你不会为每个 token 重新 \`forward\` 一整页 JSP。

### TypeScript 心智：同一份 state，多个 f

\`\`\`mermaid
flowchart LR
    st["state<br/>messages 数组"] --> fn["f(state)<br/>纯函数"]
    fn --> vm["view model<br/>label / class / 标题"]
    vm --> dom["气泡 DOM"]

    style st fill:#FFE082,stroke:#F9A825,color:#1f1f1f
    style fn fill:#80DEEA,stroke:#0097A7,color:#1f1f1f
    style vm fill:#CE93D8,stroke:#7B1FA2,color:#1f1f1f
    style dom fill:#A5D6A7,stroke:#388E3C,color:#1f1f1f
\`\`\`

**UI = f(state)**：\`messages\` 是唯一事实来源。气泡、标题、空态、未读都是对它的查询。改 state，再跑一遍 f，得到新快照。不是找到旧 \`<div>\` 用字符串拼接「再加一段」。

教程里的「假组件」也只是函数返回 VM（作业不要写标签）：

\`\`\`ts
function chatBubbleView(msg: ChatMessage) {
  const vm = messageViewModel(msg);
  return {
    className: bubbleClassName(msg.role),
    roleLabel: vm.roleLabel,
    text: vm.text,
    align: vm.align,
  };
}
\`\`\`

真正把 VM 贴到屏幕上，是 Ch13 的事。本章先保证 **f 是纯的、可测的**。

### ❌ / ✅

\`\`\`ts
// ❌ 在函数里拼一整页 HTML 字符串当「组件」
function renderChat(messages: ChatMessage[]): string {
  return "<html>" + messages.map((m) => "<div>" + m.content + "</div>").join("") + "</html>";
}
// ✅ 纯函数：state → 小片 view model
messageViewModel(msg); // { roleLabel, text, align }
\`\`\`

> 🟡 **和 Python 课的衔接**：Jinja 的 \`{{ m.content }}\` 是服务端替换。本章的 \`text: msg.content\` 是同一份数据的投影，但**不**负责出 HTML。

---`,
    [],
  ),
  sec(
    "sec-12.1",
    "§12.1 消息 → 视图模型（对应：`messageViewModel`）🟡",
    "12.1",
    `气泡上要写谁说的、说了什么、贴左边还是右边。这些**不是 HTML**，是从 \`ChatMessage\` 算出来的三个字段。

### Java 对照：JSP 里直接写标签

JSP 会 \`if (user)\` 然后写 \`<div class="right">\`。控制和外观缠死，JUnit 只能对字符串 contains。这里先返回对象。

### 电商场景

\`\`\`ts
messageViewModel({ id: "m1", role: "user", content: "机械键盘有货吗", ts: 0 });
// { roleLabel: "你", text: "机械键盘有货吗", align: "right" }

messageViewModel({ id: "m2", role: "assistant", content: "KB-001 库存 120", ts: 1 });
// { roleLabel: "助手", text: "KB-001 库存 120", align: "left" }
\`\`\`

\`text\` 原样用 \`content\`。换一句「无线鼠标呢」，\`text\` 必须跟着换——测试会拦「写死机械键盘」。

### ❌ / ✅

\`\`\`ts
// ❌ return { roleLabel: "你", text: "机械键盘有货吗", align: "right" } 写死
// ❌ return "<div class='right'>你：机械键盘有货吗</div>"
// ✅ 按 msg.role 分支；text: msg.content
\`\`\`

> ✅ **做 \`messageViewModel\`**：user 右 / 「你」；assistant 左 / 「助手」。

---`,
    ["messageViewModel"],
  ),
  sec(
    "sec-12.2",
    "§12.2 role → class 字符串（对应：`bubbleClassName`）🟢",
    "12.2",
    `皮肤是 CSS 的事。函数只返回 class 名，精确空格。

### Python 对照：Jinja 的 \`class="bubble-{{ m.role }}"\`

模板把 role 填进属性。你现在做同一件事，但返回值是普通 string，方便 \`toBe\`。

\`\`\`ts
bubbleClassName("user");       // "bubble bubble-user"
bubbleClassName("assistant");  // "bubble bubble-assistant"
\`\`\`

多一个空格、少写 \`bubble\`，看起来页面「好像有 class」，测试会红。

### ❌ / ✅

\`\`\`ts
// ❌ "bubble-user"（漏了公共的 bubble）
// ❌ "bubble  bubble-user"（两个空格）
// ❌ return "<div class='bubble bubble-user'>"
// ✅ 两段 class，中间一个空格
\`\`\`

> ✅ **做 \`bubbleClassName\`**：精确 \`toBe\` 那两个字符串。

---`,
    ["bubbleClassName"],
  ),
  sec(
    "sec-12.3",
    "§12.3 按 role 拆两列（对应：`splitUserAssistant`）🟢",
    "12.3",
    `客服后台有时要左右栏：用户问的 SKU 一列，助手答的库存一列。时间线原数组还在用。

### Java 对照：\`stream().filter()\` 出新 list

不要 \`messages.clear()\` 再分类。\`filter\` 保序：先出现的 user 仍在 \`user[0]\`。

\`\`\`ts
splitUserAssistant([]);
// { user: [], assistant: [] }

splitUserAssistant([
  { id: "m1", role: "user", content: "机械键盘有货吗", ts: 0 },
  { id: "m2", role: "assistant", content: "KB-001 库存 120", ts: 1 },
  { id: "m3", role: "user", content: "无线鼠标呢", ts: 2 },
]);
// user: m1, m3（保序）
// assistant: m2
\`\`\`

全是 user → \`assistant\` 为 \`[]\`，不是 \`null\`。

### ❌ / ✅

\`\`\`ts
// ❌ messages.splice(i, 1) 边拆边删
// ❌ 用 sort 把 user 全堆到前面（破坏相对顺序）
// ✅ filter 两次；测完 orig.length 不变
\`\`\`

> ✅ **做 \`splitUserAssistant\`**：新数组、保序、空列表两个 \`[]\`。

---`,
    ["splitUserAssistant"],
  ),
  sec(
    "sec-12.4",
    "§12.4 时间戳阈值（对应：`shouldShowTime`）🟡",
    "12.4",
    `聊库存聊了二十条，每条都画 \`14:02:03\` 会刷屏。只在**间隔够大**时显示一行时间。

### 规则（毫秒）

- \`prev === null\` → \`true\`（第一条总显示）
- \`curr.ts - prev.ts >= 5 * 60 * 1000\` → \`true\`（含刚好 5 分钟）
- 4 分 59 秒 → \`false\`
- 同一毫秒 → \`false\`

这题**不**做日期格式化。Java 的 \`DateTimeFormatter\`、Python 的 \`strftime\` 是另一层。这里只回答布尔值。

\`\`\`ts
shouldShowTime(null, curr);                          // true
shouldShowTime(prev, { ...curr, ts: prev.ts + 300000 }); // true
shouldShowTime(prev, { ...curr, ts: prev.ts + 299000 }); // false（4 分 59 秒）
shouldShowTime(prev, { ...curr, ts: prev.ts });      // false
\`\`\`

### ❌ / ✅

\`\`\`ts
// ❌ 阈值写成 5 秒、或 5 分钟却用了 5 * 60（少乘 1000）
// ❌ prev 为 null 时去读 prev.ts（会炸；应直接 true）
// ✅ >= 五分钟；null 短路
\`\`\`

> ✅ **做 \`shouldShowTime\`**：先判 null，再比差值。

---`,
    ["shouldShowTime"],
  ),
  sec(
    "sec-12.5",
    "§12.5 首条用户消息当标题（对应：`threadTitle`）🟡",
    "12.5",
    `会话列表要有一行标题。用**第一条用户消息**，不要用助手的「KB-001 库存 120」（那是答，不是问）。

### 截断

- \`content.length > 20\` → \`content.slice(0, 20) + "…"\`
- 省略号是 Unicode **\`…\`**（一个字符），不是 \`...\` 三个点
- **恰好 20 字不截断**
- 没有 user、或 \`[]\` → \`"新对话"\`

汉字在 JS 里通常 \`length\` 为 1（BMP）。按 \`string.length\` 数，不要按 UTF-8 字节。

\`\`\`ts
threadTitle([{ id: "m1", role: "user", content: "机械键盘有货吗", ts: 0 }]);
// "机械键盘有货吗"

threadTitle([]);                 // "新对话"
threadTitle([assistantOnly]);    // "新对话"
threadTitle([asst, userMs]);     // 仍取第一条 user，不是助手
\`\`\`

长句「机械键盘还有货吗？帮我看看库存和价格以及优惠」会超过 20，测的是 \`slice(0, 20) + "…"\`。

### ❌ / ✅

\`\`\`ts
// ❌ 用第一条消息不管 role（助手开场白会当标题）
// ❌ 省略号写成 "..." 三个点
// ❌ length >= 20 就截（恰好 20 不该截）
// ✅ find user；> 20 才 slice
\`\`\`

> ✅ **做 \`threadTitle\`**：\`find\` 第一条 user；没有就「新对话」。

---`,
    ["threadTitle"],
  ),
  sec(
    "sec-12.6",
    "§12.6 空态 / 加载态（对应：`emptyStateText`）🟡",
    "12.6",
    `对话区中央那行字，也是 f(state)。state 里其实就两个布尔：有没有消息、是不是在等助手。

### 优先级：loading 压过 empty

| hasMessages | isLoading | 返回 |
|-------------|-----------|------|
| 任意 | \`true\` | \`"助手正在输入…"\` |
| \`false\` | \`false\` | \`"还没有消息，问一个商品问题吧"\` |
| \`true\` | \`false\` | \`""\` |

已经有气泡时，助手还在流式打「库存 120」，仍显示「正在输入」——不是空态。空态只在**完全没消息且没在加载**。

有消息且空闲 → 返回空字符串，别画「暂无数据」挡住气泡。

### ❌ / ✅

\`\`\`ts
// ❌ 先看 hasMessages，loading 被空态盖掉
// ❌ 有消息时返回「暂无」而不是 ""
// ❌ 省略号写成三个点
// ✅ 先 if (isLoading)
\`\`\`

> ✅ **做 \`emptyStateText\`**：loading 第一优先；空闲空列表才引导问商品。

---`,
    ["emptyStateText"],
  ),
  sec(
    "sec-12.7",
    "§12.7 未读只数助手（对应：`countUnread`）🟡",
    "12.7",
    `会话列表角标：用户读到哪条了，后面还有几条**助手**没看。自己问的「机械键盘有货吗」不是未读。

### 规则

- \`lastReadId === null\` → 数全部 \`role === "assistant"\`
- 否则从该 id **之后**（不含自己）往后数 assistant
- id **找不到** → 当作 null（全数 assistant）
- \`[]\` → \`0\`
- user 跳过

\`\`\`ts
const chat = [
  { id: "m1", role: "user", content: "机械键盘有货吗", ts: 0 },
  { id: "m2", role: "assistant", content: "KB-001 库存 120", ts: 1 },
  { id: "m3", role: "assistant", content: "MS-002 库存 300", ts: 2 },
];
countUnread(chat, "m1"); // 2
countUnread(chat, "m2"); // 1
countUnread(chat, "m3"); // 0
countUnread(chat, null); // 2
countUnread(chat, "ghost"); // 2  ← 找不到当 null
\`\`\`

「不含自己」：读到 m2 时，m2 这条助手已经看过，只数后面的。

### ❌ / ✅

\`\`\`ts
// ❌ 从 lastReadId 起含自己（读到 m2 会得到 2 而不是 1）
// ❌ 把 user 也算进角标
// ❌ messages.splice 边数边删（length 会变）
// ✅ findIndex；从 idx+1 循环；找不到 start=0
\`\`\`

> ✅ **做 \`countUnread\`**：只数 assistant；不 mutate。

---`,
    ["countUnread"],
  ),
  sec(
    "sec-pits",
    "⚠️ Java / Python 老手几个坑",
    null,
    `1. **JSP 一把梭不是组件化。** \`<% if %>\` 写在页面里，测的是 HTML 字符串。本章测的是 VM 对象。
2. **Servlet \`forward\` 出的是一整页。** Chat 这种高频更新，不要用「再请求一次整页」当默认心智。
3. **Jinja / Django 模板跑在服务端。** \`{{ m.content }}\` 很熟，但那是出 HTML；本章函数不出标签。
4. **不要在函数里拼一整页 HTML。** 那只是把 JSP 搬进 TS 字符串。
5. **省略号是 \`…\`。** \`...\` 三个点长度是 3，测试 \`toBe\` 会红。
6. **恰好 20 不截断。** 判断是 \`>\` 不是 \`>=\`。
7. **loading 压过 empty。** 有消息也能「正在输入」。
8. **未读只数 assistant。** user 自己的问题不是角标。
9. **filter / 计数不要 mutate 原数组。** 时间线还在用同一份 \`messages\`。
10. **不讲 hooks / Redux / Next.js。** 看见别慌，本章不考。把 f(state) 写对，Ch13 再接到组件上。

---`,
    [],
  ),
  sec(
    "sec-homework",
    "📝 本章作业",
    null,
    `上面 7 个函数按节交错出现。每个注释里有【场景】【转换点】、示例和提示。

**完成方式**：在编辑器里改 \`throw new Error("TODO")\`，点「▶ 运行测试」。全绿 = 这题过了。

卡住就回对应 §：\`messageViewModel\` → §12.1，\`threadTitle\` → §12.5，\`countUnread\` → §12.7。

主线提醒：同一份机械键盘对话 state，七个 f 一起算出列表外观。不要开第七份「假 HTML」。

---`,
    [],
  ),
  sec(
    "sec-check",
    "✅ 自测：你真的掌握了吗？",
    null,
    `- [ ] 能说清 UI = f(state)，以及它和 JSP / Jinja 一把梭的差别
- [ ] 知道 view model 和 HTML 要分开，函数里不拼整页标签
- [ ] 能按 role 算出对齐、class，且 class 字符串精确
- [ ] 知道 5 分钟阈值含等于；4 分 59 秒不显示
- [ ] 标题用第一条 user；>20 才截，省略号是 …
- [ ] loading 优先于空态；有消息空闲返回 ""
- [ ] 未读只数 assistant；找不到 lastReadId 当 null；不改原数组
- [ ] 7 个作业全绿

---`,
    [],
  ),
  sec(
    "sec-feynman",
    "🎓 费曼挑战",
    null,
    `用大白话讲给「Java 同事」听。讲不清 = 还没真懂。

任选一题（1–2 分钟）：

1. 「为什么不在 TypeScript 函数里 \`return "<div>"+msg+"</div>"\` 当组件？JSP 不就是这么干的吗？」— 卡壳重读世界地图 + §12.1
2. 「Servlet 改 request 再 forward，和 UI = f(state) 差在哪？state 改一条消息，你补丁 HTML 还是重算？」— 卡壳重读世界地图
3. 「会话角标为什么不能 \`messages.length - lastIndex\`？用户自己的问题算未读吗？」— 卡壳重读 §12.7

---`,
    [],
  ),
  sec(
    "sec-next",
    "⏭️ 下一步",
    null,
    `Ch12 掌握后，进 **Ch13 · React：组件、props、state 心智**。本章的 view model 会变成 props；state 仍不要直接改数组。教程会给组件示例，作业用 reducer / 不可变更新的纯函数模拟「改 state」。hooks 细节、标签语法深水留给后面。`,
    [],
  ),
];

const tutorialMd = `# Ch12 · 组件化心智

${sections
  .map((s) => (s.heading ? `## ${s.heading}\n\n${s.body}` : s.body))
  .join("\n\n")}
`;

const reviewMd = `# Ch12 · 记忆闪卡

> 先回忆，再翻答案。连续 2 次秒答 → 退役。

## 🔖 闪卡

| # | 正面（问题） | 背面（答案） | 掌握 |
|---|---|---|---|
| 1 | UI = f(state) 是什么意思？改一条消息你补丁 HTML 吗？ | **同一份 state 算出整份视图**。改 messages，再跑 f，得到新快照，不 incr 拼 HTML | ⬜ |
| 2 | JSP / Thymeleaf 一把梭和本章作业差在哪？ | JSP 在页面里 if/else 出 HTML；Servlet forward 整页。本章纯函数只出 view model，可 \`toEqual\` | ⬜ |
| 3 | 为什么不在函数里 return 一整页 HTML 字符串当「组件」？ | 那是把 JSP 搬进 TS。VM 和 HTML 要分开；贴到 DOM 是 Ch13 的事 | ⬜ |
| 4 | \`shouldShowTime\` 刚好 5 分钟、4 分 59 秒、同一毫秒？ | >= 5*60*1000 为 true；4 分 59 秒 false；同毫秒 false。prev 为 null 则 true | ⬜ |
| 5 | 标题超过 20 字怎么截？恰好 20 呢？省略号写哪个？ | \`slice(0,20)+"…"\`（Unicode …，不是 ...）。恰好 20 不截。没有 user →「新对话」 | ⬜ |
| 6 | 已有气泡且 isLoading=true，空态文案是什么？ | **「助手正在输入…」**。loading 压过 empty，不管 hasMessages | ⬜ |
| 7 | 未读角标数用户自己的「机械键盘有货吗」吗？lastReadId 找不到呢？ | **只数 assistant**。找不到 id 当作 null，全数助手。不含 lastReadId 自己 | ⬜ |
| 8 | \`splitUserAssistant\` 为什么不能 splice 原数组？ | 时间线还在用同一份 messages。filter 出新数组并保序；测 length 不变 | ⬜ |
| 9 | Jinja \`{{ m.content }}\` 和 \`text: msg.content\` 像在哪、差在哪？ | 都是投影数据。Jinja 在服务端灌进 HTML；本章返回对象字段，不出标签 | ⬜ |
| 10 | \`bubbleClassName("user")\` 少写一个 bubble 或多个空格会怎样？ | 测试 \`toBe\` 精确字符串。皮肤是 CSS 的事，函数只负责 class 名 | ⬜ |

## 🎓 费曼自检

- [ ] 能说清 UI = f(state)，对照 JSP / Jinja 一把梭
- [ ] 能说清 view model 与 HTML 分离
- [ ] 能说清未读只数 assistant、loading 优先、截断用 …
`;

const chapter = {
  id: "ch12",
  num: "12",
  title: "组件化心智",
  runMode: "browser",
  tutorialMd,
  assignment,
  testName: "ch12_assignment",
  testSource,
  reviewMd,
  interleaved: true,
  sections,
  functions,
  preamble,
};

const out = join(dirname(fileURLToPath(import.meta.url)), "../src/content/chapters/ch12.json");
mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, JSON.stringify(chapter, null, 2) + "\n");
console.log("wrote", out);
