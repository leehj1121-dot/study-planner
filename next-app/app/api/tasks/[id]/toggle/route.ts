import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function PATCH(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  // 현재 상태 조회
  const { data: task } = await supabase
    .from("tasks")
    .select("completed")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (!task) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // 토글
  const { data, error } = await supabase
    .from("tasks")
    .update({ completed: !task.completed })
    .eq("id", id)
    .eq("user_id", user.id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
