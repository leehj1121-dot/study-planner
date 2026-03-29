"use client";

import { Progress } from "@/components/ui/progress";

interface SubjectStat {
  id: string;
  name: string;
  percent: number;
  completed: number;
  total: number;
}

interface SubjectProgressProps {
  subjects: SubjectStat[];
}

export function SubjectProgress({ subjects }: SubjectProgressProps) {
  return (
    <div className="space-y-3">
      {subjects.map((s) => (
        <div key={s.id} className="space-y-1">
          <div className="flex justify-between text-sm">
            <span>{s.name}</span>
            <span className="text-muted-foreground">
              {s.completed}/{s.total} ({s.percent}%)
            </span>
          </div>
          <Progress value={s.percent} className="h-2" />
        </div>
      ))}
    </div>
  );
}
