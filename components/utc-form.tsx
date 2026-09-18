
"use client"

import { useState, useEffect } from 'react';
import { UTCFormData, UTC_FIELD_LABELS, UTC_EXAMPLES, UtcNodeType } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Save, X, HelpCircle, Lightbulb } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

const EMPTY_FORM: UTCFormData = {
  organization: '',
  keyProduct: '',
  purpose: '',
  categories: '',
  principle: '',
  advantages: '',
  owner: '',
  formulation: '',
  nodeType: 'ELEMENT',
  decompositionCharacteristic: '',
};

interface UTCFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: UTCFormData) => void;
  initialData?: UTCFormData | null;
  isEditing?: boolean;
  // Режим добавления дочернего узла декомпозиции (Этап 2): показывает
  // дополнительные поля nodeType и decompositionCharacteristic.
  isChildMode?: boolean;
  parentLabel?: string;
}

export function UTCForm({
  open,
  onClose,
  onSubmit,
  initialData,
  isEditing = false,
  isChildMode = false,
  parentLabel,
}: UTCFormProps) {
  const [formData, setFormData] = useState<UTCFormData>({ ...EMPTY_FORM });

  const [showGuidance, setShowGuidance] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Обновление формы при изменении initialData
  useEffect(() => {
    if (initialData) {
      setFormData({
        organization: initialData.organization || '',
        keyProduct: initialData.keyProduct || '',
        purpose: initialData.purpose || '',
        categories: initialData.categories || '',
        principle: initialData.principle || '',
        advantages: initialData.advantages || '',
        owner: initialData.owner || '',
        formulation: initialData.formulation || '',
        nodeType: initialData.nodeType || 'ELEMENT',
        decompositionCharacteristic: initialData.decompositionCharacteristic || '',
      });
    } else {
      // Сброс формы если initialData пустые (режим создания)
      setFormData({ ...EMPTY_FORM });
    }
    // Сброс ошибок при смене режима
    setErrors({});
  }, [initialData, open]);

  const handleChange = (field: keyof UTCFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    (Object.keys(UTC_FIELD_LABELS) as (keyof typeof UTC_FIELD_LABELS)[]).forEach((field) => {
      const value = formData[field];
      if (!value || !value.trim()) {
        newErrors[field] = 'Это поле обязательно для заполнения';
      }
    });

    // Дополнительные проверки
    if (formData.organization.trim() && formData.organization.length < 3) {
      newErrors.organization = 'Наименование организации должно содержать не менее 3 символов';
    }

    if (formData.keyProduct.trim() && formData.keyProduct.length < 10) {
      newErrors.keyProduct = 'Описание продукта должно содержать не менее 10 символов';
    }

    if (formData.owner.trim() && !formData.owner.includes('@') && !formData.owner.includes('+')) {
      toast({
        title: "⚠️ Рекомендация",
        description: "Рекомендуется включить контактную информацию (email или телефон) в поле 'Владелец УТК'",
        variant: "default",
      });
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      onSubmit(formData);
      handleClose();
    }
  };

  const handleClose = () => {
    setFormData({ ...EMPTY_FORM });
    setErrors({});
    onClose();
  };

  const fillExample = (field: keyof typeof UTC_EXAMPLES) => {
    const example = UTC_EXAMPLES[field];
    handleChange(field, example);
  };

  const guidance = {
    organization: "Укажите полное официальное наименование организации-разработчика технологии",
    keyProduct: "Опишите конкретный продукт/процесс, превосходящий мировые аналоги. Избегайте общих формулировок",
    purpose: "Четко сформулируйте основную функцию продукта и область его применения",
    categories: "Перечислите конкретные типы объектов, к которым применяется технология",
    principle: "Опишите физические, химические или технические принципы работы",
    advantages: "Укажите конкретные количественные преимущества перед конкурентами",
    owner: "ФИО ответственного лица, должность, контактная информация",
    formulation: "Краткая технически точная формулировка УТК без рекламных слов",
  };

  const titleText = isChildMode
    ? 'Добавление ключевого элемента/процесса'
    : isEditing
      ? 'Редактирование записи УТК'
      : 'Создание новой записи УТК';

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-primary" />
            {titleText}
          </DialogTitle>
          {isChildMode && parentLabel && (
            <p className="text-sm text-muted-foreground">
              Родительский узел: <span className="font-medium">{parentLabel}</span>
            </p>
          )}
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowGuidance(!showGuidance)}
              className="flex items-center gap-2"
            >
              <HelpCircle className="h-4 w-4" />
              {showGuidance ? 'Скрыть' : 'Показать'} методические рекомендации
            </Button>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {showGuidance && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Методические рекомендации</CardTitle>
                <CardDescription>
                  УТК должны обладать глобальным превосходством, иметь уровень готовности технологии 6 и выше,
                  содержать четкие формулировки без рекламных слов и сравнение с мировыми лидерами-конкурентами.
                </CardDescription>
              </CardHeader>
            </Card>
          )}

          {isChildMode && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border rounded-lg p-4 bg-muted/20">
              <div className="space-y-2">
                <Label htmlFor="nodeType" className="text-sm font-medium">
                  Тип узла декомпозиции
                </Label>
                <Select
                  value={formData.nodeType || 'ELEMENT'}
                  onValueChange={(value) => handleChange('nodeType', value as UtcNodeType)}
                >
                  <SelectTrigger id="nodeType">
                    <SelectValue placeholder="Выберите тип" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ELEMENT">Ключевой элемент</SelectItem>
                    <SelectItem value="PROCESS">Ключевой процесс</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="decompositionCharacteristic" className="text-sm font-medium">
                  За счёт какого ключевого элемента/процесса достигнута характеристика?
                </Label>
                <Input
                  id="decompositionCharacteristic"
                  value={formData.decompositionCharacteristic || ''}
                  onChange={(e) => handleChange('decompositionCharacteristic', e.target.value)}
                  placeholder="Например: за счёт адаптивной оптической системы"
                />
              </div>
            </div>
          )}

          {Object.entries(UTC_FIELD_LABELS).map(([field, label]) => {
            const isTextArea = ['purpose', 'categories', 'principle', 'advantages', 'formulation'].includes(field);
            const fieldKey = field as keyof typeof UTC_FIELD_LABELS;
            
            return (
              <div key={field} className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor={field} className="text-sm font-medium">
                    {label}
                  </Label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => fillExample(fieldKey)}
                    className="text-xs text-muted-foreground hover:text-primary"
                  >
                    Пример
                  </Button>
                </div>
                
                {showGuidance && (
                  <p className="text-xs text-muted-foreground bg-muted/30 p-2 rounded">
                    {guidance[fieldKey]}
                  </p>
                )}

                {isTextArea ? (
                  <Textarea
                    id={field}
                    value={formData[fieldKey]}
                    onChange={(e) => handleChange(fieldKey, e.target.value)}
                    placeholder={`Введите ${label.toLowerCase()}`}
                    rows={3}
                    className={errors[field] ? 'border-destructive' : ''}
                  />
                ) : (
                  <Input
                    id={field}
                    value={formData[fieldKey]}
                    onChange={(e) => handleChange(fieldKey, e.target.value)}
                    placeholder={`Введите ${label.toLowerCase()}`}
                    className={errors[field] ? 'border-destructive' : ''}
                  />
                )}
                
                {errors[field] && (
                  <p className="text-xs text-destructive">{errors[field]}</p>
                )}
              </div>
            );
          })}

          <DialogFooter className="flex justify-between">
            <Button type="button" variant="outline" onClick={handleClose}>
              <X className="h-4 w-4 mr-2" />
              Отмена
            </Button>
            <Button type="submit" className="bg-primary hover:bg-primary/90">
              <Save className="h-4 w-4 mr-2" />
              {isChildMode ? 'Добавить узел' : isEditing ? 'Сохранить изменения' : 'Создать запись'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
