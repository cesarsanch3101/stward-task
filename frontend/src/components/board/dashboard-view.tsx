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
    Legend,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, Clock, AlertCircle, Users } from "lucide-react";
import type { Board, Task } from "@/lib/types";

interface Props {
    board: Board;
}

const COLORS = ["#0073ea", "#33d391", "#e2445c", "#ffcb00", "#00a9ff", "#9d50bb", "#ff758c"];
const STATUS_COLORS: Record<string, string> = {
    pending: "#6B7280",
    in_progress: "#3B82F6",
    delayed: "#F97316",
    completed: "#22C55E",
};

export function DashboardView({ board }: Props) {
    const allTasks = useMemo(() => {
        return board.columns.flatMap((col) => col.tasks || []);
    }, [board]);

    const stats = useMemo(() => {
        const total = allTasks.length;
        const completed = allTasks.filter((t) => t.progress === 100).length;
        const avgProgress = total > 0
            ? Math.round(allTasks.reduce((acc, t) => acc + (t.total_progress || t.progress || 0), 0) / total)
            : 0;

        // Status Data
        const statusMap: Record<string, number> = {};
        board.columns.forEach(col => {
            statusMap[col.name] = (col.tasks || []).length;
        });
        const statusData = Object.entries(statusMap).map(([name, value]) => ({ name, value }));

        // Priority Data
        const priorityMap: Record<string, number> = {
            urgent: 0,
            high: 0,
            medium: 0,
            low: 0,
            none: 0,
        };
        allTasks.forEach(t => {
            priorityMap[t.priority] = (priorityMap[t.priority] || 0) + 1;
        });
        const priorityData = Object.entries(priorityMap)
            .filter(([_, value]) => value > 0)
            .map(([name, value]) => ({ name: name.toUpperCase(), value }));

        // Workload Data
        const userMap: Record<string, number> = {};
        allTasks.forEach(t => {
            if (t.assignments && t.assignments.length > 0) {
                t.assignments.forEach(a => {
                    const name = a.user.first_name || a.user.email;
                    userMap[name] = (userMap[name] || 0) + 1;
                });
            } else if (t.assignee_name) {
                userMap[t.assignee_name] = (userMap[t.assignee_name] || 0) + 1;
            }
        });
        const workloadData = Object.entries(userMap).map(([name, value]) => ({ name, value }));

        return { total, completed, avgProgress, statusData, priorityData, workloadData };
    }, [allTasks, board.columns]);

    return (
        <div className="flex-1 overflow-auto bg-slate-50/50 p-6 space-y-6">
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
                    value={stats.workloadData.length}
                    icon={<Users className="h-5 w-5 text-purple-500" />}
                    description="Personas asignadas"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="shadow-none border border-border/50">
                    <CardHeader>
                        <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Distribución por Estado</CardTitle>
                    </CardHeader>
                    <CardContent className="h-[300px]">
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
                                    {stats.statusData.map((_, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                                <Legend verticalAlign="bottom" height={36} />
                            </PieChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                <Card className="shadow-none border border-border/50">
                    <CardHeader>
                        <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Carga de Trabajo por Prioridad</CardTitle>
                    </CardHeader>
                    <CardContent className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={stats.priorityData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                                <XAxis dataKey="name" fontSize={10} fontWeight="bold" />
                                <YAxis fontSize={10} />
                                <Tooltip cursor={{ fill: '#f8fafc' }} />
                                <Bar dataKey="value" fill="#0073ea" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                <Card className="shadow-none border border-border/50 lg:col-span-2">
                    <CardHeader>
                        <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Carga de Trabajo del Equipo</CardTitle>
                    </CardHeader>
                    <CardContent className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={stats.workloadData} layout="vertical">
                                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E2E8F0" />
                                <XAxis type="number" fontSize={10} />
                                <YAxis dataKey="name" type="category" fontSize={10} fontWeight="bold" width={100} />
                                <Tooltip cursor={{ fill: '#f8fafc' }} />
                                <Bar dataKey="value" fill="#33d391" radius={[0, 4, 4, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

interface KPICardProps {
    title: string;
    value: string | number;
    icon: React.ReactNode;
    description?: string;
    progress?: number;
}

function KPICard({ title, value, icon, description, progress }: KPICardProps) {
    return (
        <Card className="shadow-none border border-border/50 hover:border-primary/30 transition-colors">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    {title}
                </CardTitle>
                {icon}
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{value}</div>
                {description && (
                    <p className="text-[11px] text-muted-foreground mt-1">
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
