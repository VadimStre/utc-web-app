
export interface UTCRecord {
  id?: number;
  organization: string;
  keyProduct: string;
  purpose: string;
  categories: string;
  principle: string;
  advantages: string;
  owner: string;
  formulation: string;
  createdAt?: Date;
  updatedAt?: Date;
  // Владелец записи в системе (пользователь). Не путать со строковым полем `owner` выше.
  ownerId?: string | null;
  ownerUser?: { id: string; email: string; name?: string | null } | null;
  // Признак, вычисленный на бэкенде: может ли текущий пользователь редактировать/удалять запись.
  canEdit?: boolean;
}

export interface UTCFormData {
  organization: string;
  keyProduct: string;
  purpose: string;
  categories: string;
  principle: string;
  advantages: string;
  owner: string;
  formulation: string;
}

export interface SearchFilters {
  query?: string;
  organization?: string;
  category?: string;
}

export const UTC_FIELD_LABELS = {
  organization: "1. Организация, ХК - полное наименование организации",
  keyProduct: "2. Передовой продукт организации, ключевой продукт/процесс",
  purpose: "3. Назначение (главная функция) Продукта и объект приложения",
  categories: "4. Категории объектов, в отношении которых может применяться функция",
  principle: "5. Принцип действия (используемый физический, химический процесс)",
  advantages: "6. ПРЕИМУЩЕСТВА, значения Ключевых (отличительных) характеристик",
  owner: "7. Владелец УТК (Организация, должность, контакты)",
  formulation: "8. Формулировка УТК"
} as const;

export const UTC_EXAMPLES = {
  organization: "ООО 'Инновационные Технологии'",
  keyProduct: "Лазерный микроскоп МИМ-340 с разрешающей способностью менее 100нм",
  purpose: "Прецизионная диагностика микро- и наноструктур в реальном времени",
  categories: "Полупроводниковые материалы, биологические образцы, наноматериалы",
  principle: "Конфокальная лазерная микроскопия с адаптивной оптикой",
  advantages: "Разрешающая способность < 100нм, скорость сканирования в 10 раз выше аналогов",
  owner: "Иванов И.И., главный инженер, +7(495)123-45-67, ivanov@company.ru",
  formulation: "Технология высокоразрешающей лазерной микроскопии для анализа наноструктур"
} as const;
