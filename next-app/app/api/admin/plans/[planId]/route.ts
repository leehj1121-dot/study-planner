import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

export async function GET(
  _request: Request,
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
  const admin = createAdminClient();

  const { data: plan } = await admin
    .from("plans")
    .select("*, subjects(*)")
    .eq("id", planId)
    .single();

  if (!plan) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // 기존 태스크도 조회
  const { data: tasks } = await admin
    .from("tasks")
    .select("*, subjects(name)")
    .eq("plan_id", planId)
    .order("date")
    .order("created_at");

  return NextResponse.json({
    ...plan,
    tasks: (tasks || []).map((t) => {
      const subjects = t.subjects as unknown as { name: string } | null;
      return { ...t, subject_name: subjects?.name };
    }),
  });
}
