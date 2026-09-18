"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "@/hooks/use-toast";
import { ArrowLeft, Save, TestTube2, Loader2 } from "lucide-react";
import Link from "next/link";
import type { LlmProvider, AppSettingsDTO } from "@/lib/types";

export default function AdminSettingsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const isAdmin = (session?.user as any)?.role === "ADMIN";

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);

  const [llmProvider, setLlmProvider] = useState<LlmProvider>("cloud");
  const [localLlmBaseUrl, setLocalLlmBaseUrl] = useState("http://localhost:11434");
  const [localLlmModel, setLocalLlmModel] = useState("llama3.1");

  // Redirect non-admin
  useEffect(() => {
    if (status === "loading") return;
    if (!session || !isAdmin) {
      router.replace("/");
    }
  }, [session, status, isAdmin, router]);

  // Load settings
  useEffect(() => {
    if (!isAdmin) return;
    fetch("/api/admin/llm-settings")
      .then((r) => r.json())
      .then((data: AppSettingsDTO) => {
        setLlmProvider(data.llmProvider);
        setLocalLlmBaseUrl(data.localLlmBaseUrl || "http://localhost:11434");
        setLocalLlmModel(data.localLlmModel || "llama3.1");
      })
      .catch(() => {
        toast({ title: "Ошибка", description: "Не удалось загрузить настройки LLM", variant: "destructive" });
      })
      .finally(() => setLoading(false));
  }, [isAdmin]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/llm-settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ llmProvider, localLlmBaseUrl, localLlmModel }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Ошибка сохранения");
      }
      toast({ title: "Успех", description: "Настройки LLM сохранены" });
    } catch (error) {
      toast({
        title: "Ошибка",
        description: error instanceof Error ? error.message : "Не удалось сохранить настройки",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async () => {
    setTesting(true);
    try {
      const res = await fetch("/api/admin/llm-settings/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider: llmProvider,
          ...(llmProvider === "local" && { localLlmBaseUrl, localLlmModel }),
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast({
          title: "✅ Подключение успешно",
          description: `${data.message} (${data.latencyMs}мс)`,
        });
      } else {
        toast({
          title: "❌ Ошибка подключения",
          description: `${data.message} (${data.latencyMs}мс)`,
          variant: "destructive",
        });
      }
    } catch {
      toast({
        title: "Ошибка",
        description: "Не удалось выполнить тест подключения",
        variant: "destructive",
      });
    } finally {
      setTesting(false);
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!isAdmin) return null;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="mb-6">
          <Button variant="ghost" asChild>
            <Link href="/">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Назад на главную
            </Link>
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Настройки LLM</CardTitle>
            <CardDescription>
              Глобальный переключатель источника языковой модели. Влияет на все
              функции AI в системе: мастер ввода УТК, поиск конкурентов, поиск
              альтернативных применений.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <RadioGroup
              value={llmProvider}
              onValueChange={(v) => setLlmProvider(v as LlmProvider)}
              className="space-y-3"
            >
              <div className="flex items-center space-x-3 rounded-md border p-4">
                <RadioGroupItem value="cloud" id="cloud" />
                <Label htmlFor="cloud" className="flex-1 cursor-pointer">
                  <div className="font-medium">☁️ Облачная LLM (Abacus.ai)</div>
                  <div className="text-sm text-muted-foreground">
                    Используется API Abacus.ai RouteLLM. Требуется ключ ABACUS_API_KEY.
                  </div>
                </Label>
              </div>
              <div className="flex items-center space-x-3 rounded-md border p-4">
                <RadioGroupItem value="local" id="local" />
                <Label htmlFor="local" className="flex-1 cursor-pointer">
                  <div className="font-medium">🖥️ Локальная LLM (Ollama)</div>
                  <div className="text-sm text-muted-foreground">
                    Используется локально запущенный Ollama. Данные не покидают сервер.
                  </div>
                </Label>
              </div>
            </RadioGroup>

            {llmProvider === "local" && (
              <div className="space-y-4 rounded-md border p-4 bg-muted/30">
                <div className="space-y-2">
                  <Label htmlFor="baseUrl">URL сервера Ollama</Label>
                  <Input
                    id="baseUrl"
                    value={localLlmBaseUrl}
                    onChange={(e) => setLocalLlmBaseUrl(e.target.value)}
                    placeholder="http://localhost:11434"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="model">Модель</Label>
                  <Input
                    id="model"
                    value={localLlmModel}
                    onChange={(e) => setLocalLlmModel(e.target.value)}
                    placeholder="llama3.1"
                  />
                  <p className="text-xs text-muted-foreground">
                    Модель должна быть предварительно скачана: ollama pull {localLlmModel}
                  </p>
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <Button onClick={handleTest} variant="outline" disabled={testing}>
                {testing ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <TestTube2 className="h-4 w-4 mr-2" />
                )}
                Проверить подключение
              </Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                Сохранить
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
