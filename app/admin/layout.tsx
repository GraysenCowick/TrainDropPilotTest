import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "graysencowick67@gmail.com";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || user.email !== ADMIN_EMAIL) {
    redirect("/dashboard");
  }

  return <>{children}</>;
}
