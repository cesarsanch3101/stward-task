"use client";

import React, { useMemo, useState } from "react";
import { ChevronDown, ChevronRight, Calendar, Users } from "lucide-react";
import type { Board, Task, Column } from "@/lib/types";
import { PriorityBadge } from "./priority-badge";
import { Card } from "@/components/ui/card";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

interface Props {
    board: Board;
}

export function GanttView({ board }: Props) {
    const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});

    const allTasks = useMemo(() => {
        return board.columns.flatMap((col) => col.tasks || []);
    }, [board]);

    // Group tasks by Column (Top Level) and then potentially subtasks
    const groups = useMemo(() => {
        return board.columns.map((col) => ({
            id: col.id,
            name: col.name,
            color: col.color,
            tasks: (col.tasks || []).filter((t) => !t.parent_id),
        }));
    }, [board.columns]);

    const toggleGroup = (id: string) => {
        setExpandedGroups((prev) => ({ ...prev, [id]: !prev[id] }));
    };

    // Timeline Logic: Generate months/days for the header
    const timelineRange = useMemo(() => {
        const now = new Date();
        const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const end = new Date(now.getFullYear(), now.getMonth() + 4, 0);

        const months: { name: string; days: number; startDay: number }[] = [];
        let curr = new Date(start);
        while (curr <= end) {
            const monthName = curr.toLocaleDateString("es", { month: "short" });
            const daysInMonth = new Date(curr.getFullYear(), curr.getMonth() + 1, 0).getDate();
            months.push({ name: monthName, days: daysInMonth, startDay: curr.getTime() });
            curr.setMonth(curr.getMonth() + 1);
        }

        const totalDays = months.reduce((acc, m) => acc + m.days, 0);
        return { months, totalDays, startDate: start.getTime() };
    }, []);

    const DAY_WIDTH = 30; // pixels per day

    const calculateTaskPosition = (startStr: string | null, endStr: string | null) => {
        if (!startStr) return null;
        const start = new Date(startStr + "T00:00:00").getTime();
        const end = endStr ? new Date(endStr + "T00:00:00").getTime() : start + 86400000;

        const left = ((start - timelineRange.startDate) / (24 * 60 * 60 * 1000)) * DAY_WIDTH;
        const width = ((end - start) / (24 * 60 * 60 * 1000) + 1) * DAY_WIDTH;

        return { left, width };
    };

    return (
        <div className="flex-1 flex overflow-hidden bg-background">
            {/* Left Pane: Task List */}
            <div className="w-[400px] border-r border-border shrink-0 flex flex-col">
                <div className="h-10 border-b border-border bg-muted/30 flex items-center px-4 font-semibold text-xs uppercase text-muted-foreground tracking-wider">
                    Nombre de la tarea
                </div>
                <ScrollArea className="flex-1">
                    <div className="divide-y divide-border/50">
                        {groups.map((group) => (
                            <div key={group.id}>
                                <button
                                    onClick={() => toggleGroup(group.id)}
                                    className="w-full flex items-center gap-2 px-3 py-2 hover:bg-muted/30 transition-colors text-sm font-bold"
                                    style={{ borderLeft: `4px solid ${group.color}` }}
                                >
                                    {expandedGroups[group.id] ? (
                                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                                    ) : (
                                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                                    )}
                                    <span style={{ color: group.color }}>{group.name}</span>
                                    <span className="ml-auto text-xs font-normal text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full">
                                        {group.tasks.length}
                                    </span>
                                </button>

                                {expandedGroups[group.id] && (
                                    <div className="bg-muted/5">
                                        {group.tasks.map((task) => (
                                            <div key={task.id} className="flex items-center gap-2 px-8 py-2 border-b border-border/30 hover:bg-muted/20 text-[13px] group">
                                                <span className="truncate flex-1">{task.title}</span>
                                                <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-2">
                                                    <PriorityBadge priority={task.priority} />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </ScrollArea>
            </div>

            {/* Right Pane: Timeline */}
            <div className="flex-1 flex flex-col overflow-hidden">
                <ScrollArea className="h-full">
                    <div className="relative" style={{ width: timelineRange.totalDays * DAY_WIDTH }}>
                        {/* Timeline Header */}
                        <div className="h-10 border-b border-border bg-muted/30 flex sticky top-0 z-10">
                            {timelineRange.months.map((month) => (
                                <div
                                    key={month.name}
                                    className="border-r border-border/50 h-full flex items-center justify-center text-[10px] font-bold uppercase text-muted-foreground"
                                    style={{ width: month.days * DAY_WIDTH }}
                                >
                                    {month.name}
                                </div>
                            ))}
                        </div>

                        {/* Grid Lines */}
                        <div className="absolute inset-0 pointer-events-none flex">
                            {Array.from({ length: timelineRange.totalDays }).map((_, i) => (
                                <div
                                    key={i}
                                    className="h-full border-r border-border/10 shrink-0"
                                    style={{ width: DAY_WIDTH }}
                                />
                            ))}
                        </div>

                        {/* Task Bars */}
                        <div className="relative pt-[2px]">
                            {groups.map((group) => (
                                <div key={`timeline-group-${group.id}`}>
                                    <div className="h-[37px] border-b border-border/30" /> {/* Spacer for group header */}
                                    {expandedGroups[group.id] && group.tasks.map((task) => {
                                        const pos = calculateTaskPosition(task.start_date, task.end_date);
                                        return (
                                            <div key={`bar-${task.id}`} className="h-[37px] border-b border-border/30 relative group">
                                                {pos && (
                                                    <div
                                                        className="absolute top-2 bottom-2 rounded-md shadow-sm flex items-center px-2 text-[10px] font-bold text-white transition-transform hover:scale-[1.02]"
                                                        style={{
                                                            left: pos.left,
                                                            width: pos.width,
                                                            backgroundColor: group.color,
                                                        }}
                                                    >
                                                        <span className="truncate">{task.progress}%</span>
                                                    </div>
                                                )}
                                                {/* Dependency placeholder logic could go here */}
                                            </div>
                                        );
                                    })}
                                </div>
                            ))}
                        </div>
                    </div>
                    <ScrollBar orientation="horizontal" />
                </ScrollArea>
            </div>
        </div>
    );
}
