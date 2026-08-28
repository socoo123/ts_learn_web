/**
 * 生成 src/content/chapters/ch15.json
 * 运行：bun scripts/gen-ch15.ts
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const preamble = `/**
 * Ch15 作业：商品助手输入框与消息列表（Chat UI 基础）。
 *
 * 场景：用户在输入框打「机械键盘有货吗」。value 受控、发送前校验、
 * 列表 key 唯一、滚动钉底、气泡按换行拆行，最后构造一条发出的用户消息。
 *
 * 运行器没有 React，禁止 import react。教程里的 JSX 只是心智，不在本题编译。
 *
 * 全绿 = 你掌握了 Ch15。
 */

type ChatRole = "user" | "assistant";

type OutgoingMessage = {
  id: string;
  role: "user";
  content: string;
  ts: number;
};`;

const functions = [
  {
    name: "controlledInputNext",
    testSuite: "controlledInputNext",
    skeleton: `/**
 * 【场景】商品助手输入框是受控的：state 里已有「机」，用户继续打成「机械键盘有货吗」。
 * onChange 拿到 incoming，你算出下一份 value。超长就拒绝，不要悄悄截断。
 *
 * 【转换点】JSP 的 value="<%= prompt %>" 是整页回填；Python WTForms / FastAPI Form
 * 多半提交后再校验。这里每个按键都算 next：incoming 不超长就用它（可以变成 ""），
 * 否则返回 prev。不要 slice。
 *
 * 任务：incoming.length <= maxLen → 返回 incoming；否则返回 prev。
 * 示例：
 *   "机", "机械键盘有货吗", 20 → "机械键盘有货吗"
 *   "hello", "hello!", 5 → "hello"（拒绝溢出，不是 slice 成 "hello"）
 *   "x", "", 5 → ""
 *   "ab", "abc", 0 → "ab"（maxLen 0 只允许空 incoming）
 *   "ab", "", 0 → ""
 *
 * 提示：比长度。超长返回 prev，不要 slice(0, maxLen)。
 */
export function controlledInputNext(prev: string, incoming: string, maxLen: number): string {
  throw new Error("TODO");
}`,
  },
  {
    name: "validatePrompt",
    testSuite: "validatePrompt",
    skeleton: `/**
 * 【场景】用户点发送：「机械键盘有货吗」可以走；空格、超长提示词要拦下来。
 *
 * 【转换点】先 trim，再看长度。Java Bean Validation @Size、Python WTForms Length
 * 也是「去掉首尾空白再判」。这里返回字面量，不抛错。
 *
 * 任务：trim 后长度 0 → "empty"；> 200 → "too_long"；否则 "ok"。
 * 示例：
 *   "  " → "empty"
 *   "机械键盘有货吗" → "ok"
 *   "a" 重复 201 次 → "too_long"
 *   "a" 重复 200 次 → "ok"
 *   "  hi  " → "ok"（trim 后长度 2）
 *
 * 提示：const t = text.trim()；先空再超长。阈值是 > 200，等于 200 仍 ok。
 */
export function validatePrompt(text: string): "ok" | "empty" | "too_long" {
  throw new Error("TODO");
}`,
  },
  {
    name: "trimAndRejectEmpty",
    testSuite: "trimAndRejectEmpty",
    skeleton: `/**
 * 【场景】发送前把「  KB-001  」收成货号；纯空白不要变成空气泡。
 *
 * 【转换点】trim 后若空，用 null 表示拒绝，不用 ""。Python 的 strip() 后再 \`if not s\`
 * 同一思路；这里明确返回 string | null。
 *
 * 任务：trim；空 → null，否则返回去掉首尾空白的字符串。
 * 示例：
 *   "  KB-001  " → "KB-001"
 *   换行+制表符 → null
 *   "机械键盘" → "机械键盘"
 *
 * 提示：trim 一次。长度 0 就 null。
 */
export function trimAndRejectEmpty(text: string): string | null {
  throw new Error("TODO");
}`,
  },
  {
    name: "listKeysUnique",
    testSuite: "listKeysUnique",
    skeleton: `/**
 * 【场景】消息列表 map 出气泡，每条要有唯一 key（通常用消息 id）。
 * ["m1","m2","m1"] 是 React key 重复，气泡会对错人。
 *
 * 【转换点】key 是列表项的身份，不是下标。作业只测「唯一」：
 * new Set(keys).size === keys.length。空数组也算唯一。
 *
 * 任务：没有重复就 true，有重复就 false。
 * 示例：
 *   [] → true
 *   ["m1","m2","m3"] → true
 *   ["m1","m2","m1"] → false
 *   ["m1"] → true
 *
 * 提示：用 Set 比长度。不要用 index 当 key（延伸，本题不考 index）。
 */
export function listKeysUnique(keys: string[]): boolean {
  throw new Error("TODO");
}`,
  },
  {
    name: "scrollPinDecision",
    testSuite: "scrollPinDecision",
    skeleton: `/**
 * 【场景】Chat 列表要不要钉住底部。自己刚发出「机械键盘有货吗」必须看见；
 * 你在往上翻历史时，助手回「KB-001 库存 120」不要把滚动拽下来。
 *
 * 【转换点】userNearBottom || isOwnMessage → "pin"，否则 "stay"。
 * 自己发的永远钉底。
 *
 * 任务：返回 "pin" 或 "stay"。
 * 示例：
 *   (true, false) → "pin"
 *   (false, true) → "pin"
 *   (false, false) → "stay"
 *   (true, true) → "pin"
 *
 * 提示：或运算。不要写成「只有靠近底部才 pin」。
 */
