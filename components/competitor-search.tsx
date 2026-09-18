"use client"

import { useState } from 'react';
import {
  CompetitorInfo,
  CompetitorSearchResult,
  UTCRecord,
} from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { toast } from '@/hooks/use-toast';
import { Loader2, Search, ExternalLink, AlertCircle, PlusCircle } from 'lucide-react';

interface CompetitorSearchProps {
  record: UTCRecord;
  onApplied: (updatedRecord: UTCRecord) => void;
}

const CONFIDENCE_STYLES: Record<CompetitorInfo['confidence'], string> = {
  high: 'bg-green-100 text-green-800 border-green-300 hover:bg-green-100',
  medium: 'bg-yellow-100 text-yellow-800 border-yellow-300 hover:bg-yellow-100',
  low: 'bg-red-100 text-red-800 border-red-300 hover:bg-red-100',
};

const CONFIDENCE_LABELS: Record<CompetitorInfo['confidence'], string> = {
  high: 'Высокая достоверность',
  medium: 'Средняя достоверность',
  low: 'Низкая достоверность',
};

export function CompetitorSearch({ record, onApplied }: CompetitorSearchProps) {
  const [loading, setLoading] = useState(false);
  const [applying, setApplying] = useState(false);
  const [additionalContext, setAdditionalContext] = useState('');
  const [result, setResult] = useState<CompetitorSearchResult | null>(null);
  const [selected, setSelected] = useState<Set<number>>(new Set());

  const handleSearch = async () => {
    setLoading(true);
    setResult(null);
    setSelected(new Set());
    try {
      const response = await fetch(`/api/utc/${record.id}/competitors`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ additionalContext: additionalContext.trim() || undefined }),
      });
      const data = await response.json();

      if (!response.ok) {
        toast({
          title: 'Не удалось выполнить поиск',
          description: data?.error || 'Произошла ошибка при поиске конкурентов.',
          variant: 'destructive',
        });
        return;
      }

      setResult(data as CompetitorSearchResult);

      if (!data.competitors || data.competitors.length === 0) {
        toast({
          title: 'Данных недостаточно',
          description:
            data.note ||
            'Поиск не нашёл достаточно достоверных данных о конкурентах. Попробуйте уточнить контекст.',
        });
      }
    } catch (error) {
      toast({
        title: 'Ошибка сети',
        description: 'Не удалось связаться с сервером для поиска конкурентов.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleSelected = (index: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  };

  const handleApply = async () => {
    if (!result || selected.size === 0) return;
    setApplying(true);
    try {
      const selectedCompetitors = result.competitors.filter((_, i) => selected.has(i));
      const response = await fetch(`/api/utc/${record.id}/competitors/apply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ selectedCompetitors }),
      });
      const data = await response.json();

      if (!response.ok) {
        toast({
          title: 'Не удалось добавить в таблицу',
          description: data?.error || 'Произошла ошибка при обновлении записи.',
          variant: 'destructive',
        });
        return;
      }

      toast({
        title: 'Готово',
        description: 'Сравнение с конкурентами добавлено в поле "Преимущества".',
      });
      onApplied(data as UTCRecord);
      setResult(null);
      setSelected(new Set());
    } catch (error) {
      toast({
        title: 'Ошибка сети',
        description: 'Не удалось связаться с сервером для сохранения выбора.',
        variant: 'destructive',
      });
    } finally {
      setApplying(false);
    }
  };

  return (
    <Card className="border-l-4 border-l-blue-500">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Search className="h-4 w-4" />
          Поиск конкурентов-аналогов
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Textarea
          placeholder="Уточнение для поиска (необязательно): например, регион, конкретная характеристика..."
          value={additionalContext}
          onChange={(e) => setAdditionalContext(e.target.value)}
          disabled={loading}
          rows={2}
        />
        <Button onClick={handleSearch} disabled={loading} className="w-full sm:w-auto">
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Идёт поиск и проверка данных...
            </>
          ) : (
            <>
              <Search className="mr-2 h-4 w-4" />
              Найти конкурентов-аналогов
            </>
          )}
        </Button>

        {result && (
          <div className="space-y-3">
            <p className="text-xs text-muted-foreground">
              Поисковый запрос: <span className="font-mono">{result.searchQuery}</span>
            </p>

            {result.note && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Замечание фактчекера</AlertTitle>
                <AlertDescription>{result.note}</AlertDescription>
              </Alert>
            )}

            {result.competitors.length === 0 ? (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Недостаточно данных</AlertTitle>
                <AlertDescription>
                  Не удалось найти достоверных данных о конкурентах в результатах поиска. Попробуйте
                  уточнить запрос.
                </AlertDescription>
              </Alert>
            ) : (
              <>
                <div className="space-y-2">
                  {result.competitors.map((c, i) => (
                    <div
                      key={i}
                      className="flex items-start gap-3 rounded-lg border p-3 text-sm"
                    >
                      <Checkbox
                        checked={selected.has(i)}
                        onCheckedChange={() => toggleSelected(i)}
                        className="mt-1"
                      />
                      <div className="flex-1 space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-semibold">{c.companyName}</span>
                          {c.product && (
                            <span className="text-muted-foreground">— {c.product}</span>
                          )}
                          <Badge variant="outline" className={CONFIDENCE_STYLES[c.confidence]}>
                            {CONFIDENCE_LABELS[c.confidence]}
                          </Badge>
                        </div>
                        {c.characteristics.length > 0 && (
                          <ul className="list-disc pl-5 text-muted-foreground">
                            {c.characteristics.map((ch, j) => (
                              <li key={j}>
                                {ch.name}: <span className="font-medium text-foreground">{ch.value}</span>
                              </li>
                            ))}
                          </ul>
                        )}
                        {c.sourceUrl && (
                          <a
                            href={c.sourceUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline"
                          >
                            <ExternalLink className="h-3 w-3" />
                            Источник
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                <Button
                  onClick={handleApply}
                  disabled={applying || selected.size === 0}
                  variant="default"
                >
                  {applying ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Добавление...
                    </>
                  ) : (
                    <>
                      <PlusCircle className="mr-2 h-4 w-4" />
                      Добавить выбранное в таблицу сравнения ({selected.size})
                    </>
                  )}
                </Button>
              </>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
