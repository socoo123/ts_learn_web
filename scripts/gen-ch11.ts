/**
 * 生成 src/content/chapters/ch11.json
 * 运行：bun scripts/gen-ch11.ts
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const preamble = `/**
 * Ch11 作业：商品助手用假 fetch 拉商品 JSON，再用假 reader 读 LLM token 流。
 *
 * 场景：先拿到一件商品的 JSON 字符串（测试注入，不是真网络），
 * JSON.parse + zod 收成 Product；再把助手吐出的字节块 / SSE 帧拼回可读文本。
 *
 * 本页已注入全局 z（zod）和 PRODUCTS，不要写 import。
 * 禁止真实网络、禁止 fetch、禁止 setTimeout。reader 是同步注入的假对象。
 *
 * 全绿 = 你掌握了 Ch11。
 */

type Product = {
  id: number;
  name: string;
  category: string;
  price: number;
  stock: number;
  sku: string;
};

const PRODUCT_SCHEMA = z.object({
  id: z.number(),
  name: z.string(),
  category: z.string(),
  price: z.number(),
  stock: z.number(),
  sku: z.string(),
});

type FakeReadResult = { done: true; value?: undefined } | { done: false; value: Uint8Array };
type FakeReader = { read: () => FakeReadResult };`;

const functions = [
  {
    name: "parseJsonProduct",
    testSuite: "parseJsonProduct",
    skeleton: `/**
 * 【场景】假 fetch 已经把商品 JSON 字符串放到你手里。
 * 商品助手要把它收成 Product；坏 JSON 或形状不对就当没这件货。
 *
 * 【转换点】JSON.parse 的结果是 unknown / 运行时的 any，TS 并不知道它是商品。
 * 所以立刻交给 preamble 里的 PRODUCT_SCHEMA.safeParse（Ch07 只调用，不重写 schema）。
 * Java 的 Jackson readValue(raw, Product.class) 失败会抛；Python json.loads 也不验字段。
 *
 * 任务：try JSON.parse；失败 → null。再 safeParse；失败 → null；成功 → data。
 * 示例：
 *   parseJsonProduct(JSON.stringify(PRODUCTS[0]))  -> sku "KB-001"，name "机械键盘"，price 599
 *   parseJsonProduct("{")                          -> null
 *   parseJsonProduct("[]")                         -> null
 *   parseJsonProduct('{"id":1,"name":"x","category":"y","price":1,"stock":1}') -> null（缺 sku）
 *   parseJsonProduct(JSON.stringify(PRODUCTS[8]))  -> sku "CP-009"（库存 0 仍合法）
 *
 * 提示：catch 里 return null，不要把 SyntaxError 抛出去。
 */
export function parseJsonProduct(raw: string): Product | null {
  throw new Error("TODO");
}`,
  },
  {
    name: "stringifyPretty",
    testSuite: "stringifyPretty",
    skeleton: `/**
 * 【场景】客服要复制一份商品快照到工单：带缩进的 JSON 比一行挤在一起好读。
 *
 * 【转换点】JSON.stringify(value, null, 2)。类型在发出去的字符串里蒸发——
 * 和 Ch01 的注解、Ch10 的 .d.ts 同一命运。Java Jackson 的 pretty printer、
 * Python json.dumps(obj, indent=2, ensure_ascii=False) 是同一件事。
 *
 * 任务：返回 JSON.stringify(value, null, 2)。
 * 示例：
 *   stringifyPretty({ sku: "KB-001", price: 599 })
 *     -> "{\\n  \\"sku\\": \\"KB-001\\",\\n  \\"price\\": 599\\n}"
 *   stringifyPretty({})                            -> "{}"
 *   stringifyPretty(["KB-001", "MS-002"])
 *     -> "[\\n  \\"KB-001\\",\\n  \\"MS-002\\"\\n]"
 *
 * 提示：第二个参数是 replacer，本题传 null；第三个是空格缩进 2。
 */
export function stringifyPretty(value: unknown): string {
  throw new Error("TODO");
}`,
  },
  {
    name: "readAllTextFromChunks",
    testSuite: "readAllTextFromChunks",
    skeleton: `/**
 * 【场景】流式 UI 已经把 LLM 吐出的文本 token 收成 string[]。
 * 气泡要显示整句，先把块拼回去。
 *
 * 【转换点】chunks.join("")。Java 的 String.join("", list)、Python 的 "".join(chunks)。
 * 这题还在「已经是字符串」的世界；跨 chunk 的 UTF-8 字节是 §11.6。
 *
 * 任务：按原顺序拼接，中间不加分隔符。
 * 示例：
 *   readAllTextFromChunks(["机", "械", "键"])  -> "机械键"
 *   readAllTextFromChunks([])                  -> ""
 *   readAllTextFromChunks(["机械键盘"])        -> "机械键盘"
 *
 * 提示：join("")，不要 join(" ") 或 join("\\n")。
 */
export function readAllTextFromChunks(chunks: string[]): string {
  throw new Error("TODO");
}`,
  },
  {
    name: "joinSsePayloads",
    testSuite: "joinSsePayloads",
    skeleton: `/**
 * 【场景】商品助手走 SSE：服务器一帧一帧推 token。
 * 正文在 data: 行里；: keep-alive 是注释，event: 是事件名，空行是帧分隔。
 *
 * 【转换点】按行扫描。行以 "data: " 开头 → slice(6)；否则以 "data:" 开头 → slice(5)。
 * payload 直接拼接（中间不加分隔符）——模拟 token 流。忽略注释、空行、event: 行。
 *
 * 任务：抽出所有 data 帧 payload，按出现顺序拼成一个字符串。
 * 示例：
 *   joinSsePayloads("data: 机\\n\\ndata: 械\\n\\n")              -> "机械"
 *   joinSsePayloads(": keep-alive\\n\\ndata: ok\\n\\n")          -> "ok"
 *   joinSsePayloads("")                                        -> ""
 *   joinSsePayloads("data: hello\\n\\ndata:  world\\n\\n")       -> "hello world"
 *     （第二个 payload 自带前导空格，不要 trim）
 *
 * 提示：raw.split("\\n") 后看 startsWith。不要把 "data:" 四个字拼进结果。
 */
