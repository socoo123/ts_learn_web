/**
 * 生成 src/content/chapters/ch08.json
 * 运行：bun scripts/gen-ch08.ts
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const preamble = `/**
 * Ch08 作业：在假 Event Loop 上记录执行顺序。
 *
 * 场景：商品助手边生成边吐 token。onDelta 像微任务排队；
 * 界面「下一帧再画」像宏任务。日志「看起来乱」，其实是两套队列。
 * 6 个函数：一微一宏 → 两个微任务 → 宏里再排微 → then vs 延时回调 →
 * 模拟 await 切开 → 只冲刷微队列。
 *
 * 约定：不要自己跑回调。scheduleMacro / scheduleMicro 由测试注入，
 * 只是往数组 push。测试再用 runOneTurn / flushMicrotasks 决定何时执行。
 *
 * 禁止：真实计时器、真实微任务 API、真网络。本页测试 4 秒超时，
 * 回调必须靠注入的调度器登记，不能真的去等。
 *
 * 全绿 = 你掌握了 Ch08。
 */

type Schedule = (job: () => void) => void;`;

const functions = [
  {
    name: "explainOrderA",
    testSuite: "explainOrderA",
    skeleton: `/**
 * 【场景】订单页脚本：先打两行同步日志，再登记「下一帧刷新价格」和
 * 「token 到达」。客服看着日志问：刷新怎么跑到 token 后面了？
 *
 * 【转换点】调用栈上的同步代码先跑完；微任务（Promise.then）整队清空
 * 之后，才跑一个宏任务（延时回调）。Java 线程可能把两段并行插进来；
 * JS 是单线程，登记 ≠ 立刻跑。
 *
 * 任务：按下面四步写，标签必须一字不差：
 *   log.push("A-sync-1");
 *   scheduleMacro(() => log.push("A-macro"));
 *   scheduleMicro(() => log.push("A-micro"));
 *   log.push("A-sync-2");
 * 测试会先调你的函数，再做「一假回合」：清空微队列 → 跑一个宏 → 再清空微。
 * 示例（一假回合之后）：
 *   ["A-sync-1", "A-sync-2", "A-micro", "A-macro"]
 *
 * 提示：同步两行会先出现。不要在函数里亲自调用那些箭头函数。
 *       调换 macro/micro 的登记先后，不影响最终顺序；写错标签会红。
 */
export function explainOrderA(
  log: string[],
  scheduleMacro: Schedule,
  scheduleMicro: Schedule,
): void {
  throw new Error("TODO");
}`,
  },
  {
    name: "explainOrderB",
    testSuite: "explainOrderB",
    skeleton: `/**
 * 【场景】同一帧来了两条 token（micro-1、micro-2），还登记了一次界面刷新
 * （macro）。两条 token 必须都印完，才轮到刷新——否则气泡会闪半截字。
 *
 * 【转换点】微队列是 FIFO，且会在宏任务之前被全部抽干。不是「登记一个
 * 微、跑一个宏、再跑下一个微」。
 *
 * 任务：先同步 "B-sync"；再登记两个微 "B-micro-1"、"B-micro-2"；
 * 再登记一个宏 "B-macro"。标签必须一字不差。
 * 示例（一假回合之后）：
 *   ["B-sync", "B-micro-1", "B-micro-2", "B-macro"]
 *
 * 提示：两个 scheduleMicro 的先后 = 两个 token 的先后。
 *       不要把 "B-macro" 推进微队列。
 */
export function explainOrderB(
  log: string[],
  scheduleMacro: Schedule,
  scheduleMicro: Schedule,
): void {
  throw new Error("TODO");
}`,
  },
  {
    name: "explainOrderC",
    testSuite: "explainOrderC",
    skeleton: `/**
 * 【场景】价格刷新这个宏任务跑起来以后，才发现还要补一条「刷新完成」的
 * token 日志。这条补记必须排进微队列——当前宏跑完、栈空了才执行。
 *
 * 【转换点】宏任务回调里 scheduleMicro，那个微要等宏的函数体结束。
 * 如果你在顶层（和 "C-sync" 一起）就登记微任务，它会排到宏前面，顺序反了。
 *
 * 任务：同步 "C-sync"。只登记一个宏；宏回调里面必须：
 *   scheduleMicro(() => log.push("C-micro-from-macro"));
 *   log.push("C-macro");
 * （先 log 再 schedule 也可以：schedule 不会立刻跑，宏体总在它排出的微前面。）
 * 示例（抽干微 → 跑一个宏 → 再抽干微）：
 *   ["C-sync", "C-macro", "C-micro-from-macro"]
 *
 * 提示：顶层不要 scheduleMicro。测试会先只抽微队列——那时日志里还不能
 *       出现 C-micro-from-macro。
 */
export function explainOrderC(
  log: string[],
  scheduleMacro: Schedule,
  scheduleMicro: Schedule,
): void {
  throw new Error("TODO");
}`,
  },
  {
    name: "queueVsTimeout",
    testSuite: "queueVsTimeout",
    skeleton: `/**
 * 【场景】电商流式助手：脚本同步启动；Promise.then 把 token 追加到气泡
 * （微任务）；延时 0 的界面重绘（宏任务）。token 总是「抢在」重绘前打印。
 *
 * 【转换点】then = 微；延时回调 = 宏。不是「谁先登记谁先跑」，是两套队列。
 * Ch06 你写过 Promise.then / await；本章要能口述它们何时真正执行。
 *
 * 任务：
 *   log.push("Q-script");
 *   scheduleMacro(() => log.push("Q-timeout"));
 *   scheduleMicro(() => log.push("Q-then"));
 * 示例（一假回合之后）：
 *   ["Q-script", "Q-then", "Q-timeout"]
 *
 * 提示：Q-then 在 Q-timeout 前面。不要两个都推进同一条队列。
 */
