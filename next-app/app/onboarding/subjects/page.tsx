"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SubjectInput } from "@/components/subject-input";
import { ArrowRight } from "lucide-react";

interface Subject {
  id: string;
  name: string;
}

export default function SubjectsPage() {
  const router = useRouter();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [planId, setPlanId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function init() {
      // 플랜이 없으면 생성
      let plan = await fetch("/api/plans").then((r) => r.json());
      if (!plan?.id) {
        plan = await fetch("/api/plans", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            target_date: new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0],
            daily_hours: 3,
          }),
        }).then((r) => r.json());
      }
      setPlanId(plan.id);

      // 기존 과목 조회
      const existingSubjects = await fetch("/api/subjects").then((r) => r.json());
      if (Array.isArray(existingSubjects)) {
        setSubjects(existingSubjects);
      }
      setLoading(false);
    }
    init();
  }, []);

  const handleAdd = async (name: string) => {
    if (!planId) return;
    const res = await fetch("/api/subjects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, plan_id: planId }),
    });
    const newSubject = await res.json();
    setSubjects((prev) => [...prev, newSubject]);
  };

  const handleRemove = async (id: string) => {
    await fetch(`/api/subjects/${id}`, { method: "DELETE" });
    setSubjects((prev) => prev.filter((s) => s.id !== id));
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
        <div className="text-muted-foreground mb-1 text-xs font-medium">1 / 3</div>
        <CardTitle className="text-xl">학습 과목 입력</CardTitle>
        <CardDescription>공부할 과목들을 추가해주세요.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <SubjectInput subjects={subjects} onAdd={handleAdd} onRemove={handleRemove} />
        <Button
          className="w-full"
          disabled={subjects.length === 0}
          onClick={() => router.push("/onboarding/date")}
        >
          다음
          <ArrowRight className="size-4" />
        </Button>
      </CardContent>
    </Card>
  );
}
