import { eq } from "drizzle-orm";
import { auth } from "@/auth";
import { db } from "@/db/client";
import { tenants } from "@/db/schema/tenants";
import { requireAdmin } from "@/lib/auth-guards";
import { AdminNav } from "./AdminNav";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAdmin();
  const session = await auth();

  let tenantName = "Admin";
  if (session?.user?.tenantId) {
    const [t] = await db
      .select({ name: tenants.name })
      .from(tenants)
      .where(eq(tenants.id, session.user.tenantId))
      .limit(1);
    if (t) tenantName = t.name;
  }

  return (
    <div
      style={{
        display: "flex",
        height: "100vh",
        overflow: "hidden",
        background: "var(--surface-2)",
      }}
    >
      <AdminNav
        tenantName={tenantName}
        userName={session?.user?.name ?? session?.user?.email ?? ""}
        userRole={session?.user?.role ?? "owner"}
      />
      <div className="v-scroll" style={{ flex: 1, overflow: "auto" }}>
        {children}
      </div>
    </div>
  );
}
