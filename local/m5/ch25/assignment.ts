/**
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

/**
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
}

/**
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
}

/**
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
}

/**
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
}

/**
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
}

/**
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
}
