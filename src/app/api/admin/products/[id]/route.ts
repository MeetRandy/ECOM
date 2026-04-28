import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db/client";
import { products, variants } from "@/db/schema/products";
import { eq, and } from "drizzle-orm";
import { slugify } from "@/lib/slugify";
import { z } from "zod";

const variantSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  sku: z.string().optional(),
  barcode: z.string().optional(),
  price: z.string().min(1),
  compareAtPrice: z.string().optional(),
  cost: z.string().optional(),
  stockQty: z.string().default("0"),
  trackStock: z.boolean().default(true),
});

const patchSchema = z.object({
  name: z.string().min(1).optional(),
  slug: z.string().min(1).optional(),
  description: z.string().optional(),
  categoryId: z.string().optional(),
  status: z.enum(["draft", "active", "archived"]).optional(),
  featured: z.boolean().optional(),
  imageUrl: z.string().optional(),
  variants: z.array(variantSchema).optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.tenantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const tenantId = session.user.tenantId;
  const { id } = await params;

  const body = await req.json();
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const data = parsed.data;

  await db.transaction(async (tx) => {
    const productUpdate: Record<string, unknown> = { updatedAt: new Date() };
    if (data.name) productUpdate.name = data.name;
    if (data.slug) productUpdate.slug = slugify(data.slug);
    if (data.description !== undefined) productUpdate.description = data.description;
    if (data.categoryId !== undefined) productUpdate.categoryId = data.categoryId || null;
    if (data.status) productUpdate.status = data.status;
    if (data.featured !== undefined) productUpdate.featured = data.featured;
    if (data.imageUrl !== undefined) productUpdate.imageUrl = data.imageUrl || null;

    await tx
      .update(products)
      .set(productUpdate)
      .where(and(eq(products.id, id), eq(products.tenantId, tenantId)));

    if (data.variants) {
      // Delete existing variants and re-insert
      await tx
        .delete(variants)
        .where(and(eq(variants.productId, id), eq(variants.tenantId, tenantId)));

      for (const v of data.variants) {
        await tx.insert(variants).values({
          tenantId,
          productId: id,
          name: v.name,
          sku: v.sku || null,
          barcode: v.barcode || null,
          price: v.price,
          compareAtPrice: v.compareAtPrice || null,
          cost: v.cost || null,
          stockQty: parseInt(v.stockQty, 10),
          trackStock: v.trackStock,
        });
      }
    }
  });

  return NextResponse.json({ ok: true });
}
