import { redirect } from "next/navigation";
import { DashboardNav } from "@/components/dashboard-nav";
import { ToastProvider } from "@/components/ui/toast";
import { createClient } from "@/lib/supabase/server";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: rawProfile } = await supabase
    .from("profiles")
    .select("business_name, email")
    .eq("id", user.id)
    .single();

  const profile = rawProfile as { business_name: string | null; email: string } | null;

  return (
    <ToastProvider>
      <div className="min-h-screen bg-background">
        <DashboardNav
          businessName={profile?.business_name}
          email={profile?.email || user.email}
        />
        <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">{children}</main>
      </div>
    </ToastProvider>
  );
}
