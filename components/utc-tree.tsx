
"use client"

import { useState } from 'react';
import { UTCTreeNode, UtcNodeType, UTC_NODE_TYPE_LABELS } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { ChevronRight, ChevronDown, Eye, Edit, Plus, Box, Cog, Layers } from 'lucide-react';
import { cn } from '@/lib/utils';

interface UTCTreeProps {
  nodes: UTCTreeNode[];
  onView: (node: UTCTreeNode) => void;
  onEdit: (node: UTCTreeNode) => void;
  onAddChild: (parent: UTCTreeNode) => void;
}

const NODE_TYPE_BADGE: Record<UtcNodeType, { className: string; icon: JSX.Element }> = {
  PRODUCT: { className: 'bg-primary text-primary-foreground', icon: <Box className="h-3 w-3" /> },
  ELEMENT: { className: 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-200', icon: <Layers className="h-3 w-3" /> },
  PROCESS: { className: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200 border border-amber-300', icon: <Cog className="h-3 w-3" /> },
};

// Глобальный флаг переключения раскрытия. Храним набор id узлов, у которых
// явно переключено состояние от стандартного (раскрыт). «Развернуть/Свернуть всё»
// меняет этот набор и сбрасывает per-node override.
// Упрощённо: stateAll = boolean (все раскрыты или все свёрнуты), поверх него
// Set<id> — индивидуальные overrides.
interface CollapseState {
  allCollapsed: boolean;
  overrides: Set<number>;
}

function getAllIds(nodes: UTCTreeNode[]): Set<number> {
  const s = new Set<number>();
  const walk = (list: UTCTreeNode[]) => list.forEach((n) => { s.add(n.id!); if (n.children) walk(n.children); });
  walk(nodes);
  return s;
}

export function UTCTree({ nodes, onView, onEdit, onAddChild }: UTCTreeProps) {
  const [collapsed, setCollapsed] = useState<CollapseState>({ allCollapsed: false, overrides: new Set() });

  const isCollapsed = (id: number | undefined): boolean => {
    if (id === undefined) return false;
    if (collapsed.overrides.has(id)) return !collapsed.allCollapsed;
    return collapsed.allCollapsed;
  };

  const toggleNode = (id: number | undefined) => {
    if (id === undefined) return;
    setCollapsed((prev) => {
      const next = new Set(prev.overrides);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return { ...prev, overrides: next };
    });
  };

  const expandAll = () => setCollapsed({ allCollapsed: false, overrides: new Set() });
  const collapseAll = () => setCollapsed({ allCollapsed: true, overrides: new Set() });

  if (!nodes || nodes.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Записи УТК не найдены
      </div>
    );
  }

  const total = countTotal(nodes);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <p className="text-xs text-muted-foreground">
          Все записи: <span className="font-medium">{nodes.length}</span> корневых · <span className="font-medium">{total}</span> всего
        </p>
        <div className="flex items-center gap-4">
          <button type="button" onClick={expandAll} className="text-xs text-primary hover:underline">
            Развернуть всё
          </button>
          <button type="button" onClick={collapseAll} className="text-xs text-primary hover:underline">
            Свернуть всё
          </button>
        </div>
      </div>

      <div className="tree-root">
        {nodes.map((node, i) => (
          <UTCTreeNodeItem
            key={node.id}
            node={node}
            depth={0}
            isRoot
            isLast={i === nodes.length - 1}
            ancestorNonLast={[]}
            collapsed={collapsed}
            isNodeCollapsed={isCollapsed}
            onToggle={toggleNode}
            onView={onView}
            onEdit={onEdit}
            onAddChild={onAddChild}
          />
        ))}
      </div>
    </div>
  );
}

function countTotal(nodes: UTCTreeNode[]): number {
  return nodes.reduce((sum, n) => sum + 1 + countTotal(n.children || []), 0);
}

interface UTCTreeNodeItemProps {
  node: UTCTreeNode;
  depth: number;
  isRoot: boolean;
  isLast: boolean;
  ancestorNonLast: boolean[];
  collapsed: CollapseState;
  isNodeCollapsed: (id: number | undefined) => boolean;
  onToggle: (id: number | undefined) => void;
  onView: (node: UTCTreeNode) => void;
  onEdit: (node: UTCTreeNode) => void;
  onAddChild: (parent: UTCTreeNode) => void;
}

