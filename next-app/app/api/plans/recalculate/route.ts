import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function PUT() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: plan } = await supabase
    .from("plans")
    .select("*")
    .eq("user_id", user.id)
    .single();

  if (!plan) return NextResponse.json({ error: "Plan not found" }, { status: 404 });

  const { data: subjects } = await supabase
    .from("subjects")
    .select("*")
    .eq("plan_id", plan.id);

  if (!subjects || subjects.length === 0) {
    return NextResponse.json({ error: "No subjects" }, { status: 400 });
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = today.toISOString().split("T")[0];

  // 오늘 이후 미완료 태스크 삭제
  await supabase
    .from("tasks")
    .delete()
    .eq("plan_id", plan.id)
    .gt("date", todayStr);

  // 내일부터 targetDate까지 새로 생성
  const target = new Date(plan.target_date);
  const tasks: {
    plan_id: string;
    user_id: string;
    subject_id: string;
    date: string;
    duration: number;
    completed: boolean;
  }[] = [];

  const current = new Date(today);
  current.setDate(current.getDate() + 1);

  while (current <= target) {
    const dateStr = current.toISOString().split("T")[0];
    for (const subject of subjects) {
      const duration =
        Math.round(((plan.daily_hours * subject.weight) / 100) * 10) / 10;
      if (duration > 0) {
        tasks.push({
          plan_id: plan.id,
          user_id: user.id,
          subject_id: subject.id,
          date: dateStr,
          duration,
          completed: false,
        });
      }
    }
    current.setDate(current.getDate() + 1);
  }

  if (tasks.length > 0) {
    const { error } = await supabase.from("tasks").insert(tasks);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ recalculated: tasks.length });
}
