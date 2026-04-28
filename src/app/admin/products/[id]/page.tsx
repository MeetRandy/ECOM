import { eq } from "drizzle-orm";
import { withTenant } from "@/db/client";
import { requireTenantId } from "@/lib/tenant";
import { requireAdmin } from "@/lib/auth-guards";
import { products, variants, categories } from "@/db/schema/products";
import { notFound } from "next/navigation";
import { EditProductClient } from "./EditProductClient";

export const dynamic = "force-dynamic";

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const tenantId = await requireTenantId();
  const { id } = await params;

  const data = await withTenant(tenantId, async (tx) => {
    const [product] = await tx
      .select()
      .from(products)
      .where(eq(products.id, id))
      .limit(1);

    if (!product || product.tenantId !== tenantId) return null;

    const variantRows = await tx
      .select()
      .from(variants)
      .where(eq(variants.productId, id));

    const categoryRows = await tx
      .select({ id: categories.id, name: categories.name })
      .from(categories)
      .where(eq(categories.tenantId, tenantId));

    return { product: { ...product, variants: variantRows }, categories: categoryRows };
  });

  if (!data) notFound();

  return (
    <EditProductClient
      product={data.product}
      categories={data.categories}
    />
  );
}
