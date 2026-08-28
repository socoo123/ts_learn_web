/**
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
  return `${key}|${session.config.memory}|${life}|logs:${session.logs.length}|${tools}`;
}
