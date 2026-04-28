"use server";

import { z } from "zod";
import bcrypt from "bcryptjs";
import { db } from "@/db/client";
import { tenants, users } from "@/db/schema/tenants";
import { storeSettings } from "@/db/schema/store";
import { slugify } from "@/lib/slugify";
import { eq } from "drizzle-orm";
import { signIn } from "@/auth";

const schema = z.object({
  storeName: z.string().min(2, "Store name must be at least 2 characters"),
  slug: z
    .string()
    .min(2, "Slug must be at least 2 characters")
    .max(40, "Slug must be at most 40 characters")
    .regex(/^[a-z0-9-]+$/, "Slug may only contain lowercase letters, numbers, and hyphens"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export type SignUpState =
  | { ok: false; errors: Record<string, string[]>; message?: string }
  | null;

export async function signUpAction(
  _prev: SignUpState,
  formData: FormData,
): Promise<SignUpState> {
  const raw = {
    storeName: String(formData.get("storeName") ?? ""),
    slug: String(formData.get("slug") ?? ""),
    email: String(formData.get("email") ?? ""),
    password: String(formData.get("password") ?? ""),
  };

  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, errors: parsed.error.flatten().fieldErrors as Record<string, string[]> };
  }

  const { storeName, slug, email, password } = parsed.data;

  // Check slug uniqueness
  const [existingTenant] = await db
    .select({ id: tenants.id })
    .from(tenants)
    .where(eq(tenants.slug, slug))
    .limit(1);

  if (existingTenant) {
    return {
      ok: false,
      errors: { slug: ["This store URL is already taken. Choose another."] },
    };
  }

  // Check email uniqueness
  const [existingUser] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (existingUser) {
    return {
      ok: false,
      errors: { email: ["An account with this email already exists."] },
    };
  }

  const passwordHash = await bcrypt.hash(password, 12);

  // Create tenant + user + store settings in a transaction
  await db.transaction(async (tx) => {
    const [tenant] = await tx
      .insert(tenants)
      .values({ name: storeName, slug })
      .returning({ id: tenants.id });

    await tx.insert(users).values({
      tenantId: tenant.id,
      email,
      name: email.split("@")[0],
      role: "owner",
      passwordHash,
    });

    await tx.insert(storeSettings).values({
      tenantId: tenant.id,
      storeName,
      storeEmail: email,
    });
  });

  // Sign in immediately after registration
  await signIn("credentials", {
    email,
    password,
    redirectTo: "/admin",
  });

  return null;
}

export async function autoSlug(storeName: string): Promise<string> {
  return slugify(storeName);
}
