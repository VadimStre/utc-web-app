
export type UtcNodeType = "PRODUCT" | "ELEMENT" | "PROCESS";

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

  // Иерархия декомпозиции УТК (Этап 2)
  nodeType?: UtcNodeType;
  parentId?: number | null;
  decompositionCharacteristic?: string | null;
  children?: UTCRecord[];
}

// Узел дерева УТК: та же запись, но children гарантированно являются деревом.
export type UTCTreeNode = UTCRecord & { children: UTCTreeNode[] };

export interface UTCFormData {
  organization: string;
  keyProduct: string;
  purpose: string;
  categories: string;
  principle: string;
  advantages: string;
  owner: string;
  formulation: string;
  // Поля декомпозиции (используются только при добавлении дочернего узла)
  nodeType?: UtcNodeType;
  decompositionCharacteristic?: string;
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

export const UTC_NODE_TYPE_LABELS: Record<UtcNodeType, string> = {
  PRODUCT: "Продукт",
  ELEMENT: "Ключевой элемент",
  PROCESS: "Ключевой процесс",
};

// ===== AI-мастер ввода УТК (Этап 3) =====

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface ExtractedUtcData {
  organization: string;
  keyProduct: string;
  purpose: string;
  categories: string;
  principle: string;
  advantages: string;
  owner: string;
  formulation: string;
  customerProblem: string;
  targetIndustry: string;
}

export interface WizardSession {
  id: string;
  userId: string;
  createdAt: number;
  messages: ChatMessage[];
  extractedData: Partial<ExtractedUtcData>;
  // Номер текущего вопроса (0-based индекс в lib/wizard-prompts.ts -> questions)
  currentStep: number;
  isComplete: boolean;
}

// ===== Поиск конкурентов-аналогов (Этап 4) =====

export interface CompetitorCharacteristic {
  name: string;
  value: string;
}

export interface CompetitorInfo {
  companyName: string;
  product: string;
  characteristics: CompetitorCharacteristic[];
  sourceUrl: string;
  confidence: 'high' | 'medium' | 'low';
}

export interface SerperOrganicResultDTO {
  title: string;
  link: string;
  snippet: string;
  position: number;
}

export interface CompetitorSearchResult {
  searchQuery: string;
  rawResults: SerperOrganicResultDTO[];
  competitors: CompetitorInfo[];
  note?: string;
}

// ===== Поиск альтернативных областей применения / новых рынков (Этап 5) =====

export type FeasibilityLevel = 'low' | 'medium' | 'high';

export interface AltApplicationVariant {
  description: string;
  type: 'alternative_object' | 'new_function_object';
  parentFunction?: string;
  scores: {
    feasibility: FeasibilityLevel;
    technicalFeasibility: FeasibilityLevel;
    economicFeasibility: FeasibilityLevel;
  };
  totalScore: number;
  recommended: boolean;
}

export interface AltApplicationsNewFunction {
  function: string;
  objects: string[];
}

export interface AltApplicationsResult {
  alternativeObjects: string[];
  newFunctions: AltApplicationsNewFunction[];
  allVariantsRanked: AltApplicationVariant[];
}

export const EXTRACTED_FIELD_LABELS: Record<keyof ExtractedUtcData, string> = {
  organization: "1. Организация, ХК",
  keyProduct: "2. Передовой продукт",
  purpose: "3. Назначение (функция) и объект приложения",
  categories: "4. Категории объектов",
  principle: "5. Принцип действия",
  advantages: "6. Преимущества (ключевые характеристики)",
  owner: "7. Владелец УТК",
  formulation: "8. Формулировка УТК",
  customerProblem: "9. Главная проблема (потребность) Покупателя",
  targetIndustry: "10. Целевая отрасль",
};
