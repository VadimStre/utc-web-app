
"use client"

import { useState } from 'react';
import { UTCRecord } from '@/lib/types';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Edit, Trash2, Eye } from 'lucide-react';

interface UTCTableProps {
  records: UTCRecord[];
  onEdit: (record: UTCRecord) => void;
  onDelete: (id: number) => void;
  onView: (record: UTCRecord) => void;
}

export function UTCTable({ records, onEdit, onDelete, onView }: UTCTableProps) {
  const truncateText = (text: string, maxLength: number = 100) => {
    if (text?.length <= maxLength) return text;
    return text?.substring(0, maxLength) + '...';
  };

  return (
    <div className="border rounded-lg overflow-hidden shadow-sm">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50">
            <TableHead className="w-[80px]">ID</TableHead>
            <TableHead className="min-w-[200px]">Организация</TableHead>
            <TableHead className="min-w-[250px]">Ключевой продукт</TableHead>
            <TableHead className="min-w-[200px]">Назначение</TableHead>
            <TableHead className="min-w-[150px]">Категории</TableHead>
            <TableHead className="min-w-[200px]">Принцип действия</TableHead>
            <TableHead className="min-w-[200px]">Преимущества</TableHead>
            <TableHead className="min-w-[180px]">Владелец</TableHead>
            <TableHead className="min-w-[200px]">Формулировка УТК</TableHead>
            <TableHead className="w-[150px]">Действия</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {records?.length === 0 ? (
            <TableRow>
              <TableCell colSpan={10} className="text-center py-8 text-muted-foreground">
                Записи УТК не найдены
              </TableCell>
            </TableRow>
          ) : (
            records?.map((record) => (
              <TableRow key={record.id} className="hover:bg-muted/30 transition-colors">
                <TableCell className="font-medium">
                  <Badge variant="outline">{record.id}</Badge>
                </TableCell>
                <TableCell className="font-medium">
                  <div title={record.organization}>
                    {truncateText(record.organization, 80)}
                  </div>
                </TableCell>
                <TableCell>
                  <div title={record.keyProduct}>
                    {truncateText(record.keyProduct, 120)}
                  </div>
                </TableCell>
                <TableCell>
                  <div title={record.purpose}>
                    {truncateText(record.purpose, 100)}
                  </div>
                </TableCell>
                <TableCell>
                  <div title={record.categories}>
                    {truncateText(record.categories, 80)}
                  </div>
                </TableCell>
                <TableCell>
                  <div title={record.principle}>
                    {truncateText(record.principle, 100)}
                  </div>
                </TableCell>
                <TableCell>
                  <div title={record.advantages}>
                    {truncateText(record.advantages, 100)}
                  </div>
                </TableCell>
                <TableCell>
                  <div title={record.owner}>
                    {truncateText(record.owner, 80)}
                  </div>
                </TableCell>
                <TableCell>
                  <div title={record.formulation}>
                    {truncateText(record.formulation, 100)}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onView(record)}
                      title="Просмотр"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onEdit(record)}
                      title="Редактировать"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => record.id && onDelete(record.id)}
                      title="Удалить"
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
