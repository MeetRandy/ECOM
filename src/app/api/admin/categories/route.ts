import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db/client";
import { categories } from "@/db/schema/products";
import { eq } from "drizzle-orm";

export async function GET() {
  const session = await auth();
  if (!session?.user?.tenantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rows = await db
    .select({ id: categories.id, name: categories.name })
    .from(categories)
    .where(eq(categories.tenantId, session.user.tenantId))
    .orderBy(categories.displayOrder);

  return NextResponse.json(rows);
}