export function queueVsTimeout(
  log: string[],
  scheduleMacro: Schedule,
  scheduleMicro: Schedule,
): void {
  throw new Error("TODO");
}`,
  },
  {
    name: "asyncBreak",
    testSuite: "asyncBreak",
    skeleton: `/**
 * 【场景】助手函数一进门打 "F-enter"，await 模型返回，再打 "F-after-await"。
 * 调用方在 f() 后面还有 "F-after-call"（比如继续拼 SKU）。await 不会堵住
 * 调用方——它把续体排进微队列。
 *
 * 【转换点】await 把函数切开。进入到 await 之前是同步的；await 之后是微任务。
 * 调用后面的同步代码，比续体先跑。Python asyncio 也是「await 让出循环」；
 * Java 的 future.get() 会占着线程等，不一样。
 *
 * 任务：模拟切开，不要真写 async/await：
 *   log.push("F-enter");
 *   scheduleMicro(() => log.push("F-after-await"));
 *   log.push("F-after-call");
 * 本题用不到 scheduleMacro，但签名保留——不要用它登记续体。
 * 示例（只抽干微队列，不跑宏）：
 *   ["F-enter", "F-after-call", "F-after-await"]
 *
 * 提示：F-after-call 必须在 F-after-await 前面。
 *       若你同步 push 三行，测试在「抽干之前」就会红。
 */
export function asyncBreak(
  log: string[],
  scheduleMacro: Schedule,
  scheduleMicro: Schedule,
): void {
  throw new Error("TODO");
}`,
  },
  {
    name: "flushMicrotasks",
    testSuite: "flushMicrotasks",
    skeleton: `/**
 * 【场景】你来当循环：商品助手这一帧只把 token 回调（微队列）全部刷完，
 * 界面重绘（宏队列）留到下一帧。微任务里可能又登记新的微任务（嵌套
 * then）——这次冲刷也要跑到。
 *
 * 【转换点】while 队列还有活就 shift 出来跑。新 push 进来的也要跑。
 * 不要碰第二个参数（宏队列）。前五题你在登记；这一题你在抽干。
 *
 * 任务：只要 micro.length > 0，就取出队头并调用。jobs 可能 micro.push
 * 更多 job。不要 shift/splice/调用 _macro 里的函数。
 * 示例：
 *   micro 预放 [() => log.push("m1"), () => log.push("m2")]，
 *   _macro 预放 [() => log.push("M")]
 *   调用后 log === ["m1", "m2"]，_macro 仍有 1 个
 *   若 m1 执行时 micro.push(() => log.push("child"))，child 也要在本次跑完
 *
 * 提示：while (micro.length) { const job = micro.shift(); if (job) job(); }
 *       forEach / 先记下 length 再 for，会丢「跑着又登记」的那几个。
 */
export function flushMicrotasks(
  micro: Array<() => void>,
  _macro: Array<() => void>,
): void {
  throw new Error("TODO");
}`,
  },
];

const assignment = `${preamble}

${functions.map((f) => f.skeleton).join("\n\n")}
`;

const testSource = `function runOneTurn(micro: Array<() => void>, macro: Array<() => void>) {
  while (micro.length) micro.shift()!();
  if (macro.length) macro.shift()!();
  while (micro.length) micro.shift()!();
}

function makeLoop() {
  const log: string[] = [];
  const micro: Array<() => void> = [];
  const macro: Array<() => void> = [];
  const scheduleMacro: Schedule = (job) => {
    macro.push(job);
  };
  const scheduleMicro: Schedule = (job) => {
    micro.push(job);
  };
  return { log, micro, macro, scheduleMacro, scheduleMicro };
}

describe("explainOrderA", () => {
  it("一假回合：同步 → 微 → 宏", () => {
    const { log, micro, macro, scheduleMacro, scheduleMicro } = makeLoop();
    explainOrderA(log, scheduleMacro, scheduleMicro);
    runOneTurn(micro, macro);
    expect(log).toEqual(["A-sync-1", "A-sync-2", "A-micro", "A-macro"]);
  });
  it("调用刚结束时只有同步（专治把回调当场跑完 / 全 push 进 log）", () => {
    const { log, micro, macro, scheduleMacro, scheduleMicro } = makeLoop();
    explainOrderA(log, scheduleMacro, scheduleMicro);
    expect(log).toEqual(["A-sync-1", "A-sync-2"]);
    expect(micro.length).toBe(1);
    expect(macro.length).toBe(1);
  });
  it("微在宏前面（专治两条队列写反）", () => {
    const { log, micro, macro, scheduleMacro, scheduleMicro } = makeLoop();
    explainOrderA(log, scheduleMacro, scheduleMicro);
    while (micro.length) micro.shift()!();
    expect(log).toEqual(["A-sync-1", "A-sync-2", "A-micro"]);
    if (macro.length) macro.shift()!();
    expect(log).toEqual(["A-sync-1", "A-sync-2", "A-micro", "A-macro"]);
  });
});

describe("explainOrderB", () => {
  it("一假回合：同步 → 两个微 → 宏", () => {
    const { log, micro, macro, scheduleMacro, scheduleMicro } = makeLoop();
    explainOrderB(log, scheduleMacro, scheduleMicro);
    runOneTurn(micro, macro);
    expect(log).toEqual(["B-sync", "B-micro-1", "B-micro-2", "B-macro"]);
  });
  it("调用刚结束时只有 B-sync", () => {
    const { log, micro, macro, scheduleMacro, scheduleMicro } = makeLoop();
    explainOrderB(log, scheduleMacro, scheduleMicro);
    expect(log).toEqual(["B-sync"]);
    expect(micro.length).toBe(2);
    expect(macro.length).toBe(1);
  });
  it("两个微 FIFO，且都在宏前（专治 macro 插在两个 micro 中间）", () => {
    const { log, micro, macro, scheduleMacro, scheduleMicro } = makeLoop();
    explainOrderB(log, scheduleMacro, scheduleMicro);
    while (micro.length) micro.shift()!();
    expect(log).toEqual(["B-sync", "B-micro-1", "B-micro-2"]);
    expect(macro.length).toBe(1);
  });
});