export function joinSsePayloads(raw: string): string {
  throw new Error("TODO");
}`,
  },
  {
    name: "takeNChunks",
    testSuite: "takeNChunks",
    skeleton: `/**
 * 【场景】流式 UI 想「先显示前 N 个 token」，后面的还在路上。
 * 截一段预览，不能改掉上游还在累积的原数组。
 *
 * 【转换点】浅拷贝前 n 个。n<=0 → []；n>=length → 全部拷贝（仍是新数组）。
 * Java 的 list.subList(0, n) 要小心视图；Python 的 chunks[:n] 已经是新 list。
 *
 * 任务：返回前 n 个的浅拷贝，不要 mutate 原数组。
 * 示例：
 *   takeNChunks(["a", "b", "c"], 2)  -> ["a", "b"]  （原数组 length 仍为 3）
 *   takeNChunks(["a"], 5)            -> ["a"]
 *   takeNChunks(["a", "b"], 0)       -> []
 *   takeNChunks(["a"], -1)           -> []
 *
 * 提示：chunks.slice(0, Math.max(0, n))。不要 splice。
 */
export function takeNChunks(chunks: string[], n: number): string[] {
  throw new Error("TODO");
}`,
  },
  {
    name: "decodeUtf8Chunks",
    testSuite: "decodeUtf8Chunks",
    skeleton: `/**
 * 【场景】假 reader 吐出的是 Uint8Array，不是 string。
 * 汉字「机」是 3 个字节，网络/流经常从中间切开。
 *
 * 【转换点】先把所有 chunk 拼成一个 Uint8Array，再 new TextDecoder("utf-8").decode(joined)。
 * 禁止逐块 decode——半个汉字会变成 U+FFFD（替换字符）。
 * Java InputStream.readAllBytes() 再 new String(bytes, UTF_8)；
 * Python 先 b"".join(chunks) 再 .decode("utf-8")。
 *
 * 任务：拼接字节后一次性 decode。空数组 → ""。
 * 示例：
 *   把 TextEncoder 编码的 "机" 切成 [slice(0,1), slice(1)] → 仍是 "机"
 *   decodeUtf8Chunks([])                                   → ""
 *   整段一块编码 "机械键盘"                                 → "机械键盘"
 *
 * 提示：先算总长度 new Uint8Array(total)，再用 .set 拷进去。
 */
export function decodeUtf8Chunks(chunks: Uint8Array[]): string {
  throw new Error("TODO");
}`,
  },
  {
    name: "collectStreamToString",
    testSuite: "collectStreamToString",
    skeleton: `/**
 * 【场景】商品助手的 LLM 字节流：测试注入一个 FakeReader（闭包里 chunks + index）。
 * read() 立刻返回 { done, value }，不是 Promise，不是浏览器 ReadableStream。
 *
 * 【转换点】循环 reader.read()，done === true 结束，否则收集 value。
 * 真实世界是 const reader = stream.getReader() 然后 await reader.read()；
 * 本题同步注入，对应 Ch08 的假调度器——登记/读取都是假的，禁止真网络。
 *
 * 任务：收集全部 Uint8Array，返回 decodeUtf8Chunks(collected)。必须复用，不要自己再 decode。
 * 示例：
 *   一上来 done → ""
 *   把 "机" 的 3 字节切成两块注入 → "机"
 *   两块完整 UTF-8（"机械" + "键盘"）→ "机械键盘"
 *
 * 提示：while (true) { const r = reader.read(); if (r.done) break; collected.push(r.value); }
 */
export function collectStreamToString(reader: FakeReader): string {
  throw new Error("TODO");
}`,
  },
];

const assignment = `${preamble}

${functions.map((f) => f.skeleton).join("\n\n")}
`;

const testSource = `function makeFakeReader(chunks: Uint8Array[]): FakeReader {
  let i = 0;
  return {
    read(): FakeReadResult {
      if (i >= chunks.length) return { done: true };
      const value = chunks[i];
      i += 1;
      return { done: false, value };
    },
  };
}

describe("parseJsonProduct", () => {
  it("PRODUCTS[0] 能还原键盘", () => {
    const p = parseJsonProduct(JSON.stringify(PRODUCTS[0]));
    expect(p).toEqual(PRODUCTS[0]);
    expect(p!.sku).toBe("KB-001");
    expect(p!.name).toBe("机械键盘");
    expect(p!.price).toBe(599);
  });
  it("PRODUCTS[1] 无线鼠标（防硬编码键盘）", () => {
    const p = parseJsonProduct(JSON.stringify(PRODUCTS[1]));
    expect(p!.sku).toBe("MS-002");
    expect(p!.name).toBe("无线鼠标");
    expect(p!.price).toBe(159);
  });
  it("PRODUCTS[8] 库存 0 仍合法", () => {
    const p = parseJsonProduct(JSON.stringify(PRODUCTS[8]));
    expect(p!.sku).toBe("CP-009");
    expect(p!.name).toBe("智能水杯");
    expect(p!.stock).toBe(0);
  });
  it("残缺 JSON 花括号 → null", () => {
    expect(parseJsonProduct("{")).toBeNull();
  });
  it("数组不是一件商品 → null", () => {
    expect(parseJsonProduct("[]")).toBeNull();
  });
  it("缺 sku 的对象 → null", () => {
    expect(
      parseJsonProduct('{"id":1,"name":"x","category":"y","price":1,"stock":1}'),
    ).toBeNull();
  });
  it("合法 JSON 但是数字 → null", () => {
    expect(parseJsonProduct("123")).toBeNull();
  });
});

