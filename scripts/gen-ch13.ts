/**
 * 生成 src/content/chapters/ch13.json
 * 运行：bun scripts/gen-ch13.ts
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const preamble = `/**
 * Ch13 作业：商品助手 Chat 的消息 state。
 *
 * 场景：用户发「机械键盘有货吗」，助手流式改最后一条 content，
 * 点删除某条，typing 指示器亮/灭。作业是纯函数，模拟 setState：
 * 每次返回新数组 / 新对象，不要改传入的原结构。
 *
 * 运行器没有 React，禁止 import react。教程里的 JSX 只是心智，不在本题编译。
 *
 * 全绿 = 你掌握了 Ch13。
 */

type ChatRole = "user" | "assistant";

type ChatMessage = {
  id: string;
  role: ChatRole;
  content: string;
};

type ChatState = {
  messages: ChatMessage[];
  typing: boolean;
};

type ChatAction =
  | { type: "append"; message: ChatMessage }
  | { type: "update"; id: string; content: string }
  | { type: "remove"; id: string }
  | { type: "toggleTyping" }
  | { type: "reset" };`;

const functions = [
  {
    name: "appendMessage",
    testSuite: "appendMessage",
    skeleton: `/**
 * 【场景】用户按下发送：「机械键盘有货吗」。要把这条消息接到列表末尾。
 *
 * 【转换点】返回新数组，不要改传入的 messages。
 * Java 的 list.add 会改原 List，JSF/Thymeleaf 还指望你自己重绘；
 * Python 的 list.append 同样改原对象。React 用 Object.is 看引用——
 * 还是那一个数组，就当没变。
 *
 * 任务：返回 [...messages, msg]。禁止 messages.push。
 * 示例：
 *   appendMessage([], { id: "u1", role: "user", content: "机械键盘有货吗" })
 *     -> 新数组 length 1，末尾就是这条；原 [] 仍是空
 *   已有两条（问候 + 追问）再追加第三条商品问句
 *     -> length 3，末尾是新消息；原 length 仍为 2
 *
 * 提示：展开成新数组。不要 push 原数组，不要 splice。
 */
export function appendMessage(messages: ChatMessage[], msg: ChatMessage): ChatMessage[] {
  throw new Error("TODO");
}`,
  },
  {
    name: "updateMessageContent",
    testSuite: "updateMessageContent",
    skeleton: `/**
 * 【场景】助手在流式打字：id="a2" 的气泡从「机」变成「机械键盘库存 120」。
 *
 * 【转换点】map 出新数组。命中的那一条 { ...m, content }（新对象）；
 * 没改的项必须是同一引用（Object.is）。不要写 msg.content = 或 += token。
 *
 * 任务：找到 id 就替换 content；找不到就原样（同一引用或内容等价的拷贝都算对）。
 * 示例：
 *   [u1, a2(content:"机")] 改 a2 → 「机械键盘库存 120」
 *     a2 那项引用变了；u1 引用不变；原数组没被改
 *   [] 改任意 id → []
 *   找不到 id → 内容仍等于原来那份列表
 *
 * 提示：messages.map；命中 return { ...m, content }，否则 return m。
 */
export function updateMessageContent(
  messages: ChatMessage[],
  id: string,
  content: string,
): ChatMessage[] {
  throw new Error("TODO");
}`,
  },
  {
    name: "removeMessage",
    testSuite: "removeMessage",
    skeleton: `/**
 * 【场景】用户点某条气泡上的删除：那条从线程里消失，其它气泡顺序不变。
 *
 * 【转换点】filter 出新数组。不要 splice 原数组。
 * Java 的 iterator.remove / list.remove(i) 改的是同一份 List；
 * Python 的 del lst[i] / lst.remove 也是。React 要新列表。
 *
 * 任务：返回 id !== 的那些项，保序。
 * 示例：
 *   [a, b, c] 删 b → [a, c]，原 length 仍为 3
 *   删不存在的 id → 内容等于原来（length 同）
 *   只剩一条再删掉 → []
 *
 * 提示：messages.filter((m) => m.id !== id)
 */
export function removeMessage(messages: ChatMessage[], id: string): ChatMessage[] {
  throw new Error("TODO");
}`,
  },
  {
    name: "toggleTyping",
    testSuite: "toggleTyping",
    skeleton: `/**
 * 【场景】助手开始生成前亮起「正在输入」；生成结束或用户刚发送则关掉。
 * 本题只负责翻 typing，不碰消息内容。
 *
 * 【转换点】返回 { ...state, typing: !state.typing }。
 * messages 可以保持同一引用（展开 state 时没动它）。
 * 不要写 state.typing = !state.typing。
 *
 * 任务：新 state，typing 取反；原 state.typing 不变。
 * 示例：
 *   { messages, typing: false } → typing true，messages 还是那份
 *   { messages, typing: true }  → typing false
 *
 * 提示：展开对象。不要改传入的 state。
 */
export function toggleTyping(state: ChatState): ChatState {
  throw new Error("TODO");
}`,
  },
  {
    name: "initChatState",
    testSuite: "initChatState",
    skeleton: `/**
 * 【场景】打开商品助手，或点「新对话 / 清空」。要一份空白 ChatState。
 *
 * 【转换点】每次调用都 new 一份 { messages: [], typing: false }。
 * 两次调用的 messages 不能是同一引用——否则一份 [] 被追加后，
 * 另一次 init 也脏了。像 Python 的 def f(x=[]) 默认参数陷阱。
 *
 * 任务：精确返回 { messages: [], typing: false }；每次新数组。
 * 示例：
 *   initChatState() → { messages: [], typing: false }
 *   连调两次：typing 都是 false；Object.is(a.messages, b.messages) === false
 *
 * 提示：不要把 [] 提成模块级常量再反复返回。
 */
