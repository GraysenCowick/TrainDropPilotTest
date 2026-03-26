import { redirect } from "next/navigation";
import { DashboardNav } from "@/components/dashboard-nav";
import { ToastProvider } from "@/components/ui/toast";
import { ErrorBoundary } from "@/components/error-boundary";
import { PresenceBeacon } from "@/components/presence-beacon";
import { createClient, createAdminClient } from "@/lib/supabase/server";

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

  // Guarantee profile exists — fallback in case DB trigger failed on signup
  const admin = await createAdminClient();
  await (admin as any).from("profiles").upsert(
    { id: user.id, email: user.email },
    { onConflict: "id", ignoreDuplicates: true }
  );

  // Apply business_name from signup metadata if the profile doesn't have one yet.
  // This handles the email-confirmation flow where the client has no session during signup
  // so the direct update is blocked by RLS — the metadata is always available server-side.
  const metaBusinessName = (user.user_metadata as { business_name?: string } | undefined)?.business_name;
  if (metaBusinessName) {
    await (admin as any)
      .from("profiles")
      .update({ business_name: metaBusinessName })
      .eq("id", user.id)
      .is("business_name", null);
  }

  const { data: rawProfile } = await supabase
    .from("profiles")
    .select("business_name, email")
    .eq("id", user.id)
    .single();

  const profile = rawProfile as { business_name: string | null; email: string } | null;

  return (
    <ToastProvider>
      <ErrorBoundary>
        <div className="min-h-screen bg-background">
          <DashboardNav
            businessName={profile?.business_name}
            email={profile?.email || user.email}
          />
          <PresenceBeacon />
        <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">{children}</main>
        </div>
      </ErrorBoundary>
    </ToastProvider>
  );
}
