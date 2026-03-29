"use client";

interface WeekDay {
  label: string;
  date: string;
  total: number;
  completed: number;
  percent: number;
}

interface WeeklyChartProps {
  data: WeekDay[];
}

export function WeeklyChart({ data }: WeeklyChartProps) {
  const today = new Date().toISOString().split("T")[0];

  return (
    <div className="flex items-end justify-between gap-1">
      {data.map((day) => {
        const isToday = day.date === today;
        const height = day.total > 0 ? Math.max(day.percent, 8) : 8;

        return (
          <div key={day.date} className="flex flex-1 flex-col items-center gap-1">
            <span className="text-muted-foreground text-[10px]">
              {day.total > 0 ? `${day.percent}%` : "-"}
            </span>
            <div className="bg-muted relative h-20 w-full overflow-hidden rounded-sm">
              <div
                className={`absolute bottom-0 w-full rounded-sm transition-all ${
                  isToday ? "bg-primary" : "bg-primary/60"
                }`}
                style={{ height: `${height}%` }}
              />
            </div>
            <span
              className={`text-xs ${isToday ? "font-bold" : "text-muted-foreground"}`}
            >
              {day.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}
