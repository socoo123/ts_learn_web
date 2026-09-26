/**
 * Ch29 · 扩展四件套复制区（M6 第三章）。
 *
 * 本文件只给阅读 / 复制。测试禁止 import 本文件。
 * 全部真代码都在字符串里，if (false) 守护，不执行、不打网、不需要 Key。
 *
 * 事实源：本机安装包 docs/extensions.md · skills.md · prompt-templates.md · packages.md
 * 不要 clone 仓库；不要在课程仓库装 @earendil-works/*（M6 作业是纯函数）。
 */

// 复制区 1：读官方四篇文档（shell，粘到终端跑）
const READ_THE_DOCS = `
ROOT="$(npm root -g)/@earendil-works/pi-coding-agent"
ls "$ROOT/docs"                      # extensions.md skills.md prompt-templates.md packages.md ...
cat "$ROOT/docs/skills.md" | head -60
ls "$ROOT/examples/extensions"       # 几十个可运行扩展示例（permission-gate / todo / snake ...）
`;

// 复制区 2：最小扩展（来自 docs/extensions.md 快速上手，商品助手版）
// 入口约定：默认导出工厂 (pi: ExtensionAPI) => {}；jiti 加载 TS 免编译。
const MINIMAL_EXTENSION = `
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";

export default function (pi: ExtensionAPI) {
  pi.on("session_start", async (_event, ctx) => {
    ctx.ui.notify("价格护栏已加载", "info");
  });

  pi.on("tool_call", async (event) => {
    if (event.toolName === "bash" && event.input.command?.includes("rm -rf")) {
      const ok = await ctx.ui.confirm("危险!", "允许执行 rm -rf ?");
      if (!ok) return { block: true, reason: "用户拒绝" };
    }
  });

  pi.registerCommand("stock", {
    description: "查 KB-001 机械键盘现货",
    handler: async (_args, ctx) => {
      ctx.ui.notify("KB-001 现货 12 件 / MS-002 无线鼠标缺货", "info");
    },
  });
}
`;

// 复制区 3：库存查询技能（SKILL.md 放 ~/.pi/agent/skills/stock-check/）
// 渐进披露：启动只进 name+description，全文由模型按需 read。
const STOCK_CHECK_SKILL = `
---
name: stock-check
description: 查询商品库存与价格，缺货时按类目给出替代品建议。Use when 用户问 KB-001 / MS-002 等商品有没有货。
---

# 库存查询

## 步骤
1. 用 read 打开 data/products.json（10 个商品，CP-009 库存为 0）
2. 按 SKU 精确匹配；查不到按名称模糊匹配
3. 缺货时从同 category 里挑 price 最接近的替代品

## 参考脚本
./scripts/lookup.sh <SKU>
`;

// 复制区 4：下单模板（prompts/order.md → 斜杠命令 /order）
const ORDER_TEMPLATE = `
---
description: 按商品与数量生成下单请求草稿
argument-hint: "<SKU> [qty]"
---
为 $1 生成下单请求草稿，数量 ${2:-1}。先核对当前库存，再输出 JSON 草稿。
`;

// 复制区 5：打成 Pi package 分享（packages.md）
const PACKAGE_AND_INSTALL = `
# shop-kit/package.json 带 pi manifest + pi-package keyword
{
  "name": "shop-kit",
  "keywords": ["pi-package"],
  "peerDependencies": {
    "@earendil-works/pi-coding-agent": "*",
    "typebox": "*"
  },
  "pi": {
    "extensions": ["./extensions/price-guard.ts"],
    "skills": ["./skills/stock-check"],
    "prompts": ["./prompts/order.md"],
    "themes": ["./themes/shop-dark.json"]
  }
}

# 安装三来源（写进 settings.json 的 packages 数组）
pi install npm:@team/shop-kit@1.0.0        # npm：scope 的 @ 是名字一部分
pi install git:github.com/team/shop-kit@v1 # git：@v1 是钉住的 ref
pi install ./packages/shop-kit             # local：不拷贝，原地加载
pi -e npm:@team/shop-kit                   # 临时试用，不写 settings
pi list                                    # 看已装包
`;

if (false) {
  console.log(READ_THE_DOCS);
  console.log(MINIMAL_EXTENSION);
  console.log(STOCK_CHECK_SKILL);
  console.log(ORDER_TEMPLATE);
  console.log(PACKAGE_AND_INSTALL);
}
