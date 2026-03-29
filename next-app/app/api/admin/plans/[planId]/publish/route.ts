import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

// 관리자가 계획을 사용자에게 전달 (status → assigned)
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
  const body = await request.json().catch(() => ({}));
  const admin = createAdminClient();

  // 태스크가 있는지 확인
  const { count } = await admin
    .from("tasks")
    .select("id", { count: "exact", head: true })
    .eq("plan_id", planId);

  if (!count || count === 0) {
    return NextResponse.json({ error: "No tasks to publish" }, { status: 400 });
  }

  const { error } = await admin
    .from("plans")
    .update({
      status: "assigned",
      is_onboarded: true,
      admin_note: body.admin_note || null,
    })
    .eq("id", planId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}
