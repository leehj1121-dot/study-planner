import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const today = new Date().toISOString().split("T")[0];

  // 오늘까지의 전체 태스크
  const { data: allTasks } = await supabase
    .from("tasks")
    .select("id, subject_id, completed, subjects(name)")
    .eq("user_id", user.id)
    .lte("date", today);

  if (!allTasks || allTasks.length === 0) {
    return NextResponse.json({
      total: 0,
      completed: 0,
      percent: 0,
      bySubject: [],
    });
  }

  const total = allTasks.length;
  const completed = allTasks.filter((t) => t.completed).length;
  const percent = Math.round((completed / total) * 100);

  // 과목별 달성률
  const subjectMap = new Map<
    string,
    { name: string; total: number; completed: number }
  >();

  for (const task of allTasks) {
    const sid = task.subject_id;
    const subjects = task.subjects as unknown as { name: string } | null;
    const name = subjects?.name || "알 수 없음";
    if (!subjectMap.has(sid)) {
      subjectMap.set(sid, { name, total: 0, completed: 0 });
    }
    const entry = subjectMap.get(sid)!;
    entry.total++;
    if (task.completed) entry.completed++;
  }

  const bySubject = Array.from(subjectMap.entries()).map(([id, data]) => ({
    id,
    name: data.name,
    total: data.total,
    completed: data.completed,
    percent: Math.round((data.completed / data.total) * 100),
  }));

  return NextResponse.json({ total, completed, percent, bySubject });
}
