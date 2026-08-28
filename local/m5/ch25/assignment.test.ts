import { describe, expect, test } from "bun:test";
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
