
"use client"

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  HelpCircle, 
  BookOpen, 
  Lightbulb, 
  Target, 
  CheckCircle, 
  AlertTriangle,
  Microscope,
  Cpu,
  Zap
} from 'lucide-react';

export function HelpGuidance() {
  const [open, setOpen] = useState(false);

  const examples = [
    {
      icon: <Microscope className="h-5 w-5" />,
      title: "Лазерный микроскоп МИМ-340",
      organization: "ООО 'Инновационные Оптические Системы'",
      keyProduct: "Лазерный микроскоп МИМ-340 с разрешающей способностью менее 100нм",
      purpose: "Прецизионная диагностика микро- и наноструктур в реальном времени",
      categories: "Полупроводниковые материалы, биологические образцы, наноматериалы",
      principle: "Конфокальная лазерная микроскопия с адаптивной оптикой",
      advantages: "Разрешающая способность < 100нм, скорость сканирования в 10 раз выше аналогов",
      color: "bg-blue-50 border-blue-200"
    },
    {
      icon: <Cpu className="h-5 w-5" />,
      title: "Алгоритм преобразования сигналов",
      organization: "НИИ Цифровых Технологий",
      keyProduct: "Алгоритм преобразования интерференционных сигналов в реальном времени",
      purpose: "Повышение точности измерений в оптических системах контроля",
      categories: "Промышленные измерительные системы, научное оборудование",
      principle: "Быстрое преобразование Фурье с адаптивной фильтрацией шумов",
      advantages: "Точность измерений повышена в 5 раз, время обработки сокращено на 80%",
      color: "bg-green-50 border-green-200"
    },
    {
      icon: <Zap className="h-5 w-5" />,
      title: "Аэромагнитные направляющие",
      organization: "Завод Прецизионного Машиностроения",
      keyProduct: "Координатный стол с аэромагнитными направляющими субмикронной точности",
      purpose: "Высокоточное позиционирование в производственном оборудовании",
      categories: "Станки ЧПУ, измерительные машины, полупроводниковое оборудование",
      principle: "Магнитная левитация с пневматическим демпфированием",
      advantages: "Точность позиционирования ±50нм, отсутствие механического износа",
      color: "bg-purple-50 border-purple-200"
    }
  ];

  const guidelines = [
    {
      title: "Глобальное превосходство",
      description: "УТК должна превосходить лучшие мировые аналоги по ключевым характеристикам",
      icon: <Target className="h-5 w-5 text-blue-600" />,
      tips: [
        "Сравните с конкретными продуктами мировых лидеров",
        "Укажите конкретные численные преимущества",
        "Избегайте общих фраз типа 'лучший в мире'"
      ]
    },
    {
      title: "Уровень готовности технологии",
      description: "Технология должна иметь TRL 6 и выше (прототип или серийное производство)",
      icon: <CheckCircle className="h-5 w-5 text-green-600" />,
      tips: [
        "Технология должна быть проверена в реальных условиях",
        "Наличие работающих прототипов или готовых изделий",
        "Подтвержденные технические характеристики"
      ]
    },
    {
      title: "Четкие формулировки",
      description: "Избегайте рекламных слов, используйте технически точные описания",
      icon: <AlertTriangle className="h-5 w-5 text-orange-600" />,
      tips: [
        "Избегайте слов: революционный, уникальный, инновационный",
        "Используйте конкретные технические термины",
        "Указывайте измеримые характеристики"
      ]
    },
    {
      title: "Конфиденциальность",
      description: "Не раскрывайте коммерческую тайну и критически важную информацию",
      icon: <HelpCircle className="h-5 w-5 text-red-600" />,
      tips: [
        "Описывайте принципы без детальной технологии",
        "Указывайте результаты, а не способы достижения",
        "Консультируйтесь с юридическим отделом"
      ]
    }
  ];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="flex items-center gap-2">
          <BookOpen className="h-4 w-4" />
          Справочная система
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-primary" />
            Справочная система по УТК
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="guidelines" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="guidelines">Методические рекомендации</TabsTrigger>
            <TabsTrigger value="examples">Примеры записей</TabsTrigger>
            <TabsTrigger value="fields">Описание полей</TabsTrigger>
          </TabsList>

          <TabsContent value="guidelines" className="space-y-4">
            <div className="grid gap-4">
              {guidelines.map((guideline, index) => (
                <Card key={index}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      {guideline.icon}
                      {guideline.title}
                    </CardTitle>
                    <CardDescription>{guideline.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {guideline.tips.map((tip, tipIndex) => (
                        <li key={tipIndex} className="flex items-start gap-2 text-sm">
                          <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                          {tip}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="examples" className="space-y-4">
            <div className="space-y-6">
              {examples.map((example, index) => (
                <Card key={index} className={`${example.color} border-2`}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      {example.icon}
                      {example.title}
                    </CardTitle>
                    <Badge variant="secondary">{example.organization}</Badge>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid gap-3 text-sm">
                      <div>
                        <strong>Ключевой продукт:</strong>
                        <p className="mt-1">{example.keyProduct}</p>
                      </div>
                      <div>
                        <strong>Назначение:</strong>
                        <p className="mt-1">{example.purpose}</p>
                      </div>
                      <div>
                        <strong>Категории объектов:</strong>
                        <p className="mt-1">{example.categories}</p>
                      </div>
                      <div>
                        <strong>Принцип действия:</strong>
                        <p className="mt-1">{example.principle}</p>
                      </div>
                      <div>
                        <strong>Преимущества:</strong>
                        <p className="mt-1 font-medium text-green-700">{example.advantages}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="fields" className="space-y-4">
            <div className="grid gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>Описание полей записи УТК</CardTitle>
                  <CardDescription>
                    Подробное описание каждого поля для правильного заполнения
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {[
                    {
                      field: "Организация",
                      description: "Полное официальное наименование организации-разработчика",
                      example: "ООО 'Инновационные Оптические Системы'"
                    },
                    {
                      field: "Передовой продукт",
                      description: "Конкретный продукт/процесс с указанием превосходящих характеристик",
                      example: "Лазерный микроскоп МИМ-340 с разрешающей способностью менее 100нм"
                    },
                    {
                      field: "Назначение",
                      description: "Основная функция продукта и область применения",
                      example: "Прецизионная диагностика микро- и наноструктур в реальном времени"
                    },
                    {
                      field: "Категории объектов",
                      description: "Конкретные типы объектов для применения технологии",
                      example: "Полупроводниковые материалы, биологические образцы, наноматериалы"
                    },
                    {
                      field: "Принцип действия",
                      description: "Физические, химические или технические принципы работы",
                      example: "Конфокальная лазерная микроскопия с адаптивной оптикой"
                    },
                    {
                      field: "Преимущества",
                      description: "Конкретные количественные преимущества перед конкурентами",
                      example: "Разрешающая способность < 100нм, скорость в 10 раз выше аналогов"
                    },
                    {
                      field: "Владелец УТК",
                      description: "ФИО ответственного лица, должность, контактная информация",
                      example: "Иванов И.И., главный инженер, +7(495)123-45-67, ivanov@company.ru"
                    },
                    {
                      field: "Формулировка УТК",
                      description: "Краткая технически точная формулировка без рекламных слов",
                      example: "Технология высокоразрешающей лазерной микроскопии для анализа наноструктур"
                    }
                  ].map((field, index) => (
                    <div key={index} className="border-l-4 border-l-primary pl-4">
                      <h4 className="font-semibold text-sm">{field.field}</h4>
                      <p className="text-sm text-muted-foreground mb-2">{field.description}</p>
                      <p className="text-xs bg-muted/50 p-2 rounded italic">
                        Пример: {field.example}
                      </p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
