import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const today = new Date().toISOString().split("T")[0];

  // 오늘 태스크
  const { data: todayTasks } = await supabase
    .from("tasks")
    .select("*, subjects(name)")
    .eq("user_id", user.id)
    .eq("date", today)
    .order("created_at");

  // 이월 태스크 (과거 미완료)
  const { data: carryOverTasks } = await supabase
    .from("tasks")
    .select("*, subjects(name)")
    .eq("user_id", user.id)
    .eq("completed", false)
    .lt("date", today)
    .order("date");

  const formatted = [
    ...(carryOverTasks || []).map((t) => ({
      ...t,
      subject_name: t.subjects?.name,
      carry_over: true,
    })),
    ...(todayTasks || []).map((t) => ({
      ...t,
      subject_name: t.subjects?.name,
      carry_over: false,
    })),
  ];

  return NextResponse.json(formatted);
}
