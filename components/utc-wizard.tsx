
"use client"

import { useState } from 'react';
import {
  ChatMessage,
  ExtractedUtcData,
  EXTRACTED_FIELD_LABELS,
} from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { toast } from '@/hooks/use-toast';
import {
  Loader2,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  X,
  ChevronDown,
  Pencil,
  AlertCircle,
} from 'lucide-react';

type WizardStage = 'loading-start' | 'dialog' | 'preview' | 'error';

interface UTCWizardProps {
  onCancel: () => void;
  onCreated: () => void;
}

export function UTCWizard({ onCancel, onCreated }: UTCWizardProps) {
  const [stage, setStage] = useState<WizardStage>('loading-start');
  const [wizardSessionId, setWizardSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState<string>('');
  const [answer, setAnswer] = useState('');
  const [step, setStep] = useState(1);
  const [totalSteps, setTotalSteps] = useState(10);
  const [isSending, setIsSending] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [extractedData, setExtractedData] = useState<ExtractedUtcData | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const started = useState(() => {
    startWizard();
    return true;
  })[0];

  async function startWizard() {
    setStage('loading-start');
    setErrorMessage(null);
    try {
      const response = await fetch('/api/utc/wizard/start', { method: 'POST' });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Не удалось запустить AI-мастер');
      }
      const data = await response.json();
      setWizardSessionId(data.wizardSessionId);
      setCurrentQuestion(data.firstQuestion);
      setMessages([{ role: 'assistant', content: data.firstQuestion }]);
      setStep(1);
      setStage('dialog');
    } catch (error) {
      console.error('Ошибка запуска AI-мастера:', error);
      const message = error instanceof Error ? error.message : 'Не удалось запустить AI-мастер';
      setErrorMessage(message);
      setStage('error');
    }
  }

  async function handleSendAnswer() {
    if (!wizardSessionId || answer.trim() === '') return;
    setIsSending(true);
    const trimmedAnswer = answer.trim();
    const updatedMessages: ChatMessage[] = [...messages, { role: 'user', content: trimmedAnswer }];
    setMessages(updatedMessages);
    setAnswer('');

    try {
      const response = await fetch('/api/utc/wizard/answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wizardSessionId, userAnswer: trimmedAnswer }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        if (data.expired) {
          setErrorMessage(data.error || 'Сессия мастера истекла. Начните заново.');
          setStage('error');
          return;
        }
        throw new Error(data.error || 'Не удалось обработать ответ');
      }

      if (data.isComplete && data.extractedData) {
        setExtractedData(data.extractedData as ExtractedUtcData);
        setStage('preview');
        return;
      }

      if (!data.isComplete && data.error) {
        // Не удалось извлечь JSON на последнем шаге — просим повторить последний ответ.
        toast({
          title: 'Не удалось собрать данные',
          description: data.error,
          variant: 'destructive',
        });
        // Откатываем последнее сообщение пользователя, чтобы он мог повторить ответ.
        setMessages(messages);
        setAnswer(trimmedAnswer);
        return;
      }

      setCurrentQuestion(data.nextQuestion);
      setMessages([...updatedMessages, { role: 'assistant', content: data.nextQuestion }]);
      setStep(data.step || step + 1);
      setTotalSteps(data.totalSteps || totalSteps);
    } catch (error) {
      console.error('Ошибка отправки ответа AI-мастеру:', error);
      toast({
        title: 'Ошибка',
        description: error instanceof Error ? error.message : 'Не удалось обработать ответ',
        variant: 'destructive',
      });
      // Откатываем оптимистично добавленное сообщение пользователя при ошибке.
      setMessages(messages);
      setAnswer(trimmedAnswer);
    } finally {
      setIsSending(false);
    }
  }

  async function handleCreateRecord() {
    if (!extractedData) return;
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/utc/wizard/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wizardSessionId, extractedData }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.error || 'Не удалось создать запись УТК');
      }
      toast({
        title: 'Успех',
        description: 'Запись УТК успешно создана с помощью AI-мастера',
      });
      onCreated();
    } catch (error) {
      console.error('Ошибка создания записи через AI-мастер:', error);
      toast({
        title: 'Ошибка',
        description: error instanceof Error ? error.message : 'Не удалось создать запись УТК',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleEditField(field: keyof ExtractedUtcData, value: string) {
    if (!extractedData) return;
    setExtractedData({ ...extractedData, [field]: value });
  }

  const isLastQuestion = step >= totalSteps;

  return (
    <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm overflow-y-auto">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <h1 className="text-2xl font-bold">AI-мастер ввода УТК</h1>
          </div>
          <Button variant="ghost" size="sm" onClick={onCancel}>
            <X className="h-4 w-4 mr-2" />
            Отмена
          </Button>
        </div>

        {stage === 'loading-start' && (
          <Card>
            <CardContent className="py-12 flex flex-col items-center justify-center gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-muted-foreground">Запуск AI-мастера...</p>
            </CardContent>
          </Card>
        )}

        {stage === 'error' && (
          <Card className="border-destructive">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-destructive">
                <AlertCircle className="h-5 w-5" />
                Ошибка AI-мастера
              </CardTitle>
              <CardDescription>{errorMessage}</CardDescription>
            </CardHeader>
            <CardContent className="flex gap-3">
              <Button onClick={startWizard}>Попробовать снова</Button>
              <Button variant="outline" onClick={onCancel}>
                Вернуться на главную
              </Button>
            </CardContent>
          </Card>
        )}

        {stage === 'dialog' && (
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2 text-sm text-muted-foreground">
                <span>
                  Вопрос {step} из {totalSteps}
                </span>
                <span>{Math.round((step / totalSteps) * 100)}%</span>
              </div>
              <Progress value={(step / totalSteps) * 100} />
            </div>

            {messages.length > 1 && (
              <Collapsible open={historyOpen} onOpenChange={setHistoryOpen}>
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" size="sm" className="text-muted-foreground">
                    <ChevronDown className={`h-4 w-4 mr-1 transition-transform ${historyOpen ? 'rotate-180' : ''}`} />
                    История диалога ({messages.length - 1})
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <Card className="mt-2 bg-muted/30">
                    <CardContent className="py-4 space-y-3 max-h-64 overflow-y-auto text-sm">
                      {messages.slice(0, -1).map((message, index) => (
                        <div key={index} className={message.role === 'assistant' ? 'text-foreground' : 'text-muted-foreground pl-4'}>
                          <span className="font-medium">
                            {message.role === 'assistant' ? 'Мастер: ' : 'Вы: '}
                          </span>
                          {message.content}
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                </CollapsibleContent>
              </Collapsible>
            )}

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-start gap-2">
                  <Sparkles className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                  <span>{currentQuestion}</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Textarea
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  placeholder="Введите ваш ответ..."
                  rows={4}
                  disabled={isSending}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                      handleSendAnswer();
                    }
                  }}
                />
                <div className="flex justify-end gap-3">
                  <Button variant="outline" onClick={onCancel} disabled={isSending}>
                    Отмена
                  </Button>
                  <Button onClick={handleSendAnswer} disabled={isSending || answer.trim() === ''}>
                    {isSending ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Обработка...
                      </>
                    ) : isLastQuestion ? (
                      <>
                        Завершить
                        <CheckCircle2 className="h-4 w-4 ml-2" />
                      </>
                    ) : (
                      <>
                        Далее
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {stage === 'preview' && extractedData && (
          <div className="space-y-4">
            <Alert>
              <CheckCircle2 className="h-4 w-4" />
              <AlertTitle>Данные собраны</AlertTitle>
              <AlertDescription>
                Проверьте и при необходимости отредактируйте поля перед созданием записи УТК.
              </AlertDescription>
            </Alert>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Превью карточки УТК</CardTitle>
                <CardDescription>Все 10 полей, собранные AI-мастером</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {(Object.keys(EXTRACTED_FIELD_LABELS) as (keyof ExtractedUtcData)[]).map((field) => (
                  <div key={field}>
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline" className="text-xs">
                        {EXTRACTED_FIELD_LABELS[field]}
                      </Badge>
                    </div>
                    <Textarea
                      value={extractedData[field] || ''}
                      onChange={(e) => handleEditField(field, e.target.value)}
                      rows={2}
                    />
                  </div>
                ))}
              </CardContent>
            </Card>

            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setStage('dialog')} disabled={isSubmitting}>
                <Pencil className="h-4 w-4 mr-2" />
                Редактировать (вернуться в диалог)
              </Button>
              <Button onClick={handleCreateRecord} disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Создание...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Создать запись УТК
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