describe("explainOrderC", () => {
  it("抽微 → 跑宏 → 再抽微：宏体先于它排出的微", () => {
    const { log, micro, macro, scheduleMacro, scheduleMicro } = makeLoop();
    explainOrderC(log, scheduleMacro, scheduleMicro);
    runOneTurn(micro, macro);
    expect(log).toEqual(["C-sync", "C-macro", "C-micro-from-macro"]);
  });
  it("调用刚结束时只有 C-sync，微队列应为空（专治顶层就 scheduleMicro）", () => {
    const { log, micro, macro, scheduleMacro, scheduleMicro } = makeLoop();
    explainOrderC(log, scheduleMacro, scheduleMicro);
    expect(log).toEqual(["C-sync"]);
    expect(micro.length).toBe(0);
    expect(macro.length).toBe(1);
  });
  it("只抽微队列时还不能出现 from-macro", () => {
    const { log, micro, macro, scheduleMacro, scheduleMicro } = makeLoop();
    explainOrderC(log, scheduleMacro, scheduleMicro);
    while (micro.length) micro.shift()!();
    expect(log).toEqual(["C-sync"]);
    if (macro.length) macro.shift()!();
    expect(log).toEqual(["C-sync", "C-macro"]);
    expect(micro.length).toBe(1);
    while (micro.length) micro.shift()!();
    expect(log).toEqual(["C-sync", "C-macro", "C-micro-from-macro"]);
  });
});

describe("queueVsTimeout", () => {
  it("一假回合：脚本 → then → timeout", () => {
    const { log, micro, macro, scheduleMacro, scheduleMicro } = makeLoop();
    queueVsTimeout(log, scheduleMacro, scheduleMicro);
    runOneTurn(micro, macro);
    expect(log).toEqual(["Q-script", "Q-then", "Q-timeout"]);
  });
  it("调用刚结束时只有 Q-script", () => {
    const { log, micro, macro, scheduleMacro, scheduleMicro } = makeLoop();
    queueVsTimeout(log, scheduleMacro, scheduleMicro);
    expect(log).toEqual(["Q-script"]);
    expect(micro.length).toBe(1);
    expect(macro.length).toBe(1);
  });
  it("then 在 timeout 前（专治两条队列写反 / 写死顺序）", () => {
    const { log, micro, macro, scheduleMacro, scheduleMicro } = makeLoop();
    queueVsTimeout(log, scheduleMacro, scheduleMicro);
    while (micro.length) micro.shift()!();
    expect(log).toEqual(["Q-script", "Q-then"]);
    if (macro.length) macro.shift()!();
    expect(log).toEqual(["Q-script", "Q-then", "Q-timeout"]);
  });
});

describe("asyncBreak", () => {
  it("只抽微：enter → after-call → after-await", () => {
    const { log, micro, macro, scheduleMacro, scheduleMicro } = makeLoop();
    asyncBreak(log, scheduleMacro, scheduleMicro);
    while (micro.length) micro.shift()!();
    expect(log).toEqual(["F-enter", "F-after-call", "F-after-await"]);
  });
  it("调用刚结束时续体还没跑（专治三行全同步 push）", () => {
    const { log, micro, macro, scheduleMacro, scheduleMicro } = makeLoop();
    asyncBreak(log, scheduleMacro, scheduleMicro);
    expect(log).toEqual(["F-enter", "F-after-call"]);
    expect(micro.length).toBe(1);
    expect(macro.length).toBe(0);
  });
  it("续体走微队列，不走宏队列（专治 scheduleMacro 登记 await 之后）", () => {
    const { log, micro, macro, scheduleMacro, scheduleMicro } = makeLoop();
    asyncBreak(log, scheduleMacro, scheduleMicro);
    expect(macro.length).toBe(0);
    expect(micro.length).toBe(1);
    while (micro.length) micro.shift()!();
    expect(log).toEqual(["F-enter", "F-after-call", "F-after-await"]);
    expect(macro.length).toBe(0);
  });
});

describe("flushMicrotasks", () => {
  it("抽干预放的微，不动宏", () => {
    const log: string[] = [];
    const micro: Array<() => void> = [
      () => log.push("m1"),
      () => log.push("m2"),
    ];
    const macro: Array<() => void> = [() => log.push("M")];
    flushMicrotasks(micro, macro);
    expect(log).toEqual(["m1", "m2"]);
    expect(micro.length).toBe(0);
    expect(macro.length).toBe(1);
  });
  it("抽着又 push 的微也要跑（专治 forEach / 先记下 length）", () => {
    const log: string[] = [];
    const micro: Array<() => void> = [];
    const macro: Array<() => void> = [() => log.push("M")];
    micro.push(() => {
      log.push("m1");
      micro.push(() => log.push("m1-child"));
    });
    micro.push(() => log.push("m2"));
    flushMicrotasks(micro, macro);
    expect(log).toEqual(["m1", "m2", "m1-child"]);
    expect(micro.length).toBe(0);
    expect(macro.length).toBe(1);
  });
  it("空微队列：什么都不跑，宏还在", () => {
    const log: string[] = [];
    const micro: Array<() => void> = [];
    const macro: Array<() => void> = [() => log.push("M")];
    flushMicrotasks(micro, macro);
    expect(log).toEqual([]);
    expect(macro.length).toBe(1);
  });
  it("微任务里往宏队列 push 也不跑宏（专治 flush 时顺手跑宏）", () => {
    const log: string[] = [];
    const micro: Array<() => void> = [];
    const macro: Array<() => void> = [];
    micro.push(() => {
      log.push("m");
      macro.push(() => log.push("M"));
    });
    flushMicrotasks(micro, macro);
    expect(log).toEqual(["m"]);
    expect(macro.length).toBe(1);
    const job = macro.shift();
    if (job) job();
    expect(log).toEqual(["m", "M"]);
  });
});
`;

const reviewMd = `# Ch08 · 记忆闪卡

> 先回忆，再翻答案。连续 2 次秒答 → 退役。

## 🔖 闪卡