export function initChatState(): ChatState {
  throw new Error("TODO");
}`,
  },
  {
    name: "reduceChat",
    testSuite: "reduceChat",
    skeleton: `/**
 * 【场景】Chat 父组件收到一个 action，算出下一份 state。这就是作业版「模拟 setState」。
 * 主线：init → 用户问机械键盘 → typing 亮 → 助手回复库存 → 流式改 content → 删用户那条 → reset。
 *
 * 【转换点】按 action.type 调用前面的函数，不要复制逻辑。
 *   append        → { messages: appendMessage(...), typing: false }
 *                   （刚发完 / 助手刚发出一条，关掉 typing）
 *   update        → { ...state, messages: updateMessageContent(...) }
 *   remove        → { ...state, messages: removeMessage(...) }
 *   toggleTyping  → toggleTyping(state)
 *   reset         → initChatState()
 *   未知 type     → 原 state 同一引用（default: return state）
 *
 * 示例（串起来）：
 *   init 后 messages 空、typing false
 *   append 用户「机械键盘有货吗」→ 1 条
 *   toggleTyping → typing true
 *   append 助手「KB-001 库存 120」→ 2 条且 typing false
 *   update 那条助手 → 「KB-001 库存 120，智能水杯缺货」
 *   remove 用户那条 → 剩助手 1 条
 *   reset → 回到 init
 *
 * 提示：switch (action.type)。未知分支 return state。
 */
export function reduceChat(state: ChatState, action: ChatAction): ChatState {
  throw new Error("TODO");
}`,
  },
];

const assignment = `${preamble}

${functions.map((f) => f.skeleton).join("\n\n")}
`;

const testSource = `const userKb: ChatMessage = {
  id: "u1",
  role: "user",
  content: "机械键盘有货吗",
};
const asstPartial: ChatMessage = {
  id: "a2",
  role: "assistant",
  content: "机",
};
const asstStock: ChatMessage = {
  id: "a2",
  role: "assistant",
  content: "KB-001 库存 120",
};
const greet: ChatMessage = {
  id: "u0",
  role: "user",
  content: "你好",
};
const askWhich: ChatMessage = {
  id: "a0",
  role: "assistant",
  content: "请问想查哪件商品",
};

function freezeMsgs(messages: ChatMessage[]): ChatMessage[] {
  for (const m of messages) Object.freeze(m);
  Object.freeze(messages);
  return messages;
}

function freezeState(state: ChatState): ChatState {
  freezeMsgs(state.messages);
  Object.freeze(state);
  return state;
}

describe("appendMessage", () => {
  it("空数组追加一条商品问句", () => {
    const orig: ChatMessage[] = [];
    freezeMsgs(orig);
    const next = appendMessage(orig, userKb);
    expect(orig.length).toBe(0);
    expect(next.length).toBe(1);
    expect(next[0]).toEqual(userKb);
    expect(Object.is(next, orig)).toBe(false);
  });
  it("两条再追加第三条（商品问句）", () => {
    const orig = freezeMsgs([greet, askWhich]);
    const next = appendMessage(orig, userKb);
    expect(orig.length).toBe(2);
    expect(next.length).toBe(3);
    expect(next[0]).toEqual(greet);
    expect(next[1]).toEqual(askWhich);
    expect(next[2]).toEqual(userKb);
    expect(Object.is(next, orig)).toBe(false);
  });
  it("freeze 后原数组未被 mutate", () => {
    const orig = freezeMsgs([{ id: "x", role: "user", content: "无线鼠标有货吗" }]);
    const snapshot = orig.map((m) => ({ ...m }));
    const next = appendMessage(orig, userKb);
    expect(orig).toEqual(snapshot);
    expect(orig.length).toBe(1);
    expect(next.length).toBe(2);
    expect(next[1].content).toBe("机械键盘有货吗");
  });
});

describe("updateMessageContent", () => {
  it("改 a2 从 机 到 机械键盘库存 120；引用规则", () => {
    const orig = freezeMsgs([userKb, asstPartial]);
    const next = updateMessageContent(orig, "a2", "机械键盘库存 120");
    expect(orig.length).toBe(2);
    expect(orig[1].content).toBe("机");
    expect(next.length).toBe(2);
    expect(next[1].content).toBe("机械键盘库存 120");
    expect(next[1].id).toBe("a2");
    expect(next[1].role).toBe("assistant");
    expect(Object.is(next[1], orig[1])).toBe(false);
    expect(Object.is(next[0], orig[0])).toBe(true);
  });
  it("改另一条（防硬编码 a2 / 机械键盘）", () => {
    const mouse: ChatMessage = { id: "u9", role: "user", content: "鼠标" };
    const orig = freezeMsgs([mouse, userKb]);
    const next = updateMessageContent(orig, "u9", "无线鼠标 MS-002");
    expect(orig[0].content).toBe("鼠标");
    expect(next[0].content).toBe("无线鼠标 MS-002");
    expect(Object.is(next[0], orig[0])).toBe(false);
    expect(Object.is(next[1], orig[1])).toBe(true);
  });
  it("空列表 + 任意 id → []", () => {
    const orig: ChatMessage[] = [];
    freezeMsgs(orig);
    expect(updateMessageContent(orig, "a2", "x")).toEqual([]);
    expect(orig.length).toBe(0);
  });
  it("找不到 id：内容等价且原数组未被 mutate", () => {
    const orig = freezeMsgs([userKb, asstPartial]);
    const snapshot = orig.map((m) => ({ ...m }));
    const next = updateMessageContent(orig, "nope", "机械键盘库存 120");
    expect(orig).toEqual(snapshot);
    expect(next).toEqual(snapshot);
    expect(next.length).toBe(2);
  });
});

