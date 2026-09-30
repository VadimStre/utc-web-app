"use client";

import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronRight, Users, Loader2 } from "lucide-react";
import { AdminUserDTO, USER_ROLE_LABELS } from "@/lib/types";

interface AdminUsersTableProps {
  users: AdminUserDTO[];
  loading: boolean;
  error?: string | null;
  onRetry?: () => void;
}

function formatDate(value: string) {
  if (!value) return "—";
  return new Date(value).toLocaleString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function truncate(text: string, max = 120) {
  if (!text) return "—";
  return text.length > max ? `${text.slice(0, max)}…` : text;
}

export function AdminUsersTable({ users, loading, error, onRetry }: AdminUsersTableProps) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const toggle = (userId: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) next.delete(userId);
      else next.add(userId);
      return next;
    });
  };

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          {loading ? "Загрузка пользователей…" : `Всего пользователей: ${users.length}`}
        </div>
        {error && (
          <div className="flex items-center gap-3">
            <span className="text-sm text-destructive">{error}</span>
            {onRetry && (
              <Button variant="outline" size="sm" onClick={onRetry}>
                Повторить
              </Button>
            )}
          </div>
        )}
      </div>

      <div className="border rounded-lg overflow-hidden shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="w-[40px]" />
              <TableHead className="min-w-[160px]">Пользователь</TableHead>
              <TableHead className="min-w-[200px]">Email</TableHead>
              <TableHead className="w-[150px]">Роль</TableHead>
              <TableHead className="w-[100px]">УТК (кол-во)</TableHead>
              <TableHead className="w-[140px]">Действия</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-10">
                  <Loader2 className="h-5 w-5 animate-spin inline-block" />
                  <span className="ml-2 text-muted-foreground">Загрузка…</span>
                </TableCell>
              </TableRow>
            ) : users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                  <Users className="h-5 w-5 mx-auto mb-2 opacity-50" />
                  Пользователи не найдены
                </TableCell>
              </TableRow>
            ) : (
              users.map((user) => {
                const isOpen = expanded.has(user.id);
                return (
                  <TableRow key={user.id} className="hover:bg-muted/30 transition-colors">
                    <TableCell className="align-top">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => toggle(user.id)}
                        disabled={user.records.length === 0}
                        title={user.records.length === 0 ? "Нет УТК" : isOpen ? "Свернуть" : "Развернуть"}
                      >
                        {isOpen ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                      </Button>
                    </TableCell>
                    <TableCell className="font-medium">
                      {user.name || "—"}
                    </TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <Badge variant={user.role === "ADMIN" ? "default" : "secondary"}>
                        {USER_ROLE_LABELS[user.role] ?? user.role}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{user.records.length}</Badge>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggle(user.id)}
                        disabled={user.records.length === 0}
                      >
                        {isOpen ? "Свернуть" : "Показать УТК"}
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {users.map(
        (user) =>
          expanded.has(user.id) && (
            <div key={`records-${user.id}`} className="mt-2 rounded-lg border bg-muted/30 p-4">
              <div className="mb-2 text-sm font-medium">
                УТК пользователя {user.name || user.email}
                <span className="ml-2 text-muted-foreground font-normal">
                  ({user.records.length})
                </span>
              </div>
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="w-[80px]">ID</TableHead>
                    <TableHead className="min-w-[200px]">Ключевой продукт</TableHead>
                    <TableHead className="min-w-[250px]">Формулировка</TableHead>
                    <TableHead className="w-[140px]">Дата</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {user.records.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-6 text-muted-foreground">
                        У пользователя нет УТК
                      </TableCell>
                    </TableRow>
                  ) : (
                    user.records.map((record) => (
                      <TableRow key={record.id}>
                        <TableCell>
                          <Badge variant="outline">{record.id}</Badge>
                        </TableCell>
                        <TableCell>{truncate(record.keyProduct)}</TableCell>
                        <TableCell>{truncate(record.formulation)}</TableCell>
                        <TableCell className="whitespace-nowrap text-muted-foreground">
                          {formatDate(record.createdAt)}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )
      )}
    </div>
  );
}
