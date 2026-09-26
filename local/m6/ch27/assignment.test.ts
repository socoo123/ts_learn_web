import { describe, expect, test } from "bun:test";
import {
  agentDirEntry,
  modeCapability,
  modeOfInvocation,
  packageRole,
  pickRunMode,
  researchEntryPaths,
  resourceScope,
} from "./assignment";

describe("packageRole", () => {
  test("packages/ 前缀与短名等价", () => {
    expect(packageRole("packages/ai")).toBe("pi-ai：LLM 提供商抽象（模型、流式、认证）");
    expect(packageRole("ai")).toBe("pi-ai：LLM 提供商抽象（模型、流式、认证）");
    expect(packageRole("packages/agent")).toBe("pi-agent-core：Agent 循环与消息类型");
  });
  test("四个包都认（防硬编码 ai）", () => {
    expect(packageRole("tui")).toBe("pi-tui：终端 UI 组件");
    expect(packageRole("coding-agent")).toBe("pi 主包：CLI、四种运行模式、SDK 与扩展体系");
  });
  test("未知 → null", () => {
    expect(packageRole("web")).toBeNull();
    expect(packageRole("packages/web")).toBeNull();
  });
});

describe("modeOfInvocation", () => {
  test("默认 tui；-p / --print → print", () => {
    expect(modeOfInvocation([])).toBe("tui");
    expect(modeOfInvocation(["-p", "机械键盘还有货吗"])).toBe("print");
    expect(modeOfInvocation(["--print"])).toBe("print");
  });
  test("--mode rpc / json；freeze 不改入参", () => {
    const args: string[] = ["--mode", "rpc", "--no-session"];
    Object.freeze(args);
    expect(modeOfInvocation(args)).toBe("rpc");
    expect(modeOfInvocation(["--no-session", "--mode", "rpc"])).toBe("rpc");
    expect(modeOfInvocation(["--mode", "json"])).toBe("json");
    expect(args).toEqual(["--mode", "rpc", "--no-session"]);
  });
  test("不认识 / 悬空 --mode → null", () => {
    expect(modeOfInvocation(["--mode", "gui"])).toBeNull();
    expect(modeOfInvocation(["--mode"])).toBeNull();
  });
});

describe("modeCapability", () => {
  test("四种模式行为表", () => {
    expect(modeCapability("tui")).toEqual({ ctxMode: "tui", hasUI: true, canPromptUser: true });
    expect(modeCapability("rpc")).toEqual({ ctxMode: "rpc", hasUI: true, canPromptUser: true });
    expect(modeCapability("json")).toEqual({ ctxMode: "json", hasUI: false, canPromptUser: false });
    expect(modeCapability("print")).toEqual({ ctxMode: "print", hasUI: false, canPromptUser: false });
  });
  test("未知 → null", () => {
    expect(modeCapability("web")).toBeNull();
  });
});

describe("pickRunMode", () => {
  test("嵌 → rpc；其余三类", () => {
    expect(pickRunMode("把商品助手嵌进网页，客户端是 Python")).toBe("rpc");
    expect(pickRunMode("问无线鼠标还有货吗的助手要嵌进 IDE")).toBe("rpc");
    expect(pickRunMode("CI 里单发一个 prompt 拿结果就走")).toBe("print");
    expect(pickRunMode("流水线要解析事件流")).toBe("json");
    expect(pickRunMode("我在终端里交互式改代码")).toBe("tui");
  });
  test("不认识 → null", () => {
    expect(pickRunMode("帮我写周报")).toBeNull();
  });
});

describe("agentDirEntry", () => {
  test("配置与数据条目", () => {
    expect(agentDirEntry("settings.json")).toBe("全局设置（与项目 .pi/settings.json 深合并）");
    expect(agentDirEntry("sessions")).toBe("会话存储（session.jsonl 按项目分目录）");
    expect(agentDirEntry("models.json")).toBe("自定义模型与供应商");
    expect(agentDirEntry("models-store.json")).toBe("远程模型目录的本地缓存");
    expect(agentDirEntry("auth.json")).toBe("凭据（API Key / OAuth）");
  });
  test("资源目录；未知 → null", () => {
    expect(agentDirEntry("extensions")).toBe("全局扩展目录（*.ts 或 */index.ts 自动发现）");
    expect(agentDirEntry("skills")).toBe("全局技能目录（SKILL.md）");
    expect(agentDirEntry("prompts")).toBe("全局提示模板（斜杠命令）");
    expect(agentDirEntry("themes")).toBe("主题目录");
    expect(agentDirEntry("logs")).toBeNull();
  });
});

describe("resourceScope", () => {
  test("~ 开头都是 global（含 ~/.agents 特例）", () => {
    expect(resourceScope("~/.pi/agent/extensions/price.ts")).toBe("global");
    expect(resourceScope("~/.pi/agent/settings.json")).toBe("global");
    expect(resourceScope("~/.agents/skills/pdf/SKILL.md")).toBe("global");
  });
  test("项目内 .pi / .agents 是 project；其它 null", () => {
    expect(resourceScope("shop/.pi/extensions/audit.ts")).toBe("project");
    expect(resourceScope("shop/.pi/skills/pdf/SKILL.md")).toBe("project");
    expect(resourceScope("shop/.agents/skills/pdf/SKILL.md")).toBe("project");
    expect(resourceScope("/tmp/notes.txt")).toBeNull();
  });
});

describe("researchEntryPaths", () => {
  test("拼出三个研究入口；尾斜杠归一", () => {
    const paths = researchEntryPaths("/npm/pi");
    expect(paths).toEqual({ docs: "/npm/pi/docs", examples: "/npm/pi/examples", dist: "/npm/pi/dist" });
    expect(researchEntryPaths("/npm/pi/")).toEqual(paths);
    expect(researchEntryPaths("/npm/pi//")).toEqual(paths);
  });
  test("空 / 空白 → null", () => {
    expect(researchEntryPaths("")).toBeNull();
    expect(researchEntryPaths("   ")).toBeNull();
  });
});
