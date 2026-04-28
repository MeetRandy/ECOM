import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/client";
import { tenants } from "@/db/schema/tenants";
import { customers } from "@/db/schema/customers";
import { orders, orderLines } from "@/db/schema/orders";
import { eq, and } from "drizzle-orm";
import { round2, VAT_RATE } from "@/lib/money";
import { z } from "zod";

const lineSchema = z.object({
  variantId: z.string().optional(),
  productName: z.string(),
  variantName: z.string().optional(),
  sku: z.string().nullable().optional(),
  quantity: z.number().int().positive(),
  unitPrice: z.string(),
  lineTotal: z.string(),
});

const checkoutSchema = z.object({
  tenantSlug: z.string(),
  customerName: z.string().min(1),
  customerEmail: z.string().email(),
  customerPhone: z.string().optional(),
  shippingAddress: z.object({
    line1: z.string(),
    city: z.string(),
    province: z.string(),
    postalCode: z.string(),
    country: z.string().default("ZA"),
  }),
  paymentMethod: z.string(),
  lines: z.array(lineSchema).min(1),
});

function generateOrderNumber(): string {
  const now = new Date();
  const date = now
    .toISOString()
    .slice(0, 10)
    .replace(/-/g, "");
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `ECOM-${date}-${rand}`;
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = checkoutSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const data = parsed.data;

  // Resolve tenant
  const [tenant] = await db
    .select({ id: tenants.id })
    .from(tenants)
    .where(eq(tenants.slug, data.tenantSlug))
    .limit(1);

  if (!tenant) {
    return NextResponse.json({ error: "Store not found" }, { status: 404 });
  }

  const tenantId = tenant.id;

  const orderNumber = generateOrderNumber();

  const subtotal = data.lines.reduce(
    (sum, l) => sum + round2(Number(l.unitPrice) * l.quantity),
    0,
  );
  const vatTotal = round2((subtotal * VAT_RATE) / (1 + VAT_RATE));
  const total = round2(subtotal);

  const result = await db.transaction(async (tx) => {
    // Upsert customer
    let customerId: string | null = null;
    const [existingCustomer] = await tx
      .select({ id: customers.id })
      .from(customers)
      .where(
        and(
          eq(customers.tenantId, tenantId),
          eq(customers.email, data.customerEmail),
        ),
      )
      .limit(1);

    if (existingCustomer) {
      customerId = existingCustomer.id;
    } else {
      const [newCustomer] = await tx
        .insert(customers)
        .values({
          tenantId,
          email: data.customerEmail,
          name: data.customerName,
          phone: data.customerPhone ?? null,
          city: data.shippingAddress.city,
          province: data.shippingAddress.province,
          postalCode: data.shippingAddress.postalCode,
        })
        .returning({ id: customers.id });
      customerId = newCustomer.id;
    }

    // Create order
    const [order] = await tx
      .insert(orders)
      .values({
        tenantId,
        customerId,
        orderNumber,
        status: "pending",
        subtotal: String(subtotal),
        discountTotal: "0",
        shippingTotal: "0",
        vatTotal: String(vatTotal),
        total: String(total),
        currency: "ZAR",
        paymentStatus: "unpaid",
        paymentMethod: data.paymentMethod,
        shippingAddressSnapshot: data.shippingAddress,
      })
      .returning({ id: orders.id, orderNumber: orders.orderNumber });

    // Create order lines
    for (const line of data.lines) {
      await tx.insert(orderLines).values({
        tenantId,
        orderId: order.id,
        variantId: line.variantId ?? null,
        productName: line.productName,
        variantName: line.variantName ?? null,
        sku: line.sku ?? null,
        quantity: line.quantity,
        unitPrice: line.unitPrice,
        discount: "0",
        lineTotal: line.lineTotal,
      });
    }

    return order;
  });

  return NextResponse.json(
    { orderNumber: result.orderNumber, orderId: result.id },
    { status: 201 },
  );
}
