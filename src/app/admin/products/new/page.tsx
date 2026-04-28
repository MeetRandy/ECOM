"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ProductForm, type ProductFormData } from "../ProductForm";
import type { Category } from "@/db/schema/products";

export default function NewProductPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<
    Pick<Category, "id" | "name">[]
  >([]);

  useEffect(() => {
    fetch("/api/admin/categories")
      .then((r) => r.json())
      .then((data) => setCategories(data ?? []))
      .catch(() => {});
  }, []);

  const handleSave = async (data: ProductFormData) => {
    const res = await fetch("/api/admin/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const json = await res.json().catch(() => ({}));
      return { error: json.error ?? "Failed to save product" };
    }
    const created = await res.json();
    router.push(`/admin/products/${created.id}`);
    return {};
  };

  return <ProductForm categories={categories} onSave={handleSave} />;
}
