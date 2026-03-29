"use client";

import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DaySummary {
  total: number;
  completed: number;
  subjects: string[];
}

interface CalendarGridProps {
  year: number;
  month: number; // 1-12
  data: Record<string, DaySummary>;
  selectedDate: string | null;
  onSelectDate: (date: string) => void;
  onPrevMonth: () => void;
  onNextMonth: () => void;
}

const dayLabels = ["일", "월", "화", "수", "목", "금", "토"];

export function CalendarGrid({
  year,
  month,
  data,
  selectedDate,
  onSelectDate,
  onPrevMonth,
  onNextMonth,
}: CalendarGridProps) {
  const today = new Date().toISOString().split("T")[0];
  const firstDay = new Date(year, month - 1, 1).getDay();
  const daysInMonth = new Date(year, month, 0).getDate();

  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const monthStr = `${year}-${String(month).padStart(2, "0")}`;

  return (
    <div className="space-y-3">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="icon-sm" onClick={onPrevMonth}>
          <ChevronLeft className="size-4" />
        </Button>
        <h2 className="text-base font-semibold">
          {year}년 {month}월
        </h2>
        <Button variant="ghost" size="icon-sm" onClick={onNextMonth}>
          <ChevronRight className="size-4" />
        </Button>
      </div>

      {/* 요일 */}
      <div className="grid grid-cols-7 text-center">
        {dayLabels.map((d) => (
          <div key={d} className="text-muted-foreground py-1 text-xs">
            {d}
          </div>
        ))}
      </div>

      {/* 날짜 */}
      <div className="grid grid-cols-7 gap-1">
        {cells.map((day, i) => {
          if (day === null) return <div key={`empty-${i}`} />;

          const dateStr = `${monthStr}-${String(day).padStart(2, "0")}`;
          const summary = data[dateStr];
          const isToday = dateStr === today;
          const isSelected = dateStr === selectedDate;
          const allDone =
            summary && summary.total > 0 && summary.completed === summary.total;

          return (
            <button
              key={dateStr}
              onClick={() => onSelectDate(dateStr)}
              className={`flex flex-col items-center rounded-md p-1 text-xs transition-colors ${
                isSelected
                  ? "bg-primary text-primary-foreground"
                  : isToday
                    ? "bg-accent font-bold"
                    : "hover:bg-muted"
              }`}
            >
              <span>{day}</span>
              {summary && summary.total > 0 && (
                <div
                  className={`mt-0.5 size-1.5 rounded-full ${
                    allDone
                      ? "bg-green-500"
                      : isSelected
                        ? "bg-primary-foreground/60"
                        : "bg-primary/60"
                  }`}
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
