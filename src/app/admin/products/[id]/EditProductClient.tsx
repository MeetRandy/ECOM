"use client";

import { useRouter } from "next/navigation";
import { ProductForm, type ProductFormData } from "../ProductForm";
import type { Product, Variant, Category } from "@/db/schema/products";

type Props = {
  product: Product & { variants: Variant[] };
  categories: Pick<Category, "id" | "name">[];
};

export function EditProductClient({ product, categories }: Props) {
  const router = useRouter();

  const handleSave = async (data: ProductFormData) => {
    const res = await fetch(`/api/admin/products/${product.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const json = await res.json().catch(() => ({}));
      return { error: json.error ?? "Failed to save product" };
    }
    router.refresh();
    return {};
  };

  return (
    <ProductForm product={product} categories={categories} onSave={handleSave} />
  );
}
