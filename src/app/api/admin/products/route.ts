import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db/client";
import { products, variants } from "@/db/schema/products";
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

const productSchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1),
  description: z.string().optional(),
  categoryId: z.string().optional(),
  status: z.enum(["draft", "active", "archived"]).default("draft"),
  featured: z.boolean().default(false),
  imageUrl: z.string().optional(),
  variants: z.array(variantSchema).min(1),
});

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.tenantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const tenantId = session.user.tenantId;

  const body = await req.json();
  const parsed = productSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const data = parsed.data;

  const result = await db.transaction(async (tx) => {
    const [product] = await tx
      .insert(products)
      .values({
        tenantId,
        name: data.name,
        slug: slugify(data.slug),
        description: data.description ?? null,
        categoryId: data.categoryId || null,
        status: data.status,
        featured: data.featured,
        imageUrl: data.imageUrl || null,
      })
      .returning();

    for (const v of data.variants) {
      await tx.insert(variants).values({
        tenantId,
        productId: product.id,
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

    return product;
  });

  return NextResponse.json(result, { status: 201 });
}
