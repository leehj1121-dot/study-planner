"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { TodayTaskCard } from "@/components/today-task-card";
import { SubjectProgress } from "@/components/subject-progress";
import { WeeklyChart } from "@/components/weekly-chart";
import { Clock } from "lucide-react";

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

type PlanStatus = "draft" | "pending" | "assigned" | null;

export default function DashboardPage() {
  const router = useRouter();
  const [planStatus, setPlanStatus] = useState<PlanStatus>(null);
  const [adminNote, setAdminNote] = useState<string | null>(null);
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
    // 먼저 플랜 상태 확인
    const plan = await fetch("/api/plans").then((r) => r.json());

    if (!plan?.id) {
      router.push("/onboarding/subjects");
      return;
    }

    setPlanStatus(plan.status);
    setAdminNote(plan.admin_note);

    if (plan.status === "draft") {
      router.push("/onboarding/subjects");
      return;
    }

    if (plan.status === "pending") {
      setLoading(false);
      return;
    }

    // assigned → 대시보드 데이터 로드
    const [tasksRes, progressRes, weeklyRes] = await Promise.all([
      fetch("/api/tasks/today").then((r) => r.json()),
      fetch("/api/stats/progress").then((r) => r.json()),
      fetch("/api/stats/weekly").then((r) => r.json()),
    ]);
    setTasks(tasksRes);
    setProgress(progressRes);
    setWeekly(weeklyRes);
    setLoading(false);
  }, [router]);

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

  // 대기 상태
  if (planStatus === "pending") {
    return (
      <div className="mx-auto max-w-md p-4">
        <Card>
          <CardContent className="flex flex-col items-center gap-4 py-12 text-center">
            <div className="bg-muted flex size-16 items-center justify-center rounded-full">
              <Clock className="text-muted-foreground size-8" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">학습 계획 준비 중</h2>
              <p className="text-muted-foreground mt-1 text-sm">
                제출이 완료되었습니다.<br />
                관리자가 맞춤 학습 계획을 작성하고 있어요.<br />
                잠시만 기다려주세요!
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // 계획 전달됨 → 대시보드
  const todayTasks = tasks.filter((t) => !t.carry_over);
  const carryOverTasks = tasks.filter((t) => t.carry_over);
  const todayCompleted = todayTasks.filter((t) => t.completed).length;

  return (
    <div className="mx-auto max-w-md space-y-4 p-4">
      {/* 관리자 메모 */}
      {adminNote && (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="py-3">
            <p className="text-sm">
              <span className="font-medium">관리자 메모:</span> {adminNote}
            </p>
          </CardContent>
        </Card>
      )}

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
          {carryOverTasks.length > 0 &&
            carryOverTasks.map((task) => (
              <TodayTaskCard key={task.id} task={task} onToggle={handleToggle} />
            ))}
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
