import type { ReactNode } from 'react';

const LIST_MARKERS = ['-', '•', '*'] as const;

/**
 * Разбивает текст поля advantages на блоки:
 * - строки, начинающиеся с маркера списка (`-`, `•`, `*`) → элементы <ul><li>;
 * - остальные непустые строки → абзацы <p>;
 * - пустые строки → вертикальный отступ (переносы между блоками сохраняются).
 */
export function AdvantagesContent({ text }: { text: string }): ReactNode {
  if (!text || !text.trim()) return null;

  const lines = text.split(/\r?\n/);
  const blocks: ReactNode[] = [];
  let listItems: string[] = [];
  let key = 0;

  const flushList = () => {
    if (listItems.length > 0) {
      blocks.push(
        <ul key={key++} className="list-disc pl-5 space-y-1">
          {listItems.map((item, i) => (
            <li key={i}>{item}</li>
          ))}
        </ul>
      );
      listItems = [];
    }
  };

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) {
      flushList();
      blocks.push(<div key={key++} className="h-2" aria-hidden="true" />);
      continue;
    }
    const marker = LIST_MARKERS.find((m) => line.startsWith(m));
    if (marker) {
      listItems.push(line.slice(marker.length).trim());
    } else {
      flushList();
      blocks.push(<p key={key++}>{line}</p>);
    }
  }
  flushList();

  return <>{blocks}</>;
}
