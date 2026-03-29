import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // 온보딩 완료 여부 확인
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const { data: plan } = await supabase
          .from("plans")
          .select("is_onboarded")
          .eq("user_id", user.id)
          .single();

        if (plan?.is_onboarded) {
          return NextResponse.redirect(`${origin}/dashboard`);
        }
      }

      return NextResponse.redirect(`${origin}/onboarding/subjects`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth`);
}
