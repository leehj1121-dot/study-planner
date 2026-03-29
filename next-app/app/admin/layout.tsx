import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || user.id !== process.env.ADMIN_USER_ID) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-svh">
      <header className="bg-background sticky top-0 z-10 border-b px-4 py-3">
        <div className="mx-auto flex max-w-4xl items-center justify-between">
          <h1 className="font-heading text-lg font-bold">관리자</h1>
          <a href="/dashboard" className="text-muted-foreground text-sm hover:underline">
            내 대시보드 →
          </a>
        </div>
      </header>
      <main className="mx-auto max-w-4xl p-4">{children}</main>
    </div>
  );
}
