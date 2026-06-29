import { useMemo } from "react";

/** Escape HTML so model output can never inject markup. */
function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/** Inline formatting: bold, italics, inline code, links. */
function inline(s: string): string {
  return esc(s)
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/(^|[^*])\*([^*\n]+)\*/g, "$1<em>$2</em>")
    .replace(
      /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g,
      '<a href="$2" target="_blank" rel="noreferrer">$1</a>'
    );
}

/**
 * Minimal, safe markdown → HTML for assistant turns. Supports fenced code,
 * headings, unordered/ordered lists, and inline emphasis. Intentionally small.
 */
function toHtml(md: string): string {
  const blocks = md.split(/```/);
  let html = "";

  blocks.forEach((block, i) => {
    const isCode = i % 2 === 1;
    if (isCode) {
      const body = block.replace(/^[a-zA-Z0-9]*\n/, "");
      html += `<pre><code>${esc(body.replace(/\n$/, ""))}</code></pre>`;
      return;
    }

    const lines = block.split("\n");
    let listType: "ul" | "ol" | null = null;
    const flush = () => {
      if (listType) {
        html += `</${listType}>`;
        listType = null;
      }
    };

    let para: string[] = [];
    const flushPara = () => {
      if (para.length) {
        html += `<p>${inline(para.join(" "))}</p>`;
        para = [];
      }
    };

    for (const raw of lines) {
      const line = raw.replace(/\s+$/, "");
      if (!line.trim()) {
        flushPara();
        flush();
        continue;
      }
      const h = line.match(/^(#{1,3})\s+(.*)$/);
      if (h) {
        flushPara();
        flush();
        html += `<h${h[1].length}>${inline(h[2])}</h${h[1].length}>`;
        continue;
      }
      const ul = line.match(/^\s*[-*]\s+(.*)$/);
      const ol = line.match(/^\s*\d+\.\s+(.*)$/);
      if (ul || ol) {
        flushPara();
        const type = ul ? "ul" : "ol";
        if (listType !== type) {
          flush();
          listType = type;
          html += `<${type}>`;
        }
        html += `<li>${inline((ul ? ul[1] : ol![1]) || "")}</li>`;
        continue;
      }
      para.push(line.trim());
    }
    flushPara();
    flush();
  });

  return html;
}

export default function Markdown({ content }: { content: string }) {
  const html = useMemo(() => toHtml(content), [content]);
  return (
    <div
      className="prose-terminal"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
