import "dotenv/config";
import * as fs from "fs";
import * as path from "path";
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import * as schema from "../schema";
import { tenants } from "../schema/tenants";
import { categories, products, variants } from "../schema/products";
import { eq } from "drizzle-orm";

const sql = postgres(process.env.DATABASE_URL!);
const db = drizzle(sql, { schema });

const TENANT_SLUG = "veldcom";
const CSV_PATH = path.resolve(process.cwd(), "python/products_with_images.csv");

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

function parseCSV(content: string): Array<{ name: string; imageUrl: string }> {
  const lines = content.replace(/\r/g, "").split("\n").slice(1);
  const results: Array<{ name: string; imageUrl: string }> = [];

  for (const line of lines) {
    if (!line.trim()) continue;
    let query = "";
    let imageUrl = "";

    if (line.startsWith('"')) {
      const endQuote = line.indexOf('"', 1);
      query = line.slice(1, endQuote);
      imageUrl = line.slice(endQuote + 2);
    } else {
      const commaIdx = line.indexOf(",");
      query = line.slice(0, commaIdx);
      imageUrl = line.slice(commaIdx + 1);
    }

    if (imageUrl.startsWith('"') && imageUrl.endsWith('"')) {
      imageUrl = imageUrl.slice(1, -1);
    }

    if (query.trim()) {
      results.push({ name: cleanName(query), imageUrl: imageUrl.trim() });
    }
  }

  return results;
}

const CATEGORY_RULES: Array<[RegExp, string]> = [
  [/doppler|fetal|baby.monitor/i,                                                                                             "Baby & Kids"],
  [/ps4|xbox|nintendo|switch|controller|doubleshock|thumbstick|thumb.grip|redragon|xtrike|headset|miku|robot.bot|hatsune/i,  "Gaming"],
  [/canon|eos|dslr|camera/i,                                                                                                  "Photography"],
  [/sinotec|skyworth|samsung|lg.sqc|hisense|hdmi|earphone|soundbar|bass.d21|digimark|portable.ktv/i,                        "Electronics & TV"],
  [/bookshelf|book.shelf|bookshlef/i,                                                                                         "Furniture & Storage"],
  [/storage.rack|shoe.rack|storage.shoe/i,                                                                                    "Furniture & Storage"],
  [/camping|gas.stove|2.plate.stove|tent|portable.*fridge|electric.fridge|aerbes|inflation.pump|aruif/i,                    "Outdoors & Sports"],
  [/generator|inverter|hammer|gas.pipe|regulator|sanding.belt|ruwag|sunsign|sunny.sn/i,                                     "Tools & Hardware"],
  [/kettle|pots|cookware|washing|heater|blender|spiraliser|wine.opener|dispenser|dinner|bowl|dust.pan|moping|good.mama|redisson|lexuco|harwa|morphy|iron|facial|styling.comb|top.cooker|defy|condere|smart.life/i, "Home & Kitchen"],
];

function assignCategory(name: string): string {
  for (const [pattern, cat] of CATEGORY_RULES) {
    if (pattern.test(name)) return cat;
  }
  return "General";
}

async function main() {
  console.log("=".repeat(60));
  console.log("  SEED FROM CSV");
  console.log("=".repeat(60));

  const [tenant] = await db.select().from(tenants).where(eq(tenants.slug, TENANT_SLUG));
  if (!tenant) throw new Error(`Tenant '${TENANT_SLUG}' not found`);
  console.log(`\nTenant: ${tenant.name} (${tenant.id})`);

  console.log("\nDropping existing products and categories...");
  await db.delete(variants).where(eq(variants.tenantId, tenant.id));
  await db.delete(products).where(eq(products.tenantId, tenant.id));
  await db.delete(categories).where(eq(categories.tenantId, tenant.id));
  console.log("  Done.");

  const csvContent = fs.readFileSync(CSV_PATH, "utf-8");
  const items = parseCSV(csvContent);
  console.log(`\nParsed ${items.length} products from CSV`);

  const categoryNames = [
    "Electronics & TV",
    "Home & Kitchen",
    "Gaming",
    "Photography",
    "Outdoors & Sports",
    "Tools & Hardware",
    "Baby & Kids",
    "Furniture & Storage",
    "General",
  ];

  const categoryMap = new Map<string, string>();
  for (let i = 0; i < categoryNames.length; i++) {
    const name = categoryNames[i];
    const [cat] = await db
      .insert(categories)
      .values({ tenantId: tenant.id, name, slug: slugify(name), displayOrder: i })
      .returning();
    categoryMap.set(name, cat!.id);
  }
  console.log(`Created ${categoryNames.length} categories\n`);

  const seen = new Set<string>();
  let inserted = 0;
  let skipped = 0;

  for (const item of items) {
    let slug = slugify(item.name);
    if (seen.has(slug)) {
      console.log(`  [SKIP] ${item.name}`);
      skipped++;
      continue;
    }
    seen.add(slug);

    const catName = assignCategory(item.name);
    const categoryId = categoryMap.get(catName)!;

    const [prod] = await db.insert(products).values({
      tenantId: tenant.id,
      name: item.name,
      slug,
      imageUrl: item.imageUrl || null,
      categoryId,
      status: "active",
      featured: false,
    }).returning();

    await db.insert(variants).values({
      tenantId: tenant.id,
      productId: prod!.id,
      name: "Default",
      price: "0.00",
      stockQty: 0,
    });

    console.log(`  [${catName}] ${item.name}`);
    inserted++;
  }

  console.log(`\n${"=".repeat(60)}`);
  console.log(`  ${inserted} products inserted, ${skipped} duplicates skipped.`);
  console.log(`${"=".repeat(60)}\n`);

  await sql.end();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
