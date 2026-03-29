"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, BookOpen, CalendarDays } from "lucide-react";

interface Subject {
  id: string;
  name: string;
  weight: number;
}

interface Submission {
  id: string;
  user_id: string;
  user_email: string;
  target_date: string;
  daily_hours: number;
  status: string;
  created_at: string;
  subjects: Subject[];
}

export default function AdminPage() {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/submissions")
      .then((r) => r.json())
      .then((data) => {
        setSubmissions(Array.isArray(data) ? data : []);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return <p className="text-muted-foreground py-8 text-center">로딩 중...</p>;
  }

  const pending = submissions.filter((s) => s.status === "pending");
  const assigned = submissions.filter((s) => s.status === "assigned");

  return (
    <div className="space-y-6">
      <div>
        <h2 className="mb-3 text-lg font-semibold">
          대기 중인 요청 ({pending.length})
        </h2>
        {pending.length === 0 ? (
          <p className="text-muted-foreground text-sm">새로운 요청이 없습니다.</p>
        ) : (
          <div className="space-y-3">
            {pending.map((s) => (
              <SubmissionCard key={s.id} submission={s} />
            ))}
          </div>
        )}
      </div>

      {assigned.length > 0 && (
        <div>
          <h2 className="mb-3 text-lg font-semibold">
            전달 완료 ({assigned.length})
          </h2>
          <div className="space-y-3">
            {assigned.map((s) => (
              <SubmissionCard key={s.id} submission={s} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function SubmissionCard({ submission }: { submission: Submission }) {
  const statusColor =
    submission.status === "pending"
      ? "bg-yellow-100 text-yellow-800"
      : "bg-green-100 text-green-800";
  const statusLabel = submission.status === "pending" ? "대기 중" : "전달 완료";

  return (
    <Link href={`/admin/plans/${submission.id}`}>
      <Card className="transition-colors hover:bg-muted/30">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">
              {submission.user_email || "사용자"}
            </CardTitle>
            <Badge className={statusColor}>{statusLabel}</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <BookOpen className="size-3.5" />
              {submission.subjects?.length || 0}과목
            </span>
            <span className="flex items-center gap-1">
              <Clock className="size-3.5" />
              {submission.daily_hours}시간/일
            </span>
            <span className="flex items-center gap-1">
              <CalendarDays className="size-3.5" />
              ~{submission.target_date}
            </span>
          </div>
          {submission.subjects?.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {submission.subjects.map((s) => (
                <Badge key={s.id} variant="secondary" className="text-xs">
                  {s.name} {s.weight}%
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
