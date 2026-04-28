import "dotenv/config";
import * as fs from "fs";
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import * as schema from "../schema";
import { tenants } from "../schema/tenants";
import { products, variants } from "../schema/products";
import { eq } from "drizzle-orm";

const sql = postgres(process.env.DATABASE_URL!);
const db = drizzle(sql, { schema });

const TENANT_SLUG = "veldcom";
const CSV_FILES = [
  "/Users/rendani/Downloads/Stockonhanddetail.1.csv",
  "/Users/rendani/Downloads/StockOnHandDetailed.csv",
];

// Column indices (0-based)
const COL_BRAND  = 3;
const COL_MODEL  = 4;
const COL_QTY    = 5;
const COL_COST   = 6;
const COL_TICKET = 9;

const SKIP = /Total|Grand Total|No of Items|Stock Code|VeldCom|Cash Converters|STOCK|Item Category|Item Status|Item Origin|Grouping|^nan$/i;

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[()]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 100);
}

function toTitleCase(str: string): string {
  return str.toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
}

function cleanName(query: string): string {
  const words = query.trim().split(/\s+/);
  const half = Math.floor(words.length / 2);
  if (words.length >= 4 && words.length % 2 === 0) {
    const first = words.slice(0, half).join(" ").toLowerCase();
    const second = words.slice(half).join(" ").toLowerCase();
    if (first === second) return toTitleCase(words.slice(0, half).join(" "));
  }
  return toTitleCase(query);
}

function parsePrice(raw: string): string | null {
  const cleaned = raw.replace(/[,"]/g, "").trim();
  const n = parseFloat(cleaned);
  return isNaN(n) ? null : n.toFixed(2);
}

interface PriceRow {
  slug: string;
  price: string;
  cost: string;
  qty: number;
}

function parseCsvFile(filePath: string): PriceRow[] {
  const lines = fs.readFileSync(filePath, "utf-8").replace(/\r/g, "").split("\n");
  const rows: PriceRow[] = [];

  for (const line of lines) {
    // Split respecting quoted fields
    const cols: string[] = [];
    let inQuote = false;
    let cell = "";
    for (const ch of line) {
      if (ch === '"') { inQuote = !inQuote; }
      else if (ch === "," && !inQuote) { cols.push(cell); cell = ""; }
      else { cell += ch; }
    }
    cols.push(cell);

    const brand  = (cols[COL_BRAND]  ?? "").trim();
    const model  = (cols[COL_MODEL]  ?? "").trim();
    const ticket = (cols[COL_TICKET] ?? "").trim();
    const cost   = (cols[COL_COST]   ?? "").trim();
    const qty    = parseInt((cols[COL_QTY] ?? "0").replace(/[,"]/g, "").trim()) || 0;

    if (!brand || !ticket || SKIP.test(brand) || SKIP.test(model)) continue;

    const query = model ? `${brand} ${model}` : brand;
    const slug  = slugify(cleanName(query));
    const price = parsePrice(ticket);
    const costVal = parsePrice(cost);

    if (price && slug) {
      rows.push({ slug, price, cost: costVal ?? "0.00", qty });
    }
  }

  return rows;
}

async function main() {
  console.log("=".repeat(60));
  console.log("  UPDATE PRICES FROM CSV");
  console.log("=".repeat(60));

  const [tenant] = await db.select().from(tenants).where(eq(tenants.slug, TENANT_SLUG));
  if (!tenant) throw new Error(`Tenant '${TENANT_SLUG}' not found`);

  // Load all products for this tenant (slug → id)
  const allProducts = await db.select({ id: products.id, slug: products.slug, name: products.name })
    .from(products)
    .where(eq(products.tenantId, tenant.id));

  const productMap = new Map(allProducts.map(p => [p.slug, p]));

  // Parse all CSVs — sum qty across files, last file wins for price/cost
  const priceMap = new Map<string, PriceRow>();
  for (const file of CSV_FILES) {
    const rows = parseCsvFile(file);
    for (const row of rows) {
      const existing = priceMap.get(row.slug);
      priceMap.set(row.slug, {
        ...row,
        qty: (existing?.qty ?? 0) + row.qty,
      });
    }
    console.log(`\nParsed ${rows.length} rows from ${file.split("/").pop()}`);
  }

  let updated = 0;
  let missed = 0;

  for (const [slug, row] of priceMap) {
    const product = productMap.get(slug);
    if (!product) {
      console.log(`  [NO MATCH] ${slug}`);
      missed++;
      continue;
    }

    await db
      .update(variants)
      .set({ price: row.price, cost: row.cost, stockQty: row.qty })
      .where(eq(variants.productId, product.id));

    console.log(`  ✓ ${product.name} → R${row.price} (cost R${row.cost}, qty ${row.qty})`);
    updated++;
  }

  console.log(`\n${"=".repeat(60)}`);
  console.log(`  ${updated} updated, ${missed} not matched.`);
  console.log(`${"=".repeat(60)}\n`);

  await sql.end();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
