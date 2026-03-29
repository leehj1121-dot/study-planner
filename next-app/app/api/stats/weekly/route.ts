import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // 이번 주 월~일 계산
  const now = new Date();
  const dayOfWeek = now.getDay(); // 0=일, 1=월, ...
  const monday = new Date(now);
  monday.setDate(now.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
  monday.setHours(0, 0, 0, 0);

  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);

  const startDate = monday.toISOString().split("T")[0];
  const endDate = sunday.toISOString().split("T")[0];

  const { data: tasks } = await supabase
    .from("tasks")
    .select("date, completed")
    .eq("user_id", user.id)
    .gte("date", startDate)
    .lte("date", endDate);

  const dayLabels = ["월", "화", "수", "목", "금", "토", "일"];
  const weekly = [];

  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    const dateStr = d.toISOString().split("T")[0];

    const dayTasks = (tasks || []).filter((t) => t.date === dateStr);
    const total = dayTasks.length;
    const completed = dayTasks.filter((t) => t.completed).length;

    weekly.push({
      label: dayLabels[i],
      date: dateStr,
      total,
      completed,
      percent: total > 0 ? Math.round((completed / total) * 100) : 0,
    });
  }

  return NextResponse.json(weekly);
}
