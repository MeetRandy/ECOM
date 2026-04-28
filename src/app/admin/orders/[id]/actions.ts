"use server";

import { eq, and, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { withTenant } from "@/db/client";
import { requireTenantId } from "@/lib/tenant";
import { requireAdmin } from "@/lib/auth-guards";
import { orders, orderLines } from "@/db/schema/orders";
import { variants } from "@/db/schema/products";

export async function updateOrderStatus(orderId: string, status: string) {
  await requireAdmin();
  const tenantId = await requireTenantId();

  await withTenant(tenantId, async (tx) => {
    await tx
      .update(orders)
      .set({
        status: status as "pending" | "confirmed" | "processing" | "shipped" | "delivered" | "cancelled" | "refunded",
        updatedAt: new Date(),
      })
      .where(and(eq(orders.id, orderId), eq(orders.tenantId, tenantId)));
  });

  revalidatePath(`/admin/orders/${orderId}`);
  revalidatePath("/admin/orders");
}

export async function updatePaymentStatus(orderId: string, paymentStatus: string) {
  await requireAdmin();
  const tenantId = await requireTenantId();

  await withTenant(tenantId, async (tx) => {
    // Fetch current status before updating
    const [current] = await tx
      .select({ paymentStatus: orders.paymentStatus })
      .from(orders)
      .where(and(eq(orders.id, orderId), eq(orders.tenantId, tenantId)));

    if (!current) return;

    await tx
      .update(orders)
      .set({
        paymentStatus: paymentStatus as "unpaid" | "paid" | "partial" | "refunded",
        updatedAt: new Date(),
      })
      .where(and(eq(orders.id, orderId), eq(orders.tenantId, tenantId)));

    // Decrement stock only when transitioning TO paid
    if (paymentStatus === "paid" && current.paymentStatus !== "paid") {
      const lines = await tx
        .select({ variantId: orderLines.variantId, quantity: orderLines.quantity })
        .from(orderLines)
        .where(eq(orderLines.orderId, orderId));

      for (const line of lines) {
        if (!line.variantId) continue;
        await tx
          .update(variants)
          .set({
            stockQty: sql`GREATEST(${variants.stockQty} - ${line.quantity}, 0)`,
          })
          .where(eq(variants.id, line.variantId));
      }
    }
  });

  revalidatePath(`/admin/orders/${orderId}`);
  revalidatePath("/admin/orders");
}
