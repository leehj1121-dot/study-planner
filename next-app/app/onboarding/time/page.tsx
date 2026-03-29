"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { WeightSlider } from "@/components/weight-slider";
import { ArrowLeft, Sparkles } from "lucide-react";

interface SubjectWeight {
  id: string;
  name: string;
  weight: number;
}

export default function TimePage() {
  const router = useRouter();
  const [dailyHours, setDailyHours] = useState(3);
  const [subjects, setSubjects] = useState<SubjectWeight[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  const totalPercent = subjects.reduce((sum, s) => sum + s.weight, 0);

  useEffect(() => {
    async function load() {
      const [plan, subs] = await Promise.all([
        fetch("/api/plans").then((r) => r.json()),
        fetch("/api/subjects").then((r) => r.json()),
      ]);

      if (plan?.daily_hours) setDailyHours(plan.daily_hours);

      if (Array.isArray(subs) && subs.length > 0) {
        const hasWeights = subs.some((s: SubjectWeight) => s.weight > 0);
        if (hasWeights) {
          setSubjects(subs.map((s: SubjectWeight) => ({ id: s.id, name: s.name, weight: s.weight })));
        } else {
          // 균등 배분
          const equalWeight = Math.floor(100 / subs.length);
          const remainder = 100 - equalWeight * subs.length;
          setSubjects(
            subs.map((s: SubjectWeight, i: number) => ({
              id: s.id,
              name: s.name,
              weight: equalWeight + (i === 0 ? remainder : 0),
            })),
          );
        }
      }
      setLoading(false);
    }
    load();
  }, []);

  const handleWeightChange = (id: string, weight: number) => {
    setSubjects((prev) => prev.map((s) => (s.id === id ? { ...s, weight } : s)));
  };

  const handleGenerate = async () => {
    if (totalPercent !== 100) return;
    setGenerating(true);

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

    // 가용시간 저장
    await fetch("/api/plans", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ daily_hours: dailyHours }),
    });

    // 스케줄 생성
    await fetch("/api/plans/generate", { method: "POST" });

    router.push("/dashboard");
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <p className="text-muted-foreground">로딩 중...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="text-muted-foreground mb-1 text-xs font-medium">3 / 3</div>
        <CardTitle className="text-xl">학습 시간 & 비중 설정</CardTitle>
        <CardDescription>하루 가용 시간과 과목별 비중을 설정해주세요.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="daily-hours">하루 가용 학습 시간</Label>
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

        {totalPercent === 100 && (
          <div className="bg-muted space-y-1 rounded-lg p-4">
            <p className="text-muted-foreground text-xs">일별 학습 시간 미리보기</p>
            {subjects.map((s) => (
              <div key={s.id} className="flex justify-between text-sm">
                <span>{s.name}</span>
                <span className="font-medium">
                  {((dailyHours * s.weight) / 100).toFixed(1)}시간
                </span>
              </div>
            ))}
          </div>
        )}

        <div className="flex gap-3">
          <Button variant="outline" className="flex-1" onClick={() => router.push("/onboarding/date")}>
            <ArrowLeft className="size-4" />
            이전
          </Button>
          <Button
            className="flex-1"
            disabled={totalPercent !== 100 || dailyHours < 0.5 || generating}
            onClick={handleGenerate}
          >
            {generating ? (
              "생성 중..."
            ) : (
              <>
                <Sparkles className="size-4" />
                계획 생성
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
