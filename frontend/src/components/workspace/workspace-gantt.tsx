"use client";

import React, { useMemo, useState, useRef, useEffect } from "react";
import { ChevronDown, ChevronRight, Calendar, Maximize, GanttChart } from "lucide-react";
import type { Board } from "@/lib/types";
import { isOverdue } from "@/lib/task-utils";
import { PriorityBadge } from "@/components/board/priority-badge";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";

interface Props {
  boards: Board[];
  isLoading: boolean;
}

type ZoomLevel = "days" | "weeks" | "months" | "fit";

const BOARD_COLORS = ["#0073ea","#00c875","#e2445c","#fdab3d","#9d50dd","#579bfc","#037f4c","#bb3354"];

export function WorkspaceGantt({ boards, isLoading }: Props) {
  const [zoom, setZoom] = useState<ZoomLevel>("fit");
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);

  useEffect(() => {
    if (!containerRef.current) return;
    const ro = new ResizeObserver((entries) => {
      for (const e of entries) setContainerWidth(e.contentRect.width);
    });
    ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  const groups = useMemo(() =>
    boards.map((b, i) => ({
      id: b.id,
      name: b.name,
      color: BOARD_COLORS[i % BOARD_COLORS.length],
      tasks: b.columns.flatMap((col) => (col.tasks ?? []).filter((t) => !t.parent_id)),
    })),
  [boards]);

  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(boards.map((b) => [b.id, true]))
  );

  useEffect(() => {
    setExpandedGroups((prev) => {
      const next = { ...prev };
      boards.forEach((b) => { if (!(b.id in next)) next[b.id] = true; });
      return next;
    });
  }, [boards]);

  const toggleGroup = (id: string) =>
    setExpandedGroups((prev) => ({ ...prev, [id]: !prev[id] }));

  const timelineRange = useMemo(() => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth() - 2, 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 13, 0);
    const months: { name: string; days: number; startDay: number; year: number }[] = [];
    let curr = new Date(start);
    let safety = 0;
    while (curr <= end && safety < 18) {
      months.push({
        name: curr.toLocaleDateString("es", { month: "short" }),
        year: curr.getFullYear(),
        days: new Date(curr.getFullYear(), curr.getMonth() + 1, 0).getDate(),
        startDay: curr.getTime(),
      });
      curr = new Date(curr.getFullYear(), curr.getMonth() + 1, 1);
      safety++;
    }
    return { months, totalDays: months.reduce((a, m) => a + m.days, 0), startDate: start.getTime() };
  }, []);

  const LIST_WIDTH = 350;

  const DAY_WIDTH = useMemo(() => {
    switch (zoom) {
      case "days":   return 30;
      case "weeks":  return 10;
      case "months": return 4;
      case "fit": {
        const avail = containerWidth - LIST_WIDTH - 40;
        return Math.max(2, avail / timelineRange.totalDays);
      }
      default: return 30;
    }
  }, [zoom, containerWidth, timelineRange.totalDays]);

  const calcPos = (startStr: string | null, endStr: string | null) => {
    if (!startStr) return null;
    const s = new Date(startStr + "T00:00:00").getTime();
    const e = endStr ? new Date(endStr + "T00:00:00").getTime() : s + 86400000;
    return {
      left: ((s - timelineRange.startDate) / 86400000) * DAY_WIDTH,
      width: ((e - s) / 86400000 + 1) * DAY_WIDTH,
    };
  };

  const timelineWidth = timelineRange.totalDays * DAY_WIDTH;

  const todayPos = useMemo(() => {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    return ((today.getTime() - timelineRange.startDate) / 86400000) * DAY_WIDTH;
  }, [timelineRange.startDate, DAY_WIDTH]);

  if (isLoading) {
    return (
      <div className="flex-1 p-6 space-y-3">
        {[1,2,3].map((i) => <div key={i} className="h-10 bg-muted rounded animate-pulse" />)}
      </div>
    );
  }

  if (!boards.length) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center space-y-2">
          <GanttChart className="h-10 w-10 text-muted-foreground mx-auto" />
          <p className="text-muted-foreground text-sm">Este workspace no tiene tableros aún.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-background" ref={containerRef}>
      {/* Toolbar */}
      <div className="h-12 border-b border-border bg-muted/20 flex items-center px-4 gap-2 shrink-0">
        <div className="flex items-center gap-1 bg-background rounded-md border border-border p-1">
          {(["days","weeks","months"] as ZoomLevel[]).map((z) => (
            <Button key={z} variant={zoom === z ? "secondary" : "ghost"} size="sm"
              onClick={() => setZoom(z)} className="h-7 text-[10px] px-2">
              {z === "days" ? "Días" : z === "weeks" ? "Semanas" : "Meses"}
            </Button>
          ))}
          <div className="w-px h-4 bg-border mx-1" />
          <Button variant={zoom === "fit" ? "secondary" : "ghost"} size="sm"
            onClick={() => setZoom("fit")} className="h-7 gap-1 text-[10px] px-2">
            <Maximize className="h-3 w-3" /> Ajustar
          </Button>
        </div>
        <div className="ml-auto flex items-center gap-2 text-[10px] text-muted-foreground italic">
          <Calendar className="h-3 w-3" /> Cronograma del workspace
        </div>
      </div>

      <ScrollArea className="flex-1 w-full">
        <div className="relative flex min-h-full" style={{ width: Math.max(containerWidth, LIST_WIDTH + timelineWidth) }}>

          {/* LEFT: Titles */}
          <div className="sticky left-0 z-30 border-r border-border bg-background shrink-0 flex flex-col" style={{ width: LIST_WIDTH }}>
            <div className="h-10 border-b border-border bg-muted/50 flex items-center px-4 font-semibold text-[10px] uppercase text-muted-foreground tracking-wider sticky top-0 z-40">
              Tablero / Tarea
            </div>
            <div className="divide-y divide-border/30">
              {groups.map((group) => (
                <div key={`list-${group.id}`}>
                  <button onClick={() => toggleGroup(group.id)}
                    className="w-full flex items-center gap-2 px-3 h-10 hover:bg-muted/30 transition-colors text-xs font-bold text-left"
                    style={{ borderLeft: `3px solid ${group.color}` }}>
                    {(expandedGroups[group.id] ?? true)
                      ? <ChevronDown className="h-3 w-3 text-muted-foreground shrink-0" />
                      : <ChevronRight className="h-3 w-3 text-muted-foreground shrink-0" />}
                    <span className="truncate flex-1" style={{ color: group.color }}>{group.name}</span>
                    <span className="ml-auto text-[9px] font-normal text-muted-foreground opacity-50 shrink-0">{group.tasks.length}</span>
                  </button>
                  {(expandedGroups[group.id] ?? true) && group.tasks.map((task) => (
                    <div key={`list-task-${task.id}`} className="flex items-center gap-2 px-8 h-10 hover:bg-muted/10 text-[12px] overflow-hidden border-b border-border/10">
                      <span className="truncate flex-1 font-medium">{task.title}</span>
                      <PriorityBadge priority={task.priority} className="scale-75 origin-right shrink-0" />
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>

          {/* RIGHT: Timeline */}
          <div className="flex flex-col relative shrink-0" style={{ width: timelineWidth }}>
            {/* Header */}
            <div className="h-10 border-b border-border bg-muted/50 flex sticky top-0 z-20" style={{ width: timelineWidth }}>
              {timelineRange.months.map((month) => (
                <div key={`hdr-${month.name}-${month.year}`}
                  className="border-r border-border/50 h-full flex flex-col items-center justify-center text-[10px] font-bold uppercase text-muted-foreground shrink-0"
                  style={{ width: month.days * DAY_WIDTH }}>
                  <span className="whitespace-nowrap">{month.name}</span>
                  {(month.name === "ene." || month.name === "ene") && <span className="text-[8px] opacity-70">{month.year}</span>}
                </div>
              ))}
            </div>
            {/* Grid */}
            <div className="absolute top-10 bottom-0 left-0 right-0 flex pointer-events-none z-0">
              {Array.from({ length: timelineRange.totalDays }).map((_, i) => (
                <div key={i} className="h-full border-r border-border/5 shrink-0" style={{ width: DAY_WIDTH }} />
              ))}
            </div>
            {/* Today */}
            <div className="absolute top-0 bottom-0 w-px bg-primary z-20 pointer-events-none opacity-50 shadow-[0_0_10px_rgba(59,130,246,0.5)]" style={{ left: todayPos }} />
            {/* Bars */}
            <div className="relative z-10">
              {groups.map((group) => (
                <div key={`tl-${group.id}`}>
                  <div className="h-10 border-b border-border/20 bg-muted/5 w-full" />
                  {(expandedGroups[group.id] ?? true) && group.tasks.map((task) => {
                    const pos = calcPos(task.start_date, task.end_date);
                    const barColor = isOverdue(task) ? "#FCA5A5" : group.color;
                    return (
                      <div key={`bar-${task.id}`} className="h-10 border-b border-border/10 relative w-full">
                        {pos && (
                          <div className="absolute top-[6px] bottom-[6px] rounded shadow-sm flex items-center px-1.5 text-[9px] font-black text-white hover:brightness-110 transition-all cursor-default overflow-hidden border border-white/10"
                            style={{ left: pos.left, width: pos.width, backgroundColor: barColor, opacity: 0.95 }}
                            title={`${task.title} (${task.progress}%)`}>
                            <div className="absolute inset-0 bg-white/20 pointer-events-none" style={{ width: `${task.progress}%` }} />
                            {DAY_WIDTH > 10 && <span className="relative z-10 truncate">{task.progress}%</span>}
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
