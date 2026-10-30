import { getSessionUser } from "@/lib/supabase/dal";
import StudioShell from "@/components/StudioShell/StudioShell";

export default async function StudioLayout({ children }: LayoutProps<"/kalaja-cabb0da6">) {
  const user = await getSessionUser();

  return <StudioShell userEmail={user?.email ?? null}>{children}</StudioShell>;
}