describe("stringifyPretty", () => {
  it("商品快照两空格缩进", () => {
    expect(stringifyPretty({ sku: "KB-001", price: 599 })).toBe(
      "{\\n  \\"sku\\": \\"KB-001\\",\\n  \\"price\\": 599\\n}",
    );
  });
  it("另一件商品（防硬编码 KB-001）", () => {
    expect(stringifyPretty({ sku: "MS-002", price: 159 })).toBe(
      "{\\n  \\"sku\\": \\"MS-002\\",\\n  \\"price\\": 159\\n}",
    );
  });
  it("空对象", () => {
    expect(stringifyPretty({})).toBe("{}");
  });
  it("两元素数组", () => {
    expect(stringifyPretty(["KB-001", "MS-002"])).toBe(
      "[\\n  \\"KB-001\\",\\n  \\"MS-002\\"\\n]",
    );
  });
  it("数字原样", () => {
    expect(stringifyPretty(599)).toBe("599");
  });
});

describe("readAllTextFromChunks", () => {
  it("三块汉字 token", () => {
    expect(readAllTextFromChunks(["机", "械", "键"])).toBe("机械键");
  });
  it("英文 token（防硬编码汉字）", () => {
    expect(readAllTextFromChunks(["hel", "lo"])).toBe("hello");
  });
  it("空数组", () => {
    expect(readAllTextFromChunks([])).toBe("");
  });
  it("单元素原样", () => {
    expect(readAllTextFromChunks(["机械键盘"])).toBe("机械键盘");
  });
});

describe("joinSsePayloads", () => {
  it("两帧汉字 token 直接拼", () => {
    expect(joinSsePayloads("data: 机\\n\\ndata: 械\\n\\n")).toBe("机械");
  });
  it("第二个 payload 自带前导空格", () => {
    expect(joinSsePayloads("data: hello\\n\\ndata:  world\\n\\n")).toBe("hello world");
  });
  it("忽略 keep-alive 注释", () => {
    expect(joinSsePayloads(": keep-alive\\n\\ndata: ok\\n\\n")).toBe("ok");
  });
  it("空字符串", () => {
    expect(joinSsePayloads("")).toBe("");
  });
  it("忽略 event 行", () => {
    expect(joinSsePayloads("event: delta\\ndata: tok\\n\\n")).toBe("tok");
  });
  it("data: 无空格则切 5 字符", () => {
    expect(joinSsePayloads("data:ping\\n\\ndata:pong\\n")).toBe("pingpong");
  });
});

describe("takeNChunks", () => {
  it("取前 2 个，原数组仍为 3", () => {
    const src = ["a", "b", "c"];
    expect(takeNChunks(src, 2)).toEqual(["a", "b"]);
    expect(src.length).toBe(3);
    expect(src).toEqual(["a", "b", "c"]);
  });
  it("n 超过长度 → 全部拷贝", () => {
    const src = ["a"];
    const got = takeNChunks(src, 5);
    expect(got).toEqual(["a"]);
    got.push("x");
    expect(src.length).toBe(1);
  });
  it("n 为 0 → 空数组", () => {
    expect(takeNChunks(["a", "b"], 0)).toEqual([]);
  });
  it("n 为负 → 空数组", () => {
    const src = ["a", "b"];
    expect(takeNChunks(src, -1)).toEqual([]);
    expect(src.length).toBe(2);
  });
  it("另一组 token（防硬编码 a/b/c）", () => {
    expect(takeNChunks(["机", "械", "键", "盘"], 3)).toEqual(["机", "械", "键"]);
  });
});

describe("decodeUtf8Chunks", () => {
  it("跨 chunk 切开的汉字「机」", () => {
    const bytes = new TextEncoder().encode("机");
    expect(bytes.length).toBe(3);
    expect(decodeUtf8Chunks([bytes.slice(0, 1), bytes.slice(1)])).toBe("机");
  });
  it("空数组", () => {
    expect(decodeUtf8Chunks([])).toBe("");
  });
  it("整段一块 机械键盘", () => {
    const bytes = new TextEncoder().encode("机械键盘");
    expect(decodeUtf8Chunks([bytes])).toBe("机械键盘");
  });
  it("三块切「机」（1+1+1）", () => {
    const bytes = new TextEncoder().encode("机");
    expect(
      decodeUtf8Chunks([bytes.slice(0, 1), bytes.slice(1, 2), bytes.slice(2)]),
    ).toBe("机");
  });
  it("两段完整汉字再拼", () => {
    const enc = new TextEncoder();
    expect(
      decodeUtf8Chunks([enc.encode("机械"), enc.encode("键盘")]),
    ).toBe("机械键盘");
  });
});

