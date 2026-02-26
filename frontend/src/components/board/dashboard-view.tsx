"use client";

import React, { useMemo } from "react";
import {
    PieChart,
    Pie,
    Cell,
    ResponsiveContainer,
    Tooltip,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, Clock, AlertCircle, Users, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { STATUS_BG } from "@/lib/status-colors";
import type { Board } from "@/lib/types";

interface Props {
    board: Board;
}

interface UserWorkload {
    id: string;
    name: string;
    email: string;
    color: string;
    total: number;
    pending: number;
    inProgress: number;
    delayed: number;
    completed: number;
    avgProgress: number;
}

export function DashboardView({ board }: Props) {
    const allTasks = useMemo(() => {
        return board.columns.flatMap((col) => col.tasks || []);
    }, [board]);

    const stats = useMemo(() => {
        const total = allTasks.length;
        const completed = allTasks.filter((t) => t.progress === 100).length;
        const delayed = board.columns
            .filter((col) => col.status === "delayed")
            .flatMap((col) => col.tasks || []).length;
        const avgProgress =
            total > 0
                ? Math.round(
                      allTasks.reduce(
                          (acc, t) => acc + (t.total_progress || t.progress || 0),
                          0
                      ) / total
                  )
                : 0;

        // Status distribution (pie chart)
        const statusData = board.columns
            .map((col) => ({
                name: col.name,
                value: (col.tasks || []).length,
                color: STATUS_BG[col.status] ?? STATUS_BG.pending,
            }))
            .filter((d) => d.value > 0);

        // Priority distribution (bar chart)
        const priorityMap: Record<string, number> = {
            urgent: 0, high: 0, medium: 0, low: 0, none: 0,
        };
        allTasks.forEach((t) => {
            priorityMap[t.priority] = (priorityMap[t.priority] || 0) + 1;
        });
        const priorityData = Object.entries(priorityMap)
            .filter(([_, v]) => v > 0)
            .map(([name, value]) => ({ name: name.toUpperCase(), value }));

        // Team workload — detailed per user × status
        const userMap: Record<string, UserWorkload & { progressSum: number }> = {};

        board.columns.forEach((col) => {
            (col.tasks || []).forEach((task) => {
                const register = (
                    id: string,
                    name: string,
                    email: string,
                    color: string,
                    progress: number
                ) => {
                    if (!userMap[id]) {
                        userMap[id] = {
                            id, name, email, color,
                            total: 0, pending: 0, inProgress: 0,
                            delayed: 0, completed: 0,
                            avgProgress: 0, progressSum: 0,
                        };
                    }
                    userMap[id].total += 1;
                    userMap[id].progressSum += progress;
                    switch (col.status) {
                        case "in_progress": userMap[id].inProgress += 1; break;
                        case "delayed":     userMap[id].delayed += 1;    break;
                        case "completed":   userMap[id].completed += 1;  break;
                        default:            userMap[id].pending += 1;    break;
                    }
                };

                if (task.assignments && task.assignments.length > 0) {
                    task.assignments.forEach((a) => {
                        const name = a.user.first_name
                            ? `${a.user.first_name} ${a.user.last_name || ""}`.trim()
                            : a.user.email;
                        register(a.user.id, name, a.user.email, a.user_color, a.individual_progress);
                    });
                } else if (task.assignee_name) {
                    register(`ext_${task.assignee_name}`, task.assignee_name, "", "#6B7280", task.progress || 0);
                }
            });
        });

        const teamWorkload: UserWorkload[] = Object.values(userMap)
            .map((u) => ({
                id: u.id, name: u.name, email: u.email, color: u.color,
                total: u.total, pending: u.pending, inProgress: u.inProgress,
                delayed: u.delayed, completed: u.completed,
                avgProgress: u.total > 0 ? Math.round(u.progressSum / u.total) : 0,
            }))
            .sort((a, b) => b.total - a.total);

        return { total, completed, delayed, avgProgress, statusData, priorityData, teamWorkload };
    }, [allTasks, board.columns]);

    return (
        <div className="flex-1 overflow-auto bg-slate-50/50 p-6 space-y-6">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <KPICard
                    title="Total Tareas"
                    value={stats.total}
                    icon={<Clock className="h-5 w-5 text-blue-500" />}
                    description="Tareas activas en el tablero"
                />
                <KPICard
                    title="Completadas"
                    value={stats.completed}
                    icon={<CheckCircle2 className="h-5 w-5 text-green-500" />}
                    description={`${Math.round((stats.completed / (stats.total || 1)) * 100)}% del total`}
                />
                <KPICard
                    title="Progreso Promedio"
                    value={`${stats.avgProgress}%`}
                    icon={<AlertCircle className="h-5 w-5 text-orange-500" />}
                    progress={stats.avgProgress}
                />
                <KPICard
                    title="Colaboradores"
                    value={stats.teamWorkload.length}
                    icon={<Users className="h-5 w-5 text-purple-500" />}
                    description={
                        stats.delayed > 0
                            ? `${stats.delayed} tarea${stats.delayed > 1 ? "s" : ""} retrasada${stats.delayed > 1 ? "s" : ""}`
                            : "Personas asignadas"
                    }
                    alert={stats.delayed > 0}
                />
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="shadow-none border border-border/50">
                    <CardHeader>
                        <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
                            Distribución por Estado
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="h-[300px] flex items-center gap-2">
                        <div className="flex-1 h-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={stats.statusData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={100}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {stats.statusData.map((entry: { name: string; value: number; color: string }, i: number) => (
                                            <Cell key={i} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                        {/* Leyenda lateral derecha */}
                        <div className="flex flex-col gap-3 pr-4">
                            <span className="flex items-center gap-2 text-[11px] font-medium text-muted-foreground">
                                <span className="h-3 w-3 rounded-full flex-shrink-0 bg-slate-300 ring-1 ring-slate-400/60" />
                                Pendiente
                            </span>
                            <span className="flex items-center gap-2 text-[11px] font-medium text-muted-foreground">
                                <span className="h-3 w-3 rounded-full flex-shrink-0 bg-yellow-200 ring-1 ring-yellow-500/60" />
                                En Progreso
                            </span>
                            <span className="flex items-center gap-2 text-[11px] font-medium text-muted-foreground">
                                <span className="h-3 w-3 rounded-full flex-shrink-0 bg-red-200 ring-1 ring-red-500/60" />
                                Retrasado
                            </span>
                            <span className="flex items-center gap-2 text-[11px] font-medium text-muted-foreground">
                                <span className="h-3 w-3 rounded-full flex-shrink-0 bg-green-200 ring-1 ring-green-500/60" />
                                Completado
                            </span>
                        </div>
                    </CardContent>
                </Card>

                <Card className="shadow-none border border-border/50">
                    <CardHeader>
                        <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
                            Carga de Trabajo por Prioridad
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={stats.priorityData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                                <XAxis dataKey="name" fontSize={10} fontWeight="bold" />
                                <YAxis fontSize={10} />
                                <Tooltip cursor={{ fill: "#f8fafc" }} />
                                <Bar dataKey="value" fill="#0073ea" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>

            {/* Team Workload Table */}
            <Card className="shadow-none border border-border/50">
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
                        Carga del Equipo
                    </CardTitle>
                    <Badge variant="secondary" className="text-xs">
                        {stats.teamWorkload.length} persona{stats.teamWorkload.length !== 1 ? "s" : ""}
                    </Badge>
                </CardHeader>
                <CardContent>
                    <TeamWorkloadPanel data={stats.teamWorkload} />
                </CardContent>
            </Card>
        </div>
    );
}

// ─────────────────────────────────────────────────
// Team Workload Panel
// ─────────────────────────────────────────────────
function TeamWorkloadPanel({ data }: { data: UserWorkload[] }) {
    if (data.length === 0) {
        return (
            <p className="text-center py-8 text-sm text-muted-foreground">
                No hay usuarios asignados a tareas en este tablero.
            </p>
        );
    }

    return (
        <div className="space-y-1">
            {/* Column headers */}
            <div className="grid grid-cols-[minmax(140px,1fr)_48px_2fr_56px] gap-4 px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground border-b border-border/50">
                <span>Usuario</span>
                <span className="text-center">Tareas</span>
                <span>Distribución</span>
                <span className="text-right">Prog.</span>
            </div>

            {/* Rows */}
            {data.map((user) => (
                <div
                    key={user.id}
                    className="grid grid-cols-[minmax(140px,1fr)_48px_2fr_56px] gap-4 items-center px-3 py-2.5 rounded-lg hover:bg-muted/40 transition-colors"
                >
                    {/* Avatar + name */}
                    <div className="flex items-center gap-2.5 min-w-0">
                        <div
                            className="h-7 w-7 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 select-none"
                            style={{ backgroundColor: user.color }}
                        >
                            {user.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                            <p className="text-sm font-medium leading-tight truncate">{user.name}</p>
                            {user.email && (
                                <p className="text-[11px] text-muted-foreground truncate">{user.email}</p>
                            )}
                        </div>
                        {user.delayed > 0 && (
                            <AlertTriangle className="h-3.5 w-3.5 text-orange-500 flex-shrink-0" aria-label="Tiene tareas retrasadas" />
                        )}
                    </div>

                    {/* Total */}
                    <div className="text-center">
                        <span className="text-sm font-bold tabular-nums">{user.total}</span>
                    </div>

                    {/* Segmented bar + counts */}
                    <div className="space-y-1">
                        <div className="flex h-2.5 rounded-full overflow-hidden gap-px bg-muted/30">
                            {user.pending > 0 && (
                                <div
                                    style={{ width: `${(user.pending / user.total) * 100}%`, backgroundColor: STATUS_BG.pending }}
                                    title={`Pendiente: ${user.pending}`}
                                />
                            )}
                            {user.inProgress > 0 && (
                                <div
                                    style={{ width: `${(user.inProgress / user.total) * 100}%`, backgroundColor: STATUS_BG.in_progress }}
                                    title={`En Progreso: ${user.inProgress}`}
                                />
                            )}
                            {user.delayed > 0 && (
                                <div
                                    style={{ width: `${(user.delayed / user.total) * 100}%`, backgroundColor: STATUS_BG.delayed }}
                                    title={`Retrasado: ${user.delayed}`}
                                />
                            )}
                            {user.completed > 0 && (
                                <div
                                    style={{ width: `${(user.completed / user.total) * 100}%`, backgroundColor: STATUS_BG.completed }}
                                    title={`Completado: ${user.completed}`}
                                />
                            )}
                        </div>
                        <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-[10px] text-muted-foreground">
                            {user.pending > 0 && <span>{user.pending} pend.</span>}
                            {user.inProgress > 0 && (
                                <span className="text-blue-600 dark:text-blue-400">{user.inProgress} en progr.</span>
                            )}
                            {user.delayed > 0 && (
                                <span className="text-orange-600 dark:text-orange-400 font-semibold">{user.delayed} retr.</span>
                            )}
                            {user.completed > 0 && (
                                <span className="text-green-600 dark:text-green-400">{user.completed} comp.</span>
                            )}
                        </div>
                    </div>

                    {/* Avg progress */}
                    <div className="text-right">
                        <span
                            className={cn(
                                "text-sm font-bold tabular-nums",
                                user.avgProgress >= 75
                                    ? "text-green-600 dark:text-green-400"
                                    : user.delayed > 0
                                    ? "text-orange-600 dark:text-orange-400"
                                    : user.avgProgress >= 40
                                    ? "text-blue-600 dark:text-blue-400"
                                    : "text-foreground"
                            )}
                        >
                            {user.avgProgress}%
                        </span>
                    </div>
                </div>
            ))}

            {/* Legend */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 px-3 pt-3 border-t border-border/50 text-[11px] text-muted-foreground">
                <span className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full inline-block" style={{ backgroundColor: STATUS_BG.pending }} />
                    Pendiente
                </span>
                <span className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full inline-block" style={{ backgroundColor: STATUS_BG.in_progress }} />
                    En Progreso
                </span>
                <span className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full inline-block" style={{ backgroundColor: STATUS_BG.delayed }} />
                    Retrasado
                </span>
                <span className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full inline-block" style={{ backgroundColor: STATUS_BG.completed }} />
                    Completado
                </span>
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────────
// KPI Card
// ─────────────────────────────────────────────────
interface KPICardProps {
    title: string;
    value: string | number;
    icon: React.ReactNode;
    description?: string;
    progress?: number;
    alert?: boolean;
}

function KPICard({ title, value, icon, description, progress, alert }: KPICardProps) {
    return (
        <Card
            className={cn(
                "shadow-none border transition-colors",
                alert ? "border-orange-300 dark:border-orange-800" : "border-border/50 hover:border-primary/30"
            )}
        >
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    {title}
                </CardTitle>
                {icon}
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{value}</div>
                {description && (
                    <p
                        className={cn(
                            "text-[11px] mt-1",
                            alert ? "text-orange-600 dark:text-orange-400 font-medium" : "text-muted-foreground"
                        )}
                    >
                        {alert && <AlertTriangle className="h-3 w-3 inline mr-1" />}
                        {description}
                    </p>
                )}
                {progress !== undefined && (
                    <div className="mt-3">
                        <Progress value={progress} className="h-1.5" />
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
