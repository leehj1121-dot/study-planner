"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { SubjectInput } from "@/components/subject-input";
import { WeightSlider } from "@/components/weight-slider";
import { createClient } from "@/lib/supabase/client";
import { LogOut, RotateCcw, Save } from "lucide-react";

interface Subject {
  id: string;
  name: string;
  weight: number;
}

export default function SettingsPage() {
  const router = useRouter();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [dailyHours, setDailyHours] = useState(3);
  const [targetDate, setTargetDate] = useState("");
  const [planId, setPlanId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);

  const today = new Date().toISOString().split("T")[0];
  const totalPercent = subjects.reduce((sum, s) => sum + s.weight, 0);

  useEffect(() => {
    async function load() {
      const [plan, subs] = await Promise.all([
        fetch("/api/plans").then((r) => r.json()),
        fetch("/api/subjects").then((r) => r.json()),
      ]);

      if (plan?.id) {
        setPlanId(plan.id);
        setDailyHours(plan.daily_hours);
        setTargetDate(plan.target_date);
      }

      if (Array.isArray(subs)) {
        setSubjects(subs.map((s: Subject) => ({ id: s.id, name: s.name, weight: s.weight })));
      }
      setLoading(false);
    }
    load();
  }, []);

  const handleAddSubject = async (name: string) => {
    if (!planId) return;
    const res = await fetch("/api/subjects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, plan_id: planId }),
    });
    const newSubject = await res.json();
    setSubjects((prev) => [...prev, { ...newSubject, weight: 0 }]);
  };

  const handleRemoveSubject = async (id: string) => {
    await fetch(`/api/subjects/${id}`, { method: "DELETE" });
    setSubjects((prev) => prev.filter((s) => s.id !== id));
  };

  const handleWeightChange = (id: string, weight: number) => {
    setSubjects((prev) => prev.map((s) => (s.id === id ? { ...s, weight } : s)));
  };

  const handleSave = async () => {
    if (totalPercent !== 100) return;
    setSaving(true);

    // 비중 저장
    await Promise.all(
      subjects.map((s) =>
        fetch(`/api/subjects/${s.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ weight: s.weight }),
        }),
      ),
    );

    // 플랜 수정
    await fetch("/api/plans", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ daily_hours: dailyHours, target_date: targetDate }),
    });

    // 스케줄 재계산
    await fetch("/api/plans/recalculate", { method: "PUT" });

    setSaving(false);
    router.push("/dashboard");
  };

  const handleReset = async () => {
    await fetch("/api/plans/reset", { method: "DELETE" });
    setResetOpen(false);
    router.push("/onboarding/subjects");
  };

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  };

  if (loading) {
    return (
      <div className="flex min-h-svh items-center justify-center">
        <p className="text-muted-foreground">로딩 중...</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md space-y-4 p-4">
      {/* 과목 관리 */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">과목 관리</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <SubjectInput
            subjects={subjects}
            onAdd={handleAddSubject}
            onRemove={handleRemoveSubject}
          />
        </CardContent>
      </Card>

      {/* 학습 설정 */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">학습 설정</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="target-date">목표 날짜</Label>
            <Input
              id="target-date"
              type="date"
              min={today}
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="daily-hours">하루 가용 시간</Label>
            <div className="flex items-center gap-3">
              <Input
                id="daily-hours"
                type="number"
                min={0.5}
                max={16}
                step={0.5}
                value={dailyHours}
                onChange={(e) => setDailyHours(Number(e.target.value))}
                className="w-24"
              />
              <span className="text-muted-foreground text-sm">시간 / 일</span>
            </div>
          </div>

          <Separator />

          <div className="space-y-2">
            <Label>과목별 비중</Label>
            <WeightSlider
              subjects={subjects}
              onChange={handleWeightChange}
              totalPercent={totalPercent}
            />
          </div>

          <Button
            className="w-full"
            disabled={totalPercent !== 100 || saving || !targetDate}
            onClick={handleSave}
          >
            {saving ? (
              "저장 중..."
            ) : (
              <>
                <Save className="size-4" />
                변경 저장 & 스케줄 재계산
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* 계정 */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">계정</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <Dialog open={resetOpen} onOpenChange={setResetOpen}>
            <DialogTrigger asChild>
              <Button variant="destructive" className="w-full">
                <RotateCcw className="size-4" />
                데이터 초기화
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>데이터 초기화</DialogTitle>
                <DialogDescription>
                  모든 학습 계획, 과목, 진행 기록이 삭제됩니다. 이 작업은 되돌릴
                  수 없습니다.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button variant="outline" onClick={() => setResetOpen(false)}>
                  취소
                </Button>
                <Button variant="destructive" onClick={handleReset}>
                  초기화
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Button variant="outline" className="w-full" onClick={handleLogout}>
            <LogOut className="size-4" />
            로그아웃
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
