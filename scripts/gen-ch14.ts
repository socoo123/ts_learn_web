/**
 * 生成 src/content/chapters/ch14.json
 * 运行：bun scripts/gen-ch14.ts
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const preamble = `/**
 * Ch14 作业：用纯函数模拟 useEffect 的 deps / cleanup / 过期与卸载。
 * 禁止 setTimeout / fetch / import react。
 *
 * 场景：商品助手输入框里的 sku 从 KB-001 换成 MS-002，要退订旧库存、订新库存；
 * 晚到的旧响应必须丢；组件卸了结果作废。
 *
 * 全绿 = 你掌握了 Ch14。
 */`;

const functions = [
  {
    name: "needRerun",
    testSuite: "needRerun",
    skeleton: `/**
 * 【场景】商品助手输入框里的 sku 从「KB-001」换成「MS-002」。
 * useEffect(fn, [sku]) 要不要重跑？首次挂载一定要跑。
 *
 * 【转换点】deps 是浅比较：逐位 Object.is，不是 JSON.stringify，也不是 ===。
 * prevDeps === null 表示还没跑过（首次 mount）→ 必跑。
 * Java Servlet init / @PostConstruct / Angular ngOnInit 只跑一次，和这题不是一回事。
 *
 * 任务：null → true；length 不同 → true；有一位 Object.is 不同 → true；全同 → false。
 * 示例：
 *   needRerun(null, ["KB-001"])           -> true
 *   needRerun(["KB-001"], ["KB-001"])     -> false
 *   needRerun(["KB-001"], ["MS-002"])     -> true
 *   needRerun([], [])                     -> false
 *   needRerun([NaN], [NaN])               -> false（Object.is(NaN, NaN) 为 true，和 === 不同）
 *   needRerun(["KB-001"], ["KB-001", "MS-002"]) -> true
 *
 * 提示：先判 null 和 length，再 for 里用 Object.is。不要用 === 比 NaN。
 */
export function needRerun(prevDeps: unknown[] | null, nextDeps: unknown[]): boolean {
  throw new Error("TODO");
}`,
  },
  {
    name: "registerCleanup",
    testSuite: "registerCleanup",
    skeleton: `/**
 * 【场景】订了 KB-001 的库存推送，要把「退订」函数登记进 cleanup 列表。
 * 稍后 sku 变了或组件卸了，按 FIFO 挨个调用。
 *
 * 【转换点】返回新数组，不要 push 原数组。
 * Python with 的 __exit__、try/finally 也是「离开时做对称动作」；
 * 这里先只负责登记，不在本题里调用。
 *
 * 任务：返回 [...cleanups, fn]。原数组 freeze 后 length 不能变。
 * 示例：
 *   registerCleanup([], unsubKb)     -> 新数组 length 1，末尾就是 unsubKb
 *   已有 [unsubKb] 再登记 unsubMs    -> length 2，顺序 FIFO：先 Kb 后 Ms
 *
 * 提示：展开成新数组。不要 cleanups.push(fn)。
 */
export function registerCleanup(
  cleanups: Array<() => void>,
  fn: () => void,
): Array<() => void> {
  throw new Error("TODO");
}`,
  },
  {
    name: "fakeEffectCycle",
    testSuite: "fakeEffectCycle",
    skeleton: `/**
 * 【场景】sku 从 KB-001 换成 MS-002：先退订旧库存，再订新的。
 * 这就是 effect 的一圈：依赖变了 → cleanup → setup。
 *
 * 【转换点】必须复用 needRerun。不要自己再写一遍比较。
 * 若要重跑：prevDeps !== null 则 log.push("cleanup")，然后 log.push("setup")，
 * 返回 nextDeps.slice()（浅拷贝）。
 * 若不重跑：不 push；返回 prevDeps === null ? [] : prevDeps.slice()。
 * 禁止改 nextDeps / prevDeps。
 *
 * 示例：
 *   prev null, next ["KB-001"]           -> log ["setup"]，返回 ["KB-001"]
 *   prev ["KB-001"], next ["KB-001"]     -> log []，返回 ["KB-001"]
 *   prev ["KB-001"], next ["MS-002"]     -> log ["cleanup","setup"]，返回 ["MS-002"]
 *
 * 提示：复用 needRerun。返回 slice，不要把 nextDeps 原引用交出去。
 */
export function fakeEffectCycle(
  prevDeps: unknown[] | null,
  nextDeps: unknown[],
  log: string[],
): unknown[] {
  throw new Error("TODO");
}`,
  },
  {
    name: "staleFlagGuard",
    testSuite: "staleFlagGuard",
    skeleton: `/**
 * 【场景】先查 KB-001（requestId=1），用户立刻改成 MS-002（latestId=2）。
 * id=1 的库存响应晚到：必须丢，不能把旧库存画到新 sku 上。
 *
 * 【转换点】generation / 请求代数。不是「谁先发出谁算数」，是「谁还是当前这一代」。
 * Java Future.cancel 之后仍可能跑完；这里用纯函数：对不上 latestId 就返回 null。
 *
 * 任务：requestId === latestId → payload，否则 null。
 * 示例：
 *   staleFlagGuard(1, 2, "KB-001 库存 120")  -> null
 *   staleFlagGuard(2, 2, "MS-002 库存 300")  -> "MS-002 库存 300"
 *   staleFlagGuard(0, 0, "占位")             -> "占位"
 *
 * 提示：三元即可。不要按 payload 里的 sku 字符串猜。
 */