export function scrollPinDecision(
  userNearBottom: boolean,
  isOwnMessage: boolean,
): "pin" | "stay" {
  throw new Error("TODO");
}`,
  },
  {
    name: "renderLines",
    testSuite: "renderLines",
    skeleton: `/**
 * 【场景】助手气泡可能多行：「第一行」换行「第二行」。空气泡没有行。
 *
 * 【转换点】空字符串是「没有内容」，返回 []，不要 [""]。
 * 有内容就按换行拆；末尾换行会多一个空行（split 的常规行为）。
 *
 * 任务：content === "" → []；否则 content.split 换行。
 * 示例：
 *   "KB-001 库存 120" → ["KB-001 库存 120"]
 *   "第一行" + 换行 + "第二行" → ["第一行","第二行"]
 *   "a" + 换行 → ["a", ""]
 *   单独一个换行 → ["", ""]
 *
 * 提示：先拦空串，再 split。不要 trim。
 */
export function renderLines(content: string): string[] {
  throw new Error("TODO");
}`,
  },
  {
    name: "buildOutgoingMessage",
    testSuite: "buildOutgoingMessage",
    skeleton: `/**
 * 【场景】用户点发送。要把输入框里的字变成一条 OutgoingMessage，接到 Ch13 的列表上。
 *
 * 【转换点】综合题：必须调用 validatePrompt 和 trimAndRejectEmpty，不要再 trim 一份。
 *   validatePrompt(text) !== "ok" → null（empty 和 too_long 都拒）
 *   content = trimAndRejectEmpty(text)（ok 时一定非 null；若仍 null 也返回 null）
 *   返回 { id: \`user-\${nowMs}\`, role: "user", content, ts: nowMs }
 *
 * 示例：
 *   "  机械键盘有货吗  ", 1700000000000
 *     → id "user-1700000000000"，content "机械键盘有货吗"，role "user"，ts 即 nowMs
 *   "   " → null
 *   "a" 重复 201 次 → null
 *
 * 提示：先校验再 trim。id 是 "user-" 拼 nowMs。
 */
export function buildOutgoingMessage(text: string, nowMs: number): OutgoingMessage | null {
  throw new Error("TODO");
}`,
  },
];

const assignment = `${preamble}

${functions.map((f) => f.skeleton).join("\n\n")}
`;

const testSource = `describe("controlledInputNext", () => {
  it("未超长：机 → 机械键盘有货吗", () => {
    expect(controlledInputNext("机", "机械键盘有货吗", 20)).toBe("机械键盘有货吗");
  });
  it("超长拒绝，返回 prev（hello! 长度 6 > 5）", () => {
    expect(controlledInputNext("hello", "hello!", 5)).toBe("hello");
  });
  it("超长不 slice：prev 机，incoming 机械键盘有货吗，maxLen 2", () => {
    expect(controlledInputNext("机", "机械键盘有货吗", 2)).toBe("机");
  });
  it("超长不 slice：prev ab，incoming xyz，maxLen 2 不是 xy", () => {
    expect(controlledInputNext("ab", "xyz", 2)).toBe("ab");
  });
  it("允许变成空串", () => {
    expect(controlledInputNext("x", "", 5)).toBe("");
  });
  it("maxLen 0 拒绝非空 incoming，保留 prev", () => {
    expect(controlledInputNext("ab", "abc", 0)).toBe("ab");
  });
  it("maxLen 0 且 incoming 空 → 空串", () => {
    expect(controlledInputNext("ab", "", 0)).toBe("");
  });
  it("刚好等于 maxLen 收下（防硬编码机械键盘）", () => {
    expect(controlledInputNext("无线", "无线鼠标有货吗", 7)).toBe("无线鼠标有货吗");
    expect(controlledInputNext("KB-00", "KB-001", 6)).toBe("KB-001");
  });
});

describe("validatePrompt", () => {
  it("纯空白 → empty", () => {
    expect(validatePrompt("  ")).toBe("empty");
  });
  it("商品问句 → ok", () => {
    expect(validatePrompt("机械键盘有货吗")).toBe("ok");
  });
  it("201 个 a → too_long", () => {
    expect(validatePrompt("a".repeat(201))).toBe("too_long");
  });
  it("200 个 a → ok", () => {
    expect(validatePrompt("a".repeat(200))).toBe("ok");
  });
  it("前后空白但中间有字 → ok", () => {
    expect(validatePrompt("  hi  ")).toBe("ok");
  });
  it("换行制表也算 empty；无线鼠标问句 ok（防硬编码）", () => {
    expect(validatePrompt("\\n\\t")).toBe("empty");
    expect(validatePrompt("无线鼠标有货吗")).toBe("ok");
  });
  it("trim 后再比 200：两侧空白的 201 / 200", () => {
    expect(validatePrompt("  " + "a".repeat(201) + "  ")).toBe("too_long");
    expect(validatePrompt("  " + "a".repeat(200) + "  ")).toBe("ok");
  });
});

