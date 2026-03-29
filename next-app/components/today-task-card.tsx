"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";

interface Task {
  id: string;
  subject_name: string;
  duration: number;
  completed: boolean;
  carry_over: boolean;
}

interface TodayTaskCardProps {
  task: Task;
  onToggle: (id: string) => void;
}

export function TodayTaskCard({ task, onToggle }: TodayTaskCardProps) {
  return (
    <div
      className={`flex items-center gap-3 rounded-lg border p-3 transition-colors ${
        task.completed ? "bg-muted/50 opacity-60" : ""
      }`}
    >
      <Checkbox
        checked={task.completed}
        onCheckedChange={() => onToggle(task.id)}
      />
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <span
            className={`text-sm font-medium ${task.completed ? "line-through" : ""}`}
          >
            {task.subject_name}
          </span>
          {task.carry_over && (
            <Badge variant="outline" className="text-xs text-orange-500 border-orange-300">
              이월
            </Badge>
          )}
        </div>
        <p className="text-muted-foreground text-xs">{task.duration}시간</p>
      </div>
    </div>
  );
}