export function staleFlagGuard(
  requestId: number,
  latestId: number,
  payload: string,
): string | null {
  throw new Error("TODO");
}`,
  },
  {
    name: "debouncePlan",
    testSuite: "debouncePlan",
    skeleton: `/**
 * 【场景】输入框连续改 sku：KB → K → KB-001。每次按键都立刻订库存太吵。
 * debounce 的心智是：记下「下次允许执行的时刻」，把计时器往后推。
 *
 * 【转换点】返回 nowMs + waitMs。不要真的等，不要定时器。
 * 连续两次 (100, 300) 和 (180, 300) 得到 400 和 480——后一次更晚，表示计时器被推迟。
 *
 * 任务：返回相加后的时刻。
 * 示例：
 *   debouncePlan(1000, 300) -> 1300
 *   debouncePlan(0, 0)      -> 0
 *   debouncePlan(50, 300)   -> 350
 *   debouncePlan(100, 300)  -> 400
 *   debouncePlan(180, 300)  -> 480
 *
 * 提示：加法。本题不调度，只算时刻。
 */
export function debouncePlan(nowMs: number, waitMs: number): number {
  throw new Error("TODO");
}`,
  },
  {
    name: "abortWhenUnmount",
    testSuite: "abortWhenUnmount",
    skeleton: `/**
 * 【场景】查完 KB-001 库存之前用户关掉了商品助手。响应晚到时组件已经不在了。
 * 真 React 里这时再 setState 会警告；本题用纯函数表达「结果作废」。
 *
 * 【转换点】mounted 为 true 才采用 payload；false → null。
 * 对照 Python 里取消的 Task 结果不该再写进 UI；这里连异步都不跑，只判布尔。
 *
 * 任务：mounted ? payload : null。
 * 示例：
 *   abortWhenUnmount(true, "KB-001 库存 120")  -> "KB-001 库存 120"
 *   abortWhenUnmount(false, "KB-001 库存 120") -> null
 *
 * 提示：看 mounted，不要看 payload 是否为空。
 */
export function abortWhenUnmount(mounted: boolean, payload: string): string | null {
  throw new Error("TODO");
}`,
  },
];

const assignment = `${preamble}

${functions.map((f) => f.skeleton).join("\n\n")}
`;

const testSource = `describe("needRerun", () => {
  it("首次 mount：prevDeps 为 null 必跑", () => {
    expect(needRerun(null, ["KB-001"])).toBe(true);
    expect(needRerun(null, [])).toBe(true);
  });
  it("同一 sku 字符串不重跑；换成 MS-002 要重跑", () => {
    expect(needRerun(["KB-001"], ["KB-001"])).toBe(false);
    expect(needRerun(["KB-001"], ["MS-002"])).toBe(true);
  });
  it("空 deps 两次相等不重跑", () => {
    expect(needRerun([], [])).toBe(false);
  });
  it("NaN：Object.is(NaN, NaN) 为 true，不重跑", () => {
    expect(needRerun([NaN], [NaN])).toBe(false);
    expect(Object.is(NaN, NaN)).toBe(true);
  });
  it("length 不同必跑", () => {
    expect(needRerun(["KB-001"], ["KB-001", "MS-002"])).toBe(true);
    expect(needRerun(["KB-001", "MS-002"], ["KB-001"])).toBe(true);
  });
  it("浅比较：同一对象引用不重跑，形状相同的新对象要重跑", () => {
    const box = { sku: "KB-001" };
    expect(needRerun([box], [box])).toBe(false);
    expect(needRerun([box], [{ sku: "KB-001" }])).toBe(true);
  });
});

describe("registerCleanup", () => {
  it("空数组登记一个退订，原数组不被 mutate", () => {
    const log: string[] = [];
    const orig: Array<() => void> = [];
    Object.freeze(orig);
    const fn = () => {
      log.push("unsub KB-001");
    };
    const next = registerCleanup(orig, fn);
    expect(orig.length).toBe(0);
    expect(next.length).toBe(1);
    expect(Object.is(next, orig)).toBe(false);
    next[0]();
    expect(log).toEqual(["unsub KB-001"]);
  });
  it("已有 1 个再登记第 2 个，顺序 FIFO", () => {
    const log: string[] = [];
    const first = () => {
      log.push("unsub KB-001");
    };
    const second = () => {
      log.push("unsub MS-002");
    };
    const one = registerCleanup([], first);
    expect(one.length).toBe(1);
    const two = registerCleanup(one, second);
    expect(one.length).toBe(1);
    expect(two.length).toBe(2);
    expect(Object.is(two, one)).toBe(false);
    two[0]();
    two[1]();
    expect(log).toEqual(["unsub KB-001", "unsub MS-002"]);
  });
  it("freeze 原数组后调用新数组末尾 fn 会改 log", () => {
    const log: string[] = [];
    const kept = () => {
      log.push("kept");
    };
    const orig = Object.freeze([kept]);
    const extra = () => {
      log.push("unsub HP-006");
    };
    const next = registerCleanup(orig, extra);
    expect(orig.length).toBe(1);
    expect(next.length).toBe(2);
    next[next.length - 1]();
    expect(log).toEqual(["unsub HP-006"]);
  });
});

