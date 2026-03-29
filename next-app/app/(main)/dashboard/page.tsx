"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { TodayTaskCard } from "@/components/today-task-card";
import { SubjectProgress } from "@/components/subject-progress";
import { WeeklyChart } from "@/components/weekly-chart";

interface Task {
  id: string;
  subject_name: string;
  duration: number;
  completed: boolean;
  carry_over: boolean;
}

interface ProgressData {
  total: number;
  completed: number;
  percent: number;
  bySubject: { id: string; name: string; percent: number; completed: number; total: number }[];
}

interface WeekDay {
  label: string;
  date: string;
  total: number;
  completed: number;
  percent: number;
}

export default function DashboardPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [progress, setProgress] = useState<ProgressData>({
    total: 0,
    completed: 0,
    percent: 0,
    bySubject: [],
  });
  const [weekly, setWeekly] = useState<WeekDay[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    const [tasksRes, progressRes, weeklyRes] = await Promise.all([
      fetch("/api/tasks/today").then((r) => r.json()),
      fetch("/api/stats/progress").then((r) => r.json()),
      fetch("/api/stats/weekly").then((r) => r.json()),
    ]);
    setTasks(tasksRes);
    setProgress(progressRes);
    setWeekly(weeklyRes);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleToggle = async (id: string) => {
    await fetch(`/api/tasks/${id}/toggle`, { method: "PATCH" });
    fetchData();
  };

  if (loading) {
    return (
      <div className="flex min-h-svh items-center justify-center">
        <p className="text-muted-foreground">로딩 중...</p>
      </div>
    );
  }

  const todayTasks = tasks.filter((t) => !t.carry_over);
  const carryOverTasks = tasks.filter((t) => t.carry_over);
  const todayCompleted = todayTasks.filter((t) => t.completed).length;

  return (
    <div className="mx-auto max-w-md space-y-4 p-4">
      {/* 오늘의 진행 */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">오늘의 학습</CardTitle>
            <span className="text-muted-foreground text-sm">
              {todayCompleted}/{todayTasks.length} 완료
            </span>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          {carryOverTasks.length > 0 && (
            <>
              {carryOverTasks.map((task) => (
                <TodayTaskCard key={task.id} task={task} onToggle={handleToggle} />
              ))}
            </>
          )}
          {todayTasks.length > 0 ? (
            todayTasks.map((task) => (
              <TodayTaskCard key={task.id} task={task} onToggle={handleToggle} />
            ))
          ) : (
            <p className="text-muted-foreground py-4 text-center text-sm">
              오늘 할 학습이 없습니다.
            </p>
          )}
        </CardContent>
      </Card>

      {/* 전체 진행률 */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">전체 진행률</CardTitle>
            <span className="text-primary text-xl font-bold">{progress.percent}%</span>
          </div>
        </CardHeader>
        <CardContent className="space-y-1">
          <Progress value={progress.percent} className="h-3" />
          <p className="text-muted-foreground text-xs text-right">
            {progress.completed}/{progress.total} 완료
          </p>
        </CardContent>
      </Card>

      {/* 주간 달성률 */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">이번 주</CardTitle>
        </CardHeader>
        <CardContent>
          <WeeklyChart data={weekly} />
        </CardContent>
      </Card>

      {/* 과목별 달성률 */}
      {progress.bySubject.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">과목별 달성률</CardTitle>
          </CardHeader>
          <CardContent>
            <SubjectProgress subjects={progress.bySubject} />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
