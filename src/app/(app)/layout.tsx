import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { SidebarNav } from "@/components/sidebar-nav";
import { Topbar } from "@/components/topbar";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  return (
    <div className="flex min-h-screen w-full">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 border-r bg-background md:flex">
        <SidebarNav />
      </aside>
      <div className="flex min-w-0 flex-1 flex-col md:pl-64">
        <Topbar
          name={session.name}
          companyName={session.companyName}
          email={session.email}
        />
        <main className="flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
