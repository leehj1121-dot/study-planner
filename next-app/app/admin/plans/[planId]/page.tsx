"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Sparkles, Send, Plus, Trash2, ArrowLeft } from "lucide-react";

interface Subject {
  id: string;
  name: string;
  weight: number;
}

interface Task {
  id?: string;
  subject_id: string;
  subject_name: string;
  date: string;
  duration: number;
}

interface PlanDetail {
  id: string;
  user_email: string;
  target_date: string;
  daily_hours: number;
  status: string;
  admin_note: string | null;
  subjects: Subject[];
  tasks: Task[];
}

export default function AdminPlanPage() {
  const params = useParams();
  const router = useRouter();
  const planId = params.planId as string;

  const [plan, setPlan] = useState<PlanDetail | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [adminNote, setAdminNote] = useState("");
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [publishing, setPublishing] = useState(false);

  useEffect(() => {
    fetch(`/api/admin/plans/${planId}`)
      .then((r) => r.json())
      .then((data) => {
        setPlan(data);
        setTasks(data.tasks || []);
        setAdminNote(data.admin_note || "");
        setLoading(false);
      });
  }, [planId]);

  const handleAutoGenerate = async () => {
    setGenerating(true);
    await fetch(`/api/admin/plans/${planId}/tasks`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mode: "auto" }),
    });
    // 새로 조회
    const data = await fetch(`/api/admin/plans/${planId}`).then((r) => r.json());
    setTasks(data.tasks || []);
    setGenerating(false);
  };

  const handleAddTask = () => {
    if (!plan || plan.subjects.length === 0) return;
    const today = new Date().toISOString().split("T")[0];
    setTasks((prev) => [
      ...prev,
      {
        subject_id: plan.subjects[0].id,
        subject_name: plan.subjects[0].name,
        date: today,
        duration: 1,
      },
    ]);
  };

  const handleTaskChange = (
    index: number,
    field: "subject_id" | "date" | "duration",
    value: string | number,
  ) => {
    setTasks((prev) =>
      prev.map((t, i) => {
        if (i !== index) return t;
        if (field === "subject_id") {
          const subject = plan?.subjects.find((s) => s.id === value);
          return { ...t, subject_id: value as string, subject_name: subject?.name || "" };
        }
        return { ...t, [field]: value };
      }),
    );
  };

  const handleRemoveTask = (index: number) => {
    setTasks((prev) => prev.filter((_, i) => i !== index));
  };

  const handlePublish = async () => {
    setPublishing(true);

    // 수동 편집된 태스크 저장
    await fetch(`/api/admin/plans/${planId}/tasks`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tasks: tasks.map((t) => ({
          subject_id: t.subject_id,
          date: t.date,
          duration: Number(t.duration),
        })),
      }),
    });

    // 발행
    await fetch(`/api/admin/plans/${planId}/publish`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ admin_note: adminNote }),
    });

    router.push("/admin");
  };

  if (loading || !plan) {
    return <p className="text-muted-foreground py-8 text-center">로딩 중...</p>;
  }

  // 날짜별 그룹
  const tasksByDate = tasks.reduce<Record<string, Task[]>>((acc, t) => {
    if (!acc[t.date]) acc[t.date] = [];
    acc[t.date].push(t);
    return acc;
  }, {});
  const sortedDates = Object.keys(tasksByDate).sort();

  return (
    <div className="space-y-4">
      <Button variant="ghost" size="sm" onClick={() => router.push("/admin")}>
        <ArrowLeft className="size-4" />
        돌아가기
      </Button>

      {/* 사용자 정보 */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">{plan.user_email || "사용자"}</CardTitle>
            <Badge variant={plan.status === "pending" ? "outline" : "secondary"}>
              {plan.status === "pending" ? "대기 중" : "전달 완료"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-muted-foreground space-y-1 text-sm">
            <p>목표일: {plan.target_date}</p>
            <p>가용 시간: {plan.daily_hours}시간/일</p>
            <p>
              과목:{" "}
              {plan.subjects.map((s) => `${s.name}(${s.weight}%)`).join(", ")}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* 자동 생성 버튼 */}
      <div className="flex gap-2">
        <Button onClick={handleAutoGenerate} disabled={generating} variant="outline" className="flex-1">
          <Sparkles className="size-4" />
          {generating ? "생성 중..." : "자동 생성 (비중 기반)"}
        </Button>
        <Button onClick={handleAddTask} variant="outline">
          <Plus className="size-4" />
          수동 추가
        </Button>
      </div>

      {/* 태스크 편집 */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">학습 계획 ({tasks.length}개 태스크)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {sortedDates.length === 0 ? (
            <p className="text-muted-foreground py-4 text-center text-sm">
              태스크가 없습니다. 자동 생성하거나 수동으로 추가하세요.
            </p>
          ) : (
            sortedDates.map((date) => (
              <div key={date}>
                <p className="mb-1 text-xs font-semibold text-muted-foreground">{date}</p>
                <div className="space-y-1">
                  {tasksByDate[date].map((task) => {
                    const globalIndex = tasks.indexOf(task);
                    return (
                      <div key={globalIndex} className="flex items-center gap-2">
                        <select
                          className="border-input bg-background h-8 flex-1 rounded-md border px-2 text-sm"
                          value={task.subject_id}
                          onChange={(e) =>
                            handleTaskChange(globalIndex, "subject_id", e.target.value)
                          }
                        >
                          {plan.subjects.map((s) => (
                            <option key={s.id} value={s.id}>
                              {s.name}
                            </option>
                          ))}
                        </select>
                        <Input
                          type="date"
                          value={task.date}
                          onChange={(e) =>
                            handleTaskChange(globalIndex, "date", e.target.value)
                          }
                          className="h-8 w-36"
                        />
                        <Input
                          type="number"
                          step={0.5}
                          min={0.5}
                          value={task.duration}
                          onChange={(e) =>
                            handleTaskChange(globalIndex, "duration", Number(e.target.value))
                          }
                          className="h-8 w-20"
                        />
                        <span className="text-muted-foreground text-xs">h</span>
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          onClick={() => handleRemoveTask(globalIndex)}
                        >
                          <Trash2 className="size-3" />
                        </Button>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* 메모 + 발행 */}
      <Card>
        <CardContent className="space-y-3 pt-6">
          <div className="space-y-2">
            <Label>관리자 메모 (선택)</Label>
            <Input
              placeholder="사용자에게 전달할 메모..."
              value={adminNote}
              onChange={(e) => setAdminNote(e.target.value)}
            />
          </div>
          <Button
            className="w-full"
            size="lg"
            disabled={tasks.length === 0 || publishing}
            onClick={handlePublish}
          >
            {publishing ? (
              "전달 중..."
            ) : (
              <>
                <Send className="size-4" />
                사용자에게 계획 전달
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
