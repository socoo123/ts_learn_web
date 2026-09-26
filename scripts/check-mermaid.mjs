import { readFileSync } from "node:fs";
import dompurify from "dompurify";

// headless: DOMPurify 的 not-supported stub 缺这些钩子；parse 阶段只需语法，no-op 即可
const stub = dompurify;
for (const fn of ["addHook", "removeHook", "removeHooks", "removeAllHooks"]) {
  if (typeof stub[fn] !== "function") stub[fn] = () => {};
}
if (typeof stub.sanitize !== "function") stub.sanitize = (x) => x;

const mermaid = (await import("mermaid")).default;

const files = process.argv.slice(2);
for (const file of files) {
  const chapter = JSON.parse(readFileSync(file, "utf8"));
  const blocks = chapter.tutorialMd.match(/```mermaid\n[\s\S]*?```/g) ?? [];

  function flatten(source) {
    return source
      .replace(/<br\s*\/?>/gi, " · ")
      .replace(/(?:\s*·\s*){2,}/g, " · ")
      .replace(/[ \t]{2,}/g, " ");
  }

  for (let i = 0; i < blocks.length; i++) {
    const raw = blocks[i].replace(/^```mermaid\n/, "").replace(/\n```$/, "");
    for (const [tag, src] of [["raw", raw.trim()], ["flat", flatten(raw).trim()]]) {
      try {
        await mermaid.parse(src);
        console.log(`OK   ${file} block ${i + 1} [${tag}]`);
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.log(`FAIL ${file} block ${i + 1} [${tag}]: ${msg.split("\n").slice(0, 8).join(" | ")}`);
      }
    }
  }
}
process.exit(0);
