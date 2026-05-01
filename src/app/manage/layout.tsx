import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

export default async function ManageLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirectTo=/manage");
  }

  async function signOut() {
    "use server";
    const supabase = await createClient();
    await supabase.auth.signOut();
    redirect("/login");
  }

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <Link href="/manage" className="text-xl font-bold text-gray-900">
          Manage Status
        </Link>
        <form action={signOut}>
          <button type="submit" className="text-sm text-gray-500 hover:text-gray-700 underline">
            Log out
          </button>
        </form>
      </header>
      {children}
    </div>
  );
}
