import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { resolveReadmeUrl } from "@/lib/repo-detail/readme-urls";

interface MdNode {
  type?: string;
  children?: MdNode[];
}

/**
 * Saneado del árbol markdown para README de terceros:
 * 1. Fuera los nodos de HTML crudo — react-markdown no los interpreta (bien),
 *    pero los pintaría como texto fuente (los banners `<p align=center>`).
 * 2. Fuera los párrafos que quedan vacíos tras el punto 1.
 * 3. Fuera las líneas divisorias (`---`) que quedan colgando al principio:
 *    solían separar un banner ya eliminado del contenido, y sueltas en
 *    cabecera solo ensucian.
 */
function cleanupTree() {
  return (tree: MdNode) => {
    const walk = (node: MdNode) => {
      if (!node.children) return;
      node.children = node.children.filter(
        (child) =>
          child.type !== "html" &&
          !(child.type === "paragraph" && (child.children?.length ?? 0) === 0),
      );
      node.children.forEach(walk);
    };
    walk(tree);
    while (tree.children?.[0]?.type === "thematicBreak") tree.children.shift();
  };
}

/**
 * README renderizado (C-05). Contenido de terceros: react-markdown NO
 * interpreta el HTML crudo del markdown (XSS fuera por construcción), y cada
 * href/src pasa por resolveReadmeUrl — relativas al repo en GitHub, esquemas
 * raros anulados. Sin resaltado de sintaxis a propósito (ver ficha).
 */
export function ReadmeMarkdown({ markdown, fullName }: { markdown: string; fullName: string }) {
  return (
    <div data-testid="repo-readme" className="readme text-[15px] leading-relaxed">
      <Markdown
        remarkPlugins={[remarkGfm, cleanupTree]}
        urlTransform={(url, key) => resolveReadmeUrl(url, fullName, key === "src" ? "image" : "link")}
        components={{
          h1: (p) => <h2 className="mb-3 mt-8 border-b border-edge pb-2 font-mono text-xl font-bold first:mt-0">{p.children}</h2>,
          h2: (p) => <h3 className="mb-3 mt-8 font-mono text-lg font-bold first:mt-0">{p.children}</h3>,
          h3: (p) => <h4 className="mb-2 mt-6 font-mono text-base font-bold">{p.children}</h4>,
          h4: (p) => <h5 className="mb-2 mt-4 font-mono text-sm font-bold">{p.children}</h5>,
          h5: (p) => <h6 className="mb-2 mt-4 text-sm font-bold">{p.children}</h6>,
          h6: (p) => <h6 className="mb-2 mt-4 text-sm font-bold text-content-secondary">{p.children}</h6>,
          p: (p) => <p className="my-3">{p.children}</p>,
          a: (p) =>
            p.href ? (
              <a href={p.href} target="_blank" rel="noopener noreferrer nofollow" className="text-primary hover:underline">
                {p.children}
              </a>
            ) : (
              <span>{p.children}</span>
            ),
          ul: (p) => <ul className="my-3 list-disc pl-6">{p.children}</ul>,
          ol: (p) => <ol className="my-3 list-decimal pl-6">{p.children}</ol>,
          li: (p) => <li className="my-1">{p.children}</li>,
          blockquote: (p) => (
            <blockquote className="my-3 border-l-2 border-edge pl-4 text-content-secondary">{p.children}</blockquote>
          ),
          code: (p) => {
            const inline = !String(p.className ?? "").includes("language-") && !String(p.children).includes("\n");
            return inline ? (
              <code className="rounded bg-surface px-1.5 py-0.5 font-mono text-[13px]">{p.children}</code>
            ) : (
              <code className="font-mono text-[13px]">{p.children}</code>
            );
          },
          pre: (p) => (
            <pre className="my-4 overflow-x-auto rounded-lg border border-edge bg-surface p-4">{p.children}</pre>
          ),
          table: (p) => (
            <div className="my-4 overflow-x-auto">
              <table className="w-full border-collapse text-sm">{p.children}</table>
            </div>
          ),
          th: (p) => <th className="border border-edge px-3 py-1.5 text-left font-bold">{p.children}</th>,
          td: (p) => <td className="border border-edge px-3 py-1.5">{p.children}</td>,
          img: (p) =>
            p.src ? (
              // eslint-disable-next-line @next/next/no-img-element -- imagen del README, host externo
              <img src={typeof p.src === "string" ? p.src : undefined} alt={p.alt ?? ""} className="my-3 inline-block max-w-full rounded" />
            ) : null,
          hr: () => <hr className="my-6 border-edge" />,
        }}
      >
        {markdown}
      </Markdown>
    </div>
  );
}
