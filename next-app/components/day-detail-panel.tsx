"use client";

import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Circle } from "lucide-react";

interface TaskDetail {
  id: string;
  subject_name: string;
  duration: number;
  completed: boolean;
}

interface DayDetailPanelProps {
  date: string;
  tasks: TaskDetail[];
}

export function DayDetailPanel({ date, tasks }: DayDetailPanelProps) {
  const [year, month, day] = date.split("-");
  const completed = tasks.filter((t) => t.completed).length;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">
          {Number(month)}월 {Number(day)}일
        </h3>
        <Badge variant="secondary" className="text-xs">
          {completed}/{tasks.length} 완료
        </Badge>
      </div>

      {tasks.length === 0 ? (
        <p className="text-muted-foreground py-2 text-center text-sm">
          학습 계획이 없습니다.
        </p>
      ) : (
        <div className="space-y-2">
          {tasks.map((task) => (
            <div key={task.id} className="flex items-center gap-2 text-sm">
              {task.completed ? (
                <CheckCircle2 className="size-4 text-green-500" />
              ) : (
                <Circle className="text-muted-foreground size-4" />
              )}
              <span className={task.completed ? "line-through opacity-60" : ""}>
                {task.subject_name}
              </span>
              <span className="text-muted-foreground ml-auto text-xs">
                {task.duration}h
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
