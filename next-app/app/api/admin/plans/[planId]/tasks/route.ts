import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

// 관리자가 태스크 생성 (자동 생성 또는 수동)
export async function POST(
  request: Request,
  { params }: { params: Promise<{ planId: string }> },
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || user.id !== process.env.ADMIN_USER_ID) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { planId } = await params;
  const body = await request.json();
  const admin = createAdminClient();

  // 플랜 조회
  const { data: plan } = await admin
    .from("plans")
    .select("*")
    .eq("id", planId)
    .single();

  if (!plan) return NextResponse.json({ error: "Plan not found" }, { status: 404 });

  // mode: "auto" → 알고리즘 생성 / "manual" → 직접 입력
  if (body.mode === "auto") {
    const { data: subjects } = await admin
      .from("subjects")
      .select("*")
      .eq("plan_id", planId);

    if (!subjects || subjects.length === 0) {
      return NextResponse.json({ error: "No subjects" }, { status: 400 });
    }

    // 기존 태스크 삭제
    await admin.from("tasks").delete().eq("plan_id", planId);

    const today = new Date();
    today.setHours(0, 0, 0, 0);
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
    while (current <= target) {
      const dateStr = current.toISOString().split("T")[0];
      for (const subject of subjects) {
        const duration =
          Math.round(((plan.daily_hours * subject.weight) / 100) * 10) / 10;
        if (duration > 0) {
          tasks.push({
            plan_id: planId,
            user_id: plan.user_id,
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
      const { error } = await admin.from("tasks").insert(tasks);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ created: tasks.length });
  }

  // manual: 직접 태스크 배열 전달
  if (body.tasks && Array.isArray(body.tasks)) {
    await admin.from("tasks").delete().eq("plan_id", planId);

    const tasks = body.tasks.map((t: { subject_id: string; date: string; duration: number }) => ({
      plan_id: planId,
      user_id: plan.user_id,
      subject_id: t.subject_id,
      date: t.date,
      duration: t.duration,
      completed: false,
    }));

    const { error } = await admin.from("tasks").insert(tasks);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ created: tasks.length });
  }

  return NextResponse.json({ error: "Invalid mode" }, { status: 400 });
}