| # | 正面（问题） | 背面（答案） | 掌握 |
|---|---|---|---|
| 1 | \`console.log(1); setTimeout(() => console.log(2)); Promise.resolve().then(() => console.log(3)); console.log(4);\` 打印顺序？ | **1 4 3 2**。同步 1、4 先；微任务 3；宏任务 2 | ⬜ |
| 2 | 为什么 \`setTimeout(fn, 0)\` 也比已经 resolve 的 \`then\` 晚？ | 0 不是「立刻」。当前栈清空后先抽干**整条**微队列，再取**一个**宏任务 | ⬜ |
| 3 | JS 和 Java 线程模型差在哪？Python 更像谁？ | JS **单线程 Event Loop**，回调不另开线程。Java Executor 是多线程。Python asyncio 循环是近亲 | ⬜ |
| 4 | 调用栈还没空，微任务会不会跑？ | 不会。必须当前同步代码（含正在跑的那个回调）返回，栈空了才轮到队列 | ⬜ |
| 5 | 两个 \`then\` 和一个 \`setTimeout(0)\`，宏会插在两个微中间吗？ | 不会。微队列 FIFO 且一次抽干，然后才是那个宏 | ⬜ |
| 6 | 宏回调里又 \`then\` / \`queueMicrotask\`，顺序？ | 宏的函数体先跑完（它 push 的那行 log 先出现），排出的微等这次宏结束再跑 | ⬜ |
| 7 | \`async function f() { log enter; await x; log after-await } f(); log after-call;\` 三行顺序？ | **enter → after-call → after-await**。await 续体是微任务 🟡 | ⬜ |
| 8 | 作业为什么不许真的 \`setTimeout\` / \`queueMicrotask\`？ | 真宏任务时序不稳，本页测试 4 秒超时。注入的 \`scheduleMacro\` / \`scheduleMicro\` 才是假循环 | ⬜ |
| 9 | 商品助手 token 的 \`onDelta\` 为什么总印在「延时 0 重绘」前面？ | token 回调按微任务（或当前栈里的队列）尽快跑；重绘是宏。微整队清空才轮到画 | ⬜ |
| 10 | \`flushMicrotasks\` 会不会把 timeout / 宏队列也跑掉？ | **不会**。只 \`shift\` 微队列；跑着新 push 的微也要跑，宏留到下一帧 | ⬜ |
| 11 | 冲刷微队列时，一个微又 \`micro.push\` 了新 job，这次会跑到吗？ | 会。\`while (length)\` 抽到空为止，不是按开始时的 length 截住 | ⬜ |
| 12 | Ch06 的 \`await\` / \`Promise.then\` 在循环里分别是什么？ | 都是**微任务**。\`setTimeout\` 才是宏。Ch06 教写法，本章教**何时跑** | ⬜ |

## 🎓 费曼自检

- [ ] 能口述经典顺序 1-4-3-2，并说出「先微后宏、微要抽干」
- [ ] 能说清 await 把函数切开：调用后面的同步代码比续体先跑
- [ ] 能说清 flush 微队列为什么不能顺手跑 timeout
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
    `> **预计**：0.5–1 天 ｜ **前置**：Ch06
> **目标**：① 能口述宏任务 / 微任务顺序；② 理解流式回调为什么「看起来乱」。
> 你 15 年 Java，Python 课也在前面。异步写法 Ch06 已经会了——本章要小心的是：**单线程；登记 ≠ 执行；await 之后的续体是微任务。**

