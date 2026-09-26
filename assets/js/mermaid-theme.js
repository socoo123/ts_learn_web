/**
 * 章节 mermaid 图的主题适配(src/lib/mermaidTheme.ts 的经典脚本移植,逻辑逐行一致)。
 * 暴露 window.TSMermaidTheme,供 diagrams.js 使用。
 */
(function (root) {
  "use strict";

  /** 护眼主题图内文字(与章节 JSON 的 `color:#1f1f1f` 一致) */
  var PARCHMENT_LABEL = "#1f1f1f";
  /** 德古拉图内文字 */
  var DRACULA_LABEL = "#f8f8f2";

  /**
   * 章节 mermaid 的 Material 浅色 → 德古拉深底可读色。
   * 浅底节点在深色页上会继承正文白字,叠在粉彩填充上非常刺眼;
   * 这里保持色相,把 50 色阶改成暗底、200 色阶改成中暗填充、描边改亮。
   */
  var DARK_HEX = {
    "#1F1F1F": DRACULA_LABEL,
    // subgraph 50
    "#E3F2FD": "#152238",
    "#FFEBEE": "#2C1618",
    "#E8F5E9": "#152418",
    "#FFF8E1": "#2A2414",
    "#F3E5F5": "#221830",
    "#E1F5FE": "#142430",
    "#E0F7FA": "#142A2E",
    // node 200
    "#90CAF9": "#2F5A94",
    "#EF9A9A": "#8A3A40",
    "#A5D6A7": "#2E6A40",
    "#FFE082": "#7A6220",
    "#CE93D8": "#5C3E7A",
    "#80DEEA": "#1F6870",
    "#FFCC80": "#7A5220",
    // stroke 700/800
    "#1976D2": "#7EB6F6",
    "#C62828": "#FF6B6B",
    "#388E3C": "#69DB7C",
    "#F9A825": "#FFD43B",
    "#7B1FA2": "#C9A0FF",
    "#0097A7": "#8BE9FD",
    "#F57C00": "#FFB86C",
    "#0277BD": "#67C6F0",
  };

  var HEX_RE = /#(?:[0-9a-fA-F]{6}|[0-9a-fA-F]{3})\b/g;
  var STYLE_LINE_RE = /^[ \t]*(?:style|classDef|linkStyle)\b.*$/gm;

  function expandHex(hex) {
    var raw = hex.slice(1);
    if (raw.length === 3) {
      return ("#" + raw[0] + raw[0] + raw[1] + raw[1] + raw[2] + raw[2]).toUpperCase();
    }
    return ("#" + raw).toUpperCase();
  }

  function hexToRgb(hex) {
    var h = expandHex(hex).slice(1);
    return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
  }

  function rgbToHsl(r, g, b) {
    r /= 255;
    g /= 255;
    b /= 255;
    var max = Math.max(r, g, b);
    var min = Math.min(r, g, b);
    var l = (max + min) / 2;
    if (max === min) return [0, 0, l];
    var d = max - min;
    var s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    var hh = 0;
    if (max === r) hh = (g - b) / d + (g < b ? 6 : 0);
    else if (max === g) hh = (b - r) / d + 2;
    else hh = (r - g) / d + 4;
    return [hh / 6, s, l];
  }

  function hue2rgb(p, q, t) {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  }

  function hslToHex(h, s, l) {
    var q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    var p = 2 * l - q;
    var r = Math.round(hue2rgb(p, q, h + 1 / 3) * 255);
    var g = Math.round(hue2rgb(p, q, h) * 255);
    var b = Math.round(hue2rgb(p, q, h - 1 / 3) * 255);
    var parts = [r, g, b].map(function (n) {
      var hex = n.toString(16);
      return hex.length === 1 ? "0" + hex : hex;
    });
    return ("#" + parts.join("")).toUpperCase();
  }

  /** 未知色按亮度降到深色可读区间,保持色相。 */
  function adaptHexForDark(hex) {
    var key = expandHex(hex);
    var mapped = DARK_HEX[key];
    if (mapped) return mapped;

    var rgb = hexToRgb(key);
    var hsl = rgbToHsl(rgb[0], rgb[1], rgb[2]);
    var h = hsl[0], s = hsl[1], l = hsl[2];
    if (l < 0.22) return DRACULA_LABEL;
    if (l > 0.88) return hslToHex(h, Math.min(Math.max(s * 1.2, 0.18), 0.45), 0.14);
    if (l > 0.55) return hslToHex(h, Math.min(Math.max(s * 1.1, 0.28), 0.58), 0.28);
    return hslToHex(h, Math.min(Math.max(s, 0.4), 0.72), 0.62);
  }

  /** 节点里的 `<br/>` 改成单行分隔,避免折两行后 foreignObject 把头尾裁掉。 */
  function flattenMermaidBreaks(source) {
    return source
      .replace(/<br\s*\/?>/gi, " · ")
      .replace(/(?:\s*·\s*){2,}/g, " · ")
      .replace(/[ \t]{2,}/g, " ");
  }

  /** 只改 style / classDef / linkStyle 行里的色值,不动节点文案。 */
  function adaptMermaidSource(source, theme) {
    var next = flattenMermaidBreaks(source);
    if (theme === "dracula") {
      next = next.replace(STYLE_LINE_RE, function (line) {
        return line.replace(HEX_RE, adaptHexForDark);
      });
    }
    return next;
  }

  function mermaidInitConfig(theme) {
    var dark = theme === "dracula";
    return {
      startOnLoad: false,
      securityLevel: "strict",
      theme: dark ? "dark" : "neutral",
      themeVariables: dark
        ? {
            darkMode: true,
            background: "transparent",
            primaryColor: "#2F5A94",
            primaryTextColor: DRACULA_LABEL,
            primaryBorderColor: "#7EB6F6",
            secondaryColor: "#2E6A40",
            secondaryTextColor: DRACULA_LABEL,
            secondaryBorderColor: "#69DB7C",
            tertiaryColor: "#2A2414",
            tertiaryTextColor: DRACULA_LABEL,
            tertiaryBorderColor: "#6272A4",
            lineColor: "#C0C4D4",
            textColor: DRACULA_LABEL,
            mainBkg: "#2F5A94",
            nodeBorder: "#7EB6F6",
            clusterBkg: "#152238",
            clusterBorder: "#7EB6F6",
            titleColor: DRACULA_LABEL,
            edgeLabelBackground: "#181A22",
            nodeTextColor: DRACULA_LABEL,
            fontSize: "15px",
          }
        : {
            darkMode: false,
            background: "transparent",
            primaryTextColor: PARCHMENT_LABEL,
            textColor: PARCHMENT_LABEL,
            nodeTextColor: PARCHMENT_LABEL,
            titleColor: PARCHMENT_LABEL,
            edgeLabelBackground: "#F4EFE4",
            lineColor: "#5C564C",
            fontSize: "15px",
          },
      markdownAutoWrap: false,
      flowchart: {
        htmlLabels: true,
        useMaxWidth: true,
        wrappingWidth: 2000,
        padding: 12,
      },
    };
  }

  function mermaidLabelColors(theme) {
    if (theme === "dracula") return { fg: DRACULA_LABEL, edgeBg: "#181a22" };
    return { fg: PARCHMENT_LABEL, edgeBg: "#f4efe4" };
  }

  /** 打断正文 `color` 继承,避免德古拉白字叠到浅色节点上。 */
  function lockMermaidLabels(root, theme) {
    var colors = mermaidLabelColors(theme);
    var fg = colors.fg;
    var edgeBg = colors.edgeBg;
    root.style.color = fg;
    root.querySelectorAll("foreignObject").forEach(function (fo) {
      fo.setAttribute("color", fg);
      fo.setAttribute("overflow", "visible");
      fo.querySelectorAll("*").forEach(function (el) {
        el.style.setProperty("color", fg, "important");
        el.style.setProperty("-webkit-text-fill-color", fg, "important");
        el.style.setProperty("white-space", "nowrap");
        el.style.setProperty("margin", "0");
      });
    });
    root.querySelectorAll("text, tspan").forEach(function (el) {
      el.setAttribute("fill", fg);
      el.style.setProperty("fill", fg, "important");
    });
    root.querySelectorAll(".edgeLabel rect, .labelBkg").forEach(function (el) {
      el.setAttribute("fill", edgeBg);
    });
    var arrow = theme === "dracula" ? "#c0c4d4" : "#5c564c";
    root.querySelectorAll(".arrowMarkerPath, .arrowheadPath").forEach(function (el) {
      el.setAttribute("fill", arrow);
      el.style.setProperty("fill", arrow);
      el.style.setProperty("stroke", arrow);
    });
  }

  /**
   * 保持 mermaid 算出来的固有宽度,不要拉满卡片。
   * 原先 `width: 100%` 会把 300px 宽的竖图撑到整栏,高度按 viewBox 同比暴涨。
   */
  function fitMermaidSvg(svg) {
    var attrW = svg.getAttribute("width");
    var attrH = svg.getAttribute("height");
    var maxFromMermaid = svg.style.maxWidth;

    if (!svg.getAttribute("viewBox") && attrW && attrH) {
      var w = parseFloat(attrW);
      var h = parseFloat(attrH);
      if (w > 0 && h > 0) svg.setAttribute("viewBox", "0 0 " + w + " " + h);
    }

    var intrinsic = maxFromMermaid.endsWith("px")
      ? maxFromMermaid
      : attrW && attrW !== "100%"
        ? parseFloat(attrW) + "px"
        : "";

    svg.removeAttribute("height");
    svg.style.height = "auto";
    svg.style.display = "block";
    svg.style.marginInline = "auto";
    svg.style.maxWidth = "100%";
    if (intrinsic) {
      svg.style.width = intrinsic;
      svg.setAttribute("width", intrinsic);
    } else {
      svg.style.width = "auto";
      if (attrW === "100%") svg.removeAttribute("width");
    }
  }

  root.TSMermaidTheme = {
    PARCHMENT_LABEL: PARCHMENT_LABEL,
    DRACULA_LABEL: DRACULA_LABEL,
    adaptHexForDark: adaptHexForDark,
    flattenMermaidBreaks: flattenMermaidBreaks,
    adaptMermaidSource: adaptMermaidSource,
    mermaidInitConfig: mermaidInitConfig,
    mermaidLabelColors: mermaidLabelColors,
    lockMermaidLabels: lockMermaidLabels,
    fitMermaidSvg: fitMermaidSvg,
  };
})(typeof globalThis !== "undefined" ? globalThis : this);
