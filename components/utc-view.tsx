
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
import { AltApplicationsSearch } from '@/components/alt-applications-search';
import { X, Calendar, Building, Cog, Download } from 'lucide-react';
import { AdvantagesContent } from '@/lib/format-advantages';
import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface UTCViewProps {
  open: boolean;
  onClose: () => void;
  record: UTCRecord | null;
  onRecordUpdated?: (record: UTCRecord) => void;
}

export function UTCView({ open, onClose, record, onRecordUpdated }: UTCViewProps) {
  const [downloading, setDownloading] = useState(false);
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

  const handleDownload = async () => {
    if (!record?.id) return;
    setDownloading(true);
    try {
      const response = await fetch(`/api/utc/${record.id}/export-html`);

      if (!response.ok) {
        let message = 'Не удалось скачать карточку УТК.';
        try {
          const data = await response.json();
          if (data?.error) message = data.error;
        } catch {
          // тело не JSON — оставляем сообщение по умолчанию
        }
        toast({ title: 'Ошибка', description: message, variant: 'destructive' });
        return;
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `utc-${record.id}.html`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({ title: 'Успех', description: 'Карточка УТК скачана в формате HTML' });
    } catch (error) {
      console.error('Ошибка скачивания карточки:', error);
      toast({
        title: 'Ошибка сети',
        description: 'Не удалось связаться с сервером для скачивания карточки.',
        variant: 'destructive',
      });
    } finally {
      setDownloading(false);
    }
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
            <div className="flex items-center gap-1">
              {record.canEdit && (
                <Button variant="ghost" size="icon" onClick={handleDownload} disabled={downloading} title="Скачать карточку в HTML">
                  {downloading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Download className="h-4 w-4" />
                  )}
                </Button>
              )}
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>
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
                  {field === 'advantages' ? (
                    <div className="text-sm leading-relaxed whitespace-pre-wrap">
                      <AdvantagesContent text={value || 'Не заполнено'} />
                    </div>
                  ) : (
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">
                      {value || 'Не заполнено'}
                    </p>
                  )}
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
                <div className="font-medium whitespace-pre-wrap">
                  <AdvantagesContent text={record.advantages} />
                </div>
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

          {/* Поиск альтернативных областей применения / новых рынков (Этап 5) — доступно
              только автору записи или админу (как и поиск конкурентов). */}
          {record.canEdit && (
            <AltApplicationsSearch record={record} />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
