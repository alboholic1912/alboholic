import { createClient } from "@/lib/supabase/server";
import StudioShell from "@/components/StudioShell/StudioShell";

export default async function StudioLayout({ children }: LayoutProps<"/kalaja-cabb0da6">) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return <StudioShell userEmail={user?.email ?? null}>{children}</StudioShell>;
}
