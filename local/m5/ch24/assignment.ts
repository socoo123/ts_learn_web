/**
 * Ch24 作业：商品助手把 Agent 事件收成可测的纯函数。
 *
 * 场景：用户问「机械键盘还有货吗」，假事件数组依次吐
 * text_delta → tool_call(lookupProduct) → tool_result → agent_end。
 * 你抽出增量、折叠成快照、拦住 bash、审计调用、拼 UI 行。
 *
 * 没有供应商 Key 也能全绿：测的是事件数组，不是真 Agent。
 * 打开本文件改 TODO，然后：bun test local/m5/ch24
 */

type SessionEvent =
  | { type: "text_delta"; delta: string }
  | { type: "tool_call"; name: string; args: Record<string, unknown> }
  | { type: "tool_result"; name: string; ok: boolean; text: string }
  | { type: "agent_end" }
  | { type: "aborted" };

type BlockDecision = { block: true; reason: "forbidden" } | { block: false };

type Audit = { name: string; args: Record<string, unknown>; blocked: boolean };

type UiRow =
  | { kind: "assistant"; text: string }
  | { kind: "tool"; name: string; status: "call" | "ok" | "error" | "blocked"; text: string };

type SessionSnap = {
  text: string;
  tools: string[];
  ended: boolean;
  aborted: boolean;
};

/**
 * 【场景】商品助手气泡要按到达顺序显示 token。用户问机械键盘库存，
 * 流里先「KB」再夹一次 lookupProduct，再「-001」。tool_* / agent_end / aborted 不是字，忽略。
 *
 * 【转换点】判别联合：`type === "text_delta"` 之后才有 `delta`。
 * Java 老手别写成一堆 instanceof；看 `type` 字段收窄即可。
 *
 * 任务：按原序返回每个 text_delta 的 delta。不要 mutate events。空数组 → []。
 * 示例：
 *   [{type:"text_delta",delta:"KB"},{type:"tool_call",name:"lookupProduct",args:{}},{type:"text_delta",delta:"-001"}]
 *     → ["KB","-001"]
 *   [{type:"text_delta",delta:"无"},{type:"text_delta",delta:"线鼠标"}] → ["无","线鼠标"]
 *   [] / 只有 agent_end → []
 *
 * 提示：filter + map。不要 join。忽略 tool_* / agent_end / aborted。
 */
export function filterTextDeltas(events: SessionEvent[]): string[] {
  throw new Error("TODO");
}

/**
 * 【场景】一次库存问答结束，UI 要一句全文、调过哪些工具、是否正常结束。
 *
 * 【转换点】必须调用 filterTextDeltas(events)，再 .join("")。
 * tools：每个 tool_call 的 name 按原序。ended / aborted：是否出现过该类型。
 *
 * 任务：返回 SessionSnap。空数组 → 全是空/false。
 * 示例：
 *   机械键盘：deltas 机+械键盘，一个 lookupProduct tool_call，末尾 agent_end
 *     → { text:"机械键盘", tools:["lookupProduct"], ended:true, aborted:false }
 *   无线鼠标 deltas + aborted、无 agent_end
 *     → { text:"无线鼠标", tools:[], ended:false, aborted:true }
 *   [] → { text:"", tools:[], ended:false, aborted:false }
 *
 * 提示：text 用 filterTextDeltas。不要 mutate。
 */
export function reduceSessionEvents(events: SessionEvent[]): SessionSnap {
  throw new Error("TODO");
}

/**
 * 【场景】课程商品助手只允许查货和算价。模型若吐 bash / write，必须拦住。
 * 这就是作业版 beforeToolCall。
 *
 * 【转换点】白名单：只有 lookupProduct 和 calcLineTotal 放行。
 * 其它一切（bash write edit rm "" lookup）→ { block:true, reason:"forbidden" }。
 *
 * 任务：返回 BlockDecision。放行对象不要带 reason 字段。
 * 示例：
 *   "lookupProduct" / "calcLineTotal" → { block:false }
 *   "bash" / "write" / "edit" / "rm" / "" / "lookup" → { block:true, reason:"forbidden" }
 *
 * 提示：=== 比较两个合法名。不要 includes("lookup")。
 */
export function blockDangerousTool(name: string): BlockDecision {
  throw new Error("TODO");
}

/**
 * 【场景】后台要记一笔审计：谁被调了、参数是什么、有没有拦。
 *
 * 【转换点】必须调用 blockDangerousTool(name)。
 * 返回 { name, args, blocked: blockDangerousTool(name).block }。
 * 不要 mutate args（测试会 freeze）。args 原样放进返回对象。
 *
 * 任务：返回 Audit。
 * 示例：
 *   ("lookupProduct", {sku:"KB-001"}) → { name:"lookupProduct", args:{sku:"KB-001"}, blocked:false }
 *   ("bash", {cmd:"ls"}) → { name:"bash", args:{cmd:"ls"}, blocked:true }
 *   ("write", {path:"/tmp/x"}) → blocked true
 *
 * 提示：可浅拷贝 args，但 toEqual 要与传入内容相同。
 */
export function auditToolCall(name: string, args: Record<string, unknown>): Audit {
  throw new Error("TODO");
}

/**
 * 【场景】用户点了停止。事件里会出现 aborted，不一定有 agent_end。
 *
 * 【转换点】存在任意 type === "aborted" → true，否则 false。空数组 false。
 * 不要 mutate。agent_end 不是 abort。
 *
 * 任务：返回 boolean。
 * 示例：
 *   [{type:"text_delta",delta:"机"},{type:"aborted"}] → true
 *   [{type:"agent_end"}] → false
 *   [] → false
 *
 * 提示：some。不要把 ended 当成 aborted。
 */
export function abortFlag(events: SessionEvent[]): boolean {
  throw new Error("TODO");
}

/**
 * 【场景】聊天区要画出助手气泡 + 工具行。这是 Ch26 接到网页之前的纯数据。
 *
 * 【转换点】必须调用 reduceSessionEvents 和 blockDangerousTool。
 * 1. const snap = reduceSessionEvents(events)
 * 2. 若 snap.text.length > 0，先 push { kind:"assistant", text: snap.text }
 * 3. 再按原序扫 tool_call（只有它触发工具行）：
 *    - blockDangerousTool(ev.name).block → { kind:"tool", name, status:"blocked", text:"forbidden" }
 *    - 否则在该 tool_call **之后**找**第一条**同名 tool_result：
 *        ok===true → status "ok"；ok===false → status "error"；找不到 → status "call" text ""
 * 4. 不要因为 aborted / agent_end 再多推一行（abort 用 abortFlag）
 *
 * 任务：返回 UiRow[]。空数组 → []。
 * 示例：
 *   查询成功（text_delta + lookupProduct 成功 + agent_end）→ assistant 行 + tool ok 行
 *   只有 bash tool_call → [{kind:"tool", name:"bash", status:"blocked", text:"forbidden"}]
 *   只有 calcLineTotal tool_call、无 result → status "call"
 *   lookupProduct + ok:false "未找到该 SKU" → status "error"（无 delta 则没有 assistant 行）
 *   [] → []
 *
 * 提示：先全文、再工具行。拦截了就不要再去配对 result。
 */
export function uiRowsFromEvents(events: SessionEvent[]): UiRow[] {
  throw new Error("TODO");
}
