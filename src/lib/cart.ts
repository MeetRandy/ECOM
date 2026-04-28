export type CartLine = {
  variantId: string;
  productId: string;
  productName: string;
  variantName: string;
  sku: string | null;
  imageUrl: string | null;
  price: number;
  compareAtPrice: number | null;
  quantity: number;
};

export type Cart = {
  lines: CartLine[];
  tenantSlug: string;
};

function cartKey(tenantSlug: string): string {
  return `ecom_cart_${tenantSlug}`;
}

export function loadCart(tenantSlug: string): Cart {
  if (typeof window === "undefined") return { lines: [], tenantSlug };
  try {
    const raw = localStorage.getItem(cartKey(tenantSlug));
    if (!raw) return { lines: [], tenantSlug };
    return JSON.parse(raw) as Cart;
  } catch {
    return { lines: [], tenantSlug };
  }
}

export function saveCart(cart: Cart): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(cartKey(cart.tenantSlug), JSON.stringify(cart));
}

export function addToCart(tenantSlug: string, line: CartLine): Cart {
  const cart = loadCart(tenantSlug);
  const existing = cart.lines.find((l) => l.variantId === line.variantId);
  if (existing) {
    existing.quantity += line.quantity;
  } else {
    cart.lines.push(line);
  }
  saveCart(cart);
  return cart;
}

export function updateQuantity(
  tenantSlug: string,
  variantId: string,
  quantity: number,
): Cart {
  const cart = loadCart(tenantSlug);
  if (quantity <= 0) {
    cart.lines = cart.lines.filter((l) => l.variantId !== variantId);
  } else {
    const line = cart.lines.find((l) => l.variantId === variantId);
    if (line) line.quantity = quantity;
  }
  saveCart(cart);
  return cart;
}

export function clearCart(tenantSlug: string): Cart {
  const cart: Cart = { lines: [], tenantSlug };
  saveCart(cart);
  return cart;
}

export function cartSubtotal(cart: Cart): number {
  return cart.lines.reduce((sum, l) => sum + l.price * l.quantity, 0);
}

export function cartLineCount(cart: Cart): number {
  return cart.lines.reduce((sum, l) => sum + l.quantity, 0);
}
