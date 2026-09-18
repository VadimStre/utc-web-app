
"use client"

import { useState } from 'react';
import { SearchFilters as SearchFiltersType } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Search, Filter, Download, X, FileJson, FileSpreadsheet } from 'lucide-react';

interface SearchFiltersProps {
  onSearch: (filters: SearchFiltersType) => void;
  onExport: (format: 'json' | 'csv') => void;
  isLoading?: boolean;
}

export function SearchFilters({ onSearch, onExport, isLoading = false }: SearchFiltersProps) {
  const [filters, setFilters] = useState<SearchFiltersType>({
    query: '',
    organization: '',
  });

  const [showFilters, setShowFilters] = useState(false);

  const handleSearch = () => {
    onSearch(filters);
  };

  const handleClear = () => {
    setFilters({ query: '', organization: '' });
    onSearch({ query: '', organization: '' });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const hasActiveFilters = filters.query || filters.organization;

  return (
    <div className="space-y-4">
      {/* Основная строка поиска */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Поиск по всем полям УТК..."
            value={filters.query}
            onChange={(e) => setFilters((prev) => ({ ...prev, query: e.target.value }))}
            onKeyPress={handleKeyPress}
            className="pl-10"
            disabled={isLoading}
          />
        </div>
        
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2"
          >
            <Filter className="h-4 w-4" />
            Фильтры
            {hasActiveFilters && (
              <span className="ml-1 px-1.5 py-0.5 bg-primary text-primary-foreground text-xs rounded-full">
                {Object.values(filters).filter(Boolean).length}
              </span>
            )}
          </Button>
          
          <Button onClick={handleSearch} disabled={isLoading}>
            <Search className="h-4 w-4 mr-2" />
            Поиск
          </Button>
          
          {hasActiveFilters && (
            <Button variant="ghost" onClick={handleClear}>
              <X className="h-4 w-4 mr-2" />
              Очистить
            </Button>
          )}
        </div>
      </div>

      {/* Дополнительные фильтры */}
      {showFilters && (
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Организация
                </label>
                <Input
                  placeholder="Фильтр по организации"
                  value={filters.organization}
                  onChange={(e) => setFilters((prev) => ({ ...prev, organization: e.target.value }))}
                  onKeyPress={handleKeyPress}
                />
              </div>
              
              {/* Экспорт */}
              <div className="sm:col-span-2 lg:col-span-1">
                <label className="text-sm font-medium mb-2 block">
                  Экспорт данных
                </label>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onExport('json')}
                    className="flex items-center gap-2"
                  >
                    <FileJson className="h-4 w-4" />
                    JSON
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onExport('csv')}
                    className="flex items-center gap-2"
                  >
                    <FileSpreadsheet className="h-4 w-4" />
                    CSV
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
