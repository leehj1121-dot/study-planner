import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const month = searchParams.get("month"); // 2026-04
  const date = searchParams.get("date"); // 2026-04-15

  if (date) {
    const { data } = await supabase
      .from("tasks")
      .select("*, subjects(name)")
      .eq("user_id", user.id)
      .eq("date", date)
      .order("created_at");

    return NextResponse.json(
      (data || []).map((t) => ({ ...t, subject_name: t.subjects?.name })),
    );
  }

  if (month) {
    const startDate = `${month}-01`;
    const [year, mon] = month.split("-").map(Number);
    const lastDay = new Date(year, mon, 0).getDate();
    const endDate = `${month}-${String(lastDay).padStart(2, "0")}`;

    const { data } = await supabase
      .from("tasks")
      .select("id, date, completed, subject_id, duration, subjects(name)")
      .eq("user_id", user.id)
      .gte("date", startDate)
      .lte("date", endDate)
      .order("date");

    // 날짜별로 그룹핑
    const grouped: Record<
      string,
      { total: number; completed: number; subjects: string[] }
    > = {};

    for (const t of data || []) {
      if (!grouped[t.date]) {
        grouped[t.date] = { total: 0, completed: 0, subjects: [] };
      }
      grouped[t.date].total++;
      if (t.completed) grouped[t.date].completed++;
      const subjects = t.subjects as unknown as { name: string } | null;
      const name = subjects?.name;
      if (name && !grouped[t.date].subjects.includes(name)) {
        grouped[t.date].subjects.push(name);
      }
    }

    return NextResponse.json(grouped);
  }

  return NextResponse.json({ error: "month or date param required" }, { status: 400 });
}