describe("trimAndRejectEmpty", () => {
  it("货号两侧空白", () => {
    expect(trimAndRejectEmpty("  KB-001  ")).toBe("KB-001");
  });
  it("换行制表 → null", () => {
    expect(trimAndRejectEmpty("\\n\\t")).toBeNull();
  });
  it("机械键盘原样", () => {
    expect(trimAndRejectEmpty("机械键盘")).toBe("机械键盘");
  });
  it("空串和纯空格 → null；无线鼠标可 trim（防硬编码）", () => {
    expect(trimAndRejectEmpty("")).toBeNull();
    expect(trimAndRejectEmpty("   ")).toBeNull();
    expect(trimAndRejectEmpty("  无线鼠标  ")).toBe("无线鼠标");
  });
});

describe("listKeysUnique", () => {
  it("空数组 true", () => {
    expect(listKeysUnique([])).toBe(true);
  });
  it("三条消息 id 唯一", () => {
    expect(listKeysUnique(["m1", "m2", "m3"])).toBe(true);
  });
  it("React key 重复 m1", () => {
    const keys = ["m1", "m2", "m1"];
    Object.freeze(keys);
    expect(listKeysUnique(keys)).toBe(false);
    expect(keys.length).toBe(3);
  });
  it("单元素 true", () => {
    expect(listKeysUnique(["m1"])).toBe(true);
  });
  it("用户与助手 id 混排：重复 u1 为 false，商品 sku 为 true", () => {
    expect(listKeysUnique(["u1", "a2", "u1"])).toBe(false);
    expect(listKeysUnique(["kb-001", "ms-002", "cp-009"])).toBe(true);
  });
  it("两个空字符串也是重复 key", () => {
    expect(listKeysUnique(["", ""])).toBe(false);
  });
});

describe("scrollPinDecision", () => {
  it("靠近底部、别人的消息 → pin", () => {
    expect(scrollPinDecision(true, false)).toBe("pin");
  });
  it("自己发出（机械键盘问句）即使在翻历史 → pin", () => {
    expect(scrollPinDecision(false, true)).toBe("pin");
  });
  it("往上翻且是助手回复 → stay", () => {
    expect(scrollPinDecision(false, false)).toBe("stay");
  });
  it("靠近底部且是自己发的 → pin", () => {
    expect(scrollPinDecision(true, true)).toBe("pin");
  });
});

describe("renderLines", () => {
  it("空气泡没有行", () => {
    expect(renderLines("")).toEqual([]);
  });
  it("单行库存文案", () => {
    expect(renderLines("KB-001 库存 120")).toEqual(["KB-001 库存 120"]);
  });
  it("两行", () => {
    expect(renderLines("第一行\\n第二行")).toEqual(["第一行", "第二行"]);
  });
  it("末尾换行多一个空行", () => {
    expect(renderLines("a\\n")).toEqual(["a", ""]);
  });
  it("单独一个换行是两行空串", () => {
    expect(renderLines("\\n")).toEqual(["", ""]);
  });
  it("无线鼠标两行（防硬编码 KB-001）", () => {
    expect(renderLines("无线鼠标\\nMS-002")).toEqual(["无线鼠标", "MS-002"]);
  });
});