describe("fakeEffectCycle", () => {
  it("首次：prev null, next KB-001 → setup，返回浅拷贝", () => {
    const next = Object.freeze(["KB-001"]);
    const log: string[] = [];
    const ret = fakeEffectCycle(null, next, log);
    expect(log).toEqual(["setup"]);
    expect(ret).toEqual(["KB-001"]);
    expect(Object.is(ret, next)).toBe(false);
  });
  it("deps 没变：prev 与 next 都是 KB-001 → 空 log，返回拷贝", () => {
    const prev = Object.freeze(["KB-001"]);
    const next = Object.freeze(["KB-001"]);
    const log: string[] = [];
    const ret = fakeEffectCycle(prev, next, log);
    expect(log).toEqual([]);
    expect(ret).toEqual(["KB-001"]);
    expect(Object.is(ret, prev)).toBe(false);
    expect(Object.is(ret, next)).toBe(false);
  });
  it("sku 换成 MS-002：先 cleanup 再 setup", () => {
    const prev = Object.freeze(["KB-001"]);
    const next = Object.freeze(["MS-002"]);
    const log: string[] = [];
    const ret = fakeEffectCycle(prev, next, log);
    expect(log).toEqual(["cleanup", "setup"]);
    expect(ret).toEqual(["MS-002"]);
    expect(prev).toEqual(["KB-001"]);
    expect(next).toEqual(["MS-002"]);
    expect(Object.is(ret, next)).toBe(false);
  });
  it("freeze nextDeps 后返回值不是同一引用，也不 mutate", () => {
    const prev = Object.freeze(["HP-006"]);
    const next = Object.freeze(["HP-006", "SP-007"]);
    const log: string[] = [];
    const ret = fakeEffectCycle(prev, next, log);
    expect(log).toEqual(["cleanup", "setup"]);
    expect(ret).toEqual(["HP-006", "SP-007"]);
    expect(Object.is(ret, next)).toBe(false);
    expect(next.length).toBe(2);
    expect(prev.length).toBe(1);
  });
});

describe("staleFlagGuard", () => {
  it("旧请求晚到：id=1 对不上 latestId=2 → null", () => {
    expect(staleFlagGuard(1, 2, "KB-001 库存 120")).toBeNull();
  });
  it("当前这一代：id=2 的响应采用", () => {
    expect(staleFlagGuard(2, 2, "MS-002 库存 300")).toBe("MS-002 库存 300");
  });
  it("两者都是 0 → 返回 payload", () => {
    expect(staleFlagGuard(0, 0, "占位")).toBe("占位");
  });
  it("换一组 id / payload，防硬编码 MS-002", () => {
    expect(staleFlagGuard(3, 3, "HP-006 库存 80")).toBe("HP-006 库存 80");
    expect(staleFlagGuard(3, 4, "HP-006 库存 80")).toBeNull();
  });
});

describe("debouncePlan", () => {
  it("1000 + 300 → 1300；0+0 → 0", () => {
    expect(debouncePlan(1000, 300)).toBe(1300);
    expect(debouncePlan(0, 0)).toBe(0);
  });
  it("50 + 300 → 350", () => {
    expect(debouncePlan(50, 300)).toBe(350);
  });
  it("连续两次：100/300 与 180/300 → 400 和 480，后一次更晚", () => {
    expect(debouncePlan(100, 300)).toBe(400);
    expect(debouncePlan(180, 300)).toBe(480);
  });
  it("另一组时刻，防只硬编码 1300", () => {
    expect(debouncePlan(200, 50)).toBe(250);
  });
});

