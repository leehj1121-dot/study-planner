import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function Page() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: plan } = await supabase
    .from("plans")
    .select("is_onboarded")
    .eq("user_id", user.id)
    .single();

  if (plan?.is_onboarded) {
    redirect("/dashboard");
  } else {
    redirect("/onboarding/subjects");
  }
}
