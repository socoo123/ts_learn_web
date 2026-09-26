// zod v4 无 UMD 构建,用 bun 一次性打成经典脚本:
//   bun build scripts/vendor-src/zod-entry.js --format=iife --minify --outfile assets/js/vendor/zod.iife.js
// 运行器注入的全局名是 z(与 src/lib/tsRunner.ts 时代一致)。
import { z } from "zod";

globalThis.z = z;
