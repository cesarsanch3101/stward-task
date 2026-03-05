"use client";

import { useState, useRef } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, Trash2, Upload, Shield, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import * as api from "@/lib/api";
import { useCurrentUser } from "@/lib/hooks/use-auth";
import type { AllowedEmail, UserRole } from "@/lib/types";

const ROLE_LABELS: Record<UserRole, string> = {
  administrador: "Administrador",
  gestor: "Gestor",
  desarrollador: "Desarrollador",
  observador: "Observador",
};

const ROLE_COLORS: Record<UserRole, string> = {
  administrador: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  gestor: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  desarrollador: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  observador: "bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300",
};

export default function AdminUsersPage() {
  const { data: currentUser } = useCurrentUser();
  const queryClient = useQueryClient();

  const [emailInput, setEmailInput] = useState("");
  const [domainInput, setDomainInput] = useState("");
  const [roleInput, setRoleInput] = useState<UserRole>("desarrollador");
  const [mode, setMode] = useState<"email" | "domain">("email");
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const { data: entries = [], isLoading } = useQuery({
    queryKey: ["allowed-emails"],
    queryFn: api.getAllowedEmails,
    enabled: currentUser?.role === "administrador",
  });

  const createMutation = useMutation({
    mutationFn: api.createAllowedEmail,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["allowed-emails"] });
      setEmailInput("");
      setDomainInput("");
      toast.success("Entrada agregada correctamente");
    },
    onError: (err: Error) => {
      try {
        const parsed = JSON.parse(err.message.replace(/^API \d+: /, ""));
        toast.error(parsed.detail ?? "Error al agregar");
      } catch {
        toast.error("Error al agregar");
      }
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.deleteAllowedEmail(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["allowed-emails"] });
      setConfirmDeleteId(null);
      toast.success("Entrada eliminada");
    },
  });

  const bulkMutation = useMutation({
    mutationFn: api.bulkCreateAllowedEmails,
    onSuccess: (created) => {
      queryClient.invalidateQueries({ queryKey: ["allowed-emails"] });
      toast.success(`${created.length} entradas importadas`);
    },
    onError: () => toast.error("Error al importar CSV"),
  });

  function handleAdd() {
    const val = mode === "email" ? emailInput.trim() : domainInput.trim();
    if (!val) return;
    createMutation.mutate(
      mode === "email"
        ? { email: val, role: roleInput }
        : { domain: val, role: roleInput }
    );
  }

  function handleCSV(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const lines = (ev.target?.result as string)
        .split(/\r?\n/)
        .map((l) => l.trim())
        .filter(Boolean)
        .slice(1); // skip header
      const entries = lines.map((line) => {
        const [emailOrDomain, role] = line.split(",").map((s) => s.trim().replace(/"/g, ""));
        const isEmail = emailOrDomain.includes("@");
        return {
          email: isEmail ? emailOrDomain : undefined,
          domain: !isEmail ? emailOrDomain : undefined,
          role: (role as UserRole) ?? "desarrollador",
        };
      });
      bulkMutation.mutate(entries);
    };
    reader.readAsText(file);
    e.target.value = "";
  }

  if (currentUser?.role !== "administrador") {
    return (
      <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">
        Acceso restringido a administradores.
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-auto bg-slate-50/50 dark:bg-slate-950/50 p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Shield className="h-5 w-5 text-muted-foreground" />
        <div>
          <h1 className="text-lg font-bold">Control de Acceso</h1>
          <p className="text-sm text-muted-foreground">
            Define quién puede ingresar con Google y qué rol tendrá al registrarse.
          </p>
        </div>
      </div>

      {/* Formulario de alta */}
      <Card className="shadow-none border border-border/50">
        <CardHeader>
          <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
            Agregar acceso
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Toggle email / dominio */}
          <div className="flex gap-2">
            <Button
              variant={mode === "email" ? "default" : "outline"}
              size="sm"
              onClick={() => setMode("email")}
            >
              Correo específico
            </Button>
            <Button
              variant={mode === "domain" ? "default" : "outline"}
              size="sm"
              onClick={() => setMode("domain")}
            >
              <Globe className="h-3.5 w-3.5 mr-1.5" />
              Dominio completo
            </Button>
          </div>

          <div className="flex gap-3 flex-wrap">
            {mode === "email" ? (
              <div className="flex-1 min-w-[220px] space-y-1">
                <Label className="text-xs">Correo electrónico</Label>
                <Input
                  placeholder="usuario@stwards.com"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAdd()}
                />
              </div>
            ) : (
              <div className="flex-1 min-w-[220px] space-y-1">
                <Label className="text-xs">Dominio</Label>
                <Input
                  placeholder="stwards.com"
                  value={domainInput}
                  onChange={(e) => setDomainInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAdd()}
                />
              </div>
            )}

            <div className="space-y-1 min-w-[160px]">
              <Label className="text-xs">Rol asignado</Label>
              <select
                value={roleInput}
                onChange={(e) => setRoleInput(e.target.value as UserRole)}
                className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
              >
                {Object.entries(ROLE_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>

            <div className="flex items-end gap-2">
              <Button
                onClick={handleAdd}
                disabled={createMutation.isPending}
                size="sm"
                className="h-9"
              >
                <Plus className="h-3.5 w-3.5 mr-1.5" />
                Agregar
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-9"
                onClick={() => fileRef.current?.click()}
                disabled={bulkMutation.isPending}
              >
                <Upload className="h-3.5 w-3.5 mr-1.5" />
                CSV
              </Button>
              <input
                ref={fileRef}
                type="file"
                accept=".csv"
                className="hidden"
                onChange={handleCSV}
              />
            </div>
          </div>

          <p className="text-[11px] text-muted-foreground">
            CSV formato: <code>email_o_dominio,rol</code> (primera fila = encabezado, se ignora).
            Roles válidos: administrador, gestor, desarrollador, observador.
          </p>
        </CardContent>
      </Card>

      {/* Tabla */}
      <Card className="shadow-none border border-border/50">
        <CardHeader>
          <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
            Lista de acceso ({entries.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-10 bg-muted rounded animate-pulse" />
              ))}
            </div>
          ) : entries.length === 0 ? (
            <p className="p-6 text-sm text-muted-foreground text-center">
              No hay entradas. Agrega un correo o dominio para empezar.
            </p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/50 text-[11px] uppercase tracking-wider text-muted-foreground">
                  <th className="px-4 py-2 text-left">Correo / Dominio</th>
                  <th className="px-4 py-2 text-left">Tipo</th>
                  <th className="px-4 py-2 text-left">Rol</th>
                  <th className="px-4 py-2 text-left">Estado</th>
                  <th className="px-4 py-2" />
                </tr>
              </thead>
              <tbody>
                {entries.map((entry: AllowedEmail) => (
                  <tr
                    key={entry.id}
                    className="border-b border-border/40 last:border-0 hover:bg-muted/30 transition-colors"
                  >
                    <td className="px-4 py-2.5 font-mono text-xs">
                      {entry.email ?? `@${entry.domain}`}
                    </td>
                    <td className="px-4 py-2.5 text-xs text-muted-foreground">
                      {entry.email ? "Email" : "Dominio"}
                    </td>
                    <td className="px-4 py-2.5">
                      <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${ROLE_COLORS[entry.role]}`}>
                        {ROLE_LABELS[entry.role]}
                      </span>
                    </td>
                    <td className="px-4 py-2.5">
                      {entry.used_at ? (
                        <Badge variant="secondary" className="text-[10px] bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                          Activo
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="text-[10px]">
                          Pendiente
                        </Badge>
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      {confirmDeleteId === entry.id ? (
                        <span className="flex items-center justify-end gap-1">
                          <span className="text-xs text-muted-foreground mr-1">¿Eliminar?</span>
                          <button
                            onClick={() => deleteMutation.mutate(entry.id)}
                            className="text-red-500 hover:text-red-700 font-bold text-sm"
                            aria-label="Confirmar eliminación"
                          >✓</button>
                          <button
                            onClick={() => setConfirmDeleteId(null)}
                            className="text-muted-foreground hover:text-foreground font-bold text-sm ml-1"
                            aria-label="Cancelar"
                          >✕</button>
                        </span>
                      ) : (
                        <button
                          onClick={() => setConfirmDeleteId(entry.id)}
                          className="text-muted-foreground hover:text-red-500 transition-colors"
                          aria-label="Eliminar entrada"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