function UTCTreeNodeItem({ node, depth, isRoot, isLast, ancestorNonLast, collapsed, isNodeCollapsed, onToggle, onView, onEdit, onAddChild }: UTCTreeNodeItemProps) {
  const hasChildren = !!node.children && node.children.length > 0;
  const expanded = !isNodeCollapsed(node.id);
  const nodeType = (node.nodeType || 'PRODUCT') as UtcNodeType;
  const title = node.keyProduct || node.formulation;

  return (
    <div className="tree-item">
      <div
        className={cn(
          'group tree-row relative flex items-center gap-1 rounded-md hover:bg-muted/60 transition-colors',
          isRoot && 'mt-2 first:mt-0'
        )}
        style={{ paddingLeft: `${depth * 24}px` }}
      >
        <TreeBranch depth={depth} isLast={isLast} hasChildren={hasChildren} ancestorNonLast={ancestorNonLast} />

        {/* Шеврон раскрытия */}
        <button
          type="button"
          onClick={() => hasChildren && onToggle(node.id)}
          className={cn(
            'tree-chev h-5 w-5 flex items-center justify-center rounded hover:bg-muted shrink-0 text-muted-foreground',
            !hasChildren && 'invisible'
          )}
          aria-label={expanded ? 'Свернуть' : 'Развернуть'}
        >
          {expanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
        </button>

        {/* Иконка типа */}
        <span className="tree-ico flex-none flex items-center justify-center w-4 shrink-0">
          {NODE_TYPE_BADGE[nodeType].icon}
        </span>

        {/* Заголовок: тип + ID + название */}
        <div className="flex-1 min-w-0 items-center gap-2 flex">
          <span className={cn('text-xs font-medium px-1.5 py-0.5 rounded whitespace-nowrap', NODE_TYPE_BADGE[nodeType].className)}>
            {UTC_NODE_TYPE_LABELS[nodeType]}
          </span>
          <span className="text-xs text-muted-foreground shrink-0">ID: {node.id}</span>
          <span className="text-sm font-semibold truncate">{title}</span>
        </div>

        {/* Действия — при наведении */}
        <div className="tree-actions flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button variant="ghost" size="sm" onClick={() => onView(node)} title="Просмотр">
            <Eye className="h-3.5 w-3.5" />
          </Button>
          {node.canEdit && (
            <>
              <Button variant="ghost" size="sm" onClick={() => onEdit(node)} title="Редактировать">
                <Edit className="h-3.5 w-3.5" />
              </Button>
              <Button variant="ghost" size="sm" onClick={() => onAddChild(node)} title="Добавить ключевой элемент/процесс">
                <Plus className="h-3.5 w-3.5" />
              </Button>
            </>
          )}
        </div>
      </div>

      {hasChildren && expanded && (
        <div>
          {node.children!.map((child: UTCTreeNode, index) => {
            const childIsLast = index === node.children!.length - 1;
            return (
              <UTCTreeNodeItem
                key={child.id}
                node={child}
                depth={depth + 1}
                isRoot={false}
                isLast={childIsLast}
                ancestorNonLast={[...ancestorNonLast, !isLast]}
                collapsed={collapsed}
                isNodeCollapsed={isNodeCollapsed}
                onToggle={onToggle}
                onView={onView}
                onEdit={onEdit}
                onAddChild={onAddChild}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

interface TreeBranchProps {
  depth: number;
  isLast: boolean;
  hasChildren: boolean;
  ancestorNonLast: boolean[];
}

/**
 * Пунктирные ветки-направляющие (в стиле ├── / └── / │) слева от строки.
 * Каждая колонка уровня — 24px (совпадает с отступом строки depth*24).
 * Вертикальная линия в колонке предка идёт вниз, пока у предка есть следующий сиблинг
 * (иначе пусто). В собственной колонке — короткий горизонтальный отросток к содержимому.
 */
function TreeBranch({ depth, isLast, hasChildren, ancestorNonLast }: TreeBranchProps) {
  const segs: React.ReactNode[] = [];
  for (let j = 1; j < depth; j++) {
    segs.push(
      <div key={`anc-${j}`} className={cn('w-6 shrink-0 self-stretch relative', ancestorNonLast[j - 1] ? '' : '')}>
        {ancestorNonLast[j - 1] && <div className="absolute inset-y-0 left-0 border-l border-dashed" />}
      </div>
    );
  }
  // собственная колонка: вертикаль (если есть следующий сиблинг) + горизонтальный отросток
  segs.push(
    <div key="own" className="w-6 shrink-0 self-stretch relative">
      {!isLast && <div className="absolute inset-y-0 left-0 border-l border-dashed" />}
      <div className="absolute top-1/2 left-0 right-2 border-t border-dashed" />
    </div>
  );

  return (
    <div className="absolute inset-y-0 left-0 flex items-stretch" aria-hidden="true">
      <div className="flex h-full items-stretch" style={{ width: `${depth * 24}px` }}>
        {segs}
      </div>
    </div>
  );
}