describe("collectStreamToString", () => {
  it("空流一上来 done", () => {
    expect(collectStreamToString(makeFakeReader([]))).toBe("");
  });
  it("跨字节切分的「机」", () => {
    const bytes = new TextEncoder().encode("机");
    const reader = makeFakeReader([bytes.slice(0, 1), bytes.slice(1)]);
    expect(collectStreamToString(reader)).toBe("机");
  });
  it("两块完整 UTF-8", () => {
    const enc = new TextEncoder();
    const reader = makeFakeReader([enc.encode("机械"), enc.encode("键盘")]);
    expect(collectStreamToString(reader)).toBe("机械键盘");
  });
  it("英文单块（防硬编码汉字）", () => {
    const reader = makeFakeReader([new TextEncoder().encode("KB-001")]);
    expect(collectStreamToString(reader)).toBe("KB-001");
  });
  it("读完之后再读仍是 done（不要越界）", () => {
    const reader = makeFakeReader([new TextEncoder().encode("ok")]);
    expect(collectStreamToString(reader)).toBe("ok");
    const again = reader.read();
    expect(again.done).toBe(true);
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
    `> **预计**：1 天 ｜ **前置**：Ch06（Promise / async）、Ch08（假调度器）
> **目标**：① 会 \`JSON.parse\` / \`stringify\` 并立刻用 zod **只调用**收成商品；② 理解 \`ReadableStream\` 是 SSE / LLM 流的底层。
> 你 15 年 Java：\`HttpClient\` + Jackson；Python：\`json.loads/dumps\`、\`httpx\`、\`iter_bytes\`。

> 📐 **本教程的契约**：下面每一节（§11.1–§11.7）都**精确对应**作业里的题。讲过的才考，考的必讲过。卡住时按作业函数名回查对应小节。
> **不讲**：真实网络、Node stream 管道大战、fetch abort 深水。作业禁止 \`fetch(\` 和 \`setTimeout\`。

---`,
    [],
  ),
  sec(
    "sec-map",
    "🗺️ 本章地图",
    null,
    `本章作业是一条完整主线：**假 fetch 拉回商品 JSON → 类型化成 Product；假 reader 读 LLM 字节 / SSE 帧 → 拼成给 UI 看的字符串**。7 个函数，全部同步，全部注入。

读完这章 + 完成作业，你将能够：

- 说出为什么 \`JSON.parse\` 之后不能当 \`Product\` 用，要调用 Ch07 的 schema
- 用 \`JSON.stringify(value, null, 2)\` 打出带缩进的快照，并知道类型已蒸发
- 把文本 token 数组 \`join\` 回去；先显示前 N 个而不改原数组
- 从 SSE 的 \`data:\` 行抽出 payload（忽略注释和 \`event:\`）
- **先拼字节再 decode**，跨 chunk 的汉字不会变成 U+FFFD
- 在注入的 \`FakeReader\` 上循环 \`read\` 直到 \`done\`，复用 \`decodeUtf8Chunks\`

\`\`\`mermaid
flowchart LR
    A["🟦 JSON 一次到位<br/>────────<br/>整段字符串进来<br/>JSON.parse<br/>zod 校验形状"]
    B["🟪 Stream 分块<br/>────────<br/>反复 read<br/>先拼字节再 decode<br/>SSE 抽出 data 帧"]
    A ~~~ B

    style A fill:#E1F5FE,stroke:#0277BD,color:#1f1f1f
    style B fill:#F3E5F5,stroke:#7B1FA2,color:#1f1f1f
\`\`\`

**作业 ↔ 教程对应表**（学哪节，就去做哪题）：

| 作业题 | 对应小节 | 核心知识点 |
|--------|----------|-----------|
| \`parseJsonProduct\` | §11.1 | \`JSON.parse\` + 调用 zod schema |
| \`stringifyPretty\` | §11.2 | \`JSON.stringify(value, null, 2)\` |
| \`readAllTextFromChunks\` | §11.3 | 文本 chunk \`join\` |
| \`joinSsePayloads\` | §11.4 | SSE \`data:\` 帧拼成 token 流 |
| \`takeNChunks\` | §11.5 | 取前 N 个 chunk（浅拷贝） |
| \`decodeUtf8Chunks\` | §11.6 | \`Uint8Array[]\` → UTF-8（先拼再 decode） |
| \`collectStreamToString\` | §11.7 | 注入 FakeReader，循环 read，复用 decode |

---`,
    [],
  ),
  sec(
    "sec-path",
    "⏱️ 学习路径：费曼五步（约 40–60 分钟）",
    null,
    `| 步 | 你要做 | 在哪做 |
|----|--------|--------|
| ① 预览猜（2 分钟） | 看下面的差异，先猜 TS 怎么实现 | 本页 ① |
| ② 先动手 | 每节后面的编辑器里**先试着写** | 本节练习 |
| ③ 提取+反馈 | 点「运行测试」看红绿 | 本节练习 |
| ④ 费曼（2 分钟） | 大白话讲清「为什么不能逐块 decode 汉字」 | 本页 ④ |
| ⑤ 存闪卡 | 章末闪卡标复习日期 | 闪卡 |

> 💡 别从头读到尾。先扫 ① → 写作业 → **哪题卡了，回对应 § 查** → 改 → 再跑。
> \`collectStreamToString\` **必须复用** \`decodeUtf8Chunks\`。假 reader 和 Ch08 假调度器是同一风格：注入、立刻返回、禁止真等待。

---`,
    [],
  ),
  sec(
    "sec-guess",
    "① 预览猜（2 分钟 · 激活你的 Java / Python 直觉）",
    null,
    `先别看答案，凭经验猜一猜（猜错没关系）：

1. \`JSON.parse('{"sku":"KB-001"}')\` 在 TS 里的类型是 \`Product\` 吗？Jackson \`readValue(raw, Product.class)\` 呢？
2. 你 \`as Product\` 骗过了编辑器，运行时 \`sku\` 其实是数字，谁会挡？\`interface\` 还是 zod？
3. \`JSON.stringify\` 之后，TS 的 \`Product\` 类型还在字符串里吗？缩进 2 空格怎么写？
4. LLM 流是一次返回整段字符串，还是一块一块 \`read\`？\`done: true\` 是什么意思？
5. SSE 里 \`: keep-alive\` 和 \`data: 机\` 哪一行才是 token？空行干什么用？
6. 汉字「机」3 个字节被切成 \`[第1字节, 后2字节]\`，对每一块 \`TextDecoder.decode\`，你会看到什么？

> 猜完，带着验证心态进入正文。第 1、2、6 题是本章的 🔴。

---`,
    [],
  ),
  sec(
    "sec-11.1",
    "§11.1 \`JSON.parse\` + 调用 zod（对应：`parseJsonProduct`）🔴",
    "11.1",
    `假 fetch 的结果先当 **字符串**。\`JSON.parse\` 把它变成 JS 值——但这个值在类型世界里是 **unknown**（宽松模式下常被标成 \`any\`）。它不是 \`Product\`。

### Java 对照：Jackson 按 class 读

\`\`\`java
ObjectMapper mapper = new ObjectMapper();
Product p = mapper.readValue(raw, Product.class); // 字段对不上会抛
\`\`\`

Jackson 知道目标类型。\`JSON.parse\` **不知道**。

### Python 对照：\`json.loads\` 也不验字段

\`\`\`python
obj = json.loads(raw)          # dict，键对不对不管
# Pydantic 才验：Product.model_validate(obj)
\`\`\`

### TypeScript：parse 完立刻交给 schema 🟢 调用、不重讲写法

Ch07 你写过 \`z.object({ ... })\`。本章 preamble **已经给了** \`PRODUCT_SCHEMA\`，你只 \`safeParse\`。

\`\`\`ts
function parseJsonProduct(raw: string): Product | null {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null; // "{" 这种残缺 JSON
  }
  const r = PRODUCT_SCHEMA.safeParse(parsed);
  return r.success ? r.data : null;
}
\`\`\`

### 电商场景：商品助手收到假 fetch 的 body

\`\`\`ts
parseJsonProduct(JSON.stringify(PRODUCTS[0]));
// { sku: "KB-001", name: "机械键盘", price: 599, ... }

parseJsonProduct("{");     // null  ← 不是 throw
parseJsonProduct("[]");    // null  ← 数组过不了 object schema
parseJsonProduct(JSON.stringify(PRODUCTS[8]));
// sku "CP-009"，stock 0 —— 0 是合法 number，不要当成失败
\`\`\`

真实项目里会 \`await fetch("/api/products/KB-001")\` 再 \`res.text()\`。**本课作业不要写 \`fetch(\`**：测试把 JSON 字符串直接给你，等价于假 fetch 已经返回了 body。

### ❌ / ✅

\`\`\`ts
// ❌ const p: Product = JSON.parse(raw);  —— 类型在撒谎
// ❌ JSON.parse(raw) as Product           —— 编辑器闭嘴，脏数据仍进来
// ❌ PRODUCT_SCHEMA.parse 失败让它抛错    —— 本题失败要 null
// ❌ 缺 sku 仍返回对象                    —— safeParse 会失败
// ✅ try/catch parse；safeParse；失败 null；CP-009 库存 0 要过
\`\`\`

> ✅ **做 \`parseJsonProduct\`**：非法 JSON → null；形状不对 → null；合法商品（含库存 0）→ data。

---`,
    ["parseJsonProduct"],
  ),
  sec(
    "sec-11.2",
    "§11.2 \`JSON.stringify\` 与类型蒸发（对应：`stringifyPretty`）🟡",
    "11.2",
    `反过来：内存里的对象要变成字符串（存工单、打日志、发给另一端）。

### Python / Java 对照

\`\`\`python
json.dumps({"sku": "KB-001", "price": 599}, indent=2, ensure_ascii=False)
\`\`\`

\`\`\`java
mapper.writerWithDefaultPrettyPrinter().writeValueAsString(product);
\`\`\`

### TypeScript：第二个参数 null，第三个 2

\`\`\`ts
JSON.stringify({ sku: "KB-001", price: 599 }, null, 2);
// {
//   "sku": "KB-001",
//   "price": 599
// }

JSON.stringify({});                 // "{}"  ← 空对象没有换行
JSON.stringify(["KB-001", "MS-002"], null, 2);
// [
//   "KB-001",
//   "MS-002"
// ]
\`\`\`

🔴 **类型蒸发**：\`stringify\` 之后只剩文本。对面 \`JSON.parse\` 回来又是 unknown，还得 zod。这和 Ch01 注解蒸发、Ch10 \`.d.ts\` 蒸发是同一句话：**图纸不进运行时。**

### ❌ / ✅

\`\`\`ts
// ❌ JSON.stringify(value)              —— 一行挤在一起，测试要 2 空格
// ❌ JSON.stringify(value, null, 4)     —— 缩进宽度错了
// ❌ 手写模板字符串去「长得像 JSON」    —— 键顺序、空格很容易红
// ✅ return JSON.stringify(value, null, 2);
\`\`\`

> ✅ **做 \`stringifyPretty\`**：就是这一行调用。空对象是 \`"{}"\`。

---`,
    ["stringifyPretty"],
  ),
  sec(
    "sec-11.3",
    "§11.3 文本 chunk join（对应：`readAllTextFromChunks`）🟢",
    "11.3",
    `流式 UI 常见两层：底层是**字节**（§11.6），上层已经 decode 成 **string token**。这题只处理上层。

### 对照

\`\`\`java
String.join("", List.of("机", "械", "键")); // "机械键"
\`\`\`

\`\`\`python
"".join(["机", "械", "键"])
\`\`\`

\`\`\`ts
["机", "械", "键"].join(""); // "机械键"
[].join("");                // ""
["机械键盘"].join("");      // "机械键盘"
\`\`\`

不要 \`join(" ")\`：token 之间的空格若需要，是模型自己吐出来的（见下一节 \`data:  world\`）。

### ❌ / ✅

\`\`\`ts
// ❌ chunks.join(" ") / join("\\n")
// ❌ reduce 时给空数组返回 "undefined"
// ✅ chunks.join("")
\`\`\`

> ✅ **做 \`readAllTextFromChunks\`**：\`join("")\`。空数组 \`""\`。

---`,
    ["readAllTextFromChunks"],
  ),
  sec(
    "sec-11.4",
    "§11.4 SSE \`data:\` 帧（对应：`joinSsePayloads`）🟡",
    "11.4",
    `Server-Sent Events：服务器用长连接推文本帧。LLM 聊天接口经常包一层 SSE。一帧大概长这样：

\`\`\`
data: 机

data: 械

\`\`\`

空行（\`\\n\\n\`）是帧结束。行首 \`:\` 是注释（常见 \`: keep-alive\`）。\`event:\` 是事件名，不是 token。

### 切 payload 的规则（作业锁死）

1. 按行扫描（\`raw.split("\\n")\`）。
2. 行以 **\`data: \`**（6 个字符，含空格）开头 → \`slice(6)\`。
3. 否则行以 **\`data:\`**（5 个字符，无空格）开头 → \`slice(5)\`。
4. 其它行丢掉。payload **直接拼接**，中间不加分隔符。

\`\`\`ts
joinSsePayloads("data: 机\\n\\ndata: 械\\n\\n");           // "机械"
joinSsePayloads(": keep-alive\\n\\ndata: ok\\n\\n");       // "ok"
joinSsePayloads("");                                     // ""
joinSsePayloads("data: hello\\n\\ndata:  world\\n\\n");    // "hello world"
joinSsePayloads("event: delta\\ndata: tok\\n\\n");         // "tok"
joinSsePayloads("data:ping\\ndata:pong\\n");               // "pingpong"
\`\`\`

第二个 payload 自带前导空格时，**不要 trim**——那是 token 的一部分。

### Java / Python 对照

Java 老手会想起读 \`InputStream\` 一行行解析；Python 也就是 \`for line in text.splitlines()\`。没有魔法库要背，规则就上面四条。

### ❌ / ✅

\`\`\`ts
// ❌ 用正则把整段「data:」吃掉但漏了无空格的 data:ping
// ❌ 把 ": keep-alive" 当 token
// ❌ payload 之间插空格或换行
// ❌ trim 掉 " world" 的前导空格
// ✅ startsWith("data: ") 优先于 startsWith("data:")；直接 += payload
\`\`\`

> ✅ **做 \`joinSsePayloads\`**：按行、切 6 或 5、忽略注释 / 空行 / event。

---`,
    ["joinSsePayloads"],
  ),
  sec(
    "sec-11.5",
    "§11.5 先显示前 N 个 token（对应：`takeNChunks`）🟢",
    "11.5",
    `流式 UI 不必等流结束：先把已经到达的前 N 个 token 画出来。

### Python 切片已经是拷贝；Java \`subList\` 小心是视图

\`\`\`python
chunks[:2]          # 新 list
\`\`\`

\`\`\`java
new ArrayList<>(list.subList(0, n)); // 不要直接改 subList 视图
\`\`\`

\`\`\`ts
["a", "b", "c"].slice(0, 2); // ["a", "b"] 新数组
\`\`\`

规则：

- \`n <= 0\` → \`[]\`
- \`n >= length\` → **全部拷贝**（不要把原数组 return 出去，调用方 \`push\` 会污染上游）
- 不要 \`splice\`（那会改原数组）

\`\`\`ts
takeNChunks(["a", "b", "c"], 2); // ["a", "b"]，原 length 仍为 3
takeNChunks(["a"], 5);           // ["a"]
takeNChunks(["a"], 0);           // []
takeNChunks(["a"], -1);          // []
\`\`\`

### ❌ / ✅

\`\`\`ts
// ❌ return chunks;          —— n 很大时把原数组交出去
// ❌ chunks.splice(0, n);    —— mutate
// ❌ n<=0 时 return chunks
// ✅ chunks.slice(0, Math.max(0, n))
\`\`\`

> ✅ **做 \`takeNChunks\`**：浅拷贝前 n 个；原数组 length 不变。

---`,
    ["takeNChunks"],
  ),
  sec(
    "sec-11.6",
    "§11.6 跨 chunk 的 UTF-8（对应：`decodeUtf8Chunks`）🔴",
    "11.6",
    `假 reader 吐的是 \`Uint8Array\`。UTF-8 里一个汉字常占 **3 字节**。「机」被切成 \`[第 1 字节] + [后 2 字节]\` 时，**每一块单独 decode 会得到 U+FFFD**（替换字符 \`�\`）。

正确做法：**先拼成一个 \`Uint8Array\`，再 \`decode\` 一次。**

### Java：\`InputStream\` 按字节读完再变字符串

\`\`\`java
byte[] all = input.readAllBytes();
String s = new String(all, StandardCharsets.UTF_8);
\`\`\`

不要每 \`read(buf, 0, 1)\` 就 \`new String(那一个字节)\`。

### Python：\`iter_bytes\` 先 join

\`\`\`python
raw = b"".join(chunks)
text = raw.decode("utf-8")
\`\`\`

\`httpx\` 的 \`iter_bytes()\` 同样可能从汉字中间切开。

### TypeScript

\`\`\`ts
function decodeUtf8Chunks(chunks: Uint8Array[]): string {
  let total = 0;
  for (const c of chunks) total += c.length;
  const joined = new Uint8Array(total);
  let offset = 0;
  for (const c of chunks) {
    joined.set(c, offset);
    offset += c.length;
  }
  return new TextDecoder("utf-8").decode(joined);
}

const bytes = new TextEncoder().encode("机"); // 长度 3
decodeUtf8Chunks([bytes.slice(0, 1), bytes.slice(1)]); // "机" 不是 "�"
decodeUtf8Chunks([]);                                  // ""
decodeUtf8Chunks([new TextEncoder().encode("机械键盘")]); // "机械键盘"
\`\`\`

### ❌ / ✅

\`\`\`ts
// ❌ chunks.map((c) => new TextDecoder().decode(c)).join("")
// ❌ 假定「一块 = 一个汉字」
// ❌ 空数组返回 null / undefined
// ✅ 先拼字节，再 decode 一次
\`\`\`

> ✅ **做 \`decodeUtf8Chunks\`**：总长度 → \`Uint8Array\` → \`.set\` → \`TextDecoder("utf-8")\`。

---`,
    ["decodeUtf8Chunks"],
  ),
  sec(
    "sec-11.7",
    "§11.7 FakeReader 循环（对应：`collectStreamToString`）🔴",
    "11.7",
    `浏览器里真流长这样：

\`\`\`ts
const reader = stream.getReader();
while (true) {
  const { done, value } = await reader.read();
  if (done) break;
  // value: Uint8Array
}
\`\`\`

心智：\`ReadableStream\` → \`getReader()\` → 反复 \`{ done, value }\`。SSE / LLM token 流的底层就是这个循环（外加文本帧解析）。

### 作业注入假 reader（和 Ch08 假调度器同一招）

测试给一个闭包：里面是 \`chunks\` 数组 + \`index\`。\`read()\` **立刻**返回，不是 Promise，不要 \`setTimeout\`，不要真 \`ReadableStream\`。

\`\`\`ts
type FakeReadResult =
  | { done: true; value?: undefined }
  | { done: false; value: Uint8Array };
type FakeReader = { read: () => FakeReadResult };
\`\`\`

\`\`\`ts
function collectStreamToString(reader: FakeReader): string {
  const collected: Uint8Array[] = [];
  while (true) {
    const r = reader.read();
    if (r.done) break;
    collected.push(r.value);
  }
  return decodeUtf8Chunks(collected); // 必须复用
}
\`\`\`

\`\`\`mermaid
flowchart TD
    s0["拿到 FakeReader"] --> s1["调用 read"]
    s1 --> s2{"done 为 true?"}
    s2 -->|"否"| s3["收集 value"]
    s3 --> s4["继续下一轮"]
    s2 -->|"是"| s5["decodeUtf8<br/>Chunks"]
    s5 --> s6["返回 UTF-8 字符串"]

    style s0 fill:#FFE082,stroke:#F9A825,color:#1f1f1f
    style s1 fill:#80DEEA,stroke:#0097A7,color:#1f1f1f
    style s2 fill:#80DEEA,stroke:#0097A7,color:#1f1f1f
    style s3 fill:#CE93D8,stroke:#7B1FA2,color:#1f1f1f
    style s4 fill:#CE93D8,stroke:#7B1FA2,color:#1f1f1f
    style s5 fill:#A5D6A7,stroke:#388E3C,color:#1f1f1f
    style s6 fill:#A5D6A7,stroke:#388E3C,color:#1f1f1f
\`\`\`

空流：第一次 \`read\` 就 \`done: true\` → \`decodeUtf8Chunks([])\` → \`""\`。跨字节的「机」也要过——因为你复用了 §11.6。

### ❌ / ✅

\`\`\`ts
// ❌ async function + await reader.read()     —— 本题同步
// ❌ 自己逐块 decode，不调用 decodeUtf8Chunks
// ❌ 真去 new ReadableStream / fetch
// ❌ done 时还去读 r.value
// ✅ while + done 结束 + 复用 decodeUtf8Chunks
\`\`\`

> ✅ **做 \`collectStreamToString\`**：同步循环；复用 \`decodeUtf8Chunks\`。

---`,
    ["collectStreamToString"],
  ),
  sec(
    "sec-pits",
    "⚠️ Java / Python 老手几个坑",
    null,
    `1. **\`JSON.parse\` 没有目标 class。** 不要拿 Jackson / Gson 的直觉当它已经是 \`Product\`。
2. **zod 本章只调用。** 不要重写一份 \`z.object\`；preamble 的 \`PRODUCT_SCHEMA\` 就是门卫。
3. **\`as Product\` 不是校验。** 编辑器绿了，\`sku\` 仍可能是数字。
4. **\`stringify\` 类型蒸发。** 漂亮 JSON 里没有 TS 类型；对面还得再 parse + zod。
5. **SSE 注释行不是 token。** \`: keep-alive\` 丢掉；\`event:\` 丢掉。
6. **不要 trim SSE payload。** \`" world"\` 的前导空格是内容。
7. **禁止逐块 UTF-8 decode。** 汉字可能跨 chunk；先拼字节。
8. **\`takeNChunks\` 必须拷贝。** \`return chunks\` 会让 UI 预览和上游共用一个数组。
9. **作业禁止真网络 / \`fetch(\` / \`setTimeout\`。** FakeReader 立刻返回，和 Ch08 一样。
10. **不讲 fetch abort、不讲 Node \`pipeline\`。** 看见别慌，本章不考。

---`,
    [],
  ),
  sec(
    "sec-homework",
    "📝 本章作业",
    null,
    `上面 7 个函数按节交错出现。每个注释里有【场景】【转换点】、示例和提示。

**完成方式**：在编辑器里改 \`throw new Error("TODO")\`，点「▶ 运行测试」。全绿 = 这题过了。

卡住就回对应 §：\`parseJsonProduct\` → §11.1，\`joinSsePayloads\` → §11.4，\`decodeUtf8Chunks\` → §11.6，\`collectStreamToString\` → §11.7（请复用 11.6）。

最后一题用注入的 \`FakeReader\`，不要自己造 Promise、不要真 stream。

---`,
    [],
  ),
  sec(
    "sec-check",
    "✅ 自测：你真的掌握了吗？",
    null,
    `- [ ] 能说清 \`JSON.parse\` 的结果为什么不是 \`Product\`，以及要调用 \`safeParse\`
    - [ ] 能写出 \`JSON.stringify(value, null, 2)\`，并知道类型已蒸发
- [ ] 能从 SSE 文本抽出 \`data:\` payload，忽略 keep-alive / event / 空行
- [ ] 能解释「机」被切成 1+2 字节时，为什么必须先拼再 decode
- [ ] 能在 FakeReader 上循环 \`read\` 直到 \`done\`，并复用 \`decodeUtf8Chunks\`
- [ ] 知道作业为什么禁止真 \`fetch\` / \`setTimeout\`
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

1. 「Jackson 能 \`readValue(json, Product.class)\`，为什么 TS 的 \`JSON.parse\` 还要再调一次 zod？\`as Product\` 不行吗？」— 卡壳重读 §11.1
2. 「SSE 的 \`data: 机\` 和 \`: keep-alive\` 差在哪？为什么 payload 之间不加空格，但 \`data:  world\` 又保留空格？」— 卡壳重读 §11.4
3. 「汉字 3 字节被流切开，为什么不能对每一块 \`new String(bytes, UTF_8)\`？FakeReader 的 \`done\` 是什么？」— 卡壳重读 §11.6 + §11.7

---`,
    [],
  ),
  sec(
    "sec-next",
    "⏭️ 下一步",
    null,
    `Ch11 掌握后，进 **Ch12 · 组件化心智**。JSON / Stream 解决「数据怎么到浏览器」；下一章解决「到了以后 UI 为什么是 \`f(state)\`，而不是 JSP 一把梭」。假 fetch 拉到的 \`Product\`、假 reader 拼好的 token 字符串，都会变成组件的 props。`,
    [],
  ),
];

const tutorialMd = `# Ch11 · fetch、JSON、Stream 概念

${sections
  .map((s) => (s.heading ? `## ${s.heading}\n\n${s.body}` : s.body))
  .join("\n\n")}
`;

const reviewMd = `# Ch11 · 记忆闪卡

> 先回忆，再翻答案。连续 2 次秒答 → 退役。

## 🔖 闪卡

| # | 正面（问题） | 背面（答案） | 掌握 |
|---|---|---|---|
| 1 | \`JSON.parse\` 得到的值，TS 为什么不能直接当 \`Product\`？ | 运行时是 unknown/any，没有目标 class。形状要靠 zod \`safeParse\` 收；失败返回 null | ⬜ |
| 2 | 本章 zod 要自己写 \`z.object\` 吗？ | **只调用** preamble 的 \`PRODUCT_SCHEMA\`。写法是 Ch07 的事 | ⬜ |
| 3 | \`JSON.stringify(obj, null, 2)\` 三个参数各干什么？空对象是什么？ | replacer 用 null；2 是缩进空格。类型蒸发。空对象是 \`"{}"\` | ⬜ |
| 4 | SSE 行 \`data: 机\`、\`: keep-alive\`、\`event: delta\` 各怎么处理？ | 只抽 \`data:\` payload（有空格切 6、无空格切 5）。注释和 event 丢掉 | ⬜ |
| 5 | \`"data: hello\\n\\ndata:  world"\` 拼出来为什么有空格？ | 直接拼接、不 trim。第二个 payload 自带前导空格 | ⬜ |
| 6 | 「机」3 字节切成两块，逐块 \`TextDecoder.decode\` 会怎样？ | 半个 UTF-8 变成 U+FFFD。必须先拼成一个 Uint8Array 再 decode | ⬜ |
| 7 | FakeReader 循环何时停？返回值怎么来？ | \`read()\` 直到 \`done === true\`。收集 value，复用 \`decodeUtf8Chunks\` | ⬜ |
| 8 | 作业为什么禁止真 \`fetch(\` / \`setTimeout\`？ | 测试 4 秒超时；JSON 和 reader 都是注入。和 Ch08 假调度器同一风格 | ⬜ |
| 9 | \`takeNChunks\` 为什么不能 \`return chunks\`？ | 必须浅拷贝。否则 UI 预览 \`push\` 会改掉上游还在累积的数组 | ⬜ |
| 10 | ReadableStream 的心智三步是什么？ | \`getReader()\` → 反复 \`{done,value}\` → \`done\` 结束。SSE/LLM 流底层就是它 | ⬜ |

## 🎓 费曼自检

- [ ] 能说清 parse 无类型、zod 只调用、stringify 蒸发
- [ ] 能说清 SSE data 帧和跨 chunk UTF-8
- [ ] 能说清 FakeReader 循环，以及为什么不能真打网
`;

const chapter = {
  id: "ch11",
  num: "11",
  title: "fetch、JSON、Stream 概念",
  runMode: "browser",
  tutorialMd,
  assignment,
  testName: "ch11_assignment",
  testSource,
  reviewMd,
  interleaved: true,
  sections,
  functions,
  preamble,
};

const out = join(dirname(fileURLToPath(import.meta.url)), "../src/content/chapters/ch11.json");
mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, JSON.stringify(chapter, null, 2) + "\n");
console.log("wrote", out);
