
"use client"

import { useState, useEffect } from 'react';
import { UTCFormData, UTC_FIELD_LABELS, UTC_EXAMPLES } from '@/lib/types';
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Save, X, HelpCircle, Lightbulb } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface UTCFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: UTCFormData) => void;
  initialData?: UTCFormData | null;
  isEditing?: boolean;
}

export function UTCForm({ open, onClose, onSubmit, initialData, isEditing = false }: UTCFormProps) {
  const [formData, setFormData] = useState<UTCFormData>({
    organization: '',
    keyProduct: '',
    purpose: '',
    categories: '',
    principle: '',
    advantages: '',
    owner: '',
    formulation: '',
  });

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
      });
    } else {
      // Сброс формы если initialData пустые (режим создания)
      setFormData({
        organization: '',
        keyProduct: '',
        purpose: '',
        categories: '',
        principle: '',
        advantages: '',
        owner: '',
        formulation: '',
      });
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

    Object.entries(formData).forEach(([field, value]) => {
      if (!value.trim()) {
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
    setFormData({
      organization: '',
      keyProduct: '',
      purpose: '',
      categories: '',
      principle: '',
      advantages: '',
      owner: '',
      formulation: '',
    });
    setErrors({});
    onClose();
  };

  const fillExample = (field: keyof UTCFormData) => {
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

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-primary" />
            {isEditing ? 'Редактирование записи УТК' : 'Создание новой записи УТК'}
          </DialogTitle>
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

          {Object.entries(UTC_FIELD_LABELS).map(([field, label]) => {
            const isTextArea = ['purpose', 'categories', 'principle', 'advantages', 'formulation'].includes(field);
            const fieldKey = field as keyof UTCFormData;
            
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
              {isEditing ? 'Сохранить изменения' : 'Создать запись'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
