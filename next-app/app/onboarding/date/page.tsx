"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, ArrowRight } from "lucide-react";

export default function DatePage() {
  const router = useRouter();
  const [targetDate, setTargetDate] = useState("");
  const [loading, setLoading] = useState(true);

  const today = new Date().toISOString().split("T")[0];

  const daysLeft =
    targetDate
      ? Math.ceil(
          (new Date(targetDate).getTime() - new Date(today).getTime()) / 86400000,
        )
      : 0;

  useEffect(() => {
    async function loadPlan() {
      const plan = await fetch("/api/plans").then((r) => r.json());
      if (plan?.target_date) {
        setTargetDate(plan.target_date);
      }
      setLoading(false);
    }
    loadPlan();
  }, []);

  const handleNext = async () => {
    await fetch("/api/plans", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ target_date: targetDate }),
    });
    router.push("/onboarding/time");
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
        <div className="text-muted-foreground mb-1 text-xs font-medium">2 / 3</div>
        <CardTitle className="text-xl">목표 날짜 설정</CardTitle>
        <CardDescription>시험일이나 마감일을 선택해주세요.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
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

        {targetDate && daysLeft > 0 && (
          <div className="bg-muted rounded-lg p-4 text-center">
            <p className="text-muted-foreground text-sm">남은 기간</p>
            <p className="text-2xl font-bold">{daysLeft}일</p>
          </div>
        )}

        <div className="flex gap-3">
          <Button variant="outline" className="flex-1" onClick={() => router.push("/onboarding/subjects")}>
            <ArrowLeft className="size-4" />
            이전
          </Button>
          <Button
            className="flex-1"
            disabled={!targetDate || daysLeft <= 0}
            onClick={handleNext}
          >
            다음
            <ArrowRight className="size-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
