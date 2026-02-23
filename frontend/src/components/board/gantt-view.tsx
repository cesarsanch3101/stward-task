"use client";

import React, { useMemo, useState, useRef, useEffect } from "react";
import { ChevronDown, ChevronRight, Calendar, Users, ZoomIn, ZoomOut, Maximize } from "lucide-react";
import type { Board, Task, Column } from "@/lib/types";
import { PriorityBadge } from "./priority-badge";
import { Card } from "@/components/ui/card";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";

interface Props {
    board: Board;
}

type ZoomLevel = "days" | "weeks" | "months" | "fit";

export function GanttView({ board }: Props) {
    const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>(
        board.columns.reduce((acc, col) => ({ ...acc, [col.id]: true }), {})
    );
    const [zoom, setZoom] = useState<ZoomLevel>("fit");
    const containerRef = useRef<HTMLDivElement>(null);
    const [containerWidth, setContainerWidth] = useState(0);

    // Measure container width for responsive fit
    useEffect(() => {
        if (!containerRef.current) return;

        const resizeObserver = new ResizeObserver((entries) => {
            for (let entry of entries) {
                setContainerWidth(entry.contentRect.width);
            }
        });

        resizeObserver.observe(containerRef.current);
        return () => resizeObserver.disconnect();
    }, []);

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

    const timelineRange = useMemo(() => {
        const now = new Date();
        const start = new Date(now.getFullYear(), now.getMonth() - 2, 1);
        const end = new Date(now.getFullYear(), now.getMonth() + 7, 0);

        const months: { name: string; days: number; startDay: number; year: number }[] = [];
        let curr = new Date(start);

        let safety = 0;
        while (curr <= end && safety < 12) {
            const monthName = curr.toLocaleDateString("es", { month: "short" });
            const year = curr.getFullYear();
            const daysInMonth = new Date(curr.getFullYear(), curr.getMonth() + 1, 0).getDate();

            months.push({
                name: monthName,
                days: daysInMonth,
                startDay: curr.getTime(),
                year: year
            });

            curr = new Date(curr.getFullYear(), curr.getMonth() + 1, 1);
            safety++;
        }

        const totalDays = months.reduce((acc, m) => acc + m.days, 0);
        return { months, totalDays, startDate: start.getTime() };
    }, []);

    const LIST_WIDTH = 350;

    const DAY_WIDTH = useMemo(() => {
        switch (zoom) {
            case "days": return 30;
            case "weeks": return 10;
            case "months": return 4;
            case "fit":
                const availableWidth = containerWidth - LIST_WIDTH - 40; // 40px margin
                return Math.max(2, availableWidth / timelineRange.totalDays);
            default: return 30;
        }
    }, [zoom, containerWidth, timelineRange.totalDays]);

    const calculateTaskPosition = (startStr: string | null, endStr: string | null) => {
        if (!startStr) return null;
        const start = new Date(startStr + "T00:00:00").getTime();
        const end = endStr ? new Date(endStr + "T00:00:00").getTime() : start + 86400000;

        const left = ((start - timelineRange.startDate) / (24 * 60 * 60 * 1000)) * DAY_WIDTH;
        const width = ((end - start) / (24 * 60 * 60 * 1000) + 1) * DAY_WIDTH;

        return { left, width };
    };

    const timelineWidth = timelineRange.totalDays * DAY_WIDTH;
    const todayPos = useMemo(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const diff = (today.getTime() - timelineRange.startDate) / (24 * 60 * 60 * 1000);
        return diff * DAY_WIDTH;
    }, [timelineRange.startDate, DAY_WIDTH]);

    return (
        <div className="flex-1 flex flex-col overflow-hidden bg-background" ref={containerRef}>
            {/* Toolbar */}
            <div className="h-12 border-b border-border bg-muted/20 flex items-center px-4 gap-2 shrink-0">
                <div className="flex items-center gap-1 bg-background rounded-md border border-border p-1">
                    <Button
                        variant={zoom === "days" ? "secondary" : "ghost"}
                        size="sm"
                        onClick={() => setZoom("days")}
                        className="h-7 text-[10px] px-2"
                    >
                        Días
                    </Button>
                    <Button
                        variant={zoom === "weeks" ? "secondary" : "ghost"}
                        size="sm"
                        onClick={() => setZoom("weeks")}
                        className="h-7 text-[10px] px-2"
                    >
                        Semanas
                    </Button>
                    <Button
                        variant={zoom === "months" ? "secondary" : "ghost"}
                        size="sm"
                        onClick={() => setZoom("months")}
                        className="h-7 text-[10px] px-2"
                    >
                        Meses
                    </Button>
                    <div className="w-px h-4 bg-border mx-1" />
                    <Button
                        variant={zoom === "fit" ? "secondary" : "ghost"}
                        size="sm"
                        onClick={() => setZoom("fit")}
                        className="h-7 gap-1 text-[10px] px-2"
                    >
                        <Maximize className="h-3 w-3" />
                        Ajustar
                    </Button>
                </div>

                <div className="ml-auto flex items-center gap-2 text-[10px] text-muted-foreground italic">
                    <Calendar className="h-3 w-3" />
                    Vista de cronograma activa
                </div>
            </div>

            <ScrollArea className="flex-1 w-full">
                <div
                    className="relative flex min-h-full"
                    style={{ width: Math.max(containerWidth, LIST_WIDTH + timelineWidth) }}
                >
                    {/* LEFT SIDE: Task Titles (Sticky) */}
                    <div
                        className="sticky left-0 z-30 border-r border-border bg-background shrink-0 flex flex-col"
                        style={{ width: LIST_WIDTH }}
                    >
                        {/* Header Title */}
                        <div className="h-10 border-b border-border bg-muted/50 flex items-center px-4 font-semibold text-[10px] uppercase text-muted-foreground tracking-wider sticky top-0 z-40">
                            Tarea / Fase
                        </div>

                        {/* Rows Titles */}
                        <div className="divide-y divide-border/30">
                            {groups.map((group) => (
                                <div key={`list-group-${group.id}`}>
                                    <button
                                        onClick={() => toggleGroup(group.id)}
                                        className="w-full flex items-center gap-2 px-3 h-10 hover:bg-muted/30 transition-colors text-xs font-bold text-left"
                                        style={{ borderLeft: `3px solid ${group.color}` }}
                                    >
                                        {expandedGroups[group.id] ? (
                                            <ChevronDown className="h-3 w-3 text-muted-foreground shrink-0" />
                                        ) : (
                                            <ChevronRight className="h-3 w-3 text-muted-foreground shrink-0" />
                                        )}
                                        <span className="truncate flex-1" style={{ color: group.color }}>{group.name}</span>
                                        <span className="ml-auto text-[9px] font-normal text-muted-foreground opacity-50 shrink-0">
                                            {group.tasks.length}
                                        </span>
                                    </button>

                                    {expandedGroups[group.id] && group.tasks.map((task) => (
                                        <div
                                            key={`list-task-${task.id}`}
                                            className="flex items-center gap-2 px-8 h-10 hover:bg-muted/10 text-[12px] group overflow-hidden border-b border-border/10"
                                        >
                                            <span className="truncate flex-1 font-medium">{task.title}</span>
                                            <PriorityBadge priority={task.priority} className="scale-75 origin-right shrink-0" />
                                        </div>
                                    ))}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* RIGHT SIDE: Timeline Area */}
                    <div className="flex flex-col relative shrink-0" style={{ width: timelineWidth }}>
                        {/* Timeline Header (Sticky Top) */}
                        <div
                            className="h-10 border-b border-border bg-muted/50 flex sticky top-0 z-20"
                            style={{ width: timelineWidth }}
                        >
                            {timelineRange.months.map((month) => (
                                <div
                                    key={`header-day-${month.name}-${month.year}-${month.startDay}`}
                                    className="border-r border-border/50 h-full flex flex-col items-center justify-center text-[10px] font-bold uppercase text-muted-foreground shrink-0"
                                    style={{ width: month.days * DAY_WIDTH }}
                                >
                                    <span className="whitespace-nowrap">{month.name}</span>
                                    {(month.name === 'ene.' || month.name === 'ene') && <span className="text-[8px] opacity-70">{month.year}</span>}
                                </div>
                            ))}
                        </div>

                        {/* Grid Lines Overlay */}
                        <div className="absolute top-10 bottom-0 left-0 right-0 flex pointer-events-none z-0">
                            {Array.from({ length: timelineRange.totalDays }).map((_, i) => (
                                <div
                                    key={`grid-line-${i}`}
                                    className="h-full border-r border-border/5 shrink-0"
                                    style={{ width: DAY_WIDTH }}
                                />
                            ))}
                        </div>

                        {/* Today Marker Line */}
                        <div
                            className="absolute top-0 bottom-0 w-px bg-primary z-20 pointer-events-none opacity-50 shadow-[0_0_10px_rgba(59,130,246,0.5)]"
                            style={{ left: todayPos }}
                        />

                        {/* Task Bars Area */}
                        <div className="relative z-10">
                            {groups.map((group) => (
                                <div key={`timeline-group-rows-${group.id}`}>
                                    {/* Group Row Spacer/Background */}
                                    <div className="h-10 border-b border-border/20 bg-muted/5 w-full" />

                                    {expandedGroups[group.id] && group.tasks.map((task) => {
                                        const pos = calculateTaskPosition(task.start_date, task.end_date);
                                        return (
                                            <div key={`timeline-task-row-${task.id}`} className="h-10 border-b border-border/10 relative w-full group">
                                                {pos && (
                                                    <div
                                                        className="absolute top-[6px] bottom-[6px] rounded shadow-sm flex items-center px-1.5 text-[9px] font-black text-white hover:brightness-110 transition-all cursor-default overflow-hidden border border-white/10"
                                                        style={{
                                                            left: pos.left,
                                                            width: pos.width,
                                                            backgroundColor: group.color,
                                                            opacity: 0.95
                                                        }}
                                                        title={`${task.title} (${task.progress}%)`}
                                                    >
                                                        {/* Progress fill overlay */}
                                                        <div
                                                            className="absolute inset-0 bg-white/20 pointer-events-none"
                                                            style={{ width: `${task.progress}%` }}
                                                        />
                                                        {DAY_WIDTH > 10 && (
                                                            <span className="relative z-10 truncate">{task.progress}%</span>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
                <ScrollBar orientation="horizontal" className="z-50" />
                <ScrollBar orientation="vertical" className="z-50" />
            </ScrollArea>
        </div>
    );
}
