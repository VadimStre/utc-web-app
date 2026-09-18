
"use client"

import { UTCRecord, UTC_FIELD_LABELS } from '@/lib/types';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CompetitorSearch } from '@/components/competitor-search';
import { X, Calendar, Building, Cog } from 'lucide-react';

interface UTCViewProps {
  open: boolean;
  onClose: () => void;
  record: UTCRecord | null;
  onRecordUpdated?: (record: UTCRecord) => void;
}

export function UTCView({ open, onClose, record, onRecordUpdated }: UTCViewProps) {
  if (!record) return null;

  const formatDate = (date: Date | string | undefined) => {
    if (!date) return 'Не указано';
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Cog className="h-5 w-5 text-primary" />
              <span>Просмотр записи УТК</span>
              <Badge variant="outline">ID: {record.id}</Badge>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Информация о записи */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Calendar className="h-4 w-4" />
                Информация о записи
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Дата создания:</span>
                <p className="font-medium">{formatDate(record.createdAt)}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Последнее обновление:</span>
                <p className="font-medium">{formatDate(record.updatedAt)}</p>
              </div>
            </CardContent>
          </Card>

          {/* Основная информация */}
          <div className="grid gap-6">
            {Object.entries(UTC_FIELD_LABELS).map(([field, label]) => {
              const fieldKey = field as keyof UTCRecord;
              const value = record[fieldKey];
              
              if (typeof value !== 'string') return null;
              
              return (
                <Card key={field}>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm text-muted-foreground font-medium">
                      {label}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">
                      {value || 'Не заполнено'}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Организация */}
          <Card className="border-l-4 border-l-primary">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Building className="h-4 w-4" />
                Сводка по организации
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Организация:</span>
                  <p className="font-medium">{record.organization}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Владелец УТК:</span>
                  <p className="font-medium">{record.owner}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Техническая сводка */}
          <Card className="border-l-4 border-l-secondary">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Cog className="h-4 w-4" />
                Техническая сводка
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>
                <span className="text-muted-foreground">Ключевой продукт:</span>
                <p className="font-medium">{record.keyProduct}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Принцип действия:</span>
                <p className="font-medium">{record.principle}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Преимущества:</span>
                <p className="font-medium">{record.advantages}</p>
              </div>
            </CardContent>
          </Card>

          {/* Поиск конкурентов-аналогов (Этап 4) — доступно только автору записи или админу */}
          {record.canEdit && (
            <CompetitorSearch
              record={record}
              onApplied={(updated) => {
                if (onRecordUpdated) {
                  onRecordUpdated(updated);
                }
              }}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
