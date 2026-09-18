"use client"

import { useState } from 'react';
import { AltApplicationsResult, AltApplicationVariant, UTCRecord } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { toast } from '@/hooks/use-toast';
import { Loader2, Compass, ChevronDown, Sparkles, Star } from 'lucide-react';

interface AltApplicationsSearchProps {
  record: UTCRecord;
}

const LEVEL_LABELS: Record<AltApplicationVariant['scores']['feasibility'], string> = {
  low: 'Низкая',
  medium: 'Средняя',
  high: 'Высокая',
};

const LEVEL_STYLES: Record<AltApplicationVariant['scores']['feasibility'], string> = {
  low: 'bg-red-100 text-red-800 border-red-300 hover:bg-red-100',
  medium: 'bg-yellow-100 text-yellow-800 border-yellow-300 hover:bg-yellow-100',
  high: 'bg-green-100 text-green-800 border-green-300 hover:bg-green-100',
};

export function AltApplicationsSearch({ record }: AltApplicationsSearchProps) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AltApplicationsResult | null>(null);
  const [openFunctions, setOpenFunctions] = useState<Set<number>>(new Set());

  const handleSearch = async () => {
    setLoading(true);
    setResult(null);
    try {
      const response = await fetch(`/api/utc/${record.id}/alt-applications`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      const data = await response.json();

      if (!response.ok) {
        toast({
          title: 'Не удалось выполнить поиск',
          description: data?.error || 'Произошла ошибка при поиске альтернативных областей применения.',
          variant: 'destructive',
        });
        return;
      }

      setResult(data as AltApplicationsResult);
    } catch (error) {
      toast({
        title: 'Ошибка сети',
        description: 'Не удалось связаться с сервером для поиска альтернативных областей применения.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleFunction = (index: number) => {
    setOpenFunctions((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  };

  return (
    <Card className="border-l-4 border-l-purple-500">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Compass className="h-4 w-4" />
          Поиск альтернативных областей применения (новых рынков)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-xs text-muted-foreground">
          На основе уникальной технологической компетенции этой записи AI предложит альтернативные
          объекты применения текущей функции, а также новые функции продукта с их объектами
          приложения, и оценит каждый вариант по физической, технико-технологической и
          экономической целесообразности («морфологический ящик»).
        </p>
        <Button onClick={handleSearch} disabled={loading} className="w-full sm:w-auto">
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Идёт поиск и оценка вариантов...
            </>
          ) : (
            <>
              <Compass className="mr-2 h-4 w-4" />
              Найти альтернативные применения
            </>
          )}
        </Button>

        {result && (
          <div className="space-y-5">
            {/* Новые области для той же Функции */}
            <div className="space-y-2">
              <h4 className="text-sm font-semibold flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-purple-500" />
                Новые области для той же Функции ({result.alternativeObjects.length})
              </h4>
              <ul className="list-disc pl-5 text-sm space-y-1">
                {result.alternativeObjects.map((obj, i) => (
                  <li key={i}>{obj}</li>
                ))}
              </ul>
            </div>

            {/* Новые типы Продуктов */}
            <div className="space-y-2">
              <h4 className="text-sm font-semibold flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-purple-500" />
                Новые типы Продуктов ({result.newFunctions.length})
              </h4>
              <div className="space-y-2">
                {result.newFunctions.map((nf, i) => (
                  <Collapsible
                    key={i}
                    open={openFunctions.has(i)}
                    onOpenChange={() => toggleFunction(i)}
                  >
                    <CollapsibleTrigger asChild>
                      <button
                        type="button"
                        className="flex w-full items-center justify-between rounded-lg border p-3 text-sm text-left hover:bg-muted/50"
                      >
                        <span className="font-medium">{nf.function}</span>
                        <ChevronDown className="h-4 w-4 shrink-0" />
                      </button>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <ul className="list-disc pl-8 pt-2 text-sm text-muted-foreground space-y-1">
                        {nf.objects.map((obj, j) => (
                          <li key={j}>{obj}</li>
                        ))}
                      </ul>
                    </CollapsibleContent>
                  </Collapsible>
                ))}
              </div>
            </div>

            {/* Сводный рейтинг всех вариантов */}
            <div className="space-y-2">
              <h4 className="text-sm font-semibold flex items-center gap-2">
                <Star className="h-4 w-4 text-purple-500" />
                Сводный рейтинг всех вариантов ({result.allVariantsRanked.length})
              </h4>
              <div className="space-y-2">
                {result.allVariantsRanked.map((v, i) => (
                  <div
                    key={i}
                    className={`rounded-lg border p-3 text-sm ${
                      v.recommended ? 'border-purple-400 bg-purple-50/50' : ''
                    }`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="font-medium">{v.description}</span>
                      <div className="flex items-center gap-2">
                        {v.recommended && (
                          <Badge className="bg-purple-600 hover:bg-purple-600">Рекомендовано</Badge>
                        )}
                        <Badge variant="outline">Балл: {v.totalScore}/9</Badge>
                      </div>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-2 text-xs">
                      <Badge variant="outline" className={LEVEL_STYLES[v.scores.feasibility]}>
                        Физ. реализуемость: {LEVEL_LABELS[v.scores.feasibility]}
                      </Badge>
                      <Badge variant="outline" className={LEVEL_STYLES[v.scores.technicalFeasibility]}>
                        Техн. целесообразность: {LEVEL_LABELS[v.scores.technicalFeasibility]}
                      </Badge>
                      <Badge variant="outline" className={LEVEL_STYLES[v.scores.economicFeasibility]}>
                        Экон. целесообразность: {LEVEL_LABELS[v.scores.economicFeasibility]}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
