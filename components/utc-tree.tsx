
"use client"

import { useState } from 'react';
import { UTCTreeNode, UtcNodeType, UTC_NODE_TYPE_LABELS } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronRight, ChevronDown, Eye, Edit, Plus, Box, Cog, Layers } from 'lucide-react';
import { cn } from '@/lib/utils';

interface UTCTreeProps {
  nodes: UTCTreeNode[];
  onView: (node: UTCTreeNode) => void;
  onEdit: (node: UTCTreeNode) => void;
  onAddChild: (parent: UTCTreeNode) => void;
}

const NODE_TYPE_BADGE: Record<UtcNodeType, { variant: 'default' | 'secondary' | 'outline'; className: string; icon: JSX.Element }> = {
  PRODUCT: { variant: 'default', className: 'bg-primary text-primary-foreground', icon: <Box className="h-3 w-3 mr-1" /> },
  ELEMENT: { variant: 'secondary', className: 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-200', icon: <Layers className="h-3 w-3 mr-1" /> },
  PROCESS: { variant: 'outline', className: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200 border-amber-300', icon: <Cog className="h-3 w-3 mr-1" /> },
};

export function UTCTree({ nodes, onView, onEdit, onAddChild }: UTCTreeProps) {
  if (!nodes || nodes.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Записи УТК не найдены
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {nodes.map((node) => (
        <UTCTreeNodeItem
          key={node.id}
          node={node}
          level={0}
          onView={onView}
          onEdit={onEdit}
          onAddChild={onAddChild}
        />
      ))}
    </div>
  );
}

interface UTCTreeNodeItemProps {
  node: UTCTreeNode;
  level: number;
  onView: (node: UTCTreeNode) => void;
  onEdit: (node: UTCTreeNode) => void;
  onAddChild: (parent: UTCTreeNode) => void;
}

function UTCTreeNodeItem({ node, level, onView, onEdit, onAddChild }: UTCTreeNodeItemProps) {
  const [expanded, setExpanded] = useState(true);
  const hasChildren = !!node.children && node.children.length > 0;
  const nodeType = (node.nodeType || 'PRODUCT') as UtcNodeType;
  const badge = NODE_TYPE_BADGE[nodeType];
  const title = node.keyProduct || node.formulation;

  return (
    <div>
      <div
        className="flex items-start gap-2 py-2 pr-2 rounded-md hover:bg-muted/40 transition-colors"
        style={{ paddingLeft: `${level * 24}px` }}
      >
        <button
          type="button"
          onClick={() => setExpanded((prev) => !prev)}
          className={cn(
            'mt-1 h-5 w-5 flex items-center justify-center rounded hover:bg-muted shrink-0',
            !hasChildren && 'invisible'
          )}
          aria-label={expanded ? 'Свернуть' : 'Развернуть'}
        >
          {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={badge.variant} className={cn('flex items-center', badge.className)}>
              {badge.icon}
              {UTC_NODE_TYPE_LABELS[nodeType]}
            </Badge>
            <Badge variant="outline">ID: {node.id}</Badge>
            <span className="font-medium text-sm">{title}</span>
          </div>

          {node.decompositionCharacteristic && (
            <p className="text-xs text-muted-foreground mt-1">
              За счёт характеристики: {node.decompositionCharacteristic}
            </p>
          )}

          <div className="flex items-center gap-2 mt-1">
            <Button variant="ghost" size="sm" onClick={() => onView(node)} title="Просмотр">
              <Eye className="h-3.5 w-3.5 mr-1" />
              Просмотр
            </Button>
            {node.canEdit && (
              <>
                <Button variant="ghost" size="sm" onClick={() => onEdit(node)} title="Редактировать">
                  <Edit className="h-3.5 w-3.5 mr-1" />
                  Редактировать
                </Button>
                <Button variant="ghost" size="sm" onClick={() => onAddChild(node)} title="Добавить ключевой элемент/процесс">
                  <Plus className="h-3.5 w-3.5 mr-1" />
                  Добавить ключевой элемент/процесс
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      {hasChildren && expanded && (
        <div>
          {(node.children as UTCTreeNode[]).map((child) => (
            <UTCTreeNodeItem
              key={child.id}
              node={child}
              level={level + 1}
              onView={onView}
              onEdit={onEdit}
              onAddChild={onAddChild}
            />
          ))}
        </div>
      )}
    </div>
  );
}
