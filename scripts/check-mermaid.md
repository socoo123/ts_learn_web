# scripts/check-mermaid.mjs

用仓库里装的 mermaid（package.json 版本）对本机无头环境做 `mermaid.parse` 语法校验，
不渲染、不打网。用法：

```bash
node scripts/check-mermaid.mjs src/content/chapters/ch29.json   # 指定章
node scripts/check-mermaid.mjs src/content/chapters/ch*.json    # 全部章（shell 展开）
```

- 会同时校验「raw」和站点 `MermaidBlock` 预处理后的「flat」两种文本（`<br/>` → ` · `）。
- 已知坑：flowchart 的 `call` / `click` / `class` / `style` / `default` / `end` 等是语法关键字，
  不能当节点 id（Ch29 曾用 `call` 当 id 在 11.17.0 上炸出 Syntax error）。
- 生成新章（Ch30/31）后跑一遍再翻 ✅。