describe("buildOutgoingMessage", () => {
  it("trim 后构造机械键盘问句", () => {
    expect(buildOutgoingMessage("  机械键盘有货吗  ", 1700000000000)).toEqual({
      id: "user-1700000000000",
      role: "user",
      content: "机械键盘有货吗",
      ts: 1700000000000,
    });
  });
  it("纯空白 → null", () => {
    expect(buildOutgoingMessage("   ", 1)).toBeNull();
  });
  it("201 个 a → null", () => {
    expect(buildOutgoingMessage("a".repeat(201), 2)).toBeNull();
  });
  it("200 个 a 可通过；id 拼 nowMs", () => {
    const content = "a".repeat(200);
    expect(buildOutgoingMessage(content, 99)).toEqual({
      id: "user-99",
      role: "user",
      content,
      ts: 99,
    });
  });
  it("无线鼠标问句（防硬编码机械键盘 / 时间戳）", () => {
    expect(buildOutgoingMessage("  无线鼠标有货吗  ", 42)).toEqual({
      id: "user-42",
      role: "user",
      content: "无线鼠标有货吗",
      ts: 42,
    });
  });
  it("empty 与 too_long 都拒；ok 的 hi 会 trim", () => {
    expect(buildOutgoingMessage("", 3)).toBeNull();
    expect(buildOutgoingMessage("a".repeat(201), 4)).toBeNull();
    expect(buildOutgoingMessage("  hi  ", 5)).toEqual({
      id: "user-5",
      role: "user",
      content: "hi",
      ts: 5,
    });
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
    `> **预计**：1 天 ｜ **前置**：Ch13（props / state / 不可变消息列表）
> **目标**：① 受控输入；② 列表 \`key\`；③ 消息气泡数据。
> 你 15 年 Java：JSP 的 \`<input value="<%= prompt %>">\` 是整页回填；Python：WTForms / FastAPI \`Form\` 多半提交后再校验。Chat 输入框每个按键都要从 state 算出 next。

> 📐 **本教程的契约**：下面每一节（§15.1–§15.7）都**精确对应**作业里的题。讲过的才考，考的必讲过。卡住时按作业函数名回查对应小节。
> **不讲**：Formik、React Hook Form、虚拟列表库、contenteditable。非受控（\`defaultValue\`）本章不考。

---`,
    [],
  ),
  sec(
    "sec-map",
    "🗺️ 本章地图",
    null,
    `本章作业是一条完整主线：**商品助手输入框**。用户问机械键盘库存 → 受控 \`value\` → 发送前校验 → 消息列表 \`key\` → 滚动钉底 → 气泡折行 → 构造发出的用户消息。7 个函数，全部是纯函数；教程给 JSX 示例，作业**不 import react**（运行器没有 React）。

读完这章 + 完成作业，你将能够：

- 说出受控输入：\`value\` 来自 state，\`onChange\` 算出 next
- 超长时**拒绝**（返回 prev），不 \`slice\`
- 发送前 trim：空 / 超长 / ok
- 解释列表 \`key\` 为什么必须唯一（index 当 key 的祸点到为止）
- 判断新消息该钉底还是保持滚动
- 把气泡 \`content\` 按换行拆成行
- 用前面的函数拼出 \`OutgoingMessage\`

**作业 ↔ 教程对应表**（学哪节，就去做哪题）：

| 作业题 | 对应小节 | 核心知识点 |
|--------|----------|-----------|
| \`controlledInputNext\` | §15.1 | 受控输入：incoming 超长则拒绝，保留 prev |
| \`validatePrompt\` | §15.2 | 校验提示词 empty / too_long / ok |
| \`trimAndRejectEmpty\` | §15.3 | trim 后空则 null |
| \`listKeysUnique\` | §15.4 | 列表 key 必须唯一 |
| \`scrollPinDecision\` | §15.5 | 是否钉住底部 |
| \`renderLines\` | §15.6 | 气泡按换行拆成行 |
| \`buildOutgoingMessage\` | §15.7 | 综合：校验+trim 后构造发出的用户消息 |

---`,
    [],
  ),
  sec(
    "sec-path",
    "⏱️ 学习路径：费曼五步（约 50–70 分钟）",
    null,
    `| 步 | 你要做 | 在哪做 |
|----|--------|--------|
| ① 预览猜（2 分钟） | 看 JSP 回填和受控 value 的差别，先猜 TS 怎么算 next | 本页 ① |
| ② 先动手 | 每节后面的编辑器里**先试着写** | 本节练习 |
| ③ 提取+反馈 | 点「运行测试」看红绿 | 本节练习 |
| ④ 费曼（2 分钟） | 大白话讲清「为什么超长不 slice、key 不能重复」 | 本页 ④ |
| ⑤ 存闪卡 | 章末闪卡标复习日期 | 闪卡 |

> 💡 别从头读到尾。先扫 ① → 写作业 → **哪题卡了，回对应 § 查** → 改 → 再跑。
> 前六题都是小纯函数；\`buildOutgoingMessage\` **必须调用** \`validatePrompt\` / \`trimAndRejectEmpty\`，不要把 trim 再抄一遍。

---`,
    [],
  ),
  sec(
    "sec-guess",
    "① 预览猜（2 分钟 · 激活你的 Java / Python 直觉）",
    null,
    `先别看答案，凭经验猜一猜（猜错没关系）：

1. JSP \`<input value="<%= prompt %>">\` 刷新后能看到用户刚打的字，和 React 每个按键都 \`setState\` 差在哪？谁才是受控？
2. 输入框 \`maxLength={5}\` 时，用户打出第 6 个字符。你是 \`slice(0, 5)\`，还是退回上一份 \`value\`？两种对「键盘上刚按下的键」观感有何不同？
3. Python WTForms \`Length(max=200)\`、FastAPI \`Form()\` 一般在什么时候校验？Chat 点发送时，空格算不算空提示词？
4. \`messages.map((m, i) => <Bubble key={i} />)\`，删掉中间一条，后面的气泡可能发生什么？
5. 你在往上翻「上周问过的无线鼠标」，助手这时回「KB-001 库存 120」，滚动条该不该被拽到底？
6. 空气泡 \`content === ""\` 拆行，该是 \`[]\` 还是 \`[""]\`？

> 猜完，带着验证心态进入正文。第 1、2、4 题是本章的 🔴。

---`,
    [],
  ),
  sec(
    "sec-world",
    "受控输入、列表 key、气泡数据 🔴",
    null,
    `Ch13 把消息列表做成不可变 state。本章补上 **输入框怎么进 state、发出去之前怎么校验、列表怎么认人、滚动钉不钉底、气泡怎么折行**。

| | Java | Python | 本章 React 心智 |
|---|---|---|---|
| 输入框的值 | JSP \`value="<%= prompt %>"\` 整页回填 | WTForms 字段 / FastAPI \`Form()\` 提交后才拿到 | **受控**：\`value\` 来自 state，\`onChange\` 算出 next |
| 校验 | Bean Validation，多在提交进 Controller | WTForms / Pydantic，多在 POST | 发送前纯函数：empty / too_long / ok |
| 列表项身份 | JSF \`id\` / 表格行号 | Django 模板 \`forloop.counter\` | **\`key\`**：稳定身份，不要用 index |
| 滚动 | 自己写 JS，或不管 | 自己写 JS，或不管 | Chat 常识：自己发的钉底；翻历史时别拽 |

### 商品输入框（教程示例，作业不跑 JSX）

父组件拿着 \`value\`，每次按键用纯函数算 next：

\`\`\`tsx
function PromptBox(props: {
  value: string;
  maxLen: number;
  onChange: (next: string) => void;
}) {
  return (
    <input
      value={props.value}
      onChange={(e) => {
        const next = controlledInputNext(props.value, e.target.value, props.maxLen);
        props.onChange(next);
      }}
    />
  );
}
\`\`\`

- **受控**：屏幕上显示的永远是 \`props.value\`，不是 input 自己藏的一份 DOM 值。
- **onChange 算出 next**：超长则 next === 上一份 value，输入框「弹回」，不会悄悄截成半句「机械键」。
- 非受控（\`defaultValue\`）本章不考。

点发送时：校验 → trim → 构造 \`OutgoingMessage\` → 交给 Ch13 的 \`appendMessage\`。

\`\`\`mermaid
flowchart TD
    inp["输入机械键盘问句"] --> nxt["受控 next"]
    nxt --> val{"validatePrompt?"}
    val -->|"empty / too_long"| rej["拒绝发送"]
    val -->|"ok"| tr["trim 后取 content"]
    tr --> out["构造 user 消息"]
    out --> app["append 到列表"]

    style inp fill:#FFE082,stroke:#F9A825,color:#1f1f1f
    style nxt fill:#80DEEA,stroke:#0097A7,color:#1f1f1f
    style val fill:#80DEEA,stroke:#0097A7,color:#1f1f1f
    style rej fill:#EF9A9A,stroke:#C62828,color:#1f1f1f
    style tr fill:#CE93D8,stroke:#7B1FA2,color:#1f1f1f
    style out fill:#A5D6A7,stroke:#388E3C,color:#1f1f1f
    style app fill:#A5D6A7,stroke:#388E3C,color:#1f1f1f
\`\`\`

### 电商主线

用户在输入框打「机械键盘有货吗」（\`KB-001\`，库存 120）。受控 value 跟着每个键变；点发送先 \`validatePrompt\`，再 trim 成 content，\`id\` 用 \`user-\${nowMs}\`。列表用消息 id 当 \`key\`。自己发出去滚动 \`pin\`；若你在翻历史，助手回库存文案则 \`stay\`。气泡里若有换行，\`renderLines\` 拆成行。

### 本课怎么算「会了」

测试会查：超长时返回的是 **prev** 不是 \`slice\` 结果；trim 后空是 \`"empty"\` / \`null\`；重复 \`key\` 为 false；空气泡行数是 \`[]\`。**全绿 = 这题掌握。**

---`,
    [],
  ),
  sec(
    "sec-15.1",
    "§15.1 受控输入（对应：`controlledInputNext`）🔴",
    "15.1",
    `受控的意思：**屏幕上的字 = state**。每个按键，\`onChange\` 拿到 \`incoming\`，你返回下一份 value。

### Java 对照：JSP 回填不是每个按键

\`\`\`jsp
<%-- 整页 POST 回来才把 prompt 填进 value，不是逐键 setState --%>
<input type="text" name="prompt" value="<%= prompt %>" />
\`\`\`

JSP 擅长「请求结束时把模型写回表单」。Chat 输入框要的是：打「机」的时候 state 已经是 \`"机"\`。

### Python 对照：WTForms / FastAPI Form

\`\`\`python
from wtforms import Form, StringField, validators

class PromptForm(Form):
    prompt = StringField(validators=[validators.Length(max=20)])
\`\`\`

\`\`\`python
from fastapi import Form

@app.post("/ask")
async def ask(prompt: str = Form()):
    return {"prompt": prompt}
\`\`\`

它们通常在 **提交** 时才看到完整字符串。本章的 \`controlledInputNext\` 在每个按键都跑。

### TypeScript：incoming 合法就用，否则 prev

\`\`\`ts
function controlledInputNext(prev: string, incoming: string, maxLen: number): string {
  return incoming.length <= maxLen ? incoming : prev;
}

controlledInputNext("机", "机械键盘有货吗", 20); // "机械键盘有货吗"
controlledInputNext("hello", "hello!", 5);       // "hello"
controlledInputNext("x", "", 5);                 // ""
controlledInputNext("ab", "abc", 0);             // "ab"
controlledInputNext("ab", "", 0);                // ""
\`\`\`

**不要 slice。** \`incoming.slice(0, maxLen)\` 会留下用户没想要的半截：\`prev\` 是 \`"机"\`、\`incoming\` 是 \`"机械键盘有货吗"\`、\`maxLen\` 是 2 时，slice 得到 \`"机械"\`，正确是退回 \`"机"\`。

\`maxLen === 0\` 只允许空 \`incoming\`：此时 next 可以是 \`""\`。

### ❌ / ✅

\`\`\`ts
// ❌ return incoming.slice(0, maxLen);
// ❌ 超长仍 return incoming;
// ✅ incoming.length <= maxLen ? incoming : prev
\`\`\`

> ✅ **做 \`controlledInputNext\`**：不超长用 incoming（可变空）；超长返回 prev。

---`,
    ["controlledInputNext"],
  ),
  sec(
    "sec-15.2",
    "§15.2 校验提示词（对应：`validatePrompt`）🟡",
    "15.2",
    `点发送：空的不要走模型，超长的也不要。先 **trim**，再看长度。

### Java / Python：提交时的 Length

\`\`\`java
@Size(min = 1, max = 200)
private String prompt;
\`\`\`

\`\`\`python
prompt = StringField(validators=[DataRequired(), Length(max=200)])
\`\`\`

服务端也是 trim 后再判。这里返回 \`"ok" | "empty" | "too_long"\`，测试用 \`toBe\`，不抛异常。

### TypeScript

\`\`\`ts
function validatePrompt(text: string): "ok" | "empty" | "too_long" {
  const t = text.trim();
  if (t.length === 0) return "empty";
  if (t.length > 200) return "too_long";
  return "ok";
}

validatePrompt("  ");                 // "empty"
validatePrompt("机械键盘有货吗");     // "ok"
validatePrompt("a".repeat(201));      // "too_long"
validatePrompt("a".repeat(200));      // "ok"
validatePrompt("  hi  ");             // "ok"（trim 后长度 2）
\`\`\`

阈值是 **大于** 200。等于 200 仍 ok。前后空白不算进长度——所以 \`"  hi  "\` 不是 too_long，也不是 empty。

### ❌ / ✅

\`\`\`ts
// ❌ 不 trim 就判 length === 0（"  " 会被当成 ok）
// ❌ >= 200 当 too_long（200 必须 ok）
// ✅ 先 trim；0 → empty；> 200 → too_long
\`\`\`

> ✅ **做 \`validatePrompt\`**：trim 后 empty / too_long / ok。

---`,
    ["validatePrompt"],
  ),
  sec(
    "sec-15.3",
    "§15.3 trim 后空则 null（对应：`trimAndRejectEmpty`）🟢",
    "15.3",
    `校验过了还要把 content 收干净。货号 \`"  KB-001  "\` 不该带着空格进气泡。

### Java / Python

\`\`\`java
String sku = raw.trim();
if (sku.isEmpty()) return null;
\`\`\`

\`\`\`python
s = text.strip()
return s or None
\`\`\`

### TypeScript

\`\`\`ts
function trimAndRejectEmpty(text: string): string | null {
  const t = text.trim();
  return t.length === 0 ? null : t;
}

trimAndRejectEmpty("  KB-001  "); // "KB-001"
trimAndRejectEmpty("\\n\\t");     // null
trimAndRejectEmpty("机械键盘");   // "机械键盘"
\`\`\`

空用 **null**，不用 \`""\`——后面构造消息时好写 \`if (content === null) return null\`。

### ❌ / ✅

\`\`\`ts
// ❌ 空串也 return text.trim()（得到 ""，不是 null）
// ❌ 只判断 text === ""，不管 "   "
// ✅ trim 后长度 0 → null
\`\`\`

> ✅ **做 \`trimAndRejectEmpty\`**：有字返回 trimmed，没字返回 null。

---`,
    ["trimAndRejectEmpty"],
  ),
  sec(
    "sec-15.4",
    "§15.4 列表 key 必须唯一（对应：`listKeysUnique`）🔴",
    "15.4",
    `Chat 列表是 \`messages.map\`。React 用 **key** 认「哪条气泡是哪条」。重复 key 会对错人。

### 教程示例（作业不跑 JSX）

\`\`\`tsx
{messages.map((msg) => (
  <Bubble key={msg.id} role={msg.role} text={msg.content} />
))}
\`\`\`

作业测的是纯函数：一串 key 有没有重复。

\`\`\`ts
function listKeysUnique(keys: string[]): boolean {
  return new Set(keys).size === keys.length;
}

listKeysUnique([]);                 // true
listKeysUnique(["m1", "m2", "m3"]); // true
listKeysUnique(["m1", "m2", "m1"]); // false（React key 重复）
listKeysUnique(["m1"]);             // true
\`\`\`

### 延伸：不要用 index 当 key（本题不另出题）

\`key={index}\` 在「只追加」时碰巧能用。一旦 **删中间一条**，后面的项下标全变，React 以为「第 2 个还是第 2 个」，可能把助手库存气泡的 DOM 安到用户问句上。身份应该用 \`msg.id\`。作业只考 unique，不考你去拆 index。

### ❌ / ✅

\`\`\`ts
// ❌ 只看 keys[0] !== keys[1]（三条以上重复抓不住）
// ❌ 当成「排序后相邻才算重复」
// ✅ Set.size === keys.length；[] 为 true
\`\`\`

> ✅ **做 \`listKeysUnique\`**：有重复就 false。

---`,
    ["listKeysUnique"],
  ),
  sec(
    "sec-15.5",
    "§15.5 滚动钉底（对应：`scrollPinDecision`）🟡",
    "15.5",
    `Chat UI 常识：新消息来了，不一定总该滚到底。

- 你**自己刚发出**「机械键盘有货吗」→ 永远要看见自己的气泡 → \`pin\`
- 你已经在底部附近，助手回「KB-001 库存 120」→ 跟着钉底 → \`pin\`
- 你在往上翻历史，助手在底部说话 → **不要拽滚动** → \`stay\`

\`\`\`ts
function scrollPinDecision(
  userNearBottom: boolean,
  isOwnMessage: boolean,
): "pin" | "stay" {
  return userNearBottom || isOwnMessage ? "pin" : "stay";
}

scrollPinDecision(true, false);  // "pin"
scrollPinDecision(false, true);  // "pin"
scrollPinDecision(false, false); // "stay"
scrollPinDecision(true, true);   // "pin"
\`\`\`

真实 DOM 的 \`scrollTop\` 怎么量「靠近底部」，本章不考。你只决定 pin 还是 stay。

### ❌ / ✅

\`\`\`ts
// ❌ 只看 userNearBottom（自己发的在翻历史时不会钉底）
// ❌ 只看 isOwnMessage（助手回复时即使你在底部也不跟）
// ✅ 两者或
\`\`\`

> ✅ **做 \`scrollPinDecision\`**：靠近底部或自己发的 → \`"pin"\`。

---`,
    ["scrollPinDecision"],
  ),
  sec(
    "sec-15.6",
    "§15.6 气泡折行（对应：`renderLines`）🟢",
    "15.6",
    `气泡 \`content\` 可能含换行。渲染时按行出 \`<div>\`，但作业只返回 \`string[]\`。

空字符串是空气泡：**没有行**，返回 \`[]\`。若 \`"".split("\\n")\` 会得到 \`[""]\`，那是一个空行，不是「没有行」。

\`\`\`ts
function renderLines(content: string): string[] {
  if (content === "") return [];
  return content.split("\\n");
}

renderLines("");                   // []
renderLines("KB-001 库存 120");    // ["KB-001 库存 120"]
renderLines("第一行\\n第二行");    // ["第一行", "第二行"]
renderLines("a\\n");               // ["a", ""]
renderLines("\\n");                // ["", ""]
\`\`\`

末尾换行多一个 \`""\`，这是 \`split\` 的常规行为，不要 trim 掉。单独一个 \`\\n\` 是两行空串。

### ❌ / ✅

\`\`\`ts
// ❌ content.split("\\n") 连空串也走（得到 [""]）
// ❌ split 之后 filter 掉空行（"a\\n" 会丢掉末尾那行）
// ✅ 先拦 "" → []，再 split
\`\`\`

> ✅ **做 \`renderLines\`**：空气泡 \`[]\`；否则按换行拆。

---`,
    ["renderLines"],
  ),
  sec(
    "sec-15.7",
    "§15.7 构造发出的用户消息（对应：`buildOutgoingMessage`）🔴",
    "15.7",
    `把输入框提交收成一条 \`OutgoingMessage\`，之后才能交给 Ch13 的 \`appendMessage\`。

必须 **调用** §15.2、§15.3 的函数，不要再 \`text.trim()\` 一份。

| 步骤 | 行为 |
|---|---|
| \`validatePrompt(text) !== "ok"\` | 返回 \`null\`（empty、too_long 都拒） |
| \`content = trimAndRejectEmpty(text)\` | ok 时一定非 null；若仍 null 也返回 null |
| 成功 | \`id\` 为 \`user-\${nowMs}\`，\`role: "user"\`，带 trimmed \`content\` 和 \`ts\` |

\`\`\`ts
function buildOutgoingMessage(text: string, nowMs: number): OutgoingMessage | null {
  if (validatePrompt(text) !== "ok") return null;
  const content = trimAndRejectEmpty(text);
  if (content === null) return null;
  return { id: \`user-\${nowMs}\`, role: "user", content, ts: nowMs };
}

buildOutgoingMessage("  机械键盘有货吗  ", 1700000000000);
// { id: "user-1700000000000", role: "user", content: "机械键盘有货吗", ts: 1700000000000 }

buildOutgoingMessage("   ", 1);            // null
buildOutgoingMessage("a".repeat(201), 2);  // null
\`\`\`

\`role\` 固定 \`"user"\`：这是**发出去**的用户消息，不是助手。\`id\` 用时间戳拼出来，测试会查精确字符串，不要写死 \`user-1700000000000\`。

### ❌ / ✅

\`\`\`ts
// ❌ 函数里再 trim 一份，不调用 validatePrompt / trimAndRejectEmpty
// ❌ empty 返回 { content: "" } 而不是 null
// ❌ id 写成 "u1" 或 Date.now()（要用传入的 nowMs）
// ✅ 先校验再 trim；id 为 \`user-\${nowMs}\`
\`\`\`

> ✅ **做 \`buildOutgoingMessage\`**：调用前面的函数；综合主线一次过。

---`,
    ["buildOutgoingMessage"],
  ),
  sec(
    "sec-pits",
    "⚠️ Java / Python 老手几个坑",
    null,
    `1. **把 JSP \`value\` 回填当成受控。** 回填发生在整页响应；受控是每个按键 \`value={state}\`。
2. **超长就 \`slice\`。** 半截「机械键」不是用户打的字。拒绝，返回 prev。
3. **不 trim 就判空。** \`"  "\` 是 empty；\`"  hi  "\` 是 ok。
4. **空 content 用 \`""\` 而不是 null。** \`trimAndRejectEmpty\` 约定空 → null。
5. **\`key={index}\`。** 删中间条会错位。作业测 unique；生产用 \`msg.id\`。
6. **重复 key。** \`["m1","m2","m1"]\` 必须 false。
7. **助手回复时无脑滚到底。** 翻历史要 \`stay\`；自己发的才永远 \`pin\`。
8. **空气泡 \`split\` 出 \`[""]\`。** 先拦 \`content === ""\`。
9. **综合题再 trim 一份。** 走 \`validatePrompt\` + \`trimAndRejectEmpty\`。
10. **作业 import react / 上 Formik。** 运行器没有 React；那些库本章不讲。

---`,
    [],
  ),
  sec(
    "sec-homework",
    "📝 本章作业",
    null,
    `上面 7 个函数按节交错出现。每个注释里有【场景】【转换点】、示例和提示。

**完成方式**：在编辑器里改 \`throw new Error("TODO")\`，点「▶ 运行测试」。全绿 = 这题过了。

卡住就回对应 §：\`controlledInputNext\` → §15.1，\`listKeysUnique\` → §15.4，\`buildOutgoingMessage\` → §15.7（请复用校验和 trim）。

提示只点知识点：比长度、trim、Set、或运算、先拦空串再 split。不要 slice、不要 import react。

---`,
    [],
  ),
  sec(
    "sec-check",
    "✅ 自测：你真的掌握了吗？",
    null,
    `- [ ] 能说清受控：value 来自 state，onChange 算出 next
- [ ] 超长返回 prev，能举一个 slice 会算错的例子
- [ ] \`validatePrompt\` 先 trim；200 ok、201 too_long、空白 empty
- [ ] \`trimAndRejectEmpty\` 空是 null，\`KB-001\` 两侧空白会去掉
- [ ] 重复 key 为 false；能说清 index 当 key 删中间条会怎样（不另出题）
- [ ] 自己发的消息永远 pin；翻历史时助手回复 stay
- [ ] 空气泡 \`renderLines\` 是 \`[]\`，末尾换行保留空行
- [ ] \`buildOutgoingMessage\` 调用前面函数，id 为 \`user-\${nowMs}\`
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

1. 「JSP 的 input value 回填，和 React 受控 value 差在哪？超长为什么不 slice？」— 卡壳重读总述 + §15.1
2. 「列表 \`key\` 是身份还是下标？为什么 \`["m1","m2","m1"]\` 不行？index 当 key 删中间条会怎样？」— 卡壳重读 §15.4
3. 「自己发『机械键盘有货吗』为什么永远钉底？往上翻时助手回库存为什么不要拽滚动？」— 卡壳重读 §15.5

---`,
    [],
  ),
  sec(
    "sec-next",
    "⏭️ 下一步",
    null,
    `Ch15 掌握后，进 **Ch16 · 路由与数据获取心智**。本章解决「输入框进 state、列表认人、发出一条用户消息」；下一章解决「多页怎么认、远端数据的 loading / error / success」——仍然用纯函数表达，不在作业里 import react。\`buildOutgoingMessage\` 造出的那条消息，下一章会接到「这条请求对应哪条路由、结果落在哪种远程状态」的心智上。`,
    [],
  ),
];

const tutorialMd = `# Ch15 · 表单与列表（Chat UI 基础）

${sections
  .map((s) => (s.heading ? `## ${s.heading}\n\n${s.body}` : s.body))
  .join("\n\n")}
`;

const reviewMd = `# Ch15 · 记忆闪卡

> 先回忆，再翻答案。连续 2 次秒答 → 退役。

## 🔖 闪卡

| # | 正面（问题） | 背面（答案） | 掌握 |
|---|---|---|---|
| 1 | 受控输入的 value 从哪来？onChange 干什么？ | **value 来自 state。** 每个按键 onChange 算出 next 再写入。输入框不自己藏一份 DOM 值。 | ⬜ |
| 2 | incoming 超长时为什么不 slice，而返回 prev？ | 拒绝溢出。slice 会留下半截「机械键」，和键盘不同步。\`hello!\` 超长就留 \`hello\`。 | ⬜ |
| 3 | \`validatePrompt\` 对 \`"  "\`、200 个 a、201 个 a、\`"  hi  "\` 各返回什么？ | 先 trim。空白 → empty；200 → ok；201 → too_long；前后空白有字 → ok。 | ⬜ |
| 4 | \`trimAndRejectEmpty("  KB-001  ")\` 和纯换行各返回什么？ | 有字返回 \`"KB-001"\`。trim 后空返回 **null**（不是 \`""\`），避免空气泡。 | ⬜ |
| 5 | 列表 key 怎样才算唯一？\`["m1","m2","m1"]\` 呢？ | \`new Set(keys).size === keys.length\`。空数组 true。重复 m1 为 false，React 会对错气泡。 | ⬜ |
| 6 | 为什么不要用 index 当 key？（延伸，作业不另出题） | 删中间条时后面项下标全变，DOM 可能安错人。生产用 \`msg.id\`；本题只测 unique。 | ⬜ |
| 7 | \`scrollPinDecision\` 何时 \`"pin"\`、何时 \`"stay"\`？ | 靠近底部 **或** 自己发的 → **pin**。自己发的永远钉底；翻历史时助手回复 stay。 | ⬜ |
| 8 | 空气泡和 \`"a\\n"\` 的 \`renderLines\` 分别是什么？ | \`""\` → \`[]\`（不要 \`[""]\`）。\`"a\\n"\` → \`["a",""]\`，末尾换行保留空行。 | ⬜ |
| 9 | \`buildOutgoingMessage\` 必须调用谁？id 怎么拼？ | 先 \`validatePrompt\`，非 ok 则 null；再 \`trimAndRejectEmpty\`。id 为 \`user-\${nowMs}\`，不要再 trim。 | ⬜ |

## 🎓 费曼自检

- [ ] 能说清受控 value / 超长拒绝
- [ ] 能说清 key 唯一和 index 当 key 的祸
- [ ] 能说清 pin 钉底和综合构造发出的用户消息
`;

const chapter = {
  id: "ch15",
  num: "15",
  title: "表单与列表（Chat UI 基础）",
  runMode: "browser",
  tutorialMd,
  assignment,
  testName: "ch15_assignment",
  testSource,
  reviewMd,
  interleaved: true,
  sections,
  functions,
  preamble,
};

const out = join(dirname(fileURLToPath(import.meta.url)), "../src/content/chapters/ch15.json");
mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, JSON.stringify(chapter, null, 2) + "\n");
console.log("wrote", out);
