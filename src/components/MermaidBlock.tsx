import { useEffect, useId, useRef, useState } from "react";
import mermaid from "mermaid";
import { useTheme } from "../hooks/useTheme";
import {
  adaptMermaidSource,
  fitMermaidSvg,
  lockMermaidLabels,
  mermaidInitConfig,
} from "../lib/mermaidTheme";

function parseErrorMessage(err: unknown): string {
  if (err instanceof Error && err.message) return err.message;
  if (typeof err === "string") return err;
  if (err && typeof err === "object" && "str" in err && typeof (err as { str: unknown }).str === "string") {
    return (err as { str: string }).str;
  }
  return "Failed to render mermaid diagram";
}

export default function MermaidBlock({ chart }: { chart: string }) {
  const { theme } = useTheme();
  const hostRef = useRef<HTMLDivElement>(null);
  const reactId = useId().replace(/:/g, "");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const source = chart.trim();
    const renderId = `mermaid-${reactId}-${theme}-${Math.random().toString(36).slice(2, 8)}`;

    void (async () => {
      try {
        mermaid.initialize(mermaidInitConfig(theme));
        const { svg } = await mermaid.render(renderId, adaptMermaidSource(source, theme));
        if (cancelled || !hostRef.current) return;
        hostRef.current.innerHTML = svg;
        const svgEl = hostRef.current.querySelector("svg");
        if (svgEl) {
          fitMermaidSvg(svgEl);
          lockMermaidLabels(hostRef.current, theme);
        }
        setError(null);
      } catch (err) {
        if (!cancelled) {
          if (hostRef.current) hostRef.current.innerHTML = "";
          setError(parseErrorMessage(err));
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [chart, theme, reactId]);

  if (error) {
    return <pre className="mermaid-block mermaid-error my-4 overflow-x-auto">{error}</pre>;
  }

  return <div ref={hostRef} className="mermaid-block my-4 overflow-x-auto" />;
}