describe("abortWhenUnmount", () => {
  it("仍挂载：采用 KB-001 库存文案", () => {
    expect(abortWhenUnmount(true, "KB-001 库存 120")).toBe("KB-001 库存 120");
  });
  it("已卸载：结果作废 → null", () => {
    expect(abortWhenUnmount(false, "KB-001 库存 120")).toBeNull();
  });
  it("空 payload：mounted true 仍返回空串，false 仍 null", () => {
    expect(abortWhenUnmount(true, "")).toBe("");
    expect(abortWhenUnmount(false, "")).toBeNull();
  });
  it("换文案防硬编码", () => {
    expect(abortWhenUnmount(true, "MS-002 库存 300")).toBe("MS-002 库存 300");
    expect(abortWhenUnmount(false, "MS-002 库存 300")).toBeNull();
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
    `> **预计**：1 天 ｜ **前置**：Ch13（props / state / 不可变更新；\`reduceChat\` 交新值）
> **目标**：① effect 是**同步外部系统**，不是抄 Java 生命周期；② deps 变了才重跑；③ cleanup 对称；④ 过期请求与卸载要丢结果。
> 你 15 年 Java：\`Servlet#init/destroy\`、\`@PostConstruct\` **不是** effect。Python 的 \`with\` / \`__enter__\` / \`__exit__\` 更接近 cleanup。

> 📐 **本教程的契约**：下面每一节（§14.1–§14.6）都**精确对应**作业里的题。讲过的才考，考的必讲过。卡住时按作业函数名回查对应小节。
> **不讲**：\`useLayoutEffect\`、\`useReducer\` 深水、Zustand、\`useRef\` 深水、自定义 hooks 生态。作业**禁止 import react**，禁止真实定时器与网络。

---`,
    [],
  ),
  sec(
    "sec-map",
    "🗺️ 本章地图",
    null,
    `本章作业是一条完整主线：**商品助手输入框里的 sku**。用户从 \`KB-001\`（机械键盘，库存 120）换成 \`MS-002\`（无线鼠标，库存 300）→ 用 effect **订阅库存** → 晚到的旧请求必须丢 → 关掉助手必须 abort。6 个函数全是纯函数；教程给 JSX 示例，作业**不 import react**。

读完这章 + 完成作业，你将能够：

- 说出 useState 是「交新值」（连 Ch13 的 reducer），不是改字段
- 说出 useEffect 是「deps 变了才同步外部」，不是 \`ngOnInit\` / \`componentDidMount\` 只跑一次
- 用 \`Object.is\` 做 deps 浅比较（含 \`NaN\`）
- 登记 cleanup：订阅/退订对称；依赖变了 **先 cleanup 再 setup**
- 用 generation 丢掉过期响应；卸载后结果作废
- debounce **只算下次时刻**，不真等

**作业 ↔ 教程对应表**（学哪节，就去做哪题）：

| 作业题 | 对应小节 | 核心知识点 |
|--------|----------|-----------|
| \`needRerun\` | §14.1 | deps 浅比较（Object.is），null 表示首次 |
| \`registerCleanup\` | §14.2 | 登记 cleanup，返回新数组 |
| \`fakeEffectCycle\` | §14.3 | 依赖变了：先 cleanup 再 setup |
| \`staleFlagGuard\` | §14.4 | 过期请求丢弃（generation） |
| \`debouncePlan\` | §14.5 | 返回下次执行时刻，不真等 |
| \`abortWhenUnmount\` | §14.6 | 卸载后不再采用结果 |

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
| ④ 费曼（2 分钟） | 大白话讲清「effect 为什么不是 init」 | 本页 ④ |
| ⑤ 存闪卡 | 章末闪卡标复习日期 | 闪卡 |

> 💡 别从头读到尾。先扫 ① → 写作业 → **哪题卡了，回对应 § 查** → 改 → 再跑。
> \`fakeEffectCycle\` **必须复用 needRerun**，不要把比较逻辑再抄一遍。

---`,
    [],
  ),
  sec(
    "sec-guess",
    "① 预览猜（2 分钟 · 激活你的 Java / Python 直觉）",
    null,
    `先别看答案，凭经验猜一猜（猜错没关系）：

1. Java \`@PostConstruct void subscribe()\` 在 Spring Bean 里跑几次？把这段抄进 React 的 \`useEffect(() => subscribe(sku))\` **不写 deps**，sku 改了还会再订吗？
2. Python \`with open(path) as f\` 离开 with 会怎样？effect 的 \`return () => unsubscribe()\` 像不像 \`__exit__\`？
3. 用户先查 KB-001 再查 MS-002，KB 的响应晚到。Java \`Future.get()\` 仍会拿到旧结果。前端该画哪份库存？
4. \`setTimeout(fn, 300)\` 在作业运行器里能不能用？debounce 作业返回的是什么？
5. 组件卸了还 \`setState\`，控制台会怎样？本题用哪个纯函数表达「结果作废」？
6. \`Object.is(NaN, NaN)\` 和 \`NaN === NaN\` 哪个是 true？deps 比较用哪一个？

> 猜完，带着验证心态进入正文。第 1、3、6 题是本章的 🔴。

---`,
    [],
  ),
  sec(
    "sec-world",
    "hooks 心智：交新值，同步外部 🔴",
    null,
    `Ch13 说：state 要**交一份新值**（\`reduceChat\` 返回新对象）。本章两个 hook 都围着这句话：

| | 心智 | 对照 |
|---|---|---|
| **useState** | 交新值，像 Ch13 的 reducer / \`setSku("MS-002")\` | 不是 \`this.sku = ...\` |
| **useEffect** | deps 变了才去**同步外部系统**（订库存、加监听） | 不是 Servlet \`init\`，也不是「组件活着期间的字段」 |

### 先分清：什么叫「外部系统」

组件树内部：props、state、算出来的文案——Ch12/Ch13 已经覆盖。

**外部**：库存 WebSocket、浏览器 \`addEventListener\`、某份「当前 sku 的订阅」。这些 React **不知道**，你得告诉它：何时订、何时退订。这就是 effect。

### Java：生命周期 ≠ effect

\`\`\`java
public class StockServlet extends HttpServlet {
  public void init() { subscribe("KB-001"); }     // 进程级，启动一次
  public void destroy() { unsubscribe("KB-001"); }
}

@PostConstruct
void afterBuild() { subscribe(sku); }            // Bean 建好一次
\`\`\`

\`init\` / \`@PostConstruct\` / Angular \`ngOnInit\` / class 组件 \`componentDidMount\`：**对象创建时跑一次**。sku 后来变了，它们不会自动再跑。

effect 不是「组件的构造函数」。有 \`[sku]\` 时，**sku 每次变都要重新同步外部**。

### Python：context manager 更接近 cleanup

\`\`\`python
with subscribe_stock("KB-001") as sub:
    ...
# __exit__ 里退订 —— 对称
\`\`\`

\`useEffect\` 的 \`return cleanup\` 就是「离开这一圈 deps 时」的 \`__exit__\`。下一圈 setup 之前，先 cleanup。

### 教程示例（作业不跑 JSX）

\`\`\`tsx
function SkuBox() {
  const [sku, setSku] = useState("KB-001");
  // 交新值：和 Ch13 reduceChat 返回新 state 同一句话
  return <input value={sku} onChange={(e) => setSku(e.target.value)} />;
}

function StockWatcher(props: { sku: string }) {
  useEffect(() => {
    subscribeStock(props.sku);
    return () => unsubscribeStock(props.sku);
  }, [props.sku]);
}
\`\`\`

- **useState**：\`setSku\` 交新字符串，不是改输入框 DOM。
- **useEffect**：\`[props.sku]\` 变了才退订旧的、订新的。

### ❌ / ✅ 总开关

\`\`\`ts
// ❌ 把 effect 当 ngOnInit / componentDidMount：写一次订阅就完（有 deps 时不对）
// ❌ sku 变了不退订，内存里叠了 KB 和 MS 两路推送
// ✅ cleanup 对称：订阅/退订、加监听/移除
// ✅ 作业用纯函数模拟，不 import react
\`\`\`

\`\`\`mermaid
flowchart TD
    m["mount"] --> s1["setup"]
    s1 --> d["deps 变"]
    d --> c1["cleanup"]
    c1 --> s2["setup"]
    s2 --> u["unmount"]
    u --> c2["cleanup"]

    style m fill:#FFE082,stroke:#F9A825,color:#1f1f1f
    style s1 fill:#A5D6A7,stroke:#388E3C,color:#1f1f1f
    style d fill:#80DEEA,stroke:#0097A7,color:#1f1f1f
    style c1 fill:#EF9A9A,stroke:#C62828,color:#1f1f1f
    style s2 fill:#A5D6A7,stroke:#388E3C,color:#1f1f1f
    style u fill:#CE93D8,stroke:#7B1FA2,color:#1f1f1f
    style c2 fill:#EF9A9A,stroke:#C62828,color:#1f1f1f
\`\`\`

主线：输入框 sku 变化 → 订阅库存（effect）→ 晚到的旧请求必须丢 → 卸载必须 abort。

### 本课怎么算「会了」

测试会 freeze 原 deps / 原 cleanup 数组。你若 \`push\` 原数组、用 \`===\` 比 \`NaN\`、漏掉 cleanup、把过期 payload 画上去，就会红。**全绿 = 这题掌握。**

---`,
    [],
  ),
  sec(
    "sec-14.1",
    "§14.1 deps 浅比较（对应：`needRerun`）🔴",
    "14.1",
    `React 比较 \`[sku]\` 用的是 **逐位 \`Object.is\`**，不是深比较，也不是 \`JSON.stringify\`。

\`prevDeps === null\` 表示**还没跑过**（首次 mount）→ 一定要跑。空数组 \`[]\` 对 \`[]\` 每一位都相同 → 不重跑（「只在 mount 订一次、卸时退订」那种写法，作业用 \`[]\` 表达「deps 没变」）。

### Java / Python 对照

\`\`\`java
// Servlet init 没有 deps。sku 字段后来变了，init 不会再来。
public void init() { subscribe(this.sku); }
\`\`\`

\`\`\`python
# 你每次手动比 prev_sku != next_sku；NaN 在 Python 里 float('nan') != float('nan')
\`\`\`

### TypeScript：\`Object.is\`

\`\`\`ts
function needRerun(prevDeps: unknown[] | null, nextDeps: unknown[]): boolean {
  if (prevDeps === null) return true;
  if (prevDeps.length !== nextDeps.length) return true;
  for (let i = 0; i < prevDeps.length; i++) {
    if (!Object.is(prevDeps[i], nextDeps[i])) return true;
  }
  return false;
}

needRerun(null, ["KB-001"]);                 // true  首次
needRerun(["KB-001"], ["KB-001"]);           // false 同 string，按值
needRerun(["KB-001"], ["MS-002"]);           // true
needRerun([], []);                           // false
needRerun([NaN], [NaN]);                     // false —— Object.is(NaN, NaN) === true
needRerun(["KB-001"], ["KB-001", "MS-002"]); // true  length
\`\`\`

**点出 NaN**：\`NaN === NaN\` 是 \`false\`，所以不能用 \`===\` 逐位比。\`Object.is\` 把 \`NaN\` 当成「同一个东西」。

浅比较：同一个对象引用 → 不重跑；\`{ sku: "KB-001" }\` 另 new 一份 → 要重跑（哪怕字段一样）。

### ❌ / ✅

\`\`\`ts
// ❌ prevDeps == null 用错成「空数组也当首次」（[] 不是 null）
// ❌ 用 === 比每一项（NaN 会误判要重跑）
// ❌ JSON.stringify 深比较（作业要浅比较）
// ✅ null 先判；length；Object.is
\`\`\`

> ✅ **做 \`needRerun\`**：首次 / 同 sku / 换 sku / 空数组 / NaN / length。

---`,
    ["needRerun"],
  ),
  sec(
    "sec-14.2",
    "§14.2 登记 cleanup（对应：`registerCleanup`）🟡",
    "14.2",
    `订了库存就要能退订。effect 的 \`return () => unsubscribe(sku)\` 就是在**登记** cleanup。本题只做登记：接到列表末尾，返回**新数组**。

### Python：\`__exit__\` 对称

\`\`\`python
class StockSub:
    def __enter__(self):
        subscribe(self.sku)
        return self
    def __exit__(self, *args):
        unsubscribe(self.sku)
\`\`\`

Java \`try/finally\`、Servlet \`destroy\` 也是对称动作。React 把「离开这一圈」的函数先存起来。

### TypeScript：展开，不要 push 原数组

\`\`\`ts
function registerCleanup(
  cleanups: Array<() => void>,
  fn: () => void,
): Array<() => void> {
  return [...cleanups, fn];
}
\`\`\`

和 Ch13 \`appendMessage\` 同一句话：\`Object.is\` 看引用；测试会 freeze 原数组。

- 空列表登记一个 → 新 length 1；调用末尾 fn 会改 log
- 已有 1 个再登记第 2 个 → FIFO：先退 KB，再退 MS

### ❌ / ✅

\`\`\`ts
// ❌ cleanups.push(fn); return cleanups;
// ❌ 倒序 unshift（FIFO 会反）
// ✅ [...cleanups, fn]
\`\`\`

> ✅ **做 \`registerCleanup\`**：新数组，末尾接上 fn。

---`,
    ["registerCleanup"],
  ),
  sec(
    "sec-14.3",
    "§14.3 先 cleanup 再 setup（对应：`fakeEffectCycle`）🔴",
    "14.3",
    `sku 从 KB-001 换成 MS-002：**先退订旧库存，再订新的**。不能两路订阅叠在一起。

必须 **调用 \`needRerun\`**，不要把 §14.1 再抄一遍。

| 情况 | log | 返回 |
|---|---|---|
| prev \`null\`，next \`["KB-001"]\` | \`["setup"]\` | \`nextDeps.slice()\` |
| 同 sku | 不 push（空） | \`prevDeps.slice()\` |
| KB → MS | \`["cleanup","setup"]\` | \`nextDeps.slice()\` |

\`prevDeps !== null\` 才有「上一圈」可退；首次只有 setup。

\`\`\`ts
function fakeEffectCycle(
  prevDeps: unknown[] | null,
  nextDeps: unknown[],
  log: string[],
): unknown[] {
  if (needRerun(prevDeps, nextDeps)) {
    if (prevDeps !== null) log.push("cleanup");
    log.push("setup");
    return nextDeps.slice();
  }
  return prevDeps === null ? [] : prevDeps.slice();
}
\`\`\`

禁止 mutate \`nextDeps\` / \`prevDeps\`。测试 freeze 它们；返回值**不是** \`nextDeps\` 同一引用。

对照总述那张图：mount → setup → deps 变 → cleanup → setup → unmount → cleanup。本题覆盖前半段「要不要重跑、顺序」。卸载采用结果在 §14.6。

### ❌ / ✅

\`\`\`ts
// ❌ 先 setup 再 cleanup（旧订阅还在就订新的）
// ❌ 自己用 === 比 deps，不复用 needRerun
// ❌ return nextDeps（同一引用；freeze 后你若改它会炸，测试也查引用）
// ✅ 复用 needRerun；先 cleanup 再 setup；slice
\`\`\`

> ✅ **做 \`fakeEffectCycle\`**：复用 needRerun；sku 换成 MS-002 时 log 为 cleanup → setup。

---`,
    ["fakeEffectCycle"],
  ),
  sec(
    "sec-14.4",
    "§14.4 过期请求丢弃（对应：`staleFlagGuard`）🔴",
    "14.4",
    `先发出 KB-001（\`requestId = 1\`），用户立刻改成 MS-002（\`latestId = 2\`）。id=1 的响应晚到：**必须丢**，否则输入框已经是鼠标，气泡却写着键盘库存 120。

### Java：Future 跑完仍有结果

\`\`\`java
Future<String> f = exec.submit(() -> lookup("KB-001"));
// 用户已经改查 MS-002，f.get() 仍可能返回键盘库存
\`\`\`

前端用 **generation（请求代数）**：只认 \`requestId === latestId\` 的那一份。

### TypeScript

\`\`\`ts
function staleFlagGuard(
  requestId: number,
  latestId: number,
  payload: string,
): string | null {
  return requestId === latestId ? payload : null;
}

staleFlagGuard(1, 2, "KB-001 库存 120");  // null  晚到的旧请求
staleFlagGuard(2, 2, "MS-002 库存 300");  // 采用
staleFlagGuard(0, 0, "占位");             // 代数相同就采用
\`\`\`

不要解析 payload 里的 sku 字符串。对代数，不对文案。

### ❌ / ✅

\`\`\`ts
// ❌ 谁先发出谁算数
// ❌ payload.includes("MS-002") 才返回（硬编码）
// ✅ requestId === latestId ? payload : null
\`\`\`

> ✅ **做 \`staleFlagGuard\`**：对不上 latestId 就 null。

---`,
    ["staleFlagGuard"],
  ),
  sec(
    "sec-14.5",
    "§14.5 debounce 只算时刻（对应：`debouncePlan`）🟡",
    "14.5",
    `输入框连续改 sku：\`K\` → \`KB\` → \`KB-001\`。每次按键都立刻订库存太吵。debounce 的心智：**把「下次允许执行的时刻」往后推**。

本题**不真等**。作业运行器禁止真实定时器。你只返回 \`nowMs + waitMs\`。

### Java / Python

\`\`\`java
// 真项目里 ScheduledExecutorService.schedule，本题不要
\`\`\`

\`\`\`python
# asyncio.sleep(0.3) 也不要。只算 t_next = now + wait
\`\`\`

### TypeScript

\`\`\`ts
function debouncePlan(nowMs: number, waitMs: number): number {
  return nowMs + waitMs;
}

debouncePlan(1000, 300); // 1300
debouncePlan(0, 0);      // 0
debouncePlan(50, 300);   // 350
debouncePlan(100, 300);  // 400
debouncePlan(180, 300);  // 480 —— 比 400 更晚：计时器被推迟
\`\`\`

连续两次调用：第一次计划 400，第二次计划 480。后一次更晚，表示「又按了一下，旧的那次不该再跑」。

### ❌ / ✅

\`\`\`ts
// ❌ 真去等 300ms
// ❌ 返回 waitMs 本身、或 Math.max 乱算
// ✅ nowMs + waitMs
\`\`\`

> ✅ **做 \`debouncePlan\`**：加法；两组连续时刻后一次更大。

---`,
    ["debouncePlan"],
  ),
  sec(
    "sec-14.6",
    "§14.6 卸载后作废（对应：`abortWhenUnmount`）🔴",
    "14.6",
    `查完 KB-001 之前用户关掉了商品助手。响应晚到时组件已经不在了。真 React 里这时再 \`setState\` 会警告；本题用纯函数表达：**结果作废**。

和 §14.4 的差别：§14.4 是「还在，但已经是下一代 sku」；这里是「人不在了」。

### TypeScript

\`\`\`ts
function abortWhenUnmount(mounted: boolean, payload: string): string | null {
  return mounted ? payload : null;
}

abortWhenUnmount(true, "KB-001 库存 120");  // 采用
abortWhenUnmount(false, "KB-001 库存 120"); // null
\`\`\`

空字符串 payload：仍挂载就返回 \`""\`，卸了仍是 \`null\`。看的是 \`mounted\`，不是 payload 好不好看。

### ❌ / ✅

\`\`\`ts
// ❌ 卸了还把 payload 交给 setState
// ❌ 用 payload.length 判断（空串会错）
// ✅ mounted ? payload : null
\`\`\`

> ✅ **做 \`abortWhenUnmount\`**：true 采用，false 作废。

---`,
    ["abortWhenUnmount"],
  ),
  sec(
    "sec-pits",
    "⚠️ Java / Python 老手几个坑",
    null,
    `1. **把 effect 当 \`Servlet#init\` / \`@PostConstruct\` / \`ngOnInit\` / \`componentDidMount\`。** 有 \`[sku]\` 时，sku 变了必须再同步外部。
2. **只订不退。** cleanup 对称：订阅/退订、加监听/移除。deps 变了**先 cleanup 再 setup**。
3. **用 \`===\` 比 deps。** \`NaN === NaN\` 为 false，\`Object.is\` 为 true。浅比较也不要 \`JSON.stringify\`。
4. **\`cleanups.push\`。** 和 Ch13 一样，freeze 后原 length 必须还能对上。
5. **晚到的旧请求当真相。** 用 generation：\`requestId === latestId\` 才采用。
6. **debounce 真去等。** 作业只返回时刻，禁止真实定时器。
7. **卸了还采用结果。** \`mounted === false\` → null。对照：卸了再 setState 会警告。
8. **作业 import react。** 运行器没有 React；JSX 只出现在教程里。
9. **不讲 \`useLayoutEffect\`、\`useReducer\` 深水、Zustand、\`useRef\` 深水、自定义 hooks 生态。** 看见别慌，本章不考。
10. **\`fakeEffectCycle\` 不复用 \`needRerun\`。** 综合题必须调用前面的函数。

---`,
    [],
  ),
  sec(
    "sec-homework",
    "📝 本章作业",
    null,
    `上面 6 个函数按节交错出现。每个注释里有【场景】【转换点】、示例和提示。

**完成方式**：在编辑器里改 \`throw new Error("TODO")\`，点「▶ 运行测试」。全绿 = 这题过了。

卡住就回对应 §：\`needRerun\` → §14.1，\`fakeEffectCycle\` → §14.3（请复用 needRerun），\`abortWhenUnmount\` → §14.6。

提示只点知识点：\`Object.is\` / \`[...arr, fn]\` / 先 cleanup 再 setup / 代数相等 / 时刻相加 / mounted 布尔。不要 import react，不要真等，不要真发网络。

---`,
    [],
  ),
  sec(
    "sec-check",
    "✅ 自测：你真的掌握了吗？",
    null,
    `- [ ] 能说清 effect 同步外部，不是 Java 生命周期、不是 ngOnInit 只跑一次
- [ ] 能说清 useState 交新值（连 Ch13），useEffect 看 deps
- [ ] \`needRerun\`：null 必跑；同 string 不跑；NaN 用 Object.is
- [ ] cleanup 登记是新数组；依赖变了先 cleanup 再 setup
- [ ] 晚到的 requestId 对不上 latestId → null
- [ ] debounce 只返回 \`nowMs + waitMs\`
- [ ] 卸载后 payload 作废
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

1. 「为什么 \`useEffect\` 不是 Servlet \`init\` / \`@PostConstruct\` / \`ngOnInit\`？sku 从 KB-001 换成 MS-002 时外部系统该发生什么？」— 卡壳重读总述 + §14.1 + §14.3
2. 「为什么下一圈 setup 之前必须先 cleanup？Python 的 \`with\` / \`__exit__\` 像在哪？」— 卡壳重读 §14.2 + §14.3
3. 「先查键盘再查鼠标，键盘的响应晚到为什么必须丢？组件已经卸了为什么也不能 \`setState\`？」— 卡壳重读 §14.4 + §14.6

---`,
    [],
  ),
  sec(
    "sec-next",
    "⏭️ 下一步",
    null,
    `Ch14 掌握后，进 **Ch15 · 表单与列表（Chat UI 基础）**。本章解决「deps / cleanup / 过期与卸载」；下一章解决受控输入、列表 \`key\`、消息气泡数据——仍然是纯函数为主，把输入框和列表接到 Chat UI 上。`,
    [],
  ),
];

const tutorialMd = `# Ch14 · hooks 心智

${sections
  .map((s) => (s.heading ? `## ${s.heading}\n\n${s.body}` : s.body))
  .join("\n\n")}
`;

const reviewMd = `# Ch14 · 记忆闪卡

> 先回忆，再翻答案。连续 2 次秒答 → 退役。

## 🔖 闪卡

| # | 正面（问题） | 背面（答案） | 掌握 |
|---|---|---|---|
| 1 | effect 是生命周期吗？和 Servlet init / ngOnInit 差在哪？ | **不是。** effect 同步外部系统。有 deps 时值变了要再跑，不是对象创建时只跑一次 | ⬜ |
| 2 | useState 和 Ch13 reducer 同一句话是什么？ | **交新值。** \`setSku("MS-002")\` 像 \`reduceChat\` 返回新 state，不是改字段 | ⬜ |
| 3 | deps 怎么比？\`["KB-001"]\` 对 \`["KB-001"]\` 重跑吗？ | **浅比较 Object.is。** 同 string 不重跑；length 不同或有一位不同才跑 | ⬜ |
| 4 | \`Object.is(NaN, NaN)\` 和 \`===\` 谁 true？deps 用谁？ | Object.is 为 true，=== 为 false。deps 必须 Object.is，否则 NaN 会被当成「变了」 | ⬜ |
| 5 | sku 从 KB 换成 MS，cleanup 和 setup 谁先？ | **先 cleanup 再 setup。** 退订旧库存，再订新的，两路不能叠 | ⬜ |
| 6 | \`registerCleanup\` 为什么不能 push 原数组？ | 要新数组 \`[...cleanups, fn]\`。React / 测试都看引用；FIFO 末尾追加 | ⬜ |
| 7 | 先查 KB（id=1）再查 MS（id=2），id=1 晚到怎么办？ | **stale：丢。** \`requestId !== latestId\` 返回 null，别把旧库存画到新 sku 上 | ⬜ |
| 8 | debounce 作业返回什么？为什么不真等？ | 返回 \`nowMs + waitMs\` 这个时刻。禁止定时器；后一次更晚 = 计时器被推迟 | ⬜ |
| 9 | 组件卸了，库存响应晚到，该采用吗？ | **abort：不采用。** \`mounted === false\` → null。对照：卸了再 setState 会警告 | ⬜ |
| 10 | \`prevDeps === null\` 表示什么？空 \`[]\` 对 \`[]\` 呢？ | null = 首次 mount 必跑。\`[]\` 对 \`[]\` 浅比较全同，不重跑 | ⬜ |

## 🎓 费曼自检

- [ ] 能说清 effect ≠ 生命周期，deps 变了才同步外部
- [ ] 能说清 Object.is / cleanup 先于下次 setup / stale 请求
- [ ] 能说清 debounce 只算时刻、unmount 后 abort
`;

const chapter = {
  id: "ch14",
  num: "14",
  title: "hooks 心智",
  runMode: "browser",
  tutorialMd,
  assignment,
  testName: "ch14_assignment",
  testSource,
  reviewMd,
  interleaved: true,
  sections,
  functions,
  preamble,
};

const out = join(dirname(fileURLToPath(import.meta.url)), "../src/content/chapters/ch14.json");
mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, JSON.stringify(chapter, null, 2) + "\n");
console.log("wrote", out);
