// highlight.js 无浏览器包,用 bun 一次性打成经典脚本(见 scripts/render-pages 说明):
//   bun build scripts/vendor-src/hljs-entry.js --format=iife --minify --outfile assets/js/vendor/hljs.common.min.js
import hljs from "highlight.js/lib/common";

globalThis.hljs = hljs;