describe("removeMessage", () => {
  it("删中间一条保序", () => {
    const orig = freezeMsgs([greet, userKb, asstStock]);
    const next = removeMessage(orig, "u1");
    expect(orig.length).toBe(3);
    expect(next).toEqual([greet, asstStock]);
    expect(next.length).toBe(2);
  });
  it("删最后一条（防只处理中间）", () => {
    const orig = freezeMsgs([greet, askWhich, userKb]);
    const next = removeMessage(orig, "u1");
    expect(orig.length).toBe(3);
    expect(next).toEqual([greet, askWhich]);
  });
  it("删不存在的 id → 内容等价、length 同", () => {
    const orig = freezeMsgs([userKb, asstStock]);
    const snapshot = orig.map((m) => ({ ...m }));
    const next = removeMessage(orig, "nope");
    expect(orig).toEqual(snapshot);
    expect(next).toEqual(snapshot);
    expect(next.length).toBe(2);
  });
  it("删光 → []，原数组未被 mutate", () => {
    const orig = freezeMsgs([userKb]);
    const next = removeMessage(orig, "u1");
    expect(orig.length).toBe(1);
    expect(next).toEqual([]);
  });
});

describe("toggleTyping", () => {
  it("false → true，messages 同一引用，原 typing 不变", () => {
    const messages = freezeMsgs([userKb]);
    const state = freezeState({ messages, typing: false });
    const next = toggleTyping(state);
    expect(state.typing).toBe(false);
    expect(next.typing).toBe(true);
    expect(Object.is(next.messages, state.messages)).toBe(true);
    expect(state.messages.length).toBe(1);
  });
  it("true → false", () => {
    const messages = freezeMsgs([userKb, asstPartial]);
    const state = freezeState({ messages, typing: true });
    const next = toggleTyping(state);
    expect(state.typing).toBe(true);
    expect(next.typing).toBe(false);
    expect(Object.is(next.messages, state.messages)).toBe(true);
  });
  it("freeze 后原 state 未被 mutate", () => {
    const messages = freezeMsgs([asstStock]);
    const state = freezeState({ messages, typing: false });
    toggleTyping(state);
    expect(state.typing).toBe(false);
    expect(state.messages).toEqual([asstStock]);
  });
});

describe("initChatState", () => {
  it("精确空白 state", () => {
    expect(initChatState()).toEqual({ messages: [], typing: false });
  });
  it("两次调用 messages 不是同一引用，typing 都是 false", () => {
    const a = initChatState();
    const b = initChatState();
    expect(a.typing).toBe(false);
    expect(b.typing).toBe(false);
    expect(Object.is(a.messages, b.messages)).toBe(false);
    expect(a.messages).toEqual([]);
    expect(b.messages).toEqual([]);
  });
  it("freeze 一份不影响另一次 init", () => {
    const a = initChatState();
    freezeState(a);
    const b = initChatState();
    expect(a).toEqual({ messages: [], typing: false });
    expect(b).toEqual({ messages: [], typing: false });
    expect(Object.is(a.messages, b.messages)).toBe(false);
  });
});

