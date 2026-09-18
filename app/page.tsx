
"use client"

import { useState, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import { UTCRecord, UTCFormData, UTCTreeNode, SearchFilters as SearchFiltersType } from '@/lib/types';
import { UTCTable } from '@/components/utc-table';
import { UTCTree } from '@/components/utc-tree';
import { UTCForm } from '@/components/utc-form';
import { UTCView } from '@/components/utc-view';
import { SearchFilters } from '@/components/search-filters';
import { Pagination } from '@/components/pagination';
import { HelpGuidance } from '@/components/help-guidance';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/hooks/use-toast';
import { 
  Plus, 
  Database, 
  TrendingUp, 
  Building, 
  RefreshCw,
  AlertCircle,
  LogIn,
  UserPlus,
  LogOut,
  Sparkles,
  Settings,
} from 'lucide-react';

interface PaginationData {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export default function HomePage() {
  const { data: session, status } = useSession();
  const isAuthenticated = status === 'authenticated';
  const isAdmin = session?.user?.role === 'ADMIN';

  const [records, setRecords] = useState<UTCRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Состояния форм и модалов
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<UTCRecord | null>(null);

  // Дерево УТК (Этап 2)
  const [viewMode, setViewMode] = useState<'table' | 'tree'>('table');
  const [treeData, setTreeData] = useState<UTCTreeNode[]>([]);
  const [isTreeLoading, setIsTreeLoading] = useState(false);
  const [treeError, setTreeError] = useState<string | null>(null);
  const [showAddChildForm, setShowAddChildForm] = useState(false);
  const [addChildParent, setAddChildParent] = useState<UTCTreeNode | null>(null);

  
  // Состояния поиска и пагинации
  const [searchFilters, setSearchFilters] = useState<SearchFiltersType>({});
  const [pagination, setPagination] = useState<PaginationData>({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0,
  });

  // Загрузка записей
  const fetchRecords = async (filters: SearchFiltersType = {}, page: number = 1) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: pagination.limit.toString(),
        ...(filters.query && { query: filters.query }),
        ...(filters.organization && { organization: filters.organization }),
      });

      const response = await fetch(`/api/utc?${params}`);
      
      if (!response.ok) {
        throw new Error('Ошибка загрузки записей УТК');
      }

      const data = await response.json();
      setRecords(data.records || []);
      setPagination(data.pagination || { page: 1, limit: 10, total: 0, pages: 0 });
    } catch (error) {
      console.error('Ошибка загрузки записей:', error);
      setError('Не удалось загрузить записи УТК');
      toast({
        title: "Ошибка",
        description: "Не удалось загрузить записи УТК",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Создание новой записи
  const handleCreate = async (formData: UTCFormData) => {
    try {
      const response = await fetch('/api/utc', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Ошибка создания записи');
      }

      toast({
        title: "Успех",
        description: "Запись УТК успешно создана",
      });

      fetchRecords(searchFilters, pagination.page);
      setShowCreateForm(false);
    } catch (error) {
      console.error('Ошибка создания записи:', error);
      toast({
        title: "Ошибка",
        description: error instanceof Error ? error.message : "Не удалось создать запись",
        variant: "destructive",
      });
    }
  };

  // Обновление записи
  const handleEdit = async (formData: UTCFormData) => {
    if (!selectedRecord?.id) return;

    try {
      const response = await fetch(`/api/utc/${selectedRecord.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Ошибка обновления записи');
      }

      toast({
        title: "Успех",
        description: "Запись УТК успешно обновлена",
      });

      fetchRecords(searchFilters, pagination.page);
      setShowEditForm(false);
      setSelectedRecord(null);
    } catch (error) {
      console.error('Ошибка обновления записи:', error);
      toast({
        title: "Ошибка",
        description: error instanceof Error ? error.message : "Не удалось обновить запись",
        variant: "destructive",
      });
    }
  };

  // Удаление записи
  const handleDelete = async (id: number) => {
    if (!confirm('Вы уверены, что хотите удалить эту запись УТК?')) return;

    try {
      const response = await fetch(`/api/utc/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Ошибка удаления записи');
      }

      toast({
        title: "Успех",
        description: "Запись УТК успешно удалена",
      });

      fetchRecords(searchFilters, pagination.page);
    } catch (error) {
      console.error('Ошибка удаления записи:', error);
      toast({
        title: "Ошибка",
        description: error instanceof Error ? error.message : "Не удалось удалить запись",
        variant: "destructive",
      });
    }
  };

  // Поиск записей
  const handleSearch = (filters: SearchFiltersType) => {
    setSearchFilters(filters);
    fetchRecords(filters, 1);
  };

  // Экспорт данных
  const handleExport = async (format: 'json' | 'csv') => {
    try {
      const params = new URLSearchParams({
        format,
        ...(searchFilters.query && { query: searchFilters.query }),
        ...(searchFilters.organization && { organization: searchFilters.organization }),
      });

      const response = await fetch(`/api/utc/export?${params}`);
      
      if (!response.ok) {
        throw new Error('Ошибка экспорта данных');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `utc_records.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);

      toast({
        title: "Успех",
        description: `Данные экспортированы в формате ${format.toUpperCase()}`,
      });
    } catch (error) {
      console.error('Ошибка экспорта:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось экспортировать данные",
        variant: "destructive",
      });
    }
  };

  // Смена страницы
  const handlePageChange = (page: number) => {
    fetchRecords(searchFilters, page);
  };

  // Загрузка дерева УТК (Этап 2)
  const fetchTree = async () => {
    setIsTreeLoading(true);
    setTreeError(null);
    try {
      const response = await fetch('/api/utc/tree');
      if (!response.ok) {
        throw new Error('Ошибка загрузки дерева УТК');
      }
      const data = await response.json();
      setTreeData(data.tree || []);
    } catch (error) {
      console.error('Ошибка загрузки дерева:', error);
      setTreeError('Не удалось загрузить дерево УТК');
    } finally {
      setIsTreeLoading(false);
    }
  };

  const handleAddChild = async (formData: UTCFormData) => {
    if (!addChildParent?.id) return;
    try {
      const response = await fetch(`/api/utc/${addChildParent.id}/add-child`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Ошибка добавления узла');
      }

      toast({
        title: "Успех",
        description: "Дочерний узел успешно добавлен",
      });

      setShowAddChildForm(false);
      setAddChildParent(null);
      fetchTree();
      fetchRecords(searchFilters, pagination.page);
    } catch (error) {
      console.error('Ошибка добавления узла:', error);
      toast({
        title: "Ошибка",
        description: error instanceof Error ? error.message : "Не удалось добавить узел",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    if (viewMode === 'tree') {
      fetchTree();
    }
  }, [viewMode]);

  // Загрузка данных при монтировании
  useEffect(() => {
    fetchRecords();
  }, []);

  const uniqueOrganizations = Array.from(new Set(records.map(r => r.organization))).length;

  return (
    <div className="min-h-screen bg-background">
      {/* Заголовок */}
      <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border-b">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">
                База данных УТК
              </h1>
              <p className="text-muted-foreground">
                Система управления уникальными технологическими компетенциями
              </p>
            </div>
            <div className="flex items-center gap-3">
              <HelpGuidance />
              {isAuthenticated ? (
                <>
                  <div className="hidden md:flex flex-col items-end mr-2">
                    <span className="text-sm font-medium">{session?.user?.email}</span>
                    <Badge variant={isAdmin ? 'default' : 'secondary'} className="mt-1">
                      {isAdmin ? 'Администратор' : 'Пользователь'}
                    </Badge>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => signOut({ callbackUrl: '/' })}
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Выйти
                  </Button>
                  <Button onClick={() => setShowCreateForm(true)} className="bg-primary hover:bg-primary/90">
                    <Plus className="h-4 w-4 mr-2" />
                    Создать УТК
                  </Button>
                  <Button variant="outline" asChild>
                    <Link href="/wizard">
                      <Sparkles className="h-4 w-4 mr-2" />
                      Создать УТК с помощью AI-мастера
                    </Link>
                  </Button>
                  {isAdmin && (
                    <Button variant="outline" asChild>
                      <Link href="/admin/settings">
                        <Settings className="h-4 w-4 mr-2" />
                        Настройки LLM
                      </Link>
                    </Button>
                  )}
                </>
              ) : (
                <>
                  <Button variant="outline" asChild>
                    <Link href="/login">
                      <LogIn className="h-4 w-4 mr-2" />
                      Войти
                    </Link>
                  </Button>
                  <Button asChild>
                    <Link href="/register">
                      <UserPlus className="h-4 w-4 mr-2" />
                      Зарегистрироваться
                    </Link>
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Статистика */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Всего записей УТК
              </CardTitle>
              <Database className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{pagination.total}</div>
              <p className="text-xs text-muted-foreground">
                {pagination.total > 0 ? 'записей в базе данных' : 'база данных пуста'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Организации
              </CardTitle>
              <Building className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{uniqueOrganizations}</div>
              <p className="text-xs text-muted-foreground">
                уникальных организаций
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Текущая страница
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {pagination.page} / {pagination.pages || 1}
              </div>
              <p className="text-xs text-muted-foreground">
                страниц всего
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Поиск и фильтры */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">Поиск и фильтрация</CardTitle>
            <CardDescription>
              Найдите нужные записи УТК или экспортируйте данные
            </CardDescription>
          </CardHeader>
          <CardContent>
            <SearchFilters
              onSearch={handleSearch}
              onExport={handleExport}
              isLoading={isLoading}
            />
          </CardContent>
        </Card>

        {/* Ошибка */}
        {error && (
          <Card className="mb-6 border-destructive">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-destructive">
                <AlertCircle className="h-5 w-5" />
                <span>{error}</span>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => fetchRecords(searchFilters, pagination.page)}
                  className="ml-auto"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Повторить
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Таблица / дерево записей */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">Записи УТК</CardTitle>
                <CardDescription>
                  {viewMode === 'table'
                    ? (isLoading ? 'Загрузка...' : `Найдено ${pagination.total} записей`)
                    : (isTreeLoading ? 'Загрузка...' : 'Иерархия декомпозиции УТК')}
                </CardDescription>
              </div>
              {viewMode === 'table' && records.length > 0 && (
                <Badge variant="outline">
                  {records.length} из {pagination.total}
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as 'table' | 'tree')}>
              <TabsList className="mb-4">
                <TabsTrigger value="table">Таблица</TabsTrigger>
                <TabsTrigger value="tree">Дерево</TabsTrigger>
              </TabsList>

              <TabsContent value="table">
                {isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <RefreshCw className="h-6 w-6 animate-spin mr-2" />
                    Загрузка записей...
                  </div>
                ) : (
                  <>
                    <UTCTable
                      records={records}
                      onEdit={(record) => {
                        setSelectedRecord(record);
                        setShowEditForm(true);
                      }}
                      onDelete={handleDelete}
                      onView={(record) => {
                        setSelectedRecord(record);
                        setShowViewModal(true);
                      }}
                    />

                    {pagination.pages > 1 && (
                      <div className="mt-4">
                        <Pagination
                          currentPage={pagination.page}
                          totalPages={pagination.pages}
                          totalItems={pagination.total}
                          itemsPerPage={pagination.limit}
                          onPageChange={handlePageChange}
                        />
                      </div>
                    )}
                  </>
                )}
              </TabsContent>

              <TabsContent value="tree">
                {isTreeLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <RefreshCw className="h-6 w-6 animate-spin mr-2" />
                    Загрузка дерева...
                  </div>
                ) : treeError ? (
                  <div className="flex items-center gap-2 text-destructive py-4">
                    <AlertCircle className="h-5 w-5" />
                    <span>{treeError}</span>
                    <Button variant="outline" size="sm" onClick={fetchTree} className="ml-auto">
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Повторить
                    </Button>
                  </div>
                ) : (
                  <UTCTree
                    nodes={treeData}
                    onView={(node) => {
                      setSelectedRecord(node);
                      setShowViewModal(true);
                    }}
                    onEdit={(node) => {
                      setSelectedRecord(node);
                      setShowEditForm(true);
                    }}
                    onAddChild={(parent) => {
                      setAddChildParent(parent);
                      setShowAddChildForm(true);
                    }}
                  />
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Модальные окна */}
        <UTCForm
          open={showCreateForm}
          onClose={() => setShowCreateForm(false)}
          onSubmit={handleCreate}
          isEditing={false}
        />

        <UTCForm
          open={showEditForm}
          onClose={() => {
            setShowEditForm(false);
            setSelectedRecord(null);
          }}
          onSubmit={handleEdit}
          initialData={selectedRecord ? {
            organization: selectedRecord.organization,
            keyProduct: selectedRecord.keyProduct,
            purpose: selectedRecord.purpose,
            categories: selectedRecord.categories,
            principle: selectedRecord.principle,
            advantages: selectedRecord.advantages,
            owner: selectedRecord.owner,
            formulation: selectedRecord.formulation,
            nodeType: selectedRecord.nodeType,
            decompositionCharacteristic: selectedRecord.decompositionCharacteristic || '',
          } : null}
          isEditing={true}
        />

        <UTCForm
          open={showAddChildForm}
          onClose={() => {
            setShowAddChildForm(false);
            setAddChildParent(null);
          }}
          onSubmit={handleAddChild}
          isChildMode={true}
          parentLabel={addChildParent ? (addChildParent.keyProduct || addChildParent.formulation) : undefined}
        />

        <UTCView
          open={showViewModal}
          onClose={() => {
            setShowViewModal(false);
            setSelectedRecord(null);
          }}
          record={selectedRecord}
          onRecordUpdated={(updated) => {
            setSelectedRecord(updated);
            fetchRecords(searchFilters, pagination.page);
          }}
        />
      </div>
    </div>
  );
}
