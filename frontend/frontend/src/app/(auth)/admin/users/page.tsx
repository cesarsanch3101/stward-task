"use client";

import { useState, useRef } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, Trash2, Upload, Shield, Globe, Pencil, Check, X, Lock, UserCheck, UserX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import * as api from "@/lib/api";
import { useCurrentUser } from "@/lib/hooks/use-auth";
import type { AdminUser, AllowedEmail, UserRole } from "@/lib/types";

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

  // ── Allowlist state ──
  const [emailInput, setEmailInput] = useState("");
  const [domainInput, setDomainInput] = useState("");
  const [nameInput, setNameInput] = useState("");
  const [roleInput, setRoleInput] = useState<UserRole>("desarrollador");
  const [mode, setMode] = useState<"email" | "domain">("email");
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [editRole, setEditRole] = useState<UserRole>("desarrollador");
  const fileRef = useRef<HTMLInputElement>(null);

  // ── User management state ──
  const [confirmDeactivateId, setConfirmDeactivateId] = useState<string | null>(null);
  const [passwordModal, setPasswordModal] = useState<{ userId: string; userName: string } | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // ── Allowlist queries ──
  const { data: entries = [], isLoading } = useQuery({
    queryKey: ["allowed-emails"],
    queryFn: api.getAllowedEmails,
    enabled: currentUser?.role === "administrador",
  });

  // ── Admin users query ──
  const { data: adminUsers = [], isLoading: isLoadingUsers } = useQuery({
    queryKey: ["admin-users"],
    queryFn: api.getAdminUsers,
    enabled: currentUser?.role === "administrador",
  });

  // ── Allowlist mutations ──
  const createMutation = useMutation({
    mutationFn: api.createAllowedEmail,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["allowed-emails"] });
      setEmailInput("");
      setDomainInput("");
      setNameInput("");
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

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: { role: string; name?: string } }) =>
      api.updateAllowedEmail(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["allowed-emails"] });
      setEditingId(null);
      toast.success("Entrada actualizada");
    },
    onError: () => toast.error("Error al actualizar"),
  });

  const bulkMutation = useMutation({
    mutationFn: api.bulkCreateAllowedEmails,
    onSuccess: (created) => {
      queryClient.invalidateQueries({ queryKey: ["allowed-emails"] });
      toast.success(`${created.length} entradas importadas`);
    },
    onError: (err: Error) => {
      try {
        const parsed = JSON.parse(err.message.replace(/^API \d+: /, ""));
        toast.error(parsed.detail ?? "Error al importar CSV");
      } catch {
        toast.error(err.message || "Error al importar CSV");
      }
    },
  });

  // ── User management mutations ──
  const activateMutation = useMutation({
    mutationFn: (userId: string) => api.activateUser(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      toast.success("Usuario desbloqueado");
    },
    onError: () => toast.error("Error al desbloquear usuario"),
  });

  const deactivateMutation = useMutation({
    mutationFn: (userId: string) => api.deactivateUser(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      setConfirmDeactivateId(null);
      toast.success("Usuario bloqueado");
    },
    onError: (err: Error) => {
      try {
        const parsed = JSON.parse(err.message.replace(/^API \d+: /, ""));
        toast.error(parsed.detail ?? "Error al bloquear usuario");
      } catch {
        toast.error("Error al bloquear usuario");
      }
    },
  });

  const setPasswordMutation = useMutation({
    mutationFn: ({ userId, password }: { userId: string; password: string }) =>
      api.setUserPassword(userId, password),
    onSuccess: () => {
      setPasswordModal(null);
      setNewPassword("");
      setConfirmPassword("");
      toast.success("Contraseña establecida correctamente");
    },
    onError: () => toast.error("Error al establecer contraseña"),
  });

  // ── Allowlist handlers ──
  function startEdit(entry: AllowedEmail) {
    setEditingId(entry.id);
    setEditName(entry.name ?? "");
    setEditRole(entry.role as UserRole);
    setConfirmDeleteId(null);
  }

  function handleAdd() {
    const val = mode === "email" ? emailInput.trim() : domainInput.trim();
    if (!val) return;
    createMutation.mutate(
      mode === "email"
        ? { email: val, role: roleInput, name: nameInput.trim() || undefined }
        : { domain: val, role: roleInput, name: nameInput.trim() || undefined }
    );
  }

  const VALID_ROLES = ["administrador", "gestor", "desarrollador", "observador"];

  function handleCSV(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const raw = (ev.target?.result as string).replace(/^\uFEFF/, "");
      const lines = raw
        .split(/\r?\n/)
        .map((l) => l.trim())
        .filter(Boolean)
        .slice(1);

      if (lines.length === 0) {
        toast.error("El CSV está vacío o solo tiene encabezado");
        return;
      }

      const delimiter = lines[0].includes(";") ? ";" : ",";

      const entries = lines.map((line) => {
        const [emailOrDomain, role, name] = line.split(delimiter).map((s) => s.trim().replace(/"/g, ""));
        const isEmail = emailOrDomain.includes("@");
        const resolvedRole = role && VALID_ROLES.includes(role.toLowerCase())
          ? role.toLowerCase()
          : "desarrollador";
        return {
          email: isEmail ? emailOrDomain : undefined,
          domain: !isEmail ? emailOrDomain : undefined,
          role: resolvedRole as UserRole,
          name: name || undefined,
        };
      });
      bulkMutation.mutate(entries);
    };
    reader.readAsText(file);
    e.target.value = "";
  }

  // ── Password modal handler ──
  function handleSetPassword() {
    if (!passwordModal) return;
    if (newPassword.length < 8) {
      toast.error("La contraseña debe tener al menos 8 caracteres");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Las contraseñas no coinciden");
      return;
    }
    setPasswordMutation.mutate({ userId: passwordModal.userId, password: newPassword });
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
            Gestiona quién puede acceder y administra las cuentas de usuario.
          </p>
        </div>
      </div>

      <Tabs defaultValue="allowlist">
        <TabsList className="mb-4">
          <TabsTrigger value="allowlist">Lista de Acceso</TabsTrigger>
          <TabsTrigger value="users">Usuarios ({adminUsers.length})</TabsTrigger>
        </TabsList>

        {/* ── TAB: Lista de Acceso ── */}
        <TabsContent value="allowlist" className="space-y-6 mt-0">
          {/* Formulario de alta */}
          <Card className="shadow-none border border-border/50">
            <CardHeader>
              <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
                Agregar acceso
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
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

                <div className="flex-1 min-w-[180px] space-y-1">
                  <Label className="text-xs">Nombre (opcional)</Label>
                  <Input
                    placeholder="Ej: Juan Pérez"
                    value={nameInput}
                    onChange={(e) => setNameInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleAdd()}
                  />
                </div>

                <div className="space-y-1 min-w-[160px]">
                  <Label className="text-xs">Rol asignado</Label>
                  <select
                    value={roleInput}
                    onChange={(e) => setRoleInput(e.target.value as UserRole)}
                    aria-label="Rol asignado"
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
                    aria-label="Importar CSV"
                    className="hidden"
                    onChange={handleCSV}
                  />
                </div>
              </div>

              <p className="text-[11px] text-muted-foreground">
                CSV formato: <code>email_o_dominio,rol,nombre</code> (primera fila = encabezado, se ignora).
                La columna <code>nombre</code> es opcional.
                Roles válidos: administrador, gestor, desarrollador, observador.
              </p>
            </CardContent>
          </Card>

          {/* Tabla allowlist */}
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
                      <th className="px-4 py-2 text-left">Nombre</th>
                      <th className="px-4 py-2 text-left">Tipo</th>
                      <th className="px-4 py-2 text-left">Rol</th>
                      <th className="px-4 py-2 text-left">Estado</th>
                      <th className="px-4 py-2" aria-label="Acciones" />
                    </tr>
                  </thead>
                  <tbody>
                    {entries.map((entry: AllowedEmail) =>
                      editingId === entry.id ? (
                        <tr key={entry.id} className="border-b border-border/40 last:border-0 bg-muted/20">
                          <td className="px-4 py-2 font-mono text-xs text-muted-foreground">
                            {entry.email ?? `@${entry.domain}`}
                          </td>
                          <td className="px-4 py-2" colSpan={2}>
                            <Input
                              value={editName}
                              onChange={(e) => setEditName(e.target.value)}
                              placeholder="Nombre (opcional)"
                              className="h-7 text-xs"
                              onKeyDown={(e) => {
                                if (e.key === "Enter") updateMutation.mutate({ id: entry.id, data: { role: editRole, name: editName.trim() || undefined } });
                                if (e.key === "Escape") setEditingId(null);
                              }}
                              autoFocus
                            />
                          </td>
                          <td className="px-4 py-2">
                            <select
                              value={editRole}
                              onChange={(e) => setEditRole(e.target.value as UserRole)}
                              aria-label="Rol asignado"
                              className="h-7 rounded-md border border-input bg-background px-2 text-xs"
                            >
                              {Object.entries(ROLE_LABELS).map(([value, label]) => (
                                <option key={value} value={value}>{label}</option>
                              ))}
                            </select>
                          </td>
                          <td className="px-4 py-2" />
                          <td className="px-4 py-2 text-right">
                            <span className="flex items-center justify-end gap-1">
                              <button
                                type="button"
                                onClick={() => updateMutation.mutate({ id: entry.id, data: { role: editRole, name: editName.trim() || undefined } })}
                                disabled={updateMutation.isPending}
                                className="text-green-600 hover:text-green-800 transition-colors"
                                aria-label="Guardar cambios"
                              >
                                <Check className="h-4 w-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => setEditingId(null)}
                                className="text-muted-foreground hover:text-foreground transition-colors"
                                aria-label="Cancelar edición"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </span>
                          </td>
                        </tr>
                      ) : (
                        <tr
                          key={entry.id}
                          className="border-b border-border/40 last:border-0 hover:bg-muted/30 transition-colors"
                        >
                          <td className="px-4 py-2.5 font-mono text-xs">
                            {entry.email ?? `@${entry.domain}`}
                          </td>
                          <td className="px-4 py-2.5 text-xs text-muted-foreground">
                            {entry.name ?? <span className="italic opacity-50">—</span>}
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
                                  type="button"
                                  onClick={() => deleteMutation.mutate(entry.id)}
                                  className="text-red-500 hover:text-red-700 font-bold text-sm"
                                  aria-label="Confirmar eliminación"
                                >✓</button>
                                <button
                                  type="button"
                                  onClick={() => setConfirmDeleteId(null)}
                                  className="text-muted-foreground hover:text-foreground font-bold text-sm ml-1"
                                  aria-label="Cancelar"
                                >✕</button>
                              </span>
                            ) : (
                              <span className="flex items-center justify-end gap-2">
                                <button
                                  type="button"
                                  onClick={() => startEdit(entry)}
                                  className="text-muted-foreground hover:text-foreground transition-colors"
                                  aria-label="Editar entrada"
                                >
                                  <Pencil className="h-3.5 w-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => { setConfirmDeleteId(entry.id); setEditingId(null); }}
                                  className="text-muted-foreground hover:text-red-500 transition-colors"
                                  aria-label="Eliminar entrada"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </span>
                            )}
                          </td>
                        </tr>
                      )
                    )}
                  </tbody>
                </table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── TAB: Usuarios Registrados ── */}
        <TabsContent value="users" className="mt-0">
          <Card className="shadow-none border border-border/50">
            <CardHeader>
              <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
                Usuarios registrados ({adminUsers.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {isLoadingUsers ? (
                <div className="p-6 space-y-2">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-10 bg-muted rounded animate-pulse" />
                  ))}
                </div>
              ) : adminUsers.length === 0 ? (
                <p className="p-6 text-sm text-muted-foreground text-center">
                  No hay usuarios registrados aún.
                </p>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border/50 text-[11px] uppercase tracking-wider text-muted-foreground">
                      <th className="px-4 py-2 text-left">Usuario</th>
                      <th className="px-4 py-2 text-left">Rol</th>
                      <th className="px-4 py-2 text-left">Método</th>
                      <th className="px-4 py-2 text-left">Estado</th>
                      <th className="px-4 py-2 text-right" aria-label="Acciones" />
                    </tr>
                  </thead>
                  <tbody>
                    {adminUsers.map((user: AdminUser) => {
                      const displayName = user.first_name
                        ? `${user.first_name} ${user.last_name}`.trim()
                        : user.email;
                      const isMe = user.id === currentUser?.id;

                      return (
                        <tr
                          key={user.id}
                          className="border-b border-border/40 last:border-0 hover:bg-muted/30 transition-colors"
                        >
                          {/* Usuario */}
                          <td className="px-4 py-2.5">
                            <div className="flex flex-col">
                              <span className="text-sm font-medium">
                                {displayName}
                                {isMe && (
                                  <span className="ml-1.5 text-[10px] text-muted-foreground">(tú)</span>
                                )}
                              </span>
                              {user.first_name && (
                                <span className="text-xs text-muted-foreground">{user.email}</span>
                              )}
                            </div>
                          </td>

                          {/* Rol */}
                          <td className="px-4 py-2.5">
                            <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${ROLE_COLORS[user.role]}`}>
                              {ROLE_LABELS[user.role]}
                            </span>
                          </td>

                          {/* Método de login */}
                          <td className="px-4 py-2.5">
                            <div className="flex flex-col gap-0.5">
                              {user.has_google && (
                                <Badge variant="secondary" className="text-[10px] w-fit bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                                  Google
                                </Badge>
                              )}
                              {user.has_password && (
                                <Badge variant="secondary" className="text-[10px] w-fit">
                                  Email+Pass
                                </Badge>
                              )}
                            </div>
                          </td>

                          {/* Estado */}
                          <td className="px-4 py-2.5">
                            {user.is_active ? (
                              <Badge variant="secondary" className="text-[10px] bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                                Activo
                              </Badge>
                            ) : (
                              <Badge variant="secondary" className="text-[10px] bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
                                Bloqueado
                              </Badge>
                            )}
                          </td>

                          {/* Acciones */}
                          <td className="px-4 py-2.5 text-right">
                            {confirmDeactivateId === user.id ? (
                              <span className="flex items-center justify-end gap-1">
                                <span className="text-xs text-muted-foreground mr-1">¿Bloquear?</span>
                                <button
                                  type="button"
                                  onClick={() => deactivateMutation.mutate(user.id)}
                                  disabled={deactivateMutation.isPending}
                                  className="text-red-500 hover:text-red-700 font-bold text-sm"
                                  aria-label="Confirmar bloqueo"
                                >✓</button>
                                <button
                                  type="button"
                                  onClick={() => setConfirmDeactivateId(null)}
                                  className="text-muted-foreground hover:text-foreground font-bold text-sm ml-1"
                                  aria-label="Cancelar"
                                >✕</button>
                              </span>
                            ) : (
                              <span className="flex items-center justify-end gap-2">
                                {/* Desbloquear / Bloquear */}
                                {user.is_active ? (
                                  !isMe && (
                                    <button
                                      type="button"
                                      onClick={() => setConfirmDeactivateId(user.id)}
                                      className="text-muted-foreground hover:text-red-500 transition-colors"
                                      aria-label="Bloquear usuario"
                                      title="Bloquear usuario"
                                    >
                                      <UserX className="h-3.5 w-3.5" />
                                    </button>
                                  )
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => activateMutation.mutate(user.id)}
                                    disabled={activateMutation.isPending}
                                    className="text-muted-foreground hover:text-green-600 transition-colors"
                                    aria-label="Desbloquear usuario"
                                    title="Desbloquear usuario"
                                  >
                                    <UserCheck className="h-3.5 w-3.5" />
                                  </button>
                                )}

                                {/* Asignar contraseña */}
                                <button
                                  type="button"
                                  onClick={() => {
                                    setPasswordModal({ userId: user.id, userName: displayName });
                                    setNewPassword("");
                                    setConfirmPassword("");
                                  }}
                                  className="text-muted-foreground hover:text-foreground transition-colors"
                                  aria-label="Asignar contraseña"
                                  title="Asignar contraseña"
                                >
                                  <Lock className="h-3.5 w-3.5" />
                                </button>
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* ── Modal: Asignar Contraseña ── */}
      <Dialog
        open={!!passwordModal}
        onOpenChange={(open) => {
          if (!open) {
            setPasswordModal(null);
            setNewPassword("");
            setConfirmPassword("");
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Asignar contraseña</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <p className="text-sm text-muted-foreground">
              Establecer contraseña para <span className="font-medium text-foreground">{passwordModal?.userName}</span>.
              El usuario podrá ingresar con email + contraseña.
            </p>
            <div className="space-y-2">
              <Label className="text-xs">Nueva contraseña</Label>
              <Input
                type="password"
                placeholder="Mínimo 8 caracteres"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                autoComplete="new-password"
                onKeyDown={(e) => e.key === "Enter" && handleSetPassword()}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Confirmar contraseña</Label>
              <Input
                type="password"
                placeholder="Repite la contraseña"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                autoComplete="new-password"
                onKeyDown={(e) => e.key === "Enter" && handleSetPassword()}
              />
            </div>
            {newPassword && confirmPassword && newPassword !== confirmPassword && (
              <p className="text-xs text-red-500">Las contraseñas no coinciden</p>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setPasswordModal(null);
                setNewPassword("");
                setConfirmPassword("");
              }}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSetPassword}
              disabled={setPasswordMutation.isPending || newPassword.length < 8 || newPassword !== confirmPassword}
            >
              {setPasswordMutation.isPending ? "Guardando..." : "Guardar contraseña"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