> 📐 **本教程的契约**：下面每一节（§8.1–§8.6）都**精确对应**作业里的题。讲过的才考，考的必讲过。卡住时按作业函数名回查对应小节。
> 作业禁止真实计时器、禁止真实微任务 API、禁止 \`fetch\`。测试注入 \`scheduleMacro\` / \`scheduleMicro\`。

---`,
    [],
  ),
  sec(
    "sec-map",
    "🗺️ 本章地图",
    null,
    `本章作业是一条完整主线：**商品助手流式吐 token，日志顺序「看起来乱」**。6 个函数，全部往 \`log.push(...)\` 记账，调度器是注入的假循环。

读完这章 + 完成作业，你将能够：

- 画出调用栈空了之后：抽干微队列 → 取一个宏任务 → 再抽干微
- 对照 Java 线程 / Executor 与 JS **单线程 Event Loop**；Python asyncio 是近亲
- 说出 \`Promise.then\` / \`queueMicrotask\` / \`await\` 续体 = 微；延时回调 = 宏
- 解释为什么 token 的 \`onDelta\` 印在「下一帧重绘」前面
- 自己写一个只冲刷微队列、不动宏队列的 \`flushMicrotasks\`

**作业 ↔ 教程对应表**（学哪节，就去做哪题）：

| 作业题 | 对应小节 | 核心知识点 |
|--------|----------|-----------|
| \`explainOrderA\` | §8.1 | 同步 + 1 微 + 1 宏 |
| \`explainOrderB\` | §8.2 | 两个微任务先于宏任务 |
| \`explainOrderC\` | §8.3 | 宏回调自己再排一个微 |
| \`queueVsTimeout\` | §8.4 | then（微）vs 延时回调（宏） |
| \`asyncBreak\` | §8.5 | 模拟 await：续体是微；调用后的同步先跑 |
| \`flushMicrotasks\` | §8.6 | 只抽干微队列（含抽着又登记的） |

---`,
    [],
  ),
  sec(
    "sec-path",
    "⏱️ 学习路径：费曼五步（约 45–70 分钟）",
    null,
    `| 步 | 你要做 | 在哪做 |
|----|--------|--------|
| ① 预览猜（2 分钟） | 看下面的差异，先猜谁先打印 | 本页 ① |
| ② 先动手 | 每节后面的编辑器里**先试着写** | 本节练习 |
| ③ 提取+反馈 | 点「运行测试」看红绿 | 本节练习 |
| ④ 费曼（2 分钟） | 大白话讲清「为什么 token 抢在 timeout 前」 | 本页 ④ |
| ⑤ 存闪卡 | 章末闪卡标复习日期 | 闪卡 |

> 💡 别从头读到尾。先扫 ① → 写作业 → **哪题卡了，回对应 § 查** → 改 → 再跑。
> 前五题都是「往两套队列登记」；最后一题你当循环，把微队列抽干。

---`,
    [],
  ),
  sec(
    "sec-guess",
    "① 预览猜（2 分钟 · 激活你的 Java / Python 直觉）",
    null,
    `先别看答案，凭经验猜一猜（猜错没关系）：

1. Java 里 \`new Thread(() -> System.out.println("T")).start();\` 紧接着 main 打印 \`"M"\`，谁先？JS 里先登记延时 0 回调打印 \`"T"\`，再同步打印 \`"M"\`，谁先？
2. \`console.log(1); setTimeout(() => console.log(2)); Promise.resolve().then(() => console.log(3)); console.log(4);\` 四行数字什么顺序？
3. \`async function f() { console.log("enter"); await x; console.log("after-await"); } f(); console.log("after-call");\` 三行谁先？
4. 商品助手 \`onDelta\` 把 token \`push\` 进气泡，同时又 \`setTimeout(0)\` 重绘。为什么客服总看见「字已经在了、框还没重画」？
5. 冲刷微队列时，一个回调里又登记了新的微任务。这次冲刷会不会跑到？宏任务会不会被顺手跑掉？

> 猜完，带着验证心态进入正文。

---`,
    [],
  ),
  sec(
    "sec-contrast",
    "对照地图：线程池 vs 单线程循环 🔴",
    null,
    `Java 老手第一反应是：**再开一条线程**。浏览器里跑你的 TS，默认**没有第二条线程执行你的回调**（Web Worker 是另一回事，本章不考）。所有 \`then\`、延时回调、\`await\` 续体，都是排进队列，等**当前调用栈清空**再由 Event Loop 捡起来。

Python 课里的 **asyncio 循环**才是近亲：\`await\` 让出循环，不是 \`time.sleep\` 占着线程。Java 的 \`Future.get()\` / \`Thread.sleep\` 会把那条线程卡住。

| 概念 | Java | Python | JS / TS |
|---|---|---|---|
| 并发模型 | 多线程；Executor 抢核心 | asyncio **单线程循环**（另有线程池，不考） | **单线程 Event Loop** 🔴 |
| 「等一会儿」 | \`Thread.sleep\` 占着线程 | \`await asyncio.sleep\` 让出循环 | \`await\` / 回调让出循环 |
| 延后到下一轮 | \`Timer\` / \`schedule\` | \`loop.call_later\` | **延时回调 → 宏任务** |
| 当前轮尽快 | 同一线程直接调 | \`call_soon\` / Future 回调 | **\`Promise.then\` / \`queueMicrotask\` → 微任务** |
| \`await\` 之后 | 没有同等语法糖（直到后来） | 续体回到事件循环 | **续体是微任务** 🟡 |

\`\`\`mermaid
flowchart TD
  start["正在跑：脚本或某个回调"] --> empty{"调用栈空了?"}
  empty -->|"还在跑"| startWait["继续当前回调"]
  empty -->|"空了"| micro{"微队列还有活?"}
  micro -->|"有"| runMicro["取出队头微任务跑"]
  runMicro --> empty
  micro -->|"空"| macro{"宏队列还有活?"}
  macro -->|"有"| runMacro["取出一个宏任务跑"]
  runMacro --> empty
  macro -->|"空"| idle["等新任务进来"]
  style start fill:#FFE082,stroke:#F9A825,color:#1f1f1f
  style startWait fill:#FFE082,stroke:#F9A825,color:#1f1f1f
  style empty fill:#80DEEA,stroke:#0097A7,color:#1f1f1f
  style micro fill:#80DEEA,stroke:#0097A7,color:#1f1f1f
  style macro fill:#80DEEA,stroke:#0097A7,color:#1f1f1f
  style runMicro fill:#A5D6A7,stroke:#388E3C,color:#1f1f1f
  style runMacro fill:#FFCC80,stroke:#F57C00,color:#1f1f1f
  style idle fill:#CE93D8,stroke:#7B1FA2,color:#1f1f1f
\`\`\`

口诀就一句：**栈空 → 抽干微 → 跑一个宏 → 再抽干微。**

> 🟢 **和 Python 的衔接**：你已经接受「await 不占线程」。本章只是把「让出去之后谁先被捡起来」说清楚。
> 🟡 **和 Java 的衔接**：别拿 \`Executor.submit\` 的「可能立刻在别的核上跑」来想 \`setTimeout(0)\`。0 毫秒也要排队。
> 🔴 **两套队列**：微任务（microtask）和宏任务（macrotask / task）。作业用 \`scheduleMicro\` / \`scheduleMacro\` 模拟，不碰真实计时器。

### 本课怎么算「会了」

能对着 \`log\` 数组把顺序讲出来，并且测试全绿。**不要**靠「我在控制台试了一下 setTimeout」。本页测试 4 秒超时，真去等会挂。

---`,
    [],
  ),
  sec(
    "sec-8.1",
    "§8.1 同步 + 一微 + 一宏（对应：`explainOrderA`）🔴",
    "8.1",
    `订单页脚本要打两行同步日志，再登记「下一帧刷新价格」（宏）和「token 到了」（微）。客服问：刷新怎么跑到 token 后面？

### Java 对照：另一条线程可能插队

\`\`\`java
System.out.println("A-sync-1");
executor.submit(() -> System.out.println("A-macro")); // 可能马上在别的线程跑
System.out.println("A-sync-2");
\`\`\`

\`A-macro\` 和 \`A-sync-2\` 谁先，**没有保证**。这是多线程。

### Python：asyncio 更像 JS

\`\`\`python
print("A-sync-1")
loop.call_later(0, lambda: print("A-macro"))  # 下一轮循环
# 已完成的 Future.add_done_callback 更接近「尽快」
print("A-sync-2")
\`\`\`

先把当前回调跑完，再处理队列。和 JS 同一心智，细节名称不同。

### TypeScript：登记进两套队列 🔴

浏览器里「延时 0」是宏任务，\`Promise.then\` 是微任务。作业**不许**真写那些 API，用注入的调度器：

\`\`\`ts
function explainOrderA(
  log: string[],
  scheduleMacro: Schedule,
  scheduleMicro: Schedule,
): void {
  log.push("A-sync-1");
  scheduleMacro(() => log.push("A-macro"));
  scheduleMicro(() => log.push("A-micro"));
  log.push("A-sync-2");
}
\`\`\`

测试在你的函数返回之后，做**一假回合**：抽干微 → 跑一个宏 → 再抽干微。

\`\`\`ts
["A-sync-1", "A-sync-2", "A-micro", "A-macro"]
\`\`\`

经典课堂题同一结构：\`1\`、延时打印 \`2\`、\`then\` 打印 \`3\`、同步 \`4\` → **1 4 3 2**。

### ❌ / ✅

\`\`\`ts
// ❌ 亲自调用箭头函数——那就变成同步了
scheduleMacro(() => log.push("A-macro"));
log.push("A-macro");

// ❌ 三行全 log.push，不走调度器
log.push("A-sync-1");
log.push("A-sync-2");
log.push("A-micro");
log.push("A-macro");

// ❌ 微宏标签对调
scheduleMacro(() => log.push("A-micro"));

// ✅ 只登记，让测试的假循环去跑
\`\`\`

> 🤯 **转换点**：\`scheduleX(fn)\` 的意思是「把 fn **放进队列**」，不是 \`fn()\`。
> 真实场景：价格刷新可以晚一帧；token 必须尽快出现在日志里。所以 token 走微，刷新走宏。
>
> ✅ **做 \`explainOrderA\`**：四行，标签锁死。同步两行夹着两次 schedule。

---`,
    ["explainOrderA"],
  ),
  sec(
    "sec-8.2",
    "§8.2 两个微任务先于宏任务（对应：`explainOrderB`）🔴",
    "8.2",
    `同一帧来了两条 token，还登记了一次界面刷新。两条 token 必须都印完才画——否则气泡闪半截字。

### 不是「微、宏、微」穿插 🔴

有人以为事件循环像公平调度：A 跑一个、B 跑一个。**微队列不是这样。** 当前栈空了，要把**已经排上的微任务全部抽干**（抽的过程中新排进来的微也算，见 §8.6），然后才取**一个**宏任务。

\`\`\`ts
function explainOrderB(
  log: string[],
  scheduleMacro: Schedule,
  scheduleMicro: Schedule,
): void {
  log.push("B-sync");
  scheduleMicro(() => log.push("B-micro-1"));
  scheduleMicro(() => log.push("B-micro-2"));
  scheduleMacro(() => log.push("B-macro"));
}
\`\`\`

一假回合之后：

\`\`\`ts
["B-sync", "B-micro-1", "B-micro-2", "B-macro"]
\`\`\`

两个 \`scheduleMicro\` 的先后 = FIFO。先登记的 token 先印。

### 电商场景

运营配置里连续 \`then\` 两次：先写库存徽章、再写优惠文案。\`setTimeout(0)\` 才重绘卡片。徽章和文案都会在重绘前写完。

### ❌ / ✅

\`\`\`ts
// ❌ 把 B-macro 推进微队列——它会插到两个 token 之间或之前
scheduleMicro(() => log.push("B-macro"));

// ❌ 只登记一个微，第二个同步 push——调用刚结束时 log 里就会多出一行

// ✅ 两个 micro + 一个 macro；同步只有 B-sync
\`\`\`

> ✅ **做 \`explainOrderB\`**：先 sync，再两个 micro，再一个 macro。标签 \`B-micro-1\` / \`B-micro-2\` 不要写反。

---`,
    ["explainOrderB"],
  ),
  sec(
    "sec-8.3",
    "§8.3 宏回调里再排微任务（对应：`explainOrderC`）🔴",
    "8.3",
    `价格刷新这个宏任务跑起来，才发现还要补一条「刷新完成」日志。补记必须排进**微**队列：当前这个宏的函数体先跑完，栈空了，再跑这条微。

### 陷阱：在顶层就登记微 🔴

\`\`\`ts
// ❌ 和 C-sync 一起就把微排进去
log.push("C-sync");
scheduleMicro(() => log.push("C-micro-from-macro"));
scheduleMacro(() => log.push("C-macro"));
// 一假回合 → ["C-sync", "C-micro-from-macro", "C-macro"]  反了
\`\`\`

必须在**宏回调内部**登记：

\`\`\`ts
function explainOrderC(
  log: string[],
  scheduleMacro: Schedule,
  scheduleMicro: Schedule,
): void {
  log.push("C-sync");
  scheduleMacro(() => {
    scheduleMicro(() => log.push("C-micro-from-macro"));
    log.push("C-macro");
  });
}
\`\`\`

\`scheduleMicro\` 仍然只是 push。所以宏体里无论先 log 再 schedule，还是先 schedule 再 log，\`C-macro\` 都在 \`C-micro-from-macro\` 前面——后者要等宏返回、测试再抽微队列。

抽干微 → 跑一个宏 → 再抽干微：

\`\`\`ts
["C-sync", "C-macro", "C-micro-from-macro"]
\`\`\`

测试还会：**只抽微、先不跑宏**。那时日志必须仍是 \`["C-sync"]\`。若你顶层登记了微，这里就会提前冒出 \`C-micro-from-macro\`。

### Java 对照

\`\`\`java
executor.submit(() -> {
    log.add("C-macro");
    executor.submit(() -> log.add("C-micro-from-macro"));
});
\`\`\`

内层任务可能在别的线程立刻跑，甚至插在 \`C-macro\` 后面那一行之前。JS 没有这条路：内层微必须等外层回调把栈清掉。

> 真实场景：重绘函数末尾 \`queueMicrotask\` 通知「这一帧画完了」。通知不会在重绘函数的下一行同步触发。
>
> ✅ **做 \`explainOrderC\`**：顶层只 sync + 一个 scheduleMacro；微写在宏箭头函数里面。

---`,
    ["explainOrderC"],
  ),
  sec(
    "sec-8.4",
    "§8.4 then（微）vs 延时回调（宏）（对应：`queueVsTimeout`）🔴",
    "8.4",
    `这是 §8.1 的业务版。标签换成流式助手现场：脚本启动、token 的 \`then\`、延时 0 重绘。

Ch06 你写过 \`Promise.then\` 和 \`await\`。那时测的是**值对不对**。本章测的是**何时跑**。

\`\`\`ts
function queueVsTimeout(
  log: string[],
  scheduleMacro: Schedule,
  scheduleMicro: Schedule,
): void {
  log.push("Q-script");
  scheduleMacro(() => log.push("Q-timeout"));   // 对标 setTimeout(0)
  scheduleMicro(() => log.push("Q-then"));      // 对标 Promise.then
}
\`\`\`

一假回合：

\`\`\`ts
["Q-script", "Q-then", "Q-timeout"]
\`\`\`

### 为什么流式「看起来乱」🔴

商品助手一边 \`onDelta(token)\` 往气泡 append（你希望它尽快，像微任务），一边用延时 0 把「滚动到底 / 重算高度」攒到下一宏任务。结果是：

1. 同步脚本：挂上监听、打 \`Q-script\`
2. 已经 resolve 的 then：token 进 log（\`Q-then\`）
3. 延时回调：才 paint（\`Q-timeout\`）

客服看见「字比框先到」。不是随机，是**微整队清空才轮到宏**。Agent 调试时不要用「打印时间戳谁小谁先」——同一毫秒里顺序仍由队列决定。

### ❌ / ✅

\`\`\`ts
// ❌ 两个都 scheduleMicro → Q-timeout 会排到 then 旁边当微任务
// ❌ 两个都 scheduleMacro → then 不再抢在 timeout 前
// ❌ 同步 push 三行——调用刚结束 log 就已经是终态

// ✅ 宏登记 timeout，微登记 then
\`\`\`

> ✅ **做 \`queueVsTimeout\`**：三行，标签 \`Q-script\` / \`Q-timeout\` / \`Q-then\`。

---`,
    ["queueVsTimeout"],
  ),
  sec(
    "sec-8.5",
    "§8.5 await 把函数切开（对应：`asyncBreak`）🟡",
    "8.5",
    `Ch06 说过：\`async\` 函数**永远**返回 Promise；\`throw\` 变成 reject。没细说的是：**\`await\` 后面那截代码什么时候跑。**

### 切开

\`\`\`ts
async function fetchSku() {
  log.push("F-enter");
  await loadProductAsync("KB-001", PRODUCTS); // Ch06：立刻 fulfilled 的 Promise
  log.push("F-after-await");                  // ← 这一行不是「await 下一行同步接着跑」
}
fetchSku();
log.push("F-after-call");
\`\`\`

真正顺序：

\`\`\`ts
["F-enter", "F-after-call", "F-after-await"]
\`\`\`

\`await\` 遇到一个已完成的 Promise，**仍然**把续体排成微任务。不是「值已经在就当同步」。这和 Java \`future.get()\` 立刻拿到返回值、当前线程继续往下走，不一样。

Python：

\`\`\`python
async def fetch_sku():
    print("F-enter")
    await already_done()
    print("F-after-await")

asyncio.get_event_loop().create_task(fetch_sku())
print("F-after-call")
# enter 先；after-call 往往在续体前——同样是「让出循环」
\`\`\`

### 作业：不要真写 async，用微任务模拟 🟡

本页禁止真的去 \`await\`（容易让人再写出真实计时器）。用注入的 \`scheduleMicro\` 代表「await 之后那一截」：

\`\`\`ts
function asyncBreak(
  log: string[],
  scheduleMacro: Schedule,
  scheduleMicro: Schedule,
): void {
  log.push("F-enter");
  scheduleMicro(() => log.push("F-after-await"));
  log.push("F-after-call");
}
\`\`\`

签名里留着 \`scheduleMacro\` 是为了和前几题一致。**不要用它登记续体**——否则测试只抽微队列时，\`F-after-await\` 永远不出现。

测试**只抽微、不跑宏**。终态：

\`\`\`ts
["F-enter", "F-after-call", "F-after-await"]
\`\`\`

调用刚返回时，log 只能是 \`["F-enter", "F-after-call"]\`。三行都同步 push 会在这一步红。

### ❌ / ✅

\`\`\`ts
// ❌ 三行全是 log.push —— 没有「切开」
// ❌ scheduleMacro 登记 F-after-await —— 那是宏，抽微时跑不到
// ❌ 先 schedule 再忘了 F-after-call，或把 after-call 写进微队列

// ✅ enter 同步 → 续体进微 → after-call 仍同步
\`\`\`

> 🤯 **转换点**：\`f()\` 这一行不会等到 \`await\` 后面。调用方下一行先跑；续体是微任务。Ch06 的 \`loadOrThrow()\` 不 \`await\` 接不到 throw，是同一件事的另一面。
>
> ✅ **做 \`asyncBreak\`**：三行，续体走 \`scheduleMicro\`。

---`,
    ["asyncBreak"],
  ),
  sec(
    "sec-8.6",
    "§8.6 只冲刷微队列（对应：`flushMicrotasks`）🔴",
    "8.6",
    `前五题你在**登记**。这一题你当**循环**：只把 token 回调刷完，界面重绘留到下一帧。

假循环的微队列就是一个数组。队头 \`shift\` 出来调用。跑的时候它可能再 \`micro.push\`——嵌套的 \`then\`。这次冲刷必须连新来的一起跑完。**不要碰宏数组。**

\`\`\`ts
function flushMicrotasks(
  micro: Array<() => void>,
  _macro: Array<() => void>,
): void {
  while (micro.length) {
    const job = micro.shift();
    if (job) job();
  }
}
\`\`\`

\`_macro\` 下划线是「我看见了、故意不用」。测试会预放一个宏任务，冲刷后它必须还在。

### FIFO + 跑着又登记

开始：\`[m1, m2]\`。\`m1\` 执行时 \`push(m1-child)\`。队列变成 \`[m2, m1-child]\`。继续抽：\`m2\` 然后 \`m1-child\`。

\`\`\`ts
["m1", "m2", "m1-child"]
\`\`\`

### ❌ / ✅

\`\`\`ts
// ❌ forEach：开始时有几项就调几项，后面 push 的不跑
micro.forEach((job) => job());

// ❌ 先 const n = micro.length; for (i < n) —— 同样截住新来的
// ❌ 顺手 while (macro.length) macro.shift()() —— timeout 被提前画了
// ❌ splice 空宏数组、或调用 _macro[0]

// ✅ while (micro.length) 取队头再跑
\`\`\`

空微队列：直接返回，log 不动，宏还在。微任务往宏队列 push 了一个 job：这次 flush **仍然不跑它**（只是宏数组变长），留给下一宏回合。

> ⚠️ 这题复用前五题的心智：微要抽干、宏要留下。你就是 \`runOneTurn\` 里的第一段 \`while\`。
>
> ✅ **做 \`flushMicrotasks\`**：只 while-shift 第一个参数。

---`,
    ["flushMicrotasks"],
  ),
  sec(
    "sec-extra",
    "§8.7 延伸阅读（不考）",
    "8.7",
    `下面这些**本章不考**，知道名字即可，别写进作业。

- **Node libuv 阶段**（timers / poll / check / close）：比浏览器「微 vs 宏」更细。本课不讲，也不要在作业里模拟那些阶段。
- **进程 / cluster / Worker**：那是多进程或多线程，超出本章「单线程循环」。
- **\`queueMicrotask\` 真 API**：语义就是 \`scheduleMicro\`。作业里用注入函数，不要调用宿主的。
- **MutationObserver / \`requestAnimationFrame\`**：也是队列里的角色，M3 画 UI 时再碰上。
- **真 \`fetch\` / Stream**：Ch11。那时仍然注入假 reader，不打网。

---`,
    [],
  ),
  sec(
    "sec-pits",
    "§8.8 Java / Python 老手几个坑 ⚠️",
    "8.8",
    `1. **不要用线程直觉理解 \`setTimeout(0)\`**。0 ≠ 立刻；当前栈和整条微队列都比它早。
2. **单线程**：你的回调不会在另一个核上和当前函数并行改 \`log\`。
3. **登记 ≠ 执行**。\`scheduleMicro(fn)\` 不是 \`fn()\`。
4. **\`await\` 已完成的 Promise 仍切开**。续体是微任务，调用方下一行先跑。
5. **两个 then 不会被一个 timeout 从中间切开**。微要先抽干。
6. **宏里再排微**：微属于「这次宏结束之后」，不是宏体的下一行同步。
7. **作业禁止真实计时器 / 真实微任务 API / \`fetch\`**。4 秒超时。
8. **\`flushMicrotasks\` 不要顺手跑宏**。那是另一帧的事。
9. **标签锁死**。\`A-sync-1\` 不能写成 \`A-sync1\`。测试 \`toEqual\` 整数组。

---`,
    [],
  ),
  sec(
    "sec-homework",
    "📝 本章作业",
    null,
    `上面 6 个函数按节交错出现。每个注释里有【场景】【转换点】、示例和提示。

**完成方式**：在编辑器里改 \`throw new Error("TODO")\`，点「▶ 运行测试」。全绿 = 这题过了。

卡住就回对应 §：\`explainOrderA\` → §8.1，\`explainOrderC\` → §8.3，\`asyncBreak\` → §8.5，\`flushMicrotasks\` → §8.6。

---`,
    [],
  ),
  sec(
    "sec-check",
    "✅ 自测：你真的掌握了吗？",
    null,
    `- [ ] 能口述 1-4-3-2，并解释先微后宏
- [ ] 能说清 JS 单线程循环 vs Java 线程池；Python asyncio 是近亲
- [ ] 能解释 token \`onDelta\` 为什么印在延时重绘前面
- [ ] 知道宏回调里排出的微，要等宏体结束
- [ ] 能说清 await 切开：after-call 在 after-await 前
- [ ] 能写只抽微队列的 while-shift，嵌套 push 也抽到，且不碰宏
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

1. 「\`setTimeout(fn, 0)\` 不是 0 毫秒就跑吗？为什么还排在已经 resolve 的 \`then\` 后面？」— 卡壳重读对照地图 + §8.1 + §8.4
2. 「我 \`await\` 的 Promise 已经完成了，为什么调用方下一行比 await 后面先打印？」— 卡壳重读 §8.5
3. 「冲刷微队列时为什么不能把 timeout 一起跑掉？微任务里又登记的微为什么这次要跑到？」— 卡壳重读 §8.6

---`,
    [],
  ),
  sec(
    "sec-next",
    "⏭️ 下一步",
    null,
    `Ch08 掌握后，进 **Ch09 · 包与运行时**。

你会读 \`package.json\`：\`dependencies\` / \`devDependencies\`、\`type: module\`、semver 的 \`^\`。对照 Python uv、Maven。作业是解析 JSON 字符串的纯函数，不要真去装包。

本章你已经能口述「微先于宏、await 会切开」。Ch11 的假 fetch / Stream 会再碰到队列；那时不再重讲 Event Loop，只讲字节和 SSE 行。`,
    [],
  ),
];

const tutorialMd = `# Ch08 · Event Loop

${sections
  .map((s) => (s.heading ? `## ${s.heading}\n\n${s.body}` : s.body))
  .join("\n\n")}
`;

const chapter = {
  id: "ch08",
  num: "08",
  title: "Event Loop",
  runMode: "browser",
  tutorialMd,
  assignment,
  testName: "ch08_assignment",
  testSource,
  reviewMd,
  interleaved: true,
  sections,
  functions,
  preamble,
};

const out = join(dirname(fileURLToPath(import.meta.url)), "../src/content/chapters/ch08.json");
mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, JSON.stringify(chapter, null, 2) + "\n");
console.log("wrote", out);
