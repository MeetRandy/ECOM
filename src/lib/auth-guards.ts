import { redirect } from "next/navigation";
import { auth } from "@/auth";

/**
 * Ensures the current session belongs to an `owner` or `manager`.
 * Redirects to `/sign-in` otherwise. Use in admin routes and server actions.
 */
export async function requireAdmin(): Promise<void> {
  const session = await auth();
  const role = session?.user?.role;
  if (!session?.user || (role !== "owner" && role !== "manager")) {
    redirect("/sign-in");
  }
}

/**
 * Ensures the current session has any authenticated user.
 * Redirects to `/sign-in` otherwise. Use in customer account routes.
 */
export async function requireCustomer(): Promise<void> {
  const session = await auth();
  if (!session?.user) {
    redirect("/sign-in");
  }
}
