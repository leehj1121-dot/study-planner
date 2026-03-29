import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function DELETE() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // tasks → subjects → plans 순서로 삭제 (FK 의존성)
  // plans CASCADE로 자동 삭제되지만 명시적으로
  const { data: plan } = await supabase
    .from("plans")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (plan) {
    await supabase.from("tasks").delete().eq("plan_id", plan.id);
    await supabase.from("subjects").delete().eq("plan_id", plan.id);
    await supabase.from("plans").delete().eq("id", plan.id);
  }

  return NextResponse.json({ success: true });
}
