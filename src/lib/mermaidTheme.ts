import type { ThemeId } from "./theme";

/** 护眼主题图内文字（与章节 JSON 的 `color:#1f1f1f` 一致） */
export const PARCHMENT_LABEL = "#1f1f1f";
/** 德古拉图内文字 */
export const DRACULA_LABEL = "#f8f8f2";

/**
 * 章节 mermaid 的 Material 浅色 → 德古拉深底可读色。
 * 浅底节点在深色页上会继承正文白字，叠在粉彩填充上非常刺眼；
 * 这里保持色相，把 50 色阶改成暗底、200 色阶改成中暗填充、描边改亮。
 */
const DARK_HEX: Record<string, string> = {
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

const HEX_RE = /#(?:[0-9a-fA-F]{6}|[0-9a-fA-F]{3})\b/g;
const STYLE_LINE_RE = /^[ \t]*(?:style|classDef|linkStyle)\b.*$/gm;

function expandHex(hex: string): string {
  const raw = hex.slice(1);
  if (raw.length === 3) {
    return `#${raw[0]}${raw[0]}${raw[1]}${raw[1]}${raw[2]}${raw[2]}`.toUpperCase();
  }
  return `#${raw}`.toUpperCase();
}

function hexToRgb(hex: string): [number, number, number] {
  const h = expandHex(hex).slice(1);
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}

function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, l];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h = 0;
  if (max === r) h = (g - b) / d + (g < b ? 6 : 0);
  else if (max === g) h = (b - r) / d + 2;
  else h = (r - g) / d + 4;
  return [h / 6, s, l];
}

function hue2rgb(p: number, q: number, t: number): number {
  if (t < 0) t += 1;
  if (t > 1) t -= 1;
  if (t < 1 / 6) return p + (q - p) * 6 * t;
  if (t < 1 / 2) return q;
  if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
  return p;
}

function hslToHex(h: number, s: number, l: number): string {
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  const r = Math.round(hue2rgb(p, q, h + 1 / 3) * 255);
  const g = Math.round(hue2rgb(p, q, h) * 255);
  const b = Math.round(hue2rgb(p, q, h - 1 / 3) * 255);
  return `#${[r, g, b].map((n) => n.toString(16).padStart(2, "0")).join("")}`.toUpperCase();
}

/** 未知色按亮度降到深色可读区间，保持色相。 */
export function adaptHexForDark(hex: string): string {
  const key = expandHex(hex);
  const mapped = DARK_HEX[key];
  if (mapped) return mapped;

  const [r, g, b] = hexToRgb(key);
  const [h, s, l] = rgbToHsl(r, g, b);
  if (l < 0.22) return DRACULA_LABEL;
  if (l > 0.88) return hslToHex(h, Math.min(Math.max(s * 1.2, 0.18), 0.45), 0.14);
  if (l > 0.55) return hslToHex(h, Math.min(Math.max(s * 1.1, 0.28), 0.58), 0.28);
  return hslToHex(h, Math.min(Math.max(s, 0.4), 0.72), 0.62);
}

/** 节点里的 `<br/>` 改成单行分隔，避免折两行后 foreignObject 把头尾裁掉。 */
export function flattenMermaidBreaks(source: string): string {
  return source
    .replace(/<br\s*\/?>/gi, " · ")
    .replace(/(?:\s*·\s*){2,}/g, " · ")
    .replace(/[ \t]{2,}/g, " ");
}

/** 只改 style / classDef / linkStyle 行里的色值，不动节点文案。 */
export function adaptMermaidSource(source: string, theme: ThemeId): string {
  let next = flattenMermaidBreaks(source);
  if (theme === "dracula") {
    next = next.replace(STYLE_LINE_RE, (line) => line.replace(HEX_RE, (hex) => adaptHexForDark(hex)));
  }
  return next;
}

export function mermaidInitConfig(theme: ThemeId) {
  const dark = theme === "dracula";
  return {
    startOnLoad: false as const,
    securityLevel: "strict" as const,
    theme: dark ? ("dark" as const) : ("neutral" as const),
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

export function mermaidLabelColors(theme: ThemeId): { fg: string; edgeBg: string } {
  if (theme === "dracula") return { fg: DRACULA_LABEL, edgeBg: "#181a22" };
  return { fg: PARCHMENT_LABEL, edgeBg: "#f4efe4" };
}

/** 打断正文 `color` 继承，避免德古拉白字叠到浅色节点上。 */
export function lockMermaidLabels(root: HTMLElement, theme: ThemeId): void {
  const { fg, edgeBg } = mermaidLabelColors(theme);
  root.style.color = fg;
  root.querySelectorAll("foreignObject").forEach((fo) => {
    fo.setAttribute("color", fg);
    fo.setAttribute("overflow", "visible");
    fo.querySelectorAll("*").forEach((el) => {
      const htmlEl = el as HTMLElement;
      htmlEl.style.setProperty("color", fg, "important");
      htmlEl.style.setProperty("-webkit-text-fill-color", fg, "important");
      htmlEl.style.setProperty("white-space", "nowrap");
      htmlEl.style.setProperty("margin", "0");
    });
  });
  root.querySelectorAll("text, tspan").forEach((el) => {
    el.setAttribute("fill", fg);
    (el as SVGElement).style.setProperty("fill", fg, "important");
  });
  root.querySelectorAll(".edgeLabel rect, .labelBkg").forEach((el) => {
    el.setAttribute("fill", edgeBg);
  });
  const arrow = theme === "dracula" ? "#c0c4d4" : "#5c564c";
  root.querySelectorAll(".arrowMarkerPath, .arrowheadPath").forEach((el) => {
    el.setAttribute("fill", arrow);
    (el as SVGElement).style.setProperty("fill", arrow);
    (el as SVGElement).style.setProperty("stroke", arrow);
  });
}

/**
 * 保持 mermaid 算出来的固有宽度，不要拉满卡片。
 * 原先 `width: 100%` 会把 300px 宽的竖图撑到整栏，高度按 viewBox 同比暴涨。
 */
export function fitMermaidSvg(svg: SVGSVGElement): void {
  const attrW = svg.getAttribute("width");
  const attrH = svg.getAttribute("height");
  const maxFromMermaid = svg.style.maxWidth;

  if (!svg.getAttribute("viewBox") && attrW && attrH) {
    const w = parseFloat(attrW);
    const h = parseFloat(attrH);
    if (w > 0 && h > 0) svg.setAttribute("viewBox", `0 0 ${w} ${h}`);
  }

  const intrinsic =
    maxFromMermaid.endsWith("px") ? maxFromMermaid : attrW && attrW !== "100%" ? `${parseFloat(attrW)}px` : "";

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