describe("reduceChat", () => {
  it("综合：init→问机械键盘→typing→助手库存→改 content→删用户→reset", () => {
    let s = initChatState();
    expect(s).toEqual({ messages: [], typing: false });

    s = reduceChat(s, { type: "append", message: userKb });
    expect(s.messages).toEqual([userKb]);
    expect(s.typing).toBe(false);

    s = reduceChat(s, { type: "toggleTyping" });
    expect(s.typing).toBe(true);
    expect(s.messages.length).toBe(1);

    s = reduceChat(s, { type: "append", message: asstStock });
    expect(s.typing).toBe(false);
    expect(s.messages.length).toBe(2);
    expect(s.messages[1]).toEqual(asstStock);

    s = reduceChat(s, { type: "update", id: "a2", content: "KB-001 库存 120，智能水杯缺货" });
    expect(s.messages[1].content).toBe("KB-001 库存 120，智能水杯缺货");
    expect(s.messages[0]).toEqual(userKb);
    expect(s.typing).toBe(false);

    s = reduceChat(s, { type: "remove", id: "u1" });
    expect(s.messages.length).toBe(1);
    expect(s.messages[0].id).toBe("a2");
    expect(s.messages[0].content).toBe("KB-001 库存 120，智能水杯缺货");

    s = reduceChat(s, { type: "reset" });
    expect(s).toEqual({ messages: [], typing: false });
  });
  it("append 会关掉 typing；freeze 初始 state 不被 mutate", () => {
    const frozen = freezeState({ messages: [userKb], typing: true });
    const next = reduceChat(frozen, { type: "append", message: asstStock });
    expect(frozen.typing).toBe(true);
    expect(frozen.messages.length).toBe(1);
    expect(next.typing).toBe(false);
    expect(next.messages.length).toBe(2);
    expect(next.messages[1]).toEqual(asstStock);
  });
  it("update / remove 保留 typing；reset 后 messages 空", () => {
    const base = freezeState({ messages: [userKb, asstStock], typing: true });
    const updated = reduceChat(base, { type: "update", id: "a2", content: "智能水杯缺货" });
    expect(base.messages[1].content).toBe("KB-001 库存 120");
    expect(updated.typing).toBe(true);
    expect(updated.messages[1].content).toBe("智能水杯缺货");

    const removed = reduceChat(base, { type: "remove", id: "u1" });
    expect(base.messages.length).toBe(2);
    expect(removed.typing).toBe(true);
    expect(removed.messages).toEqual([asstStock]);

    const reset = reduceChat(base, { type: "reset" });
    expect(base.messages.length).toBe(2);
    expect(reset).toEqual({ messages: [], typing: false });
  });
  it("未知 type 返回原 state 同一引用", () => {
    const state = freezeState({ messages: [userKb], typing: true });
    const next = reduceChat(state, { type: "nope" } as ChatAction);
    expect(Object.is(next, state)).toBe(true);
    expect(state.typing).toBe(true);
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
    `> **预计**：1 天 ｜ **前置**：Ch12（组件化心智，UI = \`f(state)\`）
> **目标**：① props 向下传；② state 留在拥有者内部；③ **不要直接改数组**。
> 你 15 年 Java：props ≈ 方法参数 / 不可变 DTO 往下传；state ≈ 对象内部字段——但 **不要 \`list.add\` 再指望 JSF 自动重绘**，要交一份新列表。

> 📐 **本教程的契约**：下面每一节（§13.1–§13.6）都**精确对应**作业里的题。讲过的才考，考的必讲过。卡住时按作业函数名回查对应小节。
> **不讲**：hooks 深水（Ch14）、Redux、Next.js。作业里的 \`reduceChat\` 是你自己写的纯函数，不是某个 React API。

---`,
    [],
  ),
  sec(
    "sec-map",
    "🗺️ 本章地图",
    null,
    `本章作业是一条完整主线：**商品助手 Chat 的消息 state**。用户问机械键盘有没有货，助手流式改最后一条 \`content\`，点删除某条，typing 指示器亮灭。6 个函数，全部是纯函数；教程给 JSX 示例，作业**不 import react**（运行器没有 React）。

读完这章 + 完成作业，你将能够：

- 说出 props 为什么只能向下、子组件为什么不能改父的列表
- 用 \`[...arr]\` / \`map\` / \`filter\` / \`{...obj}\` 做不可变更新
- 解释 \`messages.push\` 和 \`msg.content += token\` 为什么是祸害
- 流式改气泡时：改中的那条是新对象，没改的项保持同一引用
- 用自己的 \`reduceChat(state, action)\` 串起 append / update / remove / typing / reset

**作业 ↔ 教程对应表**（学哪节，就去做哪题）：

| 作业题 | 对应小节 | 核心知识点 |
|--------|----------|-----------|
| \`appendMessage\` | §13.1 | 不可变追加（新数组，不 push 原数组） |
| \`updateMessageContent\` | §13.2 | map 出新数组；改中的那条也是新对象 |
| \`removeMessage\` | §13.3 | filter 删除 |
| \`toggleTyping\` | §13.4 | 返回新 state，翻 typing |
| \`initChatState\` | §13.5 | 初始 state |
| \`reduceChat\` | §13.6 | 综合：按 action 调前面函数 |

---`,
    [],
  ),
  sec(
    "sec-path",
    "⏱️ 学习路径：费曼五步（约 50–70 分钟）",
    null,
    `| 步 | 你要做 | 在哪做 |
|----|--------|--------|
| ① 预览猜（2 分钟） | 看下面的差异，先猜 TS / React 怎么实现 | 本页 ① |
| ② 先动手 | 每节后面的编辑器里**先试着写** | 本节练习 |
| ③ 提取+反馈 | 点「运行测试」看红绿 | 本节练习 |
| ④ 费曼（2 分钟） | 大白话讲清「为什么不能 push」 | 本页 ④ |
| ⑤ 存闪卡 | 章末闪卡标复习日期 | 闪卡 |

> 💡 别从头读到尾。先扫 ① → 写作业 → **哪题卡了，回对应 § 查** → 改 → 再跑。
> 前五题都是小纯函数；\`reduceChat\` **必须调用**它们，不要把逻辑再抄一遍。

---`,
    [],
  ),
  sec(
    "sec-guess",
    "① 预览猜（2 分钟 · 激活你的 Java / Python 直觉）",
    null,
    `先别看答案，凭经验猜一猜（猜错没关系）：

1. Java 方法 \`void paint(ProductDto p)\` 里改 \`p.name\`，调用方手里的 DTO 会变吗？React 的 **props** 允许子组件这样改吗？
2. Python \`messages.append(msg)\` 之后，所有指向这个 list 的变量都能看见新元素。\`messages.push(msg)\` 之后，React 为什么可能**不重绘**，或者测出来原数组被污染？
3. 流式打字：助手气泡 \`content\` 从 \`"机"\` 变成 \`"机械键盘库存 120"\`。是 \`msg.content += token\`，还是换成一个新对象？
4. \`<Bubble role={msg.role} text={msg.content} />\` 能不能自己往父组件的 \`messages\` 里加一条？谁才有资格改列表？
5. 点删除某条，Java 的 \`list.remove(i)\` 和 TS 的 \`filter\` 差在哪？原数组 length 应不应该变？
6. \`typing\` 从 false 翻成 true，要不要新建一份 \`messages\` 数组？

> 猜完，带着验证心态进入正文。第 2、3 题是本章的 🔴。

---`,
    [],
  ),
  sec(
    "sec-world",
    "props 向下、state 在内部 🔴",
    null,
    `Ch12 说 UI = \`f(state)\`。本章补上 **谁持有 state、怎么往下传、怎么更新**。

| | Java | Python | 本章 React 心智 |
|---|---|---|---|
| 往下传的数据 | 方法参数 / 不可变 DTO | 函数参数 | **props**：父 → 子，只读 |
| 组件自己记得的 | 对象字段，\`this.items.add\` | \`self.messages.append\` | **state**：留在拥有者内部 |
| 改列表 | \`list.add\` 然后自己重绘 JSF | \`append\` 改原 list | **新数组**；同一引用 = 没变 |

### 商品气泡（教程示例，作业不跑 JSX）

父组件拿着 \`ChatState\`，子组件只收它需要的字段：

\`\`\`tsx
function Bubble(props: { role: ChatRole; text: string }) {
  return <div className={props.role}>{props.text}</div>;
}

function ChatThread(props: { messages: ChatMessage[] }) {
  return (
    <ul>
      {props.messages.map((msg) => (
        <Bubble key={msg.id} role={msg.role} text={msg.content} />
      ))}
    </ul>
  );
}
\`\`\`

- **props 向下**：\`Bubble\` 只看到 \`role\` / \`text\`，没有整份 \`messages\`。
- **state 在拥有者内部**：谁 \`append\` / \`remove\`，只有持有 \`ChatState\` 的父组件。
- \`Bubble\` 里就算想 \`props.text += "…"\` 也改不了父的列表——而且作业里我们根本不这么干。

虚拟 DOM（**不考**）：React 用一棵轻量树对比新旧 UI，再去改真实 DOM。记住 **UI = f(新 state)** 即可。

\`\`\`mermaid
flowchart LR
    act["action"] --> rd["reduceChat"]
    rd --> nxt["新 state"]
    nxt --> parent["父组件持有"]
    parent -->|"props 向下"| bubble["Bubble 只读"]

    style act fill:#80DEEA,stroke:#0097A7,color:#1f1f1f
    style rd fill:#A5D6A7,stroke:#388E3C,color:#1f1f1f
    style nxt fill:#A5D6A7,stroke:#388E3C,color:#1f1f1f
    style parent fill:#FFE082,stroke:#F9A825,color:#1f1f1f
    style bubble fill:#CE93D8,stroke:#7B1FA2,color:#1f1f1f
\`\`\`

真实 React 里「排队一次重绘」叫 setState；**作业用纯函数** \`reduceChat(state, action)\` 算出下一份 state，测试才能在没有 React 的运行器里全绿。

### 电商主线

\`PRODUCTS[0]\` 是机械键盘（\`KB-001\`，库存 120），\`PRODUCTS[8]\` 是智能水杯（\`CP-009\`，库存 0）。用户发「机械键盘有货吗」→ 助手先吐 \`"机"\` 再改成库存文案 → 再补一句水杯缺货 → 用户删掉自己那条 → \`reset\` 新对话。

### 本课怎么算「会了」

测试会 \`Object.freeze\` 原数组 / 原 state。你若 \`push\` / 直接改字段，不是抛错就是原 length / 原 content 对不上。**全绿 = 这题掌握。**

---`,
    [],
  ),
  sec(
    "sec-13.1",
    "§13.1 不可变追加（对应：`appendMessage`）🔴",
    "13.1",
    `### Java 对照：\`list.add\` 不是「交一份新列表」

\`\`\`java
messages.add(msg); // 改的是同一份 ArrayList
// JSF 不会因为你 add 了就自动当「新模型」
\`\`\`

### Python 对照：\`append\` 改原对象

\`\`\`python
messages.append(msg)  # 所有引用都看见新元素
\`\`\`

### TypeScript：展开成新数组

\`\`\`ts
function appendMessage(messages: ChatMessage[], msg: ChatMessage): ChatMessage[] {
  return [...messages, msg];
}

appendMessage([], { id: "u1", role: "user", content: "机械键盘有货吗" });
// 新数组 length 1；原 [] 仍是空

const two = [greet, askWhich];
appendMessage(two, { id: "u1", role: "user", content: "机械键盘有货吗" });
// length 3；two.length 仍为 2
\`\`\`

测试会 freeze 原数组，再查 \`orig.length\` 没变、新数组末尾是新消息。

### ❌ / ✅

\`\`\`ts
// ❌ messages.push(msg); return messages;
// ❌ messages.splice(messages.length, 0, msg);
// ✅ return [...messages, msg];
\`\`\`

> ✅ **做 \`appendMessage\`**：新数组，末尾接上 \`msg\`。

---`,
    ["appendMessage"],
  ),
  sec(
    "sec-13.2",
    "§13.2 流式改 content（对应：`updateMessageContent`）🔴",
    "13.2",
    `助手一条消息的 \`id\` 不变，\`content\` 从 \`"机"\` 长到 \`"机械键盘库存 120"\`。这不是「改字符串变量」，是 **换掉那一个对象**。

### Java / Python：原地改字段

\`\`\`java
msg.setContent(msg.getContent() + token); // 同一对象
\`\`\`

\`\`\`python
msg.content += token  # 同一 dict / 同一对象
\`\`\`

React 用引用比较：还是那一个 \`msg\`，可能当没变，气泡不更新；即便碰巧更新了，测试 freeze 也会拆穿你。

### TypeScript：\`map\` + 展开那一项

\`\`\`ts
function updateMessageContent(
  messages: ChatMessage[],
  id: string,
  content: string,
): ChatMessage[] {
  return messages.map((m) => (m.id === id ? { ...m, content } : m));
}
\`\`\`

规则：

- 命中的那一项：**新对象**（\`Object.is\` 为 false）
- 没改的项：**同一引用**（\`u1\` 还是原来那个）
- 找不到 id：内容等价即可（同一引用或拷贝都行）；空列表 → \`[]\`

\`\`\`ts
const u1 = { id: "u1", role: "user", content: "机械键盘有货吗" };
const a2 = { id: "a2", role: "assistant", content: "机" };
updateMessageContent([u1, a2], "a2", "机械键盘库存 120");
// next[1].content === "机械键盘库存 120"
// Object.is(next[1], a2) === false
// Object.is(next[0], u1) === true
\`\`\`

### ❌ / ✅

\`\`\`ts
// ❌ msg.content += token
// ❌ msg.content = content; return messages;
// ❌ map 时每一项都 {...m}（没改的引用也断了——测试会查 u1 必须同一引用）
// ✅ 命中 { ...m, content }，否则原样返回 m
\`\`\`

> ✅ **做 \`updateMessageContent\`**：\`map\`；只换中的那一条。

---`,
    ["updateMessageContent"],
  ),
  sec(
    "sec-13.3",
    "§13.3 filter 删除（对应：`removeMessage`）🟡",
    "13.3",
    `点气泡上的删除：那条消失，**剩下的保序**。

### Java：\`remove(i)\` 改原 List

\`\`\`java
list.remove(1); // 后面的元素前移，还是同一份 list
\`\`\`

### Python：\`del\` / \`remove\`

\`\`\`python
del messages[i]
# 或 messages.remove(msg)
\`\`\`

### TypeScript：\`filter\` 出新数组

\`\`\`ts
function removeMessage(messages: ChatMessage[], id: string): ChatMessage[] {
  return messages.filter((m) => m.id !== id);
}

removeMessage([a, b, c], b.id); // [a, c]，原 length 仍为 3
removeMessage([a, b], "nope");  // 内容仍是 [a, b]
removeMessage([a], a.id);       // []
\`\`\`

找不到 id：结果 \`toEqual\` 原内容，length 相同。不要 \`splice\`。

### ❌ / ✅

\`\`\`ts
// ❌ messages.splice(i, 1); return messages;
// ❌ 倒序自己挪元素改原数组
// ✅ filter；原数组 freeze 后 length 不变
\`\`\`

> ✅ **做 \`removeMessage\`**：\`id !==\` 的留下，保序。

---`,
    ["removeMessage"],
  ),
  sec(
    "sec-13.4",
    "§13.4 翻 typing（对应：`toggleTyping`）🟢",
    "13.4",
    `「正在输入」是 ChatState 上的布尔字段，不是一条消息。翻它的时候 **不必** 复制 \`messages\` 数组——展开 state 时原样带着那份引用即可。

### Java / Python：改字段

\`\`\`java
state.typing = !state.typing; // 同一对象
\`\`\`

\`\`\`python
self.typing = not self.typing
\`\`\`

### TypeScript：展开出新 state

\`\`\`ts
function toggleTyping(state: ChatState): ChatState {
  return { ...state, typing: !state.typing };
}
\`\`\`

\`false → true\`，\`true → false\`。测试 freeze \`state\` 和 \`state.messages\`：调用后 **原 \`typing\` 不变**；\`Object.is(next.messages, state.messages)\` 为 true。

### ❌ / ✅

\`\`\`ts
// ❌ state.typing = !state.typing; return state;
// ❌ 顺手 messages: [...state.messages]（没必要；测试允许同一引用）
// ✅ { ...state, typing: !state.typing }
\`\`\`

> ✅ **做 \`toggleTyping\`**：新对象，只翻 \`typing\`。

---`,
    ["toggleTyping"],
  ),
  sec(
    "sec-13.5",
    "§13.5 初始 state（对应：`initChatState`）🟡",
    "13.5",
    `打开助手，或点「新对话」，要一份 **空白** \`ChatState\`。

### Python 默认参数陷阱

\`\`\`python
def init(messages=[]):  # 所有调用共用一个 list
    return {"messages": messages, "typing": False}
\`\`\`

TS 里把 \`const EMPTY: ChatMessage[] = []\` 提成模块级常量再反复返回，是同一类祸害：第一次追加会污染「所有 init」。

### TypeScript：每次新数组

\`\`\`ts
function initChatState(): ChatState {
  return { messages: [], typing: false };
}

const a = initChatState();
const b = initChatState();
// a、b 都是 { messages: [], typing: false }
// Object.is(a.messages, b.messages) === false
\`\`\`

精确形状：\`messages\` 空数组，\`typing\` 为 \`false\`。不要返回 \`null\` / 省略字段。

### ❌ / ✅

\`\`\`ts
// ❌ 模块级 const EMPTY = []；每次 { messages: EMPTY, typing: false }
// ❌ 漏 typing，或 typing: true
// ✅ 每次字面量 { messages: [], typing: false }
\`\`\`

> ✅ **做 \`initChatState\`**：每次全新空白 state。

---`,
    ["initChatState"],
  ),
  sec(
    "sec-13.6",
    "§13.6 按 action 归约（对应：`reduceChat`）🔴",
    "13.6",
    `父组件不散落五处 \`if\` 去改列表，而是 **一个入口**：\`reduceChat(state, action)\`。这是作业版的 reducer——**自己写的纯函数**，不是在学某个 hook 名字。

必须 **调用** §13.1–§13.5 的函数，不要把 \`[...]\` / \`map\` / \`filter\` 再抄一遍。

| \`action.type\` | 下一份 state |
|---|---|
| \`"append"\` | \`{ messages: appendMessage(state.messages, action.message), typing: false }\`（刚发完就关 typing） |
| \`"update"\` | \`{ ...state, messages: updateMessageContent(state.messages, action.id, action.content) }\` |
| \`"remove"\` | \`{ ...state, messages: removeMessage(state.messages, action.id) }\` |
| \`"toggleTyping"\` | \`toggleTyping(state)\` |
| \`"reset"\` | \`initChatState()\` |
| 未知 | \`return state\`（**同一引用**） |

\`\`\`ts
function reduceChat(state: ChatState, action: ChatAction): ChatState {
  switch (action.type) {
    case "append":
      return { messages: appendMessage(state.messages, action.message), typing: false };
    case "update":
      return { ...state, messages: updateMessageContent(state.messages, action.id, action.content) };
    case "remove":
      return { ...state, messages: removeMessage(state.messages, action.id) };
    case "toggleTyping":
      return toggleTyping(state);
    case "reset":
      return initChatState();
    default:
      return state;
  }
}
\`\`\`

\`\`\`mermaid
flowchart TD
    a["reduceChat"] --> t{"action.type"}
    t -->|"append"| ap["appendMessage 且 typing 关"]
    t -->|"update"| up["update<br/>Message<br/>Content"]
    t -->|"remove"| rm["remove<br/>Message"]
    t -->|"toggleTyping"| tg["toggleTyping"]
    t -->|"reset"| rs["initChat<br/>State"]
    t -->|"未知"| sam["原 state 同一引用"]

    style a fill:#FFE082,stroke:#F9A825,color:#1f1f1f
    style t fill:#80DEEA,stroke:#0097A7,color:#1f1f1f
    style ap fill:#A5D6A7,stroke:#388E3C,color:#1f1f1f
    style up fill:#A5D6A7,stroke:#388E3C,color:#1f1f1f
    style rm fill:#A5D6A7,stroke:#388E3C,color:#1f1f1f
    style tg fill:#80DEEA,stroke:#0097A7,color:#1f1f1f
    style rs fill:#CE93D8,stroke:#7B1FA2,color:#1f1f1f
    style sam fill:#EF9A9A,stroke:#C62828,color:#1f1f1f
\`\`\`

综合主线（测试必跑）：

1. \`initChatState()\`
2. append 用户「机械键盘有货吗」
3. \`toggleTyping\` → \`true\`
4. append 助手「KB-001 库存 120」且 typing 变 \`false\`
5. update 那条助手 → 「KB-001 库存 120，智能水杯缺货」
6. remove 用户那条
7. \`reset\` 回到 init

测试会 freeze 初始 state：\`reduceChat\` 不得 mutate 它。

### ❌ / ✅

\`\`\`ts
// ❌ 在 reduceChat 里再写一遍 push / splice / 改 content
// ❌ append 之后还把 typing 留着 true
// ❌ 未知 type 返回 { ...state }（新对象，不是同一引用）
// ✅ switch + 调用前面五个函数；default return state
\`\`\`

> ✅ **做 \`reduceChat\`**：按表调用；综合主线一次过。

---`,
    ["reduceChat"],
  ),
  sec(
    "sec-pits",
    "⚠️ Java / Python 老手几个坑",
    null,
    `1. **\`push\` / \`list.add\` / \`append\` 改原数组。** React 看引用；测试 freeze。用 \`[...arr, msg]\`。
2. **\`msg.content += token\`。** 流式更新要新对象 \`{ ...m, content }\`，没改的项保持同一引用。
3. **\`splice\` 删除。** 用 \`filter\`，原 length 必须还能对上。
4. **子组件没有资格改列表。** \`<Bubble role={msg.role} text={msg.content} />\` 只吃 props；父才 \`reduceChat\`。
5. **模块级空数组当 init。** 两次 \`initChatState\` 的 \`messages\` 必须不是同一引用。
6. **append 忘了关 typing。** 约定：刚发出一条消息 → \`typing: false\`。
7. **未知 action 返回拷贝。** \`default: return state\`，要同一引用。
8. **作业 import react。** 运行器没有 React；JSX 只出现在教程里。
9. **不要 \`list.add\` 再指望 JSF 重绘。** 新列表、新 state，UI 才是 \`f(新 state)\`。
10. **不讲 hooks 深水、Redux、Next.js。** 看见别慌，本章不考。

---`,
    [],
  ),
  sec(
    "sec-homework",
    "📝 本章作业",
    null,
    `上面 6 个函数按节交错出现。每个注释里有【场景】【转换点】、示例和提示。

**完成方式**：在编辑器里改 \`throw new Error("TODO")\`，点「▶ 运行测试」。全绿 = 这题过了。

卡住就回对应 §：\`appendMessage\` → §13.1，\`updateMessageContent\` → §13.2，\`reduceChat\` → §13.6（请复用前五题）。

提示只点知识点：\`[...arr]\` / \`map\` / \`filter\` / \`{...obj}\`。不要 push、不要 splice、不要直接 \`msg.content =\`。

---`,
    [],
  ),
  sec(
    "sec-check",
    "✅ 自测：你真的掌握了吗？",
    null,
    `- [ ] 能说清 props 向下、state 留在父组件，\`Bubble\` 为什么不能改列表
- [ ] 能写出 \`[...messages, msg]\`，并解释 freeze 之后原 length 为什么不能变
- [ ] 流式改 content 时，中的那条是新对象、\`u1\` 仍是同一引用
- [ ] \`filter\` 删除保序；找不到 id 时内容仍等价
- [ ] \`toggleTyping\` 只翻布尔，\`messages\` 引用可不变
- [ ] 两次 \`initChatState\` 不共享同一个 \`[]\`
- [ ] \`reduceChat\` 按 action 调用前面的函数，append 会关 typing，reset 回到空白
- [ ] 6 个作业全绿

---`,
    [],
  ),
  sec(
    "sec-feynman",
    "🎓 费曼挑战",
    null,
    `用大白话讲给「Java 同事」听。讲不清 = 还没真懂。

任选一题（1–2 分钟）：

1. 「props 往下传、state 在谁手里？为什么 \`<Bubble role={msg.role} text={msg.content} />\` 不能自己 \`push\` 一条消息？」— 卡壳重读总述 + §13.1
2. 「为什么不能 \`messages.push\`，也不能 \`msg.content += token\`？\`map\` 出新对象时，没改的那几条为什么要保持同一引用？」— 卡壳重读 §13.1 + §13.2
3. 「\`reduceChat\` 收到 action 之后为什么必须返回**新** state？\`reset\` 和把原数组 \`clear()\` 差在哪？」— 卡壳重读 §13.5 + §13.6

---`,
    [],
  ),
  sec(
    "sec-next",
    "⏭️ 下一步",
    null,
    `Ch13 掌握后，进 **Ch14 · hooks 心智**。本章解决「props / state / 不可变更新」；下一章解决「什么时候同步外部系统、依赖变了要不要重跑」——仍然用纯函数表达，不在作业里 import react。\`reduceChat\` 算出的新 state，下一章会接到「渲染之后还要登记 cleanup」的心智上。`,
    [],
  ),
];

const tutorialMd = `# Ch13 · React：组件、props、state 心智

${sections
  .map((s) => (s.heading ? `## ${s.heading}\n\n${s.body}` : s.body))
  .join("\n\n")}
`;

const reviewMd = `# Ch13 · 记忆闪卡

> 先回忆，再翻答案。连续 2 次秒答 → 退役。

## 🔖 闪卡

| # | 正面（问题） | 背面（答案） | 掌握 |
|---|---|---|---|
| 1 | props 往哪传？子组件能不能改父的 \`messages\`？ | **只向下。** \`<Bubble role text />\` 只读 props。改列表是父组件的 state，走 \`reduceChat\` | ⬜ |
| 2 | state 放在哪？和 Java 对象字段 / Python \`self\` 像在哪、不像在哪？ | 在拥有者内部。像字段，但不要 \`list.add\` / \`append\` 再指望重绘——要交**新** state | ⬜ |
| 3 | 不可变更新四个写法？ | \`[...arr]\`、\`map\`、\`filter\`、\`{...obj}\`。返回新数组/新对象 | ⬜ |
| 4 | \`messages.push(msg)\` 的祸害是什么？ | 改原数组。React 用 Object.is 看引用，当没变；测试 freeze 后 length 对不上 | ⬜ |
| 5 | 流式把 \`"机"\` 改成库存文案，为什么不能 \`msg.content += token\`？ | 改中的那条必须是新对象 \`{ ...m, content }\`；没改的项保持同一引用 | ⬜ |
| 6 | \`toggleTyping\` 要不要复制 \`messages\`？ | 不必。\`{ ...state, typing: !state.typing }\`，messages 引用可不变 | ⬜ |
| 7 | 两次 \`initChatState()\` 为什么不能共享同一个 \`[]\`？ | 一份空数组被追加后，另一次 init 也脏。每次 \`{ messages: [], typing: false }\` | ⬜ |
| 8 | \`reduceChat\` 的 append 为什么要把 \`typing\` 设成 false？ | 刚发出一条（用户或助手）视为「说完了」，关掉正在输入。调用 \`appendMessage\`，不要自己 push | ⬜ |
| 9 | \`reset\` 应该干什么？和 \`messages.length = 0\` 差在哪？ | 返回 \`initChatState()\` 全新空白。清空原数组是 mutate，freeze 会拆穿 | ⬜ |
| 10 | 未知 \`action.type\` 返回什么？ | **原 state 同一引用**（\`default: return state\`），不是浅拷贝一份 | ⬜ |

## 🎓 费曼自检

- [ ] 能说清 props 向下、state 在内部
- [ ] 能说清 push / 直接改 content 的祸害，以及 map 时的引用规则
- [ ] 能说清 reduce 综合和 reset 必须是新 state
`;

const chapter = {
  id: "ch13",
  num: "13",
  title: "React：组件、props、state 心智",
  runMode: "browser",
  tutorialMd,
  assignment,
  testName: "ch13_assignment",
  testSource,
  reviewMd,
  interleaved: true,
  sections,
  functions,
  preamble,
};

const out = join(dirname(fileURLToPath(import.meta.url)), "../src/content/chapters/ch13.json");
mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, JSON.stringify(chapter, null, 2) + "\n");
console.log("wrote", out);
